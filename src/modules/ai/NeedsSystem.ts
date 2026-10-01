import { rebuildEntityStats } from '../traits/DerivedStatsService.ts';
import { RESIDENT_STARVATION_THRESHOLD } from '../beings/BeingComponents.ts';
import { System } from '../../ecs/System.ts';
import { ECSWorld } from '../../ecs/World.ts';
import { WorldMap } from '../world/WorldMap.ts';
import { EventBus } from '../../core/EventBus.ts';
import { TimeManager } from '../../core/TimeManager.ts';
import {
  HealthComponent,
  HungerComponent,
  LifespanComponent,
  CharacterStateComponent,
  RealmComponent,
  CharacterHistoryComponent,
  MortalNeedsComponent,
  NameComponent
} from '../beings/BeingComponents.ts';
import { WeatherType } from '../../config/weather.config.ts';
import { resolveEntityTraitEffects } from '../traits/TraitEffectResolver.ts';
import { AnimalCarcassComponent, AnimalComponent } from '../animals/AnimalComponents.ts';

export class NeedsSystem implements System {
  public name = 'NeedsSystem';
  public enabled = true;
  public priority = 22;

  private eventBus = EventBus.getInstance();
  private accumulator: number = 0;
  private pendingYearPass: number = 0;
  private unsubscribes: (() => void)[] = [];

  constructor(_worldMap: WorldMap) {
    // Lắng nghe năm mới trôi qua để tăng tuổi thọ
    this.unsubscribes.push(
      this.eventBus.on<{ year: number }>('time:year_passed', () => {
        this.pendingYearPass++;
      })
    );
  }

  public destroy(): void {
    for (const unsub of this.unsubscribes) unsub();
    this.unsubscribes = [];
  }

  public reset(): void {
    this.accumulator = 0;
    this.pendingYearPass = 0;
  }

