import { recordSocialTelemetry } from './SocialSimulationTelemetry.ts';
import { socialEventTime } from './SocialEventTime.ts';
import { EventBus } from '../../core/EventBus.ts';
import { ECSWorld } from '../../ecs/World.ts';
import { SOCIAL_CONFIG } from '../../config/social.config.ts';
import { getSocialCooldownRemainingDays, performSocialInteraction, performCombatSocialInteraction, startSocialCooldown, SocialInteractionResult } from './SocialInteractionService.ts';
import { NameComponent } from '../beings/BeingComponents.ts';
import { FamilyComponent } from '../beings/FamilyComponent.ts';
import { MemoryComponent, BondEndReason, RelationshipType, SocialRelationshipComponent, isProtectedRelationship } from './SocialComponents.ts';
import { BondEligibility, RelationshipRejectionReason, evaluateBondParticipants, evaluateCompanionBond, evaluateMentorship, evaluateSwornBond, isLivingSocialParticipant, isActiveBondBetween } from './RelationshipRules.ts';

export type RelationshipChangeResult =
  | { status: 'created' }
  | { status: 'already_exists' }
  | { status: 'rejected'; reason: RelationshipRejectionReason; reasons?: RelationshipRejectionReason[] };

/** Counter hai phía giữ ID ổn định qua save/load, không dùng RNG/giờ máy tính. */
function nextEpisode(world: ECSWorld, a: number, b: number): string {
  const left = world.getComponent(a, SocialRelationshipComponent)!;
  const right = world.getComponent(b, SocialRelationshipComponent)!;
  const next = Math.max(left.bondEpisodeCounter, right.bondEpisodeCounter) + 1;
  if (!Number.isSafeInteger(next) || next <= 0) throw new RangeError('Bộ đếm đợt quan hệ vượt giới hạn.');
  left.bondEpisodeCounter = right.bondEpisodeCounter = next;
  return `bond:${Math.min(a, b)}:${Math.max(a, b)}:${next}`;
}

/** Kiểm tra cả hai phía trước khi ghi bất kỳ ràng buộc nào. */
function formBond(world: ECSWorld, a: number, b: number, typeA: RelationshipType, typeB: RelationshipType,
  evaluate: () => BondEligibility,
  bonusA: [number, number, number] | null, bonusB: [number, number, number] | null, useCooldown = true): RelationshipChangeResult {
  recordSocialTelemetry(world, 'bond', 'attempted', a, b, typeA);
  const result = evaluate();
  if (result.status !== 'eligible') { recordSocialTelemetry(world, 'bond', result.status, a, b, result.status === 'rejected' ? result.reason : typeA); return result; }
  if (useCooldown && getSocialCooldownRemainingDays(world, a, b, 'bondAttempt') > 0)
    return { status: 'rejected', reason: 'cooldown_active', reasons: ['cooldown_active'] };
  const left = world.getComponent(a, SocialRelationshipComponent)!;
  const right = world.getComponent(b, SocialRelationshipComponent)!;
  const nameA = world.getComponent(a, NameComponent)?.name ?? 'Cư dân';
  const nameB = world.getComponent(b, NameComponent)?.name ?? 'Cư dân';
  const episodeId = nextEpisode(world, a, b);
  const oldA = left.getRelationship(b);
  const oldB = right.getRelationship(a);
  if (oldA) left.archiveEndedBond(oldA);
  if (oldB) right.archiveEndedBond(oldB);
  const recordA = left.ensureRelationship(b, nameB);
  const recordB = right.ensureRelationship(a, nameA);
  const date = `Ngày ${world.calendarDayFloorAtTick()}`;
  recordA.bond = { schemaVersion: 1, episodeId, status: 'active', formedAtDay: world.calendarDaysAtTick() };
  recordB.bond = { ...recordA.bond };
  recordA.relationType = typeA;
  recordB.relationType = typeB;
  recordA.specialBondDate = recordB.specialBondDate = date;
  for (const [relations, target, name, bonus] of [
    [left, b, nameB, bonusA], [right, a, nameA, bonusB],
  ] as const) {
    if (!bonus) continue;
    const record = relations.adjustScores(target, name, ...bonus, socialEventTime(world));
    record.lastInteractionDay = world.calendarDayFloorAtTick();
    record.lastInteractionTick = world.getCurrentTick();
  }
  if (useCooldown) startSocialCooldown(world, a, b, 'bondAttempt');
  recordSocialTelemetry(world, 'bond', 'created', a, b, typeA);
  return { status: 'created' };
}

