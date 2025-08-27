import { command, domainFail } from '@osric/engine';
import { requireCharacter } from '../shared-rules/characterExist';
import { requireAlive } from '../shared-rules/requireAlive';
import { requireInBattle } from '../shared-rules/requireInBattle';

export interface BattleMoveParams {
  id: string;
  dx: number;
  dy: number;
}

export interface BattleMoveResult {
  moved: true;
}

command<BattleMoveParams>('osric:battleMove')
  .validate((_acc, p) => {
    if (!p || typeof p.id !== 'string') return domainFail('INVALID_PARAMS');
    if (typeof p.dx !== 'number' || typeof p.dy !== 'number') return domainFail('INVALID_PARAMS');
    return {};
  })
  .load(requireCharacter<BattleMoveParams, 'id'>('id'))
  .load(requireInBattle<BattleMoveParams, 'id', never>('id'))
  .load(requireAlive<BattleMoveParams, 'id'>('id'))
  .calc((_acc, p, ctx) => {
    (
      ctx as unknown as { effects: { add: (t: string, target: string, payload?: unknown) => void } }
    ).effects.add('BattleMove', p.id, { id: p.id, dx: p.dx, dy: p.dy });
    return { moved: true } as BattleMoveResult;
  })
  .emit(() => {});
