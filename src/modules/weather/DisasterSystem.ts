import { System } from '../../ecs/System.ts';
import { ECSWorld } from '../../ecs/World.ts';
import { WorldMap } from '../world/WorldMap.ts';
import { EventBus } from '../../core/EventBus.ts';
import { PositionComponent, HealthComponent, RealmComponent } from '../beings/BeingComponents.ts';
import { WeatherType } from './WeatherTypes.ts';

export interface LightningStrikeEvent {
  x: number;
  y: number;
  radius: number;
  damage: number;
}

export class DisasterSystem implements System {
  public name = 'DisasterSystem';
  public enabled = true;
  public priority = 18;

  private worldMap: WorldMap;
  private eventBus = EventBus.getInstance();
  private randomStrikeTimer: number = 0;

  constructor(worldMap: WorldMap) {
    this.worldMap = worldMap;
  }

  public reset(): void {
    this.randomStrikeTimer = 0;
  }

  public update(world: ECSWorld, dt: number): void {
    this.randomStrikeTimer += dt;

    // Ngẫu nhiên giáng thiên kiếp / sấm sét khi trời dông bão (THUNDERSTORM)
    const currentWeather = (typeof window !== 'undefined' ? (window as any)._currentWeather : undefined) ?? WeatherType.CLEAR;
    if (currentWeather === WeatherType.THUNDERSTORM && this.randomStrikeTimer >= 8.0) {
      this.randomStrikeTimer = 0;
      if (Math.random() < 0.35) {
        const rx = Math.floor(Math.random() * this.worldMap.width) * this.worldMap.tileSize;
        const ry = Math.floor(Math.random() * this.worldMap.height) * this.worldMap.tileSize;
        this.strikeLightning(world, rx, ry, 24, 80);
      }
    } else if (this.randomStrikeTimer >= 8.0) {
      this.randomStrikeTimer = 0;
    }
  }

  /**
   * Giáng một tia Thiên Lôi / Lôi Kiếp xuống tọa độ thế giới (x, y)
   */
  public strikeLightning(world: ECSWorld, x: number, y: number, radius: number = 32, damage: number = 100): void {
    const event: LightningStrikeEvent = { x, y, radius, damage };
    this.eventBus.emit('disaster:lightning_strike', event);

    // Gây sát thương hoặc tôi thể cho các thực thể nằm trong bán kính sét đánh
    const beings = world.query([PositionComponent, HealthComponent]);
    const r2 = radius * radius;

    for (const ent of beings) {
      const pos = world.getComponent(ent, PositionComponent)!;
      const hp = world.getComponent(ent, HealthComponent)!;
      const realm = world.getComponent(ent, RealmComponent);

      const dx = pos.x - x;
      const dy = pos.y - y;
      if (dx * dx + dy * dy <= r2) {
        // Tu sĩ cảnh giới cao có khả năng chống đỡ lôi kiếp và tôi thể
        let actualDamage = damage;
        if (realm && realm.stageIndex >= 2) {
          actualDamage = Math.floor(damage * 0.4); // Giảm 60% sát thương
          realm.currentQi = Math.min(realm.maxQi, realm.currentQi + 100); // Tôi luyện linh lực
          console.log(`⚡ Tu sĩ ${ent} đón đỡ Lôi Kiếp, linh lực tăng vọt!`);
        }

        hp.current = Math.max(0, hp.current - actualDamage);
        if (hp.current === 0) {
          hp.isDead = true;
        }
      }
    }
  }
}
