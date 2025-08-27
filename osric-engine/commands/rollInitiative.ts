/**
 * osric:rollInitiative — Roll initiative for a battle; emits InitiativeRolled.
 */
import { command, domainFail } from '@osric/engine';

/** Parameters for osric:rollInitiative. */
export interface RollInitiativeParams {
  battleId: string;
}

/** Result payload for osric:rollInitiative. */
export interface RollInitiativeResult {
  rolled: true;
}

command<RollInitiativeParams>('osric:rollInitiative')
  .validate((_acc, p) => (!p || typeof p.battleId !== 'string' ? domainFail('INVALID_PARAMS') : {}))

  .calc((_acc, p, ctx) => {
    const store = (ctx as unknown as { store: { getBattle: (id: string) => unknown } }).store;
    if (!store.getBattle(p.battleId)) return domainFail('BATTLE_NOT_FOUND');
    (
      ctx as unknown as { effects: { add: (t: string, target: string, payload?: unknown) => void } }
    ).effects.add('InitiativeRolled', p.battleId, { id: p.battleId });
    return { rolled: true } as RollInitiativeResult;
  })
  .emit(() => {});
