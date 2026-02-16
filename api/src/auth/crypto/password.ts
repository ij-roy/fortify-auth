// src/auth/crypto/password.ts
import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

export type ScryptParams = {
  N: number;
  r: number;
  p: number;
  keyLen: number;
};

export type PasswordHashRecord = {
  salt: Buffer;
  hash: Buffer;
  params: ScryptParams;
};

const DEFAULT_PARAMS: ScryptParams = {
  N: 2 ** 14, // must be power of 2
  r: 8,
  p: 1,
  keyLen: 32,
};

export function hashPassword(
  password: string,
  params: ScryptParams = DEFAULT_PARAMS
): PasswordHashRecord {
  if (typeof password !== "string" || password.length === 0) {
    throw new Error("Password required");
  }

  const salt = randomBytes(16);

  const hash = scryptSync(password, salt, params.keyLen, {
    N: params.N,
    r: params.r,
    p: params.p,
  }) as Buffer;

  return { salt, hash, params };
}

export function verifyPassword(
  password: string,
  stored: PasswordHashRecord
): boolean {
  if (!password || !stored?.salt || !stored?.hash || !stored?.params) {
    return false;
  }

  const derived = scryptSync(password, stored.salt, stored.params.keyLen, {
    N: stored.params.N,
    r: stored.params.r,
    p: stored.params.p,
  }) as Buffer;

  if (derived.length !== stored.hash.length) return false;

  return timingSafeEqual(derived, stored.hash);
}