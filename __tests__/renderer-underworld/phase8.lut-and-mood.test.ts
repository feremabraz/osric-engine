import { Palette } from '@osric/renderer-underworld';
import type { Texture } from '@osric/renderer-underworld';
import { describe, expect, it } from 'vitest';

function gradientTex(): Texture {
  const w = 4;
  const h = 1;
  const data = new Uint8ClampedArray(w * h * 4);
  for (let x = 0; x < w; x++) {
    const i = x * 4;
    data[i] = x * 60; // 0,60,120,180
    data[i + 1] = x * 60;
    data[i + 2] = x * 60;
    data[i + 3] = 255;
  }
  return { width: w, height: h, data };
}

describe('Phase 8: LUTs and mood application', () => {
  it('makeLightLUT produces in-bounds, non-decreasing values', () => {
    const lut = Palette.makeLightLUT(16);
    expect(lut.length).toBe(16);
    let prev = Number.NEGATIVE_INFINITY;
    for (const v of lut) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
      expect(v).toBeGreaterThanOrEqual(prev);
      prev = v;
    }
  });

  it('applyLightAndMood clamps and tints within bounds', () => {
    const tex = gradientTex();
    const mood = Palette.MOOD_LUTS[0];
    const out = Palette.applyLightAndMood(tex, 1.5, mood);
    for (let i = 0; i < out.data.length; i += 4) {
      expect(out.data[i]).toBeGreaterThanOrEqual(0);
      expect(out.data[i]).toBeLessThanOrEqual(255);
      expect(out.data[i + 1]).toBeGreaterThanOrEqual(0);
      expect(out.data[i + 1]).toBeLessThanOrEqual(255);
      expect(out.data[i + 2]).toBeGreaterThanOrEqual(0);
      expect(out.data[i + 2]).toBeLessThanOrEqual(255);
      expect(out.data[i + 3]).toBe(255);
    }
  });
});
