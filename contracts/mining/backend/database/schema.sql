-- =========================================================
-- V COIN - TON
-- Core Database Schema
-- Version: 1.1.0
-- PostgreSQL
-- =========================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. USERS

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    telegram_user_id BIGINT UNIQUE,
    username VARCHAR(100),
    account_status VARCHAR(20) NOT NULL DEFAULT 'active'
        CHECK (account_status IN ('active', 'suspended', 'blocked', 'pending')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. USER PROFILES

CREATE TABLE IF NOT EXISTS user_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE, Alternatively, use esc then tab to move to the next interactive element on the page.

    first_name VARCHAR(100),
    last_name VARCHAR(100),
    language_code VARCHAR(20) DEFAULT 'en',
    country_code CHAR(2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. USER SESSIONS

CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. WALLETS

CREATE TABLE IF NOT EXISTS wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    network VARCHAR(20) NOT NULL DEFAULT 'TON',
    wallet_address VARCHAR(150) NOT NULL,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (network, wallet_address),
    UNIQUE (user_id, network)
);

-- 5. WALLET VERIFICATIONS

CREATE TABLE IF NOT EXISTS wallet_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL REFERENCES wallets(id),
    verification_method VARCHAR(50) NOT NULL,
    verification_reference VARCHAR(200),
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'verified', 'failed', 'expired')),
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. LEVELS

CREATE TABLE IF NOT EXISTS levels (
    level INTEGER PRIMARY KEY CHECK (level BETWEEN 1 AND 400),
    upgrade_cost_base_units NUMERIC(38,0) NOT NULL DEFAULT 0
        CHECK (upgrade_cost_base_units >= 0),
    mining_rate_base_units_per_second NUMERIC(38,12) NOT NULL DEFAULT 0
        CHECK (mining_rate_base_units_per_second >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. USER LEVELS

CREATE TABLE IF NOT EXISTS user_levels (
    user_id UUID PRIMARY KEY REFERENCES users(id),
    current_level INTEGER NOT NULL DEFAULT 1 REFERENCES levels(level),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. LEVEL UPGRADES

CREATE TABLE IF NOT EXISTS level_upgrades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    previous_level INTEGER NOT NULL REFERENCES levels(level),
    new_level INTEGER NOT NULL REFERENCES levels(level),
    cost_base_units NUMERIC(38,0) NOT NULL CHECK (cost_base_units >= 0),
    operation_id UUID NOT NULL UNIQUE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'completed', 'failed', 'reversed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    CHECK (new_level = previous_level + 1),
    CHECK (new_level <= 400)
);

-- 9. MINING SESSIONS

CREATE TABLE IF NOT EXISTS mining_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    last_claim_at TIMESTAMPTZ,
    status VARCHAR(20) NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CHECK (ended_at IS NULL OR ended_at >= started_at),
    UNIQUE (id, user_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS
    idx_mining_sessions_one_active_per_user
ON mining_sessions(user_id)
WHERE status = 'active';


-- 10. MINING REWARDS

CREATE TABLE IF NOT EXISTS mining_rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    session_id UUID NOT NULL,
    amount_base_units NUMERIC(38,0) NOT NULL
        CHECK (amount_base_units > 0),
    reward_type VARCHAR(30) NOT NULL DEFAULT 'mining',
    operation_id UUID NOT NULL UNIQUE,
    idempotency_key VARCHAR(150) NOT NULL UNIQUE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN (
            'pending',
            'confirmed',
            'rejected',
            'reversed'
        )),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    confirmed_at TIMESTAMPTZ,

    FOREIGN KEY (session_id, user_id)
        REFERENCES mining_sessions(id, user_id)
);
    -- 11. REFERRAL CODES

CREATE TABLE IF NOT EXISTS referral_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id),
    referral_code VARCHAR(50) NOT NULL UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. REFERRAL RELATIONSHIPS

CREATE TABLE IF NOT EXISTS referral_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_user_id UUID NOT NULL REFERENCES users(id),
    referred_user_id UUID NOT NULL UNIQUE REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (referrer_user_id <> referred_user_id)
);

-- 13. REFERRAL REWARDS

