import assert from 'node:assert/strict';
import { ECSWorld } from '../src/ecs/World.ts';
import {
  PositionComponent,
  HealthComponent,
  RealmComponent,
  LifespanComponent,
  CharacterStateComponent,
  NameComponent,
  RaceComponent
} from '../src/modules/beings/BeingComponents.ts';
import { CombatStatsComponent, EquipmentComponent, ProjectileComponent } from '../src/modules/combat/CombatComponents.ts';
import { CombatSystem } from '../src/modules/combat/CombatSystem.ts';
import { WeaponDefinition } from '../src/config/weapons.config.ts';
import { InventoryComponent } from '../src/modules/alchemy/InventoryComponent.ts';
import { AIPlannerComponent, AIBehaviorTreeComponent } from '../src/modules/ai/brain/AIComponents.ts';
import { BehaviorTreeExecutor } from '../src/modules/ai/brain/behavior/BehaviorTree.ts';
import { WorldMap } from '../src/modules/world/WorldMap.ts';
import { QiGrid } from '../src/modules/energy/QiGrid.ts';
import { TimeManager } from '../src/core/TimeManager.ts';
import { SpatialGrid } from '../src/core/SpatialGrid.ts';
import { SaveManager } from '../src/modules/save/SaveManager.ts';
import { PillUsageService } from '../src/modules/alchemy/PillUsageService.ts';
import { StatBaselineComponent } from '../src/modules/talent/TalentComponents.ts';
import { rebuildEntityStats } from '../src/modules/traits/DerivedStatsService.ts';

let passed = 0;
function test(name: string, fn: () => void | Promise<void>) {
  fn();
  passed++;
  console.log('PASS pill-usage:', name);
}

const map = new WorldMap(32, 32);

