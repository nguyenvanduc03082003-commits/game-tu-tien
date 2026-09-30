import { ECSWorld } from '../../ecs/World.ts';
import { PILL_DEFINITIONS, PillDefinition } from '../../config/pills.config.ts';
import { InventoryComponent } from './InventoryComponent.ts';
import {
  HealthComponent,
  LifespanComponent,
  RealmComponent,
  CharacterStateComponent,
  CorpseComponent
} from '../beings/BeingComponents.ts';
import { CombatStatsComponent } from '../combat/CombatComponents.ts';
import { applyPermanentStatAdjustment } from '../traits/DerivedStatsService.ts';
import { StatBaselineComponent } from '../talent/TalentComponents.ts';
import { EventBus } from '../../core/EventBus.ts';

export interface PillUsageResult {
  success: boolean;
  reason?: string;
  pill?: PillDefinition;
}

/**
 * Service trung tâm điều phối mọi hành vi sử dụng đan dược (UI, AI và hệ thống tự động).
 * Đảm bảo kiểm tra điều kiện hiệu lực trước khi tiêu hao, không để mất đan vô ích.
 */
export class PillUsageService {
  private static eventBus = EventBus.getInstance();
  private static pillSequence = 0;

  /**
   * Kiểm tra xem nhân vật có đủ điều kiện để sử dụng viên đan hay không.
   * Tuyệt đối không thay đổi trạng thái thế giới hay tiêu hao vật phẩm.
   */
  public static canUsePill(
    world: ECSWorld,
    entityId: number,
    pillId: string
  ): { canUse: boolean; reason?: string; pill?: PillDefinition } {
    const pill = PILL_DEFINITIONS[pillId];
    if (!pill) {
      return { canUse: false, reason: 'Không tìm thấy định nghĩa đan dược' };
    }

    const inv = world.getComponent(entityId, InventoryComponent);
    if (!inv || !inv.hasPill(pillId)) {
      return { canUse: false, reason: 'Không có đan dược trong túi trữ vật' };
    }

    const hp = world.getComponent(entityId, HealthComponent);

    switch (pill.type) {
      case 'healing': {
        if (!hp || hp.isDead) {
          return { canUse: false, reason: 'Nhân vật đã tử nạn, không thể dùng đan hồi máu' };
        }
        if (hp.current >= hp.max) {
          return { canUse: false, reason: 'Sinh mệnh đã đầy, không cần hồi phục' };
        }
        return { canUse: true, pill };
      }

      case 'revive': {
        if (!hp || !hp.isDead) {
          return { canUse: false, reason: 'Nhân vật chưa tử nạn, không thể dùng đan hồi sinh' };
        }
        return { canUse: true, pill };
      }

      case 'lifespan': {
        if (hp && hp.isDead) {
          return { canUse: false, reason: 'Nhân vật đã tử nạn, không thể dùng đan tăng thọ' };
        }
        const life = world.getComponent(entityId, LifespanComponent);
        if (!life) {
          return { canUse: false, reason: 'Thực thể không có thọ nguyên' };
        }
        return { canUse: true, pill };
      }

      case 'breakthrough': {
        if (hp && hp.isDead) {
          return { canUse: false, reason: 'Nhân vật đã tử nạn, không thể dùng đan đột phá' };
        }
        const realm = world.getComponent(entityId, RealmComponent);
        if (!realm) {
          return { canUse: false, reason: 'Thực thể không có tu vi cảnh giới' };
        }
        if (pillId === 'truc_co_dan' && realm.stageIndex !== 1) {
          return { canUse: false, reason: 'Trúc Cơ Đan chỉ dành cho tu sĩ cảnh giới Luyện Khí' };
        }
        if (pillId === 'tu_dan_dan' && realm.stageIndex !== 2) {
          return { canUse: false, reason: 'Tụ Đan Đan chỉ dành cho tu sĩ cảnh giới Trúc Cơ' };
        }
        const bonus = pill.breakthroughBonus ?? 0.2;
        if ((realm.breakthroughBonus || 0) >= bonus) {
          return { canUse: false, reason: 'Đã nhận được dược lực đột phá tối đa từ đan dược tương đương' };
        }
        return { canUse: true, pill };
      }

      case 'buff': {
        if (hp && hp.isDead) {
          return { canUse: false, reason: 'Nhân vật đã tử nạn, không thể dùng đan tăng lực' };
        }
        const stats = world.getComponent(entityId, CombatStatsComponent);
        if (!stats) {
          return { canUse: false, reason: 'Thực thể không có thuộc tính chiến đấu' };
        }
        return { canUse: true, pill };
      }

      default:
        return { canUse: false, reason: 'Loại đan dược không được hỗ trợ' };
    }
  }

