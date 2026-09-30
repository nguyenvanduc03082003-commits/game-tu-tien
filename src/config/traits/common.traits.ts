import { TraitDefinitionV3 } from './trait.types.ts';

export const COMMON_TRAITS_V3: readonly TraitDefinitionV3[] = [
  {
    "id": "doan_menh_chi_tuong",
    "name": "Đoản Mệnh Chi Tướng",
    "description": "Sinh cơ hao tổn từ trong bụng mẹ, nhưng đổi lại kinh mạch nhạy cảm với linh khí.",
    "sourceDescription": "Sinh cơ hao tổn từ trong bụng mẹ, nhưng đổi lại kinh mạch nhạy cảm với linh khí.",
    "sourceVectorText": "Linh +1; Thể +1",
    "sourceEffectsText": "lifespan: -45, hp: x0.78, qiRate: x1.12",
    "tier": 1,
    "dimension": "physique",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [
      "hoang_co_thanh_the",
      "tho_ty_nam_son"
    ],
    "implementation": "active",
    "spawnWeight": 1,
    "traitCost": 3,
    "innateDelta": {
      "aptitude": 0.5
    },
    "learningAffinity": {},
    "modifiers": [
      {
        "key": "lifespanYears",
        "mode": "add",
        "unit": "years",
        "value": -45,
        "sourceKey": "lifespan"
      },
      {
        "key": "healthFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 0.78,
        "sourceKey": "hp"
      },
      {
        "key": "qiRateFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.12,
        "sourceKey": "qiRate"
      }
    ],
    "effects": [],
    "badge": "⏳",
    "color": "#94a3b8",
    "category": "innate",
    "conflicts": [
      "hoang_co_thanh_the",
      "tho_ty_nam_son"
    ],
    "statModifiers": {
      "lifespanBonus": -45,
      "healthMultiplier": 0.78,
      "qiAbsorptionMultiplier": 1.12
    }
  },
  {
    "id": "tat_nguyen_bam_sinh",
    "name": "Tật Nguyền Bẩm Sinh",
    "description": "Tay chân khiếm khuyết khiến di chuyển chậm chạp, nhưng rèn luyện được ý chí kiên cường.",
    "sourceDescription": "Tay chân khiếm khuyết khiến di chuyển chậm chạp, nhưng rèn luyện được ý chí kiên cường.",
    "sourceVectorText": "Thể +6",
    "sourceEffectsText": "moveSpeed: x0.70, dodge: -10%, willpowerGrowth: +15%, painResistance: +15%",
    "tier": 1,
    "dimension": "physique",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [
      "hoang_co_thanh_the",
      "kim_cang_bat_hoai",
      "than_hanh_bach_bien"
    ],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: painResistance",
    "unmappedEffectKeys": [
      "painResistance"
    ],
    "spawnWeight": 0,
    "traitCost": 3,
    "innateDelta": {},
    "learningAffinity": {},
    "modifiers": [
      {
        "key": "moveSpeedFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 0.7,
        "sourceKey": "moveSpeed"
      },
      {
        "key": "dodgeChanceBonus",
        "mode": "add",
        "unit": "probability",
        "value": -0.1,
        "sourceKey": "dodge"
      },
      {
        "key": "willTrainingBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.15,
        "sourceKey": "willpowerGrowth"
      }
    ],
    "effects": [],
    "badge": "🦯",
    "color": "#94a3b8",
    "category": "innate",
    "conflicts": [
      "hoang_co_thanh_the",
      "kim_cang_bat_hoai",
      "than_hanh_bach_bien"
    ],
    "statModifiers": {
      "moveSpeedMultiplier": 0.7,
      "dodgeRateBonus": -0.1
    }
  },
  {
    "id": "bach_benh_quan_than",
    "name": "Bách Bệnh Quấn Thân",
    "description": "Cơ thể ốm yếu quanh năm, khí huyết suy bại, phòng ngự kém.",
    "sourceDescription": "Cơ thể ốm yếu quanh năm, khí huyết suy bại, phòng ngự kém.",
    "sourceVectorText": "Thể -4; Chiến -5",
    "sourceEffectsText": "hp: x0.62, def: -5, atk: x0.82, diseaseResistance: -20%",
    "tier": 1,
    "dimension": "physique",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [
      "hoang_co_thanh_the",
      "long_huyet_ba_the"
    ],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: diseaseResistance",
    "unmappedEffectKeys": [
      "diseaseResistance"
    ],
    "spawnWeight": 0,
    "traitCost": 3,
    "innateDelta": {
      "physique": -2
    },
    "learningAffinity": {
      "combat": -5
    },
    "modifiers": [
      {
        "key": "healthFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 0.62,
        "sourceKey": "hp"
      },
      {
        "key": "defenseFlat",
        "mode": "add",
        "unit": "flat",
        "value": -5,
        "sourceKey": "def"
      },
      {
        "key": "attackFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 0.82,
        "sourceKey": "atk"
      }
    ],
    "effects": [],
    "badge": "🤒",
    "color": "#94a3b8",
    "category": "innate",
    "conflicts": [
      "hoang_co_thanh_the",
      "long_huyet_ba_the"
    ],
    "statModifiers": {
      "healthMultiplier": 0.62,
      "defenseBonus": -5,
      "combatPowerMultiplier": 0.82
    }
  },
  {
    "id": "khi_huyet_hu_nhuoc",
    "name": "Khí Huyết Hư Nhược",
    "description": "Khí huyết lưu thông chậm, thể lực kém nhưng ít tiêu hao thức ăn.",
    "sourceDescription": "Khí huyết lưu thông chậm, thể lực kém nhưng ít tiêu hao thức ăn.",
    "sourceVectorText": "Thể +1",
    "sourceEffectsText": "hp: x0.82, physique: -4, hungerRate: x0.82",
    "tier": 1,
    "dimension": "physique",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "active",
    "spawnWeight": 1,
    "traitCost": 3,
    "innateDelta": {},
    "learningAffinity": {},
    "modifiers": [
      {
        "key": "healthFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 0.82,
        "sourceKey": "hp"
      },
      {
        "key": "legacyPhysiqueFlat",
        "mode": "add",
        "unit": "flat",
        "value": -4,
        "sourceKey": "physique"
      },
      {
        "key": "hungerRateFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 0.82,
        "sourceKey": "hungerRate"
      }
    ],
    "effects": [],
    "badge": "🛡️",
    "color": "#94a3b8",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "healthMultiplier": 0.82,
      "physiqueBonus": -4,
      "hungerRateMultiplier": 0.82
    }
  },
  {
    "id": "can_cot_cuong_trang",
    "name": "Cân Cốt Cường Tráng",
    "description": "Xương cốt rắn chắc, cơ bắp cuồn cuộn, chịu đòn tốt hơn người thường.",
    "sourceDescription": "Xương cốt rắn chắc, cơ bắp cuồn cuộn, chịu đòn tốt hơn người thường.",
    "sourceVectorText": "Thể +14",
    "sourceEffectsText": "hp: x1.25, def: +8, physique: +6",
    "tier": 2,
    "dimension": "physique",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "active",
    "spawnWeight": 1,
    "traitCost": 8,
    "innateDelta": {
      "physique": 7
    },
    "learningAffinity": {},
    "modifiers": [
      {
        "key": "healthFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.25,
        "sourceKey": "hp"
      },
      {
        "key": "defenseFlat",
        "mode": "add",
        "unit": "flat",
        "value": 8,
        "sourceKey": "def"
      },
      {
        "key": "legacyPhysiqueFlat",
        "mode": "add",
        "unit": "flat",
        "value": 6,
        "sourceKey": "physique"
      }
    ],
    "effects": [],
    "badge": "🛡️",
    "color": "#34d399",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "healthMultiplier": 1.25,
      "defenseBonus": 8,
      "physiqueBonus": 6
    }
  },
  {
    "id": "bat_tu_tieu_cuong",
    "name": "Bất Tử Tiểu Cường",
    "description": "Sinh mệnh lực dai dẳng đến khó tin, trọng thương vẫn cố lết đi được.",
    "sourceDescription": "Sinh mệnh lực dai dẳng đến khó tin, trọng thương vẫn cố lết đi được.",
    "sourceVectorText": "Thể +14",
    "sourceEffectsText": "hp: x1.3, def: +10, dodge: +10%, lifespan: +50",
    "tier": 2,
    "dimension": "physique",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "active",
    "spawnWeight": 1,
    "traitCost": 8,
    "innateDelta": {
      "physique": 7
    },
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
        "key": "defenseFlat",
        "mode": "add",
        "unit": "flat",
        "value": 10,
        "sourceKey": "def"
      },
      {
        "key": "dodgeChanceBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.1,
        "sourceKey": "dodge"
      },
      {
        "key": "lifespanYears",
        "mode": "add",
        "unit": "years",
        "value": 50,
        "sourceKey": "lifespan"
      }
    ],
    "effects": [],
    "badge": "🪲",
    "color": "#34d399",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "healthMultiplier": 1.3,
      "defenseBonus": 10,
      "dodgeRateBonus": 0.1,
      "lifespanBonus": 50
    }
  },
  {
    "id": "kinh_mach_rong_lon",
    "name": "Kinh Mạch Rộng Lớn",
    "description": "Kinh mạch dẻo dai và rộng gấp rưỡi bình thường, vận chuyển linh lực mượt mà.",
    "sourceDescription": "Kinh mạch dẻo dai và rộng gấp rưỡi bình thường, vận chuyển linh lực mượt mà.",
    "sourceVectorText": "Linh +2; Thể +13",
    "sourceEffectsText": "qiRate: x1.25, breakthrough: +8%, hp: x1.1",
    "tier": 2,
    "dimension": "physique",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "active",
    "spawnWeight": 1,
    "traitCost": 8,
    "innateDelta": {
      "aptitude": 1,
      "physique": 6.5
    },
    "learningAffinity": {},
    "modifiers": [
      {
        "key": "qiRateFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.25,
        "sourceKey": "qiRate"
      },
      {
        "key": "breakthroughChanceBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.08,
        "sourceKey": "breakthrough"
      },
      {
        "key": "healthFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.1,
        "sourceKey": "hp"
      }
    ],
    "effects": [],
    "badge": "🛡️",
    "color": "#34d399",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "qiAbsorptionMultiplier": 1.25,
      "breakthroughChanceBonus": 0.08,
      "healthMultiplier": 1.1
    }
  },
  {
    "id": "thien_sinh_than_luc",
    "name": "Thiên Sinh Thần Lực",
    "description": "Sinh ra đã có sức mạnh ngàn cân, làm việc nặng hay cận chiến đều vượt trội.",
    "sourceDescription": "Sinh ra đã có sức mạnh ngàn cân, làm việc nặng hay cận chiến đều vượt trội.",
    "sourceVectorText": "Thể +12; Chiến +2; Nghệ +2",
    "sourceEffectsText": "atk: x1.3, physique: +8, craftingSpeed: x1.2",
    "tier": 2,
    "dimension": "physique",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "active",
    "spawnWeight": 1,
    "traitCost": 8,
    "innateDelta": {
      "physique": 6
    },
    "learningAffinity": {
      "combat": 2,
      "profession": 2
    },
    "modifiers": [
      {
        "key": "attackFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.3,
        "sourceKey": "atk"
      },
      {
        "key": "legacyPhysiqueFlat",
        "mode": "add",
        "unit": "flat",
        "value": 8,
        "sourceKey": "physique"
      },
      {
        "key": "workSpeedFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.2,
        "sourceKey": "craftingSpeed"
      }
    ],
    "effects": [],
    "badge": "🛡️",
    "color": "#34d399",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "combatPowerMultiplier": 1.3,
      "physiqueBonus": 8,
      "craftingSpeedMultiplier": 1.2
    }
  },
  {
    "id": "thuan_duong_chi_the",
    "name": "Thuần Dương Chi Thể",
    "description": "Dương khí hừng hực như mặt trời ban trưa, khí huyết dồi dào, tà ma khó xâm.",
    "sourceDescription": "Dương khí hừng hực như mặt trời ban trưa, khí huyết dồi dào, tà ma khó xâm.",
    "sourceVectorText": "Linh +2; Thể +24; Chiến +3",
    "sourceEffectsText": "hp: x1.5, atk: x1.4, qiRate: x1.3, lifespan: +80, heartDemonResistance: +20%",
    "tier": 3,
    "dimension": "physique",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [
      "bang_phach_han_the",
      "cuu_am_tuyet_mach",
      "the_han_so_lanh",
      "u_minh_quy_the"
    ],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: heartDemonResistance",
    "unmappedEffectKeys": [
      "heartDemonResistance"
    ],
    "spawnWeight": 0,
    "traitCost": 18,
    "innateDelta": {
      "aptitude": 1,
      "physique": 12
    },
    "learningAffinity": {
      "combat": 3
    },
    "modifiers": [
      {
        "key": "healthFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.5,
        "sourceKey": "hp"
      },
      {
        "key": "attackFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.4,
        "sourceKey": "atk"
      },
      {
        "key": "qiRateFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.3,
        "sourceKey": "qiRate"
      },
      {
        "key": "lifespanYears",
        "mode": "add",
        "unit": "years",
        "value": 80,
        "sourceKey": "lifespan"
      }
    ],
    "effects": [],
    "badge": "☀️",
    "color": "#a78bfa",
    "category": "innate",
    "conflicts": [
      "bang_phach_han_the",
      "cuu_am_tuyet_mach",
      "the_han_so_lanh",
      "u_minh_quy_the"
    ],
    "statModifiers": {
      "healthMultiplier": 1.5,
      "combatPowerMultiplier": 1.4,
      "qiAbsorptionMultiplier": 1.3,
      "lifespanBonus": 80
    }
  },
  {
    "id": "cuu_am_tuyet_mach",
    "name": "Cửu Âm Tuyệt Mạch",
    "description": "Hàn khí thấu xương, cực kỳ hợp tu luyện công pháp âm hàn nhưng tổn hại tuổi thọ.",
    "sourceDescription": "Hàn khí thấu xương, cực kỳ hợp tu luyện công pháp âm hàn nhưng tổn hại tuổi thọ.",
    "sourceVectorText": "Linh +25; Ngộ +15; Thể -12",
    "sourceEffectsText": "qiRate: x1.55, comprehension: x1.45, hp: x0.72, lifespan: -35, iceAffinity: +35%",
    "tier": 3,
    "dimension": "physique",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [
      "hoa_nhiet_bat_xam",
      "thuan_duong_chi_the"
    ],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: iceAffinity",
    "unmappedEffectKeys": [
      "iceAffinity"
    ],
    "spawnWeight": 0,
    "traitCost": 18,
    "innateDelta": {
      "comprehension": 7.5,
      "aptitude": 12.5,
      "physique": -6
    },
    "learningAffinity": {},
    "modifiers": [
      {
        "key": "qiRateFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.55,
        "sourceKey": "qiRate"
      },
      {
        "key": "techniqueLearningFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.45,
        "sourceKey": "comprehension"
      },
      {
        "key": "healthFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 0.72,
        "sourceKey": "hp"
      },
      {
        "key": "lifespanYears",
        "mode": "add",
        "unit": "years",
        "value": -35,
        "sourceKey": "lifespan"
      }
    ],
    "effects": [],
    "badge": "❄️",
    "color": "#a78bfa",
    "category": "innate",
    "conflicts": [
      "hoa_nhiet_bat_xam",
      "thuan_duong_chi_the"
    ],
    "statModifiers": {
      "qiAbsorptionMultiplier": 1.55,
      "comprehensionMultiplier": 1.45,
      "healthMultiplier": 0.72,
      "lifespanBonus": -35
    }
  },
  {
    "id": "kim_cang_bat_hoai",
    "name": "Kim Cang Bất Hoại",
    "description": "Nhục thân cứng rắn như kim cương bất hoại, đao kiếm tầm thường chém chỉ tóe lửa.",
    "sourceDescription": "Nhục thân cứng rắn như kim cương bất hoại, đao kiếm tầm thường chém chỉ tóe lửa.",
    "sourceVectorText": "Thể +25",
    "sourceEffectsText": "hp: x1.6, def: +25, armor: +25, moveSpeed: x0.9",
    "tier": 3,
    "dimension": "physique",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [
      "tat_nguyen_bam_sinh"
    ],
    "implementation": "active",
    "spawnWeight": 1,
    "traitCost": 18,
    "innateDelta": {
      "physique": 12.5
    },
    "learningAffinity": {},
    "modifiers": [
      {
        "key": "healthFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.6,
        "sourceKey": "hp"
      },
      {
        "key": "defenseFlat",
        "mode": "add",
        "unit": "flat",
        "value": 25,
        "sourceKey": "def"
      },
      {
        "key": "armorFlat",
        "mode": "add",
        "unit": "flat",
        "value": 25,
        "sourceKey": "armor"
      },
      {
        "key": "moveSpeedFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 0.9,
        "sourceKey": "moveSpeed"
      }
    ],
    "effects": [],
    "badge": "🥋",
    "color": "#a78bfa",
    "category": "innate",
    "conflicts": [
      "tat_nguyen_bam_sinh"
    ],
    "statModifiers": {
      "healthMultiplier": 1.6,
      "defenseBonus": 25,
      "armorBonus": 25,
      "moveSpeedMultiplier": 0.9
    }
  },
  {
    "id": "loi_kiep_toi_the",
    "name": "Lôi Kiếp Tôi Thể",
    "description": "Thân thể từng tắm trong thiên lôi kiếp, gân cốt mang lôi uy vạn quân.",
    "sourceDescription": "Thân thể từng tắm trong thiên lôi kiếp, gân cốt mang lôi uy vạn quân.",
    "sourceVectorText": "Thể +24; Chiến +3",
    "sourceEffectsText": "hp: x1.5, atk: x1.4, def: +15, armor: +15, willpowerBonus: +25",
    "tier": 3,
    "dimension": "physique",
    "origin": "acquired",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [
      {
        "kind": "achievement",
        "key": "tribulation_passed",
        "value": 1
      }
    ],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "active",
    "spawnWeight": 0,
    "traitCost": 18,
    "innateDelta": {},
    "learningAffinity": {
      "combat": 3
    },
    "modifiers": [
      {
        "key": "healthFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.5,
        "sourceKey": "hp"
      },
      {
        "key": "attackFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.4,
        "sourceKey": "atk"
      },
      {
        "key": "defenseFlat",
        "mode": "add",
        "unit": "flat",
        "value": 15,
        "sourceKey": "def"
      },
      {
        "key": "armorFlat",
        "mode": "add",
        "unit": "flat",
        "value": 15,
        "sourceKey": "armor"
      },
      {
        "key": "willTrainingBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.125,
        "sourceKey": "willpowerBonus"
      }
    ],
    "effects": [],
    "badge": "⚡",
    "color": "#a78bfa",
    "category": "experience",
    "conflicts": [],
    "statModifiers": {
      "healthMultiplier": 1.5,
      "combatPowerMultiplier": 1.4,
      "defenseBonus": 15,
      "armorBonus": 15
    }
  },
  {
    "id": "ba_vuong_trong_dong",
    "name": "Bá Vương Trọng Đồng",
    "description": "Một mắt hai con ngươi của bậc chí tôn, nhìn thấu mọi sơ hở chiêu thức đối phương.",
    "sourceDescription": "Một mắt hai con ngươi của bậc chí tôn, nhìn thấu mọi sơ hở chiêu thức đối phương.",
    "sourceVectorText": "Ngộ +4; Thể +30; Chiến +5",
    "sourceEffectsText": "crit: +25%, dodge: +20%, atk: x1.6, comprehension: x1.5",
    "tier": 4,
    "dimension": "physique",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "active",
    "spawnWeight": 1,
    "traitCost": 35,
    "innateDelta": {
      "comprehension": 2,
      "physique": 15
    },
    "learningAffinity": {
      "combat": 5
    },
    "modifiers": [
      {
        "key": "critChanceBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.25,
        "sourceKey": "crit"
      },
      {
        "key": "dodgeChanceBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.2,
        "sourceKey": "dodge"
      },
      {
        "key": "attackFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.6,
        "sourceKey": "atk"
      },
      {
        "key": "techniqueLearningFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.5,
        "sourceKey": "comprehension"
      }
    ],
    "effects": [],
    "badge": "👁️",
    "color": "#fbbf24",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "critRateBonus": 0.25,
      "dodgeRateBonus": 0.2,
      "combatPowerMultiplier": 1.6,
      "comprehensionMultiplier": 1.5
    }
  },
  {
    "id": "khong_gian_dao_the",
    "name": "Không Gian Đạo Thể",
    "description": "Thân thể tương hợp với pháp tắc không gian, bước chân hư ảo xuất quỷ nhập thần.",
    "sourceDescription": "Thân thể tương hợp với pháp tắc không gian, bước chân hư ảo xuất quỷ nhập thần.",
    "sourceVectorText": "Ngộ +6; Thể +30",
    "sourceEffectsText": "moveSpeed: x1.7, dodge: +35%, comprehension: x1.8",
    "tier": 4,
    "dimension": "physique",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [
      "major_physique"
    ],
    "conflictsWith": [],
    "implementation": "active",
    "spawnWeight": 1,
    "traitCost": 35,
    "innateDelta": {
      "comprehension": 3,
      "physique": 15
    },
    "learningAffinity": {},
    "modifiers": [
      {
        "key": "moveSpeedFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.7,
        "sourceKey": "moveSpeed"
      },
      {
        "key": "dodgeChanceBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.35,
        "sourceKey": "dodge"
      },
      {
        "key": "techniqueLearningFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.8,
        "sourceKey": "comprehension"
      }
    ],
    "effects": [],
    "badge": "🌌",
    "color": "#fbbf24",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "moveSpeedMultiplier": 1.7,
      "dodgeRateBonus": 0.35,
      "comprehensionMultiplier": 1.8
    }
  },
  {
    "id": "bat_diet_kim_than",
    "name": "Bất Diệt Kim Thân",
    "description": "Huyết nhục hóa thành bất diệt kim khu, vạn pháp khó thương, sinh cơ vô tận.",
    "sourceDescription": "Huyết nhục hóa thành bất diệt kim khu, vạn pháp khó thương, sinh cơ vô tận.",
    "sourceVectorText": "Thể +39",
    "sourceEffectsText": "hp: x2.1, def: +35, armor: +38, lifespan: +200",
    "tier": 4,
    "dimension": "physique",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [
      "major_physique"
    ],
    "conflictsWith": [],
    "implementation": "active",
    "spawnWeight": 1,
    "traitCost": 35,
    "innateDelta": {
      "physique": 19.5
    },
    "learningAffinity": {},
    "modifiers": [
      {
        "key": "healthFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 2.1,
        "sourceKey": "hp"
      },
      {
        "key": "defenseFlat",
        "mode": "add",
        "unit": "flat",
        "value": 35,
        "sourceKey": "def"
      },
      {
        "key": "armorFlat",
        "mode": "add",
        "unit": "flat",
        "value": 38,
        "sourceKey": "armor"
      },
      {
        "key": "lifespanYears",
        "mode": "add",
        "unit": "years",
        "value": 200,
        "sourceKey": "lifespan"
      }
    ],
    "effects": [],
    "badge": "🛡️",
    "color": "#fbbf24",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "healthMultiplier": 2.1,
      "defenseBonus": 35,
      "armorBonus": 38,
      "lifespanBonus": 200
    }
  },
  {
    "id": "tinh_than_chien_the",
    "name": "Tinh Thần Chiến Thể",
    "description": "Dẫn quang huy tinh tú trên chín tầng trời tôi luyện nhục thân, ban đêm càng mạnh.",
    "sourceDescription": "Dẫn quang huy tinh tú trên chín tầng trời tôi luyện nhục thân, ban đêm càng mạnh.",
    "sourceVectorText": "Linh +4; Thể +38; Chiến +6",
    "sourceEffectsText": "hp: x2, atk: x1.75, qiRate: x1.5, armor: +20",
    "tier": 4,
    "dimension": "physique",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [
      "major_physique"
    ],
    "conflictsWith": [],
    "implementation": "active",
    "spawnWeight": 1,
    "traitCost": 35,
    "innateDelta": {
      "aptitude": 2,
      "physique": 19
    },
    "learningAffinity": {
      "combat": 6
    },
    "modifiers": [
      {
        "key": "healthFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 2,
        "sourceKey": "hp"
      },
      {
        "key": "attackFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.75,
        "sourceKey": "atk"
      },
      {
        "key": "qiRateFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.5,
        "sourceKey": "qiRate"
      },
      {
        "key": "armorFlat",
        "mode": "add",
        "unit": "flat",
        "value": 20,
        "sourceKey": "armor"
      }
    ],
    "effects": [],
    "badge": "🛡️",
    "color": "#fbbf24",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "healthMultiplier": 2,
      "combatPowerMultiplier": 1.75,
      "qiAbsorptionMultiplier": 1.5,
      "armorBonus": 20
    }
  },
  {
    "id": "hon_don_than_ma_the",
    "name": "Hỗn Độn Thần Ma Thể",
    "description": "Nhục thân ngang hàng Thần Ma thời khai thiên lập địa, dung nạp vạn chủng năng lượng.",
    "sourceDescription": "Nhục thân ngang hàng Thần Ma thời khai thiên lập địa, dung nạp vạn chủng năng lượng.",
    "sourceVectorText": "Linh +6; Thể +56; Chiến +10",
    "sourceEffectsText": "hp: x2.70, atk: x2.25, armor: +50, qiRate: x1.80, willpowerBonus: +55",
    "tier": 5,
    "dimension": "physique",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [
      "major_physique"
    ],
    "conflictsWith": [],
    "implementation": "active",
    "spawnWeight": 1,
    "traitCost": 60,
    "innateDelta": {
      "aptitude": 3,
      "physique": 28
    },
    "learningAffinity": {
      "combat": 10
    },
    "modifiers": [
      {
        "key": "healthFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 2.7,
        "sourceKey": "hp"
      },
      {
        "key": "attackFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 2.25,
        "sourceKey": "atk"
      },
      {
        "key": "armorFlat",
        "mode": "add",
        "unit": "flat",
        "value": 50,
        "sourceKey": "armor"
      },
      {
        "key": "qiRateFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.8,
        "sourceKey": "qiRate"
      },
      {
        "key": "willTrainingBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.25,
        "sourceKey": "willpowerBonus"
      }
    ],
    "effects": [],
    "badge": "🛡️",
    "color": "#fb7185",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "healthMultiplier": 2.7,
      "combatPowerMultiplier": 2.25,
      "armorBonus": 50,
      "qiAbsorptionMultiplier": 1.8
    }
  },
  {
    "id": "bat_tu_bat_diet_khu",
    "name": "Bất Tử Bất Diệt Khu",
    "description": "Còn một giọt máu cũng có thể tái tạo nhục thân, thọ cùng trời đất.",
    "sourceDescription": "Còn một giọt máu cũng có thể tái tạo nhục thân, thọ cùng trời đất.",
    "sourceVectorText": "Thể +55",
    "sourceEffectsText": "hp: x2.60, def: +45, lifespan: +600, breakthrough: +20%, regeneration: +250%",
    "tier": 5,
    "dimension": "physique",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [
      "major_physique"
    ],
    "conflictsWith": [],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: regeneration",
    "unmappedEffectKeys": [
      "regeneration"
    ],
    "spawnWeight": 0,
    "traitCost": 60,
    "innateDelta": {
      "physique": 27.5
    },
    "learningAffinity": {},
    "modifiers": [
      {
        "key": "healthFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 2.6,
        "sourceKey": "hp"
      },
      {
        "key": "defenseFlat",
        "mode": "add",
        "unit": "flat",
        "value": 45,
        "sourceKey": "def"
      },
      {
        "key": "lifespanYears",
        "mode": "add",
        "unit": "years",
        "value": 600,
        "sourceKey": "lifespan"
      },
      {
        "key": "breakthroughChanceBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.2,
        "sourceKey": "breakthrough"
      }
    ],
    "effects": [],
    "badge": "🛡️",
    "color": "#fb7185",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "healthMultiplier": 2.6,
      "defenseBonus": 45,
      "lifespanBonus": 600,
      "breakthroughChanceBonus": 0.2
    }
  },
  {
    "id": "thoi_gian_linh_the",
    "name": "Thời Gian Linh Thể",
    "description": "Pháp tắc tuế nguyệt vờn quanh thân, tốc độ ra đòn và lĩnh ngộ vượt ngoài dòng chảy thời gian.",
    "sourceDescription": "Pháp tắc tuế nguyệt vờn quanh thân, tốc độ ra đòn và lĩnh ngộ vượt ngoài dòng chảy thời gian.",
    "sourceVectorText": "Ngộ +9; Thể +42",
    "sourceEffectsText": "atkSpeed: x1.50, moveSpeed: x1.45, comprehension: x2.10, dodge: +35%, timeInsight: +25%",
    "tier": 5,
    "dimension": "physique",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [
      "major_physique"
    ],
    "conflictsWith": [],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: timeInsight",
    "unmappedEffectKeys": [
      "timeInsight"
    ],
    "spawnWeight": 0,
    "traitCost": 60,
    "innateDelta": {
      "comprehension": 4.5,
      "physique": 21
    },
    "learningAffinity": {},
    "modifiers": [
      {
        "key": "attackSpeedFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.5,
        "sourceKey": "atkSpeed"
      },
      {
        "key": "moveSpeedFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.45,
        "sourceKey": "moveSpeed"
      },
      {
        "key": "techniqueLearningFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 2.1,
        "sourceKey": "comprehension"
      },
      {
        "key": "dodgeChanceBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.35,
        "sourceKey": "dodge"
      }
    ],
    "effects": [],
    "badge": "🛡️",
    "color": "#fb7185",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "attackSpeedMultiplier": 1.5,
      "moveSpeedMultiplier": 1.45,
      "comprehensionMultiplier": 2.1,
      "dodgeRateBonus": 0.35
    }
  },
  {
    "id": "hong_mong_tien_thai",
    "name": "Hồng Mông Tiên Thai",
    "description": "Thai cốt kết từ một sợi Hồng Mông Tử Khí thuở sơ khai, tu luyện không gặp bình cảnh.",
    "sourceDescription": "Thai cốt kết từ một sợi Hồng Mông Tử Khí thuở sơ khai, tu luyện không gặp bình cảnh.",
    "sourceVectorText": "Linh +11; Ngộ +10; Thể +42",
    "sourceEffectsText": "qiRate: x2.40, breakthrough: +30%, comprehension: x2.20, lifespan: +500, bottleneckPenalty: x0.55",
    "tier": 5,
    "dimension": "physique",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [
      "major_physique"
    ],
    "conflictsWith": [],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: bottleneckPenalty",
    "unmappedEffectKeys": [
      "bottleneckPenalty"
    ],
    "spawnWeight": 0,
    "traitCost": 60,
    "innateDelta": {
      "comprehension": 5,
      "aptitude": 5.5,
      "physique": 21
    },
    "learningAffinity": {},
    "modifiers": [
      {
        "key": "qiRateFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 2.4,
        "sourceKey": "qiRate"
      },
      {
        "key": "breakthroughChanceBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.3,
        "sourceKey": "breakthrough"
      },
      {
        "key": "techniqueLearningFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 2.2,
        "sourceKey": "comprehension"
      },
      {
        "key": "lifespanYears",
        "mode": "add",
        "unit": "years",
        "value": 500,
        "sourceKey": "lifespan"
      }
    ],
    "effects": [],
    "badge": "🛡️",
    "color": "#fb7185",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "qiAbsorptionMultiplier": 2.4,
      "breakthroughChanceBonus": 0.3,
      "comprehensionMultiplier": 2.2,
      "lifespanBonus": 500
    }
  },
  {
    "id": "phe_linh_can",
    "name": "Ngũ Hành Phế Linh Căn",
    "description": "Linh căn tạp loạn lại mỏng manh, hấp thu linh khí cực chậm nhưng cơ thể dẻo dai.",
    "sourceDescription": "Linh căn tạp loạn lại mỏng manh, hấp thu linh khí cực chậm nhưng cơ thể dẻo dai.",
    "sourceVectorText": "Linh -22; Thể +4; Đạo tâm -4",
    "sourceEffectsText": "qiRate: x0.45, breakthrough: -18%, hp: x1.10, multiElementCompatibility: +15%",
    "tier": 1,
    "dimension": "root",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [
      "primary_root"
    ],
    "conflictsWith": [
      "hon_don_dao_can",
      "ngu_hanh_cau_toan",
      "thien_linh_can",
      "tien_thien_dao_the"
    ],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: multiElementCompatibility",
    "unmappedEffectKeys": [
      "multiElementCompatibility"
    ],
    "spawnWeight": 0,
    "traitCost": 3,
    "innateDelta": {
      "physique": 2
    },
    "primaryRootOverride": {
      "rootType": "impure",
      "purity": 25,
      "elements": [
        "kim",
        "moc",
        "thuy",
        "hoa",
        "tho"
      ],
      "qiRateFactor": 0.45
    },
    "learningAffinity": {},
    "modifiers": [
      {
        "key": "qiRateFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 0.45,
        "sourceKey": "qiRate"
      },
      {
        "key": "breakthroughChanceBonus",
        "mode": "add",
        "unit": "probability",
        "value": -0.18,
        "sourceKey": "breakthrough"
      },
      {
        "key": "healthFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.1,
        "sourceKey": "hp"
      },
      {
        "key": "mindTrainingBonus",
        "mode": "add",
        "unit": "probability",
        "value": -0.02,
        "sourceKey": "daoHeartVector"
      }
    ],
    "effects": [],
    "badge": "🌑",
    "color": "#94a3b8",
    "category": "innate",
    "conflicts": [
      "hon_don_dao_can",
      "ngu_hanh_cau_toan",
      "thien_linh_can",
      "tien_thien_dao_the"
    ],
    "statModifiers": {
      "qiAbsorptionMultiplier": 0.45,
      "breakthroughChanceBonus": -0.18,
      "healthMultiplier": 1.1
    }
  },
  {
    "id": "kinh_mach_tac_nghen",
    "name": "Kinh Mạch Tắc Nghẽn",
    "description": "Nhiều huyệt đạo bẩm sinh đóng kín, phải tốn gấp đôi công sức để dẫn khí nhập thể.",
    "sourceDescription": "Nhiều huyệt đạo bẩm sinh đóng kín, phải tốn gấp đôi công sức để dẫn khí nhập thể.",
    "sourceVectorText": "Linh -4; Đạo tâm -4",
    "sourceEffectsText": "qiRate: x0.6, breakthrough: -10%, willpowerBonus: +10",
    "tier": 1,
    "dimension": "root",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "active",
    "spawnWeight": 1,
    "traitCost": 3,
    "innateDelta": {
      "aptitude": -2
    },
    "learningAffinity": {},
    "modifiers": [
      {
        "key": "qiRateFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 0.6,
        "sourceKey": "qiRate"
      },
      {
        "key": "breakthroughChanceBonus",
        "mode": "add",
        "unit": "probability",
        "value": -0.1,
        "sourceKey": "breakthrough"
      },
      {
        "key": "willTrainingBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.05,
        "sourceKey": "willpowerBonus"
      },
      {
        "key": "mindTrainingBonus",
        "mode": "add",
        "unit": "probability",
        "value": -0.02,
        "sourceKey": "daoHeartVector"
      }
    ],
    "effects": [],
    "badge": "🌟",
    "color": "#94a3b8",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "qiAbsorptionMultiplier": 0.6,
      "breakthroughChanceBonus": -0.1
    }
  },
  {
    "id": "linh_khi_bai_xich",
    "name": "Linh Khí Bài Xích",
    "description": "Thể chất khó giữ được linh khí, ngồi thiền nửa ngày tán mất một nửa.",
    "sourceDescription": "Thể chất khó giữ được linh khí, ngồi thiền nửa ngày tán mất một nửa.",
    "sourceVectorText": "Linh -6",
    "sourceEffectsText": "qiRate: x0.5, def: +5",
    "tier": 1,
    "dimension": "root",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "active",
    "spawnWeight": 1,
    "traitCost": 3,
    "innateDelta": {
      "aptitude": -3
    },
    "learningAffinity": {},
    "modifiers": [
      {
        "key": "qiRateFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 0.5,
        "sourceKey": "qiRate"
      },
      {
        "key": "defenseFlat",
        "mode": "add",
        "unit": "flat",
        "value": 5,
        "sourceKey": "def"
      }
    ],
    "effects": [],
    "badge": "🌟",
    "color": "#94a3b8",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "qiAbsorptionMultiplier": 0.5,
      "defenseBonus": 5
    }
  },
  {
    "id": "hoa_khi_xung_tam",
    "name": "Hỏa Khí Xung Tâm",
    "description": "Hỏa độc tích tụ trong linh căn, tính tình nóng nảy dễ bị tẩu hỏa nhập ma.",
    "sourceDescription": "Hỏa độc tích tụ trong linh căn, tính tình nóng nảy dễ bị tẩu hỏa nhập ma.",
    "sourceVectorText": "Linh +6; Chiến +1; Đạo tâm -9",
    "sourceEffectsText": "atk: x1.15, breakthrough: -12%, heartDemonResistance: -15%",
    "tier": 1,
    "dimension": "root",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: heartDemonResistance",
    "unmappedEffectKeys": [
      "heartDemonResistance"
    ],
    "spawnWeight": 0,
    "traitCost": 3,
    "innateDelta": {
      "aptitude": 3
    },
    "learningAffinity": {
      "combat": 1
    },
    "modifiers": [
      {
        "key": "attackFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.15,
        "sourceKey": "atk"
      },
      {
        "key": "breakthroughChanceBonus",
        "mode": "add",
        "unit": "probability",
        "value": -0.12,
        "sourceKey": "breakthrough"
      },
      {
        "key": "mindTrainingBonus",
        "mode": "add",
        "unit": "probability",
        "value": -0.045,
        "sourceKey": "daoHeartVector"
      }
    ],
    "effects": [],
    "badge": "🌟",
    "color": "#94a3b8",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "combatPowerMultiplier": 1.15,
      "breakthroughChanceBonus": -0.12
    }
  },
  {
    "id": "tuyet_linh_chi_the",
    "name": "Tuyệt Linh Chi Thể",
    "description": "Không thể tu luyện linh khí như thường nhân, nhưng nhục thân cường hãn tuyệt luân.",
    "sourceDescription": "Không thể tu luyện linh khí như thường nhân, nhưng nhục thân cường hãn tuyệt luân.",
    "sourceVectorText": "Linh -28; Thể +30; Chiến +4",
    "sourceEffectsText": "qiRate: x0.15, hp: x1.90, atk: x1.55, armor: +22, bodyCultivationGain: +35%",
    "tier": 2,
    "dimension": "root",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [
      "thien_linh_can",
      "tien_thien_dao_the"
    ],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: bodyCultivationGain",
    "unmappedEffectKeys": [
      "bodyCultivationGain"
    ],
    "spawnWeight": 0,
    "traitCost": 8,
    "innateDelta": {
      "aptitude": -14,
      "physique": 15
    },
    "learningAffinity": {
      "combat": 4
    },
    "modifiers": [
      {
        "key": "qiRateFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 0.15,
        "sourceKey": "qiRate"
      },
      {
        "key": "healthFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.9,
        "sourceKey": "hp"
      },
      {
        "key": "attackFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.55,
        "sourceKey": "atk"
      },
      {
        "key": "armorFlat",
        "mode": "add",
        "unit": "flat",
        "value": 22,
        "sourceKey": "armor"
      }
    ],
    "effects": [],
    "badge": "🚫",
    "color": "#34d399",
    "category": "innate",
    "conflicts": [
      "thien_linh_can",
      "tien_thien_dao_the"
    ],
    "statModifiers": {
      "qiAbsorptionMultiplier": 0.15,
      "healthMultiplier": 1.9,
      "combatPowerMultiplier": 1.55,
      "armorBonus": 22
    }
  },
  {
    "id": "dia_mach_chi_tu",
    "name": "Địa Mạch Chi Tử",
    "description": "Thổ linh căn hậu trọng, đứng trên mặt đất phòng ngự tăng mạnh và hồi phục bền bỉ.",
    "sourceDescription": "Thổ linh căn hậu trọng, đứng trên mặt đất phòng ngự tăng mạnh và hồi phục bền bỉ.",
    "sourceVectorText": "Linh +12; Thể +2",
    "sourceEffectsText": "def: +12, armor: +15, hp: x1.3, moveSpeed: x0.9",
    "tier": 2,
    "dimension": "root",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "active",
    "spawnWeight": 1,
    "traitCost": 8,
    "innateDelta": {
      "aptitude": 6,
      "physique": 1
    },
    "learningAffinity": {},
    "modifiers": [
      {
        "key": "defenseFlat",
        "mode": "add",
        "unit": "flat",
        "value": 12,
        "sourceKey": "def"
      },
      {
        "key": "armorFlat",
        "mode": "add",
        "unit": "flat",
        "value": 15,
        "sourceKey": "armor"
      },
      {
        "key": "healthFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.3,
        "sourceKey": "hp"
      },
      {
        "key": "moveSpeedFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 0.9,
        "sourceKey": "moveSpeed"
      }
    ],
    "effects": [],
    "badge": "⛰️",
    "color": "#34d399",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "defenseBonus": 12,
      "armorBonus": 15,
      "healthMultiplier": 1.3,
      "moveSpeedMultiplier": 0.9
    }
  },
  {
    "id": "thuy_than_chuc_phuc",
    "name": "Thủy Thần Chúc Phúc",
    "description": "Thủy linh căn tinh thuần, tâm tĩnh như nước, ít khi cảm thấy khát.",
    "sourceDescription": "Thủy linh căn tinh thuần, tâm tĩnh như nước, ít khi cảm thấy khát.",
    "sourceVectorText": "Linh +14",
    "sourceEffectsText": "qiRate: x1.3, dodge: +10%, thirstRate: x0.55, mindStateBonus: +10",
    "tier": 2,
    "dimension": "root",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "active",
    "spawnWeight": 1,
    "traitCost": 8,
    "innateDelta": {
      "aptitude": 7
    },
    "learningAffinity": {},
    "modifiers": [
      {
        "key": "qiRateFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.3,
        "sourceKey": "qiRate"
      },
      {
        "key": "dodgeChanceBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.1,
        "sourceKey": "dodge"
      },
      {
        "key": "thirstRateFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 0.55,
        "sourceKey": "thirstRate"
      },
      {
        "key": "mentalEquilibriumBias",
        "mode": "add",
        "unit": "flat",
        "value": 10,
        "sourceKey": "mindStateBonus"
      }
    ],
    "effects": [],
    "badge": "🌊",
    "color": "#34d399",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "qiAbsorptionMultiplier": 1.3,
      "dodgeRateBonus": 0.1,
      "thirstRateMultiplier": 0.55
    }
  },
  {
    "id": "thao_moc_than_hoa",
    "name": "Thảo Mộc Thân Hòa",
    "description": "Hơi thở gần gũi với cỏ cây hoa lá, sinh cơ dồi dào và nhạy bén với linh dược.",
    "sourceDescription": "Hơi thở gần gũi với cỏ cây hoa lá, sinh cơ dồi dào và nhạy bén với linh dược.",
    "sourceVectorText": "Linh +14",
    "sourceEffectsText": "lifespan: +40, alchemy: +12%, qiRate: x1.2",
    "tier": 2,
    "dimension": "root",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: alchemy",
    "unmappedEffectKeys": [
      "alchemy"
    ],
    "spawnWeight": 0,
    "traitCost": 8,
    "innateDelta": {
      "aptitude": 7
    },
    "learningAffinity": {},
    "modifiers": [
      {
        "key": "lifespanYears",
        "mode": "add",
        "unit": "years",
        "value": 40,
        "sourceKey": "lifespan"
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
    "badge": "🌟",
    "color": "#34d399",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "lifespanBonus": 40,
      "qiAbsorptionMultiplier": 1.2
    }
  },
  {
    "id": "thien_loi_chi_tu",
    "name": "Thiên Lôi Chi Tử",
    "description": "Dị chủng Lôi linh căn, mỗi đòn đánh đều kèm theo tiếng sấm sét kinh hồn.",
    "sourceDescription": "Dị chủng Lôi linh căn, mỗi đòn đánh đều kèm theo tiếng sấm sét kinh hồn.",
    "sourceVectorText": "Linh +20; Chiến +4",
    "sourceEffectsText": "atk: x1.5, crit: +15%, moveSpeed: x1.2, breakthrough: +10%",
    "tier": 3,
    "dimension": "root",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "active",
    "spawnWeight": 1,
    "traitCost": 18,
    "innateDelta": {
      "aptitude": 10
    },
    "learningAffinity": {
      "combat": 4
    },
    "modifiers": [
      {
        "key": "attackFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.5,
        "sourceKey": "atk"
      },
      {
        "key": "critChanceBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.15,
        "sourceKey": "crit"
      },
      {
        "key": "moveSpeedFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.2,
        "sourceKey": "moveSpeed"
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
    "badge": "⚡",
    "color": "#a78bfa",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "combatPowerMultiplier": 1.5,
      "critRateBonus": 0.15,
      "moveSpeedMultiplier": 1.2,
      "breakthroughChanceBonus": 0.1
    }
  },
  {
    "id": "chan_hoa_chi_linh",
    "name": "Chân Hỏa Chi Linh",
    "description": "Hỏa linh căn cực phẩm, bẩm sinh khống chế chân hỏa, sát thương và luyện đan đều mạnh.",
    "sourceDescription": "Hỏa linh căn cực phẩm, bẩm sinh khống chế chân hỏa, sát thương và luyện đan đều mạnh.",
    "sourceVectorText": "Linh +22; Chiến +3",
    "sourceEffectsText": "atk: x1.35, alchemy: +30%, qiRate: x1.3",
    "tier": 3,
    "dimension": "root",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [
      "bang_phach_han_the"
    ],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: alchemy",
    "unmappedEffectKeys": [
      "alchemy"
    ],
    "spawnWeight": 0,
    "traitCost": 18,
    "innateDelta": {
      "aptitude": 11
    },
    "learningAffinity": {
      "combat": 3
    },
    "modifiers": [
      {
        "key": "attackFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.35,
        "sourceKey": "atk"
      },
      {
        "key": "qiRateFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.3,
        "sourceKey": "qiRate"
      }
    ],
    "effects": [],
    "badge": "🔥",
    "color": "#a78bfa",
    "category": "innate",
    "conflicts": [
      "bang_phach_han_the"
    ],
    "statModifiers": {
      "combatPowerMultiplier": 1.35,
      "qiAbsorptionMultiplier": 1.3
    }
  },
  {
    "id": "moc_linh_truong_sinh",
    "name": "Mộc Linh Trường Sinh",
    "description": "Mộc linh căn tràn đầy sinh cơ, tuổi thọ kéo dài và tự lành vết thương nhanh.",
    "sourceDescription": "Mộc linh căn tràn đầy sinh cơ, tuổi thọ kéo dài và tự lành vết thương nhanh.",
    "sourceVectorText": "Linh +22; Thể +3",
    "sourceEffectsText": "lifespan: +180, hp: x1.4, qiRate: x1.25",
    "tier": 3,
    "dimension": "root",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "active",
    "spawnWeight": 1,
    "traitCost": 18,
    "innateDelta": {
      "aptitude": 11,
      "physique": 1.5
    },
    "learningAffinity": {},
    "modifiers": [
      {
        "key": "lifespanYears",
        "mode": "add",
        "unit": "years",
        "value": 180,
        "sourceKey": "lifespan"
      },
      {
        "key": "healthFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.4,
        "sourceKey": "hp"
      },
      {
        "key": "qiRateFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.25,
        "sourceKey": "qiRate"
      }
    ],
    "effects": [],
    "badge": "🌿",
    "color": "#a78bfa",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "lifespanBonus": 180,
      "healthMultiplier": 1.4,
      "qiAbsorptionMultiplier": 1.25
    }
  },
  {
    "id": "bang_phach_han_the",
    "name": "Băng Phách Hàn Thể",
    "description": "Dị chủng Băng linh căn, tâm trí lạnh lùng tĩnh lặng, không bị tâm ma quấy nhiễu.",
    "sourceDescription": "Dị chủng Băng linh căn, tâm trí lạnh lùng tĩnh lặng, không bị tâm ma quấy nhiễu.",
    "sourceVectorText": "Linh +22",
    "sourceEffectsText": "def: +15, armor: +15, breakthrough: +15%, qiRate: x1.3, heartDemonResistance: +25%",
    "tier": 3,
    "dimension": "root",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [
      "chan_hoa_chi_linh",
      "thuan_duong_chi_the"
    ],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: heartDemonResistance",
    "unmappedEffectKeys": [
      "heartDemonResistance"
    ],
    "spawnWeight": 0,
    "traitCost": 18,
    "innateDelta": {
      "aptitude": 11
    },
    "learningAffinity": {},
    "modifiers": [
      {
        "key": "defenseFlat",
        "mode": "add",
        "unit": "flat",
        "value": 15,
        "sourceKey": "def"
      },
      {
        "key": "armorFlat",
        "mode": "add",
        "unit": "flat",
        "value": 15,
        "sourceKey": "armor"
      },
      {
        "key": "breakthroughChanceBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.15,
        "sourceKey": "breakthrough"
      },
      {
        "key": "qiRateFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.3,
        "sourceKey": "qiRate"
      }
    ],
    "effects": [],
    "badge": "🧊",
    "color": "#a78bfa",
    "category": "innate",
    "conflicts": [
      "chan_hoa_chi_linh",
      "thuan_duong_chi_the"
    ],
    "statModifiers": {
      "defenseBonus": 15,
      "armorBonus": 15,
      "breakthroughChanceBonus": 0.15,
      "qiAbsorptionMultiplier": 1.3
    }
  },
  {
    "id": "phong_than_ho_the",
    "name": "Phong Thần Hộ Thể",
    "description": "Dị chủng Phong linh căn, thân nhẹ như gió cuốn, tốc độ di chuyển và xuất chiêu cực nhanh.",
    "sourceDescription": "Dị chủng Phong linh căn, thân nhẹ như gió cuốn, tốc độ di chuyển và xuất chiêu cực nhanh.",
    "sourceVectorText": "Linh +20",
    "sourceEffectsText": "moveSpeed: x1.45, dodge: +20%, atkSpeed: x1.25",
    "tier": 3,
    "dimension": "root",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "active",
    "spawnWeight": 1,
    "traitCost": 18,
    "innateDelta": {
      "aptitude": 10
    },
    "learningAffinity": {},
    "modifiers": [
      {
        "key": "moveSpeedFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.45,
        "sourceKey": "moveSpeed"
      },
      {
        "key": "dodgeChanceBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.2,
        "sourceKey": "dodge"
      },
      {
        "key": "attackSpeedFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.25,
        "sourceKey": "atkSpeed"
      }
    ],
    "effects": [],
    "badge": "🌪️",
    "color": "#a78bfa",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "moveSpeedMultiplier": 1.45,
      "dodgeRateBonus": 0.2,
      "attackSpeedMultiplier": 1.25
    }
  },
  {
    "id": "bien_di_am_linh_can",
    "name": "Biến Dị Ám Linh Căn",
    "description": "Linh căn thuộc tính bóng tối hiếm gặp, giỏi ẩn nấp và tung đòn chí mạng.",
    "sourceDescription": "Linh căn thuộc tính bóng tối hiếm gặp, giỏi ẩn nấp và tung đòn chí mạng.",
    "sourceVectorText": "Linh +20; Chiến +3",
    "sourceEffectsText": "crit: +20%, atk: x1.4, dodge: +15%",
    "tier": 3,
    "dimension": "root",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [
      "primary_root"
    ],
    "conflictsWith": [],
    "implementation": "active",
    "spawnWeight": 1,
    "traitCost": 18,
    "innateDelta": {},
    "primaryRootOverride": {
      "rootType": "earth",
      "purity": 85,
      "elements": [
        "am"
      ],
      "qiRateFactor": 1.8
    },
    "learningAffinity": {
      "combat": 3
    },
    "modifiers": [
      {
        "key": "critChanceBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.2,
        "sourceKey": "crit"
      },
      {
        "key": "attackFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.4,
        "sourceKey": "atk"
      },
      {
        "key": "dodgeChanceBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.15,
        "sourceKey": "dodge"
      }
    ],
    "effects": [],
    "badge": "🌟",
    "color": "#a78bfa",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "critRateBonus": 0.2,
      "combatPowerMultiplier": 1.4,
      "dodgeRateBonus": 0.15
    }
  },
  {
    "id": "am_duong_song_tu",
    "name": "Âm Dương Song Linh Căn",
    "description": "Trong người tồn tại cả Âm lẫn Dương hài hòa, linh lực sinh sôi không ngừng.",
    "sourceDescription": "Trong người tồn tại cả Âm lẫn Dương hài hòa, linh lực sinh sôi không ngừng.",
    "sourceVectorText": "Linh +24; Ngộ +3",
    "sourceEffectsText": "qiRate: x1.55, comprehension: x1.4, breakthrough: +10%",
    "tier": 3,
    "dimension": "root",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [
      "primary_root"
    ],
    "conflictsWith": [],
    "implementation": "active",
    "spawnWeight": 1,
    "traitCost": 18,
    "innateDelta": {
      "comprehension": 1.5
    },
    "primaryRootOverride": {
      "rootType": "earth",
      "purity": 85,
      "elements": [
        "am",
        "duong"
      ],
      "qiRateFactor": 1.55
    },
    "learningAffinity": {},
    "modifiers": [
      {
        "key": "qiRateFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.55,
        "sourceKey": "qiRate"
      },
      {
        "key": "techniqueLearningFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.4,
        "sourceKey": "comprehension"
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
    "badge": "☯️",
    "color": "#a78bfa",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "qiAbsorptionMultiplier": 1.55,
      "comprehensionMultiplier": 1.4,
      "breakthroughChanceBonus": 0.1
    }
  },
  {
    "id": "ngu_hanh_cau_toan",
    "name": "Ngũ Hành Cân Bằng",
    "description": "Kim Mộc Thủy Hỏa Thổ ngũ hành tương sinh hoàn hảo, căn cơ vững chắc không tỳ vết.",
    "sourceDescription": "Kim Mộc Thủy Hỏa Thổ ngũ hành tương sinh hoàn hảo, căn cơ vững chắc không tỳ vết.",
    "sourceVectorText": "Linh +24",
    "sourceEffectsText": "qiRate: x1.5, def: +10, breakthrough: +15%, lifespan: +60",
    "tier": 3,
    "dimension": "root",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [
      "primary_root"
    ],
    "conflictsWith": [
      "phe_linh_can"
    ],
    "implementation": "active",
    "spawnWeight": 1,
    "traitCost": 18,
    "innateDelta": {},
    "primaryRootOverride": {
      "rootType": "earth",
      "purity": 85,
      "elements": [
        "kim",
        "moc",
        "thuy",
        "hoa",
        "tho"
      ],
      "qiRateFactor": 1.5
    },
    "learningAffinity": {},
    "modifiers": [
      {
        "key": "qiRateFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.5,
        "sourceKey": "qiRate"
      },
      {
        "key": "defenseFlat",
        "mode": "add",
        "unit": "flat",
        "value": 10,
        "sourceKey": "def"
      },
      {
        "key": "breakthroughChanceBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.15,
        "sourceKey": "breakthrough"
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
    "badge": "🌈",
    "color": "#a78bfa",
    "category": "innate",
    "conflicts": [
      "phe_linh_can"
    ],
    "statModifiers": {
      "qiAbsorptionMultiplier": 1.5,
      "defenseBonus": 10,
      "breakthroughChanceBonus": 0.15,
      "lifespanBonus": 60
    }
  },
  {
    "id": "thien_linh_can",
    "name": "Thiên Linh Căn",
    "description": "Độc nhất một hệ linh căn đạt độ thuần khiết tuyệt đối, được thiên địa linh khí sủng ái.",
    "sourceDescription": "Độc nhất một hệ linh căn đạt độ thuần khiết tuyệt đối, được thiên địa linh khí sủng ái.",
    "sourceVectorText": "Linh +37",
    "sourceEffectsText": "qiRate: x1.90, breakthrough: +22%, elementPurity: +45%",
    "tier": 4,
    "dimension": "root",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [
      "primary_root"
    ],
    "conflictsWith": [
      "phe_linh_can",
      "tuyet_linh_chi_the"
    ],
    "implementation": "active",
    "spawnWeight": 1,
    "traitCost": 35,
    "innateDelta": {},
    "primaryRootOverride": {
      "rootType": "heaven",
      "purity": 100,
      "elements": [
        "hoa"
      ],
      "qiRateFactor": 1.9
    },
    "learningAffinity": {},
    "modifiers": [
      {
        "key": "qiRateFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.9,
        "sourceKey": "qiRate"
      },
      {
        "key": "breakthroughChanceBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.22,
        "sourceKey": "breakthrough"
      }
    ],
    "effects": [],
    "badge": "🌟",
    "color": "#fbbf24",
    "category": "innate",
    "conflicts": [
      "phe_linh_can",
      "tuyet_linh_chi_the"
    ],
    "statModifiers": {
      "qiAbsorptionMultiplier": 1.9,
      "breakthroughChanceBonus": 0.22
    }
  },
  {
    "id": "cuu_tieu_than_loi_can",
    "name": "Cửu Tiêu Thần Lôi Căn",
    "description": "Linh căn biến dị tối thượng hệ Lôi, đại diện cho Thiên Phạt, khắc chế mọi tà ma.",
    "sourceDescription": "Linh căn biến dị tối thượng hệ Lôi, đại diện cho Thiên Phạt, khắc chế mọi tà ma.",
    "sourceVectorText": "Linh +36; Chiến +7",
    "sourceEffectsText": "atk: x1.9, crit: +25%, qiRate: x1.8, heartDemonResistance: +35%",
    "tier": 4,
    "dimension": "root",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [
      "primary_root"
    ],
    "conflictsWith": [],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: heartDemonResistance",
    "unmappedEffectKeys": [
      "heartDemonResistance"
    ],
    "spawnWeight": 0,
    "traitCost": 35,
    "innateDelta": {},
    "primaryRootOverride": {
      "rootType": "heaven",
      "purity": 100,
      "elements": [
        "loi"
      ],
      "qiRateFactor": 1.8
    },
    "learningAffinity": {
      "combat": 7
    },
    "modifiers": [
      {
        "key": "attackFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.9,
        "sourceKey": "atk"
      },
      {
        "key": "critChanceBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.25,
        "sourceKey": "crit"
      },
      {
        "key": "qiRateFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.8,
        "sourceKey": "qiRate"
      }
    ],
    "effects": [],
    "badge": "🌟",
    "color": "#fbbf24",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "combatPowerMultiplier": 1.9,
      "critRateBonus": 0.25,
      "qiAbsorptionMultiplier": 1.8
    }
  },
  {
    "id": "thai_duong_chan_hoa_can",
    "name": "Thái Dương Chân Hỏa Căn",
    "description": "Mang theo hỏa chủng của Đại Nhật Kim Ô, thiêu rụi vạn vật, luyện đan tuyệt đỉnh.",
    "sourceDescription": "Mang theo hỏa chủng của Đại Nhật Kim Ô, thiêu rụi vạn vật, luyện đan tuyệt đỉnh.",
    "sourceVectorText": "Linh +38; Thể +3; Chiến +7",
    "sourceEffectsText": "atk: x1.85, qiRate: x2, alchemy: +40%, hp: x1.4",
    "tier": 4,
    "dimension": "root",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [
      "primary_root"
    ],
    "conflictsWith": [],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: alchemy",
    "unmappedEffectKeys": [
      "alchemy"
    ],
    "spawnWeight": 0,
    "traitCost": 35,
    "innateDelta": {
      "physique": 1.5
    },
    "primaryRootOverride": {
      "rootType": "heaven",
      "purity": 100,
      "elements": [
        "hoa"
      ],
      "qiRateFactor": 2
    },
    "learningAffinity": {
      "combat": 7
    },
    "modifiers": [
      {
        "key": "attackFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.85,
        "sourceKey": "atk"
      },
      {
        "key": "qiRateFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 2,
        "sourceKey": "qiRate"
      },
      {
        "key": "healthFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.4,
        "sourceKey": "hp"
      }
    ],
    "effects": [],
    "badge": "🌟",
    "color": "#fbbf24",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "combatPowerMultiplier": 1.85,
      "qiAbsorptionMultiplier": 2,
      "healthMultiplier": 1.4
    }
  },
  {
    "id": "hon_don_dao_can",
    "name": "Hỗn Độn Đạo Căn",
    "description": "Linh căn khởi nguyên của vũ trụ, dung hợp mọi nguyên tố, tốc độ tu luyện kinh thế hãi tục.",
    "sourceDescription": "Linh căn khởi nguyên của vũ trụ, dung hợp mọi nguyên tố, tốc độ tu luyện kinh thế hãi tục.",
    "sourceVectorText": "Linh +53; Thể +4; Chiến +5",
    "sourceEffectsText": "qiRate: x2.35, atk: x1.65, hp: x1.50, breakthrough: +28%, allElementCompatibility: +60%",
    "tier": 5,
    "dimension": "root",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [
      "primary_root"
    ],
    "conflictsWith": [
      "phe_linh_can"
    ],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: allElementCompatibility",
    "unmappedEffectKeys": [
      "allElementCompatibility"
    ],
    "spawnWeight": 0,
    "traitCost": 60,
    "innateDelta": {
      "physique": 2
    },
    "primaryRootOverride": {
      "rootType": "heaven",
      "purity": 100,
      "elements": [
        "kim",
        "moc",
        "thuy",
        "hoa",
        "tho"
      ],
      "qiRateFactor": 2.35
    },
    "learningAffinity": {
      "combat": 5
    },
    "modifiers": [
      {
        "key": "qiRateFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 2.35,
        "sourceKey": "qiRate"
      },
      {
        "key": "attackFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.65,
        "sourceKey": "atk"
      },
      {
        "key": "healthFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.5,
        "sourceKey": "hp"
      },
      {
        "key": "breakthroughChanceBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.28,
        "sourceKey": "breakthrough"
      }
    ],
    "effects": [],
    "badge": "☯️",
    "color": "#fb7185",
    "category": "innate",
    "conflicts": [
      "phe_linh_can"
    ],
    "statModifiers": {
      "qiAbsorptionMultiplier": 2.35,
      "combatPowerMultiplier": 1.65,
      "healthMultiplier": 1.5,
      "breakthroughChanceBonus": 0.28
    }
  },
  {
    "id": "dan_don_ngu_ngo",
    "name": "Đần Độn Ngốc Nghếch",
    "description": "Đầu óc chậm hiểu, đọc bí tịch như vịt nghe sấm, nhưng tâm tư đơn giản ít tạp niệm.",
    "sourceDescription": "Đầu óc chậm hiểu, đọc bí tịch như vịt nghe sấm, nhưng tâm tư đơn giản ít tạp niệm.",
    "sourceVectorText": "Ngộ -8; Thể +1",
    "sourceEffectsText": "comprehension: x0.55, breakthrough: -10%, hp: x1.15, heartDemonResistance: +10%",
    "tier": 1,
    "dimension": "mindset",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [
      "don_ngo_ky_tai",
      "ngo_tinh_sieu_pham"
    ],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: heartDemonResistance",
    "unmappedEffectKeys": [
      "heartDemonResistance"
    ],
    "spawnWeight": 0,
    "traitCost": 3,
    "innateDelta": {
      "comprehension": -4,
      "physique": 0.5
    },
    "learningAffinity": {},
    "modifiers": [
      {
        "key": "techniqueLearningFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 0.55,
        "sourceKey": "comprehension"
      },
      {
        "key": "breakthroughChanceBonus",
        "mode": "add",
        "unit": "probability",
        "value": -0.1,
        "sourceKey": "breakthrough"
      },
      {
        "key": "healthFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.15,
        "sourceKey": "hp"
      }
    ],
    "effects": [],
    "badge": "🥴",
    "color": "#94a3b8",
    "category": "innate",
    "conflicts": [
      "don_ngo_ky_tai",
      "ngo_tinh_sieu_pham"
    ],
    "statModifiers": {
      "comprehensionMultiplier": 0.55,
      "breakthroughChanceBonus": -0.1,
      "healthMultiplier": 1.15
    }
  },
  {
    "id": "da_nghi_tram_trong",
    "name": "Đa Nghi Thận Trọng",
    "description": "Làm việc gì cũng suy tính quá nhiều, giỏi phòng bị nhưng thiếu quyết đoán khi đột phá.",
    "sourceDescription": "Làm việc gì cũng suy tính quá nhiều, giỏi phòng bị nhưng thiếu quyết đoán khi đột phá.",
    "sourceVectorText": "Ngộ +3",
    "sourceEffectsText": "dodge: +10%, def: +5, breakthrough: -5%, mindStateBonus: -5",
    "tier": 1,
    "dimension": "mindset",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "active",
    "spawnWeight": 1,
    "traitCost": 3,
    "innateDelta": {
      "comprehension": 1.5
    },
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
        "key": "defenseFlat",
        "mode": "add",
        "unit": "flat",
        "value": 5,
        "sourceKey": "def"
      },
      {
        "key": "breakthroughChanceBonus",
        "mode": "add",
        "unit": "probability",
        "value": -0.05,
        "sourceKey": "breakthrough"
      },
      {
        "key": "mentalEquilibriumBias",
        "mode": "add",
        "unit": "flat",
        "value": -5,
        "sourceKey": "mindStateBonus"
      }
    ],
    "effects": [],
    "badge": "🧐",
    "color": "#94a3b8",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "dodgeRateBonus": 0.1,
      "defenseBonus": 5,
      "breakthroughChanceBonus": -0.05
    }
  },
  {
    "id": "tram_mac_it_loi",
    "name": "Trầm Mặc Ít Lời",
    "description": "Không thích giao du ồn ào, chỉ lặng lẽ ngồi một góc chuyên tâm tu luyện.",
    "sourceDescription": "Không thích giao du ồn ào, chỉ lặng lẽ ngồi một góc chuyên tâm tu luyện.",
    "sourceVectorText": "Linh +1; Ngộ +4; Đạo tâm +4",
    "sourceEffectsText": "qiRate: x1.15, comprehension: x1.15, mindStateBonus: +8",
    "tier": 1,
    "dimension": "mindset",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [
      "tam_tinh_thao_dong"
    ],
    "implementation": "active",
    "spawnWeight": 1,
    "traitCost": 3,
    "innateDelta": {
      "comprehension": 2,
      "aptitude": 0.5
    },
    "learningAffinity": {},
    "modifiers": [
      {
        "key": "qiRateFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.15,
        "sourceKey": "qiRate"
      },
      {
        "key": "techniqueLearningFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.15,
        "sourceKey": "comprehension"
      },
      {
        "key": "mentalEquilibriumBias",
        "mode": "add",
        "unit": "flat",
        "value": 8,
        "sourceKey": "mindStateBonus"
      },
      {
        "key": "mindTrainingBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.02,
        "sourceKey": "daoHeartVector"
      }
    ],
    "effects": [],
    "badge": "🤐",
    "color": "#94a3b8",
    "category": "innate",
    "conflicts": [
      "tam_tinh_thao_dong"
    ],
    "statModifiers": {
      "qiAbsorptionMultiplier": 1.15,
      "comprehensionMultiplier": 1.15
    }
  },
  {
    "id": "tam_tinh_thao_dong",
    "name": "Tâm Tính Xao Động",
    "description": "Tâm tư bất định, ngồi thiền hay nghĩ ngợi lung tung, dễ bị ngoại cảnh thu hút.",
    "sourceDescription": "Tâm tư bất định, ngồi thiền hay nghĩ ngợi lung tung, dễ bị ngoại cảnh thu hút.",
    "sourceVectorText": "Linh -6; Ngộ +3",
    "sourceEffectsText": "qiRate: x0.75, breakthrough: -10%, moveSpeed: x1.1, mindStateBonus: -15",
    "tier": 1,
    "dimension": "mindset",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [
      "kien_dinh_nhu_thiet",
      "tram_mac_it_loi"
    ],
    "implementation": "active",
    "spawnWeight": 1,
    "traitCost": 3,
    "innateDelta": {
      "comprehension": 1.5,
      "aptitude": -3
    },
    "learningAffinity": {},
    "modifiers": [
      {
        "key": "qiRateFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 0.75,
        "sourceKey": "qiRate"
      },
      {
        "key": "breakthroughChanceBonus",
        "mode": "add",
        "unit": "probability",
        "value": -0.1,
        "sourceKey": "breakthrough"
      },
      {
        "key": "moveSpeedFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.1,
        "sourceKey": "moveSpeed"
      },
      {
        "key": "mentalEquilibriumBias",
        "mode": "add",
        "unit": "flat",
        "value": -15,
        "sourceKey": "mindStateBonus"
      }
    ],
    "effects": [],
    "badge": "🌪️",
    "color": "#94a3b8",
    "category": "innate",
    "conflicts": [
      "kien_dinh_nhu_thiet",
      "tram_mac_it_loi"
    ],
    "statModifiers": {
      "qiAbsorptionMultiplier": 0.75,
      "breakthroughChanceBonus": -0.1,
      "moveSpeedMultiplier": 1.1
    }
  },
  {
    "id": "y_chi_bac_nhuoc",
    "name": "Ý Chí Bạc Nhược",
    "description": "Gặp khó khăn hay đau đớn là muốn bỏ cuộc, rất sợ lôi kiếp và nghịch cảnh.",
    "sourceDescription": "Gặp khó khăn hay đau đớn là muốn bỏ cuộc, rất sợ lôi kiếp và nghịch cảnh.",
    "sourceVectorText": "Ngộ +3; Đạo tâm -4",
    "sourceEffectsText": "willpowerBonus: -25, breakthrough: -12%, moveSpeed: x1.05",
    "tier": 1,
    "dimension": "mindset",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "active",
    "spawnWeight": 1,
    "traitCost": 3,
    "innateDelta": {},
    "learningAffinity": {},
    "modifiers": [
      {
        "key": "willTrainingBonus",
        "mode": "add",
        "unit": "probability",
        "value": -0.125,
        "sourceKey": "willpowerBonus"
      },
      {
        "key": "breakthroughChanceBonus",
        "mode": "add",
        "unit": "probability",
        "value": -0.12,
        "sourceKey": "breakthrough"
      },
      {
        "key": "moveSpeedFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.05,
        "sourceKey": "moveSpeed"
      },
      {
        "key": "mindTrainingBonus",
        "mode": "add",
        "unit": "probability",
        "value": -0.02,
        "sourceKey": "daoHeartVector"
      }
    ],
    "effects": [],
    "badge": "🧠",
    "color": "#94a3b8",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "breakthroughChanceBonus": -0.12,
      "moveSpeedMultiplier": 1.05
    }
  },
  {
    "id": "tam_ma_quan_than",
    "name": "Tâm Ma Quấn Thân",
    "description": "Chấp niệm sâu nặng hóa thành tâm ma, lực chiến tăng vọt nhưng đột phá cực kỳ nguy hiểm.",
    "sourceDescription": "Chấp niệm sâu nặng hóa thành tâm ma, lực chiến tăng vọt nhưng đột phá cực kỳ nguy hiểm.",
    "sourceVectorText": "Linh +2; Ngộ +7; Chiến +2; Đạo tâm -1",
    "sourceEffectsText": "atk: x1.3, qiRate: x1.3, breakthrough: -25%, heartDemonResistance: -30%",
    "tier": 2,
    "dimension": "mindset",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [
      "kien_dinh_nhu_thiet",
      "tru_ma_tien_si",
      "xich_tu_chi_tam"
    ],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: heartDemonResistance",
    "unmappedEffectKeys": [
      "heartDemonResistance"
    ],
    "spawnWeight": 0,
    "traitCost": 8,
    "innateDelta": {
      "comprehension": 3.5,
      "aptitude": 1
    },
    "learningAffinity": {
      "combat": 2
    },
    "modifiers": [
      {
        "key": "attackFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.3,
        "sourceKey": "atk"
      },
      {
        "key": "qiRateFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.3,
        "sourceKey": "qiRate"
      },
      {
        "key": "breakthroughChanceBonus",
        "mode": "add",
        "unit": "probability",
        "value": -0.25,
        "sourceKey": "breakthrough"
      },
      {
        "key": "mindTrainingBonus",
        "mode": "add",
        "unit": "probability",
        "value": -0.005,
        "sourceKey": "daoHeartVector"
      }
    ],
    "effects": [],
    "badge": "😈",
    "color": "#34d399",
    "category": "innate",
    "conflicts": [
      "kien_dinh_nhu_thiet",
      "tru_ma_tien_si",
      "xich_tu_chi_tam"
    ],
    "statModifiers": {
      "combatPowerMultiplier": 1.3,
      "qiAbsorptionMultiplier": 1.3,
      "breakthroughChanceBonus": -0.25
    }
  },
  {
    "id": "truc_giac_nhay_ben",
    "name": "Trực Giác Nhạy Bén",
    "description": "Giác quan thứ sáu cực nhạy trước sát khí, thường né được đòn hiểm trong gang tấc.",
    "sourceDescription": "Giác quan thứ sáu cực nhạy trước sát khí, thường né được đòn hiểm trong gang tấc.",
    "sourceVectorText": "Ngộ +7; Đạo tâm +8",
    "sourceEffectsText": "dodge: +15%, crit: +8%, mindStateBonus: +10",
    "tier": 2,
    "dimension": "mindset",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "active",
    "spawnWeight": 1,
    "traitCost": 8,
    "innateDelta": {
      "comprehension": 3.5
    },
    "learningAffinity": {},
    "modifiers": [
      {
        "key": "dodgeChanceBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.15,
        "sourceKey": "dodge"
      },
      {
        "key": "critChanceBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.08,
        "sourceKey": "crit"
      },
      {
        "key": "mentalEquilibriumBias",
        "mode": "add",
        "unit": "flat",
        "value": 10,
        "sourceKey": "mindStateBonus"
      },
      {
        "key": "mindTrainingBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.04,
        "sourceKey": "daoHeartVector"
      }
    ],
    "effects": [],
    "badge": "🔮",
    "color": "#34d399",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "dodgeRateBonus": 0.15,
      "critRateBonus": 0.08
    }
  },
  {
    "id": "can_cu_bu_thong_minh",
    "name": "Cần Cù Bù Thông Minh",
    "description": "Tuy tư chất bình thường nhưng chịu thương chịu khó gấp bội người khác.",
    "sourceDescription": "Tuy tư chất bình thường nhưng chịu thương chịu khó gấp bội người khác.",
    "sourceVectorText": "Linh +2; Ngộ +5; Nghệ +2; Đạo tâm +8",
    "sourceEffectsText": "qiRate: x1.25, craftingSpeed: x1.25, comprehension: x0.9, willpowerBonus: +15",
    "tier": 2,
    "dimension": "mindset",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "active",
    "spawnWeight": 1,
    "traitCost": 8,
    "innateDelta": {
      "aptitude": 1
    },
    "learningAffinity": {
      "profession": 2
    },
    "modifiers": [
      {
        "key": "qiRateFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.25,
        "sourceKey": "qiRate"
      },
      {
        "key": "workSpeedFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.25,
        "sourceKey": "craftingSpeed"
      },
      {
        "key": "techniqueLearningFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 0.9,
        "sourceKey": "comprehension"
      },
      {
        "key": "willTrainingBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.075,
        "sourceKey": "willpowerBonus"
      },
      {
        "key": "mindTrainingBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.04,
        "sourceKey": "daoHeartVector"
      }
    ],
    "effects": [],
    "badge": "📚",
    "color": "#34d399",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "qiAbsorptionMultiplier": 1.25,
      "craftingSpeedMultiplier": 1.25,
      "comprehensionMultiplier": 0.9
    }
  },
  {
    "id": "kien_nhan_ben_bi",
    "name": "Kiên Nhẫn Bền Bỉ",
    "description": "Chịu được cô độc và gian khổ hàng chục năm không một lời than vãn.",
    "sourceDescription": "Chịu được cô độc và gian khổ hàng chục năm không một lời than vãn.",
    "sourceVectorText": "Ngộ +7; Đạo tâm +8",
    "sourceEffectsText": "willpowerBonus: +22, mindStateBonus: +12, breakthrough: +8%",
    "tier": 2,
    "dimension": "mindset",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "active",
    "spawnWeight": 1,
    "traitCost": 8,
    "innateDelta": {
      "comprehension": 3.5
    },
    "learningAffinity": {},
    "modifiers": [
      {
        "key": "willTrainingBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.11,
        "sourceKey": "willpowerBonus"
      },
      {
        "key": "mentalEquilibriumBias",
        "mode": "add",
        "unit": "flat",
        "value": 12,
        "sourceKey": "mindStateBonus"
      },
      {
        "key": "breakthroughChanceBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.08,
        "sourceKey": "breakthrough"
      },
      {
        "key": "mindTrainingBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.04,
        "sourceKey": "daoHeartVector"
      }
    ],
    "effects": [],
    "badge": "🧠",
    "color": "#34d399",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "breakthroughChanceBonus": 0.08
    }
  },
  {
    "id": "khong_so_cai_chet",
    "name": "Không Sợ Cái Chết",
    "description": "Coi cái chết nhẹ tựa lông hồng, càng vào chỗ chết ý chí càng bùng nổ.",
    "sourceDescription": "Coi cái chết nhẹ tựa lông hồng, càng vào chỗ chết ý chí càng bùng nổ.",
    "sourceVectorText": "Ngộ +7; Chiến +2; Đạo tâm +8",
    "sourceEffectsText": "willpowerBonus: +22, atk: x1.25, def: -5",
    "tier": 2,
    "dimension": "mindset",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "active",
    "spawnWeight": 1,
    "traitCost": 8,
    "innateDelta": {
      "comprehension": 3.5
    },
    "learningAffinity": {
      "combat": 2
    },
    "modifiers": [
      {
        "key": "willTrainingBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.11,
        "sourceKey": "willpowerBonus"
      },
      {
        "key": "attackFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.25,
        "sourceKey": "atk"
      },
      {
        "key": "defenseFlat",
        "mode": "add",
        "unit": "flat",
        "value": -5,
        "sourceKey": "def"
      },
      {
        "key": "mindTrainingBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.04,
        "sourceKey": "daoHeartVector"
      }
    ],
    "effects": [],
    "badge": "🧠",
    "color": "#34d399",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "combatPowerMultiplier": 1.25,
      "defenseBonus": -5
    }
  },
  {
    "id": "don_ngo_ky_tai",
    "name": "Đốn Ngộ Kỳ Tài",
    "description": "Thường xuyên rơi vào trạng thái đốn ngộ huyền diệu khi ngắm nhìn thiên nhiên.",
    "sourceDescription": "Thường xuyên rơi vào trạng thái đốn ngộ huyền diệu khi ngắm nhìn thiên nhiên.",
    "sourceVectorText": "Ngộ +17; Đạo tâm +13",
    "sourceEffectsText": "comprehension: x1.75, breakthrough: +12%, mindStateBonus: +18, insightEventChance: +20%",
    "tier": 3,
    "dimension": "mindset",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [
      "dan_don_ngu_ngo"
    ],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: insightEventChance",
    "unmappedEffectKeys": [
      "insightEventChance"
    ],
    "spawnWeight": 0,
    "traitCost": 18,
    "innateDelta": {
      "comprehension": 8.5
    },
    "learningAffinity": {},
    "modifiers": [
      {
        "key": "techniqueLearningFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.75,
        "sourceKey": "comprehension"
      },
      {
        "key": "breakthroughChanceBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.12,
        "sourceKey": "breakthrough"
      },
      {
        "key": "mentalEquilibriumBias",
        "mode": "add",
        "unit": "flat",
        "value": 18,
        "sourceKey": "mindStateBonus"
      },
      {
        "key": "mindTrainingBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.065,
        "sourceKey": "daoHeartVector"
      }
    ],
    "effects": [],
    "badge": "💡",
    "color": "#a78bfa",
    "category": "innate",
    "conflicts": [
      "dan_don_ngu_ngo"
    ],
    "statModifiers": {
      "comprehensionMultiplier": 1.75,
      "breakthroughChanceBonus": 0.12
    }
  },
  {
    "id": "xich_tu_chi_tam",
    "name": "Xích Tử Chi Tâm",
    "description": "Tâm hồn trong sáng thuần khiết như trẻ thơ, không vướng bụi trần, tâm ma bất xâm.",
    "sourceDescription": "Tâm hồn trong sáng thuần khiết như trẻ thơ, không vướng bụi trần, tâm ma bất xâm.",
    "sourceVectorText": "Linh +3; Ngộ +13; Đạo tâm +13",
    "sourceEffectsText": "breakthrough: +18%, qiRate: x1.35, comprehension: x1.3, heartDemonResistance: +30%",
    "tier": 3,
    "dimension": "mindset",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [
      "am_hiem_doc_ac",
      "tam_ma_quan_than",
      "thien_ma_huyet_the"
    ],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: heartDemonResistance",
    "unmappedEffectKeys": [
      "heartDemonResistance"
    ],
    "spawnWeight": 0,
    "traitCost": 18,
    "innateDelta": {
      "comprehension": 6.5,
      "aptitude": 1.5
    },
    "learningAffinity": {},
    "modifiers": [
      {
        "key": "breakthroughChanceBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.18,
        "sourceKey": "breakthrough"
      },
      {
        "key": "qiRateFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.35,
        "sourceKey": "qiRate"
      },
      {
        "key": "techniqueLearningFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.3,
        "sourceKey": "comprehension"
      },
      {
        "key": "mindTrainingBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.065,
        "sourceKey": "daoHeartVector"
      }
    ],
    "effects": [],
    "badge": "🤍",
    "color": "#a78bfa",
    "category": "innate",
    "conflicts": [
      "am_hiem_doc_ac",
      "tam_ma_quan_than",
      "thien_ma_huyet_the"
    ],
    "statModifiers": {
      "breakthroughChanceBonus": 0.18,
      "qiAbsorptionMultiplier": 1.35,
      "comprehensionMultiplier": 1.3
    }
  },
  {
    "id": "kien_dinh_nhu_thiet",
    "name": "Đạo Tâm Như Thiết",
    "description": "Ý chí kiên cường không gì lay chuyển, kháng mọi ảo ảnh và hiệu ứng hoảng loạn.",
    "sourceDescription": "Ý chí kiên cường không gì lay chuyển, kháng mọi ảo ảnh và hiệu ứng hoảng loạn.",
    "sourceVectorText": "Ngộ +11; Thể +1; Đạo tâm +13",
    "sourceEffectsText": "breakthrough: +18%, def: +10, hp: x1.15, willpowerBonus: +35, heartDemonResistance: +30%",
    "tier": 3,
    "dimension": "mindset",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [
      "nhat_gan_so_chet",
      "phan_cot_nghich_tu",
      "tam_ma_quan_than",
      "tam_tinh_thao_dong"
    ],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: heartDemonResistance",
    "unmappedEffectKeys": [
      "heartDemonResistance"
    ],
    "spawnWeight": 0,
    "traitCost": 18,
    "innateDelta": {
      "comprehension": 5.5,
      "physique": 0.5
    },
    "learningAffinity": {},
    "modifiers": [
      {
        "key": "breakthroughChanceBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.18,
        "sourceKey": "breakthrough"
      },
      {
        "key": "defenseFlat",
        "mode": "add",
        "unit": "flat",
        "value": 10,
        "sourceKey": "def"
      },
      {
        "key": "healthFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.15,
        "sourceKey": "hp"
      },
      {
        "key": "willTrainingBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.175,
        "sourceKey": "willpowerBonus"
      },
      {
        "key": "mindTrainingBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.065,
        "sourceKey": "daoHeartVector"
      }
    ],
    "effects": [],
    "badge": "🗿",
    "color": "#a78bfa",
    "category": "innate",
    "conflicts": [
      "nhat_gan_so_chet",
      "phan_cot_nghich_tu",
      "tam_ma_quan_than",
      "tam_tinh_thao_dong"
    ],
    "statModifiers": {
      "breakthroughChanceBonus": 0.18,
      "defenseBonus": 10,
      "healthMultiplier": 1.15
    }
  },
  {
    "id": "nhat_tam_nhi_dung",
    "name": "Nhất Tâm Nhị Dụng",
    "description": "Tinh thần lực phân làm hai luồng độc lập, vừa chiến đấu vừa bấm quyết hoặc chế tác.",
    "sourceDescription": "Tinh thần lực phân làm hai luồng độc lập, vừa chiến đấu vừa bấm quyết hoặc chế tác.",
    "sourceVectorText": "Ngộ +16; Nghệ +3; Đạo tâm +13",
    "sourceEffectsText": "comprehension: x1.6, atkSpeed: x1.25, craftingSpeed: x1.4",
    "tier": 3,
    "dimension": "mindset",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "active",
    "spawnWeight": 1,
    "traitCost": 18,
    "innateDelta": {
      "comprehension": 8
    },
    "learningAffinity": {
      "profession": 3
    },
    "modifiers": [
      {
        "key": "techniqueLearningFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.6,
        "sourceKey": "comprehension"
      },
      {
        "key": "attackSpeedFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.25,
        "sourceKey": "atkSpeed"
      },
      {
        "key": "workSpeedFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.4,
        "sourceKey": "craftingSpeed"
      },
      {
        "key": "mindTrainingBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.065,
        "sourceKey": "daoHeartVector"
      }
    ],
    "effects": [],
    "badge": "🔀",
    "color": "#a78bfa",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "comprehensionMultiplier": 1.6,
      "attackSpeedMultiplier": 1.25,
      "craftingSpeedMultiplier": 1.4
    }
  },
  {
    "id": "bang_thanh_ngoc_khiet",
    "name": "Băng Thanh Ngọc Khiết",
    "description": "Tâm cảnh trong trẻo như băng ngọc, mọi cám dỗ hồng trần đều không thể làm gợn sóng.",
    "sourceDescription": "Tâm cảnh trong trẻo như băng ngọc, mọi cám dỗ hồng trần đều không thể làm gợn sóng.",
    "sourceVectorText": "Linh +2; Ngộ +11; Đạo tâm +13",
    "sourceEffectsText": "mindStateBonus: +30, heartDemonResistance: +30%, qiRate: x1.3, breakthrough: +15%",
    "tier": 3,
    "dimension": "mindset",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: heartDemonResistance",
    "unmappedEffectKeys": [
      "heartDemonResistance"
    ],
    "spawnWeight": 0,
    "traitCost": 18,
    "innateDelta": {
      "comprehension": 5.5,
      "aptitude": 1
    },
    "learningAffinity": {},
    "modifiers": [
      {
        "key": "mentalEquilibriumBias",
        "mode": "add",
        "unit": "flat",
        "value": 20,
        "sourceKey": "mindStateBonus"
      },
      {
        "key": "qiRateFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.3,
        "sourceKey": "qiRate"
      },
      {
        "key": "breakthroughChanceBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.15,
        "sourceKey": "breakthrough"
      },
      {
        "key": "mindTrainingBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.065,
        "sourceKey": "daoHeartVector"
      }
    ],
    "effects": [],
    "badge": "🧠",
    "color": "#a78bfa",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "qiAbsorptionMultiplier": 1.3,
      "breakthroughChanceBonus": 0.15
    }
  },
  {
    "id": "ngo_tinh_sieu_pham",
    "name": "Ngộ Tính Siêu Phàm",
    "description": "Trí tuệ thông suốt cổ kim, bất kỳ công pháp thần thông nào nhìn qua một lần là hiểu.",
    "sourceDescription": "Trí tuệ thông suốt cổ kim, bất kỳ công pháp thần thông nào nhìn qua một lần là hiểu.",
    "sourceVectorText": "Linh +2; Ngộ +24; Đạo tâm +20",
    "sourceEffectsText": "comprehension: x2.05, breakthrough: +18%, qiRate: x1.25, techniqueLearning: +40%",
    "tier": 4,
    "dimension": "mindset",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [
      "dan_don_ngu_ngo"
    ],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: techniqueLearning",
    "unmappedEffectKeys": [
      "techniqueLearning"
    ],
    "spawnWeight": 0,
    "traitCost": 35,
    "innateDelta": {
      "comprehension": 12,
      "aptitude": 1
    },
    "learningAffinity": {},
    "modifiers": [
      {
        "key": "techniqueLearningFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 2.05,
        "sourceKey": "comprehension"
      },
      {
        "key": "breakthroughChanceBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.18,
        "sourceKey": "breakthrough"
      },
      {
        "key": "qiRateFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.25,
        "sourceKey": "qiRate"
      },
      {
        "key": "mindTrainingBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.1,
        "sourceKey": "daoHeartVector"
      }
    ],
    "effects": [],
    "badge": "🧠",
    "color": "#fbbf24",
    "category": "innate",
    "conflicts": [
      "dan_don_ngu_ngo"
    ],
    "statModifiers": {
      "comprehensionMultiplier": 2.05,
      "breakthroughChanceBonus": 0.18,
      "qiAbsorptionMultiplier": 1.25
    }
  },
  {
    "id": "sat_phat_chi_tam",
    "name": "Sát Phạt Quyết Đoán",
    "description": "Ra tay tàn nhẫn dứt khoát, lấy sát chứng đạo, giết địch không làm đạo tâm dao động.",
    "sourceDescription": "Ra tay tàn nhẫn dứt khoát, lấy sát chứng đạo, giết địch không làm đạo tâm dao động.",
    "sourceVectorText": "Ngộ +16; Chiến +5; Đạo tâm +20",
    "sourceEffectsText": "atk: x1.65, crit: +20%, atkSpeed: x1.2, willpowerBonus: +30, heartDemonResistance: +25%",
    "tier": 4,
    "dimension": "mindset",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [
      "nhat_gan_so_chet"
    ],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: heartDemonResistance",
    "unmappedEffectKeys": [
      "heartDemonResistance"
    ],
    "spawnWeight": 0,
    "traitCost": 35,
    "innateDelta": {
      "comprehension": 8
    },
    "learningAffinity": {
      "combat": 5
    },
    "modifiers": [
      {
        "key": "attackFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.65,
        "sourceKey": "atk"
      },
      {
        "key": "critChanceBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.2,
        "sourceKey": "crit"
      },
      {
        "key": "attackSpeedFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.2,
        "sourceKey": "atkSpeed"
      },
      {
        "key": "willTrainingBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.15,
        "sourceKey": "willpowerBonus"
      },
      {
        "key": "mindTrainingBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.1,
        "sourceKey": "daoHeartVector"
      }
    ],
    "effects": [],
    "badge": "🗡️",
    "color": "#fbbf24",
    "category": "innate",
    "conflicts": [
      "nhat_gan_so_chet"
    ],
    "statModifiers": {
      "combatPowerMultiplier": 1.65,
      "critRateBonus": 0.2,
      "attackSpeedMultiplier": 1.2
    }
  },
  {
    "id": "bat_khuat_chien_y",
    "name": "Bất Khuất Chiến Ý",
    "description": "Dù trời sập xuống cũng không cúi đầu, ý chí chiến đấu nghiền nát mọi thiên kiếp.",
    "sourceDescription": "Dù trời sập xuống cũng không cúi đầu, ý chí chiến đấu nghiền nát mọi thiên kiếp.",
    "sourceVectorText": "Ngộ +16; Thể +3; Chiến +4; Đạo tâm +20",
    "sourceEffectsText": "willpowerBonus: +50, atk: x1.5, hp: x1.4, breakthrough: +20%",
    "tier": 4,
    "dimension": "mindset",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "active",
    "spawnWeight": 1,
    "traitCost": 35,
    "innateDelta": {
      "comprehension": 8,
      "physique": 1.5
    },
    "learningAffinity": {
      "combat": 4
    },
    "modifiers": [
      {
        "key": "willTrainingBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.25,
        "sourceKey": "willpowerBonus"
      },
      {
        "key": "attackFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.5,
        "sourceKey": "atk"
      },
      {
        "key": "healthFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.4,
        "sourceKey": "hp"
      },
      {
        "key": "breakthroughChanceBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.2,
        "sourceKey": "breakthrough"
      },
      {
        "key": "mindTrainingBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.1,
        "sourceKey": "daoHeartVector"
      }
    ],
    "effects": [],
    "badge": "🧠",
    "color": "#fbbf24",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "combatPowerMultiplier": 1.5,
      "healthMultiplier": 1.4,
      "breakthroughChanceBonus": 0.2
    }
  },
  {
    "id": "van_co_dao_tam",
    "name": "Vạn Cổ Đạo Tâm",
    "description": "Đạo tâm vững bền qua vạn cổ tang thương, tâm ma vừa sinh ra đã bịluyện hóa thành tu vi.",
    "sourceDescription": "Đạo tâm vững bền qua vạn cổ tang thương, tâm ma vừa sinh ra đã bịluyện hóa thành tu vi.",
    "sourceVectorText": "Linh +5; Ngộ +23; Đạo tâm +27",
    "sourceEffectsText": "mindStateBonus: +55, willpowerBonus: +60, heartDemonResistance: +70%, breakthrough: +28%, qiRate: x1.60",
    "tier": 5,
    "dimension": "mindset",
    "origin": "acquired",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [
      {
        "kind": "achievement",
        "key": "achieve_van_co_dao_tam",
        "value": 1
      }
    ],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: heartDemonResistance; Chưa có producer thành tựu hậu thiên tương ứng trong lõi",
    "unmappedEffectKeys": [
      "heartDemonResistance"
    ],
    "spawnWeight": 0,
    "traitCost": 60,
    "innateDelta": {},
    "learningAffinity": {
      "cultivation": 5
    },
    "modifiers": [
      {
        "key": "mentalEquilibriumBias",
        "mode": "add",
        "unit": "flat",
        "value": 20,
        "sourceKey": "mindStateBonus"
      },
      {
        "key": "willTrainingBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.25,
        "sourceKey": "willpowerBonus"
      },
      {
        "key": "breakthroughChanceBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.28,
        "sourceKey": "breakthrough"
      },
      {
        "key": "qiRateFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.6,
        "sourceKey": "qiRate"
      },
      {
        "key": "mindTrainingBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.135,
        "sourceKey": "daoHeartVector"
      }
    ],
    "effects": [],
    "badge": "🧠",
    "color": "#fb7185",
    "category": "experience",
    "conflicts": [],
    "statModifiers": {
      "breakthroughChanceBonus": 0.28,
      "qiAbsorptionMultiplier": 1.6
    }
  },
  {
    "id": "thien_nhan_hop_nhat",
    "name": "Thiên Nhân Hợp Nhất",
    "description": "Tâm cảnh hòa làm một với Thiên Đạo, mỗi nhịp thở đều là sự vận hành của quy tắc vũ trụ.",
    "sourceDescription": "Tâm cảnh hòa làm một với Thiên Đạo, mỗi nhịp thở đều là sự vận hành của quy tắc vũ trụ.",
    "sourceVectorText": "Linh +7; Ngộ +33; Đạo tâm +27",
    "sourceEffectsText": "comprehension: x2.20, qiRate: x1.90, mindStateBonus: +48, dodge: +22%, breakthrough: +25%",
    "tier": 5,
    "dimension": "mindset",
    "origin": "acquired",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [
      {
        "kind": "achievement",
        "key": "heaven_man_unity_milestone",
        "value": 1
      }
    ],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "planned",
    "deferredReason": "Chưa có producer sự kiện thành tựu/nghề nghiệp tương ứng trong lõi",
    "spawnWeight": 0,
    "traitCost": 60,
    "innateDelta": {},
    "learningAffinity": {
      "cultivation": 7
    },
    "modifiers": [
      {
        "key": "techniqueLearningFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 2.2,
        "sourceKey": "comprehension"
      },
      {
        "key": "qiRateFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.9,
        "sourceKey": "qiRate"
      },
      {
        "key": "mentalEquilibriumBias",
        "mode": "add",
        "unit": "flat",
        "value": 20,
        "sourceKey": "mindStateBonus"
      },
      {
        "key": "dodgeChanceBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.22,
        "sourceKey": "dodge"
      },
      {
        "key": "breakthroughChanceBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.25,
        "sourceKey": "breakthrough"
      },
      {
        "key": "mindTrainingBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.135,
        "sourceKey": "daoHeartVector"
      }
    ],
    "effects": [],
    "badge": "🧠",
    "color": "#fb7185",
    "category": "experience",
    "conflicts": [],
    "statModifiers": {
      "comprehensionMultiplier": 2.2,
      "qiAbsorptionMultiplier": 1.9,
      "dodgeRateBonus": 0.22,
      "breakthroughChanceBonus": 0.25
    }
  },
  {
    "id": "nhat_gan_so_chet",
    "name": "Nhát Gan Sợ Chết",
    "description": "Chưa đánh đã nghĩ đường chạy trốn, lực chiến yếu nhưng chạy thoát thân cực nhanh.",
    "sourceDescription": "Chưa đánh đã nghĩ đường chạy trốn, lực chiến yếu nhưng chạy thoát thân cực nhanh.",
    "sourceVectorText": "Chiến -2; Đạo tâm -4",
    "sourceEffectsText": "atk: x0.7, moveSpeed: x1.15, dodge: +12%, willpowerBonus: -15",
    "tier": 1,
    "dimension": "combat",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [
      "cuong_chien_huyet_no",
      "kien_dinh_nhu_thiet",
      "sat_phat_chi_tam"
    ],
    "implementation": "active",
    "spawnWeight": 1,
    "traitCost": 3,
    "innateDelta": {},
    "learningAffinity": {
      "combat": -2
    },
    "modifiers": [
      {
        "key": "attackFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 0.7,
        "sourceKey": "atk"
      },
      {
        "key": "moveSpeedFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.15,
        "sourceKey": "moveSpeed"
      },
      {
        "key": "dodgeChanceBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.12,
        "sourceKey": "dodge"
      },
      {
        "key": "willTrainingBonus",
        "mode": "add",
        "unit": "probability",
        "value": -0.075,
        "sourceKey": "willpowerBonus"
      },
      {
        "key": "mindTrainingBonus",
        "mode": "add",
        "unit": "probability",
        "value": -0.02,
        "sourceKey": "daoHeartVector"
      }
    ],
    "effects": [],
    "badge": "🐇",
    "color": "#94a3b8",
    "category": "innate",
    "conflicts": [
      "cuong_chien_huyet_no",
      "kien_dinh_nhu_thiet",
      "sat_phat_chi_tam"
    ],
    "statModifiers": {
      "combatPowerMultiplier": 0.7,
      "moveSpeedMultiplier": 1.15,
      "dodgeRateBonus": 0.12
    }
  },
  {
    "id": "huu_dung_vo_muu",
    "name": "Hữu Dũng Vô Mưu",
    "description": "Chỉ biết lao lên chém giết điên cuồng mà quên mất phòng thủ.",
    "sourceDescription": "Chỉ biết lao lên chém giết điên cuồng mà quên mất phòng thủ.",
    "sourceVectorText": "Chiến +7",
    "sourceEffectsText": "atk: x1.15, def: -8, dodge: -10%",
    "tier": 1,
    "dimension": "combat",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "active",
    "spawnWeight": 1,
    "traitCost": 3,
    "innateDelta": {},
    "learningAffinity": {
      "combat": 7
    },
    "modifiers": [
      {
        "key": "attackFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.15,
        "sourceKey": "atk"
      },
      {
        "key": "defenseFlat",
        "mode": "add",
        "unit": "flat",
        "value": -8,
        "sourceKey": "def"
      },
      {
        "key": "dodgeChanceBonus",
        "mode": "add",
        "unit": "probability",
        "value": -0.1,
        "sourceKey": "dodge"
      }
    ],
    "effects": [],
    "badge": "⚔️",
    "color": "#94a3b8",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "combatPowerMultiplier": 1.15,
      "defenseBonus": -8,
      "dodgeRateBonus": -0.1
    }
  },
  {
    "id": "kinh_nghiem_non_not",
    "name": "Kinh Nghiệm Non Nớt",
    "description": "Chưa từng trải qua thực chiến sinh tử, gặp kẻ địch thường luống cuống tay chân.",
    "sourceDescription": "Chưa từng trải qua thực chiến sinh tử, gặp kẻ địch thường luống cuống tay chân.",
    "sourceVectorText": "Chiến +2",
    "sourceEffectsText": "atk: x0.85, crit: -5%, dodge: -5%",
    "tier": 1,
    "dimension": "combat",
    "origin": "acquired",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [
      {
        "kind": "achievement",
        "key": "combat_untested",
        "value": 0
      }
    ],
    "exclusiveGroups": [
      "combat_experience"
    ],
    "conflictsWith": [],
    "implementation": "active",
    "spawnWeight": 0,
    "traitCost": 3,
    "innateDelta": {},
    "learningAffinity": {},
    "modifiers": [
      {
        "key": "attackFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 0.85,
        "sourceKey": "atk"
      },
      {
        "key": "critChanceBonus",
        "mode": "add",
        "unit": "probability",
        "value": -0.05,
        "sourceKey": "crit"
      },
      {
        "key": "dodgeChanceBonus",
        "mode": "add",
        "unit": "probability",
        "value": -0.05,
        "sourceKey": "dodge"
      }
    ],
    "effects": [],
    "badge": "⚔️",
    "color": "#94a3b8",
    "category": "experience",
    "conflicts": [],
    "statModifiers": {
      "combatPowerMultiplier": 0.85,
      "critRateBonus": -0.05,
      "dodgeRateBonus": -0.05
    }
  },
  {
    "id": "ra_don_do_du",
    "name": "Ra Đòn Do Dự",
    "description": "Sát tâm không đủ, khi xuất chiêu hay ngập ngừng khiến tốc độ đánh giảm sút.",
    "sourceDescription": "Sát tâm không đủ, khi xuất chiêu hay ngập ngừng khiến tốc độ đánh giảm sút.",
    "sourceVectorText": "Chiến +6",
    "sourceEffectsText": "atkSpeed: x0.8, crit: -5%, def: +5",
    "tier": 1,
    "dimension": "combat",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "active",
    "spawnWeight": 1,
    "traitCost": 3,
    "innateDelta": {},
    "learningAffinity": {
      "combat": 6
    },
    "modifiers": [
      {
        "key": "attackSpeedFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 0.8,
        "sourceKey": "atkSpeed"
      },
      {
        "key": "critChanceBonus",
        "mode": "add",
        "unit": "probability",
        "value": -0.05,
        "sourceKey": "crit"
      },
      {
        "key": "defenseFlat",
        "mode": "add",
        "unit": "flat",
        "value": 5,
        "sourceKey": "def"
      }
    ],
    "effects": [],
    "badge": "⚔️",
    "color": "#94a3b8",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "attackSpeedMultiplier": 0.8,
      "critRateBonus": -0.05,
      "defenseBonus": 5
    }
  },
  {
    "id": "than_xa_thu",
    "name": "Bách Bộ Xuyên Dương",
    "description": "Nhãn lực và khả năng định vị mục tiêu từ xa chuẩn xác tuyệt đối.",
    "sourceDescription": "Nhãn lực và khả năng định vị mục tiêu từ xa chuẩn xác tuyệt đối.",
    "sourceVectorText": "Chiến +14",
    "sourceEffectsText": "crit: +18%, atk: x1.25",
    "tier": 2,
    "dimension": "combat",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "active",
    "spawnWeight": 1,
    "traitCost": 8,
    "innateDelta": {},
    "learningAffinity": {
      "combat": 14
    },
    "modifiers": [
      {
        "key": "critChanceBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.18,
        "sourceKey": "crit"
      },
      {
        "key": "attackFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.25,
        "sourceKey": "atk"
      }
    ],
    "effects": [],
    "badge": "🏹",
    "color": "#34d399",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "critRateBonus": 0.18,
      "combatPowerMultiplier": 1.25
    }
  },
  {
    "id": "phuc_kich_cao_thu",
    "name": "Phục Kích Cao Thủ",
    "description": "Giỏi ẩn mình trong bóng tối, chờ thời cơ tung đòn đánh lén hiểm hóc.",
    "sourceDescription": "Giỏi ẩn mình trong bóng tối, chờ thời cơ tung đòn đánh lén hiểm hóc.",
    "sourceVectorText": "Chiến +12",
    "sourceEffectsText": "crit: +15%, dodge: +12%, moveSpeed: x1.15",
    "tier": 2,
    "dimension": "combat",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "active",
    "spawnWeight": 1,
    "traitCost": 8,
    "innateDelta": {},
    "learningAffinity": {
      "combat": 12
    },
    "modifiers": [
      {
        "key": "critChanceBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.15,
        "sourceKey": "crit"
      },
      {
        "key": "dodgeChanceBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.12,
        "sourceKey": "dodge"
      },
      {
        "key": "moveSpeedFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.15,
        "sourceKey": "moveSpeed"
      }
    ],
    "effects": [],
    "badge": "🥷",
    "color": "#34d399",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "critRateBonus": 0.15,
      "dodgeRateBonus": 0.12,
      "moveSpeedMultiplier": 1.15
    }
  },
  {
    "id": "tram_sat_linh_thu",
    "name": "Thợ Săn Yêu Thú",
    "description": "Dày dạn kinh nghiệm đi săn nơi rừng thiêng nước độc, nắm rõ yếu hại của dã thú.",
    "sourceDescription": "Dày dạn kinh nghiệm đi săn nơi rừng thiêng nước độc, nắm rõ yếu hại của dã thú.",
    "sourceVectorText": "Chiến +14",
    "sourceEffectsText": "atk: x1.3, crit: +10%",
    "tier": 2,
    "dimension": "combat",
    "origin": "acquired",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [
      {
        "kind": "achievement",
        "key": "beast_encounters_won",
        "value": 25
      }
    ],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "planned",
    "deferredReason": "Chưa có producer sự kiện thành tựu tương ứng trong lõi",
    "spawnWeight": 0,
    "traitCost": 8,
    "innateDelta": {},
    "learningAffinity": {
      "combat": 14
    },
    "modifiers": [
      {
        "key": "attackFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.3,
        "sourceKey": "atk"
      },
      {
        "key": "critChanceBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.1,
        "sourceKey": "crit"
      }
    ],
    "effects": [],
    "badge": "🥩",
    "color": "#34d399",
    "category": "experience",
    "conflicts": [],
    "statModifiers": {
      "combatPowerMultiplier": 1.3,
      "critRateBonus": 0.1
    }
  },
  {
    "id": "can_chien_hung_han",
    "name": "Cận Chiến Hung Hãn",
    "description": "Càng áp sát đối thủ đòn đánh càng dồn dập và tàn bạo.",
    "sourceDescription": "Càng áp sát đối thủ đòn đánh càng dồn dập và tàn bạo.",
    "sourceVectorText": "Thể +1; Chiến +14",
    "sourceEffectsText": "atk: x1.25, atkSpeed: x1.15, hp: x1.1",
    "tier": 2,
    "dimension": "combat",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "active",
    "spawnWeight": 1,
    "traitCost": 8,
    "innateDelta": {
      "physique": 0.5
    },
    "learningAffinity": {
      "combat": 14
    },
    "modifiers": [
      {
        "key": "attackFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.25,
        "sourceKey": "atk"
      },
      {
        "key": "attackSpeedFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.15,
        "sourceKey": "atkSpeed"
      },
      {
        "key": "healthFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.1,
        "sourceKey": "hp"
      }
    ],
    "effects": [],
    "badge": "⚔️",
    "color": "#34d399",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "combatPowerMultiplier": 1.25,
      "attackSpeedMultiplier": 1.15,
      "healthMultiplier": 1.1
    }
  },
  {
    "id": "phan_xa_ben_nhay",
    "name": "Phản Xạ Bén Nhạy",
    "description": "Thần kinh phản xạ cực nhanh trước đòn tấn công bất ngờ.",
    "sourceDescription": "Thần kinh phản xạ cực nhanh trước đòn tấn công bất ngờ.",
    "sourceVectorText": "Chiến +12",
    "sourceEffectsText": "dodge: +16%, atkSpeed: x1.12",
    "tier": 2,
    "dimension": "combat",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "active",
    "spawnWeight": 1,
    "traitCost": 8,
    "innateDelta": {},
    "learningAffinity": {
      "combat": 12
    },
    "modifiers": [
      {
        "key": "dodgeChanceBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.16,
        "sourceKey": "dodge"
      },
      {
        "key": "attackSpeedFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.12,
        "sourceKey": "atkSpeed"
      }
    ],
    "effects": [],
    "badge": "⚔️",
    "color": "#34d399",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "dodgeRateBonus": 0.16,
      "attackSpeedMultiplier": 1.12
    }
  },
  {
    "id": "bach_chien_bat_bai",
    "name": "Bách Chiến Bất Bại",
    "description": "Trải qua hàng trăm trận huyết chiến sinh tử, kinh nghiệm chiến đấu dày dạn vô song.",
    "sourceDescription": "Trải qua hàng trăm trận huyết chiến sinh tử, kinh nghiệm chiến đấu dày dạn vô song.",
    "sourceVectorText": "Chiến +23",
    "sourceEffectsText": "atk: x1.4, def: +15, armor: +15, willpowerBonus: +20",
    "tier": 3,
    "dimension": "combat",
    "origin": "acquired",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [
      {
        "kind": "achievement",
        "key": "challenging_encounters_won",
        "value": 100
      }
    ],
    "exclusiveGroups": [
      "combat_experience"
    ],
    "conflictsWith": [],
    "evolvesFrom": "kinh_nghiem_non_not",
    "implementation": "active",
    "spawnWeight": 0,
    "traitCost": 18,
    "innateDelta": {},
    "learningAffinity": {
      "combat": 23
    },
    "modifiers": [
      {
        "key": "attackFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.4,
        "sourceKey": "atk"
      },
      {
        "key": "defenseFlat",
        "mode": "add",
        "unit": "flat",
        "value": 15,
        "sourceKey": "def"
      },
      {
        "key": "armorFlat",
        "mode": "add",
        "unit": "flat",
        "value": 15,
        "sourceKey": "armor"
      },
      {
        "key": "willTrainingBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.1,
        "sourceKey": "willpowerBonus"
      }
    ],
    "effects": [],
    "badge": "🛡️",
    "color": "#a78bfa",
    "category": "experience",
    "conflicts": [],
    "statModifiers": {
      "combatPowerMultiplier": 1.4,
      "defenseBonus": 15,
      "armorBonus": 15
    }
  },
  {
    "id": "than_hanh_bach_bien",
    "name": "Thần Hành Bách Biến",
    "description": "Thân pháp ảo diệu như bóng ma, để lại tàn ảnh khiến kẻ địch không thể chạm tới.",
    "sourceDescription": "Thân pháp ảo diệu như bóng ma, để lại tàn ảnh khiến kẻ địch không thể chạm tới.",
    "sourceVectorText": "Chiến +20",
    "sourceEffectsText": "moveSpeed: x1.45, dodge: +25%",
    "tier": 3,
    "dimension": "combat",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [
      "tat_nguyen_bam_sinh"
    ],
    "implementation": "active",
    "spawnWeight": 1,
    "traitCost": 18,
    "innateDelta": {},
    "learningAffinity": {
      "combat": 20
    },
    "modifiers": [
      {
        "key": "moveSpeedFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.45,
        "sourceKey": "moveSpeed"
      },
      {
        "key": "dodgeChanceBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.25,
        "sourceKey": "dodge"
      }
    ],
    "effects": [],
    "badge": "👟",
    "color": "#a78bfa",
    "category": "innate",
    "conflicts": [
      "tat_nguyen_bam_sinh"
    ],
    "statModifiers": {
      "moveSpeedMultiplier": 1.45,
      "dodgeRateBonus": 0.25
    }
  },
  {
    "id": "ho_the_cuong_khi",
    "name": "Hộ Thể Cương Khí",
    "description": "Chân nguyên tự động ngưng tụ thành lớp giáp vô hình bảo vệ toàn thân.",
    "sourceDescription": "Chân nguyên tự động ngưng tụ thành lớp giáp vô hình bảo vệ toàn thân.",
    "sourceVectorText": "Thể +2; Chiến +20",
    "sourceEffectsText": "def: +20, armor: +25, hp: x1.2",
    "tier": 3,
    "dimension": "combat",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "active",
    "spawnWeight": 1,
    "traitCost": 18,
    "innateDelta": {
      "physique": 1
    },
    "learningAffinity": {
      "combat": 20
    },
    "modifiers": [
      {
        "key": "defenseFlat",
        "mode": "add",
        "unit": "flat",
        "value": 20,
        "sourceKey": "def"
      },
      {
        "key": "armorFlat",
        "mode": "add",
        "unit": "flat",
        "value": 25,
        "sourceKey": "armor"
      },
      {
        "key": "healthFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.2,
        "sourceKey": "hp"
      }
    ],
    "effects": [],
    "badge": "🛡️",
    "color": "#a78bfa",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "defenseBonus": 20,
      "armorBonus": 25,
      "healthMultiplier": 1.2
    }
  },
  {
    "id": "cuong_chien_huyet_no",
    "name": "Cuồng Chiến Huyết Nộ",
    "description": "Càng bị thương nặng càng trở nên điên cuồng, đổi phòng thủ lấy sức công phá hủy diệt.",
    "sourceDescription": "Càng bị thương nặng càng trở nên điên cuồng, đổi phòng thủ lấy sức công phá hủy diệt.",
    "sourceVectorText": "Chiến +24",
    "sourceEffectsText": "atk: x1.55, atkSpeed: x1.25, def: -8, willpowerBonus: +15",
    "tier": 3,
    "dimension": "combat",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [
      "nhat_gan_so_chet"
    ],
    "implementation": "active",
    "spawnWeight": 1,
    "traitCost": 18,
    "innateDelta": {},
    "learningAffinity": {
      "combat": 24
    },
    "modifiers": [
      {
        "key": "attackFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.55,
        "sourceKey": "atk"
      },
      {
        "key": "attackSpeedFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.25,
        "sourceKey": "atkSpeed"
      },
      {
        "key": "defenseFlat",
        "mode": "add",
        "unit": "flat",
        "value": -8,
        "sourceKey": "def"
      },
      {
        "key": "willTrainingBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.075,
        "sourceKey": "willpowerBonus"
      }
    ],
    "effects": [],
    "badge": "🪓",
    "color": "#a78bfa",
    "category": "innate",
    "conflicts": [
      "nhat_gan_so_chet"
    ],
    "statModifiers": {
      "combatPowerMultiplier": 1.55,
      "attackSpeedMultiplier": 1.25,
      "defenseBonus": -8
    }
  },
  {
    "id": "quyen_tran_son_ha",
    "name": "Quyền Trấn Sơn Hà",
    "description": "Quyền pháp đại khai đại hợp, mỗi cú đấm mang theo kình lực chấn vỡ núi đá.",
    "sourceDescription": "Quyền pháp đại khai đại hợp, mỗi cú đấm mang theo kình lực chấn vỡ núi đá.",
    "sourceVectorText": "Thể +2; Chiến +24",
    "sourceEffectsText": "atk: x1.45, armor: +15, hp: x1.2",
    "tier": 3,
    "dimension": "combat",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "active",
    "spawnWeight": 1,
    "traitCost": 18,
    "innateDelta": {
      "physique": 1
    },
    "learningAffinity": {
      "combat": 24
    },
    "modifiers": [
      {
        "key": "attackFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.45,
        "sourceKey": "atk"
      },
      {
        "key": "armorFlat",
        "mode": "add",
        "unit": "flat",
        "value": 15,
        "sourceKey": "armor"
      },
      {
        "key": "healthFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.2,
        "sourceKey": "hp"
      }
    ],
    "effects": [],
    "badge": "👊",
    "color": "#a78bfa",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "combatPowerMultiplier": 1.45,
      "armorBonus": 15,
      "healthMultiplier": 1.2
    }
  },
  {
    "id": "nhat_kich_tat_sat",
    "name": "Nhất Kích Tất Sát",
    "description": "Không ra tay thì thôi, một khi xuất chiêu là nhắm thẳng tử huyệt đoạt mạng.",
    "sourceDescription": "Không ra tay thì thôi, một khi xuất chiêu là nhắm thẳng tử huyệt đoạt mạng.",
    "sourceVectorText": "Chiến +35",
    "sourceEffectsText": "crit: +35%, atk: x1.6",
    "tier": 4,
    "dimension": "combat",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "active",
    "spawnWeight": 1,
    "traitCost": 35,
    "innateDelta": {},
    "learningAffinity": {
      "combat": 35
    },
    "modifiers": [
      {
        "key": "critChanceBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.35,
        "sourceKey": "crit"
      },
      {
        "key": "attackFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.6,
        "sourceKey": "atk"
      }
    ],
    "effects": [],
    "badge": "💥",
    "color": "#fbbf24",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "critRateBonus": 0.35,
      "combatPowerMultiplier": 1.6
    }
  },
  {
    "id": "nghich_chien_thuong_khung",
    "name": "Nghịch Chiến Thượng Khung",
    "description": "Ý chí chiến đấu nghịch thiên, chuyên vượt cấp chém giết cường giả cảnh giới cao hơn.",
    "sourceDescription": "Ý chí chiến đấu nghịch thiên, chuyên vượt cấp chém giết cường giả cảnh giới cao hơn.",
    "sourceVectorText": "Thể +3; Chiến +37",
    "sourceEffectsText": "atk: x1.9, crit: +20%, hp: x1.4, breakthrough: +15%, willpowerBonus: +40",
    "tier": 4,
    "dimension": "combat",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "active",
    "spawnWeight": 1,
    "traitCost": 35,
    "innateDelta": {
      "physique": 1.5
    },
    "learningAffinity": {
      "combat": 37
    },
    "modifiers": [
      {
        "key": "attackFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.9,
        "sourceKey": "atk"
      },
      {
        "key": "critChanceBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.2,
        "sourceKey": "crit"
      },
      {
        "key": "healthFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.4,
        "sourceKey": "hp"
      },
      {
        "key": "breakthroughChanceBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.15,
        "sourceKey": "breakthrough"
      },
      {
        "key": "willTrainingBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.2,
        "sourceKey": "willpowerBonus"
      }
    ],
    "effects": [],
    "badge": "👑",
    "color": "#fbbf24",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "combatPowerMultiplier": 1.9,
      "critRateBonus": 0.2,
      "healthMultiplier": 1.4,
      "breakthroughChanceBonus": 0.15
    }
  },
  {
    "id": "van_phu_mac_dich",
    "name": "Vạn Phu Mạc Địch",
    "description": "Một người trấn giữ quan ải, vạn quân không thể bước qua, công thủ toàn diện.",
    "sourceDescription": "Một người trấn giữ quan ải, vạn quân không thể bước qua, công thủ toàn diện.",
    "sourceVectorText": "Thể +4; Chiến +36",
    "sourceEffectsText": "atk: x1.7, def: +30, armor: +30, hp: x1.5",
    "tier": 4,
    "dimension": "combat",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "active",
    "spawnWeight": 1,
    "traitCost": 35,
    "innateDelta": {
      "physique": 2
    },
    "learningAffinity": {
      "combat": 36
    },
    "modifiers": [
      {
        "key": "attackFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.7,
        "sourceKey": "atk"
      },
      {
        "key": "defenseFlat",
        "mode": "add",
        "unit": "flat",
        "value": 30,
        "sourceKey": "def"
      },
      {
        "key": "armorFlat",
        "mode": "add",
        "unit": "flat",
        "value": 30,
        "sourceKey": "armor"
      },
      {
        "key": "healthFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.5,
        "sourceKey": "hp"
      }
    ],
    "effects": [],
    "badge": "⚔️",
    "color": "#fbbf24",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "combatPowerMultiplier": 1.7,
      "defenseBonus": 30,
      "armorBonus": 30,
      "healthMultiplier": 1.5
    }
  },
  {
    "id": "huyet_chien_bat_phuong",
    "name": "Huyết Chiến Bát Phương",
    "description": "Giữa vòng vây trùng điệp sát khí càng hăng, tốc độ xuất chiêu và bạo kích tăng mạnh.",
    "sourceDescription": "Giữa vòng vây trùng điệp sát khí càng hăng, tốc độ xuất chiêu và bạo kích tăng mạnh.",
    "sourceVectorText": "Chiến +36",
    "sourceEffectsText": "atk: x1.75, atkSpeed: x1.35, crit: +20%, willpowerBonus: +30",
    "tier": 4,
    "dimension": "combat",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "active",
    "spawnWeight": 1,
    "traitCost": 35,
    "innateDelta": {},
    "learningAffinity": {
      "combat": 36
    },
    "modifiers": [
      {
        "key": "attackFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.75,
        "sourceKey": "atk"
      },
      {
        "key": "attackSpeedFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.35,
        "sourceKey": "atkSpeed"
      },
      {
        "key": "critChanceBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.2,
        "sourceKey": "crit"
      },
      {
        "key": "willTrainingBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.15,
        "sourceKey": "willpowerBonus"
      }
    ],
    "effects": [],
    "badge": "⚔️",
    "color": "#fbbf24",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "combatPowerMultiplier": 1.75,
      "attackSpeedMultiplier": 1.35,
      "critRateBonus": 0.2
    }
  },
  {
    "id": "chien_than_tai_the",
    "name": "Chiến Thần Tại Thế",
    "description": "Hóa thân của Chiến Thần thượng cổ, bước vào trận chiến là áp đảo hoàn toàn quần hùng.",
    "sourceDescription": "Hóa thân của Chiến Thần thượng cổ, bước vào trận chiến là áp đảo hoàn toàn quần hùng.",
    "sourceVectorText": "Thể +5; Chiến +52",
    "sourceEffectsText": "atk: x2.20, crit: +35%, atkSpeed: x1.45, hp: x1.65, willpowerBonus: +50",
    "tier": 5,
    "dimension": "combat",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "active",
    "spawnWeight": 1,
    "traitCost": 60,
    "innateDelta": {
      "physique": 2.5
    },
    "learningAffinity": {
      "combat": 52
    },
    "modifiers": [
      {
        "key": "attackFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 2.2,
        "sourceKey": "atk"
      },
      {
        "key": "critChanceBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.35,
        "sourceKey": "crit"
      },
      {
        "key": "attackSpeedFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.45,
        "sourceKey": "atkSpeed"
      },
      {
        "key": "healthFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.65,
        "sourceKey": "hp"
      },
      {
        "key": "willTrainingBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.25,
        "sourceKey": "willpowerBonus"
      }
    ],
    "effects": [],
    "badge": "⚔️",
    "color": "#fb7185",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "combatPowerMultiplier": 2.2,
      "critRateBonus": 0.35,
      "attackSpeedMultiplier": 1.45,
      "healthMultiplier": 1.65
    }
  },
  {
    "id": "vo_dich_thien_ha",
    "name": "Vô Địch Thiên Hạ",
    "description": "Niềm tin vô địch tuyệt đối tạo nên khí thế bẻ gãy mọi thần thông của kẻ địch.",
    "sourceDescription": "Niềm tin vô địch tuyệt đối tạo nên khí thế bẻ gãy mọi thần thông của kẻ địch.",
    "sourceVectorText": "Chiến +52",
    "sourceEffectsText": "atk: x2.25, def: +42, armor: +42, mindStateBonus: +45, willpowerBonus: +60, moraleAura: +25%",
    "tier": 5,
    "dimension": "combat",
    "origin": "acquired",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [
      {
        "kind": "achievement",
        "key": "achieve_vo_dich_thien_ha",
        "value": 1
      }
    ],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: moraleAura; Chưa có producer thành tựu hậu thiên tương ứng trong lõi",
    "unmappedEffectKeys": [
      "moraleAura"
    ],
    "spawnWeight": 0,
    "traitCost": 60,
    "innateDelta": {},
    "learningAffinity": {
      "combat": 52
    },
    "modifiers": [
      {
        "key": "attackFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 2.25,
        "sourceKey": "atk"
      },
      {
        "key": "defenseFlat",
        "mode": "add",
        "unit": "flat",
        "value": 42,
        "sourceKey": "def"
      },
      {
        "key": "armorFlat",
        "mode": "add",
        "unit": "flat",
        "value": 42,
        "sourceKey": "armor"
      },
      {
        "key": "mentalEquilibriumBias",
        "mode": "add",
        "unit": "flat",
        "value": 20,
        "sourceKey": "mindStateBonus"
      },
      {
        "key": "willTrainingBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.25,
        "sourceKey": "willpowerBonus"
      }
    ],
    "effects": [],
    "badge": "⚔️",
    "color": "#fb7185",
    "category": "experience",
    "conflicts": [],
    "statModifiers": {
      "combatPowerMultiplier": 2.25,
      "defenseBonus": 42,
      "armorBonus": 42
    }
  },
  {
    "id": "van_rui_deo_bam",
    "name": "Sao Quả Tạ Chiếu Mệnh",
    "description": "Đi đường bằng cũng vấp ngã, luyện đan dễ nổ lò, độ kiếp hay bị sét đánh trúng đầu tiên.",
    "sourceDescription": "Đi đường bằng cũng vấp ngã, luyện đan dễ nổ lò, độ kiếp hay bị sét đánh trúng đầu tiên.",
    "sourceVectorText": "Đạo tâm -2",
    "sourceEffectsText": "breakthrough: -20%, alchemy: -25%, dodge: -10%",
    "tier": 1,
    "dimension": "social",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [
      "khi_van_chi_tu",
      "phuc_trach_tham_hau"
    ],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: alchemy",
    "unmappedEffectKeys": [
      "alchemy"
    ],
    "spawnWeight": 0,
    "traitCost": 3,
    "innateDelta": {},
    "learningAffinity": {},
    "modifiers": [
      {
        "key": "breakthroughChanceBonus",
        "mode": "add",
        "unit": "probability",
        "value": -0.2,
        "sourceKey": "breakthrough"
      },
      {
        "key": "dodgeChanceBonus",
        "mode": "add",
        "unit": "probability",
        "value": -0.1,
        "sourceKey": "dodge"
      },
      {
        "key": "mindTrainingBonus",
        "mode": "add",
        "unit": "probability",
        "value": -0.01,
        "sourceKey": "daoHeartVector"
      }
    ],
    "effects": [],
    "badge": "🪦",
    "color": "#94a3b8",
    "category": "innate",
    "conflicts": [
      "khi_van_chi_tu",
      "phuc_trach_tham_hau"
    ],
    "statModifiers": {
      "breakthroughChanceBonus": -0.2,
      "dodgeRateBonus": -0.1
    }
  },
  {
    "id": "tham_lam_vo_day",
    "name": "Tham Lam Vô Đáy",
    "description": "Nhìn thấy tài bảo là sáng mắt, chăm chỉ vơ vét nhưng dễ sinh tâm ma khi đột phá.",
    "sourceDescription": "Nhìn thấy tài bảo là sáng mắt, chăm chỉ vơ vét nhưng dễ sinh tâm ma khi đột phá.",
    "sourceVectorText": "Nghệ +1; Đạo tâm -7",
    "sourceEffectsText": "craftingSpeed: x1.15, breakthrough: -10%, prestige: -15, heartDemonResistance: -15%",
    "tier": 1,
    "dimension": "social",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [
      "truong_nghia_so_tai"
    ],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: prestige, heartDemonResistance",
    "unmappedEffectKeys": [
      "prestige",
      "heartDemonResistance"
    ],
    "spawnWeight": 0,
    "traitCost": 3,
    "innateDelta": {},
    "learningAffinity": {
      "profession": 1
    },
    "modifiers": [
      {
        "key": "workSpeedFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.15,
        "sourceKey": "craftingSpeed"
      },
      {
        "key": "breakthroughChanceBonus",
        "mode": "add",
        "unit": "probability",
        "value": -0.1,
        "sourceKey": "breakthrough"
      },
      {
        "key": "mindTrainingBonus",
        "mode": "add",
        "unit": "probability",
        "value": -0.035,
        "sourceKey": "daoHeartVector"
      }
    ],
    "effects": [],
    "badge": "🤑",
    "color": "#94a3b8",
    "category": "innate",
    "conflicts": [
      "truong_nghia_so_tai"
    ],
    "statModifiers": {
      "craftingSpeedMultiplier": 1.15,
      "breakthroughChanceBonus": -0.1
    }
  },
  {
    "id": "co_doc_lanh_lung",
    "name": "Cô Độc Lạnh Lùng",
    "description": "Không thích kết giao bạn bè, sống khép kín nhưng giữ được tâm cảnh tĩnh lặng.",
    "sourceDescription": "Không thích kết giao bạn bè, sống khép kín nhưng giữ được tâm cảnh tĩnh lặng.",
    "sourceVectorText": "Linh +1; Đạo tâm +2",
    "sourceEffectsText": "prestige: -10, mindStateBonus: +10, qiRate: x1.1",
    "tier": 1,
    "dimension": "social",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: prestige",
    "unmappedEffectKeys": [
      "prestige"
    ],
    "spawnWeight": 0,
    "traitCost": 3,
    "innateDelta": {
      "aptitude": 0.5
    },
    "learningAffinity": {},
    "modifiers": [
      {
        "key": "mentalEquilibriumBias",
        "mode": "add",
        "unit": "flat",
        "value": 10,
        "sourceKey": "mindStateBonus"
      },
      {
        "key": "qiRateFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.1,
        "sourceKey": "qiRate"
      },
      {
        "key": "mindTrainingBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.01,
        "sourceKey": "daoHeartVector"
      }
    ],
    "effects": [],
    "badge": "🍀",
    "color": "#94a3b8",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "qiAbsorptionMultiplier": 1.1
    }
  },
  {
    "id": "dao_hoa_van_do",
    "name": "Đào Hoa Kiếp",
    "description": "Dung mạo tuấn tú thu hút nhiều nhân duyên nhưng cũng dễ vướng vào ân oán tình thù.",
    "sourceDescription": "Dung mạo tuấn tú thu hút nhiều nhân duyên nhưng cũng dễ vướng vào ân oán tình thù.",
    "sourceVectorText": "Linh +1; Đạo tâm +4",
    "sourceEffectsText": "moveSpeed: x1.15, qiRate: x1.15, def: -5, mindStateBonus: -8",
    "tier": 2,
    "dimension": "social",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [
      "doc_lai_doc_vang",
      "khac_the_khac_tu"
    ],
    "implementation": "active",
    "spawnWeight": 1,
    "traitCost": 8,
    "innateDelta": {
      "aptitude": 0.5
    },
    "learningAffinity": {},
    "modifiers": [
      {
        "key": "moveSpeedFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.15,
        "sourceKey": "moveSpeed"
      },
      {
        "key": "qiRateFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.15,
        "sourceKey": "qiRate"
      },
      {
        "key": "defenseFlat",
        "mode": "add",
        "unit": "flat",
        "value": -5,
        "sourceKey": "def"
      },
      {
        "key": "mentalEquilibriumBias",
        "mode": "add",
        "unit": "flat",
        "value": -8,
        "sourceKey": "mindStateBonus"
      },
      {
        "key": "mindTrainingBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.02,
        "sourceKey": "daoHeartVector"
      }
    ],
    "effects": [],
    "badge": "🌸",
    "color": "#34d399",
    "category": "innate",
    "conflicts": [
      "doc_lai_doc_vang",
      "khac_the_khac_tu"
    ],
    "statModifiers": {
      "moveSpeedMultiplier": 1.15,
      "qiAbsorptionMultiplier": 1.15,
      "defenseBonus": -5
    }
  },
  {
    "id": "khac_the_khac_tu",
    "name": "Thiên Sát Cô Tinh",
    "description": "Mệnh cách khắc chết người thân bạn bè, cả đời cô độc trên con đường sát phạt.",
    "sourceDescription": "Mệnh cách khắc chết người thân bạn bè, cả đời cô độc trên con đường sát phạt.",
    "sourceVectorText": "Chiến +2; Đạo tâm +4",
    "sourceEffectsText": "atk: x1.3, crit: +15%, prestige: -20, willpowerBonus: +20",
    "tier": 2,
    "dimension": "social",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [
      "dao_hoa_van_do",
      "lanh_tu_quan_luan"
    ],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: prestige",
    "unmappedEffectKeys": [
      "prestige"
    ],
    "spawnWeight": 0,
    "traitCost": 8,
    "innateDelta": {},
    "learningAffinity": {
      "combat": 2
    },
    "modifiers": [
      {
        "key": "attackFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.3,
        "sourceKey": "atk"
      },
      {
        "key": "critChanceBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.15,
        "sourceKey": "crit"
      },
      {
        "key": "willTrainingBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.1,
        "sourceKey": "willpowerBonus"
      },
      {
        "key": "mindTrainingBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.02,
        "sourceKey": "daoHeartVector"
      }
    ],
    "effects": [],
    "badge": "🥀",
    "color": "#34d399",
    "category": "innate",
    "conflicts": [
      "dao_hoa_van_do",
      "lanh_tu_quan_luan"
    ],
    "statModifiers": {
      "combatPowerMultiplier": 1.3,
      "critRateBonus": 0.15
    }
  },
  {
    "id": "doc_lai_doc_vang",
    "name": "Độc Lai Độc Vãng",
    "description": "Thích hành tẩu một mình nơi hoang dã, tự sinh tự diệt, thân pháp linh hoạt.",
    "sourceDescription": "Thích hành tẩu một mình nơi hoang dã, tự sinh tự diệt, thân pháp linh hoạt.",
    "sourceVectorText": "Linh +2; Đạo tâm +4",
    "sourceEffectsText": "moveSpeed: x1.2, qiRate: x1.2, dodge: +10%",
    "tier": 2,
    "dimension": "social",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [
      "dao_hoa_van_do",
      "lanh_tu_quan_luan"
    ],
    "implementation": "active",
    "spawnWeight": 1,
    "traitCost": 8,
    "innateDelta": {
      "aptitude": 1
    },
    "learningAffinity": {},
    "modifiers": [
      {
        "key": "moveSpeedFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.2,
        "sourceKey": "moveSpeed"
      },
      {
        "key": "qiRateFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.2,
        "sourceKey": "qiRate"
      },
      {
        "key": "dodgeChanceBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.1,
        "sourceKey": "dodge"
      },
      {
        "key": "mindTrainingBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.02,
        "sourceKey": "daoHeartVector"
      }
    ],
    "effects": [],
    "badge": "🐺",
    "color": "#34d399",
    "category": "innate",
    "conflicts": [
      "dao_hoa_van_do",
      "lanh_tu_quan_luan"
    ],
    "statModifiers": {
      "moveSpeedMultiplier": 1.2,
      "qiAbsorptionMultiplier": 1.2,
      "dodgeRateBonus": 0.1
    }
  },
  {
    "id": "luon_leo_giao_hoat",
    "name": "Lươn Lẹo Giảo Hoạt",
    "description": "Mồm mép tép nhảy, giỏi luồn cúi và tìm đường lui khi gặp nguy hiểm.",
    "sourceDescription": "Mồm mép tép nhảy, giỏi luồn cúi và tìm đường lui khi gặp nguy hiểm.",
    "sourceVectorText": "Đạo tâm +4",
    "sourceEffectsText": "dodge: +18%, moveSpeed: x1.15, crit: +10%",
    "tier": 2,
    "dimension": "social",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "active",
    "spawnWeight": 1,
    "traitCost": 8,
    "innateDelta": {},
    "learningAffinity": {},
    "modifiers": [
      {
        "key": "dodgeChanceBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.18,
        "sourceKey": "dodge"
      },
      {
        "key": "moveSpeedFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.15,
        "sourceKey": "moveSpeed"
      },
      {
        "key": "critChanceBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.1,
        "sourceKey": "crit"
      },
      {
        "key": "mindTrainingBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.02,
        "sourceKey": "daoHeartVector"
      }
    ],
    "effects": [],
    "badge": "🦊",
    "color": "#34d399",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "dodgeRateBonus": 0.18,
      "moveSpeedMultiplier": 1.15,
      "critRateBonus": 0.1
    }
  },
  {
    "id": "am_hiem_doc_ac",
    "name": "Tâm Ngoan Thủ Lạt",
    "description": "Làm việc bất chấp thủ đoạn, ra tay tàn độc không chừa đường sống.",
    "sourceDescription": "Làm việc bất chấp thủ đoạn, ra tay tàn độc không chừa đường sống.",
    "sourceVectorText": "Chiến +2; Đạo tâm -5",
    "sourceEffectsText": "atk: x1.3, crit: +15%, breakthrough: -5%, heartDemonResistance: -10%",
    "tier": 2,
    "dimension": "social",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [
      "truong_nghia_so_tai",
      "xich_tu_chi_tam"
    ],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: heartDemonResistance",
    "unmappedEffectKeys": [
      "heartDemonResistance"
    ],
    "spawnWeight": 0,
    "traitCost": 8,
    "innateDelta": {},
    "learningAffinity": {
      "combat": 2
    },
    "modifiers": [
      {
        "key": "attackFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.3,
        "sourceKey": "atk"
      },
      {
        "key": "critChanceBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.15,
        "sourceKey": "crit"
      },
      {
        "key": "breakthroughChanceBonus",
        "mode": "add",
        "unit": "probability",
        "value": -0.05,
        "sourceKey": "breakthrough"
      },
      {
        "key": "mindTrainingBonus",
        "mode": "add",
        "unit": "probability",
        "value": -0.025,
        "sourceKey": "daoHeartVector"
      }
    ],
    "effects": [],
    "badge": "🐍",
    "color": "#34d399",
    "category": "innate",
    "conflicts": [
      "truong_nghia_so_tai",
      "xich_tu_chi_tam"
    ],
    "statModifiers": {
      "combatPowerMultiplier": 1.3,
      "critRateBonus": 0.15,
      "breakthroughChanceBonus": -0.05
    }
  },
  {
    "id": "truong_nghia_so_tai",
    "name": "Trọng Tình Trọng Nghĩa",
    "description": "Sẵn sàng xả thân vì bằng hữu, được đồng môn kính trọng, đạo tâm sáng tỏ.",
    "sourceDescription": "Sẵn sàng xả thân vì bằng hữu, được đồng môn kính trọng, đạo tâm sáng tỏ.",
    "sourceVectorText": "Đạo tâm +4",
    "sourceEffectsText": "prestige: +20, breakthrough: +10%, mindStateBonus: +15",
    "tier": 2,
    "dimension": "social",
    "origin": "acquired",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [
      {
        "kind": "achievement",
        "key": "achieve_truong_nghia_so_tai",
        "value": 1
      }
    ],
    "exclusiveGroups": [],
    "conflictsWith": [
      "am_hiem_doc_ac",
      "tham_lam_vo_day"
    ],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: prestige; Chưa có producer thành tựu hậu thiên tương ứng trong lõi",
    "unmappedEffectKeys": [
      "prestige"
    ],
    "spawnWeight": 0,
    "traitCost": 8,
    "innateDelta": {},
    "learningAffinity": {},
    "modifiers": [
      {
        "key": "breakthroughChanceBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.1,
        "sourceKey": "breakthrough"
      },
      {
        "key": "mentalEquilibriumBias",
        "mode": "add",
        "unit": "flat",
        "value": 15,
        "sourceKey": "mindStateBonus"
      },
      {
        "key": "mindTrainingBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.02,
        "sourceKey": "daoHeartVector"
      }
    ],
    "effects": [],
    "badge": "🤝",
    "color": "#34d399",
    "category": "experience",
    "conflicts": [
      "am_hiem_doc_ac",
      "tham_lam_vo_day"
    ],
    "statModifiers": {
      "breakthroughChanceBonus": 0.1
    }
  },
  {
    "id": "phuc_trach_tham_hau",
    "name": "Phúc Trạch Thâm Hậu",
    "description": "Tổ tiên tích đức, gặp dữ hóa lành, đi dạo cũng nhặt được linh thảo bảo vật.",
    "sourceDescription": "Tổ tiên tích đức, gặp dữ hóa lành, đi dạo cũng nhặt được linh thảo bảo vật.",
    "sourceVectorText": "Đạo tâm +6; Khí vận +25",
    "sourceEffectsText": "breakthrough: +18%, lifespan: +80, alchemy: +15%",
    "tier": 3,
    "dimension": "social",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [
      "van_rui_deo_bam"
    ],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: alchemy",
    "unmappedEffectKeys": [
      "alchemy"
    ],
    "spawnWeight": 0,
    "traitCost": 18,
    "innateDelta": {},
    "learningAffinity": {},
    "modifiers": [
      {
        "key": "breakthroughChanceBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.18,
        "sourceKey": "breakthrough"
      },
      {
        "key": "lifespanYears",
        "mode": "add",
        "unit": "years",
        "value": 80,
        "sourceKey": "lifespan"
      },
      {
        "key": "mindTrainingBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.03,
        "sourceKey": "daoHeartVector"
      }
    ],
    "effects": [],
    "badge": "🧧",
    "color": "#a78bfa",
    "category": "innate",
    "conflicts": [
      "van_rui_deo_bam"
    ],
    "statModifiers": {
      "breakthroughChanceBonus": 0.18,
      "lifespanBonus": 80
    }
  },
  {
    "id": "lanh_tu_quan_luan",
    "name": "Khí Chất Lãnh Tụ",
    "description": "Phong thái uy nghiêm bẩm sinh, lời nói có trọng lượng, thu phục lòng người dễ dàng.",
    "sourceDescription": "Phong thái uy nghiêm bẩm sinh, lời nói có trọng lượng, thu phục lòng người dễ dàng.",
    "sourceVectorText": "Ngộ +2; Chiến +2; Đạo tâm +6",
    "sourceEffectsText": "prestige: +50, comprehension: x1.3, atk: x1.2, willpowerBonus: +20",
    "tier": 3,
    "dimension": "social",
    "origin": "acquired",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [
      {
        "kind": "achievement",
        "key": "achieve_lanh_tu_quan_luan",
        "value": 1
      }
    ],
    "exclusiveGroups": [],
    "conflictsWith": [
      "doc_lai_doc_vang",
      "khac_the_khac_tu"
    ],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: prestige; Chưa có producer thành tựu hậu thiên tương ứng trong lõi",
    "unmappedEffectKeys": [
      "prestige"
    ],
    "spawnWeight": 0,
    "traitCost": 18,
    "innateDelta": {},
    "learningAffinity": {
      "combat": 2
    },
    "modifiers": [
      {
        "key": "techniqueLearningFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.3,
        "sourceKey": "comprehension"
      },
      {
        "key": "attackFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.2,
        "sourceKey": "atk"
      },
      {
        "key": "willTrainingBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.1,
        "sourceKey": "willpowerBonus"
      },
      {
        "key": "mindTrainingBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.03,
        "sourceKey": "daoHeartVector"
      }
    ],
    "effects": [],
    "badge": "👑",
    "color": "#a78bfa",
    "category": "experience",
    "conflicts": [
      "doc_lai_doc_vang",
      "khac_the_khac_tu"
    ],
    "statModifiers": {
      "comprehensionMultiplier": 1.3,
      "combatPowerMultiplier": 1.2
    }
  },
  {
    "id": "bach_nhan_chi_thuong",
    "name": "Bách Nhân Chi Thượng",
    "description": "Khí độ tôn quý vượt trội đám đông, đi tới đâu cũng tạo dựng uy danh lớn.",
    "sourceDescription": "Khí độ tôn quý vượt trội đám đông, đi tới đâu cũng tạo dựng uy danh lớn.",
    "sourceVectorText": "Linh +2; Đạo tâm +6",
    "sourceEffectsText": "prestige: +40, qiRate: x1.25, def: +12",
    "tier": 3,
    "dimension": "social",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: prestige",
    "unmappedEffectKeys": [
      "prestige"
    ],
    "spawnWeight": 0,
    "traitCost": 18,
    "innateDelta": {
      "aptitude": 1
    },
    "learningAffinity": {},
    "modifiers": [
      {
        "key": "qiRateFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.25,
        "sourceKey": "qiRate"
      },
      {
        "key": "defenseFlat",
        "mode": "add",
        "unit": "flat",
        "value": 12,
        "sourceKey": "def"
      },
      {
        "key": "mindTrainingBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.03,
        "sourceKey": "daoHeartVector"
      }
    ],
    "effects": [],
    "badge": "🍀",
    "color": "#a78bfa",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "qiAbsorptionMultiplier": 1.25,
      "defenseBonus": 12
    }
  },
  {
    "id": "khi_van_chi_tu",
    "name": "Khí Vận Chi Tử",
    "description": "Con cưng của Thiên Đạo, rơi xuống vực thẳm cũng nhặt được bí tịch tuyệt thế.",
    "sourceDescription": "Con cưng của Thiên Đạo, rơi xuống vực thẳm cũng nhặt được bí tịch tuyệt thế.",
    "sourceVectorText": "Linh +3; Đạo tâm +9; Khí vận +45",
    "sourceEffectsText": "breakthrough: +28%, alchemy: +25%, dodge: +18%, qiRate: x1.35, fortune: +45",
    "tier": 4,
    "dimension": "social",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [
      "destiny_major"
    ],
    "conflictsWith": [
      "van_rui_deo_bam"
    ],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: alchemy, fortune",
    "unmappedEffectKeys": [
      "alchemy",
      "fortune"
    ],
    "spawnWeight": 0,
    "traitCost": 35,
    "innateDelta": {
      "aptitude": 1.5
    },
    "learningAffinity": {},
    "modifiers": [
      {
        "key": "breakthroughChanceBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.28,
        "sourceKey": "breakthrough"
      },
      {
        "key": "dodgeChanceBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.18,
        "sourceKey": "dodge"
      },
      {
        "key": "qiRateFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.35,
        "sourceKey": "qiRate"
      },
      {
        "key": "mindTrainingBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.045,
        "sourceKey": "daoHeartVector"
      }
    ],
    "effects": [],
    "badge": "🍀",
    "color": "#fbbf24",
    "category": "innate",
    "conflicts": [
      "van_rui_deo_bam"
    ],
    "statModifiers": {
      "breakthroughChanceBonus": 0.28,
      "dodgeRateBonus": 0.18,
      "qiAbsorptionMultiplier": 1.35
    }
  },
  {
    "id": "thien_dao_quyen_co",
    "name": "Thiên Đạo Quyến Cố",
    "description": "Khí vận tử kim bao phủ đỉnh đầu, thiên kiếp giáng xuống cũng nhẹ đi ba phần.",
    "sourceDescription": "Khí vận tử kim bao phủ đỉnh đầu, thiên kiếp giáng xuống cũng nhẹ đi ba phần.",
    "sourceVectorText": "Linh +4; Đạo tâm +9; Khí vận +55",
    "sourceEffectsText": "breakthrough: +25%, qiRate: x1.55, lifespan: +150, heartDemonResistance: +28%, fortune: +55",
    "tier": 4,
    "dimension": "social",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [
      "destiny_major"
    ],
    "conflictsWith": [],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: heartDemonResistance, fortune",
    "unmappedEffectKeys": [
      "heartDemonResistance",
      "fortune"
    ],
    "spawnWeight": 0,
    "traitCost": 35,
    "innateDelta": {
      "aptitude": 2
    },
    "learningAffinity": {},
    "modifiers": [
      {
        "key": "breakthroughChanceBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.25,
        "sourceKey": "breakthrough"
      },
      {
        "key": "qiRateFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.55,
        "sourceKey": "qiRate"
      },
      {
        "key": "lifespanYears",
        "mode": "add",
        "unit": "years",
        "value": 150,
        "sourceKey": "lifespan"
      },
      {
        "key": "mindTrainingBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.045,
        "sourceKey": "daoHeartVector"
      }
    ],
    "effects": [],
    "badge": "🍀",
    "color": "#fbbf24",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "breakthroughChanceBonus": 0.25,
      "qiAbsorptionMultiplier": 1.55,
      "lifespanBonus": 150
    }
  },
  {
    "id": "dai_dao_chi_tu",
    "name": "Đại Đạo Chi Tử",
    "description": "Chân mệnh thiên tử của cả kỷ nguyên, hội tụ khí vận toàn giới, vạn sự tất thành.",
    "sourceDescription": "Chân mệnh thiên tử của cả kỷ nguyên, hội tụ khí vận toàn giới, vạn sự tất thành.",
    "sourceVectorText": "Linh +7; Ngộ +6; Đạo tâm +13; Khí vận +90",
    "sourceEffectsText": "breakthrough: +30%, qiRate: x1.85, comprehension: x1.70, alchemy: +35%, dodge: +22%, prestige: +80, fortune: +90",
    "tier": 5,
    "dimension": "social",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [
      "destiny_major"
    ],
    "conflictsWith": [],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: alchemy, prestige, fortune",
    "unmappedEffectKeys": [
      "alchemy",
      "prestige",
      "fortune"
    ],
    "spawnWeight": 0,
    "traitCost": 60,
    "innateDelta": {
      "comprehension": 3,
      "aptitude": 3.5
    },
    "learningAffinity": {},
    "modifiers": [
      {
        "key": "breakthroughChanceBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.3,
        "sourceKey": "breakthrough"
      },
      {
        "key": "qiRateFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.85,
        "sourceKey": "qiRate"
      },
      {
        "key": "techniqueLearningFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.7,
        "sourceKey": "comprehension"
      },
      {
        "key": "dodgeChanceBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.22,
        "sourceKey": "dodge"
      },
      {
        "key": "mindTrainingBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.065,
        "sourceKey": "daoHeartVector"
      }
    ],
    "effects": [],
    "badge": "🍀",
    "color": "#fb7185",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "breakthroughChanceBonus": 0.3,
      "qiAbsorptionMultiplier": 1.85,
      "comprehensionMultiplier": 1.7,
      "dodgeRateBonus": 0.22
    }
  },
  {
    "id": "the_han_so_lanh",
    "name": "Thể Hàn Sợ Lạnh",
    "description": "Cơ thể nhiễm hàn khí từ nhỏ, sức khỏe suy giảm và tay chân cứng đờ khi trời lạnh.",
    "sourceDescription": "Cơ thể nhiễm hàn khí từ nhỏ, sức khỏe suy giảm và tay chân cứng đờ khi trời lạnh.",
    "sourceVectorText": "Thể -1; Đạo tâm +2",
    "sourceEffectsText": "hp: x0.85, moveSpeed: x0.9",
    "tier": 1,
    "dimension": "survival",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [
      "thich_ung_bang_tuyet",
      "thuan_duong_chi_the"
    ],
    "implementation": "active",
    "spawnWeight": 1,
    "traitCost": 3,
    "innateDelta": {
      "physique": -0.5
    },
    "learningAffinity": {},
    "modifiers": [
      {
        "key": "healthFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 0.85,
        "sourceKey": "hp"
      },
      {
        "key": "moveSpeedFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 0.9,
        "sourceKey": "moveSpeed"
      },
      {
        "key": "mindTrainingBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.01,
        "sourceKey": "daoHeartVector"
      }
    ],
    "effects": [],
    "badge": "🥶",
    "color": "#94a3b8",
    "category": "innate",
    "conflicts": [
      "thich_ung_bang_tuyet",
      "thuan_duong_chi_the"
    ],
    "statModifiers": {
      "healthMultiplier": 0.85,
      "moveSpeedMultiplier": 0.9
    }
  },
  {
    "id": "ngu_say_ngan_nam",
    "name": "Thụy Mộng Tiên Du",
    "description": "Ham ngủ lười vận động, nhưng trong lúc ngủ say linh khí vẫn tự động vận chuyển.",
    "sourceDescription": "Ham ngủ lười vận động, nhưng trong lúc ngủ say linh khí vẫn tự động vận chuyển.",
    "sourceVectorText": "Linh +1; Thể +3; Nghệ -8; Đạo tâm +2",
    "sourceEffectsText": "qiRate: x1.15, moveSpeed: x0.8, craftingSpeed: x0.7, mindStateBonus: +10",
    "tier": 1,
    "dimension": "survival",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "active",
    "spawnWeight": 1,
    "traitCost": 3,
    "innateDelta": {
      "aptitude": 0.5,
      "physique": 1.5
    },
    "learningAffinity": {
      "profession": -8
    },
    "modifiers": [
      {
        "key": "qiRateFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.15,
        "sourceKey": "qiRate"
      },
      {
        "key": "moveSpeedFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 0.8,
        "sourceKey": "moveSpeed"
      },
      {
        "key": "workSpeedFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 0.7,
        "sourceKey": "craftingSpeed"
      },
      {
        "key": "mentalEquilibriumBias",
        "mode": "add",
        "unit": "flat",
        "value": 10,
        "sourceKey": "mindStateBonus"
      },
      {
        "key": "mindTrainingBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.01,
        "sourceKey": "daoHeartVector"
      }
    ],
    "effects": [],
    "badge": "💤",
    "color": "#94a3b8",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "qiAbsorptionMultiplier": 1.15,
      "moveSpeedMultiplier": 0.8,
      "craftingSpeedMultiplier": 0.7
    }
  },
  {
    "id": "da_day_khong_day",
    "name": "Dạ Dày Không Đáy",
    "description": "Ăn uống tốn gấp rưỡi người thường nhưng bù lại khí huyết dồi dào.",
    "sourceDescription": "Ăn uống tốn gấp rưỡi người thường nhưng bù lại khí huyết dồi dào.",
    "sourceVectorText": "Thể +4; Đạo tâm +2",
    "sourceEffectsText": "hungerRate: x1.15, hp: x1.15, physique: +4",
    "tier": 1,
    "dimension": "survival",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "active",
    "spawnWeight": 1,
    "traitCost": 3,
    "innateDelta": {
      "physique": 2
    },
    "learningAffinity": {},
    "modifiers": [
      {
        "key": "hungerRateFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.15,
        "sourceKey": "hungerRate"
      },
      {
        "key": "healthFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.15,
        "sourceKey": "hp"
      },
      {
        "key": "legacyPhysiqueFlat",
        "mode": "add",
        "unit": "flat",
        "value": 4,
        "sourceKey": "physique"
      },
      {
        "key": "mindTrainingBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.01,
        "sourceKey": "daoHeartVector"
      }
    ],
    "effects": [],
    "badge": "🍖",
    "color": "#94a3b8",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "hungerRateMultiplier": 1.15,
      "healthMultiplier": 1.15,
      "physiqueBonus": 4
    }
  },
  {
    "id": "cu_dem_da_tinh",
    "name": "Dạ Hành Giả",
    "description": "Tinh thần cực kỳ tỉnh táo và linh hoạt vào ban đêm, giỏi săn bắn và tập kích.",
    "sourceDescription": "Tinh thần cực kỳ tỉnh táo và linh hoạt vào ban đêm, giỏi săn bắn và tập kích.",
    "sourceVectorText": "Thể +7; Đạo tâm +3",
    "sourceEffectsText": "moveSpeed: x1.2, dodge: +12%, crit: +10%",
    "tier": 2,
    "dimension": "survival",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "active",
    "spawnWeight": 1,
    "traitCost": 8,
    "innateDelta": {
      "physique": 3.5
    },
    "learningAffinity": {},
    "modifiers": [
      {
        "key": "moveSpeedFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.2,
        "sourceKey": "moveSpeed"
      },
      {
        "key": "dodgeChanceBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.12,
        "sourceKey": "dodge"
      },
      {
        "key": "critChanceBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.1,
        "sourceKey": "crit"
      },
      {
        "key": "mindTrainingBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.015,
        "sourceKey": "daoHeartVector"
      }
    ],
    "effects": [],
    "badge": "🦉",
    "color": "#34d399",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "moveSpeedMultiplier": 1.2,
      "dodgeRateBonus": 0.12,
      "critRateBonus": 0.1
    }
  },
  {
    "id": "thich_ung_bang_tuyet",
    "name": "Hàn Băng Bất Xâm",
    "description": "Cơ thể thích nghi hoàn hảo với giá rét, da thịt săn chắc chống chịu tốt.",
    "sourceDescription": "Cơ thể thích nghi hoàn hảo với giá rét, da thịt săn chắc chống chịu tốt.",
    "sourceVectorText": "Thể +8; Đạo tâm +3",
    "sourceEffectsText": "def: +10, hp: x1.15",
    "tier": 2,
    "dimension": "survival",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [
      "the_han_so_lanh"
    ],
    "implementation": "active",
    "spawnWeight": 1,
    "traitCost": 8,
    "innateDelta": {
      "physique": 4
    },
    "learningAffinity": {},
    "modifiers": [
      {
        "key": "defenseFlat",
        "mode": "add",
        "unit": "flat",
        "value": 10,
        "sourceKey": "def"
      },
      {
        "key": "healthFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.15,
        "sourceKey": "hp"
      },
      {
        "key": "mindTrainingBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.015,
        "sourceKey": "daoHeartVector"
      }
    ],
    "effects": [],
    "badge": "🌨️",
    "color": "#34d399",
    "category": "innate",
    "conflicts": [
      "the_han_so_lanh"
    ],
    "statModifiers": {
      "defenseBonus": 10,
      "healthMultiplier": 1.15
    }
  },
  {
    "id": "hoa_nhiet_bat_xam",
    "name": "Vạn Hỏa Bất Xâm",
    "description": "Không sợ nắng nóng hay lửa đốt, rất thích hợp canh giữ lò đan hoặc lò rèn.",
    "sourceDescription": "Không sợ nắng nóng hay lửa đốt, rất thích hợp canh giữ lò đan hoặc lò rèn.",
    "sourceVectorText": "Thể +7; Đạo tâm +3",
    "sourceEffectsText": "armor: +12, alchemy: +15%",
    "tier": 2,
    "dimension": "survival",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [
      "cuu_am_tuyet_mach"
    ],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: alchemy",
    "unmappedEffectKeys": [
      "alchemy"
    ],
    "spawnWeight": 0,
    "traitCost": 8,
    "innateDelta": {
      "physique": 3.5
    },
    "learningAffinity": {},
    "modifiers": [
      {
        "key": "armorFlat",
        "mode": "add",
        "unit": "flat",
        "value": 12,
        "sourceKey": "armor"
      },
      {
        "key": "mindTrainingBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.015,
        "sourceKey": "daoHeartVector"
      }
    ],
    "effects": [],
    "badge": "🌋",
    "color": "#34d399",
    "category": "innate",
    "conflicts": [
      "cuu_am_tuyet_mach"
    ],
    "statModifiers": {
      "armorBonus": 12
    }
  },
  {
    "id": "thinh_giac_nhay_ben",
    "name": "Thính Giác Nhạy Bén",
    "description": "Nghe được tiếng lá rơi và nhịp tim kẻ địch từ khoảng cách hàng dặm.",
    "sourceDescription": "Nghe được tiếng lá rơi và nhịp tim kẻ địch từ khoảng cách hàng dặm.",
    "sourceVectorText": "Thể +7; Đạo tâm +3",
    "sourceEffectsText": "dodge: +14%, crit: +8%",
    "tier": 2,
    "dimension": "survival",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "active",
    "spawnWeight": 1,
    "traitCost": 8,
    "innateDelta": {
      "physique": 3.5
    },
    "learningAffinity": {},
    "modifiers": [
      {
        "key": "dodgeChanceBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.14,
        "sourceKey": "dodge"
      },
      {
        "key": "critChanceBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.08,
        "sourceKey": "crit"
      },
      {
        "key": "mindTrainingBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.015,
        "sourceKey": "daoHeartVector"
      }
    ],
    "effects": [],
    "badge": "🍖",
    "color": "#34d399",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "dodgeRateBonus": 0.14,
      "critRateBonus": 0.08
    }
  },
  {
    "id": "thien_ly_nhan",
    "name": "Thiên Lý Nhãn",
    "description": "Đôi mắt tinh tường nhìn xa vạn dặm, phát hiện linh thảo và con mồi từ rất sớm.",
    "sourceDescription": "Đôi mắt tinh tường nhìn xa vạn dặm, phát hiện linh thảo và con mồi từ rất sớm.",
    "sourceVectorText": "Thể +7; Đạo tâm +3",
    "sourceEffectsText": "crit: +12%, dodge: +10%, moveSpeed: x1.15",
    "tier": 2,
    "dimension": "survival",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "active",
    "spawnWeight": 1,
    "traitCost": 8,
    "innateDelta": {
      "physique": 3.5
    },
    "learningAffinity": {},
    "modifiers": [
      {
        "key": "critChanceBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.12,
        "sourceKey": "crit"
      },
      {
        "key": "dodgeChanceBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.1,
        "sourceKey": "dodge"
      },
      {
        "key": "moveSpeedFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.15,
        "sourceKey": "moveSpeed"
      },
      {
        "key": "mindTrainingBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.015,
        "sourceKey": "daoHeartVector"
      }
    ],
    "effects": [],
    "badge": "👀",
    "color": "#34d399",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "critRateBonus": 0.12,
      "dodgeRateBonus": 0.1,
      "moveSpeedMultiplier": 1.15
    }
  },
  {
    "id": "tich_coc_tien_the",
    "name": "Tích Cốc Tiên Thể",
    "description": "Cơ thể tự hấp thu linh khí thay cho ngũ cốc, gần như không cần ăn uống.",
    "sourceDescription": "Cơ thể tự hấp thu linh khí thay cho ngũ cốc, gần như không cần ăn uống.",
    "sourceVectorText": "Linh +3; Thể +11; Đạo tâm +5",
    "sourceEffectsText": "hungerRate: x0.55, thirstRate: x0.55, qiRate: x1.35",
    "tier": 3,
    "dimension": "survival",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [
      "thuc_than_thao_thiet"
    ],
    "implementation": "active",
    "spawnWeight": 1,
    "traitCost": 18,
    "innateDelta": {
      "aptitude": 1.5,
      "physique": 5.5
    },
    "learningAffinity": {},
    "modifiers": [
      {
        "key": "hungerRateFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 0.55,
        "sourceKey": "hungerRate"
      },
      {
        "key": "thirstRateFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 0.55,
        "sourceKey": "thirstRate"
      },
      {
        "key": "qiRateFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.35,
        "sourceKey": "qiRate"
      },
      {
        "key": "mindTrainingBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.025,
        "sourceKey": "daoHeartVector"
      }
    ],
    "effects": [],
    "badge": "🧘",
    "color": "#a78bfa",
    "category": "innate",
    "conflicts": [
      "thuc_than_thao_thiet"
    ],
    "statModifiers": {
      "hungerRateMultiplier": 0.55,
      "thirstRateMultiplier": 0.55,
      "qiAbsorptionMultiplier": 1.35
    }
  },
  {
    "id": "tho_ty_nam_son",
    "name": "Thọ Tỷ Nam Sơn",
    "description": "Sinh mệnh lực bền bỉ như tùng bách trên núi cao, sống lâu gấp bội người cùng cảnh giới.",
    "sourceDescription": "Sinh mệnh lực bền bỉ như tùng bách trên núi cao, sống lâu gấp bội người cùng cảnh giới.",
    "sourceVectorText": "Thể +13; Đạo tâm +5",
    "sourceEffectsText": "lifespan: +220, hp: x1.2",
    "tier": 3,
    "dimension": "survival",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [
      "doan_menh_chi_tuong"
    ],
    "implementation": "active",
    "spawnWeight": 1,
    "traitCost": 18,
    "innateDelta": {
      "physique": 6.5
    },
    "learningAffinity": {},
    "modifiers": [
      {
        "key": "lifespanYears",
        "mode": "add",
        "unit": "years",
        "value": 220,
        "sourceKey": "lifespan"
      },
      {
        "key": "healthFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.2,
        "sourceKey": "hp"
      },
      {
        "key": "mindTrainingBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.025,
        "sourceKey": "daoHeartVector"
      }
    ],
    "effects": [],
    "badge": "🐢",
    "color": "#a78bfa",
    "category": "innate",
    "conflicts": [
      "doan_menh_chi_tuong"
    ],
    "statModifiers": {
      "lifespanBonus": 220,
      "healthMultiplier": 1.2
    }
  },
  {
    "id": "bach_doc_bat_xam",
    "name": "Bách Độc Bất Xâm",
    "description": "Cơ thể kháng lại mọi loại kịch độc và chướng khí, máu thịt có thể giải độc.",
    "sourceDescription": "Cơ thể kháng lại mọi loại kịch độc và chướng khí, máu thịt có thể giải độc.",
    "sourceVectorText": "Thể +14; Đạo tâm +5",
    "sourceEffectsText": "hp: x1.35, def: +12, alchemy: +20%",
    "tier": 3,
    "dimension": "survival",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: alchemy",
    "unmappedEffectKeys": [
      "alchemy"
    ],
    "spawnWeight": 0,
    "traitCost": 18,
    "innateDelta": {
      "physique": 7
    },
    "learningAffinity": {},
    "modifiers": [
      {
        "key": "healthFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.35,
        "sourceKey": "hp"
      },
      {
        "key": "defenseFlat",
        "mode": "add",
        "unit": "flat",
        "value": 12,
        "sourceKey": "def"
      },
      {
        "key": "mindTrainingBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.025,
        "sourceKey": "daoHeartVector"
      }
    ],
    "effects": [],
    "badge": "🧪",
    "color": "#a78bfa",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "healthMultiplier": 1.35,
      "defenseBonus": 12
    }
  },
  {
    "id": "phong_loi_bat_dong",
    "name": "Phong Lôi Bất Động",
    "description": "Dù bão tố sấm sét ập đến vẫn vững như bàn thạch, chịu đựng nghịch cảnh xuất sắc.",
    "sourceDescription": "Dù bão tố sấm sét ập đến vẫn vững như bàn thạch, chịu đựng nghịch cảnh xuất sắc.",
    "sourceVectorText": "Thể +11; Đạo tâm +5",
    "sourceEffectsText": "def: +18, armor: +18, willpowerBonus: +25",
    "tier": 3,
    "dimension": "survival",
    "origin": "acquired",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [
      {
        "kind": "achievement",
        "key": "tribulation_passed",
        "value": 3
      }
    ],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "active",
    "spawnWeight": 0,
    "traitCost": 18,
    "innateDelta": {},
    "learningAffinity": {},
    "modifiers": [
      {
        "key": "defenseFlat",
        "mode": "add",
        "unit": "flat",
        "value": 18,
        "sourceKey": "def"
      },
      {
        "key": "armorFlat",
        "mode": "add",
        "unit": "flat",
        "value": 18,
        "sourceKey": "armor"
      },
      {
        "key": "willTrainingBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.125,
        "sourceKey": "willpowerBonus"
      },
      {
        "key": "mindTrainingBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.025,
        "sourceKey": "daoHeartVector"
      }
    ],
    "effects": [],
    "badge": "🍖",
    "color": "#a78bfa",
    "category": "experience",
    "conflicts": [],
    "statModifiers": {
      "defenseBonus": 18,
      "armorBonus": 18
    }
  },
  {
    "id": "van_kiep_bat_diet",
    "name": "Vạn Kiếp Bất Diệt",
    "description": "Trải qua muôn vàn tai ương kiếp nạn mà không chết, sinh cơ và ý chí đều đạt cực hạn.",
    "sourceDescription": "Trải qua muôn vàn tai ương kiếp nạn mà không chết, sinh cơ và ý chí đều đạt cực hạn.",
    "sourceVectorText": "Thể +23; Đạo tâm +8",
    "sourceEffectsText": "hp: x1.85, lifespan: +280, def: +28, willpowerBonus: +42, disasterResistance: +25%",
    "tier": 4,
    "dimension": "survival",
    "origin": "acquired",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [
      {
        "kind": "achievement",
        "key": "achieve_van_kiep_bat_diet",
        "value": 1
      }
    ],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: disasterResistance; Chưa có producer thành tựu hậu thiên tương ứng trong lõi",
    "unmappedEffectKeys": [
      "disasterResistance"
    ],
    "spawnWeight": 0,
    "traitCost": 35,
    "innateDelta": {},
    "learningAffinity": {},
    "modifiers": [
      {
        "key": "healthFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.85,
        "sourceKey": "hp"
      },
      {
        "key": "lifespanYears",
        "mode": "add",
        "unit": "years",
        "value": 280,
        "sourceKey": "lifespan"
      },
      {
        "key": "defenseFlat",
        "mode": "add",
        "unit": "flat",
        "value": 28,
        "sourceKey": "def"
      },
      {
        "key": "willTrainingBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.21,
        "sourceKey": "willpowerBonus"
      },
      {
        "key": "mindTrainingBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.04,
        "sourceKey": "daoHeartVector"
      }
    ],
    "effects": [],
    "badge": "🍖",
    "color": "#fbbf24",
    "category": "experience",
    "conflicts": [],
    "statModifiers": {
      "healthMultiplier": 1.85,
      "lifespanBonus": 280,
      "defenseBonus": 28
    }
  },
  {
    "id": "thon_khi_thuc_nhat",
    "name": "Thôn Khí Thực Nhật",
    "description": "Nuốt tinh hoa nhật nguyệt thay cho thức ăn phàm tục, linh lực tự sinh mỗi khắc.",
    "sourceDescription": "Nuốt tinh hoa nhật nguyệt thay cho thức ăn phàm tục, linh lực tự sinh mỗi khắc.",
    "sourceVectorText": "Linh +5; Thể +19; Đạo tâm +8",
    "sourceEffectsText": "hungerRate: x0.08, thirstRate: x0.08, qiRate: x1.65, hp: x1.40",
    "tier": 4,
    "dimension": "survival",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "active",
    "spawnWeight": 1,
    "traitCost": 35,
    "innateDelta": {
      "aptitude": 2.5,
      "physique": 9.5
    },
    "learningAffinity": {},
    "modifiers": [
      {
        "key": "hungerRateFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 0.08,
        "sourceKey": "hungerRate"
      },
      {
        "key": "thirstRateFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 0.08,
        "sourceKey": "thirstRate"
      },
      {
        "key": "qiRateFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.65,
        "sourceKey": "qiRate"
      },
      {
        "key": "healthFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.4,
        "sourceKey": "hp"
      },
      {
        "key": "mindTrainingBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.04,
        "sourceKey": "daoHeartVector"
      }
    ],
    "effects": [],
    "badge": "🍖",
    "color": "#fbbf24",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "hungerRateMultiplier": 0.08,
      "thirstRateMultiplier": 0.08,
      "qiAbsorptionMultiplier": 1.65,
      "healthMultiplier": 1.4
    }
  },
  {
    "id": "truong_sinh_bat_lao",
    "name": "Trường Sinh Bất Lão",
    "description": "Dung mạo và sinh cơ vĩnh viễn dừng ở thời kỳ đỉnh phong, thọ nguyên dài đến tận cùng tuế nguyệt.",
    "sourceDescription": "Dung mạo và sinh cơ vĩnh viễn dừng ở thời kỳ đỉnh phong, thọ nguyên dài đến tận cùng tuế nguyệt.",
    "sourceVectorText": "Linh +5; Thể +32; Đạo tâm +10",
    "sourceEffectsText": "lifespan: +700, hp: x2.10, qiRate: x1.60, mindStateBonus: +38, agingPenalty: x0.20",
    "tier": 5,
    "dimension": "survival",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: agingPenalty",
    "unmappedEffectKeys": [
      "agingPenalty"
    ],
    "spawnWeight": 0,
    "traitCost": 60,
    "innateDelta": {
      "aptitude": 2.5,
      "physique": 16
    },
    "learningAffinity": {},
    "modifiers": [
      {
        "key": "lifespanYears",
        "mode": "add",
        "unit": "years",
        "value": 700,
        "sourceKey": "lifespan"
      },
      {
        "key": "healthFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 2.1,
        "sourceKey": "hp"
      },
      {
        "key": "qiRateFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.6,
        "sourceKey": "qiRate"
      },
      {
        "key": "mentalEquilibriumBias",
        "mode": "add",
        "unit": "flat",
        "value": 20,
        "sourceKey": "mindStateBonus"
      },
      {
        "key": "mindTrainingBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.05,
        "sourceKey": "daoHeartVector"
      }
    ],
    "effects": [],
    "badge": "🍖",
    "color": "#fb7185",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "lifespanBonus": 700,
      "healthMultiplier": 2.1,
      "qiAbsorptionMultiplier": 1.6
    }
  },
  {
    "id": "mu_tit_dan_dao",
    "name": "Nổ Lò Chuyên Nghiệp",
    "description": "Không có chút thiên phú nào với lửa và dược liệu, động vào lò đan là nổ tung.",
    "sourceDescription": "Không có chút thiên phú nào với lửa và dược liệu, động vào lò đan là nổ tung.",
    "sourceVectorText": "Chiến +1; Nghệ +6",
    "sourceEffectsText": "alchemy: -35%, atk: x1.1",
    "tier": 1,
    "dimension": "profession",
    "origin": "acquired",
    "allowedRaces": "all",
    "activation": [
      {
        "kind": "capability",
        "key": "sentient"
      },
      {
        "kind": "capability",
        "key": "canLearnProfession"
      }
    ],
    "acquisition": [
      {
        "kind": "achievement",
        "key": "achieve_mu_tit_dan_dao",
        "value": 1
      }
    ],
    "exclusiveGroups": [],
    "conflictsWith": [
      "dan_dao_tong_su",
      "thao_duoc_tinh_thong"
    ],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: alchemy; Chưa có producer thành tựu hậu thiên tương ứng trong lõi",
    "unmappedEffectKeys": [
      "alchemy"
    ],
    "spawnWeight": 0,
    "traitCost": 3,
    "innateDelta": {},
    "learningAffinity": {
      "combat": 1,
      "profession": -6
    },
    "modifiers": [
      {
        "key": "attackFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.1,
        "sourceKey": "atk"
      }
    ],
    "effects": [],
    "badge": "💥",
    "color": "#94a3b8",
    "category": "profession",
    "conflicts": [
      "dan_dao_tong_su",
      "thao_duoc_tinh_thong"
    ],
    "statModifiers": {
      "combatPowerMultiplier": 1.1
    }
  },
  {
    "id": "vung_ve_luyen_khi",
    "name": "Vụng Về Tay Chân",
    "description": "Đôi tay thô kệch, cầm búa rèn hay xây dựng công trình đều chậm chạp và hay hỏng.",
    "sourceDescription": "Đôi tay thô kệch, cầm búa rèn hay xây dựng công trình đều chậm chạp và hay hỏng.",
    "sourceVectorText": "Nghệ -4",
    "sourceEffectsText": "craftingSpeed: x0.6, alchemy: -20%",
    "tier": 1,
    "dimension": "profession",
    "origin": "acquired",
    "allowedRaces": "all",
    "activation": [
      {
        "kind": "capability",
        "key": "sentient"
      },
      {
        "kind": "capability",
        "key": "canLearnProfession"
      }
    ],
    "acquisition": [
      {
        "kind": "achievement",
        "key": "achieve_vung_ve_luyen_khi",
        "value": 1
      }
    ],
    "exclusiveGroups": [],
    "conflictsWith": [
      "luyen_khi_ky_tai"
    ],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: alchemy; Chưa có producer thành tựu hậu thiên tương ứng trong lõi",
    "unmappedEffectKeys": [
      "alchemy"
    ],
    "spawnWeight": 0,
    "traitCost": 3,
    "innateDelta": {},
    "learningAffinity": {
      "profession": -4
    },
    "modifiers": [
      {
        "key": "workSpeedFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 0.6,
        "sourceKey": "craftingSpeed"
      }
    ],
    "effects": [],
    "badge": "🚫",
    "color": "#94a3b8",
    "category": "profession",
    "conflicts": [
      "luyen_khi_ky_tai"
    ],
    "statModifiers": {
      "craftingSpeedMultiplier": 0.6
    }
  },
  {
    "id": "than_dong_khai_khoang",
    "name": "Thần Đồng Khai Khoáng",
    "description": "Nhìn vân đá trên vách núi là biết bên trong có linh thạch hay quặng quý.",
    "sourceDescription": "Nhìn vân đá trên vách núi là biết bên trong có linh thạch hay quặng quý.",
    "sourceVectorText": "Thể +1; Nghệ +15",
    "sourceEffectsText": "craftingSpeed: x1.35, armor: +10, hp: x1.15",
    "tier": 2,
    "dimension": "profession",
    "origin": "acquired",
    "allowedRaces": "all",
    "activation": [
      {
        "kind": "capability",
        "key": "sentient"
      },
      {
        "kind": "capability",
        "key": "canLearnProfession"
      }
    ],
    "acquisition": [
      {
        "kind": "capability",
        "key": "canLearnProfession"
      },
      {
        "kind": "capability",
        "key": "hasManipulator"
      },
      {
        "kind": "achievement",
        "key": "profession_mine_tier2",
        "value": 30
      }
    ],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "planned",
    "deferredReason": "Chưa có producer sự kiện thành tựu/nghề nghiệp tương ứng trong lõi",
    "spawnWeight": 0,
    "traitCost": 8,
    "innateDelta": {},
    "learningAffinity": {
      "profession": 15
    },
    "modifiers": [
      {
        "key": "workSpeedFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.35,
        "sourceKey": "craftingSpeed"
      },
      {
        "key": "armorFlat",
        "mode": "add",
        "unit": "flat",
        "value": 10,
        "sourceKey": "armor"
      },
      {
        "key": "healthFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.15,
        "sourceKey": "hp"
      }
    ],
    "effects": [],
    "badge": "⛏️",
    "color": "#34d399",
    "category": "profession",
    "conflicts": [],
    "statModifiers": {
      "craftingSpeedMultiplier": 1.35,
      "armorBonus": 10,
      "healthMultiplier": 1.15
    }
  },
  {
    "id": "dau_bep_than_cap",
    "name": "Linh Trù Thần Cấp",
    "description": "Nấu linh thực giữ trọn 10 phần linh khí, giúp bản thân và đồng môn no lâu, tăng tu vi.",
    "sourceDescription": "Nấu linh thực giữ trọn 10 phần linh khí, giúp bản thân và đồng môn no lâu, tăng tu vi.",
    "sourceVectorText": "Linh +1; Thể +2; Nghệ +12",
    "sourceEffectsText": "hungerRate: x0.55, hp: x1.25, qiRate: x1.15",
    "tier": 2,
    "dimension": "profession",
    "origin": "acquired",
    "allowedRaces": "all",
    "activation": [
      {
        "kind": "capability",
        "key": "sentient"
      },
      {
        "kind": "capability",
        "key": "canLearnProfession"
      }
    ],
    "acquisition": [
      {
        "kind": "capability",
        "key": "canLearnProfession"
      },
      {
        "kind": "capability",
        "key": "hasManipulator"
      },
      {
        "kind": "achievement",
        "key": "profession_cook_tier2",
        "value": 30
      }
    ],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "active",
    "spawnWeight": 0,
    "traitCost": 8,
    "innateDelta": {},
    "learningAffinity": {
      "cultivation": 1,
      "profession": 12
    },
    "modifiers": [
      {
        "key": "hungerRateFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 0.55,
        "sourceKey": "hungerRate"
      },
      {
        "key": "healthFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.25,
        "sourceKey": "hp"
      },
      {
        "key": "qiRateFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.15,
        "sourceKey": "qiRate"
      }
    ],
    "effects": [],
    "badge": "🍳",
    "color": "#34d399",
    "category": "profession",
    "conflicts": [],
    "statModifiers": {
      "hungerRateMultiplier": 0.55,
      "healthMultiplier": 1.25,
      "qiAbsorptionMultiplier": 1.15
    }
  },
  {
    "id": "thao_duoc_tinh_thong",
    "name": "Thảo Dược Tinh Thông",
    "description": "Thuộc lòng hàng ngàn loại linh thảo, hái thuốc và sơ chế dược liệu không bao giờ sai sót.",
    "sourceDescription": "Thuộc lòng hàng ngàn loại linh thảo, hái thuốc và sơ chế dược liệu không bao giờ sai sót.",
    "sourceVectorText": "Thể +1; Nghệ +12",
    "sourceEffectsText": "alchemy: +20%, hp: x1.15, lifespan: +30",
    "tier": 2,
    "dimension": "profession",
    "origin": "acquired",
    "allowedRaces": "all",
    "activation": [
      {
        "kind": "capability",
        "key": "sentient"
      },
      {
        "kind": "capability",
        "key": "canLearnProfession"
      }
    ],
    "acquisition": [
      {
        "kind": "achievement",
        "key": "achieve_thao_duoc_tinh_thong",
        "value": 1
      }
    ],
    "exclusiveGroups": [],
    "conflictsWith": [
      "mu_tit_dan_dao"
    ],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: alchemy; Chưa có producer thành tựu hậu thiên tương ứng trong lõi",
    "unmappedEffectKeys": [
      "alchemy"
    ],
    "spawnWeight": 0,
    "traitCost": 8,
    "innateDelta": {},
    "learningAffinity": {
      "profession": 12
    },
    "modifiers": [
      {
        "key": "healthFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.15,
        "sourceKey": "hp"
      },
      {
        "key": "lifespanYears",
        "mode": "add",
        "unit": "years",
        "value": 30,
        "sourceKey": "lifespan"
      }
    ],
    "effects": [],
    "badge": "🌿",
    "color": "#34d399",
    "category": "profession",
    "conflicts": [
      "mu_tit_dan_dao"
    ],
    "statModifiers": {
      "healthMultiplier": 1.15,
      "lifespanBonus": 30
    }
  },
  {
    "id": "kientruc_than_tuong",
    "name": "Kiến Trúc Thần Tượng",
    "description": "Bậc thầy xây dựng cung điện, động phủ và công trình tông môn với tốc độ thần tốc.",
    "sourceDescription": "Bậc thầy xây dựng cung điện, động phủ và công trình tông môn với tốc độ thần tốc.",
    "sourceVectorText": "Nghệ +15",
    "sourceEffectsText": "craftingSpeed: x1.35, def: +8",
    "tier": 2,
    "dimension": "profession",
    "origin": "acquired",
    "allowedRaces": "all",
    "activation": [
      {
        "kind": "capability",
        "key": "sentient"
      },
      {
        "kind": "capability",
        "key": "canLearnProfession"
      }
    ],
    "acquisition": [
      {
        "kind": "capability",
        "key": "canLearnProfession"
      },
      {
        "kind": "capability",
        "key": "hasManipulator"
      },
      {
        "kind": "achievement",
        "key": "profession_build_tier2",
        "value": 30
      }
    ],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "active",
    "spawnWeight": 0,
    "traitCost": 8,
    "innateDelta": {},
    "learningAffinity": {
      "profession": 15
    },
    "modifiers": [
      {
        "key": "workSpeedFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.35,
        "sourceKey": "craftingSpeed"
      },
      {
        "key": "defenseFlat",
        "mode": "add",
        "unit": "flat",
        "value": 8,
        "sourceKey": "def"
      }
    ],
    "effects": [],
    "badge": "🏛️",
    "color": "#34d399",
    "category": "profession",
    "conflicts": [],
    "statModifiers": {
      "craftingSpeedMultiplier": 1.35,
      "defenseBonus": 8
    }
  },
  {
    "id": "thuong_nghiep_ky_tai",
    "name": "Thương Nghiệp Kỳ Tài",
    "description": "Đầu óc tính toán nhạy bén, giỏi giao thương buôn bán mang lại danh tiếng cho tông môn.",
    "sourceDescription": "Đầu óc tính toán nhạy bén, giỏi giao thương buôn bán mang lại danh tiếng cho tông môn.",
    "sourceVectorText": "Ngộ +2; Nghệ +12",
    "sourceEffectsText": "prestige: +25, comprehension: x1.2",
    "tier": 2,
    "dimension": "profession",
    "origin": "acquired",
    "allowedRaces": "all",
    "activation": [
      {
        "kind": "capability",
        "key": "sentient"
      },
      {
        "kind": "capability",
        "key": "canLearnProfession"
      }
    ],
    "acquisition": [
      {
        "kind": "achievement",
        "key": "achieve_thuong_nghiep_ky_tai",
        "value": 1
      }
    ],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: prestige; Chưa có producer thành tựu hậu thiên tương ứng trong lõi",
    "unmappedEffectKeys": [
      "prestige"
    ],
    "spawnWeight": 0,
    "traitCost": 8,
    "innateDelta": {},
    "learningAffinity": {
      "profession": 12
    },
    "modifiers": [
      {
        "key": "techniqueLearningFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.2,
        "sourceKey": "comprehension"
      }
    ],
    "effects": [],
    "badge": "💰",
    "color": "#34d399",
    "category": "profession",
    "conflicts": [],
    "statModifiers": {
      "comprehensionMultiplier": 1.2
    }
  },
  {
    "id": "than_nong_chuyen_the",
    "name": "Thần Nông Chuyển Thế",
    "description": "Bẩm sinh có hơi thở thân thiện với linh thảo, trồng trọt và luyện đan đều đạt hiệu quả cao.",
    "sourceDescription": "Bẩm sinh có hơi thở thân thiện với linh thảo, trồng trọt và luyện đan đều đạt hiệu quả cao.",
    "sourceVectorText": "Nghệ +20",
    "sourceEffectsText": "lifespan: +100, alchemy: +25%, hungerRate: x0.6",
    "tier": 3,
    "dimension": "profession",
    "origin": "reincarnation",
    "allowedRaces": "all",
    "activation": [
      {
        "kind": "capability",
        "key": "sentient"
      },
      {
        "kind": "capability",
        "key": "canLearnProfession"
      }
    ],
    "acquisition": [],
    "exclusiveGroups": [
      "reincarnation"
    ],
    "conflictsWith": [],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: alchemy",
    "unmappedEffectKeys": [
      "alchemy"
    ],
    "spawnWeight": 0,
    "traitCost": 18,
    "innateDelta": {},
    "learningAffinity": {
      "profession": 20
    },
    "modifiers": [
      {
        "key": "lifespanYears",
        "mode": "add",
        "unit": "years",
        "value": 100,
        "sourceKey": "lifespan"
      },
      {
        "key": "hungerRateFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 0.6,
        "sourceKey": "hungerRate"
      }
    ],
    "effects": [],
    "badge": "🌾",
    "color": "#a78bfa",
    "category": "profession",
    "conflicts": [],
    "statModifiers": {
      "lifespanBonus": 100,
      "hungerRateMultiplier": 0.6
    }
  },
  {
    "id": "tran_phap_dai_su",
    "name": "Trận Pháp Đại Sư",
    "description": "Thấu hiểu quy luật vận hành của thiên địa trận văn, mượn thế đất trời để phòng ngự.",
    "sourceDescription": "Thấu hiểu quy luật vận hành của thiên địa trận văn, mượn thế đất trời để phòng ngự.",
    "sourceVectorText": "Ngộ +5; Nghệ +20",
    "sourceEffectsText": "comprehension: x1.6, def: +20, dodge: +15%",
    "tier": 3,
    "dimension": "profession",
    "origin": "acquired",
    "allowedRaces": "all",
    "activation": [
      {
        "kind": "capability",
        "key": "sentient"
      },
      {
        "kind": "capability",
        "key": "canLearnProfession"
      }
    ],
    "acquisition": [
      {
        "kind": "capability",
        "key": "canLearnProfession"
      },
      {
        "kind": "achievement",
        "key": "profession_formation_tier3",
        "value": 150
      }
    ],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "planned",
    "deferredReason": "Chưa có producer sự kiện thành tựu/nghề nghiệp tương ứng trong lõi",
    "spawnWeight": 0,
    "traitCost": 18,
    "innateDelta": {},
    "learningAffinity": {
      "profession": 20
    },
    "modifiers": [
      {
        "key": "techniqueLearningFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.6,
        "sourceKey": "comprehension"
      },
      {
        "key": "defenseFlat",
        "mode": "add",
        "unit": "flat",
        "value": 20,
        "sourceKey": "def"
      },
      {
        "key": "dodgeChanceBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.15,
        "sourceKey": "dodge"
      }
    ],
    "effects": [],
    "badge": "🔯",
    "color": "#a78bfa",
    "category": "profession",
    "conflicts": [],
    "statModifiers": {
      "comprehensionMultiplier": 1.6,
      "defenseBonus": 20,
      "dodgeRateBonus": 0.15
    }
  },
  {
    "id": "phu_luc_tien_thien",
    "name": "Phù Lục Tiên Thiên",
    "description": "Họa phù nhanh như chớp giật, mỗi nét bút đều dẫn động thiên địa linh lực công kích địch.",
    "sourceDescription": "Họa phù nhanh như chớp giật, mỗi nét bút đều dẫn động thiên địa linh lực công kích địch.",
    "sourceVectorText": "Ngộ +3; Chiến +3; Nghệ +20",
    "sourceEffectsText": "atk: x1.35, comprehension: x1.4, moveSpeed: x1.15",
    "tier": 3,
    "dimension": "profession",
    "origin": "acquired",
    "allowedRaces": "all",
    "activation": [
      {
        "kind": "capability",
        "key": "sentient"
      },
      {
        "kind": "capability",
        "key": "canLearnProfession"
      }
    ],
    "acquisition": [
      {
        "kind": "capability",
        "key": "canLearnProfession"
      },
      {
        "kind": "achievement",
        "key": "profession_talisman_tier3",
        "value": 150
      }
    ],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "planned",
    "deferredReason": "Chưa có producer sự kiện thành tựu/nghề nghiệp tương ứng trong lõi",
    "spawnWeight": 0,
    "traitCost": 18,
    "innateDelta": {},
    "learningAffinity": {
      "combat": 3,
      "profession": 20
    },
    "modifiers": [
      {
        "key": "attackFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.35,
        "sourceKey": "atk"
      },
      {
        "key": "techniqueLearningFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.4,
        "sourceKey": "comprehension"
      },
      {
        "key": "moveSpeedFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.15,
        "sourceKey": "moveSpeed"
      }
    ],
    "effects": [],
    "badge": "📜",
    "color": "#a78bfa",
    "category": "profession",
    "conflicts": [],
    "statModifiers": {
      "combatPowerMultiplier": 1.35,
      "comprehensionMultiplier": 1.4,
      "moveSpeedMultiplier": 1.15
    }
  },
  {
    "id": "dan_dao_tong_su",
    "name": "Đan Đạo Tông Sư",
    "description": "Cảm nhận dược tính và khống hỏa đạt mức xuất thần nhập hóa, luyện đan bách phát bách trúng.",
    "sourceDescription": "Cảm nhận dược tính và khống hỏa đạt mức xuất thần nhập hóa, luyện đan bách phát bách trúng.",
    "sourceVectorText": "Linh +2; Ngộ +3; Nghệ +30",
    "sourceEffectsText": "alchemy: +50%, comprehension: x1.4, qiRate: x1.2",
    "tier": 4,
    "dimension": "profession",
    "origin": "acquired",
    "allowedRaces": "all",
    "activation": [
      {
        "kind": "capability",
        "key": "sentient"
      },
      {
        "kind": "capability",
        "key": "canLearnProfession"
      }
    ],
    "acquisition": [
      {
        "kind": "achievement",
        "key": "achieve_dan_dao_tong_su",
        "value": 1
      }
    ],
    "exclusiveGroups": [],
    "conflictsWith": [
      "mu_tit_dan_dao"
    ],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: alchemy; Chưa có producer thành tựu hậu thiên tương ứng trong lõi",
    "unmappedEffectKeys": [
      "alchemy"
    ],
    "spawnWeight": 0,
    "traitCost": 35,
    "innateDelta": {},
    "learningAffinity": {
      "cultivation": 2,
      "profession": 30
    },
    "modifiers": [
      {
        "key": "techniqueLearningFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.4,
        "sourceKey": "comprehension"
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
    "badge": "🧪",
    "color": "#fbbf24",
    "category": "profession",
    "conflicts": [
      "mu_tit_dan_dao"
    ],
    "statModifiers": {
      "comprehensionMultiplier": 1.4,
      "qiAbsorptionMultiplier": 1.2
    }
  },
  {
    "id": "luyen_khi_ky_tai",
    "name": "Luyện Khí Kỳ Tài",
    "description": "Đôi tay khéo léo trời phú, rèn đúc pháp bảo thần binh nhanh gấp đôi và uy lực vượt trội.",
    "sourceDescription": "Đôi tay khéo léo trời phú, rèn đúc pháp bảo thần binh nhanh gấp đôi và uy lực vượt trội.",
    "sourceVectorText": "Chiến +2; Nghệ +37",
    "sourceEffectsText": "craftingSpeed: x1.9, atk: x1.3, armor: +15",
    "tier": 4,
    "dimension": "profession",
    "origin": "acquired",
    "allowedRaces": "all",
    "activation": [
      {
        "kind": "capability",
        "key": "sentient"
      },
      {
        "kind": "capability",
        "key": "canLearnProfession"
      }
    ],
    "acquisition": [
      {
        "kind": "capability",
        "key": "canLearnProfession"
      },
      {
        "kind": "capability",
        "key": "hasManipulator"
      },
      {
        "kind": "achievement",
        "key": "profession_craft_tier4",
        "value": 500
      }
    ],
    "exclusiveGroups": [],
    "conflictsWith": [
      "vung_ve_luyen_khi"
    ],
    "implementation": "planned",
    "deferredReason": "Chưa có producer sự kiện thành tựu/nghề nghiệp tương ứng trong lõi",
    "spawnWeight": 0,
    "traitCost": 35,
    "innateDelta": {},
    "learningAffinity": {
      "combat": 2,
      "profession": 37
    },
    "modifiers": [
      {
        "key": "workSpeedFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.9,
        "sourceKey": "craftingSpeed"
      },
      {
        "key": "attackFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.3,
        "sourceKey": "atk"
      },
      {
        "key": "armorFlat",
        "mode": "add",
        "unit": "flat",
        "value": 15,
        "sourceKey": "armor"
      }
    ],
    "effects": [],
    "badge": "🔨",
    "color": "#fbbf24",
    "category": "profession",
    "conflicts": [
      "vung_ve_luyen_khi"
    ],
    "statModifiers": {
      "craftingSpeedMultiplier": 1.9,
      "combatPowerMultiplier": 1.3,
      "armorBonus": 15
    }
  },
  {
    "id": "van_phap_thong_huyen_the",
    "name": "Vạn Pháp Thông Huyền Thể",
    "description": "Đan, Khí, Trận, Phù tứ đại tiên nghệ của Nhân tộc đều tự thông không cần thầy dạy.",
    "sourceDescription": "Đan, Khí, Trận, Phù tứ đại tiên nghệ của Nhân tộc đều tự thông không cần thầy dạy.",
    "sourceVectorText": "Linh +7; Ngộ +10; Nghệ +49",
    "sourceEffectsText": "comprehension: x2.25, alchemy: +55%, craftingSpeed: x1.90, qiRate: x1.90, mindStateBonus: +45, professionLearning: +50%",
    "tier": 5,
    "dimension": "profession",
    "origin": "acquired",
    "allowedRaces": "all",
    "activation": [
      {
        "kind": "capability",
        "key": "sentient"
      },
      {
        "kind": "capability",
        "key": "canLearnProfession"
      }
    ],
    "acquisition": [
      {
        "kind": "achievement",
        "key": "achieve_van_phap_thong_huyen_the",
        "value": 1
      }
    ],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: alchemy, professionLearning; Chưa có producer thành tựu hậu thiên tương ứng trong lõi",
    "unmappedEffectKeys": [
      "alchemy",
      "professionLearning"
    ],
    "spawnWeight": 0,
    "traitCost": 60,
    "innateDelta": {},
    "learningAffinity": {
      "cultivation": 7,
      "profession": 49
    },
    "modifiers": [
      {
        "key": "techniqueLearningFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 2.25,
        "sourceKey": "comprehension"
      },
      {
        "key": "workSpeedFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.9,
        "sourceKey": "craftingSpeed"
      },
      {
        "key": "qiRateFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.9,
        "sourceKey": "qiRate"
      },
      {
        "key": "mentalEquilibriumBias",
        "mode": "add",
        "unit": "flat",
        "value": 20,
        "sourceKey": "mindStateBonus"
      }
    ],
    "effects": [],
    "badge": "🧪",
    "color": "#fb7185",
    "category": "profession",
    "conflicts": [],
    "statModifiers": {
      "comprehensionMultiplier": 2.25,
      "craftingSpeedMultiplier": 1.9,
      "qiAbsorptionMultiplier": 1.9
    }
  },
  {
    "id": "cot_mach_manh_hep",
    "name": "Cốt Mạch Mảnh Hẹp",
    "description": "Kinh cốt nhỏ và kinh mạch chịu tải kém, khó bộc phát sức mạnh nhưng thân pháp nhẹ hơn người thường.",
    "sourceDescription": "Kinh cốt nhỏ và kinh mạch chịu tải kém, khó bộc phát sức mạnh nhưng thân pháp nhẹ hơn người thường.",
    "sourceVectorText": "Thể +3; Chiến -2",
    "sourceEffectsText": "hp: x0.88, atk: x0.90, moveSpeed: x1.08",
    "tier": 1,
    "dimension": "physique",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "active",
    "spawnWeight": 1,
    "traitCost": 3,
    "innateDelta": {
      "physique": 1.5
    },
    "learningAffinity": {
      "combat": -2
    },
    "modifiers": [
      {
        "key": "healthFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 0.88,
        "sourceKey": "hp"
      },
      {
        "key": "attackFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 0.9,
        "sourceKey": "atk"
      },
      {
        "key": "moveSpeedFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.08,
        "sourceKey": "moveSpeed"
      }
    ],
    "effects": [],
    "badge": "🛡️",
    "color": "#94a3b8",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "healthMultiplier": 0.88,
      "combatPowerMultiplier": 0.9,
      "moveSpeedMultiplier": 1.08
    }
  },
  {
    "id": "huyet_khi_nghich_luu",
    "name": "Huyết Khí Nghịch Lưu",
    "description": "Khí huyết vận hành ngược nhịp, dễ hụt hơi khi giao chiến kéo dài nhưng bộc phát ngắn hạn khá mạnh.",
    "sourceDescription": "Khí huyết vận hành ngược nhịp, dễ hụt hơi khi giao chiến kéo dài nhưng bộc phát ngắn hạn khá mạnh.",
    "sourceVectorText": "Thể +4; Chiến +1",
    "sourceEffectsText": "hp: x0.92, atk: x1.12, staminaRecovery: x0.75",
    "tier": 1,
    "dimension": "physique",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: staminaRecovery",
    "unmappedEffectKeys": [
      "staminaRecovery"
    ],
    "spawnWeight": 0,
    "traitCost": 3,
    "innateDelta": {
      "physique": 2
    },
    "learningAffinity": {
      "combat": 1
    },
    "modifiers": [
      {
        "key": "healthFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 0.92,
        "sourceKey": "hp"
      },
      {
        "key": "attackFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.12,
        "sourceKey": "atk"
      }
    ],
    "effects": [],
    "badge": "🛡️",
    "color": "#94a3b8",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "healthMultiplier": 0.92,
      "combatPowerMultiplier": 1.12
    }
  },
  {
    "id": "cot_chat_mat_dac",
    "name": "Cốt Chất Mật Đặc",
    "description": "Xương nặng và đặc hơn bình thường, tăng khả năng chịu lực nhưng giảm đôi chút độ linh hoạt.",
    "sourceDescription": "Xương nặng và đặc hơn bình thường, tăng khả năng chịu lực nhưng giảm đôi chút độ linh hoạt.",
    "sourceVectorText": "Thể +13",
    "sourceEffectsText": "hp: x1.18, def: +10, moveSpeed: x0.94",
    "tier": 2,
    "dimension": "physique",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "active",
    "spawnWeight": 1,
    "traitCost": 8,
    "innateDelta": {
      "physique": 6.5
    },
    "learningAffinity": {},
    "modifiers": [
      {
        "key": "healthFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.18,
        "sourceKey": "hp"
      },
      {
        "key": "defenseFlat",
        "mode": "add",
        "unit": "flat",
        "value": 10,
        "sourceKey": "def"
      },
      {
        "key": "moveSpeedFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 0.94,
        "sourceKey": "moveSpeed"
      }
    ],
    "effects": [],
    "badge": "🛡️",
    "color": "#34d399",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "healthMultiplier": 1.18,
      "defenseBonus": 10,
      "moveSpeedMultiplier": 0.94
    }
  },
  {
    "id": "linh_huyet_du_doi",
    "name": "Linh Huyết Dồi Dào",
    "description": "Máu thịt chứa nhiều linh tính, hồi phục nhanh và hỗ trợ vận hành linh lực.",
    "sourceDescription": "Máu thịt chứa nhiều linh tính, hồi phục nhanh và hỗ trợ vận hành linh lực.",
    "sourceVectorText": "Linh +1; Thể +14",
    "sourceEffectsText": "hp: x1.22, qiRate: x1.18, regeneration: +18%",
    "tier": 2,
    "dimension": "physique",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: regeneration",
    "unmappedEffectKeys": [
      "regeneration"
    ],
    "spawnWeight": 0,
    "traitCost": 8,
    "innateDelta": {
      "aptitude": 0.5,
      "physique": 7
    },
    "learningAffinity": {},
    "modifiers": [
      {
        "key": "healthFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.22,
        "sourceKey": "hp"
      },
      {
        "key": "qiRateFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.18,
        "sourceKey": "qiRate"
      }
    ],
    "effects": [],
    "badge": "🛡️",
    "color": "#34d399",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "healthMultiplier": 1.22,
      "qiAbsorptionMultiplier": 1.18
    }
  },
  {
    "id": "ngoc_cot_linh_co",
    "name": "Ngọc Cốt Linh Cơ",
    "description": "Xương cốt như ngọc, cơ thể ít tạp chất và tương hợp tốt với linh khí tinh thuần.",
    "sourceDescription": "Xương cốt như ngọc, cơ thể ít tạp chất và tương hợp tốt với linh khí tinh thuần.",
    "sourceVectorText": "Linh +2; Thể +24",
    "sourceEffectsText": "hp: x1.45, def: +20, qiRate: x1.30, lifespan: +80",
    "tier": 3,
    "dimension": "physique",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "active",
    "spawnWeight": 1,
    "traitCost": 18,
    "innateDelta": {
      "aptitude": 1,
      "physique": 12
    },
    "learningAffinity": {},
    "modifiers": [
      {
        "key": "healthFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.45,
        "sourceKey": "hp"
      },
      {
        "key": "defenseFlat",
        "mode": "add",
        "unit": "flat",
        "value": 20,
        "sourceKey": "def"
      },
      {
        "key": "qiRateFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.3,
        "sourceKey": "qiRate"
      },
      {
        "key": "lifespanYears",
        "mode": "add",
        "unit": "years",
        "value": 80,
        "sourceKey": "lifespan"
      }
    ],
    "effects": [],
    "badge": "🛡️",
    "color": "#a78bfa",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "healthMultiplier": 1.45,
      "defenseBonus": 20,
      "qiAbsorptionMultiplier": 1.3,
      "lifespanBonus": 80
    }
  },
  {
    "id": "kim_co_ngoc_tuy",
    "name": "Kim Cơ Ngọc Tủy",
    "description": "Gân cốt và tủy cốt đồng thời được cường hóa, thích hợp con đường thể tu lẫn pháp thể song tu.",
    "sourceDescription": "Gân cốt và tủy cốt đồng thời được cường hóa, thích hợp con đường thể tu lẫn pháp thể song tu.",
    "sourceVectorText": "Thể +24; Chiến +3",
    "sourceEffectsText": "hp: x1.50, atk: x1.35, armor: +22, bodyCultivationGain: +22%",
    "tier": 3,
    "dimension": "physique",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: bodyCultivationGain",
    "unmappedEffectKeys": [
      "bodyCultivationGain"
    ],
    "spawnWeight": 0,
    "traitCost": 18,
    "innateDelta": {
      "physique": 12
    },
    "learningAffinity": {
      "combat": 3
    },
    "modifiers": [
      {
        "key": "healthFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.5,
        "sourceKey": "hp"
      },
      {
        "key": "attackFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.35,
        "sourceKey": "atk"
      },
      {
        "key": "armorFlat",
        "mode": "add",
        "unit": "flat",
        "value": 22,
        "sourceKey": "armor"
      }
    ],
    "effects": [],
    "badge": "🛡️",
    "color": "#a78bfa",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "healthMultiplier": 1.5,
      "combatPowerMultiplier": 1.35,
      "armorBonus": 22
    }
  },
  {
    "id": "vo_lau_bao_the",
    "name": "Vô Lậu Bảo Thể",
    "description": "Tinh khí gần như không thất thoát, giảm tiêu hao khi chiến đấu và bế quan dài ngày.",
    "sourceDescription": "Tinh khí gần như không thất thoát, giảm tiêu hao khi chiến đấu và bế quan dài ngày.",
    "sourceVectorText": "Linh +4; Thể +37",
    "sourceEffectsText": "hp: x1.85, qiRate: x1.55, hungerRate: x0.55, thirstRate: x0.55, resourceEfficiency: +30%",
    "tier": 4,
    "dimension": "physique",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [
      "major_physique"
    ],
    "conflictsWith": [],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: resourceEfficiency",
    "unmappedEffectKeys": [
      "resourceEfficiency"
    ],
    "spawnWeight": 0,
    "traitCost": 35,
    "innateDelta": {
      "aptitude": 2,
      "physique": 18.5
    },
    "learningAffinity": {},
    "modifiers": [
      {
        "key": "healthFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.85,
        "sourceKey": "hp"
      },
      {
        "key": "qiRateFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.55,
        "sourceKey": "qiRate"
      },
      {
        "key": "hungerRateFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 0.55,
        "sourceKey": "hungerRate"
      },
      {
        "key": "thirstRateFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 0.55,
        "sourceKey": "thirstRate"
      }
    ],
    "effects": [],
    "badge": "🛡️",
    "color": "#fbbf24",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "healthMultiplier": 1.85,
      "qiAbsorptionMultiplier": 1.55,
      "hungerRateMultiplier": 0.55,
      "thirstRateMultiplier": 0.55
    }
  },
  {
    "id": "hu_khong_phap_than",
    "name": "Hư Không Pháp Thân",
    "description": "Nhục thân có thể chạm vào khe hở không gian trong khoảnh khắc, thiên về né tránh và thoát hiểm.",
    "sourceDescription": "Nhục thân có thể chạm vào khe hở không gian trong khoảnh khắc, thiên về né tránh và thoát hiểm.",
    "sourceVectorText": "Thể +34",
    "sourceEffectsText": "hp: x1.55, moveSpeed: x1.55, dodge: +38%, spaceResistance: +35%",
    "tier": 4,
    "dimension": "physique",
    "origin": "acquired",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [
      {
        "kind": "achievement",
        "key": "achieve_hu_khong_phap_than",
        "value": 1
      }
    ],
    "exclusiveGroups": [
      "major_physique"
    ],
    "conflictsWith": [],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: spaceResistance; Chưa có producer thành tựu hậu thiên tương ứng trong lõi",
    "unmappedEffectKeys": [
      "spaceResistance"
    ],
    "spawnWeight": 0,
    "traitCost": 35,
    "innateDelta": {},
    "learningAffinity": {},
    "modifiers": [
      {
        "key": "healthFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.55,
        "sourceKey": "hp"
      },
      {
        "key": "moveSpeedFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.55,
        "sourceKey": "moveSpeed"
      },
      {
        "key": "dodgeChanceBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.38,
        "sourceKey": "dodge"
      }
    ],
    "effects": [],
    "badge": "🛡️",
    "color": "#fbbf24",
    "category": "experience",
    "conflicts": [],
    "statModifiers": {
      "healthMultiplier": 1.55,
      "moveSpeedMultiplier": 1.55,
      "dodgeRateBonus": 0.38
    }
  },
  {
    "id": "luan_hoi_dao_the",
    "name": "Luân Hồi Đạo Thể",
    "description": "Cơ thể khắc dấu luân hồi, mỗi lần vượt đại kiếp có cơ hội tái cấu trúc căn cơ thay vì chỉ tăng chỉ số thô.",
    "sourceDescription": "Cơ thể khắc dấu luân hồi, mỗi lần vượt đại kiếp có cơ hội tái cấu trúc căn cơ thay vì chỉ tăng chỉ số thô.",
    "sourceVectorText": "Ngộ +7; Thể +52",
    "sourceEffectsText": "hp: x2.20, comprehension: x1.90, breakthrough: +28%, reincarnationGrowth: +45%",
    "tier": 5,
    "dimension": "physique",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [
      "major_physique"
    ],
    "conflictsWith": [],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: reincarnationGrowth",
    "unmappedEffectKeys": [
      "reincarnationGrowth"
    ],
    "spawnWeight": 0,
    "traitCost": 60,
    "innateDelta": {
      "comprehension": 3.5,
      "physique": 26
    },
    "learningAffinity": {},
    "modifiers": [
      {
        "key": "healthFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 2.2,
        "sourceKey": "hp"
      },
      {
        "key": "techniqueLearningFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.9,
        "sourceKey": "comprehension"
      },
      {
        "key": "breakthroughChanceBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.28,
        "sourceKey": "breakthrough"
      }
    ],
    "effects": [],
    "badge": "🛡️",
    "color": "#fb7185",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "healthMultiplier": 2.2,
      "comprehensionMultiplier": 1.9,
      "breakthroughChanceBonus": 0.28
    }
  },
  {
    "id": "tien_thien_vo_cau_thai",
    "name": "Tiên Thiên Vô Cấu Thai",
    "description": "Thân thể gần trạng thái tiên thiên thuần tịnh, độc chướng và tạp khí rất khó lưu lại.",
    "sourceDescription": "Thân thể gần trạng thái tiên thiên thuần tịnh, độc chướng và tạp khí rất khó lưu lại.",
    "sourceVectorText": "Linh +9; Thể +53",
    "sourceEffectsText": "hp: x2.35, qiRate: x2.10, heartDemonResistance: +45%, impurityGain: x0.25, lifespan: +450",
    "tier": 5,
    "dimension": "physique",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [
      "major_physique"
    ],
    "conflictsWith": [],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: heartDemonResistance, impurityGain",
    "unmappedEffectKeys": [
      "heartDemonResistance",
      "impurityGain"
    ],
    "spawnWeight": 0,
    "traitCost": 60,
    "innateDelta": {
      "aptitude": 4.5,
      "physique": 26.5
    },
    "learningAffinity": {},
    "modifiers": [
      {
        "key": "healthFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 2.35,
        "sourceKey": "hp"
      },
      {
        "key": "qiRateFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 2.1,
        "sourceKey": "qiRate"
      },
      {
        "key": "lifespanYears",
        "mode": "add",
        "unit": "years",
        "value": 450,
        "sourceKey": "lifespan"
      }
    ],
    "effects": [],
    "badge": "🛡️",
    "color": "#fb7185",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "healthMultiplier": 2.35,
      "qiAbsorptionMultiplier": 2.1,
      "lifespanBonus": 450
    }
  },
  {
    "id": "kim_linh_can_tinh_thuan",
    "name": "Kim Linh Căn Tinh Thuần",
    "description": "Kim linh căn thuần, thiên về sắc bén, công kích và luyện khí kim thuộc.",
    "sourceDescription": "Kim linh căn thuần, thiên về sắc bén, công kích và luyện khí kim thuộc.",
    "sourceVectorText": "Linh +14; Chiến +1",
    "sourceEffectsText": "qiRate: x1.22, atk: x1.18, metalAffinity: +30%",
    "tier": 2,
    "dimension": "root",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [
      "primary_root"
    ],
    "conflictsWith": [],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: metalAffinity",
    "unmappedEffectKeys": [
      "metalAffinity"
    ],
    "spawnWeight": 0,
    "traitCost": 8,
    "innateDelta": {},
    "primaryRootOverride": {
      "rootType": "true",
      "purity": 65,
      "elements": [
        "kim"
      ],
      "qiRateFactor": 1.22
    },
    "learningAffinity": {
      "combat": 1
    },
    "modifiers": [
      {
        "key": "qiRateFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.22,
        "sourceKey": "qiRate"
      },
      {
        "key": "attackFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.18,
        "sourceKey": "atk"
      }
    ],
    "effects": [],
    "badge": "🌟",
    "color": "#34d399",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "qiAbsorptionMultiplier": 1.22,
      "combatPowerMultiplier": 1.18
    }
  },
  {
    "id": "moc_linh_can_tinh_thuan",
    "name": "Mộc Linh Căn Tinh Thuần",
    "description": "Mộc linh căn thuần, sinh cơ mạnh, hợp linh thực, trị thương và công pháp mộc hệ.",
    "sourceDescription": "Mộc linh căn thuần, sinh cơ mạnh, hợp linh thực, trị thương và công pháp mộc hệ.",
    "sourceVectorText": "Linh +14",
    "sourceEffectsText": "qiRate: x1.22, regeneration: +15%, woodAffinity: +30%",
    "tier": 2,
    "dimension": "root",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [
      "primary_root"
    ],
    "conflictsWith": [],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: regeneration, woodAffinity",
    "unmappedEffectKeys": [
      "regeneration",
      "woodAffinity"
    ],
    "spawnWeight": 0,
    "traitCost": 8,
    "innateDelta": {},
    "primaryRootOverride": {
      "rootType": "true",
      "purity": 65,
      "elements": [
        "moc"
      ],
      "qiRateFactor": 1.22
    },
    "learningAffinity": {},
    "modifiers": [
      {
        "key": "qiRateFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.22,
        "sourceKey": "qiRate"
      }
    ],
    "effects": [],
    "badge": "🌟",
    "color": "#34d399",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "qiAbsorptionMultiplier": 1.22
    }
  },
  {
    "id": "thuy_linh_can_tinh_thuan",
    "name": "Thủy Linh Căn Tinh Thuần",
    "description": "Thủy linh căn thuần, vận khí mềm mại và ổn định, hợp thủ pháp biến hóa dài hơi.",
    "sourceDescription": "Thủy linh căn thuần, vận khí mềm mại và ổn định, hợp thủ pháp biến hóa dài hơi.",
    "sourceVectorText": "Linh +14",
    "sourceEffectsText": "qiRate: x1.22, dodge: +10%, waterAffinity: +30%",
    "tier": 2,
    "dimension": "root",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [
      "primary_root"
    ],
    "conflictsWith": [],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: waterAffinity",
    "unmappedEffectKeys": [
      "waterAffinity"
    ],
    "spawnWeight": 0,
    "traitCost": 8,
    "innateDelta": {},
    "primaryRootOverride": {
      "rootType": "true",
      "purity": 65,
      "elements": [
        "thuy"
      ],
      "qiRateFactor": 1.22
    },
    "learningAffinity": {},
    "modifiers": [
      {
        "key": "qiRateFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.22,
        "sourceKey": "qiRate"
      },
      {
        "key": "dodgeChanceBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.1,
        "sourceKey": "dodge"
      }
    ],
    "effects": [],
    "badge": "🌟",
    "color": "#34d399",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "qiAbsorptionMultiplier": 1.22,
      "dodgeRateBonus": 0.1
    }
  },
  {
    "id": "hoa_linh_can_tinh_thuan",
    "name": "Hỏa Linh Căn Tinh Thuần",
    "description": "Hỏa linh căn thuần, linh lực bộc phát mạnh, thuận lợi cho hỏa pháp và luyện đan.",
    "sourceDescription": "Hỏa linh căn thuần, linh lực bộc phát mạnh, thuận lợi cho hỏa pháp và luyện đan.",
    "sourceVectorText": "Linh +14; Chiến +1",
    "sourceEffectsText": "qiRate: x1.22, atk: x1.18, fireAffinity: +30%, alchemy: +10%",
    "tier": 2,
    "dimension": "root",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [
      "primary_root"
    ],
    "conflictsWith": [],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: fireAffinity, alchemy",
    "unmappedEffectKeys": [
      "fireAffinity",
      "alchemy"
    ],
    "spawnWeight": 0,
    "traitCost": 8,
    "innateDelta": {},
    "primaryRootOverride": {
      "rootType": "true",
      "purity": 65,
      "elements": [
        "hoa"
      ],
      "qiRateFactor": 1.22
    },
    "learningAffinity": {
      "combat": 1
    },
    "modifiers": [
      {
        "key": "qiRateFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.22,
        "sourceKey": "qiRate"
      },
      {
        "key": "attackFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.18,
        "sourceKey": "atk"
      }
    ],
    "effects": [],
    "badge": "🌟",
    "color": "#34d399",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "qiAbsorptionMultiplier": 1.22,
      "combatPowerMultiplier": 1.18
    }
  },
  {
    "id": "tho_linh_can_tinh_thuan",
    "name": "Thổ Linh Căn Tinh Thuần",
    "description": "Thổ linh căn thuần, căn cơ ổn định, phòng thủ và khả năng chịu phản phệ tốt.",
    "sourceDescription": "Thổ linh căn thuần, căn cơ ổn định, phòng thủ và khả năng chịu phản phệ tốt.",
    "sourceVectorText": "Linh +14",
    "sourceEffectsText": "qiRate: x1.20, def: +12, earthAffinity: +30%",
    "tier": 2,
    "dimension": "root",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [
      "primary_root"
    ],
    "conflictsWith": [],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: earthAffinity",
    "unmappedEffectKeys": [
      "earthAffinity"
    ],
    "spawnWeight": 0,
    "traitCost": 8,
    "innateDelta": {},
    "primaryRootOverride": {
      "rootType": "true",
      "purity": 65,
      "elements": [
        "tho"
      ],
      "qiRateFactor": 1.2
    },
    "learningAffinity": {},
    "modifiers": [
      {
        "key": "qiRateFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.2,
        "sourceKey": "qiRate"
      },
      {
        "key": "defenseFlat",
        "mode": "add",
        "unit": "flat",
        "value": 12,
        "sourceKey": "def"
      }
    ],
    "effects": [],
    "badge": "🌟",
    "color": "#34d399",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "qiAbsorptionMultiplier": 1.2,
      "defenseBonus": 12
    }
  },
  {
    "id": "quang_minh_linh_can",
    "name": "Quang Minh Linh Căn",
    "description": "Dị linh căn quang hệ, khắc chế uế khí và có thiên hướng hồi phục, thanh tẩy.",
    "sourceDescription": "Dị linh căn quang hệ, khắc chế uế khí và có thiên hướng hồi phục, thanh tẩy.",
    "sourceVectorText": "Linh +24",
    "sourceEffectsText": "qiRate: x1.45, heartDemonResistance: +25%, lightAffinity: +50%",
    "tier": 3,
    "dimension": "root",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [
      "primary_root"
    ],
    "conflictsWith": [],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: heartDemonResistance, lightAffinity",
    "unmappedEffectKeys": [
      "heartDemonResistance",
      "lightAffinity"
    ],
    "spawnWeight": 0,
    "traitCost": 18,
    "innateDelta": {},
    "primaryRootOverride": {
      "rootType": "earth",
      "purity": 85,
      "elements": [
        "quang"
      ],
      "qiRateFactor": 1.45
    },
    "learningAffinity": {},
    "modifiers": [
      {
        "key": "qiRateFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.45,
        "sourceKey": "qiRate"
      }
    ],
    "effects": [],
    "badge": "🌟",
    "color": "#a78bfa",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "qiAbsorptionMultiplier": 1.45
    }
  },
  {
    "id": "thai_am_linh_can",
    "name": "Thái Âm Linh Căn",
    "description": "Linh căn thiên âm nhưng ổn định hơn Cửu Âm Tuyệt Mạch, mạnh về hàn nguyệt và thần hồn.",
    "sourceDescription": "Linh căn thiên âm nhưng ổn định hơn Cửu Âm Tuyệt Mạch, mạnh về hàn nguyệt và thần hồn.",
    "sourceVectorText": "Linh +24; Ngộ +2",
    "sourceEffectsText": "qiRate: x1.48, comprehension: x1.25, yinAffinity: +50%",
    "tier": 3,
    "dimension": "root",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [
      "primary_root"
    ],
    "conflictsWith": [],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: yinAffinity",
    "unmappedEffectKeys": [
      "yinAffinity"
    ],
    "spawnWeight": 0,
    "traitCost": 18,
    "innateDelta": {
      "comprehension": 1
    },
    "primaryRootOverride": {
      "rootType": "earth",
      "purity": 85,
      "elements": [
        "am"
      ],
      "qiRateFactor": 1.48
    },
    "learningAffinity": {},
    "modifiers": [
      {
        "key": "qiRateFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.48,
        "sourceKey": "qiRate"
      },
      {
        "key": "techniqueLearningFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.25,
        "sourceKey": "comprehension"
      }
    ],
    "effects": [],
    "badge": "🌟",
    "color": "#a78bfa",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "qiAbsorptionMultiplier": 1.48,
      "comprehensionMultiplier": 1.25
    }
  },
  {
    "id": "thai_duong_linh_can",
    "name": "Thái Dương Linh Căn",
    "description": "Linh căn chí dương, bộc phát hỏa dương mạnh và tăng sức sống.",
    "sourceDescription": "Linh căn chí dương, bộc phát hỏa dương mạnh và tăng sức sống.",
    "sourceVectorText": "Linh +24; Thể +2; Chiến +3",
    "sourceEffectsText": "qiRate: x1.48, atk: x1.35, yangAffinity: +50%, hp: x1.20",
    "tier": 3,
    "dimension": "root",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [
      "primary_root"
    ],
    "conflictsWith": [],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: yangAffinity",
    "unmappedEffectKeys": [
      "yangAffinity"
    ],
    "spawnWeight": 0,
    "traitCost": 18,
    "innateDelta": {
      "physique": 1
    },
    "primaryRootOverride": {
      "rootType": "earth",
      "purity": 85,
      "elements": [
        "duong"
      ],
      "qiRateFactor": 1.48
    },
    "learningAffinity": {
      "combat": 3
    },
    "modifiers": [
      {
        "key": "qiRateFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.48,
        "sourceKey": "qiRate"
      },
      {
        "key": "attackFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.35,
        "sourceKey": "atk"
      },
      {
        "key": "healthFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.2,
        "sourceKey": "hp"
      }
    ],
    "effects": [],
    "badge": "🌟",
    "color": "#a78bfa",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "qiAbsorptionMultiplier": 1.48,
      "combatPowerMultiplier": 1.35,
      "healthMultiplier": 1.2
    }
  },
  {
    "id": "hu_khong_linh_can",
    "name": "Hư Không Linh Căn",
    "description": "Linh căn hiếm liên hệ không gian, học thuật dịch chuyển và trận pháp không gian nhanh hơn rõ rệt.",
    "sourceDescription": "Linh căn hiếm liên hệ không gian, học thuật dịch chuyển và trận pháp không gian nhanh hơn rõ rệt.",
    "sourceVectorText": "Linh +36; Ngộ +6",
    "sourceEffectsText": "qiRate: x1.80, comprehension: x1.70, moveSpeed: x1.35, spaceAffinity: +70%",
    "tier": 4,
    "dimension": "root",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [
      "primary_root"
    ],
    "conflictsWith": [],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: spaceAffinity",
    "unmappedEffectKeys": [
      "spaceAffinity"
    ],
    "spawnWeight": 0,
    "traitCost": 35,
    "innateDelta": {
      "comprehension": 3
    },
    "primaryRootOverride": {
      "rootType": "heaven",
      "purity": 100,
      "elements": [
        "khong_gian"
      ],
      "qiRateFactor": 1.8
    },
    "learningAffinity": {},
    "modifiers": [
      {
        "key": "qiRateFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.8,
        "sourceKey": "qiRate"
      },
      {
        "key": "techniqueLearningFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.7,
        "sourceKey": "comprehension"
      },
      {
        "key": "moveSpeedFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.35,
        "sourceKey": "moveSpeed"
      }
    ],
    "effects": [],
    "badge": "🌟",
    "color": "#fbbf24",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "qiAbsorptionMultiplier": 1.8,
      "comprehensionMultiplier": 1.7,
      "moveSpeedMultiplier": 1.35
    }
  },
  {
    "id": "luan_hoi_dao_can",
    "name": "Luân Hồi Đạo Căn",
    "description": "Đạo căn hiếm tương hợp sinh tử và luân hồi; thất bại lớn có thể chuyển hóa thành tích lũy căn cơ.",
    "sourceDescription": "Đạo căn hiếm tương hợp sinh tử và luân hồi; thất bại lớn có thể chuyển hóa thành tích lũy căn cơ.",
    "sourceVectorText": "Linh +52; Ngộ +9",
    "sourceEffectsText": "qiRate: x2.25, comprehension: x2.15, breakthrough: +30%, deathLawAffinity: +75%, failureInsight: +40%",
    "tier": 5,
    "dimension": "root",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [
      "primary_root"
    ],
    "conflictsWith": [],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: deathLawAffinity, failureInsight",
    "unmappedEffectKeys": [
      "deathLawAffinity",
      "failureInsight"
    ],
    "spawnWeight": 0,
    "traitCost": 60,
    "innateDelta": {
      "comprehension": 4.5
    },
    "primaryRootOverride": {
      "rootType": "heaven",
      "purity": 100,
      "elements": [
        "luan_hoi"
      ],
      "qiRateFactor": 2.25
    },
    "learningAffinity": {},
    "modifiers": [
      {
        "key": "qiRateFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 2.25,
        "sourceKey": "qiRate"
      },
      {
        "key": "techniqueLearningFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 2.15,
        "sourceKey": "comprehension"
      },
      {
        "key": "breakthroughChanceBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.3,
        "sourceKey": "breakthrough"
      }
    ],
    "effects": [],
    "badge": "🌟",
    "color": "#fb7185",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "qiAbsorptionMultiplier": 2.25,
      "comprehensionMultiplier": 2.15,
      "breakthroughChanceBonus": 0.3
    }
  },
  {
    "id": "tam_tinh_nong_noi",
    "name": "Tâm Tính Nóng Nảy",
    "description": "Dễ nóng vội trước lợi ích và khi bị khiêu khích, bộc phát nhanh nhưng khó bế quan lâu.",
    "sourceDescription": "Dễ nóng vội trước lợi ích và khi bị khiêu khích, bộc phát nhanh nhưng khó bế quan lâu.",
    "sourceVectorText": "Ngộ +3; Chiến +1; Đạo tâm +4",
    "sourceEffectsText": "atk: x1.10, mindStateBonus: -10, meditationEfficiency: -15%",
    "tier": 1,
    "dimension": "mindset",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: meditationEfficiency",
    "unmappedEffectKeys": [
      "meditationEfficiency"
    ],
    "spawnWeight": 0,
    "traitCost": 3,
    "innateDelta": {},
    "learningAffinity": {
      "combat": 1
    },
    "modifiers": [
      {
        "key": "attackFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.1,
        "sourceKey": "atk"
      },
      {
        "key": "mentalEquilibriumBias",
        "mode": "add",
        "unit": "flat",
        "value": -10,
        "sourceKey": "mindStateBonus"
      }
    ],
    "effects": [],
    "badge": "🧠",
    "color": "#94a3b8",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "combatPowerMultiplier": 1.1
    }
  },
  {
    "id": "tri_nho_mo_ho",
    "name": "Trí Nhớ Mơ Hồ",
    "description": "Khó ghi nhớ kinh văn dài và công thức phức tạp, học kỹ nghệ chậm hơn.",
    "sourceDescription": "Khó ghi nhớ kinh văn dài và công thức phức tạp, học kỹ nghệ chậm hơn.",
    "sourceVectorText": "Ngộ -1; Đạo tâm +4",
    "sourceEffectsText": "comprehension: x0.85, professionLearning: -15%",
    "tier": 1,
    "dimension": "mindset",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: professionLearning",
    "unmappedEffectKeys": [
      "professionLearning"
    ],
    "spawnWeight": 0,
    "traitCost": 3,
    "innateDelta": {
      "comprehension": -0.5
    },
    "learningAffinity": {},
    "modifiers": [
      {
        "key": "techniqueLearningFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 0.85,
        "sourceKey": "comprehension"
      },
      {
        "key": "mindTrainingBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.02,
        "sourceKey": "daoHeartVector"
      }
    ],
    "effects": [],
    "badge": "🧠",
    "color": "#94a3b8",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "comprehensionMultiplier": 0.85
    }
  },
  {
    "id": "hieu_hoc_chuyen_can",
    "name": "Hiếu Học Chuyên Cần",
    "description": "Có thói quen ghi chép, đối chiếu và luyện tập lặp lại, tiến bộ ổn định dù không bộc phát.",
    "sourceDescription": "Có thói quen ghi chép, đối chiếu và luyện tập lặp lại, tiến bộ ổn định dù không bộc phát.",
    "sourceVectorText": "Ngộ +8; Đạo tâm +8",
    "sourceEffectsText": "comprehension: x1.18, professionLearning: +18%, willpowerGrowth: +10%",
    "tier": 2,
    "dimension": "mindset",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: professionLearning",
    "unmappedEffectKeys": [
      "professionLearning"
    ],
    "spawnWeight": 0,
    "traitCost": 8,
    "innateDelta": {
      "comprehension": 4
    },
    "learningAffinity": {},
    "modifiers": [
      {
        "key": "techniqueLearningFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.18,
        "sourceKey": "comprehension"
      },
      {
        "key": "willTrainingBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.1,
        "sourceKey": "willpowerGrowth"
      },
      {
        "key": "mindTrainingBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.04,
        "sourceKey": "daoHeartVector"
      }
    ],
    "effects": [],
    "badge": "🧠",
    "color": "#34d399",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "comprehensionMultiplier": 1.18
    }
  },
  {
    "id": "tam_nhu_chi_thuy",
    "name": "Tâm Như Chỉ Thủy",
    "description": "Cảm xúc ít dao động, dễ duy trì thiền định và hồi phục sau biến cố tinh thần.",
    "sourceDescription": "Cảm xúc ít dao động, dễ duy trì thiền định và hồi phục sau biến cố tinh thần.",
    "sourceVectorText": "Ngộ +7; Đạo tâm +8",
    "sourceEffectsText": "mindStateBonus: +18, mindRecovery: +20%, heartDemonResistance: +15%",
    "tier": 2,
    "dimension": "mindset",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: heartDemonResistance",
    "unmappedEffectKeys": [
      "heartDemonResistance"
    ],
    "spawnWeight": 0,
    "traitCost": 8,
    "innateDelta": {
      "comprehension": 3.5
    },
    "learningAffinity": {},
    "modifiers": [
      {
        "key": "mentalEquilibriumBias",
        "mode": "add",
        "unit": "flat",
        "value": 18,
        "sourceKey": "mindStateBonus"
      },
      {
        "key": "mentalRecoveryBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.2,
        "sourceKey": "mindRecovery"
      },
      {
        "key": "mindTrainingBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.04,
        "sourceKey": "daoHeartVector"
      }
    ],
    "effects": [],
    "badge": "🧠",
    "color": "#34d399",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {}
  },
  {
    "id": "dao_si",
    "name": "Đạo Si",
    "description": "Có thể quên ăn quên ngủ khi nghiên cứu một đạo, học rất sâu nhưng dễ lệch khỏi đời sống xã hội.",
    "sourceDescription": "Có thể quên ăn quên ngủ khi nghiên cứu một đạo, học rất sâu nhưng dễ lệch khỏi đời sống xã hội.",
    "sourceVectorText": "Linh +2; Ngộ +15; Đạo tâm +13",
    "sourceEffectsText": "comprehension: x1.55, qiRate: x1.25, prestige: -8, obsessionGain: +15%",
    "tier": 3,
    "dimension": "mindset",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: prestige, obsessionGain",
    "unmappedEffectKeys": [
      "prestige",
      "obsessionGain"
    ],
    "spawnWeight": 0,
    "traitCost": 18,
    "innateDelta": {
      "comprehension": 7.5,
      "aptitude": 1
    },
    "learningAffinity": {},
    "modifiers": [
      {
        "key": "techniqueLearningFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.55,
        "sourceKey": "comprehension"
      },
      {
        "key": "qiRateFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.25,
        "sourceKey": "qiRate"
      },
      {
        "key": "mindTrainingBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.065,
        "sourceKey": "daoHeartVector"
      }
    ],
    "effects": [],
    "badge": "🧠",
    "color": "#a78bfa",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "comprehensionMultiplier": 1.55,
      "qiAbsorptionMultiplier": 1.25
    }
  },
  {
    "id": "minh_tam_kien_tinh",
    "name": "Minh Tâm Kiến Tính",
    "description": "Nhìn rõ động cơ và chấp niệm của bản thân, giảm mạnh dao động tâm cảnh khi thất bại.",
    "sourceDescription": "Nhìn rõ động cơ và chấp niệm của bản thân, giảm mạnh dao động tâm cảnh khi thất bại.",
    "sourceVectorText": "Ngộ +11; Đạo tâm +13",
    "sourceEffectsText": "mindStateBonus: +28, heartDemonResistance: +30%, breakthrough: +12%",
    "tier": 3,
    "dimension": "mindset",
    "origin": "acquired",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [
      {
        "kind": "achievement",
        "key": "achieve_minh_tam_kien_tinh",
        "value": 1
      }
    ],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: heartDemonResistance; Chưa có producer thành tựu hậu thiên tương ứng trong lõi",
    "unmappedEffectKeys": [
      "heartDemonResistance"
    ],
    "spawnWeight": 0,
    "traitCost": 18,
    "innateDelta": {},
    "learningAffinity": {},
    "modifiers": [
      {
        "key": "mentalEquilibriumBias",
        "mode": "add",
        "unit": "flat",
        "value": 20,
        "sourceKey": "mindStateBonus"
      },
      {
        "key": "breakthroughChanceBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.12,
        "sourceKey": "breakthrough"
      },
      {
        "key": "mindTrainingBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.065,
        "sourceKey": "daoHeartVector"
      }
    ],
    "effects": [],
    "badge": "🧠",
    "color": "#a78bfa",
    "category": "experience",
    "conflicts": [],
    "statModifiers": {
      "breakthroughChanceBonus": 0.12
    }
  },
  {
    "id": "kiem_tam_thong_minh",
    "name": "Kiếm Tâm Thông Minh",
    "description": "Tâm niệm sắc bén, dễ hiểu kiếm ý và phát hiện sơ hở trong chiêu thức.",
    "sourceDescription": "Tâm niệm sắc bén, dễ hiểu kiếm ý và phát hiện sơ hở trong chiêu thức.",
    "sourceVectorText": "Ngộ +23; Đạo tâm +20",
    "sourceEffectsText": "comprehension: x1.85, crit: +28%, swordAffinity: +55%, willpowerBonus: +35",
    "tier": 4,
    "dimension": "mindset",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: swordAffinity",
    "unmappedEffectKeys": [
      "swordAffinity"
    ],
    "spawnWeight": 0,
    "traitCost": 35,
    "innateDelta": {
      "comprehension": 11.5
    },
    "learningAffinity": {},
    "modifiers": [
      {
        "key": "techniqueLearningFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.85,
        "sourceKey": "comprehension"
      },
      {
        "key": "critChanceBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.28,
        "sourceKey": "crit"
      },
      {
        "key": "willTrainingBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.175,
        "sourceKey": "willpowerBonus"
      },
      {
        "key": "mindTrainingBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.1,
        "sourceKey": "daoHeartVector"
      }
    ],
    "effects": [],
    "badge": "🧠",
    "color": "#fbbf24",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "comprehensionMultiplier": 1.85,
      "critRateBonus": 0.28
    }
  },
  {
    "id": "vo_duc_vo_cau",
    "name": "Vô Dục Vô Cầu",
    "description": "Dục vọng vật chất rất thấp, tâm ma khó lợi dụng nhưng động lực tranh đoạt tài nguyên cũng giảm.",
    "sourceDescription": "Dục vọng vật chất rất thấp, tâm ma khó lợi dụng nhưng động lực tranh đoạt tài nguyên cũng giảm.",
    "sourceVectorText": "Ngộ +16; Đạo tâm +20",
    "sourceEffectsText": "mindStateBonus: +42, heartDemonResistance: +55%, prestige: -10, greedWeight: x0.30",
    "tier": 4,
    "dimension": "mindset",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: heartDemonResistance, prestige, greedWeight",
    "unmappedEffectKeys": [
      "heartDemonResistance",
      "prestige",
      "greedWeight"
    ],
    "spawnWeight": 0,
    "traitCost": 35,
    "innateDelta": {
      "comprehension": 8
    },
    "learningAffinity": {},
    "modifiers": [
      {
        "key": "mentalEquilibriumBias",
        "mode": "add",
        "unit": "flat",
        "value": 20,
        "sourceKey": "mindStateBonus"
      },
      {
        "key": "mindTrainingBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.1,
        "sourceKey": "daoHeartVector"
      }
    ],
    "effects": [],
    "badge": "🧠",
    "color": "#fbbf24",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {}
  },
  {
    "id": "vo_nga_dao_tam",
    "name": "Vô Ngã Đạo Tâm",
    "description": "Khi nhập định có thể tạm bỏ chấp niệm bản ngã để lĩnh hội quy luật khách quan của thiên địa.",
    "sourceDescription": "Khi nhập định có thể tạm bỏ chấp niệm bản ngã để lĩnh hội quy luật khách quan của thiên địa.",
    "sourceVectorText": "Ngộ +33; Đạo tâm +27",
    "sourceEffectsText": "comprehension: x2.30, mindStateBonus: +58, heartDemonResistance: +65%, insightEventChance: +35%",
    "tier": 5,
    "dimension": "mindset",
    "origin": "acquired",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [
      {
        "kind": "achievement",
        "key": "achieve_vo_nga_dao_tam",
        "value": 1
      }
    ],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: heartDemonResistance, insightEventChance; Chưa có producer thành tựu hậu thiên tương ứng trong lõi",
    "unmappedEffectKeys": [
      "heartDemonResistance",
      "insightEventChance"
    ],
    "spawnWeight": 0,
    "traitCost": 60,
    "innateDelta": {},
    "learningAffinity": {},
    "modifiers": [
      {
        "key": "techniqueLearningFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 2.3,
        "sourceKey": "comprehension"
      },
      {
        "key": "mentalEquilibriumBias",
        "mode": "add",
        "unit": "flat",
        "value": 20,
        "sourceKey": "mindStateBonus"
      },
      {
        "key": "mindTrainingBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.135,
        "sourceKey": "daoHeartVector"
      }
    ],
    "effects": [],
    "badge": "🧠",
    "color": "#fb7185",
    "category": "experience",
    "conflicts": [],
    "statModifiers": {
      "comprehensionMultiplier": 2.3
    }
  },
  {
    "id": "nhat_niem_thong_thien",
    "name": "Nhất Niệm Thông Thiên",
    "description": "Trong khoảnh khắc cực hạn có thể nối liền nhiều mảnh lĩnh ngộ thành một lần đại đốn ngộ.",
    "sourceDescription": "Trong khoảnh khắc cực hạn có thể nối liền nhiều mảnh lĩnh ngộ thành một lần đại đốn ngộ.",
    "sourceVectorText": "Ngộ +34; Đạo tâm +27",
    "sourceEffectsText": "comprehension: x2.40, breakthrough: +30%, willpowerBonus: +55, greatInsightChance: +30%",
    "tier": 5,
    "dimension": "mindset",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: greatInsightChance",
    "unmappedEffectKeys": [
      "greatInsightChance"
    ],
    "spawnWeight": 0,
    "traitCost": 60,
    "innateDelta": {
      "comprehension": 17
    },
    "learningAffinity": {},
    "modifiers": [
      {
        "key": "techniqueLearningFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 2.4,
        "sourceKey": "comprehension"
      },
      {
        "key": "breakthroughChanceBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.3,
        "sourceKey": "breakthrough"
      },
      {
        "key": "willTrainingBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.25,
        "sourceKey": "willpowerBonus"
      },
      {
        "key": "mindTrainingBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.135,
        "sourceKey": "daoHeartVector"
      }
    ],
    "effects": [],
    "badge": "🧠",
    "color": "#fb7185",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "comprehensionMultiplier": 2.4,
      "breakthroughChanceBonus": 0.3
    }
  },
  {
    "id": "thu_the_qua_muc",
    "name": "Thủ Thế Quá Mức",
    "description": "Quá coi trọng phòng thủ nên bỏ lỡ thời cơ phản kích.",
    "sourceDescription": "Quá coi trọng phòng thủ nên bỏ lỡ thời cơ phản kích.",
    "sourceVectorText": "Chiến +3",
    "sourceEffectsText": "def: +6, atk: x0.88, atkSpeed: x0.90",
    "tier": 1,
    "dimension": "combat",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "active",
    "spawnWeight": 1,
    "traitCost": 3,
    "innateDelta": {},
    "learningAffinity": {
      "combat": 3
    },
    "modifiers": [
      {
        "key": "defenseFlat",
        "mode": "add",
        "unit": "flat",
        "value": 6,
        "sourceKey": "def"
      },
      {
        "key": "attackFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 0.88,
        "sourceKey": "atk"
      },
      {
        "key": "attackSpeedFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 0.9,
        "sourceKey": "atkSpeed"
      }
    ],
    "effects": [],
    "badge": "⚔️",
    "color": "#94a3b8",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "defenseBonus": 6,
      "combatPowerMultiplier": 0.88,
      "attackSpeedMultiplier": 0.9
    }
  },
  {
    "id": "ham_chien_vo_do",
    "name": "Ham Chiến Vô Độ",
    "description": "Thích giao tranh trực diện ngay cả khi không cần thiết, dễ hao tổn thể lực.",
    "sourceDescription": "Thích giao tranh trực diện ngay cả khi không cần thiết, dễ hao tổn thể lực.",
    "sourceVectorText": "Chiến +7",
    "sourceEffectsText": "atk: x1.12, def: -6, staminaCost: +15%",
    "tier": 1,
    "dimension": "combat",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: staminaCost",
    "unmappedEffectKeys": [
      "staminaCost"
    ],
    "spawnWeight": 0,
    "traitCost": 3,
    "innateDelta": {},
    "learningAffinity": {
      "combat": 7
    },
    "modifiers": [
      {
        "key": "attackFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.12,
        "sourceKey": "atk"
      },
      {
        "key": "defenseFlat",
        "mode": "add",
        "unit": "flat",
        "value": -6,
        "sourceKey": "def"
      }
    ],
    "effects": [],
    "badge": "⚔️",
    "color": "#94a3b8",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "combatPowerMultiplier": 1.12,
      "defenseBonus": -6
    }
  },
  {
    "id": "du_dau_thanh_thao",
    "name": "Du Đấu Thành Thạo",
    "description": "Biết giữ khoảng cách và đổi góc đánh liên tục, thích hợp cung, pháp khí và phi kiếm.",
    "sourceDescription": "Biết giữ khoảng cách và đổi góc đánh liên tục, thích hợp cung, pháp khí và phi kiếm.",
    "sourceVectorText": "Chiến +13",
    "sourceEffectsText": "moveSpeed: x1.20, dodge: +14%, atk: x1.12",
    "tier": 2,
    "dimension": "combat",
    "origin": "acquired",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [
      {
        "kind": "achievement",
        "key": "kiting_encounters_won",
        "value": 20
      }
    ],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "planned",
    "deferredReason": "Chưa có producer sự kiện thành tựu tương ứng trong lõi",
    "spawnWeight": 0,
    "traitCost": 8,
    "innateDelta": {},
    "learningAffinity": {
      "combat": 13
    },
    "modifiers": [
      {
        "key": "moveSpeedFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.2,
        "sourceKey": "moveSpeed"
      },
      {
        "key": "dodgeChanceBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.14,
        "sourceKey": "dodge"
      },
      {
        "key": "attackFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.12,
        "sourceKey": "atk"
      }
    ],
    "effects": [],
    "badge": "⚔️",
    "color": "#34d399",
    "category": "experience",
    "conflicts": [],
    "statModifiers": {
      "moveSpeedMultiplier": 1.2,
      "dodgeRateBonus": 0.14,
      "combatPowerMultiplier": 1.12
    }
  },
  {
    "id": "pha_chieu_nhay_ben",
    "name": "Phá Chiêu Nhạy Bén",
    "description": "Quan sát nhịp tấn công đối phương để phản kích đúng lúc.",
    "sourceDescription": "Quan sát nhịp tấn công đối phương để phản kích đúng lúc.",
    "sourceVectorText": "Chiến +12",
    "sourceEffectsText": "crit: +12%, dodge: +12%, counterChance: +15%",
    "tier": 2,
    "dimension": "combat",
    "origin": "acquired",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [
      {
        "kind": "achievement",
        "key": "achieve_pha_chieu_nhay_ben",
        "value": 1
      }
    ],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: counterChance; Chưa có producer thành tựu hậu thiên tương ứng trong lõi",
    "unmappedEffectKeys": [
      "counterChance"
    ],
    "spawnWeight": 0,
    "traitCost": 8,
    "innateDelta": {},
    "learningAffinity": {
      "combat": 12
    },
    "modifiers": [
      {
        "key": "critChanceBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.12,
        "sourceKey": "crit"
      },
      {
        "key": "dodgeChanceBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.12,
        "sourceKey": "dodge"
      }
    ],
    "effects": [],
    "badge": "⚔️",
    "color": "#34d399",
    "category": "experience",
    "conflicts": [],
    "statModifiers": {
      "critRateBonus": 0.12,
      "dodgeRateBonus": 0.12
    }
  },
  {
    "id": "chien_thuat_gia",
    "name": "Chiến Thuật Gia",
    "description": "Giỏi chọn địa hình, phối hợp đội hình và ưu tiên mục tiêu, mạnh hơn rõ trong chiến đấu nhóm.",
    "sourceDescription": "Giỏi chọn địa hình, phối hợp đội hình và ưu tiên mục tiêu, mạnh hơn rõ trong chiến đấu nhóm.",
    "sourceVectorText": "Ngộ +2; Chiến +20",
    "sourceEffectsText": "comprehension: x1.30, squadDamage: +18%, squadDefense: +18%",
    "tier": 3,
    "dimension": "combat",
    "origin": "acquired",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [
      {
        "kind": "achievement",
        "key": "achieve_chien_thuat_gia",
        "value": 1
      }
    ],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: squadDamage, squadDefense; Chưa có producer thành tựu hậu thiên tương ứng trong lõi",
    "unmappedEffectKeys": [
      "squadDamage",
      "squadDefense"
    ],
    "spawnWeight": 0,
    "traitCost": 18,
    "innateDelta": {},
    "learningAffinity": {
      "combat": 20
    },
    "modifiers": [
      {
        "key": "techniqueLearningFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.3,
        "sourceKey": "comprehension"
      }
    ],
    "effects": [],
    "badge": "⚔️",
    "color": "#a78bfa",
    "category": "experience",
    "conflicts": [],
    "statModifiers": {
      "comprehensionMultiplier": 1.3
    }
  },
  {
    "id": "phap_vo_song_tu",
    "name": "Pháp Võ Song Tu",
    "description": "Có khả năng luân chuyển linh lực giữa pháp thuật và cận chiến mà ít bị gián đoạn.",
    "sourceDescription": "Có khả năng luân chuyển linh lực giữa pháp thuật và cận chiến mà ít bị gián đoạn.",
    "sourceVectorText": "Linh +2; Chiến +23",
    "sourceEffectsText": "atk: x1.40, qiRate: x1.28, atkSpeed: x1.22, stanceSwitchCost: x0.55",
    "tier": 3,
    "dimension": "combat",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: stanceSwitchCost",
    "unmappedEffectKeys": [
      "stanceSwitchCost"
    ],
    "spawnWeight": 0,
    "traitCost": 18,
    "innateDelta": {
      "aptitude": 1
    },
    "learningAffinity": {
      "combat": 23
    },
    "modifiers": [
      {
        "key": "attackFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.4,
        "sourceKey": "atk"
      },
      {
        "key": "qiRateFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.28,
        "sourceKey": "qiRate"
      },
      {
        "key": "attackSpeedFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.22,
        "sourceKey": "atkSpeed"
      }
    ],
    "effects": [],
    "badge": "⚔️",
    "color": "#a78bfa",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "combatPowerMultiplier": 1.4,
      "qiAbsorptionMultiplier": 1.28,
      "attackSpeedMultiplier": 1.22
    }
  },
  {
    "id": "nhat_kiem_pha_phap",
    "name": "Nhất Kiếm Phá Pháp",
    "description": "Kiếm ý chuyên phá lớp hộ thể và kết cấu pháp thuật thay vì chỉ tăng sát thương thô.",
    "sourceDescription": "Kiếm ý chuyên phá lớp hộ thể và kết cấu pháp thuật thay vì chỉ tăng sát thương thô.",
    "sourceVectorText": "Chiến +36",
    "sourceEffectsText": "atk: x1.75, crit: +30%, shieldPierce: +35%, swordAffinity: +45%",
    "tier": 4,
    "dimension": "combat",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: shieldPierce, swordAffinity",
    "unmappedEffectKeys": [
      "shieldPierce",
      "swordAffinity"
    ],
    "spawnWeight": 0,
    "traitCost": 35,
    "innateDelta": {},
    "learningAffinity": {
      "combat": 36
    },
    "modifiers": [
      {
        "key": "attackFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.75,
        "sourceKey": "atk"
      },
      {
        "key": "critChanceBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.3,
        "sourceKey": "crit"
      }
    ],
    "effects": [],
    "badge": "⚔️",
    "color": "#fbbf24",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "combatPowerMultiplier": 1.75,
      "critRateBonus": 0.3
    }
  },
  {
    "id": "thien_co_chien_giac",
    "name": "Thiên Cơ Chiến Giác",
    "description": "Cảm nhận được biến đổi chiến trường sớm hơn người khác, đặc biệt mạnh trong né chiêu và chỉ huy.",
    "sourceDescription": "Cảm nhận được biến đổi chiến trường sớm hơn người khác, đặc biệt mạnh trong né chiêu và chỉ huy.",
    "sourceVectorText": "Chiến +30",
    "sourceEffectsText": "dodge: +35%, atkSpeed: x1.30, ambushResistance: +45%, squadInitiative: +30%",
    "tier": 4,
    "dimension": "combat",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: ambushResistance, squadInitiative",
    "unmappedEffectKeys": [
      "ambushResistance",
      "squadInitiative"
    ],
    "spawnWeight": 0,
    "traitCost": 35,
    "innateDelta": {},
    "learningAffinity": {
      "combat": 30
    },
    "modifiers": [
      {
        "key": "dodgeChanceBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.35,
        "sourceKey": "dodge"
      },
      {
        "key": "attackSpeedFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.3,
        "sourceKey": "atkSpeed"
      }
    ],
    "effects": [],
    "badge": "⚔️",
    "color": "#fbbf24",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "dodgeRateBonus": 0.35,
      "attackSpeedMultiplier": 1.3
    }
  },
  {
    "id": "van_phap_chien_than",
    "name": "Vạn Pháp Chiến Thân",
    "description": "Có thể thích nghi nhanh với nhiều loại công pháp chiến đấu và giảm bất lợi khi đổi phong cách.",
    "sourceDescription": "Có thể thích nghi nhanh với nhiều loại công pháp chiến đấu và giảm bất lợi khi đổi phong cách.",
    "sourceVectorText": "Chiến +51",
    "sourceEffectsText": "atk: x2.15, def: +40, techniqueAdaptation: +60%, weaponPenalty: x0.25",
    "tier": 5,
    "dimension": "combat",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: techniqueAdaptation, weaponPenalty",
    "unmappedEffectKeys": [
      "techniqueAdaptation",
      "weaponPenalty"
    ],
    "spawnWeight": 0,
    "traitCost": 60,
    "innateDelta": {},
    "learningAffinity": {
      "combat": 51
    },
    "modifiers": [
      {
        "key": "attackFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 2.15,
        "sourceKey": "atk"
      },
      {
        "key": "defenseFlat",
        "mode": "add",
        "unit": "flat",
        "value": 40,
        "sourceKey": "def"
      }
    ],
    "effects": [],
    "badge": "⚔️",
    "color": "#fb7185",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "combatPowerMultiplier": 2.15,
      "defenseBonus": 40
    }
  },
  {
    "id": "nhat_chien_thong_dao",
    "name": "Nhất Chiến Thông Đạo",
    "description": "Trong sinh tử chiến có xác suất lĩnh ngộ trực tiếp nguyên lý của kỹ năng đang sử dụng.",
    "sourceDescription": "Trong sinh tử chiến có xác suất lĩnh ngộ trực tiếp nguyên lý của kỹ năng đang sử dụng.",
    "sourceVectorText": "Ngộ +7; Chiến +50",
    "sourceEffectsText": "atk: x2.05, comprehension: x1.85, combatInsightChance: +40%, willpowerBonus: +55",
    "tier": 5,
    "dimension": "combat",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: combatInsightChance",
    "unmappedEffectKeys": [
      "combatInsightChance"
    ],
    "spawnWeight": 0,
    "traitCost": 60,
    "innateDelta": {
      "comprehension": 3.5
    },
    "learningAffinity": {
      "combat": 50
    },
    "modifiers": [
      {
        "key": "attackFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 2.05,
        "sourceKey": "atk"
      },
      {
        "key": "techniqueLearningFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.85,
        "sourceKey": "comprehension"
      },
      {
        "key": "willTrainingBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.25,
        "sourceKey": "willpowerBonus"
      }
    ],
    "effects": [],
    "badge": "⚔️",
    "color": "#fb7185",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "combatPowerMultiplier": 2.05,
      "comprehensionMultiplier": 1.85
    }
  },
  {
    "id": "mieng_luoi_vung_ve",
    "name": "Miệng Lưỡi Vụng Về",
    "description": "Khó diễn đạt ý định và dễ gây hiểu lầm trong giao tiếp.",
    "sourceDescription": "Khó diễn đạt ý định và dễ gây hiểu lầm trong giao tiếp.",
    "sourceVectorText": "Đạo tâm +2",
    "sourceEffectsText": "prestige: -10, negotiation: -15%",
    "tier": 1,
    "dimension": "social",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: prestige, negotiation",
    "unmappedEffectKeys": [
      "prestige",
      "negotiation"
    ],
    "spawnWeight": 0,
    "traitCost": 3,
    "innateDelta": {},
    "learningAffinity": {},
    "modifiers": [
      {
        "key": "mindTrainingBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.01,
        "sourceKey": "daoHeartVector"
      }
    ],
    "effects": [],
    "badge": "🍀",
    "color": "#94a3b8",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {}
  },
  {
    "id": "de_bi_anh_huong",
    "name": "Dễ Bị Ảnh Hưởng",
    "description": "Thường thay đổi quyết định theo người xung quanh, dễ hòa nhập nhưng cũng dễ bị thao túng.",
    "sourceDescription": "Thường thay đổi quyết định theo người xung quanh, dễ hòa nhập nhưng cũng dễ bị thao túng.",
    "sourceVectorText": "Đạo tâm -2",
    "sourceEffectsText": "prestige: +5, willpowerBonus: -10, persuasionResistance: -20%",
    "tier": 1,
    "dimension": "social",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: prestige, persuasionResistance",
    "unmappedEffectKeys": [
      "prestige",
      "persuasionResistance"
    ],
    "spawnWeight": 0,
    "traitCost": 3,
    "innateDelta": {},
    "learningAffinity": {},
    "modifiers": [
      {
        "key": "willTrainingBonus",
        "mode": "add",
        "unit": "probability",
        "value": -0.05,
        "sourceKey": "willpowerBonus"
      },
      {
        "key": "mindTrainingBonus",
        "mode": "add",
        "unit": "probability",
        "value": -0.01,
        "sourceKey": "daoHeartVector"
      }
    ],
    "effects": [],
    "badge": "🍀",
    "color": "#94a3b8",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {}
  },
  {
    "id": "thien_sinh_than_thien",
    "name": "Thiên Sinh Thân Thiện",
    "description": "Khí chất dễ gần giúp giảm xung đột và xây dựng quan hệ nhanh hơn.",
    "sourceDescription": "Khí chất dễ gần giúp giảm xung đột và xây dựng quan hệ nhanh hơn.",
    "sourceVectorText": "Đạo tâm +4",
    "sourceEffectsText": "prestige: +20, relationshipGain: +20%",
    "tier": 2,
    "dimension": "social",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: prestige, relationshipGain",
    "unmappedEffectKeys": [
      "prestige",
      "relationshipGain"
    ],
    "spawnWeight": 0,
    "traitCost": 8,
    "innateDelta": {},
    "learningAffinity": {},
    "modifiers": [
      {
        "key": "mindTrainingBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.02,
        "sourceKey": "daoHeartVector"
      }
    ],
    "effects": [],
    "badge": "🍀",
    "color": "#34d399",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {}
  },
  {
    "id": "nhan_qua_nhay_cam",
    "name": "Nhân Quả Nhạy Cảm",
    "description": "Nhạy với ân oán và quan hệ nhân quả, dễ phát hiện mối liên kết quan trọng giữa người với người.",
    "sourceDescription": "Nhạy với ân oán và quan hệ nhân quả, dễ phát hiện mối liên kết quan trọng giữa người với người.",
    "sourceVectorText": "Ngộ +2; Đạo tâm +6; Khí vận +15",
    "sourceEffectsText": "comprehension: x1.20, relationshipInsight: +35%, fortune: +15",
    "tier": 3,
    "dimension": "social",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: relationshipInsight, fortune",
    "unmappedEffectKeys": [
      "relationshipInsight",
      "fortune"
    ],
    "spawnWeight": 0,
    "traitCost": 18,
    "innateDelta": {
      "comprehension": 1
    },
    "learningAffinity": {},
    "modifiers": [
      {
        "key": "techniqueLearningFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.2,
        "sourceKey": "comprehension"
      },
      {
        "key": "mindTrainingBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.03,
        "sourceKey": "daoHeartVector"
      }
    ],
    "effects": [],
    "badge": "🍀",
    "color": "#a78bfa",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "comprehensionMultiplier": 1.2
    }
  },
  {
    "id": "quy_nhan_tuong_tro",
    "name": "Quý Nhân Tương Trợ",
    "description": "Trong những nút thắt quan trọng thường dễ gặp người sẵn lòng trợ giúp, nhưng không đảm bảo miễn phí.",
    "sourceDescription": "Trong những nút thắt quan trọng thường dễ gặp người sẵn lòng trợ giúp, nhưng không đảm bảo miễn phí.",
    "sourceVectorText": "Đạo tâm +6; Khí vận +30",
    "sourceEffectsText": "prestige: +35, fortune: +30, mentorEncounter: +25%",
    "tier": 3,
    "dimension": "social",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: prestige, fortune, mentorEncounter",
    "unmappedEffectKeys": [
      "prestige",
      "fortune",
      "mentorEncounter"
    ],
    "spawnWeight": 0,
    "traitCost": 18,
    "innateDelta": {},
    "learningAffinity": {},
    "modifiers": [
      {
        "key": "mindTrainingBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.03,
        "sourceKey": "daoHeartVector"
      }
    ],
    "effects": [],
    "badge": "🍀",
    "color": "#a78bfa",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {}
  },
  {
    "id": "de_vuong_khi_tuong",
    "name": "Đế Vương Khí Tượng",
    "description": "Khí chất lãnh đạo mạnh, tăng hiệu quả chỉ huy nhưng dễ thu hút tranh chấp quyền lực.",
    "sourceDescription": "Khí chất lãnh đạo mạnh, tăng hiệu quả chỉ huy nhưng dễ thu hút tranh chấp quyền lực.",
    "sourceVectorText": "Đạo tâm +9",
    "sourceEffectsText": "prestige: +75, squadMorale: +30%, leadership: +40%, rivalryRisk: +15%",
    "tier": 4,
    "dimension": "social",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [
      "destiny_major"
    ],
    "conflictsWith": [],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: prestige, squadMorale, leadership, rivalryRisk",
    "unmappedEffectKeys": [
      "prestige",
      "squadMorale",
      "leadership",
      "rivalryRisk"
    ],
    "spawnWeight": 0,
    "traitCost": 35,
    "innateDelta": {},
    "learningAffinity": {},
    "modifiers": [
      {
        "key": "mindTrainingBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.045,
        "sourceKey": "daoHeartVector"
      }
    ],
    "effects": [],
    "badge": "🍀",
    "color": "#fbbf24",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {}
  },
  {
    "id": "thien_menh_so_bac",
    "name": "Thiên Mệnh Số Bạc",
    "description": "Mệnh cách thường gặp đại cơ duyên kèm đại tai kiếp; biên độ vận mệnh lớn hơn người thường.",
    "sourceDescription": "Mệnh cách thường gặp đại cơ duyên kèm đại tai kiếp; biên độ vận mệnh lớn hơn người thường.",
    "sourceVectorText": "Đạo tâm +9; Khí vận +45",
    "sourceEffectsText": "fortune: +45, disasterChance: +25%, rareEncounterChance: +35%",
    "tier": 4,
    "dimension": "social",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [
      "destiny_major"
    ],
    "conflictsWith": [],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: fortune, disasterChance, rareEncounterChance",
    "unmappedEffectKeys": [
      "fortune",
      "disasterChance",
      "rareEncounterChance"
    ],
    "spawnWeight": 0,
    "traitCost": 35,
    "innateDelta": {},
    "learningAffinity": {},
    "modifiers": [
      {
        "key": "mindTrainingBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.045,
        "sourceKey": "daoHeartVector"
      }
    ],
    "effects": [],
    "badge": "🍀",
    "color": "#fbbf24",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {}
  },
  {
    "id": "nhan_qua_chi_chu",
    "name": "Nhân Quả Chi Chủ",
    "description": "Có thiên phú đặc biệt trong việc nhìn, tích và chuyển hóa nhân quả; mạnh trong hệ thống quan hệ dài hạn.",
    "sourceDescription": "Có thiên phú đặc biệt trong việc nhìn, tích và chuyển hóa nhân quả; mạnh trong hệ thống quan hệ dài hạn.",
    "sourceVectorText": "Đạo tâm +13; Khí vận +55",
    "sourceEffectsText": "prestige: +90, fortune: +55, relationshipInsight: +70%, karmaControl: +45%",
    "tier": 5,
    "dimension": "social",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [
      "destiny_major"
    ],
    "conflictsWith": [],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: prestige, fortune, relationshipInsight, karmaControl",
    "unmappedEffectKeys": [
      "prestige",
      "fortune",
      "relationshipInsight",
      "karmaControl"
    ],
    "spawnWeight": 0,
    "traitCost": 60,
    "innateDelta": {},
    "learningAffinity": {},
    "modifiers": [
      {
        "key": "mindTrainingBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.065,
        "sourceKey": "daoHeartVector"
      }
    ],
    "effects": [],
    "badge": "🍀",
    "color": "#fb7185",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {}
  },
  {
    "id": "co_the_nhay_cam",
    "name": "Cơ Thể Nhạy Cảm",
    "description": "Nhạy với nhiệt độ và độc tố, phát hiện nguy hiểm sớm nhưng chịu môi trường khắc nghiệt kém.",
    "sourceDescription": "Nhạy với nhiệt độ và độc tố, phát hiện nguy hiểm sớm nhưng chịu môi trường khắc nghiệt kém.",
    "sourceVectorText": "Thể +3; Đạo tâm +2",
    "sourceEffectsText": "dodge: +8%, environmentResistance: -15%, poisonDetection: +20%",
    "tier": 1,
    "dimension": "survival",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: environmentResistance, poisonDetection",
    "unmappedEffectKeys": [
      "environmentResistance",
      "poisonDetection"
    ],
    "spawnWeight": 0,
    "traitCost": 3,
    "innateDelta": {
      "physique": 1.5
    },
    "learningAffinity": {},
    "modifiers": [
      {
        "key": "dodgeChanceBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.08,
        "sourceKey": "dodge"
      },
      {
        "key": "mindTrainingBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.01,
        "sourceKey": "daoHeartVector"
      }
    ],
    "effects": [],
    "badge": "🍖",
    "color": "#94a3b8",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "dodgeRateBonus": 0.08
    }
  },
  {
    "id": "hoi_phuc_tot",
    "name": "Hồi Phục Tốt",
    "description": "Vết thương nhẹ liền nhanh và ít để lại di chứng.",
    "sourceDescription": "Vết thương nhẹ liền nhanh và ít để lại di chứng.",
    "sourceVectorText": "Thể +8; Đạo tâm +3",
    "sourceEffectsText": "hp: x1.15, regeneration: +22%",
    "tier": 2,
    "dimension": "survival",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: regeneration",
    "unmappedEffectKeys": [
      "regeneration"
    ],
    "spawnWeight": 0,
    "traitCost": 8,
    "innateDelta": {
      "physique": 4
    },
    "learningAffinity": {},
    "modifiers": [
      {
        "key": "healthFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.15,
        "sourceKey": "hp"
      },
      {
        "key": "mindTrainingBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.015,
        "sourceKey": "daoHeartVector"
      }
    ],
    "effects": [],
    "badge": "🍖",
    "color": "#34d399",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "healthMultiplier": 1.15
    }
  },
  {
    "id": "sa_mac_thich_nghi",
    "name": "Sa Mạc Thích Nghi",
    "description": "Cơ thể giữ nước tốt và chịu nóng lâu, phù hợp vùng hoang mạc.",
    "sourceDescription": "Cơ thể giữ nước tốt và chịu nóng lâu, phù hợp vùng hoang mạc.",
    "sourceVectorText": "Thể +7; Đạo tâm +3",
    "sourceEffectsText": "thirstRate: x0.65, heatResistance: +35%, moveSpeed: x1.10",
    "tier": 2,
    "dimension": "survival",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: heatResistance",
    "unmappedEffectKeys": [
      "heatResistance"
    ],
    "spawnWeight": 0,
    "traitCost": 8,
    "innateDelta": {
      "physique": 3.5
    },
    "learningAffinity": {},
    "modifiers": [
      {
        "key": "thirstRateFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 0.65,
        "sourceKey": "thirstRate"
      },
      {
        "key": "moveSpeedFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.1,
        "sourceKey": "moveSpeed"
      },
      {
        "key": "mindTrainingBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.015,
        "sourceKey": "daoHeartVector"
      }
    ],
    "effects": [],
    "badge": "🍖",
    "color": "#34d399",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "thirstRateMultiplier": 0.65,
      "moveSpeedMultiplier": 1.1
    }
  },
  {
    "id": "thuy_sinh_thich_nghi",
    "name": "Thủy Sinh Thích Nghi",
    "description": "Có thể nín thở rất lâu và di chuyển hiệu quả trong nước.",
    "sourceDescription": "Có thể nín thở rất lâu và di chuyển hiệu quả trong nước.",
    "sourceVectorText": "Thể +7; Đạo tâm +3",
    "sourceEffectsText": "swimSpeed: x1.35, oxygenUse: x0.55, waterResistance: +30%",
    "tier": 2,
    "dimension": "survival",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: swimSpeed, oxygenUse, waterResistance",
    "unmappedEffectKeys": [
      "swimSpeed",
      "oxygenUse",
      "waterResistance"
    ],
    "spawnWeight": 0,
    "traitCost": 8,
    "innateDelta": {
      "physique": 3.5
    },
    "learningAffinity": {},
    "modifiers": [
      {
        "key": "mindTrainingBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.015,
        "sourceKey": "daoHeartVector"
      }
    ],
    "effects": [],
    "badge": "🍖",
    "color": "#34d399",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {}
  },
  {
    "id": "linh_tuc_tuan_hoan",
    "name": "Linh Tức Tuần Hoàn",
    "description": "Khi nghỉ ngơi, cơ thể tự tuần hoàn linh lực để hồi phục thể lực và vết thương.",
    "sourceDescription": "Khi nghỉ ngơi, cơ thể tự tuần hoàn linh lực để hồi phục thể lực và vết thương.",
    "sourceVectorText": "Linh +2; Thể +11; Đạo tâm +5",
    "sourceEffectsText": "qiRate: x1.25, regeneration: +28%, staminaRecovery: +30%",
    "tier": 3,
    "dimension": "survival",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: regeneration, staminaRecovery",
    "unmappedEffectKeys": [
      "regeneration",
      "staminaRecovery"
    ],
    "spawnWeight": 0,
    "traitCost": 18,
    "innateDelta": {
      "aptitude": 1,
      "physique": 5.5
    },
    "learningAffinity": {},
    "modifiers": [
      {
        "key": "qiRateFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.25,
        "sourceKey": "qiRate"
      },
      {
        "key": "mindTrainingBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.025,
        "sourceKey": "daoHeartVector"
      }
    ],
    "effects": [],
    "badge": "🍖",
    "color": "#a78bfa",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "qiAbsorptionMultiplier": 1.25
    }
  },
  {
    "id": "thien_dia_thich_ung",
    "name": "Thiên Địa Thích Ứng",
    "description": "Sau thời gian cư trú, cơ thể thích nghi dần với khí hậu, chướng khí và áp lực linh khí địa phương.",
    "sourceDescription": "Sau thời gian cư trú, cơ thể thích nghi dần với khí hậu, chướng khí và áp lực linh khí địa phương.",
    "sourceVectorText": "Thể +20; Đạo tâm +8",
    "sourceEffectsText": "hp: x1.55, environmentResistance: +50%, adaptationRate: +60%",
    "tier": 4,
    "dimension": "survival",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: environmentResistance, adaptationRate",
    "unmappedEffectKeys": [
      "environmentResistance",
      "adaptationRate"
    ],
    "spawnWeight": 0,
    "traitCost": 35,
    "innateDelta": {
      "physique": 10
    },
    "learningAffinity": {},
    "modifiers": [
      {
        "key": "healthFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.55,
        "sourceKey": "hp"
      },
      {
        "key": "mindTrainingBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.04,
        "sourceKey": "daoHeartVector"
      }
    ],
    "effects": [],
    "badge": "🍖",
    "color": "#fbbf24",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "healthMultiplier": 1.55
    }
  },
  {
    "id": "van_vuc_sinh_ton",
    "name": "Vạn Vực Sinh Tồn",
    "description": "Có khả năng sống sót ở phần lớn môi trường cực đoan và giảm mạnh thiệt hại từ thiếu tài nguyên.",
    "sourceDescription": "Có khả năng sống sót ở phần lớn môi trường cực đoan và giảm mạnh thiệt hại từ thiếu tài nguyên.",
    "sourceVectorText": "Thể +32; Đạo tâm +10",
    "sourceEffectsText": "hp: x2.10, hungerRate: x0.35, thirstRate: x0.35, environmentResistance: +75%, disasterResistance: +45%",
    "tier": 5,
    "dimension": "survival",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: environmentResistance, disasterResistance",
    "unmappedEffectKeys": [
      "environmentResistance",
      "disasterResistance"
    ],
    "spawnWeight": 0,
    "traitCost": 60,
    "innateDelta": {
      "physique": 16
    },
    "learningAffinity": {},
    "modifiers": [
      {
        "key": "healthFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 2.1,
        "sourceKey": "hp"
      },
      {
        "key": "hungerRateFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 0.35,
        "sourceKey": "hungerRate"
      },
      {
        "key": "thirstRateFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 0.35,
        "sourceKey": "thirstRate"
      },
      {
        "key": "mindTrainingBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.05,
        "sourceKey": "daoHeartVector"
      }
    ],
    "effects": [],
    "badge": "🍖",
    "color": "#fb7185",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "healthMultiplier": 2.1,
      "hungerRateMultiplier": 0.35,
      "thirstRateMultiplier": 0.35
    }
  },
  {
    "id": "mach_tuong_thien_phu",
    "name": "Mạch Tượng Thiên Phú",
    "description": "Có cảm giác tự nhiên với kinh mạch và thương thế, nhưng kiến thức còn thô sơ.",
    "sourceDescription": "Có cảm giác tự nhiên với kinh mạch và thương thế, nhưng kiến thức còn thô sơ.",
    "sourceVectorText": "Nghệ +6",
    "sourceEffectsText": "healing: +10%, alchemy: +5%",
    "tier": 1,
    "dimension": "profession",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [
      {
        "kind": "capability",
        "key": "sentient"
      },
      {
        "kind": "capability",
        "key": "canLearnProfession"
      }
    ],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: healing, alchemy",
    "unmappedEffectKeys": [
      "healing",
      "alchemy"
    ],
    "spawnWeight": 0,
    "traitCost": 3,
    "innateDelta": {},
    "learningAffinity": {
      "profession": 6
    },
    "modifiers": [],
    "effects": [],
    "badge": "🧪",
    "color": "#94a3b8",
    "category": "profession",
    "conflicts": [],
    "statModifiers": {}
  },
  {
    "id": "thu_phap_kheo_leo",
    "name": "Thủ Pháp Khéo Léo",
    "description": "Đôi tay ổn định, thích hợp phù lục, luyện khí, cơ quan và y thuật tinh tế.",
    "sourceDescription": "Đôi tay ổn định, thích hợp phù lục, luyện khí, cơ quan và y thuật tinh tế.",
    "sourceVectorText": "Nghệ +14",
    "sourceEffectsText": "craftingSpeed: x1.28, alchemy: +12%, inscription: +18%",
    "tier": 2,
    "dimension": "profession",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [
      {
        "kind": "capability",
        "key": "sentient"
      },
      {
        "kind": "capability",
        "key": "canLearnProfession"
      }
    ],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: alchemy, inscription",
    "unmappedEffectKeys": [
      "alchemy",
      "inscription"
    ],
    "spawnWeight": 0,
    "traitCost": 8,
    "innateDelta": {},
    "learningAffinity": {
      "profession": 14
    },
    "modifiers": [
      {
        "key": "workSpeedFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.28,
        "sourceKey": "craftingSpeed"
      }
    ],
    "effects": [],
    "badge": "🧪",
    "color": "#34d399",
    "category": "profession",
    "conflicts": [],
    "statModifiers": {
      "craftingSpeedMultiplier": 1.28
    }
  },
  {
    "id": "linh_thuc_nong_su",
    "name": "Linh Thực Nông Sư",
    "description": "Hiểu chu kỳ sinh trưởng và linh khí đất, tăng hiệu quả trồng trọt linh thực.",
    "sourceDescription": "Hiểu chu kỳ sinh trưởng và linh khí đất, tăng hiệu quả trồng trọt linh thực.",
    "sourceVectorText": "Nghệ +12",
    "sourceEffectsText": "farmingYield: +30%, alchemy: +10%, hungerRate: x0.85",
    "tier": 2,
    "dimension": "profession",
    "origin": "acquired",
    "allowedRaces": "all",
    "activation": [
      {
        "kind": "capability",
        "key": "sentient"
      },
      {
        "kind": "capability",
        "key": "canLearnProfession"
      }
    ],
    "acquisition": [
      {
        "kind": "achievement",
        "key": "achieve_linh_thuc_nong_su",
        "value": 1
      }
    ],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: farmingYield, alchemy; Chưa có producer thành tựu hậu thiên tương ứng trong lõi",
    "unmappedEffectKeys": [
      "farmingYield",
      "alchemy"
    ],
    "spawnWeight": 0,
    "traitCost": 8,
    "innateDelta": {},
    "learningAffinity": {
      "profession": 12
    },
    "modifiers": [
      {
        "key": "hungerRateFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 0.85,
        "sourceKey": "hungerRate"
      }
    ],
    "effects": [],
    "badge": "🧪",
    "color": "#34d399",
    "category": "profession",
    "conflicts": [],
    "statModifiers": {
      "hungerRateMultiplier": 0.85
    }
  },
  {
    "id": "ngu_thu_su",
    "name": "Ngự Thú Sư",
    "description": "Giỏi quan sát tập tính và xây dựng khế ước với linh thú.",
    "sourceDescription": "Giỏi quan sát tập tính và xây dựng khế ước với linh thú.",
    "sourceVectorText": "Nghệ +12",
    "sourceEffectsText": "taming: +30%, prestige: +15, relationshipGain: +10%",
    "tier": 2,
    "dimension": "profession",
    "origin": "acquired",
    "allowedRaces": "all",
    "activation": [
      {
        "kind": "capability",
        "key": "sentient"
      },
      {
        "kind": "capability",
        "key": "canLearnProfession"
      }
    ],
    "acquisition": [
      {
        "kind": "achievement",
        "key": "achieve_ngu_thu_su",
        "value": 1
      }
    ],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: taming, prestige, relationshipGain; Chưa có producer thành tựu hậu thiên tương ứng trong lõi",
    "unmappedEffectKeys": [
      "taming",
      "prestige",
      "relationshipGain"
    ],
    "spawnWeight": 0,
    "traitCost": 8,
    "innateDelta": {},
    "learningAffinity": {
      "profession": 12
    },
    "modifiers": [],
    "effects": [],
    "badge": "🧪",
    "color": "#34d399",
    "category": "profession",
    "conflicts": [],
    "statModifiers": {}
  },
  {
    "id": "y_dao_thong_hieu",
    "name": "Y Đạo Thông Hiểu",
    "description": "Am hiểu thương thế, kinh mạch và dược lý, cứu trị đồng môn hiệu quả.",
    "sourceDescription": "Am hiểu thương thế, kinh mạch và dược lý, cứu trị đồng môn hiệu quả.",
    "sourceVectorText": "Ngộ +2; Nghệ +20",
    "sourceEffectsText": "healing: +35%, alchemy: +22%, comprehension: x1.25",
    "tier": 3,
    "dimension": "profession",
    "origin": "acquired",
    "allowedRaces": "all",
    "activation": [
      {
        "kind": "capability",
        "key": "sentient"
      },
      {
        "kind": "capability",
        "key": "canLearnProfession"
      }
    ],
    "acquisition": [
      {
        "kind": "achievement",
        "key": "achieve_y_dao_thong_hieu",
        "value": 1
      }
    ],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: healing, alchemy; Chưa có producer thành tựu hậu thiên tương ứng trong lõi",
    "unmappedEffectKeys": [
      "healing",
      "alchemy"
    ],
    "spawnWeight": 0,
    "traitCost": 18,
    "innateDelta": {},
    "learningAffinity": {
      "profession": 20
    },
    "modifiers": [
      {
        "key": "techniqueLearningFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.25,
        "sourceKey": "comprehension"
      }
    ],
    "effects": [],
    "badge": "🧪",
    "color": "#a78bfa",
    "category": "profession",
    "conflicts": [],
    "statModifiers": {
      "comprehensionMultiplier": 1.25
    }
  },
  {
    "id": "co_quan_tinh_toan",
    "name": "Cơ Quan Tinh Toán",
    "description": "Giỏi cơ quan thuật và kết cấu máy móc, xây bẫy và công trình tinh vi.",
    "sourceDescription": "Giỏi cơ quan thuật và kết cấu máy móc, xây bẫy và công trình tinh vi.",
    "sourceVectorText": "Ngộ +2; Nghệ +24",
    "sourceEffectsText": "craftingSpeed: x1.50, trapEfficiency: +35%, comprehension: x1.25",
    "tier": 3,
    "dimension": "profession",
    "origin": "acquired",
    "allowedRaces": "all",
    "activation": [
      {
        "kind": "capability",
        "key": "sentient"
      },
      {
        "kind": "capability",
        "key": "canLearnProfession"
      }
    ],
    "acquisition": [
      {
        "kind": "achievement",
        "key": "achieve_co_quan_tinh_toan",
        "value": 1
      }
    ],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: trapEfficiency; Chưa có producer thành tựu hậu thiên tương ứng trong lõi",
    "unmappedEffectKeys": [
      "trapEfficiency"
    ],
    "spawnWeight": 0,
    "traitCost": 18,
    "innateDelta": {},
    "learningAffinity": {
      "profession": 24
    },
    "modifiers": [
      {
        "key": "workSpeedFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.5,
        "sourceKey": "craftingSpeed"
      },
      {
        "key": "techniqueLearningFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.25,
        "sourceKey": "comprehension"
      }
    ],
    "effects": [],
    "badge": "🧪",
    "color": "#a78bfa",
    "category": "profession",
    "conflicts": [],
    "statModifiers": {
      "craftingSpeedMultiplier": 1.5,
      "comprehensionMultiplier": 1.25
    }
  },
  {
    "id": "thien_co_tran_tam",
    "name": "Thiên Cơ Trận Tâm",
    "description": "Nhìn địa hình và dòng linh khí như mạng lưới trận văn, cực mạnh trong trận pháp.",
    "sourceDescription": "Nhìn địa hình và dòng linh khí như mạng lưới trận văn, cực mạnh trong trận pháp.",
    "sourceVectorText": "Ngộ +7; Nghệ +30",
    "sourceEffectsText": "comprehension: x1.90, formation: +55%, def: +28",
    "tier": 4,
    "dimension": "profession",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [
      {
        "kind": "capability",
        "key": "sentient"
      },
      {
        "kind": "capability",
        "key": "canLearnProfession"
      }
    ],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: formation",
    "unmappedEffectKeys": [
      "formation"
    ],
    "spawnWeight": 0,
    "traitCost": 35,
    "innateDelta": {
      "comprehension": 3.5
    },
    "learningAffinity": {
      "profession": 30
    },
    "modifiers": [
      {
        "key": "techniqueLearningFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.9,
        "sourceKey": "comprehension"
      },
      {
        "key": "defenseFlat",
        "mode": "add",
        "unit": "flat",
        "value": 28,
        "sourceKey": "def"
      }
    ],
    "effects": [],
    "badge": "🧪",
    "color": "#fbbf24",
    "category": "profession",
    "conflicts": [],
    "statModifiers": {
      "comprehensionMultiplier": 1.9,
      "defenseBonus": 28
    }
  },
  {
    "id": "dan_tam_thong_huyen",
    "name": "Đan Tâm Thông Huyền",
    "description": "Cảm nhận dược tính thay đổi theo từng nhịp lửa, thiên phú luyện đan gần cấp tông sư.",
    "sourceDescription": "Cảm nhận dược tính thay đổi theo từng nhịp lửa, thiên phú luyện đan gần cấp tông sư.",
    "sourceVectorText": "Ngộ +4; Nghệ +30",
    "sourceEffectsText": "alchemy: +55%, comprehension: x1.55, pillFailure: -35%",
    "tier": 4,
    "dimension": "profession",
    "origin": "innate",
    "allowedRaces": "all",
    "activation": [
      {
        "kind": "capability",
        "key": "sentient"
      },
      {
        "kind": "capability",
        "key": "canLearnProfession"
      }
    ],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: alchemy, pillFailure",
    "unmappedEffectKeys": [
      "alchemy",
      "pillFailure"
    ],
    "spawnWeight": 0,
    "traitCost": 35,
    "innateDelta": {
      "comprehension": 2
    },
    "learningAffinity": {
      "profession": 30
    },
    "modifiers": [
      {
        "key": "techniqueLearningFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.55,
        "sourceKey": "comprehension"
      }
    ],
    "effects": [],
    "badge": "🧪",
    "color": "#fbbf24",
    "category": "profession",
    "conflicts": [],
    "statModifiers": {
      "comprehensionMultiplier": 1.55
    }
  }
];
