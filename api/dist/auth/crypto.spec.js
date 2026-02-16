"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/auth/crypto.spec.ts
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const base64url_1 = require("./crypto/base64url");
const password_1 = require("./crypto/password");
const token_1 = require("./crypto/token");
const cookie_1 = require("./crypto/cookie");
(0, node_test_1.default)("base64url roundtrip", () => {
    const cases = ["hello", "hello world!", "🔥 unicode", JSON.stringify({ a: 1 })];
    for (const input of cases) {
        const enc = (0, base64url_1.b64urlEncode)(input);
        const dec = (0, base64url_1.b64urlDecodeToString)(enc);
        strict_1.default.equal(dec, input);
    }
});
(0, node_test_1.default)("password hashing + verify", () => {
    const pw = "MyStrongPass123!";
    const rec = (0, password_1.hashPassword)(pw);
    strict_1.default.equal((0, password_1.verifyPassword)(pw, rec), true);
    strict_1.default.equal((0, password_1.verifyPassword)("wrong", rec), false);
});
(0, node_test_1.default)("token sign/verify", () => {
    const secret = "dev-secret-change";
    const now = 1700000000;
    const token = (0, token_1.signToken)({
        sub: "user-1",
        iat: now,
        exp: now + 60,
        iss: "api",
        aud: "web",
        type: "access",
    }, secret);
    const payload = (0, token_1.verifyToken)(token, secret, { iss: "api", aud: "web", now });
    strict_1.default.equal(payload.sub, "user-1");
});
(0, node_test_1.default)("token expired", () => {
    const secret = "dev-secret-change";
    const now = 1700000000;
    const token = (0, token_1.signToken)({
        sub: "user-1",
        iat: now - 100,
        exp: now - 1,
        iss: "api",
        aud: "web",
        type: "access",
    }, secret);
    strict_1.default.throws(() => (0, token_1.verifyToken)(token, secret, { iss: "api", aud: "web", now }), /TOKEN_EXPIRED/);
});
(0, node_test_1.default)("cookie parse + serialize", () => {
    const header = "a=1; b=hello; c=wow";
    const parsed = (0, cookie_1.parseCookieHeader)(header);
    strict_1.default.equal(parsed.a, "1");
    strict_1.default.equal(parsed.b, "hello");
    const set = (0, cookie_1.serializeSetCookie)("__Host-at", "token", {
        httpOnly: true,
        sameSite: "Strict",
        secure: true,
        path: "/",
        maxAge: 60,
    });
    strict_1.default.ok(set.includes("HttpOnly"));
    strict_1.default.ok(set.includes("SameSite=Strict"));
    strict_1.default.ok(set.includes("Secure"));
});
