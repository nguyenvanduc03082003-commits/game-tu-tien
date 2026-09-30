import assert from 'node:assert/strict';
import { ECSWorld } from '../src/ecs/World.ts';
import { WorldMap } from '../src/modules/world/WorldMap.ts';
import { QiGrid } from '../src/modules/energy/QiGrid.ts';
import {
  PositionComponent,
  HealthComponent,
  MortalNeedsComponent,
  CharacterStateComponent,
  NameComponent,
  HungerComponent,
  RaceComponent,
  LifespanComponent
} from '../src/modules/beings/BeingComponents.ts';
import {
  AIPlannerComponent,
  AIBehaviorTreeComponent
} from '../src/modules/ai/brain/AIComponents.ts';
import { BehaviorTreeExecutor } from '../src/modules/ai/brain/behavior/BehaviorTree.ts';
import { SmartObjectManager } from '../src/modules/ai/smartobjects/SmartObjectManager.ts';
import { CommunityTaskBoard } from '../src/modules/ai/community/CommunityTaskBoard.ts';
import { FactionFactory } from '../src/modules/factions/FactionFactory.ts';
import { FactionSystem } from '../src/modules/factions/FactionSystem.ts';
import { DiplomacySystem } from '../src/modules/factions/DiplomacySystem.ts';
import {
  BuildingComponent,
  ConstructionSiteComponent,
  FoundingIntentComponent,
  FactionComponent,
  SettlementComponent,
  TerritoryCenterComponent
} from '../src/modules/factions/FactionComponents.ts';
import { SaveManager } from '../src/modules/save/SaveManager.ts';
import { Engine } from '../src/core/Engine.ts';
import { TimeManager } from '../src/core/TimeManager.ts';
import { NeedsSystem } from '../src/modules/ai/NeedsSystem.ts';
import { ReproductionSystem } from '../src/modules/beings/ReproductionSystem.ts';
import { FamilyComponent } from '../src/modules/beings/FamilyComponent.ts';

function test(name: string, fn: () => void) {
  fn();
  console.log('PASS construction-audit:', name);
}

function createTestMap(w = 16, h = 16): WorldMap {
  return new WorldMap(w, h);
}

function createEngineStub(world: ECSWorld, map: WorldMap): Engine {
  return {
    world,
    worldMap: map,
    qiGrid: new QiGrid(map.width, map.height),
    spatialGrid: null,
    weatherSystem: null,
    threeTierAISystem: null,
    factionSystem: null,
    diplomacySystem: null,
    timeManager: TimeManager.getInstance(),
    eventBus: null,
    isPaused: false,
    camera: { x: 50, y: 50, zoom: 1.5 },
    renderer: null,
    worldName: 'Thế Giới Tu Tiên',
    worldTemplate: 'thap_van_dai_son',
    worldSeed: 12345,
    systems: [],
    update: () => {},
    render: () => {},
    start: () => {},
    stop: () => {},
    initNewWorld: async () => {},
    resetWorldState: () => {},
    resetTimeState: () => {},
    handleVisibilityChange: () => {},
    loadGameData: () => {},
    serializeWorld: () => ({} as any),
    deserializeWorld: () => {}
  } as unknown as Engine;
}

