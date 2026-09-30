export interface RealmStage {
  name: string;                // Tên cảnh giới (vd: Luyện Khí, Trúc Cơ...)
  subStages?: string[];        // Tầng nhỏ: Sơ kỳ, Trung kỳ, Hậu kỳ, Viên mãn (hoặc Tầng 1-9)
  lifespanBonus: number;       // Thọ nguyên gia tăng (năm)
  baseCombatPower: number;     // Sức mạnh chiến đấu cơ bản
  qiRequired: number;          // Lượng linh khí cần tích lũy để thử đột phá
  tribulationRequired: boolean;// Có cần vượt Lôi Kiếp để đột phá không
  color: string;               // Màu hào quang cảnh giới
}

export interface RealmChain {
  id: string;
  name: string;
  stages: RealmStage[];
}

export const REALM_CHAINS: Record<string, RealmChain> = {
  // Cảnh giới Nhân Tộc
  human_realms: {
    id: 'human_realms',
    name: 'Nhân Đạo Tu Tiên',
    stages: [
      {
        name: 'Phàm Nhân',
        subStages: ['Bình Phàm'],
        lifespanBonus: 0,
        baseCombatPower: 10,
        qiRequired: 50,
        tribulationRequired: false,
        color: '#adb5bd' // Xám trắng
      },
      {
        name: 'Luyện Khí',
        subStages: ['Tầng 1', 'Tầng 2', 'Tầng 3', 'Tầng 4', 'Tầng 5', 'Tầng 6', 'Tầng 7', 'Tầng 8', 'Tầng 9'],
        lifespanBonus: 50, // Thọ mệnh ~130 năm
        baseCombatPower: 50,
        qiRequired: 300,
        tribulationRequired: false,
        color: '#51cf66' // Lục sơ khai
      },
      {
        name: 'Trúc Cơ',
        subStages: ['Sơ Kỳ', 'Trung Kỳ', 'Hậu Kỳ', 'Viên Mãn'],
        lifespanBonus: 200, // Thọ mệnh ~300 năm
        baseCombatPower: 250,
        qiRequired: 1200,
        tribulationRequired: false,
        color: '#339af0' // Lam linh quang
      },
      {
        name: 'Kết Đan',
        subStages: ['Kim Đan Sơ Kỳ', 'Kim Đan Trung Kỳ', 'Kim Đan Hậu Kỳ', 'Kim Đan Cực Hạn'],
        lifespanBonus: 500, // Thọ mệnh ~800 năm
        baseCombatPower: 1200,
        qiRequired: 5000,
        tribulationRequired: true, // Cần vượt Tam Cửu Lôi Kiếp
        color: '#fcc419' // Hoàng kim rực rỡ
      },
      {
        name: 'Nguyên Anh',
        subStages: ['Nguyên Anh Sơ Kỳ', 'Nguyên Anh Trung Kỳ', 'Nguyên Anh Hậu Kỳ', 'Đại Viên Mãn'],
        lifespanBonus: 1200, // Thọ mệnh ~2000 năm
        baseCombatPower: 6000,
        qiRequired: 20000,
        tribulationRequired: true, // Cần vượt Lục Cửu Thiên Kiếp
        color: '#cc5de8' // Tím tôn quý
      }
    ]
  },

  // Cảnh giới Yêu Tộc
  beast_realms: {
    id: 'beast_realms',
    name: 'Yêu Đạo Luyện Thể',
    stages: [
      {
        name: 'Yêu Sinh',
        subStages: ['Sơ Sinh', 'Tụ Yêu'],
        lifespanBonus: 0,
        baseCombatPower: 25,
        qiRequired: 80,
        tribulationRequired: false,
        color: '#868e96'
      },
      {
        name: 'Luyện Yêu',
        subStages: ['Sơ Giai', 'Thông Linh'],
        lifespanBonus: 150,
        baseCombatPower: 120,
        qiRequired: 500,
        tribulationRequired: false,
        color: '#94d82d'
      },
      {
        name: 'Hóa Hình',
        subStages: ['Bán Hóa', 'Chân Thân Hóa Hình'],
        lifespanBonus: 400,
        baseCombatPower: 600,
        qiRequired: 2500,
        tribulationRequired: true, // Lôi kiếp hóa hình
        color: '#ff922b'
      },
      {
        name: 'Kết Đan (Yêu Đan)',
        subStages: ['Ngưng Đan', 'Đan Hỏa Thối Thể'],
        lifespanBonus: 1000,
        baseCombatPower: 3000,
        qiRequired: 10000,
        tribulationRequired: true,
        color: '#f76707'
      }
    ]
  },

  // Cảnh giới Ma Tộc
  demon_realms: {
    id: 'demon_realms',
    name: 'Ma Đạo Thôn Phệ',
    stages: [
      {
        name: 'Ma Tốt',
        subStages: ['Huyết Tốt'],
        lifespanBonus: 0,
        baseCombatPower: 30,
        qiRequired: 100,
        tribulationRequired: false,
        color: '#495057'
      },
      {
        name: 'Ma Binh',
        subStages: ['Sơ Giai', 'Trung Giai', 'Đỉnh Phong'],
        lifespanBonus: 120,
        baseCombatPower: 150,
        qiRequired: 600,
        tribulationRequired: false,
        color: '#c92a2a'
      },
      {
        name: 'Ma Tướng',
        subStages: ['Cuồng Ma', 'Huyết Ma'],
        lifespanBonus: 450,
        baseCombatPower: 800,
        qiRequired: 3000,
        tribulationRequired: false,
        color: '#a61e4d'
      },
      {
        name: 'Ma Vương',
        subStages: ['Ma Vực Chúa Tể'],
        lifespanBonus: 1500,
        baseCombatPower: 7000,
        qiRequired: 22000,
        tribulationRequired: true,
        color: '#862e9c'
      }
    ]
  }
};
