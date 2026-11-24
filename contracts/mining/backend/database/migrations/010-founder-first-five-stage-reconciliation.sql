BEGIN;

-- Exact five-stage Founder-first custody ledger. This function is called only
-- after a trusted indexer independently verifies Mainnet finality, Master,
-- owner address, and deterministic Jetton-wallet address.

CREATE TABLE IF NOT EXISTS vcoin_initial_receipt_state (
    singleton BOOLEAN PRIMARY KEY DEFAULT TRUE CHECK (singleton),
    max_supply_base_units NUMERIC(38,0) NOT NULL CHECK (max_supply_base_units = 2100000000000000),
    decimals SMALLINT NOT NULL DEFAULT 6 CHECK (decimals = 6),
    founder_wallet TEXT NOT NULL,
    next_stage SMALLINT NOT NULL DEFAULT 1 CHECK (next_stage BETWEEN 1 AND 6),
    confirmed_receipt_base_units NUMERIC(38,0) NOT NULL DEFAULT 0
        CHECK (confirmed_receipt_base_units BETWEEN 0 AND 2100000000000000),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);
INSERT INTO vcoin_initial_receipt_state(singleton,max_supply_base_units,decimals,founder_wallet)
VALUES(TRUE,2100000000000000,6,'UQBh9jVKAypc4TrbFx2jsVB2EI1ONChg22zDputisQjENQOT')
ON CONFLICT(singleton) DO NOTHING;

CREATE TABLE IF NOT EXISTS vcoin_initial_receipt_events (
    id BIGSERIAL PRIMARY KEY,
    stage SMALLINT NOT NULL CHECK (stage BETWEEN 1 AND 5),
    amount_base_units NUMERIC(38,0) NOT NULL CHECK (amount_base_units > 0),
    transaction_hash CHAR(64) NOT NULL UNIQUE CHECK (transaction_hash ~ '^[0-9a-fA-F]{64}$'),
    master_address TEXT NOT NULL,
    recipient_owner_address TEXT NOT NULL,
    confirmed_at TIMESTAMPTZ NOT NULL,
    UNIQUE(stage)
);

CREATE TABLE IF NOT EXISTS vcoin_allocation_transfer_events (
    id BIGSERIAL PRIMARY KEY,
    allocation_role TEXT NOT NULL CHECK (allocation_role IN ('mining_reserve','treasury','liquidity_market','ecosystem_marketing')),
    amount_base_units NUMERIC(38,0) NOT NULL CHECK (amount_base_units > 0),
    transaction_hash CHAR(64) NOT NULL UNIQUE CHECK (transaction_hash ~ '^[0-9a-fA-F]{64}$'),
    source_owner_address TEXT NOT NULL,
    destination_owner_address TEXT NOT NULL,
    confirmed_at TIMESTAMPTZ NOT NULL,
    UNIQUE(allocation_role)
);

CREATE OR REPLACE FUNCTION record_vcoin_receipt_stage(
    p_stage SMALLINT,
    p_amount_base_units NUMERIC(38,0),
    p_transaction_hash TEXT,
    p_master_address TEXT,
    p_recipient_owner_address TEXT,
    p_confirmed_at TIMESTAMPTZ DEFAULT clock_timestamp()
)
RETURNS TEXT LANGUAGE plpgsql AS $$
DECLARE
    v_state vcoin_initial_receipt_state%ROWTYPE;
    v_existing vcoin_initial_receipt_events%ROWTYPE;
    v_expected NUMERIC(38,0);
BEGIN
    IF p_stage IS NULL OR p_stage NOT BETWEEN 1 AND 5 OR p_amount_base_units IS NULL OR p_amount_base_units <= 0
       OR p_transaction_hash IS NULL OR p_transaction_hash !~ '^[0-9a-fA-F]{64}       OR p_master_address IS NULL OR p_recipient_owner_address IS NULL THEN
        RAISE EXCEPTION 'Invalid VCOIN receipt event parameters';
    END IF;
    SELECT * INTO STRICT v_state FROM vcoin_initial_receipt_state WHERE singleton=TRUE FOR UPDATE;
    IF p_recipient_owner_address <> v_state.founder_wallet THEN
        RAISE EXCEPTION 'Initial receipt recipient is not the approved Founder wallet';
    END IF;
    v_expected := CASE p_stage
        WHEN 1 THEN 420000000000000
        WHEN 2 THEN 1050000000000000
        WHEN 3 THEN 210000000000000
        WHEN 4 THEN 210000000000000
        WHEN 5 THEN 210000000000000
    END;
    IF p_amount_base_units <> v_expected THEN
        RAISE EXCEPTION 'Receipt amount does not match the exact approved stage amount';
    END IF;
    SELECT * INTO v_existing FROM vcoin_initial_receipt_events
      WHERE stage=p_stage OR transaction_hash=lower(p_transaction_hash);
    IF FOUND THEN
        IF v_existing.stage=p_stage AND v_existing.transaction_hash=lower(p_transaction_hash)
           AND v_existing.amount_base_units=p_amount_base_units THEN
            RETURN 'duplicate';
        END IF;
        RAISE EXCEPTION 'Receipt stage or transaction hash already recorded with different data';
    END IF;
    IF p_stage <> v_state.next_stage THEN
        RAISE EXCEPTION 'Receipt stages must be confirmed in exact sequence';
    END IF;
    IF v_state.confirmed_receipt_base_units + p_amount_base_units > v_state.max_supply_base_units THEN
        RAISE EXCEPTION 'Founder receipt would exceed the fixed supply cap';
    END IF;
    INSERT INTO vcoin_initial_receipt_events(stage,amount_base_units,transaction_hash,master_address,recipient_owner_address,confirmed_at)
    VALUES(p_stage,p_amount_base_units,lower(p_transaction_hash),p_master_address,p_recipient_owner_address,p_confirmed_at);
    UPDATE vcoin_initial_receipt_state
       SET next_stage=next_stage+1,
           confirmed_receipt_base_units=confirmed_receipt_base_units+p_amount_base_units,
           updated_at=clock_timestamp()
     WHERE singleton=TRUE;
    RETURN 'confirmed';
END;
$$;

CREATE OR REPLACE FUNCTION record_vcoin_allocation_transfer(
    p_role TEXT,
    p_amount_base_units NUMERIC(38,0),
    p_transaction_hash TEXT,
    p_source_owner_address TEXT,
    p_destination_owner_address TEXT,
    p_confirmed_at TIMESTAMPTZ DEFAULT clock_timestamp()
)
RETURNS TEXT LANGUAGE plpgsql AS $$
DECLARE
    v_state vcoin_initial_receipt_state%ROWTYPE;
    v_expected NUMERIC(38,0);
    v_destination TEXT;
    v_existing vcoin_allocation_transfer_events%ROWTYPE;
