/** A simple color in 8-bit RGBA. */
export type RGBA = {
  readonly r: number;
  readonly g: number;
  readonly b: number;
  readonly a: number;
};

/**
 * CPU-side texture data expected by the renderer.
 * width/height are in pixels. `data` is RGBA8, length = width * height * 4.
 * Note: `data` contents are mutable; the property reference is readonly to avoid reassignment.
 */
export type Texture = {
  readonly width: number;
  readonly height: number;
  readonly data: Uint8ClampedArray;
};

/** Fixed palette of RGB colors. */
export type Palette = ReadonlyArray<{ readonly r: number; readonly g: number; readonly b: number }>;

/**
 * Light lookup table. Values should be within [0,1].
 * Recommended length is 16; some shaders expect >= 16 entries.
 */
export type LightLUT = ReadonlyArray<number>;

/** Mood color transform with per-channel multiply and add. */
export type MoodLUT = {
  readonly name: string;
  readonly multiply: { readonly r: number; readonly g: number; readonly b: number };
  readonly add: { readonly r: number; readonly g: number; readonly b: number };
};

// Branded scalar types used across the renderer and sim
export type Tick = number & { readonly __brand: 'Tick' };
export type Seed = number & { readonly __brand: 'Seed' };
