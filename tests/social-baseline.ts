import assert from 'node:assert/strict';
import { writeSocialBaseline, socialBaselineOutputPath } from './social-baseline-output.ts';
import { performance } from 'node:perf_hooks';
import { socialFixture } from './social-fixture.ts';
import { SeededRNG } from '../src/core/SeededRNG.ts';
import { SocialInteractionSystem } from '../src/modules/social/SocialInteractionSystem.ts';
import { SocialRelationshipComponent } from '../src/modules/social/SocialComponents.ts';
import { setSocialTelemetryEnabled, readSocialTelemetry } from '../src/modules/social/SocialSimulationTelemetry.ts';
import { PositionComponent, DailyScheduleComponent } from '../src/modules/beings/BeingComponents.ts';
import { SpatialGrid } from '../src/core/SpatialGrid.ts';
import { isActiveBondBetween } from '../src/modules/social/RelationshipRules.ts';
import { selectSocialCandidate } from '../src/modules/social/SocialDecisionService.ts';

const results: any[] = [];
const outputPath = socialBaselineOutputPath('docs/so_lieu/QUAN_HE_XA_HOI_G6_CONTROLLED_BEFORE.json');
// This harness runs real SocialInteractionSystem with fixed positions, health,
// ages and no resident AI, survival, faction production or world generation.
for (const scenario of ['cluster_idle', 'cluster_busy', 'separated'] as const) {
  for (const seed of [11, 22, 33, 44, 55, 66]) SeededRNG.withSeed(seed, rng => {
    const f = socialFixture(), ids: number[] = [];
    for (let i = 0; i < 30; i++) {
      const x = scenario === 'separated' ? i * 250 : 100 + (i % 5) * 70 + rng.nextFloat(0, 12);
      const y = scenario === 'separated' ? 100 : 100 + Math.floor(i / 5) * 8 + rng.nextFloat(0, 12);
      const id = f.resident(x, y, rng.next()); ids.push(id);
      const schedule = f.world.addComponent(id, new DailyScheduleComponent('farmer', 0));
      schedule.currentActivity = scenario === 'cluster_busy' ? 'farm' : 'idle';
    }
    const grid = new SpatialGrid(64); grid.rebuild(ids.map(id => ({ id, ...f.world.getComponent(id, PositionComponent)! })));
    const system = new SocialInteractionSystem(); system.init(f.world); system.spatialGrid = grid;
    setSocialTelemetryEnabled(f.world, true);
    let firstFriend: number | null = null, firstBond: number | null = null;
    const snapshots: any[] = []; const start = performance.now();
    for (let tick = 5; tick <= 180 * 400; tick += 5) {
      f.world.setCurrentTick(tick); system.update(f.world, .25);
      if (tick % 400 !== 0) continue;
      let friends = 0, activeBonds = 0, isolated = 0, acquaintances = 0;
      for (const id of ids) {
        const records = [...f.world.getComponent(id, SocialRelationshipComponent)!.relationships.values()];
        if (!records.some(r => r.interactionsCount > 0)) isolated++;
        friends += records.filter(r => r.relationType === 'friend').length;
        acquaintances += records.filter(r => r.relationType === 'acquaintance').length;
        activeBonds += records.filter(r => isActiveBondBetween(f.world, id, r.targetEntityId, r.relationType)).length;
      }
      const day = tick / 400;
      if (friends && firstFriend === null) firstFriend = day;
      if (activeBonds && firstBond === null) firstBond = day;
      if ([30, 90, 180].includes(day)) snapshots.push({ day, directedFriends: friends, directedAcquaintances: acquaintances, activeBondPairs: activeBonds / 2, isolatedResidents: isolated });
    }
    const telemetry = readSocialTelemetry(f.world);
    const record = { scenario, seed, residents: 30, days: 180, dt: .25, firstFriendDay: firstFriend,
      firstBondDay: firstBond, snapshots, counters: telemetry.counters, sampleCount: telemetry.samples.length,
      executionMs: Math.round(performance.now() - start) };
    assert.ok(telemetry.samples.length <= 200); assert.ok(Object.keys(telemetry.counters).length <= 128);
    results.push(record); console.log(JSON.stringify({ scenario, seed, firstFriend, firstBond, final: snapshots.at(-1), executionMs: record.executionMs }));
  });
}
const benchmarks: any[] = [];
for (const count of [30, 100, 300]) {
  const f = socialFixture(), ids = Array.from({ length: count }, (_, i) => f.resident(100 + i % 20 * 20, 100 + Math.floor(i / 20) * 20));
  const grid = new SpatialGrid(64); grid.rebuild(ids.map(id => ({ id, ...f.world.getComponent(id, PositionComponent)! })));
  for (const indexed of [false, true]) {
    const started = performance.now();
    for (let i = 0; i < 300; i++) selectSocialCandidate(f.world, ids[i % count], indexed ? grid : null);
    benchmarks.push({ residents: count, spatialIndex: indexed, calls: 300, msPerSelection: (performance.now() - started) / 300 });
  }
}
writeSocialBaseline(outputPath, {
  schemaVersion: 1, scope: 'Controlled fixed-position social subsystem, not full engine',
  tickPerDay: 400, secondsPerDayAt1x: 20, seeds: [11,22,33,44,55,66], results, benchmarks,
});
console.log('Saved 18 controlled runs and candidate-selection microbenchmarks');

