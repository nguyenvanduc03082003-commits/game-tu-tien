import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';
import {
  TALENT_SEED_CLASSES,
  TRAIT_MODIFIER_CAPS,
  TalentSeedClass,
} from '../src/config/talent.config.ts';
import {
  CanonicalModifierKey,
  RaceId,
  TraitDimension,
  TraitOrigin,
  TraitTier,
} from '../src/config/traits/trait.types.ts';
import {
  ALL_TRAITS_LIST_V3,
  SOURCE_300_TRAITS_LIST,
  areTraitsConflictingV3,
  getTraitDefinition,
  isTraitAllowedForRaceAndSpecies,
  isTraitPurelyNegative,
  resolveTraitId,
  validateTraitCatalog,
} from '../src/modules/traits/TraitCatalog.ts';
import {
  LEGACY_ONLY_TRAITS_V3,
  LEGACY_TRAIT_ALIASES,
} from '../src/config/traits/legacy-traits.config.ts';
import { aggregateTraitModifiers } from '../src/modules/traits/TraitEffectResolver.ts';
import {
  TraitInnateContributionInput,
  calculatePotential,
  calculatePotentialFromScores,
  scoreFromXp,
  xpForScore,
} from '../src/modules/talent/PotentialCalculator.ts';
import {
  generateTalentBundle,
} from '../src/modules/talent/TalentGenerator.ts';
import { ECSWorld } from '../src/ecs/World.ts';
import { TimeManager } from '../src/core/TimeManager.ts';
import { BeingFactory } from '../src/modules/beings/BeingFactory.ts';
import {
  LifespanComponent,
  RealmComponent,
  SpiritualRootType,
} from '../src/modules/beings/BeingComponents.ts';
import {
  GrowthMindComponent,
  TalentProfileComponent,
} from '../src/modules/talent/TalentComponents.ts';
import { GrowthSystem } from '../src/modules/talent/GrowthSystem.ts';
import {
  MentalStateSystem,
  completeReflectionSessionDay,
} from '../src/modules/talent/MentalStateSystem.ts';
import {
  getEntityPotential,
  rebuildEntityStats,
} from '../src/modules/traits/DerivedStatsService.ts';

// ============================================================================
// PART 1: A12 — CATALOG COVERAGE & HANDLER VERIFICATION
// ============================================================================

function runCatalogCoverageReport() {
  console.log('================================================================');
  console.log('1. A12 — BÁO CÁO ĐỘ PHỦ CATALOG 300 ĐẶC ĐIỂM V3 & 8 LEGACY-ONLY');
  console.log('================================================================');

  const validation = validateTraitCatalog();
  assert.equal(
    validation.valid,
    true,
    `Catalog validation failed:\n${validation.errors.join('\n')}`
  );
  assert.equal(SOURCE_300_TRAITS_LIST.length, 300, 'Exact 300 V3 source traits required');
  assert.equal(LEGACY_ONLY_TRAITS_V3.length, 8, 'Exact 8 legacyOnly traits required');
  assert.equal(ALL_TRAITS_LIST_V3.length, 308, 'Exact 308 total traits in catalog');

  const byImplementation: Record<string, number> = {
    active: 0,
    planned: 0,
    legacyOnly: 0,
  };
  const sourceByImplementation: Record<string, number> = {
    active: 0,
    planned: 0,
  };
  const byRace: Record<string, number> = {
    all: 0,
    human: 0,
    beast: 0,
    demon: 0,
  };
  const byOrigin: Record<TraitOrigin, number> = {
    innate: 0,
    acquired: 0,
    reincarnation: 0,
    lineage: 0,
  };
  const byTier: Record<TraitTier, { total: number; active: number; planned: number }> = {
    1: { total: 0, active: 0, planned: 0 },
    2: { total: 0, active: 0, planned: 0 },
    3: { total: 0, active: 0, planned: 0 },
    4: { total: 0, active: 0, planned: 0 },
    5: { total: 0, active: 0, planned: 0 },
  };
  const byDimension: Record<TraitDimension, { total: number; active: number; planned: number }> = {
    physique: { total: 0, active: 0, planned: 0 },
    root: { total: 0, active: 0, planned: 0 },
    mindset: { total: 0, active: 0, planned: 0 },
    combat: { total: 0, active: 0, planned: 0 },
    profession: { total: 0, active: 0, planned: 0 },
    social: { total: 0, active: 0, planned: 0 },
    survival: { total: 0, active: 0, planned: 0 },
  };

  const unmappedKeyCounts: Record<string, number> = {};

  for (const def of ALL_TRAITS_LIST_V3) {
    byImplementation[def.implementation] = (byImplementation[def.implementation] ?? 0) + 1;
  }

  for (const def of SOURCE_300_TRAITS_LIST) {
    sourceByImplementation[def.implementation] =
      (sourceByImplementation[def.implementation] ?? 0) + 1;

    if (def.allowedRaces === 'all') {
      byRace.all++;
    } else if (def.allowedRaces.length === 1) {
      byRace[def.allowedRaces[0]] = (byRace[def.allowedRaces[0]] ?? 0) + 1;
    }

    byOrigin[def.origin]++;
    byTier[def.tier].total++;
    if (def.implementation === 'active') {
      byTier[def.tier].active++;
    } else {
      byTier[def.tier].planned++;
    }

    byDimension[def.dimension].total++;
    if (def.implementation === 'active') {
      byDimension[def.dimension].active++;
    } else {
      byDimension[def.dimension].planned++;
    }

    if (def.unmappedEffectKeys) {
      for (const k of def.unmappedEffectKeys) {
        unmappedKeyCounts[k] = (unmappedKeyCounts[k] ?? 0) + 1;
      }
    }

    if (def.implementation !== 'active' || def.origin === 'acquired') {
      assert.equal(
        def.spawnWeight,
        0,
        `Trait ${def.id} (${def.implementation}, ${def.origin}) must have spawnWeight=0`
      );
    }
  }

  // Assert exact mandatory V3 distributions from Appendix A.1
  assert.deepEqual(byRace, { all: 186, human: 24, beast: 45, demon: 45 });
  assert.deepEqual(byOrigin, {
    innate: 221,
    acquired: 43,
    reincarnation: 3,
    lineage: 33,
  });

  // Verify special aliases & semantic split (Appendix A.2)
  assert.equal(resolveTraitId('kim_giac_tê_huyet'), 'kim_giac_te_huyet');
  assert.equal(getTraitDefinition('an_linh_can')?.implementation, 'legacyOnly');
  assert.equal(getTraitDefinition('an_linh_can')?.name, 'Ẩn Linh Căn');
  assert.equal(getTraitDefinition('bien_di_am_linh_can')?.name, 'Biến Dị Ám Linh Căn');
  assert.equal(Object.keys(LEGACY_TRAIT_ALIASES).includes('an_linh_can'), false);

  // Verify representative handler for every CanonicalModifierKey in TRAIT_MODIFIER_CAPS
  const allCanonicalKeys = Object.keys(TRAIT_MODIFIER_CAPS) as CanonicalModifierKey[];
  for (const key of allCanonicalKeys) {
    const repTrait = SOURCE_300_TRAITS_LIST.find(d =>
      d.modifiers.some(m => m.key === key)
    );
    assert.ok(repTrait, `Every CanonicalModifierKey (${key}) must have at least one trait in V3 catalog`);
    const resolved = aggregateTraitModifiers([repTrait]);
    assert.ok(resolved, `Resolver succeeded for representative trait ${repTrait.id} (${key})`);
  }

  const coverageSummary = {
    totalCatalogEntries: ALL_TRAITS_LIST_V3.length,
    sourceV3Count: SOURCE_300_TRAITS_LIST.length,
    legacyOnlyCount: LEGACY_ONLY_TRAITS_V3.length,
    byImplementation,
    source300ByImplementation: sourceByImplementation,
    byRace,
    byOrigin,
    byTier,
    byDimension,
    unmappedEffectKeyOccurrences: unmappedKeyCounts,
  };

  console.log(JSON.stringify(coverageSummary, null, 2));
  return coverageSummary;
}

