import { calculatePlantGrowth } from './TerrainEnvironment.ts';
import { WorldMap } from './WorldMap.ts';
import { TerrainType, TERRAIN_CONFIGS } from '../../config/terrains.config.ts';
import { SeededRNG } from '../../core/SeededRNG.ts';
import { calculateBaseTemperature } from './ElevationRules.ts';

// Triển khai thuật toán Perlin 2D Gradient Noise gọn nhẹ, không phụ thuộc thư viện ngoài
class PerlinNoise2D {
  private p: number[] = new Array(512);

  constructor(rng: SeededRNG) {
    const permutation: number[] = [];
    for (let i = 0; i < 256; i++) {
      permutation[i] = i;
    }
    // Trộn ngẫu nhiên
    for (let i = 255; i > 0; i--) {
      const j = rng.nextInt(0, i);
      const temp: number = permutation[i];
      permutation[i] = permutation[j];
      permutation[j] = temp;
    }
    for (let i = 0; i < 512; i++) {
      this.p[i] = permutation[i & 255];
    }
  }

  private fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  private lerp(t: number, a: number, b: number): number {
    return a + t * (b - a);
  }

  private grad(hash: number, x: number, y: number): number {
    const h = hash & 3;
    const u = h < 2 ? x : y;
    const v = h < 2 ? y : x;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }

  public noise(x: number, y: number): number {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;

    x -= Math.floor(x);
    y -= Math.floor(y);

    const u = this.fade(x);
    const v = this.fade(y);

    const A = this.p[X] + Y;
    const B = this.p[X + 1] + Y;

    return this.lerp(
      v,
      this.lerp(u, this.grad(this.p[A], x, y), this.grad(this.p[B], x - 1, y)),
      this.lerp(u, this.grad(this.p[A + 1], x, y - 1), this.grad(this.p[B + 1], x - 1, y - 1))
    );
  }

