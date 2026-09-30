import { getAnimalSpecies } from '../../config/animals/animal.catalog.ts';
import {
  ANIMAL_HUNGER_MIN_FOR_REPRODUCTION,
  ANIMAL_MAX_PER_SPECIES_POPULATION,
  ANIMAL_MAX_TOTAL_POPULATION,
  ANIMAL_REPRODUCTION_CHANCE_PER_PAIR,
  ANIMAL_REPRODUCTION_CHECK_INTERVAL_SECONDS,
  ANIMAL_REPRODUCTION_MAX_BIRTHS_PER_CHECK,
  ANIMAL_REPRODUCTION_MAX_DISTANCE_PX,
} from '../../config/animals/animal.simulation.ts';
import { AnimalSpeciesId } from '../../config/animals/animal.types.ts';
import { Entity } from '../../ecs/Entity.ts';
import { System } from '../../ecs/System.ts';
import { ECSWorld } from '../../ecs/World.ts';
import { AStarPathfinder } from '../ai/pathfinding/AStar.ts';
import {
  HealthComponent,
  HungerComponent,
  PositionComponent,
} from '../beings/BeingComponents.ts';
import { WorldMap } from '../world/WorldMap.ts';
import { AnimalBrainComponent, AnimalComponent } from './AnimalComponents.ts';
import { AnimalFactory } from './AnimalFactory.ts';
import { AnimalMovement } from './AnimalMovement.ts';

export class AnimalReproductionSystem implements System {
  public name = 'AnimalReproductionSystem';
  public enabled = true;
  public priority = 34;

  public worldMap: WorldMap;
  private checkAccumulator: number = 0;
  private rng: () => number;

  constructor(worldMap: WorldMap, rng: () => number = Math.random) {
    this.worldMap = worldMap;
    this.rng = rng;
  }

  public setRng(rng: () => number): void {
    this.rng = rng;
  }

  public reset(): void {
    this.checkAccumulator = 0;
  }

  public static areCloselyRelated(
    entityA: number,
    animalA: AnimalComponent,
    entityB: number,
    animalB: AnimalComponent
  ): boolean {
    if (entityA === entityB) return true;

    // Kiểm tra quan hệ cha/mẹ - con
    if (
      animalA.parentIds &&
      (animalA.parentIds[0] === entityB || animalA.parentIds[1] === entityB)
    ) {
      return true;
    }
    if (
      animalB.parentIds &&
      (animalB.parentIds[0] === entityA || animalB.parentIds[1] === entityA)
    ) {
      return true;
    }

    // Kiểm tra anh chị em ruột hoặc cùng cha/cùng mẹ
    if (animalA.parentIds && animalB.parentIds) {
      const [a0, a1] = animalA.parentIds;
      const [b0, b1] = animalB.parentIds;
      if (a0 === b0 || a0 === b1 || a1 === b0 || a1 === b1) {
        return true;
      }
    }

    return false;
  }

  public static canPairReproduce(
    world: ECSWorld,
    entityA: number,
    entityB: number
  ): boolean {
    if (entityA === entityB) return false;

    const animalA = world.getComponent(entityA, AnimalComponent);
    const animalB = world.getComponent(entityB, AnimalComponent);
    if (!animalA || !animalB) return false;

    if (animalA.speciesId !== animalB.speciesId) return false;
    if (animalA.sex === animalB.sex) return false;
    if (animalA.lifeStage !== 'adult' || animalB.lifeStage !== 'adult') {
      return false;
    }
    if (
      animalA.reproductionCooldownDays > 0 ||
      animalB.reproductionCooldownDays > 0
    ) {
      return false;
    }
    if (this.areCloselyRelated(entityA, animalA, entityB, animalB)) {
      return false;
    }

    const hpA = world.getComponent(entityA, HealthComponent);
    const hpB = world.getComponent(entityB, HealthComponent);
    if (!hpA || !hpB || hpA.isDead || hpB.isDead || hpA.current <= 0 || hpB.current <= 0) {
      return false;
    }

    const hungerA = world.getComponent(entityA, HungerComponent);
    const hungerB = world.getComponent(entityB, HungerComponent);
    if (
      !hungerA ||
      !hungerB ||
      hungerA.current < ANIMAL_HUNGER_MIN_FOR_REPRODUCTION ||
      hungerB.current < ANIMAL_HUNGER_MIN_FOR_REPRODUCTION
    ) {
      return false;
    }

    const brainA = world.getComponent(entityA, AnimalBrainComponent);
    const brainB = world.getComponent(entityB, AnimalBrainComponent);
    if (!brainA || !brainB) return false;
    if (
      (brainA.state !== 'idle' && brainA.state !== 'wander') ||
      (brainB.state !== 'idle' && brainB.state !== 'wander')
    ) {
      return false;
    }

    const posA = world.getComponent(entityA, PositionComponent);
    const posB = world.getComponent(entityB, PositionComponent);
    if (!posA || !posB) return false;

    const dist = Math.hypot(posA.x - posB.x, posA.y - posB.y);
    if (dist > ANIMAL_REPRODUCTION_MAX_DISTANCE_PX) {
      return false;
    }

    return true;
  }

  public update(world: ECSWorld, dt: number): void {
    this.checkAccumulator += dt;
    if (this.checkAccumulator < ANIMAL_REPRODUCTION_CHECK_INTERVAL_SECONDS) {
      return;
    }
    this.checkAccumulator %= ANIMAL_REPRODUCTION_CHECK_INTERVAL_SECONDS;
    this.runReproductionCheck(world);
  }

