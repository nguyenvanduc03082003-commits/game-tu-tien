import assert from 'node:assert/strict';
import { Engine } from '../src/core/Engine.ts';
import { ECSWorld } from '../src/ecs/World.ts';
import { SpatialGrid } from '../src/core/SpatialGrid.ts';
import { TimeManager } from '../src/core/TimeManager.ts';
import { WorldMap } from '../src/modules/world/WorldMap.ts';
import { QiGrid } from '../src/modules/energy/QiGrid.ts';
import { WeatherSystem } from '../src/modules/weather/WeatherSystem.ts';
import { RaceComponent } from '../src/modules/beings/BeingComponents.ts';
import { WorldGenerator, type WorldTemplate } from '../src/modules/world/WorldGenerator.ts';
import { TerrainType } from '../src/config/terrains.config.ts';

function makeEngineHarness(): Engine {
  const engine = Object.create(Engine.prototype) as Engine & Record<string, any>;
  engine.world = new ECSWorld();
  engine.worldMap = new WorldMap(24, 24);
  engine.qiGrid = new QiGrid(24, 24);
  engine.spatialGrid = new SpatialGrid(64);
  engine.timeManager = TimeManager.getInstance();
  engine.weatherSystem = new WeatherSystem(engine.worldMap);
  engine.camera = { x: 0, y: 0, zoom: 1 };
  engine.eventBus = { emit() {} };
  engine.resizeWorldContainers = () => {};
  engine.resetWorldState = () => engine.world.clearEntities();
  engine.syncSpatialGrid = () => {};
  return engine;
}

function assertRiverComponentsReachWater(map: WorldMap, template: WorldTemplate, seed: number): void {
  const riverIndices = new Set<number>();
  map.getAllTiles().forEach((tile, index) => {
    if (tile.terrain === TerrainType.RIVER) riverIndices.add(index);
  });
  assert.ok(riverIndices.size > 0, `${template} seed ${seed} should generate at least one river`);

  while (riverIndices.size > 0) {
    const first = riverIndices.values().next().value as number;
    riverIndices.delete(first);
    const queue = [first];
    let reachesWater = false;
    while (queue.length > 0) {
      const index = queue.pop()!;
      const x = index % map.width;
      const y = Math.floor(index / map.width);
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const nx = x + dx;
          const ny = y + dy;
          const neighbor = map.getTile(nx, ny);
          if (!neighbor) continue;
          if (neighbor.terrain === TerrainType.OCEAN || neighbor.terrain === TerrainType.LAKE) reachesWater = true;
          const neighborIndex = ny * map.width + nx;
          if (riverIndices.delete(neighborIndex)) queue.push(neighborIndex);
        }
      }
    }
    assert.ok(reachesWater, `${template} seed ${seed} has a river component disconnected from lake/ocean`);
  }
}

for (const seed of [12345, 67890]) {
  const engine = makeEngineHarness();
  engine.initNewWorld({ template: 'dong_bang_trung_tho', seed, customDim: 24 });

  assert.equal(
    engine.world.query([RaceComponent]).length,
    0,
    `Thế giới mới với seed ${seed} không được tự sinh cư dân hoặc yêu tộc`
  );
}

const templates: WorldTemplate[] = [
  'random',
  'thap_van_dai_son',
  'dong_bang_trung_tho',
  'ma_vuc_dam_lay',
  'hai_dao_tien_son',
];

for (const [width, height] of [[1, 1], [2, 8], [8, 2], [20, 24], [24, 20], [64, 40]]) {
  for (const template of templates) {
    const first = new WorldMap(width, height);
    const second = new WorldMap(width, height);
    WorldGenerator.generate(first, template, 20260930);
    WorldGenerator.generate(second, template, 20260930);

    const summarize = (map: WorldMap) => map.getAllTiles().map(tile => ({
      terrain: tile.terrain,
      elevation: tile.elevation,
      moisture: tile.moisture,
      temperature: tile.temperature,
      qiDensity: tile.qiDensity,
      plantGrowth: tile.plantGrowth,
      variant: tile.variant,
    }));
    const actual = summarize(first);
    assert.deepEqual(actual, summarize(second), `${template} ${width}x${height} must be deterministic`);
    assert.equal(actual.length, width * height);
    for (let i = 0; i < actual.length; i++) {
      const tile = actual[i];
      assert.ok(Object.values(TerrainType).includes(tile.terrain), `${template} ${width}x${height} tile ${i} has terrain`);
      assert.ok(Number.isFinite(tile.elevation) && tile.elevation >= 0 && tile.elevation <= 1, `${template} tile ${i} has bounded elevation`);
      assert.ok(Number.isFinite(tile.moisture) && tile.moisture >= 0 && tile.moisture <= 1, `${template} tile ${i} has bounded moisture`);
      assert.ok(Number.isFinite(tile.temperature), `${template} tile ${i} has finite temperature`);
      assert.ok(Number.isFinite(tile.qiDensity) && tile.qiDensity >= 0, `${template} tile ${i} has valid Qi`);
      assert.ok(Number.isFinite(tile.plantGrowth) && tile.plantGrowth >= 0, `${template} tile ${i} has valid plant growth`);
      assert.ok(Number.isInteger(tile.variant) && tile.variant >= 0 && tile.variant <= 3, `${template} tile ${i} has valid variant`);
    }
  }
}

