/**
 * tools.config.ts
 * Hệ thống Công Cụ Lao Động (Work Tools) trong thế giới Tu Tiên & Đời Sống Phàm Nhân.
 * Bao gồm các nông cụ, dụng cụ lâm nghiệp, xây dựng, hái lượm, khai khoáng và ngư nghiệp.
 */

export type ToolType =
  | 'hoe'          // Cuốc làm đất, trồng trọt
  | 'axe'          // Rìu đốn củi, khai thác gỗ
  | 'hammer'       // Búa thợ xây, sửa chữa và kiến thiết
  | 'sickle'       // Liềm thu hoạch, cắt cỏ, hái thảo dược
  | 'pickaxe'      // Cuốc chim khai khoáng, đào giếng nước, phá đá
  | 'fishing_rod'  // Cần câu cá bên suối, khai thác thủy sản
  | 'watering_pot';// Thùng/bình tưới nước cho cây trồng, linh điền

export type ToolTier = 'wood' | 'stone' | 'iron' | 'spirit' | 'celestial';

export interface ToolDefinition {
  id: string;
  name: string;
  type: ToolType;
  tier: ToolTier;
  workEfficiencyMultiplier: number; // Hệ số nhân tốc độ lao động (ví dụ: 1.5 = nhanh hơn 50%)
  harvestYieldBonus: number;        // Thêm sản lượng khi thu hoạch (+1, +2 nông sản)
  durability: number;               // Độ bền cơ bản của công cụ
  baseDamage: number;               // Sát thương tự vệ khi bất ngờ bị quái thú tấn công
  attackSpeed: number;              // Tốc độ đánh tự vệ (đòn/giây)
  range: number;                    // Tầm với (pixels)
  badge: string;                    // Biểu tượng icon
  color: string;                    // Màu sắc lưỡi/thân công cụ khi vẽ trên tay
  glowColor?: string;               // Hào quang linh khí (nếu có)
  categoryName: string;             // Tên nhóm ngành nghề
  description: string;              // Giới thiệu lai lịch & tác dụng
  iconPath?: string;
}

export const TOOL_TIER_NAMES: Record<ToolTier, { name: string; color: string; badge: string }> = {
  wood: { name: 'Phàm Mộc', color: '#a16207', badge: '🪵' },
  stone: { name: 'Thô Thạch', color: '#94a3b8', badge: '🪨' },
  iron: { name: 'Bách Luyện Thiết', color: '#38bdf8', badge: '⚙️' },
  spirit: { name: 'Linh Khí Bảo Cụ', color: '#a855f7', badge: '✨' },
  celestial: { name: 'Thần Công Tiên Cụ', color: '#facc15', badge: '🌟' }
};

