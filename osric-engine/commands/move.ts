import { command, domainFail } from '@osric/engine';
import { requireCharacter } from '../shared-rules/characterExist';

export interface MoveParams {
  id: string;
  direction: 'forward' | 'backward' | 'strafeLeft' | 'strafeRight';
  distance?: number;
}

command<MoveParams>('osric:move')
  .validate((_acc, p) => {
    if (!p || typeof p.id !== 'string') return domainFail('INVALID_PARAMS');
    if (!['forward', 'backward', 'strafeLeft', 'strafeRight'].includes(p.direction))
      return domainFail('INVALID_PARAMS');
    return {};
  })
  .load(requireCharacter<MoveParams, 'id'>('id'))
  .calc((_acc, p, ctx) => {
    (
      ctx as unknown as { effects: { add: (t: string, target: string, payload?: unknown) => void } }
    ).effects.add('Move', p.id, p);
    return { moved: true };
  })
  .emit(() => {});
