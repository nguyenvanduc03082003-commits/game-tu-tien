import { isActiveBondBetween } from '../social/RelationshipRules.ts';
import { performConversation } from '../social/SocialConversationService.ts';
import { System } from '../../ecs/System.ts';
import { ECSWorld } from '../../ecs/World.ts';
import { transferProfessionStock } from '../professions/ProfessionService.ts';
import { EventBus } from '../../core/EventBus.ts';
import { TimeManager } from '../../core/TimeManager.ts';
import { SpatialGrid } from '../../core/SpatialGrid.ts';
import { WorldMap } from '../world/WorldMap.ts';
import { QiGrid } from '../energy/QiGrid.ts';
import {
  PositionComponent,
  HealthComponent,
  RealmComponent,
  NameComponent,
  CultivationTechniqueComponent,
  SpiritualRootComponent,
  TraitsComponent,
  LifespanComponent,
  CharacterHistoryComponent,
  RaceComponent,
  ComprehensionComponent,
  HungerComponent,
  MortalNeedsComponent
} from '../beings/BeingComponents.ts';
import { CombatStatsComponent } from '../combat/CombatComponents.ts';
import { SocialRelationshipComponent } from '../social/SocialComponents.ts';
import {
  AIStrategicBrainComponent,
  AIPlannerComponent
} from '../ai/brain/AIComponents.ts';
import { AStarPathfinder, Point2D } from '../ai/pathfinding/AStar.ts';
import { CommunityTaskBoard } from '../ai/community/CommunityTaskBoard.ts';
import {
  FactionComponent,
  MemberComponent,
  BuildingComponent,
  TerritoryCenterComponent,
  SettlementComponent,
  ResidenceComponent,
  FoundingIntentComponent
} from './FactionComponents.ts';
import { FactionFactory } from './FactionFactory.ts';
import { validateBuildingPlacement } from './BuildingPlacementRules.ts';
import { DiplomacySystem } from './DiplomacySystem.ts';
import {
  BUILDING_DEFINITIONS,
  FACTION_PROGRESSION_CONFIG,
  getNormalizedCultivationTier,
  isCivilFactionType,
  isCultivationFactionType
} from '../../config/factions.config.ts';
import { getTechniquesByFactionTier, TechniqueSource } from '../../config/techniques.config.ts';

export class FactionSystem implements System {
  public name = 'FactionSystem';
  public enabled = true;
  public priority = 33;

  public worldMap: WorldMap | null = null;
  public qiGrid: QiGrid | null = null;
  public spatialGrid: SpatialGrid | null = null;
  public diplomacySystem: DiplomacySystem | null = null;

  private eventBus = EventBus.getInstance();
  private checkTimer: number = 0;
  private simulatedDaysAccumulator: number = 0;
  private fallbackDiplomacy = new DiplomacySystem();

  constructor(worldMap?: WorldMap, qiGrid?: QiGrid, diplomacySystem?: DiplomacySystem) {
    if (worldMap) this.worldMap = worldMap;
    if (qiGrid) this.qiGrid = qiGrid;
    if (diplomacySystem) this.diplomacySystem = diplomacySystem;
  }

  public setContext(
    worldMap: WorldMap | null,
    qiGrid: QiGrid | null,
    diplomacySystem: DiplomacySystem | null,
    spatialGrid: SpatialGrid | null = null
  ): void {
    this.worldMap = worldMap;
    this.qiGrid = qiGrid;
    this.diplomacySystem = diplomacySystem;
    this.spatialGrid = spatialGrid;
  }

  public runAutonomousFoundingScan(world: ECSWorld, dt: number = 3.0): void {
    this.updateFoundingIntents(world, dt);
  }

  public runRecruitmentPass(world: ECSWorld, currentTotalDays: number = this.getCurrentTotalDays()): void {
    for (const fEnt of world.query([FactionComponent])) {
      const faction = world.getComponent(fEnt, FactionComponent);
      if (faction) {
        this.recruitNearbyWanderers(world, faction, currentTotalDays);
      }
    }
  }

  public evaluateAllProgressions(world: ECSWorld, elapsedDays: number = 30): void {
    this.simulatedDaysAccumulator += elapsedDays;
    const currentTotalDays = this.getCurrentTotalDays();
    for (const fEnt of world.query([FactionComponent])) {
      const faction = world.getComponent(fEnt, FactionComponent);
      if (!faction) continue;
      const aliveMembers = Array.from(faction.members).filter(mId => {
        const hp = world.getComponent(mId, HealthComponent);
        return Boolean(hp && !hp.isDead);
      });
      this.syncFactionSettlements(world, faction);
      if (isCivilFactionType(faction.type)) {
        this.updateCivilFactionProgression(world, fEnt, faction, aliveMembers, currentTotalDays, elapsedDays);
      } else {
        this.updateCultivationFactionProgression(world, fEnt, faction, aliveMembers, currentTotalDays, elapsedDays);
      }
    }
  }

  public reset(): void {
    this.checkTimer = 0;
    this.simulatedDaysAccumulator = 0;
  }

  private getDiplomacy(world: ECSWorld): DiplomacySystem {
    return this.diplomacySystem ?? world.getSystem<DiplomacySystem>('DiplomacySystem') ?? this.fallbackDiplomacy;
  }

  public getCurrentTotalDays(): number {
    const tmDays = TimeManager.getInstance().getDate().totalDays;
    return Math.max(tmDays, Math.floor(this.simulatedDaysAccumulator));
  }

  public update(world: ECSWorld, dt: number): void {
    this.simulatedDaysAccumulator += dt;
    this.checkTimer += dt;
    if (this.checkTimer < 3.0) return;
    const elapsed = this.checkTimer;
    this.checkTimer = 0;

    const currentTotalDays = this.getCurrentTotalDays();
    FactionFactory.pruneInvalidHomes(world);

    // 0. Cập nhật chu trình 6 bước tự lập Thôn Xóm & Khai Tông Lập Phái
    this.updateFoundingIntents(world, elapsed);

    const factions = world.query([FactionComponent]);

    for (const fEnt of factions) {
      const faction = world.getComponent(fEnt, FactionComponent);
      if (!faction) continue;

      // 1. Quản lý danh sách thành viên còn sống & hợp lệ
      const aliveMembers: number[] = [];
      for (const mId of faction.members) {
        const hp = world.getComponent(mId, HealthComponent);
        if (hp && !hp.isDead && FactionFactory.isBeingSociallyEligible(world, mId)) {
          aliveMembers.push(mId);
        } else if (hp && !hp.isDead && !FactionFactory.isBeingSociallyEligible(world, mId)) {
          // Loại bỏ thực thể không hợp lệ (ví dụ: động vật hoặc hài đồng bị gán nhầm)
          world.removeComponent(mId, MemberComponent);
        }
      }
      faction.members = new Set(aliveMembers);

      // Đồng bộ danh sách cư dân trong các Settlement trực thuộc
      this.syncFactionSettlements(world, faction);

      if (aliveMembers.length > 0) {
        faction.hasBeenPopulated = true;
      } else if (faction.hasBeenPopulated && aliveMembers.length === 0) {
        this.dissolveFaction(
          world,
          fEnt,
          faction,
          `Toàn bộ thành viên của [${faction.name}] đã tử nạn hoặc ly tán, cơ nghiệp hóa thành phế tích!`
        );
        continue;
      }

      // 2. Kế vị người đứng đầu (Thôn Trưởng / Trưởng Làng / Quốc Vương / Chưởng Môn)
      let leaderAlive = false;
      if (faction.leaderEntityId !== null) {
        const lHp = world.getComponent(faction.leaderEntityId, HealthComponent);
        if (lHp && !lHp.isDead && faction.members.has(faction.leaderEntityId)) {
          leaderAlive = true;
        }
      }

      if (!leaderAlive && aliveMembers.length > 0) {
        const successor = FactionFactory.electSuccessor(world, faction);
        if (successor !== null) {
          const candidateName = world.getComponent(successor, NameComponent)?.name ?? 'Vô Danh';
          const title = faction.getLeaderTitle();
          this.eventBus.emit('chronicle:entry', {
            category: 'succession',
            message: `👑 [${candidateName}] chính thức kế nhiệm ngôi vị ${title} của [${faction.name}]!`,
            importance: 'high'
          });
        }
      }

      // 3. Đánh giá Thăng Cấp / Suy Thoái / Quản Trị theo nhánh Dân Sinh hoặc Tu Luyện
      if (isCivilFactionType(faction.type)) {
        this.updateCivilFactionProgression(world, fEnt, faction, aliveMembers, currentTotalDays, elapsed);
      } else {
        this.updateCultivationFactionProgression(world, fEnt, faction, aliveMembers, currentTotalDays, elapsed);
      }

      // Nếu faction đã bị giải thể trong bước suy thoái thì bỏ qua các bước sau
      if (!world.getComponent(fEnt, FactionComponent)) continue;

      // 4. Tuyển Mộ Lưu Dân / Tán Tu bước vào lãnh thổ
      this.recruitNearbyWanderers(world, faction, currentTotalDays);

      // 5. Truyền Dạy Công Pháp (Chỉ truyền cho người có linh căn đã thức tỉnh)
      this.distributeFactionTechniques(world, faction, aliveMembers);
    }
  }

