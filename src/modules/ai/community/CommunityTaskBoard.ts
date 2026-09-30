import { ECSWorld } from '../../../ecs/World.ts';
import { professionEfficiency } from '../../professions/ProfessionService.ts';
import { WorldMap } from '../../world/WorldMap.ts';
import { QiGrid } from '../../energy/QiGrid.ts';
import { EventBus } from '../../../core/EventBus.ts';
import {
  PositionComponent,
  MortalNeedsComponent,
  HealthComponent,
  RaceComponent,
  RealmComponent,
  NameComponent,
  JobPreference,
  CultivationTechniqueComponent
} from '../../beings/BeingComponents.ts';
import { FactionFactory } from '../../factions/FactionFactory.ts';
import {
  MemberComponent,
  FactionComponent,
  SettlementComponent,
  ResidenceComponent,
  BuildingComponent,
  FoundingIntentComponent,
  ConstructionSiteComponent
} from '../../factions/FactionComponents.ts';
import { AIPlannerComponent } from '../brain/AIComponents.ts';
import {
  BUILDING_DEFINITIONS,
  BuildingType,
  ResourceBundle,
  FACTION_PROGRESSION_CONFIG,
  getNormalizedCultivationTier,
  isCultivationFactionType
} from '../../../config/factions.config.ts';
import { DiplomacySystem } from '../../factions/DiplomacySystem.ts';
import { SmartObjectManager } from '../smartobjects/SmartObjectManager.ts';
import { AStarPathfinder, Point2D } from '../pathfinding/AStar.ts';
import { TimeManager } from '../../../core/TimeManager.ts';
import { emitGrowthEvent } from '../../talent/GrowthEvents.ts';


import { PlantComponent } from '../../flora/PlantComponents.ts';
import { validateBuildingPlacement } from '../../factions/BuildingPlacementRules.ts';

export type CommunityTaskType =
  | 'found_campfire'        // Khởi dựng đống lửa đầu tiên lập thôn xóm
  | 'build_thatched_hut'    // Xây dựng lều tranh che mưa nắng
  | 'till_mortal_farm'      // Khai khẩn nông điền trồng lúa
  | 'dig_village_well'      // Đào giếng nước ngọt
  | 'cook_village_meal'     // Nấu cơm canh tại lửa trại
  | 'chop_wood'             // Đốn gỗ từ cây rừng bảo đảm nguồn vật tư
  | 'farm_harvest'          // Cày cấy trên ruộng lúa
  | 'repair_structure'      // Tu sửa công trình hư hại
  | 'patrol_settlement'     // Tuần tra biên giới xua đuổi dã thú
  | 'found_sect_hall'       // Khởi dựng Tông Môn Đại Điện khai tông lập phái
  | 'plant_herb_garden'     // Khai khẩn Linh Dược Điền
  | 'build_meditation_cave' // Đào Động Phủ Bế Quan
  | 'build_alchemy_chamber' // Xây dựng Luyện Đan Phòng
  | 'build_scripture_pavilion' // Xây dựng Tàng Kinh Các
  | 'build_defense_array';  // Bố trí Hộ Tông Trận Pháp

export interface CommunityTask {
  id: string;
  type: CommunityTaskType;
  title: string;
  targetPos: Point2D;
  targetEntityId?: number;
  assignedEntityId: number | null;
  preferredJob: JobPreference;
  priority: number;        // 1 - 100
  createdAt: number;
  duration: number;
  settlementId?: string;
  payerFactionId?: string;
  foundingIntentId?: string;
  founderEntityId?: number;
  reservedCost?: ResourceBundle;
  costReserved?: boolean;
  failureCount?: number;
  woodReserved?: number;
  status?: 'open' | 'assigned' | 'completed' | 'cancelled';
}

const TASK_TO_BUILDING_TYPE: Partial<Record<CommunityTaskType, BuildingType>> = {
  found_campfire: 'campfire',
  build_thatched_hut: 'thatched_hut',
  till_mortal_farm: 'mortal_farm',
  dig_village_well: 'village_well',
  found_sect_hall: 'sect_hall',
  plant_herb_garden: 'herb_garden',
  build_meditation_cave: 'meditation_cave',
  build_alchemy_chamber: 'alchemy_chamber',
  build_scripture_pavilion: 'scripture_pavilion',
  build_defense_array: 'defense_array'
};

const BUILDING_TYPE_TO_TASK_CONFIG: Partial<Record<
  BuildingType,
  { type: CommunityTaskType; title: string; preferredJob: JobPreference; priority: number }
>> = {
  campfire: { type: 'found_campfire', title: 'Khởi dựng Lửa Trại', preferredJob: 'builder', priority: 90 },
  thatched_hut: { type: 'build_thatched_hut', title: 'Xây dựng Lều Tranh', preferredJob: 'builder', priority: 70 },
  mortal_farm: { type: 'till_mortal_farm', title: 'Khai khẩn Ruộng Lúa', preferredJob: 'farmer', priority: 80 },
  village_well: { type: 'dig_village_well', title: 'Đào Giếng Thôn', preferredJob: 'builder', priority: 85 },
  sect_hall: { type: 'found_sect_hall', title: 'Xây dựng Nghị Sự Đại Điện', preferredJob: 'builder', priority: 95 },
  herb_garden: { type: 'plant_herb_garden', title: 'Khai khẩn Dược Điền', preferredJob: 'farmer', priority: 75 },
  meditation_cave: { type: 'build_meditation_cave', title: 'Khai mở Động Phủ', preferredJob: 'builder', priority: 75 },
  alchemy_chamber: { type: 'build_alchemy_chamber', title: 'Xây dựng Luyện Đan Phòng', preferredJob: 'builder', priority: 80 },
  defense_array: { type: 'build_defense_array', title: 'Bố trí Hộ Trận', preferredJob: 'builder', priority: 85 },
  scripture_pavilion: { type: 'build_scripture_pavilion', title: 'Xây dựng Tàng Kinh Các', preferredJob: 'builder', priority: 80 }
};

/**
 * MÔ HÌNH BẢNG VIỆC CỘNG ĐỒNG THEO ĐIỂM ĐỊNH CƯ & THẾ LỰC (SETTLEMENT-SCOPED COMMUNITY TASK BOARD)
 * - Mỗi thôn xóm / làng / tông môn có nhu cầu công việc riêng theo SettlementComponent / FactionComponent
 * - Khóa tài nguyên xây dựng khi tạo task, trừ đúng 1 lần khi hoàn tất, hoàn trả đúng 1 lần khi hủy
 * - Không gán nhầm công trình cho factions[0]
 */
export class CommunityTaskBoard {
  private static instance: CommunityTaskBoard | null = null;

  public static getInstance(): CommunityTaskBoard {
    if (!this.instance) {
      this.instance = new CommunityTaskBoard();
    }
    return this.instance;
  }

  private tasks: Map<string, CommunityTask> = new Map();
  private entityTasks: Map<number, string> = new Map();
  private lastGenerationTime: number = 0;
  private taskCounter: number = 1;
  private eventBus = EventBus.getInstance();

  public clear(): void {
    this.tasks.clear();
    this.entityTasks.clear();
    this.lastGenerationTime = 0;
    this.taskCounter = 1;
  }

  public clearAll(): void {
    this.clear();
  }

