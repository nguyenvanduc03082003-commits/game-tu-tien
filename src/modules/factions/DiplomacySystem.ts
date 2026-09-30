import { System } from '../../ecs/System.ts';
import { ECSWorld } from '../../ecs/World.ts';
import { EventBus } from '../../core/EventBus.ts';
import { SpatialGrid } from '../../core/SpatialGrid.ts';
import { PositionComponent, HealthComponent, RaceComponent } from '../beings/BeingComponents.ts';
import { CombatStatsComponent } from '../combat/CombatComponents.ts';
import {
  FactionComponent,
  SettlementComponent,
  ResidenceComponent,
  MemberComponent,
  BuildingComponent,
  TerritoryCenterComponent
} from './FactionComponents.ts';
import { FactionFactory } from './FactionFactory.ts';
import { CommunityTaskBoard } from '../ai/community/CommunityTaskBoard.ts';
import { isCivilFactionType, isCultivationFactionType } from '../../config/factions.config.ts';

export type DiplomaticRelation = 'allied' | 'neutral' | 'war';

export interface TreatyData {
  suzerains?: Record<string, string>;      // vassalFactionId -> suzerainFactionId
  protectorates?: Record<string, string>;  // settlementId -> protectorFactionId
  tradePairs?: string[];                   // ["factionA:factionB"]
  disputes?: Record<string, number>;       // "factionA:factionB" -> tension (0..100)
}

export class DiplomacySystem implements System {
  public name = 'DiplomacySystem';
  public enabled = true;
  public priority = 31;

  public spatialGrid: SpatialGrid | null = null;

  // Lưu trữ quan hệ giữa cặp faction: key "factionA_id:factionB_id" -> 'allied' | 'neutral' | 'war'
  private relations: Map<string, DiplomaticRelation> = new Map();
  // Quan hệ trực thuộc (chư hầu -> thượng quốc): chống vòng lặp nghiêm ngặt
  private suzerains: Map<string, string> = new Map();
  // Quan hệ bảo hộ khu định cư (settlementId -> protectorFactionId)
  private protectorates: Map<string, string> = new Map();
  // Hiệp ước thương mại giữa hai thế lực
  private tradePairs: Set<string> = new Set();
  // Điểm tranh chấp lãnh thổ / ly khai
  private disputes: Map<string, number> = new Map();

  private eventBus = EventBus.getInstance();
  private checkTimer: number = 0;
  private treatyTimer: number = 0;
  private roundRobinIndex: number = 0;
  private lastPairsChecked: number = 0;

  /**
   * Xóa sạch quan hệ ngoại giao, hiệp ước và bộ đếm quét quan hệ giữa các thế lực.
   */
  public clear(): void {
    this.relations.clear();
    this.suzerains.clear();
    this.protectorates.clear();
    this.tradePairs.clear();
    this.disputes.clear();
    this.checkTimer = 0;
    this.treatyTimer = 0;
    this.roundRobinIndex = 0;
    this.lastPairsChecked = 0;
  }

  public getRelationsCount(): number {
    return this.relations.size;
  }

  public getLastPairsChecked(): number {
    return this.lastPairsChecked;
  }

  public getRoundRobinIndex(): number {
    return this.roundRobinIndex;
  }

  public serializeRelations(): Record<string, DiplomaticRelation> {
    const out: Record<string, DiplomaticRelation> = {};
    for (const [k, v] of this.relations.entries()) {
      out[k] = v;
    }
    return out;
  }

  public restoreRelations(data?: Record<string, DiplomaticRelation>): void {
    this.relations.clear();
    this.checkTimer = 0;
    this.roundRobinIndex = 0;
    this.lastPairsChecked = 0;
    if (!data || typeof data !== 'object') return;
    for (const [k, v] of Object.entries(data)) {
      if (v === 'allied' || v === 'neutral' || v === 'war') {
        this.relations.set(k, v);
      }
    }
  }

  public serializeTreaties(): TreatyData {
    const suzerainsObj: Record<string, string> = {};
    for (const [k, v] of this.suzerains.entries()) suzerainsObj[k] = v;

    const protectoratesObj: Record<string, string> = {};
    for (const [k, v] of this.protectorates.entries()) protectoratesObj[k] = v;

    const disputesObj: Record<string, number> = {};
    for (const [k, v] of this.disputes.entries()) disputesObj[k] = v;

    return {
      suzerains: suzerainsObj,
      protectorates: protectoratesObj,
      tradePairs: Array.from(this.tradePairs),
      disputes: disputesObj
    };
  }

