import { System } from '../../ecs/System.ts';
import { ECSWorld } from '../../ecs/World.ts';
import { WorldMap } from '../world/WorldMap.ts';
import { TimeManager } from '../../core/TimeManager.ts';
import { EventBus } from '../../core/EventBus.ts';
import {
  PositionComponent,
  HealthComponent,
  CharacterStateComponent,
  NameComponent,
  RaceComponent,
  RealmComponent
} from './BeingComponents.ts';
import {
  CorpseComponent,
  GraveComponent,
  DroppedLootComponent,
  GraveyardZoneComponent,
  DroppedItemData
} from './DeathComponents.ts';
import { InventoryComponent } from '../alchemy/InventoryComponent.ts';
import { EquipmentComponent } from '../combat/CombatComponents.ts';
import { MemberComponent } from '../factions/FactionComponents.ts';
import { processSocialDeath } from '../social/SocialDeathService.ts';
import { AnimalCarcassComponent, AnimalComponent } from '../animals/AnimalComponents.ts';

export class CorpseAndGraveSystem implements System {
  public name = 'CorpseAndGraveSystem';
  public enabled = true;
  public priority = 25;

  public readonly worldMap: WorldMap;
  private timeManager = TimeManager.getInstance();
  private eventBus = EventBus.getInstance();
  private lastTotalDays: number = -1;
  private accumulator: number = 0;

  constructor(worldMap: WorldMap) {
    this.worldMap = worldMap;
  }

  public reset(): void {
    this.lastTotalDays = -1;
    this.accumulator = 0;
  }

  public update(world: ECSWorld, dt: number): void {
    this.accumulator += dt;
    if (this.accumulator < 0.25) return;
    this.accumulator = 0;

    const date = this.timeManager.getDate();
    const currentTotalDays = date.totalDays;

    if (this.lastTotalDays === -1 || currentTotalDays < this.lastTotalDays) {
      this.lastTotalDays = currentTotalDays;
    }

    const daysPassed = currentTotalDays - this.lastTotalDays;
    if (daysPassed > 0) {
      this.lastTotalDays = currentTotalDays;
    }

    // 1. Quét tìm các nhân vật vừa chết để gắn CorpseComponent nếu chưa có
    this.initNewCorpses(world, date);

    // 2. Cập nhật vị trí thi thể đang được bế/khiêng
    this.updateCarriedCorpses(world);

    // 3. Nếu có ngày trôi qua, cập nhật đếm lùi thời gian cho Thi thể và Ngôi mộ
    if (daysPassed > 0) {
      this.updateCorpseDecay(world, daysPassed, date);
      this.updateGraveDecay(world, daysPassed);
    }
  }

  /**
   * Khởi tạo CorpseComponent cho các nhân vật vừa tử vong
   */
  private initNewCorpses(world: ECSWorld, date: any): void {
    const deadEntities = world.query([PositionComponent, HealthComponent, CharacterStateComponent]);

    for (const ent of deadEntities) {
      if (
        world.hasComponent(ent, AnimalComponent) ||
        world.hasComponent(ent, AnimalCarcassComponent)
      ) {
        continue;
      }
      const hp = world.getComponent(ent, HealthComponent)!;
      if (!hp.isDead) continue;

      // Nếu đã có CorpseComponent rồi thì bỏ qua
      const existingCorpse = world.getComponent(ent, CorpseComponent);
      if (existingCorpse) {
        processSocialDeath(world, ent, existingCorpse);
        continue;
      }

      const nameComp = world.getComponent(ent, NameComponent);
      const raceComp = world.getComponent(ent, RaceComponent);
      const realmComp = world.getComponent(ent, RealmComponent);
      const invComp = world.getComponent(ent, InventoryComponent);
      const equipComp = world.getComponent(ent, EquipmentComponent);
      const stateComp = world.getComponent(ent, CharacterStateComponent)!;

      stateComp.state = 'dead';

      // Trích xuất đan dược trong túi trữ vật
      const pillsList: { id: string; count: number; name: string }[] = [];
      if (invComp) {
        for (const [pId, pCount] of invComp.pills.entries()) {
          pillsList.push({ id: pId, count: pCount, name: pId });
        }
      }

      // Trích xuất trang bị
      const itemData: DroppedItemData = {
        pills: pillsList,
        mainHand: equipComp?.mainHand ? { ...equipComp.mainHand } : null,
        offHand: equipComp?.offHand ? { ...equipComp.offHand } : null,
        bodyArmor: equipComp?.bodyArmor ? { ...equipComp.bodyArmor } : null,
        artifact: equipComp?.artifact ? { ...equipComp.artifact } : null,
        workTool: equipComp?.workTool ? { ...equipComp.workTool } : null
      };

      const deceasedName = nameComp?.name ?? 'Vô Danh Cư Dân';
      const raceId = raceComp?.raceId ?? 'human';
      const realmStageIndex = realmComp?.stageIndex ?? 0;
      const realmStageName = realmComp?.stageName ?? 'Phàm Nhân';

      const corpseComp = new CorpseComponent(
        deceasedName,
        raceId,
        realmStageIndex,
        realmStageName,
        date.day,
        date.month,
        date.year,
        'Khí huyết cạn kiệt, tọa hóa quy thiên',
        itemData
      );

      world.addComponent(ent, corpseComp);

      processSocialDeath(world, ent, corpseComp);

    }
  }

