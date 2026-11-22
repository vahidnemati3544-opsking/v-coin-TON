BEGIN;

-- Durable settlement records. These tables do not mark a TON payment as
-- confirmed: only a trusted chain-verification adapter may advance status.
CREATE TABLE IF NOT EXISTS purchase_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    idempotency_key VARCHAR(150) NOT NULL UNIQUE,
    network VARCHAR(10) NOT NULL CHECK (network IN ('mainnet', 'testnet')),
    payer_wallet_address VARCHAR(150) NOT NULL,
    beneficiary_jetton_wallet_address VARCHAR(150) NOT NULL,
    founder_ton_wallet_address VARCHAR(150) NOT NULL,
    expected_ton_nano NUMERIC(38,0) NOT NULL CHECK (expected_ton_nano > 0),
    vcoin_amount_base_units NUMERIC(38,0) NOT NULL CHECK (vcoin_amount_base_units > 0),
    payment_transaction_hash VARCHAR(200),
    delivery_transaction_hash VARCHAR(200),
    status VARCHAR(30) NOT NULL DEFAULT 'awaiting_payment'
        CHECK (status IN (
            'awaiting_payment', 'payment_seen', 'payment_confirmed',
            'delivery_pending', 'delivered', 'failed',
            'refund_required', 'refunded'
        )),
    expires_at TIMESTAMPTZ NOT NULL,
    payment_confirmed_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    failure_code VARCHAR(100),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    CHECK (payment_transaction_hash IS NULL OR length(payment_transaction_hash) BETWEEN 8 AND 200),
    CHECK (delivery_transaction_hash IS NULL OR length(delivery_transaction_hash) BETWEEN 8 AND 200)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_purchase_orders_payment_tx
ON purchase_orders(network, payment_transaction_hash)
WHERE payment_transaction_hash IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_purchase_orders_delivery_tx
ON purchase_orders(network, delivery_transaction_hash)
WHERE delivery_transaction_hash IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_purchase_orders_user_status
ON purchase_orders(user_id, status, created_at DESC);

CREATE TABLE IF NOT EXISTS mining_payout_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    network VARCHAR(10) NOT NULL CHECK (network IN ('mainnet', 'testnet')),
    status VARCHAR(20) NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'frozen', 'approved', 'submitting', 'settled', 'failed')),
    total_amount_base_units NUMERIC(38,0) NOT NULL DEFAULT 0
        CHECK (total_amount_base_units >= 0),
    item_count INTEGER NOT NULL DEFAULT 0 CHECK (item_count >= 0),
    manifest_sha256 CHAR(64),
    founder_approved_at TIMESTAMPTZ,
    submitted_at TIMESTAMPTZ,
    settled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    CHECK (manifest_sha256 IS NULL OR manifest_sha256 ~ '^[a-f0-9]{64}$'),
    CHECK (status NOT IN ('approved', 'submitting', 'settled') OR
           (founder_approved_at IS NOT NULL AND manifest_sha256 IS NOT NULL))
);

CREATE TABLE IF NOT EXISTS mining_payout_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID NOT NULL REFERENCES mining_payout_batches(id),
    user_id UUID NOT NULL REFERENCES users(id),
    destination_jetton_wallet_address VARCHAR(150) NOT NULL,
    amount_base_units NUMERIC(38,0) NOT NULL CHECK (amount_base_units > 0),
    status VARCHAR(20) NOT NULL DEFAULT 'queued'
        CHECK (status IN ('queued', 'submitted', 'confirmed', 'bounced', 'failed')),
    idempotency_key VARCHAR(150) NOT NULL UNIQUE,
    blockchain_transaction_hash VARCHAR(200),
    submitted_at TIMESTAMPTZ,
    confirmed_at TIMESTAMPTZ,
    failure_code VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    UNIQUE (batch_id, user_id),
    CHECK (blockchain_transaction_hash IS NULL OR length(blockchain_transaction_hash) BETWEEN 8 AND 200)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_mining_payout_items_chain_tx
ON mining_payout_items(blockchain_transaction_hash)
WHERE blockchain_transaction_hash IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_mining_payout_items_batch_status
ON mining_payout_items(batch_id, status);

-- A single explicit lifecycle gate prevents payout preparation while mining
-- is still accruing. Transition to closed is an owner-controlled operation.
CREATE TABLE IF NOT EXISTS mining_lifecycle (
    singleton BOOLEAN PRIMARY KEY DEFAULT TRUE CHECK (singleton),
    status VARCHAR(20) NOT NULL DEFAULT 'running'
        CHECK (status IN ('running', 'closing', 'closed')),
    closed_at TIMESTAMPTZ,
    closed_by VARCHAR(150),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    CHECK ((status = 'closed') = (closed_at IS NOT NULL))
);

INSERT INTO mining_lifecycle (singleton, status)
VALUES (TRUE, 'running')
ON CONFLICT (singleton) DO NOTHING;

COMMIT;