  public restoreTreaties(data?: TreatyData, _world?: ECSWorld): void {
    this.suzerains.clear();
    this.protectorates.clear();
    this.tradePairs.clear();
    this.disputes.clear();
    if (!data || typeof data !== 'object') return;

    if (data.suzerains) {
      for (const [vassal, suz] of Object.entries(data.suzerains)) {
        if (!this.wouldCreateSubordinationCycle(vassal, suz)) {
          this.suzerains.set(vassal, suz);
        }
      }
    }
    if (data.protectorates) {
      for (const [sId, pId] of Object.entries(data.protectorates)) {
        this.protectorates.set(sId, pId);
      }
    }
    if (Array.isArray(data.tradePairs)) {
      for (const k of data.tradePairs) {
        if (typeof k === 'string') this.tradePairs.add(k);
      }
    }
    if (data.disputes) {
      for (const [k, v] of Object.entries(data.disputes)) {
        if (typeof v === 'number' && Number.isFinite(v)) {
          this.disputes.set(k, v);
        }
      }
    }
  }

  private getPairKey(a: string, b: string): string {
    return a < b ? `${a}:${b}` : `${b}:${a}`;
  }

  /**
   * Kiểm tra chống vòng lặp quan hệ trực thuộc (A -> B -> ... -> A).
   */
  public wouldCreateSubordinationCycle(subordinateFactionId: string, candidateSuzerainId: string, world?: ECSWorld): boolean {
    if (!subordinateFactionId || !candidateSuzerainId) return true;
    if (subordinateFactionId === candidateSuzerainId) return true;

    const visited = new Set<string>([subordinateFactionId]);
    let curr: string | undefined | null = candidateSuzerainId;

    while (curr) {
      if (visited.has(curr)) {
        return true; // Phát hiện vòng lặp trực thuộc!
      }
      visited.add(curr);
      let next: string | null = this.suzerains.get(curr) ?? null;
      if (!next && world) {
        const fEnt = FactionFactory.findFactionEntity(world, curr);
        const fComp = fEnt !== null ? world.getComponent(fEnt, FactionComponent) : undefined;
        next = fComp?.suzerainFactionId ?? null;
      }
      curr = next;
    }

    return false;
  }

  /**
   * Thiết lập quan hệ chư hầu / quy phục giữa 2 thế lực (có chống vòng lặp).
   */
  public establishVassalage(
    worldOrSuzerain: ECSWorld | string,
    vassalOrSubordinate: string,
    suzerainFactionId?: string
  ): boolean {
    const hasWorld = worldOrSuzerain instanceof ECSWorld;
    const world = hasWorld ? worldOrSuzerain : undefined;
    const vassalId = hasWorld ? vassalOrSubordinate : vassalOrSubordinate;
    const suzerainId = hasWorld ? (suzerainFactionId ?? '') : (worldOrSuzerain as string);

    if (this.wouldCreateSubordinationCycle(vassalId, suzerainId, world)) {
      return false;
    }

    this.suzerains.set(vassalId, suzerainId);
    const key = this.getPairKey(vassalId, suzerainId);
    this.relations.set(key, 'allied');
    this.disputes.delete(key);

    if (world) {
      const vEnt = FactionFactory.findFactionEntity(world, vassalId);
      const sEnt = FactionFactory.findFactionEntity(world, suzerainId);
      if (vEnt !== null && sEnt !== null) {
        const vComp = world.getComponent(vEnt, FactionComponent)!;
        const sComp = world.getComponent(sEnt, FactionComponent)!;

        if (vComp.suzerainFactionId && vComp.suzerainFactionId !== suzerainId) {
          const oldSuzEnt = FactionFactory.findFactionEntity(world, vComp.suzerainFactionId);
          const oldSuzComp = oldSuzEnt !== null ? world.getComponent(oldSuzEnt, FactionComponent) : undefined;
          if (oldSuzComp) {
            oldSuzComp.vassalFactionIds = oldSuzComp.vassalFactionIds.filter(id => id !== vassalId);
          }
        }

        vComp.suzerainFactionId = suzerainId;
        if (!sComp.vassalFactionIds.includes(vassalId)) {
          sComp.vassalFactionIds.push(vassalId);
        }

        this.eventBus.emit('chronicle:entry', {
          category: 'breakthrough',
          message: `👑 QUY PHỤC CHƯ HẦU: [${vComp.name}] chính thức quy thuận làm chư hầu dưới trướng [${sComp.name}]!`,
          importance: 'high'
        });
      }
    }

    return true;
  }

