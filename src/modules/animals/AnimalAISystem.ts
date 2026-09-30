import { SpatialGrid } from '../../core/SpatialGrid.ts';
import { getAnimalSpecies } from '../../config/animals/animal.catalog.ts';
import {
  ANIMAL_AI_DECISION_INTERVAL_SECONDS,
  ANIMAL_CARCASS_BITE_HUNGER_GAIN,
  ANIMAL_EAT_RANGE_PX,
  ANIMAL_FLEE_SEARCH_RADIUS_PX,
  ANIMAL_FORAGE_HUNGER_GAIN_PER_SECOND,
  ANIMAL_HUNGER_MAX,
  ANIMAL_HUNGER_SATIATED_THRESHOLD,
  ANIMAL_HUNGER_SEEK_FOOD_THRESHOLD,
  ANIMAL_HUNT_SEARCH_RADIUS_PX,
  ANIMAL_WANDER_RADIUS_PX,
} from '../../config/animals/animal.simulation.ts';
import { AnimalSpeciesDefinition } from '../../config/animals/animal.types.ts';
import { System } from '../../ecs/System.ts';
import { ECSWorld } from '../../ecs/World.ts';
import {
  CharacterStateComponent,
  HealthComponent,
  HungerComponent,
  PositionComponent,
  RaceComponent,
} from '../beings/BeingComponents.ts';
import { CombatStatsComponent } from '../combat/CombatComponents.ts';
import { PlantComponent } from '../flora/PlantComponents.ts';
import { WorldMap } from '../world/WorldMap.ts';
import {
  AnimalBrainComponent,
  AnimalCarcassComponent,
  AnimalComponent,
} from './AnimalComponents.ts';
import { AnimalCarcassSystem } from './AnimalCarcassSystem.ts';
import { AnimalMovement } from './AnimalMovement.ts';

export class AnimalAISystem implements System {
  public name = 'AnimalAISystem';
  public enabled = true;
  public priority = 23;

  public worldMap: WorldMap;
  public spatialGrid: SpatialGrid | null = null;
  private rng: () => number;

  constructor(worldMap: WorldMap, rng: () => number = Math.random) {
    this.worldMap = worldMap;
    this.rng = rng;
  }

  public reset(): void {
    // Trạng thái AI lưu trên AnimalBrainComponent
  }

  public update(world: ECSWorld, dt: number): void {
    const animals = world.query([
      AnimalComponent,
      AnimalBrainComponent,
      PositionComponent,
      HealthComponent,
      HungerComponent,
    ]);

    for (const id of animals) {
      const hp = world.getComponent(id, HealthComponent)!;
      const brain = world.getComponent(id, AnimalBrainComponent)!;
      const stateComp = world.getComponent(id, CharacterStateComponent);
      const combat = world.getComponent(id, CombatStatsComponent);

      if (hp.isDead || hp.current <= 0) {
        brain.state = 'dead';
        brain.clearMovementTarget();
        if (combat) combat.targetEntityId = null;
        if (stateComp) stateComp.state = 'dead';
        continue;
      }

      const animal = world.getComponent(id, AnimalComponent)!;
      const pos = world.getComponent(id, PositionComponent)!;
      const hunger = world.getComponent(id, HungerComponent)!;
      const spec = getAnimalSpecies(animal.speciesId);

      brain.decisionTimer -= dt;
      if (brain.actionTimer > 0) {
        brain.actionTimer = Math.max(0, brain.actionTimer - dt);
      }

      // Xử lý hành động ăn xác hoặc gặm cỏ liên tục ở mỗi nhịp
      this.tickOngoingConsumption(world, id, spec, pos, hunger, brain, combat, stateComp, dt);

      // Đồng bộ tọa độ con mồi đang săn nếu đang ở trạng thái hunt
      if (brain.state === 'hunt' && brain.targetEntityId !== null) {
        const preyHp = world.getComponent(brain.targetEntityId, HealthComponent);
        const preyPos = world.getComponent(brain.targetEntityId, PositionComponent);
        const preyAnimal = world.getComponent(brain.targetEntityId, AnimalComponent);
        if (
          !preyHp ||
          preyHp.isDead ||
          !preyPos ||
          !preyAnimal ||
          !spec.preySpeciesIds.includes(preyAnimal.speciesId)
        ) {
          brain.targetEntityId = null;
          if (combat) combat.targetEntityId = null;
          brain.state = 'idle';
          brain.clearMovementTarget();
        } else {
          brain.destinationX = preyPos.x;
          brain.destinationY = preyPos.y;
          if (combat) combat.targetEntityId = brain.targetEntityId;
        }
      }

      // Đánh giá lại quyết định mỗi 0.5s hoặc khi mục tiêu hiện tại đã kết thúc
      if (brain.decisionTimer <= 0) {
        brain.decisionTimer = ANIMAL_AI_DECISION_INTERVAL_SECONDS;
        this.evaluateDecision(
          world,
          id,
          animal,
          spec,
          pos,
          hp,
          hunger,
          brain,
          combat,
          stateComp
        );
      }
    }
  }

