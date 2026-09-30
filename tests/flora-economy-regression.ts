import assert from 'node:assert/strict';
import { ECSWorld } from '../src/ecs/World.ts';
import { TimeManager } from '../src/core/TimeManager.ts';
import { WorldMap } from '../src/modules/world/WorldMap.ts';
import { QiGrid } from '../src/modules/energy/QiGrid.ts';
import { SpatialGrid } from '../src/core/SpatialGrid.ts';
import { PlantComponent } from '../src/modules/flora/PlantComponents.ts';
import { PlantFactory } from '../src/modules/flora/PlantFactory.ts';
import { PlantGrowthSystem } from '../src/modules/flora/PlantGrowthSystem.ts';
import { FactionComponent, MemberComponent } from '../src/modules/factions/FactionComponents.ts';
import { FactionSystem } from '../src/modules/factions/FactionSystem.ts';
import { SaveManager } from '../src/modules/save/SaveManager.ts';
import { CommunityTaskBoard } from '../src/modules/ai/community/CommunityTaskBoard.ts';
import { PositionComponent, HealthComponent, CharacterStateComponent } from '../src/modules/beings/BeingComponents.ts';
import { AIPlannerComponent, AIBehaviorTreeComponent, AIStrategicBrainComponent } from '../src/modules/ai/brain/AIComponents.ts';
import { AIPlanner } from '../src/modules/ai/brain/planner/AIPlanner.ts';
import { BehaviorTreeExecutor } from '../src/modules/ai/brain/behavior/BehaviorTree.ts';
import { PLANT_DEFINITIONS } from '../src/config/plants.config.ts';

let passed = 0;
function test(name: string, fn: () => void): void {
  fn();
  passed++;
  console.log(`PASS flora-economy: ${name}`);
}

// 1. Kiểm tra cấu hình và sinh sản cây ăn quả thân gỗ
test('1. Cây ăn quả thân gỗ (wild_fruit_tree) có đầy đủ quả và gỗ theo config', () => {
  const world = new ECSWorld();
  const treeEnt = PlantFactory.spawnPlant(world, 'wild_fruit_tree', 10, 10, 'mature');
  const pComp = world.getComponent(treeEnt, PlantComponent)!;

  assert.ok(pComp, 'Phải tạo được thực thể cây ăn quả');
  assert.equal(pComp.speciesId, 'wild_fruit_tree');
  assert.equal(pComp.category, 'food');
  assert.equal(pComp.hasFruit, true, 'Cây trưởng thành ban đầu phải có quả');
  assert.equal(pComp.maxWood, 12, 'Sản lượng gỗ tối đa của wild_fruit_tree là 12');
  assert.equal(pComp.woodRemaining, 12, 'Gỗ ban đầu phải đầy đủ');
  assert.equal(pComp.fruitRegrowDaysRemaining, 0);
  assert.equal(pComp.woodRegrowDaysRemaining, 0);
});

