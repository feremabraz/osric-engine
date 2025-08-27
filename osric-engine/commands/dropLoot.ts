import { command, domainFail } from '@osric/engine';

export interface DropLootParams {
  ownerId: string;
  items: string[];
}

export interface DropLootResult {
  dropped: true;
}

command<DropLootParams>('osric:dropLoot')
  .validate((_acc, p) =>
    !p || typeof p.ownerId !== 'string' || !Array.isArray(p.items)
      ? domainFail('INVALID_PARAMS')
      : {}
  )
  .calc((_acc, p, ctx) => {
    (
      ctx as unknown as { effects: { add: (t: string, target: string, payload?: unknown) => void } }
    ).effects.add('LootDropped', p.ownerId, { ownerId: p.ownerId, items: p.items });
    return { dropped: true } as DropLootResult;
  })
  .emit(() => {});