export function formCompanionBond(world: ECSWorld, a: number, b: number): RelationshipChangeResult {
  return formBond(world, a, b, 'dao_companion', 'dao_companion',
    () => evaluateCompanionBond(world, a, b), [25, 30, 20], [25, 30, 20]);
}

export function formMentorship(world: ECSWorld, master: number, disciple: number): RelationshipChangeResult {
  return formBond(world, master, disciple, 'disciple', 'master',
    () => evaluateMentorship(world, master, disciple), [20, 20, 10], [30, 40, 50]);
}

/** Kết nghĩa ghi hai phía, không cộng điểm hay tính thêm lần giao lưu giả. */
export function formSwornBond(world: ECSWorld, a: number, b: number): RelationshipChangeResult {
  return formBond(world, a, b, 'sworn_brother', 'sworn_brother',
    () => evaluateSwornBond(world, a, b), null, null);
}

export function linkParentAndChild(world: ECSWorld, parent: number, child: number): RelationshipChangeResult {
  return formBond(world, parent, child, 'kin_child', 'kin_parent', () => {
    const base = evaluateBondParticipants(world, parent, child, 'kin_child', 'kin_parent');
    if (base.status !== 'eligible') return base;
    return world.getComponent(child, FamilyComponent)?.parentIds.includes(parent)
      ? { status: 'eligible' }
      : { status: 'rejected', reason: 'parentage_not_confirmed', reasons: ['parentage_not_confirmed'] };
  }, [70, 20, 0], [70, 20, 0], false);
}

export type BondEndResult =
  | { status: 'ended' } | { status: 'already_ended' }
  | { status: 'rejected'; reason: 'self_relationship' | 'participant_unavailable' | 'existing_bond_conflict' | 'invalid_end_reason' };

