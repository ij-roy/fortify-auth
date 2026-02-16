-- 0001_init.sql

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  email text NOT NULL UNIQUE,
  name text NOT NULL,
  password_salt bytea NOT NULL,
  password_hash bytea NOT NULL,
  password_params jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS auth_sessions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz NULL,
  user_agent text NULL
);

CREATE INDEX IF NOT EXISTS idx_auth_sessions_user_revoked
ON auth_sessions(user_id, revoked_at);

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id uuid NOT NULL REFERENCES auth_sessions(id) ON DELETE CASCADE,
  token_hash bytea NOT NULL UNIQUE,
  parent_id uuid NULL REFERENCES refresh_tokens(id) ON DELETE SET NULL,
  issued_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  used_at timestamptz NULL,
  revoked_at timestamptz NULL,
  revoked_reason text NULL
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_session
ON refresh_tokens(session_id);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires
ON refresh_tokens(expires_at);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_used
ON refresh_tokens(used_at);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_revoked
ON refresh_tokens(revoked_at);