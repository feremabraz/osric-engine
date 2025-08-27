import { performance } from 'node:perf_hooks';
import {
  Mapgen,
  Materials,
  Palette,
  Sprites,
  Textures,
  blitNearestUpscaled,
  createFramebuffer,
  renderBillboards,
  renderFloorCeiling,
  renderWalls,
} from '..';
import * as Actors from '../world/actors';

function oldBlitNearestUpscaled(
  fb: { width: number; height: number; data: Uint8ClampedArray },
  outW: number,
  outH: number,
  bg: [number, number, number, number] = [0, 0, 0, 255]
) {
  const aspect = fb.width / fb.height;
  let drawW = outW;
  let drawH = Math.floor(outW / aspect);
  if (drawH > outH) {
    drawH = outH;
    drawW = Math.floor(outH * aspect);
  }
  const offsetX = Math.floor((outW - drawW) / 2);
  const offsetY = Math.floor((outH - drawH) / 2);
  const out = { width: outW, height: outH, data: new Uint8ClampedArray(outW * outH * 4) };
  for (let i = 0; i < out.data.length; i += 4) {
    out.data[i] = bg[0];
    out.data[i + 1] = bg[1];
    out.data[i + 2] = bg[2];
    out.data[i + 3] = bg[3];
  }
  for (let y = 0; y < drawH; y++) {
    const srcY = Math.floor((y / drawH) * fb.height);
    for (let x = 0; x < drawW; x++) {
      const srcX = Math.floor((x / drawW) * fb.width);
      const si = (srcY * fb.width + srcX) * 4;
      const di = ((y + offsetY) * outW + (x + offsetX)) * 4;
      out.data[di] = fb.data[si];
      out.data[di + 1] = fb.data[si + 1];
      out.data[di + 2] = fb.data[si + 2];
      out.data[di + 3] = fb.data[si + 3];
    }
  }
  return out;
}

function nowMs() {
  return performance.now();
}

async function main() {
  const seed = Number(process.env.SEED ?? 123);
  const map = Mapgen.generateMap(seed, 24, 24);
  const lightLUT = Palette.makeLightLUT(16);
  const base = Textures.generateBaseTextures(seed);
  const find = (p: string) =>
    (base.find((t: { id: string }) => t.id.includes(p)) ?? base[0]).texture;
  const mats = Materials.createMaterials({
    walls: [find('wall')],
    floors: [find('floor')],
    ceilings: [find('ceiling')],
    fallback: find('wall'),
  });
  const fb = createFramebuffer(320, 200, [0, 0, 0, 255]);
  const cam = {
    x: map.playerStart.x,
    y: map.playerStart.y,
    angle: map.playerStart.angle,
    fov: Math.PI / 3,
  };
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
  const images = Actors.generateActorSet();
  const atlas = Sprites.createSpriteProvider(
    Object.fromEntries(images.map((i: Actors.ActorImage) => [`${i.kind}.${i.variant}`, i.texture])),
    Object.fromEntries(images.map((i: Actors.ActorImage) => [i.kind, i.pivotY]))
  );

  // Warm-up
  for (let i = 0; i < 5; i++) {
    renderFloorCeiling(
      fb,
      {
        grid: fcGrid,
        floorTextures: mats.floors,
        ceilingTextures: mats.ceilings,
        lightLUT,
        fogDensity: 0.15,
      },
      cam
    );
    const { depth } = renderWalls(
      fb,
      {
        grid,
        wallTextures: mats.walls,
        getLight: (x, y) => map.cells[y * map.width + x].light,
        lightLUT,
        fogDensity: 0.15,
      },
      cam
    );
    renderBillboards(
      fb,
      depth,
      cam,
      map.actors.map((a) => ({ x: a.x, y: a.y, kind: a.kind, variant: 'main' })),
      atlas,
      i
    );
    blitNearestUpscaled(fb, 640, 400);
  }

  // Measure frame time
  const frames = Number(process.env.FRAMES ?? 100);
  const t0 = nowMs();
  for (let i = 0; i < frames; i++) {
    renderFloorCeiling(
      fb,
      {
        grid: fcGrid,
        floorTextures: mats.floors,
        ceilingTextures: mats.ceilings,
        lightLUT,
        fogDensity: 0.15,
      },
      cam
    );
    const { depth } = renderWalls(
      fb,
      {
        grid,
        wallTextures: mats.walls,
        getLight: (x, y) => map.cells[y * map.width + x].light,
        lightLUT,
        fogDensity: 0.15,
      },
      cam
    );
    renderBillboards(
      fb,
      depth,
      cam,
      map.actors.map((a) => ({ x: a.x, y: a.y, kind: a.kind, variant: 'main' })),
      atlas,
      i
    );
    blitNearestUpscaled(fb, 640, 400);
  }
  const t1 = nowMs();
  const msPerFrame = (t1 - t0) / frames;

  // Compare old vs new blit only
  const reps = 300;
  const t2 = nowMs();
  for (let i = 0; i < reps; i++) oldBlitNearestUpscaled(fb, 640, 400);
  const t3 = nowMs();
  for (let i = 0; i < reps; i++) blitNearestUpscaled(fb, 640, 400);
  const t4 = nowMs();

  const oldMs = (t3 - t2) / reps;
  const newMs = (t4 - t3) / reps;
  const blitGain = oldMs > 0 ? ((oldMs - newMs) / oldMs) * 100 : 0;

  console.log(
    JSON.stringify({
      frames,
      msPerFrame: Number(msPerFrame.toFixed(3)),
      blitOldMs: Number(oldMs.toFixed(4)),
      blitNewMs: Number(newMs.toFixed(4)),
      blitGainPct: Number(blitGain.toFixed(2)),
    })
  );
}

// eslint-disable-next-line unicorn/prefer-top-level-await
main();