  /**
   * Thiết lập hiệp ước bảo hộ: Tông môn / Thánh địa bảo hộ một khu định cư (Làng / Thôn)
   * mà KHÔNG sửa hàng loạt factionId của dân làng!
   */
  public establishProtectorate(
    worldOrProtector: ECSWorld | string,
    protectorOrTarget: string,
    targetFactionOrSettlementId?: string,
    optionalSettlementId?: string
  ): boolean {
    if (!(worldOrProtector instanceof ECSWorld)) {
      const protId = worldOrProtector;
      const targetId = protectorOrTarget;
      this.protectorates.set(targetId, protId);
      this.relations.set(this.getPairKey(protId, targetId), 'allied');
      return true;
    }

    const world = worldOrProtector;
    const protectorFactionId = protectorOrTarget;
    const settlementId = optionalSettlementId ?? targetFactionOrSettlementId ?? '';
    const targetFactionId = optionalSettlementId ? targetFactionOrSettlementId : undefined;

    const pEnt = FactionFactory.findFactionEntity(world, protectorFactionId);
    const sEnt = FactionFactory.findSettlementEntity(world, settlementId);
    const pComp = pEnt !== null ? world.getComponent(pEnt, FactionComponent) : undefined;
    const sComp = sEnt !== null ? world.getComponent(sEnt, SettlementComponent) : undefined;

    if (sComp && sComp.ownerFactionId === protectorFactionId) return false;

    if (sComp) {
      if (sComp.protectorFactionId && sComp.protectorFactionId !== protectorFactionId) {
        const oldPEnt = FactionFactory.findFactionEntity(world, sComp.protectorFactionId);
        const oldPComp = oldPEnt !== null ? world.getComponent(oldPEnt, FactionComponent) : undefined;
        if (oldPComp) {
          oldPComp.protectedSettlementIds = oldPComp.protectedSettlementIds.filter(id => id !== settlementId);
        }
      }
      sComp.protectorFactionId = protectorFactionId;
    }

    if (pComp && settlementId && !pComp.protectedSettlementIds.includes(settlementId)) {
      pComp.protectedSettlementIds.push(settlementId);
    }
    if (settlementId) {
      this.protectorates.set(settlementId, protectorFactionId);
    }

    const villageFactionId = targetFactionId ?? sComp?.ownerFactionId;
    if (villageFactionId) {
      const vEnt = FactionFactory.findFactionEntity(world, villageFactionId);
      const vComp = vEnt !== null ? world.getComponent(vEnt, FactionComponent) : undefined;
      if (vComp) {
        vComp.protectorFactionId = protectorFactionId;
      }
      this.protectorates.set(villageFactionId, protectorFactionId);
      const key = this.getPairKey(protectorFactionId, villageFactionId);
      this.relations.set(key, 'allied');
    }

    if (pComp && sComp) {
      this.eventBus.emit('chronicle:entry', {
        category: 'breakthrough',
        message: `🛡️ HIỆP ƯỚC BẢO HỘ: [${pComp.name}] lập ước che chở cho khu định cư [${sComp.name}], dân làng giữ nguyên sinh kế!`,
        importance: 'normal'
      });
    }

    return true;
  }

  public isProtectorOf(protectorFactionId: string, targetFactionOrSettlementId: string): boolean {
    return this.protectorates.get(targetFactionOrSettlementId) === protectorFactionId;
  }

  /**
   * Thiết lập quan hệ thương mại giữa hai thế lực hòa bình.
   */
  public establishTrade(world: ECSWorld, factionA: string, factionB: string): boolean {
    if (factionA === factionB) return false;
    if (this.getRelation(factionA, factionB, world) === 'war') return false;

    const key = this.getPairKey(factionA, factionB);
    if (this.tradePairs.has(key)) return true;

    this.tradePairs.add(key);
    return true;
  }

  public hasTrade(factionA: string, factionB: string): boolean {
    return this.tradePairs.has(this.getPairKey(factionA, factionB));
  }

  public getSuzerain(vassalFactionId: string): string | null {
    return this.suzerains.get(vassalFactionId) ?? null;
  }

  public getProtector(settlementId: string): string | null {
    return this.protectorates.get(settlementId) ?? null;
  }

