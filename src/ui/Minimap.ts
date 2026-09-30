import { Engine } from '../core/Engine.ts';
import { TERRAIN_CONFIGS } from '../config/terrains.config.ts';
import { HealthComponent, PositionComponent, RaceComponent, RealmComponent } from '../modules/beings/BeingComponents.ts';
import { AnimalComponent } from '../modules/animals/AnimalComponents.ts';

export class Minimap {
  private container: HTMLDivElement;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private engine: Engine;

  private offscreenCanvas: HTMLCanvasElement;
  private offscreenCtx: CanvasRenderingContext2D;
  private isMapDirty: boolean = true;
  private isCollapsed: boolean = false;
  private isDragging: boolean = false;

  public readonly size: number = 180; // 180x180 px

  constructor(parent: HTMLElement, engine: Engine) {
    this.engine = engine;

    this.container = document.createElement('div');
    this.container.id = 'hud-minimap';
    this.container.className = 'interactive-ui hud-panel';
    this.container.style.cssText = `
      padding: 6px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 5px;
      transition: all 0.2s ease;
    `;

    // Header
    const header = document.createElement('div');
    header.style.cssText = `
      width: 100%;
      display: flex;
      justify-content: space-between;
      align-items: center;
      color: #cbd5e1;
      font-size: 11px;
      font-weight: 600;
      padding: 0 4px;
    `;
    header.innerHTML = `
      <span style="cursor: pointer;" title="Nhấn để thu gọn/mở rộng">🗺️ Bản Đồ</span>
      <div style="display: flex; gap: 6px; align-items: center;">
        <span id="minimap-size-toggle" title="Thu nhỏ / Phóng to (120px / 180px)" style="cursor: pointer; font-size: 11px; color: #38d9a9; user-select: none;">🔍</span>
        <span id="minimap-toggle" title="Thu gọn / Mở rộng" style="cursor: pointer; font-size: 10px; color: #94a3b8; user-select: none;">▼</span>
      </div>
    `;

    this.canvas = document.createElement('canvas');
    this.canvas.width = this.size;
    this.canvas.height = this.size;
    this.canvas.style.cssText = `
      width: ${this.size}px;
      height: ${this.size}px;
      border-radius: 8px;
      border: 1px solid #30363d;
      cursor: crosshair;
      image-rendering: pixelated;
      transition: width 0.15s ease, height 0.15s ease;
    `;
    this.ctx = this.canvas.getContext('2d')!;

    this.offscreenCanvas = document.createElement('canvas');
    this.offscreenCanvas.width = this.size;
    this.offscreenCanvas.height = this.size;
    this.offscreenCtx = this.offscreenCanvas.getContext('2d')!;

    this.container.appendChild(header);
    this.container.appendChild(this.canvas);
    parent.appendChild(this.container);

    let isCompactSize = false;
    const sizeToggle = header.querySelector('#minimap-size-toggle') as HTMLElement | null;
    sizeToggle?.addEventListener('click', (e) => {
      e.stopPropagation();
      isCompactSize = !isCompactSize;
      const displaySize = isCompactSize ? 120 : 180;
      this.canvas.style.width = `${displaySize}px`;
      this.canvas.style.height = `${displaySize}px`;
      if (sizeToggle) {
        sizeToggle.textContent = isCompactSize ? '🔎' : '🔍';
      }
    });

    const toggleCollapse = () => {
      this.isCollapsed = !this.isCollapsed;
      this.canvas.style.display = this.isCollapsed ? 'none' : 'block';
      const toggle = header.querySelector('#minimap-toggle');
      if (toggle) toggle.textContent = this.isCollapsed ? '▲' : '▼';
    };

    header.addEventListener('click', toggleCollapse);

    this.initMouseHandlers();
  }

