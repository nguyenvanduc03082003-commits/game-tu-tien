import { resetSocialTelemetry } from '../modules/social/SocialSimulationTelemetry.ts';
import { ReproductionSystem, ChildcareSystem } from '../modules/beings/ReproductionSystem.ts';
import { LifeStageSystem } from '../modules/beings/LifeStageSystem.ts';
import { ECSWorld } from '../ecs/World.ts';
import { TimeManager, Season } from './TimeManager.ts';
import { assertValidWorldDimensions, WorldMap } from '../modules/world/WorldMap.ts';
import { TerrainType } from '../config/terrains.config.ts';
import { QiGrid } from '../modules/energy/QiGrid.ts';
import { PixelCanvas } from '../renderer/PixelCanvas.ts';
import { ViewportCamera } from '../renderer/ViewportCamera.ts';
import { WorldRenderer } from '../renderer/systems/WorldRenderer.ts';
import { EntityRenderer } from '../renderer/systems/EntityRenderer.ts';
import { FloraRenderer } from '../renderer/systems/FloraRenderer.ts';
import { WeatherFxRenderer } from '../renderer/systems/WeatherFxRenderer.ts';
import { QiOverlayRenderer } from '../renderer/systems/QiOverlayRenderer.ts';
import { AnimationSystem } from '../renderer/systems/AnimationSystem.ts';
import { AssetManager } from '../renderer/assets/AssetManager.ts';
import { ThreeTierAISystem } from '../modules/ai/systems/ThreeTierAISystem.ts';
import { GodDecreeComponent, GodDecreeData, GodDecreeType } from '../modules/ai/brain/AIComponents.ts';
import { QiSystem } from '../modules/energy/QiSystem.ts';
import { WeatherSystem } from '../modules/weather/WeatherSystem.ts';
import { DisasterSystem } from '../modules/weather/DisasterSystem.ts';
import { PlantGrowthSystem } from '../modules/flora/PlantGrowthSystem.ts';
import { PlantFactory } from '../modules/flora/PlantFactory.ts';
import { calculateInitialFaunaBudget } from '../config/animals/animal.simulation.ts';
import { isWorldTemplate, WorldGenerator } from '../modules/world/WorldGenerator.ts';
import { resetEntityIdCounter } from '../ecs/Entity.ts';
import { NeedsSystem } from '../modules/ai/NeedsSystem.ts';
import { TribulationSystem } from '../modules/cultivation/TribulationSystem.ts';
import { CultivationSystem } from '../modules/cultivation/CultivationSystem.ts';
import { SpiritualRootSystem } from '../modules/cultivation/SpiritualRootSystem.ts';
import { ProjectileSystem } from '../modules/combat/ProjectileSystem.ts';
import { CombatSystem } from '../modules/combat/CombatSystem.ts';
import { AlchemySystem } from '../modules/alchemy/AlchemySystem.ts';
import { BuildingSystem } from '../modules/factions/BuildingSystem.ts';
import { FactionSystem } from '../modules/factions/FactionSystem.ts';
import { DiplomacySystem } from '../modules/factions/DiplomacySystem.ts';
import { CombatFxRenderer } from '../renderer/systems/CombatFxRenderer.ts';
import { DialogueRenderer } from '../renderer/systems/DialogueRenderer.ts';
import { ActivityFeedback } from '../renderer/systems/ActivityFeedback.ts';
import { BuildingRenderer } from '../renderer/systems/BuildingRenderer.ts';
import { TerritoryRenderer } from '../renderer/systems/TerritoryRenderer.ts';
import { PositionComponent, HealthComponent } from '../modules/beings/BeingComponents.ts';
import { PlantComponent } from '../modules/flora/PlantComponents.ts';
import { InventoryComponent } from '../modules/alchemy/InventoryComponent.ts';
import { BuildingComponent, FactionComponent, InsideBuildingComponent, MemberComponent } from '../modules/factions/FactionComponents.ts';
import { FactionFactory } from '../modules/factions/FactionFactory.ts';
import { validateBuildingPlacement } from '../modules/factions/BuildingPlacementRules.ts';
import { BuildingType } from '../config/factions.config.ts';
import { PILL_DEFINITIONS } from '../config/pills.config.ts';
import { SocialInteractionSystem } from '../modules/social/SocialInteractionSystem.ts';
import { CorpseAndGraveSystem } from '../modules/beings/CorpseAndGraveSystem.ts';
import { EventBus } from './EventBus.ts';
import { SpatialGrid, SpatialEntity } from './SpatialGrid.ts';
import { SmartObjectManager } from '../modules/ai/smartobjects/SmartObjectManager.ts';
import { CommunityTaskBoard } from '../modules/ai/community/CommunityTaskBoard.ts';
import { AStarPathfinder } from '../modules/ai/pathfinding/AStar.ts';
import { SeededRNG } from './SeededRNG.ts';
import { GameSettings, GameSettingsData } from './GameSettings.ts';
import { DerivedStatsSystem } from '../modules/traits/DerivedStatsService.ts';
import { MentalStateSystem } from '../modules/talent/MentalStateSystem.ts';
import { GrowthSystem } from '../modules/talent/GrowthSystem.ts';
import { ProfessionSystem } from '../modules/professions/ProfessionSystem.ts';
import { EncounterTracker } from '../modules/talent/EncounterTracker.ts';
import { AnimalLifecycleSystem } from '../modules/animals/AnimalLifecycleSystem.ts';
import { AnimalAISystem } from '../modules/animals/AnimalAISystem.ts';
import { AnimalMovementSystem } from '../modules/animals/AnimalMovement.ts';
import { AnimalCarcassSystem } from '../modules/animals/AnimalCarcassSystem.ts';
import { AnimalReproductionSystem } from '../modules/animals/AnimalReproductionSystem.ts';
import { AnimalCarcassComponent, AnimalComponent } from '../modules/animals/AnimalComponents.ts';
import { AnimalSpawnService } from '../modules/animals/AnimalSpawnService.ts';
import { TreasureChestComponent, generateTreasureChests } from '../modules/treasure/TreasureChest.ts';
import { TreasureRenderer } from '../renderer/systems/TreasureRenderer.ts';

