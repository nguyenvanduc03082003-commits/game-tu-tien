import { ECSWorld } from '../../ecs/World.ts';
import { Entity } from '../../ecs/Entity.ts';
import {
  CapabilityTag,
  OwnedTrait,
  RaceId,
  TraitCondition,
  TraitDefinitionV3,
} from '../../config/traits/trait.types.ts';
import {
  ALL_TRAIT_DEFINITIONS_V3,
  areTraitsConflictingV3,
  getTraitDefinition,
  isTraitAllowedForRaceAndSpecies,
  resolveTraitId,
} from './TraitCatalog.ts';
import {
  HealthComponent,
  LifespanComponent,
  RaceComponent,
  RealmComponent,
  SpiritualRootComponent,
  TraitsComponent,
} from '../beings/BeingComponents.ts';
import { AppearanceComponent } from '../appearance/Appearance.ts';
import {
  GrowthMindComponent,
  TalentProfileComponent,
} from '../talent/TalentComponents.ts';
import { TraitInnateContributionInput } from '../talent/PotentialCalculator.ts';
import { rebuildEntityStats } from './DerivedStatsService.ts';

export type TraitMutationReason =
  | 'birth'
  | 'achievement'
  | 'evolution'
  | 'migration'
  | 'godTool';

export type TraitMutationResult =
  | { ok: true; changed: boolean }
  | { ok: false; reason: string };

export interface TraitMutationContext {
  reason: TraitMutationReason;
  day?: number;
  sourceEventId?: string;
  bypassOriginCheck?: boolean;
  bypassRaceCheck?: boolean;
  bypassAcquisitionCheck?: boolean;
  legacyGrandfathered?: boolean;
  skipRebuild?: boolean;
}

export function getEntityRaceAndSpecies(
  world: ECSWorld,
  entityId: Entity
): { raceId: RaceId; speciesId?: string } {
  const raceComp = world.getComponent(entityId, RaceComponent);
  const rawRace = raceComp?.raceId ?? 'human';
  const raceId: RaceId =
    rawRace === 'beast' || rawRace === 'demon' ? rawRace : 'human';
  const appComp = world.getComponent(entityId, AppearanceComponent);
  const speciesId = appComp?.speciesId ?? (raceId === 'beast' ? undefined : raceId);
  return { raceId, speciesId };
}

export function getEntityCapabilities(
  world: ECSWorld,
  entityId: Entity
): Set<CapabilityTag> {
  const caps = new Set<CapabilityTag>();
  const { raceId, speciesId } = getEntityRaceAndSpecies(world, entityId);
  const life = world.getComponent(entityId, LifespanComponent);
  const realm = world.getComponent(entityId, RealmComponent);
  const root = world.getComponent(entityId, SpiritualRootComponent);
  const age = life?.currentAge ?? 18;
  const stageIdx = realm?.stageIndex ?? 0;

  const isSentient =
    raceId === 'human' ||
    raceId === 'demon' ||
    (raceId === 'beast' && (stageIdx >= 1 || (root?.isAwakened ?? false)));

  if (isSentient) {
    caps.add('sentient');
  }

  const canLearnProf =
    isSentient &&
    ((raceId !== 'beast' && age >= 12) || (raceId === 'beast' && stageIdx >= 1));
  if (canLearnProf) {
    caps.add('canLearnProfession');
  }

  // Người/Ma hoặc Yêu đã Hóa Hình (stageIndex >= 2) hoặc loài vượn (ape)
  if (
    raceId === 'human' ||
    raceId === 'demon' ||
    (raceId === 'beast' && (stageIdx >= 2 || speciesId === 'ape'))
  ) {
    caps.add('hasManipulator');
  }

  if (speciesId === 'eagle' || speciesId === 'crane' || speciesId === 'dragon') {
    caps.add('hasWings');
  }
  if (speciesId === 'turtle') {
    caps.add('hasShell');
  }
  if (speciesId === 'turtle' || speciesId === 'dragon') {
    caps.add('aquatic');
  }
  if (speciesId === 'tiger' || speciesId === 'leopard') {
    caps.add('feline');
  }
  if (speciesId === 'wolf') {
    caps.add('canine');
  }

  return caps;
}

