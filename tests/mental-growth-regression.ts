import assert from 'node:assert/strict';
import { ECSWorld } from '../src/ecs/World.ts';
import { WorldMap } from '../src/modules/world/WorldMap.ts';
import { QiGrid } from '../src/modules/energy/QiGrid.ts';
import { SpatialGrid } from '../src/core/SpatialGrid.ts';
import { TimeManager } from '../src/core/TimeManager.ts';
import { BeingFactory } from '../src/modules/beings/BeingFactory.ts';
import {
  HealthComponent,
  LifespanComponent,
  RaceComponent,
  RealmComponent,
} from '../src/modules/beings/BeingComponents.ts';
import { FamilyComponent } from '../src/modules/beings/FamilyComponent.ts';
import { CombatStatsComponent } from '../src/modules/combat/CombatComponents.ts';
import {
  MemoryComponent,
  SocialRelationshipComponent,
} from '../src/modules/social/SocialComponents.ts';
import {
  GrowthMindComponent,
} from '../src/modules/talent/TalentComponents.ts';
import {
  calculatePotential,
  scoreFromXp,
  xpForScore,
} from '../src/modules/talent/PotentialCalculator.ts';
import {
  GrowthSystem,
  evictExperienceIfNeeded,
  isEntityEligibleForGrowth,
} from '../src/modules/talent/GrowthSystem.ts';
import {
  MentalStateSystem,
  completeReflectionSessionDay,
} from '../src/modules/talent/MentalStateSystem.ts';
import { EncounterTracker } from '../src/modules/talent/EncounterTracker.ts';
import { CorpseAndGraveSystem } from '../src/modules/beings/CorpseAndGraveSystem.ts';
import {
  getEntityPotential,
  rebuildEntityStats,
} from '../src/modules/traits/DerivedStatsService.ts';
import { resolveActiveTraits } from '../src/modules/traits/TraitService.ts';
import { SaveManager } from '../src/modules/save/SaveManager.ts';

function createMockEngine(world: ECSWorld): any {
  world.worldSeed = 20260925;
  world.birthOrdinal = 10;
  const worldMap = new WorldMap(16, 16);
  const qiGrid = new QiGrid(16, 16);
  const spatialGrid = new SpatialGrid(32);

  return {
    world,
    worldMap,
    qiGrid,
    spatialGrid,
    camera: { x: 0, y: 0, zoom: 1.0 },
    timeManager: TimeManager.getInstance(),
    worldName: 'Test Growth Save World',
    worldTemplate: 'thap_van_dai_son',
    worldSeed: 20260925,
  };
}

function createTestResident(
  world: ECSWorld,
  opts?: {
    age?: number;
    raceId?: 'human' | 'beast' | 'demon';
    stageIndex?: number;
    willScore?: number;
    mindScore?: number;
  }
): number {
  const age = opts?.age ?? 20;
  const raceId = opts?.raceId ?? 'human';
  const archetypeId =
    raceId === 'beast'
      ? opts?.stageIndex && opts.stageIndex >= 1
        ? 'yao_common'
        : 'yao_common'
      : 'mortal_human';

  const id = BeingFactory.spawnFromArchetype(world, archetypeId, 10, 10, {
    newborn: age < 12,
    mode: 'natural',
  });

  const life = world.getComponent(id, LifespanComponent);
  if (life) {
    life.currentAge = age;
  }
  const race = world.getComponent(id, RaceComponent);
  if (race) {
    race.raceId = raceId;
  }

  if (opts?.stageIndex !== undefined) {
    const realm = world.getComponent(id, RealmComponent);
    if (realm) {
      realm.stageIndex = opts.stageIndex;
    }
  }

  const growth = world.getComponent(id, GrowthMindComponent)!;
  growth.willpowerXp = opts?.willScore !== undefined ? xpForScore(opts.willScore) : 0;
  growth.mindsetXp = opts?.mindScore !== undefined ? xpForScore(opts.mindScore) : 0;
  growth.mentalState = 0;
  growth.dailyBuckets = [];
  growth.familyDayBuckets = [];
  growth.cooldownUntilDay = {};
  growth.claimedMilestones = [];
  growth.recentEventIds = [];
  growth.experiences = [];
  growth.recentGains = [];
  growth.markDirty();
  rebuildEntityStats(world, id);
  return id;
}

