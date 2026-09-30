export const RESIDENT_STARVATION_THRESHOLD = 10;
import { Component } from '../../ecs/Component.ts';
import { AnimationState, Direction } from '../../config/animations.config.ts';
import {
  TechniqueTier,
  TechniqueMasteryLevel,
  TechniqueSource,
  MASTERY_CONFIGS,
  TECHNIQUE_TIER_NAMES,
  TECHNIQUE_SOURCE_NAMES
} from '../../config/techniques.config.ts';

export class PositionComponent implements Component {
  public x: number;
  public y: number;
  public targetX?: number;
  public targetY?: number;
  public speed: number;

  constructor(x: number, y: number, speed: number = 1.0) {
    this.x = x;
    this.y = y;
    this.speed = speed;
  }
}

export class NameComponent implements Component {
  public name: string;
  constructor(name: string) {
    this.name = name;
  }
}

export class RaceComponent implements Component {
  public raceId: string;
  constructor(raceId: string) {
    this.raceId = raceId;
  }
}

export class RealmComponent implements Component {
  public realmChainId: string;
  public stageIndex: number;          // Vị trí đại cảnh giới (0: Phàm nhân, 1: Luyện khí, 2: Trúc cơ...)
  public stageName: string;           // Tên đại cảnh giới
  public subStageName: string;        // Tên tiểu cảnh giới (Tầng 1-9 hoặc Sơ/Trung/Hậu)
  public subStageIndex: number = 0;   // Chỉ số tiểu cảnh giới
  public currentQi: number;           // Linh lực đã tích lũy
  public maxQi: number;               // Linh lực cần để thử đột phá
  public combatPower: number;         // Lực chiến tổng hợp
  public isBreakingThrough: boolean = false; // Đang trong quá trình thử đột phá
  public breakthroughTimer: number = 0;
  public stageAgeDays: number = 0; // Thời gian đã tu ở đại cảnh giới hiện tại
  public tribulationStrikesLeft: number = 0; // Số tia lôi kiếp còn phải chịu đựng
  public breakthroughBonus: number = 0; // Tỷ lệ thành công cộng thêm từ đan dược (Trúc Cơ Đan, Tụ Đan Đan...)
  public lastBreakthroughChance?: number; // Dữ liệu diagnostic xác suất đột phá lần gần nhất (0.05..0.95)
  public breakthroughAttemptCounter: number = 0; // Bộ đếm lượt thử đột phá ổn định cho GrowthEvent

  constructor(
    realmChainId: string,
    stageIndex: number,
    stageName: string,
    subStageName: string,
    currentQi: number,
    maxQi: number,
    combatPower: number,
    subStageIndex: number = 0
  ) {
    this.realmChainId = realmChainId;
    this.stageIndex = stageIndex;
    this.stageName = stageName;
    this.subStageName = subStageName;
    this.subStageIndex = subStageIndex;
    this.currentQi = currentQi;
    this.maxQi = maxQi;
    this.combatPower = combatPower;
  }
}

export class HealthComponent implements Component {
  public current: number;
  public max: number;
  public isDead: boolean = false;
  public decayTimer: number = 0;

  constructor(max: number) {
    this.max = max;
    this.current = max;
  }
}

export class LifespanComponent implements Component {
  public currentAge: number; // Tính theo năm
  public maxLifespan: number;// Tính theo năm
  public isElderly: boolean = false; // Bước vào giai đoạn tuổi già (>= 90% thọ mệnh)
  public hasLoggedElderly: boolean = false;

  constructor(currentAge: number, maxLifespan: number) {
    this.currentAge = currentAge;
    this.maxLifespan = maxLifespan;
    this.isElderly = this.checkElderly();
  }

  public checkElderly(): boolean {
    return this.currentAge >= this.maxLifespan * 0.9;
  }
}

export class HungerComponent implements Component {
  public current: number;    // 0 đến 100
  public max: number = 100;
  public isStarving: boolean = false;

  constructor(current: number = 80) {
    this.current = current;
  }
}

export class CultivationTechniqueComponent implements Component {
  public techniqueId: string;
  public techniqueName: string;
  public tier: TechniqueTier;
  public element: string;
  public description: string;
  public source: TechniqueSource;
  public sourceName: string;
  public masteryLevel: TechniqueMasteryLevel;
  public masteryExp: number;
  public masteryMaxExp: number;

