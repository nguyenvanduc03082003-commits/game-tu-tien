import assert from 'node:assert/strict';
import { ECSWorld } from '../src/ecs/World.ts';
import { WorldMap } from '../src/modules/world/WorldMap.ts';
import { QiGrid } from '../src/modules/energy/QiGrid.ts';
import { TerrainType } from '../src/config/terrains.config.ts';
import { WeatherType } from '../src/config/weather.config.ts';
import {
  CharacterStateComponent,
  CorpseComponent,
  CultivationTechniqueComponent,
  DailyScheduleComponent,
  HealthComponent,
  HungerComponent,
  LifespanComponent,
  MortalNeedsComponent,
  NameComponent,
  PositionComponent,
  RaceComponent,
  RealmComponent,
  SpiritualRootComponent
} from '../src/modules/beings/BeingComponents.ts';
import {
  AIBehaviorTreeComponent,
  AIPlannerComponent,
  AIStrategicBrainComponent
} from '../src/modules/ai/brain/AIComponents.ts';
import { StrategicGoalEvaluator } from '../src/modules/ai/brain/goals/StrategicGoal.ts';
import { BehaviorTreeExecutor } from '../src/modules/ai/brain/behavior/BehaviorTree.ts';
import { CommunityTaskBoard } from '../src/modules/ai/community/CommunityTaskBoard.ts';
import { SocialRelationshipComponent } from '../src/modules/social/SocialComponents.ts';
import {
  BuildingComponent,
  ConstructionSiteComponent,
  FactionComponent,
  FoundingIntentComponent,
  MemberComponent,
  ResidenceComponent,
  SettlementComponent,
  TerritoryCenterComponent
} from '../src/modules/factions/FactionComponents.ts';
import { FactionFactory } from '../src/modules/factions/FactionFactory.ts';
import { FactionSystem } from '../src/modules/factions/FactionSystem.ts';
import { DiplomacySystem } from '../src/modules/factions/DiplomacySystem.ts';
import { SaveManager } from '../src/modules/save/SaveManager.ts';
import { TimeManager } from '../src/core/TimeManager.ts';
import { SpatialGrid } from '../src/core/SpatialGrid.ts';
import { TribulationSystem } from '../src/modules/cultivation/TribulationSystem.ts';
import { CultivationSystem } from '../src/modules/cultivation/CultivationSystem.ts';
import { ThreeTierAISystem } from '../src/modules/ai/systems/ThreeTierAISystem.ts';
import { resetEntityIdCounter } from '../src/ecs/Entity.ts';
import { SmartObjectManager } from '../src/modules/ai/smartobjects/SmartObjectManager.ts';
import { AStarPathfinder } from '../src/modules/ai/pathfinding/AStar.ts';
import { EventBus } from '../src/core/EventBus.ts';

function finishSiteForCommitTest(world: ECSWorld, taskId: string): void {
  const task = CommunityTaskBoard.getInstance().getTask(taskId);
  assert.ok(task?.targetEntityId !== undefined, 'Task must have a construction site');
  const site = world.getComponent(task.targetEntityId, ConstructionSiteComponent);
  assert.ok(site, 'Construction site must exist');
  site.completedWorkTicks = site.requiredWorkTicks;
}

let passed = 0;
function test(name: string, fn: () => void): void {
  fn();
  passed++;
  console.log('PASS [Faction/Settlement]', name);
}

function createPlainsWorld(width = 64, height = 64): {
  world: ECSWorld;
  map: WorldMap;
  qiGrid: QiGrid;
  diplomacy: DiplomacySystem;
  factionSystem: FactionSystem;
} {
  CommunityTaskBoard.getInstance().clearAll();
  SmartObjectManager.getInstance().clear();
  FactionFactory.reset();
  AStarPathfinder.invalidateBuildingCache();

  const world = new ECSWorld();
  const map = new WorldMap(width, height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const tile = map.getTile(x, y);
      if (tile) {
        tile.terrain = TerrainType.PLAIN;
        tile.plantGrowth = 0.85;
        tile.moisture = 0.7;
      }
    }
  }
  if (width > 12 && height > 12) {
    map.setTerrain(12, 12, TerrainType.RIVER);
  }

  const qiGrid = new QiGrid(width, height);
  const diplomacy = new DiplomacySystem();
  const factionSystem = new FactionSystem();
  factionSystem.setContext(map, qiGrid, diplomacy, null);
  world.addSystem(factionSystem);

  return { world, map, qiGrid, diplomacy, factionSystem };
}

function spawnAdultWanderer(
  world: ECSWorld,
  name: string,
  x: number,
  y: number,
  age = 24,
  realmIndex = 0
): number {
  const id = world.createEntity();
  world.addComponent(id, new NameComponent(name));
  world.addComponent(id, new RaceComponent('human'));
  world.addComponent(id, new PositionComponent(x, y));
  world.addComponent(id, new HealthComponent(120));
  world.addComponent(id, new LifespanComponent(age, 90));
  world.addComponent(id, new HungerComponent(100));
  const needs = new MortalNeedsComponent(90, 90, 80);
  needs.rawFoodCount = 6;
  needs.cookedMealCount = 4;
  world.addComponent(id, needs);

  const realm = new RealmComponent('human', realmIndex, 1);
  realm.combatPower = realmIndex === 0 ? 15 : Math.pow(3, realmIndex) * 40;
  world.addComponent(id, realm);

  if (realmIndex > 0) {
    world.addComponent(
      id,
      new SpiritualRootComponent(true, 'true', 'Chân Linh Căn', ['Mộc', 'Hỏa', 'Thổ'], 80)
    );
  } else {
    world.addComponent(id, new SpiritualRootComponent(true, 'none', 'Vô Linh Căn', [], 0));
  }

  world.addComponent(id, new CharacterStateComponent());
  world.addComponent(id, new DailyScheduleComponent('builder', 0));
  world.addComponent(id, new SocialRelationshipComponent());
  world.addComponent(id, new AIStrategicBrainComponent('LABOUR_WORK'));
  world.addComponent(id, new AIPlannerComponent());
  world.addComponent(id, new AIBehaviorTreeComponent());
  return id;
}

function bondGroup(world: ECSWorld, ids: number[], affinity = 45): void {
  for (let i = 0; i < ids.length; i++) {
    const relA = world.getComponent(ids[i], SocialRelationshipComponent)!;
    for (let j = 0; j < ids.length; j++) {
      if (i === j) continue;
      const nameB = world.getComponent(ids[j], NameComponent)?.name ?? `Entity ${ids[j]}`;
      relA.setRelationship(ids[j], nameB, 'acquaintance', affinity, 30);
    }
  }
}

