import { recordSocialTelemetry } from './SocialSimulationTelemetry.ts';
import { evaluateSocialFamiliarity } from './SocialFamiliarityService.ts';
import { socialEventTime } from './SocialEventTime.ts';
import { SOCIAL_CONFIG } from '../../config/social.config.ts';
import { ECSWorld } from '../../ecs/World.ts';
import { EventBus } from '../../core/EventBus.ts';
import { HealthComponent, PositionComponent, NameComponent, CharacterStateComponent, DailyScheduleComponent, CultivationTechniqueComponent } from '../beings/BeingComponents.ts';
import { CombatStatsComponent } from '../combat/CombatComponents.ts';
import { readResidentPreferences } from '../ai/brain/ResidentPreferences.ts';
import { isLivingSocialParticipant } from './RelationshipRules.ts';
import { MemoryComponent, SocialRelationshipComponent } from './SocialComponents.ts';
import { getSocialCooldownRemainingDays, performSocialInteraction } from './SocialInteractionGate.ts';

export type ConversationContext = 'casual' | 'cultivation' | 'community';
export type ConversationOutcome = 'warm' | 'neutral' | 'awkward';
export type ConversationRejectionReason =
  | 'participant_unavailable' | 'out_of_range' | 'unsafe' | 'cooldown_active' | 'declined' | 'invalid_context';

export interface ConversationScores {
  readonly affinity: number;
  readonly trust: number;
  readonly respect: number;
}

/** Điểm/tính cách là của người này đối với phía còn lại, không phải chiều ngược. */
export interface ConversationSideSnapshot {
  readonly entityId: number;
  readonly available: boolean;
  readonly unsafe: boolean;
  readonly busy: boolean;
  readonly canDiscussCultivation: boolean;
  readonly affinity: number;
  readonly trust: number;
  readonly sociability: number;
  readonly curiosity: number;
}

export interface ConversationSnapshot {
  readonly context: ConversationContext;
  readonly distance: number;
  readonly cooldownRemainingDays: number;
  readonly a: ConversationSideSnapshot;
  readonly b: ConversationSideSnapshot;
}

export interface ConversationSideEvaluation {
  readonly entityId: number;
  readonly receptivity: number;
  readonly outcome: ConversationOutcome;
  readonly delta: ConversationScores;
}

export interface ConversationEvaluation {
  readonly context: ConversationContext;
  readonly outcome: ConversationOutcome;
  readonly a: ConversationSideEvaluation;
  readonly b: ConversationSideEvaluation;
}

export type ConversationEligibility =
  | { readonly status: 'eligible'; readonly evaluation: ConversationEvaluation }
  | { readonly status: 'skipped'; readonly reason: ConversationRejectionReason };

/** Contract cho commit ở đợt 2; eligible không có nghĩa đã tăng điểm/ghi cooldown. */
export type ConversationResult =
  | { readonly status: 'completed'; readonly evaluation: ConversationEvaluation }
  | { readonly status: 'skipped'; readonly reason: ConversationRejectionReason };

const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));

function outcomeFor(value: number): ConversationOutcome {
  const thresholds = SOCIAL_CONFIG.conversation.outcomes;
  return value >= thresholds.warmMinimum ? 'warm' : value < thresholds.awkwardBelow ? 'awkward' : 'neutral';
}

function validSide(side: ConversationSideSnapshot): boolean {
  return Number.isSafeInteger(side.entityId) && side.entityId > 0 && side.available &&
    [side.affinity, side.trust, side.sociability, side.curiosity].every(Number.isFinite) &&
    side.affinity >= -100 && side.affinity <= 100 && side.trust >= 0 && side.trust <= 100 &&
    side.sociability >= 0 && side.sociability <= 1 && side.curiosity >= 0 && side.curiosity <= 1;
}

function evaluateSide(side: ConversationSideSnapshot, context: ConversationContext): ConversationSideEvaluation {
  const config = SOCIAL_CONFIG.conversation;
  const weights = config.receptivity;
  const receptivity = clamp(weights.base + weights.sociabilityWeight * (side.sociability - 0.5) +
    weights.affinityWeight * side.affinity / 100 + weights.trustWeight * (side.trust - 50) / 50 -
    (side.busy ? weights.busyPenalty : 0) +
    (context === 'cultivation' ? weights.cultivationCuriosityWeight * (side.curiosity - 0.5) : 0), 0, 1);
  const outcome = outcomeFor(receptivity);
  const delta = config.deltas[outcome];
  return { entityId: side.entityId, receptivity, outcome, delta: {
    affinity: clamp(delta.affinity, config.limits.minAffinity, config.limits.maxAffinity),
    trust: clamp(delta.trust, 0, config.limits.maxTrust),
    respect: clamp(delta.respect, 0, config.limits.maxRespect),
  } };
}