  private tickOngoingConsumption(
    world: ECSWorld,
    id: number,
    spec: AnimalSpeciesDefinition,
    pos: PositionComponent,
    hunger: HungerComponent,
    brain: AnimalBrainComponent,
    combat: CombatStatsComponent | undefined,
    stateComp: CharacterStateComponent | undefined,
    dt: number
  ): void {
    if (brain.state === 'eat') {
      if (brain.targetEntityId === null) {
        brain.state = 'idle';
        brain.clearMovementTarget();
        return;
      }
      const carcass = world.getComponent(
        brain.targetEntityId,
        AnimalCarcassComponent
      );
      const carcassPos = world.getComponent(
        brain.targetEntityId,
        PositionComponent
      );
      if (!carcass || carcass.remainingNutrition <= 0 || !carcassPos) {
        brain.targetEntityId = null;
        brain.state = 'idle';
        brain.clearMovementTarget();
        return;
      }

      const dist = Math.hypot(carcassPos.x - pos.x, carcassPos.y - pos.y);
      if (dist <= ANIMAL_EAT_RANGE_PX) {
        brain.clearMovementTarget();
        if (combat) combat.targetEntityId = null;
        const biteAmount = Math.max(4, ANIMAL_CARCASS_BITE_HUNGER_GAIN * dt * 2);
        AnimalCarcassSystem.consumeCarcassPortion(
          world,
          id,
          brain.targetEntityId,
          biteAmount
        );
        if (
          hunger.current >= ANIMAL_HUNGER_SATIATED_THRESHOLD ||
          !world.hasComponent(brain.targetEntityId, AnimalCarcassComponent)
        ) {
          brain.targetEntityId = null;
          brain.state = 'idle';
          brain.clearMovementTarget();
        }
      } else {
        brain.destinationX = carcassPos.x;
        brain.destinationY = carcassPos.y;
      }
      return;
    }

    if (brain.state === 'forage') {
      const hasDest =
        typeof brain.destinationX === 'number' &&
        typeof brain.destinationY === 'number';
      if (!hasDest) {
        brain.state = 'idle';
        brain.clearMovementTarget();
        brain.actionTimer = 1.0;
        return;
      }
      const dist = Math.hypot(brain.destinationX! - pos.x, brain.destinationY! - pos.y);
      if (dist <= ANIMAL_EAT_RANGE_PX) {
        if (!this.isValidForageLocation(world, spec, pos.x, pos.y)) {
          brain.state = 'idle';
          brain.clearMovementTarget();
          brain.actionTimer = 1.0;
          return;
        }
        // Đã tới nơi: bỏ đường đi nhưng giữ đích ăn để các tick sau tiếp tục gặm cỏ.
        // clearMovementTarget() xóa cả destination, khiến lượt kế tiếp hủy forage.
        brain.path = [];
        brain.pathIndex = 0;
        hunger.current = Math.min(
          ANIMAL_HUNGER_MAX,
          hunger.current + ANIMAL_FORAGE_HUNGER_GAIN_PER_SECOND * dt
        );
        hunger.isStarving = hunger.current < 15;
        if (stateComp) stateComp.state = 'idle';
        if (hunger.current >= ANIMAL_HUNGER_SATIATED_THRESHOLD) {
          brain.state = 'idle';
          brain.targetEntityId = null;
          brain.clearMovementTarget();
        }
      } else {
        if (!this.isValidForageLocation(world, spec, brain.destinationX!, brain.destinationY!)) {
          brain.state = 'idle';
          brain.clearMovementTarget();
          brain.actionTimer = 1.0;
        }
      }
    }
  }

