import * as api from '@osric/engine';
import { describe, expect, it } from 'vitest';

describe('CE-13 public API snapshot', () => {
  it('exports expected keys', () => {
    const keys = Object.keys(api).sort();
    expect(keys).toEqual([
      'CommandRegistry',
      'EffectsBuffer',
      'Engine',
      'MemoryStore',
      'combineHash',
      'command',
      'computeHash',
      'createRng',
      'deepFreeze',
      'diffSnapshots',
      'domainFail',
      'engineFail',
      'hashHex',
      'hashValue',
      'isDomainFailure',
      'isEngineFailure',
      'isSuccess',
      'makeCommandDescriptor',
      'processBatch',
      'runCommand',
      'success',
      'verifyHash',
    ]);
  });
});
