import assert from 'node:assert/strict';
import { TerrainType, TERRAIN_CONFIGS } from '../src/config/terrains.config.ts';
import {
  ANIMAL_SPECIES,
  ANIMAL_SPECIES_BY_GROUP,
  ANIMAL_SPECIES_LIST,
  getAnimalSpecies,
  hasAnimalSpecies,
  validateAnimalCatalog,
} from '../src/config/animals/animal.catalog.ts';
import { DOMESTIC_ANIMAL_SPECIES } from '../src/config/animals/species/domestic.animals.ts';
import { SMALL_MAMMAL_ANIMAL_SPECIES } from '../src/config/animals/species/small-mammals.animals.ts';
import { LARGE_MAMMAL_ANIMAL_SPECIES } from '../src/config/animals/species/large-mammals.animals.ts';
import { BIRD_ANIMAL_SPECIES } from '../src/config/animals/species/birds.animals.ts';
import { REPTILE_ANIMAL_SPECIES } from '../src/config/animals/species/reptiles.animals.ts';
import { YAO_SPECIES } from '../src/config/yao/yao-species.config.ts';
import { ARCHETYPE_DEFINITIONS } from '../src/config/archetypes.config.ts';
import { REALM_CHAINS } from '../src/config/realms.config.ts';

let passed = 0;
function test(name: string, fn: () => void): void {
  fn();
  passed++;
  console.log('PASS animal-catalog:', name);
}

test('validateAnimalCatalog succeeds and catalog has exactly 40 unique species across 5 groups (12+8+10+7+3)', () => {
  const report = validateAnimalCatalog();
  assert.equal(report.totalSpecies, 40);
  assert.equal(ANIMAL_SPECIES_LIST.length, 40, 'Catalog phải có đúng 40 loài động vật');

  const uniqueIds = new Set(ANIMAL_SPECIES_LIST.map(s => s.id));
  assert.equal(uniqueIds.size, 40, '40 loài động vật phải có ID duy nhất');
  assert.equal(Object.keys(ANIMAL_SPECIES).length, 40);

  assert.equal(DOMESTIC_ANIMAL_SPECIES.length, 12, 'Nhóm gia súc - gia cầm phải có 12 loài');
  assert.equal(SMALL_MAMMAL_ANIMAL_SPECIES.length, 8, 'Nhóm thú nhỏ phải có 8 loài');
  assert.equal(LARGE_MAMMAL_ANIMAL_SPECIES.length, 10, 'Nhóm thú vừa - lớn phải có 10 loài');
  assert.equal(BIRD_ANIMAL_SPECIES.length, 7, 'Nhóm chim hoang phải có 7 loài');
  assert.equal(REPTILE_ANIMAL_SPECIES.length, 3, 'Nhóm bò sát phải có 3 loài');

  assert.equal(ANIMAL_SPECIES_BY_GROUP.domestic.length, 12);
  assert.equal(ANIMAL_SPECIES_BY_GROUP.small_mammal.length, 8);
  assert.equal(ANIMAL_SPECIES_BY_GROUP.large_mammal.length, 10);
  assert.equal(ANIMAL_SPECIES_BY_GROUP.bird.length, 7);
  assert.equal(ANIMAL_SPECIES_BY_GROUP.reptile.length, 3);
});

