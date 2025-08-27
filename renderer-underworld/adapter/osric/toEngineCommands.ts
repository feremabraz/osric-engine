import type {
  ApplyDamageParams,
  AttackParams,
  DoorToggleParams,
  MoveParams,
  ResolveAttackParams,
  TalkParams,
  TurnParams,
  WaitParams,
} from '@osric/osric-engine';
import type { World } from '../../world/sim';
import type { Command as SimCommand } from '../../world/sim';
import { DEFAULT_TARGETING_ATTACK, DEFAULT_TARGETING_INTERACT } from './config';
import { pickBestTarget } from './targeting';

export type LocalCommand = SimCommand;

export type EngineCommand =
  | { key: 'osric:turn'; params: TurnParams }
  | { key: 'osric:move'; params: MoveParams }
  | { key: 'osric:doorToggle'; params: DoorToggleParams }
  | { key: 'osric:wait'; params: WaitParams }
  | { key: 'osric:attack'; params: AttackParams }
  | { key: 'osric:resolveAttack'; params: ResolveAttackParams }
  | { key: 'osric:applyDamage'; params: ApplyDamageParams }
  | { key: 'osric:talk'; params: TalkParams };

/**
 * Map local sim commands into domain engine commands.
 *
 * Behavior
 * - Pure transformation, no side effects.
 * - If a `world` is provided, uses a simple heuristic to pick a target for `Attack` and `Interact`.
 * - If no valid target is found, the player acts on themselves (safe default) or talks to nobody.
 *
 * Params
 * - local: list of local commands (e.g., MoveForward, TurnLeft)
 * - playerId: id of the acting character in the domain engine
 * - world: optional world snapshot used for target selection
 *
 * Returns
 * - An array of domain engine commands suitable for `engine.execute(key, params)`
 *
 * Example
 * ```ts
 * const cmds = toEngineCommands([{ type: 'MoveForward' }], 'player', world);
 * for (const c of cmds) engine.execute(c.key, c.params);
 * ```
 */
export function toEngineCommands(
  local: LocalCommand[],
  playerId = 'player',
  world?: World
): EngineCommand[] {
  const out: EngineCommand[] = [];
  for (const cmd of local) {
    switch (cmd.type) {
      case 'TurnLeft':
        out.push({ key: 'osric:turn', params: { id: playerId, direction: 'left' } });
        break;
      case 'TurnRight':
        out.push({ key: 'osric:turn', params: { id: playerId, direction: 'right' } });
        break;
      case 'MoveForward':
        out.push({ key: 'osric:move', params: { id: playerId, direction: 'forward' } });
        break;
      case 'MoveBackward':
        out.push({ key: 'osric:move', params: { id: playerId, direction: 'backward' } });
        break;
      case 'StrafeLeft':
        out.push({ key: 'osric:move', params: { id: playerId, direction: 'strafeLeft' } });
        break;
      case 'StrafeRight':
        out.push({ key: 'osric:move', params: { id: playerId, direction: 'strafeRight' } });
        break;
      case 'OpenDoor':
        out.push({ key: 'osric:doorToggle', params: { id: playerId } });
        break;
      case 'Wait':
        out.push({ key: 'osric:wait', params: { id: playerId } });
        break;
      case 'Attack': {
        let targetCharId: string | undefined;
        if (world) {
          targetCharId = pickBestTarget(world, world.player, DEFAULT_TARGETING_ATTACK);
        }
        const tid = targetCharId ?? playerId;
        out.push({ key: 'osric:attack', params: { attackerId: playerId, targetId: tid } });
        out.push({
          key: 'osric:resolveAttack',
          params: { attackerId: playerId, targetId: tid, roll: 10, modifiers: 0 },
        });
        out.push({
          key: 'osric:applyDamage',
          params: { targetId: tid, amount: 1, sourceId: playerId },
        });
        break;
      }
      case 'Interact': {
        let targetCharId: string | undefined;
        if (world) {
          targetCharId = pickBestTarget(world, world.player, DEFAULT_TARGETING_INTERACT);
        }
        out.push({ key: 'osric:talk', params: { speakerId: playerId, targetId: targetCharId } });
        break;
      }
    }
  }
  return out;
}
