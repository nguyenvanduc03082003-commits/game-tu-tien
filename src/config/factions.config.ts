export type FactionType = 'hamlet' | 'village' | 'kingdom' | 'sect' | 'holy_land';
export type FactionAlignment = 'righteous' | 'demonic' | 'neutral';
export type SectRank = 'cuu_pham' | 'luc_pham' | 'tam_pham' | 'nhat_pham' | 'thanh_dia';

export type MemberRole = 
  | 'sect_master'      // Chưởng Môn / Quốc Vương / Trưởng Thôn / Thánh Chủ
  | 'sect_leader'      // Alias Chưởng Môn
  | 'village_head'     // Thôn Trưởng / Trưởng Làng
  | 'king'             // Quốc Vương
  | 'elder'            // Trưởng Lão / Đại Thần / Kỳ Lão
  | 'elite_disciple'   // Đệ Tử Chân Truyền / Thân Vệ
  | 'inner_disciple'   // Đệ Tử Nội Môn / Quân Sĩ
  | 'outer_disciple'   // Đệ Tử Ngoại Môn / Dân Binh
  | 'guard'            // Hộ Vệ / Dân Binh
  | 'villager';        // Thôn Dân / Bình Dân

export type BuildingType = 
  | 'sect_hall'           // Tông Môn Đại Điện / Phủ Thành Chủ
  | 'meditation_cave'     // Động Phủ Bế Quan
  | 'herb_garden'         // Linh Dược Điền
  | 'alchemy_chamber'     // Luyện Đan Phòng
  | 'scripture_pavilion'  // Tàng Kinh Các
  | 'defense_array'       // Hộ Tông Trận Pháp
  | 'thatched_hut'        // Nhà Tranh / Lều Gỗ Dân Sinh
  | 'village_well'        // Giếng Nước Thôn Dân
  | 'mortal_farm'         // Ruộng Lúa Nước
  | 'campfire';           // Lửa Trại Thôn Xóm

export interface ResourceBundle {
  food: number;
  wood: number;
  stone: number;
  spiritStones: number;
}

export interface BuildingDefinition {
  type: BuildingType;
  name: string;
  description: string;
  badge: string;
  widthTiles: number;
  heightTiles: number;
  baseDurability: number;
  baseColor: string;
  accentColor: string;
  costDescription: string;
  effectDescription: string;
  resourceCost: ResourceBundle;
  housingCapacity?: number;
  constructionDays: number;
}

