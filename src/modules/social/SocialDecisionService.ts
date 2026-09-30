import { SOCIAL_CONFIG } from '../../config/social.config.ts';
import { ECSWorld } from '../../ecs/World.ts';
import { SpatialGrid } from '../../core/SpatialGrid.ts';
import { CombatStatsComponent } from '../combat/CombatComponents.ts';
import { DailyScheduleComponent, HealthComponent, NameComponent, PositionComponent } from '../beings/BeingComponents.ts';
import { isActiveBondBetween } from './RelationshipRules.ts';
import { SocialRelationshipComponent, RelationshipType } from './SocialComponents.ts';
import { ConversationRejectionReason, ConversationSnapshot, evaluateConversation, readConversationSnapshot } from './SocialConversationService.ts';

export interface SocialCandidate {
  readonly entityId: number;
  readonly distance: number;
  readonly score: number;
  readonly name: string;
  readonly relationType: RelationshipType;
}

export type SocialCandidateEvaluation =
  | { readonly status: 'eligible'; readonly score: number; readonly distance: number }
  | { readonly status: 'rejected'; readonly reason: ConversationRejectionReason | 'outside_search_radius' };

/** Prospective meeting: actual distance scores travel; it does not authorize a conversation at that distance. */
export function evaluateSocialCandidate(snapshot: ConversationSnapshot, sharedActivity: boolean): SocialCandidateEvaluation {
  const config = SOCIAL_CONFIG.socialDecision;
  if (!Number.isFinite(snapshot.distance) || snapshot.distance < 0 || snapshot.distance > config.searchRadius)
    return { status: 'rejected', reason: 'outside_search_radius' };
  const conversation = evaluateConversation({ ...snapshot, distance: 0 });
  if (conversation.status === 'skipped') return { status: 'rejected', reason: conversation.reason };
  const affinity = (Math.min(snapshot.a.affinity, snapshot.b.affinity) + 100) / 200;
  const trust = Math.min(snapshot.a.trust, snapshot.b.trust) / 100;
  const relationship = (affinity + trust) / 2;
  const receptivity = Math.min(conversation.evaluation.a.receptivity, conversation.evaluation.b.receptivity);
  const distance = 1 - snapshot.distance / config.searchRadius;
  const weights = config.weights;
  return { status: 'eligible', distance: snapshot.distance,
    score: 100 * (weights.relationship * relationship + weights.receptivity * receptivity +
      weights.distance * distance + weights.context * (sharedActivity ? 1 : 0)) };
}

/** Only called when planning, no mutation, RNG or cache spanning worlds. Optional spatial index, O(N) fallback. */
export function selectSocialCandidate(world: ECSWorld, entity: number, grid?: SpatialGrid | null): SocialCandidate | null {
  const pos = world.getComponent(entity, PositionComponent);
  if (!pos) return null;
  const activity = world.getComponent(entity, DailyScheduleComponent)?.currentActivity;
  const sharedActivities = ['recreate', 'idle'];
  const ids = grid ? grid.queryRadius(pos.x, pos.y, SOCIAL_CONFIG.socialDecision.searchRadius).map(item => item.id)
    : world.query([PositionComponent, HealthComponent, SocialRelationshipComponent]);
  const nearest: { id: number; evaluation: Extract<SocialCandidateEvaluation, { status: 'eligible' }> }[] = [];
  for (const other of new Set(ids)) {
    if (other === entity) continue;
    const otherActivity = world.getComponent(other, DailyScheduleComponent)?.currentActivity;
    const snapshot = readConversationSnapshot(world, entity, other);
    const evaluation = evaluateSocialCandidate(snapshot,
      !!activity && sharedActivities.includes(activity) && activity === otherActivity &&
      snapshot.distance <= SOCIAL_CONFIG.conversation.maxDistance);
    if (evaluation.status !== 'eligible') continue;
    nearest.push({ id: other, evaluation });
    nearest.sort((a, b) => a.evaluation.distance - b.evaluation.distance || a.id - b.id);
    if (nearest.length > SOCIAL_CONFIG.socialDecision.maxCandidates) nearest.pop();
  }
  nearest.sort((a, b) => b.evaluation.score - a.evaluation.score ||
    a.evaluation.distance - b.evaluation.distance || a.id - b.id);
  const best = nearest[0];
  if (!best) return null;
  const rel = world.getComponent(entity, SocialRelationshipComponent)?.getRelationship(best.id);
  const special = rel && ['dao_companion', 'master', 'disciple', 'sworn_brother', 'kin_parent', 'kin_child'].includes(rel.relationType);
  const type = rel?.bond?.status === 'ended' || special && !isActiveBondBetween(world, entity, best.id, rel!.relationType)
    ? 'friend' : rel?.relationType ?? 'acquaintance';
  return { entityId: best.id, score: best.evaluation.score, distance: best.evaluation.distance,
    name: world.getComponent(best.id, NameComponent)?.name ?? rel?.targetName ?? 'Hàng xóm', relationType: type };
}

