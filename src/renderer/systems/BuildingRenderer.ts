import { ECSWorld } from '../../ecs/World.ts';
import { ViewportCamera } from '../ViewportCamera.ts';
import { PositionComponent } from '../../modules/beings/BeingComponents.ts';
import { BuildingComponent, ConstructionSiteComponent, FactionComponent } from '../../modules/factions/FactionComponents.ts';
import { FactionFactory } from '../../modules/factions/FactionFactory.ts';
import { AssetManager } from '../assets/AssetManager.ts';

export class BuildingRenderer {
  public render(
    ctx: CanvasRenderingContext2D,
    world: ECSWorld,
    camera: ViewportCamera,
    screenWidth: number,
    screenHeight: number
  ): void {
    const buildings = world.query([PositionComponent, BuildingComponent]);
    const bounds = camera.getVisibleBounds(screenWidth, screenHeight);

    for (const bEnt of buildings) {
      const pos = world.getComponent(bEnt, PositionComponent)!;
      const bComp = world.getComponent(bEnt, BuildingComponent)!;

      const wPx = bComp.widthTiles * 16;
      const hPx = bComp.heightTiles * 16;

      // Culling
      if (
        pos.x + wPx < bounds.minX ||
        pos.x > bounds.maxX ||
        pos.y + hPx < bounds.minY ||
        pos.y > bounds.maxY
      ) {
        continue;
      }

      const sPos = camera.worldToScreen(pos.x, pos.y, screenWidth, screenHeight);
      const sW = wPx * camera.zoom;
      const sH = hPx * camera.zoom;

      // Tìm thông tin môn phái
      const fEnt = FactionFactory.findFactionEntity(world, bComp.factionId);
      let factionColor = '#1f6feb';
      if (fEnt !== null) {
        const fComp = world.getComponent(fEnt, FactionComponent);
        if (fComp) factionColor = fComp.color;
      }

      ctx.save();

      const customImg = AssetManager.getInstance().getTexture('building_' + bComp.buildingType);
      if (customImg) {
        ctx.drawImage(customImg, sPos.x, sPos.y, sW, sH);
      } else {
        switch (bComp.buildingType) {
          case 'sect_hall':
            this.drawSectHall(ctx, sPos.x, sPos.y, sW, sH, camera.zoom, factionColor);
            break;
          case 'meditation_cave':
            this.drawMeditationCave(ctx, sPos.x, sPos.y, sW, sH, camera.zoom, bComp.occupantEntityId !== null);
            break;
          case 'herb_garden':
            this.drawHerbGarden(ctx, sPos.x, sPos.y, sW, sH, camera.zoom);
            break;
          case 'alchemy_chamber':
            this.drawAlchemyChamber(ctx, sPos.x, sPos.y, sW, sH, camera.zoom);
            break;
          case 'scripture_pavilion':
            this.drawScripturePavilion(ctx, sPos.x, sPos.y, sW, sH, camera.zoom, factionColor);
            break;
          case 'defense_array':
            this.drawDefenseArray(ctx, sPos.x, sPos.y, sW, sH, camera.zoom, factionColor);
            break;
          case 'thatched_hut':
            this.drawThatchedHut(ctx, sPos.x, sPos.y, sW, sH, camera.zoom);
            break;
          case 'village_well':
            this.drawVillageWell(ctx, sPos.x, sPos.y, sW, sH, camera.zoom);
            break;
          case 'mortal_farm':
            this.drawMortalFarm(ctx, sPos.x, sPos.y, sW, sH, camera.zoom);
            break;
          case 'campfire':
            this.drawCampfire(ctx, sPos.x, sPos.y, sW, sH, camera.zoom);
            break;
        }
      }

      // Hiển thị tiến độ thi công nếu công trình đang xây dựng
      if (bComp.isUnderConstruction) {
        const siteComp = world.getComponent(bEnt, ConstructionSiteComponent);
        const ratio = siteComp ? siteComp.progressRatio : 0;
        const pct = Math.floor(ratio * 100);

        // Hiệu ứng giàn giáo mờ
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.fillRect(sPos.x, sPos.y, sW, sH);

        // Khung tiến độ (progress bar)
        const barW = Math.max(26 * camera.zoom, sW * 0.85);
        const barH = Math.max(5, 6 * camera.zoom);
        const barX = sPos.x + (sW - barW) / 2;
        const barY = sPos.y + sH / 2 - barH / 2;

        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);

        ctx.fillStyle = '#f59f00';
        ctx.fillRect(barX, barY, barW * Math.min(1, Math.max(0, ratio)), barH);

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX - 1, barY - 1, barW + 2, barH + 2);

        if (camera.zoom >= 0.75) {
          ctx.textAlign = 'center';
          ctx.font = `bold ${Math.max(8, Math.floor(9 * camera.zoom))}px "Segoe UI", sans-serif`;
          ctx.fillStyle = '#ffec99';
          ctx.fillText(`🔨 ${pct}%`, sPos.x + sW / 2, barY - 3);
        }
      }

