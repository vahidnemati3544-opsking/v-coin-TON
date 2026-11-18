-- V COIN–TON migration 003
-- Freeze the eligible balance at each mining interval boundary.
ALTER TABLE mining_sessions
  ADD COLUMN IF NOT EXISTS rate_balance_base_units NUMERIC(38,0);

-- Existing active sessions start the new rule from their current available balance.
UPDATE mining_sessions ms
SET rate_balance_base_units = COALESCE((
  SELECT b.available_base_units
  FROM balances b
  WHERE b.user_id = ms.user_id AND b.asset_code = 'VCOIN'
), 0)
WHERE ms.status = 'active' AND ms.rate_balance_base_units IS NULL;

-- New and active sessions must always have a non-negative snapshot.
ALTER TABLE mining_sessions
  ADD CONSTRAINT mining_sessions_rate_balance_nonnegative
  CHECK (rate_balance_base_units IS NULL OR rate_balance_base_units >= 0);
