import type { CommandOutcome, Effect } from '@osric/engine';
import { DomainEngine } from '../engine';
import { DomainMemoryStore } from '../memoryStore';
import '../commands/createCharacter';
import '../commands/grantXp';
import '../commands/inspireParty';
import '../commands/startBattle';
import '../commands/attack';

export interface ScenarioResult {
  seed: number;
  outcomes: unknown[];
  effects: unknown[];
  finalState: unknown;
}

export function runDeterminismScenario(seed = 1234): ScenarioResult {
  const store = new DomainMemoryStore();
  const engine = new DomainEngine({ seed, store });
  const outcomes: CommandOutcome[] = [];
  const effectsAcc: Effect[] = [];

  outcomes.push(engine.execute('osric:createCharacter', { id: 'c1', name: 'Alice' }));
  outcomes.push(engine.execute('osric:createCharacter', { id: 'c2', name: 'Bob' }));
  outcomes.push(engine.execute('osric:grantXp', { id: 'c1', amount: 50 }));
  outcomes.push(engine.execute('osric:inspireParty', { leaderId: 'c1', bonus: 2 }));
  outcomes.push(engine.execute('osric:startBattle', { id: 'b1', participantIds: ['c1', 'c2'] }));
  outcomes.push(engine.execute('osric:attack', { attackerId: 'c1', targetId: 'c2' }));
  outcomes.push(engine.execute('osric:attack', { attackerId: 'c2', targetId: 'c1' }));

  for (const o of outcomes) {
    if (o.ok) {
      effectsAcc.push(...o.effects);
    }
  }

  const finalState = store.snapshot();
  return { seed, outcomes, effects: effectsAcc, finalState };
}

if (typeof require !== 'undefined' && require.main === module) {
  const seed = Number(process.argv[2]) || 1234;
  const res = runDeterminismScenario(seed);
  process.stdout.write(JSON.stringify(res));
}