  constructor(
    techniqueId: string,
    techniqueName: string,
    tier: TechniqueTier = 1,
    element: string = 'vo_dinh',
    description: string = '',
    source: TechniqueSource = 'co_duyen',
    sourceName: string = 'Kỳ ngộ tình cờ',
    masteryLevel: TechniqueMasteryLevel = 'nhap_mon',
    masteryExp: number = 0
  ) {
    this.techniqueId = techniqueId;
    this.techniqueName = techniqueName;
    this.tier = tier;
    this.element = element;
    this.description = description;
    this.source = source;
    this.sourceName = sourceName;
    this.masteryLevel = masteryLevel;
    this.masteryExp = masteryExp;
    this.masteryMaxExp = this.calculateNextThreshold();
  }

  public calculateNextThreshold(): number {
    switch (this.masteryLevel) {
      case 'nhap_mon': return 100;
      case 'so_khuynh': return 300;
      case 'tieu_thanh': return 800;
      case 'dai_thanh': return 800;
    }
  }

  public addMasteryExp(amount: number): { leveledUp: boolean; oldLevel: TechniqueMasteryLevel; newLevel: TechniqueMasteryLevel } {
    const oldLevel = this.masteryLevel;
    if (this.masteryLevel === 'dai_thanh') {
      this.masteryExp = Math.min(800, this.masteryExp + amount);
      return { leveledUp: false, oldLevel, newLevel: oldLevel };
    }

    this.masteryExp += amount;
    let newLevel: TechniqueMasteryLevel = this.masteryLevel;

    if (this.masteryExp >= 800) {
      newLevel = 'dai_thanh';
    } else if (this.masteryExp >= 300) {
      newLevel = 'tieu_thanh';
    } else if (this.masteryExp >= 100) {
      newLevel = 'so_khuynh';
    }

    const leveledUp = newLevel !== oldLevel;
    if (leveledUp) {
      this.masteryLevel = newLevel;
      this.masteryMaxExp = this.calculateNextThreshold();
    }
    return { leveledUp, oldLevel, newLevel };
  }

  public getMasteryTitle(): string {
    return MASTERY_CONFIGS[this.masteryLevel]?.name ?? 'Nhập Môn';
  }

  public getMasteryBadge(): string {
    return MASTERY_CONFIGS[this.masteryLevel]?.badge ?? '🌱';
  }

  public getMasteryMultiplier(): number {
    return MASTERY_CONFIGS[this.masteryLevel]?.multiplier ?? 1.0;
  }

  public getTierInfo() {
    return TECHNIQUE_TIER_NAMES[this.tier] || { name: 'Hoàng Phẩm', color: '#94a3b8', badge: '⚪' };
  }

  public getSourceInfo() {
    return TECHNIQUE_SOURCE_NAMES[this.source] || { name: 'Kỳ Ngộ Đắc Đạo', icon: '🌌', badge: 'Cơ Duyên' };
  }
}

export class CharacterStateComponent implements Component {
  public state: AnimationState = 'idle';
  public direction: Direction = 'down';
  public stateTimer: number = 0;

  constructor(state: AnimationState = 'idle', direction: Direction = 'down') {
    this.state = state;
    this.direction = direction;
  }
}

export class AnimationComponent implements Component {
  public configId: string;
  public currentClip: AnimationState = 'idle';
  public frameIndex: number = 0;
  public elapsedTime: number = 0;
  public isCustomAsset: boolean = false;

  constructor(configId: string) {
    this.configId = configId;
  }
}

import { OwnedTrait, TraitOrigin } from '../../config/traits/trait.types.ts';

export class TraitsComponent implements Component {
  public entries: OwnedTrait[] = [];
  public innateTraits: string[] = [];
  public techniqueTraits: string[] = [];
  public trainingTraits: string[] = [];
  public revision: number = 0;

  constructor(
    innateTraits: string[] = [],
    techniqueTraits: string[] = [],
    trainingTraits: string[] = [],
    entries?: OwnedTrait[]
  ) {
    this.innateTraits = [...innateTraits];
    this.techniqueTraits = [...techniqueTraits];
    this.trainingTraits = [...trainingTraits];

    if (Array.isArray(entries) && entries.length > 0) {
      this.entries = entries.map(e => ({ ...e }));
      this.syncLegacyViews();
    } else {
      this.reconcileFromLegacyArrays();
    }
  }

  public reconcileFromLegacyArrays(acquiredAtDay: number = 0): void {
    const byId = new Map<string, OwnedTrait>();
    for (const e of this.entries) {
      if (e && e.id && !byId.has(e.id)) {
        byId.set(e.id, e);
      }
    }

    for (const rawId of this.innateTraits) {
      if (!rawId || byId.has(rawId)) continue;
      byId.set(rawId, {
        id: rawId,
        origin: 'innate',
        acquiredAtDay,
        state: 'active',
      });
    }

    for (const rawId of this.trainingTraits) {
      if (!rawId || byId.has(rawId)) continue;
      byId.set(rawId, {
        id: rawId,
        origin: 'acquired',
        acquiredAtDay,
        state: 'active',
      });
    }

    this.entries = Array.from(byId.values());
    this.syncLegacyViews();
  }

