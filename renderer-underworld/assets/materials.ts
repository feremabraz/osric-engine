import type { Texture } from '../types';

/** Collection of textures used in rendering. */
export type Materials = {
  walls: Texture[];
  floors: Texture[];
  ceilings: Texture[];
};

/** Ensure each material array has at least one texture by falling back to a default. */
export function createMaterials(opts: Partial<Materials> & { fallback: Texture }): Materials {
  const { walls = [], floors = [], ceilings = [], fallback } = opts;
  const safe = (arr: Texture[]) => (arr.length ? arr : [fallback]);
  return { walls: safe(walls), floors: safe(floors), ceilings: safe(ceilings) };
}

/** Map a 1-based texture id to an entry in an array with a fallback texture. */
export function texForId(arr: Texture[], id: number, fallback: Texture): Texture {
  if (id <= 0) return fallback;
  const idx = id - 1;
  return arr[idx] ?? fallback;
}
