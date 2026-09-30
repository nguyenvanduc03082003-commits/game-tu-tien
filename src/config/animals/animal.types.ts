import { TerrainType } from '../terrains.config.ts';

export type AnimalSpeciesId = string;

export type AnimalSex = 'male' | 'female';

export type AnimalLifeStage = 'child' | 'adult' | 'elder';

export type AnimalAIState =
  | 'idle'
  | 'wander'
  | 'forage'
  | 'hunt'
  | 'eat'
  | 'flee'
  | 'dead';

export type AnimalGroup =
  | 'domestic'
  | 'small_mammal'
  | 'large_mammal'
  | 'bird'
  | 'reptile';

export const ANIMAL_GROUPS: readonly AnimalGroup[] = [
  'domestic',
  'small_mammal',
  'large_mammal',
  'bird',
  'reptile',
];

export type AnimalDiet = 'herbivore' | 'carnivore' | 'omnivore';

export type AnimalSizePreset = 'small' | 'medium' | 'large' | 'huge';

export type AnimalBodyShape =
  | 'quadruped'
  | 'small_mammal'
  | 'large_ungulate'
  | 'avian'
  | 'serpent'
  | 'shelled_reptile';

export interface AnimalSpeciesDefinition {
  // Định danh
  readonly id: AnimalSpeciesId;
  readonly name: string;
  readonly group: AnimalGroup;
  readonly description: string;

  // Sinh thái
  readonly diet: AnimalDiet;
  readonly habitats: readonly TerrainType[];
  readonly spawnWeight: number;
  readonly preySpeciesIds: readonly string[];

  // Chỉ số
  readonly maxHealth: number;
  readonly attack: number;
  readonly defense: number;
  readonly moveSpeed: number;

  // Vòng đời
  readonly lifespanYears: number;
  readonly adultAgeYears: number;
  readonly reproductionCooldownDays: number;

  // Ngoại hình
  readonly bodyShape: AnimalBodyShape;
  readonly primaryColor: string;
  readonly secondaryColor: string;
  readonly scale: number;
  readonly spriteDirectory: string;
}

export interface AnimalSpeciesSeedInput {
  readonly id: string;
  readonly name: string;
  readonly group: AnimalGroup;
  readonly description: string;
  readonly sizePreset: AnimalSizePreset;
  readonly diet: AnimalDiet;
  readonly habitats: readonly TerrainType[];
  readonly spawnWeight: number;
  readonly preySpeciesIds?: readonly string[];
  readonly maxHealth?: number;
  readonly attack?: number;
  readonly defense?: number;
  readonly moveSpeed?: number;
  readonly lifespanYears: number;
  readonly adultAgeYears: number;
  readonly reproductionCooldownDays: number;
  readonly bodyShape: AnimalBodyShape;
  readonly primaryColor: string;
  readonly secondaryColor: string;
  readonly scale?: number;
  readonly spriteDirectory?: string;
}
