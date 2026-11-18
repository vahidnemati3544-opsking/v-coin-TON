'use strict';

const express = require('express');
const { createMiningEngine, MiningError, parseRate } = require('../../../engine');

function sendMiningError(error, res, next) {
  if (!(error instanceof MiningError)) return next(error);

  const statusByCode = {
    INVALID_USER_ID: 400,
    INVALID_SESSION_ID: 400,
    INVALID_IDEMPOTENCY_KEY: 400,
    USER_NOT_FOUND: 404,
    ACTIVE_SESSION_NOT_FOUND: 404,
    USER_NOT_ACTIVE: 403,
    USER_LEVEL_NOT_CONFIGURED: 409,
    CLAIM_INTERVAL_EXCEEDED: 409,
    REWARD_TOO_SMALL: 409,
    IDEMPOTENCY_CONFLICT: 409,
    MINING_RESERVE_RESERVATION_FAILED: 503,
    MINING_LEDGER_SETTLEMENT_FAILED: 503
  };

  return res.status(statusByCode[error.code] || 400).json({ error: error.code });
}

function createMiningRouter({ pool }) {
  const router = express.Router();
  const engine = createMiningEngine({ pool });

  router.get('/status', async (req, res, next) => {
    try {
      const account = await pool.query(
        'SELECT ul.current_level, l.mining_rate_base_units_per_second::text AS mining_rate_base_units_per_second, ' +
        "COALESCE(b.available_base_units, 0)::text AS available_base_units, " +
        "COALESCE(b.reserved_base_units, 0)::text AS reserved_base_units " +
        'FROM users u ' +
        'LEFT JOIN user_levels ul ON ul.user_id = u.id ' +
        'LEFT JOIN levels l ON l.level = ul.current_level ' +
        "LEFT JOIN balances b ON b.user_id = u.id AND b.asset_code = 'VCOIN' " +
        'WHERE u.id = $1',
        [req.auth.user_id]
      );
      if (account.rowCount !== 1) {
        return res.status(404).json({ error: 'USER_NOT_FOUND' });
      }

      const activeSession = await pool.query(
        "SELECT id, started_at, last_claim_at FROM mining_sessions " +
        "WHERE user_id = $1 AND status = 'active'",
        [req.auth.user_id]
      );
      const data = account.rows[0];
      const configured = data.current_level !== null &&
        data.mining_rate_base_units_per_second !== null &&
        parseRate(data.mining_rate_base_units_per_second) > 0n;

      return res.status(200).json({
        mining_configured: configured,
        current_level: data.current_level,
        mining_rate_base_units_per_second: data.mining_rate_base_units_per_second,
        available_base_units: data.available_base_units,
        reserved_base_units: data.reserved_base_units,
        active_session: activeSession.rows[0] || null
      });
    } catch (error) {
      return next(error);
    }
  });

  router.post('/start', async (req, res, next) => {
    try {
      const session = await engine.startSession({ userId: req.auth.user_id });
      return res.status(session.duplicate ? 200 : 201).json({ session });
    } catch (error) {
      return sendMiningError(error, res, next);
    }
  });

  router.post('/claim', async (req, res, next) => {
    try {
      const reward = await engine.claimReward({
        userId: req.auth.user_id,
        idempotencyKey: req.get('Idempotency-Key')
      });
      return res.status(200).json({ reward });
    } catch (error) {
      return sendMiningError(error, res, next);
    }
  });

  router.post('/end', async (req, res, next) => {
    try {
      const result = await engine.endSession({
        userId: req.auth.user_id,
        sessionId: req.body?.session_id,
        finalClaimIdempotencyKey: req.get('Idempotency-Key')
      });
      return res.status(200).json(result);
    } catch (error) {
      return sendMiningError(error, res, next);
    }
  });

  return router;
}

module.exports = { createMiningRouter };