  /**
   * Khôi phục các task thi công cho toàn bộ công trường đang dở sau khi nạp bản lưu
   * và remap lại các bước của AI planner để công nhân tiếp tục thi công liền mạch.
   */
  public restoreTasksFromConstructionSites(world: ECSWorld): void {
    const buildings = world.query([PositionComponent, BuildingComponent, ConstructionSiteComponent]);

    for (const bEnt of buildings) {
      const bComp = world.getComponent(bEnt, BuildingComponent)!;
      const siteComp = world.getComponent(bEnt, ConstructionSiteComponent)!;
      const pos = world.getComponent(bEnt, PositionComponent)!;

      if (!bComp.isUnderConstruction || siteComp.isCompleted) {
        continue;
      }

      // Kiểm tra nếu task cho công trường này đã tồn tại trên board
      let existingTask: CommunityTask | null = null;
      for (const t of this.tasks.values()) {
        if (t.targetEntityId === bEnt) {
          existingTask = t;
          break;
        }
      }

      let task = existingTask;
      if (!task) {
        const meta = BUILDING_TYPE_TO_TASK_CONFIG[bComp.buildingType] ?? {
          type: 'build_thatched_hut' as CommunityTaskType,
          title: `Xây dựng ${bComp.name || 'công trình'}`,
          preferredJob: 'builder' as JobPreference,
          priority: 75
        };

        const taskId = `task_${this.taskCounter++}`;
        task = {
          id: taskId,
          type: meta.type,
          title: meta.title,
          targetPos: { x: pos.x, y: pos.y },
          targetEntityId: bEnt,
          assignedEntityId: null,
          preferredJob: meta.preferredJob,
          priority: meta.priority,
          createdAt: Date.now(),
          duration: 4.0,
          settlementId: siteComp.settlementId || bComp.settlementId,
          payerFactionId: siteComp.payerFactionId || bComp.factionId,
          reservedCost: siteComp.reservedResources ? { ...siteComp.reservedResources } : undefined,
          costReserved: false, // Quản lý bởi ConstructionSiteComponent & completeBuilding
          failureCount: 0
        };
        if (siteComp.founderEntityId !== undefined) {
          const intent = world.getComponent(siteComp.founderEntityId, FoundingIntentComponent);
          if (intent) {
            task.founderEntityId = siteComp.founderEntityId;
            task.foundingIntentId = `restored_${siteComp.founderEntityId}`;
            intent.taskId = taskId;
            intent.stage = 'building';
          }
        }
        this.tasks.set(taskId, task);
      }

      // Remap kế hoạch của các công nhân đang thi công công trình này
      for (const workerEnt of world.query([AIPlannerComponent])) {
        const hp = world.getComponent(workerEnt, HealthComponent);
        if (!hp || hp.isDead) continue;
        const planner = world.getComponent(workerEnt, AIPlannerComponent)!;
        let matched = false;
        for (const step of planner.steps) {
          if (
            step.customData?.buildingEnt === bEnt ||
            (step.customData?.communityTaskId && !this.tasks.has(step.customData.communityTaskId) && siteComp.assignedWorkerIds.includes(workerEnt))
          ) {
            step.customData.communityTaskId = task.id;
            step.customData.buildingEnt = bEnt;
            matched = true;
          }
        }
        if (matched) {
          if (task.assignedEntityId === null) {
            task.assignedEntityId = workerEnt;
            this.entityTasks.set(workerEnt, task.id);
          }
          if (!siteComp.assignedWorkerIds.includes(workerEnt)) {
            siteComp.assignedWorkerIds.push(workerEnt);
          }
        }
      }
    }

    // Các task không gắn công trường (như đốn gỗ) không được lưu trên board.
    // Kế hoạch cũ phải lập lại, tránh khai thác cây mà không còn task/chủ kho.
    for (const workerEnt of world.query([AIPlannerComponent])) {
      const planner = world.getComponent(workerEnt, AIPlannerComponent)!;
      if (planner.steps.some(step =>
        step.customData?.communityTaskId && !this.tasks.has(step.customData.communityTaskId))) {
        planner.failCurrentPlan('Công việc cộng đồng cần được giao lại sau khi nạp');
      }
    }
  }

  public getAllTasks(): CommunityTask[] {
    return Array.from(this.tasks.values());
  }

  public getTaskById(taskId: string): CommunityTask | undefined {
    return this.tasks.get(taskId);
  }

  public getTask(taskId: string): CommunityTask | undefined {
    return this.tasks.get(taskId);
  }

  public getTasksForSettlement(settlementId: string): CommunityTask[] {
    const result: CommunityTask[] = [];
    for (const task of this.tasks.values()) {
      if (task.settlementId === settlementId) {
        result.push(task);
      }
    }
    return result;
  }

  public getTasksForFaction(factionId: string): CommunityTask[] {
    const result: CommunityTask[] = [];
    for (const task of this.tasks.values()) {
      if (task.payerFactionId === factionId) {
        result.push(task);
      }
    }
    return result;
  }