  /**
   * Sáp nhập hợp lệ một Làng/Thôn vào Vương Quốc (hoặc thế lực dân sinh lớn hơn):
   * - Giữ nguyên Khu Định Cư (SettlementComponent) và cư dân (ResidenceComponent)
   * - Không sửa MemberComponent của đệ tử Tông Môn đang cư trú tại làng
   * - Chuyển quyền quản lý chính trị của khu định cư sang thế lực sáp nhập
   */
  public mergeSettlementIntoFaction(
    world: ECSWorld,
    settlementId: string,
    targetFactionId: string,
    deferSourceCleanup: boolean = false
  ): boolean {
    const sEnt = FactionFactory.findSettlementEntity(world, settlementId);
    const targetFEnt = FactionFactory.findFactionEntity(world, targetFactionId);
    if (sEnt === null || targetFEnt === null) return false;

    const sComp = world.getComponent(sEnt, SettlementComponent)!;
    const targetFComp = world.getComponent(targetFEnt, FactionComponent)!;
    const oldOwnerId = sComp.ownerFactionId;

    if (oldOwnerId === targetFactionId) return false;

    // 1. Chuyển khu định cư sang thế lực quản lý mới
    sComp.ownerFactionId = targetFactionId;
    this.syncSettlementOwnership(world, sEnt, sComp, targetFComp, oldOwnerId);
    if (!targetFComp.settlementIds.includes(settlementId)) {
      targetFComp.settlementIds.push(settlementId);
    }

    // 2. Cập nhật chủ sở hữu các công trình dân sinh thuộc khu định cư này
    for (const bId of sComp.buildings) {
      const bComp = world.getComponent(bId, BuildingComponent);
      if (bComp && bComp.factionId === oldOwnerId) {
        bComp.factionId = targetFactionId;
      }
      const tc = world.getComponent(bId, TerritoryCenterComponent);
      if (tc && tc.factionId === oldOwnerId) {
        tc.factionId = targetFactionId;
        tc.color = targetFComp.color;
      }
    }

    // 3. Chuyển các cư dân chỉ có tư cách công dân địa phương (không đụng tới đệ tử Tông Môn!)
    for (const rId of sComp.residentIds) {
      const mComp = world.getComponent(rId, MemberComponent);
      if (mComp && mComp.factionId === oldOwnerId) {
        const role = mComp.role === 'sect_master' || mComp.role === 'village_head' ? 'elder' : mComp.role;
        FactionFactory.assignMemberToFaction(world, rId, targetFactionId, role, {
          reason: `Sáp nhập vào ${targetFComp.name}`,
          preserveResidence: true
        });
      }
    }

    // 4. Kiểm tra thế lực cũ nếu không còn khu định cư và không còn thành viên thì giải thể gọn
    if (oldOwnerId) {
      const oldFEnt = FactionFactory.findFactionEntity(world, oldOwnerId);
      if (oldFEnt !== null) {
        const oldFComp = world.getComponent(oldFEnt, FactionComponent);
        if (oldFComp) {
          oldFComp.settlementIds = oldFComp.settlementIds.filter(id => id !== settlementId);
          if (oldFComp.capitalSettlementId === settlementId) {
            oldFComp.capitalSettlementId = oldFComp.settlementIds[0] ?? null;
          }
          if (!deferSourceCleanup && oldFComp.settlementIds.length === 0 && oldFComp.members.size === 0) {
            for (const task of CommunityTaskBoard.getInstance().getTasksForFaction(oldOwnerId)) {
              CommunityTaskBoard.getInstance().cancelTask(world, task.id, 'Thế lực đã sáp nhập');
            }
            targetFComp.foodStock += oldFComp.foodStock;
            targetFComp.woodStock += oldFComp.woodStock;
            targetFComp.stoneStock += oldFComp.stoneStock;
            targetFComp.treasury += oldFComp.treasury;
            targetFComp.spiritStones += oldFComp.spiritStones;
            targetFComp.herbStock += oldFComp.herbStock;
            targetFComp.pillStock += oldFComp.pillStock;
            this.removeFactionLinks(oldOwnerId, world);
            world.destroyEntity(oldFEnt);
          }
        }
      }
    }

    return true;
  }

  /**
   * Ly khai một khu định cư khỏi Vương Quốc khi độ ổn định thấp hoặc trung ương suy yếu:
   * - Tách riêng dân cư địa phương, công trình, kho vật tư và hiệp ước của khu định cư đó
   * - Không tạo quyền sở hữu mồ côi hoặc vòng lặp trực thuộc
   */
  public secedeSettlement(
    world: ECSWorld,
    settlementIdOrFactionId: string,
    reasonOrSettlementId: string = 'Bất mãn thuế khóa và triều chính suy vi',
    optionalReason?: string
  ): string | null {
    const isFourArg = optionalReason !== undefined;
    const settlementId = isFourArg ? reasonOrSettlementId : settlementIdOrFactionId;
    const reason = isFourArg ? optionalReason : reasonOrSettlementId;

    const sEnt = FactionFactory.findSettlementEntity(world, settlementId);
    if (sEnt === null) return null;
    const sComp = world.getComponent(sEnt, SettlementComponent)!;
    const oldKingdomId = sComp.ownerFactionId;
    const oldKEnt = FactionFactory.findFactionEntity(world, oldKingdomId);
    const oldKComp = oldKEnt !== null ? world.getComponent(oldKEnt, FactionComponent) : undefined;

    if (oldKComp && oldKComp.capitalSettlementId === settlementId && oldKComp.settlementIds.length <= 1) {
      return null; // Khu định cư duy nhất thì không tự ly khai khỏi chính mình
    }

    // 1. Tạo thế lực Làng/Thôn độc lập mới cho khu định cư ly khai
    const newType = sComp.residentIds.size >= 8 ? 'village' : 'hamlet';
    const { factionEntity: newFEnt, factionId: newFactionId } = FactionFactory.createFaction(world, {
      name: sComp.name,
      type: newType,
      alignment: 'neutral',
      leaderEntityId: sComp.localLeaderEntityId ?? undefined,
      silent: true
    });
    const newFComp = world.getComponent(newFEnt, FactionComponent)!;
    if (!newFComp.settlementIds.includes(settlementId)) {
      newFComp.settlementIds.push(settlementId);
    }
    newFComp.capitalSettlementId = settlementId;
    newFComp.foodStock = sComp.foodStock;
    newFComp.woodStock = sComp.woodStock;
    newFComp.stoneStock = sComp.stoneStock;
    newFComp.treasury = sComp.treasury;

    if (oldKComp) {
      oldKComp.settlementIds = oldKComp.settlementIds.filter(id => id !== settlementId);
      if (oldKComp.capitalSettlementId === settlementId) {
        const nextCap = oldKComp.settlementIds[0] ?? null;
        oldKComp.capitalSettlementId = nextCap;
      }
    }

    sComp.ownerFactionId = newFactionId;
    sComp.settlementType = newType;
    this.syncSettlementOwnership(world, sEnt, sComp, newFComp, oldKingdomId);

    // 2. Chuyển quyền sở hữu công trình của khu định cư sang thế lực mới
    for (const bId of sComp.buildings) {
      const bComp = world.getComponent(bId, BuildingComponent);
      if (bComp && bComp.factionId === oldKingdomId) {
        bComp.factionId = newFactionId;
      }
      const tc = world.getComponent(bId, TerritoryCenterComponent);
      if (tc && tc.factionId === oldKingdomId) {
        tc.factionId = newFactionId;
        tc.color = newFComp.color;
      }
    }

    // 3. Chuyển các cư dân dân sự của khu định cư này sang thế lực mới (giữ nguyên đệ tử Tông Môn)
    for (const rId of sComp.residentIds) {
      const mComp = world.getComponent(rId, MemberComponent);
      if (!mComp || mComp.factionId === oldKingdomId) {
        const role = rId === sComp.localLeaderEntityId ? 'village_head' : 'villager';
        FactionFactory.assignMemberToFaction(world, rId, newFactionId, role, {
          reason: `Ly khai lập lại ${newFComp.name} (${reason})`,
          preserveResidence: true
        });
      }
    }

    if (!newFComp.leaderEntityId || !newFComp.members.has(newFComp.leaderEntityId)) {
      FactionFactory.electSuccessor(world, newFEnt);
    }

    if (oldKingdomId) {
      const pairKey = this.getPairKey(oldKingdomId, newFactionId);
      this.disputes.set(pairKey, 65);
      this.relations.set(pairKey, 'neutral');
    }

    this.eventBus.emit('world:log', {
      type: 'faction_created',
      message: `🚩 LY KHAI ĐỘC LẬP: [${sComp.name}] tuyên bố thoát ly khỏi [${oldKComp?.name ?? oldKingdomId}] vì ${reason}!`
    });
    this.eventBus.emit('chronicle:entry', {
      category: 'tribulation',
      message: `🚩 [${sComp.name}] chính thức ly khai khỏi [${oldKComp?.name ?? oldKingdomId}] (${reason})!`,
      importance: 'high'
    });

    return newFactionId;
  }

