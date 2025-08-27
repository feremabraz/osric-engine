import * as Underworld from '@osric/renderer-underworld';
import { describe, expect, it } from 'vitest';

describe('Phase 1: procedural textures', () => {
  it('generates base textures with expected counts and sizes', () => {
    const set = Underworld.Textures.generateBaseTextures(123);
    expect(set.length).toBe(7);
    for (const tex of set) {
      expect(tex.texture.width).toBe(64);
      expect(tex.texture.height).toBe(64);
      expect(tex.texture.data.length).toBe(64 * 64 * 4);
      expect(tex.id).toBeTypeOf('string');
    }
  });
});
