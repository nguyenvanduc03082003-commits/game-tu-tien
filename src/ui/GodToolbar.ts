import { Engine } from '../core/Engine.ts';
import { TERRAIN_CONFIGS, TerrainProperties, TerrainType } from '../config/terrains.config.ts';
import { ARCHETYPE_DEFINITIONS, BeingArchetype } from '../config/archetypes.config.ts';
import { PLANT_DEFINITIONS, PlantDefinition } from '../config/plants.config.ts';
import { WeatherType, WEATHER_CONFIGS } from '../modules/weather/WeatherTypes.ts';
import { BeingFactory } from '../modules/beings/BeingFactory.ts';
import { PositionComponent, RaceComponent } from '../modules/beings/BeingComponents.ts';
import { type WorldTemplate } from '../modules/world/WorldGenerator.ts';
import { PILL_DEFINITIONS } from '../config/pills.config.ts';
import { BUILDING_DEFINITIONS } from '../config/factions.config.ts';
import { FactionComponent } from '../modules/factions/FactionComponents.ts';
import { GodDecreeType } from '../modules/ai/brain/AIComponents.ts';
import { EventBus } from '../core/EventBus.ts';
import {
  ANIMAL_SPECIES_BY_GROUP,
  ANIMAL_SPECIES_LIST,
} from '../config/animals/animal.catalog.ts';
import { ANIMAL_GROUP_LABELS } from '../config/animals/animal.simulation.ts';
import {
  ANIMAL_GROUPS,
  AnimalGroup,
  AnimalSpeciesId,
} from '../config/animals/animal.types.ts';
import { AnimalFactory } from '../modules/animals/AnimalFactory.ts';
import { AnimalMovement } from '../modules/animals/AnimalMovement.ts';
import { AnimalSpawnService } from '../modules/animals/AnimalSpawnService.ts';
import { AStarPathfinder } from '../modules/ai/pathfinding/AStar.ts';

type ToolTab = 'terrain' | 'spawner' | 'animals' | 'pill' | 'faction' | 'flora' | 'divine' | 'decree' | 'worldgen';

export class GodToolbar {
  private container: HTMLDivElement;
  private engine: Engine;
  private currentTab: ToolTab = 'terrain';
  private activeSpawnerArchetypeId: string | null = null;
  private activeAnimalSpeciesId: AnimalSpeciesId | null = null;
  private activeAnimalGroupFilter: AnimalGroup | 'all' = 'all';
  private isCollapsed: boolean = false;

  constructor(parent: HTMLElement, engine: Engine) {
    this.engine = engine;

    this.container = document.createElement('div');
    this.container.id = 'hud-god-toolbar';
    this.container.className = 'interactive-ui hud-panel';
    this.container.style.cssText = `
      position: absolute;
      bottom: 10px;
      left: 50%;
      transform: translateX(-50%);
      padding: 6px 10px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      z-index: 95;
      max-width: min(960px, calc(100vw - 20px));
      transition: all 0.2s ease;
    `;

    this.buildUI();
    parent.appendChild(this.container);

    this.initSpawnerClick();
  }

  private resetAllTools(): void {
    this.engine.activeBrushTerrain = null;
    this.engine.activeElevationBrushMode = null;
    this.engine.activePlantSpeciesId = null;
    this.engine.activeVeinTool = false;
    this.engine.activeLightningTool = false;
    this.engine.activePillId = null;
    this.engine.activeBuildingType = null;
    this.engine.activeFoundSectTool = false;
    this.engine.activeGodDecreeType = null;
    this.activeSpawnerArchetypeId = null;
    this.activeAnimalSpeciesId = null;
  }

