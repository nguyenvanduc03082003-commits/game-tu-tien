import assert from 'node:assert/strict';
import { socialFixture } from './social-fixture.ts';
import { performConversation, readConversationSnapshot, evaluateConversation } from '../src/modules/social/SocialConversationService.ts';
import { formSwornBond, endSwornBond, updateBondConflicts } from '../src/modules/social/RelationshipService.ts';
import { evaluateSocialAssistance, selectSocialCandidate } from '../src/modules/social/SocialDecisionService.ts';
import { setCombatIntent, maintainSocialAssistance, evaluateMaintainedAssistance, registerSelfDefense, validateCombatIntentSave } from '../src/modules/combat/CombatIntentService.ts';
import { SocialRelationshipComponent, MemoryComponent } from '../src/modules/social/SocialComponents.ts';
import { CombatStatsComponent, ProjectileComponent } from '../src/modules/combat/CombatComponents.ts';
import { ProjectileSystem } from '../src/modules/combat/ProjectileSystem.ts';
import { CombatSystem } from '../src/modules/combat/CombatSystem.ts';
import { CorpseComponent } from '../src/modules/beings/DeathComponents.ts';
import { processSocialDeath } from '../src/modules/social/SocialDeathService.ts';
import { SpatialGrid } from '../src/core/SpatialGrid.ts';
import { StrategicGoalEvaluator } from '../src/modules/ai/brain/goals/StrategicGoal.ts';
import { AIStrategicBrainComponent } from '../src/modules/ai/brain/AIComponents.ts';
import { WeatherType } from '../src/config/weather.config.ts';
import { HealthComponent, PositionComponent } from '../src/modules/beings/BeingComponents.ts';
import { AIPlannerComponent, AIBehaviorTreeComponent } from '../src/modules/ai/brain/AIComponents.ts';
import { BehaviorTreeExecutor } from '../src/modules/ai/brain/behavior/BehaviorTree.ts';
import { readSocialTelemetry, recordSocialTelemetry, setSocialTelemetryEnabled, resetSocialTelemetry } from '../src/modules/social/SocialSimulationTelemetry.ts';
import { ResidentPersonalityComponent } from '../src/modules/ai/brain/ResidentPreferences.ts';
import { renderSocialRelationshipDetails, renderSocialSimulationDebug } from '../src/ui/SocialRelationshipInspector.ts';
import { SaveManager } from '../src/modules/save/SaveManager.ts';
import { TimeManager } from '../src/core/TimeManager.ts';
import { recordRescueThreat, captureRescueCandidates, resolveRescueKill, claimRescueLife } from '../src/modules/social/RescueEvidenceService.ts';
let passed = 0;
function test(name: string, fn: () => void) { fn(); passed++; console.log('PASS social:', name); }
const escape = (v: unknown) => String(v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
function assistance() {
  const f = socialFixture(), a = f.resident(), b = f.resident(120), enemy = f.resident(140);
  f.pair(a, b); assert.equal(formSwornBond(f.world, a, b).status, 'created');
  setCombatIntent(f.world, b, enemy, 'autonomous');
  return { ...f, a, b, enemy };
}
test('conversation commits both sides once; exact world-day cooldown and pause', () => {
  const f = socialFixture(), a = f.resident(), b = f.resident(120);
  f.world.timeState = { totalTicks: 0, speed: 1, calendarEpochTick: 400, calendarEpochDays: 50, oldTicksPerDay: 20 };
  f.world.setCurrentTick(600);
  assert.equal(performConversation(f.world, a, b).status, 'completed');
  const rel = f.world.getComponent(a, SocialRelationshipComponent)!.getRelationship(b)!;
  assert.equal(rel.affinity, 1); assert.equal(rel.lastInteractionDay, 50.5); assert.equal(rel.lastInteractionTick, 600);
  assert.equal(f.world.getComponent(b, SocialRelationshipComponent)!.getRelationship(a)!.affinity, 1);
  assert.equal(performConversation(f.world, a, b).status, 'skipped');
  f.world.setCurrentTick(999); assert.equal(performConversation(f.world, a, b).status, 'skipped');
  f.world.setCurrentTick(1000); assert.equal(performConversation(f.world, a, b).status, 'completed');
});
test('55 distance and 25% HP boundaries reject without score or memory mutation', () => {
  for (const distance of [55, 55.001]) {
    const f = socialFixture(), a = f.resident(), b = f.resident(100 + distance);
    assert.equal(performConversation(f.world, a, b).status, distance === 55 ? 'completed' : 'skipped');
    if (distance > 55) assert.equal(f.world.getComponent(a, SocialRelationshipComponent)!.relationships.size, 0);
  }
  const f = socialFixture(), a = f.resident(), b = f.resident();
  f.world.getComponent(a, HealthComponent)!.current = 25;
  assert.deepEqual(performConversation(f.world, a, b), { status: 'skipped', reason: 'unsafe' });
  assert.equal(f.world.getComponent(a, MemoryComponent)!.memories.length, 0);
});
test('preview, selection and Inspector do not create personality or consume RNG', () => {
  const f = socialFixture(), a = f.resident(), b = f.resident(); f.pair(a, b);
  f.world.removeComponent(a, ResidentPersonalityComponent);
  const before = JSON.stringify([...f.world.getComponent(a, SocialRelationshipComponent)!.relationships]);
  const random = Math.random; Math.random = () => { throw new Error('read consumed RNG'); };
  try {
    evaluateConversation(readConversationSnapshot(f.world, a, b)); selectSocialCandidate(f.world, a);
    renderSocialRelationshipDetails(f.world, a, f.world.getComponent(a, SocialRelationshipComponent)!.getRelationship(b)!, true, true, escape);
    renderSocialSimulationDebug(f.world, a, true, escape);
  } finally { Math.random = random; }
  assert.equal(f.world.hasComponent(a, ResidentPersonalityComponent), false);
  assert.equal(JSON.stringify([...f.world.getComponent(a, SocialRelationshipComponent)!.relationships]), before);
  assert.equal(readSocialTelemetry(f.world).enabled, false);
});
test('assistance exact affinity/trust/HP/range thresholds and readonly evaluation', () => {
  for (const [field, value, allowed] of [['affinity', 20, true], ['affinity', 19.99, false], ['trust', 40, true], ['trust', 39.99, false], ['hp', 25, false], ['hp', 25.001, true], ['distance', 180, true], ['distance', 180.001, false]] as const) {
    const f = assistance(), record = f.world.getComponent(f.a, SocialRelationshipComponent)!.getRelationship(f.b)!;
    if (field === 'hp') f.world.getComponent(f.a, HealthComponent)!.current = value;
    else if (field === 'distance') f.world.getComponent(f.b, PositionComponent)!.x = 100 + value;
    else record[field] = value;
    assert.equal(evaluateSocialAssistance(f.world, f.a, f.b).status, allowed ? 'eligible' : 'rejected', `${field} ${value}`);
    assert.equal(f.world.getComponent(f.a, CombatStatsComponent)!.targetEntityId, null);
  }
});
test('lost bond cancels only assistance, fails stale attack plan and cannot reacquire', () => {
  const f = assistance(); setCombatIntent(f.world, f.a, f.enemy, 'social_assistance', f.b);
  assert.equal(evaluateMaintainedAssistance(f.world, f.a).status, 'maintained');
  const planner = f.world.getComponent(f.a, AIPlannerComponent)!;
  planner.planStatus = 'executing'; planner.steps = [{ type: 'ATTACK_TARGET', description: 'assist', targetEntityId: f.enemy }];
  assert.equal(endSwornBond(f.world, f.a, f.b).status, 'ended');
  assert.equal(maintainSocialAssistance(f.world, f.a), true); assert.equal(planner.planStatus, 'failed');
  const bt = f.world.addComponent(f.a, new AIBehaviorTreeComponent());
  BehaviorTreeExecutor.tick(f.world, f.a, bt, planner, f.worldMap, .05);
  assert.equal(f.world.getComponent(f.a, CombatStatsComponent)!.targetEntityId, null);
});
test('maintenance cancels episode, enemy changes, death, HP and distance', () => {
  for (const cause of ['episode', 'target', 'death', 'hp', 'range']) {
    const f = assistance(); setCombatIntent(f.world, f.a, f.enemy, 'social_assistance', f.b);
    if (cause === 'episode') f.world.getComponent(f.a, SocialRelationshipComponent)!.getRelationship(f.b)!.bond!.episodeId += '1';
    if (cause === 'target') setCombatIntent(f.world, f.b, f.resident(), 'autonomous');
    if (cause === 'death') f.world.getComponent(f.enemy, HealthComponent)!.current = 0;
    if (cause === 'hp') f.world.getComponent(f.a, HealthComponent)!.current = 25;
    if (cause === 'range') f.world.getComponent(f.b, PositionComponent)!.x = 281;
    assert.equal(maintainSocialAssistance(f.world, f.a), true, cause);
  }
});
test('self defense replaces assistance and interrupts stale plan; decree stays', () => {
  const f = assistance(), attacker = f.resident();
  setCombatIntent(f.world, f.a, f.enemy, 'social_assistance', f.b);
  registerSelfDefense(f.world, f.a, attacker);
  assert.equal(f.world.getComponent(f.a, CombatStatsComponent)!.combatIntent!.source, 'self_defense');
  endSwornBond(f.world, f.a, f.b); assert.equal(maintainSocialAssistance(f.world, f.a), false);
  assert.equal(f.world.getComponent(f.a, CombatStatsComponent)!.targetEntityId, attacker);
  setCombatIntent(f.world, f.a, f.enemy, 'god_decree'); registerSelfDefense(f.world, f.a, attacker);
  assert.equal(f.world.getComponent(f.a, CombatStatsComponent)!.combatIntent!.source, 'god_decree');
  f.world.getComponent(f.a, CombatStatsComponent)!.targetEntityId = f.enemy;
  assert.equal(f.world.getComponent(f.a, CombatStatsComponent)!.combatIntent, null);
});
test('telemetry off/bounds/copy/reset and counters match completed conversation', () => {
  const f = socialFixture(), a = f.resident(), b = f.resident();
  recordSocialTelemetry(f.world, 'x', 'y', a); assert.equal(readSocialTelemetry(f.world).samples.length, 0);
  setSocialTelemetryEnabled(f.world, true); performConversation(f.world, a, b); performConversation(f.world, a, b);
  const data = readSocialTelemetry(f.world);
  assert.equal(data.counters['conversation:attempted:casual'], 2);
  assert.equal(data.counters['conversation:completed:neutral'], 1);
  assert.equal(data.counters['conversation:skipped:cooldown_active'], 1);
  for (let i = 0; i < 300; i++) recordSocialTelemetry(f.world, 'x', String(i), a);
  assert.equal(readSocialTelemetry(f.world).samples.length, 200); assert.equal(Object.keys(readSocialTelemetry(f.world).counters).length, 128);
  data.samples[0].detail = 'modified'; assert.notEqual(readSocialTelemetry(f.world).samples[0].detail, 'modified');
  resetSocialTelemetry(f.world); assert.equal(readSocialTelemetry(f.world).enabled, false);
});
test('rescue rewards actual resolved evidence once, never two IDs alone', () => {
  const f = assistance(); f.world.getComponent(f.b, HealthComponent)!.current = 35;
  setCombatIntent(f.world, f.enemy, f.b, 'autonomous'); recordRescueThreat(f.world, f.b, f.enemy);
  const candidates = captureRescueCandidates(f.world, f.enemy);
  const hp = f.world.getComponent(f.enemy, HealthComponent)!; hp.current = 0; hp.isDead = true;
  resolveRescueKill(f.world, f.a, f.enemy, 100, candidates);
  const evidence = f.world.getComponent(f.b, SocialRelationshipComponent)!.rescueEvidence[0];
  assert.equal(evidence.claimed, true);
  const before = f.world.getComponent(f.b, SocialRelationshipComponent)!.getRelationship(f.a)!.interactionsCount;
  assert.equal(claimRescueLife(f.world, f.a, f.b, evidence.episodeId).status, 'rejected');
  assert.equal(f.world.getComponent(f.b, SocialRelationshipComponent)!.getRelationship(f.a)!.interactionsCount, before);
});
test('save roundtrip assistance, old fields, reset telemetry and reject corrupt data atomically', () => {
  const f = assistance(); TimeManager.getInstance().loadState({ totalTicks: 0, speed: 1 });
  setCombatIntent(f.world, f.a, f.enemy, 'social_assistance', f.b);
  const data = SaveManager.serializeWorld(f.engine); SaveManager.validateSaveData(data);
  setSocialTelemetryEnabled(f.world, true); SaveManager.deserializeWorld(f.engine, JSON.parse(JSON.stringify(data)));
  assert.equal(f.world.getComponent(f.a, CombatStatsComponent)!.combatIntent!.source, 'social_assistance');
  assert.equal(evaluateMaintainedAssistance(f.world, f.a).status, 'maintained');
  assert.equal(readSocialTelemetry(f.world).enabled, false);
  const bad: any = JSON.parse(JSON.stringify(data)); bad.entities.find((e: any) => e.id === f.a).components.stats.combatIntent.enemyId = f.a;
  assert.throws(() => SaveManager.deserializeWorld(f.engine, bad), /Combat intent/);
  assert.equal(f.world.getComponent(f.a, CombatStatsComponent)!.targetEntityId, f.enemy);
  for (const e of data.entities) if ((e.components as any).stats) { delete (e.components as any).stats.targetEntityId; delete (e.components as any).stats.combatIntent; }
  SaveManager.deserializeWorld(f.engine, data); assert.equal(f.world.getComponent(f.a, CombatStatsComponent)!.combatIntent, null);
});
test('save validator rejects NaN, invalid source, target mismatch and wrong episode', () => {
  for (const patch of [{ startedAtDay: NaN }, { source: 'unknown' }, { enemyId: 999 }, { allyId: 10 }, { bondEpisodeId: 'bond:1:2:1' }]) {
    assert.throws(() => validateCombatIntentSave(10, { stats: { targetEntityId: 30, combatIntent: { schemaVersion: 1, source: 'social_assistance', enemyId: 30, allyId: 20, startedAtDay: 0, ...patch } } }), /Combat intent/);
  }
});
test('real melee hit registers self-defense and betrayal; no hit does not', () => {
  const f = assistance(); setCombatIntent(f.world, f.a, f.b, 'autonomous');
  assert.equal(f.world.getComponent(f.b, CombatStatsComponent)!.combatIntent!.source, 'autonomous');
  f.world.getComponent(f.b, CombatStatsComponent)!.dodgeRate = 0;
  const random = Math.random; Math.random = () => .99;
  try { new CombatSystem(f.worldMap).update(f.world, .05); } finally { Math.random = random; }
  assert.ok(f.world.getComponent(f.b, HealthComponent)!.current < 100);
  assert.equal(f.world.getComponent(f.b, CombatStatsComponent)!.combatIntent!.source, 'self_defense');
  assert.equal(f.world.getComponent(f.a, SocialRelationshipComponent)!.getRelationship(f.b)!.bond!.endReason, 'betrayal');
});
test('projectile hit triggers self-defense/betrayal; lethal projectile resolves rescue once', () => {
  const f = assistance();
  function shoot(source: number, target: number, damage: number) {
    const pos = f.world.getComponent(target, PositionComponent)!;
    const id = f.world.createEntity(); f.world.addComponent(id, new PositionComponent(pos.x, pos.y));
    f.world.addComponent(id, new ProjectileComponent(source, target, pos.x, pos.y, damage, false, 340, 'arrow'));
    new ProjectileSystem().update(f.world, .05); assert.equal(f.world.hasComponent(id, ProjectileComponent), false);
  }
  shoot(f.a, f.b, 5);
  assert.equal(f.world.getComponent(f.b, CombatStatsComponent)!.combatIntent!.source, 'self_defense');
  assert.equal(f.world.getComponent(f.a, SocialRelationshipComponent)!.getRelationship(f.b)!.bond!.endReason, 'betrayal');
  f.world.getComponent(f.b, HealthComponent)!.current = 35;
  setCombatIntent(f.world, f.enemy, f.b, 'autonomous'); recordRescueThreat(f.world, f.b, f.enemy);
  shoot(f.a, f.enemy, 1000);
  assert.equal(f.world.getComponent(f.b, SocialRelationshipComponent)!.rescueEvidence[0].claimed, true);
  assert.equal(f.world.getComponent(f.enemy, HealthComponent)!.isDead, true);
});
test('dodged projectile has no social hit effects', () => {
  const f = assistance(); f.world.addComponent(f.b, new AIBehaviorTreeComponent());
  const pos = f.world.getComponent(f.b, PositionComponent)!;
  const id = f.world.createEntity(); f.world.addComponent(id, new PositionComponent(pos.x, pos.y));
  f.world.addComponent(id, new ProjectileComponent(f.a, f.b, pos.x, pos.y, 10, false, 340, 'arrow'));
  const dodge = BehaviorTreeExecutor.tryActiveDodge; BehaviorTreeExecutor.tryActiveDodge = () => true;
  try { new ProjectileSystem().update(f.world, .05); } finally { BehaviorTreeExecutor.tryActiveDodge = dodge; }
  assert.equal(f.world.getComponent(f.b, HealthComponent)!.current, 100);
  assert.equal(f.world.getComponent(f.a, SocialRelationshipComponent)!.getRelationship(f.b)!.bond!.status, 'active');
  assert.equal(f.world.getComponent(f.b, CombatStatsComponent)!.combatIntent!.source, 'autonomous');
});
test('conflict ends at 30 days exactly and recovery restarts its timer', () => {
  const f = assistance(); const record = f.world.getComponent(f.a, SocialRelationshipComponent)!.getRelationship(f.b)!;
  record.affinity = -50; record.trust = 20; updateBondConflicts(f.world);
  f.world.setCurrentTick(30 * 400 - 1); updateBondConflicts(f.world); assert.equal(record.bond!.status, 'active');
  f.world.setCurrentTick(30 * 400); updateBondConflicts(f.world); assert.equal(record.bond!.status, 'ended');
  const g = assistance(), social = g.world.getComponent(g.a, SocialRelationshipComponent)!, r = social.getRelationship(g.b)!;
  r.affinity = -50; r.trust = 20; updateBondConflicts(g.world); g.world.setCurrentTick(29 * 400);
  social.adjustScores(g.b, 'ally', 1, 0, 0, { day: 29, tick: 29 * 400 }); assert.equal(r.bond!.conflictSinceDay, undefined);
  r.affinity = -50; updateBondConflicts(g.world); g.world.setCurrentTick(30 * 400); updateBondConflicts(g.world);
  assert.equal(r.bond!.status, 'active'); assert.equal(r.bond!.conflictSinceDay, 29);
});
test('death closes bond and emits bereavement only once even after memory removal', () => {
  const f = assistance(), hp = f.world.getComponent(f.b, HealthComponent)!; hp.current = 0; hp.isDead = true;
  const corpse = new CorpseComponent('ally', 'human', 0, 'mortal', 1, 1, 1, 'battle',
    { pills: [], mainHand: null, offHand: null, bodyArmor: null, artifact: null });
  processSocialDeath(f.world, f.b, corpse);
  assert.equal(f.world.getComponent(f.a, SocialRelationshipComponent)!.getRelationship(f.b)!.bond!.endReason, 'death');
  const memory = f.world.getComponent(f.a, MemoryComponent)!;
  assert.equal(memory.memories.filter(m => m.type === 'bereavement').length, 1);
  memory.memories.length = 0; processSocialDeath(f.world, f.b, corpse); assert.equal(memory.memories.length, 0);
});
test('spatial and fallback candidates agree; ordinary contacts do not spam assistance telemetry', () => {
  const f = socialFixture(), a = f.resident(), b = f.resident(120); f.pair(a, b, 10, 50);
  const grid = new SpatialGrid(64); grid.rebuild([a, b].map(id => ({ id, ...f.world.getComponent(id, PositionComponent)! })));
  assert.equal(selectSocialCandidate(f.world, a, grid)?.entityId, selectSocialCandidate(f.world, a)?.entityId);
  setSocialTelemetryEnabled(f.world, true);
  StrategicGoalEvaluator.evaluate(f.world, a, new AIStrategicBrainComponent('LABOUR_WORK'), f.worldMap, f.qiGrid, WeatherType.CLEAR, .5);
  assert.equal(readSocialTelemetry(f.world).counters['assistance:rejected:no_active_bond'], undefined);
});
console.log(`${passed} social phase 5 groups passed`);

