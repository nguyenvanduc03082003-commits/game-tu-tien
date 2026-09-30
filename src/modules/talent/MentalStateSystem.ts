import type { System } from '../../ecs/System.ts';
import { ECSWorld } from '../../ecs/World.ts';
import { TimeManager } from '../../core/TimeManager.ts';
import { MENTAL_STATE_CONFIG } from '../../config/mental-growth.config.ts';
import {
  CharacterHistoryComponent,
  CharacterStateComponent,
  HealthComponent,
  HungerComponent,
  LifespanComponent,
  MortalNeedsComponent,
} from '../beings/BeingComponents.ts';
import { CombatStatsComponent } from '../combat/CombatComponents.ts';
import { isActiveBondBetween, isLivingSocialParticipant } from '../social/RelationshipRules.ts';
import { SocialRelationshipComponent } from '../social/SocialComponents.ts';
import { ResidenceComponent } from '../factions/FactionComponents.ts';
import {
  ExperienceRecord,
  GrowthMindComponent,
  TalentProfileComponent,
} from './TalentComponents.ts';
import { clampFinite, scoreFromXp } from './PotentialCalculator.ts';
import { resolveEntityTraitEffects } from '../traits/TraitEffectResolver.ts';
import {
  calculateRemainingExperiencePressure,
  isEntityEligibleForGrowth,
} from './GrowthSystem.ts';
import { emitGrowthEvent } from './GrowthEvents.ts';

/**
 * Tính áp lực ký ức từ top 5 ExperienceRecord có trị tuyệt đối lớn nhất (mục 11.2):
 * pressure(record, day) = emotion * 2^(-(day - createdDay) / halfLifeDays)
 * memoryPressure = clamp(sum(top 5 pressures by absolute value), -70, 30)
 */
export function calculateMemoryPressure(
  growth: GrowthMindComponent,
  currentDay: number
): number {
  if (!growth.experiences || growth.experiences.length === 0) return 0;

  const pressures = growth.experiences.map(exp => ({
    id: exp.id,
    val: calculateRemainingExperiencePressure(exp, currentDay),
  }));

  pressures.sort((a, b) => {
    const absDiff = Math.abs(b.val) - Math.abs(a.val);
    if (Math.abs(absDiff) > 1e-9) return absDiff;
    return a.id.localeCompare(b.id);
  });

  const topK = pressures.slice(0, MENTAL_STATE_CONFIG.memoryPressureTopK);
  const sum = topK.reduce((acc, item) => acc + item.val, 0);

  return clampFinite(
    sum,
    MENTAL_STATE_CONFIG.memoryPressureMin,
    MENTAL_STATE_CONFIG.memoryPressureMax,
    0
  );
}

/**
 * Tính điểm cân bằng cảm xúc target (mục 11.1):
 * target = clamp(
 *     0.2 * mindset
 *   + traitMentalBias
 *   + needsPressure
 *   + relationshipSupport
 *   + environmentSupport
 *   + memoryPressure,
 *   -100, 100)
 */
