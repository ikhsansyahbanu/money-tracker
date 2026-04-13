-- Jalankan sekali di database sebelum menggunakan fitur forgot password
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token       VARCHAR(64) NOT NULL UNIQUE,
  expires_at  TIMESTAMP NOT NULL,
  used        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS prt_token_idx ON password_reset_tokens (token);
CREATE INDEX IF NOT EXISTS prt_user_id_idx ON password_reset_tokens (user_id);
