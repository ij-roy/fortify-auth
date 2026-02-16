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
exports.RefreshRepo = void 0;
const common_1 = require("@nestjs/common");
const db_service_1 = require("../../db/db.service");
let RefreshRepo = class RefreshRepo {
    constructor(db) {
        this.db = db;
    }
    async insertRefreshToken(sessionId, tokenHash, expiresAt, parentId) {
        const r = await this.db.query(`INSERT INTO refresh_tokens (session_id, token_hash, expires_at, parent_id)
       VALUES ($1,$2,$3,$4)
       RETURNING id`, [sessionId, tokenHash, expiresAt, parentId ?? null]);
        return r.rows[0];
    }
    async revokeAllForSession(sessionId, reason) {
        await this.db.query(`UPDATE refresh_tokens
       SET revoked_at=now(), revoked_reason=$2
       WHERE session_id=$1 AND revoked_at IS NULL`, [sessionId, reason]);
    }
};
exports.RefreshRepo = RefreshRepo;
exports.RefreshRepo = RefreshRepo = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [db_service_1.DbService])
], RefreshRepo);