/** End a reciprocal living bond synchronously. */
function endBond(world: ECSWorld, a: number, b: number, typeA: RelationshipType, typeB: RelationshipType,
  reason: Exclude<BondEndReason, 'death'>, betrayalVictim?: number): BondEndResult {
  if (a === b) return { status: 'rejected', reason: 'self_relationship' };
  if (reason !== 'betrayal' && reason !== 'estrangement') return { status: 'rejected', reason: 'invalid_end_reason' };
  const left = world.getComponent(a, SocialRelationshipComponent);
  const right = world.getComponent(b, SocialRelationshipComponent);
  const recordA = left?.getRelationship(b);
  const recordB = right?.getRelationship(a);
  if (!left || !right) return { status: 'rejected', reason: 'participant_unavailable' };
  if (recordA?.relationType !== typeA || recordB?.relationType !== typeB)
    return { status: 'rejected', reason: 'existing_bond_conflict' };
  if (recordA.bond?.status === 'ended' && recordB.bond?.status === 'ended' &&
      recordA.bond.episodeId === recordB.bond.episodeId) return { status: 'already_ended' };
  if (!isLivingSocialParticipant(world, a) || !isLivingSocialParticipant(world, b))
    return { status: 'rejected', reason: 'participant_unavailable' };
  if (!isActiveBondBetween(world, a, b, typeA)) return { status: 'rejected', reason: 'existing_bond_conflict' };
  const episodeId = recordA.bond?.episodeId ?? nextEpisode(world, a, b);
  const endedAtDay = world.calendarDaysAtTick();
  recordA.bond = { schemaVersion: 1, episodeId, status: 'ended',
    ...(recordA.bond?.formedAtDay !== undefined ? { formedAtDay: recordA.bond.formedAtDay } : {}), endedAtDay, endReason: reason };
  recordB.bond = { schemaVersion: 1, episodeId, status: 'ended',
    ...(recordB.bond?.formedAtDay !== undefined ? { formedAtDay: recordB.bond.formedAtDay } : {}), endedAtDay, endReason: reason };
  const remaining = getSocialCooldownRemainingDays(world, a, b, 'bondAttempt');
  startSocialCooldown(world, a, b, 'bondAttempt', Math.max(remaining, SOCIAL_CONFIG.lifecycle.postEndCooldownDays));
  for (const [owner, target, targetName] of [[a, b, recordA.targetName], [b, a, recordB.targetName]] as const) {
    let memory = world.getComponent(owner, MemoryComponent);
    if (!memory) { memory = new MemoryComponent(); world.addComponent(owner, memory); }
    const betrayed = reason === 'betrayal' && owner === betrayalVictim;
    memory.addMemory(betrayed ? 'betrayed' : 'bond_ended',
      `${SocialRelationshipComponent.getRelationBadge(owner === a ? typeA : typeB)} với [${targetName}] đã kết thúc: ${reason === 'betrayal' ? 'phản bội' : 'mâu thuẫn kéo dài'}.`,
      4, -60, target, targetName, socialEventTime(world));
  }
  EventBus.getInstance().emit('chronicle:entry', { category: 'social', importance: 'medium',
    message: `Ràng buộc giữa [${recordB.targetName}] và [${recordA.targetName}] đã kết thúc vì ${reason === 'betrayal' ? 'phản bội' : 'mâu thuẫn'}.` });
  recordSocialTelemetry(world, 'bond', 'ended', a, b, reason);
  return { status: 'ended' };
}

export function endCompanionBond(world: ECSWorld, a: number, b: number,
  reason: Exclude<BondEndReason, 'death'> = 'estrangement'): BondEndResult {
  return endBond(world, a, b, 'dao_companion', 'dao_companion', reason);
}
export function endMentorship(world: ECSWorld, master: number, disciple: number,
  reason: Exclude<BondEndReason, 'death'> = 'estrangement'): BondEndResult {
  return endBond(world, master, disciple, 'disciple', 'master', reason);
}
export function endSwornBond(world: ECSWorld, a: number, b: number,
  reason: Exclude<BondEndReason, 'death'> = 'estrangement'): BondEndResult {
  return endBond(world, a, b, 'sworn_brother', 'sworn_brother', reason);
}

export type BondAttemptResult = RelationshipChangeResult | { status: 'not_formed' };

/** Một lần thử đủ điều kiện ghi khóa dù RNG không thành công; từ chối không tiêu RNG. */
function attemptBond(world: ECSWorld, a: number, b: number, evaluate: () => BondEligibility,
  form: () => RelationshipChangeResult, chance: number): BondAttemptResult {
  const eligibility = evaluate();
  if (eligibility.status !== 'eligible') return eligibility;
  let outcome: BondAttemptResult = { status: 'not_formed' };
  const interaction = performSocialInteraction(world, a, b, 'bondAttempt', () => {
    if (Math.random() >= chance) return true;
    outcome = form();
    return outcome.status === 'created';
  });
  if (interaction.status === 'skipped' && interaction.reason === 'interaction_failed') return outcome;
  if (interaction.status === 'skipped') return {
    status: 'rejected', reason: interaction.reason === 'cooldown_active' ? 'cooldown_active' : 'participant_unavailable',
  };
  return outcome;
}

export function attemptCompanionBond(world: ECSWorld, a: number, b: number): BondAttemptResult {
  return attemptBond(world, a, b, () => evaluateCompanionBond(world, a, b),
    () => formCompanionBond(world, a, b), SOCIAL_CONFIG.companion.chance);
}