  private evaluateDecision(
    world: ECSWorld,
    id: number,
    animal: AnimalComponent,
    spec: AnimalSpeciesDefinition,
    pos: PositionComponent,
    hp: HealthComponent,
    hunger: HungerComponent,
    brain: AnimalBrainComponent,
    combat: CombatStatsComponent | undefined,
    stateComp: CharacterStateComponent | undefined
  ): void {
    // 1. Ưu tiên cao nhất: Chạy trốn (flee)
    const threatId = this.findNearestThreat(world, id, animal, spec, pos, hp);
    if (threatId !== null) {
      const threatPos = world.getComponent(threatId, PositionComponent);
      if (threatPos) {
        brain.state = 'flee';
        brain.threatEntityId = threatId;
        brain.targetEntityId = null;
        if (combat) combat.targetEntityId = null;
        const fleeDest = this.pickFleeDestination(world, pos, threatPos);
        if (fleeDest) {
          brain.destinationX = fleeDest.x;
          brain.destinationY = fleeDest.y;
        }
        return;
      }
    } else if (brain.state === 'flee') {
      brain.state = 'idle';
      brain.threatEntityId = null;
      brain.clearMovementTarget();
    }

    // 2. Kiếm ăn (forage / hunt / eat) khi đói hoặc đang ăn dở chưa no
    const isSeekingFood =
      hunger.current < ANIMAL_HUNGER_SEEK_FOOD_THRESHOLD ||
      ((brain.state === 'forage' ||
        brain.state === 'hunt' ||
        brain.state === 'eat') &&
        hunger.current < ANIMAL_HUNGER_SATIATED_THRESHOLD);

    if (isSeekingFood) {
      if (this.tryChooseFoodAction(world, id, spec, pos, brain, combat)) {
        return;
      }
    }

    // Nếu không còn săn mồi thì xóa mục tiêu chiến đấu chủ động
    if (combat && brain.state !== 'hunt') {
      combat.targetEntityId = null;
    }

    // 3. Đi dạo / đứng nghỉ (idle / wander)
    if (brain.state === 'wander') {
      if (
        typeof brain.destinationX === 'number' &&
        typeof brain.destinationY === 'number'
      ) {
        return;
      }
      brain.state = 'idle';
    }

    if (brain.actionTimer > 0) {
      brain.state = 'idle';
      if (stateComp && stateComp.state === 'walk') {
        stateComp.state = 'idle';
      }
      return;
    }

    if (this.rng() < 0.65) {
      const wanderTarget = this.pickWanderDestination(world, pos, spec);
      if (wanderTarget) {
        brain.state = 'wander';
        brain.destinationX = wanderTarget.x;
        brain.destinationY = wanderTarget.y;
        brain.actionTimer = 2.0 + this.rng() * 2.5;
        return;
      }
    }

    brain.state = 'idle';
    brain.clearMovementTarget();
    brain.actionTimer = 1.0 + this.rng() * 1.5;
    if (stateComp) {
      stateComp.state = 'idle';
    }
  }

