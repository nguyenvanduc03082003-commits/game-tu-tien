import assert from 'node:assert/strict';
import { ECSWorld } from '../src/ecs/World.ts';
import { WorldMap } from '../src/modules/world/WorldMap.ts';
import { QiGrid } from '../src/modules/energy/QiGrid.ts';
import { Engine } from '../src/core/Engine.ts';
import { TimeManager } from '../src/core/TimeManager.ts';
import { HealthComponent, PositionComponent, DailyScheduleComponent } from '../src/modules/beings/BeingComponents.ts';
import { ResidenceComponent } from '../src/modules/factions/FactionComponents.ts';
import { FactionFactory } from '../src/modules/factions/FactionFactory.ts';
import { SmartObjectManager } from '../src/modules/ai/smartobjects/SmartObjectManager.ts';
import { SaveManager } from '../src/modules/save/SaveManager.ts';

function engineStub(world: ECSWorld): Engine {
  const worldMap = new WorldMap(16, 16);
  return { world, worldMap, qiGrid: new QiGrid(16, 16), timeManager: TimeManager.getInstance(),
    camera: { x: 0, y: 0, zoom: 1 }, worldName: 'Nhà ở', worldTemplate: 'test', worldSeed: 1,
    spatialGrid: null, weatherSystem: null, threeTierAISystem: null, factionSystem: null,
    diplomacySystem: null } as unknown as Engine;
}

const world = new ECSWorld();
SmartObjectManager.getInstance().clear();
const faction = FactionFactory.createFaction(world, { type: 'hamlet', silent: true });
const settlement = FactionFactory.createSettlement(world, { ownerFactionId: faction.factionId, centerX: 64, centerY: 64 });
const home = FactionFactory.spawnBuilding(world, 'thatched_hut', faction.factionId, 64, 64, settlement.settlementId, { instant: true });
const people: number[] = [];
for (let i = 0; i < 4; i++) {
  const person = world.createEntity();
  world.addComponent(person, new PositionComponent(64, 64));
  world.addComponent(person, new HealthComponent(100));
  world.addComponent(person, new DailyScheduleComponent('builder', 0));
  people.push(person);
}
for (const person of people.slice(0, 3)) {
  assert.equal(FactionFactory.assignResidence(world, person, settlement.settlementId, home), true);
}
assert.deepEqual(FactionFactory.getHomeOccupancy(world, home), { occupied: 3, capacity: 3 });
assert.equal(FactionFactory.assignResidence(world, people[3], settlement.settlementId, home), false);
assert.equal(world.hasComponent(people[3], ResidenceComponent), false);
FactionFactory.assignResidence(world, people[3], settlement.settlementId, faction.factionId);
assert.equal(world.getComponent(people[3], ResidenceComponent)!.homeBuildingEntityId, null);
console.log('PASS housing: three residents fit; fourth remains unhoused');

const manager = SmartObjectManager.getInstance();
const sleeping = manager.findBestAvailableObject({ x: 64, y: 64 }, 'sleep_rest', 100)!;
assert.ok(sleeping);
assert.equal(manager.reserve(sleeping.object.id, people[0], sleeping.slotIndex, 'sleep_rest'), true);
assert.equal(manager.reserve(sleeping.object.id, people[1], sleeping.slotIndex, 'sleep_rest'), false);
console.log('PASS housing: one sleep slot cannot be held by two residents');

world.getComponent(people[0], HealthComponent)!.isDead = true;
FactionFactory.pruneInvalidHomes(world);
assert.equal(world.getComponent(people[0], ResidenceComponent)!.homeBuildingEntityId, null);
assert.equal(FactionFactory.assignHome(world, people[3], home), true);
assert.deepEqual(FactionFactory.getHomeOccupancy(world, home), { occupied: 3, capacity: 3 });
console.log('PASS housing: deceased resident releases capacity');

const save = SaveManager.serializeWorld(engineStub(world), 'Nhà ở');
const loaded = new ECSWorld();
SaveManager.deserializeWorld(engineStub(loaded), save);
assert.deepEqual(FactionFactory.getHomeOccupancy(loaded, home), { occupied: 3, capacity: 3 });
assert.equal(loaded.getComponent(people[0], ResidenceComponent)!.homeBuildingEntityId, null);
console.log('PASS housing: save/load preserves legal occupancy');

FactionFactory.leaveResidence(loaded, people[1]);
assert.equal(FactionFactory.getHomeOccupancy(loaded, home).occupied, 2);
const site = FactionFactory.startConstruction(loaded, 'thatched_hut', faction.factionId, 80, 80, settlement.settlementId);
assert.equal(FactionFactory.assignHome(loaded, people[3], site), false);
console.log('PASS housing: moving away frees capacity; construction site cannot house anyone');
