import type { LightLUT, RendererMaterials } from '@osric/renderer-underworld';
import * as Renderer from '@osric/renderer-underworld';
import { useEffect, useRef } from 'react';
import { createRendererSystem } from '../systems';

export interface UseRendererSystemDeps {
  mats: RendererMaterials;
  atlas: Renderer.Sprites.SpriteProvider;
  lightLUT: LightLUT;
}

/**
 * Initialize and cache the renderer system once assets and size are ready.
 * Grids read from worldRef.current so they stay fresh without re-init.
 */
export function useRendererSystem(
  deps: UseRendererSystemDeps | null,
  worldRef: React.MutableRefObject<Renderer.Sim.World>,
  size: { width: number; height: number }
) {
  const rendererRef = useRef<ReturnType<typeof createRendererSystem> | null>(null);

  useEffect(() => {
    if (!deps) return;
    const w0 = worldRef.current;
    const map = w0.map;
    const grids = {
      walls: {
        width: map.width,
        height: map.height,
        get(x: number, y: number) {
          const w = worldRef.current;
          return w.map.cells[y * w.map.width + x].wall;
        },
      },
      floorCeiling: {
        width: map.width,
        height: map.height,
        get(x: number, y: number) {
          const w = worldRef.current;
          const c = w.map.cells[y * w.map.width + x];
          return { floor: c.floor || 1, ceiling: c.ceiling || 1, light: c.light };
        },
      },
    };
    rendererRef.current = createRendererSystem({
      fbWidth: size.width,
      fbHeight: size.height,
      camera: {
        x: w0.player.x,
        y: w0.player.y,
        angle: w0.player.angle,
        fov: Math.PI / 3,
      },
      grids,
      materials: deps.mats,
      lightLUT: deps.lightLUT,
      fogDensity: 0.15,
      isDoorClosed: (x, y) => Renderer.Sim.isDoorClosed(worldRef.current, x, y),
      spriteAtlas: deps.atlas,
    });
  }, [deps, size.height, size.width, worldRef]);

  return rendererRef;
}
