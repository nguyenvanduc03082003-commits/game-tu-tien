import { TimeManager, TimeSpeed, WorldDate } from '../core/TimeManager.ts';
import { EventBus } from '../core/EventBus.ts';
import { Engine } from '../core/Engine.ts';
import { WeatherType, WEATHER_CONFIGS } from '../modules/weather/WeatherTypes.ts';
import { HealthComponent, PositionComponent, RaceComponent, RealmComponent } from '../modules/beings/BeingComponents.ts';
import { AnimalComponent } from '../modules/animals/AnimalComponents.ts';

export class TimeControls {
  private container: HTMLDivElement;
  private engine: Engine;
  private timeManager = TimeManager.getInstance();
  private eventBus = EventBus.getInstance();

  private dateLabel!: HTMLDivElement;
  private statsLabel!: HTMLDivElement;
  private speedButtons: Map<TimeSpeed, HTMLButtonElement> = new Map();
  private qiOverlayBtn!: HTMLButtonElement;
  private tempOverlayBtn!: HTMLButtonElement;
  private elevOverlayBtn!: HTMLButtonElement;

  private currentWeather: WeatherType = WeatherType.CLEAR;

  constructor(parent: HTMLElement, engine: Engine) {
    this.engine = engine;
    this.currentWeather = engine.weatherSystem.currentWeather;

    this.container = document.createElement('div');
    this.container.id = 'hud-time-controls';
    this.container.className = 'interactive-ui hud-panel';
    this.container.style.cssText = `
      padding: 8px 12px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      min-width: 210px;
    `;

    this.buildUI();
    parent.appendChild(this.container);

    this.initEvents();
  }

