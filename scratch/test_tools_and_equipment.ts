// Mock globals for Node/TSX environment
class FakeCanvasElement {
  width = 800;
  height = 600;
  getContext() {
    return {
      fillRect: () => {},
      clearRect: () => {},
      drawImage: () => {},
      beginPath: () => {},
      arc: () => {},
      stroke: () => {},
      fill: () => {},
      save: () => {},
      restore: () => {},
      scale: () => {},
      translate: () => {},
      setTransform: () => {},
      resetTransform: () => {},
      strokeRect: () => {},
      fillText: () => {},
      measureText: () => ({ width: 10 }),
      imageSmoothingEnabled: false
    };
  }
  style = {};
  addEventListener() {}
  removeEventListener() {}
  getBoundingClientRect() {
    return { left: 0, top: 0, width: 800, height: 600 };
  }
  querySelector() { return null; }
  querySelectorAll() { return []; }
  appendChild() {}
  removeChild() {}
}

(global as any).HTMLCanvasElement = FakeCanvasElement;
(global as any).MouseEvent = class {};
(global as any).WheelEvent = class {};

if (typeof localStorage === 'undefined') {
  const store: Record<string, string> = {};
  (global as any).localStorage = {
    getItem: (k: string) => store[k] || null,
    setItem: (k: string, v: string) => { store[k] = v; },
    removeItem: (k: string) => { delete store[k]; },
    clear: () => { Object.keys(store).forEach(k => delete store[k]); }
  };
}

if (typeof document === 'undefined') {
  (global as any).document = {
    getElementById: () => new FakeCanvasElement(),
    createElement: () => new FakeCanvasElement(),
    body: { appendChild: () => {}, removeChild: () => {} }
  };
  (global as any).window = {
    innerWidth: 1920,
    innerHeight: 1080,
    addEventListener: () => {},
    removeEventListener: () => {}
  };
}

import { ECSWorld } from '../src/ecs/World.ts';
import { TOOL_DEFINITIONS, ToolType, ToolTier } from '../src/config/tools.config.ts';
import { WEAPON_DEFINITIONS } from '../src/config/weapons.config.ts';
import { ARMOR_DEFINITIONS, ARTIFACT_DEFINITIONS, EquipmentComponent, CombatStatsComponent } from '../src/modules/combat/CombatComponents.ts';
import { BeingFactory } from '../src/modules/beings/BeingFactory.ts';
import { DailyScheduleComponent, HealthComponent, PositionComponent, NameComponent, RaceComponent, RealmComponent, CharacterStateComponent, CorpseComponent } from '../src/modules/beings/BeingComponents.ts';
import { SaveManager } from '../src/modules/save/SaveManager.ts';
import { CorpseAndGraveSystem } from '../src/modules/beings/CorpseAndGraveSystem.ts';
import { Engine } from '../src/core/Engine.ts';

