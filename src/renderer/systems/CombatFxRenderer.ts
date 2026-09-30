import { ECSWorld } from '../../ecs/World.ts';
import { ViewportCamera } from '../ViewportCamera.ts';
import { EventBus } from '../../core/EventBus.ts';
import { PositionComponent } from '../../modules/beings/BeingComponents.ts';
import { ProjectileComponent } from '../../modules/combat/CombatComponents.ts';

interface FloatingText {
  x: number;
  y: number;
  text: string;
  color: string;
  isCrit: boolean;
  timer: number;
  maxTime: number;
}

interface SlashVFX {
  x: number;
  y: number;
  angle: number;
  color: string;
  timer: number;
  maxTime: number;
}

export class CombatFxRenderer {
  private floatingTexts: FloatingText[] = [];
  private slashes: SlashVFX[] = [];
  private world: ECSWorld | null = null;

  public clear(): void {
    this.floatingTexts = [];
    this.slashes = [];
  }

  constructor(world?: ECSWorld) {
    if (world) {
      this.world = world;
    }

    // Lắng nghe sự kiện chữ số sát thương nhảy lên (hỗ trợ cả tọa độ x,y lẫn entityId)
    EventBus.getInstance().on<{ x?: number; y?: number; entityId?: number; text: string; color?: string; isCrit?: boolean }>(
      'combat:floating_text',
      (data) => {
        let x = data.x;
        let y = data.y;

        if ((x === undefined || y === undefined || isNaN(x) || isNaN(y)) && data.entityId !== undefined && this.world) {
          const pos = this.world.getComponent(data.entityId, PositionComponent);
          if (pos) {
            x = pos.x;
            y = pos.y;
          }
        }

        if (x !== undefined && y !== undefined && !isNaN(x) && !isNaN(y)) {
          this.addFloatingText(x, y, data.text, data.color || '#ff6b6b', data.isCrit || false);
        }
      }
    );

    // Lắng nghe sự kiện vệt chém đao kiếm
    EventBus.getInstance().on<{ x: number; y: number; angle: number; color?: string }>(
      'combat:slash_vfx',
      (data) => {
        // BUG-02 fix: Xóa bỏ (window as any)._lastAttackedPos - không còn cần thiết
        this.slashes.push({
          x: data.x,
          y: data.y,
          angle: data.angle,
          color: data.color || '#ffffff',
          timer: 0.18,
          maxTime: 0.18
        });
      }
    );
  }

  public setWorld(world: ECSWorld): void {
    this.world = world;
  }

  public addFloatingText(x: number, y: number, text: string, color: string, isCrit: boolean = false): void {
    // Simulation at 50x can produce hundreds of events before one paint frame.
    if (this.floatingTexts.length >= 48) this.floatingTexts.shift();
    this.floatingTexts.push({
      x: x + (Math.random() * 16 - 8),
      y: y - 10,
      text,
      color,
      isCrit,
      timer: 1.1,
      maxTime: 1.1
    });
  }

  public render(
    ctx: CanvasRenderingContext2D,
    world: ECSWorld,
    camera: ViewportCamera,
    screenWidth: number,
    screenHeight: number,
    dt: number
  ): void {
    this.world = world;
    // 1. VẼ CÁC ĐẠN ĐẠO BAY (Tên, Phi Đao, Phong Nhận)
    const projectiles = world.query([PositionComponent, ProjectileComponent]);

    for (const pEnt of projectiles) {
      const pos = world.getComponent(pEnt, PositionComponent)!;
      const proj = world.getComponent(pEnt, ProjectileComponent)!;
      const sPos = camera.worldToScreen(pos.x, pos.y, screenWidth, screenHeight);

      ctx.save();
      ctx.translate(sPos.x, sPos.y);

      // Xoay theo hướng bay
      const angle = Math.atan2(proj.targetY - pos.y, proj.targetX - pos.x);
      ctx.rotate(angle);

      if (proj.type === 'arrow') {
        // Mũi tên
        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-8, 0);
        ctx.lineTo(8, 0);
        ctx.stroke();

        ctx.fillStyle = '#ced4da';
        ctx.beginPath();
        ctx.moveTo(8, 0);
        ctx.lineTo(4, -3);
        ctx.lineTo(4, 3);
        ctx.fill();
      } else if (proj.type === 'wind_blade') {
        // Phong nhận hình lưỡi liềm
        ctx.strokeStyle = '#63e6be';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#38d9a9';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(0, 0, 10, -Math.PI / 2, Math.PI / 2);
        ctx.stroke();
      } else {
        // Phi đao / phi tiêu xoay
        ctx.fillStyle = '#f8f9fa';
        ctx.fillRect(-4, -1, 8, 2);
      }

      ctx.restore();
    }

    // 2. VẼ VỆT CHÉM ĐAO KIẾM (Slash VFX)
    for (let i = this.slashes.length - 1; i >= 0; i--) {
      const s = this.slashes[i];
      s.timer -= dt;

      if (s.timer <= 0) {
        this.slashes.splice(i, 1);
        continue;
      }

      const sPos = camera.worldToScreen(s.x, s.y, screenWidth, screenHeight);
      const alpha = s.timer / s.maxTime;

      ctx.save();
      ctx.translate(sPos.x, sPos.y);
      ctx.rotate(s.angle);
      ctx.strokeStyle = s.color;
      ctx.lineWidth = 3 * camera.zoom;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(0, 0, 16 * camera.zoom, -Math.PI / 3, Math.PI / 3);
      ctx.stroke();
      ctx.restore();
    }

    // 3. VẼ CHỮ SỐ SÁT THƯƠNG NHẢY LÊN (Floating Damage Numbers)
    ctx.save();
    let visibleTextCount = 0;
    const visibleTextLimit = camera.zoom < 0.75 ? 0 : camera.zoom < 1.5 ? 3 : 5;
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.timer -= dt;
      ft.y -= dt * 25; // Bay dần lên trên

      if (ft.timer <= 0) {
        this.floatingTexts.splice(i, 1);
        continue;
      }

      const sPos = camera.worldToScreen(ft.x, ft.y, screenWidth, screenHeight);
      if (visibleTextCount >= visibleTextLimit || sPos.x < 0 || sPos.x > screenWidth ||
          sPos.y < 0 || sPos.y > screenHeight) continue;
      const alpha = Math.min(1.0, ft.timer / 0.3);

      ctx.globalAlpha = alpha;
      ctx.font = ft.isCrit
        ? '600 12px "Noto Sans Dialogue", "Noto Sans", sans-serif'
        : '500 10px "Noto Sans Dialogue", "Noto Sans", sans-serif';
      ctx.fillStyle = ft.color;
      ctx.textAlign = 'center';
      ctx.shadowBlur = 0;
      const glyphs = Array.from(ft.text);
      let text = ft.text;
      while (glyphs.length && ctx.measureText(text).width > 136) {
        glyphs.pop();
        text = `${glyphs.join('')}…`;
      }
      ctx.fillText(text, sPos.x, sPos.y);
      visibleTextCount++;
    }
    ctx.restore();
  }
}
