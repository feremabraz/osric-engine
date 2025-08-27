/**
 * osric:applyDamage — Apply damage to a target character and emit a Damage effect.
 * If the character has hp, clamps to zero; also returns prev/next hp.
 */
import { command, domainFail } from '@osric/engine';
import { requireCharacter } from '../shared-rules/characterExist';

/** Parameters for osric:applyDamage. */
export interface ApplyDamageParams {
  targetId: string;
  amount: number;
  sourceId?: string;
}

/** Result payload for osric:applyDamage. */
export interface ApplyDamageResult {
  targetId: string;
  amount: number;
  prevHp?: number;
  nextHp?: number;
}

command<ApplyDamageParams>('osric:applyDamage')
  .validate((_acc, p) => {
    if (!p || typeof p.targetId !== 'string' || typeof p.amount !== 'number')
      return domainFail('INVALID_PARAMS');
    return {};
  })
  .load(requireCharacter<ApplyDamageParams, 'targetId'>('targetId'))
  .calc((_acc, p, ctx) => {
    const store = (ctx as unknown as { store: import('../memoryStore').DomainMemoryStore }).store;
    const ch = store.getCharacter(p.targetId) as { hp?: number } | undefined;
    let prevHp: number | undefined = undefined;
    let nextHp: number | undefined = undefined;
    if (typeof ch?.hp === 'number') {
      prevHp = ch.hp as number;
      nextHp = Math.max(0, prevHp - p.amount);
      store.updateCharacter(p.targetId, { hp: nextHp });
    }
    (
      ctx as unknown as { effects: { add: (t: string, target: string, payload?: unknown) => void } }
    ).effects.add('Damage', p.targetId, {
      targetId: p.targetId,
      amount: p.amount,
      prevHp,
      nextHp,
      sourceId: p.sourceId,
    });
    return { targetId: p.targetId, amount: p.amount, prevHp, nextHp } as ApplyDamageResult;
  })
  .emit(() => {});
