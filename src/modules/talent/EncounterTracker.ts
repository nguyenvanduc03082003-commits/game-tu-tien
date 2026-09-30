import { ECSWorld } from '../../ecs/World.ts';
import {
  HealthComponent,
  PositionComponent,
  RealmComponent,
  TraitsComponent,
} from '../beings/BeingComponents.ts';
import { CombatStatsComponent, EquipmentComponent } from '../combat/CombatComponents.ts';
import { MemberComponent } from '../factions/FactionComponents.ts';
import { GrowthMindComponent } from './TalentComponents.ts';
import { emitGrowthEvent } from './GrowthEvents.ts';
import { evolveTrait, grantTrait } from '../traits/TraitService.ts';

export interface ActiveEncounter {
  encounterId: string;
  entityA: number;
  entityB: number;
  powerA: number;
  powerB: number;
  damageByA: number;
  damageByB: number;
  hitsByA: number;
  hitsByB: number;
  startTick: number;
  lastExchangeTick: number;
  resolved: boolean;
}

export function calculateEffectiveCombatPower(
  world: ECSWorld,
  entityId: number
): number {
  const realm = world.getComponent(entityId, RealmComponent);
  const stats = world.getComponent(entityId, CombatStatsComponent);
  const equip = world.getComponent(entityId, EquipmentComponent);
  const hp = world.getComponent(entityId, HealthComponent);

  const realmPower = realm ? realm.combatPower : 0;
  const baseAtk = stats?.baseAtk ?? 10;
  const weaponDmg =
    (equip?.mainHand?.baseDamage ?? 0) +
    (equip?. isDualWielding() ? Math.floor((equip.offHand?.baseDamage ?? 0) * 0.75) : 0) +
    (!equip?.mainHand && equip?.workTool ? equip.workTool.baseDamage : 0);
  const defense = stats?.defense ?? 5;
  const armor = (stats?.armor ?? 0) + (equip?.getTotalArmorBonus() ?? 0);
  const maxHp = hp?.max ?? 100;

  return Math.max(
    1,
    Math.round(realmPower + (baseAtk + weaponDmg) * 2 + defense + armor + maxHp * 0.2)
  );
}

export class EncounterTracker {
  private static worldEncounters = new WeakMap<ECSWorld, Map<string, ActiveEncounter>>();

  private static getMap(world: ECSWorld): Map<string, ActiveEncounter> {
    let map = this.worldEncounters.get(world);
    if (!map) {
      map = new Map<string, ActiveEncounter>();
      this.worldEncounters.set(world, map);
    }
    return map;
  }

  public static clear(world?: ECSWorld): void {
    if (world) {
      this.worldEncounters.delete(world);
    } else {
      this.worldEncounters = new WeakMap<ECSWorld, Map<string, ActiveEncounter>>();
    }
  }

  private static makePairKey(a: number, b: number): [string, number, number] {
    const minId = Math.min(a, b);
    const maxId = Math.max(a, b);
    return [`${minId}:${maxId}`, minId, maxId];
  }

  public static recordExchange(
    world: ECSWorld,
    attackerId: number,
    defenderId: number,
    damageDealt: number,
    tick: number
  ): ActiveEncounter | null {
    if (attackerId === defenderId || damageDealt <= 0) return null;

    // Không ghi nhận tự đánh người cùng phe
    const memA = world.getComponent(attackerId, MemberComponent);
    const memB = world.getComponent(defenderId, MemberComponent);
    if (memA?.factionId && memB?.factionId && memA.factionId === memB.factionId) {
      return null;
    }

    const map = this.getMap(world);
    const [pairKey, entityA, entityB] = this.makePairKey(attackerId, defenderId);
    let enc = map.get(pairKey);

    if (enc && (enc.resolved || tick - enc.lastExchangeTick >= 60)) {
      if (!enc.resolved) {
        this.finalizeEncounter(world, enc, tick, null);
      }
      map.delete(pairKey);
      enc = undefined;
    }

    if (!enc) {
      const startDay = Math.max(0, world.calendarDayFloorAtTick(tick));
      enc = {
        encounterId: `enc:${entityA}:${entityB}:d${startDay}`,
        entityA,
        entityB,
        powerA: calculateEffectiveCombatPower(world, entityA),
        powerB: calculateEffectiveCombatPower(world, entityB),
        damageByA: 0,
        damageByB: 0,
        hitsByA: 0,
        hitsByB: 0,
        startTick: tick,
        lastExchangeTick: tick,
        resolved: false,
      };
      map.set(pairKey, enc);
    }

    if (attackerId === entityA) {
      enc.damageByA += damageDealt;
      enc.hitsByA += 1;
    } else {
      enc.damageByB += damageDealt;
      enc.hitsByB += 1;
    }
    enc.lastExchangeTick = tick;

    const defHp = world.getComponent(defenderId, HealthComponent);
    if (defHp && (defHp.isDead || defHp.current <= 0)) {
      this.finalizeEncounter(world, enc, tick, attackerId);
      map.delete(pairKey);
    }

    return enc;
  }

