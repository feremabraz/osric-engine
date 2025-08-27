import { DomainEngine, DomainMemoryStore } from '@osric/osric-engine';
import { describe, expect, it } from 'vitest';

describe('DE-13 hp/ac dual-mode', () => {
  it('mutates hp when present and computes hit when ac exists', () => {
    const store = new DomainMemoryStore();
    const engine = new DomainEngine({ store, seed: 7 });
    engine.execute('osric:createCharacter', { id: 'a', name: 'Att' });
    engine.execute('osric:createCharacter', { id: 't', name: 'Tar' });
    store.updateCharacter('t', { hpMax: 8, hp: 8, ac: 10 });
    const rRes = engine.execute('osric:resolveAttack', {
      attackerId: 'a',
      targetId: 't',
      roll: 9,
      modifiers: 2,
    });
    expect(rRes.ok).toBe(true);
    if (rRes.ok) {
      const eff = rRes.effects.find((e) => e.type === 'AttackResolved');
      const pl = eff?.payload as { hit?: boolean } | undefined;
      expect(pl?.hit).toBe(true);
    }
    const rDmg = engine.execute('osric:applyDamage', { targetId: 't', amount: 3 });
    expect(rDmg.ok).toBe(true);
    expect(store.getCharacter('t')?.hp).toBe(5);
    const rChk = engine.execute('osric:checkDefeat', { targetId: 't' });
    expect(rChk.ok).toBe(true);
    if (rChk.ok) {
      const eff = rChk.effects.find((e) => e.type === 'DefeatedChecked');
      const pl = eff?.payload as { defeated?: boolean } | undefined;
      expect(pl?.defeated).toBe(false);
    }
  });
});