// ============================================================================
// SCENARIO 1 & 2: Autonomous Hamlet Founding & Group Founding Lock
// ============================================================================
test('1 & 2. Wanderers form a single founding group (group lock) and autonomously found a hamlet with campfire, settlement, and two-way membership', () => {
  const { world, map, qiGrid, factionSystem } = createPlainsWorld();
  const wanderers = [
    spawnAdultWanderer(world, 'Lý Đại', 320, 320),
    spawnAdultWanderer(world, 'Trần Nhị', 328, 320),
    spawnAdultWanderer(world, 'Vương Tam', 324, 328),
    spawnAdultWanderer(world, 'Phạm Tứ', 330, 326),
    spawnAdultWanderer(world, 'Hoàng Ngũ', 318, 324),
    spawnAdultWanderer(world, 'Lục Lục', 322, 322),
    spawnAdultWanderer(world, 'Thất Thất', 326, 324),
    spawnAdultWanderer(world, 'Bát Bát', 324, 320),
    spawnAdultWanderer(world, 'Cửu Cửu', 328, 326),
    spawnAdultWanderer(world, 'Thập Thập', 320, 326)
  ];
  bondGroup(world, wanderers, 50);

  // Step 1: Scan creates founding intent on exactly ONE initiator; others join as participants (Group Lock), selects site, and creates founding campfire task
  factionSystem.runAutonomousFoundingScan(world);
  const intentEntities = world.query([FoundingIntentComponent]);
  assert.equal(intentEntities.length, 1, 'Group founding lock must prevent multiple overlapping FoundingIntentComponents');

  const initiatorId = intentEntities[0];
  const intent = world.getComponent(initiatorId, FoundingIntentComponent)!;
  assert.equal(intent.intentType, 'hamlet');
  assert.ok(intent.participantIds.size >= 3, 'Initiator should gather at least 3 participants');
  assert.equal(intent.stage, 'building');
  assert.ok(intent.taskId !== null, 'Founding task ID must be assigned');
  assert.equal(intent.resourcesReserved, true, 'Founding resources must be marked reserved on task creation');

  // Verify StrategicGoal prioritizes LABOUR_WORK (84.5) for active founding intent
  const brain = world.getComponent(initiatorId, AIStrategicBrainComponent)!;
  StrategicGoalEvaluator.evaluate(world, initiatorId, brain, map, qiGrid, WeatherType.CLEAR, 0.5);
  assert.equal(brain.currentGoal, 'LABOUR_WORK');
  assert.equal(brain.utilityScores.LABOUR_WORK, 84.5);

  // Step 2: Complete the founding task via CommunityTaskBoard
  const board = CommunityTaskBoard.getInstance();
  const task = board.getTask(intent.taskId!);
  assert.ok(task, 'Founding campfire task must exist on board');
  finishSiteForCommitTest(world, intent.taskId!);
  board.completeTask(world, initiatorId, intent.taskId!);

  // Verify hamlet, settlement, territory center, and campfire were created
  const factions = world.query([FactionComponent]);
  assert.equal(factions.length, 1, 'Exactly one hamlet faction should be created');
  const hamletFaction = world.getComponent(factions[0], FactionComponent)!;
  assert.equal(hamletFaction.type, 'hamlet');
  assert.equal(hamletFaction.leaderEntityId, initiatorId);
  assert.equal(hamletFaction.getLeaderTitle(), 'Thôn Trưởng');

  const settlements = world.query([SettlementComponent, TerritoryCenterComponent]);
  assert.equal(settlements.length, 1, 'Settlement entity with TerritoryCenterComponent must be created');
  const settlement = world.getComponent(settlements[0], SettlementComponent)!;
  assert.equal(settlement.stage, 'hamlet');
  assert.equal(settlement.factionId, hamletFaction.id);

  // Verify two-way membership and residence for all participants
  for (const pid of wanderers) {
    const member = world.getComponent(pid, MemberComponent);
    const residence = world.getComponent(pid, ResidenceComponent);
    assert.ok(member, `Participant ${pid} must have MemberComponent`);
    assert.ok(residence, `Participant ${pid} must have ResidenceComponent`);
    assert.equal(member!.factionId, hamletFaction.id);
    assert.equal(residence!.settlementId, settlement.id);
    assert.ok(hamletFaction.members.has(pid));
    assert.ok(settlement.residentIds.has(pid));
  }

  const initiatorMember = world.getComponent(initiatorId, MemberComponent)!;
  assert.equal(initiatorMember.role, 'village_head');
  assert.equal(initiatorMember.getRoleName(hamletFaction.type), 'Thôn Trưởng');
});