  /**
   * Cập nhật và tự động phát sinh công việc cộng đồng theo từng Settlement / Tông môn (chạy định kỳ 1.0s)
   */
  public update(world: ECSWorld, worldMap: WorldMap, dt: number, _qiGrid?: QiGrid): void {
    this.lastGenerationTime += dt;
    if (this.lastGenerationTime < 1.0) return;
    this.lastGenerationTime = 0;

    const smartObjects = SmartObjectManager.getInstance();
    smartObjects.syncFromWorld(world);

    // 1. Dọn dẹp các task bị kẹt do người làm đã chết hoặc founder đã chết
    for (const task of Array.from(this.tasks.values())) {
      if (task.type === 'chop_wood' &&
          (task.targetEntityId === undefined || !world.hasComponent(task.targetEntityId, PlantComponent))) {
        this.cancelTask(world, task.id, 'Cây cần khai thác không còn tồn tại');
        continue;
      }
      if (task.founderEntityId !== undefined) {
        const fHp = world.getComponent(task.founderEntityId, HealthComponent);
        if (!fHp || fHp.isDead) {
          this.cancelTask(world, task.id, 'Người khởi xướng đã tử nạn');
          continue;
        }
      }

      if (task.assignedEntityId !== null) {
        const hp = world.getComponent(task.assignedEntityId, HealthComponent);
        if (!hp || hp.isDead) {
          const deadEntId = task.assignedEntityId;
          task.assignedEntityId = null;
          this.entityTasks.delete(deadEntId);
          if (task.targetEntityId !== undefined) {
            const site = world.getComponent(task.targetEntityId, ConstructionSiteComponent);
            if (site) site.assignedWorkerIds = site.assignedWorkerIds.filter(id => id !== deadEntId);
          }
          // Công trường còn nguyên; người sống khác trong nhóm có thể nhận tiếp.
        }
      }
    }

    const buildings = world.query([PositionComponent, BuildingComponent]);
    const settlements = world.query([PositionComponent, SettlementComponent]);

    // 2. PHÁT SINH CÔNG VIỆC THEO TỪNG ĐIỂM ĐỊNH CƯ DÂN SINH (SETTLEMENT)
    for (const sEnt of settlements) {
      const sPos = world.getComponent(sEnt, PositionComponent)!;
      const sComp = world.getComponent(sEnt, SettlementComponent)!;
      if (!sComp.ownerFactionId) continue;

      const factionEnt = FactionFactory.findFactionEntity(world, sComp.ownerFactionId);
      if (factionEnt === null) continue;

      // Làm sạch danh sách cư dân còn sống
      const aliveResidents: number[] = [];
      for (const rId of sComp.residentIds) {
        const hp = world.getComponent(rId, HealthComponent);
        if (hp && !hp.isDead) {
          aliveResidents.push(rId);
        }
      }
      sComp.residentIds = new Set(aliveResidents);
      if (aliveResidents.length === 0) continue;

      // Thống kê công trình thuộc điểm định cư này
      let campfireCount = 0;
      let farmCount = 0;
      let hutCount = 0;
      let wellCount = 0;
      let underConstructionCampfires = 0;
      let underConstructionFarms = 0;
      let underConstructionHuts = 0;
      let underConstructionWells = 0;
      let damagedBuildingEnt: number | null = null;
      let damagedBuildingPos: Point2D | null = null;
      let campfirePos: Point2D = { x: sPos.x, y: sPos.y };

      for (const bEnt of buildings) {
        const bComp = world.getComponent(bEnt, BuildingComponent)!;
        const bPos = world.getComponent(bEnt, PositionComponent)!;
        if (bComp.isRuins || bComp.currentDurability <= 0) continue;

        const belongsToSettlement =
          bComp.settlementId === sComp.settlementId ||
          (bComp.factionId === sComp.ownerFactionId &&
            Math.hypot(bPos.x - sPos.x, bPos.y - sPos.y) <= sComp.radiusPixels + 64);

        if (!belongsToSettlement) continue;

        if (bComp.isUnderConstruction) {
          if (bComp.buildingType === 'campfire') underConstructionCampfires++;
          else if (bComp.buildingType === 'mortal_farm') underConstructionFarms++;
          else if (bComp.buildingType === 'thatched_hut') underConstructionHuts++;
          else if (bComp.buildingType === 'village_well') underConstructionWells++;
          continue;
        }

        if (bComp.buildingType === 'campfire') {
          campfireCount++;
          campfirePos = { x: bPos.x, y: bPos.y };
        } else if (bComp.buildingType === 'mortal_farm') {
          farmCount++;
        } else if (bComp.buildingType === 'thatched_hut') {
          hutCount++;
        } else if (bComp.buildingType === 'village_well') {
          wellCount++;
        }

        if (bComp.currentDurability < bComp.maxDurability * 0.65 && damagedBuildingEnt === null) {
          damagedBuildingEnt = bEnt;
          damagedBuildingPos = { x: bPos.x, y: bPos.y };
        }
      }

      sComp.housingCapacity = hutCount * (BUILDING_DEFINITIONS.thatched_hut.housingCapacity ?? 4);
      sComp.waterAccess = wellCount > 0 || this.hasNearbyNaturalWater(sPos, worldMap, 6);

      // A. Nếu điểm định cư bị mất Lửa Trại -> Khôi phục Lửa Trại
      if (campfireCount === 0 && underConstructionCampfires === 0 && !this.hasTaskForSettlement(sComp.settlementId, 'found_campfire')) {
        const spot = this.findValidBuildingSpot(sPos, worldMap, 'campfire', 16, world);
        if (spot) {
          this.createTask({
            type: 'found_campfire',
            title: `🔥 Nhóm Lửa Trại [${sComp.name}]`,
            targetPos: spot,
            preferredJob: 'builder',
            priority: 95,
            duration: 3.5,
            settlementId: sComp.settlementId,
            payerFactionId: sComp.ownerFactionId
          }, world, worldMap);
        }
      }

      // B. Khai khẩn Nông Điền theo quy mô dân cư
      const neededFarms = Math.max(1, Math.min(4, Math.ceil(aliveResidents.length / 8)));
      if (campfireCount > 0 && farmCount + underConstructionFarms < neededFarms && !this.hasTaskForSettlement(sComp.settlementId, 'till_mortal_farm')) {
        const spot = this.findValidBuildingSpot(sPos, worldMap, 'mortal_farm', 36 + farmCount * 16, world);
        if (spot) {
          this.createTask({
            type: 'till_mortal_farm',
            title: `🌾 Khai Khẩn Ruộng Lúa [${sComp.name}]`,
            targetPos: spot,
            preferredJob: 'farmer',
            priority: 90,
            duration: 4.5,
            settlementId: sComp.settlementId,
            payerFactionId: sComp.ownerFactionId
          }, world, worldMap);
        }
      }

      // C. Dựng thêm Nhà Tranh nếu thiếu chỗ ở
      const neededHuts = Math.min(8, Math.ceil(aliveResidents.length / 3));
      if (campfireCount > 0 && hutCount + underConstructionHuts < neededHuts && !this.hasTaskForSettlement(sComp.settlementId, 'build_thatched_hut')) {
        const spot = this.findValidBuildingSpot(sPos, worldMap, 'thatched_hut', 42 + hutCount * 14, world);
        if (spot) {
          this.createTask({
            type: 'build_thatched_hut',
            title: `🛖 Dựng Nhà Tranh [${sComp.name}] (#${hutCount + 1})`,
            targetPos: spot,
            preferredJob: 'builder',
            priority: 88,
            duration: 4.5,
            settlementId: sComp.settlementId,
            payerFactionId: sComp.ownerFactionId
          }, world, worldMap);
        }
      }

      // D. Đào Giếng Nước nếu chưa có giếng
      if (campfireCount > 0 && wellCount === 0 && underConstructionWells === 0 && !this.hasTaskForSettlement(sComp.settlementId, 'dig_village_well')) {
        const spot = this.findValidBuildingSpot(sPos, worldMap, 'village_well', 30, world);
        if (spot) {
          this.createTask({
            type: 'dig_village_well',
            title: `🪣 Đào Giếng Nước [${sComp.name}]`,
            targetPos: spot,
            preferredJob: 'builder',
            priority: 86,
            duration: 4.0,
            settlementId: sComp.settlementId,
            payerFactionId: sComp.ownerFactionId
          }, world, worldMap);
        }
      }

      // E. Tu sửa công trình hư hại
      if (damagedBuildingEnt !== null && damagedBuildingPos && !this.hasTaskForSettlement(sComp.settlementId, 'repair_structure')) {
        this.createTask({
          type: 'repair_structure',
          title: `🔨 Tu Sửa Công Trình [${sComp.name}]`,
          targetPos: damagedBuildingPos,
          targetEntityId: damagedBuildingEnt,
          preferredJob: 'builder',
          priority: 84,
          duration: 3.5,
          settlementId: sComp.settlementId,
          payerFactionId: sComp.ownerFactionId
        }, world);
      }

      // F. Nấu bữa cơm thôn bản nếu cư dân có lương thực thô
      let totalRawFood = 0;
      let totalCookedMeals = 0;
      for (const rId of aliveResidents) {
        const needs = world.getComponent(rId, MortalNeedsComponent);
        if (needs) {
          totalRawFood += needs.rawFoodCount;
          totalCookedMeals += needs.cookedMealCount;
        }
      }
      if (totalRawFood >= 2 && totalCookedMeals < aliveResidents.length && campfireCount > 0 && !this.hasTaskForSettlement(sComp.settlementId, 'cook_village_meal')) {
        this.createTask({
          type: 'cook_village_meal',
          title: `🍲 Nấu Bữa Cơm [${sComp.name}]`,
          targetPos: campfirePos,
          preferredJob: 'cook',
          priority: 80,
          duration: 3.5,
          settlementId: sComp.settlementId,
          payerFactionId: sComp.ownerFactionId
        }, world);
      }

      // G. Đốn gỗ duy trì kho dự trữ thế lực khi thiếu gỗ hoặc có công trình cần thi công
      const fEnt = FactionFactory.findFactionEntity(world, sComp.ownerFactionId);
      const fComp = fEnt !== null ? world.getComponent(fEnt, FactionComponent) : undefined;
      const isWoodLow = fComp !== undefined && fComp.woodStock < 50;
      const hasUnfinishedBld = underConstructionCampfires + underConstructionFarms + underConstructionHuts + underConstructionWells > 0;
      if ((isWoodLow || hasUnfinishedBld) && !this.hasTaskForSettlement(sComp.settlementId, 'chop_wood')) {
        const tree = this.findNearestChoppableTree(world, sPos, 400);
        if (tree) {
          this.createTask({
            type: 'chop_wood',
            title: `🪓 Đốn Gỗ [${sComp.name}]`,
            targetPos: { x: tree.x, y: tree.y },
            targetEntityId: tree.entityId,
            preferredJob: 'builder',
            priority: isWoodLow ? 88 : 65,
            duration: 4.5,
            settlementId: sComp.settlementId,
            payerFactionId: sComp.ownerFactionId
          }, world);
        }
      }
    }

    // 3. PHÁT SINH CÔNG VIỆC CHO CÁC TÔNG MÔN / THÁNH ĐỊA (SECT / HOLY LAND)
    const factions = world.query([FactionComponent]);
    for (const fEnt of factions) {
      const faction = world.getComponent(fEnt, FactionComponent)!;
      if (!isCultivationFactionType(faction.type)) continue;
      if (faction.members.size === 0) continue;

      let hallPos: Point2D | null = null;
      let herbGardenCount = 0;
      let meditationCaveCount = 0;
      let alchemyChamberCount = 0;
      let defenseArrayCount = 0;
      let underConstructionHerbGardens = 0;
      let underConstructionCaves = 0;
      let underConstructionAlchemies = 0;
      let underConstructionDefenses = 0;

      for (const bEnt of buildings) {
        const bComp = world.getComponent(bEnt, BuildingComponent)!;
        if (bComp.isRuins || bComp.currentDurability <= 0 || bComp.factionId !== faction.factionId) continue;
        const bPos = world.getComponent(bEnt, PositionComponent)!;

        if (bComp.buildingType === 'sect_hall') {
          hallPos = { x: bPos.x, y: bPos.y };
        } else if (bComp.isUnderConstruction) {
          if (bComp.buildingType === 'herb_garden') underConstructionHerbGardens++;
          else if (bComp.buildingType === 'meditation_cave') underConstructionCaves++;
          else if (bComp.buildingType === 'alchemy_chamber') underConstructionAlchemies++;
          else if (bComp.buildingType === 'defense_array') underConstructionDefenses++;
          continue;
        } else if (bComp.buildingType === 'herb_garden') {
          herbGardenCount++;
        } else if (bComp.buildingType === 'meditation_cave') {
          meditationCaveCount++;
        } else if (bComp.buildingType === 'alchemy_chamber') {
          alchemyChamberCount++;
        } else if (bComp.buildingType === 'defense_array') {
          defenseArrayCount++;
        }
      }

      if (!hallPos) continue;

      if (herbGardenCount === 0 && underConstructionHerbGardens === 0 && !this.hasTaskForFaction(faction.factionId, 'plant_herb_garden')) {
        const spot = this.findValidBuildingSpot(hallPos, worldMap, 'herb_garden', 44, world);
        if (spot) {
          this.createTask({
            type: 'plant_herb_garden',
            title: `🌿 Mở Linh Dược Điền [${faction.name}]`,
            targetPos: spot,
            preferredJob: 'farmer',
            priority: 88,
            duration: 4.5,
            payerFactionId: faction.factionId
          }, world, worldMap);
        }
      }

      const neededCaves = Math.min(4, Math.max(1, Math.floor(faction.members.size / 3)));
      if (meditationCaveCount + underConstructionCaves < neededCaves && !this.hasTaskForFaction(faction.factionId, 'build_meditation_cave')) {
        const spot = this.findValidBuildingSpot(hallPos, worldMap, 'meditation_cave', 52 + meditationCaveCount * 16, world);
        if (spot) {
          this.createTask({
            type: 'build_meditation_cave',
            title: `🧘 Đào Động Phủ Bế Quan [${faction.name}]`,
            targetPos: spot,
            preferredJob: 'builder',
            priority: 86,
            duration: 4.5,
            payerFactionId: faction.factionId
          }, world, worldMap);
        }
      }

      if (herbGardenCount > 0 && alchemyChamberCount === 0 && underConstructionAlchemies === 0 && faction.members.size >= 4 && !this.hasTaskForFaction(faction.factionId, 'build_alchemy_chamber')) {
        const spot = this.findValidBuildingSpot(hallPos, worldMap, 'alchemy_chamber', 48, world);
        if (spot) {
          this.createTask({
            type: 'build_alchemy_chamber',
            title: `⚗️ Dựng Luyện Đan Phòng [${faction.name}]`,
            targetPos: spot,
            preferredJob: 'cook',
            priority: 85,
            duration: 5.0,
            payerFactionId: faction.factionId
          }, world, worldMap);
        }
      }

      if (defenseArrayCount === 0 && underConstructionDefenses === 0 && faction.members.size >= 5 && !this.hasTaskForFaction(faction.factionId, 'build_defense_array')) {
        const spot = this.findValidBuildingSpot(hallPos, worldMap, 'defense_array', 38, world);
        if (spot) {
          this.createTask({
            type: 'build_defense_array',
            title: `🛡️ Bố Trí Hộ Sơn Đại Trận [${faction.name}]`,
            targetPos: spot,
            preferredJob: 'builder',
            priority: 89,
            duration: 5.0,
            payerFactionId: faction.factionId
          }, world, worldMap);
        }
      }
    }
  }

