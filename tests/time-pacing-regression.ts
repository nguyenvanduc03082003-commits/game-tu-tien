import assert from 'node:assert/strict';
import { TimeManager, Season, WorldDate, TimeSpeed, calendarDaysAtTick } from '../src/core/TimeManager.ts';
import { EventBus } from '../src/core/EventBus.ts';
import { ECSWorld } from '../src/ecs/World.ts';
import { SaveManager } from '../src/modules/save/SaveManager.ts';
import { GameSettings } from '../src/core/GameSettings.ts';

import { WorldMap } from '../src/modules/world/WorldMap.ts';
import { QiGrid } from '../src/modules/energy/QiGrid.ts';
import { DiplomacySystem } from '../src/modules/factions/DiplomacySystem.ts';
import { TribulationSystem } from '../src/modules/cultivation/TribulationSystem.ts';

let passed = 0;
function test(name: string, fn: () => void | Promise<void>) {
  const res = fn();
  if (res && typeof (res as any).then === 'function') {
    return (res as Promise<void>).then(() => {
      passed++;
      console.log('PASS time-pacing:', name);
    });
  }
  passed++;
  console.log('PASS time-pacing:', name);
}

function createMockTimeEngine() {
  const tm = TimeManager.getInstance();
  tm.reset();
  const world = new ECSWorld();
  const worldMap = new WorldMap(8, 8);
  const qiGrid = new QiGrid(8, 8);
  const tribulationSystem = new TribulationSystem();
  const diplomacySystem = new DiplomacySystem();
  return {
    world,
    timeManager: tm,
    camera: { x: 100, y: 100, zoom: 1.0 },
    worldMap,
    qiGrid,
    weatherSystem: { currentWeather: 'CLEAR', serializeState: () => ({ currentWeather: 'CLEAR', weatherTimer: 0, tileTimer: 0 }), restoreState: () => {} },
    tribulationSystem,
    diplomacySystem,
    stepSimulation: function(deltaRealSeconds: number) {
      return this.timeManager.update(deltaRealSeconds, (tickDt, tickIdx) => {
        this.world.update(tickDt);
      });
    },
    resetWorldState: function() {
      this.world.clear();
    }
  };
}

// 1. Tick giả lập 400 lần ở 1x cho ra 1 ngày; 0.5x cần gấp đôi thời gian thực; 3x và 5x xen kẽ đồng hồ; pause không cộng tick
test('1: 400 ticks = 1 ngày ở 1x; 0.5x cần 40s thực cho 1 ngày; pause không cộng tick; 3x & 5x xen kẽ', () => {
  const tm = TimeManager.getInstance();
  tm.reset();
  tm.setSpeed(1);

  // 1 frame = 0.05s ở 1x. 400 frames = 20.0s thực = 400 ticks = 1 ngày
  let ticksRun = 0;
  for (let i = 0; i < 400; i++) {
    ticksRun += tm.update(0.05);
  }
  assert.equal(ticksRun, 400, '20 giây thực ở 1x (400 frame 50ms) phải thực thi đúng 400 ticks');
  assert.equal(tm.getTotalTicks(), 400);
  const date1x = tm.getDate();
  assert.equal(date1x.totalDays, 1, 'Sau 400 ticks phải là ngày 1 (tính từ ngày 0)');
  assert.equal(date1x.day, 2, 'Lịch hiển thị ngày 2');

  // Pause không cộng tick
  tm.setSpeed(0);
  let pausedTicks = 0;
  for (let i = 0; i < 400; i++) {
    pausedTicks += tm.update(0.05);
  }
  assert.equal(pausedTicks, 0, 'Khi tạm dừng (0x), không được chạy tick nào');
  assert.equal(tm.getTotalTicks(), 400);

  // 0.5x: cần gấp đôi thời gian (800 frame 50ms = 40 giây thực cho 400 ticks = 1 ngày)
  tm.setSpeed(0.5);
  let halfSpeedTicks = 0;
  for (let i = 0; i < 800; i++) {
    halfSpeedTicks += tm.update(0.05);
  }
  assert.equal(halfSpeedTicks, 400, '40 giây thực ở 0.5x phải thực thi đúng 400 ticks');
  assert.equal(tm.getTotalTicks(), 800);
  const date05x = tm.getDate();
  assert.equal(date05x.totalDays, 2);

  // 3x: xen kẽ đồng hồ
  tm.setSpeed(3);
  const observedTicks3x: number[] = [];
  tm.update(0.1, (dt, idx) => {
    observedTicks3x.push(tm.getTotalTicks());
  });
  // 0.1s ở 3x = 0.3s mô phỏng = 6 ticks
  assert.equal(observedTicks3x.length, 6);
  assert.deepEqual(observedTicks3x, [801, 802, 803, 804, 805, 806]);

  // 5x: xen kẽ đồng hồ
  tm.setSpeed(5);
  const observedTicks5x: number[] = [];
  tm.update(0.1, (dt, idx) => {
    observedTicks5x.push(tm.getTotalTicks());
  });
  // 0.1s ở 5x = 0.5s mô phỏng = 10 ticks
  assert.equal(observedTicks5x.length, 10);
  assert.deepEqual(observedTicks5x, [807, 808, 809, 810, 811, 812, 813, 814, 815, 816]);
});