export function getProfessionAggregateCounter(
  growth: GrowthMindComponent | undefined,
  domainGroup: 'cook' | 'build'
): { tasks: number; firstDay: number; lastDay: number; spanDays: number } {
  if (!growth || !growth.professionCounters) {
    return { tasks: 0, firstDay: 0, lastDay: 0, spanDays: 0 };
  }
  const keys =
    domainGroup === 'cook'
      ? ['cook', 'cooking', 'cook_village_meal']
      : ['build', 'builder', 'repair', 'building', 'build_thatched_hut', 'dig_village_well', 'repair_structure'];

  let tasks = 0;
  let firstDay = Infinity;
  let lastDay = -Infinity;

  for (const k of keys) {
    const c = growth.professionCounters[k];
    if (c && Number.isFinite(c.tasks) && c.tasks > 0) {
      tasks += c.tasks;
      if (Number.isFinite(c.firstDay)) firstDay = Math.min(firstDay, c.firstDay);
      if (Number.isFinite(c.lastDay)) lastDay = Math.max(lastDay, c.lastDay);
    }
  }

  if (tasks <= 0 || !Number.isFinite(firstDay) || !Number.isFinite(lastDay)) {
    return { tasks: 0, firstDay: 0, lastDay: 0, spanDays: 0 };
  }

  return {
    tasks,
    firstDay,
    lastDay,
    spanDays: Math.max(0, lastDay - firstDay),
  };
}

export function evaluateTraitConditions(
  world: ECSWorld,
  entityId: Entity,
  conditions: readonly TraitCondition[],
  achievementsPassed?: ReadonlySet<string>
): boolean {
  if (!conditions || conditions.length === 0) return true;

  const life = world.getComponent(entityId, LifespanComponent);
  const realm = world.getComponent(entityId, RealmComponent);
  const profile = world.getComponent(entityId, TalentProfileComponent);
  const traits = world.getComponent(entityId, TraitsComponent);
  const growth = world.getComponent(entityId, GrowthMindComponent);
  const caps = getEntityCapabilities(world, entityId);

  for (const cond of conditions) {
    switch (cond.kind) {
      case 'minAge':
        if ((life?.currentAge ?? 0) < (cond.value ?? 0)) return false;
        break;
      case 'minRealm':
        if ((realm?.stageIndex ?? 0) < (cond.value ?? 0)) return false;
        break;
      case 'capability':
        if (!cond.key || !caps.has(cond.key as CapabilityTag)) return false;
        break;
      case 'lineage':
        if (!cond.key || !(profile?.lineageTags ?? []).includes(cond.key)) {
          return false;
        }
        break;
      case 'hasTrait': {
        if (!cond.key) return false;
        const targetId = resolveTraitId(cond.key);
        const has = traits?.entries.some(
          e => resolveTraitId(e.id) === targetId && e.state === 'active'
        );
        if (!has) return false;
        break;
      }
      case 'achievement': {
        if (!cond.key) return false;
        if (achievementsPassed?.has(cond.key)) break;
        if ((cond.value ?? 1) <= 1 && growth?.claimedMilestones.includes(cond.key)) {
          break;
        }
        if (cond.key === 'combat_untested') {
          if ((growth?.combatEncounterCount ?? 0) <= (cond.value ?? 0)) {
            break;
          }
          return false;
        }
        if (cond.key === 'tribulation_passed') {
          const milestones = growth?.claimedMilestones ?? [];
          const specificTribCount = milestones.filter(
            m =>
              m.startsWith('trib:') ||
              m.startsWith('tribulation:') ||
              m.startsWith('tribulation_passed:')
          ).length;
          const totalTribCount =
            specificTribCount > 0
              ? specificTribCount
              : milestones.includes('tribulation_passed')
              ? 1
              : 0;
          if (totalTribCount >= (cond.value ?? 1)) {
            break;
          }
          return false;
        }
        if (
          cond.key === 'challenging_encounters_won' &&
          (growth?.combatEncounterCount ?? 0) >= (cond.value ?? 100) &&
          (growth?.distinctOpponentIds.length ?? 0) >= 20
        ) {
          break;
        }
        if (cond.key === 'profession_cook_tier2') {
          const cookProg = getProfessionAggregateCounter(growth, 'cook');
          if (cookProg.tasks >= (cond.value ?? 30) && cookProg.spanDays >= 30) {
            break;
          }
          return false;
        }
        if (cond.key === 'profession_build_tier2') {
          const buildProg = getProfessionAggregateCounter(growth, 'build');
          if (buildProg.tasks >= (cond.value ?? 30) && buildProg.spanDays >= 30) {
            break;
          }
          return false;
        }
        return false;
      }
    }
  }

  return true;
}

