BEGIN;

CREATE TABLE IF NOT EXISTS price_reference_state (
    singleton BOOLEAN PRIMARY KEY DEFAULT TRUE CHECK (singleton = TRUE),
    initial_price_usd NUMERIC(24,12) NOT NULL CHECK (initial_price_usd > 0),
    current_price_usd NUMERIC(24,12) NOT NULL CHECK (current_price_usd > 0),
    increase_rate_percent NUMERIC(10,8) NOT NULL CHECK (increase_rate_percent >= 0),
    interval_seconds INTEGER NOT NULL CHECK (interval_seconds > 0),
    last_period_end TIMESTAMPTZ,
    next_period_at TIMESTAMPTZ,
    status VARCHAR(20) NOT NULL DEFAULT 'idle'
        CHECK (status IN ('idle', 'active', 'paused', 'completed')),
    started_at TIMESTAMPTZ,
    last_resumed_at TIMESTAMPTZ,
    accumulated_active_seconds BIGINT NOT NULL DEFAULT 0 CHECK (accumulated_active_seconds >= 0),
    candles_generated BIGINT NOT NULL DEFAULT 0 CHECK (candles_generated >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

CREATE TABLE IF NOT EXISTS price_reference_candles (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    open_usd NUMERIC(24,12) NOT NULL,
    high_usd NUMERIC(24,12) NOT NULL,
    low_usd NUMERIC(24,12) NOT NULL,
    close_usd NUMERIC(24,12) NOT NULL,
    increase_rate_percent NUMERIC(10,8) NOT NULL,
    candle_type VARCHAR(30) NOT NULL DEFAULT 'modelled_reference',
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    CHECK (period_end > period_start),
    UNIQUE (period_start)
);

CREATE INDEX IF NOT EXISTS idx_price_reference_candles_period
    ON price_reference_candles(period_start DESC);

CREATE TABLE IF NOT EXISTS price_reference_admin_audit (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    actor VARCHAR(100) NOT NULL,
    action VARCHAR(20) NOT NULL
        CHECK (action IN ('start', 'pause', 'resume', 'finish')),
    previous_status VARCHAR(20) NOT NULL,
    new_status VARCHAR(20) NOT NULL,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    details JSONB NOT NULL DEFAULT '{}'::jsonb
);

INSERT INTO price_reference_state (
    singleton, initial_price_usd, current_price_usd,
    increase_rate_percent, interval_seconds, status
)
VALUES (TRUE, 0.004000000000, 0.004000000000, 1.00000000, 259200, 'idle')
ON CONFLICT (singleton) DO NOTHING;

DO $$
DECLARE
    configured_rate NUMERIC(10,8);
    configured_interval INTEGER;
    configured_initial NUMERIC(24,12);
BEGIN
    SELECT increase_rate_percent, interval_seconds, initial_price_usd
      INTO STRICT configured_rate, configured_interval, configured_initial
      FROM price_reference_state
     WHERE singleton = TRUE
     FOR UPDATE;

    IF configured_rate <> 1.00000000
       OR configured_interval <> 259200
       OR configured_initial <> 0.004000000000 THEN
        RAISE EXCEPTION 'Existing price reference configuration conflicts with the approved V COIN model';
    END IF;
END;
$$;

COMMIT;
