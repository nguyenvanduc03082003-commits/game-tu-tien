import type { System } from '../../ecs/System.ts';
import { ECSWorld } from '../../ecs/World.ts';
import { EventBus } from '../../core/EventBus.ts';
import {
  DIFFICULTY_FACTOR_BOUNDS,
  EXPERIENCE_TEMPLATES,
  EXPERIENCE_XP_CAPS,
  GROWTH_BUCKET_WINDOW_DAYS,
  GROWTH_EVENT_RULES,
  MAX_EVENT_AGE_DAYS,
  MAX_EXPERIENCES,
  MAX_FAMILY_KEYS_PER_DAY,
  MAX_GROWTH_XP,
  MAX_RECENT_EVENT_IDS,
  MAX_RECENT_GAINS,
  MAX_STORED_DAY_BUCKETS,
  MIN_ACTIVE_GROWTH_AGE,
  NOVELTY_FACTORS,
  ROUTINE_XP_CAPS,
} from '../../config/mental-growth.config.ts';
import {
  HealthComponent,
  LifespanComponent,
  RaceComponent,
  RealmComponent,
} from '../beings/BeingComponents.ts';
import {
  ExperienceRecord,
  GrowthDayBucket,
  GrowthFamilyDayBucket,
  GrowthMindComponent,
  TalentProfileComponent,
} from './TalentComponents.ts';
import { clampFinite, xpForScore } from './PotentialCalculator.ts';
import {
  getMindTrainingFactor,
  getWillTrainingFactor,
  resolveEntityTraitEffects,
} from '../traits/TraitEffectResolver.ts';
import { rebuildEntityStats } from '../traits/DerivedStatsService.ts';
import {
  evolveTrait,
  getProfessionAggregateCounter,
  grantTrait,
} from '../traits/TraitService.ts';
import { TraitsComponent } from '../beings/BeingComponents.ts';
import { GROWTH_EVENT_CHANNEL, GrowthEvent } from './GrowthEvents.ts';

export interface GrowthProcessResult {
  accepted: boolean;
  reason?: string;
  willAwarded: number;
  mindAwarded: number;
  experienceCreatedId?: string;
}

export function isEntityEligibleForGrowth(world: ECSWorld, entityId: number): boolean {
  const hp = world.getComponent(entityId, HealthComponent);
  if (!hp || hp.isDead || hp.current <= 0) return false;

  const growth = world.getComponent(entityId, GrowthMindComponent);
  const profile = world.getComponent(entityId, TalentProfileComponent);
  if (!growth || !profile) return false;

  const raceComp = world.getComponent(entityId, RaceComponent);
  const raceId = raceComp?.raceId ?? 'human';

  if (raceId === 'beast') {
    const realm = world.getComponent(entityId, RealmComponent);
    return Boolean(realm && realm.stageIndex >= 1);
  }

  const life = world.getComponent(entityId, LifespanComponent);
  if (!life) return true;
  return life.currentAge >= MIN_ACTIVE_GROWTH_AGE;
}

export function calculateRemainingExperiencePressure(
  exp: ExperienceRecord,
  currentDay: number
): number {
  const elapsed = Math.max(0, currentDay - exp.createdDay);
  const hl = Math.max(1, exp.halfLifeDays);
  return exp.emotion * Math.pow(2, -elapsed / hl);
}

/**
 * Loại bỏ 1 ExperienceRecord khi mảng đạt trần 24 bản ghi theo đúng mục 11.2:
 * - Bỏ bản đã resolved có áp lực còn lại nhỏ nhất trước.
 * - Sau đó mới xét bản chưa resolved có severity thấp nhất.
 * - Hòa thì bỏ bản cũ hơn (createdDay nhỏ hơn) rồi ID từ điển.
 * - Tuyệt đối không loại experience đang có lockedByStep = true.
 */
