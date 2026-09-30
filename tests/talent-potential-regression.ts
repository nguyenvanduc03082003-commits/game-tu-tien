import assert from 'node:assert/strict';
import { validatePotentialWeights } from '../src/config/talent.config.ts';
import {
  GrowthMindComponent,
  TalentProfileComponent,
} from '../src/modules/talent/TalentComponents.ts';
import {
  TraitInnateContributionInput,
  calculatePotential,
  calculatePotentialFromScores,
  calculateRootAptitudeBase,
  calculateTraitInnateDeltas,
  clampFinite,
  fromLegacyComprehensionValue,
  isFiniteScore,
  scoreFromXp,
  toLegacyComprehensionValue,
  xpForScore,
} from '../src/modules/talent/PotentialCalculator.ts';

let passed = 0;
function test(name: string, fn: () => void): void {
  fn();
  passed++;
  console.log('PASS talent-potential:', name);
}

test('P01-P05: mandatory potential formula examples (60.5, 55/45 split, +20 willpower = +5 potential)', () => {
  assert.equal(validatePotentialWeights(), true);

  const p01 = calculatePotentialFromScores({
    comprehension: 80,
    aptitude: 70,
    physique: 60,
    willpower: 40,
    mindset: 50,
  });
  assert.equal(p01.innateContribution, 40.5);
  assert.equal(p01.growthContribution, 20);
  assert.equal(p01.total, 60.5);
  assert.equal(p01.displayTotal, 60.5);
  assert.equal(p01.grade, 'excellent');

  const p05 = calculatePotentialFromScores({
    comprehension: 80,
    aptitude: 70,
    physique: 60,
    willpower: 60,
    mindset: 50,
  });
  assert.equal(p05.total, 65.5);
  assert.equal(p05.total - p01.total, 5);

  const p02 = calculatePotentialFromScores({
    comprehension: 100,
    aptitude: 100,
    physique: 100,
    willpower: 100,
    mindset: 100,
  });
  assert.equal(p02.total, 100);
  assert.equal(p02.grade, 'prodigy');

  const p03 = calculatePotentialFromScores({
    comprehension: 100,
    aptitude: 100,
    physique: 100,
    willpower: 0,
    mindset: 0,
  });
  assert.equal(p03.total, 55);
  assert.equal(p03.innateContribution, 55);
  assert.equal(p03.growthContribution, 0);

  const p04 = calculatePotentialFromScores({
    comprehension: 0,
    aptitude: 0,
    physique: 0,
    willpower: 100,
    mindset: 100,
  });
  assert.equal(p04.total, 45);
  assert.equal(p04.innateContribution, 0);
  assert.equal(p04.growthContribution, 45);

  const pZero = calculatePotentialFromScores({
    comprehension: 0,
    aptitude: 0,
    physique: 0,
    willpower: 0,
    mindset: 0,
  });
  assert.equal(pZero.total, 0);
  assert.equal(pZero.grade, 'ordinary');
});

test('P10: XP <-> Score curve milestones and roundtrip conversion', () => {
  const milestones: [number, number][] = [
    [0, 0],
    [10, 240],
    [25, 750],
    [50, 2000],
    [75, 3750],
    [100, 6000],
  ];
  for (const [score, xp] of milestones) {
    assert.equal(xpForScore(score), xp);
    assert.equal(scoreFromXp(xp), score);
  }
  // Capping beyond 6000 XP or below 0 XP
  assert.equal(scoreFromXp(9999), 100);
  assert.equal(scoreFromXp(-100), 0);

  // Roundtrip across 0..100
  for (let s = 0; s <= 100; s += 5) {
    const xp = xpForScore(s);
    const back = scoreFromXp(xp);
    assert.ok(Math.abs(back - s) < 1e-7);
  }
});

test('P06 & P12: mentalState and external factors do not alter potential P', () => {
  const profile = new TalentProfileComponent({
    base: { comprehension: 80, aptitude: 70, physique: 60 },
    knowledge: 'revealed',
  });
  const growth = new GrowthMindComponent({
    willpowerXp: xpForScore(40),
    mindsetXp: xpForScore(50),
    mentalState: 100,
  });

  const resHighMood = calculatePotential(profile, growth, []);
  growth.mentalState = -100;
  const resLowMood = calculatePotential(profile, growth, []);

  assert.equal(resHighMood.total, 60.5);
  assert.equal(resLowMood.total, 60.5);
});

