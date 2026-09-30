import { AnimationState, Direction } from '../../config/animations.config.ts';

export interface ProceduralCharacterDrawOptions {
  ctx: CanvasRenderingContext2D;
  screenX: number;
  screenY: number;
  size: number;
  raceId: string;
  state: AnimationState;
  direction: Direction;
  animFrame: number;
  realmColor: string;
  baseColor: string;
}

/**
 * FallbackPixelRenderer - Tự động vẽ nhân vật pixel nghệ thuật khi chưa có file ảnh ngoài
 * Có đầy đủ hoạt ảnh bước chân, hướng nhìn, ngồi thiền xếp bằng và hào quang linh khí
 */
export class FallbackPixelRenderer {
  public static drawCharacter(options: ProceduralCharacterDrawOptions): void {
    const { ctx, screenX, screenY, size, raceId, state, direction, animFrame, realmColor, baseColor } = options;

    const px = Math.floor(screenX - size / 2);
    const py = Math.floor(screenY - size / 2);

    // =========================================================================
    // XỬ LÝ ĐẶC BIỆT KHI NHÂN VẬT ĐÃ TỬ VONG (STATE === 'DEAD'): THI HÀI NẰM GỤC
    // =========================================================================
    if (state === 'dead') {
      // 1. Bóng đổ dài theo thân người nằm
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.beginPath();
      ctx.ellipse(px + size / 2, py + size - 2, size * 0.45, size * 0.12, 0, 0, Math.PI * 2);
      ctx.fill();

      // 2. Thân người nằm ngang trên mặt đất
      ctx.fillStyle = '#64748b'; // Màu áo ố xám lạnh
      ctx.fillRect(px + 4, py + size - 8, size - 8, 5);

      // Thắt lưng / y phục
      ctx.fillStyle = '#475569';
      ctx.fillRect(px + 10, py + size - 8, 3, 5);

      // Đầu người gối xuống đất (bên trái)
      ctx.fillStyle = raceId === 'demon' ? '#6b7280' : '#cbd5e1'; // Màu da tái xám
      ctx.fillRect(px + 2, py + size - 9, 6, 6);

      // Tóc xõa
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(px + 1, py + size - 10, 7, 2);

      // Mắt nhắm vĩnh hằng (vạch nhắm)
      ctx.fillStyle = '#334155';
      ctx.fillRect(px + 4, py + size - 7, 2, 1);

      // Chân duỗi thẳng (bên phải)
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(px + size - 5, py + size - 6, 3, 3);

      // Linh hồn / tàn dư linh khí bay lên nếu là tu sĩ
      if (realmColor && realmColor !== '#adb5bd') {
        const soulPhase = (Date.now() / 400) % 2;
        ctx.fillStyle = realmColor;
        ctx.globalAlpha = 0.5 - soulPhase * 0.2;
        ctx.beginPath();
        ctx.arc(px + size / 2 + Math.sin(Date.now() / 300) * 3, py + size - 12 - soulPhase * 8, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      }
      return;
    }

    // 1. Bóng đổ dưới chân
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.beginPath();
    ctx.ellipse(px + size / 2, py + size - 2, size * 0.35, size * 0.15, 0, 0, Math.PI * 2);
    ctx.fill();

    // Tính độ nảy cơ thể khi di chuyển hoặc thở khi ngồi thiền
    let bounceY = 0;
    let legOffset = 0;

    if (state === 'walk') {
      bounceY = (animFrame % 2 === 0) ? -1 : 0;
      legOffset = (animFrame % 2 === 0) ? 2 : -2;
    } else if (state === 'meditate') {
      bounceY = Math.sin(Date.now() / 400) * 1.5;
    } else if (state === 'sleep') {
      bounceY = 2; // Hạ người xuống nghỉ ngơi
    } else if (state === 'recreate') {
      bounceY = Math.sin(Date.now() / 250) * 1.5; // Nhún nhảy theo điệu múa/tiếng hát
    }

    const bodyY = py + bounceY;

    // 2. Vòng tròn Linh khí khi đang Ngồi Thiền (Meditate)
    if (state === 'meditate') {
      const time = Date.now() / 500;
      ctx.strokeStyle = realmColor;
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = 0.6 + Math.sin(time * 3) * 0.3;
      ctx.beginPath();
      ctx.arc(px + size / 2, bodyY + size / 2, size * 0.65, time, time + Math.PI * 1.5);
      ctx.stroke();
      ctx.globalAlpha = 1.0;
    }

    // 3. Chân / Bước đi (Nếu ngồi thiền hoặc ngủ thì chân thu lại)
    ctx.fillStyle = '#212529'; // Màu quần/giày
    if (state === 'meditate' || state === 'sleep') {
      // Chân xếp bằng / nằm nghỉ
      ctx.fillRect(px + 4, bodyY + size - 5, size - 8, 3);
    } else {
      // Chân trái & phải
      ctx.fillRect(px + 6, bodyY + size - 5 + (direction === 'down' || direction === 'up' ? legOffset : 0), 3, 4);
      ctx.fillRect(px + size - 9, bodyY + size - 5 - (direction === 'down' || direction === 'up' ? legOffset : 0), 3, 4);
    }

    // 4. Thân mình / Đạo bào (Màu theo chủng tộc hoặc cảnh giới)
    ctx.fillStyle = baseColor;
    ctx.fillRect(px + 5, bodyY + 7, size - 10, size - 12);

    // Dải thắt lưng / Viền áo
    ctx.fillStyle = realmColor;
    ctx.fillRect(px + 5, bodyY + 12, size - 10, 2);

    // 5. Đầu / Khuôn mặt
    ctx.fillStyle = raceId === 'demon' ? '#845ef7' : '#ffd8a8'; // Màu da
    ctx.fillRect(px + 6, bodyY + 2, size - 12, 6);

    // 6. Mắt theo hướng nhìn hoặc nhắm khi ngủ
    if (state === 'sleep') {
      // Mắt nhắm say ngủ
      ctx.fillStyle = '#495057';
      ctx.fillRect(px + 7, bodyY + 5, 2, 1);
      ctx.fillRect(px + size - 9, bodyY + 5, 2, 1);
    } else {
      ctx.fillStyle = raceId === 'demon' ? '#ff6b6b' : '#212529';
      if (direction === 'down') {
        ctx.fillRect(px + 7, bodyY + 4, 1, 2);
        ctx.fillRect(px + size - 8, bodyY + 4, 1, 2);
      } else if (direction === 'left') {
        ctx.fillRect(px + 6, bodyY + 4, 1, 2);
      } else if (direction === 'right') {
        ctx.fillRect(px + size - 7, bodyY + 4, 1, 2);
      } // Hướng 'up' nhìn từ sau lưng, không thấy mắt
    }

    // 7. Đặc trưng chủng tộc (Tóc / Tai thú / Sừng ma)
    if (raceId === 'human') {
      // Búi tóc đạo gia
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(px + 7, bodyY, size - 14, 3);
      ctx.fillRect(px + size / 2 - 2, bodyY - 2, 4, 3);
    } else if (raceId === 'beast') {
      // Tai thú nhọn
      ctx.fillStyle = '#d9480f';
      ctx.fillRect(px + 5, bodyY, 2, 3);
      ctx.fillRect(px + size - 7, bodyY, 2, 3);
    } else if (raceId === 'demon') {
      // Cặp sừng ma tộc
      ctx.fillStyle = '#343a40';
      ctx.fillRect(px + 5, bodyY - 2, 2, 4);
      ctx.fillRect(px + size - 7, bodyY - 2, 2, 4);
    }

    // 8. Hiệu ứng Hoạt cảnh Sinh hoạt Phàm Nhân
    if (state === 'sleep') {
      // Chữ "Zzz" bay bổng
      const zTime = ((Date.now() / 500) % 3);
      ctx.font = 'bold 9px monospace';
      ctx.fillStyle = 'rgba(165, 216, 255, 0.9)';
      ctx.fillText('z', px + size - 2, bodyY - 1 - zTime * 2);
      if (zTime > 1.2) ctx.fillText('Z', px + size + 2, bodyY - 6 - zTime * 2);
    } else if (state === 'cook') {
      // Nấu ăn: Lửa và khói bốc lên
      const firePhase = Math.floor((Date.now() / 150) % 3);
      ctx.fillStyle = firePhase === 0 ? '#ff922b' : (firePhase === 1 ? '#ffd43b' : '#ff6b6b');
      ctx.fillRect(px + size - 2, bodyY + size - 6, 3, 3);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.fillRect(px + size - 1, bodyY - 2 - firePhase * 2, 2, 2);
    } else if (state === 'farm') {
      // Làm ruộng: Cây lúa / cuốc cày
      const swing = (animFrame % 2 === 0);
      ctx.fillStyle = '#862e9c';
      ctx.fillRect(px + (direction === 'left' ? 1 : size - 3), bodyY + (swing ? 2 : 6), 2, 6);
      ctx.fillStyle = '#40c057'; // Mầm mạ non
      ctx.fillRect(px + size / 2, bodyY + size - 2, 3, 2);
    } else if (state === 'build') {
      // Xây dựng: Búa gõ tia lửa
      const hammerDown = (animFrame % 2 === 0);
      ctx.fillStyle = '#ced4da';
      ctx.fillRect(px + size - 3, bodyY + (hammerDown ? 8 : 4), 4, 3);
      ctx.fillStyle = '#ffd43b'; // Tia lửa
      ctx.fillRect(px + size, bodyY + 7, 2, 2);
    } else if (state === 'recreate') {
      // Giải trí: Nốt nhạc múa hát
      const noteTime = ((Date.now() / 400) % 2);
      ctx.font = '10px serif';
      ctx.fillStyle = '#f06595';
      ctx.fillText('♪', px + size - 1, bodyY - noteTime * 4);
    }
  }

  /**
   * Dựng hình Ngôi Mộ (Bia đá, gò đất, bát hương nghi ngút khói, hào quang cảnh giới)
   */
  public static drawGrave(
    ctx: CanvasRenderingContext2D,
    screenX: number,
    screenY: number,
    size: number,
    realmColor: string = '#ffd43b',
    realmStageIndex: number = 0
  ): void {
    const px = Math.floor(screenX - size / 2);
    const py = Math.floor(screenY - size / 2);

    // 1. Bóng đổ
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(px + size / 2, py + size - 1, size * 0.45, size * 0.16, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Gò đất / Bệ đá mộ
    ctx.fillStyle = '#4b5563';
    ctx.beginPath();
    ctx.ellipse(px + size / 2, py + size - 3, size * 0.38, size * 0.12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Cỏ xanh mọc chân mộ
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(px + Math.floor(size * 0.2), py + size - 4, 2, 2);
    ctx.fillRect(px + Math.floor(size * 0.7), py + size - 4, 2, 2);

    // 3. Tấm Bia Đá Cổ
    const tabletW = Math.max(10, Math.floor(size * 0.45));
    const tabletH = Math.max(13, Math.floor(size * 0.65));
    const tx = px + Math.floor((size - tabletW) / 2);
    const ty = py + size - 4 - tabletH;

    // Hào quang tu vi nếu là tu sĩ cảnh giới cao
    if (realmStageIndex > 0) {
      ctx.save();
      ctx.strokeStyle = realmColor;
      ctx.lineWidth = 1.2;
      ctx.globalAlpha = 0.5 + Math.sin(Date.now() / 400) * 0.25;
      ctx.strokeRect(tx - 2, ty - 2, tabletW + 4, tabletH + 4);
      ctx.restore();
    }

    // Mặt bia đá
    ctx.fillStyle = '#334155'; // Xám đen cổ kính
    ctx.fillRect(tx, ty, tabletW, tabletH);

    // Viền bia đá
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1;
    ctx.strokeRect(tx, ty, tabletW, tabletH);

    // Đỉnh bia cong
    ctx.fillStyle = '#475569';
    ctx.fillRect(tx + 2, ty - 2, tabletW - 4, 2);

    // Văn bia khắc chữ (vạch chữ cổ)
    ctx.fillStyle = realmStageIndex > 0 ? realmColor : '#94a3b8';
    const lineX = tx + Math.floor(tabletW / 2);
    ctx.fillRect(lineX - 1, ty + 3, 2, tabletH - 7);

    // 4. Lư hương nhỏ trước mộ
    const potX = lineX - 2;
    const potY = py + size - 5;
    ctx.fillStyle = '#b45309'; // Đồng thau
    ctx.fillRect(potX, potY, 5, 3);

    // Nén hương đang cháy đỏ
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(potX + 1, potY - 3, 1, 3);
    ctx.fillRect(potX + 3, potY - 3, 1, 3);

    // Làn khói hương nghi ngút uốn lượn
    const smokePhase = (Date.now() / 350) % 2;
    ctx.fillStyle = 'rgba(226, 232, 240, 0.7)';
    ctx.beginPath();
    ctx.arc(potX + 2 + Math.sin(Date.now() / 250) * 2, potY - 5 - smokePhase * 4, 1.2, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * Dựng hình Túi di vật / Bọc đồ rơi ngoài đất
   */
  public static drawDroppedLoot(
    ctx: CanvasRenderingContext2D,
    screenX: number,
    screenY: number,
    size: number
  ): void {
    const px = Math.floor(screenX - size / 2);
    const py = Math.floor(screenY - size / 2);

    // 1. Bóng đổ
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(px + size / 2, py + size - 2, size * 0.3, size * 0.12, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Túi da trữ vật
    const bagW = Math.max(10, Math.floor(size * 0.45));
    const bagH = Math.max(9, Math.floor(size * 0.4));
    const bx = px + Math.floor((size - bagW) / 2);
    const by = py + size - 3 - bagH;

    ctx.fillStyle = '#b45309'; // Da nâu vàng
    ctx.fillRect(bx, by, bagW, bagH);

    // Nút thắt miệng túi
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(bx + 2, by - 2, bagW - 4, 3);

    // Dây thắt vàng kim
    ctx.fillStyle = '#fde047';
    ctx.fillRect(bx, by + 2, bagW, 1);

    // Hiệu ứng ánh sáng bảo vật lấp lánh nhẹ
    const pulse = Math.sin(Date.now() / 200);
    if (pulse > 0.3) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(bx + bagW - 2, by - 1, 2, 2);
    }
  }
}

