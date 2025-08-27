# Assets: palette, textures, sprites

## Palette
- `BASE_PALETTE`: 16 base colors
- `makeLightLUT(levels)`: monotonic curve in [0,1]
- `MOOD_LUTS`: simple color tints
- `applyLightAndMood(tex, light, mood?)`: returns a tinted/clamped copy of a texture

## Textures
Procedural generators for common materials.

- `generateTexture(kind, seed, size)`: single texture
- `generateBaseTextures(seed)`: convenience set

## Sprites
Convert a bag of textures into a lookup provider.

```ts
import { Sprites } from '@osric/renderer-underworld';

const images = { 'knight.main': texMain, 'knight.alt': texAlt, slime: texSlime };
const pivots = { knight: 12, 'knight.main': 14 };
const atlas = Sprites.createSpriteProvider(images, pivots);
const img = atlas.get('knight', 'main'); // { texture, pivotY }
```

Keys are mapped as `kind.variant`; missing variant defaults to `main`.
