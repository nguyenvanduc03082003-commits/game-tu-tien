import { ECSWorld } from '../../ecs/World.ts';
import { Entity } from '../../ecs/Entity.ts';
import { EventBus } from '../../core/EventBus.ts';
import { TimeManager } from '../../core/TimeManager.ts';
import {
  PositionComponent,
  HealthComponent,
  RaceComponent,
  RealmComponent,
  NameComponent,
  LifespanComponent,
  ChildcareComponent,
  CultivationTechniqueComponent,
  DailyScheduleComponent,
  CorpseComponent,
  GraveComponent
} from '../beings/BeingComponents.ts';
import { FamilyComponent } from '../beings/FamilyComponent.ts';
import { SocialRelationshipComponent } from '../social/SocialComponents.ts';
import {
  FactionComponent,
  SettlementComponent,
  ResidenceComponent,
  MemberComponent,
  BuildingComponent,
  TerritoryCenterComponent,
  ConstructionSiteComponent
} from './FactionComponents.ts';
import { SmartObjectManager } from '../ai/smartobjects/SmartObjectManager.ts';
import { AStarPathfinder } from '../ai/pathfinding/AStar.ts';
import {
  FactionAlignment,
  FactionType,
  BuildingType,
  MemberRole,
  ResourceBundle,
  BUILDING_DEFINITIONS,
  FACTION_PROGRESSION_CONFIG,
  SECT_PREFIXES_RIGHTEOUS,
  SECT_SUFFIXES_RIGHTEOUS,
  SECT_PREFIXES_DEMONIC,
  SECT_SUFFIXES_DEMONIC,
  HAMLET_NAMES_MORTAL,
  SETTLEMENT_NAMES_MORTAL,
  KINGDOM_NAMES_MORTAL,
  getNormalizedCultivationTier,
  isCivilFactionType
} from '../../config/factions.config.ts';

export class FactionFactory {
  private static factionCounter = 1;
  private static settlementCounter = 1;
  private static intentCounter = 1;

  public static reset(startCounter: number = 1): void {
    this.factionCounter = Math.max(1, startCounter);
    this.settlementCounter = 1;
    this.intentCounter = 1;
  }

  public static getFactionCounter(): number {
    return this.factionCounter;
  }

  public static getSettlementCounter(): number {
    return this.settlementCounter;
  }

  public static nextIntentId(): string {
    return `intent_${this.intentCounter++}`;
  }

  /**
   * Đồng bộ bộ đếm factionCounter và settlementCounter từ các thực thể hiện có trong thế giới (sau khi nạp bản lưu).
   */
  public static syncCounterFromWorld(world: ECSWorld): void {
    let maxFactionId = 0;
    const factions = world.query([FactionComponent]);
    for (const ent of factions) {
      const fc = world.getComponent(ent, FactionComponent);
      if (fc && typeof fc.factionId === 'string' && fc.factionId.startsWith('faction_')) {
        const num = parseInt(fc.factionId.replace('faction_', ''), 10);
        if (!isNaN(num) && num > maxFactionId) {
          maxFactionId = num;
        }
      }
    }
    this.factionCounter = Math.max(1, maxFactionId + 1);

    let maxSettlementId = 0;
    const settlements = world.query([SettlementComponent]);
    for (const ent of settlements) {
      const sc = world.getComponent(ent, SettlementComponent);
      if (sc && typeof sc.settlementId === 'string' && sc.settlementId.startsWith('settlement_')) {
        const num = parseInt(sc.settlementId.replace('settlement_', ''), 10);
        if (!isNaN(num) && num > maxSettlementId) {
          maxSettlementId = num;
        }
      }
    }
    this.settlementCounter = Math.max(1, maxSettlementId + 1);
  }

  /**
   * Kiểm tra một sinh linh có đủ năng lực xã hội & độ tuổi trưởng thành để sáng lập hoặc tự gia nhập thế lực không.
   * Ngăn trẻ nhỏ, động vật hoang dã và cá thể chưa đủ bậc tu luyện tự thành người sáng lập/thành viên.
   */
  public static isBeingSociallyEligible(world: ECSWorld, beingEntity: Entity, allowChildrenAsResidents: boolean = false): boolean {
    const hp = world.getComponent(beingEntity, HealthComponent);
    if (!hp || hp.isDead) return false;
    if (
      world.hasComponent(beingEntity, CorpseComponent) ||
      world.hasComponent(beingEntity, GraveComponent) ||
      !world.hasComponent(beingEntity, RaceComponent)
    ) {
      return false;
    }

    if (!allowChildrenAsResidents) {
      const child = world.getComponent(beingEntity, ChildcareComponent);
      if (child && child.isChild) return false;

      const life = world.getComponent(beingEntity, LifespanComponent);
      if (life && life.currentAge < 14) return false;
    }

    const race = world.getComponent(beingEntity, RaceComponent);
    if (race && race.raceId === 'beast') {
      const realm = world.getComponent(beingEntity, RealmComponent);
      const tech = world.getComponent(beingEntity, CultivationTechniqueComponent);
      const stageIdx = realm?.stageIndex ?? 0;
      if (stageIdx < 1 && !tech) {
        return false;
      }
    }

    return true;
  }

  public static generateFactionName(type: FactionType, alignment: FactionAlignment, seedIndex?: number): string {
    const pick = (arr: string[], offset: number = 0) => {
      if (seedIndex !== undefined) {
        return arr[Math.abs(seedIndex + offset) % arr.length];
      }
      return arr[Math.floor(Math.random() * arr.length)];
    };

    if (type === 'hamlet') {
      return pick(HAMLET_NAMES_MORTAL, this.factionCounter);
    }
    if (type === 'village') {
      return pick(SETTLEMENT_NAMES_MORTAL, this.factionCounter);
    }
    if (type === 'kingdom') {
      return pick(KINGDOM_NAMES_MORTAL, this.factionCounter);
    }

    if (alignment === 'demonic') {
      const p = pick(SECT_PREFIXES_DEMONIC, this.factionCounter);
      const s = pick(SECT_SUFFIXES_DEMONIC, this.factionCounter * 3 + 1);
      return `${p} ${s}`;
    } else {
      const p = pick(SECT_PREFIXES_RIGHTEOUS, this.factionCounter);
      const s = pick(SECT_SUFFIXES_RIGHTEOUS, this.factionCounter * 3 + 1);
      return `${p} ${s}`;
    }
  }

