import { performConversation } from './SocialConversationService.ts';
import { claimRescueLife, pruneRescueEvidence, RescueResult } from './RescueEvidenceService.ts';
import { getSocialCooldownRemainingDays, performSocialInteraction, performCombatSocialInteraction } from './SocialInteractionService.ts';
import { SOCIAL_CONFIG } from '../../config/social.config.ts';
import { evaluateCompanionBond, evaluateMentorship, isLivingSocialParticipant, isActiveBondBetween } from './RelationshipRules.ts';
import { updateBondConflicts, attemptCompanionBond, attemptMentorship, attemptSwornBond, recordHostility } from './RelationshipService.ts';
import { ECSWorld } from '../../ecs/World.ts';
import { System } from '../../ecs/System.ts';
import { EventBus } from '../../core/EventBus.ts';
import { PositionComponent, LifespanComponent, NameComponent, HealthComponent, RealmComponent, CultivationTechniqueComponent } from '../beings/BeingComponents.ts';
import { SocialRelationshipComponent, MemoryComponent } from './SocialComponents.ts';
import { InventoryComponent } from '../alchemy/InventoryComponent.ts';
import { AnimalCarcassComponent, AnimalComponent } from '../animals/AnimalComponents.ts';

import { SpatialGrid } from '../../core/SpatialGrid.ts';

export class SocialInteractionSystem implements System {
  public name = 'SocialInteractionSystem';
  public enabled = true;
  public priority = 34;

  public spatialGrid: SpatialGrid | null = null;
  private world!: ECSWorld;
  private eventBus: EventBus;
  private timer: number = 0;
  private static readonly CHECK_INTERVAL = 1.8; // Quét giao lưu xã hội mỗi 1.8 giây

  constructor() {
    this.eventBus = EventBus.getInstance();
  }

  public init(world: ECSWorld): void {
    this.world = world;
    this.reset();
  }

  public reset(): void {
    this.timer = 0;
  }

  public update(world: ECSWorld, dt: number): void {
    this.world = world;
    this.timer += dt;

    // 1. Phai mờ ký ức thứ yếu theo thời gian
    const beingsWithMemory = world.query([MemoryComponent]);
    for (const ent of beingsWithMemory) {
      const memComp = world.getComponent(ent, MemoryComponent)!;
      for (let i = memComp.memories.length - 1; i >= 0; i--) {
        const mem = memComp.memories[i];
        if (mem.importance < 5) {
          mem.decayTimer -= dt;
          if (mem.decayTimer <= 0) {
            memComp.memories.splice(i, 1);
          }
        }
      }
    }

    if (this.timer < SocialInteractionSystem.CHECK_INTERVAL) return;
    this.timer = 0;
    updateBondConflicts(world);

    const currentDay = world.calendarDayFloorAtTick();
    const calendarDay = world.calendarDaysAtTick();
    for (const entity of world.query([SocialRelationshipComponent])) {
      world.getComponent(entity, SocialRelationshipComponent)!.pruneExpiredCooldowns(calendarDay);
      pruneRescueEvidence(world, entity);
    }

    // 2. Quét các cặp cư dân ở gần nhau để kích hoạt tương tác xã hội
    const entities = this.world.query([PositionComponent, NameComponent, SocialRelationshipComponent, MemoryComponent]);

    if (this.spatialGrid) {
      for (let i = 0; i < entities.length; i++) {
        const entA = entities[i];
        const posA = this.world.getComponent(entA, PositionComponent)!;
        const nameA = this.world.getComponent(entA, NameComponent)!.name;
        const relA = this.world.getComponent(entA, SocialRelationshipComponent)!;
        const memA = this.world.getComponent(entA, MemoryComponent)!;

        const nearby = this.spatialGrid.queryRadius(posA.x, posA.y, 55);
        for (let k = 0; k < nearby.length; k++) {
          const entB = nearby[k].id;
          if (entB <= entA) continue; // Tránh trùng cặp và bỏ qua chính mình
          const posB = this.world.getComponent(entB, PositionComponent);
          const nameBComp = this.world.getComponent(entB, NameComponent);
          const relB = this.world.getComponent(entB, SocialRelationshipComponent);
          const memB = this.world.getComponent(entB, MemoryComponent);

          if (!posB || !nameBComp || !relB || !memB) continue;
          if (Math.hypot(posA.x - posB.x, posA.y - posB.y) > 55) continue;
          this.handleProximityEncounter(entA, entB, nameA, nameBComp.name, relA, relB, memA, memB, currentDay);
        }
      }
    } else {
      // Fallback khi không có spatialGrid
      for (let i = 0; i < entities.length; i++) {
        const entA = entities[i];
        const posA = this.world.getComponent(entA, PositionComponent)!;
        const nameA = this.world.getComponent(entA, NameComponent)!.name;
        const relA = this.world.getComponent(entA, SocialRelationshipComponent)!;
        const memA = this.world.getComponent(entA, MemoryComponent)!;

        for (let j = i + 1; j < entities.length; j++) {
          const entB = entities[j];
          const posB = this.world.getComponent(entB, PositionComponent)!;
          const nameB = this.world.getComponent(entB, NameComponent)!.name;
          const relB = this.world.getComponent(entB, SocialRelationshipComponent)!;
          const memB = this.world.getComponent(entB, MemoryComponent)!;

          const dist = Math.hypot(posA.x - posB.x, posA.y - posB.y);
          if (dist > 55) continue; // Ngoài cự ly giao lưu trực tiếp

          this.handleProximityEncounter(entA, entB, nameA, nameB, relA, relB, memA, memB, currentDay);
        }
      }
    }
  }

