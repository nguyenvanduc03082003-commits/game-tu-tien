import { ECSWorld } from '../../ecs/World.ts';
import { CombatIntent, CombatStatsComponent } from './CombatComponents.ts';
import { HealthComponent } from '../beings/BeingComponents.ts';
import { SocialRelationshipComponent } from '../social/SocialComponents.ts';
import { evaluateSocialAssistance } from '../social/SocialDecisionService.ts';
import { recordSocialTelemetry } from '../social/SocialSimulationTelemetry.ts';
import { AIPlannerComponent } from '../ai/brain/AIComponents.ts';

export function setCombatIntent(world: ECSWorld, entity: number, enemy: number, source: CombatIntent['source'], ally?: number): void {
  const stats = world.getComponent(entity, CombatStatsComponent);
  if (!stats) return;
  stats.targetEntityId = enemy;
  stats.combatIntent = { schemaVersion: 1, source, enemyId: enemy, startedAtDay: world.calendarDaysAtTick(),
    ...(source === 'social_assistance' && ally !== undefined ? { allyId: ally,
      bondEpisodeId: world.getComponent(entity, SocialRelationshipComponent)?.getRelationship(ally)?.bond?.episodeId } : {}) };
}
export function clearCombatIntent(world: ECSWorld, entity: number, expectedEnemy?: number): void {
  const stats = world.getComponent(entity, CombatStatsComponent);
  if (stats && (expectedEnemy === undefined || stats.targetEntityId === expectedEnemy)) stats.targetEntityId = null;
}

/** Pure preview: evaluates assistance as idle without temporarily mutating the original stats. */
export function evaluateMaintainedAssistance(world: ECSWorld, entity: number): { status: 'maintained' | 'not_applicable' | 'cancel'; reason?: string } {
  const stats = world.getComponent(entity, CombatStatsComponent);
  const intent = stats?.combatIntent;
  if (!intent || intent.source !== 'social_assistance') return { status: 'not_applicable' };
  if (stats!.targetEntityId !== intent.enemyId || intent.allyId === undefined) return { status: 'cancel', reason: 'stale_intent' };
  const bond = world.getComponent(entity, SocialRelationshipComponent)?.getRelationship(intent.allyId);
  if (bond?.bond?.episodeId !== intent.bondEpisodeId) return { status: 'cancel', reason: 'bond_episode_changed' };
  const result = evaluateSocialAssistance(world, entity, intent.allyId, true);
  if (result.status === 'rejected') return { status: 'cancel', reason: result.reason };
  if (result.enemyId !== intent.enemyId) return { status: 'cancel', reason: 'ally_target_changed' };
  return { status: 'maintained' };
}
export function maintainSocialAssistance(world: ECSWorld, entity: number): boolean {
  const stats = world.getComponent(entity, CombatStatsComponent);
  const intent = stats?.combatIntent;
  const result = evaluateMaintainedAssistance(world, entity);
  if (result.status !== 'cancel' || !intent) return false;
  clearCombatIntent(world, entity, intent.enemyId);
  const planner = world.getComponent(entity, AIPlannerComponent);
  if (planner) { planner.replanRequested = true; planner.planStatus = 'failed'; }
  recordSocialTelemetry(world, 'assistance', 'cancelled', entity, intent.allyId, result.reason);
  return true;
}
export function registerSelfDefense(world: ECSWorld, victim: number, attacker: number): void {
  const hp = world.getComponent(victim, HealthComponent);
  const stats = world.getComponent(victim, CombatStatsComponent);
  if (victim === attacker || !hp || hp.isDead || hp.current <= 0 || !stats || stats.combatIntent?.source === 'god_decree') return;
  // Existing animal AI retains control of hunting/fleeing targets.
  if (!world.hasComponent(victim, SocialRelationshipComponent)) return;
  if (stats.targetEntityId !== attacker || stats.combatIntent?.source !== 'self_defense') {
    setCombatIntent(world, victim, attacker, 'self_defense');
    const planner = world.getComponent(victim, AIPlannerComponent);
    if (planner) { planner.replanRequested = true; planner.planStatus = 'failed'; }
  }
}
export function validateCombatIntentSave(entity: number, components: any): void {
  const stats = components.stats;
  if (!stats) return;
  const fail = (): never => { throw new Error(`Combat intent thực thể #${entity} không hợp lệ`); };
  const target = stats.targetEntityId;
  if (target !== undefined && target !== null && (!Number.isSafeInteger(target) || target <= 0 || target === entity)) fail();
  const intent = stats.combatIntent;
  if (intent == null) return;
  if (typeof intent !== 'object' || Array.isArray(intent) || intent.schemaVersion !== 1 ||
      !['autonomous', 'self_defense', 'social_assistance', 'god_decree'].includes(intent.source) ||
      intent.enemyId !== target || !Number.isSafeInteger(intent.enemyId) || intent.enemyId <= 0 || intent.enemyId === entity ||
      !Number.isFinite(intent.startedAtDay) || intent.startedAtDay < 0) fail();
  if (intent.source === 'social_assistance') {
    if (!Number.isSafeInteger(intent.allyId) || intent.allyId <= 0 || intent.allyId === entity || intent.allyId === target) fail();
    if (intent.bondEpisodeId !== undefined) {
      const match = typeof intent.bondEpisodeId === 'string' ? /^bond:([1-9][0-9]*):([1-9][0-9]*):([1-9][0-9]*)$/.exec(intent.bondEpisodeId) : null;
      if (!match || Number(match[1]) !== Math.min(entity, intent.allyId) || Number(match[2]) !== Math.max(entity, intent.allyId) || !Number.isSafeInteger(Number(match[3]))) fail();
    }
  } else if (intent.allyId !== undefined || intent.bondEpisodeId !== undefined) fail();
}