test('Neutral founding site survives save/load and requires completed worker progress', () => {
  const board = CommunityTaskBoard.getInstance();
  board.clear();
  const world = new ECSWorld();
  const participants: number[] = [];
  for (let i = 0; i < 10; i++) {
    const person = world.createEntity();
    world.addComponent(person, new PositionComponent(64 + i, 64));
    world.addComponent(person, new RaceComponent('human'));
    world.addComponent(person, new HealthComponent(100));
    world.addComponent(person, new LifespanComponent(20, 90));
    participants.push(person);
  }
  const founder = participants[0];
  const intent = new FoundingIntentComponent('hamlet', 'building', 'Lập xóm', 60, participants);
  world.addComponent(founder, intent);
  const task = board.createTask({
    type: 'found_campfire', title: 'Khởi dựng Lửa Trại', targetPos: { x: 64, y: 64 },
    preferredJob: 'builder', priority: 90, duration: 4,
    foundingIntentId: 'intent_test', founderEntityId: founder
  }, world)!;
  assert.ok(task?.targetEntityId !== undefined);
  intent.taskId = task.id;
  board.assignTaskToEntity(task.id, founder);
  const site = world.getComponent(task.targetEntityId!, ConstructionSiteComponent)!;
  assert.equal(site.founderEntityId, founder);
  site.completedWorkTicks = site.requiredWorkTicks / 2;
  board.completeTask(world, founder, task.id);
  assert.equal(world.query([FactionComponent]).length, 0);

  const saved = SaveManager.serializeWorld(createEngineStub(world, createTestMap()), 'Founding site');
  const loaded = new ECSWorld();
  board.clear();
  SaveManager.deserializeWorld(createEngineStub(loaded, createTestMap()), saved);
  const restoredIntent = loaded.getComponent(founder, FoundingIntentComponent);
  const restoredTask = board.getAllTasks().find(t => t.targetEntityId === task.targetEntityId);
  assert.ok(restoredIntent && restoredTask);
  assert.equal(restoredIntent.taskId, restoredTask.id);
  const restoredSite = loaded.getComponent(task.targetEntityId!, ConstructionSiteComponent)!;
  assert.equal(restoredSite.completedWorkTicks, site.completedWorkTicks);
  board.assignTaskToEntity(restoredTask.id, founder);
  restoredSite.completedWorkTicks = restoredSite.requiredWorkTicks;
  board.completeTask(loaded, founder, restoredTask.id);
  assert.equal(loaded.query([FactionComponent]).length, 1);
  assert.equal(loaded.getComponent(task.targetEntityId!, BuildingComponent)!.isUnderConstruction, false);
});

// 1. SmartObject affordance isolation: Under-construction buildings provide NO affordances
test('Under-construction buildings provide no affordances and unregister on cancellation', () => {
  const world = new ECSWorld();
  const smartObjects = SmartObjectManager.getInstance();
  smartObjects.clear();

  const factionRes = FactionFactory.createFaction(world, {
    customName: 'Thôn Thử Nghiệm',
    type: 'hamlet',
    silent: true
  });
  const factionId = factionRes.comp.id;

  // Khởi công lều tranh và ruộng lúa đang thi công
  const hutEnt = FactionFactory.startConstruction(world, 'thatched_hut', factionId, 50, 50);
  const farmEnt = FactionFactory.startConstruction(world, 'mortal_farm', factionId, 80, 80);

  // Không được cung cấp affordance ngủ hay làm ruộng
  assert.equal(smartObjects.findBestAvailableObject({ x: 50, y: 50 }, 'sleep_rest', 100), null,
    'Under-construction hut must not provide sleep_rest affordance');
  assert.equal(smartObjects.findBestAvailableObject({ x: 80, y: 80 }, 'farm_work', 100), null,
    'Under-construction farm must not provide farm_work affordance');

  // Sau khi syncFromWorld, vẫn không được đăng ký
  smartObjects.syncFromWorld(world);
  assert.equal(smartObjects.findBestAvailableObject({ x: 50, y: 50 }, 'sleep_rest', 100), null,
    'syncFromWorld must not register under-construction buildings');

  // Hoàn tất lều tranh -> Giờ mới cung cấp sleep_rest
  const completedHutSite = world.getComponent(hutEnt, ConstructionSiteComponent)!;
  completedHutSite.completedWorkTicks = completedHutSite.requiredWorkTicks;
  FactionFactory.completeBuilding(world, hutEnt);
  const hutObj = smartObjects.findBestAvailableObject({ x: 50, y: 50 }, 'sleep_rest', 100);
  assert.ok(hutObj !== null, 'Completed hut must provide sleep_rest affordance');
  assert.equal(hutObj!.object.entityId, hutEnt);

  // Hủy ruộng lúa đang thi công -> Đảm bảo unregister sạch sẽ
  FactionFactory.cancelConstruction(world, farmEnt, factionId);
  assert.equal(smartObjects.getAllObjects().some(o => o.entityId === farmEnt), false,
    'Cancelled construction must be unregistered from SmartObjectManager');
});