  /**
   * Xử lý cuộc gặp gỡ và giao tiếp giữa 2 nhân vật
   */
  private handleProximityEncounter(
    entA: number,
    entB: number,
    nameA: string,
    nameB: string,
    relA: SocialRelationshipComponent,
    relB: SocialRelationshipComponent,
    memA: MemoryComponent,
    memB: MemoryComponent,
    currentDay: number
  ): void {
    if (!isLivingSocialParticipant(this.world, entA) || !isLivingSocialParticipant(this.world, entB)) return;
    const recordAtoB = relA.getRelationship(entB);
    const affinityA = recordAtoB ? recordAtoB.affinity : 0;

    const techA = this.world.getComponent(entA, CultivationTechniqueComponent);
    const techB = this.world.getComponent(entB, CultivationTechniqueComponent);
    const recordBtoA = relB.getRelationship(entA);
    const affinityB = recordBtoA?.affinity ?? 0;

    // Xét hai hướng; chọn người nhận có tỷ lệ HP thấp nhất, tối đa một viên mỗi cuộc gặp.
    const healingCandidates = [
      { giver: entA, receiver: entB, giverName: nameA, receiverName: nameB, giverRel: relA, receiverRel: relB, giverMem: memA, receiverMem: memB },
      { giver: entB, receiver: entA, giverName: nameB, receiverName: nameA, giverRel: relB, receiverRel: relA, giverMem: memB, receiverMem: memA },
    ].filter(candidate => {
      const hp = this.world.getComponent(candidate.receiver, HealthComponent);
      const inventory = this.world.getComponent(candidate.giver, InventoryComponent);
      return hp && hp.max > 0 && hp.current < hp.max * 0.45 && inventory?.hasPill('hoi_xuan_dan') &&
        (candidate.giverRel.getRelationship(candidate.receiver)?.affinity ?? 0) >= 20;
    }).sort((left, right) => {
      const hpLeft = this.world.getComponent(left.receiver, HealthComponent)!;
      const hpRight = this.world.getComponent(right.receiver, HealthComponent)!;
      return hpLeft.current / hpLeft.max - hpRight.current / hpRight.max || left.receiver - right.receiver;
    });
    const healing = healingCandidates[0];
    if (healing) {
      const result = performSocialInteraction(this.world, entA, entB, 'healing', () => {
        const inventory = this.world.getComponent(healing.giver, InventoryComponent)!;
        if (!inventory.consumePill('hoi_xuan_dan')) return false;
        const hp = this.world.getComponent(healing.receiver, HealthComponent)!;
        hp.current = Math.min(hp.max, hp.current + 60);
        healing.giverRel.adjustScores(healing.receiver, healing.receiverName, 15, 20, 0);
        healing.receiverRel.adjustScores(healing.giver, healing.giverName, 40, 30, 15);
        healing.giverRel.updateOrdinaryLabel(healing.receiver);
        healing.receiverRel.updateOrdinaryLabel(healing.giver);
        healing.giverMem.addMemory('helped', `Đã trao tặng Hồi Xuân Đan cứu chữa thương thế cho ${healing.receiverName}`, 3, 20, healing.receiver, healing.receiverName, currentDay);
        healing.receiverMem.addMemory('helped', `Được ${healing.giverName} kịp thời tặng đan dược cứu chữa!`, 4, 80, healing.giver, healing.giverName, currentDay);
        return true;
      });
      if (result.status === 'performed') {
        this.eventBus.emit('social:speech', { entityId: healing.receiver, text: `Nhận Đan Trị Thương Từ ${healing.giverName} 💊✨`, color: '#38d9a9' });
        return;
      }
    }

    // =========================================================================
    // TRƯỜNG HỢP 2: KẾT NGHĨA ĐẠO LỮ (DAO COMPANION) KHI HẢO CẢM CỰC CAO
    // =========================================================================
    const bothAdults = (this.world.getComponent(entA,LifespanComponent)?.currentAge ?? 0) >= SOCIAL_CONFIG.companion.minAge && (this.world.getComponent(entB,LifespanComponent)?.currentAge ?? 0) >= SOCIAL_CONFIG.companion.minAge;
    if (bothAdults && Math.max(affinityA, affinityB) >= SOCIAL_CONFIG.companion.minAffinity) {
      const eligibility = evaluateCompanionBond(this.world, entA, entB);
      if (eligibility.status === 'eligible') {
        const result = attemptCompanionBond(this.world, affinityA >= affinityB ? entA : entB, affinityA >= affinityB ? entB : entA);
        if (result.status === 'created') {
          memA.addMemory('became_companions', `Cùng ${nameB} dưới vòm trời thề nguyện kết bái Đạo Lữ, sinh tử bên nhau!`, 5, 100, entB, nameB, currentDay);
          memB.addMemory('became_companions', `Cùng ${nameA} dưới vòm trời thề nguyện kết bái Đạo Lữ, sinh tử bên nhau!`, 5, 100, entA, nameA, currentDay);

          this.eventBus.emit('chronicle:entry', {
            category: 'social',
            message: `💖 [Thiên Đạo Ban Duyên] Chúc phúc đạo lữ! [${nameA}] và [${nameB}] đã thề nguyện kết bái Đạo Lữ, cùng bước trên con đường trường sinh!`,
            importance: 'high'
          });

          this.eventBus.emit('social:speech', {
            entityId: entA,
            text: `💖 Kết Duyên Đạo Lữ Với ${nameB}!`,
            color: '#f472b6'
          });
          this.eventBus.emit('social:speech', {
            entityId: entB,
            text: `💖 Kết Duyên Đạo Lữ Với ${nameA}!`,
            color: '#f472b6'
          });
          return;
        }
      }
    }

    // =========================================================================
    // TRƯỜNG HỢP 3: SƯ ĐỒ CHỈ ĐIỂM (MASTER IMPARTS KNOWLEDGE)
    // =========================================================================
    if (isActiveBondBetween(this.world, entA, entB, 'master') ||
        isActiveBondBetween(this.world, entA, entB, 'disciple')) {
      const isMasterA = recordAtoB?.relationType === 'disciple'; // A là sư phụ của B
      const discipleEnt = isMasterA ? entB : entA;
      const discipleTech = isMasterA ? techB : techA;

      if (discipleTech && getSocialCooldownRemainingDays(this.world, entA, entB, 'teaching') === 0 && Math.random() < 0.35) {
        const expGained = Math.floor(Math.random() * 20 + 15);
        const result = performSocialInteraction(this.world, entA, entB, 'teaching', () => {
          discipleTech.masteryExp += expGained;
          return true;
        });
        if (result.status === 'performed') {
          this.eventBus.emit('social:speech', {
            entityId: discipleEnt,
            text: `Được Sư Tôn Chỉ Điểm (+${expGained} EXP) 📜✨`,
            color: '#fbbf24'
          });
          return;
        }
      }
    }

    // =========================================================================
    // TRƯỜNG HỢP 4: BÁI SƯ THU ĐỒ (BECOME MASTER & DISCIPLE)
    // =========================================================================
    const realmA = this.world.getComponent(entA, RealmComponent);
    const realmB = this.world.getComponent(entB, RealmComponent);
    const master = realmA && realmB && realmA.stageIndex >= SOCIAL_CONFIG.mentorship.minTeacherStage && realmB.stageIndex === SOCIAL_CONFIG.mentorship.learnerStage ? entA
      : realmA && realmB && realmB.stageIndex >= SOCIAL_CONFIG.mentorship.minTeacherStage && realmA.stageIndex === SOCIAL_CONFIG.mentorship.learnerStage ? entB : null;
    if (master !== null) {
      const disciple = master === entA ? entB : entA;
      const eligibility = evaluateMentorship(this.world, master, disciple);
      if (eligibility.status === 'eligible') {
        const result = attemptMentorship(this.world, master, disciple);
        if (result.status === 'created') {
          const masterName = master === entA ? nameA : nameB;
          const discipleName = disciple === entA ? nameA : nameB;
          const masterMemory = master === entA ? memA : memB;
          const discipleMemory = disciple === entA ? memA : memB;
          masterMemory.addMemory('became_disciples', `Thu nhận [${discipleName}] làm môn hạ Đồ Đệ`, 4, 60, disciple, discipleName, currentDay);
          discipleMemory.addMemory('became_disciples', `Chính thức bái [${masterName}] làm Sư Tôn!`, 5, 90, master, masterName, currentDay);
          this.eventBus.emit('chronicle:entry', { category: 'social', message: `👑 [Sư Đồ Truyền Thừa] [${discipleName}] đã bái [${masterName}] làm Sư Tôn!`, importance: 'medium' });
          this.eventBus.emit('social:speech', { entityId: disciple, text: `Dập Đầu Bái ${masterName} Làm Sư Tôn 🙏`, color: '#ffd700' });
          return;
        }
      }
    }

    // Kết nghĩa được thử sau đạo lữ/sư đồ; dùng cùng khóa bondAttempt.
    const sworn = attemptSwornBond(this.world, entA, entB);
    if (sworn.status === 'created') {
      memA.addMemory('helped', `Cùng ${nameB} kết nghĩa kim lan, nguyện tương trợ trên đường tu hành`, 4, 70, entB, nameB, currentDay);
      memB.addMemory('helped', `Cùng ${nameA} kết nghĩa kim lan, nguyện tương trợ trên đường tu hành`, 4, 70, entA, nameA, currentDay);
      this.eventBus.emit('chronicle:entry', {
        category: 'social', message: `⚔️ [Kim Lan Kết Nghĩa] [${nameA}] và [${nameB}] đã kết nghĩa tri kỷ!`, importance: 'medium',
      });
      this.eventBus.emit('social:speech', { entityId: entA, text: `Kết Nghĩa Kim Lan Với ${nameB} ⚔️`, color: '#fbbf24' });
      this.eventBus.emit('social:speech', { entityId: entB, text: `Kết Nghĩa Kim Lan Với ${nameA} ⚔️`, color: '#fbbf24' });
      return;
    }

    // =========================================================================
    // TRƯỜNG HỢP 5: CỪU ĐỊCH CHẠM MẶT (CONFRONT ENEMY)
    // =========================================================================
    if (recordAtoB?.relationType === 'enemy' || affinityA <= -50 || recordBtoA?.relationType === 'enemy' || affinityB <= -50) {
      if (Math.random() < 0.3) {
        const insults = [
          'Nghiệt chướng, còn dám xuất hiện trước mặt ta! 💢',
          'Nợ máu năm xưa, hôm nay phải tính đủ! ⚔️',
          'Chớ có đắc ý, ngày tàn của ngươi không xa! 💀'
        ];
        const text = insults[Math.floor(Math.random() * insults.length)];
        this.eventBus.emit('social:speech', {
          entityId: affinityA <= affinityB ? entA : entB,
          text,
          color: '#ef4444'
        });
      }
      return;
    }

    // =========================================================================
    // TRƯỜNG HỢP 6: LUẬN ĐẠO & HÀN HUYÊN THÔNG THƯỜNG (CASUAL DAO CHAT)
    // =========================================================================
    if (getSocialCooldownRemainingDays(this.world, entA, entB, 'communication') === 0 && Math.random() < 0.22) {
      performConversation(this.world, entA, entB, techA && techB ? 'cultivation' : 'casual');
    }
  }

