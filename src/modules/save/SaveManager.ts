import { serializeSocialSave, validateSocialSave } from '../social/SocialSaveCodec.ts';
import { ResidentPersonalityComponent } from '../ai/brain/ResidentPreferences.ts';
import { calculatePlantGrowth } from '../world/TerrainEnvironment.ts';
import { FamilyComponent } from '../beings/FamilyComponent.ts';
import { AppearanceComponent, AppearanceRegistry, inferSpecies } from '../appearance/Appearance.ts';
import { Engine } from '../../core/Engine.ts';
import { ECSWorld } from '../../ecs/World.ts';
import { hydrateProfessions, serializeProfessions, validateProfessionSave } from '../professions/ProfessionSaveCodec.ts';
import { SaveData, SaveMetadata, SerializedEntity } from './SaveTypes.ts';
import { SaveStorage } from './SaveStorage.ts';
import { getNextEntityId, setNextEntityId } from '../../ecs/Entity.ts';
import { TerrainType } from '../../config/terrains.config.ts';
import {
  PositionComponent,
  NameComponent,
  RaceComponent,
  RealmComponent,
  HealthComponent,
  LifespanComponent,
  HungerComponent,
  CultivationTechniqueComponent,
  CharacterStateComponent,
  AnimationComponent,
  TraitsComponent,
  ComprehensionComponent,
  SpiritualRootComponent,
  MortalNeedsComponent,
  DailyScheduleComponent,
  ChildcareComponent,
  CharacterHistoryComponent,
  SpiritualRootType,
  CorpseComponent,
  GraveComponent,
  DroppedLootComponent,
  GraveyardZoneComponent
} from '../beings/BeingComponents.ts';
import { CombatStatsComponent, EquipmentComponent, ARMOR_DEFINITIONS, ARTIFACT_DEFINITIONS } from '../combat/CombatComponents.ts';
import { InventoryComponent } from '../alchemy/InventoryComponent.ts';
import { TreasureChestComponent } from '../treasure/TreasureChest.ts';
import { PlantComponent } from '../flora/PlantComponents.ts';
import { PLANT_DEFINITIONS } from '../../config/plants.config.ts';
import {
  BuildingComponent,
  FactionComponent,
  MemberComponent,
  TerritoryCenterComponent,
  SettlementComponent,
  ResidenceComponent,
  FoundingIntentComponent,
  ConstructionSiteComponent,
  InsideBuildingComponent
} from '../factions/FactionComponents.ts';
import { FactionFactory } from '../factions/FactionFactory.ts';
import { isCivilFactionType, ResourceBundle } from '../../config/factions.config.ts';
import { WEAPON_DEFINITIONS } from '../../config/weapons.config.ts';
import { TOOL_DEFINITIONS } from '../../config/tools.config.ts';
import { PILL_DEFINITIONS } from '../../config/pills.config.ts';
import {
  AIStrategicBrainComponent,
  AIPlannerComponent,
  AIBehaviorTreeComponent,
  GodDecreeComponent
} from '../ai/brain/AIComponents.ts';
import { SocialRelationshipComponent, MemoryComponent } from '../social/SocialComponents.ts';
import { SmartObjectManager } from '../ai/smartobjects/SmartObjectManager.ts';
import { CommunityTaskBoard } from '../ai/community/CommunityTaskBoard.ts';
import { AStarPathfinder } from '../ai/pathfinding/AStar.ts';
import { TALENT_GENERATION_VERSION, TRAIT_SYSTEM_VERSION } from '../../config/talent.config.ts';
import {
  hydrateOrMigrateEntityTraitTalent,
  serializeEntityTraitTalent,
  validateTraitTalentSaveData,
} from './TraitTalentMigration.ts';
import {
  AnimalSaveCodec,
  hydrateEntityAnimalComponents,
  serializeEntityAnimalComponents,
  validateSerializedAnimalComponents,
} from '../animals/AnimalSaveCodec.ts';
import { isValidElevation } from '../world/ElevationRules.ts';
import { MAX_WORLD_DIMENSION } from '../world/WorldMap.ts';
import { WEATHER_CONFIGS, WeatherType } from '../weather/WeatherTypes.ts';
import {
  TimeManager,
  TimeSpeed,
  TimeState,
  ALLOWED_TIME_SPEEDS,
  LEGACY_TIME_SPEEDS,
} from '../../core/TimeManager.ts';

export const CURRENT_SAVE_VERSION = '2.0.0';
export const OLD_SAVE_REJECT_MESSAGE =
  'Bản lưu này thuộc phiên bản trước khi tách động vật và yêu tộc. Vui lòng tạo thế giới mới.';

function isSaveVersionSupported(version: unknown): boolean {
  if (typeof version !== 'string') return false;
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version.trim());
  if (!match) return false;
  const major = Number(match[1]);
  return Number.isFinite(major) && major >= 2;
}


const TERRAIN_LIST: TerrainType[] = [
  TerrainType.PLAIN,
  TerrainType.HILL,
  TerrainType.MOUNTAIN,
  TerrainType.SWAMP,
  TerrainType.PLATEAU,
  TerrainType.DENSE_FOREST,
  TerrainType.RIVER,
  TerrainType.LAKE,
  TerrainType.OCEAN
];

const SAVE_INDEX_KEY = 'tu_tien_save_index';