// ============================================================================
// PART 2: A13 — 100,000 NATURAL POPULATION SIMULATION (SEED 20260925)
// ============================================================================

interface ScoreStats {
  count: number;
  min: number;
  max: number;
  mean: number;
  p10: number;
  p50: number;
  p90: number;
  p99: number;
  deciles: Record<string, number>;
}

function computeScoreStats(values: number[]): ScoreStats {
  if (values.length === 0) {
    return {
      count: 0,
      min: 0,
      max: 0,
      mean: 0,
      p10: 0,
      p50: 0,
      p90: 0,
      p99: 0,
      deciles: {},
    };
  }
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  let sum = 0;
  const bins = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  for (let i = 0; i < n; i++) {
    const v = sorted[i];
    sum += v;
    const idx = Math.min(9, Math.max(0, Math.floor(v / 10)));
    bins[idx]++;
  }
  const deciles: Record<string, number> = {
    '00-09': bins[0],
    '10-19': bins[1],
    '20-29': bins[2],
    '30-39': bins[3],
    '40-49': bins[4],
    '50-59': bins[5],
    '60-69': bins[6],
    '70-79': bins[7],
    '80-89': bins[8],
    '90-100': bins[9],
  };
  const pct = (q: number) =>
    Math.round(sorted[Math.min(n - 1, Math.floor(q * n))] * 100) / 100;

  return {
    count: n,
    min: Math.round(sorted[0] * 100) / 100,
    max: Math.round(sorted[n - 1] * 100) / 100,
    mean: Math.round((sum / n) * 100) / 100,
    p10: pct(0.1),
    p50: pct(0.5),
    p90: pct(0.9),
    p99: pct(0.99),
    deciles,
  };
}