  public static createFaction(
    world: ECSWorld,
    optionsOrType?:
      | FactionType
      | {
          name?: string;
          customName?: string;
          alignment?: FactionAlignment;
          type?: FactionType;
          color?: string;
          leaderEntityId?: number;
          founderEntityId?: number;
          silent?: boolean;
        },
    _tileX?: number,
    _tileY?: number,
    extraOptions?: {
      name?: string;
      customName?: string;
      alignment?: FactionAlignment;
      color?: string;
      leaderEntityId?: number;
      founderEntityId?: number;
      silent?: boolean;
    }
  ): {
    factionEntity: Entity;
    entityId: Entity;
    factionId: string;
    name: string;
    settlementIds: string[];
    comp: FactionComponent;
  } {
    const options =
      typeof optionsOrType === 'string'
        ? { ...extraOptions, type: optionsOrType }
        : optionsOrType;

    const factionId = `faction_${this.factionCounter++}`;
    const type = options?.type ?? 'sect';
    const alignment = options?.alignment ?? (isCivilFactionType(type) ? 'neutral' : 'righteous');
    const name = options?.name ?? options?.customName ?? this.generateFactionName(type, alignment, this.factionCounter);

    let defaultColor = '#1f6feb';
    if (type === 'hamlet') defaultColor = '#82c91e';
    else if (type === 'village') defaultColor = '#40c057';
    else if (type === 'kingdom') defaultColor = '#f59f00';
    else if (type === 'holy_land') defaultColor = '#cc5de8';
    else if (alignment === 'demonic') defaultColor = '#f03e3e';
    else if (alignment === 'neutral') defaultColor = '#fab005';

    const color = options?.color ?? defaultColor;
    const defaultRadius =
      type === 'hamlet' ? FACTION_PROGRESSION_CONFIG.hamlet.territoryRadiusTiles :
      type === 'village' ? FACTION_PROGRESSION_CONFIG.village.territoryRadiusTiles :
      type === 'kingdom' ? FACTION_PROGRESSION_CONFIG.kingdom.territoryRadiusTiles :
      type === 'holy_land' ? FACTION_PROGRESSION_CONFIG.holy_land.territoryRadiusTiles :
      FACTION_PROGRESSION_CONFIG.sect.territoryRadiusTiles;

    const date = TimeManager.getInstance().getDate();
    const factionComp = new FactionComponent(factionId, name, type, alignment, color, defaultRadius);
    factionComp.foundedYear = date.year;
    factionComp.foundedTotalDays = date.totalDays;

    if (options?.leaderEntityId !== undefined) {
      factionComp.leaderEntityId = options.leaderEntityId;
      factionComp.founderEntityId = options.founderEntityId ?? options.leaderEntityId;
    } else if (options?.founderEntityId !== undefined) {
      factionComp.founderEntityId = options.founderEntityId;
      factionComp.leaderEntityId = options.founderEntityId;
    }

    const factionEntity = world.createEntity();
    world.addComponent(factionEntity, factionComp);

    if (!options?.silent) {
      const actionDesc = isCivilFactionType(type)
        ? 'chính thức tụ nghĩa lập ấp, dựng nền dân sinh!'
        : 'chính thức khai tông lập phái, mở ra một phương bá nghiệp!';
      EventBus.getInstance().emit('world:log', {
        type: 'faction_created',
        message: `🏛️ THẾ LỰC KHỞI NGUYÊN: [${factionComp.name}] (${factionComp.getTypeName()}) ${actionDesc}`
      });
    }

    return {
      factionEntity,
      entityId: factionEntity,
      factionId,
      name: factionComp.name,
      settlementIds: factionComp.settlementIds,
      comp: factionComp
    };
  }

  /**
   * Tạo Khu Định Cư (SettlementComponent) gắn với một thế lực quản lý.
   */
  public static createSettlement(
    world: ECSWorld,
    optionsOrName:
      | string
      | {
          name?: string;
          ownerFactionId: string;
          centerX?: number;
          centerY?: number;
          x?: number;
          y?: number;
          radiusPixels?: number;
          radiusTiles?: number;
          settlementType?: 'hamlet' | 'village' | 'capital' | 'sect_compound';
          leaderEntityId?: number | null;
          localLeaderEntityId?: number | null;
          settlementId?: string;
        },
    stageArg?: 'hamlet' | 'village' | 'capital' | 'sect_compound',
    tileXArg?: number,
    tileYArg?: number,
    factionIdArg?: string,
    leaderEntityIdArg?: number | null
  ): {
    settlementEntity: Entity;
    entityId: Entity;
    settlementId: string;
    settlementComp: SettlementComponent;
  } {
    const options =
      typeof optionsOrName === 'string'
        ? {
            name: optionsOrName,
            settlementType: stageArg,
            centerX: (tileXArg ?? 0) * 16,
            centerY: (tileYArg ?? 0) * 16,
            ownerFactionId: factionIdArg ?? '',
            leaderEntityId: leaderEntityIdArg ?? null
          }
        : optionsOrName;

    const settlementId = options.settlementId ?? `settlement_${this.settlementCounter++}`;
    const factionEnt = this.findFactionEntity(world, options.ownerFactionId);
    const fComp = factionEnt !== null ? world.getComponent(factionEnt, FactionComponent) : undefined;

    const sType = options.settlementType ?? (
      fComp?.type === 'hamlet' ? 'hamlet' :
      fComp?.type === 'village' ? 'village' :
      fComp?.type === 'kingdom' ? 'capital' : 'sect_compound'
    );

    const centerX = options.centerX ?? options.x ?? 0;
    const centerY = options.centerY ?? options.y ?? 0;
    const radiusPx =
      options.radiusPixels ??
      (options.radiusTiles !== undefined ? options.radiusTiles * 16 : (fComp?.territoryRadius ?? 14) * 16);
    const name = options.name ?? fComp?.name ?? `Khu Định Cư #${this.settlementCounter - 1}`;
    const date = TimeManager.getInstance().getDate();

    const sComp = new SettlementComponent(
      settlementId,
      name,
      options.ownerFactionId,
      centerX,
      centerY,
      radiusPx,
      sType
    );
    sComp.foundedTotalDays = date.totalDays;
    sComp.stableSinceDays = date.totalDays;
    sComp.localLeaderEntityId =
      options.localLeaderEntityId ?? options.leaderEntityId ?? fComp?.leaderEntityId ?? null;

    const settlementEntity = world.createEntity();
    world.addComponent(settlementEntity, new PositionComponent(centerX, centerY, 0));
    world.addComponent(settlementEntity, sComp);

    if (fComp && (sType === 'hamlet' || sType === 'village')) {
      world.addComponent(
        settlementEntity,
        new TerritoryCenterComponent(
          options.ownerFactionId,
          radiusPx,
          fComp.color,
          name,
          settlementId,
          'civil'
        )
      );
    }

    if (fComp) {
      if (!fComp.settlementIds.includes(settlementId)) {
        fComp.settlementIds.push(settlementId);
      }
      if (!fComp.capitalSettlementId) {
        fComp.capitalSettlementId = settlementId;
      }
    }

    return {
      settlementEntity,
      entityId: settlementEntity,
      settlementId,
      settlementComp: sComp
    };
  }

