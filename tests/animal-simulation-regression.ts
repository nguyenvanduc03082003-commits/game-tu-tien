import assert from 'node:assert/strict';
import { ECSWorld } from '../src/ecs/World.ts';
import { WorldMap } from '../src/modules/world/WorldMap.ts';
import { QiGrid } from '../src/modules/energy/QiGrid.ts';
import { SpatialGrid } from '../src/core/SpatialGrid.ts';
import { SeededRNG } from '../src/core/SeededRNG.ts';
import { TerrainType } from '../src/config/terrains.config.ts';
import { getAnimalSpecies } from '../src/config/animals/animal.catalog.ts';
import {
  ANIMAL_CARCASS_BITE_HUNGER_GAIN,
  ANIMAL_FORAGE_HUNGER_GAIN_PER_SECOND,
  ANIMAL_HUNGER_DECAY_PER_DAY,
  ANIMAL_MAX_PER_SPECIES_POPULATION,
  ANIMAL_PATH_RETRY_COOLDOWN_SECONDS,
} from '../src/config/animals/animal.simulation.ts';
import { TimeManager } from '../src/core/TimeManager.ts';
import {
  AnimalBrainComponent,
  AnimalCarcassComponent,
  AnimalComponent,
} from '../src/modules/animals/AnimalComponents.ts';
import { AnimalFactory } from '../src/modules/animals/AnimalFactory.ts';
import { AnimalSaveCodec } from '../src/modules/animals/AnimalSaveCodec.ts';
import { AnimalLifecycleSystem } from '../src/modules/animals/AnimalLifecycleSystem.ts';
import { AnimalAISystem } from '../src/modules/animals/AnimalAISystem.ts';
import { AnimalMovement, AnimalMovementSystem } from '../src/modules/animals/AnimalMovement.ts';
import { AnimalCarcassSystem } from '../src/modules/animals/AnimalCarcassSystem.ts';
import { AnimalReproductionSystem } from '../src/modules/animals/AnimalReproductionSystem.ts';
import { AnimalSpawnService } from '../src/modules/animals/AnimalSpawnService.ts';
import {
  CorpseComponent,
  GraveComponent,
  HealthComponent,
  HungerComponent,
  LifespanComponent,
  PositionComponent,
  RaceComponent,
  RealmComponent,
  SpiritualRootComponent,
  TraitsComponent,
} from '../src/modules/beings/BeingComponents.ts';
import { BeingFactory } from '../src/modules/beings/BeingFactory.ts';
import { CorpseAndGraveSystem } from '../src/modules/beings/CorpseAndGraveSystem.ts';
import { NeedsSystem } from '../src/modules/ai/NeedsSystem.ts';
import { CombatSystem } from '../src/modules/combat/CombatSystem.ts';
import { DiplomacySystem } from '../src/modules/factions/DiplomacySystem.ts';
import { BuildingComponent } from '../src/modules/factions/FactionComponents.ts';
import { PlantComponent } from '../src/modules/flora/PlantComponents.ts';
import { CultivationSystem } from '../src/modules/cultivation/CultivationSystem.ts';
import { TribulationSystem } from '../src/modules/cultivation/TribulationSystem.ts';
import { SocialInteractionSystem } from '../src/modules/social/SocialInteractionSystem.ts';
import { TalentProfileComponent } from '../src/modules/talent/TalentComponents.ts';
import { AIPlanner } from '../src/modules/ai/brain/planner/AIPlanner.ts';
import { AIPlannerComponent, AIStrategicBrainComponent } from '../src/modules/ai/brain/AIComponents.ts';
import { AStarPathfinder } from '../src/modules/ai/pathfinding/AStar.ts';
import { BehaviorTreeExecutor } from '../src/modules/ai/brain/behavior/BehaviorTree.ts';

let passed = 0;
function test(name: string, fn: () => void): void {
  fn();
  passed++;
  console.log('PASS animal-simulation:', name);
}

function createLandMap(w: number = 24, h: number = 24, terrain: TerrainType = TerrainType.PLAIN): WorldMap {
  const map = new WorldMap(w, h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const tile = map.getTile(x, y);
      if (tile) {
        tile.terrain = terrain;
      }
    }
  }
  AStarPathfinder.invalidateBuildingCache();
  return map;
}