// 2. Pause / Resume khôi phục đúng tốc độ dương trước đó
test('2: Pause và resume khôi phục tốc độ dương trước đó (kể cả 0.5x, 3x)', () => {
  const tm = TimeManager.getInstance();
  tm.reset();

  tm.setSpeed(0.5);
  assert.equal(tm.getSpeed(), 0.5);
  tm.togglePause();
  assert.equal(tm.getSpeed(), 0);
  assert.equal(tm.isPaused(), true);
  tm.togglePause();
  assert.equal(tm.getSpeed(), 0.5, 'Resume phải khôi phục 0.5x');

  tm.setSpeed(3);
  tm.setSpeed(0);
  assert.equal(tm.isPaused(), true);
  tm.resume();
  assert.equal(tm.getSpeed(), 3, 'Resume phải khôi phục 3x');
});

// 3. Sự kiện chuyển tháng, mùa, năm bắn đúng một lần qua các ranh giới 30, 90, 360 ngày
test('3: Sự kiện chuyển tháng, mùa, năm bắn đúng 1 lần qua ranh giới 30, 90, 360 ngày', () => {
  const tm = TimeManager.getInstance();
  tm.reset();
  tm.setSpeed(1);
  const bus = EventBus.getInstance();

  let daysPassed = 0;
  let seasonsChanged = 0;
  let yearsPassed = 0;

  const off1 = bus.on('time:day_passed', () => { daysPassed++; });
  const off2 = bus.on('time:season_changed', () => { seasonsChanged++; });
  const off3 = bus.on('time:year_passed', () => { yearsPassed++; });

  try {
    // Tiến đúng 360 ngày: mỗi ngày 400 ticks = 144,000 ticks
    for (let d = 0; d < 360; d++) {
      for (let t = 0; t < TimeManager.TICKS_PER_DAY; t++) {
        tm.stepSingleTick();
      }
    }

    assert.equal(daysPassed, 360, 'Phải bắn đúng 360 sự kiện time:day_passed');
    // Bắt đầu Mùa Xuân (tháng 1). Chuyển sang Mùa Hạ (tháng 4, ngày 90), Mùa Thu (tháng 7, ngày 180), Mùa Đông (tháng 10, ngày 270), Mùa Xuân Năm 2 (tháng 1, ngày 360) -> đúng 4 lần chuyển mùa
    assert.equal(seasonsChanged, 4, 'Phải bắn đúng 4 lần time:season_changed trong 1 năm');
    // Năm mới bắn khi sang Năm 2 (ngày 360, tháng 1, ngày 1)
    assert.equal(yearsPassed, 1, 'Phải bắn đúng 1 lần time:year_passed');

    const date = tm.getDate();
    assert.equal(date.year, 2);
    assert.equal(date.month, 1);
    assert.equal(date.day, 1);
    assert.equal(date.season, Season.SPRING);
  } finally {
    off1();
    off2();
    off3();
  }
});

