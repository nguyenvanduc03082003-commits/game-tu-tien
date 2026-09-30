import { System } from '../../ecs/System.ts';
import { ECSWorld } from '../../ecs/World.ts';
import { WorldMap } from '../world/WorldMap.ts';
import { TimeManager } from '../../core/TimeManager.ts';
import { EventBus } from '../../core/EventBus.ts';
import { WeatherType } from '../../config/weather.config.ts';
import { TerrainType } from '../../config/terrains.config.ts';
import {
  PositionComponent,
  HealthComponent,
  HungerComponent,
  CharacterStateComponent,
  RealmComponent,
  MortalNeedsComponent,
  DailyScheduleComponent,
  ChildcareComponent,
  NameComponent,
  SpiritualRootComponent,
  CultivationTechniqueComponent,
  TraitsComponent,
  LifespanComponent,
  CharacterHistoryComponent
} from '../beings/BeingComponents.ts';
import { BuildingComponent, ConstructionSiteComponent, ResidenceComponent, MemberComponent } from '../factions/FactionComponents.ts';
import { PlantComponent } from '../flora/PlantComponents.ts';
import { FactionFactory } from '../factions/FactionFactory.ts';
import { validateBuildingPlacement } from '../factions/BuildingPlacementRules.ts';
import { BuildingType } from '../../config/factions.config.ts';
import { getRandomSerendipityTechnique } from '../../config/techniques.config.ts';

/**
 * @deprecated Hệ thống AI phàm nhân đời đầu. Đã được thay thế hoàn toàn bởi ThreeTierAISystem (StrategicGoal + AIPlanner + BehaviorTree).
 */
export class MortalAISystem implements System {
  public name = 'MortalAISystem';
  public enabled = true;
  public priority = 21;

  private worldMap: WorldMap;
  private timeManager = TimeManager.getInstance();
  private eventBus = EventBus.getInstance();
  private accumulator: number = 0;

  constructor(worldMap: WorldMap) {
    this.worldMap = worldMap;
  }