export function evictExperienceIfNeeded(
  growth: GrowthMindComponent,
  currentDay: number
): boolean {
  if (growth.experiences.length < MAX_EXPERIENCES) return true;

  const candidates = growth.experiences.filter(e => !e.lockedByStep);
  if (candidates.length === 0) {
    return false;
  }

  candidates.sort((a, b) => {
    const resA = a.resolvedAtDay !== undefined || (a.growthAwarded && a.requiredReflectionDays === 0);
    const resB = b.resolvedAtDay !== undefined || (b.growthAwarded && b.requiredReflectionDays === 0);
    if (resA !== resB) {
      return resA ? -1 : 1;
    }
    if (resA && resB) {
      const pA = Math.abs(calculateRemainingExperiencePressure(a, currentDay));
      const pB = Math.abs(calculateRemainingExperiencePressure(b, currentDay));
      if (Math.abs(pA - pB) > 1e-9) {
        return pA - pB;
      }
    } else {
      if (a.severity !== b.severity) {
        return a.severity - b.severity;
      }
    }
    if (a.createdDay !== b.createdDay) {
      return a.createdDay - b.createdDay;
    }
    return a.id.localeCompare(b.id);
  });

  const targetId = candidates[0].id;
  const idx = growth.experiences.findIndex(e => e.id === targetId);
  if (idx !== -1) {
    growth.experiences.splice(idx, 1);
  }
  return true;
}

export class GrowthSystem implements System {
  public name = 'GrowthSystem';
  public enabled = true;
  public priority = 90;

  private boundWorld: ECSWorld | null = null;
  private queue: GrowthEvent[] = [];
  private unsubscribe: (() => void) | null = null;

  constructor(world?: ECSWorld) {
    if (world) {
      this.boundWorld = world;
    }
    this.subscribeEventBus();
  }

  private subscribeEventBus(): void {
    if (this.unsubscribe) return;
    this.unsubscribe = EventBus.getInstance().on<GrowthEvent>(
      GROWTH_EVENT_CHANNEL,
      (ev: GrowthEvent) => {
        this.enqueue(ev);
      }
    );
  }

  public bindWorld(world: ECSWorld): void {
    this.boundWorld = world;
  }

  public getPendingCount(): number {
    return this.queue.length;
  }

  public enqueue(event: GrowthEvent): boolean {
    if (!event || !event.world) return false;
    if (this.boundWorld && event.world !== this.boundWorld) {
      return false;
    }
    this.queue.push(event);
    return true;
  }

  public reset(newWorld?: ECSWorld): void {
    this.queue = [];
    if (newWorld) {
      this.boundWorld = newWorld;
    }
  }

  public destroy(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    this.queue = [];
    this.boundWorld = null;
  }

  public update(world: ECSWorld, _dt: number): void {
    if (!this.boundWorld) {
      this.boundWorld = world;
    } else if (this.boundWorld !== world) {
      return;
    }

    if (this.queue.length === 0) return;

    const batch = this.queue.splice(0, this.queue.length);
    batch.sort((a, b) => {
      if (a.tick !== b.tick) return a.tick - b.tick;
      return a.eventId.localeCompare(b.eventId);
    });

    for (const ev of batch) {
      this.processEvent(world, ev);
    }
  }

  private pruneAndGetDayBucket(
    growth: GrowthMindComponent,
    eventDay: number
  ): GrowthDayBucket {
    const minDay = eventDay - (GROWTH_BUCKET_WINDOW_DAYS - 1);
    growth.dailyBuckets = growth.dailyBuckets.filter(b => b.day >= minDay - 1);
    if (growth.dailyBuckets.length > MAX_STORED_DAY_BUCKETS) {
      growth.dailyBuckets.sort((a, b) => a.day - b.day);
      growth.dailyBuckets = growth.dailyBuckets.slice(
        growth.dailyBuckets.length - MAX_STORED_DAY_BUCKETS
      );
    }

    let bucket = growth.dailyBuckets.find(b => b.day === eventDay);
    if (!bucket) {
      bucket = {
        day: eventDay,
        routineWill: 0,
        routineMind: 0,
        experienceWill: 0,
        experienceMind: 0,
      };
      growth.dailyBuckets.push(bucket);
    }
    return bucket;
  }

