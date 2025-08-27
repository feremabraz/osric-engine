export function requireInRange<P, A extends keyof P & string, T extends keyof P & string>(
  _attackerField: A,
  _targetField: T,
  _rangeField?: keyof P & string,
  _code = 'OUT_OF_RANGE'
) {
  return (_acc: unknown, _params: P, _ctx: unknown) => {
    return {};
  };
}
