import { ECSWorld } from '../../../ecs/World.ts';
import { PositionComponent } from '../../beings/BeingComponents.ts';
import { BuildingComponent } from '../../factions/FactionComponents.ts';
import { BUILDING_DEFINITIONS } from '../../../config/factions.config.ts';
import { Point2D } from '../pathfinding/AStar.ts';

export type AffordanceType =
  | 'drink_water'       // Uống nước ngọt
  | 'sleep_rest'        // Ngủ nghỉ ấm áp
  | 'warmth_social'     // Sưởi ấm, ca múa, chuyện trò
  | 'cook_meal'         // Nấu cơm chín từ thức ăn thô
  | 'farm_work'         // Cày cấy, chăm bón, thu hoạch lúa
  | 'repair_building'   // Sửa chữa, gia cố công trình
  | 'cultivate_qi'      // Ngồi thiền hấp thu linh khí
  | 'harvest_plant'     // Thu hoạch dược liệu / quả dại
  | 'bury_corpse';      // An táng thi hài người thân

export interface SmartObjectSlot {
  index: number;
  occupantEntityId: number | null;
  offset: Point2D;
}

export interface SmartObjectData {
  id: string;                    // entityId dạng chuỗi hoặc tile key
  entityId: number | null;       // Nếu là entity trong ECSWorld
  objectType: string;            // 'campfire', 'thatched_hut', 'mortal_farm', 'village_well', 'qi_vein', v.v.
  pos: Point2D;
  capacity: number;
  affordances: Set<AffordanceType>;
  slots: SmartObjectSlot[];
  lastUsedTimestamp: number;
}

/**
 * HỆ THỐNG ĐỐI TƯỢNG THÔNG MINH & QUẢNG BÁ KHẢ NĂNG TƯƠNG TÁC (SMART OBJECTS & AFFORDANCES)
 * Áp dụng mô hình The Sims kết hợp Reservation System của RimWorld:
 * - Đối tượng tự quảng bá các hành động nó hỗ trợ (Affordance)
 * - Quản lý số lượng vị trí tối đa (Slots / Capacity)
 * - Khóa giữ chỗ (Reservation) để triệt tiêu hiện tượng 100 người dồn cục tranh giành
 * - Cung cấp tọa độ tương tác tỏa tròn (Radial Interaction Offsets)
 */
export class SmartObjectManager {
  private static instance: SmartObjectManager | null = null;

  public static getInstance(): SmartObjectManager {
    if (!this.instance) {
      this.instance = new SmartObjectManager();
    }
    return this.instance;
  }

  // Bảng đăng ký các Smart Objects theo objectId
  private objects: Map<string, SmartObjectData> = new Map();

  // Bảng tra cứu ngược: entityId -> objectId đã đặt chỗ
  private entityReservations: Map<number, { objectId: string; slotIndex: number; affordance: AffordanceType }> = new Map();

  public clear(): void {
    this.objects.clear();
    this.entityReservations.clear();
  }

  public getAllObjects(): SmartObjectData[] {
    return Array.from(this.objects.values());
  }

