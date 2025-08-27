import type { RendererFacade, SpriteInstance } from '@osric/renderer-underworld';
import type * as Renderer from '@osric/renderer-underworld';

/** Render a single frame using the renderer facade and then draw to the view. */
export function renderFrame(
  facade: RendererFacade,
  world: Renderer.Sim.World,
  draw: (tex: { width: number; height: number; data: Uint8ClampedArray }) => void
) {
  facade.setCamera({ x: world.player.x, y: world.player.y, angle: world.player.angle });
  const sprites: SpriteInstance[] = world.actors.map((a) => ({
    x: a.x,
    y: a.y,
    kind: a.kind,
    variant: 'main',
  }));
  const { fb } = facade.render({ sprites, tick: (world.tick as unknown as number) ?? 0 });
  draw({ width: fb.width, height: fb.height, data: new Uint8ClampedArray(fb.data) });
}
