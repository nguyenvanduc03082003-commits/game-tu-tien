import { ECSWorld } from '../../ecs/World.ts';
import { PositionComponent } from '../../modules/beings/BeingComponents.ts';
import { TreasureChestComponent } from '../../modules/treasure/TreasureChest.ts';
import { ViewportCamera } from '../ViewportCamera.ts';

export class TreasureRenderer {
  public render(ctx: CanvasRenderingContext2D, world: ECSWorld, camera: ViewportCamera,
    width: number, height: number): void {
    const bounds = camera.getVisibleBounds(width, height);
    for (const id of world.query([PositionComponent, TreasureChestComponent])) {
      const pos = world.getComponent(id, PositionComponent)!;
      if (pos.x < bounds.minX - 16 || pos.x > bounds.maxX + 16 ||
          pos.y < bounds.minY - 16 || pos.y > bounds.maxY + 16) continue;
      const chest = world.getComponent(id, TreasureChestComponent)!;
      const screen = camera.worldToScreen(pos.x, pos.y, width, height);
      const size = Math.max(8, 14 * camera.zoom);
      ctx.fillStyle = chest.opened ? '#495057' : '#8b5e34';
      ctx.fillRect(screen.x - size / 2, screen.y - size / 3, size, size * 0.68);
      ctx.strokeStyle = chest.opened ? '#868e96' : '#ffd43b';
      ctx.lineWidth = Math.max(1, camera.zoom);
      ctx.strokeRect(screen.x - size / 2, screen.y - size / 3, size, size * 0.68);
      if (!chest.opened) {
        ctx.fillStyle = '#ffd43b';
        ctx.fillRect(screen.x - size * 0.10, screen.y - size * 0.1, size * 0.2, size * 0.2);
      }
    }
  }
}