  public findNearestChoppableTree(
    world: ECSWorld,
    centerPos: Point2D,
    maxRadiusPx: number = 350
  ): { x: number; y: number; entityId: number } | null {
    const plants = world.query([PositionComponent, PlantComponent]);
    let nearest: { x: number; y: number; entityId: number } | null = null;
    let minDist = maxRadiusPx;

    for (const pEnt of plants) {
      const pComp = world.getComponent(pEnt, PlantComponent)!;
      if (pComp.maxWood <= 0) continue;
      if (pComp.woodRemaining - pComp.reservedWood < 5) continue;
      if (pComp.stage < 2) continue; // Cây chưa đủ lớn

      const pPos = world.getComponent(pEnt, PositionComponent)!;
      const d = Math.hypot(pPos.x - centerPos.x, pPos.y - centerPos.y);
      if (d < minDist) {
        minDist = d;
        nearest = { x: pPos.x, y: pPos.y, entityId: pEnt };
      }
    }
    return nearest;
  }

  public hasTaskOfType(type: CommunityTaskType): boolean {
    for (const task of this.tasks.values()) {
      if (task.type === type) return true;
    }
    return false;
  }

  public hasTaskForSettlement(settlementId: string, type: CommunityTaskType): boolean {
    for (const task of this.tasks.values()) {
      if (task.settlementId === settlementId && task.type === type) return true;
    }
    return false;
  }

  public hasTaskForFaction(factionId: string, type: CommunityTaskType): boolean {
    for (const task of this.tasks.values()) {
      if (task.payerFactionId === factionId && task.type === type) return true;
    }
    return false;
  }

