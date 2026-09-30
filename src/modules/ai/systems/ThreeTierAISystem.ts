import { System } from '../../../ecs/System.ts';
import { ECSWorld } from '../../../ecs/World.ts';
import { WorldMap } from '../../world/WorldMap.ts';
import { QiGrid } from '../../energy/QiGrid.ts';
import { TimeManager } from '../../../core/TimeManager.ts';
import { EventBus } from '../../../core/EventBus.ts';
import { WeatherType } from '../../../config/weather.config.ts';
import { SpatialGrid } from '../../../core/SpatialGrid.ts';
import {
  PositionComponent,
  HealthComponent,
  CharacterStateComponent,
  SpiritualRootComponent,
  CultivationTechniqueComponent,
  TraitsComponent,
  LifespanComponent,
  CharacterHistoryComponent
} from '../../beings/BeingComponents.ts';
import {
  AIStrategicBrainComponent,
  AIPlannerComponent,
  AIBehaviorTreeComponent,
  GodDecreeData
} from '../brain/AIComponents.ts';
import { StrategicGoalEvaluator } from '../brain/goals/StrategicGoal.ts';
import { AIPlanner } from '../brain/planner/AIPlanner.ts';
import { BehaviorTreeExecutor } from '../brain/behavior/BehaviorTree.ts';
import { BuildingComponent, InsideBuildingComponent } from '../../factions/FactionComponents.ts';
import { AStarPathfinder } from '../pathfinding/AStar.ts';
import { CommunityTaskBoard } from '../community/CommunityTaskBoard.ts';
import { getRandomSerendipityTechnique } from '../../../config/techniques.config.ts';

/**
 * HỆ THỐNG ĐIỀU PHỐI BỘ NÃO AI 3 TẦNG (THREE-TIER AI SYSTEM)
 * Tối ưu hóa hiệu năng cao cho 100 - 1.000+ Cư Dân:
 * - Time-Slicing: Phân mảnh 8 nhóm so le, tránh nghẽn CPU định kỳ.
 * - Replan Throttling: Giới hạn tối đa 6 lượt lập kế hoạch mới mỗi frame + tôn trọng replanCooldown.
 * - Pathfinding Budget Queue: Reset ngân sách A* mỗi nhịp.
 * - Community Task Board & Smart Objects: Tự động phân phối việc làng và giải phóng vị trí.
 */
export class ThreeTierAISystem implements System {
  public name = 'ThreeTierAISystem';
  public enabled = true;
  public priority = 19; // Chạy trước Cultivation và Combat để chuẩn bị vị trí & hành vi

  public spatialGrid: SpatialGrid | null = null;

  private worldMap: WorldMap;
  private qiGrid: QiGrid;
  private timeManager = TimeManager.getInstance();
  private eventBus = EventBus.getInstance();
  private tickCount: number = 0;
  private pendingDecrees = new Map<number, GodDecreeData>();
  private unsubscribes: (() => void)[] = [];

  constructor(worldMap: WorldMap, qiGrid: QiGrid) {
    this.worldMap = worldMap;
    this.qiGrid = qiGrid;

    // Lắng nghe sự kiện Thượng Đế giáng thánh chỉ
    this.unsubscribes.push(
      this.eventBus.on<{ entityId: number; decree: GodDecreeData }>('god:issue_decree', (data) => {
        this.pendingDecrees.set(data.entityId, data.decree);
      })
    );
  }

  public destroy(): void {
    for (const unsub of this.unsubscribes) unsub();
    this.unsubscribes = [];
  }

  /**
   * Đặt lại toàn bộ hàng đợi thánh chỉ và bộ đếm tick của AI.
   * Ngăn chặn thánh chỉ cũ của thế giới trước thi hành lên thực thể mới trùng ID.
   */
  public reset(): void {
    this.pendingDecrees.clear();
    this.tickCount = 0;
  }

  public getPendingDecreesCount(): number {
    return this.pendingDecrees.size;
  }

