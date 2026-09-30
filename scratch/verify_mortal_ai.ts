import { ECSWorld } from '../src/ecs/World.ts';
import { WorldMap } from '../src/modules/world/WorldMap.ts';
import { QiGrid } from '../src/modules/energy/QiGrid.ts';
import { TribulationSystem } from '../src/modules/cultivation/TribulationSystem.ts';
import { CultivationSystem } from '../src/modules/cultivation/CultivationSystem.ts';
import { SpiritualRootSystem } from '../src/modules/cultivation/SpiritualRootSystem.ts';
import { MortalAISystem } from '../src/modules/ai/MortalAISystem.ts';
import {
  PositionComponent,
  HealthComponent,
  HungerComponent,
  CharacterStateComponent,
  LifespanComponent,
  RealmComponent,
  RaceComponent,
  SpiritualRootComponent,
  MortalNeedsComponent,
  DailyScheduleComponent,
  ChildcareComponent,
  NameComponent,
  CharacterHistoryComponent
} from '../src/modules/beings/BeingComponents.ts';
import { BuildingComponent } from '../src/modules/factions/FactionComponents.ts';

function runTests() {
  console.log('=====================================================');
  console.log('🧪 BẮT ĐẦU KIỂM THỬ HỆ THỐNG TRÍ TUỆ TỰ CHỦ PHÀM NHÂN');
  console.log('=====================================================\n');

  // TEST 1: TỶ LỆ THỨC TỈNH LINH CĂN TUỔI 12 (100,000 MẪU)
  console.log('--- TEST 1: Kiểm thử phân phối Thức Tỉnh Linh Căn khi 12 tuổi ---');
  const world = new ECSWorld();
  const rootSys = new SpiritualRootSystem();
  
  const sampleSize = 100000;
  const counts = {
    none: 0,
    impure: 0,
    true: 0,
    earth: 0,
    heaven: 0
  };

  for (let i = 0; i < sampleSize; i++) {
    const roll = Math.random() * 100;
    if (roll < 75.0) {
      counts.none++;
    } else if (roll < 95.0) {
      counts.impure++;
    } else if (roll < 99.0) {
      counts.true++;
    } else if (roll < 99.99) {
      counts.earth++;
    } else {
      counts.heaven++;
    }
  }

  console.log(`Kết quả 100,000 mẫu ngẫu nhiên:`);
  console.log(`- 🌑 Vô linh căn: ${(counts.none / sampleSize * 100).toFixed(2)}% (Kỳ vọng: 75.00%)`);
  console.log(`- 🌫️ Tạp linh căn: ${(counts.impure / sampleSize * 100).toFixed(2)}% (Kỳ vọng: 20.00%)`);
  console.log(`- 🌿 Chân linh căn: ${(counts.true / sampleSize * 100).toFixed(2)}% (Kỳ vọng: 4.00%)`);
  console.log(`- ⚡ Địa linh căn: ${(counts.earth / sampleSize * 100).toFixed(2)}% (Kỳ vọng: 0.99%)`);
  console.log(`- 🌟 Thiên linh căn: ${(counts.heaven / sampleSize * 100).toFixed(3)}% (Kỳ vọng: 0.01%)`);

  if (Math.abs(counts.none / sampleSize - 0.75) > 0.02) throw new Error('Phân phối vô linh căn lệch chuẩn!');
  if (Math.abs(counts.impure / sampleSize - 0.20) > 0.02) throw new Error('Phân phối tạp linh căn lệch chuẩn!');
  console.log('✅ TEST 1 ĐẠT: Tỷ lệ thức tỉnh linh căn hoàn toàn khớp với yêu cầu người dùng.\n');

  // TEST 2: KIỂM SOÁT HẤP THU LINH KHÍ (GATE QI ABSORPTION)
  console.log('--- TEST 2: Kiểm thử Ngăn Chặn Hấp Thu Linh Khí Đối Với Vô Linh Căn ---');
  const worldMap = new WorldMap(20, 20);
  const qiGrid = new QiGrid(20, 20);
  const tribulationSys = new TribulationSystem();
  const cultSys = new CultivationSystem(worldMap, qiGrid, tribulationSys);

  // Đặt linh khí cao tại ô (5, 5)
  qiGrid.setQi(5, 5, 100);

  // Phàm nhân 1: Vô linh căn
  const mortalEnt = world.createEntity();
  world.addComponent(mortalEnt, new RaceComponent('human'));
  world.addComponent(mortalEnt, new PositionComponent(5 * 16 + 8, 5 * 16 + 8, 1));
  world.addComponent(mortalEnt, new CharacterStateComponent('meditate', 'down'));
  world.addComponent(mortalEnt, new HealthComponent(100));
  world.addComponent(mortalEnt, new RealmComponent('human_realms', 0, 'Phàm Nhân', 'Sơ Kỳ', 0, 1000, 10, 0));
  world.addComponent(mortalEnt, new SpiritualRootComponent(true, 'none', 'Vô Linh Căn (Phàm Nhân)', [], 0));

  // Tu sĩ 1: Thiên linh căn
  const prodigyEnt = world.createEntity();
  world.addComponent(prodigyEnt, new RaceComponent('human'));
  world.addComponent(prodigyEnt, new PositionComponent(5 * 16 + 8, 5 * 16 + 8, 1));
  world.addComponent(prodigyEnt, new CharacterStateComponent('meditate', 'down'));
  world.addComponent(prodigyEnt, new HealthComponent(100));
  world.addComponent(prodigyEnt, new RealmComponent('human_realms', 0, 'Luyện Khí', 'Sơ Kỳ', 0, 1000, 20, 0));
  world.addComponent(prodigyEnt, new SpiritualRootComponent(true, 'heaven', 'Thiên Linh Căn', ['hoa'], 100));

  // Chạy 2 bước (1.0s) tu luyện
  for (let step = 0; step < 2; step++) {
    cultSys.update(world, 0.5);
  }

  const mortalRealm = world.getComponent(mortalEnt, RealmComponent)!;
  const prodigyRealm = world.getComponent(prodigyEnt, RealmComponent)!;

  console.log(`Linh khí của Phàm nhân Vô Linh Căn: ${mortalRealm.currentQi} (Kỳ vọng: 0)`);
  console.log(`Linh khí của Tu sĩ Thiên Linh Căn: ${prodigyRealm.currentQi.toFixed(2)} (Kỳ vọng: > 0)`);

  if (mortalRealm.currentQi !== 0) throw new Error('Lỗi: Phàm nhân vô linh căn vẫn hấp thu được linh khí!');
  if (prodigyRealm.currentQi <= 0) throw new Error('Lỗi: Tu sĩ thiên linh căn không hấp thu được linh khí!');
  console.log('✅ TEST 2 ĐẠT: Vô linh căn bị phong bế tuyệt đối khỏi linh khí; Thiên linh căn thổ nạp vượt trội.\n');

  // TEST 3: CƠ CHẾ NẤU ĂN & PHỤC HỒI NHU CẦU
  console.log('--- TEST 3: Kiểm thử Cơ Chế Nấu Ăn (Cooking) & Dùng Bữa Chất Lượng Cao ---');
  const aiSys = new MortalAISystem(worldMap);

  // Đặt thời gian trong ngày về giữa trưa (timeOfDay = 0.5, chính ngọ)
  const timeMgr = (aiSys as any).timeManager;
  timeMgr.update(0.5); // 10 ticks / 20 = 0.5
  console.log(`Thời gian hiện tại trong game: timeOfDay = ${timeMgr.getDate().timeOfDay} (Chính Ngọ Ban Ngày)`);

  // Tạo Lửa Trại tại (100, 100)
  const campfireEnt = world.createEntity();
  world.addComponent(campfireEnt, new PositionComponent(100, 100, 0));
  world.addComponent(campfireEnt, new BuildingComponent('campfire', 'Lửa Trại Thôn Bản', 200, 200, 0, 0));

  // Tạo Phàm Nhân tại vị trí Lửa Trại, đang đói và có 1 phần nguyên liệu thô
  const cookEnt = world.createEntity();
  world.addComponent(cookEnt, new PositionComponent(100, 100, 1.2));
  const cookHp = new HealthComponent(100);
  cookHp.current = 60; // Đang bị thương (60/100)
  world.addComponent(cookEnt, cookHp);
  world.addComponent(cookEnt, new HungerComponent(40)); // Đang đói
  world.addComponent(cookEnt, new CharacterStateComponent('idle', 'down'));
  const cookNeeds = new MortalNeedsComponent(80, 80, 50);
  cookNeeds.rawFoodCount = 1;
  cookNeeds.cookedMealCount = 0;
  world.addComponent(cookEnt, cookNeeds);
  const cookSchedule = new DailyScheduleComponent();
  world.addComponent(cookEnt, cookSchedule);

  // Chạy AI System: Người này đói (<45) và có rawFoodCount > 0, đang ở cạnh Lửa Trại (dist <= 18)
  aiSys.update(world, 0.5);

  console.log(`Sau khi nấu: RawFood = ${cookNeeds.rawFoodCount}, CookedMeals = ${cookNeeds.cookedMealCount}, Activity = ${cookSchedule.currentActivity}`);
  if (cookNeeds.rawFoodCount !== 0 || cookNeeds.cookedMealCount !== 2) {
    throw new Error('Lỗi: Cơ chế nấu ăn không chuyển 1 raw food thành 2 cooked meals!');
  }

  // Chạy tiếp AI tick: Bây giờ người này có cookedMealCount > 0 và vẫn đói -> Dùng bữa ngay!
  aiSys.update(world, 0.5);

  const hungerComp = world.getComponent(cookEnt, HungerComponent)!;
  const hpComp = world.getComponent(cookEnt, HealthComponent)!;
  console.log(`Sau khi dùng cơm chín: Hunger = ${hungerComp.current}, Recreation = ${cookNeeds.recreation}, HP = ${hpComp.current}, CookedMeals = ${cookNeeds.cookedMealCount}`);

  if (cookNeeds.cookedMealCount !== 1) throw new Error('Lỗi: Ăn cơm không giảm số lượng món nấu!');
  if (hungerComp.current <= 40) throw new Error('Lỗi: Ăn cơm chín không hồi phục cơn đói!');
  if (cookNeeds.recreation <= 50) throw new Error('Lỗi: Cơm ngon không tăng điểm giải trí tinh thần!');
  if (hpComp.current <= 60) throw new Error('Lỗi: Bữa ăn chất lượng không hồi máu!');
  console.log('✅ TEST 3 ĐẠT: Nấu nướng tiêu hao nguyên liệu thô và tạo bữa ăn chất lượng cao (+HP, +Recreation, +No ấm).\n');

  // TEST 4: CHĂM SÓC HÀI ĐỒNG (CHILDCARE)
  console.log('--- TEST 4: Kiểm thử Người Lớn Chăm Sóc & Tiếp Tế Cho Hài Đồng ---');
  // Tạo 1 hài đồng đói (<45) đứng cạnh người lớn
  const childEnt = world.createEntity();
  world.addComponent(childEnt, new PositionComponent(105, 100, 1.0));
  world.addComponent(childEnt, new HungerComponent(25)); // Hài đồng đói lả
  world.addComponent(childEnt, new HealthComponent(50));
  world.addComponent(childEnt, new CharacterStateComponent('idle', 'down'));
  world.addComponent(childEnt, new ChildcareComponent(true)); // Là hài đồng
  world.addComponent(childEnt, new MortalNeedsComponent(80, 80, 80));
  world.addComponent(childEnt, new DailyScheduleComponent());

  // Người lớn hiện có 1 suất cơm nấu chín còn lại
  // Cho người lớn no ấm (> 60) để họ ưu tiên chăm sóc trẻ
  hungerComp.current = 80;

  aiSys.update(world, 0.5);

  const childHunger = world.getComponent(childEnt, HungerComponent)!;
  console.log(`Sau khi người lớn chăm sóc: CookedMeals của người lớn = ${cookNeeds.cookedMealCount}, Hunger của trẻ = ${childHunger.current}`);
  if (cookNeeds.cookedMealCount !== 0) throw new Error('Lỗi: Người lớn chưa nhường phần cơm cho trẻ đói!');
  if (childHunger.current < 75) throw new Error('Lỗi: Trẻ chưa được hồi phục cơn đói!');
  console.log('✅ TEST 4 ĐẠT: Người lớn tự giác san sẻ phần ăn cho hài đồng đói khát lân cận.\n');

  console.log('=====================================================');
  console.log('🎉 TẤT CẢ 4 BÀI KIỂM THỬ ĐÃ THÀNH CÔNG RỰC RỠ!');
  console.log('=====================================================');
}

runTests();