// ============================================================================
// SCENARIO 3: Unreachable Site Cancellation & Single Resource Refund
// ============================================================================
test('3. Unreachable founding/building task cancels cleanly and refunds reserved resources exactly once', () => {
  const { world, map } = createPlainsWorld();
  const builder = spawnAdultWanderer(world, 'Triệu Lục', 100, 100);
  const { factionId, entityId: fEnt } = FactionFactory.createFaction(world, 'hamlet', 10, 10, {
    customName: 'Thôn Khai Sơn',
    founderEntityId: builder,
    leaderEntityId: builder
  });
  const { settlementId } = FactionFactory.createSettlement(world, 'Thôn Khai Sơn', 'hamlet', 10, 10, factionId, builder);
  FactionFactory.assignMemberToFaction(world, builder, factionId, 'village_head', 'Lập thôn', 0);
  FactionFactory.assignResidence(world, builder, settlementId, factionId);

  const fComp = world.getComponent(fEnt, FactionComponent)!;
  fComp.woodStock = 20;
  fComp.foodStock = 15;
  fComp.reservedResources = { food: 0, wood: 0, stone: 0, spiritStones: 0 };

  const intent = new FoundingIntentComponent('hamlet', 'building', 'Mở rộng thôn xóm', 60, [builder]);
  world.addComponent(builder, intent);

  const board = CommunityTaskBoard.getInstance();
  const task = board.createTask(
    {
      type: 'build_thatched_hut',
      title: 'Dựng Lều Tranh',
      targetPos: { x: 55 * 16 + 8, y: 55 * 16 + 8 },
      preferredJob: 'builder',
      priority: 95,
      duration: 3.5,
      settlementId,
      payerFactionId: factionId,
      founderEntityId: builder,
      foundingIntentId: `intent_${builder}`,
      reservedCost: { food: 3, wood: 6, stone: 0, spiritStones: 0 }
    },
    world
  );
  assert.ok(task, 'Task should be created and reserve resources from faction stockpile');
  intent.taskId = task!.id;
  intent.resourcesReserved = true;

  // Resources were deducted on reservation (20 - 6 = 14 wood, 15 - 3 = 12 food)
  assert.equal(fComp.woodStock, 14);
  assert.equal(fComp.foodStock, 12);
  assert.equal(fComp.reservedResources.wood, 6);
  assert.equal(fComp.reservedResources.food, 3);

  // Claim task and simulate travel timeout failure in BehaviorTreeExecutor
  board.claimBestTask(builder, world.getComponent(builder, PositionComponent)!, 'builder', world);
  const planner = world.getComponent(builder, AIPlannerComponent)!;
  const bt = world.getComponent(builder, AIBehaviorTreeComponent)!;
  planner.planStatus = 'executing';
  planner.currentPlanGoal = 'LABOUR_WORK';
  planner.steps = [
    { type: 'MOVE_TO', description: 'Tới công trường bị cô lập trên đảo', targetPos: { x: 888, y: 888 } },
    { type: 'PERFORM_WORK', description: 'Dựng lều tranh', duration: 3, customData: { communityTaskId: task!.id } }
  ];
  planner.stepElapsedTimer = 14; // Exceeds 12s travel timeout

  BehaviorTreeExecutor.tick(world, builder, bt, planner, map, 0.1);
  assert.equal(planner.planStatus, 'failed');

  // Verify task was cancelled and resources refunded ONCE
  const taskAfter = board.getTask(task!.id);
  assert.equal(taskAfter, undefined, 'Cancelled task must be removed from active board');
  assert.equal(fComp.woodStock, 20, 'Wood must be refunded after task failure');
  assert.equal(fComp.foodStock, 15, 'Food must be refunded after task failure');
  assert.equal(fComp.reservedResources.wood, 0);
  assert.equal(world.hasComponent(builder, FoundingIntentComponent), false, 'Cancelled founding intent should be removed');

  // Calling cancelTask again must NOT double-refund
  board.cancelTask(world, task!.id, 'Duplicate cancel check');
  assert.equal(fComp.woodStock, 20, 'Wood must NOT be double-refunded');
  assert.equal(fComp.foodStock, 15, 'Food must NOT be double-refunded');
});

// ============================================================================
// SCENARIO 4: Two-Settlement Isolation (No factions[0] Default Ownership)
// ============================================================================
test('4. Two independent settlements create and complete tasks for their own factionId and settlementId without cross-claiming or factions[0] fallback', () => {
  const { world } = createPlainsWorld();

  // Create Faction A & Settlement A
  const resA = spawnAdultWanderer(world, 'Dân Thôn A', 160, 160);
  const { factionId: factionIdA } = FactionFactory.createFaction(world, 'hamlet', 10, 10, {
    customName: 'Thôn Thanh Bình',
    founderEntityId: resA,
    leaderEntityId: resA
  });
  const { settlementId: settlementIdA } = FactionFactory.createSettlement(world, 'Thôn Thanh Bình', 'hamlet', 10, 10, factionIdA, resA);
  FactionFactory.assignMemberToFaction(world, resA, factionIdA, 'village_head', 'Lập thôn A', 0);
  FactionFactory.assignResidence(world, resA, settlementIdA, factionIdA);

  // Create Faction B & Settlement B
  const resB = spawnAdultWanderer(world, 'Dân Thôn B', 640, 640);
  const { factionId: factionIdB, entityId: factionEntB } = FactionFactory.createFaction(world, 'hamlet', 40, 40, {
    customName: 'Thôn Bạch Vân',
    founderEntityId: resB,
    leaderEntityId: resB
  });
  const { settlementId: settlementIdB } = FactionFactory.createSettlement(world, 'Thôn Bạch Vân', 'hamlet', 40, 40, factionIdB, resB);
  FactionFactory.assignMemberToFaction(world, resB, factionIdB, 'village_head', 'Lập thôn B', 0);
  FactionFactory.assignResidence(world, resB, settlementIdB, factionIdB);

  const fCompB = world.getComponent(factionEntB, FactionComponent)!;
  fCompB.woodStock = 30;
  fCompB.foodStock = 30;

  const board = CommunityTaskBoard.getInstance();
  const taskB = board.createTask(
    {
      type: 'build_thatched_hut',
      title: 'Dựng nhà dân cho Thôn Bạch Vân',
      targetPos: { x: 40 * 16 + 16, y: 40 * 16 },
      preferredJob: 'builder',
      priority: 80,
      duration: 3.5,
      settlementId: settlementIdB,
      payerFactionId: factionIdB
    },
    world
  );
  assert.ok(taskB);

  // Resident of A must NOT be able to claim Settlement B's internal task
  const claimedByA = board.claimBestTask(resA, world.getComponent(resA, PositionComponent)!, 'builder', world);
  assert.equal(claimedByA, null, 'Resident of Settlement A must not claim Settlement B internal task');

  // Resident of B claims and completes Settlement B's task
  const claimedByB = board.claimBestTask(resB, world.getComponent(resB, PositionComponent)!, 'builder', world);
  assert.ok(claimedByB);
  assert.equal(claimedByB!.id, taskB!.id);
  finishSiteForCommitTest(world, taskB!.id);
  board.completeTask(world, resB, taskB!.id);

  // Find the newly spawned thatched_hut and verify it belongs to factionIdB and settlementIdB (NOT factionIdA / factions[0])
  const buildings = world.query([BuildingComponent]);
  const houseEnt = buildings.find(b => world.getComponent(b, BuildingComponent)!.buildingType === 'thatched_hut');
  assert.ok(houseEnt !== undefined, 'thatched_hut must be spawned');
  const houseComp = world.getComponent(houseEnt!, BuildingComponent)!;
  assert.equal(houseComp.factionId, factionIdB, 'Building must belong to Faction B, not factions[0]');
  assert.equal(houseComp.settlementId, settlementIdB, 'Building must belong to Settlement B');
});

