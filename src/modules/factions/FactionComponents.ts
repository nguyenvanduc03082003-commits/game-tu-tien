import { Component } from '../../ecs/Component.ts';
import {
  FactionType,
  FactionAlignment,
  SectRank,
  MemberRole,
  BuildingType,
  ResourceBundle,
  isCivilFactionType,
  getLeaderTitleByFactionType,
  getRoleDisplayName
} from '../../config/factions.config.ts';

export class FactionComponent implements Component {
  public factionId: string;
  public name: string;
  public type: FactionType;
  public alignment: FactionAlignment;
  public rank: SectRank;
  public leaderEntityId: number | null = null;
  public founderEntityId: number | null = null;
  public foundedYear: number = 1;
  public foundedTotalDays: number = 0;
  public color: string;
  public territoryRadius: number;
  public prestige: number = 0;
  public stability: number = 80;
  public developmentStage: number = 1;
  public upgradeEligibleSinceDays: number | null = null;
  public declineSinceDays: number | null = null;
  private _stageStableDaysOverride: number | null = null;

  // Kho tài nguyên tu luyện
  public herbStock: number = 5;
  public pillStock: number = 2;
  public spiritStones: number = 20;

  // Kho tài nguyên dân sinh & ngân khố
  public foodStock: number = 24;
  public woodStock: number = 50;
  public stoneStock: number = 18;
  public treasury: number = 20;
  public taxRate: number = 0.1;

  // Tài nguyên đang được đặt trước cho công việc xây dựng / mở rộng
  public reservedResources: ResourceBundle = {
    food: 0,
    wood: 0,
    stone: 0,
    spiritStones: 0
  };

  // Danh sách ID các đệ tử / thành viên thuộc tổ chức chính
  public members: Set<number> = new Set();
  public hasBeenPopulated: boolean = false;

  // Quản lý khu định cư & quan hệ bảo hộ / trực thuộc
  public settlementIds: string[] = [];
  public capitalSettlementId: string | null = null;
  public suzerainFactionId: string | null = null;
  public vassalFactionIds: string[] = [];
  public protectedSettlementIds: string[] = [];
  public protectorFactionId: string | null = null;

  constructor(
    factionId: string,
    name: string,
    type: FactionType = 'sect',
    alignment: FactionAlignment = 'righteous',
    color: string = '#1f6feb',
    territoryRadius: number = 16,
    leaderEntityId: number | null = null,
    foundedYear: number = 1,
    rank?: SectRank
  ) {
    this.factionId = factionId;
    this.name = name;
    this.type = type;
    this.alignment = alignment;
    this.color = color;
    this.territoryRadius = territoryRadius;
    this.leaderEntityId = leaderEntityId;
    this.founderEntityId = leaderEntityId;
    this.foundedYear = foundedYear;
    this.rank = rank ?? (type === 'holy_land' ? 'thanh_dia' : 'cuu_pham');
    this.developmentStage =
      type === 'hamlet' ? 1 :
      type === 'village' ? 2 :
      type === 'kingdom' ? 3 :
      type === 'holy_land' ? 5 : 2;
    this.reservedResources = {
      food: 0,
      wood: 0,
      stone: 0,
      spiritStones: 0
    };
  }

  public get id(): string {
    return this.factionId;
  }

  public get memberIds(): number[] {
    return Array.from(this.members);
  }

  public get stageStableDays(): number {
    if (this._stageStableDaysOverride !== null) {
      return this._stageStableDaysOverride;
    }
    if (this.upgradeEligibleSinceDays !== null) {
      return Math.max(0, this.foundedTotalDays - this.upgradeEligibleSinceDays);
    }
    return 0;
  }

  public set stageStableDays(days: number) {
    this._stageStableDaysOverride = Math.max(0, days);
    this.upgradeEligibleSinceDays = Math.min(0, -days);
  }

  public getTypeName(): string {
    switch (this.type) {
      case 'sect': return 'Tông Môn';
      case 'village': return 'Thôn Làng';
      case 'hamlet': return 'Thôn Xóm';
      case 'kingdom': return 'Vương Quốc';
      case 'holy_land': return 'Thánh Địa';
      default: return 'Thế Lực';
    }
  }

  public getLeaderTitle(): string {
    return getLeaderTitleByFactionType(this.type);
  }