export function computeEntityMentalTarget(
  world: ECSWorld,
  entityId: number,
  currentDay: number
): number {
  const growth = world.getComponent(entityId, GrowthMindComponent);
  if (!growth) return 0;

  const mindsetScore = scoreFromXp(growth.mindsetXp);
  const effects = resolveEntityTraitEffects(world, entityId);
  const traitMentalBias = clampFinite(effects.mentalEquilibriumBias, -20, 20, 0);

  // Nhu cầu đói/khát/ngủ nguy cấp đóng góp tối đa -20 tổng
  let needsPenalty = 0;
  const hunger = world.getComponent(entityId, HungerComponent);
  const needs = world.getComponent(entityId, MortalNeedsComponent);
  if (hunger && hunger.current < 25) {
    needsPenalty -= ((25 - hunger.current) / 25) * 8;
  }
  if (needs) {
    if (needs.thirst < 25) {
      needsPenalty -= ((25 - needs.thirst) / 25) * 8;
    }
    if (needs.sleep < 20) {
      needsPenalty -= ((20 - needs.sleep) / 20) * 6;
    }
  }
  const needsPressure = clampFinite(
    needsPenalty,
    MENTAL_STATE_CONFIG.needsUrgentPenaltyCap,
    0,
    0
  );

  // Quan hệ hỗ trợ +0..10 (không có đồng bạn thì bằng 0, không phạt âm)
  let relationshipSupport = 0;
  const relComp = world.getComponent(entityId, SocialRelationshipComponent);
  if (relComp && relComp.relationships.size > 0) {
    let posSupport = 0;
    for (const rel of relComp.relationships.values()) {
      if (!isLivingSocialParticipant(world, rel.targetEntityId) || rel.bond?.status === 'ended') continue;
      const special = ['dao_companion', 'master', 'disciple', 'sworn_brother', 'kin_parent', 'kin_child'].includes(rel.relationType);
      if (special && !isActiveBondBetween(world, entityId, rel.targetEntityId, rel.relationType)) continue;
      if (rel.affinity >= 50) {
        posSupport +=
          rel.relationType === 'dao_companion' ||
          rel.relationType === 'kin_parent' ||
          rel.relationType === 'kin_child' ||
          rel.relationType === 'sworn_brother'
            ? 3
            : 1.5;
      }
    }
    relationshipSupport = clampFinite(
      posSupport,
      0,
      MENTAL_STATE_CONFIG.relationshipSupportMax,
      0
    );
  }

  // Môi trường an toàn/tĩnh lặng +5 nếu đang ở nơi cư trú/thiền định và không bị truy sát
  const combat = world.getComponent(entityId, CombatStatsComponent);
  const stateComp = world.getComponent(entityId, CharacterStateComponent);
  const hasResidence = world.hasComponent(entityId, ResidenceComponent);
  const inCombat = Boolean(combat && combat.targetEntityId !== null);
  const isQuiet =
    !inCombat &&
    (hasResidence ||
      stateComp?.state === 'meditate' ||
      stateComp?.state === 'sleep' ||
      stateComp?.state === 'recreate');
  const environmentSupport = isQuiet ? MENTAL_STATE_CONFIG.safeEnvironmentSupport : 0;

  const memoryPressure = calculateMemoryPressure(growth, currentDay);

  const rawTarget =
    MENTAL_STATE_CONFIG.mindsetEquilibriumWeight * mindsetScore +
    traitMentalBias +
    needsPressure +
    relationshipSupport +
    environmentSupport +
    memoryPressure;

  return clampFinite(
    rawTarget,
    MENTAL_STATE_CONFIG.min,
    MENTAL_STATE_CONFIG.max,
    0
  );
}

/**
 * Tích phân trạng thái cảm xúc theo từng ngày mô phỏng (mục 11.1):
 * tauDays = clamp(7 / recoveryFactor, 2, 30)
 * alpha = 1 - exp(-1 / tauDays) cho mỗi ngày
 * Đảm bảo 1x và 50x đi qua cùng số ngày cho ra cùng kết quả, không bao giờ vọt qua [-100, 100].
 */