  // ===========================================================================
  // CHU TRÌNH 6 BƯỚC CƯ DÂN TỰ LẬP THÔN XÓM & TU SĨ KHAI TÔNG LẬP PHÁI
  // ===========================================================================
  public updateFoundingIntents(world: ECSWorld, dt: number): void {
    const taskBoard = CommunityTaskBoard.getInstance();
    const existingIntents = world.query([FoundingIntentComponent]);

    // Bước A: Tiến triển các FoundingIntentComponent đang hoạt động
    for (const founderId of existingIntents) {
      const intent = world.getComponent(founderId, FoundingIntentComponent);
      if (!intent) continue;

      if (!FactionFactory.isBeingSociallyEligible(world, founderId)) {
        this.cancelFoundingIntent(world, founderId, 'Người khởi xướng không còn đủ điều kiện hoặc đã tử nạn');
        continue;
      }

      intent.elapsedSeconds += dt;
      if (intent.elapsedSeconds > intent.timeoutSeconds) {
        this.cancelFoundingIntent(world, founderId, 'Quá thời gian chuẩn bị sáng lập');
        continue;
      }

      // Lọc lại danh sách đồng hành còn sống và đủ điều kiện
      const validParticipants = new Set<number>([founderId]);
      for (const pId of intent.participantIds) {
        if (FactionFactory.isBeingSociallyEligible(world, pId)) {
          validParticipants.add(pId);
        }
      }
      intent.participantIds = validParticipants;

      const minParticipants =
        intent.intentType === 'hamlet'
          ? FACTION_PROGRESSION_CONFIG.hamlet.minFounders
          : 1 + FACTION_PROGRESSION_CONFIG.sect.minFollowers;

      if (intent.participantIds.size < minParticipants) {
        this.cancelFoundingIntent(world, founderId, 'Không còn đủ đồng hành hợp lệ để sáng lập');
        continue;
      }

      if (intent.stage === 'intent') {
        intent.stage = 'gathering';
      }

      if (intent.stage === 'gathering') {
        intent.stage = 'selecting_site';
      }

      if (intent.stage === 'selecting_site') {
        const site = this.selectFoundingSite(world, founderId, intent);
        if (!site) {
          this.cancelFoundingIntent(world, founderId, 'Không tìm được địa điểm hợp lệ hoặc đường đi bị chặn');
          continue;
        }
        intent.targetPos = site;
        intent.stage = 'preparing';
      }

      if (intent.stage === 'preparing' && intent.targetPos) {
        const isHamlet = intent.intentType === 'hamlet';
        const taskType = isHamlet ? 'found_campfire' : 'found_sect_hall';
        const title = isHamlet ? '🔥 Nhóm Lửa Trại Lập Thôn' : '🏯 Khởi Dựng Tông Môn Đại Điện';
        const cost = isHamlet
          ? BUILDING_DEFINITIONS.campfire.resourceCost
          : BUILDING_DEFINITIONS.sect_hall.resourceCost;

        const task = taskBoard.createTask(
          {
            type: taskType,
            title,
            targetPos: intent.targetPos,
            preferredJob: 'builder',
            priority: 97,
            duration: isHamlet ? 3.5 : 4.5,
            foundingIntentId: `intent_${founderId}`,
            founderEntityId: founderId,
            reservedCost: cost
          },
          world
        );

        if (!task) {
          this.cancelFoundingIntent(world, founderId, 'Không đủ điều kiện tạo công việc xây dựng công trình lõi');
          continue;
        }

        taskBoard.assignTaskToEntity(task.id, founderId);
        intent.taskId = task.id;
        intent.stage = 'building';

        // Thúc đẩy AI của người sáng lập bắt tay ngay vào việc dựng công trình lõi
        const brain = world.getComponent(founderId, AIStrategicBrainComponent);
        const planner = world.getComponent(founderId, AIPlannerComponent);
        if (brain && planner) {
          const isUrgent = ['OBEY_DECREE', 'FLEE_DANGER', 'COMBAT_DEFENSE', 'SURVIVE_VITAL', 'BREAKTHROUGH'].includes(
            brain.currentGoal
          );
          if (!isUrgent) {
            brain.currentGoal = 'LABOUR_WORK';
            brain.goalReason = intent.reason;
            planner.replanRequested = true;
            planner.replanCooldown = 0;
          }
        }
      }

      if (intent.stage === 'building') {
        if (intent.taskId) {
          const activeTask = taskBoard.getTaskById(intent.taskId);
          if (!activeTask) {
            // Task đã bị hủy hoặc đã hoàn tất
            if (world.hasComponent(founderId, FoundingIntentComponent)) {
              world.removeComponent(founderId, FoundingIntentComponent);
            }
          }
        }
      }
    }

    // Bước B: Quét tìm các cụm cư dân / tu sĩ đủ điều kiện phát sinh ý định mới
    this.evaluateNewFoundingIntents(world);
  }

  public cancelFoundingIntent(world: ECSWorld, founderId: number, reason: string): void {
    const intent = world.getComponent(founderId, FoundingIntentComponent);
    if (!intent) return;

    intent.stage = 'cancelled';
    intent.cancelReason = reason;

    if (intent.taskId) {
      CommunityTaskBoard.getInstance().cancelTask(world, intent.taskId, reason);
    }

    world.removeComponent(founderId, FoundingIntentComponent);
  }

