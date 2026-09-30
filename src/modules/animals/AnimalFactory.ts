import { Entity } from '../../ecs/Entity.ts';
import { ECSWorld } from '../../ecs/World.ts';
import { getAnimalSpecies } from '../../config/animals/animal.catalog.ts';
import {
  ANIMAL_ELDER_AGE_RATIO,
  ANIMAL_HUNGER_MAX,
} from '../../config/animals/animal.simulation.ts';
import {
  AnimalLifeStage,
  AnimalSex,
  AnimalSpeciesDefinition,
  AnimalSpeciesId,
} from '../../config/animals/animal.types.ts';
import {
  AnimationComponent,
  CharacterStateComponent,
  HealthComponent,
  HungerComponent,
  LifespanComponent,
  NameComponent,
  PositionComponent,
} from '../beings/BeingComponents.ts';
import { CombatStatsComponent } from '../combat/CombatComponents.ts';
import {
  AnimalBrainComponent,
  AnimalComponent,
} from './AnimalComponents.ts';

export interface SpawnAnimalOptions {
  sex?: AnimalSex;
  age?: number;
  newborn?: boolean;
  lifeStage?: AnimalLifeStage;
  parentIds?: [number, number];
  reproductionCooldownDays?: number;
  hunger?: number;
  rng?: (() => number) | { next: () => number };
}

function resolveRng(rng?: (() => number) | { next: () => number }): () => number {
  if (!rng) return Math.random;
  if (typeof rng === 'function') return rng;
  return () => rng.next();
}

export class AnimalFactory {
  public static computeLifeStage(
    ageYears: number,
    spec: AnimalSpeciesDefinition
  ): AnimalLifeStage {
    if (ageYears < spec.adultAgeYears) {
      return 'child';
    }
    if (ageYears >= spec.lifespanYears * ANIMAL_ELDER_AGE_RATIO) {
      return 'elder';
    }
    return 'adult';
  }

  public static spawn(
    world: ECSWorld,
    speciesId: AnimalSpeciesId,
    x: number,
    y: number,
    options: SpawnAnimalOptions = {}
  ): Entity {
    const spec = getAnimalSpecies(speciesId);
    const rand = resolveRng(options.rng);

    const sex: AnimalSex =
      options.sex ?? (rand() < 0.5 ? 'male' : 'female');

    let currentAge: number;
    if (options.newborn) {
      currentAge = 0;
    } else if (typeof options.age === 'number' && Number.isFinite(options.age)) {
      currentAge = Math.max(0, options.age);
    } else {
      const minAdult = spec.adultAgeYears;
      const maxInitialAdult = Math.max(
        minAdult + 0.1,
        spec.lifespanYears * 0.55
      );
      currentAge = minAdult + rand() * Math.max(0, maxInitialAdult - minAdult);
    }

    const lifeStage: AnimalLifeStage =
      options.lifeStage ??
      (options.newborn ? 'child' : this.computeLifeStage(currentAge, spec));

    const cooldownDays =
      typeof options.reproductionCooldownDays === 'number' &&
      Number.isFinite(options.reproductionCooldownDays)
        ? Math.max(0, options.reproductionCooldownDays)
        : 0;

    const initialHunger =
      typeof options.hunger === 'number' && Number.isFinite(options.hunger)
        ? Math.max(0, Math.min(ANIMAL_HUNGER_MAX, options.hunger))
        : Math.min(ANIMAL_HUNGER_MAX, 70 + Math.floor(rand() * 26));

    const entity = world.createEntity();

    world.addComponent(entity, new PositionComponent(x, y, spec.moveSpeed));
    world.addComponent(entity, new NameComponent(spec.name));
    world.addComponent(
      entity,
      new AnimalComponent(
        spec.id,
        sex,
        lifeStage,
        cooldownDays,
        options.parentIds
      )
    );
    world.addComponent(entity, new AnimalBrainComponent('idle', 0, 0, null, null));
    world.addComponent(entity, new HealthComponent(spec.maxHealth));

    const lifespanComp = new LifespanComponent(currentAge, spec.lifespanYears);
    lifespanComp.isElderly = lifeStage === 'elder';
    world.addComponent(entity, lifespanComp);

    world.addComponent(entity, new HungerComponent(initialHunger));
    world.addComponent(
      entity,
      new CombatStatsComponent(
        spec.attack,
        spec.defense,
        0,
        1.0,
        0.05,
        0.05,
        1.5,
        22,
        false
      )
    );
    world.addComponent(entity, new CharacterStateComponent('idle', 'down'));
    world.addComponent(entity, new AnimationComponent(`animal_${spec.id}`));

    return entity;
  }

  public static createOffspring(
    world: ECSWorld,
    parentA: number,
    parentB: number,
    x?: number,
    y?: number,
    options: Omit<SpawnAnimalOptions, 'newborn' | 'age' | 'lifeStage' | 'parentIds'> = {}
  ): Entity {
    if (parentA === parentB) {
      throw new Error('Cha mẹ động vật phải là hai cá thể khác nhau!');
    }
    const animalA = world.getComponent(parentA, AnimalComponent);
    const animalB = world.getComponent(parentB, AnimalComponent);
    if (!animalA || !animalB) {
      throw new Error('Không thể sinh con động vật từ thực thể không có AnimalComponent!');
    }
    if (animalA.speciesId !== animalB.speciesId) {
      throw new Error(
        `Không thể lai tạo khác loài động vật: "${animalA.speciesId}" và "${animalB.speciesId}"!`
      );
    }

    const posA = world.getComponent(parentA, PositionComponent);
    const posB = world.getComponent(parentB, PositionComponent);
    const spawnX =
      typeof x === 'number' && Number.isFinite(x)
        ? x
        : posA && posB
          ? (posA.x + posB.x) / 2
          : posA?.x ?? 0;
    const spawnY =
      typeof y === 'number' && Number.isFinite(y)
        ? y
        : posA && posB
          ? (posA.y + posB.y) / 2
          : posA?.y ?? 0;

    return this.spawn(world, animalA.speciesId, spawnX, spawnY, {
      ...options,
      newborn: true,
      age: 0,
      lifeStage: 'child',
      parentIds: [parentA, parentB],
    });
  }
}
