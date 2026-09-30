import { ANIMAL_PASSABLE_TERRAINS, ANIMAL_WATER_TERRAINS } from './animal.simulation.ts';
import { AnimalGroup, AnimalSpeciesDefinition } from './animal.types.ts';
import { BIRD_ANIMAL_SPECIES } from './species/birds.animals.ts';
import { DOMESTIC_ANIMAL_SPECIES } from './species/domestic.animals.ts';
import { LARGE_MAMMAL_ANIMAL_SPECIES } from './species/large-mammals.animals.ts';
import { REPTILE_ANIMAL_SPECIES } from './species/reptiles.animals.ts';
import { SMALL_MAMMAL_ANIMAL_SPECIES } from './species/small-mammals.animals.ts';

export const ANIMAL_SPECIES_LIST: readonly AnimalSpeciesDefinition[] = [
  ...DOMESTIC_ANIMAL_SPECIES,
  ...SMALL_MAMMAL_ANIMAL_SPECIES,
  ...LARGE_MAMMAL_ANIMAL_SPECIES,
  ...BIRD_ANIMAL_SPECIES,
  ...REPTILE_ANIMAL_SPECIES,
];

export const ANIMAL_SPECIES: Readonly<Record<string, AnimalSpeciesDefinition>> = Object.freeze(
  Object.fromEntries(ANIMAL_SPECIES_LIST.map(s => [s.id, Object.freeze(s)]))
);

export const ANIMAL_SPECIES_BY_GROUP: Readonly<Record<AnimalGroup, readonly AnimalSpeciesDefinition[]>> = Object.freeze({
  domestic: DOMESTIC_ANIMAL_SPECIES,
  small_mammal: SMALL_MAMMAL_ANIMAL_SPECIES,
  large_mammal: LARGE_MAMMAL_ANIMAL_SPECIES,
  bird: BIRD_ANIMAL_SPECIES,
  reptile: REPTILE_ANIMAL_SPECIES,
});

export function hasAnimalSpecies(speciesId: string): boolean {
  return typeof speciesId === 'string' && Object.prototype.hasOwnProperty.call(ANIMAL_SPECIES, speciesId);
}

/**
 * Tra cứu định nghĩa loài động vật theo ID.
 * Báo lỗi rõ ràng nếu ID không tồn tại; tuyệt đối không tự chuyển thành sói, nhân tộc hay yêu tộc.
 */
export function getAnimalSpecies(speciesId: string): AnimalSpeciesDefinition {
  if (typeof speciesId !== 'string' || !speciesId.trim()) {
    throw new Error(`ID loài động vật không hợp lệ: [${String(speciesId)}]`);
  }
  const found = ANIMAL_SPECIES[speciesId];
  if (!found) {
    throw new Error(`Không tìm thấy loài động vật có ID "${speciesId}" trong ANIMAL_SPECIES!`);
  }
  return found;
}

export interface AnimalCatalogValidationReport {
  readonly totalSpecies: number;
  readonly groupCounts: Record<AnimalGroup, number>;
}

const FORBIDDEN_CULTIVATION_KEYS = [
  'qi',
  'maxQi',
  'currentQi',
  'spiritualRoot',
  'rootType',
  'realm',
  'realmChainId',
  'stageIndex',
  'comprehension',
  'aptitude',
  'lineage',
  'lineageTags',
  'bloodline',
] as const;

