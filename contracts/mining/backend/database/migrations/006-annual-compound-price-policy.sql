BEGIN;

-- Owner-approved V COIN reference policy: 50% annual compound growth.
-- The model advances in 72-hour periods. This multiplier annualizes to
-- approximately 1.5x over 365 days (rate rounded to 12 decimal places).
UPDATE price_reference_state
   SET increase_rate_percent = 0.33381492,
       updated_at = clock_timestamp()
 WHERE singleton = TRUE;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM price_reference_state WHERE singleton = TRUE) THEN
    RAISE EXCEPTION 'PRICE_REFERENCE_NOT_INITIALIZED before 50 percent annual policy migration';
  END IF;
END;
$$;

COMMIT;
