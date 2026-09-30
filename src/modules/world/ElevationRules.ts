import { TerrainType, TERRAIN_CONFIGS } from '../../config/terrains.config.ts';

/**
 * Ngưỡng dốc tối đa cho phép di chuyển giữa 2 ô liền kề.
 * Nếu chênh lệch độ cao > 0.20 thì coi như vách núi thẳng đứng, không thể đi qua.
 */
export const MAX_TRAVERSABLE_SLOPE = 0.20;

/**
 * Bước tăng/giảm cao độ mặc định cho mỗi lần áp dụng cọ vẽ
 */
export const ELEVATION_BRUSH_STEP = 0.02;

export type ElevationBand = 'lowland' | 'low' | 'middle' | 'high' | 'summit';

export const ELEVATION_BAND_NAMES: Record<ElevationBand, string> = {
  lowland: 'Vùng Trũng',
  low: 'Vùng Thấp',
  middle: 'Trung Bình',
  high: 'Vùng Cao',
  summit: 'Đỉnh Núi'
};

export interface ElevationBounds {
  min: number;
  max: number;
  fallbackUnder: number;
  fallbackOver: number;
}

/**
 * Miền cao độ hợp lý cho từng loại địa hình khi người chơi tô cọ.
 * Rừng và sông có dải rất rộng vì có thể tồn tại ở nhiều độ cao khác nhau.
 */
export const TERRAIN_ELEVATION_BOUNDS: Record<TerrainType, ElevationBounds> = {
  [TerrainType.OCEAN]: { min: 0.0, max: 0.18, fallbackUnder: 0.0, fallbackOver: 0.12 },
  [TerrainType.LAKE]: { min: 0.0, max: 0.25, fallbackUnder: 0.0, fallbackOver: 0.20 },
  [TerrainType.SWAMP]: { min: 0.05, max: 0.35, fallbackUnder: 0.15, fallbackOver: 0.25 },
  [TerrainType.PLAIN]: { min: 0.15, max: 0.65, fallbackUnder: 0.25, fallbackOver: 0.50 },
  [TerrainType.HILL]: { min: 0.30, max: 0.75, fallbackUnder: 0.40, fallbackOver: 0.70 },
  [TerrainType.PLATEAU]: { min: 0.40, max: 0.85, fallbackUnder: 0.55, fallbackOver: 0.80 },
  [TerrainType.MOUNTAIN]: { min: 0.65, max: 1.0, fallbackUnder: 0.75, fallbackOver: 1.0 },
  [TerrainType.DENSE_FOREST]: { min: 0.15, max: 0.90, fallbackUnder: 0.25, fallbackOver: 0.85 },
  [TerrainType.RIVER]: { min: 0.05, max: 0.90, fallbackUnder: 0.10, fallbackOver: 0.85 }
};

/**
 * Giới hạn giá trị độ cao trong khoảng [0, 1].
 * Xử lý an toàn các giá trị không hữu hạn (NaN, Infinity, -Infinity).
 */
export function clampElevation(value: number): number {
  if (!Number.isFinite(value) || Number.isNaN(value)) {
    return 0;
  }
  return Math.max(0, Math.min(1, value));
}

/**
 * Kiểm tra giá trị độ cao có hợp lệ (hữu hạn và trong [0, 1]) không.
 */
export function isValidElevation(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1;
}

/**
 * Phân dải 5 mức hiển thị độ cao:
 * - < 0.20: lowland (Vùng Trũng)
 * - 0.20 - < 0.40: low (Vùng Thấp)
 * - 0.40 - < 0.60: middle (Trung Bình)
 * - 0.60 - < 0.80: high (Vùng Cao)
 * - >= 0.80: summit (Đỉnh Núi)
 */
export function getElevationBand(value: number): ElevationBand {
  const clamped = clampElevation(value);
  if (clamped < 0.20) return 'lowland';
  if (clamped < 0.40) return 'low';
  if (clamped < 0.60) return 'middle';
  if (clamped < 0.80) return 'high';
  return 'summit';
}

/**
 * Tính chênh lệch độ cao (độ dốc có dấu): toElevation - fromElevation.
 * Dương = lên dốc, Âm = xuống dốc.
 */
