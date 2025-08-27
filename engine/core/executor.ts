import type { CommandDescriptor, RuleFn } from './command';
import type { EffectsBuffer } from './effects';
import { deepFreeze } from './freeze';
import { computeHash } from './integrity';
import {
  type CommandOutcome,
  type EngineFailureResult,
  domainFail,
  engineFail,
  success,
} from './result';
import type { RNG } from './rng';

export interface ExecutionContext {
  rng: RNG;
  effects: EffectsBuffer;
  [k: string]: unknown;
}

interface InternalState {
  acc: Record<string, unknown>;
  hash: bigint;
}

function applyFragment(
  state: InternalState,
  fragment: Record<string, unknown>
): EngineFailureResult | null {
  for (const key of Object.keys(fragment)) {
    if (Object.prototype.hasOwnProperty.call(state.acc, key)) {
      return engineFail('DUPLICATE_RESULT_KEY', `duplicate result key: ${key}`);
    }
  }
  const next = { ...state.acc, ...fragment };
  state.acc = deepFreeze(next) as Record<string, unknown>;
  state.hash = computeHash(state.acc);
  return null;
}

function executeStageRules(
  state: InternalState,
  rules: RuleFn[],
  params: unknown,
  ctx: ExecutionContext
): CommandOutcome | null {
  for (const rule of rules) {
    const preHash = state.hash;
    let result: unknown;
    try {
      result = rule(state.acc, params, ctx);
    } catch (err) {
      if (err instanceof TypeError && /read only|frozen|extensible/i.test(String(err.message))) {
        return engineFail('INTEGRITY_MUTATION', 'attempted mutation of frozen accumulator');
      }
      return engineFail('RULE_EXCEPTION', (err as Error).message);
    }
    if (computeHash(state.acc) !== preHash) {
      return engineFail('INTEGRITY_MUTATION', 'accumulator mutated without fragment');
    }
    if (result && typeof result === 'object') {
      if ('ok' in result && (result as { ok: boolean }).ok === false) {
        const r = result as CommandOutcome;
        if (r.type === 'domain-failure' || r.type === 'engine-failure') return r;
      }
      const fragment = result as Record<string, unknown>;
      const failure = applyFragment(state, fragment);
      if (failure) return failure;
    }
  }
  return null;
}

/** Execute a command descriptor through the fixed-stage pipeline.
 * Advances RNG once at start; freezes and hashes fragments; drains effects on success.
 */
export function runCommand(
  descriptor: CommandDescriptor,
  rawParams: unknown,
  ctx: ExecutionContext
): CommandOutcome {
  ctx.rng.float();
  const state: InternalState = {
    acc: deepFreeze({}) as Record<string, unknown>,
    hash: computeHash({}),
  };
  const stagesOrder: (keyof typeof descriptor.stages)[] = [
    'validate',
    'load',
    'calc',
    'mutate',
    'emit',
  ];
  for (const stageName of stagesOrder) {
    const rules = descriptor.stages[stageName];
    if (!rules.length) continue;
    const outcome = executeStageRules(state, rules, rawParams, ctx);
    if (outcome) {
      if (!outcome.ok && outcome.type === 'domain-failure') {
        ctx.effects.drain(); // drop effects
        return domainFail(outcome.code, outcome.message);
      }
      return outcome;
    }
  }
  const effects = ctx.effects.drain();
  return success<Record<string, unknown>>(state.acc, Array.from(effects));
}