  private evaluateNewFoundingIntents(world: ECSWorld): void {
    const lockedEntities = new Set<number>();
    const activeIntents = world.query([FoundingIntentComponent]);
    for (const fId of activeIntents) {
      lockedEntities.add(fId);
      const intent = world.getComponent(fId, FoundingIntentComponent)!;
      for (const pId of intent.participantIds) {
        lockedEntities.add(pId);
      }
    }

    const beings = world.query([PositionComponent, HealthComponent, RaceComponent]);
    if (beings.length < 3) return;

    // 1. ĐÁNH GIÁ Ý ĐỊNH KHAI TÔNG LẬP PHÁI (SECT)
    const cultivatorCandidates: number[] = [];
    for (const ent of beings) {
      if (lockedEntities.has(ent)) continue;
      if (!FactionFactory.isBeingSociallyEligible(world, ent)) continue;

      const root = world.getComponent(ent, SpiritualRootComponent);
      const tech = world.getComponent(ent, CultivationTechniqueComponent);
      const realm = world.getComponent(ent, RealmComponent);
      const race = world.getComponent(ent, RaceComponent);
      if (!root || !root.canCultivate() || root.rootType === 'none' || !tech || !realm || !race) continue;

      const normTier = getNormalizedCultivationTier(race.raceId, realm.stageIndex, realm.combatPower);
      if (normTier < FACTION_PROGRESSION_CONFIG.sect.minFounderNormalizedTier) continue;

      const mem = world.getComponent(ent, MemberComponent);
      if (mem && mem.factionId) {
        const fEnt = FactionFactory.findFactionEntity(world, mem.factionId);
        const fComp = fEnt !== null ? world.getComponent(fEnt, FactionComponent) : undefined;
        if (fComp && isCultivationFactionType(fComp.type)) continue; // Đã thuộc tông môn/thánh địa
        if (fComp && fComp.leaderEntityId === ent) continue; // Đang làm trưởng làng/quốc vương
      }

      const combat = world.getComponent(ent, CombatStatsComponent);
      const hp = world.getComponent(ent, HealthComponent)!;
      if ((combat && combat.targetEntityId !== null) || hp.current < hp.max * 0.4) continue;

      cultivatorCandidates.push(ent);
    }

    cultivatorCandidates.sort((a, b) => {
      const ra = world.getComponent(a, RealmComponent)!;
      const rb = world.getComponent(b, RealmComponent)!;
      if (rb.combatPower !== ra.combatPower) return rb.combatPower - ra.combatPower;
      return a - b;
    });

    for (const founderId of cultivatorCandidates) {
      if (lockedEntities.has(founderId)) continue;
      const fPos = world.getComponent(founderId, PositionComponent)!;

      // Tìm các môn đồ đồng hành trong bán kính 260px
      const followers: number[] = [];
      for (const other of beings) {
        if (other === founderId || lockedEntities.has(other)) continue;
        if (!FactionFactory.isBeingSociallyEligible(world, other)) continue;

        const oMem = world.getComponent(other, MemberComponent);
        if (oMem && oMem.factionId) {
          const fEnt = FactionFactory.findFactionEntity(world, oMem.factionId);
          const fComp = fEnt !== null ? world.getComponent(fEnt, FactionComponent) : undefined;
          if (fComp && isCultivationFactionType(fComp.type)) continue;
          if (fComp && fComp.leaderEntityId === other) continue;
        }

        const oPos = world.getComponent(other, PositionComponent)!;
        if (Math.hypot(oPos.x - fPos.x, oPos.y - fPos.y) > 260) continue;

        // Kiểm tra thiện cảm hoặc chí hướng tu đạo
        const oRoot = world.getComponent(other, SpiritualRootComponent);
        const oRel = world.getComponent(other, SocialRelationshipComponent)?.getRelationship(founderId);
        const fRel = world.getComponent(founderId, SocialRelationshipComponent)?.getRelationship(other);
        const affinity = Math.max(oRel?.affinity ?? 0, fRel?.affinity ?? 0);
        const canCultivate = Boolean(oRoot && oRoot.canCultivate() && oRoot.rootType !== 'none');

        if (canCultivate || affinity >= 15 || !oMem) {
          followers.push(other);
        }
      }

      if (followers.length >= FACTION_PROGRESSION_CONFIG.sect.minFollowers) {
        const selectedParticipants = [founderId, ...followers];
        const intent = new FoundingIntentComponent(
          'sect',
          'intent',
          'Cảm ngộ thiên đạo, tụ hội môn đồ khai tông lập phái',
          60,
          selectedParticipants
        );
        world.addComponent(founderId, intent);

        // Chạy ngay bước chọn đất và giao việc nếu hợp lệ
        const site = this.selectFoundingSite(world, founderId, intent);
        if (!site) {
          this.cancelFoundingIntent(world, founderId, 'Không tìm được linh địa hợp lệ hoặc đường đi bị chặn');
          continue;
        }

        for (const pId of selectedParticipants) lockedEntities.add(pId);
        intent.targetPos = site;
        intent.stage = 'preparing';
        this.dispatchFoundingTaskForIntent(world, founderId, intent);
      }
    }

    // 2. ĐÁNH GIÁ Ý ĐỊNH LẬP THÔN XÓM (HAMLET) CHO NHÓM LƯU DÂN TỰ DO
    const freeMortals: number[] = [];
    const settlements = world.query([PositionComponent, SettlementComponent]);

    for (const ent of beings) {
      if (lockedEntities.has(ent)) continue;
      if (!FactionFactory.isBeingSociallyEligible(world, ent)) continue;
      if (world.hasComponent(ent, ResidenceComponent)) continue;
      if (world.hasComponent(ent, MemberComponent)) continue;

      const pos = world.getComponent(ent, PositionComponent)!;
      const hp = world.getComponent(ent, HealthComponent)!;
      const hunger = world.getComponent(ent, HungerComponent);
      const needs = world.getComponent(ent, MortalNeedsComponent);
      const combat = world.getComponent(ent, CombatStatsComponent);

      if (hp.current < hp.max * 0.35) continue;
      if (combat && combat.targetEntityId !== null) continue;
      if (hunger && hunger.current < 25) continue;
      if (needs && needs.thirst < 25) continue;

      // Không đứng trong lãnh thổ của một điểm định cư đã tồn tại
      let insideExistingSettlement = false;
      for (const sEnt of settlements) {
        const sPos = world.getComponent(sEnt, PositionComponent)!;
        const sComp = world.getComponent(sEnt, SettlementComponent)!;
        if (Math.hypot(pos.x - sPos.x, pos.y - sPos.y) <= sComp.radiusPixels * 1.15) {
          insideExistingSettlement = true;
          break;
        }
      }
      if (insideExistingSettlement) continue;

      freeMortals.push(ent);
    }

    for (const seedEnt of freeMortals) {
      if (lockedEntities.has(seedEnt)) continue;
      const seedPos = world.getComponent(seedEnt, PositionComponent)!;

      const cluster: number[] = [seedEnt];
      for (const other of freeMortals) {
        if (other === seedEnt || lockedEntities.has(other)) continue;
        const oPos = world.getComponent(other, PositionComponent)!;
        if (Math.hypot(oPos.x - seedPos.x, oPos.y - seedPos.y) <= 180) {
          cluster.push(other);
        }
      }

      if (cluster.length < FACTION_PROGRESSION_CONFIG.hamlet.minFounders) continue;

      // Kiểm tra quan hệ xã hội tối thiểu trong cụm (affinity >= 15 hoặc quan hệ gia đình)
      let hasBond = false;
      for (let i = 0; i < cluster.length && !hasBond; i++) {
        const relComp = world.getComponent(cluster[i], SocialRelationshipComponent);
        if (!relComp) continue;
        for (let j = i + 1; j < cluster.length; j++) {
          const rel = relComp.getRelationship(cluster[j]);
          if (
            rel &&
            (rel.affinity >= FACTION_PROGRESSION_CONFIG.hamlet.minPairAffinity ||
              rel.relationType === 'kin_parent' ||
              rel.relationType === 'kin_child' ||
              isActiveBondBetween(world, cluster[i], cluster[j], 'dao_companion') ||
              isActiveBondBetween(world, cluster[i], cluster[j], 'sworn_brother'))
          ) {
            hasBond = true;
            break;
          }
        }
      }

      if (!hasBond) {
        // Giao lưu đồng hương chỉ hoàn tất khi cặp thực sự ở gần và có thể đáp lại.
        for (let i = 0; i < cluster.length; i++) {
          for (let j = i + 1; j < cluster.length; j++) {
            const a = cluster[i];
            const b = cluster[j];
            performConversation(world, a, b, 'community');
          }
        }
        continue;
      }

      // Bầu chọn người khởi xướng (Thôn Trưởng tương lai) theo tuổi, ngộ tính và tổng thiện cảm trong nhóm
      let bestLeader = cluster[0];
      let bestScore = -Infinity;
      for (const mId of cluster) {
        const life = world.getComponent(mId, LifespanComponent);
        const comp = world.getComponent(mId, ComprehensionComponent);
        const relComp = world.getComponent(mId, SocialRelationshipComponent);
        let groupAffinity = 0;
        if (relComp) {
          for (const otherId of cluster) {
            if (otherId === mId) continue;
            groupAffinity += Math.max(0, relComp.getRelationship(otherId)?.affinity ?? 0);
          }
        }
        const score = (life?.currentAge ?? 20) + (comp?.current ?? 10000) / 2500 + groupAffinity * 1.5;
        if (score > bestScore || (score === bestScore && mId < bestLeader)) {
          bestScore = score;
          bestLeader = mId;
        }
      }

      const participants = [...cluster];
      const intent = new FoundingIntentComponent(
        'hamlet',
        'intent',
        'Tập hợp lưu dân khai hoang, dựng lửa trại lập thôn xóm',
        60,
        participants
      );
      world.addComponent(bestLeader, intent);

      const site = this.selectFoundingSite(world, bestLeader, intent);
      if (!site) {
        this.cancelFoundingIntent(world, bestLeader, 'Không tìm được địa điểm định cư hợp lệ hoặc đường đi bị chặn');
        continue;
      }

      for (const pId of participants) lockedEntities.add(pId);
      intent.targetPos = site;
      intent.stage = 'preparing';
      this.dispatchFoundingTaskForIntent(world, bestLeader, intent);
    }
  }

  private dispatchFoundingTaskForIntent(
    world: ECSWorld,
    founderId: number,
    intent: FoundingIntentComponent
  ): void {
    if (!intent.targetPos) return;
    const taskBoard = CommunityTaskBoard.getInstance();
    const isHamlet = intent.intentType === 'hamlet';
    const taskType = isHamlet ? 'found_campfire' : 'found_sect_hall';
    const title = isHamlet ? '🔥 Nhóm Lửa Trại Lập Thôn' : '🏯 Khởi Dựng Tông Môn Đại Điện';
    const cost = isHamlet
      ? BUILDING_DEFINITIONS.campfire.resourceCost
      : BUILDING_DEFINITIONS.sect_hall.resourceCost;

    const task = taskBoard.createTask(
      {
        type: taskType,
        title,
        targetPos: intent.targetPos,
        preferredJob: 'builder',
        priority: 97,
        duration: isHamlet ? 3.5 : 4.5,
        foundingIntentId: `intent_${founderId}`,
        founderEntityId: founderId,
        reservedCost: cost
      },
      world,
      this.worldMap ?? undefined
    );

    if (!task) {
      this.cancelFoundingIntent(world, founderId, 'Không thể tạo công việc sáng lập');
      return;
    }

    taskBoard.assignTaskToEntity(task.id, founderId);
    intent.taskId = task.id;
    intent.stage = 'building';
    intent.resourcesReserved = true;

    const brain = world.getComponent(founderId, AIStrategicBrainComponent);
    const planner = world.getComponent(founderId, AIPlannerComponent);
    if (brain && planner) {
      const isUrgent = ['OBEY_DECREE', 'FLEE_DANGER', 'COMBAT_DEFENSE', 'SURVIVE_VITAL', 'BREAKTHROUGH'].includes(
        brain.currentGoal
      );
      if (!isUrgent) {
        brain.currentGoal = 'LABOUR_WORK';
        brain.goalReason = intent.reason;
        planner.replanRequested = true;
        planner.replanCooldown = 0;
      }
    }
  }

