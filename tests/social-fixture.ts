import { ECSWorld } from '../src/ecs/World.ts';
import { WorldMap } from '../src/modules/world/WorldMap.ts';
import { QiGrid } from '../src/modules/energy/QiGrid.ts';
import { TimeManager } from '../src/core/TimeManager.ts';
import { SpatialGrid } from '../src/core/SpatialGrid.ts';
import { PositionComponent, HealthComponent, NameComponent, LifespanComponent, CharacterStateComponent, RaceComponent, RealmComponent } from '../src/modules/beings/BeingComponents.ts';
import { SocialRelationshipComponent, MemoryComponent } from '../src/modules/social/SocialComponents.ts';
import { CombatStatsComponent } from '../src/modules/combat/CombatComponents.ts';
import { ResidentPersonalityComponent } from '../src/modules/ai/brain/ResidentPreferences.ts';
import { AIPlannerComponent } from '../src/modules/ai/brain/AIComponents.ts';
export function socialFixture() {
  const world = new ECSWorld(); world.setCurrentTick(0);
  world.timeState = { totalTicks: 0, speed: 1, calendarEpochDays: 0, calendarEpochTick: 0, oldTicksPerDay: 400 };
  const worldMap = new WorldMap(32, 32), qiGrid = new QiGrid(32, 32);
  const engine: any = { world, worldMap, qiGrid, spatialGrid: new SpatialGrid(32),
    timeManager: TimeManager.getInstance(), camera: { x: 0, y: 0, zoom: 1 },
    worldName: 'Social acceptance fixture', worldTemplate: 'dong_bang', worldSeed: 10301,
    resetWorldState() { world.clearEntities(); this.spatialGrid.clear(); } };
  function resident(x = 100, y = 100, sociability = 0.5) {
    const id = world.createEntity();
    for (const component of [new PositionComponent(x, y), new HealthComponent(100), new NameComponent(`Resident ${id}`),
      new LifespanComponent(25, 100), new CharacterStateComponent(), new RaceComponent('human'), new RealmComponent('human_realms', 0, 'Phàm Nhân', 'Bình Phàm', 0, 50, 10),
      new SocialRelationshipComponent(), new MemoryComponent(), new CombatStatsComponent(),
      new ResidentPersonalityComponent(sociability, .5, .5, .5), new AIPlannerComponent()]) world.addComponent(id, component);
    return id;
  }
  function pair(a: number, b: number, affinity = 80, trust = 70) {
    for (const [owner, target] of [[a, b], [b, a]]) {
      const record = world.getComponent(owner, SocialRelationshipComponent)!.ensureRelationship(target, `Resident ${target}`);
      Object.assign(record, { affinity, trust, respect: 70, interactionsCount: 10 });
    }
  }
  return { world, worldMap, qiGrid, engine, resident, pair };
}