  public syncLegacyViews(): void {
    const innate: string[] = [];
    const training: string[] = [];
    const seen = new Set<string>();

    for (const entry of this.entries) {
      if (!entry || !entry.id || seen.has(entry.id)) continue;
      seen.add(entry.id);
      if (entry.origin === 'acquired') {
        training.push(entry.id);
      } else {
        innate.push(entry.id);
      }
    }

    this.innateTraits = innate;
    this.trainingTraits = training;
  }

  public addTrainingTrait(
    traitId: string,
    acquiredAtDay: number = 0,
    sourceEventId?: string,
    origin: TraitOrigin = 'acquired'
  ): boolean {
    if (!traitId) return false;
    this.reconcileFromLegacyArrays(acquiredAtDay);
    if (this.entries.some(e => e.id === traitId)) {
      return false;
    }
    this.entries.push({
      id: traitId,
      origin,
      acquiredAtDay,
      sourceEventId,
      state: 'active',
    });
    this.syncLegacyViews();
    this.revision++;
    return true;
  }
}

export class ComprehensionComponent implements Component {
  public current: number; // 0 đến 100.000 điểm (1000 đơn vị cũ = 1 điểm chuẩn 0..100)
  public max: number = 100000;

  constructor(current: number = 50000) {
    const safe = typeof current === 'number' && Number.isFinite(current) ? current : 50000;
    this.current = Math.min(100000, Math.max(0, Math.round(safe)));
  }

  public getStandardScore(): number {
    return Math.min(100, Math.max(0, this.current / 1000));
  }

  public setFromStandardScore(score0To100: number): void {
    const clamped =
      typeof score0To100 === 'number' && Number.isFinite(score0To100)
        ? Math.min(100, Math.max(0, score0To100))
        : 0;
    this.current = Math.round(clamped * 1000);
  }

  public getBreakthroughBonus(): number {
    return Math.min(0.35, (this.current / this.max) * 0.35);
  }
}


export type HistoryType = 'birth' | 'breakthrough' | 'combat' | 'battle' | 'sect' | 'miracle' | 'aging' | 'death' | 'technique';

export interface HistoryRecord {
  timestamp: number;
  year: number;
  age: number;
  badge: string;
  title: string;
  description: string;
  type: HistoryType;
}

export class CharacterHistoryComponent implements Component {
  public records: HistoryRecord[] = [];

  constructor(initialRecord?: Omit<HistoryRecord, 'timestamp'>) {
    if (initialRecord) {
      this.addRecord(initialRecord);
    }
  }

  public addRecord(
    ageOrRecord: number | Omit<HistoryRecord, 'timestamp'>,
    type?: HistoryType,
    title?: string,
    description?: string,
    badge?: string,
    year?: number
  ): void {
    if (typeof ageOrRecord === 'object') {
      this.records.unshift({
        ...ageOrRecord,
        timestamp: Date.now()
      });
    } else {
      const defaultBadge = badge || (
        type === 'birth' ? '🌟' :
        type === 'breakthrough' ? '⚡' :
        type === 'combat' || type === 'battle' ? '⚔️' :
        type === 'aging' ? '⏳' :
        type === 'death' ? '⚰️' :
        type === 'sect' ? '🏛️' : '📜'
      );
      this.records.unshift({
        age: ageOrRecord,
        type: type || 'miracle',
        title: title || '',
        description: description || '',
        badge: defaultBadge,
        year: year ?? ageOrRecord,
        timestamp: Date.now()
      });
    }
    if (this.records.length > 50) {
      this.records.pop();
    }
  }
}

// ------------------- PHÂN HỆ CƯ DÂN & TRÍ TUỆ TỰ CHỦ PHÀM NHÂN -------------------

export type SpiritualRootType = 'none' | 'impure' | 'true' | 'earth' | 'heaven';

export class SpiritualRootComponent implements Component {
  public isAwakened: boolean = false; // Tròn 12 tuổi mới thức tỉnh
  public rootType: SpiritualRootType = 'none';
  public gradeName: string = 'Chưa Thức Tỉnh';
  public elements: string[] = []; // Kim, Mộc, Thủy, Hỏa, Thổ
  public purity: number = 0;      // Độ tinh thuần 0 - 100
  public awakenedAge: number = 12;

  constructor(isAwakened: boolean = false, rootType: SpiritualRootType = 'none', gradeName: string = 'Chưa Thức Tỉnh', elements: string[] = [], purity: number = 0) {
    this.isAwakened = isAwakened;
    this.rootType = rootType;
    this.gradeName = gradeName;
    this.elements = elements;
    this.purity = purity;
  }