  public update(world: ECSWorld, dt: number): void {
    this.accumulator += dt;
    if (this.accumulator < 0.4) return;
    const stepTime = this.accumulator;
    this.accumulator = 0;

    const date = this.timeManager.getDate();
    const timeOfDay = date.timeOfDay; // 0.0 đến 1.0 (0=sáng sớm, 0.5=trưa, 0.75=hoàng hôn, 0.85=đêm)
    const currentWeather = (typeof window !== 'undefined' ? (window as any)._currentWeather : undefined) ?? WeatherType.CLEAR;

    const mortals = world.query([
      PositionComponent,
      HealthComponent,
      HungerComponent,
      CharacterStateComponent,
      MortalNeedsComponent,
      DailyScheduleComponent
    ]);

    const buildings = world.query([PositionComponent, BuildingComponent]);
    const plants = world.query([PositionComponent, PlantComponent]);

    for (const ent of mortals) {
      const pos = world.getComponent(ent, PositionComponent)!;
      const hp = world.getComponent(ent, HealthComponent)!;
      const hunger = world.getComponent(ent, HungerComponent)!;
      const stateComp = world.getComponent(ent, CharacterStateComponent)!;
      const needs = world.getComponent(ent, MortalNeedsComponent)!;
      const schedule = world.getComponent(ent, DailyScheduleComponent)!;
      const childcare = world.getComponent(ent, ChildcareComponent);
      const realm = world.getComponent(ent, RealmComponent);

      if (hp.isDead) continue;
      // Tu sĩ đang bế quan đột phá thì không can thiệp
      if (realm?.isBreakingThrough) continue;

      // 1. TIÊU HAO NHU CẦU THEO THỜI GIAN
      // - Khát nước: Tiêu hao nhanh hơn khi trời trưa nắng hoặc hạn hán
      const thirstDrain = (currentWeather === WeatherType.DROUGHT ? 1.8 : 1.0) * stepTime * 1.2;
      needs.thirst = Math.max(0, needs.thirst - thirstDrain);

      // - Buồn ngủ / Tiêu hao năng lượng khi làm việc
      const sleepDrain = (stateComp.state === 'farm' || stateComp.state === 'build' ? 1.5 : 0.8) * stepTime * 0.9;
      needs.sleep = Math.max(0, needs.sleep - sleepDrain);

      // - Điểm tinh thần / Giải trí
      needs.recreation = Math.max(0, needs.recreation - 0.7 * stepTime);

      // Tính thời gian cá nhân hóa dựa trên chronotypeOffset để tạo sự đa dạng tự nhiên
      const adjustedTime = (timeOfDay + schedule.chronotypeOffset + 1.0) % 1.0;

      // =========================================================================
      // MỨC ƯU TIÊN 1: THỜI TIẾT KHẮC NGHIỆT (Mưa Dông Bão Sét / Tuyết Rơi) -> TRÚ ẨN
      // =========================================================================
      const isSevereWeather = currentWeather === WeatherType.THUNDERSTORM || currentWeather === WeatherType.SNOW;
      if (isSevereWeather && schedule.currentActivity !== 'sleep') {
        const shelter = this.findNearestBuilding(world, buildings, pos, ['thatched_hut', 'meditation_cave', 'sect_hall']);
        if (shelter) {
          if (shelter.dist <= 18) {
            schedule.currentActivity = 'seek_shelter';
            stateComp.state = 'idle';
            continue;
          } else {
            this.moveToward(pos, stateComp, shelter.x, shelter.y, 'seek_shelter');
            continue;
          }
        }
      }

      // =========================================================================
      // MỨC ƯU TIÊN 2: ĐÊM TỐI HOẶC KIỆT SỨC -> NGỦ NGHỈ (SLEEP)
      // =========================================================================
      const isNightTime = adjustedTime >= 0.84 || adjustedTime <= 0.16;
      const isExhausted = needs.sleep < 20;

      if (isNightTime || isExhausted) {
        // Tìm nhà tranh của mình hoặc nhà tranh gần nhất, hoặc lửa trại
        const bed = this.findNearestBuilding(world, buildings, pos, ['thatched_hut', 'campfire']);
        if (bed) {
          if (bed.dist <= 16) {
            schedule.currentActivity = 'sleep';
            stateComp.state = 'sleep';
            // Ngủ hồi phục năng lượng và hồi máu
            needs.sleep = Math.min(100, needs.sleep + 14 * stepTime);
            hp.current = Math.min(hp.max, hp.current + 3 * stepTime);
            continue;
          } else {
            this.moveToward(pos, stateComp, bed.x, bed.y, 'sleep');
            continue;
          }
        } else {
          // Không có nhà: Ngủ tạm tại chỗ
          schedule.currentActivity = 'sleep';
          stateComp.state = 'sleep';
          needs.sleep = Math.min(100, needs.sleep + 8 * stepTime);
          continue;
        }
      } else if (schedule.currentActivity === 'sleep' && needs.sleep >= 85) {
        // Thức dậy sau giấc ngủ đủ đầy
        schedule.currentActivity = 'idle';
        stateComp.state = 'idle';
      }

      // =========================================================================
      // MỨC ƯU TIÊN 3: CƠN KHÁT NƯỚC (THIRST < 35) -> TÌM GIẾNG NƯỚC UỐNG
      // =========================================================================
      if (needs.thirst < 35) {
        const well = this.findNearestBuilding(world, buildings, pos, ['village_well']);
        if (well) {
          if (well.dist <= 16) {
            schedule.currentActivity = 'drink';
            stateComp.state = 'idle';
            needs.thirst = 100;
            this.eventBus.emit('activity:feedback', {
              entityId: ent,
              text: 'Uống Nước Giếng 🪣',
              color: '#38bdf8'
            });
            continue;
          } else {
            this.moveToward(pos, stateComp, well.x, well.y, 'drink');
            continue;
          }
        } else {
          // Khi chưa có giếng nước: Tìm nguồn nước tự nhiên (đầm lầy, suối, cỏ cây ẩm ướt)
          const waterTile = this.findNearestWaterTile(pos);
          if (waterTile) {
            if (waterTile.dist <= 18) {
              schedule.currentActivity = 'drink';
              stateComp.state = 'idle';
              needs.thirst = Math.min(100, needs.thirst + 65);
              this.eventBus.emit('activity:feedback', {
                entityId: ent,
                text: 'Uống Nước Suối 💧',
                color: '#38bdf8'
              });
              continue;
            } else {
              this.moveToward(pos, stateComp, waterTile.x, waterTile.y, 'drink');
              continue;
            }
          } else if (needs.thirst < 20) {
            // Không có nguồn nước gần: Hứng sương sớm trên lá cây
            schedule.currentActivity = 'drink';
            stateComp.state = 'idle';
            needs.thirst = Math.min(100, needs.thirst + 45);
            this.eventBus.emit('activity:feedback', {
              entityId: ent,
              text: 'Uống Sương Sớm 🌿💧',
              color: '#74c0fc'
            });
            continue;
          }
        }
      }

      // =========================================================================
      // MỨC ƯU TIÊN 4: CƠN ĐÓI & NẤU ĂN (HUNGER < 45) -> NẤU MÓN HOẶC DÙNG BỮA
      // =========================================================================
      if (hunger.current < 45) {
        // A. Nếu đã có sẵn cơm canh chín thơm ngon -> Dùng bữa ngay!
        if (needs.cookedMealCount > 0) {
          schedule.currentActivity = 'eat';
          stateComp.state = 'idle';
          needs.cookedMealCount--;
          hunger.current = Math.min(100, hunger.current + 75);
          needs.recreation = Math.min(100, needs.recreation + 25);
          hp.current = Math.min(hp.max, hp.current + 15);
          this.eventBus.emit('activity:feedback', {
            entityId: ent,
            text: 'Cơm Canh Ấm Nóng 🍚✨',
            color: '#facc15'
          });
          continue;
        }

        // B. Nếu có nguyên liệu thô (rawFoodCount >= 1) -> Đến Lửa Trại hoặc Bếp Nhà Tranh NẤU ĂN
        if (needs.rawFoodCount >= 1) {
          const cookSpot = this.findNearestBuilding(world, buildings, pos, ['campfire', 'thatched_hut']);
          if (cookSpot) {
            if (cookSpot.dist <= 18) {
              schedule.currentActivity = 'cook';
              stateComp.state = 'cook';
              needs.rawFoodCount--;
              needs.cookedMealCount += 2; // Nấu 1 phần thô thành 2 khẩu phần chín chất lượng
              this.eventBus.emit('activity:feedback', {
                entityId: ent,
                text: 'Nấu Nướng Thơm Lừng 🍳🔥',
                color: '#fb923c'
              });
              continue;
            } else {
              this.moveToward(pos, stateComp, cookSpot.x, cookSpot.y, 'cook');
              continue;
            }
          }
        }

        // C. Nếu không có nguyên liệu thô -> Đi hái quả dại hoặc gặt lúa
        const foodSource = this.findNearestFoodSource(world, plants, pos);
        if (foodSource) {
          if (foodSource.dist <= 16) {
            const pComp = world.getComponent(foodSource.plantEnt, PlantComponent);
            if (pComp && pComp.hasFruit) {
              pComp.hasFruit = false;
              pComp.growthProgress = 0.5;
              needs.rawFoodCount += 2;
              hunger.current = Math.min(100, hunger.current + 30);
              schedule.currentActivity = 'forage';
              this.eventBus.emit('activity:feedback', {
                entityId: ent,
                text: '+2 Thóc Lúa / Dâu Rừng 🍓',
                color: '#69db7c'
              });
            }
            continue;
          } else {
            this.moveToward(pos, stateComp, foodSource.x, foodSource.y, 'forage');
            continue;
          }
        }
      }

      // =========================================================================
      // MỨC ƯU TIÊN 5: NGƯỜI LỚN CHĂM SÓC TRẺ NHỎ (CHILDCARE)
      // =========================================================================
      if ((!childcare || !childcare.isChild) && needs.cookedMealCount > 0) {
        const hungryChild = this.findNearbyHungryChild(world, mortals, pos, 30);
        if (hungryChild) {
          const cPos = world.getComponent(hungryChild, PositionComponent)!;
          const dist = Math.hypot(cPos.x - pos.x, cPos.y - pos.y);
          if (dist <= 18) {
            const cHunger = world.getComponent(hungryChild, HungerComponent)!;
            cHunger.current = Math.min(100, cHunger.current + 60);
            needs.cookedMealCount--;
            schedule.currentActivity = 'care_child';
            stateComp.state = 'idle';
            this.eventBus.emit('activity:feedback', {
              entityId: hungryChild,
              text: 'Được Bón Cơm Ấm 👶🍼',
              color: '#f472b6'
            });
            continue;
          } else {
            this.moveToward(pos, stateComp, cPos.x, cPos.y, 'care_child');
            continue;
          }
        }
      }

      // =========================================================================
      // MỨC ƯU TIÊN 6: TRẺ EM VUI CHƠI TRONG LÀNG (CHILD PLAY)
      // =========================================================================
      if (childcare?.isChild) {
        schedule.currentActivity = 'recreate';
        stateComp.state = 'recreate';
        needs.recreation = Math.min(100, needs.recreation + 8 * stepTime);
        // Nhảy nhót quanh thôn
        if (Math.random() < 0.15) {
          pos.targetX = pos.x + (Math.random() * 40 - 20);
          pos.targetY = pos.y + (Math.random() * 40 - 20);
          stateComp.state = 'walk';
        }
        continue;
      }

      // =========================================================================
      // MỨC ƯU TIÊN 7: TỰ ĐỘNG XÂY DỰNG CÔNG TRÌNH THIẾU THỐN (AUTONOMOUS CONSTRUCTION)
      // =========================================================================
      // Nếu có công trình đang hư hại hoặc cư dân có sở thích làm thợ xây
      if (schedule.preferredJob === 'builder') {
        const damagedBuilding = this.findDamagedBuilding(world, buildings, pos, 120);
        if (damagedBuilding) {
          if (damagedBuilding.dist <= 20) {
            schedule.currentActivity = 'build';
            stateComp.state = 'build';
            const bComp = world.getComponent(damagedBuilding.ent, BuildingComponent)!;
            bComp.currentDurability = Math.min(bComp.maxDurability, bComp.currentDurability + 15 * stepTime);
            continue;
          } else {
            this.moveToward(pos, stateComp, damagedBuilding.x, damagedBuilding.y, 'build');
            continue;
          }
        } else if (adjustedTime >= 0.20 && adjustedTime < 0.70) {
          // Thôn làng có công trình đang thi công -> Tiếp tục thi công
          const site = this.findNearestUnderConstructionBuilding(world, buildings, pos, 180);
          if (site) {
            if (site.dist <= 20) {
              schedule.currentActivity = 'build';
              stateComp.state = 'build';
              const siteComp = world.getComponent(site.ent, ConstructionSiteComponent);
              if (siteComp) {
                siteComp.completedWorkTicks += stepTime * 20;
                if (siteComp.isCompleted) {
                  FactionFactory.completeBuilding(world, site.ent);
                }
              }
              continue;
            } else {
              this.moveToward(pos, stateComp, site.x, site.y, 'build');
              continue;
            }
          }

          // Nếu chưa có công trường nhưng thiếu công trình thiết yếu -> Khởi công xây mới
          const missingType = this.findMissingEssentialBuilding(world, buildings, pos);
          if (missingType) {
            schedule.currentActivity = 'build';
            stateComp.state = 'build';
            const bx = pos.x + (Math.random() * 32 - 16);
            const by = pos.y + (Math.random() * 32 - 16);
            const resComp = world.getComponent(ent, ResidenceComponent);
            const memberComp = world.getComponent(ent, MemberComponent);
            const fId = resComp?.factionId || memberComp?.factionId || '';
            const sId = resComp?.settlementId || '';
            if (validateBuildingPlacement(world, this.worldMap, missingType, bx, by).valid) {
              FactionFactory.spawnBuilding(world, missingType, fId, bx, by, sId, { underConstruction: true });
            }
            continue;
          }
        }
      }

      // =========================================================================
      // MỨC ƯU TIÊN 8: HOẠT ĐỘNG BAN NGÀY (LAO ĐỘNG SẢN XUẤT)
      // =========================================================================
      if (adjustedTime >= 0.20 && adjustedTime < 0.70) {
        if (schedule.preferredJob === 'farmer') {
          // Canh tác trên ruộng lúa
          const farm = this.findNearestBuilding(world, buildings, pos, ['mortal_farm', 'herb_garden']);
          if (farm) {
            if (farm.dist <= 18) {
              schedule.currentActivity = 'farm';
              stateComp.state = 'farm';
              needs.rawFoodCount = Math.min(5, needs.rawFoodCount + 0.1 * stepTime);
              continue;
            } else {
              this.moveToward(pos, stateComp, farm.x, farm.y, 'farm');
              continue;
            }
          }
        } else if (schedule.preferredJob === 'forager') {
          // Đi hái lượm trong rừng
          const foodSource = this.findNearestFoodSource(world, plants, pos);
          if (foodSource) {
            this.moveToward(pos, stateComp, foodSource.x, foodSource.y, 'forage');
            continue;
          }
        } else if (schedule.preferredJob === 'cook') {
          // Phụ trách nấu nướng cho làng tại lửa trại
          const campfire = this.findNearestBuilding(world, buildings, pos, ['campfire']);
          if (campfire) {
            if (campfire.dist <= 18) {
              schedule.currentActivity = 'cook';
              stateComp.state = 'cook';
              if (needs.rawFoodCount >= 1) {
                needs.rawFoodCount--;
                needs.cookedMealCount += 2;
              }
              continue;
            } else {
              this.moveToward(pos, stateComp, campfire.x, campfire.y, 'cook');
              continue;
            }
          }
        }
      }

      // =========================================================================
      // MỨC ƯU TIÊN 9: CHIỀU TỐI GIẢI TRÍ & GIAO LƯU QUANH LỬA TRẠI (0.70 - 0.85)
      // =========================================================================
      if (adjustedTime >= 0.70 && adjustedTime < 0.84) {
        const campfire = this.findNearestBuilding(world, buildings, pos, ['campfire', 'thatched_hut']);
        if (campfire) {
          if (campfire.dist <= 22) {
            schedule.currentActivity = 'recreate';
            stateComp.state = 'recreate';
            needs.recreation = Math.min(100, needs.recreation + 12 * stepTime);
            continue;
          } else {
            this.moveToward(pos, stateComp, campfire.x, campfire.y, 'recreate');
            continue;
          }
        }
      }

      // Mặc định: Dạo bước thong thả quanh làng
      if (stateComp.state === 'idle' && Math.random() < 0.2) {
        const maxX = this.worldMap.width * this.worldMap.tileSize - 16;
        const maxY = this.worldMap.height * this.worldMap.tileSize - 16;
        pos.targetX = Math.max(16, Math.min(maxX, pos.x + (Math.random() * 50 - 25)));
        pos.targetY = Math.max(16, Math.min(maxY, pos.y + (Math.random() * 50 - 25)));
        stateComp.state = 'walk';
        schedule.currentActivity = 'walk';
      }

      // 10. KỲ NGỘ CƠ DUYÊN (SERENDIPITY ENCOUNTER)
      this.checkSerendipityEncounter(world, ent, pos, stateComp, stepTime);
    }
  }

