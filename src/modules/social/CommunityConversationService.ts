import { ECSWorld } from '../../ecs/World.ts';
import { SpatialGrid } from '../../core/SpatialGrid.ts';
import { SOCIAL_CONFIG } from '../../config/social.config.ts';
import { PositionComponent } from '../beings/BeingComponents.ts';
import { performConversation } from './SocialConversationService.ts';
import { getSocialCooldownRemainingDays } from './SocialInteractionGate.ts';
import { incrementSocialCounter } from './SocialSimulationTelemetry.ts';

/** Owned by one founding scan; never shared with other worlds or conversation sources. */
export interface CommunityConversationScan {
  readonly consideredPairs: Set<string>;
}

export function createCommunityConversationScan(): CommunityConversationScan {
  return { consideredPairs: new Set() };
}

/** Current cluster positions form a complete local grid, including indoor members.
 * Engine's grid is incomplete for these members and may precede their AI movement.
 * Commit order remains the original cluster i/j order; commit rechecks all gates.
 */
export function performCommunityConversations(world: ECSWorld, cluster: readonly number[],
  scan: CommunityConversationScan): void {
  const members = [...new Set(cluster)];
  const grid = new SpatialGrid(SOCIAL_CONFIG.conversation.maxDistance);
  const indices = new Map(members.map((id, index) => [id, index]));
  const positioned = members.flatMap(id => {
    const pos = world.getComponent(id, PositionComponent);
    return pos && Number.isFinite(pos.x) && Number.isFinite(pos.y) ? [{ id, x: pos.x, y: pos.y }] : [];
  });
  grid.rebuild(positioned);
  incrementSocialCounter(world, 'community_scan', 'input_pairs', members.length * (members.length - 1) / 2);
  let nearPairs = 0;
  for (let i = 0; i < members.length; i++) {
    const a = members[i];
    const posA = world.getComponent(a, PositionComponent);
    if (!posA || !Number.isFinite(posA.x) || !Number.isFinite(posA.y)) continue;
    const nearby = grid.queryRadius(posA.x, posA.y, SOCIAL_CONFIG.conversation.maxDistance)
      .filter(item => indices.get(item.id)! > i)
      .sort((left, right) => indices.get(left.id)! - indices.get(right.id)!);
    for (const item of nearby) {
      nearPairs++;
      const b = item.id;
      const key = a < b ? `${a}:${b}` : `${b}:${a}`;
      if (scan.consideredPairs.has(key)) {
        incrementSocialCounter(world, 'community_scan', 'duplicate_near_pairs');
        continue;
      }
      scan.consideredPairs.add(key);
      incrementSocialCounter(world, 'community_scan', 'unique_near_pairs');
      const posB = world.getComponent(b, PositionComponent);
      if (!posB || Math.hypot(posA.x - posB.x, posA.y - posB.y) > SOCIAL_CONFIG.conversation.maxDistance) {
        incrementSocialCounter(world, 'community_scan', 'changed_position');
        continue;
      }
      if (getSocialCooldownRemainingDays(world, a, b, 'communication') > 0) {
        incrementSocialCounter(world, 'community_scan', 'filtered_cooldown');
        continue;
      }
      incrementSocialCounter(world, 'community_scan', 'commit_calls');
      performConversation(world, a, b, 'community');
    }
  }
  // Counts excluded pair occurrences without enumerating all distant pairs.
  incrementSocialCounter(world, 'community_scan', 'excluded_non_near_pairs',
    members.length * (members.length - 1) / 2 - nearPairs);
}
