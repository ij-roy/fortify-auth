import { Injectable } from "@nestjs/common";
import { DbService } from "../../db/db.service";
import { PasswordHashRecord } from "../crypto";

@Injectable()
export class UsersRepo {
  constructor(private db: DbService) {}

  async findByEmail(email: string) {
    const r = await this.db.query(
      `SELECT id, email, name, password_salt, password_hash, password_params
       FROM users WHERE email=$1`,
      [email]
    );
    return r.rows[0] ?? null;
  }

  async findById(id: string) {
    const r = await this.db.query(
      `SELECT id, email, name, created_at FROM users WHERE id=$1`,
      [id]
    );
    return r.rows[0] ?? null;
  }

  async createUser(email: string, name: string, pw: PasswordHashRecord) {
    const r = await this.db.query(
      `INSERT INTO users (email, name, password_salt, password_hash, password_params)
       VALUES ($1,$2,$3,$4,$5)
       RETURNING id, email, name, created_at`,
      [email, name, pw.salt, pw.hash, pw.params]
    );
    return r.rows[0];
  }
}