  public octaveNoise(x: number, y: number, octaves: number, persistence: number): number {
    let total = 0;
    let frequency = 1;
    let amplitude = 1;
    let maxValue = 0;

    for (let i = 0; i < octaves; i++) {
      total += this.noise(x * frequency, y * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= 2;
    }

    return (total / maxValue + 1) / 2; // Chuẩn hóa về [0..1]
  }
}

export type WorldTemplate = 'random' | 'thap_van_dai_son' | 'dong_bang_trung_tho' | 'ma_vuc_dam_lay' | 'hai_dao_tien_son';
export const WORLD_TEMPLATES: readonly WorldTemplate[] = [
  'random',
  'thap_van_dai_son',
  'dong_bang_trung_tho',
  'ma_vuc_dam_lay',
  'hai_dao_tien_son',
];

export function isWorldTemplate(value: unknown): value is WorldTemplate {
  return typeof value === 'string' && WORLD_TEMPLATES.includes(value as WorldTemplate);
}

export class WorldGenerator {
  public static generate(worldMap: WorldMap, template: WorldTemplate = 'random', seed: number = Date.now()): void {
    if (!isWorldTemplate(template)) {
      throw new RangeError(`Mẫu thế giới không hợp lệ: ${String(template)}.`);
    }
    if (!Number.isSafeInteger(seed)) {
      throw new RangeError('Seed thế giới phải là số nguyên an toàn.');
    }

    const rng = new SeededRNG(seed);
    const elevNoise = new PerlinNoise2D(rng);
    const moistNoise = new PerlinNoise2D(new SeededRNG(seed + 9999));
    const riverNoise = new PerlinNoise2D(new SeededRNG(seed + 44444));

    const w = worldMap.width;
    const h = worldMap.height;

    const randomCoordinate = (size: number, preferredMargin: number): number => {
      const margin = Math.min(preferredMargin, Math.floor((size - 1) / 2));
      return rng.nextInt(margin, size - 1 - margin);
    };

    // Chọn phong cách biển đại dương cho template 'random'
    // 0 = Đông Hải (bờ đông), 1 = Nam Hải (bờ nam), 2 = Quần đảo giữa biển, 3 = Nội lục
    const oceanStyle = template === 'hai_dao_tien_son' ? 2 : (template === 'random' ? rng.nextInt(0, 3) : 0);

    // Tỷ lệ hóa tần số noise theo kích thước bản đồ để tạo lục địa rộng lớn
    const noiseScale = Math.max(30, Math.min(65, Math.floor(w / 6)));

    // =========================================================================
    // BƯỚC 1: TẠO ĐỘ CAO (ELEVATION), ĐỘ ẨM (MOISTURE) VÀ ĐỊA HÌNH CƠ BẢN
    // =========================================================================
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const nx = x / noiseScale;
        const ny = y / noiseScale;

        let elevation = elevNoise.octaveNoise(nx, ny, 4, 0.5);
        let moisture = moistNoise.octaveNoise(nx + 10, ny + 10, 3, 0.5);

        // Áp dụng template đặc thù
        if (template === 'thap_van_dai_son') {
          // Nhiều núi non trùng điệp
          elevation = Math.pow(elevation, 0.7);
        } else if (template === 'dong_bang_trung_tho') {
          // Đồng bằng phì nhiêu rộng lớn, bờ đông là biển
          elevation = elevation * 0.6;
          moisture = moisture * 0.9 + 0.1;
        } else if (template === 'ma_vuc_dam_lay') {
          // Nhiều đầm lầy, ẩm ướt trũng thấp
          elevation = elevation * 0.5;
          moisture = Math.min(1.0, moisture * 1.4);
        } else if (template === 'hai_dao_tien_son') {
          // Quần đảo tiên sơn: Trung tâm là các đảo tiên, xung quanh là biển khơi bao bọc
          const distCenter = Math.hypot(x - w / 2, y - h / 2) / (w * 0.5);
          elevation = elevation * 1.25 - Math.pow(distCenter, 1.8) * 0.75;
          moisture = Math.min(1.0, moisture + 0.2);
        }

        // Tạo bờ biển đại dương (Ocean Coastline) theo tỷ lệ bản đồ
        const coastWidth = Math.max(18, Math.floor(w * 0.12));
        if (oceanStyle === 0) {
          // Bờ Đông là đại dương (Đông Hải)
          const coastLine = (w - coastWidth) + (elevNoise.noise(ny * 2, 0) * (coastWidth * 0.5));
          if (x > coastLine) {
            const depth = (x - coastLine) / coastWidth;
            elevation -= depth * 0.45;
          }
        } else if (oceanStyle === 1) {
          // Bờ Nam là đại dương (Nam Hải)
          const coastLine = (h - coastWidth) + (elevNoise.noise(0, nx * 2) * (coastWidth * 0.5));
          if (y > coastLine) {
            const depth = (y - coastLine) / coastWidth;
            elevation -= depth * 0.45;
          }
        } else if (oceanStyle === 2) {
          // Biển bao bọc 4 phía
          const distCenter = Math.hypot(x - w / 2, y - h / 2) / (w * 0.52);
          if (distCenter > 0.8) {
            elevation -= (distCenter - 0.8) * 0.9;
          }
        }

        // Quyết định loại địa hình dựa trên (elevation, moisture)
        let terrain: TerrainType;

        if (elevation < 0.18) {
          // Vùng ngập nước sâu: Biển Cả (Ocean)
          terrain = TerrainType.OCEAN;
        } else if (elevation < 0.23 && moisture > 0.6) {
          // Vùng trũng sát biển hoặc hồ ngập nước: Hồ Nước (Lake)
          terrain = TerrainType.LAKE;
        } else if (template === 'ma_vuc_dam_lay' && elevation < 0.42 && moisture > 0.5) {
          // Giữ riêng một dải đất ngập nước rộng; điều kiện địa hình chung trước đây
          // chỉ tạo rất ít ô đầm lầy cho mẫu này vì phần lớn vùng ẩm bị phân thành rừng.
          terrain = TerrainType.SWAMP;
        } else if (elevation > 0.68) {
          terrain = TerrainType.MOUNTAIN;
        } else if (elevation > 0.55) {
          terrain = moisture < 0.4 ? TerrainType.PLATEAU : TerrainType.HILL;
        } else if (elevation > 0.42) {
          terrain = moisture > 0.55 ? TerrainType.DENSE_FOREST : TerrainType.HILL;
        } else if (elevation > 0.22) {
          if (moisture > 0.65) {
            terrain = TerrainType.DENSE_FOREST;
          } else if (moisture < 0.25) {
            terrain = TerrainType.PLATEAU;
          } else {
            terrain = TerrainType.PLAIN;
          }
        } else {
          // Vùng trũng thấp nội địa
          terrain = moisture > 0.45 ? TerrainType.SWAMP : TerrainType.PLAIN;
        }

        const tile = worldMap.getTile(x, y);
        if (tile) {
          tile.terrain = terrain;
          tile.elevation = Math.max(0, Math.min(1.0, elevation));
          tile.moisture = Math.max(0, Math.min(1.0, moisture));
          tile.variant = rng.nextInt(0, 3);
        }
      }
    }

