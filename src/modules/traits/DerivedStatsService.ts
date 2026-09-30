import { ECSWorld } from '../../ecs/World.ts';
import { Entity } from '../../ecs/Entity.ts';
import type { System } from '../../ecs/System.ts';

import { RACE_DEFINITIONS } from '../../config/races.config.ts';
import {
  ComprehensionComponent,
  HealthComponent,
  LifespanComponent,
  PositionComponent,
  RaceComponent,
  RealmComponent,
  TraitsComponent,
} from '../beings/BeingComponents.ts';
import { CombatStatsComponent } from '../combat/CombatComponents.ts';
import {
  GrowthMindComponent,
  PermanentStatAdjustment,
  PotentialResult,
  StatBaselineComponent,
  TalentProfileComponent,
} from '../talent/TalentComponents.ts';
import {
  calculatePotential,
  clampFinite,
} from '../talent/PotentialCalculator.ts';
import { resolveEntityTraitEffects } from './TraitEffectResolver.ts';
import { resolveInnateContributors } from './TraitService.ts';

/**
 * Đảm bảo thực thể có StatBaselineComponent.
 * Nếu chưa có (ví dụ thực thể tạo thủ công trong test), suy ngược baseline từ chỉ số hiện tại và hiệu ứng trait hiện tại.
 */
export function ensureStatBaseline(
  world: ECSWorld,
  entityId: Entity
): StatBaselineComponent {
  const existing = world.getComponent(entityId, StatBaselineComponent);
  if (existing) return existing;

  const raceComp = world.getComponent(entityId, RaceComponent);
  const raceDef = RACE_DEFINITIONS[raceComp?.raceId ?? 'human'] ?? RACE_DEFINITIONS['human'];
  const realm = world.getComponent(entityId, RealmComponent);
  const stageIdx = realm?.stageIndex ?? 0;

  const pos = world.getComponent(entityId, PositionComponent);
  const hp = world.getComponent(entityId, HealthComponent);
  const life = world.getComponent(entityId, LifespanComponent);
  const combat = world.getComponent(entityId, CombatStatsComponent);

  const effects = resolveEntityTraitEffects(world, entityId);
  const hpScale = Math.pow(raceDef.baseStats.healthGrowthMultiplier, stageIdx);
  const lifeScale = Math.pow(raceDef.baseStats.lifespanGrowthMultiplier, stageIdx);
  const atkScale = Math.pow(1.25, stageIdx);

  const inferredBaseMaxHealth = hp
    ? Math.max(0.0001, hp.max / Math.max(0.1, hpScale * effects.healthFactor))
    : raceDef.baseStats.maxHealth;

  const inferredBaseLifespan = life
    ? Math.max(0.0001, (life.maxLifespan - effects.lifespanYears) / Math.max(0.1, lifeScale))
    : raceDef.baseStats.baseLifespan;

  const inferredBaseMoveSpeed = pos
    ? Math.max(0.0001, pos.speed / Math.max(0.1, effects.moveSpeedFactor))
    : raceDef.baseStats.moveSpeed;

  const inferredBaseAtk = combat
    ? Math.max(0.0001, combat.baseAtk / Math.max(0.1, atkScale * effects.attackFactor))
    : raceDef.baseStats.baseAttack;

  const inferredBaseDef = combat
    ? combat.defense - effects.defenseFlat - effects.legacyPhysiqueFlat
    : raceDef.baseStats.baseDefense;

  const inferredBaseArmor = combat
    ? combat.armor - effects.armorFlat
    : raceDef.baseStats.armor;

  const inferredBaseCrit = combat
    ? clampFinite(combat.critRate - effects.critChanceBonus, 0, 1, raceDef.baseStats.critRate)
    : raceDef.baseStats.critRate;

  const inferredBaseDodge = combat
    ? clampFinite(combat.dodgeRate - effects.dodgeChanceBonus, 0, 0.8, raceDef.baseStats.dodgeRate)
    : raceDef.baseStats.dodgeRate;

  const inferredBaseAtkSpeed = combat
    ? Math.max(0.2, combat.attackSpeed / Math.max(0.1, effects.attackSpeedFactor))
    : 1.0;

  const baseline = new StatBaselineComponent({
    baseMoveSpeed: inferredBaseMoveSpeed,
    baseMaxHealth: inferredBaseMaxHealth,
    healthGrowthMultiplier: raceDef.baseStats.healthGrowthMultiplier,
    archetypeHealthMultiplier: 1.0,
    baseLifespan: inferredBaseLifespan,
    lifespanGrowthMultiplier: raceDef.baseStats.lifespanGrowthMultiplier,
    archetypeLifespanMultiplier: 1.0,
    baseAttack: inferredBaseAtk,
    baseDefense: inferredBaseDef,
    baseArmor: inferredBaseArmor,
    archetypePhysiqueMultiplier: 1.0,
    baseCritRate: inferredBaseCrit,
    baseDodgeRate: inferredBaseDodge,
    baseAttackSpeed: inferredBaseAtkSpeed,
    dirty: false,
  });

  world.addComponent(entityId, baseline);
  return baseline;
}

