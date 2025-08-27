import { createRng } from '@osric/engine';
import * as Underworld from '@osric/renderer-underworld';
import { describe, expect, it } from 'vitest';

describe('Phase 7: renderer-underworld', () => {
  it('RNG produces numbers for a given seed', () => {
    const r = createRng(123 as number);
    const a = r.float();
    const b = r.float();
    const c = r.float();
    expect(typeof a).toBe('number');
    expect(typeof b).toBe('number');
    expect(typeof c).toBe('number');
    expect(a).not.toBeNaN();
    expect(b).not.toBeNaN();
    expect(c).not.toBeNaN();
  });

  it('Types compile and basic Sim API exists', () => {
    const seed = 1 as Underworld.Seed;
    const map = Underworld.Mapgen.generateMap(seed as unknown as number, 8, 8);
    const world = Underworld.Sim.createWorldFromMap(map);
    const res = Underworld.Sim.advanceTurn(
      world,
      [{ type: 'Wait' }],
      createRng(seed as unknown as number)
    );
    expect(res).toBeTruthy();
    expect(res.tick).not.toBe(world.tick);
    expect(res.player).toBeTruthy();
  });
});
