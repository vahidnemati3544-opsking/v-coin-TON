BEGIN;

ALTER TABLE wallets
  ADD COLUMN IF NOT EXISTS chain_global_id VARCHAR(10);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'wallets_chain_global_id_check'
      AND conrelid = 'wallets'::regclass
  ) THEN
    ALTER TABLE wallets
      ADD CONSTRAINT wallets_chain_global_id_check
      CHECK (chain_global_id IS NULL OR chain_global_id IN ('-239', '-3'));
  END IF;
END $$;

-- A user's Mainnet and Testnet wallet bindings must remain separate.
ALTER TABLE wallets DROP CONSTRAINT IF EXISTS wallets_network_wallet_address_key;
ALTER TABLE wallets DROP CONSTRAINT IF EXISTS wallets_user_id_network_key;

CREATE UNIQUE INDEX IF NOT EXISTS idx_wallets_chain_address_unique
  ON wallets(network, chain_global_id, wallet_address)
  WHERE chain_global_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_wallets_user_chain_unique
  ON wallets(user_id, network, chain_global_id)
  WHERE chain_global_id IS NOT NULL;

COMMIT;
