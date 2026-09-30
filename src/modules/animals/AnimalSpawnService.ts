import { ANIMAL_SPECIES_LIST } from '../../config/animals/animal.catalog.ts';
import {
  ANIMAL_MAX_PER_SPECIES_POPULATION,
  ANIMAL_MAX_TOTAL_POPULATION,
  ANIMAL_SPAWN_MAX_ATTEMPT_MULTIPLIER,
} from '../../config/animals/animal.simulation.ts';
import {
  AnimalSex,
  AnimalSpeciesDefinition,
  AnimalSpeciesId,
} from '../../config/animals/animal.types.ts';
import { Entity } from '../../ecs/Entity.ts';
import { ECSWorld } from '../../ecs/World.ts';
import { TerrainType } from '../../config/terrains.config.ts';
import { AStarPathfinder } from '../ai/pathfinding/AStar.ts';
import { HealthComponent } from '../beings/BeingComponents.ts';
import { WorldMap } from '../world/WorldMap.ts';
import { AnimalComponent } from './AnimalComponents.ts';
import { AnimalFactory } from './AnimalFactory.ts';
import { AnimalMovement } from './AnimalMovement.ts';

function resolveRng(
  rng?: (() => number) | { next: () => number }
): () => number {
  if (!rng) return Math.random;
  if (typeof rng === 'function') return rng;
  return () => rng.next();
}

export interface AnimalPopulateOptions {
  avoidCenter?: { x: number; y: number; radiusPx: number };
  ensureBreedingPairs?: boolean;
  carnivoreRatio?: number;
}

export class AnimalSpawnService {
  /**
   * Chọn tập loài đặc trưng theo sinh cảnh thực tế của bản đồ và seed
   */
  private static pickSeedSpeciesPalette(
    worldMap: WorldMap,
    targetCount: number,
    rand: () => number
  ): { preyList: AnimalSpeciesDefinition[]; carnivoreList: AnimalSpeciesDefinition[] } {
    // 1. Quét các địa hình thực tế xuất hiện trên bản đồ
    const presentTerrains = new Set<TerrainType>();
    const totalTiles = worldMap.width * worldMap.height;
    for (let i = 0; i < totalTiles; i++) {
      const t = worldMap.getTileByIndex(i);
      if (t) presentTerrains.add(t.terrain);
    }

    const available = ANIMAL_SPECIES_LIST.filter(
      spec => spec.spawnWeight > 0 && spec.habitats.some(h => presentTerrains.has(h))
    );

    const preyPool = available.filter(s => s.diet === 'herbivore' || s.diet === 'omnivore');
    const carnivorePool = available.filter(s => s.diet === 'carnivore');

    // 2. Chọn 3 - 8 loài con mồi đặc trưng dựa trên ngân sách và độ đa dạng
    const numPrey = Math.min(preyPool.length, Math.max(2, Math.min(8, Math.floor(targetCount / 4))));
    const remainingPrey = [...preyPool];
    const selectedPrey: AnimalSpeciesDefinition[] = [];

    while (selectedPrey.length < numPrey && remainingPrey.length > 0) {
      let totalW = 0;
      for (const p of remainingPrey) totalW += p.spawnWeight;
      let roll = rand() * totalW;
      let chosenIdx = remainingPrey.length - 1;
      for (let i = 0; i < remainingPrey.length; i++) {
        roll -= remainingPrey[i].spawnWeight;
        if (roll <= 0) {
          chosenIdx = i;
          break;
        }
      }
      selectedPrey.push(remainingPrey[chosenIdx]);
      remainingPrey.splice(chosenIdx, 1);
    }

    // 3. Chọn 1 - 2 loài thú ăn thịt có con mồi tương ứng trong tập con mồi đã chọn
    const selectedPreyIds = new Set(selectedPrey.map(p => p.id));
    const matchingCarnivores = carnivorePool.filter(c =>
      c.preySpeciesIds.some(pid => selectedPreyIds.has(pid))
    );
    const candidateCarnivores = matchingCarnivores.length > 0 ? matchingCarnivores : carnivorePool;

    const numCarnivores = Math.min(candidateCarnivores.length, Math.max(1, Math.min(3, Math.floor(targetCount / 15))));
    const remainingCarnivores = [...candidateCarnivores];
    const selectedCarnivores: AnimalSpeciesDefinition[] = [];

    while (selectedCarnivores.length < numCarnivores && remainingCarnivores.length > 0) {
      let totalW = 0;
      for (const c of remainingCarnivores) totalW += c.spawnWeight;
      let roll = rand() * totalW;
      let chosenIdx = remainingCarnivores.length - 1;
      for (let i = 0; i < remainingCarnivores.length; i++) {
        roll -= remainingCarnivores[i].spawnWeight;
        if (roll <= 0) {
          chosenIdx = i;
          break;
        }
      }
      selectedCarnivores.push(remainingCarnivores[chosenIdx]);
      remainingCarnivores.splice(chosenIdx, 1);
    }

    return { preyList: selectedPrey, carnivoreList: selectedCarnivores };
  }

