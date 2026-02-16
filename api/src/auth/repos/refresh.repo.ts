import { Injectable } from "@nestjs/common";
import { DbService } from "../../db/db.service";

@Injectable()
export class RefreshRepo {
  constructor(private db: DbService) {}

  async insertRefreshToken(
    sessionId: string,
    tokenHash: Buffer,
    expiresAt: Date,
    parentId?: string | null
  ) {
    const r = await this.db.query(
      `INSERT INTO refresh_tokens (session_id, token_hash, expires_at, parent_id)
       VALUES ($1,$2,$3,$4)
       RETURNING id`,
      [sessionId, tokenHash, expiresAt, parentId ?? null]
    );
    return r.rows[0];
  }

  async revokeAllForSession(sessionId: string, reason: string) {
    await this.db.query(
      `UPDATE refresh_tokens
       SET revoked_at=now(), revoked_reason=$2
       WHERE session_id=$1 AND revoked_at IS NULL`,
      [sessionId, reason]
    );
  }
}
