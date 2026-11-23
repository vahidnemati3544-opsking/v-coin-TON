BEGIN;

-- Current owner-approved V COIN–TON allocation baseline.
-- Fixed total supply: 2,100,000,000 VCOIN (6 decimals; 2,100,000,000,000,000 base units).
-- Mining rewards reserve: 1,050,000,000 VCOIN (50%).
-- Founder: 420,000,000 VCOIN (20%).
-- Treasury, liquidity/market, and ecosystem/marketing: 210,000,000 VCOIN each (10% each).
-- This forward-only migration establishes the current approved allocation amounts.
-- Historical migrations 001 and 005 are retained unchanged for checksum integrity.

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

  IF v_pending + v_distributed > 1050000000000000 THEN
    RAISE EXCEPTION
      'Pending and distributed mining rewards exceed the approved 1,050,000,000 VCOIN mining reserve; reconcile before applying migration';
  END IF;

  UPDATE mining_reserve
     SET allocated_base_units = 1050000000000000,
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
