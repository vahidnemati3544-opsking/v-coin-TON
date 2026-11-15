-- V COIN – TON
-- Mining Reserve Management
-- Token precision: 6 decimals
-- Allocation: 5,000,000,000 VCOIN
-- Base units: 5,000,000,000,000,000

BEGIN;

CREATE TABLE IF NOT EXISTS mining_reserve (
    reserve_code VARCHAR(50) PRIMARY KEY,
    allocated_base_units NUMERIC(38,0) NOT NULL,
    pending_base_units NUMERIC(38,0) NOT NULL DEFAULT 0,
    distributed_base_units NUMERIC(38,0) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),

    CHECK (allocated_base_units >= 0),
    CHECK (pending_base_units >= 0),
    CHECK (distributed_base_units >= 0),
    CHECK (
        pending_base_units + distributed_base_units
        <= allocated_base_units
    )
);

CREATE TABLE IF NOT EXISTS mining_reward_reservations (
    reward_id UUID PRIMARY KEY,
    idempotency_key VARCHAR(150) NOT NULL UNIQUE,
    amount_base_units NUMERIC(38,0) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    confirmed_at TIMESTAMPTZ,
    reversed_at TIMESTAMPTZ,

    CHECK (amount_base_units > 0),
    CHECK (status IN ('pending', 'confirmed', 'reversed')),
    CHECK (
        (status <> 'confirmed' OR confirmed_at IS NOT NULL)
        AND
        (status <> 'reversed' OR reversed_at IS NOT NULL)
    )
);

CREATE TABLE IF NOT EXISTS mining_reserve_operations (
    operation_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    operation_key VARCHAR(200) NOT NULL UNIQUE,
    reward_id UUID NOT NULL,
    operation_type VARCHAR(20) NOT NULL,
    amount_base_units NUMERIC(38,0) NOT NULL,
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),

    CHECK (
        operation_type IN ('reserved', 'confirmed', 'reversed')
    ),
    CHECK (amount_base_units > 0)
);

CREATE INDEX IF NOT EXISTS
    idx_mining_reservations_status_created
ON mining_reward_reservations (status, created_at);

CREATE INDEX IF NOT EXISTS
    idx_mining_reserve_operations_reward
ON mining_reserve_operations (reward_id, operation_id);


-- Initialize the approved mining allocation.
INSERT INTO mining_reserve (
    reserve_code,
    allocated_base_units
)
VALUES (
    'USER_MINING',
    5000000000000000
)
ON CONFLICT (reserve_code) DO NOTHING;


-- Never silently accept a different allocation.
DO $$
DECLARE
    current_allocation NUMERIC(38,0);
BEGIN
    SELECT allocated_base_units
      INTO STRICT current_allocation
      FROM mining_reserve
     WHERE reserve_code = 'USER_MINING'
     FOR UPDATE;

    IF current_allocation <> 5000000000000000 THEN
        RAISE EXCEPTION
            'USER_MINING allocation mismatch: expected %, found %',
            5000000000000000,
            current_allocation;
    END IF;
END;
$$;
-- =========================================================
-- Atomic mining reward reservation
-- =========================================================

