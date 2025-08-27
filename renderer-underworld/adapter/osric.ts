import type { Effect } from '@osric/engine';
import type { Command as SimCommand, World } from '../world/sim';
import {
  enqueueHitFlash,
  getActorIdForCharacter,
  getCharacterIdForActor,
  isBlocked,
  isDoorClosed,
  setDoorOpen,
  startCameraShake,
  startDissolve,
} from '../world/sim';

export type LocalCommand = SimCommand;

export type EngineCommand =
  | { key: 'osric:turn'; params: { id: string; direction: 'left' | 'right'; amount?: number } }
  | {
      key: 'osric:move';
      params: {
        id: string;
        direction: 'forward' | 'backward' | 'strafeLeft' | 'strafeRight';
        distance?: number;
      };
    }
  | { key: 'osric:doorToggle'; params: { id: string } }
  | { key: 'osric:wait'; params: { id: string } }
  | { key: 'osric:attack'; params: { attackerId: string; targetId: string } }
  | {
      key: 'osric:resolveAttack';
      params: { attackerId: string; targetId: string; roll: number; modifiers?: number };
    }
  | { key: 'osric:applyDamage'; params: { targetId: string; amount: number; sourceId?: string } }
  | { key: 'osric:talk'; params: { speakerId: string; targetId?: string; line?: string } };

export function toEngineCommands(
  local: LocalCommand[],
  playerId = 'player',
  world?: World
): EngineCommand[] {
  const out: EngineCommand[] = [];
  for (const cmd of local) {
    switch (cmd.type) {
      case 'TurnLeft':
        out.push({ key: 'osric:turn', params: { id: playerId, direction: 'left' } });
        break;
      case 'TurnRight':
        out.push({ key: 'osric:turn', params: { id: playerId, direction: 'right' } });
        break;
      case 'MoveForward':
        out.push({ key: 'osric:move', params: { id: playerId, direction: 'forward' } });
        break;
      case 'MoveBackward':
        out.push({ key: 'osric:move', params: { id: playerId, direction: 'backward' } });
        break;
      case 'StrafeLeft':
        out.push({ key: 'osric:move', params: { id: playerId, direction: 'strafeLeft' } });
        break;
      case 'StrafeRight':
        out.push({ key: 'osric:move', params: { id: playerId, direction: 'strafeRight' } });
        break;
      case 'OpenDoor':
        out.push({ key: 'osric:doorToggle', params: { id: playerId } });
        break;
      case 'Wait':
        out.push({ key: 'osric:wait', params: { id: playerId } });
        break;
      case 'Attack': {
        let targetCharId: string | undefined;
        if (world) {
          const w = world;
          const px = w.player.x;
          const py = w.player.y;
          const facing = w.player.angle;
          const maxDist = 4.0;
          const fov = Math.PI / 6;
          function angleTo(ax: number, ay: number) {
            return Math.atan2(ay - py, ax - px);
          }
          function norm(a: number) {
            let v = a;
            while (v <= -Math.PI) v += Math.PI * 2;
            while (v > Math.PI) v -= Math.PI * 2;
            return v;
          }
          function hasLOS(ax: number, ay: number) {
            const steps = 16;
            const dx = (ax - px) / steps;
            const dy = (ay - py) / steps;
            for (let i = 1; i <= steps; i++) {
              const x = px + dx * i;
              const y = py + dy * i;
              if (isBlocked(w, x, y)) return false;
            }
            return true;
          }
          let bestDist2 = Number.POSITIVE_INFINITY;
          for (const a of w.actors) {
            const dx = a.x - px;
            const dy = a.y - py;
            const d2 = dx * dx + dy * dy;
            if (d2 > maxDist * maxDist) continue;
            const dir = angleTo(a.x, a.y);
            const delta = Math.abs(norm(dir - facing));
            if (delta > fov) continue;
            if (!hasLOS(a.x, a.y)) continue;
            const cid = getCharacterIdForActor(w, a.id);
            if (!cid) continue;
            if (d2 < bestDist2) {
              bestDist2 = d2;
              targetCharId = cid;
            }
          }
        }
        const tid = targetCharId ?? playerId;
        out.push({ key: 'osric:attack', params: { attackerId: playerId, targetId: tid } });
        out.push({
          key: 'osric:resolveAttack',
          params: { attackerId: playerId, targetId: tid, roll: 10, modifiers: 0 },
        });
        out.push({
          key: 'osric:applyDamage',
          params: { targetId: tid, amount: 1, sourceId: playerId },
        });
        break;
      }
      case 'Interact': {
        let targetCharId: string | undefined;
        if (world) {
          const w = world;
          const px = w.player.x;
          const py = w.player.y;
          const facing = w.player.angle;
          const maxDist = 2.0;
          const fov = Math.PI / 4;
          function angleTo(ax: number, ay: number) {
            return Math.atan2(ay - py, ax - px);
          }
          function norm(a: number) {
            let v = a;
            while (v <= -Math.PI) v += Math.PI * 2;
            while (v > Math.PI) v -= Math.PI * 2;
            return v;
          }
          let bestDist2 = Number.POSITIVE_INFINITY;
          for (const a of w.actors) {
            const dx = a.x - px;
            const dy = a.y - py;
            const d2 = dx * dx + dy * dy;
            if (d2 > maxDist * maxDist) continue;
            const delta = Math.abs(norm(angleTo(a.x, a.y) - facing));
            if (delta > fov) continue;
            const cid = getCharacterIdForActor(w, a.id);
            if (!cid) continue;
            if (d2 < bestDist2) {
              bestDist2 = d2;
              targetCharId = cid;
            }
          }
        }
        out.push({ key: 'osric:talk', params: { speakerId: playerId, targetId: targetCharId } });
        break;
      }
    }
  }
  return out;
}

