import { ECSWorld } from '../../ecs/World.ts';
import { Entity } from '../../ecs/Entity.ts';
import { RACE_DEFINITIONS } from '../../config/races.config.ts';
import {
  LEGACY_MIGRATION_DEFAULTS,
  RACE_INNATE_BASE_CENTERS,
  TALENT_GENERATION_VERSION,
  TRAIT_SYSTEM_VERSION,
} from '../../config/talent.config.ts';
import { MAX_GROWTH_XP } from '../../config/mental-growth.config.ts';
import { TECHNIQUE_DEFINITIONS } from '../../config/techniques.config.ts';
import { RaceId } from '../../config/traits/trait.types.ts';
import {
  ComprehensionComponent,
  CultivationTechniqueComponent,
  HealthComponent,
  LifespanComponent,
  PositionComponent,
  RaceComponent,
  RealmComponent,
  SpiritualRootComponent,
  TraitsComponent,
} from '../beings/BeingComponents.ts';
import {
  GrowthDayBucket,
  GrowthFamilyDayBucket,
  GrowthMindComponent,
  PendingRoot,
  StatBaselineComponent,
  TalentProfileComponent,
} from '../talent/TalentComponents.ts';
import {
  calculateRootAptitudeBase,
  calculateTraitInnateDeltas,
  clampFinite,
  fromLegacyComprehensionValue,
  isFiniteScore,
  xpForScore,
} from '../talent/PotentialCalculator.ts';
import { getTraitDefinition, resolveTraitId } from '../traits/TraitCatalog.ts';
import {
  grantTrait,
  resolveInnateContributors,
} from '../traits/TraitService.ts';
import {
  ensureStatBaseline,
  getEntityPotential,
  rebuildEntityStats,
} from '../traits/DerivedStatsService.ts';


export function computeDeterministicHash(
  worldSeed: number,
  entityId: number,
  salt: number = 1
): number {
  let h = (Math.imul(worldSeed | 0, 0x9e3779b1) ^ Math.imul(entityId | 0, 0x85ebca6b) ^ (salt | 0)) >>> 0;
  h ^= h >>> 16;
  h = Math.imul(h, 0x7feb352d) >>> 0;
  h ^= h >>> 15;
  h = Math.imul(h, 0x846ca68b) >>> 0;
  h ^= h >>> 16;
  return h >>> 0;
}

export function deterministicUnitFloat(
  worldSeed: number,
  entityId: number,
  salt: number
): number {
  return computeDeterministicHash(worldSeed, entityId, salt) / 4294967296;
}

/**
 * Tạo kết quả linh căn tiềm ẩn ổn định từ seed thế giới + entityId cho trẻ em bản lưu cũ chưa thức tỉnh (mục 7.4, G06).
 */
export function computeDeterministicPendingRoot(
  worldSeed: number,
  entityId: number,
  raceId: string,
  traits: TraitsComponent | undefined
): PendingRoot {
  const allTraitIds = traits
    ? traits.entries.map(e => resolveTraitId(e.id))
    : [];

  for (const tid of allTraitIds) {
    const def = getTraitDefinition(tid);
    if (def?.primaryRootOverride) {
      return {
        rootType: def.primaryRootOverride.rootType,
        purity: def.primaryRootOverride.purity,
        elements: [...def.primaryRootOverride.elements],
        primaryTraitId: def.id,
      };
    }
  }

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

  const roll = deterministicUnitFloat(worldSeed, entityId, 777) * 100;
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
      purity: 25,
      elements: ['kim', 'moc', 'thuy', 'tho'],
      gradeName: 'Ngũ Hành Tạp Linh Căn',
    };
  } else if (roll < 99.0) {
    return {
      rootType: 'true',
      purity: 65,
      elements: ['moc', 'thuy', 'hoa'],
      gradeName: 'Chân Linh Căn (Tam Căn)',
    };
  } else if (roll < 99.99) {
    return {
      rootType: 'earth',
      purity: 85,
      elements: ['kim', 'thuy'],
      gradeName: 'Địa Linh Căn (Song Căn)',
    };
  } else {
    return {
      rootType: 'heaven',
      purity: 100,
      elements: ['hoa'],
      gradeName: 'Thiên Linh Căn (Cực Phẩm Vạn Năm)',
    };
  }
}

/**
 * Xác thực dữ liệu V3 trong SaveData trước khi thao tác hoặc commit.
 * Từ chối phiên bản tương lai chưa biết và mọi giá trị NaN/Infinity (mục 14.1, 14.6, P11, S08).
 */
function assertNoNonFiniteNumbers(
  value: unknown,
  path: string,
  visited: Set<object> = new Set()
): void {
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw new Error(
        `Dữ liệu bản lưu không hợp lệ: Giá trị tại [${path}] không hữu hạn (${String(value)})!`
      );
    }
    return;
  }
  if (!value || typeof value !== 'object') {
    return;
  }
  if (visited.has(value)) {
    return;
  }
  visited.add(value);

  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      assertNoNonFiniteNumbers(value[i], `${path}[${i}]`, visited);
    }
    return;
  }

  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    assertNoNonFiniteNumbers(v, `${path}.${k}`, visited);
  }
}

