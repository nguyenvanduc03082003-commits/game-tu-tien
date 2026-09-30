import { Component } from '../../ecs/Component.ts';
import { WeaponDefinition } from '../../config/weapons.config.ts';
import { ToolDefinition } from '../../config/tools.config.ts';

export interface ArmorDefinition {
  id: string;
  name: string;
  badge: string;
  armorBonus: number;
  healthBonus: number;
  description: string;
  iconPath?: string;
}

export interface ArtifactDefinition {
  id: string;
  name: string;
  badge: string;
  effectDescription: string;
  comprehensionBonus?: number;
  qiAbsorptionMultiplier?: number;
}

export const ARMOR_DEFINITIONS: Record<string, ArmorDefinition> = {
  linen_robe: {
    id: 'linen_robe',
    name: 'Thô Bố Đạo Bào',
    badge: '🥋',
    armorBonus: 2,
    healthBonus: 20,
    description: 'Áo vải thông thường của đệ tử nhập môn, phòng hộ cơ bản.'
  },
  black_iron_armor: {
    id: 'black_iron_armor',
    name: 'Huyền Thiết Trọng Giáp',
    badge: '🛡️',
    armorBonus: 8,
    healthBonus: 80,
    description: 'Giáp đúc bằng huyền thiết ngàn năm, phòng ngự kiên cố.'
  },
  demon_scale_armor: {
    id: 'demon_scale_armor',
    name: 'Huyết Lân Ma Giáp',
    badge: '🐉',
    armorBonus: 15,
    healthBonus: 160,
    description: 'Giáp vảy của Huyết Giao thượng cổ, đao thương bất nhập.'
  },
  golden_silk_armor: {
    id: 'golden_silk_armor',
    name: 'Kim Ti Bảo Giáp',
    badge: '✨',
    armorBonus: 12,
    healthBonus: 120,
    description: 'Áo giáp dệt từ sợi vàng ngàn năm đan xen linh ti, hộ tâm bảo mệnh tuyệt hảo.'
  },
  celestial_silk_robe: {
    id: 'celestial_silk_robe',
    name: 'Cửu Thiên Băng Tằm Y',
    badge: '🥻',
    armorBonus: 20,
    healthBonus: 220,
    description: 'Băng tằm ngàn năm nhả tơ dệt thành, đao thương bất nhập, thủy hỏa bất xâm.'
  },
  raven_traveler_vest: {
    id: 'raven_traveler_vest',
    name: 'Hành Cước Bì Giáp',
    badge: '🥋',
    armorBonus: 4,
    healthBonus: 40,
    iconPath: 'assets/sprites/items/armor/raven_traveler_vest.png',
    description: 'Áo giáp da nhẹ, bảo vệ cơ bản mà không cản trở bước chân.'
  },
  raven_scale_coat: {
    id: 'raven_scale_coat',
    name: 'Ngân Lân Hộ Y',
    badge: '🛡️',
    armorBonus: 10,
    healthBonus: 100,
    iconPath: 'assets/sprites/items/armor/raven_scale_coat.png',
    description: 'Áo hộ thân ghép vảy kim loại, phòng thủ tốt cho tu sĩ đã có kinh nghiệm.'
  },
  raven_crimson_cuirass: {
    id: 'raven_crimson_cuirass',
    name: 'Xích Viêm Chiến Khải',
    badge: '🛡️',
    armorBonus: 14,
    healthBonus: 145,
    iconPath: 'assets/sprites/items/armor/raven_crimson_cuirass.png',
    description: 'Chiến khải đỏ sẫm gia cố bằng linh lực, cận mức Huyết Lân Ma Giáp nhưng nhẹ hơn.'
  }
};

