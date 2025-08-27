/**
 * osric:dropLoot — Emit a LootDropped effect with item list for an owner.
 */
import { command, domainFail } from '@osric/engine';

/** Parameters for osric:dropLoot. */
export interface DropLootParams {
  ownerId: string;
  items: string[];
}

/** Result payload for osric:dropLoot. */
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
