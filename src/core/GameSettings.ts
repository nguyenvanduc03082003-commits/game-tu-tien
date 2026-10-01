import { EventBus } from './EventBus.ts';
import { TimeSpeed, sanitizePositiveTimeSpeed } from './TimeManager.ts';

export interface GameSettingsData {
  autosaveEnabled: boolean;
  autosaveIntervalMinutes: number;
  particlesEnabled: boolean;
  defaultSpeed: TimeSpeed;
}

const SETTINGS_STORAGE_KEY = 'tu_tien_game_settings_v1';

const DEFAULT_SETTINGS: GameSettingsData = {
  autosaveEnabled: true,
  autosaveIntervalMinutes: 5,
  particlesEnabled: true,
  defaultSpeed: 1
};

export class GameSettings {
  private static current: GameSettingsData = { ...DEFAULT_SETTINGS };
  private static loaded = false;

  public static getDefaults(): GameSettingsData {
    return { ...DEFAULT_SETTINGS };
  }

  public static load(): GameSettingsData {
    if (typeof localStorage !== 'undefined') {
      try {
        const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') {
            this.current = this.sanitize(parsed);
            this.loaded = true;
            return { ...this.current };
          }
        }
      } catch (_e) {
        // Fallback to default settings if localStorage is corrupted
      }
    }
    if (!this.loaded) {
      this.current = { ...DEFAULT_SETTINGS };
      this.loaded = true;
    }
    return { ...this.current };
  }

  public static get(): GameSettingsData {
    if (!this.loaded) {
      return this.load();
    }
    return { ...this.current };
  }

  public static save(partial: Partial<GameSettingsData>): GameSettingsData {
    const merged = this.sanitize({
      ...this.get(),
      ...partial
    });
    this.current = merged;
    this.loaded = true;

    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(merged));
      } catch (_e) {
        // Ignore storage quota errors
      }
    }

    EventBus.getInstance().emit('settings:changed', { ...merged });
    return { ...merged };
  }

  public static reset(): GameSettingsData {
    this.current = { ...DEFAULT_SETTINGS };
    this.loaded = true;
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.removeItem(SETTINGS_STORAGE_KEY);
      } catch (_e) {}
    }
    EventBus.getInstance().emit('settings:changed', { ...this.current });
    return { ...this.current };
  }

  private static sanitize(input: Record<string, unknown>): GameSettingsData {
    const autosaveEnabled = typeof input.autosaveEnabled === 'boolean'
      ? input.autosaveEnabled
      : DEFAULT_SETTINGS.autosaveEnabled;

    const rawInterval = Number(input.autosaveIntervalMinutes);
    const autosaveIntervalMinutes = Number.isFinite(rawInterval) && rawInterval > 0
      ? rawInterval
      : DEFAULT_SETTINGS.autosaveIntervalMinutes;

    const particlesEnabled = typeof input.particlesEnabled === 'boolean'
      ? input.particlesEnabled
      : DEFAULT_SETTINGS.particlesEnabled;

    const rawSpeed = Number(input.defaultSpeed);
    const defaultSpeed: TimeSpeed = sanitizePositiveTimeSpeed(rawSpeed, DEFAULT_SETTINGS.defaultSpeed);

    return {
      autosaveEnabled,
      autosaveIntervalMinutes,
      particlesEnabled,
      defaultSpeed
    };
  }
}
