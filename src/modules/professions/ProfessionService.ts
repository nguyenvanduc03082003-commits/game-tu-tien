import { ECSWorld } from '../../ecs/World.ts';
import { EventBus } from '../../core/EventBus.ts';
import {
  PROFESSION_DEFINITIONS, PROFESSIONS_BY_ID, PROFESSION_DAILY_XP_CAP,
  PROFESSION_GOODS_CAP, PROFESSION_MIN_AGE, PROFESSION_REVIEW_DAYS,
  getProfessionRank, type ProfessionDefinition,
} from '../../config/professions.config.ts';
import { isCultivationFactionType } from '../../config/factions.config.ts';
import {
  ChildcareComponent, DailyScheduleComponent, HealthComponent, LifespanComponent,
  MortalNeedsComponent, PositionComponent, RaceComponent, RealmComponent, SpiritualRootComponent,
} from '../beings/BeingComponents.ts';
import { BuildingComponent, FactionComponent, MemberComponent, ResidenceComponent } from '../factions/FactionComponents.ts';
import { ProfessionComponent, ProfessionStockComponent } from './ProfessionComponents.ts';
import type { GrowthEvent } from '../talent/GrowthEvents.ts';
import type { PlanStep } from '../ai/brain/AIComponents.ts';
import { AStarPathfinder } from '../ai/pathfinding/AStar.ts';
import { WorldMap } from '../world/WorldMap.ts';
import { TerrainType } from '../world/TerrainType.ts';
import { CombatStatsComponent } from '../combat/CombatComponents.ts';
import { TalentProfileComponent } from '../talent/TalentComponents.ts';
import { AnimalCarcassComponent, AnimalComponent } from '../animals/AnimalComponents.ts';

type Employer = { entity: number; faction: FactionComponent };
const RESOURCE_FIELDS = {
  food: 'foodStock', wood: 'woodStock', stone: 'stoneStock', herbs: 'herbStock',
  pills: 'pillStock', spiritStones: 'spiritStones', treasury: 'treasury',
} as const;
type BaseResource = keyof typeof RESOURCE_FIELDS;
const isBaseResource = (key: string): key is BaseResource => Object.hasOwn(RESOURCE_FIELDS, key);

export function canHaveProfession(world: ECSWorld, entity: number): boolean {
  const hp = world.getComponent(entity, HealthComponent);
  return world.getComponent(entity, RaceComponent)?.raceId === 'human' && !!hp && !hp.isDead && hp.current > 0 &&
    !world.getComponent(entity, ChildcareComponent)?.isChild &&
    (world.getComponent(entity, LifespanComponent)?.currentAge ?? 0) >= PROFESSION_MIN_AGE;
}

export function getProfessionEmployer(world: ECSWorld, entity: number, def?: ProfessionDefinition): Employer | undefined {
  const home = world.getComponent(entity, ResidenceComponent)?.factionId;
  const member = world.getComponent(entity, MemberComponent)?.factionId;
  const ids = def?.branch === 'cultivation' || def?.sectOnly ? [member, home] : [home, member];
  for (const id of ids) {
    if (!id) continue;
    for (const fEntity of world.query([FactionComponent])) {
      const faction = world.getComponent(fEntity, FactionComponent)!;
      if (faction.factionId === id) return { entity: fEntity, faction };
    }
  }
  return undefined;
}

