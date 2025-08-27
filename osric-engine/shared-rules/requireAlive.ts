import { domainFail } from '@osric/engine';
import type { DomainMemoryStore } from '../memoryStore';

export function requireAlive<P, K extends keyof P & string>(idField: K, code = 'DEAD') {
  return (_acc: unknown, params: P, ctx: unknown) => {
    const store = (ctx as unknown as { store: DomainMemoryStore }).store;
    const cid = params[idField];
    if (typeof cid !== 'string') return domainFail('INVALID_PARAMS');
    const battles = store.getState().battles;
    for (const b of battles) {
      const pt = b.participants.find((p) => p.id === cid);
      if (pt && typeof pt.hp === 'number' && pt.hp <= 0) {
        return domainFail(code, 'actor is defeated');
      }
    }
    return {};
  };
}
