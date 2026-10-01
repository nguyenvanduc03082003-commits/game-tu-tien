import { maintainSocialAssistance, setCombatIntent } from '../../../combat/CombatIntentService.ts';
import { performConversation } from '../../../social/SocialConversationService.ts';
import { evaluateSocialMeetingTarget } from '../../../social/SocialDecisionService.ts';
import { recordSocialPlan } from '../../../social/SocialPlanTelemetry.ts';
import { SOCIAL_CONFIG } from '../../../../config/social.config.ts';
import { ECSWorld } from '../../../../ecs/World.ts';
import { WorldMap } from '../../../world/WorldMap.ts';
import { EventBus } from '../../../../core/EventBus.ts';
import { TERRAIN_CONFIGS } from '../../../../config/terrains.config.ts';
import {
  canTraverseSlope,
  canTraverseDiagonalSlope
} from '../../../world/ElevationRules.ts';
import { getLocalSlopeMoveFactor } from '../../../world/ElevationMovement.ts';
import {
  PositionComponent,
  CharacterStateComponent,
  HealthComponent,
  HungerComponent,
  RealmComponent,
  MortalNeedsComponent,
  ChildcareComponent,
  CorpseComponent
} from '../../../beings/BeingComponents.ts';
import { CorpseAndGraveSystem } from '../../../beings/CorpseAndGraveSystem.ts';
import { MemoryComponent } from '../../../social/SocialComponents.ts';
import { CombatStatsComponent, EquipmentComponent } from '../../../combat/CombatComponents.ts';
import { PLANT_DEFINITIONS } from '../../../../config/plants.config.ts';
import { PlantComponent } from '../../../flora/PlantComponents.ts';
import { BuildingComponent, ConstructionSiteComponent, FactionComponent, InsideBuildingComponent } from '../../../factions/FactionComponents.ts';
import { FactionFactory } from '../../../factions/FactionFactory.ts';
import { InventoryComponent } from '../../../alchemy/InventoryComponent.ts';
import { PillUsageService } from '../../../alchemy/PillUsageService.ts';
import {
  AIBehaviorTreeComponent,
  AIPlannerComponent,
  PlanStep
} from '../AIComponents.ts';
import { AStarPathfinder, Point2D } from '../../pathfinding/AStar.ts';
import { SmartObjectManager } from '../../smartobjects/SmartObjectManager.ts';
import { CommunityTaskBoard } from '../../community/CommunityTaskBoard.ts';
import { TimeManager } from '../../../../core/TimeManager.ts';
import { openTreasureChest } from '../../../treasure/TreasureChest.ts';
import { emitGrowthEvent } from '../../../talent/GrowthEvents.ts';
import { completeReflectionSessionDay } from '../../../talent/MentalStateSystem.ts';
import { GrowthMindComponent } from '../../../talent/TalentComponents.ts';
import { resolveEntityTraitEffects } from '../../../traits/TraitEffectResolver.ts';
import { completeHunterHarvest, completeProfessionBatch, isAtProfessionWorkplace, professionEfficiency, professionWorkBlockedReason } from '../../../professions/ProfessionService.ts';
import { PROFESSIONS_BY_ID } from '../../../../config/professions.config.ts';

export type BTNodeStatus = 'running' | 'success' | 'failure';

/**
 * TẦNG 3: BEHAVIOR TREE & MICRO EXECUTION
 * Điều khiển vi mô: Dẫn đường A*, Né đòn chủ động (Active Dodge), tung chiêu, tương tác môi trường
 */
export class BehaviorTreeExecutor {
  private static eventBus = EventBus.getInstance();
  private static movedEntitiesThisTick: Set<number> = new Set();

  /**
   * Đặt lại danh sách thực thể đã di chuyển ở đầu mỗi nhịp tick mô phỏng
   */
  public static beginTick(): void {
    this.movedEntitiesThisTick.clear();
  }

  public static hasMovedThisTick(entity: number): boolean {
    return this.movedEntitiesThisTick.has(entity);
  }

  public static markMovedThisTick(entity: number): void {
    this.movedEntitiesThisTick.add(entity);
  }