  public createTask(
    options: {
      type: CommunityTaskType;
      title: string;
      targetPos: Point2D;
      targetEntityId?: number;
      preferredJob: JobPreference;
      priority: number;
      duration: number;
      settlementId?: string;
      payerFactionId?: string;
      foundingIntentId?: string;
      founderEntityId?: number;
      reservedCost?: ResourceBundle;
    },
    world?: ECSWorld,
    worldMap?: WorldMap
  ): CommunityTask | null {
    const buildingType = TASK_TO_BUILDING_TYPE[options.type];
    if (buildingType && options.payerFactionId && world &&
        FactionFactory.findFactionEntity(world, options.payerFactionId) === null) return null;
    if (buildingType && world && worldMap && options.targetEntityId === undefined) {
      const placement = validateBuildingPlacement(world, worldMap, buildingType, options.targetPos.x, options.targetPos.y);
      if (!placement.valid) return null;
    }
    const defaultCost = buildingType ? BUILDING_DEFINITIONS[buildingType]?.resourceCost : undefined;
    const costToReserve = options.reservedCost ?? defaultCost;

    const targetHasSite =
      options.targetEntityId !== undefined &&
      world !== undefined &&
      world.hasComponent(options.targetEntityId, ConstructionSiteComponent);

    let costReserved = false;
    if (!targetHasSite && world && options.payerFactionId && costToReserve) {
      const factionEnt = FactionFactory.findFactionEntity(world, options.payerFactionId);
      if (factionEnt !== null) {
        const ok = FactionFactory.reserveResources(world, options.payerFactionId, costToReserve);
        if (!ok) {
          return null; // Kho thế lực không đủ vật tư để mở công việc xây dựng mới
        }
        costReserved = true;
      }
    }

    let targetEntityId = options.targetEntityId;
    if (
      buildingType &&
      world &&
      targetEntityId === undefined &&
      (options.payerFactionId || options.foundingIntentId)
    ) {
      targetEntityId = FactionFactory.startConstruction(
        world,
        buildingType,
        options.payerFactionId ?? '',
        options.targetPos.x,
        options.targetPos.y,
        options.settlementId,
        options.payerFactionId ? costToReserve : undefined
      );
      if (options.foundingIntentId && options.founderEntityId !== undefined) {
        const site = world.getComponent(targetEntityId, ConstructionSiteComponent);
        if (site) site.founderEntityId = options.founderEntityId;
      }
    }

    let woodToReserve = 0;
    if (options.type === 'chop_wood') {
      const plant = targetEntityId !== undefined && world
        ? world.getComponent(targetEntityId, PlantComponent)
        : undefined;
      const available = plant ? plant.woodRemaining - plant.reservedWood : 0;
      if (!plant || plant.stage < 2 || available < 5) return null;
      woodToReserve = Math.min(10, available);
    }

    const taskId = `task_${this.taskCounter++}`;
    const task: CommunityTask = {
      id: taskId,
      type: options.type,
      title: options.title,
      targetPos: options.targetPos,
      targetEntityId,
      assignedEntityId: null,
      preferredJob: options.preferredJob,
      priority: options.priority,
      createdAt: Date.now(),
      duration: options.duration,
      settlementId: options.settlementId,
      payerFactionId: options.payerFactionId,
      foundingIntentId: options.foundingIntentId,
      founderEntityId: options.founderEntityId,
      reservedCost: costToReserve ? { ...costToReserve } : undefined,
      costReserved,
      failureCount: 0
    };

    if (woodToReserve > 0 && targetEntityId !== undefined && world) {
      const pComp = world.getComponent(targetEntityId, PlantComponent);
      if (pComp) {
        pComp.reservedWood += woodToReserve;
        task.woodReserved = woodToReserve;
      }
    }

    this.tasks.set(taskId, task);
    return task;
  }

  public createBuildingTask(
    world: ECSWorld,
    worldMap: WorldMap,
    buildingType: BuildingType,
    factionId: string,
    targetPos: Point2D
  ): CommunityTask | null {
    const meta = BUILDING_TYPE_TO_TASK_CONFIG[buildingType];
    if (!meta || !factionId) return null;
    return this.createTask({
      type: meta.type,
      title: meta.title,
      targetPos,
      preferredJob: meta.preferredJob,
      priority: meta.priority,
      duration: 4,
      payerFactionId: factionId
    }, world, worldMap);
  }

  /**
   * Giao trực tiếp một task cho một thực thể cụ thể (dùng cho người khởi xướng lập thôn / khai tông)
   */
  public assignTaskToEntity(taskId: string, entityId: number): boolean {
    const task = this.tasks.get(taskId);
    if (!task) return false;

    const prevTaskId = this.entityTasks.get(entityId);
    if (prevTaskId && prevTaskId !== taskId) {
      this.releaseTask(entityId);
    }

    task.assignedEntityId = entityId;
    this.entityTasks.set(entityId, taskId);
    return true;
  }

  /**
   * Cư dân tìm và nhận việc phù hợp nhất từ Bảng Việc (có cô lập theo Settlement / Faction)
   */
  public claimBestTask(
    entityId: number,
    seekerPos: Point2D,
    job: JobPreference,
    world?: ECSWorld
  ): CommunityTask | null {
    const existingTaskId = this.entityTasks.get(entityId);
    if (existingTaskId) {
      const task = this.tasks.get(existingTaskId);
      if (task) return task;
      this.entityTasks.delete(entityId);
    }

    const seekerRes = world?.getComponent(entityId, ResidenceComponent);
    const seekerMem = world?.getComponent(entityId, MemberComponent);

    let bestTask: CommunityTask | null = null;
    let highestScore = -Infinity;

    for (const task of this.tasks.values()) {
      if (task.assignedEntityId !== null) continue;

      // Nếu là task sáng lập: chỉ founder hoặc thành viên trong nhóm sáng lập mới được nhận
      if (task.founderEntityId !== undefined && world) {
        const intent = world.getComponent(task.founderEntityId, FoundingIntentComponent);
        const isParticipant = task.founderEntityId === entityId || (intent && intent.participantIds.has(entityId));
        if (!isParticipant) continue;
      }

      // Nếu task thuộc một Settlement cụ thể: chỉ cư dân của Settlement đó hoặc thành viên cùng thế lực mới nhận
      if (task.settlementId && world) {
        if (seekerRes && seekerRes.settlementId !== task.settlementId) {
          continue;
        }
        if (!seekerRes && seekerMem && task.payerFactionId && seekerMem.factionId !== task.payerFactionId) {
          continue;
        }
        if (!seekerRes && !seekerMem) {
          continue; // Lưu dân tự do không tự ý nhận việc nội bộ của làng khác
        }
      } else if (task.payerFactionId && world) {
        if (seekerMem?.factionId !== task.payerFactionId && seekerRes?.factionId !== task.payerFactionId) {
          continue;
        }
      }

      const dist = Math.hypot(task.targetPos.x - seekerPos.x, task.targetPos.y - seekerPos.y);
      let score = task.priority;

      if (task.preferredJob === job) {
        score += 25;
      }
      if (world) score += (professionEfficiency(world, entityId, task.preferredJob) - 1) * 30;
      if (task.founderEntityId === entityId) {
        score += 50;
      }

      score -= Math.min(20, dist / 25);

      if (score > highestScore) {
        highestScore = score;
        bestTask = task;
      }
    }

    if (bestTask) {
      bestTask.assignedEntityId = entityId;
      this.entityTasks.set(entityId, bestTask.id);
      if (bestTask.targetEntityId !== undefined && world) {
        const site = world.getComponent(bestTask.targetEntityId, ConstructionSiteComponent);
        if (site && !site.assignedWorkerIds.includes(entityId)) site.assignedWorkerIds.push(entityId);
      }
      return bestTask;
    }

    return null;
  }

  /**
   * Giải phóng việc đang nhận (khi đổi mục tiêu tạm thời)
   */
  public releaseTask(entityId: number): void {
    const taskId = this.entityTasks.get(entityId);
    if (!taskId) return;

    const task = this.tasks.get(taskId);
    if (task && task.assignedEntityId === entityId) {
      task.assignedEntityId = null;
    }
    this.entityTasks.delete(entityId);
  }

