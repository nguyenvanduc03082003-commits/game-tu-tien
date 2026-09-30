import { ECSWorld } from '../ecs/World.ts';
import { PROFESSION_MIN_AGE, PROFESSION_RANK_NAMES, PROFESSION_RESOURCE_NAMES, PROFESSION_XP_THRESHOLDS, PROFESSIONS_BY_ID, getProfessionRank } from '../config/professions.config.ts';
import { ProfessionComponent, ProfessionStockComponent } from '../modules/professions/ProfessionComponents.ts';
import { BuildingComponent, FactionComponent } from '../modules/factions/FactionComponents.ts';
import { getProfessionEligibility, getProfessionEmployer } from '../modules/professions/ProfessionService.ts';
import { HealthComponent, LifespanComponent } from '../modules/beings/BeingComponents.ts';

const escape = (text: string) => text.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

export function renderProfessionPanel(world: ECSWorld, entity: number): string {
  const career = world.getComponent(entity, ProfessionComponent);
  if (!career) return '';
  const def = career.professionId ? PROFESSIONS_BY_ID.get(career.professionId) : undefined;
  if (!def) return `<div style="font-size:11px;color:#8b949e">Nghề nghiệp: ${(world.getComponent(entity, LifespanComponent)?.currentAge ?? 0) < PROFESSION_MIN_AGE ? 'Chưa đến tuổi học nghề (16 tuổi)' : world.getComponent(entity, HealthComponent)?.isDead ? 'Đã qua đời' : 'Đang tìm nghề phù hợp'}</div>`;
  const skill = career.skills[def.id] ?? { xp: 0, completedJobs: 0 };
  const rank = getProfessionRank(skill.xp);
  const threshold = PROFESSION_XP_THRESHOLDS[rank + 1];
  const progress = threshold ? (skill.xp - PROFESSION_XP_THRESHOLDS[rank]) / (threshold - PROFESSION_XP_THRESHOLDS[rank]) * 100 : 100;
  const workplace = career.workplaceId === null ? undefined : world.getComponent(career.workplaceId, BuildingComponent);
  const employer = getProfessionEmployer(world, entity, def);
  const reason = getProfessionEligibility(world, entity, def);
  const learned = Object.entries(career.skills).filter(([id, s]) => id !== def.id && s.xp > 0);
  return `<div style="background:#161b22;border:1px solid #30363d;border-radius:8px;padding:9px;display:flex;flex-direction:column;gap:5px;font-size:11px">
    <div style="color:${def.branch === 'cultivation' ? '#c084fc' : '#facc15'};font-weight:bold">${def.branch === 'cultivation' ? '☯ Tu chân bách nghệ' : '⚒ Phàm trần bách nghiệp'} · ${escape(def.name)}</div>
    <div>${PROFESSION_RANK_NAMES[rank]} · ${Math.floor(skill.xp)}${threshold ? ` / ${threshold}` : ''} KN · ${skill.completedJobs} việc hoàn thành</div>
    <div style="height:5px;background:#30363d;border-radius:4px;overflow:hidden"><div style="height:100%;width:${Math.max(0, Math.min(100, progress))}%;background:#38bdf8"></div></div>
    <div>${escape(def.description)}</div>
    <div style="color:#8b949e">Nơi làm: ${escape(workplace?.name ?? 'Lao động tự do / việc cộng đồng')}<br>Cộng đồng: ${escape(employer?.faction.name ?? 'Chưa định cư')}<br>Hiệu suất tay nghề: +${rank * 10}%</div>
    ${reason ? `<div style="color:#fca5a5">${escape(reason)}</div>` : ''}
    ${def.studyNote ? `<div style="color:#fbbf24">${escape(def.studyNote)} Giới hạn học nền tảng: 350 KN.</div>` : ''}
    ${def.id === 'puppeteer' ? '<div style="color:#fbbf24">Hiện chế tạo linh kiện; chưa triển khai khôi lỗi tự hành.</div>' : ''}
    ${learned.length ? `<div style="border-top:1px solid #30363d;padding-top:4px">Tay nghề đã học: ${learned.map(([id, s]) => `${escape(PROFESSIONS_BY_ID.get(id)?.name ?? id)} (${PROFESSION_RANK_NAMES[getProfessionRank(s.xp)]})`).join(', ')}</div>` : ''}
  </div>`;
}

export function renderProfessionStock(world: ECSWorld, factionId: string): string {
  const entity = world.query([FactionComponent]).find(id => world.getComponent(id, FactionComponent)!.factionId === factionId);
  if (entity === undefined) return '';
  const goods = world.getComponent(entity, ProfessionStockComponent)?.goods ?? {};
  const rows = Object.entries(goods).filter(([, count]) => count > 0);
  if (!rows.length) return '';
  return `<div style="font-size:11px;line-height:1.5;color:#d2a8ff">Sản phẩm nghề: ${rows.map(([id, count]) => `${escape(PROFESSION_RESOURCE_NAMES[id] ?? id)}: ${Math.floor(count)}`).join(' · ')}</div>`;
}