// 2. Kiểm tra chu kỳ quả tái mọc và tính bất biến theo delta time (dt invariance)
test('2. Chu kỳ tái mọc quả: sau khi hái -> cooldown -> ra quả lại, dt 0.05 và dt 1.0 đồng nhất', () => {
  const mapA = new WorldMap(10, 10);
  const qiA = new QiGrid(10, 10);
  for (const t of mapA.getAllTiles()) {
    t.temperature = 10;
    t.moisture = 0.3;
    t.plantGrowth = 1.0;
  }

  // Thử nghiệm A: chạy với dt = 0.05 (20 tick = 1 giây thực tế = 0.2 ngày game)
  const worldA = new ECSWorld();
  const treeA = PlantFactory.spawnPlant(worldA, 'wild_fruit_tree', 5, 5, 'mature');
  const plantA = worldA.getComponent(treeA, PlantComponent)!;
  const growthA = new PlantGrowthSystem(mapA, qiA);

  // Hái quả lần 1 (cooldown 5 ngày game = 25 giây thực tế)
  plantA.hasFruit = false;
  const fruitRegrowDays = PLANT_DEFINITIONS['wild_fruit_tree'].fruitRegrowDays ?? 5;
  plantA.fruitRegrowDaysRemaining = fruitRegrowDays;

  // 1 ngày game = 100 ticks = 5 giây ở tốc độ 1x (TimeManager: 20 ticks/giây, 100 ticks/ngày)
  // 5 ngày game = 5 * 5 = 25 giây.
  // Chạy 2 ngày game (10 giây) = 200 bước dt = 0.05
  for (let i = 0; i < 200; i++) {
    growthA.update(worldA, 0.05);
  }
  assert.equal(plantA.hasFruit, false, 'Sau 2 ngày game (chưa đủ 5 ngày), cây chưa thể ra quả lại');
  assert.ok(
    Math.abs(plantA.fruitRegrowDaysRemaining - 3) < 0.01,
    `fruitRegrowDaysRemaining phải còn xấp xỉ 3 ngày (thực tế: ${plantA.fruitRegrowDaysRemaining})`
  );

  // Thử nghiệm B: chạy với dt = 1.0 (mỗi bước 1 giây thực tế = 0.2 ngày game)
  const mapB = new WorldMap(10, 10);
  const qiB = new QiGrid(10, 10);
  for (const t of mapB.getAllTiles()) {
    t.temperature = 10;
    t.moisture = 0.3;
    t.plantGrowth = 1.0;
  }

  const worldB = new ECSWorld();
  const treeB = PlantFactory.spawnPlant(worldB, 'wild_fruit_tree', 5, 5, 'mature');
  const plantB = worldB.getComponent(treeB, PlantComponent)!;
  const growthB = new PlantGrowthSystem(mapB, qiB);

  plantB.hasFruit = false;
  plantB.fruitRegrowDaysRemaining = fruitRegrowDays;

  // Chạy 10 bước dt = 1.0 (tương đương 2 ngày game)
  for (let i = 0; i < 10; i++) {
    growthB.update(worldB, 1.0);
  }
  assert.equal(plantB.hasFruit, false);
  assert.ok(
    Math.abs(plantB.fruitRegrowDaysRemaining - 3) < 0.01,
    `dt=1.0 phải cho cùng ngày đếm ngược như dt=0.05 (thực tế: ${plantB.fruitRegrowDaysRemaining})`
  );
  assert.ok(
    Math.abs(plantA.fruitRegrowDaysRemaining - plantB.fruitRegrowDaysRemaining) < 1e-4,
    'Tính bất biến theo delta time (dt invariance) phải hoàn hảo giữa dt=0.05 và dt=1.0'
  );

  // Chạy tiếp 3 ngày game (15 giây) = 300 bước dt = 0.05 (tổng đủ 5 ngày game)
  for (let i = 0; i < 300; i++) {
    growthA.update(worldA, 0.05);
  }
  assert.equal(plantA.hasFruit, true, 'Sau đủ 5 ngày game, cây phải tự động kết trái lại');
  assert.equal(plantA.fruitRegrowDaysRemaining, 0);

  // Chạy nốt 15 bước dt = 1.0 (tổng đủ 5 ngày game)
  for (let i = 0; i < 15; i++) {
    growthB.update(worldB, 1.0);
  }
  assert.equal(plantB.hasFruit, true, 'dt=1.0 sau 5 ngày game cũng phải tự ra quả lại');
  assert.equal(plantB.fruitRegrowDaysRemaining, 0);
});

// 3. Khai thác gỗ thực tế, chuyển trạng thái và hồi phục
test('3. Khai thác gỗ làm giảm woodRemaining, hết gỗ chuyển cooldown và hồi phục theo chu kỳ', () => {
  const map = new WorldMap(10, 10);
  const qi = new QiGrid(10, 10);
  for (const t of map.getAllTiles()) {
    t.temperature = 10;
    t.moisture = 0.3;
    t.plantGrowth = 1.0;
  }
  const world = new ECSWorld();
  const treeEnt = PlantFactory.spawnPlant(world, 'oak_tree', 5, 5, 'mature');
  const pComp = world.getComponent(treeEnt, PlantComponent)!;
  const growth = new PlantGrowthSystem(map, qi);

  assert.equal(pComp.woodRemaining, 25);
  assert.equal(pComp.stage, 2);

  // Khai thác 10 gỗ
  pComp.woodRemaining -= 10;
  assert.equal(pComp.woodRemaining, 15);
  assert.equal(pComp.stage, 2, 'Vẫn còn gỗ thì cây vẫn ở trạng thái mature');

  // Khai thác nốt 15 gỗ (đốn cạn kiệt)
  pComp.woodRemaining = 0;
  pComp.woodRegrowDaysRemaining = PLANT_DEFINITIONS['oak_tree'].woodRegrowDays ?? 15;

  assert.equal(pComp.woodRemaining, 0);
  assert.equal(pComp.woodRegrowDaysRemaining, 15);

  // Cho thời gian trôi qua 15 ngày game (15 * 5 = 75 giây game = 75 bước dt=1.0)
  for (let i = 0; i < 75; i++) {
    growth.update(world, 1.0);
  }

  assert.equal(pComp.woodRemaining, 25, 'Gỗ phải được phục hồi đầy đủ');
  assert.equal(pComp.woodRegrowDaysRemaining, 0);
});

