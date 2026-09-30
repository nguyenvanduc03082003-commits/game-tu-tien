import assert from 'node:assert/strict';
import {
  MAX_TRAVERSABLE_SLOPE,
  ELEVATION_BRUSH_STEP,
  clampElevation,
  isValidElevation,
  getElevationBand,
  getSlope,
  canTraverseSlope,
  getSlopeMoveFactor,
  getSlopePathCost,
  canTraverseDiagonalSlope,
  reconcileElevationForTerrain,
  calculateBaseTemperature
} from '../src/modules/world/ElevationRules.ts';
import { TerrainType } from '../src/config/terrains.config.ts';
import { getLocalSlopeMoveFactor } from '../src/modules/world/ElevationMovement.ts';

function testElevationRulesBoundaries(): void {
  // 1. clampElevation & isValidElevation
  assert.equal(clampElevation(0), 0);
  assert.equal(clampElevation(1), 1);
  assert.equal(clampElevation(-0.5), 0);
  assert.equal(clampElevation(1.5), 1);
  assert.equal(clampElevation(NaN), 0);
  assert.equal(clampElevation(Infinity), 0);
  assert.equal(clampElevation(-Infinity), 0);

  assert.equal(isValidElevation(0), true);
  assert.equal(isValidElevation(1), true);
  assert.equal(isValidElevation(0.5), true);
  assert.equal(isValidElevation(-0.01), false);
  assert.equal(isValidElevation(1.01), false);
  assert.equal(isValidElevation(NaN), false);
  assert.equal(isValidElevation(Infinity), false);
  assert.equal(isValidElevation('0.5'), false);
  assert.equal(isValidElevation(null), false);

  // 2. getElevationBand boundaries: <0.20, 0.20-<0.40, 0.40-<0.60, 0.60-<0.80, >=0.80
  assert.equal(getElevationBand(0.0), 'lowland');
  assert.equal(getElevationBand(0.199), 'lowland');
  assert.equal(getElevationBand(0.20), 'low');
  assert.equal(getElevationBand(0.399), 'low');
  assert.equal(getElevationBand(0.40), 'middle');
  assert.equal(getElevationBand(0.599), 'middle');
  assert.equal(getElevationBand(0.60), 'high');
  assert.equal(getElevationBand(0.799), 'high');
  assert.equal(getElevationBand(0.80), 'summit');
  assert.equal(getElevationBand(1.0), 'summit');

  // 3. Slope and traversal
  assert.equal(MAX_TRAVERSABLE_SLOPE, 0.20);
  assert.equal(getSlope(0.3, 0.5), 0.2);
  assert.equal(getSlope(0.5, 0.3), -0.2);
  assert.ok(Number.isNaN(getSlope(NaN, 0.5)));

  assert.equal(canTraverseSlope(0.3, 0.5), true);
  assert.equal(canTraverseSlope(0.3, 0.501), false);
  assert.equal(canTraverseSlope(0.5, 0.3), true);
  assert.equal(canTraverseSlope(0.5, 0.299), false);
  assert.equal(canTraverseSlope(NaN, 0.5), false);
  assert.equal(canTraverseSlope(0.5, Infinity), false);

  // 4. Move factors & path costs
  const flatFactor = getSlopeMoveFactor(0.3, 0.3);
  assert.equal(flatFactor, 1.0);
  assert.equal(getSlopePathCost(0.3, 0.3), 1.0);

  const uphillFactor = getSlopeMoveFactor(0.3, 0.5); // slope = +0.20
  assert.equal(uphillFactor, 0.5);
  const uphillCost = getSlopePathCost(0.3, 0.5);
  assert.equal(uphillCost, 2.0); // 1 / 0.5

  const downhillFactor = getSlopeMoveFactor(0.5, 0.3); // slope = -0.20
  assert.equal(downhillFactor, 1.2);
  const downhillCost = getSlopePathCost(0.5, 0.3);
  assert.ok(Math.abs(downhillCost - (1 / 1.2)) < 1e-9);

  // Uphill slower than downhill:
  assert.ok(uphillFactor < flatFactor);
  assert.ok(downhillFactor > flatFactor);
  assert.ok(uphillCost > downhillCost);

  // Blocked slope:
  assert.equal(getSlopeMoveFactor(0.2, 0.5), 0);
  assert.equal(getSlopePathCost(0.2, 0.5), Infinity);

  // 5. Diagonal movement slope
  assert.equal(canTraverseDiagonalSlope(0.3, 0.4, 0.35, 0.38), true);
  // Ortho 1 is cliff wall:
  assert.equal(canTraverseDiagonalSlope(0.3, 0.4, 0.55, 0.38), false);
  // Ortho 2 is cliff wall:
  assert.equal(canTraverseDiagonalSlope(0.3, 0.4, 0.35, 0.55), false);
  // Target itself is cliff wall:
  assert.equal(canTraverseDiagonalSlope(0.3, 0.6, 0.35, 0.38), false);

  // 6. reconcileElevationForTerrain
  // Painting Mountain over Lake (0.15) -> raised to mountain range (0.75)
  assert.equal(reconcileElevationForTerrain(TerrainType.MOUNTAIN, 0.15), 0.75);
  // Painting Lake over Mountain (0.85) -> lowered to lake range (0.20)
  assert.equal(reconcileElevationForTerrain(TerrainType.LAKE, 0.85), 0.20);
  // Painting Dense Forest over High Ground (0.75) -> forest stays 0.75!
  assert.equal(reconcileElevationForTerrain(TerrainType.DENSE_FOREST, 0.75), 0.75);
  // Painting Dense Forest over Ocean (0.05) -> raised to dry land (0.25)
  assert.equal(reconcileElevationForTerrain(TerrainType.DENSE_FOREST, 0.05), 0.25);
  // Painting River over Mountain (0.80) -> river can start on mountain (stays 0.80)
  assert.equal(reconcileElevationForTerrain(TerrainType.RIVER, 0.80), 0.80);

  // 7. calculateBaseTemperature
  // Higher elevation -> colder
  const seaTemp = calculateBaseTemperature(TerrainType.PLAIN, 0.1);
  const mountainTemp = calculateBaseTemperature(TerrainType.PLAIN, 0.8);
  assert.ok(mountainTemp < seaTemp);

  console.log('PASS elevation: ElevationRules boundary, slope, move factor, and reconciliation tests');
}

