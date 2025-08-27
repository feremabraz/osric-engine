import { command, domainFail } from '@osric/engine';
import { requireCharacter } from '../shared-rules/characterExist';

export interface DoorToggleParams {
  id: string;
}

command<DoorToggleParams>('osric:doorToggle')
  .validate((_acc, p) => {
    if (!p || typeof p.id !== 'string') return domainFail('INVALID_PARAMS');
    return {};
  })
  .load(requireCharacter<DoorToggleParams, 'id'>('id'))
  .calc((_acc, p, ctx) => {
    (
      ctx as unknown as { effects: { add: (t: string, target: string, payload?: unknown) => void } }
    ).effects.add('DoorToggle', p.id, p);
    return { toggled: true };
  })
  .emit(() => {});
