import { maintainSocialAssistance, registerSelfDefense, setCombatIntent } from './CombatIntentService.ts';
import { captureRescueCandidates, recordRescueThreat, resolveRescueKill } from '../social/RescueEvidenceService.ts';
import { RESIDENT_STARVATION_THRESHOLD } from '../beings/BeingComponents.ts';
import { System } from '../../ecs/System.ts';
import { ECSWorld } from '../../ecs/World.ts';
import { EventBus } from '../../core/EventBus.ts';
import { WorldMap } from '../world/WorldMap.ts';
import {
  PositionComponent,
  HealthComponent,
  RealmComponent,
  NameComponent,
  RaceComponent,
  CharacterStateComponent,
  HungerComponent,
  LifespanComponent,
  CharacterHistoryComponent,
  CultivationTechniqueComponent
} from '../beings/BeingComponents.ts';
import { EquipmentComponent, CombatStatsComponent, ProjectileComponent } from './CombatComponents.ts';
import { BehaviorTreeExecutor } from '../ai/brain/behavior/BehaviorTree.ts';
import { AIBehaviorTreeComponent, AIPlannerComponent } from '../ai/brain/AIComponents.ts';
import { handleBondBetrayal } from '../social/RelationshipService.ts';
import { SocialInteractionSystem } from '../social/SocialInteractionSystem.ts';
import { MemoryComponent } from '../social/SocialComponents.ts';
import { InsideBuildingComponent, MemberComponent } from '../factions/FactionComponents.ts';
import { DiplomacySystem } from '../factions/DiplomacySystem.ts';
import { AnimalBrainComponent, AnimalComponent } from '../animals/AnimalComponents.ts';
import { AnimalMovement } from '../animals/AnimalMovement.ts';

import { SpatialGrid } from '../../core/SpatialGrid.ts';
import { EncounterTracker } from '../talent/EncounterTracker.ts';

export class CombatSystem implements System {
  public name = 'CombatSystem';
  public enabled = true;
  public priority = 32;

  public spatialGrid: SpatialGrid | null = null;
  public worldMap: WorldMap | null = null;
  public diplomacySystem: DiplomacySystem | null = null;
  private fallbackDiplomacy = new DiplomacySystem();
  private eventBus = EventBus.getInstance();

  constructor(worldMap?: WorldMap, diplomacySystem?: DiplomacySystem) {
    if (worldMap) this.worldMap = worldMap;
    if (diplomacySystem) this.diplomacySystem = diplomacySystem;
  }

  private getDiplomacy(world: ECSWorld): DiplomacySystem {
    return this.diplomacySystem ?? world.getSystem<DiplomacySystem>('DiplomacySystem') ?? this.fallbackDiplomacy;
  }