export const TOOL_DEFINITIONS: Record<string, ToolDefinition> = {
  // =========================================================================
  // 1. CUỐC NÔNG NGHIỆP (HOE) - Dành cho Nông Dân
  // =========================================================================
  wooden_hoe: {
    id: 'wooden_hoe',
    name: 'Cuốc Gỗ Sồi',
    type: 'hoe',
    tier: 'wood',
    workEfficiencyMultiplier: 1.25,
    harvestYieldBonus: 0,
    durability: 100,
    baseDamage: 7,
    attackSpeed: 0.9,
    range: 22,
    badge: '🌾',
    color: '#b45309',
    categoryName: 'Nông Cụ',
    description: 'Chiếc cuốc gỗ sồi đẽo mộc mạc, giúp nông dân cuốc đất vỡ luống gieo cấy lúa nước.'
  },
  iron_hoe: {
    id: 'iron_hoe',
    name: 'Cuốc Thép Bách Luyện',
    type: 'hoe',
    tier: 'iron',
    workEfficiencyMultiplier: 1.75,
    harvestYieldBonus: 1,
    durability: 350,
    baseDamage: 14,
    attackSpeed: 1.0,
    range: 24,
    badge: '🌾',
    color: '#94a3b8',
    glowColor: 'rgba(148, 163, 184, 0.4)',
    categoryName: 'Nông Cụ',
    description: 'Rèn từ thép cứng tinh luyện, lưỡi cuốc bén ngọt xới tơi đất thịt sét, tăng thêm sản lượng lúa thóc.'
  },
  spirit_hoe: {
    id: 'spirit_hoe',
    name: 'Linh Ngọc Sơ Điền Hạo',
    type: 'hoe',
    tier: 'spirit',
    workEfficiencyMultiplier: 2.6,
    harvestYieldBonus: 2,
    durability: 1000,
    baseDamage: 32,
    attackSpeed: 1.2,
    range: 26,
    badge: '✨',
    color: '#34d399',
    glowColor: 'rgba(52, 211, 153, 0.8)',
    categoryName: 'Linh Nông Bảo Cụ',
    description: 'Chế tác từ linh ngọc xanh biếc, mỗi nhát cuốc đều dẫn động địa mạch sinh khí, lúa trổ bông trĩu hạt.'
  },

  // =========================================================================
  // 2. RÌU ĐỐN CỦI & LÂM NGHIỆP (AXE) - Dành cho Tiều Phu / Dọn Rừng
  // =========================================================================
  flint_axe: {
    id: 'flint_axe',
    name: 'Rìu Đá Thạch Anh',
    type: 'axe',
    tier: 'stone',
    workEfficiencyMultiplier: 1.2,
    harvestYieldBonus: 0,
    durability: 120,
    baseDamage: 9,
    attackSpeed: 0.85,
    range: 22,
    badge: '🪓',
    color: '#78716c',
    categoryName: 'Lâm Nghiệp',
    description: 'Lưỡi đá mài sắc gắn chặt vào cán gỗ bằng dây gai, dùng chặt cành bẻ củi mưu sinh.'
  },
  steel_axe: {
    id: 'steel_axe',
    name: 'Hắc Thiết Tiều Phủ',
    type: 'axe',
    tier: 'iron',
    workEfficiencyMultiplier: 1.8,
    harvestYieldBonus: 1,
    durability: 400,
    baseDamage: 18,
    attackSpeed: 0.95,
    range: 24,
    badge: '🪓',
    color: '#475569',
    glowColor: 'rgba(100, 116, 139, 0.5)',
    categoryName: 'Lâm Nghiệp',
    description: 'Lưỡi búa thép nặng chịch và sắc bén, đốn ngã đại thụ trăm năm chỉ trong vài tuần hương.'
  },
  spirit_axe: {
    id: 'spirit_axe',
    name: 'Khai Sơn Phách Mộc Phủ',
    type: 'axe',
    tier: 'spirit',
    workEfficiencyMultiplier: 2.8,
    harvestYieldBonus: 3,
    durability: 1200,
    baseDamage: 38,
    attackSpeed: 1.15,
    range: 28,
    badge: '🌟',
    color: '#fbbf24',
    glowColor: 'rgba(251, 191, 36, 0.8)',
    categoryName: 'Lâm Nghiệp Thần Khí',
    description: 'Rìu linh tụ phong lôi chân khí, chém một nhát gỗ thơm bay ngào ngạt, xẻ gỗ ngàn năm nhẹ như chẻ tre.'
  },

  // =========================================================================
  // 3. BÚA THỢ XÂY & KIẾN THIẾT (HAMMER) - Dành cho Thợ Xây Dựng
  // =========================================================================
  wooden_hammer: {
    id: 'wooden_hammer',
    name: 'Búa Gỗ Thợ Dựng',
    type: 'hammer',
    tier: 'wood',
    workEfficiencyMultiplier: 1.3,
    harvestYieldBonus: 0,
    durability: 150,
    baseDamage: 8,
    attackSpeed: 0.9,
    range: 20,
    badge: '🔨',
    color: '#d97706',
    categoryName: 'Xây Dựng',
    description: 'Chiếc búa gỗ đẽo tròn của thợ mộc đầu làng, gõ mộng kèo nhà tranh, dựng lều vách nứa.'
  },
  iron_hammer: {
    id: 'iron_hammer',
    name: 'Thiết Chùy Xây Dựng',
    type: 'hammer',
    tier: 'iron',
    workEfficiencyMultiplier: 1.85,
    harvestYieldBonus: 0,
    durability: 500,
    baseDamage: 19,
    attackSpeed: 0.9,
    range: 22,
    badge: '🔨',
    color: '#64748b',
    glowColor: 'rgba(56, 189, 248, 0.4)',
    categoryName: 'Xây Dựng',
    description: 'Đầu búa thép đúc nguyên khối nặng ngàn cân, đóng cọc kiên cố, sửa chữa hư hỏng nhanh chóng.'
  },
  celestial_hammer: {
    id: 'celestial_hammer',
    name: 'Lỗ Ban Thần Chùy',
    type: 'hammer',
    tier: 'celestial',
    workEfficiencyMultiplier: 3.0,
    harvestYieldBonus: 0,
    durability: 2500,
    baseDamage: 45,
    attackSpeed: 1.1,
    range: 26,
    badge: '⚡',
    color: '#c084fc',
    glowColor: 'rgba(192, 132, 252, 0.9)',
    categoryName: 'Thần Công Kiến Thiết',
    description: 'Thần khí Lỗ Ban lưu truyền vạn thế, vung búa tạo tác điện các lộng lẫy, hồi phục độ bền tức thì.'
  },

  // =========================================================================
  // 4. LIỀM DƯỢC THẢO & THU HOẠCH (SICKLE) - Dành cho Thợ Hái Lượm
  // =========================================================================
  iron_sickle: {
    id: 'iron_sickle',
    name: 'Liềm Sắt Dược Nông',
    type: 'sickle',
    tier: 'iron',
    workEfficiencyMultiplier: 1.5,
    harvestYieldBonus: 1,
    durability: 300,
    baseDamage: 11,
    attackSpeed: 1.3,
    range: 20,
    badge: '🌾',
    color: '#94a3b8',
    categoryName: 'Hái Lượm',
    description: 'Lưỡi liềm răng cưa sắc bén chuyên cắt lúa, hái dâu rừng và thu gom rơm rạ không nát thân cây.'
  },
  spirit_sickle: {
    id: 'spirit_sickle',
    name: 'Huyền Ngọc Liêm',
    type: 'sickle',
    tier: 'spirit',
    workEfficiencyMultiplier: 2.4,
    harvestYieldBonus: 2,
    durability: 800,
    baseDamage: 26,
    attackSpeed: 1.5,
    range: 22,
    badge: '✨',
    color: '#2dd4bf',
    glowColor: 'rgba(45, 212, 191, 0.8)',
    categoryName: 'Linh Thảo Bảo Liêm',
    description: 'Lưỡi ngọc liêm phong kín linh khí khi cắt cuống, giữ vẹn nguyên dược tính của thiên địa linh thảo.'
  },

  // =========================================================================
  // 5. CUỐC CHIM KHAI KHOÁNG (PICKAXE) - Đào Giếng & Khai Khai Mỏ
  // =========================================================================
  iron_pickaxe: {
    id: 'iron_pickaxe',
    name: 'Cuốc Chim Hắc Thiết',
    type: 'pickaxe',
    tier: 'iron',
    workEfficiencyMultiplier: 1.6,
    harvestYieldBonus: 1,
    durability: 450,
    baseDamage: 16,
    attackSpeed: 0.9,
    range: 22,
    badge: '⛏️',
    color: '#334155',
    categoryName: 'Khai Khoáng',
    description: 'Mũi nhọn đúc bằng huyền thiết tôi nước lạnh, đục vỡ nham thạch cứng, khơi thông mạch giếng nước ngầm.'
  },
  spirit_pickaxe: {
    id: 'spirit_pickaxe',
    name: 'Phá Nham Khai Linh Hạo',
    type: 'pickaxe',
    tier: 'spirit',
    workEfficiencyMultiplier: 2.7,
    harvestYieldBonus: 2,
    durability: 1100,
    baseDamage: 36,
    attackSpeed: 1.1,
    range: 26,
    badge: '💎',
    color: '#38bdf8',
    glowColor: 'rgba(56, 189, 248, 0.85)',
    categoryName: 'Linh Khoáng Khí',
    description: 'Chấn động mũi cuốc phát ra linh quang xuyên thấu lòng đất, khai thác quặng linh thạch nguyên khối tinh khiết.'
  },

  // =========================================================================
  // 6. CẦN CÂU TRÚC XANH (FISHING ROD) - Đồ Ngư Duyên Thủy
  // =========================================================================
  bamboo_rod: {
    id: 'bamboo_rod',
    name: 'Cần Trúc Xanh',
    type: 'fishing_rod',
    tier: 'wood',
    workEfficiencyMultiplier: 1.3,
    harvestYieldBonus: 0,
    durability: 160,
    baseDamage: 5,
    attackSpeed: 1.1,
    range: 30,
    badge: '🎣',
    color: '#84cc16',
    categoryName: 'Ngư Nghiệp',
    description: 'Thân trúc già dẻo dai bên suối, gắn dây cước bện lông đuôi ngựa, buông cần ngắm non nước hữu tình.'
  },
  spirit_rod: {
    id: 'spirit_rod',
    name: 'Huyền Ti Long Tu Cần',
    type: 'fishing_rod',
    tier: 'spirit',
    workEfficiencyMultiplier: 2.5,
    harvestYieldBonus: 2,
    durability: 900,
    baseDamage: 22,
    attackSpeed: 1.3,
    range: 35,
    badge: '🐉',
    color: '#e2e8f0',
    glowColor: 'rgba(226, 232, 240, 0.9)',
    categoryName: 'Ngư Nghiệp Tiên Khí',
    description: 'Cần trúc ngàn năm gắn tơ râu rồng, có thể câu được cả cá chép hóa rồng cùng linh ngư ẩn sâu đáy vực.'
  },

  // =========================================================================
  // 7. THÙNG TƯỚI NƯỚC (WATERING POT) - Thủy Nông & Linh Điền
  // =========================================================================
  wooden_bucket: {
    id: 'wooden_bucket',
    name: 'Thùng Gỗ Gánh Nước',
    type: 'watering_pot',
    tier: 'wood',
    workEfficiencyMultiplier: 1.3,
    harvestYieldBonus: 0,
    durability: 180,
    baseDamage: 6,
    attackSpeed: 0.8,
    range: 18,
    badge: '🪣',
    color: '#92400e',
    categoryName: 'Thủy Nông',
    description: 'Đôi thùng gỗ thông ghép vòng đai tre, nông dân gánh nước mát tưới cho vườn rau và đồng lúa đang thì con gái.'
  },
  spirit_watering_pot: {
    id: 'spirit_watering_pot',
    name: 'Cam Lộ Linh Hồ',
    type: 'watering_pot',
    tier: 'spirit',
    workEfficiencyMultiplier: 2.6,
    harvestYieldBonus: 2,
    durability: 1000,
    baseDamage: 20,
    attackSpeed: 1.0,
    range: 24,
    badge: '🏺',
    color: '#06b6d4',
    glowColor: 'rgba(6, 182, 212, 0.85)',
    categoryName: 'Linh Điền Cam Lộ',
    description: 'Bình ngọc đựng sương sớm thiên nhiên, rót ra mưa cam lộ nhuận trạch vạn vật, cây non đâm chồi vươn mình tức thì.'
  },
  raven_forest_axe: {
    id: 'raven_forest_axe',
    name: 'Rìu Lâm Sơn',
    type: 'axe',
    tier: 'iron',
    workEfficiencyMultiplier: 1.65,
    harvestYieldBonus: 1,
    durability: 360,
    baseDamage: 16,
    attackSpeed: 0.95,
    range: 23,
    badge: '🪓',
    color: '#64748b',
    iconPath: 'assets/sprites/items/tools/raven_forest_axe.png',
    categoryName: 'Lâm Nghiệp',
    description: 'Rìu thép chắc tay, tăng tốc độ đốn gỗ và thêm một phần gỗ thu hoạch.'
  },
  raven_quarry_pick: {
    id: 'raven_quarry_pick',
    name: 'Cuốc Chim Khai Nham',
    type: 'pickaxe',
    tier: 'iron',
    workEfficiencyMultiplier: 1.7,
    harvestYieldBonus: 1,
    durability: 480,
    baseDamage: 18,
    attackSpeed: 0.95,
    range: 23,
    badge: '⛏️',
    color: '#38bdf8',
    iconPath: 'assets/sprites/items/tools/raven_quarry_pick.png',
    categoryName: 'Khai Khoáng',
    description: 'Cuốc chim cân bằng dành cho việc khai phá đá và khoáng vật.'
  },
  raven_moon_sickle: {
    id: 'raven_moon_sickle',
    name: 'Nguyệt Ảnh Liêm',
    type: 'sickle',
    tier: 'spirit',
    workEfficiencyMultiplier: 2.0,
    harvestYieldBonus: 2,
    durability: 720,
    baseDamage: 22,
    attackSpeed: 1.4,
    range: 22,
    badge: '🌾',
    color: '#a78bfa',
    iconPath: 'assets/sprites/items/tools/raven_moon_sickle.png',
    categoryName: 'Linh Thảo Bảo Liêm',
    description: 'Liềm linh lực sắc bén, thu hoạch thêm dược liệu mà không vượt phẩm cấp cao nhất hiện có.'
  }
};
