import { SOCIAL_CONFIG } from '../../config/social.config.ts';
import { ECSWorld } from '../../ecs/World.ts';
import { HealthComponent, LifespanComponent, RealmComponent } from '../beings/BeingComponents.ts';
import { FamilyComponent } from '../beings/FamilyComponent.ts';
import { RelationshipType, SocialRelationshipComponent, isProtectedRelationship } from './SocialComponents.ts';

export type RelationshipRejectionReason =
  | 'self_relationship' | 'participant_unavailable' | 'existing_bond_conflict' | 'close_kin'
  | 'underage' | 'insufficient_mutual_affinity' | 'insufficient_trust' | 'insufficient_respect'
  | 'insufficient_interactions' | 'already_has_companion' | 'realm_requirements_not_met'
  | 'already_has_master' | 'master_capacity_reached' | 'parentage_not_confirmed' | 'cooldown_active';

export type BondEligibility =
  | { status: 'eligible' }
  | { status: 'already_exists' }
  | { status: 'rejected'; reason: RelationshipRejectionReason; reasons: RelationshipRejectionReason[] };

function meets(value: number | undefined, minimum: number): boolean {
  return value !== undefined && Number.isFinite(value) && value >= minimum;
}

function outcome(reasons: RelationshipRejectionReason[]): BondEligibility {
  return reasons.length ? { status: 'rejected', reason: reasons[0], reasons } : { status: 'eligible' };
}

export function isLivingSocialParticipant(world: ECSWorld, entity: number): boolean {
  const health = world.getComponent(entity, HealthComponent);
  return !!health && !health.isDead && Number.isFinite(health.current) && health.current > 0 &&
    world.hasComponent(entity, SocialRelationshipComponent);
}

/** Chỉ đọc: không tạo bản ghi, sinh tính cách, tiêu thụ RNG hoặc cộng điểm. */
export function evaluateBondParticipants(world: ECSWorld, a: number, b: number,
  typeA: RelationshipType, typeB: RelationshipType): BondEligibility {
  if (a === b) return outcome(['self_relationship']);
  if (!isLivingSocialParticipant(world, a) || !isLivingSocialParticipant(world, b))
    return outcome(['participant_unavailable']);
  const left = world.getComponent(a, SocialRelationshipComponent)!.getRelationship(b);
  const right = world.getComponent(b, SocialRelationshipComponent)!.getRelationship(a);
  if (isActiveBondBetween(world, a, b, typeA) && right?.relationType === typeB) return { status: 'already_exists' };
  if (left?.relationType === typeA && right?.relationType === typeB &&
      left.bond?.status !== 'ended' && right.bond?.status !== 'ended' &&
      left.bond?.episodeId !== right.bond?.episodeId) return outcome(['existing_bond_conflict']);
  if ((left && left.bond?.status !== 'ended' && (isProtectedRelationship(left.relationType) || left.relationType === 'sworn_brother')) ||
      (right && right.bond?.status !== 'ended' && (isProtectedRelationship(right.relationType) || right.relationType === 'sworn_brother')))
    return outcome(['existing_bond_conflict']);
  return { status: 'eligible' };
}

function ancestors(world: ECSWorld, entity: number): Set<number> {
  const result = new Set<number>();
  const visited = new Set<number>([entity]);
  let frontier = [entity];
  for (let depth = 0; depth < SOCIAL_CONFIG.kinship.ancestorDepth; depth++) {
    const next: number[] = [];
    for (const current of frontier) {
      for (const parent of world.getComponent(current, FamilyComponent)?.parentIds ?? []) {
        if (!Number.isSafeInteger(parent) || parent <= 0 || visited.has(parent)) continue;
        visited.add(parent);
        result.add(parent);
        next.push(parent);
      }
    }
    frontier = next;
  }
  return result;
}

/** ID tổ tiên đã mất vẫn là bằng chứng; chỉ dừng truy vết khi component không còn. */
export function areCloseKin(world: ECSWorld, a: number, b: number): boolean {
  if (a === b) return true;
  for (const [from, to] of [[a, b], [b, a]]) {
    const type = world.getComponent(from, SocialRelationshipComponent)?.getRelationship(to)?.relationType;
    if (type === 'kin_parent' || type === 'kin_child') return true;
  }
  const left = ancestors(world, a);
  const right = ancestors(world, b);
  return left.has(b) || right.has(a) || [...left].some(ancestor => right.has(ancestor));
}

const RECIPROCAL: Partial<Record<RelationshipType, RelationshipType>> = {
  dao_companion: 'dao_companion', master: 'disciple', disciple: 'master',
  kin_parent: 'kin_child', kin_child: 'kin_parent', sworn_brother: 'sworn_brother',
};

export function isActiveBondBetween(world: ECSWorld, entity: number, target: number, type: RelationshipType): boolean {
  const left = world.getComponent(entity, SocialRelationshipComponent)?.getRelationship(target);
  const right = world.getComponent(target, SocialRelationshipComponent)?.getRelationship(entity);
  return entity !== target && !!RECIPROCAL[type] && isLivingSocialParticipant(world, entity) &&
    isLivingSocialParticipant(world, target) && left?.relationType === type &&
    right?.relationType === RECIPROCAL[type] && left?.bond?.status !== 'ended' && right?.bond?.status !== 'ended' &&
    left?.bond?.episodeId === right?.bond?.episodeId;
}

export function getActiveBondTargets(world: ECSWorld, entity: number, type: RelationshipType): number[] {
  if (!RECIPROCAL[type] || !isLivingSocialParticipant(world, entity)) return [];
  const records = world.getComponent(entity, SocialRelationshipComponent)!.relationships.values();
  return [...records].filter(record => isActiveBondBetween(world, entity, record.targetEntityId, type))
    .map(record => record.targetEntityId);
}

