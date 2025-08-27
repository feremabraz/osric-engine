/**
 * osric:grantXp — Grant experience points to a character.
 * Emits no battle effects; mutates the character's xp.
 */
import { command, domainFail, success } from '@osric/engine';
import type { DomainMemoryStore } from '../memoryStore';
import { requireCharacter } from '../shared-rules/characterExist';

/** Parameters for osric:grantXp. */
export interface GrantXpParams {
  id: string;
  amount: number;
}

/** Result payload for osric:grantXp. */
export interface GrantXpResult {
  id: string;
  newXp: number;
}

command<GrantXpParams>('osric:grantXp')
  .validate((_acc, params) => {
    if (!params || typeof params.id !== 'string' || typeof params.amount !== 'number') {
      return domainFail('INVALID_PARAMS', 'id and amount required');
    }
    if (params.amount <= 0) return domainFail('INVALID_AMOUNT', 'amount must be > 0');
    return {};
  })
  .load(requireCharacter<GrantXpParams, 'id'>('id', 'NOT_FOUND'))
  .mutate((_acc, params, ctx) => {
    const store = (ctx as unknown as { store: DomainMemoryStore }).store;
    const ch = store.getCharacter(params.id);
    if (!ch) return domainFail('NOT_FOUND');
    ch.xp += params.amount;
    return {};
  })
  .emit((_acc, params, ctx): GrantXpResult => {
    const store = (ctx as unknown as { store: DomainMemoryStore }).store;
    const ch = store.getCharacter(params.id);
    return { id: params.id, newXp: ch ? ch.xp : Number.NaN };
  });