BEGIN
    IF p_role IS NULL OR p_role NOT IN ('mining_reserve','treasury','liquidity_market','ecosystem_marketing')
       OR p_amount_base_units IS NULL OR p_amount_base_units <= 0
       OR p_transaction_hash IS NULL OR p_transaction_hash !~ '^[0-9a-fA-F]{64}
       OR p_source_owner_address IS NULL OR p_destination_owner_address IS NULL THEN
        RAISE EXCEPTION 'Invalid VCOIN allocation transfer parameters';
    END IF;
    SELECT * INTO STRICT v_state FROM vcoin_initial_receipt_state WHERE singleton=TRUE FOR UPDATE;
    IF v_state.next_stage <> 6 OR v_state.confirmed_receipt_base_units <> v_state.max_supply_base_units THEN
        RAISE EXCEPTION 'All five initial receipt stages must be confirmed before allocation transfers';
    END IF;
    IF p_source_owner_address <> v_state.founder_wallet THEN
        RAISE EXCEPTION 'Allocation transfer source must be the Founder wallet';
    END IF;
    v_expected := CASE p_role
        WHEN 'mining_reserve' THEN 1050000000000000
        WHEN 'treasury' THEN 210000000000000
        WHEN 'liquidity_market' THEN 210000000000000
        WHEN 'ecosystem_marketing' THEN 210000000000000
    END;
    v_destination := CASE p_role
        WHEN 'mining_reserve' THEN 'UQDMEIvklqeBW0Pn74sBHzOpoFGsSWDHE5NxZwfN-1KVsBD0'
        WHEN 'treasury' THEN 'UQBEW5bLGbq0yVDOimgl6fpZbQkdla9Wk5b0tXyx69bmBktQ'
        WHEN 'liquidity_market' THEN 'UQA0_thi3mXZ6jFlHHBfnyjVmXayR3hsGx5PC43_fBOTzXWn'
        WHEN 'ecosystem_marketing' THEN 'UQBQDb73DWWMGnxEr37TsqZSKNvVOC9MMwkvRmNY91LJqLsE'
    END;
    IF p_amount_base_units <> v_expected THEN RAISE EXCEPTION 'Allocation amount does not match approved role amount'; END IF;
    IF p_destination_owner_address <> v_destination THEN RAISE EXCEPTION 'Allocation destination does not match registered wallet'; END IF;
    SELECT * INTO v_existing FROM vcoin_allocation_transfer_events
      WHERE allocation_role=p_role OR transaction_hash=lower(p_transaction_hash);
    IF FOUND THEN
        IF v_existing.allocation_role=p_role AND v_existing.transaction_hash=lower(p_transaction_hash)
           AND v_existing.amount_base_units=p_amount_base_units THEN RETURN 'duplicate'; END IF;
        RAISE EXCEPTION 'Allocation role or transaction hash already recorded with different data';
    END IF;
    INSERT INTO vcoin_allocation_transfer_events(allocation_role,amount_base_units,transaction_hash,source_owner_address,destination_owner_address,confirmed_at)
    VALUES(p_role,p_amount_base_units,lower(p_transaction_hash),p_source_owner_address,p_destination_owner_address,p_confirmed_at);
    RETURN 'confirmed';
END;
$$;

DROP VIEW IF EXISTS vcoin_founder_first_reconciliation;
CREATE VIEW vcoin_founder_first_reconciliation AS
SELECT s.max_supply_base_units,
       s.confirmed_receipt_base_units,
       s.next_stage,
       (SELECT COUNT(*) FROM vcoin_initial_receipt_events) AS confirmed_receipt_count,
       (SELECT COALESCE(SUM(amount_base_units),0) FROM vcoin_allocation_transfer_events) AS founder_signed_distributions_base_units,
       (SELECT COUNT(*) FROM vcoin_allocation_transfer_events) AS confirmed_distribution_count,
       s.founder_wallet,
       (s.next_stage=6 AND s.confirmed_receipt_base_units=s.max_supply_base_units) AS full_supply_receipt_confirmed
FROM vcoin_initial_receipt_state s WHERE s.singleton=TRUE;

COMMIT;

       OR p_master_address IS NULL OR p_recipient_owner_address IS NULL THEN
        RAISE EXCEPTION 'Invalid VCOIN receipt event parameters';
    END IF;
    SELECT * INTO STRICT v_state FROM vcoin_initial_receipt_state WHERE singleton=TRUE FOR UPDATE;
    IF p_recipient_owner_address <> v_state.founder_wallet THEN
        RAISE EXCEPTION 'Initial receipt recipient is not the approved Founder wallet';
    END IF;
    v_expected := CASE p_stage
        WHEN 1 THEN 420000000000000
        WHEN 2 THEN 1050000000000000
        WHEN 3 THEN 210000000000000
        WHEN 4 THEN 210000000000000
        WHEN 5 THEN 210000000000000
    END;
    IF p_amount_base_units <> v_expected THEN
        RAISE EXCEPTION 'Receipt amount does not match the exact approved stage amount';
    END IF;
    SELECT * INTO v_existing FROM vcoin_initial_receipt_events
      WHERE stage=p_stage OR transaction_hash=p_transaction_hash;
    IF FOUND THEN
        IF v_existing.stage=p_stage AND v_existing.transaction_hash=lower(p_transaction_hash)
           AND v_existing.amount_base_units=p_amount_base_units THEN
            RETURN 'duplicate';
        END IF;
        RAISE EXCEPTION 'Receipt stage or transaction hash already recorded with different data';
    END IF;
    IF p_stage <> v_state.next_stage THEN
        RAISE EXCEPTION 'Receipt stages must be confirmed in exact sequence';
    END IF;
    IF v_state.confirmed_receipt_base_units + p_amount_base_units > v_state.max_supply_base_units THEN
        RAISE EXCEPTION 'Founder receipt would exceed the fixed supply cap';
    END IF;
    INSERT INTO vcoin_initial_receipt_events(stage,amount_base_units,transaction_hash,master_address,recipient_owner_address,confirmed_at)
    VALUES(p_stage,p_amount_base_units,lower(p_transaction_hash),p_master_address,p_recipient_owner_address,p_confirmed_at);
    UPDATE vcoin_initial_receipt_state
       SET next_stage=next_stage+1,
           confirmed_receipt_base_units=confirmed_receipt_base_units+p_amount_base_units,
           updated_at=clock_timestamp()
     WHERE singleton=TRUE;
    RETURN 'confirmed';
END;
$$;