export const BUILDING_DEFINITIONS: Record<BuildingType, BuildingDefinition> = {
  sect_hall: {
    type: 'sect_hall',
    name: 'Tông Môn Đại Điện',
    description: 'Trụ sở trung tâm của môn phái hoặc vương đô, nơi nghị sự và mở rộng phạm vi lãnh thổ.',
    badge: '🏛️',
    widthTiles: 3,
    heightTiles: 2,
    baseDurability: 500,
    baseColor: '#8c1d18',
    accentColor: '#ffd700',
    costDescription: 'Cần 30 Gỗ, 20 Đá & 10 Linh Thạch',
    effectDescription: 'Tăng bán kính lãnh thổ +18 ô và tăng danh vọng thế lực.',
    resourceCost: { food: 0, wood: 30, stone: 20, spiritStones: 10 },
    housingCapacity: 4,
    constructionDays: 20
  },
  meditation_cave: {
    type: 'meditation_cave',
    name: 'Động Phủ Bế Quan',
    description: 'Nơi tu sĩ bế quan tịch cốc, dẫn lưu linh khí thiên địa để đẩy nhanh tu vi.',
    badge: '🧘',
    widthTiles: 2,
    heightTiles: 2,
    baseDurability: 350,
    baseColor: '#343a40',
    accentColor: '#38d9a9',
    costDescription: 'Cần 20 Đá & 8 Linh Thạch',
    effectDescription: 'Tốc độ hấp thu linh khí +60%, giảm 80% nguy cơ tẩu hỏa nhập ma.',
    resourceCost: { food: 0, wood: 5, stone: 20, spiritStones: 8 },
    housingCapacity: 2,
    constructionDays: 12
  },
  herb_garden: {
    type: 'herb_garden',
    name: 'Linh Dược Điền',
    description: 'Mảnh ruộng màu mỡ có rãnh tụ linh khí, chuyên canh tác các loại thảo dược quý.',
    badge: '🌾',
    widthTiles: 2,
    heightTiles: 2,
    baseDurability: 200,
    baseColor: '#2b8a3e',
    accentColor: '#69db7c',
    costDescription: 'Cần 12 Gỗ & 4 Linh Thạch',
    effectDescription: 'Mỗi 20 giây tự động sản sinh 1-2 thảo dược vào kho tông môn.',
    resourceCost: { food: 0, wood: 12, stone: 4, spiritStones: 4 },
    constructionDays: 7
  },
  alchemy_chamber: {
    type: 'alchemy_chamber',
    name: 'Luyện Đan Phòng',
    description: 'Đặt Lò Bát Quái nghi ngút khói tiên, nơi trưởng lão đan đạo luyện chế tiên đan cứu mệnh.',
    badge: '⚗️',
    widthTiles: 2,
    heightTiles: 2,
    baseDurability: 300,
    baseColor: '#d9480f',
    accentColor: '#ffd43b',
    costDescription: 'Cần 20 Đá, 15 Gỗ & 12 Linh Thạch',
    effectDescription: 'Luyện đan sư có Hỏa–Mộc linh căn làm việc tại đây, dùng 3 thảo dược và 1 linh thạch để bổ sung 1 đan dược vào kho.',
    resourceCost: { food: 0, wood: 15, stone: 20, spiritStones: 12 },
    constructionDays: 15
  },
  scripture_pavilion: {
    type: 'scripture_pavilion',
    name: 'Tàng Kinh Các',
    description: 'Lầu các cất giữ vô số công pháp ngọc giản và bí kíp võ học thượng thừa.',
    badge: '📜',
    widthTiles: 2,
    heightTiles: 2,
    baseDurability: 400,
    baseColor: '#5c3d2e',
    accentColor: '#74c0fc',
    costDescription: 'Cần 25 Gỗ, 10 Đá & 10 Linh Thạch',
    effectDescription: 'Giúp các đệ tử mới nhập môn nhanh chóng lĩnh ngộ công pháp tông môn.',
    resourceCost: { food: 0, wood: 25, stone: 10, spiritStones: 10 },
    constructionDays: 20
  },
  defense_array: {
    type: 'defense_array',
    name: 'Hộ Tông Trận Pháp',
    description: 'Cột trụ trận nhãn khắc đầy phù văn cổ, phóng xuất kết giới linh quang hộ vệ bờ cõi.',
    badge: '🛡️',
    widthTiles: 2,
    heightTiles: 2,
    baseDurability: 600,
    baseColor: '#1864ab',
    accentColor: '#4dabf7',
    costDescription: 'Cần 25 Đá & 20 Linh Thạch',
    effectDescription: 'Tạo vòng kết giới bảo vệ, giảm 50% sát thương cho đệ tử bên trong và đẩy lùi ma quái.',
    resourceCost: { food: 0, wood: 5, stone: 25, spiritStones: 20 },
    constructionDays: 30
  },
  thatched_hut: {
    type: 'thatched_hut',
    name: 'Nhà Tranh / Lều Gỗ',
    description: 'Căn nhà mái rơm vách gỗ đơn sơ, nơi phàm nhân an cư lạc nghiệp, ngủ nghỉ và che mưa bão.',
    badge: '🛖',
    widthTiles: 2,
    heightTiles: 2,
    baseDurability: 180,
    baseColor: '#d97706',
    accentColor: '#fef3c7',
    costDescription: 'Cần 10 Gỗ & 2 Đá',
    effectDescription: 'Cung cấp chỗ ngủ ấm cúng cho 3 cư dân, che chở trước gió rét mưa bão.',
    resourceCost: { food: 0, wood: 10, stone: 2, spiritStones: 0 },
    housingCapacity: 3,
    constructionDays: 3
  },
  village_well: {
    type: 'village_well',
    name: 'Giếng Nước Thôn Dân',
    description: 'Giếng nước ngọt ngào mát lành, đào sâu vào mạch nước ngầm thanh khiết.',
    badge: '🪣',
    widthTiles: 1,
    heightTiles: 1,
    baseDurability: 150,
    baseColor: '#475569',
    accentColor: '#38bdf8',
    costDescription: 'Cần 8 Đá & 4 Gỗ',
    effectDescription: 'Cung cấp nguồn nước ngọt dồi dào, giải tỏa cơn khát cho cả thôn xóm.',
    resourceCost: { food: 0, wood: 4, stone: 8, spiritStones: 0 },
    constructionDays: 5
  },
  mortal_farm: {
    type: 'mortal_farm',
    name: 'Ruộng Lúa Nước',
    description: 'Mảnh ruộng cày bừa phẳng phiu có mương dẫn nước, lúa trĩu hạt vàng óng.',
    badge: '🌾',
    widthTiles: 2,
    heightTiles: 2,
    baseDurability: 120,
    baseColor: '#ca8a04',
    accentColor: '#facc15',
    costDescription: 'Cần 4 Gỗ & 2 Lương Thực Giống',
    effectDescription: 'Cung cấp lương thực lúa gạo ổn định, nguyên liệu thô để nấu nướng.',
    resourceCost: { food: 2, wood: 4, stone: 0, spiritStones: 0 },
    constructionDays: 3
  },
  campfire: {
    type: 'campfire',
    name: 'Lửa Trại Thôn Xóm',
    description: 'Đống củi cháy bập bùng giữa quảng trường, nơi nấu ăn, sưởi ấm ban đêm và đàn ca múa hát.',
    badge: '🪵',
    widthTiles: 1,
    heightTiles: 1,
    baseDurability: 100,
    baseColor: '#ea580c',
    accentColor: '#fde047',
    costDescription: 'Cần 6 Gỗ Củi Khô',
    effectDescription: 'Nơi nấu các bữa ăn ấm nóng chất lượng, sưởi ấm ban đêm và hồi phục điểm giải trí.',
    resourceCost: { food: 0, wood: 6, stone: 0, spiritStones: 0 },
    housingCapacity: 2,
    constructionDays: 1
  }
};

