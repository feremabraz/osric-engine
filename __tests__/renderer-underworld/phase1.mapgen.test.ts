import * as Underworld from '@osric/renderer-underworld';
import { describe, expect, it } from 'vitest';

describe('Phase 1: map generator', () => {
  it('generates a 32x32 map with invariants', () => {
    const m = Underworld.Mapgen.generateMap(42, 32, 32);
    expect(m.width).toBe(32);
    expect(m.height).toBe(32);
    expect(m.cells.length).toBe(32 * 32);
    expect(m.cells.some((c) => c.door)).toBe(true);
    expect(m.playerStart.x).toBeGreaterThan(0);
    expect(m.playerStart.x).toBeLessThan(32);
    expect(m.playerStart.y).toBeGreaterThan(0);
    expect(m.playerStart.y).toBeLessThan(32);
    expect(m.actors.length).toBeGreaterThan(0);
  });
});