export function runPillUsageRegressionTests() {
  test('4A: Bấm dùng revive khi còn sống: số viên không giảm', () => {
    const world = new ECSWorld();
    const ent = world.createEntity();
    world.addComponent(ent, new HealthComponent(100));
    const inv = world.addComponent(ent, new InventoryComponent());
    inv.addPill('nghich_menh_dan', 1);

    assert.equal(inv.pills.get('nghich_menh_dan') ?? 0, 1);

    const res = PillUsageService.usePill(world, ent, 'nghich_menh_dan');
    assert.equal(res.success, false, 'Không được dùng đan hồi sinh khi còn sống');
    assert.equal(inv.pills.get('nghich_menh_dan') ?? 0, 1, 'Số viên đan phải còn nguyên 1');
  });

  test('4A: Dùng buff khi thiếu CombatStatsComponent: số viên không giảm', () => {
    const world = new ECSWorld();
    const ent = world.createEntity();
    world.addComponent(ent, new HealthComponent(100));
    const inv = world.addComponent(ent, new InventoryComponent());
    inv.addPill('bao_linh_dan', 1);

    assert.equal(inv.pills.get('bao_linh_dan') ?? 0, 1);

    const res = PillUsageService.usePill(world, ent, 'bao_linh_dan');
    assert.equal(res.success, false, 'Không được dùng đan buff khi thiếu CombatStatsComponent');
    assert.equal(inv.pills.get('bao_linh_dan') ?? 0, 1, 'Số viên đan phải còn nguyên 1');
  });

  test('4A: Dùng đan hồi máu khi đầy máu: số viên không giảm', () => {
    const world = new ECSWorld();
    const ent = world.createEntity();
    const hp = world.addComponent(ent, new HealthComponent(100));
    hp.current = 100;
    hp.max = 100;
    const inv = world.addComponent(ent, new InventoryComponent());
    inv.addPill('kim_sang_dan', 2);

    const res = PillUsageService.usePill(world, ent, 'kim_sang_dan');
    assert.equal(res.success, false, 'Không được dùng đan hồi máu khi đã đầy máu');
    assert.equal(inv.pills.get('kim_sang_dan') ?? 0, 2, 'Số viên đan phải còn nguyên 2');
  });

  test('4A: AI không tiêu hao viên đầu tiên nếu viên đó không áp dụng được', () => {
    const world = new ECSWorld();
    const ent = world.createEntity();
    world.addComponent(ent, new PositionComponent(10, 10));
    world.addComponent(ent, new HealthComponent(100));
    world.addComponent(ent, new CharacterStateComponent());
    const inv = world.addComponent(ent, new InventoryComponent());
    // Thêm viên đan không áp dụng được (revive khi đang sống)
    inv.addPill('nghich_menh_dan', 1);

    const planner = world.addComponent(ent, new AIPlannerComponent());
    const bt = world.addComponent(ent, new AIBehaviorTreeComponent());
    planner.steps = [{ type: 'USE_PILL', description: 'Uống đan' }];
    planner.currentStepIndex = 0;
    planner.planStatus = 'executing';

    BehaviorTreeExecutor.tick(world, ent, bt, planner, map, 0.1);

    assert.equal(
      inv.pills.get('nghich_menh_dan') ?? 0,
      1,
      'AI tuyệt đối không được tiêu hao đan hồi sinh khi đang còn sống khỏe mạnh'
    );
  });

  test('4A: Đan đột phá tăng đúng breakthroughBonus, không tự cộng Qi', () => {
    const world = new ECSWorld();
    const ent = world.createEntity();
    world.addComponent(ent, new HealthComponent(100));
    const realm = world.addComponent(ent, new RealmComponent());
    realm.stageIndex = 1; // Luyện Khí
    realm.currentQi = 50;
    realm.maxQi = 100;
    realm.breakthroughBonus = 0;

    const inv = world.addComponent(ent, new InventoryComponent());
    inv.addPill('truc_co_dan', 1);

    const res = PillUsageService.usePill(world, ent, 'truc_co_dan');
    assert.equal(res.success, true, 'Dùng Trúc Cơ Đan thành công');
    assert.equal(inv.pills.get('truc_co_dan') ?? 0, 0, 'Đã tiêu hao 1 viên');
    assert.equal(realm.breakthroughBonus, 0.35, 'Tăng đúng 35% tỷ lệ đột phá');
    assert.equal(realm.currentQi, 50, 'currentQi không được tự động cộng bừa bãi');
  });

  test('4B: buffTimer giảm dần qua các tick của CombatSystem, reset về 1.0 khi hết hạn', () => {
    const world = new ECSWorld();
    const combat = new CombatSystem(map);
    world.addSystem(combat);

    const ent = world.createEntity();
    world.addComponent(ent, new PositionComponent(10, 10));
    world.addComponent(ent, new HealthComponent(100));
    world.addComponent(ent, new CharacterStateComponent());
    const stats = world.addComponent(ent, new CombatStatsComponent());
    stats.buffDamageMultiplier = 1.6;
    stats.buffTimer = 5.0;

    // Giả lập 2s trôi qua
    combat.update(world, 2.0);
    assert.equal(Math.round(stats.buffTimer * 10) / 10, 3.0, 'buffTimer phải giảm còn 3.0s');
    assert.equal(stats.buffDamageMultiplier, 1.6, 'buffDamageMultiplier vẫn giữ nguyên 1.6');

    // Giả lập thêm 3.5s trôi qua (vượt quá 3.0s còn lại)
    combat.update(world, 3.5);
    assert.equal(stats.buffTimer, 0, 'buffTimer phải về 0');
    assert.equal(stats.buffDamageMultiplier, 1.0, 'buffDamageMultiplier phải tự động reset về 1.0');
  });

  test('4B: Multiplier không bị nhân lặp qua nhiều tick', () => {
    const world = new ECSWorld();
    const combat = new CombatSystem(map);
    world.addSystem(combat);

    const ent = world.createEntity();
    world.addComponent(ent, new PositionComponent(10, 10));
    world.addComponent(ent, new HealthComponent(100));
    world.addComponent(ent, new CharacterStateComponent());
    const stats = world.addComponent(ent, new CombatStatsComponent());
    stats.buffDamageMultiplier = 1.6;
    stats.buffTimer = 30.0;

    // Chạy 10 tick nhỏ
    for (let i = 0; i < 10; i++) {
      combat.update(world, 0.1);
    }

    assert.equal(stats.buffDamageMultiplier, 1.6, 'Hệ số buff tuyệt đối không bị nhân lặp qua các tick');
    assert.equal(Math.round(stats.buffTimer * 10) / 10, 29.0, 'buffTimer giảm đúng 1.0s');
  });

  test('4B: Buff tăng sát thương cận chiến đúng một lần', () => {
    const world = new ECSWorld();
    const combat = new CombatSystem(map);
    world.addSystem(combat);

    // Kẻ tấn công
    const atkEnt = world.createEntity();
    world.addComponent(atkEnt, new PositionComponent(10, 10));
    world.addComponent(atkEnt, new HealthComponent(100));
    const atkState = world.addComponent(atkEnt, new CharacterStateComponent());
    const atkStats = world.addComponent(atkEnt, new CombatStatsComponent(100, 0, 0, 1, 0, 0, 1.5, 25));
    atkStats.buffDamageMultiplier = 1.6;
    atkStats.buffTimer = 10.0;
    atkStats.targetEntityId = null;

    // Mục tiêu (khoảng cách 15px trong tầm đánh 25px)
    const tgtEnt = world.createEntity();
    world.addComponent(tgtEnt, new PositionComponent(10, 25));
    const tgtHp = world.addComponent(tgtEnt, new HealthComponent(500));
    tgtHp.current = 500;
    tgtHp.max = 500;
    world.addComponent(tgtEnt, new CharacterStateComponent());
    const tgtStats = world.addComponent(tgtEnt, new CombatStatsComponent(0, 0, 0, 1, 0, 0, 1.5, 25));

    atkStats.targetEntityId = tgtEnt;
    atkStats.currentCooldown = 0;

    combat.update(world, 0.1);

    // Sát thương cơ bản: 100 * 1.6 = 160.
    // targetDefense = 0, targetArmor = 0 -> finalDmg = 160.
    // Máu còn lại = 500 - 160 = 340.
    assert.equal(tgtHp.current, 340, 'Mục tiêu phải chịu đúng 160 sát thương từ đòn đánh có buff 1.6x');
  });

  test('4B: Buff tăng sát thương tầm xa đúng một lần khi tạo projectile', () => {
    const world = new ECSWorld();
    const combat = new CombatSystem(map);
    world.addSystem(combat);

    const testBow: WeaponDefinition = {
      id: 'test_bow',
      name: 'Thần Mộc Cung',
      type: 'cung',
      tier: 'pham_khi',
      slotType: 'two_handed',
      range: 150,
      attackSpeed: 1,
      baseDamage: 50,
      critChance: 0,
      color: '#ffffff',
      projectileType: 'arrow',
      badge: '🏹',
      description: 'Test bow'
    };

    // Kẻ tấn công cầm cung
    const atkEnt = world.createEntity();
    world.addComponent(atkEnt, new PositionComponent(10, 10));
    world.addComponent(atkEnt, new HealthComponent(100));
    world.addComponent(atkEnt, new CharacterStateComponent());
    const atkStats = world.addComponent(atkEnt, new CombatStatsComponent(50, 0, 0, 1, 0, 0, 1.5, 150));
    atkStats.buffDamageMultiplier = 1.6;
    atkStats.buffTimer = 10.0;
    const equip = world.addComponent(atkEnt, new EquipmentComponent());
    equip.mainHand = testBow;

    // Mục tiêu cách 60px
    const tgtEnt = world.createEntity();
    world.addComponent(tgtEnt, new PositionComponent(10, 70));
    world.addComponent(tgtEnt, new HealthComponent(500));
    world.addComponent(tgtEnt, new CharacterStateComponent());
    world.addComponent(tgtEnt, new CombatStatsComponent(0, 0, 0, 1, 0, 0, 1.5, 25));

    atkStats.targetEntityId = tgtEnt;
    atkStats.currentCooldown = 0;

    combat.update(world, 0.1);

    // Kiểm tra xem projectile được tạo ra với damage là bao nhiêu
    // Base damage: (attackerBaseAtk 50 + weaponDmg 50) * buffMult 1.6 = 160
    const projectiles = world.query([PositionComponent, ProjectileComponent]);
    assert.equal(projectiles.length, 1, 'Phải tạo ra đúng 1 projectile');
    const proj = world.getComponent(projectiles[0], ProjectileComponent)!;
    assert.equal(proj.damage, 160, 'Sát thương của projectile phải là 160 (đã nhân hệ số buff 1 lần duy nhất)');
  });

  function createPillTestEngine() {
    const world = new ECSWorld();
    const worldMap = new WorldMap(8, 8);
    const qiGrid = new QiGrid(8, 8);
    const spatialGrid = new SpatialGrid(32);
    const timeManager = TimeManager.getInstance();

    const engine = {
      world,
      worldMap,
      qiGrid,
      camera: { x: 50, y: 50, zoom: 1.5 },
      timeManager,
      spatialGrid,
      worldName: 'Bản Lưu Buff Đan',
      worldTemplate: 'thap_van_dai_son',
      worldSeed: 12345,
      resetWorldState() {
        this.world.clearEntities();
        this.spatialGrid.clear();
      }
    } as any;

    return engine;
  }

  test('4C: Save/Load roundtrip bảo toàn buffDamageMultiplier và buffTimer', () => {
    const engine = createPillTestEngine();
    const ent = engine.world.createEntity();
    engine.world.addComponent(ent, new PositionComponent(10, 10));
    engine.world.addComponent(ent, new NameComponent('Lý Tiêu Dao'));
    engine.world.addComponent(ent, new RaceComponent('human'));
    engine.world.addComponent(ent, new HealthComponent(200));
    engine.world.addComponent(ent, new CharacterStateComponent());
    const stats = engine.world.addComponent(ent, new CombatStatsComponent(20, 5, 2, 1, 0.1, 0.05, 1.5, 22));
    stats.buffDamageMultiplier = 1.6;
    stats.buffTimer = 25.5;

    // Serialize
    const saveData = SaveManager.serializeWorld(engine, 'Buff Test Save', 'slot_buff_test');
    assert.ok(saveData.entities.length > 0, 'Phải có thực thể được lưu');
    const savedStats = saveData.entities[0].components.stats;
    assert.ok(savedStats, 'Phải lưu components.stats');
    assert.equal(savedStats.buffDamageMultiplier, 1.6, 'buffDamageMultiplier phải được lưu đúng là 1.6');
    assert.equal(savedStats.buffTimer, 25.5, 'buffTimer phải được lưu đúng là 25.5');

    // Deserialize sang world mới
    const newEngine = createPillTestEngine();
    SaveManager.deserializeWorld(newEngine, saveData);

    const loadedEnts = newEngine.world.query([CombatStatsComponent]);
    assert.equal(loadedEnts.length, 1, 'Phải có 1 thực thể có stats');
    const loadedStats = newEngine.world.getComponent(loadedEnts[0], CombatStatsComponent)!;
    assert.equal(loadedStats.buffDamageMultiplier, 1.6, 'Nạp lại đúng buffDamageMultiplier');
    assert.equal(loadedStats.buffTimer, 25.5, 'Nạp lại đúng buffTimer');
  });

  test('4C: Nạp bản lưu cũ thiếu buffDamageMultiplier và buffTimer tự fallback về 1.0 và 0', () => {
    const engine = createPillTestEngine();
    const ent = engine.world.createEntity();
    engine.world.addComponent(ent, new PositionComponent(10, 10));
    engine.world.addComponent(ent, new NameComponent('Trương Tam'));
    engine.world.addComponent(ent, new RaceComponent('human'));
    engine.world.addComponent(ent, new HealthComponent(200));
    engine.world.addComponent(ent, new CharacterStateComponent());
    engine.world.addComponent(ent, new CombatStatsComponent(20, 5, 2, 1, 0.1, 0.05, 1.5, 22));

    const saveData = SaveManager.serializeWorld(engine, 'Legacy Save', 'slot_legacy_test');
    // Giả lập bản lưu cũ thiếu hai trường buff
    delete saveData.entities[0].components.stats.buffDamageMultiplier;
    delete saveData.entities[0].components.stats.buffTimer;

    const newEngine = createPillTestEngine();
    SaveManager.deserializeWorld(newEngine, saveData);

    const loadedEnts = newEngine.world.query([CombatStatsComponent]);
    assert.equal(loadedEnts.length, 1);
    const loadedStats = newEngine.world.getComponent(loadedEnts[0], CombatStatsComponent)!;
    assert.equal(loadedStats.buffDamageMultiplier, 1.0, 'Bản lưu cũ phải fallback về buffDamageMultiplier = 1.0');
    assert.equal(loadedStats.buffTimer, 0, 'Bản lưu cũ phải fallback về buffTimer = 0');
  });

  test('4C: validateSaveData từ chối bản lưu có buffTimer âm hoặc buffDamageMultiplier là NaN', () => {
    const engine = createPillTestEngine();
    const ent = engine.world.createEntity();
    engine.world.addComponent(ent, new PositionComponent(10, 10));
    engine.world.addComponent(ent, new NameComponent('Tà Ma'));
    engine.world.addComponent(ent, new RaceComponent('human'));
    engine.world.addComponent(ent, new HealthComponent(200));
    engine.world.addComponent(ent, new CharacterStateComponent());
    engine.world.addComponent(ent, new CombatStatsComponent(20, 5, 2, 1, 0.1, 0.05, 1.5, 22));

    const baseSave = SaveManager.serializeWorld(engine, 'Corrupt Save', 'slot_corrupt_test');

    // Case 1: buffTimer âm
    const badTimerSave = JSON.parse(JSON.stringify(baseSave));
    badTimerSave.entities[0].components.stats.buffTimer = -5;
    assert.throws(
      () => SaveManager.validateSaveData(badTimerSave),
      /buffTimer không hợp lệ/,
      'Phải từ chối bản lưu có buffTimer âm'
    );

    // Case 2: buffDamageMultiplier là NaN (hoặc âm)
    const badMultSave = JSON.parse(JSON.stringify(baseSave));
    badMultSave.entities[0].components.stats.buffDamageMultiplier = -1.5;
    assert.throws(
      () => SaveManager.validateSaveData(badMultSave),
      /buffDamageMultiplier không hợp lệ/,
      'Phải từ chối bản lưu có buffDamageMultiplier âm'
    );
  });

  test('7: Ở tick 2 * TICKS_PER_DAY, uống đan tăng thọ ghi nhận đúng ngày 2 (theo TimeManager.TICKS_PER_DAY, không dùng hằng số 600 cũ)', () => {
    const world = new ECSWorld();
    world.setCurrentTick(2 * TimeManager.TICKS_PER_DAY);

    const ent = world.createEntity();
    world.addComponent(ent, new PositionComponent(10, 10));
    world.addComponent(ent, new NameComponent('Bạch Vân Đạo Nhân'));
    world.addComponent(ent, new RaceComponent('human'));
    world.addComponent(ent, new HealthComponent(100));
    world.addComponent(ent, new CharacterStateComponent());
    const life = world.addComponent(ent, new LifespanComponent(85, 100));
    const inv = world.addComponent(ent, new InventoryComponent());
    inv.addPill('duong_tho_dan', 1);

    const initialMaxLifespan = life.maxLifespan;
    assert.equal(initialMaxLifespan, 100);

    // Uống Dưỡng Thọ Đan (+15 năm thọ)
    const res = PillUsageService.usePill(world, ent, 'duong_tho_dan');
    assert.equal(res.success, true, 'Dùng Dưỡng Thọ Đan thành công');
    assert.equal(inv.pills.get('duong_tho_dan') ?? 0, 0, 'Đã tiêu hao 1 viên đan');

    // Kiểm tra StatBaselineComponent và permanentAdjustments
    const baseline = world.getComponent(ent, StatBaselineComponent);
    assert.ok(baseline, 'Phải có StatBaselineComponent sau khi uống đan tăng thọ');
    assert.equal(baseline.permanentAdjustments.length, 1, 'Phải ghi nhận đúng 1 điều chỉnh vĩnh viễn');

    const adj = baseline.permanentAdjustments[0];
    assert.equal(adj.stat, 'lifespanYears', 'Loại thuộc tính điều chỉnh phải là lifespanYears');
    assert.equal(adj.delta, 15, 'Lượng tăng thọ phải là 15 năm');
    assert.equal(adj.day, 2, 'Ở tick 2 * TICKS_PER_DAY, ngày ghi nhận phải là 2');
    assert.equal(life.maxLifespan, 115, 'Tuổi thọ tối đa phải tăng từ 100 lên 115');
  });

  test('7: Save/Load roundtrip bảo toàn điều chỉnh tăng thọ và đúng ngày 2', () => {
    const engine = createPillTestEngine();
    engine.world.setCurrentTick(2 * TimeManager.TICKS_PER_DAY);

    const ent = engine.world.createEntity();
    engine.world.addComponent(ent, new PositionComponent(10, 10));
    engine.world.addComponent(ent, new NameComponent('Cổ Thần'));
    engine.world.addComponent(ent, new RaceComponent('human'));
    engine.world.addComponent(ent, new HealthComponent(200));
    engine.world.addComponent(ent, new CharacterStateComponent());
    engine.world.addComponent(ent, new LifespanComponent(50, 100));
    const inv = engine.world.addComponent(ent, new InventoryComponent());
    inv.addPill('duong_tho_dan', 1);

    // Uống đan ở tick 2 * TICKS_PER_DAY
    PillUsageService.usePill(engine.world, ent, 'duong_tho_dan');

    // Lưu game
    const saveData = SaveManager.serializeWorld(engine, 'Lifespan Test Save', 'slot_lifespan_test');
    assert.ok(saveData.entities.length > 0);

    // Nạp lại ở engine mới
    const newEngine = createPillTestEngine();
    SaveManager.deserializeWorld(newEngine, saveData);

    const loadedEnts = newEngine.world.query([LifespanComponent, StatBaselineComponent]);
    assert.equal(loadedEnts.length, 1, 'Phải có 1 thực thể có LifespanComponent và StatBaselineComponent');

    const loadedEnt = loadedEnts[0];
    const loadedLife = newEngine.world.getComponent(loadedEnt, LifespanComponent)!;
    const loadedBaseline = newEngine.world.getComponent(loadedEnt, StatBaselineComponent)!;

    assert.equal(loadedLife.maxLifespan, 115, 'Sau save/load maxLifespan vẫn là 115');
    assert.equal(loadedBaseline.permanentAdjustments.length, 1);
    assert.equal(loadedBaseline.permanentAdjustments[0].stat, 'lifespanYears');
    assert.equal(loadedBaseline.permanentAdjustments[0].delta, 15);
    assert.equal(loadedBaseline.permanentAdjustments[0].day, 2, 'Sau save/load ngày ghi nhận vẫn phải là 2');
  });

  test('7: Hiệu lực tăng thọ cập nhật maxLifespan và quy tắc chống cộng dồn lặp (idempotence) được duy trì', () => {
    const world = new ECSWorld();
    world.setCurrentTick(40);

    const ent = world.createEntity();
    world.addComponent(ent, new PositionComponent(10, 10));
    world.addComponent(ent, new NameComponent('Tiên Ông'));
    world.addComponent(ent, new RaceComponent('human'));
    world.addComponent(ent, new HealthComponent(100));
    world.addComponent(ent, new CharacterStateComponent());
    const life = world.addComponent(ent, new LifespanComponent(90, 100));
    const inv = world.addComponent(ent, new InventoryComponent());
    inv.addPill('duong_tho_dan', 1);

    // Trước khi dùng đan: 100 tuổi thọ tối đa, tuổi 90 >= 90% (100 * 0.9 = 90) -> isElderly = true
    assert.equal(life.isElderly, true, 'Trước khi dùng đan là tuổi già (isElderly = true)');

    PillUsageService.usePill(world, ent, 'duong_tho_dan');
    // Sau khi dùng đan (+15 năm): maxLifespan = 115. Ngưỡng già là 115 * 0.9 = 103.5 > 90 -> isElderly = false
    assert.equal(life.maxLifespan, 115);
    assert.equal(life.isElderly, false, 'Sau khi tăng thọ, tỷ lệ tuổi giảm nên không còn là tuổi già');

    const baseline = world.getComponent(ent, StatBaselineComponent)!;
    const existingAdj = baseline.permanentAdjustments[0];

    // Chống trùng ID: cố tình thêm lại chính adjustment đó
    const addedAgain = baseline.addPermanentAdjustment(existingAdj);
    assert.equal(addedAgain, false, 'Thêm adjustment trùng ID phải bị từ chối');
    assert.equal(baseline.permanentAdjustments.length, 1, 'Danh sách adjustments không được tăng');

    // Chống nhân lặp khi rebuildEntityStats chạy nhiều lần
    for (let i = 0; i < 50; i++) {
      rebuildEntityStats(world, ent);
    }
    assert.equal(life.maxLifespan, 115, 'Rebuild nhiều lần không được cộng dồn lặp thọ nguyên (vẫn 115)');
  });

  test('7: Nạp lại cùng tick vẫn dùng được viên tăng thọ thứ hai', () => {
    const engine = createPillTestEngine();
    engine.world.setCurrentTick(40);
    const ent = engine.world.createEntity();
    engine.world.addComponent(ent, new PositionComponent(10, 10));
    engine.world.addComponent(ent, new NameComponent('Thọ Tinh'));
    engine.world.addComponent(ent, new RaceComponent('human'));
    engine.world.addComponent(ent, new HealthComponent(100));
    engine.world.addComponent(ent, new CharacterStateComponent());
    engine.world.addComponent(ent, new LifespanComponent(50, 100));
    const inv = engine.world.addComponent(ent, new InventoryComponent());
    inv.addPill('duong_tho_dan', 2);

    const sequenceBeforeFirst = (PillUsageService as any).pillSequence;
    assert.equal(PillUsageService.usePill(engine.world, ent, 'duong_tho_dan').success, true);
    const saved = SaveManager.serializeWorld(engine, 'Tăng thọ hai lần', 'slot_lifespan_reload');
    const loadedEngine = createPillTestEngine();
    SaveManager.deserializeWorld(loadedEngine, saved);
    loadedEngine.world.setCurrentTick(40);
    (PillUsageService as any).pillSequence = sequenceBeforeFirst; // Mô phỏng module khởi động lại.

    const loadedEnt = loadedEngine.world.query([LifespanComponent, InventoryComponent])[0];
    const result = PillUsageService.usePill(loadedEngine.world, loadedEnt, 'duong_tho_dan');
    const life = loadedEngine.world.getComponent(loadedEnt, LifespanComponent)!;
    const loadedInv = loadedEngine.world.getComponent(loadedEnt, InventoryComponent)!;
    const baseline = loadedEngine.world.getComponent(loadedEnt, StatBaselineComponent)!;
    assert.equal(result.success, true);
    assert.equal(life.maxLifespan, 130);
    assert.equal(loadedInv.pills.get('duong_tho_dan') ?? 0, 0);
    assert.equal(baseline.permanentAdjustments.length, 2);
    assert.notEqual(baseline.permanentAdjustments[0].id, baseline.permanentAdjustments[1].id);
  });

  console.log(`${passed} pill-usage regression tests passed`);
}

runPillUsageRegressionTests();