function syncGrid(world: ECSWorld, grid: SpatialGrid): void {
  const ids = world.query([PositionComponent]);
  grid.rebuild(
    ids.map(id => {
      const p = world.getComponent(id, PositionComponent)!;
      return { id, x: p.x, y: p.y };
    })
  );
}

test('spawned animals have no cultivation/talent/resident components and never awaken or cultivate over time', () => {
  const world = new ECSWorld();
  const map = createLandMap(16, 16, TerrainType.DENSE_FOREST);
  const qiGrid = new QiGrid(16, 16);
  const spatialGrid = new SpatialGrid(32);
  const tribulationSystem = new TribulationSystem();
  const cultivationSystem = new CultivationSystem(map, qiGrid, tribulationSystem);
  const needsSystem = new NeedsSystem();
  const corpseSystem = new CorpseAndGraveSystem(map);
  const socialSystem = new SocialInteractionSystem();
  socialSystem.spatialGrid = spatialGrid;
  const lifecycleSystem = new AnimalLifecycleSystem();

  const deer = AnimalFactory.spawn(world, 'spotted_deer', 64, 64, { sex: 'female', age: 2 });
  const tiger = AnimalFactory.spawn(world, 'tiger', 128, 128, { sex: 'male', age: 4 });

  AnimalSaveCodec.assertNoCultivationComponents(world, deer);
  AnimalSaveCodec.assertNoCultivationComponents(world, tiger);

  for (let i = 0; i < 40; i++) {
    syncGrid(world, spatialGrid);
    cultivationSystem.update(world, 1.0);
    needsSystem.update(world, 1.0);
    corpseSystem.update(world, 1.0);
    socialSystem.update(world, 1.0);
    lifecycleSystem.update(world, 1.0);
  }

  AnimalSaveCodec.assertNoCultivationComponents(world, deer);
  AnimalSaveCodec.assertNoCultivationComponents(world, tiger);
});

test('NeedsSystem and CorpseAndGraveSystem ignore animals; AnimalLifecycleSystem and AnimalCarcassSystem handle them', () => {
  const world = new ECSWorld();
  const map = createLandMap(16, 16);
  const needsSystem = new NeedsSystem();
  const corpseSystem = new CorpseAndGraveSystem(map);
  const lifecycleSystem = new AnimalLifecycleSystem();
  const carcassSystem = new AnimalCarcassSystem();

  const rabbit = AnimalFactory.spawn(world, 'rabbit', 80, 80, { sex: 'male', age: 1 });
  const hunger = world.getComponent(rabbit, HungerComponent)!;
  hunger.current = 100;

  const SECONDS_PER_DAY = TimeManager.TICKS_PER_DAY / TimeManager.TICKS_PER_SECOND;

  // NeedsSystem chạy 1 ngày không được đụng tới HungerComponent của động vật
  needsSystem.update(world, SECONDS_PER_DAY);
  assert.equal(hunger.current, 100, 'NeedsSystem của cư dân không được trừ đói của động vật');

  // AnimalLifecycleSystem chạy 1 ngày trừ đúng 18 điểm đói
  lifecycleSystem.update(world, SECONDS_PER_DAY);
  assert.ok(
    Math.abs(hunger.current - (100 - ANIMAL_HUNGER_DECAY_PER_DAY)) < 1e-6,
    `Động vật phải giảm đúng ${ANIMAL_HUNGER_DECAY_PER_DAY} đói mỗi ngày`
  );

  // Khi động vật chết, CorpseAndGraveSystem bỏ qua, còn AnimalCarcassSystem biến thành thực thể xác động vật
  const hp = world.getComponent(rabbit, HealthComponent)!;
  hp.current = 0;
  hp.isDead = true;
  assert.equal(hp.isDead, true);

  corpseSystem.update(world, SECONDS_PER_DAY);
  assert.equal(world.hasComponent(rabbit, CorpseComponent), false, 'Động vật chết không được tạo CorpseComponent của cư dân');
  assert.equal(world.query([CorpseComponent]).length, 0);
  assert.equal(world.query([GraveComponent]).length, 0);

  carcassSystem.update(world, SECONDS_PER_DAY);
  assert.equal(world.hasComponent(rabbit, AnimalComponent), false, 'Thực thể động vật chết đã bị xóa và thay bằng xác');
  const carcassIds = world.query([AnimalCarcassComponent]);
  assert.equal(carcassIds.length, 1, 'Phải tạo đúng 1 thực thể AnimalCarcassComponent');
  const carcass = world.getComponent(carcassIds[0], AnimalCarcassComponent)!;
  assert.equal(carcass.speciesId, 'rabbit');
  assert.equal(
    carcass.remainingNutrition,
    Math.max(40, Math.round(getAnimalSpecies('rabbit').maxHealth * 1.4))
  );

  // Sau 30 ngày, xác động vật tự phân hủy và bị xóa
  carcassSystem.update(world, 30.1 * SECONDS_PER_DAY);
  assert.equal(world.query([AnimalCarcassComponent]).length, 0, 'Xác động vật phải tự xóa sau 30 ngày');
});

