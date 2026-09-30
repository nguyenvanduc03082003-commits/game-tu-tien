import type { System } from '../../ecs/System.ts';
import { ECSWorld } from '../../ecs/World.ts';
import { RaceComponent, HealthComponent } from '../beings/BeingComponents.ts';
import { WorldMap } from '../world/WorldMap.ts';
import { reviewProfession } from './ProfessionService.ts';

export class ProfessionSystem implements System {
  public name = 'ProfessionSystem';
  public enabled = true;
  public priority = 11;
  private elapsed = 1;
  constructor(private getWorldMap: () => WorldMap) {}
  public reset(): void { this.elapsed = 1; }
  public update(world: ECSWorld, dt: number): void {
    if (!Number.isFinite(dt) || dt <= 0) return;
    this.elapsed += dt;
    if (this.elapsed < 1) return;
    this.elapsed = 0;
    for (const entity of world.query([RaceComponent, HealthComponent])) reviewProfession(world, entity, this.getWorldMap());
  }
}