  /**
   * Cập nhật Cây hành vi vi mô mỗi frame (dt giây)
   */
  public static tick(
    world: ECSWorld,
    entity: number,
    btComp: AIBehaviorTreeComponent,
    planner: AIPlannerComponent,
    worldMap: WorldMap,
    dt: number
  ): void {
    const pos = world.getComponent(entity, PositionComponent);
    const stateComp = world.getComponent(entity, CharacterStateComponent);
    const hp = world.getComponent(entity, HealthComponent);

    if (!pos || !stateComp || (hp && hp.isDead)) return;

    if (planner.planStatus !== 'executing') {
      stateComp.state = 'idle';
      return;
    }

    // 1. CẬP NHẬT TRẠNG THÁI NÉ ĐÒN CHỦ ĐỘNG (ACTIVE DODGE)
    if (btComp.dodgeCooldown > 0) {
      btComp.dodgeCooldown = Math.max(0, btComp.dodgeCooldown - dt);
    }

    if (btComp.isDodging) {
      btComp.dodgeTimer -= dt;
      // Di chuyển tốc hành theo hướng né
      const dodgeSpeed = pos.speed * 2.8;
      const nextX = Math.max(16, Math.min(worldMap.widthPixels - 16, pos.x + btComp.dodgeVector.x * dodgeSpeed * dt));
      const nextY = Math.max(16, Math.min(worldMap.heightPixels - 16, pos.y + btComp.dodgeVector.y * dodgeSpeed * dt));
      const blockedTiles = AStarPathfinder.getBlockedBuildingTiles(world, worldMap);
      if (AStarPathfinder.hasLineOfSight(
        worldMap, blockedTiles, { x: pos.x, y: pos.y }, { x: nextX, y: nextY },
        false, undefined, true, true
      )) {
        pos.x = nextX;
        pos.y = nextY;
        this.movedEntitiesThisTick.add(entity);
      } else {
        btComp.isDodging = false;
        btComp.dodgeTimer = 0;
        btComp.clearPath();
      }

      if (btComp.dodgeTimer <= 0) {
        btComp.isDodging = false;
      }
      return; // Khi đang né đòn thì ưu tiên hoàn tất thân pháp
    }

    // 2. NẾU KHÔNG CÓ BƯỚC KẾ HOẠCH NÀO ĐANG CHỜ
    const step = planner.getCurrentStep();
    if (!step) {
      btComp.activeNodeName = 'IdleWait';
      if (stateComp.state === 'walk') {
        stateComp.state = 'idle';
      }
      return;
    }

    // 3. THỰC THI BƯỚC HÀNH ĐỘNG VI MÔ THEO LOẠI BƯỚC
    btComp.activeNodeName = step.type;
    planner.stepElapsedTimer += dt;

    let status: BTNodeStatus = 'running';
    let socialFailureReason: string | undefined;
    const socialTarget = planner.currentPlanGoal === 'SOCIAL_RECREATE'
      ? planner.steps.slice(planner.currentStepIndex).find(item => item.customData?.socialWith !== undefined)?.customData.socialWith as number | undefined
      : undefined;
    const careForMeeting = world.getComponent(entity, ChildcareComponent);
    const guardianMeeting = socialTarget !== undefined && careForMeeting?.isChild && careForMeeting.guardianEntityId === socialTarget;
    if (socialTarget !== undefined && !guardianMeeting && (step.type === 'MOVE_TO' || step.type === 'IDLE_WAIT')) {
      const meeting = evaluateSocialMeetingTarget(world, entity, socialTarget, step.type === 'IDLE_WAIT');
      if (meeting.status === 'rejected') { status = 'failure'; socialFailureReason = meeting.reason; }
    }

    if (status !== 'failure') switch (step.type) {
      case 'MOVE_TO':
      case 'FLEE_FROM_TARGET':
        status = this.executeMoveTo(world, entity, pos, stateComp, btComp, planner, step, worldMap, dt);
        break;

      case 'ATTACK_TARGET':
        status = this.executeAttack(world, entity, pos, stateComp, btComp, step, worldMap, dt);
        break;

      case 'MEDITATE_QI':
        status = this.executeMeditate(world, entity, stateComp, planner, step, dt);
        break;

      case 'REFLECT_EXPERIENCE':
        status = this.executeReflectExperience(world, entity, stateComp, planner, step, dt);
        break;

      case 'EXECUTE_BREAKTHROUGH':
        status = this.executeBreakthrough(world, entity, stateComp, planner, step, dt);
        break;

      case 'PERFORM_WORK':
        status = this.executeWork(world, entity, stateComp, planner, step, dt, worldMap);
        break;

      case 'USE_PILL':
        status = this.executeUsePill(world, entity, planner, step);
        break;

      case 'COLLECT_RESOURCE':
        status = this.executeCollectResource(world, entity, pos, stateComp, planner, step);
        break;

      case 'INTERACT_BUILDING':
        status = this.executeInteract(world, entity, planner, step);
        break;

      case 'SLEEP_REST':
        status = this.executeSleep(world, entity, stateComp, planner, step, dt);
        break;

      case 'IDLE_WAIT':
      default:
        stateComp.state = planner.currentPlanGoal === 'SOCIAL_RECREATE' ? 'recreate' : 'idle';
        if (step.customData?.socialWith !== undefined) {
          const target = step.customData.socialWith as number;
          const targetPos = world.getComponent(target, PositionComponent);
          const targetHp = world.getComponent(target, HealthComponent);
          if (!targetPos || !targetHp || targetHp.isDead || targetHp.current <= 0 || Math.hypot(targetPos.x - pos.x, targetPos.y - pos.y) > SOCIAL_CONFIG.conversation.maxDistance) {
            socialFailureReason = !targetPos || !targetHp || targetHp.isDead || targetHp.current <= 0 ? 'participant_unavailable' : 'out_of_range';
            status = 'failure';
            break;
          }
          if (planner.stepElapsedTimer >= (step.duration ?? 2)) {
            const conversation = performConversation(world, entity, target);
            recordSocialPlan(world, entity, planner, conversation.status === 'completed' ? 'conversation_completed' : 'conversation_skipped',
              conversation.status === 'skipped' ? conversation.reason : undefined);
            const care = world.getComponent(entity, ChildcareComponent);
            const withGuardian = care?.isChild && care.guardianEntityId === target;
            if (conversation.status === 'skipped' && conversation.reason !== 'cooldown_active' && !withGuardian) {
              socialFailureReason = conversation.reason;
              status = 'failure';
              break;
            }
          }
        }
        if (planner.currentPlanGoal === 'SOCIAL_RECREATE' || planner.currentPlanGoal === 'WANDER_SERENDIPITY') {
          const needs = world.getComponent(entity, MortalNeedsComponent);
          if (needs) needs.recreation = Math.min(100, needs.recreation + (step.customData?.socialWith !== undefined ? 15 : 10) * dt);
        }
        if (planner.stepElapsedTimer >= (step.duration ?? 2.0)) {
          status = 'success';
        }
        break;
    }

    // 4. XỬ LÝ CHUYỂN BƯỚC HOẶC TÁI LẬP KẾ HOẠCH
    if (status === 'success') {
      this.onStepSucceeded(world, entity, planner, step);
      btComp.clearPath();
      planner.nextStep();
      if (planner.isPlanFinished()) {
        recordSocialPlan(world, entity, planner, 'completed');
        SmartObjectManager.getInstance().release(entity);
        CommunityTaskBoard.getInstance().releaseTask(entity);
        planner.replanCooldown = 0.2 + Math.random() * 0.3;
      }
    } else if (status === 'failure') {
      recordSocialPlan(world, entity, planner, 'failed', socialFailureReason ??
        (step.type === 'MOVE_TO' ? planner.stepElapsedTimer > 12 ? 'travel_timeout' : 'movement_failed' : 'step_failed'));
      if (planner.currentPlanGoal === 'SOCIAL_RECREATE') {
        pos.targetX = undefined;
        pos.targetY = undefined;
      }
      btComp.clearPath();
      planner.replanCooldown = 1.0 + Math.random() * 0.5;
      SmartObjectManager.getInstance().release(entity);
      CommunityTaskBoard.getInstance().failEntityTask(world, entity, `Thất bại tại bước: ${step.description}`);
      planner.failCurrentPlan(`Thất bại tại bước: ${step.description}`);
    }
  }

