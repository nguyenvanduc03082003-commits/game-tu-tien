export type TechniqueTier = 1 | 2 | 3 | 4; // 1: Hoàng, 2: Huyền, 3: Địa, 4: Thiên
export type TechniqueMasteryLevel = 'nhap_mon' | 'so_khuynh' | 'tieu_thanh' | 'dai_thanh';
export type TechniqueSource = 'truyen_thua' | 'co_duyen' | 'tong_mon' | 'gia_toc' | 'vuong_trieu' | 'thanh_dia';

export interface TechniqueMasteryConfig {
  name: string;
  badge: string;
  color: string;
  minExp: number;
  multiplier: number; // Hệ số nhân gia trì thuộc tính (1.0x -> 3.0x)
}

export const MASTERY_CONFIGS: Record<TechniqueMasteryLevel, TechniqueMasteryConfig> = {
  nhap_mon: {
    name: 'Nhập Môn',
    badge: '🌱',
    color: '#94a3b8',
    minExp: 0,
    multiplier: 1.0
  },
  so_khuynh: {
    name: 'Sơ Khuynh',
    badge: '🌿',
    color: '#38bdf8',
    minExp: 100,
    multiplier: 1.4
  },
  tieu_thanh: {
    name: 'Tiểu Thành',
    badge: '🌸',
    color: '#c084fc',
    minExp: 300,
    multiplier: 2.0
  },
  dai_thanh: {
    name: 'Đại Thành',
    badge: '🌟',
    color: '#facc15',
    minExp: 800,
    multiplier: 3.0
  }
};

export const TECHNIQUE_TIER_NAMES: Record<TechniqueTier, { name: string; color: string; badge: string }> = {
  1: { name: 'Hoàng Phẩm', color: '#94a3b8', badge: '⚪' },
  2: { name: 'Huyền Phẩm', color: '#22c55e', badge: '🟢' },
  3: { name: 'Địa Phẩm', color: '#a855f7', badge: '🟣' },
  4: { name: 'Thiên Phẩm', color: '#eab308', badge: '🟡' }
};

export const TECHNIQUE_SOURCE_NAMES: Record<TechniqueSource, { name: string; icon: string; badge: string }> = {
  truyen_thua: { name: 'Huyết Mạch Truyền Thừa', icon: '👑', badge: 'Huyết Mạch' },
  co_duyen: { name: 'Kỳ Ngộ Đắc Đạo', icon: '🌌', badge: 'Cơ Duyên' },
  tong_mon: { name: 'Tông Môn Chân Truyền', icon: '🏛️', badge: 'Tông Môn' },
  gia_toc: { name: 'Gia Tộc Gia Truyền', icon: '🏯', badge: 'Gia Tộc' },
  vuong_trieu: { name: 'Vương Triều Ban Thưởng', icon: '🎖️', badge: 'Vương Triều' },
  thanh_dia: { name: 'Thánh Địa Đế Kinh', icon: '✨', badge: 'Thánh Địa' }
};

export interface TechniqueDefinition {
  id: string;
  name: string;
  tier: TechniqueTier;
  element: string; // Kim, Mộc, Thủy, Hỏa, Thổ, Lôi, Ma, Hỗn Độn...
  badge: string;
  color: string;
  description: string;
  allowedSources: TechniqueSource[];
  baseModifiers: {
    qiAbsorptionMultiplier: number;  // Tốc độ hấp thu linh khí gốc
    breakthroughBonus: number;       // Tỷ lệ cộng thêm khi đột phá
    combatPowerMultiplier?: number;  // Lực chiến gia tăng
    defenseBonus?: number;           // Phòng thủ cộng thẳng
    armorBonus?: number;             // Giáp cộng thẳng
    critRateBonus?: number;          // Tỷ lệ bạo kích
    dodgeRateBonus?: number;         // Tỷ lệ né đòn
    lifespanBonus?: number;          // Thọ nguyên cộng thêm
  };
}

