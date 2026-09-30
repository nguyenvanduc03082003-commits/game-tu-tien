import { recordSocialTelemetry } from './SocialSimulationTelemetry.ts';
import { socialEventTime } from './SocialEventTime.ts';
import { ECSWorld } from '../../ecs/World.ts';
import { HealthComponent } from '../beings/BeingComponents.ts';
import { CorpseComponent } from '../beings/DeathComponents.ts';
import { FamilyComponent } from '../beings/FamilyComponent.ts';
import { emitGrowthEvent } from '../talent/GrowthEvents.ts';
import { MemoryComponent, RelationshipRecord, SocialRelationshipComponent } from './SocialComponents.ts';

const BOND_TYPES = new Set(['dao_companion', 'master', 'disciple', 'sworn_brother', 'kin_parent', 'kin_child']);

/** Death may close individual records, including incomplete legacy pairs; never fabricates a reverse record. */
export function endBondsForDeath(world: ECSWorld, deceased: number): void {
  const hp = world.getComponent(deceased, HealthComponent);
  if (!hp?.isDead) return;
  const deadSocial = world.getComponent(deceased, SocialRelationshipComponent);
  const owners = new Set(world.query([SocialRelationshipComponent]));
  const pairs = new Set<number>(deadSocial?.relationships.keys() ?? []);
  for (const owner of owners) {
    if (owner !== deceased && world.getComponent(owner, SocialRelationshipComponent)?.getRelationship(deceased)) pairs.add(owner);
  }
  const now = world.calendarDaysAtTick();
  for (const other of pairs) {
    if (other === deceased) continue;
    const otherSocial = world.getComponent(other, SocialRelationshipComponent);
    const records: [SocialRelationshipComponent, RelationshipRecord][] = [];
    const a = deadSocial?.getRelationship(other);
    const b = otherSocial?.getRelationship(deceased);
    if (a && deadSocial && BOND_TYPES.has(a.relationType) && a.bond?.status !== 'ended') records.push([deadSocial, a]);
    if (b && otherSocial && BOND_TYPES.has(b.relationType) && b.bond?.status !== 'ended') records.push([otherSocial, b]);
    if (!records.length) continue;
    // Assign legacy records a stable ID without changing existing explicit episode IDs.
    let legacyId: string | undefined;
    if (records.some(([, record]) => !record.bond)) {
      const next = Math.max(deadSocial?.bondEpisodeCounter ?? 0, otherSocial?.bondEpisodeCounter ?? 0) + 1;
      if (!Number.isSafeInteger(next)) throw new RangeError('Bộ đếm đợt quan hệ vượt giới hạn.');
      if (deadSocial) deadSocial.bondEpisodeCounter = next;
      if (otherSocial) otherSocial.bondEpisodeCounter = next;
      legacyId = `bond:${Math.min(deceased, other)}:${Math.max(deceased, other)}:${next}`;
    }
    for (const [, record] of records) {
      record.bond = { schemaVersion: 1, episodeId: record.bond?.episodeId ?? legacyId!, status: 'ended',
        ...(record.bond?.formedAtDay !== undefined ? { formedAtDay: record.bond.formedAtDay } : {}),
        endedAtDay: now, endReason: 'death' };
    }
  }
}

/** One synchronous coordinator per deceased entity; corpse marker is saved independently of memory eviction. */
export function processSocialDeath(world: ECSWorld, deceased: number, corpse: CorpseComponent): void {
  if (corpse.socialDeathProcessed || !world.getComponent(deceased, HealthComponent)?.isDead) return;
  const deceasedFamily = world.getComponent(deceased, FamilyComponent);
  const recipients: { entity: number; closeKin: boolean }[] = [];
  for (const entity of world.query([HealthComponent, SocialRelationshipComponent])) {
    const hp = world.getComponent(entity, HealthComponent)!;
    if (entity === deceased || hp.isDead || hp.current <= 0) continue;
    const rel = world.getComponent(entity, SocialRelationshipComponent)!.getRelationship(deceased);
    const family = world.getComponent(entity, FamilyComponent);
    const directFamily = Boolean(deceasedFamily?.parentIds.includes(entity) || family?.parentIds.includes(deceased));
    // Snapshot before ending; historical broken bonds no longer count as close roles.
    const currentRole = rel && rel.bond?.status !== 'ended';
    const closeKin = directFamily || Boolean(currentRole && ['dao_companion', 'kin_parent', 'kin_child'].includes(rel!.relationType));
    const closeFriend = !closeKin && Boolean(rel &&
      ((currentRole && ['sworn_brother', 'master', 'disciple'].includes(rel.relationType)) || rel.affinity >= 60));
    if (closeKin || closeFriend) recipients.push({ entity, closeKin });
  }
  endBondsForDeath(world, deceased);
  // Commit before callbacks so reentrant event handling cannot duplicate this episode.
  corpse.socialDeathProcessed = true;
  recordSocialTelemetry(world, 'death', 'processed', deceased);
  const tick = world.getCurrentTick();
  for (const { entity, closeKin } of recipients) {
    let memory = world.getComponent(entity, MemoryComponent);
    if (!memory) { memory = new MemoryComponent(); world.addComponent(entity, memory); }
    const reasonText = closeKin ? `Mất người thân chí cốt [${corpse.deceasedName}]` : `Mất tri kỷ bằng hữu [${corpse.deceasedName}]`;
    memory.addMemory('bereavement', reasonText, 5, -80, deceased, corpse.deceasedName, socialEventTime(world));
    recordSocialTelemetry(world, 'bereavement', 'recorded', entity, deceased);
    emitGrowthEvent({ world, eventId: `bereavement:${entity}:deceased:${deceased}`, entityId: entity,
      kind: 'bereavement', tick, familyKey: `bereavement:${deceased}`,
      milestoneKey: `bereavement:${entity}:${deceased}`, difficulty: 1.0,
      evidence: { targetEntityId: deceased, bereavementTier: closeKin ? 'close_kin' : 'friend', reasonText } });
  }
}
