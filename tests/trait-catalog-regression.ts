import assert from 'node:assert/strict';
import { PRIMARY_ROOT_TRAIT_IDS } from '../src/config/talent.config.ts';
import { LEGACY_TRAIT_DEFINITIONS_SNAPSHOT } from '../src/config/traits/legacy-traits.config.ts';
import {
  ALL_TRAITS_LIST_V3,
  SOURCE_300_TRAITS_LIST,
  V3_TRAIT_CATALOG,
  areTraitsConflictingV3,
  getCatalogCoverageReport,
  getTraitDefinition,
  resolveTraitId,
  validateTraitCatalog,
} from '../src/modules/traits/TraitCatalog.ts';

let passed = 0;
function test(name: string, fn: () => void): void {
  fn();
  passed++;
  console.log('PASS trait-catalog:', name);
}

test('C01: catalog has 300 distinct V3 IDs across tiers 1-5 plus 8 legacyOnly entries and 105 legacy snapshot', () => {
  const validation = validateTraitCatalog();
  assert.equal(validation.valid, true, `Catalog validation failed: ${validation.errors.join('; ')}`);

  const report = getCatalogCoverageReport();
  assert.equal(report.sourceCount, 300);
  assert.equal(report.legacyOnlyCount, 8);
  assert.equal(Object.keys(LEGACY_TRAIT_DEFINITIONS_SNAPSHOT).length, 105);

  assert.deepEqual(report.byRace, { all: 186, human: 24, beast: 45, demon: 45 });
  assert.deepEqual(report.byOrigin, {
    innate: 221,
    acquired: 43,
    reincarnation: 3,
    lineage: 33,
  });

  // Tiers 1..5 all populated
  for (const tier of [1, 2, 3, 4, 5] as const) {
    assert.ok(report.byTier[tier] > 0, `Tier ${tier} should have traits`);
  }
});

test('C02 & Section 4.3: all 21 profession traits are in common pool with capability requirements', () => {
  const profTraits = SOURCE_300_TRAITS_LIST.filter(d => d.dimension === 'profession');
  assert.equal(profTraits.length, 21);
  for (const pt of profTraits) {
    assert.equal(pt.allowedRaces, 'all', `${pt.id} should have allowedRaces='all'`);
    assert.ok(
      pt.activation.some(c => c.kind === 'capability' && c.key === 'canLearnProfession'),
      `${pt.id} should require canLearnProfession`
    );
  }
});

test('Section 4.5 & C08: 18 primary_root traits have primaryRootOverride, exclusiveGroup primary_root, and no innateDelta.aptitude', () => {
  assert.equal(PRIMARY_ROOT_TRAIT_IDS.length, 18);
  for (const id of PRIMARY_ROOT_TRAIT_IDS) {
    const def = V3_TRAIT_CATALOG[id];
    assert.ok(def, `Missing primary root trait ${id}`);
    assert.ok(def.primaryRootOverride, `${id} missing primaryRootOverride`);
    assert.ok(def.exclusiveGroups.includes('primary_root'), `${id} missing primary_root group`);
    assert.equal(def.innateDelta.aptitude, undefined, `${id} must not double count aptitude delta`);
  }
  assert.equal(areTraitsConflictingV3('thien_linh_can', 'hon_don_dao_can'), true);
});

test('Section A.2 & S09: kim_giac_te_huyet alias and an_linh_can vs bien_di_am_linh_can semantic separation', () => {
  assert.equal(resolveTraitId('kim_giac_tê_huyet'), 'kim_giac_te_huyet');
  assert.equal(getTraitDefinition('kim_giac_tê_huyet')?.id, 'kim_giac_te_huyet');

  const oldHiddenRoot = getTraitDefinition('an_linh_can');
  const darkMutatedRoot = getTraitDefinition('bien_di_am_linh_can');
  assert.ok(oldHiddenRoot);
  assert.ok(darkMutatedRoot);
  assert.equal(oldHiddenRoot.name, 'Ẩn Linh Căn');
  assert.equal(oldHiddenRoot.implementation, 'legacyOnly');
  assert.equal(darkMutatedRoot.name, 'Biến Dị Ám Linh Căn');
  assert.equal(darkMutatedRoot.implementation, 'active');
  assert.notEqual(resolveTraitId('an_linh_can'), 'bien_di_am_linh_can');
});

test('Section 6.3 & A.3: mandatory vector and origin overrides are enforced', () => {
  assert.equal(V3_TRAIT_CATALOG['mu_tit_dan_dao'].learningAffinity.profession, -6);
  assert.deepEqual(V3_TRAIT_CATALOG['mu_tit_dan_dao'].innateDelta, {});
  assert.deepEqual(V3_TRAIT_CATALOG['tam_tinh_nong_noi'].innateDelta, {});
  assert.deepEqual(V3_TRAIT_CATALOG['tat_nguyen_bam_sinh'].innateDelta, {});
  assert.equal(V3_TRAIT_CATALOG['doan_menh_chi_tuong'].innateDelta.physique, undefined);
  assert.equal(V3_TRAIT_CATALOG['khi_huyet_hu_nhuoc'].innateDelta.physique, undefined);
  assert.equal(V3_TRAIT_CATALOG['y_chi_bac_nhuoc'].innateDelta.comprehension, undefined);
  assert.deepEqual(V3_TRAIT_CATALOG['kinh_nghiem_non_not'].innateDelta, {});
  assert.equal(V3_TRAIT_CATALOG['can_cu_bu_thong_minh'].innateDelta.comprehension, undefined);

  assert.equal(V3_TRAIT_CATALOG['van_co_dao_tam'].origin, 'acquired');
  assert.equal(V3_TRAIT_CATALOG['thien_nhan_hop_nhat'].origin, 'acquired');
  assert.equal(V3_TRAIT_CATALOG['hoa_hinh_hoan_my'].origin, 'acquired');
  assert.equal(V3_TRAIT_CATALOG['yeu_dan_tinh_thuan'].origin, 'acquired');
  assert.equal(V3_TRAIT_CATALOG['tu_la_chien_the'].origin, 'lineage');
  assert.equal(V3_TRAIT_CATALOG['cuu_vi_thien_ho'].origin, 'lineage');
  assert.equal(V3_TRAIT_CATALOG['van_ma_trieu_tong'].origin, 'lineage');
});

test('C09 & C10: validator rejects evolution cycles and ensures planned/acquired traits do not spawn in innate pool', () => {
  for (const def of ALL_TRAITS_LIST_V3) {
    if (def.implementation !== 'active' || def.origin === 'acquired') {
      assert.equal(def.spawnWeight, 0, `${def.id} must have spawnWeight=0`);
    }
    if (def.implementation === 'active') {
      assert.equal(
        def.unmappedEffectKeys?.length ?? 0,
        0,
        `Active trait ${def.id} must not have unmappedEffectKeys`
      );
    }
  }

  // Test cycle detection in validator
  const sampleA = { ...V3_TRAIT_CATALOG['kinh_nghiem_non_not'], id: 'cycle_a', evolvesFrom: 'cycle_b' };
  const sampleB = { ...V3_TRAIT_CATALOG['bach_chien_bat_bai'], id: 'cycle_b', evolvesFrom: 'cycle_a' };
  const res = validateTraitCatalog([sampleA, sampleB]);
  assert.equal(res.valid, false);
  assert.ok(res.errors.some(e => e.includes('Evolution cycle')));
});

console.log(`${passed} trait-catalog regression tests passed`);
