import { calculatePlantGrowth, calculateEnvironmentalPlantGrowth } from '../world/TerrainEnvironment.ts';
import { System } from '../../ecs/System.ts';
import { ECSWorld } from '../../ecs/World.ts';
import { WorldMap } from '../world/WorldMap.ts';
import { QiGrid } from '../energy/QiGrid.ts';
import { PLANT_DEFINITIONS } from '../../config/plants.config.ts';
import { PositionComponent } from '../beings/BeingComponents.ts';
import { PlantComponent } from './PlantComponents.ts';
import { PlantFactory } from './PlantFactory.ts';
import { TimeManager } from '../../core/TimeManager.ts';

export class PlantGrowthSystem implements System {
  public name = 'PlantGrowthSystem';
  public enabled = true;
  public priority = 30;

  private worldMap: WorldMap;
  private qiGrid: QiGrid;

  constructor(worldMap: WorldMap, qiGrid: QiGrid) {
    this.worldMap = worldMap;
    this.qiGrid = qiGrid;
  }

  public reset(): void {
    // Không giữ trạng thái nội bộ rò rỉ giữa các thế giới
  }

  public update(world: ECSWorld, dt: number): void {
    if (dt <= 0) return;

    // Quy ước chuẩn: 1 ngày game = 400 ticks = 20 giây ở 1x (20 ticks/giây)
    const daysPassed = (dt * TimeManager.TICKS_PER_SECOND) / TimeManager.TICKS_PER_DAY;
    const plants = world.query([PositionComponent, PlantComponent]);

    for (const ent of plants) {
      const pos = world.getComponent(ent, PositionComponent)!;
      const plant = world.getComponent(ent, PlantComponent)!;

      if (!PlantFactory.canPlantAt(this.worldMap, pos.x, pos.y)) {
        world.destroyEntity(ent);
        continue;
      }

      const tx = Math.floor(pos.x / this.worldMap.tileSize);
      const ty = Math.floor(pos.y / this.worldMap.tileSize);

      const tile = this.worldMap.getTile(tx, ty);
      const qiTile = this.qiGrid.getTile(tx, ty);
      if (!tile) continue;

      const def = PLANT_DEFINITIONS[plant.speciesId];
      if (!def) continue;

      // 1. Kiểm tra điều kiện sinh trưởng (Nhiệt độ & Độ ẩm)
      tile.plantGrowth = calculatePlantGrowth(tile.terrain, tile.moisture);
      const growthMultiplier = calculateEnvironmentalPlantGrowth(tile.terrain, tile.moisture, tile.temperature);

      // Hút linh khí từ đất
      if (qiTile && qiTile.density > 10) {
        const qiAbsorbed = Math.min(qiTile.density, def.qiAbsorptionRate * daysPassed);
        qiTile.density -= qiAbsorbed;
        plant.qiAccumulated += qiAbsorbed;
      }

      plant.ageDays += daysPassed;

      // 2. Tăng trưởng vòng đời (0 -> 1.0)
      if (plant.growthProgress < 1.0) {
        const growthStep = (daysPassed / Math.max(1, def.growthDurationDays)) * growthMultiplier;
        plant.growthProgress = Math.min(1.0, plant.growthProgress + growthStep);

        // Cập nhật Stage theo mức trưởng thành
        if (plant.growthProgress >= 1.0) {
          plant.stage = 3; // Đơm hoa kết trái / Đỉnh phong
          if (plant.category === 'food' && plant.fruitRegrowDaysRemaining <= 0) {
            plant.hasFruit = true;
          }
          if (plant.maxWood > 0 && plant.woodRemaining <= 0) {
            plant.woodRemaining = plant.maxWood;
          }
        } else if (plant.growthProgress >= 0.6) {
          plant.stage = 2; // Trưởng thành
          if (plant.maxWood > 0 && plant.woodRemaining <= 0) {
            plant.woodRemaining = Math.floor(plant.maxWood * 0.7);
          }
        } else if (plant.growthProgress >= 0.25) {
          plant.stage = 1; // Cây con
        } else {
          plant.stage = 0; // Mầm non
        }
      }

      // 3. Chu kỳ tái mọc quả (quả chỉ mọc lại khi cây đã trưởng thành stage >= 2)
      if (plant.category === 'food' && plant.stage >= 2 && !plant.hasFruit) {
        if (plant.fruitRegrowDaysRemaining > 0) {
          plant.fruitRegrowDaysRemaining = Math.max(0, plant.fruitRegrowDaysRemaining - daysPassed * growthMultiplier);
          if (plant.fruitRegrowDaysRemaining <= 1e-4) {
            plant.hasFruit = true;
            plant.fruitRegrowDaysRemaining = 0;
          }
        } else {
          plant.hasFruit = true;
        }
      }

      // 4. Hồi phục gỗ cho cây thân gỗ còn sống
      if (plant.maxWood > 0 && plant.woodRemaining < plant.maxWood && plant.stage >= 2) {
        if (plant.woodRegrowDaysRemaining > 0) {
          plant.woodRegrowDaysRemaining = Math.max(0, plant.woodRegrowDaysRemaining - daysPassed * growthMultiplier);
          if (plant.woodRegrowDaysRemaining <= 1e-4) {
            plant.woodRemaining = plant.maxWood;
            plant.woodRegrowDaysRemaining = 0;
          }
        }
      }

      // 5. Cơ chế HÓA LINH (Cây thường hấp thụ linh khí đậm đặc đột biến thành Linh Dược)
      if (plant.category === 'tree' && plant.stage >= 2 && !plant.isSpiritualized) {
        if (plant.qiAccumulated > 200 && qiTile && qiTile.density > 90) {
          // Tỷ lệ chuyển hóa theo ngày mô phỏng
          if (Math.random() < 0.005 * daysPassed) {
            plant.isSpiritualized = true;
            plant.speciesId = 'tu_linh_diep';
            plant.category = 'spirit_herb';
            plant.tier = 1;
            console.log(`🌿 Diệu biến thiên địa! Cây cỏ tại (${tx}, ${ty}) đã hấp thu đủ linh khí hóa thành Linh Dược!`);
          }
        }
      }
    }
  }
}