export type SocialAssistanceRejectionReason =
  | 'participant_unavailable' | 'no_active_bond' | 'insufficient_affinity' | 'insufficient_trust'
  | 'self_preservation' | 'no_live_enemy' | 'out_of_range' | 'conflicting_bond' | 'already_engaged';
export type SocialAssistanceEvaluation =
  | { readonly status: 'eligible'; readonly enemyId: number; readonly distance: number }
  | { readonly status: 'rejected'; readonly reason: SocialAssistanceRejectionReason };

/** Chỉ đánh giá hỗ trợ tự nguyện; không đặt target, đổi bond, thưởng hoặc tiêu RNG. */
export function evaluateSocialAssistance(world: ECSWorld, helper: number, ally: number, maintaining = false): SocialAssistanceEvaluation {
  const reject = (reason: SocialAssistanceRejectionReason): SocialAssistanceEvaluation => ({ status: 'rejected', reason });
  const hp = world.getComponent(helper, HealthComponent);
  const allyHp = world.getComponent(ally, HealthComponent);
  const combat = world.getComponent(helper, CombatStatsComponent);
  const pos = world.getComponent(helper, PositionComponent);
  const allyPos = world.getComponent(ally, PositionComponent);
  if (helper === ally || !hp || hp.isDead || !Number.isFinite(hp.current) || hp.current <= 0 ||
      !Number.isFinite(hp.max) || hp.max <= 0 || !allyHp || allyHp.isDead || !Number.isFinite(allyHp.current) || allyHp.current <= 0 ||
      !combat || !pos || !allyPos) return reject('participant_unavailable');
  const record = world.getComponent(helper, SocialRelationshipComponent)?.getRelationship(ally);
  if (!record || !['dao_companion', 'master', 'disciple', 'sworn_brother'].includes(record.relationType) ||
      !isActiveBondBetween(world, helper, ally, record.relationType)) return reject('no_active_bond');
  const config = SOCIAL_CONFIG.assistance;
  if (!Number.isFinite(record.affinity) || record.affinity < config.minAffinity) return reject('insufficient_affinity');
  if (!Number.isFinite(record.trust) || record.trust < config.minTrust) return reject('insufficient_trust');
  if (hp.current / hp.max <= config.fleeHealthRatio) return reject('self_preservation');
  if (!maintaining && combat.targetEntityId !== null) return reject('already_engaged');
  const enemy = world.getComponent(ally, CombatStatsComponent)?.targetEntityId;
  const enemyHp = enemy != null ? world.getComponent(enemy, HealthComponent) : null;
  if (enemy == null || enemy === helper || enemy === ally || !enemyHp || enemyHp.isDead ||
      !Number.isFinite(enemyHp.current) || enemyHp.current <= 0 || !world.hasComponent(enemy, PositionComponent))
    return reject('no_live_enemy');
  const distance = Math.hypot(allyPos.x - pos.x, allyPos.y - pos.y);
  if (!Number.isFinite(distance) || distance > config.radius) return reject('out_of_range');
  // Any active special bond with the enemy (including family) blocks voluntary intervention.
  for (const type of ['dao_companion', 'master', 'disciple', 'sworn_brother', 'kin_parent', 'kin_child'] as const) {
    if (isActiveBondBetween(world, helper, enemy, type)) return reject('conflicting_bond');
  }
  return { status: 'eligible', enemyId: enemy, distance };
}
