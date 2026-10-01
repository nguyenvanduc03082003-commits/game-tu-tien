import { writeSocialBaseline, socialBaselineOutputPath } from './social-baseline-output.ts';
import { performance } from 'node:perf_hooks';
import { ECSWorld } from '../src/ecs/World.ts';
import { WorldMap } from '../src/modules/world/WorldMap.ts';
import { QiGrid } from '../src/modules/energy/QiGrid.ts';
import { TimeManager } from '../src/core/TimeManager.ts';
import { SeededRNG } from '../src/core/SeededRNG.ts';
import { SpatialGrid } from '../src/core/SpatialGrid.ts';
import { BeingFactory } from '../src/modules/beings/BeingFactory.ts';
import { PlantFactory } from '../src/modules/flora/PlantFactory.ts';
import { PlantGrowthSystem } from '../src/modules/flora/PlantGrowthSystem.ts';
import { ThreeTierAISystem } from '../src/modules/ai/systems/ThreeTierAISystem.ts';
import { NeedsSystem } from '../src/modules/ai/NeedsSystem.ts';
import { FactionSystem } from '../src/modules/factions/FactionSystem.ts';
import { FactionFactory } from '../src/modules/factions/FactionFactory.ts';
import { BuildingSystem } from '../src/modules/factions/BuildingSystem.ts';
import { DiplomacySystem } from '../src/modules/factions/DiplomacySystem.ts';
import { CombatSystem } from '../src/modules/combat/CombatSystem.ts';
import { CorpseAndGraveSystem } from '../src/modules/beings/CorpseAndGraveSystem.ts';
import { ProfessionSystem } from '../src/modules/professions/ProfessionSystem.ts';
import { SocialInteractionSystem } from '../src/modules/social/SocialInteractionSystem.ts';
import { SocialRelationshipComponent } from '../src/modules/social/SocialComponents.ts';
import { setSocialTelemetryEnabled, readSocialTelemetry } from '../src/modules/social/SocialSimulationTelemetry.ts';
import { PositionComponent, HealthComponent } from '../src/modules/beings/BeingComponents.ts';
import { FactionComponent, BuildingComponent, InsideBuildingComponent } from '../src/modules/factions/FactionComponents.ts';
import { AIPlannerComponent, AIStrategicBrainComponent } from '../src/modules/ai/brain/AIComponents.ts';
import { CommunityTaskBoard } from '../src/modules/ai/community/CommunityTaskBoard.ts';
import { SmartObjectManager } from '../src/modules/ai/smartobjects/SmartObjectManager.ts';
import { AStarPathfinder } from '../src/modules/ai/pathfinding/AStar.ts';
import { TerrainType } from '../src/config/terrains.config.ts';
const runs: any[] = [];
const outputPath = socialBaselineOutputPath('docs/so_lieu/QUAN_HE_XA_HOI_G6_INTEGRATION_BEFORE.json');
for (const seed of [11, 22, 33]) SeededRNG.withSeed(seed, () => {
  FactionFactory.reset(); CommunityTaskBoard.getInstance().clear(); SmartObjectManager.getInstance().clear(); AStarPathfinder.invalidateBuildingCache();
  const world = new ECSWorld(), map = new WorldMap(64, 64), qi = new QiGrid(64, 64), grid = new SpatialGrid(64);
  world.worldSeed = seed; world.setCurrentTick(0);
  const time = TimeManager.getInstance(); time.loadState({ totalTicks: 0, speed: 1, calendarEpochTick: 0, calendarEpochDays: 0, oldTicksPerDay: 400 });
  for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) {
    const tile = map.getTile(x, y)!; tile.terrain = x === 10 ? TerrainType.RIVER : TerrainType.PLAIN; tile.elevation = .3;
  }
  const ids = Array.from({ length: 30 }, (_, i) => BeingFactory.spawnFromArchetype(world, 'mortal_human', 380 + i % 6 * 18, 400 + Math.floor(i / 6) * 18));
  for (let i = 0; i < 80; i++) PlantFactory.spawnPlant(world, i % 2 ? 'berry_bush' : 'wild_fruit_tree', 250 + i % 10 * 38, 250 + Math.floor(i / 10) * 38, 'mature');
  const ai = new ThreeTierAISystem(map, qi), needs = new NeedsSystem(map), diplomacy = new DiplomacySystem();
  const faction = new FactionSystem(map, qi, diplomacy), social = new SocialInteractionSystem(), combat = new CombatSystem(map, diplomacy);
  ai.spatialGrid = grid; faction.spatialGrid = grid; social.spatialGrid = grid; combat.spatialGrid = grid;
  for (const system of [new ProfessionSystem(() => map), ai, needs, new CorpseAndGraveSystem(map), new PlantGrowthSystem(map, qi), combat, faction, diplomacy, new BuildingSystem(diplomacy), social]) world.addSystem(system);
  setSocialTelemetryEnabled(world, true);
  let firstFriend: number | null = null, firstBond: number | null = null, firstFaction: number | null = null;
  const snapshots: any[] = [], goalTicks: Record<string, number> = {}, plannerTicks: Record<string, number> = {};
  const goalSeconds: Record<string, number> = {}, plannerSeconds: Record<string, number> = {};
  const socialPlanTransitions: Record<string, number> = {}, previousPlans = new Map<number, string>();
  const started = performance.now();
  for (let tick = 1; tick <= 60 * 400; tick++) {
    time.stepSingleTick();
    grid.rebuild(world.query([PositionComponent]).filter(id => !world.hasComponent(id, InsideBuildingComponent)).map(id => ({ id, ...world.getComponent(id, PositionComponent)! })));
    // ThreeTierAISystem resets BehaviorTree/A* budgets each tick, as in Engine.
    world.update(.05);
    // Integrate post-tick state for living residents, rather than infer time from daily snapshots.
    for (const id of ids) {
      const hp = world.getComponent(id, HealthComponent);
      if (!hp || hp.isDead || hp.current <= 0) continue;
      const goal = world.getComponent(id, AIStrategicBrainComponent)?.currentGoal ?? 'missing';
      const status = world.getComponent(id, AIPlannerComponent)?.planStatus ?? 'missing';
      goalSeconds[goal] = (goalSeconds[goal] ?? 0) + .05;
      plannerSeconds[status] = (plannerSeconds[status] ?? 0) + .05;
      const signature = `${goal}:${status}`;
      const previous = previousPlans.get(id);
      if (signature !== previous && (goal === 'SOCIAL_RECREATE' || previous?.startsWith('SOCIAL_RECREATE:'))) {
        const key = `${previous ?? 'initial'}->${signature}`;
        socialPlanTransitions[key] = (socialPlanTransitions[key] ?? 0) + 1;
      }
      previousPlans.set(id, signature);
    }
    if (tick % 400 !== 0) continue;
    const living = ids.filter(id => { const hp = world.getComponent(id, HealthComponent); return hp && !hp.isDead && hp.current > 0; });
    let friends = 0, bondSides = 0, isolated = 0;
    for (const id of living) {
      const records = [...(world.getComponent(id, SocialRelationshipComponent)?.relationships.values() ?? [])];
      friends += records.filter(r => r.relationType === 'friend').length;
      bondSides += records.filter(r => r.bond?.status === 'active').length;
      if (!records.some(r => r.interactionsCount > 0)) isolated++;
      const goal = world.getComponent(id, AIStrategicBrainComponent)?.currentGoal ?? 'missing'; goalTicks[goal] = (goalTicks[goal] ?? 0) + 1;
      const status = world.getComponent(id, AIPlannerComponent)?.planStatus ?? 'missing'; plannerTicks[status] = (plannerTicks[status] ?? 0) + 1;
    }
    const day = tick / 400, factions = world.query([FactionComponent]).length;
    if (friends && firstFriend === null) firstFriend = day;
    if (bondSides && firstBond === null) firstBond = day;
    if (factions && firstFaction === null) firstFaction = day;
    if ([10, 30, 60].includes(day)) snapshots.push({ day, living: living.length, isolatedLiving: isolated, directedFriends: friends, activeBondPairs: bondSides / 2, factions, buildings: world.query([BuildingComponent]).length });
  }
  const telemetry = readSocialTelemetry(world);
  const record = { seed, days: 60, dt: .05, startingResidents: 30, firstFriendDay: firstFriend, firstBondDay: firstBond,
    firstFactionDay: firstFaction, snapshots, dailyGoalSamples: goalTicks, dailyPlannerSamples: plannerTicks,
    residentSimulationSecondsByGoal: goalSeconds, residentSimulationSecondsByPlannerStatus: plannerSeconds,
    socialPlanStateTransitions: socialPlanTransitions, counters: telemetry.counters,
    // Bounded recent trace only; not a complete plan history for the run.
    recentSocialPlanSamples: telemetry.samples.filter(sample => sample.category === 'social_plan'),
    executionMs: Math.round(performance.now() - started) };
  runs.push(record); console.log(JSON.stringify(record)); needs.destroy(); ai.destroy();
});
writeSocialBaseline(outputPath, {
  schemaVersion: 1, scope: 'AI + survival + social + combat + faction + construction + profession + flora + corpse integration; controlled plain map, 80 food plants, no weather/cultivation/reproduction/animals', runs,
  tickPerDay: TimeManager.TICKS_PER_DAY, secondsPerDayAt1x: 20,
  map: { width: 64, height: 64, elevation: .3, riverColumn: 10, matureFoodPlants: 80 },
  systems: ['ProfessionSystem', 'ThreeTierAISystem', 'NeedsSystem', 'CorpseAndGraveSystem', 'PlantGrowthSystem', 'CombatSystem', 'FactionSystem', 'DiplomacySystem', 'BuildingSystem', 'SocialInteractionSystem'],
});