  private moveToward(
    pos: PositionComponent,
    stateComp: CharacterStateComponent,
    targetX: number,
    targetY: number,
    activity: any
  ): void {
    pos.targetX = targetX;
    pos.targetY = targetY;
    stateComp.state = 'walk';
    (stateComp as any).currentActivity = activity;
  }

  private findNearestBuilding(
    world: ECSWorld,
    buildings: number[],
    selfPos: PositionComponent,
    types: string[]
  ): { x: number; y: number; dist: number; ent: number } | null {
    let nearest: { x: number; y: number; dist: number; ent: number } | null = null;
    let minDist = Infinity;

    for (const bEnt of buildings) {
      const bComp = world.getComponent(bEnt, BuildingComponent)!;
      if (!types.includes(bComp.buildingType)) continue;

      const bPos = world.getComponent(bEnt, PositionComponent)!;
      const dist = Math.hypot(bPos.x - selfPos.x, bPos.y - selfPos.y);
      if (dist < minDist) {
        minDist = dist;
        nearest = { x: bPos.x, y: bPos.y, dist, ent: bEnt };
      }
    }
    return nearest;
  }

  private findDamagedBuilding(
    world: ECSWorld,
    buildings: number[],
    selfPos: PositionComponent,
    maxRadius: number
  ): { x: number; y: number; dist: number; ent: number } | null {
    let nearest: { x: number; y: number; dist: number; ent: number } | null = null;
    let minDist = maxRadius;

    for (const bEnt of buildings) {
      const bComp = world.getComponent(bEnt, BuildingComponent)!;
      if (bComp.currentDurability >= bComp.maxDurability) continue;

      const bPos = world.getComponent(bEnt, PositionComponent)!;
      const dist = Math.hypot(bPos.x - selfPos.x, bPos.y - selfPos.y);
      if (dist < minDist) {
        minDist = dist;
        nearest = { x: bPos.x, y: bPos.y, dist, ent: bEnt };
      }
    }
    return nearest;
  }

