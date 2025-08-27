import type { LightLUT, MoodLUT, Palette, Texture } from '../types';

/** Base 16-color palette used by procedural shading. */
export const BASE_PALETTE: Palette = [
  { r: 10, g: 10, b: 12 },
  { r: 28, g: 28, b: 34 },
  { r: 42, g: 42, b: 54 },
  { r: 62, g: 62, b: 78 },
  { r: 85, g: 85, b: 105 },
  { r: 120, g: 120, b: 140 },
  { r: 160, g: 160, b: 178 },
  { r: 200, g: 200, b: 210 },
  { r: 90, g: 60, b: 45 },
  { r: 140, g: 100, b: 70 },
  { r: 70, g: 70, b: 90 },
  { r: 50, g: 70, b: 90 },
  { r: 40, g: 90, b: 60 },
  { r: 120, g: 60, b: 60 },
  { r: 180, g: 120, b: 90 },
  { r: 220, g: 200, b: 160 },
];

/**
 * Build a perceptual light curve lookup with `levels` steps (default 16).
 * Values are in [0,1] and non-decreasing; index 0 is darkest.
 */
export function makeLightLUT(levels = 16): LightLUT {
  const lut: number[] = [];
  for (let i = 0; i < levels; i++) {
    const t = i / (levels - 1);
    const v = 0.2 + 0.8 * t * t;
    lut.push(v);
  }
  return lut;
}

export const MOOD_LUTS: MoodLUT[] = [
  { name: 'warm', multiply: { r: 1, g: 0.9, b: 0.8 }, add: { r: 0.05, g: 0.0, b: 0.0 } },
  { name: 'cold', multiply: { r: 0.85, g: 0.9, b: 1.1 }, add: { r: 0.0, g: 0.0, b: 0.05 } },
];

/**
 * Apply scalar light and an optional mood tint to a texture, returning a new texture.
 * Output channels are clamped to [0,255]; alpha is preserved.
 */
export function applyLightAndMood(tex: Texture, light: number, mood?: MoodLUT): Texture {
  const out = new Uint8ClampedArray(tex.data.length);
  const L = Math.max(0, Math.min(1, light));
  const mul = mood?.multiply ?? { r: 1, g: 1, b: 1 };
  const add = mood?.add ?? { r: 0, g: 0, b: 0 };
  for (let i = 0; i < tex.data.length; i += 4) {
    let r = tex.data[i] * L;
    let g = tex.data[i + 1] * L;
    let b = tex.data[i + 2] * L;
    r = Math.max(0, Math.min(255, r * mul.r + add.r * 255));
    g = Math.max(0, Math.min(255, g * mul.g + add.g * 255));
    b = Math.max(0, Math.min(255, b * mul.b + add.b * 255));
    out[i] = r;
    out[i + 1] = g;
    out[i + 2] = b;
    out[i + 3] = tex.data[i + 3];
  }
  return { width: tex.width, height: tex.height, data: out };
}
