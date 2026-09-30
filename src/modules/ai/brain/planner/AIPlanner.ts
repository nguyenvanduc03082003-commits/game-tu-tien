import { selectSocialCandidate } from '../../../social/SocialDecisionService.ts';
import { SpatialGrid } from '../../../../core/SpatialGrid.ts';
import { ECSWorld } from '../../../../ecs/World.ts';
import { WorldMap } from '../../../world/WorldMap.ts';
import { QiGrid } from '../../../energy/QiGrid.ts';
import { TerrainType } from '../../../../config/terrains.config.ts';
import {
  PositionComponent,
  HungerComponent,
  DailyScheduleComponent,
  MortalNeedsComponent,
  RaceComponent,
  HealthComponent,
  CorpseComponent,
  JobPreference,
  ChildcareComponent
} from '../../../beings/BeingComponents.ts';
import { CorpseAndGraveSystem } from '../../../beings/CorpseAndGraveSystem.ts';
import { PlantComponent } from '../../../flora/PlantComponents.ts';
import { InventoryComponent } from '../../../alchemy/InventoryComponent.ts';
import { CombatStatsComponent } from '../../../combat/CombatComponents.ts';
import {
  AIStrategicBrainComponent,
  AIPlannerComponent,
  PlanStep,
  StrategicGoalType,
  GodDecreeComponent
} from '../AIComponents.ts';
import { AStarPathfinder, Point2D } from '../../pathfinding/AStar.ts';
import { SmartObjectManager } from '../../smartobjects/SmartObjectManager.ts';
import { CommunityTaskBoard } from '../../community/CommunityTaskBoard.ts';
import { TimeManager } from '../../../../core/TimeManager.ts';
import { GrowthMindComponent } from '../../../talent/TalentComponents.ts';
import { getReadyExperiencesForReflection } from '../../../talent/MentalStateSystem.ts';
import { AnimalComponent } from '../../../animals/AnimalComponents.ts';
import { ConstructionSiteComponent, ResidenceComponent, BuildingComponent } from '../../../factions/FactionComponents.ts';
import { FactionFactory } from '../../../factions/FactionFactory.ts';
import { BUILDING_DEFINITIONS } from '../../../../config/factions.config.ts';
import { TreasureChestComponent } from '../../../treasure/TreasureChest.ts';
import { planProfessionWork } from '../../../professions/ProfessionService.ts';
import { FoundingIntentComponent } from '../../../factions/FactionComponents.ts';

