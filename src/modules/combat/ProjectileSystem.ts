import { System } from '../../ecs/System.ts';
import { ECSWorld } from '../../ecs/World.ts';
import { EventBus } from '../../core/EventBus.ts';
import { PositionComponent, HealthComponent, CharacterStateComponent } from '../beings/BeingComponents.ts';
import { ProjectileComponent, CombatStatsComponent, EquipmentComponent } from './CombatComponents.ts';
import { BehaviorTreeExecutor } from '../ai/brain/behavior/BehaviorTree.ts';
import { AIBehaviorTreeComponent } from '../ai/brain/AIComponents.ts';
import { AnimalBrainComponent, AnimalComponent } from '../animals/AnimalComponents.ts';
import { EncounterTracker } from '../talent/EncounterTracker.ts';
import { registerSelfDefense } from './CombatIntentService.ts';
import { handleBondBetrayal } from '../social/RelationshipService.ts';
import { captureRescueCandidates, recordRescueThreat, resolveRescueKill } from '../social/RescueEvidenceService.ts';
import { SocialInteractionSystem } from '../social/SocialInteractionSystem.ts';

export class ProjectileSystem implements System {
  public name = 'ProjectileSystem';
  public enabled = true;
  public priority = 35;

  private eventBus = EventBus.getInstance();

  public update(world: ECSWorld, dt: number): void {
    const projectiles = world.query([PositionComponent, ProjectileComponent]);

    for (const pEnt of projectiles) {
      const pos = world.getComponent(pEnt, PositionComponent)!;
      const proj = world.getComponent(pEnt, ProjectileComponent)!;

      // Cập nhật vị trí mục tiêu nếu mục tiêu là sinh vật còn sống
      let destX = proj.targetX;
      let destY = proj.targetY;

      if (proj.targetEntityId !== null) {
        const targetPos = world.getComponent(proj.targetEntityId, PositionComponent);
        if (targetPos) {
          destX = targetPos.x;
          destY = targetPos.y;
        }
      }

      const dx = destX - pos.x;
      const dy = destY - pos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const step = proj.speed * dt;

      if (dist <= Math.max(step, 10)) {
        // TRÚNG MỤC TIÊU!
        if (proj.targetEntityId !== null) {
          const targetHp = world.getComponent(proj.targetEntityId, HealthComponent);
          const targetStats = world.getComponent(proj.targetEntityId, CombatStatsComponent);
          const targetEquip = world.getComponent(proj.targetEntityId, EquipmentComponent);

          if (targetHp && !targetHp.isDead && Number.isFinite(targetHp.current) && targetHp.current > 0) {
            // Kiểm tra né đòn chủ động qua Thân Pháp Behavior Tree
            const isDodged =
              world.hasComponent(proj.targetEntityId, AIBehaviorTreeComponent) &&
              BehaviorTreeExecutor.tryActiveDodge(world, proj.targetEntityId, { x: pos.x, y: pos.y });
            if (isDodged) {
              // Né tránh thành công mũi tên / phi đao!
            } else {
              // Giảm trừ sát thương qua giáp: Damage * 50 / (50 + Armor)
              const targetDefense = targetStats?.defense ?? 0;
              const targetArmor = (targetStats?.armor ?? 0) + (targetEquip?.getTotalArmorBonus() ?? 0);
              const postDef = Math.max(1, proj.damage - targetDefense);
              const finalDmg = Math.max(1, Math.floor(postDef * (50 / (50 + targetArmor))));

              const hpBeforeHit = targetHp.current;
              const rescueCandidates = finalDmg >= hpBeforeHit ? captureRescueCandidates(world, proj.targetEntityId) : [];
              handleBondBetrayal(world, proj.sourceEntityId, proj.targetEntityId, Math.min(hpBeforeHit, finalDmg));
              targetHp.current = Math.max(0, targetHp.current - finalDmg);
              recordRescueThreat(world, proj.targetEntityId, proj.sourceEntityId);
              registerSelfDefense(world, proj.targetEntityId, proj.sourceEntityId);
              if (!world.hasComponent(proj.sourceEntityId, AnimalComponent) && !world.hasComponent(proj.targetEntityId, AnimalComponent)) {
                SocialInteractionSystem.handleCombatAttack(world, proj.sourceEntityId, proj.targetEntityId, world.calendarDayFloorAtTick());
              }

              const targetAnimalBrain = world.getComponent(proj.targetEntityId, AnimalBrainComponent);
              if (targetAnimalBrain && targetHp.current > 0) {
                targetAnimalBrain.threatEntityId = proj.sourceEntityId;
                targetAnimalBrain.decisionTimer = 0;
              }

              this.eventBus.emit('combat:floating_text', {
                x: destX,
                y: destY,
                text: `-${finalDmg}`,
                color: proj.isCrit ? '#ffd43b' : '#ff6b6b',
                isCrit: proj.isCrit
              });

              if (targetHp.current <= 0) {
                targetHp.isDead = true;
                resolveRescueKill(world, proj.sourceEntityId, proj.targetEntityId, hpBeforeHit, rescueCandidates);
                const targetState = world.getComponent(proj.targetEntityId, CharacterStateComponent);
                if (targetState) targetState.state = 'dead';
              }

              if (
                !world.hasComponent(proj.sourceEntityId, AnimalComponent) &&
                !world.hasComponent(proj.targetEntityId, AnimalComponent)
              ) {
                EncounterTracker.recordExchange(
                  world,
                  proj.sourceEntityId,
                  proj.targetEntityId,
                  finalDmg,
                  world.getCurrentTick()
                );
              }
            }
          }
        }

        // Hủy thực thể đạn đạo
        world.destroyEntity(pEnt);
      } else {
        // Di chuyển đạn đạo
        pos.x += (dx / dist) * step;
        pos.y += (dy / dist) * step;
      }
    }
  }
}
