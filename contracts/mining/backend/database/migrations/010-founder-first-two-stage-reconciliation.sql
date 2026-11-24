BEGIN;

-- Chain-confirmed accounting for the Founder-first two-stage Jetton receipt.
-- Functions must be called only after an indexer independently confirms
-- transaction finality and validates the expected Master/Jetton wallet.

CREATE TABLE IF NOT EXISTS vcoin_initial_receipt_state (
    singleton BOOLEAN PRIMARY KEY DEFAULT TRUE CHECK (singleton),
    max_supply_base_units NUMERIC(38,0) NOT NULL
        CHECK (max_supply_base_units = 2100000000000000),
    decimals SMALLINT NOT NULL DEFAULT 6 CHECK (decimals = 6),
    founder_wallet TEXT NOT NULL,
    stage1_amount_base_units NUMERIC(38,0),
    stage1_tx_hash CHAR(64),
    stage1_confirmed_at TIMESTAMPTZ,
    stage2_amount_base_units NUMERIC(38,0),
    stage2_tx_hash CHAR(64),
    stage2_confirmed_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    CHECK (
      (stage1_amount_base_units IS NULL AND stage1_tx_hash IS NULL AND stage1_confirmed_at IS NULL)
      OR
      (stage1_amount_base_units > 0 AND stage1_amount_base_units < max_supply_base_units
       AND stage1_tx_hash ~ '^[0-9a-fA-F]{64}$' AND stage1_confirmed_at IS NOT NULL)
    ),
    CHECK (
      (stage2_amount_base_units IS NULL AND stage2_tx_hash IS NULL AND stage2_confirmed_at IS NULL)
      OR
      (stage2_amount_base_units > 0 AND stage2_tx_hash ~ '^[0-9a-fA-F]{64}$'
       AND stage2_confirmed_at IS NOT NULL
       AND stage1_amount_base_units + stage2_amount_base_units = max_supply_base_units)
    )
);

INSERT INTO vcoin_initial_receipt_state (
    singleton, max_supply_base_units, decimals, founder_wallet
)
VALUES (
    TRUE, 2100000000000000, 6,
    'UQBh9jVKAypc4TrbFx2jsVB2EI1ONChg22zDputisQjENQOT'
)
ON CONFLICT (singleton) DO UPDATE
SET max_supply_base_units = EXCLUDED.max_supply_base_units,
    decimals = EXCLUDED.decimals,
    founder_wallet = EXCLUDED.founder_wallet,
    updated_at = clock_timestamp();

CREATE TABLE IF NOT EXISTS vcoin_initial_receipt_events (
    id BIGSERIAL PRIMARY KEY,
    stage SMALLINT NOT NULL CHECK (stage IN (1,2)),
    amount_base_units NUMERIC(38,0) NOT NULL CHECK (amount_base_units > 0),
    transaction_hash CHAR(64) NOT NULL UNIQUE CHECK (transaction_hash ~ '^[0-9a-fA-F]{64}$'),
    master_address TEXT NOT NULL,
    recipient_owner_address TEXT NOT NULL,
    confirmed_at TIMESTAMPTZ NOT NULL,
    UNIQUE (stage)
);

CREATE TABLE IF NOT EXISTS vcoin_allocation_transfer_events (
    id BIGSERIAL PRIMARY KEY,
    allocation_role TEXT NOT NULL CHECK (
      allocation_role IN ('mining_reserve','treasury','liquidity_market','ecosystem_marketing')
    ),
    amount_base_units NUMERIC(38,0) NOT NULL CHECK (amount_base_units > 0),
    transaction_hash CHAR(64) NOT NULL UNIQUE CHECK (transaction_hash ~ '^[0-9a-fA-F]{64}$'),
    source_owner_address TEXT NOT NULL,
    destination_owner_address TEXT NOT NULL,
    confirmed_at TIMESTAMPTZ NOT NULL,
    UNIQUE (allocation_role)
);

CREATE OR REPLACE FUNCTION record_vcoin_receipt_stage(
    p_stage SMALLINT,
    p_amount_base_units NUMERIC(38,0),
    p_transaction_hash TEXT,
    p_master_address TEXT,
    p_recipient_owner_address TEXT,
    p_confirmed_at TIMESTAMPTZ DEFAULT clock_timestamp()
)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    v_state vcoin_initial_receipt_state%ROWTYPE;
    v_existing vcoin_initial_receipt_events%ROWTYPE;
    v_expected NUMERIC(38,0);