/**
 * Xác thực dữ liệu V3 trong SaveData trước khi thao tác hoặc commit.
 * Từ chối phiên bản tương lai chưa biết và mọi giá trị NaN/Infinity (mục 14.1, 14.6, P11, S08).
 */
export function validateTraitTalentSaveData(data: any): void {
  if (!data || typeof data !== 'object') {
    throw new Error('Dữ liệu bản lưu không hợp lệ: saveData phải là một đối tượng!');
  }

  // Quét đệ quy toàn bộ dữ liệu để chặn mọi số NaN / Infinity / -Infinity (kể cả 1e400 khi JSON.parse)
  assertNoNonFiniteNumbers(data, 'saveData');

  if (data.traitSystemVersion !== undefined) {
    if (
      typeof data.traitSystemVersion !== 'number' ||
      !Number.isFinite(data.traitSystemVersion) ||
      data.traitSystemVersion < 1 ||
      data.traitSystemVersion > TRAIT_SYSTEM_VERSION
    ) {
      throw new Error(
        `Dữ liệu bản lưu không hợp lệ: Phiên bản hệ thống đặc điểm (traitSystemVersion=${data.traitSystemVersion}) không được hỗ trợ!`
      );
    }
  }

  if (data.talentGenerationVersion !== undefined) {
    if (
      typeof data.talentGenerationVersion !== 'number' ||
      !Number.isFinite(data.talentGenerationVersion) ||
      data.talentGenerationVersion < 1 ||
      data.talentGenerationVersion > TALENT_GENERATION_VERSION
    ) {
      throw new Error(
        `Dữ liệu bản lưu không hợp lệ: Phiên bản sinh thiên phú (talentGenerationVersion=${data.talentGenerationVersion}) không được hỗ trợ!`
      );
    }
  }

  if (data.birthOrdinal !== undefined) {
    if (
      typeof data.birthOrdinal !== 'number' ||
      !Number.isFinite(data.birthOrdinal) ||
      data.birthOrdinal < 0
    ) {
      throw new Error('Dữ liệu bản lưu không hợp lệ: birthOrdinal phải là số không âm!');
    }
  }

  if (!Array.isArray(data.entities)) return;

  for (let i = 0; i < data.entities.length; i++) {
    const ent = data.entities[i];
    const c = ent?.components;
    if (!c || typeof c !== 'object') continue;

    if (c.traits !== undefined) {
      const tr = c.traits;
      if (!tr || typeof tr !== 'object' || Array.isArray(tr)) {
        throw new Error(`Thực thể #${ent.id}: traits không hợp lệ!`);
      }
      if (tr.revision !== undefined && !isFiniteScore(tr.revision)) {
        throw new Error(`Thực thể #${ent.id}: traits.revision không hợp lệ!`);
      }
      if (tr.entries !== undefined) {
        if (!Array.isArray(tr.entries)) {
          throw new Error(`Thực thể #${ent.id}: traits.entries phải là mảng!`);
        }
        for (const entry of tr.entries) {
          if (
            !entry ||
            typeof entry !== 'object' ||
            typeof entry.id !== 'string' ||
            (entry.acquiredAtDay !== undefined && !isFiniteScore(entry.acquiredAtDay))
          ) {
            throw new Error(`Thực thể #${ent.id}: phần tử trong traits.entries không hợp lệ!`);
          }
        }
      }
    }

    if (c.talentProfile !== undefined) {
      const tp = c.talentProfile;
      if (!tp || typeof tp !== 'object' || Array.isArray(tp)) {
        throw new Error(`Thực thể #${ent.id}: talentProfile không hợp lệ!`);
      }
      if (tp.schemaVersion !== undefined) {
        if (!isFiniteScore(tp.schemaVersion) || tp.schemaVersion < 1 || tp.schemaVersion > TRAIT_SYSTEM_VERSION) {
          throw new Error(
            `Thực thể #${ent.id}: talentProfile.schemaVersion (${tp.schemaVersion}) không hợp lệ hoặc mới hơn phiên bản hỗ trợ!`
          );
        }
      }
      if (tp.birthSeed !== undefined && !isFiniteScore(tp.birthSeed)) {
        throw new Error(`Thực thể #${ent.id}: talentProfile.birthSeed không hợp lệ!`);
      }
      if (tp.revision !== undefined && !isFiniteScore(tp.revision)) {
        throw new Error(`Thực thể #${ent.id}: talentProfile.revision không hợp lệ!`);
      }
      if (
        !tp.base ||
        !isFiniteScore(tp.base.comprehension) ||
        !isFiniteScore(tp.base.aptitude) ||
        !isFiniteScore(tp.base.physique)
      ) {
        throw new Error(`Thực thể #${ent.id}: Điểm nền bẩm sinh (talentProfile.base) chứa NaN hoặc Infinity!`);
      }
      if (tp.pendingRoot !== null && tp.pendingRoot !== undefined) {
        if (!tp.pendingRoot || typeof tp.pendingRoot !== 'object' || !isFiniteScore(tp.pendingRoot.purity)) {
          throw new Error(`Thực thể #${ent.id}: pendingRoot.purity không hợp lệ!`);
        }
      }
      if (tp.foundationChanges !== undefined) {
        if (!Array.isArray(tp.foundationChanges)) {
          throw new Error(`Thực thể #${ent.id}: foundationChanges phải là mảng!`);
        }
        for (const fc of tp.foundationChanges) {
          if (
            !fc ||
            typeof fc !== 'object' ||
            !isFiniteScore(fc.day) ||
            !fc.delta ||
            typeof fc.delta !== 'object' ||
            (fc.delta.comprehension !== undefined && !isFiniteScore(fc.delta.comprehension)) ||
            (fc.delta.aptitude !== undefined && !isFiniteScore(fc.delta.aptitude)) ||
            (fc.delta.physique !== undefined && !isFiniteScore(fc.delta.physique))
          ) {
            throw new Error(`Thực thể #${ent.id}: foundationChanges chứa dữ liệu không hợp lệ!`);
          }
        }
      }
      if (tp.legacyAnchor !== undefined) {
        const obs = tp.legacyAnchor?.observedScores;
        const dm = tp.legacyAnchor?.traitDeltaAtMigration;
        if (
          !obs ||
          !isFiniteScore(obs.comprehension) ||
          !isFiniteScore(obs.aptitude) ||
          !isFiniteScore(obs.physique) ||
          !dm ||
          !isFiniteScore(dm.comprehension) ||
          !isFiniteScore(dm.aptitude) ||
          !isFiniteScore(dm.physique)
        ) {
          throw new Error(`Thực thể #${ent.id}: legacyAnchor chứa giá trị không hữu hạn!`);
        }
      }
    }

    if (c.growthMind !== undefined) {
      const gm = c.growthMind;
      if (
        !gm ||
        typeof gm !== 'object' ||
        Array.isArray(gm) ||
        !isFiniteScore(gm.willpowerXp) ||
        !isFiniteScore(gm.mindsetXp) ||
        !isFiniteScore(gm.mentalState) ||
        (gm.lastIntegratedTick !== undefined && !isFiniteScore(gm.lastIntegratedTick)) ||
        (gm.combatEncounterCount !== undefined && !isFiniteScore(gm.combatEncounterCount)) ||
        (gm.revision !== undefined && !isFiniteScore(gm.revision))
      ) {
        throw new Error(`Thực thể #${ent.id}: growthMind chứa giá trị NaN hoặc Infinity!`);
      }

      if (gm.cooldownUntilDay !== undefined) {
        if (!gm.cooldownUntilDay || typeof gm.cooldownUntilDay !== 'object' || Array.isArray(gm.cooldownUntilDay)) {
          throw new Error(`Thực thể #${ent.id}: growthMind.cooldownUntilDay phải là đối tượng!`);
        }
        for (const [key, val] of Object.entries(gm.cooldownUntilDay)) {
          if (typeof key !== 'string' || !isFiniteScore(val) || val < 0) {
            throw new Error(
              `Thực thể #${ent.id}: growthMind.cooldownUntilDay[${key}] chứa giá trị không hợp lệ hoặc không hữu hạn!`
            );
          }
        }
      }

      if (gm.dailyBuckets !== undefined) {
        if (!Array.isArray(gm.dailyBuckets)) {
          throw new Error(`Thực thể #${ent.id}: growthMind.dailyBuckets phải là mảng!`);
        }
        for (const b of gm.dailyBuckets) {
          if (
            !b ||
            typeof b !== 'object' ||
            !isFiniteScore(b.day) ||
            !isFiniteScore(b.routineWill) ||
            !isFiniteScore(b.routineMind) ||
            !isFiniteScore(b.experienceWill) ||
            !isFiniteScore(b.experienceMind)
          ) {
            throw new Error(`Thực thể #${ent.id}: growthMind.dailyBuckets chứa giá trị không hữu hạn!`);
          }
        }
      }

      if (gm.familyDayBuckets !== undefined) {
        if (!Array.isArray(gm.familyDayBuckets)) {
          throw new Error(`Thực thể #${ent.id}: growthMind.familyDayBuckets phải là mảng!`);
        }
        for (const fb of gm.familyDayBuckets) {
          if (!fb || typeof fb !== 'object' || !isFiniteScore(fb.day) || !fb.counts || typeof fb.counts !== 'object') {
            throw new Error(`Thực thể #${ent.id}: growthMind.familyDayBuckets không hợp lệ!`);
          }
          for (const cnt of Object.values(fb.counts)) {
            if (!isFiniteScore(cnt)) {
              throw new Error(`Thực thể #${ent.id}: growthMind.familyDayBuckets.counts chứa giá trị không hữu hạn!`);
            }
          }
        }
      }

      if (gm.recentEventIds !== undefined) {
        if (!Array.isArray(gm.recentEventIds)) {
          throw new Error(`Thực thể #${ent.id}: growthMind.recentEventIds phải là mảng!`);
        }
        for (const re of gm.recentEventIds) {
          if (!re || typeof re !== 'object' || typeof re.id !== 'string' || !isFiniteScore(re.day)) {
            throw new Error(`Thực thể #${ent.id}: growthMind.recentEventIds chứa phần tử không hợp lệ!`);
          }
        }
      }

      if (gm.experiences !== undefined) {
        if (!Array.isArray(gm.experiences)) {
          throw new Error(`Thực thể #${ent.id}: growthMind.experiences phải là mảng!`);
        }
        for (const exp of gm.experiences) {
          if (
            !exp ||
            typeof exp !== 'object' ||
            !isFiniteScore(exp.createdDay) ||
            !isFiniteScore(exp.severity) ||
            !isFiniteScore(exp.emotion) ||
            !isFiniteScore(exp.halfLifeDays) ||
            !isFiniteScore(exp.reflectionDays) ||
            !isFiniteScore(exp.requiredReflectionDays) ||
            !isFiniteScore(exp.readyForReflectionAtDay) ||
            (exp.resolvedAtDay !== undefined && !isFiniteScore(exp.resolvedAtDay))
          ) {
            throw new Error(`Thực thể #${ent.id}: growthMind.experiences chứa giá trị không hữu hạn!`);
          }
        }
      }

      if (gm.recentGains !== undefined) {
        if (!Array.isArray(gm.recentGains)) {
          throw new Error(`Thực thể #${ent.id}: growthMind.recentGains phải là mảng!`);
        }
        for (const g of gm.recentGains) {
          if (!g || typeof g !== 'object' || !isFiniteScore(g.day) || !isFiniteScore(g.willXp) || !isFiniteScore(g.mindXp)) {
            throw new Error(`Thực thể #${ent.id}: growthMind.recentGains chứa giá trị không hữu hạn!`);
          }
        }
      }

      if (gm.professionCounters !== undefined) {
        if (!gm.professionCounters || typeof gm.professionCounters !== 'object' || Array.isArray(gm.professionCounters)) {
          throw new Error(`Thực thể #${ent.id}: growthMind.professionCounters phải là đối tượng!`);
        }
        for (const [k, pc] of Object.entries(gm.professionCounters)) {
          const item = pc as any;
          if (
            !item ||
            typeof item !== 'object' ||
            !isFiniteScore(item.tasks) ||
            !isFiniteScore(item.firstDay) ||
            !isFiniteScore(item.lastDay)
          ) {
            throw new Error(`Thực thể #${ent.id}: growthMind.professionCounters[${k}] không hợp lệ!`);
          }
        }
      }

      if (gm.distinctOpponentIds !== undefined) {
        if (!Array.isArray(gm.distinctOpponentIds) || gm.distinctOpponentIds.some((id: unknown) => !isFiniteScore(id))) {
          throw new Error(`Thực thể #${ent.id}: growthMind.distinctOpponentIds chứa giá trị không hợp lệ!`);
        }
      }
    }

    if (c.statBaseline !== undefined) {
      const sb = c.statBaseline;
      if (
        !sb ||
        typeof sb !== 'object' ||
        Array.isArray(sb) ||
        !isFiniteScore(sb.baseMaxHealth) ||
        !isFiniteScore(sb.baseLifespan) ||
        !isFiniteScore(sb.baseMoveSpeed) ||
        !isFiniteScore(sb.baseAttack) ||
        !isFiniteScore(sb.baseDefense) ||
        !isFiniteScore(sb.baseArmor) ||
        (sb.healthGrowthMultiplier !== undefined && !isFiniteScore(sb.healthGrowthMultiplier)) ||
        (sb.archetypeHealthMultiplier !== undefined && !isFiniteScore(sb.archetypeHealthMultiplier)) ||
        (sb.lifespanGrowthMultiplier !== undefined && !isFiniteScore(sb.lifespanGrowthMultiplier)) ||
        (sb.archetypeLifespanMultiplier !== undefined && !isFiniteScore(sb.archetypeLifespanMultiplier)) ||
        (sb.archetypePhysiqueMultiplier !== undefined && !isFiniteScore(sb.archetypePhysiqueMultiplier)) ||
        (sb.baseCritRate !== undefined && !isFiniteScore(sb.baseCritRate)) ||
        (sb.baseDodgeRate !== undefined && !isFiniteScore(sb.baseDodgeRate)) ||
        (sb.baseAttackSpeed !== undefined && !isFiniteScore(sb.baseAttackSpeed)) ||
        (sb.lastRebuiltTraitRevision !== undefined && !isFiniteScore(sb.lastRebuiltTraitRevision)) ||
        (sb.lastRebuiltStageIndex !== undefined && !isFiniteScore(sb.lastRebuiltStageIndex))
      ) {
        throw new Error(`Thực thể #${ent.id}: statBaseline chứa giá trị không hữu hạn!`);
      }

      if (sb.permanentAdjustments !== undefined) {
        if (!Array.isArray(sb.permanentAdjustments)) {
          throw new Error(`Thực thể #${ent.id}: statBaseline.permanentAdjustments phải là mảng!`);
        }
        for (const adj of sb.permanentAdjustments) {
          if (!adj || typeof adj !== 'object' || !isFiniteScore(adj.delta) || !isFiniteScore(adj.day)) {
            throw new Error(`Thực thể #${ent.id}: statBaseline.permanentAdjustments chứa giá trị không hữu hạn!`);
          }
        }
      }

      if (sb.legacyStatAnchor !== undefined) {
        const la = sb.legacyStatAnchor;
        if (
          !la ||
          typeof la !== 'object' ||
          !isFiniteScore(la.savedMaxHp) ||
          !isFiniteScore(la.savedMaxLifespan) ||
          !isFiniteScore(la.savedMoveSpeed) ||
          !isFiniteScore(la.savedAttack) ||
          !isFiniteScore(la.savedDefense) ||
          !isFiniteScore(la.savedArmor) ||
          !isFiniteScore(la.savedCritRate) ||
          !isFiniteScore(la.savedDodgeRate) ||
          !isFiniteScore(la.savedAttackSpeed) ||
          !isFiniteScore(la.stageIndexAtMigration)
        ) {
          throw new Error(`Thực thể #${ent.id}: statBaseline.legacyStatAnchor chứa giá trị không hữu hạn!`);
        }
      }
    }
  }
}