// 4. Save cũ tại tick không chia hết cho 20 (ví dụ 45) giữ đúng ngày và phần ngày sau load
test('4: Save cũ tại tick không chia hết cho 20 (tick 45) giữ đúng ngày và phần ngày sau load; nạp lại không lệch', () => {
  const engine = createMockTimeEngine();
  const baseSave = SaveManager.serializeWorld(engine as any, 'Thế Giới Cũ');
  const mockOldSaveData: any = JSON.parse(JSON.stringify(baseSave));
  mockOldSaveData.time = {
    totalTicks: 45,
    speed: 1
    // Không có clockSchema: bản lưu từ hệ cũ 20 ticks/ngày
  };

  SaveManager.deserializeWorld(engine as any, mockOldSaveData);

  // 45 ticks ở hệ cũ: 45 / 20 = 2.25 ngày (ngày 3, 25% ngày)
  const dateAfterLoad = engine.timeManager.getDate();
  assert.equal(dateAfterLoad.totalTicks, 45, 'totalTicks phải giữ nguyên 45');
  assert.equal(dateAfterLoad.totalDays, 2, 'totalDays phải là 2 (Math.floor(45 / 20))');
  assert.equal(dateAfterLoad.day, 3, 'Ngày hiển thị phải là ngày 3');
  assert.equal(Math.abs(dateAfterLoad.timeOfDay - 0.25) < 1e-6, true, 'Phần ngày phải là 0.25 (5 / 20)');

  // Chạy thêm 400 ticks (đúng 1 ngày mới ở hệ 400 ticks/ngày):
  for (let i = 0; i < 400; i++) {
    engine.timeManager.stepSingleTick();
  }
  const dateAfter400Ticks = engine.timeManager.getDate();
  assert.equal(dateAfter400Ticks.totalTicks, 445);
  assert.equal(dateAfter400Ticks.totalDays, 3, 'Sau 400 ticks mới, totalDays tăng đúng 1 (thành 3)');
  assert.equal(dateAfter400Ticks.day, 4, 'Ngày hiển thị chuyển sang ngày 4');
  assert.equal(Math.abs(dateAfter400Ticks.timeOfDay - 0.25) < 1e-6, true, 'Phần ngày giữ nguyên 0.25');

  // Lưu lại và nạp lại lần thứ hai -> không di trú lần hai, không dịch ngày
  const resaved = SaveManager.serializeWorld(engine as any, 'Thế Giới Lưu Lại');
  assert.equal(resaved.time.clockSchema, 2);
  assert.equal(resaved.time.calendarEpochTick, 45);
  assert.equal(resaved.time.calendarEpochDays, 2.25);
  assert.equal(resaved.time.oldTicksPerDay, 20);

  const engine2 = createMockTimeEngine();
  SaveManager.deserializeWorld(engine2 as any, resaved);
  const dateAfterReload = engine2.timeManager.getDate();
  assert.equal(dateAfterReload.totalTicks, 445);
  assert.equal(dateAfterReload.totalDays, 3);
  assert.equal(dateAfterReload.day, 4);
  assert.equal(Math.abs(dateAfterReload.timeOfDay - 0.25) < 1e-6, true);

  // Thứ tự thời gian monotonic của sự kiện quá khứ (tick 40), epoch (tick 45) và hiện tại (tick 445)
  const dayPast = calendarDaysAtTick(resaved.time, 40);
  const dayEpoch = calendarDaysAtTick(resaved.time, 45);
  const dayFuture = calendarDaysAtTick(resaved.time, 445);
  assert.ok(dayPast < dayEpoch, 'Sự kiện quá khứ phải trước epoch');
  assert.ok(dayEpoch < dayFuture, 'Epoch phải trước sự kiện tương lai');
  assert.equal(dayPast, 2.0); // 40 / 20 = 2.0
  assert.equal(dayEpoch, 2.25); // 45 / 20 = 2.25
  assert.equal(dayFuture, 3.25); // 2.25 + 400/400 = 3.25
});

