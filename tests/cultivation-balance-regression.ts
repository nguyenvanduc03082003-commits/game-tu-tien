import assert from 'node:assert/strict';
import { ECSWorld } from '../src/ecs/World.ts';
import { SeededRNG } from '../src/core/SeededRNG.ts';
import { REALM_CHAINS } from '../src/config/realms.config.ts';
import { RACE_DEFINITIONS } from '../src/config/races.config.ts';
import { RealmComponent, RaceComponent, HealthComponent, ComprehensionComponent } from '../src/modules/beings/BeingComponents.ts';
import { getBreakthroughOutlook, failureCooldownDays } from '../src/modules/cultivation/BreakthroughRules.ts';

function createCultivator(world: ECSWorld, raceId: 'human' | 'beast' | 'demon', highTalent = false): number {
  const id = world.createEntity();
  const chain = REALM_CHAINS[RACE_DEFINITIONS[raceId].realmsChainId];
  const stage = chain.stages[0];
  world.addComponent(id, new RaceComponent(raceId));
  world.addComponent(id, new HealthComponent(100));
  world.addComponent(id, new RealmComponent(chain.id, 0, stage.name, stage.subStages![0],
    0, stage.qiRequired, stage.baseCombatPower));
  if (highTalent) world.addComponent(id, new ComprehensionComponent(100000));
  return id;
}

const world = new ECSWorld();
const human = createCultivator(world, 'human');
const beast = createCultivator(world, 'beast');
const demon = createCultivator(world, 'demon');
for (const id of [human, beast, demon]) {
  const realm = world.getComponent(id, RealmComponent)!;
  realm.currentQi = realm.maxQi;
}
world.getComponent(beast, RealmComponent)!.subStageIndex = 1;
const h = getBreakthroughOutlook(world, human);
const b = getBreakthroughOutlook(world, beast);
const d = getBreakthroughOutlook(world, demon);
assert.ok(h.chance > d.chance && d.chance > b.chance);
assert.ok(h.chance < 0.95);
const gifted = createCultivator(world, 'human', true);
const giftedRealm = world.getComponent(gifted, RealmComponent)!;
giftedRealm.currentQi = giftedRealm.maxQi;
giftedRealm.breakthroughBonus = 0.35;
assert.ok(getBreakthroughOutlook(world, gifted).chance <= 0.65);
giftedRealm.breakthroughTimer = 3;
assert.equal(getBreakthroughOutlook(world, gifted).eligible, false);
assert.ok(getBreakthroughOutlook(world, gifted).reason.includes('dưỡng thương'));
console.log('PASS cultivation: race hierarchy, capped bonuses, major chance and cooldown eligibility');

// Abstract day-by-day balance probe using the same chance/cooldown rules and typical Qi income.
// This diagnoses probability curves without a renderer or real-time clock.
const simWorld = new ECSWorld();
const cohorts = (['human', 'beast', 'demon'] as const).flatMap(raceId =>
  Array.from({ length: 100 }, (_, index) => ({ raceId, id: createCultivator(simWorld, raceId, index % 5 === 0) })));
const rng = new SeededRNG(74193);
const snapshots: Record<number, Record<string, number>> = {};
for (let day = 1; day <= 7200; day++) {
  for (const subject of cohorts) {
    const realm = simWorld.getComponent(subject.id, RealmComponent)!;
    const chain = REALM_CHAINS[realm.realmChainId];
    if (realm.stageIndex >= chain.stages.length - 1) continue;
    realm.breakthroughTimer = Math.max(0, realm.breakthroughTimer - 1);
    realm.stageAgeDays++;
    realm.currentQi = Math.min(realm.maxQi, realm.currentQi + 10);
    if (realm.currentQi < realm.maxQi || realm.breakthroughTimer > 0) continue;
    const outlook = getBreakthroughOutlook(simWorld, subject.id);
    if (!outlook.eligible) continue;
    if (rng.next() < outlook.chance) {
      const stage = chain.stages[realm.stageIndex];
      if (realm.subStageIndex < (stage.subStages?.length ?? 1) - 1) {
        realm.subStageIndex++;
        realm.maxQi = Math.floor(realm.maxQi * 1.35);
      } else {
        realm.stageIndex++;
        realm.subStageIndex = 0;
        realm.stageAgeDays = 0;
        realm.maxQi = Math.max(chain.stages[realm.stageIndex].qiRequired, realm.maxQi * 5);
      }
      realm.currentQi = 0;
    } else {
      realm.currentQi = realm.maxQi * 0.35;
      realm.breakthroughTimer = failureCooldownDays(subject.raceId, realm.stageIndex, outlook.major);
    }
  }
  if (day === 360 || day === 1800 || day === 7200) {
    snapshots[day] = Object.fromEntries((['human', 'beast', 'demon'] as const).map(raceId => [
      raceId, cohorts.filter(subject => subject.raceId === raceId &&
        simWorld.getComponent(subject.id, RealmComponent)!.stageIndex >= 2).length
    ]));
  }
}
assert.ok(snapshots[360].beast === 0 && snapshots[360].demon === 0);
assert.ok(snapshots[1800].human > snapshots[1800].beast);
assert.ok(snapshots[1800].human > snapshots[1800].demon);
console.log(`PASS cultivation: 300-character 1/5/20-year balance probe ${JSON.stringify(snapshots)}`);
