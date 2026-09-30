import { TraitDefinitionV3 } from './trait.types.ts';

export const BEAST_TRAITS_V3: readonly TraitDefinitionV3[] = [
  {
    "id": "da_tinh_kho_thuan",
    "name": "Dã Tính Khó Thuần",
    "description": "Bản tính hung hăng hoang dã chưa phai, khó tập trung ngồi thiền nhưng đánh nhau rất liều.",
    "sourceDescription": "Bản tính hung hăng hoang dã chưa phai, khó tập trung ngồi thiền nhưng đánh nhau rất liều.",
    "sourceVectorText": "Ngộ -5; Chiến +1; Đạo tâm +4",
    "sourceEffectsText": "atk: x1.15, comprehension: x0.7, mindStateBonus: -12",
    "tier": 1,
    "dimension": "mindset",
    "origin": "innate",
    "allowedRaces": [
      "beast"
    ],
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "active",
    "spawnWeight": 1,
    "traitCost": 3,
    "innateDelta": {
      "comprehension": -2.5
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
        "key": "techniqueLearningFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 0.7,
        "sourceKey": "comprehension"
      },
      {
        "key": "mentalEquilibriumBias",
        "mode": "add",
        "unit": "flat",
        "value": -12,
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
    "badge": "🧠",
    "color": "#94a3b8",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "combatPowerMultiplier": 1.15,
      "comprehensionMultiplier": 0.7
    }
  },
  {
    "id": "linh_tri_cham_mo",
    "name": "Linh Trí Chậm Mở",
    "description": "Lĩnh ngộ đạo lý chậm hơn đồng tộc, tư duy đơn giản nhưng khí huyết nguyên thủy dồi dào.",
    "sourceDescription": "Lĩnh ngộ đạo lý chậm hơn đồng tộc, tư duy đơn giản nhưng khí huyết nguyên thủy dồi dào.",
    "sourceVectorText": "Ngộ -8; Thể +1; Đạo tâm +4",
    "sourceEffectsText": "comprehension: x0.55, hp: x1.15, physique: +4",
    "tier": 1,
    "dimension": "mindset",
    "origin": "innate",
    "allowedRaces": [
      "beast"
    ],
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "active",
    "spawnWeight": 1,
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
      "comprehensionMultiplier": 0.55,
      "healthMultiplier": 1.15,
      "physiqueBonus": 4
    }
  },
  {
    "id": "huyet_mach_pha_tap",
    "name": "Huyết Mạch Pha Tạp",
    "description": "Huyết mạch trải qua nhiều đời đã loãng, khó thức tỉnh thần thông tổ tiên.",
    "sourceDescription": "Huyết mạch trải qua nhiều đời đã loãng, khó thức tỉnh thần thông tổ tiên.",
    "sourceVectorText": "Linh -5; Thể +6; Đạo tâm -4",
    "sourceEffectsText": "qiRate: x0.8, breakthrough: -10%, dodge: +8%",
    "tier": 1,
    "dimension": "physique",
    "origin": "lineage",
    "allowedRaces": [
      "beast"
    ],
    "requiredLineageTags": [
      "beast_mixed"
    ],
    "activation": [
      {
        "kind": "lineage",
        "key": "beast_mixed"
      }
    ],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "active",
    "spawnWeight": 1,
    "traitCost": 3,
    "innateDelta": {
      "aptitude": -2.5,
      "physique": 3
    },
    "learningAffinity": {},
    "modifiers": [
      {
        "key": "qiRateFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 0.8,
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
        "value": -0.02,
        "sourceKey": "daoHeartVector"
      }
    ],
    "effects": [],
    "badge": "🛡️",
    "color": "#94a3b8",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "qiAbsorptionMultiplier": 0.8,
      "breakthroughChanceBonus": -0.1,
      "dodgeRateBonus": 0.08
    }
  },
  {
    "id": "so_lua_bam_sinh",
    "name": "Sợ Lửa Bẩm Sinh",
    "description": "Bộ lông hoặc lớp da nhạy cảm với nhiệt độ cao, bản năng e ngại hỏa diễm và sấm sét.",
    "sourceDescription": "Bộ lông hoặc lớp da nhạy cảm với nhiệt độ cao, bản năng e ngại hỏa diễm và sấm sét.",
    "sourceVectorText": "Thể +3; Đạo tâm -2",
    "sourceEffectsText": "def: -6, moveSpeed: x1.12, willpowerBonus: -10",
    "tier": 1,
    "dimension": "survival",
    "origin": "innate",
    "allowedRaces": [
      "beast"
    ],
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
    "learningAffinity": {},
    "modifiers": [
      {
        "key": "defenseFlat",
        "mode": "add",
        "unit": "flat",
        "value": -6,
        "sourceKey": "def"
      },
      {
        "key": "moveSpeedFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.12,
        "sourceKey": "moveSpeed"
      },
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
    "badge": "🍖",
    "color": "#94a3b8",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "defenseBonus": -6,
      "moveSpeedMultiplier": 1.12
    }
  },
  {
    "id": "tap_tinh_ngu_dong",
    "name": "Tập Tính Ngủ Đông",
    "description": "Tiêu hao rất ít thức ăn và tuổi thọ dài hơn, nhưng cử động có phần chậm chạp.",
    "sourceDescription": "Tiêu hao rất ít thức ăn và tuổi thọ dài hơn, nhưng cử động có phần chậm chạp.",
    "sourceVectorText": "Thể +3; Đạo tâm +2",
    "sourceEffectsText": "hungerRate: x0.6, lifespan: +40, moveSpeed: x0.85",
    "tier": 1,
    "dimension": "survival",
    "origin": "innate",
    "allowedRaces": [
      "beast"
    ],
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
    "learningAffinity": {},
    "modifiers": [
      {
        "key": "hungerRateFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 0.6,
        "sourceKey": "hungerRate"
      },
      {
        "key": "lifespanYears",
        "mode": "add",
        "unit": "years",
        "value": 40,
        "sourceKey": "lifespan"
      },
      {
        "key": "moveSpeedFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 0.85,
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
    "badge": "🍖",
    "color": "#94a3b8",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "hungerRateMultiplier": 0.6,
      "lifespanBonus": 40,
      "moveSpeedMultiplier": 0.85
    }
  },
  {
    "id": "da_tinh_nguyen_thuy",
    "name": "Dã Tính Nguyên Thủy",
    "description": "Giữ trọn bản năng săn mồi của dã thú rừng sâu, tốc độ và sức cắn xé kinh người.",
    "sourceDescription": "Giữ trọn bản năng săn mồi của dã thú rừng sâu, tốc độ và sức cắn xé kinh người.",
    "sourceVectorText": "Ngộ -10; Thể +7; Chiến +2; Đạo tâm +3",
    "sourceEffectsText": "moveSpeed: x1.3, atk: x1.25, comprehension: x0.6",
    "tier": 2,
    "dimension": "survival",
    "origin": "innate",
    "allowedRaces": [
      "beast"
    ],
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "active",
    "spawnWeight": 1,
    "traitCost": 8,
    "innateDelta": {
      "comprehension": -5,
      "physique": 3.5
    },
    "learningAffinity": {
      "combat": 2
    },
    "modifiers": [
      {
        "key": "moveSpeedFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.3,
        "sourceKey": "moveSpeed"
      },
      {
        "key": "attackFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.25,
        "sourceKey": "atk"
      },
      {
        "key": "techniqueLearningFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 0.6,
        "sourceKey": "comprehension"
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
    "badge": "🐾",
    "color": "#34d399",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "moveSpeedMultiplier": 1.3,
      "combatPowerMultiplier": 1.25,
      "comprehensionMultiplier": 0.6
    }
  },
  {
    "id": "man_hoang_cu_luc",
    "name": "Man Hoang Cự Lực",
    "description": "Mang dòng máu cự thú thời man hoang (Hùng/Viên), một tát vỗ nát tảng đá lớn.",
    "sourceDescription": "Mang dòng máu cự thú thời man hoang (Hùng/Viên), một tát vỗ nát tảng đá lớn.",
    "sourceVectorText": "Thể +14; Chiến +2; Nghệ +2",
    "sourceEffectsText": "atk: x1.3, hp: x1.25, craftingSpeed: x1.3, physique: +8",
    "tier": 2,
    "dimension": "physique",
    "origin": "innate",
    "allowedRaces": [
      "beast"
    ],
    "allowedSpecies": [
      "bear",
      "ape",
      "tiger",
      "dragon"
    ],
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
        "key": "healthFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.25,
        "sourceKey": "hp"
      },
      {
        "key": "workSpeedFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.3,
        "sourceKey": "craftingSpeed"
      },
      {
        "key": "legacyPhysiqueFlat",
        "mode": "add",
        "unit": "flat",
        "value": 8,
        "sourceKey": "physique"
      }
    ],
    "effects": [],
    "badge": "💪",
    "color": "#34d399",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "combatPowerMultiplier": 1.3,
      "healthMultiplier": 1.25,
      "craftingSpeedMultiplier": 1.3,
      "physiqueBonus": 8
    }
  },
  {
    "id": "thiet_giap_lan_phien",
    "name": "Thiết Giáp Lân Phiến",
    "description": "Toàn thân phủ lớp vảy hoặc da dày cứng như sắt nguội, giảm mạnh sát thương vật lý.",
    "sourceDescription": "Toàn thân phủ lớp vảy hoặc da dày cứng như sắt nguội, giảm mạnh sát thương vật lý.",
    "sourceVectorText": "Thể +14",
    "sourceEffectsText": "armor: +15, def: +12, hp: x1.2",
    "tier": 2,
    "dimension": "physique",
    "origin": "innate",
    "allowedRaces": [
      "beast"
    ],
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
        "key": "armorFlat",
        "mode": "add",
        "unit": "flat",
        "value": 15,
        "sourceKey": "armor"
      },
      {
        "key": "defenseFlat",
        "mode": "add",
        "unit": "flat",
        "value": 12,
        "sourceKey": "def"
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
    "color": "#34d399",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "armorBonus": 15,
      "defenseBonus": 12,
      "healthMultiplier": 1.2
    }
  },
  {
    "id": "loi_trao_xe_gio",
    "name": "Lợi Trảo Xé Gió",
    "description": "Móng vuốt sắc bén như thần binh lợi khí (Hổ/Báo/Lang), mỗi cú vồ dễ gây chí mạng.",
    "sourceDescription": "Móng vuốt sắc bén như thần binh lợi khí (Hổ/Báo/Lang), mỗi cú vồ dễ gây chí mạng.",
    "sourceVectorText": "Chiến +14",
    "sourceEffectsText": "crit: +16%, atk: x1.25, atkSpeed: x1.15",
    "tier": 2,
    "dimension": "combat",
    "origin": "innate",
    "allowedRaces": [
      "beast"
    ],
    "allowedSpecies": [
      "tiger",
      "leopard",
      "wolf",
      "bear",
      "dragon"
    ],
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
        "value": 0.16,
        "sourceKey": "crit"
      },
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
      }
    ],
    "effects": [],
    "badge": "⚔️",
    "color": "#34d399",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "critRateBonus": 0.16,
      "combatPowerMultiplier": 1.25,
      "attackSpeedMultiplier": 1.15
    }
  },
  {
    "id": "son_lam_chi_vuong",
    "name": "Sơn Lâm Chi Vương",
    "description": "Uy thế chúa sơn lâm khiến bách thú tầm thường phải cúi đầu nhường đường.",
    "sourceDescription": "Uy thế chúa sơn lâm khiến bách thú tầm thường phải cúi đầu nhường đường.",
    "sourceVectorText": "Chiến +2; Đạo tâm +4",
    "sourceEffectsText": "prestige: +25, atk: x1.2, willpowerBonus: +20",
    "tier": 2,
    "dimension": "social",
    "origin": "innate",
    "allowedRaces": [
      "beast"
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
        "value": 0.02,
        "sourceKey": "daoHeartVector"
      }
    ],
    "effects": [],
    "badge": "🍀",
    "color": "#34d399",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "combatPowerMultiplier": 1.2
    }
  },
  {
    "id": "phong_duc_phi_hanh",
    "name": "Phong Dực Phi Hành",
    "description": "Đôi cánh chim ưng/tiên hạc cưỡi gió lướt mây, tốc độ di chuyển và né tránh vượt trội.",
    "sourceDescription": "Đôi cánh chim ưng/tiên hạc cưỡi gió lướt mây, tốc độ di chuyển và né tránh vượt trội.",
    "sourceVectorText": "Thể +7; Đạo tâm +3",
    "sourceEffectsText": "moveSpeed: x1.3, dodge: +18%",
    "tier": 2,
    "dimension": "survival",
    "origin": "innate",
    "allowedRaces": [
      "beast"
    ],
    "allowedSpecies": [
      "eagle",
      "crane",
      "dragon"
    ],
    "activation": [
      {
        "kind": "capability",
        "key": "hasWings"
      }
    ],
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
        "value": 1.3,
        "sourceKey": "moveSpeed"
      },
      {
        "key": "dodgeChanceBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.18,
        "sourceKey": "dodge"
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
      "moveSpeedMultiplier": 1.3,
      "dodgeRateBonus": 0.18
    }
  },
  {
    "id": "linh_giac_bao_nguy",
    "name": "Linh Giác Báo Nguy",
    "description": "Linh thú (Lộc/Thỏ) có trực giác thiên nhiên cực nhạy trước tai họa và sát khí.",
    "sourceDescription": "Linh thú (Lộc/Thỏ) có trực giác thiên nhiên cực nhạy trước tai họa và sát khí.",
    "sourceVectorText": "Ngộ +7; Đạo tâm +8",
    "sourceEffectsText": "dodge: +20%, moveSpeed: x1.2, mindStateBonus: +15",
    "tier": 2,
    "dimension": "mindset",
    "origin": "innate",
    "allowedRaces": [
      "beast"
    ],
    "allowedSpecies": [
      "deer",
      "rabbit"
    ],
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
        "value": 0.2,
        "sourceKey": "dodge"
      },
      {
        "key": "moveSpeedFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.2,
        "sourceKey": "moveSpeed"
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
      "dodgeRateBonus": 0.2,
      "moveSpeedMultiplier": 1.2
    }
  },
  {
    "id": "thuc_than_thao_thiet",
    "name": "Huyết Mạch Thao Thiết",
    "description": "Dạ dày có thể tiêu hóa vạn vật thành tinh lực tu luyện, nhưng lúc nào cũng đói cồn cào.",
    "sourceDescription": "Dạ dày có thể tiêu hóa vạn vật thành tinh lực tu luyện, nhưng lúc nào cũng đói cồn cào.",
    "sourceVectorText": "Linh +3; Thể +15; Chiến +2; Đạo tâm +5",
    "sourceEffectsText": "hungerRate: x1.55, hp: x1.5, qiRate: x1.4, atk: x1.3",
    "tier": 3,
    "dimension": "survival",
    "origin": "innate",
    "allowedRaces": [
      "beast"
    ],
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [
      "tich_coc_tien_the"
    ],
    "implementation": "active",
    "spawnWeight": 1,
    "traitCost": 18,
    "innateDelta": {
      "aptitude": 1.5,
      "physique": 7.5
    },
    "learningAffinity": {
      "combat": 2
    },
    "modifiers": [
      {
        "key": "hungerRateFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.55,
        "sourceKey": "hungerRate"
      },
      {
        "key": "healthFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.5,
        "sourceKey": "hp"
      },
      {
        "key": "qiRateFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.4,
        "sourceKey": "qiRate"
      },
      {
        "key": "attackFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.3,
        "sourceKey": "atk"
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
    "conflicts": [
      "tich_coc_tien_the"
    ],
    "statModifiers": {
      "hungerRateMultiplier": 1.55,
      "healthMultiplier": 1.5,
      "qiAbsorptionMultiplier": 1.4,
      "combatPowerMultiplier": 1.3
    }
  },
  {
    "id": "thanh_khau_ho_huyet",
    "name": "Thanh Khâu Hồ Huyết",
    "description": "Huyết mạch Hồ tộc núi Thanh Khâu, thông minh tuyệt đỉnh, thân pháp uyển chuyển mê hoặc.",
    "sourceDescription": "Huyết mạch Hồ tộc núi Thanh Khâu, thông minh tuyệt đỉnh, thân pháp uyển chuyển mê hoặc.",
    "sourceVectorText": "Linh +3; Ngộ +16; Đạo tâm +13",
    "sourceEffectsText": "comprehension: x1.65, dodge: +22%, qiRate: x1.4, mindStateBonus: +20",
    "tier": 3,
    "dimension": "mindset",
    "origin": "lineage",
    "allowedRaces": [
      "beast"
    ],
    "allowedSpecies": [
      "fox"
    ],
    "requiredLineageTags": [
      "fox"
    ],
    "activation": [
      {
        "kind": "lineage",
        "key": "fox"
      }
    ],
    "acquisition": [],
    "exclusiveGroups": [
      "ancestral_bloodline"
    ],
    "conflictsWith": [],
    "implementation": "planned",
    "deferredReason": "Dòng dõi huyết mạch [fox] chưa có nguồn tổ tiên/loài hỗ trợ trong lõi",
    "spawnWeight": 0,
    "traitCost": 18,
    "innateDelta": {
      "comprehension": 8,
      "aptitude": 1.5
    },
    "learningAffinity": {},
    "modifiers": [
      {
        "key": "techniqueLearningFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.65,
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
        "key": "qiRateFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.4,
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
      "comprehensionMultiplier": 1.65,
      "dodgeRateBonus": 0.22,
      "qiAbsorptionMultiplier": 1.4
    }
  },
  {
    "id": "loi_bang_vu_duc",
    "name": "Lôi Bằng Vũ Dực",
    "description": "Mang một tia huyết mạch Kim Sí Đại Bằng, lao xuống như sấm sét xé toạc bầu trời.",
    "sourceDescription": "Mang một tia huyết mạch Kim Sí Đại Bằng, lao xuống như sấm sét xé toạc bầu trời.",
    "sourceVectorText": "Chiến +23",
    "sourceEffectsText": "moveSpeed: x1.45, atkSpeed: x1.3, crit: +18%, atk: x1.4",
    "tier": 3,
    "dimension": "combat",
    "origin": "innate",
    "allowedRaces": [
      "beast"
    ],
    "allowedSpecies": [
      "eagle",
      "crane",
      "dragon"
    ],
    "activation": [
      {
        "kind": "capability",
        "key": "hasWings"
      }
    ],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "active",
    "spawnWeight": 1,
    "traitCost": 18,
    "innateDelta": {},
    "learningAffinity": {
      "combat": 23
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
        "key": "attackSpeedFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.3,
        "sourceKey": "atkSpeed"
      },
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
        "value": 1.4,
        "sourceKey": "atk"
      }
    ],
    "effects": [],
    "badge": "⚔️",
    "color": "#a78bfa",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "moveSpeedMultiplier": 1.45,
      "attackSpeedMultiplier": 1.3,
      "critRateBonus": 0.18,
      "combatPowerMultiplier": 1.4
    }
  },
  {
    "id": "huyen_quy_tho_nguyen",
    "name": "Huyền Quy Thọ Nguyên",
    "description": "Huyết mạch Huyền Quy cổ đại, giáp lưng dày không thể phá vỡ và tuổi thọ trường tồn.",
    "sourceDescription": "Huyết mạch Huyền Quy cổ đại, giáp lưng dày không thể phá vỡ và tuổi thọ trường tồn.",
    "sourceVectorText": "Thể +20",
    "sourceEffectsText": "lifespan: +220, armor: +25, def: +25, moveSpeed: x0.85",
    "tier": 3,
    "dimension": "physique",
    "origin": "innate",
    "allowedRaces": [
      "beast"
    ],
    "allowedSpecies": [
      "turtle"
    ],
    "activation": [
      {
        "kind": "capability",
        "key": "hasShell"
      }
    ],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "planned",
    "deferredReason": "Yêu cầu hình thể loài [turtle] chưa có trong danh mục ngoại hình",
    "spawnWeight": 0,
    "traitCost": 18,
    "innateDelta": {
      "physique": 10
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
        "key": "armorFlat",
        "mode": "add",
        "unit": "flat",
        "value": 25,
        "sourceKey": "armor"
      },
      {
        "key": "defenseFlat",
        "mode": "add",
        "unit": "flat",
        "value": 25,
        "sourceKey": "def"
      },
      {
        "key": "moveSpeedFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 0.85,
        "sourceKey": "moveSpeed"
      }
    ],
    "effects": [],
    "badge": "🛡️",
    "color": "#a78bfa",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "lifespanBonus": 220,
      "armorBonus": 25,
      "defenseBonus": 25,
      "moveSpeedMultiplier": 0.85
    }
  },
  {
    "id": "bach_ho_sat_phat",
    "name": "Bạch Hổ Sát Phạt",
    "description": "Thừa hưởng Canh Kim sát khí của Bạch Hổ, móng vuốt chém đứt mọi hộ thể cương khí.",
    "sourceDescription": "Thừa hưởng Canh Kim sát khí của Bạch Hổ, móng vuốt chém đứt mọi hộ thể cương khí.",
    "sourceVectorText": "Chiến +24",
    "sourceEffectsText": "atk: x1.55, crit: +22%, willpowerBonus: +25",
    "tier": 3,
    "dimension": "combat",
    "origin": "innate",
    "allowedRaces": [
      "beast"
    ],
    "allowedSpecies": [
      "tiger",
      "leopard"
    ],
    "activation": [
      {
        "kind": "capability",
        "key": "feline"
      }
    ],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [],
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
        "key": "critChanceBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.22,
        "sourceKey": "crit"
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
    "badge": "⚔️",
    "color": "#a78bfa",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "combatPowerMultiplier": 1.55,
      "critRateBonus": 0.22
    }
  },
  {
    "id": "thong_linh_bao_the",
    "name": "Thông Linh Bảo Thể",
    "description": "Thân thể linh thú thuần khiết hòa hợp với linh mạch tự nhiên, tu luyện nhanh gấp bội.",
    "sourceDescription": "Thân thể linh thú thuần khiết hòa hợp với linh mạch tự nhiên, tu luyện nhanh gấp bội.",
    "sourceVectorText": "Linh +24",
    "sourceEffectsText": "qiRate: x1.55, breakthrough: +18%, mindStateBonus: +25",
    "tier": 3,
    "dimension": "root",
    "origin": "innate",
    "allowedRaces": [
      "beast"
    ],
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "active",
    "spawnWeight": 1,
    "traitCost": 18,
    "innateDelta": {
      "aptitude": 12
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
        "value": 0.18,
        "sourceKey": "breakthrough"
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
    "badge": "🌟",
    "color": "#a78bfa",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "qiAbsorptionMultiplier": 1.55,
      "breakthroughChanceBonus": 0.18
    }
  },
  {
    "id": "yeu_dan_tinh_thuan",
    "name": "Yêu Đan Tinh Thuần",
    "description": "Yêu đan kết tụ trong cơ thể tròn trịa không tỳ vết, dự trữ yêu lực và thọ nguyên dồi dào.",
    "sourceDescription": "Yêu đan kết tụ trong cơ thể tròn trịa không tỳ vết, dự trữ yêu lực và thọ nguyên dồi dào.",
    "sourceVectorText": "Linh +24; Thể +4",
    "sourceEffectsText": "qiRate: x1.55, hp: x1.45, breakthrough: +15%, lifespan: +120",
    "tier": 3,
    "dimension": "root",
    "origin": "acquired",
    "allowedRaces": [
      "beast"
    ],
    "activation": [],
    "acquisition": [
      {
        "kind": "minRealm",
        "value": 3
      },
      {
        "kind": "achievement",
        "key": "beast_core_quality_pure",
        "value": 1
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
      "cultivation": 24
    },
    "modifiers": [
      {
        "key": "qiRateFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.55,
        "sourceKey": "qiRate"
      },
      {
        "key": "healthFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.45,
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
        "key": "lifespanYears",
        "mode": "add",
        "unit": "years",
        "value": 120,
        "sourceKey": "lifespan"
      }
    ],
    "effects": [],
    "badge": "🌟",
    "color": "#a78bfa",
    "category": "experience",
    "conflicts": [],
    "statModifiers": {
      "qiAbsorptionMultiplier": 1.55,
      "healthMultiplier": 1.45,
      "breakthroughChanceBonus": 0.15,
      "lifespanBonus": 120
    }
  },
  {
    "id": "bach_thu_trieu_bai",
    "name": "Bách Thú Triều Bái",
    "description": "Huyết mạch vương giả trong Yêu tộc, tiếng gầm vang vọng khiến muôn thú thần phục.",
    "sourceDescription": "Huyết mạch vương giả trong Yêu tộc, tiếng gầm vang vọng khiến muôn thú thần phục.",
    "sourceVectorText": "Thể +2; Chiến +2; Đạo tâm +6",
    "sourceEffectsText": "prestige: +50, atk: x1.3, hp: x1.3, willpowerBonus: +25",
    "tier": 3,
    "dimension": "social",
    "origin": "innate",
    "allowedRaces": [
      "beast"
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
      "physique": 1
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
        "key": "healthFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.3,
        "sourceKey": "hp"
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
      "combatPowerMultiplier": 1.3,
      "healthMultiplier": 1.3
    }
  },
  {
    "id": "long_huyet_ba_the",
    "name": "Long Huyết Bá Thể",
    "description": "Trong người chảy dòng máu Chân Long thượng cổ, long uy cuồn cuộn, nhục thân bá đạo.",
    "sourceDescription": "Trong người chảy dòng máu Chân Long thượng cổ, long uy cuồn cuộn, nhục thân bá đạo.",
    "sourceVectorText": "Thể +39; Chiến +6",
    "sourceEffectsText": "hp: x2.1, atk: x1.8, armor: +25, lifespan: +250, willpowerBonus: +40",
    "tier": 4,
    "dimension": "physique",
    "origin": "lineage",
    "allowedRaces": [
      "beast"
    ],
    "allowedSpecies": [
      "dragon"
    ],
    "requiredLineageTags": [
      "dragon"
    ],
    "activation": [
      {
        "kind": "lineage",
        "key": "dragon"
      }
    ],
    "acquisition": [],
    "exclusiveGroups": [
      "ancestral_bloodline"
    ],
    "conflictsWith": [
      "bach_benh_quan_than"
    ],
    "implementation": "active",
    "spawnWeight": 1,
    "traitCost": 35,
    "innateDelta": {
      "physique": 19.5
    },
    "learningAffinity": {
      "combat": 6
    },
    "modifiers": [
      {
        "key": "healthFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 2.1,
        "sourceKey": "hp"
      },
      {
        "key": "attackFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.8,
        "sourceKey": "atk"
      },
      {
        "key": "armorFlat",
        "mode": "add",
        "unit": "flat",
        "value": 25,
        "sourceKey": "armor"
      },
      {
        "key": "lifespanYears",
        "mode": "add",
        "unit": "years",
        "value": 250,
        "sourceKey": "lifespan"
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
    "badge": "🐉",
    "color": "#fbbf24",
    "category": "innate",
    "conflicts": [
      "bach_benh_quan_than"
    ],
    "statModifiers": {
      "healthMultiplier": 2.1,
      "combatPowerMultiplier": 1.8,
      "armorBonus": 25,
      "lifespanBonus": 250
    }
  },
  {
    "id": "cuu_vi_thien_ho",
    "name": "Cửu Vĩ Thiên Hồ",
    "description": "Huyết mạch Cửu Vĩ Thiên Hồ hoàng tộc, ngộ tính ngang ngửa Tiên Thiên Đạo Thể của Nhân tộc.",
    "sourceDescription": "Huyết mạch Cửu Vĩ Thiên Hồ hoàng tộc, ngộ tính ngang ngửa Tiên Thiên Đạo Thể của Nhân tộc.",
    "sourceVectorText": "Linh +8; Ngộ +25; Đạo tâm +20",
    "sourceEffectsText": "comprehension: x2.1, qiRate: x2, dodge: +30%, mindStateBonus: +40, breakthrough: +25%",
    "tier": 4,
    "dimension": "mindset",
    "origin": "lineage",
    "allowedRaces": [
      "beast"
    ],
    "allowedSpecies": [
      "fox"
    ],
    "requiredLineageTags": [
      "fox"
    ],
    "activation": [
      {
        "kind": "lineage",
        "key": "fox"
      }
    ],
    "acquisition": [],
    "exclusiveGroups": [
      "ancestral_bloodline"
    ],
    "conflictsWith": [],
    "implementation": "planned",
    "deferredReason": "Dòng dõi huyết mạch [fox] chưa có nguồn tổ tiên/loài hỗ trợ trong lõi",
    "spawnWeight": 0,
    "traitCost": 35,
    "innateDelta": {
      "comprehension": 12.5,
      "aptitude": 4
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
        "value": 2,
        "sourceKey": "qiRate"
      },
      {
        "key": "dodgeChanceBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.3,
        "sourceKey": "dodge"
      },
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
        "value": 0.25,
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
      "comprehensionMultiplier": 2.1,
      "qiAbsorptionMultiplier": 2,
      "dodgeRateBonus": 0.3,
      "breakthroughChanceBonus": 0.25
    }
  },
  {
    "id": "bat_tu_phuong_huyet",
    "name": "Bất Tử Phượng Huyết",
    "description": "Mang dòng máu Phượng Hoàng niết bàn trong biển lửa, sinh cơ mãnh liệt và chân hỏa hộ thân.",
    "sourceDescription": "Mang dòng máu Phượng Hoàng niết bàn trong biển lửa, sinh cơ mãnh liệt và chân hỏa hộ thân.",
    "sourceVectorText": "Linh +7; Thể +39; Chiến +6",
    "sourceEffectsText": "hp: x2.1, qiRate: x1.9, atk: x1.7, lifespan: +300, breakthrough: +20%",
    "tier": 4,
    "dimension": "physique",
    "origin": "lineage",
    "allowedRaces": [
      "beast"
    ],
    "allowedSpecies": [
      "phoenix"
    ],
    "requiredLineageTags": [
      "phoenix"
    ],
    "activation": [
      {
        "kind": "lineage",
        "key": "phoenix"
      }
    ],
    "acquisition": [],
    "exclusiveGroups": [
      "ancestral_bloodline"
    ],
    "conflictsWith": [],
    "implementation": "planned",
    "deferredReason": "Dòng dõi huyết mạch [phoenix] chưa có nguồn tổ tiên/loài hỗ trợ trong lõi",
    "spawnWeight": 0,
    "traitCost": 35,
    "innateDelta": {
      "aptitude": 3.5,
      "physique": 19.5
    },
    "learningAffinity": {
      "combat": 6
    },
    "modifiers": [
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
        "value": 1.9,
        "sourceKey": "qiRate"
      },
      {
        "key": "attackFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.7,
        "sourceKey": "atk"
      },
      {
        "key": "lifespanYears",
        "mode": "add",
        "unit": "years",
        "value": 300,
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
    "color": "#fbbf24",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "healthMultiplier": 2.1,
      "qiAbsorptionMultiplier": 1.9,
      "combatPowerMultiplier": 1.7,
      "lifespanBonus": 300,
      "breakthroughChanceBonus": 0.2
    }
  },
  {
    "id": "thuy_thu_ky_lan",
    "name": "Thụy Thú Kỳ Lân",
    "description": "Thụy thú mang điềm lành của trời đất, đi tới đâu linh khí tụ hội, thiên kiếp không nỡ đánh mạnh.",
    "sourceDescription": "Thụy thú mang điềm lành của trời đất, đi tới đâu linh khí tụ hội, thiên kiếp không nỡ đánh mạnh.",
    "sourceVectorText": "Linh +8; Đạo tâm +9",
    "sourceEffectsText": "breakthrough: +25%, qiRate: x2, prestige: +60, heartDemonResistance: +40%",
    "tier": 4,
    "dimension": "social",
    "origin": "innate",
    "allowedRaces": [
      "beast"
    ],
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [
      "destiny_major"
    ],
    "conflictsWith": [],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: prestige, heartDemonResistance",
    "unmappedEffectKeys": [
      "prestige",
      "heartDemonResistance"
    ],
    "spawnWeight": 0,
    "traitCost": 35,
    "innateDelta": {
      "aptitude": 4
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
        "value": 2,
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
    "conflicts": [],
    "statModifiers": {
      "breakthroughChanceBonus": 0.25,
      "qiAbsorptionMultiplier": 2
    }
  },
  {
    "id": "thuong_co_cung_ky",
    "name": "Thượng Cổ Cùng Kỳ",
    "description": "Huyết mạch Tứ Đại Hung Thú thượng cổ, càng chém giết càng hung tàn bất khả chiến bại.",
    "sourceDescription": "Huyết mạch Tứ Đại Hung Thú thượng cổ, càng chém giết càng hung tàn bất khả chiến bại.",
    "sourceVectorText": "Chiến +37",
    "sourceEffectsText": "atk: x1.9, crit: +28%, atkSpeed: x1.3, willpowerBonus: +35",
    "tier": 4,
    "dimension": "combat",
    "origin": "innate",
    "allowedRaces": [
      "beast"
    ],
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "active",
    "spawnWeight": 1,
    "traitCost": 35,
    "innateDelta": {},
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
        "value": 0.28,
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
      "combatPowerMultiplier": 1.9,
      "critRateBonus": 0.28,
      "attackSpeedMultiplier": 1.3
    }
  },
  {
    "id": "hoa_hinh_hoan_my",
    "name": "Hóa Hình Hoàn Mỹ",
    "description": "Phá bỏ hoàn toàn gông cùm linh trí của thú loại, vừa có nhục thân Yêu tộc vừa có ngộ tính Nhân tộc.",
    "sourceDescription": "Phá bỏ hoàn toàn gông cùm linh trí của thú loại, vừa có nhục thân Yêu tộc vừa có ngộ tính Nhân tộc.",
    "sourceVectorText": "Linh +36; Ngộ +9; Thể +6",
    "sourceEffectsText": "comprehension: x2.1, qiRate: x1.8, hp: x1.8, breakthrough: +25%",
    "tier": 4,
    "dimension": "root",
    "origin": "acquired",
    "allowedRaces": [
      "beast"
    ],
    "activation": [],
    "acquisition": [
      {
        "kind": "minRealm",
        "value": 2
      },
      {
        "kind": "achievement",
        "key": "beast_perfect_transformation",
        "value": 1
      }
    ],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "planned",
    "deferredReason": "Chưa có producer sự kiện thành tựu tương ứng trong lõi",
    "spawnWeight": 0,
    "traitCost": 35,
    "innateDelta": {},
    "learningAffinity": {
      "cultivation": 36
    },
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
        "value": 1.8,
        "sourceKey": "qiRate"
      },
      {
        "key": "healthFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.8,
        "sourceKey": "hp"
      },
      {
        "key": "breakthroughChanceBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.25,
        "sourceKey": "breakthrough"
      }
    ],
    "effects": [],
    "badge": "🌟",
    "color": "#fbbf24",
    "category": "experience",
    "conflicts": [],
    "statModifiers": {
      "comprehensionMultiplier": 2.1,
      "qiAbsorptionMultiplier": 1.8,
      "healthMultiplier": 1.8,
      "breakthroughChanceBonus": 0.25
    }
  },
  {
    "id": "to_long_chan_huyet",
    "name": "Tổ Long Chân Huyết",
    "description": "Huyết mạch phản tổ đạt tới cấp độ Thủy Tổ Chân Long, nhục thân nghiền nát chư thiên vạn giới.",
    "sourceDescription": "Huyết mạch phản tổ đạt tới cấp độ Thủy Tổ Chân Long, nhục thân nghiền nát chư thiên vạn giới.",
    "sourceVectorText": "Thể +56; Chiến +10",
    "sourceEffectsText": "hp: x2.70, atk: x2.25, armor: +50, lifespan: +600, willpowerBonus: +60, dragonBloodline: +100%",
    "tier": 5,
    "dimension": "physique",
    "origin": "lineage",
    "allowedRaces": [
      "beast"
    ],
    "allowedSpecies": [
      "dragon"
    ],
    "requiredLineageTags": [
      "dragon"
    ],
    "activation": [
      {
        "kind": "lineage",
        "key": "dragon"
      }
    ],
    "acquisition": [],
    "exclusiveGroups": [
      "ancestral_bloodline"
    ],
    "conflictsWith": [],
    "evolvesFrom": "long_huyet_ba_the",
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: dragonBloodline",
    "unmappedEffectKeys": [
      "dragonBloodline"
    ],
    "spawnWeight": 0,
    "traitCost": 60,
    "innateDelta": {
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
        "key": "lifespanYears",
        "mode": "add",
        "unit": "years",
        "value": 600,
        "sourceKey": "lifespan"
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
      "lifespanBonus": 600
    }
  },
  {
    "id": "con_bang_thon_thien",
    "name": "Côn Bằng Thôn Thiên",
    "description": "Hóa Côn nuốt biển, hóa Bằng vỗ cánh chín vạn dặm, tốc độ và lực thôn phệ đứng đầu thái cổ.",
    "sourceDescription": "Hóa Côn nuốt biển, hóa Bằng vỗ cánh chín vạn dặm, tốc độ và lực thôn phệ đứng đầu thái cổ.",
    "sourceVectorText": "Linh +10; Chiến +51",
    "sourceEffectsText": "moveSpeed: x1.95, dodge: +40%, atk: x2.15, qiRate: x2.20, devourEfficiency: +35%",
    "tier": 5,
    "dimension": "combat",
    "origin": "innate",
    "allowedRaces": [
      "beast"
    ],
    "allowedSpecies": [
      "eagle",
      "crane",
      "dragon"
    ],
    "activation": [
      {
        "kind": "capability",
        "key": "hasWings"
      }
    ],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: devourEfficiency; Yêu cầu hình thể loài [eagle, crane, dragon] chưa có trong danh mục ngoại hình",
    "unmappedEffectKeys": [
      "devourEfficiency"
    ],
    "spawnWeight": 0,
    "traitCost": 60,
    "innateDelta": {
      "aptitude": 5
    },
    "learningAffinity": {
      "combat": 51
    },
    "modifiers": [
      {
        "key": "moveSpeedFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.95,
        "sourceKey": "moveSpeed"
      },
      {
        "key": "dodgeChanceBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.4,
        "sourceKey": "dodge"
      },
      {
        "key": "attackFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 2.15,
        "sourceKey": "atk"
      },
      {
        "key": "qiRateFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 2.2,
        "sourceKey": "qiRate"
      }
    ],
    "effects": [],
    "badge": "⚔️",
    "color": "#fb7185",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "moveSpeedMultiplier": 1.95,
      "dodgeRateBonus": 0.4,
      "combatPowerMultiplier": 2.15,
      "qiAbsorptionMultiplier": 2.2
    }
  },
  {
    "id": "hong_hoang_di_chung",
    "name": "Hồng Hoang Dị Chủng",
    "description": "Sinh linh thần dị sót lại từ thời Hồng Hoang sơ khai, mỗi giọt máu đều chứa pháp tắc nguyên thủy.",
    "sourceDescription": "Sinh linh thần dị sót lại từ thời Hồng Hoang sơ khai, mỗi giọt máu đều chứa pháp tắc nguyên thủy.",
    "sourceVectorText": "Linh +53; Thể +12; Chiến +8",
    "sourceEffectsText": "hp: x2.45, qiRate: x2.35, atk: x2.05, breakthrough: +30%, lifespan: +700, primalLawAffinity: +45%",
    "tier": 5,
    "dimension": "root",
    "origin": "innate",
    "allowedRaces": [
      "beast"
    ],
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: primalLawAffinity",
    "unmappedEffectKeys": [
      "primalLawAffinity"
    ],
    "spawnWeight": 0,
    "traitCost": 60,
    "innateDelta": {
      "aptitude": 26.5,
      "physique": 6
    },
    "learningAffinity": {
      "combat": 8
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
        "value": 2.05,
        "sourceKey": "atk"
      },
      {
        "key": "breakthroughChanceBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.3,
        "sourceKey": "breakthrough"
      },
      {
        "key": "lifespanYears",
        "mode": "add",
        "unit": "years",
        "value": 700,
        "sourceKey": "lifespan"
      }
    ],
    "effects": [],
    "badge": "🌟",
    "color": "#fb7185",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "healthMultiplier": 2.45,
      "qiAbsorptionMultiplier": 2.35,
      "combatPowerMultiplier": 2.05,
      "breakthroughChanceBonus": 0.3,
      "lifespanBonus": 700
    }
  },
  {
    "id": "van_yeu_chi_to",
    "name": "Vạn Yêu Chi Tổ",
    "description": "Yêu Đế tái thế, thống ngự vạn yêu thiên hạ, mở ra thời đại hoàng kim cho Yêu tộc.",
    "sourceDescription": "Yêu Đế tái thế, thống ngự vạn yêu thiên hạ, mở ra thời đại hoàng kim cho Yêu tộc.",
    "sourceVectorText": "Linh +9; Ngộ +8; Chiến +8; Đạo tâm +13",
    "sourceEffectsText": "qiRate: x2.10, comprehension: x2.05, atk: x2.00, prestige: +120, willpowerBonus: +65, mindStateBonus: +50, beastCommand: +50%",
    "tier": 5,
    "dimension": "social",
    "origin": "innate",
    "allowedRaces": [
      "beast"
    ],
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [
      "destiny_major"
    ],
    "conflictsWith": [],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: prestige, beastCommand",
    "unmappedEffectKeys": [
      "prestige",
      "beastCommand"
    ],
    "spawnWeight": 0,
    "traitCost": 60,
    "innateDelta": {
      "comprehension": 4,
      "aptitude": 4.5
    },
    "learningAffinity": {
      "combat": 8
    },
    "modifiers": [
      {
        "key": "qiRateFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 2.1,
        "sourceKey": "qiRate"
      },
      {
        "key": "techniqueLearningFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 2.05,
        "sourceKey": "comprehension"
      },
      {
        "key": "attackFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 2,
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
    "badge": "🍀",
    "color": "#fb7185",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "qiAbsorptionMultiplier": 2.1,
      "comprehensionMultiplier": 2.05,
      "combatPowerMultiplier": 2
    }
  },
  {
    "id": "lang_quan_tap_tinh",
    "name": "Lang Quần Tập Tính",
    "description": "Bản năng bầy đàn mạnh, chiến đấu tốt hơn khi ở cạnh đồng loại nhưng khó độc hành.",
    "sourceDescription": "Bản năng bầy đàn mạnh, chiến đấu tốt hơn khi ở cạnh đồng loại nhưng khó độc hành.",
    "sourceVectorText": "Đạo tâm +2",
    "sourceEffectsText": "squadDamage: +10%, squadDefense: +10%, soloMorale: -10%",
    "tier": 1,
    "dimension": "social",
    "origin": "lineage",
    "allowedRaces": [
      "beast"
    ],
    "allowedSpecies": [
      "wolf"
    ],
    "requiredLineageTags": [
      "wolf"
    ],
    "activation": [
      {
        "kind": "lineage",
        "key": "wolf"
      }
    ],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: squadDamage, squadDefense, soloMorale; Dòng dõi huyết mạch [wolf] chưa có nguồn tổ tiên/loài hỗ trợ trong lõi",
    "unmappedEffectKeys": [
      "squadDamage",
      "squadDefense",
      "soloMorale"
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
    "id": "linh_loc_minh_cam",
    "name": "Linh Lộc Mẫn Cảm",
    "description": "Huyết mạch linh lộc nhạy với biến đổi linh khí và nguy hiểm tự nhiên.",
    "sourceDescription": "Huyết mạch linh lộc nhạy với biến đổi linh khí và nguy hiểm tự nhiên.",
    "sourceVectorText": "Ngộ +7; Đạo tâm +8",
    "sourceEffectsText": "dodge: +16%, mindStateBonus: +15, herbDetection: +25%",
    "tier": 2,
    "dimension": "mindset",
    "origin": "lineage",
    "allowedRaces": [
      "beast"
    ],
    "allowedSpecies": [
      "deer"
    ],
    "requiredLineageTags": [
      "deer"
    ],
    "activation": [
      {
        "kind": "lineage",
        "key": "deer"
      }
    ],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: herbDetection; Dòng dõi huyết mạch [deer] chưa có nguồn tổ tiên/loài hỗ trợ trong lõi",
    "unmappedEffectKeys": [
      "herbDetection"
    ],
    "spawnWeight": 0,
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
        "value": 0.16,
        "sourceKey": "dodge"
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
      "dodgeRateBonus": 0.16
    }
  },
  {
    "id": "cu_vien_cuong_co",
    "name": "Cự Viên Cường Cốt",
    "description": "Huyết mạch viên loại tăng lực tay và khả năng leo trèo, thích hợp cận chiến.",
    "sourceDescription": "Huyết mạch viên loại tăng lực tay và khả năng leo trèo, thích hợp cận chiến.",
    "sourceVectorText": "Thể +13; Chiến +2",
    "sourceEffectsText": "atk: x1.28, hp: x1.18, climbSpeed: x1.40",
    "tier": 2,
    "dimension": "physique",
    "origin": "lineage",
    "allowedRaces": [
      "beast"
    ],
    "allowedSpecies": [
      "ape"
    ],
    "requiredLineageTags": [
      "ape"
    ],
    "activation": [
      {
        "kind": "lineage",
        "key": "ape"
      }
    ],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: climbSpeed; Dòng dõi huyết mạch [ape] chưa có nguồn tổ tiên/loài hỗ trợ trong lõi",
    "unmappedEffectKeys": [
      "climbSpeed"
    ],
    "spawnWeight": 0,
    "traitCost": 8,
    "innateDelta": {
      "physique": 6.5
    },
    "learningAffinity": {
      "combat": 2
    },
    "modifiers": [
      {
        "key": "attackFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.28,
        "sourceKey": "atk"
      },
      {
        "key": "healthFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.18,
        "sourceKey": "hp"
      }
    ],
    "effects": [],
    "badge": "🛡️",
    "color": "#34d399",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "combatPowerMultiplier": 1.28,
      "healthMultiplier": 1.18
    }
  },
  {
    "id": "tien_hac_thanh_khi",
    "name": "Tiên Hạc Thanh Khí",
    "description": "Huyết mạch hạc giúp thân nhẹ, khí tức ổn định và thích nghi không trung.",
    "sourceDescription": "Huyết mạch hạc giúp thân nhẹ, khí tức ổn định và thích nghi không trung.",
    "sourceVectorText": "Linh +1; Thể +7; Đạo tâm +3",
    "sourceEffectsText": "moveSpeed: x1.25, qiRate: x1.15, dodge: +12%",
    "tier": 2,
    "dimension": "survival",
    "origin": "lineage",
    "allowedRaces": [
      "beast"
    ],
    "allowedSpecies": [
      "crane",
      "eagle"
    ],
    "requiredLineageTags": [
      "avian"
    ],
    "activation": [
      {
        "kind": "lineage",
        "key": "avian"
      }
    ],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "active",
    "spawnWeight": 1,
    "traitCost": 8,
    "innateDelta": {
      "aptitude": 0.5,
      "physique": 3.5
    },
    "learningAffinity": {},
    "modifiers": [
      {
        "key": "moveSpeedFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.25,
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
        "key": "dodgeChanceBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.12,
        "sourceKey": "dodge"
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
      "moveSpeedMultiplier": 1.25,
      "qiAbsorptionMultiplier": 1.15,
      "dodgeRateBonus": 0.12
    }
  },
  {
    "id": "xich_ho_me_anh",
    "name": "Xích Hồ Mê Ảnh",
    "description": "Huyết mạch hồ ly thiên về ảo ảnh, đánh lạc hướng và né tránh.",
    "sourceDescription": "Huyết mạch hồ ly thiên về ảo ảnh, đánh lạc hướng và né tránh.",
    "sourceVectorText": "Chiến +20",
    "sourceEffectsText": "dodge: +25%, crit: +16%, illusionAffinity: +45%",
    "tier": 3,
    "dimension": "combat",
    "origin": "lineage",
    "allowedRaces": [
      "beast"
    ],
    "allowedSpecies": [
      "fox"
    ],
    "requiredLineageTags": [
      "fox"
    ],
    "activation": [
      {
        "kind": "lineage",
        "key": "fox"
      }
    ],
    "acquisition": [],
    "exclusiveGroups": [
      "ancestral_bloodline"
    ],
    "conflictsWith": [],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: illusionAffinity; Dòng dõi huyết mạch [fox] chưa có nguồn tổ tiên/loài hỗ trợ trong lõi",
    "unmappedEffectKeys": [
      "illusionAffinity"
    ],
    "spawnWeight": 0,
    "traitCost": 18,
    "innateDelta": {},
    "learningAffinity": {
      "combat": 20
    },
    "modifiers": [
      {
        "key": "dodgeChanceBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.25,
        "sourceKey": "dodge"
      },
      {
        "key": "critChanceBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.16,
        "sourceKey": "crit"
      }
    ],
    "effects": [],
    "badge": "⚔️",
    "color": "#a78bfa",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "dodgeRateBonus": 0.25,
      "critRateBonus": 0.16
    }
  },
  {
    "id": "kim_giac_te_huyet",
    "name": "Kim Giác Tê Huyết",
    "description": "Huyết mạch tê giác cổ tăng khả năng va chạm và chống phá giáp.",
    "sourceDescription": "Huyết mạch tê giác cổ tăng khả năng va chạm và chống phá giáp.",
    "sourceVectorText": "Thể +24",
    "sourceEffectsText": "hp: x1.55, armor: +25, chargeDamage: +35%",
    "tier": 3,
    "dimension": "physique",
    "origin": "lineage",
    "allowedRaces": [
      "beast"
    ],
    "allowedSpecies": [
      "rhino"
    ],
    "requiredLineageTags": [
      "rhino"
    ],
    "activation": [
      {
        "kind": "lineage",
        "key": "rhino"
      }
    ],
    "acquisition": [],
    "exclusiveGroups": [
      "ancestral_bloodline"
    ],
    "conflictsWith": [],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: chargeDamage; Dòng dõi huyết mạch [rhino] chưa có nguồn tổ tiên/loài hỗ trợ trong lõi",
    "unmappedEffectKeys": [
      "chargeDamage"
    ],
    "spawnWeight": 0,
    "traitCost": 18,
    "innateDelta": {
      "physique": 12
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
        "key": "armorFlat",
        "mode": "add",
        "unit": "flat",
        "value": 25,
        "sourceKey": "armor"
      }
    ],
    "effects": [],
    "legacyAliases": [
      "kim_giac_tê_huyet"
    ],
    "badge": "🛡️",
    "color": "#a78bfa",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "healthMultiplier": 1.55,
      "armorBonus": 25
    }
  },
  {
    "id": "thanh_xa_doc_mach",
    "name": "Thanh Xà Độc Mạch",
    "description": "Kinh mạch chứa độc linh lực, bản thân kháng độc và có thể luyện hóa độc khí.",
    "sourceDescription": "Kinh mạch chứa độc linh lực, bản thân kháng độc và có thể luyện hóa độc khí.",
    "sourceVectorText": "Linh +23",
    "sourceEffectsText": "qiRate: x1.35, poisonResistance: +55%, poisonDamage: +35%",
    "tier": 3,
    "dimension": "root",
    "origin": "lineage",
    "allowedRaces": [
      "beast"
    ],
    "allowedSpecies": [
      "snake"
    ],
    "requiredLineageTags": [
      "snake"
    ],
    "activation": [
      {
        "kind": "lineage",
        "key": "snake"
      }
    ],
    "acquisition": [],
    "exclusiveGroups": [
      "ancestral_bloodline"
    ],
    "conflictsWith": [],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: poisonResistance, poisonDamage; Dòng dõi huyết mạch [snake] chưa có nguồn tổ tiên/loài hỗ trợ trong lõi",
    "unmappedEffectKeys": [
      "poisonResistance",
      "poisonDamage"
    ],
    "spawnWeight": 0,
    "traitCost": 18,
    "innateDelta": {
      "aptitude": 11.5
    },
    "learningAffinity": {},
    "modifiers": [
      {
        "key": "qiRateFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.35,
        "sourceKey": "qiRate"
      }
    ],
    "effects": [],
    "badge": "🌟",
    "color": "#a78bfa",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "qiAbsorptionMultiplier": 1.35
    }
  },
  {
    "id": "nguyet_lang_huyet",
    "name": "Nguyệt Lang Huyết",
    "description": "Huyết mạch lang tộc cộng hưởng ánh trăng, tăng truy kích và phối hợp bầy đàn vào ban đêm.",
    "sourceDescription": "Huyết mạch lang tộc cộng hưởng ánh trăng, tăng truy kích và phối hợp bầy đàn vào ban đêm.",
    "sourceVectorText": "Chiến +23",
    "sourceEffectsText": "moveSpeed: x1.40, atk: x1.38, nightCombat: +30%, squadDamage: +15%",
    "tier": 3,
    "dimension": "combat",
    "origin": "lineage",
    "allowedRaces": [
      "beast"
    ],
    "allowedSpecies": [
      "wolf"
    ],
    "requiredLineageTags": [
      "wolf"
    ],
    "activation": [
      {
        "kind": "lineage",
        "key": "wolf"
      }
    ],
    "acquisition": [],
    "exclusiveGroups": [
      "ancestral_bloodline"
    ],
    "conflictsWith": [],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: nightCombat, squadDamage; Dòng dõi huyết mạch [wolf] chưa có nguồn tổ tiên/loài hỗ trợ trong lõi",
    "unmappedEffectKeys": [
      "nightCombat",
      "squadDamage"
    ],
    "spawnWeight": 0,
    "traitCost": 18,
    "innateDelta": {},
    "learningAffinity": {
      "combat": 23
    },
    "modifiers": [
      {
        "key": "moveSpeedFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.4,
        "sourceKey": "moveSpeed"
      },
      {
        "key": "attackFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.38,
        "sourceKey": "atk"
      }
    ],
    "effects": [],
    "badge": "⚔️",
    "color": "#a78bfa",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "moveSpeedMultiplier": 1.4,
      "combatPowerMultiplier": 1.38
    }
  },
  {
    "id": "huyen_vu_giap_mach",
    "name": "Huyền Vũ Giáp Mạch",
    "description": "Dòng máu Huyền Vũ tăng phòng ngự và sức bền hơn là sát thương.",
    "sourceDescription": "Dòng máu Huyền Vũ tăng phòng ngự và sức bền hơn là sát thương.",
    "sourceVectorText": "Thể +38",
    "sourceEffectsText": "hp: x2.00, armor: +38, def: +35, moveSpeed: x0.88",
    "tier": 4,
    "dimension": "physique",
    "origin": "lineage",
    "allowedRaces": [
      "beast"
    ],
    "allowedSpecies": [
      "turtle"
    ],
    "requiredLineageTags": [
      "turtle"
    ],
    "activation": [
      {
        "kind": "lineage",
        "key": "turtle"
      }
    ],
    "acquisition": [],
    "exclusiveGroups": [
      "ancestral_bloodline"
    ],
    "conflictsWith": [],
    "implementation": "planned",
    "deferredReason": "Dòng dõi huyết mạch [turtle] chưa có nguồn tổ tiên/loài hỗ trợ trong lõi",
    "spawnWeight": 0,
    "traitCost": 35,
    "innateDelta": {
      "physique": 19
    },
    "learningAffinity": {},
    "modifiers": [
      {
        "key": "healthFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 2,
        "sourceKey": "hp"
      },
      {
        "key": "armorFlat",
        "mode": "add",
        "unit": "flat",
        "value": 38,
        "sourceKey": "armor"
      },
      {
        "key": "defenseFlat",
        "mode": "add",
        "unit": "flat",
        "value": 35,
        "sourceKey": "def"
      },
      {
        "key": "moveSpeedFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 0.88,
        "sourceKey": "moveSpeed"
      }
    ],
    "effects": [],
    "badge": "🛡️",
    "color": "#fbbf24",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "healthMultiplier": 2,
      "armorBonus": 38,
      "defenseBonus": 35,
      "moveSpeedMultiplier": 0.88
    }
  },
  {
    "id": "chu_tuoc_hoa_mach",
    "name": "Chu Tước Hỏa Mạch",
    "description": "Huyết mạch Chu Tước cho chân hỏa tinh thuần và khả năng hồi sinh hạn chế qua hỏa kiếp.",
    "sourceDescription": "Huyết mạch Chu Tước cho chân hỏa tinh thuần và khả năng hồi sinh hạn chế qua hỏa kiếp.",
    "sourceVectorText": "Linh +36; Chiến +6",
    "sourceEffectsText": "qiRate: x1.75, atk: x1.70, fireAffinity: +70%, phoenixReviveCharge: +1",
    "tier": 4,
    "dimension": "root",
    "origin": "lineage",
    "allowedRaces": [
      "beast"
    ],
    "allowedSpecies": [
      "phoenix"
    ],
    "requiredLineageTags": [
      "phoenix"
    ],
    "activation": [
      {
        "kind": "lineage",
        "key": "phoenix"
      }
    ],
    "acquisition": [],
    "exclusiveGroups": [
      "ancestral_bloodline"
    ],
    "conflictsWith": [],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: fireAffinity, phoenixReviveCharge; Dòng dõi huyết mạch [phoenix] chưa có nguồn tổ tiên/loài hỗ trợ trong lõi",
    "unmappedEffectKeys": [
      "fireAffinity",
      "phoenixReviveCharge"
    ],
    "spawnWeight": 0,
    "traitCost": 35,
    "innateDelta": {
      "aptitude": 18
    },
    "learningAffinity": {
      "combat": 6
    },
    "modifiers": [
      {
        "key": "qiRateFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.75,
        "sourceKey": "qiRate"
      },
      {
        "key": "attackFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.7,
        "sourceKey": "atk"
      }
    ],
    "effects": [],
    "badge": "🌟",
    "color": "#fbbf24",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "qiAbsorptionMultiplier": 1.75,
      "combatPowerMultiplier": 1.7
    }
  },
  {
    "id": "bach_trach_thong_hue",
    "name": "Bạch Trạch Thông Tuệ",
    "description": "Huyết mạch Bạch Trạch giỏi nhận biết yêu tà, dị thú và tri thức cổ xưa.",
    "sourceDescription": "Huyết mạch Bạch Trạch giỏi nhận biết yêu tà, dị thú và tri thức cổ xưa.",
    "sourceVectorText": "Ngộ +24; Đạo tâm +20",
    "sourceEffectsText": "comprehension: x1.95, heartDemonResistance: +38%, creatureKnowledge: +60%",
    "tier": 4,
    "dimension": "mindset",
    "origin": "lineage",
    "allowedRaces": [
      "beast"
    ],
    "allowedSpecies": [
      "bai_ze"
    ],
    "requiredLineageTags": [
      "bai_ze"
    ],
    "activation": [
      {
        "kind": "lineage",
        "key": "bai_ze"
      }
    ],
    "acquisition": [],
    "exclusiveGroups": [
      "ancestral_bloodline"
    ],
    "conflictsWith": [],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: heartDemonResistance, creatureKnowledge; Dòng dõi huyết mạch [bai_ze] chưa có nguồn tổ tiên/loài hỗ trợ trong lõi",
    "unmappedEffectKeys": [
      "heartDemonResistance",
      "creatureKnowledge"
    ],
    "spawnWeight": 0,
    "traitCost": 35,
    "innateDelta": {
      "comprehension": 12
    },
    "learningAffinity": {},
    "modifiers": [
      {
        "key": "techniqueLearningFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.95,
        "sourceKey": "comprehension"
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
      "comprehensionMultiplier": 1.95
    }
  },
  {
    "id": "thanh_long_moc_mach",
    "name": "Thanh Long Mộc Mạch",
    "description": "Huyết mạch Thanh Long thiên về sinh cơ, mộc pháp và uy áp long tộc.",
    "sourceDescription": "Huyết mạch Thanh Long thiên về sinh cơ, mộc pháp và uy áp long tộc.",
    "sourceVectorText": "Linh +5; Thể +38",
    "sourceEffectsText": "hp: x1.95, qiRate: x1.65, regeneration: +35%, woodAffinity: +60%",
    "tier": 4,
    "dimension": "physique",
    "origin": "lineage",
    "allowedRaces": [
      "beast"
    ],
    "allowedSpecies": [
      "dragon"
    ],
    "requiredLineageTags": [
      "dragon"
    ],
    "activation": [
      {
        "kind": "lineage",
        "key": "dragon"
      }
    ],
    "acquisition": [],
    "exclusiveGroups": [
      "ancestral_bloodline"
    ],
    "conflictsWith": [],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: regeneration, woodAffinity; Dòng dõi huyết mạch [dragon] chưa có nguồn tổ tiên/loài hỗ trợ trong lõi",
    "unmappedEffectKeys": [
      "regeneration",
      "woodAffinity"
    ],
    "spawnWeight": 0,
    "traitCost": 35,
    "innateDelta": {
      "aptitude": 2.5,
      "physique": 19
    },
    "learningAffinity": {},
    "modifiers": [
      {
        "key": "healthFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.95,
        "sourceKey": "hp"
      },
      {
        "key": "qiRateFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.65,
        "sourceKey": "qiRate"
      }
    ],
    "effects": [],
    "badge": "🛡️",
    "color": "#fbbf24",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "healthMultiplier": 1.95,
      "qiAbsorptionMultiplier": 1.65
    }
  },
  {
    "id": "ngu_phuong_than_huyet",
    "name": "Ngũ Phương Thần Huyết",
    "description": "Huyết mạch dung hợp dấu vết nhiều thần thú, linh hoạt nhưng đòi hỏi căn cơ rất cao.",
    "sourceDescription": "Huyết mạch dung hợp dấu vết nhiều thần thú, linh hoạt nhưng đòi hỏi căn cơ rất cao.",
    "sourceVectorText": "Linh +52; Thể +10",
    "sourceEffectsText": "qiRate: x2.30, hp: x2.20, elementCompatibility: +75%, bloodlineConflict: -60%",
    "tier": 5,
    "dimension": "root",
    "origin": "lineage",
    "allowedRaces": [
      "beast"
    ],
    "requiredLineageTags": [
      "mythic_beast"
    ],
    "activation": [
      {
        "kind": "lineage",
        "key": "mythic_beast"
      }
    ],
    "acquisition": [],
    "exclusiveGroups": [
      "ancestral_bloodline"
    ],
    "conflictsWith": [],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: elementCompatibility, bloodlineConflict; Dòng dõi huyết mạch [mythic_beast] chưa có nguồn tổ tiên/loài hỗ trợ trong lõi",
    "unmappedEffectKeys": [
      "elementCompatibility",
      "bloodlineConflict"
    ],
    "spawnWeight": 0,
    "traitCost": 60,
    "innateDelta": {
      "aptitude": 26,
      "physique": 5
    },
    "learningAffinity": {},
    "modifiers": [
      {
        "key": "qiRateFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 2.3,
        "sourceKey": "qiRate"
      },
      {
        "key": "healthFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 2.2,
        "sourceKey": "hp"
      }
    ],
    "effects": [],
    "badge": "🌟",
    "color": "#fb7185",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "qiAbsorptionMultiplier": 2.3,
      "healthMultiplier": 2.2
    }
  },
  {
    "id": "thien_yeu_phap_tuong",
    "name": "Thiên Yêu Pháp Tướng",
    "description": "Có thể thức tỉnh pháp tướng tổ huyết trong thời gian ngắn thay vì luôn duy trì chỉ số áp đảo.",
    "sourceDescription": "Có thể thức tỉnh pháp tướng tổ huyết trong thời gian ngắn thay vì luôn duy trì chỉ số áp đảo.",
    "sourceVectorText": "Thể +10; Chiến +52",
    "sourceEffectsText": "atk: x2.20, hp: x2.30, willpowerBonus: +55, ancestralAvatarPower: +70%",
    "tier": 5,
    "dimension": "combat",
    "origin": "lineage",
    "allowedRaces": [
      "beast"
    ],
    "requiredLineageTags": [
      "mythic_beast"
    ],
    "activation": [
      {
        "kind": "lineage",
        "key": "mythic_beast"
      }
    ],
    "acquisition": [],
    "exclusiveGroups": [
      "ancestral_bloodline"
    ],
    "conflictsWith": [],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: ancestralAvatarPower; Dòng dõi huyết mạch [mythic_beast] chưa có nguồn tổ tiên/loài hỗ trợ trong lõi",
    "unmappedEffectKeys": [
      "ancestralAvatarPower"
    ],
    "spawnWeight": 0,
    "traitCost": 60,
    "innateDelta": {
      "physique": 5
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
        "key": "healthFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 2.3,
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
      "healthMultiplier": 2.3
    }
  },
  {
    "id": "van_linh_cung_chu",
    "name": "Vạn Linh Cộng Chủ",
    "description": "Khí tức khiến nhiều linh thú tự nhiên bớt thù địch và dễ hình thành quần thể dưới quyền.",
    "sourceDescription": "Khí tức khiến nhiều linh thú tự nhiên bớt thù địch và dễ hình thành quần thể dưới quyền.",
    "sourceVectorText": "Đạo tâm +13; Khí vận +35",
    "sourceEffectsText": "prestige: +115, beastCommand: +65%, taming: +55%, fortune: +35",
    "tier": 5,
    "dimension": "social",
    "origin": "lineage",
    "allowedRaces": [
      "beast"
    ],
    "requiredLineageTags": [
      "mythic_beast"
    ],
    "activation": [
      {
        "kind": "lineage",
        "key": "mythic_beast"
      }
    ],
    "acquisition": [],
    "exclusiveGroups": [
      "ancestral_bloodline",
      "destiny_major"
    ],
    "conflictsWith": [],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: prestige, beastCommand, taming, fortune; Dòng dõi huyết mạch [mythic_beast] chưa có nguồn tổ tiên/loài hỗ trợ trong lõi",
    "unmappedEffectKeys": [
      "prestige",
      "beastCommand",
      "taming",
      "fortune"
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
  }
];
