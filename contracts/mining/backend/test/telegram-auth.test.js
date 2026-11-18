'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { createHmac } = require('node:crypto');
const {
  TelegramAuthError,
  verifyTelegramInitData,
  hashSessionToken
} = require('../src/auth/telegram');

const BOT_TOKEN = '123456789:ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghi';
const NOW = 1_800_000_000;

function signedInitData(overrides = {}) {
  const values = {
    auth_date: String(NOW),
    query_id: 'AAHdF6IQAAAAAN0XohDhrOrc',
    user: JSON.stringify({
      id: 123456789,
      first_name: 'Vahid',
      last_name: 'Test',
      username: 'vcoin_test',
      language_code: 'fa'
    }),
    ...overrides
  };
  const checkString = Object.keys(values)
    .sort()
    .map((key) => key + '=' + values[key])
    .join('\n');
  const secretKey = createHmac('sha256', 'WebAppData').update(BOT_TOKEN).digest();
  const hash = createHmac('sha256', secretKey).update(checkString).digest('hex');
  return new URLSearchParams({ ...values, hash }).toString();
}

test('Telegram init data accepts a valid HMAC and returns verified identity', () => {
  const identity = verifyTelegramInitData(signedInitData(), BOT_TOKEN, { nowSeconds: NOW });
  assert.deepEqual(identity, {
    id: '123456789',
    username: 'vcoin_test',
    firstName: 'Vahid',
    lastName: 'Test',
    languageCode: 'fa'
  });
});

test('Telegram init data rejects tampered user data', () => {
  const signed = signedInitData();
  const tampered = signed.replace('Vahid', 'Attacker');
  assert.throws(
    () => verifyTelegramInitData(tampered, BOT_TOKEN, { nowSeconds: NOW }),
    (error) => error instanceof TelegramAuthError && error.code === 'INVALID_INIT_DATA_HASH'
  );
});

test('Telegram init data rejects expired authentication data', () => {
  const signed = signedInitData({ auth_date: String(NOW - 90000) });
  assert.throws(
    () => verifyTelegramInitData(signed, BOT_TOKEN, { nowSeconds: NOW }),
    (error) => error instanceof TelegramAuthError && error.code === 'AUTH_DATA_EXPIRED'
  );
});

test('Telegram init data rejects duplicate parameters', () => {
  const signed = signedInitData() + '&auth_date=' + NOW;
  assert.throws(
    () => verifyTelegramInitData(signed, BOT_TOKEN, { nowSeconds: NOW }),
    (error) => error instanceof TelegramAuthError && error.code === 'INVALID_INIT_DATA'
  );
});

test('Telegram init data rejects missing bot configuration', () => {
  assert.throws(
    () => verifyTelegramInitData(signedInitData(), '', { nowSeconds: NOW }),
    (error) => error instanceof TelegramAuthError && error.code === 'TELEGRAM_AUTH_NOT_CONFIGURED'
  );
});

test('session tokens are stored as one-way SHA-256 hashes', () => {
  const token = 'a-secure-session-token-value';
  assert.equal(hashSessionToken(token), hashSessionToken(token));
  assert.notEqual(hashSessionToken(token), token);
  assert.match(hashSessionToken(token), /^[a-f0-9]{64}$/);
});
