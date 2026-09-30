export type WeaponType = 'dao' | 'kiem' | 'con' | 'cung' | 'quat' | 'phi_tieu' | 'phi_dao';
export type WeaponTier = 'pham_khi' | 'phap_khi' | 'linh_bao' | 'tien_bao';
export type WeaponSlotType = 'one_handed' | 'two_handed';

export interface WeaponSkill {
  id: string;
  name: string;
  description: string;
  procChance: number;       // Tỷ lệ kích hoạt khi tấn công (0.0 đến 1.0)
  damageMultiplier: number; // Hệ số nhân sát thương
  effectType: 'multi_slash' | 'knockback' | 'arrow_rain' | 'wind_blade' | 'ground_smash';
  badge: string;
}

export interface WeaponDefinition {
  id: string;
  name: string;
  type: WeaponType;
  tier: WeaponTier;
  slotType: WeaponSlotType;  // 'one_handed' có thể Song Trì (Dual Wield) 2 tay
  range: number;             // Khoảng cách tấn công (pixel: 22 là cận chiến, 130 là tầm xa)
  attackSpeed: number;       // Đòn đánh trên 1 giây
  baseDamage: number;        // Sát thương cơ bản
  critChance: number;        // Tỷ lệ bạo kích (0.05 - 0.3)
  color: string;
  glowColor?: string;
  projectileType?: 'arrow' | 'dagger' | 'dart' | 'wind_blade' | 'sword_qi';
  specialSkill?: WeaponSkill;
  badge: string;
  description: string;
  iconPath?: string;
}

