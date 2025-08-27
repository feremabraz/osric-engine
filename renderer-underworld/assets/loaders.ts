import type { Texture } from '@osric/renderer-underworld';

export async function loadTexture(url: string): Promise<Texture> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load texture: ${url} (${res.status})`);
  const blob = await res.blob();
  const bmp = await createImageBitmap(blob);
  const canvas = document.createElement('canvas');
  canvas.width = bmp.width;
  canvas.height = bmp.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D context not available');
  ctx.drawImage(bmp, 0, 0);
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  return { width: img.width, height: img.height, data: new Uint8ClampedArray(img.data) };
}

export async function loadTextureFromFile(filePath: string): Promise<Texture> {
  const [{ PNG }, fs] = await Promise.all([import('pngjs'), import('node:fs')]);
  const buf: Buffer = fs.readFileSync(filePath);
  const png = PNG.sync.read(buf);
  return {
    width: png.width,
    height: png.height,
    data: new Uint8ClampedArray(png.data),
  };
}
