# Facade and primitives

## Facade: `createRenderer`

The façade owns a framebuffer and camera and performs a full frame in one call.

```ts
const renderer = createRenderer({
  fbWidth, fbHeight,
  camera, // { x, y, angle, fov }
  grids: { walls, floorCeiling },
  materials, // { walls, floors, ceilings }
  lightLUT?, fogDensity?, isDoorClosed?, doorTexture?, spriteAtlas?
});

renderer.setCamera({ angle: angle + 0.02 });
const { fb, depth } = renderer.render({ sprites, tick, atlas? });
const scaled = renderer.renderToTexture(640, 400, [0,0,0,255]);
```

- `walls` grid returns a 1‑based texture id; `0` means empty.
- `floorCeiling` returns `{ floor, ceiling, light }` per cell.
- If provided, `isDoorClosed(x,y)` and `doorTexture` render doors as walls.

## Primitives

- `createFramebuffer(w,h,rgba)`: makes and clears an RGBA8 pixel buffer
- `renderFloorCeiling(fb, params, cam)`: textured floor and ceiling with optional lighting/fog
- `renderWalls(fb, params, cam)`: vertical slices ray‑caster with per‑column depth
- `renderBillboards(fb, depth, cam, sprites, atlas, tick)`: sprites with simple depth test
- `blitNearestUpscaled(fb, outW, outH, bg)`: letterboxed nearest‑neighbor scale

All functions are deterministic and CPU‑only.
