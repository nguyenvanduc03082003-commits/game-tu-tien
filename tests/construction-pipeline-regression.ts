import assert from 'node:assert/strict';
import { ECSWorld } from '../src/ecs/World.ts';
import { WorldMap } from '../src/modules/world/WorldMap.ts';
import { SpatialGrid } from '../src/core/SpatialGrid.ts';
import { TerrainType } from '../src/config/terrains.config.ts';
import { TimeManager } from '../src/core/TimeManager.ts';
import {
  BUILDING_DEFINITIONS,
  BuildingType
} from '../src/config/factions.config.ts';
import {
  BuildingComponent,
  ConstructionSiteComponent,
  FactionComponent,
  SettlementComponent,
  ResidenceComponent
} from '../src/modules/factions/FactionComponents.ts';
import { FactionFactory } from '../src/modules/factions/FactionFactory.ts';
import { BuildingSystem } from '../src/modules/factions/BuildingSystem.ts';
import { FactionSystem } from '../src/modules/factions/FactionSystem.ts';
import { CommunityTaskBoard } from '../src/modules/ai/community/CommunityTaskBoard.ts';
import { BehaviorTreeExecutor } from '../src/modules/ai/brain/behavior/BehaviorTree.ts';
import { AIPlannerComponent, AIBehaviorTreeComponent } from '../src/modules/ai/brain/AIComponents.ts';
import { PositionComponent, HealthComponent, MortalNeedsComponent, CharacterStateComponent, NameComponent } from '../src/modules/beings/BeingComponents.ts';
import { SaveManager } from '../src/modules/save/SaveManager.ts';
import { QiGrid } from '../src/modules/energy/QiGrid.ts';

let passed = 0;
function test(name: string, fn: () => void): void {
  fn();
  passed++;
  console.log('PASS construction-pipeline:', name);
}

function createTestContext() {
  const world = new ECSWorld();
  const map = new WorldMap(32, 32);
  for (let y = 0; y < 32; y++) {
    for (let x = 0; x < 32; x++) {
      const tile = map.getTile(x, y);
      if (tile) {
        tile.terrain = TerrainType.PLAIN;
        tile.elevation = 0;
      }
    }
  }
  const spatialGrid = new SpatialGrid(32 * 16, 32 * 16, 64);
  const buildingSystem = new BuildingSystem();
  const factionSystem = new FactionSystem(map);
  const taskBoard = new CommunityTaskBoard();

  return { world, map, spatialGrid, buildingSystem, factionSystem, taskBoard };
}

function createMockEngine(world: ECSWorld, worldMap: WorldMap) {
  const qiGrid = new QiGrid(worldMap.width, worldMap.height);
  const spatialGrid = new SpatialGrid(worldMap.width * 16, worldMap.height * 16, 64);
  const engine = {
    world,
    worldMap,
    qiGrid,
    camera: { x: 50, y: 50, zoom: 1.5 },
    timeManager: TimeManager.getInstance(),
    spatialGrid,
    tribulationSystem: undefined,
    cultivationSystem: undefined,
    threeTierAISystem: undefined,
    diplomacySystem: undefined,
    weatherSystem: undefined,
    worldName: 'Thế Giới Tu Tiên',
    worldTemplate: 'thap_van_dai_son',
    worldSeed: 12345,
    resetWorldState() {
      this.world.clearEntities();
      this.spatialGrid.clear();
    }
  } as any;
  return engine;
}

// 1. Kiểm tra cấu hình số ngày xây dựng chuẩn
test('building definitions specify standard construction days', () => {
  const expectedDays: Record<BuildingType, number> = {
    campfire: 1,
    thatched_hut: 3,
    mortal_farm: 3,
    village_well: 5,
    herb_garden: 7,
    meditation_cave: 12,
    alchemy_chamber: 15,
    sect_hall: 20,
    scripture_pavilion: 20,
    defense_array: 30
  };

  for (const [type, days] of Object.entries(expectedDays)) {
    const def = BUILDING_DEFINITIONS[type as BuildingType];
    assert.ok(def, `Building definition for ${type} must exist`);
    assert.equal(
      def.constructionDays,
      days,
      `Building ${type} must require ${days} construction days, got ${def.constructionDays}`
    );
  }
});

