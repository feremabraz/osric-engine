import { Mapgen, Sim } from '@osric/renderer-underworld';
import { describe, expect, it } from 'vitest';
import { DEFAULT_TARGETING_ATTACK } from '../../renderer-underworld/adapter/osric/config';
import {
  forwardDelta,
  moveWithSlide,
  strafeDelta,
} from '../../renderer-underworld/adapter/osric/motion';
import { hasLOS, pickBestTarget } from '../../renderer-underworld/adapter/osric/targeting';
import type { MapData } from '../../renderer-underworld/world/mapgen';
import type { World } from '../../renderer-underworld/world/sim';

describe('Phase 9: motion and targeting helpers', () => {
  it('forwardDelta and strafeDelta return orthogonal vectors', () => {
    const f = forwardDelta(0, 1);
    const sL = strafeDelta(0, 1, -1);
    const sR = strafeDelta(0, 1, 1);
    expect(f.dx).toBeCloseTo(1, 6);
    expect(f.dy).toBeCloseTo(0, 6);
    expect(sL.dx).toBeCloseTo(0, 6);
    expect(sL.dy).toBeCloseTo(-1, 6);
    expect(sR.dx).toBeCloseTo(0, 6);
    expect(sR.dy).toBeCloseTo(1, 6);
  });

  it('moveWithSlide blocks into walls but allows axis slide', () => {
    // Handcrafted cross corridor map for determinism
    const width = 6;
    const height = 6;
    const cells: MapData['cells'] = Array.from({ length: width * height }, () => ({
      wall: 1,
      floor: 1,
      ceiling: 1,
      light: 8,
      door: false,
    }));
    const at = (x: number, y: number) => cells[y * width + x];
    at(2, 2).wall = 0;
    at(3, 2).wall = 0;
    at(4, 2).wall = 0;
    at(3, 1).wall = 0;
    at(3, 3).wall = 0;
    const map: MapData = {
      width,
      height,
      cells,
      playerStart: { x: 3.5, y: 2.5, angle: 0 },
      actors: [],
    };
    const world: World = Sim.createWorldFromMap(map) as World;
    const from = { x: 3.5, y: 2.5 };
    const moved = moveWithSlide(world, from.x, from.y, from.x + 1, from.y + 1);
    const slidAxis = moved.x === from.x || moved.y === from.y;
    expect(slidAxis).toBe(true);
  });

  it('hasLOS returns false when a wall blocks the path', () => {
    const map = Mapgen.generateMap(2, 8, 8);
    const world: World = Sim.createWorldFromMap(map) as World;
    // Ensure a solid wall line between points
    for (let y = 0; y < world.map.height; y++) {
      world.map.cells[y * world.map.width + 4].wall = 1;
    }
    const a = { x: 2.5, y: 2.5 };
    const b = { x: 6.5, y: 2.5 };
    expect(hasLOS(world, a.x, a.y, b.x, b.y, 16)).toBe(false);
  });

  it('pickBestTarget picks nearest in FOV with LOS', () => {
    const map = Mapgen.generateMap(3, 12, 8);
    let world = Sim.createWorldFromMap(map) as World;
    world.player = { x: 2.5, y: 2.5, angle: 0 };
    world.actors = [
      { id: 1, x: 5.5, y: 2.5, kind: 'skeleton', facing: 0, state: 'idle' },
      { id: 2, x: 5.5, y: 4.5, kind: 'knight', facing: 0, state: 'idle' },
    ];
    world = Sim.registerCharacterMapping(world, 'orc-1', 1);
    world = Sim.registerCharacterMapping(world, 'orc-2', 2);
    const target = pickBestTarget(world, world.player, DEFAULT_TARGETING_ATTACK);
    expect(target).toBe('orc-1');
  });
});