export function getProfessionEligibility(world: ECSWorld, entity: number, def: ProfessionDefinition): string | null {
  if (!canHaveProfession(world, entity)) return 'Cần là cư dân trưởng thành, còn sống, từ 16 tuổi.';
  if (def.branch === 'cultivation') {
    const root = world.getComponent(entity, SpiritualRootComponent);
    if (!root?.canCultivate()) return 'Cần linh căn đã thức tỉnh, có thể tu luyện.';
    if ((world.getComponent(entity, RealmComponent)?.stageIndex ?? 0) < def.minRealm) return `Cần đạt bậc cảnh giới ${def.minRealm}.`;
    if (!def.requiredElements.every(element => root.elements.includes(element))) return 'Chưa đủ thuộc tính linh căn yêu cầu.';
  }
  const employer = getProfessionEmployer(world, entity, def);
  if (def.sectOnly && (!employer || !isCultivationFactionType(employer.faction.type))) return 'Cần gia nhập hoặc cư trú trong tiên môn.';
  if (def.demonicOnly && employer?.faction.alignment !== 'demonic') return 'Chỉ truyền dạy trong thế lực Ma đạo.';
  return null;
}

export function ensureProfession(world: ECSWorld, entity: number): ProfessionComponent | undefined {
  if (world.getComponent(entity, RaceComponent)?.raceId !== 'human') return undefined;
  return world.getComponent(entity, ProfessionComponent) ?? world.addComponent(entity, new ProfessionComponent());
}

function stockFor(world: ECSWorld, employer: Employer): ProfessionStockComponent {
  return world.getComponent(employer.entity, ProfessionStockComponent) ?? world.addComponent(employer.entity, new ProfessionStockComponent());
}

export function availableProfessionResource(world: ECSWorld, employer: Employer, key: string): number {
  if (!isBaseResource(key)) return world.getComponent(employer.entity, ProfessionStockComponent)?.goods[key] ?? 0;
  const held = key === 'food' || key === 'wood' || key === 'stone' || key === 'spiritStones'
    ? employer.faction.reservedResources[key] : 0;
  return Math.max(0, employer.faction[RESOURCE_FIELDS[key]] - held);
}

function addResource(world: ECSWorld, employer: Employer, key: string, amount: number): void {
  if (isBaseResource(key)) employer.faction[RESOURCE_FIELDS[key]] += amount;
  else {
    const stock = stockFor(world, employer);
    stock.goods[key] = (stock.goods[key] ?? 0) + amount;
  }
}

export function transferProfessionStock(world: ECSWorld, from: number, to: number): void {
  if (from === to) return;
  const source = world.getComponent(from, ProfessionStockComponent);
  if (!source || !world.hasComponent(to, FactionComponent)) return;
  const target = world.getComponent(to, ProfessionStockComponent) ?? world.addComponent(to, new ProfessionStockComponent());
  for (const [key, count] of Object.entries(source.goods)) target.goods[key] = (target.goods[key] ?? 0) + count;
  source.goods = {};
}

function eligibleBuilding(world: ECSWorld, entity: number, bEntity: number, def: ProfessionDefinition, employer: Employer): boolean {
  const building = world.getComponent(bEntity, BuildingComponent);
  const pos = world.getComponent(bEntity, PositionComponent);
  const worker = world.getComponent(entity, PositionComponent);
  const residence = world.getComponent(entity, ResidenceComponent);
  return !!building && !!pos && !!worker && !building.isUnderConstruction && !building.isRuins && building.currentDurability > 0 &&
    building.factionId === employer.faction.factionId && def.workplaces.includes(building.buildingType) &&
    (!residence || residence.factionId !== building.factionId || !building.settlementId || building.settlementId === residence.settlementId) &&
    Math.hypot(worker.x - pos.x, worker.y - pos.y) <= 600;
}

function nearbyResidents(world: ECSWorld, employer: Employer, bEntity: number): number[] {
  const center = world.getComponent(bEntity, PositionComponent)!;
  return world.query([PositionComponent, HealthComponent, RaceComponent]).filter(entity => {
    const hp = world.getComponent(entity, HealthComponent)!;
    const pos = world.getComponent(entity, PositionComponent)!;
    const home = world.getComponent(entity, ResidenceComponent);
    const member = world.getComponent(entity, MemberComponent);
    return !hp.isDead && hp.current > 0 && (home?.factionId === employer.faction.factionId || member?.factionId === employer.faction.factionId) &&
      Math.hypot(center.x - pos.x, center.y - pos.y) <= 100;
  });
}

