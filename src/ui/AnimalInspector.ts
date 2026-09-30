import { getAnimalSpecies } from '../config/animals/animal.catalog.ts';
import { ANIMAL_GROUP_LABELS } from '../config/animals/animal.simulation.ts';
import {
  AnimalAIState,
  AnimalDiet,
  AnimalLifeStage,
} from '../config/animals/animal.types.ts';
import { ECSWorld } from '../ecs/World.ts';
import {
  AnimalBrainComponent,
  AnimalCarcassComponent,
  AnimalComponent,
} from '../modules/animals/AnimalComponents.ts';
import {
  HealthComponent,
  HungerComponent,
  LifespanComponent,
  NameComponent,
} from '../modules/beings/BeingComponents.ts';
import { CombatStatsComponent } from '../modules/combat/CombatComponents.ts';

function escapeHtml(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const LIFE_STAGE_LABELS: Readonly<Record<AnimalLifeStage, string>> = {
  child: 'Con non',
  adult: 'Trưởng thành',
  elder: 'Già',
};

const DIET_LABELS: Readonly<Record<AnimalDiet, string>> = {
  herbivore: '🌿 Ăn cỏ / Thực vật',
  carnivore: '🥩 Ăn thịt / Săn mồi',
  omnivore: '🌾🥩 Ăn tạp',
};

const AI_STATE_LABELS: Readonly<Record<AnimalAIState, string>> = {
  idle: '⏸️ Đứng yên nghỉ ngơi',
  wander: '🐾 Lang thang dạo bước',
  forage: '🌿 Kiếm ăn thực vật',
  hunt: '🩸 Đang săn mồi',
  eat: '🍖 Đang ăn xác mồi',
  flee: '💨 Đang chạy trốn nguy hiểm',
  dead: '💀 Đã chết',
};

export class AnimalInspector {
  public static renderAnimalHtml(world: ECSWorld, entityId: number): string {
    const animal = world.getComponent(entityId, AnimalComponent);
    if (!animal) return '';

    const spec = getAnimalSpecies(animal.speciesId);
    const nameComp = world.getComponent(entityId, NameComponent);
    const hp = world.getComponent(entityId, HealthComponent);
    const hunger = world.getComponent(entityId, HungerComponent);
    const life = world.getComponent(entityId, LifespanComponent);
    const brain = world.getComponent(entityId, AnimalBrainComponent);
    const combat = world.getComponent(entityId, CombatStatsComponent);

    const displayName = nameComp?.name || spec.name;
    const groupLabel = ANIMAL_GROUP_LABELS[spec.group];
    const sexLabel = animal.sex === 'male' ? '♂ Đực' : '♀ Cái';
    const stageLabel = LIFE_STAGE_LABELS[animal.lifeStage] ?? animal.lifeStage;
    const dietLabel = DIET_LABELS[spec.diet] ?? spec.diet;
    const aiState: AnimalAIState =
      hp?.isDead ? 'dead' : brain?.state ?? 'idle';
    const aiLabel = AI_STATE_LABELS[aiState] ?? aiState;

    const currentHp = Math.max(0, Math.round(hp?.current ?? spec.maxHealth));
    const maxHp = Math.max(1, Math.round(hp?.max ?? spec.maxHealth));
    const hpPercent = Math.max(0, Math.min(100, Math.round((currentHp / maxHp) * 100)));

    const currentHunger = Math.max(0, Math.round(hunger?.current ?? 100));
    const maxHunger = Math.max(1, Math.round(hunger?.max ?? 100));
    const hungerPercent = Math.max(
      0,
      Math.min(100, Math.round((currentHunger / maxHunger) * 100))
    );

    const ageYears = life ? life.currentAge.toFixed(1) : '0.0';
    const maxLifespan = life ? life.maxLifespan : spec.lifespanYears;

    const preyNames = spec.preySpeciesIds.map((preyId) => {
      try {
        return getAnimalSpecies(preyId).name;
      } catch {
        return preyId;
      }
    });

    const preyHtml =
      preyNames.length > 0
        ? `
        <div style="font-size: 11px; color: #cbd5e1; margin-top: 4px;">
          <span style="color: #94a3b8;">Con mồi tự nhiên:</span>
          <b>${escapeHtml(preyNames.join(', '))}</b>
        </div>
      `
        : '';

    const cooldownHtml =
      animal.lifeStage === 'adult'
        ? `
        <div style="display: flex; justify-content: space-between; font-size: 11px;">
          <span style="color: #94a3b8;">Chu kỳ sinh sản:</span>
          <b style="color: ${animal.reproductionCooldownDays <= 0 ? '#4ade80' : '#fbbf24'};">
            ${
              animal.reproductionCooldownDays <= 0
                ? 'Sẵn sàng ghép đôi'
                : `Hồi sức (${Math.ceil(animal.reproductionCooldownDays)} ngày)`
            }
          </b>
        </div>
      `
        : '';

    return `
      <div data-animal-inspector="${escapeHtml(spec.id)}" style="display: flex; flex-direction: column; gap: 10px;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #30363d; padding-bottom: 8px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="width: 34px; height: 34px; border-radius: 8px; background: ${spec.primaryColor}33; border: 2px solid ${spec.primaryColor}; display: flex; align-items: center; justify-content: center; font-size: 18px;">
              🐾
            </div>
            <div>
              <h3 style="margin: 0; color: #f8fafc; font-size: 16px;">${escapeHtml(displayName)}</h3>
              <div style="font-size: 11px; color: #86efac; margin-top: 2px;">
                Động Vật Hoang Dã • ${escapeHtml(groupLabel)}
              </div>
            </div>
          </div>
          <button id="close-inspector-btn" style="background: transparent; border: none; color: #8b949e; cursor: pointer; font-size: 18px;">✕</button>
        </div>

        <div style="background: #161b22; border: 1px solid #30363d; border-radius: 8px; padding: 10px; display: flex; flex-direction: column; gap: 6px;">
          <div style="display: flex; justify-content: space-between; font-size: 12px;">
            <span style="color: #94a3b8;">Loài:</span>
            <b style="color: #f8fafc;">${escapeHtml(spec.name)}</b>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 12px;">
            <span style="color: #94a3b8;">Phân nhóm:</span>
            <span style="color: #cbd5e1;">${escapeHtml(groupLabel)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 12px;">
            <span style="color: #94a3b8;">Giới tính:</span>
            <b style="color: ${animal.sex === 'male' ? '#60a5fa' : '#f472b6'};">${sexLabel}</b>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 12px;">
            <span style="color: #94a3b8;">Giai đoạn sống:</span>
            <b style="color: #fde047;">${escapeHtml(stageLabel)}</b>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 12px;">
            <span style="color: #94a3b8;">Tuổi / Tuổi thọ:</span>
            <b style="color: #e2e8f0;">${ageYears} / ${maxLifespan} năm</b>
          </div>
          ${cooldownHtml}
        </div>

        <div style="background: #0d1117; border: 1px solid #30363d; border-radius: 8px; padding: 10px; display: flex; flex-direction: column; gap: 8px;">
          <div>
            <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 3px;">
              <span style="color: #94a3b8;">❤️ Sinh lực (HP):</span>
              <b style="color: #f87171;">${currentHp} / ${maxHp}</b>
            </div>
            <div style="width: 100%; height: 6px; background: #21262d; border-radius: 3px; overflow: hidden;">
              <div style="width: ${hpPercent}%; height: 100%; background: linear-gradient(90deg, #ef4444, #4ade80);"></div>
            </div>
          </div>

          <div>
            <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 3px;">
              <span style="color: #94a3b8;">🍖 Độ no:</span>
              <b style="color: #fbbf24;">${currentHunger} / ${maxHunger}</b>
            </div>
            <div style="width: 100%; height: 6px; background: #21262d; border-radius: 3px; overflow: hidden;">
              <div style="width: ${hungerPercent}%; height: 100%; background: linear-gradient(90deg, #f59e0b, #fde047);"></div>
            </div>
          </div>
        </div>

        <div style="background: #161b22; border: 1px solid #30363d; border-radius: 8px; padding: 10px; display: flex; flex-direction: column; gap: 6px;">
          <div style="display: flex; justify-content: space-between; font-size: 12px;">
            <span style="color: #94a3b8;">Tập tính dinh dưỡng:</span>
            <b style="color: #86efac;">${dietLabel}</b>
          </div>
          ${preyHtml}
          <div style="display: flex; justify-content: space-between; font-size: 12px; border-top: 1px solid #21262d; padding-top: 6px; margin-top: 2px;">
            <span style="color: #94a3b8;">Hành vi hiện tại:</span>
            <b style="color: #38bdf8;">${aiLabel}</b>
          </div>
        </div>

        <div style="background: #0d1117; border: 1px solid #30363d; border-radius: 8px; padding: 8px 10px; display: flex; justify-content: space-between; font-size: 11px; color: #94a3b8;">
          <span>⚔️ Công: <b style="color: #e2e8f0;">${combat?.baseAtk ?? spec.attack}</b></span>
          <span>🛡️ Thủ: <b style="color: #e2e8f0;">${combat?.defense ?? spec.defense}</b></span>
          <span>🏃 Tốc độ: <b style="color: #e2e8f0;">${spec.moveSpeed}</b></span>
        </div>
      </div>
    `;
  }

  public static renderCarcassHtml(world: ECSWorld, entityId: number): string {
    const carcass = world.getComponent(entityId, AnimalCarcassComponent);
    if (!carcass) return '';

    const spec = getAnimalSpecies(carcass.speciesId);

    return `
      <div data-animal-carcass-inspector="${escapeHtml(spec.id)}" style="display: flex; flex-direction: column; gap: 10px;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #30363d; padding-bottom: 8px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 24px;">🦴</span>
            <div>
              <h3 style="margin: 0; color: #f8fafc; font-size: 16px;">Xác ${escapeHtml(spec.name)}</h3>
              <div style="font-size: 11px; color: #94a3b8; margin-top: 2px;">
                Xác Động Vật • Nguồn thức ăn cho thú săn mồi
              </div>
            </div>
          </div>
          <button id="close-inspector-btn" style="background: transparent; border: none; color: #8b949e; cursor: pointer; font-size: 18px;">✕</button>
        </div>

        <div style="background: #161b22; border: 1px solid #30363d; border-radius: 8px; padding: 10px; display: flex; flex-direction: column; gap: 6px; font-size: 12px;">
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #94a3b8;">Dinh dưỡng còn lại:</span>
            <b style="color: #fca5a5;">${Math.max(0, Math.round(carcass.remainingNutrition))} điểm</b>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #94a3b8;">Thời gian phân hủy:</span>
            <b style="color: #38bdf8;">${Math.max(0, carcass.decayRemainingDays).toFixed(1)} ngày</b>
          </div>
        </div>
      </div>
    `;
  }
}
