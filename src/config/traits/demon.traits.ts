import { TraitDefinitionV3 } from './trait.types.ts';

export const DEMON_TRAITS_V3: readonly TraitDefinitionV3[] = [
  {
    "id": "ma_khi_phan_phe",
    "name": "Ma Khí Phản Phệ",
    "description": "Cơ thể chưa chịu nổi ma khí bá đạo, thỉnh thoảng kinh mạch đau nhức nhưng công kích tăng nhẹ.",
    "sourceDescription": "Cơ thể chưa chịu nổi ma khí bá đạo, thỉnh thoảng kinh mạch đau nhức nhưng công kích tăng nhẹ.",
    "sourceVectorText": "Thể +2; Chiến +1; Đạo tâm -4",
    "sourceEffectsText": "hp: x0.85, atk: x1.15, breakthrough: -8%",
    "tier": 1,
    "dimension": "physique",
    "origin": "innate",
    "allowedRaces": [
      "demon"
    ],
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "active",
    "spawnWeight": 1,
    "traitCost": 3,
    "innateDelta": {
      "physique": 1
    },
    "learningAffinity": {
      "combat": 1
    },
    "modifiers": [
      {
        "key": "healthFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 0.85,
        "sourceKey": "hp"
      },
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
        "value": -0.08,
        "sourceKey": "breakthrough"
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
      "healthMultiplier": 0.85,
      "combatPowerMultiplier": 1.15,
      "breakthroughChanceBonus": -0.08
    }
  },
  {
    "id": "khat_mau_mu_quang",
    "name": "Khát Máu Mù Quáng",
    "description": "Ngửi thấy mùi máu là mất hết lý trí, chỉ biết tấn công điên loạn không màng sống chết.",
    "sourceDescription": "Ngửi thấy mùi máu là mất hết lý trí, chỉ biết tấn công điên loạn không màng sống chết.",
    "sourceVectorText": "Ngộ -3; Chiến +1; Đạo tâm +4",
    "sourceEffectsText": "atk: x1.15, def: -10, mindStateBonus: -20, comprehension: x0.75",
    "tier": 1,
    "dimension": "mindset",
    "origin": "innate",
    "allowedRaces": [
      "demon"
    ],
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "active",
    "spawnWeight": 1,
    "traitCost": 3,
    "innateDelta": {
      "comprehension": -1.5
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
        "key": "defenseFlat",
        "mode": "add",
        "unit": "flat",
        "value": -10,
        "sourceKey": "def"
      },
      {
        "key": "mentalEquilibriumBias",
        "mode": "add",
        "unit": "flat",
        "value": -20,
        "sourceKey": "mindStateBonus"
      },
      {
        "key": "techniqueLearningFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 0.75,
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
      "combatPowerMultiplier": 1.15,
      "defenseBonus": -10,
      "comprehensionMultiplier": 0.75
    }
  },
  {
    "id": "so_anh_thien_duong",
    "name": "Sợ Ánh Thiên Dương",
    "description": "Thuộc dòng dõi ma vật u tối, dưới ánh mặt trời gay gắt cảm thấy bức bối khó chịu.",
    "sourceDescription": "Thuộc dòng dõi ma vật u tối, dưới ánh mặt trời gay gắt cảm thấy bức bối khó chịu.",
    "sourceVectorText": "Thể +1; Đạo tâm +2",
    "sourceEffectsText": "hp: x0.9, moveSpeed: x0.92, dodge: +10%",
    "tier": 1,
    "dimension": "survival",
    "origin": "innate",
    "allowedRaces": [
      "demon"
    ],
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "active",
    "spawnWeight": 1,
    "traitCost": 3,
    "innateDelta": {
      "physique": 0.5
    },
    "learningAffinity": {},
    "modifiers": [
      {
        "key": "healthFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 0.9,
        "sourceKey": "hp"
      },
      {
        "key": "moveSpeedFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 0.92,
        "sourceKey": "moveSpeed"
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
      "healthMultiplier": 0.9,
      "moveSpeedMultiplier": 0.92,
      "dodgeRateBonus": 0.1
    }
  },
  {
    "id": "ma_hon_ton_khuyet",
    "name": "Ma Hồn Tổn Khuyết",
    "description": "Thần hồn bẩm sinh có vết nứt, dễ bị tâm ma xâm nhập khi đột phá cảnh giới.",
    "sourceDescription": "Thần hồn bẩm sinh có vết nứt, dễ bị tâm ma xâm nhập khi đột phá cảnh giới.",
    "sourceVectorText": "Linh +1; Ngộ +3; Đạo tâm -5",
    "sourceEffectsText": "breakthrough: -15%, heartDemonResistance: -20%, qiRate: x1.15",
    "tier": 1,
    "dimension": "mindset",
    "origin": "innate",
    "allowedRaces": [
      "demon"
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
    "traitCost": 3,
    "innateDelta": {
      "comprehension": 1.5,
      "aptitude": 0.5
    },
    "learningAffinity": {},
    "modifiers": [
      {
        "key": "breakthroughChanceBonus",
        "mode": "add",
        "unit": "probability",
        "value": -0.15,
        "sourceKey": "breakthrough"
      },
      {
        "key": "qiRateFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.15,
        "sourceKey": "qiRate"
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
    "badge": "🧠",
    "color": "#94a3b8",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "breakthroughChanceBonus": -0.15,
      "qiAbsorptionMultiplier": 1.15
    }
  },
  {
    "id": "tan_nhan_da_nghi",
    "name": "Tàn Nhẫn Đa Nghi",
    "description": "Không bao giờ tin tưởng bất kỳ ai, luôn đề phòng cả đồng tộc nhưng ra đòn cực kỳ hiểm độc.",
    "sourceDescription": "Không bao giờ tin tưởng bất kỳ ai, luôn đề phòng cả đồng tộc nhưng ra đòn cực kỳ hiểm độc.",
    "sourceVectorText": "Đạo tâm +2",
    "sourceEffectsText": "crit: +12%, dodge: +8%, prestige: -20",
    "tier": 1,
    "dimension": "social",
    "origin": "innate",
    "allowedRaces": [
      "demon"
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
    "innateDelta": {},
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
    "badge": "🍀",
    "color": "#94a3b8",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "critRateBonus": 0.12,
      "dodgeRateBonus": 0.08
    }
  },
  {
    "id": "dien_cuong_khat_mau",
    "name": "Điên Cuồng Khát Máu",
    "description": "Bản tính hiếu sát của Ma tộc, càng chém giết càng hưng phấn nhưng làm tâm cảnh bất ổn.",
    "sourceDescription": "Bản tính hiếu sát của Ma tộc, càng chém giết càng hưng phấn nhưng làm tâm cảnh bất ổn.",
    "sourceVectorText": "Ngộ +7; Chiến +2; Đạo tâm +4",
    "sourceEffectsText": "atk: x1.3, crit: +15%, def: -10, breakthrough: -15%",
    "tier": 2,
    "dimension": "mindset",
    "origin": "innate",
    "allowedRaces": [
      "demon"
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
        "key": "defenseFlat",
        "mode": "add",
        "unit": "flat",
        "value": -10,
        "sourceKey": "def"
      },
      {
        "key": "breakthroughChanceBonus",
        "mode": "add",
        "unit": "probability",
        "value": -0.15,
        "sourceKey": "breakthrough"
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
    "badge": "🩸",
    "color": "#34d399",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "combatPowerMultiplier": 1.3,
      "critRateBonus": 0.15,
      "defenseBonus": -10,
      "breakthroughChanceBonus": -0.15
    }
  },
  {
    "id": "u_minh_quy_the",
    "name": "U Minh Quỷ Thể",
    "description": "Thân thể nửa thực nửa hư như u hồn địa phủ, di chuyển không tiếng động và khó bị đánh trúng.",
    "sourceDescription": "Thân thể nửa thực nửa hư như u hồn địa phủ, di chuyển không tiếng động và khó bị đánh trúng.",
    "sourceVectorText": "Thể +8",
    "sourceEffectsText": "dodge: +20%, moveSpeed: x1.25, crit: +10%, hp: x0.85",
    "tier": 2,
    "dimension": "physique",
    "origin": "innate",
    "allowedRaces": [
      "demon"
    ],
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [
      "thuan_duong_chi_the"
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
        "value": 1.25,
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
        "key": "healthFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 0.85,
        "sourceKey": "hp"
      }
    ],
    "effects": [],
    "badge": "👻",
    "color": "#34d399",
    "category": "innate",
    "conflicts": [
      "thuan_duong_chi_the"
    ],
    "statModifiers": {
      "dodgeRateBonus": 0.2,
      "moveSpeedMultiplier": 1.25,
      "critRateBonus": 0.1,
      "healthMultiplier": 0.85
    }
  },
  {
    "id": "phan_cot_nghich_tu",
    "name": "Phản Cốt Bẩm Sinh",
    "description": "Sinh ra đã mang xương phản nghịch, không chịu khuất phục cường quyền, ý chí bướng bỉnh.",
    "sourceDescription": "Sinh ra đã mang xương phản nghịch, không chịu khuất phục cường quyền, ý chí bướng bỉnh.",
    "sourceVectorText": "Chiến +2; Đạo tâm +4",
    "sourceEffectsText": "atk: x1.3, crit: +12%, prestige: -30, willpowerBonus: +22",
    "tier": 2,
    "dimension": "social",
    "origin": "innate",
    "allowedRaces": [
      "demon"
    ],
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [
      "kien_dinh_nhu_thiet",
      "trung_quan_ai_mon"
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
        "value": 0.12,
        "sourceKey": "crit"
      },
      {
        "key": "willTrainingBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.11,
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
    "badge": "🗡️",
    "color": "#34d399",
    "category": "innate",
    "conflicts": [
      "kien_dinh_nhu_thiet",
      "trung_quan_ai_mon"
    ],
    "statModifiers": {
      "combatPowerMultiplier": 1.3,
      "critRateBonus": 0.12
    }
  },
  {
    "id": "thuc_thi_hap_huyet",
    "name": "Thực Thi Hấp Huyết",
    "description": "Có thể hấp thu tinh huyết của con mồi để bù đắp cơn đói và phục hồi thương thế.",
    "sourceDescription": "Có thể hấp thu tinh huyết của con mồi để bù đắp cơn đói và phục hồi thương thế.",
    "sourceVectorText": "Thể +9; Chiến +2; Đạo tâm +3",
    "sourceEffectsText": "hungerRate: x0.55, hp: x1.3, atk: x1.2",
    "tier": 2,
    "dimension": "survival",
    "origin": "innate",
    "allowedRaces": [
      "demon"
    ],
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "active",
    "spawnWeight": 1,
    "traitCost": 8,
    "innateDelta": {
      "physique": 4.5
    },
    "learningAffinity": {
      "combat": 2
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
        "value": 1.3,
        "sourceKey": "hp"
      },
      {
        "key": "attackFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.2,
        "sourceKey": "atk"
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
      "hungerRateMultiplier": 0.55,
      "healthMultiplier": 1.3,
      "combatPowerMultiplier": 1.2
    }
  },
  {
    "id": "hac_am_an_sat",
    "name": "Hắc Ám Ẩn Sát",
    "description": "Hòa mình hoàn toàn vào bóng đêm, tung ra một đòn cắt cổ kết liễu mục tiêu.",
    "sourceDescription": "Hòa mình hoàn toàn vào bóng đêm, tung ra một đòn cắt cổ kết liễu mục tiêu.",
    "sourceVectorText": "Chiến +12",
    "sourceEffectsText": "crit: +20%, moveSpeed: x1.2, dodge: +12%",
    "tier": 2,
    "dimension": "combat",
    "origin": "innate",
    "allowedRaces": [
      "demon"
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
      "combat": 12
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
      }
    ],
    "effects": [],
    "badge": "⚔️",
    "color": "#34d399",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "critRateBonus": 0.2,
      "moveSpeedMultiplier": 1.2,
      "dodgeRateBonus": 0.12
    }
  },
  {
    "id": "ma_giap_ho_than",
    "name": "Ma Giáp Hộ Thân",
    "description": "Ma khí ngưng kết trên bề mặt da thành lớp giáp gai đen kịt, vừa chống đòn vừa hung dữ.",
    "sourceDescription": "Ma khí ngưng kết trên bề mặt da thành lớp giáp gai đen kịt, vừa chống đòn vừa hung dữ.",
    "sourceVectorText": "Thể +12; Chiến +1",
    "sourceEffectsText": "armor: +15, def: +14, atk: x1.15",
    "tier": 2,
    "dimension": "physique",
    "origin": "innate",
    "allowedRaces": [
      "demon"
    ],
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
      "combat": 1
    },
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
        "value": 14,
        "sourceKey": "def"
      },
      {
        "key": "attackFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.15,
        "sourceKey": "atk"
      }
    ],
    "effects": [],
    "badge": "🛡️",
    "color": "#34d399",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "armorBonus": 15,
      "defenseBonus": 14,
      "combatPowerMultiplier": 1.15
    }
  },
  {
    "id": "oan_khi_trien_than",
    "name": "Oán Khí Triền Thân",
    "description": "Quanh người luôn có oán hồn gào thét, làm kẻ địch khiếp sợ và tăng tốc độ hấp thu ma khí.",
    "sourceDescription": "Quanh người luôn có oán hồn gào thét, làm kẻ địch khiếp sợ và tăng tốc độ hấp thu ma khí.",
    "sourceVectorText": "Linh +14; Chiến +2",
    "sourceEffectsText": "qiRate: x1.3, atk: x1.25, mindStateBonus: -10",
    "tier": 2,
    "dimension": "root",
    "origin": "innate",
    "allowedRaces": [
      "demon"
    ],
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
    "learningAffinity": {
      "combat": 2
    },
    "modifiers": [
      {
        "key": "qiRateFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.3,
        "sourceKey": "qiRate"
      },
      {
        "key": "attackFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.25,
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
    "badge": "🌟",
    "color": "#34d399",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "qiAbsorptionMultiplier": 1.3,
      "combatPowerMultiplier": 1.25
    }
  },
  {
    "id": "thien_ma_huyet_the",
    "name": "Thiên Ma Huyết Thể",
    "description": "Huyết mạch quý tộc của Ma giới, sinh mệnh lực dồi dào và lực công kích tàn bạo.",
    "sourceDescription": "Huyết mạch quý tộc của Ma giới, sinh mệnh lực dồi dào và lực công kích tàn bạo.",
    "sourceVectorText": "Linh +3; Thể +25; Chiến +4",
    "sourceEffectsText": "hp: x1.6, atk: x1.55, qiRate: x1.4",
    "tier": 3,
    "dimension": "physique",
    "origin": "lineage",
    "allowedRaces": [
      "demon"
    ],
    "requiredLineageTags": [
      "demon_royal"
    ],
    "activation": [
      {
        "kind": "lineage",
        "key": "demon_royal"
      }
    ],
    "acquisition": [],
    "exclusiveGroups": [
      "ancestral_bloodline"
    ],
    "conflictsWith": [
      "tru_ma_tien_si",
      "xich_tu_chi_tam"
    ],
    "implementation": "active",
    "spawnWeight": 1,
    "traitCost": 18,
    "innateDelta": {
      "aptitude": 1.5,
      "physique": 12.5
    },
    "learningAffinity": {
      "combat": 4
    },
    "modifiers": [
      {
        "key": "healthFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.6,
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
        "key": "qiRateFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.4,
        "sourceKey": "qiRate"
      }
    ],
    "effects": [],
    "badge": "🩸",
    "color": "#a78bfa",
    "category": "innate",
    "conflicts": [
      "tru_ma_tien_si",
      "xich_tu_chi_tam"
    ],
    "statModifiers": {
      "healthMultiplier": 1.6,
      "combatPowerMultiplier": 1.55,
      "qiAbsorptionMultiplier": 1.4
    }
  },
  {
    "id": "huyet_hai_thao_thien",
    "name": "Huyết Hải Thao Thiên",
    "description": "Chân nguyên hóa thành biển máu ngập trời, nuốt chửng sinh cơ vạn vật xung quanh.",
    "sourceDescription": "Chân nguyên hóa thành biển máu ngập trời, nuốt chửng sinh cơ vạn vật xung quanh.",
    "sourceVectorText": "Linh +3; Thể +5; Chiến +24",
    "sourceEffectsText": "hp: x1.6, atk: x1.55, qiRate: x1.35",
    "tier": 3,
    "dimension": "combat",
    "origin": "innate",
    "allowedRaces": [
      "demon"
    ],
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "active",
    "spawnWeight": 1,
    "traitCost": 18,
    "innateDelta": {
      "aptitude": 1.5,
      "physique": 2.5
    },
    "learningAffinity": {
      "combat": 24
    },
    "modifiers": [
      {
        "key": "healthFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.6,
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
        "key": "qiRateFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.35,
        "sourceKey": "qiRate"
      }
    ],
    "effects": [],
    "badge": "⚔️",
    "color": "#a78bfa",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "healthMultiplier": 1.6,
      "combatPowerMultiplier": 1.55,
      "qiAbsorptionMultiplier": 1.35
    }
  },
  {
    "id": "cuu_u_ma_hoa",
    "name": "Cửu U Ma Hỏa",
    "description": "Khống chế ngọn lửa đen từ tầng đáy Cửu U, đốt cháy cả nhục thân lẫn linh hồn đối thủ.",
    "sourceDescription": "Khống chế ngọn lửa đen từ tầng đáy Cửu U, đốt cháy cả nhục thân lẫn linh hồn đối thủ.",
    "sourceVectorText": "Linh +23; Chiến +4",
    "sourceEffectsText": "atk: x1.55, crit: +18%, qiRate: x1.4",
    "tier": 3,
    "dimension": "root",
    "origin": "innate",
    "allowedRaces": [
      "demon"
    ],
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "active",
    "spawnWeight": 1,
    "traitCost": 18,
    "innateDelta": {
      "aptitude": 11.5
    },
    "learningAffinity": {
      "combat": 4
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
        "value": 0.18,
        "sourceKey": "crit"
      },
      {
        "key": "qiRateFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.4,
        "sourceKey": "qiRate"
      }
    ],
    "effects": [],
    "badge": "🌟",
    "color": "#a78bfa",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "combatPowerMultiplier": 1.55,
      "critRateBonus": 0.18,
      "qiAbsorptionMultiplier": 1.4
    }
  },
  {
    "id": "thon_hon_doat_phach",
    "name": "Thôn Hồn Đoạt Phách",
    "description": "Luyện hóa tàn hồn kẻ bại trận để tăng trưởng ngộ tính và tinh thần lực của bản thân.",
    "sourceDescription": "Luyện hóa tàn hồn kẻ bại trận để tăng trưởng ngộ tính và tinh thần lực của bản thân.",
    "sourceVectorText": "Ngộ +16; Chiến +3; Đạo tâm +13",
    "sourceEffectsText": "comprehension: x1.65, atk: x1.4, willpowerBonus: +25",
    "tier": 3,
    "dimension": "mindset",
    "origin": "innate",
    "allowedRaces": [
      "demon"
    ],
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
      "combat": 3
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
        "key": "attackFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.4,
        "sourceKey": "atk"
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
      "combatPowerMultiplier": 1.4
    }
  },
  {
    "id": "tu_la_chien_the",
    "name": "Tu La Chiến Thể",
    "description": "Dòng máu Tu La tộc sinh ra vì chiến tranh, trên chiến trường không biết mệt mỏi là gì.",
    "sourceDescription": "Dòng máu Tu La tộc sinh ra vì chiến tranh, trên chiến trường không biết mệt mỏi là gì.",
    "sourceVectorText": "Chiến +24",
    "sourceEffectsText": "atk: x1.55, atkSpeed: x1.3, armor: +20, willpowerBonus: +35",
    "tier": 3,
    "dimension": "combat",
    "origin": "lineage",
    "allowedRaces": [
      "demon"
    ],
    "requiredLineageTags": [
      "tu_la"
    ],
    "activation": [
      {
        "kind": "lineage",
        "key": "tu_la"
      }
    ],
    "acquisition": [],
    "exclusiveGroups": [
      "ancestral_bloodline"
    ],
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
        "key": "attackSpeedFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.3,
        "sourceKey": "atkSpeed"
      },
      {
        "key": "armorFlat",
        "mode": "add",
        "unit": "flat",
        "value": 20,
        "sourceKey": "armor"
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
    "color": "#a78bfa",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "combatPowerMultiplier": 1.55,
      "attackSpeedMultiplier": 1.3,
      "armorBonus": 20
    }
  },
  {
    "id": "ma_tam_chung_dao",
    "name": "Ma Tâm Chủng Đạo",
    "description": "Lấy tâm ma làm hạt giống đạo quả, biến mọi tạp niệm và dục vọng thành động lực đột phá.",
    "sourceDescription": "Lấy tâm ma làm hạt giống đạo quả, biến mọi tạp niệm và dục vọng thành động lực đột phá.",
    "sourceVectorText": "Linh +4; Ngộ +11; Đạo tâm +13",
    "sourceEffectsText": "breakthrough: +18%, qiRate: x1.5, heartDemonResistance: +30%, mindStateBonus: +25",
    "tier": 3,
    "dimension": "mindset",
    "origin": "acquired",
    "allowedRaces": [
      "demon"
    ],
    "activation": [],
    "acquisition": [
      {
        "kind": "achievement",
        "key": "achieve_ma_tam_chung_dao",
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
    "learningAffinity": {
      "cultivation": 4
    },
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
        "value": 1.5,
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
    "category": "experience",
    "conflicts": [],
    "statModifiers": {
      "breakthroughChanceBonus": 0.18,
      "qiAbsorptionMultiplier": 1.5
    }
  },
  {
    "id": "duc_gioi_ma_co",
    "name": "Dục Giới Ma Cơ",
    "description": "Nhất cử nhất động đều mang ma lực câu hồn đoạt phách, làm tan rã ý chí chiến đấu của địch.",
    "sourceDescription": "Nhất cử nhất động đều mang ma lực câu hồn đoạt phách, làm tan rã ý chí chiến đấu của địch.",
    "sourceVectorText": "Linh +4; Đạo tâm +6",
    "sourceEffectsText": "dodge: +25%, prestige: +35, qiRate: x1.45, crit: +15%",
    "tier": 3,
    "dimension": "social",
    "origin": "innate",
    "allowedRaces": [
      "demon"
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
      "aptitude": 2
    },
    "learningAffinity": {},
    "modifiers": [
      {
        "key": "dodgeChanceBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.25,
        "sourceKey": "dodge"
      },
      {
        "key": "qiRateFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.45,
        "sourceKey": "qiRate"
      },
      {
        "key": "critChanceBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.15,
        "sourceKey": "crit"
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
      "dodgeRateBonus": 0.25,
      "qiAbsorptionMultiplier": 1.45,
      "critRateBonus": 0.15
    }
  },
  {
    "id": "bach_cot_ma_khu",
    "name": "Bạch Cốt Ma Khu",
    "description": "Toàn bộ xương cốt được tôi luyện thành Bạch Cốt Thần Ma cứng hơn huyền thiết, không biết đau đớn.",
    "sourceDescription": "Toàn bộ xương cốt được tôi luyện thành Bạch Cốt Thần Ma cứng hơn huyền thiết, không biết đau đớn.",
    "sourceVectorText": "Thể +25",
    "sourceEffectsText": "def: +25, armor: +25, hp: x1.6, willpowerBonus: +30",
    "tier": 3,
    "dimension": "physique",
    "origin": "innate",
    "allowedRaces": [
      "demon"
    ],
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "active",
    "spawnWeight": 1,
    "traitCost": 18,
    "innateDelta": {
      "physique": 12.5
    },
    "learningAffinity": {},
    "modifiers": [
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
        "key": "healthFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.6,
        "sourceKey": "hp"
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
    "badge": "🛡️",
    "color": "#a78bfa",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "defenseBonus": 25,
      "armorBonus": 25,
      "healthMultiplier": 1.6
    }
  },
  {
    "id": "hon_don_thon_thien",
    "name": "Hỗn Độn Thôn Thiên",
    "description": "Bá đạo thôn phệ vạn vật và linh khí đất trời để cưỡng ép tăng tu vi với tốc độ khủng khiếp.",
    "sourceDescription": "Bá đạo thôn phệ vạn vật và linh khí đất trời để cưỡng ép tăng tu vi với tốc độ khủng khiếp.",
    "sourceVectorText": "Linh +38; Chiến +7; Đạo tâm -4",
    "sourceEffectsText": "qiRate: x2, atk: x1.9, breakthrough: -15%, willpowerBonus: +40",
    "tier": 4,
    "dimension": "root",
    "origin": "innate",
    "allowedRaces": [
      "demon"
    ],
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "active",
    "spawnWeight": 1,
    "traitCost": 35,
    "innateDelta": {
      "aptitude": 19
    },
    "learningAffinity": {
      "combat": 7
    },
    "modifiers": [
      {
        "key": "qiRateFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 2,
        "sourceKey": "qiRate"
      },
      {
        "key": "attackFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.9,
        "sourceKey": "atk"
      },
      {
        "key": "breakthroughChanceBonus",
        "mode": "add",
        "unit": "probability",
        "value": -0.15,
        "sourceKey": "breakthrough"
      },
      {
        "key": "willTrainingBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.2,
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
    "badge": "🌀",
    "color": "#fbbf24",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "qiAbsorptionMultiplier": 2,
      "combatPowerMultiplier": 1.9,
      "breakthroughChanceBonus": -0.15
    }
  },
  {
    "id": "thai_co_ma_nhan",
    "name": "Thái Cổ Ma Nhãn",
    "description": "Giữa trán mở ra con mắt thứ ba của Cổ Ma, bắn ra tia sáng hủy diệt xuyên thủng mọi phòng ngự.",
    "sourceDescription": "Giữa trán mở ra con mắt thứ ba của Cổ Ma, bắn ra tia sáng hủy diệt xuyên thủng mọi phòng ngự.",
    "sourceVectorText": "Ngộ +6; Chiến +37",
    "sourceEffectsText": "crit: +35%, atk: x1.9, comprehension: x1.7, dodge: +20%",
    "tier": 4,
    "dimension": "combat",
    "origin": "lineage",
    "allowedRaces": [
      "demon"
    ],
    "requiredLineageTags": [
      "ancient_demon"
    ],
    "activation": [
      {
        "kind": "lineage",
        "key": "ancient_demon"
      }
    ],
    "acquisition": [],
    "exclusiveGroups": [
      "ancestral_bloodline"
    ],
    "conflictsWith": [],
    "implementation": "planned",
    "deferredReason": "Dòng dõi huyết mạch [ancient_demon] chưa có nguồn tổ tiên/loài hỗ trợ trong lõi",
    "spawnWeight": 0,
    "traitCost": 35,
    "innateDelta": {
      "comprehension": 3
    },
    "learningAffinity": {
      "combat": 37
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
        "value": 1.9,
        "sourceKey": "atk"
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
        "value": 0.2,
        "sourceKey": "dodge"
      }
    ],
    "effects": [],
    "badge": "⚔️",
    "color": "#fbbf24",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "critRateBonus": 0.35,
      "combatPowerMultiplier": 1.9,
      "comprehensionMultiplier": 1.7,
      "dodgeRateBonus": 0.2
    }
  },
  {
    "id": "bat_tu_huyet_ma",
    "name": "Bất Tử Huyết Ma",
    "description": "Hóa thân thành biển máu bất tử, chừng nào huyết khí chưa cạn thì không ai giết nổi.",
    "sourceDescription": "Hóa thân thành biển máu bất tử, chừng nào huyết khí chưa cạn thì không ai giết nổi.",
    "sourceVectorText": "Linh +5; Thể +39",
    "sourceEffectsText": "hp: x2.1, lifespan: +300, def: +25, qiRate: x1.6",
    "tier": 4,
    "dimension": "physique",
    "origin": "innate",
    "allowedRaces": [
      "demon"
    ],
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
      "aptitude": 2.5,
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
        "key": "lifespanYears",
        "mode": "add",
        "unit": "years",
        "value": 300,
        "sourceKey": "lifespan"
      },
      {
        "key": "defenseFlat",
        "mode": "add",
        "unit": "flat",
        "value": 25,
        "sourceKey": "def"
      },
      {
        "key": "qiRateFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.6,
        "sourceKey": "qiRate"
      }
    ],
    "effects": [],
    "badge": "🛡️",
    "color": "#fbbf24",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "healthMultiplier": 2.1,
      "lifespanBonus": 300,
      "defenseBonus": 25,
      "qiAbsorptionMultiplier": 1.6
    }
  },
  {
    "id": "van_ma_trieu_tong",
    "name": "Vạn Ma Triều Tông",
    "description": "Hoàng tộc Ma giới chân chính, ma uy trấn áp thiên địa, vạn ma quỳ lạy nghe lệnh.",
    "sourceDescription": "Hoàng tộc Ma giới chân chính, ma uy trấn áp thiên địa, vạn ma quỳ lạy nghe lệnh.",
    "sourceVectorText": "Linh +6; Chiến +6; Đạo tâm +9",
    "sourceEffectsText": "prestige: +80, atk: x1.8, qiRate: x1.8, breakthrough: +25%, willpowerBonus: +45",
    "tier": 4,
    "dimension": "social",
    "origin": "lineage",
    "allowedRaces": [
      "demon"
    ],
    "requiredLineageTags": [
      "demon_royal"
    ],
    "activation": [
      {
        "kind": "lineage",
        "key": "demon_royal"
      }
    ],
    "acquisition": [],
    "exclusiveGroups": [
      "ancestral_bloodline",
      "destiny_major"
    ],
    "conflictsWith": [],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: prestige; Dòng dõi huyết mạch [demon_royal] chưa có nguồn tổ tiên/loài hỗ trợ trong lõi",
    "unmappedEffectKeys": [
      "prestige"
    ],
    "spawnWeight": 0,
    "traitCost": 35,
    "innateDelta": {
      "aptitude": 3
    },
    "learningAffinity": {
      "combat": 6
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
        "key": "qiRateFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.8,
        "sourceKey": "qiRate"
      },
      {
        "key": "breakthroughChanceBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.25,
        "sourceKey": "breakthrough"
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
      "combatPowerMultiplier": 1.8,
      "qiAbsorptionMultiplier": 1.8,
      "breakthroughChanceBonus": 0.25
    }
  },
  {
    "id": "huy_diet_ma_loi",
    "name": "Hủy Diệt Ma Lôi",
    "description": "Dị chủng Hắc Ám Ma Lôi mang pháp tắc hủy diệt thuần túy, ngay cả thiên kiếp cũng phải kiêng dè.",
    "sourceDescription": "Dị chủng Hắc Ám Ma Lôi mang pháp tắc hủy diệt thuần túy, ngay cả thiên kiếp cũng phải kiêng dè.",
    "sourceVectorText": "Linh +30; Chiến +7",
    "sourceEffectsText": "atk: x1.9, crit: +25%, moveSpeed: x1.4, breakthrough: +20%",
    "tier": 4,
    "dimension": "root",
    "origin": "innate",
    "allowedRaces": [
      "demon"
    ],
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "active",
    "spawnWeight": 1,
    "traitCost": 35,
    "innateDelta": {
      "aptitude": 15
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
        "key": "moveSpeedFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.4,
        "sourceKey": "moveSpeed"
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
    "badge": "🌟",
    "color": "#fbbf24",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "combatPowerMultiplier": 1.9,
      "critRateBonus": 0.25,
      "moveSpeedMultiplier": 1.4,
      "breakthroughChanceBonus": 0.2
    }
  },
  {
    "id": "luc_dao_thien_ma",
    "name": "Lục Đạo Thiên Ma",
    "description": "Chúa tể của các loài Thiên Ma, tự do ra vào tâm cảnh chúng sinh, vĩnh viễn không bị tẩu hỏa nhập ma.",
    "sourceDescription": "Chúa tể của các loài Thiên Ma, tự do ra vào tâm cảnh chúng sinh, vĩnh viễn không bị tẩu hỏa nhập ma.",
    "sourceVectorText": "Linh +7; Ngộ +25; Đạo tâm +20",
    "sourceEffectsText": "mindStateBonus: +45, heartDemonResistance: +40%, comprehension: x2.1, qiRate: x1.9",
    "tier": 4,
    "dimension": "mindset",
    "origin": "innate",
    "allowedRaces": [
      "demon"
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
    "traitCost": 35,
    "innateDelta": {
      "comprehension": 12.5,
      "aptitude": 3.5
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
        "value": 1.9,
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
    "conflicts": [],
    "statModifiers": {
      "comprehensionMultiplier": 2.1,
      "qiAbsorptionMultiplier": 1.9
    }
  },
  {
    "id": "co_ma_chan_to",
    "name": "Cổ Ma Chân Tổ",
    "description": "Huyết mạch Thủy Tổ Cổ Ma sinh ra từ trước khi có Thiên Đạo, nhục thân và ma lực đều vô địch.",
    "sourceDescription": "Huyết mạch Thủy Tổ Cổ Ma sinh ra từ trước khi có Thiên Đạo, nhục thân và ma lực đều vô địch.",
    "sourceVectorText": "Thể +56; Chiến +10",
    "sourceEffectsText": "hp: x2.75, atk: x2.30, armor: +50, lifespan: +600, willpowerBonus: +65, demonBloodline: +100%",
    "tier": 5,
    "dimension": "physique",
    "origin": "lineage",
    "allowedRaces": [
      "demon"
    ],
    "requiredLineageTags": [
      "ancient_demon"
    ],
    "activation": [
      {
        "kind": "lineage",
        "key": "ancient_demon"
      }
    ],
    "acquisition": [],
    "exclusiveGroups": [
      "ancestral_bloodline"
    ],
    "conflictsWith": [],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: demonBloodline; Dòng dõi huyết mạch [ancient_demon] chưa có nguồn tổ tiên/loài hỗ trợ trong lõi",
    "unmappedEffectKeys": [
      "demonBloodline"
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
        "value": 2.75,
        "sourceKey": "hp"
      },
      {
        "key": "attackFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 2.3,
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
      "healthMultiplier": 2.75,
      "combatPowerMultiplier": 2.3,
      "armorBonus": 50,
      "lifespanBonus": 600
    }
  },
  {
    "id": "hon_don_ma_thai",
    "name": "Hỗn Độn Ma Thai",
    "description": "Sinh ra từ lõi Hỗn Độn Ma Uyên, coi ma khí và linh khí đều là thức ăn bổ dưỡng nhất.",
    "sourceDescription": "Sinh ra từ lõi Hỗn Độn Ma Uyên, coi ma khí và linh khí đều là thức ăn bổ dưỡng nhất.",
    "sourceVectorText": "Linh +54; Ngộ +9; Thể +9",
    "sourceEffectsText": "qiRate: x2.45, breakthrough: +30%, hp: x2.10, comprehension: x2.10, dualEnergyCompatibility: +60%",
    "tier": 5,
    "dimension": "root",
    "origin": "innate",
    "allowedRaces": [
      "demon"
    ],
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: dualEnergyCompatibility",
    "unmappedEffectKeys": [
      "dualEnergyCompatibility"
    ],
    "spawnWeight": 0,
    "traitCost": 60,
    "innateDelta": {
      "comprehension": 4.5,
      "aptitude": 27,
      "physique": 4.5
    },
    "learningAffinity": {},
    "modifiers": [
      {
        "key": "qiRateFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 2.45,
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
        "key": "healthFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 2.1,
        "sourceKey": "hp"
      },
      {
        "key": "techniqueLearningFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 2.1,
        "sourceKey": "comprehension"
      }
    ],
    "effects": [],
    "badge": "🌟",
    "color": "#fb7185",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "qiAbsorptionMultiplier": 2.45,
      "breakthroughChanceBonus": 0.3,
      "healthMultiplier": 2.1,
      "comprehensionMultiplier": 2.1
    }
  },
  {
    "id": "vo_thuong_sat_than",
    "name": "Vô Thượng Sát Thần",
    "description": "Lấy sát nhập đạo đạt cảnh giới chí cao, mỗi sinh mạng gục xuống dưới chân đều hóa thành đạo hạnh.",
    "sourceDescription": "Lấy sát nhập đạo đạt cảnh giới chí cao, mỗi sinh mạng gục xuống dưới chân đều hóa thành đạo hạnh.",
    "sourceVectorText": "Chiến +53",
    "sourceEffectsText": "atk: x2.40, crit: +45%, atkSpeed: x1.50, willpowerBonus: +70, heartDemonResistance: +55%, killInsight: +30%",
    "tier": 5,
    "dimension": "combat",
    "origin": "acquired",
    "allowedRaces": [
      "demon"
    ],
    "activation": [],
    "acquisition": [
      {
        "kind": "achievement",
        "key": "achieve_vo_thuong_sat_than",
        "value": 1
      }
    ],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: heartDemonResistance, killInsight; Chưa có producer thành tựu hậu thiên tương ứng trong lõi",
    "unmappedEffectKeys": [
      "heartDemonResistance",
      "killInsight"
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
        "value": 2.4,
        "sourceKey": "atk"
      },
      {
        "key": "critChanceBonus",
        "mode": "add",
        "unit": "probability",
        "value": 0.45,
        "sourceKey": "crit"
      },
      {
        "key": "attackSpeedFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.5,
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
    "category": "experience",
    "conflicts": [],
    "statModifiers": {
      "combatPowerMultiplier": 2.4,
      "critRateBonus": 0.45,
      "attackSpeedMultiplier": 1.5
    }
  },
  {
    "id": "vinh_hang_ma_chu",
    "name": "Vĩnh Hằng Ma Chủ",
    "description": "Đạo tâm Ma Chủ vĩnh hằng bất diệt, ngang hàng với Thiên Đạo, thống lĩnh ma giới muôn đời.",
    "sourceDescription": "Đạo tâm Ma Chủ vĩnh hằng bất diệt, ngang hàng với Thiên Đạo, thống lĩnh ma giới muôn đời.",
    "sourceVectorText": "Linh +10; Ngộ +33; Chiến +9; Đạo tâm +27",
    "sourceEffectsText": "qiRate: x2.20, comprehension: x2.20, atk: x2.10, prestige: +120, mindStateBonus: +60, willpowerBonus: +70, demonCommand: +50%",
    "tier": 5,
    "dimension": "mindset",
    "origin": "innate",
    "allowedRaces": [
      "demon"
    ],
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: prestige, demonCommand",
    "unmappedEffectKeys": [
      "prestige",
      "demonCommand"
    ],
    "spawnWeight": 0,
    "traitCost": 60,
    "innateDelta": {
      "comprehension": 16.5,
      "aptitude": 5
    },
    "learningAffinity": {
      "combat": 9
    },
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
        "key": "attackFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 2.1,
        "sourceKey": "atk"
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
      "combatPowerMultiplier": 2.1
    }
  },
  {
    "id": "am_anh_phu_the",
    "name": "Ám Ảnh Phụ Thể",
    "description": "Thần hồn dễ bị bóng tối và oán niệm bám theo, tăng cảnh giác nhưng giảm ổn định tâm trí.",
    "sourceDescription": "Thần hồn dễ bị bóng tối và oán niệm bám theo, tăng cảnh giác nhưng giảm ổn định tâm trí.",
    "sourceVectorText": "Ngộ +3; Đạo tâm -1",
    "sourceEffectsText": "dodge: +8%, mindStateBonus: -12, heartDemonResistance: -10%",
    "tier": 1,
    "dimension": "mindset",
    "origin": "innate",
    "allowedRaces": [
      "demon"
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
        "value": 0.08,
        "sourceKey": "dodge"
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
        "value": -0.005,
        "sourceKey": "daoHeartVector"
      }
    ],
    "effects": [],
    "badge": "🧠",
    "color": "#94a3b8",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "dodgeRateBonus": 0.08
    }
  },
  {
    "id": "ma_van_bat_on",
    "name": "Ma Văn Bất Ổn",
    "description": "Ma văn trên cơ thể hấp thu ma khí thất thường, lúc mạnh lúc yếu.",
    "sourceDescription": "Ma văn trên cơ thể hấp thu ma khí thất thường, lúc mạnh lúc yếu.",
    "sourceVectorText": "Linh +7; Đạo tâm -4",
    "sourceEffectsText": "qiRate: x1.10, breakthrough: -8%, instability: +20%",
    "tier": 1,
    "dimension": "root",
    "origin": "innate",
    "allowedRaces": [
      "demon"
    ],
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: instability",
    "unmappedEffectKeys": [
      "instability"
    ],
    "spawnWeight": 0,
    "traitCost": 3,
    "innateDelta": {
      "aptitude": 3.5
    },
    "learningAffinity": {},
    "modifiers": [
      {
        "key": "qiRateFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.1,
        "sourceKey": "qiRate"
      },
      {
        "key": "breakthroughChanceBonus",
        "mode": "add",
        "unit": "probability",
        "value": -0.08,
        "sourceKey": "breakthrough"
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
      "qiAbsorptionMultiplier": 1.1,
      "breakthroughChanceBonus": -0.08
    }
  },
  {
    "id": "u_anh_ma_the",
    "name": "U Ảnh Ma Thể",
    "description": "Thân thể thiên về bóng tối và ẩn nấp, khó bị phát hiện nhưng sức bền trực diện không cao.",
    "sourceDescription": "Thân thể thiên về bóng tối và ẩn nấp, khó bị phát hiện nhưng sức bền trực diện không cao.",
    "sourceVectorText": "Thể +10",
    "sourceEffectsText": "dodge: +18%, moveSpeed: x1.20, hp: x0.92, stealth: +30%",
    "tier": 2,
    "dimension": "physique",
    "origin": "lineage",
    "allowedRaces": [
      "demon"
    ],
    "requiredLineageTags": [
      "shadow_demon"
    ],
    "activation": [
      {
        "kind": "lineage",
        "key": "shadow_demon"
      }
    ],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: stealth; Dòng dõi huyết mạch [shadow_demon] chưa có nguồn tổ tiên/loài hỗ trợ trong lõi",
    "unmappedEffectKeys": [
      "stealth"
    ],
    "spawnWeight": 0,
    "traitCost": 8,
    "innateDelta": {
      "physique": 5
    },
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
        "value": 1.2,
        "sourceKey": "moveSpeed"
      },
      {
        "key": "healthFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 0.92,
        "sourceKey": "hp"
      }
    ],
    "effects": [],
    "badge": "🛡️",
    "color": "#34d399",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "dodgeRateBonus": 0.18,
      "moveSpeedMultiplier": 1.2,
      "healthMultiplier": 0.92
    }
  },
  {
    "id": "huyet_chu_ngung_mach",
    "name": "Huyết Chú Ngưng Mạch",
    "description": "Kinh mạch có thể dùng tinh huyết kích hoạt chú thuật, đổi sinh cơ lấy bộc phát.",
    "sourceDescription": "Kinh mạch có thể dùng tinh huyết kích hoạt chú thuật, đổi sinh cơ lấy bộc phát.",
    "sourceVectorText": "Linh +14",
    "sourceEffectsText": "qiRate: x1.25, cursePower: +30%, hpCost: +10%",
    "tier": 2,
    "dimension": "root",
    "origin": "innate",
    "allowedRaces": [
      "demon"
    ],
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: cursePower, hpCost",
    "unmappedEffectKeys": [
      "cursePower",
      "hpCost"
    ],
    "spawnWeight": 0,
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
        "value": 1.25,
        "sourceKey": "qiRate"
      }
    ],
    "effects": [],
    "badge": "🌟",
    "color": "#34d399",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "qiAbsorptionMultiplier": 1.25
    }
  },
  {
    "id": "oan_hon_thong_cam",
    "name": "Oán Hồn Thông Cảm",
    "description": "Có thể cảm nhận cảm xúc của oán hồn, tăng khả năng điều khiển nhưng dễ chịu ảnh hưởng ngược.",
    "sourceDescription": "Có thể cảm nhận cảm xúc của oán hồn, tăng khả năng điều khiển nhưng dễ chịu ảnh hưởng ngược.",
    "sourceVectorText": "Ngộ +9; Đạo tâm +8",
    "sourceEffectsText": "comprehension: x1.20, soulAffinity: +30%, mindStateBonus: -8",
    "tier": 2,
    "dimension": "mindset",
    "origin": "innate",
    "allowedRaces": [
      "demon"
    ],
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: soulAffinity",
    "unmappedEffectKeys": [
      "soulAffinity"
    ],
    "spawnWeight": 0,
    "traitCost": 8,
    "innateDelta": {
      "comprehension": 4.5
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
      "comprehensionMultiplier": 1.2
    }
  },
  {
    "id": "huyet_luyen_chien_phap",
    "name": "Huyết Luyện Chiến Pháp",
    "description": "Càng bị thương càng dễ kích hoạt ma công huyết luyện, nhưng dễ vượt ngưỡng an toàn.",
    "sourceDescription": "Càng bị thương càng dễ kích hoạt ma công huyết luyện, nhưng dễ vượt ngưỡng an toàn.",
    "sourceVectorText": "Chiến +24",
    "sourceEffectsText": "atk: x1.50, atkSpeed: x1.25, lowHpPower: +35%, healingReceived: -10%",
    "tier": 3,
    "dimension": "combat",
    "origin": "acquired",
    "allowedRaces": [
      "demon"
    ],
    "activation": [],
    "acquisition": [
      {
        "kind": "achievement",
        "key": "achieve_huyet_luyen_chien_phap",
        "value": 1
      }
    ],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: lowHpPower, healingReceived; Chưa có producer thành tựu hậu thiên tương ứng trong lõi",
    "unmappedEffectKeys": [
      "lowHpPower",
      "healingReceived"
    ],
    "spawnWeight": 0,
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
        "value": 1.5,
        "sourceKey": "atk"
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
    "badge": "⚔️",
    "color": "#a78bfa",
    "category": "experience",
    "conflicts": [],
    "statModifiers": {
      "combatPowerMultiplier": 1.5,
      "attackSpeedMultiplier": 1.25
    }
  },
  {
    "id": "u_minh_hon_can",
    "name": "U Minh Hồn Căn",
    "description": "Dị ma căn thiên về thần hồn, tử khí và u minh pháp thuật.",
    "sourceDescription": "Dị ma căn thiên về thần hồn, tử khí và u minh pháp thuật.",
    "sourceVectorText": "Linh +24; Ngộ +2",
    "sourceEffectsText": "qiRate: x1.50, comprehension: x1.30, soulAffinity: +55%",
    "tier": 3,
    "dimension": "root",
    "origin": "lineage",
    "allowedRaces": [
      "demon"
    ],
    "requiredLineageTags": [
      "nether_demon"
    ],
    "activation": [
      {
        "kind": "lineage",
        "key": "nether_demon"
      }
    ],
    "acquisition": [],
    "exclusiveGroups": [
      "ancestral_bloodline"
    ],
    "conflictsWith": [],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: soulAffinity; Dòng dõi huyết mạch [nether_demon] chưa có nguồn tổ tiên/loài hỗ trợ trong lõi",
    "unmappedEffectKeys": [
      "soulAffinity"
    ],
    "spawnWeight": 0,
    "traitCost": 18,
    "innateDelta": {
      "comprehension": 1,
      "aptitude": 12
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
        "key": "techniqueLearningFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.3,
        "sourceKey": "comprehension"
      }
    ],
    "effects": [],
    "badge": "🌟",
    "color": "#a78bfa",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "qiAbsorptionMultiplier": 1.5,
      "comprehensionMultiplier": 1.3
    }
  },
  {
    "id": "vo_anh_ma_bo",
    "name": "Vô Ảnh Ma Bộ",
    "description": "Thân pháp ma đạo thiên về xóa dấu khí tức và đổi vị trí ngắn liên tục.",
    "sourceDescription": "Thân pháp ma đạo thiên về xóa dấu khí tức và đổi vị trí ngắn liên tục.",
    "sourceVectorText": "Chiến +20",
    "sourceEffectsText": "moveSpeed: x1.45, dodge: +28%, stealth: +35%",
    "tier": 3,
    "dimension": "combat",
    "origin": "acquired",
    "allowedRaces": [
      "demon"
    ],
    "activation": [],
    "acquisition": [
      {
        "kind": "achievement",
        "key": "achieve_vo_anh_ma_bo",
        "value": 1
      }
    ],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: stealth; Chưa có producer thành tựu hậu thiên tương ứng trong lõi",
    "unmappedEffectKeys": [
      "stealth"
    ],
    "spawnWeight": 0,
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
        "value": 0.28,
        "sourceKey": "dodge"
      }
    ],
    "effects": [],
    "badge": "⚔️",
    "color": "#a78bfa",
    "category": "experience",
    "conflicts": [],
    "statModifiers": {
      "moveSpeedMultiplier": 1.45,
      "dodgeRateBonus": 0.28
    }
  },
  {
    "id": "that_tinh_ma_tam",
    "name": "Thất Tình Ma Tâm",
    "description": "Có thể dùng hỉ nộ ai lạc làm nhiên liệu ma công; cảm xúc càng rõ, kỹ năng tương ứng càng mạnh.",
    "sourceDescription": "Có thể dùng hỉ nộ ai lạc làm nhiên liệu ma công; cảm xúc càng rõ, kỹ năng tương ứng càng mạnh.",
    "sourceVectorText": "Linh +3; Ngộ +14; Đạo tâm +13",
    "sourceEffectsText": "qiRate: x1.35, comprehension: x1.35, emotionConversion: +45%",
    "tier": 3,
    "dimension": "mindset",
    "origin": "innate",
    "allowedRaces": [
      "demon"
    ],
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: emotionConversion",
    "unmappedEffectKeys": [
      "emotionConversion"
    ],
    "spawnWeight": 0,
    "traitCost": 18,
    "innateDelta": {
      "comprehension": 7,
      "aptitude": 1.5
    },
    "learningAffinity": {},
    "modifiers": [
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
        "value": 1.35,
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
    "badge": "🧠",
    "color": "#a78bfa",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "qiAbsorptionMultiplier": 1.35,
      "comprehensionMultiplier": 1.35
    }
  },
  {
    "id": "doat_xa_thien_phu",
    "name": "Đoạt Xá Thiên Phú",
    "description": "Thần hồn bẩm sinh mạnh, có khả năng chiếm đoạt hoặc chống đoạt xá tốt hơn nhưng phải chịu nhân quả lớn.",
    "sourceDescription": "Thần hồn bẩm sinh mạnh, có khả năng chiếm đoạt hoặc chống đoạt xá tốt hơn nhưng phải chịu nhân quả lớn.",
    "sourceVectorText": "Ngộ +22; Đạo tâm +20",
    "sourceEffectsText": "comprehension: x1.80, soulDefense: +60%, possessionPower: +45%, karmaGain: +30%",
    "tier": 4,
    "dimension": "mindset",
    "origin": "innate",
    "allowedRaces": [
      "demon"
    ],
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: soulDefense, possessionPower, karmaGain",
    "unmappedEffectKeys": [
      "soulDefense",
      "possessionPower",
      "karmaGain"
    ],
    "spawnWeight": 0,
    "traitCost": 35,
    "innateDelta": {
      "comprehension": 11
    },
    "learningAffinity": {},
    "modifiers": [
      {
        "key": "techniqueLearningFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.8,
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
      "comprehensionMultiplier": 1.8
    }
  },
  {
    "id": "ma_vuc_phap_the",
    "name": "Ma Vực Pháp Thể",
    "description": "Cơ thể khuếch tán ma khí thành lĩnh vực ngắn, làm suy yếu kẻ địch quanh mình.",
    "sourceDescription": "Cơ thể khuếch tán ma khí thành lĩnh vực ngắn, làm suy yếu kẻ địch quanh mình.",
    "sourceVectorText": "Linh +4; Thể +37; Chiến +5",
    "sourceEffectsText": "hp: x1.90, atk: x1.65, domainPower: +45%, qiRate: x1.55",
    "tier": 4,
    "dimension": "physique",
    "origin": "lineage",
    "allowedRaces": [
      "demon"
    ],
    "requiredLineageTags": [
      "ancient_demon"
    ],
    "activation": [
      {
        "kind": "lineage",
        "key": "ancient_demon"
      }
    ],
    "acquisition": [],
    "exclusiveGroups": [
      "ancestral_bloodline"
    ],
    "conflictsWith": [],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: domainPower; Dòng dõi huyết mạch [ancient_demon] chưa có nguồn tổ tiên/loài hỗ trợ trong lõi",
    "unmappedEffectKeys": [
      "domainPower"
    ],
    "spawnWeight": 0,
    "traitCost": 35,
    "innateDelta": {
      "aptitude": 2,
      "physique": 18.5
    },
    "learningAffinity": {
      "combat": 5
    },
    "modifiers": [
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
        "value": 1.65,
        "sourceKey": "atk"
      },
      {
        "key": "qiRateFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.55,
        "sourceKey": "qiRate"
      }
    ],
    "effects": [],
    "badge": "🛡️",
    "color": "#fbbf24",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "healthMultiplier": 1.9,
      "combatPowerMultiplier": 1.65,
      "qiAbsorptionMultiplier": 1.55
    }
  },
  {
    "id": "van_chu_ma_nhan",
    "name": "Vạn Chú Ma Nhãn",
    "description": "Ma nhãn nhìn thấy sơ hở thần hồn và dấu ấn chú thuật, mạnh trong nguyền rủa mục tiêu đơn.",
    "sourceDescription": "Ma nhãn nhìn thấy sơ hở thần hồn và dấu ấn chú thuật, mạnh trong nguyền rủa mục tiêu đơn.",
    "sourceVectorText": "Ngộ +5; Chiến +30",
    "sourceEffectsText": "crit: +35%, comprehension: x1.65, cursePower: +55%, soulPierce: +35%",
    "tier": 4,
    "dimension": "combat",
    "origin": "lineage",
    "allowedRaces": [
      "demon"
    ],
    "requiredLineageTags": [
      "ancient_demon"
    ],
    "activation": [
      {
        "kind": "lineage",
        "key": "ancient_demon"
      }
    ],
    "acquisition": [],
    "exclusiveGroups": [
      "ancestral_bloodline"
    ],
    "conflictsWith": [],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: cursePower, soulPierce; Dòng dõi huyết mạch [ancient_demon] chưa có nguồn tổ tiên/loài hỗ trợ trong lõi",
    "unmappedEffectKeys": [
      "cursePower",
      "soulPierce"
    ],
    "spawnWeight": 0,
    "traitCost": 35,
    "innateDelta": {
      "comprehension": 2.5
    },
    "learningAffinity": {
      "combat": 30
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
        "key": "techniqueLearningFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 1.65,
        "sourceKey": "comprehension"
      }
    ],
    "effects": [],
    "badge": "⚔️",
    "color": "#fbbf24",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "critRateBonus": 0.35,
      "comprehensionMultiplier": 1.65
    }
  },
  {
    "id": "vo_gian_ma_the",
    "name": "Vô Gian Ma Thể",
    "description": "Thể chất thích nghi Ma Vực cực hạn, càng ở môi trường ma khí đậm càng tăng sức mạnh.",
    "sourceDescription": "Thể chất thích nghi Ma Vực cực hạn, càng ở môi trường ma khí đậm càng tăng sức mạnh.",
    "sourceVectorText": "Linh +10; Thể +54; Chiến +9",
    "sourceEffectsText": "hp: x2.55, atk: x2.15, qiRate: x2.20, abyssAdaptation: +80%",
    "tier": 5,
    "dimension": "physique",
    "origin": "lineage",
    "allowedRaces": [
      "demon"
    ],
    "requiredLineageTags": [
      "ancient_demon"
    ],
    "activation": [
      {
        "kind": "lineage",
        "key": "ancient_demon"
      }
    ],
    "acquisition": [],
    "exclusiveGroups": [
      "ancestral_bloodline"
    ],
    "conflictsWith": [],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: abyssAdaptation; Dòng dõi huyết mạch [ancient_demon] chưa có nguồn tổ tiên/loài hỗ trợ trong lõi",
    "unmappedEffectKeys": [
      "abyssAdaptation"
    ],
    "spawnWeight": 0,
    "traitCost": 60,
    "innateDelta": {
      "aptitude": 5,
      "physique": 27
    },
    "learningAffinity": {
      "combat": 9
    },
    "modifiers": [
      {
        "key": "healthFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 2.55,
        "sourceKey": "hp"
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
    "badge": "🛡️",
    "color": "#fb7185",
    "category": "innate",
    "conflicts": [],
    "statModifiers": {
      "healthMultiplier": 2.55,
      "combatPowerMultiplier": 2.15,
      "qiAbsorptionMultiplier": 2.2
    }
  },
  {
    "id": "thien_ma_vo_tuong",
    "name": "Thiên Ma Vô Tướng",
    "description": "Thần hồn không cố định hình thái, khó bị công kích tinh thần và dễ mô phỏng tâm pháp người khác.",
    "sourceDescription": "Thần hồn không cố định hình thái, khó bị công kích tinh thần và dễ mô phỏng tâm pháp người khác.",
    "sourceVectorText": "Ngộ +33; Đạo tâm +27",
    "sourceEffectsText": "comprehension: x2.30, heartDemonResistance: +65%, soulDefense: +75%, techniqueMimic: +40%",
    "tier": 5,
    "dimension": "mindset",
    "origin": "lineage",
    "allowedRaces": [
      "demon"
    ],
    "requiredLineageTags": [
      "ancient_demon"
    ],
    "activation": [
      {
        "kind": "lineage",
        "key": "ancient_demon"
      }
    ],
    "acquisition": [],
    "exclusiveGroups": [
      "ancestral_bloodline"
    ],
    "conflictsWith": [],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: heartDemonResistance, soulDefense, techniqueMimic; Dòng dõi huyết mạch [ancient_demon] chưa có nguồn tổ tiên/loài hỗ trợ trong lõi",
    "unmappedEffectKeys": [
      "heartDemonResistance",
      "soulDefense",
      "techniqueMimic"
    ],
    "spawnWeight": 0,
    "traitCost": 60,
    "innateDelta": {
      "comprehension": 16.5
    },
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
      "comprehensionMultiplier": 2.3
    }
  },
  {
    "id": "ma_dao_ban_nguyen",
    "name": "Ma Đạo Bản Nguyên",
    "description": "Ma căn chạm tới bản nguyên ma đạo; sức mạnh lớn nhưng mọi hành vi cực đoan đều tích lũy nhân quả và thiên kiếp.",
    "sourceDescription": "Ma căn chạm tới bản nguyên ma đạo; sức mạnh lớn nhưng mọi hành vi cực đoan đều tích lũy nhân quả và thiên kiếp.",
    "sourceVectorText": "Linh +54; Chiến +10",
    "sourceEffectsText": "qiRate: x2.50, atk: x2.25, breakthrough: +30%, demonLawAffinity: +85%, tribulationSeverity: +20%",
    "tier": 5,
    "dimension": "root",
    "origin": "innate",
    "allowedRaces": [
      "demon"
    ],
    "activation": [],
    "acquisition": [],
    "exclusiveGroups": [],
    "conflictsWith": [],
    "implementation": "planned",
    "deferredReason": "Chưa có hệ thống xử lý hiệu ứng: demonLawAffinity, tribulationSeverity",
    "unmappedEffectKeys": [
      "demonLawAffinity",
      "tribulationSeverity"
    ],
    "spawnWeight": 0,
    "traitCost": 60,
    "innateDelta": {
      "aptitude": 27
    },
    "learningAffinity": {
      "combat": 10
    },
    "modifiers": [
      {
        "key": "qiRateFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 2.5,
        "sourceKey": "qiRate"
      },
      {
        "key": "attackFactor",
        "mode": "multiply",
        "unit": "factor",
        "value": 2.25,
        "sourceKey": "atk"
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
      "qiAbsorptionMultiplier": 2.5,
      "combatPowerMultiplier": 2.25,
      "breakthroughChanceBonus": 0.3
    }
  }
];