  public update(world: ECSWorld, dt: number): void {
    this.tickCount++;

    // 0. RESET HẠN NGẠCH TÌM ĐƯỜNG, BỘ ĐẾM DI CHUYỂN TICK VÀ CẬP NHẬT BẢNG VIỆC CỘNG ĐỒNG
    BehaviorTreeExecutor.beginTick();
    AStarPathfinder.resetTickBudget();
    CommunityTaskBoard.getInstance().update(world, this.worldMap, dt);

    // 0B. XỬ LÝ THÁNH CHỈ VỪA NHẬN TỪ THƯỢNG ĐẾ
    for (const [entityId, decree] of this.pendingDecrees) {

      const brain = world.getComponent(entityId, AIStrategicBrainComponent);
      const planner = world.getComponent(entityId, AIPlannerComponent);
      const bt = world.getComponent(entityId, AIBehaviorTreeComponent);

      if (brain && planner && bt) {
        brain.activeDecree = decree;
        brain.utilityScores.OBEY_DECREE = 100;
        brain.currentGoal = 'OBEY_DECREE';
        bt.clearPath();
        AIPlanner.planForGoal(world, entityId, 'OBEY_DECREE', brain, planner, this.worldMap, this.qiGrid, this.spatialGrid);

        this.eventBus.emit('combat:floating_text', {
          entityId,
          text: 'Phụng Mệnh Thần Linh! 📜✨',
          color: '#ffd700',
          isCrit: true
        });
      }
    }

    this.pendingDecrees.clear();

    // =========================================================================
    // 1. TẦNG 1: ĐÁNH GIÁ CHIẾN LƯỢC SO LE (TIME-SLICING: 1/8 THỰC THỂ MỖI TICK)
    // Giữ CPU phẳng lì, không có lag spike khi có 100 - 1.000 cư dân!
    // =========================================================================
    const date = this.timeManager.getDate();
    const timeOfDay = date.timeOfDay;
    const currentWeather = (typeof window !== 'undefined' ? (window as any)._currentWeather : undefined) ?? WeatherType.CLEAR;

    const thinkers = world.query([PositionComponent, AIStrategicBrainComponent, AIPlannerComponent]);
    const SLICE_COUNT = 8;
    const currentSlice = this.tickCount % SLICE_COUNT;

    for (let i = 0; i < thinkers.length; i++) {
      const ent = thinkers[i];
      if (world.hasComponent(ent, InsideBuildingComponent)) continue;
      // Time-slicing: chỉ 1/8 số entity được đánh giá utility trong tick này
      if (ent % SLICE_COUNT !== currentSlice) continue;

      const hp = world.getComponent(ent, HealthComponent);
      if (hp && hp.isDead) continue;

      const brain = world.getComponent(ent, AIStrategicBrainComponent)!;

      // Đánh giá lại Utility Scores
      StrategicGoalEvaluator.evaluate(world, ent, brain, this.worldMap, this.qiGrid, currentWeather, timeOfDay);

      // Kiểm tra cơ duyên kỳ ngộ khi du ngoạn
      this.checkSerendipityEncounter(world, ent, dt * SLICE_COUNT);
    }

    // =========================================================================
    // 2. TẦNG 2: PHÂN RÃ & TÁI LẬP KẾ HOẠCH CÓ KIỂM SOÁT HẠN NGẠCH (THROTTLED & ROUND-ROBIN)
    // Tối đa 24 thực thể được lập kế hoạch mới mỗi tick + quét vòng tròn chống đói tài nguyên (anti-starvation)
    // =========================================================================
    let replansDone = 0;
    const MAX_REPLANS_PER_TICK = 24;
    const numThinkers = thinkers.length;
    const startIndex = numThinkers > 0 ? (this.tickCount * 17) % numThinkers : 0;

    for (let step = 0; step < numThinkers; step++) {
      const idx = (startIndex + step) % numThinkers;
      const ent = thinkers[idx];
      if (world.hasComponent(ent, InsideBuildingComponent)) continue;
      const hp = world.getComponent(ent, HealthComponent);
      if (hp && hp.isDead) continue;

      const brain = world.getComponent(ent, AIStrategicBrainComponent)!;
      const planner = world.getComponent(ent, AIPlannerComponent)!;

      // Giảm dần thời gian chờ replanCooldown
      const urgentGoalChanged = brain.currentGoal !== planner.currentPlanGoal &&
        ['SURVIVE_VITAL', 'FLEE_DANGER', 'COMBAT_DEFENSE', 'OBEY_DECREE'].includes(brain.currentGoal);
      if (planner.replanCooldown > 0 && !urgentGoalChanged) {
        planner.replanCooldown = Math.max(0, planner.replanCooldown - dt);
        continue;
      }

      const goalChanged = brain.currentGoal !== planner.currentPlanGoal;
      const planFinished = planner.isPlanFinished();
      const isUninitialized = planner.steps.length === 0;
      const replanNeeded = planner.replanRequested || isUninitialized || planner.planStatus === 'idle' || planner.planStatus === 'failed';

      if (goalChanged || planFinished || replanNeeded) {
        // Thực thể chưa từng có bước hành động nào (vừa khởi tạo) được ưu tiên lập kế hoạch ngay
        if (replansDone >= MAX_REPLANS_PER_TICK) {
          continue;
        }

        replansDone++;
        const bt = world.getComponent(ent, AIBehaviorTreeComponent);
        if (bt) bt.clearPath();
        AIPlanner.planForGoal(world, ent, brain.currentGoal, brain, planner, this.worldMap, this.qiGrid, this.spatialGrid);
      }
    }

    // =========================================================================
    // 3. TẦNG 3: BEHAVIOR TREE & VI MÔ (A* & NÉ ĐÒN) CẬP NHẬT MỖI FRAME
    // =========================================================================
    const actors = world.query([PositionComponent, AIBehaviorTreeComponent, AIPlannerComponent, CharacterStateComponent]);

    for (let i = 0; i < actors.length; i++) {
      const ent = actors[i];
      const hp = world.getComponent(ent, HealthComponent);
      if (hp && hp.isDead) continue;

      const btComp = world.getComponent(ent, AIBehaviorTreeComponent)!;
      const planner = world.getComponent(ent, AIPlannerComponent)!;
      if (world.hasComponent(ent, InsideBuildingComponent) && planner.getCurrentStep()?.type !== 'SLEEP_REST') {
        const inside = world.getComponent(ent, InsideBuildingComponent)!;
        const pos = world.getComponent(ent, PositionComponent)!;
        const buildingPos = world.getComponent(inside.buildingEntityId, PositionComponent);
        const building = world.getComponent(inside.buildingEntityId, BuildingComponent);
        if (buildingPos && building) {
          pos.x = buildingPos.x + building.widthTiles * 8;
          pos.y = buildingPos.y + building.heightTiles * 16 + 10;
        }
        world.removeComponent(ent, InsideBuildingComponent);
        continue;
      }

      BehaviorTreeExecutor.tick(world, ent, btComp, planner, this.worldMap, dt);
    }

    // Đồng bộ SpatialGrid ngay sau khi AI di chuyển để các hệ thống cùng tick (Diplomacy, Combat, Social) đọc đúng vị trí mới
    if (this.spatialGrid) {
      const positioned = world.query([PositionComponent]);
      const spatialItems = [];
      for (let i = 0; i < positioned.length; i++) {
        const ent = positioned[i];
        if (world.hasComponent(ent, InsideBuildingComponent)) continue;
        const pos = world.getComponent(ent, PositionComponent)!;
        spatialItems.push({ id: ent, x: pos.x, y: pos.y });
      }
      this.spatialGrid.rebuild(spatialItems);
    }
  }

