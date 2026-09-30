import { ECSWorld } from '../../ecs/World.ts';
import { socialEventTime, SocialEventTime } from './SocialEventTime.ts';
export interface SocialSimulationSample extends SocialEventTime {
  category: string; result: string; actor: number; target?: number; detail?: string;
}
interface TelemetryState { enabled: boolean; counters: Map<string, number>; samples: SocialSimulationSample[]; lastTick: number; }
const states = new WeakMap<ECSWorld, TelemetryState>();
function state(world: ECSWorld): TelemetryState {
  let value = states.get(world);
  if (!value) { value = { enabled: false, counters: new Map(), samples: [], lastTick: world.getCurrentTick() }; states.set(world, value); }
  if (world.getCurrentTick() < value.lastTick) { value.counters.clear(); value.samples = []; }
  value.lastTick = world.getCurrentTick(); return value;
}
export function setSocialTelemetryEnabled(world: ECSWorld, enabled: boolean): void { state(world).enabled = enabled; }
export function resetSocialTelemetry(world: ECSWorld): void { states.delete(world); }
export function recordSocialTelemetry(world: ECSWorld, category: string, result: string, actor: number, target?: number, detail?: string): void {
  const value = states.get(world);
  if (!value?.enabled) return;
  state(world);
  const key = `${category}:${result}:${detail ?? ''}`;
  // Counter keys must remain bounded even if a future caller supplies arbitrary detail.
  if (value.counters.has(key) || value.counters.size < 128) value.counters.set(key, (value.counters.get(key) ?? 0) + 1);
  value.samples.unshift({ ...socialEventTime(world), category, result, actor, target, detail });
  if (value.samples.length > 200) value.samples.length = 200;
}
/** Readonly snapshot; inspecting never enables telemetry or creates state. */
export function readSocialTelemetry(world: ECSWorld) {
  const value = states.get(world);
  return { enabled: value?.enabled ?? false, counters: value ? Object.fromEntries(value.counters) : {},
    samples: value?.samples.map(sample => ({ ...sample })) ?? [] };
}