  public update(world: ECSWorld, dt: number): void {
    // Cập nhật thời hạn buff chiến đấu cho tất cả thực thể có chỉ số chiến đấu
    const combatants = world.query([CombatStatsComponent]);
    for (const cEnt of combatants) {
      const cStats = world.getComponent(cEnt, CombatStatsComponent)!;
      if (cStats.buffTimer > 0) {
        cStats.buffTimer = Math.max(0, cStats.buffTimer - dt);
        if (cStats.buffTimer <= 0) {
          cStats.buffTimer = 0;
          cStats.buffDamageMultiplier = 1.0;
        }
      }
    }

    const fighters = world.query([PositionComponent, HealthComponent, CharacterStateComponent]);
    const diplomacy = this.getDiplomacy(world);

    for (const ent of fighters) {
      if (world.hasComponent(ent, InsideBuildingComponent)) continue;
      const pos = world.getComponent(ent, PositionComponent)!;
      const hp = world.getComponent(ent, HealthComponent)!;
      const stateComp = world.getComponent(ent, CharacterStateComponent)!;
      const race = world.getComponent(ent, RaceComponent);
      const equip = world.getComponent(ent, EquipmentComponent);
      const stats = world.getComponent(ent, CombatStatsComponent);
      const realm = world.getComponent(ent, RealmComponent);
      const name = world.getComponent(ent, NameComponent);
      const hunger = world.getComponent(ent, HungerComponent);
      const animalBrain = world.getComponent(ent, AnimalBrainComponent);

      if (hp.isDead || realm?.isBreakingThrough) continue;

      if (maintainSocialAssistance(world, ent)) continue;
      // Cập nhật cooldown
      if (stats && stats.currentCooldown > 0) {
        stats.currentCooldown -= dt;
      }

      // Đồng bộ mục tiêu săn mồi cho động vật ở trạng thái hunt
      if (animalBrain && animalBrain.state === 'hunt' && animalBrain.targetEntityId !== null && stats) {
        setCombatIntent(world, ent, animalBrain.targetEntityId, 'autonomous');
      }

      // 1. TÌM MỤC TIÊU (Yêu tộc đói săn động vật hoặc Ma tộc tìm địch lân cận)
      let targetId: number | null = stats?.targetEntityId ?? null;

      if (targetId === null) {
        const isPredator = (race?.raceId === 'beast' && hunger && hunger.current < 45) || race?.raceId === 'demon';
        if (isPredator) {
          targetId = this.findNearbyTarget(world, ent, pos, 90, race?.raceId, diplomacy);
          if (stats && targetId !== null) {
            setCombatIntent(world, ent, targetId, 'autonomous');
          }
        }
      }

      if (targetId === null) continue;

      // Kiểm tra quan hệ đồng minh để không đánh nhầm đồng môn / đồng minh
      const memSelf = world.getComponent(ent, MemberComponent);
      const memTarget = world.getComponent(targetId, MemberComponent);
      if (memSelf?.factionId && memTarget?.factionId) {
        if (diplomacy.getRelation(memSelf.factionId, memTarget.factionId, world) === 'allied') {
          if (stats) stats.targetEntityId = null;
          continue;
        }
      }

      const targetPos = world.getComponent(targetId, PositionComponent);
      const targetHp = world.getComponent(targetId, HealthComponent);
      const targetName = world.getComponent(targetId, NameComponent);

      if (!targetPos || !targetHp || targetHp.isDead) {
        if (stats) stats.targetEntityId = null;
        if (animalBrain && animalBrain.targetEntityId === targetId) {
          animalBrain.targetEntityId = null;
          if (animalBrain.state === 'hunt') {
            animalBrain.state = 'idle';
          }
        }
        continue;
      }

      const dx = targetPos.x - pos.x;
      const dy = targetPos.y - pos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      const effectiveRange = equip ? equip.getEffectiveRange() : (stats?.attackRange ?? 22);

      // 2. NẾU TRONG TẦM TẤN CÔNG
      if (dist <= effectiveRange) {
        // Hướng mặt về phía mục tiêu
        stateComp.direction = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');

        if (stats && stats.currentCooldown <= 0) {
          this.executeAttack(world, ent, targetId, pos, targetPos, equip, realm, name, targetName, targetHp);
          const attackSpeed = equip ? equip.getEffectiveAttackSpeed() : (stats.attackSpeed || 1.0);
          if (stats) stats.currentCooldown = 1 / Math.max(0.1, attackSpeed);
          stateComp.state = 'attack';
          stateComp.stateTimer = 0;
        }
      } else {
        // 3. NẾU NGOÀI TẦM -> TIẾP CẬN MỤC TIÊU QUA BỘ ĐIỀU KHIỂN DI CHUYỂN A* THỐNG NHẤT
        // Nếu AI đang chủ động bỏ chạy (FLEE_FROM_TARGET), không kéo ngược thực thể lại
        const planner = world.getComponent(ent, AIPlannerComponent);
        if (planner && planner.planStatus === 'executing' && planner.getCurrentStep()?.type === 'FLEE_FROM_TARGET') {
          if (stats) stats.targetEntityId = null;
          continue;
        }
        if (animalBrain && animalBrain.state === 'flee') {
          if (stats) stats.targetEntityId = null;
          continue;
        }

        // Nếu hệ thống AI (ThreeTierAISystem hoặc AnimalMovementSystem) đã di chuyển thực thể này trong cùng tick thì không di chuyển lần 2
        if (!BehaviorTreeExecutor.hasMovedThisTick(ent)) {
          if (world.hasComponent(ent, AnimalComponent)) {
            if (this.worldMap) {
              AnimalMovement.moveTowards(
                world,
                this.worldMap,
                ent,
                targetPos.x,
                targetPos.y,
                dt,
                effectiveRange
              );
            }
          } else {
            BehaviorTreeExecutor.moveEntityTowards(
              world,
              ent,
              pos,
              stateComp,
              { x: targetPos.x, y: targetPos.y },
              effectiveRange,
              this.worldMap,
              dt,
              undefined,
              false
            );
          }
        }
      }
    }

    EncounterTracker.update(world, world.getCurrentTick());

    // Đặt lại cờ di chuyển sau khi hoàn tất lượt CombatSystem (hỗ trợ cả khi gọi CombatSystem độc lập)
    BehaviorTreeExecutor.beginTick();
  }