/** Không dùng ràng buộc một chiều giữa người sống để lách độc quyền/sức chứa. */
function hasIncompleteLivingBond(world: ECSWorld, entity: number, type: RelationshipType): boolean {
  const own = world.getComponent(entity, SocialRelationshipComponent)!;
  const reverseType = RECIPROCAL[type];
  for (const other of world.query([SocialRelationshipComponent])) {
    if (other === entity || !isLivingSocialParticipant(world, other)) continue;
    const left = own.getRelationship(other);
    const right = world.getComponent(other, SocialRelationshipComponent)!.getRelationship(entity);
    const outgoing = left?.relationType === type && left.bond?.status !== 'ended';
    const incoming = right?.relationType === reverseType && right?.bond?.status !== 'ended';
    if (outgoing !== incoming || (outgoing && left?.bond?.episodeId !== right?.bond?.episodeId)) return true;
  }
  return false;
}

export function evaluateCompanionBond(world: ECSWorld, a: number, b: number): BondEligibility {
  const base = evaluateBondParticipants(world, a, b, 'dao_companion', 'dao_companion');
  if (base.status !== 'eligible') return base;
  const reasons: RelationshipRejectionReason[] = [];
  const config = SOCIAL_CONFIG.companion;
  if (areCloseKin(world, a, b)) reasons.push('close_kin');
  if ([a, b].some(entity => {
    const age = world.getComponent(entity, LifespanComponent)?.currentAge;
    return age === undefined || !Number.isFinite(age) || age < config.minAge;
  })) reasons.push('underage');
  const records = [world.getComponent(a, SocialRelationshipComponent)!.getRelationship(b),
    world.getComponent(b, SocialRelationshipComponent)!.getRelationship(a)];
  if (records.some(record => !meets(record?.affinity, config.minAffinity))) reasons.push('insufficient_mutual_affinity');
  if (records.some(record => !meets(record?.trust, config.minTrust))) reasons.push('insufficient_trust');
  if (records.some(record => !meets(record?.interactionsCount, config.minInteractions))) reasons.push('insufficient_interactions');
  if ([a, b].some(entity => getActiveBondTargets(world, entity, 'dao_companion').length > 0)) reasons.push('already_has_companion');
  if ([a, b].some(entity => hasIncompleteLivingBond(world, entity, 'dao_companion'))) reasons.push('existing_bond_conflict');
  return outcome(reasons);
}

export function evaluateMentorship(world: ECSWorld, master: number, disciple: number): BondEligibility {
  const base = evaluateBondParticipants(world, master, disciple, 'disciple', 'master');
  if (base.status !== 'eligible') return base;
  const reasons: RelationshipRejectionReason[] = [];
  const config = SOCIAL_CONFIG.mentorship;
  if (areCloseKin(world, master, disciple)) reasons.push('close_kin');
  const teacherRealm = world.getComponent(master, RealmComponent);
  const learnerRealm = world.getComponent(disciple, RealmComponent);
  if (!teacherRealm || !learnerRealm || !Number.isFinite(teacherRealm.stageIndex) ||
      teacherRealm.stageIndex < config.minTeacherStage || learnerRealm.stageIndex !== config.learnerStage)
    reasons.push('realm_requirements_not_met');
  const teacher = world.getComponent(master, SocialRelationshipComponent)!.getRelationship(disciple);
  const learner = world.getComponent(disciple, SocialRelationshipComponent)!.getRelationship(master);
  if (!meets(teacher?.affinity, config.teacherAffinity) || !meets(learner?.affinity, config.learnerAffinity))
    reasons.push('insufficient_mutual_affinity');
  if (!meets(teacher?.trust, config.teacherTrust) || !meets(learner?.trust, config.learnerTrust))
    reasons.push('insufficient_trust');
  if (!meets(learner?.respect, config.learnerRespect)) reasons.push('insufficient_respect');
  if (getActiveBondTargets(world, disciple, 'master').length >= config.maxActiveMasters) reasons.push('already_has_master');
  if (getActiveBondTargets(world, master, 'disciple').length >= config.maxActiveDisciples) reasons.push('master_capacity_reached');
  if (hasIncompleteLivingBond(world, disciple, 'master') || hasIncompleteLivingBond(world, master, 'disciple'))
    reasons.push('existing_bond_conflict');
  return outcome(reasons);
}

export function evaluateSwornBond(world: ECSWorld, a: number, b: number): BondEligibility {
  const base = evaluateBondParticipants(world, a, b, 'sworn_brother', 'sworn_brother');
  if (base.status !== 'eligible') return base;
  const reasons: RelationshipRejectionReason[] = [];
  const config = SOCIAL_CONFIG.sworn;
  if (areCloseKin(world, a, b)) reasons.push('close_kin');
  const records = [world.getComponent(a, SocialRelationshipComponent)!.getRelationship(b),
    world.getComponent(b, SocialRelationshipComponent)!.getRelationship(a)];
  if ((records[0]?.relationType === 'sworn_brother' && records[0].bond?.status !== 'ended') !==
      (records[1]?.relationType === 'sworn_brother' && records[1].bond?.status !== 'ended'))
    reasons.push('existing_bond_conflict');
  if (records.some(record => !meets(record?.affinity, config.minAffinity))) reasons.push('insufficient_mutual_affinity');
  if (records.some(record => !meets(record?.trust, config.minTrust))) reasons.push('insufficient_trust');
  if (records.some(record => !meets(record?.interactionsCount, config.minInteractions))) reasons.push('insufficient_interactions');
  return outcome(reasons);
}
