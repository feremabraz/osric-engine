export interface DebugOverlayProps {
  frame: number;
  dt: number;
}

export function DebugOverlay({ frame, dt }: DebugOverlayProps) {
  return (
    <div style={{ position: 'fixed', bottom: 8, left: 8, fontSize: 12, opacity: 0.8 }}>
      frame: {frame} | dt: {dt.toFixed(2)}ms
    </div>
  );
}