  /**
   * Chọn địa điểm lập thôn hoặc khai tông có kiểm tra khoảng cách tối thiểu và đường đi A*
   */
  public selectFoundingSite(
    world: ECSWorld,
    founderId: number,
    intent: FoundingIntentComponent
  ): Point2D | null {
    const fPos = world.getComponent(founderId, PositionComponent);
    if (!fPos) return null;

    const isHamlet = intent.intentType === 'hamlet';
    const minTileDist = isHamlet
      ? FACTION_PROGRESSION_CONFIG.hamlet.minDistanceFromOtherSettlementTiles
      : FACTION_PROGRESSION_CONFIG.sect.minDistanceFromOtherSectTiles;

    const existingCenters: Point2D[] = [];
    for (const sEnt of world.query([PositionComponent, SettlementComponent])) {
      if (!isHamlet) continue;
      const sp = world.getComponent(sEnt, PositionComponent)!;
      existingCenters.push({ x: sp.x, y: sp.y });
    }
    for (const tcEnt of world.query([PositionComponent, TerritoryCenterComponent])) {
      const tc = world.getComponent(tcEnt, TerritoryCenterComponent)!;
      if (isHamlet && tc.layerType !== 'civil') continue;
      if (!isHamlet && tc.layerType !== 'sect') continue;
      const tp = world.getComponent(tcEnt, PositionComponent)!;
      existingCenters.push({ x: tp.x, y: tp.y });
    }
    for (const otherId of world.query([FoundingIntentComponent])) {
      if (otherId === founderId) continue;
      const otherIntent = world.getComponent(otherId, FoundingIntentComponent)!;
      if (otherIntent.targetPos) {
        existingCenters.push(otherIntent.targetPos);
      }
    }

    const tileSize = this.worldMap?.tileSize ?? 16;
    const minPixelDist = minTileDist * tileSize;

    // Nếu không có worldMap (trong một số unit test tối giản), kiểm tra trực tiếp quanh vị trí founder
    if (!this.worldMap) {
      const candidate = { x: fPos.x + 16, y: fPos.y + 16 };
      for (const c of existingCenters) {
        if (Math.hypot(candidate.x - c.x, candidate.y - c.y) < minPixelDist) {
          return null;
        }
      }
      return candidate;
    }

    const worldMap = this.worldMap;
    const blockedTiles = AStarPathfinder.getBlockedBuildingTiles(world, worldMap);
    const startTx = Math.floor(fPos.x / tileSize);
    const startTy = Math.floor(fPos.y / tileSize);
    const searchRadius = isHamlet ? 10 : 14;

    let bestCandidate: Point2D | null = null;
    let bestScore = -Infinity;

    for (let dy = -searchRadius; dy <= searchRadius; dy += 2) {
      for (let dx = -searchRadius; dx <= searchRadius; dx += 2) {
        const tx = startTx + dx;
        const ty = startTy + dy;
        if (!worldMap.isInBounds(tx, ty)) continue;
        if (!AStarPathfinder.isTileWalkable(tx, ty, worldMap, blockedTiles, false)) continue;

        const tile = worldMap.getTile(tx, ty);
        if (!tile) continue;
        const terrainStr = String(tile.terrain);
        if (terrainStr === 'lava' || terrainStr === 'abyss') continue;

        const wx = tx * tileSize + tileSize / 2;
        const wy = ty * tileSize + tileSize / 2;

        // Kiểm tra khoảng cách tối thiểu tới các điểm định cư / tông môn khác
        let tooClose = false;
        for (const c of existingCenters) {
          if (Math.hypot(wx - c.x, wy - c.y) < minPixelDist) {
            tooClose = true;
            break;
          }
        }
        if (tooClose) continue;

        let score = 50 - Math.hypot(dx, dy) * 1.5;

        if (isHamlet) {
          if (terrainStr === 'fertility_soil') score += 20;
          else if (terrainStr === 'plain' || terrainStr === 'plains') score += 14;
          else if (terrainStr === 'forest' || terrainStr === 'dense_forest') score += 10;

          // Điểm cộng nếu gần sông/hồ nhưng không nằm dưới nước
          for (let wyOff = -4; wyOff <= 4; wyOff += 2) {
            for (let wxOff = -4; wxOff <= 4; wxOff += 2) {
              const nt = worldMap.getTile(tx + wxOff, ty + wyOff);
              const ntStr = nt ? String(nt.terrain) : '';
              if (ntStr === 'river' || ntStr === 'lake' || ntStr === 'water') {
                score += 6;
              } else if (ntStr === 'lava' || ntStr === 'abyss') {
                score -= 25;
              }
            }
          }
        } else {
          // Chọn linh địa cho Tông Môn
          if (terrainStr === 'mountain') score += 15;
          else if (terrainStr === 'dense_forest' || terrainStr === 'forest') score += 10;

          if (this.qiGrid && this.qiGrid.isInBounds(tx, ty)) {
            const qt = this.qiGrid.getTile(tx, ty);
            if (qt) {
              if (qt.isSpiritVein) {
                const tierRank = qt.tier === 'hon_don_khi' ? 3 : qt.tier === 'tien_khi' ? 2 : 1;
                score += 45 + tierRank * 12;
              }
              score += qt.density * 0.5;
              if (qt.density < FACTION_PROGRESSION_CONFIG.sect.minQiDensity && !qt.isSpiritVein) {
                score -= 35;
              }
            }
          }
        }

        if (score <= bestScore) continue;

        // Kiểm tra tính liên thông đường đi A* từ vị trí founder tới địa điểm
        const candidatePos = { x: wx, y: wy };
        const dist = Math.hypot(wx - fPos.x, wy - fPos.y);
        if (dist > tileSize * 1.5) {
          const path = AStarPathfinder.findPath(worldMap, world, { x: fPos.x, y: fPos.y }, candidatePos, true);
          if (path.length === 0) continue;
        }

        bestScore = score;
        bestCandidate = candidatePos;
      }
    }

    if (!isHamlet && bestScore < 20) {
      return null; // Linh khí quá thấp không đủ điều kiện khai tông
    }

    return bestCandidate;
  }

  // ===========================================================================
  // ĐỒNG BỘ & TIẾN TRÌNH PHÁT TRIỂN NHÁNH DÂN SINH (HAMLET -> VILLAGE -> KINGDOM)
  // ===========================================================================
  private syncFactionSettlements(world: ECSWorld, faction: FactionComponent): void {
    const settlements = world.query([PositionComponent, SettlementComponent]);
    const validSettlementIds: string[] = [];

    for (const sEnt of settlements) {
      const sComp = world.getComponent(sEnt, SettlementComponent)!;
      if (sComp.ownerFactionId === faction.factionId) {
        validSettlementIds.push(sComp.settlementId);
        // Làm sạch cư dân còn sống
        const aliveRes: number[] = [];
        for (const rId of sComp.residentIds) {
          const hp = world.getComponent(rId, HealthComponent);
          if (hp && !hp.isDead && FactionFactory.isBeingSociallyEligible(world, rId)) {
            aliveRes.push(rId);
          }
        }
        sComp.residentIds = new Set(aliveRes);
      }
    }

    if (validSettlementIds.length > 0) {
      faction.settlementIds = validSettlementIds;
      if (!faction.capitalSettlementId || !validSettlementIds.includes(faction.capitalSettlementId)) {
        faction.capitalSettlementId = validSettlementIds[0];
      }
    }
  }

