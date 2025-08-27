import type { Texture } from '@osric/renderer-underworld';

export type Materials = {
  walls: Texture[];
  floors: Texture[];
  ceilings: Texture[];
};

export function createMaterials(opts: Partial<Materials> & { fallback: Texture }): Materials {
  const { walls = [], floors = [], ceilings = [], fallback } = opts;
  const safe = (arr: Texture[]) => (arr.length ? arr : [fallback]);
  return { walls: safe(walls), floors: safe(floors), ceilings: safe(ceilings) };
}

export function texForId(arr: Texture[], id: number, fallback: Texture): Texture {
  if (id <= 0) return fallback;
  const idx = id - 1;
  return arr[idx] ?? fallback;
}
