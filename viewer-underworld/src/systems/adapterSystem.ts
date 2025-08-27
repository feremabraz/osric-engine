import type { Effect } from '@osric/engine';
import * as RU from '@osric/renderer-underworld';

export interface AdapterSystemConfig {
  playerId?: string;
}

export interface AdapterSystem {
  toEngine(local: RU.Adapter.LocalCommand[], world: RU.Sim.World): RU.Adapter.EngineCommand[];
  apply(world: RU.Sim.World, effects: Effect[]): RU.Sim.World;
}

export function createAdapterSystem(cfg: AdapterSystemConfig = {}): AdapterSystem {
  const playerId = cfg.playerId ?? 'player';
  return {
    toEngine(local: RU.Adapter.LocalCommand[], world: RU.Sim.World) {
      return RU.Adapter.toEngineCommands(local, playerId, world);
    },
    apply(world: RU.Sim.World, effects: Effect[]) {
      if (!effects?.length) return world;
      return RU.Adapter.applyEngineEffects(world, effects);
    },
  };
}