import { WorldMap } from '../src/modules/world/WorldMap.ts';
import { WorldGenerator } from '../src/modules/world/WorldGenerator.ts';
import { EventBus } from '../src/core/EventBus.ts';

function testWorldMapElevationMethods(): void {
  const map = new WorldMap(20, 20);

  // 1. setElevation edge cases
  assert.equal(map.setElevation(-1, 0, 0.5), false);
  assert.equal(map.setElevation(0, 20, 0.5), false);
  assert.equal(map.setElevation(0, 0, NaN), false);
  assert.equal(map.setElevation(0, 0, Infinity), false);

  // set valid elevation
  assert.equal(map.setElevation(5, 5, 0.7), true);
  const tile55 = map.getTile(5, 5)!;
  assert.equal(tile55.elevation, 0.7);
  // Temperature updated according to base formula
  assert.equal(tile55.temperature, calculateBaseTemperature(tile55.terrain, 0.7));
  assert.equal(map.getDirty(), true);

  // setting same elevation returns false
  map.setDirty(false);
  assert.equal(map.setElevation(5, 5, 0.7), false);
  assert.equal(map.getDirty(), false);

  // Cọ cao độ giữ mặt nước thấp và núi cao, không âm thầm đổi loại địa hình.
  map.setTerrain(1, 1, TerrainType.LAKE);
  map.applyElevationBrush(1, 1, 'raise', 0, 0.8);
  assert.equal(map.getTile(1, 1)!.elevation, 0.25);
  assert.equal(map.getTile(1, 1)!.terrain, TerrainType.LAKE);
  map.setTerrain(1, 1, TerrainType.OCEAN);
  assert.equal(map.setElevation(1, 1, 0.9), true);
  assert.ok(map.getTile(1, 1)!.elevation <= 0.18);
  map.setTerrain(2, 2, TerrainType.MOUNTAIN);
  map.applyElevationBrush(2, 2, 'lower', 0, 0.8);
  assert.ok(map.getTile(2, 2)!.elevation >= 0.65);

  // 2. applyElevationBrush: raise and lower
  let eventFired = false;
  const off = EventBus.getInstance().on('world:elevation_modified', (data: any) => {
    if (data.mode === 'raise') eventFired = true;
  });

  const raisedCount = map.applyElevationBrush(5, 5, 'raise', 2, 0.05);
  assert.ok(raisedCount > 0);
  assert.equal(eventFired, true);
  assert.ok(map.getTile(5, 5)!.elevation > 0.7);
  off();

  // lower brush
  const beforeLower = map.getTile(5, 5)!.elevation;
  map.applyElevationBrush(5, 5, 'lower', 2, 0.05);
  assert.ok(map.getTile(5, 5)!.elevation < beforeLower);

  // 3. applyElevationBrush: smooth is deterministic and reads from old snapshot
  // Setup known uneven pattern
  const mapA = new WorldMap(10, 10);
  const mapB = new WorldMap(10, 10);
  for (let y = 0; y < 10; y++) {
    for (let x = 0; x < 10; x++) {
      const e = (x * 0.1 + y * 0.05) % 1;
      mapA.setElevation(x, y, e);
      mapB.setElevation(x, y, e);
    }
  }

  // Smooth mapA and mapB with same brush
  mapA.applyElevationBrush(5, 5, 'smooth', 3, 0.02);
  mapB.applyElevationBrush(5, 5, 'smooth', 3, 0.02);

  for (let y = 0; y < 10; y++) {
    for (let x = 0; x < 10; x++) {
      assert.equal(mapA.getTile(x, y)!.elevation, mapB.getTile(x, y)!.elevation);
    }
  }

  console.log('PASS elevation: WorldMap.setElevation and applyElevationBrush (raise, lower, smooth)');
}

