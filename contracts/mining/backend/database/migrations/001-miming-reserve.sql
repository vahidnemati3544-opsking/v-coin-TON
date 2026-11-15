BEGIN;

-- =========================================================
-- V COIN - TON
-- Mining Reserve Migration
-- Allocation: 5,000,000,000 VCOIN
-- Decimals: 6
-- Base units: 5,000,000,000,000,000
-- =========================================================

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

    CHECK (
        status IN ('pending', 'confirmed', 'reversed')
    ),

    CHECK (
        status <> 'confirmed'
        OR confirmed_at IS NOT NULL
    ),

    CHECK (
        status <> 'reversed'
        OR reversed_at IS NOT NULL
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
-- =========================================================
-- INDEXES
-- =========================================================

CREATE INDEX IF NOT EXISTS
    idx_mining_reservations_status_created
ON mining_reward_reservations (status, created_at);

CREATE INDEX IF NOT EXISTS
    idx_mining_reserve_operations_reward
ON mining_reserve_operations (reward_id, operation_id);


-- =========================================================
-- INITIAL MINING RESERVE ALLOCATION
-- 5 billion VCOIN with 6 decimals
-- =========================================================

INSERT INTO mining_reserve (
    reserve_code,
    allocated_base_units
)
VALUES (
    'USER_MINING',
    5000000000000000
)
ON CONFLICT (reserve_code) DO NOTHING;


-- =========================================================
-- ALLOCATION INTEGRITY CHECK
-- Prevents silently changing the approved allocation.
-- =========================================================

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
-- FUNCTION 1: RESERVE MINING REWARD
-- =========================================================

CREATE OR REPLACE FUNCTION reserve_mining_reward(
    p_reward_id UUID,
    p_amount_base_units NUMERIC,
    p_idempotency_key VARCHAR(150)
)
RETURNS TABLE (
    result_status TEXT,
    result_reward_id UUID,
    result_amount_base_units NUMERIC(38,0),
    result_available_base_units NUMERIC(38,0)
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_reserve mining_reserve%ROWTYPE;
    v_existing mining_reward_reservations%ROWTYPE;
    v_operation mining_reserve_operations%ROWTYPE;

    v_operation_key VARCHAR(200);
    v_available NUMERIC(38,0);
BEGIN
    IF p_reward_id IS NULL THEN
        RAISE EXCEPTION 'reward_id cannot be NULL';
    END IF;

    IF p_amount_base_units IS NULL
       OR p_amount_base_units <= 0
       OR p_amount_base_units <> TRUNC(p_amount_base_units) THEN
        RAISE EXCEPTION
            'Reward amount must be a positive whole number of base units';
    END IF;

    IF p_idempotency_key IS NULL
       OR LENGTH(BTRIM(p_idempotency_key)) < 8
       OR LENGTH(p_idempotency_key) > 150 THEN
        RAISE EXCEPTION
            'Invalid idempotency key length';
    END IF;

    v_operation_key := 'reserve:' || p_idempotency_key;

    -- Lock the reserve first to serialize all reserve operations.
    SELECT *
      INTO STRICT v_reserve
      FROM mining_reserve
     WHERE reserve_code = 'USER_MINING'
     FOR UPDATE;

    -- Check whether this reward_id already exists.
    SELECT *
      INTO v_existing
      FROM mining_reward_reservations
     WHERE reward_id = p_reward_id;

    IF FOUND THEN
        IF v_existing.idempotency_key <> p_idempotency_key
           OR v_existing.amount_base_units <> p_amount_base_units THEN
            RAISE EXCEPTION
                'Reward ID already exists with different request data';
        END IF;

        SELECT *
          INTO v_operation
          FROM mining_reserve_operations
         WHERE operation_key = v_operation_key;

        IF NOT FOUND
           OR v_operation.reward_id <> p_reward_id
           OR v_operation.operation_type <> 'reserved'
           OR v_operation.amount_base_units <> p_amount_base_units THEN
            RAISE EXCEPTION
                'Existing reward reservation has inconsistent operation history';
        END IF;

        v_available :=
            v_reserve.allocated_base_units
            - v_reserve.pending_base_units
            - v_reserve.distributed_base_units;

        RETURN QUERY
        SELECT
            v_existing.status::TEXT,
            v_existing.reward_id,
            v_existing.amount_base_units,
            v_available;

        RETURN;
    END IF;

    -- Prevent reuse of an idempotency key for another reward.
    SELECT *
      INTO v_existing
      FROM mining_reward_reservations
     WHERE idempotency_key = p_idempotency_key;

    IF FOUND THEN
        RAISE EXCEPTION
            'Idempotency key is already assigned to another reward';
    END IF;

    v_available :=
        v_reserve.allocated_base_units
        - v_reserve.pending_base_units
        - v_reserve.distributed_base_units;

    IF p_amount_base_units > v_available THEN
        RAISE EXCEPTION
            'Insufficient mining reserve: requested %, available %',
            p_amount_base_units,
            v_available;
    END IF;

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

    UPDATE mining_reserve
       SET pending_base_units =
               pending_base_units + p_amount_base_units,
           updated_at = clock_timestamp()
     WHERE reserve_code = 'USER_MINING';
INSERT INTO mining_reserve_operations (
        operation_key,
        reward_id,
        operation_type,
        amount_base_units,
        reason
    )
    VALUES (
        v_operation_key,
        p_reward_id,
        'reserved',
        p_amount_base_units,
        'Mining reward reserved'
    );

    v_available := v_available - p_amount_base_units;

    RETURN QUERY
    SELECT
        'pending'::TEXT,
        p_reward_id,
        p_amount_base_units::NUMERIC(38,0),
        v_available;
END;
$$;
-- =========================================================
-- FUNCTION 2: CONFIRM MINING REWARD
-- =========================================================

CREATE OR REPLACE FUNCTION confirm_mining_reward(
    p_reward_id UUID,
    p_operation_key VARCHAR(200)
)
RETURNS TABLE (
    result_status TEXT,
    result_reward_id UUID,
    result_amount_base_units NUMERIC(38,0),
    result_available_base_units NUMERIC(38,0)
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_reserve mining_reserve%ROWTYPE;
    v_reservation mining_reward_reservations%ROWTYPE;
    v_operation mining_reserve_operations%ROWTYPE;

    v_available NUMERIC(38,0);
BEGIN
    IF p_reward_id IS NULL THEN
        RAISE EXCEPTION 'reward_id cannot be NULL';
    END IF;

    IF p_operation_key IS NULL
       OR LENGTH(BTRIM(p_operation_key)) < 8
       OR LENGTH(p_operation_key) > 200 THEN
        RAISE EXCEPTION
            'Invalid operation key length';
    END IF;

    -- All mining reserve functions use the same lock order.
    SELECT *
      INTO STRICT v_reserve
      FROM mining_reserve
     WHERE reserve_code = 'USER_MINING'
     FOR UPDATE;

    SELECT *
      INTO STRICT v_reservation
      FROM mining_reward_reservations
     WHERE reward_id = p_reward_id
     FOR UPDATE;

    -- Check whether this operation key was already used.
    SELECT *
      INTO v_operation
      FROM mining_reserve_operations
     WHERE operation_key = p_operation_key;

    IF FOUND THEN
        IF v_operation.reward_id <> p_reward_id
           OR v_operation.operation_type <> 'confirmed'
           OR v_operation.amount_base_units <> v_reservation.amount_base_units THEN
            RAISE EXCEPTION
                'Operation key already exists with conflicting data';
        END IF;

        IF v_reservation.status <> 'confirmed' THEN
            RAISE EXCEPTION
                'Confirmation operation exists but reservation is not confirmed';
        END IF;

        v_available :=
            v_reserve.allocated_base_units
            - v_reserve.pending_base_units
            - v_reserve.distributed_base_units;

        RETURN QUERY
        SELECT
            'confirmed'::TEXT,
            v_reservation.reward_id,
            v_reservation.amount_base_units,
            v_available;

        RETURN;
    END IF;

    IF v_reservation.status <> 'pending' THEN
        RAISE EXCEPTION
            'Only pending rewards can be confirmed; current status: %',
            v_reservation.status;
    END IF;

    UPDATE mining_reserve
       SET pending_base_units =
               pending_base_units - v_reservation.amount_base_units,
           distributed_base_units =
               distributed_base_units + v_reservation.amount_base_units,
           updated_at = clock_timestamp()
     WHERE reserve_code = 'USER_MINING';

    UPDATE mining_reward_reservations
       SET status = 'confirmed',
           confirmed_at = clock_timestamp(),
           updated_at = clock_timestamp()
     WHERE reward_id = p_reward_id;

    INSERT INTO mining_reserve_operations (
        operation_key,
        reward_id,
        operation_type,
        amount_base_units,
        reason
    )
    VALUES (
        p_operation_key,
        p_reward_id,
        'confirmed',
        v_reservation.amount_base_units,
        'Mining reward confirmed'
    );

    v_available :=
        v_reserve.allocated_base_units
        - v_reserve.pending_base_units
        - v_reserve.distributed_base_units;

    RETURN QUERY
    SELECT
        'confirmed'::TEXT,
        p_reward_id,
        v_reservation.amount_base_units,
        v_available;
END;
$$;
-- =========================================================
-- FUNCTION 3: REVERSE MINING REWARD
-- =========================================================

CREATE OR REPLACE FUNCTION reverse_mining_reward(
    p_reward_id UUID,
    p_operation_key VARCHAR(200),
    p_reason TEXT DEFAULT NULL
)
RETURNS TABLE (
    result_status TEXT,
    result_reward_id UUID,
    result_amount_base_units NUMERIC(38,0),
    result_available_base_units NUMERIC(38,0)
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_reserve mining_reserve%ROWTYPE;
    v_reservation mining_reward_reservations%ROWTYPE;
    v_operation mining_reserve_operations%ROWTYPE;

    v_available NUMERIC(38,0);
BEGIN
    IF p_reward_id IS NULL THEN
        RAISE EXCEPTION 'reward_id cannot be NULL';
    END IF;

    IF p_operation_key IS NULL
       OR LENGTH(BTRIM(p_operation_key)) < 8
       OR LENGTH(p_operation_key) > 200 THEN
        RAISE EXCEPTION
            'Invalid operation key length';
    END IF;

    -- Keep the same lock order used by other reserve functions.
    SELECT *
      INTO STRICT v_reserve
      FROM mining_reserve
     WHERE reserve_code = 'USER_MINING'
     FOR UPDATE;

    SELECT *
      INTO STRICT v_reservation
      FROM mining_reward_reservations
     WHERE reward_id = p_reward_id
     FOR UPDATE;

    -- Check idempotent retry.
    SELECT *
      INTO v_operation
      FROM mining_reserve_operations
     WHERE operation_key = p_operation_key;

    IF FOUND THEN
        IF v_operation.reward_id <> p_reward_id
           OR v_operation.operation_type <> 'reversed'
           OR v_operation.amount_base_units <> v_reservation.amount_base_units THEN
            RAISE EXCEPTION
                'Operation key already exists with conflicting data';
        END IF;

        IF v_reservation.status <> 'reversed' THEN
            RAISE EXCEPTION
                'Reversal operation exists but reservation is not reversed';
        END IF;

        v_available :=
            v_reserve.allocated_base_units
            - v_reserve.pending_base_units
            - v_reserve.distributed_base_units;

        RETURN QUERY
        SELECT
            'reversed'::TEXT,
            v_reservation.reward_id,
            v_reservation.amount_base_units,
            v_available;

        RETURN;
    END IF;

    IF v_reservation.status = 'reversed' THEN
        RAISE EXCEPTION
            'Reward has already been reversed using another operation key';
    END IF;

    IF v_reservation.status = 'pending' THEN

        UPDATE mining_reserve
           SET pending_base_units =
                   pending_base_units - v_reservation.amount_base_units,
               updated_at = clock_timestamp()
         WHERE reserve_code = 'USER_MINING';

    ELSIF v_reservation.status = 'confirmed' THEN

        UPDATE mining_reserve
           SET distributed_base_units =
                   distributed_base_units - v_reservation.amount_base_units,
               updated_at = clock_timestamp()
         WHERE reserve_code = 'USER_MINING';

    ELSE
        RAISE EXCEPTION
            'Unsupported reservation status: %',
            v_reservation.status;
    END IF;

    UPDATE mining_reward_reservations
       SET status = 'reversed',
           reversed_at = clock_timestamp(),
           updated_at = clock_timestamp()
     WHERE reward_id = p_reward_id;

    INSERT INTO mining_reserve_operations (
        operation_key,
        reward_id,
        operation_type,
        amount_base_units,
        reason
    )
    VALUES (
        p_operation_key,
        p_reward_id,
        'reversed',
        v_reservation.amount_base_units,
        COALESCE(p_reason, 'Mining reward reversed')
    );

    SELECT
        allocated_base_units
        - pending_base_units
        - distributed_base_units
      INTO v_available
      FROM mining_reserve
     WHERE reserve_code = 'USER_MINING';

    RETURN QUERY
    SELECT
        'reversed'::TEXT,
        p_reward_id,
        v_reservation.amount_base_units,
        v_available;
END;
$$;
-- =========================================================
-- RESERVE INTEGRITY VIEW
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
-- FINAL MIGRATION INTEGRITY CHECK
-- =========================================================

DO $$
DECLARE
    v_reserve mining_reserve%ROWTYPE;
BEGIN
    SELECT *
      INTO STRICT v_reserve
      FROM mining_reserve
     WHERE reserve_code = 'USER_MINING';

    IF v_reserve.allocated_base_units <> 5000000000000000 THEN
        RAISE EXCEPTION
            'Final integrity check failed: incorrect mining allocation';
    END IF;

    IF v_reserve.pending_base_units < 0
       OR v_reserve.distributed_base_units < 0 THEN
        RAISE EXCEPTION
            'Final integrity check failed: negative reserve balance';
    END IF;

    IF (
        v_reserve.pending_base_units
        + v_reserve.distributed_base_units
    ) > v_reserve.allocated_base_units THEN
        RAISE EXCEPTION
            'Final integrity check failed: reserve allocation exceeded';
    END IF;
END;
$$;


-- =========================================================
-- END OF V COIN TON MINING RESERVE MIGRATION
-- =========================================================

COMMIT;