  private findNearbyTarget(
    world: ECSWorld,
    selfId: number,
    selfPos: PositionComponent,
    radius: number,
    selfRaceId?: string,
    diplomacy?: DiplomacySystem
  ): number | null {
    let nearestId: number | null = null;
    let minDist = radius;
    const selfMem = world.getComponent(selfId, MemberComponent);

    if (this.spatialGrid) {
      const nearby = this.spatialGrid.queryRadius(selfPos.x, selfPos.y, radius);
      for (let i = 0; i < nearby.length; i++) {
        const item = nearby[i];
        const other = item.id;
        if (other === selfId) continue;
        const oHp = world.getComponent(other, HealthComponent);
        if (!oHp || oHp.isDead) continue;

        if (selfMem?.factionId && diplomacy) {
          const otherMem = world.getComponent(other, MemberComponent);
          if (otherMem?.factionId && diplomacy.getRelation(selfMem.factionId, otherMem.factionId, world) === 'allied') {
            continue;
          }
        }

        if (selfRaceId === 'beast') {
          // Yêu tộc săn mồi tìm động vật bình thường (AnimalComponent)
          if (!world.hasComponent(other, AnimalComponent)) continue;
        } else {
          const oRace = world.getComponent(other, RaceComponent);
          if (!oRace || oRace.raceId === selfRaceId) continue;
        }

        const dx = item.x - selfPos.x;
        const dy = item.y - selfPos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < minDist) {
          minDist = dist;
          nearestId = other;
        }
      }
      return nearestId;
    }