  public static spawnBuilding(
    world: ECSWorld,
    buildingType: BuildingType,
    factionId: string,
    x: number,
    y: number,
    settlementId?: string,
    options?: {
      instant?: boolean;
      underConstruction?: boolean;
      payerFactionId?: string;
      reservedResources?: ResourceBundle;
      requiredWorkTicks?: number;
    }
  ): Entity {
    const def = BUILDING_DEFINITIONS[buildingType];
    const buildingEntity = world.createEntity();
    const isUnderConstruction = options?.underConstruction ?? !options?.instant;

    // Xác định khu định cư tương ứng (nếu chưa truyền vào thì tìm khu định cư gần nhất của factionId, hoặc tạo mới)
    let resolvedSettlementId = settlementId ?? '';
    let settlementComp: SettlementComponent | undefined;

    if (resolvedSettlementId) {
      const sEnt = this.findSettlementEntity(world, resolvedSettlementId);
      if (sEnt !== null) {
        settlementComp = world.getComponent(sEnt, SettlementComponent);
      }
    }

    if (!settlementComp && factionId) {
      const existing = this.findNearestSettlement(world, x, y, factionId);
      if (existing) {
        settlementComp = existing.comp;
        resolvedSettlementId = existing.comp.settlementId;
      } else if (buildingType === 'campfire' || buildingType === 'sect_hall') {
        const created = this.createSettlement(world, {
          ownerFactionId: factionId,
          centerX: x,
          centerY: y
        });
        settlementComp = created.settlementComp;
        resolvedSettlementId = created.settlementId;
      }
    }

    // 1. Vị trí trong thế giới
    const pos = new PositionComponent(x, y, 0);
    world.addComponent(buildingEntity, pos);

    // 2. Thành phần Công trình (chủ sở hữu rõ ràng, không bao giờ gán bừa cho thế lực đầu tiên)
    const bComp = new BuildingComponent(
      buildingType,
      factionId,
      def.name,
      def.widthTiles,
      def.heightTiles,
      def.baseDurability,
      buildingType === 'herb_garden' ? 15 : buildingType === 'alchemy_chamber' ? 25 : 10,
      resolvedSettlementId,
      false,
      isUnderConstruction
    );
    world.addComponent(buildingEntity, bComp);

    if (settlementComp) {
      settlementComp.buildings.add(buildingEntity);
      if (!isUnderConstruction && def.housingCapacity) {
        settlementComp.housingCapacity += def.housingCapacity;
      }
    }

    // 3. Nếu đang trong tiến trình thi công -> Thêm ConstructionSiteComponent
    if (isUnderConstruction) {
      const reqTicks =
        options?.requiredWorkTicks ??
        ((def.constructionDays ?? 1) * TimeManager.TICKS_PER_DAY);
      const siteComp = new ConstructionSiteComponent(
        reqTicks,
        options?.payerFactionId ?? factionId,
        resolvedSettlementId,
        options?.reservedResources
      );
      world.addComponent(buildingEntity, siteComp);
    } else {
      // 4. Nếu là Tông Môn Đại Điện hoặc Lửa Trại Trung Tâm đã hoàn tất -> Gắn TerritoryCenterComponent
      const factionEnt = factionId ? this.findFactionEntity(world, factionId) : null;
      const fComp = factionEnt !== null ? world.getComponent(factionEnt, FactionComponent) : undefined;

      const shouldAttachTerritoryCenter =
        buildingType === 'sect_hall' ||
        (buildingType === 'campfire' && (!settlementComp || !this.hasTerritoryCenterForSettlement(world, resolvedSettlementId, factionId)));

      if (shouldAttachTerritoryCenter && factionId) {
        const color = fComp?.color ?? (buildingType === 'campfire' ? '#40c057' : '#1f6feb');
        const radius = (fComp?.territoryRadius ?? (buildingType === 'campfire' ? 12 : 18)) * 16;
        const layerType = fComp && isCivilFactionType(fComp.type) ? 'civil' : 'sect';
        world.addComponent(
          buildingEntity,
          new TerritoryCenterComponent(factionId, radius, color, resolvedSettlementId, layerType)
        );
      }
    }

    // 5. Đăng ký SmartObject tương tác (chỉ khi công trình đã hoàn thành) và làm mới cache va chạm đường đi của A*
    if (!isUnderConstruction) {
      SmartObjectManager.getInstance().registerBuilding(buildingEntity, bComp, pos);
    }
    AStarPathfinder.invalidateBuildingCache();

    return buildingEntity;
  }

  public static startConstruction(
    world: ECSWorld,
    buildingType: BuildingType,
    factionId: string,
    x: number,
    y: number,
    settlementId?: string,
    reservedResources?: ResourceBundle,
    requiredWorkTicks?: number
  ): Entity {
    return this.spawnBuilding(world, buildingType, factionId, x, y, settlementId, {
      underConstruction: true,
      payerFactionId: factionId,
      reservedResources,
      requiredWorkTicks
    });
  }

