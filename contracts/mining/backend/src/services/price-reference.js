'use strict';

const INTERVAL_MS = 72 * 60 * 60 * 1000;
const PRICE_SCALE = 1_000_000_000_000n;
const INITIAL_PRICE_SCALED = 4_000_000_000n;
const FIXED_INCREMENT_SCALED = INITIAL_PRICE_SCALED / 100n;
const MINING_RESERVE_CODE = 'USER_MINING';

function increasePriceScaled(currentScaled) {
  if (typeof currentScaled !== 'bigint' || currentScaled <= 0n) {
    throw new TypeError('currentScaled must be a positive bigint');
  }
  // Add exactly 1% of the initial USD 0.004 reference value per 72-hour period.
  // This is a fixed linear increment, not 1% of the changing current value.
  return currentScaled + FIXED_INCREMENT_SCALED;
}

function scaledPriceToDecimal(value) {
  const whole = value / PRICE_SCALE;
  const fraction = (value % PRICE_SCALE).toString().padStart(12, '0');
  return whole.toString() + '.' + fraction;
}

function decimalPriceToScaled(value) {
  if (typeof value !== 'string' || !/^\d+(?:\.\d{1,12})?$/.test(value)) {
    throw new TypeError('Invalid 12-decimal USD price');
  }
  const [whole, fraction = ''] = value.split('.');
  return BigInt(whole) * PRICE_SCALE + BigInt(fraction.padEnd(12, '0'));
}

async function advancePriceReference({ pool, now = new Date() }) {
  if (!pool || typeof pool.connect !== 'function') {
    throw new TypeError('A PostgreSQL pool is required');
  }
  const client = await pool.connect();
  let advanced = 0;
  try {
    await client.query('BEGIN');
    // Serialize concurrent API requests and scheduler instances.
    await client.query("SELECT pg_advisory_xact_lock(741230019)");
    const stateResult = await client.query(
      'SELECT * FROM price_reference_state WHERE singleton = TRUE FOR UPDATE'
    );
    if (stateResult.rowCount !== 1) {
      throw new Error('PRICE_REFERENCE_NOT_INITIALIZED');
    }
    const state = stateResult.rows[0];
    if (state.status !== 'active') {
      await client.query('COMMIT');
      return { advanced, status: state.status };
    }

    const reserveResult = await client.query(
      "SELECT allocated_base_units::text, distributed_base_units::text " +
      "FROM mining_reserve WHERE reserve_code = $1 FOR UPDATE",
      [MINING_RESERVE_CODE]
    );
    if (reserveResult.rowCount !== 1) {
      throw new Error('MINING_RESERVE_NOT_INITIALIZED');
    }
    const reserve = reserveResult.rows[0];
    const allocated = BigInt(reserve.allocated_base_units);
    const distributed = BigInt(reserve.distributed_base_units);
    if (distributed >= allocated) {
      await client.query(
        "UPDATE price_reference_state SET status = 'completed', updated_at = clock_timestamp() " +
        'WHERE singleton = TRUE'
      );
      await client.query('COMMIT');
      return { advanced, status: 'completed' };
    }

    const nowMs = now instanceof Date ? now.getTime() : new Date(now).getTime();
    if (!Number.isFinite(nowMs)) throw new TypeError('Invalid current time');

    let current = decimalPriceToScaled(state.current_price_usd);
    let periodStart = new Date(state.last_period_end);
    let nextPeriod = new Date(state.next_period_at);
    while (nextPeriod.getTime() <= nowMs) {
      const open = current;
      current = increasePriceScaled(current);
      const close = current;
      const periodEnd = nextPeriod;
      await client.query(
        'INSERT INTO price_reference_candles ' +
        '(period_start, period_end, open_usd, high_usd, low_usd, close_usd, increase_rate_percent) ' +
        'VALUES ($1, $2, $3, $4, $5, $6, 1.00000000) ' +
        'ON CONFLICT (period_start) DO NOTHING',
        [
          periodStart.toISOString(),
          periodEnd.toISOString(),
          scaledPriceToDecimal(open),
          scaledPriceToDecimal(close),
          scaledPriceToDecimal(open),
          scaledPriceToDecimal(close)
        ]
      );
      periodStart = periodEnd;
      nextPeriod = new Date(periodEnd.getTime() + INTERVAL_MS);
      advanced += 1;
    }

    if (advanced > 0) {
      await client.query(
        'UPDATE price_reference_state SET current_price_usd = $1, ' +
        'last_period_end = $2, next_period_at = $3, updated_at = clock_timestamp() ' +
        'WHERE singleton = TRUE',
        [
          scaledPriceToDecimal(current),
          periodStart.toISOString(),
          nextPeriod.toISOString()
        ]
      );
    }
    await client.query('COMMIT');
    return { advanced, status: 'active' };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

function createPriceReferenceRouter({ pool }) {
  const express = require('express');
  const router = express.Router();

  router.get('/current', async (req, res, next) => {
    try {
      await advancePriceReference({ pool });
      const result = await pool.query(
        'SELECT initial_price_usd, current_price_usd, increase_rate_percent, ' +
        'interval_seconds, next_period_at, status FROM price_reference_state WHERE singleton = TRUE'
      );
      if (result.rowCount !== 1) {
        return res.status(503).json({ error: 'PRICE_REFERENCE_NOT_INITIALIZED' });
      }
      return res.status(200).json({
        ...result.rows[0],
        price_type: 'modelled_reference_not_market_price',
        currency: 'USD',
        interval_hours: 72
      });
    } catch (error) {
      return next(error);
    }
  });

  router.get('/candles', async (req, res, next) => {
    try {
      await advancePriceReference({ pool });
      const requested = Number.parseInt(req.query.limit, 10);
      const limit = Number.isInteger(requested) ? Math.min(Math.max(requested, 1), 500) : 100;
      const result = await pool.query(
        'SELECT period_start, period_end, open_usd, high_usd, low_usd, close_usd, ' +
        'increase_rate_percent FROM price_reference_candles ' +
        'ORDER BY period_start DESC LIMIT $1',
        [limit]
      );
      return res.status(200).json({
        price_type: 'modelled_reference_not_market_price',
        interval_hours: 72,
        candles: result.rows.reverse()
      });
    } catch (error) {
      return next(error);
    }
  });

  return router;
}

function startPriceReferenceScheduler({ pool, logger = console }) {
  let stopped = false;
  let running = false;
  const tick = async () => {
    if (stopped || running) return;
    running = true;
    try {
      await advancePriceReference({ pool });
    } catch (error) {
      logger.error('Price-reference scheduler failed:', error.message);
    } finally {
      running = false;
    }
  };
  void tick();
  const timer = setInterval(tick, 60_000);
  if (typeof timer.unref === 'function') timer.unref();
  return () => {
    stopped = true;
    clearInterval(timer);
  };
}

module.exports = {
  INTERVAL_MS,
  increasePriceScaled,
  scaledPriceToDecimal,
  decimalPriceToScaled,
  advancePriceReference,
  createPriceReferenceRouter,
  startPriceReferenceScheduler
};
