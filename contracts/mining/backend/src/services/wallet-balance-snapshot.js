'use strict';

const { createHash } = require('node:crypto');
const { normalizeTonAddress } = require('./toncenter-balance-provider');

class WalletSnapshotError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'WalletSnapshotError';
    this.code = code;
  }
}

function assertVerifiedWalletLink(wallet, { userId, expectedNetwork, nowMs }) {
  if (!wallet || String(wallet.user_id) !== String(userId)) {
    throw new WalletSnapshotError('WALLET_LINK_NOT_FOUND', 'Verified TON wallet link was not found.');
  }
  if (wallet.revoked_at) {
    throw new WalletSnapshotError('WALLET_LINK_REVOKED', 'TON wallet link has been revoked.');
  }
  if (wallet.is_verified !== true || !wallet.proof_verified_at || !wallet.proof_expires_at) {
    throw new WalletSnapshotError('WALLET_LINK_NOT_VERIFIED', 'TON wallet ownership proof is not verified.');
  }
  if (new Date(wallet.proof_expires_at).getTime() <= nowMs) {
    throw new WalletSnapshotError('WALLET_LINK_EXPIRED', 'TON wallet ownership proof has expired.');
  }
  if (wallet.chain_network !== expectedNetwork) {
    throw new WalletSnapshotError('WALLET_NETWORK_MISMATCH', 'TON wallet network does not match the configured mining network.');
  }
  return normalizeTonAddress(wallet.wallet_address);
}