export function ensureTraitsSynchronized(world: ECSWorld, entityId: Entity): TraitsComponent | undefined {
  const traits = world.getComponent(entityId, TraitsComponent);
  if (!traits) return undefined;
  traits.reconcileFromLegacyArrays(0);
  return traits;
}

export function grantTrait(
  world: ECSWorld,
  entityId: Entity,
  traitId: string,
  context: TraitMutationContext
): TraitMutationResult {
  const hp = world.getComponent(entityId, HealthComponent);
  if (!hp && !world.hasComponent(entityId, RaceComponent) && !world.hasComponent(entityId, TraitsComponent)) {
    return { ok: false, reason: 'entity_not_found' };
  }

  const canonicalId = resolveTraitId(traitId);
  if (!canonicalId) {
    return { ok: false, reason: 'empty_trait_id' };
  }

  let traits = world.getComponent(entityId, TraitsComponent);
  if (!traits) {
    traits = world.addComponent(entityId, new TraitsComponent());
  } else {
    traits.reconcileFromLegacyArrays(context.day ?? 0);
  }

  // Idempotent check: đã sở hữu cùng ID
  const existing = traits.entries.find(e => resolveTraitId(e.id) === canonicalId);
  if (existing) {
    return { ok: true, changed: false };
  }

  const def = getTraitDefinition(canonicalId);
  if (!def) {
    if (context.reason === 'migration') {
      traits.entries.push({
        id: canonicalId,
        origin: 'innate',
        acquiredAtDay: context.day ?? 0,
        sourceEventId: context.sourceEventId,
        state: 'legacy',
        legacyGrandfathered: true,
        dormantReason: 'Đặc điểm từ bản lưu cũ',
      });
      traits.syncLegacyViews();
      traits.revision++;
      return { ok: true, changed: true };
    }
    return { ok: false, reason: 'unknown_trait' };
  }

  if (def.implementation === 'planned' && context.reason !== 'migration') {
    return { ok: false, reason: 'planned_trait_not_active' };
  }

  if (def.implementation === 'legacyOnly' && context.reason !== 'migration') {
    return { ok: false, reason: 'legacy_only_trait' };
  }

  const { raceId, speciesId } = getEntityRaceAndSpecies(world, entityId);
  if (!context.bypassRaceCheck && !context.legacyGrandfathered && context.reason !== 'migration') {
    if (!isTraitAllowedForRaceAndSpecies(def, raceId, speciesId)) {
      return { ok: false, reason: 'race_or_species_mismatch' };
    }
  }

  const profile = world.getComponent(entityId, TalentProfileComponent);
  if (
    def.origin === 'lineage' &&
    def.requiredLineageTags &&
    def.requiredLineageTags.length > 0 &&
    !context.bypassOriginCheck &&
    !context.legacyGrandfathered &&
    context.reason !== 'migration'
  ) {
    const entityLineages = profile?.lineageTags ?? [];
    const hasLineage = def.requiredLineageTags.every(t => entityLineages.includes(t));
    if (!hasLineage) {
      return { ok: false, reason: 'missing_required_lineage' };
    }
  }

  if (
    def.origin === 'acquired' &&
    context.reason === 'birth' &&
    !context.bypassOriginCheck
  ) {
    return { ok: false, reason: 'acquired_trait_cannot_grant_at_birth' };
  }

  if (
    def.acquisition &&
    def.acquisition.length > 0 &&
    !context.bypassAcquisitionCheck &&
    !context.legacyGrandfathered &&
    context.reason !== 'migration'
  ) {
    if (!evaluateTraitConditions(world, entityId, def.acquisition)) {
      return { ok: false, reason: 'acquisition_conditions_not_met' };
    }
  }

  // Kiểm tra xung đột & exclusive group
  const conflictingEntries = traits.entries.filter(e =>
    areTraitsConflictingV3(e.id, canonicalId)
  );
  if (conflictingEntries.length > 0) {
    if (context.reason !== 'migration') {
      return { ok: false, reason: 'trait_conflict' };
    }
  }

  let initialState: OwnedTrait['state'] = 'active';
  let dormantReason: string | undefined = undefined;

  if (def.implementation === 'planned') {
    initialState = 'dormant';
    dormantReason = def.deferredReason ?? 'Chưa kích hoạt trong phiên bản hiện tại';
  } else if (def.implementation === 'legacyOnly') {
    initialState = 'legacy';
  } else if (conflictingEntries.length > 0 && context.reason === 'migration') {
    // Trong migration, giữ entry có tier cao hơn active, còn lại dormant
    const higherExisting = conflictingEntries.some(e => {
      if (e.state !== 'active' && e.state !== 'legacy') return false;
      const eDef = getTraitDefinition(e.id);
      if (!eDef) return false;
      if (eDef.tier !== def.tier) return eDef.tier > def.tier;
      return eDef.id.localeCompare(def.id) < 0;
    });
    if (higherExisting) {
      initialState = 'dormant';
      dormantReason = 'Xung đột nhóm độc quyền khi di trú bản lưu';
    } else {
      for (const ce of conflictingEntries) {
        ce.state = 'dormant';
        ce.dormantReason = 'Xung đột nhóm độc quyền khi di trú bản lưu';
      }
    }
  } else if (!evaluateTraitConditions(world, entityId, def.activation)) {
    initialState = 'dormant';
    dormantReason = 'Chưa đủ điều kiện kích hoạt';
  }

  traits.entries.push({
    id: canonicalId,
    origin: def.origin,
    acquiredAtDay: context.day ?? 0,
    sourceEventId: context.sourceEventId,
    state: initialState,
    legacyGrandfathered: context.legacyGrandfathered,
    ...(dormantReason ? { dormantReason } : {}),
  });

  traits.syncLegacyViews();
  traits.revision++;
  profile?.markDirty();

  if (!context.skipRebuild) {
    rebuildEntityStats(world, entityId);
  }

  return { ok: true, changed: true };
}

