import { processBatch } from '../core/batch';
import { EffectsBuffer } from '../core/effects';
import { runCommand } from '../core/executor';
import { type CommandOutcome, type Effect, engineFail } from '../core/result';
import { createRng } from '../core/rng';
import type { RNG } from '../core/rng';
import type { EngineStore } from '../core/types';
import { CommandRegistry } from './registry';
import { type SimulationDiff, diffSnapshots } from './simulate';

/** Initialization options for the Engine facade. */
export interface EngineConfig {
  seed?: number;
  store: EngineStore;
}

export interface BatchItem {
  key: string;
  params: unknown;
}
export interface BatchResult {
  ok: boolean;
  results: CommandOutcome[];
  effects: Effect[];
  failed?: CommandOutcome[];
}

/** Deterministic engine facade with execute/simulate/batch APIs.
 * Construct with a seed and a store for reproducible runs.
 */
export class Engine {
  private rng: RNG;
  private store: EngineStore;

  /** Create a new Engine.
   * @param cfg Seed and store implementation.
   */
  constructor(cfg: EngineConfig) {
    this.rng = createRng(cfg.seed);
    this.store = cfg.store;
  }

  /** Current RNG state (for tests/tooling). */
  public getRngState() {
    return this.rng.getState();
  }

  /** Execute a registered command by key against the live store.
   * @returns Command outcome with data/effects or failure.
   */
  execute(key: string, params: unknown): CommandOutcome {
    const descriptor = CommandRegistry.get(key);
    if (!descriptor) return engineFail('UNKNOWN_COMMAND', `unknown command: ${key}`);
    const effects = new EffectsBuffer();
    return runCommand(descriptor, params, { rng: this.rng, effects, store: this.store });
  }

  /** Simulate a command without persisting store/RNG changes.
   * Returns the outcome, a structural diff, and any effects that would be emitted.
   */
  simulate(
    key: string,
    params: unknown
  ): { result: CommandOutcome; diff: SimulationDiff; effects: Effect[] } {
    const beforeStore = this.store.snapshot();
    const rngState = this.rng.getState();
    const descriptor = CommandRegistry.get(key);
    if (!descriptor) {
      const failure = engineFail('UNKNOWN_COMMAND', `unknown command: ${key}`);
      return { result: failure, diff: { created: [], deleted: [], mutated: [] }, effects: [] };
    }
    const effects = new EffectsBuffer();
    const result = runCommand(descriptor, params, { rng: this.rng, effects, store: this.store });
    const afterStore = this.store.snapshot();
    this.store.restore(beforeStore);
    this.rng.setState(rngState);
    const diff = diffSnapshots(beforeStore, afterStore);
    const simEffects = result.ok ? Array.from(result.effects) : [];
    return { result, diff, effects: simEffects };
  }

  /** Execute a batch of commands.
   * In atomic mode, rolls back store & RNG on the first failure.
   */
  batch(items: BatchItem[], options: { atomic?: boolean } = {}): BatchResult {
    return processBatch({
      items,
      options,
      resolve: (k: string) => CommandRegistry.get(k),
      rng: this.rng,
      store: this.store,
    });
  }
}
