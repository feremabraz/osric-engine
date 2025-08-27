import { MemoryStore as CoreMemoryStore } from '@osric/engine';
import type { BattleState } from './domain/entities/battle';

/** Minimal character record stored in the OSRIC domain state. */
export interface Character {
  id: string;
  name: string;
  xp: number;
  hpMax?: number;
  hp?: number;
  ac?: number;
  role?: 'hostile' | 'civilian' | 'neutral';
}

/** Top-level domain state shape for the in-memory store. */
export interface DomainState {
  characters: Character[];
  battles: BattleState[];
}

/**
 * DomainMemoryStore: thin convenience wrapper over the core MemoryStore
 * with helpers tailored to the OSRIC domain entities.
 */
export class DomainMemoryStore extends CoreMemoryStore<DomainState> {
  constructor(initial?: Partial<DomainState>) {
    super({
      characters: [],
      battles: [],
      ...initial,
    } as DomainState);
  }

  /** Find a character by id. */
  getCharacter(id: string): Character | undefined {
    return this.getState().characters.find((c) => c.id === id);
  }

  /** Add a new character; throws on duplicate id. */
  addCharacter(c: Character): void {
    const arr = this.getState().characters;
    if (arr.some((e) => e.id === c.id)) throw new Error('Character id already exists');
    arr.push(c);
  }

  /** Shallow patch a character record by id. */
  updateCharacter(id: string, patch: Partial<Omit<Character, 'id'>>): void {
    const c = this.getCharacter(id);
    if (!c) throw new Error('Character not found');
    if (patch.name !== undefined) c.name = patch.name;
    if (patch.xp !== undefined) c.xp = patch.xp;
    if (patch.hpMax !== undefined) c.hpMax = patch.hpMax;
    if (patch.hp !== undefined) c.hp = patch.hp;
    if (patch.ac !== undefined) c.ac = patch.ac;
    if (patch.role !== undefined) c.role = patch.role;
  }

  /** Add a battle; throws on duplicate id. */
  addBattle(b: BattleState): void {
    const arr = this.getState().battles;
    if (arr.some((e) => e.id === b.id)) throw new Error('Battle id exists');
    arr.push(b);
  }

  /** Retrieve a battle by id. */
  getBattle(id: string): BattleState | undefined {
    return this.getState().battles.find((b) => b.id === id);
  }
}
