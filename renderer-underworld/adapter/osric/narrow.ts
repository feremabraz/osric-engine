/** @internal Narrow generic engine effects to a known subset used by the renderer. */
import type { Effect } from '@osric/engine';
import type { DoorToggleParams, MoveParams, TalkParams, TurnParams } from '@osric/osric-engine';

// Known typed effects we consume in the renderer
export type KnownEffect =
  | { type: 'BattleMove'; payload: { id?: string; dx?: number; dy?: number } }
  | { type: 'StartBattle'; payload: { id?: string; participants?: string[] } }
  | { type: 'InitiativeRolled'; payload?: { id?: string } }
  | { type: 'BattleEnded'; payload?: { id?: string } }
  | { type: 'Turn'; payload: TurnParams }
  | { type: 'Move'; payload: MoveParams }
  | { type: 'DoorToggle'; payload: DoorToggleParams }
  | {
      type: 'AttackResolved';
      payload: {
        attackerId?: string;
        targetId?: string;
        total?: number;
        hit?: boolean;
        targetAC?: number;
      };
    }
  | {
      type: 'Damage';
      payload: {
        targetId?: string;
        amount?: number;
        prevHp?: number;
        nextHp?: number;
        sourceId?: string;
      };
    }
  | { type: 'Defeated'; payload?: { targetId?: string } }
  | { type: 'Death'; payload?: { targetId?: string } }
  | { type: 'Talk'; payload: TalkParams };

export function narrowEffect(e: Effect): KnownEffect | undefined {
  const t = e.type as KnownEffect['type'];
  switch (t) {
    case 'BattleMove':
      return {
        type: 'BattleMove',
        payload: (e.payload ?? {}) as KnownEffect &
          { payload: { id?: string; dx?: number; dy?: number } }['payload'],
      };
    case 'StartBattle':
      return {
        type: 'StartBattle',
        payload: (e.payload ?? {}) as { id?: string; participants?: string[] },
      };
    case 'InitiativeRolled':
      return { type: 'InitiativeRolled', payload: (e.payload ?? {}) as { id?: string } };
    case 'BattleEnded':
      return { type: 'BattleEnded', payload: (e.payload ?? {}) as { id?: string } };
    case 'Turn':
      return { type: 'Turn', payload: (e.payload ?? {}) as TurnParams };
    case 'Move':
      return { type: 'Move', payload: (e.payload ?? {}) as MoveParams };
    case 'DoorToggle':
      return { type: 'DoorToggle', payload: (e.payload ?? {}) as DoorToggleParams };
    case 'AttackResolved':
      return {
        type: 'AttackResolved',
        payload: (e.payload ?? {}) as {
          attackerId?: string;
          targetId?: string;
          total?: number;
          hit?: boolean;
          targetAC?: number;
        },
      };
    case 'Damage':
      return {
        type: 'Damage',
        payload: (e.payload ?? {}) as {
          targetId?: string;
          amount?: number;
          prevHp?: number;
          nextHp?: number;
          sourceId?: string;
        },
      };
    case 'Defeated':
      return { type: 'Defeated', payload: (e.payload ?? {}) as { targetId?: string } };
    case 'Death':
      return { type: 'Death', payload: (e.payload ?? {}) as { targetId?: string } };
    case 'Talk':
      return { type: 'Talk', payload: (e.payload ?? {}) as TalkParams };
    default:
      return undefined;
  }
}
