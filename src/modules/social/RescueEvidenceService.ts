import { recordSocialTelemetry } from './SocialSimulationTelemetry.ts';
import { socialEventTime } from './SocialEventTime.ts';
import { EventBus } from '../../core/EventBus.ts';
import { SOCIAL_CONFIG } from '../../config/social.config.ts';
import { ECSWorld } from '../../ecs/World.ts';
import { HealthComponent, NameComponent, PositionComponent } from '../beings/BeingComponents.ts';
import { CombatStatsComponent } from '../combat/CombatComponents.ts';
import { isLivingSocialParticipant } from './RelationshipRules.ts';
import { getSocialCooldownRemainingDays, startSocialCooldown } from './SocialInteractionService.ts';
import { MemoryComponent, RescueEvidence, SocialRelationshipComponent } from './SocialComponents.ts';

function livingThreat(world: ECSWorld, threat: number): boolean {
  const hp = world.getComponent(threat, HealthComponent);
  return !!hp && !hp.isDead && hp.current > 0;
}

export function pruneRescueEvidence(world: ECSWorld, victim: number): void {
  const social = world.getComponent(victim, SocialRelationshipComponent);
  if (!social) return;
  const now = world.calendarDaysAtTick();
  social.rescueEvidence = social.rescueEvidence.filter(e => now >= e.lastThreatDay && now - e.lastThreatDay <= SOCIAL_CONFIG.rescue.evidenceDays);
}

/** Actual damage is independent of the social-score cooldown. Healthy snapshots invalidate old danger. */
export function recordRescueThreat(world: ECSWorld, victim: number, threat: number): void {
  if (victim === threat || !isLivingSocialParticipant(world, victim) || !livingThreat(world, threat)) return;
  const social = world.getComponent(victim, SocialRelationshipComponent)!;
  const hp = world.getComponent(victim, HealthComponent)!;
  if (!Number.isFinite(hp.max) || hp.max <= 0) return;
  pruneRescueEvidence(world, victim);
  const ratio = hp.current / hp.max;
  const old = social.rescueEvidence.find(e => e.threatEntityId === threat && e.resolvedAtDay === undefined);
  if (ratio > SOCIAL_CONFIG.rescue.dangerHealthRatio) {
    social.rescueEvidence = social.rescueEvidence.filter(e => e !== old);
    return;
  }
  if (old) { old.lastThreatDay = world.calendarDaysAtTick(); old.dangerHealthRatio = ratio; return; }
  const next = social.rescueEpisodeCounter + 1;
  if (!Number.isSafeInteger(next)) throw new RangeError('Rescue episode counter overflow');
  social.rescueEpisodeCounter = next;
  social.rescueEvidence.unshift({ episodeId: `rescue:${victim}:${next}`, threatEntityId: threat,
    lastThreatDay: world.calendarDaysAtTick(), dangerHealthRatio: ratio, claimed: false });
  social.rescueEvidence.length = Math.min(social.rescueEvidence.length, SOCIAL_CONFIG.rescue.maxThreats);
}

export interface RescueCandidate { victim: number; episodeId: string; }
/** Snapshot the dying enemy's current target before death/target cleanup. */
export function captureRescueCandidates(world: ECSWorld, threat: number): RescueCandidate[] {
  const target = world.getComponent(threat, CombatStatsComponent)?.targetEntityId;
  if (target != null) recordRescueThreat(world, target, threat);
  const result: RescueCandidate[] = [];
  for (const victim of world.query([SocialRelationshipComponent, HealthComponent])) {
    pruneRescueEvidence(world, victim);
    for (const e of world.getComponent(victim, SocialRelationshipComponent)!.rescueEvidence) {
      if (e.threatEntityId === threat && !e.claimed && e.resolvedAtDay === undefined)
        result.push({ victim, episodeId: e.episodeId });
    }
  }
  return result;
}

function otherThreatRemains(world: ECSWorld, victim: number, eliminated: number): boolean {
  for (const enemy of world.query([HealthComponent, CombatStatsComponent])) {
    if (enemy !== eliminated && enemy !== victim && livingThreat(world, enemy) &&
        world.getComponent(enemy, CombatStatsComponent)!.targetEntityId === victim) return true;
  }
  return world.getComponent(victim, SocialRelationshipComponent)!.rescueEvidence.some(e =>
    e.threatEntityId !== eliminated && e.resolvedAtDay === undefined && livingThreat(world, e.threatEntityId));
}

