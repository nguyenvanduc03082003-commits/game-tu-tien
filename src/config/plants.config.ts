import { TerrainType } from './terrains.config.ts';

export type PlantCategory = 'tree' | 'food' | 'spirit_herb' | 'divine_herb';

export interface PlantDefinition {
  id: string;
  name: string;
  category: PlantCategory;
  tier: number;                 // 0: Thường/Ăn quả, 1-4: Linh dược cấp 1-4, 5: Thần dược cực phẩm
  description: string;
  growthDurationDays: number;   // Số ngày để trưởng thành hoàn toàn
  preferredTerrain: TerrainType[];
  qiAbsorptionRate: number;     // Tốc độ hút linh khí từ ô đất
  naturalSpawnWeight: number;   // Trọng số xuất hiện tự nhiên (0.000001 cho Thần Dược theo yêu cầu)
  fruitYield?: number;          // Sản lượng thức ăn khi hái quả/thu hoạch
  fruitRegrowDays?: number;     // Số ngày cần thiết để tái kết quả sau khi bị hái
  woodYield?: number;           // Sản lượng gỗ tối đa có thể khai thác
  woodRegrowDays?: number;      // Số ngày hồi phục gỗ nếu cây còn sống
  healingValue?: number;        // Trị thương khi dùng
  lifespanBonusValue?: number;  // Tăng thọ nguyên khi dùng
  color: string;
  glowColor?: string;
  badge: string;
}

