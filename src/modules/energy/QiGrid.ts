import { ElementType } from './ElementType.ts';
import { assertValidWorldDimensions, WorldMap } from '../world/WorldMap.ts';
import { TerrainType, TERRAIN_CONFIGS } from '../../config/terrains.config.ts';
import { EventBus } from '../../core/EventBus.ts';

export type QiTier = 'linh_khi' | 'tien_khi' | 'hon_don_khi';

export interface QiTile {
  density: number;             // Nồng độ năng lượng (0..1000)
  tier: QiTier;                // Phẩm cấp khí: Linh Khí (đa số), Tiên Khí (0.001%), Hỗn Độn Khí (0.0001%)
  dominantElement: ElementType;// Ngũ hành chủ đạo
  isSpiritVein: boolean;       // Có phải mắt trận Linh Mạch không
  veinRate: number;            // Tốc độ phát tán linh khí mỗi giây nếu là linh mạch
}

export class QiGrid {
  public readonly width: number;
  public readonly height: number;

  private tiles: QiTile[];
  private bufferDensity: Float32Array;

  // TỶ LỆ XUẤT HIỆN TỰ NHIÊN THEO YÊU CẦU:
  public static readonly TIEN_KHI_RATE = 0.00001;    // 0.001% (1 trên 100.000 ô)
  public static readonly HON_DON_KHI_RATE = 0.000001;// 0.0001% (1 trên 1.000.000 ô)

  private spiritVeinIndices: number[] = [];

  constructor(width: number = 360, height: number = 360) {
    assertValidWorldDimensions(width, height);
    this.width = width;
    this.height = height;
    this.tiles = new Array(width * height);
    this.bufferDensity = new Float32Array(width * height);

    for (let i = 0; i < this.tiles.length; i++) {
      this.tiles[i] = {
        density: 20,
        tier: 'linh_khi',
        dominantElement: ElementType.MOC,
        isSpiritVein: false,
        veinRate: 0
      };
      this.bufferDensity[i] = 20;
    }
  }

  public isInBounds(x: number, y: number): boolean {
    return x >= 0 && x < this.width && y >= 0 && y < this.height;
  }

  public getTile(x: number, y: number): QiTile | null {
    if (!this.isInBounds(x, y)) return null;
    return this.tiles[y * this.width + x];
  }

  public getTileByIndex(index: number): QiTile | null {
    if (index < 0 || index >= this.tiles.length) return null;
    return this.tiles[index];
  }

  public setQi(x: number, y: number, density: number, tier: QiTier = 'linh_khi', element?: ElementType): void {
    const tile = this.getTile(x, y);
    if (!tile) return;
    tile.density = Math.max(0, Math.min(1000, density));
    tile.tier = tier;
    if (element) {
      tile.dominantElement = element;
    }
  }

  public addSpiritVein(x: number, y: number, tier: QiTier = 'linh_khi', rate: number = 5.0, element?: ElementType): void {
    const tile = this.getTile(x, y);
    if (!tile) return;
    const idx = y * this.width + x;
    if (!tile.isSpiritVein) {
      this.spiritVeinIndices.push(idx);
    }
    tile.isSpiritVein = true;
    tile.tier = tier;
    tile.veinRate = rate;
    tile.density = Math.max(tile.density, tier === 'hon_don_khi' ? 800 : tier === 'tien_khi' ? 500 : 300);
    if (element) {
      tile.dominantElement = element;
    }

    if (tier === 'hon_don_khi') {
      EventBus.getInstance().emit('world:log', {
        type: 'anomaly',
        message: `🌌 THIÊN ĐỊA DỊ TƯỢNG: Một luồng HỖN ĐỘN KHÍ thượng cổ từ hư không giáng lâm tại (${x}, ${y}), thiên địa linh khí cuộn trào!`
      });
    } else if (tier === 'tien_khi') {
      EventBus.getInstance().emit('world:log', {
        type: 'anomaly',
        message: `✨ THIÊN ĐỊA DỊ TƯỢNG: Tiên Duyên giáng hạ! Một mạch TIÊN KHÍ thuần khiết xuất hiện tại (${x}, ${y}), thụy khí ngập tràn sơn hà!`
      });
    }
  }

  public consumeQi(x: number, y: number, amount: number): number {
    const tile = this.getTile(x, y);
    if (!tile || tile.density <= 0) return 0;
    const actual = Math.min(tile.density, amount);
    tile.density -= actual;
    return actual;
  }

