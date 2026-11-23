'use strict';

const { createHash } = require('node:crypto');
const { Address } = require('@ton/ton');
const { createJettonBalanceReader } = require('./jetton-balance-reader');

const NETWORK_GLOBAL_IDS = Object.freeze({
  mainnet: '-239',
  testnet: '-3'
});

function createWalletSnapshotService({
  pool,
  jettonMasterAddress,
  providerFactory,
  now
}) {
  if (!pool || typeof pool.connect !== 'function' ||
      typeof providerFactory !== 'function') {
    throw new TypeError('PostgreSQL pool and TON provider factory are required.');
  }

  return Object.freeze({
    async capture({ userId, network }) {
      const chainGlobalId = NETWORK_GLOBAL_IDS[network];
      if (!chainGlobalId) {
        const error = new Error('Network must be mainnet or testnet.');
        error.code = 'INVALID_NETWORK';
        throw error;
      }
      if (typeof jettonMasterAddress !== 'string' || jettonMasterAddress.length === 0) {
        const error = new Error('VCOIN Jetton master is not configured.');
        error.code = 'JETTON_MASTER_NOT_CONFIGURED';
        throw error;
      }

      const walletResult = await pool.query(
        "SELECT id, wallet_address FROM wallets " +
        "WHERE user_id = $1 AND network = 'TON' AND chain_global_id = $2 AND is_verified = TRUE",
        [userId, chainGlobalId]
      );
      if (walletResult.rowCount !== 1) {
        const error = new Error('No verified TON wallet exists for this user and network.');
        error.code = 'VERIFIED_WALLET_NOT_FOUND';
        throw error;
      }

      const provider = providerFactory(network);
      const reader = createJettonBalanceReader({
        network,
        jettonMasterAddress,
        provider,
        addressEquals: (left, right) => Address.parse(left).equals(Address.parse(right)),
        ...(typeof now === 'function' ? { now } : {})
      });
      const snapshot = await reader.read(walletResult.rows[0].wallet_address);
      const canonicalPayload = JSON.stringify({
        network: snapshot.network,
        ownerWalletAddress: snapshot.ownerWalletAddress,
        jettonMasterAddress: snapshot.jettonMasterAddress,
        jettonWalletAddress: snapshot.jettonWalletAddress,
        balanceBaseUnits: snapshot.balanceBaseUnits,
        blockSeqno: snapshot.blockSeqno,
        observedAt: snapshot.observedAt,
        isFinal: snapshot.isFinal
      });
      const payloadHash = createHash('sha256').update(canonicalPayload).digest('hex');

      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const inserted = await client.query(
          'INSERT INTO jetton_wallet_balance_snapshots ' +
          '(wallet_id, network, jetton_master_address, owner_wallet_address, jetton_wallet_address, ' +
          'balance_base_units, chain_block_seqno, source, observed_at, finalized_at, is_final, source_payload_sha256) ' +
          "VALUES ($1, $2, $3, $4, $5, $6::numeric, $7, 'ton_rpc', $8::timestamptz, clock_timestamp(), TRUE, $9) " +
          'RETURNING id',
          [
            walletResult.rows[0].id,
            snapshot.network,
            snapshot.jettonMasterAddress,
            snapshot.ownerWalletAddress,
            snapshot.jettonWalletAddress,
            snapshot.balanceBaseUnits,
            snapshot.blockSeqno,
            snapshot.observedAt,
            payloadHash
          ]
        );
        await client.query('COMMIT');
        return Object.freeze({
          snapshotId: inserted.rows[0].id,
          ...snapshot
        });
      } catch (error) {
        try { await client.query('ROLLBACK'); } catch (_) { /* preserve original error */ }
        throw error;
      } finally {
        client.release();
      }
    }
  });
}

module.exports = { createWalletSnapshotService, NETWORK_GLOBAL_IDS };
