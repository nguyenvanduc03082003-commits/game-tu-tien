import { Component } from '../../ecs/Component.ts';
import { ECSWorld } from '../../ecs/World.ts';
import { SeededRNG } from '../../core/SeededRNG.ts';
import { WorldMap } from '../world/WorldMap.ts';
import { TerrainType } from '../../config/terrains.config.ts';
import { PILL_DEFINITIONS } from '../../config/pills.config.ts';
import { PositionComponent, HealthComponent } from '../beings/BeingComponents.ts';
import { BuildingComponent } from '../factions/FactionComponents.ts';
import { InventoryComponent } from '../alchemy/InventoryComponent.ts';
import { AnimalComponent } from '../animals/AnimalComponents.ts';
import { AStarPathfinder } from '../ai/pathfinding/AStar.ts';

export interface ChestLoot { pillId: string; count: number }

export class TreasureChestComponent implements Component {
  public readonly schemaVersion = 1;
  public opened = false;
  constructor(public loot: ChestLoot[]) {}
}

const COMMON = ['kim_sang_dan', 'duong_tho_dan', 'kim_sang_dan', 'kim_sang_dan'];
const RARE = ['truc_co_dan', 'bao_linh_dan'];

export function generateTreasureChests(
  world: ECSWorld, map: WorldMap, rng: SeededRNG,
  avoidCenter?: { x: number; y: number; radiusPx: number }
): number[] {
  const target = Math.max(1, Math.min(8, Math.round(map.width * map.height / 129600 * 6)));
  const placed: number[] = [];
  const positions: { x: number; y: number }[] = [];
  const occupied = new Set<string>();
  const blockedBuildings = AStarPathfinder.getBlockedBuildingTiles(world, map);
  for (const id of world.query([PositionComponent, BuildingComponent])) {
    const pos = world.getComponent(id, PositionComponent)!;
    occupied.add(`${Math.floor(pos.x / map.tileSize)},${Math.floor(pos.y / map.tileSize)}`);
  }
  const minDistance = Math.max(48, Math.min(map.widthPixels, map.heightPixels) * 0.10);
  for (let tries = 0; placed.length < target && tries < target * 300; tries++) {
    const tx = rng.nextInt(2, map.width - 3);
    const ty = rng.nextInt(2, map.height - 3);
    const tile = map.getTile(tx, ty);
    if (!tile || tile.terrain === TerrainType.RIVER || tile.terrain === TerrainType.LAKE ||
        tile.terrain === TerrainType.OCEAN || occupied.has(`${tx},${ty}`) ||
        !AStarPathfinder.isTileWalkable(tx, ty, map, blockedBuildings, false)) continue;
    const x = (tx + 0.5) * map.tileSize;
    const y = (ty + 0.5) * map.tileSize;
    if (avoidCenter && Math.hypot(x - avoidCenter.x, y - avoidCenter.y) < avoidCenter.radiusPx) continue;
    if (positions.some(pos => Math.hypot(x - pos.x, y - pos.y) < minDistance)) continue;
    const first = rng.next() < 0.05 ? rng.choice(RARE) : rng.choice(COMMON);
    const loot: ChestLoot[] = [{ pillId: first, count: 1 }];
    if (rng.next() < 0.25) loot.push({ pillId: rng.choice(COMMON), count: 1 });
    const entity = world.createEntity();
    world.addComponent(entity, new PositionComponent(x, y, 0));
    world.addComponent(entity, new TreasureChestComponent(loot));
    occupied.add(`${tx},${ty}`);
    positions.push({ x, y });
    placed.push(entity);
  }
  return placed;
}

export function openTreasureChest(
  world: ECSWorld, chestId: number, actorId: number
): { success: boolean; reason: string; loot?: ChestLoot[] } {
  const chest = world.getComponent(chestId, TreasureChestComponent);
  const chestPos = world.getComponent(chestId, PositionComponent);
  const actorPos = world.getComponent(actorId, PositionComponent);
  const hp = world.getComponent(actorId, HealthComponent);
  if (!chest || !chestPos) return { success: false, reason: 'Rương không tồn tại' };
  if (chest.opened) return { success: false, reason: 'Rương đã mở' };
  if (!actorPos || !hp || hp.isDead || hp.current <= 0 || world.getComponent(actorId, AnimalComponent)) {
    return { success: false, reason: 'Người mở rương không hợp lệ' };
  }
  if (Math.hypot(chestPos.x - actorPos.x, chestPos.y - actorPos.y) > 24) {
    return { success: false, reason: 'Cần đến gần rương' };
  }
  const valid = chest.loot.length > 0 && chest.loot.length <= 2 && chest.loot.every(item =>
    PILL_DEFINITIONS[item.pillId] && Number.isSafeInteger(item.count) && item.count > 0 && item.count <= 2) &&
    chest.loot.reduce((sum, item) => sum + item.count, 0) <= 2;
  if (!valid) return { success: false, reason: 'Vật phẩm trong rương không hợp lệ' };
  const inventory = world.getComponent(actorId, InventoryComponent);
  const occupied = inventory ? [...inventory.pills.values()].reduce((a, b) => a + b, 0) : 0;
  const totalLoot = chest.loot.reduce((a, item) => a + item.count, 0);
  if (occupied + totalLoot > (inventory?.maxPills ?? 20)) {
    return { success: false, reason: 'Túi đan đã đầy' };
  }
  const recipient = inventory ?? world.addComponent(actorId, new InventoryComponent());
  for (const item of chest.loot) recipient.addPill(item.pillId, item.count);
  chest.opened = true;
  return { success: true, reason: 'Đã mở rương', loot: chest.loot.map(item => ({ ...item })) };
}
