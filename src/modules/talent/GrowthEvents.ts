import { ECSWorld } from '../../ecs/World.ts';
import { EventBus } from '../../core/EventBus.ts';
import { GrowthEventKind } from '../../config/mental-growth.config.ts';
import { recordProfessionWork } from '../professions/ProfessionService.ts';

export type { GrowthEventKind };

export const GROWTH_EVENT_CHANNEL = 'talent:growth_event';

export interface GrowthEventEvidence {
  taskId?: string;
  planRevision?: number;
  stepIndex?: number;
  encounterId?: string;
  experienceId?: string;
  targetEntityId?: number;
  realmTarget?: string;
  durationTicks?: number;
  actualDamage?: number;
  actualOutput?: number;
  bereavementTier?: 'friend' | 'close_kin';
  professionDomain?: string;
  reasonText?: string;
}

export interface GrowthEvent {
  world: ECSWorld; // chỉ runtime, dùng chặn sự kiện nhầm world
  eventId: string;
  entityId: number;
  kind: GrowthEventKind;
  tick: number;
  familyKey: string; // nhóm hoạt động dùng chống lặp
  milestoneKey?: string;
  difficulty: number; // do producer xác nhận, không do UI gửi tự do
  evidence: GrowthEventEvidence;
}

export function emitGrowthEvent(event: GrowthEvent): void {
  if (
    !event ||
    !event.world ||
    typeof event.eventId !== 'string' ||
    event.eventId.length === 0 ||
    typeof event.entityId !== 'number'
  ) {
    return;
  }
  recordProfessionWork(event);
  EventBus.getInstance().emit(GROWTH_EVENT_CHANNEL, event);
}