export const ARTIFACT_DEFINITIONS: Record<string, ArtifactDefinition> = {
  spirit_jade_pendant: {
    id: 'spirit_jade_pendant',
    name: 'Ôn Ngọc Linh Bội',
    badge: '📿',
    effectDescription: 'Tăng 15% tốc độ hấp thu linh khí',
    qiAbsorptionMultiplier: 1.15
  },
  enlightenment_mirror: {
    id: 'enlightenment_mirror',
    name: 'Thông Thiên Bát Quái Kính',
    badge: '🪞',
    effectDescription: 'Khai mở trí tuệ, ngộ tính +5.000 điểm',
    comprehensionBonus: 5000
  },
  celestial_bell: {
    id: 'celestial_bell',
    name: 'Hỗn Độn Đông Hoàng Chung',
    badge: '🔔',
    effectDescription: 'Trấn áp tâm ma, đột phá an toàn tuyệt đối',
    comprehensionBonus: 10000,
    qiAbsorptionMultiplier: 1.3
  },
  spatial_ring: {
    id: 'spatial_ring',
    name: 'Thái Hư Trữ Vật Giới',
    badge: '💍',
    effectDescription: 'Nhẫn nạp giới chứa vạn vật, bảo vệ tài nguyên không thất thoát',
    comprehensionBonus: 2000,
    qiAbsorptionMultiplier: 1.1
  },
  spirit_gathering_banner: {
    id: 'spirit_gathering_banner',
    name: 'Thái Hư Tụ Linh Kỳ',
    badge: '🚩',
    effectDescription: 'Phất cờ hội tụ linh khí phương viên trăm dặm, tăng 25% hấp thu linh khí',
    comprehensionBonus: 4000,
    qiAbsorptionMultiplier: 1.25
  }
};

export class EquipmentComponent implements Component {
  public mainHand: WeaponDefinition | null = null;
  public offHand: WeaponDefinition | null = null; // Tay phụ (Song Trì 2 tay)
  public bodyArmor: ArmorDefinition | null = null; // Giáp hộ thân
  public artifact: ArtifactDefinition | null = null; // Pháp bảo tùy thân
  public workTool: ToolDefinition | null = null; // Công cụ lao động (cuốc, rìu, búa, liềm...)

  constructor(
    mainHand?: WeaponDefinition | null,
    offHand?: WeaponDefinition | null,
    bodyArmor?: ArmorDefinition | null,
    artifact?: ArtifactDefinition | null,
    workTool?: ToolDefinition | null
  ) {
    this.mainHand = mainHand ?? null;
    this.offHand = offHand ?? null;
    this.bodyArmor = bodyArmor ?? null;
    this.artifact = artifact ?? null;
    this.workTool = workTool ?? null;
  }

  /**
   * Kiểm tra xem nhân vật có đang Song Trì (Dual Wield) 2 tay không
   */
  public isDualWielding(): boolean {
    return (
      this.mainHand !== null &&
      this.offHand !== null &&
      this.mainHand.slotType === 'one_handed' &&
      this.offHand.slotType === 'one_handed'
    );
  }

  /**
   * Song Trì tăng 60% tốc độ đánh và tăng sát thương tổng hợp
   */
  public getEffectiveAttackSpeed(): number {
    if (this.mainHand) {
      const baseSpeed = this.mainHand.attackSpeed;
      return this.isDualWielding() ? baseSpeed * 1.6 : baseSpeed;
    }
    // Nếu không cầm vũ khí nhưng có công cụ tự vệ
    if (this.workTool) {
      return this.workTool.attackSpeed;
    }
    return 1.0;
  }

  public getEffectiveRange(): number {
    if (this.mainHand) return this.mainHand.range;
    if (this.workTool) return this.workTool.range;
    return 22;
  }

  public getTotalArmorBonus(): number {
    return this.bodyArmor ? this.bodyArmor.armorBonus : 0;
  }

  /**
   * Tính hệ số nhân hiệu suất lao động theo ngành nghề
   */
  public getWorkEfficiency(workType: string): number {
    if (!this.workTool) return 1.0;

    switch (workType) {
      case 'farm':
        return this.workTool.type === 'hoe' ? this.workTool.workEfficiencyMultiplier : 1.0;
      case 'build':
      case 'repair':
        return this.workTool.type === 'hammer' ? this.workTool.workEfficiencyMultiplier : 1.0;
      case 'forage':
      case 'harvest':
        return this.workTool.type === 'sickle' ? this.workTool.workEfficiencyMultiplier : 1.0;
      case 'chop':
        return this.workTool.type === 'axe' ? this.workTool.workEfficiencyMultiplier : 1.0;
      case 'mine':
        return this.workTool.type === 'pickaxe' ? this.workTool.workEfficiencyMultiplier : 1.0;
      case 'fish':
        return this.workTool.type === 'fishing_rod' ? this.workTool.workEfficiencyMultiplier : 1.0;
      default:
        return 1.0;
    }
  }

