import { Engine } from '../core/Engine.ts';
import { SaveManager } from '../modules/save/SaveManager.ts';
import { MainMenu } from './MainMenu.ts';

export class PauseMenu {
  private container: HTMLDivElement;
  private engine: Engine;
  private mainMenu: MainMenu;
  private isVisible: boolean = false;

  constructor(engine: Engine, mainMenu: MainMenu) {
    this.engine = engine;
    this.mainMenu = mainMenu;

    this.container = document.createElement('div');
    this.container.id = 'pause-menu-overlay';
    this.container.className = 'interactive-ui';
    this.container.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(4, 7, 17, 0.85);
      backdrop-filter: blur(10px);
      z-index: 400;
      display: none;
      justify-content: center;
      align-items: center;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      color: #e6edf3;
      user-select: none;
    `;
    document.body.appendChild(this.container);

    // Lắng nghe phím ESC
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (this.engine.isMainMenuOpen) return;
        this.toggle();
      }
    });

    this.render();
  }

  public toggle(): void {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  public show(): void {
    this.isVisible = true;
    this.engine.isPausedByMenu = true;
    this.container.style.display = 'flex';
    this.render();
  }

  public hide(): void {
    this.isVisible = false;
    this.engine.isPausedByMenu = false;
    this.container.style.display = 'none';
  }

  private showToast(message: string, isSuccess: boolean = true): void {
    SaveManager.notifySaveStatus(message, isSuccess);
  }

  private render(): void {
    const date = this.engine.timeManager.getDate();
    const worldName = this.engine.worldName || 'Thái Cổ Giới';

    this.container.innerHTML = `
      <div style="
        width: 380px; background: rgba(15, 23, 42, 0.96); border: 1px solid rgba(255, 255, 255, 0.18);
        border-radius: 14px; padding: 24px 28px; box-shadow: 0 16px 45px rgba(0, 0, 0, 0.85);
        display: flex; flex-direction: column; gap: 14px; text-align: center;
      ">
        <!-- HEADER -->
        <div>
          <div style="font-size: 11px; color: #fde047; font-weight: bold; letter-spacing: 2px; text-transform: uppercase;">
            ✦ Thiên Đạo Tạm Dừng ✦
          </div>
          <h2 id="pause-world-name" style="margin: 6px 0 0 0; font-size: 22px; color: #f8fafc; font-weight: bold;"></h2>
          <div style="font-size: 12px; color: #94a3b8; margin-top: 4px;">
            Năm ${date.year}, ${date.season}, Ngày ${date.day} • ${this.engine.world.getEntityCount()} Thực Thể
          </div>
        </div>

        <!-- CÁC NÚT ĐIỀU KHIỂN -->
        <div style="display: flex; flex-direction: column; gap: 10px; margin-top: 6px;">
          <!-- 1. TIẾP TỤC -->
          <button id="pause-btn-resume" style="
            padding: 12px; background: linear-gradient(135deg, #1f6feb, #38bdf8);
            border: none; color: #fff; border-radius: 8px; font-size: 14px; font-weight: bold;
            cursor: pointer; box-shadow: 0 4px 14px rgba(31, 111, 235, 0.3);
          ">Tiếp Tục Tu Chân ▶</button>

          <!-- 2. LƯU GAME NHANH (QUICK SAVE) -->
          <button id="pause-btn-quicksave" style="
            padding: 11px; background: rgba(34, 197, 94, 0.25); border: 1px solid #4ade80;
            color: #86efac; border-radius: 8px; font-size: 13px; font-weight: bold; cursor: pointer;
            display: flex; align-items: center; justify-content: center; gap: 6px;
          ">
            <span>💾</span> <span>Lưu Game Nhanh (Slot 1)</span>
          </button>

          <!-- 3. LƯU VÀO SLOT MỚI (SAVE AS) -->
          <button id="pause-btn-save-as" style="
            padding: 11px; background: rgba(56, 189, 248, 0.15); border: 1px solid #38bdf8;
            color: #7dd3fc; border-radius: 8px; font-size: 13px; font-weight: 500; cursor: pointer;
            display: flex; align-items: center; justify-content: center; gap: 6px;
          ">
            <span>📥</span> <span>Lưu Vào Slot Mới...</span>
          </button>

          <!-- 4. TẢI BẢN LƯU KHÁC -->
          <button id="pause-btn-load" style="
            padding: 11px; background: rgba(168, 85, 247, 0.15); border: 1px solid #c084fc;
            color: #d8b4fe; border-radius: 8px; font-size: 13px; font-weight: 500; cursor: pointer;
            display: flex; align-items: center; justify-content: center; gap: 6px;
          ">
            <span>📜</span> <span>Đổi Bản Lưu Khác</span>
          </button>

          <!-- 5. CHƠI MỚI (NEW GAME) -->
          <button id="pause-btn-new-game" style="
            padding: 11px; background: rgba(245, 158, 11, 0.15); border: 1px solid #f59e0b;
            color: #fcd34d; border-radius: 8px; font-size: 13px; font-weight: 500; cursor: pointer;
            display: flex; align-items: center; justify-content: center; gap: 6px;
          ">
            <span>✨</span> <span>Khởi Tạo Thế Giới Mới</span>
          </button>

          <!-- 6. VỀ MÀN HÌNH CHÍNH -->
          <button id="pause-btn-main-menu" style="
            padding: 11px; background: rgba(239, 68, 68, 0.15); border: 1px solid #ef4444;
            color: #fca5a5; border-radius: 8px; font-size: 13px; font-weight: 500; cursor: pointer;
            margin-top: 6px; display: flex; align-items: center; justify-content: center; gap: 6px;
          ">
            <span>🚪</span> <span>Về Màn Hình Chính</span>
          </button>
        </div>
      </div>
    `;

    const worldNameEl = this.container.querySelector('#pause-world-name');
    if (worldNameEl) worldNameEl.textContent = String(worldName);

    // 1. Tiếp tục
    this.container.querySelector('#pause-btn-resume')?.addEventListener('click', () => {
      this.hide();
    });

    // 2. Lưu nhanh vào slot 1
    this.container.querySelector('#pause-btn-quicksave')?.addEventListener('click', async () => {
      try {
        const slotId = 'slot_1';
        const meta = await SaveManager.saveSlot(this.engine, slotId, worldName);
        this.showToast(`Đã lưu nhanh vào Slot 1 lúc ${meta.realDateStr}!`);
        this.hide();
      } catch (e: any) {
        this.showToast('Lỗi khi lưu game: ' + e.message, false);
      }
    });

    // 3. Lưu vào slot mới
    this.container.querySelector('#pause-btn-save-as')?.addEventListener('click', async () => {
      const customName = prompt('Nhập tên cho bản lưu này:', `${worldName} - Lưu lúc ${new Date().toLocaleTimeString()}`);
      if (customName) {
        try {
          const slotId = `slot_${Date.now()}`;
          await SaveManager.saveSlot(this.engine, slotId, customName);
          this.showToast(`Đã lưu thành công bản [${customName}]!`);
          this.hide();
        } catch (e: any) {
          this.showToast('Lỗi khi lưu game: ' + e.message, false);
        }
      }
    });

    // 4. Mở danh sách bản lưu để đổi thế giới
    this.container.querySelector('#pause-btn-load')?.addEventListener('click', () => {
      this.hide();
      this.mainMenu.openSaveSlotsModal();
    });

    // 5. Khởi tạo thế giới mới
    this.container.querySelector('#pause-btn-new-game')?.addEventListener('click', () => {
      this.hide();
      this.mainMenu.openNewGameModal();
    });

    // 6. Về màn hình chính
    this.container.querySelector('#pause-btn-main-menu')?.addEventListener('click', () => {
      this.hide();
      // Ẩn UI in-game
      const overlay = document.getElementById('ui-overlay');
      if (overlay) overlay.style.display = 'none';
      this.mainMenu.show();
    });
  }
}
