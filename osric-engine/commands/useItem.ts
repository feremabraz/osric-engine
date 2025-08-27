import { command, domainFail } from '@osric/engine';
import { requireCharacter } from '../shared-rules/characterExist';

export interface UseItemParams {
  actorId: string;
  itemId: string;
}

export interface UseItemResult {
  used: true;
}

command<UseItemParams>('osric:useItem')
  .validate((_acc, p) =>
    !p || typeof p.actorId !== 'string' || typeof p.itemId !== 'string'
      ? domainFail('INVALID_PARAMS')
      : {}
  )
  .load(requireCharacter<UseItemParams, 'actorId'>('actorId'))
  .calc((_acc, p, ctx) => {
    (
      ctx as unknown as { effects: { add: (t: string, target: string, payload?: unknown) => void } }
    ).effects.add('ItemUsed', p.actorId, { actorId: p.actorId, itemId: p.itemId });
    return { used: true } as UseItemResult;
  })
  .emit(() => {});
