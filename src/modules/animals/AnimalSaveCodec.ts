import { Entity } from '../../ecs/Entity.ts';
import { ECSWorld } from '../../ecs/World.ts';
import { getAnimalSpecies, hasAnimalSpecies } from '../../config/animals/animal.catalog.ts';
import {
  ANIMAL_CARCASS_DECAY_DAYS,
  ANIMAL_HUNGER_MAX,
} from '../../config/animals/animal.simulation.ts';
import {
  AnimalAIState,
  AnimalLifeStage,
  AnimalSex,
  AnimalSpeciesId,
} from '../../config/animals/animal.types.ts';
import {
  AIStrategicBrainComponent,
  AIBehaviorTreeComponent,
  AIPlannerComponent,
} from '../ai/brain/AIComponents.ts';
import { InventoryComponent } from '../alchemy/InventoryComponent.ts';
import { AppearanceComponent } from '../appearance/Appearance.ts';
import {
  AnimationComponent,
  CharacterStateComponent,
  ChildcareComponent,
  ComprehensionComponent,
  CultivationTechniqueComponent,
  HealthComponent,
  HungerComponent,
  LifespanComponent,
  NameComponent,
  PositionComponent,
  RaceComponent,
  RealmComponent,
  SpiritualRootComponent,
  TraitsComponent,
} from '../beings/BeingComponents.ts';
import { FamilyComponent } from '../beings/FamilyComponent.ts';
import { CombatStatsComponent, EquipmentComponent } from '../combat/CombatComponents.ts';
import { MemberComponent, ResidenceComponent } from '../factions/FactionComponents.ts';
import { SerializedEntity } from '../save/SaveTypes.ts';
import { MemoryComponent, SocialRelationshipComponent } from '../social/SocialComponents.ts';
import {
  GrowthMindComponent,
  StatBaselineComponent,
  TalentProfileComponent,
} from '../talent/TalentComponents.ts';
import {
  AnimalBrainComponent,
  AnimalCarcassComponent,
  AnimalComponent,
} from './AnimalComponents.ts';
import { AnimalFactory } from './AnimalFactory.ts';

export interface SerializedAnimalComponent {
  speciesId: AnimalSpeciesId;
  sex: AnimalSex;
  lifeStage: AnimalLifeStage;
  parentIds?: [number, number];
  reproductionCooldownDays: number;
}

export interface SerializedAnimalBrainComponent {
  state: AnimalAIState;
  decisionTimer: number;
  actionTimer: number;
  targetEntityId: number | null;
  threatEntityId: number | null;
  destinationX?: number;
  destinationY?: number;
}

export interface SerializedAnimalCarcassComponent {
  speciesId: AnimalSpeciesId;
  remainingNutrition: number;
  decayRemainingDays: number;
}

const VALID_ANIMAL_AI_STATES: ReadonlySet<string> = new Set<AnimalAIState>([
  'idle',
  'wander',
  'forage',
  'hunt',
  'eat',
  'flee',
  'dead',
]);

const VALID_ANIMAL_LIFE_STAGES: ReadonlySet<string> = new Set<AnimalLifeStage>([
  'child',
  'adult',
  'elder',
]);

export const FORBIDDEN_SERIALIZED_ANIMAL_COMPONENT_KEYS = [
  'race',
  'realm',
  'root',
  'spiritualRoot',
  'tech',
  'cultivationTechnique',
  'traits',
  'talentProfile',
  'growthMind',
  'statBaseline',
  'comp',
  'comprehension',
  'aiBrain',
  'aiStrategic',
  'aiPlanner',
  'aiBehavior',
  'social',
  'memory',
  'equip',
  'equipment',
  'inv',
  'inventory',
  'member',
  'residence',
  'family',
  'child',
  'childcare',
  'appearance',
  'needs',
  'sched',
] as const;

