import { Engine, MemoryStore, command } from '@osric/engine';
import { describe, expect, it } from 'vitest';

command('ce10:add', undefined)
  .calc(() => ({ value: 1 }))
  .emit(() => ({}));

command('ce10:fail', undefined)
  .validate(() => {
    throw new Error('boom');
  })
  .emit(() => ({}));

describe('CE-10 EngineStore snapshot / restore', () => {
  it('restores store state while preserving RNG sequence', () => {
    const store = new MemoryStore({ counter: 0, items: [1, 2, 3] });
    const engine = new Engine({ seed: 123, store });
    const snap = store.snapshot();
    const r1 = engine.execute('ce10:add', {});
    expect(r1.ok).toBe(true);
    store.mutate((s) => {
      s.counter = 42;
      (s.items as number[]).push(4);
    });
    engine.execute('ce10:add', {});
    const postMutationSnap = store.snapshot();
    expect(postMutationSnap).not.toEqual(snap);
    store.restore(snap);
    expect(store.getState()).toEqual({ counter: 0, items: [1, 2, 3] });
    const r2 = engine.execute('ce10:add', {});
    expect(r2.ok).toBe(true);
  });
});
