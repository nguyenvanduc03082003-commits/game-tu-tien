/** Kênh được lưu bằng tên ổn định; communication dùng chung mọi nguồn giao tiếp. */
export const SOCIAL_COOLDOWN_CHANNELS = [
  'communication', 'healing', 'teaching', 'bondAttempt',
  'attackedScores', 'witnessedScores', 'combatMemory', 'rescueLife',
] as const;

export type SocialCooldownChannel = typeof SOCIAL_COOLDOWN_CHANNELS[number];

export interface SocialCooldownRecord {
  targetEntityId: number;
  channel: SocialCooldownChannel;
  expiresAtDay: number;
}

export function isDirectedCooldown(channel: SocialCooldownChannel): boolean {
  return channel === 'rescueLife' || channel === 'attackedScores' || channel === 'witnessedScores' || channel === 'combatMemory';
}

export function socialCooldownKey(targetEntityId: number, channel: SocialCooldownChannel): string {
  return `${channel}:${targetEntityId}`;
}

/** Kênh không có hướng chỉ lưu trên người có ID nhỏ hơn. */
export function socialCooldownOwner(a: number, b: number, channel: SocialCooldownChannel): [number, number] {
  return isDirectedCooldown(channel) || a < b ? [a, b] : [b, a];
}