  /**
   * Đăng ký hoặc cập nhật một Smart Object từ công trình kiến trúc
   */
  public registerBuilding(buildingEnt: number, bComp: BuildingComponent, pos: PositionComponent): void {
    // Công trường đang thi công hoặc phế tích vô chủ không cung cấp các tiện ích sinh hoạt
    if (bComp.isUnderConstruction || bComp.isRuins) {
      return;
    }

    const objId = `building_${buildingEnt}`;
    const affordances = new Set<AffordanceType>();
    let capacity = 1;
    let radius = 22;

    switch (bComp.buildingType) {
      case 'campfire':
        affordances.add('warmth_social');
        affordances.add('cook_meal');
        capacity = 4;
        radius = 26;
        break;

      case 'thatched_hut':
        affordances.add('sleep_rest');
        affordances.add('warmth_social');
        capacity = 3;
        radius = 24;
        break;

      case 'mortal_farm':
      case 'herb_garden':
        affordances.add('farm_work');
        capacity = 3;
        radius = 28;
        break;

      case 'village_well':
        affordances.add('drink_water');
        capacity = 1;
        radius = 18;
        break;

      case 'meditation_cave':
      case 'sect_hall':
        affordances.add('cultivate_qi');
        affordances.add('sleep_rest');
        capacity = 2;
        radius = 24;
        break;

      case 'alchemy_chamber':
      case 'scripture_pavilion':
      case 'defense_array':
      default:
        affordances.add('repair_building');
        capacity = 2;
        radius = 22;
        break;
    }

    if (affordances.has('sleep_rest')) {
      capacity = BUILDING_DEFINITIONS[bComp.buildingType].housingCapacity ?? 0;
      if (capacity <= 0) affordances.delete('sleep_rest');
    }

    if (bComp.currentDurability < bComp.maxDurability) {
      affordances.add('repair_building');
    }

    // Residents use a shared doorway target for huts; capacity still limits
    // simultaneous occupancy, while pathfinding does not send them to a wall.
    const slots: SmartObjectSlot[] = [];
    for (let i = 0; i < capacity; i++) {
      const angle = (i / capacity) * Math.PI * 2;
      slots.push({
        index: i,
        occupantEntityId: null,
        offset: {
          x: bComp.buildingType === 'thatched_hut' ? bComp.widthTiles * 8 : Math.cos(angle) * radius,
          y: bComp.buildingType === 'thatched_hut' ? bComp.heightTiles * 16 + 10 : Math.sin(angle) * radius
        }
      });
    }

    this.objects.set(objId, {
      id: objId,
      entityId: buildingEnt,
      objectType: bComp.buildingType,
      pos: { x: pos.x, y: pos.y },
      capacity,
      affordances,
      slots,
      lastUsedTimestamp: Date.now()
    });
  }

  /**
   * Đăng ký Smart Object tự nhiên (bờ nước, mạch linh khí, cây ăn quả, v.v.)
   */
  public registerNaturalObject(
    objId: string,
    objectType: string,
    pos: Point2D,
    affordances: AffordanceType[],
    capacity: number = 1,
    radius: number = 20
  ): void {
    if (this.objects.has(objId)) return;

    const slots: SmartObjectSlot[] = [];
    for (let i = 0; i < capacity; i++) {
      const angle = (i / capacity) * Math.PI * 2;
      slots.push({
        index: i,
        occupantEntityId: null,
        offset: {
          x: Math.cos(angle) * radius,
          y: Math.sin(angle) * radius
        }
      });
    }

    this.objects.set(objId, {
      id: objId,
      entityId: null,
      objectType,
      pos: { x: pos.x, y: pos.y },
      capacity,
      affordances: new Set(affordances),
      slots,
      lastUsedTimestamp: Date.now()
    });
  }

  /**
   * Xóa một Smart Object khi bị phá hủy hoặc chết
   */
  public unregister(objId: string): void {
    const obj = this.objects.get(objId);
    if (!obj) return;

    for (const slot of obj.slots) {
      if (slot.occupantEntityId !== null) {
        this.entityReservations.delete(slot.occupantEntityId);
      }
    }
    this.objects.delete(objId);
  }

  /**
   * Đồng bộ toàn bộ công trình trong ECSWorld vào SmartObjectManager
   */
  public syncFromWorld(world: ECSWorld): void {
    const buildings = world.query([PositionComponent, BuildingComponent]);
    const currentBuildingIds = new Set<string>();

    for (const bEnt of buildings) {
      const bComp = world.getComponent(bEnt, BuildingComponent)!;
      const bPos = world.getComponent(bEnt, PositionComponent)!;
      const objId = `building_${bEnt}`;

      if (bComp.isUnderConstruction || bComp.isRuins) {
        this.unregister(objId);
        continue;
      }

      currentBuildingIds.add(objId);

      const existing = this.objects.get(objId);
      if (!existing) {
        this.registerBuilding(bEnt, bComp, bPos);
      } else {
        existing.pos.x = bPos.x;
        existing.pos.y = bPos.y;
        if (bComp.currentDurability < bComp.maxDurability) {
          existing.affordances.add('repair_building');
        } else {
          existing.affordances.delete('repair_building');
        }
      }
    }

    // Dọn các công trình đã bị xóa
    for (const id of this.objects.keys()) {
      if (id.startsWith('building_') && !currentBuildingIds.has(id)) {
        this.unregister(id);
      }
    }
  }

