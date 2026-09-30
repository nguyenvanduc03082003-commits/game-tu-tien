import { System } from '../../ecs/System.ts';
import { ECSWorld } from '../../ecs/World.ts';
import { InventoryComponent } from './InventoryComponent.ts';
import {
  HealthComponent,
  LifespanComponent,
  RealmComponent
} from '../beings/BeingComponents.ts';
import { PillUsageService } from './PillUsageService.ts';
import { getBreakthroughOutlook } from '../cultivation/BreakthroughRules.ts';

export class AlchemySystem implements System {
  public name = 'AlchemySystem';
  public enabled = true;
  public priority = 24;

  private accumulator: number = 0;

  public reset(): void {
    this.accumulator = 0;
  }

  public update(world: ECSWorld, dt: number): void {
    this.accumulator += dt;
    if (this.accumulator < 0.4) return;
    this.accumulator = 0;

    const entities = world.query([InventoryComponent, HealthComponent]);

    for (const ent of entities) {
      const inv = world.getComponent(ent, InventoryComponent)!;
      const hp = world.getComponent(ent, HealthComponent)!;
      const life = world.getComponent(ent, LifespanComponent);
      const realm = world.getComponent(ent, RealmComponent);

      // 1. CƠ CHẾ NGHỊCH THIÊN HỒI SINH (Nghịch Mệnh Hoàn Dương Đan)
      if (hp.isDead && inv.hasPill('nghich_menh_dan')) {
        const res = PillUsageService.usePill(world, ent, 'nghich_menh_dan');
        if (res.success) {
          continue;
        }
      }

      if (hp.isDead) continue;

      // 2. TỰ ĐỘNG UỐNG ĐAN HỒI MÁU KHI NGUY HIỂM (Máu < 35%)
      if (hp.current < hp.max * 0.35) {
        const healPillIds = ['cuu_chuyen_hoa_huyet', 'hoi_xuan_dan', 'kim_sang_dan'];
        for (const pid of healPillIds) {
          if (inv.hasPill(pid)) {
            const res = PillUsageService.usePill(world, ent, pid);
            if (res.success) break;
          }
        }
      }

      // 3. TỰ ĐỘNG UỐNG ĐAN DIÊN THỌ KHI SẮP HẾT THỌ MỆNH
      if (life && life.currentAge >= life.maxLifespan - 4) {
        const lifePillIds = ['bo_thien_dan', 'dien_tho_dan', 'duong_tho_dan'];
        for (const pid of lifePillIds) {
          if (inv.hasPill(pid)) {
            const res = PillUsageService.usePill(world, ent, pid);
            if (res.success) break;
          }
        }
      }

      // 4. TỰ ĐỘNG DÙNG ĐAN TRỢ LỰC ĐỘT PHÁ KHI LINH LỰC ĐẦY
      if (realm && getBreakthroughOutlook(world, ent).eligible) {
        if (realm.stageIndex === 1 && inv.hasPill('truc_co_dan')) {
          PillUsageService.usePill(world, ent, 'truc_co_dan');
        } else if (realm.stageIndex === 2 && inv.hasPill('tu_dan_dan')) {
          PillUsageService.usePill(world, ent, 'tu_dan_dan');
        }
      }
    }
  }
}
