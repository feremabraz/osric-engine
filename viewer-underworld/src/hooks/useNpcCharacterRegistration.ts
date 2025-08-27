import type { DomainEngine } from '@osric/osric-engine';
import type * as Renderer from '@osric/renderer-underworld';
import { useEffect } from 'react';

/** Register NPC characters for actors present in the world; idempotent updates. */
export function useNpcCharacterRegistration(
  engineRef: React.RefObject<DomainEngine | null>,
  setWorld: (updater: (w: Renderer.Sim.World) => Renderer.Sim.World) => void
) {
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
      return { ...w, characterMap: cmap } as Renderer.Sim.World;
    });
  }, [engineRef, setWorld]);
}