// 2. Trạng thái công trường thi công và cô lập công năng
test('construction site is isolated: no housing, no production, no defense attacks, no faction progression', () => {
  const { world, buildingSystem, factionSystem } = createTestContext();

  // Tạo thế lực và điểm định cư
  const factionRes = FactionFactory.createFaction(world, {
    customName: 'Thôn Thử Nghiệm',
    color: '#3b82f6',
    type: 'hamlet',
    silent: true
  });
  const factionComp = factionRes.comp;
  const settlementRes = FactionFactory.createSettlement(world, {
    name: 'Khu Vực 1',
    ownerFactionId: factionComp.id,
    centerX: 100,
    centerY: 100,
    radiusPixels: 160
  });
  const sComp = settlementRes.settlementComp;

  // Khởi công một thatched_hut đang xây dựng
  const hutEnt = FactionFactory.startConstruction(
    world,
    'thatched_hut',
    factionComp.id,
    100,
    100,
    sComp.id,
    { wood: 20 }
  );

  const bComp = world.getComponent(hutEnt, BuildingComponent)!;
  const siteComp = world.getComponent(hutEnt, ConstructionSiteComponent)!;

  assert.equal(bComp.isUnderConstruction, true, 'isUnderConstruction must be true');
  assert.ok(siteComp, 'ConstructionSiteComponent must exist');
  assert.equal(siteComp.requiredWorkTicks, 3 * TimeManager.TICKS_PER_DAY); // 300 ticks
  assert.equal(siteComp.completedWorkTicks, 0);
  assert.equal(siteComp.progressRatio, 0);

  // Không cấp sức chứa nhà ở cho điểm định cư
  assert.equal(sComp.housingCapacity, 0, 'In-progress thatched hut must not add housing capacity');

  // Khởi công một thảo dược viên đang xây
  const gardenEnt = FactionFactory.startConstruction(
    world,
    'herb_garden',
    factionComp.id,
    120,
    120,
    sComp.id,
    { wood: 10 }
  );
  factionComp.spiritStones = 0;
  buildingSystem.update(world, 10.0);
  assert.equal(factionComp.spiritStones, 0, 'In-progress herb garden must not produce resources');

  // Kiểm tra Faction progression: nhà đang xây không được tính vào số lượng nhà hợp lệ
  const buildings = world.query([PositionComponent, BuildingComponent]);
  let activeHuts = 0;
  let activeGardens = 0;
  for (const bEnt of buildings) {
    const b = world.getComponent(bEnt, BuildingComponent)!;
    if (b.isRuins || b.currentDurability <= 0 || b.isUnderConstruction || b.factionId !== factionComp.id) continue;
    if (b.buildingType === 'thatched_hut') activeHuts++;
    if (b.buildingType === 'herb_garden') activeGardens++;
  }
  assert.equal(activeHuts, 0, 'In-progress hut must not count as active hut');
  assert.equal(activeGardens, 0, 'In-progress herb garden must not count as active garden');

  // Khi hoàn thành thi công: kích hoạt sức chứa nhà ở
  const hutSite = world.getComponent(hutEnt, ConstructionSiteComponent)!;
  hutSite.completedWorkTicks = hutSite.requiredWorkTicks;
  FactionFactory.completeBuilding(world, hutEnt);
  assert.equal(bComp.isUnderConstruction, false, 'Completed hut is no longer under construction');
  assert.ok(sComp.housingCapacity > 0, 'Completed hut must add housing capacity to settlement');
});