CREATE OR REPLACE FUNCTION record_vcoin_allocation_transfer(
    p_role TEXT,
    p_amount_base_units NUMERIC(38,0),
    p_transaction_hash TEXT,
    p_source_owner_address TEXT,
    p_destination_owner_address TEXT,
    p_confirmed_at TIMESTAMPTZ DEFAULT clock_timestamp()
)
RETURNS TEXT LANGUAGE plpgsql AS $$
DECLARE
    v_state vcoin_initial_receipt_state%ROWTYPE;
    v_expected NUMERIC(38,0);
    v_destination TEXT;
    v_existing vcoin_allocation_transfer_events%ROWTYPE;
BEGIN
    IF p_role NOT IN ('mining_reserve','treasury','liquidity_market','ecosystem_marketing')
       OR p_transaction_hash !~ '^[0-9a-fA-F]{64}$'
       OR p_source_owner_address IS NULL OR p_destination_owner_address IS NULL THEN
        RAISE EXCEPTION 'Invalid VCOIN allocation transfer parameters';
    END IF;
    SELECT * INTO STRICT v_state FROM vcoin_initial_receipt_state WHERE singleton=TRUE FOR UPDATE;
    IF v_state.next_stage <> 6 OR v_state.confirmed_receipt_base_units <> v_state.max_supply_base_units THEN
        RAISE EXCEPTION 'All five initial receipt stages must be confirmed before allocation transfers';
    END IF;
    IF p_source_owner_address <> v_state.founder_wallet THEN
        RAISE EXCEPTION 'Allocation transfer source must be the Founder wallet';
    END IF;
    v_expected := CASE p_role
        WHEN 'mining_reserve' THEN 1050000000000000
        WHEN 'treasury' THEN 210000000000000
        WHEN 'liquidity_market' THEN 210000000000000
        WHEN 'ecosystem_marketing' THEN 210000000000000
    END;
    v_destination := CASE p_role
        WHEN 'mining_reserve' THEN 'UQDMEIvklqeBW0Pn74sBHzOpoFGsSWDHE5NxZwfN-1KVsBD0'
        WHEN 'treasury' THEN 'UQBEW5bLGbq0yVDOimgl6fpZbQkdla9Wk5b0tXyx69bmBktQ'
        WHEN 'liquidity_market' THEN 'UQA0_thi3mXZ6jFlHHBfnyjVmXayR3hsGx5PC43_fBOTzXWn'
        WHEN 'ecosystem_marketing' THEN 'UQBQDb73DWWMGnxEr37TsqZSKNvVOC9MMwkvRmNY91LJqLsE'
    END;
    IF p_amount_base_units <> v_expected THEN RAISE EXCEPTION 'Allocation amount does not match approved role amount'; END IF;
    IF p_destination_owner_address <> v_destination THEN RAISE EXCEPTION 'Allocation destination does not match registered wallet'; END IF;
    SELECT * INTO v_existing FROM vcoin_allocation_transfer_events
      WHERE allocation_role=p_role OR transaction_hash=p_transaction_hash;
    IF FOUND THEN
        IF v_existing.allocation_role=p_role AND v_existing.transaction_hash=lower(p_transaction_hash)
           AND v_existing.amount_base_units=p_amount_base_units THEN RETURN 'duplicate'; END IF;
        RAISE EXCEPTION 'Allocation role or transaction hash already recorded with different data';
    END IF;
    INSERT INTO vcoin_allocation_transfer_events(allocation_role,amount_base_units,transaction_hash,source_owner_address,destination_owner_address,confirmed_at)
    VALUES(p_role,p_amount_base_units,lower(p_transaction_hash),p_source_owner_address,p_destination_owner_address,p_confirmed_at);
    RETURN 'confirmed';
END;
$$;

CREATE OR REPLACE VIEW vcoin_founder_first_reconciliation AS
SELECT s.max_supply_base_units,
       s.confirmed_receipt_base_units,
       s.next_stage,
       (SELECT COUNT(*) FROM vcoin_initial_receipt_events) AS confirmed_receipt_count,
       (SELECT COALESCE(SUM(amount_base_units),0) FROM vcoin_allocation_transfer_events) AS founder_signed_distributions_base_units,
       (SELECT COUNT(*) FROM vcoin_allocation_transfer_events) AS confirmed_distribution_count,
       s.founder_wallet,
       (s.next_stage=6 AND s.confirmed_receipt_base_units=s.max_supply_base_units) AS full_supply_receipt_confirmed
FROM vcoin_initial_receipt_state s WHERE s.singleton=TRUE;

COMMIT;

       OR p_source_owner_address IS NULL OR p_destination_owner_address IS NULL THEN
        RAISE EXCEPTION 'Invalid VCOIN allocation transfer parameters';
    END IF;
    SELECT * INTO STRICT v_state FROM vcoin_initial_receipt_state WHERE singleton=TRUE FOR UPDATE;
    IF v_state.next_stage <> 6 OR v_state.confirmed_receipt_base_units <> v_state.max_supply_base_units THEN
        RAISE EXCEPTION 'All five initial receipt stages must be confirmed before allocation transfers';
    END IF;
    IF p_source_owner_address <> v_state.founder_wallet THEN
        RAISE EXCEPTION 'Allocation transfer source must be the Founder wallet';
    END IF;
    v_expected := CASE p_role
        WHEN 'mining_reserve' THEN 1050000000000000
        WHEN 'treasury' THEN 210000000000000
        WHEN 'liquidity_market' THEN 210000000000000
        WHEN 'ecosystem_marketing' THEN 210000000000000
    END;
    v_destination := CASE p_role
        WHEN 'mining_reserve' THEN 'UQDMEIvklqeBW0Pn74sBHzOpoFGsSWDHE5NxZwfN-1KVsBD0'
        WHEN 'treasury' THEN 'UQBEW5bLGbq0yVDOimgl6fpZbQkdla9Wk5b0tXyx69bmBktQ'
        WHEN 'liquidity_market' THEN 'UQA0_thi3mXZ6jFlHHBfnyjVmXayR3hsGx5PC43_fBOTzXWn'
        WHEN 'ecosystem_marketing' THEN 'UQBQDb73DWWMGnxEr37TsqZSKNvVOC9MMwkvRmNY91LJqLsE'
    END;
    IF p_amount_base_units <> v_expected THEN RAISE EXCEPTION 'Allocation amount does not match approved role amount'; END IF;
    IF p_destination_owner_address <> v_destination THEN RAISE EXCEPTION 'Allocation destination does not match registered wallet'; END IF;
    SELECT * INTO v_existing FROM vcoin_allocation_transfer_events
      WHERE allocation_role=p_role OR transaction_hash=p_transaction_hash;
    IF FOUND THEN
        IF v_existing.allocation_role=p_role AND v_existing.transaction_hash=lower(p_transaction_hash)
           AND v_existing.amount_base_units=p_amount_base_units THEN RETURN 'duplicate'; END IF;
        RAISE EXCEPTION 'Allocation role or transaction hash already recorded with different data';
    END IF;
    INSERT INTO vcoin_allocation_transfer_events(allocation_role,amount_base_units,transaction_hash,source_owner_address,destination_owner_address,confirmed_at)
    VALUES(p_role,p_amount_base_units,lower(p_transaction_hash),p_source_owner_address,p_destination_owner_address,p_confirmed_at);
    RETURN 'confirmed';
