import assert from 'node:assert/strict';
import { ECSWorld } from '../src/ecs/World.ts';
import { BeingFactory } from '../src/modules/beings/BeingFactory.ts';
import {
  CultivationTechniqueComponent,
  LifespanComponent,
  SpiritualRootComponent,
  TraitsComponent,
} from '../src/modules/beings/BeingComponents.ts';
import {
  GrowthMindComponent,
  TalentProfileComponent,
} from '../src/modules/talent/TalentComponents.ts';
import { generateTalentBundle } from '../src/modules/talent/TalentGenerator.ts';
import { getTraitDefinition } from '../src/modules/traits/TraitCatalog.ts';
import { getEntityPotential, rebuildEntityStats } from '../src/modules/traits/DerivedStatsService.ts';
import { SpiritualRootSystem } from '../src/modules/cultivation/SpiritualRootSystem.ts';
import { xpForScore } from '../src/modules/talent/PotentialCalculator.ts';

function runTest(name: string, fn: () => void): void {
  fn();
  console.log(`  ✓ ${name}`);
}

console.log('Running Talent Generation & Awakening V3 regression tests (A05)...');

// G01: Cùng worldSeed và birthOrdinal sinh cùng seed class, base và trait list
runTest('G01: Deterministic generation from worldSeed and birthOrdinal', () => {
  const b1 = generateTalentBundle({
    worldSeed: 20260925,
    birthOrdinal: 42,
    raceId: 'human',
    mode: 'natural',
    isNewborn: false,
  });
  const b2 = generateTalentBundle({
    worldSeed: 20260925,
    birthOrdinal: 42,
    raceId: 'human',
    mode: 'natural',
    isNewborn: false,
  });

  assert.equal(b1.birthSeed, b2.birthSeed);
  assert.equal(b1.seedClass, b2.seedClass);
  assert.deepEqual(b1.profile.base, b2.profile.base);
  assert.deepEqual(b1.selectedTraitIds, b2.selectedTraitIds);
  assert.deepEqual(b1.profile.pendingRoot, b2.profile.pendingRoot);
  assert.equal(b1.growth.willpowerXp, b2.growth.willpowerXp);
  assert.equal(b1.growth.mindsetXp, b2.growth.mindsetXp);
});

// G02 & G03: Sơ sinh vs Trưởng thành tạo trực tiếp
runTest('G02 & G03: Newborn vs Generated Adult growth scores and technique rules', () => {
  const world = new ECSWorld(20260925);

  // Newborn via spawnFromArchetype (even on mortal_human with newborn: true)
  const newborn = BeingFactory.spawnFromArchetype(world, 'mortal_human', 100, 100, {
    newborn: true,
    mode: 'natural',
  });
  const nbGrowth = world.getComponent(newborn, GrowthMindComponent)!;
  const nbProfile = world.getComponent(newborn, TalentProfileComponent)!;
  const nbRoot = world.getComponent(newborn, SpiritualRootComponent)!;
  const nbTech = world.getComponent(newborn, CultivationTechniqueComponent);
  const nbPot = getEntityPotential(world, newborn);

  assert.equal(nbGrowth.willpowerXp, 0);
  assert.equal(nbGrowth.mindsetXp, 0);
  assert.equal(nbGrowth.mentalState, 0);
  assert.equal(nbGrowth.backgroundSource, 'newborn');
  assert.equal(nbPot.scores.willpower, 0);
  assert.equal(nbPot.scores.mindset, 0);
  assert.equal(nbRoot.isAwakened, false);
  assert.equal(nbProfile.knowledge, 'unassessed');
  assert.equal(nbTech, undefined, 'Newborn must not inherit CultivationTechniqueComponent');

  // Generated adult
  for (let i = 0; i < 20; i++) {
    const adult = BeingFactory.spawnFromArchetype(world, 'mortal_human', 120, 120, {
      newborn: false,
      mode: 'natural',
    });
    const adGrowth = world.getComponent(adult, GrowthMindComponent)!;
    const adPot = getEntityPotential(world, adult);
    assert.equal(adGrowth.backgroundSource, 'generatedAdult');
    assert.ok(
      adPot.scores.willpower >= 15 && adPot.scores.willpower <= 30,
      `Adult willpower ${adPot.scores.willpower} out of 15..30`
    );
    assert.ok(
      adPot.scores.mindset >= 10 && adPot.scores.mindset <= 25,
      `Adult mindset ${adPot.scores.mindset} out of 10..25`
    );
    assert.ok(
      Math.abs(adGrowth.willpowerXp - xpForScore(adPot.scores.willpower)) < 1e-3
    );
    assert.ok(
      Math.abs(adGrowth.mindsetXp - xpForScore(adPot.scores.mindset)) < 1e-3
    );
  }
});

