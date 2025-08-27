/**
 * osric:talk — Produce a Talk effect for a speaker and optional target/line.
 */
import { command, domainFail } from '@osric/engine';
import { requireCharacter } from '../shared-rules/characterExist';

/** Parameters for osric:talk. */
export interface TalkParams {
  speakerId: string;
  targetId?: string;
  line?: string;
}

command<TalkParams>('osric:talk')
  .validate((_acc, p) => {
    if (!p || typeof p.speakerId !== 'string') return domainFail('INVALID_PARAMS');
    return {};
  })
  .load(requireCharacter<TalkParams, 'speakerId'>('speakerId'))
  .calc((_acc, p, ctx) => {
    (
      ctx as unknown as { effects: { add: (t: string, target: string, payload?: unknown) => void } }
    ).effects.add('Talk', p.speakerId, p);
    return { interacted: true };
  })
  .emit(() => {});