  private pruneAndGetFamilyBucket(
    growth: GrowthMindComponent,
    eventDay: number
  ): GrowthFamilyDayBucket {
    const minDay = eventDay - (GROWTH_BUCKET_WINDOW_DAYS - 1);
    growth.familyDayBuckets = growth.familyDayBuckets.filter(b => b.day >= minDay - 1);
    if (growth.familyDayBuckets.length > MAX_STORED_DAY_BUCKETS) {
      growth.familyDayBuckets.sort((a, b) => a.day - b.day);
      growth.familyDayBuckets = growth.familyDayBuckets.slice(
        growth.familyDayBuckets.length - MAX_STORED_DAY_BUCKETS
      );
    }

    let bucket = growth.familyDayBuckets.find(b => b.day === eventDay);
    if (!bucket) {
      bucket = {
        day: eventDay,
        counts: {},
      };
      growth.familyDayBuckets.push(bucket);
    }
    return bucket;
  }

  private countPriorFamilyOccurrences(
    growth: GrowthMindComponent,
    familyKey: string,
    eventDay: number
  ): number {
    const minDay = eventDay - (GROWTH_BUCKET_WINDOW_DAYS - 1);
    let total = 0;
    for (const b of growth.familyDayBuckets) {
      if (b.day >= minDay && b.day <= eventDay) {
        total += b.counts[familyKey] ?? 0;
      }
    }
    return total;
  }

  private recordFamilyOccurrence(
    growth: GrowthMindComponent,
    familyKey: string,
    eventDay: number
  ): void {
    const bucket = this.pruneAndGetFamilyBucket(growth, eventDay);
    if (
      bucket.counts[familyKey] === undefined &&
      Object.keys(bucket.counts).length >= MAX_FAMILY_KEYS_PER_DAY
    ) {
      return;
    }
    bucket.counts[familyKey] = (bucket.counts[familyKey] ?? 0) + 1;
  }

  private createExperienceForEvent(
    growth: GrowthMindComponent,
    event: GrowthEvent,
    eventDay: number
  ): string | undefined {
    let templateKey: keyof typeof EXPERIENCE_TEMPLATES | null = null;
    let alreadyResolved = false;

    if (event.kind === 'breakthrough_failed') {
      templateKey = 'breakthrough_setback';
    } else if (event.kind === 'encounter_survived') {
      templateKey = 'danger_survived';
    } else if (event.kind === 'bereavement') {
      templateKey =
        event.evidence.bereavementTier === 'close_kin'
          ? 'bereavement_close_kin'
          : 'bereavement_friend';
    } else if (event.kind === 'tribulation_passed') {
      templateKey = 'major_achievement';
      alreadyResolved = true;
    }

    if (!templateKey) return undefined;

    const expId = event.evidence.experienceId ?? `exp:${event.eventId}`;
    if (
      growth.experiences.some(
        e => e.id === expId || e.eventId === event.eventId
      )
    ) {
      return expId;
    }

    // Nếu các biến cố nhỏ cùng loại trong cùng ngày lặp lại, gộp áp lực để tránh tạo rác nhưng không xóa cooldown
    if (
      (templateKey === 'breakthrough_setback' || templateKey === 'danger_survived') &&
      growth.experiences.length >= MAX_EXPERIENCES
    ) {
      const sameDayExisting = growth.experiences.find(
        e =>
          e.kind === EXPERIENCE_TEMPLATES[templateKey!].kind &&
          e.createdDay === eventDay &&
          !e.growthAwarded
      );
      if (sameDayExisting) {
        const tpl = EXPERIENCE_TEMPLATES[templateKey];
        sameDayExisting.emotion = clampFinite(
          sameDayExisting.emotion + tpl.initialEmotion * 0.5,
          -60,
          30,
          sameDayExisting.emotion
        );
        return sameDayExisting.id;
      }
    }

    if (!evictExperienceIfNeeded(growth, eventDay)) {
      return undefined;
    }

    const tpl = EXPERIENCE_TEMPLATES[templateKey];
    const record: ExperienceRecord = {
      id: expId,
      eventId: event.eventId,
      kind: tpl.kind,
      templateId: templateKey,
      createdDay: eventDay,
      severity: tpl.severity,
      emotion: tpl.initialEmotion,
      halfLifeDays: tpl.halfLifeDays,
      reflectionDays: 0,
      requiredReflectionDays: tpl.requiredReflectionDays,
      readyForReflectionAtDay: eventDay + tpl.readyOffsetDays,
      growthAwarded: alreadyResolved,
      resolvedAtDay: alreadyResolved ? eventDay : undefined,
      lockedByStep: false,
      reason: event.evidence.reasonText,
    };
    growth.experiences.push(record);
    return expId;
  }