    // =========================================================================
    // BƯỚC 2: TẠO CÁC HỒ NƯỚC NỘI ĐỊA (INLAND LAKES) TỶ LỆ THEO DIỆN TÍCH
    // =========================================================================
    const areaFactor = (w * h) / 10000;
    const numLakes = Math.max(2, Math.min(25, Math.round(rng.nextInt(2, 4) * areaFactor)));
    for (let l = 0; l < numLakes; l++) {
      // Tìm vị trí đất trũng hoặc đồng bằng / rừng để tạo hồ nước hữu tình
      // Cho phép sinh hồ trên cả bản đồ nhỏ; vùng vẽ hồ được cắt theo biên ở dưới.
      const lcx = rng.nextInt(0, w - 1);
      const lcy = rng.nextInt(0, h - 1);
      const centerTile = worldMap.getTile(lcx, lcy);

      // Tránh đặt hồ giữa biển hoặc đỉnh núi cao chót vót
      if (!centerTile || centerTile.terrain === TerrainType.OCEAN || centerTile.terrain === TerrainType.MOUNTAIN) {
        continue;
      }

      const lakeRadius = rng.nextInt(3, Math.min(12, Math.floor(4 + areaFactor)));

      for (let dy = -lakeRadius - 2; dy <= lakeRadius + 2; dy++) {
        for (let dx = -lakeRadius - 2; dx <= lakeRadius + 2; dx++) {
          const tx = lcx + dx;
          const ty = lcy + dy;
          if (!worldMap.isInBounds(tx, ty)) continue;

          const dist = Math.hypot(dx, dy);
          // Nhiễu mép bờ hồ để tạo đường cong tự nhiên
          const noiseOffset = riverNoise.noise(tx * 0.25, ty * 0.25) * 2.2;
          if (dist <= lakeRadius + noiseOffset) {
            const tile = worldMap.getTile(tx, ty);
            if (tile && tile.terrain !== TerrainType.OCEAN) {
              tile.terrain = TerrainType.LAKE;
              tile.moisture = 1.0;
              tile.elevation = Math.min(tile.elevation, 0.20);
            }
          }
        }
      }
    }

    // Bảo đảm có điểm nhận nước để các nhánh sông không kết thúc giữa đất liền.
    const tileCount = w * h;
    let waterTileCount = 0;
    let lowestLandIndex = -1;
    let lowestLandElevation = Infinity;
    for (let i = 0; i < tileCount; i++) {
      const tile = worldMap.getTileByIndex(i);
      if (!tile) continue;
      if (tile.terrain === TerrainType.OCEAN || tile.terrain === TerrainType.LAKE) {
        waterTileCount++;
      } else if (tile.elevation < lowestLandElevation) {
        lowestLandElevation = tile.elevation;
        lowestLandIndex = i;
      }
    }
    if (waterTileCount === 0 && lowestLandIndex >= 0 && tileCount > 1) {
      const basin = worldMap.getTileByIndex(lowestLandIndex)!;
      basin.terrain = TerrainType.LAKE;
      basin.elevation = Math.min(basin.elevation, 0.20);
      basin.moisture = 1;
    }

    // Tính khoảng cách 8 hướng từ mọi ô đến thủy vực gần nhất.
    // Đường sông luôn giảm khoảng cách này nên không thể lặp vòng hoặc cụt giữa đất liền.
    const distanceToWater = new Int32Array(tileCount);
    distanceToWater.fill(-1);
    const waterQueue = new Int32Array(tileCount);
    let queueRead = 0;
    let queueWrite = 0;
    for (let i = 0; i < tileCount; i++) {
      const tile = worldMap.getTileByIndex(i);
      if (tile && (tile.terrain === TerrainType.OCEAN || tile.terrain === TerrainType.LAKE)) {
        distanceToWater[i] = 0;
        waterQueue[queueWrite++] = i;
      }
    }
    const flowDirections = [
      { dx: 1, dy: 0 }, { dx: -1, dy: 0 }, { dx: 0, dy: 1 }, { dx: 0, dy: -1 },
      { dx: 1, dy: 1 }, { dx: -1, dy: 1 }, { dx: 1, dy: -1 }, { dx: -1, dy: -1 }
    ];
    while (queueRead < queueWrite) {
      const index = waterQueue[queueRead++];
      const x = index % w;
      const y = Math.floor(index / w);
      for (const dir of flowDirections) {
        const nx = x + dir.dx;
        const ny = y + dir.dy;
        if (!worldMap.isInBounds(nx, ny)) continue;
        const neighborIndex = ny * w + nx;
        if (distanceToWater[neighborIndex] >= 0) continue;
        distanceToWater[neighborIndex] = distanceToWater[index] + 1;
        waterQueue[queueWrite++] = neighborIndex;
      }
    }

