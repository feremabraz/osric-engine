import { createRng } from '@osric/engine';
import { Mapgen, Sim } from '@osric/renderer-underworld';
import { describe, expect, it } from 'vitest';

describe('Phase 5: movement, collision, turn system, AI', () => {
  it('prevents player from moving through walls and doors', () => {
    const map = Mapgen.generateMap(42, 12, 12);
    const world = Sim.createWorldFromMap(map);
    const tx = Math.floor(world.player.x) + 1;
    const ty = Math.floor(world.player.y);
    const idx = ty * map.width + tx;
    map.cells[idx].door = true;
    const rng = createRng(1);
    const w1 = Sim.advanceTurn(world, [{ type: 'MoveForward' }], rng);
    expect(w1.player.x).toBeCloseTo(world.player.x);
    expect(w1.player.y).toBeCloseTo(world.player.y);
    const w2 = Sim.advanceTurn(w1, [{ type: 'OpenDoor' }], rng);
    const w3 = Sim.advanceTurn(w2, [{ type: 'MoveForward' }], rng);
    expect(Math.hypot(w3.player.x - world.player.x, w3.player.y - world.player.y)).toBeGreaterThan(
      0.1
    );
  });

  it('consumes commands only on advanceTurn and AI moves deterministically', () => {
    const map = Mapgen.generateMap(7, 12, 12);
    const world0 = Sim.createWorldFromMap(map);
    const rng = createRng(123);
    const w1 = Sim.advanceTurn(world0, [], rng);
    expect(w1.tick).toBe((world0.tick as unknown as number) + 1);
    let w = w1;
    for (let i = 0; i < 5; i++) w = Sim.advanceTurn(w, [{ type: 'MoveForward' }], rng);
    const snapshot = w.actors.map((a) => ({ x: a.x, y: a.y }));
    const rng2 = createRng(123);
    let wr = Sim.createWorldFromMap(map);
    wr = Sim.advanceTurn(wr, [], rng2);
    for (let i = 0; i < 5; i++) wr = Sim.advanceTurn(wr, [{ type: 'MoveForward' }], rng2);
    const snapshot2 = wr.actors.map((a) => ({ x: a.x, y: a.y }));
    expect(JSON.stringify(snapshot2)).toBe(JSON.stringify(snapshot));
  });
});
