import { calculatePlantGrowth } from '../world/TerrainEnvironment.ts';
import { System } from '../../ecs/System.ts';
import { ECSWorld } from '../../ecs/World.ts';
import { WeatherType, WEATHER_CONFIGS } from './WeatherTypes.ts';
import { calculateBaseTemperature } from '../world/ElevationRules.ts';
import { WorldMap } from '../world/WorldMap.ts';
import { TimeManager, Season } from '../../core/TimeManager.ts';
import { EventBus } from '../../core/EventBus.ts';

export class WeatherSystem implements System {
  public name = 'WeatherSystem';
  public enabled = true;
  public priority = 15;

  private worldMap: WorldMap;
  private timeManager = TimeManager.getInstance();
  private eventBus = EventBus.getInstance();

  public currentWeather: WeatherType = WeatherType.CLEAR;
  private weatherTimer: number = 0;
  private tileTimer: number = 0;
  private weatherDuration: number = 25.0; // 25 giây thực ở 1x đổi thời tiết một lần
  private seasonalTempOffset: number = 0;
  private unsubscribes: (() => void)[] = [];

  constructor(worldMap: WorldMap) {
    this.worldMap = worldMap;
    if (typeof window !== 'undefined') {
      (window as any)._currentWeather = this.currentWeather;
    }
  }

  public init(): void {
    this.destroy();
    this.unsubscribes.push(
      this.eventBus.on<{ season: Season; year: number }>('time:season_changed', (data) => {
        this.updateSeasonalImpact(data.season);
      })
    );

    const initialDate = this.timeManager.getDate();
    this.updateSeasonalImpact(initialDate.season);
    if (typeof window !== 'undefined') {
      (window as any)._currentWeather = this.currentWeather;
    }
  }

  public destroy(): void {
    for (const unsub of this.unsubscribes) unsub();
    this.unsubscribes = [];
  }

  public reset(): void {
    this.currentWeather = WeatherType.CLEAR;
    this.weatherTimer = 0;
    this.tileTimer = 0;
    this.weatherDuration = 25;
    this.seasonalTempOffset = 0;
    if (typeof window !== 'undefined') {
      (window as any)._currentWeather = this.currentWeather;
    }
  }

  public getSeasonalTempOffset(): number {
    return this.seasonalTempOffset;
  }

  public serializeState(): {
    currentWeather: string;
    weatherTimer: number;
    tileTimer: number;
    weatherDuration: number;
    seasonalTempOffset: number;
  } {
    return {
      currentWeather: this.currentWeather,
      weatherTimer: this.weatherTimer,
      tileTimer: this.tileTimer,
      weatherDuration: this.weatherDuration,
      seasonalTempOffset: this.seasonalTempOffset
    };
  }

  public restoreState(state?: {
    currentWeather?: WeatherType | string;
    weatherTimer?: number;
    tileTimer?: number;
    weatherDuration?: number;
    seasonalTempOffset?: number;
  }): void {
    this.reset();
    if (!state || typeof state !== 'object') {
      this.init();
      return;
    }

    this.destroy();
    this.unsubscribes.push(
      this.eventBus.on<{ season: Season; year: number }>('time:season_changed', (data) => {
        this.updateSeasonalImpact(data.season);
      })
    );

    const date = this.timeManager.getDate();
    if (date.season === Season.SPRING) this.seasonalTempOffset = 0;
    else if (date.season === Season.SUMMER) this.seasonalTempOffset = 7;
    else if (date.season === Season.AUTUMN) this.seasonalTempOffset = -3;
    else if (date.season === Season.WINTER) this.seasonalTempOffset = -14;

    if (typeof state.seasonalTempOffset === 'number' && Number.isFinite(state.seasonalTempOffset)) {
      this.seasonalTempOffset = state.seasonalTempOffset;
    }
    if (typeof state.weatherTimer === 'number' && Number.isFinite(state.weatherTimer) && state.weatherTimer >= 0) {
      this.weatherTimer = state.weatherTimer;
    }
    if (typeof state.tileTimer === 'number' && Number.isFinite(state.tileTimer) && state.tileTimer >= 0) {
      this.tileTimer = state.tileTimer;
    }
    if (typeof state.weatherDuration === 'number' && Number.isFinite(state.weatherDuration) && state.weatherDuration > 0) {
      this.weatherDuration = state.weatherDuration;
    }
    if (state.currentWeather && Object.prototype.hasOwnProperty.call(WEATHER_CONFIGS, state.currentWeather)) {
      this.currentWeather = state.currentWeather as WeatherType;
    }
    if (typeof window !== 'undefined') {
      (window as any)._currentWeather = this.currentWeather;
    }
    this.eventBus.emit('weather:changed', {
      weather: this.currentWeather,
      config: WEATHER_CONFIGS[this.currentWeather]
    });
  }