export const WEAPON_DEFINITIONS: Record<string, WeaponDefinition> = {
  // 1. KIẾM (CÓ THỂ SONG TRÌ)
  iron_sword: {
    id: 'iron_sword',
    name: 'Thanh Phong Kiếm',
    type: 'kiem',
    tier: 'phap_khi',
    slotType: 'one_handed',
    range: 22,
    attackSpeed: 1.2,
    baseDamage: 18,
    critChance: 0.12,
    color: '#ced4da',
    badge: '🗡️',
    description: 'Thanh kiếm thép đúc từ huyền thiết, mũi kiếm sắc bén, linh hoạt nhẹ nhàng.'
  },
  celestial_sword: {
    id: 'celestial_sword',
    name: 'Cửu Kiếp Tru Tiên Kiếm (Linh Bảo)',
    type: 'kiem',
    tier: 'linh_bao',
    slotType: 'one_handed',
    range: 26,
    attackSpeed: 1.5,
    baseDamage: 65,
    critChance: 0.25,
    color: '#74c0fc',
    glowColor: 'rgba(116, 192, 252, 0.8)',
    badge: '⚔️',
    description: 'Tuyệt thế cổ kiếm ngưng tụ lôi điện thiên kiếp, chém ra kiếm khí tung hoành.',
    specialSkill: {
      id: 'van_kiem_quy_tong',
      name: 'Vạn Kiếm Quy Tông',
      description: 'Phóng ra 3 luồng kiếm khí bao vây địch thủ, gây sát thương cực lớn!',
      procChance: 0.25,
      damageMultiplier: 2.2,
      effectType: 'multi_slash',
      badge: '✨'
    }
  },

  // 2. ĐAO (CÓ THỂ SONG TRÌ)
  steel_saber: {
    id: 'steel_saber',
    name: 'Hắc Thiết Trảm Mã Đao',
    type: 'dao',
    tier: 'phap_khi',
    slotType: 'one_handed',
    range: 24,
    attackSpeed: 0.95,
    baseDamage: 24,
    critChance: 0.15,
    color: '#868e96',
    badge: '🔪',
    description: 'Lưỡi đao nặng ngàn cân, nhát chém cuồng bạo xé rách giáp trụ.'
  },
  blood_saber: {
    id: 'blood_saber',
    name: 'Huyết Ma Đồ Long Đao (Linh Bảo)',
    type: 'dao',
    tier: 'linh_bao',
    slotType: 'one_handed',
    range: 28,
    attackSpeed: 1.1,
    baseDamage: 75,
    critChance: 0.3,
    color: '#ff6b6b',
    glowColor: 'rgba(255, 107, 107, 0.8)',
    badge: '🩸',
    description: 'Ma đao hấp thu máu tươi của vạn yêu thú, mỗi nhát chém đều bộc phát sát khí ngập trời.',
    specialSkill: {
      id: 'ba_dao_kham_dia',
      name: 'Bá Đao Khảm Địa',
      description: 'Chém nứt mặt đất bộc phát đao khí hình bán nguyệt!',
      procChance: 0.3,
      damageMultiplier: 2.5,
      effectType: 'ground_smash',
      badge: '💥'
    }
  },

  // 3. CÔN (VŨ KHÍ 2 TAY)
  wooden_staff: {
    id: 'wooden_staff',
    name: 'Bách Mộc Côn',
    type: 'con',
    tier: 'pham_khi',
    slotType: 'two_handed',
    range: 30,
    attackSpeed: 1.0,
    baseDamage: 20,
    critChance: 0.1,
    color: '#d97706',
    badge: '🦯',
    description: 'Gậy gỗ dẻo dai chắc chắn, diện tích vung rộng, có khả năng đánh lui đối phương.'
  },
  dragon_staff: {
    id: 'dragon_staff',
    name: 'Định Hải Thần Châm (Tiên Bảo)',
    type: 'con',
    tier: 'tien_bao',
    slotType: 'two_handed',
    range: 36,
    attackSpeed: 1.3,
    baseDamage: 110,
    critChance: 0.35,
    color: '#ffd43b',
    glowColor: 'rgba(255, 212, 59, 0.9)',
    badge: '🪄',
    description: 'Thần vật thượng cổ nặng vạn cân, quét sạch thiên quân vạn mã.',
    specialSkill: {
      id: 'dinh_hai_bat_son',
      name: 'Thiên Côn Bạt Sơn',
      description: 'Côn kình quét ngang làm rung chuyển mặt đất, đánh lùi toàn bộ kẻ địch lân cận!',
      procChance: 0.35,
      damageMultiplier: 3.0,
      effectType: 'knockback',
      badge: '⚡'
    }
  },

  // 4. CUNG (TẦM XA 2 TAY)
  hunting_bow: {
    id: 'hunting_bow',
    name: 'Liệp Thú Thần Cung',
    type: 'cung',
    tier: 'phap_khi',
    slotType: 'two_handed',
    range: 130,
    attackSpeed: 0.9,
    baseDamage: 22,
    critChance: 0.18,
    color: '#a9e34b',
    projectileType: 'arrow',
    badge: '🏹',
    description: 'Cánh cung dẻo dai bách phát bách trúng, bắn ra mũi tên gỗ xé gió tầm xa.'
  },
  celestial_bow: {
    id: 'celestial_bow',
    name: 'Tru Tiên Lạc Nhật Cung (Linh Bảo)',
    type: 'cung',
    tier: 'linh_bao',
    slotType: 'two_handed',
    range: 160,
    attackSpeed: 1.2,
    baseDamage: 70,
    critChance: 0.35,
    color: '#fab005',
    glowColor: 'rgba(250, 176, 5, 0.8)',
    projectileType: 'arrow',
    badge: '🎯',
    description: 'Thần cung bắn rụng mặt trời, mũi tên ngưng tụ thái dương chân hỏa xuyên phá mọi phòng ngự.',
    specialSkill: {
      id: 'tru_tien_than_tien',
      name: 'Tru Tiên Thần Tiễn',
      description: 'Bắn ra chùm 3 mũi tên ánh sáng truy sát kẻ thù!',
      procChance: 0.3,
      damageMultiplier: 2.0,
      effectType: 'arrow_rain',
      badge: '🌟'
    }
  },

  // 5. QUẠT (PHÁP BẢO TẦM TRUNG)
  feather_fan: {
    id: 'feather_fan',
    name: 'Bạch Hạc Vũ Phiến',
    type: 'quat',
    tier: 'phap_khi',
    slotType: 'one_handed',
    range: 80,
    attackSpeed: 1.1,
    baseDamage: 20,
    critChance: 0.15,
    color: '#e9ecef',
    projectileType: 'wind_blade',
    badge: '🪭',
    description: 'Quạt lông chim hạc, phẩy nhẹ tạo ra lưỡi đao gió chém địch từ xa.'
  },
  fire_fan: {
    id: 'fire_fan',
    name: 'Ngũ Hỏa Thất Cầm Phiến (Linh Bảo)',
    type: 'quat',
    tier: 'linh_bao',
    slotType: 'one_handed',
    range: 100,
    attackSpeed: 1.4,
    baseDamage: 68,
    critChance: 0.28,
    color: '#ff922b',
    glowColor: 'rgba(255, 146, 43, 0.85)',
    projectileType: 'wind_blade',
    badge: '🔥',
    description: 'Được dệt từ lông vũ của 7 loài linh cầm, quạt ra cuồng phong ngũ sắc thiêu đốt vạn vật.',
    specialSkill: {
      id: 'bat_dien_cuong_phong',
      name: 'Bát Diện Cuồng Phong',
      description: 'Tạo ra cơn lốc xoáy lửa đẩy lùi và thiêu đốt kẻ địch!',
      procChance: 0.3,
      damageMultiplier: 2.4,
      effectType: 'wind_blade',
      badge: '🌪️'
    }
  },

  // 6. PHI TIÊU (ÁM KHÍ TẦM XA)
  shuriken: {
    id: 'shuriken',
    name: 'Tứ Tinh Phi Tiêu',
    type: 'phi_tieu',
    tier: 'pham_khi',
    slotType: 'one_handed',
    range: 90,
    attackSpeed: 1.8,
    baseDamage: 14,
    critChance: 0.2,
    color: '#adb5bd',
    projectileType: 'dart',
    badge: '⭐',
    description: 'Phi tiêu bốn cánh xoay tít trong không trung, tốc độ phóng cực nhanh.'
  },

  // 7. PHI ĐAO (CÓ THỂ SONG TRÌ HOẶC NÉM)
  flying_dagger: {
    id: 'flying_dagger',
    name: 'Vô Ảnh Liễu Diệp Đao',
    type: 'phi_dao',
    tier: 'phap_khi',
    slotType: 'one_handed',
    range: 75,
    attackSpeed: 1.6,
    baseDamage: 22,
    critChance: 0.25,
    color: '#63e6be',
    projectileType: 'dagger',
    badge: '🗡️',
    description: 'Lưỡi dao hình lá liễu phiêu dật vô tung, có thể cầm cận chiến đâm nhanh hoặc phóng tầm xa.'
  },

  // Trang bị dùng icon pixel art đã được tuyển chọn từ Raven Fantasy.
  raven_dawn_sword: {
    id: 'raven_dawn_sword',
    name: 'Bình Minh Kiếm',
    type: 'kiem',
    tier: 'pham_khi',
    slotType: 'one_handed',
    range: 23,
    attackSpeed: 1.15,
    baseDamage: 19,
    critChance: 0.14,
    color: '#6ee7f9',
    badge: '🗡️',
    iconPath: 'assets/sprites/items/weapons/raven_dawn_sword.png',
    description: 'Kiếm thép cân bằng, nhẹ tay và đáng tin cậy cho người mới bước chân vào giang hồ.'
  },
  raven_twin_axe: {
    id: 'raven_twin_axe',
    name: 'Song Phủ Phá Trận',
    type: 'dao',
    tier: 'phap_khi',
    slotType: 'one_handed',
    range: 25,
    attackSpeed: 0.9,
    baseDamage: 27,
    critChance: 0.16,
    color: '#f59e0b',
    badge: '🪓',
    iconPath: 'assets/sprites/items/weapons/raven_twin_axe.png',
    description: 'Cặp rìu chiến nặng tay, đổi tốc độ ra đòn lấy sức chém mạnh.'
  },
  raven_qi_staff: {
    id: 'raven_qi_staff',
    name: 'Linh Châu Trượng',
    type: 'con',
    tier: 'phap_khi',
    slotType: 'two_handed',
    range: 38,
    attackSpeed: 0.95,
    baseDamage: 25,
    critChance: 0.12,
    color: '#60a5fa',
    badge: '🪄',
    iconPath: 'assets/sprites/items/weapons/raven_qi_staff.png',
    description: 'Trượng gỗ khảm linh châu xanh, tăng tầm đánh nhưng cần hai tay để sử dụng.'
  }
};