  public getRankName(): string {
    if (isCivilFactionType(this.type)) {
      switch (this.type) {
        case 'hamlet': return '🏕️ Thôn Xóm Sơ Khai';
        case 'village': return '🏡 Làng Trù Phú';
        case 'kingdom': return '👑 Vương Quốc Thống Nhất';
      }
    }
    if (this.type === 'holy_land' || this.rank === 'thanh_dia') {
      return '🌟 Thánh Địa Tu Tiên';
    }
    switch (this.rank) {
      case 'nhat_pham': return '👑 Nhất Phẩm Tông Môn';
      case 'tam_pham': return '⚡ Tam Phẩm Tông Môn';
      case 'luc_pham': return '🗡️ Lục Phẩm Tông Môn';
      default: return '📜 Cửu Phẩm Tông Môn';
    }
  }

  public getAlignmentBadge(): string {
    switch (this.alignment) {
      case 'righteous': return '☯️ Chính Đạo';
      case 'demonic': return '🩸 Ma Đạo';
      default: return '⚖️ Trung Lập';
    }
  }
}

/**
 * KHU ĐỊNH CƯ (SETTLEMENT COMPONENT)
 * Quản lý một điểm định cư vật lý (thôn, làng, kinh đô, sơn môn) độc lập với tổ chức chính trị.
 * Một Vương Quốc có thể quản lý nhiều Khu Định Cư; một Tông Môn có thể bảo hộ Làng qua hiệp ước.
 */
export class SettlementComponent implements Component {
  public settlementId: string;
  public name: string;
  public settlementType: 'hamlet' | 'village' | 'capital' | 'sect_compound' | 'ruins';
  public ownerFactionId: string;
  public protectorFactionId: string | null = null;
  public centerX: number = 0;
  public centerY: number = 0;
  public radiusPixels: number = 192;
  public localLeaderEntityId: number | null = null;

  public residentIds: Set<number> = new Set();
  public buildings: Set<number> = new Set();
  public housingCapacity: number = 0;
  public waterAccess: boolean = true;
  public Prosperity: number = 50;

  // Kho vật tư địa phương của khu định cư
  public foodStock: number = 24;
  public woodStock: number = 36;
  public stoneStock: number = 18;
  public waterSupply: number = 60;
  public treasury: number = 15;

  // Tài nguyên đang đặt trước cho các công việc xây dựng của khu định cư
  public reservedResources: ResourceBundle = {
    food: 0,
    wood: 0,
    stone: 0,
    spiritStones: 0
  };

  public foundedTotalDays: number = 0;
  public stableSinceDays: number = 0;
  public declineSinceDays: number | null = null;
  public stability: number = 80;

  constructor(
    settlementId: string,
    name: string,
    arg3: string,
    arg4: string | number = 0,
    arg5: number = 192,
    arg6: number = 192,
    arg7: 'hamlet' | 'village' | 'capital' | 'sect_compound' | 'ruins' = 'hamlet'
  ) {
    this.settlementId = settlementId;
    this.name = name;

    if (typeof arg4 === 'string') {
      // (settlementId, name, settlementType, ownerFactionId, radiusPixels)
      this.settlementType = (arg3 as SettlementComponent['settlementType']) || 'village';
      this.ownerFactionId = arg4;
      this.radiusPixels = typeof arg5 === 'number' ? arg5 : 192;
    } else {
      // (settlementId, name, ownerFactionId, centerX, centerY, radiusPixels, settlementType)
      this.ownerFactionId = arg3;
      this.centerX = arg4;
      this.centerY = arg5;
      this.radiusPixels = arg6;
      this.settlementType = arg7;
    }
  }

  public get id(): string {
    return this.settlementId;
  }

  public get stage(): SettlementComponent['settlementType'] {
    return this.settlementType;
  }

  public set stage(val: SettlementComponent['settlementType']) {
    this.settlementType = val;
  }

  public get factionId(): string | null {
    return this.ownerFactionId || null;
  }

  public set factionId(val: string | null) {
    this.ownerFactionId = val ?? '';
  }

  public get leaderEntityId(): number | null {
    return this.localLeaderEntityId;
  }

  public set leaderEntityId(val: number | null) {
    this.localLeaderEntityId = val;
  }

  public get residents(): Set<number> {
    return this.residentIds;
  }

  public set residents(val: Set<number>) {
    this.residentIds = val;
  }
}

/**
 * NƠI CƯ TRÚ (RESIDENCE COMPONENT)
 * Tách biệt hoàn toàn với tư cách thành viên tổ chức (MemberComponent).
 * Một tu sĩ có thể cư trú tại làng quê thuộc Vương Quốc mà vẫn giữ nguyên môn phái (MemberComponent).
 */