function testEligibilityAndEvidence(): void {
  const world = new ECSWorld();
  const growthSys = new GrowthSystem(world);

  // C03: Trẻ dưới 12 tuổi và yêu thú chưa khai trí không nhận XP chủ động
  const childId = createTestResident(world, { age: 8, raceId: 'human' });
  assert.equal(isEntityEligibleForGrowth(world, childId), false, 'Child < 12 should not be eligible');

  const unawakenedBeastId = createTestResident(world, {
    age: 25,
    raceId: 'beast',
    stageIndex: 0,
  });
  assert.equal(
    isEntityEligibleForGrowth(world, unawakenedBeastId),
    false,
    'Unawakened beast (stage 0) should not be eligible'
  );

  const awakenedBeastId = createTestResident(world, {
    age: 25,
    raceId: 'beast',
    stageIndex: 1,
  });
  assert.equal(
    isEntityEligibleForGrowth(world, awakenedBeastId),
    true,
    'Awakened beast (stage >= 1) should be eligible'
  );

  const resChild = growthSys.processEvent(world, {
    world,
    eventId: 'work:child:1',
    entityId: childId,
    kind: 'work_completed',
    tick: 100,
    familyKey: 'work:forage',
    difficulty: 1.0,
    evidence: { taskId: 't1', actualOutput: 1 },
  });
  assert.equal(resChild.accepted, false);
  assert.equal(resChild.reason, 'ineligible_entity');

  // X01 & X02: Công việc thành công có output vs tác vụ lỗi/không có output
  const adultId = createTestResident(world, { age: 20 });
  const failWork = growthSys.processEvent(world, {
    world,
    eventId: 'work:adult:fail',
    entityId: adultId,
    kind: 'work_completed',
    tick: 100,
    familyKey: 'work:forage',
    difficulty: 1.0,
    evidence: { taskId: 't_fail', actualOutput: 0 },
  });
  assert.equal(failWork.accepted, false);
  assert.equal(failWork.reason, 'insufficient_work_evidence');

  const okWork = growthSys.processEvent(world, {
    world,
    eventId: 'work:adult:ok',
    entityId: adultId,
    kind: 'work_completed',
    tick: 100,
    familyKey: 'work:forage',
    difficulty: 1.0,
    evidence: { taskId: 't_ok', actualOutput: 3, professionDomain: 'gathering' },
  });
  assert.equal(okWork.accepted, true);
  assert(okWork.willAwarded > 0, 'Successful work with output must award willpower XP');
  assert.equal(okWork.mindAwarded, 0, 'Routine work does not award mindset XP');

  // X03: Event ID trùng chỉ nhận 1 lần
  const dupWork = growthSys.processEvent(world, {
    world,
    eventId: 'work:adult:ok',
    entityId: adultId,
    kind: 'work_completed',
    tick: 140,
    familyKey: 'work:other',
    difficulty: 1.0,
    evidence: { taskId: 't_ok', actualOutput: 3 },
  });
  assert.equal(dupWork.accepted, false);
  assert.equal(dupWork.reason, 'duplicate_event_id');

  // X04: Cùng kiếp qua 2 producer chỉ nhận 1 milestone
  const trib1 = growthSys.processEvent(world, {
    world,
    eventId: 'trib:1:prodA',
    entityId: adultId,
    kind: 'tribulation_passed',
    tick: 200,
    familyKey: 'tribulation:major',
    milestoneKey: 'tribulation:mortal_cultivator:2',
    difficulty: 1.0,
    evidence: { realmTarget: 'mortal_cultivator:2' },
  });
  assert.equal(trib1.accepted, true);
  assert(trib1.willAwarded > 0 && trib1.mindAwarded > 0);

  const trib2 = growthSys.processEvent(world, {
    world,
    eventId: 'trib:1:prodB',
    entityId: adultId,
    kind: 'tribulation_passed',
    tick: 201,
    familyKey: 'tribulation:major',
    milestoneKey: 'tribulation:mortal_cultivator:2',
    difficulty: 1.0,
    evidence: { realmTarget: 'mortal_cultivator:2' },
  });
  assert.equal(trib2.accepted, false);
  assert.equal(trib2.reason, 'milestone_already_claimed');

  // X10: Event từ world A không được xử lý ở world B có cùng entityId
  const worldB = new ECSWorld();
  worldB.clear(); // reset entityId counter về 1 để trùng ID
  const growthSysB = new GrowthSystem(worldB);
  const entityB = createTestResident(worldB, { age: 20 });
  const crossWorld = growthSysB.processEvent(worldB, {
    world, // sai world reference
    eventId: 'cross:world:1',
    entityId: entityB,
    kind: 'meditation_completed',
    tick: 100,
    familyKey: 'meditate:standard',
    difficulty: 1.0,
    evidence: { durationTicks: 20 },
  });
  assert.equal(crossWorld.accepted, false);
  assert.equal(crossWorld.reason, 'wrong_world');

  growthSys.destroy();
  growthSysB.destroy();
  console.log('PASS mental-growth: C03, X01, X02, X03, X04, X10 eligibility, evidence, dedupe, and world isolation');
}

