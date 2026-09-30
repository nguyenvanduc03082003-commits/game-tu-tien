import { TERRAIN_CONFIGS, TerrainType } from '../../config/terrains.config.ts';
import {
  ANIMAL_PASSABLE_TERRAINS,
  ANIMAL_PATH_RETRY_COOLDOWN_SECONDS,
} from '../../config/animals/animal.simulation.ts';
import { System } from '../../ecs/System.ts';
import { ECSWorld } from '../../ecs/World.ts';
import { BehaviorTreeExecutor } from '../ai/brain/behavior/BehaviorTree.ts';
import { AStarPathfinder, Point2D } from '../ai/pathfinding/AStar.ts';
import {
  CharacterStateComponent,
  HealthComponent,
  PositionComponent,
} from '../beings/BeingComponents.ts';
import { WorldMap } from '../world/WorldMap.ts';
import { AnimalBrainComponent, AnimalComponent } from './AnimalComponents.ts';
import {
  canTraverseSlope,
  canTraverseDiagonalSlope
} from '../world/ElevationRules.ts';
import { getLocalSlopeMoveFactor } from '../world/ElevationMovement.ts';

const PASSABLE_TERRAIN_SET: ReadonlySet<TerrainType> = new Set<TerrainType>(
  ANIMAL_PASSABLE_TERRAINS
);

export function isAnimalPassableTerrain(terrain: TerrainType): boolean {
  return PASSABLE_TERRAIN_SET.has(terrain);
}

export class AnimalMovement {
  public static isTileWalkable(
    world: ECSWorld,
    worldMap: WorldMap,
    tx: number,
    ty: number,
    blockedTiles?: Set<number>
  ): boolean {
    const blocked =
      blockedTiles ?? AStarPathfinder.getBlockedBuildingTiles(world, worldMap);
    return AStarPathfinder.isTileWalkable(
      tx,
      ty,
      worldMap,
      blocked,
      false,
      isAnimalPassableTerrain
    );
  }

  public static isPixelWalkable(
    world: ECSWorld,
    worldMap: WorldMap,
    x: number,
    y: number,
    blockedTiles?: Set<number>
  ): boolean {
    const tx = Math.floor(x / worldMap.tileSize);
    const ty = Math.floor(y / worldMap.tileSize);
    return this.isTileWalkable(world, worldMap, tx, ty, blockedTiles);
  }

  public static findPath(
    world: ECSWorld,
    worldMap: WorldMap,
    startPixel: Point2D,
    targetPixel: Point2D,
    maxSearchNodes: number = 1000
  ): Point2D[] {
    return AStarPathfinder.findPath(
      worldMap,
      world,
      startPixel,
      targetPixel,
      false,
      maxSearchNodes,
      isAnimalPassableTerrain,
      true,
      true
    );
  }

  public static handleUnreachablePath(
    brain: AnimalBrainComponent,
    pos: PositionComponent,
    stateComp?: CharacterStateComponent
  ): void {
    brain.state = 'idle';
    brain.clearMovementTarget();
    brain.targetEntityId = null;
    brain.threatEntityId = null;
    brain.pathRetryCooldown = ANIMAL_PATH_RETRY_COOLDOWN_SECONDS;
    pos.targetX = undefined;
    pos.targetY = undefined;
    if (stateComp) {
      stateComp.state = 'idle';
    }
  }

