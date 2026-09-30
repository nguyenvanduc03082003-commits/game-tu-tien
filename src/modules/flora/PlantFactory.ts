import { ECSWorld } from '../../ecs/World.ts';
import { Entity } from '../../ecs/Entity.ts';
import { PositionComponent } from '../beings/BeingComponents.ts';
import { PlantComponent } from './PlantComponents.ts';
import { PLANT_DEFINITIONS, PlantDefinition } from '../../config/plants.config.ts';
import { WorldMap } from '../world/WorldMap.ts';
import { TerrainType } from '../../config/terrains.config.ts';
import { QiGrid } from '../energy/QiGrid.ts';

export class PlantFactory {
  public static canPlantAt(worldMap: WorldMap, x: number, y: number): boolean {
    const tx = Math.floor(x / worldMap.tileSize);
    const ty = Math.floor(y / worldMap.tileSize);
    if (!worldMap.isInBounds(tx, ty)) return false;
    const tile = worldMap.getTile(tx, ty);
    return Boolean(
      tile &&
      tile.terrain !== TerrainType.RIVER &&
      tile.terrain !== TerrainType.LAKE &&
      tile.terrain !== TerrainType.OCEAN
    );
  }

  public static findNearestLand(worldMap: WorldMap, x: number, y: number, radiusTiles: number = 8): { x: number; y: number } | null {
    if (this.canPlantAt(worldMap, x, y)) return { x, y };
    const tx = Math.floor(x / worldMap.tileSize);
    const ty = Math.floor(y / worldMap.tileSize);
    for (let radius = 1; radius <= radiusTiles; radius++) {
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== radius) continue;
          const px = (tx + dx + 0.5) * worldMap.tileSize;
          const py = (ty + dy + 0.5) * worldMap.tileSize;
          if (this.canPlantAt(worldMap, px, py)) return { x: px, y: py };
        }
      }
    }
    return null;
  }

  public static spawnPlant(
    world: ECSWorld,
    speciesId: string,
    x: number,
    y: number,
    initialStage: number | 'seedling' | 'growing' | 'mature' | 'flowering' = 2
  ): Entity {
    const def = PLANT_DEFINITIONS[speciesId] || PLANT_DEFINITIONS['oak_tree'];
    const entity = world.createEntity();

    world.addComponent(entity, new PositionComponent(x, y, 0));
    world.addComponent(entity, new PlantComponent(def.id, def.category, def.tier, initialStage));

    return entity;
  }

  /**
   * Sinh tài nguyên khởi đầu đảm bảo gần khu vực 12 lưu dân lập xóm (theo seed, hợp lệ, không đè nhau)
   */
  public static spawnGuaranteedHamletResources(
    world: ECSWorld,
    worldMap: WorldMap,
    centerLand: { x: number; y: number },
    rng: { next: () => number }
  ): void {
    const occupiedTiles = new Set<string>();
    // Đánh dấu các cây hiện có gần đó
    for (const ent of world.query([PositionComponent, PlantComponent])) {
      const p = world.getComponent(ent, PositionComponent)!;
      const tx = Math.floor(p.x / worldMap.tileSize);
      const ty = Math.floor(p.y / worldMap.tileSize);
      occupiedTiles.add(`${tx},${ty}`);
    }

    const guaranteed = [
      { speciesId: 'wild_fruit_tree', stage: 2 },
      { speciesId: 'berry_bush', stage: 2 },
      { speciesId: 'oak_tree', stage: 2 },
      { speciesId: 'oak_tree', stage: 2 },
      { speciesId: 'ngung_huyet_thao', stage: 2 },
    ];

    const centerTx = Math.floor(centerLand.x / worldMap.tileSize);
    const centerTy = Math.floor(centerLand.y / worldMap.tileSize);

    for (const item of guaranteed) {
      let placed = false;
      for (let attempt = 0; attempt < 25; attempt++) {
        const dx = Math.floor(rng.next() * 11) - 5;
        const dy = Math.floor(rng.next() * 11) - 5;
        if (Math.abs(dx) <= 1 && Math.abs(dy) <= 1) continue; // Tránh tâm điểm của dân làng
        const tx = centerTx + dx;
        const ty = centerTy + dy;
        const key = `${tx},${ty}`;
        if (occupiedTiles.has(key)) continue;

        const px = tx * worldMap.tileSize + worldMap.tileSize / 2;
        const py = ty * worldMap.tileSize + worldMap.tileSize / 2;
        if (!this.canPlantAt(worldMap, px, py)) continue;

        this.spawnPlant(world, item.speciesId, px, py, item.stage);
        occupiedTiles.add(key);
        placed = true;
        break;
      }
      if (!placed) {
        // Fallback ô gần nhất hợp lệ
        const fallback = this.findNearestLand(worldMap, centerLand.x, centerLand.y, 10);
        if (fallback && !occupiedTiles.has(`${Math.floor(fallback.x / 16)},${Math.floor(fallback.y / 16)}`)) {
          this.spawnPlant(world, item.speciesId, fallback.x, fallback.y, item.stage);
          occupiedTiles.add(`${Math.floor(fallback.x / 16)},${Math.floor(fallback.y / 16)}`);
        }
      }
    }
  }

  /**
   * Sinh thực vật tự nhiên theo bảng địa hình, nồng độ linh khí và ngân sách kiểm soát
   */
  public static generateInitialFlora(world: ECSWorld, worldMap: WorldMap, qiGrid: QiGrid, rng?: { next: () => number }): void {
    const tileSize = worldMap.tileSize;
    const w = worldMap.width;
    const h = worldMap.height;
    const randFn = () => (rng ? rng.next() : Math.random());

    // Hệ số điều tiết mật độ theo diện tích: map 360x360 có trần tối đa ~2500 cây
    const area = w * h;
    const densityFactor = area > 15000 ? Math.max(0.18, 12000 / area) : 1.0;
    const maxFlora = Math.min(2500, Math.floor(area * 0.025));
    let floraCount = 0;

    // Bộ nhớ tọa độ ô đã có thực vật để không trùng vị trí
    const occupiedTiles = new Set<string>();

    // Mật độ cơ bản theo địa hình (Rừng rậm dày nhất, rồi đến Đầm lầy, Đồi, Đồng bằng, Núi, Cao nguyên)
    const TERRAIN_BASE_CHANCE: Partial<Record<TerrainType, number>> = {
      [TerrainType.DENSE_FOREST]: 0.42 * densityFactor,
      [TerrainType.SWAMP]: 0.22 * densityFactor,
      [TerrainType.HILL]: 0.14 * densityFactor,
      [TerrainType.PLAIN]: 0.12 * densityFactor,
      [TerrainType.MOUNTAIN]: 0.12 * densityFactor,
      [TerrainType.PLATEAU]: 0.08 * densityFactor,
    };

    // Gom danh mục loài theo địa hình từ PLANT_DEFINITIONS
    const allDefs = Object.values(PLANT_DEFINITIONS);
    const speciesByTerrain = new Map<TerrainType, PlantDefinition[]>();

    for (const def of allDefs) {
      if (def.category === 'divine_herb') continue; // Thần dược sinh theo tỷ lệ độc lập cực hiếm
      for (const t of def.preferredTerrain) {
        const list = speciesByTerrain.get(t) ?? [];
        list.push(def);
        speciesByTerrain.set(t, list);
      }
    }

    for (let y = 1; y < h - 1; y++) {
      if (floraCount >= maxFlora) break;
      for (let x = 1; x < w - 1; x++) {
        if (floraCount >= maxFlora) break;

        const tile = worldMap.getTile(x, y);
        if (!tile) continue;
        if (tile.terrain === TerrainType.RIVER || tile.terrain === TerrainType.LAKE || tile.terrain === TerrainType.OCEAN) continue;

        const baseChance = TERRAIN_BASE_CHANCE[tile.terrain];
        if (!baseChance) continue;

        const r = randFn();
        const qiTile = qiGrid.getTile(x, y);
        const qiDensity = qiTile?.density ?? 0;
        const posX = x * tileSize + tileSize / 2;
        const posY = y * tileSize + tileSize / 2;
        const tileKey = `${x},${y}`;

        // 1. Kiểm tra tỷ lệ cực hiếm: Thần Dược Cực Phẩm (0.0001% = 0.000001)
        if (r < 0.000001) {
          const divineId = randFn() < 0.5 ? 'cuu_diep_chi_lan' : 'hon_don_lien';
          this.spawnPlant(world, divineId, posX, posY, 3);
          occupiedTiles.add(tileKey);
          floraCount++;
          console.log(`🌟 THIÊN THẢO GIÁNG THẾ! Thần Dược [${divineId}] đã xuất hiện tại (${x}, ${y})!`);
          continue;
        }

        // 2. Kiểm tra xác suất sinh thực vật tại ô này
        if (r >= baseChance) continue;
        if (occupiedTiles.has(tileKey)) continue;

        const candidateSpecies = (speciesByTerrain.get(tile.terrain) ?? []).filter(spec => {
          if (spec.naturalSpawnWeight <= 0) return false;
          // Điều kiện linh khí tối thiểu cho Linh Dược
          if (spec.tier === 1 && qiDensity < 30) return false;
          if (spec.tier === 2 && qiDensity < 50) return false;
          if (spec.tier >= 3 && qiDensity < 70) return false;
          return true;
        });

        if (candidateSpecies.length === 0) continue;

        // Chọn loài theo trọng số naturalSpawnWeight
        let totalWeight = 0;
        for (const spec of candidateSpecies) totalWeight += spec.naturalSpawnWeight;
        let roll = randFn() * totalWeight;
        let chosen: PlantDefinition = candidateSpecies[candidateSpecies.length - 1];
        for (const spec of candidateSpecies) {
          roll -= spec.naturalSpawnWeight;
          if (roll <= 0) {
            chosen = spec;
            break;
          }
        }

        // Cây gỗ có độ lệch nhẹ cho tự nhiên
        const offX = chosen.category === 'tree' ? (randFn() * 4 - 2) : 0;
        const offY = chosen.category === 'tree' ? (randFn() * 4 - 2) : 0;
        this.spawnPlant(world, chosen.id, posX + offX, posY + offY, 2);
        occupiedTiles.add(tileKey);
        floraCount++;
      }
    }
  }
}
