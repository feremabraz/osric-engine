/**
 * osric:die — Mark a character as dead via a Death effect (no state change here).
 */
import { command, domainFail } from '@osric/engine';
import { requireCharacter } from '../shared-rules/characterExist';

/** Parameters for osric:die. */
export interface DieParams {
  targetId: string;
}

/** Result payload for osric:die. */
export interface DieResult {
  targetId: string;
}

command<DieParams>('osric:die')
  .validate((_acc, p) => {
    if (!p || typeof p.targetId !== 'string') return domainFail('INVALID_PARAMS');
    return {};
  })
  .load(requireCharacter<DieParams, 'targetId'>('targetId'))
  .calc((_acc, p, ctx) => {
    (
      ctx as unknown as { effects: { add: (t: string, target: string, payload?: unknown) => void } }
    ).effects.add('Death', p.targetId, { targetId: p.targetId });
    return { targetId: p.targetId } as DieResult;
  })
  .emit(() => {});