export function applyEngineEffects(world: World, effects: Effect[]): World {
  const next = {
    ...world,
    player: { ...world.player },
    actors: world.actors.map((a) => ({ ...a })),
  } as World;
  const STEP = 0.5;
  const TURN = Math.PI / 12;
  function forwardDelta(angle: number, step = STEP): { dx: number; dy: number } {
    return { dx: Math.cos(angle) * step, dy: Math.sin(angle) * step };
  }
  function strafeDelta(angle: number, step = STEP, dir: -1 | 1 = -1): { dx: number; dy: number } {
    const a = angle + (dir === -1 ? -Math.PI / 2 : Math.PI / 2);
    return { dx: Math.cos(a) * step, dy: Math.sin(a) * step };
  }
  function moveWithSlide(x: number, y: number, nx: number, ny: number): { x: number; y: number } {
    if (!isBlocked(next, nx, ny)) return { x: nx, y: ny };
    if (!isBlocked(next, nx, y)) return { x: nx, y };
    if (!isBlocked(next, x, ny)) return { x, y: ny };
    return { x, y };
  }
  for (const ef of effects) {
    switch (ef.type) {
      case 'BattleMove': {
        const p = (ef.payload as { id?: string; dx?: number; dy?: number } | undefined) || {};
        if (!p.id || typeof p.dx !== 'number' || typeof p.dy !== 'number') break;
        const actorId = getActorIdForCharacter(next, p.id);
        if (actorId !== undefined) {
          const idx = next.actors.findIndex((a) => a.id === actorId);
          if (idx >= 0) {
            const a = next.actors[idx];
            const moved = moveWithSlide(a.x, a.y, a.x + p.dx, a.y + p.dy);
            next.actors[idx] = { ...a, x: moved.x, y: moved.y };
          }
        }
        break;
      }
      case 'StartBattle': {
        const p = (ef.payload as { id?: string; participants?: string[] } | undefined) || {};
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
          const p = (ef.payload || {}) as { direction?: 'left' | 'right'; amount?: number };
          const amt = typeof p.amount === 'number' ? p.amount : TURN;
          if (p.direction === 'left') next.player.angle -= amt;
          else if (p.direction === 'right') next.player.angle += amt;
        }
        break;
      case 'Move':
        {
          const p = (ef.payload || {}) as {
            direction?: 'forward' | 'backward' | 'strafeLeft' | 'strafeRight';
            distance?: number;
          };
          const dist = typeof p.distance === 'number' ? p.distance : STEP;
          let nx = next.player.x;
          let ny = next.player.y;
          if (p.direction === 'forward' || p.direction === 'backward') {
            const s = p.direction === 'forward' ? dist : -dist;
            const d = forwardDelta(next.player.angle, s);
            const m = moveWithSlide(nx, ny, nx + d.dx, ny + d.dy);
            nx = m.x;
            ny = m.y;
          } else if (p.direction === 'strafeLeft' || p.direction === 'strafeRight') {
            const dir: -1 | 1 = p.direction === 'strafeLeft' ? -1 : 1;
            const d = strafeDelta(next.player.angle, dist, dir);
            const m = moveWithSlide(nx, ny, nx + d.dx, ny + d.dy);
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
        const amplitude = 1;
        const duration = 3;
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
        const p = (ef.payload as { speakerId?: string; targetId?: string } | undefined) || {};
        const shaken = startCameraShake(next, 1, 2, (next.tick as unknown as number) % 997);
        next.cameraShake = shaken.cameraShake;
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
      default:
        break;
    }
  }
  return next;
}
