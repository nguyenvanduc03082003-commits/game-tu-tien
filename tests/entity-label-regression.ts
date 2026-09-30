import assert from 'node:assert/strict';
import { ECSWorld } from '../src/ecs/World.ts';
import {
  NameComponent,
  RaceComponent,
  RealmComponent,
  SpiritualRootComponent,
  TraitsComponent,
} from '../src/modules/beings/BeingComponents.ts';
import {
  GrowthMindComponent,
  TalentProfileComponent,
} from '../src/modules/talent/TalentComponents.ts';
import { xpForScore } from '../src/modules/talent/PotentialCalculator.ts';
import {
  MAX_VISIBLE_CHARACTER_LABELS,
  selectVisibleCharacterLabels,
  shouldShowCharacterMapLabel,
  type CharacterLabelCandidate,
} from '../src/renderer/systems/EntityRenderer.ts';
import {
  escapeHtml,
  renderPotentialSummaryHtml,
  renderTraitBadgeHtml,
} from '../src/ui/InspectorPanel.ts';

const world = new ECSWorld();

function createResident(
  raceId: 'human' | 'beast' | 'demon',
  stageIndex: number,
  combatPower: number = 0,
  scores: {
    c: number;
    a: number;
    b: number;
    w: number;
    m: number;
    knowledge?: 'unassessed' | 'revealed' | 'estimatedLegacy';
    rootAwakened?: boolean;
  } = { c: 50, a: 50, b: 50, w: 20, m: 20, knowledge: 'revealed', rootAwakened: true }
): number {
  const entity = world.createEntity();
  world.addComponent(entity, new NameComponent(`Cư dân #${entity}`));
  world.addComponent(entity, new RaceComponent(raceId));
  world.addComponent(
    entity,
    new RealmComponent('human_realms', stageIndex, 'Cảnh giới', 'Sơ kỳ', 0, 100, combatPower)
  );
  world.addComponent(
    entity,
    new SpiritualRootComponent(
      scores.rootAwakened ?? true,
      'true',
      'Chân Linh Căn',
      ['kim', 'moc'],
      scores.a
    )
  );
  world.addComponent(
    entity,
    new TalentProfileComponent({
      base: {
        comprehension: scores.c,
        aptitude: scores.a,
        physique: scores.b,
      },
      knowledge: scores.knowledge ?? 'revealed',
      pendingRoot:
        scores.knowledge === 'unassessed' || scores.rootAwakened === false
          ? {
              rootType: 'heaven',
              purity: 100,
              elements: ['kim'],
              gradeName: 'Thiên Linh Căn Bí Ẩn',
            }
          : null,
    })
  );
  world.addComponent(
    entity,
    new GrowthMindComponent({
      willpowerXp: xpForScore(scores.w),
      mindsetXp: xpForScore(scores.m),
      mentalState: -24,
      recentGains: [
        {
          day: 10,
          willXp: 4,
          mindXp: 6,
          reason: 'Hóa giải thất bại đột phá.',
        },
      ],
    })
  );
  world.addComponent(entity, new TraitsComponent([]));
  return entity;
}

// 1. Cơ bản theo cảnh giới: Phàm nhân & Luyện Khí (combatPower cao) nhưng P < 80 không hiện nhãn
const mortal = createResident('human', 0, 10);
const qiRefiningHighPower = createResident('human', 1, 9000);
assert.equal(shouldShowCharacterMapLabel(world, mortal, 1.0), false);
assert.equal(
  shouldShowCharacterMapLabel(world, qiRefiningHighPower, 1.0),
  false,
  'High combat power alone is not a realm promotion'
);

// 2. U03: Stage 2 (Trúc Cơ / Hóa Hình / Ma Tướng) với P thấp vẫn hiện nhãn ở zoom >= 1.0
const foundationLowP = createResident('human', 2, 100, {
  c: 20,
  a: 20,
  b: 20,
  w: 10,
  m: 10,
});
const transformedBeast = createResident('beast', 2, 100, {
  c: 25,
  a: 25,
  b: 30,
  w: 10,
  m: 10,
});
const demonGeneral = createResident('demon', 2, 100, {
  c: 25,
  a: 25,
  b: 30,
  w: 10,
  m: 10,
});
for (const entity of [foundationLowP, transformedBeast, demonGeneral]) {
  assert.equal(shouldShowCharacterMapLabel(world, entity, 1.0), true, 'U03: Stage >= 2 shows label at zoom >= 1');
}

