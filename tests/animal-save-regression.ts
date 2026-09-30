import assert from 'node:assert/strict';
import { ECSWorld } from '../src/ecs/World.ts';
import { WorldMap } from '../src/modules/world/WorldMap.ts';
import { QiGrid } from '../src/modules/energy/QiGrid.ts';
import { TimeManager } from '../src/core/TimeManager.ts';
import { SpatialGrid } from '../src/core/SpatialGrid.ts';
import {
  CURRENT_SAVE_VERSION,
  OLD_SAVE_REJECT_MESSAGE,
  SaveManager,
} from '../src/modules/save/SaveManager.ts';
import {
  AnimalBrainComponent,
  AnimalCarcassComponent,
  AnimalComponent,
} from '../src/modules/animals/AnimalComponents.ts';
import { AnimalFactory } from '../src/modules/animals/AnimalFactory.ts';
import { AnimalSaveCodec } from '../src/modules/animals/AnimalSaveCodec.ts';
import { BeingFactory } from '../src/modules/beings/BeingFactory.ts';
import {
  HealthComponent,
  HungerComponent,
  LifespanComponent,
  NameComponent,
  PositionComponent,
  RaceComponent,
} from '../src/modules/beings/BeingComponents.ts';

let passed = 0;
async function test(name: string, fn: () => void | Promise<void>): Promise<void> {
  await fn();
  passed++;
  console.log('PASS animal-save:', name);
}

function createTestEngine(worldName: string = 'Thế Giới Động Vật 2.0'): any {
  const world = new ECSWorld();
  const worldMap = new WorldMap(8, 8);
  const qiGrid = new QiGrid(8, 8);
  const spatialGrid = new SpatialGrid(32);

  return {
    world,
    worldMap,
    qiGrid,
    spatialGrid,
    camera: { x: 32, y: 48, zoom: 1.25 },
    timeManager: TimeManager.getInstance(),
    worldName,
    worldTemplate: 'thap_van_dai_son',
    worldSeed: 20260926,
  };
}

