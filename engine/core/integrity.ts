/**
 * Lightweight integrity helpers based on stable value hashing. Used by tests
 * and optional invariants to detect unintended mutations.
 */
import { hashValue } from './hash';

export type IntegrityHash = bigint;

/** Compute an integrity hash from an accumulator object. */
export function computeHash(acc: unknown): IntegrityHash {
  return hashValue(acc);
}

/** Verify that the accumulator hashes to the expected value. */
export function verifyHash(expected: IntegrityHash, acc: unknown): boolean {
  return expected === computeHash(acc);
}