  /** Transfer a neutral founding site to the faction created by its builders. */
  public static claimFoundingSite(world: ECSWorld, buildingEntity: Entity, factionId: string): string | null {
    const building = world.getComponent(buildingEntity, BuildingComponent);
    const site = world.getComponent(buildingEntity, ConstructionSiteComponent);
    const pos = world.getComponent(buildingEntity, PositionComponent);
    if (!building || !site || !pos || building.factionId ||
        (building.buildingType !== 'campfire' && building.buildingType !== 'sect_hall')) return null;
    const settlement = this.createSettlement(world, {
      ownerFactionId: factionId,
      centerX: pos.x,
      centerY: pos.y
    });
    building.factionId = factionId;
    building.settlementId = settlement.settlementId;
    site.payerFactionId = factionId;
    site.settlementId = settlement.settlementId;
    settlement.settlementComp.buildings.add(buildingEntity);
    return settlement.settlementId;
  }

  public static completeBuilding(world: ECSWorld, buildingEntity: Entity): void {
    const bComp = world.getComponent(buildingEntity, BuildingComponent);
    if (!bComp) return;
    // Đảm bảo tính idempotent: chỉ hoàn tất nếu công trình đang ở trạng thái thi công dở
    if (!bComp.isUnderConstruction) return;
    const pendingSite = world.getComponent(buildingEntity, ConstructionSiteComponent);
    if (!pendingSite || !pendingSite.isCompleted) return;

    bComp.isUnderConstruction = false;
    const def = BUILDING_DEFINITIONS[bComp.buildingType];

    // Cập nhật sức chứa chỗ ở cho Settlement
    if (bComp.settlementId) {
      const sEnt = this.findSettlementEntity(world, bComp.settlementId);
      if (sEnt !== null) {
        const sComp = world.getComponent(sEnt, SettlementComponent);
        if (sComp && def.housingCapacity) {
          sComp.housingCapacity += def.housingCapacity;
        }
      }
    }

    // Đính kèm TerritoryCenterComponent nếu là Đại Điện hoặc Lửa Trại
    const factionEnt = bComp.factionId ? this.findFactionEntity(world, bComp.factionId) : null;
    const fComp = factionEnt !== null ? world.getComponent(factionEnt, FactionComponent) : undefined;
    const shouldAttachTerritoryCenter =
      bComp.buildingType === 'sect_hall' ||
      (bComp.buildingType === 'campfire' && !this.hasTerritoryCenterForSettlement(world, bComp.settlementId, bComp.factionId));

    if (shouldAttachTerritoryCenter && bComp.factionId && !world.hasComponent(buildingEntity, TerritoryCenterComponent)) {
      const color = fComp?.color ?? (bComp.buildingType === 'campfire' ? '#40c057' : '#1f6feb');
      const radius = (fComp?.territoryRadius ?? (bComp.buildingType === 'campfire' ? 12 : 18)) * 16;
      const layerType = fComp && isCivilFactionType(fComp.type) ? 'civil' : 'sect';
      world.addComponent(
        buildingEntity,
        new TerritoryCenterComponent(bComp.factionId, radius, color, bComp.settlementId, layerType)
      );
    }

    // Tiêu thụ tài nguyên đặt cọc và gỡ ConstructionSiteComponent
    const siteComp = world.getComponent(buildingEntity, ConstructionSiteComponent);
    if (siteComp) {
      siteComp.status = 'completed';
      siteComp.completedWorkTicks = siteComp.requiredWorkTicks;
      if (siteComp.payerFactionId && siteComp.reservedResources) {
        this.consumeReservedResources(world, siteComp.payerFactionId, siteComp.reservedResources);
      }
      world.removeComponent(buildingEntity, ConstructionSiteComponent);
    }

    const pos = world.getComponent(buildingEntity, PositionComponent);
    if (pos) {
      SmartObjectManager.getInstance().registerBuilding(buildingEntity, bComp, pos);
    }

    EventBus.getInstance().emit('world:log', {
      type: 'building_completed',
      message: `🔨 Xây dựng hoàn tất công trình [${bComp.name}]!`
    });
    EventBus.getInstance().emit('chronicle:entry', {
      category: 'construction',
      message: `🔨 Đã hoàn thành thi công kiến trúc [${bComp.name}]!`,
      importance: 'normal'
    });
  }

  public static cancelConstruction(
    world: ECSWorld,
    buildingEntity: Entity,
    refundPayerId?: string
  ): boolean {
    const bComp = world.getComponent(buildingEntity, BuildingComponent);
    const siteComp = world.getComponent(buildingEntity, ConstructionSiteComponent);
    if (!bComp) return false;

    const payerId = refundPayerId ?? siteComp?.payerFactionId ?? bComp.factionId;
    if (siteComp && payerId && siteComp.reservedResources) {
      this.refundReservedResources(world, payerId, siteComp.reservedResources);
    }

    SmartObjectManager.getInstance().unregister(`building_${buildingEntity}`);

    if (bComp.settlementId) {
      const sEnt = this.findSettlementEntity(world, bComp.settlementId);
      if (sEnt !== null) {
        const sComp = world.getComponent(sEnt, SettlementComponent);
        if (sComp) {
          sComp.buildings.delete(buildingEntity);
        }
      }
    }

    world.destroyEntity(buildingEntity);
    this.reconcileHomes(world);
    AStarPathfinder.invalidateBuildingCache();
    return true;
  }

  private static hasTerritoryCenterForSettlement(world: ECSWorld, settlementId: string, factionId: string): boolean {
    const centers = world.query([TerritoryCenterComponent]);
    for (const cEnt of centers) {
      const tc = world.getComponent(cEnt, TerritoryCenterComponent);
      if (!tc) continue;
      if (settlementId && tc.settlementId === settlementId) return true;
      if (!settlementId && factionId && tc.factionId === factionId) return true;
    }
    return false;
  }

