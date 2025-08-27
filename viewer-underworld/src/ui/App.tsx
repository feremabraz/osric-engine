/**
 * Frame algorithm (conceptual):
 * 1) Read input → build local Adapter.LocalCommand[]
 * 2) Map to engine commands via Adapter.toEngineCommands and execute in DomainEngine
 * 3) Apply engine effects back to local world via Adapter.applyEngineEffects
 * 4) Advance local sim tick (AI/effects decay) with Sim.advanceTurn
 * 5) Render: floor/ceiling → walls (get depth) → billboards using current camera
 * 6) Blit: upload framebuffer to canvas with nearest-neighbor upscale and letterboxing
 * Notes:
 * - Side effects (assets fetch, character registration, engagement/AI) are isolated in effects
 * - Rendering is deterministic given seed/world
 */

import { createRng } from '@osric/engine';
import { DomainEngine, DomainMemoryStore } from '@osric/osric-engine';
import { Adapter, Mapgen, Sim } from '@osric/renderer-underworld';
import { useEffect, useRef, useState } from 'react';
import { useAssets } from '../hooks/useAssets';
import { useInput } from '../hooks/useInput';
import { useNpcCharacterRegistration } from '../hooks/useNpcCharacterRegistration';
import { useOverlayToggleKey } from '../hooks/useOverlayToggleKey';
import { usePlayerCharacter } from '../hooks/usePlayerCharacter';
import { useRenderLoop } from '../hooks/useRenderLoop';
import { useRendererSystem } from '../hooks/useRendererSystem';
import { useResizeCanvas } from '../hooks/useResizeCanvas';
import { mapControlsToLocalCommands } from '../presenters/controls';
import { renderFrame } from '../presenters/frame';
import { maybeEngageAndStep } from '../systems/aiSystem';
import { CanvasView, type CanvasViewHandle } from './CanvasView';
import { DebugOverlay } from './DebugOverlay';
import { HUD } from './HUD';

const INTERNAL_W = 320;
const INTERNAL_H = 200;

export function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasViewRef = useRef<CanvasViewHandle>(null);
  const [showOverlay] = useOverlayToggleKey(false, 'o');
  useResizeCanvas(canvasRef, { width: INTERNAL_W, height: INTERNAL_H }, { minScale: 2 });
  const [seed, _setSeed] = useState<number>(123);
  const [world, setWorld] = useState(() => {
    const map = Mapgen.generateMap(seed, 24, 24);
    return Sim.createWorldFromMap(map);
  });
  const worldRef = useRef(world);
  worldRef.current = world;
  const assets = useAssets(seed);
  const controls = useInput();
  const rendererRef = useRendererSystem(
    assets ? { mats: assets.mats, atlas: assets.atlas, lightLUT: assets.lightLUT } : null,
    worldRef,
    { width: INTERNAL_W, height: INTERNAL_H }
  );
  const engineRef = useRef<DomainEngine | null>(null);
  if (!engineRef.current) {
    const store = new DomainMemoryStore();
    engineRef.current = new DomainEngine({ store, seed });
  }
  usePlayerCharacter(engineRef);
  useNpcCharacterRegistration(engineRef, setWorld);

  // Per-frame loop: only redraw. No continuous movement.
  const loopMetrics = useRenderLoop(() => {
    const canvas = canvasRef.current;
    const renderer = rendererRef.current;
    if (!canvas || !renderer) return;
    renderFrame(renderer.facade, worldRef.current, (tex) => canvasViewRef.current?.draw(tex));
  }, true);

  // One-step-per-keypress: trigger commands on keydown transitions
  const prevControlsRef = useRef(controls);
  useEffect(() => {
    const prev = prevControlsRef.current;
    const curr = controls;
    const localCommands = mapControlsToLocalCommands(prev, curr);
    prevControlsRef.current = curr;
    if (!localCommands.length) return;
    const engine = engineRef.current;
    if (!engine) return;
    const cmds = Adapter.toEngineCommands(localCommands, 'player', worldRef.current);
    for (const c of cmds) {
      const res = engine.execute(c.key, c.params);
      if (res.effects.length) {
        setWorld((w) => Adapter.applyEngineEffects(w, res.effects));
      }
    }
    const ai = maybeEngageAndStep(worldRef.current, engine);
    if (ai.effects.length) setWorld((w) => Adapter.applyEngineEffects(w, ai.effects));
    setWorld((w) => Sim.advanceTurn(w, [{ type: 'Wait' }], createRng(seed)));
  }, [controls, seed]);

  return (
    <div>
      <HUD seed={seed} pos={{ x: world.player.x, y: world.player.y, angle: world.player.angle }} />
      <CanvasView canvasRef={canvasRef} ref={canvasViewRef} />
      {showOverlay && <DebugOverlay frame={loopMetrics.frame} dt={loopMetrics.dt} />}
    </div>
  );
}
