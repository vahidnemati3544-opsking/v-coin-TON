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

    SELECT *
    INTO v_existing
    FROM mining_reward_reservations
    WHERE reward_id = p_reward_id
    FOR UPDATE;

    IF FOUND THEN
        IF v_existing.idempotency_key <> p_idempotency_key
           OR v_existing.amount_base_units <> p_amount_base_units THEN
            RAISE EXCEPTION 'idempotency conflict for reward_id';
        END IF;

        RETURN QUERY
        SELECT
            v_existing.reward_id,
            v_existing.status,
            v_existing.amount_base_units,
            FALSE;
        RETURN;
    END IF;

    SELECT *
    INTO v_existing
    FROM mining_reward_reservations
    WHERE idempotency_key = p_idempotency_key
    FOR UPDATE;

    IF FOUND THEN
        RAISE EXCEPTION 'idempotency key already belongs to another reward';
    END IF;

    IF p_amount_base_units >
       (v_allocation - v_pending - v_distributed) THEN
        RAISE EXCEPTION 'insufficient mining reserve';
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
    SET
        pending_base_units = pending_base_units + p_amount_base_units,
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
CREATE OR REPLACE FUNCTION confirm_mining_reward(
    p_reward_id UUID,
    p_operation_key VARCHAR(200)
)
RETURNS VARCHAR(20)
LANGUAGE plpgsql
AS $$
DECLARE
    v_reservation mining_reward_reservations%ROWTYPE;
    v_operation mining_reserve_operations%ROWTYPE;
BEGIN
    IF p_reward_id IS NULL
       OR p_operation_key IS NULL
       OR LENGTH(BTRIM(p_operation_key)) < 8
       OR LENGTH(p_operation_key) > 200 THEN
        RAISE EXCEPTION 'invalid confirmation input';
    END IF;

    PERFORM 1
    FROM mining_reserve
    WHERE reserve_code = 'USER_MINING'
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'USER_MINING reserve not initialized';
    END IF;

    SELECT *
    INTO STRICT v_reservation
    FROM mining_reward_reservations
    WHERE reward_id = p_reward_id
    FOR UPDATE;

    SELECT *
    INTO v_operation
    FROM mining_reserve_operations
    WHERE operation_key = p_operation_key
    FOR UPDATE;

    IF FOUND THEN
        IF v_operation.reward_id <> p_reward_id
           OR v_operation.operation_type <> 'confirmed'
           OR v_operation.amount_base_units <> v_reservation.amount_base_units THEN
            RAISE EXCEPTION 'operation key conflict';
        END IF;

        IF v_reservation.status <> 'confirmed' THEN
            RAISE EXCEPTION 'confirmation operation state mismatch';
        END IF;

        RETURN 'confirmed';
    END IF;

    IF v_reservation.status = 'confirmed' THEN
        RAISE EXCEPTION 'reservation already confirmed with another operation key';
    END IF;

    IF v_reservation.status <> 'pending' THEN
        RAISE EXCEPTION 'reservation cannot be confirmed';
    END IF;

    UPDATE mining_reserve
    SET
        pending_base_units =
            pending_base_units - v_reservation.amount_base_units,
        distributed_base_units =
            distributed_base_units + v_reservation.amount_base_units,
        updated_at = clock_timestamp()
    WHERE reserve_code = 'USER_MINING'
      AND pending_base_units >= v_reservation.amount_base_units;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'reserve accounting inconsistency';
    END IF;

    UPDATE mining_reward_reservations
    SET
        status = 'confirmed',
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

    RETURN 'confirmed';
END;
$$;
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
    v_operation mining_reserve_operations%ROWTYPE;
BEGIN
    IF p_reward_id IS NULL
       OR p_operation_key IS NULL
       OR LENGTH(BTRIM(p_operation_key)) < 8
       OR LENGTH(p_operation_key) > 200 THEN
        RAISE EXCEPTION 'invalid reversal input';
    END IF;

    PERFORM 1
    FROM mining_reserve
    WHERE reserve_code = 'USER_MINING'
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'USER_MINING reserve not initialized';
    END IF;

    SELECT *
    INTO STRICT v_reservation
    FROM mining_reward_reservations
    WHERE reward_id = p_reward_id
    FOR UPDATE;

    SELECT *
    INTO v_operation
    FROM mining_reserve_operations
    WHERE operation_key = p_operation_key
    FOR UPDATE;

    IF FOUND THEN
        IF v_operation.reward_id <> p_reward_id
           OR v_operation.operation_type <> 'reversed'
           OR v_operation.amount_base_units <> v_reservation.amount_base_units THEN
            RAISE EXCEPTION 'operation key conflict';
        END IF;

        IF v_reservation.status <> 'reversed' THEN
            RAISE EXCEPTION 'reversal operation state mismatch';
        END IF;

        RETURN 'reversed';
    END IF;

    IF v_reservation.status = 'reversed' THEN
        RAISE EXCEPTION 'reservation already reversed with another operation key';
    END IF;

    IF v_reservation.status = 'pending' THEN

        UPDATE mining_reserve
        SET
            pending_base_units =
                pending_base_units - v_reservation.amount_base_units,
            updated_at = clock_timestamp()
        WHERE reserve_code = 'USER_MINING'
          AND pending_base_units >= v_reservation.amount_base_units;

    ELSIF v_reservation.status = 'confirmed' THEN

        UPDATE mining_reserve
        SET
            distributed_base_units =
                distributed_base_units - v_reservation.amount_base_units,
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
    SET
        status = 'reversed',
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
        p_reason
    );

    RETURN 'reversed';
END;
$$;
