export type PillType = 'healing' | 'revive' | 'lifespan' | 'breakthrough' | 'buff';

export interface PillDefinition {
  id: string;
  name: string;
  type: PillType;
  tier: number;               // Cấp 1: Luyện Khí, 2: Trúc Cơ, 3: Kết Đan, 4: Nguyên Anh
  description: string;
  color: string;
  badge: string;
  healAmount?: number;        // Lượng máu hồi phục
  lifespanBonusYears?: number;// Số năm tuổi thọ cộng thêm
  breakthroughBonus?: number; // Tỷ lệ đột phá cộng thêm
  buffDamageMultiplier?: number; // Tăng công kích tạm thời
  buffDurationSeconds?: number;
  reviveHealthPercent?: number;  // Tỷ lệ máu hồi sinh khi tử nạn (vd: 50%)
}

export const PILL_DEFINITIONS: Record<string, PillDefinition> = {
  // 1. ĐAN HỒI MÁU
  kim_sang_dan: {
    id: 'kim_sang_dan',
    name: 'Kim Sáng Đan (Cấp 1)',
    type: 'healing',
    tier: 1,
    healAmount: 60,
    color: '#ff6b6b',
    badge: '🔴',
    description: 'Luyện chế từ Ngưng Huyết Thảo, có công hiệu sinh cơ chỉ huyết, khép miệng vết thương nhanh chóng.'
  },
  hoi_xuan_dan: {
    id: 'hoi_xuan_dan',
    name: 'Hồi Xuân Đan (Cấp 2)',
    type: 'healing',
    tier: 2,
    healAmount: 220,
    color: '#51cf66',
    badge: '🟢',
    description: 'Ẩn chứa mộc linh sinh khí mãnh liệt, lập tức hồi phục đại lượng sinh mệnh cho tu sĩ Trúc Cơ.'
  },
  cuu_chuyen_hoa_huyet: {
    id: 'cuu_chuyen_hoa_huyet',
    name: 'Cửu Chuyển Hóa Huyết Đan (Cấp 3)',
    type: 'healing',
    tier: 3,
    healAmount: 800,
    color: '#f03e3e',
    badge: '🩸',
    description: 'Tuyệt phẩm đan dược cứu mạng của cường giả Kim Đan, thịt nát xương tan cũng có thể hồi phục!'
  },

  // 2. ĐAN HỒI SINH (NGHỊCH THIÊN HOÀN HỒN)
  nghich_menh_dan: {
    id: 'nghich_menh_dan',
    name: 'Nghịch Mệnh Hoàn Dương Đan (Cấp 4)',
    type: 'revive',
    tier: 4,
    reviveHealthPercent: 0.6,
    color: '#ffd43b',
    badge: '✨',
    description: 'Đan dược đoạt thiên địa tạo hóa! Khi chủ nhân gặp đòn chí mạng vong mạng, đan dược tự động phát nổ cứu mạng, lập tức sống lại với 60% sinh mệnh!'
  },

  // 3. ĐAN TĂNG THỌ NGUYÊN
  duong_tho_dan: {
    id: 'duong_tho_dan',
    name: 'Dưỡng Thọ Đan (Cấp 1)',
    type: 'lifespan',
    tier: 1,
    lifespanBonusYears: 15,
    color: '#74c0fc',
    badge: '⏳',
    description: 'Bồi bổ nguyên khí, gia tăng thêm 15 năm tuổi thọ cho phàm nhân và tu sĩ.'
  },
  dien_tho_dan: {
    id: 'dien_tho_dan',
    name: 'Diên Thọ Đan (Cấp 2)',
    type: 'lifespan',
    tier: 2,
    lifespanBonusYears: 40,
    color: '#339af0',
    badge: '⌛',
    description: 'Luyện chế từ thảo dược quý trăm năm, nghịch dòng thời gian kéo dài 40 năm thọ mệnh.'
  },
  bo_thien_dan: {
    id: 'bo_thien_dan',
    name: 'Bổ Thiên Cửu Chuyển Đan (Cấp 3)',
    type: 'lifespan',
    tier: 3,
    lifespanBonusYears: 120,
    color: '#cc5de8',
    badge: '🔮',
    description: 'Cực phẩm linh đan tăng cường căn cốt, gia tăng thẳng 120 năm thọ nguyên quý giá!'
  },

  // 4. ĐAN TRỢ LỰC ĐỘT PHÁ CẢNH GIỚI
  truc_co_dan: {
    id: 'truc_co_dan',
    name: 'Trúc Cơ Đan (Cấp 2)',
    type: 'breakthrough',
    tier: 2,
    breakthroughBonus: 0.35,
    color: '#4dabf7',
    badge: '💠',
    description: 'Thánh phẩm đột phá Trúc Cơ, tăng +35% tỷ lệ thành công và bảo vệ tâm mạch không bị tẩu hỏa nhập ma!'
  },
  tu_dan_dan: {
    id: 'tu_dan_dan',
    name: 'Tụ Đan Đan (Cấp 3)',
    type: 'breakthrough',
    tier: 3,
    breakthroughBonus: 0.25,
    color: '#fcc419',
    badge: '🟡',
    description: 'Phụ trợ ngưng kết Kim Đan, tăng 25% tỷ lệ kết đan và giảm 30% sát thương Lôi Kiếp.'
  },

  // 5. ĐAN TĂNG THUỘC TÍNH TẠM THỜI
  bao_linh_dan: {
    id: 'bao_linh_dan',
    name: 'Bạo Linh Đan (Cấp 2)',
    type: 'buff',
    tier: 2,
    buffDamageMultiplier: 1.6,
    buffDurationSeconds: 30,
    color: '#ff922b',
    badge: '🔥',
    description: 'Kích thích toàn bộ tiềm năng kinh mạch, tăng 60% sát thương công kích trong 30 giây!'
  }
};