export class Engine {
  public world: ECSWorld;
  public worldMap: WorldMap;
  public qiGrid: QiGrid;
  public spatialGrid: SpatialGrid = new SpatialGrid(64);
  private treasureRenderer = new TreasureRenderer();
  public timeManager: TimeManager;
  public canvas: PixelCanvas;
  public camera: ViewportCamera;

  // Systems
  public weatherSystem: WeatherSystem;
  public disasterSystem: DisasterSystem;
  public qiSystem: QiSystem;
  public plantGrowthSystem: PlantGrowthSystem;
  public tribulationSystem: TribulationSystem;
  public cultivationSystem: CultivationSystem;
  public spiritualRootSystem: SpiritualRootSystem;
  public needsSystem: NeedsSystem;
  public threeTierAISystem: ThreeTierAISystem;
  public animalLifecycleSystem: AnimalLifecycleSystem;
  public animalAISystem: AnimalAISystem;
  public animalMovementSystem: AnimalMovementSystem;
  public animalCarcassSystem: AnimalCarcassSystem;
  public animalReproductionSystem: AnimalReproductionSystem;
  public projectileSystem: ProjectileSystem;
  public combatSystem: CombatSystem;
  public alchemySystem: AlchemySystem;
  public buildingSystem: BuildingSystem;
  public factionSystem: FactionSystem;
  public diplomacySystem: DiplomacySystem;
  public socialInteractionSystem: SocialInteractionSystem;
  public corpseAndGraveSystem: CorpseAndGraveSystem;
  public derivedStatsSystem: DerivedStatsSystem;
  public mentalStateSystem: MentalStateSystem;
  public growthSystem: GrowthSystem;
  public professionSystem: ProfessionSystem;

  // Renderers
  public worldRenderer: WorldRenderer;
  public entityRenderer: EntityRenderer;
  public floraRenderer: FloraRenderer;
  public weatherFxRenderer: WeatherFxRenderer;
  public qiOverlayRenderer: QiOverlayRenderer;
  public combatFxRenderer: CombatFxRenderer;
  public dialogueRenderer: DialogueRenderer;
  public activityFeedback: ActivityFeedback;
  public buildingRenderer: BuildingRenderer;
  public territoryRenderer: TerritoryRenderer;

  private lastFrameTime: number = 0;
  public isRunning: boolean = false;
  private eventBus = EventBus.getInstance();

  // Thao tác công cụ Thượng Đế
  public activeBrushTerrain: TerrainType | null = null;
  public activeElevationBrushMode: 'raise' | 'lower' | 'smooth' | null = null;
  public brushRadius: number = 2;
  public activePlantSpeciesId: string | null = null;
  public activeVeinTool: boolean = false;
  public activeLightningTool: boolean = false;
  public activePillId: string | null = null;
  public activeBuildingType: BuildingType | null = null;
  public activeFoundSectTool: boolean = false;
  public activeSelectedFactionId: string | null = null;
  public activeGodDecreeType: GodDecreeType | null = null;

  public hoverTile: { x: number; y: number; radius: number } | null = null;
  public selectedEntity: number | null = null;

  // Trạng thái Menu & Tạm dừng
  public isMainMenuOpen: boolean = true;
  public isPausedByMenu: boolean = false;
  public worldName: string = 'Thái Cổ Giới';
  public worldTemplate: string = 'thap_van_dai_son';
  public worldSeed: number = 8888;