  /**
   * API tập trung gia nhập thế lực:
   * - Nếu thực thể đang thuộc thế lực khác -> gọi leaveFaction trước để không để lại thành viên ảo
   * - Đồng bộ MemberComponent và FactionComponent.members hai chiều
   * - Không ghi đè ResidenceComponent của cư dân nếu cư dân từ làng gia nhập Tông Môn
   */
  public static assignMemberToFaction(
    world: ECSWorld,
    beingEntity: Entity,
    factionId: string,
    role: MemberRole = 'outer_disciple',
    optionsOrReason?:
      | string
      | {
          reason?: string;
          preserveResidence?: boolean;
        },
    joinedDays?: number
  ): boolean {
    if (!factionId) return false;

    const options =
      typeof optionsOrReason === 'string'
        ? { reason: optionsOrReason }
        : optionsOrReason;

    const existingMember = world.getComponent(beingEntity, MemberComponent);
    if (existingMember && existingMember.factionId && existingMember.factionId !== factionId) {
      this.leaveFaction(world, beingEntity, 'Chuyển sang thế lực mới');
    }

    const factionEnt = this.findFactionEntity(world, factionId);
    const fComp = factionEnt !== null ? world.getComponent(factionEnt, FactionComponent) : undefined;
    const date = TimeManager.getInstance().getDate();
    const effectiveJoinedDays = joinedDays ?? date.totalDays;

    const effectiveRole: MemberRole =
      fComp && isCivilFactionType(fComp.type) && role === 'outer_disciple'
        ? 'villager'
        : role;

    let memberComp = world.getComponent(beingEntity, MemberComponent);
    if (!memberComp) {
      memberComp = new MemberComponent(factionId, effectiveRole);
      memberComp.joinedDays = effectiveJoinedDays;
      if (options?.reason) memberComp.intentReason = options.reason;
      world.addComponent(beingEntity, memberComp);
    } else {
      memberComp.factionId = factionId;
      memberComp.role = effectiveRole;
      memberComp.joinedDays = effectiveJoinedDays;
      if (options?.reason) memberComp.intentReason = options.reason;
    }

    if (fComp) {
      fComp.members.add(beingEntity);
      fComp.hasBeenPopulated = true;
      if (
        effectiveRole === 'sect_master' ||
        effectiveRole === 'sect_leader' ||
        effectiveRole === 'village_head' ||
        effectiveRole === 'king'
      ) {
        fComp.leaderEntityId = beingEntity;
        if (fComp.founderEntityId === null) {
          fComp.founderEntityId = beingEntity;
        }
      }

      // Nếu là thế lực dân sinh và cư dân chưa có nơi cư trú -> gán vào khu định cư của thế lực
      if (isCivilFactionType(fComp.type) && !options?.preserveResidence) {
        const resComp = world.getComponent(beingEntity, ResidenceComponent);
        if (!resComp) {
          const pos = world.getComponent(beingEntity, PositionComponent);
          const nearestSettlement = this.findNearestSettlement(world, pos?.x ?? 0, pos?.y ?? 0, factionId);
          if (nearestSettlement) {
            this.assignResidence(world, beingEntity, nearestSettlement.comp.settlementId, factionId);
          }
        }
      }
    }

    return true;
  }

  /**
   * API tập trung rời khỏi thế lực:
   * - Xóa khỏi FactionComponent.members
   * - Nếu là thủ lĩnh -> tự động bầu người kế vị hợp lệ ngay lập tức
   * - Xóa MemberComponent khỏi thực thể
   */
  public static leaveFaction(
    world: ECSWorld,
    beingEntity: Entity,
    reason: string = 'Rời khỏi tổ chức'
  ): void {
    const memberComp = world.getComponent(beingEntity, MemberComponent);
    if (!memberComp) return;

    const oldFactionId = memberComp.factionId;
    const date = TimeManager.getInstance().getDate();

    if (oldFactionId) {
      const fEnt = this.findFactionEntity(world, oldFactionId);
      if (fEnt !== null) {
        const fComp = world.getComponent(fEnt, FactionComponent);
        if (fComp) {
          fComp.members.delete(beingEntity);
          if (fComp.leaderEntityId === beingEntity) {
            fComp.leaderEntityId = null;
            this.electSuccessor(world, fEnt);
          }
        }
      }
    }

    memberComp.intentReason = reason;
    memberComp.leaveCooldownUntilDays = date.totalDays + 15;
    world.removeComponent(beingEntity, MemberComponent);
  }

  /**
   * API tập trung gán nơi cư trú (ResidenceComponent) độc lập với tư cách thành viên tổ chức (MemberComponent).
   */
  public static assignResidence(
    world: ECSWorld,
    beingEntity: Entity,
    settlementId: string,
    factionIdOrHomeRoleOrBuilding: string | number | null = null,
    homeBuildingIdOrJoinedDays: number | null = null
  ): boolean {
    const sEnt = this.findSettlementEntity(world, settlementId);
    if (sEnt === null) return false;
    const sComp = world.getComponent(sEnt, SettlementComponent);
    if (!sComp) return false;

    let factionId = sComp.ownerFactionId;
    let homeRole: ResidenceComponent['homeRole'] = 'resident';
    let homeBuildingId: number | null = null;

    if (typeof factionIdOrHomeRoleOrBuilding === 'string') {
      if (
        factionIdOrHomeRoleOrBuilding === 'resident' ||
        factionIdOrHomeRoleOrBuilding === 'elder' ||
        factionIdOrHomeRoleOrBuilding === 'head' ||
        factionIdOrHomeRoleOrBuilding === 'guest'
      ) {
        homeRole = factionIdOrHomeRoleOrBuilding;
      } else {
        factionId = factionIdOrHomeRoleOrBuilding;
      }
    } else if (typeof factionIdOrHomeRoleOrBuilding === 'number') {
      homeBuildingId = factionIdOrHomeRoleOrBuilding;
    }

    const existingRes = world.getComponent(beingEntity, ResidenceComponent);
    if (homeBuildingId !== null && !this.canAssignHome(world, beingEntity, homeBuildingId, settlementId)) {
      return false;
    }
    if (existingRes && existingRes.settlementId !== settlementId) {
      this.leaveResidence(world, beingEntity);
    }

    const existingMem = world.getComponent(beingEntity, MemberComponent);
    if (
      homeRole === 'resident' &&
      (sComp.localLeaderEntityId === beingEntity ||
        existingMem?.role === 'village_head' ||
        existingMem?.role === 'king')
    ) {
      homeRole = 'head';
    } else if (homeRole === 'resident' && existingMem?.role === 'elder') {
      homeRole = 'elder';
    }

    const date = TimeManager.getInstance().getDate();
    let resComp = world.getComponent(beingEntity, ResidenceComponent);
    if (!resComp) {
      resComp = new ResidenceComponent(settlementId, factionId, homeBuildingId, homeBuildingIdOrJoinedDays ?? date.totalDays);
      resComp.homeRole = homeRole;
      world.addComponent(beingEntity, resComp);
    } else {
      resComp.settlementId = settlementId;
      resComp.factionId = factionId;
      resComp.homeRole = homeRole;
      if (homeBuildingId !== null) resComp.homeBuildingEntityId = homeBuildingId;
    }

    sComp.residentIds.add(beingEntity);
    if (homeBuildingId === null && !resComp.homeBuildingEntityId) {
      const buildings = [...sComp.buildings].sort((a, b) => a - b);
      for (const buildingId of buildings) {
        if (this.assignHome(world, beingEntity, buildingId)) break;
      }
    }
    if (homeBuildingId !== null) {
      const sched = world.getComponent(beingEntity, DailyScheduleComponent);
      if (sched) {
        sched.homeBuildingEntityId = homeBuildingId;
      }
    }

    // Nếu cư dân chưa có tổ chức chính (ví dụ không thuộc Tông Môn nào) và khu định cư có chính quyền địa phương
    const memberComp = world.getComponent(beingEntity, MemberComponent);
    if (!memberComp && sComp.ownerFactionId && this.isBeingSociallyEligible(world, beingEntity, false)) {
      this.assignMemberToFaction(world, beingEntity, sComp.ownerFactionId, 'villager', {
        reason: `Định cư tại ${sComp.name}`,
        preserveResidence: true
      });
    }

    return true;
  }