export class SaveManager {
  /**
   * Lấy danh sách tóm tắt tất cả các bản lưu hiện có (xếp từ mới nhất đến cũ nhất)
   */
  public static listSlots(): SaveMetadata[] {
    try {
      let list: SaveMetadata[] = [];
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem(SAVE_INDEX_KEY);
        if (raw) {
          list = JSON.parse(raw);
        }
      }
      if (list.length === 0) {
        const fallbackList = SaveStorage.getAllMetadataFromLocalStorage();
        if (fallbackList.length > 0) {
          list = fallbackList;
        } else if (SaveStorage.memStore.size > 0) {
          list = Array.from(SaveStorage.memStore.values()).map(v => v.metadata);
        }
      }
      return list.sort((a, b) => b.timestamp - a.timestamp);
    } catch (e) {
      console.error('Lỗi khi đọc danh sách bản lưu:', e);
      return [];
    }
  }

  /**
   * Khôi phục và đồng bộ danh mục bản lưu từ toàn bộ các tầng lưu trữ bền vững (IndexedDB + localStorage fallback).
   * Giúp đảm bảo không để bản lưu bền vững biến mất khỏi danh sách ngay cả khi ghi index localStorage bị lỗi.
   */
  public static async syncIndexFromStorage(): Promise<SaveMetadata[]> {
    try {
      const idbList = await SaveStorage.getAllMetadataFromIndexedDB(true);
      const lsFallbackList = SaveStorage.getAllMetadataFromLocalStorage(true);

      const mergedMap = new Map<string, SaveMetadata>();

      for (const item of idbList) {
        if (item && item.id) {
          const existing = mergedMap.get(item.id);
          if (!existing || (item.timestamp && item.timestamp > (existing.timestamp || 0))) {
            mergedMap.set(item.id, item);
          }
        }
      }

      for (const item of lsFallbackList) {
        if (item && item.id) {
          const existing = mergedMap.get(item.id);
          if (!existing || (item.timestamp && item.timestamp > (existing.timestamp || 0))) {
            mergedMap.set(item.id, item);
          }
        }
      }

      // memStore chỉ là cache; loại các slot không còn ở bất kỳ backend bền vững nào.
      for (const slotId of SaveStorage.memStore.keys()) {
        if (!mergedMap.has(slotId)) SaveStorage.memStore.delete(slotId);
      }

      const finalList = Array.from(mergedMap.values()).sort((a, b) => b.timestamp - a.timestamp);

      if (typeof localStorage !== 'undefined') {
        try {
          localStorage.setItem(SAVE_INDEX_KEY, JSON.stringify(finalList));
        } catch (_) {}
      }

      return finalList;
    } catch (e) {
      console.error('Lỗi khi đồng bộ danh mục bản lưu từ storage:', e);
      return this.listSlots();
    }
  }

  /**
   * Lấy thông tin bản lưu mới nhất để hỗ trợ nút "Chơi Tiếp"
   */
  public static getLatestSlot(): SaveMetadata | null {
    const list = this.listSlots();
    return list.length > 0 ? list[0] : null;
  }

  /**
   * Kiểm tra xem máy đã có bản lưu nào chưa
   */
  public static hasSaves(): boolean {
    return this.listSlots().length > 0;
  }

  /**
   * Tuần tự hóa toàn bộ thế giới trong Engine thành đối tượng SaveData
   */
  public static serializeWorld(engine: Engine, customName?: string, slotId?: string): SaveData {
    const date = engine.timeManager.getDate();
    const now = new Date();
    const realDateStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')} ${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`;
    const inGameDateStr = `Năm ${date.year}, ${date.season}, Ngày ${date.day}`;

    // Đếm số lượng thực thể
    const allEntities = engine.world.query([]);
    let residentCount = 0;
    let cultivatorCount = 0;
    let buildingCount = 0;

    for (const ent of allEntities) {
      if (engine.world.hasComponent(ent, RaceComponent)) {
        residentCount++;
        const root = engine.world.getComponent(ent, SpiritualRootComponent);
        if (root && root.canCultivate()) {
          cultivatorCount++;
        }
      }
      if (engine.world.hasComponent(ent, BuildingComponent)) {
        buildingCount++;
      }
    }

    const id = slotId || `slot_${Date.now()}`;
    const worldName = customName || engine.worldName || 'Thái Cổ Giới';

    const metadata: SaveMetadata = {
      id,
      name: worldName,
      timestamp: Date.now(),
      realDateStr,
      inGameDateStr,
      residentCount,
      cultivatorCount,
      buildingCount,
      templateId: engine.worldTemplate || 'thap_van_dai_son',
      seed: engine.worldSeed || 8888,
      version: CURRENT_SAVE_VERSION,
      traitSystemVersion: TRAIT_SYSTEM_VERSION,
      talentGenerationVersion: TALENT_GENERATION_VERSION,
    };


    // 1. Serialize WorldMap
    const mapW = engine.worldMap.width;
    const mapH = engine.worldMap.height;
    const mapTiles: [number, number, number, number, number, number][] = [];

    for (let i = 0; i < mapW * mapH; i++) {
      const t = engine.worldMap.getTileByIndex(i);
      if (t) {
        const tIdx = Math.max(0, TERRAIN_LIST.indexOf(t.terrain));
        mapTiles.push([
          tIdx,
          t.elevation * 100,
          t.moisture * 100,
          t.temperature,
          t.qiDensity,
          t.variant
        ]);
      }
    }

    // 2. Serialize QiGrid
    const qiW = engine.qiGrid.width;
    const qiH = engine.qiGrid.height;
    const qiTiles: [number, string, string, number, number][] = [];

    for (let i = 0; i < qiW * qiH; i++) {
      const q = engine.qiGrid.getTileByIndex(i);
      if (q) {
        qiTiles.push([
          q.density,
          q.tier,
          q.dominantElement,
          q.isSpiritVein ? 1 : 0,
          q.veinRate
        ]);
      }
    }

    // 3. Serialize ECS Entities
    const serializedEntities: SerializedEntity[] = [];

    for (const ent of allEntities) {
      const comps: Record<string, any> = {};

      const pos = engine.world.getComponent(ent, PositionComponent);
      if (pos) comps.pos = { x: pos.x, y: pos.y, speed: pos.speed, targetX: pos.targetX, targetY: pos.targetY };

      const personality = engine.world.getComponent(ent, ResidentPersonalityComponent);
      if (personality) comps.personality = { ...personality };
      const family=engine.world.getComponent(ent,FamilyComponent);
      if(family) comps.family={sex:family.sex,parentIds:family.parentIds,birthCooldown:family.birthCooldown};
      const appearance = engine.world.getComponent(ent, AppearanceComponent);
      if (appearance) comps.appearance = { appearanceId: appearance.appearanceId, speciesId: appearance.speciesId, bodyProfile: appearance.bodyProfile };
      const name = engine.world.getComponent(ent, NameComponent);
      if (name) comps.name = { name: name.name };

      const race = engine.world.getComponent(ent, RaceComponent);
      if (race) comps.race = { raceId: race.raceId };

      const realm = engine.world.getComponent(ent, RealmComponent);
      if (realm) comps.realm = {
        realmChainId: realm.realmChainId,
        stageIndex: realm.stageIndex,
        stageName: realm.stageName,
        subStageName: realm.subStageName,
        subStageIndex: realm.subStageIndex,
        currentQi: realm.currentQi,
        maxQi: realm.maxQi,
        combatPower: realm.combatPower,
        isBreakingThrough: realm.isBreakingThrough,
        breakthroughTimer: realm.breakthroughTimer,
        stageAgeDays: realm.stageAgeDays,
        breakthroughBonus: realm.breakthroughBonus,
        lastBreakthroughChance: realm.lastBreakthroughChance,
        breakthroughAttemptCounter: realm.breakthroughAttemptCounter
      };

      const hp = engine.world.getComponent(ent, HealthComponent);
      if (hp) comps.hp = { current: hp.current, max: hp.max, isDead: hp.isDead };

      const life = engine.world.getComponent(ent, LifespanComponent);
      if (life) comps.life = { currentAge: life.currentAge, maxLifespan: life.maxLifespan, isElderly: life.isElderly };

      const hunger = engine.world.getComponent(ent, HungerComponent);
      if (hunger) comps.hunger = { current: hunger.current, max: hunger.max };

      const tech = engine.world.getComponent(ent, CultivationTechniqueComponent);
      if (tech) comps.tech = {
        techniqueId: tech.techniqueId,
        techniqueName: tech.techniqueName,
        tier: tech.tier,
        element: tech.element,
        description: tech.description,
        source: tech.source,
        sourceName: tech.sourceName,
        masteryLevel: tech.masteryLevel,
        masteryExp: tech.masteryExp
      };

      const stateComp = engine.world.getComponent(ent, CharacterStateComponent);
      if (stateComp) comps.state = { state: stateComp.state, direction: stateComp.direction };

      const insideBuilding = engine.world.getComponent(ent, InsideBuildingComponent);
      if (insideBuilding) comps.insideBuilding = { buildingEntityId: insideBuilding.buildingEntityId };

      const anim = engine.world.getComponent(ent, AnimationComponent);
      if (anim) comps.anim = { configId: anim.configId, currentClip: anim.currentClip, frameIndex: anim.frameIndex };

      const traits = engine.world.getComponent(ent, TraitsComponent);
      if (traits) comps.traits = {
        innateTraits: traits.innateTraits,
        techniqueTraits: traits.techniqueTraits,
        trainingTraits: traits.trainingTraits
      };

      const comp = engine.world.getComponent(ent, ComprehensionComponent);
      if (comp) comps.comp = { current: comp.current, max: comp.max };

      const root = engine.world.getComponent(ent, SpiritualRootComponent);
      if (root) comps.root = {
        isAwakened: root.isAwakened,
        rootType: root.rootType,
        gradeName: root.gradeName,
        elements: root.elements,
        purity: root.purity,
        awakenedAge: root.awakenedAge
      };

      const needs = engine.world.getComponent(ent, MortalNeedsComponent);
      serializeProfessions(engine.world, ent, comps);
      if (needs) comps.needs = {
        thirst: needs.thirst,
        sleep: needs.sleep,
        recreation: needs.recreation,
        cookedMealCount: needs.cookedMealCount,
        rawFoodCount: needs.rawFoodCount
      };

      const sched = engine.world.getComponent(ent, DailyScheduleComponent);
      if (sched) comps.sched = {
        currentActivity: sched.currentActivity,
        preferredJob: sched.preferredJob,
        chronotypeOffset: sched.chronotypeOffset,
        homeBuildingEntityId: sched.homeBuildingEntityId
      };

      const child = engine.world.getComponent(ent, ChildcareComponent);
      if (child) comps.child = { isChild: child.isChild, guardianEntityId: child.guardianEntityId, childrenEntityIds: child.childrenEntityIds };

      const history = engine.world.getComponent(ent, CharacterHistoryComponent);
      if (history) comps.history = { records: history.records };

      const social = engine.world.getComponent(ent, SocialRelationshipComponent);
      if (social) comps.social = serializeSocialSave(engine.world, social);

      const memory = engine.world.getComponent(ent, MemoryComponent);
      if (memory) comps.memory = { memories: memory.memories.map(record => ({ ...record })) };

      const stats = engine.world.getComponent(ent, CombatStatsComponent);
      if (stats) comps.stats = {
        baseAtk: stats.baseAtk,
        defense: stats.defense,
        armor: stats.armor,
        attackSpeed: stats.attackSpeed,
        critRate: stats.critRate,
        dodgeRate: stats.dodgeRate,
        critDamage: stats.critDamage,
        attackRange: stats.attackRange,
        isHostile: stats.isHostile,
        buffDamageMultiplier: stats.buffDamageMultiplier,
        buffTimer: stats.buffTimer
      };

      const equip = engine.world.getComponent(ent, EquipmentComponent);
      if (equip) comps.equip = {
        mainHandId: equip.mainHand?.id ?? null,
        offHandId: equip.offHand?.id ?? null,
        workToolId: equip.workTool?.id ?? null,
        bodyArmorId: equip.bodyArmor?.id ?? null,
        artifactId: equip.artifact?.id ?? null
      };

      const inv = engine.world.getComponent(ent, InventoryComponent);
      if (inv) comps.inv = {
        pills: inv.getPillsSummary().map(p => ({ pillId: p.def.id, count: p.count }))
      };

      const chest = engine.world.getComponent(ent, TreasureChestComponent);
      if (chest) comps.treasureChest = {
        schemaVersion: chest.schemaVersion,
        opened: chest.opened,
        loot: chest.loot.map(item => ({ ...item }))
      };

      const plant = engine.world.getComponent(ent, PlantComponent);
      if (plant) comps.plant = {
        speciesId: plant.speciesId,
        category: plant.category,
        tier: plant.tier,
        stage: plant.stage,
        growthProgress: plant.growthProgress,
        ageDays: plant.ageDays,
        qiAccumulated: plant.qiAccumulated,
        isSpiritualized: plant.isSpiritualized,
        hasFruit: plant.hasFruit,
        fruitRegrowDaysRemaining: plant.fruitRegrowDaysRemaining,
        woodRemaining: plant.woodRemaining,
        maxWood: plant.maxWood,
        woodRegrowDaysRemaining: plant.woodRegrowDaysRemaining
      };

      const bld = engine.world.getComponent(ent, BuildingComponent);
      if (bld) comps.bld = {
        buildingType: bld.buildingType,
        factionId: bld.factionId,
        name: bld.name,
        widthTiles: bld.widthTiles,
        heightTiles: bld.heightTiles,
        maxDurability: bld.maxDurability,
        currentDurability: bld.currentDurability,
        level: bld.level,
        occupantEntityId: bld.occupantEntityId,
        timer: bld.timer,
        interval: bld.interval,
        settlementId: bld.settlementId,
        isRuins: bld.isRuins,
        isUnderConstruction: bld.isUnderConstruction,
        doorSide: bld.doorSide
      };

      const site = engine.world.getComponent(ent, ConstructionSiteComponent);
      if (site) comps.constructionSite = {
        status: site.status,
        requiredWorkTicks: site.requiredWorkTicks,
        completedWorkTicks: site.completedWorkTicks,
        assignedWorkerIds: site.assignedWorkerIds,
        reservedResources: site.reservedResources,
        payerFactionId: site.payerFactionId,
        settlementId: site.settlementId,
        founderEntityId: site.founderEntityId
      };

      const faction = engine.world.getComponent(ent, FactionComponent);
      if (faction) comps.faction = {
        factionId: faction.factionId,
        name: faction.name,
        type: faction.type,
        alignment: faction.alignment,
        rank: faction.rank,
        color: faction.color,
        leaderEntityId: faction.leaderEntityId,
        founderEntityId: faction.founderEntityId,
        foundedYear: faction.foundedYear,
        foundedTotalDays: faction.foundedTotalDays,
        territoryRadius: faction.territoryRadius,
        prestige: faction.prestige,
        stability: faction.stability,
        developmentStage: faction.developmentStage,
        upgradeEligibleSinceDays: faction.upgradeEligibleSinceDays,
        declineSinceDays: faction.declineSinceDays,
        herbStock: faction.herbStock,
        pillStock: faction.pillStock,
        spiritStones: faction.spiritStones,
        foodStock: faction.foodStock,
        woodStock: faction.woodStock,
        stoneStock: faction.stoneStock,
        treasury: faction.treasury,
        taxRate: faction.taxRate,
        reservedResources: faction.reservedResources,
        settlementIds: faction.settlementIds,
        capitalSettlementId: faction.capitalSettlementId,
        suzerainFactionId: faction.suzerainFactionId,
        vassalFactionIds: faction.vassalFactionIds,
        protectedSettlementIds: faction.protectedSettlementIds,
        hasBeenPopulated: faction.hasBeenPopulated,
        members: Array.from(faction.members)
      };

      const member = engine.world.getComponent(ent, MemberComponent);
      if (member) comps.member = {
        factionId: member.factionId,
        role: member.role,
        contribution: member.contribution,
        loyalty: member.loyalty,
        joinedDays: member.joinedDays,
        intentReason: member.intentReason,
        leaveCooldownUntilDays: member.leaveCooldownUntilDays
      };

      const tc = engine.world.getComponent(ent, TerritoryCenterComponent);
      if (tc) comps.territory = {
        factionId: tc.factionId,
        radiusPixels: tc.radiusPixels,
        color: tc.color,
        factionName: tc.factionName,
        settlementId: tc.settlementId,
        layerType: tc.layerType
      };

      const settlement = engine.world.getComponent(ent, SettlementComponent);
      if (settlement) comps.settlement = {
        settlementId: settlement.settlementId,
        name: settlement.name,
        settlementType: settlement.settlementType,
        ownerFactionId: settlement.ownerFactionId,
        protectorFactionId: settlement.protectorFactionId,
        localLeaderEntityId: settlement.localLeaderEntityId,
        residentIds: Array.from(settlement.residentIds),
        housingCapacity: settlement.housingCapacity,
        waterAccess: settlement.waterAccess,
        Prosperity: settlement.Prosperity,
        radiusPixels: settlement.radiusPixels
      };

      const residence = engine.world.getComponent(ent, ResidenceComponent);
      if (residence) comps.residence = {
        settlementId: residence.settlementId,
        factionId: residence.factionId,
        homeBuildingEntityId: residence.homeBuildingEntityId,
        homeRole: residence.homeRole,
        joinedDays: residence.joinedDays
      };

      const foundingIntent = engine.world.getComponent(ent, FoundingIntentComponent);
      if (foundingIntent) comps.foundingIntent = {
        intentType: foundingIntent.intentType,
        stage: foundingIntent.stage,
        reason: foundingIntent.reason,
        participantIds: Array.from(foundingIntent.participantIds),
        targetPos: foundingIntent.targetPos,
        reservedResources: foundingIntent.reservedResources,
        resourcesReserved: foundingIntent.resourcesReserved,
        taskId: foundingIntent.taskId,
        timeoutSeconds: foundingIntent.timeoutSeconds,
        elapsedSeconds: foundingIntent.elapsedSeconds,
        cancelReason: foundingIntent.cancelReason
      };

      const corpse = engine.world.getComponent(ent, CorpseComponent);
      if (corpse) comps.corpse = {
        deceasedName: corpse.deceasedName,
        raceId: corpse.raceId,
        realmStageIndex: corpse.realmStageIndex,
        realmStageName: corpse.realmStageName,
        deathDay: corpse.deathDay,
        deathMonth: corpse.deathMonth,
        deathYear: corpse.deathYear,
        deathReason: corpse.deathReason,
        socialDeathProcessed: corpse.socialDeathProcessed,
        remainingDays: corpse.remainingDays,
        totalDays: corpse.totalDays,
        isBeingCarried: corpse.isBeingCarried,
        carriedByEntityId: corpse.carriedByEntityId,
        isBuried: corpse.isBuried,
        items: corpse.items
      };

      const grave = engine.world.getComponent(ent, GraveComponent);
      if (grave) comps.grave = {
        deceasedName: grave.deceasedName,
        raceId: grave.raceId,
        realmStageIndex: grave.realmStageIndex,
        realmStageName: grave.realmStageName,
        buriedByName: grave.buriedByName,
        buriedByEntityId: grave.buriedByEntityId,
        burialDay: grave.burialDay,
        burialMonth: grave.burialMonth,
        burialYear: grave.burialYear,
        remainingDays: grave.remainingDays,
        totalDays: grave.totalDays,
        burialGoods: grave.burialGoods
      };

      const loot = engine.world.getComponent(ent, DroppedLootComponent);
      if (loot) comps.loot = {
        ownerName: loot.ownerName,
        realmStageName: loot.realmStageName,
        droppedDay: loot.droppedDay,
        droppedMonth: loot.droppedMonth,
        droppedYear: loot.droppedYear,
        items: loot.items
      };

      const gz = engine.world.getComponent(ent, GraveyardZoneComponent);
      if (gz) comps.graveyardZone = {
        factionId: gz.factionId,
        centerX: gz.centerX,
        centerY: gz.centerY,
        radiusTiles: gz.radiusTiles,
        occupiedPlots: gz.occupiedPlots
      };

      const godDecree = engine.world.getComponent(ent, GodDecreeComponent);
      if (godDecree) comps.godDecree = { decree: godDecree.decree };

      const aiBrain = engine.world.getComponent(ent, AIStrategicBrainComponent);
      if (aiBrain) {
        comps.aiBrain = {
          currentGoal: aiBrain.currentGoal,
          goalReason: aiBrain.goalReason,
          targetCorpseEntityId: aiBrain.targetCorpseEntityId,
        };
      }

      const aiPlanner = engine.world.getComponent(ent, AIPlannerComponent);
      if (aiPlanner) {
        comps.aiPlanner = {
          planRevision: aiPlanner.planRevision,
          currentPlanGoal: aiPlanner.currentPlanGoal,
          steps: aiPlanner.steps.map(s => ({
            ...s,
            targetPos: s.targetPos ? { ...s.targetPos } : undefined,
            customData: s.customData ? { ...s.customData } : undefined,
          })),
          currentStepIndex: aiPlanner.currentStepIndex,
          planStatus: aiPlanner.planStatus,
          stepElapsedTimer: aiPlanner.stepElapsedTimer,
        };
      }

      serializeEntityTraitTalent(engine.world, ent, comps);
      serializeEntityAnimalComponents(engine.world, ent, comps);

      serializedEntities.push({
        id: ent,
        components: comps
      });
    }

    return {
      metadata,
      traitSystemVersion: TRAIT_SYSTEM_VERSION,
      talentGenerationVersion: TALENT_GENERATION_VERSION,
      birthOrdinal: engine.world.birthOrdinal ?? 0,
      camera: {
        x: engine.camera.x,
        y: engine.camera.y,
        zoom: engine.camera.zoom
      },
      time: engine.timeManager ? engine.timeManager.saveState() : {
        totalTicks: 0,
        speed: 1,
        clockSchema: 2,
        calendarEpochTick: 0,
        calendarEpochDays: 0,
        oldTicksPerDay: TimeManager.TICKS_PER_DAY
      },
      worldMap: {
        width: mapW,
        height: mapH,
        tileSize: engine.worldMap.tileSize,
        tiles: mapTiles
      },
      qiGrid: {
        width: qiW,
        height: qiH,
        tiles: qiTiles
      },
      entities: serializedEntities,
      nextEntityId: getNextEntityId(),
      activeTribulations: engine.tribulationSystem ? engine.tribulationSystem.serializeTribulations() : [],
      diplomacy: engine.diplomacySystem ? engine.diplomacySystem.serializeRelations() : {},
      treaties: engine.diplomacySystem ? engine.diplomacySystem.serializeTreaties() : undefined,
      weather: engine.weatherSystem ? engine.weatherSystem.serializeState() : undefined
    };
  }


  /**
   * Xác thực toàn bộ cấu trúc và tính hợp lệ của đối tượng SaveData.
   * Ném ra ngoại lệ có thông điệp cụ thể nếu phát hiện trường dữ liệu bị thiếu hoặc sai lệch.
   */
  public static validateSaveData(data: any): asserts data is SaveData {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      throw new Error('Dữ liệu bản lưu không hợp lệ: Không phải đối tượng bản lưu hợp lệ!');
    }

    // 1. Kiểm tra Metadata & Phiên bản 2.0.0+
    if (!data.metadata || typeof data.metadata !== 'object' || Array.isArray(data.metadata)) {
      throw new Error('Dữ liệu bản lưu không hợp lệ: Thiếu phần thông tin metadata!');
    }
    const rawVersion =
      typeof data.metadata.version === 'string'
        ? data.metadata.version
        : typeof data.version === 'string'
          ? data.version
          : undefined;
    if (!isSaveVersionSupported(rawVersion)) {
      throw new Error(OLD_SAVE_REJECT_MESSAGE);
    }
    if (typeof data.metadata.name !== 'string' || !data.metadata.name.trim()) {
      throw new Error('Dữ liệu bản lưu không hợp lệ: Tên bản lưu (metadata.name) không hợp lệ!');
    }
    if (data.metadata.id !== undefined && typeof data.metadata.id !== 'string') {
      throw new Error('Dữ liệu bản lưu không hợp lệ: Trường metadata.id phải là chuỗi!');
    }
    if (data.metadata.templateId !== undefined && typeof data.metadata.templateId !== 'string') {
      throw new Error('Dữ liệu bản lưu không hợp lệ: Trường metadata.templateId phải là chuỗi!');
    }
    if (data.metadata.seed !== undefined && (typeof data.metadata.seed !== 'number' || !Number.isFinite(data.metadata.seed))) {
      throw new Error('Dữ liệu bản lưu không hợp lệ: Trường metadata.seed phải là số hợp lệ!');
    }
    if (data.metadata.inGameDateStr !== undefined && typeof data.metadata.inGameDateStr !== 'string') {
      throw new Error('Dữ liệu bản lưu không hợp lệ: Trường metadata.inGameDateStr phải là chuỗi!');
    }
    if (data.metadata.realDateStr !== undefined && typeof data.metadata.realDateStr !== 'string') {
      throw new Error('Dữ liệu bản lưu không hợp lệ: Trường metadata.realDateStr phải là chuỗi!');
    }
    if (data.metadata.entityCount !== undefined && (typeof data.metadata.entityCount !== 'number' || !Number.isFinite(data.metadata.entityCount) || data.metadata.entityCount < 0)) {
      throw new Error('Dữ liệu bản lưu không hợp lệ: Trường metadata.entityCount không hợp lệ!');
    }

    // 2. Kiểm tra WorldMap
    if (!data.worldMap || typeof data.worldMap !== 'object') {
      throw new Error('Dữ liệu bản lưu không hợp lệ: Thiếu dữ liệu bản đồ thế giới (worldMap)!');
    }
    const mapW = data.worldMap.width;
    const mapH = data.worldMap.height;
    if (typeof mapW !== 'number' || !Number.isInteger(mapW) || mapW <= 0 ||
        typeof mapH !== 'number' || !Number.isInteger(mapH) || mapH <= 0) {
      throw new Error('Dữ liệu bản lưu không hợp lệ: Kích thước worldMap không hợp lệ!');
    }
    if (mapW > MAX_WORLD_DIMENSION || mapH > MAX_WORLD_DIMENSION) {
      throw new Error('Dữ liệu bản lưu không hợp lệ: Kích thước worldMap vượt quá giới hạn hỗ trợ!');
    }
    if (data.worldMap.tileSize !== 16) {
      throw new Error('Dữ liệu bản lưu không hợp lệ: Kích thước ô bản đồ phải là 16 pixel!');
    }
    if (!Array.isArray(data.worldMap.tiles)) {
      throw new Error('Dữ liệu bản lưu không hợp lệ: Danh sách ô worldMap.tiles phải là một mảng!');
    }
    const expectedMapTiles = mapW * mapH;
    if (data.worldMap.tiles.length !== expectedMapTiles) {
      throw new Error(`Dữ liệu bản lưu không hợp lệ: Số lượng ô worldMap không khớp (nhận ${data.worldMap.tiles.length}, kỳ vọng ${expectedMapTiles})!`);
    }

    for (let i = 0; i < data.worldMap.tiles.length; i++) {
      const tileTuple = data.worldMap.tiles[i];
      if (!Array.isArray(tileTuple) || tileTuple.length < 6) {
        throw new Error(`Dữ liệu bản lưu không hợp lệ: Ô bản đồ thứ ${i} không đúng cấu trúc tuple (tối thiểu 6 phần tử)!`);
      }
      const [terrainIdx, elev100, moisture100, temp, qi, variant] = tileTuple;
      if (typeof terrainIdx !== 'number' || !Number.isInteger(terrainIdx) || terrainIdx < 0 || terrainIdx >= TERRAIN_LIST.length) {
        throw new Error(`Dữ liệu bản lưu không hợp lệ: Địa hình ô thứ ${i} không hợp lệ (nhận ${terrainIdx})!`);
      }
      if (typeof elev100 !== 'number' || !Number.isFinite(elev100) || elev100 < 0 || elev100 > 100) {
        throw new Error(`Dữ liệu bản lưu không hợp lệ: Cao độ ô thứ ${i} không hợp lệ (nhận ${elev100})!`);
      }
      if (typeof moisture100 !== 'number' || !Number.isFinite(moisture100) || moisture100 < 0 || moisture100 > 100) {
        throw new Error(`Dữ liệu bản lưu không hợp lệ: Độ ẩm ô thứ ${i} không hợp lệ (nhận ${moisture100})!`);
      }
      if (typeof temp !== 'number' || !Number.isFinite(temp)) {
        throw new Error(`Dữ liệu bản lưu không hợp lệ: Nhiệt độ ô thứ ${i} không hợp lệ (nhận ${temp})!`);
      }
      if (typeof qi !== 'number' || !Number.isFinite(qi) || qi < 0) {
        throw new Error(`Dữ liệu bản lưu không hợp lệ: Linh khí ô thứ ${i} không hợp lệ (nhận ${qi})!`);
      }
      if (typeof variant !== 'number' || !Number.isInteger(variant) || variant < 0 || variant > 3) {
        throw new Error(`Dữ liệu bản lưu không hợp lệ: Biến thể ô thứ ${i} không hợp lệ (nhận ${variant})!`);
      }
    }

    // 3. Kiểm tra QiGrid
    if (!data.qiGrid || typeof data.qiGrid !== 'object') {
      throw new Error('Dữ liệu bản lưu không hợp lệ: Thiếu dữ liệu lưới linh khí (qiGrid)!');
    }
    const qiW = data.qiGrid.width;
    const qiH = data.qiGrid.height;
    if (typeof qiW !== 'number' || !Number.isInteger(qiW) || qiW <= 0 ||
        typeof qiH !== 'number' || !Number.isInteger(qiH) || qiH <= 0) {
      throw new Error('Dữ liệu bản lưu không hợp lệ: Kích thước qiGrid không hợp lệ!');
    }
    if (qiW !== mapW || qiH !== mapH) {
      throw new Error(`Dữ liệu bản lưu không hợp lệ: Kích thước qiGrid (${qiW}x${qiH}) không khớp với worldMap (${mapW}x${mapH})!`);
    }
    if (!Array.isArray(data.qiGrid.tiles)) {
      throw new Error('Dữ liệu bản lưu không hợp lệ: Danh sách ô qiGrid.tiles phải là một mảng!');
    }
    const expectedQiTiles = qiW * qiH;
    if (data.qiGrid.tiles.length !== expectedQiTiles) {
      throw new Error(`Dữ liệu bản lưu không hợp lệ: Số lượng ô qiGrid không khớp (nhận ${data.qiGrid.tiles.length}, kỳ vọng ${expectedQiTiles})!`);
    }

    for (let i = 0; i < data.qiGrid.tiles.length; i++) {
      const qTile = data.qiGrid.tiles[i];
      if (!Array.isArray(qTile) || qTile.length < 5) {
        throw new Error(`Dữ liệu bản lưu không hợp lệ: Ô linh khí thứ ${i} không đúng cấu trúc tuple (tối thiểu 5 phần tử)!`);
      }
      const [density, tier, element, isVein, veinRate] = qTile;
      if (typeof density !== 'number' || !Number.isFinite(density) || density < 0) {
        throw new Error(`Dữ liệu bản lưu không hợp lệ: Mật độ linh khí ô thứ ${i} không hợp lệ!`);
      }
      if (typeof tier !== 'string' || !tier.trim()) {
        throw new Error(`Dữ liệu bản lưu không hợp lệ: Cấp bậc linh khí ô thứ ${i} không hợp lệ!`);
      }
      if (typeof element !== 'string' || !element.trim()) {
        throw new Error(`Dữ liệu bản lưu không hợp lệ: Thuộc tính linh khí ô thứ ${i} không hợp lệ!`);
      }
      if (typeof isVein !== 'number' || !Number.isFinite(isVein) || (isVein !== 0 && isVein !== 1)) {
        throw new Error(`Dữ liệu bản lưu không hợp lệ: Cờ linh mạch ô thứ ${i} không hợp lệ (phải là 0 hoặc 1)!`);
      }
      if (typeof veinRate !== 'number' || !Number.isFinite(veinRate) || veinRate < 0) {
        throw new Error(`Dữ liệu bản lưu không hợp lệ: Tốc độ hồi linh mạch ô thứ ${i} không hợp lệ!`);
      }
    }

    // 4. Kiểm tra Camera
    if (!data.camera || typeof data.camera !== 'object') {
      throw new Error('Dữ liệu bản lưu không hợp lệ: Thiếu thông số camera!');
    }
    if (typeof data.camera.x !== 'number' || !Number.isFinite(data.camera.x) ||
        typeof data.camera.y !== 'number' || !Number.isFinite(data.camera.y) ||
        typeof data.camera.zoom !== 'number' || !Number.isFinite(data.camera.zoom)) {
      throw new Error('Dữ liệu bản lưu không hợp lệ: Tọa độ hoặc độ phóng thu camera không hợp lệ!');
    }

    // 5. Kiểm tra TimeManager
    if (!data.time || typeof data.time !== 'object') {
      throw new Error('Dữ liệu bản lưu không hợp lệ: Thiếu dữ liệu thời gian (time)!');
    }
    if (
      typeof data.time.totalTicks !== 'number' ||
      !Number.isInteger(data.time.totalTicks) ||
      data.time.totalTicks < 0
    ) {
      throw new Error('Dữ liệu bản lưu không hợp lệ: Thông số time.totalTicks phải là số nguyên không âm!');
    }
    const ALLOWED_SPEEDS: readonly number[] = [...ALLOWED_TIME_SPEEDS, ...LEGACY_TIME_SPEEDS];
    if (
      typeof data.time.speed !== 'number' ||
      !ALLOWED_SPEEDS.includes(data.time.speed)
    ) {
      throw new Error('Dữ liệu bản lưu không hợp lệ: Thông số time.speed không hợp lệ (chỉ chấp nhận 0, 0.5, 1, 2, 3, 5, hoặc tốc độ cũ 10, 50)!');
    }
    if (data.time.clockSchema !== undefined) {
      if (data.time.clockSchema !== 2) {
        throw new Error('Dữ liệu bản lưu không hợp lệ: Thông số time.clockSchema không được hỗ trợ!');
      }
      if (
        typeof data.time.calendarEpochTick !== 'number' ||
        !Number.isFinite(data.time.calendarEpochTick) ||
        data.time.calendarEpochTick < 0 ||
        data.time.calendarEpochTick > data.time.totalTicks
      ) {
        throw new Error('Dữ liệu bản lưu không hợp lệ: Thông số time.calendarEpochTick không hợp lệ!');
      }
      if (
        typeof data.time.calendarEpochDays !== 'number' ||
        !Number.isFinite(data.time.calendarEpochDays) ||
        data.time.calendarEpochDays < 0
      ) {
        throw new Error('Dữ liệu bản lưu không hợp lệ: Thông số time.calendarEpochDays không hợp lệ!');
      }
      if (
        typeof data.time.oldTicksPerDay !== 'number' ||
        !Number.isFinite(data.time.oldTicksPerDay) ||
        data.time.oldTicksPerDay <= 0
      ) {
        throw new Error('Dữ liệu bản lưu không hợp lệ: Thông số time.oldTicksPerDay không hợp lệ!');
      }
    }

    // 6. Kiểm tra Entities
    if (!Array.isArray(data.entities)) {
      throw new Error('Dữ liệu bản lưu không hợp lệ: Danh sách thực thể (entities) phải là một mảng!');
    }
    const seenEntityIds = new Set<number>();
    let maxEntityId = 0;

    for (let i = 0; i < data.entities.length; i++) {
      const ent = data.entities[i];
      if (
        !ent ||
        typeof ent !== 'object' ||
        typeof ent.id !== 'number' ||
        !Number.isInteger(ent.id) ||
        ent.id <= 0 ||
        !ent.components ||
        typeof ent.components !== 'object'
      ) {
        throw new Error(`Dữ liệu bản lưu không hợp lệ: Thực thể thứ ${i} không đúng cấu trúc hoặc có ID không hợp lệ (phải là số nguyên dương)!`);
      }
      if (seenEntityIds.has(ent.id)) {
        throw new Error(`Dữ liệu bản lưu không hợp lệ: Phát hiện trùng lặp entity ID [${ent.id}] ở thực thể thứ ${i}!`);
      }
      seenEntityIds.add(ent.id);
      if (ent.id > maxEntityId) {
        maxEntityId = ent.id;
      }

      validateSerializedAnimalComponents(ent.id, ent.components);
      validateProfessionSave(ent.id, ent.components);
      validateSocialSave(ent.id, ent.components);

      const chest = ent.components.treasureChest;
      if (chest !== undefined) {
        const pos = ent.components.pos;
        if (!chest || typeof chest !== 'object' || Array.isArray(chest) ||
            chest.schemaVersion !== 1 || typeof chest.opened !== 'boolean' ||
            !Array.isArray(chest.loot) || chest.loot.length < 1 || chest.loot.length > 2 ||
            chest.loot.reduce((sum: number, item: any) => sum + (Number.isSafeInteger(item?.count) ? item.count : 0), 0) > 2 ||
            chest.loot.some((item: any) => !item || typeof item !== 'object' ||
              !PILL_DEFINITIONS[item.pillId] || !Number.isSafeInteger(item.count) || item.count < 1 || item.count > 2) ||
            !pos || !Number.isFinite(pos.x) || !Number.isFinite(pos.y) ||
            pos.x < 0 || pos.y < 0 ||
            pos.x >= data.worldMap.width * data.worldMap.tileSize ||
            pos.y >= data.worldMap.height * data.worldMap.tileSize) {
          throw new Error(`Dữ liệu bản lưu không hợp lệ: Rương ${ent.id} có vật phẩm, trạng thái hoặc tọa độ không hợp lệ!`);
        }
      }

      const savedRealm = ent.components.realm;
      if (savedRealm) {
        for (const key of ['breakthroughTimer', 'stageAgeDays', 'breakthroughBonus', 'lastBreakthroughChance']) {
          const value = savedRealm[key];
          if (value !== undefined && (typeof value !== 'number' || !Number.isFinite(value) ||
              value < 0 || (key === 'lastBreakthroughChance' && value > 1))) {
            throw new Error(`Dữ liệu bản lưu không hợp lệ: Realm ${ent.id} có ${key} không hợp lệ!`);
          }
        }
        if (savedRealm.breakthroughAttemptCounter !== undefined &&
            (!Number.isSafeInteger(savedRealm.breakthroughAttemptCounter) || savedRealm.breakthroughAttemptCounter < 0)) {
          throw new Error(`Dữ liệu bản lưu không hợp lệ: Realm ${ent.id} có bộ đếm đột phá không hợp lệ!`);
        }
      }

      const site = ent.components.constructionSite;
      if (site !== undefined) {
        const building = ent.components.bld;
        const invalid = (reason: string): never => {
          throw new Error(`Dữ liệu bản lưu không hợp lệ: Công trường của thực thể ${ent.id} ${reason}!`);
        };
        if (!building || typeof building !== 'object' || building.isUnderConstruction !== true) {
          invalid('phải gắn với công trình đang thi công');
        }
        if (!site || typeof site !== 'object' || Array.isArray(site)) {
          invalid('không đúng cấu trúc');
        }
        if (typeof site.requiredWorkTicks !== 'number' || !Number.isFinite(site.requiredWorkTicks) || site.requiredWorkTicks <= 0) {
          invalid('có requiredWorkTicks không hợp lệ');
        }
        if (site.completedWorkTicks !== undefined &&
            (typeof site.completedWorkTicks !== 'number' || !Number.isFinite(site.completedWorkTicks) ||
            site.completedWorkTicks < 0 || site.completedWorkTicks >= site.requiredWorkTicks)) {
          invalid('có completedWorkTicks không hợp lệ');
        }
        if (site.status !== undefined && site.status !== 'planned' && site.status !== 'under_construction') {
          invalid('có trạng thái không hợp lệ');
        }
        if (site.payerFactionId !== undefined &&
            (typeof site.payerFactionId !== 'string' ||
            site.payerFactionId !== building.factionId ||
            (!site.payerFactionId && site.founderEntityId === undefined))) {
          invalid('có payerFactionId không khớp công trình');
        }
        if (site.founderEntityId !== undefined &&
            (typeof site.founderEntityId !== 'number' || !Number.isSafeInteger(site.founderEntityId) ||
            site.founderEntityId <= 0 || building.factionId !== '' ||
            (building.buildingType !== 'campfire' && building.buildingType !== 'sect_hall'))) {
          invalid('có founderEntityId không hợp lệ');
        }
        if (site.settlementId !== undefined && typeof site.settlementId !== 'string') {
          invalid('có settlementId không hợp lệ');
        }
        if (site.assignedWorkerIds !== undefined &&
            (!Array.isArray(site.assignedWorkerIds) ||
            site.assignedWorkerIds.some((id: unknown) => typeof id !== 'number' || !Number.isSafeInteger(id) || id <= 0) ||
            new Set(site.assignedWorkerIds).size !== site.assignedWorkerIds.length)) {
          invalid('có assignedWorkerIds không hợp lệ');
        }
        const resources = site.reservedResources;
        if (resources !== undefined &&
            (!resources || typeof resources !== 'object' || Array.isArray(resources) ||
            ['food', 'wood', 'stone', 'spiritStones'].some(key =>
              resources[key] !== undefined &&
              (typeof resources[key] !== 'number' || !Number.isFinite(resources[key]) || resources[key] < 0)))) {
          invalid('có reservedResources không hợp lệ');
        }
      }

      if (ent.components.stats) {
        const s = ent.components.stats;
        if (
          s.buffDamageMultiplier !== undefined &&
          (typeof s.buffDamageMultiplier !== 'number' || !Number.isFinite(s.buffDamageMultiplier) || s.buffDamageMultiplier < 0)
        ) {
          throw new Error(`Dữ liệu bản lưu không hợp lệ: Thực thể thứ ${i} có buffDamageMultiplier không hợp lệ!`);
        }
        if (
          s.buffTimer !== undefined &&
          (typeof s.buffTimer !== 'number' || !Number.isFinite(s.buffTimer) || s.buffTimer < 0)
        ) {
          throw new Error(`Dữ liệu bản lưu không hợp lệ: Thực thể thứ ${i} có buffTimer không hợp lệ!`);
        }
      }
    }

    for (const ent of data.entities) {
      const founderId = ent.components.constructionSite?.founderEntityId;
      if (founderId === undefined) continue;
      const founder = data.entities.find((candidate: SerializedEntity) => candidate.id === founderId);
      const expectedType = ent.components.bld?.buildingType === 'campfire' ? 'hamlet' : 'sect';
      if (!founder?.components.foundingIntent ||
          founder.components.foundingIntent.intentType !== expectedType ||
          founder.components.foundingIntent.stage !== 'building') {
        throw new Error(`Dữ liệu bản lưu không hợp lệ: Công trường sáng lập ${ent.id} thiếu ý định hợp lệ!`);
      }
    }

    // 7. Kiểm tra nextEntityId nếu có
    if (data.nextEntityId !== undefined) {
      if (
        typeof data.nextEntityId !== 'number' ||
        !Number.isInteger(data.nextEntityId) ||
        data.nextEntityId <= maxEntityId
      ) {
        throw new Error(
          `Dữ liệu bản lưu không hợp lệ: nextEntityId (${data.nextEntityId}) phải là số nguyên lớn hơn entity ID lớn nhất (${maxEntityId})!`
        );
      }
    }

    // 8. Kiểm tra activeTribulations nếu có
    if (data.activeTribulations !== undefined) {
      if (!Array.isArray(data.activeTribulations)) {
        throw new Error('Dữ liệu bản lưu không hợp lệ: activeTribulations phải là một mảng!');
      }
      for (let i = 0; i < data.activeTribulations.length; i++) {
        const t = data.activeTribulations[i];
        if (!t || typeof t !== 'object' ||
            typeof t.entityId !== 'number' || !Number.isFinite(t.entityId) ||
            typeof t.strikesRemaining !== 'number' || !Number.isFinite(t.strikesRemaining) ||
            typeof t.strikeTimer !== 'number' || !Number.isFinite(t.strikeTimer) ||
            typeof t.strikeInterval !== 'number' || !Number.isFinite(t.strikeInterval) ||
            typeof t.targetStageName !== 'string') {
          throw new Error(`Dữ liệu bản lưu không hợp lệ: Độ kiếp thứ ${i} không đúng cấu trúc!`);
        }
      }
    }

    // 9. Kiểm tra diplomacy nếu có
    if (data.diplomacy !== undefined) {
      if (!data.diplomacy || typeof data.diplomacy !== 'object' || Array.isArray(data.diplomacy)) {
        throw new Error('Dữ liệu bản lưu không hợp lệ: diplomacy phải là một đối tượng!');
      }
      for (const [k, v] of Object.entries(data.diplomacy)) {
        if (typeof k !== 'string' || (v !== 'allied' && v !== 'neutral' && v !== 'war')) {
          throw new Error(`Dữ liệu bản lưu không hợp lệ: Quan hệ ngoại giao [${k}] có giá trị không hợp lệ!`);
        }
      }
    }

    // 10. Kiểm tra weather nếu có
    if (data.weather !== undefined) {
      if (!data.weather || typeof data.weather !== 'object' || Array.isArray(data.weather) ||
          typeof data.weather.currentWeather !== 'string' ||
          !Object.prototype.hasOwnProperty.call(WEATHER_CONFIGS, data.weather.currentWeather as WeatherType) ||
          typeof data.weather.weatherTimer !== 'number' || !Number.isFinite(data.weather.weatherTimer) ||
          data.weather.weatherTimer < 0 ||
          typeof data.weather.tileTimer !== 'number' || !Number.isFinite(data.weather.tileTimer) ||
          data.weather.tileTimer < 0 ||
          (data.weather.weatherDuration !== undefined &&
            (typeof data.weather.weatherDuration !== 'number' || !Number.isFinite(data.weather.weatherDuration) || data.weather.weatherDuration <= 0)) ||
          (data.weather.seasonalTempOffset !== undefined &&
            (typeof data.weather.seasonalTempOffset !== 'number' || !Number.isFinite(data.weather.seasonalTempOffset)))) {
        throw new Error('Dữ liệu bản lưu không hợp lệ: Trạng thái thời tiết (weather) không đúng cấu trúc!');
      }
    }

    for (const entity of data.entities) {
      const personality = entity.components.personality;
      if (personality !== undefined) {
        if (!personality || typeof personality !== 'object' || Array.isArray(personality) ||
            ['sociability', 'diligence', 'curiosity', 'ambition'].some(key => typeof personality[key] !== 'number' || !Number.isFinite(personality[key]) || personality[key] < 0 || personality[key] > 1)) {
          throw new Error(`Tính cách thực thể #${entity.id} không hợp lệ!`);
        }
      }
      const baseline = entity.components.statBaseline;
      if (baseline?.agingReference !== undefined) {
        const ref = baseline.agingReference;
        if (!ref || typeof ref !== 'object' || Array.isArray(ref) ||
            ['maxHealth', 'attack', 'defense', 'armor', 'moveSpeed', 'attackSpeed', 'dodgeRate'].some(key => typeof ref[key] !== 'number' || !Number.isFinite(ref[key]) || ref[key] < 0) ||
            ref.maxHealth <= 0 || ref.attackSpeed <= 0 || ref.dodgeRate > 0.8) {
          throw new Error(`Mốc khỏe mạnh thực thể #${entity.id} không hợp lệ!`);
        }
      }
      if (baseline?.agingFactor !== undefined && (typeof baseline.agingFactor !== 'number' || !Number.isFinite(baseline.agingFactor) || baseline.agingFactor < 0.5 || baseline.agingFactor > 1)) {
        throw new Error(`Hệ số già yếu thực thể #${entity.id} không hợp lệ!`);
      }
    }

    // 11. Kiểm tra dữ liệu V3 (traitSystemVersion, talentGenerationVersion, NaN/Infinity)
    validateTraitTalentSaveData(data);
  }


  /**
   * Khôi phục toàn bộ thế giới từ đối tượng SaveData.
   * Sử dụng cơ chế Dựng trạng thái tạm (Staging) để đảm bảo an toàn tuyệt đối:
   * Nếu có bất kỳ lỗi nào xảy ra trong quá trình xác thực hoặc dựng dữ liệu,
   * thế giới đang chơi sẽ giữ nguyên 100%, không bị xóa hay biến dạng.
   */
  public static deserializeWorld(engine: Engine, data: SaveData): void {
    // 0. Xác thực toàn bộ bản lưu trước khi thao tác
    this.validateSaveData(data);

    console.log(`📦 Bắt đầu nạp bản lưu [${data.metadata.name}] (${data.metadata.inGameDateStr || data.metadata.name})...`);

    // ========================================================
    // GIAI ĐOẠN 1: DỰNG TRẠNG THÁI TẠM (STAGING PHASE)
    // Toàn bộ dữ liệu được dựng và kiểm tra trong các cấu trúc tạm.
    // Thế giới đang chơi (engine.world, engine.worldMap, v.v.)
    // TUYỆT ĐỐI KHÔNG BỊ THAY ĐỔI hay XÓA BỎ ở giai đoạn này!
    // ========================================================

    const savedW = data.worldMap.width || 360;
    const savedH = data.worldMap.height || 360;

    // 1.1 Dựng dữ liệu gạch WorldMap tạm thời
    const stagedMapTiles: {
      terrain: TerrainType;
      elevation: number;
      moisture: number;
      temperature: number;
      qiDensity: number;
      variant: number;
      plantGrowth: number;
    }[] = new Array(data.worldMap.tiles.length);

    for (let i = 0; i < data.worldMap.tiles.length; i++) {
      const tileData = data.worldMap.tiles[i];
      if (!Array.isArray(tileData) || tileData.length < 6) {
        throw new Error(`Dữ liệu ô bản đồ thứ ${i} không hợp lệ!`);
      }
      const [tIdx, elev100, moist100, temp, qi, variant] = tileData;
      if (typeof elev100 !== 'number' || !Number.isFinite(elev100) || elev100 < 0 || elev100 > 100) {
        throw new Error(`Dữ liệu ô bản đồ thứ ${i} có độ cao không hợp lệ: ${elev100}!`);
      }
      const elevation = elev100 / 100;
      if (!isValidElevation(elevation)) {
        throw new Error(`Độ cao ô bản đồ thứ ${i} ngoài phạm vi cho phép [0, 1]: ${elevation}!`);
      }
      const terrain = TERRAIN_LIST[tIdx] || TerrainType.PLAIN;
      const moisture = moist100 / 100;
      stagedMapTiles[i] = {
        terrain,
        elevation,
        moisture,
        temperature: temp,
        qiDensity: qi,
        variant,
        plantGrowth: calculatePlantGrowth(terrain, moisture)
      };
    }

    // 1.2 Dựng dữ liệu gạch QiGrid tạm thời
    const stagedQiTiles: {
      density: number;
      tier: any;
      dominantElement: any;
      isSpiritVein: boolean;
      veinRate: number;
    }[] = new Array(data.qiGrid.tiles.length);

    for (let i = 0; i < data.qiGrid.tiles.length; i++) {
      const qTileData = data.qiGrid.tiles[i];
      if (!Array.isArray(qTileData) || qTileData.length < 5) {
        throw new Error(`Dữ liệu ô linh khí thứ ${i} không hợp lệ!`);
      }
      const [density, tier, elem, isVein, veinRate] = qTileData;
      stagedQiTiles[i] = {
        density,
        tier,
        dominantElement: elem,
        isSpiritVein: isVein === 1,
        veinRate
      };
    }

    // 1.3 Dựng toàn bộ Entities & Components vào một ECSWorld tạm (stagingWorld)
    const prevNextEntityId = getNextEntityId();
    const stagingWorld = new ECSWorld();
    stagingWorld.worldSeed = data.metadata.seed ?? 8888;
    stagingWorld.birthOrdinal = data.birthOrdinal ?? 0;

    const stagedSpeed = (data.time.speed === 10 || data.time.speed === 50) ? 5 : (data.time.speed as TimeSpeed);
    const stagedTimeState: TimeState = {
      totalTicks: data.time.totalTicks,
      speed: stagedSpeed,
      clockSchema: 2,
      calendarEpochTick: data.time.clockSchema === 2 ? data.time.calendarEpochTick! : data.time.totalTicks,
      calendarEpochDays: data.time.clockSchema === 2 ? data.time.calendarEpochDays! : (data.time.totalTicks / (data.time.oldTicksPerDay || 20)),
      oldTicksPerDay: data.time.clockSchema === 2 ? data.time.oldTicksPerDay! : 20,
    };
    stagingWorld.timeState = stagedTimeState;
    stagingWorld.setCurrentTick(data.time.totalTicks);


    try {
      for (const ser of data.entities) {
        const ent = stagingWorld.createEntityWithId(ser.id);
        const c = ser.components;

        if (c.pos) {
          const p = new PositionComponent(c.pos.x, c.pos.y, c.pos.speed);
          p.targetX = c.pos.targetX;
          p.targetY = c.pos.targetY;
          stagingWorld.addComponent(ent, p);
        }

        if (c.name) {
          const n = new NameComponent(c.name.name);
          stagingWorld.addComponent(ent, n);
        }

        if (c.race) {
          stagingWorld.addComponent(ent, new RaceComponent(c.race.raceId));
        }

        if (c.realm) {
          const r = new RealmComponent(
            c.realm.realmChainId,
            c.realm.stageIndex,
            c.realm.stageName,
            c.realm.subStageName,
            c.realm.currentQi,
            c.realm.maxQi,
            c.realm.combatPower,
            c.realm.subStageIndex
          );
          r.isBreakingThrough = c.realm.isBreakingThrough;
          r.breakthroughTimer = c.realm.breakthroughTimer ?? 0;
          r.stageAgeDays = c.realm.stageAgeDays ?? 0;
          r.breakthroughBonus = c.realm.breakthroughBonus ?? 0;
          r.lastBreakthroughChance = c.realm.lastBreakthroughChance;
          r.breakthroughAttemptCounter = c.realm.breakthroughAttemptCounter ?? 0;
          stagingWorld.addComponent(ent, r);
        }

        if (c.hp) {
          const h = new HealthComponent(c.hp.max);
          h.current = c.hp.current;
          h.isDead = c.hp.isDead;
          stagingWorld.addComponent(ent, h);
        }

        if (c.life) {
          const l = new LifespanComponent(c.life.currentAge, c.life.maxLifespan);
          l.isElderly = c.life.isElderly;
          stagingWorld.addComponent(ent, l);
        }

        if (c.hunger) {
          const hg = new HungerComponent(c.hunger.current);
          hg.max = c.hunger.max;
          stagingWorld.addComponent(ent, hg);
        }

        if (c.tech) {
          stagingWorld.addComponent(
            ent,
            new CultivationTechniqueComponent(
              c.tech.techniqueId,
              c.tech.techniqueName,
              c.tech.tier ?? 1,
              c.tech.element ?? 'vo_dinh',
              c.tech.description ?? '',
              c.tech.source ?? 'co_duyen',
              c.tech.sourceName ?? 'Kỳ ngộ tình cờ',
              c.tech.masteryLevel ?? 'nhap_mon',
              c.tech.masteryExp ?? 0
            )
          );
        }

        if (c.state) {
          stagingWorld.addComponent(ent, new CharacterStateComponent(c.state.state, c.state.direction));
        }

        if (c.anim) {
          const an = new AnimationComponent(c.anim.configId);
          an.currentClip = c.anim.currentClip;
          an.frameIndex = c.anim.frameIndex;
          stagingWorld.addComponent(ent, an);
        }

        if (c.traits) {
          stagingWorld.addComponent(ent, new TraitsComponent(c.traits.innateTraits, c.traits.techniqueTraits, c.traits.trainingTraits));
        }

        if (c.comp) {
          const cp = new ComprehensionComponent(c.comp.current);
          cp.max = c.comp.max;
          stagingWorld.addComponent(ent, cp);
        }

        if (c.root) {
          const sr = new SpiritualRootComponent(
            c.root.isAwakened,
            c.root.rootType as SpiritualRootType,
            c.root.gradeName,
            c.root.elements,
            c.root.purity
          );
          if (c.root.awakenedAge !== undefined) {
            sr.awakenedAge = c.root.awakenedAge;
          }
          stagingWorld.addComponent(ent, sr);
        }

        if (c.needs) {
          const nd = new MortalNeedsComponent(c.needs.thirst, c.needs.sleep, c.needs.recreation);
          nd.cookedMealCount = c.needs.cookedMealCount;
          nd.rawFoodCount = c.needs.rawFoodCount;
          stagingWorld.addComponent(ent, nd);
        }

        if (c.sched) {
          const sc = new DailyScheduleComponent();
          sc.currentActivity = c.sched.currentActivity;
          sc.preferredJob = c.sched.preferredJob;
          sc.chronotypeOffset = c.sched.chronotypeOffset;
          sc.homeBuildingEntityId = c.sched.homeBuildingEntityId;
          stagingWorld.addComponent(ent, sc);
        }

        if (c.child) {
          const ch = new ChildcareComponent(c.child.isChild);
          ch.guardianEntityId = c.child.guardianEntityId;
          ch.childrenEntityIds = c.child.childrenEntityIds ?? [];
          stagingWorld.addComponent(ent, ch);
        }

        if (c.history) {
          const hi = new CharacterHistoryComponent();
          hi.records = c.history.records;
          stagingWorld.addComponent(ent, hi);
        }

        const isAnimalOrCarcass = Boolean(c.animal || c.animalCarcass);

        if (c.personality) {
          stagingWorld.addComponent(ent, new ResidentPersonalityComponent(c.personality.sociability, c.personality.diligence, c.personality.curiosity, c.personality.ambition));
        }
        if (c.social) {
          const soc = new SocialRelationshipComponent(c.social.relationships, c.social.cooldowns?.entries, c.social.bondHistory, c.social.bondEpisodeCounter ?? 0);
          soc.rescueEpisodeCounter = c.social.rescue?.episodeCounter ?? 0;
          soc.rescueEvidence = (c.social.rescue?.entries ?? []).map((entry: any) => ({ ...entry }));
          soc.pruneExpiredCooldowns(stagingWorld.calendarDaysAtTick());
          stagingWorld.addComponent(ent, soc);
        } else if (!isAnimalOrCarcass) {
          stagingWorld.addComponent(ent, new SocialRelationshipComponent());
        }

        if (c.memory) {
          const mem = new MemoryComponent(c.memory.memories);
          stagingWorld.addComponent(ent, mem);
        } else if (!isAnimalOrCarcass) {
          stagingWorld.addComponent(ent, new MemoryComponent());
        }

        if (c.stats) {
          const st = new CombatStatsComponent(
            c.stats.baseAtk,
            c.stats.defense,
            c.stats.armor,
            c.stats.attackSpeed,
            c.stats.critRate,
            c.stats.dodgeRate,
            c.stats.critDamage,
            c.stats.attackRange,
            c.stats.isHostile ?? false
          );
          const rawBuffMult = c.stats.buffDamageMultiplier;
          const rawBuffTimer = c.stats.buffTimer;
          st.buffDamageMultiplier = (typeof rawBuffMult === 'number' && Number.isFinite(rawBuffMult) && rawBuffMult >= 0)
            ? rawBuffMult
            : 1.0;
          st.buffTimer = (typeof rawBuffTimer === 'number' && Number.isFinite(rawBuffTimer) && rawBuffTimer >= 0)
            ? rawBuffTimer
            : 0;
          if (st.buffTimer <= 0) {
            st.buffTimer = 0;
            st.buffDamageMultiplier = 1.0;
          }
          stagingWorld.addComponent(ent, st);
        }

        if (c.equip) {
          const eq = new EquipmentComponent();
          if (c.equip.mainHandId && WEAPON_DEFINITIONS[c.equip.mainHandId]) {
            eq.mainHand = WEAPON_DEFINITIONS[c.equip.mainHandId];
          }
          if (c.equip.offHandId && WEAPON_DEFINITIONS[c.equip.offHandId]) {
            eq.offHand = WEAPON_DEFINITIONS[c.equip.offHandId];
          }
          if (c.equip.workToolId && TOOL_DEFINITIONS[c.equip.workToolId]) {
            eq.workTool = TOOL_DEFINITIONS[c.equip.workToolId];
          }
          if (c.equip.bodyArmorId && ARMOR_DEFINITIONS[c.equip.bodyArmorId]) {
            eq.bodyArmor = ARMOR_DEFINITIONS[c.equip.bodyArmorId];
          }
          if (c.equip.artifactId && ARTIFACT_DEFINITIONS[c.equip.artifactId]) {
            eq.artifact = ARTIFACT_DEFINITIONS[c.equip.artifactId];
          }
          stagingWorld.addComponent(ent, eq);
        }

        if (c.inv) {
          const iv = new InventoryComponent();
          for (const item of c.inv.pills) {
            const pDef = PILL_DEFINITIONS[item.pillId];
            if (pDef) {
              iv.addPill(pDef, item.count);
            }
          }
          stagingWorld.addComponent(ent, iv);
        }

        if (c.treasureChest) {
          const chest = new TreasureChestComponent(c.treasureChest.loot.map((item: { pillId: string; count: number }) => ({ ...item })));
          chest.opened = c.treasureChest.opened;
          stagingWorld.addComponent(ent, chest);
        }

        if (c.plant) {
          const pl = new PlantComponent(c.plant.speciesId, c.plant.category, c.plant.tier ?? 1, c.plant.stage);
          pl.growthProgress = c.plant.growthProgress;
          pl.ageDays = c.plant.ageDays ?? 0;
          pl.qiAccumulated = c.plant.qiAccumulated ?? 0;
          pl.isSpiritualized = c.plant.isSpiritualized ?? false;
          pl.hasFruit = c.plant.hasFruit;
          pl.fruitRegrowDaysRemaining = c.plant.fruitRegrowDaysRemaining ?? 0;
          pl.maxWood = c.plant.maxWood !== undefined ? c.plant.maxWood : (PLANT_DEFINITIONS[c.plant.speciesId]?.woodYield ?? (c.plant.category === 'tree' ? 20 : 0));
          pl.woodRemaining = c.plant.woodRemaining !== undefined ? c.plant.woodRemaining : pl.maxWood;
          pl.woodRegrowDaysRemaining = c.plant.woodRegrowDaysRemaining ?? 0;
          stagingWorld.addComponent(ent, pl);
        }

        if (c.bld) {
          const bd = new BuildingComponent(
            c.bld.buildingType,
            c.bld.factionId ?? '',
            c.bld.name,
            c.bld.widthTiles,
            c.bld.heightTiles,
            c.bld.maxDurability,
            c.bld.interval ?? 10,
            c.bld.settlementId,
            c.bld.isRuins ?? false,
            c.bld.isUnderConstruction ?? false
          );
          bd.currentDurability = c.bld.currentDurability;
          bd.level = c.bld.level ?? 1;
          bd.occupantEntityId = c.bld.occupantEntityId ?? null;
          bd.timer = c.bld.timer ?? 0;
          bd.doorSide = c.bld.doorSide ?? 'south';
          stagingWorld.addComponent(ent, bd);
        }

        if (c.insideBuilding && stagingWorld.hasComponent(ent, PositionComponent)) {
          stagingWorld.addComponent(ent, new InsideBuildingComponent(c.insideBuilding.buildingEntityId));
        }

        if (c.constructionSite) {
          const cs = new ConstructionSiteComponent(
            c.constructionSite.requiredWorkTicks,
            c.constructionSite.payerFactionId ?? c.bld?.factionId ?? '',
            c.constructionSite.settlementId ?? c.bld?.settlementId ?? '',
            c.constructionSite.reservedResources,
            c.constructionSite.status ?? 'under_construction'
          );
          cs.completedWorkTicks = c.constructionSite.completedWorkTicks ?? 0;
          cs.assignedWorkerIds = c.constructionSite.assignedWorkerIds ?? [];
          cs.founderEntityId = c.constructionSite.founderEntityId;
          stagingWorld.addComponent(ent, cs);
        }

        if (c.faction) {
          const fc = new FactionComponent(
            c.faction.factionId,
            c.faction.name,
            c.faction.type ?? 'sect',
            c.faction.alignment ?? 'righteous',
            c.faction.color,
            c.faction.territoryRadius ?? 16
          );
          fc.rank = c.faction.rank ?? 'cuu_pham';
          fc.leaderEntityId = c.faction.leaderEntityId ?? null;
          fc.founderEntityId = c.faction.founderEntityId ?? fc.leaderEntityId ?? null;
          fc.foundedYear = c.faction.foundedYear ?? 1;
          fc.foundedTotalDays = c.faction.foundedTotalDays ?? 0;
          fc.members = new Set(c.faction.members ?? []);
          fc.prestige = c.faction.prestige ?? 0;
          fc.stability = c.faction.stability ?? 75;
          fc.developmentStage = c.faction.developmentStage ?? (fc.type === 'holy_land' || fc.type === 'kingdom' ? 3 : fc.type === 'village' || fc.type === 'sect' ? 2 : 1);
          fc.upgradeEligibleSinceDays = c.faction.upgradeEligibleSinceDays ?? null;
          fc.declineSinceDays = c.faction.declineSinceDays ?? null;
          fc.herbStock = c.faction.herbStock ?? 5;
          fc.pillStock = c.faction.pillStock ?? 2;
          fc.spiritStones = c.faction.spiritStones ?? 20;
          if (c.faction.foodStock !== undefined) fc.foodStock = c.faction.foodStock;
          if (c.faction.woodStock !== undefined) fc.woodStock = c.faction.woodStock;
          if (c.faction.stoneStock !== undefined) fc.stoneStock = c.faction.stoneStock;
          if (c.faction.treasury !== undefined) fc.treasury = c.faction.treasury;
          if (c.faction.taxRate !== undefined) fc.taxRate = c.faction.taxRate;
          if (c.faction.reservedResources) fc.reservedResources = { ...c.faction.reservedResources };
          if (Array.isArray(c.faction.settlementIds)) fc.settlementIds = [...c.faction.settlementIds];
          if (c.faction.capitalSettlementId !== undefined) fc.capitalSettlementId = c.faction.capitalSettlementId;
          if (c.faction.suzerainFactionId !== undefined) fc.suzerainFactionId = c.faction.suzerainFactionId;
          if (Array.isArray(c.faction.vassalFactionIds)) fc.vassalFactionIds = [...c.faction.vassalFactionIds];
          if (Array.isArray(c.faction.protectedSettlementIds)) fc.protectedSettlementIds = [...c.faction.protectedSettlementIds];
          fc.hasBeenPopulated = c.faction.hasBeenPopulated ?? fc.members.size > 0;
          stagingWorld.addComponent(ent, fc);
        }

        if (c.member) {
          const mb = new MemberComponent(
            c.member.factionId,
            c.member.role,
            c.member.loyalty ?? 70,
            c.member.joinedDays ?? 0,
            c.member.intentReason ?? 'Gia nhập thế lực'
          );
          mb.contribution = c.member.contribution ?? 0;
          mb.leaveCooldownUntilDays = c.member.leaveCooldownUntilDays ?? 0;
          stagingWorld.addComponent(ent, mb);
        }

        if (c.territory) {
          stagingWorld.addComponent(
            ent,
            new TerritoryCenterComponent(
              c.territory.factionId,
              c.territory.radiusPixels,
              c.territory.color,
              c.territory.factionName ?? '',
              c.territory.settlementId,
              c.territory.layerType ?? 'sect'
            )
          );
        }

        if (c.settlement) {
          const sc = new SettlementComponent(
            c.settlement.settlementId,
            c.settlement.name,
            c.settlement.settlementType ?? 'village',
            c.settlement.ownerFactionId ?? '',
            c.settlement.radiusPixels ?? 16 * 18
          );
          sc.protectorFactionId = c.settlement.protectorFactionId ?? null;
          sc.localLeaderEntityId = c.settlement.localLeaderEntityId ?? null;
          sc.residentIds = new Set(c.settlement.residentIds ?? []);
          sc.housingCapacity = c.settlement.housingCapacity ?? 0;
          sc.waterAccess = c.settlement.waterAccess ?? false;
          sc.Prosperity = c.settlement.Prosperity ?? 50;
          stagingWorld.addComponent(ent, sc);
        }

        if (c.residence) {
          const rc = new ResidenceComponent(
            c.residence.settlementId,
            c.residence.factionId,
            c.residence.homeBuildingEntityId ?? null,
            c.residence.joinedDays ?? 0
          );
          if (c.residence.homeRole) {
            rc.homeRole = c.residence.homeRole;
          }
          stagingWorld.addComponent(ent, rc);
        }

        if (c.foundingIntent) {
          const fi = new FoundingIntentComponent(
            c.foundingIntent.intentType ?? 'hamlet',
            c.foundingIntent.stage ?? 'intent',
            c.foundingIntent.reason ?? 'Khởi dựng cơ nghiệp',
            c.foundingIntent.timeoutSeconds ?? 60,
            c.foundingIntent.participantIds ?? []
          );
          fi.targetPos = c.foundingIntent.targetPos ?? null;
          fi.reservedResources = c.foundingIntent.reservedResources ?? {};
          fi.resourcesReserved = c.foundingIntent.resourcesReserved ?? false;
          fi.taskId = c.foundingIntent.taskId ?? null;
          fi.elapsedSeconds = c.foundingIntent.elapsedSeconds ?? 0;
          fi.cancelReason = c.foundingIntent.cancelReason;
          stagingWorld.addComponent(ent, fi);
        }

        if (c.corpse) {
          const cp = new CorpseComponent(
            c.corpse.deceasedName,
            c.corpse.raceId,
            c.corpse.realmStageIndex,
            c.corpse.realmStageName,
            c.corpse.deathDay,
            c.corpse.deathMonth,
            c.corpse.deathYear,
            c.corpse.deathReason,
            c.corpse.items
          );
          // Save cũ đã phát tang chế lúc tạo thi thể: không phát lại.
          cp.socialDeathProcessed = c.corpse.socialDeathProcessed ?? true;
          cp.remainingDays = c.corpse.remainingDays;
          cp.totalDays = c.corpse.totalDays;
          cp.isBeingCarried = c.corpse.isBeingCarried;
          cp.carriedByEntityId = c.corpse.carriedByEntityId;
          cp.isBuried = c.corpse.isBuried;
          stagingWorld.addComponent(ent, cp);
        }

        if (c.grave) {
          const gr = new GraveComponent(
            c.grave.deceasedName,
            c.grave.raceId,
            c.grave.realmStageIndex,
            c.grave.realmStageName,
            c.grave.buriedByName,
            c.grave.buriedByEntityId,
            c.grave.burialDay,
            c.grave.burialMonth,
            c.grave.burialYear,
            c.grave.burialGoods
          );
          gr.remainingDays = c.grave.remainingDays;
          gr.totalDays = c.grave.totalDays;
          stagingWorld.addComponent(ent, gr);
        }

        if (c.loot) {
          const lt = new DroppedLootComponent(
            c.loot.ownerName,
            c.loot.realmStageName,
            c.loot.droppedDay,
            c.loot.droppedMonth,
            c.loot.droppedYear,
            c.loot.items
          );
          stagingWorld.addComponent(ent, lt);
        }

        if (c.graveyardZone) {
          const gz = new GraveyardZoneComponent(
            c.graveyardZone.factionId,
            c.graveyardZone.centerX,
            c.graveyardZone.centerY,
            c.graveyardZone.radiusTiles
          );
          gz.occupiedPlots = c.graveyardZone.occupiedPlots ?? [];
          stagingWorld.addComponent(ent, gz);
        }

        if (c.godDecree) {
          stagingWorld.addComponent(ent, new GodDecreeComponent(c.godDecree.decree));
        }

        // Đảm bảo tương thích với bản lưu cũ: gắn bộ não AI 3 tầng nếu thiếu
        if (c.race) {
          const family = new FamilyComponent(c.family?.sex === 'female' ? 'female' : c.family?.sex === 'male' ? 'male' : ent % 2 === 0 ? 'female' : 'male');
          family.parentIds = Array.isArray(c.family?.parentIds) ? c.family.parentIds : [];
          family.birthCooldown = Number.isFinite(c.family?.birthCooldown) ? Math.max(0, c.family.birthCooldown) : 360;
          stagingWorld.addComponent(ent, family);
          const raceId = stagingWorld.getComponent(ent, RaceComponent)!.raceId;
          const a = c.appearance;
          stagingWorld.addComponent(ent, a && typeof a.appearanceId === 'string' && typeof a.speciesId === 'string' && typeof a.bodyProfile === 'string'
            ? new AppearanceComponent(a.appearanceId, a.speciesId, a.bodyProfile)
            : AppearanceRegistry.instance.choose(raceId, inferSpecies(raceId, stagingWorld.getComponent(ent, NameComponent)?.name ?? ''), () => ((Math.imul(ent, 2654435761) >>> 0) / 4294967296)));
        }
        if (c.race && !stagingWorld.hasComponent(ent, AIStrategicBrainComponent)) {
          const brain = new AIStrategicBrainComponent(c.aiBrain?.currentGoal ?? 'WANDER_SERENDIPITY');
          if (c.aiBrain?.goalReason) brain.goalReason = c.aiBrain.goalReason;
          if (c.aiBrain?.targetCorpseEntityId !== undefined) {
            brain.targetCorpseEntityId = c.aiBrain.targetCorpseEntityId;
          }
          stagingWorld.addComponent(ent, brain);

          const planner = new AIPlannerComponent();
          if (c.aiPlanner) {
            planner.planRevision = Number.isFinite(c.aiPlanner.planRevision) ? c.aiPlanner.planRevision : 0;
            planner.currentPlanGoal = c.aiPlanner.currentPlanGoal ?? null;
            planner.steps = Array.isArray(c.aiPlanner.steps) ? c.aiPlanner.steps.map((s: any) => ({ ...s })) : [];
            planner.currentStepIndex = Number.isFinite(c.aiPlanner.currentStepIndex) ? c.aiPlanner.currentStepIndex : 0;
            planner.planStatus = c.aiPlanner.planStatus ?? 'idle';
            planner.stepElapsedTimer = Number.isFinite(c.aiPlanner.stepElapsedTimer) ? c.aiPlanner.stepElapsedTimer : 0;
          }
          stagingWorld.addComponent(ent, planner);
          stagingWorld.addComponent(ent, new AIBehaviorTreeComponent());
        }

        hydrateOrMigrateEntityTraitTalent(
          stagingWorld,
          ent,
          c,
          stagingWorld.worldSeed,
          data.time.totalTicks
        );

        const hydratedAnimal = hydrateEntityAnimalComponents(stagingWorld, ent, c);
        hydrateProfessions(stagingWorld, ent, c);
        if (hydratedAnimal) {
          AnimalSaveCodec.assertNoCultivationComponents(stagingWorld, ent);
        }
      }
    } catch (err) {

      // Khôi phục bộ đếm ID nếu giai đoạn dựng entity tạm thời thất bại
      setNextEntityId(prevNextEntityId);
      throw err;
    }

    // ========================================================
    // GIAI ĐOẠN 2: CAM KẾT VÀO THẾ GIỚI HIỆN TẠI (COMMIT PHASE)
    // Tới đây, toàn bộ dữ liệu bản lưu đã được kiểm tra và dựng tạm thành công 100%.
    // Giờ mới bắt đầu thay thế trạng thái thế giới đang chơi.
    // ========================================================

    // 2.1 Cấp phát lại vùng chứa bản đồ nếu khác kích thước với bản lưu (không gọi initNewWorld để tránh ghi đè seed/template/season)
    if (engine.worldMap && (engine.worldMap.width !== savedW || engine.worldMap.height !== savedH)) {
      if (typeof engine.resizeWorldContainers === 'function') {
        engine.resizeWorldContainers(savedW, savedH);
      } else if (typeof engine.initNewWorld === 'function') {
        engine.initNewWorld({
          customDim: savedW,
          name: data.metadata.name,
          template: (data.metadata.templateId as any) || 'thap_van_dai_son',
          seed: data.metadata.seed ?? 8888
        });
      }
    }

    // 2.2 Dọn dẹp toàn bộ trạng thái thế giới cũ (hàng đợi độ kiếp, thánh chỉ, đột phá, ngoại giao, thời tiết, AI task board, v.v.)
    if (typeof engine.resetWorldState === 'function') {
      engine.resetWorldState();
    } else {
      engine.world?.clearEntities();
      engine.spatialGrid?.clear();
      engine.tribulationSystem?.clear();
      engine.threeTierAISystem?.reset();
      engine.cultivationSystem?.reset();
      engine.diplomacySystem?.clear();
      engine.weatherSystem?.reset();
      engine.socialInteractionSystem?.reset();
      SmartObjectManager.getInstance().clear();
      CommunityTaskBoard.getInstance().clear();
      AStarPathfinder.invalidateBuildingCache();
    }

    // 2.3 Cập nhật thuộc tính ngữ cảnh thế giới từ bản lưu (sau khi đã cấp phát và dọn dẹp)
    engine.worldName = data.metadata.name;
    engine.worldTemplate = data.metadata.templateId || 'thap_van_dai_son';
    engine.worldSeed = data.metadata.seed ?? 8888;
    if ('_worldName' in engine) (engine as any)._worldName = engine.worldName;
    if ('_worldTemplate' in engine) (engine as any)._worldTemplate = engine.worldTemplate;
    if ('_worldSeed' in engine) (engine as any)._worldSeed = engine.worldSeed;

    // 2.4 Cập nhật gạch WorldMap
    if (engine.worldMap) {
      for (let i = 0; i < stagedMapTiles.length; i++) {
        const staged = stagedMapTiles[i];
        const tile = engine.worldMap.getTileByIndex(i);
        if (tile) {
          tile.terrain = staged.terrain;
          tile.elevation = staged.elevation;
          tile.moisture = staged.moisture;
          tile.temperature = staged.temperature;
          tile.qiDensity = staged.qiDensity;
          tile.variant = staged.variant;
          tile.plantGrowth = staged.plantGrowth;
        }
      }
      engine.worldMap.setDirty(true);
    }

    // 2.5 Cập nhật gạch QiGrid
    if (engine.qiGrid) {
      for (let i = 0; i < stagedQiTiles.length; i++) {
        const staged = stagedQiTiles[i];
        const qTile = engine.qiGrid.getTileByIndex(i);
        if (qTile) {
          qTile.density = staged.density;
          qTile.tier = staged.tier;
          qTile.dominantElement = staged.dominantElement;
          qTile.isSpiritVein = staged.isSpiritVein;
          qTile.veinRate = staged.veinRate;
        }
      }
      engine.qiGrid.rebuildVeinIndices();
    }

    // 2.6 Khôi phục Camera
    if (engine.camera && data.camera) {
      engine.camera.x = data.camera.x;
      engine.camera.y = data.camera.y;
      engine.camera.zoom = data.camera.zoom;
    }

    // 2.7 Khôi phục TimeManager TRƯỚC WeatherSystem để lịch mùa chính xác
    if (engine.timeManager && data.time) {
      engine.timeManager.loadState(stagedTimeState);
    }

    // 2.8 Khôi phục trạng thái Thời tiết
    if (engine.weatherSystem) {
      engine.weatherSystem.restoreState(data.weather);
    }

    // 2.9 Thay thế toàn bộ thực thể từ stagingWorld sang engine.world
    if (typeof (engine.world as any).replaceEntitiesFrom === 'function') {
      (engine.world as any).replaceEntitiesFrom(stagingWorld);
    } else {
      engine.world.clearEntities();
      for (const ent of stagingWorld.query([])) {
        engine.world.createEntityWithId(ent);
      }
    }

    // 2.10 Khôi phục danh sách Lôi Kiếp đang diễn ra (activeTribulations) & Quan hệ Ngoại giao (diplomacy + treaties)
    if (engine.tribulationSystem) {
      engine.tribulationSystem.restoreTribulations(data.activeTribulations);
      const activeIds = new Set((data.activeTribulations ?? []).map(t => t.entityId));
      // Nếu bản lưu cũ có thực thể đánh dấu isBreakingThrough nhưng không có trong activeTribulations,
      // giải phóng cờ isBreakingThrough để thực thể không bị kẹt bất tử vĩnh viễn
      const realms = engine.world.query([RealmComponent]);
      for (const ent of realms) {
        const r = engine.world.getComponent(ent, RealmComponent);
        if (r && r.isBreakingThrough && !activeIds.has(ent)) {
          r.isBreakingThrough = false;
        }
      }
    }

    if (engine.diplomacySystem) {
      engine.diplomacySystem.restoreRelations(data.diplomacy);
      engine.diplomacySystem.restoreTreaties(data.treaties, engine.world);
    }

    // 2.11 Đặt lại bộ đếm ID kế tiếp, di chuyển tương thích bản lưu cũ & Tái cấu trúc SpatialGrid
    let calculatedNextId: number;
    if (data.nextEntityId !== undefined && typeof data.nextEntityId === 'number' && Number.isInteger(data.nextEntityId)) {
      calculatedNextId = data.nextEntityId;
    } else {
      let maxLoadedId = 0;
      for (const ent of data.entities) {
        if (typeof ent.id === 'number' && ent.id > maxLoadedId) {
          maxLoadedId = ent.id;
        }
      }
      calculatedNextId = Math.max(1000, maxLoadedId + 1);
    }
    setNextEntityId(calculatedNextId);
    FactionFactory.syncCounterFromWorld(engine.world);
    this.migrateLegacyFactionAndSettlementState(engine.world);

    // Điều hòa tài nguyên đặt cọc của thế lực theo các công trường thi công thực tế đang dở
    const activeReservedPerFaction = new Map<string, ResourceBundle>();
    for (const bEnt of engine.world.query([BuildingComponent, ConstructionSiteComponent])) {
      const site = engine.world.getComponent(bEnt, ConstructionSiteComponent)!;
      const bComp = engine.world.getComponent(bEnt, BuildingComponent)!;
      if (bComp.isUnderConstruction && !site.isCompleted && site.payerFactionId) {
        let acc = activeReservedPerFaction.get(site.payerFactionId);
        if (!acc) {
          acc = { food: 0, wood: 0, stone: 0, spiritStones: 0 };
          activeReservedPerFaction.set(site.payerFactionId, acc);
        }
        if (site.reservedResources) {
          acc.food = (acc.food ?? 0) + (site.reservedResources.food ?? 0);
          acc.wood = (acc.wood ?? 0) + (site.reservedResources.wood ?? 0);
          acc.stone = (acc.stone ?? 0) + (site.reservedResources.stone ?? 0);
          acc.spiritStones = (acc.spiritStones ?? 0) + (site.reservedResources.spiritStones ?? 0);
        }
      }
    }

    for (const id of engine.world.query([FactionComponent])) {
      const faction = engine.world.getComponent(id, FactionComponent)!;
      const activeRes = activeReservedPerFaction.get(faction.factionId) ?? { food: 0, wood: 0, stone: 0, spiritStones: 0 };
      // Hoàn trả phần tài nguyên đặt trước vượt quá các công trường đang thi công thực tế
      if (faction.reservedResources) {
        const excessWood = Math.max(0, (faction.reservedResources.wood ?? 0) - (activeRes.wood ?? 0));
        const excessStone = Math.max(0, (faction.reservedResources.stone ?? 0) - (activeRes.stone ?? 0));
        const excessFood = Math.max(0, (faction.reservedResources.food ?? 0) - (activeRes.food ?? 0));
        faction.woodStock += excessWood;
        faction.stoneStock += excessStone;
        faction.foodStock += excessFood;
      }
      faction.reservedResources = activeRes;
    }

    if (engine.spatialGrid) {
      const posEntities = engine.world.query([PositionComponent]);
      const sItems = [];
      for (let i = 0; i < posEntities.length; i++) {
        const e = posEntities[i];
        const p = engine.world.getComponent(e, PositionComponent)!;
        sItems.push({ id: e, x: p.x, y: p.y });
      }
      engine.spatialGrid.rebuild(sItems);
    }

    // 2.12 Khôi phục công việc cho các công trường đang thi công & Đồng bộ Smart Objects
    CommunityTaskBoard.getInstance().restoreTasksFromConstructionSites(engine.world);
    FactionFactory.reconcileHomes(engine.world);
    for (const id of engine.world.query([FoundingIntentComponent])) {
      const intent = engine.world.getComponent(id, FoundingIntentComponent)!;
      if ((intent.taskId || intent.stage === 'building') &&
          (!intent.taskId || !CommunityTaskBoard.getInstance().getTask(intent.taskId))) {
        engine.world.removeComponent(id, FoundingIntentComponent);
      }
    }
    SmartObjectManager.getInstance().syncFromWorld(engine.world);
    const smartObjects = SmartObjectManager.getInstance();
    for (const residentId of engine.world.query([InsideBuildingComponent])) {
      const inside = engine.world.getComponent(residentId, InsideBuildingComponent)!;
      const object = smartObjects.getAllObjects().find(item => item.entityId === inside.buildingEntityId);
      const slot = object?.slots.find(candidate => candidate.occupantEntityId === null);
      if (object && slot?.index !== undefined && object.affordances.has('sleep_rest')) {
        smartObjects.reserve(object.id, residentId, slot.index, 'sleep_rest');
      } else {
        const residentPos = engine.world.getComponent(residentId, PositionComponent);
        const buildingPos = engine.world.getComponent(inside.buildingEntityId, PositionComponent);
        const building = engine.world.getComponent(inside.buildingEntityId, BuildingComponent);
        if (residentPos && buildingPos && building) {
          residentPos.x = buildingPos.x + building.widthTiles * 8;
          residentPos.y = buildingPos.y + building.heightTiles * 16 + 10;
          engine.world.removeComponent(residentId, InsideBuildingComponent);
        }
      }
    }
    FactionFactory.syncCounterFromWorld(engine.world);

    // 2.13 Log console nạp thành công
    console.log(`✅ Nạp hoàn tất! Tổng cộng ${engine.world.getEntityCount()} thực thể đã hồi sinh.`);
  }

  /**
   * Chuẩn hóa và khôi phục dữ liệu từ bản lưu cũ (Legacy Save Migration):
   * - Suy diễn SettlementComponent và ResidenceComponent cho các thôn/làng cũ chưa có
   * - Sửa lại lỗi bản lưu cũ khi làng bị gán nhầm rank = 'thanh_dia'
   * - Đồng bộ hai chiều giữa MemberComponent và FactionComponent.members
   */
  public static migrateLegacyFactionAndSettlementState(world: ECSWorld): void {
    const factions = world.query([FactionComponent]);
    const buildings = world.query([PositionComponent, BuildingComponent]);

    for (const fEnt of factions) {
      const fc = world.getComponent(fEnt, FactionComponent)!;

      // 1. Sửa lỗi bản lưu cũ: thế lực dân sinh (hamlet/village/kingdom) không bao giờ mang rank 'thanh_dia',
      // và các tông môn / thánh địa từ bản lưu cũ bị lạm phát lên 'thanh_dia' khi chưa đủ 30 đệ tử sẽ được chuẩn hóa lại
      if (isCivilFactionType(fc.type) && fc.rank === 'thanh_dia') {
        fc.rank = fc.type === 'kingdom' ? 'nhat_pham' : 'cuu_pham';
      } else if (!isCivilFactionType(fc.type) && (fc.rank === 'thanh_dia' || fc.type === 'holy_land') && fc.members.size < 30) {
        fc.type = 'sect';
        fc.rank = fc.members.size >= 15 ? 'nhat_pham' : fc.members.size >= 8 ? 'tam_pham' : 'cuu_pham';
      }

      // 2. Nếu thế lực dân sinh từ bản lưu cũ chưa có SettlementComponent, tự suy diễn từ công trình campfire/sect_hall
      if (isCivilFactionType(fc.type) && fc.settlementIds.length === 0) {
        let corePos: PositionComponent | null = null;
        for (const bEnt of buildings) {
          const bComp = world.getComponent(bEnt, BuildingComponent)!;
          if (bComp.factionId === fc.factionId) {
            corePos = world.getComponent(bEnt, PositionComponent)!;
            if (bComp.buildingType === 'campfire' || bComp.buildingType === 'sect_hall') {
              break;
            }
          }
        }

        if (corePos) {
          const { settlementId } = FactionFactory.createSettlement(world, {
            name: fc.name,
            settlementType: fc.type === 'hamlet' ? 'hamlet' : 'village',
            ownerFactionId: fc.factionId,
            x: corePos.x,
            y: corePos.y,
            radiusTiles: fc.territoryRadius,
            localLeaderEntityId: fc.leaderEntityId
          });
          fc.settlementIds.push(settlementId);
          fc.capitalSettlementId = settlementId;

          // Liên kết các công trình của thế lực vào Settlement vừa tạo
          for (const bEnt of buildings) {
            const bComp = world.getComponent(bEnt, BuildingComponent)!;
            if (bComp.factionId === fc.factionId && !bComp.settlementId) {
              bComp.settlementId = settlementId;
            }
          }

          // Tạo TerritoryCenterComponent cho thôn/làng cũ nếu chưa có
          let hasCenter = false;
          for (const tcEnt of world.query([TerritoryCenterComponent])) {
            const tc = world.getComponent(tcEnt, TerritoryCenterComponent)!;
            if (tc.factionId === fc.factionId) {
              hasCenter = true;
              break;
            }
          }
          if (!hasCenter) {
            const centerEnt = world.createEntity();
            world.addComponent(centerEnt, new PositionComponent(corePos.x, corePos.y, 0));
            world.addComponent(
              centerEnt,
              new TerritoryCenterComponent(
                fc.factionId,
                fc.territoryRadius * 16,
                fc.color,
                fc.name,
                settlementId,
                'civil'
              )
            );
          }
        }
      }

      // 3. Đồng bộ thành viên & cư trú hai chiều
      const defaultSettlementId = fc.settlementIds[0];
      for (const mId of [...fc.members]) {
        if (!world.hasComponent(mId, MemberComponent)) {
          const role = mId === fc.leaderEntityId
            ? (fc.type === 'kingdom' ? 'king' : isCivilFactionType(fc.type) ? 'village_head' : 'sect_master')
            : (isCivilFactionType(fc.type) ? 'villager' : 'outer_disciple');
          world.addComponent(mId, new MemberComponent(fc.factionId, role));
        }
        if (isCivilFactionType(fc.type) && defaultSettlementId && !world.hasComponent(mId, ResidenceComponent)) {
          FactionFactory.assignResidence(world, mId, defaultSettlementId, fc.factionId);
        }
      }
    }

    // 4. Đồng bộ chiều ngược lại: mọi thực thể có MemberComponent đều nằm trong FactionComponent.members
    for (const mEnt of world.query([MemberComponent])) {
      const mb = world.getComponent(mEnt, MemberComponent)!;
      if (!mb.factionId) continue;
      const fEnt = FactionFactory.findFactionEntity(world, mb.factionId);
      if (fEnt !== null) {
        const fc = world.getComponent(fEnt, FactionComponent)!;
        fc.members.add(mEnt);
        if (isCivilFactionType(fc.type) && fc.settlementIds[0] && !world.hasComponent(mEnt, ResidenceComponent)) {
          FactionFactory.assignResidence(world, mEnt, fc.settlementIds[0], fc.factionId);
        }
      }
    }
  }

  /**
   * Hiển thị thông báo trạng thái lưu trên màn hình cho người chơi
   */
  public static notifySaveStatus(message: string, isSuccess: boolean = true): void {
    if (typeof document === 'undefined') return;

    // Xóa toast cũ nếu có
    const existingToasts = document.querySelectorAll('.tu-tien-save-toast');
    existingToasts.forEach(el => el.remove());

    const toast = document.createElement('div');
    toast.className = 'interactive-ui tu-tien-save-toast';
    toast.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: ${isSuccess ? 'rgba(15, 81, 50, 0.95)' : 'rgba(132, 32, 41, 0.95)'};
      border: 1px solid ${isSuccess ? '#20c997' : '#ea868f'};
      color: #ffffff;
      padding: 10px 18px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.7);
      z-index: 10000;
      display: flex;
      align-items: center;
      gap: 8px;
      pointer-events: none;
      transition: opacity 0.4s ease, transform 0.4s ease;
      opacity: 1;
      transform: translateY(0);
    `;
    const iconSpan = document.createElement('span');
    iconSpan.textContent = isSuccess ? '💾' : '⚠️';
    const msgSpan = document.createElement('span');
    msgSpan.textContent = message;
    toast.appendChild(iconSpan);
    toast.appendChild(msgSpan);
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(12px)';
      setTimeout(() => toast.remove(), 400);
    }, 2800);
  }

  private static slotSaveQueues: Map<string, Promise<SaveMetadata>> = new Map();
  private static isVisibilityHiddenHandled = false;

  public static resetVisibilityState(): void {
    this.isVisibilityHiddenHandled = false;
  }

  /**
   * Xử lý lưu tự động khi trang chuyển sang trạng thái ẩn (visibilityState === 'hidden').
   * Chỉ kích hoạt đúng một lần cho mỗi lượt chuyển trạng thái hidden.
   * Reset khi trang quay lại trạng thái visible.
   */
  public static async handleVisibilityChange(
    engine: Engine,
    visibilityState: string,
    slotId: string = 'quicksave'
  ): Promise<SaveMetadata | null> {
    if (visibilityState === 'hidden') {
      if (this.isVisibilityHiddenHandled) {
        return null;
      }
      this.isVisibilityHiddenHandled = true;

      if (!engine.isMainMenuOpen && !engine.isPausedByMenu) {
        try {
          const meta = await this.saveSlot(engine, slotId, `${engine.worldName} (Lưu Nhanh)`);
          console.log(`👁️ [Hệ Thống] Đã lưu khi ẩn trang vào slot [${slotId}] lúc ${meta.realDateStr}.`);
          return meta;
        } catch (e: any) {
          console.error('Lỗi khi lưu qua visibilitychange:', e);
          return null;
        }
      }
    } else if (visibilityState === 'visible') {
      this.isVisibilityHiddenHandled = false;
    }
    return null;
  }

  /**
   * Lưu thế giới vào một Slot trong IndexedDB (nén gzip).
   * Sử dụng hàng đợi Promise theo từng slot để ngăn các lần lưu cùng slot chạy chồng lấn
   * hoặc ghi đè ngược thứ tự (bản cũ ghi đè lên bản mới).
   */
  public static saveSlot(engine: Engine, slotId: string, customName?: string): Promise<SaveMetadata> {
    // Chụp snapshot trạng thái thế giới đồng bộ tại thời điểm gọi hàm
    const saveData = this.serializeWorld(engine, customName, slotId);

    const previousPromise = this.slotSaveQueues.get(slotId) || Promise.resolve(null as any);

    const currentPromise = previousPromise
      .catch(() => {}) // Kể cả khi lần lưu trước gặp lỗi, lần lưu sau vẫn tiếp tục
      .then(async () => {
        try {
          // 1. Lưu dữ liệu chi tiết của slot vào IndexedDB (nén gzip)
          await SaveStorage.putSlot(slotId, saveData.metadata, saveData);

          // 2. Cập nhật Index danh sách tóm tắt (nhẹ, an toàn lưu trong localStorage và bộ nhớ)
          try {
            let list = this.listSlots();
            list = list.filter(s => s.id !== slotId);
            list.unshift(saveData.metadata);
            if (typeof localStorage !== 'undefined') {
              localStorage.setItem(SAVE_INDEX_KEY, JSON.stringify(list));
            }
          } catch (idxErr) {
            console.warn(`Ghi index localStorage lỗi, nhưng dữ liệu slot [${slotId}] đã được ghi bền vững:`, idxErr);
          }

          console.log(`💾 Đã lưu thành công vào slot [${slotId}] (IndexedDB)!`);
          return saveData.metadata;
        } catch (e) {
          console.error(`Lỗi khi lưu slot [${slotId}]:`, e);
          throw e;
        }
      });

    this.slotSaveQueues.set(slotId, currentPromise);

    currentPromise
      .finally(() => {
        if (this.slotSaveQueues.get(slotId) === currentPromise) {
          this.slotSaveQueues.delete(slotId);
        }
      })
      .catch(() => {});

    return currentPromise;
  }

  /**
   * Nạp thế giới từ một Slot trong IndexedDB
   */
  public static async loadSlot(engine: Engine, slotId: string): Promise<boolean> {
    try {
      const data = await SaveStorage.getSlot(slotId);
      if (!data) {
        console.warn(`Không tìm thấy dữ liệu cho slot [${slotId}]!`);
        return false;
      }
      this.validateSaveData(data);
      this.deserializeWorld(engine, data);
      return true;
    } catch (e) {
      console.error(`Lỗi khi nạp slot [${slotId}]:`, e);
      return false;
    }
  }

  /**
   * Nạp thế giới đồng bộ (cho test hoặc fallback tức thì)
   */
  public static loadSlotSync(engine: Engine, slotId: string): boolean {
    try {
      const data = SaveStorage.getSyncSlot(slotId);
      if (!data) {
        console.warn(`Không tìm thấy dữ liệu đồng bộ cho slot [${slotId}]!`);
        return false;
      }
      this.validateSaveData(data);
      this.deserializeWorld(engine, data);
      return true;
    } catch (e) {
      console.error(`Lỗi khi nạp slot [${slotId}]:`, e);
      return false;
    }
  }

  /**
   * Xóa một Slot lưu khỏi IndexedDB và danh mục
   */
  public static async deleteSlot(slotId: string): Promise<void> {
    try {
      await SaveStorage.deleteSlot(slotId);
      let list = this.listSlots();
      list = list.filter(s => s.id !== slotId);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(SAVE_INDEX_KEY, JSON.stringify(list));
      }
      console.log(`🗑️ Đã xóa slot [${slotId}] thành công!`);
    } catch (e) {
      console.error(`Lỗi khi xóa slot [${slotId}]:`, e);
      throw e;
    }
  }

  /**
   * Xuất dữ liệu một Slot thành file JSON để người dùng tải về
   */
  public static async exportSlotAsFile(slotId: string): Promise<void> {
    const data = await SaveStorage.getSlot(slotId);
    if (!data) return;

    try {
      const safeName = data.metadata.name.replace(/[^a-zA-Z0-9_\u00C0-\u024F\u1E00-\u1EFF]/g, '_');
      const filename = `TuTien_${safeName}_${slotId}.json`;

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Lỗi khi xuất file:', e);
    }
  }

  /**
   * Nhập dữ liệu từ chuỗi JSON và ghi vào IndexedDB
   */
  public static async importSaveFromJson(jsonString: string): Promise<SaveMetadata> {
    let data: any;
    try {
      data = JSON.parse(jsonString);
    } catch (e: any) {
      throw new Error(`Định dạng tệp không phải JSON hợp lệ: ${e.message}`);
    }

    this.validateSaveData(data);

    // Tạo ID mới cho slot nhập vào và chuẩn hóa các trường metadata
    const slotId = `import_${Date.now()}`;
    const rawName = String(data.metadata.name).trim();
    data.metadata = {
      id: slotId,
      name: `${rawName} (Tải lên)`,
      templateId: typeof data.metadata.templateId === 'string' && data.metadata.templateId.trim() ? data.metadata.templateId.trim() : 'thap_van_dai_son',
      seed: typeof data.metadata.seed === 'number' && Number.isFinite(data.metadata.seed) ? data.metadata.seed : 8888,
      timestamp: typeof data.metadata.timestamp === 'number' && Number.isFinite(data.metadata.timestamp) ? data.metadata.timestamp : Date.now(),
      realDateStr: typeof data.metadata.realDateStr === 'string' && data.metadata.realDateStr.trim() ? data.metadata.realDateStr.trim() : new Date().toLocaleString('vi-VN'),
      inGameDateStr: typeof data.metadata.inGameDateStr === 'string' && data.metadata.inGameDateStr.trim() ? data.metadata.inGameDateStr.trim() : 'Năm 1',
      residentCount: typeof data.metadata.residentCount === 'number' && Number.isFinite(data.metadata.residentCount) ? data.metadata.residentCount : 0,
      cultivatorCount: typeof data.metadata.cultivatorCount === 'number' && Number.isFinite(data.metadata.cultivatorCount) ? data.metadata.cultivatorCount : 0,
      buildingCount: typeof data.metadata.buildingCount === 'number' && Number.isFinite(data.metadata.buildingCount) ? data.metadata.buildingCount : 0,
      version: typeof data.metadata.version === 'string' ? data.metadata.version : CURRENT_SAVE_VERSION
    };

    await SaveStorage.putSlot(slotId, data.metadata, data);
    try {
      let list = this.listSlots();
      list = list.filter(s => s.id !== slotId);
      list.unshift(data.metadata);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(SAVE_INDEX_KEY, JSON.stringify(list));
      }
    } catch (idxErr) {
      console.warn(`Ghi index localStorage lỗi, nhưng dữ liệu import đã được ghi bền vững:`, idxErr);
    }

    return data.metadata;
  }
}