  private findNearestUnderConstructionBuilding(
    world: ECSWorld,
    buildings: number[],
    selfPos: PositionComponent,
    maxRadius: number
  ): { x: number; y: number; dist: number; ent: number } | null {
    let nearest: { x: number; y: number; dist: number; ent: number } | null = null;
    let minDist = maxRadius;

    for (const bEnt of buildings) {
      const bComp = world.getComponent(bEnt, BuildingComponent);
      if (!bComp || !bComp.isUnderConstruction) continue;

      const bPos = world.getComponent(bEnt, PositionComponent);
      if (!bPos) continue;
      const dist = Math.hypot(bPos.x - selfPos.x, bPos.y - selfPos.y);
      if (dist < minDist) {
        minDist = dist;
        nearest = { x: bPos.x, y: bPos.y, dist, ent: bEnt };
      }
    }
    return nearest;
  }

  private findNearestFoodSource(
    world: ECSWorld,
    plants: number[],
    selfPos: PositionComponent
  ): { x: number; y: number; dist: number; plantEnt: number } | null {
    let nearest: { x: number; y: number; dist: number; plantEnt: number } | null = null;
    let minDist = 220;

    for (const pEnt of plants) {
      const pComp = world.getComponent(pEnt, PlantComponent)!;
      if (pComp.category !== 'food' || !pComp.hasFruit) continue;

      const pPos = world.getComponent(pEnt, PositionComponent)!;
      const dist = Math.hypot(pPos.x - selfPos.x, pPos.y - selfPos.y);
      if (dist < minDist) {
        minDist = dist;
        nearest = { x: pPos.x, y: pPos.y, dist, plantEnt: pEnt };
      }
    }
    return nearest;
  }