function runPopulationSimulation() {
  console.log('\n================================================================');
  console.log('2. A13 — THỬ NGHIỆM DÂN SỐ 100,000 PROFILE TỰ NHIÊN (SEED 20260925)');
  console.log('================================================================');

  const WORLD_SEED = 20260925;
  const TOTAL_PROFILES = 100_000;
  const RACES: RaceId[] = ['human', 'beast', 'demon'];
  const BEAST_SPECIES = ['wolf', 'tiger', 'ape', 'deer', 'eagle', 'crane', 'dragon'] as const;

  const seedCounts: Record<TalentSeedClass, number> = {
    ordinary: 0,
    capable: 0,
    talented: 0,
    prodigy: 0,
    exceptional: 0,
    legendary: 0,
  };

  const highestTierCounts: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  const traitSlotCounts: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 };
  const spawnedByImpl: Record<string, number> = { active: 0, planned: 0, legacyOnly: 0 };
  const rareTraitCounts: Record<string, number> = {};

  const rootBeforeOverride: Record<SpiritualRootType, number> = {
    none: 0,
    impure: 0,
    true: 0,
    earth: 0,
    heaven: 0,
  };
  const rootAfterOverride: Record<SpiritualRootType, number> = {
    none: 0,
    impure: 0,
    true: 0,
    earth: 0,
    heaven: 0,
  };
  const humanRootBeforeOverride: Record<SpiritualRootType, number> = {
    none: 0,
    impure: 0,
    true: 0,
    earth: 0,
    heaven: 0,
  };
  const humanRootAfterOverride: Record<SpiritualRootType, number> = {
    none: 0,
    impure: 0,
    true: 0,
    earth: 0,
    heaven: 0,
  };

  const scoresC: number[] = [];
  const scoresA: number[] = [];
  const scoresB: number[] = [];
  const adultScoresW: number[] = [];
  const adultScoresM: number[] = [];
  const newbornScoresW: number[] = [];
  const newbornScoresM: number[] = [];
  const assessedScoresP: number[] = [];
  const unassessedTrueScoresP: number[] = [];

  const assessedByRaceP: Record<RaceId, number[]> = {
    human: [],
    beast: [],
    demon: [],
  };

  const potentialGradeCounts: Record<string, number> = {
    ordinary: 0,
    capable: 0,
    excellent: 0,
    genius: 0,
    prodigy: 0,
  };

  let raceViolations = 0;
  let speciesLineageViolations = 0;
  let originViolations = 0;
  let exclusiveGroupViolations = 0;
  let budgetViolations = 0;
  let tier5InCappedSeedViolations = 0;
  let tierCeilingViolations = 0;

  const seedDefMap = new Map(TALENT_SEED_CLASSES.map(s => [s.id, s]));

  const memBefore = process.memoryUsage().heapUsed;
  const t0 = performance.now();

  for (let i = 1; i <= TOTAL_PROFILES; i++) {
    const raceId = RACES[(i - 1) % 3];
    // 85% adult (assessed), 15% newborn (unassessed)
    const isNewborn = i % 20 < 3;
    const speciesId =
      raceId === 'beast' ? BEAST_SPECIES[i % BEAST_SPECIES.length] : undefined;

    const bundle = generateTalentBundle({
      worldSeed: WORLD_SEED,
      birthOrdinal: i,
      raceId,
      speciesId,
      mode: 'natural',
      isNewborn,
    });

    const seedRule = seedDefMap.get(bundle.seedClass)!;
    seedCounts[bundle.seedClass]++;

    const initRoot = bundle.initialRootType;
    const finalRoot = bundle.profile.pendingRoot?.rootType ?? 'none';
    rootBeforeOverride[initRoot]++;
    rootAfterOverride[finalRoot]++;
    if (raceId === 'human') {
      humanRootBeforeOverride[initRoot]++;
      humanRootAfterOverride[finalRoot]++;
    }

    const traitCount = bundle.selectedTraitIds.length;
    traitSlotCounts[traitCount] = (traitSlotCounts[traitCount] ?? 0) + 1;

    if (traitCount > seedRule.maxInnateSlots) {
      budgetViolations++;
    }

    let highestTier = 0;
    let totalTraitCost = 0;
    let negCount = 0;
    const contribInputs: TraitInnateContributionInput[] = [];

    for (let idx = 0; idx < bundle.selectedTraitIds.length; idx++) {
      const tid = bundle.selectedTraitIds[idx];
      const def = getTraitDefinition(tid);
      if (!def) {
        originViolations++;
        continue;
      }

      spawnedByImpl[def.implementation] = (spawnedByImpl[def.implementation] ?? 0) + 1;
      if (def.tier > highestTier) highestTier = def.tier;
      totalTraitCost += def.traitCost;

      if (def.tier >= 4) {
        rareTraitCounts[def.id] = (rareTraitCounts[def.id] ?? 0) + 1;
      }

      if (def.tier > seedRule.maxTier) {
        tierCeilingViolations++;
      }
      if (def.tier === 5 && seedRule.maxTier < 5) {
        tier5InCappedSeedViolations++;
      }

      if (!isTraitAllowedForRaceAndSpecies(def, raceId, speciesId)) {
        if (def.allowedRaces !== 'all' && !def.allowedRaces.includes(raceId)) {
          raceViolations++;
        } else {
          speciesLineageViolations++;
        }
      }

      if (def.origin === 'lineage') {
        if (
          !def.requiredLineageTags ||
          !def.requiredLineageTags.every(tag => bundle.profile.lineageTags.includes(tag))
        ) {
          speciesLineageViolations++;
        }
      }

      if (def.origin === 'acquired') {
        originViolations++;
      }
      if (def.origin === 'reincarnation' && bundle.seedClass !== 'legendary') {
        originViolations++;
      }

      if (isTraitPurelyNegative(def)) {
        negCount++;
      }

      for (let j = idx + 1; j < bundle.selectedTraitIds.length; j++) {
        if (areTraitsConflictingV3(tid, bundle.selectedTraitIds[j])) {
          exclusiveGroupViolations++;
        }
      }

      contribInputs.push({
        id: def.id,
        origin: def.origin,
        innateDelta: def.innateDelta,
        primaryRootOverride: def.primaryRootOverride,
      });
    }

    if (totalTraitCost > bundle.budget || negCount > 1) {
      budgetViolations++;
    }

    highestTierCounts[highestTier] = (highestTierCounts[highestTier] ?? 0) + 1;

    const pot = calculatePotential(bundle.profile, bundle.growth, contribInputs);
    scoresC.push(pot.scores.comprehension);
    scoresA.push(pot.scores.aptitude);
    scoresB.push(pot.scores.physique);

    if (isNewborn) {
      newbornScoresW.push(pot.scores.willpower);
      newbornScoresM.push(pot.scores.mindset);
      unassessedTrueScoresP.push(pot.total);
    } else {
      adultScoresW.push(pot.scores.willpower);
      adultScoresM.push(pot.scores.mindset);
      assessedScoresP.push(pot.total);
      assessedByRaceP[raceId].push(pot.total);
      potentialGradeCounts[pot.grade] = (potentialGradeCounts[pot.grade] ?? 0) + 1;
    }
  }

  const elapsedMs = performance.now() - t0;
  const memAfter = process.memoryUsage().heapUsed;
  const msPerProfile = Math.round((elapsedMs / TOTAL_PROFILES) * 10000) / 10000;
  const heapDeltaMb = Math.round(((memAfter - memBefore) / (1024 * 1024)) * 100) / 100;

  // Assertions for Section 17.3
  assert.equal(spawnedByImpl.planned, 0, 'Planned traits spawned must be 0');
  assert.equal(spawnedByImpl.legacyOnly, 0, 'legacyOnly traits spawned must be 0');
  assert.equal(raceViolations, 0, 'Race violations must be 0');
  assert.equal(speciesLineageViolations, 0, 'Species/Lineage violations must be 0');
  assert.equal(originViolations, 0, 'Origin violations must be 0');
  assert.equal(exclusiveGroupViolations, 0, 'Exclusive group violations must be 0');
  assert.equal(budgetViolations, 0, 'Budget/slot/negative violations must be 0');
  assert.equal(tier5InCappedSeedViolations, 0, 'Tier 5 traits in seed with maxTier < 5 must be 0');
  assert.equal(tierCeilingViolations, 0, 'Tier ceiling violations must be 0');

  // Seed class statistical tolerance check: ±(5 * sqrt(n * p * (1 - p)) + 3)
  const seedDistributionCheck: Record<
    string,
    { count: number; pct: number; expectedPct: number; toleranceCount: number }
  > = {};
  for (const def of TALENT_SEED_CLASSES) {
    const p = def.probabilityWeight / 100;
    const expectedCount = TOTAL_PROFILES * p;
    const tol = Math.ceil(5 * Math.sqrt(TOTAL_PROFILES * p * (1 - p)) + 3);
    const actual = seedCounts[def.id];
    seedDistributionCheck[def.id] = {
      count: actual,
      pct: Math.round((actual / TOTAL_PROFILES) * 10000) / 100,
      expectedPct: def.probabilityWeight,
      toleranceCount: tol,
    };
    assert.ok(
      Math.abs(actual - expectedCount) <= tol,
      `Seed class ${def.id} count ${actual} outside statistical tolerance ${expectedCount} ± ${tol}`
    );
  }

  // Newborn W/M must all be 0
  assert.ok(
    newbornScoresW.every(v => v === 0) && newbornScoresM.every(v => v === 0),
    'All newborn profiles must start with W=0 and M=0'
  );

  const populationReport = {
    seed: WORLD_SEED,
    totalProfiles: TOTAL_PROFILES,
    performance: {
      totalElapsedMs: Math.round(elapsedMs * 100) / 100,
      msPerProfile,
      heapDeltaMb,
    },
    violations: {
      raceViolations,
      speciesLineageViolations,
      originViolations,
      exclusiveGroupViolations,
      budgetViolations,
      tier5InCappedSeedViolations,
      tierCeilingViolations,
    },
    seedClassDistribution: seedDistributionCheck,
    highestTierDistribution: highestTierCounts,
    traitCountDistribution: traitSlotCounts,
    spawnedImplementationCounts: spawnedByImpl,
    rareTier4And5TraitCounts: rareTraitCounts,
    spiritualRootDistributionAllRaces: {
      beforePrimaryOverride: rootBeforeOverride,
      afterPrimaryOverride: rootAfterOverride,
    },
    spiritualRootDistributionHumanOnly: {
      beforePrimaryOverride: humanRootBeforeOverride,
      afterPrimaryOverride: humanRootAfterOverride,
    },
    histograms: {
      comprehensionC: computeScoreStats(scoresC),
      aptitudeA: computeScoreStats(scoresA),
      physiqueB: computeScoreStats(scoresB),
      adultWillpowerW: computeScoreStats(adultScoresW),
      adultMindsetM: computeScoreStats(adultScoresM),
      newbornWillpowerW: computeScoreStats(newbornScoresW),
      newbornMindsetM: computeScoreStats(newbornScoresM),
      assessedPotentialP: computeScoreStats(assessedScoresP),
      unassessedTruePotentialP: computeScoreStats(unassessedTrueScoresP),
      assessedPotentialByRace: {
        human: computeScoreStats(assessedByRaceP.human),
        beast: computeScoreStats(assessedByRaceP.beast),
        demon: computeScoreStats(assessedByRaceP.demon),
      },
    },
    assessedPotentialGradeDistribution: potentialGradeCounts,
  };

  console.log(JSON.stringify(populationReport, null, 2));
  return populationReport;
}

