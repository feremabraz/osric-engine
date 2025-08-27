export { command } from './authoring/dsl';
export { makeCommandDescriptor } from './core/command';

export { runCommand } from './core/executor';
export {
  processBatch,
  type BatchOptions,
  type BatchItem as CoreBatchItem,
  type BatchResult as CoreBatchResult,
} from './core/batch';
export { EffectsBuffer } from './core/effects';

export {
  success,
  domainFail,
  engineFail,
  isSuccess,
  isDomainFailure,
  isEngineFailure,
} from './core/result';
export type {
  CommandOutcome,
  Effect,
  SuccessResult,
  DomainFailureResult,
  EngineFailureResult,
} from './core/result';

export { Engine, type EngineConfig } from './facade/engine';
export { CommandRegistry } from './facade/registry';
export { diffSnapshots } from './facade/simulate';

export { MemoryStore, type EngineStore } from './core/types';

export { createRng, type RNG, type RNGState } from './core/rng';

export { computeHash, verifyHash } from './core/integrity';
export { hashValue, hashHex, combineHash } from './core/hash';
export { deepFreeze } from './core/freeze';
