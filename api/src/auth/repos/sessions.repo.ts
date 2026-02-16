import { Injectable } from "@nestjs/common";
import { DbService } from "../../db/db.service";

@Injectable()
export class SessionsRepo {
  constructor(private db: DbService) {}

  async createSession(userId: string, userAgent?: string) {
    const r = await this.db.query(
      `INSERT INTO auth_sessions (user_id, user_agent)
       VALUES ($1,$2)
       RETURNING id, user_id, created_at, revoked_at`,
      [userId, userAgent ?? null]
    );
    return r.rows[0];
  }

  async revokeSession(sessionId: string) {
    await this.db.query(
      `UPDATE auth_sessions
       SET revoked_at=now()
       WHERE id=$1 AND revoked_at IS NULL`,
      [sessionId]
    );
  }
}