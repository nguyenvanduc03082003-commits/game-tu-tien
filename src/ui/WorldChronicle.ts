import { EventBus } from '../core/EventBus.ts';

export type WorldLogCategory =
  | 'anomaly'
  | 'highest_breakthrough'
  | 'faction_created'
  | 'faction_destroyed'
  | 'hamlet_founded'
  | 'sect_founded'
  | 'founding'
  | 'upgrade'
  | 'succession'
  | 'secession'
  | 'decline'
  | 'birth'
  | 'death';

export interface WorldLogEntry {
  type: WorldLogCategory | string;
  message: string;
}

const ALLOWED_CATEGORIES = new Set<string>([
  'anomaly',
  'highest_breakthrough',
  'faction_created',
  'faction_destroyed',
  'hamlet_founded',
  'sect_founded',
  'founding',
  'upgrade',
  'succession',
  'secession',
  'decline',
  'birth',
  'death'
]);

export class WorldChronicle {
  private container: HTMLDivElement;
  private logList: HTMLDivElement;
  private eventBus = EventBus.getInstance();
  private maxLogs: number = 35;
  private lastMessage: string = '';
  private lastCount: number = 1;
  private lastItemEl: HTMLDivElement | null = null;

  private unsubs: (() => void)[] = [];

  private isCollapsed: boolean = false;

  constructor(parent: HTMLElement) {
    this.container = document.createElement('div');
    this.container.id = 'hud-chronicle';
    this.container.className = 'interactive-ui hud-panel';
    this.container.style.cssText = `
      position: absolute;
      bottom: 85px;
      left: 12px;
      width: min(340px, calc(100vw - 24px));
      max-height: 155px;
      padding: 6px 10px;
      display: flex;
      flex-direction: column;
      gap: 5px;
      z-index: 85;
      font-size: 11px;
      transition: max-height 0.2s ease;
    `;

    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #30363d;
      padding-bottom: 4px;
      color: #ffd43b;
      font-weight: 600;
      letter-spacing: 0.5px;
      cursor: pointer;
      user-select: none;
    `;
    header.innerHTML = `
      <span>📜 Nhật Ký Thế Giới</span>
      <div style="display: flex; gap: 6px; align-items: center;">
        <span style="font-size: 10px; color: #8b949e;">Biến Cố</span>
        <span id="chronicle-toggle" style="font-size: 10px; color: #94a3b8;">▼</span>
      </div>
    `;
    this.container.appendChild(header);

    this.logList = document.createElement('div');
    this.logList.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 5px;
      overflow-y: auto;
      max-height: 115px;
      scroll-behavior: smooth;
    `;
    this.container.appendChild(this.logList);

    parent.appendChild(this.container);

    header.addEventListener('click', () => {
      this.isCollapsed = !this.isCollapsed;
      this.logList.style.display = this.isCollapsed ? 'none' : 'flex';
      const toggle = header.querySelector('#chronicle-toggle');
      if (toggle) toggle.textContent = this.isCollapsed ? '▲' : '▼';
    });

    this.initEvents();
  }

  public clear(): void {
    if (this.logList) {
      this.logList.innerHTML = '';
      while (this.logList.firstChild) {
        this.logList.removeChild(this.logList.firstChild);
      }
    }
    this.lastMessage = '';
    this.lastCount = 1;
    this.lastItemEl = null;
  }

  public destroy(): void {
    this.unsubs.forEach(unsub => unsub());
    this.unsubs = [];
    if (this.container && this.container.parentElement) {
      this.container.parentElement.removeChild(this.container);
    }
  }

  private initEvents(): void {
    this.unsubs.push(
      this.eventBus.on<WorldLogEntry>('world:log', (entry) => {
        this.addLog(entry);
      })
    );

    this.unsubs.push(
      this.eventBus.on<{ category: string; message: string; importance?: string }>('chronicle:entry', (entry) => {
        if (ALLOWED_CATEGORIES.has(entry.category)) {
          this.addLog({ type: entry.category, message: entry.message });
        }
      })
    );

    this.unsubs.push(
      this.eventBus.on('world:reset', () => {
        this.clear();
        this.addLog({
          type: 'anomaly',
          message: '🌐 THIÊN ĐỊA DỊ TƯỢNG: Khai thiên lập địa! Vạn dặm sơn hà khai mở, càn khôn định vị, linh cơ bắt đầu thai nghén...'
        });
      })
    );

    this.addLog({
      type: 'anomaly',
      message: '🌐 THIÊN ĐỊA DỊ TƯỢNG: Khai thiên lập địa! Vạn dặm sơn hà khai mở, càn khôn định vị, linh cơ bắt đầu thai nghén...'
    });
  }

  public addLog(entry: WorldLogEntry): void {
    if (!ALLOWED_CATEGORIES.has(entry.type)) {
      return;
    }

    // Gom nhóm thông điệp trùng lặp liên tiếp để tránh spam
    if (entry.message === this.lastMessage && this.lastItemEl) {
      this.lastCount++;
      this.lastItemEl.textContent = `${entry.message} (x${this.lastCount})`;
      return;
    }

    const item = document.createElement('div');
    item.style.cssText = `
      line-height: 1.4;
      padding: 4px 6px;
      border-radius: 4px;
      transition: all 0.2s ease;
      font-size: 11px;
    `;

    if (entry.type === 'highest_breakthrough' || entry.type === 'upgrade') {
      item.style.background = 'rgba(255, 212, 59, 0.16)';
      item.style.color = '#ffe066';
      item.style.fontWeight = 'bold';
      item.style.borderLeft = '3px solid #fcc419';
      item.style.boxShadow = '0 0 8px rgba(252, 196, 25, 0.25)';
    } else if (entry.type === 'anomaly' || entry.type === 'succession') {
      item.style.background = 'rgba(190, 75, 219, 0.18)';
      item.style.color = '#eebefa';
      item.style.fontWeight = '600';
      item.style.borderLeft = '3px solid #be4bdb';
      item.style.boxShadow = '0 0 8px rgba(190, 75, 219, 0.25)';
    } else if (
      entry.type === 'faction_created' ||
      entry.type === 'hamlet_founded' ||
      entry.type === 'sect_founded' ||
      entry.type === 'founding'
    ) {
      item.style.background = 'rgba(64, 192, 87, 0.16)';
      item.style.color = '#8ce99a';
      item.style.fontWeight = '600';
      item.style.borderLeft = '3px solid #51cf66';
    } else if (
      entry.type === 'faction_destroyed' ||
      entry.type === 'decline' ||
      entry.type === 'secession'
    ) {
      item.style.background = 'rgba(240, 62, 62, 0.18)';
      item.style.color = '#ffa8a8';
      item.style.fontWeight = '600';
      item.style.borderLeft = '3px solid #fa5252';
    } else if (entry.type === 'birth') {
      item.style.background = 'rgba(56, 217, 169, 0.16)';
      item.style.color = '#63e6be';
      item.style.fontWeight = '600';
      item.style.borderLeft = '3px solid #20c997';
    } else if (entry.type === 'death') {
      item.style.background = 'rgba(134, 142, 150, 0.18)';
      item.style.color = '#ced4da';
      item.style.fontWeight = '600';
      item.style.borderLeft = '3px solid #868e96';
    }

    item.textContent = entry.message;
    this.logList.appendChild(item);
    this.lastMessage = entry.message;
    this.lastCount = 1;
    this.lastItemEl = item;

    while (this.logList.children.length > this.maxLogs) {
      this.logList.removeChild(this.logList.firstChild!);
    }

    this.logList.scrollTop = this.logList.scrollHeight;
  }
}
