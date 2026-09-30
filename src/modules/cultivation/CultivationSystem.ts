import { System } from '../../ecs/System.ts';
import { ECSWorld } from '../../ecs/World.ts';
import { WorldMap } from '../world/WorldMap.ts';
import { QiGrid } from '../energy/QiGrid.ts';
import { REALM_CHAINS } from '../../config/realms.config.ts';
import { RACE_DEFINITIONS } from '../../config/races.config.ts';
import { EventBus } from '../../core/EventBus.ts';
import { TribulationSystem } from './TribulationSystem.ts';
import {
  PositionComponent,
  RealmComponent,
  HealthComponent,
  LifespanComponent,
  CharacterStateComponent,
  TraitsComponent,
  NameComponent,
  RaceComponent,
  CharacterHistoryComponent,
  SpiritualRootComponent,
  CultivationTechniqueComponent
} from '../beings/BeingComponents.ts';
import { TECHNIQUE_DEFINITIONS, MASTERY_CONFIGS } from '../../config/techniques.config.ts';
import {
  getEffectiveQiRateMultiplier,
  resolveEntityTraitEffects,
} from '../traits/TraitEffectResolver.ts';
import {
  ensureStatBaseline,
  getEntityPotential,
  rebuildEntityStats,
} from '../traits/DerivedStatsService.ts';
import { TalentProfileComponent } from '../talent/TalentComponents.ts';
import { emitGrowthEvent } from '../talent/GrowthEvents.ts';
import { getBreakthroughOutlook, failureCooldownDays } from './BreakthroughRules.ts';
import { TimeManager } from '../../core/TimeManager.ts';

export class CultivationSystem implements System {
  public name = 'CultivationSystem';
  public enabled = true;
  public priority = 25;

  private worldMap: WorldMap;
  private qiGrid: QiGrid;
  private tribulationSystem: TribulationSystem;
  private eventBus = EventBus.getInstance();
  private accumulator: number = 0;
  private worldRecordStages: Map<string, number> = new Map();
  private pendingTribulationsPassed: { entityId: number; targetStageName: string }[] = [];
  private pendingBreakthroughs: number[] = [];
  private unsubscribes: (() => void)[] = [];

  constructor(worldMap: WorldMap, qiGrid: QiGrid, tribulationSystem: TribulationSystem) {
    this.worldMap = worldMap;
    this.qiGrid = qiGrid;
    this.tribulationSystem = tribulationSystem;

    // Lắng nghe sự kiện vượt Lôi Kiếp thành công
    this.unsubscribes.push(
      this.eventBus.on<{ entityId: number; targetStageName: string }>('cultivation:tribulation_passed', (data) => {
        // Logic hoàn tất đại cảnh giới
        this.pendingTribulationsPassed.push(data);
      })
    );

    // Lắng nghe yêu cầu đột phá trực tiếp từ BehaviorTree AI
    this.unsubscribes.push(
      this.eventBus.on<{ entityId: number }>('cultivation:attempt_breakthrough', (data) => {
        this.pendingBreakthroughs.push(data.entityId);
      })
    );
  }

  public destroy(): void {
    for (const unsub of this.unsubscribes) {
      unsub();
    }
    this.unsubscribes = [];
  }

  /**
   * Đặt lại toàn bộ hàng đợi đột phá, vượt kiếp và kỷ lục tu vi của thế giới cũ.
   */
  public reset(): void {
    this.accumulator = 0;
    this.worldRecordStages.clear();
    this.pendingTribulationsPassed = [];
    this.pendingBreakthroughs = [];
  }

  public getPendingBreakthroughsCount(): number {
    return this.pendingBreakthroughs.length;
  }

  public getPendingTribulationsPassedCount(): number {
    return this.pendingTribulationsPassed.length;
  }

