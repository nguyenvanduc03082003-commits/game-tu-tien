import { Engine } from '../core/Engine.ts';
import { MenuBackground } from '../renderer/systems/MenuBackground.ts';
import { SaveManager } from '../modules/save/SaveManager.ts';
import { GameSettings } from '../core/GameSettings.ts';
import { sanitizePositiveTimeSpeed } from '../core/TimeManager.ts';

type NewWorldOptions = Parameters<Engine['initNewWorld']>[0];

const RANDOM_REALM_NAMES = [
  'Thái Sơ Đạo Vực',
  'Hồng Mông Tiên Giới',
  'Thập Vạn Đại Sơn',
  'Bồng Lai Cổ Giới',
  'Côn Lôn Thần Vực',
  'Vạn Tiên Đại Lục',
  'Thiên Đạo Vô Biên',
  'Hỗn Độn Sơ Khai',
  'Thương Khung Tiên Vực',
  'Tử Tiêu Thánh Địa'
];

export class MainMenu {
  private container: HTMLDivElement;
  private bg: MenuBackground;
  private engine: Engine;
  private onEnterGameCallback: () => void;

  constructor(engine: Engine, onEnterGame: () => void) {
    this.engine = engine;
    this.onEnterGameCallback = onEnterGame;

    this.container = document.createElement('div');
    this.container.id = 'main-menu-container';
    this.container.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      z-index: 500;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      overflow: hidden;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      color: #e6edf3;
      user-select: none;
      transition: opacity 0.4s ease;
    `;
    document.body.appendChild(this.container);

    // 1. Khởi tạo canvas nền tiên cảnh động
    const initialSettings = GameSettings.load();
    this.bg = new MenuBackground(this.container);
    this.bg.particlesEnabled = initialSettings.particlesEnabled;
    this.engine.applySettings(initialSettings);
    this.bg.start();

    // 2. Dựng giao diện menu chính
    this.renderMenu();
  }

  public show(): void {
    this.container.style.display = 'flex';
    this.container.style.opacity = '1';
    this.container.style.pointerEvents = 'auto';
    this.engine.isMainMenuOpen = true;
    this.bg.particlesEnabled = GameSettings.get().particlesEnabled;
    this.bg.start();
    this.renderMenu();
  }

  public hide(): void {
    this.container.style.opacity = '0';
    this.container.style.pointerEvents = 'none';
    this.engine.isMainMenuOpen = false;
    setTimeout(() => {
      this.container.style.display = 'none';
      this.bg.stop();
    }, 400);
  }

  private enterGame(): void {
    const settings = GameSettings.get();
    this.engine.applySettings(settings);
    this.engine.timeManager.setSpeed(settings.defaultSpeed);
    this.hide();
    this.onEnterGameCallback();
  }

  public renderMenu(): void {
    const latestSave = SaveManager.getLatestSlot();

    // Dọn các lớp overlay con cũ (trừ canvas nền)
    const oldUi = this.container.querySelector('.menu-ui-layer');
    if (oldUi) oldUi.remove();

    const uiLayer = document.createElement('div');
    uiLayer.className = 'menu-ui-layer';
    uiLayer.style.cssText = `
      position: relative;
      z-index: 10;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 24px;
      max-width: 500px;
      width: 90%;
    `;

    uiLayer.innerHTML = `
      <!-- TIÊU ĐỀ GAME TIÊN HIỆP -->
      <div style="text-align: center;">
        <div style="display: inline-block; padding: 4px 14px; background: rgba(250, 204, 21, 0.12); border: 1px solid rgba(250, 204, 21, 0.35); border-radius: 20px; font-size: 11px; color: #fde047; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 10px; font-weight: bold;">
          ✦ Sandbox Tiên Hiệp & Tam Giới Vạn Linh ✦
        </div>
        <h1 style="font-size: 38px; font-weight: 900; letter-spacing: 3px; margin: 0; background: linear-gradient(135deg, #ffffff 20%, #facc15 60%, #fb923c 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; text-shadow: 0 0 35px rgba(250, 204, 21, 0.45); font-family: 'Cinzel', 'Palatino Linotype', 'Times New Roman', serif;">
          THƯỢNG ĐẾ TU TIÊN
        </h1>
        <p style="margin-top: 8px; font-size: 13px; color: #94a3b8; letter-spacing: 1px;">
          Khai Thiên Lập Địa • Thức Tỉnh Linh Căn • Chưởng Quản Thiên Đạo
        </p>
      </div>

      <!-- CÁC LỰA CHỌN CHÍNH -->
      <div style="display: flex; flex-direction: column; gap: 12px; width: 100%;">
        <!-- NÚT 1: CHƠI TIẾP -->
        <button id="btn-continue" style="
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          padding: ${latestSave ? '12px 18px' : '14px 18px'};
          background: ${latestSave ? 'linear-gradient(135deg, rgba(31, 111, 235, 0.45), rgba(56, 189, 248, 0.25))' : 'rgba(30, 41, 59, 0.4)'};
          border: 1px solid ${latestSave ? '#38bdf8' : 'rgba(255, 255, 255, 0.1)'};
          border-radius: 10px; color: ${latestSave ? '#ffffff' : '#64748b'};
          cursor: ${latestSave ? 'pointer' : 'not-allowed'};
          font-size: 16px; font-weight: bold; letter-spacing: 1px;
          backdrop-filter: blur(10px); box-shadow: ${latestSave ? '0 6px 20px rgba(56, 189, 248, 0.25)' : 'none'};
          transition: transform 0.15s, box-shadow 0.15s;
        ">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span>▶</span> <span>CHƠI TIẾP</span>
          </div>
          <div id="continue-save-info" style="font-size: 11px; color: ${latestSave ? '#7dd3fc' : '#475569'}; font-weight: normal; margin-top: ${latestSave ? '3px' : '2px'};"></div>
        </button>

        <!-- NÚT 2: KHỞI TẠO ĐẠO GIỚI MỚI (CHƠI MỚI) -->
        <button id="btn-new-game" style="
          padding: 14px 18px;
          background: linear-gradient(135deg, rgba(34, 197, 94, 0.35), rgba(74, 222, 128, 0.15));
          border: 1px solid #4ade80;
          border-radius: 10px; color: #ffffff; cursor: pointer;
          font-size: 16px; font-weight: bold; letter-spacing: 1px;
          backdrop-filter: blur(10px); box-shadow: 0 6px 20px rgba(34, 197, 94, 0.2);
          transition: transform 0.15s, box-shadow 0.15s;
          display: flex; align-items: center; justify-content: center; gap: 8px;
        ">
          <span>✨</span> <span>KHỞI TẠO ĐẠO GIỚI MỚI</span>
        </button>

        <!-- NÚT 3: CHƠI THEO BẢN LƯU (LOAD GAME) -->
        <button id="btn-load-game" style="
          padding: 13px 18px;
          background: linear-gradient(135deg, rgba(168, 85, 247, 0.35), rgba(192, 132, 252, 0.15));
          border: 1px solid #c084fc;
          border-radius: 10px; color: #ffffff; cursor: pointer;
          font-size: 15px; font-weight: bold; letter-spacing: 1px;
          backdrop-filter: blur(10px); box-shadow: 0 6px 20px rgba(168, 85, 247, 0.2);
          transition: transform 0.15s, box-shadow 0.15s;
          display: flex; align-items: center; justify-content: center; gap: 8px;
        ">
          <span>📜</span> <span>ĐẠO GIỚI BIÊN NIÊN (BẢN LƯU)</span>
        </button>

        <!-- NÚT PHỤ: HƯỚNG DẪN & CÀI ĐẶT -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 4px;">
          <button id="btn-guide" style="
            padding: 10px; background: rgba(30, 41, 59, 0.7); border: 1px solid rgba(255, 255, 255, 0.18);
            border-radius: 8px; color: #cbd5e1; cursor: pointer; font-size: 12px; font-weight: 500;
            display: flex; align-items: center; justify-content: center; gap: 6px; backdrop-filter: blur(8px);
          ">
            <span>📖</span> <span>Hướng Dẫn</span>
          </button>
          <button id="btn-settings" style="
            padding: 10px; background: rgba(30, 41, 59, 0.7); border: 1px solid rgba(255, 255, 255, 0.18);
            border-radius: 8px; color: #cbd5e1; cursor: pointer; font-size: 12px; font-weight: 500;
            display: flex; align-items: center; justify-content: center; gap: 6px; backdrop-filter: blur(8px);
          ">
            <span>⚙️</span> <span>Thiết Lập</span>
          </button>
        </div>
      </div>

      <!-- FOOTER -->
      <div style="font-size: 11px; color: #64748b; text-align: center; margin-top: 8px;">
        Phiên bản v0.2.0 • Tu Tiên Simulator • Tự chủ phàm nhân & thức tỉnh linh căn
      </div>
    `;

    this.container.appendChild(uiLayer);

    const continueInfo = uiLayer.querySelector('#continue-save-info');
    if (continueInfo) {
      continueInfo.textContent = latestSave
        ? `[${latestSave.name}] • ${latestSave.inGameDateStr} • ${Number(latestSave.residentCount) || 0} Cư Dân`
        : 'Chưa có bản lưu nào trong máy';
    }

    // Gắn hiệu ứng hover nút bấm
    const buttons = uiLayer.querySelectorAll('button');
    buttons.forEach(btn => {
      btn.addEventListener('mouseenter', () => {
        if (!btn.disabled && btn.style.cursor !== 'not-allowed') {
          btn.style.transform = 'translateY(-2px)';
        }
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.transform = 'translateY(0)';
      });
    });

    // 1. Xử lý Chơi Tiếp
    const btnContinue = uiLayer.querySelector('#btn-continue') as HTMLButtonElement;
    if (latestSave) {
      btnContinue.addEventListener('click', async () => {
        const ok = await SaveManager.loadSlot(this.engine, latestSave.id);
        if (ok) {
          this.enterGame();
        } else {
          alert('Không thể nạp bản lưu gần nhất!');
        }
      });
    }

    // 2. Xử lý Chơi Mới
    const btnNewGame = uiLayer.querySelector('#btn-new-game') as HTMLButtonElement;
    btnNewGame.addEventListener('click', () => {
      this.openNewGameModal();
    });

    // 3. Xử lý Mở danh sách bản lưu
    const btnLoadGame = uiLayer.querySelector('#btn-load-game') as HTMLButtonElement;
    btnLoadGame.addEventListener('click', () => {
      this.openSaveSlotsModal();
    });

    // 4. Xử lý Hướng Dẫn
    const btnGuide = uiLayer.querySelector('#btn-guide') as HTMLButtonElement;
    btnGuide.addEventListener('click', () => {
      this.openGuideModal();
    });

    // 5. Xử lý Thiết Lập
    const btnSettings = uiLayer.querySelector('#btn-settings') as HTMLButtonElement;
    btnSettings.addEventListener('click', () => {
      this.openSettingsModal();
    });
  }

  /**
   * Modal Khởi Tạo Thế Giới Mới (New Game)
   */
  public openNewGameModal(): void {
    const modal = document.createElement('div');
    modal.className = 'interactive-ui';
    modal.style.cssText = `
      position: absolute; top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(4, 7, 17, 0.85); backdrop-filter: blur(12px);
      z-index: 600; display: flex; justify-content: center; align-items: center;
    `;

    let currentName = RANDOM_REALM_NAMES[Math.floor(Math.random() * RANDOM_REALM_NAMES.length)];
    let currentSeed = Math.floor(Math.random() * 90000 + 10000);

    modal.innerHTML = `
      <div style="
        width: 440px; background: rgba(15, 23, 42, 0.95); border: 1px solid #4ade80;
        border-radius: 14px; padding: 22px 26px; box-shadow: 0 16px 45px rgba(0, 0, 0, 0.8);
        display: flex; flex-direction: column; gap: 16px; color: #e2e8f0;
      ">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #334155; padding-bottom: 10px;">
          <h2 style="margin: 0; font-size: 20px; color: #4ade80; display: flex; align-items: center; gap: 8px;">
            <span>✨</span> Khởi Tạo Đạo Giới Mới
          </h2>
          <button id="close-modal-btn" style="background: transparent; border: none; color: #94a3b8; cursor: pointer; font-size: 18px;">✕</button>
        </div>

        <!-- TÊN THẾ GIỚI -->
        <div style="display: flex; flex-direction: column; gap: 6px;">
          <label style="font-size: 12px; color: #94a3b8; font-weight: bold;">Tên Đạo Giới / Đại Lục:</label>
          <div style="display: flex; gap: 8px;">
            <input id="input-world-name" type="text" value="${currentName}" style="
              flex: 1; background: #0f172a; border: 1px solid #334155; border-radius: 6px;
              padding: 8px 12px; color: #f8fafc; font-size: 14px; outline: none; font-weight: 500;
            " />
            <button id="random-name-btn" title="Đổi tên ngẫu nhiên" style="
              background: #1e293b; border: 1px solid #475569; border-radius: 6px; color: #facc15;
              padding: 0 12px; cursor: pointer; font-size: 16px;
            ">🎲</button>
          </div>
        </div>

        <!-- ĐỊA MẠO THẾ GIỚI -->
        <div style="display: flex; flex-direction: column; gap: 6px;">
          <label style="font-size: 12px; color: #94a3b8; font-weight: bold;">Hình Thái Địa Mạo Khởi Nguyên:</label>
          <select id="select-template" style="
            background: #0f172a; border: 1px solid #334155; border-radius: 6px;
            padding: 8px 12px; color: #f8fafc; font-size: 13px; outline: none; cursor: pointer;
          ">
            <option value="thap_van_dai_son" selected>🏔️ Thập Vạn Đại Sơn (Núi cao trùng điệp, linh khí phong phú)</option>
            <option value="dong_bang_trung_tho">🌾 Đồng Bằng Trung Thổ (Phì nhiêu màu mỡ, nhiều phàm nhân)</option>
            <option value="ma_vuc_dam_lay">🌫️ Ma Vực Đầm Lầy (U ám chướng khí, linh mộc dị thảo)</option>
            <option value="hai_dao_tien_son">🏝️ Hải Đảo Tiên Sơn (Biển cả mênh mông, quần đảo kỳ vĩ, sông hồ trù phú)</option>
            <option value="random">🌌 Khởi Nguyên Hỗn Độn (Địa hình ngẫu nhiên phong phú)</option>
          </select>
        </div>

        <!-- HẠT GIỐNG THẾ GIỚI (SEED) -->
        <div style="display: flex; flex-direction: column; gap: 6px;">
          <label style="font-size: 12px; color: #94a3b8; font-weight: bold;">Thiên Đạo Kỳ Vận (Seed):</label>
          <div style="display: flex; gap: 8px;">
            <input id="input-seed" type="number" value="${currentSeed}" style="
              flex: 1; background: #0f172a; border: 1px solid #334155; border-radius: 6px;
              padding: 8px 12px; color: #f8fafc; font-size: 14px; outline: none;
            " />
            <button id="random-seed-btn" title="Sinh hạt giống ngẫu nhiên" style="
              background: #1e293b; border: 1px solid #475569; border-radius: 6px; color: #38bdf8;
              padding: 0 12px; cursor: pointer; font-size: 16px;
            ">🎲</button>
          </div>
        </div>

        <!-- QUY MÔ THẾ GIỚI -->
        <div style="display: flex; flex-direction: column; gap: 6px;">
          <label style="font-size: 12px; color: #94a3b8; font-weight: bold;">Quy Mô Đạo Giới (Kích thước bản đồ):</label>
          <select id="select-world-size" style="
            background: #0f172a; border: 1px solid #334155; border-radius: 6px;
            padding: 8px 12px; color: #f8fafc; font-size: 13px; outline: none; cursor: pointer;
          ">
            <option value="small">🪐 Tiểu Thiên Giới (150x150 ô · ~200 - 400 cư dân)</option>
            <option value="medium">🌏 Trung Thiên Giới (250x250 ô · ~500 - 800 cư dân)</option>
            <option value="large" selected>🌌 Đại Thiên Giới (360x360 ô · 1.000 - 1.500 cư dân - Chuẩn)</option>
            <option value="grand">✨ Thái Cổ Hồng Hoang (500x500 ô · 2.000+ sinh linh)</option>
          </select>
        </div>

        <!-- MẬT ĐỘ LINH KHÍ BAN ĐẦU -->
        <div style="display: flex; flex-direction: column; gap: 6px;">
          <label style="font-size: 12px; color: #94a3b8; font-weight: bold;">Mật Độ Linh Khí Khởi Đầu:</label>
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px;">
            <label style="display: flex; align-items: center; gap: 5px; font-size: 12px; background: #1e293b; padding: 6px 10px; border-radius: 6px; cursor: pointer;">
              <input type="radio" name="qi-density" value="0.7" /> Cằn Cỗi
            </label>
            <label style="display: flex; align-items: center; gap: 5px; font-size: 12px; background: #1e293b; padding: 6px 10px; border-radius: 6px; cursor: pointer;">
              <input type="radio" name="qi-density" value="1.0" checked /> Cân Bằng
            </label>
            <label style="display: flex; align-items: center; gap: 5px; font-size: 12px; background: #1e293b; padding: 6px 10px; border-radius: 6px; cursor: pointer;">
              <input type="radio" name="qi-density" value="1.5" /> Phong Phú
            </label>
          </div>
        </div>

        <!-- NÚT HÀNH ĐỘNG -->
        <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 8px; border-top: 1px solid #334155; padding-top: 14px;">
          <button id="cancel-btn" style="background: transparent; border: 1px solid #475569; color: #94a3b8; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 13px;">Hủy Bỏ</button>
          <button id="create-world-btn" style="
            background: linear-gradient(135deg, #16a34a, #22c55e); border: none; color: #fff;
            padding: 8px 22px; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: bold;
            box-shadow: 0 4px 14px rgba(34, 197, 94, 0.35);
          ">Khai Thiên Lập Địa ⚡</button>
        </div>
      </div>
    `;

    this.container.appendChild(modal);

    const nameInput = modal.querySelector('#input-world-name') as HTMLInputElement;
    const seedInput = modal.querySelector('#input-seed') as HTMLInputElement;
    const templateSelect = modal.querySelector('#select-template') as HTMLSelectElement;

    modal.querySelector('#random-name-btn')?.addEventListener('click', () => {
      nameInput.value = RANDOM_REALM_NAMES[Math.floor(Math.random() * RANDOM_REALM_NAMES.length)];
    });

    modal.querySelector('#random-seed-btn')?.addEventListener('click', () => {
      seedInput.value = Math.floor(Math.random() * 90000 + 10000).toString();
    });

    const closeModal = () => modal.remove();
    modal.querySelector('#close-modal-btn')?.addEventListener('click', closeModal);
    modal.querySelector('#cancel-btn')?.addEventListener('click', closeModal);

    modal.querySelector('#create-world-btn')?.addEventListener('click', () => {
      const selectedQiRadio = modal.querySelector('input[name="qi-density"]:checked') as HTMLInputElement;
      const qiMultiplier = parseFloat(selectedQiRadio?.value || '1.0');
      const sizeSelect = modal.querySelector('#select-world-size') as HTMLSelectElement;
      const worldSize = (sizeSelect?.value || 'large') as NewWorldOptions['worldSize'];

      this.engine.initNewWorld({
        name: nameInput.value.trim() || 'Thái Sơ Đại Lục',
        template: templateSelect.value as NewWorldOptions['template'],
        seed: parseInt(seedInput.value) || 8888,
        qiMultiplier,
        worldSize
      });

      closeModal();
      this.enterGame();
    });
  }

  /**
   * Modal Quản Lý Các Bản Lưu (Save Slots / Load Game / Import / Export)
   */
  public openSaveSlotsModal(): void {
    const modal = document.createElement('div');
    modal.className = 'interactive-ui';
    modal.style.cssText = `
      position: absolute; top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(4, 7, 17, 0.85); backdrop-filter: blur(12px);
      z-index: 600; display: flex; justify-content: center; align-items: center;
    `;

    const renderSlotsList = () => {
      const render = () => {
        const slots = SaveManager.listSlots();
        const listContainer = modal.querySelector('#slots-list');
        if (!listContainer) return;

        if (slots.length === 0) {
          listContainer.innerHTML = `
            <div style="text-align: center; padding: 40px 10px; color: #64748b; font-style: italic;">
              Chưa có bản lưu nào. Hãy vào game và nhấn Lưu Game Nhanh hoặc phím ESC!
            </div>
          `;
          return;
        }

        listContainer.innerHTML = '';

        for (const slot of slots) {
          const row = document.createElement('div');
          row.style.cssText = `
            background: #1e293b; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px;
            padding: 12px 14px; display: flex; justify-content: space-between; align-items: center;
            transition: background 0.15s, border-color 0.15s;
          `;

          const infoCol = document.createElement('div');

        const titleLine = document.createElement('div');
        titleLine.style.cssText = 'display: flex; align-items: center; gap: 8px;';

        const nameSpan = document.createElement('span');
        nameSpan.style.cssText = 'font-size: 15px; font-weight: bold; color: #f8fafc;';
        nameSpan.textContent = String(slot.name ?? '');

        const idSpan = document.createElement('span');
        idSpan.style.cssText = 'font-size: 10px; background: rgba(56, 189, 248, 0.15); border: 1px solid #38bdf8; color: #38bdf8; padding: 1px 6px; border-radius: 4px;';
        idSpan.textContent = String(slot.id ?? '');

        titleLine.appendChild(nameSpan);
        titleLine.appendChild(idSpan);

        const statsLine = document.createElement('div');
        statsLine.style.cssText = 'font-size: 11px; color: #94a3b8; margin-top: 4px;';
        statsLine.textContent = `⏳ ${slot.inGameDateStr ?? ''} • 👥 ${Number(slot.residentCount) || 0} Cư Dân (${Number(slot.cultivatorCount) || 0} Tu Sĩ) • 🛖 ${Number(slot.buildingCount) || 0} Công Trình`;

        const dateLine = document.createElement('div');
        dateLine.style.cssText = 'font-size: 10px; color: #64748b; margin-top: 2px;';
        dateLine.textContent = `🕒 Lưu lúc: ${slot.realDateStr ?? ''}`;

        infoCol.appendChild(titleLine);
        infoCol.appendChild(statsLine);
        infoCol.appendChild(dateLine);

        const btnCol = document.createElement('div');
        btnCol.style.cssText = 'display: flex; gap: 6px;';

        const loadBtn = document.createElement('button');
        loadBtn.className = 'load-slot-btn';
        loadBtn.dataset.id = String(slot.id ?? '');
        loadBtn.style.cssText = `
          background: #2563eb; border: none; color: #fff; border-radius: 6px;
          padding: 6px 14px; cursor: pointer; font-size: 12px; font-weight: bold;
        `;
        loadBtn.textContent = 'Vào Chơi ▶';
        loadBtn.addEventListener('click', async () => {
          const ok = await SaveManager.loadSlot(this.engine, slot.id);
          if (ok) {
            modal.remove();
            this.enterGame();
          } else {
            alert('Không thể nạp bản lưu này!');
          }
        });

        const exportBtn = document.createElement('button');
        exportBtn.className = 'export-slot-btn';
        exportBtn.dataset.id = String(slot.id ?? '');
        exportBtn.title = 'Xuất tệp JSON';
        exportBtn.style.cssText = `
          background: #334155; border: 1px solid #475569; color: #cbd5e1; border-radius: 6px;
          padding: 6px 10px; cursor: pointer; font-size: 12px;
        `;
        exportBtn.textContent = '💾 Xuất';
        exportBtn.addEventListener('click', async () => {
          await SaveManager.exportSlotAsFile(slot.id);
        });

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-slot-btn';
        deleteBtn.dataset.id = String(slot.id ?? '');
        deleteBtn.title = 'Xóa bản lưu';
        deleteBtn.style.cssText = `
          background: rgba(220, 38, 38, 0.2); border: 1px solid #dc2626; color: #fca5a5; border-radius: 6px;
          padding: 6px 10px; cursor: pointer; font-size: 12px;
        `;
        deleteBtn.textContent = '🗑️';
        deleteBtn.addEventListener('click', async () => {
          if (confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn bản lưu [${slot.id}] không?`)) {
            try {
              await SaveManager.deleteSlot(slot.id);
              renderSlotsList();
              this.renderMenu();
            } catch (err: any) {
              alert(`Không thể xóa bản lưu [${slot.id}]: ${err?.message || err}`);
            }
          }
        });

        btnCol.appendChild(loadBtn);
        btnCol.appendChild(exportBtn);
        btnCol.appendChild(deleteBtn);

        row.appendChild(infoCol);
        row.appendChild(btnCol);
        listContainer.appendChild(row);
      }
    };
    render();
    SaveManager.syncIndexFromStorage().then(() => render()).catch(() => {});
  };

    modal.innerHTML = `
      <div style="
        width: 580px; max-height: 80vh; background: rgba(15, 23, 42, 0.98); border: 1px solid #c084fc;
        border-radius: 14px; padding: 22px 24px; box-shadow: 0 16px 45px rgba(0, 0, 0, 0.85);
        display: flex; flex-direction: column; gap: 14px; color: #e2e8f0;
      ">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #334155; padding-bottom: 10px;">
          <h2 style="margin: 0; font-size: 20px; color: #c084fc; display: flex; align-items: center; gap: 8px;">
            <span>📜</span> Đạo Giới Biên Niên (Danh Sách Bản Lưu)
          </h2>
          <button id="close-slots-btn" style="background: transparent; border: none; color: #94a3b8; cursor: pointer; font-size: 18px;">✕</button>
        </div>

        <!-- THANH CÔNG CỤ NHẬP FILE SAVE -->
        <div style="display: flex; justify-content: space-between; align-items: center; background: #0f172a; padding: 8px 12px; border-radius: 8px; border: 1px solid #334155;">
          <span style="font-size: 12px; color: #94a3b8;">Bạn có file sao lưu (.json) từ máy tính?</span>
          <div>
            <input type="file" id="file-import-input" accept=".json" style="display: none;" />
            <button id="trigger-import-btn" style="
              background: #7c3aed; border: none; color: #fff; padding: 5px 12px; border-radius: 6px;
              font-size: 11px; font-weight: bold; cursor: pointer;
            ">📥 Tải Lên Tệp Bản Lưu</button>
          </div>
        </div>

        <!-- DANH SÁCH CÁC SLOT -->
        <div id="slots-list" style="display: flex; flex-direction: column; gap: 8px; max-height: 48vh; overflow-y: auto; padding-right: 4px;">
        </div>

        <div style="display: flex; justify-content: flex-end; border-top: 1px solid #334155; padding-top: 10px;">
          <button id="close-btn" style="background: transparent; border: 1px solid #475569; color: #94a3b8; padding: 6px 16px; border-radius: 6px; cursor: pointer; font-size: 12px;">Đóng</button>
        </div>
      </div>
    `;

    this.container.appendChild(modal);
    renderSlotsList();

    modal.querySelector('#close-slots-btn')?.addEventListener('click', () => modal.remove());
    modal.querySelector('#close-btn')?.addEventListener('click', () => modal.remove());

    // Xử lý nút Import File
    const fileInput = modal.querySelector('#file-import-input') as HTMLInputElement;
    modal.querySelector('#trigger-import-btn')?.addEventListener('click', () => {
      fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const content = event.target?.result as string;
          const meta = await SaveManager.importSaveFromJson(content);
          alert(`Đã nhập thành công bản lưu: [${meta.name}]!`);
          renderSlotsList();
          this.renderMenu();
        } catch (err: any) {
          alert('Tệp không đúng định dạng bản lưu Tu Tiên: ' + err.message);
        }
      };
      reader.readAsText(file);
    });
  }

  /**
   * Modal Hướng Dẫn Thượng Đế
   */
  public openGuideModal(): void {
    const modal = document.createElement('div');
    modal.className = 'interactive-ui';
    modal.style.cssText = `
      position: absolute; top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(4, 7, 17, 0.85); backdrop-filter: blur(12px);
      z-index: 600; display: flex; justify-content: center; align-items: center;
    `;

    modal.innerHTML = `
      <div style="
        width: 520px; max-height: 80vh; background: rgba(15, 23, 42, 0.98); border: 1px solid #38bdf8;
        border-radius: 14px; padding: 22px 24px; box-shadow: 0 16px 45px rgba(0, 0, 0, 0.85);
        display: flex; flex-direction: column; gap: 14px; color: #e2e8f0;
      ">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #334155; padding-bottom: 10px;">
          <h2 style="margin: 0; font-size: 18px; color: #38bdf8; display: flex; align-items: center; gap: 8px;">
            <span>📖</span> Đạo Diễn Bách Khoa (Hướng Dẫn)
          </h2>
          <button id="close-guide-btn" style="background: transparent; border: none; color: #94a3b8; cursor: pointer; font-size: 18px;">✕</button>
        </div>

        <div style="display: flex; flex-direction: column; gap: 12px; font-size: 13px; line-height: 1.5; overflow-y: auto; max-height: 52vh; padding-right: 4px;">
          <div>
            <b style="color: #facc15;">1. Quyền Năng Thượng Đế (God Tools):</b>
            <p style="color: #94a3b8; font-size: 12px; margin-top: 3px;">
              • Dùng chuột trái vẽ địa hình (núi, đồi, đồng bằng, đầm lầy).<br>
              • Gieo trồng thảo dược quý như Tụ Linh Diệp, Ngưng Huyết Thảo, Dâu Rừng.<br>
              • Cấy Linh Mạch để nâng cao linh khí cả một vùng.<br>
              • Ban tặng song kiếm hoặc giáp trụ cho cư dân phàm nhân/tu sĩ.
            </p>
          </div>

          <div>
            <b style="color: #4ade80;">2. Đời Sống Phàm Nhân Tự Chủ:</b>
            <p style="color: #94a3b8; font-size: 12px; margin-top: 3px;">
              • Cư dân có 5 nhu cầu: Đói, Khát, Ngủ, Lao động, Giải trí.<br>
              • Họ biết tự xây nhà tranh che mưa tuyết, múc nước giếng làng, nhóm lửa trại.<br>
              • <b>Nấu Ăn</b>: Dùng nguyên liệu thô nấu thành cơm canh nóng hổi (+HP, +Giải trí).<br>
              • Người lớn tự giác nhường cơm nuôi trẻ nhỏ trong làng.
            </p>
          </div>

          <div>
            <b style="color: #c084fc;">3. Lễ Thức Tỉnh Linh Căn Lúc 12 Tuổi:</b>
            <p style="color: #94a3b8; font-size: 12px; margin-top: 3px;">
              • 75% Vô linh căn (mãi là phàm nhân thuần túy, không hấp thu linh khí).<br>
              • 20% Ngũ Hành Tạp Linh Căn, 4% Chân Linh Căn, 0.99% Địa Linh Căn.<br>
              • 0.01% Thiên Linh Căn (Vạn năm có một, tốc độ tu luyện cực hạn).
            </p>
          </div>

          <div>
            <b style="color: #f43f5e;">4. Phím Tắt Tiện Lợi:</b>
            <p style="color: #94a3b8; font-size: 12px; margin-top: 3px;">
              • <b>ESC</b>: Mở Menu Tạm Dừng / Lưu game nhanh.<br>
              • Cuộn chuột: Phóng to / Thu nhỏ thế giới.<br>
              • Chuột phải hoặc kéo thả: Di chuyển tầm nhìn (Camera Pan).
            </p>
          </div>
        </div>

        <div style="display: flex; justify-content: flex-end; border-top: 1px solid #334155; padding-top: 10px;">
          <button id="ok-guide-btn" style="background: #2563eb; border: none; color: #fff; padding: 6px 18px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: bold;">Đã Hiểu</button>
        </div>
      </div>
    `;

    this.container.appendChild(modal);
    modal.querySelector('#close-guide-btn')?.addEventListener('click', () => modal.remove());
    modal.querySelector('#ok-guide-btn')?.addEventListener('click', () => modal.remove());
  }

  /**
   * Modal Cài Đặt (Settings)
   */
  public openSettingsModal(): void {
    const currentSettings = GameSettings.get();
    const modal = document.createElement('div');
    modal.className = 'interactive-ui';
    modal.style.cssText = `
      position: absolute; top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(4, 7, 17, 0.85); backdrop-filter: blur(12px);
      z-index: 600; display: flex; justify-content: center; align-items: center;
    `;

    modal.innerHTML = `
      <div style="
        width: 440px; background: rgba(15, 23, 42, 0.98); border: 1px solid #94a3b8;
        border-radius: 14px; padding: 22px 24px; box-shadow: 0 16px 45px rgba(0, 0, 0, 0.85);
        display: flex; flex-direction: column; gap: 14px; color: #e2e8f0;
      ">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #334155; padding-bottom: 10px;">
          <h2 style="margin: 0; font-size: 18px; color: #f8fafc; display: flex; align-items: center; gap: 8px;">
            <span>⚙️</span> Thiên Đạo Thiết Lập
          </h2>
          <button id="close-settings-btn" style="background: transparent; border: none; color: #94a3b8; cursor: pointer; font-size: 18px;">✕</button>
        </div>

        <div style="display: flex; flex-direction: column; gap: 12px; font-size: 13px;">
          <label style="display: flex; justify-content: space-between; align-items: center; background: #1e293b; padding: 10px 12px; border-radius: 8px; cursor: pointer;">
            <span>💾 Tự động lưu game định kỳ (mỗi 5 phút)</span>
            <input type="checkbox" id="check-autosave" ${currentSettings.autosaveEnabled ? 'checked' : ''} style="cursor: pointer; width: 16px; height: 16px;" />
          </label>

          <label style="display: flex; justify-content: space-between; align-items: center; background: #1e293b; padding: 10px 12px; border-radius: 8px; cursor: pointer;">
            <span>🌸 Hiệu ứng cánh hoa đào và linh khí rơi</span>
            <input type="checkbox" id="check-particles" ${currentSettings.particlesEnabled ? 'checked' : ''} style="cursor: pointer; width: 16px; height: 16px;" />
          </label>

          <div style="background: #1e293b; padding: 10px 12px; border-radius: 8px;">
            <div style="margin-bottom: 6px; font-size: 12px; color: #94a3b8;">Tốc độ mô phỏng mặc định khi vào game:</div>
            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
              <label style="display: flex; align-items: center; gap: 4px; font-size: 12px; cursor: pointer;"><input type="radio" name="default-speed" value="0.5" ${currentSettings.defaultSpeed === 0.5 ? 'checked' : ''} /> 0.5x</label>
              <label style="display: flex; align-items: center; gap: 4px; font-size: 12px; cursor: pointer;"><input type="radio" name="default-speed" value="1" ${currentSettings.defaultSpeed === 1 ? 'checked' : ''} /> 1x (Bình thường)</label>
              <label style="display: flex; align-items: center; gap: 4px; font-size: 12px; cursor: pointer;"><input type="radio" name="default-speed" value="2" ${currentSettings.defaultSpeed === 2 ? 'checked' : ''} /> 2x</label>
              <label style="display: flex; align-items: center; gap: 4px; font-size: 12px; cursor: pointer;"><input type="radio" name="default-speed" value="3" ${currentSettings.defaultSpeed === 3 ? 'checked' : ''} /> 3x</label>
              <label style="display: flex; align-items: center; gap: 4px; font-size: 12px; cursor: pointer;"><input type="radio" name="default-speed" value="5" ${currentSettings.defaultSpeed === 5 ? 'checked' : ''} /> 5x</label>
            </div>
          </div>
        </div>

        <div style="display: flex; justify-content: flex-end; border-top: 1px solid #334155; padding-top: 10px;">
          <button id="save-settings-btn" style="background: #2563eb; border: none; color: #fff; padding: 6px 18px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: bold;">Lưu Thiết Lập</button>
        </div>
      </div>
    `;

    this.container.appendChild(modal);
    modal.querySelector('#close-settings-btn')?.addEventListener('click', () => modal.remove());
    modal.querySelector('#save-settings-btn')?.addEventListener('click', () => {
      const checkAutosave = modal.querySelector('#check-autosave') as HTMLInputElement | null;
      const checkParticles = modal.querySelector('#check-particles') as HTMLInputElement | null;
      const checkedSpeed = modal.querySelector('input[name="default-speed"]:checked') as HTMLInputElement | null;

      const rawSpeed = Number(checkedSpeed?.value || 1);
      const parsedSpeed = sanitizePositiveTimeSpeed(rawSpeed, 1);
      const saved = GameSettings.save({
        autosaveEnabled: checkAutosave ? checkAutosave.checked : true,
        autosaveIntervalMinutes: 5,
        particlesEnabled: checkParticles ? checkParticles.checked : true,
        defaultSpeed: parsedSpeed
      });

      this.bg.particlesEnabled = saved.particlesEnabled;
      this.engine.applySettings(saved);
      if (!this.engine.isMainMenuOpen && !this.engine.isPausedByMenu) {
        this.engine.timeManager.setSpeed(saved.defaultSpeed);
      }

      SaveManager.notifySaveStatus('Đã lưu Thiên Đạo Thiết Lập!', true);
      modal.remove();
    });
  }
}
