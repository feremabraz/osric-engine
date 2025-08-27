import type { Effect } from '@osric/engine';

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

function stablePayloadKey(payload: unknown): string {
  if (payload === null || payload === undefined) return 'null';
  if (typeof payload !== 'object') return String(payload);
  try {
    return JSON.stringify(payload);
  } catch {
    return 'json_err';
  }
}