  /**
   * Xử lý khi bước thực hiện công việc thất bại (ví dụ: không tìm được đường A*, bị chặn trên đảo)
   */
  public failEntityTask(world: ECSWorld, entityId: number, reason: string): void {
    const taskId = this.entityTasks.get(entityId);
    if (!taskId) return;

    const task = this.tasks.get(taskId);
    if (!task) {
      this.entityTasks.delete(entityId);
      return;
    }

    task.failureCount = (task.failureCount ?? 0) + 1;

    // Nếu là task sáng lập hoặc task đã thất bại đường đi -> Hủy task và hoàn trả tài nguyên ngay lập tức
    if (
      task.foundingIntentId ||
      task.type === 'found_campfire' ||
      task.type === 'found_sect_hall' ||
      task.costReserved ||
      task.failureCount >= 2
    ) {
      this.cancelTask(world, taskId, reason);
    } else {
      this.releaseTask(entityId);
    }
  }

  /**
   * Hủy hoàn toàn một công việc cộng đồng và hoàn trả tài nguyên đã tạm giữ đúng 1 lần
   */
  public cancelTask(world: ECSWorld, taskId: string, reason: string = 'Công việc bị hủy'): boolean {
    const task = this.tasks.get(taskId);
    if (!task) return false;

    // Nếu có công trình đang thi công gắn với task -> Hủy công trình và hoàn trả
    if (task.targetEntityId !== undefined && world) {
      const bComp = world.getComponent(task.targetEntityId, BuildingComponent);
      if (bComp && bComp.isUnderConstruction) {
        FactionFactory.cancelConstruction(world, task.targetEntityId, task.payerFactionId);
        task.costReserved = false;
      }
    }

    // Hoàn trả tài nguyên tạm giữ đúng 1 lần nếu chưa được hoàn bởi cancelConstruction
    if (task.costReserved && task.payerFactionId && task.reservedCost) {
      FactionFactory.refundReservedResources(world, task.payerFactionId, task.reservedCost);
      task.costReserved = false;
    }

    if (task.assignedEntityId !== null) {
      this.entityTasks.delete(task.assignedEntityId);
      task.assignedEntityId = null;
    }

    // Nếu là công việc sáng lập thôn/tông môn -> Hủy luôn FoundingIntentComponent trên founder
    if (task.founderEntityId !== undefined) {
      const intent = world.getComponent(task.founderEntityId, FoundingIntentComponent);
      if (intent) {
        intent.stage = 'cancelled';
        intent.cancelReason = reason;
        world.removeComponent(task.founderEntityId, FoundingIntentComponent);
      }
    }

    if (task.type === 'chop_wood' && task.targetEntityId !== undefined && world) {
      const pComp = world.getComponent(task.targetEntityId, PlantComponent);
      if (pComp) {
        pComp.reservedWood = Math.max(0, pComp.reservedWood - (task.woodReserved ?? 0));
      }
    }

    this.tasks.delete(taskId);
    return true;
  }

