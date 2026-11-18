'use strict';

const { randomUUID } = require('node:crypto');

const RATE_SCALE = 10n ** 12n;
const REWARD_DENOMINATOR = RATE_SCALE * 1000n;

class MiningError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'MiningError';
    this.code = code;
  }
}

function parseRate(rate) {
  if (typeof rate !== 'string' && typeof rate !== 'number') {
    throw new MiningError('INVALID_RATE', 'Mining rate must be a string or number.');
  }
  const value = String(rate).trim();
  if (!/^(0|[1-9]\d*)(\.\d{1,12})?$/.test(value)) {
    throw new MiningError('INVALID_RATE', 'Mining rate must have up to 12 decimal places.');
  }
  const [whole, fraction = ''] = value.split('.');
  return BigInt(whole) * RATE_SCALE +
    BigInt((fraction + '0'.repeat(12)).slice(0, 12));
}

function calculateReward(rate, elapsedMilliseconds) {
  const scaledRate = typeof rate === 'bigint' ? rate : parseRate(rate);
  let elapsed;
  try { elapsed = BigInt(elapsedMilliseconds); } catch {
    throw new MiningError('INVALID_ELAPSED_TIME', 'Elapsed time must be an integer number of milliseconds.');
  }
  if (scaledRate < 0n || elapsed < 0n) {
    throw new MiningError('INVALID_REWARD_INPUT', 'Reward inputs cannot be negative.');
  }
  return (scaledRate * elapsed) / REWARD_DENOMINATOR;
}

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