// 2. Dual construction sites reservation isolation: Complete A then cancel B refunds correctly
test('Dual construction sites reservation isolation: completing A and cancelling B yields exact refund', () => {
  const world = new ECSWorld();
  const factionRes = FactionFactory.createFaction(world, {
    customName: 'Mộc Diệp Phái',
    type: 'hamlet',
    silent: true
  });
  const fComp = factionRes.comp;
  fComp.woodStock = 100;
  fComp.stoneStock = 50;

  // Site A: Lều tranh (30 gỗ, 10 đá)
  const costA = { wood: 30, stone: 10 };
  const okA = FactionFactory.reserveResources(world, fComp.id, costA);
  assert.ok(okA);
  const siteA = FactionFactory.startConstruction(world, 'thatched_hut', fComp.id, 40, 40, undefined, costA);

  // Site B: Giếng làng (20 gỗ, 15 đá)
  const costB = { wood: 20, stone: 15 };
  const okB = FactionFactory.reserveResources(world, fComp.id, costB);
  assert.ok(okB);
  const siteB = FactionFactory.startConstruction(world, 'village_well', fComp.id, 60, 60, undefined, costB);

  // Kiểm tra trạng thái kho sau khi đặt cọc cả 2
  assert.equal(fComp.woodStock, 50, 'Remaining wood: 100 - 30 - 20 = 50');
  assert.equal(fComp.stoneStock, 25, 'Remaining stone: 50 - 10 - 15 = 25');
  assert.equal(fComp.reservedResources.wood, 50, 'Reserved wood: 30 + 20 = 50');
  assert.equal(fComp.reservedResources.stone, 25, 'Reserved stone: 10 + 15 = 25');

  // Hoàn tất Site A
  const progressA = world.getComponent(siteA, ConstructionSiteComponent)!;
  progressA.completedWorkTicks = progressA.requiredWorkTicks;
  FactionFactory.completeBuilding(world, siteA);
  assert.equal(fComp.reservedResources.wood, 20, 'Site A consumed: reserved wood is now 20 (belongs to B)');
  assert.equal(fComp.reservedResources.stone, 15, 'Site A consumed: reserved stone is now 15 (belongs to B)');
  assert.equal(fComp.woodStock, 50, 'Stock remains 50');
  assert.equal(fComp.stoneStock, 25, 'Stock remains 25');

  // completeBuilding phải idempotent: gọi lần 2 không trừ thêm tài nguyên
  FactionFactory.completeBuilding(world, siteA);
  assert.equal(fComp.reservedResources.wood, 20);
  assert.equal(fComp.woodStock, 50);

  // Hủy Site B -> Phải hoàn trả trọn vẹn 20 gỗ, 15 đá của B!
  FactionFactory.cancelConstruction(world, siteB, fComp.id);
  assert.equal(fComp.woodStock, 70, 'Final wood: 50 + 20 = 70 (initial 100 minus A 30)');
  assert.equal(fComp.stoneStock, 40, 'Final stone: 25 + 15 = 40 (initial 50 minus A 10)');
  assert.equal(fComp.reservedResources.wood, 0, 'Reserved wood must return to 0');
  assert.equal(fComp.reservedResources.stone, 0, 'Reserved stone must return to 0');
});

