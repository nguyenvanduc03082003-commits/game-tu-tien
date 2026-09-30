/** Ngưỡng xã hội; thời gian chờ tính bằng ngày mô phỏng (1 ngày hiện = 20s ở 1x). */
export const SOCIAL_CONFIG = {
  ordinary: { acquaintanceAffinity: 10, friendAffinity: 30, enemyAffinity: -50 },
  companion: { minAge: 18, minAffinity: 75, minTrust: 60, minInteractions: 5, chance: 0.25 },
  mentorship: {
    minTeacherStage: 1, learnerStage: 0,
    teacherAffinity: 45, teacherTrust: 50,
    learnerAffinity: 30, learnerTrust: 50, learnerRespect: 60,
    maxActiveMasters: 1, maxActiveDisciples: 3, chance: 0.15,
  },
  sworn: { minAffinity: 70, minTrust: 60, minInteractions: 5, chance: 0.15 },
  kinship: { ancestorDepth: 2 },
  lifecycle: {
    maxHistory: 20, postEndCooldownDays: 30,
    conflictAffinity: -50, conflictTrust: 20, conflictDays: 30,
  },
  rescue: { dangerHealthRatio: 0.35, evidenceDays: 1, radius: 180, maxThreats: 8, cooldownDays: 30 },
  // Giai đoạn 4: cấu hình khởi điểm, chưa nối vào các caller giao tiếp.
  conversation: {
    maxDistance: 55, dangerHealthRatio: 0.25, declineAffinity: -30,
    receptivity: { base: 0.5, sociabilityWeight: 0.25, affinityWeight: 0.2,
      trustWeight: 0.15, busyPenalty: 0.2, cultivationCuriosityWeight: 0.1 },
    outcomes: { warmMinimum: 0.65, awkwardBelow: 0.35 },
    deltas: {
      warm: { affinity: 3, trust: 1, respect: 0 },
      neutral: { affinity: 1, trust: 0, respect: 0 },
      awkward: { affinity: -1, trust: 0, respect: 0 },
    },
    limits: { minAffinity: -2, maxAffinity: 4, maxTrust: 2, maxRespect: 1 },
    memory: { importance: 1, emotion: { warm: 10, neutral: 0, awkward: -5 } },
  },
  socialDecision: {
    maxCandidates: 12, searchRadius: 200,
    weights: { relationship: 0.35, receptivity: 0.25, distance: 0.25, context: 0.15 },
  },
  assistance: { minAffinity: 20, minTrust: 40, fleeHealthRatio: 0.25, radius: 180 },
  cooldownDays: {
    communication: 1, healing: 3, teaching: 10, bondAttempt: 30,
    attackedScores: 1, witnessedScores: 1, combatMemory: 3, rescueLife: 30,
  },
} as const;