  /**
   * Tìm Smart Object gần nhất hỗ trợ affordance và còn slot trống
   */
  public findBestAvailableObject(
    seekerPos: Point2D,
    affordance: AffordanceType,
    maxDistance: number = 450,
    preferredObjectType?: string,
    acceptObject?: (object: SmartObjectData) => boolean
  ): { object: SmartObjectData; slotIndex: number; interactionPos: Point2D; distance: number } | null {
    let bestMatch: { object: SmartObjectData; slotIndex: number; interactionPos: Point2D; distance: number } | null = null;
    let minScore = Infinity;

    for (const obj of this.objects.values()) {
      if (!obj.affordances.has(affordance)) continue;
      if (preferredObjectType && obj.objectType !== preferredObjectType) continue;
      if (acceptObject && !acceptObject(obj)) continue;

      // Tìm slot trống đầu tiên
      const freeSlot = obj.slots.find(s => s.occupantEntityId === null);
      if (!freeSlot) continue; // Đã hết chỗ (ngăn ngừa 100 người bu vào 1 chỗ)

      const interX = obj.pos.x + freeSlot.offset.x;
      const interY = obj.pos.y + freeSlot.offset.y;
      const dist = Math.hypot(interX - seekerPos.x, interY - seekerPos.y);

      if (dist <= maxDistance && dist < minScore) {
        minScore = dist;
        bestMatch = {
          object: obj,
          slotIndex: freeSlot.index,
          interactionPos: { x: interX, y: interY },
          distance: dist
        };
      }
    }

    return bestMatch;
  }

  /**
   * Đặt chỗ (Reserve) 1 slot trên Smart Object
   */
  public reserve(objectId: string, entityId: number, slotIndex: number, affordance: AffordanceType): boolean {
    const obj = this.objects.get(objectId);
    if (!obj) return false;

    const slot = obj.slots[slotIndex];
    if (!slot) return false;

    // Nếu slot đã bị ai khác chiếm
    if (slot.occupantEntityId !== null && slot.occupantEntityId !== entityId) {
      return false;
    }

    // Giải phóng đặt chỗ cũ nếu có
    this.release(entityId);

    slot.occupantEntityId = entityId;
    this.entityReservations.set(entityId, { objectId, slotIndex, affordance });
    obj.lastUsedTimestamp = Date.now();
    return true;
  }

  /**
   * Giải phóng đặt chỗ của một thực thể
   */
  public release(entityId: number): void {
    const res = this.entityReservations.get(entityId);
    if (!res) return;

    const obj = this.objects.get(res.objectId);
    if (obj) {
      const slot = obj.slots[res.slotIndex];
      if (slot && slot.occupantEntityId === entityId) {
        slot.occupantEntityId = null;
      }
    }

    this.entityReservations.delete(entityId);
  }

  /**
   * Kiểm tra một thực thể hiện có đang giữ chỗ nào không
   */
  public getEntityReservation(entityId: number): { objectId: string; slotIndex: number; affordance: AffordanceType } | undefined {
    return this.entityReservations.get(entityId);
  }

  /**
   * Lấy tọa độ tương tác chuẩn xác theo slot tỏa tròn
   */
  public getSlotInteractionPos(objectId: string, slotIndex: number): Point2D | null {
    const obj = this.objects.get(objectId);
    if (!obj) return null;
    const slot = obj.slots[slotIndex];
    if (!slot) return null;

    return {
      x: obj.pos.x + slot.offset.x,
      y: obj.pos.y + slot.offset.y
    };
  }

  /**
   * Thống kê tình trạng sức chứa của cộng đồng (để phục vụ Bảng Việc Cộng Đồng)
   */
  public getCommunityStats(): {
    campfireCount: number;
    hutCount: number;
    hutTotalCapacity: number;
    hutOccupiedCount: number;
    farmCount: number;
    wellCount: number;
  } {
    let campfireCount = 0;
    let hutCount = 0;
    let hutTotalCapacity = 0;
    let hutOccupiedCount = 0;
    let farmCount = 0;
    let wellCount = 0;

    for (const obj of this.objects.values()) {
      if (obj.objectType === 'campfire') campfireCount++;
      else if (obj.objectType === 'thatched_hut') {
        hutCount++;
        hutTotalCapacity += obj.capacity;
        hutOccupiedCount += obj.slots.filter(s => s.occupantEntityId !== null).length;
      } else if (obj.objectType === 'mortal_farm' || obj.objectType === 'herb_garden') farmCount++;
      else if (obj.objectType === 'village_well') wellCount++;
    }

    return {
      campfireCount,
      hutCount,
      hutTotalCapacity,
      hutOccupiedCount,
      farmCount,
      wellCount
    };
  }
}