// 3. Save/load mid-construction: Task board restores task and worker completes building seamlessly
test('Save/load mid-construction: CommunityTaskBoard restores task and worker completes building', () => {
  const world1 = new ECSWorld();
  const map1 = createTestMap();
  const taskBoard = CommunityTaskBoard.getInstance();
  taskBoard.clear();

  const factionRes = FactionFactory.createFaction(world1, {
    customName: 'Lưu Dân Thôn',
    type: 'hamlet',
    silent: true
  });
  const factionId = factionRes.comp.id;
  const settlementRes = FactionFactory.createSettlement(world1, {
    name: 'Khu Định Cư 1',
    ownerFactionId: factionId,
    centerX: 60,
    centerY: 60,
    radiusPixels: 120
  });
  const settlementId = settlementRes.settlementComp.settlementId;

  // Tạo công trường lều tranh (100 ticks)
  const hutEnt1 = FactionFactory.startConstruction(world1, 'thatched_hut', factionId, 60, 60, settlementId, { wood: 10 }, 100);
  const siteComp1 = world1.getComponent(hutEnt1, ConstructionSiteComponent)!;

  // Thợ tiến hành làm 30 ticks
  const worker1 = world1.createEntity();
  world1.addComponent(worker1, new PositionComponent(60, 60));
  world1.addComponent(worker1, new HealthComponent(100));
  world1.addComponent(worker1, new MortalNeedsComponent(100, 100, 10));
  world1.addComponent(worker1, new CharacterStateComponent());
  world1.addComponent(worker1, new NameComponent('Thợ Mộc'));
  world1.addComponent(worker1, new RaceComponent('human'));
  world1.addComponent(worker1, new FamilyComponent('male'));
  const planner1 = world1.addComponent(worker1, new AIPlannerComponent());
  const bt1 = world1.addComponent(worker1, new AIBehaviorTreeComponent());

  planner1.planStatus = 'executing';
  planner1.currentPlanGoal = 'LABOUR_WORK';
  planner1.steps = [
    {
      type: 'PERFORM_WORK',
      description: 'Lợp mái lều tranh',
      duration: 10,
      customData: { workType: 'build', buildingEnt: hutEnt1 }
    }
  ];

  // Chạy 1.5 giây = 30 ticks
  BehaviorTreeExecutor.tick(world1, worker1, bt1, planner1, map1, 1.5);
  assert.ok(siteComp1.completedWorkTicks >= 28 && siteComp1.completedWorkTicks <= 32);

  // Lưu thế giới
  const engine1 = createEngineStub(world1, map1);
  const saveData = SaveManager.serializeWorld(engine1, 'Mid Construction Save');

  // Nạp vào thế giới mới
  const world2 = new ECSWorld();
  const map2 = createTestMap();
  const engine2 = createEngineStub(world2, map2);

  // Clear task board trước khi nạp
  taskBoard.clear();
  SaveManager.deserializeWorld(engine2, saveData);

  // Kiểm tra: Task board ĐÃ ĐƯỢC PHỤC HỒI task thi công cho hutEnt1!
  const restoredTasks = taskBoard.getAllTasks();
  assert.equal(restoredTasks.length, 1, 'CommunityTaskBoard must restore 1 construction task');
  const restoredTask = restoredTasks[0];
  assert.equal(restoredTask.type, 'build_thatched_hut');
  assert.ok(restoredTask.targetEntityId !== undefined);

  // Kiểm tra công nhân trên world2 tiếp tục làm nốt 70 ticks
  const worker2 = worker1; // Entity ID được giữ nguyên sau serialize/deserialize
  const loadedSiteComp = world2.getComponent(restoredTask.targetEntityId!, ConstructionSiteComponent)!;
  assert.ok(loadedSiteComp !== null);
  assert.ok(loadedSiteComp.completedWorkTicks >= 28);

  const planner2 = world2.getComponent(worker2, AIPlannerComponent)!;
  const bt2 = world2.getComponent(worker2, AIBehaviorTreeComponent)!;

  // Kế hoạch của worker đã được remapped trỏ vào restoredTask
  const curStep = planner2.getCurrentStep();
  assert.ok(curStep !== null);
  assert.equal(curStep!.customData?.communityTaskId, restoredTask.id);

  // Cho worker làm tiếp 4.0 giây = 80 ticks (vượt mốc 100 ticks hoàn thành)
  BehaviorTreeExecutor.tick(world2, worker2, bt2, planner2, map2, 4.0);

  // Công trình phải hoàn tất 100%!
  const loadedBComp = world2.getComponent(restoredTask.targetEntityId!, BuildingComponent)!;
  assert.equal(loadedBComp.isUnderConstruction, false, 'Hut must be completed after worker finishes');
  assert.equal(world2.hasComponent(restoredTask.targetEntityId!, ConstructionSiteComponent), false,
    'ConstructionSiteComponent must be removed');

  // Settlement được cộng sức chứa nhà ở
  const sEnt2 = FactionFactory.findSettlementEntity(world2, settlementId)!;
  const loadedSettlement = world2.getComponent(sEnt2, SettlementComponent)!;
  assert.ok(loadedSettlement.housingCapacity > 0, 'Settlement housingCapacity must increase');

  // SmartObjectManager đã có affordance ngủ
  const sleepObj = SmartObjectManager.getInstance().findBestAvailableObject({ x: 60, y: 60 }, 'sleep_rest', 100);
  assert.ok(sleepObj !== null, 'Completed hut must be registered in SmartObjectManager');
});

