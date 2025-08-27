import { createFramebuffer, renderFloorCeiling, renderWalls } from '@osric/renderer-underworld';
import { Mapgen } from '@osric/renderer-underworld';
import { Palette } from '@osric/renderer-underworld';
import { describe, expect, it } from 'vitest';

function solidTexture(color: [number, number, number, number], size = 64) {
  const data = new Uint8ClampedArray(size * size * 4);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = color[0];
    data[i + 1] = color[1];
    data[i + 2] = color[2];
    data[i + 3] = color[3];
  }
  return { width: size, height: size, data };
}

describe('Phase 3: floors/ceilings + lighting/fog', () => {
  it('renders floor and ceiling with lighting applied and fog falloff', () => {
    const fb = createFramebuffer(160, 120, [0, 0, 0, 255]);
    const map = Mapgen.generateMap(123, 16, 16);
    const grid = {
      width: map.width,
      height: map.height,
      get(x: number, y: number) {
        const c = map.cells[y * map.width + x];
        return c.wall;
      },
    };
    const fcGrid = {
      width: map.width,
      height: map.height,
      get(x: number, y: number) {
        const c = map.cells[y * map.width + x];
        return { floor: c.floor || 1, ceiling: c.ceiling || 1, light: c.light };
      },
    };
    const lightLUT = Palette.makeLightLUT(16);
    const wallTex = solidTexture([200, 200, 200, 255]);
    const floorTex = solidTexture([80, 60, 40, 255]);
    const ceilTex = solidTexture([40, 60, 80, 255]);
    const cam = { x: map.playerStart.x, y: map.playerStart.y, angle: 0, fov: Math.PI / 3 };
    renderFloorCeiling(
      fb,
      {
        grid: fcGrid,
        floorTextures: [floorTex],
        ceilingTextures: [ceilTex],
        lightLUT,
        fogDensity: 0.2,
      },
      cam
    );
    const { depth } = renderWalls(
      fb,
      {
        grid,
        wallTextures: [wallTex],
        getLight: (x, y) => map.cells[y * map.width + x].light,
        lightLUT,
        fogDensity: 0.2,
      },
      cam
    );
    const mid = ((fb.height >> 1) * fb.width + (fb.width >> 1)) * 4;
    expect(fb.data[mid + 3]).toBe(255);
    for (let x = 0; x < depth.length; x++) expect(Number.isFinite(depth[x])).toBe(true);
    const bottom = ((fb.height - 1) * fb.width + (fb.width >> 1)) * 4;
    expect(fb.data[bottom] + fb.data[bottom + 1] + fb.data[bottom + 2]).toBeGreaterThan(0);
  });
});