function testTerrainReconciliationAndGeneration(): void {
  const map = new WorldMap(20, 20);

  // 1. setTerrain reconciles elevation
  // Plain tile starts with ~0.3
  map.setElevation(2, 2, 0.1);
  map.setTerrain(2, 2, TerrainType.MOUNTAIN);
  // Mountain cannot have 0.1 -> reconciled to 0.75
  assert.equal(map.getTile(2, 2)!.elevation, 0.75);

  // Mountain tile has 0.8
  map.setTerrain(2, 2, TerrainType.LAKE);
  // Lake cannot have 0.8 -> reconciled to 0.20
  assert.equal(map.getTile(2, 2)!.elevation, 0.20);

  // Painting forest on high elevation (0.75) keeps elevation 0.75!
  map.setElevation(3, 3, 0.75);
  map.setTerrain(3, 3, TerrainType.DENSE_FOREST);
  assert.equal(map.getTile(3, 3)!.elevation, 0.75);

  // 2. WorldGenerator with same seed produces identical elevation and terrain
  const map1 = new WorldMap(30, 30);
  const map2 = new WorldMap(30, 30);
  WorldGenerator.generate(map1, 'thap_van_dai_son', 12345);
  WorldGenerator.generate(map2, 'thap_van_dai_son', 12345);

  for (let i = 0; i < 30 * 30; i++) {
    const t1 = map1.getTileByIndex(i)!;
    const t2 = map2.getTileByIndex(i)!;
    assert.equal(t1.terrain, t2.terrain);
    assert.equal(t1.elevation, t2.elevation);
    assert.equal(t1.temperature, t2.temperature);
  }

  console.log('PASS elevation: Terrain reconciliation and deterministic WorldGenerator elevation');
}

import { QiOverlayRenderer } from '../src/renderer/systems/QiOverlayRenderer.ts';
import { ELEVATION_BAND_NAMES } from '../src/modules/world/ElevationRules.ts';