  private static canAssignHome(world: ECSWorld, beingEntity: Entity, buildingId: Entity, settlementId: string): boolean {
    const residentHealth = world.getComponent(beingEntity, HealthComponent);
    if (!residentHealth || residentHealth.isDead) return false;
    const building = world.getComponent(buildingId, BuildingComponent);
    const capacity = building ? (BUILDING_DEFINITIONS[building.buildingType].housingCapacity ?? 0) : 0;
    if (!building || capacity <= 0 || building.isRuins || building.isUnderConstruction ||
        building.currentDurability <= 0 || building.settlementId !== settlementId) return false;
    let occupants = 0;
    for (const person of world.query([ResidenceComponent])) {
      if (person === beingEntity) continue;
      const residence = world.getComponent(person, ResidenceComponent)!;
      const hp = world.getComponent(person, HealthComponent);
      if (residence.homeBuildingEntityId === buildingId && hp && !hp.isDead) occupants++;
    }
    return occupants < capacity;
  }

  public static assignHome(world: ECSWorld, beingEntity: Entity, buildingId: Entity): boolean {
    const residence = world.getComponent(beingEntity, ResidenceComponent);
    if (!residence || !this.canAssignHome(world, beingEntity, buildingId, residence.settlementId)) return false;
    residence.homeBuildingEntityId = buildingId;
    const schedule = world.getComponent(beingEntity, DailyScheduleComponent);
    if (schedule) schedule.homeBuildingEntityId = buildingId;
    return true;
  }

  public static releaseHome(world: ECSWorld, beingEntity: Entity): void {
    const residence = world.getComponent(beingEntity, ResidenceComponent);
    if (residence) residence.homeBuildingEntityId = null;
    const schedule = world.getComponent(beingEntity, DailyScheduleComponent);
    if (schedule) schedule.homeBuildingEntityId = null;
    SmartObjectManager.getInstance().release(beingEntity);
  }

  public static getHomeOccupancy(world: ECSWorld, buildingId: Entity): { occupied: number; capacity: number } {
    const building = world.getComponent(buildingId, BuildingComponent);
    const capacity = building && !building.isUnderConstruction && !building.isRuins && building.currentDurability > 0
      ? (BUILDING_DEFINITIONS[building.buildingType].housingCapacity ?? 0) : 0;
    let occupied = 0;
    for (const person of world.query([ResidenceComponent])) {
      const residence = world.getComponent(person, ResidenceComponent)!;
      const hp = world.getComponent(person, HealthComponent);
      if (residence.homeBuildingEntityId === buildingId && hp && !hp.isDead) occupied++;
    }
    return { occupied, capacity };
  }

  /** Rebuild home links deterministically after loading or a building lifecycle change. */
  public static reconcileHomes(world: ECSWorld): void {
    const residents = world.query([ResidenceComponent]).sort((a, b) => a - b);
    const requested = new Map<number, number | null>();
    for (const person of residents) {
      requested.set(person, world.getComponent(person, ResidenceComponent)!.homeBuildingEntityId);
      this.releaseHome(world, person);
    }
    for (const person of residents) {
      const hp = world.getComponent(person, HealthComponent);
      if (!hp || hp.isDead) continue;
      const desired = requested.get(person);
      if (desired !== null && desired !== undefined) this.assignHome(world, person, desired);
    }
  }

  public static pruneInvalidHomes(world: ECSWorld): void {
    for (const person of world.query([ResidenceComponent])) {
      const residence = world.getComponent(person, ResidenceComponent)!;
      if (residence.homeBuildingEntityId === null) continue;
      const hp = world.getComponent(person, HealthComponent);
      const building = world.getComponent(residence.homeBuildingEntityId, BuildingComponent);
      if (!hp || hp.isDead || !building || building.isRuins || building.isUnderConstruction ||
          building.currentDurability <= 0 || building.settlementId !== residence.settlementId) {
        this.releaseHome(world, person);
      }
    }
  }

  public static leaveResidence(world: ECSWorld, beingEntity: Entity): void {
    const resComp = world.getComponent(beingEntity, ResidenceComponent);
    if (!resComp) return;

    this.releaseHome(world, beingEntity);

    const sEnt = this.findSettlementEntity(world, resComp.settlementId);
    if (sEnt !== null) {
      const sComp = world.getComponent(sEnt, SettlementComponent);
      if (sComp) {
        sComp.residentIds.delete(beingEntity);
        if (sComp.localLeaderEntityId === beingEntity) {
          sComp.localLeaderEntityId = null;
        }
      }
    }

    world.removeComponent(beingEntity, ResidenceComponent);
  }

