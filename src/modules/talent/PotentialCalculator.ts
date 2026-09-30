import {
  INNATE_AXIS_TRAIT_DELTA_CAP,
  POTENTIAL_WEIGHTS,
  PRIMARY_ROOT_TRAIT_IDS,
  PotentialGrade,
  ROOT_APTITUDE_CONFIG,
} from '../../config/talent.config.ts';
import { MAX_GROWTH_XP } from '../../config/mental-growth.config.ts';
import {
  InnateAxis,
  TraitDefinitionV3,
  TraitOrigin,
} from '../../config/traits/trait.types.ts';
import { SpiritualRootType } from '../beings/BeingComponents.ts';
import {
  FoundationChange,
  GrowthMindComponent,
  InnateScores,
  PotentialResult,
  TalentProfileComponent,
} from './TalentComponents.ts';

export interface TraitInnateContributionInput {
  id: string;
  origin: TraitOrigin;
  innateDelta?: Partial<Record<InnateAxis, number>>;
  primaryRootOverride?: TraitDefinitionV3['primaryRootOverride'];
}

export function clampFinite(
  value: number,
  min: number,
  max: number,
  fallback: number = min
): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return Math.min(max, Math.max(min, fallback));
  }
  if (value < min) return min;
  if (value > max) return max;
  // Chuẩn hóa -0 thành +0
  return value === 0 ? 0 : value;
}