function createMiningEngine({ pool, maxClaimIntervalMs = 86400000 }) {
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

  async function accrue(client, userId, session, idempotencyKey) {
    const rateResult = await client.query(
      'SELECT l.mining_rate_base_units_per_second ' +
      'FROM user_levels ul JOIN levels l ON l.level = ul.current_level ' +
      'WHERE ul.user_id = $1',
      [userId]
    );
    if (rateResult.rowCount !== 1) {
      throw new MiningError('USER_LEVEL_NOT_CONFIGURED', 'User level or mining rate is not configured.');
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

    const amount = calculateReward(String(rateResult.rows[0].mining_rate_base_units_per_second), elapsedMs);
    if (amount <= 0n) {
      throw new MiningError('REWARD_TOO_SMALL', 'Accrued reward is below one token base unit.');
    }

    const inserted = await client.query(
      'INSERT INTO mining_rewards ' +
      '(id, user_id, session_id, amount_base_units, reward_type, operation_id, idempotency_key, status) ' +
      "VALUES ($1, $2, $3, $4::numeric, 'mining', $5, $6, 'pending') " +
      'RETURNING id, user_id, session_id, amount_base_units, status, created_at',
      [randomUUID(), userId, session.id, amount.toString(), randomUUID(), idempotencyKey]
    );

    // Reserve every reward against the approved 5B VCOIN mining allocation.
    // This runs inside the same PostgreSQL transaction as reward creation;
    // a missing migration or exhausted reserve therefore rolls back the claim.
    const reservation = await client.query(
      'SELECT result_status, result_reward_id, result_amount_base_units, result_available_base_units ' +
      'FROM reserve_mining_reward($1, $2::numeric, $3)',
      [inserted.rows[0].id, amount.toString(), idempotencyKey]
    );

    if (reservation.rowCount !== 1 ||
        reservation.rows[0].result_status !== 'pending' ||
        String(reservation.rows[0].result_reward_id).toLowerCase() !== String(inserted.rows[0].id).toLowerCase() ||
        BigInt(reservation.rows[0].result_amount_base_units) !== amount) {
      throw new MiningError(
        'MINING_RESERVE_RESERVATION_FAILED',
        'Mining reward could not be reserved against the approved allocation.'
      );
    }

    // Move the reward from reserved mining allocation into the user's
    // internal VCOIN balance using balanced ledger entries. This is not
    // an on-chain transfer. All steps remain in this claim transaction.
    const settlement = await client.query(
      'SELECT result_status, result_reward_id, result_user_id, ' +
      'result_amount_base_units, result_available_base_units, result_balance_base_units ' +
      'FROM confirm_mining_reward_to_internal_balance($1, $2)',
      [inserted.rows[0].id, 'confirm:' + idempotencyKey]
    );

    if (settlement.rowCount !== 1 ||
        !['confirmed', 'duplicate'].includes(settlement.rows[0].result_status) ||
        String(settlement.rows[0].result_reward_id).toLowerCase() !== String(inserted.rows[0].id).toLowerCase() ||
        String(settlement.rows[0].result_user_id).toLowerCase() !== String(userId).toLowerCase() ||
        BigInt(settlement.rows[0].result_amount_base_units) !== amount) {
      throw new MiningError(
        'MINING_LEDGER_SETTLEMENT_FAILED',
        'Mining reward could not be posted to the internal VCOIN balance.'
      );
    }

    await client.query(
      'UPDATE mining_sessions SET last_claim_at = $2, updated_at = $2 ' +
      "WHERE id = $1 AND user_id = $3 AND status = 'active'",
      [session.id, now, userId]
    );

    return {
      ...inserted.rows[0],
      status: 'confirmed',
      reserve_available_base_units: settlement.rows[0].result_available_base_units,
      balance_available_base_units: settlement.rows[0].result_balance_base_units
    };
  }

  async function startSession({ userId }) {
    validateUuid(userId, 'INVALID_USER_ID', 'User ID');
    return withTransaction(pool, async (client) => {
      await lockActiveUser(client, userId);
      const level = await client.query(
        'SELECT l.mining_rate_base_units_per_second ' +
        'FROM user_levels ul JOIN levels l ON l.level = ul.current_level WHERE ul.user_id = $1',
        [userId]
      );
      if (level.rowCount !== 1 ||
          parseRate(String(level.rows[0].mining_rate_base_units_per_second)) <= 0n) {
        throw new MiningError('USER_LEVEL_NOT_CONFIGURED', 'User level or positive mining rate is not configured.');
      }

      const existing = await client.query(
        "SELECT id, user_id, started_at, last_claim_at, status FROM mining_sessions " +
        "WHERE user_id = $1 AND status = 'active' FOR UPDATE",
        [userId]
      );
      if (existing.rowCount === 1) {
        return { ...existing.rows[0], duplicate: true };
      }

      const result = await client.query(
        "INSERT INTO mining_sessions (id, user_id, started_at, last_claim_at, status, created_at, updated_at) " +
        "VALUES ($1, $2, clock_timestamp(), clock_timestamp(), 'active', clock_timestamp(), clock_timestamp()) " +
        'RETURNING id, user_id, started_at, last_claim_at, status',
        [randomUUID(), userId]
      );
      return result.rows[0];
    });
  }

  async function claimReward({ userId, idempotencyKey }) {
    validateUuid(userId, 'INVALID_USER_ID', 'User ID');
    validateIdempotencyKey(idempotencyKey);
    return withTransaction(pool, async (client) => {
      await lockActiveUser(client, userId);
      const duplicate = await client.query(
        'SELECT id, user_id, session_id, amount_base_units, status ' +
        'FROM mining_rewards WHERE idempotency_key = $1',
        [idempotencyKey]
      );
      if (duplicate.rowCount) {
        if (duplicate.rows[0].user_id !== userId) {
          throw new MiningError('IDEMPOTENCY_CONFLICT', 'Idempotency key belongs to another user.');
        }
        return { ...duplicate.rows[0], duplicate: true };
      }

      const result = await client.query(
        "SELECT id, started_at, last_claim_at FROM mining_sessions " +
        "WHERE user_id = $1 AND status = 'active' FOR UPDATE",
        [userId]
      );
      if (result.rowCount !== 1) {
        throw new MiningError('ACTIVE_SESSION_NOT_FOUND', 'User has no active mining session.');
      }
      return accrue(client, userId, result.rows[0], idempotencyKey);
    });
  }

  async function endSession({ userId, sessionId, finalClaimIdempotencyKey }) {
    validateUuid(userId, 'INVALID_USER_ID', 'User ID');
    validateUuid(sessionId, 'INVALID_SESSION_ID', 'Session ID');
    validateIdempotencyKey(finalClaimIdempotencyKey);
    return withTransaction(pool, async (client) => {
      await lockActiveUser(client, userId);
      const result = await client.query(
        "SELECT id, started_at, last_claim_at FROM mining_sessions " +
        "WHERE id = $1 AND user_id = $2 AND status = 'active' FOR UPDATE",
        [sessionId, userId]
      );
      if (result.rowCount !== 1) {
        throw new MiningError('ACTIVE_SESSION_NOT_FOUND', 'Requested active mining session was not found.');
      }
      const duplicate = await client.query(
        'SELECT id FROM mining_rewards WHERE idempotency_key = $1',
        [finalClaimIdempotencyKey]
      );
      if (duplicate.rowCount) {
        throw new MiningError('IDEMPOTENCY_CONFLICT', 'Final claim key has already been used.');
      }

      const finalReward = await accrue(client, userId, result.rows[0], finalClaimIdempotencyKey);
      const updated = await client.query(
        "UPDATE mining_sessions SET status = 'completed', ended_at = clock_timestamp(), " +
        "updated_at = clock_timestamp() WHERE id = $1 AND user_id = $2 AND status = 'active' " +
        'RETURNING id, status, ended_at',
        [sessionId, userId]
      );
      if (updated.rowCount !== 1) {
        throw new MiningError('SESSION_COMPLETION_FAILED', 'Mining session could not be completed.');
      }
      return { session: updated.rows[0], finalReward };
    });
  }

  return Object.freeze({ startSession, claimReward, endSession });
}

module.exports = { MiningError, parseRate, calculateReward, createMiningEngine };
