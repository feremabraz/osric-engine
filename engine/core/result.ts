/**
 * Result helpers and types produced by command execution.
 *
 * The engine never throws for domain conditions. Instead, commands return
 * a discriminated `CommandOutcome` describing success or failure plus any
 * accumulated side effects.
 */
export interface Effect {
  type: string;
  target: string;
  payload?: unknown;
}

export type EngineFailureCode =
  | 'PARAM_INVALID'
  | 'RULE_EXCEPTION'
  | 'DUPLICATE_RESULT_KEY'
  | 'INTEGRITY_MUTATION'
  | 'UNKNOWN_COMMAND';

/** Successful command outcome with typed payload and emitted effects. */
export interface SuccessResult<T = unknown> {
  ok: true;
  type: 'success';
  data: T;
  effects: Effect[];
}

/** Domain-level failure (business rules), not an engine crash. */
export interface DomainFailureResult {
  ok: false;
  type: 'domain-failure';
  code: string;
  message?: string;
  effects: Effect[];
}

/** Engine-level failure (unexpected/pipeline invariant issues). */
export interface EngineFailureResult {
  ok: false;
  type: 'engine-failure';
  code: EngineFailureCode;
  message?: string;
  effects: Effect[];
}

/** Union of all outcomes a command can produce. */
export type CommandOutcome<T = unknown> =
  | SuccessResult<T>
  | DomainFailureResult
  | EngineFailureResult;

/** Create a frozen success result. */
export function success<T>(data: T, effects: Effect[] = []): SuccessResult<T> {
  const r: SuccessResult<T> = { ok: true, type: 'success', data, effects: effects.slice() };
  return Object.freeze(r);
}

/** Create a frozen domain failure result. */
export function domainFail(
  code: string,
  message?: string,
  effects: Effect[] = []
): DomainFailureResult {
  const r: DomainFailureResult = {
    ok: false,
    type: 'domain-failure',
    code,
    message,
    effects: effects.slice(),
  };
  return Object.freeze(r);
}

/** Create a frozen engine failure result. */
export function engineFail(
  code: EngineFailureCode,
  message?: string,
  effects: Effect[] = []
): EngineFailureResult {
  const r: EngineFailureResult = {
    ok: false,
    type: 'engine-failure',
    code,
    message,
    effects: effects.slice(),
  };
  return Object.freeze(r);
}

/** Type guard for success outcomes. */
export function isSuccess<T>(o: CommandOutcome<T>): o is SuccessResult<T> {
  return o.ok;
}

/** Type guard for domain failures. */
export function isDomainFailure(o: CommandOutcome): o is DomainFailureResult {
  return !o.ok && o.type === 'domain-failure';
}

/** Type guard for engine failures. */
export function isEngineFailure(o: CommandOutcome): o is EngineFailureResult {
  return !o.ok && o.type === 'engine-failure';
}
