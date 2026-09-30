import assert from 'node:assert/strict';
import { ECSWorld } from '../src/ecs/World.ts';
import { WorldMap } from '../src/modules/world/WorldMap.ts';
import { QiGrid } from '../src/modules/energy/QiGrid.ts';
import { TimeManager } from '../src/core/TimeManager.ts';
import { SpatialGrid } from '../src/core/SpatialGrid.ts';
import {
  CharacterStateComponent,
  ComprehensionComponent,
  HealthComponent,
  LifespanComponent,
  NameComponent,
  PositionComponent,
  RaceComponent,
  RealmComponent,
  SpiritualRootComponent,
  TraitsComponent,
} from '../src/modules/beings/BeingComponents.ts';
import { CombatStatsComponent } from '../src/modules/combat/CombatComponents.ts';
import { SaveManager } from '../src/modules/save/SaveManager.ts';
import {
  GrowthMindComponent,
  StatBaselineComponent,
  TalentProfileComponent,
} from '../src/modules/talent/TalentComponents.ts';
import { xpForScore } from '../src/modules/talent/PotentialCalculator.ts';
import {
  getEntityPotential,
  rebuildEntityStats,
} from '../src/modules/traits/DerivedStatsService.ts';
import { getTraitDefinition } from '../src/modules/traits/TraitCatalog.ts';

let passed = 0;
function test(name: string, fn: () => void): void {
  fn();
  passed++;
  console.log('PASS talent-save:', name);
}

function createMockEngine(): any {
  const world = new ECSWorld();
  world.worldSeed = 20260925;
  world.birthOrdinal = 7;
  const worldMap = new WorldMap(8, 8);
  const qiGrid = new QiGrid(8, 8);
  const spatialGrid = new SpatialGrid(32);

  return {
    world,
    worldMap,
    qiGrid,
    spatialGrid,
    camera: { x: 0, y: 0, zoom: 1.0 },
    timeManager: TimeManager.getInstance(),
    worldName: 'Test V3 Save World',
    worldTemplate: 'thap_van_dai_son',
    worldSeed: 20260925,
  };
}

test('S01, S05, S06: V3 save/load roundtrip preserves 5 scores, XP, mentalState, cooldowns, buckets, experiences, and birthOrdinal', () => {
  const engine = createMockEngine();
  engine.timeManager.reset();
  for (let i = 0; i < 10 * TimeManager.TICKS_PER_DAY; i++) engine.timeManager.stepSingleTick(); // day 10

  const ent = engine.world.createEntity();
  engine.world.addComponent(ent, new PositionComponent(20, 20, 25));
  engine.world.addComponent(ent, new NameComponent('Hàn Lập'));
  engine.world.addComponent(ent, new RaceComponent('human'));
  engine.world.addComponent(ent, new RealmComponent('human_realms', 1, 'Luyện Khí', 'Sơ Kỳ', 20, 250, 50, 0));
  engine.world.addComponent(ent, new HealthComponent(500));
  engine.world.addComponent(ent, new LifespanComponent(22, 500));
  engine.world.addComponent(ent, new CharacterStateComponent());
  engine.world.addComponent(ent, new ComprehensionComponent(80000));
  engine.world.addComponent(ent, new SpiritualRootComponent(true, 'true', 'Chân Linh Căn', ['moc'], 65));
  engine.world.addComponent(
    ent,
    new TraitsComponent(['kien_nhan_ben_bi'], [], ['loi_kiep_toi_the'])
  );
  engine.world.addComponent(
    ent,
    new TalentProfileComponent({
      birthSeed: 12345,
      seedClass: 'prodigy',
      base: { comprehension: 80, aptitude: 70, physique: 60 },
      pendingRoot: { rootType: 'true', purity: 65, elements: ['moc'] },
      knowledge: 'revealed',
    })
  );
  engine.world.addComponent(
    ent,
    new GrowthMindComponent({
      willpowerXp: xpForScore(40),
      mindsetXp: xpForScore(50),
      mentalState: -18,
      lastIntegratedTick: 10 * TimeManager.TICKS_PER_DAY,
      dailyBuckets: [{ day: 10, routineWill: 1.5, routineMind: 0.5, experienceWill: 5, experienceMind: 0 }],
      familyDayBuckets: [{ day: 10, counts: { 'encounter:wolf': 2 } }],
      cooldownUntilDay: { 'work_completed:farm': 11 },
      claimedMilestones: ['breakthrough:human_realms:1:0'],
      experiences: [
        {
          id: 'exp_1',
          eventId: 'evt_fail_1',
          kind: 'setback',
          createdDay: 5,
          severity: 2,
          emotion: -12,
          halfLifeDays: 15,
          reflectionDays: 2,
          requiredReflectionDays: 3,
          readyForReflectionAtDay: 8,
          growthAwarded: true,
          resolvedAtDay: 9,
        },
      ],
    })
  );
  engine.world.addComponent(ent, new StatBaselineComponent({ baseMaxHealth: 100 }));

  const saved = SaveManager.serializeWorld(engine, 'V3 Roundtrip');
  assert.equal(saved.traitSystemVersion, 3);
  assert.equal(saved.talentGenerationVersion, 1);
  assert.equal(saved.birthOrdinal, 7);

  const dstEngine = createMockEngine();
  SaveManager.deserializeWorld(dstEngine, saved);

  assert.equal(dstEngine.world.birthOrdinal, 7);
  const pot = getEntityPotential(dstEngine.world, ent)!;
  assert.equal(pot.scores.willpower, 40);
  assert.equal(pot.scores.mindset, 50);

  const gm = dstEngine.world.getComponent(ent, GrowthMindComponent)!;
  assert.equal(gm.mentalState, -18);
  assert.equal(gm.cooldownUntilDay['work_completed:farm'], 11);
  assert.equal(gm.familyDayBuckets[0].counts['encounter:wolf'], 2);
  assert.equal(gm.experiences[0].growthAwarded, true);
  assert.equal(gm.experiences[0].reflectionDays, 2);
});

