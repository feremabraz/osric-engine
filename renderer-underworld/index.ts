/**
 * @packageDocumentation
 * Minimal underworld software renderer and helpers. Re-exported modules:
 * - assets: palette, textures, materials, loaders, sprites
 * - render: framebuffer and drawing routines
 * - world: simple map/actors/sim utilities
 * - adapter: glue to map domain engine effects/commands
 */

export * as Palette from './assets/palette';
export * as Textures from './assets/textures';
export * as Mapgen from './world/mapgen';
export * as Materials from './assets/materials';
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

export type {
  SpriteProvider,
  SpriteImage,
  SpriteInstance,
  Camera,
  Grid,
  FloorCeilingGrid,
} from './render/renderer';

export type { Texture, LightLUT, MoodLUT, Tick, Seed } from './types';

export * as Sim from './world/sim';

export * as Adapter from './adapter';

export { createRenderer } from './render/facade';
export type {
  RendererFacade,
  RendererConfig,
  Scene,
  Materials as RendererMaterials,
} from './render/facade';

// IMPORTANT: Keep loaders exported from the main barrel.
// Do not move these behind a subpath; it's verified this does not leak node-only deps into the browser build.
export { NodeLoaders, BrowserLoaders } from './assets/loaders';
