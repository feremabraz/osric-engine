import type { Effect } from '@osric/engine';
import type { World } from '../../world/sim';
import {
  enqueueHitFlash,
  isDoorClosed,
  setDoorOpen,
  startCameraShake,
  startDissolve,
} from '../../world/sim';
import { getActorIdForCharacter } from '../../world/types';
import { DEFAULT_MOTION, DEFAULT_SHAKE_HIT, DEFAULT_SHAKE_TALK } from './config';
import { forwardDelta, moveWithSlide, strafeDelta } from './motion';
import { narrowEffect } from './narrow';

/**
 * Apply a list of engine effects to the renderer world snapshot immutably.
 *
 * Contract
 * - Does not mutate the input `world` (returns a shallow-cloned next state)
 * - Updates: player movement/turn, door toggles, battle flags, simple camera shake,
 *   sprite flashes and dissolve timings
 * - Ignores unknown or unsupported effects safely
 *
 * Returns
 * - A new world object representing the state after applying all effects
 */
export function applyEngineEffects(world: World, effects: Effect[]): World {
  const next = {
    ...world,
    player: { ...world.player },
    actors: world.actors.map((a) => ({ ...a })),
  } as World;
  const STEP = DEFAULT_MOTION.step;
  const TURN = DEFAULT_MOTION.turn;
  for (const e of effects) {
    const ef = narrowEffect(e);
    if (!ef) continue;
    switch (ef.type) {
      case 'BattleMove': {
        const p = ef.payload;
        if (!p.id || typeof p.dx !== 'number' || typeof p.dy !== 'number') break;
        const actorId = getActorIdForCharacter(next, p.id);
        if (actorId !== undefined) {
          const idx = next.actors.findIndex((a) => a.id === actorId);
          if (idx >= 0) {
            const a = next.actors[idx];
            const moved = moveWithSlide(next, a.x, a.y, a.x + p.dx, a.y + p.dy);
            next.actors[idx] = { ...a, x: moved.x, y: moved.y };
          }
        }
        break;
      }
      case 'StartBattle': {
        const p = ef.payload;
        const id = p.id || 'battle-1';
        const parts = Array.isArray(p.participants) ? p.participants : [];
        next.battle = { id, active: true, participants: parts };
        break;
      }
      case 'InitiativeRolled': {
        if (next.battle) next.battle.active = true;
        break;
      }
      case 'BattleEnded': {
        if (next.battle) next.battle.active = false;
        break;
      }
      case 'Turn':
        {
          const p = ef.payload;
          const amt = typeof p.amount === 'number' ? p.amount : TURN;
          if (p.direction === 'left') next.player.angle -= amt;
          else if (p.direction === 'right') next.player.angle += amt;
        }
        break;
      case 'Move':
        {
          const p = ef.payload;
          const dist = typeof p.distance === 'number' ? p.distance : STEP;
          let nx = next.player.x;
          let ny = next.player.y;
          if (p.direction === 'forward' || p.direction === 'backward') {
            const s = p.direction === 'forward' ? dist : -dist;
            const d = forwardDelta(next.player.angle, s);
            const m = moveWithSlide(next, nx, ny, nx + d.dx, ny + d.dy);
            nx = m.x;
            ny = m.y;
          } else if (p.direction === 'strafeLeft' || p.direction === 'strafeRight') {
            const dir: -1 | 1 = p.direction === 'strafeLeft' ? -1 : 1;
            const d = strafeDelta(next.player.angle, dist, dir);
            const m = moveWithSlide(next, nx, ny, nx + d.dx, ny + d.dy);
            nx = m.x;
            ny = m.y;
          }
          next.player.x = nx;
          next.player.y = ny;
        }
        break;
      case 'DoorToggle': {
        const px = next.player.x;
        const py = next.player.y;
        const reach = 0.75;
        const tx = Math.floor(px + Math.cos(next.player.angle) * reach);
        const ty = Math.floor(py + Math.sin(next.player.angle) * reach);
        const currentlyClosed = isDoorClosed(next, tx, ty);
        setDoorOpen(next, tx, ty, currentlyClosed);
        break;
      }
      case 'AttackResolved':
      case 'Damage': {
        const { amplitude, duration } = DEFAULT_SHAKE_HIT;
        next.cameraShake = {
          amplitude,
          ticksRemaining: duration,
          seed: (next.tick as unknown as number) % 997,
        };
        const targetId = (ef.payload as { targetId?: string } | undefined)?.targetId;
        if (targetId) {
          const actorId = getActorIdForCharacter(next, targetId);
          if (actorId !== undefined) {
            const flashed = enqueueHitFlash(next, actorId, 4);
            next.hitFlashes = flashed.hitFlashes;
          }
        }
        break;
      }
      case 'Defeated':
      case 'Death': {
        const targetId = (ef.payload as { targetId?: string } | undefined)?.targetId;
        if (targetId) {
          const actorId = getActorIdForCharacter(next, targetId);
          if (actorId !== undefined) {
            const withDissolve = startDissolve(next, actorId, 12);
            next.dissolves = withDissolve.dissolves;
          }
        }
        break;
      }
      case 'Talk': {
        const shaken = startCameraShake(
          next,
          DEFAULT_SHAKE_TALK.amplitude,
          DEFAULT_SHAKE_TALK.duration,
          (next.tick as unknown as number) % 997
        );
        next.cameraShake = shaken.cameraShake;
        const p = ef.payload;
        const ids = [p.speakerId, p.targetId].filter(Boolean) as string[];
        for (const cid of ids) {
          const actorId = getActorIdForCharacter(next, cid);
          if (actorId !== undefined) {
            const flashed = enqueueHitFlash(next, actorId, 2);
            next.hitFlashes = flashed.hitFlashes;
          }
        }
        break;
      }
      default: {
        const _exhaustive: never = ef;
        void _exhaustive;
        break;
      }
    }
  }
  return next;
}
