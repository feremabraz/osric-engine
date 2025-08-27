import type { Texture } from '@osric/renderer-underworld';

export type Framebuffer = {
  width: number;
  height: number;
  data: Uint8ClampedArray;
};

export function createFramebuffer(
  width: number,
  height: number,
  fill: [number, number, number, number] = [0, 0, 0, 255]
): Framebuffer {
  const data = new Uint8ClampedArray(width * height * 4);
  const fb: Framebuffer = { width, height, data };
  clear(fb, fill);
  return fb;
}

export function clear(fb: Framebuffer, color: [number, number, number, number]) {
  const [r, g, b, a] = color;
  for (let i = 0; i < fb.data.length; i += 4) {
    fb.data[i] = r;
    fb.data[i + 1] = g;
    fb.data[i + 2] = b;
    fb.data[i + 3] = a;
  }
}

export function blitNearestUpscaled(
  fb: Framebuffer,
  outW: number,
  outH: number,
  bg: [number, number, number, number] = [0, 0, 0, 255]
): Texture {
  const aspect = fb.width / fb.height;
  let drawW = outW;
  let drawH = Math.floor(outW / aspect);
  if (drawH > outH) {
    drawH = outH;
    drawW = Math.floor(outH * aspect);
  }
  const offsetX = Math.floor((outW - drawW) / 2);
  const offsetY = Math.floor((outH - drawH) / 2);
  const out: Texture = { width: outW, height: outH, data: new Uint8ClampedArray(outW * outH * 4) };
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

export type Grid = { width: number; height: number; get(x: number, y: number): number };

export type Camera = { x: number; y: number; angle: number; fov: number };

export type RaycastParams = {
  grid: Grid;
  wallTextures: Texture[];
  getLight?: (x: number, y: number) => number;
  lightLUT?: number[];
  fogDensity?: number;
  isDoorClosed?: (x: number, y: number) => boolean;
  doorTexture?: Texture;
};

export function renderWalls(
  fb: Framebuffer,
  params: RaycastParams,
  cam: Camera
): { depth: Float32Array } {
  const depth = new Float32Array(fb.width);
  const dirX = Math.cos(cam.angle);
  const dirY = Math.sin(cam.angle);
  const planeX = -Math.sin(cam.angle) * Math.tan(cam.fov / 2);
  const planeY = Math.cos(cam.angle) * Math.tan(cam.fov / 2);
  for (let x = 0; x < fb.width; x++) {
    const cameraX = (2 * x) / fb.width - 1;
    const rayDirX = dirX + planeX * cameraX;
    const rayDirY = dirY + planeY * cameraX;
    let mapX = Math.floor(cam.x);
    let mapY = Math.floor(cam.y);
    const deltaDistX = rayDirX === 0 ? 1e30 : Math.abs(1 / rayDirX);
    const deltaDistY = rayDirY === 0 ? 1e30 : Math.abs(1 / rayDirY);
    let stepX: number;
    let stepY: number;
    let sideDistX: number;
    let sideDistY: number;
    if (rayDirX < 0) {
      stepX = -1;
      sideDistX = (cam.x - mapX) * deltaDistX;
    } else {
      stepX = 1;
      sideDistX = (mapX + 1.0 - cam.x) * deltaDistX;
    }
    if (rayDirY < 0) {
      stepY = -1;
      sideDistY = (cam.y - mapY) * deltaDistY;
    } else {
      stepY = 1;
      sideDistY = (mapY + 1.0 - cam.y) * deltaDistY;
    }
    let hit = 0;
    let side = 0;
    let textureIndex = 0;
    let useDoorTexture = false;
    while (hit === 0) {
      if (sideDistX < sideDistY) {
        sideDistX += deltaDistX;
        mapX += stepX;
        side = 0;
      } else {
        sideDistY += deltaDistY;
        mapY += stepY;
        side = 1;
      }
      if (mapX < 0 || mapY < 0 || mapX >= params.grid.width || mapY >= params.grid.height) {
        hit = 1;
        textureIndex = 0;
        break;
      }
      const cell = params.grid.get(mapX, mapY);
      if (cell > 0) {
        hit = 1;
        textureIndex = cell - 1;
        useDoorTexture = false;
      } else if (params.isDoorClosed?.(mapX, mapY) && params.doorTexture) {
        hit = 1;
        useDoorTexture = true;
      }
    }
    const perpWallDist = side === 0 ? sideDistX - deltaDistX : sideDistY - deltaDistY;
    depth[x] = perpWallDist;
    const lineHeight = Math.floor(fb.height / Math.max(1e-6, perpWallDist));
    let drawStart = -lineHeight / 2 + fb.height / 2;
    if (drawStart < 0) drawStart = 0;
    let drawEnd = lineHeight / 2 + fb.height / 2;
    if (drawEnd >= fb.height) drawEnd = fb.height - 1;
    let wallX: number;
    if (side === 0) wallX = cam.y + perpWallDist * rayDirY;
    else wallX = cam.x + perpWallDist * rayDirX;
    wallX -= Math.floor(wallX);
    const tex =
      useDoorTexture && params.doorTexture
        ? params.doorTexture
        : params.wallTextures[Math.max(0, Math.min(params.wallTextures.length - 1, textureIndex))];
    const texX = Math.floor(wallX * tex.width);
    const lightLevel = params.getLight ? params.getLight(mapX, mapY) : undefined;
    const lightMul =
      lightLevel != null && params.lightLUT && params.lightLUT.length >= 16
        ? params.lightLUT[Math.max(0, Math.min(15, lightLevel))]
        : 1;
    const fogMul =
      params.fogDensity && params.fogDensity > 0 ? 1 / (1 + params.fogDensity * perpWallDist) : 1;
    const shade = Math.max(0, Math.min(1, lightMul * fogMul));
    for (let y = drawStart | 0; y <= (drawEnd | 0); y++) {
      const d = y * 256 - fb.height * 128 + lineHeight * 128;
      const texY = Math.floor((d * tex.height) / lineHeight / 256);
      const si = (texY * tex.width + texX) * 4;
      const di = (y * fb.width + x) * 4;
      fb.data[di] = (tex.data[si] * shade) | 0;
      fb.data[di + 1] = (tex.data[si + 1] * shade) | 0;
      fb.data[di + 2] = (tex.data[si + 2] * shade) | 0;
      fb.data[di + 3] = 255;
    }
  }
  return { depth };
}

export type FloorCeilingCell = { floor: number; ceiling: number; light: number };

export type FloorCeilingGrid = {
  width: number;
  height: number;
  get(x: number, y: number): FloorCeilingCell;
};

export type FloorCeilingParams = {
  grid: FloorCeilingGrid;
  floorTextures: Texture[];
  ceilingTextures: Texture[];
  lightLUT?: number[];
  fogDensity?: number;
};

export function renderFloorCeiling(fb: Framebuffer, params: FloorCeilingParams, cam: Camera): void {
  const dirX = Math.cos(cam.angle);
  const dirY = Math.sin(cam.angle);
  const planeX = -Math.sin(cam.angle) * Math.tan(cam.fov / 2);
  const planeY = Math.cos(cam.angle) * Math.tan(cam.fov / 2);
  const rayDir0X = dirX - planeX;
  const rayDir0Y = dirY - planeY;
  const rayDir1X = dirX + planeX;
  const rayDir1Y = dirY + planeY;
  const halfH = fb.height / 2;
  const posZ = halfH;
  for (let y = 0; y < fb.height; y++) {
    const p = y - halfH;
    if (p === 0) continue;
    const rowDist = Math.abs(posZ / p);
    const stepX = (rowDist * (rayDir1X - rayDir0X)) / fb.width;
    const stepY = (rowDist * (rayDir1Y - rayDir0Y)) / fb.width;
    let floorX = cam.x + rowDist * rayDir0X;
    let floorY = cam.y + rowDist * rayDir0Y;
    for (let x = 0; x < fb.width; x++) {
      const cellX = Math.floor(floorX);
      const cellY = Math.floor(floorY);
      if (cellX >= 0 && cellY >= 0 && cellX < params.grid.width && cellY < params.grid.height) {
        const cell = params.grid.get(cellX, cellY);
        const tx = floorX - cellX;
        const ty = floorY - cellY;
        const applyShadedSample = (texArr: Texture[], id: number, di: number) => {
          const tex = texArr[Math.max(0, Math.min(texArr.length - 1, id - 1))];
          const sx = Math.max(0, Math.min(tex.width - 1, (tx * tex.width) | 0));
          const sy = Math.max(0, Math.min(tex.height - 1, (ty * tex.height) | 0));
          const si = (sy * tex.width + sx) * 4;
          const lightMul =
            params.lightLUT && params.lightLUT.length >= 16
              ? params.lightLUT[Math.max(0, Math.min(15, cell.light))]
              : 1;
          const fogMul =
            params.fogDensity && params.fogDensity > 0 ? 1 / (1 + params.fogDensity * rowDist) : 1;
          const shade = Math.max(0, Math.min(1, lightMul * fogMul));
          fb.data[di] = (tex.data[si] * shade) | 0;
          fb.data[di + 1] = (tex.data[si + 1] * shade) | 0;
          fb.data[di + 2] = (tex.data[si + 2] * shade) | 0;
          fb.data[di + 3] = 255;
        };
        if (p > 0) {
          const di = (y * fb.width + x) * 4;
          applyShadedSample(params.floorTextures, cell.floor, di);
        } else {
          const di = (y * fb.width + x) * 4;
          applyShadedSample(params.ceilingTextures, cell.ceiling, di);
        }
      }
      floorX += stepX;
      floorY += stepY;
    }
  }
}

export type SpriteImage = { texture: Texture; pivotY: number };

export type SpriteInstance = {
  x: number;
  y: number;
  variant: string;
  kind: string;
};

export type SpriteProvider = { get(kind: string, variant: string): SpriteImage | undefined };

export function renderBillboards(
  fb: Framebuffer,
  depth: Float32Array,
  cam: Camera,
  sprites: SpriteInstance[],
  atlas: SpriteProvider,
  tick: number
): void {
  const dirX = Math.cos(cam.angle);
  const dirY = Math.sin(cam.angle);
  const planeX = -Math.sin(cam.angle) * Math.tan(cam.fov / 2);
  const planeY = Math.cos(cam.angle) * Math.tan(cam.fov / 2);
  const screenW = fb.width;
  const screenH = fb.height;
  for (const s of sprites) {
    const img = atlas.get(s.kind, s.variant);
    if (!img) continue;
    const seed = Math.abs(Math.floor((s.x * 73856093 + s.y * 19349663) % 1000));
    const bob = Math.sin((tick + seed) * 0.08) * 2;
    const scalePulse = 1 + Math.sin((tick + seed * 2) * 0.05) * 0.02;
    const spriteX = s.x - cam.x;
    const spriteY = s.y - cam.y;
    const invDet = 1.0 / (planeX * dirY - dirX * planeY);
    const transformX = invDet * (dirY * spriteX - dirX * spriteY);
    const transformY = invDet * (-planeY * spriteX + planeX * spriteY);
    if (transformY <= 0.0001) continue;
    const spriteScreenX = Math.floor((screenW / 2) * (1 + transformX / transformY));
    const spriteH = Math.abs(Math.floor((screenH / transformY) * scalePulse));
    const drawStartY = Math.max(
      0,
      Math.floor(-spriteH / 2 + screenH / 2 - bob + (img.pivotY - img.texture.height))
    );
    const drawEndY = Math.min(
      screenH - 1,
      Math.floor(spriteH / 2 + screenH / 2 - bob + (img.pivotY - img.texture.height))
    );
    const spriteW = Math.floor((spriteH * img.texture.width) / (img.texture.height || 1));
    const drawStartX = Math.max(0, Math.floor(-spriteW / 2 + spriteScreenX));
    const drawEndX = Math.min(screenW - 1, Math.floor(spriteW / 2 + spriteScreenX));
    for (let stripe = drawStartX; stripe <= drawEndX; stripe++) {
      const texX = Math.floor(
        ((stripe - (-spriteW / 2 + spriteScreenX)) * img.texture.width) / (spriteW || 1)
      );
      if (transformY >= depth[stripe]) continue;
      for (let y = drawStartY; y <= drawEndY; y++) {
        const d = y - (screenH / 2 - spriteH / 2 - bob + (img.pivotY - img.texture.height));
        const texY = Math.floor((d * img.texture.height) / (spriteH || 1));
        const si = (texY * img.texture.width + texX) * 4;
        const a = img.texture.data[si + 3];
        if (a > 10) {
          const di = (y * screenW + stripe) * 4;
          fb.data[di] = img.texture.data[si];
          fb.data[di + 1] = img.texture.data[si + 1];
          fb.data[di + 2] = img.texture.data[si + 2];
          fb.data[di + 3] = 255;
        }
      }
    }
  }
}
