import { BUILDING_DEFINITIONS, BuildingType, getBuildingClearanceTiles } from '../../config/factions.config.ts';
import { ECSWorld } from '../../ecs/World.ts';
import { PositionComponent } from '../beings/BeingComponents.ts';
import { BuildingComponent } from './FactionComponents.ts';
import { WorldMap } from '../world/WorldMap.ts';
import { TerrainType } from '../world/TerrainType.ts';

export type BuildingPlacementFailure =
  | 'out_of_bounds'
  | 'blocked_terrain'
  | 'footprint_overlap'
  | 'too_close';

export type BuildingPlacementResult =
  | { valid: true; tileX: number; tileY: number }
  | { valid: false; reason: BuildingPlacementFailure; blockingBuildingId?: number };

interface TileRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/**
 * Validates a complete building footprint in tile space. Position x/y are the
 * top-left world-pixel anchor used by BuildingComponent and the pathfinder.
 */
export function validateBuildingPlacement(
  world: ECSWorld,
  worldMap: WorldMap,
  buildingType: BuildingType,
  x: number,
  y: number,
  ignoreBuildingId?: number
): BuildingPlacementResult {
  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    return { valid: false, reason: 'out_of_bounds' };
  }

  const tileSize = worldMap.tileSize;
  const tileX = Math.floor(x / tileSize);
  const tileY = Math.floor(y / tileSize);
  const definition = BUILDING_DEFINITIONS[buildingType];
  const candidate: TileRect = {
    left: tileX,
    top: tileY,
    right: tileX + definition.widthTiles - 1,
    bottom: tileY + definition.heightTiles - 1
  };

  if (candidate.left < 0 || candidate.top < 0 ||
      candidate.right >= worldMap.width || candidate.bottom >= worldMap.height) {
    return { valid: false, reason: 'out_of_bounds' };
  }

  for (let ty = candidate.top; ty <= candidate.bottom; ty++) {
    for (let tx = candidate.left; tx <= candidate.right; tx++) {
      const tile = worldMap.getTile(tx, ty);
      if (!tile || tile.terrain === TerrainType.OCEAN ||
          tile.terrain === TerrainType.LAKE || tile.terrain === TerrainType.RIVER) {
        return { valid: false, reason: 'blocked_terrain' };
      }
    }
  }

  const buildings = world.query([PositionComponent, BuildingComponent]);
  for (const entityId of buildings) {
    if (entityId === ignoreBuildingId) continue;
    const pos = world.getComponent(entityId, PositionComponent)!;
    const building = world.getComponent(entityId, BuildingComponent)!;
    const otherLeft = Math.floor(pos.x / tileSize);
    const otherTop = Math.floor(pos.y / tileSize);
    const other: TileRect = {
      left: otherLeft,
      top: otherTop,
      right: otherLeft + building.widthTiles - 1,
      bottom: otherTop + building.heightTiles - 1
    };

    const gapX = Math.max(0, candidate.left - other.right - 1, other.left - candidate.right - 1);
    const gapY = Math.max(0, candidate.top - other.bottom - 1, other.top - candidate.bottom - 1);
    const chebyshevGap = Math.max(gapX, gapY);
    const requiredGap = getBuildingClearanceTiles(buildingType, building.buildingType);
    const overlaps = candidate.left <= other.right && candidate.right >= other.left &&
      candidate.top <= other.bottom && candidate.bottom >= other.top;

    if (overlaps) {
      return { valid: false, reason: 'footprint_overlap', blockingBuildingId: entityId };
    }
    if (chebyshevGap < requiredGap) {
      return { valid: false, reason: 'too_close', blockingBuildingId: entityId };
    }

    if (building.buildingType === 'thatched_hut') {
      const doorX = other.left + Math.floor(building.widthTiles / 2);
      const doorY = other.bottom + 1;
      if (candidate.left <= doorX && candidate.right >= doorX &&
          candidate.top <= doorY && candidate.bottom >= doorY) {
        return { valid: false, reason: 'too_close', blockingBuildingId: entityId };
      }
    }
  }

  if (buildingType === 'thatched_hut') {
    const doorX = candidate.left + Math.floor(definition.widthTiles / 2);
    const doorY = candidate.bottom + 1;
    const doorTile = worldMap.getTile(doorX, doorY);
    if (!doorTile || doorTile.terrain === TerrainType.OCEAN || doorTile.terrain === TerrainType.LAKE || doorTile.terrain === TerrainType.RIVER) {
      return { valid: false, reason: 'blocked_terrain' };
    }
    for (const entityId of buildings) {
      if (entityId === ignoreBuildingId) continue;
      const pos = world.getComponent(entityId, PositionComponent)!;
      const otherBuilding = world.getComponent(entityId, BuildingComponent)!;
      const left = Math.floor(pos.x / tileSize);
      const top = Math.floor(pos.y / tileSize);
      if (doorX >= left && doorX < left + otherBuilding.widthTiles &&
          doorY >= top && doorY < top + otherBuilding.heightTiles) {
        return { valid: false, reason: 'too_close', blockingBuildingId: entityId };
      }
    }
  }

  return { valid: true, tileX, tileY };
}