  // ===========================================================================
  // BỘ ĐIỀU KHIỂN DI CHUYỂN THỐNG NHẤT DÙNG A* PATHFINDING & TRÁNH VẬT CẢN
  // ===========================================================================
  public static moveEntityTowards(
    world: ECSWorld,
    entity: number,
    pos: PositionComponent,
    stateComp: CharacterStateComponent,
    dest: Point2D,
    arrivalDist: number,
    worldMap: WorldMap | null,
    dt: number,
    btComp?: AIBehaviorTreeComponent,
    ignoreEndObstacle: boolean = true
  ): BTNodeStatus {
    const distToFinal = Math.hypot(dest.x - pos.x, dest.y - pos.y);
    if (distToFinal <= arrivalDist) {
      pos.targetX = undefined;
      pos.targetY = undefined;
      btComp?.clearPath();
      stateComp.state = 'idle';
      return 'success';
    }

    if (!btComp) {
      btComp = world.getComponent(entity, AIBehaviorTreeComponent);
      if (!btComp) {
        btComp = new AIBehaviorTreeComponent();
        world.addComponent(entity, btComp);
      }
    }

    if (!worldMap) {
      const dx = dest.x - pos.x;
      const dy = dest.y - pos.y;
      const stepMove = pos.speed * dt;
      pos.x += (dx / distToFinal) * stepMove;
      pos.y += (dy / distToFinal) * stepMove;
      stateComp.state = 'walk';
      stateComp.direction = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
      this.movedEntitiesThisTick.add(entity);
      return 'running';
    }

    const tileSize = worldMap.tileSize;
    const destTileX = Math.floor(dest.x / tileSize);
    const destTileY = Math.floor(dest.y / tileSize);
    const lastDestTileX = (btComp as any)._lastDestTileX as number | undefined;
    const lastDestTileY = (btComp as any)._lastDestTileY as number | undefined;

    // Nếu mục tiêu di động đã sang ô tile khác, tính lại đường đi A*
    if (btComp.hasPath() && lastDestTileX !== undefined && lastDestTileY !== undefined) {
      if (Math.abs(destTileX - lastDestTileX) + Math.abs(destTileY - lastDestTileY) >= 1) {
        btComp.clearPath();
      }
    }

    // Nếu chưa có đường đi A* hoặc đã đi hết waypoint nhưng chưa tới đích -> Tìm đường mới
    if (!btComp.hasPath()) {
      const path = AStarPathfinder.findPath(worldMap, world, { x: pos.x, y: pos.y }, dest, ignoreEndObstacle, 1000, undefined, true, true);
      if (path.length === 0) {
        if (distToFinal <= Math.max(arrivalDist, 28) && ignoreEndObstacle) {
          btComp.clearPath();
          stateComp.state = 'idle';
          return 'success';
        }
        return 'failure';
      }
      btComp.pathWaypoints = path;
      btComp.currentWaypointIndex = 0;
      (btComp as any)._lastDestTileX = destTileX;
      (btComp as any)._lastDestTileY = destTileY;
    }

    // Lấy waypoint hiện tại
    const currWaypoint = btComp.getCurrentWaypoint();
    if (!currWaypoint) {
      if (distToFinal <= arrivalDist) {
        btComp.clearPath();
        stateComp.state = 'idle';
        return 'success';
      }
      btComp.clearPath();
      return 'failure';
    }

    const dx = currWaypoint.x - pos.x;
    const dy = currWaypoint.y - pos.y;
    const distToWp = Math.hypot(dx, dy);

    // Tính tốc độ di chuyển có xét chi phí địa hình và độ dốc cao độ
    const tx = Math.floor(pos.x / tileSize);
    const ty = Math.floor(pos.y / tileSize);
    const tile = worldMap.getTile(tx, ty);
    const terrainMod = tile ? TERRAIN_CONFIGS[tile.terrain].moveSpeedModifier : 1.0;
    const slopeMod = getLocalSlopeMoveFactor(worldMap, pos.x, pos.y, currWaypoint.x, currWaypoint.y);
    const effectiveSpeed = Math.max(4, pos.speed * terrainMod * (slopeMod > 0 ? slopeMod : 1.0));
    const stepMove = effectiveSpeed * dt;
    const blockedTiles = AStarPathfinder.getBlockedBuildingTiles(world, worldMap);

    let nextX = pos.x;
    let nextY = pos.y;
    let reachedWaypoint = false;

    if (distToWp <= Math.max(stepMove, 4)) {
      nextX = currWaypoint.x;
      nextY = currWaypoint.y;
      reachedWaypoint = true;
    } else {
      nextX = pos.x + (dx / distToWp) * stepMove;
      nextY = pos.y + (dy / distToWp) * stepMove;
    }

    const allowEndBuildingTile = ignoreEndObstacle && Math.floor(nextX / tileSize) === destTileX && Math.floor(nextY / tileSize) === destTileY;

    // Kiểm tra toàn bộ các ô cắt qua khi di chuyển (đặc biệt khi dt lớn)
    const actualStepDist = Math.hypot(nextX - pos.x, nextY - pos.y);
    const subSteps = Math.max(1, Math.ceil(actualStepDist / (tileSize * 0.5)));
    let validMove = true;
    let lastCheckTx = tx;
    let lastCheckTy = ty;

    for (let s = 1; s <= subSteps; s++) {
      const t = s / subSteps;
      const cX = pos.x + (nextX - pos.x) * t;
      const cY = pos.y + (nextY - pos.y) * t;
      const cTx = Math.floor(cX / tileSize);
      const cTy = Math.floor(cY / tileSize);

      if (cTx !== lastCheckTx || cTy !== lastCheckTy) {
        const isEnd = allowEndBuildingTile && cTx === destTileX && cTy === destTileY;
        if (!AStarPathfinder.isTileWalkable(cTx, cTy, worldMap, isEnd ? undefined : blockedTiles, false)) {
          validMove = false;
          break;
        }

        const lastTile = worldMap.getTile(lastCheckTx, lastCheckTy);
        const checkTile = worldMap.getTile(cTx, cTy);
        if (lastTile && checkTile) {
          if (!canTraverseSlope(lastTile.elevation, checkTile.elevation)) {
            validMove = false;
            break;
          }
          if (cTx !== lastCheckTx && cTy !== lastCheckTy) {
            const orth1 = worldMap.getTile(lastCheckTx, cTy);
            const orth2 = worldMap.getTile(cTx, lastCheckTy);
            if (
              !orth1 ||
              !orth2 ||
              !canTraverseDiagonalSlope(lastTile.elevation, checkTile.elevation, orth1.elevation, orth2.elevation)
            ) {
              validMove = false;
              break;
            }
          }
        }
        lastCheckTx = cTx;
        lastCheckTy = cTy;
      }
    }

    if (!validMove) {
      btComp.clearPath();
      return 'failure';
    }

    pos.x = nextX;
    pos.y = nextY;
    this.movedEntitiesThisTick.add(entity);

    if (reachedWaypoint) {
      btComp.currentWaypointIndex++;
      if (btComp.currentWaypointIndex >= btComp.pathWaypoints.length) {
        const updatedDist = Math.hypot(dest.x - pos.x, dest.y - pos.y);
        if (updatedDist <= arrivalDist) {
          btComp.clearPath();
          stateComp.state = 'idle';
          return 'success';
        } else {
          btComp.clearPath();
          stateComp.state = 'walk';
          return 'running';
        }
      }
      stateComp.state = 'walk';
    } else {
      stateComp.state = 'walk';
      if (Math.abs(dx) > Math.abs(dy)) {
        stateComp.direction = dx > 0 ? 'right' : 'left';
      } else {
        stateComp.direction = dy > 0 ? 'down' : 'up';
      }
    }

    return 'running';
  }

