import { domainFail } from '@osric/engine';
import type { DomainMemoryStore } from '../memoryStore';

export function requireCharacter<P, K extends keyof P & string>(
  idField: K,
  code = 'CHAR_NOT_FOUND'
) {
  return (_acc: unknown, params: P, ctx: unknown) => {
    const store = (ctx as unknown as { store: DomainMemoryStore }).store;
    const cid = params[idField];
    if (typeof cid !== 'string' || !store.getCharacter(cid)) {
      return domainFail(code, `${idField} missing`);
    }
    return {};
  };
}
