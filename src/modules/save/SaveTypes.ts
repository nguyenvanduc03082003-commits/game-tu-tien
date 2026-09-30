export interface SaveMetadata {
  id: string;               // Mã slot duy nhất (vd: 'slot_1', 'quicksave', 'autosave')
  name: string;             // Tên thế giới / Tên bản lưu (vd: 'Thái Cổ Giới - Slot 1')
  timestamp: number;        // Thời gian lưu thực tế (Date.now())
  realDateStr: string;      // Chuỗi ngày giờ thực tế (vd: '22/09/2026 15:45')
  inGameDateStr: string;    // Chuỗi thời gian trong game (vd: 'Năm 3, Tháng 2, Mùa Xuân')
  residentCount: number;    // Tổng số lượng cư dân (nhân, yêu, ma)
  cultivatorCount: number;  // Số lượng tu sĩ đã thức tỉnh linh căn
  buildingCount: number;    // Số lượng công trình đã xây
  templateId: string;       // Mẫu địa hình khởi tạo ('thap_van_dai_son', ...)
  seed: number;             // Seed thế giới
  version: string;          // Phiên bản dữ liệu (vd: '1.1.0')
  traitSystemVersion?: number;
  talentGenerationVersion?: number;
}

export interface SerializedTile {
  terrain: number;          // Index của TerrainType
  elevation: number;        // 0..1 (tuple lưu nhân 100, giữ phần thập phân)
  moisture: number;         // 0..1 (tuple lưu nhân 100, giữ phần thập phân)
  temperature: number;      // Độ C
  qiDensity: number;        // Mật độ linh khí
  variant: number;          // 0..3
}

export interface SerializedQiTile {
  density: number;
  tier: string;
  dominantElement: string;
  isSpiritVein: boolean;
  veinRate: number;
}

export interface SerializedEntity {
  id: number;
  components: Record<string, any>;
}

export interface SerializedTribulation {
  entityId: number;
  totalStrikes: number;
  strikesRemaining: number;
  strikeTimer: number;
  strikeInterval: number;
  targetStageName: string;
}

export interface SerializedWeatherState {
  currentWeather: string;
  weatherTimer: number;
  tileTimer: number;
  weatherDuration?: number;
  seasonalTempOffset?: number;
}

import { TreatyData } from '../factions/DiplomacySystem.ts';

export interface SaveData {
  metadata: SaveMetadata;
  traitSystemVersion?: number;
  talentGenerationVersion?: number;
  birthOrdinal?: number;
  camera: {
    x: number;
    y: number;
    zoom: number;
  };
  time: {
    totalTicks: number;
    speed: number;
    clockSchema?: number;
    calendarEpochTick?: number;
    calendarEpochDays?: number;
    oldTicksPerDay?: number;
  };
  worldMap: {
    width: number;
    height: number;
    tileSize: number;
    // Chuỗi mảng thu gọn để tối ưu dung lượng và tốc độ
    tiles: [number, number, number, number, number, number][]; // [terrainIdx, elevation100, moisture100, temp, qi, variant]; không làm tròn môi trường
  };
  qiGrid: {
    width: number;
    height: number;
    tiles: [number, string, string, number, number][]; // [density, tier, element, isVein(1/0), veinRate]
  };
  entities: SerializedEntity[];
  nextEntityId: number;
  activeTribulations?: SerializedTribulation[];
  diplomacy?: Record<string, 'allied' | 'neutral' | 'war'>;
  treaties?: TreatyData;
  weather?: SerializedWeatherState;
}