// 4. Capital Sect Hall auto-started by FactionSystem creates CommunityTaskBoard task
test('FactionSystem capital hall construction reserves resources and creates CommunityTask', () => {
  const world = new ECSWorld();
  const map = createTestMap();
  const qi = new QiGrid(map.width, map.height);
  const diplomacy = new DiplomacySystem();
  const factionSystem = new FactionSystem();
  factionSystem.setContext(map, qi, diplomacy, null);
  world.addSystem(factionSystem);

  const taskBoard = CommunityTaskBoard.getInstance();
  taskBoard.clear();

  // Tạo thế lực đủ điều kiện xây Đại Điện Thủ Phủ (>= 3 thôn, >= 90 dân, đủ gỗ/đá)
  const factionRes = FactionFactory.createFaction(world, {
    customName: 'Đại Việt Thôn',
    type: 'village',
    silent: true
  });
  const faction = factionRes.comp;
  faction.settlementIds = ['s_cap', 's_sub1', 's_sub2'];
  faction.capitalSettlementId = 's_cap';
  faction.woodStock = 100;
  faction.stoneStock = 80;

  // Tạo thủ phủ và các điểm định cư trực thuộc
  for (const sid of ['s_cap', 's_sub1', 's_sub2']) {
    const sEnt = world.createEntity();
    world.addComponent(sEnt, new PositionComponent(100, 100));
    world.addComponent(sEnt, new SettlementComponent(sid, sid, faction.id, 100, 100, 200, sid === 's_cap' ? 'capital' : 'village'));
  }

  // Giả lập đủ dân số
  for (let i = 0; i < 90; i++) {
    const e = world.createEntity();
    world.addComponent(e, new HealthComponent(100));
    world.addComponent(e, new RaceComponent('human'));
    faction.members.add(e);
  }

  // Cập nhật FactionSystem -> Phải khởi công Đại Điện và đăng task lên CommunityTaskBoard!
  factionSystem.update(world, 3.5);

  const tasks = taskBoard.getAllTasks();
  const hallTask = tasks.find(t => t.type === 'found_sect_hall');
  assert.ok(hallTask !== undefined, 'FactionSystem must post found_sect_hall task on CommunityTaskBoard');
  assert.equal(hallTask!.payerFactionId, faction.id);
  assert.equal(hallTask!.settlementId, 's_cap');
  assert.ok(hallTask!.targetEntityId !== undefined);

  // Kho đã tạm giữ 30 gỗ, 25 đá (đá tích lũy tự nhiên từ 90 dân: +13 đá; gỗ chỉ tăng từ đốn cây thực tế)
  const expectedWood = 100 - 30;
  const expectedStone = 80 - 25 + Math.floor(90 * 0.15);
  assert.equal(faction.reservedResources.wood, 30);
  assert.equal(faction.reservedResources.stone, 25);
  assert.equal(faction.woodStock, expectedWood);
  assert.equal(faction.stoneStock, expectedStone);

  // Worker hoàn thành task
  const worker = world.createEntity();
  world.addComponent(worker, new HealthComponent(100));
  taskBoard.assignTaskToEntity(hallTask!.id, worker);
  // The board must reject a direct completion while workers have done no work.
  taskBoard.completeTask(world, worker, hallTask!.id);
  assert.equal(world.getComponent(hallTask!.targetEntityId!, BuildingComponent)!.isUnderConstruction, true);
  const hallSite = world.getComponent(hallTask!.targetEntityId!, ConstructionSiteComponent)!;
  hallSite.completedWorkTicks = hallSite.requiredWorkTicks;
  taskBoard.completeTask(world, worker, hallTask!.id);

  // Đại điện hoàn tất, không còn isUnderConstruction, có TerritoryCenterComponent
  const hallEnt = hallTask!.targetEntityId!;
  const bComp = world.getComponent(hallEnt, BuildingComponent)!;
  assert.equal(bComp.isUnderConstruction, false, 'Capital hall must be completed');
  assert.ok(world.hasComponent(hallEnt, TerritoryCenterComponent), 'Capital hall must have TerritoryCenterComponent');

  // Kho đã tiêu thụ đặt cọc sạch sẽ
  assert.equal(faction.reservedResources.wood, 0);
  assert.equal(faction.reservedResources.stone, 0);
  assert.equal(faction.woodStock, expectedWood);
  assert.equal(faction.stoneStock, expectedStone);
});