  private findNearestThreat(
    world: ECSWorld,
    selfId: number,
    selfAnimal: AnimalComponent,
    selfSpec: AnimalSpeciesDefinition,
    selfPos: PositionComponent,
    selfHp: HealthComponent
  ): number | null {
    const isVulnerable =
      selfAnimal.lifeStage === 'child' ||
      selfSpec.diet === 'herbivore' ||
      selfHp.current < selfHp.max * 0.35;

    const candidates = this.getNearbyEntityIds(
      world,
      selfPos.x,
      selfPos.y,
      ANIMAL_FLEE_SEARCH_RADIUS_PX
    );

    let nearestThreat: number | null = null;
    let minDist = ANIMAL_FLEE_SEARCH_RADIUS_PX;

    for (const otherId of candidates) {
      if (otherId === selfId) continue;
      const otherHp = world.getComponent(otherId, HealthComponent);
      if (!otherHp || otherHp.isDead) continue;
      const otherPos = world.getComponent(otherId, PositionComponent);
      if (!otherPos) continue;

      const dist = Math.hypot(otherPos.x - selfPos.x, otherPos.y - selfPos.y);
      if (dist >= minDist) continue;

      const otherCombat = world.getComponent(otherId, CombatStatsComponent);
      const isAttackingMe = otherCombat?.targetEntityId === selfId;

      if (isAttackingMe && isVulnerable) {
        minDist = dist;
        nearestThreat = otherId;
        continue;
      }

      if (!isVulnerable) continue;

      // Kiểm tra xem đối phương có phải thú săn loài mình không
      const otherAnimal = world.getComponent(otherId, AnimalComponent);
      if (otherAnimal) {
        const otherSpec = getAnimalSpecies(otherAnimal.speciesId);
        if (otherSpec.preySpeciesIds.includes(selfSpec.id)) {
          minDist = dist;
          nearestThreat = otherId;
          continue;
        }
      }

      // Kiểm tra yêu tộc hoặc ma tộc áp sát con non / thú ăn cỏ
      const otherRace = world.getComponent(otherId, RaceComponent);
      if (
        otherRace &&
        (otherRace.raceId === 'beast' || otherRace.raceId === 'demon') &&
        dist < 120
      ) {
        minDist = dist;
        nearestThreat = otherId;
      }
    }

    return nearestThreat;
  }

  private tryChooseFoodAction(
    world: ECSWorld,
    selfId: number,
    spec: AnimalSpeciesDefinition,
    pos: PositionComponent,
    brain: AnimalBrainComponent,
    combat: CombatStatsComponent | undefined
  ): boolean {
    if (spec.diet === 'herbivore') {
      if (combat) combat.targetEntityId = null;
      return this.startForage(world, pos, spec, brain);
    }

    if (spec.diet === 'carnivore') {
      // 1. Ưu tiên xác động vật gần nhất
      const nearestCarcass = this.findNearestCarcass(
        world,
        pos,
        ANIMAL_HUNT_SEARCH_RADIUS_PX
      );
      if (nearestCarcass !== null) {
        const cPos = world.getComponent(nearestCarcass, PositionComponent)!;
        brain.state = 'eat';
        brain.targetEntityId = nearestCarcass;
        brain.destinationX = cPos.x;
        brain.destinationY = cPos.y;
        if (combat) combat.targetEntityId = null;
        return true;
      }

      // 2. Săn con mồi thuộc preySpeciesIds
      const nearestPrey = this.findNearestPrey(
        world,
        selfId,
        spec,
        pos,
        ANIMAL_HUNT_SEARCH_RADIUS_PX
      );
      if (nearestPrey !== null) {
        const pPos = world.getComponent(nearestPrey, PositionComponent)!;
        brain.state = 'hunt';
        brain.targetEntityId = nearestPrey;
        brain.destinationX = pPos.x;
        brain.destinationY = pPos.y;
        if (combat) combat.targetEntityId = nearestPrey;
        return true;
      }

      return false;
    }

    // Loài ăn tạp (omnivore): tìm nguồn gần nhất trong xác -> con mồi nhỏ -> cây/thảm cỏ
    const nearestCarcass = this.findNearestCarcass(
      world,
      pos,
      ANIMAL_HUNT_SEARCH_RADIUS_PX
    );
    if (nearestCarcass !== null) {
      const cPos = world.getComponent(nearestCarcass, PositionComponent)!;
      brain.state = 'eat';
      brain.targetEntityId = nearestCarcass;
      brain.destinationX = cPos.x;
      brain.destinationY = cPos.y;
      if (combat) combat.targetEntityId = null;
      return true;
    }

    if (spec.preySpeciesIds.length > 0) {
      const nearestPrey = this.findNearestPrey(
        world,
        selfId,
        spec,
        pos,
        ANIMAL_HUNT_SEARCH_RADIUS_PX * 0.75
      );
      if (nearestPrey !== null) {
        const pPos = world.getComponent(nearestPrey, PositionComponent)!;
        brain.state = 'hunt';
        brain.targetEntityId = nearestPrey;
        brain.destinationX = pPos.x;
        brain.destinationY = pPos.y;
        if (combat) combat.targetEntityId = nearestPrey;
        return true;
      }
    }

    if (combat) combat.targetEntityId = null;
    return this.startForage(world, pos, spec, brain);
  }

