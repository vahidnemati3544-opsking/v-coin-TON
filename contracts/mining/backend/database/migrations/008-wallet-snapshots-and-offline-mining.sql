BEGIN;
CREATE TABLE IF NOT EXISTS jetton_wallet_balance_snapshots (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), wallet_id UUID NOT NULL REFERENCES wallets(id),
 network VARCHAR(10) NOT NULL CHECK (network IN ('mainnet','testnet')),
 jetton_master_address VARCHAR(150) NOT NULL, owner_wallet_address VARCHAR(150) NOT NULL,
 jetton_wallet_address VARCHAR(150) NOT NULL, balance_base_units NUMERIC(38,0) NOT NULL CHECK (balance_base_units >= 0),
 chain_block_seqno BIGINT NOT NULL CHECK (chain_block_seqno >= 0), chain_transaction_lt NUMERIC(38,0),
 source VARCHAR(40) NOT NULL, observed_at TIMESTAMPTZ NOT NULL, finalized_at TIMESTAMPTZ,
 is_final BOOLEAN NOT NULL DEFAULT FALSE, source_payload_sha256 CHAR(64) NOT NULL CHECK (source_payload_sha256 ~ '^[a-f0-9]{64}$'),
 created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(), CHECK (finalized_at IS NULL OR finalized_at >= observed_at)
);
CREATE INDEX IF NOT EXISTS idx_jetton_balance_snapshot_latest ON jetton_wallet_balance_snapshots(wallet_id,network,jetton_master_address,chain_block_seqno DESC);
CREATE TABLE IF NOT EXISTS offline_mining_devices (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES users(id), wallet_id UUID NOT NULL REFERENCES wallets(id),
 device_key_fingerprint CHAR(64) NOT NULL CHECK (device_key_fingerprint ~ '^[a-f0-9]{64}$'),
 public_key_spki_pem TEXT NOT NULL, algorithm VARCHAR(20) NOT NULL DEFAULT 'Ed25519' CHECK (algorithm = 'Ed25519'),
 status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active','revoked','review_required')),
 registered_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(), revoked_at TIMESTAMPTZ,
 UNIQUE(user_id,device_key_fingerprint), CHECK ((status = 'revoked') = (revoked_at IS NOT NULL))
);
CREATE TABLE IF NOT EXISTS offline_mining_leases (
 id UUID PRIMARY KEY, user_id UUID NOT NULL REFERENCES users(id), wallet_id UUID NOT NULL REFERENCES wallets(id),
 device_id UUID NOT NULL REFERENCES offline_mining_devices(id), balance_snapshot_id UUID NOT NULL REFERENCES jetton_wallet_balance_snapshots(id),
 key_id VARCHAR(80) NOT NULL, policy_version VARCHAR(40) NOT NULL, network VARCHAR(10) NOT NULL CHECK (network IN ('mainnet','testnet')),
 jetton_master_address VARCHAR(150) NOT NULL, eligible_balance_base_units NUMERIC(38,0) NOT NULL CHECK (eligible_balance_base_units > 0),
 max_duration_seconds INTEGER NOT NULL CHECK (max_duration_seconds BETWEEN 60 AND 86400),
 max_reward_base_units NUMERIC(38,0) NOT NULL CHECK (max_reward_base_units > 0),
 nonce CHAR(64) NOT NULL UNIQUE CHECK (nonce ~ '^[a-f0-9]{64}$'), issued_at TIMESTAMPTZ NOT NULL, expires_at TIMESTAMPTZ NOT NULL,
 payload_json JSONB NOT NULL, signature_base64 TEXT NOT NULL,
 status VARCHAR(20) NOT NULL DEFAULT 'issued' CHECK (status IN ('issued','consumed','expired','revoked','review_required')),
 created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(), CHECK (expires_at > issued_at), UNIQUE(id,user_id,device_id)
);
CREATE INDEX IF NOT EXISTS idx_offline_leases_user_status ON offline_mining_leases(user_id,status,expires_at DESC);
CREATE TABLE IF NOT EXISTS mining_sync_batches (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES users(id), lease_id UUID NOT NULL REFERENCES offline_mining_leases(id),
 idempotency_key VARCHAR(150) NOT NULL, payload_sha256 CHAR(64) NOT NULL CHECK (payload_sha256 ~ '^[a-f0-9]{64}$'),
 status VARCHAR(20) NOT NULL DEFAULT 'received' CHECK (status IN ('received','processing','accepted','rejected','review_required')),
 correlation_id UUID NOT NULL DEFAULT gen_random_uuid(), received_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
 processed_at TIMESTAMPTZ, result_code VARCHAR(80), UNIQUE(user_id,idempotency_key)
);
CREATE TABLE IF NOT EXISTS offline_mining_events (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), event_id UUID NOT NULL UNIQUE, lease_id UUID NOT NULL REFERENCES offline_mining_leases(id),
 user_id UUID NOT NULL REFERENCES users(id), sync_batch_id UUID REFERENCES mining_sync_batches(id),
 sequence_number BIGINT NOT NULL CHECK (sequence_number > 0),
 event_type VARCHAR(20) NOT NULL CHECK (event_type IN ('start','checkpoint','pause','resume','stop')),
 client_recorded_at TIMESTAMPTZ, payload_json JSONB NOT NULL,
 payload_sha256 CHAR(64) NOT NULL CHECK (payload_sha256 ~ '^[a-f0-9]{64}$'),
 previous_event_sha256 CHAR(64), status VARCHAR(20) NOT NULL DEFAULT 'queued'
 CHECK (status IN ('queued','accepted','rejected','review_required')), rejection_code VARCHAR(80),
 received_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(), UNIQUE(lease_id,sequence_number),
 CHECK (previous_event_sha256 IS NULL OR previous_event_sha256 ~ '^[a-f0-9]{64}$')
);
CREATE INDEX IF NOT EXISTS idx_offline_events_lease_status ON offline_mining_events(lease_id,status,sequence_number);
CREATE TABLE IF NOT EXISTS mining_reconciliation_audit (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), sync_batch_id UUID NOT NULL UNIQUE REFERENCES mining_sync_batches(id),
 lease_id UUID NOT NULL REFERENCES offline_mining_leases(id), user_id UUID NOT NULL REFERENCES users(id),
 ruleset_version VARCHAR(40) NOT NULL, accepted_duration_seconds INTEGER NOT NULL DEFAULT 0 CHECK (accepted_duration_seconds >= 0),
 accepted_reward_base_units NUMERIC(38,0) NOT NULL DEFAULT 0 CHECK (accepted_reward_base_units >= 0),
 ledger_transaction_id UUID REFERENCES ledger_transactions(id),
 outcome VARCHAR(20) NOT NULL CHECK (outcome IN ('accepted','rejected','review_required')),
 reason_code VARCHAR(80), correlation_id UUID NOT NULL, reviewed_by VARCHAR(150), reviewed_at TIMESTAMPTZ,
 created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);
COMMIT;