/**
 * Lấy hoặc tính lại PotentialResult của thực thể, có cache theo revision của Profile, Growth và Traits.
 */
export function getEntityPotential(
  world: ECSWorld,
  entityId: Entity
): PotentialResult | undefined {
  const profile = world.getComponent(entityId, TalentProfileComponent);
  if (!profile) return undefined;

  const growth = world.getComponent(entityId, GrowthMindComponent);
  const traits = world.getComponent(entityId, TraitsComponent);

  const pRev = profile.revision;
  const gRev = growth?.revision ?? 0;
  const tRev = traits?.revision ?? 0;

  if (
    profile.cachedPotential &&
    profile.cachedAtProfileRevision === pRev &&
    profile.cachedAtGrowthRevision === gRev &&
    profile.cachedAtTraitRevision === tRev
  ) {
    return profile.cachedPotential;
  }

  const contributors = resolveInnateContributors(world, entityId);
  const result = calculatePotential(profile, growth, contributors);

  profile.cachedPotential = result;
  profile.cachedAtProfileRevision = pRev;
  profile.cachedAtGrowthRevision = gRev;
  profile.cachedAtTraitRevision = tRev;

  // Đồng bộ sang ComprehensionComponent.current (thang 0..100000)
  const comp = world.getComponent(entityId, ComprehensionComponent);
  if (comp) {
    comp.setFromStandardScore(result.scores.comprehension);
  }

  return result;
}

/**
 * Tính lại toàn bộ chỉ số dẫn xuất của thực thể từ StatBaselineComponent + TraitEffectResolver.
 * Có thể gọi lặp vô hạn lần (idempotent): không nhân chồng chỉ số, giữ tỷ lệ HP hiện tại, không làm sống lại người chết.
 */