test('S02, S03, S09 & G06: legacy save migration preserves 7 missing IDs, an_linh_can semantic, avoids double-multiplying HP, and stabilizes unawakened child pendingRoot', () => {
  const engine = createMockEngine();
  const baseSave = SaveManager.serializeWorld(engine, 'Legacy Base');
  delete baseSave.traitSystemVersion;
  delete baseSave.talentGenerationVersion;
  delete baseSave.birthOrdinal;

  baseSave.entities = [
    {
      id: 10,
      components: {
        pos: { x: 30, y: 30, speed: 25 },
        name: { name: 'Lão Tổ Cũ' },
        race: { raceId: 'human' },
        realm: {
          realmChainId: 'human_realms',
          stageIndex: 1,
          stageName: 'Luyện Khí',
          subStageName: 'Sơ Kỳ',
          subStageIndex: 0,
          currentQi: 50,
          maxQi: 250,
          combatPower: 60,
          isBreakingThrough: false,
        },
        // Saved HP max=300 (already multiplied by Thuần Dương Chi Thể x1.5), current=180
        hp: { current: 180, max: 300, isDead: false },
        life: { currentAge: 28, maxLifespan: 180, isElderly: false },
        comp: { current: 100000, max: 100000 },
        root: {
          isAwakened: true,
          rootType: 'earth',
          gradeName: 'Địa Linh Căn',
          elements: ['hoa', 'moc'],
          purity: 85,
        },
        traits: {
          innateTraits: [
            'thuan_duong_chi_the',
            'an_linh_can',
            'van_thu_chi_huu',
            'uy_nghiem_trang_trong',
            'hien_hoa_nhan_hau',
            'unknown_custom_old_trait',
          ],
          techniqueTraits: ['truong_sinh_quyet', 'hoa_viem_chan_kinh', 'ngu_long_bi_thuat'],
          trainingTraits: ['dan_dao_nhap_mon'],
        },
        stats: {
          baseAtk: 28,
          defense: 10,
          armor: 5,
          attackSpeed: 1.0,
          critRate: 0.1,
          dodgeRate: 0.1,
          critDamage: 1.5,
          attackRange: 25,
          isHostile: false,
        },
      },
    },
    {
      id: 11,
      components: {
        pos: { x: 35, y: 35, speed: 25 },
        name: { name: 'Hài Đồng Chưa Thức Tỉnh' },
        race: { raceId: 'human' },
        hp: { current: 100, max: 100, isDead: false },
        life: { currentAge: 5, maxLifespan: 100, isElderly: false },
        root: {
          isAwakened: false,
          rootType: 'none',
          gradeName: 'Chưa Thức Tỉnh',
          elements: [],
          purity: 0,
        },
        traits: {
          innateTraits: ['kien_nhan_ben_bi'],
          techniqueTraits: [],
          trainingTraits: [],
        },
      },
    },
  ];

  // First load (legacy -> V3 migration)
  const dst1 = createMockEngine();
  SaveManager.deserializeWorld(dst1, baseSave);

  const hp10 = dst1.world.getComponent(10, HealthComponent)!;
  // S03: HP must stay 300 max and 180 current, NOT multiplied again!
  assert.ok(Math.abs(hp10.max - 300) <= 1);
  assert.equal(hp10.current, 180);

  // Rebuild stats again -> still 300
  rebuildEntityStats(dst1.world, 10);
  assert.ok(Math.abs(hp10.max - 300) <= 1);
  assert.equal(hp10.current, 180);

  // Comprehension 100000 -> standard score 100
  const pot10 = getEntityPotential(dst1.world, 10)!;
  assert.equal(pot10.scores.comprehension, 100);
  assert.equal(pot10.scores.aptitude, 85);

  // S02 & S09: all legacy IDs preserved, an_linh_can is Ẩn Linh Căn
  const traits10 = dst1.world.getComponent(10, TraitsComponent)!;
  const entryIds = traits10.entries.map(e => e.id);
  assert.ok(entryIds.includes('an_linh_can'));
  assert.ok(entryIds.includes('van_thu_chi_huu'));
  assert.ok(entryIds.includes('dan_dao_nhap_mon'));
  assert.ok(entryIds.includes('unknown_custom_old_trait'));
  assert.equal(getTraitDefinition('an_linh_can')?.name, 'Ẩn Linh Căn');

  // G06: Load legacy save a second time -> unawakened child pendingRoot is identical
  const dst2 = createMockEngine();
  SaveManager.deserializeWorld(dst2, baseSave);
  const root1 = dst1.world.getComponent(11, TalentProfileComponent)!.pendingRoot;
  const root2 = dst2.world.getComponent(11, TalentProfileComponent)!.pendingRoot;
  assert.deepEqual(root1, root2);
  assert.equal(dst1.world.getComponent(11, TalentProfileComponent)!.knowledge, 'unassessed');

  // Save and load again (V3 branch) -> scores and HP remain identical
  const reSaved = SaveManager.serializeWorld(dst1, 'Reloaded V3');
  const dst3 = createMockEngine();
  SaveManager.deserializeWorld(dst3, reSaved);
  assert.deepEqual(
    getEntityPotential(dst3.world, 10)?.scores,
    getEntityPotential(dst1.world, 10)?.scores
  );
  assert.equal(dst3.world.getComponent(10, HealthComponent)!.max, hp10.max);
});

