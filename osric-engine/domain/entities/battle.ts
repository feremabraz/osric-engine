/** Participant in a battle, with optional hp and initiative. */
export interface BattleParticipant {
  id: string;
  initiative: number | null;
  hp?: number;
}

/** Top-level battle state tracked in the domain store. */
export interface BattleState {
  id: string;
  round: number;
  participants: BattleParticipant[];
  active?: string;
  status: 'pending' | 'active' | 'ended';
}
