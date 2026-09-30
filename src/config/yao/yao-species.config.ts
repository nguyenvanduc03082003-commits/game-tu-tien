export interface YaoSpeciesConfig {
  readonly id: string;
  readonly label: string;
}

/**
 * Danh mục chủng yêu (Yêu tộc) tách biệt hoàn toàn với danh mục động vật thường.
 * Giữ nguyên toàn bộ ID chủng yêu hiện có để tương thích với hệ ngoại hình và huyết mạch V3.
 */
export const YAO_SPECIES_TUPLE = [
  ['wolf', 'Lang (Sói)'],
  ['tiger', 'Hổ (Cọp)'],
  ['leopard', 'Báo (Báo)'],
  ['bear', 'Hùng (Gấu)'],
  ['eagle', 'Ưng (Đại Bàng)'],
  ['dragon', 'Giao (Giao Long)'],
  ['ape', 'Viên (Vượn Rừng)'],
  ['deer', 'Lộc (Hươu Sao)'],
  ['rabbit', 'Bạch Thỏ (Thỏ Trắng)'],
  ['crane', 'Tiên Hạc'],
] as const;

export const YAO_SPECIES: readonly YaoSpeciesConfig[] = YAO_SPECIES_TUPLE.map(
  ([id, label]) => ({ id, label })
);

export const BEAST_SPECIES = YAO_SPECIES_TUPLE;

export function inferYaoSpecies(race: string, name: string): string {
  return race === 'beast'
    ? YAO_SPECIES_TUPLE.find(([, label]) => name.includes(label))?.[0] ?? 'wolf'
    : race;
}