// 4. Loại bỏ tăng gỗ thụ động từ không khí trong FactionSystem
test('4. FactionSystem KHÔNG tự động tăng woodStock nếu không có lao động đốn gỗ', () => {
  const world = new ECSWorld();
  const factionEnt = world.createEntity();
  const faction = new FactionComponent('faction_test', 'Khởi Nguyên Thôn', 'hamlet', 'neutral', '#fff', 16);
  faction.woodStock = 50;
  faction.stoneStock = 18;
  faction.foodStock = 24;
  world.addComponent(factionEnt, faction);

  const factionSys = new FactionSystem();

  // Cập nhật hệ thống faction qua 5 ngày game (mỗi ngày trôi qua)
  for (let day = 0; day < 5; day++) {
    factionSys.update(world, 5.0); // 5 giây = 1 ngày game
  }

  assert.equal(faction.woodStock, 50, 'woodStock phải giữ nguyên 50, tuyệt đối không tăng từ hư không');
});

// 5. Khóa tài nguyên cây (reservedWood) để nhiều thợ không tranh chấp vượt quá số gỗ
test('5. TaskBoard và reservedWood ngăn tranh chấp đốn gỗ vượt quá lượng gỗ của cây', () => {
  const world = new ECSWorld();
  const treeEnt = PlantFactory.spawnPlant(world, 'wild_fruit_tree', 5, 5, 'mature');
  const pComp = world.getComponent(treeEnt, PlantComponent)!;
  pComp.woodRemaining = 12;
  pComp.reservedWood = 0;

  const board = CommunityTaskBoard.getInstance();
  board.clear();

  // Tạo 1 task chop_wood nhắm vào cây
  const task1 = board.createTask({
    type: 'chop_wood',
    title: 'Đốn Gỗ 1',
    targetPos: { x: 5, y: 5 },
    targetEntityId: treeEnt,
    preferredJob: 'builder',
    priority: 80
  }, world);

  assert.equal(pComp.reservedWood, 10, 'Sau khi tạo task 1, reservedWood phải tăng lên 10');
  assert.equal(pComp.woodRemaining - pComp.reservedWood, 2, 'Gỗ khả dụng còn lại là 2');

  // Khi hủy task, reservedWood phải được hoàn trả an toàn
  board.cancelTask(world, task1.id, 'Huỷ test');
  assert.equal(pComp.reservedWood, 0, 'Sau khi hủy task, reservedWood phải trở về 0');
});

test('5B. AI nhận việc đốn gỗ và chuyển đúng lượng gỗ đã giữ vào kho', () => {
  const world = new ECSWorld();
  const map = new WorldMap(16, 16);
  const qi = new QiGrid(16, 16);
  const treeEnt = PlantFactory.spawnPlant(world, 'wild_fruit_tree', 48, 48, 'mature');
  const tree = world.getComponent(treeEnt, PlantComponent)!;
  tree.woodRemaining = 12;
  const factionEnt = world.createEntity();
  const faction = world.addComponent(factionEnt, new FactionComponent('wood_faction', 'Lâm Thôn', 'hamlet', 'neutral', '#fff', 16));
  faction.woodStock = 0;
  const worker = world.createEntity();
  world.addComponent(worker, new PositionComponent(48, 48));
  world.addComponent(worker, new HealthComponent(100));
  world.addComponent(worker, new CharacterStateComponent());
  world.addComponent(worker, new MemberComponent(faction.factionId, 'villager'));
  const brain = world.addComponent(worker, new AIStrategicBrainComponent('LABOUR_WORK'));
  const planner = world.addComponent(worker, new AIPlannerComponent());
  const behavior = world.addComponent(worker, new AIBehaviorTreeComponent());
  const board = CommunityTaskBoard.getInstance();
  board.clear();
  const task = board.createTask({
    type: 'chop_wood', title: 'Đốn cây', targetPos: { x: 48, y: 48 },
    targetEntityId: treeEnt, preferredJob: 'builder', priority: 80,
    duration: 4.5, payerFactionId: faction.factionId
  }, world);
  assert.ok(task);
  AIPlanner.planForGoal(world, worker, 'LABOUR_WORK', brain, planner, map, qi);
  assert.equal(planner.steps.find(s => s.type === 'PERFORM_WORK')?.customData?.workType, 'chop_wood');
  for (let i = 0; i < 70; i++) BehaviorTreeExecutor.tick(world, worker, behavior, planner, map, 0.1);
  assert.ok(faction.woodStock > 0 && faction.woodStock <= 10);
  assert.ok(Math.abs((12 - tree.woodRemaining) - faction.woodStock) < 1e-6);
  assert.equal(tree.reservedWood, 0);
});