  private static executeMoveTo(
    world: ECSWorld,
    entity: number,
    pos: PositionComponent,
    stateComp: CharacterStateComponent,
    btComp: AIBehaviorTreeComponent,
    planner: AIPlannerComponent,
    step: PlanStep,
    worldMap: WorldMap,
    dt: number
  ): BTNodeStatus {
    let dest: Point2D | null = null;

    if (step.targetPos) {
      dest = step.targetPos;
    } else if (step.targetEntityId !== undefined && step.targetEntityId !== null) {
      const targetPos = world.getComponent(step.targetEntityId, PositionComponent);
      if (targetPos) {
        dest = { x: targetPos.x, y: targetPos.y };
      }
    }

    if (!dest) {
      return 'failure';
    }

    const distToFinal = Math.hypot(dest.x - pos.x, dest.y - pos.y);
    const arrivalDist = (step.targetEntityId !== undefined && step.targetEntityId !== null) ? 20 : 8;
    if (distToFinal <= arrivalDist) {
      pos.targetX = undefined;
      pos.targetY = undefined;
      btComp.clearPath();
      stateComp.state = 'idle';
      return 'success';
    }

    // Anti-stuck Timeout: Nếu bước di chuyển đã tốn hơn 12 giây (do kẹt tường / chướng ngại vật)
    if (planner.stepElapsedTimer > 12.0) {
      btComp.clearPath();
      stateComp.state = 'idle';
      return 'failure'; // Never execute the destination interaction after a travel timeout.
    }

    return this.moveEntityTowards(world, entity, pos, stateComp, dest, arrivalDist, worldMap, dt, btComp, true);
  }

  // ===========================================================================
  // HÀNH VI CHIẾN ĐẤU CẬN CHIẾN / TẦM XA
  // ===========================================================================
  private static executeAttack(
    world: ECSWorld,
    entity: number,
    pos: PositionComponent,
    stateComp: CharacterStateComponent,
    btComp: AIBehaviorTreeComponent,
    step: PlanStep,
    worldMap: WorldMap,
    dt: number
  ): BTNodeStatus {
    if (maintainSocialAssistance(world, entity)) return 'failure';
    const targetId = step.targetEntityId;
    if (targetId === undefined || targetId === null) return 'failure';

    const targetHp = world.getComponent(targetId, HealthComponent);
    const targetPos = world.getComponent(targetId, PositionComponent);

    if (!targetHp || targetHp.isDead || !Number.isFinite(targetHp.current) || targetHp.current <= 0 || !targetPos) {
      const stats = world.getComponent(entity, CombatStatsComponent);
      if (stats?.targetEntityId === targetId) stats.targetEntityId = null;
      return 'success'; // Kẻ địch đã chết -> Hoàn thành bước chiến đấu
    }

    const equip = world.getComponent(entity, EquipmentComponent);
    const stats = world.getComponent(entity, CombatStatsComponent);
    const range = equip ? equip.getEffectiveRange() : 22;

    const dx = targetPos.x - pos.x;
    const dy = targetPos.y - pos.y;
    const dist = Math.hypot(dx, dy);

    // Kích hoạt mục tiêu chiến đấu để đồng bộ với CombatSystem
    if (stats) {
      const planner = world.getComponent(entity, AIPlannerComponent);
      if (planner?.currentPlanGoal === 'OBEY_DECREE') {
        setCombatIntent(world, entity, targetId, 'god_decree');
      } else if (stats.targetEntityId !== targetId || !stats.combatIntent) {
        setCombatIntent(world, entity, targetId, 'autonomous');
      }
    }

    // Nếu đối phương ở ngoài tầm đánh -> Di chuyển lại gần qua bộ tìm đường A* chung
    if (dist > range) {
      const moveStatus = this.moveEntityTowards(
        world,
        entity,
        pos,
        stateComp,
        { x: targetPos.x, y: targetPos.y },
        range,
        worldMap,
        dt,
        btComp,
        false
      );
      return moveStatus === 'failure' ? 'failure' : 'running';
    }

    // Trong tầm đánh -> Giữ vững vị trí, quay mặt về phía địch và tung đòn
    btComp.clearPath();
    stateComp.direction = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');

    // Chờ cooldown đòn đánh
    if (stats && stats.currentCooldown > 0) {
      stats.currentCooldown -= dt;
      return 'running';
    }

    stateComp.state = 'attack';
    stateComp.stateTimer = 0;

    return 'running';
  }

  // ===========================================================================
  // HÀNH VI BẾ QUAN TÍCH LŨY LINH LỰC
  // ===========================================================================
  private static executeMeditate(
    _world: ECSWorld,
    _entity: number,
    stateComp: CharacterStateComponent,
    planner: AIPlannerComponent,
    step: PlanStep,
    _dt: number
  ): BTNodeStatus {
    stateComp.state = 'meditate';
    const duration = step.duration ?? 8.0;

    if (planner.stepElapsedTimer >= duration) {
      SmartObjectManager.getInstance().release(_entity);
      stateComp.state = 'idle';
      return 'success';
    }
    return 'running';
  }

  // ===========================================================================
  // HÀNH VI TĨNH TÂM SUY NGẪM & HÓA GIẢI BIẾN CỐ (Mục 11.3 & 12.3)
  // ===========================================================================
  private static executeReflectExperience(
    world: ECSWorld,
    entity: number,
    stateComp: CharacterStateComponent,
    planner: AIPlannerComponent,
    step: PlanStep,
    _dt: number
  ): BTNodeStatus {
    const combat = world.getComponent(entity, CombatStatsComponent);
    const hunger = world.getComponent(entity, HungerComponent);
    const needs = world.getComponent(entity, MortalNeedsComponent);
    const growth = world.getComponent(entity, GrowthMindComponent);

    const inCombat = Boolean(combat && combat.targetEntityId !== null);
    const urgentHunger = Boolean(hunger && hunger.current < 18);
    const urgentThirst = Boolean(needs && needs.thirst < 18);

    // Nếu bị gián đoạn bởi chiến đấu hoặc nhu cầu sinh tồn nguy cấp -> Không được tính tròn 1 ngày suy ngẫm
    if (inCombat || urgentHunger || urgentThirst || !growth) {
      if (growth) {
        for (const exp of growth.experiences) {
          exp.lockedByStep = false;
        }
      }
      stateComp.state = 'idle';
      return 'failure';
    }

    stateComp.state = 'meditate';
    const duration = step.duration ?? 1.0; // 1 ngày mô phỏng = 20 ticks = 1.0s

    if (planner.stepElapsedTimer >= duration) {
      const expId = step.customData?.experienceId as string | undefined;
      const tick = TimeManager.getInstance().getTotalTicks();
      const planRev = planner.planRevision || 1;
      const stepIdx = planner.currentStepIndex;

      completeReflectionSessionDay(world, entity, expId, tick, planRev, stepIdx);
      SmartObjectManager.getInstance().release(entity);
      stateComp.state = 'idle';
      return 'success';
    }

    return 'running';
  }