  /**
   * Dọn sạch mọi hiệp ước của một thế lực khi bị giải thể / diệt vong.
   */
  private syncSettlementOwnership(
    world: ECSWorld, settlementEntity: number, settlement: SettlementComponent,
    owner: FactionComponent, previousOwnerId: string
  ): void {
    // Hủy việc của chính quyền cũ để công việc mới dùng đúng kho và quyền sở hữu.
    const board = CommunityTaskBoard.getInstance();
    for (const task of board.getAllTasks()) {
      if (task.settlementId === settlement.settlementId && task.payerFactionId === previousOwnerId) {
        board.cancelTask(world, task.id, 'Khu định cư đổi chủ');
      }
    }
    for (const id of world.query([ResidenceComponent])) {
      const residence = world.getComponent(id, ResidenceComponent)!;
      if (residence.settlementId === settlement.settlementId) {
        residence.factionId = owner.factionId;
      }
    }
    const center = world.getComponent(settlementEntity, TerritoryCenterComponent);
    if (center) {
      center.factionId = owner.factionId;
      center.factionName = owner.name;
      center.color = owner.color;
    }
  }

  public removeFactionLinks(factionIdOrWorld: string | ECSWorld, worldOrFactionId?: ECSWorld | string): void {
    const factionId = typeof factionIdOrWorld === 'string' ? factionIdOrWorld : (worldOrFactionId as string);
    const world = factionIdOrWorld instanceof ECSWorld ? factionIdOrWorld : (worldOrFactionId instanceof ECSWorld ? worldOrFactionId : undefined);
    if (!factionId) return;

    this.suzerains.delete(factionId);
    for (const [vassal, suz] of Array.from(this.suzerains.entries())) {
      if (suz === factionId) {
        this.suzerains.delete(vassal);
        if (world) {
          const vEnt = FactionFactory.findFactionEntity(world, vassal);
          const vComp = vEnt !== null ? world.getComponent(vEnt, FactionComponent) : undefined;
          if (vComp) vComp.suzerainFactionId = null;
        }
      }
    }

    for (const [sId, protId] of Array.from(this.protectorates.entries())) {
      if (protId === factionId || sId === factionId) {
        this.protectorates.delete(sId);
        if (world) {
          const sEnt = FactionFactory.findSettlementEntity(world, sId);
          const sComp = sEnt !== null ? world.getComponent(sEnt, SettlementComponent) : undefined;
          if (sComp) sComp.protectorFactionId = null;
        }
      }
    }

    for (const key of Array.from(this.relations.keys())) {
      if (key.startsWith(`${factionId}:`) || key.endsWith(`:${factionId}`)) {
        this.relations.delete(key);
      }
    }
    for (const key of Array.from(this.tradePairs)) {
      if (key.startsWith(`${factionId}:`) || key.endsWith(`:${factionId}`)) {
        this.tradePairs.delete(key);
      }
    }
    for (const key of Array.from(this.disputes.keys())) {
      if (key.startsWith(`${factionId}:`) || key.endsWith(`:${factionId}`)) {
        this.disputes.delete(key);
      }
    }
  }

