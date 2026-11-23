BEGIN;

CREATE TABLE IF NOT EXISTS ton_proof_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES user_sessions(id) ON DELETE CASCADE,
  payload_sha256 CHAR(64) NOT NULL UNIQUE CHECK (payload_sha256 ~ '^[a-f0-9]{64}$'),
  network VARCHAR(10) NOT NULL CHECK (network IN ('mainnet','testnet')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  CHECK (expires_at > created_at),
  CHECK (consumed_at IS NULL OR consumed_at >= created_at)
);

CREATE INDEX IF NOT EXISTS idx_ton_proof_challenges_session_expiry
  ON ton_proof_challenges(user_id, session_id, expires_at DESC)
  WHERE consumed_at IS NULL;

COMMIT;