  private static onStepSucceeded(
    world: ECSWorld,
    entity: number,
    planner: AIPlannerComponent,
    step: PlanStep
  ): void {
    const planRev = planner.planRevision || 1;
    const stepIdx = planner.currentStepIndex;
    const tick = TimeManager.getInstance().getTotalTicks();

    if (step.type === 'PERFORM_WORK') {
      if (step.customData?.communityTaskId) {
        return; // CommunityTaskBoard chịu trách nhiệm phát sự kiện cho task cộng đồng
      }
      const actualOutput = step.customData?._actualOutput ?? 0;
      if (actualOutput > 0) {
        const workType = step.customData?.workType ?? step.customData?.action ?? 'general';
        emitGrowthEvent({
          world,
          eventId: `work:${entity}:r${planRev}:s${stepIdx}`,
          entityId: entity,
          kind: 'work_completed',
          tick,
          familyKey: `work:${workType}`,
          difficulty: 1.0,
          evidence: {
            planRevision: planRev,
            stepIndex: stepIdx,
            actualOutput,
            professionDomain: String(workType),
            reasonText: step.description || 'Hoàn thành lao động hữu ích',
          },
        });
      }
    } else if (step.type === 'COLLECT_RESOURCE') {
      const actualOutput = step.customData?._actualOutput ?? 0;
      if (actualOutput > 0) {
        emitGrowthEvent({
          world,
          eventId: `harvest:${entity}:r${planRev}:s${stepIdx}`,
          entityId: entity,
          kind: 'work_completed',
          tick,
          familyKey: 'work:forage',
          difficulty: 1.0,
          evidence: {
            planRevision: planRev,
            stepIndex: stepIdx,
            actualOutput,
            professionDomain: 'forage',
            reasonText: step.description || 'Thu hoạch tài nguyên thiên nhiên',
          },
        });
      }
    } else if (step.type === 'MEDITATE_QI') {
      const durationSec = Math.max(planner.stepElapsedTimer, step.duration ?? 0);
      const durationTicks = Math.round(durationSec * TimeManager.TICKS_PER_SECOND);
      if (durationTicks >= TimeManager.TICKS_PER_DAY) {
        emitGrowthEvent({
          world,
          eventId: `meditate:${entity}:r${planRev}:s${stepIdx}`,
          entityId: entity,
          kind: 'meditation_completed',
          tick,
          familyKey: 'meditate_qi',
          difficulty: 1.0,
          evidence: {
            planRevision: planRev,
            stepIndex: stepIdx,
            durationTicks,
            reasonText: step.description || 'Hoàn thành phiên bế quan thổ nạp',
          },
        });
      }
    }
  }

  // ===========================================================================
  // HÀNH VI ĐỘT PHÁ CẢNH GIỚI
  // ===========================================================================
  private static executeBreakthrough(
    world: ECSWorld,
    entity: number,
    stateComp: CharacterStateComponent,
    planner: AIPlannerComponent,
    step: PlanStep,
    _dt: number
  ): BTNodeStatus {
    const realm = world.getComponent(entity, RealmComponent);
    if (!realm) return 'failure';

    stateComp.state = 'breakthrough';
    realm.isBreakingThrough = true;

    const duration = step.duration ?? 6.0;
    if (planner.stepElapsedTimer >= duration) {
      // 1. Kích hoạt xử lý đột phá qua sự kiện
      this.eventBus.emit('cultivation:attempt_breakthrough', { entityId: entity });

      // 2. Đảm bảo trạng thái không bị kẹt vĩnh viễn
      realm.isBreakingThrough = false;
      stateComp.state = 'idle';
      SmartObjectManager.getInstance().release(entity);
      return 'success';
    }
    return 'running';
  }