export function serializeEntityAnimalComponents(
  world: ECSWorld,
  entityId: Entity,
  comps: Record<string, any>
): void {
  const animal = world.getComponent(entityId, AnimalComponent);
  if (animal) {
    const serializedAnimal: SerializedAnimalComponent = {
      speciesId: animal.speciesId,
      sex: animal.sex,
      lifeStage: animal.lifeStage,
      reproductionCooldownDays: animal.reproductionCooldownDays,
    };
    if (animal.parentIds) {
      serializedAnimal.parentIds = [animal.parentIds[0], animal.parentIds[1]];
    }
    comps.animal = serializedAnimal;
  }

  const brain = world.getComponent(entityId, AnimalBrainComponent);
  if (brain) {
    const serializedBrain: SerializedAnimalBrainComponent = {
      state: brain.state,
      decisionTimer: brain.decisionTimer,
      actionTimer: brain.actionTimer,
      targetEntityId: brain.targetEntityId,
      threatEntityId: brain.threatEntityId,
    };
    if (typeof brain.destinationX === 'number' && Number.isFinite(brain.destinationX)) {
      serializedBrain.destinationX = brain.destinationX;
    }
    if (typeof brain.destinationY === 'number' && Number.isFinite(brain.destinationY)) {
      serializedBrain.destinationY = brain.destinationY;
    }
    comps.animalBrain = serializedBrain;
  }

  const carcass = world.getComponent(entityId, AnimalCarcassComponent);
  if (carcass) {
    const serializedCarcass: SerializedAnimalCarcassComponent = {
      speciesId: carcass.speciesId,
      remainingNutrition: carcass.remainingNutrition,
      decayRemainingDays: carcass.decayRemainingDays,
    };
    comps.animalCarcass = serializedCarcass;
  }
}

