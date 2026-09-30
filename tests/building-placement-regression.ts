import assert from 'node:assert/strict';
import { ECSWorld } from '../src/ecs/World.ts';
import { WorldMap } from '../src/modules/world/WorldMap.ts';
import { TerrainType } from '../src/config/terrains.config.ts';
import { FactionFactory } from '../src/modules/factions/FactionFactory.ts';
import { validateBuildingPlacement } from '../src/modules/factions/BuildingPlacementRules.ts';
import { CommunityTaskBoard } from '../src/modules/ai/community/CommunityTaskBoard.ts';
import { FactionComponent } from '../src/modules/factions/FactionComponents.ts';
import { PositionComponent, CharacterStateComponent, MortalNeedsComponent } from '../src/modules/beings/BeingComponents.ts';
import { BuildingComponent, InsideBuildingComponent } from '../src/modules/factions/FactionComponents.ts';
import { AIBehaviorTreeComponent, AIPlannerComponent } from '../src/modules/ai/brain/AIComponents.ts';
import { BehaviorTreeExecutor } from '../src/modules/ai/brain/behavior/BehaviorTree.ts';
import { SmartObjectManager } from '../src/modules/ai/smartobjects/SmartObjectManager.ts';

const world = new ECSWorld();
const map = new WorldMap(40, 40);
const hut = FactionFactory.spawnBuilding(world, 'thatched_hut', '', 10 * 16, 10 * 16, undefined, { instant: true });

assert.equal(
  validateBuildingPlacement(world, map, 'thatched_hut', 12 * 16, 10 * 16).valid,
  true,
  'Nhà được xây sát nhà khi hai diện tích chỉ tiếp giáp'
);
assert.deepEqual(
  validateBuildingPlacement(world, map, 'thatched_hut', 10 * 16, 12 * 16),
  { valid: false, reason: 'too_close', blockingBuildingId: hut },
  'Không được xây nhà ngay trước cửa nhà đã có'
);
assert.deepEqual(
  validateBuildingPlacement(world, map, 'thatched_hut', 11 * 16, 10 * 16),
  { valid: false, reason: 'footprint_overlap', blockingBuildingId: hut },
  'Nhà bị từ chối khi chồng một ô lên nhà đã có'
);
assert.equal(
  validateBuildingPlacement(world, map, 'mortal_farm', 14 * 16, 10 * 16).valid,
  true,
  'Ruộng được đặt khi còn đúng hai ô trống sau nhà'
);
assert.equal(
  validateBuildingPlacement(world, map, 'mortal_farm', 13 * 16, 10 * 16).valid,
  false,
  'Ruộng bị từ chối khi chỉ còn một ô trống sau nhà'
);
assert.equal(
  validateBuildingPlacement(world, map, 'thatched_hut', 39 * 16, 10 * 16).valid,
  false,
  'Nhà 2x2 bị từ chối nếu footprint vượt mép bản đồ'
);

map.setTerrain(20, 20, TerrainType.LAKE);
assert.deepEqual(
  validateBuildingPlacement(world, map, 'campfire', 20 * 16, 20 * 16),
  { valid: false, reason: 'blocked_terrain' },
  'Không cho xây công trình trên hồ'
);

const faction = FactionFactory.createFaction(world, { type: 'hamlet' });
const factionComp = faction.comp as FactionComponent;
factionComp.woodStock = 100;
const board = CommunityTaskBoard.getInstance();
board.clear();
const reservedWoodBefore = factionComp.reservedResources.wood;
const rejectedTask = board.createBuildingTask(
  world,
  map,
  'mortal_farm',
  faction.factionId,
  { x: 13 * 16, y: 10 * 16 }
);
assert.equal(rejectedTask, null, 'Task xây dựng ở vị trí vi phạm khoảng cách phải bị từ chối');
assert.equal(factionComp.reservedResources.wood, reservedWoodBefore, 'Vị trí bị từ chối không được giữ vật tư');

const sleepWorld = new ECSWorld();
const sleepMap = new WorldMap(30, 30);
SmartObjectManager.getInstance().clear();
const home = FactionFactory.spawnBuilding(sleepWorld, 'thatched_hut', '', 8 * 16, 8 * 16, undefined, { instant: true });
const homeBuilding = sleepWorld.getComponent(home, BuildingComponent)!;
const homePos = sleepWorld.getComponent(home, PositionComponent)!;
SmartObjectManager.getInstance().registerBuilding(home, homeBuilding, homePos);
const resident = sleepWorld.createEntity();
const residentPos = new PositionComponent(homePos.x + 40, homePos.y + 50);
sleepWorld.addComponent(resident, residentPos);
sleepWorld.addComponent(resident, new CharacterStateComponent());
sleepWorld.addComponent(resident, new MortalNeedsComponent(90, 50, 90));
sleepWorld.addComponent(resident, new AIBehaviorTreeComponent());
const planner = new AIPlannerComponent();
planner.steps = [{ type: 'SLEEP_REST', description: 'sleep', duration: 1 }];
planner.planStatus = 'executing';
sleepWorld.addComponent(resident, planner);
assert.equal(SmartObjectManager.getInstance().reserve(`building_${home}`, resident, 0, 'sleep_rest'), true);
BehaviorTreeExecutor.tick(sleepWorld, resident, sleepWorld.getComponent(resident, AIBehaviorTreeComponent)!, planner, sleepMap, 0.1);
assert.equal(sleepWorld.hasComponent(resident, InsideBuildingComponent), true, 'Cư dân ngủ trong nhà được đánh dấu ở bên trong');
assert.equal(residentPos.x, homePos.x + homeBuilding.widthTiles * 8, 'Cư dân chuyển vào vị trí bên trong nhà');
BehaviorTreeExecutor.tick(sleepWorld, resident, sleepWorld.getComponent(resident, AIBehaviorTreeComponent)!, planner, sleepMap, 1.0);
assert.equal(sleepWorld.hasComponent(resident, InsideBuildingComponent), false, 'Cư dân được hiện lại khi thức dậy');
assert.equal(residentPos.y, homePos.y + homeBuilding.heightTiles * 16 + 10, 'Cư dân xuất hiện ở phía ngoài cửa nhà');

console.log('PASS building-placement-and-housing: footprint, clearance, doors, indoor sleep and waking');