  // ===========================================================================
  // HÀNH VI LAO ĐỘNG SẢN XUẤT (CÀY RUỘNG, XÂY DỰNG, NẤU NƯỚNG)
  // ===========================================================================
  private static executeWork(
    world: ECSWorld,
    entity: number,
    stateComp: CharacterStateComponent,
    planner: AIPlannerComponent,
    step: PlanStep,
    dt: number,
    worldMap: WorldMap
  ): BTNodeStatus {
    step.customData = step.customData ?? {};
    const workType = step.customData?.workType;
    const action = step.customData?.action;
    const equip = world.getComponent(entity, EquipmentComponent);
    const workSpeedFactor = resolveEntityTraitEffects(world, entity).workSpeedFactor * professionEfficiency(world, entity, String(workType));

    if (workType === 'hunt' && step.customData.carcassId !== undefined) {
      const target = world.getComponent(step.customData.carcassId, PositionComponent);
      const pos = world.getComponent(entity, PositionComponent);
      if (!pos || !target || !Number.isFinite(dt) || dt <= 0 || Math.hypot(pos.x - target.x, pos.y - target.y) > 28) return 'failure';
      stateComp.state = 'build';
      step.customData.huntingProgress = (step.customData.huntingProgress ?? 0) + dt * workSpeedFactor;
      if (step.customData.huntingProgress + 1e-9 < 3) return 'running';
      step.customData.huntingProgress = Math.max(3, step.customData.huntingProgress);
      const result = completeHunterHarvest(world, entity, step, `work:${entity}:r${planner.planRevision || 1}:s${planner.currentStepIndex}`);
      stateComp.state = 'idle';
      return result ? 'success' : 'failure';
    }

    if (step.customData.professionId) {
      const def = PROFESSIONS_BY_ID.get(step.customData.professionId);
      const workplace = step.customData.workplaceId;
      if (!def?.recipe || !Number.isFinite(dt) || dt <= 0 ||
          !isAtProfessionWorkplace(world, entity, workplace, worldMap) ||
          professionWorkBlockedReason(world, entity, def, workplace, worldMap) ||
          world.getComponent(entity, CombatStatsComponent)?.targetEntityId != null) return 'failure';
      stateComp.state = def.job === 'cook' ? 'cook' : def.job === 'farmer' ? 'farm' : 'build';
      step.customData.professionProgress = (step.customData.professionProgress ?? 0) + dt * workSpeedFactor;
      if (step.customData.professionProgress + 1e-9 < def.recipe.seconds) return 'running';
      step.customData.professionProgress = Math.max(step.customData.professionProgress, def.recipe.seconds);
      const result = completeProfessionBatch(world, entity, step, `work:${entity}:r${planner.planRevision || 1}:s${planner.currentStepIndex}`, worldMap);
      stateComp.state = 'idle';
      return result ? 'success' : 'failure';
    }

    if (action === 'bury_corpse') {
      stateComp.state = 'build';
      const duration = step.duration ?? 3.0;
      if (planner.stepElapsedTimer >= duration) {
        const corpseEnt = step.customData?.corpseEntityId;
        const burialPos = step.customData?.burialPos;
        if (corpseEnt !== undefined && burialPos) {
          CorpseAndGraveSystem.executeBurial(world, corpseEnt, entity, burialPos);
          step.customData._actualOutput = 1;
          const memComp = world.getComponent(entity, MemoryComponent);
          if (memComp) {
            memComp.addMemory('helped', 'Đã chu toàn mồ yên mả đẹp cho người thân, cầu chúc vãng sanh cực lạc...', 4, 30);
          }
        }
        stateComp.state = 'idle';
        return 'success';
      }
      return 'running';
    } else if (workType === 'build' || workType === 'repair') {
      stateComp.state = 'build';
      const efficiency = (equip?.getWorkEfficiency('build') ?? 1.0) * workSpeedFactor;
      const bEnt =
        step.customData?.buildingEnt ??
        step.targetEntityId ??
        (step.customData?.communityTaskId
          ? CommunityTaskBoard.getInstance().getTask(step.customData.communityTaskId)?.targetEntityId
          : undefined);

      if (bEnt !== undefined) {
        const siteComp = world.getComponent(bEnt, ConstructionSiteComponent);
        const bComp = world.getComponent(bEnt, BuildingComponent);

        if (siteComp && !siteComp.isCompleted) {
          const workerPos = world.getComponent(entity, PositionComponent);
          const buildingPos = world.getComponent(bEnt, PositionComponent);
          const workerHp = world.getComponent(entity, HealthComponent);
          const taskId = step.customData?.communityTaskId;
          const task = taskId ? CommunityTaskBoard.getInstance().getTask(taskId) : undefined;
          if (!workerPos || !buildingPos || !workerHp || workerHp.isDead ||
              Math.hypot(workerPos.x - buildingPos.x, workerPos.y - buildingPos.y) > 32 ||
              (taskId && (!task || task.targetEntityId !== bEnt || task.assignedEntityId !== entity))) {
            return 'failure';
          }
          const workTicks = dt * TimeManager.TICKS_PER_SECOND * efficiency;
          siteComp.completedWorkTicks += workTicks;
          siteComp.status = 'under_construction';
          step.customData._actualOutput = (step.customData._actualOutput ?? 0) + workTicks;

          if (siteComp.isCompleted) {
            if (step.customData?.communityTaskId) {
              CommunityTaskBoard.getInstance().completeTask(world, entity, step.customData.communityTaskId);
            } else {
              FactionFactory.completeBuilding(world, bEnt);
            }
            stateComp.state = 'idle';
            return 'success';
          }
        } else if (bComp && workType === 'repair') {
          const beforeDur = bComp.currentDurability;
          bComp.currentDurability = Math.min(bComp.maxDurability, bComp.currentDurability + (20 * efficiency) * dt);
          const deltaDur = Math.max(0, bComp.currentDurability - beforeDur);
          step.customData._actualOutput = (step.customData._actualOutput ?? 0) + deltaDur;
        }
      } else if (workType === 'build') {
        return 'failure';
      }
    } else if (workType === 'farm') {
      stateComp.state = 'farm';
      const efficiency = (equip?.getWorkEfficiency('farm') ?? 1.0) * workSpeedFactor;
      const needs = world.getComponent(entity, MortalNeedsComponent);
      if (needs) {
        const beforeRaw = needs.rawFoodCount;
        needs.rawFoodCount = Math.min(10, needs.rawFoodCount + (0.15 * efficiency) * dt);
        const deltaRaw = Math.max(0, needs.rawFoodCount - beforeRaw);
        step.customData._actualOutput = (step.customData._actualOutput ?? 0) + deltaRaw;
      }
    } else if (workType === 'practice_martial') {
      stateComp.state = 'attack';
      stateComp.stateTimer += dt;
      step.customData._actualOutput = (step.customData._actualOutput ?? 0) + dt;
    } else if (workType === 'graze') {
      stateComp.state = 'idle';
      const hunger = world.getComponent(entity, HungerComponent);
      if (hunger) {
        hunger.current = Math.min(100, hunger.current + 8 * dt);
      }
    } else if (workType === 'forage') {
      stateComp.state = 'farm';
      const needs = world.getComponent(entity, MortalNeedsComponent);
      if (needs && planner.stepElapsedTimer >= (step.duration ?? 4)) {
        const beforeRaw = needs.rawFoodCount;
        needs.rawFoodCount = Math.min(10, needs.rawFoodCount + 2);
        step.customData._actualOutput = Math.max(0, needs.rawFoodCount - beforeRaw);
      }
    } else if (workType === 'chop_wood') {
      stateComp.state = 'attack';
      const efficiency = (equip?.getWorkEfficiency('build') ?? 1.0) * workSpeedFactor;
      const treeEnt =
        step.targetEntityId ??
        step.customData?.treeEnt ??
        (step.customData?.communityTaskId
          ? CommunityTaskBoard.getInstance().getTask(step.customData.communityTaskId)?.targetEntityId
          : undefined);

      if (treeEnt !== undefined) {
        const pComp = world.getComponent(treeEnt, PlantComponent);
        const taskId = step.customData?.communityTaskId;
        const task = taskId ? CommunityTaskBoard.getInstance().getTask(taskId) : undefined;
        if (pComp && pComp.woodRemaining > 0 && task?.type === 'chop_wood' &&
            task.targetEntityId === treeEnt && task.assignedEntityId === entity &&
            (task.woodReserved ?? 0) > 0) {
          const harvestRate = 2.5 * efficiency;
          const actualHarvest = Math.min(pComp.woodRemaining, task.woodReserved!, harvestRate * dt);
          if (actualHarvest > 0) {
            pComp.woodRemaining = Math.max(0, pComp.woodRemaining - actualHarvest);
            task.woodReserved = Math.max(0, task.woodReserved! - actualHarvest);
            pComp.reservedWood = Math.max(0, pComp.reservedWood - actualHarvest);
            step.customData._actualOutput = (step.customData._actualOutput ?? 0) + actualHarvest;

            const payerId = task.payerFactionId;
            if (payerId) {
              const fEnt = FactionFactory.findFactionEntity(world, payerId);
              const fComp = fEnt !== null ? world.getComponent(fEnt, FactionComponent) : undefined;
              if (fComp) {
                fComp.woodStock += actualHarvest;
              }
            }

            if (pComp.woodRemaining <= 0) {
              pComp.woodRemaining = 0;
              pComp.woodRegrowDaysRemaining = PLANT_DEFINITIONS[pComp.speciesId]?.woodRegrowDays ?? 15;
            }
          }
        }
      }
    } else if (workType === 'cook') {
      stateComp.state = 'cook';
      const needs = world.getComponent(entity, MortalNeedsComponent);
      if (needs && !step.customData?.communityTaskId && needs.rawFoodCount >= 1 && planner.stepElapsedTimer >= (step.duration ?? 4)) {
        needs.rawFoodCount--;
        needs.cookedMealCount += 2;
        step.customData._actualOutput = 2;
      }
    }

    const duration = step.duration ?? 4.0;
    if (planner.stepElapsedTimer >= duration) {
      // Hoàn thành công việc cộng đồng trên Bảng Việc (nếu không phải công trường chưa xong)
      if (step.customData?.communityTaskId) {
        const t = CommunityTaskBoard.getInstance().getTask(step.customData.communityTaskId);
        const sComp = t?.targetEntityId !== undefined ? world.getComponent(t.targetEntityId, ConstructionSiteComponent) : undefined;
        if (t?.targetEntityId !== undefined && sComp && !sComp.isCompleted) return 'running';
        if (t && t.targetEntityId === undefined && t.type.startsWith('build_')) return 'failure';
        if (!sComp || sComp.isCompleted) {
          CommunityTaskBoard.getInstance().completeTask(world, entity, step.customData.communityTaskId);
        }
      }
      // Giải phóng đặt chỗ Smart Object (nếu có)
      if (step.customData?.smartObjectId) {
        SmartObjectManager.getInstance().release(entity);
      }
      stateComp.state = 'idle';
      return 'success';
    }
    return 'running';
  }