BEGIN
    IF p_stage NOT IN (1,2) OR p_amount_base_units <= 0
       OR p_transaction_hash !~ '^[0-9a-fA-F]{64}$'
       OR p_master_address IS NULL OR p_recipient_owner_address IS NULL THEN
        RAISE EXCEPTION 'Invalid VCOIN receipt event parameters';
    END IF;

    SELECT * INTO STRICT v_state
      FROM vcoin_initial_receipt_state
     WHERE singleton = TRUE
     FOR UPDATE;

    IF p_recipient_owner_address <> v_state.founder_wallet THEN
        RAISE EXCEPTION 'Initial receipt recipient is not the approved Founder wallet';
    END IF;

    SELECT * INTO v_existing
      FROM vcoin_initial_receipt_events
     WHERE stage = p_stage OR transaction_hash = p_transaction_hash;

    IF FOUND THEN
        IF v_existing.stage = p_stage
           AND v_existing.transaction_hash = p_transaction_hash
           AND v_existing.amount_base_units = p_amount_base_units THEN
            RETURN 'duplicate';
        END IF;
        RAISE EXCEPTION 'Receipt stage or transaction hash already recorded with different data';
    END IF;

    IF p_stage = 1 THEN
        IF v_state.stage1_tx_hash IS NOT NULL THEN
            RAISE EXCEPTION 'Stage 1 has already been confirmed';
        END IF;
        IF p_amount_base_units >= v_state.max_supply_base_units THEN
            RAISE EXCEPTION 'Stage 1 must leave a positive Stage 2 remainder';
        END IF;
        UPDATE vcoin_initial_receipt_state
           SET stage1_amount_base_units = p_amount_base_units,
               stage1_tx_hash = lower(p_transaction_hash),
               stage1_confirmed_at = p_confirmed_at,
               updated_at = clock_timestamp()
         WHERE singleton = TRUE;
    ELSE
        IF v_state.stage1_tx_hash IS NULL THEN
            RAISE EXCEPTION 'Stage 1 must be confirmed before Stage 2';
        END IF;
        IF v_state.stage2_tx_hash IS NOT NULL THEN
            RAISE EXCEPTION 'Stage 2 has already been confirmed';
        END IF;
        v_expected := v_state.max_supply_base_units - v_state.stage1_amount_base_units;
        IF p_amount_base_units <> v_expected THEN
            RAISE EXCEPTION 'Stage 2 must equal the exact remaining supply';
        END IF;
        UPDATE vcoin_initial_receipt_state
           SET stage2_amount_base_units = p_amount_base_units,
               stage2_tx_hash = lower(p_transaction_hash),
               stage2_confirmed_at = p_confirmed_at,
               updated_at = clock_timestamp()
         WHERE singleton = TRUE;
    END IF;

    INSERT INTO vcoin_initial_receipt_events (
        stage, amount_base_units, transaction_hash, master_address,
        recipient_owner_address, confirmed_at
    ) VALUES (
        p_stage, p_amount_base_units, lower(p_transaction_hash), p_master_address,
        p_recipient_owner_address, p_confirmed_at
    );

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
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    v_state vcoin_initial_receipt_state%ROWTYPE;
    v_expected NUMERIC(38,0);
    v_existing vcoin_allocation_transfer_events%ROWTYPE;
BEGIN
    IF p_role NOT IN ('mining_reserve','treasury','liquidity_market','ecosystem_marketing')
       OR p_transaction_hash !~ '^[0-9a-fA-F]{64}$'
       OR p_source_owner_address IS NULL OR p_destination_owner_address IS NULL THEN
        RAISE EXCEPTION 'Invalid VCOIN allocation transfer parameters';
    END IF;

    SELECT * INTO STRICT v_state
      FROM vcoin_initial_receipt_state
     WHERE singleton = TRUE
     FOR UPDATE;

    IF v_state.stage2_tx_hash IS NULL THEN
        RAISE EXCEPTION 'Both initial receipt stages must be confirmed before allocation transfers';
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

    IF p_amount_base_units <> v_expected THEN
        RAISE EXCEPTION 'Allocation amount does not match approved role amount';
    END IF;

    SELECT * INTO v_existing
      FROM vcoin_allocation_transfer_events
     WHERE allocation_role = p_role OR transaction_hash = p_transaction_hash;

    IF FOUND THEN
        IF v_existing.allocation_role = p_role
           AND v_existing.transaction_hash = lower(p_transaction_hash)
           AND v_existing.amount_base_units = p_amount_base_units THEN
            RETURN 'duplicate';
        END IF;
        RAISE EXCEPTION 'Allocation role or transaction hash already recorded with different data';
    END IF;

    INSERT INTO vcoin_allocation_transfer_events (
        allocation_role, amount_base_units, transaction_hash,
        source_owner_address, destination_owner_address, confirmed_at
    ) VALUES (
        p_role, p_amount_base_units, lower(p_transaction_hash),
        p_source_owner_address, p_destination_owner_address, p_confirmed_at
    );

    RETURN 'confirmed';
END;
$$;

CREATE OR REPLACE VIEW vcoin_founder_first_reconciliation AS
SELECT
    s.max_supply_base_units,
    COALESCE(SUM(r.amount_base_units), 0) AS confirmed_receipt_base_units,
    s.stage1_amount_base_units,
    s.stage2_amount_base_units,
    s.stage1_tx_hash,
    s.stage2_tx_hash,
    (SELECT COALESCE(SUM(a.amount_base_units), 0)
       FROM vcoin_allocation_transfer_events a) AS founder_signed_distributions_base_units,
    (SELECT COUNT(*) FROM vcoin_allocation_transfer_events) AS confirmed_distribution_count,
    s.founder_wallet,
    (s.stage2_tx_hash IS NOT NULL) AS full_supply_receipt_confirmed
FROM vcoin_initial_receipt_state s
LEFT JOIN vcoin_initial_receipt_events r ON TRUE
WHERE s.singleton = TRUE
GROUP BY s.singleton;

COMMIT;