function testCapsCeilingsAndNovelty(): void {
  const world = new ECSWorld();
  const growthSys = new GrowthSystem(world);
  const id = createTestResident(world, { age: 22, willScore: 0, mindScore: 0 });
  const growth = world.getComponent(id, GrowthMindComponent)!;

  // X05: Đạt giới hạn ngày (routine dailyWill = 2, dailyMind = 1)
  for (let i = 0; i < 10; i++) {
    growthSys.processEvent(world, {
      world,
      eventId: `routine:day1:${i}`,
      entityId: id,
      kind: 'study_completed',
      tick: TimeManager.TICKS_PER_DAY, // Day 1
      familyKey: `study:topic_${i}`, // khác familyKey để không bị cooldown
      difficulty: 1.25,
      evidence: { taskId: `study_${i}`, actualOutput: 1 },
    });
  }
  const day1Bucket = growth.dailyBuckets.find(b => b.day === 1)!;
  assert(day1Bucket.routineWill <= 2 + 1e-6, `Daily routine will cap exceeded: ${day1Bucket.routineWill}`);
  assert(day1Bucket.routineMind <= 1 + 1e-6, `Daily routine mind cap exceeded: ${day1Bucket.routineMind}`);

  // X06 & X13: Ý chí hiện tại 45, lao động trần 40 (không tăng, không giảm), encounter trần 85 (vẫn tăng)
  const idCeiling = createTestResident(world, { age: 25, willScore: 45, mindScore: 10 });
  const growthCeiling = world.getComponent(idCeiling, GrowthMindComponent)!;
  const xpBeforeWork = growthCeiling.willpowerXp;

  const workAt45 = growthSys.processEvent(world, {
    world,
    eventId: 'work:at45',
    entityId: idCeiling,
    kind: 'work_completed',
    tick: 40,
    familyKey: 'work:build',
    difficulty: 1.0,
    evidence: { taskId: 'b1', actualOutput: 5 },
  });
  assert.equal(workAt45.accepted, true);
  assert.equal(workAt45.willAwarded, 0, 'Work (ceiling 40) must award 0 when willpower is 45');
  assert.equal(growthCeiling.willpowerXp, xpBeforeWork, 'Willpower XP must not decrease when above source ceiling');

  const encounterAt45 = growthSys.processEvent(world, {
    world,
    eventId: 'enc:at45',
    entityId: idCeiling,
    kind: 'encounter_survived',
    tick: 40,
    familyKey: 'encounter:bandit',
    difficulty: 1.0,
    evidence: { encounterId: 'enc_1', actualDamage: 30 },
  });
  assert.equal(encounterAt45.accepted, true);
  assert(encounterAt45.willAwarded > 0, 'Encounter (ceiling 85) must still award XP when willpower is 45');
  assert(growthCeiling.willpowerXp > xpBeforeWork);

  // X11: XP 6000 nhận thêm thưởng vẫn giữ 6000
  growthCeiling.willpowerXp = 6000;
  growthCeiling.mindsetXp = 6000;
  const atMax = growthSys.processEvent(world, {
    world,
    eventId: 'trib:at6000',
    entityId: idCeiling,
    kind: 'tribulation_passed',
    tick: 100,
    familyKey: 'trib:max',
    milestoneKey: 'trib:max:1',
    difficulty: 1.25,
    evidence: { realmTarget: 'immortal' },
  });
  assert.equal(atMax.willAwarded, 0);
  assert.equal(atMax.mindAwarded, 0);
  assert.equal(growthCeiling.willpowerXp, 6000);
  assert.equal(growthCeiling.mindsetXp, 6000);

  // X12: Hai experience cùng family, save/load rồi nhận lần thứ ba trong 30 ngày -> novelty = 0.1
  const worldNov = new ECSWorld();
  const engNov = createMockEngine(worldNov);
  const sysNov = new GrowthSystem(worldNov);

  const idNov = createTestResident(worldNov, { age: 22, willScore: 0, mindScore: 0 });
  // Lần 1 ở ngày 1
  const ev1 = sysNov.processEvent(worldNov, {
    world: worldNov,
    eventId: 'mentor:1',
    entityId: idNov,
    kind: 'mentoring_completed',
    tick: 1 * TimeManager.TICKS_PER_DAY,
    familyKey: 'mentor:dao_talk',
    difficulty: 1.0,
    evidence: { taskId: 'm1', actualOutput: 1 },
  });
  // Lần 2 ở ngày 9 (sau cooldown 7 ngày)
  const ev2 = sysNov.processEvent(worldNov, {
    world: worldNov,
    eventId: 'mentor:2',
    entityId: idNov,
    kind: 'mentoring_completed',
    tick: 9 * TimeManager.TICKS_PER_DAY,
    familyKey: 'mentor:dao_talk',
    difficulty: 1.0,
    evidence: { taskId: 'm2', actualOutput: 1 },
  });
  assert(ev1.mindAwarded > 0);
  assert(
    Math.abs(ev2.mindAwarded / ev1.mindAwarded - 0.35) < 1e-5,
    `Second occurrence novelty should be 0.35, got ratio ${ev2.mindAwarded / ev1.mindAwarded}`
  );

  // Save & Load roundtrip
  // Events above reach day 9; persist the same calendar instead of a day-0 fixture.
  engNov.timeManager.loadState({ totalTicks: 9 * TimeManager.TICKS_PER_DAY, speed: 1,
    calendarEpochTick: 0, calendarEpochDays: 0, oldTicksPerDay: TimeManager.TICKS_PER_DAY });
  const savedData = SaveManager.serializeWorld(engNov, 'Novelty Test');
  SaveManager.deserializeWorld(engNov, savedData);
  sysNov.reset(engNov.world);

  // Lần 3 ở ngày 18 (sau cooldown 7 ngày và vẫn trong cửa sổ 30 ngày)
  const ev3 = sysNov.processEvent(engNov.world, {
    world: engNov.world,
    eventId: 'mentor:3',
    entityId: idNov,
    kind: 'mentoring_completed',
    tick: 18 * TimeManager.TICKS_PER_DAY,
    familyKey: 'mentor:dao_talk',
    difficulty: 1.0,
    evidence: { taskId: 'm3', actualOutput: 1 },
  });
  assert(
    Math.abs(ev3.mindAwarded / ev1.mindAwarded - 0.1) < 1e-5,
    `Third occurrence after save/load must use novelty 0.1, got ratio ${ev3.mindAwarded / ev1.mindAwarded}`
  );

  // Lần 4 ở ngày 26 -> novelty = 0
  const ev4 = sysNov.processEvent(engNov.world, {
    world: engNov.world,
    eventId: 'mentor:4',
    entityId: idNov,
    kind: 'mentoring_completed',
    tick: 26 * TimeManager.TICKS_PER_DAY,
    familyKey: 'mentor:dao_talk',
    difficulty: 1.0,
    evidence: { taskId: 'm4', actualOutput: 1 },
  });
  assert.equal(ev4.mindAwarded, 0, 'Fourth occurrence within 30 days must have novelty 0');

  growthSys.destroy();
  sysNov.destroy();
  console.log('PASS mental-growth: X05, X06, X11, X12, X13 caps, source ceilings, and novelty persistence across save/load');
}

