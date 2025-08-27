import { domainFail } from '@osric/engine';
import type { DomainMemoryStore } from '../memoryStore';

export function requireInBattle<P, K extends keyof P & string, B extends keyof P & string>(
  idField: K,
  battleField?: B,
  code = 'NOT_IN_BATTLE'
) {
  return (_acc: unknown, params: P, ctx: unknown) => {
    const store = (ctx as unknown as { store: DomainMemoryStore }).store;
    const cid = params[idField];
    if (typeof cid !== 'string') return domainFail('INVALID_PARAMS');
    const battleId = battleField ? (params[battleField] as unknown as string) : undefined;
    const battles = store.getState().battles;
    const match = battles.find(
      (b) => (battleId ? b.id === battleId : true) && b.participants.some((p) => p.id === cid)
    );
    if (!match) return domainFail(code, 'not a participant in battle');
    return {};
  };
}
