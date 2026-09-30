import { performConversation } from './SocialConversationService.ts';
import { ECSWorld } from '../../ecs/World.ts';
import { SocialInteractionResult } from './SocialInteractionGate.ts';
export * from './SocialInteractionGate.ts';

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
