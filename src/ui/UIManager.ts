import { Engine } from '../core/Engine.ts';
import { EventBus } from '../core/EventBus.ts';
import { TimeControls } from './TimeControls.ts';
import { InspectorPanel } from './InspectorPanel.ts';
import { GodToolbar } from './GodToolbar.ts';
import { WorldChronicle } from './WorldChronicle.ts';
import { MainMenu } from './MainMenu.ts';
import { PauseMenu } from './PauseMenu.ts';

import { Minimap } from './Minimap.ts';

export class UIManager {
  public readonly timeControls: TimeControls;
  public readonly inspectorPanel: InspectorPanel;
  public readonly godToolbar: GodToolbar;
  public readonly worldChronicle: WorldChronicle;
  public readonly mainMenu: MainMenu;
  public readonly pauseMenu: PauseMenu;
  public readonly minimap: Minimap;

  constructor(engine: Engine) {
    const overlay = document.getElementById('ui-overlay');
    if (!overlay) {
      throw new Error('Không tìm thấy #ui-overlay trong DOM!');
    }

    // Ban đầu khi vào game, ẩn #ui-overlay vì đang ở Main Menu
    overlay.style.display = 'none';
    overlay.innerHTML = '';

    // Gom cụm HUD góc trên bên phải (TimeControls & Minimap) để không bị chồng đè
    const topRightHud = document.createElement('div');
    topRightHud.id = 'hud-top-right';
    topRightHud.className = 'hud-top-right';
    overlay.appendChild(topRightHud);

    this.timeControls = new TimeControls(topRightHud, engine);
    this.minimap = new Minimap(topRightHud, engine);
    this.inspectorPanel = new InspectorPanel(overlay, engine.world);
    this.godToolbar = new GodToolbar(overlay, engine);
    this.worldChronicle = new WorldChronicle(overlay);

    // Vòng lặp cập nhật Minimap mượt mà
    let lastTileRefresh = 0;
    const updateMinimap = () => {
      if (!engine.isMainMenuOpen && !engine.isPausedByMenu) {
        this.minimap.update();
        const now = performance.now();
        if (now - lastTileRefresh >= 500) {
          this.inspectorPanel.refreshTile();
          this.inspectorPanel.refreshRelations();
          lastTileRefresh = now;
        }
      }
      requestAnimationFrame(updateMinimap);
    };
    requestAnimationFrame(updateMinimap);

    // Khởi tạo Main Menu & Pause Menu
    this.mainMenu = new MainMenu(engine, () => {
      // Khi người chơi bấm Chơi Tiếp / Chơi Mới / Tải Bản Lưu -> Vào game
      overlay.style.display = 'block';
    });

    this.pauseMenu = new PauseMenu(engine, this.mainMenu);

    // Lắng nghe sự kiện bật/tắt Pause Menu từ nút bấm
    EventBus.getInstance().on('ui:toggle_pause_menu', () => {
      this.pauseMenu.toggle();
    });

    // Lắng nghe sự kiện click chọn thực thể hoặc ô đất
    EventBus.getInstance().on<{ entity: number | null; chest?: number | null; plant?: number | null; building?: number | null; tile: any; qiTile?: any }>('ui:inspector_selected', (data) => {
      if (engine.isMainMenuOpen || engine.isPausedByMenu) return;

      if (data.chest !== null && data.chest !== undefined && data.entity === null) {
        this.inspectorPanel.showChest(data.chest);
      } else if (data.entity !== null) {
        this.inspectorPanel.showEntity(data.entity);
      } else if (data.building !== null && data.building !== undefined) {
        this.inspectorPanel.showBuilding(data.building);
      } else if (data.tile) {
        this.inspectorPanel.showTile(data.tile, data.qiTile, data.plant);
      } else {
        this.inspectorPanel.hide();
      }
    });

    // Khi khởi tạo thế giới mới hoặc nạp bản lưu, đóng bảng soi thực thể
    EventBus.getInstance().on('world:reset', () => {
      this.inspectorPanel.hide();
    });
  }
}
