import { useEffect, useState } from 'react';

export interface ResizeOpts {
  minScale?: number; // e.g., 1, 2, ...
}

/**
 * useResizeCanvas
 * Manages canvas element logical→physical sizing with DPR and integer scaling.
 * - Inputs: canvasRef, logical size, { minScale }
 * - Outputs: { physicalW, physicalH }
 * - Cleanup: removes window resize listener
 */
export function useResizeCanvas(
  canvasRef: React.RefObject<HTMLCanvasElement>,
  logical: { width: number; height: number },
  opts: ResizeOpts = {}
) {
  const [size, setSize] = useState({ physicalW: logical.width, physicalH: logical.height });
  useEffect(() => {
    // Fixed integer scale, no CSS sizing. Defaults to 2x logical resolution.
    const scale = Math.max(1, opts.minScale ?? 2);
    const cw = logical.width * scale;
    const ch = logical.height * scale;
    const canvas = canvasRef.current;
    if (canvas) {
      // Only set canvas intrinsic dimensions; do not touch CSS.
      canvas.width = cw;
      canvas.height = ch;
    }
    setSize({ physicalW: canvas?.width ?? cw, physicalH: canvas?.height ?? ch });
    // No listeners: sizing is fixed by opts
    return () => {};
  }, [canvasRef, logical.width, logical.height, opts.minScale]);
  return size;
}