const TRADE_PRICES: Record<string, number> = { metal: 3, planks: 2, cloth: 3, prepared_herbs: 2, spirit_metal: 9, spirit_cloth: 8, puppet_parts: 10 };
function tradeGood(world: ECSWorld, employer: Employer, def: ProfessionDefinition): string | undefined {
  return Object.keys(TRADE_PRICES).find(key => (def.id !== 'appraiser' || ['spirit_metal', 'spirit_cloth', 'puppet_parts'].includes(key)) &&
    availableProfessionResource(world, employer, key) >= 6);
}

export function professionWorkBlockedReason(world: ECSWorld, entity: number, def: ProfessionDefinition, bEntity: number, worldMap?: WorldMap): string | null {
  const eligibility = getProfessionEligibility(world, entity, def);
  if (eligibility) return eligibility;
  const employer = getProfessionEmployer(world, entity, def);
  if (!employer || !eligibleBuilding(world, entity, bEntity, def, employer)) return 'Thiếu nơi làm việc hợp lệ trong cộng đồng.';
  const recipe = def.recipe;
  if (!recipe) return 'Thực hành nghề qua lao động thường ngày.';
  if (Object.entries(recipe.inputs).some(([key, count]) => availableProfessionResource(world, employer, key) < count)) return 'Kho chưa đủ nguyên liệu khả dụng.';
  if (Object.entries(recipe.outputs).some(([key, count]) => availableProfessionResource(world, employer, key) + count > PROFESSION_GOODS_CAP)) return 'Kho đã đủ sản phẩm, tạm ngừng sản xuất.';
  if (recipe.effect === 'study' && (world.getComponent(entity, ProfessionComponent)?.skills[def.id]?.xp ?? 0) >= 350) return 'Đã học xong nền tảng; chờ cơ chế chuyên môn.';
  if (recipe.effect === 'trade' && !tradeGood(world, employer, def)) return 'Chưa có hàng thủ công dư thừa để bán.';
  if (recipe.effect === 'repair') {
    const b = world.getComponent(bEntity, BuildingComponent)!;
    if (b.currentDurability >= b.maxDurability) return 'Hộ trận chưa cần sửa chữa.';
  }
  if ((recipe.effect === 'security' || recipe.effect === 'administration') && employer.faction.stability >= 95) return 'Trật tự cộng đồng đã ổn định.';
  if (recipe.effect === 'heal' && !nearbyResidents(world, employer, bEntity).some(id => {
    const hp = world.getComponent(id, HealthComponent)!;
    return hp.current < hp.max;
  })) return 'Không có người cần chữa thương ở gần.';
  if (recipe.effect === 'morale' && !nearbyResidents(world, employer, bEntity).some(id => (world.getComponent(id, MortalNeedsComponent)?.recreation ?? 100) < 85)) return 'Cư dân ở gần chưa cần phục vụ.';
  if (def.id === 'miner' || def.id === 'geomancer') {
    if (!worldMap) return 'Cần khảo sát địa hình vùng núi.';
    const pos = world.getComponent(bEntity, PositionComponent)!;
    const tx = Math.floor(pos.x / worldMap.tileSize), ty = Math.floor(pos.y / worldMap.tileSize);
    let hasMountain = false;
    for (let dy = -8; dy <= 8 && !hasMountain; dy++) for (let dx = -8; dx <= 8; dx++) {
      if (worldMap.isInBounds(tx + dx, ty + dy) && worldMap.getTile(tx + dx, ty + dy)?.terrain === TerrainType.MOUNTAIN) { hasMountain = true; break; }
    }
    if (!hasMountain) return 'Cần điểm tập kết gần núi để khai khoáng.';
  }
  return null;
}