// ============================================================================
// SCENARIO 5: Village Recruitment & Social Eligibility Filter
// ============================================================================
test('5. Village recruits eligible adult wanderers while excluding children (<12), unawakened beasts, and corpses', () => {
  const { world, factionSystem } = createPlainsWorld();

  const head = spawnAdultWanderer(world, 'Lý Trưởng', 320, 320);
  const { factionId, entityId: fEnt } = FactionFactory.createFaction(world, 'village', 20, 20, {
    customName: 'Làng An Lạc',
    founderEntityId: head,
    leaderEntityId: head
  });
  const { settlementId } = FactionFactory.createSettlement(world, 'Làng An Lạc', 'village', 20, 20, factionId, head);
  FactionFactory.assignMemberToFaction(world, head, factionId, 'village_head', 'Khai lập làng', 0);
  FactionFactory.assignResidence(world, head, settlementId, factionId);

  // Spawn campfire + 2 thatched huts so housing capacity > current residents
  FactionFactory.spawnBuilding(world, 'campfire', factionId, 20 * 16, 20 * 16, settlementId, { instant: true });
  FactionFactory.spawnBuilding(world, 'thatched_hut', factionId, 22 * 16, 20 * 16, settlementId, { instant: true });
  FactionFactory.spawnBuilding(world, 'thatched_hut', factionId, 18 * 16, 20 * 16, settlementId, { instant: true });
  const fComp = world.getComponent(fEnt, FactionComponent)!;
  fComp.foodStock = 100;
  fComp.stability = 80;

  // 1) Eligible adult wanderer near village
  const adultWanderer = spawnAdultWanderer(world, 'Lưu Dân Trưởng Thành', 330, 325, 22);
  // 2) Child (< 12 years old)
  const childEntity = spawnAdultWanderer(world, 'Đứa Trẻ Nhỏ', 325, 322, 7);
  // 3) Unawakened wild beast (race = beast, realmIndex = 0)
  const beastEntity = spawnAdultWanderer(world, 'Dã Thú Hoang Dã', 326, 326, 18, 0);
  world.getComponent(beastEntity, RaceComponent)!.raceId = 'beast';
  // 4) Corpse entity
  const corpseEntity = spawnAdultWanderer(world, 'Thi Thể', 322, 322, 30, 0);
  world.addComponent(corpseEntity, new CorpseComponent('Thi Thể', 'human', 0, 'Phàm Nhân', 1, 1, 1, 'Tử nạn', 10));

  assert.equal(FactionFactory.isBeingSociallyEligible(world, adultWanderer), true);
  assert.equal(FactionFactory.isBeingSociallyEligible(world, childEntity), false);
  assert.equal(FactionFactory.isBeingSociallyEligible(world, beastEntity), false);
  assert.equal(FactionFactory.isBeingSociallyEligible(world, corpseEntity), false);

  factionSystem.runRecruitmentPass(world, 0);

  assert.equal(world.getComponent(adultWanderer, MemberComponent)?.factionId, factionId, 'Adult wanderer should be recruited into village');
  assert.equal(world.getComponent(adultWanderer, ResidenceComponent)?.settlementId, settlementId, 'Adult wanderer should receive village residence');
  assert.equal(world.hasComponent(childEntity, MemberComponent), false, 'Child (<12) must not be recruited as independent faction member');
  assert.equal(world.hasComponent(beastEntity, MemberComponent), false, 'Unawakened wild beast must not be recruited');
  assert.equal(world.hasComponent(corpseEntity, MemberComponent), false, 'Corpse must not be recruited');
});

// ============================================================================
// SCENARIO 6: Cultivator from a Village Founds a Sect + Protectorate Treaty
// ============================================================================
test('6. Cultivator from a village founds a sect at a Qi site, keeps home village residence, preserves village autonomy, and establishes protectorate', () => {
  const { world, qiGrid, diplomacy, factionSystem } = createPlainsWorld();

  // Create Home Village at (15, 15)
  const villageHead = spawnAdultWanderer(world, 'Lý Trưởng Làng Mây', 240, 240, 45, 0);
  const { factionId: villageFactionId, entityId: villageFactionEnt } = FactionFactory.createFaction(world, 'village', 15, 15, {
    customName: 'Làng Thanh Vân',
    founderEntityId: villageHead,
    leaderEntityId: villageHead
  });
  const { settlementId: villageSettlementId } = FactionFactory.createSettlement(
    world,
    'Làng Thanh Vân',
    'village',
    15 * 16,
    15 * 16,
    villageFactionId,
    villageHead
  );
  FactionFactory.assignMemberToFaction(world, villageHead, villageFactionId, 'village_head', 'Giữ làng', 0);
  FactionFactory.assignResidence(world, villageHead, villageSettlementId, villageFactionId);

  // Create a high-Qi spirit vein around tile (42, 42)
  for (let dy = -3; dy <= 3; dy++) {
    for (let dx = -3; dx <= 3; dx++) {
      const qt = qiGrid.getTile(42 + dx, 42 + dy);
      if (qt) {
        qt.density = 260;
        qt.isSpiritVein = true;
      }
    }
  }

  // Founder cultivator (realmIndex = 3, has technique, lives in Làng Thanh Vân)
  const founder = spawnAdultWanderer(world, 'Vân Đạo Nhân', 42 * 16, 42 * 16, 35, 3);
  const techComp = new CultivationTechniqueComponent(
    'thanh_van_kiem_quyet',
    'Thanh Vân Kiếm Quyết',
    2,
    'KIM' as any,
    'Kiếm quyết trấn phái',
    'ngo_dao',
    'Tự Sáng Tạo',
    'tieu_thanh',
    400
  );
  world.addComponent(founder, techComp);
  FactionFactory.assignMemberToFaction(world, founder, villageFactionId, 'villager', 'Xuất thân từ làng', 0);
  FactionFactory.assignResidence(world, founder, villageSettlementId, villageFactionId);

  // 49 Cultivator followers (realmIndex >= 1)
  const disciples: number[] = [];
  for (let i = 0; i < 49; i++) {
    disciples.push(spawnAdultWanderer(world, `Đệ Tử ${i}`, 42 * 16 + (i % 6) * 4, 42 * 16 + Math.floor(i / 6) * 4, 20, 1));
  }
  bondGroup(world, [founder, ...disciples], 55);

  // Step 1: Scan creates sect founding intent, selects high-Qi site, and dispatches found_sect_hall task
  factionSystem.runAutonomousFoundingScan(world);
  const intent = world.getComponent(founder, FoundingIntentComponent);
  assert.ok(intent, 'Cultivator founder should create FoundingIntentComponent');
  assert.equal(intent!.intentType, 'sect');
  assert.equal(intent!.stage, 'building');
  assert.ok(intent!.taskId);

  // Step 2: Complete found_sect_hall task
  const board = CommunityTaskBoard.getInstance();
  finishSiteForCommitTest(world, intent!.taskId!);
  board.completeTask(world, founder, intent!.taskId!);

  // Verify new Sect was created
  const founderMember = world.getComponent(founder, MemberComponent)!;
  assert.notEqual(founderMember.factionId, villageFactionId, 'Founder political/sect membership must switch to new sect');
  assert.equal(founderMember.role, 'sect_master');

  const sectEnt = FactionFactory.findFactionEntity(world, founderMember.factionId)!;
  const sectComp = world.getComponent(sectEnt, FactionComponent)!;
  assert.equal(sectComp.type, 'sect');
  assert.equal(sectComp.getLeaderTitle(), 'Chưởng Môn');

  // Verify disciples inherited founder's technique
  for (const dId of disciples) {
    const dTech = world.getComponent(dId, CultivationTechniqueComponent);
    assert.ok(dTech && dTech.techniqueId === 'thanh_van_kiem_quyet', `Disciple ${dId} should inherit founder's technique`);
  }

  // Verify founder KEPT home village ResidenceComponent
  const founderResidence = world.getComponent(founder, ResidenceComponent)!;
  assert.equal(founderResidence.settlementId, villageSettlementId, 'Founder must retain home village ResidenceComponent');

  // Verify home village is still a village with its village_head
  const villageComp = world.getComponent(villageFactionEnt, FactionComponent)!;
  assert.equal(villageComp.type, 'village', 'Home village must NOT be converted into a sect');
  assert.equal(villageComp.leaderEntityId, villageHead, 'Home village must keep its village_head');

  // Verify protectorate relationship between sect and home village
  assert.equal(diplomacy.isProtectorOf(sectComp.id, villageFactionId), true);
  assert.ok(sectComp.protectedSettlementIds.includes(villageSettlementId));
  assert.equal(villageComp.protectorFactionId, sectComp.id);
});