export function integrateEntityMentalStateStep(
  world: ECSWorld,
  entityId: number,
  day: number,
  elapsedDays: number = 1
): number {
  const growth = world.getComponent(entityId, GrowthMindComponent);
  if (!growth || elapsedDays <= 0) return growth?.mentalState ?? 0;

  const effects = resolveEntityTraitEffects(world, entityId);
  const recoveryFactor = clampFinite(
    1.0 + effects.mentalRecoveryBonus,
    MENTAL_STATE_CONFIG.recoveryFactorMin,
    MENTAL_STATE_CONFIG.recoveryFactorMax,
    1.0
  );
  const tauDays = clampFinite(
    MENTAL_STATE_CONFIG.baseTauDays / recoveryFactor,
    MENTAL_STATE_CONFIG.tauDaysMin,
    MENTAL_STATE_CONFIG.tauDaysMax,
    MENTAL_STATE_CONFIG.baseTauDays
  );

  const fullDays = Math.floor(elapsedDays);
  const remDays = elapsedDays - fullDays;

  for (let i = 0; i < fullDays; i++) {
    const stepDay = day - (fullDays - 1 - i);
    const target = computeEntityMentalTarget(world, entityId, stepDay);
    const alpha = 1 - Math.exp(-1 / tauDays);
    growth.mentalState = clampFinite(
      Math.round((growth.mentalState + (target - growth.mentalState) * alpha) * 1e6) / 1e6,
      MENTAL_STATE_CONFIG.min,
      MENTAL_STATE_CONFIG.max,
      0
    );
  }

  if (remDays > 1e-6) {
    const target = computeEntityMentalTarget(world, entityId, day);
    const alpha = 1 - Math.exp(-remDays / tauDays);
    growth.mentalState = clampFinite(
      Math.round((growth.mentalState + (target - growth.mentalState) * alpha) * 1e6) / 1e6,
      MENTAL_STATE_CONFIG.min,
      MENTAL_STATE_CONFIG.max,
      0
    );
  }

  growth.markDirty();
  return growth.mentalState;
}

/**
 * Lấy danh sách ExperienceRecord đã sẵn sàng để suy ngẫm (mục 11.3 & 12.3):
 * Sắp theo: lockedByStep ưu tiên -> severity giảm dần -> createdDay tăng dần -> ID tăng dần.
 */
export function getReadyExperiencesForReflection(
  growth: GrowthMindComponent,
  currentDay: number
): ExperienceRecord[] {
  if (!growth.experiences || growth.experiences.length === 0) return [];

  const ready = growth.experiences.filter(
    exp =>
      !exp.growthAwarded &&
      exp.resolvedAtDay === undefined &&
      exp.requiredReflectionDays > 0 &&
      currentDay >= exp.readyForReflectionAtDay
  );

  ready.sort((a, b) => {
    if (Boolean(a.lockedByStep) !== Boolean(b.lockedByStep)) {
      return a.lockedByStep ? -1 : 1;
    }
    if (b.severity !== a.severity) {
      return b.severity - a.severity;
    }
    if (a.createdDay !== b.createdDay) {
      return a.createdDay - b.createdDay;
    }
    return a.id.localeCompare(b.id);
  });

  return ready;
}

/**
 * Tính điểm Utility cho mục tiêu REFLECT_RECOVER (mục 12.3):
 * reflectScore = clamp(25 + max(0, -mentalState)*0.5 + min(15, unprocessedCount*3), 0, 75)
 */
export function computeReflectGoalUtility(
  world: ECSWorld,
  entityId: number,
  currentDay: number
): number {
  if (!isEntityEligibleForGrowth(world, entityId)) return 0;

  const growth = world.getComponent(entityId, GrowthMindComponent);
  if (!growth) return 0;

  const ready = getReadyExperiencesForReflection(growth, currentDay);
  if (ready.length === 0) return 0;

  const score =
    25 +
    Math.max(0, -growth.mentalState) * 0.5 +
    Math.min(15, ready.length * 3);

  return clampFinite(score, 0, 75, 0);
}

/**
 * Hoàn tất 1 ngày suy ngẫm yên tĩnh cho ExperienceRecord (mục 11.3):
 * - Mỗi phiên đủ 1 ngày mô phỏng tăng reflectionDays tối đa +1.
 * - Khi reflectionDays >= requiredReflectionDays:
 *   + Giảm emotion còn 40% (không xóa trắng về 0).
 *   + Đánh dấu resolvedAtDay, bỏ khóa lockedByStep.
 *   + Ghi lịch sử "Đã dần hóa giải..." (không dùng câu "đã quên người thân").
 *   + Phát sự kiện reflection_completed đúng 1 lần.
 */
