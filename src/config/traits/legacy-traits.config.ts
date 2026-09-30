import { LegacyStatModifiers, TraitCategory, TraitDefinitionV3, TraitDimension, TraitTier } from './trait.types.ts';

export interface LegacyTraitSnapshotEntry {
  id: string;
  name: string;
  category: TraitCategory;
  dimension: TraitDimension;
  tier: TraitTier;
  badge: string;
  color: string;
  description: string;
  conflicts?: string[];
  statModifiers?: LegacyStatModifiers;
}

/**
 * 8 đặc điểm tương thích ngược (7 ID chỉ có ở bản cũ + an_linh_can giữ nghĩa Ẩn Linh Căn)
 * Chỉ dùng để đọc/di trú bản lưu cũ, spawnWeight = 0.
 */
export const LEGACY_ONLY_TRAITS_V3: readonly TraitDefinitionV3[] = [
  {
    "id": "an_linh_can",
    "name": "Ẩn Linh Căn",
    "description": "Linh căn ẩn sâu dưới chân nguyên, kẻ thù không thể dò xét thực lực và cảnh giới thật sự.",
    "sourceDescription": "Linh căn ẩn sâu dưới chân nguyên, kẻ thù không thể dò xét thực lực và cảnh giới thật sự.",
    "tier": 3,
    "dimension": "root",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "legacyOnly",
    "deferredReason": "Đặc điểm tương thích ngược cho bản lưu cũ (không sinh mới trong V3)",
    "spawnWeight": 0,
    "traitCost": 18,
    "innateDelta": {},
    "learningAffinity": {},
    "modifiers": [
      {
        "key": "dodgeChanceBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.1,
        "sourceKey": "dodge"
      },
      {
        "key": "breakthroughChanceBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.1,
        "sourceKey": "breakthrough"
      }
    ],
    "effects": [],
    "badge": "🎭",
    "color": "#868e96",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "dodgeRateBonus": 0.1,
      "breakthroughChanceBonus": 0.1
    }
  },
  {
    "id": "van_thu_chi_huu",
    "name": "Vạn Thú Chi Hữu",
    "description": "Có khí chất thân thiện với muông thú, động vật hoang dã không bao giờ chủ động tấn công, dễ dàng thuần dưỡng.",
    "sourceDescription": "Có khí chất thân thiện với muông thú, động vật hoang dã không bao giờ chủ động tấn công, dễ dàng thuần dưỡng.",
    "tier": 3,
    "dimension": "profession",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [
      "tram_sat_linh_thu"
    ],
    "implementation": "legacyOnly",
    "deferredReason": "Đặc điểm tương thích ngược cho bản lưu cũ (không sinh mới trong V3)",
    "spawnWeight": 0,
    "traitCost": 18,
    "innateDelta": {},
    "learningAffinity": {},
    "modifiers": [
      {
        "key": "dodgeChanceBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.15,
        "sourceKey": "dodge"
      }
    ],
    "effects": [],
    "badge": "🐾",
    "color": "#ff922b",
    "category": "profession",
    "conflicts": [
      "tram_sat_linh_thu"
    ],
    "statModifiers": {
      "dodgeRateBonus": 0.15
    }
  },
  {
    "id": "ngu_long_bi_thuat",
    "name": "Ngự Long Bí Thuật",
    "description": "Nắm giữ bí kíp ngự thú thượng cổ, có khả năng thuần hóa và cưỡi giao long hoặc đại bàng kim sí.",
    "sourceDescription": "Nắm giữ bí kíp ngự thú thượng cổ, có khả năng thuần hóa và cưỡi giao long hoặc đại bàng kim sí.",
    "tier": 4,
    "dimension": "profession",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "legacyOnly",
    "deferredReason": "Đặc điểm tương thích ngược cho bản lưu cũ (không sinh mới trong V3)",
    "spawnWeight": 0,
    "traitCost": 35,
    "innateDelta": {},
    "learningAffinity": {},
    "modifiers": [
      {
        "key": "attackFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.5,
        "sourceKey": "atk"
      },
      {
        "key": "moveSpeedFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.3,
        "sourceKey": "moveSpeed"
      }
    ],
    "effects": [],
    "badge": "🐲",
    "color": "#f59f00",
    "category": "profession",
    "conflicts": [],
    "statModifiers": {
      "combatPowerMultiplier": 1.5,
      "moveSpeedMultiplier": 1.3
    }
  },
  {
    "id": "uy_nghiem_trang_trong",
    "name": "Uy Nghiêm Trang Trọng",
    "description": "Lời nói có trọng lượng như chuông đồng, đệ tử cấp dưới răm rắp tuân lệnh, dẹp tan mọi mầm mống tranh chấp.",
    "sourceDescription": "Lời nói có trọng lượng như chuông đồng, đệ tử cấp dưới răm rắp tuân lệnh, dẹp tan mọi mầm mống tranh chấp.",
    "tier": 2,
    "dimension": "social",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "legacyOnly",
    "deferredReason": "Đặc điểm tương thích ngược cho bản lưu cũ (không sinh mới trong V3)",
    "spawnWeight": 0,
    "traitCost": 8,
    "innateDelta": {},
    "learningAffinity": {},
    "modifiers": [],
    "effects": [],
    "badge": "⚖️",
    "color": "#ffd43b",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "factionPrestigeBonus": 20
    }
  },
  {
    "id": "hien_hoa_nhan_hau",
    "name": "Hiền Hòa Nhân Hậu",
    "description": "Lòng dạ từ bi bác ái, không bao giờ chủ động gây chiến, tự động hóa giải căng thẳng với xung quanh.",
    "sourceDescription": "Lòng dạ từ bi bác ái, không bao giờ chủ động gây chiến, tự động hóa giải căng thẳng với xung quanh.",
    "tier": 2,
    "dimension": "social",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [
      "sat_phat_chi_tam",
      "am_hiem_doc_ac",
      "cuong_chien_huyet_no",
      "dien_cuong_khat_mau"
    ],
    "implementation": "legacyOnly",
    "deferredReason": "Đặc điểm tương thích ngược cho bản lưu cũ (không sinh mới trong V3)",
    "spawnWeight": 0,
    "traitCost": 8,
    "innateDelta": {},
    "learningAffinity": {},
    "modifiers": [
      {
        "key": "healthFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.2,
        "sourceKey": "hp"
      }
    ],
    "effects": [],
    "badge": "🕊️",
    "color": "#f8f9fa",
    "category": "innate",
    "conflicts": [
      "sat_phat_chi_tam",
      "am_hiem_doc_ac",
      "cuong_chien_huyet_no",
      "dien_cuong_khat_mau"
    ],
    "statModifiers": {
      "healthMultiplier": 1.2,
      "factionPrestigeBonus": 15
    }
  },
  {
    "id": "truong_sinh_quyet",
    "name": "Trường Sinh Quyết",
    "description": "Đạo gia thánh điển dưỡng sinh diên thọ, linh lực bình hòa liên miên bất tuyệt, tăng thêm 60 năm thọ nguyên.",
    "sourceDescription": "Đạo gia thánh điển dưỡng sinh diên thọ, linh lực bình hòa liên miên bất tuyệt, tăng thêm 60 năm thọ nguyên.",
    "tier": 3,
    "dimension": "survival",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "legacyOnly",
    "deferredReason": "Đặc điểm tương thích ngược cho bản lưu cũ (không sinh mới trong V3)",
    "spawnWeight": 0,
    "traitCost": 18,
    "innateDelta": {},
    "learningAffinity": {},
    "modifiers": [
      {
        "key": "healthFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.3,
        "sourceKey": "hp"
      },
      {
        "key": "lifespanYears",
        "mode": "add",
        "unit": "years",
        "value": 60,
        "sourceKey": "lifespan"
      }
    ],
    "effects": [],
    "badge": "🍃",
    "color": "#51cf66",
    "category": "technique",
    "conflicts": [],
    "statModifiers": {
      "lifespanBonus": 60,
      "healthMultiplier": 1.3
    }
  },
  {
    "id": "hoa_viem_chan_kinh",
    "name": "Hỏa Viêm Chân Kinh",
    "description": "Luyện khí thành tam muội chân hỏa, tăng uy lực chiến đấu công kích cuồng bạo.",
    "sourceDescription": "Luyện khí thành tam muội chân hỏa, tăng uy lực chiến đấu công kích cuồng bạo.",
    "tier": 3,
    "dimension": "combat",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "legacyOnly",
    "deferredReason": "Đặc điểm tương thích ngược cho bản lưu cũ (không sinh mới trong V3)",
    "spawnWeight": 0,
    "traitCost": 18,
    "innateDelta": {},
    "learningAffinity": {},
    "modifiers": [
      {
        "key": "attackFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.5,
        "sourceKey": "atk"
      },
      {
        "key": "qiRateFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.2,
        "sourceKey": "qiRate"
      }
    ],
    "effects": [],
    "badge": "🔥",
    "color": "#ff922b",
    "category": "technique",
    "conflicts": [],
    "statModifiers": {
      "combatPowerMultiplier": 1.5,
      "qiAbsorptionMultiplier": 1.2
    }
  },
  {
    "id": "dan_dao_nhap_mon",
    "name": "Đan Đạo Dị Tài",
    "description": "Quen thuộc trăm loài thảo mộc, hái thuốc luyện đan có tỷ lệ thành công vượt bậc.",
    "sourceDescription": "Quen thuộc trăm loài thảo mộc, hái thuốc luyện đan có tỷ lệ thành công vượt bậc.",
    "tier": 2,
    "dimension": "profession",
    "origin": "acquired",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "legacyOnly",
    "deferredReason": "Đặc điểm tương thích ngược cho bản lưu cũ (không sinh mới trong V3)",
    "spawnWeight": 0,
    "traitCost": 8,
    "innateDelta": {},
    "learningAffinity": {},
    "modifiers": [
      {
        "key": "breakthroughChanceBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.15,
        "sourceKey": "breakthrough"
      }
    ],
    "effects": [],
    "badge": "🧪",
    "color": "#20c997",
    "category": "experience",
    "conflicts": [],
    "statModifiers": {
      "breakthroughChanceBonus": 0.15,
      "alchemySuccessBonus": 0.3
    }
  }
];