// G04: Con thừa kế 0.6*rolledBase + 0.4*mean(parentBase) cho C/B; không thừa kế W/M/mentalState
runTest('G04: Parent inheritance blends base C/B (0.6 rolled + 0.4 parent mean) and never inherits W/M/mentalState', () => {
  const world = new ECSWorld(999111);
  const parentA = BeingFactory.spawnFromArchetype(world, 'mortal_human', 50, 50);
  const parentB = BeingFactory.spawnFromArchetype(world, 'mortal_human', 52, 50);

  // Set identical speciesId so createNewborn succeeds
  const profA = world.getComponent(parentA, TalentProfileComponent)!;
  const profB = world.getComponent(parentB, TalentProfileComponent)!;
  profA.base.comprehension = 90;
  profA.base.physique = 80;
  profB.base.comprehension = 70;
  profB.base.physique = 60;

  const growthA = world.getComponent(parentA, GrowthMindComponent)!;
  const growthB = world.getComponent(parentB, GrowthMindComponent)!;
  growthA.willpowerXp = xpForScore(85);
  growthA.mindsetXp = xpForScore(90);
  growthA.mentalState = -70;
  growthB.willpowerXp = xpForScore(75);
  growthB.mindsetXp = xpForScore(80);
  growthB.mentalState = 60;

  // Compare pure rolled base at next birthOrdinal vs blended child base at same birthOrdinal
  const expectedOrdinal = world.birthOrdinal + 1;
  const unblended = generateTalentBundle({
    worldSeed: world.worldSeed,
    birthOrdinal: expectedOrdinal,
    raceId: 'human',
    mode: 'natural',
    isNewborn: true,
  });

  const child = BeingFactory.createNewborn(world, parentA, parentB);
  assert.notEqual(child, null, 'createNewborn should return valid child entity');

  const childProf = world.getComponent(child!, TalentProfileComponent)!;
  const childGrowth = world.getComponent(child!, GrowthMindComponent)!;

  const meanParentC = (90 + 70) / 2; // 80
  const meanParentB = (80 + 60) / 2; // 70
  const expectedC = Math.round((0.6 * unblended.profile.base.comprehension + 0.4 * meanParentC) * 10) / 10;
  const expectedB = Math.round((0.6 * unblended.profile.base.physique + 0.4 * meanParentB) * 10) / 10;

  assert.equal(childProf.base.comprehension, expectedC);
  assert.equal(childProf.base.physique, expectedB);
  assert.equal(childGrowth.willpowerXp, 0, 'Child must not inherit parent willpower XP');
  assert.equal(childGrowth.mindsetXp, 0, 'Child must not inherit parent mindset XP');
  assert.equal(childGrowth.mentalState, 0, 'Child must not inherit parent mentalState');
});

// G05: Thức tỉnh 12 tuổi chỉ reveal pendingRoot, không thay TraitsComponent
runTest('G05: Age-12 spiritual root awakening reveals pendingRoot without mutating TraitsComponent', () => {
  const world = new ECSWorld(20260925);
  const pA = BeingFactory.spawnFromArchetype(world, 'mortal_human', 10, 10);
  const pB = BeingFactory.spawnFromArchetype(world, 'mortal_human', 12, 10);
  const child = BeingFactory.createNewborn(world, pA, pB)!;

  const profile = world.getComponent(child, TalentProfileComponent)!;
  // Set a specific pendingRoot to verify exact reveal
  profile.pendingRoot = {
    rootType: 'earth',
    purity: 88,
    elements: ['kim', 'thuy'],
    gradeName: 'Địa Linh Căn (Song Căn)',
  };
  rebuildEntityStats(world, child);

  const traitsBefore = JSON.stringify(world.getComponent(child, TraitsComponent));
  const potentialBefore = getEntityPotential(world, child).total;
  const rootComp = world.getComponent(child, SpiritualRootComponent)!;
  assert.equal(rootComp.isAwakened, false);
  assert.equal(profile.knowledge, 'unassessed');

  const life = world.getComponent(child, LifespanComponent)!;
  life.currentAge = 12;

  const rootSystem = new SpiritualRootSystem();
  rootSystem.update(world, 1.0);

  const traitsAfter = JSON.stringify(world.getComponent(child, TraitsComponent));
  const potentialAfter = getEntityPotential(world, child).total;

  assert.equal(rootComp.isAwakened, true);
  assert.equal(rootComp.rootType, 'earth');
  assert.equal(rootComp.purity, 88);
  assert.deepEqual(rootComp.elements, ['kim', 'thuy']);
  assert.equal(profile.knowledge, 'revealed');
  assert.equal(traitsAfter, traitsBefore, 'TraitsComponent must not change on awakening');
  assert.equal(potentialAfter, potentialBefore, 'True potential must remain identical before and after reveal');
});