  public canCultivate(): boolean {
    return this.isAwakened && this.rootType !== 'none';
  }

  public getBadge(): string {
    if (!this.isAwakened) return '🌱 Hài Đồng (Chưa Thức Tỉnh)';
    switch (this.rootType) {
      case 'none': return '🌑 Vô Linh Căn (Phàm Nhân)';
      case 'impure': return '🌫️ Ngũ Hành Tạp Linh Căn';
      case 'true': return '🌿 Chân Linh Căn (Tam Căn)';
      case 'earth': return '⚡ Địa Linh Căn (Song Căn)';
      case 'heaven': return '🌟 Thiên Linh Căn (Tuyệt Đỉnh)';
    }
  }

  public getColor(): string {
    if (!this.isAwakened) return '#8b949e';
    switch (this.rootType) {
      case 'none': return '#6e7681';
      case 'impure': return '#a371f7';
      case 'true': return '#3fb950';
      case 'earth': return '#58a6ff';
      case 'heaven': return '#ffd700';
    }
  }
}

export class MortalNeedsComponent implements Component {
  public thirst: number = 90;           // Điểm nước uống (0 - 100)
  public sleep: number = 90;            // Năng lượng / Tỉnh táo (0 - 100)
  public recreation: number = 90;       // Điểm tinh thần / Giải trí (0 - 100)
  public rawFoodCount: number = 1;      // Lương thực thô dự trữ (thịt, lúa, dâu)
  public cookedMealCount: number = 0;   // Bữa ăn đã nấu chín thơm ngon

  constructor(thirst: number = 90, sleep: number = 90, recreation: number = 90) {
    this.thirst = thirst;
    this.sleep = sleep;
    this.recreation = recreation;
  }
}

export type MortalActivity = 
  | 'sleep' 
  | 'eat' 
  | 'drink' 
  | 'cook' 
  | 'farm' 
  | 'hunt' 
  | 'forage' 
  | 'build' 
  | 'recreate' 
  | 'seek_shelter' 
  | 'care_child' 
  | 'idle' 
  | 'walk';

export type JobPreference = 'farmer' | 'hunter' | 'builder' | 'cook' | 'forager';

export class DailyScheduleComponent implements Component {
  public currentActivity: MortalActivity = 'idle';
  public activityTimer: number = 0;
  public chronotypeOffset: number = 0;  // Độ lệch lịch trình cá nhân (-0.06 đến +0.08) tạo sự phong phú
  public preferredJob: JobPreference = 'farmer';
  public homeBuildingEntityId: number | null = null;
  public targetPos?: { x: number; y: number } | null = null;

  constructor(preferredJob?: JobPreference, chronotypeOffset?: number) {
    this.preferredJob = preferredJob ?? (
      Math.random() < 0.35 ? 'farmer' :
      Math.random() < 0.60 ? 'forager' :
      Math.random() < 0.80 ? 'cook' :
      Math.random() < 0.92 ? 'builder' : 'hunter'
    );
    this.chronotypeOffset = chronotypeOffset ?? (Math.random() * 0.14 - 0.07);
  }

  public getActivityName(): string {
    switch (this.currentActivity) {
      case 'sleep': return 'Đang ngủ say trong nhà tranh 💤';
      case 'eat': return 'Đang dùng bữa ấm cúng 🍚';
      case 'drink': return 'Đang uống nước mát tại giếng 🪣';
      case 'cook': return 'Đang nấu cơm canh thơm lừng 🍳';
      case 'farm': return 'Đang cày cấy, chăm sóc đồng ruộng 🌾';
      case 'hunt': return 'Đang săn bắt dã thú trong rừng 🏹';
      case 'forage': return 'Đang hái dâu rừng & thảo dược 🍓';
      case 'build': return 'Đang gõ búa xây dựng nhà cửa 🔨';
      case 'recreate': return 'Đang tụ tập chuyện trò, ca múa 🎵';
      case 'seek_shelter': return 'Đang hối hả chạy trú mưa bão 🌧️';
      case 'care_child': return 'Đang chăm sóc, bón cơm cho trẻ nhỏ 👶';
      case 'walk': return 'Đang dạo bước đi lại 🚶';
      default: return 'Đang thảnh thơi nghỉ ngơi ☀️';
    }
  }
}

export class ChildcareComponent implements Component {
  public isChild: boolean = false;
  public guardianEntityId: number | null = null;
  public childrenEntityIds: number[] = [];

  constructor(isChild: boolean = false, guardianEntityId: number | null = null) {
    this.isChild = isChild;
    this.guardianEntityId = guardianEntityId;
  }
}

export * from './DeathComponents.ts';