for (const template of templates) {
  for (const seed of [1, 42, 2026, 12345, 67890, 98765, 20260930, 999999]) {
    const map = new WorldMap(150, 150);
    WorldGenerator.generate(map, template, seed);
    assertRiverComponentsReachWater(map, template, seed);

    const counts = new Map(Object.values(TerrainType).map(terrain => [terrain, 0]));
    for (const tile of map.getAllTiles()) counts.set(tile.terrain, (counts.get(tile.terrain) ?? 0) + 1);
    const ratio = (terrain: TerrainType) => (counts.get(terrain) ?? 0) / (map.width * map.height);
    if (template === 'thap_van_dai_son') {
      assert.ok(ratio(TerrainType.MOUNTAIN) >= 0.10,
        `Thập Vạn Đại Sơn seed ${seed} should have >=10% mountain terrain`);
    } else if (template === 'dong_bang_trung_tho') {
      assert.ok(ratio(TerrainType.PLAIN) >= 0.60,
        `Bình Nguyên Trung Thổ seed ${seed} should have >=60% plains`);
    } else if (template === 'ma_vuc_dam_lay') {
      assert.ok(ratio(TerrainType.SWAMP) >= 0.50,
        `Ma Vực Đầm Lầy seed ${seed} should have >=50% swamp terrain`);
    } else if (template === 'hai_dao_tien_son') {
      assert.ok(ratio(TerrainType.OCEAN) >= 0.50,
        `Hải Đảo Tiên Sơn seed ${seed} should have >=50% ocean`);
    }
  }
}

const originalMap = new WorldMap(24, 24);
const invalidInputEngine = makeEngineHarness();
invalidInputEngine.worldMap = originalMap;
const originalEntity = invalidInputEngine.world.createEntity();
assert.throws(
  () => invalidInputEngine.initNewWorld({ template: 'dong_bang_trung_tho', seed: 12, customDim: 0 }),
  /Kích thước thế giới phải là số nguyên/,
  'Invalid size must be rejected before world reset'
);
assert.equal(invalidInputEngine.worldMap, originalMap, 'Invalid dimensions must preserve the current map');
assert.deepEqual(invalidInputEngine.world.query([]), [originalEntity], 'Invalid dimensions must preserve current entities');
assert.throws(
  () => invalidInputEngine.initNewWorld({ template: 'dong_bang_trung_tho', seed: Number.NaN, customDim: 24 }),
  /Seed thế giới phải là số nguyên an toàn/,
  'Invalid seed must be rejected before world reset'
);
assert.equal(invalidInputEngine.worldMap, originalMap, 'Invalid seed must preserve the current map');
assert.deepEqual(invalidInputEngine.world.query([]), [originalEntity], 'Invalid seed must preserve current entities');
assert.throws(
  () => invalidInputEngine.initNewWorld({ template: 'unknown-template' as WorldTemplate, seed: 12, customDim: 24 }),
  /Mẫu thế giới không hợp lệ/,
  'Invalid template must be rejected before world reset'
);
assert.equal(invalidInputEngine.worldMap, originalMap, 'Invalid template must preserve the current map');
assert.deepEqual(invalidInputEngine.world.query([]), [originalEntity], 'Invalid template must preserve current entities');

assert.throws(() => new WorldMap(0, 1), /Kích thước thế giới phải là số nguyên/);
assert.throws(() => new WorldMap(501, 1), /Kích thước thế giới phải là số nguyên/);
assert.throws(() => new WorldMap(1.5, 2), /Kích thước thế giới phải là số nguyên/);

console.log('PASS world-startup: new worlds start with zero sentient beings for multiple seeds');
console.log('PASS world-startup: all templates are deterministic and produce valid tiles on small rectangular maps');
console.log('PASS world-startup: signature biome ratios hold for four templates across eight seeds');
console.log('PASS world-startup: every river component reaches lake or ocean across five templates and eight seeds');
console.log('PASS world-startup: invalid dimensions and seeds are rejected without replacing the current map');