  public static moveTowards(
    world: ECSWorld,
    worldMap: WorldMap,
    entityId: number,
    targetX: number,
    targetY: number,
    dt: number,
    arrivalDistancePx: number = 6
  ): 'moving' | 'arrived' | 'blocked' {
    const pos = world.getComponent(entityId, PositionComponent);
    const brain = world.getComponent(entityId, AnimalBrainComponent);
    const stateComp = world.getComponent(entityId, CharacterStateComponent);
    if (!pos || !brain) return 'blocked';

    if (brain.pathRetryCooldown > 0) {
      if (stateComp && stateComp.state === 'walk') {
        stateComp.state = 'idle';
      }
      return 'blocked';
    }

    const distToGoal = Math.hypot(targetX - pos.x, targetY - pos.y);
    if (distToGoal <= arrivalDistancePx) {
      brain.path = [];
      brain.pathIndex = 0;
      pos.targetX = undefined;
      pos.targetY = undefined;
      if (stateComp && stateComp.state === 'walk') {
        stateComp.state = 'idle';
      }
      return 'arrived';
    }

    const tileSize = worldMap.tileSize;
    const blockedTiles = AStarPathfinder.getBlockedBuildingTiles(world, worldMap);

    // Kiểm tra xem có cần tính lại đường đi A* không
    const lastWaypoint =
      brain.path.length > 0 ? brain.path[brain.path.length - 1] : null;
    const needRepath =
      !lastWaypoint ||
      brain.pathIndex >= brain.path.length ||
      Math.hypot(lastWaypoint.x - targetX, lastWaypoint.y - targetY) > tileSize;

    if (needRepath) {
      const path = this.findPath(
        world,
        worldMap,
        { x: pos.x, y: pos.y },
        { x: targetX, y: targetY }
      );
      if (path.length === 0) {
        this.handleUnreachablePath(brain, pos, stateComp);
        return 'blocked';
      }
      brain.path = path;
      brain.pathIndex = 0;
    }

    // Bỏ qua các waypoint đã chạm tới
    while (brain.pathIndex < brain.path.length - 1) {
      const wp = brain.path[brain.pathIndex];
      if (Math.hypot(wp.x - pos.x, wp.y - pos.y) <= 4) {
        brain.pathIndex++;
      } else {
        break;
      }
    }

    const waypoint = brain.path[brain.pathIndex];
    if (!waypoint) {
      this.handleUnreachablePath(brain, pos, stateComp);
      return 'blocked';
    }

    const dx = waypoint.x - pos.x;
    const dy = waypoint.y - pos.y;
    const distToWp = Math.hypot(dx, dy);

    if (distToWp <= 1e-4) {
      brain.pathIndex++;
      return brain.pathIndex >= brain.path.length ? 'arrived' : 'moving';
    }

    const curTx = Math.floor(pos.x / tileSize);
    const curTy = Math.floor(pos.y / tileSize);
    const curTile = worldMap.getTile(curTx, curTy);
    const speedMod = curTile
      ? TERRAIN_CONFIGS[curTile.terrain]?.moveSpeedModifier ?? 1.0
      : 1.0;
    const slopeMod = getLocalSlopeMoveFactor(worldMap, pos.x, pos.y, waypoint.x, waypoint.y);
    const effectiveSpeed = Math.max(4, pos.speed * speedMod * (slopeMod > 0 ? slopeMod : 1.0));
    const stepDist = Math.min(distToWp, effectiveSpeed * dt);

    const nextX = pos.x + (dx / distToWp) * stepDist;
    const nextY = pos.y + (dy / distToWp) * stepDist;

    // Kiểm tra toàn bộ các ô cắt qua khi di chuyển (đặc biệt khi dt lớn)
    const actualDist = Math.hypot(nextX - pos.x, nextY - pos.y);
    const subSteps = Math.max(1, Math.ceil(actualDist / (tileSize * 0.5)));
    let validMove = true;
    let lastCheckTx = curTx;
    let lastCheckTy = curTy;

    for (let s = 1; s <= subSteps; s++) {
      const t = s / subSteps;
      const cX = pos.x + (nextX - pos.x) * t;
      const cY = pos.y + (nextY - pos.y) * t;
      const cTx = Math.floor(cX / tileSize);
      const cTy = Math.floor(cY / tileSize);

      if (cTx !== lastCheckTx || cTy !== lastCheckTy) {
        if (!this.isTileWalkable(world, worldMap, cTx, cTy, blockedTiles)) {
          validMove = false;
          break;
        }

        const lastTile = worldMap.getTile(lastCheckTx, lastCheckTy);
        const checkTile = worldMap.getTile(cTx, cTy);
        if (lastTile && checkTile) {
          if (!canTraverseSlope(lastTile.elevation, checkTile.elevation)) {
            validMove = false;
            break;
          }
          if (cTx !== lastCheckTx && cTy !== lastCheckTy) {
            const orth1 = worldMap.getTile(lastCheckTx, cTy);
            const orth2 = worldMap.getTile(cTx, lastCheckTy);
            if (
              !orth1 ||
              !orth2 ||
              !canTraverseDiagonalSlope(lastTile.elevation, checkTile.elevation, orth1.elevation, orth2.elevation)
            ) {
              validMove = false;
              break;
            }
            const orth1Walk = this.isTileWalkable(world, worldMap, lastCheckTx, cTy, blockedTiles);
            const orth2Walk = this.isTileWalkable(world, worldMap, cTx, lastCheckTy, blockedTiles);
            if (!orth1Walk || !orth2Walk) {
              validMove = false;
              break;
            }
          }
        }
        lastCheckTx = cTx;
        lastCheckTy = cTy;
      }
    }

    if (!validMove) {
      this.handleUnreachablePath(brain, pos, stateComp);
      return 'blocked';
    }

    pos.x = nextX;
    pos.y = nextY;
    pos.targetX = targetX;
    pos.targetY = targetY;

    if (stateComp) {
      stateComp.state = 'walk';
      stateComp.direction =
        Math.abs(dx) > Math.abs(dy)
          ? dx > 0
            ? 'right'
            : 'left'
          : dy > 0
            ? 'down'
            : 'up';
    }

    BehaviorTreeExecutor.markMovedThisTick(entityId);

    if (
      brain.pathIndex === brain.path.length - 1 &&
      Math.hypot(targetX - pos.x, targetY - pos.y) <= arrivalDistancePx
    ) {
      brain.path = [];
      brain.pathIndex = 0;
      pos.targetX = undefined;
      pos.targetY = undefined;
      if (stateComp) {
        stateComp.state = 'idle';
      }
      return 'arrived';
    }

    return 'moving';
  }
}

