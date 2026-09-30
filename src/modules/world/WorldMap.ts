import { calculatePlantGrowth } from './TerrainEnvironment.ts';
import { TerrainType, TERRAIN_CONFIGS } from '../../config/terrains.config.ts';
import { EventBus } from '../../core/EventBus.ts';
import {
  clampElevation,
  ELEVATION_BRUSH_STEP,
  TERRAIN_ELEVATION_BOUNDS,
  calculateBaseTemperature,
  reconcileElevationForTerrain
} from './ElevationRules.ts';

export interface WorldTile {
  x: number;
  y: number;
  terrain: TerrainType;
  elevation: number;    // [0..1]
  moisture: number;     // [0..1]
  temperature: number;  // °C
  qiDensity: number;    // Nồng độ linh khí
  plantGrowth: number;  // Tỷ lệ sinh trưởng cây cối
  variant: number;      // 0..3 để đa dạng hóa pixel art tile
}

/** Largest map dimension supported by the in-game world size presets. */
export const MAX_WORLD_DIMENSION = 500;

export function assertValidWorldDimensions(width: number, height: number): void {
  if (!Number.isInteger(width) || !Number.isInteger(height) ||
      width < 1 || height < 1 ||
      width > MAX_WORLD_DIMENSION || height > MAX_WORLD_DIMENSION) {
    throw new RangeError(`Kích thước thế giới phải là số nguyên từ 1 đến ${MAX_WORLD_DIMENSION} ô mỗi chiều.`);
  }
}

export class WorldMap {
  public readonly width: number;
  public readonly height: number;
  public readonly tileSize: number = 16; // 16x16 pixel mỗi ô

  private tiles: WorldTile[];
  private isDirty: boolean = true;
  private eventBus = EventBus.getInstance();

  public get widthPixels(): number {
    return this.width * this.tileSize;
  }

  public get heightPixels(): number {
    return this.height * this.tileSize;
  }

