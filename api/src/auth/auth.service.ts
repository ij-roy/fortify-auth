import { Injectable } from "@nestjs/common";
import { createHmac, randomBytes } from "crypto";
import { UsersRepo } from "./repos/users.repo";
import { SessionsRepo } from "./repos/sessions.repo";
import { RefreshRepo } from "./repos/refresh.repo";
import { hashPassword, signToken, verifyPassword } from "./crypto";
import { normalizeEmail, isValidEmail, isValidName, isValidPassword } from "./validation";

const AT_COOKIE = "at";
const RT_COOKIE = "rt";

function unixNow() {
  return Math.floor(Date.now() / 1000);
}

@Injectable()
export class AuthService {
  constructor(
    private users: UsersRepo,
    private sessions: SessionsRepo,
    private refresh: RefreshRepo
  ) {}

  private tokenConfig() {
    return {
      iss: process.env.TOKEN_ISS ?? "api",
      aud: process.env.TOKEN_AUD ?? "web",
      atTtl: Number(process.env.ACCESS_TTL_SEC ?? 900),
      rtTtl: Number(process.env.REFRESH_TTL_SEC ?? 1209600),
      tokenSecret: process.env.TOKEN_SECRET!,
      rtHashSecret: process.env.RT_HASH_SECRET!,
    };
  }

  private hashRefreshToken(rt: string): Buffer {
    const cfg = this.tokenConfig();
    return createHmac("sha256", cfg.rtHashSecret).update(rt).digest();
  }

  private async getUserIdFromSession(sessionId: string): Promise<string> {
    const uid = await this.sessions.getUserId(sessionId);
    if (!uid) throw new Error("SESSION_INVALID");
    return uid;
  }

  createCookieAttrs(path: string) {
    const secure = (process.env.COOKIE_SECURE ?? "false") === "true";
    return {
      httpOnly: true,
      secure,
      sameSite: "Strict" as const,
      path,
    };
  }

  cookies() {
    return { AT_COOKIE, RT_COOKIE };
  }

  async signup(
    input: { email: string; name: string; password: string },
    userAgent?: string
  ) {
    const email = normalizeEmail(input.email);
    const name = input.name.trim();

    if (!isValidEmail(email) || !isValidName(name) || !isValidPassword(input.password)) {
      throw new Error("VALIDATION");
    }

    const existing = await this.users.findByEmail(email);
    if (existing) throw new Error("AUTH_FAILED");

    const pw = hashPassword(input.password);
    const user = await this.users.createUser(email, name, pw);

    const session = await this.sessions.createSession(user.id, userAgent);
    const { accessToken, refreshToken } = await this.issueTokens(user.id, session.id);

    return { user, accessToken, refreshToken, sessionId: session.id };
  }

  async signin(
    input: { email: string; password: string },
    userAgent?: string
  ) {
    const email = normalizeEmail(input.email);

    if (!isValidEmail(email) || !isValidPassword(input.password)) {
      throw new Error("AUTH_FAILED");
    }

    const row = await this.users.findByEmail(email);
    if (!row) throw new Error("AUTH_FAILED");

    const stored = {
      salt: row.password_salt,
      hash: row.password_hash,
      params: row.password_params,
    };

    const ok = verifyPassword(input.password, stored);
    if (!ok) throw new Error("AUTH_FAILED");

    const session = await this.sessions.createSession(row.id, userAgent);
    const { accessToken, refreshToken } = await this.issueTokens(row.id, session.id);

    const user = await this.users.findById(row.id);
    return { user, accessToken, refreshToken, sessionId: session.id };
  }

  async issueTokens(userId: string, sessionId: string) {
    const cfg = this.tokenConfig();
    const now = unixNow();

    const accessToken = signToken(
      {
        sub: userId,
        iat: now,
        exp: now + cfg.atTtl,
        iss: cfg.iss,
        aud: cfg.aud,
        type: "access",
      },
      cfg.tokenSecret
    );

    const refreshToken = randomBytes(32).toString("base64url");

    const tokenHash = this.hashRefreshToken(refreshToken);

    const expiresAt = new Date(Date.now() + cfg.rtTtl * 1000);
    await this.refresh.insertRefreshToken(sessionId, tokenHash, expiresAt, null);

    return { accessToken, refreshToken };
  }

  async refreshSession(refreshToken: string) {
    const cfg = this.tokenConfig();
    if (!refreshToken) throw new Error("NO_RT");

    const tokenHash = this.hashRefreshToken(refreshToken);
    const row = await this.refresh.findByHash(tokenHash);

    if (!row) throw new Error("RT_INVALID");

    const nowMs = Date.now();
    if (row.revoked_at) throw new Error("RT_REVOKED");
    if (new Date(row.expires_at).getTime() <= nowMs) throw new Error("RT_EXPIRED");

    // reuse detection
    if (row.used_at) {
      await this.refresh.revokeAllForSession(row.session_id, "REUSE_DETECTED");
      await this.sessions.revokeSession(row.session_id);
      throw new Error("RT_REUSE");
    }

    // session revoked check
    if (await this.sessions.isSessionRevoked(row.session_id)) {
      throw new Error("SESSION_REVOKED");
    }

    // mark old as used
    await this.refresh.markUsed(row.id);

    const userId = await this.getUserIdFromSession(row.session_id);

    // new access token
    const now = Math.floor(Date.now() / 1000);
    const accessToken = signToken(
      {
        sub: userId,
        iat: now,
        exp: now + cfg.atTtl,
        iss: cfg.iss,
        aud: cfg.aud,
        type: "access",
      },
      cfg.tokenSecret
    );

    // new refresh token (opaque)
    const newRt = randomBytes(32).toString("base64url");
    const newHash = this.hashRefreshToken(newRt);
    const expiresAt = new Date(Date.now() + cfg.rtTtl * 1000);

    await this.refresh.insertRefreshToken(row.session_id, newHash, expiresAt, row.id);

    return { accessToken, refreshToken: newRt };
  }
  
}