test('AnimalMovementSystem stays on passable land, blocks diagonal corner-cutting across water/buildings, and idles with cooldown when trapped', () => {
  const world = new ECSWorld();
  const map = createLandMap(12, 12, TerrainType.PLAIN);
  const spatialGrid = new SpatialGrid(32);
  const movementSystem = new AnimalMovementSystem(map, spatialGrid);

  // Chặn toàn bộ quanh (1,1) bằng nước, chỉ để (2,2) ở góc chéo là đất liền -> không được cắt góc chéo
  map.getTile(2, 1)!.terrain = TerrainType.RIVER;
  map.getTile(1, 2)!.terrain = TerrainType.RIVER;
  map.getTile(0, 1)!.terrain = TerrainType.RIVER;
  map.getTile(1, 0)!.terrain = TerrainType.RIVER;
  map.getTile(0, 0)!.terrain = TerrainType.RIVER;
  map.getTile(2, 0)!.terrain = TerrainType.RIVER;
  map.getTile(0, 2)!.terrain = TerrainType.RIVER;

  const boar = AnimalFactory.spawn(world, 'wild_boar', 1 * 16 + 8, 1 * 16 + 8);
  const brain = world.getComponent(boar, AnimalBrainComponent)!;
  brain.state = 'wander';
  brain.destinationX = 2 * 16 + 8;
  brain.destinationY = 2 * 16 + 8;

  BehaviorTreeExecutor.beginTick();
  movementSystem.update(world, 0.5);
  assert.equal(brain.state, 'idle', 'Không được cắt góc chéo qua hai ô nước');
  assert.equal(brain.destinationX, undefined);
  assert.equal(brain.pathRetryCooldown, ANIMAL_PATH_RETRY_COOLDOWN_SECONDS);

  // Kiểm tra né công trình và không bao giờ bước lên ô nước/công trình
  const map2 = createLandMap(12, 12, TerrainType.PLAIN);
  const bldEnt = world.createEntity();
  world.addComponent(bldEnt, new PositionComponent(4 * 16, 4 * 16, 0));
  world.addComponent(bldEnt, new BuildingComponent('house', 'fac_1', 'Nhà Gỗ', 2, 2, 500));
  AStarPathfinder.invalidateBuildingCache();

  const movement2 = new AnimalMovementSystem(map2, spatialGrid);
  const horse = AnimalFactory.spawn(world, 'horse', 2 * 16 + 8, 4 * 16 + 8);
  const horseBrain = world.getComponent(horse, AnimalBrainComponent)!;
  horseBrain.state = 'wander';
  horseBrain.destinationX = 7 * 16 + 8;
  horseBrain.destinationY = 4 * 16 + 8;

  for (let step = 0; step < 30; step++) {
    BehaviorTreeExecutor.beginTick();
    movement2.update(world, 0.25);
    const p = world.getComponent(horse, PositionComponent)!;
    assert.equal(
      AnimalMovement.isPixelWalkable(world, map2, p.x, p.y),
      true,
      `Bước ${step}: Ngựa không được đi vào công trình hoặc ô nước (${p.x}, ${p.y})`
    );
  }
});

