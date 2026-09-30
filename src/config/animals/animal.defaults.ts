import {
  AnimalSizePreset,
  AnimalSpeciesDefinition,
  AnimalSpeciesSeedInput,
} from './animal.types.ts';

export interface AnimalStatPreset {
  readonly maxHealth: number;
  readonly attack: number;
  readonly defense: number;
  readonly moveSpeed: number;
  readonly defaultScale: number;
}

/**
 * Bảng chỉ số mẫu theo mục 2 của đặc tả:
 * - Nhỏ (small): HP 20, Công 2, Thủ 0, Tốc độ 35
 * - Vừa (medium): HP 50, Công 6, Thủ 2, Tốc độ 40
 * - Lớn (large): HP 100, Công 12, Thủ 5, Tốc độ 35
 * - Rất lớn (huge): HP 200, Công 20, Thủ 10, Tốc độ 25
 */
export const ANIMAL_SIZE_PRESETS: Readonly<Record<AnimalSizePreset, AnimalStatPreset>> = {
  small: {
    maxHealth: 20,
    attack: 2,
    defense: 0,
    moveSpeed: 35,
    defaultScale: 0.75,
  },
  medium: {
    maxHealth: 50,
    attack: 6,
    defense: 2,
    moveSpeed: 40,
    defaultScale: 0.95,
  },
  large: {
    maxHealth: 100,
    attack: 12,
    defense: 5,
    moveSpeed: 35,
    defaultScale: 1.15,
  },
  huge: {
    maxHealth: 200,
    attack: 20,
    defense: 10,
    moveSpeed: 25,
    defaultScale: 1.4,
  },
};

export function createAnimalSpecies(
  input: AnimalSpeciesSeedInput
): AnimalSpeciesDefinition {
  const preset = ANIMAL_SIZE_PRESETS[input.sizePreset];
  return {
    id: input.id,
    name: input.name,
    group: input.group,
    description: input.description,
    diet: input.diet,
    habitats: [...input.habitats],
    spawnWeight: input.spawnWeight,
    preySpeciesIds: input.preySpeciesIds ? [...input.preySpeciesIds] : [],
    maxHealth: input.maxHealth ?? preset.maxHealth,
    attack: input.attack ?? preset.attack,
    defense: input.defense ?? preset.defense,
    moveSpeed: input.moveSpeed ?? preset.moveSpeed,
    lifespanYears: input.lifespanYears,
    adultAgeYears: input.adultAgeYears,
    reproductionCooldownDays: input.reproductionCooldownDays,
    bodyShape: input.bodyShape,
    primaryColor: input.primaryColor,
    secondaryColor: input.secondaryColor,
    scale: input.scale ?? preset.defaultScale,
    spriteDirectory:
      input.spriteDirectory ?? `assets/sprites/animals/${input.id}`,
  };
}
