import assert from 'node:assert/strict';
import { ECSWorld } from '../src/ecs/World.ts';
import { WorldMap } from '../src/modules/world/WorldMap.ts';
import { QiGrid } from '../src/modules/energy/QiGrid.ts';
import { SeededRNG } from '../src/core/SeededRNG.ts';
import { TimeManager } from '../src/core/TimeManager.ts';
import { Engine } from '../src/core/Engine.ts';
import { HealthComponent, PositionComponent, CharacterStateComponent } from '../src/modules/beings/BeingComponents.ts';
import { InventoryComponent } from '../src/modules/alchemy/InventoryComponent.ts';
import { AnimalComponent } from '../src/modules/animals/AnimalComponents.ts';
import { TreasureChestComponent, generateTreasureChests, openTreasureChest } from '../src/modules/treasure/TreasureChest.ts';
import { SaveManager } from '../src/modules/save/SaveManager.ts';
import { AIStrategicBrainComponent, AIPlannerComponent, AIBehaviorTreeComponent } from '../src/modules/ai/brain/AIComponents.ts';
import { AIPlanner } from '../src/modules/ai/brain/planner/AIPlanner.ts';
import { BehaviorTreeExecutor } from '../src/modules/ai/brain/behavior/BehaviorTree.ts';

function stub(world: ECSWorld, map: WorldMap): Engine {
  return { world, worldMap: map, qiGrid: new QiGrid(map.width, map.height),
    timeManager: TimeManager.getInstance(), camera: { x: 0, y: 0, zoom: 1 },
    worldName: 'Rương', worldTemplate: 'test', worldSeed: 2026,
    spatialGrid: null, weatherSystem: null, threeTierAISystem: null,
    factionSystem: null, diplomacySystem: null } as unknown as Engine;
}

const map = new WorldMap(360, 360);
const world = new ECSWorld();
const chests = generateTreasureChests(world, map, new SeededRNG(2026),
  { x: 2880, y: 2880, radiusPx: 180 });
assert.ok(chests.length >= 4 && chests.length <= 8);
const snapshot = chests.map(id => {
  const pos = world.getComponent(id, PositionComponent)!;
  const chest = world.getComponent(id, TreasureChestComponent)!;
  assert.ok(Math.hypot(pos.x - 2880, pos.y - 2880) >= 180);
  return { x: pos.x, y: pos.y, loot: chest.loot };
});
for (let i = 0; i < snapshot.length; i++) for (let j = i + 1; j < snapshot.length; j++) {
  assert.ok(Math.hypot(snapshot[i].x - snapshot[j].x, snapshot[i].y - snapshot[j].y) >= 576);
}
const secondWorld = new ECSWorld();
const second = generateTreasureChests(secondWorld, new WorldMap(360, 360), new SeededRNG(2026),
  { x: 2880, y: 2880, radiusPx: 180 });
assert.deepEqual(second.map(id => {
  const pos = secondWorld.getComponent(id, PositionComponent)!;
  return { x: pos.x, y: pos.y, loot: secondWorld.getComponent(id, TreasureChestComponent)!.loot };
}), snapshot);
console.log('PASS treasure: rare chest budget, spacing, start exclusion and seed determinism');

const id = chests[0];
const pos = world.getComponent(id, PositionComponent)!;
const actor = world.createEntity();
world.addComponent(actor, new PositionComponent(pos.x + 50, pos.y));
world.addComponent(actor, new HealthComponent(100));
assert.equal(openTreasureChest(world, id, actor).success, false);
assert.equal(world.getComponent(id, TreasureChestComponent)!.opened, false);
world.getComponent(actor, PositionComponent)!.x = pos.x;
const animal = world.createEntity();
world.addComponent(animal, new PositionComponent(pos.x, pos.y));
world.addComponent(animal, new HealthComponent(100));
world.addComponent(animal, new AnimalComponent('rabbit'));
assert.equal(openTreasureChest(world, id, animal).success, false);
assert.equal(world.getComponent(id, TreasureChestComponent)!.opened, false);
const inventory = world.addComponent(actor, new InventoryComponent());
inventory.addPill('kim_sang_dan', 20);
assert.equal(openTreasureChest(world, id, actor).reason, 'Túi đan đã đầy');
assert.equal(world.getComponent(id, TreasureChestComponent)!.opened, false);
inventory.pills.clear();
const first = openTreasureChest(world, id, actor);
assert.equal(first.success, true);
assert.equal(openTreasureChest(world, id, actor).success, false);
assert.equal([...inventory.pills.values()].reduce((a, b) => a + b, 0), first.loot!.reduce((a, b) => a + b.count, 0));
console.log('PASS treasure: distance, full bag, one-time opening and atomic transfer');

const save = SaveManager.serializeWorld(stub(world, map), 'Rương');
const loaded = new ECSWorld();
SaveManager.deserializeWorld(stub(loaded, new WorldMap(360, 360)), save);
assert.equal(loaded.getComponent(id, TreasureChestComponent)!.opened, true);
assert.equal(loaded.getComponent(chests[1], TreasureChestComponent)!.opened, false);
assert.deepEqual(loaded.getComponent(chests[1], TreasureChestComponent)!.loot,
  world.getComponent(chests[1], TreasureChestComponent)!.loot);
const bad = structuredClone(save);
const chestEntity = bad.entities.find(ent => ent.id === chests[1])!;
chestEntity.components.treasureChest.loot[0].pillId = 'invalid_pill';
assert.throws(() => SaveManager.deserializeWorld(stub(loaded, new WorldMap(360, 360)), bad), /Rương/);
assert.equal(loaded.getComponent(id, TreasureChestComponent)!.opened, true);
console.log('PASS treasure: save/load and invalid loot rejected before commit');

const aiWorld = new ECSWorld();
const aiChest = aiWorld.createEntity();
aiWorld.addComponent(aiChest, new PositionComponent(64, 64));
aiWorld.addComponent(aiChest, new TreasureChestComponent([{ pillId: 'kim_sang_dan', count: 1 }]));
const explorer = aiWorld.createEntity();
aiWorld.addComponent(explorer, new PositionComponent(64, 64, 0));
aiWorld.addComponent(explorer, new HealthComponent(100));
aiWorld.addComponent(explorer, new CharacterStateComponent());
const brain = aiWorld.addComponent(explorer, new AIStrategicBrainComponent('WANDER_SERENDIPITY'));
const planner = aiWorld.addComponent(explorer, new AIPlannerComponent());
const behavior = aiWorld.addComponent(explorer, new AIBehaviorTreeComponent());
const aiMap = new WorldMap(16, 16);
AIPlanner.planForGoal(aiWorld, explorer, 'WANDER_SERENDIPITY', brain, planner, aiMap, new QiGrid(16, 16));
assert.ok(planner.steps.some(step => step.customData?.action === 'open_chest'));
planner.steps = planner.steps.filter(step => step.customData?.action === 'open_chest');
planner.currentStepIndex = 0;
planner.stepElapsedTimer = 0;
BehaviorTreeExecutor.tick(aiWorld, explorer, behavior, planner, aiMap, 0.05);
assert.equal(aiWorld.getComponent(aiChest, TreasureChestComponent)!.opened, true);
console.log('PASS treasure: wandering AI discovers and opens nearby chest through shared service');
