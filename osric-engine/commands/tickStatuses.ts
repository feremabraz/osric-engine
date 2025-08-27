/**
 * osric:tickStatuses — Emit StatusTicked for a list of actors (no state here).
 */
import { command, domainFail } from '@osric/engine';

/** Parameters for osric:tickStatuses. */
export interface TickStatusesParams {
  actorIds: string[];
}

/** Result payload for osric:tickStatuses. */
export interface TickStatusesResult {
  ticked: true;
}

command<TickStatusesParams>('osric:tickStatuses')
  .validate((_acc, p) => (!p || !Array.isArray(p.actorIds) ? domainFail('INVALID_PARAMS') : {}))
  .calc((_acc, p, ctx) => {
    for (const id of p.actorIds) {
      (
        ctx as unknown as {
          effects: { add: (t: string, target: string, payload?: unknown) => void };
        }
      ).effects.add('StatusTicked', id, { id });
    }
    return { ticked: true } as TickStatusesResult;
  })
  .emit(() => {});