export function completeReflectionSessionDay(
  world: ECSWorld,
  entityId: number,
  experienceId: string | undefined,
  currentTick: number,
  planRevision: number,
  stepIndex: number
): { progressed: boolean; resolved: boolean } {
  const growth = world.getComponent(entityId, GrowthMindComponent);
  if (!growth) return { progressed: false, resolved: false };

  const currentDay = Math.max(0, world.calendarDayFloorAtTick(currentTick));
  let exp: ExperienceRecord | undefined;

  if (experienceId) {
    exp = growth.experiences.find(e => e.id === experienceId);
  }
  if (!exp) {
    const ready = getReadyExperiencesForReflection(growth, currentDay);
    exp = ready[0];
  }

  if (
    !exp ||
    exp.growthAwarded ||
    exp.resolvedAtDay !== undefined ||
    currentDay < exp.readyForReflectionAtDay
  ) {
    return { progressed: false, resolved: false };
  }

  exp.reflectionDays = Math.min(exp.requiredReflectionDays, exp.reflectionDays + 1);
  growth.markDirty();

  if (exp.reflectionDays >= exp.requiredReflectionDays) {
    exp.emotion =
      Math.round(
        exp.emotion * MENTAL_STATE_CONFIG.resolvedEmotionRetentionRatio * 100
      ) / 100;
    exp.resolvedAtDay = currentDay;
    exp.lockedByStep = false;

    const history = world.getComponent(entityId, CharacterHistoryComponent);
    const life = world.getComponent(entityId, LifespanComponent);
    if (history) {
      history.addRecord(
        life?.currentAge ?? 20,
        'miracle',
        '🧘 Đạo Tâm Thông Suốt',
        `Đã dần hóa giải khúc mắc trong lòng (${exp.reason ?? exp.kind}), tâm cảnh thêm phần vững chãi.`
      );
    }

    const familyKey =
      exp.kind === 'bereavement'
        ? `reflect:bereavement:${exp.id}`
        : `reflect:${exp.kind}`;

    emitGrowthEvent({
      world,
      eventId: `reflect_done:${entityId}:${exp.id}`,
      entityId,
      kind: 'reflection_completed',
      tick: currentTick,
      familyKey,
      difficulty: 1.0,
      evidence: {
        experienceId: exp.id,
        planRevision,
        stepIndex,
        durationTicks: TimeManager.TICKS_PER_DAY,
        reasonText: `Đã dần hóa giải biến cố (${exp.kind})`,
      },
    });

    return { progressed: true, resolved: true };
  }

  return { progressed: true, resolved: false };
}

export class MentalStateSystem implements System {
  public name = 'MentalStateSystem';
  public enabled = true;
  public priority = 18.5;

  public reset(): void {
    // Trạng thái tích phân lưu trên từng GrowthMindComponent.lastIntegratedTick
  }

  public update(world: ECSWorld, _dt: number): void {
    const currentTick = world.getCurrentTick();
    const currentDay = world.calendarDayFloorAtTick(currentTick);

    const entities = world.query([
      HealthComponent,
      GrowthMindComponent,
      TalentProfileComponent,
    ]);

    for (const ent of entities) {
      const hp = world.getComponent(ent, HealthComponent)!;
      if (hp.isDead || hp.current <= 0) continue;

      const growth = world.getComponent(ent, GrowthMindComponent)!;
      if (currentTick < growth.lastIntegratedTick) {
        growth.lastIntegratedTick = currentTick;
        continue;
      }

      const lastDay = world.calendarDayFloorAtTick(growth.lastIntegratedTick);
      const elapsedDays = currentDay - lastDay;

      if (elapsedDays >= 1) {
        integrateEntityMentalStateStep(world, ent, currentDay, elapsedDays);
        growth.lastIntegratedTick = currentTick;
      }
    }
  }
}
