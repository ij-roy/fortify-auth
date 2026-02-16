"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const crypto_1 = require("crypto");
class FakeRefreshRepo {
    constructor() {
        this.tokens = [];
    }
    async findByHash(h) {
        return this.tokens.find((t) => Buffer.compare(t.token_hash, h) === 0) ?? null;
    }
    async markUsed(id) {
        const t = this.tokens.find((x) => x.id === id);
        if (t && !t.used_at)
            t.used_at = new Date();
    }
    async revokeAllForSession(sessionId, reason) {
        for (const t of this.tokens) {
            if (t.session_id === sessionId && !t.revoked_at) {
                t.revoked_at = new Date();
                t.revoked_reason = reason;
            }
        }
    }
    async insertRefreshToken(sessionId, tokenHash, expiresAt, parentId) {
        const id = `rt_${this.tokens.length + 1}`;
        this.tokens.push({
            id,
            session_id: sessionId,
            token_hash: tokenHash,
            parent_id: parentId ?? null,
            expires_at: expiresAt,
            used_at: null,
            revoked_at: null,
            revoked_reason: null,
        });
        return { id };
    }
}
class FakeSessionsRepo {
    constructor() {
        this.revoked = new Set();
        this.userBySession = new Map();
    }
    async revokeSession(sessionId) {
        this.revoked.add(sessionId);
    }
    async getUserId(sessionId) {
        return this.userBySession.get(sessionId) ?? null;
    }
    async isSessionRevoked(sessionId) {
        return this.revoked.has(sessionId);
    }
}
function hmac(secret, rt) {
    return (0, crypto_1.createHmac)("sha256", secret).update(rt).digest();
}
(0, node_test_1.default)("refresh rotation + reuse detection (table-driven)", async () => {
    const RT_HASH_SECRET = "rt-secret";
    const sessionId = "s1";
    const userId = "u1";
    const refreshRepo = new FakeRefreshRepo();
    const sessionsRepo = new FakeSessionsRepo();
    sessionsRepo.userBySession.set(sessionId, userId);
    // minimal refresh logic that mirrors AuthService.refreshSession behavior
    async function refresh(refreshToken) {
        const tokenHash = hmac(RT_HASH_SECRET, refreshToken);
        const row = await refreshRepo.findByHash(tokenHash);
        if (!row)
            throw new Error("RT_INVALID");
        if (row.revoked_at)
            throw new Error("RT_REVOKED");
        if (new Date(row.expires_at).getTime() <= Date.now())
            throw new Error("RT_EXPIRED");
        if (row.used_at) {
            await refreshRepo.revokeAllForSession(row.session_id, "REUSE_DETECTED");
            await sessionsRepo.revokeSession(row.session_id);
            throw new Error("RT_REUSE");
        }
        if (await sessionsRepo.isSessionRevoked(row.session_id)) {
            throw new Error("SESSION_REVOKED");
        }
        await refreshRepo.markUsed(row.id);
        const newRt = "RT_NEW_" + Math.random().toString(16).slice(2);
        const newHash = hmac(RT_HASH_SECRET, newRt);
        await refreshRepo.insertRefreshToken(row.session_id, newHash, new Date(Date.now() + 60000), row.id);
        return newRt;
    }
    // Seed RT1
    const rt1 = "RT1";
    await refreshRepo.insertRefreshToken(sessionId, hmac(RT_HASH_SECRET, rt1), new Date(Date.now() + 60000), null);
    const cases = [
        {
            name: "valid refresh rotates",
            run: async () => {
                const rt2 = await refresh(rt1);
                strict_1.default.ok(rt2.startsWith("RT_NEW_"));
                const rt1Row = refreshRepo.tokens.find((t) => t.parent_id === null);
                strict_1.default.ok(rt1Row.used_at, "RT1 should be marked used");
            },
        },
        {
            name: "reuse detection revokes session and tokens",
            run: async () => {
                await strict_1.default.rejects(async () => refresh(rt1), /RT_REUSE/);
                strict_1.default.ok(sessionsRepo.revoked.has(sessionId), "session must be revoked");
                const anyActive = refreshRepo.tokens.some((t) => t.session_id === sessionId && !t.revoked_at);
                strict_1.default.equal(anyActive, false, "all refresh tokens must be revoked");
            },
        },
    ];
    for (const c of cases) {
        await c.run();
    }
});