  private updateCivilFactionProgression(
    world: ECSWorld,
    fEnt: number,
    faction: FactionComponent,
    aliveMembers: number[],
    currentTotalDays: number,
    dt: number
  ): void {
    // Khám phá thống kê công trình của thế lực dân sinh
    const buildings = world.query([PositionComponent, BuildingComponent]);
    let campfireCount = 0;
    let hutCount = 0;
    let wellCount = 0;
    let farmCount = 0;
    let hallCount = 0;

    for (const bEnt of buildings) {
      const bComp = world.getComponent(bEnt, BuildingComponent);
      if (!bComp || bComp.isRuins || bComp.currentDurability <= 0 || bComp.isUnderConstruction || bComp.factionId !== faction.factionId) continue;
      if (bComp.buildingType === 'campfire') campfireCount++;
      else if (bComp.buildingType === 'thatched_hut') hutCount++;
      else if (bComp.buildingType === 'village_well') wellCount++;
      else if (bComp.buildingType === 'mortal_farm') farmCount++;
      else if (bComp.buildingType === 'sect_hall') hallCount++;
    }

    // Tổng hợp lương thực của cư dân + kho chung
    let residentFood = 0;
    let guardCount = 0;
    for (const mId of aliveMembers) {
      const needs = world.getComponent(mId, MortalNeedsComponent);
      if (needs) {
        residentFood += needs.rawFoodCount + needs.cookedMealCount * 2;
      }
      const mComp = world.getComponent(mId, MemberComponent);
      const realm = world.getComponent(mId, RealmComponent);
      if (mComp?.role === 'guard' || (realm && realm.combatPower >= 25)) {
        guardCount++;
      }
    }

    // Bổ sung tích lũy vật tư dân sinh tự nhiên theo lao động của cư dân (gỗ chỉ khai thác từ đốn cây thực tế)
    if (aliveMembers.length > 0) {
      faction.stoneStock += Math.floor(aliveMembers.length * 0.15);
      if (farmCount > 0) {
        faction.foodStock += farmCount * 2;
      }
    }

    // Kiểm tra nguồn nước tự nhiên trong các Settlement
    let hasWaterAccess = wellCount > 0;
    if (!hasWaterAccess) {
      for (const sid of faction.settlementIds) {
        const sEnt = FactionFactory.findSettlementEntity(world, sid);
        const sComp = sEnt !== null ? world.getComponent(sEnt, SettlementComponent) : undefined;
        if (sComp?.waterAccess) {
          hasWaterAccess = true;
          break;
        }
      }
    }

    // 1. NÂNG CẤP HAMLET -> VILLAGE
    if (faction.type === 'hamlet') {
      const cfg = FACTION_PROGRESSION_CONFIG.village;
      const totalFoodAvailable = faction.foodStock + residentFood;
      const housingCap = hutCount * (BUILDING_DEFINITIONS.thatched_hut.housingCapacity ?? 4);
      const hasEnoughHousing = hutCount >= cfg.minHuts || housingCap >= Math.ceil(aliveMembers.length * 0.75);
      const hasEnoughFood = totalFoodAvailable >= aliveMembers.length * cfg.minFoodReserveDaysPerResident;

      const eligibleForVillage =
        aliveMembers.length >= cfg.minResidents &&
        campfireCount >= 1 &&
        hasEnoughHousing &&
        (wellCount >= cfg.minWells || hasWaterAccess) &&
        farmCount >= cfg.minFarms &&
        hasEnoughFood &&
        faction.stability >= 50;

      if (eligibleForVillage) {
        if (faction.upgradeEligibleSinceDays === null) {
          faction.upgradeEligibleSinceDays = currentTotalDays;
        }
        if (
          currentTotalDays - faction.upgradeEligibleSinceDays >= cfg.requiredStableDays ||
          faction.stageStableDays >= cfg.requiredStableDays
        ) {
          this.promoteHamletToVillage(world, faction);
        }
      } else {
        faction.upgradeEligibleSinceDays = null;
      }

      // Kiểm tra suy vong của Thôn Xóm (dưới 2 người và mất lửa trại)
      if (aliveMembers.length < 2 && campfireCount === 0 && hutCount === 0) {
        if (faction.declineSinceDays === null) {
          faction.declineSinceDays = currentTotalDays;
        } else if (currentTotalDays - faction.declineSinceDays >= FACTION_PROGRESSION_CONFIG.declineRecoveryGraceDays) {
          this.dissolveFaction(
            world,
            fEnt,
            faction,
            `Thôn xóm [${faction.name}] hoang phế lâu ngày không người khôi phục, chính thức tan rã!`
          );
          return;
        }
      } else {
        faction.declineSinceDays = null;
      }
    }

    // 2. NÂNG CẤP VILLAGE -> KINGDOM (VÀ SÁP NHẬP ÔN HÒA CÁC LÀNG LÂN CẬN)
    else if (faction.type === 'village') {
      // Thử thu phục / hợp nhất ôn hòa các thôn/làng nhỏ lân cận khi làng đã hùng mạnh
      if (aliveMembers.length >= FACTION_PROGRESSION_CONFIG.village.peacefulMergeMinPopulation && faction.stability >= 65 && faction.foodStock >= 35) {
        this.tryPeacefulMergeNearbyVillages(world, faction);
      }

      // Nếu làng đã có >= 3 settlements và dân số đạt ngưỡng tuyển hộ vệ, tuyển chọn từ dân tráng
      if (faction.settlementIds.length >= 3 && aliveMembers.length >= FACTION_PROGRESSION_CONFIG.kingdom.guardsRecruitmentMinPopulation && guardCount < FACTION_PROGRESSION_CONFIG.kingdom.minGuards) {
        for (const mId of aliveMembers) {
          if (mId === faction.leaderEntityId) continue;
          const mComp = world.getComponent(mId, MemberComponent);
          if (mComp && mComp.role === 'villager') {
            mComp.role = 'guard';
            guardCount++;
            if (guardCount >= FACTION_PROGRESSION_CONFIG.kingdom.minGuards) break;
          }
        }
      }

      // Nếu đã đủ 2 điểm định cư và 90 dân cùng ngân khố dồi dào nhưng thủ phủ chưa dựng Nghị Sự Điện, khởi công dựng Nghị Sự Điện tại thủ phủ
      let hasHallOrSite = false;
      for (const bEnt of buildings) {
        const bComp = world.getComponent(bEnt, BuildingComponent);
        if (!bComp) continue;
        if (!bComp.isRuins && bComp.factionId === faction.factionId && bComp.buildingType === 'sect_hall') {
          hasHallOrSite = true;
          break;
        }
      }
      if (
        faction.settlementIds.length >= FACTION_PROGRESSION_CONFIG.kingdom.minSettlements &&
        aliveMembers.length >= FACTION_PROGRESSION_CONFIG.kingdom.minTotalResidents &&
        !hasHallOrSite &&
        faction.woodStock >= 30 &&
        faction.stoneStock >= 25
      ) {
        const capId = faction.capitalSettlementId ?? faction.settlementIds[0];
        const capEnt = capId ? FactionFactory.findSettlementEntity(world, capId) : null;
        const capPos = capEnt !== null ? world.getComponent(capEnt, PositionComponent) : undefined;
        if (capPos && (!this.worldMap || validateBuildingPlacement(
          world,
          this.worldMap,
          'sect_hall',
          capPos.x + 24,
          capPos.y
        ).valid)) {
          const reservedCost = { food: 0, wood: 30, stone: 25, spiritStones: 0 };
          const ok = FactionFactory.reserveResources(world, faction.factionId, reservedCost);
          if (ok) {
            const hallEnt = FactionFactory.startConstruction(
              world,
              'sect_hall',
              faction.factionId,
              capPos.x + 24,
              capPos.y,
              capId,
              reservedCost
            );
            CommunityTaskBoard.getInstance().createTask({
              type: 'found_sect_hall',
              title: 'Xây dựng Nghị Sự Đại Điện Kinh Đô',
              targetPos: { x: capPos.x + 24, y: capPos.y },
              targetEntityId: hallEnt,
              preferredJob: 'builder',
              priority: 95,
              duration: 4.0,
              settlementId: capId,
              payerFactionId: faction.factionId
            }, world);
          }
        }
      }

      const cfg = FACTION_PROGRESSION_CONFIG.kingdom;
      const eligibleForKingdom =
        faction.settlementIds.length >= cfg.minSettlements &&
        aliveMembers.length >= cfg.minTotalResidents &&
        hallCount >= 1 &&
        guardCount >= cfg.minGuards &&
        faction.foodStock >= cfg.minFoodStock &&
        faction.treasury >= cfg.minTreasury &&
        faction.stability >= 60;

      if (eligibleForKingdom) {
        if (faction.upgradeEligibleSinceDays === null) {
          faction.upgradeEligibleSinceDays = currentTotalDays;
        }
        if (
          currentTotalDays - faction.upgradeEligibleSinceDays >= cfg.requiredStableDays ||
          faction.stageStableDays >= cfg.requiredStableDays
        ) {
          this.promoteVillageToKingdom(world, faction);
        }
      } else {
        faction.upgradeEligibleSinceDays = null;
      }

      // Kiểm tra suy thoái Village -> Hamlet (có thời gian ân hạn 1 mùa = 90 ngày)
      const isDeclining = aliveMembers.length < FACTION_PROGRESSION_CONFIG.village.declineMinResidents || (campfireCount === 0 && hutCount === 0);
      if (isDeclining) {
        if (faction.declineSinceDays === null) {
          faction.declineSinceDays = currentTotalDays;
        } else if (currentTotalDays - faction.declineSinceDays >= FACTION_PROGRESSION_CONFIG.declineRecoveryGraceDays) {
          faction.type = 'hamlet';
          faction.developmentStage = 1;
          faction.territoryRadius = FACTION_PROGRESSION_CONFIG.hamlet.territoryRadiusTiles;
          faction.declineSinceDays = null;
          this.updateFactionTerritoryRadius(world, faction.factionId, faction.territoryRadius * 16);
          this.eventBus.emit('chronicle:entry', {
            category: 'decline',
            message: `🍂 Làng [${faction.name}] nhân đinh凋零, nhà cửa đổ nát không kịp phục hồi, suy thoái trở lại thành Thôn Xóm.`,
            importance: 'normal'
          });
        }
      } else {
        faction.declineSinceDays = null;
      }
    }

    // 3. QUẢN TRỊ & SUY THOÁI CỦA KINGDOM
    else if (faction.type === 'kingdom') {
      // Thu thuế định kỳ từ các điểm định cư trực thuộc
      const taxIncome = Math.max(1, Math.floor(aliveMembers.length * faction.taxRate * (dt / 10)));
      faction.treasury += taxIncome;
      if (farmCount > 0) {
        faction.foodStock += Math.max(1, Math.floor(farmCount * 1.5));
      }

      // Nếu ổn định quá thấp (< 25), một điểm định cư xa kinh đô có nguy cơ ly khai
      if (faction.stability < 25 && faction.settlementIds.length > 1) {
        const rebelSid = faction.settlementIds.find(sid => sid !== faction.capitalSettlementId);
        if (rebelSid) {
          this.getDiplomacy(world).secedeSettlement(world, rebelSid);
        }
      }

      const isDeclining =
        faction.settlementIds.length < 2 ||
        aliveMembers.length < FACTION_PROGRESSION_CONFIG.kingdom.declineMinResidents ||
        faction.stability < 20;

      if (isDeclining) {
        if (faction.declineSinceDays === null) {
          faction.declineSinceDays = currentTotalDays;
        } else if (currentTotalDays - faction.declineSinceDays >= FACTION_PROGRESSION_CONFIG.declineRecoveryGraceDays) {
          faction.type = 'village';
          faction.developmentStage = 2;
          faction.rank = 'cuu_pham';
          faction.territoryRadius = FACTION_PROGRESSION_CONFIG.village.territoryRadiusTiles;
          faction.declineSinceDays = null;
          if (faction.leaderEntityId !== null) {
            const lMem = world.getComponent(faction.leaderEntityId, MemberComponent);
            if (lMem && lMem.role === 'king') lMem.role = 'village_head';
          }
          this.updateFactionTerritoryRadius(world, faction.factionId, faction.territoryRadius * 16);
          this.eventBus.emit('chronicle:entry', {
            category: 'decline',
            message: `🏚️ Vương quốc [${faction.name}] quốc lực suy vi, chư hầu ly tán, giáng cấp trở về thành Thôn Làng!`,
            importance: 'high'
          });
        }
      } else {
        faction.declineSinceDays = null;
      }
    }
  }