  private startForage(
    world: ECSWorld,
    pos: PositionComponent,
    spec: AnimalSpeciesDefinition,
    brain: AnimalBrainComponent
  ): boolean {
    if (brain.state === 'forage') {
      if (
        typeof brain.destinationX === 'number' &&
        typeof brain.destinationY === 'number' &&
        this.isValidForageLocation(world, spec, brain.destinationX, brain.destinationY)
      ) {
        return true;
      }
    }

    const plantPos = this.findNearestPassablePlant(world, pos, spec, 160);
    if (plantPos) {
      brain.state = 'forage';
      brain.targetEntityId = null;
      brain.destinationX = plantPos.x;
      brain.destinationY = plantPos.y;
      return true;
    }

    const spot = this.pickForageDestination(world, pos, spec, 64);
    if (spot) {
      brain.state = 'forage';
      brain.targetEntityId = null;
      brain.destinationX = spot.x;
      brain.destinationY = spot.y;
      return true;
    }

    if (this.isValidForageLocation(world, spec, pos.x, pos.y)) {
      brain.state = 'forage';
      brain.targetEntityId = null;
      brain.destinationX = pos.x;
      brain.destinationY = pos.y;
      return true;
    }

    brain.state = 'idle';
    brain.clearMovementTarget();
    brain.actionTimer = 1.0 + this.rng() * 1.5;
    return false;
  }

  private findNearestCarcass(
    world: ECSWorld,
    pos: PositionComponent,
    maxRadius: number
  ): number | null {
    const carcasses = world.query([AnimalCarcassComponent, PositionComponent]);
    let nearest: number | null = null;
    let minDist = maxRadius;

    for (const cid of carcasses) {
      const carcass = world.getComponent(cid, AnimalCarcassComponent)!;
      if (carcass.remainingNutrition <= 0) continue;
      const cPos = world.getComponent(cid, PositionComponent)!;
      if (!AnimalMovement.isPixelWalkable(world, this.worldMap, cPos.x, cPos.y)) {
        continue;
      }
      const dist = Math.hypot(cPos.x - pos.x, cPos.y - pos.y);
      if (dist < minDist) {
        minDist = dist;
        nearest = cid;
      }
    }

    return nearest;
  }

  private findNearestPrey(
    world: ECSWorld,
    selfId: number,
    spec: AnimalSpeciesDefinition,
    pos: PositionComponent,
    maxRadius: number
  ): number | null {
    if (spec.preySpeciesIds.length === 0) return null;

    const candidates = this.getNearbyEntityIds(world, pos.x, pos.y, maxRadius);
    let nearest: number | null = null;
    let minDist = maxRadius;

    for (const otherId of candidates) {
      if (otherId === selfId) continue;
      const otherAnimal = world.getComponent(otherId, AnimalComponent);
      if (!otherAnimal) continue;
      if (!spec.preySpeciesIds.includes(otherAnimal.speciesId)) continue;

      const otherHp = world.getComponent(otherId, HealthComponent);
      if (!otherHp || otherHp.isDead || otherHp.current <= 0) continue;

      const otherPos = world.getComponent(otherId, PositionComponent);
      if (!otherPos) continue;

      const dist = Math.hypot(otherPos.x - pos.x, otherPos.y - pos.y);
      if (dist < minDist) {
        minDist = dist;
        nearest = otherId;
      }
    }

    return nearest;
  }

  public isValidForageLocation(
    world: ECSWorld,
    spec: AnimalSpeciesDefinition,
    x: number,
    y: number
  ): boolean {
    const tileSize = this.worldMap.tileSize;
    const tx = Math.floor(x / tileSize);
    const ty = Math.floor(y / tileSize);

    if (!AnimalMovement.isTileWalkable(world, this.worldMap, tx, ty)) {
      return false;
    }

    const tile = this.worldMap.getTile(tx, ty);
    if (!tile || !spec.habitats.includes(tile.terrain)) {
      return false;
    }

    return AnimalMovement.isPixelWalkable(world, this.worldMap, x, y);
  }