CREATE OR REPLACE FUNCTION reserve_mining_reward(
    p_reward_id UUID,
    p_amount_base_units NUMERIC,
    p_idempotency_key VARCHAR(150)
)
RETURNS TABLE (
    result_reward_id UUID,
    result_status VARCHAR(20),
    result_amount_base_units NUMERIC(38,0),
    was_created BOOLEAN
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_allocation NUMERIC(38,0);
    v_pending NUMERIC(38,0);
    v_distributed NUMERIC(38,0);
    v_existing mining_reward_reservations%ROWTYPE;
BEGIN
    -- Validate inputs.
    IF p_reward_id IS NULL THEN
        RAISE EXCEPTION 'reward_id is required';
    END IF;

    IF p_amount_base_units IS NULL
       OR p_amount_base_units <= 0
       OR p_amount_base_units <> TRUNC(p_amount_base_units) THEN
        RAISE EXCEPTION 'amount must be a positive integer';
    END IF;

    IF p_idempotency_key IS NULL
       OR LENGTH(BTRIM(p_idempotency_key)) < 8
       OR LENGTH(p_idempotency_key) > 150 THEN
        RAISE EXCEPTION 'invalid idempotency key';
    END IF;

    -- Serialize reserve operations.
    SELECT
        allocated_base_units,
        pending_base_units,
        distributed_base_units
    INTO
        v_allocation,
        v_pending,
        v_distributed
    FROM mining_reserve
    WHERE reserve_code = 'USER_MINING'
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'USER_MINING reserve not initialized';
    END IF;

    -- Check whether this request was already processed.
    SELECT *
    INTO v_existing
    FROM mining_reward_reservations
    WHERE reward_id = p_reward_id
       OR idempotency_key = p_idempotency_key
    FOR UPDATE;

    IF FOUND THEN
        IF v_existing.reward_id <> p_reward_id
           OR v_existing.idempotency_key <> p_idempotency_key
           OR v_existing.amount_base_units <> p_amount_base_units THEN
            RAISE EXCEPTION
                'idempotency conflict: request does not match existing reservation';
        END IF;

        RETURN QUERY
        SELECT
            v_existing.reward_id,
            v_existing.status,
            v_existing.amount_base_units,
            FALSE;

        RETURN;
    END IF;

    -- Verify available allocation.
    IF p_amount_base_units >
       (v_allocation - v_pending - v_distributed) THEN
        RAISE EXCEPTION 'insufficient mining reserve';
    END IF;

    -- Create reservation.
    INSERT INTO mining_reward_reservations (
        reward_id,
        idempotency_key,
        amount_base_units,
        status
    )
    VALUES (
        p_reward_id,
        p_idempotency_key,
        p_amount_base_units,
        'pending'
    );

    -- Move amount into pending reserve.
    UPDATE mining_reserve
    SET
        pending_base_units =
            pending_base_units + p_amount_base_units,
        updated_at = clock_timestamp()
    WHERE reserve_code = 'USER_MINING';

    -- Record immutable operation history.
    INSERT INTO mining_reserve_operations (
        operation_key,
        reward_id,
        operation_type,
        amount_base_units,
        reason
    )
    VALUES (
        'reserve:' || p_idempotency_key,
        p_reward_id,
        'reserved',
        p_amount_base_units,
        'Mining reward reservation'
    );

    RETURN QUERY
    SELECT
        p_reward_id,
        'pending'::VARCHAR(20),
        p_amount_base_units::NUMERIC(38,0),
        TRUE;
END;
$$;
-- =========================================================
-- Confirm mining reward reservation
-- =========================================================

CREATE OR REPLACE FUNCTION confirm_mining_reward(
    p_reward_id UUID,
    p_operation_key VARCHAR(200)
)
RETURNS VARCHAR(20)
LANGUAGE plpgsql
AS $$
DECLARE
    v_reservation mining_reward_reservations%ROWTYPE;
BEGIN
    IF p_reward_id IS NULL OR p_operation_key IS NULL
       OR LENGTH(BTRIM(p_operation_key)) < 8 THEN
        RAISE EXCEPTION 'invalid confirmation input';
    END IF;

    SELECT *
      INTO STRICT v_reservation
      FROM mining_reward_reservations
     WHERE reward_id = p_reward_id
     FOR UPDATE;

    IF v_reservation.status = 'confirmed' THEN
        RETURN 'confirmed';
    END IF;

    IF v_reservation.status <> 'pending' THEN
        RAISE EXCEPTION 'reservation cannot be confirmed';
    END IF;

    UPDATE mining_reserve
       SET pending_base_units = pending_base_units
               - v_reservation.amount_base_units,
           distributed_base_units = distributed_base_units
               + v_reservation.amount_base_units,
           updated_at = clock_timestamp()
     WHERE reserve_code = 'USER_MINING'
       AND pending_base_units >= v_reservation.amount_base_units;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'reserve accounting inconsistency';
    END IF;

    UPDATE mining_reward_reservations
       SET status = 'confirmed',
           confirmed_at = clock_timestamp(),
           updated_at = clock_timestamp()
     WHERE reward_id = p_reward_id;

    INSERT INTO mining_reserve_operations (
        operation_key, reward_id, operation_type,
        amount_base_units, reason
    )
    VALUES (
        p_operation_key, p_reward_id, 'confirmed',
        v_reservation.amount_base_units,
        'Mining reward confirmed'
    );

    RETURN 'confirmed';
END;
$$;


-- =========================================================
-- Reverse mining reward reservation
-- =========================================================

CREATE OR REPLACE FUNCTION reverse_mining_reward(
    p_reward_id UUID,
    p_operation_key VARCHAR(200),
    p_reason TEXT
)
RETURNS VARCHAR(20)
LANGUAGE plpgsql
AS $$
DECLARE
    v_reservation mining_reward_reservations%ROWTYPE;
BEGIN
    IF p_reward_id IS NULL OR p_operation_key IS NULL
       OR LENGTH(BTRIM(p_operation_key)) < 8 THEN
        RAISE EXCEPTION 'invalid reversal input';
    END IF;

    SELECT *
      INTO STRICT v_reservation
      FROM mining_reward_reservations
     WHERE reward_id = p_reward_id
     FOR UPDATE;

    IF v_reservation.status = 'reversed' THEN
        RETURN 'reversed';
    END IF;

    IF v_reservation.status = 'pending' THEN
        UPDATE mining_reserve
           SET pending_base_units = pending_base_units
                   - v_reservation.amount_base_units,
               updated_at = clock_timestamp()
         WHERE reserve_code = 'USER_MINING'
           AND pending_base_units >= v_reservation.amount_base_units;

    ELSIF v_reservation.status = 'confirmed' THEN
        UPDATE mining_reserve
           SET distributed_base_units = distributed_base_units
                   - v_reservation.amount_base_units,
               updated_at = clock_timestamp()
         WHERE reserve_code = 'USER_MINING'
           AND distributed_base_units >= v_reservation.amount_base_units;

    ELSE
        RAISE EXCEPTION 'reservation cannot be reversed';
    END IF;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'reserve accounting inconsistency';
    END IF;

    UPDATE mining_reward_reservations
       SET status = 'reversed',
           reversed_at = clock_timestamp(),
           updated_at = clock_timestamp()
     WHERE reward_id = p_reward_id;

    INSERT INTO mining_reserve_operations (
        operation_key, reward_id, operation_type,
        amount_base_units, reason
    )
    VALUES (
        p_operation_key, p_reward_id, 'reversed',
        v_reservation.amount_base_units, p_reason
    );

    RETURN 'reversed';
END;
$$;
-- =========================================================
-- Reserve integrity view
-- =========================================================

CREATE OR REPLACE VIEW mining_reserve_status AS
SELECT
    reserve_code,
    allocated_base_units,
    pending_base_units,
    distributed_base_units,
    (
        allocated_base_units
        - pending_base_units
        - distributed_base_units
    ) AS available_base_units,
    updated_at
FROM mining_reserve
WHERE reserve_code = 'USER_MINING';


-- =========================================================
-- Migration completed
-- =========================================================

COMMIT;