  /**
   * Bầu chọn người kế vị hợp lệ theo đúng loại thế lực:
   * - Thôn/Làng: đóng góp, uy tín và quan hệ xã hội tốt
   * - Vương Quốc: huyết thống kế thừa (FamilyComponent) + sự ủng hộ + năng lực
   * - Tông Môn / Thánh Địa: tu vi chuẩn hóa, truyền thừa công pháp và cống hiến
   */
  public static electSuccessor(world: ECSWorld, factionOrEnt: Entity | FactionComponent): number | null {
    const faction =
      typeof factionOrEnt === 'number'
        ? world.getComponent(factionOrEnt, FactionComponent)
        : factionOrEnt;
    if (!faction) return null;

    const previousLeaderId = faction.leaderEntityId ?? faction.founderEntityId;
    const candidates: number[] = [];

    for (const mId of faction.members) {
      if (this.isBeingSociallyEligible(world, mId, false)) {
        candidates.push(mId);
      }
    }

    // Nếu danh sách members trống nhưng là thế lực dân sinh có cư dân trong các khu định cư
    if (candidates.length === 0 && isCivilFactionType(faction.type)) {
      for (const sId of faction.settlementIds) {
        const sEnt = this.findSettlementEntity(world, sId);
        const sComp = sEnt !== null ? world.getComponent(sEnt, SettlementComponent) : undefined;
        if (sComp) {
          for (const rId of sComp.residentIds) {
            if (this.isBeingSociallyEligible(world, rId, false) && !candidates.includes(rId)) {
              candidates.push(rId);
            }
          }
        }
      }
    }

    if (candidates.length === 0) {
      faction.leaderEntityId = null;
      return null;
    }

    let bestCandidate = candidates[0];
    let bestScore = -Infinity;

    for (const candId of candidates) {
      const member = world.getComponent(candId, MemberComponent);
      const realm = world.getComponent(candId, RealmComponent);
      const race = world.getComponent(candId, RaceComponent);
      const tech = world.getComponent(candId, CultivationTechniqueComponent);
      const social = world.getComponent(candId, SocialRelationshipComponent);
      const family = world.getComponent(candId, FamilyComponent);

      const contribution = member?.contribution ?? 0;
      const normTier = getNormalizedCultivationTier(
        race?.raceId ?? 'human',
        realm?.stageIndex ?? 0,
        realm?.combatPower ?? 10
      );

      // Tính tổng điểm tín nhiệm và hảo cảm trong nội bộ thế lực
      let socialSupport = 0;
      if (social) {
        for (const rel of social.relationships.values()) {
          if (faction.members.has(rel.targetEntityId)) {
            socialSupport += Math.max(0, rel.affinity) * 0.4 + rel.trust * 0.3 + rel.respect * 0.3;
          }
        }
      }

      let score = 0;
      if (faction.type === 'hamlet' || faction.type === 'village') {
        score = contribution * 3 + socialSupport * 1.5 + (realm?.combatPower ?? 10) * 0.1;
      } else if (faction.type === 'kingdom') {
        let royalBonus = 0;
        if (previousLeaderId !== null && family && family.parentIds.includes(previousLeaderId)) {
          royalBonus = 500;
        }
        score = royalBonus + socialSupport * 2.0 + contribution * 2.5 + (realm?.combatPower ?? 10) * 0.3;
      } else {
        const techBonus = tech ? tech.tier * 80 + (tech.masteryExp ?? 0) * 0.2 : 0;
        score = normTier * 400 + (realm?.stageIndex ?? 0) * 200 + (realm?.combatPower ?? 10) * 0.5 + techBonus + contribution * 2 + socialSupport;
      }

      if (score > bestScore) {
        bestScore = score;
        bestCandidate = candId;
      }
    }

    faction.leaderEntityId = bestCandidate;
    const leaderRole: MemberRole =
      faction.type === 'kingdom'
        ? 'king'
        : isCivilFactionType(faction.type)
        ? 'village_head'
        : 'sect_master';
    let mComp = world.getComponent(bestCandidate, MemberComponent);
    if (!mComp) {
      this.assignMemberToFaction(world, bestCandidate, faction.factionId, leaderRole);
    } else {
      mComp.role = leaderRole;
    }

    if (faction.capitalSettlementId) {
      const capEnt = this.findSettlementEntity(world, faction.capitalSettlementId);
      const capComp = capEnt !== null ? world.getComponent(capEnt, SettlementComponent) : undefined;
      if (capComp) {
        capComp.localLeaderEntityId = bestCandidate;
      }
    }

    const candidateName = world.getComponent(bestCandidate, NameComponent)?.name ?? 'Vô Danh';
    EventBus.getInstance().emit('chronicle:entry', {
      category: 'breakthrough',
      message: `${faction.getLeaderTitle()} kế vị: [${candidateName}] chính thức tiếp chưởng ngôi vị ${faction.getLeaderTitle()} của [${faction.name}]!`,
      importance: 'high'
    });

    return bestCandidate;
  }

  private static resolveResourceHolder(
    holderOrWorld:
      | ECSWorld
      | {
          foodStock: number;
          woodStock: number;
          stoneStock: number;
          spiritStones?: number;
          reservedResources: ResourceBundle;
        },
    factionIdOrCost: string | Partial<ResourceBundle>
  ): {
    holder: {
      foodStock: number;
      woodStock: number;
      stoneStock: number;
      spiritStones?: number;
      reservedResources: ResourceBundle;
    } | null;
    cost: ResourceBundle;
  } {
    if (holderOrWorld instanceof ECSWorld && typeof factionIdOrCost === 'string') {
      const fEnt = this.findFactionEntity(holderOrWorld, factionIdOrCost);
      const fComp = fEnt !== null ? holderOrWorld.getComponent(fEnt, FactionComponent) : undefined;
      return {
        holder: fComp ?? null,
        cost: { food: 0, wood: 0, stone: 0, spiritStones: 0 }
      };
    }
    const c = factionIdOrCost as Partial<ResourceBundle>;
    return {
      holder: holderOrWorld as {
        foodStock: number;
        woodStock: number;
        stoneStock: number;
        spiritStones?: number;
        reservedResources: ResourceBundle;
      },
      cost: {
        food: c?.food ?? 0,
        wood: c?.wood ?? 0,
        stone: c?.stone ?? 0,
        spiritStones: c?.spiritStones ?? 0
      }
    };
  }

