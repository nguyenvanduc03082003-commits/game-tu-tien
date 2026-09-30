import { TimeManager } from '../../core/TimeManager.ts';
import { getAnimalSpecies } from '../../config/animals/animal.catalog.ts';
import {
  ANIMAL_CARCASS_BITE_HUNGER_GAIN,
  ANIMAL_CARCASS_DECAY_DAYS,
  ANIMAL_HUNGER_MAX,
} from '../../config/animals/animal.simulation.ts';
import { Entity } from '../../ecs/Entity.ts';
import { System } from '../../ecs/System.ts';
import { ECSWorld } from '../../ecs/World.ts';
import {
  HealthComponent,
  HungerComponent,
  NameComponent,
  PositionComponent,
} from '../beings/BeingComponents.ts';
import { CombatStatsComponent } from '../combat/CombatComponents.ts';
import {
  AnimalBrainComponent,
  AnimalCarcassComponent,
  AnimalComponent,
} from './AnimalComponents.ts';

export interface AnimalDeathStats {
  old_age: number;
  starvation: number;
  combat: number;
  hunted: number;
}

export class AnimalCarcassSystem implements System {
  public name = 'AnimalCarcassSystem';
  public enabled = true;
  public priority = 33;

  private static deathStats: AnimalDeathStats = {
    old_age: 0,
    starvation: 0,
    combat: 0,
    hunted: 0,
  };

  public static getDeathStats(): Readonly<AnimalDeathStats> {
    return { ...this.deathStats };
  }

  public static resetDeathStats(): void {
    this.deathStats = {
      old_age: 0,
      starvation: 0,
      combat: 0,
      hunted: 0,
    };
  }

  public reset(): void {
    AnimalCarcassSystem.resetDeathStats();
  }

  /**
   * Chuyển đổi một cá thể động vật đã chết thành thực thể xác động vật (AnimalCarcassComponent)
   * và xóa thực thể động vật đã chết khỏi ECSWorld.
   */
  public static convertDeadAnimalToCarcass(
    world: ECSWorld,
    deadEntityId: Entity,
    causeOverride?: 'old_age' | 'starvation' | 'combat' | 'hunted'
  ): Entity | null {
    const animal = world.getComponent(deadEntityId, AnimalComponent);
    if (!animal) return null;

    const cause = causeOverride ?? animal.causeOfDeath ?? 'combat';
    this.deathStats[cause] = (this.deathStats[cause] ?? 0) + 1;

    const pos = world.getComponent(deadEntityId, PositionComponent);
    const x = pos?.x ?? 0;
    const y = pos?.y ?? 0;

    const spec = getAnimalSpecies(animal.speciesId);
    const initialNutrition = Math.max(40, Math.round(spec.maxHealth * 1.4));

    const carcassEntity = world.createEntity();
    world.addComponent(carcassEntity, new PositionComponent(x, y, 0));
    world.addComponent(carcassEntity, new NameComponent(`Xác ${spec.name}`));
    world.addComponent(
      carcassEntity,
      new AnimalCarcassComponent(
        spec.id,
        initialNutrition,
        ANIMAL_CARCASS_DECAY_DAYS,
        cause
      )
    );

    // Chuyển các thú săn mồi đang săn con mồi này sang trạng thái ăn xác vừa hạ gục
    const hunters = world.query([AnimalBrainComponent]);
    for (const hId of hunters) {
      if (hId === deadEntityId) continue;
      const brain = world.getComponent(hId, AnimalBrainComponent)!;
      if (brain.targetEntityId === deadEntityId) {
        brain.state = 'eat';
        brain.targetEntityId = carcassEntity;
        brain.destinationX = x;
        brain.destinationY = y;
        const combat = world.getComponent(hId, CombatStatsComponent);
        if (combat && combat.targetEntityId === deadEntityId) {
          combat.targetEntityId = null;
        }
      }
    }

    world.destroyEntity(deadEntityId);
    return carcassEntity;
  }

  /**
   * Cho phép thú ăn thịt / ăn tạp tiêu thụ một khẩu phần hữu hạn từ xác động vật.
   * Mỗi phần thịt chỉ được tiêu thụ đúng một lần; khi hết dinh dưỡng xác sẽ bị xóa.
   */
  public static consumeCarcassPortion(
    world: ECSWorld,
    eaterEntityId: Entity,
    carcassEntityId: Entity,
    requestedAmount: number = ANIMAL_CARCASS_BITE_HUNGER_GAIN
  ): number {
    const carcass = world.getComponent(carcassEntityId, AnimalCarcassComponent);
    const hunger = world.getComponent(eaterEntityId, HungerComponent);
    if (!carcass || !hunger || carcass.remainingNutrition <= 0) {
      if (carcass && carcass.remainingNutrition <= 0) {
        world.destroyEntity(carcassEntityId);
      }
      return 0;
    }

    const needed = Math.max(0, ANIMAL_HUNGER_MAX - hunger.current);
    if (needed <= 0) return 0;

    const portion = Math.min(
      carcass.remainingNutrition,
      Math.max(1, requestedAmount),
      needed
    );

    carcass.remainingNutrition = Math.max(
      0,
      carcass.remainingNutrition - portion
    );
    hunger.current = Math.min(ANIMAL_HUNGER_MAX, hunger.current + portion);
    hunger.isStarving = hunger.current < 15;

    if (carcass.remainingNutrition <= 0) {
      world.destroyEntity(carcassEntityId);
    }

    return portion;
  }

  public update(world: ECSWorld, dt: number): void {
    const deltaDays =
      dt * (TimeManager.TICKS_PER_SECOND / TimeManager.TICKS_PER_DAY);

    // 1. Chuyển mọi động vật vừa chết (do chiến đấu, đói, già) thành xác động vật
    const animals = world.query([AnimalComponent, HealthComponent]);
    const deadAnimalIds: number[] = [];
    for (const id of animals) {
      const hp = world.getComponent(id, HealthComponent)!;
      if (hp.isDead || hp.current <= 0) {
        hp.current = 0;
        hp.isDead = true;
        deadAnimalIds.push(id);
      }
    }

    for (const deadId of deadAnimalIds) {
      AnimalCarcassSystem.convertDeadAnimalToCarcass(world, deadId);
    }

    // 2. Phân hủy xác động vật theo ngày và dọn các xác đã cạn dinh dưỡng / hết hạn 30 ngày
    const carcasses = world.query([AnimalCarcassComponent]);
    const toRemove: number[] = [];

    for (const carcassId of carcasses) {
      const carcass = world.getComponent(carcassId, AnimalCarcassComponent)!;
      carcass.decayRemainingDays -= deltaDays;
      if (
        carcass.remainingNutrition <= 0 ||
        carcass.decayRemainingDays <= 0
      ) {
        toRemove.push(carcassId);
      }
    }

    for (const carcassId of toRemove) {
      world.destroyEntity(carcassId);
    }
  }
}
