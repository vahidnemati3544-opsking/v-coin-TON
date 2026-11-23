BEGIN;

ALTER TABLE mining_sessions
  ADD COLUMN IF NOT EXISTS rate_wallet_snapshot_id UUID
    REFERENCES jetton_wallet_balance_snapshots(id),
  ADD COLUMN IF NOT EXISTS wallet_chain_global_id VARCHAR(10);

ALTER TABLE mining_rewards
  ADD COLUMN IF NOT EXISTS start_wallet_snapshot_id UUID
    REFERENCES jetton_wallet_balance_snapshots(id),
  ADD COLUMN IF NOT EXISTS end_wallet_snapshot_id UUID
    REFERENCES jetton_wallet_balance_snapshots(id),
  ADD COLUMN IF NOT EXISTS eligible_wallet_balance_base_units NUMERIC(38,0);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'mining_sessions_wallet_snapshot_pair_check'
      AND conrelid = 'mining_sessions'::regclass
  ) THEN
    ALTER TABLE mining_sessions
      ADD CONSTRAINT mining_sessions_wallet_snapshot_pair_check
      CHECK (
        (rate_wallet_snapshot_id IS NULL AND wallet_chain_global_id IS NULL)
        OR
        (rate_wallet_snapshot_id IS NOT NULL AND wallet_chain_global_id IS NOT NULL AND wallet_chain_global_id IN ('-239', '-3'))
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'mining_rewards_wallet_snapshot_basis_check'
      AND conrelid = 'mining_rewards'::regclass
  ) THEN
    ALTER TABLE mining_rewards
      ADD CONSTRAINT mining_rewards_wallet_snapshot_basis_check
      CHECK (
        (
          start_wallet_snapshot_id IS NULL
          AND end_wallet_snapshot_id IS NULL
          AND eligible_wallet_balance_base_units IS NULL
        )
        OR
        (
          start_wallet_snapshot_id IS NOT NULL
          AND end_wallet_snapshot_id IS NOT NULL
          AND eligible_wallet_balance_base_units IS NOT NULL
          AND eligible_wallet_balance_base_units >= 0
        )
      );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_mining_sessions_wallet_snapshot
  ON mining_sessions(rate_wallet_snapshot_id)
  WHERE rate_wallet_snapshot_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_mining_rewards_wallet_snapshot_basis
  ON mining_rewards(start_wallet_snapshot_id, end_wallet_snapshot_id)
  WHERE start_wallet_snapshot_id IS NOT NULL;

COMMIT;