function runTestSuite() {
  console.log('=== BẮT ĐẦU KIỂM THỬ HỆ THỐNG CÔNG CỤ & TRANG BỊ ===\n');
  let passed = 0;
  let total = 0;

  function assert(condition: boolean, msg: string) {
    total++;
    if (condition) {
      console.log(`  [PASS] ${msg}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${msg}`);
      throw new Error(`Assertion failed: ${msg}`);
    }
  }

  // 1. Kiểm tra cấu hình công cụ (TOOL_DEFINITIONS)
  console.log('1. Kiểm tra cấu hình công cụ lao động (TOOL_DEFINITIONS):');
  const toolIds = Object.keys(TOOL_DEFINITIONS);
  assert(toolIds.length >= 14, `Có ít nhất 14 công cụ lao động (Hiện có: ${toolIds.length})`);

  for (const id of toolIds) {
    const t = TOOL_DEFINITIONS[id];
    assert(!!t.name && t.workEfficiencyMultiplier >= 1.0, `Công cụ [${t.name}] có hệ số hiệu suất hợp lệ (x${t.workEfficiencyMultiplier})`);
    assert(t.baseDamage > 0, `Công cụ [${t.name}] có sát thương tự vệ cơ bản (${t.baseDamage})`);
    assert(!!t.badge && !!t.categoryName, `Công cụ [${t.name}] có badge (${t.badge}) và ngành nghề (${t.categoryName})`);
  }

  // 2. Kiểm tra danh mục Giáp Trụ & Pháp Bảo mới
  console.log('\n2. Kiểm tra danh mục Giáp Trụ & Pháp Bảo:');
  assert(!!ARMOR_DEFINITIONS['golden_silk_armor'], 'Có Kim Ti Bảo Giáp trong ARMOR_DEFINITIONS');
  assert(!!ARMOR_DEFINITIONS['celestial_silk_robe'], 'Có Cửu Thiên Băng Tằm Y trong ARMOR_DEFINITIONS');
  assert(!!ARTIFACT_DEFINITIONS['spatial_ring'], 'Có Thái Hư Trữ Vật Giới trong ARTIFACT_DEFINITIONS');
  assert(!!ARTIFACT_DEFINITIONS['spirit_gathering_banner'], 'Có Thái Hư Tụ Linh Kỳ trong ARTIFACT_DEFINITIONS');

  // 3. Kiểm tra EquipmentComponent với workTool
  console.log('\n3. Kiểm tra EquipmentComponent & tính toán hiệu suất:');
  const eq = new EquipmentComponent();
  eq.workTool = TOOL_DEFINITIONS['iron_hoe'];
  assert(eq.getWorkEfficiency('farm') === 1.75, `Hiệu suất làm ruộng với Cuốc Thép = 1.75`);
  assert(eq.getHarvestYieldBonus('farm') === 1, `Sản lượng lúa thưởng thêm với Cuốc Thép = 1`);
  assert(eq.getWorkEfficiency('build') === 1.0, `Cuốc không tăng hiệu suất xây dựng (vẫn là 1.0)`);
  assert(eq.getEffectiveRange() === 24, `Tầm với tự vệ của Cuốc Thép = 24px`);
  assert(eq.getWeaponDamageBonus() === 14, `Sát thương tự vệ khi không có vũ khí = 14`);

  eq.workTool = TOOL_DEFINITIONS['celestial_hammer'];
  assert(eq.getWorkEfficiency('build') === 3.0, `Lỗ Ban Thần Chùy tăng x3.0 tốc độ xây dựng`);
  assert(eq.getWorkEfficiency('repair') === 3.0, `Lỗ Ban Thần Chùy tăng x3.0 tốc độ sửa chữa`);

  // 4. Kiểm tra phân bổ công cụ khởi đầu khi sinh cư dân
  console.log('\n4. Kiểm tra phân bổ công cụ theo nghề nghiệp:');
  const world = new ECSWorld();
  let farmerFound = false;
  let builderFound = false;

  for (let i = 0; i < 100; i++) {
    const ent = BeingFactory.spawnFromArchetype(world, 'mortal_human', 100, 100);
    const sched = world.getComponent(ent, DailyScheduleComponent);
    const equip = world.getComponent(ent, EquipmentComponent);

    if (sched && equip && equip.workTool) {
      if (sched.preferredJob === 'farmer' && equip.workTool.type === 'hoe') {
        farmerFound = true;
      }
      if (sched.preferredJob === 'builder' && equip.workTool.type === 'hammer') {
        builderFound = true;
      }
    }
  }
  assert(farmerFound, 'Nông dân sinh ra được tự động trang bị cuốc làm đất');
  assert(builderFound, 'Thợ xây sinh ra được tự động trang bị búa kiến thiết');

  // 5. Kiểm tra Lưu trữ & Nạp thế giới (Save & Load)
  console.log('\n5. Kiểm tra Lưu trữ & Nạp thế giới bảo toàn công cụ lao động:');
  const engine = new Engine();
  const testEnt = engine.world.createEntity();
  engine.world.addComponent(testEnt, new PositionComponent(200, 200));
  engine.world.addComponent(testEnt, new NameComponent('Lý Đại Nông'));
  engine.world.addComponent(testEnt, new RaceComponent('human'));
  engine.world.addComponent(testEnt, new RealmComponent('human_realm', 0, 'Phàm Nhân', 'Sơ Kỳ', 10, 100, 15, 0));
  engine.world.addComponent(testEnt, new HealthComponent(100));
  
  const testEquip = new EquipmentComponent(
    WEAPON_DEFINITIONS['iron_sword'],
    null,
    ARMOR_DEFINITIONS['golden_silk_armor'],
    ARTIFACT_DEFINITIONS['spatial_ring'],
    TOOL_DEFINITIONS['spirit_hoe']
  );
  engine.world.addComponent(testEnt, testEquip);

  // Lưu thế giới
  const saveData = SaveManager.serializeWorld(engine, 'Test World', 'test_slot');
  assert(saveData.entities.length > 0, 'Serialized world thành công');

  const serializedEquip = saveData.entities.find(e => e.id === testEnt)?.components.equip;
  assert(serializedEquip !== undefined, 'Dữ liệu equip được serialize');
  assert(serializedEquip.workToolId === 'spirit_hoe', `workToolId được lưu đúng: ${serializedEquip.workToolId}`);
  assert(serializedEquip.bodyArmorId === 'golden_silk_armor', `bodyArmorId được lưu đúng: ${serializedEquip.bodyArmorId}`);
  assert(serializedEquip.artifactId === 'spatial_ring', `artifactId được lưu đúng: ${serializedEquip.artifactId}`);

  // Nạp lại thế giới vào một engine mới
  const loadedEngine = new Engine();
  SaveManager.deserializeWorld(loadedEngine, saveData);
  assert(loadedEngine.world.query([PositionComponent]).length > 0, 'Deserialize world thành công và có thực thể');

  const loadedEquip = loadedEngine.world.getComponent(testEnt, EquipmentComponent);
  assert(loadedEquip !== undefined, 'Loaded entity có EquipmentComponent');
  assert(loadedEquip?.workTool?.id === 'spirit_hoe', `Loaded workTool chuẩn xác: ${loadedEquip?.workTool?.name}`);
  assert(loadedEquip?.bodyArmor?.id === 'golden_silk_armor', `Loaded bodyArmor chuẩn xác: ${loadedEquip?.bodyArmor?.name}`);
  assert(loadedEquip?.artifact?.id === 'spatial_ring', `Loaded artifact chuẩn xác: ${loadedEquip?.artifact?.name}`);

  // 6. Kiểm tra Di vật tử vong bảo tồn công cụ
  console.log('\n6. Kiểm tra Di vật tử vong bảo tồn công cụ lao động:');
  const dyingEnt = world.createEntity();
  world.addComponent(dyingEnt, new PositionComponent(300, 300));
  world.addComponent(dyingEnt, new NameComponent('Trương Tiều Phu'));
  world.addComponent(dyingEnt, new RaceComponent('human'));
  world.addComponent(dyingEnt, new RealmComponent('human_realm', 0, 'Phàm Nhân', 'Sơ Kỳ', 10, 100, 15, 0));
  world.addComponent(dyingEnt, new CharacterStateComponent('idle', 'down'));
  const hp = new HealthComponent(100);
  hp.current = 0;
  hp.isDead = true; // Chết
  world.addComponent(dyingEnt, hp);
  
  const dyingEquip = new EquipmentComponent();
  dyingEquip.workTool = TOOL_DEFINITIONS['spirit_axe'];
  world.addComponent(dyingEnt, dyingEquip);

  const corpseSys = new CorpseAndGraveSystem(engine.worldMap);
  corpseSys.update(world, 1.0);

  const corpse = world.getComponent(dyingEnt, CorpseComponent);
  assert(corpse !== undefined, 'CorpseComponent được tạo tự động khi nhân vật tử vong');
  assert(corpse?.items.workTool?.id === 'spirit_axe', `Di vật chứa đúng công cụ [${corpse?.items.workTool?.name}]`);

  console.log(`\n🎉 TẤT CẢ KIỂM THỬ HOÀN TẤT THÀNH CÔNG! (${passed}/${total} assertions passed)`);
}

runTestSuite();
