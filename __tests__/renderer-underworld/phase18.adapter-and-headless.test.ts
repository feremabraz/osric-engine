import type { Effect } from '@osric/engine';
import { DomainEngine, DomainMemoryStore } from '@osric/osric-engine';
import {
  Adapter,
  Mapgen,
  Palette,
  Sim,
  createFramebuffer,
  renderBillboards,
  renderFloorCeiling,
  renderWalls,
} from '@osric/renderer-underworld';
import type { SpriteProvider } from '@osric/renderer-underworld';
import { describe, expect, it } from 'vitest';

function mkWorld() {
  const map = Mapgen.generateMap(42, 16, 16);
  const world = Sim.createWorldFromMap(map);

  world.characterMap?.set('player', 0);
  return world;
}

describe('Phase 18: adapter and headless invariants', () => {
  it('adapter maps local inputs to engine commands', () => {
    const world = mkWorld();
    const cmds: Sim.Command[] = [
      { type: 'TurnLeft' },
      { type: 'MoveForward' },
      { type: 'OpenDoor' },
      { type: 'Wait' },
    ];
    const out = Adapter.toEngineCommands(cmds, 'player', world);
    const keys = out.map((c) => c.key);
    expect(keys).toEqual(['osric:turn', 'osric:move', 'osric:doorToggle', 'osric:wait']);
  });

  it('applyEngineEffects moves player and toggles door from engine effects', () => {
    let world = mkWorld();
    const px0 = world.player.x;
    const py0 = world.player.y;
    const effects: Effect[] = [
      { type: 'Turn', target: 'player', payload: { direction: 'right', amount: Math.PI / 12 } },
      { type: 'Move', target: 'player', payload: { direction: 'forward', distance: 0.5 } },
      { type: 'DoorToggle', target: 'player', payload: {} },
    ];
    world = Adapter.applyEngineEffects(world, effects);
    expect(world.player.x).not.toBe(px0);
    expect(world.player.y).not.toBe(py0);
  });

  it('headless render: sprite occludes/appears correctly after movement', () => {
    const width = 100;
    const height = 80;
    const fb = createFramebuffer(width, height, [0, 0, 0, 255]);
    const lightLUT = Palette.makeLightLUT(16);
    const gridW = 12;
    const gridH = 8;
    const cells = Array.from({ length: gridW * gridH }, () => ({
      wall: 0,
      floor: 1,
      ceiling: 1,
      light: 12,
    }));
    for (let x = 0; x < gridW; x++) cells[(gridH - 1) * gridW + x].wall = 1;
    const grid = {
      width: gridW,
      height: gridH,
      get(x: number, y: number) {
        return cells[y * gridW + x].wall;
      },
    };
    const fcGrid = {
      width: gridW,
      height: gridH,
      get(x: number, y: number) {
        const c = cells[y * gridW + x];
        return { floor: c.floor, ceiling: c.ceiling, light: c.light };
      },
    };
    const cam = { x: 2.5, y: 2.5, angle: 0, fov: Math.PI / 3 };
    const solid = (r: number, g: number, b: number, a = 255) => ({
      width: 32,
      height: 32,
      data: new Uint8ClampedArray(
        Array.from({ length: 32 * 32 * 4 }, (_, i) => [r, g, b, a][i % 4])
      ),
    });
    renderFloorCeiling(
      fb,
      {
        grid: fcGrid,
        floorTextures: [solid(40, 40, 40, 255)],
        ceilingTextures: [solid(40, 40, 60, 255)],
        lightLUT,
      },
      cam
    );
    const { depth } = renderWalls(
      fb,
      { grid, wallTextures: [solid(180, 180, 180, 255)], lightLUT },
      cam
    );
    const atlas: SpriteProvider = {
      get() {
        return { texture: solid(220, 40, 40, 255), pivotY: 32 };
      },
    };
    renderBillboards(fb, depth, cam, [{ x: 4, y: 2.5, kind: 'knight', variant: 'main' }], atlas, 0);
    const mid = ((fb.height >> 1) * fb.width + (fb.width >> 1)) * 4;
    const r1 = fb.data[mid];
    expect(r1).toBeGreaterThan(150);
  });

  it('BattleMove effect moves mapped actor within world using collision slide', () => {
    let world = mkWorld();
    world.actors.push({
      id: 101,
      x: world.player.x + 1,
      y: world.player.y,
      kind: 'skeleton',
      facing: 0,
      state: 'idle',
    });
    world.characterMap?.set('orc-1', 101);
    const effects: Effect[] = [
      { type: 'BattleMove', target: 'orc-1', payload: { id: 'orc-1', dx: -0.5, dy: 0 } },
    ];
    world = Adapter.applyEngineEffects(world, effects);
    const moved = world.actors.find((a) => a.id === 101);
    expect(moved).toBeDefined();
    if (moved) expect(moved.x).toBeLessThan(world.player.x + 1);
  });

  it('roundtrip: local inputs -> engine commands -> effects -> applied to world', () => {
    const store = new DomainMemoryStore();
    const engine = new DomainEngine({ store, seed: 1 });
    engine.execute('osric:createCharacter', { id: 'player', name: 'Player' });
    let world = mkWorld();
    const inputs: Sim.Command[] = [
      { type: 'TurnRight' },
      { type: 'MoveForward' },
      { type: 'Wait' },
    ];
    const cmds = Adapter.toEngineCommands(inputs, 'player', world);
    const allEffects: Effect[] = [];
    for (const c of cmds) {
      const res = engine.execute(c.key, c.params);
      if (res.ok) allEffects.push(...res.effects);
    }
    const x0 = world.player.x;
    const y0 = world.player.y;
    world = Adapter.applyEngineEffects(world, allEffects);
    expect(world.player.x).not.toBe(x0);
    expect(world.player.y).not.toBe(y0);
  });
});