  private buildUI(): void {
    this.container.innerHTML = '';

    // 1. Hàng Tab chuyển đổi
    const tabRow = document.createElement('div');
    tabRow.style.cssText = `
      display: flex;
      gap: 4px;
      border-bottom: ${this.isCollapsed ? 'none' : '1px solid #30363d'};
      padding-bottom: ${this.isCollapsed ? '0' : '4px'};
      width: 100%;
      justify-content: flex-start;
      overflow-x: auto;
      flex-wrap: nowrap;
      align-items: center;
      scrollbar-width: thin;
    `;

    const tabs: { id: ToolTab; label: string }[] = [
      { id: 'terrain', label: '🖌️ Địa Hình' },
      { id: 'spawner', label: '👥 Cư Dân & Yêu Tộc' },
      { id: 'animals', label: '🐾 Động Vật (40)' },
      { id: 'pill', label: '💊 Linh Đan' },
      { id: 'faction', label: '🏛️ Tông Môn & Kiến Trúc' },
      { id: 'flora', label: '🌿 Thảo Mộc' },
      { id: 'divine', label: '⚡ Thiên Đạo' },
      { id: 'decree', label: '📜 Thánh Chỉ' },
      { id: 'worldgen', label: '🌍 Kiến Tạo' },
    ];

    tabs.forEach(tab => {
      const tabBtn = document.createElement('button');
      tabBtn.textContent = tab.label;
      const isActive = this.currentTab === tab.id;
      tabBtn.style.cssText = `
        background: ${isActive ? '#238636' : 'transparent'};
        color: ${isActive ? '#ffffff' : '#8b949e'};
        border: none;
        border-radius: 6px;
        padding: 4px 8px;
        font-size: 11px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
        white-space: nowrap;
        flex-shrink: 0;
      `;
      tabBtn.addEventListener('click', () => {
        this.currentTab = tab.id;
        this.isCollapsed = false;
        this.resetAllTools();
        this.buildUI();
      });
      tabRow.appendChild(tabBtn);
    });

    // Nút Thu Gọn / Mở Rộng Toolbar
    const toggleBtn = document.createElement('button');
    toggleBtn.textContent = this.isCollapsed ? '▲ Mở Rộng' : '▼ Thu Gọn';
    toggleBtn.title = 'Thu gọn / Mở rộng thanh công cụ quản trị';
    toggleBtn.style.cssText = `
      background: #21262d;
      color: #ffd43b;
      border: 1px solid #30363d;
      border-radius: 6px;
      padding: 3px 8px;
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
      white-space: nowrap;
      flex-shrink: 0;
      margin-left: auto;
    `;
    toggleBtn.addEventListener('click', () => {
      this.isCollapsed = !this.isCollapsed;
      this.buildUI();
    });
    tabRow.appendChild(toggleBtn);

    this.container.appendChild(tabRow);

    // 2. Nội dung Tab (chỉ hiển thị khi không thu gọn)
    if (!this.isCollapsed) {
      const contentRow = document.createElement('div');
      contentRow.style.cssText = `
        display: flex;
        gap: 6px;
        align-items: center;
        flex-wrap: wrap;
        justify-content: center;
        max-height: 85px;
        overflow-y: auto;
        width: 100%;
      `;

      if (this.currentTab === 'terrain') {
        this.buildTerrainTab(contentRow);
      } else if (this.currentTab === 'spawner') {
        this.buildSpawnerTab(contentRow);
      } else if (this.currentTab === 'animals') {
        this.buildAnimalsTab(contentRow);
      } else if (this.currentTab === 'pill') {
        this.buildPillTab(contentRow);
      } else if (this.currentTab === 'faction') {
        this.buildFactionTab(contentRow);
      } else if (this.currentTab === 'flora') {
        this.buildFloraTab(contentRow);
      } else if (this.currentTab === 'divine') {
        this.buildDivineTab(contentRow);
      } else if (this.currentTab === 'decree') {
        this.buildDecreeTab(contentRow);
      } else if (this.currentTab === 'worldgen') {
        this.buildWorldGenTab(contentRow);
      }

      this.container.appendChild(contentRow);
    }
  }

  private buildDecreeTab(row: HTMLElement): void {
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = '✋ Chế độ xem';
    cancelBtn.style.cssText = this.getButtonStyle(!this.engine.activeGodDecreeType);
    cancelBtn.addEventListener('click', () => {
      this.resetAllTools();
      this.buildUI();
    });
    row.appendChild(cancelBtn);

    const decreeOptions: { id: GodDecreeType; label: string; desc: string }[] = [
      { id: 'breakthrough', label: '🧘 Lệnh Bế Quan Phá Cảnh', desc: 'Chỉ định cư dân lập tức bế quan ngưng tụ linh lực phá vỡ bình cảnh' },
      { id: 'relocate', label: '🚩 Lệnh Di Cư / Di Chuyển', desc: 'Chỉ định cư dân di dời tới vị trí nhấp chuột' },
      { id: 'attack', label: '⚔️ Lệnh Thảo Phạt Cường Địch', desc: 'Chỉ định cư dân dồn toàn lực tấn công tiêu diệt mục tiêu' },
      { id: 'build', label: '🔨 Lệnh Đại Hưng Thổ Mộc', desc: 'Chỉ định thợ xây cấp tốc tu bổ hoặc hoàn thành công trình' },
      { id: 'farm', label: '🌾 Lệnh Khai Hoang Canh Tác', desc: 'Chỉ định nông phu ra đồng ruộng canh tác, tích trữ lương thực' }
    ];

    decreeOptions.forEach(opt => {
      const btn = document.createElement('button');
      const isActive = this.engine.activeGodDecreeType === opt.id;
      btn.textContent = opt.label;
      btn.title = opt.desc;
      btn.style.cssText = this.getButtonStyle(isActive);
      btn.addEventListener('click', () => {
        this.resetAllTools();
        this.engine.activeGodDecreeType = opt.id;
        this.buildUI();
      });
      row.appendChild(btn);
    });

    const tip = document.createElement('span');
    tip.style.cssText = 'color: #ffd700; font-size: 11px; margin-left: 8px; font-weight: 500;';
    tip.textContent = '💡 Chọn sắc lệnh rồi nhấp vào cư dân để ban chiếu!';
    row.appendChild(tip);
  }