export class ResidenceComponent implements Component {
  public settlementId: string;
  public factionId: string = '';
  public homeBuildingEntityId: number | null = null;
  public homeRole: 'resident' | 'elder' | 'head' | 'guest' = 'resident';
  public joinedDays: number = 0;
  public satisfaction: number = 80;

  constructor(
    settlementId: string,
    factionIdOrHomeBuilding?: string | number | null,
    homeBuildingEntityIdOrJoinedDays: number | null = null,
    joinedDays: number = 0
  ) {
    this.settlementId = settlementId;
    if (typeof factionIdOrHomeBuilding === 'string') {
      if (
        factionIdOrHomeBuilding === 'resident' ||
        factionIdOrHomeBuilding === 'elder' ||
        factionIdOrHomeBuilding === 'head' ||
        factionIdOrHomeBuilding === 'guest'
      ) {
        this.homeRole = factionIdOrHomeBuilding;
      } else {
        this.factionId = factionIdOrHomeBuilding;
      }
      this.homeBuildingEntityId = homeBuildingEntityIdOrJoinedDays;
      this.joinedDays = joinedDays;
    } else {
      this.homeBuildingEntityId = factionIdOrHomeBuilding ?? null;
      this.joinedDays = homeBuildingEntityIdOrJoinedDays ?? 0;
    }
  }

  public get homeBuildingId(): number | null {
    return this.homeBuildingEntityId;
  }

  public set homeBuildingId(val: number | null) {
    this.homeBuildingEntityId = val;
  }
}

/**
 * TƯ CÁCH THÀNH VIÊN TỔ CHỨC (MEMBER COMPONENT)
 * Mỗi cư dân có tối đa một tư cách thành viên tổ chức chính.
 */
export class MemberComponent implements Component {
  public factionId: string;
  public role: MemberRole;
  public contribution: number = 0;
  public loyalty: number = 80;
  public joinedDays: number = 0;
  public intentReason: string = '';
  public leaveCooldownUntilDays: number = 0;

  constructor(
    factionId: string,
    role: MemberRole = 'outer_disciple',
    loyalty: number = 80,
    joinedDays: number = 0,
    intentReason: string = ''
  ) {
    this.factionId = factionId;
    this.role = role;
    this.loyalty = loyalty;
    this.joinedDays = joinedDays;
    this.intentReason = intentReason;
  }

  public getRoleName(factionType?: FactionType): string {
    return getRoleDisplayName(this.role, factionType);
  }
}

/**
 * Ý ĐỊNH SÁNG LẬP THẾ LỰC (FOUNDING INTENT COMPONENT)
 * Lưu trạng thái từ khi nảy sinh ý định -> gom nhóm -> chọn đất -> chuẩn bị -> hoàn tất hoặc hủy.
 */
export class FoundingIntentComponent implements Component {
  public intentType: 'hamlet' | 'sect';
  public stage: 'intent' | 'gathering' | 'selecting_site' | 'site_selected' | 'preparing' | 'building' | 'completed' | 'cancelled' = 'intent';
  public reason: string = '';
  public participantIds: Set<number> = new Set();
  public targetPos: { x: number; y: number } | null = null;
  public siteTile: { x: number; y: number } | null = null;
  public reservedResources: Partial<ResourceBundle> = {
    food: 0,
    wood: 0,
    stone: 0,
    spiritStones: 0
  };
  public resourcesReserved: boolean = false;
  public taskId: string | null = null;
  public timeoutSeconds: number = 60;
  public elapsedSeconds: number = 0;
  public cancelReason?: string;
  public homeSettlementId?: string;

  constructor(
    intentType: 'hamlet' | 'sect',
    stageOrFounder: FoundingIntentComponent['stage'] | number = 'intent',
    reason: string = 'Tìm nơi an cư lạc nghiệp',
    timeoutSeconds: number = 60,
    participants: Iterable<number> = []
  ) {
    this.intentType = intentType;
    if (typeof stageOrFounder === 'number') {
      this.stage = 'intent';
      this.participantIds = new Set([stageOrFounder, ...participants]);
    } else {
      this.stage = stageOrFounder;
      this.participantIds = new Set(participants);
    }
    this.reason = reason;
    this.timeoutSeconds = timeoutSeconds;
  }

  public get intendedType(): 'hamlet' | 'sect' {
    return this.intentType;
  }
}

