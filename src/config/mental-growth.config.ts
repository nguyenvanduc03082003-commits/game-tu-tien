export type GrowthEventKind =
  | 'work_completed'
  | 'study_completed'
  | 'meditation_completed'
  | 'mentoring_completed'
  | 'encounter_survived'
  | 'breakthrough_succeeded'
  | 'breakthrough_failed'
  | 'tribulation_passed'
  | 'responsibility_completed'
  | 'bereavement'
  | 'reflection_completed';

export type ExperienceKind =
  | 'setback'
  | 'bereavement'
  | 'danger'
  | 'responsibility'
  | 'insight';

export const MAX_GROWTH_XP = 6000;
export const GROWTH_BUCKET_WINDOW_DAYS = 30;
export const MAX_STORED_DAY_BUCKETS = 31;
export const MAX_FAMILY_KEYS_PER_DAY = 64;
export const MAX_RECENT_EVENT_IDS = 256;
export const MAX_EXPERIENCES = 24;
export const MAX_RECENT_GAINS = 20;
export const MAX_EVENT_AGE_DAYS = 720;
export const MIN_ACTIVE_GROWTH_AGE = 12;

export const ROUTINE_XP_CAPS = {
  dailyWill: 2,
  dailyMind: 1,
  rolling30DayWill: 20,
  rolling30DayMind: 12,
} as const;

export const EXPERIENCE_XP_CAPS = {
  dailyWill: 25,
  dailyMind: 15,
  rolling30DayWill: 100,
  rolling30DayMind: 80,
} as const;

export const NOVELTY_FACTORS = [1.0, 0.35, 0.1, 0] as const;

export const TRAINING_FACTOR_BOUNDS = {
  min: 0.5,
  max: 1.25,
} as const;

export const DIFFICULTY_FACTOR_BOUNDS = {
  min: 0,
  max: 1.25,
} as const;

export interface GrowthEventRule {
  kind: GrowthEventKind;
  category: 'routine' | 'experience';
  baseWillXp: number;
  baseMindXp: number;
  cooldownDays: number;
  willScoreCeiling: number;
  mindScoreCeiling: number;
  usesNovelty: boolean;
  requiresMilestoneKey?: boolean;
}

export const GROWTH_EVENT_RULES: Record<GrowthEventKind, GrowthEventRule> = {
  work_completed: {
    kind: 'work_completed',
    category: 'routine',
    baseWillXp: 0.5,
    baseMindXp: 0,
    cooldownDays: 1,
    willScoreCeiling: 40,
    mindScoreCeiling: 0,
    usesNovelty: false,
  },
  study_completed: {
    kind: 'study_completed',
    category: 'routine',
    baseWillXp: 1,
    baseMindXp: 1,
    cooldownDays: 3,
    willScoreCeiling: 60,
    mindScoreCeiling: 50,
    usesNovelty: false,
  },
  meditation_completed: {
    kind: 'meditation_completed',
    category: 'routine',
    baseWillXp: 1,
    baseMindXp: 0.5,
    cooldownDays: 1,
    willScoreCeiling: 50,
    mindScoreCeiling: 40,
    usesNovelty: false,
  },
  mentoring_completed: {
    kind: 'mentoring_completed',
    category: 'experience',
    baseWillXp: 1,
    baseMindXp: 3,
    cooldownDays: 7,
    willScoreCeiling: 75,
    mindScoreCeiling: 75,
    usesNovelty: true,
  },
  encounter_survived: {
    kind: 'encounter_survived',
    category: 'experience',
    baseWillXp: 5,
    baseMindXp: 0,
    cooldownDays: 7,
    willScoreCeiling: 85,
    mindScoreCeiling: 0,
    usesNovelty: true,
  },
  breakthrough_succeeded: {
    kind: 'breakthrough_succeeded',
    category: 'experience',
    baseWillXp: 6,
    baseMindXp: 4,
    cooldownDays: 0,
    willScoreCeiling: 100,
    mindScoreCeiling: 100,
    usesNovelty: false,
    requiresMilestoneKey: true,
  },
  tribulation_passed: {
    kind: 'tribulation_passed',
    category: 'experience',
    baseWillXp: 20,
    baseMindXp: 10,
    cooldownDays: 0,
    willScoreCeiling: 100,
    mindScoreCeiling: 100,
    usesNovelty: false,
    requiresMilestoneKey: true,
  },
  responsibility_completed: {
    kind: 'responsibility_completed',
    category: 'experience',
    baseWillXp: 8,
    baseMindXp: 4,
    cooldownDays: 30,
    willScoreCeiling: 90,
    mindScoreCeiling: 90,
    usesNovelty: true,
  },
  breakthrough_failed: {
    kind: 'breakthrough_failed',
    category: 'experience',
    baseWillXp: 0,
    baseMindXp: 0,
    cooldownDays: 0,
    willScoreCeiling: 0,
    mindScoreCeiling: 0,
    usesNovelty: false,
  },
  bereavement: {
    kind: 'bereavement',
    category: 'experience',
    baseWillXp: 0,
    baseMindXp: 0,
    cooldownDays: 0,
    willScoreCeiling: 0,
    mindScoreCeiling: 0,
    usesNovelty: false,
  },
  reflection_completed: {
    kind: 'reflection_completed',
    category: 'experience',
    baseWillXp: 4,
    baseMindXp: 6,
    cooldownDays: 30,
    willScoreCeiling: 100,
    mindScoreCeiling: 100,
    usesNovelty: true,
  },
};

