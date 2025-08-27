/** @packageDocumentation
 * Public API for @osric/domain-osric. Import from '@osric/osric-engine'.
 * This barrel re-exports domain engine, store, scenario, and commands.
 */

export { DomainEngine } from './engine';
export { DomainMemoryStore } from './memoryStore';

export { runDeterminismScenario } from './scenarios/determinism';

export * from './commands/applyDamage';
export * from './commands/applyStatus';
export * from './commands/ascendStairs';
export * from './commands/attack';
export * from './commands/battleMove';
export * from './commands/checkDefeat';
export * from './commands/createCharacter';
export * from './commands/descendStairs';
export * from './commands/die';
export * from './commands/doorToggle';
export * from './commands/dropLoot';
export * from './commands/endBattle';
export * from './commands/endTurn';
export * from './commands/grantXp';
export * from './commands/inspireParty';
export * from './commands/moraleCheck';
export * from './commands/move';
export * from './commands/pickUp';
export * from './commands/resolveAttack';
export * from './commands/rollInitiative';
export * from './commands/startBattle';
export * from './commands/startTurn';
export * from './commands/talk';
export * from './commands/tickStatuses';
export * from './commands/turn';
export * from './commands/useItem';
export * from './commands/wait';

export {
  createCharacter,
  grantXp as domainGrantXp,
  listCharacters,
} from './domain/entities/character';