  /**
   * Ghi nhớ sự kiện bị tấn công trong chiến đấu
   */
  public static handleCombatAttack(
    world: ECSWorld,
    attackerEnt: number,
    targetEnt: number,
    currentDay: number = world.calendarDayFloorAtTick()
  ): void {
    if (
      world.hasComponent(attackerEnt, AnimalComponent) ||
      world.hasComponent(attackerEnt, AnimalCarcassComponent) ||
      world.hasComponent(targetEnt, AnimalComponent) ||
      world.hasComponent(targetEnt, AnimalCarcassComponent)
    ) {
      return;
    }
    const targetHealth = world.getComponent(targetEnt, HealthComponent);
    if (attackerEnt === targetEnt || !isLivingSocialParticipant(world, attackerEnt) ||
        !targetHealth || targetHealth.isDead || !Number.isFinite(targetHealth.current) || targetHealth.current < 0) return;
    const targetRel = world.getComponent(targetEnt, SocialRelationshipComponent);
    const targetMem = world.getComponent(targetEnt, MemoryComponent);
    const attackerName = world.getComponent(attackerEnt, NameComponent)?.name || 'Kẻ Thù Bí Ẩn';
    const targetName = world.getComponent(targetEnt, NameComponent)?.name || 'Nạn Nhân';

    if (targetRel) {
      recordHostility(world, targetEnt, attackerEnt, attackerName, -60, -50, -30);
    }
    if (targetMem) {
      performCombatSocialInteraction(world, targetEnt, attackerEnt, 'combatMemory', () => {
        targetMem.addMemory('attacked', `Bị [${attackerName}] bất ngờ tập kích xuất chiêu hãm hại!`,
          4, -80, attackerEnt, attackerName, currentDay);
        return true;
      }, true);
    }

    // Nếu nạn nhân có Đạo Lữ / Sư Phụ ở gần, họ cũng sẽ thù ghét kẻ tấn công
    const nearby = world.query([PositionComponent, SocialRelationshipComponent, MemoryComponent]);
    const targetPos = world.getComponent(targetEnt, PositionComponent);
    if (!targetPos) return;

    for (const allyEnt of nearby) {
      if (allyEnt === targetEnt || allyEnt === attackerEnt || !isLivingSocialParticipant(world, allyEnt)) continue;
      const allyRel = world.getComponent(allyEnt, SocialRelationshipComponent)!;
      const bondWithVictim = allyRel.getRelationship(targetEnt);

      const reverseVictimBond = targetRel?.getRelationship(allyEnt);
      const reciprocal = bondWithVictim?.relationType === 'master' ? 'disciple' : bondWithVictim?.relationType;
      if (bondWithVictim && reverseVictimBond?.relationType === reciprocal &&
          reverseVictimBond?.bond?.status !== 'ended' && bondWithVictim.bond?.episodeId === reverseVictimBond?.bond?.episodeId && bondWithVictim.bond?.status !== 'ended' && (bondWithVictim.relationType === 'dao_companion' || bondWithVictim.relationType === 'master' || bondWithVictim.relationType === 'sworn_brother')) {
        const allyPos = world.getComponent(allyEnt, PositionComponent)!;
        if (Math.hypot(allyPos.x - targetPos.x, allyPos.y - targetPos.y) < 180) {
          recordHostility(world, allyEnt, attackerEnt, attackerName, -50, -40, -20, 'witnessedScores');
          const allyMem = world.getComponent(allyEnt, MemoryComponent)!;
          performCombatSocialInteraction(world, allyEnt, attackerEnt, 'combatMemory', () => {
            allyMem.addMemory('attacked', `Tận mắt chứng kiến [${attackerName}] ra tay đả thương [${targetName}]!`,
              4, -70, attackerEnt, attackerName, currentDay);
            return true;
          });
        }
      }
    }
  }

  /**
   * Ghi nhớ sự kiện được cứu mạng khi quái thú hoặc kẻ địch bị tiêu diệt
   */
  public static handleRescueLife(world: ECSWorld, rescuerEnt: number, victimEnt: number,
    evidenceEpisodeId: string): RescueResult {
    return claimRescueLife(world, rescuerEnt, victimEnt, evidenceEpisodeId);
  }
}
