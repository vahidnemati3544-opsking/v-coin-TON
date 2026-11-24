'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
// The server module constructs a lazy PostgreSQL pool at import time. The
// public mining guard test never opens a database connection, so provide a
// syntactically valid inert URL rather than requiring CI secrets.
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgres://test:test@127.0.0.1:1/vcoin_test';
const { app } = require('../src/server');

let server;
let baseUrl;

test.before(async () => {
  server = app.listen(0, '127.0.0.1');
  await new Promise((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', reject);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

test.after(async () => {
  if (!server) return;
  await new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  });
});

test('public mining API fails closed for every extraction endpoint', async () => {
  const requests = [
    { method: 'GET', path: '/api/v1/mining/status' },
    { method: 'POST', path: '/api/v1/mining/start' },
    { method: 'POST', path: '/api/v1/mining/claim', body: {} },
    { method: 'POST', path: '/api/v1/mining/end', body: { session_id: 'test-session' } }
  ];

  for (const request of requests) {
    const response = await fetch(baseUrl + request.path, {
      method: request.method,
      headers: request.body ? { 'content-type': 'application/json' } : undefined,
      body: request.body ? JSON.stringify(request.body) : undefined
    });
    assert.equal(response.status, 503, `${request.method} ${request.path} must remain unavailable`);
    assert.deepEqual(await response.json(), {
      error: 'WALLET_BALANCE_MINING_NOT_IMPLEMENTED',
      message: 'Mining is unavailable until verified TON Jetton wallet balances and confirmed payouts are implemented.'
    });
  }
});
