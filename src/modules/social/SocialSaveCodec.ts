import { SOCIAL_CONFIG } from '../../config/social.config.ts';
import { readSocialFamiliarity } from './SocialFamiliarityService.ts';
import type { SocialEventTime } from './SocialEventTime.ts';
import { ECSWorld } from '../../ecs/World.ts';
import { MemoryComponent, SocialRelationshipComponent, cloneRelationshipRecord } from './SocialComponents.ts';
import { SOCIAL_COOLDOWN_CHANNELS, SocialCooldownChannel, isDirectedCooldown, socialCooldownKey } from './SocialCooldown.ts';

export function serializeSocialSave(world: ECSWorld, social: SocialRelationshipComponent, owner?: number) {
  const now = world.calendarDaysAtTick();
  return {
    relationships: Array.from(social.relationships.values(), record => {
      const copy = cloneRelationshipRecord(record);
      if (owner !== undefined && !readSocialFamiliarity(world, owner, record.targetEntityId)) delete copy.familiarity;
      return copy;
    }),
    rescue: { schemaVersion: 1, episodeCounter: social.rescueEpisodeCounter,
      entries: social.rescueEvidence.filter(e => now >= e.lastThreatDay && now - e.lastThreatDay <= SOCIAL_CONFIG.rescue.evidenceDays).map(e => ({ ...e })) },
    bondEpisodeCounter: social.bondEpisodeCounter,
    bondHistory: social.bondHistory.map(record => { const copy = cloneRelationshipRecord(record); delete copy.familiarity; return copy; }),
    cooldowns: {
      schemaVersion: 1,
      entries: [...social.cooldowns.values()].filter(record => record.expiresAtDay > now).map(record => ({ ...record })),
    },
  };
}

const RELATION_TYPES = new Set(['dao_companion', 'master', 'disciple', 'sworn_brother', 'friend',
  'sect_mate', 'kin_parent', 'kin_child', 'rival', 'enemy', 'acquaintance', 'stranger']);
const MEMORY_TYPES = new Set(['bond_ended', 'betrayed', 'bereavement', 'helped', 'saved_life', 'attacked', 'defeated_enemy', 'received_gift',
  'sparred', 'chatted', 'became_disciples', 'became_companions', 'witnessed_breakthrough', 'witnessed_miracle', 'insulted']);
const object = (value: any): boolean => !!value && typeof value === 'object' && !Array.isArray(value);
const range = (value: any, min: number, max = Infinity): boolean =>
  typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;
const id = (value: any): boolean => Number.isSafeInteger(value) && value > 0;
const count = (value: any): boolean => Number.isSafeInteger(value) && value >= 0;