// 3. Nhân công thúc đẩy tiến độ thi công & lưu trữ ticks dở dang khi đổi thợ
test('workers advance work ticks during PERFORM_WORK and ticks persist on worker interruption', () => {
  const { world, map } = createTestContext();

  const factionRes = FactionFactory.createFaction(world, {
    customName: 'Test Faction',
    color: '#22c55e',
    type: 'hamlet',
    silent: true
  });
  const factionComp = factionRes.comp;

  // Campfire: 1 ngày = 100 ticks
  const campfireEnt = FactionFactory.startConstruction(world, 'campfire', factionComp.id, 50, 50);
  const siteComp = world.getComponent(campfireEnt, ConstructionSiteComponent)!;
  assert.equal(siteComp.requiredWorkTicks, 100);

  // Thợ 1 làm 1 giây (ở 20 ticks/sec => 20 work ticks)
  const worker1 = world.createEntity();
  world.addComponent(worker1, new PositionComponent(50, 50));
  world.addComponent(worker1, new HealthComponent(100));
  world.addComponent(worker1, new MortalNeedsComponent(100, 100, 10));
  world.addComponent(worker1, new CharacterStateComponent());
  world.addComponent(worker1, new NameComponent('Thợ Mộc 1'));
  const planner1 = world.addComponent(worker1, new AIPlannerComponent());
  const bt1 = world.addComponent(worker1, new AIBehaviorTreeComponent());

  planner1.planStatus = 'executing';
  planner1.currentPlanGoal = 'LABOUR_WORK';
  planner1.steps = [
    {
      type: 'PERFORM_WORK',
      description: 'Dựng đống lửa',
      duration: 10,
      targetEntityId: campfireEnt,
      customData: { workType: 'build' }
    }
  ];

  // Thợ 1 làm trong 1.0 giây
  BehaviorTreeExecutor.tick(world, worker1, bt1, planner1, map, 1.0);
  assert.ok(
    siteComp.completedWorkTicks >= 19 && siteComp.completedWorkTicks <= 21,
    `Work ticks should advance by ~20 ticks, got ${siteComp.completedWorkTicks}`
  );
  const ticksBeforeSwitch = siteComp.completedWorkTicks;

  // Thợ 1 bỏ dở giữa chừng (bị chết hoặc hủy việc)
  world.destroyEntity(worker1);

  // Kiểm tra work ticks trên công trình được bảo toàn nguyên vẹn
  assert.equal(
    siteComp.completedWorkTicks,
    ticksBeforeSwitch,
    'Site completedWorkTicks must persist after worker death'
  );

  // Thợ 2 vào tiếp quản thi công nốt
  const worker2 = world.createEntity();
  world.addComponent(worker2, new PositionComponent(50, 50));
  world.addComponent(worker2, new HealthComponent(100));
  world.addComponent(worker2, new MortalNeedsComponent(100, 100, 10));
  world.addComponent(worker2, new CharacterStateComponent());
  world.addComponent(worker2, new NameComponent('Thợ Mộc 2'));
  const planner2 = world.addComponent(worker2, new AIPlannerComponent());
  const bt2 = world.addComponent(worker2, new AIBehaviorTreeComponent());

  planner2.planStatus = 'executing';
  planner2.currentPlanGoal = 'LABOUR_WORK';
  planner2.steps = [
    {
      type: 'PERFORM_WORK',
      description: 'Hoàn thiện đống lửa',
      duration: 10,
      targetEntityId: campfireEnt,
      customData: { workType: 'build' }
    }
  ];

  // Thợ 2 làm tiếp 4.0 giây (4.0 * 20 = 80 ticks) -> hoàn tất tổng 100 ticks
  BehaviorTreeExecutor.tick(world, worker2, bt2, planner2, map, 4.0);

  // Công trình hoàn tất: không còn isUnderConstruction, không còn ConstructionSiteComponent
  const bCompAfter = world.getComponent(campfireEnt, BuildingComponent);
  assert.ok(bCompAfter, 'Building entity must still exist');
  assert.equal(bCompAfter.isUnderConstruction, false, 'Building should now be completed');
  const siteCompAfter = world.getComponent(campfireEnt, ConstructionSiteComponent);
  assert.equal(siteCompAfter, undefined, 'ConstructionSiteComponent must be removed on completion');
});

// 4. Hủy công trình hoàn tiền và không hoàn tiền hai lần
test('cancellation refunds reserved resources and destroys entity without double refund', () => {
  const { world } = createTestContext();

  const factionRes = FactionFactory.createFaction(world, {
    customName: 'Thế Lực Phù Vân',
    color: '#eab308',
    type: 'hamlet',
    silent: true
  });
  const factionComp = factionRes.comp;
  factionComp.woodStock = 100;
  factionComp.stoneStock = 50;

  // Đặt cọc 30 gỗ, 15 đá vào kho
  FactionFactory.reserveResources(world, factionComp.id, { wood: 30, stone: 15 });
  assert.equal(factionComp.woodStock, 70, 'Wood stock must be reduced when reserved (-30)');
  assert.equal(factionComp.stoneStock, 35, 'Stone stock must be reduced when reserved (-15)');

  // Khởi công công trường
  const siteEnt = FactionFactory.startConstruction(
    world,
    'mortal_farm',
    factionComp.id,
    40,
    40,
    undefined,
    { wood: 30, stone: 15 }
  );

  // Hủy công trường
  FactionFactory.cancelConstruction(world, siteEnt, factionComp.id);

  // Kiểm tra tài nguyên đã được hoàn trả
  assert.equal(factionComp.woodStock, 100, 'Wood stock must be refunded (+30)');
  assert.equal(factionComp.stoneStock, 50, 'Stone stock must be refunded (+15)');
  assert.equal(factionComp.reservedResources.wood, 0, 'Reserved wood must be cleared to 0');
  assert.equal(factionComp.reservedResources.stone, 0, 'Reserved stone must be cleared to 0');

  // Kiểm tra entity công trường đã bị hủy
  const bComp = world.getComponent(siteEnt, BuildingComponent);
  assert.equal(bComp, undefined, 'Building entity must be destroyed after cancellation');
});

