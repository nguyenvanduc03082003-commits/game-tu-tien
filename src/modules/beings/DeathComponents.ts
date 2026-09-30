import { Component } from '../../ecs/Component.ts';
import { WeaponDefinition } from '../../config/weapons.config.ts';
import { ArmorDefinition, ArtifactDefinition } from '../combat/CombatComponents.ts';
import { ToolDefinition } from '../../config/tools.config.ts';

export interface DroppedItemData {
  pills: { id: string; count: number; name: string }[];
  mainHand: WeaponDefinition | null;
  offHand: WeaponDefinition | null;
  bodyArmor: ArmorDefinition | null;
  artifact: ArtifactDefinition | null;
  workTool?: ToolDefinition | null;
}

/**
 * CorpseComponent - Đại diện cho thi hài của nhân vật sau khi tử vong
 * Thời gian duy trì: Phàm nhân 30 ngày (1 tháng), cứ tăng 1 cấp lớn thì nhân 5 lần (5^stageIndex).
 */
export class CorpseComponent implements Component {
  public deceasedName: string;
  public raceId: string;
  public realmStageIndex: number;
  public realmStageName: string;
  public deathDay: number;
  public deathMonth: number;
  public deathYear: number;
  public deathReason: string;
  // Marker toàn bộ đợt tử vong; không phụ thuộc vòng đời ký ức của người sống.
  public socialDeathProcessed = false;

  // Thời gian tồn tại tính theo ngày in-game (1 tháng = 30 ngày)
  public remainingDays: number;
  public totalDays: number;

  // Trạng thái vận chuyển khi người thân đến bế/cõng đi chôn cất
  public isBeingCarried: boolean = false;
  public carriedByEntityId: number | null = null;
  public isBuried: boolean = false;

  // Toàn bộ đồ đạc mang theo lúc tạ thế (đan dược, vũ khí, trang bị, pháp bảo)
  public items: DroppedItemData;

  constructor(
    deceasedName: string,
    raceId: string,
    realmStageIndex: number,
    realmStageName: string,
    deathDay: number,
    deathMonth: number,
    deathYear: number,
    deathReason: string,
    items: DroppedItemData
  ) {
    this.deceasedName = deceasedName;
    this.raceId = raceId;
    this.realmStageIndex = Math.max(0, realmStageIndex);
    this.realmStageName = realmStageName;
    this.deathDay = deathDay;
    this.deathMonth = deathMonth;
    this.deathYear = deathYear;
    this.deathReason = deathReason;
    this.items = items;

    // Yêu cầu: Phàm nhân duy trì 1 tháng (30 ngày), mỗi cấp lớn tăng gấp 5 lần
    this.totalDays = 30 * Math.pow(5, this.realmStageIndex);
    this.remainingDays = this.totalDays;
  }
}

/**
 * GraveComponent - Đại diện cho Ngôi Mộ sau khi được người thân an táng
 * Vị trí đặt tại khu vực nghĩa trang quy ước của cư dân
 * Thời gian tồn tại: Phàm nhân 12 tháng (360 ngày), mỗi cấp lớn tăng gấp 4 lần (4^stageIndex)
 */
export class GraveComponent implements Component {
  public deceasedName: string;
  public raceId: string;
  public realmStageIndex: number;
  public realmStageName: string;
  public buriedByName: string;
  public buriedByEntityId: number | null;
  public burialDay: number;
  public burialMonth: number;
  public burialYear: number;

  // Thời gian phong hóa tính theo ngày in-game (12 tháng = 360 ngày)
  public remainingDays: number;
  public totalDays: number;

  // Đồ tùy táng lưu giữ trong mộ (Phương án A)
  public burialGoods: DroppedItemData;

  constructor(
    deceasedName: string,
    raceId: string,
    realmStageIndex: number,
    realmStageName: string,
    buriedByName: string,
    buriedByEntityId: number | null,
    burialDay: number,
    burialMonth: number,
    burialYear: number,
    burialGoods: DroppedItemData
  ) {
    this.deceasedName = deceasedName;
    this.raceId = raceId;
    this.realmStageIndex = Math.max(0, realmStageIndex);
    this.realmStageName = realmStageName;
    this.buriedByName = buriedByName;
    this.buriedByEntityId = buriedByEntityId;
    this.burialDay = burialDay;
    this.burialMonth = burialMonth;
    this.burialYear = burialYear;
    this.burialGoods = burialGoods;

    // Yêu cầu: Phàm nhân mộ duy trì 12 tháng (360 ngày), mỗi cấp lớn tăng gấp 4 lần
    this.totalDays = 360 * Math.pow(4, this.realmStageIndex);
    this.remainingDays = this.totalDays;
  }
}

/**
 * DroppedLootComponent - Gói đồ / Di vật rơi ngoài đất sau khi thi thể phân rã hoàn toàn
 */
export class DroppedLootComponent implements Component {
  public ownerName: string;
  public realmStageName: string;
  public droppedDay: number;
  public droppedMonth: number;
  public droppedYear: number;
  public items: DroppedItemData;

  constructor(
    ownerName: string,
    realmStageName: string,
    droppedDay: number,
    droppedMonth: number,
    droppedYear: number,
    items: DroppedItemData
  ) {
    this.ownerName = ownerName;
    this.realmStageName = realmStageName;
    this.droppedDay = droppedDay;
    this.droppedMonth = droppedMonth;
    this.droppedYear = droppedYear;
    this.items = items;
  }

  public getItemCount(): number {
    let count = 0;
    if (this.items.pills) {
      for (const p of this.items.pills) count += p.count;
    }
    if (this.items.mainHand) count++;
    if (this.items.offHand) count++;
    if (this.items.bodyArmor) count++;
    if (this.items.artifact) count++;
    return count;
  }
}

/**
 * GraveyardZoneComponent - Đánh dấu và quản lý khu vực nghĩa trang đã quy ước của thôn làng
 */
export class GraveyardZoneComponent implements Component {
  public factionId: string;
  public centerX: number;
  public centerY: number;
  public radiusTiles: number;
  public occupiedPlots: { x: number; y: number }[] = [];

  constructor(factionId: string, centerX: number, centerY: number, radiusTiles: number = 6) {
    this.factionId = factionId;
    this.centerX = centerX;
    this.centerY = centerY;
    this.radiusTiles = radiusTiles;
  }
}
