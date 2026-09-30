import { RaceId, TraitTier } from './traits/trait.types.ts';
import { SpiritualRootType } from '../modules/beings/BeingComponents.ts';

export type TalentSeedClass =
  | 'ordinary'
  | 'capable'
  | 'talented'
  | 'prodigy'
  | 'exceptional'
  | 'legendary';

export type PotentialGrade =
  | 'ordinary'
  | 'capable'
  | 'excellent'
  | 'genius'
  | 'prodigy';

export const POTENTIAL_WEIGHTS = {
  comprehension: 0.30,
  aptitude: 0.15,
  physique: 0.10,
  willpower: 0.25,
  mindset: 0.20,
} as const;

export const INNATE_WEIGHT_SUM =
  POTENTIAL_WEIGHTS.comprehension +
  POTENTIAL_WEIGHTS.aptitude +
  POTENTIAL_WEIGHTS.physique;

export const GROWTH_WEIGHT_SUM =
  POTENTIAL_WEIGHTS.willpower +
  POTENTIAL_WEIGHTS.mindset;

export function validatePotentialWeights(): boolean {
  const total = INNATE_WEIGHT_SUM + GROWTH_WEIGHT_SUM;
  if (Math.abs(INNATE_WEIGHT_SUM - 0.55) > 1e-9) {
    throw new Error(`Invalid innate weight sum: ${INNATE_WEIGHT_SUM}, expected 0.55`);
  }
  if (Math.abs(GROWTH_WEIGHT_SUM - 0.45) > 1e-9) {
    throw new Error(`Invalid growth weight sum: ${GROWTH_WEIGHT_SUM}, expected 0.45`);
  }
  if (Math.abs(total - 1.0) > 1e-9) {
    throw new Error(`Invalid potential weight sum: ${total}, expected 1.0`);
  }
  return true;
}

// Validate ngay khi nạp module
validatePotentialWeights();

export const TRAIT_TIER_CONFIG: Record<
  TraitTier,
  {
    tier: TraitTier;
    name: string;
    color: string;
    badge: string;
    cost: number;
    conditionalRollWeight: number;
  }
> = {
  1: { tier: 1, name: 'Phàm Phẩm', color: '#94a3b8', badge: '⚪', cost: 3, conditionalRollWeight: 64 },
  2: { tier: 2, name: 'Linh Phẩm', color: '#34d399', badge: '🟢', cost: 8, conditionalRollWeight: 25 },
  3: { tier: 3, name: 'Địa Phẩm', color: '#a78bfa', badge: '🟣', cost: 18, conditionalRollWeight: 8 },
  4: { tier: 4, name: 'Thiên Phẩm', color: '#fbbf24', badge: '🟡', cost: 35, conditionalRollWeight: 2.7 },
  5: { tier: 5, name: 'Tiên Phẩm', color: '#fb7185', badge: '🔴', cost: 60, conditionalRollWeight: 0.3 },
};

export const ROOT_APTITUDE_CONFIG: Record<
  SpiritualRootType,
  {
    rootTypeScore: number;
    defaultPurity: number;
    defaultQiRateFactor: number;
  }
> = {
  none: { rootTypeScore: 0, defaultPurity: 0, defaultQiRateFactor: 0 },
  impure: { rootTypeScore: 25, defaultPurity: 25, defaultQiRateFactor: 0.6 },
  true: { rootTypeScore: 60, defaultPurity: 65, defaultQiRateFactor: 1.2 },
  earth: { rootTypeScore: 85, defaultPurity: 85, defaultQiRateFactor: 1.8 },
  heaven: { rootTypeScore: 100, defaultPurity: 100, defaultQiRateFactor: 1.9 },
};

export const PRIMARY_ROOT_TRAIT_IDS: readonly string[] = [
  'phe_linh_can',
  'bien_di_am_linh_can',
  'am_duong_song_tu',
  'ngu_hanh_cau_toan',
  'thien_linh_can',
  'cuu_tieu_than_loi_can',
  'thai_duong_chan_hoa_can',
  'hon_don_dao_can',
  'kim_linh_can_tinh_thuan',
  'moc_linh_can_tinh_thuan',
  'thuy_linh_can_tinh_thuan',
  'hoa_linh_can_tinh_thuan',
  'tho_linh_can_tinh_thuan',
  'quang_minh_linh_can',
  'thai_am_linh_can',
  'thai_duong_linh_can',
  'hu_khong_linh_can',
  'luan_hoi_dao_can',
] as const;

export interface SeedClassDefinition {
  id: TalentSeedClass;
  name: string;
  probabilityWeight: number;
  budgetMin: number;
  budgetMax: number;
  maxTier: TraitTier;
  maxInnateSlots: number;
  baseInnateOffset: number;
}