export function validateAnimalCatalog(
  speciesList: readonly AnimalSpeciesDefinition[] = ANIMAL_SPECIES_LIST
): AnimalCatalogValidationReport {
  if (!Array.isArray(speciesList) || speciesList.length !== 40) {
    throw new Error(
      `Danh mục động vật phải có đúng 40 loài, hiện có: ${speciesList?.length ?? 0}`
    );
  }

  const seenIds = new Set<string>();
  const byId = new Map<string, AnimalSpeciesDefinition>();
  const groupCounts: Record<AnimalGroup, number> = {
    domestic: 0,
    small_mammal: 0,
    large_mammal: 0,
    bird: 0,
    reptile: 0,
  };

  for (const sp of speciesList) {
    if (!sp || typeof sp !== 'object') {
      throw new Error('Phát hiện bản ghi loài động vật rỗng hoặc không hợp lệ!');
    }
    if (!sp.id || typeof sp.id !== 'string' || !/^[a-z][a-z0-9_]*$/.test(sp.id)) {
      throw new Error(`ID loài động vật không hợp lệ: "${String(sp.id)}"`);
    }
    if (seenIds.has(sp.id)) {
      throw new Error(`Trùng ID loài động vật: "${sp.id}"`);
    }
    seenIds.add(sp.id);
    byId.set(sp.id, sp);

    for (const forbidden of FORBIDDEN_CULTIVATION_KEYS) {
      if (forbidden in (sp as unknown as Record<string, unknown>)) {
        throw new Error(
          `Loài động vật "${sp.id}" chứa trường tu luyện/yêu tộc bị cấm: "${forbidden}"`
        );
      }
    }

    if (!sp.name || typeof sp.name !== 'string') {
      throw new Error(`Loài "${sp.id}" thiếu tên hiển thị!`);
    }
    if (!sp.description || typeof sp.description !== 'string') {
      throw new Error(`Loài "${sp.id}" thiếu mô tả!`);
    }
    const grp = sp.group as AnimalGroup;
    if (!(grp in groupCounts)) {
      throw new Error(`Loài "${sp.id}" có group không hợp lệ: "${String(grp)}"`);
    }
    groupCounts[grp] += 1;

    if (sp.diet !== 'herbivore' && sp.diet !== 'carnivore' && sp.diet !== 'omnivore') {
      throw new Error(`Loài "${sp.id}" có diet không hợp lệ: "${String(sp.diet)}"`);
    }

    if (!Array.isArray(sp.habitats) || sp.habitats.length === 0) {
      throw new Error(`Loài "${sp.id}" phải có ít nhất 1 sinh cảnh (habitat)!`);
    }
    for (const hab of sp.habitats) {
      if (ANIMAL_WATER_TERRAINS.includes(hab)) {
        throw new Error(`Loài trên cạn "${sp.id}" không được có sinh cảnh mặt nước: "${hab}"`);
      }
      if (!ANIMAL_PASSABLE_TERRAINS.includes(hab)) {
        throw new Error(`Loài "${sp.id}" có sinh cảnh không hợp lệ: "${String(hab)}"`);
      }
    }

    const numericFields: [string, number, number][] = [
      ['spawnWeight', sp.spawnWeight, 0.0001],
      ['maxHealth', sp.maxHealth, 1],
      ['attack', sp.attack, 0],
      ['defense', sp.defense, 0],
      ['moveSpeed', sp.moveSpeed, 1],
      ['lifespanYears', sp.lifespanYears, 0.5],
      ['adultAgeYears', sp.adultAgeYears, 0.1],
      ['reproductionCooldownDays', sp.reproductionCooldownDays, 1],
      ['scale', sp.scale, 0.1],
    ];
    for (const [field, val, minVal] of numericFields) {
      if (typeof val !== 'number' || !Number.isFinite(val) || val < minVal) {
        throw new Error(
          `Loài "${sp.id}" có chỉ số "${field}" không hợp lệ hoặc không hữu hạn: ${String(val)}`
        );
      }
    }

    if (sp.adultAgeYears >= sp.lifespanYears) {
      throw new Error(
        `Loài "${sp.id}" có adultAgeYears (${sp.adultAgeYears}) >= lifespanYears (${sp.lifespanYears})!`
      );
    }

    if (!sp.spriteDirectory || typeof sp.spriteDirectory !== 'string') {
      throw new Error(`Loài "${sp.id}" thiếu spriteDirectory!`);
    }
  }

  // Kiểm tra tham chiếu con mồi sau khi đã thu thập đủ 40 ID
  for (const sp of speciesList) {
    if (!Array.isArray(sp.preySpeciesIds)) {
      throw new Error(`Loài "${sp.id}" có preySpeciesIds không phải mảng!`);
    }
    if (sp.diet === 'herbivore' && sp.preySpeciesIds.length > 0) {
      throw new Error(`Loài ăn cỏ "${sp.id}" không được khai báo preySpeciesIds!`);
    }
    if (sp.diet === 'carnivore' && sp.preySpeciesIds.length === 0) {
      throw new Error(`Loài ăn thịt "${sp.id}" phải có ít nhất 1 loài con mồi trong preySpeciesIds!`);
    }
    for (const preyId of sp.preySpeciesIds) {
      if (preyId === sp.id) {
        throw new Error(`Loài "${sp.id}" không được săn chính loài của mình!`);
      }
      if (!byId.has(preyId)) {
        throw new Error(
          `Loài "${sp.id}" khai báo con mồi "${preyId}" không tồn tại trong ANIMAL_SPECIES!`
        );
      }
    }
  }

  return {
    totalSpecies: speciesList.length,
    groupCounts,
  };
}

// Tự động kiểm tra ngay khi nạp module để phát hiện lỗi dữ liệu sớm
validateAnimalCatalog();
