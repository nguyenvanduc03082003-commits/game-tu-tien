import assert from 'node:assert/strict';
import { ECSWorld } from '../src/ecs/World.ts';
import {
  ComprehensionComponent,
  HealthComponent,
  LifespanComponent,
  PositionComponent,
  RaceComponent,
  RealmComponent,
  SpiritualRootComponent,
  TraitsComponent,
} from '../src/modules/beings/BeingComponents.ts';
import { AppearanceComponent } from '../src/modules/appearance/Appearance.ts';
import { CombatStatsComponent } from '../src/modules/combat/CombatComponents.ts';
import {
  GrowthMindComponent,
  StatBaselineComponent,
  TalentProfileComponent,
} from '../src/modules/talent/TalentComponents.ts';
import {
  evolveTrait,
  grantTrait,
  removeTrait,
  resolveActiveTraits,
} from '../src/modules/traits/TraitService.ts';
import {
  getEffectiveQiRateMultiplier,
  getRootQiFactor,
  resolveEntityTraitEffects,
} from '../src/modules/traits/TraitEffectResolver.ts';
import {
  applyPermanentStatAdjustment,
  rebuildEntityStats,
} from '../src/modules/traits/DerivedStatsService.ts';

let passed = 0;
function test(name: string, fn: () => void): void {
  fn();
  passed++;
  console.log('PASS trait-runtime:', name);
}

function createTestHuman(): { world: ECSWorld; id: number } {
  const world = new ECSWorld();
  const id = world.createEntity();
  world.addComponent(id, new RaceComponent('human'));
  world.addComponent(id, new AppearanceComponent('human_male_1', 'human', 'humanoid'));
  world.addComponent(id, new PositionComponent(100, 100, 25));
  world.addComponent(id, new RealmComponent('human_realms', 0, 'Phàm Nhân', 'Sơ Kỳ', 0, 50, 10, 0));
  world.addComponent(id, new HealthComponent(100));
  world.addComponent(id, new LifespanComponent(18, 100));
  world.addComponent(id, new CombatStatsComponent(10, 5, 0, 1.0, 0.05, 0.05));
  world.addComponent(id, new ComprehensionComponent(50000));
  world.addComponent(id, new SpiritualRootComponent(true, 'true', 'Chân Linh Căn', ['hoa'], 65));
  world.addComponent(id, new TraitsComponent());
  world.addComponent(
    id,
    new TalentProfileComponent({
      base: { comprehension: 50, aptitude: 61, physique: 35 },
      knowledge: 'revealed',
    })
  );
  world.addComponent(
    id,
    new StatBaselineComponent({
      baseMoveSpeed: 25,
      baseMaxHealth: 100,
      healthGrowthMultiplier: 5,
      baseLifespan: 100,
      lifespanGrowthMultiplier: 5,
      baseAttack: 10,
      baseDefense: 5,
      baseArmor: 0,
      baseCritRate: 0.05,
      baseDodgeRate: 0.05,
      baseAttackSpeed: 1.0,
    })
  );
  return { world, id };
}

test('R01 & R02: grantTrait idempotence, removeTrait restoration, and 100x rebuild stability', () => {
  const { world, id } = createTestHuman();
  const hp = world.getComponent(id, HealthComponent)!;
  const combat = world.getComponent(id, CombatStatsComponent)!;

  // Grant Cân Cốt Cường Tráng (hp x1.25, def +8, physique +6)
  const g1 = grantTrait(world, id, 'can_cot_cuong_trang', { reason: 'birth' });
  assert.deepEqual(g1, { ok: true, changed: true });
  assert.equal(hp.max, 125);
  assert.equal(combat.defense, 5 + 8 + 6);

  // Grant again -> changed: false, no double multiplier
  const g2 = grantTrait(world, id, 'can_cot_cuong_trang', { reason: 'birth' });
  assert.deepEqual(g2, { ok: true, changed: false });
  assert.equal(hp.max, 125);

  // Rebuild 100 times -> no stat drift
  for (let i = 0; i < 100; i++) {
    rebuildEntityStats(world, id);
  }
  assert.equal(hp.max, 125);
  assert.equal(combat.defense, 19);

  // Remove trait -> restores exact baseline
  const rem = removeTrait(world, id, 'can_cot_cuong_trang', { reason: 'godTool' });
  assert.deepEqual(rem, { ok: true, changed: true });
  assert.equal(hp.max, 100);
  assert.equal(combat.defense, 5);
});

