BEGIN;

-- Confirm a pending mining reward and post its balanced double-entry ledger
-- transaction in one PostgreSQL transaction. No on-chain transfer is made.
CREATE OR REPLACE FUNCTION confirm_mining_reward_to_internal_balance(
    p_reward_id UUID,
    p_operation_key VARCHAR(200)
)
RETURNS TABLE (
    result_status TEXT,
    result_reward_id UUID,
    result_user_id UUID,
    result_amount_base_units NUMERIC(38,0),
    result_available_base_units NUMERIC(38,0),
    result_balance_base_units NUMERIC(38,0)
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_user_id UUID;
    v_reward mining_rewards%ROWTYPE;
    v_reserve_result RECORD;
    v_expense_account_id UUID;
    v_user_account_id UUID;
    v_ledger_transaction_id UUID;
    v_balance NUMERIC(38,0);
    v_entry_count INTEGER;
    v_debit_total NUMERIC(38,0);
    v_credit_total NUMERIC(38,0);
BEGIN
    IF p_reward_id IS NULL THEN
        RAISE EXCEPTION 'reward_id cannot be NULL';
    END IF;

    IF p_operation_key IS NULL
       OR LENGTH(BTRIM(p_operation_key)) < 8
       OR LENGTH(p_operation_key) > 200 THEN
        RAISE EXCEPTION 'Invalid confirmation operation key';
    END IF;

    -- Keep the lock order consistent with mining claims: user, reward, reserve.
    SELECT user_id
      INTO STRICT v_user_id
      FROM mining_rewards
     WHERE id = p_reward_id;

    PERFORM 1
      FROM users
     WHERE id = v_user_id
     FOR UPDATE;

    SELECT *
      INTO STRICT v_reward
      FROM mining_rewards
     WHERE id = p_reward_id
     FOR UPDATE;

    IF v_reward.status = 'confirmed' THEN
        SELECT id
          INTO STRICT v_ledger_transaction_id
          FROM ledger_transactions
         WHERE operation_id = v_reward.operation_id
           AND status = 'posted';

        SELECT COUNT(*),
               COALESCE(SUM(amount_base_units) FILTER (WHERE entry_side = 'debit'), 0),
               COALESCE(SUM(amount_base_units) FILTER (WHERE entry_side = 'credit'), 0)
          INTO v_entry_count, v_debit_total, v_credit_total
          FROM ledger_entries
         WHERE transaction_id = v_ledger_transaction_id;

        IF v_entry_count <> 2 OR v_debit_total <> v_reward.amount_base_units
           OR v_credit_total <> v_reward.amount_base_units THEN
            RAISE EXCEPTION 'Confirmed reward has inconsistent ledger entries';
        END IF;

        SELECT available_base_units
          INTO STRICT v_balance
          FROM balances
         WHERE user_id = v_user_id AND asset_code = 'VCOIN';

        RETURN QUERY
        SELECT 'duplicate'::TEXT, v_reward.id, v_user_id,
               v_reward.amount_base_units,
               (SELECT available_base_units FROM mining_reserve_status),
               v_balance;
        RETURN;
    END IF;

    IF v_reward.status <> 'pending' THEN
        RAISE EXCEPTION 'Only pending mining rewards can be confirmed';
    END IF;

    -- Confirm the reserve first. It is part of this same transaction.
    SELECT *
      INTO STRICT v_reserve_result
      FROM confirm_mining_reward(p_reward_id, p_operation_key);

    IF v_reserve_result.result_status <> 'confirmed'
       OR v_reserve_result.result_amount_base_units <> v_reward.amount_base_units THEN
        RAISE EXCEPTION 'Mining reserve confirmation did not match reward';
    END IF;

    INSERT INTO ledger_accounts (user_id, account_code, account_type, asset_code)
    VALUES (NULL, 'MINING_REWARD_EXPENSE', 'expense', 'VCOIN')
    ON CONFLICT (account_code) DO NOTHING;

    INSERT INTO ledger_accounts (user_id, account_code, account_type, asset_code)
    VALUES (
        v_user_id,
        'USER_VCOIN_LIABILITY:' || v_user_id::TEXT,
        'liability',
        'VCOIN'
    )
    ON CONFLICT (account_code) DO NOTHING;

    SELECT id
      INTO STRICT v_expense_account_id
      FROM ledger_accounts
     WHERE account_code = 'MINING_REWARD_EXPENSE'
       AND account_type = 'expense'
       AND asset_code = 'VCOIN'
     FOR UPDATE;

    SELECT id
      INTO STRICT v_user_account_id
      FROM ledger_accounts
     WHERE account_code = 'USER_VCOIN_LIABILITY:' || v_user_id::TEXT
       AND user_id = v_user_id
       AND account_type = 'liability'
       AND asset_code = 'VCOIN'
     FOR UPDATE;

    INSERT INTO ledger_transactions (
        operation_id, description, status, posted_at
    )
    VALUES (
        v_reward.operation_id,
        'Confirmed internal VCOIN mining reward ' || v_reward.id::TEXT,
        'posted',
        clock_timestamp()
    )
    RETURNING id INTO v_ledger_transaction_id;

    INSERT INTO ledger_entries (transaction_id, account_id, entry_side, amount_base_units)
    VALUES
        (v_ledger_transaction_id, v_expense_account_id, 'debit', v_reward.amount_base_units),
        (v_ledger_transaction_id, v_user_account_id, 'credit', v_reward.amount_base_units);

    INSERT INTO balances (user_id, asset_code, available_base_units, reserved_base_units)
    VALUES (v_user_id, 'VCOIN', v_reward.amount_base_units, 0)
    ON CONFLICT (user_id, asset_code) DO UPDATE
       SET available_base_units = balances.available_base_units + EXCLUDED.available_base_units,
           updated_at = clock_timestamp()
    RETURNING available_base_units INTO v_balance;

    UPDATE mining_rewards
       SET status = 'confirmed',
           confirmed_at = clock_timestamp()
     WHERE id = p_reward_id
       AND status = 'pending';

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Mining reward status changed during confirmation';
    END IF;

    RETURN QUERY
    SELECT 'confirmed'::TEXT, v_reward.id, v_user_id,
           v_reward.amount_base_units,
           v_reserve_result.result_available_base_units,
           v_balance;
END;
$$;

COMMIT;
