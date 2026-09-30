import type { ECSWorld } from './World.ts';

export interface System {
  name: string;
  enabled: boolean;
  priority?: number; // Thứ tự thực thi (số nhỏ chạy trước)
  init?(world: ECSWorld): void;
  update(world: ECSWorld, dt: number): void;
  destroy?(): void;
}
