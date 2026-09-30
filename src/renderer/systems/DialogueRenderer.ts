import { EventBus } from '../../core/EventBus.ts';
import { ECSWorld } from '../../ecs/World.ts';
import { PositionComponent } from '../../modules/beings/BeingComponents.ts';
import { ViewportCamera } from '../ViewportCamera.ts';

interface SpeechEvent {
  entityId: number;
  text: string;
  color?: string;
}

interface Bubble extends SpeechEvent {
  remaining: number;
  createdAt: number;
}

export interface OverlayRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Short, screen-space dialogue. Social simulation may emit many events per frame at 50x. */
export class DialogueRenderer {
  private static readonly MAX_STORED = 16;
  private static readonly LIFETIME_SECONDS = 2.6;
  private static readonly SPEAKER_COOLDOWN_MS = 1900;
  private static readonly GLOBAL_COOLDOWN_MS = 300;
  private bubbles = new Map<number, Bubble>();
  private lastSpeakerAt = new Map<number, number>();
  private lastAcceptedAt = -Infinity;
  private selectedEntity: number | null = null;

  constructor(private readonly now: () => number = () => performance.now()) {
    EventBus.getInstance().on<SpeechEvent>('social:speech', event => this.add(event));
  }

  public clear(): void {
    this.bubbles.clear();
    this.lastSpeakerAt.clear();
    this.lastAcceptedAt = -Infinity;
    this.selectedEntity = null;
  }

  public add(event: SpeechEvent): void {
    if (!event || !Number.isInteger(event.entityId) || !event.text?.trim()) return;
    const now = this.now();
    const lastSpeaker = this.lastSpeakerAt.get(event.entityId) ?? -Infinity;
    if (now - lastSpeaker < DialogueRenderer.SPEAKER_COOLDOWN_MS) return;
    if (event.entityId !== this.selectedEntity &&
        now - this.lastAcceptedAt < DialogueRenderer.GLOBAL_COOLDOWN_MS) return;

    this.lastSpeakerAt.set(event.entityId, now);
    this.lastAcceptedAt = now;
    if (this.lastSpeakerAt.size > 256) {
      for (const [id, time] of this.lastSpeakerAt) {
        if (now - time > DialogueRenderer.SPEAKER_COOLDOWN_MS) this.lastSpeakerAt.delete(id);
      }
    }
    if (this.bubbles.size >= DialogueRenderer.MAX_STORED && !this.bubbles.has(event.entityId)) {
      const oldestId = this.bubbles.keys().next().value;
      if (oldestId !== undefined) this.bubbles.delete(oldestId);
    }
    this.bubbles.delete(event.entityId);
    this.bubbles.set(event.entityId, {
      ...event,
      remaining: DialogueRenderer.LIFETIME_SECONDS,
      createdAt: now
    });
  }

  public render(
    ctx: CanvasRenderingContext2D,
    world: ECSWorld,
    camera: ViewportCamera,
    screenWidth: number,
    screenHeight: number,
    dt: number,
    selectedEntity: number | null
  ): OverlayRect[] {
    this.selectedEntity = selectedEntity;
    for (const [id, bubble] of this.bubbles) {
      bubble.remaining -= Math.max(0, dt);
      if (bubble.remaining <= 0 || !world.getComponent(id, PositionComponent)) {
        this.bubbles.delete(id);
      }
    }

    const limit = camera.zoom < 0.75 ? (selectedEntity === null ? 0 : 1) :
      camera.zoom < 1.5 ? 2 : 4;
    if (limit === 0 || screenWidth < 48 || screenHeight < 48) return [];

    const candidates = [...this.bubbles.values()]
      .filter(b => camera.zoom >= 0.75 || b.entityId === selectedEntity)
      .sort((a, b) =>
        Number(b.entityId === selectedEntity) - Number(a.entityId === selectedEntity) ||
        b.createdAt - a.createdAt
      );
    const occupied: OverlayRect[] = [];
    ctx.save();
    ctx.font = `${camera.zoom < 1.5 ? 400 : 500} ${camera.zoom < 1.5 ? 11 : 12}px "Noto Sans Dialogue", "Noto Sans", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (const bubble of candidates) {
      if (occupied.length >= limit) break;
      const position = world.getComponent(bubble.entityId, PositionComponent);
      if (!position) continue;
      const screen = camera.worldToScreen(position.x, position.y, screenWidth, screenHeight);
      if (screen.x < -20 || screen.x > screenWidth + 20 ||
          screen.y < -20 || screen.y > screenHeight + 20) continue;

      const maxTextWidth = Math.min(164, screenWidth - 32);
      const lines = this.wrapText(ctx, bubble.text, maxTextWidth);
      const width = Math.min(screenWidth - 16,
        Math.ceil(Math.max(...lines.map(line => ctx.measureText(line).width)) + 18));
      const height = lines.length * 16 + 12;
      const x = Math.max(8, Math.min(screenWidth - width - 8, screen.x - width / 2));
      let y = Math.max(8, Math.min(screenHeight - height - 8,
        screen.y - Math.min(42, Math.max(20, 13 * camera.zoom)) - height));
      let rect = { x, y, width, height };
      for (let attempt = 0; attempt < 3 && occupied.some(other => this.overlaps(rect, other)); attempt++) {
        y -= height + 5;
        rect = { x, y, width, height };
      }
      if (y < 8 || occupied.some(other => this.overlaps(rect, other))) continue;

      ctx.globalAlpha = Math.min(1, bubble.remaining / 0.35);
      ctx.fillStyle = 'rgba(13, 23, 35, 0.88)';
      ctx.strokeStyle = bubble.color ?? '#91a9ba';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(x, y, width, height, 6);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#f2f7fb';
      for (let i = 0; i < lines.length; i++) {
        ctx.fillText(lines[i], x + width / 2, y + 14 + i * 16);
      }
      occupied.push(rect);
    }
    ctx.restore();
    return occupied;
  }

  private overlaps(a: OverlayRect, b: OverlayRect): boolean {
    return a.x < b.x + b.width + 4 && a.x + a.width + 4 > b.x &&
      a.y < b.y + b.height + 4 && a.y + a.height + 4 > b.y;
  }

  private wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
    const words = text.trim().split(/\s+/);
    const lines: string[] = [];
    let line = '';
    for (const word of words) {
      const next = line ? `${line} ${word}` : word;
      if (ctx.measureText(next).width <= maxWidth) {
        line = next;
      } else if (line) {
        lines.push(line);
        line = word;
      } else {
        line = word;
      }
      if (lines.length === 2) break;
    }
    if (line && lines.length < 2) lines.push(line);
    if (!lines.length) lines.push('…');
    const consumedWords = lines.join(' ').split(/\s+/).length;
    if (consumedWords < words.length || lines.some(value => ctx.measureText(value).width > maxWidth)) {
      let last = lines[Math.min(1, lines.length - 1)];
      while (last.length && ctx.measureText(`${last}…`).width > maxWidth) {
        last = last.slice(0, -1);
      }
      lines[Math.min(1, lines.length - 1)] = `${last}…`;
    }
    return lines.slice(0, 2);
  }
}