  private findNearbyHungryChild(
    world: ECSWorld,
    mortals: number[],
    adultPos: PositionComponent,
    maxRadius: number
  ): number | null {
    let nearestChild: number | null = null;
    let minDist = maxRadius;

    for (const mEnt of mortals) {
      const childcare = world.getComponent(mEnt, ChildcareComponent);
      if (!childcare || !childcare.isChild) continue;

      const hunger = world.getComponent(mEnt, HungerComponent);
      if (!hunger || hunger.current >= 45) continue;

      const cPos = world.getComponent(mEnt, PositionComponent)!;
      const dist = Math.hypot(cPos.x - adultPos.x, cPos.y - adultPos.y);
      if (dist < minDist) {
        minDist = dist;
        nearestChild = mEnt;
      }
    }
    return nearestChild;
  }

  private findNearestWaterTile(pos: PositionComponent): { x: number; y: number; dist: number } | null {
    const curX = Math.floor(pos.x / this.worldMap.tileSize);
    const curY = Math.floor(pos.y / this.worldMap.tileSize);
    const searchRadius = 12;
    let nearest: { x: number; y: number; dist: number } | null = null;
    let minDist = Infinity;

    for (let dy = -searchRadius; dy <= searchRadius; dy++) {
      for (let dx = -searchRadius; dx <= searchRadius; dx++) {
        const tx = curX + dx;
        const ty = curY + dy;
        const tile = this.worldMap.getTile(tx, ty);
        if (tile && (tile.terrain === TerrainType.SWAMP || tile.moisture > 0.65)) {
          const worldX = tx * this.worldMap.tileSize + this.worldMap.tileSize / 2;
          const worldY = ty * this.worldMap.tileSize + this.worldMap.tileSize / 2;
          const dist = Math.hypot(worldX - pos.x, worldY - pos.y);
          if (dist < minDist) {
            minDist = dist;
            nearest = { x: worldX, y: worldY, dist };
          }
        }
      }
    }
    return nearest;
  }

