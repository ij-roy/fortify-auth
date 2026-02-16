// src/auth/crypto/cookie.ts
export type CookieAttrs = {
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: "Strict" | "Lax" | "None";
  path?: string;
  maxAge?: number; // seconds
  expires?: Date;
  domain?: string;
};

export function parseCookieHeader(headerValue: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!headerValue) return out;

  const parts = headerValue.split(";");
  for (const part of parts) {
    const [k, ...rest] = part.trim().split("=");
    if (!k) continue;
    out[k] = rest.join("=") ?? "";
  }
  return out;
}

export function serializeSetCookie(name: string, value: string, attrs: CookieAttrs = {}): string {
  // Basic guard: disallow newline (header injection)
  if (/[\r\n]/.test(name) || /[\r\n]/.test(value)) throw new Error("Invalid cookie");

  let c = `${name}=${value}`;

  if (attrs.maxAge != null) c += `; Max-Age=${Math.floor(attrs.maxAge)}`;
  if (attrs.expires) c += `; Expires=${attrs.expires.toUTCString()}`;
  if (attrs.domain) c += `; Domain=${attrs.domain}`;
  c += `; Path=${attrs.path ?? "/"}`;

  if (attrs.httpOnly) c += `; HttpOnly`;
  if (attrs.secure) c += `; Secure`;
  if (attrs.sameSite) c += `; SameSite=${attrs.sameSite}`;

  return c;
}

export function clearCookie(name: string, path = "/"): string {
  return serializeSetCookie(name, "", { path, httpOnly: true, expires: new Date(0) });
}
