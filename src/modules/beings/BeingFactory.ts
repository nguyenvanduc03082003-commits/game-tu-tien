import { linkParentAndChild } from '../social/RelationshipService.ts';
import { residentPreferences } from '../ai/brain/ResidentPreferences.ts';
import { FamilyComponent } from './FamilyComponent.ts';
import { AppearanceComponent } from '../appearance/Appearance.ts';
import { AppearanceRegistry, BEAST_SPECIES, ADULT_AGE } from '../appearance/Appearance.ts';
import { ECSWorld } from '../../ecs/World.ts';
import { reviewProfession } from '../professions/ProfessionService.ts';
import { Entity } from '../../ecs/Entity.ts';
import { RACE_DEFINITIONS } from '../../config/races.config.ts';
import { ARCHETYPE_DEFINITIONS } from '../../config/archetypes.config.ts';
import { REALM_CHAINS } from '../../config/realms.config.ts';
import { TalentSeedClass } from '../../config/talent.config.ts';
import { OwnedTrait, RaceId } from '../../config/traits/trait.types.ts';
import {
  PositionComponent,
  NameComponent,
  RaceComponent,
  RealmComponent,
  HealthComponent,
  LifespanComponent,
  HungerComponent,
  CharacterStateComponent,
  AnimationComponent,
  TraitsComponent,
  ComprehensionComponent,
  CharacterHistoryComponent,
  SpiritualRootComponent,
  MortalNeedsComponent,
  DailyScheduleComponent,
  ChildcareComponent
} from './BeingComponents.ts';
import {
  CombatStatsComponent,
  EquipmentComponent
} from '../combat/CombatComponents.ts';
import { InventoryComponent } from '../alchemy/InventoryComponent.ts';
import {
  AIStrategicBrainComponent,
  AIPlannerComponent,
  AIBehaviorTreeComponent
} from '../ai/brain/AIComponents.ts';
import { SocialRelationshipComponent, MemoryComponent } from '../social/SocialComponents.ts';

import { WorldMap } from '../world/WorldMap.ts';
import { TerrainType } from '../../config/terrains.config.ts';
import {
  StatBaselineComponent,
  TalentProfileComponent,
} from '../talent/TalentComponents.ts';
import {
  deriveFounderLineageTags,
  generateTalentBundle,
  getRootGradeName,
  ParentGenerationInfo,
} from '../talent/TalentGenerator.ts';
import { getTraitDefinition } from '../traits/TraitCatalog.ts';
import { rebuildEntityStats } from '../traits/DerivedStatsService.ts';

const HUMAN_SURNAMES = ['Tiêu', 'Lâm', 'Sở', 'Cố', 'Bạch', 'Lý', 'Trần', 'Diệp', 'Vương', 'Hàn'];
const HUMAN_MIDDLES = ['Trường', 'Vô', 'Thanh', 'Mặc', 'Huyền', 'Thiên', 'Tử', 'Băng', 'Vân'];
const HUMAN_NAMES = ['Phong', 'Ca', 'Dao', 'Dạ', 'Ngân', 'Uyên', 'Trần', 'Khuyết', 'Hạo', 'Tuyệt'];

const BEAST_PREFIXES = ['Xích Diễm', 'Hắc Lân', 'U Minh', 'Băng Tinh', 'Kim Sí', 'Thôn Thiên', 'Thanh Phong', 'Lôi Vân', 'Bạch Ngọc', 'Tử Tiêu'];

const DEMON_TITLES = ['Huyết Sát', 'Đoạt Hồn', 'Ma Lệ', 'Cửu U', 'Huyễn Ma', 'Thị Huyết'];

export interface SpawnArchetypeOptions {
  newborn?: boolean;
  speciesId?: string;
  mode?: 'natural' | 'curated';
  parents?: [number, number];
  birthOrdinal?: number;
  forcedSeedClass?: TalentSeedClass;
  customTraits?: string[];
  allowReincarnation?: boolean;
}

