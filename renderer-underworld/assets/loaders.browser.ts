import type { Texture } from '../types';

/** Fetch a PNG and convert to a Texture using canvas (browser build). */
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

/** Not supported in the browser; use `loadTexture(url)` instead. */
export async function loadTextureFromFile(_filePath: string): Promise<Texture> {
  throw new Error('loadTextureFromFile is not available in the browser build');
}