export function getSlope(fromElevation: number, toElevation: number): number {
  if (!Number.isFinite(fromElevation) || !Number.isFinite(toElevation)) {
    return NaN;
  }
  return toElevation - fromElevation;
}

/**
 * Kiểm tra xem có thể di chuyển qua dốc giữa 2 ô kề nhau hay không.
 */
export function canTraverseSlope(fromElevation: number, toElevation: number): boolean {
  if (!Number.isFinite(fromElevation) || !Number.isFinite(toElevation)) {
    return false;
  }
  return Math.abs(toElevation - fromElevation) <= MAX_TRAVERSABLE_SLOPE + 1e-9;
}

/**
 * Tính hệ số tốc độ di chuyển trên dốc (Move Factor).
 * Đi lên dốc chậm hơn đi xuống dốc.
 * - Flat (slope = 0): 1.0
 * - Uphill (slope > 0): giảm dần tới 0.5 ở slope = 0.20
 * - Downhill (slope < 0): tăng nhẹ tới 1.2 ở slope = -0.20
 * - Không thể đi qua (|slope| > 0.20): trả về 0
 */
export function getSlopeMoveFactor(fromElevation: number, toElevation: number): number {
  if (!canTraverseSlope(fromElevation, toElevation)) {
    return 0;
  }
  const slope = toElevation - fromElevation;
  if (Math.abs(slope) < 1e-9) {
    return 1.0;
  }
  if (slope > 0) {
    // Lên dốc: tốc độ giảm từ 1.0 xuống tối thiểu 0.5 (ở ngưỡng 0.20)
    return Math.max(0.4, 1.0 - slope * 2.5);
  } else {
    // Xuống dốc: tốc độ tăng nhẹ từ 1.0 lên tối đa 1.2 (ở ngưỡng -0.20)
    return Math.min(1.25, 1.0 - slope * 1.0);
  }
}

/**
 * Chi phí tìm đường (Path Cost) tương ứng cho thuật toán A*.
 * Đảm bảo: moveFactor * pathCost = 1.0, không âm, không bằng 0, không NaN.
 */
export function getSlopePathCost(fromElevation: number, toElevation: number): number {
  const factor = getSlopeMoveFactor(fromElevation, toElevation);
  if (factor <= 0) {
    return Infinity;
  }
  return 1 / factor;
}

/**
 * Kiểm tra bước di chuyển chéo có bị chặn bởi vách núi cắt góc hay không.
 * Cần cả 2 ô trực giao phải vượt được từ fromElev.
 */
export function canTraverseDiagonalSlope(
  fromElev: number,
  toElev: number,
  ortho1Elev: number,
  ortho2Elev: number
): boolean {
  if (!canTraverseSlope(fromElev, toElev)) return false;
  if (!canTraverseSlope(fromElev, ortho1Elev)) return false;
  if (!canTraverseSlope(fromElev, ortho2Elev)) return false;
  return true;
}

/**
 * Hòa giải độ cao khi tô lại địa hình mới (chỉ can thiệp nếu độ cao cũ nằm ngoài miền hợp lý).
 * Ví dụ: Tô Núi lên Hồ -> nâng lên dải núi (0.75).
 *        Tô Hồ lên Núi -> hạ xuống dải hồ (0.20).
 *        Tô Rừng lên Núi -> giữ nguyên độ cao núi, vì rừng có thể mọc trên núi cao.
 */
export function reconcileElevationForTerrain(terrain: TerrainType, currentElevation: number): number {
  const bounds = TERRAIN_ELEVATION_BOUNDS[terrain];
  if (!bounds) {
    return clampElevation(currentElevation);
  }

  const validElev = Number.isFinite(currentElevation) ? currentElevation : 0.3;

  if (validElev < bounds.min) {
    return bounds.fallbackUnder;
  }
  if (validElev > bounds.max) {
    return bounds.fallbackOver;
  }
  return validElev;
}

/**
 * Tính nhiệt độ chuẩn hóa từ loại địa hình và cao độ.
 * Càng lên cao nhiệt độ càng giảm: baseTemp + (0.5 - elevation) * 8.
 */
export function calculateBaseTemperature(terrain: TerrainType, elevation: number): number {
  const clamped = clampElevation(elevation);
  const config = TERRAIN_CONFIGS[terrain];
  const base = config ? config.baseTemp : 20;
  return base + (0.5 - clamped) * 8;
}