export function isFiniteScore(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

/**
 * Chuyển đổi điểm trưởng thành (0..100) sang XP (0..6000)
 * xpForScore(s) = 20*s + 0.4*s^2
 */
export function xpForScore(score: number): number {
  const s = clampFinite(score, 0, 100, 0);
  const xp = 20 * s + 0.4 * s * s;
  return clampFinite(xp, 0, MAX_GROWTH_XP, 0);
}

/**
 * Chuyển đổi XP (0..6000) sang điểm trưởng thành (0..100)
 * scoreFromXp(x) = clamp((-20 + sqrt(400 + 1.6*clamp(x,0,6000))) / 0.8, 0, 100)
 */
export function scoreFromXp(xp: number): number {
  const x = clampFinite(xp, 0, MAX_GROWTH_XP, 0);
  const raw = (-20 + Math.sqrt(400 + 1.6 * x)) / 0.8;
  // Làm tròn vi sai dấu phẩy động cực nhỏ tại các mốc nguyên (ví dụ 240 -> 10)
  const roundedCheck = Math.round(raw * 1e9) / 1e9;
  return clampFinite(roundedCheck, 0, 100, 0);
}

/**
 * Tính điểm tư chất nền từ loại linh căn và độ tinh thuần (mục 6.2)
 * aptitudeBase = 0.8 * rootTypeScore + 0.2 * purity
 */
export function calculateRootAptitudeBase(
  rootType: SpiritualRootType,
  purity?: number
): number {
  if (rootType === 'none') {
    return 0;
  }
  const cfg = ROOT_APTITUDE_CONFIG[rootType] ?? ROOT_APTITUDE_CONFIG.none;
  const resolvedPurity = isFiniteScore(purity) ? purity : cfg.defaultPurity;
  const clampedPurity = clampFinite(resolvedPurity, 0, 100, cfg.defaultPurity);
  return clampFinite(0.8 * cfg.rootTypeScore + 0.2 * clampedPurity, 0, 100, 0);
}

export function isPrimaryRootTrait(
  trait: Pick<TraitInnateContributionInput, 'id' | 'primaryRootOverride'>
): boolean {
  return (
    trait.primaryRootOverride !== undefined ||
    PRIMARY_ROOT_TRAIT_IDS.includes(trait.id)
  );
}

/**
 * Tính tổng đóng góp bẩm sinh của danh sách đặc điểm trên từng trục với diminishing return:
 * 1, 0.5, 0.25, 0.125... tách riêng nhánh dương và nhánh âm, tie-break bằng ID.
 */
export function calculateTraitInnateDeltas(
  traits: readonly TraitInnateContributionInput[]
): InnateScores {
  const uniqueMap = new Map<string, TraitInnateContributionInput>();
  for (const t of traits) {
    if (!t || typeof t.id !== 'string' || !t.id) continue;
    if (!uniqueMap.has(t.id)) {
      uniqueMap.set(t.id, t);
    }
  }

  const eligible = Array.from(uniqueMap.values()).filter(
    t =>
      t.origin === 'innate' ||
      t.origin === 'lineage' ||
      t.origin === 'reincarnation'
  );

  const axes: InnateAxis[] = ['comprehension', 'aptitude', 'physique'];
  const result: InnateScores = {
    comprehension: 0,
    aptitude: 0,
    physique: 0,
  };

  for (const axis of axes) {
    const positives: { id: string; value: number }[] = [];
    const negatives: { id: string; value: number }[] = [];

    for (const trait of eligible) {
      if (axis === 'aptitude' && isPrimaryRootTrait(trait)) {
        // Ngoại lệ primary root: đã quyết định qua loại root & purity, không cộng lần hai
        continue;
      }
      const rawDelta = trait.innateDelta?.[axis];
      if (!isFiniteScore(rawDelta) || rawDelta === 0) continue;
      if (rawDelta > 0) {
        positives.push({ id: trait.id, value: rawDelta });
      } else {
        negatives.push({ id: trait.id, value: rawDelta });
      }
    }

    positives.sort((a, b) => {
      if (b.value !== a.value) return b.value - a.value;
      return a.id.localeCompare(b.id);
    });

    negatives.sort((a, b) => {
      const absDiff = Math.abs(b.value) - Math.abs(a.value);
      if (absDiff !== 0) return absDiff;
      return a.id.localeCompare(b.id);
    });

    let posSum = 0;
    for (let i = 0; i < positives.length; i++) {
      posSum += positives[i].value * Math.pow(0.5, i);
    }

    let negSum = 0;
    for (let i = 0; i < negatives.length; i++) {
      negSum += negatives[i].value * Math.pow(0.5, i);
    }

    result[axis] = clampFinite(
      posSum + negSum,
      INNATE_AXIS_TRAIT_DELTA_CAP.min,
      INNATE_AXIS_TRAIT_DELTA_CAP.max,
      0
    );
  }

  return result;
}

export function calculateFoundationDeltas(
  changes: readonly FoundationChange[]
): InnateScores {
  const seenIds = new Set<string>();
  const seenEvents = new Set<string>();
  const sum: InnateScores = { comprehension: 0, aptitude: 0, physique: 0 };

  for (const fc of changes) {
    if (!fc) continue;
    if (fc.id && seenIds.has(fc.id)) continue;
    if (fc.eventId && seenEvents.has(fc.eventId)) continue;
    if (fc.id) seenIds.add(fc.id);
    if (fc.eventId) seenEvents.add(fc.eventId);

    if (isFiniteScore(fc.delta?.comprehension)) {
      sum.comprehension += fc.delta.comprehension!;
    }
    if (isFiniteScore(fc.delta?.aptitude)) {
      sum.aptitude += fc.delta.aptitude!;
    }
    if (isFiniteScore(fc.delta?.physique)) {
      sum.physique += fc.delta.physique!;
    }
  }

  return sum;
}

export function getPotentialGrade(totalScore: number): PotentialGrade {
  const s = clampFinite(totalScore, 0, 100, 0);
  if (s >= 90) return 'prodigy';
  if (s >= 75) return 'genius';
  if (s >= 60) return 'excellent';
  if (s >= 40) return 'capable';
  return 'ordinary';
}

export function resolveInnateScores(
  profile: Pick<
    TalentProfileComponent,
    'base' | 'foundationChanges' | 'legacyAnchor' | 'migrationBaseIsResolved'
  >,
  resolvedTraits: readonly TraitInnateContributionInput[]
): InnateScores {
  const traitDelta = calculateTraitInnateDeltas(resolvedTraits);
  const foundationDelta = calculateFoundationDeltas(profile.foundationChanges ?? []);

  if (profile.legacyAnchor) {
    const obs = profile.legacyAnchor.observedScores;
    const atMig = profile.legacyAnchor.traitDeltaAtMigration;
    return {
      comprehension: clampFinite(
        clampFinite(obs.comprehension, 0, 100, 0) +
          traitDelta.comprehension -
          clampFinite(atMig.comprehension, -45, 45, 0) +
          foundationDelta.comprehension,
        0,
        100,
        0
      ),
      aptitude: clampFinite(
        clampFinite(obs.aptitude, 0, 100, 0) +
          traitDelta.aptitude -
          clampFinite(atMig.aptitude, -45, 45, 0) +
          foundationDelta.aptitude,
        0,
        100,
        0
      ),
      physique: clampFinite(
        clampFinite(obs.physique, 0, 100, 0) +
          traitDelta.physique -
          clampFinite(atMig.physique, -45, 45, 0) +
          foundationDelta.physique,
        0,
        100,
        0
      ),
    };
  }

  if (profile.migrationBaseIsResolved) {
    return {
      comprehension: clampFinite(
        clampFinite(profile.base.comprehension, 0, 100, 0) + foundationDelta.comprehension,
        0,
        100,
        0
      ),
      aptitude: clampFinite(
        clampFinite(profile.base.aptitude, 0, 100, 0) + foundationDelta.aptitude,
        0,
        100,
        0
      ),
      physique: clampFinite(
        clampFinite(profile.base.physique, 0, 100, 0) + foundationDelta.physique,
        0,
        100,
        0
      ),
    };
  }

  return {
    comprehension: clampFinite(
      clampFinite(profile.base.comprehension, 0, 100, 0) +
        traitDelta.comprehension +
        foundationDelta.comprehension,
      0,
      100,
      0
    ),
    aptitude: clampFinite(
      clampFinite(profile.base.aptitude, 0, 100, 0) +
        traitDelta.aptitude +
        foundationDelta.aptitude,
      0,
      100,
      0
    ),
    physique: clampFinite(
      clampFinite(profile.base.physique, 0, 100, 0) +
        traitDelta.physique +
        foundationDelta.physique,
      0,
      100,
      0
    ),
  };
}

/**
 * Hàm thuần tính điểm tiềm năng tổng hợp (mục 1.1, 5.5, 6.5):
 * P = 0.30 * comprehension + 0.15 * aptitude + 0.10 * physique + 0.25 * willpower + 0.20 * mindset
 * Không đọc mentalState, không Math.random, không mutate tham số.
 */
export function calculatePotential(
  profile: Pick<
    TalentProfileComponent,
    'base' | 'foundationChanges' | 'knowledge' | 'legacyAnchor' | 'migrationBaseIsResolved'
  >,
  growth: Pick<GrowthMindComponent, 'willpowerXp' | 'mindsetXp'> | undefined | null,
  resolvedTraits: readonly TraitInnateContributionInput[] = []
): PotentialResult {
  const innate = resolveInnateScores(profile, resolvedTraits);
  const willpower = scoreFromXp(growth?.willpowerXp ?? 0);
  const mindset = scoreFromXp(growth?.mindsetXp ?? 0);

  const innateContribution =
    POTENTIAL_WEIGHTS.comprehension * innate.comprehension +
    POTENTIAL_WEIGHTS.aptitude * innate.aptitude +
    POTENTIAL_WEIGHTS.physique * innate.physique;

  const growthContribution =
    POTENTIAL_WEIGHTS.willpower * willpower +
    POTENTIAL_WEIGHTS.mindset * mindset;

  // Làm tròn sai số dấu phẩy động bậc 1e-12 để 24 + 10.5 + 6 + 10 + 10 = đúng 60.5
  const rawTotal = Math.round((innateContribution + growthContribution) * 1e12) / 1e12;
  const total = clampFinite(rawTotal, 0, 100, 0);
  const displayTotal = Math.round(total * 10) / 10;
  const assessmentComplete = profile.knowledge !== 'unassessed';

  return {
    scores: {
      comprehension: innate.comprehension,
      aptitude: innate.aptitude,
      physique: innate.physique,
      willpower,
      mindset,
    },
    innateContribution: Math.round(innateContribution * 1e12) / 1e12,
    growthContribution: Math.round(growthContribution * 1e12) / 1e12,
    total,
    displayTotal,
    assessmentComplete,
    grade: getPotentialGrade(total),
  };
}

/**
 * Tính trực tiếp từ 5 điểm đã giải quyết (0..100) — dùng cho kiểm thử nhanh và preview
 */
export function calculatePotentialFromScores(
  scores: InnateScores & { willpower: number; mindset: number },
  assessmentComplete: boolean = true
): PotentialResult {
  const c = clampFinite(scores.comprehension, 0, 100, 0);
  const a = clampFinite(scores.aptitude, 0, 100, 0);
  const b = clampFinite(scores.physique, 0, 100, 0);
  const w = clampFinite(scores.willpower, 0, 100, 0);
  const m = clampFinite(scores.mindset, 0, 100, 0);

  const innateContribution =
    Math.round(
      (POTENTIAL_WEIGHTS.comprehension * c +
        POTENTIAL_WEIGHTS.aptitude * a +
        POTENTIAL_WEIGHTS.physique * b) *
        1e12
    ) / 1e12;

  const growthContribution =
    Math.round(
      (POTENTIAL_WEIGHTS.willpower * w + POTENTIAL_WEIGHTS.mindset * m) * 1e12
    ) / 1e12;

  const total = clampFinite(
    Math.round((innateContribution + growthContribution) * 1e12) / 1e12,
    0,
    100,
    0
  );

  return {
    scores: { comprehension: c, aptitude: a, physique: b, willpower: w, mindset: m },
    innateContribution,
    growthContribution,
    total,
    displayTotal: Math.round(total * 10) / 10,
    assessmentComplete,
    grade: getPotentialGrade(total),
  };
}

/**
 * Adapter chuyển đổi giữa điểm Ngộ tính chuẩn (0..100) và ComprehensionComponent.current cũ (0..100000)
 * 1 điểm chuẩn = 1000 đơn vị cũ (mục 2.1, 9.2)
 */
export function toLegacyComprehensionValue(score0To100: number): number {
  return Math.round(clampFinite(score0To100, 0, 100, 0) * 1000);
}

export function fromLegacyComprehensionValue(legacyValue0To100000: number): number {
  return clampFinite(legacyValue0To100000 / 1000, 0, 100, 0);
}
