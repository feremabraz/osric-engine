export type Tick = number & { readonly __brand: 'Tick' };
export type Seed = number & { readonly __brand: 'Seed' };

export interface CommandMoveForward {
  type: 'MoveForward';
}

export interface CommandTurnLeft {
  type: 'TurnLeft';
}

export interface CommandTurnRight {
  type: 'TurnRight';
}

export interface CommandOpenDoor {
  type: 'OpenDoor';
}

export interface CommandWait {
  type: 'Wait';
}

export interface CommandAttack {
  type: 'Attack';
}

export type Command =
  | CommandMoveForward
  | CommandTurnLeft
  | CommandTurnRight
  | CommandOpenDoor
  | CommandWait
  | CommandAttack;

export interface WorldState {
  tick: Tick;
  seed: Seed;
  player: { x: number; y: number; angle: number };
}

export interface Effect {
  kind: 'None';
}

export function applyCommand(
  state: WorldState,
  _cmd: Command
): { next: WorldState; effects: Effect[] } {
  return { next: state, effects: [] };
}

export * as Palette from './assets/palette';
export * as Textures from './assets/textures';
export * as Mapgen from './world/mapgen';
export * as Actors from './world/actors';
export * as Materials from './assets/materials';
export * as Loaders from './assets/loaders';
export * as Sprites from './assets/spriteProvider';

export type { Framebuffer } from './render/renderer';

export {
  createFramebuffer,
  clear,
  blitNearestUpscaled,
  renderWalls,
  renderFloorCeiling,
  renderBillboards,
} from './render/renderer';

export type { SpriteProvider, SpriteImage } from './render/renderer';

export type { Texture, LightLUT, MoodLUT } from './types';

export * as Sim from './world/sim';

export * as Adapter from './adapter/osric';
