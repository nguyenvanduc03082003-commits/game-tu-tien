import { WorldChronicle } from '../src/ui/WorldChronicle.ts';
import { EventBus } from '../src/core/EventBus.ts';
import { ECSWorld } from '../src/ecs/World.ts';
import { FactionFactory } from '../src/modules/factions/FactionFactory.ts';
import { FactionSystem } from '../src/modules/factions/FactionSystem.ts';
import { FactionComponent } from '../src/modules/factions/FactionComponents.ts';
import { HealthComponent, NameComponent, RealmComponent } from '../src/modules/beings/BeingComponents.ts';
import { CultivationSystem } from '../src/modules/cultivation/CultivationSystem.ts';
import { WorldMap } from '../src/modules/world/WorldMap.ts';
import { QiGrid } from '../src/modules/energy/QiGrid.ts';
import { TribulationSystem } from '../src/modules/cultivation/TribulationSystem.ts';

// Mock DOM elements
class FakeElement {
  children: FakeElement[] = [];
  style: Record<string, string> = {};
  textContent: string = '';
  innerHTML: string = '';
  className: string = '';
  scrollTop: number = 0;
  scrollHeight: number = 0;

  appendChild(child: FakeElement) {
    this.children.push(child);
    return child;
  }
  removeChild(child: FakeElement) {
    const idx = this.children.indexOf(child);
    if (idx !== -1) this.children.splice(idx, 1);
    return child;
  }
  get firstChild() {
    return this.children[0] || null;
  }
}

(global as any).document = {
  createElement: () => new FakeElement()
};