export const TECHNIQUE_DEFINITIONS: Record<string, TechniqueDefinition> = {
  // =========================================================================
  // HOÀNG PHẨM CÔNG PHÁP (Tier 1 - Căn bản phàm trần / Tán tu / Cửu phẩm môn phái)
  // =========================================================================
  truong_sinh_quyet: {
    id: 'truong_sinh_quyet',
    name: 'Trường Sinh Quyết',
    tier: 1,
    element: 'moc',
    badge: '🌿',
    color: '#4ade80',
    description: 'Dưỡng sinh diên thọ, chân khí liên miên như dòng suối nhỏ, giúp thân thể khỏe khoắn kéo dài tuổi thọ.',
    allowedSources: ['co_duyen', 'gia_toc', 'tong_mon'],
    baseModifiers: {
      qiAbsorptionMultiplier: 1.25,
      breakthroughBonus: 0.05,
      lifespanBonus: 20
    }
  },
  hoa_viem_chan_kinh: {
    id: 'hoa_viem_chan_kinh',
    name: 'Hỏa Viêm Chân Kinh',
    tier: 1,
    element: 'hoa',
    badge: '🔥',
    color: '#f97316',
    description: 'Luyện khí tam muội, chân khí nóng rực thiêu đốt kinh mạch, gia tăng uy lực các đòn công kích bộc phát.',
    allowedSources: ['co_duyen', 'tong_mon', 'gia_toc'],
    baseModifiers: {
      qiAbsorptionMultiplier: 1.2,
      breakthroughBonus: 0.05,
      combatPowerMultiplier: 1.2
    }
  },
  thanh_phong_kiem_quyet: {
    id: 'thanh_phong_kiem_quyet',
    name: 'Thanh Phong Kiếm Quyết',
    tier: 1,
    element: 'phong',
    badge: '🗡️',
    color: '#38bdf8',
    description: 'Vận hành chân khí như gió thoảng mây trôi, kiếm chiêu nhẹ nhàng linh hoạt, nâng cao thân pháp né đòn.',
    allowedSources: ['co_duyen', 'tong_mon', 'gia_toc'],
    baseModifiers: {
      qiAbsorptionMultiplier: 1.2,
      breakthroughBonus: 0.04,
      dodgeRateBonus: 0.08
    }
  },
  thiet_bo_sam_cong: {
    id: 'thiet_bo_sam_cong',
    name: 'Thiết Bố Sam Công',
    tier: 1,
    element: 'tho',
    badge: '🛡️',
    color: '#a1a1aa',
    description: 'Ngoại môn ngạnh khí công rèn đúc cơ bắp mình đồng da sắt, tăng cường khả năng chịu đòn và giáp hộ thể.',
    allowedSources: ['co_duyen', 'gia_toc', 'tong_mon'],
    baseModifiers: {
      qiAbsorptionMultiplier: 1.15,
      breakthroughBonus: 0.03,
      defenseBonus: 6,
      armorBonus: 10
    }
  },

  // =========================================================================
  // HUYỀN PHẨM CÔNG PHÁP (Tier 2 - Tam phẩm tông môn / Vương triều / Dị biến kỳ ngộ)
  // =========================================================================
  tu_la_quyet: {
    id: 'tu_la_quyet',
    name: 'Tu La Quyết',
    tier: 2,
    element: 'ma',
    badge: '🩸',
    color: '#ef4444',
    description: 'Võ học sát phạt lấy chiến dưỡng chiến, tích lũy sát khí trong giao tranh biến thành kình lực bạo liệt.',
    allowedSources: ['co_duyen', 'vuong_trieu', 'tong_mon'],
    baseModifiers: {
      qiAbsorptionMultiplier: 1.45,
      breakthroughBonus: 0.08,
      combatPowerMultiplier: 1.35,
      critRateBonus: 0.08
    }
  },
  thien_yeu_thon_tinh: {
    id: 'thien_yeu_thon_tinh',
    name: 'Thiên Yêu Thôn Tinh Điển',
    tier: 2,
    element: 'hon_don',
    badge: '🐾',
    color: '#fbbf24',
    description: 'Huyết mạch cổ xưa của loài linh thú thức tỉnh, thôn nạp tinh hoa nhật nguyệt tinh tú giữa trời đất.',
    allowedSources: ['truyen_thua', 'co_duyen'],
    baseModifiers: {
      qiAbsorptionMultiplier: 1.55,
      breakthroughBonus: 0.1,
      combatPowerMultiplier: 1.3,
      defenseBonus: 8
    }
  },
  huyen_thuy_chan_phap: {
    id: 'huyen_thuy_chan_phap',
    name: 'Huyền Thủy Chân Pháp',
    tier: 2,
    element: 'thuy',
    badge: '🌊',
    color: '#0ea5e9',
    description: 'Thủy nguyên vô cùng biến hóa khôn lường, hồi phục kinh mạch và hóa giải độc khí chướng khí.',
    allowedSources: ['tong_mon', 'vuong_trieu', 'co_duyen'],
    baseModifiers: {
      qiAbsorptionMultiplier: 1.5,
      breakthroughBonus: 0.09,
      dodgeRateBonus: 0.1,
      lifespanBonus: 35
    }
  },
  kim_quang_ho_the_quyet: {
    id: 'kim_quang_ho_the_quyet',
    name: 'Kim Quang Hộ Thể Quyết',
    tier: 2,
    element: 'kim',
    badge: '🥋',
    color: '#eab308',
    description: 'Ngưng tụ kim hành linh khí hóa thành kim chung tráo hộ thân, công thủ toàn diện vững chãi.',
    allowedSources: ['tong_mon', 'vuong_trieu', 'gia_toc'],
    baseModifiers: {
      qiAbsorptionMultiplier: 1.45,
      breakthroughBonus: 0.08,
      defenseBonus: 12,
      armorBonus: 20
    }
  },

  // =========================================================================
  // ĐỊA PHẨM CÔNG PHÁP (Tier 3 - Nhất phẩm tông môn / Cự phách truyền thừa)
  // =========================================================================
  thanh_van_kiem_dien: {
    id: 'thanh_van_kiem_dien',
    name: 'Thanh Vân Kiếm Điển',
    tier: 3,
    element: 'loi',
    badge: '⚡⚔️',
    color: '#818cf8',
    description: 'Tuyệt học trấn phái ngự kiếm phi thiên, dẫn lôi kiếm khí chém rách hư không, uy lực vô song.',
    allowedSources: ['truyen_thua', 'tong_mon', 'co_duyen'],
    baseModifiers: {
      qiAbsorptionMultiplier: 1.85,
      breakthroughBonus: 0.16,
      combatPowerMultiplier: 1.5,
      critRateBonus: 0.15
    }
  },
  cuu_u_huyet_sat: {
    id: 'cuu_u_huyet_sat',
    name: 'Cửu U Huyết Sát Kinh',
    tier: 3,
    element: 'ma',
    badge: '💀',
    color: '#dc2626',
    description: 'Ma công chí tôn sinh ra từ Cửu U vực sâu, thôn phệ ma khí và khí huyết kẻ thù làm căn bản tu luyện.',
    allowedSources: ['truyen_thua', 'co_duyen'],
    baseModifiers: {
      qiAbsorptionMultiplier: 1.9,
      breakthroughBonus: 0.14,
      combatPowerMultiplier: 1.6,
      armorBonus: -8
    }
  },
  bat_hoai_kim_than_quyet: {
    id: 'bat_hoai_kim_than_quyet',
    name: 'Bất Hoại Kim Thân Quyết',
    tier: 3,
    element: 'tho',
    badge: '🗿',
    color: '#d97706',
    description: 'Luyện thể đại thành thân thể như thần binh bảo bối, đao thương bất nhập, sấm sét lôi kiếp khó tổn hại.',
    allowedSources: ['tong_mon', 'thanh_dia', 'co_duyen'],
    baseModifiers: {
      qiAbsorptionMultiplier: 1.75,
      breakthroughBonus: 0.15,
      defenseBonus: 25,
      armorBonus: 45
    }
  },
  loi_dinh_tam_thien_dong: {
    id: 'loi_dinh_tam_thien_dong',
    name: 'Lôi Đình Tam Thiên Động',
    tier: 3,
    element: 'loi',
    badge: '🌩️',
    color: '#c084fc',
    description: 'Thân pháp ngưng sấm chớp, di chuyển như lôi quang xẹt qua chân trời, né tránh toàn bộ chiêu thức hiểm hóc.',
    allowedSources: ['vuong_trieu', 'tong_mon', 'co_duyen'],
    baseModifiers: {
      qiAbsorptionMultiplier: 1.8,
      breakthroughBonus: 0.15,
      dodgeRateBonus: 0.2,
      critRateBonus: 0.12
    }
  },

  // =========================================================================
  // THIÊN PHẨM CÔNG PHÁP (Tier 4 - Thánh Địa Đế Kinh / Đại Đạo Tối Thượng)
  // =========================================================================
  hon_don_thon_thien: {
    id: 'hon_don_thon_thien',
    name: 'Hỗn Độn Thôn Thiên Công',
    tier: 4,
    element: 'hon_don',
    badge: '☯️',
    color: '#facc15',
    description: 'Thượng cổ cấm kỵ đế kinh, dung hợp vạn khí nhật nguyệt âm dương, đột phá dễ như trở bàn tay, uy áp chư thiên.',
    allowedSources: ['thanh_dia', 'co_duyen', 'truyen_thua'],
    baseModifiers: {
      qiAbsorptionMultiplier: 2.8,
      breakthroughBonus: 0.28,
      combatPowerMultiplier: 1.85,
      critRateBonus: 0.2,
      lifespanBonus: 80
    }
  },
  thai_hu_hoa_khi_quyet: {
    id: 'thai_hu_hoa_khi_quyet',
    name: 'Thái Hư Hóa Khí Quyết',
    tier: 4,
    element: 'hon_don',
    badge: '🌌',
    color: '#e879f9',
    description: 'Hóa thân vào thái hư hư vô, một niệm ngàn dặm, sinh tử luân hồi chỉ trong chớp mắt.',
    allowedSources: ['thanh_dia', 'co_duyen'],
    baseModifiers: {
      qiAbsorptionMultiplier: 2.6,
      breakthroughBonus: 0.25,
      combatPowerMultiplier: 1.7,
      dodgeRateBonus: 0.25,
      defenseBonus: 20
    }
  },
  van_kiem_quy_tong_kinh: {
    id: 'van_kiem_quy_tong_kinh',
    name: 'Vạn Kiếm Quy Tông Kinh',
    tier: 4,
    element: 'kim',
    badge: '⚔️🌟',
    color: '#38bdf8',
    description: 'Đỉnh phong kiếm đạo của bậc kiếm tiên viễn cổ, một chiêu vạn kiếm tề phát, trảm sát càn khôn bát hoang.',
    allowedSources: ['thanh_dia', 'truyen_thua', 'co_duyen'],
    baseModifiers: {
      qiAbsorptionMultiplier: 2.7,
      breakthroughBonus: 0.25,
      combatPowerMultiplier: 2.0,
      critRateBonus: 0.25
    }
  },
  bat_diet_truong_sinh_kinh: {
    id: 'bat_diet_truong_sinh_kinh',
    name: 'Bất Diệt Trường Sinh Kinh',
    tier: 4,
    element: 'moc',
    badge: '👑🌿',
    color: '#4ade80',
    description: 'Chí tôn sinh mệnh tiên kinh, sinh mệnh vô cùng vô tận, thọ cùng trời đất, vĩnh thế bất diệt.',
    allowedSources: ['thanh_dia', 'co_duyen'],
    baseModifiers: {
      qiAbsorptionMultiplier: 2.5,
      breakthroughBonus: 0.22,
      lifespanBonus: 150,
      defenseBonus: 30,
      armorBonus: 35
    }
  }
};