function sanitizeDayBuckets(
  buckets: GrowthDayBucket[] | undefined,
  maxValidDay: number
): GrowthDayBucket[] {
  if (!Array.isArray(buckets)) return [];
  const byDay = new Map<number, GrowthDayBucket>();
  for (const b of buckets) {
    if (!b || !isFiniteScore(b.day) || b.day < 0 || b.day > maxValidDay) continue;
    const day = Math.floor(b.day);
    const existing = byDay.get(day);
    if (existing) {
      existing.routineWill += clampFinite(b.routineWill, 0, MAX_GROWTH_XP, 0);
      existing.routineMind += clampFinite(b.routineMind, 0, MAX_GROWTH_XP, 0);
      existing.experienceWill += clampFinite(b.experienceWill, 0, MAX_GROWTH_XP, 0);
      existing.experienceMind += clampFinite(b.experienceMind, 0, MAX_GROWTH_XP, 0);
    } else {
      byDay.set(day, {
        day,
        routineWill: clampFinite(b.routineWill, 0, MAX_GROWTH_XP, 0),
        routineMind: clampFinite(b.routineMind, 0, MAX_GROWTH_XP, 0),
        experienceWill: clampFinite(b.experienceWill, 0, MAX_GROWTH_XP, 0),
        experienceMind: clampFinite(b.experienceMind, 0, MAX_GROWTH_XP, 0),
      });
    }
  }
  return Array.from(byDay.values())
    .sort((a, b) => a.day - b.day)
    .slice(-31);
}

