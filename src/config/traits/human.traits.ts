import { TraitDefinitionV3 } from './trait.types.ts';

export const HUMAN_TRAITS_V3: readonly TraitDefinitionV3[] = [
  {
    "id": "pham_cot_troc_khi",
    "name": "Phàm Cốt Trọc Khí",
    "description": "Ăn ngũ cốc phàm trần quá lâu khiến trọc khí tích tụ, phải tẩy tủy vất vả mới tu tiên được.",
    "sourceDescription": "Ăn ngũ cốc phàm trần quá lâu khiến trọc khí tích tụ, phải tẩy tủy vất vả mới tu tiên được.",
    "sourceVectorText": "Linh -6; Thể +6",
    "sourceEffectsText": "qiRate: x0.75, hungerRate: x1.15, willpowerBonus: +10",
    "tier": 1,
    "dimension": "physique",
    "origin": "acquired",
    "allowedRaces": [
      "human"
    ],
    "activation": [],
    "acquisition": [
      {
        "kind": "achievement",
        "key": "mortal_impurity_accumulated",
        "value": 1
      }
    ],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "planned",
    "deferredReason": "Chưa có producer sự kiện thành tựu/nghề nghiệp tương ứng trong lõi",
    "spawnWeight": 0,
    "traitCost": 3,
    "innateDelta": {},
    "learningAffinity": {
      "cultivation": -6
    },
    "modifiers": [
      {
        "key": "qiRateFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 0.75,
        "sourceKey": "qiRate"
      },
      {
        "key": "hungerRateFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.15,
        "sourceKey": "hungerRate"
      },
      {
        "key": "willTrainingBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.05,
        "sourceKey": "willpowerBonus"
      }
    ],
    "effects": [],
    "badge": "🛡️",
    "color": "#94a3b8",
    "category": "experience",
    "conflicts": [],
    "statModifiers": {
      "qiAbsorptionMultiplier": 0.75,
      "hungerRateMultiplier": 1.15
    }
  },
  {
    "id": "mot_sach_yeu_duoi",
    "name": "Mọt Sách Yếu Đuối",
    "description": "Cả ngày chỉ biết đọc sách thánh hiền, thông hiểu đạo lý nhưng trói gà không chặt.",
    "sourceDescription": "Cả ngày chỉ biết đọc sách thánh hiền, thông hiểu đạo lý nhưng trói gà không chặt.",
    "sourceVectorText": "Ngộ +4; Thể -6; Chiến -6; Đạo tâm +4",
    "sourceEffectsText": "comprehension: x1.15, hp: x0.75, atk: x0.75",
    "tier": 1,
    "dimension": "mindset",
    "origin": "innate",
    "allowedRaces": [
      "human"
    ],
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "active",
    "spawnWeight": 1,
    "traitCost": 3,
    "innateDelta": {
      "comprehension": 2,
      "physique": -3
    },
    "learningAffinity": {
      "combat": -6
    },
    "modifiers": [
      {
        "key": "techniqueLearningFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.15,
        "sourceKey": "comprehension"
      },
      {
        "key": "healthFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 0.75,
        "sourceKey": "hp"
      },
      {
        "key": "attackFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 0.75,
        "sourceKey": "atk"
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
      "comprehensionMultiplier": 1.15,
      "healthMultiplier": 0.75,
      "combatPowerMultiplier": 0.75
    }
  },
  {
    "id": "long_tran_chua_dut",
    "name": "Lòng Trần Chưa Dứt",
    "description": "Còn nặng lòng với công danh phú quý thế gian, khi bế quan dễ sinh tạp niệm.",
    "sourceDescription": "Còn nặng lòng với công danh phú quý thế gian, khi bế quan dễ sinh tạp niệm.",
    "sourceVectorText": "Ngộ +3",
    "sourceEffectsText": "prestige: +12, breakthrough: -10%, mindStateBonus: -10",
    "tier": 1,
    "dimension": "mindset",
    "origin": "innate",
    "allowedRaces": [
      "human"
    ],
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
      "comprehension": 1.5
    },
    "learningAffinity": {},
    "modifiers": [
      {
        "key": "breakthroughChanceBonus",
        "mode": "add",
        "unit": "probability",
        "value": -0.1,
        "sourceKey": "breakthrough"
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
      "breakthroughChanceBonus": -0.1
    }
  },
  {
    "id": "tru_ma_tien_si",
    "name": "Trừ Ma Vệ Đạo",
    "description": "Mang lòng chính nghĩa diệt trừ yêu ma bảo vệ thương sinh, đạo tâm vững vàng.",
    "sourceDescription": "Mang lòng chính nghĩa diệt trừ yêu ma bảo vệ thương sinh, đạo tâm vững vàng.",
    "sourceVectorText": "Chiến +14",
    "sourceEffectsText": "atk: x1.3, breakthrough: +10%, prestige: +15, willpowerBonus: +15",
    "tier": 2,
    "dimension": "combat",
    "origin": "innate",
    "allowedRaces": [
      "human"
    ],
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [
      "tam_ma_quan_than",
      "thien_ma_huyet_the"
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
        "key": "breakthroughChanceBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.1,
        "sourceKey": "breakthrough"
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
    "badge": "✝️",
    "color": "#34d399",
    "category": "innate",
    "conflicts": [
      "tam_ma_quan_than",
      "thien_ma_huyet_the"
    ],
    "statModifiers": {
      "combatPowerMultiplier": 1.3,
      "breakthroughChanceBonus": 0.1
    }
  },
  {
    "id": "trung_quan_ai_mon",
    "name": "Trung Tâm Cảnh Cảnh",
    "description": "Một lòng trung thành tuyệt đối với tông môn, sẵn sàng tử chiến bảo vệ sơn môn.",
    "sourceDescription": "Một lòng trung thành tuyệt đối với tông môn, sẵn sàng tử chiến bảo vệ sơn môn.",
    "sourceVectorText": "Đạo tâm +4",
    "sourceEffectsText": "prestige: +25, def: +10, breakthrough: +8%, willpowerBonus: +20",
    "tier": 2,
    "dimension": "social",
    "origin": "acquired",
    "allowedRaces": [
      "human"
    ],
    "activation": [],
    "acquisition": [
      {
        "kind": "achievement",
        "key": "achieve_trung_quan_ai_mon",
        "value": 1
      }
    ],
    "exclusiveGroups": [],
    "conflictsWith": [
      "phan_cot_nghich_tu"
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
        "value": 0.08,
        "sourceKey": "breakthrough"
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
    "badge": "🛡️",
    "color": "#34d399",
    "category": "experience",
    "conflicts": [
      "phan_cot_nghich_tu"
    ],
    "statModifiers": {
      "defenseBonus": 10,
      "breakthroughChanceBonus": 0.08
    }
  },
  {
    "id": "vo_cau_linh_the",
    "name": "Vô Cấu Linh Thể",
    "description": "Cơ thể bẩm sinh không chút tạp chất phàm trần, hấp thu linh khí nhanh và dễ đột phá.",
    "sourceDescription": "Cơ thể bẩm sinh không chút tạp chất phàm trần, hấp thu linh khí nhanh và dễ đột phá.",
    "sourceVectorText": "Linh +4; Thể +20",
    "sourceEffectsText": "qiRate: x1.55, breakthrough: +15%, dodge: +10%",
    "tier": 3,
    "dimension": "physique",
    "origin": "innate",
    "allowedRaces": [
      "human"
    ],
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "active",
    "spawnWeight": 1,
    "traitCost": 18,
    "innateDelta": {
      "aptitude": 2,
      "physique": 10
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
        "key": "breakthroughChanceBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.15,
        "sourceKey": "breakthrough"
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
    "badge": "💧",
    "color": "#a78bfa",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "qiAbsorptionMultiplier": 1.55,
      "breakthroughChanceBonus": 0.15,
      "dodgeRateBonus": 0.1
    }
  },
  {
    "id": "tien_phong_dao_cot",
    "name": "Tiên Phong Đạo Cốt",
    "description": "Phong thái thoát tục như thần tiên hạ phàm, đi đến đâu cũng được người đời kính ngưỡng.",
    "sourceDescription": "Phong thái thoát tục như thần tiên hạ phàm, đi đến đâu cũng được người đời kính ngưỡng.",
    "sourceVectorText": "Linh +3; Ngộ +11; Đạo tâm +13",
    "sourceEffectsText": "qiRate: x1.4, prestige: +20, lifespan: +50, mindStateBonus: +25",
    "tier": 3,
    "dimension": "mindset",
    "origin": "innate",
    "allowedRaces": [
      "human"
    ],
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
      "comprehension": 5.5,
      "aptitude": 1.5
    },
    "learningAffinity": {},
    "modifiers": [
      {
        "key": "qiRateFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.4,
        "sourceKey": "qiRate"
      },
      {
        "key": "lifespanYears",
        "mode": "add",
        "unit": "years",
        "value": 50,
        "sourceKey": "lifespan"
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
        "value": 0.065,
        "sourceKey": "daoHeartVector"
      }
    ],
    "effects": [],
    "badge": "🪶",
    "color": "#a78bfa",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "qiAbsorptionMultiplier": 1.4,
      "lifespanBonus": 50
    }
  },
  {
    "id": "am_khi_chi_vuong",
    "name": "Ám Khí Chi Vương",
    "description": "Tinh thông các loại phi đao, châm độc và cơ quan ám khí của thế gia Nhân tộc.",
    "sourceDescription": "Tinh thông các loại phi đao, châm độc và cơ quan ám khí của thế gia Nhân tộc.",
    "sourceVectorText": "Chiến +22",
    "sourceEffectsText": "crit: +20%, atkSpeed: x1.3, atk: x1.2",
    "tier": 3,
    "dimension": "combat",
    "origin": "acquired",
    "allowedRaces": [
      "human"
    ],
    "activation": [],
    "acquisition": [
      {
        "kind": "achievement",
        "key": "hidden_weapon_mastery",
        "value": 100
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
      "combat": 22
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
        "key": "attackSpeedFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.3,
        "sourceKey": "atkSpeed"
      },
      {
        "key": "attackFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.2,
        "sourceKey": "atk"
      }
    ],
    "effects": [],
    "badge": "🎯",
    "color": "#a78bfa",
    "category": "experience",
    "conflicts": [],
    "statModifiers": {
      "critRateBonus": 0.2,
      "attackSpeedMultiplier": 1.3,
      "combatPowerMultiplier": 1.2
    }
  },
  {
    "id": "hao_nhien_chinh_khi",
    "name": "Hạo Nhiên Chính Khí",
    "description": "Trong ngực nuôi dưỡng một luồng Hạo Nhiên Chính Khí của Nho gia, vạn tà bất xâm.",
    "sourceDescription": "Trong ngực nuôi dưỡng một luồng Hạo Nhiên Chính Khí của Nho gia, vạn tà bất xâm.",
    "sourceVectorText": "Ngộ +11; Chiến +3; Đạo tâm +13",
    "sourceEffectsText": "willpowerBonus: +35, mindStateBonus: +30, heartDemonResistance: +30%, atk: x1.35",
    "tier": 3,
    "dimension": "mindset",
    "origin": "innate",
    "allowedRaces": [
      "human"
    ],
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
      "comprehension": 5.5
    },
    "learningAffinity": {
      "combat": 3
    },
    "modifiers": [
      {
        "key": "willTrainingBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.175,
        "sourceKey": "willpowerBonus"
      },
      {
        "key": "mentalEquilibriumBias",
        "mode": "add",
        "unit": "flat",
        "value": 20,
        "sourceKey": "mindStateBonus"
      },
      {
        "key": "attackFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.35,
        "sourceKey": "atk"
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
      "combatPowerMultiplier": 1.35
    }
  },
  {
    "id": "nho_dao_chi_thanh",
    "name": "Nho Đạo Chí Thánh",
    "description": "Đọc vạn quyển sách, dùng văn nhập đạo, lời nói hóa thành pháp tắc giáo hóa chúng sinh.",
    "sourceDescription": "Đọc vạn quyển sách, dùng văn nhập đạo, lời nói hóa thành pháp tắc giáo hóa chúng sinh.",
    "sourceVectorText": "Linh +2; Ngộ +5; Đạo tâm +6",
    "sourceEffectsText": "comprehension: x1.65, prestige: +45, mindStateBonus: +25, qiRate: x1.3",
    "tier": 3,
    "dimension": "social",
    "origin": "acquired",
    "allowedRaces": [
      "human"
    ],
    "activation": [],
    "acquisition": [
      {
        "kind": "achievement",
        "key": "achieve_nho_dao_chi_thanh",
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
    "traitCost": 18,
    "innateDelta": {},
    "learningAffinity": {
      "cultivation": 2
    },
    "modifiers": [
      {
        "key": "techniqueLearningFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.65,
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
        "key": "qiRateFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.3,
        "sourceKey": "qiRate"
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
    "category": "experience",
    "conflicts": [],
    "statModifiers": {
      "comprehensionMultiplier": 1.65,
      "qiAbsorptionMultiplier": 1.3
    }
  },
  {
    "id": "hoang_co_thanh_the",
    "name": "Hoang Cổ Thánh Thể",
    "description": "Nhục thân chí tôn của Nhân tộc thời Hoang Cổ, khí huyết màu vàng kim áp đảo vạn tộc.",
    "sourceDescription": "Nhục thân chí tôn của Nhân tộc thời Hoang Cổ, khí huyết màu vàng kim áp đảo vạn tộc.",
    "sourceVectorText": "Linh -6; Thể +38; Chiến +18; Đạo tâm +8",
    "sourceEffectsText": "hp: x2.45, atk: x1.85, armor: +30, qiRate: x0.75, lifespan: +300, willpowerBonus: +45, bodyCultivationGain: +40%",
    "tier": 4,
    "dimension": "physique",
    "origin": "innate",
    "allowedRaces": [
      "human"
    ],
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [
      "major_physique"
    ],
    "conflictsWith": [
      "bach_benh_quan_than",
      "doan_menh_chi_tuong",
      "tat_nguyen_bam_sinh"
    ],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: bodyCultivationGain",
    "unmappedEffectKeys": [
      "bodyCultivationGain"
    ],
    "spawnWeight": 0,
    "traitCost": 35,
    "innateDelta": {
      "aptitude": -3,
      "physique": 19
    },
    "learningAffinity": {
      "combat": 18
    },
    "modifiers": [
      {
        "key": "healthFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 2.45,
        "sourceKey": "hp"
      },
      {
        "key": "attackFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.85,
        "sourceKey": "atk"
      },
      {
        "key": "armorFlat",
        "mode": "add",
        "unit": "flat",
        "value": 30,
        "sourceKey": "armor"
      },
      {
        "key": "qiRateFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 0.75,
        "sourceKey": "qiRate"
      },
      {
        "key": "lifespanYears",
        "mode": "add",
        "unit": "years",
        "value": 300,
        "sourceKey": "lifespan"
      },
      {
        "key": "willTrainingBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.225,
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
    "badge": "🛡️",
    "color": "#fbbf24",
    "category": "innate",
    "conflicts": [
      "bach_benh_quan_than",
      "doan_menh_chi_tuong",
      "tat_nguyen_bam_sinh"
    ],
    "statModifiers": {
      "healthMultiplier": 2.45,
      "combatPowerMultiplier": 1.85,
      "armorBonus": 30,
      "qiAbsorptionMultiplier": 0.75,
      "lifespanBonus": 300
    }
  },
  {
    "id": "tien_thien_dao_the",
    "name": "Tiên Thiên Đạo Thể",
    "description": "Thân thể gần gũi với Đại Đạo nhất của Nhân tộc, ngôn xuất pháp tùy, tu luyện thần tốc.",
    "sourceDescription": "Thân thể gần gũi với Đại Đạo nhất của Nhân tộc, ngôn xuất pháp tùy, tu luyện thần tốc.",
    "sourceVectorText": "Linh +8; Ngộ +7; Thể +30",
    "sourceEffectsText": "qiRate: x1.95, comprehension: x1.85, breakthrough: +23%, dodge: +15%, mindStateBonus: +35, daoAffinity: +35%",
    "tier": 4,
    "dimension": "physique",
    "origin": "innate",
    "allowedRaces": [
      "human"
    ],
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [
      "major_physique"
    ],
    "conflictsWith": [
      "phe_linh_can",
      "tuyet_linh_chi_the"
    ],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: daoAffinity",
    "unmappedEffectKeys": [
      "daoAffinity"
    ],
    "spawnWeight": 0,
    "traitCost": 35,
    "innateDelta": {
      "comprehension": 3.5,
      "aptitude": 4,
      "physique": 15
    },
    "learningAffinity": {},
    "modifiers": [
      {
        "key": "qiRateFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.95,
        "sourceKey": "qiRate"
      },
      {
        "key": "techniqueLearningFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.85,
        "sourceKey": "comprehension"
      },
      {
        "key": "breakthroughChanceBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.23,
        "sourceKey": "breakthrough"
      },
      {
        "key": "dodgeChanceBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.15,
        "sourceKey": "dodge"
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
    "badge": "✨",
    "color": "#fbbf24",
    "category": "innate",
    "conflicts": [
      "phe_linh_can",
      "tuyet_linh_chi_the"
    ],
    "statModifiers": {
      "qiAbsorptionMultiplier": 1.95,
      "comprehensionMultiplier": 1.85,
      "breakthroughChanceBonus": 0.23,
      "dodgeRateBonus": 0.15
    }
  },
  {
    "id": "linh_lung_that_khieu",
    "name": "Linh Lung Thất Khiếu",
    "description": "Trái tim có bảy khiếu thông thiên, thấu hiểu vạn vật, ngộ tính và đan đạo đều tuyệt đỉnh.",
    "sourceDescription": "Trái tim có bảy khiếu thông thiên, thấu hiểu vạn vật, ngộ tính và đan đạo đều tuyệt đỉnh.",
    "sourceVectorText": "Linh +4; Ngộ +25; Đạo tâm +20",
    "sourceEffectsText": "comprehension: x2.1, qiRate: x1.5, breakthrough: +20%, alchemy: +25%, mindStateBonus: +30",
    "tier": 4,
    "dimension": "mindset",
    "origin": "innate",
    "allowedRaces": [
      "human"
    ],
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
    "traitCost": 35,
    "innateDelta": {
      "comprehension": 12.5,
      "aptitude": 2
    },
    "learningAffinity": {},
    "modifiers": [
      {
        "key": "techniqueLearningFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 2.1,
        "sourceKey": "comprehension"
      },
      {
        "key": "qiRateFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.5,
        "sourceKey": "qiRate"
      },
      {
        "key": "breakthroughChanceBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.2,
        "sourceKey": "breakthrough"
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
        "value": 0.1,
        "sourceKey": "daoHeartVector"
      }
    ],
    "effects": [],
    "badge": "🫀",
    "color": "#fbbf24",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "comprehensionMultiplier": 2.1,
      "qiAbsorptionMultiplier": 1.5,
      "breakthroughChanceBonus": 0.2
    }
  },
  {
    "id": "kiem_tien_chuyen_the",
    "name": "Kiếm Tiên Chuyển Thế",
    "description": "Kiếm tâm thông minh, một nhành cỏ trong tay cũng hóa thành thần kiếm chém rách bầu trời.",
    "sourceDescription": "Kiếm tâm thông minh, một nhành cỏ trong tay cũng hóa thành thần kiếm chém rách bầu trời.",
    "sourceVectorText": "Chiến +36",
    "sourceEffectsText": "atk: x1.8, crit: +25%, atkSpeed: x1.3, willpowerBonus: +35",
    "tier": 4,
    "dimension": "combat",
    "origin": "reincarnation",
    "allowedRaces": [
      "human"
    ],
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [
      "reincarnation"
    ],
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
        "value": 1.8,
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
        "key": "attackSpeedFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.3,
        "sourceKey": "atkSpeed"
      },
      {
        "key": "willTrainingBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.175,
        "sourceKey": "willpowerBonus"
      }
    ],
    "effects": [],
    "badge": "⚔️",
    "color": "#fbbf24",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "combatPowerMultiplier": 1.8,
      "critRateBonus": 0.25,
      "attackSpeedMultiplier": 1.3
    }
  },
  {
    "id": "nhan_hoang_huyet_mach",
    "name": "Nhân Hoàng Huyết Mạch",
    "description": "Dòng máu của Nhân Hoàng thượng cổ thống lĩnh Cửu Châu, vạn dân quy phục, khí vận hộ thể.",
    "sourceDescription": "Dòng máu của Nhân Hoàng thượng cổ thống lĩnh Cửu Châu, vạn dân quy phục, khí vận hộ thể.",
    "sourceVectorText": "Linh +6; Thể +10; Chiến +8; Đạo tâm +13",
    "sourceEffectsText": "hp: x2.20, atk: x1.95, prestige: +100, willpowerBonus: +60, breakthrough: +28%, qiRate: x1.75, leadershipAura: +30%",
    "tier": 5,
    "dimension": "social",
    "origin": "lineage",
    "allowedRaces": [
      "human"
    ],
    "requiredLineageTags": [
      "human_imperial"
    ],
    "activation": [
      {
        "kind": "lineage",
        "key": "human_imperial"
      }
    ],
    "acquisition": [],
    "exclusiveGroups": [
      "ancestral_bloodline",
      "destiny_major"
    ],
    "conflictsWith": [],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: prestige, leadershipAura",
    "unmappedEffectKeys": [
      "prestige",
      "leadershipAura"
    ],
    "spawnWeight": 0,
    "traitCost": 60,
    "innateDelta": {
      "aptitude": 3,
      "physique": 5
    },
    "learningAffinity": {
      "combat": 8
    },
    "modifiers": [
      {
        "key": "healthFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 2.2,
        "sourceKey": "hp"
      },
      {
        "key": "attackFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.95,
        "sourceKey": "atk"
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
        "value": 1.75,
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
    "badge": "🍀",
    "color": "#fb7185",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "healthMultiplier": 2.2,
      "combatPowerMultiplier": 1.95,
      "breakthroughChanceBonus": 0.28,
      "qiAbsorptionMultiplier": 1.75
    }
  },
  {
    "id": "tien_thien_kiem_thai",
    "name": "Tiên Thiên Kiếm Thai",
    "description": "Đan điền tự thai nghén một thanh Tiên Thiên Bản Mệnh Kiếm, nhất kiếm phá vạn pháp.",
    "sourceDescription": "Đan điền tự thai nghén một thanh Tiên Thiên Bản Mệnh Kiếm, nhất kiếm phá vạn pháp.",
    "sourceVectorText": "Chiến +53",
    "sourceEffectsText": "atk: x2.35, crit: +40%, atkSpeed: x1.45, willpowerBonus: +50, swordAffinity: +70%",
    "tier": 5,
    "dimension": "combat",
    "origin": "innate",
    "allowedRaces": [
      "human"
    ],
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
    "traitCost": 60,
    "innateDelta": {},
    "learningAffinity": {
      "combat": 53
    },
    "modifiers": [
      {
        "key": "attackFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 2.35,
        "sourceKey": "atk"
      },
      {
        "key": "critChanceBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.4,
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
      "combatPowerMultiplier": 2.35,
      "critRateBonus": 0.4,
      "attackSpeedMultiplier": 1.45
    }
  },
  {
    "id": "trich_tien_lam_tran",
    "name": "Trích Tiên Lâm Trần",
    "description": "Chân Tiên trên chín tầng trời chuyển thế lịch kiếp, mang theo tiên vận và đạo cảnh siêu phàm.",
    "sourceDescription": "Chân Tiên trên chín tầng trời chuyển thế lịch kiếp, mang theo tiên vận và đạo cảnh siêu phàm.",
    "sourceVectorText": "Linh +10; Ngộ +33; Đạo tâm +27",
    "sourceEffectsText": "qiRate: x2.20, comprehension: x2.20, breakthrough: +32%, mindStateBonus: +55, heartDemonResistance: +55%, reincarnationMemory: +35%",
    "tier": 5,
    "dimension": "mindset",
    "origin": "reincarnation",
    "allowedRaces": [
      "human"
    ],
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [
      "reincarnation"
    ],
    "conflictsWith": [],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: heartDemonResistance, reincarnationMemory",
    "unmappedEffectKeys": [
      "heartDemonResistance",
      "reincarnationMemory"
    ],
    "spawnWeight": 0,
    "traitCost": 60,
    "innateDelta": {
      "comprehension": 16.5,
      "aptitude": 5
    },
    "learningAffinity": {},
    "modifiers": [
      {
        "key": "qiRateFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 2.2,
        "sourceKey": "qiRate"
      },
      {
        "key": "techniqueLearningFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 2.2,
        "sourceKey": "comprehension"
      },
      {
        "key": "breakthroughChanceBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.32,
        "sourceKey": "breakthrough"
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
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "qiAbsorptionMultiplier": 2.2,
      "comprehensionMultiplier": 2.2,
      "breakthroughChanceBonus": 0.32
    }
  },
  {
    "id": "phap_tu_thien_phu",
    "name": "Pháp Tu Thiên Phú",
    "description": "Khả năng vận dụng pháp quyết và điều khiển linh lực tinh tế hơn mức bình thường.",
    "sourceDescription": "Khả năng vận dụng pháp quyết và điều khiển linh lực tinh tế hơn mức bình thường.",
    "sourceVectorText": "Linh +24; Ngộ +3",
    "sourceEffectsText": "qiRate: x1.48, comprehension: x1.40, spellControl: +30%",
    "tier": 3,
    "dimension": "root",
    "origin": "innate",
    "allowedRaces": [
      "human"
    ],
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: spellControl",
    "unmappedEffectKeys": [
      "spellControl"
    ],
    "spawnWeight": 0,
    "traitCost": 18,
    "innateDelta": {
      "comprehension": 1.5,
      "aptitude": 12
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
        "value": 1.4,
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
      "comprehensionMultiplier": 1.4
    }
  },
  {
    "id": "kiem_cot",
    "name": "Kiếm Cốt",
    "description": "Xương cốt và tư thế tự nhiên phù hợp kiếm đạo, giảm thời gian làm quen với kiếm pháp.",
    "sourceDescription": "Xương cốt và tư thế tự nhiên phù hợp kiếm đạo, giảm thời gian làm quen với kiếm pháp.",
    "sourceVectorText": "Chiến +23",
    "sourceEffectsText": "atk: x1.40, crit: +20%, swordAffinity: +45%",
    "tier": 3,
    "dimension": "combat",
    "origin": "innate",
    "allowedRaces": [
      "human"
    ],
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
        "key": "critChanceBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.2,
        "sourceKey": "crit"
      }
    ],
    "effects": [],
    "badge": "⚔️",
    "color": "#a78bfa",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "combatPowerMultiplier": 1.4,
      "critRateBonus": 0.2
    }
  },
  {
    "id": "van_tu_dao_tam",
    "name": "Văn Tự Đạo Tâm",
    "description": "Có khả năng từ kinh văn, bia đá và cổ tự suy ra ý nghĩa sâu hơn.",
    "sourceDescription": "Có khả năng từ kinh văn, bia đá và cổ tự suy ra ý nghĩa sâu hơn.",
    "sourceVectorText": "Ngộ +15; Đạo tâm +13",
    "sourceEffectsText": "comprehension: x1.55, professionLearning: +25%, mindStateBonus: +20",
    "tier": 3,
    "dimension": "mindset",
    "origin": "innate",
    "allowedRaces": [
      "human"
    ],
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
    "traitCost": 18,
    "innateDelta": {
      "comprehension": 7.5
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
      "comprehensionMultiplier": 1.55
    }
  },
  {
    "id": "ngu_hanh_dao_the",
    "name": "Ngũ Hành Đạo Thể",
    "description": "Đạo thể cân bằng năm hành, thiên về ổn định, chuyển đổi thuộc tính và trận pháp.",
    "sourceDescription": "Đạo thể cân bằng năm hành, thiên về ổn định, chuyển đổi thuộc tính và trận pháp.",
    "sourceVectorText": "Linh +6; Ngộ +5; Thể +30",
    "sourceEffectsText": "qiRate: x1.75, comprehension: x1.65, breakthrough: +22%, fiveElementControl: +60%",
    "tier": 4,
    "dimension": "physique",
    "origin": "innate",
    "allowedRaces": [
      "human"
    ],
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [
      "major_physique"
    ],
    "conflictsWith": [],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: fiveElementControl",
    "unmappedEffectKeys": [
      "fiveElementControl"
    ],
    "spawnWeight": 0,
    "traitCost": 35,
    "innateDelta": {
      "comprehension": 2.5,
      "aptitude": 3,
      "physique": 15
    },
    "learningAffinity": {},
    "modifiers": [
      {
        "key": "qiRateFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.75,
        "sourceKey": "qiRate"
      },
      {
        "key": "techniqueLearningFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.65,
        "sourceKey": "comprehension"
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
    "badge": "🛡️",
    "color": "#fbbf24",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "qiAbsorptionMultiplier": 1.75,
      "comprehensionMultiplier": 1.65,
      "breakthroughChanceBonus": 0.22
    }
  },
  {
    "id": "kiem_tam_vo_cau",
    "name": "Kiếm Tâm Vô Cấu",
    "description": "Kiếm tâm ít tạp niệm, càng chuyên một kiếm đạo càng tăng tốc lĩnh ngộ.",
    "sourceDescription": "Kiếm tâm ít tạp niệm, càng chuyên một kiếm đạo càng tăng tốc lĩnh ngộ.",
    "sourceVectorText": "Chiến +36",
    "sourceEffectsText": "atk: x1.80, crit: +32%, swordAffinity: +65%, heartDemonResistance: +30%",
    "tier": 4,
    "dimension": "combat",
    "origin": "innate",
    "allowedRaces": [
      "human"
    ],
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: swordAffinity, heartDemonResistance",
    "unmappedEffectKeys": [
      "swordAffinity",
      "heartDemonResistance"
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
        "value": 1.8,
        "sourceKey": "atk"
      },
      {
        "key": "critChanceBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.32,
        "sourceKey": "crit"
      }
    ],
    "effects": [],
    "badge": "⚔️",
    "color": "#fbbf24",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "combatPowerMultiplier": 1.8,
      "critRateBonus": 0.32
    }
  },
  {
    "id": "van_dao_tien_cot",
    "name": "Vạn Đạo Tiên Cốt",
    "description": "Cốt cách có khả năng dung nạp nhiều hệ pháp tắc mà ít xung đột, thiên về đa đạo.",
    "sourceDescription": "Cốt cách có khả năng dung nạp nhiều hệ pháp tắc mà ít xung đột, thiên về đa đạo.",
    "sourceVectorText": "Linh +10; Ngộ +10; Thể +42",
    "sourceEffectsText": "qiRate: x2.20, comprehension: x2.25, breakthrough: +30%, techniqueCompatibility: +70%",
    "tier": 5,
    "dimension": "physique",
    "origin": "innate",
    "allowedRaces": [
      "human"
    ],
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [
      "major_physique"
    ],
    "conflictsWith": [],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: techniqueCompatibility",
    "unmappedEffectKeys": [
      "techniqueCompatibility"
    ],
    "spawnWeight": 0,
    "traitCost": 60,
    "innateDelta": {
      "comprehension": 5,
      "aptitude": 5,
      "physique": 21
    },
    "learningAffinity": {},
    "modifiers": [
      {
        "key": "qiRateFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 2.2,
        "sourceKey": "qiRate"
      },
      {
        "key": "techniqueLearningFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 2.25,
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
    "badge": "🛡️",
    "color": "#fb7185",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "qiAbsorptionMultiplier": 2.2,
      "comprehensionMultiplier": 2.25,
      "breakthroughChanceBonus": 0.3
    }
  },
  {
    "id": "nhan_dao_thanh_nhan",
    "name": "Nhân Đạo Thánh Nhân",
    "description": "Có thiên phú tập hợp nhân tâm và từ quan hệ xã hội lĩnh hội Nhân Đạo, mạnh khi dẫn dắt cộng đồng.",
    "sourceDescription": "Có thiên phú tập hợp nhân tâm và từ quan hệ xã hội lĩnh hội Nhân Đạo, mạnh khi dẫn dắt cộng đồng.",
    "sourceVectorText": "Ngộ +8; Đạo tâm +13",
    "sourceEffectsText": "prestige: +110, comprehension: x2.00, leadership: +60%, factionGrowth: +40%, willpowerBonus: +60",
    "tier": 5,
    "dimension": "social",
    "origin": "innate",
    "allowedRaces": [
      "human"
    ],
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [
      "destiny_major"
    ],
    "conflictsWith": [],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: prestige, leadership, factionGrowth",
    "unmappedEffectKeys": [
      "prestige",
      "leadership",
      "factionGrowth"
    ],
    "spawnWeight": 0,
    "traitCost": 60,
    "innateDelta": {
      "comprehension": 4
    },
    "learningAffinity": {},
    "modifiers": [
      {
        "key": "techniqueLearningFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 2,
        "sourceKey": "comprehension"
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
      "comprehensionMultiplier": 2
    }
  }
];