test('all 40 species have valid land habitats, valid preySpeciesIds, finite positive numbers, and adultAgeYears < lifespanYears', () => {
  const validTerrains = new Set<string>(Object.values(TerrainType));
  const waterTerrains = new Set<TerrainType>([
    TerrainType.RIVER,
    TerrainType.LAKE,
    TerrainType.OCEAN,
  ]);

  for (const spec of ANIMAL_SPECIES_LIST) {
    assert.equal(hasAnimalSpecies(spec.id), true);
    assert.equal(getAnimalSpecies(spec.id).id, spec.id);

    assert.ok(spec.habitats.length > 0, `Loài ${spec.id} phải có ít nhất 1 habitat`);
    for (const h of spec.habitats) {
      assert.ok(validTerrains.has(h), `Loài ${spec.id} có habitat không hợp lệ: ${h}`);
      assert.ok(!waterTerrains.has(h), `Loài ${spec.id} không được sống ở ô nước: ${h}`);
      assert.ok(TERRAIN_CONFIGS[h] !== undefined);
    }

    for (const preyId of spec.preySpeciesIds) {
      assert.notEqual(preyId, spec.id, `Loài ${spec.id} không được tự săn chính mình`);
      assert.ok(
        preyId in ANIMAL_SPECIES,
        `Loài ${spec.id} có preySpeciesId "${preyId}" không tồn tại trong catalog`
      );
    }

    const positiveFields: Array<[string, number]> = [
      ['maxHealth', spec.maxHealth],
      ['moveSpeed', spec.moveSpeed],
      ['attack', spec.attack],
      ['adultAgeYears', spec.adultAgeYears],
      ['lifespanYears', spec.lifespanYears],
      ['reproductionCooldownDays', spec.reproductionCooldownDays],
      ['scale', spec.scale],
      ['spawnWeight', spec.spawnWeight],
    ];

    for (const [field, val] of positiveFields) {
      assert.equal(typeof val, 'number', `${spec.id}.${field} phải là số`);
      assert.ok(Number.isFinite(val) && val > 0, `${spec.id}.${field} phải hữu hạn và > 0 (nhận ${val})`);
    }

    assert.equal(typeof spec.defense, 'number', `${spec.id}.defense phải là số`);
    assert.ok(
      Number.isFinite(spec.defense) && spec.defense >= 0,
      `${spec.id}.defense phải hữu hạn và >= 0 (nhận ${spec.defense})`
    );

    assert.ok(
      spec.adultAgeYears < spec.lifespanYears,
      `${spec.id}: adultAgeYears (${spec.adultAgeYears}) phải nhỏ hơn lifespanYears (${spec.lifespanYears})`
    );
  }
});

test('no animal species contains any cultivation or yao fields, and getAnimalSpecies throws on invalid speciesId', () => {
  const forbiddenKeys = [
    'raceId',
    'realmChainId',
    'spiritualRoot',
    'comprehension',
    'qi',
    'maxQi',
    'technique',
    'traits',
    'talentProfile',
  ];

  for (const spec of ANIMAL_SPECIES_LIST) {
    const raw = spec as unknown as Record<string, unknown>;
    for (const key of forbiddenKeys) {
      assert.equal(raw[key], undefined, `Loài động vật ${spec.id} không được chứa trường tu luyện "${key}"`);
    }
  }

  assert.throws(
    () => getAnimalSpecies('not_a_real_species'),
    /Không tìm thấy loài động vật|không hợp lệ/
  );
});

test('Yao archetypes and beast_realms are cleanly separated from normal animals', () => {
  assert.ok(YAO_SPECIES.length > 0, 'Danh sách loài Yêu tộc phải tồn tại riêng');
  const archetypeIds = new Set(ARCHETYPE_DEFINITIONS.map(a => a.id));
  assert.equal(archetypeIds.has('yao_common'), true, 'Phải có archetype yao_common');
  assert.equal(archetypeIds.has('wild_beast'), false, 'Không còn archetype wild_beast');
  assert.equal(archetypeIds.has('awakened_beast'), false, 'Không còn archetype awakened_beast');

  const beastStages = REALM_CHAINS.beast_realms.stages;
  assert.equal(beastStages[0].name, 'Yêu Sinh');
  assert.equal(beastStages[1].name, 'Luyện Yêu');
  assert.equal(beastStages[2].name, 'Hóa Hình');
  assert.equal(beastStages[3].name, 'Kết Đan (Yêu Đan)');
});

console.log(`${passed} animal-catalog regression tests passed`);