  constructor() {
    this.world = new ECSWorld();
    this.worldMap = new WorldMap(360, 360);
    this.qiGrid = new QiGrid(360, 360);
    this.timeManager = TimeManager.getInstance();
    this.canvas = new PixelCanvas('game-canvas');
    this.camera = new ViewportCamera(
      (this.worldMap.width * this.worldMap.tileSize) / 2,
      (this.worldMap.height * this.worldMap.tileSize) / 2,
      1.5
    );

    // Khởi tạo Renderers
    this.worldRenderer = new WorldRenderer(this.worldMap);
    this.entityRenderer = new EntityRenderer();
    this.floraRenderer = new FloraRenderer();
    this.weatherFxRenderer = new WeatherFxRenderer();
    this.qiOverlayRenderer = new QiOverlayRenderer();
    this.combatFxRenderer = new CombatFxRenderer(this.world);
    this.dialogueRenderer = new DialogueRenderer();
    this.activityFeedback = ActivityFeedback.getInstance();
    this.buildingRenderer = new BuildingRenderer();
    this.territoryRenderer = new TerritoryRenderer();
    AssetManager.getInstance().preloadConfiguredAssets();

    // Khởi tạo Systems
    this.qiSystem = new QiSystem(this.qiGrid, this.worldMap);
    this.weatherSystem = new WeatherSystem(this.worldMap);
    this.disasterSystem = new DisasterSystem(this.worldMap);
    this.tribulationSystem = new TribulationSystem();
    this.cultivationSystem = new CultivationSystem(this.worldMap, this.qiGrid, this.tribulationSystem);
    this.spiritualRootSystem = new SpiritualRootSystem();
    this.needsSystem = new NeedsSystem(this.worldMap);
    this.threeTierAISystem = new ThreeTierAISystem(this.worldMap, this.qiGrid);
    this.threeTierAISystem.spatialGrid = this.spatialGrid;
    this.animalLifecycleSystem = new AnimalLifecycleSystem();
    this.animalAISystem = new AnimalAISystem(this.worldMap);
    this.animalAISystem.spatialGrid = this.spatialGrid;
    this.animalMovementSystem = new AnimalMovementSystem(this.worldMap, this.spatialGrid);
    this.animalCarcassSystem = new AnimalCarcassSystem();
    this.animalReproductionSystem = new AnimalReproductionSystem(this.worldMap);
    this.plantGrowthSystem = new PlantGrowthSystem(this.worldMap, this.qiGrid);
    this.projectileSystem = new ProjectileSystem();
    this.diplomacySystem = new DiplomacySystem();
    this.diplomacySystem.spatialGrid = this.spatialGrid;
    this.combatSystem = new CombatSystem(this.worldMap, this.diplomacySystem);
    this.combatSystem.spatialGrid = this.spatialGrid;
    this.alchemySystem = new AlchemySystem();
    this.buildingSystem = new BuildingSystem(this.diplomacySystem);
    this.factionSystem = new FactionSystem(this.worldMap, this.qiGrid, this.diplomacySystem);
    this.factionSystem.spatialGrid = this.spatialGrid;
    this.socialInteractionSystem = new SocialInteractionSystem();
    this.socialInteractionSystem.spatialGrid = this.spatialGrid;
    this.corpseAndGraveSystem = new CorpseAndGraveSystem(this.worldMap);
    this.derivedStatsSystem = new DerivedStatsSystem();
    this.mentalStateSystem = new MentalStateSystem();
    this.growthSystem = new GrowthSystem(this.world);
    this.professionSystem = new ProfessionSystem(() => this.worldMap);

    this.initSystems();
    this.initInput();
    this.applySettings(GameSettings.load());

    // Lắng nghe sự kiện định vị tâm camera
    this.eventBus.on('camera:focus_pos', (data: { x: number; y: number }) => {
      this.camera.x = data.x;
      this.camera.y = data.y;
    });

    this.eventBus.on<GameSettingsData>('settings:changed', (settings) => {
      this.applySettings(settings);
    });
  }

  public applySettings(settings: GameSettingsData = GameSettings.get()): void {
    if (this.weatherFxRenderer) {
      this.weatherFxRenderer.particlesEnabled = settings.particlesEnabled;
    }
  }

  private initSystems(): void {
    this.world.addSystem(this.qiSystem);
    this.world.addSystem(this.weatherSystem);
    this.world.addSystem(this.disasterSystem);
    this.world.addSystem(this.tribulationSystem);
    this.world.addSystem(this.derivedStatsSystem);
    this.world.addSystem(this.mentalStateSystem);
    this.world.addSystem(this.threeTierAISystem);
    this.world.addSystem(this.needsSystem);
    this.world.addSystem(this.animalLifecycleSystem);
    this.world.addSystem(this.animalAISystem);
    this.world.addSystem(this.animalMovementSystem);
    this.world.addSystem(new LifeStageSystem());
    this.world.addSystem(new ChildcareSystem());
    this.world.addSystem(new ReproductionSystem());
    this.world.addSystem(this.spiritualRootSystem);
    this.world.addSystem(this.cultivationSystem);
    this.world.addSystem(this.plantGrowthSystem);
    this.world.addSystem(this.projectileSystem);
    this.world.addSystem(this.combatSystem);
    this.world.addSystem(this.animalCarcassSystem);
    this.world.addSystem(this.animalReproductionSystem);
    this.world.addSystem(this.alchemySystem);
    this.world.addSystem(this.buildingSystem);
    this.world.addSystem(this.factionSystem);
    this.world.addSystem(this.diplomacySystem);
    this.world.addSystem(this.socialInteractionSystem);
    this.world.addSystem(this.corpseAndGraveSystem);
    this.world.addSystem(this.growthSystem);
    this.world.addSystem(this.professionSystem);
    this.world.addSystem(new AnimationSystem());
  }