function testEncounterAndBereavement(): void {
  const world = new ECSWorld();
  const growthSys = new GrowthSystem(world);
  const mentalSys = new MentalStateSystem();
  EncounterTracker.clear(world);

  const heroId = createTestResident(world, { age: 25, willScore: 20, mindScore: 25 });
  const weakMobId = createTestResident(world, { age: 20 });
  const strongFoeId = createTestResident(world, { age: 30 });

  const heroCombat = world.getComponent(heroId, CombatStatsComponent)!;
  const weakCombat = world.getComponent(weakMobId, CombatStatsComponent)!;
  const strongCombat = world.getComponent(strongFoeId, CombatStatsComponent)!;

  heroCombat.baseAtk = 50;
  heroCombat.defense = 20;
  const heroHp = world.getComponent(heroId, HealthComponent)!;
  heroHp.max = 200;
  heroHp.current = 200;

  // Mục tiêu quá yếu (< 0.75 power)
  weakCombat.baseAtk = 2;
  weakCombat.defense = 1;
  const weakHp = world.getComponent(weakMobId, HealthComponent)!;
  weakHp.max = 20;
  weakHp.current = 20;
  const weakRealm = world.getComponent(weakMobId, RealmComponent);
  if (weakRealm) weakRealm.combatPower = 1;

  // X09: Spam mục tiêu yếu không farm được XP
  world.setCurrentTick(100);
  weakHp.current = 0;
  weakHp.isDead = true;
  EncounterTracker.recordExchange(world, heroId, weakMobId, 25, 100);
  growthSys.update(world, 1);

  const heroGrowth = world.getComponent(heroId, GrowthMindComponent)!;
  const xpAfterWeak = heroGrowth.willpowerXp;
  assert.equal(xpAfterWeak, xpForScore(20), 'Killing weak target (<0.75 power) must not award XP');

  // Chạm trán đối thủ mạnh ngang ngửa (>= 1.0 power), nhiều đòn đánh chỉ gộp thành 1 encounter
  strongCombat.baseAtk = 55;
  strongCombat.defense = 25;
  const strongHp = world.getComponent(strongFoeId, HealthComponent)!;
  strongHp.max = 220;
  strongHp.current = 220;

  world.setCurrentTick(200);
  EncounterTracker.recordExchange(world, heroId, strongFoeId, 40, 200);
  EncounterTracker.recordExchange(world, strongFoeId, heroId, 35, 201);
  strongHp.current = 0;
  strongHp.isDead = true;
  EncounterTracker.recordExchange(world, heroId, strongFoeId, 190, 202);
  growthSys.update(world, 1);

  assert(
    heroGrowth.willpowerXp > xpAfterWeak,
    'Surviving/winning a hard encounter must award willpower XP once'
  );
  assert.equal(
    heroGrowth.experiences.filter(e => e.kind === 'danger').length,
    1,
    'Hard encounter should create exactly 1 danger experience record'
  );

  // M01: Mất người thân làm giảm mentalState nhưng giữ nguyên XP và P
  const kinId = createTestResident(world, { age: 24 });
  const heroSocial =
    world.getComponent(heroId, SocialRelationshipComponent) ??
    world.addComponent(heroId, new SocialRelationshipComponent());
  heroSocial.setRelationship(kinId, 'Đạo Lữ', 'dao_companion', 90);
  const heroFam =
    world.getComponent(heroId, FamilyComponent) ??
    world.addComponent(heroId, new FamilyComponent());
  heroFam.spouseId = kinId;

  const xpWillBeforeLoss = heroGrowth.willpowerXp;
  const xpMindBeforeLoss = heroGrowth.mindsetXp;
  const pBeforeLoss = getEntityPotential(world, heroId)!.total;
  assert(Number.isFinite(pBeforeLoss));

  const kinHp = world.getComponent(kinId, HealthComponent)!;
  kinHp.current = 0;
  kinHp.isDead = true;

  world.setCurrentTick(15 * TimeManager.TICKS_PER_DAY); // Day 15
  const corpseSys = new CorpseAndGraveSystem(new WorldMap(16, 16));
  corpseSys.update(world, 1);
  // Gọi lần 2 để chắc chắn corpse không phát lại tang sự lần nữa
  corpseSys.update(world, 1);
  growthSys.update(world, 1);

  const bereavementExps = heroGrowth.experiences.filter(e => e.kind === 'bereavement');
  assert.equal(bereavementExps.length, 1, 'Close kin death must emit exactly one bereavement experience');
  assert.equal(bereavementExps[0].emotion, -40, 'Close kin bereavement initial emotion must be -40');

  // Tích hợp MentalStateSystem qua 5 ngày (tick 15 days -> 20 days)
  world.setCurrentTick(20 * TimeManager.TICKS_PER_DAY);
  mentalSys.update(world, 5);

  assert(heroGrowth.mentalState < -5, `Mental state should drop after close kin loss, got ${heroGrowth.mentalState}`);
  assert.equal(heroGrowth.willpowerXp, xpWillBeforeLoss, 'Bereavement must not reduce willpowerXp');
  assert.equal(heroGrowth.mindsetXp, xpMindBeforeLoss, 'Bereavement must not reduce mindsetXp');

  const pAfterLoss = getEntityPotential(world, heroId)!.total;
  assert.equal(pAfterLoss, pBeforeLoss, 'Potential P must remain invariant when mentalState drops');

  growthSys.destroy();
  console.log('PASS mental-growth: X09, M01 encounter power gating, single encounter per fight, and bereavement P invariance');
}