export function findProfessionWorkplace(world: ECSWorld, entity: number, def: ProfessionDefinition, worldMap?: WorldMap): number | null {
  const pos = world.getComponent(entity, PositionComponent);
  if (!pos) return null;
  let best: number | null = null, nearest = Infinity;
  for (const bEntity of world.query([BuildingComponent, PositionComponent])) {
    if (professionWorkBlockedReason(world, entity, def, bEntity, worldMap)) continue;
    const bp = world.getComponent(bEntity, PositionComponent)!;
    const distance = Math.hypot(bp.x - pos.x, bp.y - pos.y);
    if (distance < nearest) { best = bEntity; nearest = distance; }
  }
  return best;
}

/** Seven day reviews preserve learned skills; missing roots/workplaces are checked immediately. */
export function reviewProfession(world: ECSWorld, entity: number, worldMap?: WorldMap): void {
  const career = ensureProfession(world, entity);
  if (!career) return;
  if (!canHaveProfession(world, entity)) { career.professionId = null; career.workplaceId = null; return; }
  const day = world.calendarDayFloorAtTick();
  const current = career.professionId ? PROFESSIONS_BY_ID.get(career.professionId) : undefined;
  const employer = current ? getProfessionEmployer(world, entity, current) : undefined;
  const currentValid = current && !getProfessionEligibility(world, entity, current) &&
    (!current.recipe || (career.workplaceId !== null && employer && eligibleBuilding(world, entity, career.workplaceId, current, employer)));
  if (currentValid && day >= career.lastReviewDay && day - career.lastReviewDay < PROFESSION_REVIEW_DAYS) return;
  career.lastReviewDay = day;
  const schedule = world.getComponent(entity, DailyScheduleComponent);
  let best: ProfessionDefinition | undefined, bestWorkplace: number | null = null, bestScore = -Infinity;
  for (const def of PROFESSION_DEFINITIONS) {
    if (getProfessionEligibility(world, entity, def)) continue;
    const workplace = def.recipe ? findProfessionWorkplace(world, entity, def, worldMap) : null;
    if (def.recipe && workplace === null) continue;
    const emp = getProfessionEmployer(world, entity, def);
    let peers = 0;
    if (emp) for (const peer of world.query([ProfessionComponent])) {
      if (peer !== entity && world.getComponent(peer, ProfessionComponent)?.professionId === def.id &&
          getProfessionEmployer(world, peer, def)?.entity === emp.entity && canHaveProfession(world, peer)) peers++;
    }
    const tie = ((Math.imul(entity + 1, def.id.length * 131 + def.id.charCodeAt(0)) >>> 0) % 100) / 100;
    const skill = getProfessionRank(career.skills[def.id]?.xp ?? 0);
    const score = (def.job === schedule?.preferredJob ? 10 : 0) + (def.recipe ? 20 : 5) +
      (def.branch === 'cultivation' ? 18 : 0) + (def.id === career.professionId ? 8 : 0) + skill * 5 - peers * 12 + tie;
    if (score > bestScore) { best = def; bestWorkplace = workplace; bestScore = score; }
  }
  if (!best) { career.professionId = null; career.workplaceId = null; return; }
  if (career.professionId !== best.id) career.chosenDay = day;
  career.professionId = best.id;
  career.workplaceId = bestWorkplace;
  career.skills[best.id] ??= { xp: 0, completedJobs: 0 };
  if (schedule) schedule.preferredJob = best.job;
}

export function professionEfficiency(world: ECSWorld, entity: number, domain: string): number {
  const career = world.getComponent(entity, ProfessionComponent);
  if (!career || !canHaveProfession(world, entity)) return 1;
  let rank = 0;
  for (const def of PROFESSION_DEFINITIONS) {
    if ((def.id === domain || def.domains.includes(domain)) && !getProfessionEligibility(world, entity, def)) rank = Math.max(rank, getProfessionRank(career.skills[def.id]?.xp ?? 0));
  }
  return 1 + rank * 0.1;
}

