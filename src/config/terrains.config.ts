export enum TerrainType {
  PLAIN = 'plain',             // Đồng bằng: Ôn hòa, đi lại thuận lợi, dễ sinh sống
  HILL = 'hill',               // Đồi: Dốc thoải, cây cối trung bình
  MOUNTAIN = 'mountain',       // Núi: Hiểm trở, lạnh, khoáng sản, linh khí cao
  SWAMP = 'swamp',             // Đầm lầy: Chướng khí, lầy lội, dược liệu thủy/mộc độc
  PLATEAU = 'plateau',         // Cao nguyên: Khô, gió lớn, linh khí tinh khiết
  DENSE_FOREST = 'dense_forest',// Rừng rậm: Cây cối rậm rạp, dã thú nhiều, linh mộc dồi dào
  RIVER = 'river',             // Sông ngòi: Dòng nước uốn lượn, phù sa màu mỡ
  LAKE = 'lake',               // Hồ nước: Mặt hồ trong xanh, hoa sen, tụ linh khí
  OCEAN = 'ocean'              // Biển cả: Đại dương bao la, sóng biếc dập dềnh
}

export interface TerrainProperties {
  id: TerrainType;
  name: string;
  description: string;
  moveSpeedModifier: number;     // 1.0 = bình thường, < 1.0 = chậm chạp, > 1.0 = nhanh
  tempMin: number;               // Giới hạn nhiệt độ thấp nhất (°C)
  tempMax: number;               // Giới hạn nhiệt độ cao nhất (°C)
  baseTemp: number;              // Nhiệt độ cơ bản tiêu chuẩn (°C)
  plantGrowthRate: number;       // Tỷ lệ sinh trưởng thực vật (hệ số nhân)
  baseQiDensity: number;         // Mật độ linh khí cơ bản của vùng đất
  primaryColor: string;          // Màu pixel đại diện chính
  secondaryColor: string;        // Màu pixel phụ tạo texture
  accentColor: string;           // Màu điểm nhấn
}

export const TERRAIN_CONFIGS: Record<TerrainType, TerrainProperties> = {
  [TerrainType.PLAIN]: {
    id: TerrainType.PLAIN,
    name: 'Đồng Bằng',
    description: 'Vùng đất bằng phẳng phì nhiêu, nhiệt độ ôn hòa, dễ di chuyển và canh tác.',
    moveSpeedModifier: 1.0,
    tempMin: 10,
    tempMax: 32,
    baseTemp: 22,
    plantGrowthRate: 1.2,
    baseQiDensity: 15,
    primaryColor: '#5a9632',
    secondaryColor: '#4d822b',
    accentColor: '#6da73f'
  },
  [TerrainType.HILL]: {
    id: TerrainType.HILL,
    name: 'Đồi Thấp',
    description: 'Địa hình mấp mô lượn sóng, di chuyển hơi chậm hơn, cây cối sinh trưởng vừa phải.',
    moveSpeedModifier: 0.85,
    tempMin: 5,
    tempMax: 28,
    baseTemp: 18,
    plantGrowthRate: 0.9,
    baseQiDensity: 25,
    primaryColor: '#8a9a42',
    secondaryColor: '#758334',
    accentColor: '#9bb04d'
  },
  [TerrainType.MOUNTAIN]: {
    id: TerrainType.MOUNTAIN,
    name: 'Núi Cao',
    description: 'Đỉnh núi cheo leo hiểm trở, nhiệt độ băng giá, di chuyển khó khăn nhưng tích tụ thiên địa linh khí.',
    moveSpeedModifier: 0.55,
    tempMin: -15,
    tempMax: 15,
    baseTemp: 4,
    plantGrowthRate: 0.3,
    baseQiDensity: 60,
    primaryColor: '#75797d',
    secondaryColor: '#5c6063',
    accentColor: '#adb3b8'
  },
  [TerrainType.SWAMP]: {
    id: TerrainType.SWAMP,
    name: 'Đầm Lầy',
    description: 'Vùng nước đọng ẩm ướt lầy lội, chướng khí độc hại, di chuyển rất chậm.',
    moveSpeedModifier: 0.5,
    tempMin: 15,
    tempMax: 38,
    baseTemp: 26,
    plantGrowthRate: 0.7,
    baseQiDensity: 30,
    primaryColor: '#3d4d38',
    secondaryColor: '#2b3627',
    accentColor: '#526645'
  },
  [TerrainType.PLATEAU]: {
    id: TerrainType.PLATEAU,
    name: 'Cao Nguyên',
    description: 'Vùng đất cao lộng gió, khô ráo, linh khí tinh khiết thích hợp mở tông môn tu luyện.',
    moveSpeedModifier: 0.95,
    tempMin: 0,
    tempMax: 24,
    baseTemp: 14,
    plantGrowthRate: 0.75,
    baseQiDensity: 45,
    primaryColor: '#ab9567',
    secondaryColor: '#947f52',
    accentColor: '#bdab7d'
  },
  [TerrainType.DENSE_FOREST]: {
    id: TerrainType.DENSE_FOREST,
    name: 'Rừng Rậm',
    description: 'Rừng cây bạt ngàn, thảo mộc dồi dào, nhiều dã thú yêu thú ẩn nấp.',
    moveSpeedModifier: 0.75,
    tempMin: 8,
    tempMax: 30,
    baseTemp: 20,
    plantGrowthRate: 1.6,
    baseQiDensity: 40,
    primaryColor: '#265922',
    secondaryColor: '#1d421a',
    accentColor: '#367a30'
  },
  [TerrainType.RIVER]: {
    id: TerrainType.RIVER,
    name: 'Sông Ngòi',
    description: 'Dòng sông uốn lượn chảy từ núi cao ra biển, nguồn nước dồi dào, phù sa màu mỡ.',
    moveSpeedModifier: 0.35,
    tempMin: 8,
    tempMax: 28,
    baseTemp: 19,
    plantGrowthRate: 1.5,
    baseQiDensity: 35,
    primaryColor: '#2b6cb0',
    secondaryColor: '#4299e1',
    accentColor: '#bee3f8'
  },
  [TerrainType.LAKE]: {
    id: TerrainType.LAKE,
    name: 'Hồ Nước',
    description: 'Mặt hồ tĩnh lặng trong vắt như gương, hoa sen nở rộ, tích tụ thủy linh khí thanh khiết.',
    moveSpeedModifier: 0.25,
    tempMin: 5,
    tempMax: 26,
    baseTemp: 17,
    plantGrowthRate: 1.3,
    baseQiDensity: 50,
    primaryColor: '#1a4971',
    secondaryColor: '#2b6cb0',
    accentColor: '#7dd3fc'
  },
  [TerrainType.OCEAN]: {
    id: TerrainType.OCEAN,
    name: 'Biển Cả',
    description: 'Đại dương mênh mông vô tận, sóng biếc dập dềnh, ranh giới hải vực thiên địa.',
    moveSpeedModifier: 0.18,
    tempMin: 2,
    tempMax: 25,
    baseTemp: 16,
    plantGrowthRate: 0.5,
    baseQiDensity: 40,
    primaryColor: '#0c2d48',
    secondaryColor: '#145da0',
    accentColor: '#2e8bc0'
  }
};