  /**
   * Lấy sản lượng thưởng thêm khi thu hoạch
   */
  public getHarvestYieldBonus(workType?: string): number {
    if (!this.workTool) return 0;
    if (workType === 'farm' && this.workTool.type === 'hoe') {
      return this.workTool.harvestYieldBonus;
    }
    if ((workType === 'forage' || workType === 'harvest') && this.workTool.type === 'sickle') {
      return this.workTool.harvestYieldBonus;
    }
    return this.workTool.harvestYieldBonus;
  }

  /**
   * Sát thương vũ trang: nếu không có vũ khí thì dùng công cụ làm vũ khí tự vệ
   */
  public getWeaponDamageBonus(): number {
    if (this.mainHand) return this.mainHand.baseDamage;
    if (this.workTool) return this.workTool.baseDamage;
    return 0;
  }
}

export interface CombatIntent {
  schemaVersion: 1;
  source: 'autonomous' | 'self_defense' | 'social_assistance' | 'god_decree';
  enemyId: number;
  startedAtDay: number;
  allyId?: number;
  bondEpisodeId?: string;
}

export class CombatStatsComponent implements Component {
  public baseAtk: number = 10;
  public defense: number = 0;
  public armor: number = 2;          // Chỉ số giáp giảm trừ sát thương
  public attackSpeed: number = 1.0;
  public critRate: number = 0.05;    // Tỷ lệ bạo kích
  public critDamage: number = 1.5;
  public dodgeRate: number = 0.05;   // Tỷ lệ né đòn
  public attackRange: number = 22;
  public currentCooldown: number = 0;
  private _combatTarget: number | null = null;
  public combatIntent: CombatIntent | null = null;
  public get targetEntityId(): number | null { return this._combatTarget; }
  public set targetEntityId(value: number | null) {
    if (value !== this._combatTarget || value === null) this.combatIntent = null;
    this._combatTarget = value;
  }
  public isHostile: boolean = false; // Có chủ động tấn công không
  public buffDamageMultiplier: number = 1.0;
  public buffTimer: number = 0;

  constructor(
    baseAtk: number = 10,
    defense: number = 0,
    armor: number = 2,
    attackSpeed: number = 1.0,
    critRate: number = 0.05,
    dodgeRate: number = 0.05,
    critDamage: number = 1.5,
    attackRange: number = 22,
    isHostile: boolean = false
  ) {
    this.baseAtk = baseAtk;
    this.defense = defense;
    this.armor = armor;
    this.attackSpeed = attackSpeed;
    this.critRate = critRate;
    this.dodgeRate = dodgeRate;
    this.critDamage = critDamage;
    this.attackRange = attackRange;
    this.isHostile = isHostile;
  }
}

export class ProjectileComponent implements Component {
  public sourceEntityId: number;
  public targetEntityId: number | null;
  public targetX: number;
  public targetY: number;
  public speed: number;
  public damage: number;
  public isCrit: boolean;
  public type: 'arrow' | 'dagger' | 'dart' | 'wind_blade' | 'sword_qi';

  constructor(
    sourceEntityId: number,
    targetEntityId: number | null,
    targetX: number,
    targetY: number,
    damage: number,
    isCrit: boolean = false,
    speed: number = 320,
    type: 'arrow' | 'dagger' | 'dart' | 'wind_blade' | 'sword_qi' = 'arrow'
  ) {
    this.sourceEntityId = sourceEntityId;
    this.targetEntityId = targetEntityId;
    this.targetX = targetX;
    this.targetY = targetY;
    this.damage = damage;
    this.isCrit = isCrit;
    this.speed = speed;
    this.type = type;
  }
}
