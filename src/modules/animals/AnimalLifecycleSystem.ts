import { TimeManager } from '../../core/TimeManager.ts';
import { getAnimalSpecies } from '../../config/animals/animal.catalog.ts';
import {
  ANIMAL_HUNGER_DECAY_PER_DAY,
  ANIMAL_HUNGER_STARVING_THRESHOLD,
  ANIMAL_STARVATION_DAMAGE_PER_DAY,
} from '../../config/animals/animal.simulation.ts';
import { System } from '../../ecs/System.ts';
import { ECSWorld } from '../../ecs/World.ts';
import {
  CharacterStateComponent,
  HealthComponent,
  HungerComponent,
  LifespanComponent,
} from '../beings/BeingComponents.ts';
import {
  AnimalBrainComponent,
  AnimalComponent,
} from './AnimalComponents.ts';
import { AnimalFactory } from './AnimalFactory.ts';
import { AnimalCarcassSystem } from './AnimalCarcassSystem.ts';

const DAYS_PER_YEAR =
  TimeManager.DAYS_PER_MONTH *
  TimeManager.MONTHS_PER_SEASON *
  TimeManager.SEASONS_PER_YEAR; // 360 ngày / năm

export class AnimalLifecycleSystem implements System {
  public name = 'AnimalLifecycleSystem';
  public enabled = true;
  public priority = 22;

  public reset(): void {
    // Trạng thái tuổi và độ đói lưu trực tiếp trên component của từng cá thể
  }

  public update(world: ECSWorld, dt: number): void {
    if (dt <= 0) return;

    const deltaDays =
      dt * (TimeManager.TICKS_PER_SECOND / TimeManager.TICKS_PER_DAY);
    const deltaYears = deltaDays / DAYS_PER_YEAR;

    const animals = world.query([
      AnimalComponent,
      HealthComponent,
      LifespanComponent,
      HungerComponent,
    ]);

    const diedEntities: number[] = [];

    for (const id of animals) {
      const hp = world.getComponent(id, HealthComponent)!;
      if (hp.isDead || hp.current <= 0) {
        hp.current = 0;
        hp.isDead = true;
        diedEntities.push(id);
        continue;
      }

      const animal = world.getComponent(id, AnimalComponent)!;
      const life = world.getComponent(id, LifespanComponent)!;
      const hunger = world.getComponent(id, HungerComponent)!;
      const brain = world.getComponent(id, AnimalBrainComponent);
      const stateComp = world.getComponent(id, CharacterStateComponent);
      const spec = getAnimalSpecies(animal.speciesId);

      // 1. Giảm thời gian hồi sinh sản
      if (animal.reproductionCooldownDays > 0) {
        animal.reproductionCooldownDays = Math.max(
          0,
          animal.reproductionCooldownDays - deltaDays
        );
      }

      // 2. Tăng tuổi liên tục theo phần ngày trong năm
      life.currentAge += deltaYears;
      const nextStage = AnimalFactory.computeLifeStage(life.currentAge, spec);
      animal.lifeStage = nextStage;
      life.isElderly = nextStage === 'elder';

      // Đạt 100% tuổi thọ -> chết tự nhiên
      if (life.currentAge >= life.maxLifespan) {
        hp.current = 0;
        hp.isDead = true;
        animal.causeOfDeath = 'old_age';
        if (brain) brain.state = 'dead';
        if (stateComp) stateComp.state = 'dead';
        diedEntities.push(id);
        continue;
      }

      // 3. Đói & suy kiệt
      hunger.current = Math.max(
        0,
        hunger.current - ANIMAL_HUNGER_DECAY_PER_DAY * deltaDays
      );
      hunger.isStarving = hunger.current < ANIMAL_HUNGER_STARVING_THRESHOLD;

      if (hunger.isStarving) {
        hp.current = Math.max(
          0,
          hp.current - ANIMAL_STARVATION_DAMAGE_PER_DAY * deltaDays
        );
        if (hp.current <= 0) {
          hp.current = 0;
          hp.isDead = true;
          animal.causeOfDeath = 'starvation';
          if (brain) brain.state = 'dead';
          if (stateComp) stateComp.state = 'dead';
          diedEntities.push(id);
          continue;
        }
      }
    }

    for (const deadId of diedEntities) {
      AnimalCarcassSystem.convertDeadAnimalToCarcass(world, deadId);
    }
  }
}
