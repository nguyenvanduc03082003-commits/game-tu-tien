import { Component } from '../../ecs/Component.ts';
import {
  AnimalAIState,
  AnimalLifeStage,
  AnimalSex,
  AnimalSpeciesId,
} from '../../config/animals/animal.types.ts';

export type { AnimalAIState, AnimalLifeStage, AnimalSex, AnimalSpeciesId };

export class AnimalComponent implements Component {
  public speciesId: AnimalSpeciesId;
  public sex: AnimalSex;
  public lifeStage: AnimalLifeStage;
  public parentIds?: [number, number];
  public reproductionCooldownDays: number;
  public causeOfDeath?: 'old_age' | 'starvation' | 'combat' | 'hunted';

  constructor(
    speciesId: AnimalSpeciesId,
    sex: AnimalSex = 'male',
    lifeStage: AnimalLifeStage = 'adult',
    reproductionCooldownDays: number = 0,
    parentIds?: [number, number],
    causeOfDeath?: 'old_age' | 'starvation' | 'combat' | 'hunted'
  ) {
    this.speciesId = speciesId;
    this.sex = sex;
    this.lifeStage = lifeStage;
    this.reproductionCooldownDays = Math.max(0, reproductionCooldownDays);
    if (parentIds) {
      this.parentIds = [parentIds[0], parentIds[1]];
    }
    this.causeOfDeath = causeOfDeath;
  }
}

export class AnimalBrainComponent implements Component {
  public state: AnimalAIState;
  public decisionTimer: number;
  public actionTimer: number;
  public targetEntityId: number | null;
  public threatEntityId: number | null;
  public destinationX?: number;
  public destinationY?: number;

  // Bộ đệm đường đi runtime (không cần ghi cố định nếu rỗng)
  public path: Array<{ x: number; y: number }> = [];
  public pathIndex: number = 0;
  public pathRetryCooldown: number = 0;

  constructor(
    state: AnimalAIState = 'idle',
    decisionTimer: number = 0,
    actionTimer: number = 0,
    targetEntityId: number | null = null,
    threatEntityId: number | null = null,
    destinationX?: number,
    destinationY?: number
  ) {
    this.state = state;
    this.decisionTimer = decisionTimer;
    this.actionTimer = actionTimer;
    this.targetEntityId = targetEntityId;
    this.threatEntityId = threatEntityId;
    this.destinationX = destinationX;
    this.destinationY = destinationY;
  }

  public clearMovementTarget(): void {
    this.destinationX = undefined;
    this.destinationY = undefined;
    this.path = [];
    this.pathIndex = 0;
  }
}

export class AnimalCarcassComponent implements Component {
  public speciesId: AnimalSpeciesId;
  public remainingNutrition: number;
  public decayRemainingDays: number;
  public causeOfDeath?: 'old_age' | 'starvation' | 'combat' | 'hunted';

  constructor(
    speciesId: AnimalSpeciesId,
    remainingNutrition: number = 100,
    decayRemainingDays: number = 30,
    causeOfDeath?: 'old_age' | 'starvation' | 'combat' | 'hunted'
  ) {
    this.speciesId = speciesId;
    this.remainingNutrition = Math.max(0, remainingNutrition);
    this.decayRemainingDays = Math.max(0, decayRemainingDays);
    this.causeOfDeath = causeOfDeath;
  }
}