/** Validate before staging; historical targets may have been removed from the world. */
export function validateSocialSave(entityId: number, components: any, savedTime?: SocialEventTime): void {
  const fail = (path: string): never => { throw new Error(`Dữ liệu xã hội thực thể #${entityId} không hợp lệ: ${path}`); };
  if (components.corpse?.socialDeathProcessed !== undefined &&
      typeof components.corpse.socialDeathProcessed !== 'boolean') fail('corpse.socialDeathProcessed phải là boolean');
  if (components.social !== undefined) {
    const social = components.social;
    if (!object(social) || !Array.isArray(social.relationships)) fail('social.relationships phải là mảng');
    if (social.rescue !== undefined) {
      const rescue = social.rescue;
      if (!object(rescue) || rescue.schemaVersion !== 1 || !count(rescue.episodeCounter) ||
          !Array.isArray(rescue.entries) || rescue.entries.length > SOCIAL_CONFIG.rescue.maxThreats) fail('social.rescue');
      const episodeIds = new Set<string>();
      const unresolvedThreats = new Set<number>();
      for (const [index, e] of rescue.entries.entries()) {
        const path = `social.rescue.entries[${index}]`;
        if (!object(e) || typeof e.episodeId !== 'string' || !id(e.threatEntityId) || e.threatEntityId === entityId ||
            !range(e.lastThreatDay, 0) || !range(e.dangerHealthRatio, Number.MIN_VALUE, SOCIAL_CONFIG.rescue.dangerHealthRatio) ||
            typeof e.claimed !== 'boolean') fail(path);
        const match = /^rescue:([1-9][0-9]*):([1-9][0-9]*)$/.exec(e.episodeId);
        if (!match || Number(match[1]) !== entityId || !id(Number(match[2])) || Number(match[2]) > rescue.episodeCounter ||
            episodeIds.has(e.episodeId)) fail(`${path}.episodeId`);
        episodeIds.add(e.episodeId);
        if (e.resolvedAtDay === undefined) {
          if (e.resolvedAtTick !== undefined || e.rescuerId !== undefined || e.claimed || unresolvedThreats.has(e.threatEntityId)) fail(`${path}: unresolved`);
          unresolvedThreats.add(e.threatEntityId);
        } else if (!range(e.resolvedAtDay, e.lastThreatDay, e.lastThreatDay + SOCIAL_CONFIG.rescue.evidenceDays) ||
            !count(e.resolvedAtTick) || !id(e.rescuerId) || e.rescuerId === entityId || e.rescuerId === e.threatEntityId) fail(`${path}: resolved`);
      }
    }
    if (social.cooldowns !== undefined) {
      const cooldowns = social.cooldowns;
      if (!object(cooldowns) || cooldowns.schemaVersion !== 1 || !Array.isArray(cooldowns.entries))
        fail('social.cooldowns: schemaVersion phải là 1, entries phải là mảng');
      const keys = new Set<string>();
      for (const [index, record] of cooldowns.entries.entries()) {
        const path = `social.cooldowns.entries[${index}]`;
        if (!object(record) || !id(record.targetEntityId) || record.targetEntityId === entityId ||
            !SOCIAL_COOLDOWN_CHANNELS.includes(record.channel) || !range(record.expiresAtDay, 0)) fail(path);
        const channel = record.channel as SocialCooldownChannel;
        if (!isDirectedCooldown(channel) && entityId > record.targetEntityId)
          fail(`${path}: cooldown cặp phải lưu ở ID nhỏ hơn`);
        const key = socialCooldownKey(record.targetEntityId, channel);
        if (keys.has(key)) fail(`${path}: trùng khóa cooldown`);
        keys.add(key);
      }
    }
    const counter = social.bondEpisodeCounter ?? 0;
    if (!count(counter)) fail('social.bondEpisodeCounter phải là số nguyên an toàn không âm');
    const episodes = new Set<string>();
    const validateRecord = (record: any, path: string, historical = false): void => {
      if (!object(record) || !id(record.targetEntityId) || record.targetEntityId === entityId ||
          typeof record.targetName !== 'string' || !RELATION_TYPES.has(record.relationType) ||
          !range(record.affinity, -100, 100) || !range(record.trust, 0, 100) || !range(record.respect, 0, 100) ||
          !count(record.interactionsCount) || !range(record.lastInteractionTime, 0) ||
          (record.lastInteractionDay !== undefined && !range(record.lastInteractionDay, 0)) ||
          (record.lastInteractionTick !== undefined && !count(record.lastInteractionTick)) ||
          (record.specialBondDate !== undefined && typeof record.specialBondDate !== 'string')) fail(path);
      const bond = record.bond;
      if (record.familiarity !== undefined) {
        const progress = record.familiarity;
        if (historical || !object(progress) || progress.schemaVersion !== 1 ||
            !count(progress.neutralCount) || progress.neutralCount >= SOCIAL_CONFIG.familiarity.neutralMeetings ||
            !range(progress.lastQualifiedDay, 0) || !count(progress.lastQualifiedTick) ||
            (savedTime && (progress.lastQualifiedTick > savedTime.tick || progress.lastQualifiedDay > savedTime.day)))
          fail(`${path}.familiarity`);
      }
      if (historical && bond?.status !== 'ended') fail(`${path}: lịch sử phải là ràng buộc đã kết thúc`);
      if (bond !== undefined) {
        const types = ['dao_companion', 'master', 'disciple', 'sworn_brother', 'kin_parent', 'kin_child'];
        if (!object(bond) || bond.schemaVersion !== 1 || !types.includes(record.relationType) ||
            typeof bond.episodeId !== 'string' || !['active', 'ended'].includes(bond.status) ||
            (bond.formedAtDay !== undefined && !range(bond.formedAtDay, 0)) ||
            (bond.conflictSinceDay !== undefined && (!range(bond.conflictSinceDay, 0) ||
              bond.status !== 'active' || (bond.formedAtDay !== undefined && bond.conflictSinceDay < bond.formedAtDay))))
          fail(`${path}.bond`);
        const match = /^bond:([1-9][0-9]*):([1-9][0-9]*):([1-9][0-9]*)$/.exec(bond.episodeId);
        if (!match || Number(match[1]) !== Math.min(entityId, record.targetEntityId) ||
            Number(match[2]) !== Math.max(entityId, record.targetEntityId) ||
            !id(Number(match[3])) || Number(match[3]) > counter) fail(`${path}.bond.episodeId`);
        if (episodes.has(bond.episodeId)) fail(`${path}: trùng đợt ràng buộc`);
        episodes.add(bond.episodeId);
        if (bond.status === 'ended') {
          if (!range(bond.endedAtDay, 0) || !['death', 'betrayal', 'estrangement'].includes(bond.endReason) ||
              (bond.formedAtDay !== undefined && bond.endedAtDay < bond.formedAtDay) ||
              (['kin_parent', 'kin_child'].includes(record.relationType) && bond.endReason !== 'death'))
            fail(`${path}.bond: ngày/lý do kết thúc không hợp lệ`);
        } else if (bond.endedAtDay !== undefined || bond.endReason !== undefined) {
          fail(`${path}.bond: active không có ngày/lý do kết thúc`);
        }
      }
    };
    const targets = new Set<number>();
    for (const [index, record] of social.relationships.entries()) {
      const path = `social.relationships[${index}]`;
      validateRecord(record, path);
      if (targets.has(record.targetEntityId)) fail(`${path}: trùng đối tượng quan hệ`);
      targets.add(record.targetEntityId);
    }
    if (social.bondHistory !== undefined) {
      if (!Array.isArray(social.bondHistory) || social.bondHistory.length > SOCIAL_CONFIG.lifecycle.maxHistory)
        fail('social.bondHistory phải là mảng tối đa 20 mục');
      for (const [index, record] of social.bondHistory.entries()) validateRecord(record, `social.bondHistory[${index}]`, true);
    }
  }
  if (components.memory !== undefined) {
    const memory = components.memory;
    if (!object(memory) || !Array.isArray(memory.memories) || memory.memories.length > MemoryComponent.MAX_MEMORIES)
      fail('memory.memories phải là mảng, tối đa 40 ký ức');
    const ids = new Set<string>();
    for (const [index, record] of memory.memories.entries()) {
      const path = `memory.memories[${index}]`;
      if (!object(record) || typeof record.id !== 'string' || !record.id.trim() || !MEMORY_TYPES.has(record.type) ||
          typeof record.description !== 'string' || !range(record.emotionalValence, -100, 100) ||
          !Number.isInteger(record.importance) || !range(record.importance, 1, 5) ||
          !range(record.timestamp, 0) || !range(record.day, 0) || !range(record.decayTimer, 0) ||
          (record.targetEntityId !== undefined && !id(record.targetEntityId)) ||
          (record.targetName !== undefined && typeof record.targetName !== 'string')) fail(path);
      if (ids.has(record.id)) fail(`${path}: trùng ID ký ức`);
      ids.add(record.id);
    }
  }
}
