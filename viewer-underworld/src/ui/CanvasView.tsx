import type { Texture } from '@osric/renderer-underworld';
import { forwardRef, useImperativeHandle, useRef } from 'react';

export interface CanvasViewHandle {
  draw(texture: Texture): void;
}

export interface CanvasViewProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
}

/**
 * CanvasView: presentation-only canvas element with an imperative draw(texture) API.
 * - Caches ImageData/offscreen buffers per size to avoid per-frame allocations.
 */
export const CanvasView = forwardRef<CanvasViewHandle, CanvasViewProps>(function CanvasView(
  { canvasRef }: CanvasViewProps,
  ref
) {
  const offscreenRef = useRef<HTMLCanvasElement | null>(null);
  const imgDataRef = useRef<ImageData | null>(null);
  const lastSizeRef = useRef<{ w: number; h: number } | null>(null);

  useImperativeHandle(ref, () => ({
    draw(texture: Texture) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const w = texture.width;
      const h = texture.height;
      const sizeChanged =
        !lastSizeRef.current || lastSizeRef.current.w !== w || lastSizeRef.current.h !== h;
      if (sizeChanged) {
        lastSizeRef.current = { w, h };
        let off = offscreenRef.current;
        if (!off) {
          off = document.createElement('canvas');
          offscreenRef.current = off;
        }
        off.width = w;
        off.height = h;
        imgDataRef.current = new ImageData(w, h);
      }
      const off = offscreenRef.current;
      if (!off) return;
      const octx = off.getContext('2d');
      if (!octx) return;
      const img = imgDataRef.current;
      if (!img) return;
      img.data.set(texture.data);
      octx.putImageData(img, 0, 0);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(off, 0, 0, canvas.width, canvas.height);
    },
  }));

  return <canvas ref={canvasRef} />;
});