  // ===========================================================================
  // HÀNH VI DÙNG ĐAN DƯỢC
  // ===========================================================================
  private static executeUsePill(
    world: ECSWorld,
    entity: number,
    _planner: AIPlannerComponent,
    _step: PlanStep
  ): BTNodeStatus {
    const inv = world.getComponent(entity, InventoryComponent);
    if (!inv || inv.pills.size === 0) return 'success';

    // Tìm viên đan dược trong túi có thể sử dụng và thỏa mãn điều kiện hiệu lực
    for (const pillId of inv.pills.keys()) {
      const check = PillUsageService.canUsePill(world, entity, pillId);
      if (check.canUse) {
        const res = PillUsageService.usePill(world, entity, pillId);
        if (res.success && res.pill) {
          this.eventBus.emit('activity:feedback', {
            entityId: entity,
            text: `Uống [${res.pill.name}] 💊`,
            color: '#a855f7'
          });
          return 'success';
        }
      }
    }

    return 'success';
  }

  // ===========================================================================
  // HÀNH VI THU HOẠCH QUẢ RỪNG / THẢO DƯỢC / BẾ THI HÀI
  // ===========================================================================
  private static executeCollectResource(
    world: ECSWorld,
    entity: number,
    _pos: PositionComponent,
    stateComp: CharacterStateComponent,
    _planner: AIPlannerComponent,
    step: PlanStep
  ): BTNodeStatus {
    if (step.customData?.action === 'open_chest') {
      const result = step.targetEntityId !== undefined
        ? openTreasureChest(world, step.targetEntityId, entity)
        : { success: false, reason: 'Không thấy rương' };
      stateComp.state = 'idle';
      return result.success ? 'success' : 'failure';
    }
    if (step.customData?.action === 'pickup_corpse') {
      const corpseEnt = step.targetEntityId;
      if (corpseEnt !== undefined) {
        const corpse = world.getComponent(corpseEnt, CorpseComponent);
        if (corpse) {
          corpse.isBeingCarried = true;
          corpse.carriedByEntityId = entity;
          this.eventBus.emit('activity:feedback', {
            entityId: entity,
            text: `Bế Thi Hài [${corpse.deceasedName}] 🕊️`,
            color: '#c084fc'
          });
        }
      }
      stateComp.state = 'idle';
      return 'success';
    }

    const plantEnt = step.targetEntityId;
    if (plantEnt === undefined) return 'failure';

    const pComp = world.getComponent(plantEnt, PlantComponent);
    const hunger = world.getComponent(entity, HungerComponent);
    const needs = world.getComponent(entity, MortalNeedsComponent);
    const equip = world.getComponent(entity, EquipmentComponent);

    if (pComp && pComp.hasFruit) {
      pComp.hasFruit = false; // Thu hái nguyên tử
      const def = PLANT_DEFINITIONS[pComp.speciesId];
      pComp.fruitRegrowDaysRemaining = def?.fruitRegrowDays ?? 4;
      const baseYield = def?.fruitYield ?? 2;
      const yieldBonus = equip?.getHarvestYieldBonus('forage') ?? 0;
      const totalYield = baseYield + yieldBonus;
      step.customData = step.customData ?? {};
      step.customData._actualOutput = totalYield;
      if (needs) needs.rawFoodCount = Math.min(10, needs.rawFoodCount + totalYield);
      if (hunger) hunger.current = Math.min(100, hunger.current + 35);

      const toolBadge = equip?.workTool ? `${equip.workTool.badge} ` : '';
      this.eventBus.emit('activity:feedback', {
        entityId: entity,
        text: `+${totalYield} ${toolBadge}${def?.name ?? 'Linh Quả'} 🍓`,
        color: '#69db7c'
      });
      stateComp.state = 'idle';
      return 'success';
    } else {
      // Cây không có quả hoặc đã bị người khác hái trước đó -> thất bại nguyên tử
      stateComp.state = 'idle';
      return 'failure';
    }
  }

