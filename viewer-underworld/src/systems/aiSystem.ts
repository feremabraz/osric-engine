import type { Effect } from '@osric/engine';
import type { DomainEngine } from '@osric/osric-engine';
import * as Renderer from '@osric/renderer-underworld';
import { Adapter } from '@osric/renderer-underworld';

export interface AiStepResult {
  effects: Effect[];
}

/**
 * Engage a nearby hostile and perform one hostile step (move or attack).
 * Returns collected engine effects to be applied by the caller.
 */
export function maybeEngageAndStep(world: Renderer.Sim.World, engine: DomainEngine): AiStepResult {
  const effects: Effect[] = [];
  const cfg = { maxDist: 5.0, fov: Math.PI / 2, losSteps: 20 };
  const targetId = Adapter.pickBestTarget(world, world.player, cfg);
  if (!targetId) return { effects };
  // Start a single battle session lazily
  const battleId = 'battle-1';
  const start = engine.execute('osric:startBattle', {
    id: battleId,
    participantIds: ['player', targetId],
  });
  if (start.effects.length) effects.push(...start.effects);
  const init = engine.execute('osric:rollInitiative', { battleId });
  if (init.effects.length) effects.push(...init.effects);
  const ax = world.actors.find(
    (a) => Renderer.Sim.getCharacterIdForActor(world, a.id) === targetId
  );
  if (!ax) return { effects };
  const px = world.player.x;
  const py = world.player.y;
  const dist2 = (ax.x - px) * (ax.x - px) + (ax.y - py) * (ax.y - py);
  if (dist2 < 1.2 * 1.2 && Adapter.hasLOS(world, px, py, ax.x, ax.y, cfg.losSteps)) {
    const seq = [
      engine.execute('osric:attack', { attackerId: targetId, targetId: 'player' }),
      engine.execute('osric:resolveAttack', {
        attackerId: targetId,
        targetId: 'player',
        roll: 11,
        modifiers: 0,
      }),
      engine.execute('osric:applyDamage', { targetId: 'player', amount: 1, sourceId: targetId }),
      engine.execute('osric:moraleCheck', { id: targetId }),
      engine.execute('osric:endBattle', { id: battleId }),
    ];
    for (const r of seq) if (r.effects?.length) effects.push(...r.effects);
  } else {
    const dx = Math.sign(px - ax.x);
    const dy = Math.sign(py - ax.y);
    const move = engine.execute('osric:battleMove', { id: targetId, dx, dy });
    if (move.effects?.length) effects.push(...move.effects);
  }
  return { effects };
}