// ============================================================================
// SCENARIO 7: Holy Land Anti-Inflation Guard + Civil & Sect Progression
// ============================================================================
test('7. Holy Land anti-inflation guard prevents 1-member or civil factions from becoming holy_land, while valid sect and civil progressions succeed', () => {
  const { world, qiGrid, diplomacy, factionSystem } = createPlainsWorld();

  // Case A: 1-member sect with a very high realm cultivator (realmIndex = 6) must NOT become holy_land
  const loneSupreme = spawnAdultWanderer(world, 'Độc Cô Cầu Bại', 160, 160, 120, 6);
  const { factionId: smallSectId, entityId: smallSectEnt } = FactionFactory.createFaction(world, 'sect', 10, 10, {
    customName: 'Cô Vân Phái',
    founderEntityId: loneSupreme,
    leaderEntityId: loneSupreme
  });
  FactionFactory.assignMemberToFaction(world, loneSupreme, smallSectId, 'sect_master', 'Độc tu', 0);
  const smallSect = world.getComponent(smallSectEnt, FactionComponent)!;
  smallSect.spiritStones = 9999;
  smallSect.stability = 100;
  smallSect.stageStableDays = 5000;

  factionSystem.evaluateAllProgressions(world, 90);
  assert.equal(smallSect.type, 'sect', 'A 1-member sect must NEVER upgrade to holy_land regardless of leader realm');

  // Case B: A valid sect meeting all holy_land requirements (200 members, >=3 tier-4+ cultivators, spirit vein, defense_array, herb_garden, alchemy_chamber, 3-year stability)
  const grandMaster = spawnAdultWanderer(world, 'Thái Thượng Giáo Chủ', 480, 480, 200, 5);
  const { factionId: bigSectId, entityId: bigSectEnt } = FactionFactory.createFaction(world, 'sect', 30, 30, {
    customName: 'Thái Thanh Tông',
    founderEntityId: grandMaster,
    leaderEntityId: grandMaster
  });
  FactionFactory.assignMemberToFaction(world, grandMaster, bigSectId, 'sect_master', 'Khai sơn', 0);
  for (let i = 0; i < 199; i++) {
    const m = spawnAdultWanderer(world, `Môn Đồ ${i}`, 480, 480, 30, i < 3 ? 4 : 2);
    FactionFactory.assignMemberToFaction(world, m, bigSectId, i < 3 ? 'elder' : 'inner_disciple', 'Nhập môn', 0);
  }
  const veinTile = qiGrid.getTile(30, 30)!;
  veinTile.density = 260;
  veinTile.isSpiritVein = true;

  FactionFactory.spawnBuilding(world, 'sect_hall', bigSectId, 30 * 16, 30 * 16, undefined, { instant: true });
  FactionFactory.spawnBuilding(world, 'defense_array', bigSectId, 31 * 16, 30 * 16, undefined, { instant: true });
  FactionFactory.spawnBuilding(world, 'herb_garden', bigSectId, 29 * 16, 30 * 16, undefined, { instant: true });
  FactionFactory.spawnBuilding(world, 'alchemy_chamber', bigSectId, 30 * 16, 31 * 16, undefined, { instant: true });

  const bigSect = world.getComponent(bigSectEnt, FactionComponent)!;
  bigSect.spiritStones = 800;
  bigSect.stability = 90;
  bigSect.stageStableDays = 1080; // 3 full game years

  factionSystem.evaluateAllProgressions(world, 30);
  assert.equal(bigSect.type, 'holy_land', 'Sect meeting all strict criteria and 3-year stability should upgrade to holy_land');
  assert.equal(bigSect.rank, 'thanh_dia');
  assert.equal(bigSect.getLeaderTitle(), 'Thánh Chủ');

  // Case C: Subordination cycle guard
  assert.equal(diplomacy.establishVassalage(world, 'kingdom_A', 'village_B'), true);
  assert.equal(diplomacy.establishVassalage(world, 'village_B', 'kingdom_A'), false, 'Subordination cycle must be rejected');
});

