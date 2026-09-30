import type { Component } from '../../ecs/Component.ts';

export interface ProfessionSkill {
  xp: number;
  completedJobs: number;
}

/** Career progress survives a change of occupation; workplace assignments are revalidated. */
export class ProfessionComponent implements Component {
  public schemaVersion = 1;
  public professionId: string | null = null;
  public workplaceId: number | null = null;
  public skills: Record<string, ProfessionSkill> = {};
  public chosenDay = 0;
  public lastReviewDay = -1;
  public lastWorkedDay = -1;
  public xpDay = -1;
  public dailyXp = 0;
  public recentEventIds: string[] = [];
  public completedBatchIds: string[] = [];
}

/** Intermediate goods belong to the employer, never to a global/shared inventory. */
export class ProfessionStockComponent implements Component {
  public goods: Record<string, number> = {};
}
