/**
 * osric:pickUp — Pick up an item and emit an ItemPickedUp effect.
 */
import { command, domainFail } from '@osric/engine';
import { requireCharacter } from '../shared-rules/characterExist';

/** Parameters for osric:pickUp. */
export interface PickUpParams {
  actorId: string;
  itemId: string;
}

/** Result payload for osric:pickUp. */
export interface PickUpResult {
  picked: true;
}

command<PickUpParams>('osric:pickUp')
  .validate((_acc, p) =>
    !p || typeof p.actorId !== 'string' || typeof p.itemId !== 'string'
      ? domainFail('INVALID_PARAMS')
      : {}
  )
  .load(requireCharacter<PickUpParams, 'actorId'>('actorId'))
  .calc((_acc, p, ctx) => {
    (
      ctx as unknown as { effects: { add: (t: string, target: string, payload?: unknown) => void } }
    ).effects.add('ItemPickedUp', p.actorId, { actorId: p.actorId, itemId: p.itemId });
    return { picked: true } as PickUpResult;
  })
  .emit(() => {});
