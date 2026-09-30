import { ECSWorld } from '../../ecs/World.ts';
import { PROFESSION_DAILY_XP_CAP, PROFESSION_RESOURCE_NAMES, PROFESSIONS_BY_ID } from '../../config/professions.config.ts';
import { ProfessionComponent, ProfessionStockComponent } from './ProfessionComponents.ts';

const object = (value: unknown): value is Record<string, any> => !!value && typeof value === 'object' && !Array.isArray(value);
const finite = (value: unknown, min: number, max: number): value is number => typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;
const day = (value: unknown) => finite(value, -1, Number.MAX_SAFE_INTEGER) && Number.isInteger(value);
const ids = (value: unknown): boolean => Array.isArray(value) && value.length <= 96 && new Set(value).size === value.length && value.every(id => typeof id === 'string' && id.length > 0 && id.length <= 180);
const BASE_KEYS = new Set(['food', 'wood', 'stone', 'herbs', 'pills', 'spiritStones', 'treasury']);

export function validateProfessionSave(entity: number, components: Record<string, any>): void {
  const career = components.profession;
  if (career !== undefined) {
    if (!object(career) || components.race?.raceId !== 'human' || components.animal || components.animalCarcass ||
        career.schemaVersion !== 1 || (career.professionId !== null && !PROFESSIONS_BY_ID.has(career.professionId)) ||
        (career.workplaceId !== null && (!Number.isSafeInteger(career.workplaceId) || career.workplaceId <= 0)) ||
        !object(career.skills) || Object.keys(career.skills).length > PROFESSIONS_BY_ID.size ||
        !['chosenDay', 'lastReviewDay', 'lastWorkedDay', 'xpDay'].every(key => day(career[key])) ||
        career.chosenDay < 0 || !finite(career.dailyXp, 0, PROFESSION_DAILY_XP_CAP) ||
        !ids(career.recentEventIds) || !ids(career.completedBatchIds)) throw new Error(`Nghề nghiệp của thực thể #${entity} không hợp lệ.`);
    for (const [id, skill] of Object.entries(career.skills)) {
      const def = PROFESSIONS_BY_ID.get(id);
      if (!def || !object(skill) || !finite(skill.xp, 0, def.studyNote ? 350 : 4500) ||
          !finite(skill.completedJobs, 0, 1_000_000_000) || !Number.isInteger(skill.completedJobs)) throw new Error(`Tay nghề ${id} của thực thể #${entity} không hợp lệ.`);
    }
    if (career.professionId !== null && !Object.hasOwn(career.skills, career.professionId)) throw new Error(`Nghề chính của #${entity} thiếu dữ liệu tay nghề.`);
  }
  const stock = components.professionStock;
  if (stock !== undefined) {
    if (!object(stock) || !object(stock.goods) || !components.faction ||
        Object.entries(stock.goods).some(([key, count]) => !Object.hasOwn(PROFESSION_RESOURCE_NAMES, key) || BASE_KEYS.has(key) || !finite(count, 0, 1_000_000_000))) {
      throw new Error(`Kho nghề nghiệp của thực thể #${entity} không hợp lệ.`);
    }
  }
}

export function serializeProfessions(world: ECSWorld, entity: number, components: Record<string, any>): void {
  const career = world.getComponent(entity, ProfessionComponent);
  if (career) components.profession = {
    schemaVersion: 1, professionId: career.professionId, workplaceId: career.workplaceId,
    chosenDay: career.chosenDay, lastReviewDay: career.lastReviewDay, lastWorkedDay: career.lastWorkedDay,
    xpDay: career.xpDay, dailyXp: career.dailyXp,
    skills: Object.fromEntries(Object.entries(career.skills).map(([id, skill]) => [id, { ...skill }])),
    recentEventIds: [...career.recentEventIds], completedBatchIds: [...career.completedBatchIds],
  };
  const stock = world.getComponent(entity, ProfessionStockComponent);
  if (stock) components.professionStock = { goods: { ...stock.goods } };
}

/** Legacy saves get an empty career; the normal simulation chooses a suitable occupation. */
export function hydrateProfessions(world: ECSWorld, entity: number, components: Record<string, any>): void {
  if (components.race?.raceId === 'human') {
    const career = new ProfessionComponent();
    const c = components.profession;
    if (c) {
      career.professionId = c.professionId;
      career.workplaceId = c.workplaceId;
      career.chosenDay = c.chosenDay;
      career.lastReviewDay = c.lastReviewDay;
      career.lastWorkedDay = c.lastWorkedDay;
      career.xpDay = c.xpDay;
      career.dailyXp = c.dailyXp;
      career.skills = Object.fromEntries(Object.entries(c.skills).map(([id, skill]) => [id, { ...(skill as { xp: number; completedJobs: number }) }]));
      career.recentEventIds = [...c.recentEventIds];
      career.completedBatchIds = [...c.completedBatchIds];
    }
    world.addComponent(entity, career);
  }
  if (components.professionStock) {
    const stock = new ProfessionStockComponent();
    stock.goods = { ...components.professionStock.goods };
    world.addComponent(entity, stock);
  }
}
