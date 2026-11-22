BEGIN;

-- V COIN–TON owner-approved economic revision, effective before Mainnet issuance.
-- New mining reserve cap: 1,050,000,000 VCOIN at six decimals.
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
    RAISE EXCEPTION 'Existing pending/distributed mining rewards exceed the revised 1,050,000,000 VCOIN reserve; reconcile before applying migration';
  END IF;

  UPDATE mining_reserve
     SET allocated_base_units = 1050000000000000,
         updated_at = clock_timestamp()
   WHERE reserve_code = 'USER_MINING';
END;
$$;

-- Reset the modelled reference-price baseline to the approved USD 0.008.
-- Historical candles remain intact; the active schedule restarts from this baseline.
UPDATE price_reference_state
   SET initial_price_usd = 0.008000000000,
       current_price_usd = 0.008000000000,
       last_period_end = clock_timestamp(),
       next_period_at = clock_timestamp() + INTERVAL '72 hours',
       status = 'active',
       updated_at = clock_timestamp()
 WHERE singleton = TRUE;

COMMIT;