test('Herbivore forages on grass, and Carnivore hunts prey -> turns to carcass -> eats finite nutrition -> removes depleted carcass', () => {
  const world = new ECSWorld();
  const map = createLandMap(16, 16, TerrainType.PLAIN);
  const spatialGrid = new SpatialGrid(32);
  const aiSystem = new AnimalAISystem(map);
  aiSystem.spatialGrid = spatialGrid;
  const movementSystem = new AnimalMovementSystem(map, spatialGrid);

  // 1. Thú ăn cỏ kiếm ăn khi đói (< 45)
  const sheep = AnimalFactory.spawn(world, 'sheep', 64, 64, { sex: 'female', age: 2, hunger: 30 });
  const sheepHunger = world.getComponent(sheep, HungerComponent)!;
  assert.equal(sheepHunger.current, 30);

  for (let i = 0; i < 15; i++) {
    BehaviorTreeExecutor.beginTick();
    syncGrid(world, spatialGrid);
    aiSystem.update(world, 0.5);
    movementSystem.update(world, 0.5);
  }
  assert.ok(
    sheepHunger.current >= 30 + ANIMAL_FORAGE_HUNGER_GAIN_PER_SECOND * 0.5,
    `Cừu kiếm ăn phải hồi phục độ no (nhận ${sheepHunger.current})`
  );

  // 2. Thú ăn thịt săn con mồi -> giết mồi -> ăn xác hữu hạn -> xác biến mất khi hết dinh dưỡng
  const world2 = new ECSWorld();
  const diplomacy = new DiplomacySystem();
  diplomacy.spatialGrid = spatialGrid;
  const ai2 = new AnimalAISystem(map);
  ai2.spatialGrid = spatialGrid;
  const move2 = new AnimalMovementSystem(map, spatialGrid);
  const combat2 = new CombatSystem(map, diplomacy);
  combat2.spatialGrid = spatialGrid;
  const carcassSystem = new AnimalCarcassSystem();

  const wolf = AnimalFactory.spawn(world2, 'wolf', 100, 100, { sex: 'male', age: 4, hunger: 25 });
  const rabbit = AnimalFactory.spawn(world2, 'rabbit', 112, 100, { sex: 'female', age: 1, hunger: 80 });
  const wolfHunger = world2.getComponent(wolf, HungerComponent)!;
  world2.getComponent(rabbit, HealthComponent)!.current = 10;

  // Chạy AI + Combat + Carcass cho đến khi thỏ chết và biến thành xác
  for (let i = 0; i < 10; i++) {
    BehaviorTreeExecutor.beginTick();
    syncGrid(world2, spatialGrid);
    ai2.update(world2, 0.5);
    move2.update(world2, 0.5);
    combat2.update(world2, 0.5);
    carcassSystem.update(world2, 0.5);
    if (!world2.hasComponent(rabbit, AnimalComponent)) {
      break;
    }
  }

  assert.equal(world2.hasComponent(rabbit, AnimalComponent), false, 'Thỏ bị săn phải chết và chuyển thành xác');
  const carcasses = world2.query([AnimalCarcassComponent]);
  assert.equal(carcasses.length, 1, 'Phải sinh ra 1 xác thỏ');
  const carcassId = carcasses[0];
  const carcassComp = world2.getComponent(carcassId, AnimalCarcassComponent)!;

  // Kiểm tra tiêu thụ hữu hạn từng phần và tự xóa xác khi hết dinh dưỡng
  carcassComp.remainingNutrition = 20;
  const hungerBeforeBite = wolfHunger.current;
  const consumed = AnimalCarcassSystem.consumeCarcassPortion(
    world2,
    wolf,
    carcassId,
    ANIMAL_CARCASS_BITE_HUNGER_GAIN
  );
  assert.equal(consumed, 20);
  assert.equal(wolfHunger.current, Math.min(100, hungerBeforeBite + 20));
  assert.equal(
    world2.hasComponent(carcassId, AnimalCarcassComponent),
    false,
    'Xác động vật phải bị xóa ngay khi cạn dinh dưỡng'
  );
  // Gọi ăn lần 2 trên xác đã xóa phải trả về 0, không bao giờ ăn trùng
  assert.equal(AnimalCarcassSystem.consumeCarcassPortion(world2, wolf, carcassId, 35), 0);
});