  public static update(world: ECSWorld, currentTick: number): void {
    const map = this.getMap(world);
    if (map.size === 0) return;

    for (const [key, enc] of Array.from(map.entries())) {
      if (enc.resolved) {
        map.delete(key);
        continue;
      }

      const hpA = world.getComponent(enc.entityA, HealthComponent);
      const hpB = world.getComponent(enc.entityB, HealthComponent);
      const posA = world.getComponent(enc.entityA, PositionComponent);
      const posB = world.getComponent(enc.entityB, PositionComponent);

      const aDead = !hpA || hpA.isDead || hpA.current <= 0;
      const bDead = !hpB || hpB.isDead || hpB.current <= 0;

      if (aDead || bDead) {
        const victor = aDead && !bDead ? enc.entityB : bDead && !aDead ? enc.entityA : null;
        this.finalizeEncounter(world, enc, currentTick, victor);
        map.delete(key);
        continue;
      }

      const dist =
        posA && posB ? Math.hypot(posA.x - posB.x, posA.y - posB.y) : 999;
      const elapsedTicks = currentTick - enc.lastExchangeTick;

      // Kết thúc encounter khi 2 bên không giao chiến đủ 3 ngày (60 ticks) hoặc đã tách xa và dừng đánh > 1 ngày
      if (elapsedTicks >= 60 || (dist > 220 && elapsedTicks >= 20)) {
        this.finalizeEncounter(world, enc, currentTick, null);
        map.delete(key);
      }
    }
  }

  private static finalizeEncounter(
    world: ECSWorld,
    enc: ActiveEncounter,
    tick: number,
    victorId: number | null
  ): void {
    if (enc.resolved) return;
    enc.resolved = true;

    const totalDamage = enc.damageByA + enc.damageByB;
    if (totalDamage <= 0) return;

    const participants: [number, number, number, number, number][] = [
      [enc.entityA, enc.entityB, enc.powerA, enc.powerB, enc.damageByA],
      [enc.entityB, enc.entityA, enc.powerB, enc.powerA, enc.damageByB],
    ];

    const currentDay = Math.max(0, world.calendarDayFloorAtTick(tick));

    for (const [selfId, oppId, selfPower, oppPower, dmgDealt] of participants) {
      const hp = world.getComponent(selfId, HealthComponent);
      if (!hp || hp.isDead || hp.current <= 0) continue;

      const ratio = oppPower / Math.max(1, selfPower);
      if (ratio < 0.75) {
        continue; // Đối thủ quá yếu (< 0.75x sức mạnh hiệu dụng) -> Không tính XP và không tính Bách Chiến
      }

      let difficulty = 0.5;
      if (ratio >= 1.15) difficulty = 1.25;
      else if (ratio >= 0.90) difficulty = 1.0;

      // Ghi nhận thống kê chiến thắng thực chiến đủ thử thách (mục 8.4)
      if (victorId === selfId && dmgDealt > 0) {
        const growth = world.getComponent(selfId, GrowthMindComponent);
        if (growth) {
          growth.combatEncounterCount += 1;
          if (!growth.distinctOpponentIds.includes(oppId)) {
            growth.distinctOpponentIds.push(oppId);
          }
          if (
            growth.combatEncounterCount >= 100 &&
            growth.distinctOpponentIds.length >= 20
          ) {
            if (!growth.claimedMilestones.includes('challenging_encounters_won')) {
              growth.claimedMilestones.push('challenging_encounters_won');
            }
            const traits = world.getComponent(selfId, TraitsComponent);
            const hasNovice = traits?.entries.some(
              e => e.id === 'kinh_nghiem_non_not' && e.state === 'active'
            );
            if (hasNovice) {
              evolveTrait(world, selfId, 'kinh_nghiem_non_not', 'bach_chien_bat_bai', {
                reason: 'evolution',
                day: currentDay,
                sourceEventId: enc.encounterId,
              });
            } else {
              grantTrait(world, selfId, 'bach_chien_bat_bai', {
                reason: 'achievement',
                day: currentDay,
                sourceEventId: enc.encounterId,
              });
            }
          }
        }
      }

      emitGrowthEvent({
        world,
        eventId: `${enc.encounterId}:surv:${selfId}`,
        entityId: selfId,
        kind: 'encounter_survived',
        tick,
        familyKey: `encounter:${oppId}`,
        difficulty,
        evidence: {
          encounterId: enc.encounterId,
          targetEntityId: oppId,
          actualDamage: dmgDealt,
          reasonText:
            victorId === selfId
              ? 'Chiến thắng cường địch trong huyết chiến'
              : 'Sống sót thoát khỏi trận giao chiến hiểm nghèo',
        },
      });
    }
  }
}
