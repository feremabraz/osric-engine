/**
 * osric:wait — Make an actor wait; emits a Wait effect.
 */
import { command, domainFail } from '@osric/engine';
import { requireCharacter } from '../shared-rules/characterExist';

/** Parameters for osric:wait. */
export interface WaitParams {
  id: string;
}

command<WaitParams>('osric:wait')
  .validate((_acc, p) => {
    if (!p || typeof p.id !== 'string') return domainFail('INVALID_PARAMS');
    return {};
  })
  .load(requireCharacter<WaitParams, 'id'>('id'))
  .calc((_acc, p, ctx) => {
    (
      ctx as unknown as { effects: { add: (t: string, target: string, payload?: unknown) => void } }
    ).effects.add('Wait', p.id, p);
    return { waited: true };
  })
  .emit(() => {});