export class AIPlanner {
  /**
   * Tạo chuỗi các bước hành động (Action Steps Queue) tương ứng với mục tiêu chiến lược
   * Tích hợp: Smart Objects & Affordances + Community Task Board + Utility AI
   */
  public static planForGoal(
    world: ECSWorld,
    entity: number,
    goal: StrategicGoalType,
    brain: AIStrategicBrainComponent,
    planner: AIPlannerComponent,
    worldMap: WorldMap,
    qiGrid: QiGrid,
    socialGrid?: SpatialGrid | null
  ): void {
    const pos = world.getComponent(entity, PositionComponent);
    if (!pos) return;

    // Tự động giải phóng đặt chỗ Smart Object cũ và task cũ nếu đổi mục tiêu
    const smartObjects = SmartObjectManager.getInstance();
    const taskBoard = CommunityTaskBoard.getInstance();

    if (planner.currentPlanGoal !== goal) {
      smartObjects.release(entity);
      taskBoard.releaseTask(entity);
      if (planner.currentPlanGoal === 'REFLECT_RECOVER') {
        const growth = world.getComponent(entity, GrowthMindComponent);
        if (growth) {
          for (const exp of growth.experiences) {
            exp.lockedByStep = false;
          }
        }
      }
    }

    planner.currentPlanGoal = goal;
    planner.currentStepIndex = 0;
    planner.stepElapsedTimer = 0;
    planner.replanRequested = false;
    planner.planFailureReason = undefined;

    const steps: PlanStep[] = [];

    switch (goal) {
      // =======================================================================
      // 1. PHỤNG MỆNH THẦN LINH (OBEY_DECREE)
      // =======================================================================
      case 'OBEY_DECREE': {
        const godDecreeComp = world.getComponent(entity, GodDecreeComponent);
        const decree = godDecreeComp?.decree || brain.activeDecree;

        if (!decree) {
          planner.failCurrentPlan('Không tìm thấy thánh chỉ hợp lệ');
          return;
        }

        if (decree.decreeType === 'relocate' && decree.targetPos) {
          steps.push({
            type: 'MOVE_TO',
            description: `Di chuyển tới vị trí phụng mệnh (${Math.round(decree.targetPos.x)}, ${Math.round(decree.targetPos.y)})`,
            targetPos: decree.targetPos
          });
          steps.push({
            type: 'IDLE_WAIT',
            description: 'Đã tới vị trí phụng mệnh, chờ lệnh tiếp theo',
            duration: 2.0
          });
        } else if (decree.decreeType === 'breakthrough') {
          const quietSpot = this.findHighQiSpot(pos, worldMap, qiGrid);
          steps.push({
            type: 'MOVE_TO',
            description: 'Phụng mệnh thần linh tìm nơi linh khí nồng đậm để phá cảnh',
            targetPos: quietSpot
          });
          steps.push({
            type: 'USE_PILL',
            description: 'Dùng đan dược phá cảnh (nếu có)'
          });
          steps.push({
            type: 'EXECUTE_BREAKTHROUGH',
            description: 'Phụng mệnh nhập định kích phát đột phá!',
            duration: 6.0
          });
        } else if (decree.decreeType === 'attack') {
          if (decree.targetEntityId != null) {
            steps.push({
              type: 'MOVE_TO',
              description: 'Hành quân áp sát mục tiêu phụng mệnh thảo phạt',
              targetEntityId: decree.targetEntityId
            });
            steps.push({
              type: 'ATTACK_TARGET',
              description: 'Thi hành thánh chỉ trảm sát mục tiêu',
              targetEntityId: decree.targetEntityId
            });
          } else if (decree.targetPos) {
            steps.push({
              type: 'MOVE_TO',
              description: 'Hành quân tuần tra tiễu trừ địch tại khu vực chỉ định',
              targetPos: decree.targetPos
            });
          }
        } else if (decree.decreeType === 'build') {
          const buildPos = decree.targetPos || { x: pos.x + 20, y: pos.y };
          steps.push({
            type: 'MOVE_TO',
            description: 'Tới công trường xây dựng theo thánh chỉ',
            targetPos: buildPos
          });
          steps.push({
            type: 'PERFORM_WORK',
            description: `Xây dựng kiến trúc [${decree.buildingType ?? 'Công trình'}]`,
            duration: 5.0,
            customData: { workType: 'build', buildingType: decree.buildingType }
          });
        } else {
          steps.push({
            type: 'PERFORM_WORK',
            description: 'Phụng mệnh thần linh lao động',
            duration: 4.0
          });
        }
        break;
      }

      // =======================================================================
      // 2. ĐỘT PHÁ CẢNH GIỚI (BREAKTHROUGH)
      // =======================================================================
      case 'BREAKTHROUGH': {
        const inv = world.getComponent(entity, InventoryComponent);
        const hasPill = inv && inv.pills.size > 0;

        // Ưu tiên Động Phủ bế quan thông qua Smart Objects, hoặc Linh Mạch cao nhất
        const caveObj = smartObjects.findBestAvailableObject(pos, 'cultivate_qi', 350, 'meditation_cave');
        let targetSpot: Point2D;

        if (caveObj) {
          smartObjects.reserve(caveObj.object.id, entity, caveObj.slotIndex, 'cultivate_qi');
          targetSpot = caveObj.interactionPos;
        } else {
          targetSpot = this.findHighQiSpot(pos, worldMap, qiGrid);
        }

        steps.push({
          type: 'MOVE_TO',
          description: 'Di chuyển đến Động Phủ / Linh Mạch an toàn để nhập định',
          targetPos: targetSpot
        });

        if (hasPill) {
          steps.push({
            type: 'USE_PILL',
            description: 'Phục dụng đan dược phụ trợ hộ thể tăng tỷ lệ thành công'
          });
        }

        steps.push({
          type: 'EXECUTE_BREAKTHROUGH',
          description: 'Dẫn lưu thiên địa linh khí, trùng kích bình cảnh cảnh giới!',
          duration: 6.0
        });
        break;
      }

      // =======================================================================
      // 3. BẾ QUAN TU LUYỆN TÍCH LŨY LINH LỰC (SECLUDED_CULTIVATION)
      // =======================================================================
      case 'SECLUDED_CULTIVATION': {
        const race = world.getComponent(entity, RaceComponent);
        const isBeast = race?.raceId === 'beast';

        // Tìm Smart Object Động Phủ hoặc đỉnh núi linh khí cao
        const caveObj = smartObjects.findBestAvailableObject(pos, 'cultivate_qi', 400);
        let targetSpot: Point2D;

        if (caveObj) {
          smartObjects.reserve(caveObj.object.id, entity, caveObj.slotIndex, 'cultivate_qi');
          targetSpot = caveObj.interactionPos;
        } else {
          targetSpot = this.findHighQiSpot(pos, worldMap, qiGrid);
        }

        if (isBeast) {
          steps.push({
            type: 'MOVE_TO',
            description: 'Tìm tới linh mạch đỉnh núi ngưng tụ yêu đan',
            targetPos: targetSpot
          });
          steps.push({
            type: 'MEDITATE_QI',
            description: 'Ngồi thiền thổ nạp nhật nguyệt tinh hoa',
            duration: 6.0
          });
          const wanderTarget = this.pickWanderTarget(pos, worldMap, 60, 120);
          steps.push({
            type: 'MOVE_TO',
            description: 'Đi tuần tra biên giới lãnh thổ linh thú',
            targetPos: wanderTarget
          });
          steps.push({
            type: 'IDLE_WAIT',
            description: 'Dừng chân cảnh giác quan sát xung quanh',
            duration: 2.0
          });
        } else {
          steps.push({
            type: 'MOVE_TO',
            description: 'Di chuyển đến nơi linh khí thanh tịnh để bế quan',
            targetPos: targetSpot
          });
          steps.push({
            type: 'MEDITATE_QI',
            description: 'Ngồi thiền vận chuyển đại chu thiên, luyện hóa linh khí',
            duration: 7.0
          });
          steps.push({
            type: 'PERFORM_WORK',
            description: 'Đứng dậy diễn võ luyện kiếm, tôi luyện chiêu thức',
            duration: 2.5,
            customData: { workType: 'practice_martial' }
          });
          const strollTarget = this.pickWanderTarget(pos, worldMap, 45, 95);
          steps.push({
            type: 'MOVE_TO',
            description: 'Tản bộ ngắm mây trôi nước chảy, cảm ngộ thiên địa đạo pháp',
            targetPos: strollTarget
          });
          steps.push({
            type: 'IDLE_WAIT',
            description: 'Tĩnh tâm nhập thần đốn ngộ',
            duration: 1.5
          });
        }
        break;
      }

      // =======================================================================
      // 4. SINH TỒN CẤP THIẾT (SURVIVE_VITAL)
      // =======================================================================
      case 'SURVIVE_VITAL': {
        const race = world.getComponent(entity, RaceComponent);
        const hunger = world.getComponent(entity, HungerComponent);
        const needs = world.getComponent(entity, MortalNeedsComponent);
        const isBeast = race?.raceId === 'beast';

        // A. Khát nước nguy cấp
        if (needs && needs.thirst < 35) {
          // Ưu tiên tìm Giếng Nước qua Smart Object Manager
          const well = smartObjects.findBestAvailableObject(pos, 'drink_water', 380, 'village_well');
          const waterShore = this.findNearestWaterShore(worldMap, pos, 350);

          if (well) {
            smartObjects.reserve(well.object.id, entity, well.slotIndex, 'drink_water');
            steps.push({
              type: 'MOVE_TO',
              description: 'Đi tới giếng nước thôn làng giải khát',
              targetPos: well.interactionPos
            });
            steps.push({
              type: 'INTERACT_BUILDING',
              description: 'Uống nước giếng ngọt mát',
              duration: 1.5,
              customData: { action: 'drink_well', smartObjectId: well.object.id }
            });
          } else if (waterShore) {
            steps.push({
              type: 'MOVE_TO',
              description: waterShore.terrain === TerrainType.RIVER ? 'Đi tới bờ sông vốc nước giải khát' : 'Đi tới ven hồ thanh khiết uống nước',
              targetPos: { x: waterShore.x, y: waterShore.y }
            });
            steps.push({
              type: 'INTERACT_BUILDING',
              description: 'Vốc ngụm nước trong lành xua tan cơn khát',
              duration: 1.5,
              customData: { action: 'drink_river', terrain: waterShore.terrain }
            });
          } else {
            steps.push({
              type: 'INTERACT_BUILDING',
              description: 'Hứng sương sớm trên ngọn cỏ uống tạm',
              duration: 1.0,
              customData: { action: 'drink_dew' }
            });
          }
        }
        // B. Cơn đói cào ruột
        else if (hunger && hunger.current < (isBeast ? 65 : 45)) {
          if (needs && needs.cookedMealCount > 0) {
            steps.push({
              type: 'INTERACT_BUILDING',
              description: 'Thưởng thức bữa cơm canh ấm nóng',
              duration: 2.0,
              customData: { action: 'eat_meal' }
            });
          } else if (needs && needs.rawFoodCount >= 1) {
            const cookSpot = smartObjects.findBestAvailableObject(pos, 'cook_meal', 300);
            if (cookSpot) {
              smartObjects.reserve(cookSpot.object.id, entity, cookSpot.slotIndex, 'cook_meal');
              steps.push({
                type: 'MOVE_TO',
                description: 'Tới bếp lửa trại nấu cơm canh',
                targetPos: cookSpot.interactionPos
              });
              steps.push({
                type: 'PERFORM_WORK',
                description: 'Nấu nướng thức ăn chín thơm lừng',
                duration: 2.5,
                customData: { action: 'cook', workType: 'cook', smartObjectId: cookSpot.object.id }
              });
            } else {
              // Ăn tạm thức ăn thô lót dạ
              steps.push({
                type: 'INTERACT_BUILDING',
                description: 'Dùng tạm lương khô lót dạ',
                duration: 1.5,
                customData: { action: 'eat_raw' }
              });
            }
          } else if (isBeast) {
            const prey = this.findPreyTarget(world, entity, pos, 300);

            if (prey !== null) {
              steps.push({
                type: 'MOVE_TO',
                description: 'Rình rập áp sát con mồi',
                targetEntityId: prey
              });
              steps.push({
                type: 'ATTACK_TARGET',
                description: 'Bật nhảy vồ mồi săn bắt lương thực',
                targetEntityId: prey
              });
            } else {
              const grazeSpot = this.pickWanderTarget(pos, worldMap, 45, 95);
              steps.push({
                type: 'MOVE_TO',
                description: 'Đi tới thảm cỏ xanh / bụi rậm kiếm ăn',
                targetPos: grazeSpot
              });
              steps.push({
                type: 'PERFORM_WORK',
                description: 'Gặm cỏ dại, đào rễ cây lót dạ',
                duration: 2.5,
                customData: { workType: 'graze' }
              });
            }
          } else {
            // Phàm nhân đói: Đi hái dâu rừng hoặc lùng sục kiếm thức ăn
            const food = this.findNearestFoodPlant(world, pos);
            if (food) {
              steps.push({
                type: 'MOVE_TO',
                description: 'Đi hái quả dại dâu rừng chống đói',
                targetPos: { x: food.x, y: food.y }
              });
              steps.push({
                type: 'COLLECT_RESOURCE',
                description: 'Thu hoạch quả rừng & dùng bữa',
                targetEntityId: food.plantEnt,
                duration: 1.5
              });
            } else {
              const forageSpot = this.pickWanderTarget(pos, worldMap, 50, 100);
              steps.push({
                type: 'MOVE_TO',
                description: 'Đi lùng sục kiếm nguồn thức ăn cứu sinh',
                targetPos: forageSpot
              });
              steps.push({
                type: 'PERFORM_WORK',
                description: 'Tìm kiếm rau rừng, đào củ dại',
                duration: 2.5,
                customData: { workType: 'graze' }
              });
            }
          }
        }
        // C. Buồn ngủ / Đến giờ ngủ ban đêm / Kiệt sức
        else if (needs) {
          const residence = world.getComponent(entity, ResidenceComponent);
          const eligibleBed = (obj: { entityId: number | null }): boolean => {
            if (obj.entityId === null) return false;
            const building = world.getComponent(obj.entityId, BuildingComponent);
            if (!building || building.isRuins || building.isUnderConstruction || building.currentDurability <= 0 ||
                (BUILDING_DEFINITIONS[building.buildingType].housingCapacity ?? 0) <= 0) return false;
            if (residence && building.settlementId !== residence.settlementId) return false;
            if (residence?.homeBuildingEntityId === obj.entityId) return true;
            const occupancy = FactionFactory.getHomeOccupancy(world, obj.entityId);
            return occupancy.occupied < occupancy.capacity;
          };
          const homeId = residence?.homeBuildingEntityId;
          const bed = (homeId !== null && homeId !== undefined
            ? smartObjects.findBestAvailableObject(pos, 'sleep_rest', 350, undefined,
              obj => obj.entityId === homeId && eligibleBed(obj)) : null) ??
            smartObjects.findBestAvailableObject(pos, 'sleep_rest', 350, undefined, eligibleBed);
          if (bed && smartObjects.reserve(bed.object.id, entity, bed.slotIndex, 'sleep_rest')) {
            if (residence && residence.homeBuildingEntityId !== bed.object.entityId && bed.object.entityId !== null) {
              FactionFactory.assignHome(world, entity, bed.object.entityId);
            }
            steps.push({
              type: 'MOVE_TO',
              description: 'Về nhà tranh ngả lưng nghỉ ngơi',
              targetPos: bed.interactionPos
            });
          }
          steps.push({
            type: 'SLEEP_REST',
            description: 'Ngủ say hồi phục nguyên khí',
            duration: 8.0
          });
        }
        // D. Trú bão sét
        else {
          const shelter = smartObjects.findBestAvailableObject(pos, 'sleep_rest', 350);
          if (shelter) {
            steps.push({
              type: 'MOVE_TO',
              description: 'Chạy vào mái hiên trú bão thiên lôi',
              targetPos: shelter.interactionPos
            });
            steps.push({
              type: 'IDLE_WAIT',
              description: 'Trú ẩn an toàn chờ giông bão qua đi',
              duration: 5.0
            });
          } else {
            const safeSpot = this.pickWanderTarget(pos, worldMap, 45, 90);
            steps.push({
              type: 'MOVE_TO',
              description: 'Tìm gốc cổ thụ / hang đá lánh nạn',
              targetPos: safeSpot
            });
            steps.push({
              type: 'IDLE_WAIT',
              description: 'Nép mình tránh sấm sét cuồng phong',
              duration: 4.0
            });
          }
        }
        break;
      }

      // =======================================================================
      // 5. TỰ VỆ & HUYẾT CHIẾN (COMBAT_DEFENSE)
      // =======================================================================
      case 'COMBAT_DEFENSE': {
        const stats = world.getComponent(entity, CombatStatsComponent);
        if (stats && stats.targetEntityId !== null) {
          steps.push({
            type: 'MOVE_TO',
            description: 'Áp sát mục tiêu vào cự ly vũ khí',
            targetEntityId: stats.targetEntityId
          });
          steps.push({
            type: 'ATTACK_TARGET',
            description: 'Tung chiêu huyết chiến hạ gục kẻ địch',
            targetEntityId: stats.targetEntityId
          });
        } else {
          planner.failCurrentPlan('Mục tiêu chiến đấu không tồn tại');
          return;
        }
        break;
      }

      // =======================================================================
      // 6. RÚT LUI THOÁT HIỂM (FLEE_DANGER)
      // =======================================================================
      case 'FLEE_DANGER': {
        const stats = world.getComponent(entity, CombatStatsComponent);
        let fleeTarget = this.pickWanderTarget(pos, worldMap, 80, 150);

        if (stats && stats.targetEntityId !== null) {
          const ePos = world.getComponent(stats.targetEntityId, PositionComponent);
          if (ePos) {
            const dx = pos.x - ePos.x;
            const dy = pos.y - ePos.y;
            const dist = Math.max(1, Math.hypot(dx, dy));
            const candidate: Point2D = {
              x: Math.max(24, Math.min(worldMap.width * worldMap.tileSize - 24, pos.x + (dx / dist) * 120)),
              y: Math.max(24, Math.min(worldMap.height * worldMap.tileSize - 24, pos.y + (dy / dist) * 120))
            };
            const tx = Math.floor(candidate.x / worldMap.tileSize);
            const ty = Math.floor(candidate.y / worldMap.tileSize);
            if (AStarPathfinder.isTileWalkable(tx, ty, worldMap)) {
              fleeTarget = candidate;
            }
          }
        }

        steps.push({
          type: 'FLEE_FROM_TARGET',
          description: 'Thi triển thân pháp cấp tốc tẩu thoát khỏi hung hiểm!',
          targetPos: fleeTarget
        });
        break;
      }

      // =======================================================================
      // 7. LAO ĐỘNG DÂN SINH & BẢNG VIỆC CỘNG ĐỒNG (LABOUR_WORK)
      // =======================================================================
      case 'LABOUR_WORK': {
        const schedule = world.getComponent(entity, DailyScheduleComponent);
        const job: JobPreference = schedule?.preferredJob ?? 'farmer';

        if (!taskBoard.getEntityTask(entity) && !world.hasComponent(entity, FoundingIntentComponent)) {
          const professionalSteps = planProfessionWork(world, entity, worldMap);
          if (professionalSteps) { steps.push(...professionalSteps); break; }
        }

        // 1. Kiểm tra Bảng Việc Cộng Đồng (Community Task Board)
        const communityTask = taskBoard.claimBestTask(entity, pos, job, world);

        if (communityTask) {
          steps.push({
            type: 'MOVE_TO',
            description: `Di chuyển thực thi: [${communityTask.title}]`,
            targetPos: communityTask.targetPos
          });
          steps.push({
            type: 'PERFORM_WORK',
            description: communityTask.title,
            duration: communityTask.duration,
            customData: {
              communityTaskId: communityTask.id,
              taskType: communityTask.type,
              workType: communityTask.type === 'chop_wood' ? 'chop_wood' :
                communityTask.type === 'cook_village_meal' ? 'cook' :
                communityTask.targetEntityId !== undefined &&
                  world.hasComponent(communityTask.targetEntityId, ConstructionSiteComponent) ? 'build' :
                communityTask.preferredJob === 'farmer' ? 'farm' : 'build',
              buildingEnt: communityTask.targetEntityId
            }
          });
          steps.push({
            type: 'IDLE_WAIT',
            description: 'Đánh giá thành quả lao động',
            duration: 1.2
          });
          break;
        }

        // 2. Nếu không có task trên bảng: Tìm kiếm Smart Object rảnh rỗi
        if (job === 'farmer') {
          const farmObj = smartObjects.findBestAvailableObject(pos, 'farm_work', 350);
          if (farmObj) {
            smartObjects.reserve(farmObj.object.id, entity, farmObj.slotIndex, 'farm_work');
            steps.push({
              type: 'MOVE_TO',
              description: 'Ra luống cày cấy ruộng lúa / vườn linh thảo',
              targetPos: farmObj.interactionPos
            });
            steps.push({
              type: 'PERFORM_WORK',
              description: 'Chăm sóc mùa màng, tưới tiêu nông nghiệp',
              duration: 4.5,
              customData: { workType: 'farm', smartObjectId: farmObj.object.id }
            });
          } else {
            // Chưa có ruộng: Khai hoang đất trống
            const wildPlot = this.pickWanderTarget(pos, worldMap, 45, 95);
            steps.push({
              type: 'MOVE_TO',
              description: 'Đi tới mảnh đất phì nhiêu khai hoang lập điền',
              targetPos: wildPlot
            });
            steps.push({
              type: 'PERFORM_WORK',
              description: 'Cày xới đất đai chuẩn bị mùa màng',
              duration: 4.0,
              customData: { workType: 'farm' }
            });
          }
        } else if (job === 'builder') {
          const repairObj = smartObjects.findBestAvailableObject(pos, 'repair_building', 350);
          if (repairObj) {
            smartObjects.reserve(repairObj.object.id, entity, repairObj.slotIndex, 'repair_building');
            steps.push({
              type: 'MOVE_TO',
              description: 'Tới tu sửa công trình kiến trúc',
              targetPos: repairObj.interactionPos
            });
            steps.push({
              type: 'PERFORM_WORK',
              description: 'Gõ búa đại tu công trình kiến trúc',
              duration: 4.5,
              customData: { workType: 'repair', buildingEnt: repairObj.object.entityId }
            });
          } else {
            const inspectPos = this.pickWanderTarget(pos, worldMap, 45, 90);
            steps.push({
              type: 'MOVE_TO',
              description: 'Đi kiểm tra khuôn viên, gia cố rào chắn',
              targetPos: inspectPos
            });
            steps.push({
              type: 'PERFORM_WORK',
              description: 'Đẽo gọt gỗ đá, chuẩn bị vật tư kiến thiết',
              duration: 3.5,
              customData: { workType: 'build' }
            });
          }
        } else if (job === 'cook' && (world.getComponent(entity, MortalNeedsComponent)?.rawFoodCount ?? 0) >= 1) {
          steps.push({ type: 'PERFORM_WORK', description: 'Chuẩn bị bữa cơm từ lương thực dự trữ', duration: 4, customData: { workType: 'cook' } });
        } else {
          // Gather supplies when cooking ingredients are unavailable.
          const woodsSpot = this.pickWanderTarget(pos, worldMap, 50, 110);
          steps.push({
            type: 'MOVE_TO',
            description: 'Đi vào bìa rừng tìm kiếm lâm sản & săn bắn',
            targetPos: woodsSpot
          });
          steps.push({
            type: 'PERFORM_WORK',
            description: 'Thu gom củi khô, hái nấm dại',
            duration: 3.0,
            customData: { workType: 'forage' }
          });
        }

        steps.push({
          type: 'IDLE_WAIT',
          description: 'Nghỉ ngơi lấy sức',
          duration: 1.5
        });
        break;
      }

      // =======================================================================
      // 8. GIAO LƯU & NGHỈ DƯỠNG (SOCIAL_RECREATE)
      // =======================================================================
      case 'SOCIAL_RECREATE': {
        const care=world.getComponent(entity,ChildcareComponent);
        if(care?.isChild && care.guardianEntityId!==null) {
          const guardian=care.guardianEntityId;const hp=world.getComponent(guardian,HealthComponent);
          if(hp&&!hp.isDead&&hp.current>0&&world.getComponent(guardian,PositionComponent)) {
            steps.push({type:'MOVE_TO',description:'Tìm về bên người chăm sóc',targetEntityId:guardian});
            steps.push({type:'IDLE_WAIT',description:'Vui chơi bên người thân',duration:3,customData:{socialWith:guardian}});
            break;
          }
        }
        const candidate = selectSocialCandidate(world, entity, socialGrid);
        const friendTarget = candidate ? { ent: candidate.entityId, name: candidate.name, relationType: candidate.relationType } : null;

        if (friendTarget) {
          const relationTitle = friendTarget.relationType === 'dao_companion' ? 'Đạo Lữ' :
                                friendTarget.relationType === 'master' ? 'Sư Tôn' :
                                friendTarget.relationType === 'disciple' ? 'Đồ Đệ' : 'Bằng Hữu';
          steps.push({
            type: 'MOVE_TO',
            description: `Tìm đến ${relationTitle} [${friendTarget.name}] để gặp gỡ`,
            targetEntityId: friendTarget.ent
          });
          steps.push({
            type: 'IDLE_WAIT',
            description: `Cùng ${relationTitle} [${friendTarget.name}] đàm đạo huyền cơ, uống trà ngộ đạo`,
            duration: 4.0,
            customData: { socialWith: friendTarget.ent }
          });
        } else {
          // Tìm bếp lửa trại để tụ họp ca múa hát
          const campfire = smartObjects.findBestAvailableObject(pos, 'warmth_social', 350, 'campfire');
          if (campfire) {
            smartObjects.reserve(campfire.object.id, entity, campfire.slotIndex, 'warmth_social');
            steps.push({
              type: 'MOVE_TO',
              description: 'Tụ tập quanh đống lửa ấm áp thôn làng',
              targetPos: campfire.interactionPos
            });
            steps.push({
              type: 'IDLE_WAIT',
              description: 'Trò chuyện tâm tình, ca múa bên đống lửa',
              duration: 4.5,
              customData: { socialAroundFire: true, smartObjectId: campfire.object.id }
            });
          } else {
            const villageSquare = this.pickWanderTarget(pos, worldMap, 35, 80);
            steps.push({
              type: 'MOVE_TO',
              description: 'Dạo bước đến bãi đất trống gặp gỡ lối xóm',
              targetPos: villageSquare
            });
            steps.push({
              type: 'IDLE_WAIT',
              description: 'Thư giãn ngắm cảnh hoàng hôn',
              duration: 3.0
            });
          }
        }
        break;
      }

      // =======================================================================
      // 8B. CHÔN CẤT NGƯỜI THÂN (BURY_KIN)
      // =======================================================================
      case 'BURY_KIN': {
        const targetCorpseId = brain.targetCorpseEntityId;
        const corpse = targetCorpseId !== null ? world.getComponent(targetCorpseId, CorpseComponent) : null;
        const corpsePos = targetCorpseId !== null ? world.getComponent(targetCorpseId, PositionComponent) : null;

        if (targetCorpseId !== null && corpse && corpsePos) {
          steps.push({
            type: 'MOVE_TO',
            description: `Chạy đến bên thi hài [${corpse.deceasedName}]`,
            targetPos: { x: corpsePos.x, y: corpsePos.y },
            targetEntityId: targetCorpseId
          });
          steps.push({
            type: 'COLLECT_RESOURCE',
            description: `Cõng thi hài [${corpse.deceasedName}]`,
            targetEntityId: targetCorpseId,
            duration: 1.0,
            customData: { action: 'pickup_corpse' }
          });
          const burialPlot = CorpseAndGraveSystem.getOrCreateBurialPlot(world, entity, worldMap);
          steps.push({
            type: 'MOVE_TO',
            description: `Đưa thi hài về Nghĩa Trang Thôn Làng`,
            targetPos: { x: burialPlot.x, y: burialPlot.y }
          });
          steps.push({
            type: 'PERFORM_WORK',
            description: `Đào huyệt, an táng mồ yên mả đẹp cho [${corpse.deceasedName}]`,
            duration: 3.0,
            customData: {
              action: 'bury_corpse',
              corpseEntityId: targetCorpseId,
              burialPos: burialPlot
            }
          });
        } else {
          steps.push({
            type: 'IDLE_WAIT',
            description: 'Tìm kiếm mộ phần',
            duration: 1.0
          });
        }
        break;
      }

      // =======================================================================
      // 8C. TĨNH TÂM SUY NGẪM & HÓA GIẢI BIẾN CỐ (REFLECT_RECOVER)
      // =======================================================================
      case 'REFLECT_RECOVER': {
        const growth = world.getComponent(entity, GrowthMindComponent);
        const currentDay = TimeManager.getInstance().getDate().totalDays;
        const ready = growth ? getReadyExperiencesForReflection(growth, currentDay) : [];

        if (ready.length > 0 && growth) {
          const targetExp = ready[0];
          for (const exp of growth.experiences) {
            exp.lockedByStep = exp.id === targetExp.id;
          }

          const quietObj =
            smartObjects.findBestAvailableObject(pos, 'cultivate_qi', 260) ??
            smartObjects.findBestAvailableObject(pos, 'sleep_rest', 260) ??
            smartObjects.findBestAvailableObject(pos, 'warmth_social', 260);

          if (quietObj) {
            const dist = Math.hypot(
              quietObj.interactionPos.x - pos.x,
              quietObj.interactionPos.y - pos.y
            );
            if (dist > 14) {
              steps.push({
                type: 'MOVE_TO',
                description: 'Tìm tới nơi thanh tịnh an toàn để suy ngẫm',
                targetPos: quietObj.interactionPos
              });
            }
          }

          steps.push({
            type: 'REFLECT_EXPERIENCE',
            description: `Tĩnh tâm suy ngẫm, hóa giải tâm cảnh (${targetExp.reason ?? targetExp.kind})`,
            duration: 1.0,
            customData: { experienceId: targetExp.id }
          });
        } else {
          steps.push({
            type: 'IDLE_WAIT',
            description: 'Tĩnh tâm điều tức',
            duration: 1.0
          });
        }
        break;
      }

      // =======================================================================
      // 9. DẠO BƯỚC DU NGOẠN (WANDER_SERENDIPITY)
      // =======================================================================
      case 'WANDER_SERENDIPITY':
      default: {
        const currentPills = world.getComponent(entity, InventoryComponent);
        const pillCount = currentPills ? [...currentPills.pills.values()].reduce((a, b) => a + b, 0) : 0;
        let nearestChest: number | null = null;
        let chestDistance = 160;
        if (pillCount < (currentPills?.maxPills ?? 20) - 1) {
          for (const chestId of world.query([PositionComponent, TreasureChestComponent])) {
            if (world.getComponent(chestId, TreasureChestComponent)!.opened) continue;
            const chestPos = world.getComponent(chestId, PositionComponent)!;
            const distance = Math.hypot(chestPos.x - pos.x, chestPos.y - pos.y);
            if (distance < chestDistance &&
                (distance <= 20 || AStarPathfinder.findPath(worldMap, world, pos, chestPos, true).length > 0)) {
              chestDistance = distance;
              nearestChest = chestId;
            }
          }
        }
        if (nearestChest !== null) {
          const chestPos = world.getComponent(nearestChest, PositionComponent)!;
          steps.push({ type: 'MOVE_TO', description: 'Tìm đến rương cổ',
            targetPos: { x: chestPos.x, y: chestPos.y }, targetEntityId: nearestChest });
          steps.push({ type: 'COLLECT_RESOURCE', description: 'Mở rương kho báu',
            targetEntityId: nearestChest, customData: { action: 'open_chest' } });
          break;
        }
        const wanderTarget = this.pickWanderTarget(pos, worldMap, 50, 120);
        steps.push({
          type: 'MOVE_TO',
          description: 'Thong thả du ngoạn cảm ngộ thiên địa cơ duyên',
          targetPos: wanderTarget
        });
        steps.push({
          type: 'IDLE_WAIT',
          description: 'Dừng chân ngắm mây trôi nước chảy, nghỉ ngơi lấy sức',
          duration: 2.0 + Math.random() * 1.5
        });
        break;
      }
    }

    planner.planRevision = (planner.planRevision || 0) + 1;
    planner.steps = steps;
    planner.planStatus = 'executing';
  }