  /**
   * Kiểm tra cơ duyên kỳ ngộ khi du ngoạn
   */
  private checkSerendipityEncounter(world: ECSWorld, ent: number, stepTime: number): void {
    const root = world.getComponent(ent, SpiritualRootComponent);
    if (root && !root.canCultivate()) return;

    const stateComp = world.getComponent(ent, CharacterStateComponent);
    if (!stateComp) return;

    const validStates = ['walk', 'meditate', 'recreate', 'farm'];
    if (!validStates.includes(stateComp.state)) return;

    const techComp = world.getComponent(ent, CultivationTechniqueComponent);
    const traits = world.getComponent(ent, TraitsComponent);

    let chance = (techComp ? 0.0008 : 0.004) * stepTime;
    if (traits) {
      const allTraits = [...traits.innateTraits, ...traits.techniqueTraits, ...traits.trainingTraits];
      if (allTraits.includes('khi_van_chi_tu')) chance += 0.015 * stepTime;
      if (allTraits.includes('phuc_duyen_tham_hau')) chance += 0.008 * stepTime;
    }

    if (Math.random() >= chance) return;

    // Kỳ ngộ công pháp xuất hiện!
    const maxTier = (traits && traits.innateTraits.includes('khi_van_chi_tu')) ? 4 : 3;
    const foundTech = getRandomSerendipityTechnique(maxTier);
    const life = world.getComponent(ent, LifespanComponent);
    const history = world.getComponent(ent, CharacterHistoryComponent);

    if (!techComp) {
      world.addComponent(
        ent,
        new CultivationTechniqueComponent(
          foundTech.id,
          foundTech.name,
          foundTech.tier,
          foundTech.element,
          foundTech.description,
          'co_duyen',
          'Động Phủ Cổ Nhân',
          'nhap_mon',
          0
        )
      );

      if (history) {
        history.addRecord(
          life?.currentAge ?? 18,
          'technique',
          `Kỳ Ngộ Đắc Đạo [${foundTech.name}]`,
          `Phát hiện bí tịch cổ trong sơn động, đốn ngộ công pháp [${foundTech.name}].`
        );
      }

      this.eventBus.emit('combat:floating_text', {
        entityId: ent,
        text: `Kỳ Ngộ: ${foundTech.name}! 🌌`,
        color: '#facc15',
        isCrit: true
      });
    }
  }
}