  public static populate(
    world: ECSWorld,
    worldMap: WorldMap,
    count: number,
    rng?: (() => number) | { next: () => number },
    allowedSpeciesIds?: readonly AnimalSpeciesId[],
    options?: AnimalPopulateOptions
  ): Entity[] {
    if (count <= 0) return [];
    const rand = resolveRng(rng);

    let speciesPool: readonly AnimalSpeciesDefinition[];
    let carnivoreCap = 0;
    let carnivoresSpawned = 0;
    let preyCap = count;
    let preySpawned = 0;

    if (allowedSpeciesIds && allowedSpeciesIds.length > 0) {
      speciesPool = ANIMAL_SPECIES_LIST.filter(spec => allowedSpeciesIds.includes(spec.id));
      if (speciesPool.length !== new Set(allowedSpeciesIds).size) {
        throw new Error('Danh sách loài động vật khởi đầu chứa ID không hợp lệ.');
      }
      carnivoreCap = count;
      preyCap = count;
    } else {
      const { preyList, carnivoreList } = this.pickSeedSpeciesPalette(worldMap, count, rand);
      speciesPool = [...preyList, ...carnivoreList];
      const carnivoreRatio = options?.carnivoreRatio ?? 0.2;
      carnivoreCap = Math.max(0, Math.floor(count * carnivoreRatio));
      preyCap = count - carnivoreCap;
    }

    const existingAnimals = world.query([AnimalComponent, HealthComponent]);
    let totalLiving = 0;
    const speciesCounts = new Map<AnimalSpeciesId, number>();
    const speciesSexCount = new Map<AnimalSpeciesId, { male: number; female: number; lastTile?: { x: number; y: number } }>();

    for (const id of existingAnimals) {
      const hp = world.getComponent(id, HealthComponent)!;
      if (hp.isDead || hp.current <= 0) continue;
      const animal = world.getComponent(id, AnimalComponent)!;
      totalLiving++;
      speciesCounts.set(animal.speciesId, (speciesCounts.get(animal.speciesId) ?? 0) + 1);
      const sexRec = speciesSexCount.get(animal.speciesId) ?? { male: 0, female: 0 };
      if (animal.sex === 'male') sexRec.male++;
      else sexRec.female++;
      speciesSexCount.set(animal.speciesId, sexRec);
    }

    if (totalLiving >= ANIMAL_MAX_TOTAL_POPULATION) {
      return [];
    }

    const blockedTiles = AStarPathfinder.getBlockedBuildingTiles(world, worldMap);
    const maxAttempts = Math.max(1, Math.floor(count * ANIMAL_SPAWN_MAX_ATTEMPT_MULTIPLIER));
    const spawned: Entity[] = [];
    const tileSize = worldMap.tileSize;
    const margin = Math.min(4, Math.floor(Math.min(worldMap.width, worldMap.height) / 6));

    let attempts = 0;
    while (
      spawned.length < count &&
      totalLiving < ANIMAL_MAX_TOTAL_POPULATION &&
      attempts < maxAttempts
    ) {
      attempts++;

      // 1. Lọc loài có thể sinh dựa trên ngân sách con mồi/thú săn và trần mỗi loài
      const candidateSpecies = speciesPool.filter(spec => {
        const c = speciesCounts.get(spec.id) ?? 0;
        if (c >= ANIMAL_MAX_PER_SPECIES_POPULATION) return false;
        if (spec.diet === 'carnivore' && carnivoresSpawned >= carnivoreCap && preySpawned < preyCap) {
          return false;
        }
        if ((spec.diet === 'herbivore' || spec.diet === 'omnivore') && preySpawned >= preyCap && carnivoresSpawned < carnivoreCap) {
          return false;
        }
        return true;
      });

      if (candidateSpecies.length === 0) break;

      // 2. Chọn một loài theo trọng số sinh thái
      let totalWeight = 0;
      for (const spec of candidateSpecies) totalWeight += spec.spawnWeight;
      let roll = rand() * totalWeight;
      let chosen: AnimalSpeciesDefinition = candidateSpecies[candidateSpecies.length - 1];
      for (const spec of candidateSpecies) {
        roll -= spec.spawnWeight;
        if (roll <= 0) {
          chosen = spec;
          break;
        }
      }

      // 3. Tìm vị trí hợp lệ cho loài đã chọn (ưu tiên gần bạn cùng loài nếu đang tạo cặp đực/cái)
      const sexInfo = speciesSexCount.get(chosen.id);
      let tx = -1;
      let ty = -1;
      let foundPos = false;

      // Nếu đang tạo cá thể thứ 2 của loài, thử tìm gần cá thể thứ nhất (bán kính 3-8 ô)
      if (options?.ensureBreedingPairs && sexInfo && (sexInfo.male + sexInfo.female === 1) && sexInfo.lastTile) {
        for (let clusterAttempt = 0; clusterAttempt < 8; clusterAttempt++) {
          const cdx = Math.floor(rand() * 11) - 5;
          const cdy = Math.floor(rand() * 11) - 5;
          const ctx = sexInfo.lastTile.x + cdx;
          const cty = sexInfo.lastTile.y + cdy;
          if (ctx < margin || ctx >= worldMap.width - margin || cty < margin || cty >= worldMap.height - margin) continue;
          if (!AnimalMovement.isTileWalkable(world, worldMap, ctx, cty, blockedTiles)) continue;
          const cTile = worldMap.getTile(ctx, cty);
          if (!cTile || !chosen.habitats.includes(cTile.terrain)) continue;
          tx = ctx;
          ty = cty;
          foundPos = true;
          break;
        }
      }

      // Nếu không tìm được vị trí chùm, chọn ngẫu nhiên trên toàn bản đồ
      if (!foundPos) {
        const spanW = Math.max(1, worldMap.width - margin * 2);
        const spanH = Math.max(1, worldMap.height - margin * 2);
        tx = margin + Math.floor(rand() * spanW);
        ty = margin + Math.floor(rand() * spanH);

        if (!AnimalMovement.isTileWalkable(world, worldMap, tx, ty, blockedTiles)) {
          continue;
        }

        const tile = worldMap.getTile(tx, ty);
        if (!tile || !chosen.habitats.includes(tile.terrain)) {
          continue;
        }
      }

      const px = tx * tileSize + tileSize * 0.5;
      const py = ty * tileSize + tileSize * 0.5;

      // 4. Tránh vùng định cư khởi đầu của con người nếu có cấu hình
      if (options?.avoidCenter && attempts < maxAttempts * 0.8) {
        const distToCenter = Math.hypot(px - options.avoidCenter.x, py - options.avoidCenter.y);
        if (distToCenter < options.avoidCenter.radiusPx) {
          continue;
        }
      }

      // 5. Xác định giới tính (đảm bảo đủ cặp đực/cái cho vài loài phổ biến)
      let sex: AnimalSex;
      if (options?.ensureBreedingPairs && sexInfo) {
        if (sexInfo.male === 0 && sexInfo.female > 0) {
          sex = 'male';
        } else if (sexInfo.female === 0 && sexInfo.male > 0) {
          sex = 'female';
        } else {
          sex = rand() < 0.5 ? 'male' : 'female';
        }
      } else {
        sex = rand() < 0.5 ? 'male' : 'female';
      }

      const entity = AnimalFactory.spawn(world, chosen.id, px, py, {
        sex,
        lifeStage: 'adult',
        rng: rand,
      });

      spawned.push(entity);
      totalLiving++;
      speciesCounts.set(chosen.id, (speciesCounts.get(chosen.id) ?? 0) + 1);

      const updatedSex = speciesSexCount.get(chosen.id) ?? { male: 0, female: 0 };
      if (sex === 'male') updatedSex.male++;
      else updatedSex.female++;
      updatedSex.lastTile = { x: tx, y: ty };
      speciesSexCount.set(chosen.id, updatedSex);

      if (chosen.diet === 'carnivore') {
        carnivoresSpawned++;
      } else {
        preySpawned++;
      }
    }

    return spawned;
  }
}
