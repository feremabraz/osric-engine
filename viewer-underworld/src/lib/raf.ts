/** Small RAF helper for testability. */
export type RafHandle = number;

export function startRaf(loop: (t: number) => void): RafHandle {
  return requestAnimationFrame(loop);
}

export function cancelRaf(h: RafHandle): void {
  cancelAnimationFrame(h);
}