// 5. Biological pacing calibration across time speeds
test('NeedsSystem and ReproductionSystem biological drains are calibrated identically across speeds', () => {
  const map = createTestMap();
  const SECONDS_PER_DAY = TimeManager.TICKS_PER_DAY / TimeManager.TICKS_PER_SECOND; // 5.0s

  // Kiểm tra NeedsSystem: 10 ngày ở 0.5x, 1x, 5x phải tiêu hao lượng đói giống hệt nhau
  function simulateHunger(stepDt: number, totalDays: number): number {
    const world = new ECSWorld();
    const needsSys = new NeedsSystem(map);
    const human = world.createEntity();
    world.addComponent(human, new HealthComponent(100));
    world.addComponent(human, new HungerComponent(100, 100));
    world.addComponent(human, new CharacterStateComponent());

    const totalSeconds = totalDays * SECONDS_PER_DAY;
    let elapsed = 0;
    while (elapsed < totalSeconds) {
      const dt = Math.min(stepDt, totalSeconds - elapsed);
      needsSys.update(world, dt);
      elapsed += dt;
    }
    return world.getComponent(human, HungerComponent)!.current;
  }

  const hunger1x = simulateHunger(0.5, 10);
  const hunger2x = simulateHunger(1.0, 10);
  const hunger5x = simulateHunger(2.5, 10);

  assert.ok(Math.abs(hunger1x - hunger2x) < 1e-4, `Hunger at 1x (${hunger1x}) must match 2x (${hunger2x})`);
  assert.ok(Math.abs(hunger1x - hunger5x) < 1e-4, `Hunger at 1x (${hunger1x}) must match 5x (${hunger5x})`);
  // 10 ngày * 0.8 điểm đói/ngày = 8 điểm giảm
  assert.ok(Math.abs(hunger1x - (100 - 8.0)) < 1e-3, `10 days must drain exactly 8.0 hunger, got ${100 - hunger1x}`);

  // Kiểm tra ReproductionSystem: 10 ngày trôi qua giảm đúng 10 ngày cooldown sinh sản
  const worldRep = new ECSWorld();
  const repSys = new ReproductionSystem();
  const mother = worldRep.createEntity();
  worldRep.addComponent(mother, new HealthComponent(100));
  worldRep.addComponent(mother, new PositionComponent(50, 50));
  worldRep.addComponent(mother, new LifespanComponent(20, 100));
  worldRep.addComponent(mother, new RaceComponent('human'));
  worldRep.addComponent(mother, new FamilyComponent('female'));

  const fam = worldRep.getComponent(mother, FamilyComponent)!;
  fam.birthCooldown = 360;

  let repElapsed = 0;
  while (repElapsed < 10 * SECONDS_PER_DAY) {
    repSys.update(worldRep, 0.5);
    repElapsed += 0.5;
  }

  assert.ok(Math.abs(fam.birthCooldown - 350) < 1e-3,
    `10 game days must reduce birthCooldown by 10 days, got ${fam.birthCooldown}`);
});

