import { System } from '../../ecs/System.ts';
import { ECSWorld } from '../../ecs/World.ts';
import { WorldMap } from '../world/WorldMap.ts';
import { TERRAIN_CONFIGS } from '../../config/terrains.config.ts';
import {
  PositionComponent,
  CharacterStateComponent,
  RealmComponent,
  DailyScheduleComponent
} from '../beings/BeingComponents.ts';
import { InsideBuildingComponent } from '../factions/FactionComponents.ts';

/**
 * @deprecated Hệ thống AI di chuyển tự do cũ. Đã được thay thế hoàn toàn bởi ThreeTierAISystem.
 */
export class AutonomousMovementSystem implements System {
  public name = 'AutonomousMovementSystem';
  public enabled = true;
  public priority = 20;

  private worldMap: WorldMap;

  constructor(worldMap: WorldMap) {
    this.worldMap = worldMap;
  }

  public update(world: ECSWorld, dt: number): void {
    const entities = world.query([PositionComponent, CharacterStateComponent]);

    for (const entity of entities) {
      if (world.hasComponent(entity, InsideBuildingComponent)) continue;
      const pos = world.getComponent(entity, PositionComponent)!;
      const stateComp = world.getComponent(entity, CharacterStateComponent)!;
      const realm = world.getComponent(entity, RealmComponent);

      // Đang đột phá cảnh giới thì nhập định bất động
      if (realm?.isBreakingThrough) {
        stateComp.state = 'breakthrough';
        continue;
      }

      stateComp.stateTimer += dt;

      // Lấy ô địa hình hiện tại
      const tileX = Math.floor(pos.x / this.worldMap.tileSize);
      const tileY = Math.floor(pos.y / this.worldMap.tileSize);
      const currentTile = this.worldMap.getTile(tileX, tileY);
      const terrainModifier = currentTile ? TERRAIN_CONFIGS[currentTile.terrain].moveSpeedModifier : 1.0;

      // Trạng thái: Đang di chuyển
      if (stateComp.state === 'walk') {
        if (pos.targetX !== undefined && pos.targetY !== undefined) {
          const dx = pos.targetX - pos.x;
          const dy = pos.targetY - pos.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          // Cập nhật hướng nhìn
          if (Math.abs(dx) > Math.abs(dy)) {
            stateComp.direction = dx > 0 ? 'right' : 'left';
          } else {
            stateComp.direction = dy > 0 ? 'down' : 'up';
          }

          const step = pos.speed * terrainModifier * dt;

          if (dist <= step) {
            pos.x = pos.targetX;
            pos.y = pos.targetY;
            pos.targetX = undefined;
            pos.targetY = undefined;

            const hasSchedule = world.hasComponent(entity, DailyScheduleComponent);
            if (hasSchedule) {
              stateComp.state = 'idle';
            } else {
              // Đến nơi: 75% xác suất ngồi thiền hấp thu linh khí, 25% đứng nghỉ
              if (Math.random() < 0.75) {
                stateComp.state = 'meditate';
              } else {
                stateComp.state = 'idle';
              }
            }
            stateComp.stateTimer = 0;
          } else {
            pos.x += (dx / dist) * step;
            pos.y += (dy / dist) * step;
          }
        } else {
          stateComp.state = 'idle';
          stateComp.stateTimer = 0;
        }
      }
      // Trạng thái: Ngồi thiền tu luyện (Chỉ dành cho người không có lịch trình dân sinh hoặc tu sĩ thuần túy)
      else if (stateComp.state === 'meditate') {
        const hasSchedule = world.hasComponent(entity, DailyScheduleComponent);
        if (!hasSchedule && stateComp.stateTimer > 6.0) {
          this.pickHighQiTarget(pos, tileX, tileY);
          stateComp.state = 'walk';
          stateComp.stateTimer = 0;
        }
      }
      // Trạng thái: Đứng nghỉ (Idle)
      else if (stateComp.state === 'idle') {
        const hasSchedule = world.hasComponent(entity, DailyScheduleComponent);
        if (!hasSchedule && stateComp.stateTimer > 2.0) {
          this.pickHighQiTarget(pos, tileX, tileY);
          stateComp.state = 'walk';
          stateComp.stateTimer = 0;
        }
      }
    }
  }

  /**
   * Tìm kiếm ô đất có Linh Khí cao nhất lân cận để đến ngồi thiền tu hành
   */
  private pickHighQiTarget(pos: PositionComponent, currentTileX: number, currentTileY: number): void {
    const searchRadius = 7;
    let bestX = currentTileX;
    let bestY = currentTileY;
    let maxQi = -1;

    // Quét tìm trong bán kính
    for (let dy = -searchRadius; dy <= searchRadius; dy++) {
      for (let dx = -searchRadius; dx <= searchRadius; dx++) {
        const tx = currentTileX + dx;
        const ty = currentTileY + dy;
        const tile = this.worldMap.getTile(tx, ty);

        if (tile) {
          // Thêm chút ngẫu nhiên để không dồn hết vào 1 ô duy nhất
          const effectiveQi = tile.qiDensity + Math.random() * 15;
          if (effectiveQi > maxQi) {
            maxQi = effectiveQi;
            bestX = tx;
            bestY = ty;
          }
        }
      }
    }

    pos.targetX = bestX * this.worldMap.tileSize + this.worldMap.tileSize / 2;
    pos.targetY = bestY * this.worldMap.tileSize + this.worldMap.tileSize / 2;
  }
}