    // =========================================================================
    // BƯỚC 3: TẠO CÁC DÒNG SÔNG UỐN LƯỢN (MEANDERING RIVERS) TỶ LỆ THEO DIỆN TÍCH
    // =========================================================================
    const numRivers = Math.max(2, Math.min(18, Math.round(rng.nextInt(2, 3) * areaFactor)));
    for (let r = 0; r < numRivers; r++) {
      // Tìm điểm nguồn trên đồi / núi cao
      let startX = -1;
      let startY = -1;
      let maxSearchAttempts = 40;

      while (maxSearchAttempts-- > 0) {
        const testX = randomCoordinate(w, 10);
        const testY = randomCoordinate(h, 10);
        const t = worldMap.getTile(testX, testY);
        const testIndex = testY * w + testX;
        if (t && distanceToWater[testIndex] > 0 &&
            (t.terrain === TerrainType.MOUNTAIN || t.terrain === TerrainType.HILL)) {
          startX = testX;
          startY = testY;
          break;
        }
      }

      if (startX === -1) {
        let fallbackAttempts = 40;
        while (fallbackAttempts-- > 0) {
          const testX = rng.nextInt(0, w - 1);
          const testY = rng.nextInt(0, h - 1);
          if (distanceToWater[testY * w + testX] > 0) {
            startX = testX;
            startY = testY;
            break;
          }
        }
      }

      if (startX < 0 || startY < 0) continue;

      // Theo dốc khoảng cách đến nước; nếu có nhiều hướng, ưu tiên ô thấp và nhiễu nhẹ.
      let cx = startX;
      let cy = startY;
      let currentIndex = cy * w + cx;
      const maxRiverSteps = tileCount;

      for (let step = 0; step < maxRiverSteps && distanceToWater[currentIndex] > 0; step++) {
        const currentTile = worldMap.getTile(cx, cy);
        if (!currentTile) break;
        currentTile.terrain = TerrainType.RIVER;
        currentTile.moisture = 1.0;

        const currentDistance = distanceToWater[currentIndex];
        let bestX = -1;
        let bestY = -1;
        let bestScore = Infinity;
        for (const dir of flowDirections) {
          const nx = cx + dir.dx;
          const ny = cy + dir.dy;
          if (!worldMap.isInBounds(nx, ny)) continue;
          const nextIndex = ny * w + nx;
          if (distanceToWater[nextIndex] !== currentDistance - 1) continue;
          const nextTile = worldMap.getTile(nx, ny);
          if (!nextTile || nextTile.terrain === TerrainType.OCEAN || nextTile.terrain === TerrainType.LAKE) {
            bestX = nx;
            bestY = ny;
            break;
          }
          const score = nextTile.elevation + riverNoise.noise(nx * 0.15, ny * 0.15) * 0.025;
          if (score < bestScore) {
            bestScore = score;
            bestX = nx;
            bestY = ny;
          }
        }
        if (bestX < 0) break;
        cx = bestX;
        cy = bestY;
        currentIndex = cy * w + cx;
      }
    }

    // =========================================================================
    // BƯỚC 4: HOÀN THIỆN ĐẶC TÍNH TỪNG Ô ĐẤT THEO LOẠI ĐỊA HÌNH
    // =========================================================================
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const tile = worldMap.getTile(x, y);
        if (!tile) continue;

        const config = TERRAIN_CONFIGS[tile.terrain];
        tile.temperature = calculateBaseTemperature(tile.terrain, tile.elevation); // Càng lên cao càng lạnh
        tile.qiDensity = Math.floor(config.baseQiDensity * (0.8 + tile.elevation * 0.5));
        tile.plantGrowth = calculatePlantGrowth(tile.terrain, tile.moisture);
      }
    }

    worldMap.setDirty(true);
  }
}