export const BUILDING_CLEARANCE_TILES = {
  houseToHouse: 0,
  houseToOther: 2,
  sameNonHouse: 1,
  otherNonHouse: 2
} as const;

/** Minimum empty tile gap between building footprints. Houses may touch houses. */
export function getBuildingClearanceTiles(a: BuildingType, b: BuildingType): number {
  const aIsHouse = a === 'thatched_hut';
  const bIsHouse = b === 'thatched_hut';
  if (aIsHouse && bIsHouse) return BUILDING_CLEARANCE_TILES.houseToHouse;
  if (aIsHouse || bIsHouse) return BUILDING_CLEARANCE_TILES.houseToOther;
  return a === b ? BUILDING_CLEARANCE_TILES.sameNonHouse : BUILDING_CLEARANCE_TILES.otherNonHouse;
}

export interface FactionProgressionRules {
  hamlet: {
    minAdults: number;
    minFounders: number;
    minPairAffinity: number;
    minDistanceFromOtherSettlementTiles: number;
    territoryRadiusTiles: number;
    foundingDeadlineDays: number;
    cooldownDaysPerResident: number;
    minDistanceBetweenCentersPx: number;
  };
  village: {
    minPopulation: number;
    minResidents: number;
    minHuts: number;
    minWells: number;
    minFarms: number;
    requireWaterSource: boolean;
    requireFarm: boolean;
    foodReserveDays: number;
    minFoodReserveDaysPerResident: number;
    dailyFoodPerResident: number;
    stabilityDaysRequired: number; // 1 mùa = 90 ngày
    requiredStableDays: number;
    territoryRadiusTiles: number;
    peacefulMergeMinPopulation: number;
    declineMinResidents: number;
  };
  kingdom: {
    minSettlements: number;
    minPopulation: number;
    minTotalResidents: number;
    minTreasury: number;
    minFoodStock: number;
    minGuards: number;
    requireCapitalHall: boolean;
    stabilityDaysRequired: number; // 1 năm = 360 ngày
    requiredStableDays: number;
    territoryRadiusTiles: number;
    guardsRecruitmentMinPopulation: number;
    declineMinResidents: number;
  };
  sect: {
    minFounderNormalizedTier: number; // 2 = Trúc Cơ / Hóa Hình / Ma Tướng
    minFollowers: number;             // ít nhất 49 người theo (tổng 50 với founder)
    minQiDensity: number;
    requireTechnique: boolean;
    requireSectHall: boolean;
    foundingDeadlineDays: number;
    cooldownDaysPerResident: number;
    territoryRadiusTiles: number;
    minDistanceBetweenCentersPx: number;
    minDistanceFromOtherSectTiles: number;
    rankTamPhamMinMembers: number;
    rankNhatPhamMinMembers: number;
  };
  holy_land: {
    minMembers: number;               // ít nhất 200 thành viên
    minHighTierCultivators: number;   // ít nhất 3 tu sĩ cao cấp (normalized tier >= 3)
    minHighTierThreshold: number;     // 3 = Kết Đan / Yêu Đan / Ma Vương
    highTierNormalizedIndex: number;
    minTechniqueTier: number;         // truyền thừa cao cấp (tier >= 3)
    requireSpiritVein: boolean;
    requireDefenseArray: boolean;
    minPrestige: number;
    minSpiritStones: number;
    stabilityDaysRequired: number;    // 3 năm = 1080 ngày
    requiredStableDays: number;
    territoryRadiusTiles: number;
    declineMinMembers: number;
  };
  hamletToVillage: {
    minResidents: number;
    minFoodStock: number;
    requiredStableDays: number;
    minStability: number;
  };
  villageToKingdom: {
    minSettlements: number;
    minTotalPopulation: number;
    minFoodStock: number;
    minTreasury: number;
    requiredStableDays: number;
    minStability: number;
  };
  sectToHolyLand: {
    minMembers: number;
    minHighTierCultivators: number;
    minSpiritStones: number;
    requiredStableDays: number;
    minStability: number;
  };
  declineRecoveryGraceDays: number;   // Thời gian phục hồi trước khi bị giáng cấp (90 ngày = 1 mùa)
}

