import { command, domainFail } from '@osric/engine';
import { requireCharacter } from '../shared-rules/characterExist';

export interface DescendStairsParams {
  id: string;
  toLevelId: string;
}

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
