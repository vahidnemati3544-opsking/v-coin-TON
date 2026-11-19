BEGIN;

-- V COIN–TON modelled reference curve: 50% annual compounding over 52 weekly periods.
-- The rounded fixed-point weekly multiplier is 1.007827884862 (12 decimal places).
-- Existing historical candles are preserved; only future schedule parameters change.

ALTER TABLE price_reference_state
    DROP CONSTRAINT IF EXISTS price_reference_state_interval_seconds_check;

ALTER TABLE price_reference_state
    ADD CONSTRAINT price_reference_state_interval_seconds_check
    CHECK (interval_seconds = 604800);

UPDATE price_reference_state
   SET increase_rate_percent = 0.782788486200,
       interval_seconds = 604800,
       next_period_at = last_period_end + INTERVAL '7 days',
       updated_at = clock_timestamp()
 WHERE singleton = TRUE;

COMMIT;
