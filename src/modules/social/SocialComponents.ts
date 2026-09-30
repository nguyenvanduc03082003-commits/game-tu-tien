import { SocialEventTime } from './SocialEventTime.ts';
import { SOCIAL_CONFIG } from '../../config/social.config.ts';
import { TimeManager } from '../../core/TimeManager.ts';
import { Component } from '../../ecs/Component.ts';
import { SocialCooldownRecord, socialCooldownKey } from './SocialCooldown.ts';

// =============================================================================
// CÁC LOẠI HÌNH QUAN HỆ XÃ HỘI (RELATIONSHIP TYPES)
// =============================================================================
export type RelationshipType =
  | 'dao_companion'   // Đạo Lữ / Phu Thê (💖 Thề nguyền sinh tử, song tu trợ ích)
  | 'master'          // Sư Phụ / Sư Tôn (👑 Bậc tôn trưởng chỉ điểm công pháp)
  | 'disciple'        // Đồ Đệ / Môn Đồ (📜 Nhận ân truyền thụ, phụng dưỡng sư môn)
  | 'sworn_brother'   // Kim Lan Huynh Đệ / Tri Kỷ (⚔️ Vào sinh ra tử, tình sâu hơn biển)
  | 'friend'          // Hảo Hữu / Bằng Hữu (🍵 Thường xuyên trà đàm, tương trợ)
  | 'sect_mate'       // Đồng Môn Sư Huynh Đệ (🏛️ Cùng môn phái/thôn trang)
  | 'kin_parent'      // Phụ Mẫu (👨‍👩‍👧 Sinh thành dưỡng dục)
  | 'kin_child'       // Hài Nhi (👶 Giọt máu ruột thịt)
  | 'rival'           // Kình Địch / Đối Thủ (⚡ Tranh đua tu vi, tỷ thí thường xuyên)
  | 'enemy'           // Cừu Địch / Bất Cộng Đái Thiên (💀 Nợ máu huyết hải, thề báo thù)
  | 'acquaintance'    // Sơ Giao / Người Quen (🤝 Từng gặp gỡ, trò chuyện)
  | 'stranger';       // Người Lạ (👤 Chưa từng giao tiếp)

export function isProtectedRelationship(type: RelationshipType): boolean {
  return ['dao_companion', 'master', 'disciple', 'kin_parent', 'kin_child'].includes(type);
}

export interface RelationshipRecord {
  targetEntityId: number;
  targetName: string;
  relationType: RelationshipType;
  affinity: number;            // Hảo cảm: -100 (Hận thấu xương) đến +100 (Khắc cốt ghi tâm)
  trust: number;               // Tín nhiệm: 0 đến 100
  respect: number;             // Kính trọng: 0 đến 100
  interactionsCount: number;   // Số lần đã giao lưu, tương tác
  lastInteractionTime: number; // Timestamp tương tác gần nhất
  lastInteractionDay?: number;
  lastInteractionTick?: number;
  specialBondDate?: string;    // Ngày thề nguyền (kết đạo lữ, bái sư, kết nghĩa)
  bond?: RelationshipBondState;
}

export type BondEndReason = 'death' | 'betrayal' | 'estrangement';
export interface RelationshipBondState {
  schemaVersion: 1;
  episodeId: string;
  status: 'active' | 'ended';
  formedAtDay?: number;
  endedAtDay?: number;
  endReason?: BondEndReason;
  conflictSinceDay?: number;
}

export function cloneRelationshipRecord(record: RelationshipRecord): RelationshipRecord {
  return { ...record, ...(record.bond ? { bond: { ...record.bond } } : {}) };
}

export interface RescueEvidence {
  episodeId: string;
  threatEntityId: number;
  lastThreatDay: number;
  dangerHealthRatio: number;
  resolvedAtDay?: number;
  resolvedAtTick?: number;
  rescuerId?: number;
  claimed: boolean;
}

