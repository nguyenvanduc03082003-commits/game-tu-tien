import { QiGrid } from '../../modules/energy/QiGrid.ts';
import { WorldMap } from '../../modules/world/WorldMap.ts';
import { ViewportCamera } from '../ViewportCamera.ts';
import { ELEMENT_CONFIGS } from '../../config/elements.config.ts';
import { getElevationBand } from '../../modules/world/ElevationRules.ts';

export class QiOverlayRenderer {
  public showQi: boolean = false;
  public showTemperature: boolean = false;
  public showElevation: boolean = false;

  public setOverlayMode(mode: 'none' | 'qi' | 'temperature' | 'elevation'): void {
    this.showQi = mode === 'qi';
    this.showTemperature = mode === 'temperature';
    this.showElevation = mode === 'elevation';
  }

  public render(
    ctx: CanvasRenderingContext2D,
    qiGrid: QiGrid,
    worldMap: WorldMap,
    camera: ViewportCamera,
    screenWidth: number,
    screenHeight: number
  ): void {
    if (!this.showQi && !this.showTemperature && !this.showElevation) return;

    const tileSize = worldMap.tileSize;
    const bounds = camera.getVisibleBounds(screenWidth, screenHeight);

    const minTileX = Math.max(0, Math.floor(bounds.minX / tileSize));
    const maxTileX = Math.min(worldMap.width - 1, Math.ceil(bounds.maxX / tileSize));
    const minTileY = Math.max(0, Math.floor(bounds.minY / tileSize));
    const maxTileY = Math.min(worldMap.height - 1, Math.ceil(bounds.maxY / tileSize));

    const scaledTile = Math.ceil(tileSize * camera.zoom);

    ctx.save();

    for (let ty = minTileY; ty <= maxTileY; ty++) {
      for (let tx = minTileX; tx <= maxTileX; tx++) {
        const screenPos = camera.worldToScreen(tx * tileSize, ty * tileSize, screenWidth, screenHeight);
        const px = Math.floor(screenPos.x);
        const py = Math.floor(screenPos.y);

        // 1. CHẾ ĐỘ LỚP PHỦ LINH KHÍ & NGŨ HÀNH
        if (this.showQi) {
          const qiTile = qiGrid.getTile(tx, ty);
          if (qiTile && qiTile.density > 5) {
            const alpha = Math.min(0.7, (qiTile.density / 350) * 0.55 + 0.1);

            if (qiTile.tier === 'hon_don_khi') {
              ctx.fillStyle = `rgba(186, 104, 200, ${Math.min(0.85, alpha + 0.3)})`;
            } else if (qiTile.tier === 'tien_khi') {
              ctx.fillStyle = `rgba(255, 241, 118, ${Math.min(0.85, alpha + 0.25)})`;
            } else {
              const elemCfg = ELEMENT_CONFIGS[qiTile.dominantElement];
              ctx.fillStyle = elemCfg ? elemCfg.color : '#40c057';
            }

            ctx.globalAlpha = alpha;
            ctx.fillRect(px, py, scaledTile, scaledTile);

            // Mắt Linh Mạch: vẽ chấm sáng giữa ô
            if (qiTile.isSpiritVein) {
              ctx.fillStyle = '#ffffff';
              ctx.globalAlpha = 0.9;
              ctx.fillRect(px + scaledTile * 0.35, py + scaledTile * 0.35, scaledTile * 0.3, scaledTile * 0.3);
            }
          }
        }
        // 2. CHẾ ĐỘ LỚP PHỦ BẢN ĐỒ NHIỆT ĐỘ
        else if (this.showTemperature) {
          const mapTile = worldMap.getTile(tx, ty);
          if (mapTile) {
            const temp = mapTile.temperature;
            let color = 'rgba(40, 167, 69, 0.4)'; // Ôn hòa

            if (temp < 0) {
              color = 'rgba(0, 123, 255, 0.55)'; // Băng giá
            } else if (temp < 12) {
              color = 'rgba(23, 162, 184, 0.45)'; // Se lạnh
            } else if (temp > 32) {
              color = 'rgba(220, 53, 69, 0.55)';  // Nóng bức
            } else if (temp > 24) {
              color = 'rgba(255, 193, 7, 0.45)';  // Ấm áp
            }

            ctx.fillStyle = color;
            ctx.globalAlpha = 0.55;
            ctx.fillRect(px, py, scaledTile, scaledTile);
          }
        }
        // 3. CHẾ ĐỘ LỚP PHỦ ĐỘ CAO
        else if (this.showElevation) {
          const mapTile = worldMap.getTile(tx, ty);
          if (mapTile) {
            const band = getElevationBand(mapTile.elevation);
            let color = 'rgba(46, 160, 130, 0.45)';
            switch (band) {
              case 'lowland':
                color = 'rgba(25, 75, 180, 0.52)'; // Vùng trũng
                break;
              case 'low':
                color = 'rgba(38, 166, 120, 0.45)'; // Vùng thấp
                break;
              case 'middle':
                color = 'rgba(195, 175, 35, 0.45)'; // Trung bình
                break;
              case 'high':
                color = 'rgba(220, 115, 30, 0.50)'; // Vùng cao
                break;
              case 'summit':
                color = 'rgba(245, 248, 255, 0.68)'; // Đỉnh núi
                break;
            }

            ctx.fillStyle = color;
            ctx.globalAlpha = 0.55;
            ctx.fillRect(px, py, scaledTile, scaledTile);
          }
        }
      }
    }

    ctx.restore();
  }
}