test('C08 & Race/Lineage gate: rejecting second primary root or wrong race/species leaves state unchanged', () => {
  const { world, id } = createTestHuman();

  const r1 = grantTrait(world, id, 'thien_linh_can', { reason: 'birth' });
  assert.equal(r1.ok, true);

  // Second active primary root must fail due to primary_root exclusive group
  const r2 = grantTrait(world, id, 'ngu_hanh_cau_toan', { reason: 'birth' });
  assert.equal(r2.ok, false);
  if (!r2.ok) assert.equal(r2.reason, 'trait_conflict');

  // Planned trait must fail with planned_trait_not_active
  const rPlanned = grantTrait(world, id, 'hon_don_dao_can', { reason: 'birth' });
  assert.equal(rPlanned.ok, false);
  if (!rPlanned.ok) assert.equal(rPlanned.reason, 'planned_trait_not_active');


  // Beast trait on human must fail without mutating traits
  const rBeast = grantTrait(world, id, 'man_hoang_cu_luc', { reason: 'birth' });
  assert.equal(rBeast.ok, false);
  if (!rBeast.ok) assert.equal(rBeast.reason, 'race_or_species_mismatch');

  const active = resolveActiveTraits(world, id);
  assert.equal(active.length, 1);
  assert.equal(active[0].id, 'thien_linh_can');
});

test('R03: evolution chains (kinh_nghiem_non_not -> bach_chien_bat_bai and long_huyet_ba_the -> to_long_chan_huyet) replace instead of stacking', () => {
  // 1. Combat experience chain on human
  const { world, id } = createTestHuman();
  const combat = world.getComponent(id, CombatStatsComponent)!;

  assert.equal(grantTrait(world, id, 'kinh_nghiem_non_not', { reason: 'achievement' }).ok, true);
  assert.equal(combat.baseAtk, 9); // round(10 * 0.85)

  // Evolving with 0 wins must fail due to bach_chien_bat_bai acquisition requirement
  const evPremature = evolveTrait(world, id, 'kinh_nghiem_non_not', 'bach_chien_bat_bai', {
    reason: 'evolution',
  });
  assert.deepEqual(evPremature, { ok: false, reason: 'acquisition_conditions_not_met' });
  assert.equal(combat.baseAtk, 9);

  // Fulfill 100 challenging encounters won across >= 20 distinct opponents
  world.addComponent(
    id,
    new GrowthMindComponent({
      combatEncounterCount: 100,
      distinctOpponentIds: Array.from({ length: 20 }, (_, i) => 1000 + i),
      claimedMilestones: ['challenging_encounters_won'],
    })
  );

  const ev1 = evolveTrait(world, id, 'kinh_nghiem_non_not', 'bach_chien_bat_bai', {
    reason: 'evolution',
  });
  assert.deepEqual(ev1, { ok: true, changed: true });
  assert.equal(combat.baseAtk, 14); // 10 * 1.4, NOT 10 * 0.85 * 1.4

  // 2. Dragon bloodline chain on dragon beast
  const bWorld = new ECSWorld();
  const bId = bWorld.createEntity();
  bWorld.addComponent(bId, new RaceComponent('beast'));
  bWorld.addComponent(bId, new AppearanceComponent('beast_dragon_1', 'dragon', 'quadruped'));
  bWorld.addComponent(bId, new HealthComponent(200));
  bWorld.addComponent(bId, new LifespanComponent(20, 200));
  bWorld.addComponent(bId, new CombatStatsComponent(20, 10, 5));
  bWorld.addComponent(bId, new TraitsComponent());
  bWorld.addComponent(
    bId,
    new TalentProfileComponent({
      base: { comprehension: 30, aptitude: 61, physique: 60 },
      lineageTags: ['dragon'],
      knowledge: 'revealed',
    })
  );
  bWorld.addComponent(
    bId,
    new StatBaselineComponent({
      baseMaxHealth: 200,
      healthGrowthMultiplier: 7,
      baseLifespan: 200,
      lifespanGrowthMultiplier: 5,
      baseAttack: 20,
      baseDefense: 10,
      baseArmor: 5,
    })
  );

  const gLong = grantTrait(bWorld, bId, 'long_huyet_ba_the', { reason: 'birth' });
  assert.deepEqual(gLong, { ok: true, changed: true });
  assert.equal(bWorld.getComponent(bId, HealthComponent)!.max, 420); // 200 * 2.1

  const evDragon = evolveTrait(bWorld, bId, 'long_huyet_ba_the', 'to_long_chan_huyet', {
    reason: 'evolution',
  });
  assert.deepEqual(evDragon, { ok: true, changed: true });
  // Must be 200 * 2.7 = 540, NEVER 200 * 2.1 * 2.7 = 1134
  assert.equal(bWorld.getComponent(bId, HealthComponent)!.max, 540);
});

