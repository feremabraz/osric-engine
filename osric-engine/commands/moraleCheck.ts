import { command, domainFail } from '@osric/engine';
import { requireCharacter } from '../shared-rules/characterExist';

export interface MoraleCheckParams {
  id: string;
  context?: string;
}

export interface MoraleCheckResult {
  checked: true;
}

command<MoraleCheckParams>('osric:moraleCheck')
  .validate((_acc, p) => (!p || typeof p.id !== 'string' ? domainFail('INVALID_PARAMS') : {}))
  .load(requireCharacter<MoraleCheckParams, 'id'>('id'))
  .calc((_acc, p, ctx) => {
    (
      ctx as unknown as { effects: { add: (t: string, target: string, payload?: unknown) => void } }
    ).effects.add('MoraleChecked', p.id, { id: p.id, context: p.context });
    return { checked: true } as MoraleCheckResult;
  })
  .emit(() => {});