/** Evaluator thuần trên snapshot: không truy cập world, RNG, clock, API ghi hoặc ledger. */
export function evaluateConversation(snapshot: ConversationSnapshot): ConversationEligibility {
  if (!['casual', 'cultivation', 'community'].includes(snapshot.context))
    return { status: 'skipped', reason: 'invalid_context' };
  if (!validSide(snapshot.a) || !validSide(snapshot.b) || snapshot.a.entityId === snapshot.b.entityId)
    return { status: 'skipped', reason: 'participant_unavailable' };
  if (!Number.isFinite(snapshot.distance) || snapshot.distance < 0 || snapshot.distance > SOCIAL_CONFIG.conversation.maxDistance)
    return { status: 'skipped', reason: 'out_of_range' };
  if (snapshot.a.unsafe || snapshot.b.unsafe) return { status: 'skipped', reason: 'unsafe' };
  if (!Number.isFinite(snapshot.cooldownRemainingDays) || snapshot.cooldownRemainingDays < 0)
    return { status: 'skipped', reason: 'participant_unavailable' };
  if (snapshot.cooldownRemainingDays > 0) return { status: 'skipped', reason: 'cooldown_active' };
  if (snapshot.context === 'cultivation' && (!snapshot.a.canDiscussCultivation || !snapshot.b.canDiscussCultivation))
    return { status: 'skipped', reason: 'invalid_context' };
  if (snapshot.a.affinity <= SOCIAL_CONFIG.conversation.declineAffinity || snapshot.b.affinity <= SOCIAL_CONFIG.conversation.declineAffinity)
    return { status: 'skipped', reason: 'declined' };
  const a = evaluateSide(snapshot.a, snapshot.context);
  const b = evaluateSide(snapshot.b, snapshot.context);
  return { status: 'eligible', evaluation: { context: snapshot.context,
    outcome: outcomeFor((a.receptivity + b.receptivity) / 2), a, b } };
}

/** Đọc lại world tại lúc thực hiện; không khởi tạo personality hoặc relation. */
export function readConversationSnapshot(world: ECSWorld, a: number, b: number,
  context: ConversationContext = 'casual'): ConversationSnapshot {
  const side = (entity: number, other: number): ConversationSideSnapshot => {
    const hp = world.getComponent(entity, HealthComponent);
    const pos = world.getComponent(entity, PositionComponent);
    const rel = world.getComponent(entity, SocialRelationshipComponent)?.getRelationship(other);
    const personality = readResidentPreferences(entity, world);
    const combat = world.getComponent(entity, CombatStatsComponent);
    const state = world.getComponent(entity, CharacterStateComponent)?.state;
    const activity = world.getComponent(entity, DailyScheduleComponent)?.currentActivity;
    return { entityId: entity, available: isLivingSocialParticipant(world, entity) && !!pos &&
      Number.isFinite(pos.x) && Number.isFinite(pos.y) && !!hp && Number.isFinite(hp.max) && hp.max > 0,
      unsafe: !!hp && hp.current / hp.max <= SOCIAL_CONFIG.conversation.dangerHealthRatio ||
        combat?.targetEntityId != null || state === 'attack',
      busy: state === 'sleep' || !!state && ['farm', 'cook', 'build'].includes(state) ||
        !!activity && ['sleep', 'cook', 'farm', 'hunt', 'forage', 'build', 'care_child'].includes(activity),
      canDiscussCultivation: world.hasComponent(entity, CultivationTechniqueComponent),
      affinity: rel?.affinity ?? 0, trust: rel?.trust ?? 50,
      sociability: personality.sociability, curiosity: personality.curiosity };
  };
  const posA = world.getComponent(a, PositionComponent);
  const posB = world.getComponent(b, PositionComponent);
  return { context, a: side(a, b), b: side(b, a),
    distance: posA && posB ? Math.hypot(posA.x - posB.x, posA.y - posB.y) : Infinity,
    cooldownRemainingDays: getSocialCooldownRemainingDays(world, a, b, 'communication') };
}

