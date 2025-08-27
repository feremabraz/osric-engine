import * as Underworld from '@osric/renderer-underworld';
import { describe, expect, it } from 'vitest';

describe('Phase 1: palette and LUTs', () => {
  it('provides base palette and light/mood LUTs', () => {
    expect(Underworld.Palette.BASE_PALETTE.length).toBeGreaterThanOrEqual(16);
    const light = Underworld.Palette.makeLightLUT(16);
    expect(light.length).toBe(16);
    for (const v of light) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
    expect(Underworld.Palette.MOOD_LUTS.length).toBeGreaterThan(0);
  });
});