  public pickForageDestination(
    world: ECSWorld,
    pos: PositionComponent,
    spec: AnimalSpeciesDefinition,
    maxRadius: number = 64
  ): { x: number; y: number } | null {
    const tileSize = this.worldMap.tileSize;

    for (let attempt = 0; attempt < 16; attempt++) {
      const angle = this.rng() * Math.PI * 2;
      const dist = tileSize + this.rng() * maxRadius;
      const candX = pos.x + Math.cos(angle) * dist;
      const candY = pos.y + Math.sin(angle) * dist;

      const tx = Math.floor(candX / tileSize);
      const ty = Math.floor(candY / tileSize);

      const targetX = tx * tileSize + tileSize / 2;
      const targetY = ty * tileSize + tileSize / 2;

      if (this.isValidForageLocation(world, spec, targetX, targetY)) {
        return { x: targetX, y: targetY };
      }
    }

    return null;
  }

  private findNearestPassablePlant(
    world: ECSWorld,
    pos: PositionComponent,
    spec: AnimalSpeciesDefinition,
    maxRadius: number
  ): { x: number; y: number } | null {
    const plants = world.query([PlantComponent, PositionComponent]);
    let nearest: { x: number; y: number } | null = null;
    let minDist = maxRadius;

    for (const pid of plants) {
      const pPos = world.getComponent(pid, PositionComponent)!;
      if (!this.isValidForageLocation(world, spec, pPos.x, pPos.y)) {
        continue;
      }
      const dist = Math.hypot(pPos.x - pos.x, pPos.y - pos.y);
      if (dist < minDist) {
        minDist = dist;
        nearest = { x: pPos.x, y: pPos.y };
      }
    }

    return nearest;
  }

  private pickFleeDestination(
    world: ECSWorld,
    selfPos: PositionComponent,
    threatPos: PositionComponent
  ): { x: number; y: number } | null {
    const dx = selfPos.x - threatPos.x;
    const dy = selfPos.y - threatPos.y;
    const baseAngle =
      Math.hypot(dx, dy) > 1e-3 ? Math.atan2(dy, dx) : this.rng() * Math.PI * 2;
    const tileSize = this.worldMap.tileSize;

    for (let attempt = 0; attempt < 10; attempt++) {
      const offsetAngle =
        attempt === 0 ? 0 : ((this.rng() - 0.5) * Math.PI * 2) / 3;
      const angle = baseAngle + offsetAngle;
      const dist = 64 + this.rng() * 48;
      const tx = Math.floor((selfPos.x + Math.cos(angle) * dist) / tileSize);
      const ty = Math.floor((selfPos.y + Math.sin(angle) * dist) / tileSize);
      if (AnimalMovement.isTileWalkable(world, this.worldMap, tx, ty)) {
        return {
          x: tx * tileSize + tileSize / 2,
          y: ty * tileSize + tileSize / 2,
        };
      }
    }

    return null;
  }

  private pickWanderDestination(
    world: ECSWorld,
    pos: PositionComponent,
    spec: AnimalSpeciesDefinition,
    maxRadius: number = ANIMAL_WANDER_RADIUS_PX
  ): { x: number; y: number } | null {
    const tileSize = this.worldMap.tileSize;
    let fallbackCandidate: { x: number; y: number } | null = null;

    for (let attempt = 0; attempt < 12; attempt++) {
      const angle = this.rng() * Math.PI * 2;
      const dist = tileSize * 1.5 + this.rng() * maxRadius;
      const tx = Math.floor((pos.x + Math.cos(angle) * dist) / tileSize);
      const ty = Math.floor((pos.y + Math.sin(angle) * dist) / tileSize);

      if (!AnimalMovement.isTileWalkable(world, this.worldMap, tx, ty)) {
        continue;
      }

      const candidate = {
        x: tx * tileSize + tileSize / 2,
        y: ty * tileSize + tileSize / 2,
      };

      const tile = this.worldMap.getTile(tx, ty);
      if (tile && spec.habitats.includes(tile.terrain)) {
        return candidate;
      }
      if (!fallbackCandidate) {
        fallbackCandidate = candidate;
      }
    }

    return fallbackCandidate;
  }

  private getNearbyEntityIds(
    world: ECSWorld,
    x: number,
    y: number,
    radius: number
  ): number[] {
    if (this.spatialGrid) {
      return this.spatialGrid.queryRadius(x, y, radius).map(item => item.id);
    }
    return world.query([PositionComponent]);
  }
}