// 3. U01: Stage 1, P = 79.9 -> Không hiện nhãn
// P = 0.30*100 + 0.15*100 + 0.10*99 + 0.25*60 + 0.20*50 = 30 + 15 + 9.9 + 15 + 10 = 79.9
const stage1P799 = createResident('human', 1, 200, {
  c: 100,
  a: 100,
  b: 99,
  w: 60,
  m: 50,
});
assert.equal(
  shouldShowCharacterMapLabel(world, stage1P799, 1.0),
  false,
  'U01: Stage 1 with P = 79.9 must not show map label'
);

// 4. U02: Stage 1, P = 80.0 đã kiểm định -> Hiện nhãn ở zoom >= 1.0
// P = 0.30*100 + 0.15*100 + 0.10*100 + 0.25*60 + 0.20*50 = 30 + 15 + 10 + 15 + 10 = 80.0
const stage1P800 = createResident('human', 1, 200, {
  c: 100,
  a: 100,
  b: 100,
  w: 60,
  m: 50,
});
assert.equal(
  shouldShowCharacterMapLabel(world, stage1P800, 1.0),
  true,
  'U02: Stage 1 with P = 80.0 and assessmentComplete must show map label at zoom >= 1.0'
);

// 5. U04: Trẻ chưa kiểm định (knowledge = unassessed hoặc root chưa thức tỉnh), P thật >= 80 -> Không lộ qua nhãn hay Inspector
const unassessedChildHighP = createResident('human', 0, 50, {
  c: 100,
  a: 100,
  b: 100,
  w: 80,
  m: 80,
  knowledge: 'unassessed',
  rootAwakened: false,
});
assert.equal(
  shouldShowCharacterMapLabel(world, unassessedChildHighP, 1.0),
  false,
  'U04: Unassessed child with true P >= 80 must not leak via map label'
);
const unassessedHtml = renderPotentialSummaryHtml(world, unassessedChildHighP);
assert.equal(unassessedHtml.includes('Chưa đánh giá đầy đủ'), true, 'U04: Inspector shows unassessed status');
assert.equal(unassessedHtml.includes('Chưa thức tỉnh'), true, 'U04: Inspector hides unawakened aptitude');
assert.equal(unassessedHtml.includes('Thiên Linh Căn Bí Ẩn'), false, 'U04: Inspector must not leak pendingRoot');
assert.equal(unassessedHtml.includes('91.0'), false, 'U04: Inspector must not leak hidden total score');

// 6. U05: P cao hoặc Stage 2 nhưng zoom = 0.2 -> Không hiện nhãn
assert.equal(
  shouldShowCharacterMapLabel(world, stage1P800, 0.2),
  false,
  'U05: High P resident must not show label at zoom 0.2'
);
assert.equal(
  shouldShowCharacterMapLabel(world, foundationLowP, 0.2),
  false,
  'U05: Stage 2 resident must not show label at zoom 0.2'
);

// 7. Inspector fixture 60.5 (80/70/60/40/50) & Tier 5 badge
const fixture605 = createResident('human', 1, 150, {
  c: 80,
  a: 70,
  b: 60,
  w: 40,
  m: 50,
  knowledge: 'estimatedLegacy',
  rootAwakened: true,
});
const fixtureHtml = renderPotentialSummaryHtml(world, fixture605);
assert.equal(fixtureHtml.includes('60.5 / 100 — Ưu tú'), true, 'Inspector renders exact 60.5 total and grade');
assert.equal(fixtureHtml.includes('Ước tính từ dữ liệu cũ'), true, 'Inspector shows legacy estimation note');
assert.equal(fixtureHtml.includes('Đang lo âu (−24)'), true, 'Inspector renders mentalState separately from mindset');
assert.equal(
  fixtureHtml.includes('+4 XP ý chí') && fixtureHtml.includes('+6 XP tâm cảnh'),
  true,
  'Inspector distinguishes XP from score in recent gains'
);