// ============================================================================
// SCENARIO 8: Decline Recovery Hysteresis & Dissolution into Unowned Ruins
// ============================================================================
test('8. Decline hysteresis cancels demotion when population recovers in time, and full collapse leaves unowned ruins', () => {
  const { world, factionSystem } = createPlainsWorld();

  const leader = spawnAdultWanderer(world, 'Lý Trưởng Tân Thôn', 320, 320);
  const { factionId, entityId: fEnt } = FactionFactory.createFaction(world, 'village', 20, 20, {
    customName: 'Làng Phong Vũ',
    founderEntityId: leader,
    leaderEntityId: leader
  });
  const { settlementId, entityId: sEnt } = FactionFactory.createSettlement(
    world,
    'Làng Phong Vũ',
    'village',
    20 * 16,
    20 * 16,
    factionId,
    leader
  );
  const bldEnt = FactionFactory.spawnBuilding(world, 'thatched_hut', factionId, 20 * 16, 20 * 16, settlementId, { instant: true });
  FactionFactory.assignMemberToFaction(world, leader, factionId, 'village_head', 'Lập làng', 0);
  FactionFactory.assignResidence(world, leader, settlementId, factionId);

  const fComp = world.getComponent(fEnt, FactionComponent)!;
  fComp.stability = 75;
  fComp.foodStock = 100;

  // Currently only 1 member (<5 minRetainPopulation for village) -> first evaluation starts decline timer
  factionSystem.evaluateAllProgressions(world, 30);
  assert.notEqual(fComp.declineSinceDays, null, 'Decline timer should start when below village threshold');
  assert.equal(fComp.type, 'village', 'Should not demote immediately before grace period');

  // Recover population to 12 members (>= 10 declineMinResidents) before 90-day grace period expires
  for (let i = 0; i < 11; i++) {
    const villager = spawnAdultWanderer(world, `Dân Làng ${i}`, 320, 320);
    FactionFactory.assignMemberToFaction(world, villager, factionId, 'villager', 'Đoàn tụ', 10);
    FactionFactory.assignResidence(world, villager, settlementId, factionId);
  }
  factionSystem.evaluateAllProgressions(world, 50);
  assert.equal(fComp.declineSinceDays, null, 'Recovery before 90 days must clear declineSinceDays timer');
  assert.equal(fComp.type, 'village');

  // Now dissolve the faction and verify buildings become unowned ruins and members become wanderers
  factionSystem.dissolveFaction(world, fEnt, fComp, 'Thiên tai đại hồng thủy');
  assert.equal(FactionFactory.findFactionEntity(world, factionId), null, 'Dissolved faction entity must be removed');
  assert.equal(world.hasComponent(leader, MemberComponent), false, 'Survivors must become wanderers without MemberComponent');

  const bldComp = world.getComponent(bldEnt, BuildingComponent)!;
  assert.equal(bldComp.isRuins, true, 'Buildings of dissolved faction must become ruins');
  assert.equal(bldComp.factionId, '', 'Ruined buildings must be unowned');

  const sComp = world.getComponent(sEnt, SettlementComponent)!;
  assert.equal(sComp.stage, 'ruins');
  assert.equal(sComp.ownerFactionId, '');
});