export function rebuildEntityStats(world: ECSWorld, entityId: Entity): void {
  const baseline = ensureStatBaseline(world, entityId);
  const priorCurrentHp = world.getComponent(entityId, HealthComponent)?.current;
  const priorAgingFactor = baseline.agingFactor;
  const realm = world.getComponent(entityId, RealmComponent);
  const stageIdx = realm?.stageIndex ?? 0;
  const effects = resolveEntityTraitEffects(world, entityId);

  let permLifespanYears = 0;
  let permHealthFlat = 0;
  let permAttackFlat = 0;
  let permDefenseFlat = 0;
  let permArmorFlat = 0;

  for (const adj of baseline.permanentAdjustments) {
    if (!adj || !Number.isFinite(adj.delta)) continue;
    switch (adj.stat) {
      case 'lifespanYears':
        permLifespanYears += adj.delta;
        break;
      case 'maxHealthFlat':
        permHealthFlat += adj.delta;
        break;
      case 'attackFlat':
        permAttackFlat += adj.delta;
        break;
      case 'defenseFlat':
        permDefenseFlat += adj.delta;
        break;
      case 'armorFlat':
        permArmorFlat += adj.delta;
        break;
    }
  }

  // 1. Position moveSpeed
  const pos = world.getComponent(entityId, PositionComponent);
  if (pos) {
    pos.speed = Math.max(
      1,
      Math.round(baseline.baseMoveSpeed * effects.moveSpeedFactor)
    );
  }

  // 2. Health max & current ratio preservation (Test R04)
  const hp = world.getComponent(entityId, HealthComponent);
  if (hp) {
    const hpScale = Math.pow(baseline.healthGrowthMultiplier, stageIdx);
    const newMaxHp = Math.max(
      1,
      Math.round(
        baseline.baseMaxHealth *
          hpScale *
          baseline.archetypeHealthMultiplier *
          effects.healthFactor
      ) + Math.round(permHealthFlat)
    );

    if (hp.isDead) {
      hp.max = newMaxHp;
      hp.current = 0;
    } else {
      const oldMax = hp.max > 0 ? hp.max : newMaxHp;
      const ratio = clampFinite(hp.current / oldMax, 0, 1, 1);
      hp.max = newMaxHp;
      if (hp.current > 0) {
        hp.current = Math.max(1, Math.min(newMaxHp, Math.round(newMaxHp * ratio)));
      } else {
        hp.current = 0;
      }
    }
  }

  // 3. Lifespan max & elderly check (Test R06)
  const life = world.getComponent(entityId, LifespanComponent);
  if (life) {
    const lifeScale = Math.pow(baseline.lifespanGrowthMultiplier, stageIdx);
    const baseScaledLife = Math.round(
      baseline.baseLifespan * lifeScale * baseline.archetypeLifespanMultiplier
    );
    const newMaxLifespan = Math.max(
      1,
      baseScaledLife + Math.round(effects.lifespanYears) + Math.round(permLifespanYears)
    );
    life.maxLifespan = newMaxLifespan;
    life.isElderly = life.checkElderly();
    if (!life.isElderly) life.hasLoggedElderly = false;
  }

  // 4. Combat Stats
  const combat = world.getComponent(entityId, CombatStatsComponent);
  if (combat) {
    const atkScale = Math.pow(1.25, stageIdx);

    combat.baseAtk = Math.max(
      1,
      Math.round(
        baseline.baseAttack *
          baseline.archetypePhysiqueMultiplier *
          atkScale *
          effects.attackFactor
      ) + Math.round(permAttackFlat)
    );
    combat.defense = Math.round(
      baseline.baseDefense * baseline.archetypePhysiqueMultiplier +
        effects.defenseFlat +
        effects.legacyPhysiqueFlat +
        permDefenseFlat
    );
    combat.armor = Math.round(
      baseline.baseArmor + effects.armorFlat + permArmorFlat
    );
    combat.critRate = clampFinite(
      baseline.baseCritRate + effects.critChanceBonus,
      0,
      1.0,
      0.05
    );
    combat.dodgeRate = clampFinite(
      baseline.baseDodgeRate + effects.dodgeChanceBonus,
      0,
      0.8,
      0.05
    );
    combat.attackSpeed = clampFinite(
      Number((baseline.baseAttackSpeed * effects.attackSpeedFactor).toFixed(4)),
      0.2,
      3.0,
      1.0
    );
  }

  // Mốc khỏe mạnh được giữ xuyên suốt mỗi giai đoạn già yếu.
  if (life && hp) {
    const progress = clampFinite((life.currentAge / life.maxLifespan - 0.9) / 0.1, 0, 1, 0);
    const factor = 1 - progress * 0.5;
    const healthy = {
      maxHealth: hp.max, attack: combat?.baseAtk ?? 0, defense: Math.max(0, combat?.defense ?? 0),
      armor: Math.max(0, combat?.armor ?? 0), moveSpeed: pos?.speed ?? 0,
      attackSpeed: combat?.attackSpeed ?? 1, dodgeRate: combat?.dodgeRate ?? 0,
    };
    if (!life.checkElderly() || !baseline.agingReference) baseline.agingReference = healthy;
    const reference = baseline.agingReference;
    // Tăng chỉ số hợp lệ trong tuổi già vẫn có hiệu lực; phần phạt tuổi già lấy từ mốc đã khóa.
    const aged = (current: number, anchor: number) => Math.max(0, current - anchor * (1 - factor));
    hp.max = Math.max(1, aged(healthy.maxHealth, reference.maxHealth));
    if (pos) pos.speed = Math.max(0.5, aged(healthy.moveSpeed, reference.moveSpeed));
    if (combat) {
      combat.baseAtk = Math.max(0.5, aged(healthy.attack, reference.attack));
      combat.defense = aged(healthy.defense, reference.defense);
      combat.armor = aged(healthy.armor, reference.armor);
      combat.attackSpeed = Math.max(0.1, aged(healthy.attackSpeed, reference.attackSpeed));
      combat.dodgeRate = aged(healthy.dodgeRate, reference.dodgeRate);
    }
    if (priorAgingFactor < 1 || factor < 1) hp.current = hp.isDead ? 0 : Math.min(hp.max, priorCurrentHp ?? hp.current);
    baseline.agingFactor = factor;
    baseline.lastAgingAge = life.currentAge;
    baseline.lastAgingLifespan = life.maxLifespan;
  }

  // 5. Cập nhật Potential & Comprehension adapter nếu có TalentProfileComponent
  if (world.hasComponent(entityId, TalentProfileComponent)) {
    getEntityPotential(world, entityId);
  }

  const traits = world.getComponent(entityId, TraitsComponent);
  baseline.dirty = false;
  baseline.lastRebuiltTraitRevision = traits?.revision ?? 0;
  baseline.lastRebuiltStageIndex = stageIdx;
}

