import assert from 'node:assert/strict';
import { ECSWorld } from '../src/ecs/World.ts';
import { WorldMap } from '../src/modules/world/WorldMap.ts';
import { QiGrid } from '../src/modules/energy/QiGrid.ts';
import { TimeManager, Season } from '../src/core/TimeManager.ts';
import { SpatialGrid } from '../src/core/SpatialGrid.ts';
import { SeededRNG } from '../src/core/SeededRNG.ts';
import { GameSettings } from '../src/core/GameSettings.ts';
import { TerrainType } from '../src/config/terrains.config.ts';
import { WeatherType } from '../src/config/weather.config.ts';
import {
  PositionComponent,
  NameComponent,
  RaceComponent,
  HealthComponent,
  RealmComponent,
  CharacterStateComponent,
  HungerComponent
} from '../src/modules/beings/BeingComponents.ts';
import { CombatStatsComponent, EquipmentComponent } from '../src/modules/combat/CombatComponents.ts';
import { CombatSystem } from '../src/modules/combat/CombatSystem.ts';
import { BuildingComponent, FactionComponent, MemberComponent } from '../src/modules/factions/FactionComponents.ts';
import { BuildingSystem } from '../src/modules/factions/BuildingSystem.ts';
import { DiplomacySystem } from '../src/modules/factions/DiplomacySystem.ts';
import { FactionFactory } from '../src/modules/factions/FactionFactory.ts';
import { TribulationSystem } from '../src/modules/cultivation/TribulationSystem.ts';
import { CultivationSystem } from '../src/modules/cultivation/CultivationSystem.ts';
import { WeatherSystem } from '../src/modules/weather/WeatherSystem.ts';
import { ThreeTierAISystem } from '../src/modules/ai/systems/ThreeTierAISystem.ts';
import { AIPlannerComponent, AIBehaviorTreeComponent, AIStrategicBrainComponent } from '../src/modules/ai/brain/AIComponents.ts';
import { BehaviorTreeExecutor } from '../src/modules/ai/brain/behavior/BehaviorTree.ts';
import { AStarPathfinder } from '../src/modules/ai/pathfinding/AStar.ts';
import { SaveManager } from '../src/modules/save/SaveManager.ts';
import { PlantFactory } from '../src/modules/flora/PlantFactory.ts';
import { PlantComponent } from '../src/modules/flora/PlantComponents.ts';
import { BeingFactory } from '../src/modules/beings/BeingFactory.ts';
import { WorldGenerator } from '../src/modules/world/WorldGenerator.ts';
import { resetEntityIdCounter } from '../src/ecs/Entity.ts';
import { AnimalComponent } from '../src/modules/animals/AnimalComponents.ts';
import { AnimalSpawnService } from '../src/modules/animals/AnimalSpawnService.ts';
import { calculateInitialFaunaBudget } from '../src/config/animals/animal.simulation.ts';
import { GodToolbar } from '../src/ui/GodToolbar.ts';

let passed = 0;
async function test(name: string, fn: () => void | Promise<void>) {
  await fn();
  passed++;
  console.log('PASS audit:', name);
}

