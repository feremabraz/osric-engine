/**
 * osric:descendStairs — Emit a LevelChange effect (direction down) for a character.
 */
import { command, domainFail } from '@osric/engine';
import { requireCharacter } from '../shared-rules/characterExist';

/** Parameters for osric:descendStairs. */
export interface DescendStairsParams {
  id: string;
  toLevelId: string;
}

/** Result payload for osric:descendStairs. */
export interface DescendStairsResult {
  changed: true;
}

command<DescendStairsParams>('osric:descendStairs')
  .validate((_acc, p) =>
    !p || typeof p.id !== 'string' || typeof p.toLevelId !== 'string'
      ? domainFail('INVALID_PARAMS')
      : {}
  )
  .load(requireCharacter<DescendStairsParams, 'id'>('id'))
  .calc((_acc, p, ctx) => {
    (
      ctx as unknown as { effects: { add: (t: string, target: string, payload?: unknown) => void } }
    ).effects.add('LevelChange', p.id, { toLevelId: p.toLevelId, direction: 'down' });
    return { changed: true } as DescendStairsResult;
  })
  .emit(() => {});