// C04, C05, C06, C07: Ràng buộc chủng tộc, loài/huyết mạch, nhóm xung đột và trần bậc theo seed
runTest('C04, C05, C06, C07: Race, species lineage, conflict groups, and seed tier ceiling enforcement', () => {
  const world = new ECSWorld(777888);

  for (let i = 0; i < 150; i++) {
    // Human
    const hBundle = generateTalentBundle({
      worldSeed: 777888,
      birthOrdinal: i + 1,
      raceId: 'human',
      mode: 'natural',
      isNewborn: false,
    });
    for (const tid of hBundle.selectedTraitIds) {
      const def = getTraitDefinition(tid)!;
      assert.ok(
        def.allowedRaces === 'all' || def.allowedRaces.includes('human'),
        `C04: Human received non-human trait ${tid}`
      );
    }

    // Non-dragon beast (wolf)
    const wolfBundle = generateTalentBundle({
      worldSeed: 777888,
      birthOrdinal: i + 1000,
      raceId: 'beast',
      speciesId: 'wolf',
      mode: 'natural',
      isNewborn: false,
      customTraits: ['long_huyet_ba_the', 'cuong_chien_huyet_no'],
    });
    assert.ok(
      !wolfBundle.selectedTraitIds.includes('long_huyet_ba_the'),
      'C05: Wolf without dragon lineage must not receive long_huyet_ba_the'
    );

    // Check yao_common via BeingFactory with speciesId='tiger'
    const tigerEnt = BeingFactory.spawnFromArchetype(world, 'yao_common', 10, 10, {
      speciesId: 'tiger',
      mode: 'natural',
    });
    const tigerTraits = world.getComponent(tigerEnt, TraitsComponent)!;
    assert.ok(
      !tigerTraits.entries.some(e => e.id === 'long_huyet_ba_the'),
      'C05: Tiger yao_common must not have long_huyet_ba_the'
    );

    // C06: Conflict groups (never 2 primary_root or 2 reincarnation traits)
    const legendaryBundle = generateTalentBundle({
      worldSeed: 777888,
      birthOrdinal: i + 2000,
      raceId: 'human',
      mode: 'natural',
      isNewborn: false,
      forcedSeedClass: 'legendary',
      allowReincarnation: true,
    });
    const seenGroups = new Set<string>();
    for (const tid of legendaryBundle.selectedTraitIds) {
      const def = getTraitDefinition(tid)!;
      for (const grp of def.exclusiveGroups) {
        assert.ok(
          !seenGroups.has(grp),
          `C06: Duplicate exclusiveGroup ${grp} in ${legendaryBundle.selectedTraitIds.join(', ')}`
        );
        seenGroups.add(grp);
      }
    }

    // C07: talented seed has max budget 60 (enough for tier 5 cost 55), but maxTier is 3 -> must NEVER pick tier 4 or 5
    const talentedBundle = generateTalentBundle({
      worldSeed: 777888,
      birthOrdinal: i + 3000,
      raceId: 'human',
      mode: 'natural',
      isNewborn: false,
      forcedSeedClass: 'talented',
    });
    for (const tid of talentedBundle.selectedTraitIds) {
      const def = getTraitDefinition(tid)!;
      assert.ok(
        def.tier <= 3,
        `C07: Talented seed (maxTier=3) selected tier ${def.tier} trait ${tid}`
      );
    }
  }
});

console.log('All Talent Generation & Awakening V3 regression tests (A05) passed!');
