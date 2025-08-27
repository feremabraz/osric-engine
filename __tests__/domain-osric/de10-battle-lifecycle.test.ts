import { DomainEngine, DomainMemoryStore } from '@osric/osric-engine';
import { describe, expect, it } from 'vitest';

describe('DE-10 battle lifecycle', () => {
  function setup() {
    const store = new DomainMemoryStore();
    const engine = new DomainEngine({ store });
    engine.execute('osric:createCharacter', { id: 'c1', name: 'A' });
    engine.execute('osric:createCharacter', { id: 'c2', name: 'B' });
    engine.execute('osric:startBattle', { id: 'b1', participantIds: ['c1', 'c2'] });
    return { store, engine };
  }

  it('rolls initiative, starts/ends turn, moves in battle, and ends battle', () => {
    const { engine } = setup();
    const rInit = engine.execute('osric:rollInitiative', { battleId: 'b1' });
    expect(rInit.ok).toBe(true);
    if (rInit.ok) expect(rInit.effects.some((e) => e.type === 'InitiativeRolled')).toBe(true);
    const rStart = engine.execute('osric:startTurn', { id: 'c1' });
    expect(rStart.ok).toBe(true);
    if (rStart.ok) expect(rStart.effects.some((e) => e.type === 'TurnStarted')).toBe(true);
    const rMove = engine.execute('osric:battleMove', { id: 'c1', dx: 1, dy: 0 });
    expect(rMove.ok).toBe(true);
    if (rMove.ok) expect(rMove.effects.some((e) => e.type === 'BattleMove')).toBe(true);
    const rEnd = engine.execute('osric:endTurn', { id: 'c1' });
    expect(rEnd.ok).toBe(true);
    if (rEnd.ok) expect(rEnd.effects.some((e) => e.type === 'TurnEnded')).toBe(true);
    const rEndBattle = engine.execute('osric:endBattle', { id: 'b1' });
    expect(rEndBattle.ok).toBe(true);
    if (rEndBattle.ok) expect(rEndBattle.effects.some((e) => e.type === 'BattleEnded')).toBe(true);
  });
});
