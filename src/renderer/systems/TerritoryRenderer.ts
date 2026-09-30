import { ECSWorld } from '../../ecs/World.ts';
import { ViewportCamera } from '../ViewportCamera.ts';
import { PositionComponent } from '../../modules/beings/BeingComponents.ts';
import {
  TerritoryCenterComponent,
  FactionComponent,
  SettlementComponent
} from '../../modules/factions/FactionComponents.ts';
import { FactionFactory } from '../../modules/factions/FactionFactory.ts';
import { isCivilFactionType } from '../../config/factions.config.ts';

export class TerritoryRenderer {
  public showCivilTerritories: boolean = true;
  public showSectTerritories: boolean = true;
  public showProtectorateZones: boolean = true;

  public render(
    ctx: CanvasRenderingContext2D,
    world: ECSWorld,
    camera: ViewportCamera,
    screenWidth: number,
    screenHeight: number
  ): void {
    const centers = world.query([PositionComponent, TerritoryCenterComponent]);

    // Territories of the same layer share a visible map. Clip each disk by peer
    // disks so one settlement/faction does not paint over another's boundary.
    const territorialPeers = (centerId: number, layerType: string) => centers
      .filter(otherId => otherId !== centerId)
      .filter(otherId => world.getComponent(otherId, TerritoryCenterComponent)?.layerType === layerType)
      .map(otherId => ({
        pos: world.getComponent(otherId, PositionComponent)!,
        territory: world.getComponent(otherId, TerritoryCenterComponent)!
      }));

    for (const cEnt of centers) {
      const pos = world.getComponent(cEnt, PositionComponent)!;
      const tc = world.getComponent(cEnt, TerritoryCenterComponent)!;

      const fEnt = FactionFactory.findFactionEntity(world, tc.factionId);
      const faction = fEnt !== null ? world.getComponent(fEnt, FactionComponent) : undefined;
      const isCivil = faction ? isCivilFactionType(faction.type) : tc.layerType === 'civil';

      if (isCivil && !this.showCivilTerritories) continue;
      if (!isCivil && tc.layerType !== 'protectorate' && !this.showSectTerritories) continue;
      if (tc.layerType === 'protectorate' && !this.showProtectorateZones) continue;

      const sPos = camera.worldToScreen(pos.x, pos.y, screenWidth, screenHeight);
      const sRadius = tc.radiusPixels * camera.zoom;

      // Culling: Bỏ qua nếu vòng tròn hoàn toàn ngoài màn hình
      if (
        sPos.x + sRadius < 0 ||
        sPos.x - sRadius > screenWidth ||
        sPos.y + sRadius < 0 ||
        sPos.y - sRadius > screenHeight
      ) {
        continue;
      }

      ctx.save();

      const peers = territorialPeers(cEnt, tc.layerType);
      if (peers.length) {
        ctx.beginPath();
        ctx.arc(sPos.x, sPos.y, sRadius, 0, Math.PI * 2);
        for (const peer of peers) {
          const pScreen = camera.worldToScreen(peer.pos.x, peer.pos.y, screenWidth, screenHeight);
          ctx.arc(pScreen.x, pScreen.y, peer.territory.radiusPixels * camera.zoom, 0, Math.PI * 2);
        }
        ctx.clip('evenodd');
      }

      // 1. Phủ mờ hào quang lãnh thổ
      const fillAlpha = isCivil ? 0.05 : 0.08;
      ctx.fillStyle = this.hexToRgba(tc.color, fillAlpha);
      ctx.beginPath();
      ctx.arc(sPos.x, sPos.y, sRadius, 0, Math.PI * 2);
      ctx.fill();

      // 2. Viền lãnh thổ phân biệt theo Dân Sinh (Thôn/Làng/Vương Quốc) và Tu Luyện (Tông Môn/Thánh Địa)
      ctx.strokeStyle = tc.color;
      ctx.lineWidth = Math.max(1.5, (faction?.type === 'kingdom' || faction?.type === 'holy_land' ? 2.6 : 1.8) * camera.zoom);
      if (isCivil) {
        ctx.setLineDash([5 * camera.zoom, 4 * camera.zoom]);
      } else {
        ctx.setLineDash([9 * camera.zoom, 6 * camera.zoom]);
        ctx.shadowColor = tc.color;
        ctx.shadowBlur = faction?.type === 'holy_land' ? 12 : 7;
      }

      ctx.beginPath();
      ctx.arc(sPos.x, sPos.y, sRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.shadowBlur = 0;

      // Vòng bảo hộ (Protectorate) nếu điểm định cư được một Tông Môn bảo hộ
      if (this.showProtectorateZones && tc.settlementId) {
        const sEnt = FactionFactory.findSettlementEntity(world, tc.settlementId);
        const sComp = sEnt !== null ? world.getComponent(sEnt, SettlementComponent) : undefined;
        if (sComp && sComp.protectorFactionId) {
          const pEnt = FactionFactory.findFactionEntity(world, sComp.protectorFactionId);
          const pFaction = pEnt !== null ? world.getComponent(pEnt, FactionComponent) : undefined;
          if (pFaction) {
            ctx.strokeStyle = pFaction.color;
            ctx.lineWidth = Math.max(1, 1.2 * camera.zoom);
            ctx.setLineDash([3 * camera.zoom, 5 * camera.zoom]);
            ctx.beginPath();
            ctx.arc(sPos.x, sPos.y, sRadius + 6 * camera.zoom, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
          }
        }
      }

      // 3. Hiển thị Tên Thế Lực / Điểm Định Cư & Bậc Phát Triển ở viền đỉnh lãnh thổ
      if (faction) {
        let icon = '🚩';
        if (faction.type === 'hamlet') icon = '🏡';
        else if (faction.type === 'village') icon = '🏘️';
        else if (faction.type === 'kingdom') icon = '👑';
        else if (faction.type === 'sect') icon = '🏯';
        else if (faction.type === 'holy_land') icon = '🌟';

        let labelName = faction.name;
        if (tc.settlementId && faction.settlementIds.length > 1) {
          const sEnt = FactionFactory.findSettlementEntity(world, tc.settlementId);
          const sComp = sEnt !== null ? world.getComponent(sEnt, SettlementComponent) : undefined;
          if (sComp && sComp.name !== faction.name) {
            labelName = `${sComp.name} (${faction.name})`;
          }
        }

        ctx.textAlign = 'center';
        ctx.font = `bold ${Math.max(10, Math.floor(12 * camera.zoom))}px "Segoe UI", sans-serif`;
        ctx.fillStyle = tc.color;
        ctx.fillText(`${icon} ${labelName} [${faction.getRankName()}]`, sPos.x, sPos.y - sRadius - 6);
      }

      ctx.restore();
    }
  }

  private hexToRgba(hex: string, alpha: number): string {
    let c = hex.replace('#', '');
    if (c.length === 3) {
      c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
    }
    const num = parseInt(c, 16);
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
}
