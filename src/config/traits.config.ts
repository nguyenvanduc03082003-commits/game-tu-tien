import {
  RaceId,
  TraitCategory,
  TraitDefinitionV3,
  TraitDimension,
  TraitTier,
} from './traits/trait.types.ts';
import {
  ALL_TRAIT_DEFINITIONS_V3,
  ALL_TRAITS_LIST_V3,
  areTraitsConflictingV3,
  isTraitAllowedForRaceAndSpecies,
} from '../modules/traits/TraitCatalog.ts';

export type {
  TraitCategory,
  TraitDimension,
  TraitTier,
  TraitDefinitionV3,
};

export type TraitDefinition = TraitDefinitionV3;

export const TIER_NAMES: Record<TraitTier, { name: string; color: string; badge: string }> = {
  1: { name: 'Phàm Phẩm', color: '#94a3b8', badge: '⚪' },
  2: { name: 'Linh Phẩm', color: '#34d399', badge: '🟢' },
  3: { name: 'Địa Phẩm', color: '#a78bfa', badge: '🟣' },
  4: { name: 'Thiên Phẩm', color: '#fbbf24', badge: '🟡' },
  5: { name: 'Tiên Phẩm', color: '#fb7185', badge: '🔴' },
};

export const DIMENSION_NAMES: Record<TraitDimension, { name: string; icon: string }> = {
  physique: { name: 'Căn Cốt Thể Chất', icon: '🛡️' },
  root: { name: 'Linh Căn Dị Năng', icon: '🌟' },
  mindset: { name: 'Ngộ Tính Tâm Cảnh', icon: '🧠' },
  combat: { name: 'Chiến Đấu Võ Đạo', icon: '⚔️' },
  profession: { name: 'Tiên Nghệ Dân Sinh', icon: '🧪' },
  social: { name: 'Khí Vận Xã Giao', icon: '🍀' },
  survival: { name: 'Sinh Tồn Hoang Dã', icon: '🍖' },
};

export const TRAIT_DEFINITIONS: Readonly<Record<string, TraitDefinitionV3>> =
  ALL_TRAIT_DEFINITIONS_V3;

export function areTraitsConflicting(traitIdA: string, traitIdB: string): boolean {
  return areTraitsConflictingV3(traitIdA, traitIdB);
}

/**
 * Facade tương thích ngược cho nơi gọi cũ.
 * Chỉ chọn các trait V3 active, origin === 'innate', đúng chủng tộc, không xung đột.
 * Dùng thuật toán xáo trộn Fisher-Yates thay cho sort(Math.random() - 0.5).
 */
export function getRandomInnateTraits(
  raceId: string,
  count: number = 2,
  existingTraits: string[] = [],
  rng?: { next: () => number },
  speciesId?: string
): string[] {
  const validRace: RaceId =
    raceId === 'beast' || raceId === 'demon' ? raceId : 'human';
  const rand = () => (rng ? rng.next() : Math.random());
  const result: string[] = [...existingTraits];

  const candidates = ALL_TRAITS_LIST_V3.filter(
    def =>
      def.implementation === 'active' &&
      def.origin === 'innate' &&
      def.spawnWeight > 0 &&
      isTraitAllowedForRaceAndSpecies(def, validRace, speciesId)
  ).map(def => def.id);

  // Fisher-Yates shuffle
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = candidates[i];
    candidates[i] = candidates[j];
    candidates[j] = tmp;
  }

  for (const tid of candidates) {
    if (result.length >= count + existingTraits.length) break;
    const hasConflict = result.some(curId => areTraitsConflictingV3(curId, tid));
    if (!hasConflict) {
      result.push(tid);
    }
  }

  return result.slice(existingTraits.length);
}
