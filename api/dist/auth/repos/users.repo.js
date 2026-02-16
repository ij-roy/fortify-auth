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
exports.UsersRepo = void 0;
const common_1 = require("@nestjs/common");
const db_service_1 = require("../../db/db.service");
let UsersRepo = class UsersRepo {
    constructor(db) {
        this.db = db;
    }
    async findByEmail(email) {
        const r = await this.db.query(`SELECT id, email, name, password_salt, password_hash, password_params
       FROM users WHERE email=$1`, [email]);
        return r.rows[0] ?? null;
    }
    async findById(id) {
        const r = await this.db.query(`SELECT id, email, name, created_at FROM users WHERE id=$1`, [id]);
        return r.rows[0] ?? null;
    }
    async createUser(email, name, pw) {
        const r = await this.db.query(`INSERT INTO users (email, name, password_salt, password_hash, password_params)
       VALUES ($1,$2,$3,$4,$5)
       RETURNING id, email, name, created_at`, [email, name, pw.salt, pw.hash, pw.params]);
        return r.rows[0];
    }
};
exports.UsersRepo = UsersRepo;
exports.UsersRepo = UsersRepo = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [db_service_1.DbService])
], UsersRepo);
