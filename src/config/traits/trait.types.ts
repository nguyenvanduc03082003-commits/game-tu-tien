export type RaceId = 'human' | 'beast' | 'demon';
export type TraitTier = 1 | 2 | 3 | 4 | 5;
export type TraitOrigin = 'innate' | 'acquired' | 'lineage' | 'reincarnation';
export type InnateAxis = 'comprehension' | 'aptitude' | 'physique';
export type TraitDimension =
  | 'physique'
  | 'root'
  | 'mindset'
  | 'combat'
  | 'profession'
  | 'social'
  | 'survival';
export type ImplementationState = 'active' | 'planned' | 'legacyOnly';
export type TraitCategory = 'innate' | 'technique' | 'experience' | 'profession';

export type CapabilityTag =
  | 'sentient'
  | 'canLearnProfession'
  | 'hasManipulator'
  | 'hasWings'
  | 'hasShell'
  | 'aquatic'
  | 'feline'
  | 'canine';

export type ExclusiveGroupId =
  | 'primary_root'
  | 'major_physique'
  | 'reincarnation'
  | 'ancestral_bloodline'
  | 'destiny_major'
  | 'combat_experience';

export interface TraitCondition {
  kind: 'minAge' | 'minRealm' | 'capability' | 'lineage' | 'hasTrait' | 'achievement';
  key?: string;
  value?: number;
}

export type CanonicalModifierKey =
  | 'healthFactor'
  | 'attackFactor'
  | 'defenseFlat'
  | 'armorFlat'
  | 'attackSpeedFactor'
  | 'critChanceBonus'
  | 'dodgeChanceBonus'
  | 'moveSpeedFactor'
  | 'lifespanYears'
  | 'qiRateFactor'
  | 'breakthroughChanceBonus'
  | 'techniqueLearningFactor'
  | 'hungerRateFactor'
  | 'thirstRateFactor'
  | 'workSpeedFactor'
  | 'willTrainingBonus'
  | 'mindTrainingBonus'
  | 'mentalEquilibriumBias'
  | 'mentalRecoveryBonus'
  | 'legacyPhysiqueFlat';

export type ModifierUnit = 'factor' | 'flat' | 'probability' | 'years';
export type ModifierMergeMode = 'multiply' | 'add';

export interface TraitModifier {
  key: CanonicalModifierKey;
  mode: ModifierMergeMode;
  unit: ModifierUnit;
  value: number;
  sourceKey?: string;
}

export type TraitEffect =
  | {
      id: 'regeneration';
      kind: 'regeneration';
      bonusRatio: number;
      cooldownTicks?: number;
    }
  | {
      id: 'lowHpAttack';
      kind: 'lowHpAttack';
      hpThresholdRatio: number;
      attackBonusRatio: number;
    }
  | {
      id: 'tribulationResistance';
      kind: 'tribulationResistance';
      damageReductionRatio: number;
    };

export interface PrimaryRootOverride {
  rootType: 'impure' | 'true' | 'earth' | 'heaven';
  purity: number;
  elements: string[];
  qiRateFactor: number;
}

export interface LegacyStatModifiers {
  qiAbsorptionMultiplier?: number;
  breakthroughChanceBonus?: number;
  comprehensionMultiplier?: number;
  healthMultiplier?: number;
  combatPowerMultiplier?: number;
  lifespanBonus?: number;
  physiqueBonus?: number;
  defenseBonus?: number;
  moveSpeedMultiplier?: number;
  attackSpeedMultiplier?: number;
  critRateBonus?: number;
  dodgeRateBonus?: number;
  armorBonus?: number;
  hungerRateMultiplier?: number;
  thirstRateMultiplier?: number;
  alchemySuccessBonus?: number;
  craftingSpeedMultiplier?: number;
  factionPrestigeBonus?: number;
}

export interface TraitDefinitionV3 {
  id: string;
  name: string;
  description: string;
  sourceDescription?: string;
  sourceVectorText?: string;
  sourceEffectsText?: string;
  tier: TraitTier;
  dimension: TraitDimension;
  origin: TraitOrigin;
  allowedRaces: 'all' | readonly RaceId[];
  allowedSpecies?: readonly string[];
  requiredLineageTags?: readonly string[];
  activation: readonly TraitCondition[];
  acquisition: readonly TraitCondition[];
  exclusiveGroups: readonly string[];
  conflictsWith: readonly string[];
  evolvesFrom?: string;
  implementation: ImplementationState;
  deferredReason?: string;
  unmappedEffectKeys?: readonly string[];
  spawnWeight: number;
  traitCost: number;
  innateDelta: Partial<Record<InnateAxis, number>>;
  primaryRootOverride?: PrimaryRootOverride;
  learningAffinity: Partial<Record<'combat' | 'profession' | 'cultivation', number>>;
  modifiers: readonly TraitModifier[];
  effects: readonly TraitEffect[];
  legacyAliases?: readonly string[];
  // Các trường tương thích ngược cho UI và các hệ thống đang chuyển đổi
  badge: string;
  color: string;
  category: TraitCategory;
  conflicts: readonly string[];
  statModifiers?: LegacyStatModifiers;
}

export interface OwnedTrait {
  id: string;
  origin: TraitOrigin;
  acquiredAtDay: number;
  sourceEventId?: string;
  state: 'active' | 'dormant' | 'legacy';
  legacyGrandfathered?: boolean;
  dormantReason?: string;
}
