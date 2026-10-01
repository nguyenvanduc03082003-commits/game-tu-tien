import { maintainSocialAssistance, setCombatIntent } from '../../../combat/CombatIntentService.ts';
import { recordSocialTelemetry } from '../../../social/SocialSimulationTelemetry.ts';
import { residentPreferences } from '../ResidentPreferences.ts';
import { ECSWorld } from '../../../../ecs/World.ts';
import { WorldMap } from '../../../world/WorldMap.ts';
import { QiGrid } from '../../../energy/QiGrid.ts';
import { WeatherType } from '../../../weather/WeatherTypes.ts';
import {
  PositionComponent,
  HealthComponent,
  HungerComponent,
  RealmComponent,
  LifespanComponent,
  SpiritualRootComponent,
  CultivationTechniqueComponent,
  MortalNeedsComponent,
  DailyScheduleComponent,
  ChildcareComponent,
  TraitsComponent,
  RaceComponent,
  CorpseComponent
} from '../../../beings/BeingComponents.ts';
import { CombatStatsComponent } from '../../../combat/CombatComponents.ts';
import {
  AIStrategicBrainComponent,
  AIPlannerComponent,
  GodDecreeComponent,
  StrategicGoalType
} from '../AIComponents.ts';
import { evaluateSocialAssistance } from '../../../social/SocialDecisionService.ts';
import { SocialRelationshipComponent } from '../../../social/SocialComponents.ts';
import { FoundingIntentComponent } from '../../../factions/FactionComponents.ts';
import { CommunityTaskBoard } from '../../community/CommunityTaskBoard.ts';
import { SmartObjectManager } from '../../smartobjects/SmartObjectManager.ts';
import { TimeManager } from '../../../../core/TimeManager.ts';
import { GrowthMindComponent } from '../../../talent/TalentComponents.ts';
import { computeReflectGoalUtility } from '../../../talent/MentalStateSystem.ts';
import { getBreakthroughOutlook } from '../../../cultivation/BreakthroughRules.ts';
import { ProfessionComponent } from '../../../professions/ProfessionComponents.ts';
import { PROFESSIONS_BY_ID } from '../../../../config/professions.config.ts';
import { professionWorkBlockedReason } from '../../../professions/ProfessionService.ts';

