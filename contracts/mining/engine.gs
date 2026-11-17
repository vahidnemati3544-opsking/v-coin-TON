'use strict';

const { randomUUID } = require('node:crypto');

const SCALE = 10n ** 12n;
const DENOMINATOR = SCALE * 1000n;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

class MiningError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'MiningError';
    this.code = code;
  }
}

// Rate is expressed in indivisible VCOIN base units per second.
function parseRate(rate) {
  if (typeof rate !== 'string' && typeof rate !== 'number' && typeof rate !== 'bigint') {
    throw new MiningError('INVALID_RATE', 'Mining rate must be a decimal string, number, or bigint.');
  }

  const value = String(rate).trim();
  if (!/^(0|[1-9]\\d*)(\\.\\d{1,12})?$/.test(value)) {
    throw new MiningError('INVALID_RATE', 'Mining rate format is invalid.');
  }

  const [whole, fraction = ''] = value.split('.');
  const scaled = BigInt(whole) * SCALE +
    BigInt((fraction + '0'.repeat(12)).slice(0, 12));

  if (scaled <= 0n) {
    throw new MiningError('INVALID_RATE', 'Mining rate must be greater than zero.');
  }

  return scaled;
}

function calculateReward(rate, elapsedMilliseconds) {
  const scaledRate = typeof rate === 'bigint' ? rate : parseRate(rate);
  let elapsed;

  try {
    elapsed = BigInt(elapsedMilliseconds);
  } catch (_) {
    throw new MiningError('INVALID_REWARD_INPUT', 'Elapsed milliseconds must be an integer.');
  }

  if (scaledRate <= 0n || elapsed < 0n) {
    throw new MiningError('INVALID_REWARD_INPUT', 'Invalid reward calculation input.');
  }

  return (scaledRate * elapsed) / DENOMINATOR;
}

function validateUuid(value, code, label) {
  if (typeof value !== 'string' || !UUID_PATTERN.test(value)) {
    throw new MiningError(code, `A valid ${label} UUID is required.`);
  }
}

function validateIdempotencyKey(key) {
  if (
    typeof key !== 'string' ||
    key.length < 8 ||
    key.length > 150 ||
    !/^[a-zA-Z0-9._:-]+$/.test(key)
  ) {
    throw new MiningError(
      'INVALID_IDEMPOTENCY_KEY',
      'Idempotency key must contain 8 to 150 valid characters.'
    );
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
    try {
      await client.query('ROLLBACK');
    } catch (_) {
      // Keep the original error.
    }
    throw error;
  } finally {
    client.release();
  }
}

