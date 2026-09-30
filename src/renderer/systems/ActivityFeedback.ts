import { EventBus } from '../../core/EventBus.ts';
import { ECSWorld } from '../../ecs/World.ts';
import { PositionComponent } from '../../modules/beings/BeingComponents.ts';
import { ViewportCamera } from '../ViewportCamera.ts';
import { OverlayRect } from './DialogueRenderer.ts';

export interface ActivityFeedbackEvent {
  entityId: number;
  text: string;
  color?: string;
}

interface ActivityEntry extends ActivityFeedbackEvent {
  receivedAt: number;
  visibleUntil: number;
  icon: string;
  shortLabel: string;
}

/** Recent activities are readable in the inspector, even when map labels are hidden. */
export class ActivityFeedback {
  private static instance: ActivityFeedback | null = null;
  private entries = new Map<number, ActivityEntry>();
  private lastVisualAt = -Infinity;

  private constructor(private readonly now: () => number = () => performance.now()) {
    EventBus.getInstance().on<ActivityFeedbackEvent>('activity:feedback', event => this.record(event));
  }

  public static getInstance(): ActivityFeedback {
    if (!this.instance) this.instance = new ActivityFeedback();
    return this.instance;
  }

  public clear(): void {
    this.entries.clear();
    this.lastVisualAt = -Infinity;
  }

  public getRecent(entityId: number): string | null {
    const entry = this.entries.get(entityId);
    return entry && this.now() - entry.receivedAt < 5000 ? entry.text : null;
  }

  private record(event: ActivityFeedbackEvent): void {
    if (!event || !Number.isInteger(event.entityId) || !event.text?.trim()) return;
    const now = this.now();
    const previous = this.entries.get(event.entityId);
    const { icon, shortLabel } = this.describe(event.text);
    const mayShow = now - this.lastVisualAt >= 300 &&
      (!previous || now - previous.receivedAt >= 1500);
    if (mayShow) this.lastVisualAt = now;
    this.entries.delete(event.entityId);
    this.entries.set(event.entityId, {
      ...event, icon, shortLabel, receivedAt: now,
      visibleUntil: mayShow ? now + 1800 : (previous?.visibleUntil ?? 0)
    });
    if (this.entries.size > 256) {
      this.entries.delete(this.entries.keys().next().value!);
    }
  }

  private describe(text: string): { icon: string; shortLabel: string } {
    if (/đan|💊/i.test(text)) return { icon: '💊', shortLabel: 'Dùng đan dược' };
    if (/uống|nước|sương/i.test(text)) return { icon: '💧', shortLabel: 'Uống nước' };
    if (/cơm|ăn|bón/i.test(text)) return { icon: '🍚', shortLabel: 'Dùng bữa' };
    if (/nấu/i.test(text)) return { icon: '🍳', shortLabel: 'Chế biến' };
    if (/thóc|dâu|hái|thu hoạch/i.test(text)) return { icon: '🌾', shortLabel: 'Thu hoạch' };
    if (/dựng|xây|búa|tu bổ/i.test(text)) return { icon: '🔨', shortLabel: 'Xây dựng' };
    if (/thi hài|bế/i.test(text)) return { icon: '🕊️', shortLabel: 'Chăm sóc' };
    return { icon: '✦', shortLabel: 'Hoạt động' };
  }

  public render(
    ctx: CanvasRenderingContext2D,
    world: ECSWorld,
    camera: ViewportCamera,
    screenWidth: number,
    screenHeight: number,
    selectedEntity: number | null,
    occupied: OverlayRect[]
  ): void {
    const now = this.now();
    for (const [id, entry] of this.entries) {
      if (now - entry.receivedAt >= 5000 || !world.getComponent(id, PositionComponent)) {
        this.entries.delete(id);
      }
    }
    if (camera.zoom < 0.75 || occupied.length >= 4) return;
    const limit = camera.zoom < 1.5 ? 1 : Math.min(3, 4 - occupied.length);
    const candidates = [...this.entries.values()]
      .filter(entry => entry.visibleUntil > now)
      .sort((a, b) =>
        Number(b.entityId === selectedEntity) - Number(a.entityId === selectedEntity) ||
        b.receivedAt - a.receivedAt
      );
    let drawn = 0;
    ctx.save();
    ctx.font = '500 11px "Noto Sans Dialogue", "Noto Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const entry of candidates) {
      if (drawn >= limit || occupied.length >= 4) break;
      if (camera.zoom < 1.5 && entry.entityId !== selectedEntity) continue;
      const pos = world.getComponent(entry.entityId, PositionComponent);
      if (!pos) continue;
      const screen = camera.worldToScreen(pos.x, pos.y, screenWidth, screenHeight);
      if (screen.x < 8 || screen.x > screenWidth - 8 ||
          screen.y < 8 || screen.y > screenHeight - 8) continue;
      const label = entry.entityId === selectedEntity ? `${entry.icon} ${entry.shortLabel}` : entry.icon;
      const width = Math.ceil(ctx.measureText(label).width + 12);
      const height = 18;
      const x = Math.max(8, Math.min(screenWidth - width - 8, screen.x - width / 2));
      const preferredY = screen.y - Math.min(34, Math.max(16, 10 * camera.zoom)) - height;
      const positions = [preferredY, screen.y + 32, preferredY - height - 6];
      const rect = positions
        .map(y => ({ x, y, width, height }))
        .find(candidate => candidate.y >= 8 && candidate.y + height <= screenHeight - 8 &&
          !occupied.some(other =>
            candidate.x < other.x + other.width + 4 && candidate.x + width + 4 > other.x &&
            candidate.y < other.y + other.height + 4 && candidate.y + height + 4 > other.y
          ));
      if (!rect) continue;
      ctx.globalAlpha = Math.min(1, (entry.visibleUntil - now) / 350);
      ctx.fillStyle = 'rgba(13, 23, 35, 0.82)';
      ctx.beginPath();
      ctx.roundRect(rect.x, rect.y, width, height, 5);
      ctx.fill();
      ctx.fillStyle = '#eef5fb';
      ctx.fillText(label, rect.x + width / 2, rect.y + height / 2);
      occupied.push(rect);
      drawn++;
    }
    ctx.restore();
  }
}