function testOverlayRendererAndExclusion(): void {
  const overlay = new QiOverlayRenderer();

  // Initially all false
  assert.equal(overlay.showQi, false);
  assert.equal(overlay.showTemperature, false);
  assert.equal(overlay.showElevation, false);

  // Set elevation
  overlay.setOverlayMode('elevation');
  assert.equal(overlay.showElevation, true);
  assert.equal(overlay.showQi, false);
  assert.equal(overlay.showTemperature, false);

  // Set qi -> turns off elevation
  overlay.setOverlayMode('qi');
  assert.equal(overlay.showElevation, false);
  assert.equal(overlay.showQi, true);
  assert.equal(overlay.showTemperature, false);

  // Set temperature -> turns off qi
  overlay.setOverlayMode('temperature');
  assert.equal(overlay.showElevation, false);
  assert.equal(overlay.showQi, false);
  assert.equal(overlay.showTemperature, true);

  // Set none
  overlay.setOverlayMode('none');
  assert.equal(overlay.showElevation, false);
  assert.equal(overlay.showQi, false);
  assert.equal(overlay.showTemperature, false);

  // Band names check
  assert.equal(ELEVATION_BAND_NAMES.lowland, 'Vùng Trũng');
  assert.equal(ELEVATION_BAND_NAMES.low, 'Vùng Thấp');
  assert.equal(ELEVATION_BAND_NAMES.middle, 'Trung Bình');
  assert.equal(ELEVATION_BAND_NAMES.high, 'Vùng Cao');
  assert.equal(ELEVATION_BAND_NAMES.summit, 'Đỉnh Núi');

  console.log('PASS elevation: QiOverlayRenderer mutual exclusion and elevation band names');
}

import { ECSWorld } from '../src/ecs/World.ts';
import { AStarPathfinder } from '../src/modules/ai/pathfinding/AStar.ts';

function testAStarElevationSlope(): void {
  const world = new ECSWorld();
  const map = new WorldMap(15, 15);
  // Khởi tạo map bằng phẳng cao độ 0.20
  for (let y = 0; y < 15; y++) {
    for (let x = 0; x < 15; x++) {
      map.setElevation(x, y, 0.20);
    }
  }

  // 1. Tạo bức tường vách núi cao 0.80 tại cột x = 7, từ y = 2 đến y = 12
  // Để hở lối đi tại y = 13 (elev 0.20)
  for (let y = 2; y <= 12; y++) {
    map.setElevation(7, y, 0.80);
  }

  const startPx = { x: 3 * 16 + 8, y: 7 * 16 + 8 };
  const targetPx = { x: 11 * 16 + 8, y: 7 * 16 + 8 };

  // A* với enforceElevationSlope = false: đi thẳng xuyên qua vách núi
  const unconstrainedPath = AStarPathfinder.findPath(
    map,
    world,
    startPx,
    targetPx,
    true,
    1000,
    undefined,
    false,
    false
  );
  assert.ok(unconstrainedPath.length > 0);

  // A* với enforceElevationSlope = true: buộc phải đi vòng qua lối hở tại y >= 13
  const slopePath = AStarPathfinder.findPath(
    map,
    world,
    startPx,
    targetPx,
    true,
    1000,
    undefined,
    false,
    true
  );
  assert.ok(slopePath.length > 0);

  // Xác minh không có đoạn đường nào vượt qua vách x = 7 ở y <= 12
  for (const wp of slopePath) {
    const tx = Math.floor(wp.x / 16);
    const ty = Math.floor(wp.y / 16);
    const tile = map.getTile(tx, ty);
    assert.ok(tile);
    // Không bao giờ đứng trên vách núi 0.80
    assert.notEqual(tile.elevation, 0.80);
  }
  // Phải đi vòng xuống phía dưới (y >= 12)
  const maxWaypointY = Math.max(...slopePath.map(p => p.y / 16));
  assert.ok(maxWaypointY >= 12);

  // 2. Bao kín hoàn toàn: bịt kín lối đi tại x = 7 từ y = 0 đến y = 14
  for (let y = 0; y < 15; y++) {
    map.setElevation(7, y, 0.80);
  }
  const blockedPath = AStarPathfinder.findPath(
    map,
    world,
    startPx,
    targetPx,
    true,
    1000,
    undefined,
    false,
    true
  );
  // Báo không có đường khi bị bao kín
  assert.equal(blockedPath.length, 0);

  // 3. Fast direct raycast và Line of Sight
  // Đặt vật cản dốc giữa 2 điểm rất gần (cự ly 32px < 180px)
  const nearStart = { x: 1 * 16 + 8, y: 1 * 16 + 8 };
  const nearTarget = { x: 3 * 16 + 8, y: 1 * 16 + 8 };
  map.setElevation(2, 1, 0.80); // Vách giữa (1,1) và (3,1)

  // Với enforceElevationSlope = false: hasLineOfSight không chặn theo độ dốc (chỉ chặn tầm nhìn nếu có tường)
  const losVision = AStarPathfinder.hasLineOfSight(map, new Set(), nearStart, nearTarget, false, undefined, false, false);
  assert.equal(losVision, true);

  // Với enforceElevationSlope = true: hasLineOfSight chặn vì dốc không thể đi qua
  const losWalk = AStarPathfinder.hasLineOfSight(map, new Set(), nearStart, nearTarget, false, undefined, false, true);
  assert.equal(losWalk, false);

  // 4. Bước chéo không lách qua góc bị chặn (Diagonal corner cutting)
  const diagStart = { x: 1 * 16 + 8, y: 1 * 16 + 8 };
  const diagTarget = { x: 2 * 16 + 8, y: 2 * 16 + 8 };
  map.setElevation(1, 1, 0.20);
  map.setElevation(2, 2, 0.20);
  map.setElevation(1, 2, 0.80); // Vách góc 1
  map.setElevation(2, 1, 0.80); // Vách góc 2

  const losDiag = AStarPathfinder.hasLineOfSight(map, new Set(), diagStart, diagTarget, false, undefined, false, true);
  assert.equal(losDiag, false);

  console.log('PASS elevation: A* slope enforcement, detour around cliff, enclosed blocking, fast path, and diagonal safety');
}