  public update(world: ECSWorld, dt: number): void {
    this.accumulator += dt;
    if (this.accumulator < 0.5) return;
    const stepTime = this.accumulator;
    this.accumulator = 0;

    const deltaDays = stepTime * (TimeManager.TICKS_PER_SECOND / TimeManager.TICKS_PER_DAY);

    const beings = world.query([HealthComponent, HungerComponent, CharacterStateComponent]);

    for (const ent of beings) {
      if (
        world.hasComponent(ent, AnimalComponent) ||
        world.hasComponent(ent, AnimalCarcassComponent)
      ) {
        continue;
      }
      const hp = world.getComponent(ent, HealthComponent)!;
      const hunger = world.getComponent(ent, HungerComponent)!;
      const stateComp = world.getComponent(ent, CharacterStateComponent)!;
      const realm = world.getComponent(ent, RealmComponent);
      const life = world.getComponent(ent, LifespanComponent);

      if (hp.isDead) continue;

      // Tăng 1 tuổi nếu qua năm mới
      if (this.pendingYearPass && life) {
        life.currentAge += this.pendingYearPass;
        rebuildEntityStats(world, ent);
      }

      const traitEffects = resolveEntityTraitEffects(world, ent);

      // 1. Giảm điểm no theo ngày (Tu sĩ cảnh giới cao tiêu hao ít hơn do tích cốc)
      const hungerDrain = (realm && realm.stageIndex >= 2 ? 0.3 : 1.0) * deltaDays * 0.8 * traitEffects.hungerRateFactor;
      hunger.current = Math.max(0, hunger.current - hungerDrain);
      hunger.isStarving = hunger.current < RESIDENT_STARVATION_THRESHOLD;

      // Đói cồn cào thì tụt máu
      if (hunger.isStarving) {
        hp.current = hp.current - 1.5 * deltaDays;
      }

      // 1b. Cập nhật nhu cầu người phàm (MortalNeedsComponent)
      const mortalNeeds = world.getComponent(ent, MortalNeedsComponent);
      if (mortalNeeds) {
        const currentWeather = (typeof window !== 'undefined' ? (window as any)._currentWeather : undefined) ?? WeatherType.CLEAR;

        // Khát nước: Hao nhanh hơn khi hạn hán
        const thirstDrain = (currentWeather === WeatherType.DROUGHT ? 1.8 : 1.0) * deltaDays * 1.2 * traitEffects.thirstRateFactor;
        mortalNeeds.thirst = Math.max(0, mortalNeeds.thirst - thirstDrain);

        // Buồn ngủ / Năng lượng: Hao nhanh hơn khi di chuyển hoặc chiến đấu
        const isWorking = stateComp.state === 'walk' || stateComp.state === 'attack' || stateComp.state === 'cook';
        const sleepDrain = (isWorking ? 1.5 : 0.8) * deltaDays * 0.9;
        mortalNeeds.sleep = Math.max(0, mortalNeeds.sleep - sleepDrain);

        // Điểm tinh thần / Giải trí
        mortalNeeds.recreation = Math.max(0, mortalNeeds.recreation - 0.7 * deltaDays);

        // Quá khát trong thời gian dài -> tụt máu
        if (mortalNeeds.thirst <= 0) {
          hp.current = Math.max(0, hp.current - 1.0 * deltaDays);
        }
      }

      // Kiểm tra tử vong do đói / khát (áp dụng cho cả phàm nhân lẫn tu sĩ trẻ)
      if (hp.current <= 0 && !hp.isDead) {
        hp.current = 0;
        hp.isDead = true;
        stateComp.state = 'dead';
        const history = world.getComponent(ent, CharacterHistoryComponent);
        if (history) {
          const causeOfDeath = hunger.isStarving ? 'đói khát' : 'kiệt sức';
          history.addRecord(
            life?.currentAge ?? 0,
            'death',
            '⚰️ Tử Vong Do Suy Kiệt',
            `Cơ thể suy kiệt do ${causeOfDeath} lâu ngày, không kịp cứu chữa mà tử vong ở tuổi ${life?.currentAge ?? '?'}.`
          );
        }
        const nameComp = world.getComponent(ent, NameComponent);
        this.eventBus.emit('world:log', {
          type: 'death',
          message: `💀 [${nameComp?.name ?? 'Một cư dân'}] tử vong do ${hunger.isStarving ? 'đói khát' : 'kiệt sức'} lâu ngày...`
        });
        continue;
      }

      // Kiểm tra thọ nguyên và giai đoạn già yếu (>= 90% thọ nguyên)
      if (life) {
        if (life.checkElderly()) {
          life.isElderly = true;
          if (!life.hasLoggedElderly) {
            life.hasLoggedElderly = true;
            const history = world.getComponent(ent, CharacterHistoryComponent);
            if (history) {
              history.addRecord(
                life.currentAge,
                'aging',
                '⏳ Bước Vào Giai Đoạn Già Yếu',
                `Thiên nhân ngũ suy, khí huyết khô kiệt, HP tối đa và các chỉ số thể chất bắt đầu giảm dần, tối đa 50% so với mốc khỏe mạnh. Cần dùng đan dược diên thọ hoặc đột phá cảnh giới để kéo dài sinh mệnh!`
              );
            }
          }

        } else {
          // Nếu thoát khỏi ngưỡng già yếu (nhờ đan dược diên thọ hoặc đột phá cảnh giới)
          if (life.isElderly) {
            life.isElderly = false;
            life.hasLoggedElderly = false;
          }
        }

        // Đại hạn thọ nguyên (100% tuổi thọ)
        if (life.currentAge >= life.maxLifespan) {
          hp.current = 0;
          hp.isDead = true;
          stateComp.state = 'dead';
          const history = world.getComponent(ent, CharacterHistoryComponent);
          if (history) {
            history.addRecord(
              life.currentAge,
              'death',
              '⚰️ Đại Hạn Thọ Tận',
              `Đạt tới hạn định luân hồi ${life.maxLifespan} tuổi, thân tử đạo tiêu, linh hồn quy về thiên địa.`
            );
          }
          continue;
        }
      }

    }

    if (this.pendingYearPass) {
      this.pendingYearPass = 0;
    }
  }
}
