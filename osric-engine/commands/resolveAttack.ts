import { command, domainFail } from '@osric/engine';
import { requireCharacter } from '../shared-rules/characterExist';
import { requireAlive } from '../shared-rules/requireAlive';
import { requireInRange } from '../shared-rules/requireInRange';
import { requireLOS } from '../shared-rules/requireLOS';

export interface ResolveAttackParams {
  attackerId: string;
  targetId: string;
  roll: number;
  modifiers?: number;
}

export interface ResolveAttackResult {
  attackerId: string;
  targetId: string;
  total: number;
  hit?: boolean;
}

command<ResolveAttackParams>('osric:resolveAttack')
  .validate((_acc, p) => {
    if (!p || typeof p.attackerId !== 'string' || typeof p.targetId !== 'string')
      return domainFail('INVALID_PARAMS');
    if (typeof p.roll !== 'number') return domainFail('INVALID_PARAMS');
    return {};
  })
  .load(requireCharacter<ResolveAttackParams, 'attackerId'>('attackerId'))
  .load(requireCharacter<ResolveAttackParams, 'targetId'>('targetId'))
  .load(requireAlive<ResolveAttackParams, 'attackerId'>('attackerId'))
  .load(requireAlive<ResolveAttackParams, 'targetId'>('targetId'))
  .load(requireLOS<ResolveAttackParams, 'attackerId', 'targetId'>('attackerId', 'targetId'))
  .load(requireInRange<ResolveAttackParams, 'attackerId', 'targetId'>('attackerId', 'targetId'))
  .calc((_acc, p, ctx) => {
    const total = p.roll + (p.modifiers ?? 0);
    const store = (ctx as unknown as { store: import('../memoryStore').DomainMemoryStore }).store;
    const target = store.getCharacter(p.targetId) as { ac?: number } | undefined;
    const hit = typeof target?.ac === 'number' ? total >= (target.ac as number) : undefined;
    (
      ctx as unknown as { effects: { add: (t: string, target: string, payload?: unknown) => void } }
    ).effects.add('AttackResolved', p.attackerId, {
      attackerId: p.attackerId,
      targetId: p.targetId,
      total,
      hit,
      targetAC: target?.ac,
    });
    return { attackerId: p.attackerId, targetId: p.targetId, total, hit } as ResolveAttackResult;
  })
  .emit(() => {});
