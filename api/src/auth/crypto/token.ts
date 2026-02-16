// src/auth/crypto/token.ts
import { createHmac, timingSafeEqual, randomBytes } from "crypto";
import { b64urlEncode, b64urlDecodeToBuffer, b64urlDecodeToString } from "./base64url";

export type TokenType = "access";

export type TokenPayload = {
  sub: string;   // user id
  iat: number;   // issued at (unix seconds)
  exp: number;   // expiry (unix seconds)
  iss: string;
  aud: string;
  jti: string;   // unique id
  type: TokenType;
};

export type TokenVerifyOptions = {
  iss: string;
  aud: string;
  now?: number; // unix seconds
};

function stableJson(obj: unknown): string {
  // JSON.stringify is stable enough because we control the object shape
  return JSON.stringify(obj);
}

export function newJti(): string {
  return b64urlEncode(randomBytes(16));
}

export function signToken(
  payload: Omit<TokenPayload, "jti"> & { jti?: string },
  secret: string
): string {
  const header = { alg: "HS256", typ: "JWT" };

  const fullPayload: TokenPayload = {
    ...payload,
    jti: payload.jti ?? newJti(),
  };

  const headerB64 = b64urlEncode(stableJson(header));
  const payloadB64 = b64urlEncode(stableJson(fullPayload));
  const data = `${headerB64}.${payloadB64}`;

  const sig = createHmac("sha256", secret).update(data).digest();
  const sigB64 = b64urlEncode(sig);

  return `${data}.${sigB64}`;
}

export function verifyToken(token: string, secret: string, opts: TokenVerifyOptions): TokenPayload {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("TOKEN_FORMAT");

  const [h, p, s] = parts;
  const data = `${h}.${p}`;

  const expectedSig = createHmac("sha256", secret).update(data).digest();
  const gotSig = b64urlDecodeToBuffer(s);

  if (gotSig.length !== expectedSig.length || !timingSafeEqual(gotSig, expectedSig)) {
    throw new Error("TOKEN_BAD_SIGNATURE");
  }

  const headerJson = b64urlDecodeToString(h);
  const header = JSON.parse(headerJson);
  if (header?.alg !== "HS256") throw new Error("TOKEN_BAD_ALG");

  const payloadJson = b64urlDecodeToString(p);
  const payload = JSON.parse(payloadJson) as TokenPayload;

  const now = opts.now ?? Math.floor(Date.now() / 1000);

  if (payload.iss !== opts.iss) throw new Error("TOKEN_BAD_ISS");
  if (payload.aud !== opts.aud) throw new Error("TOKEN_BAD_AUD");
  if (payload.type !== "access") throw new Error("TOKEN_BAD_TYPE");
  if (typeof payload.exp !== "number" || payload.exp <= now) throw new Error("TOKEN_EXPIRED");
  if (typeof payload.iat !== "number" || payload.iat > now + 30) throw new Error("TOKEN_BAD_IAT");

  return payload;
}