import { WorldMap } from '../../modules/world/WorldMap.ts';
import { ViewportCamera } from '../ViewportCamera.ts';
import { TERRAIN_CONFIGS, TerrainType } from '../../config/terrains.config.ts';
import { AssetManager } from '../assets/AssetManager.ts';

export class WorldRenderer {
  private worldMap: WorldMap;

  constructor(worldMap: WorldMap) {
    this.worldMap = worldMap;
  }

  public render(
    ctx: CanvasRenderingContext2D,
    camera: ViewportCamera,
    screenWidth: number,
    screenHeight: number,
    hoverTile?: { x: number; y: number; radius: number } | null
  ): void {
    const tileSize = this.worldMap.tileSize;
    const bounds = camera.getVisibleBounds(screenWidth, screenHeight);

    // Tính toán phạm vi ô hiển thị trong tầm nhìn camera
    const minTileX = Math.max(0, Math.floor(bounds.minX / tileSize));
    const maxTileX = Math.min(this.worldMap.width - 1, Math.ceil(bounds.maxX / tileSize));
    const minTileY = Math.max(0, Math.floor(bounds.minY / tileSize));
    const maxTileY = Math.min(this.worldMap.height - 1, Math.ceil(bounds.maxY / tileSize));

    const scaledTile = Math.ceil(tileSize * camera.zoom);

    for (let ty = minTileY; ty <= maxTileY; ty++) {
      for (let tx = minTileX; tx <= maxTileX; tx++) {
        const tile = this.worldMap.getTile(tx, ty);
        if (!tile) continue;

        const screenPos = camera.worldToScreen(tx * tileSize, ty * tileSize, screenWidth, screenHeight);
        const px = Math.floor(screenPos.x);
        const py = Math.floor(screenPos.y);

        const config = TERRAIN_CONFIGS[tile.terrain];

        const customTileImg = AssetManager.getInstance().getTexture('terrain_' + tile.terrain);
        if (customTileImg) {
          ctx.drawImage(customTileImg, px, py, scaledTile, scaledTile);
        } else {
          // 1. Vẽ nền ô đất
          ctx.fillStyle = config.primaryColor;
          ctx.fillRect(px, py, scaledTile, scaledTile);

          // 2. Vẽ hoa văn Pixel đặc thù cho từng loại địa hình (Texture chi tiết)
          this.renderTerrainTexture(ctx, px, py, scaledTile, tile.terrain, tile.variant, config);
        }
      }
    }

    // 3. Vẽ vòng sáng cọ vẽ của Thượng Đế nếu đang rê chuột trên bản đồ
    if (hoverTile) {
      ctx.save();
      ctx.strokeStyle = '#fcc419';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.fillStyle = 'rgba(252, 196, 25, 0.15)';
      const size = tileSize * camera.zoom;
      for (let dy = -hoverTile.radius; dy <= hoverTile.radius; dy++) {
        for (let dx = -hoverTile.radius; dx <= hoverTile.radius; dx++) {
          if (dx * dx + dy * dy > hoverTile.radius * hoverTile.radius) continue;
          const x = hoverTile.x + dx;
          const y = hoverTile.y + dy;
          if (!this.worldMap.isInBounds(x, y)) continue;
          const pos = camera.worldToScreen(x * tileSize, y * tileSize, screenWidth, screenHeight);
          ctx.fillRect(pos.x, pos.y, size, size);
          ctx.strokeRect(pos.x, pos.y, size, size);
        }
      }
      ctx.restore();
    }
  }

