import { command, domainFail } from '@osric/engine';

export interface EndBattleParams {
  id: string;
}

export interface EndBattleResult {
  ended: true;
}

command<EndBattleParams>('osric:endBattle')
  .validate((_acc, p) => (!p || typeof p.id !== 'string' ? domainFail('INVALID_PARAMS') : {}))
  .calc((_acc, p, ctx) => {
    (
      ctx as unknown as { effects: { add: (t: string, target: string, payload?: unknown) => void } }
    ).effects.add('BattleEnded', p.id, { id: p.id });
    return { ended: true } as EndBattleResult;
  })
  .emit(() => {});