import { AnimalMovement } from '../src/modules/animals/AnimalMovement.ts';
import { AnimalFactory } from '../src/modules/animals/AnimalFactory.ts';
import { PositionComponent } from '../src/modules/beings/BeingComponents.ts';
import { AnimalBrainComponent } from '../src/modules/animals/AnimalComponents.ts';

function testPhysicalMovementSlopeAndCliffProtection(): void {
  const ramp = new WorldMap(10, 4);
  for (let x = 0; x < ramp.width; x++) {
    ramp.setElevation(x, 1, Math.min(0.8, 0.2 + x * 0.1));
  }
  assert.ok(
    getLocalSlopeMoveFactor(ramp, 24, 24, 120, 24) < 1,
    'Waypoint xa không được che mất độ dốc của cạnh ngay phía trước'
  );
  const rampWorld = new ECSWorld();
  const rampAnimal = AnimalFactory.spawn(rampWorld, 'horse', 24, 24);
  const rampPos = rampWorld.getComponent(rampAnimal, PositionComponent)!;
  rampPos.speed = 20;
  AnimalMovement.moveTowards(rampWorld, ramp, rampAnimal, 120, 24, 1);
  assert.ok(rampPos.x < 44, 'Dốc dài phải làm chậm bước di chuyển thực tế đầu tiên');
  // 1. Tốc độ lên dốc thấp hơn đi trên đất bằng
  const worldFlat = new ECSWorld();
  const mapFlat = new WorldMap(10, 10);
  for (let i = 0; i < 100; i++) mapFlat.getTileByIndex(i)!.elevation = 0.20;
  const animalFlat = AnimalFactory.spawn(worldFlat, 'horse', 16, 32);
  const posFlat = worldFlat.getComponent(animalFlat, PositionComponent)!;
  posFlat.speed = 20;

  AnimalMovement.moveTowards(worldFlat, mapFlat, animalFlat, 80, 32, 1.0);
  const distFlat = posFlat.x - 16;

  const worldUphill = new ECSWorld();
  const mapUphill = new WorldMap(10, 10);
  for (let y = 0; y < 10; y++) {
    for (let x = 0; x < 10; x++) {
      mapUphill.setElevation(x, y, x > 1 ? 0.40 : 0.20); // Dốc +0.20 khi bước sang x=2
    }
  }
  const animalUphill = AnimalFactory.spawn(worldUphill, 'horse', 16, 32);
  const posUphill = worldUphill.getComponent(animalUphill, PositionComponent)!;
  posUphill.speed = 20;

  AnimalMovement.moveTowards(worldUphill, mapUphill, animalUphill, 80, 32, 1.0);
  const distUphill = posUphill.x - 16;

  assert.ok(distUphill < distFlat, `distUphill (${distUphill}) phải nhỏ hơn distFlat (${distFlat})`);

  // 2. Không vượt dốc bị chặn ở dt lớn (vd: dt = 5.0 khi chạy 50x)
  const worldCliff = new ECSWorld();
  const mapCliff = new WorldMap(10, 10);
  for (let i = 0; i < 100; i++) mapCliff.getTileByIndex(i)!.elevation = 0.20;
  // Dựng vách tại x = 3 cao 0.80
  for (let y = 0; y < 10; y++) mapCliff.setElevation(3, y, 0.80);

  const animalFast = AnimalFactory.spawn(worldCliff, 'horse', 1 * 16 + 8, 3 * 16 + 8);
  const posFast = worldCliff.getComponent(animalFast, PositionComponent)!;
  posFast.speed = 30;

  // Cố gắng bước tới x = 6 (qua x = 3 là vách) với dt = 3 giây (bước dự kiến 90px vượt xa 1 tile 16px)
  const result = AnimalMovement.moveTowards(worldCliff, mapCliff, animalFast, 6 * 16 + 8, 3 * 16 + 8, 3.0);
  assert.equal(result, 'blocked');
  // Thực thể không được vượt qua vách tại x = 3
  assert.ok(posFast.x < 3 * 16, `pos.x (${posFast.x}) phải ở trước vách x=3 (48px)`);

  // 3. Khi cọ tạo vách trên đường cũ, đường cũ bị vô hiệu
  const worldBrush = new ECSWorld();
  const mapBrush = new WorldMap(10, 10);
  for (let i = 0; i < 100; i++) mapBrush.getTileByIndex(i)!.elevation = 0.20;

  const animalPathed = AnimalFactory.spawn(worldBrush, 'horse', 1 * 16 + 8, 3 * 16 + 8);
  const brainPathed = worldBrush.getComponent(animalPathed, AnimalBrainComponent)!;
  // Tính đường hợp lệ ban đầu
  AnimalMovement.moveTowards(worldBrush, mapBrush, animalPathed, 6 * 16 + 8, 3 * 16 + 8, 0.1);
  assert.ok(brainPathed.path.length > 0);

  // Người chơi dùng cọ tạo vách ngay trên đường đi tại (3, 3)
  mapBrush.applyElevationBrush(3, 3, 'raise', 1, 0.60);
  assert.ok(mapBrush.getTile(3, 3)!.elevation >= 0.70);

  // Bước tiếp theo gặp vách -> hủy đường đi cũ và đưa về trạng thái idle / blocked
  const resBrush = AnimalMovement.moveTowards(worldBrush, mapBrush, animalPathed, 6 * 16 + 8, 3 * 16 + 8, 0.5);
  assert.equal(resBrush, 'blocked');
  assert.equal(brainPathed.path.length, 0);

  console.log('PASS elevation: Physical movement slope factor, large-dt cliff blocking, and dynamic path invalidation');
}