  public update(world: ECSWorld, dt: number): void {
    // 0. Xử lý các yêu cầu đột phá trực tiếp từ BehaviorTree
    if (this.pendingBreakthroughs.length > 0) {
      const breakthroughsToProcess = [...this.pendingBreakthroughs];
      this.pendingBreakthroughs = [];
      for (const entId of breakthroughsToProcess) {
        const realm = world.getComponent(entId, RealmComponent);
        const stateComp = world.getComponent(entId, CharacterStateComponent);
        const traits = world.getComponent(entId, TraitsComponent);
        const hp = world.getComponent(entId, HealthComponent);
        const name = world.getComponent(entId, NameComponent);
        if (realm && stateComp) {
          this.attemptBreakthrough(world, entId, realm, stateComp, traits, hp, name);
        }
      }
    }

    // 1. Xử lý các tu sĩ vừa vượt lôi kiếp thành công
    if (this.pendingTribulationsPassed.length > 0) {
      const tribulationsToProcess = [...this.pendingTribulationsPassed];
      this.pendingTribulationsPassed = [];
      for (const data of tribulationsToProcess) {
        this.completeMajorBreakthrough(world, data.entityId);
      }
    }

    this.accumulator += dt;
    if (this.accumulator < 0.2) return;
    const stepTime = this.accumulator;
    this.accumulator = 0;

    const cultivators = world.query([
      PositionComponent,
      RealmComponent,
      CharacterStateComponent,
      RaceComponent
    ]);

    for (const ent of cultivators) {
      const pos = world.getComponent(ent, PositionComponent)!;
      const realm = world.getComponent(ent, RealmComponent)!;
      const stateComp = world.getComponent(ent, CharacterStateComponent)!;
      const raceComp = world.getComponent(ent, RaceComponent)!;
      const traits = world.getComponent(ent, TraitsComponent);
      const hp = world.getComponent(ent, HealthComponent);
      const name = world.getComponent(ent, NameComponent);

      if (hp && hp.isDead) continue;

      realm.stageAgeDays += stepTime * TimeManager.TICKS_PER_SECOND / TimeManager.TICKS_PER_DAY;

      if (realm.breakthroughTimer > 0) {
        realm.breakthroughTimer = Math.max(0, realm.breakthroughTimer -
          stepTime * TimeManager.TICKS_PER_SECOND / TimeManager.TICKS_PER_DAY);
      }

      // 1. TÍCH LŨY LINH LỰC KHI ĐANG NGỒI THIỀN (Meditate)
      if (stateComp.state === 'meditate' && !realm.isBreakingThrough) {
        // Kiểm tra Linh Căn: Người chưa thức tỉnh (<12 tuổi) hoặc Vô Linh Căn không thể hấp thu linh khí!
        const rootComp = world.getComponent(ent, SpiritualRootComponent);
        if (rootComp && !rootComp.canCultivate()) {
          continue;
        }

        const tx = Math.floor(pos.x / this.worldMap.tileSize);
        const ty = Math.floor(pos.y / this.worldMap.tileSize);
        const qiTile = this.qiGrid.getTile(tx, ty);

        const raceDef = RACE_DEFINITIONS[raceComp.raceId] || RACE_DEFINITIONS['human'];
        const traitEffects = resolveEntityTraitEffects(world, ent);
        let qiAbsorptionMultiplier = getEffectiveQiRateMultiplier(
          world,
          ent,
          raceDef.baseStats.qiAbsorptionRate
        );
        if (qiAbsorptionMultiplier <= 0) {
          continue;
        }

        // Tác dụng của Công Pháp Tu Luyện & Tiến Hóa Độ Thông Thạo
        const techComp = world.getComponent(ent, CultivationTechniqueComponent);
        if (techComp) {
          const techDef = TECHNIQUE_DEFINITIONS[techComp.techniqueId];
          const techMult = (techDef?.baseModifiers.qiAbsorptionMultiplier ?? 1.2) * techComp.getMasteryMultiplier();
          qiAbsorptionMultiplier *= techMult;

          // Tu luyện tích lũy độ thông thạo công pháp theo thời gian (nhân với techniqueLearningFactor)
          const lvlResult = techComp.addMasteryExp(
            1.8 * stepTime * traitEffects.techniqueLearningFactor
          );
          if (lvlResult.leveledUp) {
            const masteryCfg = MASTERY_CONFIGS[techComp.masteryLevel];
            this.eventBus.emit('combat:floating_text', {
              entityId: ent,
              text: `✨ Công Pháp: ${masteryCfg.name}!`,
              color: masteryCfg.color,
              isCrit: true
            });
            const life = world.getComponent(ent, LifespanComponent);
            const history = world.getComponent(ent, CharacterHistoryComponent);
            if (history) {
              history.addRecord(
                life?.currentAge ?? 18,
                'breakthrough',
                `Công Pháp Đột Phá [${techComp.techniqueName} - ${masteryCfg.name}]`,
                `Khổ tu ngộ đạo, công pháp viên mãn tiến vào tầng thứ ${masteryCfg.name}. Uy lực và tốc độ tu luyện gia trì x${techComp.getMasteryMultiplier().toFixed(1)}.`
              );
            }
          }
        } else {
          // Chưa học công pháp: Thổ nạp bản năng nguyên thủy không có tâm pháp dẫn dắt, hiệu suất chỉ đạt 35%
          qiAbsorptionMultiplier *= 0.35;
        }

        const tileDensity = qiTile ? qiTile.density : 15;
        const qiGained = (tileDensity / 12) * qiAbsorptionMultiplier * stepTime;
        realm.currentQi = Math.min(realm.maxQi, realm.currentQi + qiGained);

        // 2. KHI ĐẠT 100% LINH LỰC -> THỬ ĐỘT PHÁ CẢNH GIỚI!
        if (realm.currentQi >= realm.maxQi) {
          this.attemptBreakthrough(world, ent, realm, stateComp, traits, hp, name);
        }
      }
    }
  }

