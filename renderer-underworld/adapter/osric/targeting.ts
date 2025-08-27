/** @internal Targeting helpers: LOS and target selection. */
import type { World } from '../../world/sim';
import { isBlocked } from '../../world/sim';
import { getCharacterIdForActor } from '../../world/types';
import type { TargetingConfig } from './config';
import { angleTo, norm } from './math';

export function hasLOS(world: World, px: number, py: number, ax: number, ay: number, steps = 16) {
  if (steps <= 0) return true;
  const dx = (ax - px) / steps;
  const dy = (ay - py) / steps;
  for (let i = 1; i <= steps; i++) {
    const x = px + dx * i;
    const y = py + dy * i;
    if (isBlocked(world, x, y)) return false;
  }
  return true;
}

export function pickBestTarget(
  world: World,
  origin: { x: number; y: number; angle: number },
  cfg: TargetingConfig
): string | undefined {
  const { x: px, y: py, angle: facing } = origin;
  const maxDist2 = cfg.maxDist * cfg.maxDist;
  let best: { d2: number; charId: string } | undefined;
  for (const a of world.actors) {
    const dx = a.x - px;
    const dy = a.y - py;
    const d2 = dx * dx + dy * dy;
    if (d2 > maxDist2) continue;
    const dir = angleTo(px, py, a.x, a.y);
    const delta = Math.abs(norm(dir - facing));
    if (delta > cfg.fov) continue;
    if (!hasLOS(world, px, py, a.x, a.y, cfg.losSteps)) continue;
    const cid = getCharacterIdForActor(world, a.id);
    if (!cid) continue;
    if (!best || d2 < best.d2) best = { d2, charId: cid };
  }
  return best?.charId;
}