  private buildTerrainTab(row: HTMLElement): void {
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = '✋ Chế độ xem';
    cancelBtn.style.cssText = this.getButtonStyle(!this.engine.activeBrushTerrain && !this.engine.activeElevationBrushMode);
    cancelBtn.addEventListener('click', () => {
      this.resetAllTools();
      this.buildUI();
    });
    row.appendChild(cancelBtn);

    // Nhóm cọ độ cao: Nâng đất, Hạ đất, Làm mượt
    const elevTools: { mode: 'raise' | 'lower' | 'smooth'; label: string; title: string; color: string }[] = [
      { mode: 'raise', label: '🔺 Nâng Đất', title: 'Mỗi lần tác động nâng 2 điểm % cao độ; hồ và biển giữ giới hạn mặt nước.', color: '#e06c75' },
      { mode: 'lower', label: '🔻 Hạ Đất', title: 'Mỗi lần tác động hạ 2 điểm % cao độ; núi giữ giới hạn vùng núi.', color: '#61afef' },
      { mode: 'smooth', label: '〰️ Làm Mượt', title: 'Làm mượt dốc địa hình theo vùng', color: '#98c379' },
    ];

    elevTools.forEach(tool => {
      const btn = document.createElement('button');
      btn.textContent = tool.label;
      btn.title = tool.title;
      const isActive = this.engine.activeElevationBrushMode === tool.mode;
      btn.style.cssText = this.getButtonStyle(isActive, tool.color);
      btn.addEventListener('click', () => {
        if (isActive) {
          this.engine.activeElevationBrushMode = null;
        } else {
          this.resetAllTools();
          this.engine.activeBrushTerrain = null;
          this.engine.activeElevationBrushMode = tool.mode;
        }
        this.buildUI();
      });
      row.appendChild(btn);
    });

    // Nhóm cọ loại địa hình
    (Object.values(TERRAIN_CONFIGS) as TerrainProperties[]).forEach((cfg: TerrainProperties) => {
      const btn = document.createElement('button');
      btn.textContent = cfg.name;
      btn.title = cfg.description;
      const isActive = this.engine.activeBrushTerrain === cfg.id;
      btn.style.cssText = this.getButtonStyle(isActive, cfg.primaryColor);
      btn.addEventListener('click', () => {
        if (isActive) {
          this.engine.activeBrushTerrain = null;
        } else {
          this.resetAllTools();
          this.engine.activeElevationBrushMode = null;
          this.engine.activeBrushTerrain = cfg.id;
        }
        this.buildUI();
      });
      row.appendChild(btn);
    });

    // Cỡ cọ vẽ
    const sizeWrapper = document.createElement('div');
    sizeWrapper.style.cssText = `
      display: flex;
      align-items: center;
      gap: 4px;
      margin-left: 8px;
      font-size: 12px;
      color: #8b949e;
    `;
    sizeWrapper.innerHTML = `<span>Đường kính cọ:</span>`;

    [1, 2, 3, 5].forEach(size => {
      const sBtn = document.createElement('button');
      sBtn.textContent = `${size * 2 - 1}x${size * 2 - 1}`;
      const isActive = this.engine.brushRadius === size - 1;
      sBtn.style.cssText = `
        background: ${isActive ? '#388bfd' : '#21262d'};
        color: ${isActive ? '#ffffff' : '#c9d1d9'};
        border: 1px solid #30363d;
        border-radius: 4px;
        padding: 3px 6px;
        font-size: 11px;
        cursor: pointer;
      `;
      sBtn.addEventListener('click', () => {
        this.engine.brushRadius = size - 1;
        this.buildUI();
      });
      sizeWrapper.appendChild(sBtn);
    });

    row.appendChild(sizeWrapper);

    const radius = this.engine.brushRadius;
    let affectedTiles = 0;
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        if (dx * dx + dy * dy <= radius * radius) affectedTiles++;
      }
    }
    const activeTool = this.engine.activeBrushTerrain
      ? `Tô ${TERRAIN_CONFIGS[this.engine.activeBrushTerrain].name}`
      : elevTools.find(tool => tool.mode === this.engine.activeElevationBrushMode)?.label;
    const help = document.createElement('div');
    help.style.cssText = 'flex-basis: 100%; color: #a5b4c5; font-size: 11px; line-height: 1.5;';
    help.textContent = activeTool
      ? `${activeTool} · Tối đa ${affectedTiles} ô/lần (ít hơn ở mép bản đồ). Nhấn hoặc giữ chuột trái để vẽ. Alt + kéo chuột trái hoặc chuột phải để di chuyển góc nhìn.`
      : 'Chế độ xem · Nhấp ô đất để xem thông tin. Cao độ là mức tương đối 0–100%. Bật lớp phủ cao độ ở góc trên bên phải để quan sát độ dốc.';
    row.appendChild(help);
  }

  private spawnerBatchCount: number = 1;

  private buildSpawnerTab(row: HTMLElement): void {
    // 1. Nhóm chọn số lượng thả (Batch Multiplier)
    const countWrapper = document.createElement('div');
    countWrapper.style.cssText = 'display: flex; gap: 4px; align-items: center; border-right: 1px solid #30363d; padding-right: 8px; margin-right: 4px;';

    const countLabel = document.createElement('span');
    countLabel.textContent = 'Số lượng:';
    countLabel.style.cssText = 'color: #8b949e; font-size: 11px; font-weight: 500;';
    countWrapper.appendChild(countLabel);

    [1, 10, 50, 100].forEach(num => {
      const bBtn = document.createElement('button');
      bBtn.textContent = `x${num}`;
      const isCur = this.spawnerBatchCount === num;
      bBtn.style.cssText = this.getButtonStyle(isCur, isCur ? '#238636' : undefined);
      bBtn.addEventListener('click', () => {
        this.spawnerBatchCount = num;
        this.buildUI();
      });
      countWrapper.appendChild(bBtn);
    });
    row.appendChild(countWrapper);

    // 2. Danh sách nguyên mẫu sinh linh
    ARCHETYPE_DEFINITIONS.forEach((arch: BeingArchetype) => {
      const btn = document.createElement('button');
      btn.innerHTML = `${arch.badge} ${arch.name}`;
      const isActive = this.activeSpawnerArchetypeId === arch.id;
      btn.style.cssText = this.getButtonStyle(isActive);
      btn.addEventListener('click', () => {
        this.resetAllTools();
        this.activeSpawnerArchetypeId = arch.id;
        this.buildUI();
      });
      row.appendChild(btn);
    });

    // 3. Nút Gieo Mầm Quần Thể Nhanh (+200 cư dân)
    const populateBtn = document.createElement('button');
    populateBtn.innerHTML = '🌌 Gieo Mầm Quần Thể (+200)';
    populateBtn.title = 'Tự động phân bổ nhanh 200 sinh linh đủ chủng loại khắp các vùng miền thế giới';
    populateBtn.style.cssText = this.getButtonStyle(false, '#a855f7');
    populateBtn.addEventListener('click', () => {
      this.populateWorldWithBeings(200);
    });
    row.appendChild(populateBtn);
  }

  /**
   * Tự động gieo mầm một quần thể lớn khắp các địa hình tự nhiên của thế giới
   */
  private populateWorldWithBeings(totalCount: number = 200): void {
    const map = this.engine.worldMap;
    const w = map.width;
    const h = map.height;
    const tileSize = map.tileSize;

    let spawned = 0;
    let attempts = 0;

    while (spawned < totalCount && attempts++ < totalCount * 20) {
      const tx = Math.floor(Math.random() * (w - 12)) + 6;
      const ty = Math.floor(Math.random() * (h - 12)) + 6;
      const tile = map.getTile(tx, ty);
      if (!tile || tile.terrain === TerrainType.OCEAN) continue;

      const px = tx * tileSize + tileSize / 2;
      const py = ty * tileSize + tileSize / 2;

      const r = Math.random();
      const archId = tile.terrain === TerrainType.SWAMP
        ? (r < 0.5 ? 'mortal_demon' : r < 0.8 ? 'yao_common' : 'mortal_human')
        : tile.terrain === TerrainType.MOUNTAIN || tile.terrain === TerrainType.DENSE_FOREST
          ? (r < 0.6 ? 'yao_common' : r < 0.9 ? 'mortal_human' : 'mortal_demon')
          : (r < 0.7 ? 'mortal_human' : r < 0.9 ? 'yao_common' : 'mortal_demon');

      BeingFactory.spawnFromArchetype(this.engine.world, archId, px, py);
      spawned++;
    }

    const currentTotal = this.engine.world.query([PositionComponent, RaceComponent]).length;
    EventBus.getInstance().emit('chronicle:entry', {
      category: 'discovery',
      message: `✨ Thần ân phổ chiếu! Đã gieo rắc thêm ${spawned} sinh linh vào thế giới! Tổng dân số hiện tại: ${currentTotal}.`,
      importance: 'high'
    });
  }

  private buildFloraTab(row: HTMLElement): void {
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = '✋ Chế độ xem';
    cancelBtn.style.cssText = this.getButtonStyle(!this.engine.activePlantSpeciesId);
    cancelBtn.addEventListener('click', () => {
      this.engine.activePlantSpeciesId = null;
      this.buildUI();
    });
    row.appendChild(cancelBtn);

    (Object.values(PLANT_DEFINITIONS) as PlantDefinition[]).forEach((plant: PlantDefinition) => {
      const btn = document.createElement('button');
      btn.innerHTML = `${plant.badge} ${plant.name}`;
      const isActive = this.engine.activePlantSpeciesId === plant.id;
      btn.style.cssText = this.getButtonStyle(isActive, plant.tier === 5 ? '#ffd43b' : undefined);
      btn.addEventListener('click', () => {
        this.resetAllTools();
        this.engine.activePlantSpeciesId = plant.id;
        this.buildUI();
      });
      row.appendChild(btn);
    });
  }

  private buildDivineTab(row: HTMLElement): void {
    // 1. Giáng Lôi Phạt
    const lightningBtn = document.createElement('button');
    lightningBtn.innerHTML = '⚡ Giáng Lôi Phạt';
    lightningBtn.title = 'Click lên bản đồ để đánh sét thiên kiếp';
    lightningBtn.style.cssText = this.getButtonStyle(this.engine.activeLightningTool, '#be4bdb');
    lightningBtn.addEventListener('click', () => {
      const active = !this.engine.activeLightningTool;
      this.resetAllTools();
      this.engine.activeLightningTool = active;
      this.buildUI();
    });
    row.appendChild(lightningBtn);

    // 2. Cấy Linh Mạch
    const veinBtn = document.createElement('button');
    veinBtn.innerHTML = '💎 Cấy Linh Mạch';
    veinBtn.title = 'Click lên bản đồ để tạo động thiên phúc địa';
    veinBtn.style.cssText = this.getButtonStyle(this.engine.activeVeinTool, '#38d9a9');
    veinBtn.addEventListener('click', () => {
      const active = !this.engine.activeVeinTool;
      this.resetAllTools();
      this.engine.activeVeinTool = active;
      this.buildUI();
    });
    row.appendChild(veinBtn);

    // 3. Gọi Thời Tiết
    Object.values(WEATHER_CONFIGS).forEach(cfg => {
      const btn = document.createElement('button');
      let badge = '☀️';
      if (cfg.id === WeatherType.RAIN) badge = '🌧️';
      else if (cfg.id === WeatherType.THUNDERSTORM) badge = '⛈️';
      else if (cfg.id === WeatherType.SNOW) badge = '❄️';
      else if (cfg.id === WeatherType.FOG) badge = '🌫️';
      else if (cfg.id === WeatherType.DROUGHT) badge = '🔥';

      btn.innerHTML = `${badge} ${cfg.name}`;
      const isActive = this.engine.weatherSystem.currentWeather === cfg.id;
      btn.style.cssText = this.getButtonStyle(isActive);
      btn.addEventListener('click', () => {
        this.engine.weatherSystem.setWeather(cfg.id);
        this.buildUI();
      });
      row.appendChild(btn);
    });
  }

  private buildWorldGenTab(row: HTMLElement): void {
    const banner = document.createElement('div');
    banner.style.cssText = `
      width: 100%;
      text-align: center;
      font-size: 11px;
      color: #f59f00;
      margin-bottom: 4px;
      padding: 2px 6px;
      background: rgba(245, 159, 0, 0.1);
      border-radius: 4px;
    `;
    banner.textContent = '⚠️ Tạo thế giới mới: Xóa toàn bộ thực thể & công trình hiện tại, kiến tạo lại theo mẫu và seed mới.';
    row.appendChild(banner);

    const templates: { id: WorldTemplate; label: string }[] = [
      { id: 'random', label: '🎲 Ngẫu Nhiên Mới' },
      { id: 'thap_van_dai_son', label: '⛰️ Thập Vạn Đại Sơn' },
      { id: 'dong_bang_trung_tho', label: '🌾 Bình Nguyên Trung Thổ' },
      { id: 'ma_vuc_dam_lay', label: '🐊 Ma Vực Đầm Lầy' },
      { id: 'hai_dao_tien_son', label: '🏝️ Hải Đảo Tiên Sơn' },
    ];

    templates.forEach(t => {
      const btn = document.createElement('button');
      btn.textContent = t.label;
      btn.title = `Tạo thế giới mới [${t.label}] (Xóa sạch toàn bộ thực thể & công trình hiện tại)`;
      btn.style.cssText = this.getButtonStyle(false);
      btn.addEventListener('click', () => {
        const confirmed = typeof window !== 'undefined' && typeof window.confirm === 'function'
          ? window.confirm(`Bạn có chắc chắn muốn kiến tạo thế giới mới [${t.label}]?\nToàn bộ thực thể và công trình hiện tại sẽ bị xóa sạch!`)
          : true;
        if (!confirmed) return;

        const newSeed = Math.floor(Math.random() * 90000 + 10000);
        this.engine.initNewWorld({
          template: t.id,
          seed: newSeed,
          name: this.engine.worldName || 'Thái Sơ Đại Lục',
          customDim: this.engine.worldMap.width
        });
      });
      row.appendChild(btn);
    });
  }

  private buildPillTab(row: HTMLElement): void {
    // 1. Nút Hủy Chọn
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = '✋ Bỏ chọn';
    cancelBtn.style.cssText = this.getButtonStyle(!this.engine.activePillId);
    cancelBtn.addEventListener('click', () => {
      this.engine.activePillId = null;
      this.buildUI();
    });
    row.appendChild(cancelBtn);

    // 2. Danh sách Đan Dược
    Object.values(PILL_DEFINITIONS).forEach(p => {
      const btn = document.createElement('button');
      let typeLabel = '';
      if (p.type === 'healing') typeLabel = `(Hồi ${p.healAmount} HP)`;
      else if (p.type === 'revive') typeLabel = `(Hồi Sinh ${p.reviveHealthPercent}%)`;
      else if (p.type === 'lifespan') typeLabel = `(+${p.lifespanBonusYears} Năm Thọ)`;
      else if (p.type === 'breakthrough') typeLabel = `(+${Math.round((p.breakthroughBonus || 0) * 100)}% Đột Phá)`;
      else if (p.type === 'buff') typeLabel = `(Công x${p.buffDamageMultiplier})`;

      btn.innerHTML = `${p.badge} ${p.name} ${typeLabel}`;
      const isActive = this.engine.activePillId === p.id;
      btn.style.cssText = this.getButtonStyle(isActive, p.color);
      btn.title = p.description;
      btn.addEventListener('click', () => {
        this.engine.activePillId = p.id;
        this.buildUI();
      });
      row.appendChild(btn);
    });

    const hint = document.createElement('span');
    hint.textContent = '👉 Chọn linh đan rồi nhấp vào cư dân để ban thưởng vào Túi Trữ Vật';
    hint.style.cssText = 'color: #8b949e; font-size: 11px; margin-left: 6px;';
    row.appendChild(hint);
  }

  private buildFactionTab(row: HTMLElement): void {
    // 1. Nút Khai Sơn Lập Phái (Quyền Thượng Đế: Tạo tức thì)
    const foundSectBtn = document.createElement('button');
    foundSectBtn.innerHTML = '🚩 Khai Sơn (Tức thì)';
    const isFounding = this.engine.activeFoundSectTool;
    foundSectBtn.style.cssText = this.getButtonStyle(isFounding, '#d29922');
    foundSectBtn.title = '⚡ [Quyền Thượng Đế: Tạo tức thì] Nhấp vào bản đồ để cắm Tông Môn Đại Điện hoàn tất ngay, cắm mốc lãnh thổ và phong cư dân gần nhất làm Chưởng Môn!';
    foundSectBtn.addEventListener('click', () => {
      this.resetAllTools();
      this.engine.activeFoundSectTool = !isFounding;
      this.buildUI();
    });
    row.appendChild(foundSectBtn);

    // 2. Nút Bỏ Chọn
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = '✋ Bỏ chọn';
    cancelBtn.style.cssText = this.getButtonStyle(!this.engine.activeBuildingType && !this.engine.activeFoundSectTool);
    cancelBtn.addEventListener('click', () => {
      this.resetAllTools();
      this.buildUI();
    });
    row.appendChild(cancelBtn);

    // 3. Đặt công trường để cư dân của thế lực thi công
    Object.values(BUILDING_DEFINITIONS).forEach(b => {
      const btn = document.createElement('button');
      btn.innerHTML = `${b.badge} ${b.name} (Xây dựng)`;
      const isActive = this.engine.activeBuildingType === b.type;
      btn.style.cssText = this.getButtonStyle(isActive, b.baseColor);
      btn.title = `🔨 Chọn thế lực có dân và đủ vật tư để đặt công trường.\n${b.description}\nKích thước: ${b.widthTiles}x${b.heightTiles} ô\nHiệu ứng: ${b.effectDescription}`;
      btn.addEventListener('click', () => {
        this.resetAllTools();
        this.engine.activeBuildingType = b.type;
        this.buildUI();
      });
      row.appendChild(btn);
    });

    // 4. Nút Can Thiệp Ngoại Giao: Tuyên Chiến & Kết Đồng Minh
    const warBtn = document.createElement('button');
    warBtn.innerHTML = '⚔️ Phát Động Đại Chiến';
    warBtn.style.cssText = this.getButtonStyle(false, '#cf222e');
    warBtn.title = 'Kích động hai môn phái lớn nhất tuyên chiến tranh đoạt lãnh thổ!';
    warBtn.addEventListener('click', () => {
      const factions = this.engine.world.query([FactionComponent]);
      if (factions.length >= 2) {
        const fA = this.engine.world.getComponent(factions[0], FactionComponent)!.factionId;
        const fB = this.engine.world.getComponent(factions[1], FactionComponent)!.factionId;
        this.engine.diplomacySystem.setRelation(this.engine.world, fA, fB, 'war');
      } else {
        alert('Cần có ít nhất 2 Tông Môn trên bản đồ để phát động đại chiến!');
      }
    });
    row.appendChild(warBtn);

    const allyBtn = document.createElement('button');
    allyBtn.innerHTML = '🤝 Kết Giao Hòa Ước';
    allyBtn.style.cssText = this.getButtonStyle(false, '#238636');
    allyBtn.title = 'Thiết lập hòa ước đồng minh vĩnh cửu giữa các phái!';
    allyBtn.addEventListener('click', () => {
      const factions = this.engine.world.query([FactionComponent]);
      if (factions.length >= 2) {
        const fA = this.engine.world.getComponent(factions[0], FactionComponent)!.factionId;
        const fB = this.engine.world.getComponent(factions[1], FactionComponent)!.factionId;
        this.engine.diplomacySystem.setRelation(this.engine.world, fA, fB, 'allied');
      } else {
        alert('Cần có ít nhất 2 Tông Môn trên bản đồ để kết giao hòa ước!');
      }
    });
    row.appendChild(allyBtn);

    const hint = document.createElement('span');
    hint.textContent = '👉 Chọn công trình rồi nhấp lên bản đồ để xây dựng';
    hint.style.cssText = 'color: #8b949e; font-size: 11px; margin-left: 6px;';
    row.appendChild(hint);
  }

  private buildAnimalsTab(row: HTMLElement): void {
    // 1. Nhóm chọn số lượng thả
    const countWrapper = document.createElement('div');
    countWrapper.style.cssText =
      'display: flex; gap: 4px; align-items: center; border-right: 1px solid #30363d; padding-right: 8px; margin-right: 4px;';

    const countLabel = document.createElement('span');
    countLabel.textContent = 'Số lượng:';
    countLabel.style.cssText = 'color: #8b949e; font-size: 11px; font-weight: 500;';
    countWrapper.appendChild(countLabel);

    [1, 5, 10, 20].forEach(num => {
      const bBtn = document.createElement('button');
      bBtn.textContent = `x${num}`;
      const isCur = this.spawnerBatchCount === num;
      bBtn.style.cssText = this.getButtonStyle(isCur, isCur ? '#238636' : undefined);
      bBtn.addEventListener('click', () => {
        this.spawnerBatchCount = num;
        this.buildUI();
      });
      countWrapper.appendChild(bBtn);
    });
    row.appendChild(countWrapper);

    // 2. Bộ lọc nhóm loài (AnimalGroup)
    const groupFilterWrapper = document.createElement('div');
    groupFilterWrapper.style.cssText =
      'display: flex; gap: 4px; align-items: center; border-right: 1px solid #30363d; padding-right: 8px; margin-right: 4px;';

    const allBtn = document.createElement('button');
    allBtn.textContent = `Tất cả (${ANIMAL_SPECIES_LIST.length})`;
    allBtn.style.cssText = this.getButtonStyle(
      this.activeAnimalGroupFilter === 'all',
      '#1f6feb'
    );
    allBtn.addEventListener('click', () => {
      this.activeAnimalGroupFilter = 'all';
      this.buildUI();
    });
    groupFilterWrapper.appendChild(allBtn);

    ANIMAL_GROUPS.forEach(group => {
      const gBtn = document.createElement('button');
      const groupList = ANIMAL_SPECIES_BY_GROUP[group] ?? [];
      gBtn.textContent = `${ANIMAL_GROUP_LABELS[group]} (${groupList.length})`;
      gBtn.style.cssText = this.getButtonStyle(
        this.activeAnimalGroupFilter === group,
        '#1f6feb'
      );
      gBtn.addEventListener('click', () => {
        this.activeAnimalGroupFilter = group;
        this.buildUI();
      });
      groupFilterWrapper.appendChild(gBtn);
    });
    row.appendChild(groupFilterWrapper);

    // 3. Nút Gieo Quần Thể Động Vật Tự Nhiên
    const populateAnimalsBtn = document.createElement('button');
    populateAnimalsBtn.innerHTML = '🦌 Gieo Quần Thể (+40)';
    populateAnimalsBtn.title =
      'Tự động phân bổ động vật theo môi trường sống trên các ô cạn hợp lệ';
    populateAnimalsBtn.style.cssText = this.getButtonStyle(false, '#16a34a');
    populateAnimalsBtn.addEventListener('click', () => {
      const spawned = AnimalSpawnService.populate(
        this.engine.world,
        this.engine.worldMap,
        40
      );
      this.engine.syncSpatialGrid();
      EventBus.getInstance().emit('chronicle:entry', {
        category: 'discovery',
        message: `🐾 Đã gieo thêm ${spawned.length} cá thể động vật hoang dã khắp các vùng đất!`,
        importance: 'normal',
      });
    });
    row.appendChild(populateAnimalsBtn);

    // 4. Danh sách các loài động vật theo nhóm đã chọn
    const displayedSpecies =
      this.activeAnimalGroupFilter === 'all'
        ? ANIMAL_SPECIES_LIST
        : ANIMAL_SPECIES_BY_GROUP[this.activeAnimalGroupFilter];

    displayedSpecies.forEach(spec => {
      const btn = document.createElement('button');
      btn.textContent = `🐾 ${spec.name}`;
      btn.dataset.animalSpeciesId = spec.id;
      const isActive = this.activeAnimalSpeciesId === spec.id;
      btn.style.cssText = this.getButtonStyle(isActive, spec.primaryColor);
      btn.title = `${spec.name} (${ANIMAL_GROUP_LABELS[spec.group]}) — HP ${spec.maxHealth}, Công ${spec.attack}, Thọ ${spec.lifespanYears} năm`;
      btn.addEventListener('click', () => {
        this.resetAllTools();
        this.activeAnimalSpeciesId = spec.id;
        this.buildUI();
      });
      row.appendChild(btn);
    });
  }

  private initSpawnerClick(): void {
    this.engine.canvas.canvas.addEventListener('mousedown', (e: MouseEvent) => {
      if (e.button !== 0 || e.altKey) return;

      if (this.activeSpawnerArchetypeId) {
        const worldPos = this.engine.camera.screenToWorld(
          e.clientX,
          e.clientY,
          this.engine.canvas.width,
          this.engine.canvas.height
        );
        const count = this.spawnerBatchCount;
        const scatter = count === 1 ? 0 : Math.min(120, Math.sqrt(count) * 12);

        for (let i = 0; i < count; i++) {
          const rx = worldPos.x + (Math.random() * scatter * 2 - scatter);
          const ry = worldPos.y + (Math.random() * scatter * 2 - scatter);
          BeingFactory.spawnFromArchetype(this.engine.world, this.activeSpawnerArchetypeId, rx, ry);
        }
        this.engine.syncSpatialGrid();
        return;
      }

      if (this.activeAnimalSpeciesId) {
        const worldPos = this.engine.camera.screenToWorld(
          e.clientX,
          e.clientY,
          this.engine.canvas.width,
          this.engine.canvas.height
        );
        const count = this.spawnerBatchCount;
        const scatter = count === 1 ? 0 : Math.min(80, Math.sqrt(count) * 10);
        const blockedTiles = AStarPathfinder.getBlockedBuildingTiles(
          this.engine.world,
          this.engine.worldMap
        );

        let spawnedAny = false;
        for (let i = 0; i < count; i++) {
          const rx = worldPos.x + (i === 0 ? 0 : Math.random() * scatter * 2 - scatter);
          const ry = worldPos.y + (i === 0 ? 0 : Math.random() * scatter * 2 - scatter);
          if (
            !AnimalMovement.isPixelWalkable(
              this.engine.world,
              this.engine.worldMap,
              rx,
              ry,
              blockedTiles
            )
          ) {
            continue;
          }
          AnimalFactory.spawn(this.engine.world, this.activeAnimalSpeciesId, rx, ry);
          spawnedAny = true;
        }

        if (spawnedAny) {
          this.engine.syncSpatialGrid();
        } else {
          EventBus.getInstance().emit('combat:floating_text', {
            x: worldPos.x,
            y: worldPos.y,
            text: 'Không thể thả động vật lên mặt nước hoặc công trình!',
            color: '#f87171',
          });
        }
      }
    });
  }

  private getButtonStyle(isActive: boolean, colorHighlight?: string): string {
    return `
      background: ${isActive ? (colorHighlight ? colorHighlight : '#1f6feb') : '#21262d'};
      color: ${isActive ? '#ffffff' : '#c9d1d9'};
      border: 1px solid ${isActive ? '#58a6ff' : '#30363d'};
      border-radius: 6px;
      padding: 5px 10px;
      font-size: 11px;
      font-weight: 500;
      cursor: pointer;
      box-shadow: ${isActive ? '0 0 10px rgba(88, 166, 255, 0.4)' : 'none'};
      transition: all 0.15s ease;
      white-space: nowrap;
    `;
  }

}