export class AnimalMovementSystem implements System {
  public name = 'AnimalMovementSystem';
  public enabled = true;
  public priority = 24;

  public worldMap: WorldMap;
  public spatialGrid: { rebuild: (items: Array<{ id: number; x: number; y: number }>) => void } | null = null;

  constructor(
    worldMap: WorldMap,
    spatialGrid: { rebuild: (items: Array<{ id: number; x: number; y: number }>) => void } | null = null
  ) {
    this.worldMap = worldMap;
    this.spatialGrid = spatialGrid;
  }

  public reset(): void {
    // Trạng thái đường đi nằm trên từng AnimalBrainComponent
  }

  public update(world: ECSWorld, dt: number): void {
    const animals = world.query([
      AnimalComponent,
      AnimalBrainComponent,
      PositionComponent,
      HealthComponent,
    ]);

    for (const id of animals) {
      const hp = world.getComponent(id, HealthComponent)!;
      if (hp.isDead) continue;

      const brain = world.getComponent(id, AnimalBrainComponent)!;
      if (brain.pathRetryCooldown > 0) {
        brain.pathRetryCooldown = Math.max(0, brain.pathRetryCooldown - dt);
      }

      if (BehaviorTreeExecutor.hasMovedThisTick(id)) {
        continue;
      }

      if (
        typeof brain.destinationX === 'number' &&
        Number.isFinite(brain.destinationX) &&
        typeof brain.destinationY === 'number' &&
        Number.isFinite(brain.destinationY) &&
        (brain.state === 'wander' ||
          brain.state === 'flee' ||
          brain.state === 'forage' ||
          brain.state === 'hunt' ||
          brain.state === 'eat')
      ) {
        const arrivalDist =
          brain.state === 'hunt' || brain.state === 'eat' ? 18 : 6;
        const status = AnimalMovement.moveTowards(
          world,
          this.worldMap,
          id,
          brain.destinationX,
          brain.destinationY,
          dt,
          arrivalDist
        );
        if (status === 'arrived' && brain.state === 'wander') {
          brain.state = 'idle';
          brain.clearMovementTarget();
        } else if (status === 'arrived' && brain.state === 'flee') {
          brain.state = 'idle';
          brain.clearMovementTarget();
          brain.threatEntityId = null;
        }
      }
    }

    if (this.spatialGrid) {
      const positioned = world.query([PositionComponent]);
      const items: Array<{ id: number; x: number; y: number }> = [];
      for (let i = 0; i < positioned.length; i++) {
        const ent = positioned[i];
        const pos = world.getComponent(ent, PositionComponent)!;
        items.push({ id: ent, x: pos.x, y: pos.y });
      }
      this.spatialGrid.rebuild(items);
    }
  }
}
