import { SOCIAL_CONFIG } from '../../config/social.config.ts';
import { ECSWorld } from '../../ecs/World.ts';
import { SocialRelationshipComponent } from './SocialComponents.ts';
import type { SocialFamiliarityProgress } from './SocialComponents.ts';
import type { SocialEventTime } from './SocialEventTime.ts';
import type { ConversationOutcome } from './SocialConversationService.ts';
import { isLivingSocialParticipant } from './RelationshipRules.ts';

export interface FamiliarityEvaluation {
  readonly trustDelta: number;
  readonly next?: SocialFamiliarityProgress;
  readonly result: 'advanced' | 'rewarded' | 'reset' | 'duplicate';
}

/** Pure transition, calculated from both pre-conversation affinities. No world/RNG writes. */
export function evaluateSocialFamiliarity(previous: Readonly<SocialFamiliarityProgress> | undefined,
  outcome: ConversationOutcome, affinity: number, otherAffinity: number, trust: number,
  time: SocialEventTime): FamiliarityEvaluation {
  const config = SOCIAL_CONFIG.familiarity;
  if (![affinity, otherAffinity, trust, time.day, time.tick].every(Number.isFinite) ||
      !Number.isSafeInteger(time.tick) || time.tick < 0 || time.day < 0 ||
      affinity < config.minMutualAffinity || otherAffinity < config.minMutualAffinity ||
      trust >= config.maxTrust || outcome !== 'neutral') return { trustDelta: 0, result: 'reset' };
  const validPrevious = previous?.schemaVersion === 1 && Number.isSafeInteger(previous.neutralCount) &&
    previous.neutralCount >= 0 && previous.neutralCount < config.neutralMeetings &&
    Number.isFinite(previous.lastQualifiedDay) && previous.lastQualifiedDay >= 0 &&
    Number.isSafeInteger(previous.lastQualifiedTick) && previous.lastQualifiedTick >= 0 &&
    previous.lastQualifiedTick <= time.tick && previous.lastQualifiedDay <= time.day;
  if (validPrevious && previous.lastQualifiedTick === time.tick)
    return { trustDelta: 0, next: { ...previous }, result: 'duplicate' };
  const active = validPrevious && time.day - previous.lastQualifiedDay < config.expiryDays;
  const count = (active ? previous.neutralCount : 0) + 1;
  const rewarded = count >= config.neutralMeetings;
  const trustDelta = rewarded ? Math.max(0, Math.min(config.trustPerReward, config.maxTrust - trust)) : 0;
  const nextTrust = trust + trustDelta;
  return { trustDelta, result: rewarded ? 'rewarded' : 'advanced',
    ...(nextTrust < config.maxTrust ? { next: { schemaVersion: 1 as const,
      neutralCount: rewarded ? 0 : count, lastQualifiedDay: time.day, lastQualifiedTick: time.tick } } : {}) };
}

/** Read-only effective snapshot; expired state is ignored, not mutated by inspection. */
export function readSocialFamiliarity(world: ECSWorld, owner: number, target: number): SocialFamiliarityProgress | null {
  const record = world.getComponent(owner, SocialRelationshipComponent)?.getRelationship(target);
  const reverse = world.getComponent(target, SocialRelationshipComponent)?.getRelationship(owner);
  const progress = record?.familiarity;
  if (!isLivingSocialParticipant(world, owner) || !isLivingSocialParticipant(world, target) ||
      !record || !reverse || !progress || record.affinity < SOCIAL_CONFIG.familiarity.minMutualAffinity ||
      reverse.affinity < SOCIAL_CONFIG.familiarity.minMutualAffinity || record.trust >= SOCIAL_CONFIG.familiarity.maxTrust ||
      progress.lastQualifiedTick > world.getCurrentTick() || progress.lastQualifiedDay > world.calendarDaysAtTick() ||
      world.calendarDaysAtTick() - progress.lastQualifiedDay >= SOCIAL_CONFIG.familiarity.expiryDays) return null;
  return { ...progress };
}

export function clearSocialFamiliarity(world: ECSWorld, a: number, b: number): void {
  for (const [owner, target] of [[a, b], [b, a]]) {
    const record = world.getComponent(owner, SocialRelationshipComponent)?.getRelationship(target);
    if (record) delete record.familiarity;
  }
}
