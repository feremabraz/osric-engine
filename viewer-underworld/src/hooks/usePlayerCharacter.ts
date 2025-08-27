import type { DomainEngine } from '@osric/osric-engine';
import { useEffect } from 'react';

/** Ensure a player character exists once. Idempotent on mount. */
export function usePlayerCharacter(engineRef: React.RefObject<DomainEngine | null>) {
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.execute('osric:createCharacter', { id: 'player', name: 'Player' });
  }, [engineRef]);
}