  private updateSeasonalImpact(season: Season): void {
    if (season === Season.SPRING) {
      this.seasonalTempOffset = 0;
    } else if (season === Season.SUMMER) {
      this.seasonalTempOffset = 7;
    } else if (season === Season.AUTUMN) {
      this.seasonalTempOffset = -3;
    } else if (season === Season.WINTER) {
      this.seasonalTempOffset = -14;
    }

    this.pickWeatherForSeason(season);
  }

  private pickWeatherForSeason(season: Season): void {
    const r = Math.random();

    if (season === Season.SPRING) {
      this.setWeather(r < 0.45 ? WeatherType.RAIN : r < 0.8 ? WeatherType.CLEAR : WeatherType.FOG);
    } else if (season === Season.SUMMER) {
      this.setWeather(r < 0.4 ? WeatherType.CLEAR : r < 0.7 ? WeatherType.THUNDERSTORM : WeatherType.DROUGHT);
    } else if (season === Season.AUTUMN) {
      this.setWeather(r < 0.5 ? WeatherType.CLEAR : r < 0.8 ? WeatherType.FOG : WeatherType.RAIN);
    } else if (season === Season.WINTER) {
      this.setWeather(r < 0.65 ? WeatherType.SNOW : WeatherType.CLEAR);
    }
  }

  public setWeather(weather: WeatherType): void {
    if (this.currentWeather !== weather) {
      this.currentWeather = weather;
      if (typeof window !== 'undefined') {
        (window as any)._currentWeather = this.currentWeather;
      }
      this.weatherTimer = 0;
      this.eventBus.emit('weather:changed', {
        weather: this.currentWeather,
        config: WEATHER_CONFIGS[this.currentWeather]
      });

      if (weather === WeatherType.THUNDERSTORM) {
        this.eventBus.emit('world:log', {
          type: 'anomaly',
          message: `⚡ THIÊN ĐỊA DỊ TƯỢNG: Cửu thiên lôi vân cuồn cuộn che khuất nhật nguyệt, Lôi Bạo giáng thế!`
        });
      } else if (weather === WeatherType.DROUGHT) {
        this.eventBus.emit('world:log', {
          type: 'anomaly',
          message: `🔥 THIÊN ĐỊA DỊ TƯỢNG: Cửu dương thiêu đốt đại địa, thiên địa đại hạn giáng lâm, vạn vật khô kiệt!`
        });
      }
    }
  }

  public update(_world: ECSWorld, dt: number): void {
    if (!Number.isFinite(dt) || dt <= 0) return;
    this.weatherTimer += dt;

    // Định kỳ đổi thời tiết tự nhiên
    if (this.weatherTimer >= this.weatherDuration) {
      const date = this.timeManager.getDate();
      this.weatherTimer %= this.weatherDuration;
      this.pickWeatherForSeason(date.season);
    }

    // Tác động thời tiết và mùa màng lên nhiệt độ/độ ẩm ô đất (Cập nhật định kỳ mỗi 0.5 giây để tối ưu FPS)
    this.tileTimer += dt;
    if (this.tileTimer < 0.5) return;
    const tileDt = this.tileTimer;
    this.tileTimer = 0;

    const weatherCfg = WEATHER_CONFIGS[this.currentWeather];
    const len = this.worldMap.width * this.worldMap.height;
    const targetTempOffset = this.seasonalTempOffset + weatherCfg.tempOffset;
    const moistureDelta = weatherCfg.moistureDelta * tileDt;
    const temperatureBlend = 1 - Math.pow(0.95, tileDt / 0.5);

    for (let i = 0; i < len; i++) {
      const tile = this.worldMap.getTileByIndex(i);
      if (!tile) continue;

      // Điều chỉnh độ ẩm
      tile.moisture = Math.max(0, Math.min(1.0, tile.moisture + moistureDelta));

      tile.plantGrowth = calculatePlantGrowth(tile.terrain, tile.moisture);

      // Điều chỉnh nhiệt độ mượt mà về mức nhiệt mùa + thời tiết dựa trên nhiệt độ gốc của địa hình
      const baseTemp = calculateBaseTemperature(tile.terrain, tile.elevation);
      const targetTemp = baseTemp + targetTempOffset;
      tile.temperature += (targetTemp - tile.temperature) * temperatureBlend;
    }
  }
}
