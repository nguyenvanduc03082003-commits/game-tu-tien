import assert from 'node:assert/strict';
import { ECSWorld } from '../src/ecs/World.ts';
import { TimeManager } from '../src/core/TimeManager.ts';
import type { Engine } from '../src/core/Engine.ts';
import { WorldMap } from '../src/modules/world/WorldMap.ts';
import { QiGrid } from '../src/modules/energy/QiGrid.ts';
import { WeatherType } from '../src/modules/weather/WeatherTypes.ts';
import { HealthComponent, LifespanComponent, PositionComponent, RaceComponent, RealmComponent, SpiritualRootComponent, DailyScheduleComponent, CharacterStateComponent, MortalNeedsComponent, NameComponent, ChildcareComponent } from '../src/modules/beings/BeingComponents.ts';
import { BuildingComponent, FactionComponent, MemberComponent, ResidenceComponent } from '../src/modules/factions/FactionComponents.ts';
import { FactionFactory } from '../src/modules/factions/FactionFactory.ts';
import { BuildingSystem } from '../src/modules/factions/BuildingSystem.ts';
import { ProfessionComponent, ProfessionStockComponent } from '../src/modules/professions/ProfessionComponents.ts';
import { PROFESSION_DEFINITIONS, PROFESSIONS_BY_ID, getProfessionRank } from '../src/config/professions.config.ts';
import { getProfessionEligibility, reviewProfession, planProfessionWork, completeProfessionBatch, recordProfessionWork, professionEfficiency, professionWorkBlockedReason } from '../src/modules/professions/ProfessionService.ts';
import { ProfessionSystem } from '../src/modules/professions/ProfessionSystem.ts';
import { validateProfessionSave } from '../src/modules/professions/ProfessionSaveCodec.ts';
import { AIStrategicBrainComponent, AIPlannerComponent, AIBehaviorTreeComponent, type PlanStep } from '../src/modules/ai/brain/AIComponents.ts';
import { BehaviorTreeExecutor } from '../src/modules/ai/brain/behavior/BehaviorTree.ts';
import { AIPlanner } from '../src/modules/ai/brain/planner/AIPlanner.ts';
import { StrategicGoalEvaluator } from '../src/modules/ai/brain/goals/StrategicGoal.ts';
import { SaveManager } from '../src/modules/save/SaveManager.ts';
import { renderProfessionPanel, renderProfessionStock } from '../src/ui/ProfessionPanel.ts';
import { AStarPathfinder } from '../src/modules/ai/pathfinding/AStar.ts';
import { TerrainType } from '../src/config/terrains.config.ts';
import { CombatStatsComponent } from '../src/modules/combat/CombatComponents.ts';
import type { GrowthEvent } from '../src/modules/talent/GrowthEvents.ts';

