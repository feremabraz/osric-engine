import { hashValue } from './hash';

export type IntegrityHash = bigint;

export function computeHash(acc: unknown): IntegrityHash {
  return hashValue(acc);
}

export function verifyHash(expected: IntegrityHash, acc: unknown): boolean {
  return expected === computeHash(acc);
}