  private promoteHamletToVillage(world: ECSWorld, faction: FactionComponent): void {
    faction.type = 'village';
    faction.developmentStage = 2;
    faction.territoryRadius = FACTION_PROGRESSION_CONFIG.village.territoryRadiusTiles;
    faction.upgradeEligibleSinceDays = null;
    faction.declineSinceDays = null;
    faction.prestige += 30;

    for (const sid of faction.settlementIds) {
      const sEnt = FactionFactory.findSettlementEntity(world, sid);
      if (sEnt !== null) {
        const sComp = world.getComponent(sEnt, SettlementComponent);
        if (sComp) {
          sComp.settlementType = 'village';
          sComp.radiusPixels = faction.territoryRadius * 16;
        }
      }
    }

    this.updateFactionTerritoryRadius(world, faction.factionId, faction.territoryRadius * 16);

    this.eventBus.emit('chronicle:entry', {
      category: 'upgrade',
      message: `🏘️ [${faction.name}] dân cư đông đúc, ruộng vườn trù phú, chính thức phát triển từ Thôn Xóm thành Làng!`,
      importance: 'high'
    });
  }

  private promoteVillageToKingdom(world: ECSWorld, faction: FactionComponent): void {
    faction.type = 'kingdom';
    faction.developmentStage = 3;
    faction.rank = 'nhat_pham';
    faction.territoryRadius = FACTION_PROGRESSION_CONFIG.kingdom.territoryRadiusTiles;
    faction.upgradeEligibleSinceDays = null;
    faction.declineSinceDays = null;
    faction.prestige += 120;

    if (!faction.capitalSettlementId && faction.settlementIds.length > 0) {
      faction.capitalSettlementId = faction.settlementIds[0];
    }

    if (faction.leaderEntityId !== null) {
      const lMem = world.getComponent(faction.leaderEntityId, MemberComponent);
      if (lMem) lMem.role = 'king';
    }

    this.updateFactionTerritoryRadius(world, faction.factionId, faction.territoryRadius * 16);

    const leaderName =
      faction.leaderEntityId !== null
        ? (world.getComponent(faction.leaderEntityId, NameComponent)?.name ?? 'Quốc Vương')
        : 'Quốc Vương';

    this.eventBus.emit('chronicle:entry', {
      category: 'founding',
      message: `👑 [${leaderName}] quy tụ ${faction.settlementIds.length} thành ấp, vạn dân quy phục, chính thức lập nên Vương Quốc [${faction.name}]!`,
      importance: 'high'
    });
  }

  private tryPeacefulMergeNearbyVillages(world: ECSWorld, mainFaction: FactionComponent): void {
    const mainCapId = mainFaction.capitalSettlementId ?? mainFaction.settlementIds[0];
    const mainCapEnt = mainCapId ? FactionFactory.findSettlementEntity(world, mainCapId) : null;
    const mainPos = mainCapEnt !== null ? world.getComponent(mainCapEnt, PositionComponent) : undefined;
    if (!mainPos) return;

    const diplomacy = this.getDiplomacy(world);
    const allFactions = world.query([FactionComponent]);

    for (const otherEnt of allFactions) {
      const other = world.getComponent(otherEnt, FactionComponent);
      if (!other || other.factionId === mainFaction.factionId) continue;
      if (other.type !== 'hamlet' && other.type !== 'village') continue;
      if (other.members.size === 0 || other.members.size >= mainFaction.members.size * 0.85) continue;
      if (diplomacy.getRelation(mainFaction.factionId, other.factionId) === 'war') continue;

      const otherSid = other.settlementIds[0];
      const otherSEnt = otherSid ? FactionFactory.findSettlementEntity(world, otherSid) : null;
      const otherPos = otherSEnt !== null ? world.getComponent(otherSEnt, PositionComponent) : undefined;
      if (!otherPos) continue;

      if (Math.hypot(otherPos.x - mainPos.x, otherPos.y - mainPos.y) <= 750) {
        const settlementIds = [...other.settlementIds];
        if (settlementIds.some(sid => {
          const ent = FactionFactory.findSettlementEntity(world, sid);
          return ent === null || world.getComponent(ent, SettlementComponent)?.ownerFactionId !== other.factionId;
        })) continue;
        // Sáp nhập ôn hòa các Settlement của other vào mainFaction
        const merged = settlementIds.every(sid =>
          diplomacy.mergeSettlementIntoFaction(world, sid, mainFaction.factionId, true)
        );
        if (!merged) continue;

        // Hoàn lại các khoản đặt trước trước khi chuyển kho và xóa chủ cũ.
        const board = CommunityTaskBoard.getInstance();
        for (const task of board.getTasksForFaction(other.factionId)) {
          board.cancelTask(world, task.id, 'Thế lực đã sáp nhập');
        }

        // Chuyển các thành viên còn lại và kho dự trữ sang mainFaction
        for (const mId of [...other.members]) {
          const mComp = world.getComponent(mId, MemberComponent);
          const role = mId === other.leaderEntityId ? 'elder' : (mComp?.role ?? 'villager');
          FactionFactory.assignMemberToFaction(world, mId, mainFaction.factionId, role, `Sáp nhập ôn hòa vào [${mainFaction.name}]`);
        }

        mainFaction.foodStock += other.foodStock;
        mainFaction.woodStock += other.woodStock;
        mainFaction.stoneStock += other.stoneStock;
        mainFaction.treasury += other.treasury;
        mainFaction.spiritStones += other.spiritStones;
        mainFaction.herbStock += other.herbStock;
        mainFaction.pillStock += other.pillStock;
        const mainEntity = FactionFactory.findFactionEntity(world, mainFaction.factionId);
        if (mainEntity !== null) transferProfessionStock(world, otherEnt, mainEntity);

        // Xóa bỏ các TerritoryCenter dư thừa hoặc chuyển sang mainFaction
        for (const tcEnt of world.query([TerritoryCenterComponent])) {
          const tc = world.getComponent(tcEnt, TerritoryCenterComponent);
          if (tc && tc.factionId === other.factionId) {
            tc.factionId = mainFaction.factionId;
            tc.factionName = mainFaction.name;
          }
        }

        diplomacy.removeFactionLinks(world, other.factionId);
        world.destroyEntity(otherEnt);
        break; // Mỗi chu kỳ chỉ hợp nhất tối đa 1 thôn/làng để diễn tiến tự nhiên
      }
    }
  }

