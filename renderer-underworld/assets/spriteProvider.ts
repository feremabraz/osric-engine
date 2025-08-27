import type { Texture } from '@osric/renderer-underworld';
import type { SpriteImage, SpriteProvider } from '@osric/renderer-underworld';
export type { SpriteImage, SpriteProvider } from '@osric/renderer-underworld';

export function createSpriteProvider(
  images: Record<string, Texture>,
  pivots?: Record<string, number>
): SpriteProvider {
  const table = new Map<string, SpriteImage>();
  for (const [key, tex] of Object.entries(images)) {
    const [kind, variant = 'main'] = key.split('.') as [string, string?];
    const pv = pivots?.[`${kind}.${variant}`] ?? pivots?.[kind] ?? tex.height;
    table.set(`${kind}::${variant}`, { texture: tex, pivotY: pv });
  }
  return {
    get(kind: string, variant: string): SpriteImage | undefined {
      return table.get(`${kind}::${variant}`);
    },
  };
}
