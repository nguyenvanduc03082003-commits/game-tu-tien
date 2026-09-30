import { System } from '../../ecs/System.ts';
import { ECSWorld } from '../../ecs/World.ts';
import { QiGrid } from './QiGrid.ts';
import { WorldMap } from '../world/WorldMap.ts';

export class QiSystem implements System {
  public name = 'QiSystem';
  public enabled = true;
  public priority = 10; // Chạy đầu tiên trong tick

  private qiGrid: QiGrid;
  private worldMap: WorldMap;
  private accumulator: number = 0;

  constructor(qiGrid: QiGrid, worldMap: WorldMap) {
    this.qiGrid = qiGrid;
    this.worldMap = worldMap;
  }

  public update(_world: ECSWorld, dt: number): void {
    this.accumulator += dt;

    // Cập nhật khuếch tán mỗi 1.0 giây để tối ưu hóa CPU trên bản đồ lớn
    if (this.accumulator >= 1.0) {
      this.qiGrid.updateDiffusion(this.accumulator);

      // Đồng bộ nồng độ linh khí sang các ô của WorldMap
      const len = this.worldMap.width * this.worldMap.height;
      for (let i = 0; i < len; i++) {
        const qiTile = this.qiGrid.getTileByIndex(i);
        const mapTile = this.worldMap.getTileByIndex(i);
        if (qiTile && mapTile) {
          mapTile.qiDensity = Math.round(qiTile.density);
        }
      }

      this.accumulator = 0;
    }
  }
}
