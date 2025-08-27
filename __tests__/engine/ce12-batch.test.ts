import { CommandRegistry, Engine, MemoryStore, command } from '@osric/engine';
import { beforeEach, describe, expect, it } from 'vitest';

interface Item {
  id: string;
  value: number;
}

function registerCommands() {
  command('ok1')
    .mutate((_a, _p, ctx) => {
      const store = (ctx as unknown as { store: MemoryStore }).store;
      (store.getState().items as Item[]).push({ id: 'a', value: 1 });
    })
    .emit(() => ({}));
  command('failMid')
    .calc(() => {
      throw new Error('boom');
    })
    .emit(() => ({}));
  command('ok2')
    .mutate((_a, _p, ctx) => {
      const store = (ctx as unknown as { store: MemoryStore }).store;
      (store.getState().items as Item[]).push({ id: 'b', value: 2 });
    })
    .emit(() => ({}));
}

describe('CE-12 batch', () => {
  beforeEach(() => {
    CommandRegistry.clear();
    registerCommands();
  });

  it('atomic batch rolls back store & RNG on failure', () => {
    const store = new MemoryStore({ items: [] as Item[] });
    const engine = new Engine({ seed: 10, store });
    const preStoreSnap = store.snapshot();
    const preRng = engine.getRngState().s;
    const res = engine.batch(
      [
        { key: 'ok1', params: {} },
        { key: 'failMid', params: {} },
        { key: 'ok2', params: {} },
      ],
      { atomic: true }
    );
    expect(res.ok).toBe(false);
    expect(res.effects.length).toBe(0);
    expect((store.getState().items as Item[]).length).toBe(0);
    const postRng = engine.getRngState().s;
    expect(postRng).toBe(preRng);
    expect(store.snapshot()).toEqual(preStoreSnap);
  });

  it('non-atomic batch keeps earlier successes and aggregates effects', () => {
    const store = new MemoryStore({ items: [] as Item[] });
    const engine = new Engine({ seed: 20, store });
    const res = engine.batch(
      [
        { key: 'ok1', params: {} },
        { key: 'failMid', params: {} },
        { key: 'ok2', params: {} },
      ],
      { atomic: false }
    );
    expect(res.ok).toBe(true);
    const failed = res.failed || [];
    expect(failed.length).toBe(1);
    expect((store.getState().items as Item[]).length).toBe(2);
  });
});