END;
$$;

CREATE OR REPLACE VIEW vcoin_founder_first_reconciliation AS
SELECT s.max_supply_base_units,
       s.confirmed_receipt_base_units,
       s.next_stage,
       (SELECT COUNT(*) FROM vcoin_initial_receipt_events) AS confirmed_receipt_count,
       (SELECT COALESCE(SUM(amount_base_units),0) FROM vcoin_allocation_transfer_events) AS founder_signed_distributions_base_units,
       (SELECT COUNT(*) FROM vcoin_allocation_transfer_events) AS confirmed_distribution_count,
       s.founder_wallet,
       (s.next_stage=6 AND s.confirmed_receipt_base_units=s.max_supply_base_units) AS full_supply_receipt_confirmed
FROM vcoin_initial_receipt_state s WHERE s.singleton=TRUE;

COMMIT;

       OR p_master_address IS NULL OR p_recipient_owner_address IS NULL THEN
        RAISE EXCEPTION 'Invalid VCOIN receipt event parameters';
    END IF;
    SELECT * INTO STRICT v_state FROM vcoin_initial_receipt_state WHERE singleton=TRUE FOR UPDATE;
    IF p_recipient_owner_address <> v_state.founder_wallet THEN
        RAISE EXCEPTION 'Initial receipt recipient is not the approved Founder wallet';
    END IF;
    v_expected := CASE p_stage
        WHEN 1 THEN 420000000000000
        WHEN 2 THEN 1050000000000000
        WHEN 3 THEN 210000000000000
        WHEN 4 THEN 210000000000000
        WHEN 5 THEN 210000000000000
    END;
    IF p_amount_base_units <> v_expected THEN
        RAISE EXCEPTION 'Receipt amount does not match the exact approved stage amount';
    END IF;
    SELECT * INTO v_existing FROM vcoin_initial_receipt_events
      WHERE stage=p_stage OR transaction_hash=p_transaction_hash;
    IF FOUND THEN
        IF v_existing.stage=p_stage AND v_existing.transaction_hash=lower(p_transaction_hash)
           AND v_existing.amount_base_units=p_amount_base_units THEN
            RETURN 'duplicate';
        END IF;
        RAISE EXCEPTION 'Receipt stage or transaction hash already recorded with different data';
    END IF;
    IF p_stage <> v_state.next_stage THEN
        RAISE EXCEPTION 'Receipt stages must be confirmed in exact sequence';
    END IF;
    IF v_state.confirmed_receipt_base_units + p_amount_base_units > v_state.max_supply_base_units THEN
        RAISE EXCEPTION 'Founder receipt would exceed the fixed supply cap';
    END IF;
    INSERT INTO vcoin_initial_receipt_events(stage,amount_base_units,transaction_hash,master_address,recipient_owner_address,confirmed_at)
    VALUES(p_stage,p_amount_base_units,lower(p_transaction_hash),p_master_address,p_recipient_owner_address,p_confirmed_at);
    UPDATE vcoin_initial_receipt_state
       SET next_stage=next_stage+1,
           confirmed_receipt_base_units=confirmed_receipt_base_units+p_amount_base_units,
           updated_at=clock_timestamp()
     WHERE singleton=TRUE;
    RETURN 'confirmed';
END;
$$;

CREATE OR REPLACE FUNCTION record_vcoin_allocation_transfer(
    p_role TEXT,
    p_amount_base_units NUMERIC(38,0),
    p_transaction_hash TEXT,
    p_source_owner_address TEXT,
    p_destination_owner_address TEXT,
    p_confirmed_at TIMESTAMPTZ DEFAULT clock_timestamp()
)
RETURNS TEXT LANGUAGE plpgsql AS $$
DECLARE
    v_state vcoin_initial_receipt_state%ROWTYPE;
    v_expected NUMERIC(38,0);
    v_destination TEXT;
    v_existing vcoin_allocation_transfer_events%ROWTYPE;
BEGIN
    IF p_role NOT IN ('mining_reserve','treasury','liquidity_market','ecosystem_marketing')
       OR p_transaction_hash !~ '^[0-9a-fA-F]{64}$'
       OR p_source_owner_address IS NULL OR p_destination_owner_address IS NULL THEN
        RAISE EXCEPTION 'Invalid VCOIN allocation transfer parameters';
    END IF;
    SELECT * INTO STRICT v_state FROM vcoin_initial_receipt_state WHERE singleton=TRUE FOR UPDATE;
    IF v_state.next_stage <> 6 OR v_state.confirmed_receipt_base_units <> v_state.max_supply_base_units THEN
        RAISE EXCEPTION 'All five initial receipt stages must be confirmed before allocation transfers';
    END IF;
    IF p_source_owner_address <> v_state.founder_wallet THEN
        RAISE EXCEPTION 'Allocation transfer source must be the Founder wallet';
    END IF;
    v_expected := CASE p_role
        WHEN 'mining_reserve' THEN 1050000000000000
        WHEN 'treasury' THEN 210000000000000
        WHEN 'liquidity_market' THEN 210000000000000
        WHEN 'ecosystem_marketing' THEN 210000000000000
    END;
    v_destination := CASE p_role
        WHEN 'mining_reserve' THEN 'UQDMEIvklqeBW0Pn74sBHzOpoFGsSWDHE5NxZwfN-1KVsBD0'
        WHEN 'treasury' THEN 'UQBEW5bLGbq0yVDOimgl6fpZbQkdla9Wk5b0tXyx69bmBktQ'
        WHEN 'liquidity_market' THEN 'UQA0_thi3mXZ6jFlHHBfnyjVmXayR3hsGx5PC43_fBOTzXWn'
        WHEN 'ecosystem_marketing' THEN 'UQBQDb73DWWMGnxEr37TsqZSKNvVOC9MMwkvRmNY91LJqLsE'
    END;
    IF p_amount_base_units <> v_expected THEN RAISE EXCEPTION 'Allocation amount does not match approved role amount'; END IF;
    IF p_destination_owner_address <> v_destination THEN RAISE EXCEPTION 'Allocation destination does not match registered wallet'; END IF;
    SELECT * INTO v_existing FROM vcoin_allocation_transfer_events
      WHERE allocation_role=p_role OR transaction_hash=p_transaction_hash;
    IF FOUND THEN
        IF v_existing.allocation_role=p_role AND v_existing.transaction_hash=lower(p_transaction_hash)
           AND v_existing.amount_base_units=p_amount_base_units THEN RETURN 'duplicate'; END IF;
        RAISE EXCEPTION 'Allocation role or transaction hash already recorded with different data';
    END IF;
    INSERT INTO vcoin_allocation_transfer_events(allocation_role,amount_base_units,transaction_hash,source_owner_address,destination_owner_address,confirmed_at)
    VALUES(p_role,p_amount_base_units,lower(p_transaction_hash),p_source_owner_address,p_destination_owner_address,p_confirmed_at);
    RETURN 'confirmed';