test('P08 & P09: trait order independence, deduplication, diminishing returns, and primary root exclusion', () => {
  const traitsA: TraitInnateContributionInput[] = [
    { id: 'trait_b', origin: 'innate', innateDelta: { comprehension: 16, physique: 10 } },
    { id: 'trait_a', origin: 'innate', innateDelta: { comprehension: 16, physique: 20 } },
    { id: 'trait_neg', origin: 'innate', innateDelta: { physique: -8 } },
    { id: 'acquired_master', origin: 'acquired', innateDelta: { comprehension: 30 } },
    {
      id: 'thien_linh_can',
      origin: 'innate',
      innateDelta: { aptitude: 18.5 },
      primaryRootOverride: { rootType: 'heaven', purity: 100, elements: ['hoa'], qiRateFactor: 1.9 },
    },
  ];

  const traitsB: TraitInnateContributionInput[] = [
    ...traitsA.slice().reverse(),
    // Duplicate entry must be ignored
    { id: 'trait_a', origin: 'innate', innateDelta: { comprehension: 16, physique: 20 } },
  ];

  const deltaA = calculateTraitInnateDeltas(traitsA);
  const deltaB = calculateTraitInnateDeltas(traitsB);
  assert.deepEqual(deltaA, deltaB);

  // comprehension: 16 * 1 + 16 * 0.5 = 24 (acquired trait ignored)
  assert.equal(deltaA.comprehension, 24);
  // aptitude: primary root trait ignored -> 0
  assert.equal(deltaA.aptitude, 0);
  // physique: (20 * 1 + 10 * 0.5) + (-8 * 1) = 25 - 8 = 17
  assert.equal(deltaA.physique, 17);
});

test('P11: NaN and Infinity handling in clampFinite and calculator', () => {
  assert.equal(isFiniteScore(NaN), false);
  assert.equal(isFiniteScore(Infinity), false);
  assert.equal(isFiniteScore(-Infinity), false);
  assert.equal(isFiniteScore(0), true);

  assert.equal(clampFinite(NaN, 0, 100, 25), 25);
  assert.equal(clampFinite(Infinity, 0, 100, 0), 0);
  assert.equal(clampFinite(-Infinity, 0, 100, 0), 0);

  const profile = new TalentProfileComponent({
    base: { comprehension: NaN, aptitude: Infinity, physique: -50 },
    knowledge: 'unassessed',
  });
  const growth = new GrowthMindComponent({
    willpowerXp: NaN,
    mindsetXp: Infinity,
  });
  const res = calculatePotential(profile, growth, []);
  assert.equal(res.total, 0);
  assert.equal(res.assessmentComplete, false);
});

test('Root aptitude base calculation and legacy comprehension adapter (1000:1)', () => {
  assert.equal(calculateRootAptitudeBase('none', 90), 0);
  assert.equal(calculateRootAptitudeBase('impure', 25), 25);
  assert.equal(calculateRootAptitudeBase('true', 65), 61);
  assert.equal(calculateRootAptitudeBase('earth', 85), 85);
  assert.equal(calculateRootAptitudeBase('heaven', 100), 100);

  assert.equal(toLegacyComprehensionValue(50), 50000);
  assert.equal(toLegacyComprehensionValue(100), 100000);
  assert.equal(fromLegacyComprehensionValue(100000), 100);
  assert.equal(fromLegacyComprehensionValue(8000), 8);
});

test('LegacyPotentialAnchor prevents double counting traits at migration while allowing new changes', () => {
  const initialTraits: TraitInnateContributionInput[] = [
    { id: 'ngo_tinh_sieu_pham', origin: 'innate', innateDelta: { comprehension: 12 } },
  ];
  const migDelta = calculateTraitInnateDeltas(initialTraits);
  const profile = new TalentProfileComponent({
    knowledge: 'estimatedLegacy',
    legacyAnchor: {
      observedScores: { comprehension: 75, aptitude: 61, physique: 35 },
      traitDeltaAtMigration: migDelta,
    },
  });
  const growth = new GrowthMindComponent({
    willpowerXp: xpForScore(25),
    mindsetXp: xpForScore(20),
  });

  // Same traits as migration -> observedScores preserved exactly
  const resAtMig = calculatePotential(profile, growth, initialTraits);
  assert.equal(resAtMig.scores.comprehension, 75);

  // Foundation change after migration adds to comprehension
  profile.addFoundationChange({
    id: 'fc_1',
    eventId: 'evt_1',
    day: 100,
    delta: { comprehension: 5 },
    reason: 'Tẩy tủy dịch cân',
  });
  const resAfterFc = calculatePotential(profile, growth, initialTraits);
  assert.equal(resAfterFc.scores.comprehension, 80);
});

console.log(`${passed} talent-potential regression tests passed`);
