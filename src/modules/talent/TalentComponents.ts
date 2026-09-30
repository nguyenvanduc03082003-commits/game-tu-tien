import { Component } from '../../ecs/Component.ts';
import { InnateAxis } from '../../config/traits/trait.types.ts';
import { PotentialGrade, TalentSeedClass } from '../../config/talent.config.ts';
import { ExperienceKind } from '../../config/mental-growth.config.ts';
import { SpiritualRootType } from '../beings/BeingComponents.ts';

export interface InnateScores {
  comprehension: number;
  aptitude: number;
  physique: number;
}

export interface PendingRoot {
  rootType: SpiritualRootType;
  purity: number;
  elements: string[];
  primaryTraitId?: string;
  gradeName?: string;
}

export interface FoundationChange {
  id: string;
  eventId: string;
  day: number;
  delta: Partial<InnateScores>;
  reason: string;
}

export interface LegacyPotentialAnchor {
  observedScores: InnateScores;
  traitDeltaAtMigration: InnateScores;
}

export interface PotentialResult {
  scores: InnateScores & { willpower: number; mindset: number };
  innateContribution: number;
  growthContribution: number;
  total: number;
  displayTotal: number;
  assessmentComplete: boolean;
  grade: PotentialGrade;
}

export class TalentProfileComponent implements Component {
  public schemaVersion: number = 3;
  public birthSeed: number = 0;
  public seedClass: TalentSeedClass = 'ordinary';
  public base: InnateScores = { comprehension: 0, aptitude: 0, physique: 0 };
  public pendingRoot: PendingRoot | null = null;
  public lineageTags: string[] = [];
  public foundationChanges: FoundationChange[] = [];
  public knowledge: 'unassessed' | 'revealed' | 'estimatedLegacy' = 'unassessed';
  public migrationBaseIsResolved: boolean = false;
  public legacyAnchor?: LegacyPotentialAnchor;
  public revision: number = 0;
  public cachedPotential?: PotentialResult;
  public cachedAtProfileRevision: number = -1;
  public cachedAtGrowthRevision: number = -1;
  public cachedAtTraitRevision: number = -1;

  constructor(init?: Partial<TalentProfileComponent>) {
    if (init) {
      if (typeof init.schemaVersion === 'number') this.schemaVersion = init.schemaVersion;
      if (typeof init.birthSeed === 'number') this.birthSeed = init.birthSeed;
      if (init.seedClass) this.seedClass = init.seedClass;
      if (init.base) {
        this.base = {
          comprehension: init.base.comprehension ?? 0,
          aptitude: init.base.aptitude ?? 0,
          physique: init.base.physique ?? 0,
        };
      }
      if (init.pendingRoot !== undefined) {
        this.pendingRoot = init.pendingRoot
          ? {
              rootType: init.pendingRoot.rootType,
              purity: init.pendingRoot.purity,
              elements: [...init.pendingRoot.elements],
              primaryTraitId: init.pendingRoot.primaryTraitId,
              gradeName: init.pendingRoot.gradeName,
            }
          : null;
      }
      if (Array.isArray(init.lineageTags)) this.lineageTags = [...init.lineageTags];
      if (Array.isArray(init.foundationChanges)) {
        this.foundationChanges = init.foundationChanges.map(fc => ({
          id: fc.id,
          eventId: fc.eventId,
          day: fc.day,
          delta: { ...fc.delta },
          reason: fc.reason,
        }));
      }
      if (init.knowledge) this.knowledge = init.knowledge;
      if (typeof init.migrationBaseIsResolved === 'boolean') {
        this.migrationBaseIsResolved = init.migrationBaseIsResolved;
      }
      if (init.legacyAnchor) {
        this.legacyAnchor = {
          observedScores: { ...init.legacyAnchor.observedScores },
          traitDeltaAtMigration: { ...init.legacyAnchor.traitDeltaAtMigration },
        };
      }
      if (typeof init.revision === 'number') this.revision = init.revision;
    }
  }

  public markDirty(): void {
    this.revision++;
    this.cachedPotential = undefined;
  }

  public addFoundationChange(change: FoundationChange): boolean {
    if (this.foundationChanges.some(c => c.id === change.id || c.eventId === change.eventId)) {
      return false;
    }
    this.foundationChanges.push({
      id: change.id,
      eventId: change.eventId,
      day: change.day,
      delta: { ...change.delta },
      reason: change.reason,
    });
    this.markDirty();
    return true;
  }
}

export interface GrowthDayBucket {
  day: number;
  routineWill: number;
  routineMind: number;
  experienceWill: number;
  experienceMind: number;
}

export interface GrowthFamilyDayBucket {
  day: number;
  counts: Record<string, number>;
}

export interface ExperienceRecord {
  id: string;
  eventId: string;
  kind: ExperienceKind;
  templateId?: string;
  createdDay: number;
  severity: number; // 1..5
  emotion: number; // -100..100
  halfLifeDays: number;
  reflectionDays: number;
  requiredReflectionDays: number;
  readyForReflectionAtDay: number;
  growthAwarded: boolean;
  resolvedAtDay?: number;
  lockedByStep?: boolean;
  reason?: string;
}

export interface RecentGainRecord {
  day: number;
  willXp: number;
  mindXp: number;
  reason: string;
}

