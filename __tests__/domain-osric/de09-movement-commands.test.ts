import { DomainEngine, DomainMemoryStore } from '@osric/osric-engine';
import { describe, expect, it } from 'vitest';

describe('DE-09 movement commands', () => {
  function mk() {
    const store = new DomainMemoryStore();
    const engine = new DomainEngine({ store, seed: 1 });
    engine.execute('osric:createCharacter', { id: 'player', name: 'Player' });
    return engine;
  }

  it('turn emits Turn effect', () => {
    const e = mk();
    const r = e.execute('osric:turn', { id: 'player', direction: 'left' });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.effects.some((fx) => fx.type === 'Turn')).toBe(true);
  });

  it('move emits Move effect', () => {
    const e = mk();
    const r = e.execute('osric:move', { id: 'player', direction: 'forward' });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.effects.some((fx) => fx.type === 'Move')).toBe(true);
  });

  it('wait emits Wait effect', () => {
    const e = mk();
    const r = e.execute('osric:wait', { id: 'player' });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.effects.some((fx) => fx.type === 'Wait')).toBe(true);
  });

  it('doorToggle emits DoorToggle effect', () => {
    const e = mk();
    const r = e.execute('osric:doorToggle', { id: 'player' });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.effects.some((fx) => fx.type === 'DoorToggle')).toBe(true);
  });
});