export async function runAnimalSaveRegressionTests(): Promise<void> {
  await test('Save 2.0.0 round-trip preserves animal, animalBrain, animalCarcass, and keeps animals free of cultivation components', () => {
    const srcEngine = createTestEngine('Bản Lưu 2.0');

    // Thêm 1 cư dân nhân tộc để kiểm tra residentCount chỉ tính cư dân
    const humanId = BeingFactory.spawnFromArchetype(srcEngine.world, 'mortal_human', 40, 40)!;
    assert.ok(srcEngine.world.hasComponent(humanId, RaceComponent));

    // Thêm động vật trưởng thành và con non có parentIds
    const wolfFather = AnimalFactory.spawn(srcEngine.world, 'wolf', 60, 60, {
      sex: 'male',
      age: 3,
      reproductionCooldownDays: 0,
    });
    const wolfMother = AnimalFactory.spawn(srcEngine.world, 'wolf', 68, 60, {
      sex: 'female',
      age: 3,
      reproductionCooldownDays: 0,
    });
    const wolfCub = AnimalFactory.createOffspring(
      srcEngine.world,
      wolfFather,
      wolfMother,
      64,
      62,
      { sex: 'female' }
    );

    // Tùy chỉnh trạng thái của wolfCub để kiểm tra bảo toàn chính xác
    const cubAnimal = srcEngine.world.getComponent(wolfCub, AnimalComponent)!;
    cubAnimal.reproductionCooldownDays = 4.5;
    const cubHp = srcEngine.world.getComponent(wolfCub, HealthComponent)!;
    cubHp.current = 42;
    const cubHunger = srcEngine.world.getComponent(wolfCub, HungerComponent)!;
    cubHunger.current = 73.5;
    const cubLife = srcEngine.world.getComponent(wolfCub, LifespanComponent)!;
    cubLife.currentAge = 0.75;
    const cubBrain = srcEngine.world.getComponent(wolfCub, AnimalBrainComponent)!;
    cubBrain.state = 'forage';
    cubBrain.decisionTimer = 0.25;
    cubBrain.actionTimer = 1.2;
    cubBrain.targetEntityId = wolfMother;
    cubBrain.threatEntityId = null;
    cubBrain.destinationX = 88;
    cubBrain.destinationY = 92;

    // Thêm 1 xác động vật
    const carcassEnt = srcEngine.world.createEntity();
    srcEngine.world.addComponent(carcassEnt, new PositionComponent(75, 75, 0));
    srcEngine.world.addComponent(carcassEnt, new NameComponent('Xác Hươu Sao'));
    srcEngine.world.addComponent(carcassEnt, new AnimalCarcassComponent('spotted_deer', 38.5, 19.25));

    const saveData = SaveManager.serializeWorld(srcEngine, 'Bản Lưu Động Vật');
    assert.equal(saveData.metadata.version, CURRENT_SAVE_VERSION);
    assert.equal(saveData.metadata.version, '2.0.0');
    assert.equal(saveData.metadata.residentCount, 1, 'residentCount không được cộng động vật');

    const dstEngine = createTestEngine('Thế Giới Đích');
    SaveManager.deserializeWorld(dstEngine, saveData);

    const loadedCub = dstEngine.world.getComponent(wolfCub, AnimalComponent)!;
    assert.ok(loadedCub);
    assert.equal(loadedCub.speciesId, 'wolf');
    assert.equal(loadedCub.sex, 'female');
    assert.equal(loadedCub.lifeStage, 'child');
    assert.equal(loadedCub.reproductionCooldownDays, 4.5);
    assert.deepEqual(loadedCub.parentIds, [wolfFather, wolfMother]);

    assert.equal(dstEngine.world.getComponent(wolfCub, HealthComponent)?.current, 42);
    assert.equal(dstEngine.world.getComponent(wolfCub, HungerComponent)?.current, 73.5);
    assert.equal(dstEngine.world.getComponent(wolfCub, LifespanComponent)?.currentAge, 0.75);

    const loadedBrain = dstEngine.world.getComponent(wolfCub, AnimalBrainComponent)!;
    assert.equal(loadedBrain.state, 'forage');
    assert.equal(loadedBrain.decisionTimer, 0.25);
    assert.equal(loadedBrain.actionTimer, 1.2);
    assert.equal(loadedBrain.targetEntityId, wolfMother);
    assert.equal(loadedBrain.threatEntityId, null);
    assert.equal(loadedBrain.destinationX, 88);
    assert.equal(loadedBrain.destinationY, 92);

    const loadedCarcass = dstEngine.world.getComponent(carcassEnt, AnimalCarcassComponent)!;
    assert.ok(loadedCarcass);
    assert.equal(loadedCarcass.speciesId, 'spotted_deer');
    assert.equal(loadedCarcass.remainingNutrition, 38.5);
    assert.equal(loadedCarcass.decayRemainingDays, 19.25);

    // Không được gắn nhầm bất kỳ component tu luyện/cư dân nào sau khi nạp
    AnimalSaveCodec.assertNoCultivationComponents(dstEngine.world, wolfFather);
    AnimalSaveCodec.assertNoCultivationComponents(dstEngine.world, wolfMother);
    AnimalSaveCodec.assertNoCultivationComponents(dstEngine.world, wolfCub);
    AnimalSaveCodec.assertNoCultivationComponents(dstEngine.world, carcassEnt);
  });

  await test('Saves with version < 2.0.0 are rejected with exact Vietnamese message and do not alter playing world', async () => {
    const playingEngine = createTestEngine('Thế Giới Đang Chơi An Toàn');
    const craneId = AnimalFactory.spawn(playingEngine.world, 'peafowl', 50, 50);
    const validSave = SaveManager.serializeWorld(playingEngine);

    for (const oldVersion of ['1.0.0', '1.1.0', '1.9.9', undefined]) {
      const legacySave = JSON.parse(JSON.stringify(validSave));
      if (oldVersion === undefined) {
        delete legacySave.metadata.version;
      } else {
        legacySave.metadata.version = oldVersion;
      }

      assert.throws(
        () => SaveManager.deserializeWorld(playingEngine, legacySave),
        (err: any) => {
          assert.equal(err instanceof Error, true);
          assert.equal(err.message, OLD_SAVE_REJECT_MESSAGE);
          return true;
        },
        `Phiên bản ${String(oldVersion)} phải bị từ chối với đúng thông báo`
      );

      await assert.rejects(
        async () => await SaveManager.importSaveFromJson(JSON.stringify(legacySave)),
        (err: any) => {
          assert.equal(err.message, OLD_SAVE_REJECT_MESSAGE);
          return true;
        }
      );

      // Đảm bảo thế giới đang chơi còn nguyên vẹn
      assert.equal(playingEngine.worldName, 'Thế Giới Đang Chơi An Toàn');
      assert.equal(playingEngine.world.hasComponent(craneId, AnimalComponent), true);
    }
  });

  await test('Corrupt animal save data (invalid speciesId, invalid sex, NaN hunger/age/cooldown, or forbidden cultivation components) is rejected before commit', () => {
    const playingEngine = createTestEngine('Thế Giới Nguyên Vẹn');
    const foxId = AnimalFactory.spawn(playingEngine.world, 'fox', 40, 40, { sex: 'female', age: 2 });
    const baseSave = SaveManager.serializeWorld(playingEngine);

    // 1. speciesId không hợp lệ -> không được fallback sang wolf/human/yao
    const badSpeciesSave = JSON.parse(JSON.stringify(baseSave));
    badSpeciesSave.entities[0].components.animal.speciesId = 'dragon_king_999';
    assert.throws(
      () => SaveManager.deserializeWorld(playingEngine, badSpeciesSave),
      /speciesId không hợp lệ/
    );
    assert.equal(playingEngine.world.getComponent(foxId, AnimalComponent)?.speciesId, 'fox');

    // 2. sex không hợp lệ
    const badSexSave = JSON.parse(JSON.stringify(baseSave));
    badSexSave.entities[0].components.animal.sex = 'unknown_sex';
    assert.throws(
      () => SaveManager.deserializeWorld(playingEngine, badSexSave),
      /giới tính không hợp lệ/
    );

    // 3. NaN ở hunger / age / reproductionCooldownDays
    const nanHungerSave = JSON.parse(JSON.stringify(baseSave));
    nanHungerSave.entities[0].components.hunger.current = NaN;
    assert.throws(
      () => SaveManager.deserializeWorld(playingEngine, nanHungerSave),
      /không hợp lệ|không hữu hạn/
    );

    const nanAgeSave = JSON.parse(JSON.stringify(baseSave));
    nanAgeSave.entities[0].components.life.currentAge = NaN;
    assert.throws(
      () => SaveManager.deserializeWorld(playingEngine, nanAgeSave),
      /không hợp lệ|không hữu hạn/
    );

    const nanCooldownSave = JSON.parse(JSON.stringify(baseSave));
    nanCooldownSave.entities[0].components.animal.reproductionCooldownDays = NaN;
    assert.throws(
      () => SaveManager.deserializeWorld(playingEngine, nanCooldownSave),
      /không hợp lệ|không hữu hạn/
    );

    // 4. Thực thể động vật bị gắn kèm component tu luyện (race, realm, root, traits, talentProfile)
    for (const forbiddenKey of ['race', 'realm', 'root', 'traits', 'talentProfile']) {
      const pollutedSave = JSON.parse(JSON.stringify(baseSave));
      pollutedSave.entities[0].components[forbiddenKey] = { dummy: true };
      assert.throws(
        () => SaveManager.deserializeWorld(playingEngine, pollutedSave),
        /component tu luyện\/cư dân bị cấm/
      );
    }

    // Thế giới đang chơi vẫn nguyên vẹn sau mọi lần nạp lỗi
    assert.equal(playingEngine.worldName, 'Thế Giới Nguyên Vẹn');
    assert.equal(playingEngine.world.getEntityCount(), 1);
    assert.equal(playingEngine.world.getComponent(foxId, AnimalComponent)?.speciesId, 'fox');
  });

  console.log(`${passed} animal-save regression tests passed`);
}

runAnimalSaveRegressionTests().catch(err => {
  console.error(err);
  process.exit(1);
});