export class SocialRelationshipComponent implements Component {
  // Bản đồ lưu trữ các mối quan hệ: targetEntityId -> RelationshipRecord
  public relationships: Map<number, RelationshipRecord> = new Map();
  public cooldowns: Map<string, SocialCooldownRecord> = new Map();
  public bondHistory: RelationshipRecord[] = [];
  public bondEpisodeCounter = 0;
  public rescueEvidence: RescueEvidence[] = [];
  public rescueEpisodeCounter = 0;

  constructor(initialRelations?: RelationshipRecord[], initialCooldowns?: SocialCooldownRecord[],
    initialHistory?: RelationshipRecord[], episodeCounter = 0) {
    if (initialRelations) {
      initialRelations.forEach(r => this.relationships.set(r.targetEntityId, cloneRelationshipRecord(r)));
    }
    for (const record of initialCooldowns ?? []) {
      this.cooldowns.set(socialCooldownKey(record.targetEntityId, record.channel), { ...record });
    }
    this.bondHistory = (initialHistory ?? []).map(cloneRelationshipRecord);
    this.bondEpisodeCounter = episodeCounter;
  }

  public archiveEndedBond(record: RelationshipRecord): void {
    if (record.bond?.status !== 'ended' || this.bondHistory.some(entry => entry.bond?.episodeId === record.bond?.episodeId)) return;
    this.bondHistory.unshift(cloneRelationshipRecord(record));
    this.bondHistory.length = Math.min(this.bondHistory.length, SOCIAL_CONFIG.lifecycle.maxHistory);
  }

  public pruneExpiredCooldowns(currentDay: number): void {
    for (const [key, record] of this.cooldowns) {
      if (record.expiresAtDay <= currentDay) this.cooldowns.delete(key);
    }
  }

  public getRelationship(targetId: number): RelationshipRecord | null {
    return this.relationships.get(targetId) || null;
  }

  public ensureRelationship(targetId: number, targetName: string): RelationshipRecord {
    let record = this.relationships.get(targetId);
    if (!record) {
      record = { targetEntityId: targetId, targetName, relationType: 'stranger', affinity: 0,
        trust: 50, respect: 50, interactionsCount: 0, lastInteractionTime: 0 };
      this.relationships.set(targetId, record);
    }
    return record;
  }

  public adjustScores(targetId: number, targetName: string, affinityDelta = 0, trustDelta = 0, respectDelta = 0, time?: SocialEventTime): RelationshipRecord {
    if (![affinityDelta, trustDelta, respectDelta].every(Number.isFinite))
      throw new RangeError('Điểm thay đổi quan hệ phải là số hữu hạn.');
    const record = this.ensureRelationship(targetId, targetName);
    record.targetName = targetName;
    record.affinity = Math.max(-100, Math.min(100, record.affinity + affinityDelta));
    record.trust = Math.max(0, Math.min(100, record.trust + trustDelta));
    record.respect = Math.max(0, Math.min(100, record.respect + respectDelta));
    // Reset immediately on recovery, even when it occurs between lifecycle scans.
    if (record.bond && (record.affinity > SOCIAL_CONFIG.lifecycle.conflictAffinity || record.trust > SOCIAL_CONFIG.lifecycle.conflictTrust))
      delete record.bond.conflictSinceDay;
    record.interactionsCount++;
    record.lastInteractionTime = Date.now();
    record.lastInteractionDay = time?.day ?? TimeManager.getInstance().getDate().totalDays;
    record.lastInteractionTick = time?.tick ?? TimeManager.getInstance().getTotalTicks();
    return record;
  }

  public updateOrdinaryLabel(targetId: number): void {
    const record = this.relationships.get(targetId);
    if (!record || record.bond || isProtectedRelationship(record.relationType)) return;
    if (record.affinity <= SOCIAL_CONFIG.ordinary.enemyAffinity) record.relationType = 'enemy';
    else if (record.affinity >= SOCIAL_CONFIG.ordinary.friendAffinity && ['stranger', 'acquaintance'].includes(record.relationType)) record.relationType = 'friend';
    else if (record.affinity >= SOCIAL_CONFIG.ordinary.acquaintanceAffinity && record.relationType === 'stranger') record.relationType = 'acquaintance';
  }