  private attemptBreakthrough(
    world: ECSWorld,
    entityId: number,
    realm: RealmComponent,
    stateComp: CharacterStateComponent,
    _traits: TraitsComponent | undefined,
    hp: HealthComponent | undefined,
    name: NameComponent | undefined
  ): void {
    const chain = REALM_CHAINS[realm.realmChainId];
    if (!chain) return;

    const currentStage = chain.stages[realm.stageIndex];
    if (!currentStage) return;

    const outlook = getBreakthroughOutlook(world, entityId);
    if (!outlook.eligible) return;
    const raceId = world.getComponent(entityId, RaceComponent)?.raceId ?? 'human';

    realm.isBreakingThrough = true;
    stateComp.state = 'breakthrough';
    stateComp.stateTimer = 0;

    const subStages = currentStage.subStages || ['Sơ Kỳ'];
    const hasNextSubStage = realm.subStageIndex < subStages.length - 1;

    // A. TIỂU CẢNH GIỚI (Tầng nhỏ kế tiếp)
    if (hasNextSubStage) {
      if (world.hasComponent(entityId, TalentProfileComponent)) {
        getEntityPotential(world, entityId);
      }
      const traitEffects = resolveEntityTraitEffects(world, entityId);

      const techComp = world.getComponent(entityId, CultivationTechniqueComponent);
      const successChance = outlook.chance;
      realm.lastBreakthroughChance = successChance;

      const roll = Math.random();
      const life = world.getComponent(entityId, LifespanComponent);
      const history = world.getComponent(entityId, CharacterHistoryComponent);
      const curAge = life?.currentAge ?? 20;
      const tick = world.getCurrentTick();
      realm.breakthroughAttemptCounter = (realm.breakthroughAttemptCounter || 0) + 1;

      if (roll < successChance) {
        // ĐỘT PHÁ TIỂU CẢNH GIỚI THÀNH CÔNG!
        realm.subStageIndex++;
        realm.subStageName = subStages[realm.subStageIndex];
        realm.currentQi = 0;
        realm.maxQi = Math.floor(realm.maxQi * 1.35);
        realm.combatPower = Math.floor(realm.combatPower * 1.3);
        realm.isBreakingThrough = false;
        realm.breakthroughBonus = 0;
        realm.breakthroughTimer = 0;
        stateComp.state = 'idle';

        if (techComp) {
          techComp.addMasteryExp(35 * traitEffects.techniqueLearningFactor);
        }

        if (history) {
          history.addRecord(
            curAge,
            'breakthrough',
            `Đột Phá [${realm.stageName} - ${realm.subStageName}]`,
            `Linh lực dồi dào, tâm cảnh đốn ngộ, thuận lợi thăng cấp. Giới hạn linh lực đạt ${realm.maxQi}.`
          );
        }

        const targetKey = `${realm.realmChainId}:${realm.stageIndex}:${realm.subStageIndex}`;
        emitGrowthEvent({
          world,
          eventId: `bt_ok:${entityId}:${targetKey}:${realm.breakthroughAttemptCounter}`,
          entityId,
          kind: 'breakthrough_succeeded',
          tick,
          familyKey: `breakthrough:${realm.realmChainId}:${realm.stageIndex}`,
          milestoneKey: `bt:${targetKey}`,
          difficulty: 1.0,
          evidence: {
            realmTarget: targetKey,
            reasonText: `Đột phá ${realm.stageName} - ${realm.subStageName}`,
          },
        });
      } else {
        // ĐỘT PHÁ THẤT BẠI - TẨU HỎA NHẬP MA
        const targetSubIdx = realm.subStageIndex + 1;
        const targetKey = `${realm.realmChainId}:${realm.stageIndex}:${targetSubIdx}`;

        realm.currentQi = Math.floor(realm.maxQi * 0.4);
        realm.isBreakingThrough = false;
        realm.breakthroughBonus = 0;
        realm.breakthroughTimer = failureCooldownDays(raceId, realm.stageIndex, false);
        stateComp.state = 'idle';
        if (hp) {
          hp.current = Math.max(1, Math.floor(hp.current * (raceId === 'demon' ? 0.60 : 0.75)));
        }

        if (history) {
          history.addRecord(
            curAge,
            'breakthrough',
            `Xung Kích Thất Bại`,
            `Tâm ma quấy nhiễu, kinh mạch đảo nghịch, phản phệ hao tổn khí huyết.`
          );
        }

        emitGrowthEvent({
          world,
          eventId: `bt_fail:${entityId}:${targetKey}:${realm.breakthroughAttemptCounter}:${tick}`,
          entityId,
          kind: 'breakthrough_failed',
          tick,
          familyKey: `breakthrough_fail:${targetKey}`,
          difficulty: 1.0,
          evidence: {
            realmTarget: targetKey,
            reasonText: `Xung kích ${realm.stageName} - ${subStages[targetSubIdx] ?? 'tiểu cảnh giới'} thất bại`,
          },
        });
      }
    }
    // B. ĐẠI CẢNH GIỚI (Luyện Khí lên Trúc Cơ, Trúc Cơ lên Kim Đan, Kim Đan lên Nguyên Anh...)
    else {
      const nextStageIndex = realm.stageIndex + 1;
      if (nextStageIndex >= chain.stages.length) {
        // Đã đạt đỉnh cao cảnh giới
        realm.isBreakingThrough = false;
        stateComp.state = 'idle';
        return;
      }

      const nextStage = chain.stages[nextStageIndex];

      realm.lastBreakthroughChance = outlook.chance;
      realm.breakthroughAttemptCounter = (realm.breakthroughAttemptCounter || 0) + 1;
      if (Math.random() >= outlook.chance) {
        realm.currentQi = Math.floor(realm.maxQi * 0.35);
        realm.breakthroughBonus = 0;
        realm.breakthroughTimer = failureCooldownDays(raceId, realm.stageIndex, true);
        realm.isBreakingThrough = false;
        stateComp.state = 'idle';
        if (hp) hp.current = Math.max(1, Math.floor(hp.current * (raceId === 'demon' ? 0.55 : 0.70)));
        return;
      }

      if (nextStage.tribulationRequired) {
        // TRIỆU HỒI LÔI KIẾP THIÊN ĐẠO!
        const numStrikes = nextStageIndex >= 3 ? 6 : 3; // Kim Đan 3 tia, Nguyên Anh 6 tia
        this.tribulationSystem.startTribulation(entityId, nextStage.name, numStrikes, 1.6, name?.name);
      } else {
        // Đại cảnh giới không cần lôi kiếp (vd: Phàm nhân lên Luyện Khí)
        this.completeMajorBreakthrough(world, entityId);
      }
    }
  }