  // ===========================================================================
  // TIẾN TRÌNH PHÁT TRIỂN NHÁNH TU LUYỆN (SECT -> HOLY LAND)
  // ===========================================================================
  private updateCultivationFactionProgression(
    world: ECSWorld,
    fEnt: number,
    faction: FactionComponent,
    aliveMembers: number[],
    currentTotalDays: number,
    _dt: number
  ): void {
    let highestNormTier = 0;
    let highTierCultivators = 0;
    let highestTechTier = 0;

    for (const mId of aliveMembers) {
      const realm = world.getComponent(mId, RealmComponent);
      const race = world.getComponent(mId, RaceComponent);
      if (realm && race) {
        const normTier = getNormalizedCultivationTier(race.raceId, realm.stageIndex, realm.combatPower);
        if (normTier > highestNormTier) highestNormTier = normTier;
        if (normTier >= FACTION_PROGRESSION_CONFIG.holy_land.highTierNormalizedIndex) {
          highTierCultivators++;
        }
      }
      const tech = world.getComponent(mId, CultivationTechniqueComponent);
      if (tech && tech.tier > highestTechTier) {
        highestTechTier = tech.tier;
      }
    }

    const buildings = world.query([PositionComponent, BuildingComponent]);
    let hallCount = 0;
    let defenseArrayCount = 0;
    let herbGardenCount = 0;
    let hallPos: PositionComponent | null = null;

    for (const bEnt of buildings) {
      const bComp = world.getComponent(bEnt, BuildingComponent);
      if (!bComp || bComp.isRuins || bComp.currentDurability <= 0 || bComp.isUnderConstruction || bComp.factionId !== faction.factionId) continue;
      if (bComp.buildingType === 'sect_hall') {
        hallCount++;
        hallPos = world.getComponent(bEnt, PositionComponent) ?? null;
      } else if (bComp.buildingType === 'defense_array') {
        defenseArrayCount++;
      } else if (bComp.buildingType === 'herb_garden') {
        herbGardenCount++;
      }
    }

    // Kiểm tra linh mạch trong lãnh thổ
    let hasSpiritVeinOrHighQi = true;
    if (this.qiGrid && hallPos && this.worldMap) {
      hasSpiritVeinOrHighQi = false;
      const tileSize = this.worldMap.tileSize;
      const cx = Math.floor(hallPos.x / tileSize);
      const cy = Math.floor(hallPos.y / tileSize);
      const rTiles = Math.min(16, faction.territoryRadius);
      for (let dy = -rTiles; dy <= rTiles && !hasSpiritVeinOrHighQi; dy++) {
        for (let dx = -rTiles; dx <= rTiles; dx++) {
          const tx = cx + dx;
          const ty = cy + dy;
          if (!this.qiGrid.isInBounds(tx, ty)) continue;
          const qt = this.qiGrid.getTile(tx, ty);
          if (qt && (qt.isSpiritVein || qt.density >= 65)) {
            hasSpiritVeinOrHighQi = true;
            break;
          }
        }
      }
    }

    // Tăng uy tín tự nhiên theo số lượng cao thủ và công trình
    if (aliveMembers.length >= 5 && hallCount > 0) {
      faction.prestige += Math.floor(highTierCultivators * 2 + herbGardenCount);
    }

    if (faction.type === 'sect') {
      // Cập nhật phẩm cấp Tông Môn từ Cửu Phẩm -> Tam Phẩm -> Nhất Phẩm (KHÔNG tự động nhảy lên Thánh Địa chỉ nhờ 1 người!)
      const prevRank = faction.rank;
      if (aliveMembers.length >= FACTION_PROGRESSION_CONFIG.sect.rankNhatPhamMinMembers && highestNormTier >= 3) {
        faction.rank = 'nhat_pham';
        faction.territoryRadius = 28;
      } else if (aliveMembers.length >= FACTION_PROGRESSION_CONFIG.sect.rankTamPhamMinMembers && highestNormTier >= 2) {
        faction.rank = 'tam_pham';
        faction.territoryRadius = 24;
      } else {
        faction.rank = 'cuu_pham';
        faction.territoryRadius = FACTION_PROGRESSION_CONFIG.sect.territoryRadiusTiles;
      }

      if (prevRank !== faction.rank) {
        this.updateFactionTerritoryRadius(world, faction.factionId, faction.territoryRadius * 16);
      }

      const cfg = FACTION_PROGRESSION_CONFIG.holy_land;
      if (highestTechTier < cfg.minTechniqueTier && aliveMembers.length >= 5) {
        this.distributeFactionTechniques(world, faction, aliveMembers);
        for (const mId of aliveMembers) {
          const tech = world.getComponent(mId, CultivationTechniqueComponent);
          if (tech && tech.tier > highestTechTier) {
            highestTechTier = tech.tier;
          }
        }
      }

      // Kiểm tra điều kiện nghiêm ngặt để thăng cấp từ Sect -> Holy Land (Thánh Địa)
      const eligibleForHolyLand =
        aliveMembers.length >= cfg.minMembers &&
        highTierCultivators >= cfg.minHighTierCultivators &&
        highestTechTier >= cfg.minTechniqueTier &&
        hallCount >= 1 &&
        defenseArrayCount >= 1 &&
        hasSpiritVeinOrHighQi &&
        (faction.prestige >= cfg.minPrestige || faction.spiritStones >= cfg.minSpiritStones);

      if (eligibleForHolyLand) {
        if (faction.upgradeEligibleSinceDays === null) {
          faction.upgradeEligibleSinceDays = currentTotalDays;
        }
        if (
          currentTotalDays - faction.upgradeEligibleSinceDays >= cfg.requiredStableDays ||
          faction.stageStableDays >= cfg.requiredStableDays
        ) {
          faction.type = 'holy_land';
          faction.rank = 'thanh_dia';
          faction.developmentStage = 3;
          faction.territoryRadius = cfg.territoryRadiusTiles;
          faction.upgradeEligibleSinceDays = null;
          faction.declineSinceDays = null;
          this.updateFactionTerritoryRadius(world, faction.factionId, faction.territoryRadius * 16);

          this.eventBus.emit('chronicle:entry', {
            category: 'upgrade',
            message: `🌟 [${faction.name}] trải qua năm tháng tích lũy nội tình, cường giả như mây, đại trận trấn sơn, chính thức tấn thăng làm THÁNH ĐỊA!`,
            importance: 'high'
          });
        }
      } else {
        faction.upgradeEligibleSinceDays = null;
      }

      // Kiểm tra suy vong của Tông Môn
      if (aliveMembers.length < 2 && hallCount === 0) {
        if (faction.declineSinceDays === null) {
          faction.declineSinceDays = currentTotalDays;
        } else if (currentTotalDays - faction.declineSinceDays >= FACTION_PROGRESSION_CONFIG.declineRecoveryGraceDays) {
          this.dissolveFaction(
            world,
            fEnt,
            faction,
            `Tông môn [${faction.name}] sơn môn sụp đổ, đệ tử ly tán, đạo thống chính thức đoạn tuyệt!`
          );
          return;
        }
      } else {
        faction.declineSinceDays = null;
      }
    } else if (faction.type === 'holy_land') {
      faction.rank = 'thanh_dia';
      const isDeclining =
        aliveMembers.length < FACTION_PROGRESSION_CONFIG.holy_land.declineMinMembers ||
        highTierCultivators < 1 ||
        (hallCount === 0 && defenseArrayCount === 0);

      if (isDeclining) {
        if (faction.declineSinceDays === null) {
          faction.declineSinceDays = currentTotalDays;
        } else if (currentTotalDays - faction.declineSinceDays >= FACTION_PROGRESSION_CONFIG.declineRecoveryGraceDays) {
          faction.type = 'sect';
          faction.rank = 'nhat_pham';
          faction.developmentStage = 2;
          faction.territoryRadius = 26;
          faction.declineSinceDays = null;
          this.updateFactionTerritoryRadius(world, faction.factionId, faction.territoryRadius * 16);

          this.eventBus.emit('chronicle:entry', {
            category: 'decline',
            message: `☄️ Thánh Địa [${faction.name}] cường giảẫn lạc, linh mạch suy kiệt không kịp hồi phục, rớt khỏi hàng ngũ Thánh Địa trở về làm Tông Môn!`,
            importance: 'high'
          });
        }
      } else {
        faction.declineSinceDays = null;
      }
    }
  }

  private updateFactionTerritoryRadius(world: ECSWorld, factionId: string, radiusPixels: number): void {
    const centers = world.query([TerritoryCenterComponent]);
    for (const cEnt of centers) {
      const tc = world.getComponent(cEnt, TerritoryCenterComponent);
      if (tc && tc.factionId === factionId) {
        tc.radiusPixels = radiusPixels;
      }
    }
  }

  /**
   * Giải thể hoàn toàn một thế lực: người sống sót thành lưu dân/tán tu, công trình thành phế tích vô chủ
   */
  public dissolveFaction(world: ECSWorld, fEnt: number, faction: FactionComponent, message: string): void {
    // 1. Giải phóng toàn bộ thành viên còn sống thành lưu dân / tán tu
    for (const mId of [...faction.members]) {
      FactionFactory.leaveFaction(world, mId, 'Thế lực giải thể');
      const res = world.getComponent(mId, ResidenceComponent);
      if (res && res.factionId === faction.factionId) {
        FactionFactory.leaveResidence(world, mId);
      }
    }

    // 2. Giải phóng các Settlement trực thuộc thành phế tích vô chủ
    for (const sEnt of world.query([SettlementComponent])) {
      const sComp = world.getComponent(sEnt, SettlementComponent);
      if (sComp && sComp.ownerFactionId === faction.factionId) {
        for (const rId of [...sComp.residentIds]) {
          FactionFactory.leaveResidence(world, rId);
        }
        sComp.settlementType = 'ruins';
        sComp.ownerFactionId = '';
        sComp.localLeaderEntityId = null;
        if (world.hasComponent(sEnt, TerritoryCenterComponent)) {
          world.removeComponent(sEnt, TerritoryCenterComponent);
        }
      }
    }

    // 3. Xóa các TerritoryCenterComponent của thế lực
    for (const cEnt of world.query([TerritoryCenterComponent])) {
      const tc = world.getComponent(cEnt, TerritoryCenterComponent);
      if (tc && tc.factionId === faction.factionId) {
        if (world.hasComponent(cEnt, BuildingComponent)) {
          world.removeComponent(cEnt, TerritoryCenterComponent);
        } else {
          world.destroyEntity(cEnt);
        }
      }
    }

    // 4. Chuyển toàn bộ công trình của thế lực thành phế tích vô chủ (isRuins = true)
    for (const bEnt of world.query([BuildingComponent])) {
      const bComp = world.getComponent(bEnt, BuildingComponent);
      if (bComp && bComp.factionId === faction.factionId) {
        bComp.factionId = '';
        bComp.settlementId = '';
        bComp.isRuins = true;
        bComp.occupantEntityId = null;
      }
    }

    // 5. Hủy các task cộng đồng đang treo của thế lực
    const taskBoard = CommunityTaskBoard.getInstance();
    for (const task of taskBoard.getTasksForFaction(faction.factionId)) {
      taskBoard.cancelTask(world, task.id, 'Thế lực sở hữu đã diệt vong');
    }

    // 6. Dọn dẹp quan hệ ngoại giao & hiệp ước
    this.getDiplomacy(world).removeFactionLinks(world, faction.factionId);

    this.eventBus.emit('world:log', {
      type: 'faction_destroyed',
      message: `☠️ THẾ LỰC DIỆT VONG: ${message}`
    });
    this.eventBus.emit('chronicle:entry', {
      category: 'decline',
      message: `☠️ ${message}`,
      importance: 'high'
    });

    world.destroyEntity(fEnt);
  }