import { SaveManager, CURRENT_SAVE_VERSION } from '../src/modules/save/SaveManager.ts';
import { TimeManager } from '../src/core/TimeManager.ts';
import { SpatialGrid } from '../src/core/SpatialGrid.ts';
import { QiGrid } from '../src/modules/energy/QiGrid.ts';

function createSaveTestEngine(): any {
  const world = new ECSWorld();
  const worldMap = new WorldMap(6, 6);
  const qiGrid = new QiGrid(6, 6);
  const spatialGrid = new SpatialGrid(32);

  return {
    world,
    worldMap,
    qiGrid,
    spatialGrid,
    camera: { x: 32, y: 48, zoom: 1.0 },
    timeManager: TimeManager.getInstance(),
    worldName: 'Elevation Save Test',
    worldTemplate: 'thap_van_dai_son',
    worldSeed: 12345,
  };
}

function testElevationSaveLoadAndCorruptRejection(): void {
  const srcEngine = createSaveTestEngine();
  // Set varied elevations
  for (let i = 0; i < 36; i++) {
    const elev = Math.round(((i / 35)) * 100) / 100;
    srcEngine.worldMap.getTileByIndex(i)!.elevation = elev;
  }

  // 1. Serialize
  const saveData = SaveManager.serializeWorld(srcEngine, 'Elevation Save Test');
  assert.equal(saveData.metadata.version, CURRENT_SAVE_VERSION);
  assert.equal(saveData.worldMap.tiles.length, 36);

  // 2. Deserialize into new engine
  const dstEngine = createSaveTestEngine();
  SaveManager.deserializeWorld(dstEngine, saveData);

  for (let i = 0; i < 36; i++) {
    const srcElev = srcEngine.worldMap.getTileByIndex(i)!.elevation;
    const dstElev = dstEngine.worldMap.getTileByIndex(i)!.elevation;
    assert.ok(Math.abs(srcElev - dstElev) <= 0.0101, `Tile ${i} elevation mismatch: src=${srcElev}, dst=${dstElev}`);
  }

  // 3. Strict validation: corrupt elevation (NaN, negative, > 100)
  const snapshotBefore = dstEngine.worldMap.getTileByIndex(0)!.elevation;

  // 3a. NaN
  const corruptNaN = JSON.parse(JSON.stringify(saveData));
  corruptNaN.worldMap.tiles[5][1] = NaN;
  assert.throws(() => {
    SaveManager.validateSaveData(corruptNaN);
  }, /Cao độ ô thứ 5 không hợp lệ/);
  assert.throws(() => {
    SaveManager.deserializeWorld(dstEngine, corruptNaN);
  });
  assert.equal(dstEngine.worldMap.getTileByIndex(0)!.elevation, snapshotBefore);

  // 3b. Negative elevation
  const corruptNeg = JSON.parse(JSON.stringify(saveData));
  corruptNeg.worldMap.tiles[10][1] = -10;
  assert.throws(() => {
    SaveManager.validateSaveData(corruptNeg);
  }, /Cao độ ô thứ 10 không hợp lệ/);
  assert.throws(() => {
    SaveManager.deserializeWorld(dstEngine, corruptNeg);
  });
  assert.equal(dstEngine.worldMap.getTileByIndex(0)!.elevation, snapshotBefore);

  // 3c. Elevation > 100
  const corruptHigh = JSON.parse(JSON.stringify(saveData));
  corruptHigh.worldMap.tiles[15][1] = 120;
  assert.throws(() => {
    SaveManager.validateSaveData(corruptHigh);
  }, /Cao độ ô thứ 15 không hợp lệ/);
  assert.throws(() => {
    SaveManager.deserializeWorld(dstEngine, corruptHigh);
  });
  assert.equal(dstEngine.worldMap.getTileByIndex(0)!.elevation, snapshotBefore);

  console.log('PASS elevation: Save/load roundtrip, strict validation, and staging integrity');
}