// ============================================================================
// PART 3: A13 — 8 DETERMINISTIC 100-YEAR GROWTH SCENARIOS (SECTION 17.4)
// ============================================================================

function createImmortalTestResident(
  world: ECSWorld,
  opts: {
    c: number;
    a: number;
    b: number;
    w?: number;
    m?: number;
    stageIndex?: number;
  }
): number {
  const id = BeingFactory.spawnFromArchetype(world, 'mortal_human', 10, 10, {
    newborn: false,
    mode: 'natural',
  });
  const life = world.getComponent(id, LifespanComponent)!;
  life.currentAge = 20;
  life.maxLifespan = 10_000; // Fixture bất tử phục vụ mô phỏng 100 năm theo mục 17.4

  const realm = world.getComponent(id, RealmComponent)!;
  realm.stageIndex = opts.stageIndex ?? 1;

  const profile = world.getComponent(id, TalentProfileComponent)!;
  profile.base = {
    comprehension: opts.c,
    aptitude: opts.a,
    physique: opts.b,
  };
  profile.migrationBaseIsResolved = true; // Cố định C/A/B đúng bằng giá trị truyền vào
  profile.knowledge = 'revealed';

  const growth = world.getComponent(id, GrowthMindComponent)!;
  growth.willpowerXp = xpForScore(opts.w ?? 0);
  growth.mindsetXp = xpForScore(opts.m ?? 0);
  growth.mentalState = 0;
  growth.lastIntegratedTick = 0;

  profile.markDirty();
  growth.markDirty();
  rebuildEntityStats(world, id);

  return id;
}

