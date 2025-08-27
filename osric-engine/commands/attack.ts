import { command, domainFail } from '@osric/engine';
import { requireCharacter } from '../shared-rules/characterExist';
import { requireAlive } from '../shared-rules/requireAlive';
import { requireInRange } from '../shared-rules/requireInRange';
import { requireLOS } from '../shared-rules/requireLOS';

export interface AttackParams {
  attackerId: string;
  targetId: string;
}

export interface AttackResult {
  attackerId: string;
  targetId: string;
  roll: number;
}

command<AttackParams>('osric:attack')
  .validate((_acc, p) => {
    if (!p || typeof p.attackerId !== 'string' || typeof p.targetId !== 'string')
      return domainFail('INVALID_PARAMS');
    return {};
  })
  .load(requireCharacter<AttackParams, 'attackerId'>('attackerId'))
  .load(requireCharacter<AttackParams, 'targetId'>('targetId'))
  .load(requireAlive<AttackParams, 'attackerId'>('attackerId'))
  .load(requireAlive<AttackParams, 'targetId'>('targetId'))
  .load(requireLOS<AttackParams, 'attackerId', 'targetId'>('attackerId', 'targetId'))
  .load(requireInRange<AttackParams, 'attackerId', 'targetId'>('attackerId', 'targetId'))
  .calc((_acc, p, ctx) => {
    const rng = (ctx as unknown as { rng: { int: (min: number, max: number) => number } }).rng;
    const roll = rng.int(1, 20);
    (
      ctx as unknown as { effects: { add: (t: string, target: string, payload?: unknown) => void } }
    ).effects.add('AttackRoll', p.attackerId, {
      attackerId: p.attackerId,
      targetId: p.targetId,
      roll,
    });
    return { attackerId: p.attackerId, targetId: p.targetId, roll } as AttackResult;
  })
  .emit(() => {});