function createSimHarness(dim: number = 16) {
  const world = new ECSWorld();
  const worldMap = new WorldMap(dim, dim);
  const qiGrid = new QiGrid(dim, dim);
  const spatialGrid = new SpatialGrid(32);
  const timeManager = TimeManager.getInstance();
  const weatherSystem = new WeatherSystem(worldMap);
  const tribulationSystem = new TribulationSystem();
  const cultivationSystem = new CultivationSystem(worldMap, qiGrid, tribulationSystem);
  const threeTierAISystem = new ThreeTierAISystem(worldMap, qiGrid);
  threeTierAISystem.spatialGrid = spatialGrid;
  const diplomacySystem = new DiplomacySystem();
  diplomacySystem.spatialGrid = spatialGrid;
  const combatSystem = new CombatSystem(worldMap, diplomacySystem);
  combatSystem.spatialGrid = spatialGrid;
  const buildingSystem = new BuildingSystem(diplomacySystem);

  world.addSystem(weatherSystem);
  world.addSystem(tribulationSystem);
  world.addSystem(threeTierAISystem);
  world.addSystem(cultivationSystem);
  world.addSystem(diplomacySystem);
  world.addSystem(combatSystem);
  world.addSystem(buildingSystem);

  const engine = {
    world,
    worldMap,
    qiGrid,
    spatialGrid,
    timeManager,
    weatherSystem,
    tribulationSystem,
    cultivationSystem,
    threeTierAISystem,
    diplomacySystem,
    combatSystem,
    buildingSystem,
    weatherFxRenderer: { particlesEnabled: true, reset() {} },
    camera: { x: 64, y: 64, zoom: 1.2 },
    worldName: 'Thái Sơ Giới',
    worldTemplate: 'thap_van_dai_son',
    worldSeed: 8888,
    syncSpatialGrid() {
      const posEnts = this.world.query([PositionComponent]);
      this.spatialGrid.rebuild(
        posEnts.map((id: number) => {
          const p = this.world.getComponent(id, PositionComponent)!;
          return { id, x: p.x, y: p.y };
        })
      );
    },
    resizeWorldContainers(w: number, h: number) {
      if (this.worldMap.width === w && this.worldMap.height === h) return;
      this.weatherSystem?.destroy();
      this.threeTierAISystem?.destroy();
      this.cultivationSystem?.destroy();
      this.worldMap = new WorldMap(w, h);
      this.qiGrid = new QiGrid(w, h);
      this.weatherSystem = new WeatherSystem(this.worldMap);
      this.cultivationSystem = new CultivationSystem(this.worldMap, this.qiGrid, this.tribulationSystem);
      this.threeTierAISystem = new ThreeTierAISystem(this.worldMap, this.qiGrid);
      this.threeTierAISystem.spatialGrid = this.spatialGrid;
      this.combatSystem.worldMap = this.worldMap;
      this.world.clearSystems();
      this.world.addSystem(this.weatherSystem);
      this.world.addSystem(this.tribulationSystem);
      this.world.addSystem(this.threeTierAISystem);
      this.world.addSystem(this.cultivationSystem);
      this.world.addSystem(this.diplomacySystem);
      this.world.addSystem(this.combatSystem);
      this.world.addSystem(this.buildingSystem);
    },
    resetWorldState() {
      this.world.clearEntities();
      this.spatialGrid.clear();
      resetEntityIdCounter();
      this.tribulationSystem.clear();
      this.threeTierAISystem.reset();
      this.cultivationSystem.reset();
      this.diplomacySystem.clear();
      this.weatherSystem.reset();
      FactionFactory.reset();
      AStarPathfinder.invalidateBuildingCache();
    },
    initNewWorld(options: {
      template?: any;
      seed?: number;
      name?: string;
      customDim?: number;
    }) {
      const template = options.template || 'thap_van_dai_son';
      const seed = options.seed ?? Math.floor(Math.random() * 90000 + 10000);
      const name = options.name || 'Thái Sơ Đại Lục';
      const mapDim = options.customDim ?? 16;

      this.resizeWorldContainers(mapDim, mapDim);

      this.worldName = name;
      this.worldTemplate = template;
      this.worldSeed = seed;

      this.resetWorldState();
      this.timeManager.reset();

      SeededRNG.withSeed(seed, (rng) => {
        WorldGenerator.generate(this.worldMap, template, seed);
        this.qiGrid.initFromWorld(this.worldMap, rng);
        this.weatherSystem.init();
        PlantFactory.generateInitialFlora(this.world, this.worldMap, this.qiGrid, rng);
        const faunaBudget = calculateInitialFaunaBudget(this.worldMap.width, this.worldMap.height);
        AnimalSpawnService.populate(this.world, this.worldMap, faunaBudget, rng);
      });

      this.syncSpatialGrid();
    },
    stepSimulation(deltaRealSeconds: number) {
      return this.timeManager.update(deltaRealSeconds, (tickDt: number) => {
        this.syncSpatialGrid();
        this.world.update(tickDt);
        this.syncSpatialGrid();
      });
    }
  };

  return engine;
}