export class BeingFactory {
  public static generateName(raceId: string, speciesId?: string): string {
    if (raceId === 'human') {
      const s = HUMAN_SURNAMES[Math.floor(Math.random() * HUMAN_SURNAMES.length)];
      const m = HUMAN_MIDDLES[Math.floor(Math.random() * HUMAN_MIDDLES.length)];
      const n = HUMAN_NAMES[Math.floor(Math.random() * HUMAN_NAMES.length)];
      return `${s} ${m} ${n}`;
    } else if (raceId === 'beast') {
      const p = BEAST_PREFIXES[Math.floor(Math.random() * BEAST_PREFIXES.length)];
      const s = (BEAST_SPECIES.find(([id])=>id===speciesId) ?? BEAST_SPECIES[Math.floor(Math.random()*BEAST_SPECIES.length)])[1];
      return `${p} ${s}`;
    } else {
      const t = DEMON_TITLES[Math.floor(Math.random() * DEMON_TITLES.length)];
      const id = Math.floor(Math.random() * 900 + 100);
      return `${t} #${id}`;
    }
  }

  private static extractParentInfo(world: ECSWorld, parentId: number): ParentGenerationInfo {
    const profile = world.getComponent(parentId, TalentProfileComponent);
    const traits = world.getComponent(parentId, TraitsComponent);
    const raceComp = world.getComponent(parentId, RaceComponent);
    const appComp = world.getComponent(parentId, AppearanceComponent);
    const ownedTraitIds = traits
      ? traits.entries.map(e => e.id)
      : [];
    const lineageTags = profile && profile.lineageTags.length > 0
      ? [...profile.lineageTags]
      : deriveFounderLineageTags(
          (raceComp?.raceId ?? 'human') as RaceId,
          appComp?.speciesId
        );
    return {
      entityId: parentId,
      profile,
      ownedTraitIds,
      lineageTags,
    };
  }