test('Herbivore only forages in valid habitats and does not gain hunger when outside habitat or destination invalidated', () => {
  const world = new ECSWorld();
  const map = createLandMap(16, 16, TerrainType.PLAIN);
  const spatialGrid = new SpatialGrid(32);
  const aiSystem = new AnimalAISystem(map);
  aiSystem.spatialGrid = spatialGrid;
  const movementSystem = new AnimalMovementSystem(map, spatialGrid);

  // Dê (goat) có habitats: [HILL, MOUNTAIN, PLATEAU]. Ô hiện tại là PLAIN -> ngoài sinh cảnh!
  const goat = AnimalFactory.spawn(world, 'goat', 64, 64, { sex: 'female', age: 2, hunger: 30 });
  const goatHunger = world.getComponent(goat, HungerComponent)!;
  const goatBrain = world.getComponent(goat, AnimalBrainComponent)!;
  assert.equal(goatHunger.current, 30);

  // 1. Chạy nhiều tick khi dê đứng trên PLAIN và xung quanh không có sinh cảnh phù hợp
  for (let i = 0; i < 20; i++) {
    BehaviorTreeExecutor.beginTick();
    syncGrid(world, spatialGrid);
    aiSystem.update(world, 0.5);
    movementSystem.update(world, 0.5);
  }

  assert.equal(
    goatHunger.current,
    30,
    'Độ no của dê tuyệt đối không được tăng khi ở ngoài sinh cảnh hợp lệ'
  );
  assert.notEqual(goatBrain.state, 'forage', 'AI không được duy trì forage khi không có điểm kiếm ăn hợp lệ');

  // 2. Thêm ô HILL hợp lệ và bụi cỏ cách đó vài ô (tx=5, ty=4 -> pixel x=88, y=72)
  map.getTile(5, 4)!.terrain = TerrainType.HILL;
  const foragePlant = world.createEntity();
  world.addComponent(foragePlant, new PositionComponent(88, 72));
  world.addComponent(foragePlant, new PlantComponent('grass', 1, 1));

  // Chạy các tick tiếp theo: dê phát hiện cây trên ô HILL, di chuyển tới và chỉ ăn sau khi đã tới nơi
  let sawMoving = false;
  for (let i = 0; i < 30; i++) {
    BehaviorTreeExecutor.beginTick();
    syncGrid(world, spatialGrid);
    aiSystem.update(world, 0.25);
    movementSystem.update(world, 0.25);
    if (goatBrain.state === 'forage' && typeof goatBrain.destinationX === 'number') {
      sawMoving = true;
    }
  }

  assert.ok(sawMoving, 'Dê phải đặt đích kiếm ăn tới ô HILL hợp lệ');
  assert.ok(
    goatHunger.current > 30,
    `Sau khi di chuyển tới ô HILL, dê mới được gặm cỏ hồi phục độ no (hiện tại: ${goatHunger.current})`
  );

  // 3. Đổi ô đích thành không hợp lệ trước khi tới -> AI phải hủy forage và không được ăn
  const world2 = new ECSWorld();
  const map2 = createLandMap(16, 16, TerrainType.PLAIN);
  const spatialGrid2 = new SpatialGrid(32);
  const ai2 = new AnimalAISystem(map2);
  ai2.spatialGrid = spatialGrid2;
  const move2 = new AnimalMovementSystem(map2, spatialGrid2);

  // Đặt 1 bụi cỏ trên ô HILL cách xa một đoạn (tx=8, ty=4 -> pixel x=136, y=72)
  map2.getTile(8, 4)!.terrain = TerrainType.HILL;
  const farPlant = world2.createEntity();
  world2.addComponent(farPlant, new PositionComponent(136, 72));
  world2.addComponent(farPlant, new PlantComponent('grass', 1, 1));

  const goat2 = AnimalFactory.spawn(world2, 'goat', 32, 72, { sex: 'female', age: 2, hunger: 25 });
  const hunger2 = world2.getComponent(goat2, HungerComponent)!;
  const brain2 = world2.getComponent(goat2, AnimalBrainComponent)!;

  // Tick 1 nhịp để nhận diện đích HILL
  BehaviorTreeExecutor.beginTick();
  syncGrid(world2, spatialGrid2);
  ai2.update(world2, 0.25);
  assert.equal(brain2.state, 'forage');
  assert.equal(brain2.destinationX, 136);
  assert.equal(brain2.destinationY, 72);

  // Trước khi dê kịp tới nơi, biến ô đích thành PLAIN (ngoài sinh cảnh)
  map2.getTile(8, 4)!.terrain = TerrainType.PLAIN;

  for (let i = 0; i < 15; i++) {
    BehaviorTreeExecutor.beginTick();
    syncGrid(world2, spatialGrid2);
    ai2.update(world2, 0.25);
    move2.update(world2, 0.25);
  }

  assert.equal(hunger2.current, 25, 'Khi ô đích bị đổi thành không hợp lệ, dê không được tăng độ no');
  assert.equal(brain2.state, 'idle', 'AI phải tự hủy forage và chuyển về idle');
});