export const FACTION_PROGRESSION_CONFIG: FactionProgressionRules = {
  hamlet: {
    minAdults: 10,
    minFounders: 10,
    minPairAffinity: 15,
    minDistanceFromOtherSettlementTiles: 14,
    territoryRadiusTiles: 12,
    foundingDeadlineDays: 45,
    cooldownDaysPerResident: 30,
    minDistanceBetweenCentersPx: 220
  },
  village: {
    minPopulation: 30,
    minResidents: 30,
    minHuts: 4,
    minWells: 1,
    minFarms: 2,
    requireWaterSource: true,
    requireFarm: true,
    foodReserveDays: 3,
    minFoodReserveDaysPerResident: 3,
    dailyFoodPerResident: 1.0,
    stabilityDaysRequired: 90,
    requiredStableDays: 90,
    territoryRadiusTiles: 18,
    peacefulMergeMinPopulation: 45,
    declineMinResidents: 10
  },
  kingdom: {
    minSettlements: 2,
    minPopulation: 90,
    minTotalResidents: 90,
    minTreasury: 150,
    minFoodStock: 270,
    minGuards: 5,
    requireCapitalHall: true,
    stabilityDaysRequired: 180,
    requiredStableDays: 180,
    territoryRadiusTiles: 28,
    guardsRecruitmentMinPopulation: 50,
    declineMinResidents: 45
  },
  sect: {
    minFounderNormalizedTier: 2,
    minFollowers: 49,
    minQiDensity: 20,
    requireTechnique: true,
    requireSectHall: true,
    foundingDeadlineDays: 60,
    cooldownDaysPerResident: 45,
    territoryRadiusTiles: 18,
    minDistanceBetweenCentersPx: 240,
    minDistanceFromOtherSectTiles: 16,
    rankTamPhamMinMembers: 80,
    rankNhatPhamMinMembers: 130
  },
  holy_land: {
    minMembers: 200,
    minHighTierCultivators: 3,
    minHighTierThreshold: 3,
    highTierNormalizedIndex: 3,
    minTechniqueTier: 3,
    requireSpiritVein: true,
    requireDefenseArray: true,
    minPrestige: 120,
    minSpiritStones: 80,
    stabilityDaysRequired: 1080,
    requiredStableDays: 1080,
    territoryRadiusTiles: 35,
    declineMinMembers: 80
  },
  hamletToVillage: {
    minResidents: 30,
    minFoodStock: 90,
    requiredStableDays: 90,
    minStability: 60
  },
  villageToKingdom: {
    minSettlements: 2,
    minTotalPopulation: 90,
    minFoodStock: 270,
    minTreasury: 150,
    requiredStableDays: 180,
    minStability: 65
  },
  sectToHolyLand: {
    minMembers: 200,
    minHighTierCultivators: 3,
    minSpiritStones: 80,
    requiredStableDays: 1080,
    minStability: 75
  },
  declineRecoveryGraceDays: 90
};

