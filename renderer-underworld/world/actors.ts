import type { Texture } from '../types';

export type ActorKind = 'knight' | 'skeleton' | 'caster';
export type ActorVariant = 'main' | 'attack';

/** @internal */
export type ActorImage = {
  kind: ActorKind;
  variant: ActorVariant;
  texture: Texture;
  pivotY: number;
};

/** @internal */
function makeTexture(w: number, h: number): Texture {
  return { width: w, height: h, data: new Uint8ClampedArray(w * h * 4) };
}
/** @internal */
function put(tex: Texture, x: number, y: number, r: number, g: number, b: number, a = 255) {
  if (x < 0 || y < 0 || x >= tex.width || y >= tex.height) return;
  const i = (y * tex.width + x) * 4;
  tex.data[i] = r;
  tex.data[i + 1] = g;
  tex.data[i + 2] = b;
  tex.data[i + 3] = a;
}

/** @internal */
function drawEllipse(
  tex: Texture,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  color: [number, number, number, number]
) {
  for (let y = -ry; y <= ry; y++) {
    for (let x = -rx; x <= rx; x++) {
      const dx = x / rx;
      const dy = y / ry;
      if (dx * dx + dy * dy <= 1) put(tex, cx + x, cy + y, color[0], color[1], color[2], color[3]);
    }
  }
}

/** @internal */
function colorFor(kind: ActorKind): [number, number, number] {
  if (kind === 'knight') return [160, 160, 180];
  if (kind === 'skeleton') return [220, 220, 210];
  return [150, 120, 180];
}

/** @internal */
export function generateActor(kind: ActorKind, variant: ActorVariant, height = 80): ActorImage {
  const w = Math.floor(height * 0.6);
  const h = height;
  const tex = makeTexture(w, h);
  const [r, g, b] = colorFor(kind);
  drawEllipse(
    tex,
    Math.floor(w / 2),
    Math.floor(h * 0.55),
    Math.floor(w * 0.25),
    Math.floor(h * 0.25),
    [r, g, b, 255]
  );
  drawEllipse(
    tex,
    Math.floor(w / 2),
    Math.floor(h * 0.25),
    Math.floor(w * 0.18),
    Math.floor(h * 0.12),
    [r, g, b, 255]
  );
  if (variant === 'attack') {
    drawEllipse(
      tex,
      Math.floor(w * 0.75),
      Math.floor(h * 0.5),
      Math.floor(w * 0.15),
      Math.floor(h * 0.06),
      [r, g, b, 255]
    );
  } else {
    drawEllipse(
      tex,
      Math.floor(w * 0.3),
      Math.floor(h * 0.55),
      Math.floor(w * 0.12),
      Math.floor(h * 0.05),
      [r, g, b, 255]
    );
    drawEllipse(
      tex,
      Math.floor(w * 0.7),
      Math.floor(h * 0.55),
      Math.floor(w * 0.12),
      Math.floor(h * 0.05),
      [r, g, b, 255]
    );
  }
  return { kind, variant, texture: tex, pivotY: h - 1 };
}

/** @internal */
export function generateActorSet(
  kinds: ActorKind[] = ['knight', 'skeleton', 'caster'] as ActorKind[]
) {
  const images: ActorImage[] = [];
  for (const k of kinds) {
    images.push(generateActor(k, 'main'));
    images.push(generateActor(k, 'attack'));
  }
  return images;
}