/**
 * Bản chụp 105 định nghĩa đặc điểm V1/V2 cũ phục vụ di trú save.
 */
export const LEGACY_TRAIT_DEFINITIONS_SNAPSHOT: Readonly<Record<string, LegacyTraitSnapshotEntry>> = {
  "hoang_co_thanh_the": {
    "id": "hoang_co_thanh_the",
    "name": "Hoang Cổ Thánh Thể",
    "category": "innate",
    "dimension": "physique",
    "tier": 4,
    "badge": "🛡️",
    "color": "#f59f00",
    "description": "Thể chất cái thế vô song truyền từ thời viễn cổ, khí huyết như rồng, cận chiến vô địch thiên hạ.",
    "conflicts": [
      "bach_benh_quan_than",
      "doan_menh_chi_tuong",
      "tat_nguyen_bam_sinh"
    ],
    "statModifiers": {
      "healthMultiplier": 2.5,
      "combatPowerMultiplier": 2,
      "armorBonus": 50,
      "physiqueBonus": 30
    }
  },
  "tien_thien_dao_the": {
    "id": "tien_thien_dao_the",
    "name": "Tiên Thiên Đạo Thể",
    "category": "innate",
    "dimension": "physique",
    "tier": 4,
    "badge": "✨",
    "color": "#ffd43b",
    "description": "Bẩm sinh thân cận với thiên địa đại đạo, tốc độ hấp thu linh khí cực hạn, đột phá như nước chảy mây trôi.",
    "conflicts": [
      "phe_linh_can",
      "tuyet_linh_chi_the"
    ],
    "statModifiers": {
      "qiAbsorptionMultiplier": 3,
      "breakthroughChanceBonus": 0.35,
      "lifespanBonus": 60
    }
  },
  "thuan_duong_chi_the": {
    "id": "thuan_duong_chi_the",
    "name": "Thuần Dương Chi Thể",
    "category": "innate",
    "dimension": "physique",
    "tier": 3,
    "badge": "☀️",
    "color": "#ff922b",
    "description": "Mang dương khí chí cương chí thuần, sát thương Hỏa tăng mạnh, miễn nhiễm hoàn toàn với hàn độc chướng khí.",
    "conflicts": [
      "cuu_am_tuyet_mach",
      "the_han_so_lanh"
    ],
    "statModifiers": {
      "combatPowerMultiplier": 1.4,
      "healthMultiplier": 1.2
    }
  },
  "cuu_am_tuyet_mach": {
    "id": "cuu_am_tuyet_mach",
    "name": "Cửu Âm Tuyệt Mạch",
    "category": "innate",
    "dimension": "physique",
    "tier": 3,
    "badge": "❄️",
    "color": "#74c0fc",
    "description": "Hàn khí bẩm sinh ăn sâu vào kinh mạch, thọ nguyên bị suy giảm nghiêm trọng nhưng chiêu thức băng hàn uy lực ngút trời.",
    "conflicts": [
      "thuan_duong_chi_the",
      "hoa_nhiet_bat_xam"
    ],
    "statModifiers": {
      "lifespanBonus": -40,
      "combatPowerMultiplier": 1.6
    }
  },
  "long_huyet_ba_the": {
    "id": "long_huyet_ba_the",
    "name": "Long Huyết Bá Thể",
    "category": "innate",
    "dimension": "physique",
    "tier": 4,
    "badge": "🐉",
    "color": "#e03131",
    "description": "Thân thể thức tỉnh chân huyết Chân Long, phòng ngự mình đồng da sắt, uy áp long tộc khiến bầy thú quy phục.",
    "conflicts": [
      "bach_benh_quan_than"
    ],
    "statModifiers": {
      "healthMultiplier": 1.8,
      "armorBonus": 40,
      "combatPowerMultiplier": 1.5
    }
  },
  "kim_cang_bat_hoai": {
    "id": "kim_cang_bat_hoai",
    "name": "Kim Cang Bất Hoại",
    "category": "innate",
    "dimension": "physique",
    "tier": 3,
    "badge": "🥋",
    "color": "#fcc419",
    "description": "Cơ thể rèn đúc như vàng ròng ngàn năm, giáp hộ thể cực dày, giảm mạnh sát thương bạo kích gánh chịu.",
    "conflicts": [
      "tat_nguyen_bam_sinh"
    ],
    "statModifiers": {
      "armorBonus": 60,
      "healthMultiplier": 1.4
    }
  },
  "ba_vuong_trong_dong": {
    "id": "ba_vuong_trong_dong",
    "name": "Bá Vương Trọng Đồng",
    "category": "innate",
    "dimension": "physique",
    "tier": 4,
    "badge": "👁️",
    "color": "#9c36b5",
    "description": "Mắt sinh con ngươi kép của bậc đế vương viễn cổ, nhìn thấu sơ hở kẻ địch, bạo kích và né đòn xuất chúng.",
    "statModifiers": {
      "critRateBonus": 0.25,
      "dodgeRateBonus": 0.2,
      "combatPowerMultiplier": 1.4
    }
  },
  "vo_cau_linh_the": {
    "id": "vo_cau_linh_the",
    "name": "Vô Cấu Linh Thể",
    "category": "innate",
    "dimension": "physique",
    "tier": 3,
    "badge": "💧",
    "color": "#38d9a9",
    "description": "Cơ thể thanh khiết không vướng tạp trần, kinh mạch thông suốt, dược hiệu của linh đan tăng thêm 40%.",
    "statModifiers": {
      "healthMultiplier": 1.3,
      "breakthroughChanceBonus": 0.15
    }
  },
  "thien_ma_huyet_the": {
    "id": "thien_ma_huyet_the",
    "name": "Thiên Ma Huyết Thể",
    "category": "innate",
    "dimension": "physique",
    "tier": 3,
    "badge": "🩸",
    "color": "#c92a2a",
    "description": "Thể chất ma đạo khát máu cuồng loạn, hút sinh mệnh khi tấn công đối thủ, tuy nhiên phòng ngự gốc suy giảm.",
    "conflicts": [
      "xich_tu_chi_tam",
      "hien_hoa_nhan_hau"
    ],
    "statModifiers": {
      "combatPowerMultiplier": 1.5,
      "armorBonus": -10
    }
  },
  "linh_lung_that_khieu": {
    "id": "linh_lung_that_khieu",
    "name": "Linh Lung Thất Khiếu Tâm",
    "category": "innate",
    "dimension": "physique",
    "tier": 4,
    "badge": "🫀",
    "color": "#ff8787",
    "description": "Trái tim bảy khiếu thông thiên triệt địa, cảm nhận mọi dao động của sinh mệnh, ngộ tính tăng mạnh vạn điểm.",
    "statModifiers": {
      "breakthroughChanceBonus": 0.3,
      "dodgeRateBonus": 0.15
    }
  },
  "doan_menh_chi_tuong": {
    "id": "doan_menh_chi_tuong",
    "name": "Đoản Mệnh Chi Tướng",
    "category": "innate",
    "dimension": "physique",
    "tier": 1,
    "badge": "⏳",
    "color": "#ff6b6b",
    "description": "Bẩm sinh tướng yểu mệnh, thọ nguyên hao tổn, nhưng sinh tử thúc ép khiến tinh thần tu luyện điên cuồng gấp bội.",
    "conflicts": [
      "tho_ty_nam_son",
      "hoang_co_thanh_the"
    ],
    "statModifiers": {
      "lifespanBonus": -30,
      "qiAbsorptionMultiplier": 1.4
    }
  },
  "tat_nguyen_bam_sinh": {
    "id": "tat_nguyen_bam_sinh",
    "name": "Tật Nguyền Bẩm Sinh",
    "category": "innate",
    "dimension": "physique",
    "tier": 1,
    "badge": "🦯",
    "color": "#adb5bd",
    "description": "Chân tay có khiếm khuyết bẩm sinh khiến tốc độ chạy suy giảm, bù lại rèn luyện ý chí và ngộ tính kiên cường.",
    "conflicts": [
      "than_hanh_bach_bien",
      "hoang_co_thanh_the"
    ],
    "statModifiers": {
      "moveSpeedMultiplier": 0.6,
      "breakthroughChanceBonus": 0.1
    }
  },
  "bach_benh_quan_than": {
    "id": "bach_benh_quan_than",
    "name": "Bách Bệnh Quấn Thân",
    "category": "innate",
    "dimension": "physique",
    "tier": 1,
    "badge": "🤒",
    "color": "#868e96",
    "description": "Thân thể ốm yếu nhiều bệnh tật, lượng sinh mệnh cơ bản thấp, cần nhiều đan dược điều dưỡng thường xuyên.",
    "conflicts": [
      "hoang_co_thanh_the",
      "long_huyet_ba_the"
    ],
    "statModifiers": {
      "healthMultiplier": 0.7,
      "lifespanBonus": -15
    }
  },
  "u_minh_quy_the": {
    "id": "u_minh_quy_the",
    "name": "U Minh Quỷ Thể",
    "category": "innate",
    "dimension": "physique",
    "tier": 2,
    "badge": "👻",
    "color": "#845ef7",
    "description": "Nửa người nửa quỷ, thân thể phiêu hốt trong đêm tối, tăng mạnh tốc độ và lực chiến khi bóng tối bao trùm.",
    "conflicts": [
      "thuan_duong_chi_the"
    ],
    "statModifiers": {
      "moveSpeedMultiplier": 1.2,
      "dodgeRateBonus": 0.15
    }
  },
  "man_hoang_cu_luc": {
    "id": "man_hoang_cu_luc",
    "name": "Man Hoang Cự Lực",
    "category": "innate",
    "dimension": "physique",
    "tier": 2,
    "badge": "💪",
    "color": "#d9480f",
    "description": "Trời sinh sức mạnh nâng ngàn cân đỉnh, sát thương cận chiến bộc phát dũng mãnh hơn hẳn đồng đạo.",
    "statModifiers": {
      "combatPowerMultiplier": 1.3,
      "physiqueBonus": 20
    }
  },
  "thien_linh_can": {
    "id": "thien_linh_can",
    "name": "Thiên Linh Căn",
    "category": "innate",
    "dimension": "root",
    "tier": 4,
    "badge": "🌟",
    "color": "#ffd43b",
    "description": "Trời sinh linh căn đơn thuần chí cực, tốc độ hấp thu linh khí nhanh gấp 3 lần, đột phá dễ như trở bàn tay.",
    "conflicts": [
      "phe_linh_can",
      "tuyet_linh_chi_the"
    ],
    "statModifiers": {
      "qiAbsorptionMultiplier": 3,
      "breakthroughChanceBonus": 0.25,
      "lifespanBonus": 50
    }
  },
  "phe_linh_can": {
    "id": "phe_linh_can",
    "name": "Phế Linh Căn (Tạp Linh Căn)",
    "category": "innate",
    "dimension": "root",
    "tier": 1,
    "badge": "🌑",
    "color": "#868e96",
    "description": "Năm loại linh căn hỗn tạp không rõ ràng, hấp thu linh khí chậm chạp, gian nan trăm bề trên con đường tu tiên.",
    "conflicts": [
      "thien_linh_can",
      "tien_thien_dao_the",
      "hon_don_dao_can"
    ],
    "statModifiers": {
      "qiAbsorptionMultiplier": 0.5,
      "breakthroughChanceBonus": -0.2
    }
  },
  "thien_loi_chi_tu": {
    "id": "thien_loi_chi_tu",
    "name": "Thiên Lôi Chi Tử",
    "category": "innate",
    "dimension": "root",
    "tier": 3,
    "badge": "⚡",
    "color": "#b197fc",
    "description": "Dị biến Lôi linh căn cuồng bạo, sát thương hệ Lôi tăng 60%, giảm phân nửa uy lực lôi phạt thiên kiếp khi đột phá.",
    "statModifiers": {
      "combatPowerMultiplier": 1.4,
      "breakthroughChanceBonus": 0.15
    }
  },
  "chan_hoa_chi_linh": {
    "id": "chan_hoa_chi_linh",
    "name": "Chân Hỏa Chi Linh",
    "category": "innate",
    "dimension": "root",
    "tier": 3,
    "badge": "🔥",
    "color": "#ff922b",
    "description": "Hỏa linh căn biến dị đạt mức tam muội chân hỏa, đòn đánh đốt cháy sinh mệnh mục tiêu liên tục theo thời gian.",
    "conflicts": [
      "bang_phach_han_the"
    ],
    "statModifiers": {
      "combatPowerMultiplier": 1.35
    }
  },
  "moc_linh_truong_sinh": {
    "id": "moc_linh_truong_sinh",
    "name": "Mộc Linh Trường Sinh",
    "category": "innate",
    "dimension": "root",
    "tier": 3,
    "badge": "🌿",
    "color": "#51cf66",
    "description": "Mộc linh căn cực phẩm như đại thụ trường tồn, tự hồi phục sinh lực và tăng thêm 50 năm thọ mệnh.",
    "statModifiers": {
      "healthMultiplier": 1.3,
      "lifespanBonus": 50
    }
  },
  "bang_phach_han_the": {
    "id": "bang_phach_han_the",
    "name": "Băng Phách Hàn Thể",
    "category": "innate",
    "dimension": "root",
    "tier": 3,
    "badge": "🧊",
    "color": "#4dabf7",
    "description": "Băng linh căn đóng băng mọi vật, đòn tấn công khiến đối thủ bị tê cóng và giảm mạnh tốc độ di chuyển.",
    "conflicts": [
      "chan_hoa_chi_linh",
      "thuan_duong_chi_the"
    ],
    "statModifiers": {
      "combatPowerMultiplier": 1.3,
      "dodgeRateBonus": 0.1
    }
  },
  "phong_than_ho_the": {
    "id": "phong_than_ho_the",
    "name": "Phong Thần Hộ Thể",
    "category": "innate",
    "dimension": "root",
    "tier": 3,
    "badge": "🌪️",
    "color": "#63e6be",
    "description": "Phong linh căn nhẹ tựa lông hồng, ngự phong mà bay, tốc độ di chuyển và tỷ lệ né đòn gia tăng vượt trội.",
    "statModifiers": {
      "moveSpeedMultiplier": 1.5,
      "dodgeRateBonus": 0.25
    }
  },
  "dia_mach_chi_tu": {
    "id": "dia_mach_chi_tu",
    "name": "Địa Mạch Chi Tử",
    "category": "innate",
    "dimension": "root",
    "tier": 2,
    "badge": "⛰️",
    "color": "#fab005",
    "description": "Thổ linh căn gắn liền với đất mẹ bao la, đứng yên trên mặt đất gia tăng giáp hộ thể kiên cố.",
    "statModifiers": {
      "armorBonus": 25,
      "healthMultiplier": 1.2
    }
  },
  "thuy_than_chuc_phuc": {
    "id": "thuy_than_chuc_phuc",
    "name": "Thủy Thần Chúc Phúc",
    "category": "innate",
    "dimension": "root",
    "tier": 2,
    "badge": "🌊",
    "color": "#339af0",
    "description": "Thủy linh căn nhu hòa liên miên, hồi phục sinh lực và linh khí cực nhanh khi ở gần sông hồ nguồn nước.",
    "statModifiers": {
      "qiAbsorptionMultiplier": 1.2,
      "healthMultiplier": 1.15
    }
  },
  "khong_gian_dao_the": {
    "id": "khong_gian_dao_the",
    "name": "Không Gian Đạo Thể",
    "category": "innate",
    "dimension": "root",
    "tier": 4,
    "badge": "🌌",
    "color": "#cc5de8",
    "description": "Nắm bắt quy luật không gian hư vô, có khả năng né tránh các đòn đánh trực diện và bỏ qua giáp của đối thủ.",
    "statModifiers": {
      "dodgeRateBonus": 0.3,
      "combatPowerMultiplier": 1.5
    }
  },
  "hon_don_dao_can": {
    "id": "hon_don_dao_can",
    "name": "Hỗn Độn Đạo Căn",
    "category": "innate",
    "dimension": "root",
    "tier": 4,
    "badge": "☯️",
    "color": "#e599f7",
    "description": "Linh căn sơ khai sinh ra từ hỗn độn thuở lập địa, đồng hóa vạn khí, có thể dung nạp cả Tiên Khí lẫn Hỗn Độn Khí.",
    "conflicts": [
      "phe_linh_can"
    ],
    "statModifiers": {
      "qiAbsorptionMultiplier": 2.8,
      "breakthroughChanceBonus": 0.3,
      "healthMultiplier": 1.5
    }
  },
  "am_duong_song_tu": {
    "id": "am_duong_song_tu",
    "name": "Âm Dương Hòa Hợp",
    "category": "innate",
    "dimension": "root",
    "tier": 3,
    "badge": "☯️",
    "color": "#ffd43b",
    "description": "Linh căn tự điều phối âm dương ngũ hành, gia tăng tốc độ thấu hiểu đạo lý và thăng tiến cảnh giới bình hòa.",
    "statModifiers": {
      "qiAbsorptionMultiplier": 1.4,
      "breakthroughChanceBonus": 0.15
    }
  },
  "tuyet_linh_chi_the": {
    "id": "tuyet_linh_chi_the",
    "name": "Tuyệt Linh Chi Thể",
    "category": "innate",
    "dimension": "root",
    "tier": 2,
    "badge": "🚫",
    "color": "#ced4da",
    "description": "Không thể cảm ứng hay thu nạp linh khí tu tiên, đổi lại trời sinh kháng 70% mọi sát thương pháp thuật.",
    "conflicts": [
      "thien_linh_can",
      "tien_thien_dao_the"
    ],
    "statModifiers": {
      "armorBonus": 35,
      "qiAbsorptionMultiplier": 0.1
    }
  },
  "ngu_hanh_cau_toan": {
    "id": "ngu_hanh_cau_toan",
    "name": "Ngũ Hành Câu Toàn",
    "category": "innate",
    "dimension": "root",
    "tier": 3,
    "badge": "🌈",
    "color": "#20c997",
    "description": "Cả 5 hành Kim Mộc Thủy Hỏa Thổ luân chuyển tương sinh nhịp nhàng, công thủ toàn diện không hề có điểm yếu.",
    "conflicts": [
      "phe_linh_can"
    ],
    "statModifiers": {
      "combatPowerMultiplier": 1.3,
      "armorBonus": 20,
      "qiAbsorptionMultiplier": 1.3
    }
  },
  "an_linh_can": {
    "id": "an_linh_can",
    "name": "Ẩn Linh Căn",
    "category": "innate",
    "dimension": "root",
    "tier": 3,
    "badge": "🎭",
    "color": "#868e96",
    "description": "Linh căn ẩn sâu dưới chân nguyên, kẻ thù không thể dò xét thực lực và cảnh giới thật sự.",
    "statModifiers": {
      "dodgeRateBonus": 0.1,
      "breakthroughChanceBonus": 0.1
    }
  },
  "ngo_tinh_sieu_pham": {
    "id": "ngo_tinh_sieu_pham",
    "name": "Ngộ Tính Siêu Phàm",
    "category": "innate",
    "dimension": "mindset",
    "tier": 4,
    "badge": "🧠",
    "color": "#74c0fc",
    "description": "Tâm tư thông tuệ trác tuyệt, vừa nhìn đã ngộ thấu thiên cơ đạo pháp, tỷ lệ đột phá tăng mạnh mẽ.",
    "conflicts": [
      "dan_don_ngu_ngo"
    ],
    "statModifiers": {
      "breakthroughChanceBonus": 0.35
    }
  },
  "dan_don_ngu_ngo": {
    "id": "dan_don_ngu_ngo",
    "name": "Đần Độn Ngu Ngơ",
    "category": "innate",
    "dimension": "mindset",
    "tier": 1,
    "badge": "🥴",
    "color": "#868e96",
    "description": "Đầu óc chậm chạp, học một quên mười, tu đạo gian nan nhưng tâm hồn vô tư không lo nghĩ.",
    "conflicts": [
      "ngo_tinh_sieu_pham",
      "don_ngo_ky_tai"
    ],
    "statModifiers": {
      "breakthroughChanceBonus": -0.2
    }
  },
  "don_ngo_ky_tai": {
    "id": "don_ngo_ky_tai",
    "name": "Độn Ngộ Kỳ Tài",
    "category": "innate",
    "dimension": "mindset",
    "tier": 3,
    "badge": "💡",
    "color": "#ffd43b",
    "description": "Thường ngày bình dị nhưng trong khoảnh khắc sinh tử hay quan sát phong vân lại đột nhiên đốn ngộ phi thăng.",
    "conflicts": [
      "dan_don_ngu_ngo"
    ],
    "statModifiers": {
      "breakthroughChanceBonus": 0.2,
      "qiAbsorptionMultiplier": 1.3
    }
  },
  "xich_tu_chi_tam": {
    "id": "xich_tu_chi_tam",
    "name": "Xích Tử Chi Tâm",
    "category": "innate",
    "dimension": "mindset",
    "tier": 3,
    "badge": "🤍",
    "color": "#f8f9fa",
    "description": "Tâm tính ngây thơ chất phác không vướng hạt bụi trần, miễn nhiễm hoàn toàn mọi hiểm họa tẩu hỏa nhập ma.",
    "conflicts": [
      "tam_ma_quan_than",
      "am_hiem_doc_ac",
      "thien_ma_huyet_the"
    ],
    "statModifiers": {
      "breakthroughChanceBonus": 0.15,
      "lifespanBonus": 20
    }
  },
  "tam_ma_quan_than": {
    "id": "tam_ma_quan_than",
    "name": "Tâm Ma Quấn Thân",
    "category": "innate",
    "dimension": "mindset",
    "tier": 2,
    "badge": "😈",
    "color": "#e03131",
    "description": "Tâm ma rình rập trong sâu thẳm linh hồn, bộc phát sát thương cuồng loạn nhưng tỷ lệ thất bại khi xung kích cảnh giới tăng cao.",
    "conflicts": [
      "xich_tu_chi_tam",
      "kien_dinh_nhu_thiet"
    ],
    "statModifiers": {
      "combatPowerMultiplier": 1.4,
      "breakthroughChanceBonus": -0.25
    }
  },
  "kien_dinh_nhu_thiet": {
    "id": "kien_dinh_nhu_thiet",
    "name": "Đạo Tâm Như Thiết",
    "category": "innate",
    "dimension": "mindset",
    "tier": 3,
    "badge": "🗿",
    "color": "#ced4da",
    "description": "Ý chí kiên cường không gì lay chuyển, kháng mọi ảo ảnh ma trận và hiệu ứng hoảng loạn sợ hãi.",
    "conflicts": [
      "nhat_gan_so_chet",
      "tam_tinh_thao_dong"
    ],
    "statModifiers": {
      "breakthroughChanceBonus": 0.2
    }
  },
  "nhat_tam_nhi_dung": {
    "id": "nhat_tam_nhi_dung",
    "name": "Nhất Tâm Nhị Dụng",
    "category": "innate",
    "dimension": "mindset",
    "tier": 3,
    "badge": "🔀",
    "color": "#20c997",
    "description": "Có khả năng vừa lao động chân tay cày cuốc xây dựng, vừa âm thầm thổ nạp linh khí đất trời.",
    "statModifiers": {
      "qiAbsorptionMultiplier": 1.3,
      "craftingSpeedMultiplier": 1.25
    }
  },
  "da_nghi_tram_trong": {
    "id": "da_nghi_tram_trong",
    "name": "Đa Nghi Như Tào",
    "category": "innate",
    "dimension": "mindset",
    "tier": 1,
    "badge": "🧐",
    "color": "#adb5bd",
    "description": "Luôn cảnh giác đề phòng kẻ khác, khó bị phục kích hay đánh lén nhưng độ hòa nhập xã giao kém.",
    "statModifiers": {
      "dodgeRateBonus": 0.15
    }
  },
  "dien_cuong_khat_mau": {
    "id": "dien_cuong_khat_mau",
    "name": "Điên Cuồng Khát Máu",
    "category": "innate",
    "dimension": "mindset",
    "tier": 2,
    "badge": "🩸",
    "color": "#c92a2a",
    "description": "Càng đổ máu càng hưng phấn tột độ, sinh mệnh càng thấp thì sát thương bộc phát càng khủng khiếp.",
    "conflicts": [
      "hien_hoa_nhan_hau"
    ],
    "statModifiers": {
      "combatPowerMultiplier": 1.5,
      "defenseBonus": -5
    }
  },
  "tien_phong_dao_cot": {
    "id": "tien_phong_dao_cot",
    "name": "Tiên Phong Đạo Cốt",
    "category": "innate",
    "dimension": "mindset",
    "tier": 3,
    "badge": "🪶",
    "color": "#a9e34b",
    "description": "Dung mạo và khí chất phiêu diêu như trích tiên, khiến đồng môn kính nể, tăng uy danh cho môn phái.",
    "statModifiers": {
      "factionPrestigeBonus": 30,
      "breakthroughChanceBonus": 0.1
    }
  },
  "tram_mac_it_loi": {
    "id": "tram_mac_it_loi",
    "name": "Trầm Mặc Ít Lời",
    "category": "innate",
    "dimension": "mindset",
    "tier": 1,
    "badge": "🤐",
    "color": "#868e96",
    "description": "Lặng lẽ tu luyện không thích chuyện thị phi, bế quan tu tập đạt hiệu suất tăng thêm 25%.",
    "statModifiers": {
      "qiAbsorptionMultiplier": 1.25
    }
  },
  "truc_giac_nhay_ben": {
    "id": "truc_giac_nhay_ben",
    "name": "Trực Giác Nhạy Bén",
    "category": "innate",
    "dimension": "mindset",
    "tier": 2,
    "badge": "🔮",
    "color": "#da77f2",
    "description": "Linh tính nhạy bén khác thường, luôn dự cảm được hung hiểm và tự động né tránh tập kích bất ngờ.",
    "statModifiers": {
      "dodgeRateBonus": 0.2
    }
  },
  "can_cu_bu_thong_minh": {
    "id": "can_cu_bu_thong_minh",
    "name": "Cần Cù Bù Thông Minh",
    "category": "innate",
    "dimension": "mindset",
    "tier": 2,
    "badge": "📚",
    "color": "#4dabf7",
    "description": "Dù tư chất bình thường nhưng kiên trì nhẫn nại gấp mười lần kẻ khác, tu vi tiến triển vững vàng như núi.",
    "statModifiers": {
      "qiAbsorptionMultiplier": 1.25,
      "breakthroughChanceBonus": 0.1
    }
  },
  "tam_tinh_thao_dong": {
    "id": "tam_tinh_thao_dong",
    "name": "Tâm Tính Thao Động",
    "category": "innate",
    "dimension": "mindset",
    "tier": 1,
    "badge": "🌪️",
    "color": "#ffa94d",
    "description": "Tính tình hiếu động bồn chồn khó ngồi yên một chỗ, cần giải trí giao lưu thường xuyên nếu không tu vi ứ đọng.",
    "conflicts": [
      "kien_dinh_nhu_thiet",
      "tram_mac_it_loi"
    ],
    "statModifiers": {
      "qiAbsorptionMultiplier": 0.85
    }
  },
  "sat_phat_chi_tam": {
    "id": "sat_phat_chi_tam",
    "name": "Sát Phạt Quyết Đoán",
    "category": "innate",
    "dimension": "mindset",
    "tier": 4,
    "badge": "🗡️",
    "color": "#ff6b6b",
    "description": "Xuất thủ như sấm sét không hề nương tay, lập tức kích hoạt đòn sát thủ kết liễu kẻ địch khi máu đối phương xuống thấp.",
    "conflicts": [
      "hien_hoa_nhan_hau",
      "nhat_gan_so_chet"
    ],
    "statModifiers": {
      "combatPowerMultiplier": 1.5,
      "critRateBonus": 0.15
    }
  },
  "kiem_tien_chuyen_the": {
    "id": "kiem_tien_chuyen_the",
    "name": "Kiếm Tiên Chuyển Thế",
    "category": "innate",
    "dimension": "combat",
    "tier": 4,
    "badge": "⚔️",
    "color": "#74c0fc",
    "description": "Kiếp trước là bậc cự phách kiếm đạo chuyển sinh, sử dụng phi kiếm uy lực tăng 70%, vạn kiếm quy tông.",
    "statModifiers": {
      "combatPowerMultiplier": 1.7,
      "critRateBonus": 0.2
    }
  },
  "bach_chien_bat_bai": {
    "id": "bach_chien_bat_bai",
    "name": "Bách Chiến Bất Bại",
    "category": "experience",
    "dimension": "combat",
    "tier": 3,
    "badge": "🛡️",
    "color": "#fa5252",
    "description": "Trải qua vô số trận chiến sinh tử, mỗi khi hạ gục một địch thủ tự động tích lũy sát khí tăng lực chiến.",
    "statModifiers": {
      "combatPowerMultiplier": 1.5,
      "healthMultiplier": 1.2
    }
  },
  "nhat_kich_tat_sat": {
    "id": "nhat_kich_tat_sat",
    "name": "Nhất Kích Tất Sát",
    "category": "innate",
    "dimension": "combat",
    "tier": 4,
    "badge": "💥",
    "color": "#f76707",
    "description": "Sát chiêu kinh thiên động địa, đòn đánh đầu tiên mở màn trận chiến nhận thêm +300% sát thương bạo kích.",
    "statModifiers": {
      "critRateBonus": 0.25,
      "combatPowerMultiplier": 1.4
    }
  },
  "than_hanh_bach_bien": {
    "id": "than_hanh_bach_bien",
    "name": "Thần Hành Bách Biến",
    "category": "technique",
    "dimension": "combat",
    "tier": 3,
    "badge": "👟",
    "color": "#69db7c",
    "description": "Bộ pháp khinh công tuyệt đỉnh, bước chân như ảo ảnh giữa ngàn đao vạn kiếm, né đòn xuất thần.",
    "conflicts": [
      "tat_nguyen_bam_sinh"
    ],
    "statModifiers": {
      "moveSpeedMultiplier": 1.6,
      "dodgeRateBonus": 0.3
    }
  },
  "am_khi_chi_vuong": {
    "id": "am_khi_chi_vuong",
    "name": "Ám Khí Chi Vương",
    "category": "technique",
    "dimension": "combat",
    "tier": 3,
    "badge": "🎯",
    "color": "#e599f7",
    "description": "Bậc thầy phi đao tụ tiễn, tầm phóng thích vũ khí tầm xa tăng 50%, độc tính tẩm trên vũ khí tăng gấp đôi.",
    "statModifiers": {
      "combatPowerMultiplier": 1.35,
      "critRateBonus": 0.15
    }
  },
  "ho_the_cuong_khi": {
    "id": "ho_the_cuong_khi",
    "name": "Hộ Thể Cương Khí",
    "category": "technique",
    "dimension": "combat",
    "tier": 3,
    "badge": "🛡️",
    "color": "#ffd43b",
    "description": "Chân khí ngưng kết thành lớp hộ thuẫn bao bọc quanh thân, triệt tiêu một lượng lớn sát thương mở màn.",
    "statModifiers": {
      "armorBonus": 40,
      "healthMultiplier": 1.2
    }
  },
  "bat_tu_tieu_cuong": {
    "id": "bat_tu_tieu_cuong",
    "name": "Bất Tử Kiên Cường",
    "category": "innate",
    "dimension": "combat",
    "tier": 2,
    "badge": "🪲",
    "color": "#38d9a9",
    "description": "Sinh mệnh ngoan cường bất khuất, khi chịu đòn chí mạng sẽ bất tử trong 3 giây và hồi phục một lượng máu.",
    "statModifiers": {
      "healthMultiplier": 1.3,
      "lifespanBonus": 15
    }
  },
  "than_xa_thu": {
    "id": "than_xa_thu",
    "name": "Thần Xạ Vô Song",
    "category": "experience",
    "dimension": "combat",
    "tier": 2,
    "badge": "🏹",
    "color": "#a9e34b",
    "description": "Cung tiễn bách phát bách trúng, mục tiêu càng ở khoảng cách xa thì sát thương xuyên thấu càng khủng khiếp.",
    "statModifiers": {
      "combatPowerMultiplier": 1.3,
      "critRateBonus": 0.1
    }
  },
  "cuong_chien_huyet_no": {
    "id": "cuong_chien_huyet_no",
    "name": "Cuồng Chiến Huyết Nộ",
    "category": "technique",
    "dimension": "combat",
    "tier": 3,
    "badge": "🪓",
    "color": "#e03131",
    "description": "Bỏ qua toàn bộ phòng thủ bản thân, điên cuồng vung vũ khí chém xé với tốc độ đánh tăng gấp bội.",
    "conflicts": [
      "nhat_gan_so_chet",
      "hien_hoa_nhan_hau"
    ],
    "statModifiers": {
      "attackSpeedMultiplier": 1.6,
      "combatPowerMultiplier": 1.4,
      "armorBonus": -15
    }
  },
  "quyen_tran_son_ha": {
    "id": "quyen_tran_son_ha",
    "name": "Quyền Trấn Sơn Hà",
    "category": "technique",
    "dimension": "combat",
    "tier": 3,
    "badge": "👊",
    "color": "#fcc419",
    "description": "Quyền kình cương mãnh cái thế, giao chiến cận chiến gây sát thương chấn động lan sang các mục tiêu xung quanh.",
    "statModifiers": {
      "combatPowerMultiplier": 1.45,
      "physiqueBonus": 25
    }
  },
  "phuc_kich_cao_thu": {
    "id": "phuc_kich_cao_thu",
    "name": "Phục Kích Cao Thủ",
    "category": "experience",
    "dimension": "combat",
    "tier": 2,
    "badge": "🥷",
    "color": "#868e96",
    "description": "Lợi dụng bụi cỏ và góc khuất rình rập, đánh lén từ phía sau lưng đối thủ tăng thêm 80% sát thương.",
    "statModifiers": {
      "combatPowerMultiplier": 1.3,
      "critRateBonus": 0.2
    }
  },
  "nhat_gan_so_chet": {
    "id": "nhat_gan_so_chet",
    "name": "Nhát Gan Sợ Chết",
    "category": "innate",
    "dimension": "combat",
    "tier": 1,
    "badge": "🐇",
    "color": "#ced4da",
    "description": "Vô cùng sợ chết, khi máu tụt xuống dưới 30% sẽ tự động bỏ chạy thục mạng với tốc độ tăng vọt.",
    "conflicts": [
      "cuong_chien_huyet_no",
      "sat_phat_chi_tam",
      "kien_dinh_nhu_thiet"
    ],
    "statModifiers": {
      "moveSpeedMultiplier": 1.3,
      "combatPowerMultiplier": 0.8
    }
  },
  "tram_sat_linh_thu": {
    "id": "tram_sat_linh_thu",
    "name": "Đồ Tể Dã Thú",
    "category": "experience",
    "dimension": "combat",
    "tier": 2,
    "badge": "🥩",
    "color": "#d9480f",
    "description": "Nắm vững thói quen và điểm yếu của muông thú, tăng 50% sát thương khi đối đầu với dã thú hoang dã.",
    "statModifiers": {
      "combatPowerMultiplier": 1.25
    }
  },
  "tru_ma_tien_si": {
    "id": "tru_ma_tien_si",
    "name": "Tru Ma Tiên Sĩ",
    "category": "experience",
    "dimension": "combat",
    "tier": 2,
    "badge": "✝️",
    "color": "#ffd43b",
    "description": "Đạo tâm thuần chính căm ghét ma đạo, gây thêm 50% sát thương lên Ma tộc và miễn nhiễm với ma khí ô nhiễm.",
    "conflicts": [
      "thien_ma_huyet_the",
      "tam_ma_quan_than"
    ],
    "statModifiers": {
      "combatPowerMultiplier": 1.3,
      "armorBonus": 15
    }
  },
  "nghich_chien_thuong_khung": {
    "id": "nghich_chien_thuong_khung",
    "name": "Nghịch Chiến Thượng Khung",
    "category": "innate",
    "dimension": "combat",
    "tier": 4,
    "badge": "👑",
    "color": "#b197fc",
    "description": "Thiên kiêu có khả năng vượt cấp chiến đấu, đối đầu với kẻ thù có cảnh giới cao hơn bản thân càng thêm dũng mãnh.",
    "statModifiers": {
      "combatPowerMultiplier": 1.6,
      "breakthroughChanceBonus": 0.2
    }
  },
  "dan_dao_tong_su": {
    "id": "dan_dao_tong_su",
    "name": "Đan Đạo Tông Sư",
    "category": "profession",
    "dimension": "profession",
    "tier": 4,
    "badge": "🧪",
    "color": "#20c997",
    "description": "Nắm vững đan đạo chí lý, tỷ lệ luyện đan thành công 100%, đan dược xuất lò tăng 50% dược hiệu.",
    "conflicts": [
      "mu_tit_dan_dao"
    ],
    "statModifiers": {
      "alchemySuccessBonus": 0.5,
      "breakthroughChanceBonus": 0.15
    }
  },
  "luyen_khi_ky_tai": {
    "id": "luyen_khi_ky_tai",
    "name": "Luyện Khí Kỳ Tài",
    "category": "profession",
    "dimension": "profession",
    "tier": 4,
    "badge": "🔨",
    "color": "#fab005",
    "description": "Bậc thầy rèn đúc pháp bảo thần binh, trang bị rèn ra tăng thêm thuộc tính cực phẩm và độ bền gấp đôi.",
    "conflicts": [
      "vung_ve_luyen_khi"
    ],
    "statModifiers": {
      "craftingSpeedMultiplier": 1.8
    }
  },
  "than_nong_chuyen_the": {
    "id": "than_nong_chuyen_the",
    "name": "Thần Nông Chuyển Thế",
    "category": "profession",
    "dimension": "profession",
    "tier": 3,
    "badge": "🌾",
    "color": "#51cf66",
    "description": "Bàn tay gieo mầm màu mỡ, cây lương thực và linh thảo do người này chăm sóc sinh trưởng nhanh gấp ba lần.",
    "statModifiers": {
      "craftingSpeedMultiplier": 1.5
    }
  },
  "tran_phap_dai_su": {
    "id": "tran_phap_dai_su",
    "name": "Trận Pháp Đại Sư",
    "category": "profession",
    "dimension": "profession",
    "tier": 3,
    "badge": "🔯",
    "color": "#cc5de8",
    "description": "Tinh thông đồ án bát quái trận bàn, hộ tông đại trận thiết lập gia tăng 50% uy lực phòng ngự.",
    "statModifiers": {
      "armorBonus": 25,
      "craftingSpeedMultiplier": 1.4
    }
  },
  "van_thu_chi_huu": {
    "id": "van_thu_chi_huu",
    "name": "Vạn Thú Chi Hữu",
    "category": "profession",
    "dimension": "profession",
    "tier": 3,
    "badge": "🐾",
    "color": "#ff922b",
    "description": "Có khí chất thân thiện với muông thú, động vật hoang dã không bao giờ chủ động tấn công, dễ dàng thuần dưỡng.",
    "conflicts": [
      "tram_sat_linh_thu"
    ],
    "statModifiers": {
      "dodgeRateBonus": 0.15
    }
  },
  "than_dong_khai_khoang": {
    "id": "than_dong_khai_khoang",
    "name": "Thần Đồng Khai Khoáng",
    "category": "profession",
    "dimension": "profession",
    "tier": 2,
    "badge": "⛏️",
    "color": "#ced4da",
    "description": "Đánh hơi thấy khoáng mạch linh thạch trong lòng núi, khai thác quặng mỏ thu được gấp đôi sản lượng.",
    "statModifiers": {
      "craftingSpeedMultiplier": 1.5
    }
  },
  "phu_luc_tien_thien": {
    "id": "phu_luc_tien_thien",
    "name": "Bùa Chú Tiên Thiên",
    "category": "profession",
    "dimension": "profession",
    "tier": 3,
    "badge": "📜",
    "color": "#ffd43b",
    "description": "Vẽ bùa chú linh ứng phi phàm, phù lục thi triển tăng 60% sát thương và thời gian duy trì hiệu lực.",
    "statModifiers": {
      "combatPowerMultiplier": 1.25
    }
  },
  "dau_bep_than_cap": {
    "id": "dau_bep_than_cap",
    "name": "Đầu Bếp Thần Cấp",
    "category": "profession",
    "dimension": "profession",
    "tier": 2,
    "badge": "🍳",
    "color": "#ffa94d",
    "description": "Nấu nướng mỹ vị nhân gian, món ăn nấu ra hồi phục hoàn toàn thanh đói và gia tăng tốc độ chạy cho thực khách.",
    "statModifiers": {
      "hungerRateMultiplier": 0.7
    }
  },
  "thao_duoc_tinh_thong": {
    "id": "thao_duoc_tinh_thong",
    "name": "Thảo Dược Tinh Thông",
    "category": "profession",
    "dimension": "profession",
    "tier": 2,
    "badge": "🌿",
    "color": "#69db7c",
    "description": "Hiểu rõ dược tính trăm loài cây, thu hoạch dược liệu không bao giờ làm hỏng rễ để cây tiếp tục tái sinh.",
    "statModifiers": {
      "alchemySuccessBonus": 0.25
    }
  },
  "kientruc_than_tuong": {
    "id": "kientruc_than_tuong",
    "name": "Kiến Trúc Thần Tượng",
    "category": "profession",
    "dimension": "profession",
    "tier": 2,
    "badge": "🏛️",
    "color": "#e599f7",
    "description": "Đôi bàn tay vàng kiến tạo động phủ đình đài, tốc độ xây dựng và tu sửa công trình tăng gấp đôi.",
    "statModifiers": {
      "craftingSpeedMultiplier": 2
    }
  },
  "mu_tit_dan_dao": {
    "id": "mu_tit_dan_dao",
    "name": "Mù Tịt Đan Đạo",
    "category": "innate",
    "dimension": "profession",
    "tier": 1,
    "badge": "💥",
    "color": "#ff6b6b",
    "description": "Không có khiếu luyện đan, cho thảo mộc vào lò là nổ tung khói đen, làm hư hỏng nguyên liệu.",
    "conflicts": [
      "dan_dao_tong_su",
      "thao_duoc_tinh_thong"
    ],
    "statModifiers": {
      "alchemySuccessBonus": -0.8
    }
  },
  "vung_ve_luyen_khi": {
    "id": "vung_ve_luyen_khi",
    "name": "Vụng Về Rèn Đúc",
    "category": "innate",
    "dimension": "profession",
    "tier": 1,
    "badge": "🚫",
    "color": "#868e96",
    "description": "Vụng về chân tay khi cầm búa đúc, tiêu tốn gấp đôi linh thạch và sắt thép khi rèn đúc trang bị.",
    "conflicts": [
      "luyen_khi_ky_tai"
    ],
    "statModifiers": {
      "craftingSpeedMultiplier": 0.5
    }
  },
  "thuong_nghiep_ky_tai": {
    "id": "thuong_nghiep_ky_tai",
    "name": "Thương Nghiệp Kỳ Tài",
    "category": "profession",
    "dimension": "profession",
    "tier": 2,
    "badge": "💰",
    "color": "#fcc419",
    "description": "Đầu óc buôn bán nhạy bén, đàm phán giao thương luôn đem lại nguồn thu linh thạch dồi dào cho môn phái.",
    "statModifiers": {
      "factionPrestigeBonus": 15
    }
  },
  "ngu_long_bi_thuat": {
    "id": "ngu_long_bi_thuat",
    "name": "Ngự Long Bí Thuật",
    "category": "profession",
    "dimension": "profession",
    "tier": 4,
    "badge": "🐲",
    "color": "#f59f00",
    "description": "Nắm giữ bí kíp ngự thú thượng cổ, có khả năng thuần hóa và cưỡi giao long hoặc đại bàng kim sí.",
    "statModifiers": {
      "combatPowerMultiplier": 1.5,
      "moveSpeedMultiplier": 1.3
    }
  },
  "thien_ly_nhan": {
    "id": "thien_ly_nhan",
    "name": "Thiên Lý Nhãn Dược Sư",
    "category": "profession",
    "dimension": "profession",
    "tier": 2,
    "badge": "👀",
    "color": "#4dabf7",
    "description": "Đôi mắt sáng như gương đồng, phát hiện thảo dược quý và mắt linh mạch từ khoảng cách rất xa trên bản đồ.",
    "statModifiers": {
      "moveSpeedMultiplier": 1.15
    }
  },
  "khi_van_chi_tu": {
    "id": "khi_van_chi_tu",
    "name": "Khí Vận Chi Tử",
    "category": "innate",
    "dimension": "social",
    "tier": 4,
    "badge": "🍀",
    "color": "#51cf66",
    "description": "Con cưng của trời đất, đi dạo cũng nhặt được bảo bối, rớt xuống vực sâu cũng gặp tiên nhân truyền thừa.",
    "conflicts": [
      "van_rui_deo_bam"
    ],
    "statModifiers": {
      "breakthroughChanceBonus": 0.3,
      "lifespanBonus": 40,
      "combatPowerMultiplier": 1.3
    }
  },
  "phuc_trach_tham_hau": {
    "id": "phuc_trach_tham_hau",
    "name": "Phúc Trạch Thâm Hậu",
    "category": "innate",
    "dimension": "social",
    "tier": 3,
    "badge": "🧧",
    "color": "#ff6b6b",
    "description": "Phúc lộc tràn trề, tăng 50% cơ hội tìm thấy thần dược cực phẩm và kho báu quý giá khi thám hiểm dã ngoại.",
    "conflicts": [
      "van_rui_deo_bam"
    ],
    "statModifiers": {
      "breakthroughChanceBonus": 0.15
    }
  },
  "van_rui_deo_bam": {
    "id": "van_rui_deo_bam",
    "name": "Vận Rủi Đeo Bám",
    "category": "innate",
    "dimension": "social",
    "tier": 1,
    "badge": "🪦",
    "color": "#495057",
    "description": "Sao quả tạ chiếu mệnh, đi đường dễ trượt ngã, dã thú hay rượt đuổi, thời tiết sấm sét hay nhắm đánh trúng.",
    "conflicts": [
      "khi_van_chi_tu",
      "phuc_trach_tham_hau"
    ],
    "statModifiers": {
      "breakthroughChanceBonus": -0.2,
      "dodgeRateBonus": -0.1
    }
  },
  "lanh_tu_quan_luan": {
    "id": "lanh_tu_quan_luan",
    "name": "Lãnh Tụ Quần Luân",
    "category": "innate",
    "dimension": "social",
    "tier": 3,
    "badge": "👑",
    "color": "#ffd43b",
    "description": "Khí chất minh quân lãnh đạo, khi giữ chức vụ Chưởng Môn giúp toàn bộ đệ tử môn phái tăng 20% tốc độ tu luyện.",
    "statModifiers": {
      "factionPrestigeBonus": 40,
      "breakthroughChanceBonus": 0.1
    }
  },
  "dao_hoa_van_do": {
    "id": "dao_hoa_van_do",
    "name": "Đào Hoa Vận Đỏ",
    "category": "innate",
    "dimension": "social",
    "tier": 2,
    "badge": "🌸",
    "color": "#ff8787",
    "description": "Duyên phận tốt đẹp, rất được lòng người khác giới trong môn phái, dễ dàng kết giao đạo lữ song tu.",
    "conflicts": [
      "khac_the_khac_tu",
      "doc_lai_doc_vang"
    ],
    "statModifiers": {
      "factionPrestigeBonus": 10
    }
  },
  "khac_the_khac_tu": {
    "id": "khac_the_khac_tu",
    "name": "Thiên Sát Cô Tinh",
    "category": "innate",
    "dimension": "social",
    "tier": 2,
    "badge": "🥀",
    "color": "#845ef7",
    "description": "Mang mệnh cách cô độc sát tinh, người đồng hành xung quanh dễ gặp trắc trở, nhưng bản thân hấp thu sát khí cực mạnh.",
    "conflicts": [
      "dao_hoa_van_do",
      "lanh_tu_quan_luan"
    ],
    "statModifiers": {
      "combatPowerMultiplier": 1.4,
      "factionPrestigeBonus": -20
    }
  },
  "doc_lai_doc_vang": {
    "id": "doc_lai_doc_vang",
    "name": "Độc Lai Độc Vãng",
    "category": "innate",
    "dimension": "social",
    "tier": 2,
    "badge": "🐺",
    "color": "#ced4da",
    "description": "Thích hành động đơn thương độc mã, khi xung quanh không có đồng môn sẽ tăng thêm 30% lực chiến và tốc độ.",
    "conflicts": [
      "dao_hoa_van_do",
      "lanh_tu_quan_luan"
    ],
    "statModifiers": {
      "combatPowerMultiplier": 1.3,
      "moveSpeedMultiplier": 1.2
    }
  },
  "truong_nghia_so_tai": {
    "id": "truong_nghia_so_tai",
    "name": "Trượng Nghĩa Sơ Tài",
    "category": "innate",
    "dimension": "social",
    "tier": 2,
    "badge": "🤝",
    "color": "#38d9a9",
    "description": "Hào hiệp trượng nghĩa, không tiếc đan dược tài vật giúp đỡ đồng môn, củng cố lòng trung thành của môn phái.",
    "conflicts": [
      "tham_lam_vo_day",
      "am_hiem_doc_ac"
    ],
    "statModifiers": {
      "factionPrestigeBonus": 25
    }
  },
  "tham_lam_vo_day": {
    "id": "tham_lam_vo_day",
    "name": "Tham Lam Vô Đáy",
    "category": "innate",
    "dimension": "social",
    "tier": 1,
    "badge": "🤑",
    "color": "#fcc419",
    "description": "Bản tính hám lợi, thích tích trữ đan dược và linh thạch làm của riêng, trung thành thấp nhưng kho đồ phong phú.",
    "conflicts": [
      "truong_nghia_so_tai"
    ],
    "statModifiers": {
      "factionPrestigeBonus": -15
    }
  },
  "luon_leo_giao_hoat": {
    "id": "luon_leo_giao_hoat",
    "name": "Lươn Lẹo Giảo Hoạt",
    "category": "innate",
    "dimension": "social",
    "tier": 2,
    "badge": "🦊",
    "color": "#ff922b",
    "description": "Mồm mép khéo léo né tránh xung đột, giảm thù hận từ các thế lực đối địch khi xảy ra va chạm ngoại giao.",
    "statModifiers": {
      "dodgeRateBonus": 0.15
    }
  },
  "trung_quan_ai_mon": {
    "id": "trung_quan_ai_mon",
    "name": "Trung Quân Ái Môn",
    "category": "innate",
    "dimension": "social",
    "tier": 2,
    "badge": "🛡️",
    "color": "#4dabf7",
    "description": "Lòng trung thành tuyệt đối với tông môn, dù môn phái lâm nguy cũng thề chết cùng tông môn không rời.",
    "conflicts": [
      "phan_cot_nghich_tu"
    ],
    "statModifiers": {
      "defenseBonus": 10,
      "factionPrestigeBonus": 15
    }
  },
  "phan_cot_nghich_tu": {
    "id": "phan_cot_nghich_tu",
    "name": "Phản Cốt Nghịch Tử",
    "category": "innate",
    "dimension": "social",
    "tier": 2,
    "badge": "🗡️",
    "color": "#c92a2a",
    "description": "Bản tính tráo trở, dễ dàng phản bội môn phái khi thấy thế lực khác mạnh hơn hoặc khi gặp hiểm nghèo.",
    "conflicts": [
      "trung_quan_ai_mon",
      "kien_dinh_nhu_thiet"
    ],
    "statModifiers": {
      "factionPrestigeBonus": -25
    }
  },
  "uy_nghiem_trang_trong": {
    "id": "uy_nghiem_trang_trong",
    "name": "Uy Nghiêm Trang Trọng",
    "category": "innate",
    "dimension": "social",
    "tier": 2,
    "badge": "⚖️",
    "color": "#ffd43b",
    "description": "Lời nói có trọng lượng như chuông đồng, đệ tử cấp dưới răm rắp tuân lệnh, dẹp tan mọi mầm mống tranh chấp.",
    "statModifiers": {
      "factionPrestigeBonus": 20
    }
  },
  "hien_hoa_nhan_hau": {
    "id": "hien_hoa_nhan_hau",
    "name": "Hiền Hòa Nhân Hậu",
    "category": "innate",
    "dimension": "social",
    "tier": 2,
    "badge": "🕊️",
    "color": "#f8f9fa",
    "description": "Lòng dạ từ bi bác ái, không bao giờ chủ động gây chiến, tự động hóa giải căng thẳng với xung quanh.",
    "conflicts": [
      "sat_phat_chi_tam",
      "am_hiem_doc_ac",
      "cuong_chien_huyet_no",
      "dien_cuong_khat_mau"
    ],
    "statModifiers": {
      "healthMultiplier": 1.2,
      "factionPrestigeBonus": 15
    }
  },
  "am_hiem_doc_ac": {
    "id": "am_hiem_doc_ac",
    "name": "Âm Hiểm Độc Ác",
    "category": "innate",
    "dimension": "social",
    "tier": 2,
    "badge": "🐍",
    "color": "#5c940d",
    "description": "Nụ cười ngoài mặt nhưng trong lòng ngấm độc, ưa thích dùng kế hiểm hóc và ám khí sát thương kẻ thù.",
    "conflicts": [
      "hien_hoa_nhan_hau",
      "xich_tu_chi_tam"
    ],
    "statModifiers": {
      "combatPowerMultiplier": 1.35,
      "critRateBonus": 0.15
    }
  },
  "thuc_than_thao_thiet": {
    "id": "thuc_than_thao_thiet",
    "name": "Thực Thần Thao Thiết",
    "category": "innate",
    "dimension": "survival",
    "tier": 2,
    "badge": "🍖",
    "color": "#f76707",
    "description": "Sức ăn tựa Thao Thiết thượng cổ, ăn lượng thức ăn gấp 3 lần bình thường nhưng chuyển hóa thức ăn thành tu vi.",
    "conflicts": [
      "tich_coc_tien_the"
    ],
    "statModifiers": {
      "hungerRateMultiplier": 2,
      "qiAbsorptionMultiplier": 1.3
    }
  },
  "tich_coc_tien_the": {
    "id": "tich_coc_tien_the",
    "name": "Tích Cốc Tiên Thể",
    "category": "innate",
    "dimension": "survival",
    "tier": 3,
    "badge": "🧘",
    "color": "#38d9a9",
    "description": "Đã hoàn toàn đạt cảnh giới Tích Cốc, không cần ăn uống cơm canh trần tục, hấp thu phong vân sương tuyết để sống.",
    "conflicts": [
      "thuc_than_thao_thiet"
    ],
    "statModifiers": {
      "hungerRateMultiplier": 0.05,
      "thirstRateMultiplier": 0.05,
      "lifespanBonus": 30
    }
  },
  "cu_dem_da_tinh": {
    "id": "cu_dem_da_tinh",
    "name": "Cú Đêm Dã Tính",
    "category": "innate",
    "dimension": "survival",
    "tier": 2,
    "badge": "🦉",
    "color": "#845ef7",
    "description": "Thích ứng hoàn hảo với bóng đêm, đêm tối tăng 40% lực chiến và tốc độ nhưng ban ngày hơi uể oải.",
    "statModifiers": {
      "combatPowerMultiplier": 1.25,
      "moveSpeedMultiplier": 1.2
    }
  },
  "ngu_say_ngan_nam": {
    "id": "ngu_say_ngan_nam",
    "name": "Ngủ Say Như Hợi",
    "category": "innate",
    "dimension": "survival",
    "tier": 1,
    "badge": "💤",
    "color": "#b197fc",
    "description": "Một khi đã đặt lưng xuống ngủ thì sấm sét cũng không tỉnh, bù lại khi thức dậy sinh lực và vết thương lành lặn 100%.",
    "statModifiers": {
      "healthMultiplier": 1.2
    }
  },
  "thich_ung_bang_tuyet": {
    "id": "thich_ung_bang_tuyet",
    "name": "Thích Ứng Băng Tuyết",
    "category": "innate",
    "dimension": "survival",
    "tier": 2,
    "badge": "🌨️",
    "color": "#74c0fc",
    "description": "Miễn nhiễm hoàn toàn cái lạnh cắt da mùa đông, di chuyển trên đồi tuyết băng giá không hề bị giảm tốc.",
    "conflicts": [
      "the_han_so_lanh"
    ],
    "statModifiers": {
      "moveSpeedMultiplier": 1.2,
      "healthMultiplier": 1.1
    }
  },
  "hoa_nhiet_bat_xam": {
    "id": "hoa_nhiet_bat_xam",
    "name": "Hỏa Nhiệt Bất Xâm",
    "category": "innate",
    "dimension": "survival",
    "tier": 2,
    "badge": "🌋",
    "color": "#ff8787",
    "description": "Kháng cự sức nóng thiêu đốt mùa hè hoặc vùng đồi núi dung nham, không bao giờ bị sốc nhiệt kiệt sức.",
    "conflicts": [
      "cuu_am_tuyet_mach"
    ],
    "statModifiers": {
      "healthMultiplier": 1.15
    }
  },
  "tho_ty_nam_son": {
    "id": "tho_ty_nam_son",
    "name": "Thọ Tỷ Nam Sơn",
    "category": "innate",
    "dimension": "survival",
    "tier": 3,
    "badge": "🐢",
    "color": "#69db7c",
    "description": "Khí tức trường thọ như rùa thần ngàn năm, thọ nguyên cơ bản tăng gấp đôi, quá trình già yếu chậm lại.",
    "conflicts": [
      "doan_menh_chi_tuong"
    ],
    "statModifiers": {
      "lifespanBonus": 100,
      "healthMultiplier": 1.25
    }
  },
  "bach_doc_bat_xam": {
    "id": "bach_doc_bat_xam",
    "name": "Bách Độc Bất Xâm",
    "category": "innate",
    "dimension": "survival",
    "tier": 3,
    "badge": "🧪",
    "color": "#20c997",
    "description": "Nội tạng và máu có khả năng thanh lọc vạn độc, miễn nhiễm hoàn toàn độc đầm lầy, độc thảo dược và ám khí độc.",
    "statModifiers": {
      "healthMultiplier": 1.3,
      "lifespanBonus": 25
    }
  },
  "the_han_so_lanh": {
    "id": "the_han_so_lanh",
    "name": "Thể Hàn Sợ Lạnh",
    "category": "innate",
    "dimension": "survival",
    "tier": 1,
    "badge": "🥶",
    "color": "#a5d8ff",
    "description": "Cơ thể rất sợ giá rét, mùa đông đến chân tay run rẩy giảm 30% tốc độ chạy nếu không có lò sưởi.",
    "conflicts": [
      "thich_ung_bang_tuyet",
      "thuan_duong_chi_the"
    ],
    "statModifiers": {
      "moveSpeedMultiplier": 0.85
    }
  },
  "da_tinh_nguyen_thuy": {
    "id": "da_tinh_nguyen_thuy",
    "name": "Dã Tính Nguyên Thủy",
    "category": "innate",
    "dimension": "survival",
    "tier": 2,
    "badge": "🐾",
    "color": "#d9480f",
    "description": "Bản năng dã thú hoang dã đánh hơi nhạy bén, phát hiện nguồn nước, bầy thú và linh quả từ xa.",
    "statModifiers": {
      "moveSpeedMultiplier": 1.25,
      "combatPowerMultiplier": 1.2
    }
  },
  "truong_sinh_quyet": {
    "id": "truong_sinh_quyet",
    "name": "Trường Sinh Quyết",
    "category": "technique",
    "dimension": "survival",
    "tier": 3,
    "badge": "🍃",
    "color": "#51cf66",
    "description": "Đạo gia thánh điển dưỡng sinh diên thọ, linh lực bình hòa liên miên bất tuyệt, tăng thêm 60 năm thọ nguyên.",
    "statModifiers": {
      "lifespanBonus": 60,
      "healthMultiplier": 1.3
    }
  },
  "hoa_viem_chan_kinh": {
    "id": "hoa_viem_chan_kinh",
    "name": "Hỏa Viêm Chân Kinh",
    "category": "technique",
    "dimension": "combat",
    "tier": 3,
    "badge": "🔥",
    "color": "#ff922b",
    "description": "Luyện khí thành tam muội chân hỏa, tăng uy lực chiến đấu công kích cuồng bạo.",
    "statModifiers": {
      "combatPowerMultiplier": 1.5,
      "qiAbsorptionMultiplier": 1.2
    }
  },
  "hon_don_thon_thien": {
    "id": "hon_don_thon_thien",
    "name": "Hỗn Độn Thôn Thiên Công",
    "category": "technique",
    "dimension": "root",
    "tier": 4,
    "badge": "🌀",
    "color": "#cc5de8",
    "description": "Công pháp ma đạo bá đạo cùng cực, có thể thôn phệ vạn vật và dị linh khí để tiến cảnh.",
    "statModifiers": {
      "qiAbsorptionMultiplier": 2.2,
      "combatPowerMultiplier": 1.8
    }
  },
  "loi_kiep_toi_the": {
    "id": "loi_kiep_toi_the",
    "name": "Lôi Kiếp Tôi Thể",
    "category": "experience",
    "dimension": "physique",
    "tier": 3,
    "badge": "⚡",
    "color": "#b197fc",
    "description": "Đã từng ngạnh kháng thiên kiếp lôi phạt mà không chết, thân thể cứng như huyền thiết, miễn nhiễm sấm sét thông thường.",
    "statModifiers": {
      "healthMultiplier": 1.6,
      "physiqueBonus": 20
    }
  },
  "dan_dao_nhap_mon": {
    "id": "dan_dao_nhap_mon",
    "name": "Đan Đạo Dị Tài",
    "category": "experience",
    "dimension": "profession",
    "tier": 2,
    "badge": "🧪",
    "color": "#20c997",
    "description": "Quen thuộc trăm loài thảo mộc, hái thuốc luyện đan có tỷ lệ thành công vượt bậc.",
    "statModifiers": {
      "breakthroughChanceBonus": 0.15,
      "alchemySuccessBonus": 0.3
    }
  }
};

export const LEGACY_TRAIT_ALIASES: Readonly<Record<string, string>> = {
  'kim_giac_tê_huyet': 'kim_giac_te_huyet',
};
