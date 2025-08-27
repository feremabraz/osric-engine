import type { RendererConfig, RendererFacade, Scene, Texture } from '@osric/renderer-underworld';
import { createRenderer } from '@osric/renderer-underworld';
import type { RendererSystem, RendererSystemConfig } from '../types/systems';

export function createRendererSystem(cfg: RendererSystemConfig): RendererSystem {
  const facade: RendererFacade = createRenderer(cfg as RendererConfig);
  return {
    facade,
    render(scene?: Scene) {
      const { fb } = facade.render(scene);
      return { fbWidth: fb.width, fbHeight: fb.height };
    },
    renderToTexture(
      outW: number,
      outH: number,
      bg?: [number, number, number, number],
      scene?: Scene
    ): Texture {
      return facade.renderToTexture(outW, outH, bg, scene);
    },
  };
}
