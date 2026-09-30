import { performConversation } from './SocialConversationService.ts';
import { SOCIAL_CONFIG } from '../../config/social.config.ts';
import { ECSWorld } from '../../ecs/World.ts';
import { HealthComponent } from '../beings/BeingComponents.ts';
import { isLivingSocialParticipant } from './RelationshipRules.ts';
import { SocialRelationshipComponent } from './SocialComponents.ts';
import { SocialCooldownChannel, socialCooldownKey, socialCooldownOwner } from './SocialCooldown.ts';

export type SocialInteractionResult =
  | { status: 'performed' }
  | { status: 'skipped'; reason: 'participant_unavailable' | 'cooldown_active' | 'interaction_failed' };

export function getSocialCooldownRemainingDays(world: ECSWorld, a: number, b: number,
  channel: SocialCooldownChannel): number {
  const [owner, target] = socialCooldownOwner(a, b, channel);
  const record = world.getComponent(owner, SocialRelationshipComponent)?.cooldowns.get(socialCooldownKey(target, channel));
  return record ? Math.max(0, record.expiresAtDay - world.calendarDaysAtTick()) : 0;
}

export function startSocialCooldown(world: ECSWorld, a: number, b: number, channel: SocialCooldownChannel, durationDays: number = SOCIAL_CONFIG.cooldownDays[channel]): void {
  if (!Number.isFinite(durationDays) || durationDays < 0) throw new RangeError('Thời gian chờ phải hữu hạn và không âm.');
  const [owner, target] = socialCooldownOwner(a, b, channel);
  world.getComponent(owner, SocialRelationshipComponent)!.cooldowns.set(socialCooldownKey(target, channel), {
    targetEntityId: target, channel,
    expiresAtDay: world.calendarDaysAtTick() + durationDays,
  });
}

/** Phản ứng của nạn nhân được phép ghi ở đòn chí mạng; nhân chứng phải còn sống. */
export function performCombatSocialInteraction(world: ECSWorld, observer: number, attacker: number,
  channel: 'attackedScores' | 'witnessedScores' | 'combatMemory', perform: () => boolean,
  allowLethalVictim = false): SocialInteractionResult {
  const health = world.getComponent(observer, HealthComponent);
  if (observer === attacker || !isLivingSocialParticipant(world, attacker) ||
      !world.hasComponent(observer, SocialRelationshipComponent) || !health || health.isDead ||
      !Number.isFinite(health.current) || health.current < 0 ||
      (!allowLethalVictim && !isLivingSocialParticipant(world, observer)))
    return { status: 'skipped', reason: 'participant_unavailable' };
  if (getSocialCooldownRemainingDays(world, observer, attacker, channel) > 0)
    return { status: 'skipped', reason: 'cooldown_active' };
  if (!perform()) return { status: 'skipped', reason: 'interaction_failed' };
  startSocialCooldown(world, observer, attacker, channel);
  return { status: 'performed' };
}

/** Đồng bộ: callback trả false thì không ghi khóa, callback chỉ được gọi sau khi kiểm tra. */
export function performSocialInteraction(world: ECSWorld, a: number, b: number,
  channel: SocialCooldownChannel, perform: () => boolean): SocialInteractionResult {
  if (a === b || !isLivingSocialParticipant(world, a) || !isLivingSocialParticipant(world, b))
    return { status: 'skipped', reason: 'participant_unavailable' };
  if (getSocialCooldownRemainingDays(world, a, b, channel) > 0)
    return { status: 'skipped', reason: 'cooldown_active' };
  if (!perform()) return { status: 'skipped', reason: 'interaction_failed' };
  startSocialCooldown(world, a, b, channel);
  return { status: 'performed' };
}

/** @deprecated Compatibility only. Legacy deltas are validated but evaluation owns actual scores. */
export function performCommunication(world: ECSWorld, a: number, b: number,
  affinityDelta: number, trustDelta = 0, respectDelta = 0): SocialInteractionResult {
  if (![affinityDelta, trustDelta, respectDelta].every(Number.isFinite))
    throw new RangeError('Điểm thay đổi giao tiếp phải là số hữu hạn.');
  const result = performConversation(world, a, b);
  if (result.status === 'completed') return { status: 'performed' };
  return { status: 'skipped', reason: result.reason === 'cooldown_active' || result.reason === 'participant_unavailable'
    ? result.reason : 'interaction_failed' };
}
