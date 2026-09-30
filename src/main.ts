import { AssetManager } from './renderer/assets/AssetManager.ts';
import { Engine } from './core/Engine.ts';
import { UIManager } from './ui/UIManager.ts';
import { SaveManager } from './modules/save/SaveManager.ts';
import { GameSettings } from './core/GameSettings.ts';
import { EventBus } from './core/EventBus.ts';

// Khởi chạy game khi DOM đã sẵn sàng
window.addEventListener('DOMContentLoaded', async () => {
  await AssetManager.getInstance().loadAppearanceCatalog();
  await SaveManager.syncIndexFromStorage().catch(() => {});
  console.log('⚡ Đang khởi tạo thế giới Thượng Đế Tu Tiên Simulator...');

  // 1. Khởi tạo Engine cốt lõi & nạp thiết lập người dùng
  GameSettings.load();
  const engine = new Engine();

  // 2. Khởi tạo thế giới mặc định ban đầu
  engine.initNewWorld({
    name: 'Thái Cổ Giới',
    template: 'thap_van_dai_son',
    seed: 8888,
    qiMultiplier: 1.0
  });

  // 3. Khởi tạo Giao diện Thượng Đế (Bao gồm Main Menu & Pause Menu)
  new UIManager(engine);

  // 4. Bắt đầu vòng lặp game
  engine.start();

  // 5. Thiết lập tự động lưu định kỳ mỗi 5 phút theo Thiên Đạo Thiết Lập (chỉ chạy khi autosaveEnabled = true)
  let autosaveTimerId: ReturnType<typeof setInterval> | null = null;

  const scheduleAutosave = () => {
    if (autosaveTimerId !== null) {
      clearInterval(autosaveTimerId);
      autosaveTimerId = null;
    }

    const settings = GameSettings.get();
    if (!settings.autosaveEnabled) return;

    const intervalMs = Math.max(1, settings.autosaveIntervalMinutes) * 60 * 1000;
    autosaveTimerId = setInterval(async () => {
      if (!GameSettings.get().autosaveEnabled) return;
      if (!engine.isMainMenuOpen && !engine.isPausedByMenu) {
        try {
          const meta = await SaveManager.saveSlot(engine, 'autosave', `${engine.worldName} (Tự Động Lưu)`);
          console.log(`🔄 [Hệ Thống] Đã tự động lưu thế giới vào slot autosave lúc ${meta.realDateStr}.`);
          SaveManager.notifySaveStatus(`Tự động lưu thế giới thành công! (${meta.realDateStr})`, true);
        } catch (e: any) {
          console.error('Lỗi tự động lưu:', e);
          SaveManager.notifySaveStatus(`Tự động lưu thất bại: ${e.message || e}`, false);
        }
      }
    }, intervalMs);
  };

  scheduleAutosave();
  EventBus.getInstance().on('settings:changed', () => {
    scheduleAutosave();
  });

  // Tự động lưu khi người chơi ẩn tab hoặc chuyển ứng dụng (nỗ lực tốt nhất khi rời trang, không dựa vào beforeunload)
  document.addEventListener('visibilitychange', () => {
    if (GameSettings.get().autosaveEnabled) {
      SaveManager.handleVisibilityChange(engine, document.visibilityState).catch((e: any) => {
        console.error('Lỗi khi tự động lưu khi ẩn trang:', e);
      });
    }
  });

  console.log('🌟 Thế giới Tu Tiên & Hệ Thống Đạo Giới Biên Niên đã sẵn sàng!');
});