  // ===========================================================================
  // HÀNH VI TƯƠNG TÁC CÔNG TRÌNH (UỐNG NƯỚC, DÙNG BỮA)
  // ===========================================================================
  private static executeInteract(
    world: ECSWorld,
    entity: number,
    _planner: AIPlannerComponent,
    step: PlanStep
  ): BTNodeStatus {
    const action = step.customData?.action;
    const needs = world.getComponent(entity, MortalNeedsComponent);
    const hunger = world.getComponent(entity, HungerComponent);

    if (action === 'drink_well' && needs) {
      needs.thirst = 100;
      this.eventBus.emit('activity:feedback', {
        entityId: entity,
        text: 'Nước Giếng Ngọt Mát 🪣',
        color: '#38bdf8'
      });
    } else if (action === 'drink_river' && needs) {
      needs.thirst = 100;
      const isLake = step.customData?.terrain === 'lake';
      this.eventBus.emit('activity:feedback', {
        entityId: entity,
        text: isLake ? 'Nước Hồ Trong Vắt 🪷💧' : 'Nước Sông Mát Lạnh 🌊💧',
        color: '#38bdf8'
      });
    } else if (action === 'drink_dew' && needs) {
      needs.thirst = Math.min(100, needs.thirst + 45);
      this.eventBus.emit('activity:feedback', {
        entityId: entity,
        text: 'Uống Sương Sớm 🌿💧',
        color: '#74c0fc'
      });
    } else if (action === 'eat_raw' && needs && hunger) {
      if (needs.rawFoodCount < 1) return 'failure';
      needs.rawFoodCount--;
      hunger.current = Math.min(100, hunger.current + 35);
    } else if (action === 'eat_meal' && needs && hunger) {
      if (needs.cookedMealCount < 1) return 'failure';
      needs.cookedMealCount--;
      hunger.current = Math.min(100, hunger.current + 70);
      needs.recreation = Math.min(100, needs.recreation + 20);
      this.eventBus.emit('activity:feedback', {
        entityId: entity,
        text: 'Cơm Canh Ấm Nóng 🍚✨',
        color: '#facc15'
      });
    }

    if (step.customData?.smartObjectId) {
      SmartObjectManager.getInstance().release(entity);
    }

    return 'success';
  }

  // ===========================================================================
  // HÀNH VI NGỦ NGHỈ
  // ===========================================================================
  private static executeSleep(
    world: ECSWorld,
    entity: number,
    stateComp: CharacterStateComponent,
    planner: AIPlannerComponent,
    step: PlanStep,
    dt: number
  ): BTNodeStatus {
    stateComp.state = 'sleep';
    const needs = world.getComponent(entity, MortalNeedsComponent);
    const hp = world.getComponent(entity, HealthComponent);
    const manager = SmartObjectManager.getInstance();
    const reservation = manager.getEntityReservation(entity);
    const indoors = reservation?.affordance === 'sleep_rest' && reservation.objectId.startsWith('building_');

    const pos = world.getComponent(entity, PositionComponent);
    const buildingId = indoors ? Number(reservation!.objectId.slice('building_'.length)) : NaN;
    const buildingPos = Number.isFinite(buildingId) ? world.getComponent(buildingId, PositionComponent) : undefined;
    const building = Number.isFinite(buildingId) ? world.getComponent(buildingId, BuildingComponent) : undefined;
    if (indoors && pos && buildingPos && building && !world.hasComponent(entity, InsideBuildingComponent)) {
      pos.x = buildingPos.x + (building.widthTiles * 16) / 2;
      pos.y = buildingPos.y + (building.heightTiles * 16) / 2;
      pos.targetX = undefined;
      pos.targetY = undefined;
      world.addComponent(entity, new InsideBuildingComponent(buildingId));
    }

    if (needs) {
      needs.sleep = Math.min(100, needs.sleep + (indoors ? 15 : 8) * dt);
    }
    if (hp) {
      hp.current = Math.min(hp.max, hp.current + (indoors ? 4 : 1) * dt);
    }

    const duration = step.duration ?? 8.0;
    if (planner.stepElapsedTimer >= duration || (needs && needs.sleep >= 95)) {
      if (pos && buildingPos && building) {
        const footprintWidth = building.widthTiles * 16;
        const footprintHeight = building.heightTiles * 16;
        switch (building.doorSide) {
          case 'north': pos.x = buildingPos.x + footprintWidth / 2; pos.y = buildingPos.y - 10; break;
          case 'east': pos.x = buildingPos.x + footprintWidth + 10; pos.y = buildingPos.y + footprintHeight / 2; break;
          case 'west': pos.x = buildingPos.x - 10; pos.y = buildingPos.y + footprintHeight / 2; break;
          default: pos.x = buildingPos.x + footprintWidth / 2; pos.y = buildingPos.y + footprintHeight + 10;
        }
        world.removeComponent(entity, InsideBuildingComponent);
      }
      manager.release(entity);
      stateComp.state = 'idle';
      return 'success';
    }
    return 'running';
  }

  // ===========================================================================
  // CƠ CHẾ THÂN PHÁP NÉ ĐÒN CHỦ ĐỘNG (ACTIVE DODGE)
  // ===========================================================================
  /**
   * Kích hoạt cú lướt né đòn khi bị tấn công cận chiến hoặc đạn đạo
   * Trả về true nếu né thành công
   */
  public static tryActiveDodge(
    world: ECSWorld,
    entity: number,
    attackerPos: Point2D
  ): boolean {
    const btComp = world.getComponent(entity, AIBehaviorTreeComponent);
    const pos = world.getComponent(entity, PositionComponent);
    const stats = world.getComponent(entity, CombatStatsComponent);

    if (!btComp || !pos || btComp.dodgeCooldown > 0 || btComp.isDodging) {
      return false;
    }

    // Tỷ lệ né đòn dựa trên dodgeRate của nhân vật (mặc định 10% - 70%)
    const dodgeChance = stats ? stats.dodgeRate : 0.12;
    if (Math.random() > dodgeChance) {
      return false; // Né thất bại
    }

    // Tính vector né đòn vuông góc với đường tấn công của kẻ địch
    const dx = pos.x - attackerPos.x;
    const dy = pos.y - attackerPos.y;
    const dist = Math.max(1, Math.hypot(dx, dy));

    // Chọn ngẫu nhiên lướt sang trái hoặc sang phải của hướng tấn công
    const sign = Math.random() < 0.5 ? 1 : -1;
    btComp.dodgeVector = {
      x: (-dy / dist) * sign,
      y: (dx / dist) * sign
    };

    btComp.isDodging = true;
    btComp.dodgeTimer = 0.18; // Lướt trong 0.18 giây
    btComp.dodgeCooldown = 2.2; // Cooldown 2.2 giây

    this.eventBus.emit('combat:floating_text', {
      entityId: entity,
      text: 'Thân Pháp Né Đòn! 💨',
      color: '#38bdf8',
      isCrit: true
    });

    this.eventBus.emit('combat:slash_vfx', {
      x: pos.x,
      y: pos.y,
      angle: Math.atan2(btComp.dodgeVector.y, btComp.dodgeVector.x),
      color: '#7dd3fc'
    });

    return true; // Né thành công!
  }
}