function createMiningEngine({ pool, getMiningRate }) {
  if (!pool || typeof pool.connect !== 'function') {
    throw new MiningError('INVALID_DATABASE_POOL', 'A PostgreSQL pool is required.');
  }
  if (typeof getMiningRate !== 'function') {
    throw new MiningError('INVALID_RATE_PROVIDER', 'getMiningRate callback is required.');
  }

  async function lockActiveUser(client, userId) {
    const result = await client.query(
      `SELECT id
         FROM users
        WHERE id = $1
          AND account_status = 'active'
        FOR UPDATE`,
      [userId]
    );
    if (result.rowCount !== 1) {
      throw new MiningError('USER_NOT_ACTIVE', 'User does not exist or is not active.');
    }
  }

  async function findExistingReward(client, userId, idempotencyKey, sessionId = null) {
    const result = await client.query(
      `SELECT id, user_id, session_id, amount_base_units, status
         FROM mining_rewards
        WHERE idempotency_key = $1
        FOR UPDATE`,
      [idempotencyKey]
    );

    if (result.rowCount === 0) return null;
    const reward = result.rows[0];

    if (
      reward.user_id !== userId ||
      (sessionId && reward.session_id !== sessionId)
    ) {
      throw new MiningError(
        'IDEMPOTENCY_CONFLICT',
        'This idempotency key belongs to a different user or mining session.'
      );
    }

    return {
      id: reward.id,
      sessionId: reward.session_id,
      amountBaseUnits: String(reward.amount_base_units),
      status: reward.status,
      duplicate: true
    };
  }

  async function accrue(client, userId, session, idempotencyKey) {
    const existing = await findExistingReward(
      client,
      userId,
      idempotencyKey,
      session.id
    );
    if (existing) return existing;

    const elapsedResult = await client.query(
      `SELECT FLOOR(
                EXTRACT(EPOCH FROM (
                  clock_timestamp() - COALESCE(last_claim_at, started_at)
                )) * 1000
              )::bigint AS elapsed_ms
         FROM mining_sessions
        WHERE id = $1
          AND user_id = $2
          AND status = 'active'
        FOR UPDATE`,
      [session.id, userId]
    );

    if (elapsedResult.rowCount !== 1) {
      throw new MiningError('ACTIVE_SESSION_NOT_FOUND', 'Active mining session was not found.');
    }

    const elapsedMs = elapsedResult.rows[0].elapsed_ms;
    const rate = await getMiningRate(client, userId);
    const amount = calculateReward(rate, elapsedMs);

    if (amount === 0n) {
      return {
        id: null,
        sessionId: session.id,
        amountBaseUnits: '0',
        status: 'no_reward_yet',
        duplicate: false
      };
    }

    const rewardId = randomUUID();
    const operationId = randomUUID();

    await client.query(
      `SELECT *
         FROM reserve_mining_reward($1, $2::numeric, $3)`,
      [rewardId, amount.toString(), idempotencyKey]
    );

    const insertResult = await client.query(
      `INSERT INTO mining_rewards (
         id, user_id, session_id, amount_base_units,
         reward_type, operation_id, idempotency_key, status
       )
       VALUES ($1, $2, $3, $4::numeric, 'mining', $5, $6, 'pending')
       RETURNING id, session_id, amount_base_units, status`,
      [rewardId, userId, session.id, amount.toString(), operationId, idempotencyKey]
    );

    await client.query(
      `UPDATE mining_sessions
          SET last_claim_at = clock_timestamp(),
              updated_at = clock_timestamp()
        WHERE id = $1
          AND user_id = $2
          AND status = 'active'`,
      [session.id, userId]
    );

    const reward = insertResult.rows[0];
    return {
      id: reward.id,
      sessionId: reward.session_id,
      amountBaseUnits: String(reward.amount_base_units),
      status: reward.status,
      duplicate: false
    };
  }

  async function startSession({ userId }) {
    validateUuid(userId, 'INVALID_USER_ID', 'user');
    return withTransaction(pool, async (client) => {
      await lockActiveUser(client, userId);

      const activeResult = await client.query(
        `SELECT id
           FROM mining_sessions
          WHERE user_id = $1
            AND status = 'active'
          FOR UPDATE`,
        [userId]
      );

      if (activeResult.rowCount > 0) {
        throw new MiningError('ACTIVE_SESSION_EXISTS', 'User already has an active mining session.');
      }

      const result = await client.query(
        `INSERT INTO mining_sessions (id, user_id, started_at, status)
         VALUES ($1, $2, clock_timestamp(), 'active')
         RETURNING id, user_id, started_at, status`,
        [randomUUID(), userId]
      );
      return result.rows[0];
    });
  }

  async function claimReward({ userId, idempotencyKey }) {
    validateUuid(userId, 'INVALID_USER_ID', 'user');
    validateIdempotencyKey(idempotencyKey);

    return withTransaction(pool, async (client) => {
      await lockActiveUser(client, userId);

      const previous = await findExistingReward(client, userId, idempotencyKey);
      if (previous) return previous;

      const sessionResult = await client.query(
        `SELECT id, started_at, last_claim_at
           FROM mining_sessions
          WHERE user_id = $1
            AND status = 'active'
          ORDER BY started_at DESC
          LIMIT 1
          FOR UPDATE`,
        [userId]
      );

      if (sessionResult.rowCount !== 1) {
        throw new MiningError('ACTIVE_SESSION_NOT_FOUND', 'User has no active mining session.');
      }

      return accrue(client, userId, sessionResult.rows[0], idempotencyKey);
    });
  }

  async function endSession({ userId, sessionId, finalClaimIdempotencyKey }) {
    validateUuid(userId, 'INVALID_USER_ID', 'user');
    validateUuid(sessionId, 'INVALID_SESSION_ID', 'session');
    validateIdempotencyKey(finalClaimIdempotencyKey);

    return withTransaction(pool, async (client) => {
      await lockActiveUser(client, userId);

      const sessionResult = await client.query(
        `SELECT id, started_at, last_claim_at
           FROM mining_sessions
          WHERE id = $1
            AND user_id = $2
            AND status = 'active'
          FOR UPDATE`,
        [sessionId, userId]
      );

      if (sessionResult.rowCount !== 1) {
        throw new MiningError('ACTIVE_SESSION_NOT_FOUND', 'Requested active mining session was not found.');
      }

      const finalReward = await accrue(
        client,
        userId,
        sessionResult.rows[0],
        finalClaimIdempotencyKey
      );

      const updateResult = await client.query(
        `UPDATE mining_sessions
            SET status = 'completed',
                ended_at = clock_timestamp(),
                updated_at = clock_timestamp()
          WHERE id = $1
            AND user_id = $2
            AND status = 'active'
          RETURNING id, status, ended_at`,
        [sessionId, userId]
      );

      if (updateResult.rowCount !== 1) {
        throw new MiningError('SESSION_COMPLETION_FAILED', 'Mining session could not be completed.');
      }

      return { session: updateResult.rows[0], finalReward };
    });
  }

  return Object.freeze({ startSession, claimReward, endSession });
}

module.exports = {
  MiningError,
  parseRate,
  calculateReward,
  createMiningEngine
};