export const PLANT_DEFINITIONS: Record<string, PlantDefinition> = {
  // 1. CÂY GỖ THƯỜNG
  oak_tree: {
    id: 'oak_tree',
    name: 'Cây Sồi Cổ',
    category: 'tree',
    tier: 0,
    description: 'Thân gỗ cao lớn, cành lá sum suê, tạo bóng mát cho sinh linh cư ngụ.',
    growthDurationDays: 30,
    preferredTerrain: [TerrainType.PLAIN, TerrainType.DENSE_FOREST, TerrainType.HILL],
    qiAbsorptionRate: 0.1,
    naturalSpawnWeight: 100,
    woodYield: 25,
    woodRegrowDays: 15,
    color: '#2f9e44',
    badge: '🌳'
  },
  pine_tree: {
    id: 'pine_tree',
    name: 'Tùng Cổ Thụ',
    category: 'tree',
    tier: 0,
    description: 'Ngạo nghễ trong sương tuyết giá rét, ưa thích đỉnh núi cao và cao nguyên.',
    growthDurationDays: 45,
    preferredTerrain: [TerrainType.MOUNTAIN, TerrainType.PLATEAU],
    qiAbsorptionRate: 0.15,
    naturalSpawnWeight: 80,
    woodYield: 20,
    woodRegrowDays: 20,
    color: '#2b8a3e',
    badge: '🌲'
  },
  willow_tree: {
    id: 'willow_tree',
    name: 'Liễu Rủ Đầm Lầy',
    category: 'tree',
    tier: 0,
    description: 'Cành rủ thướt tha bên vũng nước lầy lội, có khả năng lọc bớt chướng khí độc hại.',
    growthDurationDays: 25,
    preferredTerrain: [TerrainType.SWAMP],
    qiAbsorptionRate: 0.12,
    naturalSpawnWeight: 70,
    woodYield: 15,
    woodRegrowDays: 12,
    color: '#37b24d',
    badge: '🌿'
  },

  // 2. THỰC VẬT LƯƠNG THỰC HÁI LƯỢM (LÀM THỨC ĂN CHO CƯ DÂN)
  berry_bush: {
    id: 'berry_bush',
    name: 'Bụi Linh Quả Dại',
    category: 'food',
    tier: 0,
    description: 'Bụi cây quả mọng ngọt ngào, chứa một chút linh khí tự nhiên, là nguồn thức ăn quý giá cho phàm nhân và dã thú.',
    growthDurationDays: 8,
    preferredTerrain: [TerrainType.PLAIN, TerrainType.DENSE_FOREST, TerrainType.HILL],
    qiAbsorptionRate: 0.2,
    naturalSpawnWeight: 120,
    healingValue: 15,
    fruitYield: 2,
    fruitRegrowDays: 3,
    color: '#f03e3e',
    badge: '🍓'
  },
  edible_mushroom: {
    id: 'edible_mushroom',
    name: 'Nấm Rừng Bào Tử',
    category: 'food',
    tier: 0,
    description: 'Mọc ở gốc cây mục ẩm ướt trong đầm lầy và rừng rậm, giàu dưỡng chất có thể ăn ngay.',
    growthDurationDays: 6,
    preferredTerrain: [TerrainType.SWAMP, TerrainType.DENSE_FOREST],
    qiAbsorptionRate: 0.25,
    naturalSpawnWeight: 90,
    healingValue: 10,
    fruitYield: 1,
    fruitRegrowDays: 4,
    color: '#e8590c',
    badge: '🍄'
  },
  wild_fruit_tree: {
    id: 'wild_fruit_tree',
    name: 'Cây Ăn Quả Rừng',
    category: 'food',
    tier: 0,
    description: 'Cây ăn quả thân gỗ lớn, quả mọng thơm ngon, thân gỗ có thể khai thác khi cần thiết.',
    growthDurationDays: 16,
    preferredTerrain: [TerrainType.PLAIN, TerrainType.DENSE_FOREST, TerrainType.HILL],
    qiAbsorptionRate: 0.15,
    naturalSpawnWeight: 80,
    healingValue: 20,
    fruitYield: 3,
    fruitRegrowDays: 5,
    woodYield: 12,
    woodRegrowDays: 15,
    color: '#e67700',
    badge: '🍎'
  },

  // 3. LINH DƯỢC (CẤP 1 - 4)
  ngung_huyet_thao: {
    id: 'ngung_huyet_thao',
    name: 'Ngưng Huyết Thảo (Cấp 1)',
    category: 'spirit_herb',
    tier: 1,
    description: 'Lá cây có vân đỏ như máu, có công hiệu cầm máu vết thương và bồi bổ khí huyết cho tu sĩ Luyện Khí.',
    growthDurationDays: 20,
    preferredTerrain: [TerrainType.PLAIN, TerrainType.HILL],
    qiAbsorptionRate: 0.6,
    naturalSpawnWeight: 20,
    healingValue: 60,
    color: '#e03131',
    glowColor: 'rgba(224, 49, 49, 0.6)',
    badge: '🌱'
  },
  tu_linh_diep: {
    id: 'tu_linh_diep',
    name: 'Tụ Linh Thảo (Cấp 1)',
    category: 'spirit_herb',
    tier: 1,
    description: 'Lá cây tự động gom tụ linh khí bốn phương, đẩy nhanh tốc độ tu luyện khi ngồi gần.',
    growthDurationDays: 24,
    preferredTerrain: [TerrainType.DENSE_FOREST, TerrainType.PLATEAU],
    qiAbsorptionRate: 1.0,
    naturalSpawnWeight: 15,
    color: '#38d9a9',
    glowColor: 'rgba(56, 217, 169, 0.7)',
    badge: '☘️'
  },
  tay_tuy_chi: {
    id: 'tay_tuy_chi',
    name: 'Tẩy Tủy Nấm Linh Chi (Cấp 2)',
    category: 'spirit_herb',
    tier: 2,
    description: 'Dược liệu chủ chốt dùng để luyện chế Trúc Cơ Đan, giúp tu sĩ tẩy kinh phạt tủy, loại bỏ tạp chất cơ thể.',
    growthDurationDays: 60,
    preferredTerrain: [TerrainType.MOUNTAIN, TerrainType.DENSE_FOREST],
    qiAbsorptionRate: 1.8,
    naturalSpawnWeight: 5,
    healingValue: 180,
    color: '#748ffc',
    glowColor: 'rgba(116, 143, 252, 0.8)',
    badge: '🍄'
  },
  huyet_sam_ngan_nam: {
    id: 'huyet_sam_ngan_nam',
    name: 'Thiên Niên Huyết Sâm (Cấp 3)',
    category: 'spirit_herb',
    tier: 3,
    description: 'Hấp thu địa mạch tinh hoa qua ngàn năm, củ sâm hóa hình nhân, gia tăng thọ nguyên và củng cố Kim Đan.',
    growthDurationDays: 180,
    preferredTerrain: [TerrainType.MOUNTAIN, TerrainType.PLATEAU],
    qiAbsorptionRate: 3.5,
    naturalSpawnWeight: 0.8,
    lifespanBonusValue: 30, // Tăng 30 năm thọ mệnh
    healingValue: 500,
    color: '#fcc419',
    glowColor: 'rgba(252, 196, 25, 0.9)',
    badge: '🥕'
  },
  hoa_anh_thao: {
    id: 'hoa_anh_thao',
    name: 'Hóa Anh Thần Thảo (Cấp 4)',
    category: 'spirit_herb',
    tier: 4,
    description: 'Cực phẩm thiên tài địa bảo phụ trợ đột phá Nguyên Anh Cảnh, trăm năm khó gặp.',
    growthDurationDays: 360,
    preferredTerrain: [TerrainType.MOUNTAIN],
    qiAbsorptionRate: 6.0,
    naturalSpawnWeight: 0.05,
    lifespanBonusValue: 100, // Tăng 100 năm thọ mệnh
    healingValue: 1500,
    color: '#cc5de8',
    glowColor: 'rgba(204, 93, 232, 1.0)',
    badge: '🪷'
  },

  // 4. THẦN DƯỢC CỰC PHẨM (TỶ LỆ XUẤT HIỆN CỰC THẤP CHỈ 0.0001% = 0.000001)
  cuu_diep_chi_lan: {
    id: 'cuu_diep_chi_lan',
    name: 'Cửu Diệp Chi Lan (Thần Dược)',
    category: 'divine_herb',
    tier: 5,
    description: 'Thần thảo chín lá tỏa hào quang cửu sắc, chỉ sinh ra tại nơi tiên khí / hỗn độn khí hội tụ. Một lá có thể cải tử hoàn sinh, tăng thọ 500 năm!',
    growthDurationDays: 720,
    preferredTerrain: [TerrainType.MOUNTAIN, TerrainType.PLATEAU],
    qiAbsorptionRate: 15.0,
    naturalSpawnWeight: 0.000001, // TỶ LỆ TỰ NHIÊN 0.0001% THEO YÊU CẦU
    lifespanBonusValue: 500,
    healingValue: 9999,
    color: '#ffffff',
    glowColor: 'rgba(255, 255, 255, 1.0)',
    badge: '🌟'
  },
  hon_don_lien: {
    id: 'hon_don_lien',
    name: 'Thất Thải Hỗn Độn Liên (Thần Dược)',
    category: 'divine_herb',
    tier: 5,
    description: 'Hoa sen nở từ thuở khai thiên lập địa, hấp thu Hỗn Độn Khí, là chí bảo vô giá của chư thiên thần ma.',
    growthDurationDays: 1200,
    preferredTerrain: [TerrainType.SWAMP, TerrainType.MOUNTAIN],
    qiAbsorptionRate: 25.0,
    naturalSpawnWeight: 0.000001, // TỶ LỆ TỰ NHIÊN 0.0001% THEO YÊU CẦU
    lifespanBonusValue: 1000,
    healingValue: 99999,
    color: '#ffd43b',
    glowColor: 'rgba(255, 212, 59, 1.0)',
    badge: '🪷'
  }
};