  private findMissingEssentialBuilding(
    world: ECSWorld,
    buildings: number[],
    selfPos: PositionComponent
  ): BuildingType | null {
    const checkRadius = 180;
    let hasCampfire = false;
    let hasWell = false;
    let hasHut = false;
    let hasFarm = false;

    for (const bEnt of buildings) {
      const bComp = world.getComponent(bEnt, BuildingComponent)!;
      const bPos = world.getComponent(bEnt, PositionComponent)!;
      const dist = Math.hypot(bPos.x - selfPos.x, bPos.y - selfPos.y);
      if (dist <= checkRadius) {
        if (bComp.buildingType === 'campfire') hasCampfire = true;
        if (bComp.buildingType === 'village_well') hasWell = true;
        if (bComp.buildingType === 'thatched_hut') hasHut = true;
        if (bComp.buildingType === 'mortal_farm') hasFarm = true;
      }
    }

    if (!hasCampfire) return 'campfire';
    if (!hasWell) return 'village_well';
    if (!hasHut) return 'thatched_hut';
    if (!hasFarm) return 'mortal_farm';
    return null;
  }

  private checkSerendipityEncounter(
    world: ECSWorld,
    ent: number,
    _pos: PositionComponent,
    stateComp: CharacterStateComponent,
    stepTime: number
  ): void {
    // 1. Chỉ người có linh căn thức tỉnh mới cảm ứng được huyền cơ
    const root = world.getComponent(ent, SpiritualRootComponent);
    if (root && !root.canCultivate()) return;

    // 2. Chỉ xảy ra khi đang di chuyển dạo chơi, bế quan thiền định hoặc hái lượm
    const validStates = ['walk', 'meditate', 'recreate', 'forage'];
    if (!validStates.includes(stateComp.state)) return;

    const techComp = world.getComponent(ent, CultivationTechniqueComponent);
    const traits = world.getComponent(ent, TraitsComponent);

    // Xác suất cơ bản: Chưa có công pháp -> 0.4% mỗi giây; đã có công pháp -> 0.08% mỗi giây
    let chance = (techComp ? 0.0008 : 0.004) * stepTime;

    // Gia số từ các đặc điểm thiên phú vận khí
    if (traits) {
      const allTraits = [...traits.innateTraits, ...traits.techniqueTraits, ...traits.trainingTraits];
      if (allTraits.includes('khi_van_chi_tu')) chance += 0.015 * stepTime;
      if (allTraits.includes('phuc_duyen_tham_hau')) chance += 0.008 * stepTime;
      if (allTraits.includes('tien_nhan_chi_lo')) chance += 0.010 * stepTime;
      if (allTraits.includes('thien_linh_can')) chance += 0.005 * stepTime;
    }

    if (Math.random() >= chance) return;

    // KỲ NGỘ XUẤT HIỆN!
    const maxTier = (traits && traits.innateTraits.includes('khi_van_chi_tu')) ? 4 : 3;
    const foundTech = getRandomSerendipityTechnique(maxTier);
    const name = world.getComponent(ent, NameComponent)?.name ?? 'Tu sĩ';
    const life = world.getComponent(ent, LifespanComponent);
    const history = world.getComponent(ent, CharacterHistoryComponent);

    if (!techComp) {
      // Nhặt được ngọc giản bí kíp cổ xưa -> Nhập môn công pháp kỳ ngộ!
      world.addComponent(
        ent,
        new CultivationTechniqueComponent(
          foundTech.id,
          foundTech.name,
          foundTech.tier,
          foundTech.element,
          foundTech.description,
          'co_duyen',
          'Động Phủ Cổ Nhân',
          'nhap_mon',
          0
        )
      );

      if (traits && !traits.techniqueTraits.includes(foundTech.id)) {
        traits.techniqueTraits.push(foundTech.id);
      }

      if (history) {
        history.addRecord(
          life?.currentAge ?? 18,
          'technique',
          `Kỳ Ngộ Đắc Đạo [${foundTech.name}]`,
          `Vô tình tìm thấy ngọc giản cổ trong sơn động hoang vu, lĩnh ngộ công pháp [${foundTech.name}] phẩm cấp ${foundTech.tier}.`
        );
      }

      this.eventBus.emit('combat:floating_text', {
        entityId: ent,
        text: `Kỳ Ngộ: ${foundTech.name}! 🌌`,
        color: '#facc15',
        isCrit: true
      });

      this.eventBus.emit('chronicle:entry', {
        category: 'breakthrough',
        message: `🌌 [${name}] phúc duyên thâm hậu, trong lúc du ngoạn vô tình phát hiện tiên nhân di trạch, lĩnh ngộ công pháp [${foundTech.name}]!`,
        importance: 'high'
      });
    } else if (foundTech.tier > techComp.tier) {
      // Gặp cơ duyên cao cấp hơn công pháp hiện tại -> Chuyển tu công pháp thượng thừa!
      techComp.techniqueId = foundTech.id;
      techComp.techniqueName = foundTech.name;
      techComp.tier = foundTech.tier;
      techComp.element = foundTech.element;
      techComp.description = foundTech.description;
      techComp.source = 'co_duyen';
      techComp.sourceName = 'Thạch Bích Thượng Cổ Lĩnh Ngộ';
      // Giữ lại 30% kinh nghiệm
      techComp.masteryExp = Math.floor(techComp.masteryExp * 0.3);
      if (techComp.masteryExp >= 800) techComp.masteryLevel = 'dai_thanh';
      else if (techComp.masteryExp >= 300) techComp.masteryLevel = 'tieu_thanh';
      else if (techComp.masteryExp >= 100) techComp.masteryLevel = 'so_khuynh';
      else techComp.masteryLevel = 'nhap_mon';
      techComp.masteryMaxExp = techComp.calculateNextThreshold();

      if (traits) {
        traits.techniqueTraits = [foundTech.id];
      }

      if (history) {
        history.addRecord(
          life?.currentAge ?? 18,
          'technique',
          `Kỳ Ngộ Chuyển Tu [${foundTech.name}]`,
          `Quan sát thạch bích thượng cổ đốn ngộ, chuyển tu sang tuyệt học cao cấp [${foundTech.name}] phẩm cấp ${foundTech.tier}.`
        );
      }

      this.eventBus.emit('combat:floating_text', {
        entityId: ent,
        text: `Đốn Ngộ: ${foundTech.name}! 🌟`,
        color: '#eab308',
        isCrit: true
      });
    }
  }
}