export class GrowthMindComponent implements Component {
  public willpowerXp: number = 0;
  public mindsetXp: number = 0;
  public mentalState: number = 0;
  public lastIntegratedTick: number = 0;
  public dailyBuckets: GrowthDayBucket[] = [];
  public familyDayBuckets: GrowthFamilyDayBucket[] = [];
  public cooldownUntilDay: Record<string, number> = {};
  public recentEventIds: { id: string; day: number }[] = [];
  public claimedMilestones: string[] = [];
  public experiences: ExperienceRecord[] = [];
  public recentGains: RecentGainRecord[] = [];
  public backgroundSource: 'newborn' | 'generatedAdult' | 'legacy' = 'newborn';
  public professionCounters: Record<string, { tasks: number; firstDay: number; lastDay: number }> = {};
  public combatEncounterCount: number = 0;
  public distinctOpponentIds: number[] = [];
  public revision: number = 0;

  constructor(init?: Partial<GrowthMindComponent>) {
    if (init) {
      if (typeof init.willpowerXp === 'number') this.willpowerXp = init.willpowerXp;
      if (typeof init.mindsetXp === 'number') this.mindsetXp = init.mindsetXp;
      if (typeof init.mentalState === 'number') this.mentalState = init.mentalState;
      if (typeof init.lastIntegratedTick === 'number') this.lastIntegratedTick = init.lastIntegratedTick;
      if (Array.isArray(init.dailyBuckets)) {
        this.dailyBuckets = init.dailyBuckets.map(b => ({ ...b }));
      }
      if (Array.isArray(init.familyDayBuckets)) {
        this.familyDayBuckets = init.familyDayBuckets.map(b => ({
          day: b.day,
          counts: { ...b.counts },
        }));
      }
      if (init.cooldownUntilDay) this.cooldownUntilDay = { ...init.cooldownUntilDay };
      if (Array.isArray(init.recentEventIds)) {
        this.recentEventIds = init.recentEventIds.map(e => ({ ...e }));
      }
      if (Array.isArray(init.claimedMilestones)) {
        this.claimedMilestones = [...init.claimedMilestones];
      }
      if (Array.isArray(init.experiences)) {
        this.experiences = init.experiences.map(e => ({ ...e }));
      }
      if (Array.isArray(init.recentGains)) {
        this.recentGains = init.recentGains.map(g => ({ ...g }));
      }
      if (init.backgroundSource) this.backgroundSource = init.backgroundSource;
      if (init.professionCounters) {
        this.professionCounters = {};
        for (const [k, v] of Object.entries(init.professionCounters)) {
          this.professionCounters[k] = { ...v };
        }
      }
      if (typeof init.combatEncounterCount === 'number') {
        this.combatEncounterCount = init.combatEncounterCount;
      }
      if (Array.isArray(init.distinctOpponentIds)) {
        this.distinctOpponentIds = [...init.distinctOpponentIds];
      }
      if (typeof init.revision === 'number') this.revision = init.revision;
    }
  }

  public markDirty(): void {
    this.revision++;
  }
}

export interface PermanentStatAdjustment {
  id: string;
  stat: 'lifespanYears' | 'maxHealthFlat' | 'attackFlat' | 'defenseFlat' | 'armorFlat';
  delta: number;
  source: string;
  day: number;
}

export interface LegacyStatAnchor {
  savedMaxHp: number;
  savedMaxLifespan: number;
  savedMoveSpeed: number;
  savedAttack: number;
  savedDefense: number;
  savedArmor: number;
  savedCritRate: number;
  savedDodgeRate: number;
  savedAttackSpeed: number;
  stageIndexAtMigration: number;
}

export class StatBaselineComponent implements Component {
  public baseMoveSpeed: number = 25;
  public baseMaxHealth: number = 100;
  public healthGrowthMultiplier: number = 5;
  public archetypeHealthMultiplier: number = 1.0;
  public baseLifespan: number = 100;
  public lifespanGrowthMultiplier: number = 5;
  public archetypeLifespanMultiplier: number = 1.0;
  public baseAttack: number = 10;
  public baseDefense: number = 5;
  public baseArmor: number = 0;
  public archetypePhysiqueMultiplier: number = 1.0;
  public baseCritRate: number = 0.05;
  public baseDodgeRate: number = 0.05;
  public baseAttackSpeed: number = 1.0;
  public permanentAdjustments: PermanentStatAdjustment[] = [];
  public legacyStatAnchor?: LegacyStatAnchor;
  public agingReference?: { maxHealth: number; attack: number; defense: number; armor: number; moveSpeed: number; attackSpeed: number; dodgeRate: number };
  public agingFactor = 1;
  public lastAgingAge = -1;
  public lastAgingLifespan = -1;
  public dirty: boolean = false;
  public lastRebuiltTraitRevision: number = -1;
  public lastRebuiltStageIndex: number = -1;

  constructor(init?: Partial<StatBaselineComponent>) {
    if (init) {
      Object.assign(this, init);
      if (Array.isArray(init.permanentAdjustments)) {
        this.permanentAdjustments = init.permanentAdjustments.map(a => ({ ...a }));
      }
      if (init.agingReference) this.agingReference = { ...init.agingReference };
      if (init.legacyStatAnchor) {
        this.legacyStatAnchor = { ...init.legacyStatAnchor };
      }
    }
  }

  public addPermanentAdjustment(adj: PermanentStatAdjustment): boolean {
    if (this.permanentAdjustments.some(a => a.id === adj.id)) {
      return false;
    }
    this.permanentAdjustments.push({ ...adj });
    this.dirty = true;
    return true;
  }
}

export type InnateDeltaInput = {
  id: string;
  origin: 'innate' | 'acquired' | 'lineage' | 'reincarnation';
  innateDelta?: Partial<Record<InnateAxis, number>>;
  isPrimaryRoot?: boolean;
};