END;
$$;

CREATE OR REPLACE VIEW vcoin_founder_first_reconciliation AS
SELECT s.max_supply_base_units,
       s.confirmed_receipt_base_units,
       s.next_stage,
       (SELECT COUNT(*) FROM vcoin_initial_receipt_events) AS confirmed_receipt_count,
       (SELECT COALESCE(SUM(amount_base_units),0) FROM vcoin_allocation_transfer_events) AS founder_signed_distributions_base_units,
       (SELECT COUNT(*) FROM vcoin_allocation_transfer_events) AS confirmed_distribution_count,
       s.founder_wallet,
       (s.next_stage=6 AND s.confirmed_receipt_base_units=s.max_supply_base_units) AS full_supply_receipt_confirmed
FROM vcoin_initial_receipt_state s WHERE s.singleton=TRUE;

COMMIT;

       OR p_master_address IS NULL OR p_recipient_owner_address IS NULL THEN
        RAISE EXCEPTION 'Invalid VCOIN receipt event parameters';
    END IF;
    SELECT * INTO STRICT v_state FROM vcoin_initial_receipt_state WHERE singleton=TRUE FOR UPDATE;
    IF p_recipient_owner_address <> v_state.founder_wallet THEN
        RAISE EXCEPTION 'Initial receipt recipient is not the approved Founder wallet';
    END IF;
    v_expected := CASE p_stage
        WHEN 1 THEN 420000000000000
        WHEN 2 THEN 1050000000000000
        WHEN 3 THEN 210000000000000
        WHEN 4 THEN 210000000000000
        WHEN 5 THEN 210000000000000
    END;
    IF p_amount_base_units <> v_expected THEN
        RAISE EXCEPTION 'Receipt amount does not match the exact approved stage amount';
    END IF;
    SELECT * INTO v_existing FROM vcoin_initial_receipt_events
      WHERE stage=p_stage OR transaction_hash=lower(p_transaction_hash);
    IF FOUND THEN
        IF v_existing.stage=p_stage AND v_existing.transaction_hash=lower(p_transaction_hash)
           AND v_existing.amount_base_units=p_amount_base_units THEN
            RETURN 'duplicate';
        END IF;
        RAISE EXCEPTION 'Receipt stage or transaction hash already recorded with different data';
    END IF;
    IF p_stage <> v_state.next_stage THEN
        RAISE EXCEPTION 'Receipt stages must be confirmed in exact sequence';
    END IF;
    IF v_state.confirmed_receipt_base_units + p_amount_base_units > v_state.max_supply_base_units THEN
        RAISE EXCEPTION 'Founder receipt would exceed the fixed supply cap';
    END IF;
    INSERT INTO vcoin_initial_receipt_events(stage,amount_base_units,transaction_hash,master_address,recipient_owner_address,confirmed_at)
    VALUES(p_stage,p_amount_base_units,lower(p_transaction_hash),p_master_address,p_recipient_owner_address,p_confirmed_at);
    UPDATE vcoin_initial_receipt_state
       SET next_stage=next_stage+1,
           confirmed_receipt_base_units=confirmed_receipt_base_units+p_amount_base_units,
           updated_at=clock_timestamp()
     WHERE singleton=TRUE;
    RETURN 'confirmed';
END;
$$;

CREATE OR REPLACE FUNCTION record_vcoin_allocation_transfer(
    p_role TEXT,
    p_amount_base_units NUMERIC(38,0),
    p_transaction_hash TEXT,
    p_source_owner_address TEXT,
    p_destination_owner_address TEXT,
    p_confirmed_at TIMESTAMPTZ DEFAULT clock_timestamp()
)
RETURNS TEXT LANGUAGE plpgsql AS $$
DECLARE
    v_state vcoin_initial_receipt_state%ROWTYPE;
    v_expected NUMERIC(38,0);
    v_destination TEXT;
    v_existing vcoin_allocation_transfer_events%ROWTYPE;
BEGIN
    IF p_role IS NULL OR p_role NOT IN ('mining_reserve','treasury','liquidity_market','ecosystem_marketing')
       OR p_amount_base_units IS NULL OR p_amount_base_units <= 0
       OR p_transaction_hash IS NULL OR p_transaction_hash !~ '^[0-9a-fA-F]{64}
       OR p_source_owner_address IS NULL OR p_destination_owner_address IS NULL THEN
        RAISE EXCEPTION 'Invalid VCOIN allocation transfer parameters';
    END IF;
    SELECT * INTO STRICT v_state FROM vcoin_initial_receipt_state WHERE singleton=TRUE FOR UPDATE;
    IF v_state.next_stage <> 6 OR v_state.confirmed_receipt_base_units <> v_state.max_supply_base_units THEN
        RAISE EXCEPTION 'All five initial receipt stages must be confirmed before allocation transfers';
    END IF;
    IF p_source_owner_address <> v_state.founder_wallet THEN
        RAISE EXCEPTION 'Allocation transfer source must be the Founder wallet';
    END IF;
    v_expected := CASE p_role
        WHEN 'mining_reserve' THEN 1050000000000000
        WHEN 'treasury' THEN 210000000000000
        WHEN 'liquidity_market' THEN 210000000000000
        WHEN 'ecosystem_marketing' THEN 210000000000000
    END;
    v_destination := CASE p_role
        WHEN 'mining_reserve' THEN 'UQDMEIvklqeBW0Pn74sBHzOpoFGsSWDHE5NxZwfN-1KVsBD0'
        WHEN 'treasury' THEN 'UQBEW5bLGbq0yVDOimgl6fpZbQkdla9Wk5b0tXyx69bmBktQ'
        WHEN 'liquidity_market' THEN 'UQA0_thi3mXZ6jFlHHBfnyjVmXayR3hsGx5PC43_fBOTzXWn'
        WHEN 'ecosystem_marketing' THEN 'UQBQDb73DWWMGnxEr37TsqZSKNvVOC9MMwkvRmNY91LJqLsE'
    END;
    IF p_amount_base_units <> v_expected THEN RAISE EXCEPTION 'Allocation amount does not match approved role amount'; END IF;
    IF p_destination_owner_address <> v_destination THEN RAISE EXCEPTION 'Allocation destination does not match registered wallet'; END IF;
    SELECT * INTO v_existing FROM vcoin_allocation_transfer_events
      WHERE allocation_role=p_role OR transaction_hash=lower(p_transaction_hash);
    IF FOUND THEN
        IF v_existing.allocation_role=p_role AND v_existing.transaction_hash=lower(p_transaction_hash)
           AND v_existing.amount_base_units=p_amount_base_units THEN RETURN 'duplicate'; END IF;
        RAISE EXCEPTION 'Allocation role or transaction hash already recorded with different data';
    END IF;
    INSERT INTO vcoin_allocation_transfer_events(allocation_role,amount_base_units,transaction_hash,source_owner_address,destination_owner_address,confirmed_at)
    VALUES(p_role,p_amount_base_units,lower(p_transaction_hash),p_source_owner_address,p_destination_owner_address,p_confirmed_at);
    RETURN 'confirmed';
