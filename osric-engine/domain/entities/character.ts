import type { Character, DomainMemoryStore } from '../../memoryStore';

/**
 * Create and register a new character in the given store.
 * Throws if a character with the same id already exists.
 */
export function createCharacter(store: DomainMemoryStore, id: string, name: string): Character {
  const character: Character = { id, name, xp: 0 };
  store.addCharacter(character);
  return character;
}

/**
 * Increase a character's experience by the given amount.
 * Throws if the character does not exist or if amount is negative.
 */
export function grantXp(store: DomainMemoryStore, id: string, amount: number): Character {
  if (amount < 0) throw new Error('Negative XP not allowed');
  const c = store.getCharacter(id);
  if (!c) throw new Error('Character not found');
  c.xp += amount;
  return c;
}

/**
 * Return a shallow copy of all characters from the store.
 */
export function listCharacters(store: DomainMemoryStore): Character[] {
  return [...store.getState().characters];
}