  /** @deprecated Chỉ giữ tương thích; gameplay dùng adjustScores/updateOrdinaryLabel hoặc RelationshipService. */
  public setRelationship(targetId: number, targetName: string, type: RelationshipType,
    affinityDelta = 0, trustDelta = 0, respectDelta = 0): RelationshipRecord {
    if (![affinityDelta, trustDelta, respectDelta].every(Number.isFinite))
      throw new RangeError('Điểm thay đổi quan hệ phải là số hữu hạn.');
    const existed = this.relationships.has(targetId);
    const record = this.adjustScores(targetId, targetName, affinityDelta, trustDelta, respectDelta);
    if (!existed) record.relationType = type;
    else this.updateOrdinaryLabel(targetId);
    return record;
  }

  public getAllRelationships(): RelationshipRecord[] {
    return Array.from(this.relationships.values()).sort((a, b) => Math.abs(b.affinity) - Math.abs(a.affinity));
  }

  public static getRelationBadge(type: RelationshipType): string {
    switch (type) {
      case 'dao_companion': return '💖 Đạo Lữ';
      case 'master': return '👑 Sư Tôn';
      case 'disciple': return '📜 Đồ Đệ';
      case 'sworn_brother': return '⚔️ Tri Kỷ';
      case 'friend': return '🍵 Bằng Hữu';
      case 'sect_mate': return '🏛️ Đồng Môn';
      case 'kin_parent': return '👨‍👧 Phụ Mẫu';
      case 'kin_child': return '👶 Hài Nhi';
      case 'rival': return '⚡ Kình Địch';
      case 'enemy': return '💀 Cừu Nhân';
      case 'acquaintance': return '🤝 Sơ Giao';
      default: return '👤 Người Lạ';
    }
  }

  public static getAffinityColor(affinity: number): string {
    if (affinity >= 75) return '#f472b6'; // Hồng thắm (Đạo Lữ / Khắc cốt)
    if (affinity >= 40) return '#4ade80'; // Xanh lá sáng (Bằng hữu thân thiết)
    if (affinity >= 10) return '#38bdf8'; // Xanh lam (Thiện cảm)
    if (affinity > -20) return '#94a3b8'; // Xám bạc (Bình thường)
    if (affinity > -50) return '#fb923c'; // Cam (Ác cảm)
    return '#ef4444';                     // Đỏ rực (Thù hận ngập tràn)
  }
}

// =============================================================================
// CÁC LOẠI KÝ ỨC TÂM THỨC (EPISODIC MEMORY SYSTEM)
// =============================================================================
export type MemoryType =
  | 'bond_ended'
  | 'betrayed'
  | 'bereavement'
  | 'helped'                // Được giúp đỡ lúc hoạn nạn
  | 'saved_life'             // Được cứu mạng khỏi cái chết
  | 'attacked'               // Bị tập kích, đả thương
  | 'defeated_enemy'         // Trảm sát kẻ thù
  | 'received_gift'          // Được tặng linh đan, pháp bảo
  | 'sparred'                // Tỷ thí luận đạo, luận bàn kiếm thuật
  | 'chatted'                // Đàm đạo, hàn huyên bên đống lửa
  | 'became_disciples'       // Bái sư / Thu nạp đệ tử
  | 'became_companions'      // Thề nguyện kết bái Đạo Lữ
  | 'witnessed_breakthrough' // Chứng kiến dị tượng đột phá thiên kiếp
  | 'witnessed_miracle'      // Chứng kiến Thần Linh giáng thế / sấm sét
  | 'insulted';              // Bị lăng mạ, khiêu khích

