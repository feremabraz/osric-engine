import fs from 'node:fs';
import path from 'node:path';
import { Actors, Mapgen, Palette, Sprites, Textures } from '@osric/renderer-underworld';
import {
  blitNearestUpscaled,
  createFramebuffer,
  renderBillboards,
  renderFloorCeiling,
  renderWalls,
} from '@osric/renderer-underworld';
import { PNG } from 'pngjs';

function toPng(width: number, height: number, data: Uint8ClampedArray): Buffer {
  const png = new PNG({ width, height });
  for (let i = 0; i < data.length; i++) png.data[i] = data[i];
  return PNG.sync.write(png);
}

const argSeed = process.argv.find((a) => a.startsWith('--seed='));
const seed = argSeed ? Number(argSeed.split('=')[1]) : Number(process.env.SEED ?? 123);
const outW = Number(process.env.W ?? 640);
const outH = Number(process.env.H ?? 400);
const map = Mapgen.generateMap(seed, 24, 24);
const fb = createFramebuffer(320, 200, [0, 0, 0, 255]);
const lightLUT = Palette.makeLightLUT(16);
const base = Textures.generateBaseTextures(seed);
const fallbackTex = base.length ? base[0].texture : Textures.generateTexture('wall_brick', seed);
const wallTex = [base.find((t: { id: string }) => t.id.includes('wall'))?.texture ?? fallbackTex];
const floorTex = [base.find((t: { id: string }) => t.id.includes('floor'))?.texture ?? fallbackTex];
const ceilTex = [
  base.find((t: { id: string }) => t.id.includes('ceiling'))?.texture ?? fallbackTex,
];

const grid = {
  width: map.width,
  height: map.height,
  get(x: number, y: number) {
    return map.cells[y * map.width + x].wall;
  },
};
const fcGrid = {
  width: map.width,
  height: map.height,
  get(x: number, y: number) {
    const c = map.cells[y * map.width + x];
    return { floor: c.floor || 1, ceiling: c.ceiling || 1, light: c.light };
  },
};

const cam = {
  x: map.playerStart.x,
  y: map.playerStart.y,
  angle: map.playerStart.angle,
  fov: Math.PI / 3,
};

renderFloorCeiling(
  fb,
  { grid: fcGrid, floorTextures: floorTex, ceilingTextures: ceilTex, lightLUT, fogDensity: 0.15 },
  cam
);
const { depth } = renderWalls(
  fb,
  {
    grid,
    wallTextures: wallTex,
    getLight: (x: number, y: number) => map.cells[y * map.width + x].light,
    lightLUT,
    fogDensity: 0.15,
    isDoorClosed: (x: number, y: number) => map.cells[y * map.width + x].door,
  },
  cam
);

const images = Actors.generateActorSet();
const provider = Sprites.createSpriteProvider(
  Object.fromEntries(images.map((i: Actors.ActorImage) => [`${i.kind}.${i.variant}`, i.texture])),
  Object.fromEntries(images.map((i: Actors.ActorImage) => [i.kind, i.pivotY]))
);
if (map.actors.length) {
  const s = map.actors[0];
  renderBillboards(
    fb,
    depth,
    cam,
    [{ x: s.x, y: s.y, kind: s.kind as Actors.ActorKind, variant: 'main' }],
    provider,
    0
  );
}

const outTex = blitNearestUpscaled(fb, outW, outH);
const buf = toPng(outTex.width, outTex.height, outTex.data);
const outDir = path.resolve(process.cwd(), 'renderer-underworld');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);
const outPath = path.join(outDir, 'out.png');
fs.writeFileSync(outPath, buf);
console.log(`Wrote ${outPath} (seed=${seed}, size=${outW}x${outH})`);