// ============================================================================
// SCENARIO 9: Save/Load Round-Trip & Legacy Save Migration
// ============================================================================
test('9. Save/Load preserves settlements, residences, founding intents, treaties, and migrates legacy saves safely', () => {
  const { world, map, qiGrid, diplomacy, factionSystem } = createPlainsWorld(16, 16);
  const spatialGrid = new SpatialGrid(32);
  const tribulationSystem = new TribulationSystem();
  const cultivationSystem = new CultivationSystem(map, qiGrid, tribulationSystem);
  const threeTierAISystem = new ThreeTierAISystem(map, qiGrid);
  threeTierAISystem.spatialGrid = spatialGrid;

  const createEngineWrapper = (w: ECSWorld, m: WorldMap, q: QiGrid, d: DiplomacySystem, f: FactionSystem) =>
    ({
      world: w,
      worldMap: m,
      qiGrid: q,
      camera: { x: 50, y: 50, zoom: 1.5 },
      timeManager: TimeManager.getInstance(),
      spatialGrid,
      tribulationSystem,
      cultivationSystem,
      threeTierAISystem,
      diplomacySystem: d,
      factionSystem: f,
      worldName: 'Test Thế Giới',
      worldTemplate: 'thap_van_dai_son',
      worldSeed: 12345,
      resetWorldState() {
        this.world.clearEntities();
        this.spatialGrid.clear();
        resetEntityIdCounter();
        this.tribulationSystem?.clear();
        this.threeTierAISystem?.reset();
        this.cultivationSystem?.reset();
        this.diplomacySystem?.clear();
        FactionFactory.reset();
        SmartObjectManager.getInstance().clear();
        CommunityTaskBoard.getInstance().clear();
        AStarPathfinder.invalidateBuildingCache();
        EventBus.getInstance().emit('world:reset');
      }
    }) as any;

  const leader = spawnAdultWanderer(world, 'Trưởng Làng Cổ', 80, 80);
  const { factionId, entityId: fEnt } = FactionFactory.createFaction(world, 'village', 5, 5, {
    customName: 'Làng Cổ Thạch',
    founderEntityId: leader,
    leaderEntityId: leader
  });
  const { settlementId } = FactionFactory.createSettlement(
    world,
    'Làng Cổ Thạch',
    'village',
    5 * 16,
    5 * 16,
    factionId,
    leader
  );
  FactionFactory.assignMemberToFaction(world, leader, factionId, 'village_head', 'Tổ tiên truyền lại', 0);
  FactionFactory.assignResidence(world, leader, settlementId, factionId);

  const fComp = world.getComponent(fEnt, FactionComponent)!;
  fComp.foodStock = 145;
  fComp.woodStock = 65;
  fComp.stoneStock = 40;
  fComp.treasury = 90;
  fComp.stageStableDays = 120;

  const wandererWithIntent = spawnAdultWanderer(world, 'Kẻ Khai Hoang', 120, 120);
  const intent = new FoundingIntentComponent('hamlet', 'gathering', 'Tìm đất mới', 60, [wandererWithIntent]);
  world.addComponent(wandererWithIntent, intent);

  diplomacy.establishProtectorate(world, 'sect_ancient', factionId, settlementId);

  const engine1 = createEngineWrapper(world, map, qiGrid, diplomacy, factionSystem);
  const pendingTask = CommunityTaskBoard.getInstance().createTask({
    type: 'build_thatched_hut', title: 'Nhà đang xây', targetPos: { x: 80, y: 80 },
    preferredJob: 'builder', priority: 60, duration: 5, settlementId, payerFactionId: factionId
  }, world)!;
  assert.equal(fComp.woodStock, 55);
  assert.equal(fComp.reservedResources.wood, 10);
  const buildingFounder = spawnAdultWanderer(world, 'Đang khai hoang', 150, 150);
  const buildingIntent = new FoundingIntentComponent('hamlet', 'building', 'Xây dở', 60, [buildingFounder]);
  buildingIntent.taskId = 'task_missing_after_load';
  world.addComponent(buildingFounder, buildingIntent);
  const saveData = SaveManager.serializeWorld(engine1, 'test_faction_save', 'slot_test');
  assert.ok(saveData.treaties);
  assert.equal(saveData.treaties!.protectorates![factionId], 'sect_ancient');
  assert.equal(saveData.treaties!.protectorates![settlementId], 'sect_ancient');

  // Deserialize into a fresh engine/world
  const world2 = new ECSWorld();
  const map2 = new WorldMap(16, 16);
  const qi2 = new QiGrid(16, 16);
  const diplomacy2 = new DiplomacySystem();
  const factionSystem2 = new FactionSystem();
  factionSystem2.setContext(map2, qi2, diplomacy2, null);
  world2.addSystem(factionSystem2);
  const engine2 = createEngineWrapper(world2, map2, qi2, diplomacy2, factionSystem2);

  SaveManager.deserializeWorld(engine2, saveData);

  const loadedFEnt = FactionFactory.findFactionEntity(world2, factionId)!;
  const loadedFComp = world2.getComponent(loadedFEnt, FactionComponent)!;
  assert.equal(loadedFComp.type, 'village');
  assert.equal(loadedFComp.foodStock, 145);
  assert.equal(loadedFComp.woodStock, 55);
  assert.equal(loadedFComp.reservedResources.wood, 10, 'Construction site preserves reserved wood');
  const restoredTasks = CommunityTaskBoard.getInstance().getAllTasks();
  assert.equal(restoredTasks.length, 1, 'Restored construction task must be present');
  CommunityTaskBoard.getInstance().cancelTask(world2, restoredTasks[0].id);
  assert.equal(loadedFComp.woodStock, 65, 'Cancelling restored task refunds reserved wood');
  assert.equal(loadedFComp.reservedResources.wood, 0);
  assert.equal(CommunityTaskBoard.getInstance().cancelTask(world2, pendingTask.id), false);
  assert.equal(loadedFComp.woodStock, 65, 'Repeated cancellation must not refund twice');
  assert.equal(world2.hasComponent(buildingFounder, FoundingIntentComponent), false);
  assert.equal(saveData.entities.find(e => e.id === fEnt)!.components.faction.woodStock, 55,
    'Loading must not mutate the original save');
  assert.equal(loadedFComp.treasury, 90);
  assert.equal(loadedFComp.leaderEntityId, leader);

  const loadedRes = world2.getComponent(leader, ResidenceComponent)!;
  assert.equal(loadedRes.settlementId, settlementId);
  assert.equal(loadedRes.homeRole, 'head');

  const loadedIntent = world2.getComponent(wandererWithIntent, FoundingIntentComponent)!;
  assert.equal(loadedIntent.intentType, 'hamlet');
  assert.equal(loadedIntent.reason, 'Tìm đất mới');
  assert.equal(diplomacy2.isProtectorOf('sect_ancient', factionId), true);

  const secondSave = SaveManager.serializeWorld(engine2, 'reload', 'slot_test');
  SaveManager.deserializeWorld(engine2, secondSave);
  assert.equal(world2.getComponent(loadedFEnt, FactionComponent)!.woodStock, 65,
    'Saving and loading again must not duplicate refunds');

  // Test Legacy Save Migration: simulate an old save where a 1-member faction had rank='thanh_dia' and no settlements exist
  const legacySave = JSON.parse(JSON.stringify(saveData));
  delete legacySave.treaties;
  legacySave.entities = legacySave.entities.filter((e: any) => !e.components.settlement);
  for (const ent of legacySave.entities) {
    delete ent.components.residence;
    if (ent.components.faction) {
      ent.components.faction.type = 'sect';
      ent.components.faction.rank = 'thanh_dia'; // Legacy inflated rank with only 1 member
      delete ent.components.faction.settlementIds;
    }
  }

  const world3 = new ECSWorld();
  const map3 = new WorldMap(16, 16);
  const qi3 = new QiGrid(16, 16);
  const diplomacy3 = new DiplomacySystem();
  const factionSystem3 = new FactionSystem();
  factionSystem3.setContext(map3, qi3, diplomacy3, null);
  world3.addSystem(factionSystem3);
  const engine3 = createEngineWrapper(world3, map3, qi3, diplomacy3, factionSystem3);

  SaveManager.deserializeWorld(engine3, legacySave);
  const migratedFEnt = FactionFactory.findFactionEntity(world3, factionId)!;
  const migratedFComp = world3.getComponent(migratedFEnt, FactionComponent)!;
  assert.equal(migratedFComp.type, 'sect', 'Legacy save migration must keep 1-member faction as sect, not holy_land');
  assert.notEqual(migratedFComp.rank, 'thanh_dia', 'Legacy save migration must downgrade 1-member thanh_dia rank');
});

test('10. Autonomous peaceful merge transfers settlement, residents, buildings and reserved stock before deleting source', () => {
  const { world, factionSystem } = createPlainsWorld();
  const main = FactionFactory.createFaction(world, { type: 'village', name: 'Làng lớn' });
  const source = FactionFactory.createFaction(world, { type: 'hamlet', name: 'Làng nhỏ' });
  FactionFactory.createSettlement(world, 'Làng lớn', 'village', 6, 6, main.factionId);
  const village = FactionFactory.createSettlement(world, 'Làng nhỏ', 'hamlet', 12, 6, source.factionId);
  for (let i = 0; i < 45; i++) {
    FactionFactory.assignMemberToFaction(world, spawnAdultWanderer(world, `Dân ${i}`, 96, 96), main.factionId, 'villager');
  }
  const citizen = spawnAdultWanderer(world, 'Dân làng nhỏ', 192, 96);
  FactionFactory.assignMemberToFaction(world, citizen, source.factionId, 'villager');
  const sect = FactionFactory.createFaction(world, { type: 'sect', name: 'Tông môn' });
  const disciple = spawnAdultWanderer(world, 'Đệ tử ở quê', 192, 96);
  FactionFactory.assignMemberToFaction(world, disciple, sect.factionId);
  FactionFactory.assignResidence(world, disciple, village.settlementId);
  const hut = FactionFactory.spawnBuilding(world, 'thatched_hut', source.factionId, 192, 96, village.settlementId, { instant: true });
  const mainComp = world.getComponent(main.factionEntity, FactionComponent)!;
  const oldComp = world.getComponent(source.factionEntity, FactionComponent)!;
  mainComp.foodStock = 100;
  const expectedWood = mainComp.woodStock + oldComp.woodStock;
  const task = CommunityTaskBoard.getInstance().createTask({
    type: 'build_thatched_hut', title: 'Nhà chờ xây', targetPos: { x: 220, y: 96 },
    preferredJob: 'builder', priority: 60, duration: 5,
    settlementId: village.settlementId, payerFactionId: source.factionId
  }, world)!;
  factionSystem.evaluateAllProgressions(world, 3);
  assert.equal(FactionFactory.findFactionEntity(world, source.factionId), null);
  assert.equal(village.settlementComp.ownerFactionId, main.factionId);
  assert.ok(mainComp.settlementIds.includes(village.settlementId));
  assert.equal(world.getComponent(hut, BuildingComponent)!.factionId, main.factionId);
  assert.equal(world.getComponent(village.entityId, TerritoryCenterComponent)!.factionId, main.factionId);
  for (const id of [citizen, disciple]) {
    assert.equal(world.getComponent(id, ResidenceComponent)!.factionId, main.factionId);
  }
  assert.equal(world.getComponent(citizen, MemberComponent)!.factionId, main.factionId);
  assert.equal(world.getComponent(disciple, MemberComponent)!.factionId, sect.factionId);
  assert.equal(CommunityTaskBoard.getInstance().getTask(task.id), undefined);
  assert.equal(mainComp.woodStock, expectedWood);
});

