/** @internal Motion helpers. */
import type { World } from '../../world/sim';
import { isBlocked } from '../../world/sim';

export function forwardDelta(angle: number, step: number): { dx: number; dy: number } {
  return { dx: Math.cos(angle) * step, dy: Math.sin(angle) * step };
}

export function strafeDelta(
  angle: number,
  step: number,
  dir: -1 | 1 = -1
): { dx: number; dy: number } {
  const a = angle + (dir === -1 ? -Math.PI / 2 : Math.PI / 2);
  return { dx: Math.cos(a) * step, dy: Math.sin(a) * step };
}

export function moveWithSlide(
  world: World,
  x: number,
  y: number,
  nx: number,
  ny: number
): { x: number; y: number } {
  if (!isBlocked(world, nx, ny)) return { x: nx, y: ny };
  if (!isBlocked(world, nx, y)) return { x: nx, y };
  if (!isBlocked(world, x, ny)) return { x, y: ny };
  return { x, y };
}
