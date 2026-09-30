import { SeededRNG } from '../../core/SeededRNG.ts';
import {
  GENERATED_ADULT_GROWTH_RANGES,
  RACE_INNATE_BASE_CENTERS,
  SeedClassDefinition,
  TALENT_GENERATION_VERSION,
  TALENT_SEED_CLASSES,
  TRAIT_TIER_CONFIG,
  TalentSeedClass,
} from '../../config/talent.config.ts';
import {
  RaceId,
  TraitDefinitionV3,
  TraitOrigin,
  TraitTier,
} from '../../config/traits/trait.types.ts';
import { SpiritualRootType } from '../beings/BeingComponents.ts';
import {
  ALL_TRAITS_LIST_V3,
  areTraitsConflictingV3,
  getTraitDefinition,
  isTraitAllowedForRaceAndSpecies,
  isTraitPurelyNegative,
  resolveTraitId,
} from '../traits/TraitCatalog.ts';
import {
  GrowthMindComponent,
  InnateScores,
  PendingRoot,
  TalentProfileComponent,
} from './TalentComponents.ts';
import {
  calculateRootAptitudeBase,
  clampFinite,
  xpForScore,
} from './PotentialCalculator.ts';
import { computeDeterministicHash } from '../save/TraitTalentMigration.ts';
import { TimeState, calendarDayFloorAtTick } from '../../core/TimeManager.ts';

export interface ParentGenerationInfo {
  entityId: number;
  profile?: TalentProfileComponent;
  ownedTraitIds: string[];
  lineageTags: string[];
}

export interface GenerationContext {
  worldSeed: number;
  birthOrdinal: number;
  raceId: RaceId;
  speciesId?: string;
  mode: 'natural' | 'curated';
  isNewborn: boolean;
  parents?: [ParentGenerationInfo, ParentGenerationInfo];
  customTraits?: readonly string[];
  allowReincarnation?: boolean;
  defaultLineageTags?: readonly string[];
  forcedSeedClass?: TalentSeedClass;
  currentTotalTicks?: number;
  timeState?: TimeState;
}

export interface GeneratedTalentBundle {
  birthSeed: number;
  seedClass: TalentSeedClass;
  budget: number;
  remainingBudget: number;
  selectedTraitIds: string[];
  initialRootType: SpiritualRootType;
  profile: TalentProfileComponent;
  growth: GrowthMindComponent;
}

const FIVE_ELEMENTS = ['kim', 'moc', 'thuy', 'hoa', 'tho'] as const;

function pickDeterministicElements(rng: SeededRNG, count: number): string[] {
  const pool: string[] = [...FIVE_ELEMENTS];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = rng.nextInt(0, i);
    const tmp = pool[i];
    pool[i] = pool[j];
    pool[j] = tmp;
  }
  return pool.slice(0, Math.max(1, Math.min(pool.length, count)));
}

export function deriveFounderLineageTags(
  raceId: RaceId,
  speciesId?: string,
  defaultTags?: readonly string[]
): string[] {
  const tags = new Set<string>(defaultTags ?? []);
  if (raceId === 'beast') {
    tags.add('beast_mixed');
    switch (speciesId) {
      case 'dragon':
        tags.add('dragon');
        break;
      case 'ape':
        tags.add('ape');
        break;
      case 'wolf':
        tags.add('wolf');
        break;
      case 'tiger':
      case 'leopard':
        tags.add('tiger');
        break;
      case 'deer':
        tags.add('deer');
        break;
      case 'eagle':
      case 'crane':
        tags.add('avian');
        break;
    }
  }
  return Array.from(tags);
}

function rollSeedClass(rng: SeededRNG): SeedClassDefinition {
  const totalWeight = TALENT_SEED_CLASSES.reduce((s, c) => s + c.probabilityWeight, 0);
  let roll = rng.next() * totalWeight;
  for (const def of TALENT_SEED_CLASSES) {
    if (roll < def.probabilityWeight) {
      return def;
    }
    roll -= def.probabilityWeight;
  }
  return TALENT_SEED_CLASSES[0];
}

