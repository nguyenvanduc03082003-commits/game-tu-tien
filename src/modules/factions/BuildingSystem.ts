import { System } from '../../ecs/System.ts';
import { ECSWorld } from '../../ecs/World.ts';
import { EventBus } from '../../core/EventBus.ts';
import { PositionComponent, HealthComponent, RealmComponent } from '../beings/BeingComponents.ts';
import { BuildingComponent, FactionComponent, MemberComponent } from './FactionComponents.ts';
import { FactionFactory } from './FactionFactory.ts';
import { DiplomacySystem } from './DiplomacySystem.ts';

export class BuildingSystem implements System {
  public name = 'BuildingSystem';
  public enabled = true;
  public priority = 34;

  public diplomacySystem: DiplomacySystem | null = null;
  private fallbackDiplomacy = new DiplomacySystem();
  private eventBus = EventBus.getInstance();

  constructor(diplomacySystem?: DiplomacySystem) {
    if (diplomacySystem) {
      this.diplomacySystem = diplomacySystem;
    }
  }

  private getDiplomacy(world: ECSWorld): DiplomacySystem {
    return this.diplomacySystem ?? world.getSystem<DiplomacySystem>('DiplomacySystem') ?? this.fallbackDiplomacy;
  }

  public update(world: ECSWorld, dt: number): void {
    const buildings = world.query([PositionComponent, BuildingComponent]);
    const diplomacy = this.getDiplomacy(world);

    for (const bEnt of buildings) {
      const pos = world.getComponent(bEnt, PositionComponent)!;
      const building = world.getComponent(bEnt, BuildingComponent)!;

      if (building.currentDurability <= 0 || building.isRuins || building.isUnderConstruction || !building.factionId) continue;

      building.timer += dt;

      // 0. NÔNG ĐIỀN PHÀM NHÂN: Định kỳ đóng góp lương thực vào kho điểm định cư/thế lực
      if (building.buildingType === 'mortal_farm') {
        if (building.timer >= building.interval) {
          building.timer = 0;
          const factionEnt = FactionFactory.findFactionEntity(world, building.factionId);
          if (factionEnt !== null) {
            const fComp = world.getComponent(factionEnt, FactionComponent);
            if (fComp) {
              fComp.foodStock += 2;
            }
          }
        }
      }

      // 1. LINH DƯỢC ĐIỀN: Định kỳ sinh trưởng linh thảo vào kho môn phái
      else if (building.buildingType === 'herb_garden') {
        if (building.timer >= building.interval) {
          building.timer = 0;
          const factionEnt = FactionFactory.findFactionEntity(world, building.factionId);
          if (factionEnt !== null) {
            const fComp = world.getComponent(factionEnt, FactionComponent);
            if (fComp) {
              const harvestCount = Math.floor(Math.random() * 2 + 1);
              fComp.herbStock += harvestCount;
              this.eventBus.emit('activity:feedback', {
                entityId: bEnt,
                text: `+${harvestCount} Linh Thảo 🌿`,
                color: '#69db7c'
              });
            }
          }
        }
      }

      // Luyện đan requires an eligible resident completing a profession work session.

      // 3. ĐỘNG PHỦ BẾ QUAN: Tăng tốc hấp thu linh khí cho đệ tử bên trong
      else if (building.buildingType === 'meditation_cave') {
        // Quét tìm đệ tử đứng gần động phủ (< 24px)
        const beings = world.query([PositionComponent, MemberComponent, RealmComponent]);
        let foundOccupant = false;

        for (const being of beings) {
          const mComp = world.getComponent(being, MemberComponent)!;
          if (mComp.factionId !== building.factionId) continue;

          const bPos = world.getComponent(being, PositionComponent)!;
          const dist = Math.hypot(bPos.x - pos.x, bPos.y - pos.y);

          if (dist < 28) {
            foundOccupant = true;
            building.occupantEntityId = being;

            const realm = world.getComponent(being, RealmComponent);
            if (realm) {
              // Tăng nhanh linh lực tích lũy
              realm.currentQi = Math.min(realm.maxQi, realm.currentQi + dt * 2.5);
            }

            const hp = world.getComponent(being, HealthComponent);
            if (hp && hp.current < hp.max) {
              hp.current = Math.min(hp.max, hp.current + dt * 3.0);
            }
            break;
          }
        }

        if (!foundOccupant) {
          building.occupantEntityId = null;
        }
      }

      // 4. HỘ TÔNG TRẬN PHÁP: Kết giới trừng phạt kẻ địch xâm lăng (không đánh đồng minh / trung lập)
      else if (building.buildingType === 'defense_array') {
        if (building.timer >= 2.0) {
          building.timer = 0;
          const candidates = world.query([PositionComponent, HealthComponent]);
          for (const enemy of candidates) {
            if (enemy === bEnt) continue;
            if (world.hasComponent(enemy, BuildingComponent)) continue;

            // Xác định kẻ địch thống nhất qua hệ thống ngoại giao
            if (diplomacy.isHostileToFaction(world, building.factionId, enemy)) {
              const ePos = world.getComponent(enemy, PositionComponent)!;
              const dist = Math.hypot(ePos.x - pos.x, ePos.y - pos.y);
              if (dist < 50) {
                const eHp = world.getComponent(enemy, HealthComponent)!;
                if (!eHp.isDead) {
                  eHp.current -= 18;
                  this.eventBus.emit('combat:floating_text', {
                    entityId: enemy,
                    text: '-18 Trận Pháp Phạt ⚡',
                    color: '#4dabf7'
                  });
                  if (eHp.current <= 0) {
                    eHp.isDead = true;
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}