/**
 * Quy đổi cảnh giới và sức mạnh của các chủng tộc về một thang bậc chuẩn hóa (0..4):
 * - Tier 0: Phàm Nhân / Yêu Sinh / Ma Tốt
 * - Tier 1: Luyện Khí / Luyện Yêu / Ma Binh
 * - Tier 2: Trúc Cơ / Hóa Hình / Ma Tướng (Ngưỡng khai lập Tông Môn)
 * - Tier 3: Kết Đan / Yêu Đan / Ma Vương (Ngưỡng cao thủ Tông Môn / Thánh Địa)
 * - Tier 4: Nguyên Anh+ / Đại Yêu / Ma Tổ
 */
export function getNormalizedCultivationTier(
  raceId: string,
  stageIndex: number,
  combatPower: number = 0
): number {
  if (raceId === 'beast') {
    // beast_realms: 0=Yêu Sinh, 1=Luyện Yêu, 2=Hóa Hình (tương đương Trúc Cơ+), 3=Kết Đan (Yêu Đan)
    if (stageIndex >= 3 || combatPower >= 2500) return 3;
    if (stageIndex >= 2 || combatPower >= 450) return 2;
    if (stageIndex >= 1 || combatPower >= 100) return 1;
    return 0;
  }
  if (raceId === 'demon') {
    // demon_realms: 0=Ma Tốt, 1=Ma Binh, 1=Ma Tướng, 3=Ma Vương
    if (stageIndex >= 3 || combatPower >= 3000) return 3;
    if (stageIndex >= 2 || combatPower >= 500) return 2;
    if (stageIndex >= 1 || combatPower >= 120) return 1;
    return 0;
  }
  // human_realms: 0=Phàm Nhân, 1=Luyện Khí, 2=Trúc Cơ, 3=Kết Đan, 4=Nguyên Anh
  if (stageIndex >= 4 || combatPower >= 5000) return 4;
  if (stageIndex >= 3 || combatPower >= 1000) return 3;
  if (stageIndex >= 2 || combatPower >= 220) return 2;
  if (stageIndex >= 1 || combatPower >= 45) return 1;
  return 0;
}