  public runReproductionCheck(
    world: ECSWorld,
    chanceOverride?: number
  ): Entity[] {
    const allAnimals = world.query([
      AnimalComponent,
      AnimalBrainComponent,
      PositionComponent,
      HealthComponent,
      HungerComponent,
    ]);

    let totalLiving = 0;
    const speciesCounts = new Map<AnimalSpeciesId, number>();
    const eligibleBySpecies = new Map<AnimalSpeciesId, number[]>();

    for (const id of allAnimals) {
      const hp = world.getComponent(id, HealthComponent)!;
      if (hp.isDead || hp.current <= 0) continue;

      const animal = world.getComponent(id, AnimalComponent)!;
      totalLiving++;
      speciesCounts.set(
        animal.speciesId,
        (speciesCounts.get(animal.speciesId) ?? 0) + 1
      );

      const hunger = world.getComponent(id, HungerComponent)!;
      const brain = world.getComponent(id, AnimalBrainComponent)!;

      if (
        animal.lifeStage === 'adult' &&
        animal.reproductionCooldownDays <= 0 &&
        hunger.current >= ANIMAL_HUNGER_MIN_FOR_REPRODUCTION &&
        (brain.state === 'idle' || brain.state === 'wander')
      ) {
        let list = eligibleBySpecies.get(animal.speciesId);
        if (!list) {
          list = [];
          eligibleBySpecies.set(animal.speciesId, list);
        }
        list.push(id);
      }
    }

    if (totalLiving >= ANIMAL_MAX_TOTAL_POPULATION) {
      return [];
    }

    const spawnedOffspring: Entity[] = [];
    const usedParents = new Set<number>();
    const blockedTiles = AStarPathfinder.getBlockedBuildingTiles(
      world,
      this.worldMap
    );
    const effectiveChance =
      typeof chanceOverride === 'number'
        ? chanceOverride
        : ANIMAL_REPRODUCTION_CHANCE_PER_PAIR;

    for (const [speciesId, candidates] of eligibleBySpecies.entries()) {
      if (
        spawnedOffspring.length >= ANIMAL_REPRODUCTION_MAX_BIRTHS_PER_CHECK ||
        totalLiving >= ANIMAL_MAX_TOTAL_POPULATION
      ) {
        break;
      }

      const currentSpeciesCount = speciesCounts.get(speciesId) ?? 0;
      if (currentSpeciesCount >= ANIMAL_MAX_PER_SPECIES_POPULATION) {
        continue;
      }

      for (let i = 0; i < candidates.length; i++) {
        const idA = candidates[i];
        if (usedParents.has(idA)) continue;

        for (let j = i + 1; j < candidates.length; j++) {
          const idB = candidates[j];
          if (usedParents.has(idB)) continue;

          if (!AnimalReproductionSystem.canPairReproduce(world, idA, idB)) {
            continue;
          }

          if (this.rng() >= effectiveChance) {
            continue;
          }

          const spawnPoint = this.findPassableSpawnPointNearParents(
            world,
            idA,
            idB,
            blockedTiles
          );
          if (!spawnPoint) {
            continue;
          }

          const spec = getAnimalSpecies(speciesId);
          const animalA = world.getComponent(idA, AnimalComponent)!;
          const animalB = world.getComponent(idB, AnimalComponent)!;

          const child = AnimalFactory.createOffspring(
            world,
            idA,
            idB,
            spawnPoint.x,
            spawnPoint.y,
            { rng: this.rng }
          );

          animalA.reproductionCooldownDays = spec.reproductionCooldownDays;
          animalB.reproductionCooldownDays = spec.reproductionCooldownDays;
          usedParents.add(idA);
          usedParents.add(idB);

          spawnedOffspring.push(child);
          totalLiving++;
          const updatedSpeciesCount = (speciesCounts.get(speciesId) ?? 0) + 1;
          speciesCounts.set(speciesId, updatedSpeciesCount);

          break;
        }

        if (
          spawnedOffspring.length >= ANIMAL_REPRODUCTION_MAX_BIRTHS_PER_CHECK ||
          totalLiving >= ANIMAL_MAX_TOTAL_POPULATION ||
          (speciesCounts.get(speciesId) ?? 0) >= ANIMAL_MAX_PER_SPECIES_POPULATION
        ) {
          break;
        }
      }
    }

    return spawnedOffspring;
  }

  private findPassableSpawnPointNearParents(
    world: ECSWorld,
    parentA: number,
    parentB: number,
    blockedTiles: Set<number>
  ): { x: number; y: number } | null {
    const posA = world.getComponent(parentA, PositionComponent);
    const posB = world.getComponent(parentB, PositionComponent);
    if (!posA || !posB) return null;

    const midX = (posA.x + posB.x) / 2;
    const midY = (posA.y + posB.y) / 2;

    const candidates: Array<{ x: number; y: number }> = [
      { x: midX, y: midY },
      { x: posA.x, y: posA.y },
      { x: posB.x, y: posB.y },
      { x: midX + 12, y: midY },
      { x: midX - 12, y: midY },
      { x: midX, y: midY + 12 },
      { x: midX, y: midY - 12 },
    ];

    for (const pt of candidates) {
      if (
        AnimalMovement.isPixelWalkable(
          world,
          this.worldMap,
          pt.x,
          pt.y,
          blockedTiles
        )
      ) {
        return pt;
      }
    }

    return null;
  }
}
