import { command, domainFail } from '@osric/engine';
import { requireCharacter } from '../shared-rules/characterExist';
import { requireAlive } from '../shared-rules/requireAlive';
import { requireInBattle } from '../shared-rules/requireInBattle';

export interface StartTurnParams {
  id: string;
}

export interface StartTurnResult {
  started: true;
}

command<StartTurnParams>('osric:startTurn')
  .validate((_acc, p) => (!p || typeof p.id !== 'string' ? domainFail('INVALID_PARAMS') : {}))
  .load(requireCharacter<StartTurnParams, 'id'>('id'))
  .load(requireInBattle<StartTurnParams, 'id', never>('id'))
  .load(requireAlive<StartTurnParams, 'id'>('id'))
  .calc((_acc, p, ctx) => {
    (
      ctx as unknown as { effects: { add: (t: string, target: string, payload?: unknown) => void } }
    ).effects.add('TurnStarted', p.id, { id: p.id });
    return { started: true } as StartTurnResult;
  })
  .emit(() => {});
