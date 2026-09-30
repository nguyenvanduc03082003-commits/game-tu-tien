import { renderSocialRelationshipDetails, renderSocialBondHistory } from './SocialRelationshipInspector.ts';
import { calculatePlantGrowth, calculateEnvironmentalPlantGrowth } from '../modules/world/TerrainEnvironment.ts';
import { TerrainType } from '../config/terrains.config.ts';
import { AppearanceComponent, lifeStage } from '../modules/appearance/Appearance.ts';
import { equipArmor } from '../modules/appearance/EquipmentAppearance.ts';
import { residentPreferences } from '../modules/ai/brain/ResidentPreferences.ts';
import { ECSWorld } from '../ecs/World.ts';
import { WorldTile } from '../modules/world/WorldMap.ts';
import { QiTile } from '../modules/energy/QiGrid.ts';
import { TERRAIN_CONFIGS } from '../config/terrains.config.ts';
import { getElevationBand, ELEVATION_BAND_NAMES } from '../modules/world/ElevationRules.ts';
import { RACE_DEFINITIONS } from '../config/races.config.ts';
import { ELEMENT_CONFIGS } from '../config/elements.config.ts';
import { PLANT_DEFINITIONS } from '../config/plants.config.ts';
import { TRAIT_DEFINITIONS, TIER_NAMES, DIMENSION_NAMES } from '../config/traits.config.ts';
import { POTENTIAL_GRADE_CONFIG, POTENTIAL_WEIGHTS, TRAIT_TIER_CONFIG } from '../config/talent.config.ts';
import { OwnedTrait, TraitOrigin } from '../config/traits/trait.types.ts';
import { getTraitDefinition } from '../modules/traits/TraitCatalog.ts';
import {
  getEntityPotential,
} from '../modules/traits/DerivedStatsService.ts';
import {
  calculatePotentialFromScores,
  scoreFromXp,
} from '../modules/talent/PotentialCalculator.ts';
import {
  GrowthMindComponent,
  TalentProfileComponent,
  StatBaselineComponent,
} from '../modules/talent/TalentComponents.ts';
import {
  NameComponent,
  RaceComponent,
  RealmComponent,
  HealthComponent,
  LifespanComponent,
  HungerComponent,
  CultivationTechniqueComponent,
  CharacterStateComponent,
  TraitsComponent,
  ComprehensionComponent,
  CharacterHistoryComponent,
  PositionComponent,
  SpiritualRootComponent,
  MortalNeedsComponent,
  DailyScheduleComponent,
  ChildcareComponent,
  CorpseComponent,
  GraveComponent,
  DroppedLootComponent
} from '../modules/beings/BeingComponents.ts';
import { PlantComponent } from '../modules/flora/PlantComponents.ts';
import { EquipmentComponent, CombatStatsComponent } from '../modules/combat/CombatComponents.ts';
import { InventoryComponent } from '../modules/alchemy/InventoryComponent.ts';
import { PillUsageService } from '../modules/alchemy/PillUsageService.ts';
import {
  BuildingComponent,
  ConstructionSiteComponent,
  FactionComponent,
  FoundingIntentComponent,
  MemberComponent,
  ResidenceComponent,
  SettlementComponent
} from '../modules/factions/FactionComponents.ts';
import {
  BUILDING_DEFINITIONS,
  FACTION_PROGRESSION_CONFIG,
  isCivilFactionType
} from '../config/factions.config.ts';
import { FactionFactory } from '../modules/factions/FactionFactory.ts';
import { getBreakthroughOutlook } from '../modules/cultivation/BreakthroughRules.ts';
import {
  AIStrategicBrainComponent,
  AIPlannerComponent,
  AIBehaviorTreeComponent
} from '../modules/ai/brain/AIComponents.ts';
import { SocialRelationshipComponent, MemoryComponent } from '../modules/social/SocialComponents.ts';
import { EventBus } from '../core/EventBus.ts';
import { ActivityFeedback, ActivityFeedbackEvent } from '../renderer/systems/ActivityFeedback.ts';
import {
  TECHNIQUE_DEFINITIONS,
  MASTERY_CONFIGS,
  TechniqueMasteryLevel
} from '../config/techniques.config.ts';
import {
  AnimalCarcassComponent,
  AnimalComponent,
} from '../modules/animals/AnimalComponents.ts';
import { AnimalInspector } from './AnimalInspector.ts';
import { TreasureChestComponent, openTreasureChest } from '../modules/treasure/TreasureChest.ts';
import { PILL_DEFINITIONS } from '../config/pills.config.ts';
import { renderProfessionPanel, renderProfessionStock } from './ProfessionPanel.ts';

