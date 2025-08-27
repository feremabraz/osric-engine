import { CommandRegistry, Engine, MemoryStore, command } from '@osric/engine';
import { beforeEach, describe, expect, it } from 'vitest';

interface Entity {
  id: string;
  value: number;
}

function registerSimCommands() {
  command('sim:create')
    .mutate((_acc, _p, ctx) => {
      const store = (ctx as unknown as { store: MemoryStore }).store;
      (store.getState().entities as Entity[]).push({ id: 'b', value: 2 });
    })
    .emit(() => ({}));
  command('sim:mutate')
    .mutate((_acc, _p, ctx) => {
      const store = (ctx as unknown as { store: MemoryStore }).store;
      const e = (store.getState().entities as Entity[]).find((e: Entity) => e.id === 'a');
      if (e) e.value = 10;
    })
    .emit(() => ({}));
  command('sim:delete')
    .mutate((_acc, _p, ctx) => {
      const store = (ctx as unknown as { store: MemoryStore }).store;
      const arr = store.getState().entities as Entity[];
      const idx = arr.findIndex((e: Entity) => e.id === 'a');
      if (idx >= 0) arr.splice(idx, 1);
    })
    .emit(() => ({}));
}

describe('CE-11 simulate diff', () => {
  beforeEach(() => {
    CommandRegistry.clear();
    registerSimCommands();
  });

  it('classifies created, mutated, deleted', () => {
    const store = new MemoryStore({
      entities: [{ id: 'a', value: 1 }],
    });
    const engine = new Engine({ seed: 5, store });
    const simCreate = engine.simulate('sim:create', {});
    expect(simCreate.diff.created.find((d) => d.id === 'b')).toBeTruthy();
    const simMutate = engine.simulate('sim:mutate', {});
    expect(simMutate.diff.mutated.find((d) => d.id === 'a')).toBeTruthy();
    const simDelete = engine.simulate('sim:delete', {});
    expect(simDelete.diff.deleted.find((d) => d.id === 'a')).toBeTruthy();
  });

  it('does not persist changes or RNG advancement after simulate', () => {
    const store = new MemoryStore({ entities: [] as Entity[] });
    const engine = new Engine({ seed: 7, store });
    const firstState = engine.getRngState().s;
    const sim = engine.simulate('sim:create', {});
    expect(sim.result.ok).toBe(true);
    const afterState = engine.getRngState().s;
    expect(afterState).toBe(firstState);
  });
});