  private initInput(): void {
    this.camera.setupInputHandlers(this.canvas.canvas);

    // Xử lý rê chuột và cọ vẽ
    this.canvas.canvas.addEventListener('mouseleave', () => {
      this.hoverTile = null;
    });
    this.canvas.canvas.addEventListener('mousemove', (e: MouseEvent) => {
      if (this.isMainMenuOpen || this.isPausedByMenu) {
        this.hoverTile = null;
        return;
      }

      const worldPos = this.camera.screenToWorld(e.clientX, e.clientY, this.canvas.width, this.canvas.height);
      const tx = Math.floor(worldPos.x / this.worldMap.tileSize);
      const ty = Math.floor(worldPos.y / this.worldMap.tileSize);

      if (this.worldMap.isInBounds(tx, ty)) {
        this.hoverTile = { x: tx, y: ty, radius: this.brushRadius };

        if (e.buttons === 1 && !e.altKey) {
          if (this.activeBrushTerrain) {
            this.worldMap.applyBrush(tx, ty, this.activeBrushTerrain, this.brushRadius);
          } else if (this.activeElevationBrushMode) {
            this.worldMap.applyElevationBrush(tx, ty, this.activeElevationBrushMode, this.brushRadius);
          }
        }
      } else {
        this.hoverTile = null;
      }
    });

    this.canvas.canvas.addEventListener('mousedown', (e: MouseEvent) => {
      if (this.isMainMenuOpen || this.isPausedByMenu) return;

      if (e.button === 0 && !e.altKey) {
        const worldPos = this.camera.screenToWorld(e.clientX, e.clientY, this.canvas.width, this.canvas.height);
        const tx = Math.floor(worldPos.x / this.worldMap.tileSize);
        const ty = Math.floor(worldPos.y / this.worldMap.tileSize);

        if (!this.worldMap.isInBounds(tx, ty)) return;

        // 1. Cọ vẽ địa hình
        if (this.activeBrushTerrain) {
          this.worldMap.applyBrush(tx, ty, this.activeBrushTerrain, this.brushRadius);
          return;
        }

        // 1b. Cọ điều chỉnh cao độ
        if (this.activeElevationBrushMode) {
          this.worldMap.applyElevationBrush(tx, ty, this.activeElevationBrushMode, this.brushRadius);
          return;
        }

        // 2. Gieo trồng Cây cối / Thảo dược
        if (this.activePlantSpeciesId) {
          if (PlantFactory.canPlantAt(this.worldMap, worldPos.x, worldPos.y)) {
            PlantFactory.spawnPlant(this.world, this.activePlantSpeciesId, worldPos.x, worldPos.y, 2);
          } else {
            this.eventBus.emit('combat:floating_text', {
              x: worldPos.x,
              y: worldPos.y,
              text: 'Không thể trồng cây trên mặt nước!',
              color: '#f87171',
            });
          }
          return;
        }

        // 3. Cấy Linh Mạch
        if (this.activeVeinTool) {
          this.qiGrid.addSpiritVein(tx, ty, 'linh_khi', 8.0);
          console.log(`💎 Đã cấy một Linh Mạch tại (${tx}, ${ty})!`);
          return;
        }

        // 4. Giáng Thiên Kiếp / Lôi Phạt
        if (this.activeLightningTool) {
          this.disasterSystem.strikeLightning(this.world, worldPos.x, worldPos.y, 36, 120);
          return;
        }

        // 6. Ban tặng Đan Dược
        if (this.activePillId) {
          const pillDef = PILL_DEFINITIONS[this.activePillId];
          if (pillDef) {
            const target = this.findNearestBeing(worldPos.x, worldPos.y, 28);
            if (target !== null) {
              let inv = this.world.getComponent(target, InventoryComponent);
              if (!inv) {
                inv = new InventoryComponent();
                this.world.addComponent(target, inv);
              }
              inv.addPill(pillDef, 1);
              this.eventBus.emit('chronicle:entry', {
                category: 'breakthrough',
                message: `💊 Thượng Đế ban tặng đan dược [${pillDef.name}] cho cư dân #${target}!`,
                importance: 'normal'
              });
              this.handleSelect(worldPos.x, worldPos.y, tx, ty);
              return;
            }
          }
        }

        // 7. Sáng Lập Tông Môn / Thôn Xóm Tức Thì
        if (this.activeFoundSectTool) {
          const placement = validateBuildingPlacement(this.world, this.worldMap, 'sect_hall', worldPos.x, worldPos.y);
          if (!placement.valid) {
            alert('Vị trí này không đủ chỗ hoặc quá gần công trình khác để dựng Tông Môn Đại Điện.');
            return;
          }
          const leader = this.findNearestBeing(worldPos.x, worldPos.y, 32);
          const { factionEntity, factionId } = FactionFactory.createFaction(this.world, {
            leaderEntityId: leader ?? undefined
          });
          // Đặt Tông Môn Đại Điện tại vị trí nhấp chuột
          FactionFactory.spawnBuilding(this.world, 'sect_hall', factionId, worldPos.x, worldPos.y, undefined, { instant: true });

          if (leader !== null) {
            FactionFactory.assignMemberToFaction(this.world, leader, factionId, 'sect_master');
          }

          const fComp = this.world.getComponent(factionEntity, FactionComponent)!;
          this.activeSelectedFactionId = factionId;

          this.eventBus.emit('chronicle:entry', {
            category: 'breakthrough',
            message: `🏛️ THƯỢNG ĐẾ KHAI SƠN! [Quyền Thượng Đế: Tạo tức thì] Chính thức khai lập [${fComp.name}], cắm mốc lãnh thổ định cư!`,
            importance: 'high'
          });
          this.handleSelect(worldPos.x, worldPos.y, tx, ty);
          return;
        }

        // 8. Đặt Công Trình Kiến Trúc Tu Tiên / Dân Sinh
        if (this.activeBuildingType) {
          let fId = this.activeSelectedFactionId;
          // Tìm thế lực có lãnh thổ gần điểm đặt công trình nhất
          if (!fId) {
            let nearestDist = Infinity;
            for (const bEnt of this.world.query([PositionComponent, BuildingComponent])) {
              const bPos = this.world.getComponent(bEnt, PositionComponent)!;
              const bComp = this.world.getComponent(bEnt, BuildingComponent)!;
              if (!bComp.factionId || bComp.isRuins) continue;
              const d = Math.hypot(bPos.x - worldPos.x, bPos.y - worldPos.y);
              if (d < nearestDist && d <= 450) {
                nearestDist = d;
                fId = bComp.factionId;
              }
            }
          }
          if (!fId || FactionFactory.findFactionEntity(this.world, fId) === null) {
            alert('Cần chọn một thế lực đang tồn tại để đặt công trường.');
            return;
          }
          const hasWorker = this.world.query([MemberComponent, HealthComponent]).some(id => {
            const member = this.world.getComponent(id, MemberComponent)!;
            const hp = this.world.getComponent(id, HealthComponent)!;
            return member.factionId === fId && !hp.isDead;
          });
          if (!hasWorker) {
            alert('Thế lực này chưa có cư dân sống để xây dựng.');
            return;
          }
          const placement = validateBuildingPlacement(
            this.world,
            this.worldMap,
            this.activeBuildingType,
            worldPos.x,
            worldPos.y
          );
          if (!placement.valid) {
            alert('Vị trí này không thể xây dựng.');
            return;
          }
          const task = CommunityTaskBoard.getInstance().createBuildingTask(
            this.world, this.worldMap, this.activeBuildingType, fId, { x: worldPos.x, y: worldPos.y }
          );
          if (!task) {
            alert('Không thể khởi công: kho thế lực thiếu vật tư hoặc loại công trình không hợp lệ.');
            return;
          }
          const bComp = task.targetEntityId !== undefined
            ? this.world.getComponent(task.targetEntityId, BuildingComponent) : undefined;
          this.eventBus.emit('chronicle:entry', {
            category: 'construction',
            message: `🔨 Đã mở công trường [${bComp?.name ?? this.activeBuildingType}], chờ cư dân đến xây.`,
            importance: 'normal'
          });
          this.handleSelect(worldPos.x, worldPos.y, tx, ty);
          return;
        }

        // 9. Ban Thánh Chỉ Thần Linh (God Decree)
        if (this.activeGodDecreeType) {
          const target = this.findNearestBeing(worldPos.x, worldPos.y, 32);
          if (target !== null) {
            let decreeTitle = 'Thánh Chỉ Thần Linh';
            if (this.activeGodDecreeType === 'breakthrough') decreeTitle = 'Bế Quan Đột Phá';
            else if (this.activeGodDecreeType === 'relocate') decreeTitle = `Di Dời Tới (${Math.round(worldPos.x)}, ${Math.round(worldPos.y)})`;
            else if (this.activeGodDecreeType === 'attack') decreeTitle = 'Thảo Phạt Cường Địch';
            else if (this.activeGodDecreeType === 'build') decreeTitle = 'Đại Hưng Thổ Mộc';
            else if (this.activeGodDecreeType === 'farm') decreeTitle = 'Khai Hoang Canh Tác';

            this.issueDecree(target, {
              decreeType: this.activeGodDecreeType,
              title: decreeTitle,
              targetPos: { x: worldPos.x, y: worldPos.y },
              issuedTime: Date.now()
            });

            this.handleSelect(worldPos.x, worldPos.y, tx, ty);
            return;
          }
        }

        // 10. Soi Thực thể hoặc Ô đất
        this.handleSelect(worldPos.x, worldPos.y, tx, ty);
      }
    });
  }

