import { Materials, Palette, Sprites, Textures } from '@osric/renderer-underworld';
import type { Texture } from '@osric/renderer-underworld';
import { BrowserLoaders } from '@osric/renderer-underworld';
import { useEffect, useMemo, useState } from 'react';

// Demo-only actor sprite generator
import * as Actors from '../../../renderer-underworld/world/actors';

export interface AssetsResult {
  lightLUT: ReturnType<typeof Palette.makeLightLUT>;
  mats: Materials.Materials;
  atlas: ReturnType<typeof Sprites.createSpriteProvider>;
}

/**
 * Loads and provides renderer assets for the viewer.
 * - Procedural defaults via @osric/renderer-underworld
 * - Optional browser overrides via BrowserLoaders
 *
 * Inputs: seed (number)
 * Outputs: { lightLUT, mats, atlas }
 * Cleanup: cancels in-flight loads on unmount
 */
export function useAssets(seed: number): AssetsResult {
  // Procedural defaults
  const base = useMemo(() => {
    const lightLUT = Palette.makeLightLUT(16);
    const textures = Textures.generateBaseTextures(seed);
    const find = (p: string) => (textures.find((t) => t.id.includes(p)) ?? textures[0]).texture;
    const fallback = find('wall');
    const mats = Materials.createMaterials({
      walls: [find('wall')],
      floors: [find('floor')],
      ceilings: [find('ceiling')],
      fallback,
    });
    const actorImgs = Actors.generateActorSet();
    const atlas = Sprites.createSpriteProvider(
      Object.fromEntries(actorImgs.map((i) => [`${i.kind}.${i.variant}`, i.texture])),
      Object.fromEntries(actorImgs.map((i) => [i.kind, i.pivotY]))
    );
    return { lightLUT, mats, atlas } as AssetsResult;
  }, [seed]);

  // Browser overrides
  const [overrides, setOverrides] = useState<Partial<AssetsResult>>({});
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [wall, floor, ceiling] = await Promise.all([
          BrowserLoaders.loadTexture('/textures/walls/brick.png'),
          BrowserLoaders.loadTexture('/textures/floors/stone.png'),
          BrowserLoaders.loadTexture('/textures/ceilings/plaster.png'),
        ]);
        if (!cancelled) {
          const mats = Materials.createMaterials({
            walls: [wall],
            floors: [floor],
            ceilings: [ceiling],
            fallback: wall,
          });
          setOverrides((o) => ({ ...o, mats }));
        }
      } catch {
        /* keep procedural materials */
      }
      try {
        const entries: Array<[string, string]> = [
          ['knight.main', '/sprites/knight.main.png'],
          ['skeleton.main', '/sprites/skeleton.main.png'],
        ];
        const loaded = await Promise.all(
          entries.map(async ([key, url]) => [key, await BrowserLoaders.loadTexture(url)] as const)
        );
        if (!cancelled) {
          const images = Object.fromEntries(loaded) as Record<string, Texture>;
          const pivots: Record<string, number> = {};
          if (images['knight.main']) pivots.knight = images['knight.main'].height - 2;
          if (images['skeleton.main']) pivots.skeleton = images['skeleton.main'].height - 2;
          const atlas = Sprites.createSpriteProvider(images, pivots);
          setOverrides((o) => ({ ...o, atlas }));
        }
      } catch {
        /* keep procedural sprites */
      }
    })();
    return () => {
      cancelled = true;
    };
    // Only runs on mount; network requests themselves use current seed indirectly via paths
  }, []);

  return {
    lightLUT: base.lightLUT,
    mats: overrides.mats ?? base.mats,
    atlas: overrides.atlas ?? base.atlas,
  };
}