export class BuildingComponent implements Component {
  public buildingType: BuildingType;
  public factionId: string;
  public settlementId: string = '';
  public name: string;
  public widthTiles: number;
  public heightTiles: number;
  public maxDurability: number;
  public currentDurability: number;
  public level: number = 1;
  public occupantEntityId: number | null = null;
  public timer: number = 0;
  public interval: number = 10; // Chu kỳ thực hiện chức năng (giây)
  public isRuins: boolean = false;
  public isUnderConstruction: boolean = false;
  /** Houses currently use a south-facing entrance; persisted for future layouts. */
  public doorSide: 'north' | 'east' | 'south' | 'west' = 'south';

  constructor(
    buildingType: BuildingType,
    factionId: string,
    name: string,
    widthTiles: number,
    heightTiles: number,
    durability: number,
    interval: number = 10,
    settlementId: string = '',
    isRuins: boolean = false,
    isUnderConstruction: boolean = false
  ) {
    this.buildingType = buildingType;
    this.factionId = factionId;
    this.name = name;
    this.widthTiles = widthTiles;
    this.heightTiles = heightTiles;
    this.maxDurability = durability;
    this.currentDurability = durability;
    this.interval = interval;
    this.settlementId = settlementId;
    this.isRuins = isRuins;
    this.isUnderConstruction = isUnderConstruction;
  }
}

/** Marks a resident as indoors while keeping their needs and age simulation active. */
export class InsideBuildingComponent implements Component {
  constructor(public buildingEntityId: number) {}
}

/**
 * CÔNG TRƯỜNG THI CÔNG (CONSTRUCTION SITE COMPONENT)
 * Quản lý tiến độ xây dựng bền vững theo ngày và tick game.
 * Lưu giữ tài nguyên đặt cọc, tiến độ tích lũy và danh sách thợ thi công.
 */
export class ConstructionSiteComponent implements Component {
  public status: 'planned' | 'under_construction' | 'completed' = 'under_construction';
  public requiredWorkTicks: number;
  public completedWorkTicks: number = 0;
  public assignedWorkerIds: number[] = [];
  public reservedResources: ResourceBundle;
  public payerFactionId: string;
  public settlementId?: string;
  /** Founder of a neutral site, before its faction exists. */
  public founderEntityId?: number;

  constructor(
    requiredWorkTicks: number,
    payerFactionId: string = '',
    settlementId: string = '',
    reservedResources?: ResourceBundle,
    status: 'planned' | 'under_construction' | 'completed' = 'under_construction'
  ) {
    this.requiredWorkTicks = requiredWorkTicks;
    this.payerFactionId = payerFactionId;
    this.settlementId = settlementId;
    this.reservedResources = reservedResources ?? { food: 0, wood: 0, stone: 0, spiritStones: 0 };
    this.status = status;
  }

  public get progressRatio(): number {
    if (this.requiredWorkTicks <= 0) return 1.0;
    return Math.min(1.0, Math.max(0, this.completedWorkTicks / this.requiredWorkTicks));
  }

  public get isCompleted(): boolean {
    return this.status === 'completed' || this.completedWorkTicks >= this.requiredWorkTicks;
  }

  public get remainingWorkTicks(): number {
    return Math.max(0, this.requiredWorkTicks - this.completedWorkTicks);
  }

  public get remainingDays(): number {
    return this.remainingWorkTicks / 100;
  }
}

export class TerritoryCenterComponent implements Component {
  public factionId: string;
  public settlementId: string = '';
  public radiusPixels: number;
  public color: string;
  public factionName: string = '';
  public layerType: 'civil' | 'sect' | 'protectorate' = 'sect';

  constructor(
    factionId: string,
    radiusPixels: number,
    color: string,
    factionNameOrSettlementId: string = '',
    settlementIdOrLayerType?: string,
    layerType: 'civil' | 'sect' | 'protectorate' = 'sect'
  ) {
    this.factionId = factionId;
    this.radiusPixels = radiusPixels;
    this.color = color;
    if (
      settlementIdOrLayerType === 'civil' ||
      settlementIdOrLayerType === 'sect' ||
      settlementIdOrLayerType === 'protectorate'
    ) {
      this.settlementId = factionNameOrSettlementId;
      this.layerType = settlementIdOrLayerType;
    } else {
      this.factionName = factionNameOrSettlementId;
      this.settlementId = settlementIdOrLayerType ?? '';
      this.layerType = layerType;
    }
  }
}
