/**
 * Deterministic pseudo-random number generator used by the engine.
 *
 * The generator is seedable and its state is snapshottable via `getState`/`setState`
 * to guarantee deterministic simulations and batch rollback.
 */
export interface RNGState {
  s: number;
}

/** Small, fast PRNG suitable for gameplay determinism (not crypto). */
export class RNG {
  private _s: number;

  constructor(seed: number = Date.now()) {
    this._s = seed >>> 0 || 0x12345678;
  }

  /** Obtain a copy of the current internal state. */
  getState(): RNGState {
    return { s: this._s };
  }
  /** Restore the internal state from a previous snapshot. */
  setState(state: RNGState): void {
    this._s = state.s >>> 0;
  }

  /** Uniform float in [0, 1). */
  float(): number {
    this._s += 0x6d2b79f5;
    let t = this._s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    const result = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    return result;
  }

  /** Integer in [min, max], inclusive. Throws if bounds are invalid. */
  int(min: number, max: number): number {
    if (!Number.isInteger(min) || !Number.isInteger(max))
      throw new Error('RNG.int bounds must be integers');
    if (max < min) throw new Error('RNG.int max < min');
    const span = max - min + 1;
    return min + Math.floor(this.float() * span);
  }
}

/** Factory for creating an `RNG` with optional seed. */
export function createRng(seed?: number): RNG {
  return new RNG(seed);
}
