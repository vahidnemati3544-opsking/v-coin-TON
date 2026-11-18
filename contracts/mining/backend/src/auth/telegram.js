'use strict';

const {
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual
} = require('node:crypto');
const express = require('express');

const DEFAULT_AUTH_MAX_AGE_SECONDS = 24 * 60 * 60;
const SESSION_TTL_SECONDS = 30 * 24 * 60 * 60;

class TelegramAuthError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'TelegramAuthError';
    this.code = code;
  }
}

function verifyTelegramInitData(initData, botToken, options = {}) {
  if (typeof initData !== 'string' || initData.length === 0 || initData.length > 16384) {
    throw new TelegramAuthError('INVALID_INIT_DATA', 'Telegram init data is missing or too large.');
  }
  if (typeof botToken !== 'string' || botToken.length < 20) {
    throw new TelegramAuthError('TELEGRAM_AUTH_NOT_CONFIGURED', 'Telegram bot authentication is not configured.');
  }

  const params = new URLSearchParams(initData);
  const entries = [...params.entries()];
  const keys = new Set();
  for (const [key] of entries) {
    if (keys.has(key)) {
      throw new TelegramAuthError('INVALID_INIT_DATA', 'Telegram init data contains duplicate fields.');
    }
    keys.add(key);
  }

  const suppliedHash = params.get('hash');
  if (!suppliedHash || !/^[a-f0-9]{64}$/i.test(suppliedHash)) {
    throw new TelegramAuthError('INVALID_INIT_DATA_HASH', 'Telegram init data hash is invalid.');
  }

  const dataCheckString = entries
    .filter(([key]) => key !== 'hash')
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([key, value]) => key + '=' + value)
    .join('\n');

  const secretKey = createHmac('sha256', 'WebAppData').update(botToken).digest();
  const expectedHash = createHmac('sha256', secretKey).update(dataCheckString).digest();
  const actualHash = Buffer.from(suppliedHash, 'hex');
  if (actualHash.length !== expectedHash.length || !timingSafeEqual(actualHash, expectedHash)) {
    throw new TelegramAuthError('INVALID_INIT_DATA_HASH', 'Telegram init data signature verification failed.');
  }

  const authDateText = params.get('auth_date');
  if (!authDateText || !/^\d+$/.test(authDateText)) {
    throw new TelegramAuthError('INVALID_AUTH_DATE', 'Telegram authentication date is invalid.');
  }
  const authDate = Number(authDateText);
  const nowSeconds = options.nowSeconds ?? Math.floor(Date.now() / 1000);
  const maxAgeSeconds = options.maxAgeSeconds ?? DEFAULT_AUTH_MAX_AGE_SECONDS;
  if (!Number.isSafeInteger(authDate) || authDate > nowSeconds + 30 || nowSeconds - authDate > maxAgeSeconds) {
    throw new TelegramAuthError('AUTH_DATA_EXPIRED', 'Telegram authentication data has expired.');
  }

  let user;
  try {
    user = JSON.parse(params.get('user') || 'null');
  } catch {
    throw new TelegramAuthError('INVALID_TELEGRAM_USER', 'Telegram user data is invalid.');
  }
  if (!user || !Number.isSafeInteger(user.id) || user.id <= 0) {
    throw new TelegramAuthError('INVALID_TELEGRAM_USER', 'Verified Telegram user ID is missing or invalid.');
  }

  return Object.freeze({
    id: String(user.id),
    username: typeof user.username === 'string' ? user.username.slice(0, 100) : null,
    firstName: typeof user.first_name === 'string' ? user.first_name.slice(0, 100) : null,
    lastName: typeof user.last_name === 'string' ? user.last_name.slice(0, 100) : null,
    languageCode: typeof user.language_code === 'string' ? user.language_code.slice(0, 20) : 'en'
  });
}

function hashSessionToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

