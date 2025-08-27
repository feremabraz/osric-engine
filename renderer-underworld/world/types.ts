import type { RNG } from '@osric/engine';
import type { Tick } from '../types';
import type { MapData } from './mapgen';

/** Camera-controlling player in world units; angle in radians. */
export type Player = { x: number; y: number; angle: number };
export type ActorState = 'idle' | 'chase';
/** Simple actor for demo/world simulation. */
export type Actor = {
  id: number;
  x: number;
  y: number;
  kind: string;
  facing: number;
  state: ActorState;
};

/** World state containing map, player, actors, and transient effects. */
export type World = {
  tick: Tick;
  map: MapData;
  player: Player;
  actors: Actor[];
  openDoors: Set<string>;
  battle?: { id: string; active: boolean; participants: string[] };
  hitFlashes: Map<number, number>;
  dissolves: Map<number, { stepsRemaining: number; total: number }>;
  cameraShake?: { ticksRemaining: number; amplitude: number; seed: number };
  characterMap?: Map<string, number>;
};

export type CommandMoveForward = { type: 'MoveForward' };
export type CommandMoveBackward = { type: 'MoveBackward' };
export type CommandStrafeLeft = { type: 'StrafeLeft' };
export type CommandStrafeRight = { type: 'StrafeRight' };
export type CommandTurnLeft = { type: 'TurnLeft' };
export type CommandTurnRight = { type: 'TurnRight' };
export type CommandOpenDoor = { type: 'OpenDoor' };
export type CommandWait = { type: 'Wait' };
export type CommandAttack = { type: 'Attack' };
export type CommandInteract = { type: 'Interact' };
export type Command =
  | CommandMoveForward
  | CommandMoveBackward
  | CommandStrafeLeft
  | CommandStrafeRight
  | CommandTurnLeft
  | CommandTurnRight
  | CommandOpenDoor
  | CommandWait
  | CommandAttack
  | CommandInteract;

export type RNGLike = RNG; // re-export alias for convenience

/** Associate a domain character id with a local actor id. */
export function registerCharacterMapping(
  world: World,
  characterId: string,
  actorId: number
): World {
  const cmap = new Map(world.characterMap ?? new Map());
  cmap.set(characterId, actorId);
  return { ...world, characterMap: cmap };
}

/** Remove the association for a character id, if present. */
export function unregisterCharacterMapping(world: World, characterId: string): World {
  if (!world.characterMap?.has(characterId)) return world;
  const cmap = new Map(world.characterMap);
  cmap.delete(characterId);
  return { ...world, characterMap: cmap };
}

/** Lookup local actor id by domain character id. */
export function getActorIdForCharacter(world: World, characterId: string): number | undefined {
  const id = world.characterMap?.get(characterId);
  return typeof id === 'number' ? id : undefined;
}

/** Lookup domain character id by local actor id. */
export function getCharacterIdForActor(world: World, actorId: number): string | undefined {
  if (!world.characterMap) return undefined;
  for (const [charId, aId] of world.characterMap.entries()) {
    if (aId === actorId) return charId;
  }
  return undefined;
}