  public getRelation(factionA: string, factionB: string, world?: ECSWorld): DiplomaticRelation {
    if (factionA === factionB) return 'allied';
    if (this.suzerains.get(factionA) === factionB || this.suzerains.get(factionB) === factionA) {
      return 'allied';
    }

    const key = this.getPairKey(factionA, factionB);
    const existing = this.relations.get(key);
    if (existing) return existing;

    if (world) {
      const fEntA = FactionFactory.findFactionEntity(world, factionA);
      const fEntB = FactionFactory.findFactionEntity(world, factionB);
      const fCompA = fEntA !== null ? world.getComponent(fEntA, FactionComponent) : undefined;
      const fCompB = fEntB !== null ? world.getComponent(fEntB, FactionComponent) : undefined;
      if (fCompA && fCompB) {
        if ((fCompA.alignment === 'righteous' && fCompB.alignment === 'demonic') ||
            (fCompA.alignment === 'demonic' && fCompB.alignment === 'righteous')) {
          return 'war';
        }
      }
    }

    return 'neutral';
  }

  /**
   * Xác định thống nhất xem một thực thể có phải là kẻ địch của một môn phái hay không.
   * Dùng chung cho Trận Pháp (BuildingSystem), Chiến Đấu (CombatSystem) và Ngoại Giao.
   */
  public isHostileToFaction(world: ECSWorld, factionId: string, targetEntityId: number): boolean {
    if (!factionId) return false;

    const targetMember = world.getComponent(targetEntityId, MemberComponent);
    if (targetMember && targetMember.factionId) {
      if (targetMember.factionId === factionId) return false;
      const rel = this.getRelation(factionId, targetMember.factionId, world);
      if (rel === 'war') return true;
      if (rel === 'allied') return false;

      // Nếu đang trung lập nhưng cá nhân đó đang chủ động công kích đệ tử của bản môn thì vẫn là địch
      const stats = world.getComponent(targetEntityId, CombatStatsComponent);
      if (stats && stats.targetEntityId !== null) {
        const victimMember = world.getComponent(stats.targetEntityId, MemberComponent);
        if (victimMember && victimMember.factionId === factionId) {
          return true;
        }
      }
      return false;
    }

    // Nếu thực thể đang cư trú tại khu định cư do môn phái này bảo hộ -> không phải là địch
    const resComp = world.getComponent(targetEntityId, ResidenceComponent);
    if (resComp) {
      const prot = this.protectorates.get(resComp.settlementId);
      if (prot === factionId) return false;
    }

    // Thực thể không thuộc môn phái nào (tán tu, phàm nhân, yêu thú, ma tộc, hoặc thực thể xâm nhập)
    const stats = world.getComponent(targetEntityId, CombatStatsComponent);
    if (stats) {
      if (stats.isHostile) return true;
      if (stats.targetEntityId !== null) {
        const victimMember = world.getComponent(stats.targetEntityId, MemberComponent);
        if (victimMember && victimMember.factionId === factionId) {
          return true;
        }
      }
    }

    const race = world.getComponent(targetEntityId, RaceComponent);
    if (race) {
      if (race.raceId === 'human') {
        return false;
      }
      if (race.raceId === 'demon' || race.raceId === 'beast') {
        return true;
      }
    }

    return true;
  }

  /**
   * Kiểm tra thống nhất xem hai thực thể có quan hệ thù địch hay không.
   */
  public areEntitiesHostile(world: ECSWorld, entA: number, entB: number): boolean {
    if (entA === entB) return false;

    const memA = world.getComponent(entA, MemberComponent);
    const memB = world.getComponent(entB, MemberComponent);

    if (memA?.factionId && memB?.factionId) {
      if (memA.factionId === memB.factionId) return false;
      return this.getRelation(memA.factionId, memB.factionId, world) === 'war';
    }

    if (memA?.factionId) {
      return this.isHostileToFaction(world, memA.factionId, entB);
    }
    if (memB?.factionId) {
      return this.isHostileToFaction(world, memB.factionId, entA);
    }

    const statsA = world.getComponent(entA, CombatStatsComponent);
    const statsB = world.getComponent(entB, CombatStatsComponent);
    if (statsA?.targetEntityId === entB || statsB?.targetEntityId === entA) {
      return true;
    }

    const raceA = world.getComponent(entA, RaceComponent);
    const raceB = world.getComponent(entB, RaceComponent);
    if (raceA && raceB) {
      if (raceA.raceId === 'beast') {
        if (raceB.raceId === 'beast') return false;
        return true;
      }
      if (raceA.raceId !== raceB.raceId && (raceA.raceId === 'demon' || raceB.raceId === 'demon')) {
        return true;
      }
    }

    return false;
  }

