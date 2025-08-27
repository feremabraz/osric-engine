import { createRng } from '@osric/engine';
import { Mapgen, Sim } from '@osric/renderer-underworld';
import { describe, expect, it } from 'vitest';

describe('Phase 6: effects and camera juice', () => {
  it('hit flash toggles for fixed ticks then clears', () => {
    const map = Mapgen.generateMap(1, 8, 8);
    let world = Sim.createWorldFromMap(map);
    const actorId = world.actors[0]?.id ?? 1;
    world = Sim.enqueueHitFlash(world, actorId, 3);
    const rng = createRng(0);
    let w = world;
    w = Sim.advanceTurn(w, [], rng);
    expect(w.hitFlashes.get(actorId)).toBe(2);
    w = Sim.advanceTurn(w, [], rng);
    expect(w.hitFlashes.get(actorId)).toBe(1);
    w = Sim.advanceTurn(w, [], rng);
    expect(w.hitFlashes.has(actorId)).toBe(false);
  });

  it('dissolve removes actor after fixed steps', () => {
    const map = Mapgen.generateMap(2, 8, 8);
    let world = Sim.createWorldFromMap(map);
    const actorId = world.actors[0]?.id ?? 1;
    world = Sim.startDissolve(world, actorId, 4);
    const rng = createRng(0);
    let w = world;
    for (let i = 0; i < 3; i++) w = Sim.advanceTurn(w, [], rng);
    expect(w.actors.some((a) => a.id === actorId)).toBe(true);
    w = Sim.advanceTurn(w, [], rng);
    expect(w.actors.some((a) => a.id === actorId)).toBe(false);
  });

  it('camera shake produces deterministic small offsets and ends after duration', () => {
    const map = Mapgen.generateMap(3, 8, 8);
    let world = Sim.createWorldFromMap(map);
    world = Sim.startCameraShake(world, 2, 3, 7);
    const rng = createRng(0);
    let w = world;
    const offsets: Array<{ ox: number; oy: number }> = [];
    for (let i = 0; i < 3; i++) {
      offsets.push(Sim.getCameraOffset(w));
      w = Sim.advanceTurn(w, [], rng);
    }
    expect(offsets[0]).not.toEqual({ ox: 0, oy: 0 });
    expect(Sim.getCameraOffset(w)).toEqual({ ox: 0, oy: 0 });
  });
});