  /**
   * Đặt trước chi phí xây dựng từ kho của khu định cư hoặc thế lực (trừ 1 lần khi đặt trước).
   */
  public static reserveResources(
    holderOrWorld:
      | ECSWorld
      | {
          foodStock: number;
          woodStock: number;
          stoneStock: number;
          spiritStones?: number;
          reservedResources: ResourceBundle;
        },
    factionIdOrCost: string | Partial<ResourceBundle>,
    optionalCost?: Partial<ResourceBundle>
  ): boolean {
    const resolved = this.resolveResourceHolder(holderOrWorld, factionIdOrCost);
    const holder = resolved.holder;
    if (!holder) return false;
    const cost: ResourceBundle = optionalCost
      ? {
          food: optionalCost.food ?? 0,
          wood: optionalCost.wood ?? 0,
          stone: optionalCost.stone ?? 0,
          spiritStones: optionalCost.spiritStones ?? 0
        }
      : resolved.cost;

    const availStones = holder.spiritStones ?? 0;
    if (
      holder.foodStock < cost.food ||
      holder.woodStock < cost.wood ||
      holder.stoneStock < cost.stone ||
      availStones < cost.spiritStones
    ) {
      return false;
    }

    if (!holder.reservedResources) {
      holder.reservedResources = { food: 0, wood: 0, stone: 0, spiritStones: 0 };
    }

    holder.foodStock -= cost.food;
    holder.woodStock -= cost.wood;
    holder.stoneStock -= cost.stone;
    if (holder.spiritStones !== undefined) {
      holder.spiritStones -= cost.spiritStones;
    }

    holder.reservedResources.food += cost.food;
    holder.reservedResources.wood += cost.wood;
    holder.reservedResources.stone += cost.stone;
    holder.reservedResources.spiritStones += cost.spiritStones;
    return true;
  }

  /**
   * Tiêu hao phần tài nguyên đã đặt trước khi hoàn tất công trình (đảm bảo không trừ 2 lần).
   */
  public static consumeReservedResources(
    holderOrWorld:
      | ECSWorld
      | {
          foodStock: number;
          woodStock: number;
          stoneStock: number;
          spiritStones?: number;
          reservedResources: ResourceBundle;
        },
    factionIdOrCost: string | Partial<ResourceBundle>,
    optionalCost?: Partial<ResourceBundle>
  ): void {
    const resolved = this.resolveResourceHolder(holderOrWorld, factionIdOrCost);
    const holder = resolved.holder;
    if (!holder) return;
    const cost: ResourceBundle = optionalCost
      ? {
          food: optionalCost.food ?? 0,
          wood: optionalCost.wood ?? 0,
          stone: optionalCost.stone ?? 0,
          spiritStones: optionalCost.spiritStones ?? 0
        }
      : resolved.cost;

    if (!holder.reservedResources) {
      holder.reservedResources = { food: 0, wood: 0, stone: 0, spiritStones: 0 };
    }

    holder.reservedResources.food = Math.max(0, holder.reservedResources.food - cost.food);
    holder.reservedResources.wood = Math.max(0, holder.reservedResources.wood - cost.wood);
    holder.reservedResources.stone = Math.max(0, holder.reservedResources.stone - cost.stone);
    holder.reservedResources.spiritStones = Math.max(0, holder.reservedResources.spiritStones - cost.spiritStones);
  }

  /**
   * Hoàn lại phần tài nguyên đã đặt trước khi hủy công việc hoặc hủy ý định sáng lập.
   */
  public static refundReservedResources(
    holderOrWorld:
      | ECSWorld
      | {
          foodStock: number;
          woodStock: number;
          stoneStock: number;
          spiritStones?: number;
          reservedResources: ResourceBundle;
        },
    factionIdOrCost: string | Partial<ResourceBundle>,
    optionalCost?: Partial<ResourceBundle>
  ): void {
    const resolved = this.resolveResourceHolder(holderOrWorld, factionIdOrCost);
    const holder = resolved.holder;
    if (!holder) return;
    const cost: ResourceBundle = optionalCost
      ? {
          food: optionalCost.food ?? 0,
          wood: optionalCost.wood ?? 0,
          stone: optionalCost.stone ?? 0,
          spiritStones: optionalCost.spiritStones ?? 0
        }
      : resolved.cost;

    if (!holder.reservedResources) {
      holder.reservedResources = { food: 0, wood: 0, stone: 0, spiritStones: 0 };
    }

    const refundFood = Math.min(holder.reservedResources.food, cost.food);
    const refundWood = Math.min(holder.reservedResources.wood, cost.wood);
    const refundStone = Math.min(holder.reservedResources.stone, cost.stone);
    const refundSpirit = Math.min(holder.reservedResources.spiritStones, cost.spiritStones);

    holder.reservedResources.food -= refundFood;
    holder.reservedResources.wood -= refundWood;
    holder.reservedResources.stone -= refundStone;
    holder.reservedResources.spiritStones -= refundSpirit;

    holder.foodStock += refundFood;
    holder.woodStock += refundWood;
    holder.stoneStock += refundStone;
    if (holder.spiritStones !== undefined) {
      holder.spiritStones += refundSpirit;
    }
  }

  public static findFactionEntity(world: ECSWorld, factionId: string): Entity | null {
    if (!factionId) return null;
    const factions = world.query([FactionComponent]);
    for (const ent of factions) {
      const comp = world.getComponent(ent, FactionComponent);
      if (comp && comp.factionId === factionId) {
        return ent;
      }
    }
    return null;
  }

  public static findSettlementEntity(world: ECSWorld, settlementId: string): Entity | null {
    if (!settlementId) return null;
    const settlements = world.query([SettlementComponent]);
    for (const ent of settlements) {
      const comp = world.getComponent(ent, SettlementComponent);
      if (comp && comp.settlementId === settlementId) {
        return ent;
      }
    }
    return null;
  }

  public static findNearestSettlement(
    world: ECSWorld,
    x: number,
    y: number,
    ownerFactionId?: string,
    maxDistPx: number = Infinity
  ): { entity: Entity; comp: SettlementComponent; dist: number } | null {
    const settlements = world.query([SettlementComponent]);
    let best: { entity: Entity; comp: SettlementComponent; dist: number } | null = null;
    let minDist = maxDistPx;

    for (const ent of settlements) {
      const comp = world.getComponent(ent, SettlementComponent)!;
      if (ownerFactionId && comp.ownerFactionId !== ownerFactionId) continue;
      const dist = Math.hypot(comp.centerX - x, comp.centerY - y);
      if (dist <= minDist) {
        minDist = dist;
        best = { entity: ent, comp, dist };
      }
    }

    return best;
  }
}
