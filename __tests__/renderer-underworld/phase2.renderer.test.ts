import { blitNearestUpscaled, createFramebuffer, renderWalls } from '@osric/renderer-underworld';
import { describe, expect, it } from 'vitest';

function makeCheckerTexture(size = 64) {
  const data = new Uint8ClampedArray(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const c = ((x >> 3) ^ (y >> 3)) & 1 ? 200 : 60;
      data[i] = c;
      data[i + 1] = c;
      data[i + 2] = c;
      data[i + 3] = 255;
    }
  }
  return { width: size, height: size, data };
}

describe('Phase 2: framebuffer + blit', () => {
  it('creates and clears a framebuffer and blits with letterboxing', () => {
    const fb = createFramebuffer(320, 200, [10, 20, 30, 255]);
    expect(fb.data[0]).toBe(10);
    expect(fb.data[1]).toBe(20);
    expect(fb.data[2]).toBe(30);
    const out = blitNearestUpscaled(fb, 800, 600);
    expect(out.width).toBe(800);
    expect(out.height).toBe(600);
    const di = ((600 >> 1) * 800 + (800 >> 1)) * 4;
    expect(out.data[di]).toBeTypeOf('number');
  });
});

describe('Phase 2: ray casting (walls only) + depth buffer', () => {
  it('renders a simple vertical wall correctly with finite, monotonic depth', () => {
    const fb = createFramebuffer(160, 120, [0, 0, 0, 255]);
    const grid = {
      width: 16,
      height: 16,
      get(x: number, y: number) {
        if (x < 0 || y < 0 || x >= this.width || y >= this.height) return 1;
        if (x === 5) return 1;
        return 0;
      },
    };
    const wallTex = makeCheckerTexture(64);
    const cam = { x: 2.5, y: 8, angle: 0, fov: Math.PI / 3 };
    const { depth } = renderWalls(fb, { grid, wallTextures: [wallTex] }, cam);
    const mid = ((fb.height >> 1) * fb.width + (fb.width >> 1)) * 4;
    expect(fb.data[mid + 3]).toBe(255);
    for (let x = 1; x < fb.width; x++) {
      expect(Number.isFinite(depth[x])).toBe(true);
    }
    const cx = fb.width >> 1;
    const left = depth[cx - 2];
    const center = depth[cx];
    const right = depth[cx + 2];
    expect(left).toBeGreaterThan(0);
    expect(center).toBeGreaterThan(0);
    expect(right).toBeGreaterThan(0);
  });
});