  public setRelation(world: ECSWorld, factionA: string, factionB: string, relation: DiplomaticRelation): void {
    if (factionA === factionB) return;
    const key = this.getPairKey(factionA, factionB);
    this.relations.set(key, relation);

    if (relation === 'war') {
      this.tradePairs.delete(key);
    }

    // Cập nhật thông báo
    const factions = world.query([FactionComponent]);
    let nameA = factionA;
    let nameB = factionB;
    for (const fEnt of factions) {
      const fComp = world.getComponent(fEnt, FactionComponent)!;
      if (fComp.factionId === factionA) nameA = fComp.name;
      if (fComp.factionId === factionB) nameB = fComp.name;
    }

    if (relation === 'war') {
      this.eventBus.emit('chronicle:entry', {
        category: 'tribulation',
        message: `⚔️ HUYẾT CHIẾN KHỞI TRANH! [${nameA}] và [${nameB}] chính thức đoạn tuyệt, phát động ĐẠI CHIẾN!`,
        importance: 'high'
      });
    } else if (relation === 'allied') {
      this.eventBus.emit('chronicle:entry', {
        category: 'breakthrough',
        message: `🤝 KẾT GIAO ĐỒNG MINH! [${nameA}] cùng [${nameB}] ký kết hòa ước đồng minh!`,
        importance: 'normal'
      });
    }
  }

  public update(world: ECSWorld, dt: number): void {
    this.checkTimer += dt;
    this.treatyTimer += dt;
    if (this.checkTimer < 2.0) return;
    this.checkTimer = 0;

    const factions = world.query([FactionComponent]);
    const factionList: FactionComponent[] = factions.map(f => world.getComponent(f, FactionComponent)!);

    // 1. Kiểm tra va chạm lãnh thổ & xung đột ý thức hệ (Chính Đạo vs Ma Đạo)
    for (let i = 0; i < factionList.length; i++) {
      for (let j = i + 1; j < factionList.length; j++) {
        const fA = factionList[i];
        const fB = factionList[j];
        const key = this.getPairKey(fA.factionId, fB.factionId);

        if (!this.relations.has(key)) {
          // Mặc định: Chính Đạo và Ma Đạo luôn kình địch
          if ((fA.alignment === 'righteous' && fB.alignment === 'demonic') ||
              (fA.alignment === 'demonic' && fB.alignment === 'righteous')) {
            this.relations.set(key, 'war');
            this.eventBus.emit('chronicle:entry', {
              category: 'tribulation',
              message: `🔥 THẾ BẤT LƯỠNG LẬP! Chính phái [${fA.name}] và Ma tông [${fB.name}] xung đột kịch liệt!`,
              importance: 'high'
            });
          } else {
            this.relations.set(key, 'neutral');
          }
        }
      }
    }

    // 1B. Định kỳ (mỗi 10 giây mô phỏng) đánh giá Bảo Hộ, Thương Mại & Ly Khai
    if (this.treatyTimer >= 10.0) {
      this.treatyTimer = 0;
      this.evaluateTreatiesAndTrade(world, factionList);
    }

    // 2. Kích hoạt giao tranh giữa các đệ tử thuộc 2 môn phái đang có chiến tranh
    // Sử dụng SpatialGrid (nếu có) và luân phiên điểm bắt đầu (round-robin) kèm giới hạn cặp kiểm tra nghiêm ngặt
    const combatants = world.query([PositionComponent, MemberComponent]);
    const totalCombatants = combatants.length;
    if (totalCombatants === 0) {
      this.lastPairsChecked = 0;
      return;
    }

    let pairsChecked = 0;
    const MAX_PAIRS = 200;
    const startIdx = this.roundRobinIndex % totalCombatants;
    let outerProcessed = 0;

    for (let offset = 0; offset < totalCombatants; offset++) {
      if (pairsChecked >= MAX_PAIRS) break;
      outerProcessed = offset + 1;

      const idxA = (startIdx + offset) % totalCombatants;
      const entA = combatants[idxA];
      const hpA = world.getComponent(entA, HealthComponent);
      if (hpA && hpA.isDead) continue;
      const statsA = world.getComponent(entA, CombatStatsComponent);
      if (statsA && statsA.targetEntityId) continue;

      const memA = world.getComponent(entA, MemberComponent)!;
      const posA = world.getComponent(entA, PositionComponent)!;

      if (this.spatialGrid) {
        const nearby = this.spatialGrid.queryRadius(posA.x, posA.y, 120);
        for (let k = 0; k < nearby.length; k++) {
          if (pairsChecked >= MAX_PAIRS) break;
          const item = nearby[k];
          const entB = item.id;
          if (entB === entA) continue;
          pairsChecked++;

          const memB = world.getComponent(entB, MemberComponent);
          if (!memB || memA.factionId === memB.factionId) continue;

          const hpB = world.getComponent(entB, HealthComponent);
          if (hpB && hpB.isDead) continue;
          const statsB = world.getComponent(entB, CombatStatsComponent);
          if (statsB && statsB.targetEntityId) continue;

          if (this.getRelation(memA.factionId, memB.factionId, world) === 'war') {
            const dist = Math.hypot(posA.x - item.x, posA.y - item.y);
            if (dist < 120) {
              if (statsA) statsA.targetEntityId = entB;
              if (statsB) statsB.targetEntityId = entA;
              break;
            }
          }
        }
      } else {
        for (let stepB = 1; stepB < totalCombatants; stepB++) {
          if (pairsChecked >= MAX_PAIRS) break;
          const idxB = (idxA + stepB) % totalCombatants;
          const entB = combatants[idxB];
          pairsChecked++;

          const memB = world.getComponent(entB, MemberComponent)!;
          if (memA.factionId === memB.factionId) continue;

          const hpB = world.getComponent(entB, HealthComponent);
          if (hpB && hpB.isDead) continue;
          const statsB = world.getComponent(entB, CombatStatsComponent);
          if (statsB && statsB.targetEntityId) continue;

          if (this.getRelation(memA.factionId, memB.factionId, world) === 'war') {
            const posB = world.getComponent(entB, PositionComponent)!;
            const dist = Math.hypot(posA.x - posB.x, posA.y - posB.y);
            if (dist < 120) {
              if (statsA) statsA.targetEntityId = entB;
              if (statsB) statsB.targetEntityId = entA;
              break;
            }
          }
        }
      }
    }

    this.lastPairsChecked = pairsChecked;
    this.roundRobinIndex = (startIdx + Math.max(1, outerProcessed)) % totalCombatants;
  }