let passed = 0;
function test(name: string, fn: () => void) { fn(); passed++; console.log(`PASS profession: ${name}`); }
function fixture(profession = 'alchemist') {
  AStarPathfinder.invalidateBuildingCache();
  const world = new ECSWorld(), map = new WorldMap(40, 40);
  world.setCurrentTick(TimeManager.getInstance().getTotalTicks());
  const created = FactionFactory.createFaction(world, { type: 'sect', silent: true });
  const factionEntity = FactionFactory.findFactionEntity(world, created.factionId)!;
  const faction = world.getComponent(factionEntity, FactionComponent)!;
  const stock = world.addComponent(factionEntity, new ProfessionStockComponent());
  faction.herbStock = 20; faction.spiritStones = 20; faction.woodStock = 20; faction.stoneStock = 20;
  const settlement = FactionFactory.createSettlement(world, { ownerFactionId: faction.factionId, centerX: 120, centerY: 120 });
  const def = PROFESSIONS_BY_ID.get(profession)!;
  const building = FactionFactory.spawnBuilding(world, def.workplaces[0] ?? 'campfire', faction.factionId, 128, 128, settlement.settlementId, { instant: true });
  const id = world.createEntity();
  for (const component of [new NameComponent('Người thử nghề'), new RaceComponent('human'), new HealthComponent(100), new LifespanComponent(20, 80),
    new PositionComponent(120, 152), new RealmComponent('human_cultivation', 2, 'Trúc Cơ', 'Sơ Kỳ', 0, 100, 50),
    new SpiritualRootComponent(true, 'impure', 'Tạp linh căn', ['hoa', 'moc', 'kim', 'thuy', 'tho'], 30),
    new DailyScheduleComponent(def.job, 0), new CharacterStateComponent(), new MortalNeedsComponent(),
    new AIStrategicBrainComponent('LABOUR_WORK'), new AIPlannerComponent(), new AIBehaviorTreeComponent(),
    new MemberComponent(faction.factionId, 'outer_disciple'), new ResidenceComponent(settlement.settlementId, faction.factionId),
  ]) world.addComponent(id, component);
  faction.members.add(id);
  const career = world.addComponent(id, new ProfessionComponent());
  career.professionId = profession; career.workplaceId = building; career.skills[profession] = { xp: 0, completedJobs: 0 };
  const engine = { world, worldMap: map, qiGrid: new QiGrid(map.width, map.height), timeManager: TimeManager.getInstance(), camera: { x: 0, y: 0, zoom: 1 },
    worldName: 'Nghề nghiệp', worldTemplate: 'test', worldSeed: 1, spatialGrid: null, weatherSystem: null, threeTierAISystem: null,
    factionSystem: null, diplomacySystem: null } as unknown as Engine;
  return { world, map, faction, factionEntity, stock, building, id, career, def, engine };
}
function workStep(f: ReturnType<typeof fixture>): PlanStep {
  const steps = planProfessionWork(f.world, f.id, f.map);
  assert.ok(steps, `Expected executable work for ${f.def.id}`);
  const work = steps[1];
  const pos = f.world.getComponent(f.id, PositionComponent)!;
  Object.assign(pos, steps[0].targetPos);
  return work;
}
function complete(f: ReturnType<typeof fixture>, token = 'batch:1'): boolean {
  const step = workStep(f); step.customData.professionProgress = f.def.recipe!.seconds;
  return completeProfessionBatch(f.world, f.id, step, token, f.map);
}
function event(f: ReturnType<typeof fixture>, eventId = 'xp:1', domain = f.def.id): GrowthEvent {
  return { world: f.world, entityId: f.id, eventId, kind: 'work_completed', tick: f.world.getCurrentTick(), familyKey: `work:${domain}`, difficulty: 1, evidence: { professionDomain: domain, actualOutput: 1 } };
}

test('35 unique careers, 20 mortal and 15 cultivation; valid recipes', () => {
  assert.equal(PROFESSION_DEFINITIONS.length, 35); assert.equal(PROFESSIONS_BY_ID.size, 35);
  assert.equal(PROFESSION_DEFINITIONS.filter(d => d.branch === 'mortal').length, 20);
  assert.equal(PROFESSION_DEFINITIONS.filter(d => d.branch === 'cultivation').length, 15);
  for (const d of PROFESSION_DEFINITIONS) if (d.recipe) {
    assert.ok(d.recipe.seconds > 0 && d.workplaces.length > 0);
    for (const value of [...Object.values(d.recipe.inputs), ...Object.values(d.recipe.outputs)]) assert.ok(Number.isFinite(value) && value > 0);
  }
});

test('age 16 boundary, dead residents and animals cannot work; roots and realm both required', () => {
  const f = fixture();
  const age = f.world.getComponent(f.id, LifespanComponent)!;
  age.currentAge = 15.999; assert.ok(getProfessionEligibility(f.world, f.id, f.def));
  age.currentAge = 16; assert.equal(getProfessionEligibility(f.world, f.id, f.def), null);
  const root = f.world.getComponent(f.id, SpiritualRootComponent)!;
  root.elements = ['hoa']; assert.ok(getProfessionEligibility(f.world, f.id, f.def));
  root.elements = ['hoa', 'moc']; assert.equal(getProfessionEligibility(f.world, f.id, f.def), null);
  root.rootType = 'none'; assert.ok(getProfessionEligibility(f.world, f.id, f.def));
  assert.equal(getProfessionEligibility(f.world, f.id, PROFESSIONS_BY_ID.get('blacksmith')!), null);
  root.rootType = 'true'; root.isAwakened = false; assert.ok(getProfessionEligibility(f.world, f.id, f.def));
  root.isAwakened = true;
  f.world.getComponent(f.id, RealmComponent)!.stageIndex = 0; assert.ok(getProfessionEligibility(f.world, f.id, f.def));
  f.world.getComponent(f.id, RealmComponent)!.stageIndex = 1;
  f.world.getComponent(f.id, HealthComponent)!.isDead = true; assert.ok(getProfessionEligibility(f.world, f.id, f.def));
  f.world.getComponent(f.id, HealthComponent)!.isDead = false;
  f.world.getComponent(f.id, RaceComponent)!.raceId = 'animal'; reviewProfession(f.world, f.id, f.map);
  assert.ok(getProfessionEligibility(f.world, f.id, f.def));
});

