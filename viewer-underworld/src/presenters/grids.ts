import type * as Renderer from '@osric/renderer-underworld';

/** Create grid adapters that read from worldRef.current for walls and floor/ceiling. */
export function createGrids(worldRef: React.MutableRefObject<Renderer.Sim.World>) {
  const map = worldRef.current.map;
  return {
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
  } satisfies Renderer.RendererConfig['grids'];
}
