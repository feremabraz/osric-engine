import {
  type CommandOutcome,
  Engine as CoreEngine,
  type EngineConfig,
  engineFail,
} from '@osric/engine';
import { mirrorBattleEffects } from './effects/mirrorBattleEffects';
import type { DomainMemoryStore } from './memoryStore';

/** Configuration for the OSRIC domain engine wrapper. */
export interface DomainEngineConfig {
  seed?: number;
  store: DomainMemoryStore;
}

/**
 * DomainEngine wraps the core engine to add domain-specific behavior,
 * such as mirroring battle effects for the renderer while keeping the
 * core pipeline deterministic and unchanged.
 */
export class DomainEngine {
  private core: CoreEngine;
  constructor(cfg: DomainEngineConfig) {
    this.core = new CoreEngine(cfg as EngineConfig);
  }

  /** Execute a domain command by key with parameters. */
  execute(key: string, params: unknown): CommandOutcome {
    const res = this.core.execute(key, params);
    if (res.ok && res.effects.length) {
      const mirrored = mirrorBattleEffects(res.effects);
      if (mirrored.length) {
        return { ...res, effects: [...res.effects, ...mirrored] } as CommandOutcome;
      }
    }
    return res;
  }

  /** Simulate a command without mutating the store; returns diff and effects. */
  simulate(key: string, params: unknown) {
    const sim = this.core.simulate(key, params);
    if (sim.result.ok && sim.effects.length) {
      const mirrored = mirrorBattleEffects(sim.effects);
      if (mirrored.length) {
        return { ...sim, effects: [...sim.effects, ...mirrored] };
      }
    }
    return sim;
  }

  /** Execute a batch of commands, optionally atomically, mirroring effects. */
  batch(items: { key: string; params: unknown }[], options: { atomic?: boolean } = {}) {
    const batchRes = this.core.batch(items, options);
    if (batchRes.effects.length) {
      const mirrored = mirrorBattleEffects(batchRes.effects);
      if (mirrored.length) {
        return { ...batchRes, effects: [...batchRes.effects, ...mirrored] };
      }
    }
    return batchRes;
  }

  /** Convenience wrapper for osric:grantXp. */
  grantXp(id: string, amount: number) {
    return this.execute('osric:grantXp', { id, amount });
  }

  /** Simulate osric:grantXp without committing changes. */
  simulateGrantXp(id: string, amount: number) {
    return this.simulate('osric:grantXp', { id, amount });
  }

  /** Helper to intentionally produce an engine failure (for testing). */
  unknownCommand() {
    return engineFail('UNKNOWN_COMMAND', 'forced unknown');
  }
}
