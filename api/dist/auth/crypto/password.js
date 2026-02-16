"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashPassword = hashPassword;
exports.verifyPassword = verifyPassword;
// src/auth/crypto/password.ts
const crypto_1 = require("crypto");
const DEFAULT_PARAMS = {
    N: 2 ** 14, // must be power of 2
    r: 8,
    p: 1,
    keyLen: 32,
};
function hashPassword(password, params = DEFAULT_PARAMS) {
    if (typeof password !== "string" || password.length === 0) {
        throw new Error("Password required");
    }
    const salt = (0, crypto_1.randomBytes)(16);
    const hash = (0, crypto_1.scryptSync)(password, salt, params.keyLen, {
        N: params.N,
        r: params.r,
        p: params.p,
    });
    return { salt, hash, params };
}
function verifyPassword(password, stored) {
    if (!password || !stored?.salt || !stored?.hash || !stored?.params) {
        return false;
    }
    const derived = (0, crypto_1.scryptSync)(password, stored.salt, stored.params.keyLen, {
        N: stored.params.N,
        r: stored.params.r,
        p: stored.params.p,
    });
    if (derived.length !== stored.hash.length)
        return false;
    return (0, crypto_1.timingSafeEqual)(derived, stored.hash);
}
