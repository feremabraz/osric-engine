import { command, domainFail } from '@osric/engine';
import { requireCharacter } from '../shared-rules/characterExist';
import { requireAlive } from '../shared-rules/requireAlive';
import { requireInBattle } from '../shared-rules/requireInBattle';

export interface EndTurnParams {
  id: string;
}

export interface EndTurnResult {
  ended: true;
}

command<EndTurnParams>('osric:endTurn')
  .validate((_acc, p) => (!p || typeof p.id !== 'string' ? domainFail('INVALID_PARAMS') : {}))
  .load(requireCharacter<EndTurnParams, 'id'>('id'))
  .load(requireInBattle<EndTurnParams, 'id', never>('id'))
  .load(requireAlive<EndTurnParams, 'id'>('id'))
  .calc((_acc, p, ctx) => {
    (
      ctx as unknown as { effects: { add: (t: string, target: string, payload?: unknown) => void } }
    ).effects.add('TurnEnded', p.id, { id: p.id });
    return { ended: true } as EndTurnResult;
  })
  .emit(() => {});
