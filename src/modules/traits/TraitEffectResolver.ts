import { ECSWorld } from '../../ecs/World.ts';
import { Entity } from '../../ecs/Entity.ts';
import {
  CanonicalModifierKey,
  TraitDefinitionV3,
} from '../../config/traits/trait.types.ts';
import {
  ROOT_APTITUDE_CONFIG,
  TRAIT_MODIFIER_CAPS,
} from '../../config/talent.config.ts';
import {
  clampFinite,
  isPrimaryRootTrait,
} from '../talent/PotentialCalculator.ts';
import {
  CultivationTechniqueComponent,
  RaceComponent,
  SpiritualRootComponent,
} from '../beings/BeingComponents.ts';
import { TECHNIQUE_DEFINITIONS } from '../../config/techniques.config.ts';
import { resolveActiveTraits } from './TraitService.ts';

export interface ResolvedTraitEffects {
  healthFactor: number;
  attackFactor: number;
  defenseFlat: number;
  armorFlat: number;
  attackSpeedFactor: number;
  critChanceBonus: number;
  dodgeChanceBonus: number;
  moveSpeedFactor: number;
  lifespanYears: number;
  secondaryQiRateFactor: number;
  primaryRootQiRateOverride?: number;
  breakthroughChanceBonus: number;
  techniqueLearningFactor: number;
  hungerRateFactor: number;
  thirstRateFactor: number;
  workSpeedFactor: number;
  willTrainingBonus: number;
  mindTrainingBonus: number;
  mentalEquilibriumBias: number;
  mentalRecoveryBonus: number;
  legacyPhysiqueFlat: number;
}

export const DEFAULT_RESOLVED_TRAIT_EFFECTS: Readonly<ResolvedTraitEffects> = Object.freeze({
  healthFactor: 1.0,
  attackFactor: 1.0,
  defenseFlat: 0,
  armorFlat: 0,
  attackSpeedFactor: 1.0,
  critChanceBonus: 0,
  dodgeChanceBonus: 0,
  moveSpeedFactor: 1.0,
  lifespanYears: 0,
  secondaryQiRateFactor: 1.0,
  primaryRootQiRateOverride: undefined,
  breakthroughChanceBonus: 0,
  techniqueLearningFactor: 1.0,
  hungerRateFactor: 1.0,
  thirstRateFactor: 1.0,
  workSpeedFactor: 1.0,
  willTrainingBonus: 0,
  mindTrainingBonus: 0,
  mentalEquilibriumBias: 0,
  mentalRecoveryBonus: 0,
  legacyPhysiqueFlat: 0,
});

const MULTIPLICATIVE_KEYS: readonly CanonicalModifierKey[] = [
  'healthFactor',
  'attackFactor',
  'attackSpeedFactor',
  'moveSpeedFactor',
  'qiRateFactor',
  'techniqueLearningFactor',
  'hungerRateFactor',
  'thirstRateFactor',
  'workSpeedFactor',
];

const ADDITIVE_KEYS: readonly CanonicalModifierKey[] = [
  'defenseFlat',
  'armorFlat',
  'lifespanYears',
  'critChanceBonus',
  'dodgeChanceBonus',
  'breakthroughChanceBonus',
  'willTrainingBonus',
  'mindTrainingBonus',
  'mentalEquilibriumBias',
  'mentalRecoveryBonus',
  'legacyPhysiqueFlat',
];

/**
 * Tổng hợp các modifier của danh sách đặc điểm đã active theo quy tắc mục 9.4:
 * - Loại trùng ID.
 * - Multiplier dùng log(m) tách nhánh dương/âm, sắp giảm dần, trọng số 1, 0.5, 0.25... rồi exp(sum).
 * - Primary root qiRate tách riêng làm primaryRootQiRateOverride, không nhân chồng vào secondaryQiRateFactor.
 * - Flat & xác suất cộng 1 lần và clamp theo TRAIT_MODIFIER_CAPS.
 */