export function validateSerializedAnimalComponents(
  entityId: number,
  comps: Record<string, any>
): void {
  if (!comps || typeof comps !== 'object') return;

  const hasAnimal = comps.animal !== undefined && comps.animal !== null;
  const hasBrain = comps.animalBrain !== undefined && comps.animalBrain !== null;
  const hasCarcass = comps.animalCarcass !== undefined && comps.animalCarcass !== null;

  if (!hasAnimal && !hasBrain && !hasCarcass) {
    return;
  }

  if (hasBrain && !hasAnimal) {
    throw new Error(
      `Dữ liệu bản lưu không hợp lệ: Thực thể #${entityId} có animalBrain nhưng thiếu animal component!`
    );
  }

  if (hasAnimal && hasCarcass) {
    throw new Error(
      `Dữ liệu bản lưu không hợp lệ: Thực thể #${entityId} không thể vừa là động vật sống (animal) vừa là xác động vật (animalCarcass)!`
    );
  }

  // Cấm tuyệt đối mọi component tu luyện / yêu tộc / cư dân trên thực thể động vật hoặc xác động vật
  for (const forbiddenKey of FORBIDDEN_SERIALIZED_ANIMAL_COMPONENT_KEYS) {
    if (comps[forbiddenKey] !== undefined && comps[forbiddenKey] !== null) {
      throw new Error(
        `Dữ liệu bản lưu không hợp lệ: Thực thể động vật #${entityId} chứa component tu luyện/cư dân bị cấm "${forbiddenKey}"!`
      );
    }
  }

  if (hasAnimal) {
    const a = comps.animal;
    if (typeof a !== 'object' || Array.isArray(a)) {
      throw new Error(
        `Dữ liệu bản lưu không hợp lệ: Trường animal của thực thể #${entityId} không đúng cấu trúc!`
      );
    }
    if (typeof a.speciesId !== 'string' || !hasAnimalSpecies(a.speciesId)) {
      throw new Error(
        `Dữ liệu bản lưu không hợp lệ: Thực thể động vật #${entityId} có speciesId không hợp lệ "${String(a.speciesId)}"!`
      );
    }
    if (a.sex !== 'male' && a.sex !== 'female') {
      throw new Error(
        `Dữ liệu bản lưu không hợp lệ: Thực thể động vật #${entityId} có giới tính không hợp lệ "${String(a.sex)}"!`
      );
    }
    if (typeof a.lifeStage !== 'string' || !VALID_ANIMAL_LIFE_STAGES.has(a.lifeStage)) {
      throw new Error(
        `Dữ liệu bản lưu không hợp lệ: Thực thể động vật #${entityId} có lifeStage không hợp lệ "${String(a.lifeStage)}"!`
      );
    }
    if (
      typeof a.reproductionCooldownDays !== 'number' ||
      !Number.isFinite(a.reproductionCooldownDays) ||
      a.reproductionCooldownDays < 0
    ) {
      throw new Error(
        `Dữ liệu bản lưu không hợp lệ: Thực thể động vật #${entityId} có reproductionCooldownDays không hợp lệ!`
      );
    }
    if (a.parentIds !== undefined && a.parentIds !== null) {
      if (
        !Array.isArray(a.parentIds) ||
        a.parentIds.length !== 2 ||
        typeof a.parentIds[0] !== 'number' ||
        !Number.isFinite(a.parentIds[0]) ||
        typeof a.parentIds[1] !== 'number' ||
        !Number.isFinite(a.parentIds[1])
      ) {
        throw new Error(
          `Dữ liệu bản lưu không hợp lệ: Thực thể động vật #${entityId} có parentIds không hợp lệ!`
        );
      }
    }

    if (comps.hunger !== undefined && comps.hunger !== null) {
      if (
        typeof comps.hunger !== 'object' ||
        typeof comps.hunger.current !== 'number' ||
        !Number.isFinite(comps.hunger.current) ||
        comps.hunger.current < 0 ||
        (comps.hunger.max !== undefined &&
          (typeof comps.hunger.max !== 'number' ||
            !Number.isFinite(comps.hunger.max) ||
            comps.hunger.max <= 0))
      ) {
        throw new Error(
          `Dữ liệu bản lưu không hợp lệ: Thực thể động vật #${entityId} có chỉ số đói (hunger) không hợp lệ!`
        );
      }
    }

    if (comps.life !== undefined && comps.life !== null) {
      if (
        typeof comps.life !== 'object' ||
        typeof comps.life.currentAge !== 'number' ||
        !Number.isFinite(comps.life.currentAge) ||
        comps.life.currentAge < 0 ||
        (comps.life.maxLifespan !== undefined &&
          (typeof comps.life.maxLifespan !== 'number' ||
            !Number.isFinite(comps.life.maxLifespan) ||
            comps.life.maxLifespan <= 0))
      ) {
        throw new Error(
          `Dữ liệu bản lưu không hợp lệ: Thực thể động vật #${entityId} có tuổi thọ (life) không hợp lệ!`
        );
      }
    }

    if (comps.hp !== undefined && comps.hp !== null) {
      if (
        typeof comps.hp !== 'object' ||
        typeof comps.hp.current !== 'number' ||
        !Number.isFinite(comps.hp.current) ||
        typeof comps.hp.max !== 'number' ||
        !Number.isFinite(comps.hp.max) ||
        comps.hp.max <= 0
      ) {
        throw new Error(
          `Dữ liệu bản lưu không hợp lệ: Thực thể động vật #${entityId} có chỉ số máu (hp) không hợp lệ!`
        );
      }
    }

    if (comps.pos !== undefined && comps.pos !== null) {
      if (
        typeof comps.pos !== 'object' ||
        typeof comps.pos.x !== 'number' ||
        !Number.isFinite(comps.pos.x) ||
        typeof comps.pos.y !== 'number' ||
        !Number.isFinite(comps.pos.y) ||
        (comps.pos.speed !== undefined &&
          (typeof comps.pos.speed !== 'number' || !Number.isFinite(comps.pos.speed)))
      ) {
        throw new Error(
          `Dữ liệu bản lưu không hợp lệ: Thực thể động vật #${entityId} có tọa độ (pos) không hợp lệ!`
        );
      }
    }

    if (hasBrain) {
      const b = comps.animalBrain;
      if (typeof b !== 'object' || Array.isArray(b)) {
        throw new Error(
          `Dữ liệu bản lưu không hợp lệ: Trường animalBrain của thực thể #${entityId} không đúng cấu trúc!`
        );
      }
      if (typeof b.state !== 'string' || !VALID_ANIMAL_AI_STATES.has(b.state)) {
        throw new Error(
          `Dữ liệu bản lưu không hợp lệ: Thực thể động vật #${entityId} có trạng thái AI không hợp lệ "${String(b.state)}"!`
        );
      }
      if (
        typeof b.decisionTimer !== 'number' ||
        !Number.isFinite(b.decisionTimer) ||
        typeof b.actionTimer !== 'number' ||
        !Number.isFinite(b.actionTimer)
      ) {
        throw new Error(
          `Dữ liệu bản lưu không hợp lệ: Bộ đếm thời gian AI của thực thể động vật #${entityId} không hợp lệ!`
        );
      }
      if (
        b.targetEntityId !== null &&
        b.targetEntityId !== undefined &&
        (typeof b.targetEntityId !== 'number' || !Number.isFinite(b.targetEntityId))
      ) {
        throw new Error(
          `Dữ liệu bản lưu không hợp lệ: targetEntityId của động vật #${entityId} không hợp lệ!`
        );
      }
      if (
        b.threatEntityId !== null &&
        b.threatEntityId !== undefined &&
        (typeof b.threatEntityId !== 'number' || !Number.isFinite(b.threatEntityId))
      ) {
        throw new Error(
          `Dữ liệu bản lưu không hợp lệ: threatEntityId của động vật #${entityId} không hợp lệ!`
        );
      }
      if (
        b.destinationX !== undefined &&
        (typeof b.destinationX !== 'number' || !Number.isFinite(b.destinationX))
      ) {
        throw new Error(
          `Dữ liệu bản lưu không hợp lệ: destinationX của động vật #${entityId} không hợp lệ!`
        );
      }
      if (
        b.destinationY !== undefined &&
        (typeof b.destinationY !== 'number' || !Number.isFinite(b.destinationY))
      ) {
        throw new Error(
          `Dữ liệu bản lưu không hợp lệ: destinationY của động vật #${entityId} không hợp lệ!`
        );
      }
    }
  }

  if (hasCarcass) {
    const cc = comps.animalCarcass;
    if (typeof cc !== 'object' || Array.isArray(cc)) {
      throw new Error(
        `Dữ liệu bản lưu không hợp lệ: Trường animalCarcass của thực thể #${entityId} không đúng cấu trúc!`
      );
    }
    if (typeof cc.speciesId !== 'string' || !hasAnimalSpecies(cc.speciesId)) {
      throw new Error(
        `Dữ liệu bản lưu không hợp lệ: Xác động vật #${entityId} có speciesId không hợp lệ "${String(cc.speciesId)}"!`
      );
    }
    if (
      typeof cc.remainingNutrition !== 'number' ||
      !Number.isFinite(cc.remainingNutrition) ||
      cc.remainingNutrition < 0
    ) {
      throw new Error(
        `Dữ liệu bản lưu không hợp lệ: Xác động vật #${entityId} có remainingNutrition không hợp lệ!`
      );
    }
    if (
      typeof cc.decayRemainingDays !== 'number' ||
      !Number.isFinite(cc.decayRemainingDays) ||
      cc.decayRemainingDays < 0
    ) {
      throw new Error(
        `Dữ liệu bản lưu không hợp lệ: Xác động vật #${entityId} có decayRemainingDays không hợp lệ!`
      );
    }
  }
}

