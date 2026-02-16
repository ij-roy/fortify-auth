"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.newJti = newJti;
exports.signToken = signToken;
exports.verifyToken = verifyToken;
// src/auth/crypto/token.ts
const crypto_1 = require("crypto");
const base64url_1 = require("./base64url");
function stableJson(obj) {
    // JSON.stringify is stable enough because we control the object shape
    return JSON.stringify(obj);
}
function newJti() {
    return (0, base64url_1.b64urlEncode)((0, crypto_1.randomBytes)(16));
}
function signToken(payload, secret) {
    const header = { alg: "HS256", typ: "JWT" };
    const fullPayload = {
        ...payload,
        jti: payload.jti ?? newJti(),
    };
    const headerB64 = (0, base64url_1.b64urlEncode)(stableJson(header));
    const payloadB64 = (0, base64url_1.b64urlEncode)(stableJson(fullPayload));
    const data = `${headerB64}.${payloadB64}`;
    const sig = (0, crypto_1.createHmac)("sha256", secret).update(data).digest();
    const sigB64 = (0, base64url_1.b64urlEncode)(sig);
    return `${data}.${sigB64}`;
}
function verifyToken(token, secret, opts) {
    const parts = token.split(".");
    if (parts.length !== 3)
        throw new Error("TOKEN_FORMAT");
    const [h, p, s] = parts;
    const data = `${h}.${p}`;
    const expectedSig = (0, crypto_1.createHmac)("sha256", secret).update(data).digest();
    const gotSig = (0, base64url_1.b64urlDecodeToBuffer)(s);
    if (gotSig.length !== expectedSig.length || !(0, crypto_1.timingSafeEqual)(gotSig, expectedSig)) {
        throw new Error("TOKEN_BAD_SIGNATURE");
    }
    const headerJson = (0, base64url_1.b64urlDecodeToString)(h);
    const header = JSON.parse(headerJson);
    if (header?.alg !== "HS256")
        throw new Error("TOKEN_BAD_ALG");
    const payloadJson = (0, base64url_1.b64urlDecodeToString)(p);
    const payload = JSON.parse(payloadJson);
    const now = opts.now ?? Math.floor(Date.now() / 1000);
    if (payload.iss !== opts.iss)
        throw new Error("TOKEN_BAD_ISS");
    if (payload.aud !== opts.aud)
        throw new Error("TOKEN_BAD_AUD");
    if (payload.type !== "access")
        throw new Error("TOKEN_BAD_TYPE");
    if (typeof payload.exp !== "number" || payload.exp <= now)
        throw new Error("TOKEN_EXPIRED");
    if (typeof payload.iat !== "number" || payload.iat > now + 30)
        throw new Error("TOKEN_BAD_IAT");
    return payload;
}