test('Malformed construction sites are rejected before replacing the current world', () => {
  const sourceWorld = new ECSWorld();
  const faction = FactionFactory.createFaction(sourceWorld, { type: 'hamlet', silent: true });
  const siteEnt = FactionFactory.startConstruction(sourceWorld, 'thatched_hut', faction.comp.id, 40, 40, undefined, undefined, 100);
  const saved = SaveManager.serializeWorld(createEngineStub(sourceWorld, createTestMap()), 'Construction validation');
  const siteIndex = saved.entities.findIndex(e => e.id === siteEnt);
  assert.ok(siteIndex >= 0);

  const currentWorld = new ECSWorld();
  const currentEntity = currentWorld.createEntity();
  currentWorld.addComponent(currentEntity, new NameComponent('Thế giới đang chơi'));
  const currentEngine = createEngineStub(currentWorld, createTestMap());

  const invalidSites: Array<[string, (components: Record<string, any>) => void]> = [
    ['worker list is not an array', c => { c.constructionSite.assignedWorkerIds = {}; }],
    ['negative progress', c => { c.constructionSite.completedWorkTicks = -1; }],
    ['invalid required work', c => { c.constructionSite.requiredWorkTicks = 0; }],
    ['negative reserved wood', c => { c.constructionSite.reservedResources.wood = -10; }],
    ['completed status on active site', c => { c.constructionSite.status = 'completed'; }],
    ['payer does not own building', c => { c.constructionSite.payerFactionId = 'other_faction'; }],
    ['site without an unfinished building', c => { c.bld.isUnderConstruction = false; }]
  ];

  for (const [description, corrupt] of invalidSites) {
    const bad = structuredClone(saved);
    corrupt(bad.entities[siteIndex].components);
    assert.throws(() => SaveManager.deserializeWorld(currentEngine, bad), /Công trường/, description);
    assert.equal(currentWorld.getEntityCount(), 1, description);
    assert.equal(currentWorld.getComponent(currentEntity, NameComponent)?.name, 'Thế giới đang chơi', description);
  }
});

test('Scripture pavilion construction resumes after load and finishes as a building task', () => {
  const world = new ECSWorld();
  const faction = FactionFactory.createFaction(world, { type: 'sect', silent: true });
  const siteEnt = FactionFactory.startConstruction(world, 'scripture_pavilion', faction.comp.id, 48, 48, undefined, undefined, 100);
  world.getComponent(siteEnt, ConstructionSiteComponent)!.completedWorkTicks = 99;

  const saved = SaveManager.serializeWorld(createEngineStub(world, createTestMap()), 'Pavilion construction');
  const loadedWorld = new ECSWorld();
  CommunityTaskBoard.getInstance().clear();
  SaveManager.deserializeWorld(createEngineStub(loadedWorld, createTestMap()), saved);

  const board = CommunityTaskBoard.getInstance();
  const task = board.getAllTasks().find(t => t.targetEntityId === siteEnt);
  assert.equal(task?.type, 'build_scripture_pavilion');
  assert.ok(task);

  const worker = loadedWorld.createEntity();
  loadedWorld.addComponent(worker, new PositionComponent(48, 48));
  loadedWorld.addComponent(worker, new HealthComponent(100));
  loadedWorld.addComponent(worker, new CharacterStateComponent());
  const planner = loadedWorld.addComponent(worker, new AIPlannerComponent());
  const behavior = loadedWorld.addComponent(worker, new AIBehaviorTreeComponent());
  planner.planStatus = 'executing';
  planner.currentPlanGoal = 'LABOUR_WORK';
  planner.steps = [{
    type: 'PERFORM_WORK',
    description: 'Hoàn tất Tàng Kinh Các',
    duration: 10,
    customData: { workType: 'build', buildingEnt: siteEnt, communityTaskId: task.id }
  }];
  board.assignTaskToEntity(task.id, worker);
  BehaviorTreeExecutor.tick(loadedWorld, worker, behavior, planner, createTestMap(), 0.1);

  assert.equal(loadedWorld.getComponent(siteEnt, BuildingComponent)?.isUnderConstruction, false);
  assert.equal(loadedWorld.hasComponent(siteEnt, ConstructionSiteComponent), false);
  assert.equal(board.getTaskById(task.id), undefined);
});
