import * as Underworld from '@osric/renderer-underworld';
import { describe, expect, it } from 'vitest';

describe('Phase 1: placeholder actors', () => {
  it('generates main/attack variants with consistent dimensions and pivot', () => {
    const imgs = Underworld.Actors.generateActorSet(['knight', 'skeleton', 'caster']);
    expect(imgs.length).toBe(6);
    for (const img of imgs) {
      expect(img.texture.width).toBeGreaterThan(0);
      expect(img.texture.height).toBeGreaterThan(0);
      expect(img.pivotY).toBe(img.texture.height - 1);
      expect(img.texture.data.length).toBe(img.texture.width * img.texture.height * 4);
    }

    const kMain = imgs.find((i) => i.kind === 'knight' && i.variant === 'main');
    const kAtk = imgs.find((i) => i.kind === 'knight' && i.variant === 'attack');
    expect(kMain && kAtk).toBeTruthy();
    if (kMain && kAtk) expect(kMain.texture.height).toBe(kAtk.texture.height);
  });
});