test('Herbivore keeps eating across simulation ticks while lifecycle drains hunger', () => {
  const world = new ECSWorld();
  const map = createLandMap(16, 16, TerrainType.PLAIN);
  const lifecycle = new AnimalLifecycleSystem();
  const ai = new AnimalAISystem(map);
  const sheep = AnimalFactory.spawn(world, 'sheep', 64, 64, {
    sex: 'female', age: 2, hunger: 30,
  });
  const brain = world.getComponent(sheep, AnimalBrainComponent)!;
  const hunger = world.getComponent(sheep, HungerComponent)!;
  brain.state = 'forage';
  brain.destinationX = 64;
  brain.destinationY = 64;
  brain.decisionTimer = 0.5;

  for (let tick = 0; tick < 20; tick++) {
    lifecycle.update(world, 0.05);
    ai.update(world, 0.05);
  }

  assert.ok(world.hasComponent(sheep, AnimalComponent), 'Cừu còn sống sau một ngày kiếm ăn');
  assert.ok(hunger.current > 30, `Độ no phải tăng dù vòng đời vẫn tiêu hao (hiện ${hunger.current})`);
  assert.equal(brain.state, 'forage', 'Cừu tiếp tục gặm cỏ qua nhiều tick');
  assert.equal(brain.destinationX, 64, 'Đích ăn được giữ đến khi no');
});

test('AnimalReproductionSystem breeds valid pairs, blocks parent-child and sibling inbreeding, and respects population caps', () => {
  const world = new ECSWorld();
  const map = createLandMap(16, 16, TerrainType.PLAIN);
  const reproSystem = new AnimalReproductionSystem(map, () => 0.01);

  const father = AnimalFactory.spawn(world, 'dog', 80, 80, {
    sex: 'male',
    age: 2,
    reproductionCooldownDays: 0,
    hunger: 90,
  });
  const mother = AnimalFactory.spawn(world, 'dog', 96, 80, {
    sex: 'female',
    age: 2,
    reproductionCooldownDays: 0,
    hunger: 90,
  });

  reproSystem.update(world, 5.0);

  const allDogs = world.query([AnimalComponent]);
  assert.equal(allDogs.length, 3, 'Cặp chó đực-cái trưởng thành đủ điều kiện phải sinh con');
  assert.ok(world.getComponent(father, AnimalComponent)!.reproductionCooldownDays > 0);
  assert.ok(world.getComponent(mother, AnimalComponent)!.reproductionCooldownDays > 0);

  const pupId = allDogs.find(id => id !== father && id !== mother)!;
  const pupComp = world.getComponent(pupId, AnimalComponent)!;
  assert.equal(pupComp.lifeStage, 'child');
  assert.deepEqual(pupComp.parentIds, [father, mother]);

  // Kiểm tra chặn cận huyết cha-con và anh-chị-em ruột/cùng cha hoặc cùng mẹ
  assert.equal(
    AnimalReproductionSystem.areCloselyRelated(
      father,
      world.getComponent(father, AnimalComponent)!,
      pupId,
      pupComp
    ),
    true,
    'Phải chặn giao phối cha-con'
  );

  const siblingA = new AnimalComponent('dog', 'male', 'adult', 0, [father, mother]);
  const siblingB = new AnimalComponent('dog', 'female', 'adult', 0, [father, 9999]);
  assert.equal(
    AnimalReproductionSystem.areCloselyRelated(501, siblingA, 502, siblingB),
    true,
    'Phải chặn giao phối anh-chị-em cùng cha hoặc cùng mẹ'
  );

  // Kiểm tra giới hạn tối đa 30 cá thể/loài
  const worldCap = new ECSWorld();
  for (let i = 0; i < ANIMAL_MAX_PER_SPECIES_POPULATION; i++) {
    AnimalFactory.spawn(worldCap, 'chicken', 64 + (i % 4) * 4, 64 + Math.floor(i / 4) * 4, {
      sex: i % 2 === 0 ? 'male' : 'female',
      age: 1,
      reproductionCooldownDays: 0,
      hunger: 100,
    });
  }
  const reproCap = new AnimalReproductionSystem(map, () => 0.01);
  reproCap.update(worldCap, 5.0);
  assert.equal(
    worldCap.query([AnimalComponent]).length,
    ANIMAL_MAX_PER_SPECIES_POPULATION,
    `Không được sinh vượt quá ${ANIMAL_MAX_PER_SPECIES_POPULATION} cá thể cùng loài`
  );
});

