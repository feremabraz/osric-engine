export interface RNGState {
  s: number;
}

export class RNG {
  private _s: number;

  constructor(seed: number = Date.now()) {
    this._s = seed >>> 0 || 0x12345678;
  }

  getState(): RNGState {
    return { s: this._s };
  }
  setState(state: RNGState): void {
    this._s = state.s >>> 0;
  }

  float(): number {
    this._s += 0x6d2b79f5;
    let t = this._s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    const result = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    return result;
  }

  int(min: number, max: number): number {
    if (!Number.isInteger(min) || !Number.isInteger(max))
      throw new Error('RNG.int bounds must be integers');
    if (max < min) throw new Error('RNG.int max < min');
    const span = max - min + 1;
    return min + Math.floor(this.float() * span);
  }
}

export function createRng(seed?: number): RNG {
  return new RNG(seed);
}