END;
$$;

DROP VIEW IF EXISTS vcoin_founder_first_reconciliation;
CREATE VIEW vcoin_founder_first_reconciliation AS
SELECT s.max_supply_base_units,
       s.confirmed_receipt_base_units,
       s.next_stage,
       (SELECT COUNT(*) FROM vcoin_initial_receipt_events) AS confirmed_receipt_count,
       (SELECT COALESCE(SUM(amount_base_units),0) FROM vcoin_allocation_transfer_events) AS founder_signed_distributions_base_units,
       (SELECT COUNT(*) FROM vcoin_allocation_transfer_events) AS confirmed_distribution_count,
       s.founder_wallet,
       (s.next_stage=6 AND s.confirmed_receipt_base_units=s.max_supply_base_units) AS full_supply_receipt_confirmed
FROM vcoin_initial_receipt_state s WHERE s.singleton=TRUE;

COMMIT;

       OR p_master_address IS NULL OR p_recipient_owner_address IS NULL THEN
        RAISE EXCEPTION 'Invalid VCOIN receipt event parameters';
    END IF;
    SELECT * INTO STRICT v_state FROM vcoin_initial_receipt_state WHERE singleton=TRUE FOR UPDATE;
    IF p_recipient_owner_address <> v_state.founder_wallet THEN
        RAISE EXCEPTION 'Initial receipt recipient is not the approved Founder wallet';
    END IF;
    v_expected := CASE p_stage
        WHEN 1 THEN 420000000000000
        WHEN 2 THEN 1050000000000000
        WHEN 3 THEN 210000000000000
        WHEN 4 THEN 210000000000000
        WHEN 5 THEN 210000000000000
    END;
    IF p_amount_base_units <> v_expected THEN
        RAISE EXCEPTION 'Receipt amount does not match the exact approved stage amount';
    END IF;
    SELECT * INTO v_existing FROM vcoin_initial_receipt_events
      WHERE stage=p_stage OR transaction_hash=p_transaction_hash;
    IF FOUND THEN
        IF v_existing.stage=p_stage AND v_existing.transaction_hash=lower(p_transaction_hash)
           AND v_existing.amount_base_units=p_amount_base_units THEN
            RETURN 'duplicate';
        END IF;
        RAISE EXCEPTION 'Receipt stage or transaction hash already recorded with different data';
    END IF;
    IF p_stage <> v_state.next_stage THEN
        RAISE EXCEPTION 'Receipt stages must be confirmed in exact sequence';
    END IF;
    IF v_state.confirmed_receipt_base_units + p_amount_base_units > v_state.max_supply_base_units THEN
        RAISE EXCEPTION 'Founder receipt would exceed the fixed supply cap';
    END IF;
    INSERT INTO vcoin_initial_receipt_events(stage,amount_base_units,transaction_hash,master_address,recipient_owner_address,confirmed_at)
    VALUES(p_stage,p_amount_base_units,lower(p_transaction_hash),p_master_address,p_recipient_owner_address,p_confirmed_at);
    UPDATE vcoin_initial_receipt_state
       SET next_stage=next_stage+1,
           confirmed_receipt_base_units=confirmed_receipt_base_units+p_amount_base_units,
           updated_at=clock_timestamp()
     WHERE singleton=TRUE;
    RETURN 'confirmed';
END;
$$;

CREATE OR REPLACE FUNCTION record_vcoin_allocation_transfer(
    p_role TEXT,
    p_amount_base_units NUMERIC(38,0),
    p_transaction_hash TEXT,
    p_source_owner_address TEXT,
    p_destination_owner_address TEXT,
    p_confirmed_at TIMESTAMPTZ DEFAULT clock_timestamp()
)
RETURNS TEXT LANGUAGE plpgsql AS $$
DECLARE
    v_state vcoin_initial_receipt_state%ROWTYPE;
    v_expected NUMERIC(38,0);
    v_destination TEXT;
    v_existing vcoin_allocation_transfer_events%ROWTYPE;