function rollInitialPendingRoot(rng: SeededRNG, raceId: RaceId): PendingRoot {
  if (raceId === 'beast') {
    return {
      rootType: 'true',
      purity: 70,
      elements: ['hoa', 'tho'],
      gradeName: 'Yêu Đan Linh Căn',
    };
  }
  if (raceId === 'demon') {
    return {
      rootType: 'true',
      purity: 70,
      elements: ['hoa', 'tho'],
      gradeName: 'Hỗn Độn Ma Căn',
    };
  }

  const roll = rng.next() * 100;
  if (roll < 75.0) {
    return {
      rootType: 'none',
      purity: 0,
      elements: [],
      gradeName: 'Vô Linh Căn (Phàm Nhân)',
    };
  } else if (roll < 95.0) {
    return {
      rootType: 'impure',
      purity: rng.nextInt(15, 39),
      elements: pickDeterministicElements(rng, 4),
      gradeName: 'Ngũ Hành Tạp Linh Căn',
    };
  } else if (roll < 99.0) {
    return {
      rootType: 'true',
      purity: rng.nextInt(50, 74),
      elements: pickDeterministicElements(rng, 3),
      gradeName: 'Chân Linh Căn (Tam Căn)',
    };
  } else if (roll < 99.99) {
    return {
      rootType: 'earth',
      purity: rng.nextInt(75, 94),
      elements: pickDeterministicElements(rng, 2),
      gradeName: 'Địa Linh Căn (Song Căn)',
    };
  } else {
    return {
      rootType: 'heaven',
      purity: 100,
      elements: pickDeterministicElements(rng, 1),
      gradeName: 'Thiên Linh Căn (Cực Phẩm Vạn Năm)',
    };
  }
}

export function getRootGradeName(rootType: SpiritualRootType, raceId: string): string {
  if (raceId === 'beast' && rootType !== 'none') return 'Yêu Đan Linh Căn';
  if (raceId === 'demon' && rootType !== 'none') return 'Hỗn Độn Ma Căn';
  switch (rootType) {
    case 'none':
      return 'Vô Linh Căn (Phàm Nhân)';
    case 'impure':
      return 'Ngũ Hành Tạp Linh Căn';
    case 'true':
      return 'Chân Linh Căn (Tam Căn)';
    case 'earth':
      return 'Địa Linh Căn (Song Căn)';
    case 'heaven':
      return 'Thiên Linh Căn (Tuyệt Đỉnh)';
  }
}

/**
 * Bộ sinh hồ sơ tiềm năng & đặc điểm có seed lặp lại được (mục 7.1 – 7.5).
 * Tách biệt hoàn toàn stream thiên phú và stream trưởng thành khởi tạo khỏi RNG ngoại hình/tên.
 */