export function hydrateEntityAnimalComponents(
  world: ECSWorld,
  entityId: Entity,
  comps: Record<string, any>
): boolean {
  if (!comps || typeof comps !== 'object') return false;

  validateSerializedAnimalComponents(entityId, comps);

  if (comps.animal) {
    const a = comps.animal as SerializedAnimalComponent;
    const spec = getAnimalSpecies(a.speciesId);

    const animalComp = new AnimalComponent(
      spec.id,
      a.sex,
      a.lifeStage,
      a.reproductionCooldownDays,
      a.parentIds ? [a.parentIds[0], a.parentIds[1]] : undefined
    );
    world.addComponent(entityId, animalComp);

    const b = comps.animalBrain as SerializedAnimalBrainComponent | undefined;
    const brainComp = new AnimalBrainComponent(
      b?.state ?? 'idle',
      b?.decisionTimer ?? 0,
      b?.actionTimer ?? 0,
      b?.targetEntityId ?? null,
      b?.threatEntityId ?? null,
      b?.destinationX,
      b?.destinationY
    );
    world.addComponent(entityId, brainComp);

    if (!world.hasComponent(entityId, PositionComponent)) {
      const x = comps.pos?.x ?? 0;
      const y = comps.pos?.y ?? 0;
      const speed = comps.pos?.speed ?? spec.moveSpeed;
      const posComp = new PositionComponent(x, y, speed);
      posComp.targetX = comps.pos?.targetX;
      posComp.targetY = comps.pos?.targetY;
      world.addComponent(entityId, posComp);
    }

    if (!world.hasComponent(entityId, NameComponent)) {
      world.addComponent(
        entityId,
        new NameComponent(comps.name?.name ?? spec.name)
      );
    }

    if (!world.hasComponent(entityId, HealthComponent)) {
      const hpComp = new HealthComponent(comps.hp?.max ?? spec.maxHealth);
      hpComp.current = comps.hp?.current ?? hpComp.max;
      hpComp.isDead = Boolean(comps.hp?.isDead);
      world.addComponent(entityId, hpComp);
    }

    if (!world.hasComponent(entityId, LifespanComponent)) {
      const age = comps.life?.currentAge ?? spec.adultAgeYears;
      const maxLifespan = comps.life?.maxLifespan ?? spec.lifespanYears;
      const lifeComp = new LifespanComponent(age, maxLifespan);
      lifeComp.isElderly =
        comps.life?.isElderly ??
        AnimalFactory.computeLifeStage(age, spec) === 'elder';
      world.addComponent(entityId, lifeComp);
    }

    if (!world.hasComponent(entityId, HungerComponent)) {
      const hungerComp = new HungerComponent(
        comps.hunger?.current ?? ANIMAL_HUNGER_MAX
      );
      hungerComp.max = comps.hunger?.max ?? ANIMAL_HUNGER_MAX;
      world.addComponent(entityId, hungerComp);
    }

    if (!world.hasComponent(entityId, CombatStatsComponent)) {
      const statsComp = new CombatStatsComponent(
        comps.stats?.baseAtk ?? spec.attack,
        comps.stats?.defense ?? spec.defense,
        comps.stats?.armor ?? 0,
        comps.stats?.attackSpeed ?? 1.0,
        comps.stats?.critRate ?? 0.05,
        comps.stats?.dodgeRate ?? 0.05,
        comps.stats?.critDamage ?? 1.5,
        comps.stats?.attackRange ?? 22,
        comps.stats?.isHostile ?? false
      );
      world.addComponent(entityId, statsComp);
    }

    if (!world.hasComponent(entityId, CharacterStateComponent)) {
      world.addComponent(
        entityId,
        new CharacterStateComponent(
          comps.state?.state ?? 'idle',
          comps.state?.direction ?? 'down'
        )
      );
    }

    if (!world.hasComponent(entityId, AnimationComponent)) {
      const animComp = new AnimationComponent(
        comps.anim?.configId ?? `animal_${spec.id}`
      );
      if (comps.anim?.currentClip) animComp.currentClip = comps.anim.currentClip;
      if (typeof comps.anim?.frameIndex === 'number') {
        animComp.frameIndex = comps.anim.frameIndex;
      }
      world.addComponent(entityId, animComp);
    }

    return true;
  }

  if (comps.animalCarcass) {
    const cc = comps.animalCarcass as SerializedAnimalCarcassComponent;
    const spec = getAnimalSpecies(cc.speciesId);

    if (!world.hasComponent(entityId, PositionComponent)) {
      const x = comps.pos?.x ?? 0;
      const y = comps.pos?.y ?? 0;
      world.addComponent(entityId, new PositionComponent(x, y, 0));
    }

    if (!world.hasComponent(entityId, NameComponent)) {
      world.addComponent(
        entityId,
        new NameComponent(comps.name?.name ?? `Xác ${spec.name}`)
      );
    }

    world.addComponent(
      entityId,
      new AnimalCarcassComponent(
        spec.id,
        cc.remainingNutrition,
        cc.decayRemainingDays ?? ANIMAL_CARCASS_DECAY_DAYS
      )
    );
    return true;
  }

  return false;
}

