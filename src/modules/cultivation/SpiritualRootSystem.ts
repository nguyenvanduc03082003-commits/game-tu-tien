import { System } from '../../ecs/System.ts';
import { ECSWorld } from '../../ecs/World.ts';
import { EventBus } from '../../core/EventBus.ts';
import {
  LifespanComponent,
  SpiritualRootComponent,
  CharacterHistoryComponent,
  NameComponent,
  SpiritualRootType,
  RaceComponent,
  TraitsComponent,
} from '../beings/BeingComponents.ts';
import { TalentProfileComponent, PendingRoot } from '../talent/TalentComponents.ts';
import { computeDeterministicPendingRoot } from '../save/TraitTalentMigration.ts';
import { getRootGradeName } from '../talent/TalentGenerator.ts';
import { rebuildEntityStats } from '../traits/DerivedStatsService.ts';

const ELEMENT_NAMES: Record<string, string> = {
  kim: 'Kim',
  moc: 'Mộc',
  thuy: 'Thủy',
  hoa: 'Hỏa',
  tho: 'Thổ',
  loi: 'Lôi',
  bang: 'Băng',
  phong: 'Phong',
  am: 'Ám',
};

const ROOT_BADGES: Record<SpiritualRootType, string> = {
  none: '🌑',
  impure: '🌫️',
  true: '🌿',
  earth: '⚡',
  heaven: '🌟',
};

export class SpiritualRootSystem implements System {
  public name = 'SpiritualRootSystem';
  public enabled = true;
  public priority = 24;

  private eventBus = EventBus.getInstance();
  private accumulator: number = 0;

  public reset(): void {
    this.accumulator = 0;
  }

  public update(world: ECSWorld, dt: number): void {
    this.accumulator += dt;
    if (this.accumulator < 0.5) return;
    this.accumulator = 0;

    const beings = world.query([LifespanComponent, SpiritualRootComponent]);

    for (const ent of beings) {
      const life = world.getComponent(ent, LifespanComponent)!;
      const root = world.getComponent(ent, SpiritualRootComponent)!;
      const name = world.getComponent(ent, NameComponent);
      const history = world.getComponent(ent, CharacterHistoryComponent);

      // Khi cư dân đạt tròn 12 tuổi và chưa thức tỉnh -> Tiến hành Đại Lễ Thức Tỉnh Linh Căn!
      if (life.currentAge >= 12 && !root.isAwakened) {
        this.awakenSpiritualRoot(ent, root, life.currentAge, name?.name ?? 'Thiếu niên', history, world);
      }
    }
  }

  public awakenSpiritualRoot(
    entityId: number,
    root: SpiritualRootComponent,
    age: number,
    beingName: string,
    history?: CharacterHistoryComponent,
    world?: ECSWorld
  ): void {
    if (root.isAwakened) return;

    root.isAwakened = true;
    root.awakenedAge = age;

    let pending: PendingRoot | undefined;
    let raceId = 'human';

    if (world) {
      const raceComp = world.getComponent(entityId, RaceComponent);
      if (raceComp) raceId = raceComp.raceId;
      const profile = world.getComponent(entityId, TalentProfileComponent);
      const traitsComp = world.getComponent(entityId, TraitsComponent);

      if (profile) {
        if (!profile.pendingRoot) {
          profile.pendingRoot = computeDeterministicPendingRoot(
            world.worldSeed,
            entityId,
            raceId,
            traitsComp
          );
        }
        pending = profile.pendingRoot;
        profile.knowledge = 'revealed';
        profile.markDirty();
      } else {
        pending = computeDeterministicPendingRoot(
          world.worldSeed,
          entityId,
          raceId,
          traitsComp
        );
      }
    } else {
      pending = computeDeterministicPendingRoot(20260925, entityId, raceId, undefined);
    }

    const type: SpiritualRootType = pending.rootType;
    const gradeName = pending.gradeName || getRootGradeName(type, raceId);
    const elements = [...pending.elements];
    const purity = pending.purity;
    const badge = ROOT_BADGES[type] || '🌑';

    root.rootType = type;
    root.gradeName = gradeName;
    root.elements = elements;
    root.purity = purity;

    if (world) {
      rebuildEntityStats(world, entityId);
    }

    const elemStr = elements.length > 0
      ? `Thuộc tính: ${elements.map(e => ELEMENT_NAMES[e] || e).join(' • ')}`
      : 'Không có thuộc tính ngũ hành';

    // Ghi biên niên sử cá nhân
    if (history) {
      const histDesc = type === 'none'
        ? 'Tròn 12 tuổi tham dự đại lễ thí luyện, trắc định Vô Linh Căn, an phận làm một người phàm hiền lành, cày cấy xây dựng quê hương.'
        : `Tròn 12 tuổi thiên linh khai mở! Thức tỉnh [${gradeName}], ${elemStr}, độ tinh thuần ${purity}%. Chính thức bước vào tiên đồ!`;

      history.addRecord(
        age,
        'breakthrough',
        `${badge} Thức Tỉnh: ${gradeName}`,
        histDesc,
        badge
      );
    }

    // Chỉ khi xuất hiện Thiên Linh Căn mới ghi nhận Dị Tượng Thiên Địa
    if (type === 'heaven') {
      this.eventBus.emit('world:log', {
        type: 'anomaly',
        message: `✨ THIÊN ĐỊA DỊ TƯỢNG: Thiên Linh Căn hiện thế! [${beingName}] dẫn động hào quang vạn trượng, thức tỉnh [${gradeName}] (${elemStr})!`
      });
    }

    this.eventBus.emit('cultivation:spiritual_root_awakened', {
      entityId,
      rootType: type,
      gradeName,
      elements
    });
  }
}