  /**
   * Đánh giá tự động các quan hệ Bảo Hộ (Tông môn - Làng), Thương Mại và Ly Khai.
   */
  private evaluateTreatiesAndTrade(world: ECSWorld, factionList: FactionComponent[]): void {
    const settlements = world.query([SettlementComponent]);

    // 1. Tông môn chính/trung lập tự động kết lập bảo hộ với Làng/Thôn lân cận chưa có người bảo hộ
    for (const sEnt of settlements) {
      const sComp = world.getComponent(sEnt, SettlementComponent)!;
      if (sComp.settlementType === 'sect_compound') continue;

      if (!sComp.protectorFactionId) {
        let bestSect: FactionComponent | null = null;
        let minDist = 650;

        for (const fComp of factionList) {
          if (!isCultivationFactionType(fComp.type)) continue;
          if (fComp.alignment === 'demonic') continue;
          if (this.getRelation(fComp.factionId, sComp.ownerFactionId, world) === 'war') continue;

          const sectSettlement = FactionFactory.findNearestSettlement(world, sComp.centerX, sComp.centerY, fComp.factionId);
          const dist = sectSettlement ? sectSettlement.dist : 9999;
          if (dist < minDist) {
            minDist = dist;
            bestSect = fComp;
          }
        }

        if (bestSect) {
          this.establishProtectorate(world, bestSect.factionId, sComp.settlementId);
        }
      } else {
        // Cống nạp nhẹ từ làng được bảo hộ và tăng độ ổn định nhờ tông môn che chở
        const protEnt = FactionFactory.findFactionEntity(world, sComp.protectorFactionId);
        const protComp = protEnt !== null ? world.getComponent(protEnt, FactionComponent) : undefined;
        if (protComp) {
          if (sComp.foodStock > 15) {
            sComp.foodStock -= 1;
            protComp.foodStock += 1;
          }
          sComp.stability = Math.min(100, sComp.stability + 1.5);
        } else {
          sComp.protectorFactionId = null;
          this.protectorates.delete(sComp.settlementId);
        }
      }
    }

    // 2. Thương mại giữa các thế lực không thù địch
    for (let i = 0; i < factionList.length; i++) {
      for (let j = i + 1; j < factionList.length; j++) {
        const fA = factionList[i];
        const fB = factionList[j];
        const rel = this.getRelation(fA.factionId, fB.factionId, world);
        if (rel === 'war') continue;

        if (isCivilFactionType(fA.type) && isCivilFactionType(fB.type)) {
          this.establishTrade(world, fA.factionId, fB.factionId);
          fA.treasury += 1;
          fB.treasury += 1;
        }
      }
    }

    // 3. Kiểm tra Ly Khai (nếu Vương Quốc suy yếu kéo dài và khu định cư xa thủ đô bất mãn)
    for (const fComp of factionList) {
      if (fComp.type === 'kingdom' && fComp.settlementIds.length > 1 && fComp.stability < 30) {
        for (const sId of Array.from(fComp.settlementIds)) {
          if (sId === fComp.capitalSettlementId) continue;
          const sEnt = FactionFactory.findSettlementEntity(world, sId);
          const sComp = sEnt !== null ? world.getComponent(sEnt, SettlementComponent) : undefined;
          if (sComp && sComp.stability < 35) {
            this.secedeSettlement(world, sId, 'Triều đình suy vi, lòng dân ly tán');
            break;
          }
        }
      }
    }
  }
}