export class StrategicGoalEvaluator {
  /**
   * Tính toán điểm Utility (0 - 100) theo mô hình Utility AI (Infinite Axis Utility System)
   * Kết hợp Nhu cầu sinh học + Bảng việc cộng đồng + Khả năng tương tác Smart Objects + Hysteresis
   */
  public static evaluate(
    world: ECSWorld,
    entity: number,
    brain: AIStrategicBrainComponent,
    _worldMap: WorldMap,
    _qiGrid: QiGrid,
    currentWeather: WeatherType,
    timeOfDay: number
  ): void {
    const pos = world.getComponent(entity, PositionComponent);
    const hp = world.getComponent(entity, HealthComponent);
    const hunger = world.getComponent(entity, HungerComponent);
    const realm = world.getComponent(entity, RealmComponent);
    const life = world.getComponent(entity, LifespanComponent);
    const root = world.getComponent(entity, SpiritualRootComponent);
    const tech = world.getComponent(entity, CultivationTechniqueComponent);
    const needs = world.getComponent(entity, MortalNeedsComponent);
    const schedule = world.getComponent(entity, DailyScheduleComponent);
    const childcare = world.getComponent(entity, ChildcareComponent);
    const combat = world.getComponent(entity, CombatStatsComponent);
    const traits = world.getComponent(entity, TraitsComponent);
    const godDecree = world.getComponent(entity, GodDecreeComponent);
    const race = world.getComponent(entity, RaceComponent);

    if (!pos || (hp && hp.isDead)) return;

    const isBeast = race?.raceId === 'beast';

    const scores = brain.utilityScores;

    // Reset scores
    scores.OBEY_DECREE = 0;
    scores.BREAKTHROUGH = 0;
    scores.SECLUDED_CULTIVATION = 0;
    scores.SURVIVE_VITAL = 0;
    scores.COMBAT_DEFENSE = 0;
    scores.FLEE_DANGER = 0;
    scores.LABOUR_WORK = 0;
    scores.SOCIAL_RECREATE = 0;
    scores.BURY_KIN = 0;
    scores.REFLECT_RECOVER = 0;
    brain.targetCorpseEntityId = null;

    // Điểm dạo bước tự nhiên
    if (isBeast) {
      scores.WANDER_SERENDIPITY = tech ? 40 : 50;
    } else if (race?.raceId === 'demon') {
      scores.WANDER_SERENDIPITY = 35;
    } else {
      scores.WANDER_SERENDIPITY = 20;
    }

    // =========================================================================
    // 1. THÁNH CHỈ THẦN LINH (OBEY_DECREE) - ƯU TIÊN TUYỆT ĐỐI (100 ĐIỂM)
    // =========================================================================
    if (godDecree || brain.activeDecree) {
      scores.OBEY_DECREE = 100;
    }

    // =========================================================================
    // 2. TỰ VỆ & HUYẾT CHIẾN HOẶC BỎ CHẠY THOÁT HIỂM (COMBAT / FLEE)
    // =========================================================================
    maintainSocialAssistance(world, entity);
    if (combat && combat.targetEntityId !== null) {
      const targetHp = world.getComponent(combat.targetEntityId, HealthComponent);
      if (targetHp && !targetHp.isDead && Number.isFinite(targetHp.current) && targetHp.current > 0 &&
          world.hasComponent(combat.targetEntityId, PositionComponent)) {
        if (hp && hp.current < hp.max * 0.25) {
          scores.FLEE_DANGER = 96;
        } else {
          scores.COMBAT_DEFENSE = 88;
        }
      } else {
        combat.targetEntityId = null;
      }
    }

    // 2C. CỨU VIỆN ĐẠO LỮ / SƯ TÔN / TRI KỶ
    if (scores.COMBAT_DEFENSE < 80 && scores.FLEE_DANGER < 80) {
      const relComp = world.getComponent(entity, SocialRelationshipComponent);
      if (relComp && pos) {
        for (const rel of relComp.relationships.values()) {
          // Ordinary contacts are not voluntary-assistance candidates. Avoid
          // filling debug telemetry with a rejection on every utility scan.
          if (!['dao_companion', 'master', 'disciple', 'sworn_brother'].includes(rel.relationType) ||
              rel.bond?.status === 'ended') continue;
          const assistance = evaluateSocialAssistance(world, entity, rel.targetEntityId);
          recordSocialTelemetry(world, 'assistance', assistance.status, entity, rel.targetEntityId, assistance.status === 'rejected' ? assistance.reason : undefined);
          if (assistance.status === 'eligible' && combat) {
            setCombatIntent(world, entity, assistance.enemyId, 'social_assistance', rel.targetEntityId);
            recordSocialTelemetry(world, 'assistance', 'chosen', entity, rel.targetEntityId);
            scores.COMBAT_DEFENSE = 94;
            break;
          }
        }
      }
    }

    // 2D. CHÔN CẤT NGƯỜI THÂN KHI PHÁT HIỆN THI HÀI
    if (scores.COMBAT_DEFENSE < 85 && scores.FLEE_DANGER < 85) {
      const relComp = world.getComponent(entity, SocialRelationshipComponent);
      if (relComp && pos) {
        const corpses = world.query([PositionComponent, CorpseComponent]);
        for (const cEnt of corpses) {
          const corpse = world.getComponent(cEnt, CorpseComponent)!;
          if (corpse.isBeingCarried && corpse.carriedByEntityId !== entity) continue;

          const rel = relComp.getRelationship(cEnt);
          const isKin = rel && (
            (rel.relationType === 'dao_companion' && (!rel.bond || rel.bond.endReason === 'death')) ||
            rel.relationType === 'kin_parent' ||
            rel.relationType === 'kin_child' ||
            (rel.relationType === 'sworn_brother' && (!rel.bond || rel.bond.endReason === 'death')) ||
            rel.affinity >= 60
          );

          if (isKin) {
            const cPos = world.getComponent(cEnt, PositionComponent)!;
            const dist = Math.hypot(cPos.x - pos.x, cPos.y - pos.y);
            if (dist <= 220) {
              scores.BURY_KIN = 93;
              brain.targetCorpseEntityId = cEnt;
              break;
            }
          }
        }
      }
    }

    // =========================================================================
    // 3. SINH TỒN CẤP THIẾT (SURVIVE_VITAL)
    // =========================================================================
    let vitalUrgency = 0;

    // A. Thời tiết khắc nghiệt
    const isSevereWeather = currentWeather === WeatherType.THUNDERSTORM || currentWeather === WeatherType.SNOW;
    if (isSevereWeather) {
      vitalUrgency = Math.max(vitalUrgency, 85);
    }

    // B. Khát nước
    if (needs) {
      if (needs.thirst < 20) {
        vitalUrgency = Math.max(vitalUrgency, 92);
      } else if (needs.thirst < 35) {
        vitalUrgency = Math.max(vitalUrgency, 65 + (35 - needs.thirst) * 1.5);
      }
    }

    // C. Đói cào ruột
    if (hunger) {
      if (isBeast) {
        if (hunger.current < 25) {
          vitalUrgency = Math.max(vitalUrgency, 92);
        } else if (hunger.current < 65) {
          vitalUrgency = Math.max(vitalUrgency, 60 + (65 - hunger.current) * 0.8);
        }
      } else {
        if (hunger.current < 20) {
          vitalUrgency = Math.max(vitalUrgency, 92);
        } else if (hunger.current < 45) {
          vitalUrgency = Math.max(vitalUrgency, 60 + (45 - hunger.current) * 1.1);
        }
      }
    }

    // D. Kiệt sức / Đến giờ ngủ ban đêm
    if (needs) {
      const adjustedTime = schedule ? (timeOfDay + schedule.chronotypeOffset + 1.0) % 1.0 : timeOfDay;
      const isNight = adjustedTime >= 0.84 || adjustedTime <= 0.16;
      if (needs.sleep < 20 || isNight) {
        vitalUrgency = Math.max(vitalUrgency, needs.sleep < 20 ? 86 : 78);
      }
    }

    scores.SURVIVE_VITAL = vitalUrgency;

    // =========================================================================
    // 4. ĐỘT PHÁ CẢNH GIỚI (BREAKTHROUGH)
    // =========================================================================
    if (realm) {
      if (realm.isBreakingThrough) {
        scores.BREAKTHROUGH = 99;
      } else if (getBreakthroughOutlook(world, entity).eligible) {
        let btScore = 95; // Rất cao: Khát khao phá vỡ bình cảnh!
        if (life && life.isElderly) btScore += 4;
        if (traits && traits.innateTraits.includes('tu_luyen_cuong')) btScore += 3;
        scores.BREAKTHROUGH = btScore;
      }
    }

    // =========================================================================
    // 5. BẾ QUAN TU LUYỆN (SECLUDED_CULTIVATION)
    // =========================================================================
    if (root && root.canCultivate() && root.rootType !== 'none' && realm && realm.currentQi < realm.maxQi) {
      const qiDeficitRatio = 1.0 - (realm.currentQi / realm.maxQi);
      let cultScore = (isBeast ? 40 : 50) + qiDeficitRatio * 28;

      if (root.rootType === 'heaven') cultScore += 12;
      else if (root.rootType === 'earth') cultScore += 8;
      else if (root.rootType === 'true') cultScore += 4;

      if (tech) cultScore += 6;

      // Nếu đang ở gần Smart Object Linh Mạch hoặc Động Phủ
      const smartMgr = SmartObjectManager.getInstance();
      const cave = smartMgr.findBestAvailableObject({ x: pos.x, y: pos.y }, 'cultivate_qi', 180);
      if (cave) cultScore += 10;

      scores.SECLUDED_CULTIVATION = Math.min(isBeast ? 65 : 86, cultScore);
    }

    // =========================================================================
    // 6. LAO ĐỘNG DÂN SINH, SÁNG LẬP THÔN/TÔNG & BẢNG VIỆC CỘNG ĐỒNG (LABOUR_WORK)
    // =========================================================================
    const taskBoard = CommunityTaskBoard.getInstance();
    const myTask = taskBoard.getEntityTask(entity);
    const foundingIntent = world.getComponent(entity, FoundingIntentComponent);
    const hasFoundingWork =
      (!childcare || !childcare.isChild) &&
      ((myTask && (myTask.type === 'found_campfire' || myTask.type === 'found_sect_hall' || !!myTask.foundingIntentId)) ||
        (foundingIntent && (foundingIntent.stage === 'preparing' || foundingIntent.stage === 'building')));

    let professionShift = false;
    if (hasFoundingWork) {
      scores.LABOUR_WORK = 84.5;
    } else if (!isBeast && schedule && (!childcare || !childcare.isChild)) {
      const adjustedTime = (timeOfDay + schedule.chronotypeOffset + 1.0) % 1.0;
      const isWorkHours = adjustedTime >= 0.20 && adjustedTime < 0.70;

      if (myTask) {
        // Đang đảm nhận một công việc cộng đồng -> Giữ vững điểm cao
        scores.LABOUR_WORK = Math.max(78, myTask.priority);
      } else if (isWorkHours) {
        let workScore = 65;
        if (schedule.preferredJob === 'builder') workScore += 8;
        if (schedule.preferredJob === 'farmer') workScore += 6;
        scores.LABOUR_WORK = workScore;
        const career = world.getComponent(entity, ProfessionComponent);
        const occupation = career?.professionId ? PROFESSIONS_BY_ID.get(career.professionId) : undefined;
        // A short morning shift leaves the rest of the day for cultivation and vital needs.
        if (occupation?.recipe && career?.workplaceId != null && adjustedTime >= 0.25 && adjustedTime < 0.40 &&
            !professionWorkBlockedReason(world, entity, occupation, career.workplaceId, _worldMap)) {
          professionShift = true;
          scores.LABOUR_WORK = Math.max(workScore, 78);
          scores.SECLUDED_CULTIVATION = Math.min(scores.SECLUDED_CULTIVATION, 65);
        }
      }
    } else if ((!childcare || !childcare.isChild) && myTask) {
      scores.LABOUR_WORK = Math.max(78, myTask.priority);
    }

    // =========================================================================
    // 7. GIAO LƯU, NGHỈ DƯỠNG & CHĂM SÓC HÀI ĐỒNG (SOCIAL_RECREATE)
    // =========================================================================
    if (childcare?.isChild) {
      scores.SOCIAL_RECREATE = 72;
    } else if (!isBeast) {
      let socialScore = 0;
      if (schedule) {
        const adjustedTime = (timeOfDay + schedule.chronotypeOffset + 1.0) % 1.0;
        const isEvening = adjustedTime >= 0.70 && adjustedTime < 0.84;
        if (isEvening) socialScore = 60; // Buổi tối tụ tập quanh lửa trại
      }
      if (needs && needs.recreation < 40) {
        socialScore = Math.max(socialScore, 62 + (40 - needs.recreation) * 0.9);
      }
      const relComp = world.getComponent(entity, SocialRelationshipComponent);
      if (relComp && relComp.relationships.size > 0) {
        socialScore += Math.min(15, relComp.relationships.size * 3);
      }
      scores.SOCIAL_RECREATE = socialScore;
    }

    // =========================================================================
    // 8. SUY NGẪM & HÓA GIẢI BIẾN CỐ (REFLECT_RECOVER) - Mục 11.4 & 12.3
    // =========================================================================
    const growth = world.getComponent(entity, GrowthMindComponent);
    const currentDay = TimeManager.getInstance().getDate().totalDays;
    if (scores.COMBAT_DEFENSE < 80 && scores.FLEE_DANGER < 80 && scores.SURVIVE_VITAL < 80) {
      scores.REFLECT_RECOVER = computeReflectGoalUtility(world, entity, currentDay);
    }
    if (growth && growth.mentalState < -40 && !childcare?.isChild) {
      scores.SOCIAL_RECREATE = Math.max(scores.SOCIAL_RECREATE, 65);
    }

    // =========================================================================
    // TÌM MỤC TIÊU CÓ ĐIỂM UTILITY CAO NHẤT (KÈM HYSTERESIS CHỐNG GIẬT CỤC)
    // =========================================================================
    if (!isBeast) {
      const preferences = residentPreferences(entity, world);
      scores.LABOUR_WORK *= 0.85 + preferences.diligence * 0.3;
      scores.SOCIAL_RECREATE *= 0.85 + preferences.sociability * 0.3;
      scores.SECLUDED_CULTIVATION *= 0.85 + preferences.ambition * 0.3;
      scores.WANDER_SERENDIPITY += preferences.curiosity * 35;
      for (const goal of ['LABOUR_WORK', 'SOCIAL_RECREATE', 'SECLUDED_CULTIVATION', 'WANDER_SERENDIPITY'] as const) {
        scores[goal] = Math.min(84, scores[goal]);
      }
    }

    if (hasFoundingWork) {
      scores.LABOUR_WORK = 84.5;
    }

    const workPlan = world.getComponent(entity, AIPlannerComponent);
    const finishingProfession = workPlan?.planStatus === 'executing' && workPlan.currentPlanGoal === 'LABOUR_WORK' &&
      workPlan.steps.slice(workPlan.currentStepIndex).some(step => !!step.customData?.professionId || step.customData?.carcassId !== undefined);
    if (!hasFoundingWork && (professionShift || finishingProfession)) {
      scores.LABOUR_WORK = 84;
      scores.SECLUDED_CULTIVATION = Math.min(scores.SECLUDED_CULTIVATION, 65);
    }

    // First find the true maximum, then apply hysteresis once against the incumbent.
    let highestGoal = brain.currentGoal;
    for (const goal of Object.keys(scores) as StrategicGoalType[]) {
      if (scores[goal] > scores[highestGoal]) highestGoal = goal;
    }
    const urgent = scores.OBEY_DECREE >= 90 || scores.FLEE_DANGER >= 90 ||
      scores.SURVIVE_VITAL >= 85 || scores.COMBAT_DEFENSE >= 85 || scores.BREAKTHROUGH >= 90 ||
      Boolean(hasFoundingWork && highestGoal === 'LABOUR_WORK');
    if (!urgent && scores[highestGoal] <= scores[brain.currentGoal] + 10) {
      highestGoal = brain.currentGoal;
    }

    brain.currentGoal = highestGoal;
    brain.goalReason = hasFoundingWork && highestGoal === 'LABOUR_WORK'
      ? (foundingIntent?.reason ?? 'Đang khởi dựng cơ nghiệp lập thôn/khai tông')
      : `Utility: ${Math.round(scores[highestGoal])}/100 [${highestGoal}]`;
  }
}
