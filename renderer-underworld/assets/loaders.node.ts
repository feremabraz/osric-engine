import type { Texture } from '../types';

/** Load a PNG file from URL/path into a Texture (Node build). */
export async function loadTexture(url: string): Promise<Texture> {
  const [{ PNG }, fs] = await Promise.all([import('pngjs'), import('node:fs')]);
  const buf: Buffer = fs.readFileSync(url);
  const png = PNG.sync.read(buf);
  return { width: png.width, height: png.height, data: new Uint8ClampedArray(png.data) };
}

/** Load a PNG from a local file path into a Texture (Node only). */
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
