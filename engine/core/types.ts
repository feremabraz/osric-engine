/**
 * Minimal engine store interface used for snapshot/restore.
 */
export interface EngineStore {
  snapshot(): unknown;
  restore(snapshot: unknown): void;
}

/**
 * Deep clone for plain data used by snapshotting. Rejects Maps, Sets, Symbols
 * and Functions to keep store payloads deterministic and serializable.
 */
export function deepClonePlain<T>(value: T): T {
  if (value === null || typeof value !== 'object') return value;
  if (value instanceof Date) return new Date(value.getTime()) as unknown as T;
  if (Array.isArray(value)) return value.map((v) => deepClonePlain(v)) as unknown as T;
  if (value instanceof Map || value instanceof Set) {
    throw new Error('Unsupported store value type (Map/Set) in snapshot');
  }
  const out: Record<string | symbol, unknown> = {};
  for (const k of Reflect.ownKeys(value as object)) {
    if (typeof k === 'symbol') throw new Error('Unsupported symbol key in store snapshot');
    const v = (value as Record<string, unknown>)[k];
    if (typeof v === 'function') throw new Error('Unsupported function value in store snapshot');
    if (typeof v === 'symbol') throw new Error('Unsupported symbol value in store snapshot');
    out[k] = deepClonePlain(v as unknown);
  }
  return out as T;
}

/**
 * Simple in-memory store backed by a plain object. Good default for tests and
 * headless simulations. Not intended for concurrent use across workers.
 */
export class MemoryStore<TState extends object = Record<string, unknown>> implements EngineStore {
  private state: TState;
  constructor(initial: TState) {
    this.state = deepClonePlain(initial);
  }
  snapshot(): unknown {
    return deepClonePlain(this.state);
  }
  restore(snapshot: unknown): void {
    this.state = deepClonePlain(snapshot) as TState;
  }

  /** Obtain a mutable reference to the internal state (for command rules). */
  getState(): TState {
    return this.state;
  }
  /** Apply an in-place mutation on the internal state. */
  mutate(mutator: (state: TState) => void): void {
    mutator(this.state);
  }
}