test('AnimalSpawnService populates valid habitats, and Yao archetypes remain sentient cultivators', () => {
  const world = new ECSWorld();
  const map = createLandMap(32, 32, TerrainType.DENSE_FOREST);
  const rng = new SeededRNG(2026);

  const spawned = AnimalSpawnService.populate(world, map, 40, rng);
  assert.equal(spawned.length, 40, `Phải sinh đủ 40 cá thể động vật trên sinh cảnh hợp lệ`);
  for (const id of spawned) {
    AnimalSaveCodec.assertNoCultivationComponents(world, id);
  }

  // Kiểm tra Yêu tộc sinh ra từ yao_common và yao_common
  const yaoCommon = BeingFactory.spawnFromArchetype(world, 'yao_common', 100, 100);
  const yaoCultivator = BeingFactory.spawnFromArchetype(world, 'yao_common', 120, 120);

  for (const yaoId of [yaoCommon, yaoCultivator]) {
    assert.equal(world.hasComponent(yaoId, AnimalComponent), false, 'Yêu tộc không phải AnimalComponent');
    assert.equal(world.getComponent(yaoId, RaceComponent)?.raceId, 'beast');
    assert.ok(world.hasComponent(yaoId, RealmComponent));
    assert.ok(world.hasComponent(yaoId, SpiritualRootComponent));
    assert.ok(world.hasComponent(yaoId, TalentProfileComponent));
    assert.ok(world.hasComponent(yaoId, TraitsComponent));
    assert.ok(world.hasComponent(yaoId, AIStrategicBrainComponent));
  }

  // Kiểm tra AIPlanner của Yêu tộc khi đói (SURVIVE_VITAL) tìm mồi là AnimalComponent
  const worldHunt = new ECSWorld();
  const yaoHunter = BeingFactory.spawnFromArchetype(worldHunt, 'yao_common', 100, 100);
  worldHunt.getComponent(yaoHunter, HungerComponent)!.current = 30;
  const targetRabbit = AnimalFactory.spawn(worldHunt, 'rabbit', 108, 100, { sex: 'female', age: 1 });
  const brain = worldHunt.getComponent(yaoHunter, AIStrategicBrainComponent)!;
  const planner = worldHunt.getComponent(yaoHunter, AIPlannerComponent)!;
  brain.currentGoal = 'SURVIVE_VITAL';
  AIPlanner.planForGoal(worldHunt, yaoHunter, 'SURVIVE_VITAL', brain, planner, map, new QiGrid(32, 32));
  assert.equal(planner.steps[0]?.type, 'MOVE_TO');
  assert.equal(planner.steps[0]?.targetEntityId, targetRabbit, 'Yêu tộc săn mồi phải nhắm di chuyển tới thực thể AnimalComponent');
  assert.equal(planner.steps[1]?.type, 'ATTACK_TARGET');
  assert.equal(planner.steps[1]?.targetEntityId, targetRabbit, 'Yêu tộc săn mồi phải nhắm tấn công vào thực thể AnimalComponent');
});

