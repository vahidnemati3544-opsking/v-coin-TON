BEGIN;

-- Network-aware TON wallet links and immutable, source-attributed Jetton snapshots.
-- Existing wallet rows remain unverified until a TON Connect proof is validated.

ALTER TABLE wallets
    ADD COLUMN IF NOT EXISTS chain_network VARCHAR(10),
    ADD COLUMN IF NOT EXISTS proof_domain VARCHAR(255),
    ADD COLUMN IF NOT EXISTS proof_payload_hash CHAR(64),
    ADD COLUMN IF NOT EXISTS proof_timestamp BIGINT,
    ADD COLUMN IF NOT EXISTS proof_expires_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS proof_verified_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMPTZ;

-- Replace the legacy single-network uniqueness constraints with network-aware indexes.
ALTER TABLE wallets
    DROP CONSTRAINT IF EXISTS wallets_user_id_network_key;

ALTER TABLE wallets
    DROP CONSTRAINT IF EXISTS wallets_network_wallet_address_key;

CREATE UNIQUE INDEX IF NOT EXISTS wallets_one_per_user_chain_network
    ON wallets (user_id, chain_network)
    WHERE chain_network IS NOT NULL AND revoked_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS wallets_one_owner_per_chain_network
    ON wallets (network, chain_network, wallet_address)
    WHERE chain_network IS NOT NULL AND revoked_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS wallets_proof_payload_hash_unique
    ON wallets (proof_payload_hash)
    WHERE proof_payload_hash IS NOT NULL;

CREATE TABLE IF NOT EXISTS wallet_balance_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE RESTRICT,
    chain_network VARCHAR(10) NOT NULL
        CHECK (chain_network IN ('mainnet', 'testnet')),
    master_address VARCHAR(150) NOT NULL,
    jetton_wallet_address VARCHAR(150) NOT NULL,
    balance_base_units NUMERIC(38,0) NOT NULL
        CHECK (balance_base_units >= 0),
    last_transaction_lt NUMERIC(38,0) NOT NULL
        CHECK (last_transaction_lt >= 0),
    indexer_masterchain_seqno BIGINT NOT NULL
        CHECK (indexer_masterchain_seqno >= 0),
    indexer_block_utime BIGINT NOT NULL
        CHECK (indexer_block_utime > 0),
    indexer_lag_seconds INTEGER NOT NULL
        CHECK (indexer_lag_seconds >= 0),
    source VARCHAR(50) NOT NULL
        CHECK (source IN ('toncenter-v3-indexer')),
    source_payload_hash CHAR(64) NOT NULL
        CHECK (source_payload_hash ~ '^[0-9a-f]{64}$'),
    observed_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    UNIQUE (
        wallet_id,
        master_address,
        indexer_masterchain_seqno,
        last_transaction_lt
    )
);

CREATE INDEX IF NOT EXISTS wallet_balance_snapshots_latest_idx
    ON wallet_balance_snapshots (wallet_id, master_address, observed_at DESC);

CREATE OR REPLACE FUNCTION prevent_wallet_balance_snapshot_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    RAISE EXCEPTION 'wallet_balance_snapshots are immutable; append a new snapshot';
END;
$$;

DROP TRIGGER IF EXISTS wallet_balance_snapshots_immutable
    ON wallet_balance_snapshots;

CREATE TRIGGER wallet_balance_snapshots_immutable
    BEFORE UPDATE OR DELETE ON wallet_balance_snapshots
    FOR EACH ROW
    EXECUTE FUNCTION prevent_wallet_balance_snapshot_mutation();

COMMIT;