export class AnimalSaveCodec {
  public static serializeEntity(
    world: ECSWorld,
    entityId: Entity
  ): SerializedEntity | null {
    const isAnimal = world.hasComponent(entityId, AnimalComponent);
    const isCarcass = world.hasComponent(entityId, AnimalCarcassComponent);
    if (!isAnimal && !isCarcass) {
      return null;
    }

    const comps: Record<string, any> = {};
    const pos = world.getComponent(entityId, PositionComponent);
    if (pos) {
      comps.pos = {
        x: pos.x,
        y: pos.y,
        speed: pos.speed,
        targetX: pos.targetX,
        targetY: pos.targetY,
      };
    }

    const name = world.getComponent(entityId, NameComponent);
    if (name) {
      comps.name = { name: name.name };
    }

    const hp = world.getComponent(entityId, HealthComponent);
    if (hp) {
      comps.hp = { current: hp.current, max: hp.max, isDead: hp.isDead };
    }

    const life = world.getComponent(entityId, LifespanComponent);
    if (life) {
      comps.life = {
        currentAge: life.currentAge,
        maxLifespan: life.maxLifespan,
        isElderly: life.isElderly,
      };
    }

    const hunger = world.getComponent(entityId, HungerComponent);
    if (hunger) {
      comps.hunger = { current: hunger.current, max: hunger.max };
    }

    const stats = world.getComponent(entityId, CombatStatsComponent);
    if (stats) {
      comps.stats = {
        baseAtk: stats.baseAtk,
        defense: stats.defense,
        armor: stats.armor,
        attackSpeed: stats.attackSpeed,
        critRate: stats.critRate,
        dodgeRate: stats.dodgeRate,
        critDamage: stats.critDamage,
        attackRange: stats.attackRange,
        isHostile: stats.isHostile,
      };
    }

    const stateComp = world.getComponent(entityId, CharacterStateComponent);
    if (stateComp) {
      comps.state = {
        state: stateComp.state,
        direction: stateComp.direction,
      };
    }

    const anim = world.getComponent(entityId, AnimationComponent);
    if (anim) {
      comps.anim = {
        configId: anim.configId,
        currentClip: anim.currentClip,
        frameIndex: anim.frameIndex,
      };
    }

    serializeEntityAnimalComponents(world, entityId, comps);

    return {
      id: entityId,
      components: comps,
    };
  }