export function isCivilFactionType(type: FactionType): boolean {
  return type === 'hamlet' || type === 'village' || type === 'kingdom';
}

export function isCultivationFactionType(type: FactionType): boolean {
  return type === 'sect' || type === 'holy_land';
}

export function getLeaderTitleByFactionType(type: FactionType): string {
  switch (type) {
    case 'hamlet': return 'Thôn Trưởng';
    case 'village': return 'Trưởng Làng';
    case 'kingdom': return 'Quốc Vương';
    case 'holy_land': return 'Thánh Chủ';
    case 'sect':
    default:
      return 'Chưởng Môn';
  }
}

export function getRoleDisplayName(role: MemberRole, factionType?: FactionType): string {
  if (role === 'king') return 'Quốc Vương';
  if (role === 'village_head') {
    return factionType === 'village' ? 'Trưởng Làng' : 'Thôn Trưởng';
  }
  if (role === 'sect_master' || role === 'sect_leader') {
    return getLeaderTitleByFactionType(factionType ?? 'sect');
  }
  if (role === 'guard') return '⚔️ Hộ Vệ';
  if (factionType && isCivilFactionType(factionType)) {
    switch (role) {
      case 'elder': return '📜 Kỳ Lão / Đại Thần';
      case 'elite_disciple': return '🛡️ Thân Vệ';
      case 'inner_disciple': return '⚔️ Tuần Đinh / Quân Sĩ';
      case 'outer_disciple': return '🔨 Dân Phu';
      case 'villager':
      default:
        return '🌾 Thôn Dân';
    }
  }
  switch (role) {
    case 'elder': return '🧙 Trưởng Lão';
    case 'elite_disciple': return '✨ Chân Truyền';
    case 'inner_disciple': return '⚔️ Nội Môn';
    case 'outer_disciple': return '🌱 Ngoại Môn';
    case 'villager': return '🌾 Thôn Dân';
    default: return 'Đệ Tử';
  }
}

export const SECT_PREFIXES_RIGHTEOUS = [
  'Vân Lam', 'Thái Ất', 'Thanh Vân', 'Thuần Dương', 'Thiên Đạo', 'Côn Lôn', 'Bạch Hạc', 'Tử Tiêu'
];
export const SECT_SUFFIXES_RIGHTEOUS = [
  'Tông', 'Kiếm Phái', 'Môn', 'Tiên Các', 'Thánh Viện', 'Cung'
];

export const SECT_PREFIXES_DEMONIC = [
  'Huyết Sát', 'Cửu U', 'U Minh', 'Hắc Lân', 'Thiên Ma', 'Thị Huyết', 'Đoạt Phách', 'Huyễn Ma'
];
export const SECT_SUFFIXES_DEMONIC = [
  'Ma Tông', 'Giáo', 'Động', 'Ma Cốc', 'Quỷ Vực', 'Điện'
];

export const HAMLET_NAMES_MORTAL = [
  'Xóm Lạc Diệp', 'Thôn Bích Thủy', 'Ấp Thanh Sơn', 'Xóm Bình An', 'Thôn Ngọa Ngưu', 'Xóm Trúc Lâm', 'Thôn Vân Khê', 'Ấp Hoàng Thổ'
];

export const SETTLEMENT_NAMES_MORTAL = [
  'Thôn Lạc Diệp', 'Làng Thanh Khê', 'Trấn Thái Bình', 'Thôn Bích Thủy', 'Làng Vân Thủy', 'Trấn Phong Lâm', 'Làng Trường Xuân', 'Thôn Ngọc Tuyền'
];

export const KINGDOM_NAMES_MORTAL = [
  'Vương Triều Đại Hạ', 'Đại Tần Vương Quốc', 'Đại Chu Vương Triều', 'Thiên Vũ Quốc', 'Đại Càn Vương Quốc', 'Bắc Lương Vương Triều'
];