BEGIN
    IF p_role NOT IN ('mining_reserve','treasury','liquidity_market','ecosystem_marketing')
       OR p_transaction_hash !~ '^[0-9a-fA-F]{64}$'
       OR p_source_owner_address IS NULL OR p_destination_owner_address IS NULL THEN
        RAISE EXCEPTION 'Invalid VCOIN allocation transfer parameters';
    END IF;
    SELECT * INTO STRICT v_state FROM vcoin_initial_receipt_state WHERE singleton=TRUE FOR UPDATE;
    IF v_state.next_stage <> 6 OR v_state.confirmed_receipt_base_units <> v_state.max_supply_base_units THEN
        RAISE EXCEPTION 'All five initial receipt stages must be confirmed before allocation transfers';
    END IF;
    IF p_source_owner_address <> v_state.founder_wallet THEN
        RAISE EXCEPTION 'Allocation transfer source must be the Founder wallet';
    END IF;
    v_expected := CASE p_role
        WHEN 'mining_reserve' THEN 1050000000000000
        WHEN 'treasury' THEN 210000000000000
        WHEN 'liquidity_market' THEN 210000000000000
        WHEN 'ecosystem_marketing' THEN 210000000000000
    END;
    v_destination := CASE p_role
        WHEN 'mining_reserve' THEN 'UQDMEIvklqeBW0Pn74sBHzOpoFGsSWDHE5NxZwfN-1KVsBD0'
        WHEN 'treasury' THEN 'UQBEW5bLGbq0yVDOimgl6fpZbQkdla9Wk5b0tXyx69bmBktQ'
        WHEN 'liquidity_market' THEN 'UQA0_thi3mXZ6jFlHHBfnyjVmXayR3hsGx5PC43_fBOTzXWn'
        WHEN 'ecosystem_marketing' THEN 'UQBQDb73DWWMGnxEr37TsqZSKNvVOC9MMwkvRmNY91LJqLsE'
    END;
    IF p_amount_base_units <> v_expected THEN RAISE EXCEPTION 'Allocation amount does not match approved role amount'; END IF;
    IF p_destination_owner_address <> v_destination THEN RAISE EXCEPTION 'Allocation destination does not match registered wallet'; END IF;
    SELECT * INTO v_existing FROM vcoin_allocation_transfer_events
      WHERE allocation_role=p_role OR transaction_hash=p_transaction_hash;
    IF FOUND THEN
        IF v_existing.allocation_role=p_role AND v_existing.transaction_hash=lower(p_transaction_hash)
           AND v_existing.amount_base_units=p_amount_base_units THEN RETURN 'duplicate'; END IF;
        RAISE EXCEPTION 'Allocation role or transaction hash already recorded with different data';
    END IF;
    INSERT INTO vcoin_allocation_transfer_events(allocation_role,amount_base_units,transaction_hash,source_owner_address,destination_owner_address,confirmed_at)
    VALUES(p_role,p_amount_base_units,lower(p_transaction_hash),p_source_owner_address,p_destination_owner_address,p_confirmed_at);
    RETURN 'confirmed';
END;
$$;

CREATE OR REPLACE VIEW vcoin_founder_first_reconciliation AS
SELECT s.max_supply_base_units,
       s.confirmed_receipt_base_units,
       s.next_stage,
       (SELECT COUNT(*) FROM vcoin_initial_receipt_events) AS confirmed_receipt_count,
       (SELECT COALESCE(SUM(amount_base_units),0) FROM vcoin_allocation_transfer_events) AS founder_signed_distributions_base_units,
       (SELECT COUNT(*) FROM vcoin_allocation_transfer_events) AS confirmed_distribution_count,
       s.founder_wallet,
       (s.next_stage=6 AND s.confirmed_receipt_base_units=s.max_supply_base_units) AS full_supply_receipt_confirmed
FROM vcoin_initial_receipt_state s WHERE s.singleton=TRUE;

COMMIT;

       OR p_source_owner_address IS NULL OR p_destination_owner_address IS NULL THEN
        RAISE EXCEPTION 'Invalid VCOIN allocation transfer parameters';
    END IF;
    SELECT * INTO STRICT v_state FROM vcoin_initial_receipt_state WHERE singleton=TRUE FOR UPDATE;
    IF v_state.next_stage <> 6 OR v_state.confirmed_receipt_base_units <> v_state.max_supply_base_units THEN
        RAISE EXCEPTION 'All five initial receipt stages must be confirmed before allocation transfers';
    END IF;
    IF p_source_owner_address <> v_state.founder_wallet THEN
        RAISE EXCEPTION 'Allocation transfer source must be the Founder wallet';
    END IF;
    v_expected := CASE p_role
        WHEN 'mining_reserve' THEN 1050000000000000
        WHEN 'treasury' THEN 210000000000000
        WHEN 'liquidity_market' THEN 210000000000000
        WHEN 'ecosystem_marketing' THEN 210000000000000
    END;
    v_destination := CASE p_role
        WHEN 'mining_reserve' THEN 'UQDMEIvklqeBW0Pn74sBHzOpoFGsSWDHE5NxZwfN-1KVsBD0'
        WHEN 'treasury' THEN 'UQBEW5bLGbq0yVDOimgl6fpZbQkdla9Wk5b0tXyx69bmBktQ'
        WHEN 'liquidity_market' THEN 'UQA0_thi3mXZ6jFlHHBfnyjVmXayR3hsGx5PC43_fBOTzXWn'
        WHEN 'ecosystem_marketing' THEN 'UQBQDb73DWWMGnxEr37TsqZSKNvVOC9MMwkvRmNY91LJqLsE'
    END;
    IF p_amount_base_units <> v_expected THEN RAISE EXCEPTION 'Allocation amount does not match approved role amount'; END IF;
    IF p_destination_owner_address <> v_destination THEN RAISE EXCEPTION 'Allocation destination does not match registered wallet'; END IF;
    SELECT * INTO v_existing FROM vcoin_allocation_transfer_events
      WHERE allocation_role=p_role OR transaction_hash=p_transaction_hash;
    IF FOUND THEN
        IF v_existing.allocation_role=p_role AND v_existing.transaction_hash=lower(p_transaction_hash)
           AND v_existing.amount_base_units=p_amount_base_units THEN RETURN 'duplicate'; END IF;
        RAISE EXCEPTION 'Allocation role or transaction hash already recorded with different data';
    END IF;
    INSERT INTO vcoin_allocation_transfer_events(allocation_role,amount_base_units,transaction_hash,source_owner_address,destination_owner_address,confirmed_at)
    VALUES(p_role,p_amount_base_units,lower(p_transaction_hash),p_source_owner_address,p_destination_owner_address,p_confirmed_at);
    RETURN 'confirmed';
END;
$$;

CREATE OR REPLACE VIEW vcoin_founder_first_reconciliation AS
SELECT s.max_supply_base_units,
       s.confirmed_receipt_base_units,
       s.next_stage,
       (SELECT COUNT(*) FROM vcoin_initial_receipt_events) AS confirmed_receipt_count,
       (SELECT COALESCE(SUM(amount_base_units),0) FROM vcoin_allocation_transfer_events) AS founder_signed_distributions_base_units,
       (SELECT COUNT(*) FROM vcoin_allocation_transfer_events) AS confirmed_distribution_count,
       s.founder_wallet,
       (s.next_stage=6 AND s.confirmed_receipt_base_units=s.max_supply_base_units) AS full_supply_receipt_confirmed
FROM vcoin_initial_receipt_state s WHERE s.singleton=TRUE;