function sanitizeFamilyDayBuckets(
  buckets: GrowthFamilyDayBucket[] | undefined,
  maxValidDay: number
): GrowthFamilyDayBucket[] {
  if (!Array.isArray(buckets)) return [];
  const byDay = new Map<number, GrowthFamilyDayBucket>();
  for (const b of buckets) {
    if (!b || !isFiniteScore(b.day) || b.day < 0 || b.day > maxValidDay) continue;
    const day = Math.floor(b.day);
    const counts: Record<string, number> = {};
    if (b.counts && typeof b.counts === 'object') {
      for (const [k, v] of Object.entries(b.counts)) {
        if (typeof k === 'string' && isFiniteScore(v) && v > 0) {
          counts[k] = Math.floor(v);
        }
      }
    }
    const existing = byDay.get(day);
    if (existing) {
      for (const [k, v] of Object.entries(counts)) {
        existing.counts[k] = (existing.counts[k] ?? 0) + v;
      }
    } else {
      byDay.set(day, { day, counts });
    }
  }
  return Array.from(byDay.values())
    .sort((a, b) => a.day - b.day)
    .slice(-31);
}

/**
 * Phục hồi hoặc di trú (migrate) dữ liệu Đặc điểm, Tiềm năng, Ý chí, Tâm cảnh và Baseline cho 1 thực thể trong stagingWorld.
 * Không phát sự kiện gameplay, không cấp lại phần thưởng XP đã nhận.
 */