function testTemplatesAndPerformance360x360(): void {
  const templates: WorldTemplate[] = [
    'random',
    'thap_van_dai_son',
    'dong_bang_trung_tho',
    'ma_vuc_dam_lay',
    'hai_dao_tien_son'
  ];

  for (const t of templates) {
    const map = new WorldMap(40, 40);
    WorldGenerator.generate(map, t, 999);
    for (let i = 0; i < 40 * 40; i++) {
      const tile = map.getTileByIndex(i)!;
      assert.ok(isValidElevation(tile.elevation), `Template ${t} tile ${i} elevation invalid: ${tile.elevation}`);
      assert.ok(Number.isFinite(tile.temperature), `Template ${t} tile ${i} temp invalid: ${tile.temperature}`);
      assert.ok(Number.isFinite(tile.moisture), `Template ${t} tile ${i} moist invalid: ${tile.moisture}`);
    }
  }

  // Microbenchmark riêng cho hàm di chuyển; không đại diện cho toàn bộ AI/render.
  const bigMap = new WorldMap(360, 360);
  WorldGenerator.generate(bigMap, 'thap_van_dai_son', 42);
  for (const tile of bigMap.getAllTiles()) tile.terrain = TerrainType.PLAIN;
  const bigWorld = new ECSWorld();

  const animalIds: number[] = [];
  for (let i = 0; i < 300; i++) {
    const x = 30 + (i % 25) * 16;
    const y = 30 + Math.floor(i / 25) * 16;
    const id = AnimalFactory.spawn(bigWorld, 'wolf', x, y);
    animalIds.push(id);
  }

  // Benchmark movement step with elevation slope enforcement for 300 animals
  const t0 = performance.now();
  let successfulMoves = 0;
  for (let step = 0; step < 5; step++) {
    for (let i = 0; i < animalIds.length; i++) {
      const id = animalIds[i];
      const pos = bigWorld.getComponent(id, PositionComponent)!;
      if (AnimalMovement.moveTowards(bigWorld, bigMap, id, pos.x + 32, pos.y + 16, 0.1) === 'moving') {
        successfulMoves++;
      }
    }
  }
  const totalMs = performance.now() - t0;
  assert.ok(successfulMoves > 100, `Benchmark cần thực sự di chuyển, hiện chỉ có ${successfulMoves} lượt`);
  assert.ok(totalMs < 1500, `Performance too slow: ${totalMs.toFixed(2)}ms for 1500 animal moveTowards calls on 360x360 map`);

  console.log(`PASS elevation: templates and movement-only microbenchmark (${successfulMoves}/1500 moving, ${totalMs.toFixed(2)}ms)`);
}