function testReflectionPauseSpeedAndEviction(): void {
  // M02, M03, M04, M05: Suy ngẫm, gián đoạn, và chuẩn hóa sau khi đủ ngày
  const world = new ECSWorld();
  const growthSys = new GrowthSystem(world);
  const mentalSys = new MentalStateSystem();

  const id = createTestResident(world, { age: 25, willScore: 15, mindScore: 15 });
  const growth = world.getComponent(id, GrowthMindComponent)!;

  // Phát sự kiện thất bại đột phá ở ngày 1 -> tạo setback experience (readyOffsetDays=3, requiredReflectionDays=3, initialEmotion=-12)
  world.setCurrentTick(TimeManager.TICKS_PER_DAY);
  growthSys.processEvent(world, {
    world,
    eventId: 'bf:1',
    entityId: id,
    kind: 'breakthrough_failed',
    tick: TimeManager.TICKS_PER_DAY,
    familyKey: 'breakthrough:setback',
    difficulty: 1.0,
    evidence: { realmTarget: 'mortal:1:2', reasonText: 'Đột phá thất bại' },
  });

  assert.equal(growth.experiences.length, 1);
  const exp = growth.experiences[0];
  assert.equal(exp.emotion, -12);
  assert.equal(exp.readyForReflectionAtDay, 4); // createdDay 1 + 3
  assert.equal(exp.requiredReflectionDays, 3);

  // M03: Suy ngẫm khi chưa tới ngày readyForReflectionAtDay (ngày 2 < 4) không tăng tiến độ
  const earlyStep = completeReflectionSessionDay(world, id, exp.id, 2 * TimeManager.TICKS_PER_DAY, 1, 0); // Day 2
  assert.equal(earlyStep.progressed, false);
  assert.equal(exp.reflectionDays, 0);

  // Ngày 4, 5 (2 ngày đầu suy ngẫm): tiến độ 2/3, chưa nhận thưởng (M05: nếu bị ngắt ở đây thì chưa xong)
  const stepDay4 = completeReflectionSessionDay(world, id, exp.id, 4 * TimeManager.TICKS_PER_DAY, 1, 0); // Day 4
  const stepDay5 = completeReflectionSessionDay(world, id, exp.id, 5 * TimeManager.TICKS_PER_DAY, 1, 1); // Day 5
  assert.equal(stepDay4.progressed, true);
  assert.equal(stepDay5.progressed, true);
  assert.equal(stepDay5.resolved, false);
  assert.equal(exp.reflectionDays, 2);
  assert.equal(exp.growthAwarded, false);

  const mindXpBeforeReflectDone = growth.mindsetXp;

  // M04: Ngày 6 hoàn thành ngày thứ 3/3 -> emotion giảm còn 40% (-12 * 0.4 = -4.8) và phát thưởng 1 lần
  world.setCurrentTick(6 * TimeManager.TICKS_PER_DAY); // Day 6
  const stepDay6 = completeReflectionSessionDay(world, id, exp.id, 6 * TimeManager.TICKS_PER_DAY, 1, 2);
  growthSys.update(world, 1);

  assert.equal(stepDay6.resolved, true);
  assert(Math.abs(exp.emotion - -4.8) < 1e-6, `Expected emotion -4.8 (40% of -12), got ${exp.emotion}`);
  assert.equal(exp.growthAwarded, true);
  assert(growth.mindsetXp > mindXpBeforeReflectDone, 'Completing reflection must award mindset XP');

  // Gọi thêm lần nữa cho cùng experience không thưởng lại
  const mindXpAfterReflectDone = growth.mindsetXp;
  const repeatStep = completeReflectionSessionDay(world, id, exp.id, 7 * TimeManager.TICKS_PER_DAY, 2, 0);
  growthSys.update(world, 1);
  assert.equal(repeatStep.progressed, false);
  assert.equal(growth.mindsetXp, mindXpAfterReflectDone);

  // M06: Ký ức UI bị cắt ở 40 bản ghi không làm mất ExperienceRecord hay mốc XP
  const mem = world.getComponent(id, MemoryComponent) ?? world.addComponent(id, new MemoryComponent());
  for (let i = 0; i < 55; i++) {
    mem.addMemory('chatted', `Memory ${i}`, 2, 5);
  }
  assert(mem.memories.length <= 40, 'MemoryComponent caps at 40 entries');
  assert.equal(growth.experiences.length, 1, 'ExperienceRecord must remain intact when UI memories truncate');

  // M07: Có 24 experience rồi thêm biến cố thứ 25 -> không loại bản có lockedByStep=true, ưu tiên loại bản resolved áp lực thấp nhất
  growth.experiences = [];
  for (let i = 0; i < 24; i++) {
    growth.experiences.push({
      id: `exp_slot_${String(i).padStart(2, '0')}`,
      eventId: `ev_slot_${i}`,
      kind: 'setback',
      templateId: 'breakthrough_setback',
      createdDay: 10,
      severity: i === 0 ? 1 : 3,
      emotion: i === 1 ? -1 : -20,
      halfLifeDays: 15,
      reflectionDays: 0,
      requiredReflectionDays: 3,
      readyForReflectionAtDay: 13,
      growthAwarded: i === 1, // slot 1 đã resolved và áp lực rất nhỏ (-1)
      resolvedAtDay: i === 1 ? 12 : undefined,
      lockedByStep: i === 0, // slot 0 đang suy ngẫm dở (lockedByStep = true)
    });
  }
  const evicted = evictExperienceIfNeeded(growth, 20);
  assert.equal(evicted, true);
  assert.equal(growth.experiences.length, 23);
  assert(
    growth.experiences.some(e => e.id === 'exp_slot_00'),
    'Locked experience (lockedByStep=true) must never be evicted'
  );
  assert(
    !growth.experiences.some(e => e.id === 'exp_slot_01'),
    'Resolved experience with smallest remaining pressure should be evicted first'
  );

  // X07 & X08: Pause không đổi trạng thái; 1x và 50x cùng số tick/hành động khớp trong 1e-6
  const world1x = new ECSWorld();
  const sys1x = new GrowthSystem(world1x);
  const mental1x = new MentalStateSystem();
  const char1x = createTestResident(world1x, { age: 20, willScore: 10, mindScore: 10 });

  const world50x = new ECSWorld();
  const sys50x = new GrowthSystem(world50x);
  const mental50x = new MentalStateSystem();
  const char50x = createTestResident(world50x, { age: 20, willScore: 10, mindScore: 10 });

  // Pause ở world1x (tick không đổi): gọi update nhiều lần không làm đổi mentalState hay XP
  world1x.setCurrentTick(0);
  const g1x = world1x.getComponent(char1x, GrowthMindComponent)!;
  g1x.mentalState = -25;
  mental1x.update(world1x, 0);
  mental1x.update(world1x, 0);
  assert.equal(g1x.mentalState, -25, 'Paused world (tick unchanged) must not decay mentalState');

  const g50x = world50x.getComponent(char50x, GrowthMindComponent)!;
  g50x.mentalState = -25;

  // Chạy 10 ngày mô phỏng (10 * TICKS_PER_DAY ticks):
  // - world1x cập nhật từng tick (dt = 0.05)
  // - world50x cập nhật gộp theo bước lớn (10 lần, mỗi lần 1 ngày, dt = 5.0)
  const TICKS_PER_DAY = TimeManager.TICKS_PER_DAY;
  for (let tick = 1; tick <= 10 * TICKS_PER_DAY; tick++) {
    world1x.setCurrentTick(tick);
    if (tick % (2 * TICKS_PER_DAY) === 0) {
      const day = tick / TICKS_PER_DAY;
      sys1x.processEvent(world1x, {
        world: world1x,
        eventId: `med:${day}`,
        entityId: char1x,
        kind: 'meditation_completed',
        tick,
        familyKey: 'meditate:daily',
        difficulty: 1.0,
        evidence: { durationTicks: TICKS_PER_DAY },
      });
    }
    sys1x.update(world1x, 0.05);
    mental1x.update(world1x, 0.05);
  }

  for (let day = 1; day <= 10; day++) {
    const tick = day * TICKS_PER_DAY;
    world50x.setCurrentTick(tick);
    if (day % 2 === 0) {
      sys50x.processEvent(world50x, {
        world: world50x,
        eventId: `med:${day}`,
        entityId: char50x,
        kind: 'meditation_completed',
        tick,
        familyKey: 'meditate:daily',
        difficulty: 1.0,
        evidence: { durationTicks: TICKS_PER_DAY },
      });
    }
    sys50x.update(world50x, 5.0);
    mental50x.update(world50x, 5.0);
  }

  assert(
    Math.abs(g1x.willpowerXp - g50x.willpowerXp) <= 1e-6,
    `1x vs 50x willpowerXp mismatch: ${g1x.willpowerXp} vs ${g50x.willpowerXp}`
  );
  assert(
    Math.abs(g1x.mindsetXp - g50x.mindsetXp) <= 1e-6,
    `1x vs 50x mindsetXp mismatch: ${g1x.mindsetXp} vs ${g50x.mindsetXp}`
  );
  assert(
    Math.abs(g1x.mentalState - g50x.mentalState) <= 1e-6,
    `1x vs 50x mentalState mismatch: ${g1x.mentalState} vs ${g50x.mentalState}`
  );

  growthSys.destroy();
  sys1x.destroy();
  sys50x.destroy();
  console.log('PASS mental-growth: M02-M07, X07, X08 reflection lifecycle, memory truncation safety, 24-cap eviction, and 1x/50x parity');
}

