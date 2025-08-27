import type { LightLUT, Texture } from '../types';
import {
  type Camera,
  type FloorCeilingGrid,
  type Framebuffer,
  type Grid,
  type SpriteInstance,
  type SpriteProvider,
  blitNearestUpscaled,
  createFramebuffer,
  renderBillboards,
  renderFloorCeiling,
  renderWalls,
} from './renderer';

/**
 * Materials used by the renderer façade. Provide wall, floor, and ceiling textures
 * indexed by 1-based cell ids in the map grids (1 === first texture, 0 === empty).
 */
export type Materials = {
  walls: Texture[];
  floors: Texture[];
  ceilings: Texture[];
};

/**
 * Configuration for {@link createRenderer}. Supplies framebuffer size, camera,
 * grids, materials, and optional lighting/fog/doors and sprite atlas hooks.
 */
export interface RendererConfig {
  fbWidth: number;
  fbHeight: number;
  camera: Camera;
  grids: {
    walls: Grid;
    floorCeiling: FloorCeilingGrid;
  };
  materials: Materials;
  lightLUT?: LightLUT;
  fogDensity?: number;
  isDoorClosed?: (x: number, y: number) => boolean;
  doorTexture?: Texture;
  spriteAtlas?: SpriteProvider;
}

/**
 * Optional scene inputs for a single render call. You can override the atlas for
 * this frame and pass sprite instances and a tick for simple animations.
 */
export interface Scene {
  sprites?: SpriteInstance[];
  tick?: number;
  atlas?: SpriteProvider; // optional override
}

/**
 * A small stateful façade that holds a framebuffer and camera, and renders
 * walls, floor/ceiling, and sprites in one call. Use {@link render} to draw into
 * the framebuffer, or {@link renderToTexture} to get a scaled texture for UI.
 */
export interface RendererFacade {
  fb: Framebuffer;
  camera: Camera;
  /** Partially update the camera (position, angle, or FOV). */
  setCamera(update: Partial<Camera>): void;
  /** Render the current scene into {@link fb} and return the depth buffer. */
  render(scene?: Scene): { fb: Framebuffer; depth: Float32Array };
  /**
   * Render the scene and return a scaled texture with optional background color.
   * Useful for matching UI surface sizes while preserving aspect ratio.
   */
  renderToTexture(
    outW: number,
    outH: number,
    bg?: [number, number, number, number],
    scene?: Scene
  ): Texture;
}

/**
 * Create a {@link RendererFacade} with the provided configuration. The façade
 * encapsulates the typical render pipeline (floor/ceiling → walls → sprites)
 * and returns a reusable framebuffer.
 */
export function createRenderer(cfg: RendererConfig): RendererFacade {
  const fb = createFramebuffer(cfg.fbWidth, cfg.fbHeight, [0, 0, 0, 255]);
  const camera: Camera = { ...cfg.camera };
  const walls = cfg.materials.walls;
  const floors = cfg.materials.floors;
  const ceilings = cfg.materials.ceilings;

  function render(scene?: Scene): { fb: Framebuffer; depth: Float32Array } {
    renderFloorCeiling(
      fb,
      {
        grid: cfg.grids.floorCeiling,
        floorTextures: floors,
        ceilingTextures: ceilings,
        lightLUT: cfg.lightLUT,
        fogDensity: cfg.fogDensity,
      },
      camera
    );
    const { depth } = renderWalls(
      fb,
      {
        grid: cfg.grids.walls,
        wallTextures: walls,
        getLight: (x: number, y: number) => cfg.grids.floorCeiling.get(x, y).light,
        lightLUT: cfg.lightLUT,
        fogDensity: cfg.fogDensity,
        isDoorClosed: cfg.isDoorClosed,
        doorTexture: cfg.doorTexture,
      },
      camera
    );
    const atlas = scene?.atlas ?? cfg.spriteAtlas;
    if (atlas && scene?.sprites?.length) {
      renderBillboards(fb, depth, camera, scene.sprites, atlas, scene?.tick ?? 0);
    }
    return { fb, depth };
  }

  function renderToTexture(
    outW: number,
    outH: number,
    bg: [number, number, number, number] = [0, 0, 0, 255],
    scene?: Scene
  ): Texture {
    render(scene);
    return blitNearestUpscaled(fb, outW, outH, bg);
  }

  return {
    fb,
    camera,
    setCamera(update: Partial<Camera>) {
      if (update.x !== undefined) camera.x = update.x;
      if (update.y !== undefined) camera.y = update.y;
      if (update.angle !== undefined) camera.angle = update.angle;
      if (update.fov !== undefined) camera.fov = update.fov;
    },
    render,
    renderToTexture,
  };
}
