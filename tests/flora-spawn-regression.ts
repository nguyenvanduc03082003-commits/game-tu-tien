import assert from 'node:assert/strict';
import { ECSWorld } from '../src/ecs/World.ts';
import { SeededRNG } from '../src/core/SeededRNG.ts';
import { calculateInitialFaunaBudget } from '../src/config/animals/animal.simulation.ts';
import { TerrainType } from '../src/config/terrains.config.ts';
import { QiGrid } from '../src/modules/energy/QiGrid.ts';
import { AnimalComponent } from '../src/modules/animals/AnimalComponents.ts';
import { AnimalSpawnService } from '../src/modules/animals/AnimalSpawnService.ts';
import {
  PositionComponent,
  RaceComponent,
  RealmComponent,
  SpiritualRootComponent,
  CultivationTechniqueComponent
} from '../src/modules/beings/BeingComponents.ts';
import { TalentProfileComponent } from '../src/modules/talent/TalentComponents.ts';
import { PlantComponent } from '../src/modules/flora/PlantComponents.ts';
import { PlantFactory } from '../src/modules/flora/PlantFactory.ts';
import { PlantGrowthSystem } from '../src/modules/flora/PlantGrowthSystem.ts';
import { WorldMap } from '../src/modules/world/WorldMap.ts';

function fillTerrain(map: WorldMap, terrain: TerrainType): void {
  for (const tile of map.getAllTiles()) tile.terrain = terrain;
}

// 1. Kiểm tra thực vật: không mọc trên nước, tự hủy khi đất đổi thành sông
const waterMap = new WorldMap(12, 12);
fillTerrain(waterMap, TerrainType.LAKE);
const waterWorld = new ECSWorld();
PlantFactory.generateInitialFlora(waterWorld, waterMap, new QiGrid(12, 12), { next: () => 0.05 });
assert.equal(waterWorld.query([PlantComponent]).length, 0, 'Không sinh thực vật trên hồ');
assert.equal(PlantFactory.canPlantAt(waterMap, 40, 40), false);
assert.equal(PlantFactory.findNearestLand(waterMap, 40, 40, 2), null);

waterMap.setTerrain(3, 3, TerrainType.PLAIN);
const nearest = PlantFactory.findNearestLand(waterMap, 40, 40, 2);
assert.ok(nearest, 'Tìm được đất gần vị trí khởi đầu');
assert.equal(PlantFactory.canPlantAt(waterMap, nearest.x, nearest.y), true);
PlantFactory.spawnPlant(waterWorld, 'oak_tree', nearest.x, nearest.y);
waterMap.setTerrain(3, 3, TerrainType.RIVER);
new PlantGrowthSystem(waterMap, new QiGrid(12, 12)).update(waterWorld, 0.5);
assert.equal(waterWorld.query([PlantComponent]).length, 0, 'Cây cũ bị xóa khi đất đổi thành sông');

// 2. Kiểm tra ném lỗi khi chỉ định loài không hợp lệ
assert.throws(
  () => AnimalSpawnService.populate(new ECSWorld(), new WorldMap(16, 16), 1, new SeededRNG(1), ['invalid_species']),
  /không hợp lệ/
);

// 3. Kiểm tra sinh thái động vật theo ngân sách tổng trên bản đồ nhỏ (32x32)
const budget32 = calculateInitialFaunaBudget(32, 32);
assert.ok(budget32 >= 4 && budget32 <= 30, `Ngân sách map 32x32 phải hợp lý (nhận ${budget32})`);

function spawnTestSnapshot(seed: number, dim: number = 32) {
  const map = new WorldMap(dim, dim);
  // Tạo địa hình đa dạng: đồng bằng, rừng rậm, núi đá
  for (let y = 0; y < dim; y++) {
    for (let x = 0; x < dim; x++) {
      if (y < dim / 3) map.setTerrain(x, y, TerrainType.PLAIN);
      else if (y < (dim * 2) / 3) map.setTerrain(x, y, TerrainType.DENSE_FOREST);
      else map.setTerrain(x, y, TerrainType.MOUNTAIN);
    }
  }

  const world = new ECSWorld();
  const rng = new SeededRNG(seed);
  const budget = calculateInitialFaunaBudget(dim, dim);
  const spawned = AnimalSpawnService.populate(world, map, budget, rng, undefined, {
    ensureBreedingPairs: true
  });

  const animalSnap = spawned.map(id => {
    const a = world.getComponent(id, AnimalComponent)!;
    const p = world.getComponent(id, PositionComponent)!;
    return `${a.speciesId}:${a.sex}@${p.x.toFixed(1)},${p.y.toFixed(1)}`;
  });

  return { world, map, spawned, animalSnap };
}

