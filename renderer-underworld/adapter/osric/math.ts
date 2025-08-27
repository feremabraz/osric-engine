/** @internal Return angle from (px,py) to (ax,ay). */
export function angleTo(px: number, py: number, ax: number, ay: number): number {
  return Math.atan2(ay - py, ax - px);
}

/** @internal Normalize an angle to (-PI, PI]. */
export function norm(a: number): number {
  let v = a;
  const twoPi = Math.PI * 2;
  while (v <= -Math.PI) v += twoPi;
  while (v > Math.PI) v -= twoPi;
  return v;
}