/** Một commit đồng bộ; cooldown được chốt trước lời thoại, skipped không có side effect. */
function commitConversation(world: ECSWorld, a: number, b: number,
  context: ConversationContext = 'casual'): ConversationResult {
  const snapshot = readConversationSnapshot(world, a, b, context);
  const eligibility = evaluateConversation(snapshot);
  if (eligibility.status === 'skipped') return eligibility;
  const time = socialEventTime(world);
  const progressA = evaluateSocialFamiliarity(world.getComponent(a, SocialRelationshipComponent)?.getRelationship(b)?.familiarity,
    eligibility.evaluation.a.outcome, snapshot.a.affinity, snapshot.b.affinity, snapshot.a.trust, time);
  const progressB = evaluateSocialFamiliarity(world.getComponent(b, SocialRelationshipComponent)?.getRelationship(a)?.familiarity,
    eligibility.evaluation.b.outcome, snapshot.b.affinity, snapshot.a.affinity, snapshot.b.trust, time);
  const addTrust = (side: ConversationSideEvaluation, delta: number): ConversationSideEvaluation =>
    ({ ...side, delta: { ...side.delta, trust: side.delta.trust + delta } });
  const evaluation: ConversationEvaluation = { ...eligibility.evaluation,
    a: addTrust(eligibility.evaluation.a, progressA.trustDelta), b: addTrust(eligibility.evaluation.b, progressB.trustDelta) };
  const result = performSocialInteraction(world, a, b, 'communication', () => {
    for (const [side, target] of [[evaluation.a, b], [evaluation.b, a]] as const) {
      const name = world.getComponent(target, NameComponent)?.name ?? 'Cư dân';
      const relations = world.getComponent(side.entityId, SocialRelationshipComponent)!;
      const record = relations.adjustScores(target, name, side.delta.affinity, side.delta.trust, side.delta.respect, time);
      const progress = side.entityId === a ? progressA : progressB;
      if (progress.next) record.familiarity = { ...progress.next }; else delete record.familiarity;
      if (progress.result !== 'reset') recordSocialTelemetry(world, 'familiarity', progress.result, side.entityId, target);
      relations.updateOrdinaryLabel(target);
      let memory = world.getComponent(side.entityId, MemoryComponent);
      if (!memory) { memory = new MemoryComponent(); world.addComponent(side.entityId, memory); }
      const activity = context === 'cultivation' ? 'trao đổi chuyện tu luyện' : context === 'community' ? 'giao lưu đồng hương' : 'trò chuyện';
      const feeling = side.outcome === 'warm' ? 'hợp chuyện, cảm thấy gần gũi hơn' : side.outcome === 'awkward' ? 'có phần ngượng ngùng' : 'bình dị';
      memory.addMemory('chatted', `Cùng [${name}] ${activity}; cuộc gặp ${feeling}.`,
        SOCIAL_CONFIG.conversation.memory.importance, SOCIAL_CONFIG.conversation.memory.emotion[side.outcome],
        target, name, socialEventTime(world));
    }
    return true;
  });
  if (result.status === 'skipped') return { status: 'skipped', reason:
    result.reason === 'interaction_failed' ? 'participant_unavailable' : result.reason };
  const text = evaluation.outcome === 'awkward' ? 'Hôm nay nói chuyện có chút ngượng ngùng…' :
    evaluation.outcome === 'warm' ? 'Thật vui khi được cùng đạo hữu chuyện trò!' :
    context === 'cultivation' ? 'Cùng trao đổi đôi điều về tu luyện.' :
    context === 'community' ? 'Cùng bà con chuyện trò một lát.' : 'Đạo hữu, cùng chuyện trò một lát nhé.';
  EventBus.getInstance().emit('social:speech', { entityId: a, text,
    color: evaluation.outcome === 'awkward' ? '#9ca3af' : '#7dd3fc' });
  return { status: 'completed', evaluation };
}

export function performConversation(world: ECSWorld, a: number, b: number, context: ConversationContext = 'casual'): ConversationResult {
  recordSocialTelemetry(world, 'conversation', 'attempted', a, b, context);
  const result = commitConversation(world, a, b, context);
  recordSocialTelemetry(world, 'conversation', result.status, a, b,
    result.status === 'completed' ? result.evaluation.outcome : result.reason);
  if (result.status === 'completed') {
    for (const side of [result.evaluation.a, result.evaluation.b]) {
      recordSocialTelemetry(world, 'conversation_side', side.outcome, side.entityId, side.entityId === a ? b : a, context);
    }
  }
  return result;
}
