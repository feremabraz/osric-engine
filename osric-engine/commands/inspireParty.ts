/**
 * osric:inspireParty — Increase party morale bonus by a positive amount.
 */
import { command, domainFail } from '@osric/engine';
import type { DomainMemoryStore } from '../memoryStore';
import type { Character } from '../memoryStore';
import { requireCharacter } from '../shared-rules/characterExist';

/** Parameters for osric:inspireParty. */
export interface InspirePartyParams {
  leaderId: string;
  bonus: number;
  message?: string;
}

/** Result payload for osric:inspireParty. */
export interface InspirePartyResult {
  affected: number;
  leaderId: string;
  bonus: number;
}

command<InspirePartyParams>('osric:inspireParty')
  .validate((_acc, p) => {
    if (!p || typeof p.leaderId !== 'string' || typeof p.bonus !== 'number')
      return domainFail('INVALID_PARAMS');
    if (p.bonus <= 0) return domainFail('INVALID_BONUS');
    return;
  })
  .load(requireCharacter<InspirePartyParams, 'leaderId'>('leaderId'))
  .mutate((_acc, p, ctx) => {
    const store = (ctx as unknown as { store: DomainMemoryStore }).store;
    const chars = store.getState().characters as Character[];
    for (const c of chars) {
      (c as unknown as { moraleBonus?: number }).moraleBonus =
        (c as unknown as { moraleBonus?: number }).moraleBonus ?? 0;
      (c as unknown as { moraleBonus: number }).moraleBonus += p.bonus;
    }
    return;
  })
  .emit((_acc, p, ctx): InspirePartyResult => {
    const store = (ctx as unknown as { store: DomainMemoryStore }).store;
    const count = store.getState().characters.length;
    return { affected: count, leaderId: p.leaderId, bonus: p.bonus };
  });