  private distributeFactionTechniques(world: ECSWorld, faction: FactionComponent, memberIds: number[]): void {
    let factionSource: TechniqueSource = 'tong_mon';
    if (faction.type === 'holy_land') {
      factionSource = 'thanh_dia';
    } else if (faction.type === 'kingdom') {
      factionSource = 'vuong_trieu';
    } else if (faction.type === 'hamlet' || faction.type === 'village') {
      factionSource = 'gia_toc';
    } else {
      factionSource = 'tong_mon';
    }

    const availableTechs = getTechniquesByFactionTier(faction.rank);
    if (availableTechs.length === 0) return;

    for (const mId of memberIds) {
      if (!FactionFactory.isBeingSociallyEligible(world, mId)) continue;
      const rootComp = world.getComponent(mId, SpiritualRootComponent);
      // Người chưa thức tỉnh linh căn (<12 tuổi) hoặc không có linh căn không thể tu luyện
      if (!rootComp || !rootComp.canCultivate() || rootComp.rootType === 'none') continue;

      const techComp = world.getComponent(mId, CultivationTechniqueComponent);
      const history = world.getComponent(mId, CharacterHistoryComponent);
      const life = world.getComponent(mId, LifespanComponent);
      const traits = world.getComponent(mId, TraitsComponent);

      if (!techComp) {
        const chosenTech = availableTechs[mId % availableTechs.length];
        world.addComponent(
          mId,
          new CultivationTechniqueComponent(
            chosenTech.id,
            chosenTech.name,
            chosenTech.tier,
            chosenTech.element,
            chosenTech.description,
            factionSource,
            faction.name,
            'nhap_mon',
            0
          )
        );

        if (traits && !traits.techniqueTraits.includes(chosenTech.id)) {
          traits.techniqueTraits.push(chosenTech.id);
        }

        if (history) {
          history.addRecord(
            life?.currentAge ?? 18,
            'technique',
            `Được Truyền Thụ [${chosenTech.name}]`,
            `Gia nhập [${faction.name}], được truyền thụ công pháp trấn thế phẩm cấp ${chosenTech.tier}.`
          );
        }

        this.eventBus.emit('combat:floating_text', {
          entityId: mId,
          text: `Được Ban: ${chosenTech.name}! 📜`,
          color: '#38bdf8'
        });
      } else {
        const maxFactionTier = Math.max(...availableTechs.map(t => t.tier));
        if (techComp.tier < maxFactionTier) {
          const higherTechs = availableTechs.filter(t => t.tier > techComp.tier);
          if (higherTechs.length > 0) {
            const upgradeTech = higherTechs[mId % higherTechs.length];
            const oldName = techComp.techniqueName;
            techComp.techniqueId = upgradeTech.id;
            techComp.techniqueName = upgradeTech.name;
            techComp.tier = upgradeTech.tier;
            techComp.element = upgradeTech.element;
            techComp.description = upgradeTech.description;
            techComp.source = factionSource;
            techComp.sourceName = faction.name;
            techComp.masteryExp = Math.floor(techComp.masteryExp * 0.3);
            if (techComp.masteryExp >= 800) techComp.masteryLevel = 'dai_thanh';
            else if (techComp.masteryExp >= 300) techComp.masteryLevel = 'tieu_thanh';
            else if (techComp.masteryExp >= 100) techComp.masteryLevel = 'so_khuynh';
            else techComp.masteryLevel = 'nhap_mon';
            techComp.masteryMaxExp = techComp.calculateNextThreshold();

            if (traits) {
              traits.techniqueTraits = [upgradeTech.id];
            }

            if (history) {
              history.addRecord(
                life?.currentAge ?? 18,
                'technique',
                `Đổi Học Tuyệt Học [${upgradeTech.name}]`,
                `Được bề trên [${faction.name}] ban truyền tuyệt kỹ thượng thừa phẩm cấp ${upgradeTech.tier}, thay thế ${oldName}.`
              );
            }
          }
        }
      }
    }
  }

  /**
   * Tuyển mộ lưu dân cho Thôn/Làng/Vương Quốc và tuyển đệ tử cho Tông Môn/Thánh Địa
   */
  private recruitNearbyWanderers(world: ECSWorld, faction: FactionComponent, currentTotalDays: number): void {
    const wanderers = world.query([PositionComponent, HealthComponent]);

    if (isCivilFactionType(faction.type)) {
      // Tìm các tâm điểm Settlement hoặc lửa trại của thế lực dân sinh
      const settlementTargets: { pos: PositionComponent; settlementId?: string; radius: number }[] = [];

      for (const sid of faction.settlementIds) {
        const sEnt = FactionFactory.findSettlementEntity(world, sid);
        if (sEnt !== null) {
          const sPos = world.getComponent(sEnt, PositionComponent);
          const sComp = world.getComponent(sEnt, SettlementComponent);
          if (sPos && sComp) {
            settlementTargets.push({
              pos: sPos,
              settlementId: sComp.settlementId,
              radius: sComp.radiusPixels
            });
          }
        }
      }

      if (settlementTargets.length === 0) {
        for (const bEnt of world.query([PositionComponent, BuildingComponent])) {
          const bComp = world.getComponent(bEnt, BuildingComponent)!;
          if (
            !bComp.isRuins &&
            bComp.factionId === faction.factionId &&
            (bComp.buildingType === 'campfire' || bComp.buildingType === 'sect_hall')
          ) {
            settlementTargets.push({
              pos: world.getComponent(bEnt, PositionComponent)!,
              settlementId: bComp.settlementId,
              radius: faction.territoryRadius * 16
            });
            break;
          }
        }
      }

      if (settlementTargets.length === 0) return;

      for (const wEnt of wanderers) {
        if (!FactionFactory.isBeingSociallyEligible(world, wEnt)) continue;
        if (world.hasComponent(wEnt, FoundingIntentComponent)) continue;
        if (world.hasComponent(wEnt, ResidenceComponent)) continue;
        const existingMem = world.getComponent(wEnt, MemberComponent);
        if (existingMem) {
          if (existingMem.leaveCooldownUntilDays > currentTotalDays) continue;
          if (existingMem.factionId) continue;
        }

        const pos = world.getComponent(wEnt, PositionComponent)!;
        for (const target of settlementTargets) {
          if (Math.hypot(pos.x - target.pos.x, pos.y - target.pos.y) <= target.radius) {
            FactionFactory.assignMemberToFaction(
              world,
              wEnt,
              faction.factionId,
              'villager',
              `Định cư sinh sống tại [${faction.name}]`
            );
            if (target.settlementId) {
              FactionFactory.assignResidence(world, wEnt, target.settlementId, faction.factionId);
            }
            const name = world.getComponent(wEnt, NameComponent)?.name ?? 'Lưu dân';
            this.eventBus.emit('chronicle:entry', {
              category: 'recruitment',
              message: `🏡 [${name}] tìm thấy chốn an cư yên bình, đã định cư tại [${faction.name}]!`,
              importance: 'normal'
            });
            break;
          }
        }
      }
    } else {
      // Tông môn / Thánh địa tuyển đệ tử quanh Tông Môn Đại Điện
      const buildings = world.query([PositionComponent, BuildingComponent]);
      let hallPos: PositionComponent | null = null;

      for (const bEnt of buildings) {
        const bComp = world.getComponent(bEnt, BuildingComponent)!;
        if (!bComp.isRuins && bComp.factionId === faction.factionId && bComp.buildingType === 'sect_hall') {
          hallPos = world.getComponent(bEnt, PositionComponent)!;
          break;
        }
      }

      if (!hallPos) return;

      for (const wEnt of wanderers) {
        if (!FactionFactory.isBeingSociallyEligible(world, wEnt)) continue;
        if (world.hasComponent(wEnt, FoundingIntentComponent)) continue;

        const existingMem = world.getComponent(wEnt, MemberComponent);
        if (existingMem) {
          if (existingMem.leaveCooldownUntilDays > currentTotalDays) continue;
          if (existingMem.factionId === faction.factionId) continue;
          const prevFEnt = FactionFactory.findFactionEntity(world, existingMem.factionId);
          const prevFComp = prevFEnt !== null ? world.getComponent(prevFEnt, FactionComponent) : undefined;
          // Đã thuộc một tông môn/thánh địa khác hoặc đang làm thủ lĩnh làng/vương quốc thì không tự ý rời bỏ
          if (prevFComp && (isCultivationFactionType(prevFComp.type) || prevFComp.leaderEntityId === wEnt)) {
            continue;
          }
          // Cư dân bình thường của làng nếu không có linh căn thì không tự động biến thành đệ tử tông môn
          const root = world.getComponent(wEnt, SpiritualRootComponent);
          if (!root || !root.canCultivate() || root.rootType === 'none') {
            continue;
          }
        }

        const pos = world.getComponent(wEnt, PositionComponent)!;
        const dist = Math.hypot(pos.x - hallPos.x, pos.y - hallPos.y);

        if (dist <= faction.territoryRadius * 16) {
          // Lưu lại thông tin quê quán (nếu xuất thân từ một làng) để giữ ResidenceComponent và kết ước bảo hộ
          const resComp = world.getComponent(wEnt, ResidenceComponent);
          const homeSettlementId = resComp?.settlementId;
          const homeVillageFactionId = resComp?.factionId;

          FactionFactory.assignMemberToFaction(
            world,
            wEnt,
            faction.factionId,
            'outer_disciple',
            `Cảm nhận linh khí trù phú, bái nhập [${faction.name}]`
          );

          if (homeSettlementId && homeVillageFactionId && homeVillageFactionId !== faction.factionId) {
            this.getDiplomacy(world).establishProtectorate(
              world,
              faction.factionId,
              homeVillageFactionId,
              homeSettlementId
            );
          }

          const name = world.getComponent(wEnt, NameComponent)?.name ?? 'Tán tu';
          this.eventBus.emit('chronicle:entry', {
            category: 'breakthrough',
            message: `🌱 [${name}] cảm nhận linh khí trù phú, đã quy thuận gia nhập [${faction.name}]!`,
            importance: 'normal'
          });
        }
      }
    }
  }
}
