import { Sprites } from '@osric/renderer-underworld';
import type { Texture } from '@osric/renderer-underworld';
import { describe, expect, it } from 'vitest';

function solid(w = 8, h = 10, rgba: [number, number, number, number] = [255, 0, 0, 255]): Texture {
  const data = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = rgba[0];
    data[i + 1] = rgba[1];
    data[i + 2] = rgba[2];
    data[i + 3] = rgba[3];
  }
  return { width: w, height: h, data };
}

describe('Phase 8: createSpriteProvider mapping', () => {
  it('maps kind.variant keys and uses variant-specific pivot if provided', () => {
    const images = {
      'knight.main': solid(8, 12),
      'knight.alt': solid(8, 16),
      slime: solid(8, 6),
    } satisfies Record<string, Texture>;
    const pivots = {
      knight: 10,
      'knight.main': 12,
      slime: 6,
    } as const;
    const provider = Sprites.createSpriteProvider(images, pivots);
    const kMain = provider.get('knight', 'main');
    const kAlt = provider.get('knight', 'alt');
    const sl = provider.get('slime', 'main');
    expect(kMain?.pivotY).toBe(12); // variant-specific overrides base
    expect(kAlt?.pivotY).toBe(10); // falls back to kind-level pivot
    expect(sl?.pivotY).toBe(6); // kind-level pivot used
  });

  it('defaults pivot to texture height when not provided', () => {
    const images = { imp: solid(8, 14) } as Record<string, Texture>;
    const provider = Sprites.createSpriteProvider(images);
    const img = provider.get('imp', 'main');
    expect(img?.pivotY).toBe(14);
  });
});