export function escapeHtml(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function gearIcon(path?: string): string {
  if (!path) return '';
  return `<img src="${escapeHtml(path)}" alt="" width="20" height="20" style="object-fit: contain; image-rendering: pixelated; vertical-align: middle; margin-right: 4px;">`;
}

export function getTraitOriginLabel(origin?: TraitOrigin): string {
  switch (origin) {
    case 'innate':
      return 'Bẩm sinh';
    case 'acquired':
      return 'Hậu thiên';
    case 'lineage':
      return 'Huyết mạch';
    case 'reincarnation':
      return 'Chuyển thế';
    default:
      return 'Bẩm sinh';
  }
}

export function getMentalStateDisplay(mentalState: number): {
  label: string;
  color: string;
  rounded: number;
  formatted: string;
} {
  const clamped = Number.isFinite(mentalState)
    ? Math.max(-100, Math.min(100, mentalState))
    : 0;
  const rounded = Math.round(clamped);
  let label = 'Bình hòa ổn định';
  let color = '#c9d1d9';

  if (rounded >= 50) {
    label = 'Đạo tâm thông suốt';
    color = '#4ade80';
  } else if (rounded >= 15) {
    label = 'Thư thái an nhiên';
    color = '#69db7c';
  } else if (rounded >= -14) {
    label = 'Bình hòa ổn định';
    color = '#c9d1d9';
  } else if (rounded >= -39) {
    label = 'Đang lo âu';
    color = '#fcc419';
  } else if (rounded >= -69) {
    label = 'Bất an u uất';
    color = '#ff922b';
  } else {
    label = 'Tâm thần suy sụp';
    color = '#ff6b6b';
  }

  const signStr = rounded >= 0 ? `+${rounded}` : `−${Math.abs(rounded)}`;
  return {
    label,
    color,
    rounded,
    formatted: `${label} (${signStr})`,
  };
}

export function renderTraitBadgeHtml(id: string, entry?: OwnedTrait): string {
  const safeId = escapeHtml(id);
  const def = getTraitDefinition(id) ?? TRAIT_DEFINITIONS[id];
  if (!def) {
    return `<span class="trait-badge-btn" data-trait="${safeId}" title="Đặc điểm từ bản lưu cũ (${safeId})" style="background: #30363d; border: 1px dashed #6e7681; color: #c9d1d9; padding: 2px 6px; border-radius: 4px; font-size: 10px; cursor: pointer;">🕰️ ${safeId} <span style="color:#8b949e;">(Di sản)</span></span>`;
  }

  const tierCfg = TRAIT_TIER_CONFIG[def.tier] ?? TIER_NAMES[def.tier] ?? {
    name: 'Phàm Phẩm',
    color: '#868e96',
    badge: '⚪',
  };
  const originLabel = getTraitOriginLabel(entry?.origin ?? def.origin);
  const isDormant = entry ? entry.state === 'dormant' || Boolean(entry.dormantReason) : false;
  const isLegacy = Boolean(entry?.state === 'legacy' || entry?.legacyGrandfathered || def.implementation === 'legacyOnly');
  const stateLabel = isLegacy
    ? 'Di sản'
    : isDormant
      ? 'Tiềm ẩn'
      : def.implementation === 'planned'
        ? 'Kế hoạch'
        : 'Kích hoạt';

  const supportedNotes: string[] = [];
  if (def.innateDelta) {
    if (def.innateDelta.comprehension) supportedNotes.push(`Ngộ tính ${def.innateDelta.comprehension > 0 ? '+' : ''}${def.innateDelta.comprehension}`);
    if (def.innateDelta.aptitude) supportedNotes.push(`Tư chất ${def.innateDelta.aptitude > 0 ? '+' : ''}${def.innateDelta.aptitude}`);
    if (def.innateDelta.physique) supportedNotes.push(`Thể chất ${def.innateDelta.physique > 0 ? '+' : ''}${def.innateDelta.physique}`);
  }
  if (def.statModifiers) {
    if (def.statModifiers.qiAbsorptionMultiplier && def.statModifiers.qiAbsorptionMultiplier !== 1) {
      supportedNotes.push(`Tụ khí x${def.statModifiers.qiAbsorptionMultiplier}`);
    }
    if (def.statModifiers.healthMultiplier && def.statModifiers.healthMultiplier !== 1) {
      supportedNotes.push(`HP x${def.statModifiers.healthMultiplier}`);
    }
    if (def.statModifiers.combatPowerMultiplier && def.statModifiers.combatPowerMultiplier !== 1) {
      supportedNotes.push(`Công x${def.statModifiers.combatPowerMultiplier}`);
    }
    if (def.statModifiers.breakthroughChanceBonus) {
      supportedNotes.push(`Đột phá ${def.statModifiers.breakthroughChanceBonus > 0 ? '+' : ''}${Math.round(def.statModifiers.breakthroughChanceBonus * 100)}%`);
    }
    if (def.statModifiers.lifespanBonus) {
      supportedNotes.push(`Thọ nguyên ${def.statModifiers.lifespanBonus > 0 ? '+' : ''}${def.statModifiers.lifespanBonus} năm`);
    }
  }

  const tooltipSummary = supportedNotes.length > 0
    ? `${def.description} | Đã hỗ trợ: ${supportedNotes.join(', ')}`
    : def.description;
  const safeTitle = escapeHtml(`${tooltipSummary} [${tierCfg.name} • ${originLabel} • ${stateLabel}]`);
  const opacityStyle = isDormant ? 'opacity: 0.58; border-style: dashed;' : '';

  return `<span class="trait-badge-btn" data-trait="${safeId}" data-tier="${def.tier}" data-origin="${escapeHtml(entry?.origin ?? def.origin)}" data-state="${isDormant ? 'dormant' : 'active'}" title="${safeTitle}" style="background: ${def.color}22; border: 1px solid ${def.color}; color: ${def.color}; ${opacityStyle} padding: 3px 7px; border-radius: 4px; font-size: 11px; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; transition: transform 0.1s;"><span style="font-size: 9px;">${tierCfg.badge} B${def.tier}</span> ${def.badge} <b>${escapeHtml(def.name)}</b> <span style="font-size: 9px; color: #8b949e;">(${originLabel}${isDormant ? ' • Tiềm ẩn' : ''})</span></span>`;
}

export function renderPotentialSummaryHtml(world: ECSWorld, entityId: number): string {
  const profile = world.getComponent(entityId, TalentProfileComponent);
  const growth = world.getComponent(entityId, GrowthMindComponent);
  const rootComp = world.getComponent(entityId, SpiritualRootComponent);
  const pot =
    getEntityPotential(world, entityId) ??
    calculatePotentialFromScores(
      {
        comprehension: 50,
        aptitude: 50,
        physique: 50,
        willpower: scoreFromXp(growth?.willpowerXp ?? 0),
        mindset: scoreFromXp(growth?.mindsetXp ?? 0),
      },
      false
    );

  const isRootRevealed = Boolean(
    pot.assessmentComplete && (!rootComp || rootComp.isAwakened)
  );
  const gradeInfo = POTENTIAL_GRADE_CONFIG[pot.grade] ?? POTENTIAL_GRADE_CONFIG.ordinary;
  const isLegacyEstimated = profile?.knowledge === 'estimatedLegacy';

  const cScore = pot.scores.comprehension;
  const aScore = pot.scores.aptitude;
  const bScore = pot.scores.physique;
  const wScore = pot.scores.willpower;
  const mScore = pot.scores.mindset;

  const cContrib = POTENTIAL_WEIGHTS.comprehension * cScore;
  const aContrib = POTENTIAL_WEIGHTS.aptitude * aScore;
  const bContrib = POTENTIAL_WEIGHTS.physique * bScore;
  const wContrib = POTENTIAL_WEIGHTS.willpower * wScore;
  const mContrib = POTENTIAL_WEIGHTS.mindset * mScore;

  const wXp = Math.round(growth?.willpowerXp ?? 0);
  const mXp = Math.round(growth?.mindsetXp ?? 0);
  const mentalDisplay = getMentalStateDisplay(growth?.mentalState ?? 0);

  const recentGain =
    growth && growth.recentGains.length > 0
      ? growth.recentGains[growth.recentGains.length - 1]
      : null;

  const formatNum = (val: number) => val.toFixed(1);

  return `
    <div data-potential-block style="background: #161b22; border: 1px solid #30363d; border-radius: 8px; padding: 8px 10px; display: flex; flex-direction: column; gap: 6px;">
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #21262d; padding-bottom: 4px;">
        <span style="font-size: 11px; color: #8b949e; font-weight: bold;">Tiềm năng:</span>
        ${isRootRevealed ? `
          <span data-potential-total="${formatNum(pot.displayTotal)}" style="font-size: 12px; font-weight: bold; color: ${gradeInfo.color};">
            ${formatNum(pot.displayTotal)} / 100 — ${escapeHtml(gradeInfo.label)}
          </span>
        ` : `
          <span data-potential-total="unassessed" style="font-size: 11px; font-weight: bold; color: #94a3b8; font-style: italic;">
            Chưa đánh giá đầy đủ
          </span>
        `}
      </div>

      ${isLegacyEstimated ? `
        <div style="font-size: 10px; color: #fbbf24; background: rgba(251, 191, 36, 0.1); border: 1px solid rgba(251, 191, 36, 0.25); border-radius: 4px; padding: 2px 6px;">
          ℹ️ Ước tính từ dữ liệu cũ
        </div>
      ` : ''}

      <div style="display: flex; flex-direction: column; gap: 4px; font-size: 11px;">
        <div style="display: flex; justify-content: space-between;" title="Điểm Ngộ tính chuẩn 0–100 (Trọng số 30%)">
          <span style="color: #e599f7;">🧠 Ngộ tính: <b>${formatNum(cScore)}</b></span>
          <span style="color: #8b949e;">đóng góp <b style="color: #c9d1d9;">${formatNum(cContrib)} / 30</b></span>
        </div>
        <div style="display: flex; justify-content: space-between;" title="${isRootRevealed ? 'Điểm Tư chất linh căn chuẩn 0–100 (Trọng số 15%)' : 'Căn cơ linh căn chưa thức tỉnh (Trọng số 15%)'}">
          <span style="color: #69db7c;">🌱 Tư chất: <b>${isRootRevealed ? formatNum(aScore) : 'Chưa thức tỉnh'}</b></span>
          <span style="color: #8b949e;">đóng góp <b style="color: #c9d1d9;">${isRootRevealed ? `${formatNum(aContrib)} / 15` : '— / 15'}</b></span>
        </div>
        <div style="display: flex; justify-content: space-between;" title="Điểm Thể chất căn cốt chuẩn 0–100 (Trọng số 10%)">
          <span style="color: #ff8787;">💪 Thể chất: <b>${formatNum(bScore)}</b></span>
          <span style="color: #8b949e;">đóng góp <b style="color: #c9d1d9;">${formatNum(bContrib)} / 10</b></span>
        </div>
        <div style="display: flex; justify-content: space-between;" title="XP Ý chí tích lũy: ${wXp} / 6000 XP → Điểm Ý chí: ${formatNum(wScore)} / 100 (Trọng số 25%)">
          <span style="color: #fcc419;">🔥 Ý chí: <b>${formatNum(wScore)}</b> <span style="font-size: 9px; color: #8b949e;">(${wXp} XP)</span></span>
          <span style="color: #8b949e;">đóng góp <b style="color: #c9d1d9;">${formatNum(wContrib)} / 25</b></span>
        </div>
        <div style="display: flex; justify-content: space-between;" title="XP Tâm cảnh tích lũy: ${mXp} / 6000 XP → Điểm Tâm cảnh: ${formatNum(mScore)} / 100 (Trọng số 20%)">
          <span style="color: #38bdf8;">🌊 Tâm cảnh: <b>${formatNum(mScore)}</b> <span style="font-size: 9px; color: #8b949e;">(${mXp} XP)</span></span>
          <span style="color: #8b949e;">đóng góp <b style="color: #c9d1d9;">${formatNum(mContrib)} / 20</b></span>
        </div>
      </div>

      <div style="display: flex; justify-content: space-between; font-size: 10px; color: #8b949e; border-top: 1px dashed #21262d; padding-top: 4px;">
        <span>Bẩm sinh: <b style="color: #c9d1d9;">${isRootRevealed ? formatNum(pot.innateContribution) : '—'} / 55</b></span>
        <span>Trưởng thành: <b style="color: #c9d1d9;">${formatNum(pot.growthContribution)} / 45</b></span>
      </div>

      <div style="border-top: 1px solid #21262d; padding-top: 4px; display: flex; flex-direction: column; gap: 3px; font-size: 11px;">
        <div style="display: flex; justify-content: space-between;" title="Cảm xúc động (-100..100), tách biệt với điểm Tâm cảnh dài hạn">
          <span style="color: #8b949e;">Trạng thái tinh thần:</span>
          <b data-mental-state="${mentalDisplay.rounded}" style="color: ${mentalDisplay.color};">${escapeHtml(mentalDisplay.formatted)}</b>
        </div>
        <div style="font-size: 10px; color: #94a3b8; line-height: 1.35;">
          ${recentGain ? `
            Gần đây: <b style="color: #fcc419;">+${recentGain.willXp} XP ý chí</b>, <b style="color: #38bdf8;">+${recentGain.mindXp} XP tâm cảnh</b> — ${escapeHtml(recentGain.reason)}
          ` : `
            Gần đây: <span style="color: #6e7681; font-style: italic;">Chưa có biến động XP rèn luyện mới</span>
          `}
        </div>
      </div>
    </div>
  `;
}

export class InspectorPanel {
  private container: HTMLDivElement;
  private traitModal: HTMLDivElement;
  private world: ECSWorld;
  private activeEntityTab: 'stats' | 'equip' | 'ai' | 'relation' | 'faction' | 'history' = 'stats';
  public currentInspectedEntityId: number | null = null;
  private recentActivityTimer: number | null = null;
  private inspectedTile: { tile: WorldTile; qiTile?: QiTile | null } | null = null;

  constructor(parent: HTMLElement, world: ECSWorld) {
    this.world = world;
    this.container = document.createElement('div');
    this.container.id = 'hud-inspector';
    this.container.className = 'interactive-ui hud-panel';
    this.container.style.cssText = `
      position: absolute;
      top: 12px;
      left: 12px;
      width: min(350px, calc(100vw - 24px));
      max-height: calc(100vh - 120px);
      padding: 12px 16px;
      display: none;
      flex-direction: column;
      gap: 10px;
      z-index: 100;
      color: #c9d1d9;
      font-size: 13px;
      overflow-y: auto;
    `;
    parent.appendChild(this.container);
    EventBus.getInstance().on<ActivityFeedbackEvent>('activity:feedback', event => {
      if (event.entityId === this.currentInspectedEntityId) {
        this.updateRecentActivity(event.text);
        if (this.recentActivityTimer !== null) window.clearTimeout(this.recentActivityTimer);
        this.recentActivityTimer = window.setTimeout(() => {
          this.recentActivityTimer = null;
          if (event.entityId === this.currentInspectedEntityId) {
            this.updateRecentActivity(ActivityFeedback.getInstance().getRecent(event.entityId));
          }
        }, 5000);
      }
    });

    // Modal chi tiết đặc điểm bẩm sinh / công pháp (Trait Popup)
    this.traitModal = document.createElement('div');
    this.traitModal.className = 'interactive-ui';
    this.traitModal.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 330px;
      background: rgba(15, 20, 30, 0.98);
      backdrop-filter: blur(16px);
      border: 1px solid #58a6ff;
      border-radius: 12px;
      padding: 16px 20px;
      box-shadow: 0 16px 45px rgba(0, 0, 0, 0.85);
      display: none;
      flex-direction: column;
      gap: 10px;
      z-index: 200;
      color: #c9d1d9;
      font-size: 13px;
    `;
    parent.appendChild(this.traitModal);
  }

  public showTraitModal(traitId: string): void {
    const def = getTraitDefinition(traitId) ?? TRAIT_DEFINITIONS[traitId];
    if (!def) {
      const safeId = escapeHtml(traitId);
      this.traitModal.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #30363d; padding-bottom: 8px;">
          <h4 style="margin: 0; color: #c9d1d9; font-size: 14px;">🕰️ ${safeId}</h4>
          <button id="close-trait-modal-btn" style="background: transparent; border: none; color: #8b949e; cursor: pointer; font-size: 16px;">✕</button>
        </div>
        <div style="font-size: 12px; color: #94a3b8;">Đặc điểm từ bản lưu cũ (ID được bảo toàn nguyên vẹn).</div>
        <button id="ok-trait-modal-btn" style="background: #238636; border: none; color: #fff; border-radius: 6px; padding: 6px; cursor: pointer; font-size: 12px; font-weight: bold;">Đã Hiểu</button>
      `;
      this.traitModal.style.display = 'flex';
      document.getElementById('close-trait-modal-btn')?.addEventListener('click', () => {
        this.traitModal.style.display = 'none';
      });
      document.getElementById('ok-trait-modal-btn')?.addEventListener('click', () => {
        this.traitModal.style.display = 'none';
      });
      return;
    }

    const tierInfo = TRAIT_TIER_CONFIG[def.tier] || TIER_NAMES[def.tier] || { name: 'Phàm Phẩm', color: '#868e96', badge: '⚪' };
    const dimInfo = DIMENSION_NAMES[def.dimension] || { name: 'Căn Cốt Thể Chất', icon: '🛡️' };
    const originName = getTraitOriginLabel(def.origin);
    const implBadge = def.implementation === 'legacyOnly'
      ? 'Di sản bản lưu cũ'
      : def.implementation === 'planned'
        ? 'Cơ chế mở rộng (Planned)'
        : 'Đang hỗ trợ (Active)';

    const items: string[] = [];
    if (def.innateDelta) {
      if (def.innateDelta.comprehension) items.push(`🧠 Điểm Ngộ tính bẩm sinh: <b>${def.innateDelta.comprehension > 0 ? '+' : ''}${def.innateDelta.comprehension}</b>`);
      if (def.innateDelta.aptitude) items.push(`🌱 Điểm Tư chất bẩm sinh: <b>${def.innateDelta.aptitude > 0 ? '+' : ''}${def.innateDelta.aptitude}</b>`);
      if (def.innateDelta.physique) items.push(`💪 Điểm Thể chất bẩm sinh: <b>${def.innateDelta.physique > 0 ? '+' : ''}${def.innateDelta.physique}</b>`);
    }
    const willTrainMod = def.modifiers?.find(m => m.key === 'willTrainingBonus');
    if (willTrainMod) {
      items.push(`🔥 Tốc độ rèn Ý chí: <b>${willTrainMod.value >= 0 ? '+' : ''}${Math.round(willTrainMod.value * 100)}%</b>`);
    }
    const mindTrainMod = def.modifiers?.find(m => m.key === 'mindTrainingBonus');
    if (mindTrainMod) {
      items.push(`🌊 Tốc độ rèn Tâm cảnh: <b>${mindTrainMod.value >= 0 ? '+' : ''}${Math.round(mindTrainMod.value * 100)}%</b>`);
    }

    const mods = def.statModifiers;
    if (mods) {
      if (mods.qiAbsorptionMultiplier) items.push(`⚡ Hấp thu linh khí: <b>${mods.qiAbsorptionMultiplier >= 1 ? '+' : ''}${Math.round((mods.qiAbsorptionMultiplier - 1) * 100)}%</b>`);
      if (mods.breakthroughChanceBonus) items.push(`✨ Tỷ lệ đột phá: <b>${mods.breakthroughChanceBonus >= 0 ? '+' : ''}${Math.round(mods.breakthroughChanceBonus * 100)}%</b>`);
      if (mods.comprehensionMultiplier) items.push(`📖 Tốc độ lĩnh ngộ công pháp: <b>${mods.comprehensionMultiplier >= 1 ? '+' : ''}${Math.round((mods.comprehensionMultiplier - 1) * 100)}%</b>`);
      if (mods.healthMultiplier) items.push(`❤️ Sinh mệnh tối đa: <b>x${mods.healthMultiplier}</b>`);
      if (mods.combatPowerMultiplier) items.push(`⚔️ Lực chiến công kích: <b>x${mods.combatPowerMultiplier}</b>`);
      if (mods.defenseBonus) items.push(`🛡️ Phòng ngự: <b>${mods.defenseBonus >= 0 ? '+' : ''}${mods.defenseBonus} điểm</b>`);
      if (mods.armorBonus) items.push(`🥋 Giáp hộ thể: <b>${mods.armorBonus >= 0 ? '+' : ''}${mods.armorBonus} điểm</b>`);
      if (mods.critRateBonus) items.push(`⚡ Tỷ lệ bạo kích: <b>${mods.critRateBonus >= 0 ? '+' : ''}${Math.round(mods.critRateBonus * 100)}%</b>`);
      if (mods.dodgeRateBonus) items.push(`💨 Tỷ lệ né đòn: <b>${mods.dodgeRateBonus >= 0 ? '+' : ''}${Math.round(mods.dodgeRateBonus * 100)}%</b>`);
      if (mods.moveSpeedMultiplier) items.push(`🏃 Tốc độ di chuyển: <b>${mods.moveSpeedMultiplier >= 1 ? '+' : ''}${Math.round((mods.moveSpeedMultiplier - 1) * 100)}%</b>`);
      if (mods.attackSpeedMultiplier) items.push(`🗡️ Tốc độ tấn công: <b>${mods.attackSpeedMultiplier >= 1 ? '+' : ''}${Math.round((mods.attackSpeedMultiplier - 1) * 100)}%</b>`);
      if (mods.lifespanBonus) items.push(`⏳ Thọ nguyên: <b>${mods.lifespanBonus >= 0 ? '+' : ''}${mods.lifespanBonus} năm</b>`);
      if (mods.craftingSpeedMultiplier) items.push(`🔨 Tốc độ lao động/chế tác: <b>${mods.craftingSpeedMultiplier >= 1 ? '+' : ''}${Math.round((mods.craftingSpeedMultiplier - 1) * 100)}%</b>`);
      if (mods.hungerRateMultiplier) items.push(`🍖 Tiêu hao đói: <b>${mods.hungerRateMultiplier <= 1 ? '-' : '+'}${Math.abs(Math.round((mods.hungerRateMultiplier - 1) * 100))}%</b>`);
      if (mods.thirstRateMultiplier) items.push(`💧 Tiêu hao nước: <b>${mods.thirstRateMultiplier <= 1 ? '-' : '+'}${Math.abs(Math.round((mods.thirstRateMultiplier - 1) * 100))}%</b>`);
    }

    let modsHtml = '';
    if (items.length > 0) {
      modsHtml = `
        <div style="background: rgba(255, 255, 255, 0.05); border-radius: 6px; padding: 8px 10px; font-size: 11px; display: flex; flex-direction: column; gap: 4px;">
          <span style="color: #79c0ff; font-weight: bold; font-size: 11px;">Hiệu Quả Đã Hỗ Trợ (${escapeHtml(implBadge)}):</span>
          ${items.map(it => `<div>${it}</div>`).join('')}
        </div>
      `;
    }

    let conflictsHtml = '';
    if (def.conflicts && def.conflicts.length > 0) {
      const conflictNames = def.conflicts.map(cId => escapeHtml(getTraitDefinition(cId)?.name || TRAIT_DEFINITIONS[cId]?.name || cId)).join(', ');
      conflictsHtml = `
        <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 6px; padding: 6px 10px; font-size: 10px; color: #fca5a5;">
          ⚠️ <b>Tương khắc / Loại trừ:</b> ${conflictNames}
        </div>
      `;
    }

    this.traitModal.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #30363d; padding-bottom: 8px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 24px;">${def.badge}</span>
          <div>
            <div style="display: flex; align-items: center; gap: 6px;">
              <h4 style="margin: 0; color: ${def.color}; font-size: 15px;">${escapeHtml(def.name)}</h4>
              <span style="background: ${tierInfo.color}22; border: 1px solid ${tierInfo.color}; color: ${tierInfo.color}; padding: 1px 5px; border-radius: 4px; font-size: 10px; font-weight: bold;">${tierInfo.badge} ${escapeHtml(tierInfo.name)} (Bậc ${def.tier})</span>
            </div>
            <div style="font-size: 10px; color: #8b949e; margin-top: 2px;">
              <span>${dimInfo.icon} ${escapeHtml(dimInfo.name)}</span> • <span>Nguồn: ${escapeHtml(originName)}</span>
            </div>
          </div>
        </div>
        <button id="close-trait-modal-btn" style="background: transparent; border: none; color: #8b949e; cursor: pointer; font-size: 16px;">✕</button>
      </div>

      <div style="font-size: 12px; line-height: 1.45; color: #e6edf3;">
        ${escapeHtml(def.description)}
      </div>

      ${conflictsHtml}
      ${modsHtml}

      <button id="ok-trait-modal-btn" style="background: #238636; border: none; color: #fff; border-radius: 6px; padding: 6px; cursor: pointer; font-size: 12px; font-weight: bold; margin-top: 4px;">Đã Hiểu</button>
    `;

    this.traitModal.style.display = 'flex';
    document.getElementById('close-trait-modal-btn')?.addEventListener('click', () => {
      this.traitModal.style.display = 'none';
    });
    document.getElementById('ok-trait-modal-btn')?.addEventListener('click', () => {
      this.traitModal.style.display = 'none';
    });
  }

  public showTechniqueModal(techComp: CultivationTechniqueComponent): void {
    const def = TECHNIQUE_DEFINITIONS[techComp.techniqueId];
    const tierInfo = techComp.getTierInfo();
    const sourceInfo = techComp.getSourceInfo();
    const masteryBadge = techComp.getMasteryBadge();
    const masteryTitle = techComp.getMasteryTitle();
    const masteryMult = techComp.getMasteryMultiplier();
    const expPercent = Math.min(100, Math.round((techComp.masteryExp / techComp.masteryMaxExp) * 100));

    let modsHtml = '';
    if (def?.baseModifiers) {
      const items: string[] = [];
      const qiAbsorb = (def.baseModifiers.qiAbsorptionMultiplier * masteryMult).toFixed(2);
      items.push(`🌀 Tốc độ hấp thu linh khí: <b>x${qiAbsorb}</b> <span style="font-size: 10px; color: #8b949e;">(Gốc: x${def.baseModifiers.qiAbsorptionMultiplier} • Cấp: x${masteryMult.toFixed(1)})</span>`);
      if (def.baseModifiers.breakthroughBonus) items.push(`⚡ Tỷ lệ đột phá: <b>+${Math.round(def.baseModifiers.breakthroughBonus * (masteryMult >= 2.0 ? 1.5 : 1.0) * 100)}%</b>`);
      if (def.baseModifiers.combatPowerMultiplier) items.push(`⚔️ Lực chiến công kích: <b>x${(def.baseModifiers.combatPowerMultiplier * (1 + (masteryMult - 1) * 0.25)).toFixed(2)}</b>`);
      if (def.baseModifiers.defenseBonus) items.push(`🛡️ Phòng thủ: <b>+${def.baseModifiers.defenseBonus}</b>`);
      if (def.baseModifiers.armorBonus) items.push(`🥋 Giáp hộ thể: <b>+${def.baseModifiers.armorBonus}</b>`);
      if (def.baseModifiers.critRateBonus) items.push(`🎯 Tỷ lệ bạo kích: <b>+${Math.round(def.baseModifiers.critRateBonus * 100)}%</b>`);
      if (def.baseModifiers.dodgeRateBonus) items.push(`💨 Tỷ lệ né đòn: <b>+${Math.round(def.baseModifiers.dodgeRateBonus * 100)}%</b>`);
      if (def.baseModifiers.lifespanBonus) items.push(`⏳ Thọ nguyên gia tăng: <b>+${def.baseModifiers.lifespanBonus} năm</b>`);

      modsHtml = `
        <div style="background: #161b22; border: 1px solid #30363d; border-radius: 6px; padding: 8px 10px; display: flex; flex-direction: column; gap: 4px;">
          <b style="color: #79c0ff; font-size: 11px;">Hiệu Quả Gia Trì Pháp Môn:</b>
          <div style="display: flex; flex-direction: column; gap: 3px; font-size: 11px; color: #c9d1d9;">
            ${items.map(it => `<div>• ${it}</div>`).join('')}
          </div>
        </div>
      `;
    }

    const levels: TechniqueMasteryLevel[] = ['nhap_mon', 'so_khuynh', 'tieu_thanh', 'dai_thanh'];
    const levelRows = levels.map(lvl => {
      const cfg = MASTERY_CONFIGS[lvl];
      const isCurrent = techComp.masteryLevel === lvl;
      const isUnlocked = techComp.masteryExp >= cfg.minExp;
      return `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 4px 8px; border-radius: 4px; background: ${isCurrent ? 'rgba(56, 189, 248, 0.15)' : (isUnlocked ? 'rgba(255,255,255,0.03)' : 'transparent')}; border: 1px solid ${isCurrent ? '#38bdf8' : 'transparent'}; font-size: 11px;">
          <div style="display: flex; align-items: center; gap: 6px;">
            <span>${cfg.badge}</span>
            <b style="color: ${cfg.color};">${cfg.name}</b>
            ${isCurrent ? '<span style="background: #38bdf8; color: #000; font-size: 9px; font-weight: bold; padding: 0 4px; border-radius: 3px;">HIỆN TẠI</span>' : ''}
          </div>
          <div style="font-size: 10px; color: #8b949e;">
            <span>Yêu cầu: <b>${cfg.minExp} EXP</b></span> • <span style="color: #facc15;">Gia trì x${cfg.multiplier.toFixed(1)}</span>
          </div>
        </div>
      `;
    }).join('');

    this.traitModal.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #30363d; padding-bottom: 8px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 24px;">${def?.badge || '📜'}</span>
          <div>
            <div style="display: flex; align-items: center; gap: 6px;">
              <h4 style="margin: 0; color: ${tierInfo.color}; font-size: 15px;">${techComp.techniqueName}</h4>
              <span style="background: ${tierInfo.color}22; border: 1px solid ${tierInfo.color}; color: ${tierInfo.color}; padding: 1px 5px; border-radius: 4px; font-size: 10px; font-weight: bold;">${tierInfo.badge} ${tierInfo.name}</span>
            </div>
            <div style="font-size: 10px; color: #8b949e; margin-top: 2px;">
              <span>${sourceInfo.icon} ${techComp.sourceName || sourceInfo.name}</span> • <span>Hệ: <b>${def?.element?.toUpperCase() || 'VÔ'}</b></span>
            </div>
          </div>
        </div>
        <button id="close-trait-modal-btn" style="background: transparent; border: none; color: #8b949e; cursor: pointer; font-size: 16px;">✕</button>
      </div>

      <div style="font-size: 12px; line-height: 1.45; color: #e6edf3;">
        ${techComp.description || def?.description || 'Bí tịch tu tiên khẩu truyền tâm thụ.'}
      </div>

      <!-- THANH ĐỘ THÔNG THẠO -->
      <div style="background: #0d1117; border: 1px solid #30363d; border-radius: 6px; padding: 8px 10px; display: flex; flex-direction: column; gap: 4px;">
        <div style="display: flex; justify-content: space-between; font-size: 11px;">
          <span>Cảnh Giới Lĩnh Ngộ: <b style="color: ${MASTERY_CONFIGS[techComp.masteryLevel].color};">${masteryBadge} ${masteryTitle}</b></span>
          <span style="color: #58a6ff; font-weight: bold;">${Math.round(techComp.masteryExp)} / ${techComp.masteryMaxExp} EXP</span>
        </div>
        <div style="width: 100%; height: 6px; background: #21262d; border-radius: 3px; overflow: hidden;">
          <div style="width: ${expPercent}%; height: 100%; background: ${MASTERY_CONFIGS[techComp.masteryLevel].color};"></div>
        </div>
        <div style="font-size: 10px; color: #8b949e; margin-top: 2px;">
          💡 <i>Luyện tập thiền định, thực chiến và đột phá cảnh giới sẽ tích lũy kinh nghiệm thông thạo công pháp!</i>
        </div>
      </div>

      ${modsHtml}

      <!-- 4 CẤP ĐỘ THÔNG THẠO -->
      <div style="display: flex; flex-direction: column; gap: 4px;">
        <span style="font-size: 11px; color: #8b949e; font-weight: bold;">4 Cấp Bậc Thông Thạo:</span>
        <div style="display: flex; flex-direction: column; gap: 3px;">
          ${levelRows}
        </div>
      </div>

      <button id="ok-trait-modal-btn" style="background: #238636; border: none; color: #fff; border-radius: 6px; padding: 6px; cursor: pointer; font-size: 12px; font-weight: bold; margin-top: 4px;">Đã Hiểu</button>
    `;

    this.traitModal.style.display = 'flex';
    document.getElementById('close-trait-modal-btn')?.addEventListener('click', () => {
      this.traitModal.style.display = 'none';
    });
    document.getElementById('ok-trait-modal-btn')?.addEventListener('click', () => {
      this.traitModal.style.display = 'none';
    });
  }

  private showGrave(_entityId: number, grave: GraveComponent): void {
    const percentRemaining = Math.max(0, Math.min(100, Math.round((grave.remainingDays / grave.totalDays) * 100)));
    const monthsRemaining = (grave.remainingDays / 30).toFixed(1);
    const totalMonths = Math.round(grave.totalDays / 30);

    let goodsHtml = '';
    const goods = grave.burialGoods;
    const itemsList: string[] = [];
    if (goods.pills && goods.pills.length > 0) {
      goods.pills.forEach(p => itemsList.push(`💊 ${escapeHtml(p.name)} x${p.count}`));
    }
    if (goods.mainHand) itemsList.push(`⚔️ ${escapeHtml(goods.mainHand.name)}`);
    if (goods.offHand) itemsList.push(`🗡️ ${escapeHtml(goods.offHand.name)}`);
    if (goods.bodyArmor) itemsList.push(`🥋 ${escapeHtml(goods.bodyArmor.name)}`);
    if (goods.artifact) itemsList.push(`🪞 ${escapeHtml(goods.artifact.name)}`);

    if (itemsList.length > 0) {
      goodsHtml = `
        <div style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; padding: 10px; display: flex; flex-direction: column; gap: 6px;">
          <b style="color: #facc15; font-size: 11px;">🏺 Đồ Tùy Táng Trong Mộ (Phương án A):</b>
          <div style="display: flex; flex-wrap: wrap; gap: 6px;">
            ${itemsList.map(it => `<span style="background: rgba(250, 204, 21, 0.15); border: 1px solid rgba(250, 204, 21, 0.3); padding: 2px 6px; border-radius: 4px; font-size: 11px; color: #fde047;">${it}</span>`).join('')}
          </div>
          <div style="font-size: 10px; color: #94a3b8; margin-top: 2px;">
            <i>Di vật được người thân chôn cùng để an ủi linh hồn, sẽ phong hóa theo tuế nguyệt.</i>
          </div>
        </div>
      `;
    } else {
      goodsHtml = `
        <div style="font-size: 11px; color: #94a3b8; font-style: italic;">
          Không có đồ tùy táng trong mộ phần.
        </div>
      `;
    }

    this.container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #30363d; padding-bottom: 8px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 26px;">🪦</span>
          <div>
            <h3 style="margin: 0; color: #f8fafc; font-size: 16px;">Mộ Của ${escapeHtml(grave.deceasedName)}</h3>
            <div style="font-size: 11px; color: #cbd5e1; margin-top: 2px;">
              <span style="color: #ffd43b; font-weight: bold;">[${escapeHtml(grave.realmStageName)}]</span> • Chủng tộc: ${escapeHtml(grave.raceId)}
            </div>
          </div>
        </div>
        <button id="close-inspector-btn" style="background: transparent; border: none; color: #8b949e; cursor: pointer; font-size: 18px;">✕</button>
      </div>

      <div style="background: rgba(168, 85, 247, 0.1); border: 1px solid rgba(168, 85, 247, 0.3); border-radius: 8px; padding: 10px; display: flex; flex-direction: column; gap: 6px;">
        <div style="display: flex; justify-content: space-between; font-size: 11px;">
          <span style="color: #cbd5e1;">Người An Táng:</span>
          <b style="color: #c084fc;">${escapeHtml(grave.buriedByName)}</b>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 11px;">
          <span style="color: #cbd5e1;">Thời Gian An Táng:</span>
          <span>Ngày ${grave.burialDay}, Tháng ${grave.burialMonth}, Năm ${grave.burialYear}</span>
        </div>
      </div>

      <div style="background: #0d1117; border: 1px solid #30363d; border-radius: 8px; padding: 10px; display: flex; flex-direction: column; gap: 6px;">
        <div style="display: flex; justify-content: space-between; font-size: 11px;">
          <span style="color: #94a3b8;">Thời Hạn Tồn Tại Còn Lại:</span>
          <b style="color: #38bdf8;">${Math.round(grave.remainingDays)} ngày (${monthsRemaining} / ${totalMonths} tháng)</b>
        </div>
        <div style="width: 100%; height: 6px; background: #21262d; border-radius: 3px; overflow: hidden;">
          <div style="width: ${percentRemaining}%; height: 100%; background: linear-gradient(90deg, #38bdf8, #818cf8);"></div>
        </div>
        <div style="font-size: 10px; color: #8b949e;">
          ⏳ <i>Phàm nhân mộ duy trì 12 tháng, cứ tăng 1 cấp lớn thì thời gian duy trì mộ tăng thêm 4 lần.</i>
        </div>
      </div>

      ${goodsHtml}
    `;

    this.container.style.display = 'flex';
    document.getElementById('close-inspector-btn')?.addEventListener('click', () => this.hide());
  }

  private showDroppedLoot(_entityId: number, loot: DroppedLootComponent): void {
    const itemsList: string[] = [];
    if (loot.items.pills && loot.items.pills.length > 0) {
      loot.items.pills.forEach(p => itemsList.push(`💊 ${escapeHtml(p.name)} x${p.count}`));
    }
    if (loot.items.mainHand) itemsList.push(`⚔️ ${escapeHtml(loot.items.mainHand.name)}`);
    if (loot.items.offHand) itemsList.push(`🗡️ ${escapeHtml(loot.items.offHand.name)}`);
    if (loot.items.bodyArmor) itemsList.push(`🥋 ${escapeHtml(loot.items.bodyArmor.name)}`);
    if (loot.items.artifact) itemsList.push(`🪞 ${escapeHtml(loot.items.artifact.name)}`);

    this.container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #30363d; padding-bottom: 8px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 26px;">📦</span>
          <div>
            <h3 style="margin: 0; color: #fde047; font-size: 16px;">Túi Di Vật: ${escapeHtml(loot.ownerName)}</h3>
            <div style="font-size: 11px; color: #cbd5e1; margin-top: 2px;">
              <span style="color: #ffd43b;">[${escapeHtml(loot.realmStageName)}]</span> • Di vật lưu lại sau khi thi thể phân rã
            </div>
          </div>
        </div>
        <button id="close-inspector-btn" style="background: transparent; border: none; color: #8b949e; cursor: pointer; font-size: 18px;">✕</button>
      </div>

      <div style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; padding: 10px; display: flex; flex-direction: column; gap: 8px;">
        <b style="color: #79c0ff; font-size: 11px;">Vật Phẩm Rơi Ngoài Đất:</b>
        <div style="display: flex; flex-direction: column; gap: 6px;">
          ${itemsList.length > 0 ? itemsList.map(it => `
            <div style="background: rgba(255, 255, 255, 0.05); padding: 5px 8px; border-radius: 6px; font-size: 12px; color: #f8fafc;">
              ${it}
            </div>
          `).join('') : '<div style="color: #94a3b8; font-style: italic;">Không có vật phẩm.</div>'}
        </div>
        <div style="font-size: 10px; color: #94a3b8;">
          💡 <i>Các cư dân hoặc tu sĩ khác khi tuần tra đi ngang có thể nhặt lấy di vật này.</i>
        </div>
      </div>
    `;

    this.container.style.display = 'flex';
    document.getElementById('close-inspector-btn')?.addEventListener('click', () => this.hide());
  }

  private showCorpse(_entityId: number, corpse: CorpseComponent): void {
    const percentRemaining = Math.max(0, Math.min(100, Math.round((corpse.remainingDays / corpse.totalDays) * 100)));
    const monthsRemaining = (corpse.remainingDays / 30).toFixed(1);
    const totalMonths = Math.round(corpse.totalDays / 30);

    const itemsList: string[] = [];
    if (corpse.items.pills && corpse.items.pills.length > 0) {
      corpse.items.pills.forEach(p => itemsList.push(`💊 ${escapeHtml(p.name)} x${p.count}`));
    }
    if (corpse.items.mainHand) itemsList.push(`⚔️ ${escapeHtml(corpse.items.mainHand.name)}`);
    if (corpse.items.offHand) itemsList.push(`🗡️ ${escapeHtml(corpse.items.offHand.name)}`);
    if (corpse.items.bodyArmor) itemsList.push(`🥋 ${escapeHtml(corpse.items.bodyArmor.name)}`);
    if (corpse.items.artifact) itemsList.push(`🪞 ${escapeHtml(corpse.items.artifact.name)}`);

    let itemsHtml = '';
    if (itemsList.length > 0) {
      itemsHtml = `
        <div style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; padding: 10px; display: flex; flex-direction: column; gap: 6px;">
          <b style="color: #ffd43b; font-size: 11px;">🎒 Hành Trang Còn Trên Thi Hài:</b>
          <div style="display: flex; flex-wrap: wrap; gap: 6px;">
            ${itemsList.map(it => `<span style="background: rgba(250, 204, 21, 0.15); border: 1px solid rgba(250, 204, 21, 0.3); padding: 2px 6px; border-radius: 4px; font-size: 11px; color: #fde047;">${it}</span>`).join('')}
          </div>
          <div style="font-size: 10px; color: #94a3b8; margin-top: 2px;">
            <i>Khi thi thể phân rã hoàn toàn sau 1 tháng (x5 mỗi cấp lớn), các vật phẩm này sẽ rơi ra ngoài đất. Nếu có người thân ở gần mang đi chôn cất, chúng sẽ được lưu làm đồ tùy táng trong mộ.</i>
          </div>
        </div>
      `;
    }

    this.container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #30363d; padding-bottom: 8px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 26px;">💀</span>
          <div>
            <h3 style="margin: 0; color: #f8fafc; font-size: 16px;">Thi Hài: ${escapeHtml(corpse.deceasedName)}</h3>
            <div style="font-size: 11px; color: #cbd5e1; margin-top: 2px;">
              <span style="color: #ffd43b; font-weight: bold;">[${escapeHtml(corpse.realmStageName)}]</span> • Chủng tộc: ${escapeHtml(corpse.raceId)}
            </div>
          </div>
        </div>
        <button id="close-inspector-btn" style="background: transparent; border: none; color: #8b949e; cursor: pointer; font-size: 18px;">✕</button>
      </div>

      <div style="background: rgba(148, 163, 184, 0.1); border: 1px solid rgba(148, 163, 184, 0.25); border-radius: 8px; padding: 10px; display: flex; flex-direction: column; gap: 6px;">
        <div style="display: flex; justify-content: space-between; font-size: 11px;">
          <span style="color: #94a3b8;">Trạng Thái:</span>
          <b style="color: ${corpse.isBeingCarried ? '#c084fc' : '#cbd5e1'};">
            ${corpse.isBeingCarried ? 'Đang được người thân cõng đi an táng 🕊️' : 'Nằm trên mặt đất'}
          </b>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 11px;">
          <span style="color: #94a3b8;">Thời Điểm Tọa Hóa:</span>
          <span>Ngày ${corpse.deathDay}, Tháng ${corpse.deathMonth}, Năm ${corpse.deathYear}</span>
        </div>
      </div>

      <div style="background: #0d1117; border: 1px solid #30363d; border-radius: 8px; padding: 10px; display: flex; flex-direction: column; gap: 6px;">
        <div style="display: flex; justify-content: space-between; font-size: 11px;">
          <span style="color: #94a3b8;">Thời Gian Duy Trì Xác Còn Lại:</span>
          <b style="color: #38bdf8;">${Math.round(corpse.remainingDays)} ngày (${monthsRemaining} / ${totalMonths} tháng)</b>
        </div>
        <div style="width: 100%; height: 6px; background: #21262d; border-radius: 3px; overflow: hidden;">
          <div style="width: ${percentRemaining}%; height: 100%; background: linear-gradient(90deg, #38bdf8, #818cf8);"></div>
        </div>
        <div style="font-size: 10px; color: #8b949e;">
          ⏳ <i>Phàm nhân duy trì 1 tháng, cứ tăng 1 cấp lớn thì thời gian duy trì xác tăng gấp 5 lần.</i>
        </div>
      </div>

      ${itemsHtml}
    `;

    this.container.style.display = 'flex';
    document.getElementById('close-inspector-btn')?.addEventListener('click', () => this.hide());
  }

  private updateRecentActivity(text: string | null): void {
    for (const element of this.container.querySelectorAll<HTMLElement>('[data-recent-activity]')) {
      element.textContent = text ? `Vừa làm: ${text}` : '';
    }
  }

  public showEntity(entityId: number): void {
    const openSocialDetails = new Set(Array.from(this.container.querySelectorAll<HTMLDetailsElement>('[data-social-details]'))
      .filter(details => details.open).map(details => details.dataset.socialDetails!));
    this.currentInspectedEntityId = entityId;

    const graveComp = this.world.getComponent(entityId, GraveComponent);
    if (graveComp) {
      this.showGrave(entityId, graveComp);
      return;
    }

    const lootComp = this.world.getComponent(entityId, DroppedLootComponent);
    if (lootComp) {
      this.showDroppedLoot(entityId, lootComp);
      return;
    }

    const corpseComp = this.world.getComponent(entityId, CorpseComponent);
    if (corpseComp) {
      this.showCorpse(entityId, corpseComp);
      return;
    }

    if (this.world.hasComponent(entityId, AnimalComponent)) {
      this.container.innerHTML = AnimalInspector.renderAnimalHtml(this.world, entityId);
      this.container.style.display = 'flex';
      document.getElementById('close-inspector-btn')?.addEventListener('click', () => this.hide());
      return;
    }

    if (this.world.hasComponent(entityId, AnimalCarcassComponent)) {
      this.container.innerHTML = AnimalInspector.renderCarcassHtml(this.world, entityId);
      this.container.style.display = 'flex';
      document.getElementById('close-inspector-btn')?.addEventListener('click', () => this.hide());
      return;
    }

    const nameComp = this.world.getComponent(entityId, NameComponent);
    const raceComp = this.world.getComponent(entityId, RaceComponent);

    const realmComp = this.world.getComponent(entityId, RealmComponent);
    const hpComp = this.world.getComponent(entityId, HealthComponent);
    const lifeComp = this.world.getComponent(entityId, LifespanComponent);
    const hungerComp = this.world.getComponent(entityId, HungerComponent);
    const techComp = this.world.getComponent(entityId, CultivationTechniqueComponent);
    const stateComp = this.world.getComponent(entityId, CharacterStateComponent);
    const traitsComp = this.world.getComponent(entityId, TraitsComponent);
    const compComp = this.world.getComponent(entityId, ComprehensionComponent);
    const equipComp = this.world.getComponent(entityId, EquipmentComponent);
    const combatStatsComp = this.world.getComponent(entityId, CombatStatsComponent);
    const invComp = this.world.getComponent(entityId, InventoryComponent);
    const memberComp = this.world.getComponent(entityId, MemberComponent);
    const residenceComp = this.world.getComponent(entityId, ResidenceComponent);
    const foundingComp = this.world.getComponent(entityId, FoundingIntentComponent);
    const posComp = this.world.getComponent(entityId, PositionComponent);
    const historyComp = this.world.getComponent(entityId, CharacterHistoryComponent);
    const rootComp = this.world.getComponent(entityId, SpiritualRootComponent);
    const needsComp = this.world.getComponent(entityId, MortalNeedsComponent);
    const scheduleComp = this.world.getComponent(entityId, DailyScheduleComponent);
    const childcareComp = this.world.getComponent(entityId, ChildcareComponent);
    const brainComp = this.world.getComponent(entityId, AIStrategicBrainComponent);
    const plannerComp = this.world.getComponent(entityId, AIPlannerComponent);
    const btComp = this.world.getComponent(entityId, AIBehaviorTreeComponent);
    const relComp = this.world.getComponent(entityId, SocialRelationshipComponent);
    const memComp = this.world.getComponent(entityId, MemoryComponent);

    if (!raceComp) {
      this.hide();
      return;
    }

    const raceDef = RACE_DEFINITIONS[raceComp.raceId] || RACE_DEFINITIONS['human'];

    let factionHtml = '';
    let factionComp: FactionComponent | null = null;
    if (memberComp) {
      const fEnt = FactionFactory.findFactionEntity(this.world, memberComp.factionId);
      if (fEnt !== null) {
        factionComp = this.world.getComponent(fEnt, FactionComponent) ?? null;
        if (factionComp) {
          factionHtml = `<div style="font-size: 11px; margin-top: 3px; color: ${factionComp.color}; font-weight: bold;">🚩 ${escapeHtml(memberComp.getRoleName(factionComp.type))} • ${escapeHtml(factionComp.name)}</div>`;
        }
      }
    }

    let settlementComp: SettlementComponent | null = null;
    if (residenceComp) {
      const sEnt = FactionFactory.findSettlementEntity(this.world, residenceComp.settlementId);
      if (sEnt !== null) {
        settlementComp = this.world.getComponent(sEnt, SettlementComponent) ?? null;
      }
    }

    let stateText = 'Đang nghỉ ngơi';
    let stateColor = '#8b949e';
    if (stateComp?.state === 'walk') {
      stateText = scheduleComp ? `Đang di chuyển: ${scheduleComp.getActivityName()}` : 'Đang du ngoạn';
      stateColor = '#58a6ff';
    } else if (stateComp?.state === 'meditate') {
      stateText = 'Đang bế quan thổ nạp linh khí 🧘';
      stateColor = '#ffd43b';
    } else if (stateComp?.state === 'sleep') {
      stateText = 'Đang ngủ say giấc nồng 💤';
      stateColor = '#a78bfa';
    } else if (stateComp?.state === 'cook') {
      stateText = 'Đang nấu nướng cơm canh 🍳🔥';
      stateColor = '#fb923c';
    } else if (stateComp?.state === 'farm') {
      stateText = 'Đang cày bừa canh tác mùa màng 🌾';
      stateColor = '#4ade80';
    } else if (stateComp?.state === 'build') {
      stateText = 'Đang xây dựng / tu bổ công trình 🔨';
      stateColor = '#fbbf24';
    } else if (stateComp?.state === 'recreate') {
      stateText = 'Đang giải trí tụ hội lửa trại 🎶';
      stateColor = '#f472b6';
    } else if (stateComp?.state === 'breakthrough') {
      stateText = '⚡ ĐANG ĐỘT PHÁ CẢNH GIỚI!';
      stateColor = '#eebefa';
    } else if (stateComp?.state === 'dead') {
      stateText = 'Đã tọa hóa / Vong mạng 🪦';
      stateColor = '#ff6b6b';
    } else if (scheduleComp && scheduleComp.currentActivity !== 'idle') {
      stateText = scheduleComp.getActivityName();
      stateColor = '#58a6ff';
    }

    const qiPercent = realmComp ? Math.min(100, Math.floor((realmComp.currentQi / Math.max(1, realmComp.maxQi)) * 100)) : 0;
    const breakthroughOutlook = realmComp ? getBreakthroughOutlook(this.world, entityId) : null;
    const hpPercent = hpComp ? Math.min(100, Math.max(0, Math.floor((hpComp.current / Math.max(1, hpComp.max)) * 100))) : 100;
    const hungerVal = hungerComp ? Math.round(hungerComp.current) : 100;

    const renderAllTraitBadges = () => {
      if (!traitsComp) return '';
      if (traitsComp.entries && traitsComp.entries.length > 0) {
        return traitsComp.entries.map(entry => renderTraitBadgeHtml(entry.id, entry)).join('');
      }
      const uniqueIds = Array.from(new Set([
        ...traitsComp.innateTraits,
        ...traitsComp.techniqueTraits,
        ...traitsComp.trainingTraits,
      ]));
      return uniqueIds.map(id => renderTraitBadgeHtml(id)).join('');
    };

    const isDual = equipComp ? equipComp.isDualWielding() : false;
    const pillsList = invComp ? invComp.getPillsSummary() : [];

    // TÍNH TOÁN CÁC THÔNG SỐ CHIẾN ĐẤU CỐT LÕI
    const baseAtk = combatStatsComp?.baseAtk ?? 10;
    const defense = combatStatsComp?.defense ?? 0;
    const totalArmor = (combatStatsComp?.armor ?? 2) + (equipComp?.getTotalArmorBonus() ?? 0);
    const armorMitigationPercent = ((1 - 50 / (50 + totalArmor)) * 100).toFixed(0);
    const critRatePercent = Math.round((combatStatsComp?.critRate ?? 0.05) * 100);
    const dodgeRatePercent = Math.round((combatStatsComp?.dodgeRate ?? 0.05) * 100);
    const moveSpeed = posComp ? posComp.speed : raceDef.baseStats.moveSpeed;
    const attackSpeed = (combatStatsComp?.attackSpeed ?? 1.0) * (isDual ? 1.6 : 1.0);
    const compScore = compComp ? compComp.current : raceDef.baseStats.comprehension;
    const compBonusPercent = Math.round((compComp?.getBreakthroughBonus() ?? 0) * 100);

    // NỘI DUNG THEO TỪNG TAB
    let tabContentHtml = '';

    // TAB 1: THÂN THỂ & TU VI
    if (this.activeEntityTab === 'stats') {
      const potentialBlockHtml = renderPotentialSummaryHtml(this.world, entityId);
      tabContentHtml = `
        <div style="display: flex; justify-content: space-between;">
          <span style="color: #8b949e;">Cảnh giới:</span>
          <span style="color: #fcc419; font-weight: bold;">${realmComp ? `${escapeHtml(realmComp.stageName)} (${escapeHtml(realmComp.subStageName)})` : 'Chưa nhập môn'}</span>
        </div>

        ${breakthroughOutlook ? `<div style="font-size: 11px; color: #c084fc;">Đột phá ${breakthroughOutlook.major ? 'đại' : 'tiểu'} cảnh giới: ${Math.round(breakthroughOutlook.chance * 100)}%${breakthroughOutlook.reason ? ` • ${escapeHtml(breakthroughOutlook.reason)}` : ' • Đủ điều kiện'}</div>` : ''}

        <div style="display: flex; justify-content: space-between;">
          <span style="color: #8b949e;">Chiến lực tổng hợp:</span>
          <span style="color: #ff7b72; font-weight: bold;">⚔ ${realmComp?.combatPower ?? 10}</span>
        </div>

        <!-- THANH SINH MỆNH HP -->
        <div>
          <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 3px;">
            <span>Sinh mệnh (HP):</span>
            <span style="color: #ff8787; font-weight: bold;">${hpComp ? `${Math.round(hpComp.current)} / ${hpComp.max.toFixed(1)}` : '100/100'}</span>
          </div>
          <div style="width: 100%; height: 7px; background: #21262d; border-radius: 4px; overflow: hidden;">
            <div style="width: ${hpPercent}%; height: 100%; background: linear-gradient(90deg, #e03131, #ff6b6b);"></div>
          </div>
        </div>

        <!-- THANH LINH KHÍ QI -->
        <div>
          <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 3px;">
            <span>Linh lực tích lũy:</span>
            <span style="color: #69db7c; font-weight: bold;">${realmComp ? `${Math.floor(realmComp.currentQi)} / ${realmComp.maxQi}` : '0/0'} (${qiPercent}%)</span>
          </div>
          <div style="width: 100%; height: 7px; background: #21262d; border-radius: 4px; overflow: hidden;">
            <div style="width: ${qiPercent}%; height: 100%; background: linear-gradient(90deg, #1f6feb, #38d9a9);"></div>
          </div>
        </div>

        <!-- THỌ NGUYÊN & CẢNH BÁO GIÀ YẾU -->
        <div>
          <div style="display: flex; justify-content: space-between; font-size: 11px;">
            <span style="color: #8b949e;">Thọ nguyên:</span>
            <span><b style="color: #fcc419;">${lifeComp?.currentAge ?? 18}</b> / <span style="color: #79c0ff;">${lifeComp?.maxLifespan ?? 80}</span> tuổi</span>
          </div>
          ${lifeComp?.isElderly ? `
            <div style="background: rgba(224, 49, 49, 0.25); border: 1px solid #ff6b6b; color: #ffa8a8; padding: 5px 8px; border-radius: 6px; font-size: 11px; margin-top: 4px; line-height: 1.35;">
              <b>⚠️ GIAI ĐOẠN GIÀ YẾU (&ge; 90% thọ nguyên):</b>
              <div style="color: #ffd8a8; font-size: 10px;">HP tối đa và thể chất giảm dần, tối đa 50% mốc khỏe mạnh!
                <div>Thọ nguyên còn: ${Math.max(0, (1 - (lifeComp?.currentAge ?? 0) / (lifeComp?.maxLifespan || 1)) * 100).toFixed(1)}% · Suy giảm tuổi già: ${((1 - (this.world.getComponent(entityId, StatBaselineComponent)?.agingFactor ?? 1)) * 100).toFixed(1)}%</div>
                <div>HP tối đa khỏe mạnh gần nhất: ${Math.round(this.world.getComponent(entityId, StatBaselineComponent)?.agingReference?.maxHealth ?? hpComp?.max ?? 0)}</div> Hãy đột phá hoặc dùng Dưỡng Thọ Đan để diên thọ!</div>
            </div>
          ` : ''}
        </div>

        <!-- ĐIỂM NO ẤM -->
        <div>
          <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 3px;">
            <span style="color: #8b949e;">Điểm no ấm:</span>
            <span style="color: ${hungerVal < 25 ? '#ff6b6b' : '#c9d1d9'};">${hungerVal}% ${hungerVal < 25 ? '(Đói cồn cào!)' : ''}</span>
          </div>
          <div style="width: 100%; height: 5px; background: #21262d; border-radius: 3px; overflow: hidden;">
            <div style="width: ${hungerVal}%; height: 100%; background: ${hungerVal < 25 ? '#ff6b6b' : '#fab005'};"></div>
          </div>
        </div>

        <!-- NHU CẦU DÂN SINH PHÀM NHÂN & LỊCH TRÌNH HOẠT ĐỘNG -->
        ${renderProfessionPanel(this.world, entityId)}
        ${needsComp ? `
          <div style="background: #161b22; border: 1px solid #30363d; border-radius: 8px; padding: 8px 10px; display: flex; flex-direction: column; gap: 6px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 11px; color: #8b949e; font-weight: bold;">Nhu Cầu Dân Sinh Phàm Nhân:</span>
            </div>

            <!-- CƠN KHÁT (THIRST) -->
            <div>
              <div style="display: flex; justify-content: space-between; font-size: 10px; margin-bottom: 2px;">
                <span style="color: #79c0ff;">💧 Cơn khát / Nước uống:</span>
                <span style="color: ${needsComp.thirst < 35 ? '#ff6b6b' : '#79c0ff'}; font-weight: bold;">${Math.round(needsComp.thirst)}%</span>
              </div>
              <div style="width: 100%; height: 4px; background: #21262d; border-radius: 2px; overflow: hidden;">
                <div style="width: ${Math.round(needsComp.thirst)}%; height: 100%; background: ${needsComp.thirst < 35 ? '#ff6b6b' : '#38bdf8'};"></div>
              </div>
            </div>

            <!-- NĂNG LƯỢNG / GIẤC NGỦ (SLEEP) -->
            <div>
              <div style="display: flex; justify-content: space-between; font-size: 10px; margin-bottom: 2px;">
                <span style="color: #a78bfa;">😴 Thể lực / Năng lượng:</span>
                <span style="color: ${needsComp.sleep < 25 ? '#ff6b6b' : '#a78bfa'}; font-weight: bold;">${Math.round(needsComp.sleep)}%</span>
              </div>
              <div style="width: 100%; height: 4px; background: #21262d; border-radius: 2px; overflow: hidden;">
                <div style="width: ${Math.round(needsComp.sleep)}%; height: 100%; background: ${needsComp.sleep < 25 ? '#ff6b6b' : '#818cf8'};"></div>
              </div>
            </div>

            <!-- TINH THẦN / GIẢI TRÍ (RECREATION) -->
            <div>
              <div style="display: flex; justify-content: space-between; font-size: 10px; margin-bottom: 2px;">
                <span style="color: #f472b6;">🎶 Tinh thần / Giải trí:</span>
                <span style="color: ${needsComp.recreation < 30 ? '#ff6b6b' : '#f472b6'}; font-weight: bold;">${Math.round(needsComp.recreation)}%</span>
              </div>
              <div style="width: 100%; height: 4px; background: #21262d; border-radius: 2px; overflow: hidden;">
                <div style="width: ${Math.round(needsComp.recreation)}%; height: 100%; background: ${needsComp.recreation < 30 ? '#ff6b6b' : '#ec4899'};"></div>
              </div>
            </div>

            <!-- LƯƠNG THỰC DỰ TRỮ & MÓN ĂN NẤU CHÍN -->
            <div style="border-top: 1px solid #21262d; padding-top: 5px; font-size: 10px; display: flex; justify-content: space-between; align-items: center;">
              <span>🌾 Lương thực thô: <b style="color: #facc15;">${needsComp.rawFoodCount}</b></span>
              <span>🍲 Cơm canh nấu chín: <b style="color: #4ade80;">${needsComp.cookedMealCount}</b></span>
            </div>
          </div>
        ` : ''}

        <!-- KHỐI TIỀM NĂNG & TÂM CẢNH V3 (MỤC 13.1) -->
        ${potentialBlockHtml}

        <!-- 7 CHỈ SỐ CỐT LÕI (CÔNG, THỦ, GIÁP, BẠO KÍCH, NÉ ĐÒN, TỐC ĐỘ, NGỘ TÍNH) -->
        <div style="background: #161b22; border: 1px solid #30363d; border-radius: 8px; padding: 8px 10px; display: flex; flex-direction: column; gap: 6px;">
          <span style="font-size: 11px; color: #8b949e; font-weight: bold;">7 Chỉ Số Cơ Bản:</span>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 11px;">
            <div>⚔️ Công kích: <b style="color: #ff7b72;">${baseAtk}</b></div>
            <div>🛡️ Phòng thủ: <b style="color: #79c0ff;">${defense}</b></div>
            <div>🥋 Giáp hộ thể: <b style="color: #51cf66;">${totalArmor}</b> <span style="font-size: 10px; color: #8b949e;">(-${armorMitigationPercent}%)</span></div>
            <div>⚡ Bạo kích: <b style="color: #ffd43b;">${critRatePercent}%</b></div>
            <div>💨 Né đòn: <b style="color: #74c0fc;">${dodgeRatePercent}%</b></div>
            <div>🏃 Tốc độ: <b style="color: #d2a8ff;">${moveSpeed}px/s</b> <span style="font-size: 10px; color: #8b949e;">(${attackSpeed.toFixed(1)}/s)</span></div>
          </div>
          <div style="border-top: 1px solid #21262d; padding-top: 5px; font-size: 11px; display: flex; justify-content: space-between; align-items: center;">
            <span>🧠 <b>Ngộ tính</b> (Adapter 100.000):</span>
            <span style="color: #e599f7; font-weight: bold;">${compScore.toLocaleString('vi-VN')} <span style="font-size: 10px; color: #69db7c;">(+${compBonusPercent}% ĐP)</span></span>
          </div>
        </div>

        <!-- CÔNG PHÁP TU LUYỆN (INTERACTIVE CARD) -->
        ${techComp ? (() => {
          const tierInfo = techComp.getTierInfo();
          const sourceInfo = techComp.getSourceInfo();
          const masteryTitle = techComp.getMasteryTitle();
          const masteryBadge = techComp.getMasteryBadge();
          const masteryMult = techComp.getMasteryMultiplier();
          const expPercent = Math.min(100, Math.round((techComp.masteryExp / techComp.masteryMaxExp) * 100));
          const masteryColor = MASTERY_CONFIGS[techComp.masteryLevel]?.color || '#38bdf8';

          return `
            <div id="tech-card-btn" style="background: #161b22; border: 1px solid #30363d; border-radius: 8px; padding: 8px 10px; display: flex; flex-direction: column; gap: 5px; cursor: pointer; transition: border-color 0.2s;" onmouseover="this.style.borderColor='#58a6ff'" onmouseout="this.style.borderColor='#30363d'">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <div style="display: flex; align-items: center; gap: 5px;">
                  <span style="background: ${tierInfo.color}22; border: 1px solid ${tierInfo.color}; color: ${tierInfo.color}; padding: 1px 5px; border-radius: 4px; font-size: 10px; font-weight: bold;">${tierInfo.badge} ${tierInfo.name}</span>
                  <b style="color: #f0f6fc; font-size: 12px;">${escapeHtml(techComp.techniqueName)}</b>
                </div>
                <span style="font-size: 10px; color: #58a6ff;">(Chi tiết 🔍)</span>
              </div>

              <div style="display: flex; justify-content: space-between; align-items: center; font-size: 10px;">
                <span style="color: #8b949e;">Nguồn gốc: <b style="color: #c9d1d9;">${sourceInfo.icon} ${escapeHtml(techComp.sourceName || sourceInfo.name)}</b></span>
                <span style="color: ${masteryColor}; font-weight: bold;">${masteryBadge} ${masteryTitle} (x${masteryMult.toFixed(1)})</span>
              </div>

              <!-- Thanh độ thông thạo công pháp -->
              <div>
                <div style="display: flex; justify-content: space-between; font-size: 9px; margin-bottom: 2px; color: #8b949e;">
                  <span>Độ thông thạo:</span>
                  <span>${Math.round(techComp.masteryExp)} / ${techComp.masteryMaxExp} EXP (${expPercent}%)</span>
                </div>
                <div style="width: 100%; height: 4px; background: #21262d; border-radius: 2px; overflow: hidden;">
                  <div style="width: ${expPercent}%; height: 100%; background: ${masteryColor};"></div>
                </div>
              </div>
            </div>
          `;
        })() : `
          <div style="background: #161b22; border: 1px dashed #30363d; border-radius: 8px; padding: 8px 10px; display: flex; justify-content: space-between; align-items: center; font-size: 11px;">
            <span style="color: #8b949e;">📖 Công pháp:</span>
            <span style="color: #6e7681; font-style: italic; font-size: 10px;">Chưa nhập môn (Cần bái nhập môn phái hoặc kỳ ngộ)</span>
          </div>
        `}

        <!-- ĐẶC ĐIỂM BẨM SINH & HẬU THIÊN (INTERACTIVE BADGES) -->
        ${traitsComp ? `
          <div style="margin-top: 2px; border-top: 1px solid #21262d; padding-top: 6px; display: flex; flex-direction: column; gap: 4px;">
            <div style="display: flex; justify-content: space-between; font-size: 11px;">
              <span style="color: #8b949e;">Đặc điểm (Bẩm sinh • Huyết mạch • Hậu thiên):</span>
              <span style="color: #58a6ff; font-size: 10px;">(Bấm để xem chi tiết)</span>
            </div>
            <div style="display: flex; gap: 5px; flex-wrap: wrap;">
              ${renderAllTraitBadges()}
            </div>
          </div>
        ` : ''}
      `;
    }
    // TAB 2: TRANG BỊ & TÚI ĐỒ
    else if (this.activeEntityTab === 'equip') {
      tabContentHtml = `
        ${equipComp?.bodyArmor ? `<button id="appearance-remove-armor" style="padding:5px;">Tháo trang phục về đồ thường</button>` : ''}
        <!-- TRANG BỊ BINH KHÍ, CÔNG CỤ, GIÁP, PHÁP BẢO -->
        <div style="background: #161b22; border: 1px solid #30363d; border-radius: 8px; padding: 8px 10px; display: flex; flex-direction: column; gap: 6px;">
          <span style="font-size: 11px; color: #8b949e; font-weight: bold;">Trang Bị Thân Thể & Dụng Cụ:</span>

          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="color: #8b949e; font-size: 11px;">🗡️ Tay Phải (Chính):</span>
            <span style="font-size: 11px; color: ${equipComp?.mainHand ? '#58a6ff' : '#6e7681'}; font-weight: 500;">
              ${equipComp?.mainHand ? `${gearIcon(equipComp.mainHand.iconPath)}${equipComp.mainHand.badge} ${escapeHtml(equipComp.mainHand.name)} (+${equipComp.mainHand.baseDamage})` : 'Tay không'}
            </span>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="color: #8b949e; font-size: 11px;">🗡️ Tay Trái (Phụ):</span>
            <span style="font-size: 11px; color: ${equipComp?.offHand ? '#bc8cff' : '#6e7681'}; font-weight: 500;">
              ${equipComp?.offHand ? `${gearIcon(equipComp.offHand.iconPath)}${equipComp.offHand.badge} ${escapeHtml(equipComp.offHand.name)} (+${equipComp.offHand.baseDamage})` : 'Tay không'}
            </span>
          </div>

          ${isDual ? `
            <div style="background: rgba(210, 153, 34, 0.2); border: 1px solid #d29922; color: #e3b341; padding: 4px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; text-align: center;">
              ⚔️ SONG TRÌ 2 TAY (Song Kiếm Hợp Bích / Tốc đánh +60%)
            </div>
          ` : ''}

          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="color: #8b949e; font-size: 11px;">🔨 Công Cụ Lao Động:</span>
            <span style="font-size: 11px; color: ${equipComp?.workTool ? '#f59e0b' : '#6e7681'}; font-weight: 500;">
              ${equipComp?.workTool ? `${gearIcon(equipComp.workTool.iconPath)}${equipComp.workTool.badge} ${escapeHtml(equipComp.workTool.name)}` : 'Chưa có công cụ'}
            </span>
          </div>
          ${equipComp?.workTool ? `
            <div style="font-size: 10px; color: #fbbf24; background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.25); padding: 4px 6px; border-radius: 4px; display: flex; flex-direction: column; gap: 2px;">
              <div style="display: flex; justify-content: space-between;">
                <span>• Phẩm cấp: <b>${escapeHtml(equipComp.workTool.categoryName)}</b></span>
                <span>• Năng suất: <b style="color: #4ade80;">x${equipComp.workTool.workEfficiencyMultiplier}</b></span>
              </div>
              <div style="display: flex; justify-content: space-between; color: #d1d5db;">
                <span>• Sát thương tự vệ: <b>+${equipComp.workTool.baseDamage}</b></span>
                <span>${equipComp.workTool.harvestYieldBonus > 0 ? `• Sản lượng: <b style="color: #67e8f9;">+${equipComp.workTool.harvestYieldBonus}</b>` : ''}</span>
              </div>
            </div>
          ` : ''}

          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="color: #8b949e; font-size: 11px;">🥋 Giáp Hộ Thân:</span>
            <span style="font-size: 11px; color: ${equipComp?.bodyArmor ? '#51cf66' : '#6e7681'}; font-weight: 500;">
              ${equipComp?.bodyArmor ? `${gearIcon(equipComp.bodyArmor.iconPath)}${equipComp.bodyArmor.badge} ${escapeHtml(equipComp.bodyArmor.name)} (+${equipComp.bodyArmor.armorBonus} Giáp)` : 'Chưa mặc giáp'}
            </span>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="color: #8b949e; font-size: 11px;">📿 Pháp Bảo:</span>
            <span style="font-size: 11px; color: ${equipComp?.artifact ? '#fcc419' : '#6e7681'}; font-weight: 500;">
              ${equipComp?.artifact ? `${equipComp.artifact.badge} ${escapeHtml(equipComp.artifact.name)}` : 'Chưa có pháp bảo'}
            </span>
          </div>
          ${equipComp?.artifact ? `
            <div style="font-size: 10px; color: #ffd43b; background: rgba(255, 212, 59, 0.08); padding: 4px 6px; border-radius: 4px;">
              ✨ ${escapeHtml(equipComp.artifact.effectDescription)}
            </div>
          ` : ''}
        </div>

        <!-- TÚI TRỮ VẬT / ĐAN DƯỢC, LINH THẠCH -->
        <div style="background: #161b22; border: 1px solid #30363d; border-radius: 8px; padding: 8px 10px; display: flex; flex-direction: column; gap: 6px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 11px; color: #8b949e; font-weight: bold;">Túi Trữ Vật:</span>
            <span style="font-size: 11px; color: #58a6ff;">💎 Linh Thạch: 120</span>
          </div>

          ${pillsList.length === 0 ? `
            <span style="font-size: 11px; color: #6e7681; font-style: italic;">Chưa có đan dược nào trong túi</span>
          ` : `
            <div style="display: flex; flex-direction: column; gap: 4px;">
              ${pillsList.map(item => {
                const check = PillUsageService.canUsePill(this.world, entityId, item.def.id);
                const disabledAttr = check.canUse ? '' : `disabled title="${escapeHtml(check.reason || 'Chưa thể sử dụng')}"`;
                const btnStyle = check.canUse
                  ? 'background: #238636; border: none; color: #fff; border-radius: 4px; padding: 2px 8px; cursor: pointer; font-size: 11px; font-weight: bold;'
                  : 'background: #21262d; border: 1px solid #30363d; color: #8b949e; border-radius: 4px; padding: 2px 8px; cursor: not-allowed; font-size: 11px;';
                return `
                <div style="display: flex; justify-content: space-between; align-items: center; background: #0d1117; padding: 4px 8px; border-radius: 4px; font-size: 11px;">
                  <span title="${escapeHtml(item.def.description)}">${item.def.badge} ${escapeHtml(item.def.name)} <b style="color: #7ee787;">x${item.count}</b></span>
                  <button class="use-pill-btn" data-pill="${escapeHtml(item.def.id)}" ${disabledAttr} style="${btnStyle}">Dùng</button>
                </div>
              `;}).join('')}
            </div>
          `}
        </div>
      `;
    }
    // TAB 3: THẾ LỰC & THÂN PHẬN
    else if (this.activeEntityTab === 'faction') {
      const homeRoleLabels: Record<string, string> = {
        resident: 'Cư Dân Thường Trú',
        elder: 'Trưởng Lão Quê Hương',
        head: 'Thôn / Lý Trưởng',
        guest: 'Khách Tạm Trú'
      };
      const residenceLabel = settlementComp
        ? `${escapeHtml(settlementComp.name)} (${homeRoleLabels[residenceComp?.homeRole ?? 'resident'] ?? 'Cư Dân'})`
        : 'Chưa định cư (Lưu Dân)';

      const intentStageLabels: Record<string, string> = {
        gathering: 'Đang tụ họp đồng hành',
        selecting_site: 'Đang khảo sát địa thế',
        building: 'Đang khởi công dựng nền',
        completed: 'Đã hoàn thành',
        cancelled: 'Đã hủy bỏ'
      };

      tabContentHtml = `
        <div style="background: #161b22; border: 1px solid #30363d; border-radius: 8px; padding: 10px; display: flex; flex-direction: column; gap: 8px;">
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #8b949e;">Môn Phái / Thế Lực:</span>
            <span style="color: ${factionComp?.color ?? '#58a6ff'}; font-weight: bold;">${factionComp ? `${escapeHtml(factionComp.name)} [${escapeHtml(factionComp.getRankName())}]` : 'Tán Tu / Lưu Dân Tự Do'}</span>
          </div>

          <div style="display: flex; justify-content: space-between;">
            <span style="color: #8b949e;">Thân phận / Vai trò:</span>
            <span style="color: #ffd43b; font-weight: bold;">${memberComp ? escapeHtml(memberComp.getRoleName(factionComp?.type)) : 'Tự Do'}</span>
          </div>

          <div style="display: flex; justify-content: space-between;">
            <span style="color: #8b949e;">Nơi cư trú (Quê quán):</span>
            <span style="color: #7ee787; font-weight: 600;">🏠 ${residenceLabel}</span>
          </div>

          ${memberComp ? `
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #8b949e;">Độ trung thành / Gắn kết:</span>
              <span style="color: ${memberComp.loyalty >= 60 ? '#38d9a9' : '#ff922b'}; font-weight: bold;">${Math.round(memberComp.loyalty)}/100</span>
            </div>
            ${memberComp.intentReason ? `
              <div style="display: flex; justify-content: space-between; font-size: 11px;">
                <span style="color: #8b949e;">Nguyên nhân quy tụ:</span>
                <span style="color: #c9d1d9; font-style: italic;">"${escapeHtml(memberComp.intentReason)}"</span>
              </div>
            ` : ''}
          ` : ''}

          <div style="display: flex; justify-content: space-between;">
            <span style="color: #8b949e;">Đạo nghĩa:</span>
            <span>${factionComp ? factionComp.getAlignmentBadge() : 'Trung Lập'}</span>
          </div>

          ${foundingComp ? `
            <div style="background: #1f2937; border: 1px solid #d97706; border-radius: 6px; padding: 8px; margin-top: 4px; display: flex; flex-direction: column; gap: 4px;">
              <div style="font-size: 11px; color: #fbbf24; font-weight: bold;">
                🚩 Chí hướng: ${foundingComp.intentType === 'sect' ? 'Khai Tông Lập Phái' : 'Dựng Thôn Lập Ấp'}
              </div>
              <div style="font-size: 11px; color: #e5e7eb;">
                Giai đoạn: <b>${intentStageLabels[foundingComp.stage] ?? foundingComp.stage}</b> (${foundingComp.participantIds.size} người đồng hành)
              </div>
              <div style="font-size: 11px; color: #9ca3af; font-style: italic;">
                Lý do: "${escapeHtml(foundingComp.reason)}"
              </div>
            </div>
          ` : ''}

          <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #21262d; padding-top: 6px;">
            <span style="color: #8b949e;">Hành vi hiện tại:</span>
            <span style="color: ${stateColor}; font-weight: bold;">${stateText}</span>
          </div>
          <div data-recent-activity style="font-size: 11px; color: #9ccce8;"></div>
        </div>
      `;
    }
    // TAB 3: BỘ NÃO AI 3 TẦNG (THREE-TIER AI BRAIN)
    else if (this.activeEntityTab === 'ai') {
      const preferences = residentPreferences(entityId, this.world);
      const appearance = this.world.getComponent(entityId, AppearanceComponent);
      const appearanceInfo = appearance ? `Mẫu: ${escapeHtml(appearance.appearanceId)} · Giai đoạn: ${lifeStage(lifeComp?.currentAge ?? 15, lifeComp?.maxLifespan ?? 100)}` : 'Ngoại hình mặc định';
      const scores = brainComp?.utilityScores;
      const steps = plannerComp?.steps ?? [];
      const currentIdx = plannerComp?.currentStepIndex ?? 0;

      const utilityItems = [
        { label: 'Phụng Mệnh Thần Linh', key: 'OBEY_DECREE' as const, color: '#ffd700', icon: '📜' },
        { label: 'Đột Phá Cảnh Giới', key: 'BREAKTHROUGH' as const, color: '#c084fc', icon: '⚡' },
        { label: 'Bế Quan Tụ Khí', key: 'SECLUDED_CULTIVATION' as const, color: '#38bdf8', icon: '🧘' },
        { label: 'Sinh Tồn Cấp Thiết', key: 'SURVIVE_VITAL' as const, color: '#f87171', icon: '🍖' },
        { label: 'Huyết Chiến Tự Vệ', key: 'COMBAT_DEFENSE' as const, color: '#ef4444', icon: '⚔️' },
        { label: 'Rút Lui Thoát Hiểm', key: 'FLEE_DANGER' as const, color: '#fb923c', icon: '💨' },
        { label: 'Lao Động Dân Sinh', key: 'LABOUR_WORK' as const, color: '#facc15', icon: '🔨' },
        { label: 'Giao Lưu Nghỉ Ngơi', key: 'SOCIAL_RECREATE' as const, color: '#4ade80', icon: '🍵' },
        { label: 'Du Ngoạn Kỳ Ngộ', key: 'WANDER_SERENDIPITY' as const, color: '#60a5fa', icon: '🌌' }
      ];

      const utilityBarsHtml = utilityItems.map(item => {
        const val = scores ? Math.round(scores[item.key] ?? 0) : 0;
        return `
          <div>
            <div style="display: flex; justify-content: space-between; font-size: 10px; margin-bottom: 2px;">
              <span>${item.icon} ${item.label}:</span>
              <b style="color: ${item.color};">${val}/100</b>
            </div>
            <div style="width: 100%; height: 5px; background: #21262d; border-radius: 3px; overflow: hidden;">
              <div style="width: ${val}%; height: 100%; background: ${item.color};"></div>
            </div>
          </div>
        `;
      }).join('');

      const stepsHtml = steps.length === 0
        ? '<div style="font-size: 11px; color: #6e7681; font-style: italic; padding: 4px 0;">Đang phân rã kế hoạch mới...</div>'
        : steps.map((s, idx) => {
            const isCurrent = idx === currentIdx;
            const isDone = idx < currentIdx;
            return `
              <div style="padding: 5px 8px; border-radius: 5px; background: ${isCurrent ? 'rgba(56, 189, 248, 0.15)' : (isDone ? 'rgba(255,255,255,0.02)' : 'transparent')}; border: 1px solid ${isCurrent ? '#38bdf8' : (isDone ? '#21262d' : '#30363d')}; display: flex; align-items: center; justify-content: space-between; font-size: 11px;">
                <div style="display: flex; align-items: center; gap: 6px;">
                  <span style="color: ${isCurrent ? '#38bdf8' : (isDone ? '#7ee787' : '#8b949e')}; font-weight: bold;">${isDone ? '✓' : `${idx + 1}.`}</span>
                  <span style="color: ${isCurrent ? '#ffffff' : (isDone ? '#8b949e' : '#c9d1d9')}; ${isDone ? 'text-decoration: line-through;' : ''}">${escapeHtml(s.description)}</span>
                </div>
                ${isCurrent ? '<span style="background: #38bdf8; color: #000; font-size: 9px; font-weight: bold; padding: 0 4px; border-radius: 3px;">ĐANG CHẠY</span>' : ''}
              </div>
            `;
          }).join('');

      tabContentHtml = `
        <div style="display: flex; flex-direction: column; gap: 8px; max-height: 52vh; overflow-y: auto; padding-right: 4px;">
          <!-- TẦNG 1: BỘ NÃO CHIẾN LƯỢC -->
          <div style="background: #161b22; border: 1px solid #30363d; border-radius: 8px; padding: 8px 10px; display: flex; flex-direction: column; gap: 6px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 11px; color: #8b949e; font-weight: bold;">TẦNG 1: BỘ NÃO CHIẾN LƯỢC (UTILITY)</span>
              <span style="font-size: 9px; background: rgba(56, 189, 248, 0.15); color: #38bdf8; padding: 1px 5px; border-radius: 3px;">Chu kỳ 0.5s</span>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; background: #0d1117; padding: 6px 8px; border-radius: 6px; border-left: 3px solid ${brainComp ? brainComp.getGoalBadgeColor() : '#8b949e'};">
              <div>
                <div style="font-size: 10px; color: #8b949e;">Mục Tiêu Thôi Thúc Cao Nhất:</div>
                <b style="color: ${brainComp ? brainComp.getGoalBadgeColor() : '#c9d1d9'}; font-size: 13px;">${brainComp ? escapeHtml(brainComp.getGoalName()) : 'Chưa kích hoạt'}</b>
              </div>
              <div style="font-size: 10px; color: #ffd700; text-align: right;">
                ${escapeHtml(brainComp?.goalReason ?? '')}
              </div>
            </div>

            <div style="font-size: 11px; color: #8b949e; line-height: 1.6;">
              ${appearanceInfo}<br>
              Sở thích cá nhân: Giao tiếp ${Math.round(preferences.sociability * 100)} · Chăm chỉ ${Math.round(preferences.diligence * 100)} · Tò mò ${Math.round(preferences.curiosity * 100)} · Ham tu luyện ${Math.round(preferences.ambition * 100)}
            </div>
            <!-- THANH ĐIỂM TIẾN TRÌNH UTILITY -->
            <div style="display: flex; flex-direction: column; gap: 4px; margin-top: 2px;">
              ${utilityBarsHtml}
            </div>
          </div>

          <!-- TẦNG 2: BỘ LẬP KẾ HOẠCH -->
          <div style="background: #161b22; border: 1px solid #30363d; border-radius: 8px; padding: 8px 10px; display: flex; flex-direction: column; gap: 6px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 11px; color: #8b949e; font-weight: bold;">TẦNG 2: BỘ LẬP KẾ HOẠCH (PLANNER)</span>
              <span style="font-size: 10px; color: ${plannerComp?.planStatus === 'executing' ? '#38bdf8' : (plannerComp?.planStatus === 'completed' ? '#4ade80' : '#f87171')}; font-weight: bold;">
                ${plannerComp?.planStatus === 'executing' ? 'Đang thực thi 🚀' : (plannerComp?.planStatus === 'completed' ? 'Hoàn tất ✅' : 'Chờ lập lại 🔄')}
              </span>
            </div>

            <div style="display: flex; flex-direction: column; gap: 4px;">
              ${stepsHtml}
            </div>
          </div>

          <!-- TẦNG 3: BEHAVIOR TREE & VI MÔ -->
          <div style="background: #161b22; border: 1px solid #30363d; border-radius: 8px; padding: 8px 10px; display: flex; flex-direction: column; gap: 6px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 11px; color: #8b949e; font-weight: bold;">TẦNG 3: BEHAVIOR TREE & VI MÔ</span>
              <span style="font-size: 9px; color: #7ee787;">Tần số 60 FPS</span>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 11px;">
              <div style="background: #0d1117; padding: 5px 8px; border-radius: 4px;">
                <span style="color: #8b949e; font-size: 10px;">Hành vi đang tick:</span>
                <div style="color: #58a6ff; font-weight: bold; margin-top: 1px;">${escapeHtml(btComp?.activeNodeName ?? 'Idle')}</div>
              </div>
              <div style="background: #0d1117; padding: 5px 8px; border-radius: 4px;">
                <span style="color: #8b949e; font-size: 10px;">Hoạt ảnh / Hướng:</span>
                <div style="color: #e6edf3; font-weight: bold; margin-top: 1px;">${escapeHtml(stateComp?.state ?? 'idle')} (${escapeHtml(stateComp?.direction ?? 'down')})</div>
              </div>
              <div style="background: #0d1117; padding: 5px 8px; border-radius: 4px; grid-column: span 2;">
                <span style="color: #8b949e; font-size: 10px;">Tìm đường A* Pathfinding:</span>
                <div style="color: #7ee787; font-weight: 500; margin-top: 1px;">
                  ${btComp && btComp.hasPath() ? `🗺️ Đang bám theo đường A* (còn ${btComp.pathWaypoints.length - btComp.currentWaypointIndex} waypoint)` : '🎯 Đã tới đích hoặc đứng yên'}
                </div>
              </div>
              <div style="background: #0d1117; padding: 5px 8px; border-radius: 4px; grid-column: span 2;">
                <span style="color: #8b949e; font-size: 10px;">Thân Pháp Né Đòn (Active Dodge):</span>
                <div style="color: #38bdf8; font-weight: 500; margin-top: 1px;">
                  ${btComp?.isDodging ? '⚡ ĐANG KÍCH HOẠT LƯỚT NÉ ĐÒN! 💨' : (btComp && btComp.dodgeCooldown <= 0 ? '🟢 Thân pháp sẵn sàng lướt né' : `⏳ Cooldown né: ${btComp?.dodgeCooldown?.toFixed(1) ?? '0'}s`)}
                </div>
              </div>
            </div>
          </div>

          <!-- BAN THÁNH CHỈ NHANH CHO CƯ DÂN NÀY -->
          <div style="background: #161b22; border: 1px solid #d29922; border-radius: 8px; padding: 8px 10px; display: flex; flex-direction: column; gap: 6px;">
            <span style="font-size: 11px; color: #ffd700; font-weight: bold;">📜 Ban Thánh Chỉ Nhanh Cho Cư Dân:</span>
            <div style="display: flex; gap: 4px; flex-wrap: wrap;">
              <button class="quick-decree-btn" data-decree="breakthrough" style="background: #8957e5; border: none; color: #fff; padding: 4px 8px; border-radius: 4px; font-size: 10px; cursor: pointer; font-weight: bold;">🧘 Bế Quan Phá Cảnh</button>
              <button class="quick-decree-btn" data-decree="farm" style="background: #238636; border: none; color: #fff; padding: 4px 8px; border-radius: 4px; font-size: 10px; cursor: pointer; font-weight: bold;">🌾 Canh Tác</button>
              <button class="quick-decree-btn" data-decree="build" style="background: #d29922; border: none; color: #fff; padding: 4px 8px; border-radius: 4px; font-size: 10px; cursor: pointer; font-weight: bold;">🔨 Xây Dựng</button>
            </div>
          </div>
        </div>
      `;
    }
    // TAB 4: BIÊN NIÊN SỬ CÁ NHÂN (CHARACTER HISTORY)
    else if (this.activeEntityTab === 'history') {
      const records = historyComp ? historyComp.records : [];
      tabContentHtml = `
        <div style="display: flex; flex-direction: column; gap: 6px; max-height: 48vh; overflow-y: auto; padding-right: 4px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 11px; color: #8b949e; font-weight: bold;">Biên Niên Sử Cuộc Đời:</span>
            <span style="font-size: 10px; color: #58a6ff;">${records.length} sự kiện</span>
          </div>
          ${records.length === 0 ? `
            <div style="color: #8b949e; font-style: italic; font-size: 11px; padding: 10px 0; text-align: center;">Chưa có sự kiện nào được ghi nhận</div>
          ` : `
            ${records.map(r => `
              <div style="background: #161b22; border-left: 3px solid #58a6ff; border-radius: 0 6px 6px 0; padding: 6px 10px; font-size: 11px; display: flex; flex-direction: column; gap: 2px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <b style="color: #ffd43b;">${escapeHtml(r.title)}</b>
                  <span style="color: #79c0ff; font-size: 10px;">Tuổi ${r.age}</span>
                </div>
                <div style="color: #c9d1d9; font-size: 11px; line-height: 1.35;">${escapeHtml(r.description)}</div>
              </div>
            `).join('')}
          `}
        </div>
      `;
    }
    // TAB 4: NHÂN DUYÊN & KÝ ỨC TÂM THỨC (SOCIAL & MEMORY)
    else if (this.activeEntityTab === 'relation') {
      const relations = relComp ? relComp.getAllRelationships() : [];
      const memories = memComp ? memComp.getRecentMemories(15) : [];
      const existingEntities = new Set(this.world.query([]));

      const relationsHtml = relations.length === 0
        ? `<div style="font-size: 11px; color: #8b949e; font-style: italic; padding: 6px 0; text-align: center;">Chưa kết giao cùng ai trong chốn hồng trần...</div>`
        : relations.map(r => {
            const badge = SocialRelationshipComponent.getRelationBadge(r.relationType);
            const color = SocialRelationshipComponent.getAffinityColor(r.affinity);
            const affinityPercent = Math.round((r.affinity + 100) / 2);
            const socialView = renderSocialRelationshipDetails(this.world, entityId, r,
              existingEntities.has(r.targetEntityId), openSocialDetails.has(`${entityId}:${r.targetEntityId}`), escapeHtml);
            return `
              <div style="background: #161b22; border: 1px solid #30363d; border-radius: 6px; padding: 6px 8px; display: flex; flex-direction: column; gap: 4px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <div style="display: flex; align-items: center; gap: 5px;">
                    <span style="font-size: 11px; font-weight: bold; color: ${color}; background: ${color}15; border: 1px solid ${color}44; padding: 1px 5px; border-radius: 4px;">${badge}</span>
                    <b style="color: #f0f6fc; font-size: 12px;">${escapeHtml(r.targetName)}</b>
                  </div>
                  ${socialView.focusHtml}
                </div>
                ${socialView.statusHtml}
                <div>
                  <div style="display: flex; justify-content: space-between; font-size: 10px; margin-bottom: 2px;">
                    <span style="color: #8b949e;">Hảo Cảm: <b style="color: ${color};">${r.affinity > 0 ? '+' : ''}${r.affinity}</b></span>
                    <span style="color: #8b949e;">Tín nhiệm: <b style="color: #79c0ff;">${r.trust}%</b> • Kính trọng: <b style="color: #ffd700;">${r.respect}%</b></span>
                  </div>
                  <div style="width: 100%; height: 4px; background: #21262d; border-radius: 2px; overflow: hidden;">
                    <div style="width: ${affinityPercent}%; height: 100%; background: ${color};"></div>
                  </div>
                </div>
                ${socialView.detailsHtml}
              </div>
            `;
          }).join('');

      const memoriesHtml = memories.length === 0
        ? `<div style="font-size: 11px; color: #8b949e; font-style: italic; padding: 6px 0; text-align: center;">Tâm thức tĩnh lặng, chưa vướng bận ký ức...</div>`
        : memories.map(m => {
            const { badge, color } = MemoryComponent.getMemoryBadge(m.type);
            const stars = '⭐'.repeat(m.importance);
            return `
              <div style="background: #161b22; border-left: 3px solid ${color}; border-radius: 4px; padding: 5px 8px; display: flex; flex-direction: column; gap: 2px;">
                <div style="display: flex; justify-content: space-between; align-items: center; font-size: 10px;">
                  <span style="color: ${color}; font-weight: bold;">${badge}</span>
                  <span style="font-size:10px;color:#8b949e;">Ngày ${m.day}</span>
                  <span style="color: #ffd700; font-size: 9px;" title="Mức độ khắc sâu tâm trí: ${m.importance}/5">${stars}</span>
                </div>
                <div style="color: #e6edf3; font-size: 11px; line-height: 1.35;">${escapeHtml(m.description)}</div>
              </div>
            `;
          }).join('');

      tabContentHtml = `
        <div data-social-scroll style="display: flex; flex-direction: column; gap: 8px; max-height: 52vh; overflow-y: auto; padding-right: 4px;">
          <!-- DANH SÁCH QUAN HỆ -->
          <div>
            <div style="font-size: 11px; color: #8b949e; font-weight: bold; margin-bottom: 5px; display: flex; justify-content: space-between;">
              <span>MẠNG LƯỚI QUAN HỆ (${relations.length})</span>
            </div>
            <div style="display: flex; flex-direction: column; gap: 5px;">
              ${relationsHtml}
            </div>
          </div>

          ${renderSocialBondHistory(relComp, entityId, openSocialDetails.has(`${entityId}:history`), escapeHtml)}

          <!-- DÒNG KÝ ỨC TÂM THỨC -->
          <div style="border-top: 1px solid #30363d; padding-top: 6px;">
            <div style="font-size: 11px; color: #8b949e; font-weight: bold; margin-bottom: 5px; display: flex; justify-content: space-between;">
              <span>DÒNG KÝ ỨC TÂM THỨC (${memories.length})</span>
            </div>
            <div style="display: flex; flex-direction: column; gap: 4px;">
              ${memoriesHtml}
            </div>
          </div>
        </div>
      `;
    }

    this.container.innerHTML = `
      <!-- HEADER THÔNG TIN NHÂN VẬT -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid #30363d; padding-bottom: 8px;">
        <div>
          <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
            <h3 style="margin: 0; color: #f0f6fc; font-size: 16px;">${escapeHtml(nameComp?.name ?? 'Sinh Thể')}</h3>
            <span style="font-size: 10px; background: ${raceDef.colorTheme}22; border: 1px solid ${raceDef.colorTheme}; color: ${raceDef.colorTheme}; padding: 1px 6px; border-radius: 4px; font-weight: bold;">${escapeHtml(raceDef.name)}</span>
            ${childcareComp?.isChild ? `<span style="font-size: 10px; background: #fbbf2422; border: 1px solid #fbbf24; color: #fbbf24; padding: 1px 6px; border-radius: 4px; font-weight: bold;">👶 Hài Đồng (${lifeComp?.currentAge ?? 1}t)</span>` : ''}
          </div>
          <!-- LINH CĂN TIÊN CƠ -->
          <div style="margin-top: 4px; display: flex; align-items: center; gap: 5px;">
            <span style="font-size: 11px; color: #8b949e;">Linh Căn:</span>
            ${rootComp ? `
              <span style="font-size: 11px; font-weight: bold; color: ${rootComp.getColor()}; background: ${rootComp.getColor()}18; border: 1px solid ${rootComp.getColor()}55; padding: 1px 6px; border-radius: 4px;">
                ${escapeHtml(rootComp.getBadge())}
              </span>
            ` : '<span style="font-size: 11px; color: #6e7681;">Chưa rõ</span>'}
          </div>
          <!-- TRẠNG THÁI HOẠT ĐỘNG HIỆN TẠI -->
          <div style="margin-top: 3px; font-size: 11px; color: ${stateColor}; font-weight: 500;">
            ${stateText}
          </div>
          <div data-recent-activity style="font-size: 10px; color: #9ccce8;"></div>
          ${factionHtml}
        </div>
        <button id="close-inspector-btn" style="background: transparent; border: none; color: #8b949e; cursor: pointer; font-size: 16px;">✕</button>
      </div>

      <!-- THANH CHUYỂN TAB (6 TABS) -->
      <div style="display: grid; grid-template-columns: repeat(6, 1fr); gap: 2px; background: #161b22; padding: 3px; border-radius: 6px;">
        <button class="tab-btn" data-tab="stats" style="background: ${this.activeEntityTab === 'stats' ? '#1f6feb' : 'transparent'}; border: none; color: #fff; padding: 4px 0; border-radius: 4px; font-size: 10px; cursor: pointer; font-weight: 500;">📊 Chỉ Số</button>
        <button class="tab-btn" data-tab="equip" style="background: ${this.activeEntityTab === 'equip' ? '#1f6feb' : 'transparent'}; border: none; color: #fff; padding: 4px 0; border-radius: 4px; font-size: 10px; cursor: pointer; font-weight: 500;">⚔️ Trang Bị</button>
        <button class="tab-btn" data-tab="ai" style="background: ${this.activeEntityTab === 'ai' ? '#8957e5' : 'transparent'}; border: none; color: #fff; padding: 4px 0; border-radius: 4px; font-size: 10px; cursor: pointer; font-weight: 500;">🧠 Não AI</button>
        <button class="tab-btn" data-tab="relation" style="background: ${this.activeEntityTab === 'relation' ? '#ec4899' : 'transparent'}; border: none; color: #fff; padding: 4px 0; border-radius: 4px; font-size: 10px; cursor: pointer; font-weight: 500;">🤝 Duyên</button>
        <button class="tab-btn" data-tab="faction" style="background: ${this.activeEntityTab === 'faction' ? '#1f6feb' : 'transparent'}; border: none; color: #fff; padding: 4px 0; border-radius: 4px; font-size: 10px; cursor: pointer; font-weight: 500;">🏛️ Thế Lực</button>
        <button class="tab-btn" data-tab="history" style="background: ${this.activeEntityTab === 'history' ? '#1f6feb' : 'transparent'}; border: none; color: #fff; padding: 4px 0; border-radius: 4px; font-size: 10px; cursor: pointer; font-weight: 500;">📜 Kỷ</button>
      </div>

      <!-- NỘI DUNG CHÍNH CỦA TAB -->
      <div style="display: flex; flex-direction: column; gap: 8px;">
        ${tabContentHtml}
      </div>
    `;

    this.container.style.display = 'flex';
    this.updateRecentActivity(ActivityFeedback.getInstance().getRecent(entityId));
    document.getElementById('close-inspector-btn')?.addEventListener('click', () => this.hide());

    this.container.querySelector('#appearance-remove-armor')?.addEventListener('click',()=>{equipArmor(this.world,entityId,null);this.showEntity(entityId);});

    // Xử lý chuyển Tabs
    const tabButtons = this.container.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tab = (e.currentTarget as HTMLElement).getAttribute('data-tab') as any;
        if (tab) {
          this.activeEntityTab = tab;
          this.showEntity(entityId);
        }
      });
    });

    // Xử lý nút Ban Thánh Chỉ Nhanh từ tab Não AI
    const quickDecreeBtns = this.container.querySelectorAll('.quick-decree-btn');
    quickDecreeBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const decreeType = (e.currentTarget as HTMLElement).getAttribute('data-decree') as any;
        if (decreeType) {
          let decreeTitle = 'Thánh Chỉ Thần Linh';
          if (decreeType === 'breakthrough') decreeTitle = 'Lệnh Bế Quan Phá Cảnh';
          else if (decreeType === 'farm') decreeTitle = 'Lệnh Canh Tác Đồng Ruộng';
          else if (decreeType === 'build') decreeTitle = 'Lệnh Đại Hưng Thổ Mộc';

          EventBus.getInstance().emit('god:issue_decree', {
            entityId,
            decree: {
              decreeType,
              title: decreeTitle,
              targetPos: posComp ? { x: posComp.x, y: posComp.y } : undefined,
              issuedTime: Date.now()
            }
          });
          this.showEntity(entityId);
        }
      });
    });

    // Xử lý bấm vào Thẻ Công Pháp để mở Popup chi tiết
    document.getElementById('tech-card-btn')?.addEventListener('click', () => {
      if (techComp) {
        this.showTechniqueModal(techComp);
      }
    });

    // Xử lý bấm vào Trait Badge để mở Popup chi tiết
    const traitButtons = this.container.querySelectorAll('.trait-badge-btn');
    traitButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const traitId = (e.currentTarget as HTMLElement).getAttribute('data-trait');
        if (traitId) {
          this.showTraitModal(traitId);
        }
      });
    });

    // Xử lý nút Dùng Đan Dược trực tiếp qua PillUsageService
    const pillButtons = this.container.querySelectorAll('.use-pill-btn');
    pillButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const pillId = (e.currentTarget as HTMLElement).getAttribute('data-pill');
        if (!pillId || !invComp) return;
        const res = PillUsageService.usePill(this.world, entityId, pillId);
        if (res.success) {
          this.showEntity(entityId);
        } else if (res.reason) {
          alert(res.reason);
        }
      });
    });

    this.container.querySelectorAll<HTMLDetailsElement>('[data-social-details]').forEach(details => {
      details.addEventListener('toggle', () => {
        if (details.open && details.dataset.socialLoaded !== 'true' && this.currentInspectedEntityId === entityId) {
          this.refreshRelations();
        }
      });
    });

    // Xử lý nút Chuyển góc nhìn camera tới người trong mạng lưới quan hệ
    const focusBtns = this.container.querySelectorAll('.focus-rel-entity-btn');
    focusBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tId = parseInt((e.currentTarget as HTMLElement).getAttribute('data-ent') || '-1');
        if (tId > 0) {
          const tPos = this.world.getComponent(tId, PositionComponent);
          if (!tPos) return;
          EventBus.getInstance().emit('camera:focus_pos', { x: tPos.x, y: tPos.y });
          this.showEntity(tId);
        }
      });
    });
  }

  public showTile(tile: WorldTile, qiTile?: QiTile | null, plantEntity?: number | null): void {
    this.currentInspectedEntityId = null;
    this.inspectedTile = { tile, qiTile };
    const config = TERRAIN_CONFIGS[tile.terrain];

    let qiTierText = 'Linh Khí';
    let qiTierColor = '#38d9a9';
    if (qiTile?.tier === 'hon_don_khi') {
      qiTierText = '🌌 Hỗn Độn Khí (Cực Hiếm 0.0001%)';
      qiTierColor = '#ba68c8';
    } else if (qiTile?.tier === 'tien_khi') {
      qiTierText = '✨ Tiên Khí Thượng Giới (Hiếm 0.001%)';
      qiTierColor = '#fff176';
    }

    const elem = qiTile ? ELEMENT_CONFIGS[qiTile.dominantElement] : null;

    let plantHtml = '';
    if (plantEntity !== null && plantEntity !== undefined) {
      const plant = this.world.getComponent(plantEntity, PlantComponent);
      if (plant) {
        const def = PLANT_DEFINITIONS[plant.speciesId];
        const stageNames = ['Mầm non 🌱', 'Cây con 🌿', 'Trưởng thành 🌳', 'Đơm hoa / Đỉnh phong 🌺'];
        plantHtml = `
          <div style="margin-top: 8px; border-top: 1px solid #30363d; padding-top: 8px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="color: #ffd43b; font-weight: 600;">${def.badge} ${def.name}</span>
              <span style="font-size: 11px; color: #8b949e;">${stageNames[plant.stage]}</span>
            </div>
            <p style="margin: 4px 0 0; font-size: 11px; color: #8b949e; line-height: 1.3;">${def.description}</p>
            ${def.lifespanBonusValue ? `<div style="color: #79c0ff; font-size: 11px; margin-top: 3px;">+${def.lifespanBonusValue} năm thọ nguyên</div>` : ''}
          </div>
        `;
      }
    }

    this.container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #30363d; padding-bottom: 8px;">
        <div>
          <h3 data-tile-field="name" style="margin: 0; color: #f0f6fc; font-size: 15px;">Địa Hình: ${config.name}</h3>
          <span style="font-size: 11px; color: #8b949e;">Tọa độ (${tile.x}, ${tile.y}) ${qiTile?.isSpiritVein ? '· <b style="color:#58a6ff">💎 Linh Mạch</b>' : ''}</span>
        </div>
        <button id="close-inspector-btn" style="background: transparent; border: none; color: #8b949e; cursor: pointer; font-size: 16px;">✕</button>
      </div>

      <p data-tile-field="description" style="margin: 0; color: #8b949e; font-size: 12px; line-height: 1.5;">${config.description}</p>
      <div style="display: flex; flex-direction: column; gap: 6px;">
        <div style="display: flex; justify-content: space-between;">
          <span style="color: #8b949e;">Phẩm cấp khí:</span>
          <span style="color: ${qiTierColor}; font-weight: 600;">${qiTierText}</span>
        </div>

        <div style="display: flex; justify-content: space-between;">
          <span style="color: #8b949e;">Nồng độ linh khí:</span>
          <span data-tile-field="qi" style="color: #38d9a9; font-weight: 600;">✨ ${Math.round(qiTile?.density ?? tile.qiDensity)}</span>
        </div>

        <div style="display: flex; justify-content: space-between;">
          <span style="color: #8b949e;">Ngũ hành chủ đạo:</span>
          <span style="color: ${elem?.color ?? '#40c057'}; font-weight: 600;">${elem?.name ?? 'Mộc'}</span>
        </div>

        <div style="display: flex; justify-content: space-between;">
          <span style="color: #8b949e;">Nhiệt độ vùng:</span>
          <span data-tile-field="temperature" style="color: #ff922b; font-weight: 600;">${tile.temperature.toFixed(1)}°C</span>
        </div>

        <div style="display: flex; justify-content: space-between;">
          <span style="color: #8b949e;">Độ ẩm đất đai:</span>
          <span data-tile-field="moisture" style="color: #74c0fc;">${Math.round(tile.moisture * 100)}%</span>
        </div>

        <div style="display: flex; justify-content: space-between;">
          <span style="color: #8b949e;">Độ cao:</span>
          <span data-tile-field="elevation" style="color: #a5d8ff; font-weight: 600;">${Math.round(tile.elevation * 100)}% (${ELEVATION_BAND_NAMES[getElevationBand(tile.elevation)]})</span>
        </div>

        <div style="display: flex; justify-content: space-between;">
          <span style="color: #8b949e;">Tốc độ theo loại đất:</span>
          <span data-tile-field="movement">${Math.round(config.moveSpeedModifier * 100)}%</span>
        </div>

        <div style="display: flex; justify-content: space-between;">
          <span style="color: #8b949e;">Sinh trưởng nền:</span>
          <span data-tile-field="growth-base" style="color: #98c379;"></span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="color: #8b949e;">Sinh trưởng hiện tại:</span>
          <span data-tile-field="growth-current" style="color: #98c379;"></span>
        </div>
        <p data-tile-field="growth-note" style="margin: 0; font-size: 11px; color: #8b949e; line-height: 1.5;"></p>
        <p style="margin: 0; font-size: 11px; color: #8b949e; line-height: 1.5;">Cao độ tương đối 0–100%. Tốc độ thực tế còn phụ thuộc độ dốc; chênh lệch cao độ trên 20 điểm % giữa hai ô chặn bước di chuyển trên đất.</p>
        ${plantHtml}
      </div>
    `;

    this.container.style.display = 'flex';
    document.getElementById('close-inspector-btn')?.addEventListener('click', () => this.hide());
    this.refreshTile();
  }

  public showChest(chestId: number): void {
    const chest = this.world.getComponent(chestId, TreasureChestComponent);
    const pos = this.world.getComponent(chestId, PositionComponent);
    if (!chest || !pos) { this.hide(); return; }
    const contents = chest.opened
      ? chest.loot.map(item => `${escapeHtml(PILL_DEFINITIONS[item.pillId]?.name ?? item.pillId)} ×${item.count}`).join(', ')
      : 'Chưa biết (1–2 vật phẩm)';
    this.container.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <b>🎁 ${chest.opened ? 'Rương đã mở' : 'Rương kho báu'}</b>
        <button id="close-inspector-btn">✕</button>
      </div>
      <div style="font-size:12px;color:#ced4da;">${contents}</div>
      ${chest.opened ? '' : '<button id="open-chest-btn">Mở bằng cư dân ở gần</button>'}
      <div id="chest-result" style="font-size:11px;color:#ffd43b;"></div>
    `;
    this.container.style.display = 'flex';
    document.getElementById('close-inspector-btn')?.addEventListener('click', () => this.hide());
    document.getElementById('open-chest-btn')?.addEventListener('click', () => {
      let nearest: number | null = null;
      let distance = 24;
      for (const id of this.world.query([PositionComponent, HealthComponent])) {
        const hp = this.world.getComponent(id, HealthComponent)!;
        if (hp.isDead || hp.current <= 0 || this.world.getComponent(id, AnimalComponent)) continue;
        const actor = this.world.getComponent(id, PositionComponent)!;
        const d = Math.hypot(actor.x - pos.x, actor.y - pos.y);
        if (d < distance) { distance = d; nearest = id; }
      }
      const result = nearest !== null
        ? openTreasureChest(this.world, chestId, nearest)
        : { success: false, reason: 'Cần có cư dân sống đứng gần rương' };
      if (result.success) this.showChest(chestId);
      else {
        const message = document.getElementById('chest-result');
        if (message) message.textContent = result.reason;
      }
    });
  }

  public showBuilding(buildingEntity: number): void {
    const bComp = this.world.getComponent(buildingEntity, BuildingComponent);
    if (!bComp) {
      this.hide();
      return;
    }

    const def = BUILDING_DEFINITIONS[bComp.buildingType];
    const fEnt = bComp.factionId ? FactionFactory.findFactionEntity(this.world, bComp.factionId) : null;
    let fComp: FactionComponent | null = null;
    if (fEnt !== null) {
      fComp = this.world.getComponent(fEnt, FactionComponent) ?? null;
    }

    const sEnt = bComp.settlementId ? FactionFactory.findSettlementEntity(this.world, bComp.settlementId) : null;
    const sComp = sEnt !== null ? (this.world.getComponent(sEnt, SettlementComponent) ?? null) : null;

    const hpPercent = Math.min(100, Math.round((bComp.currentDurability / bComp.maxDurability) * 100));

    let occupantName = 'Trống (chưa có tu sĩ bế quan)';
    if (bComp.occupantEntityId !== null) {
      const oName = this.world.getComponent(bComp.occupantEntityId, NameComponent);
      if (oName) occupantName = `🧘 ${escapeHtml(oName.name)} (Đang bế quan)`;
    }

    let leaderDisplay = 'Khuyết danh';
    let founderDisplay = 'Cổ nhân';
    if (fComp) {
      if (fComp.leaderEntityId !== null) {
        const lName = this.world.getComponent(fComp.leaderEntityId, NameComponent)?.name ?? `#${fComp.leaderEntityId}`;
        leaderDisplay = `${escapeHtml(lName)} (${escapeHtml(fComp.getLeaderTitle())})`;
      }
      if (fComp.founderEntityId !== null) {
        founderDisplay = escapeHtml(this.world.getComponent(fComp.founderEntityId, NameComponent)?.name ?? `#${fComp.founderEntityId}`);
      }
    }

    let progressionHtml = '';
    if (fComp) {
      if (fComp.type === 'hamlet') {
        const cfg = FACTION_PROGRESSION_CONFIG.hamletToVillage;
        progressionHtml = `
          <div style="font-size: 11px; color: #9ca3af; background: #0d1117; border: 1px solid #21262d; border-radius: 6px; padding: 6px 8px;">
            <b style="color: #fbbf24;">📈 Tiến trình lên Làng Tụ:</b>
            <div>• Cư dân: ${fComp.memberIds.length}/${cfg.minResidents} | Lương thực: ${Math.floor(fComp.foodStock)}/${cfg.minFoodStock}</div>
            <div>• Ổn định: ${Math.floor(fComp.stageStableDays)}/${cfg.requiredStableDays} ngày (Độ ổn định ≥ ${cfg.minStability})</div>
          </div>
        `;
      } else if (fComp.type === 'village') {
        const cfg = FACTION_PROGRESSION_CONFIG.villageToKingdom;
        progressionHtml = `
          <div style="font-size: 11px; color: #9ca3af; background: #0d1117; border: 1px solid #21262d; border-radius: 6px; padding: 6px 8px;">
            <b style="color: #fbbf24;">👑 Tiến trình lập Vương Quốc:</b>
            <div>• Thôn làng trực thuộc: ${fComp.settlementIds.length}/${cfg.minSettlements} | Tổng dân: ${fComp.memberIds.length}/${cfg.minTotalPopulation}</div>
            <div>• Lương thực: ${Math.floor(fComp.foodStock)}/${cfg.minFoodStock} | Ngân khố: ${Math.floor(fComp.treasury)}/${cfg.minTreasury}</div>
          </div>
        `;
      } else if (fComp.type === 'sect') {
        const cfg = FACTION_PROGRESSION_CONFIG.sectToHolyLand;
        progressionHtml = `
          <div style="font-size: 11px; color: #9ca3af; background: #0d1117; border: 1px solid #21262d; border-radius: 6px; padding: 6px 8px;">
            <b style="color: #c084fc;">🏔️ Tiến trình thăng Thánh Địa:</b>
            <div>• Môn đồ: ${fComp.memberIds.length}/${cfg.minMembers} | Linh thạch: ${Math.floor(fComp.spiritStones)}/${cfg.minSpiritStones}</div>
            <div>• Ổn định liên tục: ${Math.floor(fComp.stageStableDays)}/${cfg.requiredStableDays} ngày (cần Đại Trận + Linh Mạch)</div>
          </div>
        `;
      }
    }

    const isRuins = bComp.isRuins || !fComp;
    const siteComp = bComp.isUnderConstruction ? (this.world.getComponent(buildingEntity, ConstructionSiteComponent) ?? null) : null;
    const isUnderConstruction = bComp.isUnderConstruction && siteComp !== null;

    this.container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #30363d; padding-bottom: 8px;">
        <div>
          <h3 style="margin: 0; color: #f0f6fc; font-size: 16px;">${isRuins ? '🏚️' : isUnderConstruction ? '🔨' : def.badge} ${escapeHtml(bComp.name)}</h3>
          <span style="font-size: 11px; color: ${isRuins ? '#f87171' : isUnderConstruction ? '#f59f00' : '#ffd700'}; font-weight: 600;">
            ${isRuins ? 'Phế Tích Vô Chủ' : isUnderConstruction ? `Đang Thi Công (${Math.floor(siteComp.progressRatio * 100)}%) • Cần ${def.constructionDays} ngày` : `Cấp ${bComp.level} • ${escapeHtml(def.costDescription)}`}
          </span>
        </div>
        <button id="close-inspector-btn" style="background: transparent; border: none; color: #8b949e; cursor: pointer; font-size: 16px;">✕</button>
      </div>

      <div style="display: flex; flex-direction: column; gap: 8px;">
        ${isUnderConstruction ? `
          <div style="background: rgba(245, 159, 0, 0.08); border: 1px solid #f59f00; border-radius: 6px; padding: 8px 10px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
              <span style="color: #f59f00; font-weight: bold; font-size: 12px;">🔨 CÔNG TRƯỜNG THI CÔNG</span>
              <span style="color: #ffec99; font-weight: bold; font-size: 12px;">${Math.floor(siteComp.progressRatio * 100)}%</span>
            </div>
            <div style="width: 100%; height: 6px; background: #21262d; border-radius: 3px; overflow: hidden; margin-bottom: 6px;">
              <div style="width: ${Math.min(100, Math.floor(siteComp.progressRatio * 100))}%; height: 100%; background: #f59f00;"></div>
            </div>
            <div style="font-size: 11px; color: #d0d7de; display: flex; justify-content: space-between;">
              <span>Đã tích lũy: ${Math.floor(siteComp.completedWorkTicks)} / ${siteComp.requiredWorkTicks} ticks</span>
              <span>Dự kiến còn: ~${siteComp.remainingDays} ngày</span>
            </div>
          </div>
        ` : ''}
        <div style="display: flex; justify-content: space-between;">
          <span style="color: #8b949e;">Trực thuộc:</span>
          <span style="color: ${fComp?.color ?? '#8b949e'}; font-weight: bold;">${fComp ? `${escapeHtml(fComp.name)} [${escapeHtml(fComp.getRankName())}]` : '🏚️ Phế Tích Vô Chủ'}</span>
        </div>

        ${sComp ? `
          <div style="display: flex; justify-content: space-between; font-size: 12px;">
            <span style="color: #8b949e;">Địa điểm định cư:</span>
            <span style="color: #7ee787; font-weight: 600;">🏘️ ${escapeHtml(sComp.name)} (${sComp.residentIds.size} cư dân)</span>
          </div>
        ` : ''}

        ${(def.housingCapacity ?? 0) > 0 ? `
          <div style="display: flex; justify-content: space-between; font-size: 12px;">
            <span style="color: #8b949e;">Chỗ ở:</span>
            <span style="color: #7ee787;">${FactionFactory.getHomeOccupancy(this.world, buildingEntity).occupied} / ${FactionFactory.getHomeOccupancy(this.world, buildingEntity).capacity}</span>
          </div>
        ` : ''}

        ${fComp ? `
          <div style="display: flex; justify-content: space-between; font-size: 12px;">
            <span style="color: #8b949e;">Người đứng đầu:</span>
            <span style="color: #ffd43b; font-weight: 600;">${leaderDisplay}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 11px;">
            <span style="color: #8b949e;">Tổ sáng lập / Quy mô:</span>
            <span>${founderDisplay} • <b>${fComp.memberIds.length}</b> thành viên • Ổn định: <b>${Math.round(fComp.stability)}</b>/100</span>
          </div>
        ` : ''}

        <div style="display: flex; justify-content: space-between;">
          <span style="color: #8b949e;">Đạo nghĩa:</span>
          <span>${fComp ? fComp.getAlignmentBadge() : 'Vô Chủ'}</span>
        </div>

        <div>
          <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 3px;">
            <span>Độ kiên cố:</span>
            <span>${bComp.currentDurability} / ${bComp.maxDurability} (${hpPercent}%)</span>
          </div>
          <div style="width: 100%; height: 6px; background: #21262d; border-radius: 3px; overflow: hidden;">
            <div style="width: ${hpPercent}%; height: 100%; background: ${hpPercent > 50 ? '#38d9a9' : '#ff6b6b'};"></div>
          </div>
        </div>

        ${bComp.buildingType === 'meditation_cave' ? `
          <div style="background: #161b22; border: 1px solid #30363d; border-radius: 6px; padding: 6px 10px;">
            <span style="color: #8b949e; font-size: 11px;">Trạng thái bế quan:</span>
            <div style="font-size: 12px; color: #38d9a9; margin-top: 2px;">${occupantName}</div>
          </div>
        ` : ''}

        <!-- KHO TÀI NGUYÊN THẾ LỰC -->
        ${fComp ? `
          <div style="background: #161b22; border: 1px solid #30363d; border-radius: 6px; padding: 6px 10px; display: flex; flex-direction: column; gap: 4px;">
            <span style="color: #8b949e; font-size: 11px;">Kho tàng tích trữ (${isCivilFactionType(fComp.type) ? 'Thế Lực Dân Sinh' : 'Môn Phái Tu Luyện'}):</span>
            <div style="display: flex; justify-content: space-around; font-size: 12px;">
              <span>🌾 <b>${Math.floor(fComp.foodStock)}</b> Lương</span>
              <span>🪵 <b>${Math.floor(fComp.woodStock)}</b> Gỗ</span>
              <span>🪨 <b>${Math.floor(fComp.stoneStock)}</b> Đá</span>
              <span>🪙 <b>${Math.floor(fComp.treasury)}</b> Ngân Khố</span>
            </div>
            <div style="display: flex; justify-content: space-around; font-size: 12px; border-top: 1px solid #21262d; padding-top: 4px;">
              <span>🌿 <b>${fComp.herbStock}</b> Thảo Dược</span>
              <span>💊 <b>${fComp.pillStock}</b> Tiên Đan</span>
              <span>💎 <b>${fComp.spiritStones}</b> Linh Thạch</span>
            </div>
            ${renderProfessionStock(this.world, fComp.factionId)}
          </div>
        ` : ''}

        ${progressionHtml}

        <div style="font-size: 11px; color: #8b949e; line-height: 1.4; background: #0d1117; border-radius: 4px; padding: 6px 8px;">
          <div style="color: #7ee787; font-weight: 500; margin-bottom: 2px;">✨ Công năng: ${def.effectDescription}</div>
          <div>${def.description}</div>
        </div>

        <button id="repair-bld-btn" style="background: #238636; border: none; color: #fff; border-radius: 6px; padding: 6px; font-weight: 600; cursor: pointer; font-size: 11px;">
          🔨 Gia Cố & Tu Bổ Kiến Trúc (+100 Độ Bền)
        </button>
      </div>
    `;

    this.container.style.display = 'flex';
    document.getElementById('close-inspector-btn')?.addEventListener('click', () => this.hide());
    document.getElementById('repair-bld-btn')?.addEventListener('click', () => {
      bComp.currentDurability = Math.min(bComp.maxDurability, bComp.currentDurability + 100);
      this.showBuilding(buildingEntity);
    });
  }

  public refreshTile(): void {
    if (!this.inspectedTile || this.container.style.display === 'none' ||
        !this.container.querySelector('[data-tile-field="name"]')) return;
    const { tile, qiTile } = this.inspectedTile;
    const config = TERRAIN_CONFIGS[tile.terrain];
    const isWater = tile.terrain === TerrainType.RIVER || tile.terrain === TerrainType.LAKE || tile.terrain === TerrainType.OCEAN;
    const fields: Record<string, string> = {
      name: `Địa Hình: ${config.name}`,
      description: config.description,
      qi: `✨ ${Math.round(qiTile?.density ?? tile.qiDensity)}`,
      temperature: `${tile.temperature.toFixed(1)}°C`,
      moisture: `${Math.round(tile.moisture * 100)}%`,
      elevation: `${Math.round(tile.elevation * 100)}% (${ELEVATION_BAND_NAMES[getElevationBand(tile.elevation)]})`,
      movement: `${Math.round(config.moveSpeedModifier * 100)}%`,
      'growth-base': isWater ? 'Không trồng được' : `×${calculatePlantGrowth(tile.terrain, tile.moisture).toFixed(2)}`,
      'growth-current': isWater ? 'Không trồng được' : `×${calculateEnvironmentalPlantGrowth(tile.terrain, tile.moisture, tile.temperature).toFixed(2)}`,
      'growth-note': isWater ? 'Cây trên cạn không sống trên sông, hồ và biển.'
        : `Hệ số hiện tại gồm loại đất, độ ẩm và nhiệt độ; ×1 là tốc độ chuẩn của từng loài. ${tile.temperature < 0 ? 'Đóng băng: cây lớn chậm.' : ''} ${tile.moisture < 0.15 ? 'Đất khô: cây lớn chậm.' : ''}`,
    };
    for (const element of this.container.querySelectorAll<HTMLElement>('[data-tile-field]')) {
      const value = fields[element.dataset.tileField!];
      if (value !== undefined && element.textContent !== value) element.textContent = value;
    }
  }

  public refreshRelations(): void {
    const entity = this.currentInspectedEntityId;
    if (entity === null || this.activeEntityTab !== 'relation' || this.container.style.display === 'none' ||
        !this.container.querySelector('[data-social-scroll]')) return;
    const scroll = this.container.querySelector<HTMLElement>('[data-social-scroll]')?.scrollTop ?? 0;
    const outerScroll = this.container.scrollTop;
    this.showEntity(entity);
    const panel = this.container.querySelector<HTMLElement>('[data-social-scroll]');
    if (panel) panel.scrollTop = scroll;
    this.container.scrollTop = outerScroll;
  }

  public hide(): void {
    this.inspectedTile = null;
    this.currentInspectedEntityId = null;
    this.container.style.display = 'none';
  }
}