export function aggregateTraitModifiers(
  activeTraits: readonly TraitDefinitionV3[],
  activeTechniqueId?: string
): ResolvedTraitEffects {
  const uniqueMap = new Map<string, TraitDefinitionV3>();
  for (const t of activeTraits) {
    if (!t || !t.id) continue;
    // Tránh tính trùng công pháp nếu vừa nằm trong legacy traits vừa có CultivationTechniqueComponent
    if (activeTechniqueId && t.id === activeTechniqueId && t.id in TECHNIQUE_DEFINITIONS) {
      continue;
    }
    if (!uniqueMap.has(t.id)) {
      uniqueMap.set(t.id, t);
    }
  }

  const traits = Array.from(uniqueMap.values());
  const out: ResolvedTraitEffects = { ...DEFAULT_RESOLVED_TRAIT_EFFECTS };

  // Xử lý Primary Root QiRate override
  for (const t of traits) {
    if (isPrimaryRootTrait(t)) {
      if (t.primaryRootOverride && Number.isFinite(t.primaryRootOverride.qiRateFactor)) {
        out.primaryRootQiRateOverride = t.primaryRootOverride.qiRateFactor;
        break;
      }
      const qiMod = t.modifiers.find(m => m.key === 'qiRateFactor');
      if (qiMod && Number.isFinite(qiMod.value) && qiMod.value > 0) {
        out.primaryRootQiRateOverride = qiMod.value;
        break;
      }
    }
  }

  // Xử lý các hệ số nhân (Multiplicative) bằng log-diminishing
  for (const key of MULTIPLICATIVE_KEYS) {
    const posLogs: { id: string; logVal: number }[] = [];
    const negLogs: { id: string; logVal: number }[] = [];

    for (const t of traits) {
      if (key === 'qiRateFactor' && isPrimaryRootTrait(t)) {
        // Primary root không nhân thêm vào nhóm trait phụ (mục 9.3)
        continue;
      }
      for (const mod of t.modifiers) {
        if (mod.key !== key) continue;
        if (!Number.isFinite(mod.value) || mod.value <= 0) continue;
        const lv = Math.log(mod.value);
        if (Math.abs(lv) < 1e-12) continue;
        if (lv > 0) {
          posLogs.push({ id: t.id, logVal: lv });
        } else {
          negLogs.push({ id: t.id, logVal: lv });
        }
      }
    }

    posLogs.sort((a, b) => {
      if (b.logVal !== a.logVal) return b.logVal - a.logVal;
      return a.id.localeCompare(b.id);
    });

    negLogs.sort((a, b) => {
      const absDiff = Math.abs(b.logVal) - Math.abs(a.logVal);
      if (absDiff !== 0) return absDiff;
      return a.id.localeCompare(b.id);
    });

    let logSum = 0;
    for (let i = 0; i < posLogs.length; i++) {
      logSum += posLogs[i].logVal * Math.pow(0.5, i);
    }
    for (let i = 0; i < negLogs.length; i++) {
      logSum += negLogs[i].logVal * Math.pow(0.5, i);
    }

    const rawFactor = Math.exp(logSum);
    const cap = TRAIT_MODIFIER_CAPS[key];
    const clamped = clampFinite(
      Math.round(rawFactor * 1e9) / 1e9,
      cap.min,
      cap.max,
      1.0
    );

    if (key === 'qiRateFactor') {
      out.secondaryQiRateFactor = clamped;
    } else {
      (out as any)[key] = clamped;
    }
  }

  // Xử lý các trường cộng (Additive)
  for (const key of ADDITIVE_KEYS) {
    let sum = 0;
    for (const t of traits) {
      for (const mod of t.modifiers) {
        if (mod.key !== key) continue;
        if (!Number.isFinite(mod.value)) continue;
        sum += mod.value;
      }
    }
    const cap = TRAIT_MODIFIER_CAPS[key];
    (out as any)[key] = clampFinite(Math.round(sum * 1e9) / 1e9, cap.min, cap.max, 0);
  }

  return out;
}

export function resolveEntityTraitEffects(
  world: ECSWorld,
  entityId: Entity
): ResolvedTraitEffects {
  const activeTraits = resolveActiveTraits(world, entityId);
  const techComp = world.getComponent(entityId, CultivationTechniqueComponent);
  return aggregateTraitModifiers(activeTraits, techComp?.techniqueId);
}

/**
 * Lấy hệ số hấp thu linh khí của Linh Căn chuẩn hóa (mục 9.3):
 * - Nếu chưa thức tỉnh linh căn (và là Nhân tộc) hoặc rootType === 'none' -> 0
 * - Nếu có primary root trait đang active -> dùng primaryRootQiRateOverride
 * - Ngược lại -> dùng ROOT_APTITUDE_CONFIG[root.rootType].defaultQiRateFactor
 * Tuyệt đối không nhân cả rootType=heaven (1.9x/3.0x) lẫn trait Thiên Linh Căn (1.9x) thành 5.7x.
 */
export function getRootQiFactor(
  world: ECSWorld,
  entityId: Entity,
  resolvedEffects?: ResolvedTraitEffects
): number {
  const rootComp = world.getComponent(entityId, SpiritualRootComponent);
  const raceComp = world.getComponent(entityId, RaceComponent);
  const raceId = raceComp?.raceId ?? 'human';

  if (rootComp) {
    if (!rootComp.isAwakened) {
      return 0;
    }
    if (rootComp.rootType === 'none') {
      // Giữ khả năng tu luyện mặc định nếu chủng tộc Yêu/Ma bị gán nhầm root none
      if (raceId === 'beast' || raceId === 'demon') {
        return ROOT_APTITUDE_CONFIG.true.defaultQiRateFactor;
      }
      return 0;
    }
  }

  const effects = resolvedEffects ?? resolveEntityTraitEffects(world, entityId);
  if (
    effects.primaryRootQiRateOverride !== undefined &&
    Number.isFinite(effects.primaryRootQiRateOverride)
  ) {
    return effects.primaryRootQiRateOverride;
  }

  const rType = rootComp?.rootType ?? (raceId === 'human' ? 'none' : 'true');
  return ROOT_APTITUDE_CONFIG[rType]?.defaultQiRateFactor ?? 0;
}

export function getEffectiveQiRateMultiplier(
  world: ECSWorld,
  entityId: Entity,
  baseRaceQiRate: number = 1.0
): number {
  const effects = resolveEntityTraitEffects(world, entityId);
  const rootFactor = getRootQiFactor(world, entityId, effects);
  if (rootFactor <= 0) return 0;
  return baseRaceQiRate * rootFactor * effects.secondaryQiRateFactor;
}

export function getWillTrainingFactor(
  world: ECSWorld,
  entityId: Entity,
  resolvedEffects?: ResolvedTraitEffects
): number {
  const effects = resolvedEffects ?? resolveEntityTraitEffects(world, entityId);
  return clampFinite(1.0 + effects.willTrainingBonus, 0.5, 1.25, 1.0);
}

export function getMindTrainingFactor(
  world: ECSWorld,
  entityId: Entity,
  resolvedEffects?: ResolvedTraitEffects
): number {
  const effects = resolvedEffects ?? resolveEntityTraitEffects(world, entityId);
  return clampFinite(1.0 + effects.mindTrainingBonus, 0.5, 1.25, 1.0);
}
