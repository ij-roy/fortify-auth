// src/auth/crypto.spec.ts
import test from "node:test";
import assert from "node:assert/strict";
import { b64urlEncode, b64urlDecodeToString } from "./crypto/base64url";
import { hashPassword, verifyPassword } from "./crypto/password";
import { signToken, verifyToken } from "./crypto/token";
import { parseCookieHeader, serializeSetCookie } from "./crypto/cookie";

test("base64url roundtrip", () => {
  const cases = ["hello", "hello world!", "🔥 unicode", JSON.stringify({ a: 1 })];
  for (const input of cases) {
    const enc = b64urlEncode(input);
    const dec = b64urlDecodeToString(enc);
    assert.equal(dec, input);
  }
});

test("password hashing + verify", () => {
  const pw = "MyStrongPass123!";
  const rec = hashPassword(pw);
  assert.equal(verifyPassword(pw, rec), true);
  assert.equal(verifyPassword("wrong", rec), false);
});

test("token sign/verify", () => {
  const secret = "dev-secret-change";
  const now = 1_700_000_000;

  const token = signToken(
    {
      sub: "user-1",
      iat: now,
      exp: now + 60,
      iss: "api",
      aud: "web",
      type: "access",
    },
    secret
  );

  const payload = verifyToken(token, secret, { iss: "api", aud: "web", now });
  assert.equal(payload.sub, "user-1");
});

test("token expired", () => {
  const secret = "dev-secret-change";
  const now = 1_700_000_000;

  const token = signToken(
    {
      sub: "user-1",
      iat: now - 100,
      exp: now - 1,
      iss: "api",
      aud: "web",
      type: "access",
    },
    secret
  );

  assert.throws(() => verifyToken(token, secret, { iss: "api", aud: "web", now }), /TOKEN_EXPIRED/);
});

test("cookie parse + serialize", () => {
  const header = "a=1; b=hello; c=wow";
  const parsed = parseCookieHeader(header);
  assert.equal(parsed.a, "1");
  assert.equal(parsed.b, "hello");

  const set = serializeSetCookie("__Host-at", "token", {
    httpOnly: true,
    sameSite: "Strict",
    secure: true,
    path: "/",
    maxAge: 60,
  });

  assert.ok(set.includes("HttpOnly"));
  assert.ok(set.includes("SameSite=Strict"));
  assert.ok(set.includes("Secure"));
});