  /**
   * Thuật toán Khuếch tán Linh khí (Cellular Diffusion)
   * Tự động làm mềm và lan tỏa năng lượng từ nơi cao về nơi thấp
   */
  public updateDiffusion(dt: number): void {
    const w = this.width;
    const h = this.height;
    const diffRate = 0.15 * dt * 20; // Hệ số khuếch tán

    // 1. Phát tán từ các mắt Linh Mạch (chỉ lặp qua các mắt linh mạch đã đăng ký)
    for (let i = 0; i < this.spiritVeinIndices.length; i++) {
      const idx = this.spiritVeinIndices[i];
      const tile = this.tiles[idx];
      if (tile && tile.isSpiritVein) {
        tile.density = Math.min(1000, tile.density + tile.veinRate * dt);
      }
    }

    // 2. Khuếch tán sang 4 ô lân cận (Up, Down, Left, Right)
    // Giữ nguyên nồng độ các ô viền biên vào bufferDensity để tránh bị reset
    for (let x = 0; x < w; x++) {
      this.bufferDensity[x] = this.tiles[x].density;
      const btmIdx = (h - 1) * w + x;
      this.bufferDensity[btmIdx] = this.tiles[btmIdx].density;
    }
    for (let y = 1; y < h - 1; y++) {
      const leftIdx = y * w;
      this.bufferDensity[leftIdx] = this.tiles[leftIdx].density;
      const rightIdx = y * w + (w - 1);
      this.bufferDensity[rightIdx] = this.tiles[rightIdx].density;
    }

    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const idx = y * w + x;
        const current = this.tiles[idx].density;

        const up = this.tiles[idx - w].density;
        const down = this.tiles[idx + w].density;
        const left = this.tiles[idx - 1].density;
        const right = this.tiles[idx + 1].density;

        const avg = (up + down + left + right) * 0.25;
        this.bufferDensity[idx] = current + (avg - current) * diffRate;
      }
    }

    // 3. Áp dụng buffer trở lại
    for (let i = 0; i < this.tiles.length; i++) {
      this.tiles[i].density = Math.max(0, Math.min(1000, this.bufferDensity[i]));
    }
  }

  /**
   * Khởi tạo phân bố linh khí ban đầu dựa trên địa hình và độ hiếm ngẫu nhiên
   */
  public initFromWorld(worldMap: WorldMap, rng?: { next: () => number }): void {
    const w = this.width;
    const h = this.height;
    const randFn = () => (rng ? rng.next() : Math.random());

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = y * w + x;
        const worldTile = worldMap.getTile(x, y);
        if (!worldTile) continue;

        const cfg = TERRAIN_CONFIGS[worldTile.terrain];
        let baseDensity = cfg.baseQiDensity;

        // Xác định ngũ hành theo địa hình
        let element: ElementType = ElementType.THO;
        if (worldTile.terrain === TerrainType.MOUNTAIN) {
          element = randFn() < 0.5 ? ElementType.KIM : ElementType.BANG;
        } else if (worldTile.terrain === TerrainType.DENSE_FOREST) {
          element = ElementType.MOC;
        } else if (worldTile.terrain === TerrainType.SWAMP) {
          element = ElementType.THUY;
        } else if (worldTile.terrain === TerrainType.RIVER || worldTile.terrain === TerrainType.LAKE || worldTile.terrain === TerrainType.OCEAN) {
          element = ElementType.THUY;
        } else if (worldTile.terrain === TerrainType.PLATEAU) {
          element = ElementType.PHONG;
        } else if (worldTile.terrain === TerrainType.HILL) {
          element = ElementType.THO;
        } else {
          element = randFn() < 0.5 ? ElementType.MOC : ElementType.THO;
        }

        // Tỷ lệ xuất hiện cực thấp theo yêu cầu:
        // Hỗn Độn Khí: 0.0001% (0.000001)
        // Tiên Khí: 0.001% (0.00001)
        const rand = randFn();
        let tier: QiTier = 'linh_khi';
        let isVein = false;
        let veinRate = 0;

        if (rand < QiGrid.HON_DON_KHI_RATE) {
          tier = 'hon_don_khi';
          baseDensity = 900;
          isVein = true;
          veinRate = 12.0;
          element = ElementType.LOI;
          EventBus.getInstance().emit('world:log', {
            type: 'anomaly',
            message: `🌌 THIÊN ĐỊA DỊ TƯỢNG: Một luồng HỖN ĐỘN KHÍ thượng cổ giáng lâm tại (${x}, ${y}), thiên địa linh khí cuộn trào!`
          });
        } else if (rand < QiGrid.HON_DON_KHI_RATE + QiGrid.TIEN_KHI_RATE) {
          tier = 'tien_khi';
          baseDensity = 500;
          isVein = true;
          veinRate = 6.0;
          EventBus.getInstance().emit('world:log', {
            type: 'anomaly',
            message: `✨ THIÊN ĐỊA DỊ TƯỢNG: Tiên Duyên giáng hạ! Một mạch TIÊN KHÍ xuất hiện tại (${x}, ${y}), thụy khí ngập tràn sơn hà!`
          });
        } else {
          // Tỷ lệ 1.5% có Linh Mạch ngầm thông thường (núi, cao nguyên hoặc hồ tụ linh)
          if (randFn() < 0.015 && (worldTile.terrain === TerrainType.MOUNTAIN || worldTile.terrain === TerrainType.PLATEAU || worldTile.terrain === TerrainType.LAKE)) {
            isVein = true;
            veinRate = 3.0;
            baseDensity += 150;
          }
        }

        this.tiles[idx] = {
          density: baseDensity,
          tier,
          dominantElement: element,
          isSpiritVein: isVein,
          veinRate
        };
      }
    }

    this.rebuildVeinIndices();
  }

  /**
   * Quét lại toàn bộ lưới để cập nhật danh sách các mắt Linh Mạch spiritVeinIndices
   */
  public rebuildVeinIndices(): void {
    this.spiritVeinIndices = [];
    for (let i = 0; i < this.tiles.length; i++) {
      if (this.tiles[i]?.isSpiritVein) {
        this.spiritVeinIndices.push(i);
      }
    }
  }
}
