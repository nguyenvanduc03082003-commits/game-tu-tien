export type EnergyType = 'linh_khi' | 'tien_khi' | 'hon_don_khi' | 'ma_khi';
export type DietType = 'herbivore' | 'carnivore' | 'omnivore' | 'qi_only';

export interface RaceBaseStats {
  maxHealth: number;              // HP tối đa khởi đầu
  healthGrowthMultiplier: number; // Hệ số nhân HP khi đột phá đại cảnh giới (Nhân x5, Yêu x7, Ma x4)
  baseQi: number;                 // Linh khí tối đa khởi đầu (mặc định 50)
  qiGrowthMultiplier: number;     // Hệ số nhân Linh khí khi lên cấp (mặc định x5)
  baseLifespan: number;           // Thọ nguyên khởi đầu (Nhân 100, Yêu 200, Ma 150)
  lifespanGrowthMultiplier: number; // Hệ số nhân tuổi thọ khi đột phá (mặc định x5)
  moveSpeed: number;              // Tốc độ di chuyển (Yêu 65 px/s > Nhân = Ma 45 px/s)
  comprehension: number;          // Ngộ tính (Tối đa 100.000: Nhân 50k > Ma 25k > Yêu 8k)
  baseAttack: number;             // Tấn công cơ bản (Ma 28 > Yêu 20 > Nhân 12)
  baseDefense: number;            // Phòng thủ cơ bản (Yêu 16 > Ma 10 > Nhân 4)
  baseArmor: number;              // Giáp cơ bản (Yêu 12 > Ma 8 > Nhân 2)
  armor: number;                  // Giáp cơ bản alias
  critRate: number;               // Tỷ lệ bạo kích (Yêu 15% > Ma 10% > Nhân 5%)
  dodgeRate: number;              // Tỷ lệ né đòn (Nhân 15% > Ma 8% > Yêu 3%)
  qiAbsorptionRate: number;       // Tốc độ hấp thu linh khí
  intellect: number;              // Trí tuệ tương đối
  physique: number;               // Thể phách tương đối
}

export interface RaceDefinition {
  id: string;
  name: string;
  description: string;
  baseStats: RaceBaseStats;
  preferredEnergy: EnergyType;
  elementAffinities: string[];
  dietType: DietType;
  realmsChainId: string;
  innateTraitPool: string[];
  defaultSpriteConfigId: string;
  colorTheme: string; // Màu đại diện cho race khi hiển thị procedural pixel
}

export const RACE_DEFINITIONS: Record<string, RaceDefinition> = {
  human: {
    id: 'human',
    name: 'Nhân Tộc',
    description: 'Vạn vật chi linh, thể chất bình thường nhưng ngộ tính tuyệt đỉnh, thân pháp linh hoạt, né đòn cao nhất, dễ lĩnh ngộ thiên đạo và sáng lập tông môn.',
    baseStats: {
      maxHealth: 100,
      healthGrowthMultiplier: 5,
      baseQi: 50,
      qiGrowthMultiplier: 5,
      baseLifespan: 100,
      lifespanGrowthMultiplier: 5,
      moveSpeed: 45,
      comprehension: 50000,
      baseAttack: 12,
      baseDefense: 4,
      baseArmor: 2,
      armor: 2,
      critRate: 0.05,
      dodgeRate: 0.15,
      qiAbsorptionRate: 1.0,
      intellect: 10,
      physique: 5
    },
    preferredEnergy: 'linh_khi',
    elementAffinities: ['kim', 'moc', 'thuy', 'hoa', 'tho'],
    dietType: 'omnivore',
    realmsChainId: 'human_realms',
    innateTraitPool: ['thien_linh_can', 'ngo_tinh_sieu_pham', 'tien_thien_dao_the', 'linh_lung_that_khieu'],
    defaultSpriteConfigId: 'human_base',
    colorTheme: '#4dabf7' // Lam thiên
  },
  beast: {
    id: 'beast',
    name: 'Yêu Tộc',
    description: 'Hấp thu nhật nguyệt tinh hoa, thân thể cường hãn da dày thịt béo, tốc độ phi hành cực nhanh, móng vuốt bạo kích cao, thọ mệnh dài lâu.',
    baseStats: {
      maxHealth: 200,
      healthGrowthMultiplier: 7,
      baseQi: 50,
      qiGrowthMultiplier: 5,
      baseLifespan: 200,
      lifespanGrowthMultiplier: 5,
      moveSpeed: 65,
      comprehension: 8000,
      baseAttack: 20,
      baseDefense: 16,
      baseArmor: 12,
      armor: 12,
      critRate: 0.15,
      dodgeRate: 0.03,
      qiAbsorptionRate: 0.8,
      intellect: 4,
      physique: 16
    },
    preferredEnergy: 'linh_khi',
    elementAffinities: ['hoa', 'loi', 'phong', 'tho'],
    dietType: 'carnivore',
    realmsChainId: 'beast_realms',
    innateTraitPool: ['da_tinh_nguyen_thuy', 'man_hoang_cu_luc', 'long_huyet_ba_the', 'kim_cang_bat_hoai'],
    defaultSpriteConfigId: 'beast_base',
    colorTheme: '#ff922b' // Cam dã tính
  },
  demon: {
    id: 'demon',
    name: 'Ma Tộc',
    description: 'Sinh ra từ sát khí và ma khí hỗn độn, sát thương công kích cuồng bạo nhất tam giới, vảy ma phòng ngự kiên cố, tính tình hiếu chiến.',
    baseStats: {
      maxHealth: 150,
      healthGrowthMultiplier: 4,
      baseQi: 50,
      qiGrowthMultiplier: 5,
      baseLifespan: 150,
      lifespanGrowthMultiplier: 5,
      moveSpeed: 45,
      comprehension: 25000,
      baseAttack: 28,
      baseDefense: 10,
      baseArmor: 8,
      armor: 8,
      critRate: 0.10,
      dodgeRate: 0.08,
      qiAbsorptionRate: 1.2,
      intellect: 7,
      physique: 14
    },
    preferredEnergy: 'hon_don_khi',
    elementAffinities: ['am', 'hoa', 'loi'],
    dietType: 'carnivore',
    realmsChainId: 'demon_realms',
    innateTraitPool: ['thien_ma_huyet_the', 'dien_cuong_khat_mau', 'sat_phat_chi_tam', 'cuong_chien_huyet_no'],
    defaultSpriteConfigId: 'demon_base',
    colorTheme: '#e03131' // Đỏ huyết ma
  }
};
