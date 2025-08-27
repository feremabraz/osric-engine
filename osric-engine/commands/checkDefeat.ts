/**
 * osric:checkDefeat — Check if a character is defeated (hp <= 0) and emit effects.
 */
import { command, domainFail } from '@osric/engine';
import { requireCharacter } from '../shared-rules/characterExist';

/** Parameters for osric:checkDefeat. */
export interface CheckDefeatParams {
  targetId: string;
}

/** Result payload for osric:checkDefeat. */
export interface CheckDefeatResult {
  targetId: string;
  defeated?: boolean;
}

command<CheckDefeatParams>('osric:checkDefeat')
  .validate((_acc, p) => {
    if (!p || typeof p.targetId !== 'string') return domainFail('INVALID_PARAMS');
    return {};
  })
  .load(requireCharacter<CheckDefeatParams, 'targetId'>('targetId'))
  .calc((_acc, p, ctx) => {
    const store = (ctx as unknown as { store: import('../memoryStore').DomainMemoryStore }).store;
    const ch = store.getCharacter(p.targetId) as { hp?: number } | undefined;
    const defeated = typeof ch?.hp === 'number' ? (ch.hp as number) <= 0 : undefined;
    (
      ctx as unknown as { effects: { add: (t: string, target: string, payload?: unknown) => void } }
    ).effects.add('DefeatedChecked', p.targetId, { targetId: p.targetId, defeated });
    if (defeated === true) {
      (
        ctx as unknown as {
          effects: { add: (t: string, target: string, payload?: unknown) => void };
        }
      ).effects.add('Defeated', p.targetId, { targetId: p.targetId });
    }
    return { targetId: p.targetId, defeated } as CheckDefeatResult;
  })
  .emit(() => {});