  /**
   * Sử dụng viên đan cho thực thể.
   * Chỉ tiêu hao đan dược SAU KHI điều kiện thỏa mãn và hiệu ứng được kích hoạt thành công.
   */
  public static usePill(
    world: ECSWorld,
    entityId: number,
    pillId: string
  ): PillUsageResult {
    const check = this.canUsePill(world, entityId, pillId);
    if (!check.canUse || !check.pill) {
      return { success: false, reason: check.reason };
    }

    const pill = check.pill;
    const inv = world.getComponent(entityId, InventoryComponent)!;
    const hp = world.getComponent(entityId, HealthComponent);
    const life = world.getComponent(entityId, LifespanComponent);
    const realm = world.getComponent(entityId, RealmComponent);
    const stats = world.getComponent(entityId, CombatStatsComponent);
    const stateComp = world.getComponent(entityId, CharacterStateComponent);

    // Áp dụng hiệu ứng tương ứng
    switch (pill.type) {
      case 'healing': {
        if (hp) {
          const healVal = pill.healAmount ?? 50;
          hp.current = Math.min(hp.max, hp.current + healVal);
          this.eventBus.emit('combat:floating_text', {
            entityId,
            text: `+${healVal} HP`,
            color: '#51cf66'
          });
        }
        break;
      }

      case 'revive': {
        if (hp) {
          hp.isDead = false;
          const pct = pill.reviveHealthPercent ?? 0.6;
          const ratio = pct <= 1.0 ? pct : pct / 100;
          hp.current = Math.max(1, Math.floor(hp.max * ratio));
          if (stateComp) stateComp.state = 'idle';
          world.removeComponent(entityId, CorpseComponent);
          this.eventBus.emit('combat:floating_text', {
            entityId,
            text: '✨ HỒI SINH!',
            color: '#ffd43b',
            isCrit: true
          });
        }
        break;
      }

      case 'lifespan': {
        if (life) {
          const years = pill.lifespanBonusYears ?? 15;
          const tick = world.getCurrentTick();
          const day = world.calendarDayFloorAtTick(tick);
          const baseline = world.getComponent(entityId, StatBaselineComponent);
          let adjustmentId: string;
          do {
            this.pillSequence++;
            adjustmentId = `pill:${pill.id}:${entityId}:${tick}:${this.pillSequence}`;
          } while (baseline?.permanentAdjustments.some(adj => adj.id === adjustmentId));
          const applied = applyPermanentStatAdjustment(world, entityId, {
            id: adjustmentId,
            stat: 'lifespanYears',
            delta: years,
            source: pill.name || pill.id,
            day,
          });
          if (!applied) {
            return { success: false, reason: 'Không thể ghi nhận hiệu lực tăng thọ' };
          }
          if (life.currentAge < life.maxLifespan * 0.9) {
            life.isElderly = false;
          }
          this.eventBus.emit('combat:floating_text', {
            entityId,
            text: `+${years} Năm Thọ`,
            color: '#339af0'
          });
        }
        break;
      }

      case 'breakthrough': {
        if (realm) {
          const bonus = pill.breakthroughBonus ?? 0.25;
          realm.breakthroughBonus = Math.max(realm.breakthroughBonus || 0, bonus);
          this.eventBus.emit('combat:floating_text', {
            entityId,
            text: `Dùng ${pill.name} (+${Math.round(bonus * 100)}% Tỷ Lệ)!`,
            color: '#4dabf7'
          });
        }
        break;
      }

      case 'buff': {
        if (stats) {
          stats.buffDamageMultiplier = pill.buffDamageMultiplier ?? 1.6;
          stats.buffTimer = pill.buffDurationSeconds ?? 30;
          this.eventBus.emit('combat:floating_text', {
            entityId,
            text: `🔥 Bạo Linh (+${Math.round(((pill.buffDamageMultiplier ?? 1.6) - 1) * 100)}% ATK)`,
            color: '#ff922b'
          });
        }
        break;
      }
    }

    // Tiêu hao viên đan sau khi áp dụng hiệu ứng thành công
    inv.consumePill(pillId);

    return { success: true, pill };
  }
}
