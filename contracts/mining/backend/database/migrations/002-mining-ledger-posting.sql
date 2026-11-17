BEGIN;

-- Post a reserved mining reward into the internal user balance and double-entry ledger.
-- This does not mint or transfer on-chain tokens.

CREATE OR REPLACE FUNCTION post_mining_reward(
    p_reward_id UUID,
    p_operation_key VARCHAR(200)
)
RETURNS TABLE (
    result_status TEXT,
    result_reward_id UUID,
    result_user_id UUID,
    result_amount_base_units NUMERIC(38,0),
    result_ledger_transaction_id UUID,
    result_available_reserve_base_units NUMERIC(38,0)
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_reserve mining_reserve%ROWTYPE;
    v_reward mining_rewards%ROWTYPE;
    v_existing ledger_transactions%ROWTYPE;
    v_expense_account_id UUID;
    v_user_account_id UUID;
    v_transaction_id UUID;
    v_available NUMERIC(38,0);
BEGIN
    IF p_reward_id IS NULL THEN
        RAISE EXCEPTION 'reward_id cannot be NULL';
    END IF;

    IF p_operation_key IS NULL
       OR LENGTH(BTRIM(p_operation_key)) < 8
       OR LENGTH(p_operation_key) > 200 THEN
        RAISE EXCEPTION 'Invalid operation key length';
    END IF;

    -- Use the same reserve-first lock order as reserve confirmation/reversal.
    SELECT *
      INTO STRICT v_reserve
      FROM mining_reserve
     WHERE reserve_code = 'USER_MINING'
     FOR UPDATE;

    SELECT *
      INTO STRICT v_reward
      FROM mining_rewards
     WHERE id = p_reward_id
     FOR UPDATE;

    SELECT *
      INTO v_existing
      FROM ledger_transactions
     WHERE operation_id = v_reward.operation_id;

    IF FOUND THEN
        IF v_existing.status <> 'posted' OR v_reward.status <> 'confirmed' THEN
            RAISE EXCEPTION 'Existing ledger transaction is not consistently posted';
        END IF;

        -- A retry must use the exact confirmation operation that moved the reserve.
        -- Otherwise a different key could silently reuse an already-posted reward.
        PERFORM 1
          FROM mining_reserve_operations
         WHERE operation_key = p_operation_key
           AND reward_id = v_reward.id
           AND operation_type = 'confirmed'
           AND amount_base_units = v_reward.amount_base_units;

        IF NOT FOUND THEN
            RAISE EXCEPTION
                'Posted reward retry must use its original confirmation operation key';
        END IF;

        v_available := v_reserve.allocated_base_units
                     - v_reserve.pending_base_units
                     - v_reserve.distributed_base_units;

        RETURN QUERY SELECT
            'posted'::TEXT, v_reward.id, v_reward.user_id,
            v_reward.amount_base_units, v_existing.id, v_available;
        RETURN;
    END IF;

    IF v_reward.status <> 'pending' THEN
        RAISE EXCEPTION 'Only pending mining rewards can be posted';
    END IF;

    -- Confirming the reserve and posting the ledger occur in this same DB transaction.
    PERFORM *
      FROM confirm_mining_reward(p_reward_id, p_operation_key);

    INSERT INTO ledger_accounts (account_code, account_type, asset_code)
    VALUES ('MINING_REWARDS_EXPENSE:VCOIN', 'expense', 'VCOIN')
    ON CONFLICT (account_code) DO NOTHING;

    SELECT id INTO STRICT v_expense_account_id
      FROM ledger_accounts
     WHERE account_code = 'MINING_REWARDS_EXPENSE:VCOIN';

    INSERT INTO ledger_accounts (user_id, account_code, account_type, asset_code)
    VALUES (
        v_reward.user_id,
        'USER_BALANCE:' || v_reward.user_id::TEXT || ':VCOIN',
        'liability',
        'VCOIN'
    )
    ON CONFLICT (account_code) DO NOTHING;

    SELECT id INTO STRICT v_user_account_id
      FROM ledger_accounts
     WHERE account_code = 'USER_BALANCE:' || v_reward.user_id::TEXT || ':VCOIN'
       AND user_id = v_reward.user_id;

    INSERT INTO ledger_transactions (
        operation_id, description, status, posted_at
    )
    VALUES (
        v_reward.operation_id,
        'Mining reward credit: ' || v_reward.id::TEXT,
        'posted',
        clock_timestamp()
    )
    RETURNING id INTO v_transaction_id;

    -- Debit mining expense; credit the user's internal VCOIN liability.
    INSERT INTO ledger_entries (
        transaction_id, account_id, entry_side, amount_base_units
    )
    VALUES
        (v_transaction_id, v_expense_account_id, 'debit', v_reward.amount_base_units),
        (v_transaction_id, v_user_account_id, 'credit', v_reward.amount_base_units);

    INSERT INTO balances (
        user_id, asset_code, available_base_units, reserved_base_units, updated_at
    )
    VALUES (
        v_reward.user_id, 'VCOIN', v_reward.amount_base_units, 0, clock_timestamp()
    )
    ON CONFLICT (user_id, asset_code)
    DO UPDATE SET
        available_base_units = balances.available_base_units + EXCLUDED.available_base_units,
        updated_at = clock_timestamp();

    UPDATE mining_rewards
       SET status = 'confirmed',
           confirmed_at = clock_timestamp()
     WHERE id = p_reward_id
       AND status = 'pending';

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Mining reward status changed while posting';
    END IF;

    SELECT allocated_base_units - pending_base_units - distributed_base_units
      INTO v_available
      FROM mining_reserve
     WHERE reserve_code = 'USER_MINING';

    RETURN QUERY SELECT
        'posted'::TEXT, v_reward.id, v_reward.user_id,
        v_reward.amount_base_units, v_transaction_id, v_available;
END;
$$;

COMMIT;