export function attemptMentorship(world: ECSWorld, master: number, disciple: number): BondAttemptResult {
  return attemptBond(world, master, disciple, () => evaluateMentorship(world, master, disciple),
    () => formMentorship(world, master, disciple), SOCIAL_CONFIG.mentorship.chance);
}

export function attemptSwornBond(world: ECSWorld, a: number, b: number): BondAttemptResult {
  return attemptBond(world, a, b, () => evaluateSwornBond(world, a, b),
    () => formSwornBond(world, a, b), SOCIAL_CONFIG.sworn.chance);
}

/** Xung đột đổi nhãn thường, giữ ràng buộc đặc biệt; có hướng và hạn chế theo ngày. */
export function recordHostility(world: ECSWorld, observer: number, attacker: number,
  attackerName: string, affinityDelta: number, trustDelta: number, respectDelta: number,
  channel: 'attackedScores' | 'witnessedScores' = 'attackedScores'): SocialInteractionResult {
  if (![affinityDelta, trustDelta, respectDelta].every(Number.isFinite))
    throw new RangeError('Điểm thay đổi xung đột phải là số hữu hạn.');
  return performCombatSocialInteraction(world, observer, attacker, channel, () => {
    const relations = world.getComponent(observer, SocialRelationshipComponent)!;
    const record = relations.adjustScores(attacker, attackerName, affinityDelta, trustDelta, respectDelta, socialEventTime(world));
    record.lastInteractionDay = world.calendarDayFloorAtTick();
    record.lastInteractionTick = world.getCurrentTick();
    if (!record.bond && !isProtectedRelationship(record.relationType)) record.relationType = 'enemy';
    return true;
  }, channel === 'attackedScores');
}


/** Called only after a hit is confirmed, before HP is reduced, including lethal hits. */
export function handleBondBetrayal(world: ECSWorld, attacker: number, victim: number, damage: number): BondEndResult | null {
  if (!Number.isFinite(damage) || damage <= 0) return null;
  const type = world.getComponent(attacker, SocialRelationshipComponent)?.getRelationship(victim)?.relationType;
  if (!type || !['dao_companion', 'master', 'disciple', 'sworn_brother'].includes(type) ||
      !isActiveBondBetween(world, attacker, victim, type)) return null;
  const reverse = type === 'master' ? 'disciple' : type === 'disciple' ? 'master' : type;
  return endBond(world, attacker, victim, type, reverse, 'betrayal', victim);
}

/** World clock timestamps, no accumulated scan timer. Either side may sustain conflict. */
export function updateBondConflicts(world: ECSWorld): void {
  const now = world.calendarDaysAtTick();
  for (const owner of world.query([SocialRelationshipComponent])) {
    const left = world.getComponent(owner, SocialRelationshipComponent)!;
    for (const record of left.relationships.values()) {
      const target = record.targetEntityId;
      const type = record.relationType;
      if (owner >= target || !['dao_companion', 'master', 'disciple', 'sworn_brother'].includes(type) ||
          !isActiveBondBetween(world, owner, target, type)) continue;
      const right = world.getComponent(target, SocialRelationshipComponent)!;
      const reverse = right.getRelationship(owner)!;
      if (!record.bond && !reverse.bond) {
        const episodeId = nextEpisode(world, owner, target);
        record.bond = { schemaVersion: 1, episodeId, status: 'active' };
        reverse.bond = { ...record.bond };
      }
      let shouldEnd = false;
      for (const entry of [record, reverse]) {
        if (entry.affinity <= SOCIAL_CONFIG.lifecycle.conflictAffinity && entry.trust <= SOCIAL_CONFIG.lifecycle.conflictTrust) {
          entry.bond!.conflictSinceDay ??= now;
          if (now - entry.bond!.conflictSinceDay >= SOCIAL_CONFIG.lifecycle.conflictDays) shouldEnd = true;
        } else delete entry.bond!.conflictSinceDay;
      }
      if (shouldEnd) endBond(world, owner, target, type, reverse.relationType, 'estrangement');
    }
  }
}
