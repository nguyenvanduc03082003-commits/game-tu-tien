import { WorldMap } from './WorldMap.ts';
import { getSlopeMoveFactor } from './ElevationRules.ts';

/** Tính tốc độ theo cạnh ô sắp đi qua, không theo waypoint có thể ở rất xa. */
export function getLocalSlopeMoveFactor(
  worldMap: WorldMap,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number
): number {
  const size = worldMap.tileSize;
  const tx = Math.floor(fromX / size);
  const ty = Math.floor(fromY / size);
  const current = worldMap.getTile(tx, ty);
  if (!current) return 0;

  const dx = toX - fromX;
  const dy = toY - fromY;
  const distance = Math.hypot(dx, dy);
  if (distance <= 1e-6) return 1;

  const ux = dx / distance;
  const uy = dy / distance;
  const crossX = ux > 0 ? ((tx + 1) * size - fromX) / ux
    : ux < 0 ? (tx * size - fromX) / ux : Infinity;
  const crossY = uy > 0 ? ((ty + 1) * size - fromY) / uy
    : uy < 0 ? (ty * size - fromY) / uy : Infinity;
  const boundaryDistance = Math.min(crossX, crossY);
  if (!Number.isFinite(boundaryDistance) || boundaryDistance > distance) return 1;

  const probeDistance = Math.min(distance, Math.max(0, boundaryDistance) + 1e-5);
  const next = worldMap.getTile(
    Math.floor((fromX + ux * probeDistance) / size),
    Math.floor((fromY + uy * probeDistance) / size)
  );
  return next ? getSlopeMoveFactor(current.elevation, next.elevation) : 0;
}
