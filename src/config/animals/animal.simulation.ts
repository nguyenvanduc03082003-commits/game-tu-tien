import { TerrainType } from '../terrains.config.ts';
import { AnimalGroup } from './animal.types.ts';

export const ANIMAL_AI_DECISION_INTERVAL_SECONDS = 0.5;

export const ANIMAL_HUNGER_MAX = 100;
export const ANIMAL_HUNGER_SEEK_FOOD_THRESHOLD = 45;
export const ANIMAL_HUNGER_SATIATED_THRESHOLD = 80;
export const ANIMAL_HUNGER_STARVING_THRESHOLD = 15;
export const ANIMAL_HUNGER_MIN_FOR_REPRODUCTION = 50;

export const ANIMAL_HUNGER_DECAY_PER_DAY = 18;
export const ANIMAL_STARVATION_DAMAGE_PER_DAY = 12;
export const ANIMAL_FORAGE_HUNGER_GAIN_PER_SECOND = 22;
export const ANIMAL_CARCASS_BITE_HUNGER_GAIN = 35;

export const ANIMAL_ELDER_AGE_RATIO = 0.9;
export const ANIMAL_CHILD_SCALE_FACTOR = 0.68;

export const ANIMAL_REPRODUCTION_CHECK_INTERVAL_SECONDS = 5.0;
export const ANIMAL_REPRODUCTION_CHANCE_PER_PAIR = 0.04;
export const ANIMAL_REPRODUCTION_MAX_BIRTHS_PER_CHECK = 2;
export const ANIMAL_REPRODUCTION_MAX_DISTANCE_PX = 48;

export const ANIMAL_MAX_TOTAL_POPULATION = 300;
export const ANIMAL_MAX_PER_SPECIES_POPULATION = 30;

export const ANIMAL_SPAWN_MAX_ATTEMPT_MULTIPLIER = 25;
export const YAO_NATURAL_SPAWN_FAUNA_RATIO = 0.2;

export const INITIAL_ANIMAL_BUDGET_MIN = 4;
export const INITIAL_ANIMAL_BUDGET_MAX = 70;

export function calculateInitialFaunaBudget(width: number, height: number): number {
  const area = width * height;
  if (area <= 256) {
    return Math.min(6, Math.max(3, Math.floor(area / 50)));
  }
  const calculated = Math.floor(10 + Math.sqrt(area) * 0.14);
  return Math.max(INITIAL_ANIMAL_BUDGET_MIN, Math.min(INITIAL_ANIMAL_BUDGET_MAX, calculated));
}

// Danh sách dự phòng tương thích ngược. Khởi tạo thế giới mới dùng calculateInitialFaunaBudget và pool sinh cảnh.
export const INITIAL_WORLD_ANIMALS: ReadonlyArray<{ speciesId: string; count: number }> = [
  { speciesId: 'rabbit', count: 4 },
  { speciesId: 'field_rat', count: 4 },
  { speciesId: 'spotted_deer', count: 3 },
  { speciesId: 'fox', count: 2 },
  { speciesId: 'wolf', count: 2 },
];

export const ANIMAL_CARCASS_DECAY_DAYS = 30;
export const ANIMAL_PATH_RETRY_COOLDOWN_SECONDS = 2.0;
export const ANIMAL_FLEE_SEARCH_RADIUS_PX = 160;
export const ANIMAL_HUNT_SEARCH_RADIUS_PX = 240;
export const ANIMAL_WANDER_RADIUS_PX = 96;
export const ANIMAL_EAT_RANGE_PX = 26;

export const ANIMAL_PASSABLE_TERRAINS: readonly TerrainType[] = [
  TerrainType.PLAIN,
  TerrainType.HILL,
  TerrainType.MOUNTAIN,
  TerrainType.SWAMP,
  TerrainType.PLATEAU,
  TerrainType.DENSE_FOREST,
];

export const ANIMAL_WATER_TERRAINS: readonly TerrainType[] = [
  TerrainType.RIVER,
  TerrainType.LAKE,
  TerrainType.OCEAN,
];

export const ANIMAL_GROUP_LABELS: Readonly<Record<AnimalGroup, string>> = {
  domestic: 'Gia súc & Gia cầm',
  small_mammal: 'Thú nhỏ',
  large_mammal: 'Thú lớn',
  bird: 'Chim chóc',
  reptile: 'Bò sát',
};
