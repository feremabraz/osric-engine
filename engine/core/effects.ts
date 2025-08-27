import type { Effect } from './result';

/** Append-only buffer for accumulating effects during command execution. */
export class EffectsBuffer {
  private list: Effect[] = [];

  /** Add a typed effect with optional payload. */
  add(type: string, target: string, payload?: unknown): void {
    const effect: Effect = payload === undefined ? { type, target } : { type, target, payload };
    this.list.push(effect);
  }

  /** Return a frozen snapshot of accumulated effects and clear the buffer. */
  drain(): readonly Effect[] {
    const snapshot = Object.freeze(this.list.slice());
    this.list.length = 0;
    return snapshot;
  }

  /** Current number of buffered effects. */
  size(): number {
    return this.list.length;
  }

  /** True if no effects are buffered. */
  isEmpty(): boolean {
    return this.list.length === 0;
  }
}