test('sect service and demonic practice enforce affiliation', () => {
  const f = fixture('corpse_refiner');
  assert.ok(getProfessionEligibility(f.world, f.id, f.def));
  f.faction.alignment = 'demonic'; assert.equal(getProfessionEligibility(f.world, f.id, f.def), null);
  f.faction.type = 'village'; assert.ok(getProfessionEligibility(f.world, f.id, PROFESSIONS_BY_ID.get('sect_servant')!));
});

test('career reviews preserve skills, downgrade an invalid spiritual career and skip children', () => {
  const f = fixture(); f.career.skills.alchemist.xp = 105;
  f.world.getComponent(f.id, SpiritualRootComponent)!.rootType = 'none';
  reviewProfession(f.world, f.id, f.map);
  assert.equal(PROFESSIONS_BY_ID.get(f.career.professionId!)!.branch, 'mortal');
  assert.equal(f.career.skills.alchemist.xp, 105);
  const child = f.world.addComponent(f.id, new ChildcareComponent(true));
  reviewProfession(f.world, f.id, f.map); assert.equal(f.career.professionId, null);
  child.isChild = false;
  new ProfessionSystem(() => f.map).update(f.world, 0.05); assert.ok(f.career.professionId);
});

test('real work grants bounded XP once; exact rank boundary, failed/no-output and unrelated work', () => {
  const f = fixture();
  assert.equal(recordProfessionWork({ ...event(f), evidence: { actualOutput: 0, professionDomain: 'alchemist' } }), false);
  assert.equal(recordProfessionWork({ ...event(f), evidence: { actualOutput: Infinity, professionDomain: 'alchemist' } }), false);
  assert.equal(recordProfessionWork(event(f, 'xp:unknown', 'unknown')), false);
  assert.equal(recordProfessionWork(event(f)), true); assert.equal(recordProfessionWork(event(f)), false);
  for (let i = 0; i < 30; i++) recordProfessionWork(event(f, `daycap:${i}`));
  assert.equal(f.career.dailyXp, 40); assert.equal(f.career.skills.alchemist.xp, 40);
  assert.equal(getProfessionRank(99.999), 0); assert.equal(getProfessionRank(100), 1);
  f.career.skills.alchemist.xp = 100; assert.equal(professionEfficiency(f.world, f.id, 'alchemist'), 1.1);
  assert.equal(professionEfficiency(f.world, f.id, 'farm'), 1);
});

test('full behavior-tree sessions consume once at several frame sizes; canceled and remote work produce nothing', () => {
  for (const dt of [.05, .25, 1]) {
    const f = fixture(), step = workStep(f);
    const planner = f.world.getComponent(f.id, AIPlannerComponent)!;
    const bt = f.world.getComponent(f.id, AIBehaviorTreeComponent)!;
    planner.steps = [step]; planner.planStatus = 'executing'; planner.currentPlanGoal = 'LABOUR_WORK'; planner.planRevision = 17;
    const before = f.faction.pillStock;
    for (let t = 0; t < 14; t += dt) BehaviorTreeExecutor.tick(f.world, f.id, bt, planner, f.map, dt);
    assert.equal(f.faction.pillStock, before + 1); assert.equal(f.faction.herbStock, 17); assert.equal(f.faction.spiritStones, 19);
    assert.equal(f.career.skills.alchemist.completedJobs, 1); assert.ok(f.career.skills.alchemist.xp > 0);
    assert.equal(planner.planStatus, 'completed');
  }
  const f = fixture(), step = workStep(f);
  step.customData.professionProgress = 11.99;
  assert.equal(completeProfessionBatch(f.world, f.id, step, 'early', f.map), false);
  step.customData.professionProgress = 12; f.world.getComponent(f.id, PositionComponent)!.x = 600;
  assert.equal(completeProfessionBatch(f.world, f.id, step, 'remote', f.map), false); assert.equal(f.faction.herbStock, 20);
});