  public static spawnFromArchetype(
    world: ECSWorld,
    archetypeId: string,
    x: number,
    y: number,
    options: SpawnArchetypeOptions = {}
  ): Entity {
    const archetype = ARCHETYPE_DEFINITIONS.find(a => a.id === archetypeId);
    if (!archetype) throw new RangeError(`Mẫu cư dân không hợp lệ: ${archetypeId}`);
    const race = RACE_DEFINITIONS[archetype.raceId] || RACE_DEFINITIONS['human'];
    const realmChain = REALM_CHAINS[race.realmsChainId] || REALM_CHAINS['human_realms'];

    const entity = world.createEntity();
    residentPreferences(entity, world);
    const familyComp = new FamilyComponent();
    if (options.parents) {
      familyComp.parentIds = [options.parents[0], options.parents[1]];
    }
    world.addComponent(entity, familyComp);

    const birthOrdinal = options.birthOrdinal ?? ++world.birthOrdinal;
    if (options.birthOrdinal !== undefined && options.birthOrdinal > world.birthOrdinal) {
      world.birthOrdinal = options.birthOrdinal;
    }

    // 1. Name & Appearance (giữ nguyên RNG ngoại hình độc lập với RNG thiên phú)
    const speciesId = race.id === 'beast'
      ? (options.speciesId ?? BEAST_SPECIES[Math.floor(Math.random() * BEAST_SPECIES.length)][0])
      : race.id;
    const name = this.generateName(race.id, speciesId);
    world.addComponent(entity, AppearanceRegistry.instance.choose(race.id, speciesId));
    world.addComponent(entity, new NameComponent(name));

    // 2. Race
    world.addComponent(entity, new RaceComponent(race.id));

    // 3. Tuổi khởi tạo & trạng thái hài đồng
    const startingAge = options.newborn ? 0 : 15 + Math.floor(Math.random() * 16);
    const isChild = startingAge < ADULT_AGE;
    const isUnawakened = Boolean(options.newborn) || startingAge < 12;

    const techTrait: string[] = [];

    // 5. Sinh bộ Hồ Sơ Tiềm Năng & Đặc Điểm V3
    const parentInfos: [ParentGenerationInfo, ParentGenerationInfo] | undefined = options.parents
      ? [
          this.extractParentInfo(world, options.parents[0]),
          this.extractParentInfo(world, options.parents[1]),
        ]
      : undefined;

    const mode = options.mode ?? archetype.defaultMode ?? 'natural';
    const customTraits = options.customTraits ?? archetype.customTraits;
    const allowReincarnation = options.allowReincarnation ?? archetype.allowReincarnation ?? false;

    const bundle = generateTalentBundle({
      worldSeed: world.worldSeed,
      birthOrdinal,
      raceId: race.id as RaceId,
      speciesId,
      mode,
      isNewborn: isUnawakened,
      parents: parentInfos,
      customTraits,
      allowReincarnation,
      defaultLineageTags: archetype.defaultLineageTags,
      forcedSeedClass: options.forcedSeedClass,
    });

    // 6. Position (khởi tạo từ moveSpeed nền, sẽ được rebuildEntityStats cập nhật)
    const baseMoveSpeed = race.baseStats.moveSpeed;
    world.addComponent(entity, new PositionComponent(x, y, baseMoveSpeed));

    // 7. Realm (Linh khí ban đầu 50/50, tăng x5 mỗi đại cảnh giới)
    const stageIdx = options.newborn ? 0 : Math.min(archetype.realmIndex, realmChain.stages.length - 1);
    const stage = realmChain.stages[stageIdx];
    const subStage = stage.subStages ? stage.subStages[0] : 'Sơ Kỳ';
    const maxQi = Math.max(stage.qiRequired,
      Math.floor(race.baseStats.baseQi * Math.pow(race.baseStats.qiGrowthMultiplier, stageIdx)));
    world.addComponent(
      entity,
      new RealmComponent(
        realmChain.id,
        stageIdx,
        stage.name,
        subStage,
        0,
        maxQi,
        stage.baseCombatPower,
        0
      )
    );

    // 8. Baseline Stats (trước khi áp dụng trait)
    const archHealthMult = options.newborn ? 1.0 : (archetype.statMultipliers?.health ?? 1.0);
    const archLifespanMult = options.newborn ? 1.0 : (archetype.statMultipliers?.lifespan ?? 1.0);
    const archPhysiqueMult = options.newborn ? 1.0 : (archetype.statMultipliers?.physique ?? 1.0);

    const baseMaxHp = Math.floor(
      race.baseStats.maxHealth *
      Math.pow(race.baseStats.healthGrowthMultiplier, stageIdx) *
      archHealthMult
    );
    const baseMaxLifespan = Math.floor(
      race.baseStats.baseLifespan *
      Math.pow(race.baseStats.lifespanGrowthMultiplier, stageIdx) *
      archLifespanMult
    );
    const baseAtk = Math.floor(race.baseStats.baseAttack * archPhysiqueMult);
    const baseDef = Math.floor(race.baseStats.baseDefense * archPhysiqueMult);
    const baseArmor = race.baseStats.armor;
    const baseCritRate = Math.min(1.0, race.baseStats.critRate);
    const baseDodgeRate = Math.min(0.8, race.baseStats.dodgeRate);

    world.addComponent(
      entity,
      new StatBaselineComponent({
        baseMoveSpeed,
        baseMaxHealth: race.baseStats.maxHealth,
        healthGrowthMultiplier: race.baseStats.healthGrowthMultiplier,
        archetypeHealthMultiplier: archHealthMult,
        baseLifespan: race.baseStats.baseLifespan,
        lifespanGrowthMultiplier: race.baseStats.lifespanGrowthMultiplier,
        archetypeLifespanMultiplier: archLifespanMult,
        baseAttack: race.baseStats.baseAttack,
        baseDefense: race.baseStats.baseDefense,
        baseArmor,
        archetypePhysiqueMultiplier: archPhysiqueMult,
        baseCritRate,
        baseDodgeRate,
        baseAttackSpeed: 1.0,
      })
    );

    world.addComponent(entity, new HealthComponent(baseMaxHp));
    world.addComponent(entity, new LifespanComponent(startingAge, baseMaxLifespan));

    // 9. Hunger (Đói khát)
    world.addComponent(entity, new HungerComponent(Math.floor(Math.random() * 30 + 60)));

    // 11. Character State & Animation
    world.addComponent(entity, new CharacterStateComponent('idle', 'down'));
    world.addComponent(entity, new AnimationComponent(race.defaultSpriteConfigId));

    // 12. Traits V3 (entries chuẩn + đồng bộ mảng legacy)
    const ownedEntries: OwnedTrait[] = bundle.selectedTraitIds.map(tid => {
      const def = getTraitDefinition(tid);
      return {
        id: tid,
        origin: def?.origin ?? 'innate',
        acquiredAtDay: 0,
        sourceEventId: options.parents ? 'inheritance_birth' : 'birth',
        state: 'active',
      };
    });
    world.addComponent(
      entity,
      new TraitsComponent(bundle.selectedTraitIds, techTrait, [], ownedEntries)
    );

    // 13. TalentProfile, GrowthMind & Comprehension adapter
    world.addComponent(entity, bundle.profile);
    world.addComponent(entity, bundle.growth);
    world.addComponent(entity, new ComprehensionComponent(50000));

    // 14. Combat Stats & Equipment
    world.addComponent(
      entity,
      new CombatStatsComponent(
        baseAtk,
        baseDef,
        baseArmor,
        1.0,
        baseCritRate,
        baseDodgeRate,
        1.5,
        25
      )
    );
    world.addComponent(entity, new EquipmentComponent());
    world.addComponent(entity, new InventoryComponent());

    // 15. Linh Căn (Spiritual Root) & Hài Đồng (Childcare)
    world.addComponent(entity, new ChildcareComponent(isChild));

    let root: SpiritualRootComponent;
    if (isUnawakened) {
      root = new SpiritualRootComponent(false, 'none', 'Chưa Thức Tỉnh (Hài Đồng)', [], 0);
    } else {
      const pr = bundle.profile.pendingRoot!;
      root = new SpiritualRootComponent(
        true,
        pr.rootType,
        pr.gradeName || getRootGradeName(pr.rootType, race.id),
        [...pr.elements],
        pr.purity
      );
      root.awakenedAge = 12;
    }
    world.addComponent(entity, root);

    // 16. Tính toán lại toàn bộ chỉ số hiệu lực & tiềm năng từ baseline + traits V3
    rebuildEntityStats(world, entity);

    // 17. Nhu Cầu Dân Sinh & Lịch Trình Sinh Hoạt (Chỉ dành cho Phàm Nhân Nhân Tộc)
    if (race.id === 'human') {
      world.addComponent(entity, new MortalNeedsComponent(90, 90, 90));
      const sched = new DailyScheduleComponent();
      world.addComponent(entity, sched);
    }

    // 18. Biên Niên Sử Cá Nhân (Character History)
    const finalLifespan = world.getComponent(entity, LifespanComponent)?.maxLifespan ?? baseMaxLifespan;
    const history = new CharacterHistoryComponent();
    const birthDesc = race.id === 'beast'
      ? `Sinh ra giữa chốn sơn lâm đại ngàn kỳ vĩ. Huyết mạch Yêu Tộc bẩm sinh, thọ nguyên ${finalLifespan} năm, hấp thu linh khí nhật nguyệt.`
      : (race.id === 'human'
        ? `Chào đời với thân phận Phàm Nhân. Mang thiên tư [${archetype.name}], thọ nguyên ban đầu ${finalLifespan} năm, chính thức bước vào thế giới tu chân.`
        : `Sinh ra từ ma khí thâm sâu hoang vực, thân thể cường hãn hung tàn, thọ nguyên ${finalLifespan} năm.`);
    history.addRecord(
      startingAge,
      'birth',
      race.id === 'beast' ? '🐾 Huyết Mạch Yêu Tộc' : '🌟 Xuất Thế Khởi Đầu',
      birthDesc
    );
    world.addComponent(entity, history);

    // 19. Bộ Não AI 3 Tầng (Three-Tier AI Brain)
    let initialGoal: any = 'WANDER_SERENDIPITY';
    if (race.id === 'beast') {
      initialGoal = 'WANDER_SERENDIPITY';
    } else if (race.id === 'human') {
      initialGoal = (root && root.canCultivate() && root.rootType !== 'none')
        ? 'SECLUDED_CULTIVATION'
        : 'LABOUR_WORK';
    } else {
      initialGoal = 'WANDER_SERENDIPITY';
    }
    world.addComponent(entity, new AIStrategicBrainComponent(isChild ? 'SOCIAL_RECREATE' : initialGoal));
    world.addComponent(entity, new AIPlannerComponent());
    world.addComponent(entity, new AIBehaviorTreeComponent());

    // 20. Mạng Lưới Quan Hệ Xã Hội & Ký Ức Tâm Thức
    const socialRel = new SocialRelationshipComponent();
    const memory = new MemoryComponent();
    memory.addMemory(
      'chatted',
      `Khởi nguyên sinh linh, bước chân vào đại đạo hồng trần`,
      2,
      10,
      undefined,
      undefined,
      1
    );
    world.addComponent(entity, socialRel);
    world.addComponent(entity, memory);

    reviewProfession(world, entity);

    return entity;
  }

