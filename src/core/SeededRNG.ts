/**
 * SeededRNG - Bộ sinh số ngẫu nhiên theo hạt giống (Mulberry32)
 * Đảm bảo thế giới có thể tái lập hoàn toàn từ cùng 1 Seed
 */
export class SeededRNG {
  private seed: number;

  constructor(seed: number = Date.now()) {
    this.seed = seed;
  }

  public setSeed(seed: number): void {
    this.seed = seed;
  }

  public getSeed(): number {
    return this.seed;
  }

  /**
   * Sinh số thực ngẫu nhiên [0, 1)
   */
  public next(): number {
    let t = (this.seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /**
   * Sinh số nguyên ngẫu nhiên [min, max]
   */
  public nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  /**
   * Sinh số thực ngẫu nhiên [min, max)
   */
  public nextFloat(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  /**
   * Chọn ngẫu nhiên 1 phần tử trong mảng
   */
  public choice<T>(array: T[]): T {
    const idx = Math.floor(this.next() * array.length);
    return array[idx];
  }

  /**
   * Kiểm tra xác suất tỷ lệ phần trăm (0 - 100%)
   */
  public chance(percent: number): boolean {
    return this.next() * 100 < percent;
  }

  /**
   * Thực thi một hàm trong ngữ cảnh ngẫu nhiên tất định theo seed.
   * Mọi lời gọi Math.random() bên trong fn (bao gồm cả các factory/component lồng nhau)
   * đều sẽ lấy số từ bộ sinh SeededRNG này, đảm bảo tái tạo 100% thế giới từ cùng 1 seed.
   */
  public static withSeed<T>(seed: number, fn: (rng: SeededRNG) => T): T {
    const rng = new SeededRNG(seed);
    const originalRandom = Math.random;
    Math.random = () => rng.next();
    try {
      return fn(rng);
    } finally {
      Math.random = originalRandom;
    }
  }
}