  /**
   * Hoàn thành công việc cộng đồng và thi công kiến trúc nếu là công việc xây dựng
   */
  public completeTask(world: ECSWorld, entityId: number, taskId: string): void {
    const task = this.tasks.get(taskId);
    if (!task || task.assignedEntityId !== entityId) return;

    const buildingType = TASK_TO_BUILDING_TYPE[task.type];
    if (buildingType) {
      const site = task.targetEntityId !== undefined
        ? world.getComponent(task.targetEntityId, ConstructionSiteComponent)
        : undefined;
      if (!site || !site.isCompleted) return;
    }

    // Kiểm tra lại ngay trước khi commit: nhóm có thể thay đổi giữa hai lượt AI.
    if (task.type === 'found_campfire' || task.type === 'found_sect_hall') {
      const founderId = task.founderEntityId ?? entityId;
      const intent = world.getComponent(founderId, FoundingIntentComponent);
      const rebuild = !intent && !task.foundingIntentId && task.payerFactionId &&
        FactionFactory.findFactionEntity(world, task.payerFactionId) !== null;
      if (!rebuild) {
        const isHamlet = task.type === 'found_campfire';
        const participants = [...(intent?.participantIds ?? [])].filter(id => {
          if (!FactionFactory.isBeingSociallyEligible(world, id)) return false;
          const member = world.getComponent(id, MemberComponent);
          if (isHamlet) return !member && !world.hasComponent(id, ResidenceComponent);
          const fEnt = member ? FactionFactory.findFactionEntity(world, member.factionId) : null;
          const faction = fEnt !== null ? world.getComponent(fEnt, FactionComponent) : undefined;
          return !faction || (!isCultivationFactionType(faction.type) &&
            (id === founderId || faction.leaderEntityId !== id));
        });
        const realm = world.getComponent(founderId, RealmComponent);
        const race = world.getComponent(founderId, RaceComponent);
        const founderQualified = isHamlet || (realm && race &&
          getNormalizedCultivationTier(race.raceId, realm.stageIndex, realm.combatPower) >=
            FACTION_PROGRESSION_CONFIG.sect.minFounderNormalizedTier &&
          world.hasComponent(founderId, CultivationTechniqueComponent));
        const minimum = isHamlet ? FACTION_PROGRESSION_CONFIG.hamlet.minFounders :
          1 + FACTION_PROGRESSION_CONFIG.sect.minFollowers;
        if (!intent || intent.taskId !== task.id ||
            intent.intentType !== (isHamlet ? 'hamlet' : 'sect') ||
            !founderQualified || !participants.includes(founderId) || participants.length < minimum) {
          this.cancelTask(world, task.id, 'Nhóm sáng lập không còn đủ điều kiện');
          return;
        }
        intent.participantIds = new Set(participants);
      }
    }

    const smartObjects = SmartObjectManager.getInstance();

    // Tiêu thụ tài nguyên đã tạm giữ đúng 1 lần (nếu không ủy thác cho ConstructionSiteComponent / completeBuilding)
    const hasSiteComponent =
      task.targetEntityId !== undefined &&
      world.hasComponent(task.targetEntityId, ConstructionSiteComponent);

    if (!hasSiteComponent && task.costReserved && task.payerFactionId && task.reservedCost) {
      FactionFactory.consumeReservedResources(world, task.payerFactionId, task.reservedCost);
      task.costReserved = false;
    } else if (hasSiteComponent) {
      task.costReserved = false;
    }

    // Xác định thế lực/điểm định cư sở hữu công trình (TUYỆT ĐỐI KHÔNG fallback sang factions[0])
    let ownerFactionId: string | undefined = task.payerFactionId;
    let settlementId: string | undefined = task.settlementId;

    if (!ownerFactionId && settlementId) {
      const sEnt = FactionFactory.findSettlementEntity(world, settlementId);
      if (sEnt !== null) {
        const sComp = world.getComponent(sEnt, SettlementComponent);
        if (sComp && sComp.ownerFactionId) {
          ownerFactionId = sComp.ownerFactionId;
        }
      }
    }

    if (!ownerFactionId) {
      const resComp = world.getComponent(entityId, ResidenceComponent);
      if (resComp && resComp.factionId) {
        ownerFactionId = resComp.factionId;
        if (!settlementId) settlementId = resComp.settlementId;
      }
    }

    if (!ownerFactionId) {
      const memberComp = world.getComponent(entityId, MemberComponent);
      if (memberComp && memberComp.factionId) {
        ownerFactionId = memberComp.factionId;
      }
    }

    // Xử lý từng loại công việc
    if (task.type === 'found_campfire') {
      const founderId = task.founderEntityId ?? entityId;
      const intent = world.getComponent(founderId, FoundingIntentComponent);

      if (!intent && !task.foundingIntentId && task.payerFactionId && FactionFactory.findFactionEntity(world, task.payerFactionId) !== null) {
        // Đã có thế lực (ví dụ: dựng lại lửa trại cho thôn hiện hữu)
        if (task.targetEntityId !== undefined && world.hasComponent(task.targetEntityId, BuildingComponent)) {
          FactionFactory.completeBuilding(world, task.targetEntityId);
        } else {
          return;
        }
      } else {
        // Thành lập Thôn Xóm (hamlet) mới hoàn toàn
        const faction = FactionFactory.createFaction(world, {
          type: 'hamlet',
          alignment: 'neutral',
          founderEntityId: founderId
        });
        ownerFactionId = faction.factionId;

        const buildingEnt = task.targetEntityId!;
        const newSettlementId = FactionFactory.claimFoundingSite(world, buildingEnt, faction.factionId);
        FactionFactory.completeBuilding(world, buildingEnt);

        // Gán người sáng lập làm Thôn Trưởng
        FactionFactory.assignMemberToFaction(
          world,
          founderId,
          faction.factionId,
          'village_head',
          intent?.reason ?? 'Khởi dựng lửa trại lập thôn xóm'
        );
        if (newSettlementId) {
          FactionFactory.assignResidence(world, founderId, newSettlementId, faction.factionId);
        }

        // Gán các thành viên đồng hành vào thôn xóm mới
        const participantList: number[] = [founderId];
        if (intent) {
          for (const pId of intent.participantIds) {
            if (pId === founderId) continue;
            if (!FactionFactory.isBeingSociallyEligible(world, pId)) continue;
            const existingRes = world.getComponent(pId, ResidenceComponent);
            if (existingRes) continue;

            FactionFactory.assignMemberToFaction(
              world,
              pId,
              faction.factionId,
              'villager',
              'Cùng nhóm lưu dân khai hoang lập thôn'
            );
            if (newSettlementId) {
              FactionFactory.assignResidence(world, pId, newSettlementId, faction.factionId);
            }
            participantList.push(pId);
          }
          intent.stage = 'completed';
          world.removeComponent(founderId, FoundingIntentComponent);
        }

        const founderName = world.getComponent(founderId, NameComponent)?.name ?? 'Tiên Phong';
        this.eventBus.emit('chronicle:entry', {
          category: 'founding',
          message: `🏡 [${founderName}] cùng ${participantList.length} cư dân nhóm lửa khai hoang, lập nên [${faction.name}]!`,
          importance: 'high'
        });
        this.eventBus.emit('world:log', {
          type: 'hamlet_founded',
          message: `🏡 THÔN XÓM KHỞI LẬP: [${founderName}] đã dẫn dắt ${participantList.length} lưu dân dựng lửa trại lập nên [${faction.name}].`
        });
      }
      smartObjects.syncFromWorld(world);
    } else if (task.type === 'found_sect_hall') {
      const founderId = task.founderEntityId ?? entityId;
      const intent = world.getComponent(founderId, FoundingIntentComponent);

      if (!intent && !task.foundingIntentId && task.payerFactionId && FactionFactory.findFactionEntity(world, task.payerFactionId) !== null) {
        // Xây dựng đại điện cho thế lực đã tồn tại (ví dụ: kinh đô vương quốc hoặc đại điện tông môn)
        if (task.targetEntityId !== undefined && world.hasComponent(task.targetEntityId, BuildingComponent)) {
          FactionFactory.completeBuilding(world, task.targetEntityId);
        } else {
          return;
        }
      } else {
        // Thành lập Tông Môn (sect) mới
        const raceComp = world.getComponent(founderId, RaceComponent);
        const alignment = raceComp?.raceId === 'demon' ? 'demonic' : 'righteous';
        const faction = FactionFactory.createFaction(world, {
          type: 'sect',
          alignment,
          founderEntityId: founderId
        });
        ownerFactionId = faction.factionId;

        FactionFactory.claimFoundingSite(world, task.targetEntityId!, faction.factionId);
        FactionFactory.completeBuilding(world, task.targetEntityId!);

        // Kiểm tra quê quán (ResidenceComponent) của người sáng lập:
        // Tu sĩ xuất thân từ làng rời đi lập tông môn KHÔNG làm đổi chủ làng mà kết ước bảo hộ!
        const founderRes = world.getComponent(founderId, ResidenceComponent);
        const homeSettlementId = founderRes?.settlementId;
        const homeVillageFactionId = founderRes?.factionId;

        FactionFactory.assignMemberToFaction(
          world,
          founderId,
          faction.factionId,
          'sect_master',
          intent?.reason ?? 'Khai tông lập phái, truyền thừa đạo thống'
        );

        const founderTech = world.getComponent(founderId, CultivationTechniqueComponent);
        let discipleCount = 1;
        if (intent) {
          for (const pId of intent.participantIds) {
            if (pId === founderId) continue;
            if (!FactionFactory.isBeingSociallyEligible(world, pId)) continue;
            // Nhóm đã được kiểm tra trước commit; việc kế vị khi founder rời làng
            // không được làm thay đổi danh sách đồng hành giữa chừng.

            FactionFactory.assignMemberToFaction(
              world,
              pId,
              faction.factionId,
              discipleCount <= 2 ? 'inner_disciple' : 'outer_disciple',
              { reason: 'Bái nhập sơn môn ngày khai phái', preserveResidence: true }
            );
            if (founderTech && !world.hasComponent(pId, CultivationTechniqueComponent)) {
              world.addComponent(
                pId,
                new CultivationTechniqueComponent(
                  founderTech.techniqueId,
                  founderTech.techniqueName,
                  founderTech.tier,
                  founderTech.element,
                  founderTech.description,
                  'tong_mon',
                  faction.name,
                  'nhap_mon',
                  0
                )
              );
            }
            discipleCount++;
          }
          intent.stage = 'completed';
          world.removeComponent(founderId, FoundingIntentComponent);
        }

        // Thiết lập quan hệ bảo hộ (protectorate) giữa Tông Môn mới và Làng quê hương của Tổ Sư
        if (homeSettlementId && homeVillageFactionId && homeVillageFactionId !== faction.factionId) {
          const factionSys = world.getSystem('FactionSystem') as { diplomacySystem?: DiplomacySystem | null } | undefined;
          const diplomacy = (world.getSystem('DiplomacySystem') as unknown as DiplomacySystem | undefined) ?? factionSys?.diplomacySystem ?? null;
          if (diplomacy) {
            diplomacy.establishProtectorate(world, faction.factionId, homeVillageFactionId, homeSettlementId);
          } else {
            const tempDip = new DiplomacySystem();
            tempDip.establishProtectorate(world, faction.factionId, homeVillageFactionId, homeSettlementId);
          }
        }

        const founderName = world.getComponent(founderId, NameComponent)?.name ?? 'Tổ Sư';
        this.eventBus.emit('chronicle:entry', {
          category: 'founding',
          message: `🏯 [${founderName}] tụ hội ${discipleCount} môn đồ nơi linh địa, chính thức khai sáng [${faction.name}]!`,
          importance: 'high'
        });
        this.eventBus.emit('world:log', {
          type: 'sect_founded',
          message: `🏯 KHAI TÔNG LẬP PHÁI: Tổ sư [${founderName}] đã dựng Đại Điện, sáng lập [${faction.name}]!`
        });
      }
      smartObjects.syncFromWorld(world);
    } else if (task.type === 'till_mortal_farm' && ownerFactionId) {
      if (task.targetEntityId !== undefined && world.hasComponent(task.targetEntityId, BuildingComponent)) {
        FactionFactory.completeBuilding(world, task.targetEntityId);
      } else {
        return;
      }
      smartObjects.syncFromWorld(world);
    } else if (task.type === 'build_thatched_hut' && ownerFactionId) {
      if (task.targetEntityId !== undefined && world.hasComponent(task.targetEntityId, BuildingComponent)) {
        FactionFactory.completeBuilding(world, task.targetEntityId);
      } else {
        return;
      }
      smartObjects.syncFromWorld(world);
    } else if (task.type === 'dig_village_well' && ownerFactionId) {
      if (task.targetEntityId !== undefined && world.hasComponent(task.targetEntityId, BuildingComponent)) {
        FactionFactory.completeBuilding(world, task.targetEntityId);
      } else {
        return;
      }
      smartObjects.syncFromWorld(world);
    } else if (task.type === 'plant_herb_garden' && ownerFactionId) {
      if (task.targetEntityId !== undefined && world.hasComponent(task.targetEntityId, BuildingComponent)) {
        FactionFactory.completeBuilding(world, task.targetEntityId);
      } else {
        return;
      }
      smartObjects.syncFromWorld(world);
    } else if (task.type === 'build_meditation_cave' && ownerFactionId) {
      if (task.targetEntityId !== undefined && world.hasComponent(task.targetEntityId, BuildingComponent)) {
        FactionFactory.completeBuilding(world, task.targetEntityId);
      } else {
        return;
      }
      smartObjects.syncFromWorld(world);
    } else if (task.type === 'build_alchemy_chamber' && ownerFactionId) {
      if (task.targetEntityId !== undefined && world.hasComponent(task.targetEntityId, BuildingComponent)) {
        FactionFactory.completeBuilding(world, task.targetEntityId);
      } else {
        return;
      }
      smartObjects.syncFromWorld(world);
    } else if (task.type === 'build_scripture_pavilion' && ownerFactionId) {
      if (task.targetEntityId !== undefined && world.hasComponent(task.targetEntityId, BuildingComponent)) {
        FactionFactory.completeBuilding(world, task.targetEntityId);
      } else {
        return;
      }
      smartObjects.syncFromWorld(world);
    } else if (task.type === 'build_defense_array' && ownerFactionId) {
      if (task.targetEntityId !== undefined && world.hasComponent(task.targetEntityId, BuildingComponent)) {
        FactionFactory.completeBuilding(world, task.targetEntityId);
      } else {
        return;
      }
      smartObjects.syncFromWorld(world);
    } else if (task.type === 'repair_structure' && task.targetEntityId !== undefined) {
      const bComp = world.getComponent(task.targetEntityId, BuildingComponent);
      if (bComp) {
        bComp.currentDurability = bComp.maxDurability;
        bComp.isRuins = false;
      }
    } else if (task.type === 'cook_village_meal') {
      const needs = world.getComponent(entityId, MortalNeedsComponent);
      if (needs && needs.rawFoodCount >= 1) {
        needs.rawFoodCount = Math.max(0, needs.rawFoodCount - 1);
        needs.cookedMealCount += 3;
      }
      if (ownerFactionId) {
        const fEnt = FactionFactory.findFactionEntity(world, ownerFactionId);
        const fComp = fEnt !== null ? world.getComponent(fEnt, FactionComponent) : undefined;
        if (fComp) {
          fComp.foodStock += 2;
        }
      }
    }

    const isMajorResponsibility =
      task.type === 'found_campfire' ||
      task.type === 'found_sect_hall' ||
      task.type === 'build_defense_array' ||
      task.type === 'build_alchemy_chamber' ||
      task.type === 'build_meditation_cave';
    const tick = TimeManager.getInstance().getTotalTicks();

    if (isMajorResponsibility) {
      emitGrowthEvent({
        world,
        eventId: `task_resp:${task.id}:${entityId}`,
        entityId,
        kind: 'responsibility_completed',
        tick,
        familyKey: `resp:${task.type}`,
        difficulty: 1.0,
        evidence: {
          taskId: task.id,
          actualOutput: 1,
          professionDomain: task.type === 'chop_wood' ? 'chop_wood' : task.preferredJob,
          reasonText: `Hoàn thành trọng trách: ${task.title}`,
        },
      });
    } else {
      emitGrowthEvent({
        world,
        eventId: `task_work:${task.id}:${entityId}`,
        entityId,
        kind: 'work_completed',
        tick,
        familyKey: `work:${task.type}`,
        difficulty: 1.0,
        evidence: {
          taskId: task.id,
          actualOutput: 1,
          professionDomain: task.type === 'chop_wood' ? 'chop_wood' : task.preferredJob,
          reasonText: `Hoàn thành công việc cộng đồng: ${task.title}`,
        },
      });
    }

    if (task.type === 'chop_wood' && task.targetEntityId !== undefined && world) {
      const pComp = world.getComponent(task.targetEntityId, PlantComponent);
      if (pComp) {
        pComp.reservedWood = Math.max(0, pComp.reservedWood - (task.woodReserved ?? 0));
      }
    }

    this.tasks.delete(taskId);
    this.entityTasks.delete(entityId);
  }

