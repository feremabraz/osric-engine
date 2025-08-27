import { createRng } from '@osric/engine';
import type { Texture } from '@osric/renderer-underworld';

function makeTexture(width: number, height: number): Texture {
  return { width, height, data: new Uint8ClampedArray(width * height * 4) };
}

function put(tex: Texture, x: number, y: number, r: number, g: number, b: number, a = 255) {
  const i = (y * tex.width + x) * 4;
  tex.data[i] = r;
  tex.data[i + 1] = g;
  tex.data[i + 2] = b;
  tex.data[i + 3] = a;
}

export type TexKind =
  | 'wall_brick'
  | 'wall_stone'
  | 'wall_wood'
  | 'wall_metal'
  | 'floor_stone'
  | 'floor_tile'
  | 'ceiling_plaster';

export function generateTexture(kind: TexKind, seed: number, size = 64): Texture {
  const rng = createRng(seed);
  const t = makeTexture(size, size);
  let base: [number, number, number] = [100, 100, 100];
  if (kind === 'wall_brick') base = [120, 60, 50];
  if (kind === 'wall_stone') base = [90, 90, 100];
  if (kind === 'wall_wood') base = [110, 80, 50];
  if (kind === 'wall_metal') base = [120, 120, 125];
  if (kind === 'floor_stone') base = [80, 80, 80];
  if (kind === 'floor_tile') base = [95, 95, 95];
  if (kind === 'ceiling_plaster') base = [120, 120, 130];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const n =
        (Math.sin((x + seed) * 0.1) + Math.cos((y - seed) * 0.13)) * 0.5 +
        (rng.float() - 0.5) * 0.1;
      const r = Math.max(0, Math.min(255, base[0] + n * 40));
      const g = Math.max(0, Math.min(255, base[1] + n * 40));
      const b = Math.max(0, Math.min(255, base[2] + n * 40));
      put(t, x, y, r, g, b, 255);
    }
  }
  if (kind.startsWith('wall_brick')) {
    const h = Math.floor(size / 8);
    for (let y = 0; y < size; y++) {
      if (y % h === 0) for (let x = 0; x < size; x++) put(t, x, y, 40, 20, 20, 255);
      if (Math.floor(y / h) % 2 === 1) put(t, (y * 5) % size, y, 40, 20, 20, 255);
    }
  }
  if (kind === 'floor_tile') {
    for (let i = 0; i < size; i++) {
      put(t, i, 0, 70, 70, 70);
      put(t, 0, i, 70, 70, 70);
    }
    for (let y = 0; y < size; y += 8) for (let x = 0; x < size; x++) put(t, x, y, 70, 70, 70);
    for (let x = 0; x < size; x += 8) for (let y = 0; y < size; y++) put(t, x, y, 70, 70, 70);
  }
  return t;
}

export function generateBaseTextures(seed: number) {
  const ids: TexKind[] = [
    'wall_brick',
    'wall_stone',
    'wall_wood',
    'wall_metal',
    'floor_stone',
    'floor_tile',
    'ceiling_plaster',
  ];
  return ids.map((id, i) => ({ id, texture: generateTexture(id, seed + i) }));
}