export type RescueResult = { status: 'awarded' } | { status: 'rejected'; reason: string };
/** Requires a resolved evidence episode, never awards simply from two entity IDs. */
export function claimRescueLife(world: ECSWorld, rescuer: number, victim: number, episodeId: string): RescueResult {
  const reject = (reason: string): RescueResult => { recordSocialTelemetry(world, 'rescue', 'rejected', rescuer, victim, reason); return { status: 'rejected', reason }; };
  if (rescuer === victim || !isLivingSocialParticipant(world, rescuer) || !isLivingSocialParticipant(world, victim)) return reject('participant_unavailable');
  pruneRescueEvidence(world, victim);
  const social = world.getComponent(victim, SocialRelationshipComponent)!;
  const e = social.rescueEvidence.find(item => item.episodeId === episodeId);
  if (!e || e.claimed || e.resolvedAtDay === undefined || e.rescuerId !== rescuer || e.resolvedAtTick !== world.getCurrentTick() ||
      e.threatEntityId === rescuer || e.threatEntityId === victim || e.dangerHealthRatio > SOCIAL_CONFIG.rescue.dangerHealthRatio) return reject('invalid_evidence');
  const threatHp = world.getComponent(e.threatEntityId, HealthComponent);
  if (!threatHp?.isDead || threatHp.current > 0) return reject('threat_not_defeated');
  const a = world.getComponent(rescuer, PositionComponent);
  const b = world.getComponent(victim, PositionComponent);
  if (!a || !b || Math.hypot(a.x - b.x, a.y - b.y) > SOCIAL_CONFIG.rescue.radius) return reject('out_of_range');
  if (otherThreatRemains(world, victim, e.threatEntityId)) return reject('other_threat_remains');
  if (getSocialCooldownRemainingDays(world, victim, rescuer, 'rescueLife') > 0) return reject('cooldown_active');
  const name = world.getComponent(rescuer, NameComponent)?.name ?? 'Ân nhân';
  const victimName = world.getComponent(victim, NameComponent)?.name ?? 'Cư dân';
  e.claimed = true;
  startSocialCooldown(world, victim, rescuer, 'rescueLife', SOCIAL_CONFIG.rescue.cooldownDays);
  social.adjustScores(rescuer, name, 70, 60, 40, socialEventTime(world));
  social.updateOrdinaryLabel(rescuer);
  for (const [owner, type, description, importance, emotion, target, targetName] of [
    [victim, 'saved_life', `Được [${name}] trảm sát kẻ đang đe dọa, cứu lấy một mạng!`, 5, 95, rescuer, name],
    [rescuer, 'helped', `Đã cứu [${victimName}] khỏi kẻ đang đe dọa tính mạng.`, 4, 60, victim, victimName],
  ] as const) {
    let memory = world.getComponent(owner, MemoryComponent);
    if (!memory) { memory = new MemoryComponent(); world.addComponent(owner, memory); }
    memory.addMemory(type, description, importance, emotion, target, targetName, socialEventTime(world));
  }
  EventBus.getInstance().emit('chronicle:entry', { category: 'social', importance: 'medium',
    message: `✨ [${name}] đã trảm sát kẻ đe dọa, cứu [${victimName}] khỏi nguy hiểm tính mạng.` });
  EventBus.getInstance().emit('social:speech', { entityId: victim,
    text: `Đa tạ ${name} đã cứu mạng!`, color: '#38d9a9' });
  recordSocialTelemetry(world, 'rescue', 'awarded', rescuer, victim);
  return { status: 'awarded' };
}

/** Only CombatSystem calls this after its verified lethal HP transition. */
export function resolveRescueKill(world: ECSWorld, rescuer: number, threat: number, hpBefore: number, candidates: RescueCandidate[]): void {
  const hp = world.getComponent(threat, HealthComponent);
  if (!(hpBefore > 0) || !hp?.isDead || hp.current > 0) return;
  for (const candidate of candidates) {
    if (candidate.victim === rescuer || candidate.victim === threat || rescuer === threat) continue;
    const e: RescueEvidence | undefined = world.getComponent(candidate.victim, SocialRelationshipComponent)?.rescueEvidence.find(item => item.episodeId === candidate.episodeId);
    if (!e || e.threatEntityId !== threat || e.resolvedAtDay !== undefined || e.claimed) continue;
    recordSocialTelemetry(world, 'rescue', 'resolved', rescuer, candidate.victim);
    e.resolvedAtDay = world.calendarDaysAtTick(); e.resolvedAtTick = world.getCurrentTick(); e.rescuerId = rescuer;
    claimRescueLife(world, rescuer, candidate.victim, e.episodeId);
  }
}
