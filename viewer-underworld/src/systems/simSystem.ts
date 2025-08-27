import { createRng } from '@osric/engine';
import type { Effect } from '@osric/engine';
import { DomainEngine, DomainMemoryStore } from '@osric/osric-engine';
import * as Renderer from '@osric/renderer-underworld';
import type { SimSystem, SimSystemConfig } from '../types/systems';

export function createSimSystem(cfg: SimSystemConfig): SimSystem {
  const store = new DomainMemoryStore();
  const engine = new DomainEngine({ store, seed: cfg.seed });
  let world: Renderer.Sim.World = cfg.initialWorld;
  const playerId = cfg.playerId ?? 'player';

  return {
    getWorld() {
      return world;
    },
    setWorld(w: Renderer.Sim.World) {
      world = w;
    },
    step(local: Renderer.Adapter.LocalCommand[]): { world: Renderer.Sim.World; effects: Effect[] } {
      const cmds = Renderer.Adapter.toEngineCommands(local, playerId, world);
      let effects: Effect[] = [];
      for (const c of cmds) {
        const res = engine.execute(c.key, c.params);
        if (res.effects.length) effects = effects.concat(res.effects);
      }
      let next = world;
      if (effects.length) next = Renderer.Adapter.applyEngineEffects(next, effects);
      next = Renderer.Sim.advanceTurn(next, [{ type: 'Wait' }], createRng(cfg.seed));
      world = next;
      return { world, effects };
    },
  };
}