test('11. Invalid settlement prevents autonomous merge from deleting source or moving members', () => {
  const { world, factionSystem } = createPlainsWorld();
  const main = FactionFactory.createFaction(world, { type: 'village' });
  const source = FactionFactory.createFaction(world, { type: 'hamlet' });
  FactionFactory.createSettlement(world, 'A', 'village', 6, 6, main.factionId);
  FactionFactory.createSettlement(world, 'B', 'hamlet', 12, 6, source.factionId);
  for (let i = 0; i < 45; i++) {
    FactionFactory.assignMemberToFaction(world, spawnAdultWanderer(world, `A${i}`, 96, 96), main.factionId, 'villager');
  }
  const citizen = spawnAdultWanderer(world, 'B', 192, 96);
  FactionFactory.assignMemberToFaction(world, citizen, source.factionId, 'villager');
  source.comp.settlementIds.push('missing_settlement');
  main.comp.foodStock = 100;
  factionSystem.evaluateAllProgressions(world, 3);
  assert.notEqual(FactionFactory.findFactionEntity(world, source.factionId), null);
  assert.equal(world.getComponent(citizen, MemberComponent)!.factionId, source.factionId);
});

test('12. Kingdom secession updates residence and territory while preserving sect membership and buildings', () => {
  const { world, factionSystem } = createPlainsWorld();
  const kingdom = FactionFactory.createFaction(world, { type: 'kingdom' });
  FactionFactory.createSettlement(world, 'Kinh đô', 'village', 6, 6, kingdom.factionId);
  const rebel = FactionFactory.createSettlement(world, 'Làng xa', 'village', 12, 6, kingdom.factionId);
  const citizen = spawnAdultWanderer(world, 'Dân làng', 192, 96);
  FactionFactory.assignResidence(world, citizen, rebel.settlementId);
  const sect = FactionFactory.createFaction(world, { type: 'sect' });
  const disciple = spawnAdultWanderer(world, 'Đệ tử', 192, 96);
  FactionFactory.assignMemberToFaction(world, disciple, sect.factionId);
  FactionFactory.assignResidence(world, disciple, rebel.settlementId);
  const hut = FactionFactory.spawnBuilding(world, 'thatched_hut', kingdom.factionId, 192, 96, rebel.settlementId, { instant: true });
  const cave = FactionFactory.spawnBuilding(world, 'meditation_cave', sect.factionId, 210, 96, rebel.settlementId, { instant: true });
  kingdom.comp.stability = 10;
  factionSystem.evaluateAllProgressions(world, 3);
  const newOwner = rebel.settlementComp.ownerFactionId;
  assert.notEqual(newOwner, kingdom.factionId);
  assert.notEqual(FactionFactory.findFactionEntity(world, newOwner), null);
  assert.equal(world.getComponent(rebel.entityId, TerritoryCenterComponent)!.factionId, newOwner);
  assert.equal(world.getComponent(hut, BuildingComponent)!.factionId, newOwner);
  assert.equal(world.getComponent(cave, BuildingComponent)!.factionId, sect.factionId);
  for (const id of [citizen, disciple]) {
    assert.equal(world.getComponent(id, ResidenceComponent)!.factionId, newOwner);
    assert.equal(world.getComponent(id, ResidenceComponent)!.settlementId, rebel.settlementId);
  }
  assert.equal(world.getComponent(citizen, MemberComponent)!.factionId, newOwner);
  assert.equal(world.getComponent(disciple, MemberComponent)!.factionId, sect.factionId);
});

test('13. Founding completion rechecks living, uncommitted participants before creating a faction', () => {
  for (const change of ['death', 'joined_elsewhere', 'founder_died', 'missing_intent']) {
    const { world, factionSystem } = createPlainsWorld();
    const ids = Array.from({ length: 10 }, (_, i) => spawnAdultWanderer(world, `Dân ${i}`, 320 + i * 2, 320));
    bondGroup(world, ids, 50);
    factionSystem.runAutonomousFoundingScan(world);
    const founder = world.query([FoundingIntentComponent])[0];
    const intent = world.getComponent(founder, FoundingIntentComponent)!;
    const taskId = intent.taskId!;
    const others = ids.filter(id => id !== founder);
    if (change === 'death') {
      for (const other of others) world.getComponent(other, HealthComponent)!.isDead = true;
    }
    if (change === 'founder_died') world.getComponent(founder, HealthComponent)!.isDead = true;
    if (change === 'missing_intent') world.removeComponent(founder, FoundingIntentComponent);
    if (change === 'joined_elsewhere') {
      const faction = FactionFactory.createFaction(world, { type: 'village' });
      for (const other of others) FactionFactory.assignMemberToFaction(world, other, faction.factionId, 'villager');
    }
    const before = world.query([FactionComponent]).length;
    const buildingsBefore = world.query([BuildingComponent]).length;
    finishSiteForCommitTest(world, taskId);
    CommunityTaskBoard.getInstance().completeTask(world, founder, taskId);
    assert.equal(world.query([FactionComponent]).length, before, change);
    assert.equal(world.query([BuildingComponent]).length, buildingsBefore - 1,
      `${change}: cancelled founding site must be removed`);
    assert.equal(CommunityTaskBoard.getInstance().getTask(taskId), undefined, change);
    assert.equal(world.hasComponent(founder, FoundingIntentComponent), false, change);
  }
});

console.log(`All ${passed} Faction & Settlement regression tests passed!`);