const runA1 = spawnTestSnapshot(2026, 32);
const runA2 = spawnTestSnapshot(2026, 32);
const runB = spawnTestSnapshot(9999, 32);

// A. Tính tất định 100% cho cùng seed
assert.equal(runA1.spawned.length, runA2.spawned.length);
assert.deepEqual(runA1.animalSnap, runA2.animalSnap, 'Cùng seed phải sinh ra quần thể động vật và vị trí y hệt nhau 100%');

// B. Đa dạng giữa các seed khác nhau
assert.notDeepEqual(runA1.animalSnap, runB.animalSnap, 'Khác seed phải cho kết quả phân bố hoặc vị trí khác nhau');

// C. Tuyệt đối 0 yêu tộc trong thế giới động vật khởi đầu
const racesInWorld = runA1.world.query([RaceComponent]);
const yaoCount = racesInWorld.filter(id => runA1.world.getComponent(id, RaceComponent)?.raceId === 'beast').length;
assert.equal(yaoCount, 0, 'Thế giới mới tuyệt đối không có yêu tộc tự sinh');

// D. Động vật chỉ có AnimalComponent, không có bất kỳ component tu luyện/linh căn/cảnh giới nào
for (const id of runA1.spawned) {
  assert.ok(runA1.world.hasComponent(id, AnimalComponent), 'Động vật phải có AnimalComponent');
  assert.equal(runA1.world.hasComponent(id, RaceComponent), false, 'Động vật không được có RaceComponent');
  assert.equal(runA1.world.hasComponent(id, RealmComponent), false, 'Động vật không được có RealmComponent');
  assert.equal(runA1.world.hasComponent(id, SpiritualRootComponent), false, 'Động vật không được có SpiritualRootComponent');
  assert.equal(runA1.world.hasComponent(id, TalentProfileComponent), false, 'Động vật không được có TalentProfileComponent');
  assert.equal(runA1.world.hasComponent(id, CultivationTechniqueComponent), false, 'Động vật không được có CultivationTechniqueComponent');
}

// E. Kiểm tra đủ cặp đực/cái cho loài có >= 2 cá thể
const speciesSexMap = new Map<string, { male: number; female: number }>();
for (const id of runA1.spawned) {
  const a = runA1.world.getComponent(id, AnimalComponent)!;
  const curr = speciesSexMap.get(a.speciesId) ?? { male: 0, female: 0 };
  if (a.sex === 'male') curr.male++;
  else curr.female++;
  speciesSexMap.set(a.speciesId, curr);
}

for (const [speciesId, sexes] of speciesSexMap) {
  if (sexes.male + sexes.female >= 2) {
    assert.ok(
      sexes.male >= 1 && sexes.female >= 1,
      `Loài ${speciesId} có ${sexes.male + sexes.female} con phải có ít nhất 1 đực và 1 cái để sinh sản (male: ${sexes.male}, female: ${sexes.female})`
    );
  }
}

// 4. Kiểm tra trên bản đồ lớn 360x360
const budget360 = calculateInitialFaunaBudget(360, 360);
assert.ok(budget360 >= 50 && budget360 <= 70, `Ngân sách map 360x360 phải nằm trong khoảng hợp lý (nhận ${budget360})`);
const run360 = spawnTestSnapshot(7777, 360);
assert.equal(run360.spawned.length, budget360, `Map 360x360 phải sinh đủ ngân sách ${budget360} cá thể`);
const yao360 = run360.world.query([RaceComponent]).filter(id => run360.world.getComponent(id, RaceComponent)?.raceId === 'beast').length;
assert.equal(yao360, 0, 'Bản đồ 360x360 cũng tuyệt đối không có yêu tộc tự sinh');

console.log('PASS flora-spawn: động vật thường sinh theo ngân sách sinh cảnh, 0 yêu tộc, tất định theo seed và đủ cặp đực cái');