test('Animal mortality tracks causeOfDeath accurately, well-fed animals do not die before maxLifespan, and starved animals die with starvation cause', () => {
  const SECONDS_PER_DAY = TimeManager.TICKS_PER_DAY / TimeManager.TICKS_PER_SECOND; // 5s
  AnimalCarcassSystem.resetDeathStats();

  const world = new ECSWorld();
  const lifecycle = new AnimalLifecycleSystem();

  // 1. Thỏ no đủ thức ăn (hunger = 100), tuổi 1 / thọ 5 -> sống bình thường qua 10 ngày
  const fedRabbit = AnimalFactory.spawn(world, 'rabbit', 10, 10, { sex: 'female', age: 1, hunger: 100 });
  const fedLife = world.getComponent(fedRabbit, LifespanComponent)!;
  const fedHp = world.getComponent(fedRabbit, HealthComponent)!;
  const fedHunger = world.getComponent(fedRabbit, HungerComponent)!;

  for (let day = 0; day < 10; day++) {
    fedHunger.current = 100; // Cung cấp thức ăn liên tục
    lifecycle.update(world, SECONDS_PER_DAY);
  }
  assert.equal(fedHp.isDead, false, 'Động vật đủ thức ăn không được chết trước tuổi thọ tối đa');
  assert.ok(fedLife.currentAge > 1.0, 'Động vật phải tăng tuổi theo ngày mô phỏng');

  // 2. Thỏ bị bỏ đói hoàn toàn (hunger = 10, dưới ngưỡng đói 15) -> sau khi hết máu phải chết vì starvation
  const starvedRabbit = AnimalFactory.spawn(world, 'rabbit', 20, 20, { sex: 'male', age: 1, hunger: 0 });
  const starvedHp = world.getComponent(starvedRabbit, HealthComponent)!;
  const initialHp = starvedHp.current; // thỏ có maxHealth = 30
  // Starvation damage = 12 / ngày. Với 30 máu, mất khoảng 2.5 ngày để chết đói
  const daysToStarve = (initialHp / 12) + 0.1;
  lifecycle.update(world, daysToStarve * SECONDS_PER_DAY);

  // Thỏ đã chết và chuyển thành xác
  assert.equal(world.hasComponent(starvedRabbit, AnimalComponent), false, 'Thỏ bị bỏ đói phải chết');
  const carcasses = world.query([AnimalCarcassComponent]);
  assert.ok(carcasses.length >= 1, 'Phải tạo xác cho động vật chết đói');
  const starvedCarcass = world.getComponent(carcasses[carcasses.length - 1], AnimalCarcassComponent)!;
  assert.equal(starvedCarcass.causeOfDeath, 'starvation', 'Nguyên nhân tử vong của thỏ đói phải là starvation');

  // 3. Động vật đạt tuổi thọ tối đa -> chết vì old_age
  const worldOld = new ECSWorld();
  const oldRabbit = AnimalFactory.spawn(worldOld, 'rabbit', 30, 30, { sex: 'male', age: 4.99, hunger: 100 });
  const oldLife = worldOld.getComponent(oldRabbit, LifespanComponent)!;
  oldLife.maxLifespan = 5.0; // 5 tuổi
  // Cung cấp đủ thức ăn nhưng cho thời gian trôi qua quá 5 tuổi (0.02 năm = ~7.2 ngày = 36 giây)
  const oldHunger = worldOld.getComponent(oldRabbit, HungerComponent)!;
  for (let i = 0; i < 8; i++) {
    oldHunger.current = 100;
    lifecycle.update(worldOld, SECONDS_PER_DAY);
  }
  assert.equal(worldOld.hasComponent(oldRabbit, AnimalComponent), false, 'Động vật đạt maxLifespan phải chết vì tuổi già');
  const oldCarcasses = worldOld.query([AnimalCarcassComponent]);
  assert.ok(oldCarcasses.length >= 1, 'Phải tạo xác cho động vật chết già');
  const oldCarcass = worldOld.getComponent(oldCarcasses[oldCarcasses.length - 1], AnimalCarcassComponent)!;
  assert.equal(oldCarcass.causeOfDeath, 'old_age', 'Nguyên nhân tử vong của thỏ già phải là old_age');

  // 4. Thống kê tổng số lượng chết
  const stats = AnimalCarcassSystem.getDeathStats();
  assert.ok(stats.starvation >= 1, 'Thống kê phải ghi nhận ít nhất 1 ca chết đói');
  assert.ok(stats.old_age >= 1, 'Thống kê phải ghi nhận ít nhất 1 ca chết già');
});

console.log(`${passed} animal-simulation regression tests passed`);
