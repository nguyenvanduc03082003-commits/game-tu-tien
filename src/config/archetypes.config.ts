export interface BeingArchetype {
  id: string;
  name: string;
  raceId: string;
  description: string;
  badge: string; // Icon / Ký hiệu đại diện
  realmIndex: number; // 0: Phàm nhân / Dã thú, 1+: Cảnh giới cao hơn
  customTraits: string[];
  defaultMode?: 'natural' | 'curated';
  allowReincarnation?: boolean;
  defaultLineageTags?: string[];
  statMultipliers?: {
    health?: number;
    lifespan?: number;
    intellect?: number;
    physique?: number;
    qiRate?: number;
  };
}

export const ARCHETYPE_DEFINITIONS: BeingArchetype[] = [
  { id: 'mortal_human', name: 'Nhân Tộc', raceId: 'human', description: 'Nhân tộc với thiên phú và đặc điểm ngẫu nhiên.', badge: '👤', realmIndex: 0, defaultMode: 'natural', customTraits: [] },
  { id: 'yao_common', name: 'Yêu Tộc', raceId: 'beast', description: 'Yêu tộc với thiên phú và đặc điểm ngẫu nhiên.', badge: '🐺', realmIndex: 0, defaultMode: 'natural', customTraits: [] },
  { id: 'mortal_demon', name: 'Ma Tộc', raceId: 'demon', description: 'Ma tộc với thiên phú và đặc điểm ngẫu nhiên.', badge: '😈', realmIndex: 0, defaultMode: 'natural', customTraits: [] },
];
