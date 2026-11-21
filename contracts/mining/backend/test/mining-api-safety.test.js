'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const { app } = require('../src/server');

test('public mining API remains fail-closed until verified wallet mining and payouts are implemented', async (t) => {
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(async () => {
    await new Promise((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
  });

  const address = 'http://127.0.0.1:' + server.address().port;
  const cases = [
    ['GET', '/api/v1/mining/status'],
    ['POST', '/api/v1/mining/start'],
    ['POST', '/api/v1/mining/claim'],
    ['POST', '/api/v1/mining/end']
  ];

  for (const [method, path] of cases) {
    const response = await fetch(address + path, {
      method,
      headers: { 'content-type': 'application/json' },
      body: method === 'GET' ? undefined : JSON.stringify({})
    });
    assert.equal(response.status, 503, method + ' ' + path + ' must stay disabled');
    const payload = await response.json();
    assert.equal(payload.error, 'WALLET_BALANCE_MINING_NOT_IMPLEMENTED');
  }
});
