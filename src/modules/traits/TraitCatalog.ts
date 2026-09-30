import {
  CanonicalModifierKey,
  ImplementationState,
  RaceId,
  TraitCondition,
  TraitDefinitionV3,
  TraitDimension,
  TraitOrigin,
  TraitTier,
} from '../../config/traits/trait.types.ts';

import { COMMON_TRAITS_V3 } from '../../config/traits/common.traits.ts';
import { HUMAN_TRAITS_V3 } from '../../config/traits/human.traits.ts';
import { BEAST_TRAITS_V3 } from '../../config/traits/beast.traits.ts';
import { DEMON_TRAITS_V3 } from '../../config/traits/demon.traits.ts';
import {
  LEGACY_ONLY_TRAITS_V3,
  LEGACY_TRAIT_ALIASES,
  LEGACY_TRAIT_DEFINITIONS_SNAPSHOT,
} from '../../config/traits/legacy-traits.config.ts';
import { TRAIT_MODIFIER_CAPS, TRAIT_TIER_CONFIG } from '../../config/talent.config.ts';

const VALID_TIERS = new Set<number>([1, 2, 3, 4, 5]);
const VALID_ORIGINS = new Set<string>(['innate', 'acquired', 'lineage', 'reincarnation']);
const VALID_DIMENSIONS = new Set<string>([
  'physique',
  'root',
  'mindset',
  'combat',
  'profession',
  'social',
  'survival',
]);
const VALID_RACES = new Set<string>(['human', 'beast', 'demon']);
const VALID_MODIFIER_KEYS = new Set<string>(Object.keys(TRAIT_MODIFIER_CAPS));

export const SOURCE_300_TRAITS_LIST: readonly TraitDefinitionV3[] = [
  ...COMMON_TRAITS_V3,
  ...HUMAN_TRAITS_V3,
  ...BEAST_TRAITS_V3,
  ...DEMON_TRAITS_V3,
];

export const ALL_TRAITS_LIST_V3: readonly TraitDefinitionV3[] = [
  ...SOURCE_300_TRAITS_LIST,
  ...LEGACY_ONLY_TRAITS_V3,
];

export const V3_TRAIT_CATALOG: Readonly<Record<string, TraitDefinitionV3>> = Object.freeze(
  Object.fromEntries(SOURCE_300_TRAITS_LIST.map(def => [def.id, def]))
);

export const ALL_TRAIT_DEFINITIONS_V3: Readonly<Record<string, TraitDefinitionV3>> = Object.freeze(
  Object.fromEntries(ALL_TRAITS_LIST_V3.map(def => [def.id, def]))
);

const ALIAS_LOOKUP: Map<string, string> = new Map(Object.entries(LEGACY_TRAIT_ALIASES));
for (const def of ALL_TRAITS_LIST_V3) {
  if (def.legacyAliases) {
    for (const alias of def.legacyAliases) {
      ALIAS_LOOKUP.set(alias, def.id);
    }
  }
}

export function resolveTraitId(rawId: string): string {
  if (!rawId || typeof rawId !== 'string') return '';
  return ALIAS_LOOKUP.get(rawId) ?? rawId;
}

export function getTraitDefinition(id: string): TraitDefinitionV3 | undefined {
  const canonical = resolveTraitId(id);
  return ALL_TRAIT_DEFINITIONS_V3[canonical];
}

export function validateCondition(cond: TraitCondition): string | null {
  if (!cond || typeof cond.kind !== 'string') {
    return 'Invalid condition object';
  }
  switch (cond.kind) {
    case 'minAge':
    case 'minRealm':
      if (typeof cond.value !== 'number' || !Number.isFinite(cond.value) || cond.value < 0) {
        return `Condition ${cond.kind} requires non-negative finite number value`;
      }
      return null;
    case 'capability':
    case 'lineage':
    case 'hasTrait':
      if (typeof cond.key !== 'string' || cond.key.trim().length === 0) {
        return `Condition ${cond.kind} requires non-empty key`;
      }
      return null;
    case 'achievement':
      if (typeof cond.key !== 'string' || cond.key.trim().length === 0) {
        return 'Condition achievement requires non-empty key';
      }
      if (cond.value !== undefined && (typeof cond.value !== 'number' || !Number.isFinite(cond.value))) {
        return 'Condition achievement value must be finite number';
      }
      return null;
    default:
      return `Unknown condition kind: ${(cond as any).kind}`;
  }
}