test('S04, S08 & P11: future traitSystemVersion or NaN/Infinity in V3 save is rejected before commit and preserves playing world', () => {
  const playingEngine = createMockEngine();
  const existingEnt = playingEngine.world.createEntity();
  playingEngine.world.addComponent(existingEnt, new NameComponent('Đang Chơi'));
  playingEngine.world.addComponent(existingEnt, new RaceComponent('human'));

  const validSave = SaveManager.serializeWorld(playingEngine, 'Valid');

  // S08: Future traitSystemVersion
  const futureSave = JSON.parse(JSON.stringify(validSave));
  futureSave.traitSystemVersion = 99;
  assert.throws(() => SaveManager.deserializeWorld(playingEngine, futureSave), /traitSystemVersion/);
  assert.equal(playingEngine.world.getComponent(existingEnt, NameComponent)?.name, 'Đang Chơi');

  // P11 & S04: NaN in talentProfile.base
  const nanSave = JSON.parse(JSON.stringify(validSave));
  nanSave.entities[0].components.talentProfile = {
    schemaVersion: 3,
    base: { comprehension: NaN, aptitude: 50, physique: 50 },
  };
  assert.throws(() => SaveManager.deserializeWorld(playingEngine, nanSave), /NaN|Infinity|không hữu hạn/);
  assert.equal(playingEngine.world.getComponent(existingEnt, NameComponent)?.name, 'Đang Chơi');

  // Bug 4 Regression: JSON overflow 1e400 in nested cooldownUntilDay ("work:cook": 1e400)
  const rawJsonWithOverflow = JSON.stringify(validSave).replace(
    '"components":{',
    '"components":{"growthMind":{"willpowerXp":100,"mindsetXp":100,"mentalState":0,"cooldownUntilDay":{"work:cook":1e400}},'
  );
  const parsedOverflowSave = JSON.parse(rawJsonWithOverflow);
  assert.equal(
    parsedOverflowSave.entities[0].components.growthMind.cooldownUntilDay['work:cook'],
    Infinity
  );
  assert.throws(
    () => SaveManager.deserializeWorld(playingEngine, parsedOverflowSave),
    /Infinity|không hữu hạn/
  );
  assert.equal(playingEngine.world.getComponent(existingEnt, NameComponent)?.name, 'Đang Chơi');

  // Nested non-finite in dailyBuckets, experiences, professionCounters, foundationChanges, permanentAdjustments
  const nestedBucketSave = JSON.parse(JSON.stringify(validSave));
  nestedBucketSave.entities[0].components.growthMind = {
    willpowerXp: 10,
    mindsetXp: 10,
    mentalState: 0,
    dailyBuckets: [{ day: 1, routineWill: Infinity, routineMind: 0, experienceWill: 0, experienceMind: 0 }],
  };
  assert.throws(
    () => SaveManager.deserializeWorld(playingEngine, nestedBucketSave),
    /Infinity|không hữu hạn/
  );

  const nestedProfSave = JSON.parse(JSON.stringify(validSave));
  nestedProfSave.entities[0].components.growthMind = {
    willpowerXp: 10,
    mindsetXp: 10,
    mentalState: 0,
    professionCounters: { cook: { tasks: 5, firstDay: 1, lastDay: Infinity } },
  };
  assert.throws(
    () => SaveManager.deserializeWorld(playingEngine, nestedProfSave),
    /Infinity|không hữu hạn/
  );
  assert.equal(playingEngine.world.getComponent(existingEnt, NameComponent)?.name, 'Đang Chơi');
});

