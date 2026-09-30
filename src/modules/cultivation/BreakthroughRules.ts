import { ECSWorld } from '../../ecs/World.ts';
import { REALM_CHAINS } from '../../config/realms.config.ts';
import {
  RealmComponent, RaceComponent, HealthComponent, ComprehensionComponent,
  CultivationTechniqueComponent
} from '../beings/BeingComponents.ts';
import { TECHNIQUE_DEFINITIONS } from '../../config/techniques.config.ts';
import { resolveEntityTraitEffects } from '../traits/TraitEffectResolver.ts';
import { GrowthMindComponent } from '../talent/TalentComponents.ts';
import { scoreFromXp, clampFinite } from '../talent/PotentialCalculator.ts';

export interface BreakthroughOutlook {
  eligible: boolean;
  reason: string;
  major: boolean;
  chance: number;
  cooldownDays: number;
}

export function getBreakthroughOutlook(world: ECSWorld, entityId: number): BreakthroughOutlook {
  const realm = world.getComponent(entityId, RealmComponent);
  const raceId = world.getComponent(entityId, RaceComponent)?.raceId ?? 'human';
  const hp = world.getComponent(entityId, HealthComponent);
  const chain = realm ? REALM_CHAINS[realm.realmChainId] : undefined;
  const stage = realm && chain ? chain.stages[realm.stageIndex] : undefined;
  if (!realm || !stage) return { eligible: false, reason: 'Chưa có cảnh giới hợp lệ', major: false, chance: 0, cooldownDays: 0 };
  const major = realm.subStageIndex >= (stage.subStages?.length ?? 1) - 1;
  const nextStage = chain?.stages[realm.stageIndex + 1];
  const base = raceId === 'beast' ? (major ? 0.28 : 0.40) :
    raceId === 'demon' ? (major ? 0.32 : 0.46) : (major ? 0.42 : 0.56);
  const stagePenalty = Math.min(0.16, realm.stageIndex * (major ? 0.045 : 0.035));
  const comp = world.getComponent(entityId, ComprehensionComponent);
  const traits = resolveEntityTraitEffects(world, entityId);
  const tech = world.getComponent(entityId, CultivationTechniqueComponent);
  const techDef = tech ? TECHNIQUE_DEFINITIONS[tech.techniqueId] : undefined;
  const growth = world.getComponent(entityId, GrowthMindComponent);
  const mindBonus = growth ? 0.06 * scoreFromXp(growth.willpowerXp) / 100 +
    0.08 * scoreFromXp(growth.mindsetXp) / 100 : 0;
  const techniqueBonus = (techDef?.baseModifiers.breakthroughBonus ?? 0) *
    (tech && tech.getMasteryMultiplier() >= 2 ? 1.5 : 1);
  const rawBonus = (comp?.getBreakthroughBonus() ?? 0) + traits.breakthroughChanceBonus +
    techniqueBonus + realm.breakthroughBonus + mindBonus;
  const cappedBonus = clampFinite(rawBonus, -0.20, major ? 0.16 : 0.18, 0);
  const mentalFactor = growth ? clampFinite(1 + growth.mentalState / 700, 0.88, 1.08, 1) : 1;
  const chance = clampFinite((base - stagePenalty + cappedBonus) * mentalFactor,
    0.08, major ? 0.65 : 0.72, base);
  const cooldownDays = realm.breakthroughTimer;
  let reason = '';
  if (hp?.isDead) reason = 'Sinh linh đã tử vong';
  else if (realm.isBreakingThrough) reason = 'Đang đột phá hoặc độ kiếp';
  else if (major && !nextStage) reason = 'Đã đạt cảnh giới cao nhất';
  else if (major && raceId === 'beast' && realm.stageIndex >= 1 &&
      realm.stageAgeDays < (realm.stageIndex === 1 ? 2200 : 3600)) {
    reason = `Yêu thể cần rèn thêm ${Math.ceil((realm.stageIndex === 1 ? 2200 : 3600) - realm.stageAgeDays)} ngày`;
  } else if (major && raceId === 'demon' && realm.stageIndex >= 1 &&
      realm.stageAgeDays < (realm.stageIndex === 1 ? 1800 : 2400)) {
    reason = `Ma thể cần rèn thêm ${Math.ceil((realm.stageIndex === 1 ? 1800 : 2400) - realm.stageAgeDays)} ngày`;
  } else if (cooldownDays > 0) reason = `Đang dưỡng thương, còn ${cooldownDays.toFixed(1)} ngày`;
  else if (realm.currentQi < realm.maxQi) reason = `Thiếu ${Math.ceil(realm.maxQi - realm.currentQi)} linh lực`;
  return { eligible: !reason, reason, major, chance, cooldownDays };
}

export function failureCooldownDays(raceId: string, stageIndex: number, major: boolean): number {
  return (major ? 5 : 2) + stageIndex * (major ? 2 : 1) + (raceId === 'beast' ? 2 : raceId === 'demon' ? 1 : 0);
}
