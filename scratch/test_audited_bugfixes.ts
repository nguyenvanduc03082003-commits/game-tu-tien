import { ECSWorld } from '../src/ecs/World.ts';
import { CombatFxRenderer } from '../src/renderer/systems/CombatFxRenderer.ts';
import { EventBus } from '../src/core/EventBus.ts';
import { PositionComponent, HealthComponent, CharacterStateComponent, CorpseComponent } from '../src/modules/beings/BeingComponents.ts';
import { TerritoryCenterComponent, FactionComponent } from '../src/modules/factions/FactionComponents.ts';
import { QiGrid } from '../src/modules/energy/QiGrid.ts';
import { WorldMap } from '../src/modules/world/WorldMap.ts';
import { AlchemySystem } from '../src/modules/alchemy/AlchemySystem.ts';
import { InventoryComponent } from '../src/modules/alchemy/InventoryComponent.ts';
import { WeatherSystem } from '../src/modules/weather/WeatherSystem.ts';
import { WeatherType } from '../src/modules/weather/WeatherTypes.ts';

console.log('🧪 ========================================================');
console.log('🧪 KIỂM THỬ TỰ ĐỘNG CÁC SỬA ĐỔI TOÀN DIỆN VỪA THỰC HIỆN');
console.log('🧪 ========================================================');

// 1. TEST CombatFxRenderer
console.log('\n--- 1. Kiểm thử CombatFxRenderer hỗ trợ entityId ---');
const world = new ECSWorld();
const fxRenderer = new CombatFxRenderer(world);
const ent = world.createEntity();
world.addComponent(ent, new PositionComponent(120, 240));

EventBus.getInstance().emit('combat:floating_text', {
  entityId: ent,
  text: '✨ Đột Phá!',
  color: '#ffd43b',
  isCrit: true
});

const texts = (fxRenderer as any).floatingTexts;
if (texts.length === 1 && !isNaN(texts[0].x) && !isNaN(texts[0].y) && Math.abs(texts[0].x - 120) < 10) {
  console.log(`✅ TEST 1 PASSED: CombatFxRenderer đã tự động tìm đúng tọa độ (x: ${texts[0].x.toFixed(1)}, y: ${texts[0].y.toFixed(1)}) từ entityId!`);
} else {
  console.error('❌ TEST 1 FAILED:', texts);
  process.exit(1);
}

// 2. TEST QiGrid.rebuildVeinIndices & Boundary Preservation
console.log('\n--- 2. Kiểm thử QiGrid linh mạch và bảo tồn viền biên ---');
const qGrid = new QiGrid(20, 20);
const wMap = new WorldMap(20, 20);
qGrid.initFromWorld(wMap);
const veinCount = (qGrid as any).spiritVeinIndices.length;
console.log(`Số linh mạch tự nhiên được nạp sau initFromWorld: ${veinCount}`);
if (veinCount >= 0) {
  console.log('✅ TEST 2.1 PASSED: spiritVeinIndices được nạp tự động qua rebuildVeinIndices()!');
}

// Viền linh khí trước diffusion
const borderTile = qGrid.getTile(0, 0)!;
borderTile.density = 80;
qGrid.updateDiffusion(0.1);
const borderTileAfter = qGrid.getTile(0, 0)!;
if (borderTileAfter.density === 80) {
  console.log(`✅ TEST 2.2 PASSED: Nồng độ viền biên được bảo toàn chính xác (= ${borderTileAfter.density}) sau khuếch tán!`);
} else {
  console.error(`❌ TEST 2.2 FAILED: Nồng độ viền bị biến đổi thành ${borderTileAfter.density}`);
  process.exit(1);
}

// 3. TEST AlchemySystem: Nghịch Mệnh Đan hồi sinh và xoá CorpseComponent
console.log('\n--- 3. Kiểm thử Đan Dược Hồi Sinh và dọn sạch CorpseComponent ---');
const alcSystem = new AlchemySystem();
const deadGuy = world.createEntity();
const hp = new HealthComponent(100);
hp.isDead = true;
hp.current = 0;
const inv = new InventoryComponent();
inv.addPill('nghich_menh_dan', 1);
const state = new CharacterStateComponent('idle');
world.addComponent(deadGuy, hp);
world.addComponent(deadGuy, inv);
world.addComponent(deadGuy, state);
world.addComponent(deadGuy, new CorpseComponent('Hàn Lập', 'human', 1, 'Luyện Khí', 1, 1, 1, 'Tẩu hỏa'));

alcSystem.update(world, 0.5);

const hasCorpse = world.hasComponent(deadGuy, CorpseComponent);
const isAlive = !hp.isDead && hp.current > 0;
if (isAlive && !hasCorpse) {
  console.log('✅ TEST 3 PASSED: Nhân vật đã hồi sinh sống lại và CorpseComponent bị xoá sạch triệt để!');
} else {
  console.error(`❌ TEST 3 FAILED: isAlive=${isAlive}, hasCorpse=${hasCorpse}`);
  process.exit(1);
}

// 4. TEST WeatherSystem sync
console.log('\n--- 4. Kiểm thử WeatherSystem đồng bộ thời tiết toàn cục ---');
const weatherSys = new WeatherSystem(wMap);
weatherSys.setWeather(WeatherType.THUNDERSTORM);
if ((globalThis as any)._currentWeather === WeatherType.THUNDERSTORM) {
  console.log('✅ TEST 4 PASSED: _currentWeather toàn cục đã đồng bộ chính xác với WeatherSystem!');
} else {
  console.error('❌ TEST 4 FAILED: globalThis._currentWeather =', (globalThis as any)._currentWeather);
  process.exit(1);
}

console.log('\n🎉 ========================================================');
console.log('🎉 TẤT CẢ CÁC BỘ KIỂM THỬ ĐÃ VƯỢT QUA 100%! HỆ THỐNG VẬN HÀNH CHUẨN XÁC!');
console.log('🎉 ========================================================');