test('R04: HP ratio is preserved on max HP change and dead entities are never revived by rebuild', () => {
  const { world, id } = createTestHuman();
  const hp = world.getComponent(id, HealthComponent)!;
  hp.current = 40; // 40% of 100

  grantTrait(world, id, 'bat_diet_kim_than', { reason: 'birth' }); // hp x2.1 -> 210
  assert.equal(hp.max, 210);
  assert.equal(hp.current, 84); // 40% of 210

  // Kill entity and grant/remove traits
  hp.current = 0;
  hp.isDead = true;
  removeTrait(world, id, 'bat_diet_kim_than', { reason: 'godTool' });
  assert.equal(hp.isDead, true);
  assert.equal(hp.current, 0);
  assert.equal(hp.max, 100);
});

test('R05: heaven root and thien_linh_can trait apply root Qi factor only once (1.9x, never 5.7x)', () => {
  const { world, id } = createTestHuman();
  const root = world.getComponent(id, SpiritualRootComponent)!;
  root.rootType = 'heaven';
  root.purity = 100;
  root.isAwakened = true;

  grantTrait(world, id, 'thien_linh_can', { reason: 'birth' });

  const effects = resolveEntityTraitEffects(world, id);
  assert.equal(effects.primaryRootQiRateOverride, 1.9);
  assert.equal(effects.secondaryQiRateFactor, 1.0);
  assert.equal(getRootQiFactor(world, id, effects), 1.9);
  assert.equal(getEffectiveQiRateMultiplier(world, id, 1.0), 1.9);
});

test('R06: permanent lifespan pill adjustment persists across 100 trait rebuilds without loss or multiplication', () => {
  const { world, id } = createTestHuman();
  const life = world.getComponent(id, LifespanComponent)!;
  assert.equal(life.maxLifespan, 100);

  // Consume lifespan pill (+20 years)
  const applied = applyPermanentStatAdjustment(world, id, {
    id: 'pill_tho_nguyen_1',
    stat: 'lifespanYears',
    delta: 20,
    source: 'tho_nguyen_dan',
    day: 10,
  });
  assert.equal(applied, true);
  assert.equal(life.maxLifespan, 120);

  // Grant trait with lifespan +50 (bat_tu_tieu_cuong)
  grantTrait(world, id, 'bat_tu_tieu_cuong', { reason: 'birth' });
  assert.equal(life.maxLifespan, 170);

  // Rebuild 100 times
  for (let i = 0; i < 100; i++) {
    rebuildEntityStats(world, id);
  }
  assert.equal(life.maxLifespan, 170);

  // Remove trait -> permanent pill +20 remains!
  removeTrait(world, id, 'bat_tu_tieu_cuong', { reason: 'godTool' });
  assert.equal(life.maxLifespan, 120);
});