export function removeTrait(
  world: ECSWorld,
  entityId: Entity,
  traitId: string,
  context: TraitMutationContext
): TraitMutationResult {
  const traits = ensureTraitsSynchronized(world, entityId);
  if (!traits) {
    return { ok: false, reason: 'traits_component_missing' };
  }

  const canonicalId = resolveTraitId(traitId);
  const idx = traits.entries.findIndex(
    e => resolveTraitId(e.id) === canonicalId || e.id === traitId
  );
  if (idx === -1) {
    return { ok: true, changed: false };
  }

  traits.entries.splice(idx, 1);
  traits.syncLegacyViews();
  traits.revision++;

  const profile = world.getComponent(entityId, TalentProfileComponent);
  profile?.markDirty();

  if (!context.skipRebuild) {
    rebuildEntityStats(world, entityId);
  }

  return { ok: true, changed: true };
}

export function evolveTrait(
  world: ECSWorld,
  entityId: Entity,
  fromId: string,
  toId: string,
  context: TraitMutationContext
): TraitMutationResult {
  const traits = ensureTraitsSynchronized(world, entityId);
  if (!traits) {
    return { ok: false, reason: 'traits_component_missing' };
  }

  const fromCanonical = resolveTraitId(fromId);
  const toCanonical = resolveTraitId(toId);
  if (!fromCanonical || !toCanonical || fromCanonical === toCanonical) {
    return { ok: false, reason: 'invalid_evolution_ids' };
  }

  const fromIdx = traits.entries.findIndex(
    e => resolveTraitId(e.id) === fromCanonical
  );
  if (fromIdx === -1) {
    return { ok: false, reason: 'source_trait_not_owned' };
  }

  if (traits.entries.some(e => resolveTraitId(e.id) === toCanonical)) {
    // Nếu đã có toId thì xóa fromId để không cộng chồng
    traits.entries.splice(fromIdx, 1);
    traits.syncLegacyViews();
    traits.revision++;
    world.getComponent(entityId, TalentProfileComponent)?.markDirty();
    if (!context.skipRebuild) {
      rebuildEntityStats(world, entityId);
    }
    return { ok: true, changed: true };
  }

  const toDef = getTraitDefinition(toCanonical);
  const isExplicitEvolutionChain = toDef?.evolvesFrom === fromCanonical;
  if (
    !toDef ||
    (toDef.implementation !== 'active' &&
      !(isExplicitEvolutionChain && context.reason === 'evolution'))
  ) {
    return { ok: false, reason: 'target_trait_not_active' };
  }

  const { raceId, speciesId } = getEntityRaceAndSpecies(world, entityId);
  if (!context.bypassRaceCheck && !isTraitAllowedForRaceAndSpecies(toDef, raceId, speciesId)) {
    return { ok: false, reason: 'race_or_species_mismatch' };
  }

  const profile = world.getComponent(entityId, TalentProfileComponent);
  if (
    toDef.origin === 'lineage' &&
    toDef.requiredLineageTags &&
    toDef.requiredLineageTags.length > 0 &&
    !context.bypassOriginCheck
  ) {
    const entityLineages = profile?.lineageTags ?? [];
    if (!toDef.requiredLineageTags.every(t => entityLineages.includes(t))) {
      return { ok: false, reason: 'missing_required_lineage' };
    }
  }

  if (
    toDef.acquisition.length > 0 &&
    !context.bypassAcquisitionCheck &&
    !context.legacyGrandfathered &&
    context.reason !== 'migration'
  ) {
    if (!evaluateTraitConditions(world, entityId, toDef.acquisition)) {
      return { ok: false, reason: 'acquisition_conditions_not_met' };
    }
  }

  // Kiểm tra xung đột với các trait khác ngoài fromId
  const otherEntries = traits.entries.filter((_, i) => i !== fromIdx);
  if (otherEntries.some(e => areTraitsConflictingV3(e.id, toCanonical))) {
    return { ok: false, reason: 'trait_conflict' };
  }

  const isActive = evaluateTraitConditions(world, entityId, toDef.activation);
  traits.entries[fromIdx] = {
    id: toCanonical,
    origin: toDef.origin,
    acquiredAtDay: context.day ?? 0,
    sourceEventId: context.sourceEventId ?? 'evolution',
    state: isActive ? 'active' : 'dormant',
  };

  traits.syncLegacyViews();
  traits.revision++;
  profile?.markDirty();

  if (!context.skipRebuild) {
    rebuildEntityStats(world, entityId);
  }

  return { ok: true, changed: true };
}

