/**
 * osric:ascendStairs — Emit a LevelChange effect (direction up) for a character.
 */
import { command, domainFail } from '@osric/engine';
import { requireCharacter } from '../shared-rules/characterExist';

/** Parameters for osric:ascendStairs. */
export interface AscendStairsParams {
  id: string;
  toLevelId: string;
}

/** Result payload for osric:ascendStairs. */
export interface AscendStairsResult {
  changed: true;
}

command<AscendStairsParams>('osric:ascendStairs')
  .validate((_acc, p) =>
    !p || typeof p.id !== 'string' || typeof p.toLevelId !== 'string'
      ? domainFail('INVALID_PARAMS')
      : {}
  )
  .load(requireCharacter<AscendStairsParams, 'id'>('id'))
  .calc((_acc, p, ctx) => {
    (
      ctx as unknown as { effects: { add: (t: string, target: string, payload?: unknown) => void } }
    ).effects.add('LevelChange', p.id, { toLevelId: p.toLevelId, direction: 'up' });
    return { changed: true } as AscendStairsResult;
  })
  .emit(() => {});