  /**
   * Đồng bộ tọa độ thi thể theo người thân đang bế/cõng
   */
  private updateCarriedCorpses(world: ECSWorld): void {
    const corpses = world.query([PositionComponent, CorpseComponent]);

    for (const ent of corpses) {
      const corpse = world.getComponent(ent, CorpseComponent)!;
      if (!corpse.isBeingCarried || corpse.carriedByEntityId === null) continue;

      const carrierPos = world.getComponent(corpse.carriedByEntityId, PositionComponent);
      const carrierHp = world.getComponent(corpse.carriedByEntityId, HealthComponent);

      // Nếu người bế chết hoặc biến mất thì thả xác rơi lại vị trí đó
      if (!carrierPos || (carrierHp && carrierHp.isDead)) {
        corpse.isBeingCarried = false;
        corpse.carriedByEntityId = null;
        continue;
      }

      const corpsePos = world.getComponent(ent, PositionComponent)!;
      corpsePos.x = carrierPos.x;
      corpsePos.y = carrierPos.y;
    }
  }

  /**
   * Cập nhật thời gian phân rã của thi thể. Khi hết hạn thì tan biến và rơi đồ ra đất
   */
  private updateCorpseDecay(world: ECSWorld, daysPassed: number, date: any): void {
    const corpses = world.query([PositionComponent, CorpseComponent]);

    for (const ent of corpses) {
      const corpse = world.getComponent(ent, CorpseComponent)!;
      const pos = world.getComponent(ent, PositionComponent)!;

      // Nếu đang được bế thì tạm ngừng đếm lùi thời gian phân rã
      if (corpse.isBeingCarried) continue;

      corpse.remainingDays -= daysPassed;

      if (corpse.remainingDays <= 0) {
        // 1. Rơi đồ đạc ra mặt đất nếu có đồ
        const hasLoot =
          corpse.items.pills.length > 0 ||
          corpse.items.mainHand !== null ||
          corpse.items.offHand !== null ||
          corpse.items.bodyArmor !== null ||
          corpse.items.artifact !== null;

        if (hasLoot) {
          const lootEnt = world.createEntity();
          world.addComponent(lootEnt, new PositionComponent(pos.x, pos.y));
          world.addComponent(
            lootEnt,
            new DroppedLootComponent(
              corpse.deceasedName,
              corpse.realmStageName,
              date.day,
              date.month,
              date.year,
              corpse.items
            )
          );

          this.eventBus.emit('combat:floating_text', {
            x: pos.x,
            y: pos.y - 10,
            text: '📦 Rơi Di Vật',
            color: '#facc15'
          });
        }

        this.eventBus.emit('chronicle:entry', {
          category: 'aging',
          message: `💨 Thi hài [${corpse.deceasedName}] đã tan biến về với hư vô theo quy luật sinh tử, để lại di vật ngoài đất.`,
          importance: 'normal'
        });

        // 2. Hủy entity thi thể
        world.destroyEntity(ent);
      }
    }
  }

  /**
   * Cập nhật thời gian phong hóa của các ngôi mộ. Khi hết hạn thì xóa mộ trả lại đất
   */
  private updateGraveDecay(world: ECSWorld, daysPassed: number): void {
    const graves = world.query([PositionComponent, GraveComponent]);

    for (const ent of graves) {
      const grave = world.getComponent(ent, GraveComponent)!;
      grave.remainingDays -= daysPassed;

      if (grave.remainingDays <= 0) {
        this.eventBus.emit('chronicle:entry', {
          category: 'aging',
          message: `🌿 Ngôi mộ của [${grave.deceasedName}] đã hoàn toàn phong hóa sau trăm năm sương gió, hòa làm một với cỏ cây non nước.`,
          importance: 'normal'
        });

        world.destroyEntity(ent);
      }
    }
  }