/**
 * Trả về danh sách các định nghĩa đặc điểm đang thực sự hoạt động (active / legacy có hiệu lực)
 * Đã loại trùng theo ID và kiểm tra điều kiện kích hoạt.
 */
export function resolveActiveTraits(
  world: ECSWorld,
  entityId: Entity
): readonly TraitDefinitionV3[] {
  const traits = ensureTraitsSynchronized(world, entityId);
  if (!traits || traits.entries.length === 0) return [];

  const seenIds = new Set<string>();
  const activeDefs: TraitDefinitionV3[] = [];
  const occupiedGroups = new Set<string>();

  for (const entry of traits.entries) {
    const canonicalId = resolveTraitId(entry.id);
    if (!canonicalId || seenIds.has(canonicalId)) continue;
    seenIds.add(canonicalId);

    const def = ALL_TRAIT_DEFINITIONS_V3[canonicalId];
    if (!def) continue;

    const isEvolvedChainEntry =
      Boolean(def.evolvesFrom) && entry.state === 'active' && entry.sourceEventId === 'evolution';

    if (def.implementation === 'planned' && !isEvolvedChainEntry) {
      continue;
    }


    if (entry.state === 'dormant') {
      // Nếu chỉ dormant vì điều kiện kích hoạt và nay đã đủ điều kiện, tự động kích hoạt
      if (
        def.implementation === 'active' &&
        !entry.dormantReason?.includes('Xung đột') &&
        evaluateTraitConditions(world, entityId, def.activation)
      ) {
        entry.state = 'active';
        entry.dormantReason = undefined;
      } else {
        continue;
      }
    }

    if (!entry.legacyGrandfathered && def.implementation === 'active') {
      if (!evaluateTraitConditions(world, entityId, def.activation)) {
        continue;
      }
    }

    // Đảm bảo mỗi exclusiveGroup chỉ có tối đa 1 trait đóng góp hiệu ứng
    if (def.exclusiveGroups.some(g => occupiedGroups.has(g))) {
      continue;
    }
    if (activeDefs.some(existing => areTraitsConflictingV3(existing.id, def.id))) {
      continue;
    }

    for (const g of def.exclusiveGroups) {
      occupiedGroups.add(g);
    }
    activeDefs.push(def);
  }

  return activeDefs;
}