test('destruction, capture, reserved materials and stock races cannot create or steal output', () => {
  const f = fixture(), step = workStep(f); step.customData.professionProgress = 12;
  const b = f.world.getComponent(f.building, BuildingComponent)!;
  b.isRuins = true; assert.equal(completeProfessionBatch(f.world, f.id, step, 'ruin', f.map), false); b.isRuins = false;
  b.isUnderConstruction = true; assert.equal(completeProfessionBatch(f.world, f.id, step, 'site', f.map), false); b.isUnderConstruction = false;
  b.factionId = 'enemy'; assert.equal(completeProfessionBatch(f.world, f.id, step, 'capture', f.map), false); b.factionId = f.faction.factionId;
  f.faction.reservedResources.spiritStones = 20;
  assert.equal(completeProfessionBatch(f.world, f.id, step, 'reserved', f.map), false);
  f.faction.reservedResources.spiritStones = 0; f.faction.herbStock = 3; f.faction.spiritStones = 1;
  assert.equal(completeProfessionBatch(f.world, f.id, step, 'winner', f.map), true);
  assert.equal(completeProfessionBatch(f.world, f.id, step, 'loser', f.map), false);
  assert.equal(f.faction.herbStock, 0); assert.equal(f.faction.spiritStones, 0);
  f.faction.herbStock = 3; f.faction.spiritStones = 1;
  assert.equal(completeProfessionBatch(f.world, f.id, step, 'winner', f.map), false);
  assert.equal(f.faction.herbStock, 3);
});

test('production chains, stock capacity, physician demand, trade and study are functional', () => {
  const smith = fixture('blacksmith'); assert.equal(complete(smith), true); assert.equal(smith.stock.goods.metal, 1); assert.equal(smith.faction.stoneStock, 17);
  smith.stock.goods.metal = 100; assert.equal(planProfessionWork(smith.world, smith.id, smith.map), null);
  const doctor = fixture('physician'); doctor.stock.goods.prepared_herbs = 1;
  assert.equal(planProfessionWork(doctor.world, doctor.id, doctor.map), null);
  doctor.world.getComponent(doctor.id, HealthComponent)!.current = 60;
  assert.equal(complete(doctor), true); assert.equal(doctor.world.getComponent(doctor.id, HealthComponent)!.current, 70); assert.equal(doctor.stock.goods.prepared_herbs, 0);
  const trader = fixture('merchant'); trader.stock.goods.cloth = 6;
  const money = trader.faction.treasury; assert.equal(complete(trader), true); assert.equal(trader.stock.goods.cloth, 5); assert.equal(trader.faction.treasury, money + 3);
  assert.equal(planProfessionWork(trader.world, trader.id, trader.map), null);
  const study = fixture('beast_tamer'); study.career.skills.beast_tamer.xp = 349;
  assert.equal(recordProfessionWork(event(study)), true); assert.equal(study.career.skills.beast_tamer.xp, 350);
  assert.equal(planProfessionWork(study.world, study.id, study.map), null);
});

test('mining requires nearby mountains; workers cannot walk into an enclosed workplace', () => {
  const miner = fixture('miner'); assert.ok(professionWorkBlockedReason(miner.world, miner.id, miner.def, miner.building, miner.map));
  miner.map.getTile(10, 10)!.terrain = TerrainType.MOUNTAIN;
  assert.equal(professionWorkBlockedReason(miner.world, miner.id, miner.def, miner.building, miner.map), null);
  const f = fixture();
  for (let y = 5; y < 13; y++) for (let x = 5; x < 13; x++) f.map.getTile(x, y)!.terrain = TerrainType.OCEAN;
  assert.equal(planProfessionWork(f.world, f.id, f.map), null);
});

