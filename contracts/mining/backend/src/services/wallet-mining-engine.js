'use strict';

const { randomUUID } = require('node:crypto');
const { MiningError, calculateBalanceReward } = require('../../../engine');

const NETWORKS = Object.freeze({
  mainnet: { globalId: '-239', snapshotName: 'mainnet' },
  testnet: { globalId: '-3', snapshotName: 'testnet' }
});

const MAX_SNAPSHOT_AGE_SECONDS = 120;

function validateUuid(value, code, label) {
  if (typeof value !== 'string' ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
    throw new MiningError(code, label + ' must be a valid UUID.');
  }
}

function validateIdempotencyKey(key) {
  if (typeof key !== 'string' || key.length < 8 || key.length > 150 ||
      !/^[a-zA-Z0-9._:-]+$/.test(key)) {
    throw new MiningError('INVALID_IDEMPOTENCY_KEY', 'Idempotency key must contain 8 to 150 valid characters.');
  }
}

async function withTransaction(pool, callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch (_) { /* preserve original error */ }
    throw error;
  } finally {
    client.release();
  }
}

function createWalletMiningEngine({
  pool,
  jettonMasterAddresses,
  maxClaimIntervalMs = 86400000
}) {
  if (!pool || typeof pool.connect !== 'function') {
    throw new MiningError('INVALID_DATABASE_POOL', 'A PostgreSQL pool is required.');
  }
  if (!Number.isSafeInteger(maxClaimIntervalMs) || maxClaimIntervalMs <= 0) {
    throw new MiningError('INVALID_CLAIM_INTERVAL', 'Maximum claim interval must be a positive integer.');
  }

  async function lockActiveUser(client, userId) {
    const result = await client.query(
      'SELECT id, account_status FROM users WHERE id = $1 FOR UPDATE',
      [userId]
    );
    if (result.rowCount !== 1) throw new MiningError('USER_NOT_FOUND', 'User does not exist.');
    if (result.rows[0].account_status !== 'active') {
      throw new MiningError('USER_NOT_ACTIVE', 'User account is not active.');
    }
  }

  async function loadWalletSnapshot(client, { userId, snapshotId, network, requireFresh }) {
    const networkConfig = NETWORKS[network];
    const expectedMaster = jettonMasterAddresses && jettonMasterAddresses[network];
    if (typeof expectedMaster !== 'string' || expectedMaster.length === 0) {
      throw new MiningError('JETTON_MASTER_NOT_CONFIGURED', 'The approved VCOIN Jetton master is not configured for this mining network.');
    }
    if (!networkConfig) {
      throw new MiningError('INVALID_NETWORK', 'Network must be mainnet or testnet.');
    }
    const freshnessClause = requireFresh
      ? "AND s.observed_at >= clock_timestamp() - ($6 * INTERVAL '1 second') " +
        "AND s.observed_at <= clock_timestamp() + INTERVAL '30 seconds'"
      : '';
    const values = [snapshotId, userId, networkConfig.globalId, networkConfig.snapshotName, expectedMaster];
    if (requireFresh) values.push(MAX_SNAPSHOT_AGE_SECONDS);
    const result = await client.query(
      'SELECT s.id, s.balance_base_units::text AS balance_base_units, s.network, ' +
      's.jetton_master_address, s.owner_wallet_address, s.jetton_wallet_address, ' +
      's.observed_at, s.finalized_at, s.is_final, w.id AS wallet_id ' +
      'FROM jetton_wallet_balance_snapshots s ' +
      'JOIN wallets w ON w.id = s.wallet_id ' +
      "WHERE s.id = $1 AND w.user_id = $2 AND w.network = 'TON' " +
      'AND w.chain_global_id = $3 AND w.is_verified = TRUE AND s.network = $4 ' +
      'AND s.jetton_master_address = $5 AND s.owner_wallet_address = w.wallet_address ' +
      "AND s.source = 'ton_rpc' AND s.source_payload_sha256 IS NOT NULL " +
      'AND s.is_final = TRUE AND s.finalized_at IS NOT NULL ' +
      freshnessClause +
      ' FOR SHARE OF s, w',
      values
    );
    if (result.rowCount !== 1) {
      throw new MiningError(
        requireFresh ? 'WALLET_SNAPSHOT_STALE_OR_INVALID' : 'WALLET_SNAPSHOT_NOT_FOUND',
        requireFresh
          ? 'A fresh finalized on-chain wallet snapshot is required.'
          : 'The mining session wallet snapshot could not be verified.'
      );
    }
    return result.rows[0];
  }

  async function startSession({ userId, network, snapshotId }) {
    validateUuid(userId, 'INVALID_USER_ID', 'User ID');
    validateUuid(snapshotId, 'INVALID_WALLET_SNAPSHOT_ID', 'Wallet snapshot ID');
    if (!NETWORKS[network]) throw new MiningError('INVALID_NETWORK', 'Network must be mainnet or testnet.');

    return withTransaction(pool, async (client) => {
      await lockActiveUser(client, userId);
      const existing = await client.query(
        "SELECT id, user_id, started_at, last_claim_at, rate_balance_base_units, " +
        "rate_wallet_snapshot_id, wallet_chain_global_id, status " +
        "FROM mining_sessions WHERE user_id = $1 AND status = 'active' FOR UPDATE",
        [userId]
      );
      if (existing.rowCount === 1) {
        if (existing.rows[0].wallet_chain_global_id !== NETWORKS[network].globalId) {
          throw new MiningError('ACTIVE_SESSION_NETWORK_CONFLICT', 'An active mining session already exists on another TON network.');
        }
        if (!existing.rows[0].rate_wallet_snapshot_id) {
          throw new MiningError('WALLET_BACKED_SESSION_REQUIRED', 'An existing legacy mining session must be closed before wallet-backed mining can start.');
        }
        return { ...existing.rows[0], duplicate: true };
      }

      const level = await client.query(
        'SELECT current_level FROM user_levels WHERE user_id = $1',
        [userId]
      );
      if (level.rowCount !== 1 || level.rows[0].current_level < 1 || level.rows[0].current_level > 400) {
        throw new MiningError('USER_LEVEL_NOT_CONFIGURED', 'User level is not configured.');
      }

      const snapshot = await loadWalletSnapshot(client, {
        userId,
        snapshotId,
        network,
        requireFresh: true
      });
      const balance = BigInt(snapshot.balance_base_units);
      if (balance <= 0n) {
        throw new MiningError('INSUFFICIENT_MINING_BALANCE', 'A positive verified VCOIN Jetton balance is required for mining.');
      }

      const inserted = await client.query(
        "INSERT INTO mining_sessions (id, user_id, started_at, last_claim_at, rate_balance_base_units, " +
        "rate_wallet_snapshot_id, wallet_chain_global_id, status, created_at, updated_at) " +
        "VALUES ($1, $2, clock_timestamp(), clock_timestamp(), $3::numeric, $4, $5, 'active', clock_timestamp(), clock_timestamp()) " +
        'RETURNING id, user_id, started_at, last_claim_at, rate_balance_base_units, ' +
        'rate_wallet_snapshot_id, wallet_chain_global_id, status',
        [randomUUID(), userId, balance.toString(), snapshot.id, NETWORKS[network].globalId]
      );
      return inserted.rows[0];
    });
  }

  async function claimReward({ userId, network, snapshotId, idempotencyKey }) {
    validateUuid(userId, 'INVALID_USER_ID', 'User ID');
    validateUuid(snapshotId, 'INVALID_WALLET_SNAPSHOT_ID', 'Wallet snapshot ID');
    validateIdempotencyKey(idempotencyKey);
    if (!NETWORKS[network]) throw new MiningError('INVALID_NETWORK', 'Network must be mainnet or testnet.');

    return withTransaction(pool, async (client) => {
      await lockActiveUser(client, userId);
      const duplicate = await client.query(
        'SELECT id, user_id, session_id, amount_base_units, status, ' +
        'start_wallet_snapshot_id, end_wallet_snapshot_id, eligible_wallet_balance_base_units ' +
        'FROM mining_rewards WHERE idempotency_key = $1',
        [idempotencyKey]
      );
      if (duplicate.rowCount) {
        if (String(duplicate.rows[0].user_id).toLowerCase() !== String(userId).toLowerCase()) {
          throw new MiningError('IDEMPOTENCY_CONFLICT', 'Idempotency key belongs to another user.');
        }
        return { ...duplicate.rows[0], duplicate: true };
      }

      const sessionResult = await client.query(
        "SELECT id, started_at, last_claim_at, rate_balance_base_units, " +
        "rate_wallet_snapshot_id, wallet_chain_global_id " +
        "FROM mining_sessions WHERE user_id = $1 AND status = 'active' FOR UPDATE",
        [userId]
      );
      if (sessionResult.rowCount !== 1) {
        throw new MiningError('ACTIVE_SESSION_NOT_FOUND', 'User has no active mining session.');
      }
      const session = sessionResult.rows[0];
      if (!session.rate_wallet_snapshot_id ||
          session.wallet_chain_global_id !== NETWORKS[network].globalId) {
        throw new MiningError('WALLET_BACKED_SESSION_REQUIRED', 'An active wallet-backed mining session on the selected network is required.');
      }

      const startSnapshot = await loadWalletSnapshot(client, {
        userId,
        snapshotId: session.rate_wallet_snapshot_id,
        network,
        requireFresh: false
      });
      const endSnapshot = await loadWalletSnapshot(client, {
        userId,
        snapshotId,
        network,
        requireFresh: true
      });
      if (startSnapshot.wallet_id !== endSnapshot.wallet_id ||
          startSnapshot.jetton_master_address !== endSnapshot.jetton_master_address) {
        throw new MiningError('WALLET_SNAPSHOT_IDENTITY_CHANGED', 'Wallet or Jetton master changed during the mining interval.');
      }
      if (BigInt(session.rate_balance_base_units) !== BigInt(startSnapshot.balance_base_units)) {
        throw new MiningError('WALLET_SNAPSHOT_BASIS_MISMATCH', 'Mining session balance does not match its recorded on-chain snapshot.');
      }

      const clock = await client.query('SELECT clock_timestamp() AS now');
      const now = new Date(clock.rows[0].now);
      const lastClaim = new Date(session.last_claim_at || session.started_at);
      const elapsedMs = now.getTime() - lastClaim.getTime();
      if (!Number.isFinite(elapsedMs) || elapsedMs < 0) {
        throw new MiningError('INVALID_SESSION_TIME', 'Mining session timestamps are invalid.');
      }
      if (elapsedMs > maxClaimIntervalMs) {
        throw new MiningError('CLAIM_INTERVAL_EXCEEDED', 'Mining claim interval exceeded the configured maximum.');
      }

      const startBalance = BigInt(startSnapshot.balance_base_units);
      const endBalance = BigInt(endSnapshot.balance_base_units);
      // Conservative interval basis: the lower of the finalized start/end balances.
      // Deposits during the interval cannot be rewarded retroactively; withdrawals
      // reduce the eligible amount for that interval.
      const eligibleBalance = startBalance < endBalance ? startBalance : endBalance;
      if (eligibleBalance <= 0n) {
        throw new MiningError('INSUFFICIENT_MINING_BALANCE', 'A positive VCOIN Jetton balance is required for this mining interval.');
      }

      const amount = calculateBalanceReward(eligibleBalance, elapsedMs);
      if (amount <= 0n) {
        throw new MiningError('REWARD_TOO_SMALL', 'Accrued reward is below one token base unit.');
      }

      const rewardId = randomUUID();
      const operationId = randomUUID();
      const inserted = await client.query(
        'INSERT INTO mining_rewards ' +
        '(id, user_id, session_id, amount_base_units, reward_type, operation_id, idempotency_key, status, ' +
        'start_wallet_snapshot_id, end_wallet_snapshot_id, eligible_wallet_balance_base_units) ' +
        "VALUES ($1, $2, $3, $4::numeric, 'mining', $5, $6, 'pending', $7, $8, $9::numeric) " +
        'RETURNING id, user_id, session_id, amount_base_units, status, created_at, ' +
        'start_wallet_snapshot_id, end_wallet_snapshot_id, eligible_wallet_balance_base_units',
        [
          rewardId,
          userId,
          session.id,
          amount.toString(),
          operationId,
          idempotencyKey,
          startSnapshot.id,
          endSnapshot.id,
          eligibleBalance.toString()
        ]
      );

      const reservation = await client.query(
        'SELECT result_status, result_reward_id, result_amount_base_units, result_available_base_units ' +
        'FROM reserve_mining_reward($1, $2::numeric, $3)',
        [rewardId, amount.toString(), idempotencyKey]
      );
      if (reservation.rowCount !== 1 ||
          reservation.rows[0].result_status !== 'pending' ||
          String(reservation.rows[0].result_reward_id).toLowerCase() !== rewardId.toLowerCase() ||
          BigInt(reservation.rows[0].result_amount_base_units) !== amount) {
        throw new MiningError('MINING_RESERVE_RESERVATION_FAILED', 'Mining reward could not be reserved against the approved allocation.');
      }

      const settlement = await client.query(
        'SELECT result_status, result_reward_id, result_user_id, result_amount_base_units, ' +
        'result_available_base_units, result_balance_base_units ' +
        'FROM confirm_mining_reward_to_internal_balance($1, $2)',
        [rewardId, 'confirm:' + idempotencyKey]
      );
      if (settlement.rowCount !== 1 ||
          !['confirmed', 'duplicate'].includes(settlement.rows[0].result_status) ||
          String(settlement.rows[0].result_reward_id).toLowerCase() !== rewardId.toLowerCase() ||
          String(settlement.rows[0].result_user_id).toLowerCase() !== userId.toLowerCase() ||
          BigInt(settlement.rows[0].result_amount_base_units) !== amount) {
        throw new MiningError('MINING_LEDGER_SETTLEMENT_FAILED', 'Mining reward could not be posted to the internal VCOIN balance.');
      }

      await client.query(
        'UPDATE mining_sessions SET last_claim_at = $2, rate_balance_base_units = $3::numeric, ' +
        'rate_wallet_snapshot_id = $4, updated_at = $2 ' +
        "WHERE id = $1 AND user_id = $5 AND status = 'active'",
        [session.id, now, endBalance.toString(), endSnapshot.id, userId]
      );

      return {
        ...inserted.rows[0],
        status: 'confirmed',
        eligible_wallet_balance_base_units: eligibleBalance.toString(),
        reserve_available_base_units: settlement.rows[0].result_available_base_units,
        balance_available_base_units: settlement.rows[0].result_balance_base_units
      };
    });
  }

  return Object.freeze({ startSession, claimReward });
}

module.exports = { createWalletMiningEngine, NETWORKS };