  public getEntityTask(entityId: number): CommunityTask | undefined {
    const taskId = this.entityTasks.get(entityId);
    return taskId ? this.tasks.get(taskId) : undefined;
  }

  private hasNearbyNaturalWater(center: Point2D, worldMap: WorldMap, radiusTiles: number): boolean {
    const cx = Math.floor(center.x / worldMap.tileSize);
    const cy = Math.floor(center.y / worldMap.tileSize);
    for (let dy = -radiusTiles; dy <= radiusTiles; dy++) {
      for (let dx = -radiusTiles; dx <= radiusTiles; dx++) {
        const tx = cx + dx;
        const ty = cy + dy;
        if (!worldMap.isInBounds(tx, ty)) continue;
        const tile = worldMap.getTile(tx, ty);
        if (tile && (tile.terrain === 'river' || tile.terrain === 'lake')) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Tìm vị trí đất trống an toàn và có đường đi A* hợp lệ xung quanh tâm để dựng công trình
   */
  public findValidBuildingSpot(
    center: Point2D,
    worldMap: WorldMap,
    buildingType: BuildingType,
    preferredDist: number,
    world?: ECSWorld
  ): Point2D | null {
    const tileSize = worldMap.tileSize;
    const blockedTiles = world ? AStarPathfinder.getBlockedBuildingTiles(world, worldMap) : undefined;

    for (let attempts = 0; attempts < 16; attempts++) {
      const angle = (attempts / 16) * Math.PI * 2 + (attempts % 2) * 0.2;
      const dist = preferredDist + ((attempts % 3) - 1) * 12;
      const wx = center.x + Math.cos(angle) * dist;
      const wy = center.y + Math.sin(angle) * dist;

      const tx = Math.floor(wx / tileSize);
      const ty = Math.floor(wy / tileSize);

      if (!worldMap.isInBounds(tx, ty)) continue;
      if (!AStarPathfinder.isTileWalkable(tx, ty, worldMap, blockedTiles, false)) continue;

      const candidate: Point2D = {
        x: tx * tileSize + tileSize / 2,
        y: ty * tileSize + tileSize / 2
      };

      if (world && !validateBuildingPlacement(world, worldMap, buildingType, candidate.x, candidate.y).valid) continue;

      if (world) {
        const path = AStarPathfinder.findPath(worldMap, world, center, candidate, true);
        if (path.length === 0 && Math.hypot(candidate.x - center.x, candidate.y - center.y) > 28) {
          continue;
        }
      }

      return candidate;
    }

    return null;
  }
}
