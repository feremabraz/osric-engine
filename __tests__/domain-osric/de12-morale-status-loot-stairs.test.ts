import { DomainEngine, DomainMemoryStore } from '@osric/osric-engine';
import { describe, expect, it } from 'vitest';

describe('DE-12 morale, status, loot, stairs', () => {
  function setup() {
    const store = new DomainMemoryStore();
    const engine = new DomainEngine({ store, seed: 42 });
    engine.execute('osric:createCharacter', { id: 'c1', name: 'A' });
    return { store, engine };
  }

  it('moraleCheck emits MoraleChecked', () => {
    const { engine } = setup();
    const r = engine.execute('osric:moraleCheck', { id: 'c1', context: 'test' });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.effects.some((e) => e.type === 'MoraleChecked')).toBe(true);
  });

  it('applyStatus/tickStatuses emit effects', () => {
    const { engine } = setup();
    const r1 = engine.execute('osric:applyStatus', { targetId: 'c1', kind: 'Poison', duration: 2 });
    expect(r1.ok).toBe(true);
    if (r1.ok) expect(r1.effects.some((e) => e.type === 'StatusApplied')).toBe(true);
    const r2 = engine.execute('osric:tickStatuses', { actorIds: ['c1'] });
    expect(r2.ok).toBe(true);
    if (r2.ok) expect(r2.effects.some((e) => e.type === 'StatusTicked')).toBe(true);
  });

  it('dropLoot/pickUp/useItem emit effects', () => {
    const { engine } = setup();
    const d = engine.execute('osric:dropLoot', { ownerId: 'c1', items: ['gold', 'sword'] });
    expect(d.ok).toBe(true);
    if (d.ok) expect(d.effects.some((e) => e.type === 'LootDropped')).toBe(true);
    const p = engine.execute('osric:pickUp', { actorId: 'c1', itemId: 'gold' });
    expect(p.ok).toBe(true);
    if (p.ok) expect(p.effects.some((e) => e.type === 'ItemPickedUp')).toBe(true);
    const u = engine.execute('osric:useItem', { actorId: 'c1', itemId: 'potion' });
    expect(u.ok).toBe(true);
    if (u.ok) expect(u.effects.some((e) => e.type === 'ItemUsed')).toBe(true);
  });

  it('ascend/descend stairs emit LevelChange', () => {
    const { engine } = setup();
    const up = engine.execute('osric:ascendStairs', { id: 'c1', toLevelId: 'L2' });
    expect(up.ok).toBe(true);
    if (up.ok) expect(up.effects.some((e) => e.type === 'LevelChange')).toBe(true);
    const down = engine.execute('osric:descendStairs', { id: 'c1', toLevelId: 'L1' });
    expect(down.ok).toBe(true);
    if (down.ok) expect(down.effects.some((e) => e.type === 'LevelChange')).toBe(true);
  });
});