test('morning shift survives normal goal reevaluation but emergency combat interrupts', () => {
  const f = fixture(), brain = f.world.getComponent(f.id, AIStrategicBrainComponent)!, planner = f.world.getComponent(f.id, AIPlannerComponent)!;
  brain.currentGoal = 'SECLUDED_CULTIVATION';
  StrategicGoalEvaluator.evaluate(f.world, f.id, brain, f.map, f.engine.qiGrid, WeatherType.CLEAR, .3);
  assert.equal(brain.currentGoal, 'LABOUR_WORK');
  AIPlanner.planForGoal(f.world, f.id, brain.currentGoal, brain, planner, f.map, f.engine.qiGrid);
  assert.ok(planner.steps.some(s => s.customData?.professionId === 'alchemist'));
  StrategicGoalEvaluator.evaluate(f.world, f.id, brain, f.map, f.engine.qiGrid, WeatherType.CLEAR, .5);
  assert.equal(brain.currentGoal, 'LABOUR_WORK');
  const combat = f.world.addComponent(f.id, new CombatStatsComponent());
  const enemy = f.world.createEntity(); f.world.addComponent(enemy, new HealthComponent(100)); combat.targetEntityId = enemy;
  StrategicGoalEvaluator.evaluate(f.world, f.id, brain, f.map, f.engine.qiGrid, WeatherType.CLEAR, .3);
  assert.equal(brain.currentGoal, 'COMBAT_DEFENSE');
});

test('empty alchemy building cannot passively produce pills', () => {
  const f = fixture(), before = f.faction.pillStock;
  new BuildingSystem().update(f.world, 100);
  assert.equal(f.faction.pillStock, before); assert.equal(f.faction.herbStock, 20);
});

test('save/load preserves career, goods and replay protection; old saves initialize safely', () => {
  const f = fixture('blacksmith'); assert.equal(complete(f, 'saved:batch'), true); recordProfessionWork(event(f));
  const saved = SaveManager.serializeWorld(f.engine, 'Nghề nghiệp');
  const loaded = new ECSWorld(); SaveManager.deserializeWorld({ ...f.engine, world: loaded }, saved);
  assert.deepEqual(loaded.getComponent(f.id, ProfessionComponent), f.career);
  assert.deepEqual(loaded.getComponent(f.factionEntity, ProfessionStockComponent), f.stock);
  assert.equal(recordProfessionWork({ ...event(f), world: loaded }), false);
  const legacy = structuredClone(saved); for (const ent of legacy.entities) { delete ent.components.profession; delete ent.components.professionStock; }
  const legacyWorld = new ECSWorld(); SaveManager.deserializeWorld({ ...f.engine, world: legacyWorld }, legacy);
  assert.equal(legacyWorld.getComponent(f.id, ProfessionComponent)!.professionId, null);
  reviewProfession(legacyWorld, f.id, f.map); assert.ok(legacyWorld.getComponent(f.id, ProfessionComponent)!.professionId);
  const serialized = saved.entities.find(ent => ent.id === f.id)!.components;
  const malformed: Array<(c: any) => void> = [
    c => c.profession.skills.blacksmith.xp = NaN,
    c => c.profession.skills.blacksmith.completedJobs = -1,
    c => c.profession.professionId = '__proto__',
    c => c.profession.dailyXp = 41,
    c => c.profession.skills.blacksmith.xp = Infinity,
    c => c.profession.recentEventIds = Array(97).fill('a'),
    c => c.profession.workplaceId = -1,
    c => c.race.raceId = 'animal',
  ];
  for (const mutate of malformed) { const c = structuredClone(serialized); mutate(c); assert.throws(() => validateProfessionSave(f.id, c)); }
  const badSave = structuredClone(saved); badSave.entities.find(ent => ent.id === f.id)!.components.profession.skills.blacksmith.xp = Infinity;
  const before = JSON.stringify(loaded.getComponent(f.id, ProfessionComponent));
  assert.throws(() => SaveManager.deserializeWorld({ ...f.engine, world: loaded }, badSave));
  assert.equal(JSON.stringify(loaded.getComponent(f.id, ProfessionComponent)), before);
});

test('inspector shows actual career, learned ranks, limitations and escaped workshop names', () => {
  const f = fixture('beast_tamer'); f.world.getComponent(f.building, BuildingComponent)!.name = '<script>alert(1)</script>';
  const html = renderProfessionPanel(f.world, f.id); assert.ok(html.includes('Ngự thú sư')); assert.ok(html.includes('chưa có bắt giữ')); assert.ok(!html.includes('<script>'));
  f.stock.goods.cloth = 3; assert.ok(renderProfessionStock(f.world, f.faction.factionId).includes('Vải: 3'));
});

console.log(`${passed} profession regression groups passed`);