  public issueDecree(entityId: number, decree: GodDecreeData): void {
    let decreeComp = this.world.getComponent(entityId, GodDecreeComponent);
    if (!decreeComp) {
      decreeComp = new GodDecreeComponent(decree);
      this.world.addComponent(entityId, decreeComp);
    } else {
      decreeComp.decree = decree;
    }
    this.eventBus.emit('god:issue_decree', { entityId, decree });
  }

  public findNearestBeing(wx: number, wy: number, maxDist: number = 24): number | null {
    const nearby = this.spatialGrid.queryRadius(wx, wy, maxDist);
    let nearest: number | null = null;
    let minDist = maxDist;

    for (let i = 0; i < nearby.length; i++) {
      const item = nearby[i];
      const ent = item.id;
      if (
        this.world.hasComponent(ent, PlantComponent) ||
        this.world.hasComponent(ent, BuildingComponent) ||
        this.world.hasComponent(ent, TreasureChestComponent) ||
        this.world.hasComponent(ent, AnimalComponent) ||
        this.world.hasComponent(ent, AnimalCarcassComponent)
      ) {
        continue;
      }
      const dx = item.x - wx;
      const dy = item.y - wy;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < minDist) {
        minDist = d;
        nearest = ent;
      }
    }
    return nearest;
  }

  private handleSelect(wx: number, wy: number, tx: number, ty: number): void {
    // 1. Tìm thực thể gần nhất trong bán kính 24px qua SpatialGrid O(1)
    const nearby = this.spatialGrid.queryRadius(wx, wy, 24);
    let foundBeing: number | null = null;
    let foundPlant: number | null = null;
    let foundBuilding: number | null = null;
    let foundChest: number | null = null;
    let minDistBeing = 24;
    let minDistPlant = 24;
    let minDistChest = 18;

    for (let i = 0; i < nearby.length; i++) {
      const item = nearby[i];
      const ent = item.id;
      if (this.world.hasComponent(ent, BuildingComponent)) continue;

      const dx = item.x - wx;
      const dy = item.y - wy;
      const d = Math.sqrt(dx * dx + dy * dy);

      if (this.world.hasComponent(ent, PlantComponent)) {
        if (d < minDistPlant) {
          minDistPlant = d;
          foundPlant = ent;
        }
      } else if (this.world.hasComponent(ent, TreasureChestComponent)) {
        if (d < minDistChest) {
          minDistChest = d;
          foundChest = ent;
        }
      } else {
        if (d < minDistBeing) {
          minDistBeing = d;
          foundBeing = ent;
        }
      }
    }

    // Fallback quét trực tiếp nếu thực thể vừa được thả chưa kịp đồng bộ vào SpatialGrid
    if (foundBeing === null) {
      const allPositioned = this.world.query([PositionComponent]);
      for (const ent of allPositioned) {
        if (
          this.world.hasComponent(ent, BuildingComponent) ||
          this.world.hasComponent(ent, PlantComponent) ||
          this.world.hasComponent(ent, TreasureChestComponent)
        ) {
          continue;
        }
        const pos = this.world.getComponent(ent, PositionComponent)!;
        const d = Math.hypot(pos.x - wx, pos.y - wy);
        if (d < minDistBeing) {
          minDistBeing = d;
          foundBeing = ent;
        }
      }
    }

    if (foundChest === null) {
      for (const ent of this.world.query([PositionComponent, TreasureChestComponent])) {
        const pos = this.world.getComponent(ent, PositionComponent)!;
        const d = Math.hypot(pos.x - wx, pos.y - wy);
        if (d < minDistChest) { minDistChest = d; foundChest = ent; }
      }
    }

    // Nếu chưa thấy công trình, quét riêng công trình theo bán kính 30px
    if (foundBuilding === null) {
      const buildings = this.world.query([PositionComponent, BuildingComponent]);
      let minBldDist = 32;
      for (const bEnt of buildings) {
        const bPos = this.world.getComponent(bEnt, PositionComponent)!;
        const bComp = this.world.getComponent(bEnt, BuildingComponent)!;
        const cx = bPos.x + (bComp.widthTiles * 16) / 2;
        const cy = bPos.y + (bComp.heightTiles * 16) / 2;
        const d = Math.hypot(cx - wx, cy - wy);
        if (d < minBldDist) {
          minBldDist = d;
          foundBuilding = bEnt;
        }
      }
    }

    if (foundChest !== null && minDistChest < minDistBeing) foundBeing = null;
    this.selectedEntity = foundBeing;
    this.eventBus.emit('ui:inspector_selected', {
      entity: foundBeing,
      chest: foundChest,
      plant: foundPlant,
      building: foundBuilding,
      tile: this.worldMap.getTile(tx, ty),
      qiTile: this.qiGrid.getTile(tx, ty)
    });
  }

  /**
   * Dọn sạch toàn bộ trạng thái thế giới cũ (Entities, SpatialGrid, ID counter,
   * hàng đợi lôi kiếp, thánh chỉ, đột phá, quan hệ ngoại giao, AI task board, FX renderers, v.v.)
   * Ngăn chặn tuyệt đối việc trạng thái từ thế giới cũ rò rỉ tác động lên thế giới mới hoặc bản lưu mới nạp.
   */
  public resetWorldState(): void {
    // 1. Entities & SpatialGrid & ID counter
    this.world.clearEntities();
    this.spatialGrid.clear();
    resetEntityIdCounter();

    // 2. Dọn sạch trạng thái các hệ thống (hàng đợi độ kiếp, thánh chỉ, đột phá, quan hệ ngoại giao, thời tiết, v.v.)
    if (this.tribulationSystem) this.tribulationSystem.clear();
    if (this.threeTierAISystem) this.threeTierAISystem.reset();
    if (this.cultivationSystem) this.cultivationSystem.reset();
    if (this.diplomacySystem) this.diplomacySystem.clear();
    if (this.weatherSystem) this.weatherSystem.reset();
    if (this.needsSystem) this.needsSystem.reset();
    if (this.socialInteractionSystem) this.socialInteractionSystem.reset();
    if (this.animalLifecycleSystem) this.animalLifecycleSystem.reset();
    if (this.animalAISystem) this.animalAISystem.reset();
    if (this.animalMovementSystem) this.animalMovementSystem.reset();
    if (this.animalCarcassSystem) this.animalCarcassSystem.reset();
    if (this.animalReproductionSystem) this.animalReproductionSystem.reset();
    if (this.corpseAndGraveSystem) this.corpseAndGraveSystem.reset();
    if (this.disasterSystem) this.disasterSystem.reset();
    if (this.plantGrowthSystem) this.plantGrowthSystem.reset();
    if (this.spiritualRootSystem) this.spiritualRootSystem.reset();
    if (this.alchemySystem) this.alchemySystem.reset();
    if (this.factionSystem) this.factionSystem.reset();
    if (this.derivedStatsSystem) this.derivedStatsSystem.reset();
    if (this.mentalStateSystem) this.mentalStateSystem.reset();
    if (this.growthSystem) this.growthSystem.reset(this.world);
    if (this.professionSystem) this.professionSystem.reset();
    EncounterTracker.clear(this.world);
    resetSocialTelemetry(this.world);

    // 3. Đặt lại bộ đếm khởi tạo thế lực
    FactionFactory.reset();

    // 4. Dọn sạch AI Managers và bộ nhớ đệm
    SmartObjectManager.getInstance().clear();
    CommunityTaskBoard.getInstance().clear();
    AStarPathfinder.invalidateBuildingCache();

    // 5. Dọn sạch hiệu ứng hình ảnh còn sót lại
    if (this.combatFxRenderer) this.combatFxRenderer.clear();
    if (this.dialogueRenderer) this.dialogueRenderer.clear();
    if (this.activityFeedback) this.activityFeedback.clear();
    if (this.weatherFxRenderer) this.weatherFxRenderer.reset();

    // 6. Đặt lại đối tượng đang chọn & công cụ Thần Linh
    this.selectedEntity = null;
    this.hoverTile = null;
    this.activeGodDecreeType = null;
    this.activeSelectedFactionId = null;
    this.activeBrushTerrain = null;
    this.activeElevationBrushMode = null;
    this.activePlantSpeciesId = null;
    this.activeVeinTool = false;
    this.activeLightningTool = false;
    this.activePillId = null;
    this.activeBuildingType = null;
    this.activeFoundSectTool = false;

    // 7. Phát sự kiện thông báo thế giới đã được thiết lập lại
    this.eventBus.emit('world:reset');
  }

  /**
   * Cấp phát lại vùng chứa bản đồ và lưới linh khí khi đổi kích thước thế giới,
   * tách biệt hoàn toàn với việc sinh thế giới mới để không ghi đè metadata/seed khi nạp bản lưu.
   */
  public resizeWorldContainers(width: number, height: number): void {
    if (this.worldMap.width === width && this.worldMap.height === height) return;

    this.weatherSystem?.destroy();
    this.needsSystem?.destroy();
    this.threeTierAISystem?.destroy();
    this.cultivationSystem?.destroy();

    this.worldMap = new WorldMap(width, height);
    this.qiGrid = new QiGrid(width, height);
    this.worldRenderer = new WorldRenderer(this.worldMap);
    this.qiSystem = new QiSystem(this.qiGrid, this.worldMap);
    this.weatherSystem = new WeatherSystem(this.worldMap);
    this.disasterSystem = new DisasterSystem(this.worldMap);
    this.cultivationSystem = new CultivationSystem(this.worldMap, this.qiGrid, this.tribulationSystem);
    this.needsSystem = new NeedsSystem(this.worldMap);
    this.threeTierAISystem = new ThreeTierAISystem(this.worldMap, this.qiGrid);
    this.threeTierAISystem.spatialGrid = this.spatialGrid;
    this.animalAISystem = new AnimalAISystem(this.worldMap);
    this.animalAISystem.spatialGrid = this.spatialGrid;
    this.animalMovementSystem = new AnimalMovementSystem(this.worldMap, this.spatialGrid);
    this.animalReproductionSystem = new AnimalReproductionSystem(this.worldMap);
    this.plantGrowthSystem = new PlantGrowthSystem(this.worldMap, this.qiGrid);
    this.corpseAndGraveSystem = new CorpseAndGraveSystem(this.worldMap);

    if (this.combatSystem) {
      this.combatSystem.worldMap = this.worldMap;
      this.combatSystem.spatialGrid = this.spatialGrid;
      this.combatSystem.diplomacySystem = this.diplomacySystem;
    }
    if (this.diplomacySystem) {
      this.diplomacySystem.spatialGrid = this.spatialGrid;
    }
    if (this.buildingSystem) {
      this.buildingSystem.diplomacySystem = this.diplomacySystem;
    }
    if (this.factionSystem) {
      this.factionSystem.worldMap = this.worldMap;
      this.factionSystem.qiGrid = this.qiGrid;
      this.factionSystem.spatialGrid = this.spatialGrid;
      this.factionSystem.diplomacySystem = this.diplomacySystem;
    }

    this.world.clearSystems();
    this.initSystems();
  }

  /**
   * Khởi tạo thế giới mới hoàn toàn (tất định 100% theo seed)
   */
  public initNewWorld(options: {
    template?: 'random' | 'thap_van_dai_son' | 'dong_bang_trung_tho' | 'ma_vuc_dam_lay' | 'hai_dao_tien_son';
    seed?: number;
    name?: string;
    qiMultiplier?: number;
    worldSize?: 'small' | 'medium' | 'large' | 'grand';
    customDim?: number;
  }): void {
    const template = options.template || 'thap_van_dai_son';
    const seed = options.seed ?? Math.floor(Math.random() * 90000 + 10000);
    const name = options.name || 'Thái Sơ Đại Lục';

    let mapDim = 360;
    if (options.customDim !== undefined) mapDim = options.customDim;
    else if (options.worldSize === 'small') mapDim = 150;
    else if (options.worldSize === 'medium') mapDim = 250;
    else if (options.worldSize === 'grand') mapDim = 500;
    else if (options.worldSize === 'large') mapDim = 360;

    // Validate all user/API inputs before resizing or clearing the current world.
    if (!isWorldTemplate(template)) {
      throw new RangeError(`Mẫu thế giới không hợp lệ: ${String(template)}.`);
    }
    assertValidWorldDimensions(mapDim, mapDim);
    if (!Number.isSafeInteger(seed)) {
      throw new RangeError('Seed thế giới phải là số nguyên an toàn.');
    }

    this.resizeWorldContainers(mapDim, mapDim);

    this.worldName = name;
    this.worldTemplate = template;
    this.worldSeed = seed;

    // 1. Dọn sạch toàn bộ trạng thái thế giới cũ (Entities, Systems, Queues, Singletons)
    this.resetWorldState();

    // 2. Đặt lại Lịch Thời Gian TRƯỚC khi khởi tạo Thời tiết để mùa không bị rò rỉ từ thế giới cũ
    this.timeManager.reset();
    this.timeManager.setSpeed(GameSettings.get().defaultSpeed);

    // 3. Thực thi toàn bộ quá trình kiến tạo địa hình, linh mạch, hệ sinh thái và thời tiết theo Seed
    SeededRNG.withSeed(seed, (rng) => {
      // 3.1 Kiến tạo địa hình thế giới
      WorldGenerator.generate(this.worldMap, template, seed);

      // 3.2 Khởi tạo Lưới Linh Khí theo rng
      this.qiGrid.initFromWorld(this.worldMap, rng);
      if (options.qiMultiplier && options.qiMultiplier !== 1.0) {
        for (let i = 0; i < this.qiGrid.width * this.qiGrid.height; i++) {
          const q = this.qiGrid.getTileByIndex(i);
          if (q) q.density = Math.round(q.density * options.qiMultiplier);
        }
      }

      // 3.3 Khởi tạo Thời tiết (sau khi TimeManager đã reset về mùa Xuân năm 1)
      this.weatherSystem.init();

      // 3.4 Đặt lại Camera vào trung tâm
      const centerX = (this.worldMap.width * this.worldMap.tileSize) / 2;
      const centerY = (this.worldMap.height * this.worldMap.tileSize) / 2;
      this.camera.x = centerX;
      this.camera.y = centerY;
      this.camera.zoom = 1.2;

      // 3.5 Gieo mầm hệ sinh thái thảo mộc & linh mộc
      PlantFactory.generateInitialFlora(this.world, this.worldMap, this.qiGrid, rng);

      // Mắt Linh Mạch tại trung tâm
      this.qiGrid.addSpiritVein(Math.floor(centerX / 16) - 3, Math.floor(centerY / 16) - 3, 'linh_khi', 6.0);

      // Phân bổ tự nhiên 8 - 16 mắt Linh Mạch rải rác trên khắp đại lục theo seed
      const veinCount = Math.max(6, Math.floor((this.worldMap.width * this.worldMap.height) / 10000));
      let placedVeins = 0;
      let attempts = 0;
      while (placedVeins < veinCount && attempts++ < 250) {
        const vx = Math.floor(rng.next() * (this.worldMap.width - 24)) + 12;
        const vy = Math.floor(rng.next() * (this.worldMap.height - 24)) + 12;
        const t = this.worldMap.getTile(vx, vy);
        if (t && (t.terrain === TerrainType.MOUNTAIN || t.terrain === TerrainType.DENSE_FOREST || t.terrain === TerrainType.LAKE || t.terrain === TerrainType.PLATEAU)) {
          const tier = rng.next() < 0.15 ? 'tien_khi' : 'linh_khi';
          this.qiGrid.addSpiritVein(vx, vy, tier, tier === 'tien_khi' ? 10.0 : 6.0);
          placedVeins++;
        }
      }

      // 3.6 Khởi tạo động vật hoang dã; thế giới mới không tự sinh cư dân.
      const faunaBudget = calculateInitialFaunaBudget(this.worldMap.width, this.worldMap.height);
      AnimalSpawnService.populate(this.world, this.worldMap, faunaBudget, rng, undefined, {
        ensureBreedingPairs: true
      });
      generateTreasureChests(this.world, this.worldMap, rng, {
        x: centerX, y: centerY, radiusPx: 180
      });
    });

    // Đồng bộ ban đầu cho SpatialGrid
    this.syncSpatialGrid();

    // 8. Bắn sự kiện biên niên sử
    this.eventBus.emit('chronicle:entry', {
      category: 'discovery',
      message: `🌟 Thiên địa sơ khai, vạn vật thành hình! Đạo giới [${name}] (${mapDim}x${mapDim} ô) đã được khai thiên lập địa với hệ sinh thái kỳ vĩ!`,
      importance: 'high'
    });
  }

  /**
   * Đồng bộ chỉ mục không gian SpatialGrid từ vị trí thực thể hiện tại
   */
  public syncSpatialGrid(): void {
    const positioned = this.world.query([PositionComponent]);
    const spatialItems: SpatialEntity[] = [];
    for (let i = 0; i < positioned.length; i++) {
      const ent = positioned[i];
      if (this.world.hasComponent(ent, InsideBuildingComponent)) continue;
      const pos = this.world.getComponent(ent, PositionComponent)!;
      spatialItems.push({ id: ent, x: pos.x, y: pos.y });
    }
    this.spatialGrid.rebuild(spatialItems);
  }

  /**
   * Thực thi các nhịp mô phỏng trong một khoảng thời gian thực deltaRealSeconds:
   * Đồng hồ TimeManager và cập nhật thế giới + SpatialGrid được xen kẽ từng tick một.
   */
  public stepSimulation(deltaRealSeconds: number): number {
    return this.timeManager.update(deltaRealSeconds, (tickDt) => {
      this.syncSpatialGrid();
      this.world.update(tickDt);
      this.syncSpatialGrid();
    });
  }

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastFrameTime = performance.now();
    requestAnimationFrame((time) => this.loop(time));
  }

  private loop(currentTime: number): void {
    if (!this.isRunning) return;

    const deltaRealMs = currentTime - this.lastFrameTime;
    const deltaRealSeconds = deltaRealMs / 1000;
    this.lastFrameTime = currentTime;

    // 1. Cập nhật nhịp mô phỏng (Simulation Ticks) chỉ khi đang trong game
    if (!this.isMainMenuOpen && !this.isPausedByMenu) {
      this.stepSimulation(deltaRealSeconds);
    }

    // 2. Dựng hình (Render Frame)
    this.render(deltaRealSeconds);

    requestAnimationFrame((time) => this.loop(time));
  }

  private render(dt: number): void {
    this.canvas.clear('#0d1117');

    const ctx = this.canvas.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const date = this.timeManager.getDate();
    const isWinter = date.season === Season.WINTER;

    // 1. Vẽ bản đồ địa hình
    this.worldRenderer.render(ctx, this.camera, w, h, (this.activeBrushTerrain || this.activeElevationBrushMode) && this.hoverTile ? { ...this.hoverTile, radius: this.brushRadius } : null);

    // 2. Vẽ Lớp phủ Linh Khí hoặc Bản đồ Nhiệt Độ (nếu bật)
    this.qiOverlayRenderer.render(ctx, this.qiGrid, this.worldMap, this.camera, w, h);

    // 3. Vẽ Viền Hào Quang Lãnh Thổ Môn Phái
    this.territoryRenderer.render(ctx, this.world, this.camera, w, h);

    // 4. Vẽ Cây cối & Thảo dược
    this.floraRenderer.render(ctx, this.world, this.camera, w, h, this.worldMap, isWinter);

    // 5. Vẽ Công Trình Kiến Trúc Pixel
    this.buildingRenderer.render(ctx, this.world, this.camera, w, h);
    this.treasureRenderer.render(ctx, this.world, this.camera, w, h);

    // 6. Vẽ Cư dân sinh vật
    this.entityRenderer.render(ctx, this.world, this.camera, w, h, this.selectedEntity);

    // 7. Hiệu ứng chiến đấu (Đạn đạo, đao quang kiếm ảnh, sát thương)
    this.combatFxRenderer.render(ctx, this.world, this.camera, w, h, dt);
    const occupiedText = this.dialogueRenderer.render(ctx, this.world, this.camera, w, h, dt, this.selectedEntity);
    this.activityFeedback.render(ctx, this.world, this.camera, w, h, this.selectedEntity, occupiedText);

    // 8. Vẽ hiệu ứng Thời tiết (Mưa, Tuyết, Dông Sét)
    this.weatherFxRenderer.render(ctx, this.weatherSystem.currentWeather, this.camera, w, h, dt);
  }
}