export interface CatalogValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateTraitCatalog(
  definitions: readonly TraitDefinitionV3[] = ALL_TRAITS_LIST_V3
): CatalogValidationResult {
  const errors: string[] = [];
  const byId = new Map<string, TraitDefinitionV3>();

  for (const def of definitions) {
    if (!def || typeof def.id !== 'string' || !def.id.trim()) {
      errors.push('Trait definition with empty ID');
      continue;
    }
    if (!/^[a-z][a-z0-9_]*$/.test(def.id)) {
      errors.push(`Trait ID '${def.id}' contains non-ASCII or invalid characters`);
    }
    if (byId.has(def.id)) {
      errors.push(`Duplicate trait ID: '${def.id}'`);
    }
    byId.set(def.id, def);
  }

  for (const def of definitions) {
    if (!VALID_TIERS.has(def.tier)) {
      errors.push(`[${def.id}] Invalid tier: ${def.tier}`);
    } else if (def.traitCost !== TRAIT_TIER_CONFIG[def.tier].cost) {
      errors.push(
        `[${def.id}] traitCost ${def.traitCost} does not match tier ${def.tier} cost ${TRAIT_TIER_CONFIG[def.tier].cost}`
      );
    }

    if (!VALID_ORIGINS.has(def.origin)) {
      errors.push(`[${def.id}] Invalid origin: ${def.origin}`);
    }
    if (!VALID_DIMENSIONS.has(def.dimension)) {
      errors.push(`[${def.id}] Invalid dimension: ${def.dimension}`);
    }

    if (def.allowedRaces !== 'all') {
      if (!Array.isArray(def.allowedRaces) || def.allowedRaces.length === 0) {
        errors.push(`[${def.id}] allowedRaces must be 'all' or non-empty array`);
      } else {
        for (const r of def.allowedRaces) {
          if (!VALID_RACES.has(r)) {
            errors.push(`[${def.id}] Invalid race '${r}' in allowedRaces`);
          }
        }
      }
    }

    // Spawn weight rules
    if (def.implementation !== 'active' && def.spawnWeight > 0) {
      errors.push(`[${def.id}] Non-active trait (${def.implementation}) cannot have spawnWeight > 0`);
    }
    if (def.origin === 'acquired' && def.spawnWeight > 0) {
      errors.push(`[${def.id}] Acquired trait cannot have spawnWeight > 0 in innate pool`);
    }

    // Active implementation gate: cannot have unmappedEffectKeys
    if (
      def.implementation === 'active' &&
      def.unmappedEffectKeys &&
      def.unmappedEffectKeys.length > 0
    ) {
      errors.push(
        `[${def.id}] Active trait cannot have unmappedEffectKeys: ${def.unmappedEffectKeys.join(', ')}`
      );
    }

    // Acquired trait must have acquisition predicate if active
    if (
      def.implementation === 'active' &&
      def.origin === 'acquired' &&
      (!def.acquisition || def.acquisition.length === 0)
    ) {
      errors.push(`[${def.id}] Active acquired trait must declare acquisition predicates`);
    }

    // Lineage trait must have requiredLineageTags
    if (
      def.origin === 'lineage' &&
      (!def.requiredLineageTags || def.requiredLineageTags.length === 0)
    ) {
      errors.push(`[${def.id}] Lineage trait must declare requiredLineageTags`);
    }

    // Validate conditions
    for (const cond of def.activation ?? []) {
      const err = validateCondition(cond);
      if (err) errors.push(`[${def.id}] activation: ${err}`);
      if (cond.kind === 'hasTrait' && cond.key === def.id) {
        errors.push(`[${def.id}] self-contradictory activation hasTrait '${def.id}'`);
      }
    }
    for (const cond of def.acquisition ?? []) {
      const err = validateCondition(cond);
      if (err) errors.push(`[${def.id}] acquisition: ${err}`);
    }

    // Validate modifiers
    for (const mod of def.modifiers ?? []) {
      if (!VALID_MODIFIER_KEYS.has(mod.key as CanonicalModifierKey)) {
        errors.push(`[${def.id}] Unknown modifier key '${mod.key}'`);
      }
      if (typeof mod.value !== 'number' || !Number.isFinite(mod.value)) {
        errors.push(`[${def.id}] Non-finite modifier value for '${mod.key}'`);
      }
    }

    // Validate conflictsWith references
    for (const cid of def.conflictsWith ?? []) {
      if (cid === def.id) {
        errors.push(`[${def.id}] Self-conflict is invalid`);
      }
      if (!byId.has(cid) && !(cid in LEGACY_TRAIT_DEFINITIONS_SNAPSHOT)) {
        errors.push(`[${def.id}] conflictsWith references unknown trait '${cid}'`);
      }
    }

    // Validate evolvesFrom reference and cycle detection
    if (def.evolvesFrom) {
      if (!byId.has(def.evolvesFrom)) {
        errors.push(`[${def.id}] evolvesFrom references unknown trait '${def.evolvesFrom}'`);
      } else {
        const visited = new Set<string>([def.id]);
        let cursor: string | undefined = def.evolvesFrom;
        while (cursor) {
          if (visited.has(cursor)) {
            errors.push(`[${def.id}] Evolution cycle detected involving '${cursor}'`);
            break;
          }
          visited.add(cursor);
          cursor = byId.get(cursor)?.evolvesFrom;
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Kiểm tra hai đặc điểm có xung đột trực tiếp hoặc cùng exclusiveGroup không (hai chiều).
 */
export function areTraitsConflictingV3(traitIdA: string, traitIdB: string): boolean {
  const idA = resolveTraitId(traitIdA);
  const idB = resolveTraitId(traitIdB);
  if (!idA || !idB) return false;
  if (idA === idB) return true;

  const defA = ALL_TRAIT_DEFINITIONS_V3[idA];
  const defB = ALL_TRAIT_DEFINITIONS_V3[idB];
  if (!defA || !defB) return false;

  if (defA.conflictsWith.includes(idB) || defB.conflictsWith.includes(idA)) {
    return true;
  }

  if (defA.exclusiveGroups.length > 0 && defB.exclusiveGroups.length > 0) {
    for (const g of defA.exclusiveGroups) {
      if (defB.exclusiveGroups.includes(g)) {
        return true;
      }
    }
  }

  return false;
}

export function isTraitAllowedForRaceAndSpecies(
  def: TraitDefinitionV3,
  raceId: RaceId,
  speciesId?: string
): boolean {
  if (def.allowedRaces !== 'all' && !def.allowedRaces.includes(raceId)) {
    return false;
  }
  if (def.allowedSpecies && def.allowedSpecies.length > 0) {
    if (!speciesId || !def.allowedSpecies.includes(speciesId)) {
      return false;
    }
  }
  return true;
}

export function isTraitPurelyNegative(def: TraitDefinitionV3): boolean {
  if (def.tier > 1) return false;
  const deltas = Object.values(def.innateDelta ?? {});
  const hasPositiveDelta = deltas.some(v => typeof v === 'number' && v > 0);
  const hasPositiveMod = def.modifiers.some(m => {
    if (m.key === 'hungerRateFactor' || m.key === 'thirstRateFactor') return m.value < 1.0;
    if (m.mode === 'multiply') return m.value > 1.0;
    return m.value > 0;
  });
  return !hasPositiveDelta && !hasPositiveMod;
}

export interface CatalogCoverageReport {
  sourceCount: number;
  legacyOnlyCount: number;
  byRace: Record<'all' | RaceId, number>;
  byOrigin: Record<TraitOrigin, number>;
  byTier: Record<TraitTier, number>;
  byDimension: Record<TraitDimension, number>;
  byImplementation: Record<ImplementationState, number>;
  unmappedKeyCounts: Record<string, number>;
}

export function getCatalogCoverageReport(): CatalogCoverageReport {
  const byRace: Record<'all' | RaceId, number> = { all: 0, human: 0, beast: 0, demon: 0 };
  const byOrigin: Record<TraitOrigin, number> = {
    innate: 0,
    acquired: 0,
    lineage: 0,
    reincarnation: 0,
  };
  const byTier: Record<TraitTier, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  const byDimension: Record<TraitDimension, number> = {
    physique: 0,
    root: 0,
    mindset: 0,
    combat: 0,
    profession: 0,
    social: 0,
    survival: 0,
  };
  const byImplementation: Record<ImplementationState, number> = {
    active: 0,
    planned: 0,
    legacyOnly: LEGACY_ONLY_TRAITS_V3.length,
  };
  const unmappedKeyCounts: Record<string, number> = {};

  for (const def of SOURCE_300_TRAITS_LIST) {
    if (def.allowedRaces === 'all') {
      byRace.all++;
    } else {
      for (const r of def.allowedRaces) byRace[r]++;
    }
    byOrigin[def.origin]++;
    byTier[def.tier]++;
    byDimension[def.dimension]++;
    byImplementation[def.implementation]++;

    if (def.unmappedEffectKeys) {
      for (const k of def.unmappedEffectKeys) {
        unmappedKeyCounts[k] = (unmappedKeyCounts[k] ?? 0) + 1;
      }
    }
  }

  return {
    sourceCount: SOURCE_300_TRAITS_LIST.length,
    legacyOnlyCount: LEGACY_ONLY_TRAITS_V3.length,
    byRace,
    byOrigin,
    byTier,
    byDimension,
    byImplementation,
    unmappedKeyCounts,
  };
}