  private initMouseHandlers(): void {
    const handlePan = (e: MouseEvent) => {
      const rect = this.canvas.getBoundingClientRect();
      const clickW = rect.width || this.size;
      const clickH = rect.height || this.size;
      const clickX = Math.max(0, Math.min(clickW, e.clientX - rect.left));
      const clickY = Math.max(0, Math.min(clickH, e.clientY - rect.top));

      const ratioX = clickX / clickW;
      const ratioY = clickY / clickH;

      const worldW = this.engine.worldMap.widthPixels;
      const worldH = this.engine.worldMap.heightPixels;

      this.engine.camera.x = ratioX * worldW;
      this.engine.camera.y = ratioY * worldH;
    };

    this.canvas.addEventListener('mousedown', (e) => {
      if (e.button === 0) {
        this.isDragging = true;
        handlePan(e);
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (this.isDragging) {
        handlePan(e);
      }
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
    });
  }

  /**
   * Cập nhật và vẽ lại Minimap mỗi nhịp Render
   */
  public update(): void {
    if (this.isCollapsed) return;

    const map = this.engine.worldMap;
    const w = map.width;
    const h = map.height;

    // 1. Vẽ nền địa hình lên Offscreen Canvas khi bản đồ thay đổi
    if (this.isMapDirty || map.getDirty()) {
      this.isMapDirty = false;
      map.setDirty(false);

      const cellW = this.size / w;
      const cellH = this.size / h;

      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const tile = map.getTile(x, y);
          if (!tile) continue;
          const cfg = TERRAIN_CONFIGS[tile.terrain];
          this.offscreenCtx.fillStyle = cfg.primaryColor;
          this.offscreenCtx.fillRect(
            Math.floor(x * cellW),
            Math.floor(y * cellH),
            Math.ceil(cellW),
            Math.ceil(cellH)
          );
        }
      }
    }

    // 2. Chép nền địa hình từ Offscreen Canvas
    this.ctx.drawImage(this.offscreenCanvas, 0, 0);

    // 3. Vẽ các chấm cư dân từ SpatialGrid hoặc Query
    const scaleX = this.size / map.widthPixels;
    const scaleY = this.size / map.heightPixels;

    const beings = this.engine.world.query([PositionComponent, RaceComponent]);
    for (let i = 0; i < beings.length; i++) {
      const ent = beings[i];
      const pos = this.engine.world.getComponent(ent, PositionComponent)!;
      const race = this.engine.world.getComponent(ent, RaceComponent);
      const realm = this.engine.world.getComponent(ent, RealmComponent);

      let dotColor = '#38d9a9'; // Phàm nhân / tu sĩ sơ nhập
      if (race?.raceId === 'beast') dotColor = '#fb923c'; // Dã thú
      else if (race?.raceId === 'demon') dotColor = '#ef4444'; // Ma tu
      else if (realm && realm.stageIndex >= 3) dotColor = '#c084fc'; // Cao thủ Kim Đan trở lên
      else if (realm && realm.stageIndex >= 1) dotColor = '#60a5fa'; // Tu sĩ Luyện Khí/Trúc Cơ

      const mx = pos.x * scaleX;
      const my = pos.y * scaleY;

      this.ctx.fillStyle = dotColor;
      this.ctx.fillRect(Math.floor(mx) - 1, Math.floor(my) - 1, 2, 2);
    }

    const animals = this.engine.world.query([PositionComponent, AnimalComponent, HealthComponent]);
    this.ctx.fillStyle = '#86efac';
    for (let i = 0; i < animals.length; i++) {
      const ent = animals[i];
      const hp = this.engine.world.getComponent(ent, HealthComponent)!;
      if (hp.isDead || hp.current <= 0) continue;
      const pos = this.engine.world.getComponent(ent, PositionComponent)!;
      const mx = pos.x * scaleX;
      const my = pos.y * scaleY;
      this.ctx.fillRect(Math.floor(mx), Math.floor(my), 1.5, 1.5);
    }

    // 4. Vẽ khung nhìn Camera (Viewport Box)
    const bounds = this.engine.camera.getVisibleBounds(this.engine.canvas.width, this.engine.canvas.height);
    const boxX = Math.max(0, bounds.minX * scaleX);
    const boxY = Math.max(0, bounds.minY * scaleY);
    const boxW = Math.min(this.size - boxX, (bounds.maxX - bounds.minX) * scaleX);
    const boxH = Math.min(this.size - boxY, (bounds.maxY - bounds.minY) * scaleY);

    this.ctx.strokeStyle = '#facc15';
    this.ctx.lineWidth = 1.2;
    this.ctx.strokeRect(boxX, boxY, boxW, boxH);
  }

  public invalidateTerrain(): void {
    this.isMapDirty = true;
  }
}
