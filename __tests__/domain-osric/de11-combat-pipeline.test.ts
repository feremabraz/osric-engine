import { DomainEngine, DomainMemoryStore } from '@osric/osric-engine';
import { describe, expect, it } from 'vitest';

describe('DE-11 combat pipeline', () => {
  function setup() {
    const store = new DomainMemoryStore();
    const engine = new DomainEngine({ store, seed: 123 });
    engine.execute('osric:createCharacter', { id: 'att', name: 'Att' });
    engine.execute('osric:createCharacter', { id: 'tar', name: 'Tar' });
    return { store, engine };
  }

  it('attack -> resolveAttack -> applyDamage -> checkDefeat -> die emits effects', () => {
    const { engine } = setup();
    const rAtk = engine.execute('osric:attack', { attackerId: 'att', targetId: 'tar' });
    expect(rAtk.ok).toBe(true);
    const roll = rAtk.ok ? (rAtk.data as { roll: number }).roll : 0;
    if (rAtk.ok) expect(rAtk.effects.some((e) => e.type === 'AttackRoll')).toBe(true);
    const rRes = engine.execute('osric:resolveAttack', {
      attackerId: 'att',
      targetId: 'tar',
      roll,
      modifiers: 2,
    });
    expect(rRes.ok).toBe(true);
    if (rRes.ok) expect(rRes.effects.some((e) => e.type === 'AttackResolved')).toBe(true);
    const rDmg = engine.execute('osric:applyDamage', {
      targetId: 'tar',
      amount: 3,
      sourceId: 'att',
    });
    expect(rDmg.ok).toBe(true);
    if (rDmg.ok) expect(rDmg.effects.some((e) => e.type === 'Damage')).toBe(true);
    const rChk = engine.execute('osric:checkDefeat', { targetId: 'tar' });
    expect(rChk.ok).toBe(true);
    if (rChk.ok) expect(rChk.effects.some((e) => e.type === 'DefeatedChecked')).toBe(true);
    const rDie = engine.execute('osric:die', { targetId: 'tar' });
    expect(rDie.ok).toBe(true);
    if (rDie.ok) expect(rDie.effects.some((e) => e.type === 'Death')).toBe(true);
  });
});