/**
 * Lấy danh sách công pháp phù hợp với phẩm cấp thế lực
 */
export function getTechniquesByFactionTier(factionRank: string): TechniqueDefinition[] {
  let targetTier: TechniqueTier = 1;
  if (factionRank === 'thanh_dia') targetTier = 4;
  else if (factionRank === 'nhat_pham') targetTier = 3;
  else if (factionRank === 'tam_pham' || factionRank === 'luc_pham') targetTier = 2;
  else targetTier = 1;

  const list = Object.values(TECHNIQUE_DEFINITIONS).filter(t => t.tier <= targetTier);
  return list.length > 0 ? list : [TECHNIQUE_DEFINITIONS['truong_sinh_quyet']];
}

/**
 * Lấy ngẫu nhiên công pháp kỳ ngộ cơ duyên
 */
export function getRandomSerendipityTechnique(maxTier: TechniqueTier = 3): TechniqueDefinition {
  const eligible = Object.values(TECHNIQUE_DEFINITIONS).filter(t => t.tier <= maxTier && t.allowedSources.includes('co_duyen'));
  const r = Math.random();
  // Tỷ lệ xuất hiện: 60% Hoàng Phẩm, 30% Huyền Phẩm, 9% Địa Phẩm, 1% Thiên Phẩm
  let chosenTier: TechniqueTier = 1;
  if (r < 0.60) chosenTier = 1;
  else if (r < 0.90) chosenTier = 2;
  else if (r < 0.99) chosenTier = 3;
  else chosenTier = 4;

  chosenTier = Math.min(chosenTier, maxTier) as TechniqueTier;

  const pool = eligible.filter(t => t.tier === chosenTier);
  if (pool.length > 0) {
    return pool[Math.floor(Math.random() * pool.length)];
  }
  return eligible[Math.floor(Math.random() * eligible.length)] || TECHNIQUE_DEFINITIONS['truong_sinh_quyet'];
}