// 6. Tương thích lưu / nạp (Save/Load) đối với PlantComponent
test('6. Save/Load round-trip bảo toàn đầy đủ các trường mới của PlantComponent', () => {
  const timeMgr = TimeManager.getInstance();
  const srcEngine = {
    world: new ECSWorld(),
    worldMap: new WorldMap(8, 8),
    qiGrid: new QiGrid(8, 8),
    spatialGrid: new SpatialGrid(32),
    camera: { x: 0, y: 0, zoom: 1 },
    timeManager: timeMgr,
    worldName: 'Bảo Toàn Thực Vật',
    worldTemplate: 'thap_van_dai_son',
    worldSeed: 12345
  };

  const treeEnt = PlantFactory.spawnPlant(srcEngine.world, 'wild_fruit_tree', 3, 3, 'mature');
  const pSrc = srcEngine.world.getComponent(treeEnt, PlantComponent)!;
  pSrc.hasFruit = false;
  pSrc.fruitRegrowDaysRemaining = 7.5;
  pSrc.woodRemaining = 8;
  pSrc.maxWood = 12;
  pSrc.woodRegrowDaysRemaining = 14.2;

  // Round-trip qua đúng API SaveManager hiện hành
  const saveData = SaveManager.serializeWorld(srcEngine as any, 'Bảo Toàn Thực Vật');

  // Deserialize vào engine đích
  const dstEngine = {
    world: new ECSWorld(),
    worldMap: new WorldMap(8, 8),
    qiGrid: new QiGrid(8, 8),
    spatialGrid: new SpatialGrid(32),
    camera: { x: 0, y: 0, zoom: 1 },
    timeManager: timeMgr,
    worldName: '',
    worldTemplate: '',
    worldSeed: 0
  };

  SaveManager.deserializeWorld(dstEngine as any, saveData);

  const plantEntities = dstEngine.world.query([PlantComponent]);
  assert.equal(plantEntities.length, 1);

  const pDst = dstEngine.world.getComponent(plantEntities[0], PlantComponent)!;
  assert.equal(pDst.speciesId, 'wild_fruit_tree');
  assert.equal(pDst.category, 'food');
  assert.equal(pDst.hasFruit, false);
  assert.equal(pDst.fruitRegrowDaysRemaining, 7.5);
  assert.equal(pDst.woodRemaining, 8);
  assert.equal(pDst.maxWood, 12);
  assert.equal(pDst.woodRegrowDaysRemaining, 14.2);
});

// 7. Nạp bản lưu cũ (không có các trường mới) có fallback an toàn, không crash
test('7. Bản lưu cũ không có fruitRegrowDaysRemaining / woodRemaining được fallback an toàn', () => {
  const timeMgr = TimeManager.getInstance();
  const srcEngine = {
    world: new ECSWorld(),
    worldMap: new WorldMap(8, 8),
    qiGrid: new QiGrid(8, 8),
    spatialGrid: new SpatialGrid(32),
    camera: { x: 0, y: 0, zoom: 1 },
    timeManager: timeMgr,
    worldName: 'Bản Lưu Cũ',
    worldTemplate: 'thap_van_dai_son',
    worldSeed: 2026
  };
  PlantFactory.spawnPlant(srcEngine.world, 'oak_tree', 3, 3, 'mature');
  const dstEngine = {
    world: new ECSWorld(),
    worldMap: new WorldMap(8, 8),
    qiGrid: new QiGrid(8, 8),
    spatialGrid: new SpatialGrid(32),
    camera: { x: 0, y: 0, zoom: 1 },
    timeManager: timeMgr,
    worldName: '',
    worldTemplate: '',
    worldSeed: 0
  };

  const legacySave = SaveManager.serializeWorld(srcEngine as any, 'Bản Lưu Cũ');
  const oldPlant = legacySave.entities.find(e => e.components.plant)?.components.plant;
  assert.ok(oldPlant);
  delete oldPlant.fruitRegrowDaysRemaining;
  delete oldPlant.woodRemaining;
  delete oldPlant.maxWood;
  delete oldPlant.woodRegrowDaysRemaining;
  delete oldPlant.reservedWood;

  SaveManager.deserializeWorld(dstEngine as any, legacySave);

  const plantEntities = dstEngine.world.query([PlantComponent]);
  assert.equal(plantEntities.length, 1);

  const p = dstEngine.world.getComponent(plantEntities[0], PlantComponent)!;
  assert.equal(p.fruitRegrowDaysRemaining, 0, 'Fallback fruitRegrowDaysRemaining = 0');
  assert.equal(p.maxWood, 25, 'Fallback maxWood = 25 cho oak_tree');
  assert.equal(p.woodRemaining, 25, 'Fallback woodRemaining = maxWood');
  assert.equal(p.woodRegrowDaysRemaining, 0, 'Fallback woodRegrowDaysRemaining = 0');
});

console.log(`\n========================================`);
console.log(`ĐÃ VƯỢT QUA TẤT CẢ ${passed} BÀI TEST FLORA ECONOMY!`);
console.log(`========================================\n`);