  public static validateEntity(serialized: SerializedEntity): void {
    if (!serialized || typeof serialized.id !== 'number' || !serialized.components) {
      throw new Error('Dữ liệu thực thể động vật không hợp lệ!');
    }
    validateSerializedAnimalComponents(serialized.id, serialized.components);
  }

  public static deserializeEntity(
    world: ECSWorld,
    serialized: SerializedEntity
  ): Entity {
    this.validateEntity(serialized);
    const ent = world.createEntityWithId(serialized.id);
    const hydrated = hydrateEntityAnimalComponents(
      world,
      ent,
      serialized.components
    );
    if (!hydrated) {
      throw new Error(
        `Thực thể #${serialized.id} không phải là động vật hoặc xác động vật hợp lệ!`
      );
    }
    return ent;
  }

  public static assertNoCultivationComponents(
    world: ECSWorld,
    entityId: Entity
  ): void {
    const forbiddenTypes: Array<new (...args: any[]) => any> = [
      RaceComponent,
      RealmComponent,
      SpiritualRootComponent,
      CultivationTechniqueComponent,
      TraitsComponent,
      TalentProfileComponent,
      GrowthMindComponent,
      StatBaselineComponent,
      ComprehensionComponent,
      AIStrategicBrainComponent,
      AIPlannerComponent,
      AIBehaviorTreeComponent,
      SocialRelationshipComponent,
      MemoryComponent,
      EquipmentComponent,
      InventoryComponent,
      MemberComponent,
      ResidenceComponent,
      FamilyComponent,
      ChildcareComponent,
      AppearanceComponent,
    ];

    for (const CompType of forbiddenTypes) {
      if (world.hasComponent(entityId, CompType)) {
        throw new Error(
          `Thực thể động vật #${entityId} chứa component bị cấm: ${CompType.name}`
        );
      }
    }
  }
}
