CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Users
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    telegram_id BIGINT UNIQUE,
    username VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Wallets
CREATE TABLE IF NOT EXISTS wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    network VARCHAR(20) NOT NULL DEFAULT 'TON',
    wallet_address VARCHAR(150) NOT NULL,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(network, wallet_address),
    UNIQUE(user_id, network)
);

-- 3. User balances
CREATE TABLE IF NOT EXISTS balances (
    user_id UUID PRIMARY KEY REFERENCES users(id),
    available_balance NUMERIC(30, 9) NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (available_balance >= 0)
);

-- 4. Levels
CREATE TABLE IF NOT EXISTS levels (
    level INTEGER PRIMARY KEY,
    upgrade_cost NUMERIC(30, 9) NOT NULL DEFAULT 0,
    mining_rate NUMERIC(30, 9) NOT NULL DEFAULT 0
);

-- 5. User levels
CREATE TABLE IF NOT EXISTS user_levels (
    user_id UUID PRIMARY KEY REFERENCES users(id),
    current_level INTEGER NOT NULL DEFAULT 1 REFERENCES levels(level),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Mining rewards
CREATE TABLE IF NOT EXISTS mining_rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    amount NUMERIC(30, 9) NOT NULL CHECK (amount > 0),
    reward_type VARCHAR(30) NOT NULL,
    idempotency_key VARCHAR(150) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Ledger entries
CREATE TABLE IF NOT EXISTS ledger_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    entry_type VARCHAR(30) NOT NULL,
    amount NUMERIC(30, 9) NOT NULL CHECK (amount <> 0),
    reference_id UUID,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Blockchain transactions
CREATE TABLE IF NOT EXISTS blockchain_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    network VARCHAR(20) NOT NULL DEFAULT 'TON',
    transaction_hash VARCHAR(200) UNIQUE,
    transaction_type VARCHAR(30) NOT NULL,
    amount NUMERIC(30, 9),
    status VARCHAR(30) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. System events
CREATE TABLE IF NOT EXISTS system_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Audit logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100),
    resource_id UUID,
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_telegram_id
ON users(telegram_id);

CREATE INDEX IF NOT EXISTS idx_mining_rewards_user
ON mining_rewards(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ledger_user
ON ledger_entries(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_blockchain_status
ON blockchain_transactions(status);

CREATE INDEX IF NOT EXISTS idx_system_events_created
ON system_events(created_at DESC);
