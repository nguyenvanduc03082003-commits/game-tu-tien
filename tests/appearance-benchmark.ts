import { performance } from 'node:perf_hooks';
import { ECSWorld } from '../src/ecs/World.ts';
import { WorldMap } from '../src/modules/world/WorldMap.ts';
import { QiGrid } from '../src/modules/energy/QiGrid.ts';
import { SpatialGrid } from '../src/core/SpatialGrid.ts';
import { TimeManager } from '../src/core/TimeManager.ts';
import { BeingFactory } from '../src/modules/beings/BeingFactory.ts';
import { PositionComponent } from '../src/modules/beings/BeingComponents.ts';
import { LifeStageSystem } from '../src/modules/beings/LifeStageSystem.ts';
import { ReproductionSystem } from '../src/modules/beings/ReproductionSystem.ts';
import { ThreeTierAISystem } from '../src/modules/ai/systems/ThreeTierAISystem.ts';
import { DiplomacySystem } from '../src/modules/factions/DiplomacySystem.ts';
import { CombatSystem } from '../src/modules/combat/CombatSystem.ts';
import { TribulationSystem } from '../src/modules/cultivation/TribulationSystem.ts';
import { CultivationSystem } from '../src/modules/cultivation/CultivationSystem.ts';
import { AnimationSystem } from '../src/renderer/systems/AnimationSystem.ts';
import { appearanceLayers } from '../src/renderer/systems/LayeredCharacterRenderer.ts';
import { AppearanceRegistry } from '../src/modules/appearance/Appearance.ts';

const stages = Object.fromEntries(
  ['child', 'adult', 'elder'].map(s => [s, { body: s + '/body', casual: s + '/casual' }])
);
AppearanceRegistry.instance.install({
  version: 1,
  appearances: [
    {
      id: 'benchmark',
      raceId: 'human',
      speciesId: 'human',
      bodyProfile: 'humanoid_standard',
      frameSize: 64,
      weight: 1,
      stages
    }
  ],
  equipment: [],
  diagnostics: []
} as any);

export function runBenchmarks(residentCounts: number[] = [100, 300], ticks: number = 40) {
  for (const count of residentCounts) {
    const world = new ECSWorld();
    const worldMap = new WorldMap(64, 64);
    const qiGrid = new QiGrid(64, 64);
    const spatialGrid = new SpatialGrid(32);
    const timeManager = TimeManager.getInstance();
    timeManager.reset();
    timeManager.setSpeed(1);

    const ids = Array.from({ length: count }, (_, idx) =>
      BeingFactory.spawnFromArchetype(
        world,
        idx % 3 === 0 ? 'rogue_cultivator' : 'mortal_human',
        16 + (idx % 48) * 16,
        16 + Math.floor(idx / 48) * 16
      )
    );

    const life = new LifeStageSystem();
    const animation = new AnimationSystem();
    const reproduction = new ReproductionSystem(() => 1);
    const tribulation = new TribulationSystem();
    const cultivation = new CultivationSystem(worldMap, qiGrid, tribulation);
    const ai = new ThreeTierAISystem(worldMap, qiGrid);
    ai.spatialGrid = spatialGrid;
    const diplomacy = new DiplomacySystem();
    diplomacy.spatialGrid = spatialGrid;
    const combat = new CombatSystem(worldMap, diplomacy);
    combat.spatialGrid = spatialGrid;

    const samples: number[] = [];
    for (let tick = 0; tick < ticks; tick++) {
      const before = performance.now();
      timeManager.stepSingleTick();
      const posEnts = world.query([PositionComponent]);
      spatialGrid.rebuild(
        posEnts.map(id => {
          const p = world.getComponent(id, PositionComponent)!;
          return { id, x: p.x, y: p.y };
        })
      );
      life.update(world);
      reproduction.update(world, 0.05);
      ai.update(world, 0.05);
      cultivation.update(world, 0.05);
      diplomacy.update(world, 0.05);
      combat.update(world, 0.05);
      animation.update(world, 0.05);
      for (const id of ids) appearanceLayers(world, id);
      samples.push(performance.now() - before);
    }
    samples.sort((a, b) => a - b);
    const summary = {
      residents: count,
      meanMs: +(samples.reduce((a, b) => a + b, 0) / samples.length).toFixed(3),
      p95Ms: +samples[Math.floor(samples.length * 0.95)].toFixed(3),
      scope: 'full simulation tick (SpatialGrid + AI + Cultivation + Diplomacy + Combat + Lifecycle + Appearance)'
    };
    console.log('BENCHMARK:', JSON.stringify(summary));
  }
}

runBenchmarks([100, 250], 30);