export function generateTalentBundle(ctx: GenerationContext): GeneratedTalentBundle {
  const birthSeed = computeDeterministicHash(
    ctx.worldSeed,
    ctx.birthOrdinal,
    TALENT_GENERATION_VERSION * 1009 + 17
  );
  const rng = new SeededRNG(birthSeed || 1);
  const adultRng = new SeededRNG(
    computeDeterministicHash(birthSeed, ctx.birthOrdinal, 991) || 2
  );

  // 1. Xác định lineageTags từ cha mẹ hoặc founder
  const lineageSet = new Set<string>(
    deriveFounderLineageTags(ctx.raceId, ctx.speciesId, ctx.defaultLineageTags)
  );
  if (ctx.parents) {
    for (const p of ctx.parents) {
      for (const tag of p.lineageTags) {
        lineageSet.add(tag);
      }
      if (p.profile) {
        for (const tag of p.profile.lineageTags) {
          lineageSet.add(tag);
        }
      }
    }
  }

  // 2. Chọn SeedClass và Budget
  let seedDef: SeedClassDefinition;
  if (ctx.forcedSeedClass) {
    seedDef =
      TALENT_SEED_CLASSES.find(s => s.id === ctx.forcedSeedClass) ??
      TALENT_SEED_CLASSES[0];
  } else if (ctx.mode === 'curated' && ctx.customTraits && ctx.customTraits.length > 0) {
    seedDef = TALENT_SEED_CLASSES.find(s => s.id === 'prodigy')!;
  } else {
    seedDef = rollSeedClass(rng);
  }

  // Seed hiếm có xác suất thức tỉnh dòng dõi tổ tiên
  if (!ctx.parents) {
    if (ctx.raceId === 'human' && seedDef.id === 'legendary' && rng.next() < 0.35) {
      lineageSet.add('human_imperial');
    } else if (
      ctx.raceId === 'demon' &&
      (seedDef.id === 'prodigy' || seedDef.id === 'exceptional' || seedDef.id === 'legendary')
    ) {
      if (rng.next() < 0.4) lineageSet.add('demon_royal');
      else if (rng.next() < 0.4) lineageSet.add('tu_la');
    }
  }

  const lineageTags = Array.from(lineageSet);
  const budget = rng.nextInt(seedDef.budgetMin, seedDef.budgetMax);
  let remainingBudget = budget;

  // 3. Roll nền Ngộ tính & Thể chất (C & B) và pha trộn di truyền cha mẹ (mục 7.3)
  const raceCenter = RACE_INNATE_BASE_CENTERS[ctx.raceId];
  const spreadC = (rng.next() * 2 - 1) * raceCenter.spread;
  const spreadB = (rng.next() * 2 - 1) * raceCenter.spread;

  let baseC = clampFinite(
    Math.round((raceCenter.comprehension + spreadC + seedDef.baseInnateOffset) * 10) / 10,
    0,
    100,
    raceCenter.comprehension
  );
  let baseB = clampFinite(
    Math.round((raceCenter.physique + spreadB + seedDef.baseInnateOffset) * 10) / 10,
    0,
    100,
    raceCenter.physique
  );

  if (ctx.parents) {
    const [pA, pB] = ctx.parents;
    const profA = pA.profile;
    const profB = pB.profile;
    // Chỉ pha trộn gene nền khi cả cha và mẹ đều có base V3 chưa bị dính legacyAnchor
    if (profA && profB && !profA.legacyAnchor && !profB.legacyAnchor) {
      const meanParentC = (profA.base.comprehension + profB.base.comprehension) / 2;
      const meanParentB = (profA.base.physique + profB.base.physique) / 2;
      baseC = clampFinite(
        Math.round((0.6 * baseC + 0.4 * meanParentC) * 10) / 10,
        0,
        100,
        baseC
      );
      baseB = clampFinite(
        Math.round((0.6 * baseB + 0.4 * meanParentB) * 10) / 10,
        0,
        100,
        baseB
      );
    }
  }

  // 4. Roll kết quả Linh căn tiềm ẩn một lần
  const pendingRoot = rollInitialPendingRoot(rng, ctx.raceId);
  const initialRootType: SpiritualRootType = pendingRoot.rootType;

  // 5. Chọn đặc điểm bẩm sinh từ catalog active
  const selectedTraitIds: string[] = [];
  let negativeTraitCount = 0;

  const canSelectTrait = (def: TraitDefinitionV3, enforceBudgetAndTier: boolean): boolean => {
    if (def.implementation !== 'active') return false;
    if (def.origin === 'acquired') return false;
    if (!isTraitAllowedForRaceAndSpecies(def, ctx.raceId, ctx.speciesId)) return false;

    if (def.origin === 'lineage') {
      if (!def.requiredLineageTags || def.requiredLineageTags.length === 0) return false;
      if (!def.requiredLineageTags.every(t => lineageTags.includes(t))) return false;
    }

    if (def.origin === 'reincarnation') {
      const allowReinc =
        (ctx.mode === 'curated' && Boolean(ctx.allowReincarnation)) ||
        (seedDef.id === 'legendary' && Boolean(ctx.allowReincarnation));
      if (!allowReinc) return false;
    }

    if (enforceBudgetAndTier) {
      if (def.tier > seedDef.maxTier) return false;
      if (def.traitCost > remainingBudget) return false;
      if (def.spawnWeight <= 0) return false;
    }

    if (selectedTraitIds.some(curId => areTraitsConflictingV3(curId, def.id))) {
      return false;
    }

    if (isTraitPurelyNegative(def) && negativeTraitCount >= 1) {
      return false;
    }

    return true;
  };

  // 5.1 Xử lý customTraits
  if (ctx.customTraits && ctx.customTraits.length > 0) {
    for (const rawId of ctx.customTraits) {
      const canonical = resolveTraitId(rawId);
      const def = getTraitDefinition(canonical);
      if (!def) continue;

      const enforceBudget = ctx.mode === 'natural';
      if (canSelectTrait(def, enforceBudget)) {
        selectedTraitIds.push(def.id);
        if (isTraitPurelyNegative(def)) negativeTraitCount++;
        if (enforceBudget) {
          remainingBudget = Math.max(0, remainingBudget - def.traitCost);
        }
      }
    }
  }

  // 5.2 Roll thêm đặc điểm theo ngân sách và giới hạn slot
  const maxSlots =
    ctx.mode === 'curated'
      ? Math.max(seedDef.maxInnateSlots, selectedTraitIds.length + 1)
      : seedDef.maxInnateSlots;

  const allowReincarnationNatural =
    seedDef.id === 'legendary' && rng.next() < 0.15;

  const allowedOrigins = new Set<TraitOrigin>(['innate', 'lineage']);
  if (allowReincarnationNatural || (ctx.mode === 'curated' && ctx.allowReincarnation)) {
    allowedOrigins.add('reincarnation');
  }

  const parentTraitCounts = new Map<string, number>();
  if (ctx.parents) {
    for (const p of ctx.parents) {
      for (const tid of p.ownedTraitIds) {
        const cId = resolveTraitId(tid);
        parentTraitCounts.set(cId, (parentTraitCounts.get(cId) ?? 0) + 1);
      }
    }
  }

  let attempts = 0;
  while (
    selectedTraitIds.length < maxSlots &&
    remainingBudget >= TRAIT_TIER_CONFIG[1].cost &&
    attempts < 32
  ) {
    attempts++;

    const eligible = ALL_TRAITS_LIST_V3.filter(def => {
      if (!allowedOrigins.has(def.origin)) return false;
      if (def.implementation !== 'active' || def.spawnWeight <= 0) return false;
      if (def.tier > seedDef.maxTier || def.traitCost > remainingBudget) return false;
      if (!isTraitAllowedForRaceAndSpecies(def, ctx.raceId, ctx.speciesId)) return false;
      if (def.origin === 'lineage') {
        if (!def.requiredLineageTags?.every(t => lineageTags.includes(t))) return false;
      }
      if (selectedTraitIds.some(curId => areTraitsConflictingV3(curId, def.id))) {
        return false;
      }
      if (isTraitPurelyNegative(def) && negativeTraitCount >= 1) {
        return false;
      }
      return true;
    });

    if (eligible.length === 0) break;

    // Nhóm theo tier hợp lệ và chọn tier theo trọng số có điều kiện (1:64, 2:25, 3:8, 4:2.7, 5:0.3)
    const tiersPresent = Array.from(new Set(eligible.map(d => d.tier))).sort((a, b) => a - b);
    const tierTotalWeight = tiersPresent.reduce(
      (s, t) => s + TRAIT_TIER_CONFIG[t].conditionalRollWeight,
      0
    );
    let tierRoll = rng.next() * tierTotalWeight;
    let chosenTier: TraitTier = tiersPresent[0];
    for (const t of tiersPresent) {
      const w = TRAIT_TIER_CONFIG[t].conditionalRollWeight;
      if (tierRoll < w) {
        chosenTier = t;
        break;
      }
      tierRoll -= w;
    }

    const tierCandidates = eligible.filter(d => d.tier === chosenTier);
    const weightedCandidates = tierCandidates.map(def => {
      let w = def.spawnWeight;
      if (def.origin === 'lineage') {
        const pCount = parentTraitCounts.get(def.id) ?? 0;
        if (pCount === 1) w *= 2;
        else if (pCount >= 2) w *= 4;
      }
      return { def, weight: w };
    });

    const candidateWeightSum = weightedCandidates.reduce((s, c) => s + c.weight, 0);
    let candRoll = rng.next() * candidateWeightSum;
    let chosenDef = weightedCandidates[0].def;
    for (const item of weightedCandidates) {
      if (candRoll < item.weight) {
        chosenDef = item.def;
        break;
      }
      candRoll -= item.weight;
    }

    selectedTraitIds.push(chosenDef.id);
    remainingBudget = Math.max(0, remainingBudget - chosenDef.traitCost);
    if (isTraitPurelyNegative(chosenDef)) {
      negativeTraitCount++;
    }
  }

  // 6. Áp primaryRootOverride nếu có chọn primary_root trait (chỉ tối đa 1)
  for (const tid of selectedTraitIds) {
    const def = getTraitDefinition(tid);
    if (def?.primaryRootOverride) {
      pendingRoot.rootType = def.primaryRootOverride.rootType;
      pendingRoot.purity = def.primaryRootOverride.purity;
      pendingRoot.elements = [...def.primaryRootOverride.elements];
      pendingRoot.primaryTraitId = def.id;
      pendingRoot.gradeName = `${def.name} (${getRootGradeName(def.primaryRootOverride.rootType, ctx.raceId)})`;
      break;
    }
  }

  const baseA = calculateRootAptitudeBase(pendingRoot.rootType, pendingRoot.purity);
  const baseScores: InnateScores = {
    comprehension: baseC,
    aptitude: baseA,
    physique: baseB,
  };

  const knowledge: TalentProfileComponent['knowledge'] = ctx.isNewborn
    ? 'unassessed'
    : 'revealed';

  const profile = new TalentProfileComponent({
    schemaVersion: 3,
    birthSeed,
    seedClass: seedDef.id,
    base: baseScores,
    pendingRoot,
    lineageTags,
    foundationChanges: [],
    knowledge,
  });

  // 7. Khởi tạo GrowthMindComponent (mục 7.2 & 7.5)
  let growth: GrowthMindComponent;
  const currentTicks = ctx.currentTotalTicks ?? 0;
  const currentDay = calendarDayFloorAtTick(ctx.timeState, currentTicks);

  if (ctx.isNewborn) {
    growth = new GrowthMindComponent({
      willpowerXp: 0,
      mindsetXp: 0,
      mentalState: 0,
      lastIntegratedTick: currentTicks,
      backgroundSource: 'newborn',
    });
  } else {
    const wScore = adultRng.nextInt(
      GENERATED_ADULT_GROWTH_RANGES.willpowerScoreMin,
      GENERATED_ADULT_GROWTH_RANGES.willpowerScoreMax
    );
    const mScore = adultRng.nextInt(
      GENERATED_ADULT_GROWTH_RANGES.mindsetScoreMin,
      GENERATED_ADULT_GROWTH_RANGES.mindsetScoreMax
    );
    const wXp = xpForScore(wScore);
    const mXp = xpForScore(mScore);
    growth = new GrowthMindComponent({
      willpowerXp: wXp,
      mindsetXp: mXp,
      mentalState: 0,
      lastIntegratedTick: currentTicks,
      backgroundSource: 'generatedAdult',
      recentGains: [
        {
          day: currentDay,
          willXp: Math.round(wXp * 10) / 10,
          mindXp: Math.round(mXp * 10) / 10,
          reason: 'Nền trải nghiệm trước khi xuất hiện',
        },
      ],
    });
  }

  return {
    birthSeed,
    seedClass: seedDef.id,
    budget,
    remainingBudget,
    selectedTraitIds,
    initialRootType,
    profile,
    growth,
  };
}
