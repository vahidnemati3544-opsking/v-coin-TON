BEGIN;

-- V COIN–TON owner-approved economic baseline revision.
-- Fixed total supply: 10,000,000,000 VCOIN (6 decimals).
-- Mining allocation: 5,000,000,000 VCOIN.
-- Modelled reference baseline: USD 0.004 per VCOIN.
-- This forward-only migration supersedes the historical 1,050,000,000 mining cap
-- and USD 0.008 reset recorded in migration 005. Historical migrations are immutable.

DO $$
DECLARE
  v_pending NUMERIC(38,0);
  v_distributed NUMERIC(38,0);
BEGIN
  SELECT pending_base_units, distributed_base_units
    INTO STRICT v_pending, v_distributed
    FROM mining_reserve
   WHERE reserve_code = 'USER_MINING'
   FOR UPDATE;

  IF v_pending + v_distributed > 5000000000000000 THEN
    RAISE EXCEPTION
      'Pending and distributed mining rewards exceed the approved 5,000,000,000 VCOIN reserve; reconcile before applying migration';
  END IF;

  UPDATE mining_reserve
     SET allocated_base_units = 5000000000000000,
         updated_at = clock_timestamp()
   WHERE reserve_code = 'USER_MINING';
END;
$$;

UPDATE price_reference_state
   SET initial_price_usd = 0.004000000000,
       current_price_usd = 0.004000000000,
       last_period_end = clock_timestamp(),
       next_period_at = clock_timestamp() + INTERVAL '72 hours',
       status = 'active',
       updated_at = clock_timestamp()
 WHERE singleton = TRUE;

COMMIT;