function createSessionAuthMiddleware({ pool }) {
  if (!pool || typeof pool.query !== 'function') {
    throw new TypeError('A PostgreSQL pool is required for session authentication.');
  }
  return async (req, res, next) => {
    const authorization = req.get('authorization') || '';
    const match = /^Bearer ([A-Za-z0-9_-]{40,100})$/.exec(authorization);
    if (!match) return res.status(401).json({ error: 'AUTHENTICATION_REQUIRED' });

    try {
      const tokenHash = hashSessionToken(match[1]);
      const result = await pool.query(
        'SELECT s.id AS session_id, u.id AS user_id, u.telegram_user_id, u.username ' +
        'FROM user_sessions s JOIN users u ON u.id = s.user_id ' +
        "WHERE s.token_hash = $1 AND s.revoked_at IS NULL AND s.expires_at > clock_timestamp() " +
        "AND u.account_status = 'active'",
        [tokenHash]
      );
      if (result.rowCount !== 1) {
        return res.status(401).json({ error: 'INVALID_OR_EXPIRED_SESSION' });
      }
      req.auth = result.rows[0];
      return next();
    } catch (error) {
      return next(error);
    }
  };
}

function createTelegramAuthRouter({ pool, botToken, maxAgeSeconds = DEFAULT_AUTH_MAX_AGE_SECONDS }) {
  if (!pool || typeof pool.connect !== 'function' || typeof pool.query !== 'function') {
    throw new TypeError('A PostgreSQL pool is required for Telegram authentication.');
  }

  const router = express.Router();

  router.post('/telegram', async (req, res, next) => {
    try {
      const identity = verifyTelegramInitData(req.body?.initData, botToken, { maxAgeSeconds });
      const sessionToken = randomBytes(32).toString('base64url');
      const tokenHash = hashSessionToken(sessionToken);
      const client = await pool.connect();

      try {
        await client.query('BEGIN');
        const userResult = await client.query(
          'INSERT INTO users (telegram_user_id, username, account_status) ' +
          "VALUES ($1::bigint, $2, 'active') " +
          'ON CONFLICT (telegram_user_id) DO UPDATE SET ' +
          'username = COALESCE(EXCLUDED.username, users.username), updated_at = clock_timestamp() ' +
          'RETURNING id, telegram_user_id, username, account_status',
          [identity.id, identity.username]
        );
        const user = userResult.rows[0];
        if (user.account_status !== 'active') {
          throw new TelegramAuthError('ACCOUNT_NOT_ACTIVE', 'This account is not active.');
        }

        await client.query(
          'INSERT INTO user_profiles (user_id, first_name, last_name, language_code) ' +
          'VALUES ($1, $2, $3, $4) ' +
          'ON CONFLICT (user_id) DO UPDATE SET first_name = EXCLUDED.first_name, ' +
          'last_name = EXCLUDED.last_name, language_code = EXCLUDED.language_code, updated_at = clock_timestamp()',
          [user.id, identity.firstName, identity.lastName, identity.languageCode]
        );

        await client.query(
          'INSERT INTO user_sessions (user_id, token_hash, expires_at) ' +
          "VALUES ($1, $2, clock_timestamp() + ($3 * INTERVAL '1 second'))",
          [user.id, tokenHash, SESSION_TTL_SECONDS]
        );
        await client.query('COMMIT');

        res.status(200).json({
          token_type: 'Bearer',
          access_token: sessionToken,
          expires_in: SESSION_TTL_SECONDS,
          user: {
            id: user.id,
            telegram_user_id: user.telegram_user_id,
            username: user.username
          }
        });
      } catch (error) {
        try { await client.query('ROLLBACK'); } catch (_) { /* preserve original error */ }
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      if (error instanceof TelegramAuthError) {
        const status = error.code === 'TELEGRAM_AUTH_NOT_CONFIGURED' ? 503 :
          error.code === 'ACCOUNT_NOT_ACTIVE' ? 403 : 401;
        return res.status(status).json({ error: error.code });
      }
      return next(error);
    }
  });

  router.use(createSessionAuthMiddleware({ pool }));

  router.get('/me', (req, res) => {
    res.status(200).json({
      user: {
        id: req.auth.user_id,
        telegram_user_id: req.auth.telegram_user_id,
        username: req.auth.username
      }
    });
  });

  router.post('/logout', async (req, res, next) => {
    try {
      await pool.query(
        'UPDATE user_sessions SET revoked_at = clock_timestamp() ' +
        'WHERE id = $1 AND revoked_at IS NULL',
        [req.auth.session_id]
      );
      return res.status(200).json({ status: 'logged_out' });
    } catch (error) {
      return next(error);
    }
  });

  return router;
}

module.exports = {
  TelegramAuthError,
  verifyTelegramInitData,
  hashSessionToken,
  createSessionAuthMiddleware,
  createTelegramAuthRouter
};
