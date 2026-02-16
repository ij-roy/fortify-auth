// src/auth/crypto/base64url.ts
import { Buffer } from "buffer";

export function b64urlEncode(input: Buffer | string): string {
  const buf = typeof input === "string" ? Buffer.from(input, "utf8") : input;
  return buf
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

export function b64urlDecodeToBuffer(input: string): Buffer {
  // restore padding
  const padLen = (4 - (input.length % 4)) % 4;
  const padded = input + "=".repeat(padLen);
  const b64 = padded.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(b64, "base64");
}

export function b64urlDecodeToString(input: string): string {
  return b64urlDecodeToBuffer(input).toString("utf8");
}