export function hydrateOrMigrateEntityTraitTalent(
  stagingWorld: ECSWorld,
  entityId: Entity,
  c: Record<string, any>,
  worldSeed: number,
  savedTotalTicks: number
): void {
  if (!c.race && !c.traits && !c.talentProfile) {
    return;
  }

  const savedDay = stagingWorld.calendarDayFloorAtTick(Math.max(0, savedTotalTicks));
  const raceComp = stagingWorld.getComponent(entityId, RaceComponent);
  const rawRace = raceComp?.raceId ?? c.race?.raceId ?? 'human';
  const raceId: RaceId =
    rawRace === 'beast' || rawRace === 'demon' ? rawRace : 'human';

  // 1. Chuẩn hóa TraitsComponent và tách công pháp trong techniqueTraits (mục 9.6, 14.3)
  let traitsComp = stagingWorld.getComponent(entityId, TraitsComponent);
  if (!traitsComp && (c.traits || c.race)) {
    traitsComp = stagingWorld.addComponent(entityId, new TraitsComponent());
  }

  if (traitsComp && c.traits) {
    const pureTechniques: string[] = [];
    const misplacedTraits: string[] = [];

    for (const techId of c.traits.techniqueTraits ?? []) {
      if (typeof techId !== 'string' || !techId) continue;
      if (techId in TECHNIQUE_DEFINITIONS) {
        if (!pureTechniques.includes(techId)) {
          pureTechniques.push(techId);
        }
        // Nếu thực thể có công pháp trong techniqueTraits nhưng thiếu CultivationTechniqueComponent, tự phục hồi
        if (!stagingWorld.hasComponent(entityId, CultivationTechniqueComponent)) {
          const tDef = TECHNIQUE_DEFINITIONS[techId];
          stagingWorld.addComponent(
            entityId,
            new CultivationTechniqueComponent(
              tDef.id,
              tDef.name,
              tDef.tier,
              tDef.element,
              tDef.description,
              'co_duyen',
              'Bản lưu cũ',
              'nhap_mon',
              0
            )
          );
        }
      } else {
        misplacedTraits.push(techId);
      }
    }

    traitsComp.techniqueTraits = pureTechniques;

    if (Array.isArray(c.traits.entries) && c.traits.entries.length > 0) {
      // Nhánh V3: khôi phục entries đã lưu, loại trùng ID
      traitsComp.entries = [];
      traitsComp.innateTraits = [];
      traitsComp.trainingTraits = [];
      const seen = new Set<string>();

      for (const rawEntry of c.traits.entries) {
        if (!rawEntry || typeof rawEntry.id !== 'string' || !rawEntry.id) continue;
        const canonicalId = resolveTraitId(rawEntry.id);
        if (seen.has(canonicalId)) continue;
        seen.add(canonicalId);

        traitsComp.entries.push({
          id: canonicalId,
          origin: rawEntry.origin ?? 'innate',
          acquiredAtDay: isFiniteScore(rawEntry.acquiredAtDay) ? rawEntry.acquiredAtDay : 0,
          sourceEventId: rawEntry.sourceEventId,
          state: rawEntry.state ?? 'active',
          legacyGrandfathered: rawEntry.legacyGrandfathered,
          dormantReason: rawEntry.dormantReason,
        });
      }
      traitsComp.syncLegacyViews();
      traitsComp.revision = isFiniteScore(c.traits.revision) ? c.traits.revision : 1;
    } else {
      // Nhánh Legacy: di trú từ innateTraits, trainingTraits và misplacedTraits
      traitsComp.entries = [];
      traitsComp.innateTraits = [];
      traitsComp.trainingTraits = [];

      const rawInnate: string[] = [
        ...(Array.isArray(c.traits.innateTraits) ? c.traits.innateTraits : []),
        ...misplacedTraits,
      ];
      const rawTraining: string[] = Array.isArray(c.traits.trainingTraits)
        ? c.traits.trainingTraits
        : [];

      for (const tid of rawInnate) {
        if (typeof tid !== 'string' || !tid) continue;
        grantTrait(stagingWorld, entityId, tid, {
          reason: 'migration',
          day: 0,
          legacyGrandfathered: true,
          skipRebuild: true,
        });
      }
      for (const tid of rawTraining) {
        if (typeof tid !== 'string' || !tid) continue;
        grantTrait(stagingWorld, entityId, tid, {
          reason: 'migration',
          day: savedDay,
          legacyGrandfathered: true,
          skipRebuild: true,
        });
      }
    }
  }

  // 2. Nhánh V3: Đã có c.talentProfile
  if (c.talentProfile) {
    const profile = new TalentProfileComponent(c.talentProfile);
    stagingWorld.addComponent(entityId, profile);

    if (c.growthMind) {
      const gm = new GrowthMindComponent(c.growthMind);
      gm.willpowerXp = clampFinite(gm.willpowerXp, 0, MAX_GROWTH_XP, 0);
      gm.mindsetXp = clampFinite(gm.mindsetXp, 0, MAX_GROWTH_XP, 0);
      gm.mentalState = clampFinite(gm.mentalState, -100, 100, 0);
      if (gm.lastIntegratedTick < 0 || gm.lastIntegratedTick > savedTotalTicks) {
        gm.lastIntegratedTick = savedTotalTicks;
      }
      gm.dailyBuckets = sanitizeDayBuckets(gm.dailyBuckets, savedDay);
      gm.familyDayBuckets = sanitizeFamilyDayBuckets(gm.familyDayBuckets, savedDay);
      stagingWorld.addComponent(entityId, gm);
    } else {
      stagingWorld.addComponent(
        entityId,
        new GrowthMindComponent({ lastIntegratedTick: savedTotalTicks })
      );
    }

    if (c.statBaseline) {
      const sb = new StatBaselineComponent(c.statBaseline);
      stagingWorld.addComponent(entityId, sb);
    } else {
      ensureStatBaseline(stagingWorld, entityId);
    }

    getEntityPotential(stagingWorld, entityId);
    return;
  }

  // 3. Nhánh Legacy: Di trú điểm tiềm năng, trưởng thành và suy ngược baseline (mục 14.4 & 14.5)
  const hp = stagingWorld.getComponent(entityId, HealthComponent);
  const life = stagingWorld.getComponent(entityId, LifespanComponent);
  const pos = stagingWorld.getComponent(entityId, PositionComponent);
  const rootComp = stagingWorld.getComponent(entityId, SpiritualRootComponent);
  const compComp = stagingWorld.getComponent(entityId, ComprehensionComponent);
  const realmComp = stagingWorld.getComponent(entityId, RealmComponent);

  const savedHpCurrent = hp?.current;
  const savedHpMax = hp?.max;
  const savedLifeMax = life?.maxLifespan;
  const savedSpeed = pos?.speed;

  // 3.1 Khôi phục hoặc suy ngược StatBaselineComponent từ chỉ số đã nhân trong save cũ
  if (c.statBaseline) {
    const sb = new StatBaselineComponent(c.statBaseline);
    stagingWorld.addComponent(entityId, sb);
  } else {
    ensureStatBaseline(stagingWorld, entityId);
  }

  // 3.2 Tính observedC, observedA, observedB và LegacyPotentialAnchor
  const raceDef = RACE_DEFINITIONS[raceId] ?? RACE_DEFINITIONS['human'];
  const defaultLegacyC = fromLegacyComprehensionValue(raceDef.baseStats.comprehension);
  const observedC = compComp
    ? fromLegacyComprehensionValue(compComp.current)
    : defaultLegacyC;

  let pendingRoot: PendingRoot;
  let knowledge: TalentProfileComponent['knowledge'];

  if (rootComp && !rootComp.isAwakened) {
    pendingRoot = computeDeterministicPendingRoot(
      worldSeed,
      entityId,
      raceId,
      traitsComp
    );
    knowledge = 'unassessed';
  } else if (rootComp) {
    pendingRoot = {
      rootType: rootComp.rootType,
      purity: rootComp.purity,
      elements: [...rootComp.elements],
      gradeName: rootComp.gradeName,
    };
    knowledge = 'estimatedLegacy';
  } else {
    pendingRoot = computeDeterministicPendingRoot(
      worldSeed,
      entityId,
      raceId,
      traitsComp
    );
    knowledge = 'estimatedLegacy';
  }

  const observedA = calculateRootAptitudeBase(pendingRoot.rootType, pendingRoot.purity);
  const contributors = resolveInnateContributors(stagingWorld, entityId);
  const traitDeltas = calculateTraitInnateDeltas(contributors);

  const raceBasePhysique = RACE_INNATE_BASE_CENTERS[raceId].physique;
  const observedB = clampFinite(
    raceBasePhysique + traitDeltas.physique,
    0,
    100,
    raceBasePhysique
  );

  const profile = new TalentProfileComponent({
    schemaVersion: TRAIT_SYSTEM_VERSION,
    birthSeed: computeDeterministicHash(worldSeed, entityId, 101),
    seedClass: 'ordinary',
    base: {
      comprehension: clampFinite(observedC - traitDeltas.comprehension, 0, 100, 0),
      aptitude: observedA,
      physique: raceBasePhysique,
    },
    pendingRoot,
    lineageTags: raceId === 'beast' ? ['beast_mixed'] : [],
    knowledge,
    migrationBaseIsResolved: false,
    legacyAnchor: {
      observedScores: {
        comprehension: observedC,
        aptitude: observedA,
        physique: observedB,
      },
      traitDeltaAtMigration: traitDeltas,
    },
  });
  stagingWorld.addComponent(entityId, profile);

  // 3.3 Khởi tạo GrowthMindComponent cho bản lưu cũ
  const age = life?.currentAge ?? 18;
  const stageIdx = realmComp?.stageIndex ?? 0;
  const isSentientAdult =
    (raceId !== 'beast' && age >= 12) || (raceId === 'beast' && stageIdx >= 1);

  const initialWillScore = isSentientAdult
    ? LEGACY_MIGRATION_DEFAULTS.adultWillpowerScore
    : LEGACY_MIGRATION_DEFAULTS.childWillpowerScore;
  const initialMindScore = isSentientAdult
    ? LEGACY_MIGRATION_DEFAULTS.adultMindsetScore
    : LEGACY_MIGRATION_DEFAULTS.childMindsetScore;

  const growth = new GrowthMindComponent({
    willpowerXp: xpForScore(initialWillScore),
    mindsetXp: xpForScore(initialMindScore),
    mentalState: 0,
    lastIntegratedTick: savedTotalTicks,
    backgroundSource: 'legacy',
  });
  stagingWorld.addComponent(entityId, growth);

  // 3.4 Rebuild chỉ số dẫn xuất và bảo toàn chính xác snapshot HP/Lifespan/Speed đang chơi (Test S03)
  rebuildEntityStats(stagingWorld, entityId);
  if (hp && savedHpMax !== undefined && savedHpCurrent !== undefined) {
    hp.max = savedHpMax;
    hp.current = hp.isDead ? 0 : Math.min(savedHpMax, savedHpCurrent);
  }
  if (life && savedLifeMax !== undefined) {
    life.maxLifespan = savedLifeMax;
    life.isElderly = life.checkElderly();
  }
  if (pos && savedSpeed !== undefined) {
    pos.speed = savedSpeed;
  }
}

