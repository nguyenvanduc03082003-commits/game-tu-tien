/**
 * SpatialGrid - Phân vùng không gian 2D dạng lưới để tối ưu tìm kiếm lân cận O(1)
 */
export interface SpatialEntity {
  id: number;
  x: number;
  y: number;
}

export class SpatialGrid<T extends SpatialEntity = SpatialEntity> {
  public readonly cellSize: number;
  private grid: Map<string, Set<T>> = new Map();
  private entityCells: Map<number, { key: string; item: T }> = new Map();

  constructor(cellSize: number = 64) {
    this.cellSize = cellSize;
  }

  private getKey(x: number, y: number): string {
    const cx = Math.floor(x / this.cellSize);
    const cy = Math.floor(y / this.cellSize);
    return `${cx},${cy}`;
  }

  public insert(entity: T): void {
    const key = this.getKey(entity.x, entity.y);
    let cell = this.grid.get(key);
    if (!cell) {
      cell = new Set();
      this.grid.set(key, cell);
    }
    cell.add(entity);
    this.entityCells.set(entity.id, { key, item: entity });
  }

  public remove(entity: T): void {
    this.removeById(entity.id);
  }

  public removeById(id: number): void {
    const entry = this.entityCells.get(id);
    if (entry) {
      const cell = this.grid.get(entry.key);
      if (cell) {
        cell.delete(entry.item);
        if (cell.size === 0) {
          this.grid.delete(entry.key);
        }
      }
      this.entityCells.delete(id);
    }
  }

  public update(entity: T): void {
    const entry = this.entityCells.get(entity.id);
    const newKey = this.getKey(entity.x, entity.y);

    if (!entry) {
      this.insert(entity);
      return;
    }

    if (entry.key !== newKey) {
      // Xóa khỏi cell cũ
      const oldCell = this.grid.get(entry.key);
      if (oldCell) {
        oldCell.delete(entry.item);
        if (oldCell.size === 0) {
          this.grid.delete(entry.key);
        }
      }
      // Chèn vào cell mới
      let newCell = this.grid.get(newKey);
      if (!newCell) {
        newCell = new Set();
        this.grid.set(newKey, newCell);
      }
      newCell.add(entity);
      entry.key = newKey;
      entry.item = entity;
    }
  }

  /**
   * Tái cấu trúc toàn bộ lưới từ mảng thực thể (rất nhanh khi sync mỗi tick)
   */
  public rebuild(entities: T[]): void {
    this.clear();
    for (let i = 0; i < entities.length; i++) {
      this.insert(entities[i]);
    }
  }

  /**
   * Tìm tất cả thực thể trong bán kính radius quanh điểm (x, y)
   */
  public queryRadius(x: number, y: number, radius: number): T[] {
    const results: T[] = [];
    const minCx = Math.floor((x - radius) / this.cellSize);
    const maxCx = Math.floor((x + radius) / this.cellSize);
    const minCy = Math.floor((y - radius) / this.cellSize);
    const maxCy = Math.floor((y + radius) / this.cellSize);

    const r2 = radius * radius;

    for (let cx = minCx; cx <= maxCx; cx++) {
      for (let cy = minCy; cy <= maxCy; cy++) {
        const cell = this.grid.get(`${cx},${cy}`);
        if (cell) {
          for (const entity of cell) {
            const dx = entity.x - x;
            const dy = entity.y - y;
            if (dx * dx + dy * dy <= r2) {
              results.push(entity);
            }
          }
        }
      }
    }

    return results;
  }

  /**
   * Lấy danh sách ID các thực thể trong bán kính
   */
  public queryRadiusIds(x: number, y: number, radius: number): number[] {
    const results: number[] = [];
    const minCx = Math.floor((x - radius) / this.cellSize);
    const maxCx = Math.floor((x + radius) / this.cellSize);
    const minCy = Math.floor((y - radius) / this.cellSize);
    const maxCy = Math.floor((y + radius) / this.cellSize);

    const r2 = radius * radius;

    for (let cx = minCx; cx <= maxCx; cx++) {
      for (let cy = minCy; cy <= maxCy; cy++) {
        const cell = this.grid.get(`${cx},${cy}`);
        if (cell) {
          for (const entity of cell) {
            const dx = entity.x - x;
            const dy = entity.y - y;
            if (dx * dx + dy * dy <= r2) {
              results.push(entity.id);
            }
          }
        }
      }
    }

    return results;
  }

  /**
   * Tìm tất cả thực thể trong hình chữ nhật (minX, minY) -> (maxX, maxY)
   */
  public queryBounds(minX: number, minY: number, maxX: number, maxY: number): T[] {
    const results: T[] = [];
    const minCx = Math.floor(minX / this.cellSize);
    const maxCx = Math.floor(maxX / this.cellSize);
    const minCy = Math.floor(minY / this.cellSize);
    const maxCy = Math.floor(maxY / this.cellSize);

    for (let cx = minCx; cx <= maxCx; cx++) {
      for (let cy = minCy; cy <= maxCy; cy++) {
        const cell = this.grid.get(`${cx},${cy}`);
        if (cell) {
          for (const entity of cell) {
            if (entity.x >= minX && entity.x <= maxX && entity.y >= minY && entity.y <= maxY) {
              results.push(entity);
            }
          }
        }
      }
    }

    return results;
  }

  public clear(): void {
    this.grid.clear();
    this.entityCells.clear();
  }

  public size(): number {
    return this.entityCells.size;
  }
}