/**
 * Ghi nhận một điều chỉnh chỉ số vĩnh viễn nằm ngoài trait (ví dụ uống Thọ Nguyên Đan) và rebuild ngay.
 */
export function applyPermanentStatAdjustment(
  world: ECSWorld,
  entityId: Entity,
  adjustment: PermanentStatAdjustment
): boolean {
  const baseline = ensureStatBaseline(world, entityId);
  const added = baseline.addPermanentAdjustment(adjustment);
  if (added) {
    rebuildEntityStats(world, entityId);
  }
  return added;
}

/**
 * Hệ thống ECS chạy ở đầu tick (priority 18) để flush mọi thực thể có thay đổi trait/stage từ tick trước.
 */
export class DerivedStatsSystem implements System {
  public readonly name = 'DerivedStatsSystem';
  public readonly priority = 18;
  public enabled = true;


  public update(world: ECSWorld, _dt: number): void {
    const entities = world.query([StatBaselineComponent]);
    for (const ent of entities) {
      const baseline = world.getComponent(ent, StatBaselineComponent)!;
      const traits = world.getComponent(ent, TraitsComponent);
      const realm = world.getComponent(ent, RealmComponent);
      const tRev = traits?.revision ?? 0;
      const stageIdx = realm?.stageIndex ?? 0;
      const life = world.getComponent(ent, LifespanComponent);

      if (
        (life && (baseline.lastAgingAge !== life.currentAge || baseline.lastAgingLifespan !== life.maxLifespan)) ||
        baseline.dirty ||
        baseline.lastRebuiltTraitRevision !== tRev ||
        baseline.lastRebuiltStageIndex !== stageIdx
      ) {
        rebuildEntityStats(world, ent);
      }
    }
  }

  public reset(): void {
    // Stateless per-entity components
  }
}
