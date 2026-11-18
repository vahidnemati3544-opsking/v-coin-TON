BEGIN;

-- Modelled reference-price history. This is NOT an exchange or market price.
CREATE TABLE IF NOT EXISTS price_reference_state (
    singleton BOOLEAN PRIMARY KEY DEFAULT TRUE CHECK (singleton),
    initial_price_usd NUMERIC(24,12) NOT NULL CHECK (initial_price_usd > 0),
    current_price_usd NUMERIC(24,12) NOT NULL CHECK (current_price_usd > 0),
    increase_rate_percent NUMERIC(12,8) NOT NULL CHECK (increase_rate_percent > 0),
    interval_seconds INTEGER NOT NULL CHECK (interval_seconds = 259200),
    last_period_end TIMESTAMPTZ NOT NULL,
    next_period_at TIMESTAMPTZ NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'completed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    CHECK (next_period_at > last_period_end)
);

CREATE TABLE IF NOT EXISTS price_reference_candles (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    period_start TIMESTAMPTZ NOT NULL UNIQUE,
    period_end TIMESTAMPTZ NOT NULL UNIQUE,
    open_usd NUMERIC(24,12) NOT NULL,
    high_usd NUMERIC(24,12) NOT NULL,
    low_usd NUMERIC(24,12) NOT NULL,
    close_usd NUMERIC(24,12) NOT NULL,
    increase_rate_percent NUMERIC(12,8) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    CHECK (period_end > period_start),
    CHECK (high_usd >= GREATEST(open_usd, close_usd)),
    CHECK (low_usd <= LEAST(open_usd, close_usd))
);

CREATE INDEX IF NOT EXISTS idx_price_reference_candles_period
ON price_reference_candles(period_start DESC);

INSERT INTO price_reference_state (
    singleton,
    initial_price_usd,
    current_price_usd,
    increase_rate_percent,
    interval_seconds,
    last_period_end,
    next_period_at,
    status
)
VALUES (
    TRUE,
    0.004000000000,
    0.004000000000,
    0.20410000,
    259200,
    clock_timestamp(),
    clock_timestamp() + INTERVAL '72 hours',
    'active'
)
ON CONFLICT (singleton) DO NOTHING;

COMMIT;