export async function runAuditRegressionTests() {
  // Issue 4: Metadata validation & XSS-safe import handling
  await test('Issue 4: importSaveFromJson validates metadata schema and preserves raw text without HTML execution', async () => {
    const engine = createSimHarness(8);
    const save = SaveManager.serializeWorld(engine, '<img src=x onerror=alert(1)>');
    const meta = await SaveManager.importSaveFromJson(JSON.stringify(save));
    assert.equal(meta.name, '<img src=x onerror=alert(1)> (Tải lên)');

    // Invalid metadata field type must be rejected
    const badSave = SaveManager.serializeWorld(engine, 'Valid');
    (badSave.metadata as any).seed = 'not-a-number';
    assert.throws(() => SaveManager.validateSaveData(badSave), /metadata\.seed/);
  });

  // Issue 5: Full save/load of activeTribulations, diplomacy, and weather
  await test('Issue 5: serializeWorld and deserializeWorld preserve activeTribulations, diplomacy relations, and weather state', () => {
    const engine = createSimHarness(8);
    const cultivator = engine.world.createEntity();
    engine.world.addComponent(cultivator, new PositionComponent(32, 32));
    engine.world.addComponent(cultivator, new NameComponent('Độ Kiếp Giả'));
    engine.world.addComponent(cultivator, new RaceComponent('human'));
    engine.world.addComponent(cultivator, new HealthComponent(5000));
    const realm = new RealmComponent('immortal_human', 1, 'Luyện Khí', 'Viên Mãn', 250, 250, 100, 2);
    realm.isBreakingThrough = true;
    engine.world.addComponent(cultivator, realm);
    engine.world.addComponent(cultivator, new CharacterStateComponent('breakthrough', 'down'));

    engine.tribulationSystem.startTribulation(cultivator, 'Trúc Cơ', 6, 1.8, 'Độ Kiếp Giả');
    engine.tribulationSystem.update(engine.world, 1.9); // 1 tia sét đã đánh, còn 5 tia
    assert.equal(engine.tribulationSystem.serializeTribulations()[0].strikesRemaining, 5);

    engine.diplomacySystem.setRelation(engine.world, 'sect_a', 'sect_b', 'war');
    engine.diplomacySystem.setRelation(engine.world, 'sect_a', 'sect_c', 'allied');
    engine.weatherSystem.restoreState({
      currentWeather: WeatherType.THUNDERSTORM,
      weatherTimer: 42.5,
      tileTimer: 0.75
    });

    const saved = SaveManager.serializeWorld(engine, 'Bản Lưu Độ Kiếp');
    assert.equal(saved.activeTribulations?.length, 1);
    assert.equal(saved.activeTribulations?.[0].strikesRemaining, 5);
    assert.equal(saved.diplomacy?.['sect_a:sect_b'], 'war');
    assert.equal(saved.diplomacy?.['sect_a:sect_c'], 'allied');
    assert.equal(saved.weather?.currentWeather, WeatherType.THUNDERSTORM);

    // Xóa sạch thế giới rồi nạp lại
    engine.resetWorldState();
    assert.equal(engine.tribulationSystem.getActiveTribulationsCount(), 0);
    assert.equal(engine.diplomacySystem.getRelationsCount(), 0);

    SaveManager.deserializeWorld(engine as any, saved);
    assert.equal(engine.tribulationSystem.getActiveTribulationsCount(), 1);
    assert.equal(engine.tribulationSystem.serializeTribulations()[0].strikesRemaining, 5);
    assert.equal(engine.diplomacySystem.getRelation('sect_a', 'sect_b'), 'war');
    assert.equal(engine.diplomacySystem.getRelation('sect_a', 'sect_c'), 'allied');
    assert.equal(engine.weatherSystem.currentWeather, WeatherType.THUNDERSTORM);
    assert.equal(engine.weatherSystem.serializeState().weatherTimer, 42.5);
  });

  // Issue 6 & Issue 12: Interleaved clock ticks and SpatialGrid sync at 5x speed
  await test('Issue 6 & 12: 5x speed interleaves TimeManager clock ticks with world updates and rebuilds SpatialGrid every tick', () => {
    const engine = createSimHarness(16);
    engine.timeManager.reset();
    engine.timeManager.setSpeed(5);

    const mover = engine.world.createEntity();
    const pos = engine.world.addComponent(mover, new PositionComponent(16, 16, 20));

    const observedTicks: number[] = [];
    const observedGridMatches: boolean[] = [];

    engine.world.addSystem({
      name: 'TickObserverSystem',
      enabled: true,
      priority: 50,
      update: (_w, _dt) => {
        observedTicks.push(engine.timeManager.getTotalTicks());
        pos.x += 4; // Di chuyển mỗi tick
      }
    });

    engine.world.addSystem({
      name: 'PostMoveSpatialCheckSystem',
      enabled: true,
      priority: 51,
      update: () => {
        // Kiểm tra ở đầu tick tiếp theo (hoặc sau syncSpatialGrid)
        const hits = engine.spatialGrid.queryRadius(pos.x, pos.y, 10);
        observedGridMatches.push(hits.some(h => h.id === mover));
      }
    });

    // 0.19s ở tốc độ 5x = 0.95s mô phỏng = 19 ticks
    const ticksRun = engine.stepSimulation(0.19);
    assert.equal(ticksRun, 19);
    assert.equal(observedTicks.length, 19);
    // Mỗi tick phải thấy giá trị đồng hồ tăng dần từ 1 đến 19, KHÔNG phải 19 ở mọi tick!
    assert.deepEqual(
      observedTicks,
      Array.from({ length: 19 }, (_, i) => i + 1)
    );
    assert.ok(observedGridMatches.every(Boolean));
  });

  // Issue 7: Combat movement uses shared A* pathfinding and avoids buildings/ocean without double-moving
  await test('Issue 7: CombatSystem chases targets around building obstacles using A* and does not double-move with AI', () => {
    const engine = createSimHarness(16);
    AStarPathfinder.invalidateBuildingCache();

    // Đặt công trình chắn giữa (x=80, y=48, rộng 2x3 ô -> chiếm tile x=5..6, y=3..5)
    const buildingEnt = engine.world.createEntity();
    engine.world.addComponent(buildingEnt, new PositionComponent(5 * 16, 3 * 16));
    engine.world.addComponent(buildingEnt, new BuildingComponent('meditation_cave', 'sect_1', 'Động Phủ', 2, 3, 500, 10));
    AStarPathfinder.invalidateBuildingCache();

    const blockedTiles = AStarPathfinder.getBlockedBuildingTiles(engine.world, engine.worldMap);

    // Kẻ tấn công ở bên trái công trình (tile 3, 4 -> pixel 56, 72)
    const attacker = engine.world.createEntity();
    const attPos = engine.world.addComponent(attacker, new PositionComponent(56, 72, 60));
    engine.world.addComponent(attacker, new HealthComponent(500));
    engine.world.addComponent(attacker, new CharacterStateComponent('idle', 'right'));
    engine.world.addComponent(attacker, new EquipmentComponent());
    const attStats = engine.world.addComponent(attacker, new CombatStatsComponent(20, 5, 0, 1, 0.05, 0.05, 1.5, 22));
    const planner = engine.world.addComponent(attacker, new AIPlannerComponent());
    const bt = engine.world.addComponent(attacker, new AIBehaviorTreeComponent());

    // Mục tiêu ở bên phải công trình (tile 8, 4 -> pixel 136, 72)
    const target = engine.world.createEntity();
    engine.world.addComponent(target, new PositionComponent(136, 72, 0));
    engine.world.addComponent(target, new HealthComponent(500));
    engine.world.addComponent(target, new CharacterStateComponent('idle', 'left'));

    attStats.targetEntityId = target;
    planner.planStatus = 'executing';
    planner.currentPlanGoal = 'FIGHT_COMBAT';
    planner.steps = [{ type: 'ATTACK_TARGET', targetEntityId: target, description: 'Truy kích' }];

    // Kiểm tra không di chuyển gấp đôi trong cùng 1 tick khi cả AI và CombatSystem cùng chạy
    const startX = attPos.x;
    const startY = attPos.y;
    BehaviorTreeExecutor.beginTick();
    BehaviorTreeExecutor.tick(engine.world, attacker, bt, planner, engine.worldMap, 0.05);
    const afterAiDist = Math.hypot(attPos.x - startX, attPos.y - startY);
    assert.ok(afterAiDist <= 60 * 0.05 + 1e-5, 'AI di chuyển đúng 1 bước tốc độ');

    // Khi CombatSystem chạy tiếp trong cùng tick, thực thể không bị cộng thêm bước thứ 2
    engine.combatSystem.update(engine.world, 0.05);
    const afterCombatDist = Math.hypot(attPos.x - startX, attPos.y - startY);
    assert.equal(afterCombatDist, afterAiDist, 'CombatSystem không di chuyển chồng lần 2 trong cùng tick');

    // Mô phỏng tiếp quá trình truy kích vòng qua công trình
    for (let i = 0; i < 60; i++) {
      AStarPathfinder.resetTickBudget();
      engine.combatSystem.update(engine.world, 0.05);
      const tx = Math.floor(attPos.x / 16);
      const ty = Math.floor(attPos.y / 16);
      const key = ty * engine.worldMap.width + tx;
      assert.equal(blockedTiles.has(key), false, `Thực thể không được đi xuyên qua ô công trình (${tx}, ${ty})`);
    }

    const finalDist = Math.hypot(136 - attPos.x, 72 - attPos.y);
    assert.ok(finalDist <= 25, `Thực thể đã vòng qua vật cản để tiếp cận mục tiêu (dist=${finalDist.toFixed(1)})`);
  });

  // Issue 8: Defense array does not attack allied or neutral sect members
  await test('Issue 8: BuildingSystem defense_array only damages hostile/war targets and spares allies', () => {
    const engine = createSimHarness(16);

    // Môn phái A sở hữu trận pháp
    const arrayEnt = engine.world.createEntity();
    engine.world.addComponent(arrayEnt, new PositionComponent(100, 100));
    const arrayComp = new BuildingComponent('defense_array', 'sect_a', 'Hộ Sơn Đại Trận', 2, 2, 500, 2);
    arrayComp.timer = 2.0;
    engine.world.addComponent(arrayEnt, arrayComp);

    // Đệ tử đồng minh (sect_ally)
    const allyEnt = engine.world.createEntity();
    engine.world.addComponent(allyEnt, new PositionComponent(110, 100));
    const allyHp = engine.world.addComponent(allyEnt, new HealthComponent(200));
    engine.world.addComponent(allyEnt, new MemberComponent('sect_ally', 'inner'));

    // Đệ tử trung lập (sect_neutral)
    const neutralEnt = engine.world.createEntity();
    engine.world.addComponent(neutralEnt, new PositionComponent(115, 100));
    const neutralHp = engine.world.addComponent(neutralEnt, new HealthComponent(200));
    engine.world.addComponent(neutralEnt, new MemberComponent('sect_neutral', 'outer'));

    // Đệ tử kẻ địch đang chiến tranh (sect_enemy)
    const enemyEnt = engine.world.createEntity();
    engine.world.addComponent(enemyEnt, new PositionComponent(120, 100));
    const enemyHp = engine.world.addComponent(enemyEnt, new HealthComponent(200));
    engine.world.addComponent(enemyEnt, new MemberComponent('sect_enemy', 'inner'));

    engine.diplomacySystem.setRelation(engine.world, 'sect_a', 'sect_ally', 'allied');
    engine.diplomacySystem.setRelation(engine.world, 'sect_a', 'sect_neutral', 'neutral');
    engine.diplomacySystem.setRelation(engine.world, 'sect_a', 'sect_enemy', 'war');

    engine.buildingSystem.update(engine.world, 0.1);

    assert.equal(allyHp.current, 200, 'Đồng minh không bị trận pháp tấn công');
    assert.equal(neutralHp.current, 200, 'Đệ tử môn phái trung lập không bị trận pháp tấn công vô cớ');
    assert.equal(enemyHp.current, 182, 'Kẻ địch đang chiến tranh bị trận pháp trừ 18 HP');
  });

  // Issue 9: Season and world metadata are accurate on world init and cross-size save load
  await test('Issue 9: Season is reset before WeatherSystem.init and loading different map size preserves seed/template', () => {
    const engine = createSimHarness(8);

    const ticksPerSeason =
      TimeManager.TICKS_PER_DAY * TimeManager.DAYS_PER_MONTH * TimeManager.MONTHS_PER_SEASON;

    // Đẩy đồng hồ sang Mùa Đông (mùa thứ 4 -> index 3)
    (engine.timeManager as any).totalTicks = 3 * ticksPerSeason;
    assert.equal(engine.timeManager.getDate().season, Season.WINTER);
    engine.weatherSystem.init();
    assert.equal(engine.weatherSystem.getSeasonalTempOffset(), -14);

    // Khi tạo thế giới mới: reset TimeManager trước WeatherSystem.init
    engine.timeManager.reset();
    engine.weatherSystem.init();
    assert.equal(engine.timeManager.getDate().season, Season.SPRING);
    assert.equal(engine.weatherSystem.getSeasonalTempOffset(), 0, 'Nhiệt độ mùa khởi tạo phải là Mùa Xuân (0), không bị kẹt Mùa Đông (-14)');

    // Tạo bản lưu 12x12 với seed & template riêng
    const engine12 = createSimHarness(12);
    engine12.worldName = 'Bồng Lai Tiên Đảo';
    engine12.worldTemplate = 'hai_dao_tien_son';
    engine12.worldSeed = 54321;
    (engine12.timeManager as any).totalTicks = 1 * ticksPerSeason; // Mùa Hạ
    engine12.weatherSystem.init();
    const save12 = SaveManager.serializeWorld(engine12 as any, 'Bồng Lai Tiên Đảo');

    // Nạp bản lưu 12x12 vào engine đang là 8x8
    SaveManager.deserializeWorld(engine as any, save12);
    assert.equal(engine.worldMap.width, 12);
    assert.equal(engine.worldMap.height, 12);
    assert.equal(engine.worldName, 'Bồng Lai Tiên Đảo');
    assert.equal(engine.worldTemplate, 'hai_dao_tien_son');
    assert.equal(engine.worldSeed, 54321);
    assert.equal(engine.timeManager.getDate().season, Season.SUMMER);
  });

  // Issue 10: Settings persistence and default 5-minute autosave interval
  await test('Issue 10: GameSettings persists autosave toggle, 5-minute default interval, particles, and defaultSpeed', () => {
    GameSettings.reset();
    const defaults = GameSettings.get();
    assert.equal(defaults.autosaveEnabled, true);
    assert.equal(defaults.autosaveIntervalMinutes, 5);
    assert.equal(defaults.particlesEnabled, true);
    assert.equal(defaults.defaultSpeed, 1);

    const updated = GameSettings.save({
      autosaveEnabled: false,
      particlesEnabled: false,
      defaultSpeed: 5
    });
    assert.equal(updated.autosaveEnabled, false);
    assert.equal(updated.particlesEnabled, false);
    assert.equal(updated.defaultSpeed, 5);

    const reloaded = GameSettings.load();
    assert.equal(reloaded.autosaveEnabled, false);
    assert.equal(reloaded.particlesEnabled, false);
    assert.equal(reloaded.defaultSpeed, 5);
    GameSettings.reset();
  });

  // Issue 11: DiplomacySystem strict MAX_PAIRS cap and round-robin anti-starvation
  await test('Issue 11: DiplomacySystem enforces strict MAX_PAIRS cap on neutral/same-sect pairs and rotates start index', () => {
    const engine = createSimHarness(16);
    engine.diplomacySystem.spatialGrid = null; // Test fallback loop cap directly

    // Tạo 40 đệ tử cùng môn phái / trung lập -> nếu không đếm cặp trung lập sẽ quét 40*39 = 1560 cặp
    for (let i = 0; i < 40; i++) {
      const e = engine.world.createEntity();
      engine.world.addComponent(e, new PositionComponent(20 + i, 20));
      engine.world.addComponent(e, new HealthComponent(100));
      engine.world.addComponent(e, new CombatStatsComponent(10, 5, 0, 1, 0.05, 0.05, 1.5, 20));
      engine.world.addComponent(e, new MemberComponent(i % 2 === 0 ? 'sect_1' : 'sect_2', 'outer'));
    }
    engine.diplomacySystem.setRelation(engine.world, 'sect_1', 'sect_2', 'neutral');

    const rrBefore = engine.diplomacySystem.getRoundRobinIndex();
    engine.diplomacySystem.update(engine.world, 2.1);
    const checked = engine.diplomacySystem.getLastPairsChecked();
    const rrAfter = engine.diplomacySystem.getRoundRobinIndex();

    assert.equal(checked, 200, 'Số cặp kiểm tra bị chặn đúng ở MAX_PAIRS = 200 kể cả khi quan hệ là neutral');
    assert.notEqual(rrAfter, rrBefore, 'Chỉ số round-robin được luân phiên để không bỏ đói thực thể cuối danh sách');
  });

  // Issue 13: Deterministic world generation from Seed
  await test('Issue 13: Same seed reproduces identical terrain, spirit veins, flora, and fauna', () => {
    function buildDeterministicSnapshot(seed: number) {
      resetEntityIdCounter();
      const world = new ECSWorld();
      const worldMap = new WorldMap(24, 24);
      const qiGrid = new QiGrid(24, 24);

      SeededRNG.withSeed(seed, (rng) => {
        WorldGenerator.generate(worldMap, 'thap_van_dai_son', seed);
        qiGrid.initFromWorld(worldMap, rng);
        PlantFactory.generateInitialFlora(world, worldMap, qiGrid, rng);
        const faunaBudget = calculateInitialFaunaBudget(worldMap.width, worldMap.height);
        AnimalSpawnService.populate(world, worldMap, faunaBudget, rng);
      });

      const terrains = [];
      const veins = [];
      for (let i = 0; i < 24 * 24; i++) {
        terrains.push(worldMap.getTileByIndex(i)!.terrain);
        const qt = qiGrid.getTileByIndex(i)!;
        if (qt.isSpiritVein) {
          veins.push(`${i}:${qt.tier}:${qt.density}`);
        }
      }

      const plants = world.query([PlantComponent, PositionComponent]).map(id => {
        const p = world.getComponent(id, PositionComponent)!;
        const pl = world.getComponent(id, PlantComponent)!;
        return `${pl.speciesId}@${p.x.toFixed(2)},${p.y.toFixed(2)}`;
      });

      const beings = world.query([RaceComponent, PositionComponent, NameComponent]).map(id => {
        const p = world.getComponent(id, PositionComponent)!;
        const n = world.getComponent(id, NameComponent)!;
        return `${n.name}@${p.x.toFixed(2)},${p.y.toFixed(2)}`;
      });

      const animals = world.query([AnimalComponent, PositionComponent]).map(id => {
        const p = world.getComponent(id, PositionComponent)!;
        const a = world.getComponent(id, AnimalComponent)!;
        return `${a.speciesId}:${a.sex}@${p.x.toFixed(2)},${p.y.toFixed(2)}`;
      });

      return { terrains, veins, plants, beings, animals };
    }

    const snapA = buildDeterministicSnapshot(99999);
    const snapB = buildDeterministicSnapshot(99999);

    assert.deepEqual(snapA.terrains, snapB.terrains, 'Địa hình giống nhau 100%');
    assert.deepEqual(snapA.veins, snapB.veins, 'Vị trí & phẩm cấp linh mạch giống nhau 100%');
    assert.deepEqual(snapA.plants, snapB.plants, 'Hệ sinh thái thực vật giống nhau 100%');
    assert.deepEqual(snapA.animals, snapB.animals, 'Quần thể động vật tự nhiên giống nhau 100%');
    assert.equal(snapA.beings.length, 0, 'Thế giới mới không tự sinh yêu tộc');
  });

  // Issue 3: World regeneration through Engine
  await test('Issue 3: initNewWorld clears entities and buildings from previous world and updates seed/template in Engine and SaveData', () => {
    const engine = createSimHarness(16);

    // Tạo thực thể và công trình ở thế giới cũ
    const oldBuilding = engine.world.createEntity();
    engine.world.addComponent(oldBuilding, new PositionComponent(5, 5));
    engine.world.addComponent(oldBuilding, new BuildingComponent('main_hall', 'sect_old'));
    engine.world.addComponent(oldBuilding, new NameComponent('Đại Điện Tiên Môn'));

    const oldResident = engine.world.createEntity();
    engine.world.addComponent(oldResident, new PositionComponent(6, 6));
    engine.world.addComponent(oldResident, new RaceComponent('human'));
    engine.world.addComponent(oldResident, new NameComponent('Lão Cổ'));

    assert.ok(engine.world.getEntityCount() >= 2);

    // Thực hiện kiến tạo thế giới mới
    engine.initNewWorld({
      template: 'hai_dao_tien_son',
      seed: 44444,
      name: 'Hải Đảo Thần Tiên',
      customDim: 20
    });

    // 1. Kiểm tra thuộc tính Engine đã được cập nhật
    assert.equal(engine.worldSeed, 44444, 'worldSeed phải cập nhật thành 44444');
    assert.equal(engine.worldTemplate, 'hai_dao_tien_son', 'worldTemplate phải cập nhật thành hải đảo');
    assert.equal(engine.worldName, 'Hải Đảo Thần Tiên', 'worldName phải cập nhật');
    assert.equal(engine.worldMap.width, 20, 'Kích thước map chiều rộng phải là 20');
    assert.equal(engine.worldMap.height, 20, 'Kích thước map chiều cao phải là 20');

    // 2. Kiểm tra thực thể cũ bị xóa sạch
    const allNames = engine.world.query([NameComponent]).map(id => engine.world.getComponent(id, NameComponent)!.name);
    assert.ok(!allNames.includes('Đại Điện Tiên Môn'), 'Công trình từ thế giới cũ phải bị xóa sạch');
    assert.ok(!allNames.includes('Lão Cổ'), 'Cư dân từ thế giới cũ phải bị xóa sạch');

    const buildings = engine.world.query([BuildingComponent]);
    assert.equal(buildings.length, 0, 'Không còn công trình nào từ thế giới cũ');

    // 3. Kiểm tra bản lưu sinh ra mang metadata khớp thế giới mới
    const save = SaveManager.serializeWorld(engine as any, engine.worldName);
    assert.equal(save.metadata.seed, 44444, 'Seed trong metadata bản lưu phải khớp');
    assert.equal(save.metadata.templateId, 'hai_dao_tien_son', 'Template trong metadata bản lưu phải khớp');
    assert.equal(save.metadata.name, 'Hải Đảo Thần Tiên', 'Tên trong metadata bản lưu phải khớp');
  });

  await test('Issue 3: initNewWorld is 100% deterministic for identical seed and template', () => {
    const harnessA = createSimHarness(16);
    const harnessB = createSimHarness(16);

    harnessA.initNewWorld({ template: 'ma_vuc_dam_lay', seed: 77777, customDim: 20 });
    harnessB.initNewWorld({ template: 'ma_vuc_dam_lay', seed: 77777, customDim: 20 });

    for (let i = 0; i < 20 * 20; i++) {
      const tileA = harnessA.worldMap.getTileByIndex(i)!;
      const tileB = harnessB.worldMap.getTileByIndex(i)!;
      assert.equal(tileA.terrain, tileB.terrain, `Terrain tile ${i} phải giống nhau`);
      assert.equal(tileA.elevation, tileB.elevation, `Elevation tile ${i} phải giống nhau`);

      const qiA = harnessA.qiGrid.getTileByIndex(i)!;
      const qiB = harnessB.qiGrid.getTileByIndex(i)!;
      assert.equal(qiA.density, qiB.density, `Qi density tile ${i} phải giống nhau`);
      assert.equal(qiA.tier, qiB.tier, `Qi tier tile ${i} phải giống nhau`);
    }
  });

  await test('Issue 3: GodToolbar worldgen tab calls engine.initNewWorld with template and preserves map dimension and name', () => {
    // Mock DOM elements
    function createMockElement(tag: string = 'div'): any {
      const listeners: Record<string, Function[]> = {};
      const children: any[] = [];
      const el: any = {
        tagName: tag.toUpperCase(),
        style: {},
        className: '',
        textContent: '',
        innerHTML: '',
        title: '',
        children,
        appendChild(child: any) { children.push(child); return child; },
        addEventListener(event: string, fn: Function) {
          if (!listeners[event]) listeners[event] = [];
          listeners[event].push(fn);
        },
        click() {
          if (listeners['click']) {
            for (const fn of listeners['click']) fn();
          }
        }
      };
      return el;
    }

    const prevDoc = (globalThis as any).document;
    const prevWindow = (globalThis as any).window;

    try {
      (globalThis as any).document = {
        createElement: (tag: string) => createMockElement(tag)
      };
      (globalThis as any).window = {
        confirm: () => true
      };

      let calledOptions: any = null;
      const canvasEl = createMockElement('canvas');
      const mockEngine: any = {
        canvas: { canvas: canvasEl },
        worldMap: { width: 48, height: 48, tileSize: 16 },
        qiGrid: { initFromWorld() {} },
        worldName: 'Giới Diện Thử Nghiệm',
        weatherSystem: { currentWeather: 'clear', setWeather() {} },
        initNewWorld(options: any) {
          calledOptions = options;
        }
      };

      const parentEl = createMockElement('div');
      const toolbar = new GodToolbar(parentEl, mockEngine);

      // Chuyển sang tab worldgen
      (toolbar as any).currentTab = 'worldgen';
      const contentRow = createMockElement('div');
      (toolbar as any).buildWorldGenTab(contentRow);

      // Tìm nút Hải Đảo Tiên Sơn và click
      const islandBtn = contentRow.children.find((c: any) => typeof c.textContent === 'string' && c.textContent.includes('Hải Đảo'));
      assert.ok(islandBtn, 'Phải có nút Hải Đảo Tiên Sơn');
      islandBtn.click();

      assert.ok(calledOptions !== null, 'initNewWorld phải được gọi khi click nút');
      assert.equal(calledOptions.template, 'hai_dao_tien_son', 'Template phải là hai_dao_tien_son');
      assert.equal(calledOptions.name, 'Giới Diện Thử Nghiệm', 'Tên thế giới phải được bảo toàn');
      assert.equal(calledOptions.customDim, 48, 'Kích thước map phải được bảo toàn');
      assert.ok(typeof calledOptions.seed === 'number' && calledOptions.seed > 0, 'Seed mới phải là số nguyên dương');
    } finally {
      (globalThis as any).document = prevDoc;
      (globalThis as any).window = prevWindow;
    }
  });

  console.log(`${passed} simulation audit regression tests passed`);
}