  // ===========================================================================
  // HÀM TRỢ GIÚP TÌM ĐỊA ĐIỂM AN TOÀN & CHÍNH XÁC
  // ===========================================================================

  /**
   * Chọn một điểm đến dạo chơi / tuần tra hợp lệ, không vào biển sâu hoặc trong chân công trình
   */
  public static pickWanderTarget(
    pos: PositionComponent,
    worldMap: WorldMap,
    minDist: number = 50,
    maxDist: number = 120
  ): Point2D {
    const tileSize = worldMap.tileSize;
    const maxMapX = worldMap.width * tileSize - 24;
    const maxMapY = worldMap.height * tileSize - 24;

    for (let attempts = 0; attempts < 10; attempts++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = minDist + Math.random() * (maxDist - minDist);
      const testX = Math.max(24, Math.min(maxMapX, pos.x + Math.cos(angle) * dist));
      const testY = Math.max(24, Math.min(maxMapY, pos.y + Math.sin(angle) * dist));

      const tx = Math.floor(testX / tileSize);
      const ty = Math.floor(testY / tileSize);

      if (AStarPathfinder.isTileWalkable(tx, ty, worldMap)) {
        return { x: testX, y: testY };
      }
    }

    // Fallback: Tìm 8 ô lân cận của pos
    const curTx = Math.floor(pos.x / tileSize);
    const curTy = Math.floor(pos.y / tileSize);
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const nx = curTx + dx;
        const ny = curTy + dy;
        if (AStarPathfinder.isTileWalkable(nx, ny, worldMap)) {
          return {
            x: nx * tileSize + tileSize / 2,
            y: ny * tileSize + tileSize / 2
          };
        }
      }
    }

    return { x: pos.x, y: pos.y };
  }

  /**
  /**
   * Yêu tộc săn mồi tìm động vật lân cận (dựa vào AnimalComponent thay vì khớp tên)
   */
  private static findPreyTarget(
    world: ECSWorld,
    selfId: number,
    selfPos: PositionComponent,
    maxRadius: number
  ): number | null {
    const animals = world.query([PositionComponent, HealthComponent, AnimalComponent]);
    let nearest: number | null = null;
    let minDist = maxRadius;

    for (const other of animals) {
      if (other === selfId) continue;
      const hp = world.getComponent(other, HealthComponent);
      if (!hp || hp.isDead) continue;

      const otherPos = world.getComponent(other, PositionComponent);
      if (!otherPos) continue;

      const dist = Math.hypot(otherPos.x - selfPos.x, otherPos.y - selfPos.y);
      if (dist < minDist) {
        minDist = dist;
        nearest = other;
      }
    }
    return nearest;
  }

  /**
   * Quét tìm ô có linh khí cao nhất trong bán kính 25 ô (ưu tiên đỉnh núi, cao nguyên)
   */
  public static findHighQiSpot(pos: PositionComponent, worldMap: WorldMap, qiGrid: QiGrid): Point2D {
    const tileSize = worldMap.tileSize;
    const curTx = Math.floor(pos.x / tileSize);
    const curTy = Math.floor(pos.y / tileSize);
    let bestTx = curTx;
    let bestTy = curTy;
    let maxScore = -1;

    const radius = 25;
    const minX = Math.max(0, curTx - radius);
    const maxX = Math.min(worldMap.width - 1, curTx + radius);
    const minY = Math.max(0, curTy - radius);
    const maxY = Math.min(worldMap.height - 1, curTy + radius);

    // Quét mẫu cách bước (stride 2) để tăng tốc độ tính toán
    for (let ty = minY; ty <= maxY; ty += 2) {
      for (let tx = minX; tx <= maxX; tx += 2) {
        if (!AStarPathfinder.isTileWalkable(tx, ty, worldMap)) continue;

        const qTile = qiGrid.getTile(tx, ty);
        const tile = worldMap.getTile(tx, ty);
        if (!qTile || !tile) continue;

        let terrainBonus = 0;
        if (tile.terrain === TerrainType.MOUNTAIN) terrainBonus = 25;
        else if (tile.terrain === TerrainType.PLATEAU) terrainBonus = 15;
        else if (tile.terrain === TerrainType.HILL) terrainBonus = 8;

        const score = qTile.density * 1.2 + terrainBonus + Math.random() * 5;
        if (score > maxScore) {
          maxScore = score;
          bestTx = tx;
          bestTy = ty;
        }
      }
    }

    return {
      x: bestTx * tileSize + tileSize / 2,
      y: bestTy * tileSize + tileSize / 2
    };
  }

  private static findNearestFoodPlant(
    world: ECSWorld,
    selfPos: PositionComponent
  ): { x: number; y: number; plantEnt: number } | null {
    const plants = world.query([PositionComponent, PlantComponent]);
    let nearest: { x: number; y: number; plantEnt: number } | null = null;
    let minDist = 220;

    for (const pEnt of plants) {
      const pComp = world.getComponent(pEnt, PlantComponent)!;
      if (pComp.category !== 'food' || !pComp.hasFruit) continue;

      const pPos = world.getComponent(pEnt, PositionComponent)!;
      const dist = Math.hypot(pPos.x - selfPos.x, pPos.y - selfPos.y);
      if (dist < minDist) {
        minDist = dist;
        nearest = { x: pPos.x, y: pPos.y, plantEnt: pEnt };
      }
    }
    return nearest;
  }

  /**
   * Tìm vị trí bờ đất sát mép nước (thay vì vị trí chính giữa lòng sông/hồ)
   */
  public static findNearestWaterShore(
    worldMap: WorldMap,
    selfPos: PositionComponent,
    maxRadiusPx: number = 350
  ): { x: number; y: number; terrain: TerrainType } | null {
    const ts = worldMap.tileSize;
    const centerTX = Math.floor(selfPos.x / ts);
    const centerTY = Math.floor(selfPos.y / ts);
    const radiusTiles = Math.ceil(maxRadiusPx / ts);

    let nearest: { x: number; y: number; terrain: TerrainType } | null = null;
    let minDist = maxRadiusPx;

    const minX = Math.max(1, centerTX - radiusTiles);
    const maxX = Math.min(worldMap.width - 2, centerTX + radiusTiles);
    const minY = Math.max(1, centerTY - radiusTiles);
    const maxY = Math.min(worldMap.height - 2, centerTY + radiusTiles);

    for (let ty = minY; ty <= maxY; ty++) {
      for (let tx = minX; tx <= maxX; tx++) {
        const tile = worldMap.getTile(tx, ty);
        if (!tile) continue;

        if (tile.terrain === TerrainType.RIVER || tile.terrain === TerrainType.LAKE) {
          // Tìm ô đất liền (land) kế bên ô nước này
          const neighbors = [
            { x: tx + 1, y: ty },
            { x: tx - 1, y: ty },
            { x: tx, y: ty + 1 },
            { x: tx, y: ty - 1 }
          ];

          for (const n of neighbors) {
            const nTile = worldMap.getTile(n.x, n.y);
            if (nTile && AStarPathfinder.isTileWalkable(n.x, n.y, worldMap) && nTile.terrain !== TerrainType.RIVER && nTile.terrain !== TerrainType.LAKE && nTile.terrain !== TerrainType.OCEAN) {
              const worldX = n.x * ts + ts / 2;
              const worldY = n.y * ts + ts / 2;
              const dist = Math.hypot(worldX - selfPos.x, worldY - selfPos.y);
              if (dist < minDist) {
                minDist = dist;
                nearest = { x: worldX, y: worldY, terrain: tile.terrain };
              }
              break;
            }
          }
        }
      }
    }

    return nearest;
  }
}