export function recordProfessionWork(event: GrowthEvent): boolean {
  if (!['work_completed', 'responsibility_completed'].includes(event.kind) || !Number.isFinite(event.evidence.actualOutput) || (event.evidence.actualOutput ?? 0) <= 0 ||
      !Number.isFinite(event.tick) || event.tick < 0 || event.tick > event.world.getCurrentTick() || !canHaveProfession(event.world, event.entityId)) return false;
  const career = ensureProfession(event.world, event.entityId)!;
  if (career.recentEventIds.includes(event.eventId)) return false;
  const domain = event.evidence.professionDomain ?? '';
  const current = career.professionId ? PROFESSIONS_BY_ID.get(career.professionId) : undefined;
  const matches = (def: ProfessionDefinition) => (def.id === domain || def.domains.includes(domain)) && !getProfessionEligibility(event.world, event.entityId, def);
  const def = current && matches(current) ? current : PROFESSION_DEFINITIONS.find(matches);
  if (!def) return false;
  const day = event.world.calendarDayFloorAtTick(event.tick);
  if (day < career.xpDay) return false;
  if (career.xpDay !== day) { career.xpDay = day; career.dailyXp = 0; }
  career.recentEventIds.push(event.eventId);
  career.recentEventIds = career.recentEventIds.slice(-96);
  const skill = career.skills[def.id] ??= { xp: 0, completedJobs: 0 };
  const comprehension = event.world.getComponent(event.entityId, TalentProfileComponent)?.base.comprehension ?? 50;
  const gain = Math.min(8 * (0.75 + Math.max(0, Math.min(100, comprehension)) / 200), PROFESSION_DAILY_XP_CAP - career.dailyXp,
    (def.studyNote ? 350 : 4500) - skill.xp);
  skill.xp += Math.max(0, gain);
  career.dailyXp += Math.max(0, gain);
  skill.completedJobs = Math.min(1_000_000_000, skill.completedJobs + 1);
  career.lastWorkedDay = day;
  return true;
}

export function planProfessionWork(world: ECSWorld, entity: number, worldMap: WorldMap): PlanStep[] | null {
  const career = world.getComponent(entity, ProfessionComponent);
  const def = career?.professionId ? PROFESSIONS_BY_ID.get(career.professionId) : undefined;
  if (career && def?.id === 'hunter') return planHunterWork(world, entity, worldMap);
  if (!career || !def?.recipe) return null;
  const workplace = findProfessionWorkplace(world, entity, def, worldMap);
  if (workplace === null) return null;
  const bp = world.getComponent(workplace, PositionComponent)!;
  const b = world.getComponent(workplace, BuildingComponent)!;
  const pos = world.getComponent(entity, PositionComponent)!;
  const ts = worldMap.tileSize, x = Math.floor(bp.x / ts), y = Math.floor(bp.y / ts);
  const candidates = [
    { x: (x + Math.floor(b.widthTiles / 2) + .5) * ts, y: (y + b.heightTiles + .5) * ts },
    { x: (x - .5) * ts, y: (y + .5) * ts },
    { x: (x + b.widthTiles + .5) * ts, y: (y + .5) * ts },
    { x: (x + .5) * ts, y: (y - .5) * ts },
  ];
  const blocked = AStarPathfinder.getBlockedBuildingTiles(world, worldMap);
  for (const point of candidates) {
    if (!AStarPathfinder.isTileWalkable(Math.floor(point.x / ts), Math.floor(point.y / ts), worldMap, blocked, false)) continue;
    if (Math.hypot(pos.x - point.x, pos.y - point.y) > 8 && AStarPathfinder.findPath(worldMap, world, pos, point, true).length === 0) continue;
    career.workplaceId = workplace;
    const owner = getProfessionEmployer(world, entity, def)!;
    return [
      { type: 'MOVE_TO', description: `Tới nơi hành nghề ${def.name}`, targetPos: point },
      { type: 'PERFORM_WORK', description: `${def.studyNote ? 'Học nền tảng' : 'Làm việc'}: ${def.name}`, duration: def.recipe.seconds / professionEfficiency(world, entity, def.id), targetPos: point,
        customData: { workType: def.id, professionId: def.id, workplaceId: workplace, employerId: owner.entity, professionProgress: 0 } },
    ];
  }
  return null;
}