const tier5Badge = renderTraitBadgeHtml('hon_don_dao_can', {
  id: 'hon_don_dao_can',
  origin: 'innate',
  acquiredAtDay: 0,
  state: 'active',
});
assert.equal(tier5Badge.includes('data-tier="5"'), true, 'Tier 5 badge includes tier 5 attribute');
assert.equal(tier5Badge.includes('Tiên Phẩm'), true, 'Tier 5 badge tooltip includes Tiên Phẩm');

// 8. U06: Tên/chuỗi chứa HTML độc hại bị escape an toàn, không thực thi
const maliciousRaw = `<img src=x onerror="alert('xss')"><script>window.__hacked=1</script>`;
const escaped = escapeHtml(maliciousRaw);
assert.equal(escaped.includes('<script>'), false, 'U06: Raw <script> tag must be escaped');
assert.equal(escaped.includes('<img'), false, 'U06: Raw <img> tag must be escaped');
assert.equal(escaped.includes('&lt;script&gt;'), true, 'U06: Escaped string preserves literal text');

const xssResident = createResident('human', 1, 100);
world.getComponent(xssResident, GrowthMindComponent)!.recentGains.push({
  day: 12,
  willXp: 2,
  mindXp: 1,
  reason: maliciousRaw,
});
const xssSummaryHtml = renderPotentialSummaryHtml(world, xssResident);
assert.equal(xssSummaryHtml.includes('<script>'), false, 'U06: Recent gain reason HTML is escaped');
assert.equal(xssSummaryHtml.includes('&lt;script&gt;'), true, 'U06: Recent gain reason shows escaped text');

// 9. Giới hạn 12 nhãn trên màn hình, ưu tiên selected -> realm -> potential -> entityId, tránh chồng lấn
const manyCandidates: CharacterLabelCandidate[] = [];
let selectedCandidateEntity = 0;
let highRealmCandidateEntity = 0;
for (let i = 1; i <= 20; i++) {
  const stageIdx = i === 15 ? 4 : 2;
  const ent = createResident('human', stageIdx, 100, {
    c: 60 + i,
    a: 60 + i,
    b: 60 + i,
    w: 50,
    m: 50,
  });
  if (i === 19) selectedCandidateEntity = ent;
  if (i === 15) highRealmCandidateEntity = ent;
  manyCandidates.push({
    entity: ent,
    screenX: i * 150, // Tách xa để không chồng lấn
    textY: 100,
  });
}
const selectedLabels = selectVisibleCharacterLabels(
  world,
  manyCandidates,
  selectedCandidateEntity,
  MAX_VISIBLE_CHARACTER_LABELS
);
assert.equal(selectedLabels.size, 12, 'Visible character labels capped at 12');
const orderedSelected = Array.from(selectedLabels);
assert.equal(orderedSelected[0], selectedCandidateEntity, 'Selected entity has highest priority');
assert.equal(orderedSelected[1], highRealmCandidateEntity, 'Higher realm entity has second highest priority');

const overlapEntA = createResident('human', 3, 100, { c: 85, a: 85, b: 85, w: 60, m: 60 });
const overlapEntB = createResident('human', 2, 100, { c: 80, a: 80, b: 80, w: 50, m: 50 });
const overlappingCandidates: CharacterLabelCandidate[] = [
  {
    entity: overlapEntA,
    screenX: 200,
    textY: 200,
  },
  {
    entity: overlapEntB,
    screenX: 210,
    textY: 202,
  },
];
const nonOverlapping = selectVisibleCharacterLabels(world, overlappingCandidates, null, 12);
assert.equal(nonOverlapping.size, 1, 'Overlapping lower-priority label is skipped');
assert.equal(nonOverlapping.has(overlapEntA), true);

console.log('PASS entity-label-regression: U01-U06, 60.5 inspector fixture, tier-5 badge, and 12-label cap verified');
