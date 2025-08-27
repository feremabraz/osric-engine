# Quick start

This quick start gives a short, end‑to‑end render using the façade.

```ts
import {
  createRenderer,
  Palette,
  Textures,
  Mapgen,
  Sim,
} from '@osric/renderer-underworld';

// 1) World + materials
const map = Mapgen.generateMap(123, 16, 16);
const world = Sim.createWorldFromMap(map);
const mats = Textures.generateBaseTextures(123);
const materials = {
  walls: [mats[0].texture, mats[1].texture, mats[2].texture, mats[3].texture],
  floors: [mats[4].texture, mats[5].texture],
  ceilings: [mats[6].texture],
};

// 2) Grids
const walls = { width: map.width, height: map.height, get: (x: number, y: number) => map.cells[y*map.width+x].wall };
const floorCeiling = {
  width: map.width,
  height: map.height,
  get: (x: number, y: number) => {
    const c = map.cells[y*map.width+x];
    return { floor: c.floor || 1, ceiling: c.ceiling || 1, light: c.light };
  }
};

// 3) Renderer
const lightLUT = Palette.makeLightLUT(16);
const renderer = createRenderer({
  fbWidth: 320,
  fbHeight: 200,
  camera: { x: world.player.x, y: world.player.y, angle: 0, fov: Math.PI/3 },
  grids: { walls, floorCeiling },
  materials,
  lightLUT,
  fogDensity: 0.2,
});

// 4) Draw and scale for output
const { fb } = renderer.render();
const out = renderer.renderToTexture(640, 400);
// out is a { width, height, data: Uint8ClampedArray } texture you can write to PNG.
```

Notes
- Lighting is controlled via `lightLUT` and optional `fogDensity` (0 disables fog).
- Doors can be handled by providing `isDoorClosed` and `doorTexture` in the renderer config.
- Provide `spriteAtlas` and per‑frame `sprites` to render billboards.