export interface MemoryRecord {
  id: string;
  type: MemoryType;
  targetEntityId?: number;
  targetName?: string;
  emotionalValence: number;  // -100 đến +100 (Mức độ tác động cảm xúc)
  importance: number;        // 1 (Vụn vặt) đến 5 (Khắc cốt ghi tâm không bao giờ phai)
  timestamp: number;
  day: number;
  description: string;       // Diễn giải bằng văn phong tiên hiệp
  decayTimer: number;        // Bộ đếm phai mờ ký ức (giây)
}

export class MemoryComponent implements Component {
  public memories: MemoryRecord[] = [];
  public static readonly MAX_MEMORIES = 40;

  constructor(initialMemories?: MemoryRecord[]) {
    if (initialMemories) {
      this.memories = initialMemories.map(memory => ({ ...memory }));
    }
  }

  public addMemory(
    type: MemoryType,
    description: string,
    importance: number = 2,
    emotionalValence: number = 0,
    targetEntityId?: number,
    targetName?: string,
    currentDay: number | SocialEventTime = TimeManager.getInstance().getDate().totalDays
  ): MemoryRecord {
    const memory: MemoryRecord = {
      id: `mem_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type,
      targetEntityId,
      targetName,
      emotionalValence: Math.max(-100, Math.min(100, emotionalValence)),
      importance: Math.max(1, Math.min(5, importance)),
      timestamp: Date.now(),
      day: typeof currentDay === 'number' ? currentDay : currentDay.day,
      description,
      // Thời gian phai mờ: Cấp 5 là vĩnh hằng (999999s), cấp 1-4 tỷ lệ theo tầm quan trọng
      decayTimer: importance === 5 ? 999999 : importance * 300
    };

    // Đưa ký ức mới nhất lên đầu danh sách
    this.memories.unshift(memory);

    // Giới hạn dung lượng bộ nhớ, ưu tiên giữ lại các ký ức quan trọng cao
    if (this.memories.length > MemoryComponent.MAX_MEMORIES) {
      // Tìm phần tử có importance thấp nhất ở nửa sau danh sách để loại bỏ
      let lowestIdx = this.memories.length - 1;
      let minImp = 999;
      for (let i = Math.floor(this.memories.length / 2); i < this.memories.length; i++) {
        if (this.memories[i].importance < minImp) {
          minImp = this.memories[i].importance;
          lowestIdx = i;
        }
      }
      this.memories.splice(lowestIdx, 1);
    }

    return memory;
  }

  public getRecentMemories(count: number = 10): MemoryRecord[] {
    return this.memories.slice(0, count);
  }

  public static getMemoryBadge(type: MemoryType): { badge: string; color: string } {
    switch (type) {
      case 'bond_ended': return { badge: '💔 Kết Thúc Ràng Buộc', color: '#f87171' };
      case 'betrayed': return { badge: '🗡️ Phản Bội', color: '#ef4444' };
      case 'bereavement': return { badge: '🕯️ Mất Người Thân', color: '#a78bfa' };
      case 'saved_life': return { badge: '✨ Cứu Mạng', color: '#38d9a9' };
      case 'became_companions': return { badge: '💖 Kết Duyên', color: '#f472b6' };
      case 'became_disciples': return { badge: '👑 Sư Đồ', color: '#fbbf24' };
      case 'received_gift': return { badge: '🎁 Tặng Bảo', color: '#a78bfa' };
      case 'witnessed_breakthrough': return { badge: '⚡ Phá Cảnh', color: '#60a5fa' };
      case 'witnessed_miracle': return { badge: '🌌 Thần Tích', color: '#e879f9' };
      case 'attacked': return { badge: '⚔️ Bị Tập Kích', color: '#ef4444' };
      case 'defeated_enemy': return { badge: '🏆 Đả Bại Địch', color: '#f59e0b' };
      case 'sparred': return { badge: '🤺 Luận Kiếm', color: '#38bdf8' };
      case 'helped': return { badge: '🤝 Tương Trợ', color: '#34d399' };
      case 'insulted': return { badge: '💢 Xung Đột', color: '#f87171' };
      default: return { badge: '🍵 Đàm Đạo', color: '#94a3b8' };
    }
  }
}
