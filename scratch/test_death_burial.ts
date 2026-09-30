import { ECSWorld } from '../src/ecs/World.ts';
import { WorldMap } from '../src/modules/world/WorldMap.ts';
import { TimeManager } from '../src/core/TimeManager.ts';
import {
  PositionComponent,
  HealthComponent,
  CharacterStateComponent,
  NameComponent,
  RaceComponent,
  RealmComponent,
  CorpseComponent,
  GraveComponent,
  DroppedLootComponent
} from '../src/modules/beings/BeingComponents.ts';
import { CorpseAndGraveSystem } from '../src/modules/beings/CorpseAndGraveSystem.ts';
import { InventoryComponent } from '../src/modules/alchemy/InventoryComponent.ts';
import { EquipmentComponent } from '../src/modules/combat/CombatComponents.ts';
import { WEAPON_DEFINITIONS } from '../src/config/weapons.config.ts';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${msg}`);
    process.exit(1);
  }
  console.log(`✅ PASSED: ${msg}`);
}

console.log('=== TEST 1: CÔNG THỨC THỜI GIAN PHÂN HỦY XÁC (CORPSE DECAY FORMULA) ===');
// Yêu cầu 1: Phàm nhân thời gian duy trì xác là 1 tháng (30 ngày)
// Yêu cầu 2: Cứ tăng 1 cấp lớn thì thời gian duy trì của xác tăng 5 lần (5^stageIndex)

for (let stage = 0; stage <= 4; stage++) {
  const dummyItems = { pills: [], mainHand: null, offHand: null, bodyArmor: null, artifact: null };
  const corpse = new CorpseComponent('Test Tu Si', 'human', stage, `Stage ${stage}`, 1, 1, 1, 'Tọa hóa', dummyItems);
  const expectedDays = 30 * Math.pow(5, stage);
  const expectedMonths = expectedDays / 30;
  assert(corpse.totalDays === expectedDays, `Cấp ${stage}: Thời gian duy trì xác là ${corpse.totalDays} ngày (${expectedMonths} tháng)`);
}

console.log('\n=== TEST 2: CÔNG THỨC THỜI GIAN MỘ BIẾN MẤT (GRAVE LIFESPAN FORMULA) ===');
// Yêu cầu 3: Mộ của phàm nhân biến mất sau 12 tháng (360 ngày). Cứ tăng 1 cấp bậc ứng với người chết thì tăng thêm 4 lần (4^stageIndex)

for (let stage = 0; stage <= 4; stage++) {
  const dummyItems = { pills: [], mainHand: null, offHand: null, bodyArmor: null, artifact: null };
  const grave = new GraveComponent('Test Tu Si', 'human', stage, `Stage ${stage}`, 'Người thân', 1, 1, 1, 1, dummyItems);
  const expectedDays = 360 * Math.pow(4, stage);
  const expectedMonths = expectedDays / 30;
  assert(grave.totalDays === expectedDays, `Cấp ${stage}: Thời gian mộ tồn tại là ${grave.totalDays} ngày (${expectedMonths} tháng)`);
}

console.log('\n=== TEST 3: XÁC TỰ PHÂN HỦY SAU 1 THÁNG VÀ RƠI HÀNH TRANG RA ĐẤT (DROPPED LOOT) ===');
{
  const world = new ECSWorld();
  const worldMap = new WorldMap(50, 50);
  const timeManager = TimeManager.getInstance();
  timeManager.reset();

  const system = new CorpseAndGraveSystem(worldMap);
  world.addSystem(system);

  // Tạo một phàm nhân chết mang theo kiếm và linh đan
  const ent = world.createEntity();
  world.addComponent(ent, new PositionComponent(100, 100));
  world.addComponent(ent, new NameComponent('Lý Đại Trụ'));
  world.addComponent(ent, new RaceComponent('human'));
  world.addComponent(ent, new RealmComponent('human_realms', 0, 'Phàm Nhân', 'Bình Phàm', 10, 50, 10, 0));
  const hp = new HealthComponent(100);
  hp.current = 0;
  hp.isDead = true;
  world.addComponent(ent, hp);
  world.addComponent(ent, new CharacterStateComponent('dead', 'down'));

  const inv = new InventoryComponent({ kim_sang_dan: 3 });
  world.addComponent(ent, inv);

  const equip = new EquipmentComponent();
  equip.mainHand = WEAPON_DEFINITIONS['iron_sword'] || null;
  world.addComponent(ent, equip);

  // Step system để khởi tạo CorpseComponent
  system.update(world, 0.3);

  const corpse = world.getComponent(ent, CorpseComponent);
  assert(corpse !== undefined, 'CorpseComponent được tự động khởi tạo khi nhân vật tử vong');
  assert(corpse?.remainingDays === 30, 'Phàm nhân tử vong có thời gian duy trì xác là 30 ngày (1 tháng)');
  assert(corpse?.items.pills.length === 1 && corpse?.items.pills[0].id === 'kim_sang_dan', 'Đan dược trong hành trang được lưu lại trong xác');
  assert(corpse?.items.mainHand?.id === 'iron_sword', 'Vũ khí trang bị được lưu lại trong xác');

  // Giả lập thời gian trôi qua 31 ngày (vượt quá 1 tháng)
  // Mỗi ngày = 20 ticks
  for (let i = 0; i < 31 * 20; i++) {
    timeManager.update(1 / 20);
  }
  system.update(world, 0.3);

  // Kiểm tra: Thi thể phải biến mất khỏi ECS
  const corpseAfter = world.getComponent(ent, CorpseComponent);
  assert(corpseAfter === undefined, 'Thi hài phàm nhân đã hoàn toàn biến mất sau 1 tháng');

  // Kiểm tra: Phải sinh ra thực thể DroppedLootComponent tại vị trí (100, 100)
  const loots = world.query([PositionComponent, DroppedLootComponent]);
  assert(loots.length === 1, 'Sinh ra 1 gói đồ DroppedLootComponent rơi ngoài đất');
  const lootComp = world.getComponent(loots[0], DroppedLootComponent)!;
  const lootPos = world.getComponent(loots[0], PositionComponent)!;
  assert(lootPos.x === 100 && lootPos.y === 100, 'Túi di vật rơi đúng vị trí xác chết');
  assert(lootComp.ownerName === 'Lý Đại Trụ', 'Túi di vật ghi đúng tên người đã mất');
  assert(lootComp.items.mainHand?.id === 'iron_sword', 'Túi di vật chứa đúng thanh kiếm sắt của người chết');
  assert(lootComp.items.pills[0].count === 3, 'Túi di vật chứa đúng 3 viên Kim Sáng Đan');
}

console.log('\n=== TEST 4: NGƯỜI THÂN CHÔN CẤT & PHƯƠNG ÁN A (ĐỒ TÙY TÁNG TRONG MỘ) ===');
{
  const world = new ECSWorld();
  const worldMap = new WorldMap(50, 50);
  const timeManager = TimeManager.getInstance();
  timeManager.reset();

  const system = new CorpseAndGraveSystem(worldMap);
  world.addSystem(system);

  // Tạo người chết (Trúc Cơ Cấp 2)
  const deadEnt = world.createEntity();
  world.addComponent(deadEnt, new PositionComponent(50, 50));
  world.addComponent(deadEnt, new NameComponent('Bạch Tố Nữ'));
  world.addComponent(deadEnt, new RaceComponent('human'));
  world.addComponent(deadEnt, new RealmComponent('human_realms', 2, 'Trúc Cơ', 'Sơ Kỳ', 200, 1200, 250, 0));
  const hp = new HealthComponent(500);
  hp.isDead = true;
  world.addComponent(deadEnt, hp);
  world.addComponent(deadEnt, new CharacterStateComponent('dead', 'down'));
  const equip = new EquipmentComponent();
  equip.mainHand = WEAPON_DEFINITIONS['spirit_sword'] || WEAPON_DEFINITIONS['iron_sword'] || null;
  world.addComponent(deadEnt, equip);

  // Tạo người thân chôn cất
  const relativeEnt = world.createEntity();
  world.addComponent(relativeEnt, new PositionComponent(52, 52));
  world.addComponent(relativeEnt, new NameComponent('Hàn Lập'));

  // Step system để khởi tạo CorpseComponent
  system.update(world, 0.3);

  // Tìm vị trí huyệt mộ trong nghĩa trang thôn
  const burialPlot = CorpseAndGraveSystem.getOrCreateBurialPlot(world, relativeEnt, worldMap);
  assert(burialPlot.x !== undefined && burialPlot.y !== undefined, 'Quy hoạch được vị trí huyệt mộ trong Nghĩa Trang Thôn');

  // Thực hiện an táng
  const graveEnt = CorpseAndGraveSystem.executeBurial(world, deadEnt, relativeEnt, burialPlot);
  assert(graveEnt !== -1, 'An táng thành công, tạo ra thực thể Ngôi Mộ');

  // Xác chết cũ phải bị hủy
  const deadStillExists = world.getComponent(deadEnt, CorpseComponent);
  assert(deadStillExists === undefined, 'Thi hài đã được hạ huyệt, entity xác chết cũ bị tiêu hủy');

  // Ngôi mộ mới
  const graveComp = world.getComponent(graveEnt, GraveComponent)!;
  assert(graveComp !== undefined, 'Ngôi mộ có GraveComponent');
  assert(graveComp.deceasedName === 'Bạch Tố Nữ', 'Bia mộ ghi đúng tên người đã mất');
  assert(graveComp.buriedByName === 'Hàn Lập', 'Bia mộ ghi đúng tên người thân an táng');
  assert(graveComp.realmStageIndex === 2, 'Bia mộ ghi nhận đúng cảnh giới Trúc Cơ (cấp 2)');
  // Trúc Cơ = 360 * 4^2 = 5,760 ngày (192 tháng = 16 năm)
  assert(graveComp.totalDays === 5760, `Thời gian mộ Trúc Cơ tồn tại là ${graveComp.totalDays} ngày (192 tháng = 16 năm)`);

  // Phương án A: Đồ tùy táng lưu giữ trong mộ
  assert(graveComp.burialGoods.mainHand !== null, 'Phương án A: Toàn bộ vũ khí trang bị được lưu giữ làm đồ tùy táng trong mộ');

  // Giả lập mộ phong hóa theo thời gian
  // Tua 5,761 ngày
  for (let i = 0; i < 5761 * 20; i++) {
    timeManager.update(1 / 20);
  }
  system.update(world, 0.3);

  const graveAfter = world.getComponent(graveEnt, GraveComponent);
  assert(graveAfter === undefined, 'Ngôi mộ Trúc Cơ đã phong hóa hoàn toàn sau 192 tháng');
}

console.log('\n🎉 TẤT CẢ 4 BỘ TEST ĐÃ VƯỢT QUA XUẤT SẮC!');