COMMIT;

       OR p_master_address IS NULL OR p_recipient_owner_address IS NULL THEN
        RAISE EXCEPTION 'Invalid VCOIN receipt event parameters';
    END IF;
    SELECT * INTO STRICT v_state FROM vcoin_initial_receipt_state WHERE singleton=TRUE FOR UPDATE;
    IF p_recipient_owner_address <> v_state.founder_wallet THEN
        RAISE EXCEPTION 'Initial receipt recipient is not the approved Founder wallet';
    END IF;
    v_expected := CASE p_stage
        WHEN 1 THEN 420000000000000
        WHEN 2 THEN 1050000000000000
        WHEN 3 THEN 210000000000000
        WHEN 4 THEN 210000000000000
        WHEN 5 THEN 210000000000000
    END;
    IF p_amount_base_units <> v_expected THEN
        RAISE EXCEPTION 'Receipt amount does not match the exact approved stage amount';
    END IF;
    SELECT * INTO v_existing FROM vcoin_initial_receipt_events
      WHERE stage=p_stage OR transaction_hash=p_transaction_hash;
    IF FOUND THEN
        IF v_existing.stage=p_stage AND v_existing.transaction_hash=lower(p_transaction_hash)
           AND v_existing.amount_base_units=p_amount_base_units THEN
            RETURN 'duplicate';
        END IF;
        RAISE EXCEPTION 'Receipt stage or transaction hash already recorded with different data';
    END IF;
    IF p_stage <> v_state.next_stage THEN
        RAISE EXCEPTION 'Receipt stages must be confirmed in exact sequence';
    END IF;
    IF v_state.confirmed_receipt_base_units + p_amount_base_units > v_state.max_supply_base_units THEN
        RAISE EXCEPTION 'Founder receipt would exceed the fixed supply cap';
    END IF;
    INSERT INTO vcoin_initial_receipt_events(stage,amount_base_units,transaction_hash,master_address,recipient_owner_address,confirmed_at)
    VALUES(p_stage,p_amount_base_units,lower(p_transaction_hash),p_master_address,p_recipient_owner_address,p_confirmed_at);
    UPDATE vcoin_initial_receipt_state
       SET next_stage=next_stage+1,
           confirmed_receipt_base_units=confirmed_receipt_base_units+p_amount_base_units,
           updated_at=clock_timestamp()
     WHERE singleton=TRUE;
    RETURN 'confirmed';
END;
$$;

CREATE OR REPLACE FUNCTION record_vcoin_allocation_transfer(
    p_role TEXT,
    p_amount_base_units NUMERIC(38,0),
    p_transaction_hash TEXT,
    p_source_owner_address TEXT,
    p_destination_owner_address TEXT,
    p_confirmed_at TIMESTAMPTZ DEFAULT clock_timestamp()
)
RETURNS TEXT LANGUAGE plpgsql AS $$
DECLARE
    v_state vcoin_initial_receipt_state%ROWTYPE;
    v_expected NUMERIC(38,0);
    v_destination TEXT;
    v_existing vcoin_allocation_transfer_events%ROWTYPE;
BEGIN
    IF p_role NOT IN ('mining_reserve','treasury','liquidity_market','ecosystem_marketing')
       OR p_transaction_hash !~ '^[0-9a-fA-F]{64}$'
       OR p_source_owner_address IS NULL OR p_destination_owner_address IS NULL THEN
        RAISE EXCEPTION 'Invalid VCOIN allocation transfer parameters';
    END IF;
    SELECT * INTO STRICT v_state FROM vcoin_initial_receipt_state WHERE singleton=TRUE FOR UPDATE;
    IF v_state.next_stage <> 6 OR v_state.confirmed_receipt_base_units <> v_state.max_supply_base_units THEN
        RAISE EXCEPTION 'All five initial receipt stages must be confirmed before allocation transfers';
    END IF;
    IF p_source_owner_address <> v_state.founder_wallet THEN
        RAISE EXCEPTION 'Allocation transfer source must be the Founder wallet';
    END IF;
    v_expected := CASE p_role
        WHEN 'mining_reserve' THEN 1050000000000000
        WHEN 'treasury' THEN 210000000000000
        WHEN 'liquidity_market' THEN 210000000000000
        WHEN 'ecosystem_marketing' THEN 210000000000000
    END;
    v_destination := CASE p_role
        WHEN 'mining_reserve' THEN 'UQDMEIvklqeBW0Pn74sBHzOpoFGsSWDHE5NxZwfN-1KVsBD0'
        WHEN 'treasury' THEN 'UQBEW5bLGbq0yVDOimgl6fpZbQkdla9Wk5b0tXyx69bmBktQ'
        WHEN 'liquidity_market' THEN 'UQA0_thi3mXZ6jFlHHBfnyjVmXayR3hsGx5PC43_fBOTzXWn'
        WHEN 'ecosystem_marketing' THEN 'UQBQDb73DWWMGnxEr37TsqZSKNvVOC9MMwkvRmNY91LJqLsE'
    END;
    IF p_amount_base_units <> v_expected THEN RAISE EXCEPTION 'Allocation amount does not match approved role amount'; END IF;
    IF p_destination_owner_address <> v_destination THEN RAISE EXCEPTION 'Allocation destination does not match registered wallet'; END IF;
    SELECT * INTO v_existing FROM vcoin_allocation_transfer_events
      WHERE allocation_role=p_role OR transaction_hash=p_transaction_hash;
    IF FOUND THEN
        IF v_existing.allocation_role=p_role AND v_existing.transaction_hash=lower(p_transaction_hash)
           AND v_existing.amount_base_units=p_amount_base_units THEN RETURN 'duplicate'; END IF;
        RAISE EXCEPTION 'Allocation role or transaction hash already recorded with different data';
    END IF;
    INSERT INTO vcoin_allocation_transfer_events(allocation_role,amount_base_units,transaction_hash,source_owner_address,destination_owner_address,confirmed_at)
    VALUES(p_role,p_amount_base_units,lower(p_transaction_hash),p_source_owner_address,p_destination_owner_address,p_confirmed_at);
    RETURN 'confirmed';
END;
$$;

CREATE OR REPLACE VIEW vcoin_founder_first_reconciliation AS
SELECT s.max_supply_base_units,
       s.confirmed_receipt_base_units,
       s.next_stage,
       (SELECT COUNT(*) FROM vcoin_initial_receipt_events) AS confirmed_receipt_count,
       (SELECT COALESCE(SUM(amount_base_units),0) FROM vcoin_allocation_transfer_events) AS founder_signed_distributions_base_units,
       (SELECT COUNT(*) FROM vcoin_allocation_transfer_events) AS confirmed_distribution_count,
       s.founder_wallet,
       (s.next_stage=6 AND s.confirmed_receipt_base_units=s.max_supply_base_units) AS full_supply_receipt_confirmed
FROM vcoin_initial_receipt_state s WHERE s.singleton=TRUE;

COMMIT;