  private buildUI(): void {
    this.dateLabel = document.createElement('div');
    this.dateLabel.style.cssText = `
      font-size: 13px;
      font-weight: 600;
      color: #ffd43b;
      letter-spacing: 0.5px;
      text-align: center;
      text-shadow: 0 2px 4px rgba(0,0,0,0.6);
    `;
    this.container.appendChild(this.dateLabel);

    // Dòng hiển thị thống kê dân số trực tiếp
    this.statsLabel = document.createElement('div');
    this.statsLabel.style.cssText = `
      font-size: 11px;
      font-weight: 500;
      color: #38d9a9;
      text-align: center;
      letter-spacing: 0.3px;
    `;
    this.container.appendChild(this.statsLabel);

    // 2. Hàng nút điều khiển tốc độ
    const btnRow = document.createElement('div');
    btnRow.style.cssText = `
      display: flex;
      gap: 6px;
      align-items: center;
      justify-content: center;
    `;

    const speeds: { speed: TimeSpeed; label: string; title: string }[] = [
      { speed: 0, label: '⏸', title: 'Tạm dừng (0x)' },
      { speed: 0.5, label: '0.5x', title: 'Chậm (0.5x)' },
      { speed: 1, label: '1x', title: 'Bình thường (1x)' },
      { speed: 2, label: '2x', title: 'Nhanh (2x)' },
      { speed: 3, label: '3x', title: 'Rất nhanh (3x)' },
      { speed: 5, label: '5x', title: 'Cực nhanh (5x)' },
    ];

    speeds.forEach(({ speed, label, title }) => {
      const btn = document.createElement('button');
      btn.textContent = label;
      btn.title = title;
      btn.style.cssText = `
        background: #21262d;
        color: #c9d1d9;
        border: 1px solid #30363d;
        border-radius: 6px;
        padding: 4px 9px;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.15s ease;
      `;

      btn.addEventListener('click', () => {
        if (speed === 0 && this.timeManager.isPaused()) {
          this.timeManager.togglePause();
        } else {
          this.timeManager.setSpeed(speed);
        }
        this.updateButtonStyles();
      });

      this.speedButtons.set(speed, btn);
      btnRow.appendChild(btn);
    });

    this.container.appendChild(btnRow);

    // 3. Hàng nút Lớp Phủ (Overlays)
    const overlayRow = document.createElement('div');
    overlayRow.style.cssText = `
      display: flex;
      gap: 8px;
      margin-top: 2px;
      justify-content: center;
      border-top: 1px solid #21262d;
      padding-top: 6px;
    `;

    this.qiOverlayBtn = document.createElement('button');
    this.qiOverlayBtn.innerHTML = '👁️ Linh Khí';
    this.qiOverlayBtn.title = 'Bật/Tắt lớp phủ xem luồng linh khí & ngũ hành';
    this.qiOverlayBtn.style.cssText = this.getOverlayBtnStyle(false);
    this.qiOverlayBtn.addEventListener('click', () => {
      this.engine.qiOverlayRenderer.showQi = !this.engine.qiOverlayRenderer.showQi;
      if (this.engine.qiOverlayRenderer.showQi) {
        this.engine.qiOverlayRenderer.showTemperature = false;
        this.engine.qiOverlayRenderer.showElevation = false;
      }
      this.updateOverlayBtnStyles();
    });
    overlayRow.appendChild(this.qiOverlayBtn);

    this.tempOverlayBtn = document.createElement('button');
    this.tempOverlayBtn.innerHTML = '🌡️ Nhiệt Độ';
    this.tempOverlayBtn.title = 'Bật/Tắt bản đồ nhiệt độ';
    this.tempOverlayBtn.style.cssText = this.getOverlayBtnStyle(false);
    this.tempOverlayBtn.addEventListener('click', () => {
      this.engine.qiOverlayRenderer.showTemperature = !this.engine.qiOverlayRenderer.showTemperature;
      if (this.engine.qiOverlayRenderer.showTemperature) {
        this.engine.qiOverlayRenderer.showQi = false;
        this.engine.qiOverlayRenderer.showElevation = false;
      }
      this.updateOverlayBtnStyles();
    });
    overlayRow.appendChild(this.tempOverlayBtn);

    this.elevOverlayBtn = document.createElement('button');
    this.elevOverlayBtn.innerHTML = '⛰️ Độ Cao';
    this.elevOverlayBtn.title = 'Bật/Tắt lớp phủ xem độ cao địa hình';
    this.elevOverlayBtn.style.cssText = this.getOverlayBtnStyle(false);
    this.elevOverlayBtn.addEventListener('click', () => {
      this.engine.qiOverlayRenderer.showElevation = !this.engine.qiOverlayRenderer.showElevation;
      if (this.engine.qiOverlayRenderer.showElevation) {
        this.engine.qiOverlayRenderer.showQi = false;
        this.engine.qiOverlayRenderer.showTemperature = false;
      }
      this.updateOverlayBtnStyles();
    });
    overlayRow.appendChild(this.elevOverlayBtn);

    const menuBtn = document.createElement('button');
    menuBtn.innerHTML = '⚙️ Menu (ESC)';
    menuBtn.title = 'Mở Menu Tạm Dừng / Lưu & Nạp Game (Phím ESC)';
    menuBtn.style.cssText = `
      background: rgba(30, 41, 59, 0.85);
      color: #ffd43b;
      border: 1px solid #ffd43b;
      border-radius: 6px;
      padding: 3px 8px;
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;
    `;
    menuBtn.addEventListener('click', () => {
      this.eventBus.emit('ui:toggle_pause_menu', null);
    });
    overlayRow.appendChild(menuBtn);

    this.container.appendChild(overlayRow);

    this.updateDateDisplay(this.timeManager.getDate());
    this.updateButtonStyles();
  }

  private initEvents(): void {
    this.eventBus.on<WorldDate>('time:day_passed', (date) => {
      this.updateDateDisplay(date);
    });

    this.eventBus.on('time:speed_changed', () => {
      this.updateButtonStyles();
    });

    this.eventBus.on<{ weather: WeatherType }>('weather:changed', (data) => {
      this.currentWeather = data.weather;
      this.updateDateDisplay(this.timeManager.getDate());
    });

    this.eventBus.on('chronicle:entry', () => {
      this.updateDateDisplay(this.timeManager.getDate());
    });
  }

