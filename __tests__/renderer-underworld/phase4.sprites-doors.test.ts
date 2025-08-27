import {
  createFramebuffer,
  renderBillboards,
  renderFloorCeiling,
  renderWalls,
} from '@osric/renderer-underworld';
import { Palette } from '@osric/renderer-underworld';
import { describe, expect, it } from 'vitest';

function solidTexture(color: [number, number, number, number], size = 32) {
  const data = new Uint8ClampedArray(size * size * 4);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = color[0];
    data[i + 1] = color[1];
    data[i + 2] = color[2];
    data[i + 3] = color[3];
  }
  return { width: size, height: size, data };
}

const atlas = {
  get(_kind: string, _variant: string) {
    const size = 32;
    const data = new Uint8ClampedArray(size * size * 4);
    for (let y = 0; y < size; y++)
      for (let x = 0; x < size; x++) {
        const i = (y * size + x) * 4;
        data[i] = 220;
        data[i + 1] = 40;
        data[i + 2] = 40;
        data[i + 3] = 255;
      }
    return { texture: { width: size, height: size, data }, pivotY: size };
  },
};

describe('Phase 4: billboards and doors', () => {
  it('renders a sprite projected and occluded by walls via depth buffer', () => {
    const fb = createFramebuffer(160, 120, [0, 0, 0, 255]);
    const lightLUT = Palette.makeLightLUT(16);
    const width = 16;
    const height = 16;
    const cells = Array.from({ length: width * height }, () => ({
      wall: 0 as 0 | 1,
      floor: 1,
      ceiling: 1,
      light: 12,
    }));
    for (let y = 0; y < height; y++) cells[y * width + 12].wall = 1;
    const grid = {
      width,
      height,
      get(x: number, y: number) {
        return cells[y * width + x].wall;
      },
    };
    const fcGrid = {
      width,
      height,
      get(x: number, y: number) {
        const c = cells[y * width + x];
        return { floor: c.floor, ceiling: c.ceiling, light: c.light };
      },
    };
    const cam = { x: 4.5, y: 8.5, angle: 0, fov: Math.PI / 3 };
    renderFloorCeiling(
      fb,
      {
        grid: fcGrid,
        floorTextures: [solidTexture([50, 50, 50, 255])],
        ceilingTextures: [solidTexture([50, 50, 70, 255])],
        lightLUT,
      },
      cam
    );
    const { depth } = renderWalls(
      fb,
      { grid, wallTextures: [solidTexture([200, 200, 200, 255])], lightLUT },
      cam
    );
    const sprites = [{ x: 12.5, y: 8.5, variant: 'main', kind: 'knight' }];
    renderBillboards(fb, depth, cam, sprites, atlas, 0);
    const mid = ((fb.height >> 1) * fb.width + (fb.width >> 1)) * 4;
    const r = fb.data[mid];
    const g = fb.data[mid + 1];
    expect(r).toBeLessThan(220);
    expect(g).toBeGreaterThan(100);
  });

  it('doors block when closed and open to empty when marked open', () => {
    const fb = createFramebuffer(100, 80, [0, 0, 0, 255]);
    const lightLUT = Palette.makeLightLUT(16);
    const width = 12;
    const height = 8;
    const cells = Array.from({ length: width * height }, () => ({
      wall: 0,
      floor: 1,
      ceiling: 1,
      light: 12,
      door: false,
    }));
    for (let y = 0; y < height; y++) cells[y * width + 6].wall = 1;
    for (let y = 3; y <= 4; y++) {
      cells[y * width + 6].wall = 0;
      cells[y * width + 6].door = true;
    }
    const grid = {
      width,
      height,
      get(x: number, y: number) {
        return cells[y * width + x].wall;
      },
    };
    const isDoorClosed = (x: number, y: number) => !!cells[y * width + x].door;
    renderWalls(
      fb,
      {
        grid,
        wallTextures: [solidTexture([180, 180, 180, 255])],
        doorTexture: solidTexture([10, 200, 10, 255]),
        isDoorClosed,
        lightLUT,
      },
      { x: 3.5, y: 4.5, angle: 0, fov: Math.PI / 3 }
    );
    const mid = ((fb.height >> 1) * fb.width + (fb.width >> 1)) * 4;
    const gClosed = fb.data[mid + 1];
    for (let y = 3; y <= 4; y++) cells[y * width + 6].door = false;
    renderWalls(
      fb,
      {
        grid,
        wallTextures: [solidTexture([180, 180, 180, 255])],
        doorTexture: solidTexture([10, 200, 10, 255]),
        isDoorClosed,
        lightLUT,
      },
      { x: 3.5, y: 4.5, angle: 0, fov: Math.PI / 3 }
    );
    const gOpen = fb.data[mid + 1];
    expect(gOpen).not.toBeGreaterThan(gClosed);
  });
});
