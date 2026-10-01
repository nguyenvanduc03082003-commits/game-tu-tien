import { ECSWorld } from '../../ecs/World.ts';
import type { AIPlannerComponent } from '../ai/brain/AIComponents.ts';
import { ChildcareComponent } from '../beings/BeingComponents.ts';
import { recordSocialTelemetry } from './SocialSimulationTelemetry.ts';

/** Lifecycle records are emitted at transitions, never by re-evaluating decisions. */
export function recordSocialPlan(world: ECSWorld, entity: number, planner: AIPlannerComponent,
  result: 'started' | 'completed' | 'failed' | 'interrupted' | 'conversation_completed' | 'conversation_skipped',
  reason?: string): void {
  if (planner.currentPlanGoal !== 'SOCIAL_RECREATE') return;
  const target = planner.steps.find(step => step.customData?.socialWith !== undefined)?.customData.socialWith as number | undefined;
  const care = world.getComponent(entity, ChildcareComponent);
  const purpose = target === undefined ? 'rest' : care?.isChild && care.guardianEntityId === target ? 'guardian' : 'conversation';
  recordSocialTelemetry(world, 'social_plan', result, entity, target, reason ?? purpose, planner.planRevision);
}
