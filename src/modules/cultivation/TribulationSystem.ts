import { System } from '../../ecs/System.ts';
import { ECSWorld } from '../../ecs/World.ts';
import { EventBus } from '../../core/EventBus.ts';
import {
  PositionComponent,
  HealthComponent,
  RealmComponent,
  CharacterStateComponent,
} from '../beings/BeingComponents.ts';
import { GrowthMindComponent } from '../talent/TalentComponents.ts';
import { clampFinite, scoreFromXp } from '../talent/PotentialCalculator.ts';
import { emitGrowthEvent } from '../talent/GrowthEvents.ts';
import { grantTrait } from '../traits/TraitService.ts';

export interface ActiveTribulation {
  entityId: number;
  totalStrikes: number;
  strikesRemaining: number;
  strikeTimer: number;
  strikeInterval: number;
  targetStageName: string;
}

export class TribulationSystem implements System {
  public name = 'TribulationSystem';
  public enabled = true;
  public priority = 16;

  private activeTribulations: Map<number, ActiveTribulation> = new Map();
  private eventBus = EventBus.getInstance();

  /**
   * Xóa sạch toàn bộ các lượt lôi kiếp đang diễn ra.
   * Dùng khi khởi tạo thế giới mới hoặc nạp bản lưu để tránh sét đánh nhầm nhân vật mới mang cùng ID.
   */
  public clear(): void {
    this.activeTribulations.clear();
  }

  public hasTribulation(entityId: number): boolean {
    return this.activeTribulations.has(entityId);
  }

  public getActiveTribulation(entityId: number): ActiveTribulation | undefined {
    return this.activeTribulations.get(entityId);
  }

  public cancelTribulation(entityId: number): void {
    this.activeTribulations.delete(entityId);
  }

  public getActiveTribulationsCount(): number {
    return this.activeTribulations.size;
  }

  public serializeTribulations(): ActiveTribulation[] {
    return Array.from(this.activeTribulations.values()).map(t => ({ ...t }));
  }

  public restoreTribulations(list?: ActiveTribulation[]): void {
    this.activeTribulations.clear();
    if (!Array.isArray(list)) return;
    for (const t of list) {
      if (t && typeof t.entityId === 'number' && Number.isFinite(t.entityId)) {
        this.activeTribulations.set(t.entityId, {
          entityId: t.entityId,
          totalStrikes: typeof t.totalStrikes === 'number' && t.totalStrikes > 0 ? t.totalStrikes : 3,
          strikesRemaining: typeof t.strikesRemaining === 'number' && t.strikesRemaining > 0 ? t.strikesRemaining : 1,
          strikeTimer: typeof t.strikeTimer === 'number' && t.strikeTimer >= 0 ? t.strikeTimer : 0.5,
          strikeInterval: typeof t.strikeInterval === 'number' && t.strikeInterval > 0 ? t.strikeInterval : 1.8,
          targetStageName: typeof t.targetStageName === 'string' && t.targetStageName ? t.targetStageName : 'Trúc Cơ'
        });
      }
    }
  }

  public startTribulation(
    entityId: number,
    targetStageName: string,
    numStrikes: number = 3,
    interval: number = 1.8,
    entityName: string = 'Tu sĩ'
  ): void {
    this.activeTribulations.set(entityId, {
      entityId,
      totalStrikes: numStrikes,
      strikesRemaining: numStrikes,
      strikeTimer: 0.5, // Tia đầu tiên giáng xuống sau 0.5s
      strikeInterval: interval,
      targetStageName
    });

    if (targetStageName === 'Nguyên Anh' || targetStageName === 'Ma Vương' || targetStageName === 'Kết Đan (Yêu Đan)') {
      this.eventBus.emit('world:log', {
        type: 'anomaly',
        message: `⚡ THIÊN ĐỊA DỊ TƯỢNG: [${entityName}] dẫn động Cực Hạn Thiên Kiếp, lôi vân ngợp trời chuẩn bị xung kích [${targetStageName}]!`
      });
    }
  }