/**
 * Trả về danh sách các đặc điểm đóng góp vào điểm tiềm năng bẩm sinh (mục 6.1):
 * Bao gồm cả trait bẩm sinh còn dormant vì chưa tới tuổi thức tỉnh,
 * nhưng loại trừ trait dormant do xung đột legacy và loại trừ trait hậu thiên (acquired).
 */
export function resolveInnateContributors(
  world: ECSWorld,
  entityId: Entity
): readonly TraitInnateContributionInput[] {
  const traits = ensureTraitsSynchronized(world, entityId);
  if (!traits || traits.entries.length === 0) return [];

  const seenIds = new Set<string>();
  const result: TraitInnateContributionInput[] = [];
  const occupiedGroups = new Set<string>();

  for (const entry of traits.entries) {
    const canonicalId = resolveTraitId(entry.id);
    if (!canonicalId || seenIds.has(canonicalId)) continue;
    seenIds.add(canonicalId);

    if (entry.dormantReason?.includes('Xung đột')) {
      continue;
    }

    const def = ALL_TRAIT_DEFINITIONS_V3[canonicalId];
    if (!def) continue;

    if (
      def.origin !== 'innate' &&
      def.origin !== 'lineage' &&
      def.origin !== 'reincarnation'
    ) {
      continue;
    }

    if (def.exclusiveGroups.some(g => occupiedGroups.has(g))) {
      continue;
    }

    for (const g of def.exclusiveGroups) {
      occupiedGroups.add(g);
    }

    result.push({
      id: def.id,
      origin: def.origin,
      innateDelta: def.innateDelta,
      primaryRootOverride: def.primaryRootOverride,
    });
  }

  return result;
}