function createWalletBalanceSnapshotService({
  pool,
  provider,
  expectedNetwork,
  expectedMasterAddress,
  now = () => Date.now(),
  maxSnapshotAgeSeconds = 30
}) {
  if (!pool || typeof pool.query !== 'function' || typeof pool.connect !== 'function') {
    throw new WalletSnapshotError('DATABASE_UNAVAILABLE', 'A PostgreSQL pool with transaction support is required.');
  }
  if (!provider || typeof provider.getVerifiedBalance !== 'function') {
    throw new WalletSnapshotError('BALANCE_PROVIDER_UNAVAILABLE', 'A verified Jetton balance provider is required.');
  }
  if (!['mainnet', 'testnet'].includes(expectedNetwork)) {
    throw new WalletSnapshotError('INVALID_TON_NETWORK', 'Expected network must be mainnet or testnet.');
  }

  const normalizedMasterAddress = normalizeTonAddress(expectedMasterAddress);

  async function captureSnapshot({ userId, walletId }) {
    if (!userId || !walletId) {
      throw new WalletSnapshotError('INVALID_WALLET_REFERENCE', 'userId and walletId are required.');
    }

    const nowMs = now();
    const selectWalletSql = [
      'SELECT id, user_id, wallet_address, chain_network, is_verified,',
      'proof_verified_at, proof_expires_at, revoked_at',
      'FROM wallets WHERE id = $1 AND user_id = $2 LIMIT 1'
    ].join(' ');
    const initialResult = await pool.query(selectWalletSql, [walletId, userId]);
    const initialWallet = initialResult.rows?.[0];
    const initialOwnerAddress = assertVerifiedWalletLink(initialWallet, {
      userId,
      expectedNetwork,
      nowMs
    });

    const snapshot = await provider.getVerifiedBalance({
      ownerAddress: initialWallet.wallet_address
    });

    if (
      snapshot.network !== expectedNetwork ||
      snapshot.ownerAddress !== initialOwnerAddress ||
      snapshot.masterAddress !== normalizedMasterAddress ||
      snapshot.source !== 'toncenter-v3-indexer'
    ) {
      throw new WalletSnapshotError('BALANCE_SNAPSHOT_IDENTITY_MISMATCH', 'Balance snapshot identity, network, Master or source is invalid.');
    }

    const observedAtMs = new Date(snapshot.observedAt).getTime();
    if (
      !Number.isFinite(observedAtMs) ||
      observedAtMs > nowMs + 5000 ||
      nowMs - observedAtMs > maxSnapshotAgeSeconds * 1000
    ) {
      throw new WalletSnapshotError('BALANCE_SNAPSHOT_STALE', 'Jetton balance snapshot is outside the allowed observation window.');
    }

    const sourcePayloadHash = createHash('sha256')
      .update(JSON.stringify(snapshot))
      .digest('hex');

    const client = await pool.connect();
    let transactionOpen = false;
    try {
      await client.query('BEGIN');
      transactionOpen = true;

      const lockedResult = await client.query(
        selectWalletSql.replace(' LIMIT 1', ' FOR UPDATE'),
        [walletId, userId]
      );
      const lockedWallet = lockedResult.rows?.[0];
      const lockedOwnerAddress = assertVerifiedWalletLink(lockedWallet, {
        userId,
        expectedNetwork,
        nowMs: now()
      });
      if (lockedOwnerAddress !== snapshot.ownerAddress) {
        throw new WalletSnapshotError('WALLET_OWNER_CHANGED', 'TON wallet link changed during balance verification.');
      }

      const insertSql = [
        'INSERT INTO wallet_balance_snapshots (',
        'wallet_id, chain_network, master_address, jetton_wallet_address,',
        'balance_base_units, last_transaction_lt, indexer_masterchain_seqno,',
        'indexer_block_utime, indexer_lag_seconds, source, source_payload_hash, observed_at',
        ') VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)',
        'ON CONFLICT (wallet_id, master_address, indexer_masterchain_seqno, last_transaction_lt)',
        'DO NOTHING',
        'RETURNING id, wallet_id, chain_network, master_address, jetton_wallet_address,',
        'balance_base_units, last_transaction_lt, indexer_masterchain_seqno,',
        'indexer_block_utime, indexer_lag_seconds, source, source_payload_hash, observed_at'
      ].join(' ');
      const insertResult = await client.query(insertSql, [
        walletId,
        snapshot.network,
        snapshot.masterAddress,
        snapshot.jettonWalletAddress,
        snapshot.balanceBaseUnits,
        snapshot.lastTransactionLt,
        snapshot.indexerMasterchainSeqno,
        snapshot.indexerBlockUtime,
        snapshot.indexerLagSeconds,
        snapshot.source,
        sourcePayloadHash,
        snapshot.observedAt
      ]);

      await client.query('COMMIT');
      transactionOpen = false;

      if (insertResult.rows?.[0]) {
        return insertResult.rows[0];
      }

      const existingSql = [
        'SELECT id, wallet_id, chain_network, master_address, jetton_wallet_address,',
        'balance_base_units, last_transaction_lt, indexer_masterchain_seqno,',
        'indexer_block_utime, indexer_lag_seconds, source, source_payload_hash, observed_at',
        'FROM wallet_balance_snapshots',
        'WHERE wallet_id = $1 AND master_address = $2',
        'AND indexer_masterchain_seqno = $3 AND last_transaction_lt = $4 LIMIT 1'
      ].join(' ');
      const existingResult = await pool.query(existingSql, [
        walletId,
        snapshot.masterAddress,
        snapshot.indexerMasterchainSeqno,
        snapshot.lastTransactionLt
      ]);
      if (!existingResult.rows?.[0]) {
        throw new WalletSnapshotError('SNAPSHOT_PERSISTENCE_FAILED', 'Snapshot insert was not persisted or could not be retrieved.');
      }
      return existingResult.rows[0];
    } catch (error) {
      if (transactionOpen) {
        await client.query('ROLLBACK').catch(() => {});
      }
      throw error;
    } finally {
      client.release();
    }
  }

  return Object.freeze({ captureSnapshot });
}

module.exports = {
  WalletSnapshotError,
  assertVerifiedWalletLink,
  createWalletBalanceSnapshotService
};