  private updateDateDisplay(date: WorldDate): void {
    const weatherCfg = WEATHER_CONFIGS[this.currentWeather];
    let weatherBadge = '☀️';
    if (this.currentWeather === WeatherType.RAIN) weatherBadge = '🌧️';
    else if (this.currentWeather === WeatherType.THUNDERSTORM) weatherBadge = '⚡';
    else if (this.currentWeather === WeatherType.SNOW) weatherBadge = '❄️';
    else if (this.currentWeather === WeatherType.FOG) weatherBadge = '🌫️';
    else if (this.currentWeather === WeatherType.DROUGHT) weatherBadge = '🔥';

    this.dateLabel.textContent = `Năm ${date.year} · Tháng ${date.month} [Mùa ${date.season} · ${weatherBadge} ${weatherCfg?.name ?? ''}]`;

    // Thống kê dân số trực tiếp tách riêng Cư dân, Yêu tộc và Động vật
    const beings = this.engine.world.query([PositionComponent, RaceComponent]);
    let residentCount = 0;
    let cultCount = 0;
    let yaoCount = 0;
    for (let i = 0; i < beings.length; i++) {
      const ent = beings[i];
      const hp = this.engine.world.getComponent(ent, HealthComponent);
      if (hp && hp.isDead) continue;
      const realm = this.engine.world.getComponent(ent, RealmComponent);
      const race = this.engine.world.getComponent(ent, RaceComponent);
      if (realm && realm.stageIndex > 0) cultCount++;
      if (race && race.raceId === 'beast') {
        yaoCount++;
      } else {
        residentCount++;
      }
    }

    const animals = this.engine.world.query([PositionComponent, AnimalComponent, HealthComponent]);
    let animalCount = 0;
    for (let i = 0; i < animals.length; i++) {
      const hp = this.engine.world.getComponent(animals[i], HealthComponent)!;
      if (!hp.isDead && hp.current > 0) animalCount++;
    }

    this.statsLabel.textContent = `👥 Cư dân: ${residentCount} (🧘 Tu sĩ: ${cultCount}) · 🦊 Yêu tộc: ${yaoCount} · 🐾 Động vật: ${animalCount}`;
  }

  private getOverlayBtnStyle(isActive: boolean): string {
    return `
      background: ${isActive ? '#238636' : '#21262d'};
      color: ${isActive ? '#ffffff' : '#8b949e'};
      border: 1px solid ${isActive ? '#3fb950' : '#30363d'};
      border-radius: 6px;
      padding: 3px 8px;
      font-size: 11px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s ease;
    `;
  }

  private updateOverlayBtnStyles(): void {
    this.qiOverlayBtn.style.cssText = this.getOverlayBtnStyle(this.engine.qiOverlayRenderer.showQi);
    this.tempOverlayBtn.style.cssText = this.getOverlayBtnStyle(this.engine.qiOverlayRenderer.showTemperature);
    this.elevOverlayBtn.style.cssText = this.getOverlayBtnStyle(this.engine.qiOverlayRenderer.showElevation);
  }

  private updateButtonStyles(): void {
    const currentSpeed = this.timeManager.getSpeed();
    this.speedButtons.forEach((btn, speed) => {
      if (speed === currentSpeed) {
        btn.style.background = '#1f6feb';
        btn.style.borderColor = '#58a6ff';
        btn.style.color = '#ffffff';
        btn.style.boxShadow = '0 0 8px rgba(88, 166, 255, 0.4)';
      } else {
        btn.style.background = '#21262d';
        btn.style.borderColor = '#30363d';
        btn.style.color = '#c9d1d9';
        btn.style.boxShadow = 'none';
      }
    });
  }
}
