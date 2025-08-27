export interface HUDProps {
  seed: number;
  pos: { x: number; y: number; angle: number };
}

export function HUD({ seed, pos }: HUDProps) {
  return (
    <div className="hud">
      Seed: {seed} | Pos: {pos.x.toFixed(2)}, {pos.y.toFixed(2)} | Ang: {pos.angle.toFixed(2)} |
      Controls: ←/→/a/d turn, ↑/w forward, ↓/s back, q/e strafe, Space/Enter door, f interact
    </div>
  );
}