function testProfessionAndAcquiredTraitProducers(): void {
  const world = new ECSWorld();
  const growthSys = new GrowthSystem(world);

  // 1. Cooking 31 tasks across 30 days (day 0..30) -> records profession_cook_tier2 and grants dau_bep_than_cap
  const cookId = createTestResident(world, { age: 24, willScore: 10, mindScore: 10 });
  const cookGrowth = world.getComponent(cookId, GrowthMindComponent)!;

  for (let day = 0; day <= 30; day++) {
    const tick = day * TimeManager.TICKS_PER_DAY;
    world.setCurrentTick(tick);
    const res = growthSys.processEvent(world, {
      world,
      eventId: `work:cook:day_${day}`,
      entityId: cookId,
      kind: 'work_completed',
      tick,
      familyKey: 'work:cook',
      difficulty: 1.0,
      evidence: { taskId: `cook_task_${day}`, actualOutput: 1 },
    });
    assert.equal(res.accepted, true);
    if (day < 30) {
      assert.equal(
        resolveActiveTraits(world, cookId).some(t => t.id === 'dau_bep_than_cap'),
        false,
        `Should not unlock dau_bep_than_cap when spanDays < 30 (day ${day})`
      );
    }
  }

  assert.equal(cookGrowth.professionCounters['cook']?.tasks, 31);
  assert.equal(cookGrowth.claimedMilestones.includes('profession_cook_tier2'), true);
  assert.equal(
    resolveActiveTraits(world, cookId).some(t => t.id === 'dau_bep_than_cap'),
    true,
    '31 cooking tasks over 30 elapsed days (day 0..30, spanDays=30) must grant dau_bep_than_cap (Linh Trù Thần Cấp)'
  );

  // 2. Building 31 tasks across 30 days (day 0..30) -> records profession_build_tier2 and grants kientruc_than_tuong
  const buildId = createTestResident(world, { age: 26, willScore: 10, mindScore: 10 });
  const buildGrowth = world.getComponent(buildId, GrowthMindComponent)!;

  for (let day = 0; day <= 30; day++) {
    const tick = day * TimeManager.TICKS_PER_DAY;
    world.setCurrentTick(tick);
    growthSys.processEvent(world, {
      world,
      eventId: `work:build:day_${day}`,
      entityId: buildId,
      kind: 'work_completed',
      tick,
      familyKey: 'work:build',
      difficulty: 1.0,
      evidence: { taskId: `build_task_${day}`, actualOutput: 1 },
    });
    if (day < 30) {
      assert.equal(
        resolveActiveTraits(world, buildId).some(t => t.id === 'kientruc_than_tuong'),
        false,
        `Should not unlock kientruc_than_tuong when spanDays < 30 (day ${day})`
      );
    }
  }

  assert.equal(buildGrowth.professionCounters['build']?.tasks, 31);
  assert.equal(buildGrowth.claimedMilestones.includes('profession_build_tier2'), true);
  assert.equal(
    resolveActiveTraits(world, buildId).some(t => t.id === 'kientruc_than_tuong'),
    true,
    '31 building tasks over 30 days must grant kientruc_than_tuong (Kiến Trúc Thần Tượng)'
  );

  // 3. Tribulation passed -> grants loi_kiep_toi_the on 1st and phong_loi_bat_dong on 3rd for beast
  const beastId = createTestResident(world, {
    age: 35,
    raceId: 'beast',
    stageIndex: 2,
    willScore: 20,
    mindScore: 20,
  });
  for (let i = 1; i <= 3; i++) {
    const tick = i * 400;
    world.setCurrentTick(tick);
    growthSys.processEvent(world, {
      world,
      eventId: `trib:beast:${i}`,
      entityId: beastId,
      kind: 'tribulation_passed',
      tick,
      familyKey: `tribulation:stage_${i}`,
      milestoneKey: `tribulation_passed:${beastId}:stage_${i}`,
      difficulty: 1.25,
      evidence: { realmTarget: `beast_stage_${i}` },
    });
    if (i === 1) {
      assert.equal(
        resolveActiveTraits(world, beastId).some(t => t.id === 'loi_kiep_toi_the'),
        true
      );
      assert.equal(
        resolveActiveTraits(world, beastId).some(t => t.id === 'phong_loi_bat_dong'),
        false
      );
    }
  }
  assert.equal(
    resolveActiveTraits(world, beastId).some(t => t.id === 'phong_loi_bat_dong'),
    true,
    'Passing 3 tribulations must grant phong_loi_bat_dong to beast'
  );

  growthSys.destroy();
  console.log('PASS mental-growth: Bug 3 profession counters, milestones, and active acquired trait producers');
}

export function runMentalGrowthRegressionTests(): void {
  console.log('Running Mental Growth & Experience V3 regression tests (A06-A10)...');
  testEligibilityAndEvidence();
  testCapsCeilingsAndNovelty();
  testEncounterAndBereavement();
  testReflectionPauseSpeedAndEviction();
  testProfessionAndAcquiredTraitProducers();
  console.log('All Mental Growth & Experience V3 regression tests (A06-A10) passed!');
}

runMentalGrowthRegressionTests();

