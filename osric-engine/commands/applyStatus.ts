import { command, domainFail } from '@osric/engine';
import { requireCharacter } from '../shared-rules/characterExist';

export interface ApplyStatusParams {
  targetId: string;
  kind: string;
  duration: number;
}

export interface ApplyStatusResult {
  applied: true;
}

command<ApplyStatusParams>('osric:applyStatus')
  .validate((_acc, p) => {
    if (!p || typeof p.targetId !== 'string' || typeof p.kind !== 'string')
      return domainFail('INVALID_PARAMS');
    if (typeof p.duration !== 'number' || p.duration < 0) return domainFail('INVALID_PARAMS');
    return {};
  })
  .load(requireCharacter<ApplyStatusParams, 'targetId'>('targetId'))
  .calc((_acc, p, ctx) => {
    (
      ctx as unknown as { effects: { add: (t: string, target: string, payload?: unknown) => void } }
    ).effects.add('StatusApplied', p.targetId, {
      targetId: p.targetId,
      kind: p.kind,
      duration: p.duration,
    });
    return { applied: true } as ApplyStatusResult;
  })
  .emit(() => {});