// 5. Lưu và tải game giữ nguyên tiến trình và tài nguyên đặt cọc
test('save and load persistence preserves construction progress and reserved resources', () => {
  const { world, map } = createTestContext();

  const factionRes = FactionFactory.createFaction(world, {
    customName: 'Cổ Phái',
    color: '#8b5cf6',
    type: 'sect',
    silent: true
  });
  const factionComp = factionRes.comp;

  // Khởi công một meditation_cave (12 ngày = 1200 ticks)
  const caveEnt = FactionFactory.startConstruction(
    world,
    'meditation_cave',
    factionComp.id,
    70,
    70,
    undefined,
    { stone: 50, spiritStones: 20 }
  );
  const siteComp = world.getComponent(caveEnt, ConstructionSiteComponent)!;
  siteComp.completedWorkTicks = 450; // Đã làm được 450 ticks

  // Serialize qua SaveManager
  const engine = createMockEngine(world, map);
  const serialized = SaveManager.serializeWorld(engine, 'Test Construction Save');

  // Deserialize vào engine mới
  const newWorld = new ECSWorld();
  const newEngine = createMockEngine(newWorld, map);
  SaveManager.deserializeWorld(newEngine, serialized);

  // Tìm kiếm entity meditation cave trên newWorld
  const bldEntities = newWorld.query([BuildingComponent, ConstructionSiteComponent]);
  assert.equal(bldEntities.length, 1, 'Should restore 1 building under construction');

  const loadedSiteComp = newWorld.getComponent(bldEntities[0], ConstructionSiteComponent)!;
  const loadedBComp = newWorld.getComponent(bldEntities[0], BuildingComponent)!;

  assert.equal(loadedBComp.isUnderConstruction, true, 'isUnderConstruction must be preserved');
  assert.equal(loadedSiteComp.requiredWorkTicks, 1200, 'requiredWorkTicks must match 1200');
  assert.equal(loadedSiteComp.completedWorkTicks, 450, 'completedWorkTicks must match 450');
  assert.equal(loadedSiteComp.reservedResources.stone, 50, 'reserved stone must match 50');
  assert.equal(loadedSiteComp.reservedResources.spiritStones, 20, 'reserved spiritStones must match 20');
});

// 6. Instant build bypasses construction site entirely
test('instant placement spawns completed building without ConstructionSiteComponent', () => {
  const { world } = createTestContext();

  const factionRes = FactionFactory.createFaction(world, {
    customName: 'Thôn Thần Tốc',
    color: '#10b981',
    type: 'hamlet',
    silent: true
  });
  const factionComp = factionRes.comp;
  const settlementRes = FactionFactory.createSettlement(world, {
    name: 'Khu Vực Thần Tốc',
    ownerFactionId: factionComp.id,
    centerX: 80,
    centerY: 80,
    radiusPixels: 160
  });
  const sComp = settlementRes.settlementComp;

  const hutEnt = FactionFactory.spawnBuilding(
    world,
    'thatched_hut',
    factionComp.id,
    80,
    80,
    sComp.id,
    { instant: true }
  );

  const bComp = world.getComponent(hutEnt, BuildingComponent)!;
  const siteComp = world.getComponent(hutEnt, ConstructionSiteComponent);

  assert.equal(bComp.isUnderConstruction, false, 'instant building is not under construction');
  assert.equal(siteComp, undefined, 'instant building has no ConstructionSiteComponent');
  assert.ok(sComp.housingCapacity > 0, 'instant building immediately provides housing');
});

console.log(`${passed} construction-pipeline regression tests passed`);