function planHunterWork(world: ECSWorld, entity: number, worldMap: WorldMap): PlanStep[] | null {
  const pos = world.getComponent(entity, PositionComponent);
  const needs = world.getComponent(entity, MortalNeedsComponent);
  const hp = world.getComponent(entity, HealthComponent);
  if (!pos || !needs || !hp || !canHaveProfession(world, entity) || needs.rawFoodCount >= 6) return null;
  const reachable = (id: number) => {
    const target = world.getComponent(id, PositionComponent)!;
    return Math.hypot(target.x - pos.x, target.y - pos.y) <= 220 &&
      (Math.hypot(target.x - pos.x, target.y - pos.y) <= 20 || AStarPathfinder.findPath(worldMap, world, pos, target, false).length > 0);
  };
  const corpses = world.query([AnimalCarcassComponent, PositionComponent]).filter(id => world.getComponent(id, AnimalCarcassComponent)!.remainingNutrition > 0 && reachable(id));
  if (corpses.length) {
    const carcass = corpses[0];
    return [{ type: 'MOVE_TO', description: 'Tới thu hồi thịt dã thú', targetEntityId: carcass },
      { type: 'PERFORM_WORK', description: 'Pha thịt dã thú làm lương thực', duration: 3, targetEntityId: carcass, customData: { workType: 'hunt', carcassId: carcass, huntingProgress: 0 } }];
  }
  if (!world.hasComponent(entity, CombatStatsComponent)) return null;
  const prey = world.query([AnimalComponent, HealthComponent, PositionComponent]).find(id => {
    const targetHp = world.getComponent(id, HealthComponent)!;
    return !targetHp.isDead && targetHp.current > 0 && targetHp.max <= hp.current / 2 && reachable(id);
  });
  return prey === undefined ? null : [{ type: 'ATTACK_TARGET', description: 'Săn dã thú nhỏ để lấy thực phẩm', targetEntityId: prey }];
}

export function completeHunterHarvest(world: ECSWorld, entity: number, step: PlanStep, batchId: string): boolean {
  const carcassId = step.customData?.carcassId;
  const carcass = world.getComponent(carcassId, AnimalCarcassComponent);
  const pos = world.getComponent(entity, PositionComponent), target = world.getComponent(carcassId, PositionComponent);
  const needs = world.getComponent(entity, MortalNeedsComponent);
  const career = world.getComponent(entity, ProfessionComponent);
  if (!canHaveProfession(world, entity) || !carcass || !pos || !target || !needs || !career || career.professionId !== 'hunter' ||
      career.completedBatchIds.includes(batchId) || !Number.isFinite(step.customData.huntingProgress) || step.customData.huntingProgress < 3 ||
      Math.hypot(pos.x - target.x, pos.y - target.y) > 28 || needs.rawFoodCount >= 10 || carcass.remainingNutrition <= 0) return false;
  const amount = Math.min(carcass.remainingNutrition, 40, (10 - needs.rawFoodCount) * 20);
  carcass.remainingNutrition -= amount;
  needs.rawFoodCount += amount / 20;
  step.customData._actualOutput = amount / 20;
  career.completedBatchIds.push(batchId); career.completedBatchIds = career.completedBatchIds.slice(-96);
  if (carcass.remainingNutrition <= 0) world.destroyEntity(carcassId);
  return true;
}

