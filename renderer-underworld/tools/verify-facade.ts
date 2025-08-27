import { PNG } from 'pngjs';
import {
  Mapgen,
  Palette,
  Sprites,
  Textures,
  blitNearestUpscaled,
  createFramebuffer,
  createRenderer,
  renderBillboards,
  renderFloorCeiling,
  renderWalls,
} from '..';
import * as Actors from '../world/actors';

function toPNGBuffer(width: number, height: number, data: Uint8ClampedArray): Buffer {
  const png = new PNG({ width, height });
  for (let i = 0; i < data.length; i++) png.data[i] = data[i];
  return PNG.sync.write(png);
}

function equalTextures(
  a: { width: number; height: number; data: Uint8ClampedArray },
  b: {
    width: number;
    height: number;
    data: Uint8ClampedArray;
  }
) {
  if (a.width !== b.width || a.height !== b.height) return false;
  const da = a.data;
  const db = b.data;
  if (da.length !== db.length) return false;
  for (let i = 0; i < da.length; i++) if (da[i] !== db[i]) return false;
  return true;
}

async function main() {
  const seed = Number(process.env.SEED ?? 123);
  const outW = Number(process.env.W ?? 640);
  const outH = Number(process.env.H ?? 400);
  const fbW = 320;
  const fbH = 200;

  const map = Mapgen.generateMap(seed, 24, 24);
  const lightLUT = Palette.makeLightLUT(16);
  const base = Textures.generateBaseTextures(seed);
  const fallbackTex = base.length ? base[0].texture : Textures.generateTexture('wall_brick', seed);
  const wallTex = [base.find((t: { id: string }) => t.id.includes('wall'))?.texture ?? fallbackTex];
  const floorTex = [
    base.find((t: { id: string }) => t.id.includes('floor'))?.texture ?? fallbackTex,
  ];
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

  // Low-level pipeline
  const fb = createFramebuffer(fbW, fbH, [0, 0, 0, 255]);
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
  const outLow = blitNearestUpscaled(fb, outW, outH);

  // Facade pipeline
  const renderer = createRenderer({
    fbWidth: fbW,
    fbHeight: fbH,
    camera: cam,
    grids: { walls: grid, floorCeiling: fcGrid },
    materials: { walls: wallTex, floors: floorTex, ceilings: ceilTex },
    lightLUT,
    fogDensity: 0.15,
    isDoorClosed: (x: number, y: number) => map.cells[y * map.width + x].door,
  });
  if (map.actors.length) {
    const s = map.actors[0];
    renderer.render({
      sprites: [{ x: s.x, y: s.y, kind: s.kind as Actors.ActorKind, variant: 'main' }],
      atlas: provider,
      tick: 0,
    });
  }
  const outFacade = renderer.renderToTexture(outW, outH);

  const equal = equalTextures(outLow, outFacade);
  console.log(`Facade equivalence: ${equal ? 'EQUAL' : 'DIFFERENT'}`);
  if (!equal) {
    // Optionally write both for inspection
    const a = toPNGBuffer(outLow.width, outLow.height, outLow.data);
    const b = toPNGBuffer(outFacade.width, outFacade.height, outFacade.data);
    // eslint-disable-next-line no-console
    console.log('Writing mismatch images to tools/out-low.png and tools/out-facade.png');
    const fs = await import('node:fs');
    const path = await import('node:path');
    const dir = path.resolve(process.cwd(), 'renderer-underworld', 'tools');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'out-low.png'), a);
    fs.writeFileSync(path.join(dir, 'out-facade.png'), b);
    process.exitCode = 1;
  }
}

// eslint-disable-next-line unicorn/prefer-top-level-await
main();