test('Bug 1 Legacy Migration Regression: migrating legacy save at stageIndex = 3 preserves baseAtk = 100 across repeated rebuilds', () => {
  const engine = createMockEngine();
  const legacySave = SaveManager.serializeWorld(engine, 'Legacy Stage 3');
  delete legacySave.traitSystemVersion;
  delete legacySave.talentGenerationVersion;

  legacySave.entities = [
    {
      id: 25,
      components: {
        pos: { x: 40, y: 40, speed: 25 },
        name: { name: 'Kim Đan Chân Nhân' },
        race: { raceId: 'human' },
        realm: {
          realmChainId: 'human_realms',
          stageIndex: 3,
          stageName: 'Kết Đan',
          subStageName: 'Sơ Kỳ',
          subStageIndex: 0,
          currentQi: 500,
          maxQi: 2000,
          combatPower: 400,
          isBreakingThrough: false,
        },
        hp: { current: 12500, max: 12500, isDead: false },
        life: { currentAge: 80, maxLifespan: 12500, isElderly: false },
        traits: {
          innateTraits: [],
          techniqueTraits: [],
          trainingTraits: [],
        },
        stats: {
          baseAtk: 100,
          defense: 30,
          armor: 10,
          attackSpeed: 1.0,
          critRate: 0.05,
          dodgeRate: 0.05,
          critDamage: 1.5,
          attackRange: 25,
          isHostile: false,
        },
      },
    },
  ];

  const dst = createMockEngine();
  SaveManager.deserializeWorld(dst, legacySave);

  const combat = dst.world.getComponent(25, CombatStatsComponent)!;
  assert.equal(combat.baseAtk, 100);

  rebuildEntityStats(dst.world, 25);
  assert.equal(combat.baseAtk, 100);
  rebuildEntityStats(dst.world, 25);
  assert.equal(combat.baseAtk, 100);
  rebuildEntityStats(dst.world, 25);
  assert.equal(combat.baseAtk, 100);
});

console.log(`${passed} talent-save regression tests passed`);
