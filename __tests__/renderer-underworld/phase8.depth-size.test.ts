import { createFramebuffer, renderWalls } from '@osric/renderer-underworld';
import { describe, expect, it } from 'vitest';

describe('Phase 8: depth buffer sizing sanity', () => {
  it('depth array has length equal to framebuffer width', () => {
    const fb = createFramebuffer(123, 77, [0, 0, 0, 255]);
    const grid = { width: 8, height: 8, get: (_x: number, _y: number) => 1 };
    const tex = { width: 2, height: 2, data: new Uint8ClampedArray(2 * 2 * 4) };
    const { depth } = renderWalls(
      fb,
      { grid, wallTextures: [tex] },
      { x: 3, y: 3, angle: 0, fov: Math.PI / 3 }
    );
    expect(depth.length).toBe(fb.width);
  });
});
