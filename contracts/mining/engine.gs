'use strict';

const { randomUUID } = require('node:crypto');

const SCALE = 10n ** 12n;
const DENOMINATOR = SCALE * 1000n;

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
  const elapsed = BigInt(elapsedMilliseconds);

  if (scaledRate <= 0n || elapsed < 0n) {
    throw new MiningError('INVALID_REWARD_INPUT', 'Invalid reward calculation input.');
  }

  return (scaledRate * elapsed) / DENOMINATOR;
}

function validateUserId(userId) {
  if (
    typeof userId !== 'string' ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)
  ) {
    throw new MiningError('INVALID_USER_ID', 'A valid user UUID is required.');
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
      // Preserve the original transaction error.
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

  async function lockUser(client, userId) {
    const result = await client.query(
      'SELECT id FROM users WHERE id = $1 FOR UPDATE',
      [userId]
    );

    if (result.rowCount !== 1) {
      throw new MiningError('USER_NOT_FOUND', 'User does not exist.');
    }
  }

  async function getExistingReward(client, userId, sessionId, key) {
    const result = await client.query(
      SELECT id, user_id, session_id, amount_base_units, status
         FROM mining_rewards
        WHERE idempotency_key = $1,
      [key]
    );

    if (result.rowCount === 0) return null;

    const reward = result.rows[0];

    if (
      reward.user_id !== userId ||
      reward.session_id !== sessionId
    ) {
      throw new MiningError(
        'IDEMPOTENCY_CONFLICT',
        'This idempotency key belongs to another mining session.'
      );
    }

    return {
      id: reward.id,
      amountBaseUnits: reward.amount_base_units,
      status: reward.status,
      duplicate: true
    };
  }
  if (activeResult.rowCount > 0) {
        throw new MiningError(
          'ACTIVE_SESSION_EXISTS',
          'User already has an active mining session.'
        );
      }

      const sessionId = randomUUID();

      const result = await client.query(
        INSERT INTO mining_sessions (
           id,
           user_id,
           started_at,
           last_claim_at,
           status,
           created_at,
           updated_at
         )
         VALUES (
           $1,
           $2,
           clock_timestamp(),
           NULL,
           'active',
           clock_timestamp(),
           clock_timestamp()
         )
         RETURNING id, user_id, started_at, status,
        [sessionId, userId]
      );

      return result.rows[0];
    });
  }
async function claimReward({ userId, idempotencyKey }) {
    validateUserId(userId);
    validateIdempotencyKey(idempotencyKey);

    return withTransaction(pool, async (client) => {
      await lockUser(client, userId);

      const sessionResult = await client.query(
        SELECT id
           FROM mining_sessions
          WHERE user_id = $1
            AND status = 'active'
          LIMIT 1
          FOR UPDATE,
        [userId]
      );

      if (sessionResult.rowCount !== 1) {
        throw new MiningError(
          'ACTIVE_SESSION_NOT_FOUND',
          'User has no active mining session.'
        );
      }

      return accrue(
        client,
        userId,
        sessionResult.rows[0].id,
        idempotencyKey
      );
    });
  }

  async function endSession({
    userId,
    sessionId,
    finalClaimIdempotencyKey
  }) {
    validateUserId(userId);
    validateIdempotencyKey(finalClaimIdempotencyKey);

    if (
      typeof sessionId !== 'string' ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sessionId)
    ) {
      throw new MiningError(
        'INVALID_SESSION_ID',
        'A valid session UUID is required.'
      );
    }

    return withTransaction(pool, async (client) => {
      await lockUser(client, userId);

      const sessionResult = await client.query(
        SELECT id
           FROM mining_sessions
          WHERE id = $1
            AND user_id = $2
            AND status = 'active'
          FOR UPDATE,
        [sessionId, userId]
      );

      if (sessionResult.rowCount !== 1) {
        throw new MiningError(
          'ACTIVE_SESSION_NOT_FOUND',
          'The requested active mining session was not found.'
        );
      }

      const previousFinalReward = await client.query(
        SELECT id
           FROM mining_rewards
          WHERE idempotency_key = $1,
        [finalClaimIdempotencyKey]
      );

      if (previousFinalReward.rowCount > 0) {
        throw new MiningError(
          'IDEMPOTENCY_CONFLICT',
          'A separate idempotency key is required for the final session claim.'
        );
      }

      const finalReward = await accrue(
        client,
        userId,
        sessionId,
        finalClaimIdempotencyKey
      );

      const updateResult = await client.query(
        UPDATE mining_sessions
            SET status = 'completed',
                ended_at = clock_timestamp(),
                updated_at = clock_timestamp()
          WHERE id = $1
            AND user_id = $2
            AND status = 'active'
          RETURNING id, status, ended_at,
        [sessionId, userId]
      );

      if (updateResult.rowCount !== 1) {
        throw new MiningError(
          'SESSION_COMPLETION_FAILED',
          'Mining session could not be completed.'
        );
      }

      return {
        session: updateResult.rows[0],
        finalReward
      };
    });
  }

  return Object.freeze({
    startSession,
    claimReward,
    endSession
  });
}

module.exports = {
  MiningError,
  parseRate,
  calculateReward,
  createMiningEngine
};
  
  
  
  
