import { ECSWorld } from '../../../ecs/World.ts';

export class ResidentPersonalityComponent {
  constructor(
    public sociability = Math.random(), public diligence = Math.random(),
    public curiosity = Math.random(), public ambition = Math.random(),
  ) {}
}

/** Sinh một lần, lưu trên thực thể và giữ ổn định qua các quyết định AI. */
export function residentPreferences(entity: number, world: ECSWorld): ResidentPersonalityComponent {
  let personality = world.getComponent(entity, ResidentPersonalityComponent);
  if (!personality) personality = world.addComponent(entity, new ResidentPersonalityComponent());
  return personality;
}

/** Snapshot chỉ đọc; thiếu/không hợp lệ dùng trung tính, không sinh RNG hoặc component. */
export function readResidentPreferences(entity: number, world: ECSWorld): Readonly<ResidentPersonalityComponent> {
  const personality = world.getComponent(entity, ResidentPersonalityComponent);
  const value = (input: number | undefined): number =>
    input !== undefined && Number.isFinite(input) ? Math.max(0, Math.min(1, input)) : 0.5;
  return Object.freeze({
    sociability: value(personality?.sociability), diligence: value(personality?.diligence),
    curiosity: value(personality?.curiosity), ambition: value(personality?.ambition),
  });
}