async function runTests() {
  console.log('🧪 ========================================================');
  console.log('🧪 BẮT ĐẦU KIỂM THỬ: LỌC NHẬT KÝ THẾ GIỚI (WORLD CHRONICLE)');
  console.log('🧪 ========================================================');

  const parent = new FakeElement() as any;
  const chronicle = new WorldChronicle(parent);
  const eventBus = EventBus.getInstance();

  // Truy cập danh sách log thông qua FakeElement bên trong container
  const container = (chronicle as any).container as FakeElement;
  const logList = (chronicle as any).logList as FakeElement;

  console.log('\n--- TEST 1: Kiểm tra thông điệp khởi nguyên thiên địa ---');
  console.log(`Số lượng log ban đầu: ${logList.children.length}`);
  if (logList.children.length !== 1) {
    throw new Error(`Kỳ vọng 1 log mở đầu, nhưng có ${logList.children.length}`);
  }
  console.log(`Log mở đầu: "${logList.children[0].textContent}"`);
  console.log('✅ TEST 1 PASSED: Khởi tạo thông điệp Dị tượng thành công!');

  console.log('\n--- TEST 2: Thử nghiệm bắn các sự kiện vụn vặt (Phải bị từ chối 100%) ---');
  const initialCount = logList.children.length;

  eventBus.emit('world:log', { type: 'death', message: 'Tu sĩ A bị dã thú cắn chết' });
  eventBus.emit('world:log', { type: 'breakthrough', message: 'Tu sĩ B đột phá Luyện Khí Tầng 2' });
  eventBus.emit('world:log', { type: 'breakthrough_fail', message: 'Tu sĩ C xung kích thất bại' });
  eventBus.emit('world:log', { type: 'event', message: 'Tu sĩ D nhặt được đan dược' });
  eventBus.emit('world:log', { type: 'game_loaded', message: 'Nạp game thành công' });
  eventBus.emit('world:log', { type: 'random_junk', message: 'Tin rác' });

  if (logList.children.length !== initialCount) {
    throw new Error(`LỖI: Các sự kiện vụn vặt đã lọt vào log! Hiện có ${logList.children.length} logs.`);
  }
  console.log(`✅ TEST 2 PASSED: Toàn bộ sự kiện vụn vặt (chết, đột phá nhỏ, đan dược...) đã bị lọc bỏ hoàn toàn! (${logList.children.length} logs)`);

  console.log('\n--- TEST 3: Ghi nhận Dị Tượng Thiên Địa (anomaly) ---');
  eventBus.emit('world:log', {
    type: 'anomaly',
    message: '✨ THIÊN ĐỊA DỊ TƯỢNG: Tiên Duyên giáng hạ! Một mạch TIÊN KHÍ xuất hiện tại (120, 150)!'
  });
  eventBus.emit('world:log', {
    type: 'anomaly',
    message: '⚡ THIÊN ĐỊA DỊ TƯỢNG: Cửu thiên lôi vân cuồn cuộn che khuất nhật nguyệt, Lôi Bạo giáng thế!'
  });

  const countAfterAnomaly = logList.children.length;
  if (countAfterAnomaly !== initialCount + 2) {
    throw new Error(`Kỳ vọng ${initialCount + 2} logs sau khi bắn 2 dị tượng, nhưng có ${countAfterAnomaly}`);
  }
  console.log(`Log mới nhất: "${logList.children[logList.children.length - 1].textContent}"`);
  console.log('✅ TEST 3 PASSED: Dị tượng thiên địa được ghi nhận chuẩn xác!');

  console.log('\n--- TEST 4: Ghi nhận Thế Lực Sinh Ra (faction_created) & Thế Lực Biến Mất (faction_destroyed) ---');
  const world = new ECSWorld();

  // 1. Tạo thế lực
  const { factionEntity, factionId } = FactionFactory.createFaction(world, {
    name: 'Thái Hư Tiên Tông',
    type: 'sect'
  });

  const logAfterCreate = logList.children[logList.children.length - 1].textContent;
  console.log(`Log sau khi tạo thế lực: "${logAfterCreate}"`);
  if (!logAfterCreate.includes('THẾ LỰC KHỞI NGUYÊN') || !logAfterCreate.includes('Thái Hư Tiên Tông')) {
    throw new Error(`Lỗi: Không tìm thấy log khởi tạo thế lực!`);
  }

  // 2. Thêm thành viên vào thế lực
  const memberEnt = world.createEntity();
  const hp = new HealthComponent(100);
  world.addComponent(memberEnt, hp);
  world.addComponent(memberEnt, new NameComponent('Đạo Nhất Chân Nhân'));
  const factionComp = world.getComponent(factionEntity, FactionComponent)!;
  factionComp.members.add(memberEnt);
  factionComp.leaderEntityId = memberEnt;

  const factionSystem = new FactionSystem();
  // Chạy cập nhật lần 1 để hệ thống nhận diện thành viên sống
  factionSystem.update(world, 5.0);

  // 3. Giết chết thành viên duy nhất của thế lực
  hp.isDead = true;
  hp.current = 0;

  // Chạy cập nhật lần 2: Tất cả thành viên đã chết -> Thế lực diệt vong!
  factionSystem.update(world, 5.0);

  const logAfterDestroy = logList.children[logList.children.length - 1].textContent;
  console.log(`Log sau khi diệt môn: "${logAfterDestroy}"`);
  if (!logAfterDestroy.includes('THẾ LỰC DIỆT VONG') || !logAfterDestroy.includes('Thái Hư Tiên Tông')) {
    throw new Error(`Lỗi: Không tìm thấy log thế lực diệt vong!`);
  }
  console.log('✅ TEST 4 PASSED: Thế lực sinh ra và biến mất được ghi nhận chuẩn xác!');

  console.log('\n--- TEST 5: Ghi nhận Có Người Đột Phá Cấp Cao Nhất (highest_breakthrough) ---');
  const map = new WorldMap(50, 50);
  const qiGrid = new QiGrid(50, 50);
  const tribSystem = new TribulationSystem();
  const cultSystem = new CultivationSystem(map, qiGrid, tribSystem);

  const cultivator = world.createEntity();
  const cultRealm = new RealmComponent('human_realms', 3, 'Kết Đan', 3, 'Kim Đan Cực Hạn');
  world.addComponent(cultivator, cultRealm);
  world.addComponent(cultivator, new HealthComponent(500));
  world.addComponent(cultivator, new NameComponent('Hàn Lập'));

  // Đột phá lên Nguyên Anh (cảnh giới tối cao index 4 của Nhân Tộc)
  cultSystem.completeMajorBreakthrough(world, cultivator);

  const logAfterAscend = logList.children[logList.children.length - 1].textContent;
  console.log(`Log sau khi đột phá đỉnh phong: "${logAfterAscend}"`);
  if (!logAfterAscend.includes('ĐỈNH PHONG CHỨNG ĐẠO') || !logAfterAscend.includes('Nguyên Anh')) {
    throw new Error(`Lỗi: Không tìm thấy log đột phá cảnh giới tối cao!`);
  }
  console.log('✅ TEST 5 PASSED: Đột phá cấp cao nhất được ghi nhận chuẩn xác!');

  console.log('\n🎉 ========================================================');
  console.log('🎉 TẤT CẢ 5/5 BỘ TEST CASE ĐÃ VƯỢT QUA 100%!');
  console.log('🎉 NHẬT KÝ THẾ GIỚI HOẠT ĐỘNG HOÀN HẢO THEO ĐÚNG YÊU CẦU!');
  console.log('🎉 ========================================================');
}

runTests().catch(err => {
  console.error('❌ LỖI TRONG KIỂM THỬ:', err);
  process.exit(1);
});