test('Bug 1 Regression: rebuildEntityStats at stageIndex = 3 never inflates ATK across repeated calls (100 -> 100 -> 100)', () => {
  // Case A: Entity without pre-existing StatBaselineComponent (inferred via ensureStatBaseline)
  const worldA = new ECSWorld();
  const idA = worldA.createEntity();
  worldA.addComponent(idA, new RaceComponent('human'));
  worldA.addComponent(idA, new RealmComponent('human_realms', 3, 'Trúc Cơ', 'Sơ Kỳ', 0, 500, 100, 0));
  worldA.addComponent(idA, new HealthComponent(12500));
  worldA.addComponent(idA, new LifespanComponent(30, 12500));
  worldA.addComponent(idA, new CombatStatsComponent(100, 20, 5, 1.0, 0.05, 0.05));
  worldA.addComponent(idA, new TraitsComponent());

  rebuildEntityStats(worldA, idA);
  const atkAfter1 = worldA.getComponent(idA, CombatStatsComponent)!.baseAtk;
  rebuildEntityStats(worldA, idA);
  const atkAfter2 = worldA.getComponent(idA, CombatStatsComponent)!.baseAtk;
  rebuildEntityStats(worldA, idA);
  const atkAfter3 = worldA.getComponent(idA, CombatStatsComponent)!.baseAtk;

  assert.equal(atkAfter1, 100);
  assert.equal(atkAfter2, 100);
  assert.equal(atkAfter3, 100);

  // Case B: Entity with pre-existing StatBaselineComponent (lastRebuiltStageIndex = -1 initially)
  const { world: worldB, id: idB } = createTestHuman();
  const realmB = worldB.getComponent(idB, RealmComponent)!;
  realmB.stageIndex = 3;
  const baselineB = worldB.getComponent(idB, StatBaselineComponent)!;
  baselineB.baseAttack = 100 / Math.pow(1.25, 3); // ~51.2 so scaled ATK at stage 3 is 100
  baselineB.lastRebuiltStageIndex = -1;

  rebuildEntityStats(worldB, idB);
  const bAtk1 = worldB.getComponent(idB, CombatStatsComponent)!.baseAtk;
  rebuildEntityStats(worldB, idB);
  const bAtk2 = worldB.getComponent(idB, CombatStatsComponent)!.baseAtk;
  rebuildEntityStats(worldB, idB);
  const bAtk3 = worldB.getComponent(idB, CombatStatsComponent)!.baseAtk;

  assert.equal(bAtk1, 100);
  assert.equal(bAtk2, 100);
  assert.equal(bAtk3, 100);
});

test('Bug 2 Regression: grantTrait and evolveTrait enforce acquisition predicates unless explicitly bypassed for migration', () => {
  const { world, id } = createTestHuman();

  // Granting dau_bep_than_cap to a resident who has never cooked must fail
  const cookRes = grantTrait(world, id, 'dau_bep_than_cap', { reason: 'achievement' });
  assert.deepEqual(cookRes, { ok: false, reason: 'acquisition_conditions_not_met' });
  assert.equal(resolveActiveTraits(world, id).some(t => t.id === 'dau_bep_than_cap'), false);

  // Granting kientruc_than_tuong without building milestone must fail
  const buildRes = grantTrait(world, id, 'kientruc_than_tuong', { reason: 'achievement' });
  assert.deepEqual(buildRes, { ok: false, reason: 'acquisition_conditions_not_met' });

  // Granting bach_chien_bat_bai without 100 combat encounters across >=20 distinct opponents must fail
  const combatRes = grantTrait(world, id, 'bach_chien_bat_bai', { reason: 'achievement' });
  assert.deepEqual(combatRes, { ok: false, reason: 'acquisition_conditions_not_met' });

  // Evolving from kinh_nghiem_non_not into bach_chien_bat_bai with 0 wins must also fail
  assert.deepEqual(grantTrait(world, id, 'kinh_nghiem_non_not', { reason: 'achievement' }), {
    ok: true,
    changed: true,
  });
  const evolveZeroWinsRes = evolveTrait(world, id, 'kinh_nghiem_non_not', 'bach_chien_bat_bai', {
    reason: 'evolution',
  });
  assert.deepEqual(evolveZeroWinsRes, { ok: false, reason: 'acquisition_conditions_not_met' });
  assert.equal(resolveActiveTraits(world, id).some(t => t.id === 'bach_chien_bat_bai'), false);
  assert.equal(resolveActiveTraits(world, id).some(t => t.id === 'kinh_nghiem_non_not'), true);

  // Granting loi_kiep_toi_the without tribulation_passed must fail
  const tribRes = grantTrait(world, id, 'loi_kiep_toi_the', { reason: 'achievement' });
  assert.deepEqual(tribRes, { ok: false, reason: 'acquisition_conditions_not_met' });

  // Migration context with legacyGrandfathered is still allowed to preserve old saves
  const migRes = grantTrait(world, id, 'dau_bep_than_cap', {
    reason: 'migration',
    legacyGrandfathered: true,
  });
  assert.deepEqual(migRes, { ok: true, changed: true });
});

console.log(`${passed} trait-runtime regression tests passed`);