  constructor(width: number = 360, height: number = 360) {
    assertValidWorldDimensions(width, height);
    this.width = width;
    this.height = height;
    this.tiles = new Array(width * height);

    // Khởi tạo mặc định toàn bộ là Đồng Bằng
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        const config = TERRAIN_CONFIGS[TerrainType.PLAIN];
        this.tiles[idx] = {
          x,
          y,
          terrain: TerrainType.PLAIN,
          elevation: 0.3,
          moisture: 0.5,
          temperature: calculateBaseTemperature(TerrainType.PLAIN, 0.3),
          qiDensity: config.baseQiDensity,
          plantGrowth: calculatePlantGrowth(TerrainType.PLAIN, 0.5),
          variant: (x * 7 + y * 13) % 4
        };
      }
    }
  }

  public isInBounds(x: number, y: number): boolean {
    return x >= 0 && x < this.width && y >= 0 && y < this.height;
  }

  public getTile(x: number, y: number): WorldTile | null {
    if (!this.isInBounds(x, y)) return null;
    return this.tiles[y * this.width + x];
  }

  public getTileByIndex(index: number): WorldTile | null {
    if (index < 0 || index >= this.tiles.length) return null;
    return this.tiles[index];
  }

  public setTerrain(x: number, y: number, terrain: TerrainType): boolean {
    const tile = this.getTile(x, y);
    if (!tile) return false;
    if (tile.terrain === terrain) {
      return this.setElevation(x, y, reconcileElevationForTerrain(terrain, tile.elevation));
    }

    const temperatureOffset = tile.temperature - calculateBaseTemperature(tile.terrain, tile.elevation);
    tile.terrain = terrain;
    tile.elevation = reconcileElevationForTerrain(terrain, tile.elevation);
    const config = TERRAIN_CONFIGS[terrain];
    tile.temperature = calculateBaseTemperature(terrain, tile.elevation) + temperatureOffset;
    tile.qiDensity = config.baseQiDensity;
    tile.plantGrowth = calculatePlantGrowth(terrain, tile.moisture);
    tile.variant = Math.floor(Math.random() * 4);

    this.isDirty = true;
    return true;
  }

  /**
   * Thiết lập độ cao cho ô cụ thể (có kiểm tra biên, hữu hạn và cập nhật nhiệt độ nền)
   */
  public setElevation(x: number, y: number, elevation: number): boolean {
    if (!this.isInBounds(x, y)) return false;
    if (!Number.isFinite(elevation)) return false;
    const tile = this.getTile(x, y);
    if (!tile) return false;

    let clamped = clampElevation(elevation);
    // Cọ cao độ không tự biến nước thành đất hay núi thành thung lũng.
    if (tile.terrain === TerrainType.OCEAN || tile.terrain === TerrainType.LAKE) {
      clamped = Math.min(clamped, TERRAIN_ELEVATION_BOUNDS[tile.terrain].max);
    } else if (tile.terrain === TerrainType.MOUNTAIN) {
      clamped = Math.max(clamped, TERRAIN_ELEVATION_BOUNDS[TerrainType.MOUNTAIN].min);
    }
    if (Math.abs(tile.elevation - clamped) < 1e-4) return false;

    const temperatureOffset = tile.temperature - calculateBaseTemperature(tile.terrain, tile.elevation);
    tile.elevation = clamped;
    tile.temperature = calculateBaseTemperature(tile.terrain, tile.elevation) + temperatureOffset;
    this.isDirty = true;
    return true;
  }

  /**
   * Dùng cọ vẽ của Thượng Đế tác động lên bán kính xung quanh
   */
  public applyBrush(centerX: number, centerY: number, terrain: TerrainType, radius: number): number {
    let modifiedCount = 0;
    const r2 = radius * radius;

    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        if (dx * dx + dy * dy <= r2) {
          const tx = centerX + dx;
          const ty = centerY + dy;
          if (this.setTerrain(tx, ty, terrain)) {
            modifiedCount++;
          }
        }
      }
    }

    if (modifiedCount > 0) {
      this.isDirty = true;
      this.eventBus.emit('world:terrain_modified', { centerX, centerY, radius, terrain });
    }

    return modifiedCount;
  }

  /**
   * Áp dụng cọ nâng, hạ hoặc làm mượt cao độ trong bán kính
   */
  public applyElevationBrush(
    centerX: number,
    centerY: number,
    mode: 'raise' | 'lower' | 'smooth',
    radius: number,
    step: number = ELEVATION_BRUSH_STEP
  ): number {
    let modifiedCount = 0;
    const r2 = radius * radius;

    if (mode === 'raise' || mode === 'lower') {
      const delta = mode === 'raise' ? step : -step;
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          if (dx * dx + dy * dy <= r2) {
            const tx = centerX + dx;
            const ty = centerY + dy;
            const tile = this.getTile(tx, ty);
            if (!tile) continue;
            const targetElev = clampElevation(tile.elevation + delta);
            if (this.setElevation(tx, ty, targetElev)) {
              modifiedCount++;
            }
          }
        }
      }
    } else if (mode === 'smooth') {
      // Snapshot vùng ảnh hưởng trước để làm mượt độc lập với thứ tự duyệt (tất định)
      const targets: { x: number; y: number; newElev: number }[] = [];

      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          if (dx * dx + dy * dy <= r2) {
            const tx = centerX + dx;
            const ty = centerY + dy;
            const tile = this.getTile(tx, ty);
            if (!tile) continue;

            // Tính trung bình độ cao từ các ô lân cận (snapshot trạng thái cũ)
            let sum = 0;
            let count = 0;
            for (let ny = -1; ny <= 1; ny++) {
              for (let nx = -1; nx <= 1; nx++) {
                const neighbor = this.getTile(tx + nx, ty + ny);
                if (neighbor) {
                  sum += neighbor.elevation;
                  count++;
                }
              }
            }

            if (count > 0) {
              const avg = sum / count;
              const diff = avg - tile.elevation;
              if (Math.abs(diff) > 1e-4) {
                const change = Math.sign(diff) * Math.min(Math.abs(diff), step);
                targets.push({ x: tx, y: ty, newElev: clampElevation(tile.elevation + change) });
              }
            }
          }
        }
      }

      for (const t of targets) {
        if (this.setElevation(t.x, t.y, t.newElev)) {
          modifiedCount++;
        }
      }
    }

    if (modifiedCount > 0) {
      this.isDirty = true;
      this.eventBus.emit('world:elevation_modified', { centerX, centerY, radius, mode, modifiedCount });
    }

    return modifiedCount;
  }

  public getDirty(): boolean {
    return this.isDirty;
  }

  public setDirty(dirty: boolean): void {
    this.isDirty = dirty;
  }

  public getAllTiles(): WorldTile[] {
    return this.tiles;
  }
}