  private renderTerrainTexture(
    ctx: CanvasRenderingContext2D,
    px: number,
    py: number,
    size: number,
    terrain: TerrainType,
    variant: number,
    config: any
  ): void {
    const p = Math.max(1, Math.floor(size / 8)); // 1 đơn vị pixel tương đối

    ctx.fillStyle = config.secondaryColor;

    if (terrain === TerrainType.MOUNTAIN) {
      // Vách đá và đỉnh tuyết
      ctx.beginPath();
      ctx.moveTo(px + size / 2, py + p * 2);
      ctx.lineTo(px + size - p * 2, py + size - p);
      ctx.lineTo(px + p * 2, py + size - p);
      ctx.fill();

      // Đỉnh tuyết trắng
      ctx.fillStyle = '#f8f9fa';
      ctx.fillRect(px + size / 2 - p, py + p * 2, p * 2, p * 2);
    } else if (terrain === TerrainType.DENSE_FOREST) {
      // Tán cây rừng rậm
      ctx.beginPath();
      ctx.arc(px + size / 2, py + size / 2, size * 0.35, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = config.accentColor;
      ctx.fillRect(px + size / 2 - p, py + size / 2 - p, p * 2, p * 2);
    } else if (terrain === TerrainType.SWAMP) {
      // Vũng nước đầm lầy
      ctx.fillRect(px + p * 2, py + p * 3, size - p * 4, p * 2);
      ctx.fillStyle = config.accentColor;
      ctx.fillRect(px + p * 3, py + p * 4, p * 2, p);
    } else if (terrain === TerrainType.HILL) {
      // Đường dốc mấp mô
      ctx.fillRect(px + p, py + size / 2, size - p * 2, p);
      if (variant > 1) {
        ctx.fillStyle = config.accentColor;
        ctx.fillRect(px + p * 2, py + size / 2 - p, p * 2, p);
      }
    } else if (terrain === TerrainType.PLAIN) {
      // Bụi cỏ nhỏ ngẫu nhiên
      if (variant % 2 === 0) {
        ctx.fillRect(px + p * 2, py + p * 3, p, p * 2);
        ctx.fillRect(px + p * 5, py + p * 4, p, p * 2);
      }
    } else if (terrain === TerrainType.PLATEAU) {
      // Vệt vân đá ngang
      ctx.fillRect(px, py + p * 2, size, p);
      ctx.fillRect(px, py + p * 5, size, p);
    } else if (terrain === TerrainType.RIVER) {
      // Dòng nước uốn lượn: gợn sóng ngang và ánh nước lấp lánh
      ctx.fillRect(px + (variant % 3) * p, py + p * 2, size - p * 3, p);
      ctx.fillRect(px + ((variant + 2) % 4) * p, py + p * 5, size - p * 2, p);
      ctx.fillStyle = config.accentColor;
      ctx.fillRect(px + ((variant * 3) % 6) * p + p, py + p * 3, p, p);
    } else if (terrain === TerrainType.LAKE) {
      // Hồ nước phẳng lặng: mặt nước và lá sen/hoa sen
      ctx.fillRect(px + p * 2, py + p * 3, size - p * 4, p);
      ctx.fillRect(px + p, py + p * 6, size - p * 3, p);
      if (variant % 3 === 0) {
        // Lá sen xanh ngọc
        ctx.fillStyle = '#2f855a';
        ctx.fillRect(px + p * 4, py + p * 2, p * 2, p * 2);
        if (variant % 6 === 0) {
          // Nụ sen hồng
          ctx.fillStyle = '#f687b3';
          ctx.fillRect(px + p * 5, py + p * 2, p, p);
        }
      } else {
        ctx.fillStyle = config.accentColor;
        ctx.fillRect(px + p * 3, py + p * 4, p * 2, p);
      }
    } else if (terrain === TerrainType.OCEAN) {
      // Biển cả bao la: vệt sóng sẫm và bọt sóng trắng dập dềnh
      ctx.fillRect(px, py + p * 3, size, p);
      ctx.fillRect(px + p, py + p * 6, size - p * 2, p);
      ctx.fillStyle = '#e0f2fe';
      const waveOffset = (variant % 4) * p;
      ctx.fillRect(px + waveOffset, py + p * 2, p * 2, p);
      ctx.fillRect(px + size - waveOffset - p * 2, py + p * 5, p * 2, p);
    }
  }
}
