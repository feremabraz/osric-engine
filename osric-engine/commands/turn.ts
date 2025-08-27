import { command, domainFail } from '@osric/engine';
import { requireCharacter } from '../shared-rules/characterExist';

export interface TurnParams {
  id: string;
  direction: 'left' | 'right';
  amount?: number;
}

command<TurnParams>('osric:turn')
  .validate((_acc, p) => {
    if (!p || typeof p.id !== 'string') return domainFail('INVALID_PARAMS');
    if (!['left', 'right'].includes(p.direction)) return domainFail('INVALID_PARAMS');
    return {};
  })
  .load(requireCharacter<TurnParams, 'id'>('id'))
  .calc((_acc, p, ctx) => {
    (
      ctx as unknown as { effects: { add: (t: string, target: string, payload?: unknown) => void } }
    ).effects.add('Turn', p.id, p);
    return { turned: true };
  })
  .emit(() => {});
