export function requireLOS<P, A extends keyof P & string, T extends keyof P & string>(
  _attackerField: A,
  _targetField: T,
  _code = 'NO_LOS'
) {
  return (_acc: unknown, _params: P, _ctx: unknown) => {
    return {};
  };
}
