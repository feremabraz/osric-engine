import type { RNG } from '@osric/engine';
import type { Tick } from '../types';
import type { MapData } from './mapgen';
import type { Actor, ActorState, Command, Player, World } from './types';
import {
  getActorIdForCharacter,
  getCharacterIdForActor,
  registerCharacterMapping,
  unregisterCharacterMapping,
} from './types';
export type { World, Player, Actor, ActorState, Command } from './types';
export {
  getCharacterIdForActor,
  getActorIdForCharacter,
  registerCharacterMapping,
  unregisterCharacterMapping,
} from './types';

function key(x: number, y: number) {
  return `${x},${y}`;
}

/** Create an initial world state from map data, seeding actors and player start. */
export function createWorldFromMap(map: MapData): World {
  let id = 1;
  const actors: Actor[] = map.actors.map((a) => ({ id: id++, ...a, state: 'idle' as ActorState }));
  const openDoors = new Set<string>();
  return {
    tick: 0 as Tick,
    map,
    player: { ...map.playerStart },
    actors,
    openDoors,
    battle: undefined,
    hitFlashes: new Map(),
    dissolves: new Map(),
    cameraShake: undefined,
    characterMap: new Map<string, number>(),
  };
}

/** Check whether a door cell at (x,y) is currently closed. */
export function isDoorClosed(world: World, x: number, y: number): boolean {
  const idx = y * world.map.width + x;
  const cell = world.map.cells[idx];
  if (!cell?.door) return false;
  return !world.openDoors.has(key(x, y));
}

/** Mark a door at (x,y) as open (true) or closed (false). */
export function setDoorOpen(world: World, x: number, y: number, open: boolean): void {
  const k = key(x, y);
  if (open) world.openDoors.add(k);
  else world.openDoors.delete(k);
}

/** Returns true if the position collides with walls or closed doors, or is out of bounds. */
export function isBlocked(world: World, x: number, y: number): boolean {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  if (xi < 0 || yi < 0 || xi >= world.map.width || yi >= world.map.height) return true;
  const cell = world.map.cells[yi * world.map.width + xi];
  if (!cell) return true;
  if (cell.wall > 0) return true;
  if (cell.door && isDoorClosed(world, xi, yi)) return true;
  return false;
}