export interface ExperienceTemplate {
  id: 'breakthrough_setback' | 'danger_survived' | 'bereavement_friend' | 'bereavement_close_kin' | 'major_achievement';
  kind: ExperienceKind;
  severity: number;
  initialEmotion: number;
  halfLifeDays: number;
  readyOffsetDays: number;
  requiredReflectionDays: number;
  reflectionWillXp: number;
  reflectionMindXp: number;
  reflectionCooldownDays: number;
}

export const EXPERIENCE_TEMPLATES: Record<ExperienceTemplate['id'], ExperienceTemplate> = {
  breakthrough_setback: {
    id: 'breakthrough_setback',
    kind: 'setback',
    severity: 2,
    initialEmotion: -12,
    halfLifeDays: 15,
    readyOffsetDays: 3,
    requiredReflectionDays: 3,
    reflectionWillXp: 4,
    reflectionMindXp: 6,
    reflectionCooldownDays: 30,
  },
  danger_survived: {
    id: 'danger_survived',
    kind: 'danger',
    severity: 3,
    initialEmotion: -10,
    halfLifeDays: 10,
    readyOffsetDays: 3,
    requiredReflectionDays: 5,
    reflectionWillXp: 4,
    reflectionMindXp: 6,
    reflectionCooldownDays: 30,
  },
  bereavement_friend: {
    id: 'bereavement_friend',
    kind: 'bereavement',
    severity: 4,
    initialEmotion: -25,
    halfLifeDays: 60,
    readyOffsetDays: 15,
    requiredReflectionDays: 10,
    reflectionWillXp: 3,
    reflectionMindXp: 10,
    reflectionCooldownDays: 0,
  },
  bereavement_close_kin: {
    id: 'bereavement_close_kin',
    kind: 'bereavement',
    severity: 5,
    initialEmotion: -40,
    halfLifeDays: 120,
    readyOffsetDays: 30,
    requiredReflectionDays: 20,
    reflectionWillXp: 3,
    reflectionMindXp: 10,
    reflectionCooldownDays: 0,
  },
  major_achievement: {
    id: 'major_achievement',
    kind: 'insight',
    severity: 3,
    initialEmotion: 15,
    halfLifeDays: 20,
    readyOffsetDays: 0,
    requiredReflectionDays: 0,
    reflectionWillXp: 0,
    reflectionMindXp: 0,
    reflectionCooldownDays: 0,
  },
};

export const MENTAL_STATE_CONFIG = {
  min: -100,
  max: 100,
  mindsetEquilibriumWeight: 0.2,
  baseTauDays: 7,
  tauDaysMin: 2,
  tauDaysMax: 30,
  recoveryFactorMin: 0.5,
  recoveryFactorMax: 2.0,
  memoryPressureTopK: 5,
  memoryPressureMin: -70,
  memoryPressureMax: 30,
  needsUrgentPenaltyCap: -20,
  safeEnvironmentSupport: 5,
  relationshipSupportMax: 10,
  resolvedEmotionRetentionRatio: 0.40,
  lowMentalStateReflectThreshold: -40,
} as const;
