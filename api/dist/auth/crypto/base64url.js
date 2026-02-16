"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.b64urlEncode = b64urlEncode;
exports.b64urlDecodeToBuffer = b64urlDecodeToBuffer;
exports.b64urlDecodeToString = b64urlDecodeToString;
// src/auth/crypto/base64url.ts
const buffer_1 = require("buffer");
function b64urlEncode(input) {
    const buf = typeof input === "string" ? buffer_1.Buffer.from(input, "utf8") : input;
    return buf
        .toString("base64")
        .replace(/=/g, "")
        .replace(/\+/g, "-")
        .replace(/\//g, "_");
}
function b64urlDecodeToBuffer(input) {
    // restore padding
    const padLen = (4 - (input.length % 4)) % 4;
    const padded = input + "=".repeat(padLen);
    const b64 = padded.replace(/-/g, "+").replace(/_/g, "/");
    return buffer_1.Buffer.from(b64, "base64");
}
function b64urlDecodeToString(input) {
    return b64urlDecodeToBuffer(input).toString("utf8");
}
