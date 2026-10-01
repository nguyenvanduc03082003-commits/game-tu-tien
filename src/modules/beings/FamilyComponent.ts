export class FamilyComponent {
  public parentIds: number[] = [];
  public birthCooldown = 360; // 360 ngày (1 năm lịch)
  constructor(public sex: 'female' | 'male' = Math.random() < 0.5 ? 'female' : 'male') {}
}
export const REPRODUCTION_CONFIG = {
  enabled: true,
  minAge: 18,
  maxLifespanRatio: 0.6,
  cooldownSeconds: 360, // Legacy property name; value is calendar days (one year).
  checkIntervalSeconds: 5,
  chancePerCheck: 0.04,
  populationLimit: 1000,
  maxBirthsPerCheck: 2,
};