export function serializeEntityTraitTalent(
  world: ECSWorld,
  entityId: Entity,
  comps: Record<string, any>
): void {
  const traits = world.getComponent(entityId, TraitsComponent);
  if (traits) {
    traits.reconcileFromLegacyArrays(0);
    comps.traits = {
      innateTraits: traits.innateTraits,
      techniqueTraits: traits.techniqueTraits,
      trainingTraits: traits.trainingTraits,
      entries: traits.entries.map(e => ({ ...e })),
      revision: traits.revision,
    };
  }

  const profile = world.getComponent(entityId, TalentProfileComponent);
  if (profile) {
    comps.talentProfile = {
      schemaVersion: profile.schemaVersion,
      birthSeed: profile.birthSeed,
      seedClass: profile.seedClass,
      base: { ...profile.base },
      pendingRoot: profile.pendingRoot
        ? {
            rootType: profile.pendingRoot.rootType,
            purity: profile.pendingRoot.purity,
            elements: [...profile.pendingRoot.elements],
            primaryTraitId: profile.pendingRoot.primaryTraitId,
            gradeName: profile.pendingRoot.gradeName,
          }
        : null,
      lineageTags: [...profile.lineageTags],
      foundationChanges: profile.foundationChanges.map(fc => ({
        id: fc.id,
        eventId: fc.eventId,
        day: fc.day,
        delta: { ...fc.delta },
        reason: fc.reason,
      })),
      knowledge: profile.knowledge,
      migrationBaseIsResolved: profile.migrationBaseIsResolved,
      legacyAnchor: profile.legacyAnchor
        ? {
            observedScores: { ...profile.legacyAnchor.observedScores },
            traitDeltaAtMigration: { ...profile.legacyAnchor.traitDeltaAtMigration },
          }
        : undefined,
      revision: profile.revision,
    };
  }

  const growth = world.getComponent(entityId, GrowthMindComponent);
  if (growth) {
    comps.growthMind = {
      willpowerXp: growth.willpowerXp,
      mindsetXp: growth.mindsetXp,
      mentalState: growth.mentalState,
      lastIntegratedTick: growth.lastIntegratedTick,
      dailyBuckets: growth.dailyBuckets.map(b => ({ ...b })),
      familyDayBuckets: growth.familyDayBuckets.map(b => ({
        day: b.day,
        counts: { ...b.counts },
      })),
      cooldownUntilDay: { ...growth.cooldownUntilDay },
      recentEventIds: growth.recentEventIds.map(e => ({ ...e })),
      claimedMilestones: [...growth.claimedMilestones],
      experiences: growth.experiences.map(e => ({ ...e })),
      recentGains: growth.recentGains.map(g => ({ ...g })),
      backgroundSource: growth.backgroundSource,
      professionCounters: { ...growth.professionCounters },
      combatEncounterCount: growth.combatEncounterCount,
      distinctOpponentIds: [...growth.distinctOpponentIds],
      revision: growth.revision,
    };
  }

  const baseline = world.getComponent(entityId, StatBaselineComponent);
  if (baseline) {
    comps.statBaseline = {
      agingReference: baseline.agingReference ? { ...baseline.agingReference } : undefined,
      agingFactor: baseline.agingFactor,
      baseMoveSpeed: baseline.baseMoveSpeed,
      baseMaxHealth: baseline.baseMaxHealth,
      healthGrowthMultiplier: baseline.healthGrowthMultiplier,
      archetypeHealthMultiplier: baseline.archetypeHealthMultiplier,
      baseLifespan: baseline.baseLifespan,
      lifespanGrowthMultiplier: baseline.lifespanGrowthMultiplier,
      archetypeLifespanMultiplier: baseline.archetypeLifespanMultiplier,
      baseAttack: baseline.baseAttack,
      baseDefense: baseline.baseDefense,
      baseArmor: baseline.baseArmor,
      archetypePhysiqueMultiplier: baseline.archetypePhysiqueMultiplier,
      baseCritRate: baseline.baseCritRate,
      baseDodgeRate: baseline.baseDodgeRate,
      baseAttackSpeed: baseline.baseAttackSpeed,
      permanentAdjustments: baseline.permanentAdjustments.map(a => ({ ...a })),
      legacyStatAnchor: baseline.legacyStatAnchor
        ? { ...baseline.legacyStatAnchor }
        : undefined,
      lastRebuiltTraitRevision: baseline.lastRebuiltTraitRevision,
      lastRebuiltStageIndex: baseline.lastRebuiltStageIndex,
    };
  }
}
