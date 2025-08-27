import type { Effect } from '@osric/engine';
/** Minimal framework-agnostic system interfaces for the viewer orchestration. */
import type { RendererConfig, RendererFacade, Scene, Texture } from '@osric/renderer-underworld';
import type * as Renderer from '@osric/renderer-underworld';
type World = Renderer.Sim.World;
type LocalCommand = Renderer.Adapter.LocalCommand;

export interface RendererSystemConfig extends RendererConfig {}

export interface RendererSystem {
  readonly facade: RendererFacade;
  render(scene?: Scene): { fbWidth: number; fbHeight: number };
  renderToTexture(
    outW: number,
    outH: number,
    bg?: [number, number, number, number],
    scene?: Scene
  ): Texture;
}

export interface SimSystemConfig {
  seed: number;
  initialWorld: World;
  playerId?: string;
}

export interface SimSystem {
  getWorld(): World;
  setWorld(w: World): void;
  /** Map local commands → engine commands, execute, apply effects, and advance a turn. */
  step(local: LocalCommand[]): { world: World; effects: Effect[] };
}
