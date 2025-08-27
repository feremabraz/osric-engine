import { createRng } from '@osric/engine';
import { DomainEngine, DomainMemoryStore } from '@osric/osric-engine';
import {
  Actors,
  Adapter,
  Loaders,
  Mapgen,
  Materials,
  Palette,
  Sim,
  Sprites,
  Textures,
  createFramebuffer,
  renderBillboards,
  renderFloorCeiling,
  renderWalls,
} from '@osric/renderer-underworld';
import { useEffect, useMemo, useRef, useState } from 'react';

const INTERNAL_W = 320;
const INTERNAL_H = 200;

export function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [seed, _setSeed] = useState<number>(123);
  const [world, setWorld] = useState(() => {
    const map = Mapgen.generateMap(seed, 24, 24);
    return Sim.createWorldFromMap(map);
  });

  const [customMats, setCustomMats] = useState<Materials.Materials | null>(null);
  const [customAtlas, setCustomAtlas] = useState<ReturnType<
    typeof Sprites.createSpriteProvider
  > | null>(null);
  const engineRef = useRef<DomainEngine | null>(null);
  if (!engineRef.current) {
    const store = new DomainMemoryStore();
    engineRef.current = new DomainEngine({ store, seed });
  }

  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.execute('osric:createCharacter', { id: 'player', name: 'Player' });
  }, []);

  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;
    setWorld((w) => {
      const cmap = new Map(w.characterMap ?? new Map());
      for (const a of w.actors) {
        const src = w.map.actors.find((m) => m.x === a.x && m.y === a.y && m.kind === a.kind);
        if (src?.role === 'civilian') continue;
        const cid = `npc-${a.id}`;
        if (!cmap.has(cid)) {
          engine.execute('osric:createCharacter', { id: cid, name: a.kind });
          cmap.set(cid, a.id);
        }
      }
      return { ...w, characterMap: cmap };
    });
  }, []);

  const assets = useMemo(() => {
    const lightLUT = Palette.makeLightLUT(16);
    const base = Textures.generateBaseTextures(seed);
    const find = (p: string) =>
      (base.find((t: { id: string }) => t.id.includes(p)) ?? base[0]).texture;
    const fallback = find('wall');
    const mats = Materials.createMaterials({
      walls: [find('wall')],
      floors: [find('floor')],
      ceilings: [find('ceiling')],
      fallback,
    });
    const actorImgs = Actors.generateActorSet();
    const atlas = Sprites.createSpriteProvider(
      Object.fromEntries(
        actorImgs.map((i: Actors.ActorImage) => [`${i.kind}.${i.variant}`, i.texture])
      ),
      Object.fromEntries(actorImgs.map((i: Actors.ActorImage) => [i.kind, i.pivotY]))
    );
    return { lightLUT, mats, atlas };
  }, [seed]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [wall, floor, ceiling] = await Promise.all([
          Loaders.loadTexture('/textures/walls/brick.png'),
          Loaders.loadTexture('/textures/floors/stone.png'),
          Loaders.loadTexture('/textures/ceilings/plaster.png'),
        ]);
        if (!cancelled)
          setCustomMats(
            Materials.createMaterials({
              walls: [wall],
              floors: [floor],
              ceilings: [ceiling],
              fallback: wall,
            })
          );
      } catch (_e) {
        // keep procedural materials
      }
      try {
        const entries: Array<[string, string]> = [
          ['knight.main', '/sprites/knight.main.png'],
          ['skeleton.main', '/sprites/skeleton.main.png'],
        ];
        const loaded = await Promise.all(
          entries.map(async ([key, url]) => {
            const tex = await Loaders.loadTexture(url);
            return [key, tex] as const;
          })
        );
        if (!cancelled) {
          const images = Object.fromEntries(loaded) as Record<
            string,
            { width: number; height: number; data: Uint8ClampedArray }
          >;
          const pivots: Record<string, number> = {};
          if (images['knight.main']) pivots.knight = images['knight.main'].height - 2;
          if (images['skeleton.main']) pivots.skeleton = images['skeleton.main'].height - 2;
          setCustomAtlas(Sprites.createSpriteProvider(images, pivots));
        }
      } catch (_e) {
        // keep procedural sprites
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const fb = createFramebuffer(INTERNAL_W, INTERNAL_H, [0, 0, 0, 255]);
    // rng reserved for future interactions (effects, AI); not needed for pure render
    const onFrame = () => {
      const map = world.map;
      const cam = {
        x: world.player.x,
        y: world.player.y,
        angle: world.player.angle,
        fov: Math.PI / 3,
      };
      const grid = {
        width: map.width,
        height: map.height,
        get(x: number, y: number) {
          return map.cells[y * map.width + x].wall;
        },
      };
      const fcGrid = {
        width: map.width,
        height: map.height,
        get(x: number, y: number) {
          const c = map.cells[y * map.width + x];
          return { floor: c.floor || 1, ceiling: c.ceiling || 1, light: c.light };
        },
      };
      renderFloorCeiling(
        fb,
        {
          grid: fcGrid,
          floorTextures: (customMats ?? assets.mats).floors,
          ceilingTextures: (customMats ?? assets.mats).ceilings,
          lightLUT: assets.lightLUT,
          fogDensity: 0.15,
        },
        cam
      );
      const { depth } = renderWalls(
        fb,
        {
          grid,
          wallTextures: (customMats ?? assets.mats).walls,
          lightLUT: assets.lightLUT,
          fogDensity: 0.15,
          getLight: (x, y) => map.cells[y * map.width + x].light,
          isDoorClosed: (x, y) => Sim.isDoorClosed(world, x, y),
        },
        cam
      );
      const sprites = world.actors.map((a: { x: number; y: number; kind: string }) => ({
        x: a.x,
        y: a.y,
        kind: a.kind as Actors.ActorKind,
        variant: 'main' as const,
      }));
      renderBillboards(
        fb,
        depth,
        cam,
        sprites,
        customAtlas ?? assets.atlas,
        world.tick as unknown as number
      );
      // spread clone ensures DOM types see a regular ArrayBuffer backing store
      const imageData = new ImageData(new Uint8ClampedArray(fb.data), fb.width, fb.height);
      // nearest neighbor upscale via an in-memory canvas for broad browser support
      const off = document.createElement('canvas');
      off.width = INTERNAL_W;
      off.height = INTERNAL_H;
      const octx = off.getContext('2d');
      if (!octx) return;
      octx.putImageData(imageData, 0, 0);
      // scale to fit (2x for now)
      canvas.width = INTERNAL_W * 2;
      canvas.height = INTERNAL_H * 2;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(off, 0, 0, canvas.width, canvas.height);
    };
    onFrame();
  }, [world, assets, customMats, customAtlas]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const k = e.key;
      if (
        k === 'ArrowLeft' ||
        k === 'ArrowRight' ||
        k === 'ArrowUp' ||
        k === 'ArrowDown' ||
        k === ' ' ||
        k === 'q' ||
        k === 'e' ||
        k === 'a' ||
        k === 'd' ||
        k === 'f'
      )
        e.preventDefault();
      const local: Adapter.LocalCommand[] = [];
      if (k === 'ArrowLeft' || k === 'a') local.push({ type: 'TurnLeft' });
      if (k === 'ArrowRight' || k === 'd') local.push({ type: 'TurnRight' });
      if (k === 'ArrowUp' || k === 'w') local.push({ type: 'MoveForward' });
      if (k === 'ArrowDown' || k === 's') local.push({ type: 'MoveBackward' });
      if (k === 'q') local.push({ type: 'StrafeLeft' });
      if (k === 'e') local.push({ type: 'StrafeRight' });
      if (k === ' ' || k === 'Enter') local.push({ type: 'OpenDoor' });
      if (k === 'f') local.push({ type: 'Interact' });
      if (!local.length) return;
      const engine = engineRef.current;
      if (!engine) return;
      const cmds = Adapter.toEngineCommands(local, 'player', world);
      // Execute commands and apply their effects back into local world
      for (const c of cmds) {
        const res = engine.execute(c.key, c.params);
        if (res.effects.length) {
          setWorld((w) => Adapter.applyEngineEffects(w, res.effects));
        }
      }
      // Trigger engagement + simple AI when input occurs
      tryEngageAndAi();
      // Advance local sim with a no-op that lets AI step and effects decay
      setWorld((w) => Sim.advanceTurn(w, [{ type: 'Wait' }], createRng(seed)));
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [seed, world]);

  // Simple battle engagement + hostile AI turn
  const battleRef = useRef<{ started: boolean; id: string } | null>(null);
  const tryEngageAndAi = () => {
    const engine = engineRef.current;
    if (!engine) return;
    const w = world;
    // find a hostile with simple LOS/range
    const px = w.player.x;
    const py = w.player.y;
    const facing = w.player.angle;
    const maxDist = 5.0;
    const fov = Math.PI / 2; // generous
    const hasLOS = (ax: number, ay: number) => {
      const steps = 20;
      const dx = (ax - px) / steps;
      const dy = (ay - py) / steps;
      for (let i = 1; i <= steps; i++) {
        const x = px + dx * i;
        const y = py + dy * i;
        // local check: blocked if wall/door
        const xi = Math.floor(x);
        const yi = Math.floor(y);
        if (
          xi < 0 ||
          yi < 0 ||
          xi >= w.map.width ||
          yi >= w.map.height ||
          w.map.cells[yi * w.map.width + xi].wall > 0 ||
          Sim.isDoorClosed(w, xi, yi)
        )
          return false;
      }
      return true;
    };
    const angleTo = (ax: number, ay: number) => Math.atan2(ay - py, ax - px);
    const norm = (a: number) => {
      let v = a;
      while (v <= -Math.PI) v += Math.PI * 2;
      while (v > Math.PI) v -= Math.PI * 2;
      return v;
    };
    let target: { actorId: number; charId: string } | null = null;
    for (const a of w.actors) {
      const src = w.map.actors.find((m) => m.x === a.x && m.y === a.y && m.kind === a.kind);
      if (src?.role === 'civilian') continue;
      const dx = a.x - px;
      const dy = a.y - py;
      const d2 = dx * dx + dy * dy;
      if (d2 > maxDist * maxDist) continue;
      const delta = Math.abs(norm(angleTo(a.x, a.y) - facing));
      if (delta > fov) continue;
      if (!hasLOS(a.x, a.y)) continue;
      const cid = Sim.getCharacterIdForActor(w, a.id);
      if (!cid) continue;
      target = { actorId: a.id, charId: cid };
      break;
    }
    if (!target) return;
    // Start battle once
    if (!battleRef.current || !battleRef.current.started) {
      battleRef.current = { started: true, id: 'battle-1' };
      engine.execute('osric:startBattle', {
        id: battleRef.current.id,
        participantIds: ['player', target.charId],
      });
      engine.execute('osric:rollInitiative', { battleId: battleRef.current.id });
    }
    // Hostile AI: if adjacent, attack; else do a placeholder move. After attack, morale and possibly end battle.
    const ax = w.actors.find((x) => x.id === target.actorId);
    if (!ax) return;
    const dist2 = (ax.x - px) * (ax.x - px) + (ax.y - py) * (ax.y - py);
    if (dist2 < 1.2 * 1.2 && hasLOS(ax.x, ax.y)) {
      const seq = [
        engine.execute('osric:attack', { attackerId: target.charId, targetId: 'player' }),
        engine.execute('osric:resolveAttack', {
          attackerId: target.charId,
          targetId: 'player',
          roll: 11,
          modifiers: 0,
        }),
        engine.execute('osric:applyDamage', {
          targetId: 'player',
          amount: 1,
          sourceId: target.charId,
        }),
        engine.execute('osric:moraleCheck', { id: target.charId }),
        engine.execute('osric:endBattle', { id: battleRef.current.id }),
      ];
      for (const res of seq) {
        if (res?.effects?.length) setWorld((ww) => Adapter.applyEngineEffects(ww, res.effects));
      }
    } else {
      const move = engine.execute('osric:battleMove', {
        id: target.charId,
        dx: Math.sign(px - ax.x) * 1,
        dy: Math.sign(py - ax.y) * 1,
      });
      if (move?.effects?.length) setWorld((ww) => Adapter.applyEngineEffects(ww, move.effects));
    }
  };

  return (
    <div>
      <div className="hud">
        Seed: {seed} | Pos: {world.player.x.toFixed(2)}, {world.player.y.toFixed(2)} | Ang:{' '}
        {world.player.angle.toFixed(2)} | Controls: ←/→/a/d turn, ↑/w forward, ↓/s back, q/e strafe,
        Space/Enter door, f interact
      </div>
      <canvas ref={canvasRef} />
    </div>
  );
}