  public processEvent(world: ECSWorld, event: GrowthEvent): GrowthProcessResult {
    if (!event || event.world !== world) {
      return { accepted: false, reason: 'wrong_world', willAwarded: 0, mindAwarded: 0 };
    }
    if (this.boundWorld && this.boundWorld !== world) {
      return { accepted: false, reason: 'wrong_world', willAwarded: 0, mindAwarded: 0 };
    }

    const rule = GROWTH_EVENT_RULES[event.kind];
    if (!rule) {
      return { accepted: false, reason: 'unknown_kind', willAwarded: 0, mindAwarded: 0 };
    }

    if (
      typeof event.eventId !== 'string' ||
      event.eventId.length === 0 ||
      typeof event.familyKey !== 'string' ||
      event.familyKey.length === 0 ||
      !Number.isFinite(event.tick) ||
      !Number.isFinite(event.difficulty)
    ) {
      return { accepted: false, reason: 'invalid_payload', willAwarded: 0, mindAwarded: 0 };
    }

    if (!isEntityEligibleForGrowth(world, event.entityId)) {
      return { accepted: false, reason: 'ineligible_entity', willAwarded: 0, mindAwarded: 0 };
    }

    const growth = world.getComponent(event.entityId, GrowthMindComponent)!;
    const profile = world.getComponent(event.entityId, TalentProfileComponent)!;

    const eventDay = Math.max(0, world.calendarDayFloorAtTick(event.tick));
    const currentDay = Math.max(eventDay, world.calendarDayFloorAtTick(growth.lastIntegratedTick));

    if (currentDay - eventDay > MAX_EVENT_AGE_DAYS) {
      return { accepted: false, reason: 'stale_event', willAwarded: 0, mindAwarded: 0 };
    }

    // 1. Chống trùng eventId
    if (growth.recentEventIds.some(e => e.id === event.eventId)) {
      return { accepted: false, reason: 'duplicate_event_id', willAwarded: 0, mindAwarded: 0 };
    }

    // 2. Chống trùng milestoneKey
    if (rule.requiresMilestoneKey && !event.milestoneKey) {
      return { accepted: false, reason: 'missing_milestone_key', willAwarded: 0, mindAwarded: 0 };
    }
    if (event.milestoneKey && growth.claimedMilestones.includes(event.milestoneKey)) {
      return { accepted: false, reason: 'milestone_already_claimed', willAwarded: 0, mindAwarded: 0 };
    }

    // 3. Kiểm tra bằng chứng hành động thật theo mục 10.5
    if (event.kind === 'work_completed') {
      const hasOutput = (event.evidence.actualOutput ?? 0) > 0;
      const hasTaskKey =
        Boolean(event.evidence.taskId) ||
        (event.evidence.planRevision !== undefined && event.evidence.stepIndex !== undefined);
      if (!hasOutput || !hasTaskKey) {
        return { accepted: false, reason: 'insufficient_work_evidence', willAwarded: 0, mindAwarded: 0 };
      }
    } else if (event.kind === 'meditation_completed') {
      if ((event.evidence.durationTicks ?? 0) < 20) {
        return { accepted: false, reason: 'insufficient_meditation_duration', willAwarded: 0, mindAwarded: 0 };
      }
    } else if (event.kind === 'encounter_survived') {
      if (!event.evidence.encounterId || event.difficulty <= 0) {
        return { accepted: false, reason: 'insufficient_encounter_evidence', willAwarded: 0, mindAwarded: 0 };
      }
    } else if (event.kind === 'responsibility_completed') {
      if (!event.evidence.taskId || (event.evidence.actualOutput ?? 0) <= 0) {
        return { accepted: false, reason: 'insufficient_responsibility_evidence', willAwarded: 0, mindAwarded: 0 };
      }
    }

    let targetExperience: ExperienceRecord | undefined;
    if (event.kind === 'reflection_completed') {
      if (!event.evidence.experienceId) {
        return { accepted: false, reason: 'missing_experience_id', willAwarded: 0, mindAwarded: 0 };
      }
      targetExperience = growth.experiences.find(e => e.id === event.evidence.experienceId);
      if (!targetExperience || targetExperience.growthAwarded) {
        return { accepted: false, reason: 'experience_already_awarded_or_missing', willAwarded: 0, mindAwarded: 0 };
      }
    }

    // 4. Kiểm tra cooldown
    let baseWillXp = rule.baseWillXp;
    let baseMindXp = rule.baseMindXp;
    let cooldownDays = rule.cooldownDays;
    let cooldownKey = event.familyKey;
    let usesNovelty = rule.usesNovelty;

    if (event.kind === 'reflection_completed' && targetExperience) {
      if (targetExperience.kind === 'bereavement') {
        baseWillXp = 3;
        baseMindXp = 10;
        cooldownDays = 0;
        cooldownKey = `reflect:bereavement:${targetExperience.id}`;
        usesNovelty = false;
      } else {
        baseWillXp = 4;
        baseMindXp = 6;
        cooldownDays = 30;
        cooldownKey = `reflect:${targetExperience.kind}`;
        usesNovelty = true;
      }
    }

    const cdUntil = growth.cooldownUntilDay[cooldownKey];
    if (cooldownDays > 0 && cdUntil !== undefined && eventDay < cdUntil) {
      return { accepted: false, reason: 'on_cooldown', willAwarded: 0, mindAwarded: 0 };
    }

    // 5. Tính noveltyFactor từ familyDayBuckets trong [eventDay - 29, eventDay] trước khi ghi event mới
    const priorCount = this.countPriorFamilyOccurrences(growth, event.familyKey, eventDay);
    const noveltyFactor = usesNovelty
      ? NOVELTY_FACTORS[Math.min(priorCount, NOVELTY_FACTORS.length - 1)]
      : 1.0;

    // 6. Ghi nhận sự kiện hợp lệ vào recentEventIds, claimedMilestones, familyDayBuckets, cooldown
    growth.recentEventIds.push({ id: event.eventId, day: eventDay });
    if (growth.recentEventIds.length > MAX_RECENT_EVENT_IDS) {
      growth.recentEventIds.splice(0, growth.recentEventIds.length - MAX_RECENT_EVENT_IDS);
    }

    if (event.milestoneKey) {
      growth.claimedMilestones.push(event.milestoneKey);
    }

    this.recordFamilyOccurrence(growth, event.familyKey, eventDay);

    if (cooldownDays > 0) {
      growth.cooldownUntilDay[cooldownKey] = eventDay + cooldownDays;
    }

    // 7. Cập nhật counter nghề và kiểm tra thành tựu hậu thiên (mục 8.3 & 8.4)
    const inferredProfessionDomain =
      event.evidence.professionDomain ??
      (event.familyKey.startsWith('work:')
        ? event.familyKey.slice('work:'.length)
        : event.familyKey.startsWith('responsibility:')
        ? event.familyKey.slice('responsibility:'.length)
        : undefined);

    if (
      (event.kind === 'work_completed' || event.kind === 'responsibility_completed') &&
      inferredProfessionDomain
    ) {
      const dom = inferredProfessionDomain;
      const cur = growth.professionCounters[dom];
      if (!cur) {
        growth.professionCounters[dom] = {
          tasks: 1,
          firstDay: eventDay,
          lastDay: eventDay,
        };
      } else {
        cur.tasks += 1;
        cur.firstDay = Math.min(cur.firstDay, eventDay);
        cur.lastDay = Math.max(cur.lastDay, eventDay);
      }

      const cookProg = getProfessionAggregateCounter(growth, 'cook');
      if (cookProg.tasks >= 30 && cookProg.spanDays >= 30) {
        if (!growth.claimedMilestones.includes('profession_cook_tier2')) {
          growth.claimedMilestones.push('profession_cook_tier2');
        }
        grantTrait(world, event.entityId, 'dau_bep_than_cap', {
          reason: 'achievement',
          day: eventDay,
          sourceEventId: event.eventId,
          skipRebuild: true,
        });
      }

      const buildProg = getProfessionAggregateCounter(growth, 'build');
      if (buildProg.tasks >= 30 && buildProg.spanDays >= 30) {
        if (!growth.claimedMilestones.includes('profession_build_tier2')) {
          growth.claimedMilestones.push('profession_build_tier2');
        }
        grantTrait(world, event.entityId, 'kientruc_than_tuong', {
          reason: 'achievement',
          day: eventDay,
          sourceEventId: event.eventId,
          skipRebuild: true,
        });
      }
    }

    if (event.kind === 'tribulation_passed') {
      if (!growth.claimedMilestones.includes('tribulation_passed')) {
        growth.claimedMilestones.push('tribulation_passed');
      }
      const specificTribCount = growth.claimedMilestones.filter(
        m => m.startsWith('trib:') || m.startsWith('tribulation:') || m.startsWith('tribulation_passed:')
      ).length;
      const totalTribCount = Math.max(1, specificTribCount);
      if (totalTribCount >= 1) {
        grantTrait(world, event.entityId, 'loi_kiep_toi_the', {
          reason: 'achievement',
          day: eventDay,
          sourceEventId: event.eventId,
          skipRebuild: true,
        });
      }
      if (totalTribCount >= 3) {
        grantTrait(world, event.entityId, 'phong_loi_bat_dong', {
          reason: 'achievement',
          day: eventDay,
          sourceEventId: event.eventId,
          skipRebuild: true,
        });
      }
    }

    if (
      event.kind === 'encounter_survived' &&
      growth.combatEncounterCount >= 100 &&
      growth.distinctOpponentIds.length >= 20
    ) {
      if (!growth.claimedMilestones.includes('challenging_encounters_won')) {
        growth.claimedMilestones.push('challenging_encounters_won');
      }
      const traits = world.getComponent(event.entityId, TraitsComponent);
      const hasNovice = traits?.entries.some(
        e => e.id === 'kinh_nghiem_non_not' && e.state === 'active'
      );
      if (hasNovice) {
        evolveTrait(world, event.entityId, 'kinh_nghiem_non_not', 'bach_chien_bat_bai', {
          reason: 'evolution',
          day: eventDay,
          sourceEventId: event.eventId,
          skipRebuild: true,
        });
      } else {
        grantTrait(world, event.entityId, 'bach_chien_bat_bai', {
          reason: 'achievement',
          day: eventDay,
          sourceEventId: event.eventId,
          skipRebuild: true,
        });
      }
    }

    // 8. Tạo hoặc hoàn tất ExperienceRecord
    const experienceCreatedId = this.createExperienceForEvent(growth, event, eventDay);
    if (event.kind === 'reflection_completed' && targetExperience) {
      targetExperience.growthAwarded = true;
      targetExperience.resolvedAtDay = eventDay;
      targetExperience.lockedByStep = false;
    }

    // 9. Tính XP theo công thức mục 10.4
    const difficultyFactor = clampFinite(
      event.difficulty,
      DIFFICULTY_FACTOR_BOUNDS.min,
      DIFFICULTY_FACTOR_BOUNDS.max,
      0
    );

    const resolvedEffects = resolveEntityTraitEffects(world, event.entityId);
    const willTrainingFactor = getWillTrainingFactor(world, event.entityId, resolvedEffects);
    const mindTrainingFactor = getMindTrainingFactor(world, event.entityId, resolvedEffects);

    const rawWill =
      baseWillXp > 0 && difficultyFactor > 0
        ? baseWillXp * difficultyFactor * noveltyFactor * willTrainingFactor
        : 0;
    const rawMind =
      baseMindXp > 0 && difficultyFactor > 0
        ? baseMindXp * difficultyFactor * noveltyFactor * mindTrainingFactor
        : 0;

    const todayBucket = this.pruneAndGetDayBucket(growth, eventDay);
    const minWindowDay = eventDay - (GROWTH_BUCKET_WINDOW_DAYS - 1);

    let sum30Will = 0;
    let sum30Mind = 0;
    for (const b of growth.dailyBuckets) {
      if (b.day >= minWindowDay && b.day <= eventDay) {
        if (rule.category === 'routine') {
          sum30Will += b.routineWill;
          sum30Mind += b.routineMind;
        } else {
          sum30Will += b.experienceWill;
          sum30Mind += b.experienceMind;
        }
      }
    }

    const remDailyWill =
      rule.category === 'routine'
        ? Math.max(0, ROUTINE_XP_CAPS.dailyWill - todayBucket.routineWill)
        : Math.max(0, EXPERIENCE_XP_CAPS.dailyWill - todayBucket.experienceWill);
    const remDailyMind =
      rule.category === 'routine'
        ? Math.max(0, ROUTINE_XP_CAPS.dailyMind - todayBucket.routineMind)
        : Math.max(0, EXPERIENCE_XP_CAPS.dailyMind - todayBucket.experienceMind);

    const rem30Will =
      rule.category === 'routine'
        ? Math.max(0, ROUTINE_XP_CAPS.rolling30DayWill - sum30Will)
        : Math.max(0, EXPERIENCE_XP_CAPS.rolling30DayWill - sum30Will);
    const rem30Mind =
      rule.category === 'routine'
        ? Math.max(0, ROUTINE_XP_CAPS.rolling30DayMind - sum30Mind)
        : Math.max(0, EXPERIENCE_XP_CAPS.rolling30DayMind - sum30Mind);

    const willCeilingXp = rule.willScoreCeiling > 0 ? xpForScore(rule.willScoreCeiling) : 0;
    const mindCeilingXp = rule.mindScoreCeiling > 0 ? xpForScore(rule.mindScoreCeiling) : 0;

    const remSourceWill = Math.max(0, willCeilingXp - growth.willpowerXp);
    const remSourceMind = Math.max(0, mindCeilingXp - growth.mindsetXp);

    const remGlobalWill = Math.max(0, MAX_GROWTH_XP - growth.willpowerXp);
    const remGlobalMind = Math.max(0, MAX_GROWTH_XP - growth.mindsetXp);

    const acceptedWill =
      Math.round(
        Math.max(
          0,
          Math.min(rawWill, remDailyWill, rem30Will, remSourceWill, remGlobalWill)
        ) * 1e6
      ) / 1e6;
    const acceptedMind =
      Math.round(
        Math.max(
          0,
          Math.min(rawMind, remDailyMind, rem30Mind, remSourceMind, remGlobalMind)
        ) * 1e6
      ) / 1e6;

    if (acceptedWill > 0 || acceptedMind > 0) {
      growth.willpowerXp = clampFinite(
        Math.round((growth.willpowerXp + acceptedWill) * 1e6) / 1e6,
        0,
        MAX_GROWTH_XP,
        growth.willpowerXp
      );
      growth.mindsetXp = clampFinite(
        Math.round((growth.mindsetXp + acceptedMind) * 1e6) / 1e6,
        0,
        MAX_GROWTH_XP,
        growth.mindsetXp
      );

      if (rule.category === 'routine') {
        todayBucket.routineWill =
          Math.round((todayBucket.routineWill + acceptedWill) * 1e6) / 1e6;
        todayBucket.routineMind =
          Math.round((todayBucket.routineMind + acceptedMind) * 1e6) / 1e6;
      } else {
        todayBucket.experienceWill =
          Math.round((todayBucket.experienceWill + acceptedWill) * 1e6) / 1e6;
        todayBucket.experienceMind =
          Math.round((todayBucket.experienceMind + acceptedMind) * 1e6) / 1e6;
      }

      growth.recentGains.push({
        day: eventDay,
        willXp: acceptedWill,
        mindXp: acceptedMind,
        reason: event.evidence.reasonText ?? event.kind,
      });
      if (growth.recentGains.length > MAX_RECENT_GAINS) {
        growth.recentGains.splice(0, growth.recentGains.length - MAX_RECENT_GAINS);
      }
    }

    growth.markDirty();
    profile.markDirty();
    rebuildEntityStats(world, event.entityId);

    return {
      accepted: true,
      willAwarded: acceptedWill,
      mindAwarded: acceptedMind,
      experienceCreatedId,
    };
  }
}
