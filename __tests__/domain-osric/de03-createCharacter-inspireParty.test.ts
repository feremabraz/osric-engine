import { DomainEngine, DomainMemoryStore } from '@osric/osric-engine';
import { describe, expect, it } from 'vitest';

describe('DE-03 createCharacter & inspireParty', () => {
  it('creates a character and detects duplicate ids', () => {
    const store = new DomainMemoryStore();
    const engine = new DomainEngine({ store });
    const r1 = engine.execute('osric:createCharacter', { id: 'c1', name: 'Alice' });
    expect(r1.ok).toBe(true);
    const rDup = engine.execute('osric:createCharacter', { id: 'c1', name: 'Dup' });
    expect(rDup.ok).toBe(false);
  });

  it('inspireParty applies morale bonus and simulate does not persist', () => {
    const store = new DomainMemoryStore();
    const engine = new DomainEngine({ store });
    engine.execute('osric:createCharacter', { id: 'leader', name: 'Leader' });
    engine.execute('osric:createCharacter', { id: 'ally', name: 'Ally' });
    const result = engine.execute('osric:inspireParty', {
      leaderId: 'leader',
      bonus: 2,
      message: 'Forward!',
    });
    expect(result.ok).toBe(true);
    const chars1 = store.getState().characters as { id: string; moraleBonus?: number }[];
    expect(chars1.find((c) => c.id === 'leader')?.moraleBonus).toBe(2);
    expect(chars1.find((c) => c.id === 'ally')?.moraleBonus).toBe(2);
    const sim = engine.simulate('osric:inspireParty', { leaderId: 'leader', bonus: 3 });
    const chars2 = store.getState().characters as { id: string; moraleBonus?: number }[];
    expect(chars2.find((c) => c.id === 'leader')?.moraleBonus).toBe(2);
    expect(sim.result.ok).toBe(true);
  });

  it('inspireParty fails with missing leader', () => {
    const store = new DomainMemoryStore();
    const engine = new DomainEngine({ store });
    const r = engine.execute('osric:inspireParty', { leaderId: 'nope', bonus: 1 });
    expect(r.ok).toBe(false);
  });
});
