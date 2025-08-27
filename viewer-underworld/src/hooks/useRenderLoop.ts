import { useEffect, useRef, useState } from 'react';
import { cancelRaf, startRaf } from '../lib/raf';

export interface LoopMetrics {
  frame: number;
  dt: number;
}

/**
 * useRenderLoop
 * Runs a RAF-driven loop and reports simple metrics.
 * - Inputs: tick(dt), running
 * - Outputs: { frame, dt }
 * - Cleanup: cancels RAF and resets refs
 */
export function useRenderLoop(tick: (dt: number) => void, running = true) {
  const [metrics, setMetrics] = useState<LoopMetrics>({ frame: 0, dt: 0 });
  const lastRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!running) return;
    const loop = (t: number) => {
      const last = lastRef.current ?? t;
      const dt = Math.max(0, t - last);
      lastRef.current = t;
      try {
        tick(dt);
      } finally {
        setMetrics((m) => ({ frame: m.frame + 1, dt }));
        rafRef.current = startRaf(loop);
      }
    };
    rafRef.current = startRaf(loop);
    return () => {
      if (rafRef.current != null) cancelRaf(rafRef.current);
      rafRef.current = null;
      lastRef.current = null;
    };
  }, [running, tick]);

  return metrics;
}