function runGrowthScenarios() {
  console.log('\n================================================================');
  console.log('3. A13 — 8 KỊCH BẢN MÔ PHỎNG TRƯỞNG THÀNH 100 NĂM DETERMINISTIC');
  console.log('================================================================');

  const DAYS_PER_YEAR = 360;
  const YEARS_100_DAYS = 100 * DAYS_PER_YEAR; // 36,000 ngày
  const TICKS_PER_DAY = TimeManager.TICKS_PER_DAY;

  // --------------------------------------------------------------------------
  // Kịch bản 1: Chỉ ăn/ngủ/đứng yên 100 năm -> P không tự tăng theo tuổi
  // --------------------------------------------------------------------------
  const world1 = new ECSWorld();
  const growthSys1 = new GrowthSystem(world1);
  const mentalSys1 = new MentalStateSystem();
  const ent1 = createImmortalTestResident(world1, { c: 60, a: 60, b: 60, w: 0, m: 0 });
  const initialP1 = getEntityPotential(world1, ent1)!.total;

  for (let day = 1; day <= YEARS_100_DAYS; day++) {
    const tick = day * TICKS_PER_DAY;
    world1.setCurrentTick(tick);
    growthSys1.update(world1, 1.0);
    mentalSys1.update(world1, 1.0);
  }
  const finalP1 = getEntityPotential(world1, ent1)!.total;
  const g1 = world1.getComponent(ent1, GrowthMindComponent)!;
  assert.equal(g1.willpowerXp, 0, 'Scenario 1: Idle 100 years must keep willpowerXp = 0');
  assert.equal(g1.mindsetXp, 0, 'Scenario 1: Idle 100 years must keep mindsetXp = 0');
  assert.equal(finalP1, initialP1, 'Scenario 1: P does not increase with age alone');
  growthSys1.destroy();

  // --------------------------------------------------------------------------
  // Kịch bản 2: Chỉ lao động thường 100 năm -> W không vượt 40, M không tăng
  // --------------------------------------------------------------------------
  const world2 = new ECSWorld();
  const growthSys2 = new GrowthSystem(world2);
  const ent2 = createImmortalTestResident(world2, { c: 60, a: 60, b: 60, w: 0, m: 0 });

  for (let day = 1; day <= YEARS_100_DAYS; day++) {
    const tick = day * TICKS_PER_DAY;
    world2.setCurrentTick(tick);
    growthSys2.processEvent(world2, {
      world: world2,
      eventId: `work:${world2.worldInstanceId}:${ent2}:${day}`,
      entityId: ent2,
      kind: 'work_completed',
      tick,
      familyKey: 'work:farming',
      difficulty: 1.0,
      evidence: { taskId: `farm_${day}`, actualOutput: 5 },
    });
    growthSys2.update(world2, 1.0);
  }
  const g2 = world2.getComponent(ent2, GrowthMindComponent)!;
  const wScore2 = scoreFromXp(g2.willpowerXp);
  const mScore2 = scoreFromXp(g2.mindsetXp);
  assert.ok(
    wScore2 <= 40.000001 && wScore2 >= 39.9,
    `Scenario 2: Routine work caps W at 40 (got ${wScore2})`
  );
  assert.equal(mScore2, 0, 'Scenario 2: Routine work never increases M');
  growthSys2.destroy();

  // --------------------------------------------------------------------------
  // Kịch bản 3: Chỉ thiền thường 100 năm -> W không vượt 50, M không vượt 40
  // --------------------------------------------------------------------------
  const world3 = new ECSWorld();
  const growthSys3 = new GrowthSystem(world3);
  const ent3 = createImmortalTestResident(world3, { c: 60, a: 60, b: 60, w: 0, m: 0 });

  for (let day = 1; day <= YEARS_100_DAYS; day++) {
    const tick = day * TICKS_PER_DAY;
    world3.setCurrentTick(tick);
    growthSys3.processEvent(world3, {
      world: world3,
      eventId: `meditate:${world3.worldInstanceId}:${ent3}:${day}`,
      entityId: ent3,
      kind: 'meditation_completed',
      tick,
      familyKey: 'meditate:daily',
      difficulty: 1.0,
      evidence: { durationTicks: 20 },
    });
    growthSys3.update(world3, 1.0);
  }
  const g3 = world3.getComponent(ent3, GrowthMindComponent)!;
  const wScore3 = scoreFromXp(g3.willpowerXp);
  const mScore3 = scoreFromXp(g3.mindsetXp);
  assert.ok(
    wScore3 <= 50.000001 && wScore3 >= 49.9,
    `Scenario 3: Routine meditation caps W at 50 (got ${wScore3})`
  );
  assert.ok(
    mScore3 <= 40.000001 && mScore3 >= 39.9,
    `Scenario 3: Routine meditation caps M at 40 (got ${mScore3})`
  );
  growthSys3.destroy();

  // --------------------------------------------------------------------------
  // Kịch bản 4: Kết hợp thử thách/suy ngẫm/kiếp -> vượt trần routine hợp lệ
  // --------------------------------------------------------------------------
  const world4 = new ECSWorld();
  const growthSys4 = new GrowthSystem(world4);
  const mentalSys4 = new MentalStateSystem();
  const ent4 = createImmortalTestResident(world4, {
    c: 70,
    a: 70,
    b: 70,
    w: 48,
    m: 38,
    stageIndex: 2,
  });
  const g4 = world4.getComponent(ent4, GrowthMindComponent)!;

  for (let year = 1; year <= 100; year++) {
    const baseDay = (year - 1) * DAYS_PER_YEAR + 1;

    // Chiến thắng hiểm nguy trước nhiều đối thủ khác nhau mỗi năm
    for (let k = 1; k <= 4; k++) {
      const fightDay = baseDay + k * 25;
      const fightTick = fightDay * TICKS_PER_DAY;
      world4.setCurrentTick(fightTick);
      growthSys4.processEvent(world4, {
        world: world4,
        eventId: `enc:${world4.worldInstanceId}:${ent4}:y${year}_${k}`,
        entityId: ent4,
        kind: 'encounter_survived',
        tick: fightTick,
        familyKey: `combat:opponent_${year}_${k}`,
        difficulty: 1.15,
        evidence: {
          encounterId: `enc_${year}_${k}`,
          targetEntityId: 10000 + year * 10 + k,
          actualDamage: 120,
        },
      });
      growthSys4.update(world4, 1.0);
    }

    // Đại kiếp định kỳ
    if (year % 10 === 0) {
      const tribDay = baseDay + 180;
      const tribTick = tribDay * TICKS_PER_DAY;
      world4.setCurrentTick(tribTick);
      growthSys4.processEvent(world4, {
        world: world4,
        eventId: `trib:${world4.worldInstanceId}:${ent4}:stage_${year}`,
        entityId: ent4,
        kind: 'tribulation_passed',
        tick: tribTick,
        familyKey: 'tribulation:major',
        milestoneKey: `tribulation:${world4.worldInstanceId}:${ent4}:stage_${year}`,
        difficulty: 1.2,
        evidence: { realmTarget: `stage_${year}` },
      });
      growthSys4.update(world4, 1.0);
    }

    // Trải nghiệm thất bại đột phá rồi suy ngẫm hóa giải
    const expDay = baseDay + 200;
    const expTick = expDay * TICKS_PER_DAY;
    world4.setCurrentTick(expTick);
    growthSys4.processEvent(world4, {
      world: world4,
      eventId: `bfail:${world4.worldInstanceId}:${ent4}:y${year}`,
      entityId: ent4,
      kind: 'breakthrough_failed',
      tick: expTick,
      familyKey: `breakthrough:setback_${year % 5}`,
      difficulty: 1.0,
      evidence: { realmTarget: `stage_${year}`, reasonText: 'Đột phá thất bại' },
    });
    growthSys4.update(world4, 1.0);

    const unresolved = g4.experiences.find(e => !e.growthAwarded);
    if (unresolved) {
      for (let r = 1; r <= 6; r++) {
        const rDay = expDay + 3 + r;
        const rTick = rDay * TICKS_PER_DAY;
        world4.setCurrentTick(rTick);
        completeReflectionSessionDay(world4, ent4, unresolved.id, rTick, year, r);
        growthSys4.update(world4, 1.0);
        mentalSys4.update(world4, 1.0);
      }
    }
  }

  const wScore4 = scoreFromXp(g4.willpowerXp);
  const mScore4 = scoreFromXp(g4.mindsetXp);
  assert.ok(
    wScore4 > 50,
    `Scenario 4: Combined challenges must exceed routine W cap 50 (got ${wScore4})`
  );
  assert.ok(
    mScore4 > 40,
    `Scenario 4: Combined reflection/tribulation must exceed routine M cap 40 (got ${mScore4})`
  );
  growthSys4.destroy();

  // --------------------------------------------------------------------------
  // Kịch bản 5: Cùng bẩm sinh, người rèn luyện đạt P cao hơn; chênh lệch <= 45
  // --------------------------------------------------------------------------
  const untrainedPot = calculatePotentialFromScores({
    comprehension: 75,
    aptitude: 65,
    physique: 70,
    willpower: 0,
    mindset: 0,
  });
  const trainedPot = calculatePotentialFromScores({
    comprehension: 75,
    aptitude: 65,
    physique: 70,
    willpower: wScore4,
    mindset: mScore4,
  });
  const maxTrainedPot = calculatePotentialFromScores({
    comprehension: 75,
    aptitude: 65,
    physique: 70,
    willpower: 100,
    mindset: 100,
  });
  const diffTrained = Math.round((trainedPot.total - untrainedPot.total) * 1000) / 1000;
  const maxPossibleGrowthDiff =
    Math.round((maxTrainedPot.total - untrainedPot.total) * 1000) / 1000;
  assert.ok(trainedPot.total > untrainedPot.total, 'Scenario 5: Trained resident has higher P');
  assert.ok(diffTrained <= 45, 'Scenario 5: Growth difference cannot exceed 45');
  assert.equal(maxPossibleGrowthDiff, 45, 'Scenario 5: Max growth contribution is exactly 45');

  // --------------------------------------------------------------------------
  // Kịch bản 6: Bẩm sinh 100 nhưng không rèn -> không tự đạt P 100 (P = 55)
  // --------------------------------------------------------------------------
  const innate100Untrained = calculatePotentialFromScores({
    comprehension: 100,
    aptitude: 100,
    physique: 100,
    willpower: 0,
    mindset: 0,
  });
  assert.equal(
    innate100Untrained.total,
    55,
    'Scenario 6: Innate 100 without training has P = 55, never 100'
  );

  // --------------------------------------------------------------------------
  // Kịch bản 7: Sau biến cố, trạng thái có đường phục hồi; tâm cảnh tăng khi hóa giải
  // --------------------------------------------------------------------------
  const world7 = new ECSWorld();
  const growthSys7 = new GrowthSystem(world7);
  const mentalSys7 = new MentalStateSystem();
  const ent7 = createImmortalTestResident(world7, { c: 65, a: 65, b: 65, w: 30, m: 25 });
  const g7 = world7.getComponent(ent7, GrowthMindComponent)!;
  const mXpBeforeTrauma = g7.mindsetXp;
  const pBeforeTrauma = getEntityPotential(world7, ent7)!.total;

  // Ngày 10: mất người thân (close_kin)
  world7.setCurrentTick(10 * TICKS_PER_DAY);
  growthSys7.processEvent(world7, {
    world: world7,
    eventId: `bereave:${world7.worldInstanceId}:${ent7}:spouse`,
    entityId: ent7,
    kind: 'bereavement',
    tick: 10 * TICKS_PER_DAY,
    familyKey: 'bereavement:close_kin',
    difficulty: 1.0,
    evidence: { bereavementTier: 'close_kin', targetEntityId: 999 },
  });
  growthSys7.update(world7, 1.0);
  mentalSys7.update(world7, 1.0);

  const stateAtTrauma = g7.mentalState;
  const mXpAtTrauma = g7.mindsetXp;
  const pAtTrauma = getEntityPotential(world7, ent7)!.total;

  assert.ok(stateAtTrauma < 0, 'Scenario 7: Bereavement immediately lowers mentalState');
  assert.equal(mXpAtTrauma, mXpBeforeTrauma, 'Scenario 7: Mindset XP does NOT increase at trauma time');
  assert.equal(pAtTrauma, pBeforeTrauma, 'Scenario 7: Potential P does NOT change at trauma time');

  const bereaveExp = g7.experiences[0];
  assert.ok(bereaveExp, 'Scenario 7: Bereavement creates ExperienceRecord');

  // Chờ tới readyForReflectionAtDay rồi suy ngẫm đủ số ngày yêu cầu
  const startReflectDay = bereaveExp.readyForReflectionAtDay;
  for (let i = 0; i < bereaveExp.requiredReflectionDays; i++) {
    const d = startReflectDay + i;
    const t = d * TICKS_PER_DAY;
    world7.setCurrentTick(t);
    completeReflectionSessionDay(world7, ent7, bereaveExp.id, t, 1, i);
    growthSys7.update(world7, 1.0);
    mentalSys7.update(world7, 1.0);
  }
  const mXpAfterResolve = g7.mindsetXp;
  assert.ok(
    mXpAfterResolve > mXpBeforeTrauma,
    'Scenario 7: Mindset XP increases upon reflection resolution'
  );

  // Theo dõi phục hồi trạng thái tinh thần sau 180 ngày
  for (let d = startReflectDay + bereaveExp.requiredReflectionDays; d <= startReflectDay + 180; d++) {
    world7.setCurrentTick(d * TICKS_PER_DAY);
    mentalSys7.update(world7, 1.0);
  }
  const stateAfterRecovery = g7.mentalState;
  assert.ok(
    stateAfterRecovery > stateAtTrauma && stateAfterRecovery > -2,
    `Scenario 7: Mental state recovers toward baseline (atTrauma=${stateAtTrauma}, after=${stateAfterRecovery})`
  );
  growthSys7.destroy();

  // --------------------------------------------------------------------------
  // Kịch bản 8: Batch 30 ngày và từng ngày, cùng chuỗi đầu vào, phải khớp
  // --------------------------------------------------------------------------
  const worldDaily = new ECSWorld();
  const growthDaily = new GrowthSystem(worldDaily);
  const mentalDaily = new MentalStateSystem();
  const entDaily = createImmortalTestResident(worldDaily, { c: 60, a: 60, b: 60, w: 20, m: 20 });

  const worldBatch = new ECSWorld();
  const growthBatch = new GrowthSystem(worldBatch);
  const mentalBatch = new MentalStateSystem();
  const entBatch = createImmortalTestResident(worldBatch, { c: 60, a: 60, b: 60, w: 20, m: 20 });

  // Cùng nhận một biến cố ở ngày 0
  worldDaily.setCurrentTick(0);
  growthDaily.processEvent(worldDaily, {
    world: worldDaily,
    eventId: `exp_parity:${worldDaily.worldInstanceId}:${entDaily}:1`,
    entityId: entDaily,
    kind: 'breakthrough_failed',
    tick: 0,
    familyKey: 'breakthrough:setback',
    difficulty: 1.0,
    evidence: { realmTarget: 'stage_2', reasonText: 'Đột phá thất bại' },
  });
  growthDaily.update(worldDaily, 0);

  worldBatch.setCurrentTick(0);
  growthBatch.processEvent(worldBatch, {
    world: worldBatch,
    eventId: `exp_parity:${worldBatch.worldInstanceId}:${entBatch}:1`,
    entityId: entBatch,
    kind: 'breakthrough_failed',
    tick: 0,
    familyKey: 'breakthrough:setback',
    difficulty: 1.0,
    evidence: { realmTarget: 'stage_2', reasonText: 'Đột phá thất bại' },
  });
  growthBatch.update(worldBatch, 0);

  // Daily: tích hợp mỗi ngày suốt 90 ngày
  for (let d = 1; d <= 90; d++) {
    worldDaily.setCurrentTick(d * TICKS_PER_DAY);
    mentalDaily.update(worldDaily, 1.0);
  }
  // Batch: tích hợp theo bước 30 ngày (ngày 30, 60, 90)
  for (const d of [30, 60, 90]) {
    worldBatch.setCurrentTick(d * TICKS_PER_DAY);
    mentalBatch.update(worldBatch, 30.0);
  }

  const gDaily = worldDaily.getComponent(entDaily, GrowthMindComponent)!;
  const gBatch = worldBatch.getComponent(entBatch, GrowthMindComponent)!;

  assert.ok(
    Math.abs(gDaily.willpowerXp - gBatch.willpowerXp) <= 1e-6,
    'Scenario 8: 30-day batch and daily willpowerXp match'
  );
  assert.ok(
    Math.abs(gDaily.mindsetXp - gBatch.mindsetXp) <= 1e-6,
    'Scenario 8: 30-day batch and daily mindsetXp match'
  );
  assert.ok(
    Math.abs(gDaily.mentalState - gBatch.mentalState) <= 1e-6,
    `Scenario 8: 30-day batch (${gBatch.mentalState}) and daily (${gDaily.mentalState}) mentalState match within 1e-6`
  );

  growthDaily.destroy();
  growthBatch.destroy();
  TimeManager.getInstance().reset();

  const scenariosSummary = {
    scenario1_idle100Years: {
      initialP: initialP1,
      finalP: finalP1,
      willpowerXp: g1.willpowerXp,
      mindsetXp: g1.mindsetXp,
    },
    scenario2_routineWork100Years: {
      willScore: Math.round(wScore2 * 100) / 100,
      mindScore: Math.round(mScore2 * 100) / 100,
    },
    scenario3_routineMeditation100Years: {
      willScore: Math.round(wScore3 * 100) / 100,
      mindScore: Math.round(mScore3 * 100) / 100,
    },
    scenario4_combinedChallenges100Years: {
      willScore: Math.round(wScore4 * 100) / 100,
      mindScore: Math.round(mScore4 * 100) / 100,
    },
    scenario5_trainedVsUntrainedSameInnate: {
      untrainedP: untrainedPot.total,
      trainedP: trainedPot.displayTotal,
      diffTrained,
      maxPossibleGrowthDiff,
    },
    scenario6_innate100Untrained: {
      totalP: innate100Untrained.total,
    },
    scenario7_bereavementRecoveryAndReflection: {
      stateAtTrauma: Math.round(stateAtTrauma * 100) / 100,
      stateAfter180Days: Math.round(stateAfterRecovery * 100) / 100,
      mindsetXpAtTrauma: mXpAtTrauma,
      mindsetXpAfterReflection: Math.round(mXpAfterResolve * 100) / 100,
    },
    scenario8_batch30DayVsDailyParity: {
      dailyMentalState: Math.round(gDaily.mentalState * 1e6) / 1e6,
      batchMentalState: Math.round(gBatch.mentalState * 1e6) / 1e6,
      absDiff: Math.abs(gDaily.mentalState - gBatch.mentalState),
    },
  };

  console.log(JSON.stringify(scenariosSummary, null, 2));
  return scenariosSummary;
}

runCatalogCoverageReport();
runPopulationSimulation();
runGrowthScenarios();
console.log('\nPASS talent-population: A12 catalog coverage, A13 100,000 natural population simulation, and 8 100-year deterministic growth scenarios verified!');
