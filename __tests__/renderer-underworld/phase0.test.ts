import { createRng } from '@osric/engine';
import * as Underworld from '@osric/renderer-underworld';
import { describe, expect, it } from 'vitest';

describe('renderer-underworld Phase 0', () => {
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

  it('Types compile and basic API exists', () => {
    const state: Underworld.WorldState = {
      tick: 0 as Underworld.Tick,
      seed: 1 as Underworld.Seed,
      player: { x: 0, y: 0, angle: 0 },
    };
    const res = Underworld.applyCommand(state, { type: 'Wait' });
    expect(res.next).toBe(state);
    expect(Array.isArray(res.effects)).toBe(true);
  });
});