  public update(world: ECSWorld, dt: number): void {
    if (this.activeTribulations.size === 0) return;

    for (const [entityId, trib] of this.activeTribulations.entries()) {
      const pos = world.getComponent(entityId, PositionComponent);
      const hp = world.getComponent(entityId, HealthComponent);
      const realm = world.getComponent(entityId, RealmComponent);
      const stateComp = world.getComponent(entityId, CharacterStateComponent);

      if (!pos || !hp || !realm || hp.isDead) {
        this.activeTribulations.delete(entityId);
        continue;
      }

      trib.strikeTimer -= dt;

      if (trib.strikeTimer <= 0) {
        trib.strikesRemaining--;
        trib.strikeTimer = trib.strikeInterval;

        // 1. Giáng một tia sét Lôi Kiếp chí mạng (Đan dược trợ lực Tụ Đan Đan giảm 30% sát thương)
        let damage = Math.floor(hp.max * 0.15);
        if (realm.breakthroughBonus > 0) {
          damage = Math.floor(damage * 0.7);
        }

        // Giảm sát thương lôi kiếp từ Ý Chí (Mục 12.4: willReduction = 0.15 * (willpower/100))
        const growth = world.getComponent(entityId, GrowthMindComponent);
        const willpowerScore = growth ? scoreFromXp(growth.willpowerXp) : 0;
        const willReduction = 0.15 * clampFinite(willpowerScore / 100, 0, 1, 0);
        damage = Math.max(1, Math.floor(damage * (1 - willReduction)));

        this.eventBus.emit('disaster:lightning_strike', {
          x: pos.x,
          y: pos.y,
          radius: 28,
          damage
        });

        hp.current = Math.max(0, hp.current - damage);

        // 2. Nếu tu sĩ kiệt sức tử vong dưới lôi kiếp
        if (hp.current <= 0) {
          hp.isDead = true;
          realm.isBreakingThrough = false;
          realm.breakthroughBonus = 0;
          if (stateComp) stateComp.state = 'dead';

          this.activeTribulations.delete(entityId);
          continue;
        }

        // 3. Nếu đã sống sót qua toàn bộ các đợt sấm sét!
        if (trib.strikesRemaining <= 0) {
          realm.isBreakingThrough = false;
          realm.breakthroughBonus = 0;
          if (stateComp) stateComp.state = 'idle';

          const tick = world.getCurrentTick();
          const day = world.calendarDayFloorAtTick(tick);
          const milestoneKey = `trib:${realm.realmChainId}:${trib.targetStageName}`;
          const eventId = `trib_passed:${entityId}:${realm.realmChainId}:${trib.targetStageName}`;

          let growthComp = growth;
          if (!growthComp) {
            growthComp = world.addComponent(
              entityId,
              new GrowthMindComponent({ lastIntegratedTick: tick })
            );
          }
          if (!growthComp.claimedMilestones.includes('tribulation_passed')) {
            growthComp.claimedMilestones.push('tribulation_passed');
          }

          emitGrowthEvent({
            world,
            eventId,
            entityId,
            kind: 'tribulation_passed',
            tick,
            familyKey: `tribulation:${realm.realmChainId}`,
            milestoneKey,
            difficulty: 1.0,
            evidence: {
              realmTarget: trib.targetStageName,
              reasonText: `Vượt thiên kiếp ${trib.targetStageName}`,
            },
          });

          // Tặng đặc điểm Lôi Kiếp Tôi Thể qua TraitService
          grantTrait(world, entityId, 'loi_kiep_toi_the', {
            reason: 'achievement',
            day,
            sourceEventId: eventId,
          });
          const specificTribCount = growthComp.claimedMilestones.filter(
            m => m.startsWith('trib:') || m.startsWith('tribulation:')
          ).length;
          if (specificTribCount >= 3) {
            grantTrait(world, entityId, 'phong_loi_bat_dong', {
              reason: 'achievement',
              day,
              sourceEventId: eventId,
            });
          }

          this.eventBus.emit('cultivation:tribulation_passed', {
            entityId,
            targetStageName: trib.targetStageName
          });

          this.activeTribulations.delete(entityId);
        }
      }
    }
  }
}