/** Called only after a full work session. Recheck the employer and stock at commit time. */
export function completeProfessionBatch(world: ECSWorld, entity: number, step: PlanStep, batchId: string, worldMap: WorldMap): boolean {
  const def = PROFESSIONS_BY_ID.get(step.customData?.professionId);
  const career = world.getComponent(entity, ProfessionComponent);
  const workplace = step.customData?.workplaceId;
  if (!career || !def?.recipe || career.professionId !== def.id || career.completedBatchIds.includes(batchId) ||
      !Number.isFinite(step.customData?.professionProgress) || step.customData.professionProgress < def.recipe.seconds ||
      professionWorkBlockedReason(world, entity, def, workplace, worldMap)) return false;
  const employer = getProfessionEmployer(world, entity, def)!;
  if (employer.entity !== step.customData.employerId || !isAtProfessionWorkplace(world, entity, workplace, worldMap)) return false;
  const combat = world.getComponent(entity, CombatStatsComponent);
  if (combat?.targetEntityId != null) return false;
  const targets = nearbyResidents(world, employer, workplace);
  // All preconditions above precede any mutation; competing workers cannot overdraw a stock.
  for (const [key, count] of Object.entries(def.recipe.inputs)) addResource(world, employer, key, -count);
  for (const [key, count] of Object.entries(def.recipe.outputs)) addResource(world, employer, key, count);
  switch (def.recipe.effect) {
    case 'heal': {
      const target = targets.find(id => world.getComponent(id, HealthComponent)!.current < world.getComponent(id, HealthComponent)!.max)!;
      const hp = world.getComponent(target, HealthComponent)!;
      hp.current = Math.min(hp.max, hp.current + (def.branch === 'cultivation' ? 25 : 10));
      break;
    }
    case 'repair': {
      const b = world.getComponent(workplace, BuildingComponent)!;
      b.currentDurability = Math.min(b.maxDurability, b.currentDurability + 40);
      break;
    }
    case 'morale':
      for (const target of targets.slice(0, 4)) {
        const needs = world.getComponent(target, MortalNeedsComponent);
        if (needs) needs.recreation = Math.min(100, needs.recreation + 15);
      }
      break;
    case 'security':
    case 'administration': {
      const talisman = def.recipe.effect === 'security' && availableProfessionResource(world, employer, 'talismans') >= 1;
      if (talisman) addResource(world, employer, 'talismans', -1);
      employer.faction.stability = Math.min(95, employer.faction.stability + (talisman ? 3 : 1));
      break;
    }
    case 'trade': {
      const key = tradeGood(world, employer, def)!;
      addResource(world, employer, key, -1);
      employer.faction.treasury += TRADE_PRICES[key] * (def.id === 'appraiser' ? 1.25 : 1);
      break;
    }
  }
  career.completedBatchIds.push(batchId);
  career.completedBatchIds = career.completedBatchIds.slice(-96);
  step.customData._actualOutput = 1;
  EventBus.getInstance().emit('activity:feedback', { entityId: entity, text: `${def.name}: hoàn thành ${def.studyNote ? 'buổi học' : 'công việc'}`, color: def.branch === 'cultivation' ? '#c084fc' : '#facc15' });
  return true;
}

export function isAtProfessionWorkplace(world: ECSWorld, entity: number, workplace: number, worldMap: WorldMap): boolean {
  const pos = world.getComponent(entity, PositionComponent), bp = world.getComponent(workplace, PositionComponent);
  const b = world.getComponent(workplace, BuildingComponent);
  if (!pos || !bp || !b) return false;
  const ts = worldMap.tileSize;
  const left = Math.floor(bp.x / ts) * ts, top = Math.floor(bp.y / ts) * ts;
  const right = left + b.widthTiles * ts, bottom = top + b.heightTiles * ts;
  const outside = pos.x < left || pos.x >= right || pos.y < top || pos.y >= bottom;
  const dx = Math.max(left - pos.x, 0, pos.x - right), dy = Math.max(top - pos.y, 0, pos.y - bottom);
  return outside && Math.hypot(dx, dy) <= ts * 1.5;
}