  /**
   * Tìm hoặc quy ước vị trí huyệt mộ trong Nghĩa Trang Thôn Làng
   */
  public static getOrCreateBurialPlot(world: ECSWorld, residentEnt: number, worldMap: WorldMap): { x: number; y: number } {
    const memberComp = world.getComponent(residentEnt, MemberComponent);
    const factionId = memberComp?.factionId ?? 'independent';
    const residentPos = world.getComponent(residentEnt, PositionComponent)!;

    // Tìm khu nghĩa trang hiện có của thế lực
    const zones = world.query([PositionComponent, GraveyardZoneComponent]);
    let targetZoneComp: GraveyardZoneComponent | null = null;
    let targetZonePos: PositionComponent | null = null;

    for (const zEnt of zones) {
      const zComp = world.getComponent(zEnt, GraveyardZoneComponent)!;
      if (zComp.factionId === factionId) {
        targetZoneComp = zComp;
        targetZonePos = world.getComponent(zEnt, PositionComponent)!;
        break;
      }
    }

    // Nếu thôn xóm chưa có nghĩa trang: Lập một khu nghĩa trang mới cách cư dân 12-16 ô
    if (!targetZoneComp || !targetZonePos) {
      const angle = Math.random() * Math.PI * 2;
      const distTiles = 12 + Math.random() * 4;
      let gzTx = Math.floor(residentPos.x / worldMap.tileSize + Math.cos(angle) * distTiles);
      let gzTy = Math.floor(residentPos.y / worldMap.tileSize + Math.sin(angle) * distTiles);

      gzTx = Math.max(3, Math.min(worldMap.width - 4, gzTx));
      gzTy = Math.max(3, Math.min(worldMap.height - 4, gzTy));

      const gzEntity = world.createEntity();
      targetZonePos = new PositionComponent(gzTx * worldMap.tileSize + 8, gzTy * worldMap.tileSize + 8);
      targetZoneComp = new GraveyardZoneComponent(factionId, targetZonePos.x, targetZonePos.y, 6);
      world.addComponent(gzEntity, targetZonePos);
      world.addComponent(gzEntity, targetZoneComp);
    }

    // Tìm ô đất trống tiếp theo trong nghĩa trang (xếp theo hàng hoặc xoắn ốc)
    const plotCount = targetZoneComp.occupiedPlots.length;
    const col = plotCount % 4;
    const row = Math.floor(plotCount / 4);

    const plotX = targetZonePos.x + (col - 1.5) * 20;
    const plotY = targetZonePos.y + (row - 1.5) * 20;

    targetZoneComp.occupiedPlots.push({ x: plotX, y: plotY });

    return { x: plotX, y: plotY };
  }

  /**
   * Tiến hành an táng thi thể vào mộ (Phương án A: Đồ tùy táng lưu giữ trong mộ)
   */
  public static executeBurial(
    world: ECSWorld,
    corpseEnt: number,
    buriedByEnt: number,
    burialPos: { x: number; y: number }
  ): number {
    const corpse = world.getComponent(corpseEnt, CorpseComponent);
    if (!corpse) return -1;

    const buriedByNameComp = world.getComponent(buriedByEnt, NameComponent);
    const buriedByName = buriedByNameComp?.name ?? 'Người thân';

    const date = TimeManager.getInstance().getDate();

    // Tạo Ngôi Mộ
    const graveEnt = world.createEntity();
    world.addComponent(graveEnt, new PositionComponent(burialPos.x, burialPos.y));

    const graveComp = new GraveComponent(
      corpse.deceasedName,
      corpse.raceId,
      corpse.realmStageIndex,
      corpse.realmStageName,
      buriedByName,
      buriedByEnt,
      date.day,
      date.month,
      date.year,
      corpse.items // Toàn bộ di vật được lưu làm đồ tùy táng trong mộ (Phương án A)
    );
    world.addComponent(graveEnt, graveComp);

    EventBus.getInstance().emit('combat:floating_text', {
      x: burialPos.x,
      y: burialPos.y - 12,
      text: `⚰️ An Táng [${corpse.deceasedName}]`,
      color: '#a78bfa'
    });

    EventBus.getInstance().emit('chronicle:entry', {
      category: 'aging',
      message: `🪦 [${buriedByName}] đã lập mộ chu đáo cho [${corpse.deceasedName}] (${corpse.realmStageName}). Mộ phần khói hương nghi ngút.`,
      importance: 'major'
    });

    // Tiêu hủy thực thể xác chết
    world.destroyEntity(corpseEnt);

    return graveEnt;
  }
}
