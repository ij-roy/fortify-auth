"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseCookieHeader = parseCookieHeader;
exports.serializeSetCookie = serializeSetCookie;
exports.clearCookie = clearCookie;
function parseCookieHeader(headerValue) {
    const out = {};
    if (!headerValue)
        return out;
    const parts = headerValue.split(";");
    for (const part of parts) {
        const [k, ...rest] = part.trim().split("=");
        if (!k)
            continue;
        out[k] = rest.join("=") ?? "";
    }
    return out;
}
function serializeSetCookie(name, value, attrs = {}) {
    // Basic guard: disallow newline (header injection)
    if (/[\r\n]/.test(name) || /[\r\n]/.test(value))
        throw new Error("Invalid cookie");
    let c = `${name}=${value}`;
    if (attrs.maxAge != null)
        c += `; Max-Age=${Math.floor(attrs.maxAge)}`;
    if (attrs.expires)
        c += `; Expires=${attrs.expires.toUTCString()}`;
    if (attrs.domain)
        c += `; Domain=${attrs.domain}`;
    c += `; Path=${attrs.path ?? "/"}`;
    if (attrs.httpOnly)
        c += `; HttpOnly`;
    if (attrs.secure)
        c += `; Secure`;
    if (attrs.sameSite)
        c += `; SameSite=${attrs.sameSite}`;
    return c;
}
function clearCookie(name, path = "/") {
    return serializeSetCookie(name, "", { path, httpOnly: true, expires: new Date(0) });
}
