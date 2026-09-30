import assert from 'node:assert/strict';
import { ECSWorld } from '../src/ecs/World.ts';
import { WorldMap } from '../src/modules/world/WorldMap.ts';
import { QiGrid } from '../src/modules/energy/QiGrid.ts';
import { SeededRNG } from '../src/core/SeededRNG.ts';
import { resetEntityIdCounter } from '../src/ecs/Entity.ts';
import { TerrainType } from '../src/config/terrains.config.ts';
import { PositionComponent, HealthComponent } from '../src/modules/beings/BeingComponents.ts';
import { AnimalComponent } from '../src/modules/animals/AnimalComponents.ts';
import { PlantComponent } from '../src/modules/flora/PlantComponents.ts';
import { TreasureChestComponent, generateTreasureChests } from '../src/modules/treasure/TreasureChest.ts';
import { AnimalSpawnService } from '../src/modules/animals/AnimalSpawnService.ts';
import { AnimalAISystem } from '../src/modules/animals/AnimalAISystem.ts';
import { AnimalMovementSystem } from '../src/modules/animals/AnimalMovement.ts';
import { BehaviorTreeExecutor } from '../src/modules/ai/brain/behavior/BehaviorTree.ts';
import { AStarPathfinder } from '../src/modules/ai/pathfinding/AStar.ts';
import { AnimalLifecycleSystem } from '../src/modules/animals/AnimalLifecycleSystem.ts';
import { AnimalReproductionSystem } from '../src/modules/animals/AnimalReproductionSystem.ts';
import { AnimalCarcassSystem } from '../src/modules/animals/AnimalCarcassSystem.ts';
import { PlantFactory } from '../src/modules/flora/PlantFactory.ts';
import { PlantGrowthSystem } from '../src/modules/flora/PlantGrowthSystem.ts';

interface Snapshot { animals: number; fruitPlants: number; wood: number; chests: number }

function simulate(seed: number): Record<number, Snapshot> {
  resetEntityIdCounter();
  const world = new ECSWorld();
  const map = new WorldMap(64, 64);
  for (let y = 6; y < 58; y++) for (let x = 6; x < 58; x++) {
    if (x < 30 && y < 30) map.setTerrain(x, y, TerrainType.DENSE_FOREST);
  }
  const qi = new QiGrid(64, 64);
  const rng = new SeededRNG(seed);
  SeededRNG.withSeed(seed, initRng => {
    PlantFactory.generateInitialFlora(world, map, qi, initRng);
    AnimalSpawnService.populate(world, map, 18, initRng);
    generateTreasureChests(world, map, initRng, { x: 512, y: 512, radiusPx: 80 });
  });
  const ai = new AnimalAISystem(map, () => rng.next());
  const movement = new AnimalMovementSystem(map);
  const lifecycle = new AnimalLifecycleSystem();
  const reproduction = new AnimalReproductionSystem(map, () => rng.next());
  const carcass = new AnimalCarcassSystem();
  const plants = new PlantGrowthSystem(map, qi);
  const result: Record<number, Snapshot> = {};
  // Five seconds of simulation per game day. TimeManager speed scheduling is tested separately.
  for (let day = 1; day <= 360; day++) {
    for (let i = 0; i < 5; i++) {
      BehaviorTreeExecutor.beginTick();
      AStarPathfinder.resetTickBudget();
      ai.update(world, 1);
      movement.update(world, 1);
      lifecycle.update(world, 1);
      plants.update(world, 1);
      reproduction.update(world, 1);
      carcass.update(world, 1);
    }
    if (day === 30 || day === 180 || day === 360) {
      const living = world.query([AnimalComponent, HealthComponent]).filter(id => {
        const hp = world.getComponent(id, HealthComponent)!;
        return !hp.isDead && hp.current > 0;
      });
      const vegetation = world.query([PlantComponent]);
      result[day] = {
        animals: living.length,
        fruitPlants: vegetation.filter(id => world.getComponent(id, PlantComponent)!.hasFruit).length,
        wood: Math.round(vegetation.reduce((sum, id) => sum + world.getComponent(id, PlantComponent)!.woodRemaining, 0)),
        chests: world.query([PositionComponent, TreasureChestComponent]).length
      };
      for (const id of living) {
        const pos = world.getComponent(id, PositionComponent)!;
        assert.ok(map.isInBounds(Math.floor(pos.x / 16), Math.floor(pos.y / 16)));
      }
    }
  }
  return result;
}

const all: Array<{ seed: number; data: Record<number, Snapshot> }> = [];
for (let seed = 1; seed <= 10; seed++) {
  const base = simulate(seed);
  for (const day of [30, 180, 360]) {
    assert.ok(base[day].animals >= 5 && base[day].animals <= 200, `seed ${seed}, day ${day}: animal population collapsed`);
    assert.ok(base[day].fruitPlants > 0);
    assert.ok(base[day].wood >= 0);
    assert.ok(base[day].chests >= 1 && base[day].chests <= 8);
  }
  all.push({ seed, data: base });
}
console.log(`PASS ecosystem: 10 seeds × 30/180/360 simulated days; animal counts at day 360: ${all.map(item => item.data[360].animals).join(', ')}`);