  public completeMajorBreakthrough(world: ECSWorld, entityId: number): void {
    const realm = world.getComponent(entityId, RealmComponent);
    const life = world.getComponent(entityId, LifespanComponent);
    const hp = world.getComponent(entityId, HealthComponent);
    const stateComp = world.getComponent(entityId, CharacterStateComponent);
    const name = world.getComponent(entityId, NameComponent);
    const raceComp = world.getComponent(entityId, RaceComponent);

    if (!realm) return;

    const chain = REALM_CHAINS[realm.realmChainId];
    if (!chain) return;

    // Đảm bảo StatBaselineComponent tồn tại ở cảnh giới cũ trước khi tăng stageIndex
    ensureStatBaseline(world, entityId);

    realm.stageIndex++;
    const newStage = chain.stages[realm.stageIndex];
    if (!newStage) return;

    const raceDef = raceComp ? (RACE_DEFINITIONS[raceComp.raceId] || RACE_DEFINITIONS['human']) : RACE_DEFINITIONS['human'];

    realm.stageName = newStage.name;
    realm.subStageIndex = 0;
    realm.stageAgeDays = 0;
    realm.subStageName = newStage.subStages ? newStage.subStages[0] : 'Sơ Kỳ';
    realm.currentQi = 0;

    // Giới hạn linh khí tăng gấp 5 lần mỗi đại cảnh giới
    realm.maxQi = Math.max(newStage.qiRequired,
      Math.floor(realm.maxQi * raceDef.baseStats.qiGrowthMultiplier));
    realm.combatPower = Math.floor(newStage.baseCombatPower * 1.5);
    realm.isBreakingThrough = false;
    realm.breakthroughBonus = 0;
    realm.breakthroughTimer = 0;

    if (stateComp) stateComp.state = 'idle';

    // Rebuild chỉ số từ baseline theo cảnh giới mới và các đặc điểm vừa mở khóa (Mục 9.5)
    rebuildEntityStats(world, entityId);

    // Hiệu ứng riêng của đột phá đại cảnh giới: hồi phục toàn bộ sinh lực đúng 1 lần sau rebuild
    if (hp && !hp.isDead) {
      hp.current = hp.max;
    }

    // Đốn ngộ đại cảnh giới bồi dưỡng công pháp tiến cảnh
    const techComp = world.getComponent(entityId, CultivationTechniqueComponent);
    if (techComp) {
      const traitEffects = resolveEntityTraitEffects(world, entityId);
      techComp.addMasteryExp(120 * traitEffects.techniqueLearningFactor);
    }

    // Nếu đại cảnh giới không có lôi kiếp (không phát tribulation_passed), phát breakthrough_succeeded
    if (!newStage.tribulationRequired) {
      const tick = world.getCurrentTick();
      realm.breakthroughAttemptCounter = (realm.breakthroughAttemptCounter || 0) + 1;
      const targetKey = `${realm.realmChainId}:${realm.stageIndex}:0`;
      emitGrowthEvent({
        world,
        eventId: `bt_major:${entityId}:${targetKey}:${realm.breakthroughAttemptCounter}`,
        entityId,
        kind: 'breakthrough_succeeded',
        tick,
        familyKey: `breakthrough:${realm.realmChainId}:${realm.stageIndex}`,
        milestoneKey: `bt:${targetKey}`,
        difficulty: 1.0,
        evidence: {
          realmTarget: targetKey,
          reasonText: `Đột phá đại cảnh giới ${newStage.name}`,
        },
      });
    }

    // Ghi biên niên sử cá nhân
    const history = world.getComponent(entityId, CharacterHistoryComponent);
    if (history) {
      history.addRecord(
        life?.currentAge ?? 20,
        'breakthrough',
        `🌟 Đăng Phong [${newStage.name}]`,
        `Thiên địa dị tượng giáng thế! Thoát thai hoán cốt, HP đạt ${hp?.max ?? 0}, linh khí cực hạn ${realm.maxQi}, thọ nguyên trường thọ đạt ${life?.maxLifespan ?? 0} tuổi!`
      );
    }

    // Chỉ ghi nhận khi đột phá cảnh giới tối cao hoặc phá vỡ kỷ lục cao nhất thiên hạ
    const isMaxInChain = realm.stageIndex === chain.stages.length - 1;
    const prevRecord = this.worldRecordStages.get(realm.realmChainId) ?? 1;
    const isNewWorldRecord = realm.stageIndex > prevRecord;

    if (isMaxInChain) {
      const statsStr = [
        hp ? `HP ${hp.max}` : '',
        realm.maxQi ? `Linh khí ${realm.maxQi}` : '',
        life ? `Thọ nguyên ${life.maxLifespan} năm` : ''
      ].filter(Boolean).join(', ');

      this.eventBus.emit('world:log', {
        type: 'highest_breakthrough',
        message: `👑 ĐỈNH PHONG CHỨNG ĐẠO! [${name?.name ?? 'Tu sĩ'}] chính thức đột phá cảnh giới tối cao [${newStage.name}]! ${statsStr ? `(${statsStr}), ` : ''}ngạo thị thiên hạ!`
      });
    } else if (isNewWorldRecord) {
      this.worldRecordStages.set(realm.realmChainId, realm.stageIndex);
      this.eventBus.emit('world:log', {
        type: 'highest_breakthrough',
        message: `🌟 THIÊN HẠ ĐỆ NHẤT CẢNH GIỚI: [${name?.name ?? 'Tu sĩ'}] phá vỡ gông cùm thiên địa, trở thành người đầu tiên đột phá đại cảnh giới [${newStage.name}] trong cõi hồng hoang!`
      });
    }
  }
}