import { BehaviorTreeExecutor } from '../src/modules/ai/brain/behavior/BehaviorTree.ts';
import { AIBehaviorTreeComponent, AIPlannerComponent } from '../src/modules/ai/brain/AIComponents.ts';
import { CharacterStateComponent } from '../src/modules/beings/BeingComponents.ts';
import { WeatherSystem } from '../src/modules/weather/WeatherSystem.ts';

function testDodgeRespectsCliffs(): void {
  const map = new WorldMap(12, 6);
  for (let y = 0; y < map.height; y++) map.setElevation(3, y, 0.8);
  const world = new ECSWorld();
  const entity = world.createEntity();
  const position = world.addComponent(entity, new PositionComponent(24, 40, 100));
  world.addComponent(entity, new CharacterStateComponent());
  const brain = new AIBehaviorTreeComponent();
  const planner = new AIPlannerComponent();
  planner.planStatus = 'executing';
  brain.isDodging = true;
  brain.dodgeTimer = 1;
  brain.dodgeVector = { x: 1, y: 0 };

  BehaviorTreeExecutor.tick(world, entity, brain, planner, map, 0.5);
  assert.equal(position.x, 24, 'Né đòn không vượt qua vách dù dt lớn');
  assert.equal(brain.isDodging, false);

  map.setElevation(3, 2, 0.3);
  brain.isDodging = true;
  brain.dodgeTimer = 1;
  BehaviorTreeExecutor.tick(world, entity, brain, planner, map, 0.05);
  assert.ok(position.x > 24, 'Né đòn vẫn hoạt động khi đường đi hợp lệ');
  console.log('PASS elevation: active dodge respects cliffs and valid ground movement');
}

function testWeatherKeepsElevationTemperature(): void {
  const map = new WorldMap(4, 4);
  map.setElevation(1, 1, 0.2);
  map.setElevation(2, 1, 0.8);
  const weather = new WeatherSystem(map);
  weather.restoreState({ currentWeather: 'clear', weatherDuration: 1_000_000 });
  const world = new ECSWorld();
  for (let i = 0; i < 100; i++) weather.update(world, 0.5);
  const low = map.getTile(1, 1)!.temperature;
  const high = map.getTile(2, 1)!.temperature;
  assert.ok(low > high + 4, `Ô thấp (${low}) phải ấm hơn ô cao (${high}) sau nhiều tick thời tiết`);
  weather.destroy();
  console.log('PASS elevation: weather retains altitude-dependent temperature');
}

testElevationRulesBoundaries();
testWorldMapElevationMethods();
testTerrainReconciliationAndGeneration();
testOverlayRendererAndExclusion();
testAStarElevationSlope();
testPhysicalMovementSlopeAndCliffProtection();
testElevationSaveLoadAndCorruptRejection();
testTemplatesAndPerformance360x360();
testDodgeRespectsCliffs();
testWeatherKeepsElevationTemperature();