      // Vẽ Tên Công Trình & Môn Phái khi Zoom gần
      if (camera.zoom >= 1.0) {
        ctx.textAlign = 'center';
        ctx.font = `bold ${Math.max(9, Math.floor(10 * camera.zoom))}px "Segoe UI", sans-serif`;
        ctx.fillStyle = bComp.isUnderConstruction ? '#ffec99' : '#ffffff';
        const displayName = bComp.isUnderConstruction ? `🔨 ${bComp.name} (Đang dựng)` : bComp.name;
        ctx.fillText(displayName, sPos.x + sW / 2, sPos.y - 4);
      }

      ctx.restore();
    }
  }

  // 1. TÔNG MÔN ĐẠI ĐIỆN (Mái ngói cong cổ phong, cột đỏ, cờ phái)
  private drawSectHall(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    zoom: number,
    bannerColor: string
  ): void {
    // Tường nhà
    ctx.fillStyle = '#8c1d18';
    ctx.fillRect(x + 4 * zoom, y + 8 * zoom, w - 8 * zoom, h - 8 * zoom);

    // Cửa chính
    ctx.fillStyle = '#212529';
    ctx.fillRect(x + w / 2 - 4 * zoom, y + h - 10 * zoom, 8 * zoom, 10 * zoom);

    // Mái ngói cong cổ phong
    ctx.fillStyle = '#ffd43b';
    ctx.beginPath();
    ctx.moveTo(x - 4 * zoom, y + 10 * zoom);
    ctx.lineTo(x + w / 2, y - 4 * zoom);
    ctx.lineTo(x + w + 4 * zoom, y + 10 * zoom);
    ctx.lineTo(x + w - 2 * zoom, y + 12 * zoom);
    ctx.lineTo(x + w / 2, y + 2 * zoom);
    ctx.lineTo(x + 2 * zoom, y + 12 * zoom);
    ctx.closePath();
    ctx.fill();

    // Cột cờ môn phái
    ctx.fillStyle = '#ced4da';
    ctx.fillRect(x + 2 * zoom, y - 6 * zoom, 2 * zoom, 14 * zoom);
    ctx.fillStyle = bannerColor;
    ctx.fillRect(x + 4 * zoom, y - 6 * zoom, 8 * zoom, 6 * zoom);
  }

  // 2. ĐỘNG PHỦ BẾ QUAN (Cửa hang đá, phù văn phát quang)
  private drawMeditationCave(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    zoom: number,
    isOccupied: boolean
  ): void {
    // Tảng đá cửa động
    ctx.fillStyle = '#495057';
    ctx.beginPath();
    ctx.arc(x + w / 2, y + h / 2, w / 2, 0, Math.PI * 2);
    ctx.fill();

    // Vòm hang tối sâu
    ctx.fillStyle = '#121212';
    ctx.beginPath();
    ctx.arc(x + w / 2, y + h * 0.6, w * 0.35, Math.PI, 0);
    ctx.fill();

    // Phù văn linh quang
    ctx.strokeStyle = isOccupied ? '#38d9a9' : '#74c0fc';
    ctx.lineWidth = 1.5 * zoom;
    ctx.beginPath();
    ctx.arc(x + w / 2, y + h * 0.6, w * 0.42, 0, Math.PI * 2);
    ctx.stroke();

    if (isOccupied) {
      // Hào quang bế quan xoay tròn
      ctx.fillStyle = 'rgba(56, 217, 169, 0.25)';
      ctx.beginPath();
      ctx.arc(x + w / 2, y + h * 0.6, w * 0.45, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 3. LINH DƯỢC ĐIỀN (Luống đất màu mỡ, thảo dược nhấp nhô)
  private drawHerbGarden(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    zoom: number
  ): void {
    // Đất trồng màu nâu
    ctx.fillStyle = '#5c4033';
    ctx.fillRect(x, y, w, h);

    // Luống cày
    ctx.fillStyle = '#42281a';
    for (let i = 4 * zoom; i < h; i += 7 * zoom) {
      ctx.fillRect(x, y + i, w, 2 * zoom);
    }

    // Các mầm thảo dược xanh mơn mởn
    ctx.fillStyle = '#69db7c';
    const spots = [
      { rx: 0.25, ry: 0.3 },
      { rx: 0.65, ry: 0.3 },
      { rx: 0.45, ry: 0.6 },
      { rx: 0.75, ry: 0.75 },
      { rx: 0.2, ry: 0.75 }
    ];
    for (const sp of spots) {
      ctx.beginPath();
      ctx.arc(x + w * sp.rx, y + h * sp.ry, 2.5 * zoom, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 4. LUYỆN ĐAN PHÒNG (Phòng gạch đỏ, Lò Bát Quái tỏa khói)
  private drawAlchemyChamber(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    zoom: number
  ): void {
    // Nhà gạch
    ctx.fillStyle = '#c92a2a';
    ctx.fillRect(x + 2 * zoom, y + 4 * zoom, w - 4 * zoom, h - 4 * zoom);

    // Lò Bát Quái bằng đồng
    const cx = x + w / 2;
    const cy = y + h / 2 + 2 * zoom;

    ctx.fillStyle = '#f59f00';
    ctx.beginPath();
    ctx.arc(cx, cy, 5 * zoom, 0, Math.PI * 2);
    ctx.fill();

    // Ngọn lửa tiên dưới đáy lò
    ctx.fillStyle = '#ff6b6b';
    ctx.beginPath();
    ctx.moveTo(cx - 3 * zoom, cy + 5 * zoom);
    ctx.lineTo(cx, cy + 9 * zoom);
    ctx.lineTo(cx + 3 * zoom, cy + 5 * zoom);
    ctx.closePath();
    ctx.fill();

    // Ống khói bốc hơi
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fillRect(cx - 1 * zoom, y - 3 * zoom, 2 * zoom, 5 * zoom);
  }

  // 5. TÀNG KINH CÁC (Tháp gỗ nhiều tầng)
  private drawScripturePavilion(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    _h: number,
    zoom: number,
    accentColor: string
  ): void {
    const cx = x + w / 2;

    // Tầng 1
    ctx.fillStyle = '#493225';
    ctx.fillRect(cx - 9 * zoom, y + 10 * zoom, 18 * zoom, 12 * zoom);

    // Tầng 2
    ctx.fillStyle = '#5c3d2e';
    ctx.fillRect(cx - 7 * zoom, y + 3 * zoom, 14 * zoom, 8 * zoom);

    // Mái ngói tầng 2
    ctx.fillStyle = accentColor;
    ctx.beginPath();
    ctx.moveTo(cx - 11 * zoom, y + 4 * zoom);
    ctx.lineTo(cx, y - 2 * zoom);
    ctx.lineTo(cx + 11 * zoom, y + 4 * zoom);
    ctx.closePath();
    ctx.fill();
  }

  // 6. HỘ TÔNG TRẬN PHÁP (Trụ đá tinh thể tỏa kết giới)
  private drawDefenseArray(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    zoom: number,
    arrayColor: string
  ): void {
    const cx = x + w / 2;
    const cy = y + h / 2;

    // Trụ đá
    ctx.fillStyle = '#343a40';
    ctx.fillRect(cx - 3 * zoom, cy - 8 * zoom, 6 * zoom, 16 * zoom);

    // Viên tinh thể trận nhãn phát sáng trên đỉnh
    ctx.fillStyle = arrayColor;
    ctx.shadowColor = arrayColor;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(cx, cy - 8 * zoom, 4 * zoom, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Vòng phù văn ma pháp xoay quanh chân trụ
    ctx.strokeStyle = arrayColor;
    ctx.lineWidth = 1 * zoom;
    ctx.beginPath();
    ctx.ellipse(cx, cy + 6 * zoom, 9 * zoom, 4 * zoom, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  // 7. NHÀ TRANH / LỀU GỖ (Mái rơm vàng, tường gỗ ấm cúng, cửa sổ mở)
  private drawThatchedHut(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    zoom: number
  ): void {
    // Tường gỗ nâu đất
    ctx.fillStyle = '#854d0e';
    ctx.fillRect(x + 3 * zoom, y + 8 * zoom, w - 6 * zoom, h - 8 * zoom);

    // Cửa chính
    ctx.fillStyle = '#451a03';
    ctx.fillRect(x + w / 2 - 3 * zoom, y + h - 8 * zoom, 6 * zoom, 8 * zoom);

    // Cửa sổ nhỏ
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(x + 5 * zoom, y + 10 * zoom, 4 * zoom, 4 * zoom);

    // Mái rơm vàng rực rỡ hình tam giác
    ctx.fillStyle = '#ca8a04';
    ctx.beginPath();
    ctx.moveTo(x + w / 2, y - 2 * zoom);
    ctx.lineTo(x + w + 3 * zoom, y + 9 * zoom);
    ctx.lineTo(x - 3 * zoom, y + 9 * zoom);
    ctx.closePath();
    ctx.fill();

    // Rơm rạ viền mái
    ctx.fillStyle = '#eab308';
    ctx.fillRect(x - 2 * zoom, y + 8 * zoom, w + 4 * zoom, 2 * zoom);
  }

  // 8. GIẾNG NƯỚC THÔN DÂN (Bờ đá, ròng rọc, nước xanh ngọc)
  private drawVillageWell(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    zoom: number
  ): void {
    const cx = x + w / 2;
    const cy = y + h / 2;

    // Bờ giếng đá tròn
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.arc(cx, cy, 6 * zoom, 0, Math.PI * 2);
    ctx.fill();

    // Lòng giếng nước trong xanh
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.arc(cx, cy, 4 * zoom, 0, Math.PI * 2);
    ctx.fill();

    // Cột ròng rọc gỗ
    ctx.fillStyle = '#78350f';
    ctx.fillRect(cx - 5 * zoom, cy - 8 * zoom, 2 * zoom, 8 * zoom);
    ctx.fillRect(cx + 3 * zoom, cy - 8 * zoom, 2 * zoom, 8 * zoom);
    ctx.fillRect(cx - 5 * zoom, cy - 8 * zoom, 10 * zoom, 2 * zoom);

    // Mái che giếng nhỏ
    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.moveTo(cx, cy - 11 * zoom);
    ctx.lineTo(cx + 7 * zoom, cy - 8 * zoom);
    ctx.lineTo(cx - 7 * zoom, cy - 8 * zoom);
    ctx.closePath();
    ctx.fill();
  }

  // 9. RUỘNG LÚA NƯỚC (Luống đất cày, mạ non xanh mướt, nước óng ánh)
  private drawMortalFarm(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    zoom: number
  ): void {
    // Đất bùn màu mỡ
    ctx.fillStyle = '#713f12';
    ctx.fillRect(x + 2 * zoom, y + 2 * zoom, w - 4 * zoom, h - 4 * zoom);

    // Rãnh nước tưới
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(x + 4 * zoom, y + h / 2 - 1 * zoom, w - 8 * zoom, 2 * zoom);

    // Các khóm lúa vàng ươm trĩu hạt
    ctx.fillStyle = '#eab308';
    const rows = 3;
    const cols = 4;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const lx = x + (5 + c * 5) * zoom;
        const ly = y + (4 + r * 6) * zoom;
        ctx.fillRect(lx, ly, 2 * zoom, 3 * zoom);
        ctx.fillStyle = '#84cc16';
        ctx.fillRect(lx + 1 * zoom, ly - 1 * zoom, 1 * zoom, 2 * zoom);
        ctx.fillStyle = '#eab308';
      }
    }
  }

  // 10. LỬA TRẠI THÔN XÓM (Đống củi, ngọn lửa bập bùng, ánh sáng vàng)
  private drawCampfire(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    zoom: number
  ): void {
    const cx = x + w / 2;
    const cy = y + h / 2;

    // Vòng đá chắn lửa
    ctx.fillStyle = '#64748b';
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      ctx.fillRect(cx + Math.cos(angle) * 6 * zoom - 1 * zoom, cy + Math.sin(angle) * 5 * zoom - 1 * zoom, 2 * zoom, 2 * zoom);
    }

    // Các thanh củi gỗ bắt chéo
    ctx.fillStyle = '#78350f';
    ctx.fillRect(cx - 4 * zoom, cy - 1 * zoom, 8 * zoom, 2 * zoom);
    ctx.fillRect(cx - 1 * zoom, cy - 4 * zoom, 2 * zoom, 8 * zoom);

    // Ngọn lửa bập bùng chuyển động theo thời gian
    const flicker = Math.sin(Date.now() / 150) * 1.5 * zoom;
    ctx.fillStyle = '#ea580c';
    ctx.beginPath();
    ctx.arc(cx, cy - 1 * zoom, (4 * zoom) + flicker * 0.5, 0, Math.PI * 2);
    ctx.fill();

    // Lõi lửa vàng rực
    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.arc(cx, cy - 2 * zoom, (2.2 * zoom) + flicker * 0.3, 0, Math.PI * 2);
    ctx.fill();
  }
}