// 5. Tốc độ cũ 10x và 50x nạp thành 5x; tốc độ mới 0.5x và 3x save/load nguyên vẹn; tốc độ không hợp lệ bị từ chối
test('5: Tốc độ cũ 10x/50x chuyển thành 5x khi nạp; 0.5x/3x lưu/nạp nguyên vẹn; tốc độ lạ bị từ chối', () => {
  const engine = createMockTimeEngine();
  const baseSave = SaveManager.serializeWorld(engine as any, 'Base');

  // Save cũ có speed = 50 -> nạp thành 5
  const save50x = JSON.parse(JSON.stringify(baseSave));
  save50x.time.speed = 50;
  SaveManager.deserializeWorld(engine as any, save50x);
  assert.equal(engine.timeManager.getSpeed(), 5, 'Tốc độ 50x cũ phải được chuyển về 5x');

  // Save cũ có speed = 10 -> nạp thành 5
  const save10x = JSON.parse(JSON.stringify(baseSave));
  save10x.time.speed = 10;
  SaveManager.deserializeWorld(engine as any, save10x);
  assert.equal(engine.timeManager.getSpeed(), 5, 'Tốc độ 10x cũ phải được chuyển về 5x');

  // Tốc độ mới 0.5x
  engine.timeManager.setSpeed(0.5);
  const save05x = SaveManager.serializeWorld(engine as any, '0.5x');
  assert.equal(save05x.time.speed, 0.5);
  const engine05 = createMockTimeEngine();
  SaveManager.deserializeWorld(engine05 as any, save05x);
  assert.equal(engine05.timeManager.getSpeed(), 0.5, '0.5x phải được giữ nguyên sau khi load');

  // Tốc độ mới 3x
  engine.timeManager.setSpeed(3);
  const save3x = SaveManager.serializeWorld(engine as any, '3x');
  assert.equal(save3x.time.speed, 3);
  const engine3 = createMockTimeEngine();
  SaveManager.deserializeWorld(engine3 as any, save3x);
  assert.equal(engine3.timeManager.getSpeed(), 3, '3x phải được giữ nguyên sau khi load');

  // Tốc độ không hợp lệ (ví dụ: 4x, -1, 100) bị từ chối
  const badSpeedSave = JSON.parse(JSON.stringify(baseSave));
  badSpeedSave.time.speed = 4;
  assert.throws(
    () => SaveManager.deserializeWorld(engine as any, badSpeedSave),
    /time\.speed không hợp lệ/
  );
});

// 6. GameSettings lưu/đọc tốc độ dương, sanitize 50x/10x về 5x
test('6: GameSettings nhận 0.5x, 3x và chuẩn hóa 10x/50x về 5x', () => {
  GameSettings.reset();
  const s05 = GameSettings.save({ defaultSpeed: 0.5 });
  assert.equal(s05.defaultSpeed, 0.5);

  const s3 = GameSettings.save({ defaultSpeed: 3 });
  assert.equal(s3.defaultSpeed, 3);

  // 50x trong storage cũ được sanitize thành 5x
  const s50 = GameSettings.save({ defaultSpeed: 50 as any });
  assert.equal(s50.defaultSpeed, 5);

  // Tốc độ không hợp lệ hoặc 0 rơi về mặc định (1)
  const sBad = GameSettings.save({ defaultSpeed: 0 as any });
  assert.equal(sBad.defaultSpeed, 1);
  GameSettings.reset();
});

console.log(`${passed} time pacing tests passed!`);
