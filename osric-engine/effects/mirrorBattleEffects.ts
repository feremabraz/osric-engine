import type { Effect } from '@osric/engine';

/**
 * Mirror one-time battle effects with a `:mirrored` suffix to aid renderers
 * that consume effect streams. Duplicates are suppressed by a stable key.
 */
export function mirrorBattleEffects(effects: Effect[]): Effect[] {
  const seen = new Set<string>();
  const mirrored: Effect[] = [];
  for (const e of effects) {
    if (!e.type.startsWith('battle:')) continue;
    const key = `${e.type}|${e.target}|${stablePayloadKey(e.payload)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    mirrored.push({ ...e, type: `${e.type}:mirrored`, payload: e.payload });
  }
  return mirrored;
}

/** @internal */
function stablePayloadKey(payload: unknown): string {
  if (payload === null || payload === undefined) return 'null';
  if (typeof payload !== 'object') return String(payload);
  try {
    return JSON.stringify(payload);
  } catch {
    return 'json_err';
  }
}
