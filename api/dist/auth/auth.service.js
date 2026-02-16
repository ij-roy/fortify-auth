"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const users_repo_1 = require("./repos/users.repo");
const sessions_repo_1 = require("./repos/sessions.repo");
const refresh_repo_1 = require("./repos/refresh.repo");
const crypto_2 = require("./crypto");
const validation_1 = require("./validation");
const AT_COOKIE = "at";
const RT_COOKIE = "rt";
function unixNow() {
    return Math.floor(Date.now() / 1000);
}
let AuthService = class AuthService {
    constructor(users, sessions, refresh) {
        this.users = users;
        this.sessions = sessions;
        this.refresh = refresh;
    }
    tokenConfig() {
        return {
            iss: process.env.TOKEN_ISS ?? "api",
            aud: process.env.TOKEN_AUD ?? "web",
            atTtl: Number(process.env.ACCESS_TTL_SEC ?? 900),
            rtTtl: Number(process.env.REFRESH_TTL_SEC ?? 1209600),
            tokenSecret: process.env.TOKEN_SECRET,
            rtHashSecret: process.env.RT_HASH_SECRET,
        };
    }
    hashRefreshToken(rt) {
        const cfg = this.tokenConfig();
        return (0, crypto_1.createHmac)("sha256", cfg.rtHashSecret).update(rt).digest();
    }
    async getUserIdFromSession(sessionId) {
        const uid = await this.sessions.getUserId(sessionId);
        if (!uid)
            throw new Error("SESSION_INVALID");
        return uid;
    }
    createCookieAttrs(path) {
        const secure = (process.env.COOKIE_SECURE ?? "false") === "true";
        return {
            httpOnly: true,
            secure,
            sameSite: "Strict",
            path,
        };
    }
    cookies() {
        return { AT_COOKIE, RT_COOKIE };
    }
    async signup(input, userAgent) {
        const email = (0, validation_1.normalizeEmail)(input.email);
        const name = input.name.trim();
        if (!(0, validation_1.isValidEmail)(email) || !(0, validation_1.isValidName)(name) || !(0, validation_1.isValidPassword)(input.password)) {
            throw new Error("VALIDATION");
        }
        const existing = await this.users.findByEmail(email);
        if (existing)
            throw new Error("AUTH_FAILED");
        const pw = (0, crypto_2.hashPassword)(input.password);
        const user = await this.users.createUser(email, name, pw);
        const session = await this.sessions.createSession(user.id, userAgent);
        const { accessToken, refreshToken } = await this.issueTokens(user.id, session.id);
        return { user, accessToken, refreshToken, sessionId: session.id };
    }
    async signin(input, userAgent) {
        const email = (0, validation_1.normalizeEmail)(input.email);
        if (!(0, validation_1.isValidEmail)(email) || !(0, validation_1.isValidPassword)(input.password)) {
            throw new Error("AUTH_FAILED");
        }
        const row = await this.users.findByEmail(email);
        if (!row)
            throw new Error("AUTH_FAILED");
        const stored = {
            salt: row.password_salt,
            hash: row.password_hash,
            params: row.password_params,
        };
        const ok = (0, crypto_2.verifyPassword)(input.password, stored);
        if (!ok)
            throw new Error("AUTH_FAILED");
        const session = await this.sessions.createSession(row.id, userAgent);
        const { accessToken, refreshToken } = await this.issueTokens(row.id, session.id);
        const user = await this.users.findById(row.id);
        return { user, accessToken, refreshToken, sessionId: session.id };
    }
    async issueTokens(userId, sessionId) {
        const cfg = this.tokenConfig();
        const now = unixNow();
        const accessToken = (0, crypto_2.signToken)({
            sub: userId,
            iat: now,
            exp: now + cfg.atTtl,
            iss: cfg.iss,
            aud: cfg.aud,
            type: "access",
        }, cfg.tokenSecret);
        const refreshToken = (0, crypto_1.randomBytes)(32).toString("base64url");
        const tokenHash = this.hashRefreshToken(refreshToken);
        const expiresAt = new Date(Date.now() + cfg.rtTtl * 1000);
        await this.refresh.insertRefreshToken(sessionId, tokenHash, expiresAt, null);
        return { accessToken, refreshToken };
    }
    async refreshSession(refreshToken) {
        const cfg = this.tokenConfig();
        if (!refreshToken)
            throw new Error("NO_RT");
        const tokenHash = this.hashRefreshToken(refreshToken);
        const row = await this.refresh.findByHash(tokenHash);
        if (!row)
            throw new Error("RT_INVALID");
        const nowMs = Date.now();
        if (row.revoked_at)
            throw new Error("RT_REVOKED");
        if (new Date(row.expires_at).getTime() <= nowMs)
            throw new Error("RT_EXPIRED");
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
        const accessToken = (0, crypto_2.signToken)({
            sub: userId,
            iat: now,
            exp: now + cfg.atTtl,
            iss: cfg.iss,
            aud: cfg.aud,
            type: "access",
        }, cfg.tokenSecret);
        // new refresh token (opaque)
        const newRt = (0, crypto_1.randomBytes)(32).toString("base64url");
        const newHash = this.hashRefreshToken(newRt);
        const expiresAt = new Date(Date.now() + cfg.rtTtl * 1000);
        await this.refresh.insertRefreshToken(row.session_id, newHash, expiresAt, row.id);
        return { accessToken, refreshToken: newRt };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_repo_1.UsersRepo,
        sessions_repo_1.SessionsRepo,
        refresh_repo_1.RefreshRepo])
], AuthService);
