import { TerrainType, TERRAIN_CONFIGS } from '../../config/terrains.config.ts';

/** Hệ số nền dùng chung cho tạo thế giới, cọ địa hình, thời tiết và tải save. */
export function calculatePlantGrowth(terrain: TerrainType, moisture: number): number {
  const normalizedMoisture = Number.isFinite(moisture) ? Math.max(0, Math.min(1, moisture)) : 0;
  return TERRAIN_CONFIGS[terrain].plantGrowthRate * (0.5 + normalizedMoisture * 0.5);
}

/** Hệ số sinh trưởng sau tác động của nhiệt độ và độ ẩm hiện tại. */
export function calculateEnvironmentalPlantGrowth(terrain: TerrainType, moisture: number, temperature: number): number {
  let growth = calculatePlantGrowth(terrain, moisture);
  if (temperature < 0) growth *= 0.1;
  else if (temperature >= 15 && temperature <= 30) growth *= 1.3;
  if (moisture < 0.15) growth *= 0.3;
  else if (moisture > 0.4) growth *= 1.2;
  return growth;
}