  /**
   * Create a child with a new appearance, preserving species and reciprocal family links.
   */
  public static createNewborn(world: ECSWorld, parentA: number, parentB: number): Entity | null {
    const raceA = world.getComponent(parentA, RaceComponent);
    const raceB = world.getComponent(parentB, RaceComponent);
    const pos = world.getComponent(parentA, PositionComponent);
    const appearanceA = world.getComponent(parentA, AppearanceComponent);
    const appearanceB = world.getComponent(parentB, AppearanceComponent);
    if (parentA === parentB || !raceA || !raceB || raceA.raceId !== raceB.raceId ||
        !pos || !appearanceA || !appearanceB || appearanceA.speciesId !== appearanceB.speciesId) return null;
    for (const parent of [parentA, parentB]) {
      const hp = world.getComponent(parent, HealthComponent);
      if (!hp || hp.isDead) return null;
    }
    const archetype = raceA.raceId === 'beast' ? 'yao_common'
      : raceA.raceId === 'demon' ? 'mortal_demon' : 'mortal_human';
    const child = this.spawnFromArchetype(world, archetype, pos.x, pos.y, {
      newborn: true,
      speciesId: appearanceA.speciesId,
      parents: [parentA, parentB],
      mode: 'natural'
    });
    world.getComponent(child, FamilyComponent)!.parentIds = [parentA, parentB];
    world.getComponent(child, ChildcareComponent)!.guardianEntityId = parentA;
    for (const parent of [parentA, parentB]) {
      const care = world.getComponent(parent, ChildcareComponent);
      if (care && !care.childrenEntityIds.includes(child)) care.childrenEntityIds.push(child);
      linkParentAndChild(world, parent, child);
    }
    return child;
  }

  public static generateInitialFauna(world: ECSWorld, worldMap: WorldMap, totalCount: number = 18, rng?: { next: () => number }): void {
    const tileSize = worldMap.tileSize;
    const w = worldMap.width;
    const h = worldMap.height;
    const randFn = () => (rng ? rng.next() : Math.random());

    let spawned = 0;
    let attempts = 0;
    const maxAttempts = totalCount * 25;

    while (spawned < totalCount && attempts < maxAttempts) {
      attempts++;
      const tx = Math.floor(randFn() * (w - 8)) + 4;
      const ty = Math.floor(randFn() * (h - 8)) + 4;
      const tile = worldMap.getTile(tx, ty);
      if (!tile || tile.terrain === TerrainType.OCEAN || tile.terrain === TerrainType.RIVER || tile.terrain === TerrainType.LAKE) continue;

      const px = tx * tileSize + tileSize / 2;
      const py = ty * tileSize + tileSize / 2;

      // 80% Yêu Tộc Thường, 20% Yêu Tu (đặc biệt ở núi non hoặc rừng rậm)

      const archetypeId = 'yao_common';

      this.spawnFromArchetype(world, archetypeId, px, py);
      spawned++;
    }
  }
}
