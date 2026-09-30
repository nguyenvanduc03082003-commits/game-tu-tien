import { ECSWorld } from '../../ecs/World.ts';
export interface SocialEventTime { readonly day: number; readonly tick: number; }
export function socialEventTime(world: ECSWorld): SocialEventTime {
  return { day: world.calendarDaysAtTick(), tick: world.getCurrentTick() };
}
