export interface BattleParticipant {
  id: string;
  initiative: number | null;
  hp?: number;
}

export interface BattleState {
  id: string;
  round: number;
  participants: BattleParticipant[];
  active?: string;
  status: 'pending' | 'active' | 'ended';
}