export const TALENT_SEED_CLASSES: readonly SeedClassDefinition[] = [
  {
    id: 'ordinary',
    name: 'Phàm nhân',
    probabilityWeight: 55.0,
    budgetMin: 10,
    budgetMax: 25,
    maxTier: 2,
    maxInnateSlots: 2,
    baseInnateOffset: 0,
  },
  {
    id: 'capable',
    name: 'Có tư chất',
    probabilityWeight: 28.0,
    budgetMin: 25,
    budgetMax: 45,
    maxTier: 3,
    maxInnateSlots: 3,
    baseInnateOffset: 3,
  },
  {
    id: 'talented',
    name: 'Thiên tài',
    probabilityWeight: 12.0,
    budgetMin: 45,
    budgetMax: 70,
    maxTier: 3,
    maxInnateSlots: 3,
    baseInnateOffset: 8,
  },
  {
    id: 'prodigy',
    name: 'Thiên kiêu',
    probabilityWeight: 4.0,
    budgetMin: 70,
    budgetMax: 100,
    maxTier: 4,
    maxInnateSlots: 4,
    baseInnateOffset: 15,
  },
  {
    id: 'exceptional',
    name: 'Yêu nghiệt',
    probabilityWeight: 0.9,
    budgetMin: 100,
    budgetMax: 140,
    maxTier: 5,
    maxInnateSlots: 4,
    baseInnateOffset: 22,
  },
  {
    id: 'legendary',
    name: 'Nghịch thiên',
    probabilityWeight: 0.1,
    budgetMin: 140,
    budgetMax: 160,
    maxTier: 5,
    maxInnateSlots: 4,
    baseInnateOffset: 30,
  },
] as const;

export const RACE_INNATE_BASE_CENTERS: Record<
  RaceId,
  { comprehension: number; physique: number; spread: number }
> = {
  human: { comprehension: 50, physique: 35, spread: 8 },
  beast: { comprehension: 30, physique: 60, spread: 8 },
  demon: { comprehension: 40, physique: 50, spread: 8 },
};

export const GENERATED_ADULT_GROWTH_RANGES = {
  willpowerScoreMin: 15,
  willpowerScoreMax: 30,
  mindsetScoreMin: 10,
  mindsetScoreMax: 25,
} as const;

export const LEGACY_MIGRATION_DEFAULTS = {
  adultWillpowerScore: 25,
  adultMindsetScore: 20,
  childWillpowerScore: 0,
  childMindsetScore: 0,
} as const;

export const POTENTIAL_GRADE_CONFIG: Record<
  PotentialGrade,
  { id: PotentialGrade; label: string; color: string; minScore: number }
> = {
  ordinary: { id: 'ordinary', label: 'Bình thường', color: '#94a3b8', minScore: 0 },
  capable: { id: 'capable', label: 'Khá', color: '#34d399', minScore: 40 },
  excellent: { id: 'excellent', label: 'Ưu tú', color: '#60a5fa', minScore: 60 },
  genius: { id: 'genius', label: 'Thiên tài', color: '#a78bfa', minScore: 75 },
  prodigy: { id: 'prodigy', label: 'Thiên kiêu', color: '#fbbf24', minScore: 90 },
};

export const INNATE_AXIS_TRAIT_DELTA_CAP = {
  min: -45,
  max: 45,
} as const;

export const TRAIT_MODIFIER_CAPS = {
  healthFactor: { min: 0.35, max: 3.0 },
  attackFactor: { min: 0.35, max: 2.5 },
  qiRateFactor: { min: 0.25, max: 2.5 },
  moveSpeedFactor: { min: 0.5, max: 1.8 },
  attackSpeedFactor: { min: 0.5, max: 1.8 },
  techniqueLearningFactor: { min: 0.4, max: 2.5 },
  hungerRateFactor: { min: 0.08, max: 2.0 },
  thirstRateFactor: { min: 0.08, max: 2.0 },
  workSpeedFactor: { min: 0.5, max: 2.2 },
  critChanceBonus: { min: -0.40, max: 0.40 },
  dodgeChanceBonus: { min: -0.35, max: 0.35 },
  breakthroughChanceBonus: { min: -0.40, max: 0.35 },
  willTrainingBonus: { min: -0.25, max: 0.25 },
  mindTrainingBonus: { min: -0.15, max: 0.15 },
  mentalEquilibriumBias: { min: -20, max: 20 },
  mentalRecoveryBonus: { min: -0.5, max: 1.0 },
  defenseFlat: { min: -50, max: 120 },
  armorFlat: { min: -50, max: 120 },
  lifespanYears: { min: -80, max: 800 },
  legacyPhysiqueFlat: { min: -20, max: 50 },
} as const;

export const MAP_LABEL_POTENTIAL_THRESHOLD = 80;
export const MAP_LABEL_MIN_STAGE_INDEX = 2;
export const MAX_VISIBLE_MAP_LABELS = 12;
export const TRAIT_SYSTEM_VERSION = 3;
export const TALENT_GENERATION_VERSION = 1;