function moveWithSlide(
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

// Commands are defined in './types'

const STEP = 0.5;
const TURN = Math.PI / 12;

function forwardDelta(angle: number, step = STEP): { dx: number; dy: number } {
  return { dx: Math.cos(angle) * step, dy: Math.sin(angle) * step };
}

function strafeDelta(angle: number, step = STEP, dir: -1 | 1 = -1): { dx: number; dy: number } {
  const a = angle + (dir === -1 ? -Math.PI / 2 : Math.PI / 2);
  return { dx: Math.cos(a) * step, dy: Math.sin(a) * step };
}

function openDoorInFront(world: World): void {
  const px = world.player.x;
  const py = world.player.y;
  const f = forwardDelta(world.player.angle, 0.75);
  const tx = Math.floor(px + f.dx);
  const ty = Math.floor(py + f.dy);
  const idx = ty * world.map.width + tx;
  const cell = world.map.cells[idx];
  if (cell?.door) setDoorOpen(world, tx, ty, true);
}

function stepActors(world: World, rng: RNG): void {
  const px = world.player.x;
  const py = world.player.y;
  for (const a of world.actors) {
    if (world.battle?.active) {
      const charId = getCharacterIdForActor(world, a.id);
      if (charId && world.battle.participants.includes(charId)) {
        continue;
      }
    }
    const src = world.map.actors.find((m) => m.x === a.x && m.y === a.y && m.kind === a.kind);
    const isCivilian = src?.role === 'civilian';
    if (isCivilian) {
      a.state = 'idle';
      const turn = (rng.float() - 0.5) * (Math.PI / 24);
      a.facing += turn;
      const step = 0.2 * (rng.float() < 0.5 ? 0 : 1);
      const nx = a.x + Math.cos(a.facing) * step;
      const ny = a.y + Math.sin(a.facing) * step;
      const moved = moveWithSlide(world, a.x, a.y, nx, ny);
      a.x = moved.x;
      a.y = moved.y;
      continue;
    }
    const dx = px - a.x;
    const dy = py - a.y;
    const dist2 = dx * dx + dy * dy;
    if (dist2 < 1.2 * 1.2) {
      a.state = 'idle';
      continue;
    }
    a.state = 'chase';
    const ax = Math.sign(dx);
    const ay = Math.sign(dy);
    const preferX =
      Math.abs(dx) > Math.abs(dy) ? true : Math.abs(dx) < Math.abs(dy) ? false : rng.float() < 0.5;
    const step = 0.4;
    let nx = a.x;
    let ny = a.y;
    if (preferX) {
      const tryX = moveWithSlide(world, a.x, a.y, a.x + ax * step, a.y);
      nx = tryX.x;
      ny = tryX.y;
      if (nx === a.x && ny === a.y) {
        const tryY = moveWithSlide(world, a.x, a.y, a.x, a.y + ay * step);
        nx = tryY.x;
        ny = tryY.y;
      }
    } else {
      const tryY = moveWithSlide(world, a.x, a.y, a.x, a.y + ay * step);
      nx = tryY.x;
      ny = tryY.y;
      if (nx === a.x && ny === a.y) {
        const tryX = moveWithSlide(world, a.x, a.y, a.x + ax * step, a.y);
        nx = tryX.x;
        ny = tryX.y;
      }
    }
    a.x = nx;
    a.y = ny;
  }
}

/**
 * Advance the simulation by one tick applying given commands, moving actors,
 * and updating transient effects (flashes, dissolves, shake).
 */
export function advanceTurn(world: World, commands: Command[], rng: RNG): World {
  const next: World = {
    tick: ((world.tick as unknown as number) + 1) as Tick,
    map: world.map,
    player: { ...world.player },
    actors: world.actors.map((a) => ({ ...a })),
    openDoors: new Set(world.openDoors),
    hitFlashes: new Map(world.hitFlashes),
    dissolves: new Map(world.dissolves),
    cameraShake: world.cameraShake ? { ...world.cameraShake } : undefined,
  };
  for (const cmd of commands) {
    switch (cmd.type) {
      case 'TurnLeft':
        next.player.angle -= TURN;
        break;
      case 'TurnRight':
        next.player.angle += TURN;
        break;
      case 'MoveForward': {
        const f = forwardDelta(next.player.angle);
        const moved = moveWithSlide(
          next,
          next.player.x,
          next.player.y,
          next.player.x + f.dx,
          next.player.y + f.dy
        );
        next.player.x = moved.x;
        next.player.y = moved.y;
        break;
      }
      case 'OpenDoor':
        openDoorInFront(next);
        break;
      case 'MoveBackward': {
        const f = forwardDelta(next.player.angle, -STEP);
        const moved = moveWithSlide(
          next,
          next.player.x,
          next.player.y,
          next.player.x + f.dx,
          next.player.y + f.dy
        );
        next.player.x = moved.x;
        next.player.y = moved.y;
        break;
      }
      case 'StrafeLeft': {
        const s = strafeDelta(next.player.angle, STEP, -1);
        const moved = moveWithSlide(
          next,
          next.player.x,
          next.player.y,
          next.player.x + s.dx,
          next.player.y + s.dy
        );
        next.player.x = moved.x;
        next.player.y = moved.y;
        break;
      }
      case 'StrafeRight': {
        const s = strafeDelta(next.player.angle, STEP, 1);
        const moved = moveWithSlide(
          next,
          next.player.x,
          next.player.y,
          next.player.x + s.dx,
          next.player.y + s.dy
        );
        next.player.x = moved.x;
        next.player.y = moved.y;
        break;
      }
      case 'Attack':
      case 'Wait':
        break;
      default: {
        const exhaustiveCheck = (_x: never): never => {
          return _x;
        };
        exhaustiveCheck(cmd as never);
        break;
      }
    }
  }
  stepActors(next, rng);
  for (const [id, t] of next.hitFlashes) {
    const nt = t - 1;
    if (nt <= 0) next.hitFlashes.delete(id);
    else next.hitFlashes.set(id, nt);
  }
  for (const [id, d] of Array.from(next.dissolves.entries())) {
    d.stepsRemaining -= 1;
    if (d.stepsRemaining <= 0) {
      next.dissolves.delete(id);
      next.actors = next.actors.filter((a) => a.id !== id);
    } else {
      next.dissolves.set(id, d);
    }
  }
  if (next.cameraShake) {
    next.cameraShake.ticksRemaining -= 1;
    if (next.cameraShake.ticksRemaining <= 0) next.cameraShake = undefined;
  }
  return next;
}

/** Enqueue a short flash effect for a given actor. */
export function enqueueHitFlash(world: World, actorId: number, durationTicks: number): World {
  const next = { ...world, hitFlashes: new Map(world.hitFlashes) } as World;
  next.hitFlashes.set(actorId, Math.max(1, Math.floor(durationTicks)));
  return next;
}

/** Start a dissolve effect on an actor which will remove it after `steps`. */
export function startDissolve(world: World, actorId: number, steps: number): World {
  const next = { ...world, dissolves: new Map(world.dissolves) } as World;
  next.dissolves.set(actorId, {
    stepsRemaining: Math.max(1, Math.floor(steps)),
    total: Math.max(1, Math.floor(steps)),
  });
  return next;
}

/** Start a small camera shake for `durationTicks` with given amplitude and seed. */
export function startCameraShake(
  world: World,
  amplitude: number,
  durationTicks: number,
  seed = 0
): World {
  const next = { ...world } as World;
  next.cameraShake = {
    amplitude: Math.max(0, Math.floor(amplitude)),
    ticksRemaining: Math.max(1, Math.floor(durationTicks)),
    seed,
  };
  return next;
}

/** Compute the camera offset for current shake state (if any). */
export function getCameraOffset(world: World): { ox: number; oy: number } {
  if (!world.cameraShake) return { ox: 0, oy: 0 };
  const base = (world.tick as unknown as number) + world.cameraShake.seed;
  const amp = world.cameraShake.amplitude;
  const ox = Math.round(Math.sin(base * 0.7) * amp);
  const oy = Math.round(Math.cos(base * 0.5) * amp);
  return { ox, oy };
}

// Character mapping helpers are exported from './types'