CREATE TABLE IF NOT EXISTS referral_rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referral_relationship_id UUID NOT NULL
        REFERENCES referral_relationships(id),
    amount_base_units NUMERIC(38,0) NOT NULL
        CHECK (amount_base_units > 0),
    operation_id UUID NOT NULL UNIQUE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'confirmed', 'rejected', 'reversed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. LEDGER ACCOUNTS

CREATE TABLE IF NOT EXISTS ledger_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    account_code VARCHAR(100) NOT NULL UNIQUE,
    account_type VARCHAR(30) NOT NULL
        CHECK (account_type IN (
            'asset',
            'liability',
            'equity',
            'revenue',
            'expense'
        )),
    asset_code VARCHAR(20) NOT NULL DEFAULT 'VCOIN',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. LEDGER TRANSACTIONS

CREATE TABLE IF NOT EXISTS ledger_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    operation_id UUID NOT NULL UNIQUE,
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'posted', 'reversed', 'failed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    posted_at TIMESTAMPTZ
);

-- 16. LEDGER ENTRIES

CREATE TABLE IF NOT EXISTS ledger_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL
        REFERENCES ledger_transactions(id),
    account_id UUID NOT NULL REFERENCES ledger_accounts(id),
    entry_side VARCHAR(10) NOT NULL
        CHECK (entry_side IN ('debit', 'credit')),
    amount_base_units NUMERIC(38,0) NOT NULL
        CHECK (amount_base_units > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 17. BALANCE SNAPSHOTS

CREATE TABLE IF NOT EXISTS balances (
    user_id UUID NOT NULL REFERENCES users(id),
    asset_code VARCHAR(20) NOT NULL DEFAULT 'VCOIN',
    available_base_units NUMERIC(38,0) NOT NULL DEFAULT 0
        CHECK (available_base_units >= 0),
    reserved_base_units NUMERIC(38,0) NOT NULL DEFAULT 0
        CHECK (reserved_base_units >= 0),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, asset_code)
);
-- 18. BLOCKCHAIN TRANSACTIONS

CREATE TABLE IF NOT EXISTS blockchain_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    network VARCHAR(20) NOT NULL DEFAULT 'TON',
    transaction_hash VARCHAR(200),
    transaction_type VARCHAR(30) NOT NULL,
    amount_base_units NUMERIC(38,0),
    asset_code VARCHAR(20) NOT NULL DEFAULT 'VCOIN',
    status VARCHAR(30) NOT NULL DEFAULT 'pending'
        CHECK (status IN (
            'pending',
            'confirmed',
            'failed',
            'reversed'
        )),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    confirmed_at TIMESTAMPTZ,
    UNIQUE (network, transaction_hash)
);

-- 19. BLOCKCHAIN EVENTS

CREATE TABLE IF NOT EXISTS blockchain_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blockchain_transaction_id UUID
        REFERENCES blockchain_transactions(id),
    network VARCHAR(20) NOT NULL DEFAULT 'TON',
    event_type VARCHAR(100) NOT NULL,
    event_reference VARCHAR(200),
    event_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 20. SYSTEM EVENTS

CREATE TABLE IF NOT EXISTS system_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 21. AUDIT LOGS

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100),
    resource_id UUID,
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- 22. DATABASE INDEXES

CREATE INDEX IF NOT EXISTS idx_user_sessions_user
ON user_sessions(user_id, expires_at);

CREATE INDEX IF NOT EXISTS idx_mining_sessions_user
ON mining_sessions(user_id, status, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_mining_rewards_user
ON mining_rewards(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_level_upgrades_user
ON level_upgrades(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_referral_relationships_referrer
ON referral_relationships(referrer_user_id);

CREATE INDEX IF NOT EXISTS idx_referral_rewards_status
ON referral_rewards(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ledger_entries_transaction
ON ledger_entries(transaction_id);

CREATE INDEX IF NOT EXISTS idx_ledger_entries_account
ON ledger_entries(account_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_blockchain_transactions_status
ON blockchain_transactions(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_blockchain_events_created
ON blockchain_events(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_system_events_created
ON system_events(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created
ON audit_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_users_telegram_user_id
ON users(telegram_user_id);

-- =========================================================
-- END OF V COIN - TON DATABASE SCHEMA
-- Version: 1.1.0
-- =========================================================

COMMIT;
