import { ECSWorld } from '../../ecs/World.ts';
import { ViewportCamera } from '../ViewportCamera.ts';
import { PositionComponent } from '../../modules/beings/BeingComponents.ts';
import { PlantComponent } from '../../modules/flora/PlantComponents.ts';
import { PLANT_DEFINITIONS } from '../../config/plants.config.ts';
import { AssetManager } from '../assets/AssetManager.ts';
import { WorldMap } from '../../modules/world/WorldMap.ts';
import { PlantFactory } from '../../modules/flora/PlantFactory.ts';

export class FloraRenderer {
  public render(
    ctx: CanvasRenderingContext2D,
    world: ECSWorld,
    camera: ViewportCamera,
    screenWidth: number,
    screenHeight: number,
    worldMap: WorldMap,
    isWinter: boolean = false
  ): void {
    const plants = world.query([PositionComponent, PlantComponent]);

    const bounds = camera.getVisibleBounds(screenWidth, screenHeight);
    const minX = bounds.minX - 32;
    const maxX = bounds.maxX + 32;
    const minY = bounds.minY - 32;
    const maxY = bounds.maxY + 32;

    const visiblePlants: number[] = [];
    for (let i = 0; i < plants.length; i++) {
      const ent = plants[i];
      const pos = world.getComponent(ent, PositionComponent)!;
      if (pos.x >= minX && pos.x <= maxX && pos.y >= minY && pos.y <= maxY &&
        PlantFactory.canPlantAt(worldMap, pos.x, pos.y)) {
        visiblePlants.push(ent);
      }
    }

    // Chỉ sort cây cối thực sự nằm trong tầm nhìn camera
    visiblePlants.sort((a, b) => {
      const posA = world.getComponent(a, PositionComponent)!;
      const posB = world.getComponent(b, PositionComponent)!;
      return posA.y - posB.y;
    });

    for (const ent of visiblePlants) {
      const pos = world.getComponent(ent, PositionComponent)!;
      const plant = world.getComponent(ent, PlantComponent)!;
      if (!plant) continue;

      const screenPos = camera.worldToScreen(pos.x, pos.y, screenWidth, screenHeight);
      const def = PLANT_DEFINITIONS[plant.speciesId] || PLANT_DEFINITIONS['oak_tree'];

      const customImg = AssetManager.getInstance().getTexture('plant_' + plant.speciesId);
      if (customImg) {
        const pSize = 18 * camera.zoom;
        ctx.drawImage(customImg, screenPos.x - pSize / 2, screenPos.y - pSize / 2, pSize, pSize);
      } else {
        this.drawPlant(ctx, screenPos.x, screenPos.y, plant, def, camera.zoom, isWinter);
      }
    }
  }

  private drawPlant(
    ctx: CanvasRenderingContext2D,
    sx: number,
    sy: number,
    plant: PlantComponent,
    def: any,
    zoom: number,
    isWinter: boolean
  ): void {
    const size = Math.max(8, Math.floor(14 * zoom * (0.4 + plant.growthProgress * 0.6)));
    const px = Math.floor(sx - size / 2);
    const py = Math.floor(sy - size / 2);

    // 1. Vẽ hào quang phát sáng nếu là Linh Dược hoặc Thần Dược
    if (def.glowColor) {
      const time = Date.now() / 600;
      const pulse = 0.7 + Math.sin(time * 2) * 0.3;
      ctx.save();
      ctx.fillStyle = def.glowColor;
      ctx.globalAlpha = pulse * 0.4;
      ctx.beginPath();
      ctx.arc(sx, sy, size * 0.9, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 2. Thần Dược Cực Phẩm (Tỏa hào quang đa sắc)
    if (plant.category === 'divine_herb') {
      const time = Date.now() / 300;
      ctx.save();
      ctx.strokeStyle = '#ffd43b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(sx, sy, size * 1.2, time, time + Math.PI);
      ctx.stroke();
      ctx.restore();
    }

    // 3. Dựng hình Pixel theo danh mục thực vật
    if (def.category === 'tree') {
      // Thân gỗ
      ctx.fillStyle = '#5c3d2e';
      ctx.fillRect(px + size * 0.4, py + size * 0.5, size * 0.2, size * 0.5);

      // Tán lá
      ctx.fillStyle = isWinter && def.id !== 'pine_tree' ? '#868e96' : def.color;
      ctx.beginPath();
      ctx.arc(sx, py + size * 0.4, size * 0.45, 0, Math.PI * 2);
      ctx.fill();

      // Điểm nhấn tuyết vào mùa đông
      if (isWinter) {
        ctx.fillStyle = '#f8f9fa';
        ctx.fillRect(px + size * 0.2, py + size * 0.1, size * 0.6, 2);
      }
    } else if (def.category === 'food') {
      // Bụi cây ăn quả / Nấm
      ctx.fillStyle = '#2b8a3e';
      ctx.beginPath();
      ctx.arc(sx, sy, size * 0.35, 0, Math.PI * 2);
      ctx.fill();

      // Quả mọng chín đỏ
      if (plant.hasFruit) {
        ctx.fillStyle = def.color;
        ctx.fillRect(sx - 3, sy - 3, 3, 3);
        ctx.fillRect(sx + 2, sy - 1, 3, 3);
        ctx.fillRect(sx - 1, sy + 2, 3, 3);
      }
    } else {
      // Linh Dược & Thần Dược
      ctx.fillStyle = def.color;
      // Lá thuốc xòe ra các hướng
      ctx.fillRect(px + size * 0.25, py + size * 0.25, size * 0.5, size * 0.5);
      ctx.fillRect(px + size * 0.4, py + size * 0.1, size * 0.2, size * 0.8);
      ctx.fillRect(px + size * 0.1, py + size * 0.4, size * 0.8, size * 0.2);

      // Nhụy hoa linh quang
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(sx - 1, sy - 1, 2, 2);
    }
  }
}