    if (selfRaceId === 'beast') {
      const animals = world.query([PositionComponent, HealthComponent, AnimalComponent]);
      for (const other of animals) {
        if (other === selfId) continue;
        const oHp = world.getComponent(other, HealthComponent)!;
        if (oHp.isDead) continue;

        const oPos = world.getComponent(other, PositionComponent)!;
        const dx = oPos.x - selfPos.x;
        const dy = oPos.y - selfPos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < minDist) {
          minDist = dist;
          nearestId = other;
        }
      }
      return nearestId;
    }

    const candidates = world.query([PositionComponent, HealthComponent, RaceComponent]);
    for (const other of candidates) {
      if (other === selfId) continue;
      const oHp = world.getComponent(other, HealthComponent)!;
      if (oHp.isDead) continue;

      if (selfMem?.factionId && diplomacy) {
        const otherMem = world.getComponent(other, MemberComponent);
        if (otherMem?.factionId && diplomacy.getRelation(selfMem.factionId, otherMem.factionId, world) === 'allied') {
          continue;
        }
      }

      const oRace = world.getComponent(other, RaceComponent)!;
      if (oRace.raceId === selfRaceId) {
        continue;
      }

      const oPos = world.getComponent(other, PositionComponent)!;
      const dx = oPos.x - selfPos.x;
      const dy = oPos.y - selfPos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < minDist) {
        minDist = dist;
        nearestId = other;
      }
    }

    return nearestId;
  }

  private executeAttack(
    world: ECSWorld,
    attackerId: number,
    targetId: number,
    pos: PositionComponent,
    targetPos: PositionComponent,
    equip: EquipmentComponent | undefined,
    realm: RealmComponent | undefined,
    name: NameComponent | undefined,
    targetName: NameComponent | undefined,
    targetHp: HealthComponent
  ): void {
    const mainWeapon = equip?.mainHand;
    const isDual = equip ? equip.isDualWielding() : false;
    const attackerStats = world.getComponent(attackerId, CombatStatsComponent);
    const targetStats = world.getComponent(targetId, CombatStatsComponent);
    const targetEquip = world.getComponent(targetId, EquipmentComponent);

    // 1. TÍNH SÁT THƯƠNG GỐC CỦA NGƯỜI TẤN CÔNG
    // Tác nhân không có RealmComponent thì không cộng combatPower cảnh giới
    const attackerBaseAtk = attackerStats?.baseAtk ?? 12;
    const weaponDmg = mainWeapon ? mainWeapon.baseDamage : (equip?.workTool ? equip.workTool.baseDamage : 0);
    const realmDmg = realm ? Math.floor(realm.combatPower * 0.15) : 0;

    // Gia trì lực chiến từ công pháp và cấp độ thông thạo
    const attackerTech = world.getComponent(attackerId, CultivationTechniqueComponent);
    let techDmgMult = 1.0;
    if (attackerTech) {
      techDmgMult += (attackerTech.getMasteryMultiplier() - 1.0) * 0.25;
      attackerTech.addMasteryExp(0.6); // Thực chiến giúp mài giũa công pháp
    }

    const rawBaseDmg = Math.floor((attackerBaseAtk + weaponDmg + realmDmg) * techDmgMult);
    const buffMult = (attackerStats && attackerStats.buffTimer > 0)
      ? Math.max(0.1, attackerStats.buffDamageMultiplier || 1.0)
      : 1.0;
    const buffedBaseDmg = Math.floor(rawBaseDmg * buffMult);

    const critChance = (attackerStats?.critRate ?? 0.05) + (mainWeapon?.critChance ?? 0);
    const isCrit = Math.random() < critChance;
    const critMult = isCrit ? (attackerStats?.critDamage ?? 1.5) : 1.0;
    let totalDmg = Math.floor(buffedBaseDmg * critMult);

    // A. TẤN CÔNG TẦM XA (Bắn Cung / Phóng Phi Đao / Quạt Phong Nhận)
    if (mainWeapon && mainWeapon.projectileType) {
      const projEnt = world.createEntity();
      world.addComponent(projEnt, new PositionComponent(pos.x, pos.y, 0));
      world.addComponent(
        projEnt,
        new ProjectileComponent(
          attackerId,
          targetId,
          targetPos.x,
          targetPos.y,
          totalDmg,
          isCrit,
          340,
          mainWeapon.projectileType
        )
      );
      return;
    }

    // B. TẤN CÔNG CẬN CHIẾN (Đao, Kiếm, Côn...)
    // 2. KIỂM TRA THÂN PHÁP NÉ ĐÒN CHỦ ĐỘNG (ACTIVE DODGE) — chỉ khi mục tiêu có AIBehaviorTreeComponent
    if (
      world.hasComponent(targetId, AIBehaviorTreeComponent) &&
      BehaviorTreeExecutor.tryActiveDodge(world, targetId, { x: pos.x, y: pos.y })
    ) {
      return; // Né đòn thành công với thân pháp lướt né, không chịu bất kỳ sát thương nào!
    }

    const targetDodge = Math.min(0.85, targetStats?.dodgeRate ?? 0.05);
    if (Math.random() < targetDodge * 0.5) {
      this.eventBus.emit('combat:floating_text', {
        x: targetPos.x,
        y: targetPos.y,
        text: 'Né Đòn! 💨',
        color: '#74c0fc',
        isCrit: false
      });
      return;
    }

    // Kiểm tra kỹ năng vũ khí hiếm (Rare Skill)
    if (mainWeapon?.specialSkill && Math.random() < mainWeapon.specialSkill.procChance) {
      const skill = mainWeapon.specialSkill;
      totalDmg = Math.floor(totalDmg * skill.damageMultiplier);

      this.eventBus.emit('combat:floating_text', {
        x: targetPos.x,
        y: targetPos.y,
        text: `⚡ ${skill.name}!`,
        color: '#ffd43b',
        isCrit: true
      });
    }

    let offHandDmg = 0;
    // Nếu SONG TRÌ 2 TAY (Dual Wielding): tung thêm đòn chém thứ hai bằng tay phụ!
    if (isDual && equip?.offHand) {
      offHandDmg = Math.floor(equip.offHand.baseDamage * 0.75 * buffMult);

      this.eventBus.emit('combat:slash_vfx', {
        x: (pos.x + targetPos.x) / 2 + 4,
        y: (pos.y + targetPos.y) / 2 - 4,
        angle: Math.atan2(targetPos.y - pos.y, targetPos.x - pos.x) + 0.35,
        color: equip.offHand.glowColor || '#fab005'
      });
    }

    // Vệt chém tay chính
    this.eventBus.emit('combat:slash_vfx', {
      x: (pos.x + targetPos.x) / 2,
      y: (pos.y + targetPos.y) / 2,
      angle: Math.atan2(targetPos.y - pos.y, targetPos.x - pos.x),
      color: mainWeapon?.glowColor || '#ffffff'
    });

    // 3. GIẢM TRỪ SÁT THƯƠNG QUA PHÒNG THỦ & CHỈ SỐ GIÁP: Sát thương = Sát thương * 50 / (50 + Giáp)
    const targetDefense = Math.max(0, targetStats?.defense ?? 0);
    const targetArmor = Math.max(0, (targetStats?.armor ?? 0) + (targetEquip?.getTotalArmorBonus() ?? 0));

    const mainPostDefenseDmg = Math.max(1, totalDmg - targetDefense);
    const offPostDefenseDmg = offHandDmg > 0 ? Math.max(1, offHandDmg - targetDefense) : 0;
    const postDefenseDmg = mainPostDefenseDmg + offPostDefenseDmg;

    const finalDmg = Math.max(1, Math.floor(postDefenseDmg * (50 / (50 + targetArmor))));

    const hpBeforeHit = targetHp.current;
    const rescueCandidates = finalDmg >= hpBeforeHit ? captureRescueCandidates(world, targetId) : [];
    handleBondBetrayal(world, attackerId, targetId, Math.min(targetHp.current, finalDmg));
    targetHp.current = Math.max(0, targetHp.current - finalDmg);
    recordRescueThreat(world, targetId, attackerId);
    registerSelfDefense(world, targetId, attackerId);

    // Nếu mục tiêu là động vật còn sống, đánh dấu mối đe dọa để AI động vật có thể chạy trốn / phản ứng
    const targetAnimalBrain = world.getComponent(targetId, AnimalBrainComponent);
    if (targetAnimalBrain && targetHp.current > 0) {
      targetAnimalBrain.threatEntityId = attackerId;
      targetAnimalBrain.decisionTimer = 0;
    }

    // Ghi nhớ ký ức bị tấn công và cập nhật quan hệ thù địch (chỉ giữa cư dân/tu sĩ, không áp dụng cho động vật)
    if (
      !world.hasComponent(attackerId, AnimalComponent) &&
      !world.hasComponent(targetId, AnimalComponent)
    ) {
      SocialInteractionSystem.handleCombatAttack(world, attackerId, targetId, world.calendarDayFloorAtTick());
    }

    this.eventBus.emit('combat:floating_text', {
      x: targetPos.x,
      y: targetPos.y,
      text: `-${finalDmg}`,
      color: isCrit ? '#ffd43b' : '#ff6b6b',
      isCrit
    });

    if (targetHp.current <= 0) {
      targetHp.isDead = true;
      resolveRescueKill(world, attackerId, targetId, hpBeforeHit, rescueCandidates);
      const targetState = world.getComponent(targetId, CharacterStateComponent);
      if (targetState) targetState.state = 'dead';

      // Nếu Yêu tộc săn mồi hạ gục động vật thì được hồi no
      const attackerRace = world.getComponent(attackerId, RaceComponent);
      const attackerHunger = world.getComponent(attackerId, HungerComponent);
      if (
        attackerRace?.raceId === 'beast' &&
        attackerHunger &&
        world.hasComponent(targetId, AnimalComponent)
      ) {
        attackerHunger.current = Math.min(100, attackerHunger.current + 45);
        attackerHunger.isStarving = attackerHunger.current < RESIDENT_STARVATION_THRESHOLD;
      }

      // Ghi chép Biên Niên Sử cho cư dân/tu sĩ (bỏ qua nếu đối phương là động vật bình thường)
      if (!world.hasComponent(targetId, AnimalComponent) && !world.hasComponent(attackerId, AnimalComponent)) {
        const attackerLife = world.getComponent(attackerId, LifespanComponent);
        const targetLife = world.getComponent(targetId, LifespanComponent);
        const attackerHist = world.getComponent(attackerId, CharacterHistoryComponent);
        const targetHist = world.getComponent(targetId, CharacterHistoryComponent);

        if (attackerHist) {
          attackerHist.addRecord(
            attackerLife?.currentAge ?? 20,
            'battle',
            '⚔️ Trảm Sát Cường Địch',
            `Huyết chiến chém rớt [${targetName?.name ?? 'Kẻ địch'}], danh chấn nhất phương!`
          );
        }
        const attackerMem = world.getComponent(attackerId, MemoryComponent);
        if (attackerMem) {
          attackerMem.addMemory(
            'defeated_enemy',
            `Trảm sát [${targetName?.name ?? 'Kẻ địch'}] trong trận huyết chiến, tâm cảnh thông suốt!`,
            4,
            50,
            targetId,
            targetName?.name ?? 'Kẻ địch'
          );
        }
        if (targetHist) {
          targetHist.addRecord(
            targetLife?.currentAge ?? 20,
            'death',
            '⚰️ Tử Trận Sa Trường',
            `Bị [${name?.name ?? 'Kẻ địch'}] kích sát trong trận tử chiến hung hiểm.`
          );
        }
      }
    }

    if (
      !world.hasComponent(attackerId, AnimalComponent) &&
      !world.hasComponent(targetId, AnimalComponent)
    ) {
      EncounterTracker.recordExchange(world, attackerId, targetId, finalDmg, world.getCurrentTick());
    }
  }
}
