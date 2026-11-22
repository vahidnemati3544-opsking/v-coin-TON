'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { generateKeyPairSync } = require('node:crypto');
const { signOfflineLease, verifyOfflineLease, OfflineLeaseError } = require('../src/services/offline-lease-crypto');

const { privateKey, publicKey } = generateKeyPairSync('ed25519');
const privatePem = privateKey.export({ type: 'pkcs8', format: 'pem' });
const publicPem = publicKey.export({ type: 'spki', format: 'pem' });
const NOW = 1800000000;
function payload() {
  return {
    leaseId: 'lease-001', userId: 'user-001', walletId: 'wallet-001',
    deviceKeyFingerprint: 'a'.repeat(64), network: 'mainnet',
    jettonMasterAddress: 'EQMasterAddress', balanceSnapshotId: 'snapshot-001',
    eligibleBalanceBaseUnits: '250000000', policyVersion: 'offline-v1', keyId: 'key-2026-01',
    issuedAt: NOW - 10, expiresAt: NOW + 3600, maxDurationSeconds: 3600,
    maxRewardBaseUnits: '1000000', nonce: 'b'.repeat(64)
  };
}
test('Ed25519 lease signature verifies against canonical payload', () => {
  const envelope = signOfflineLease(payload(), privatePem);
  assert.equal(verifyOfflineLease(envelope, publicPem, NOW).valid, true);
});
test('lease verification rejects payload tampering', () => {
  const envelope = signOfflineLease(payload(), privatePem);
  envelope.payload.maxRewardBaseUnits = '999999999';
  assert.throws(() => verifyOfflineLease(envelope, publicPem, NOW),
    (error) => error instanceof OfflineLeaseError && error.code === 'INVALID_LEASE_SIGNATURE');
});
test('lease verification rejects expiry', () => {
  const envelope = signOfflineLease(payload(), privatePem);
  assert.throws(() => verifyOfflineLease(envelope, publicPem, NOW + 4000),
    (error) => error instanceof OfflineLeaseError && error.code === 'LEASE_EXPIRED_OR_NOT_YET_VALID');
});
test('lease signing rejects invalid duration and non-Ed25519 keys', () => {
  const bad = payload(); bad.maxDurationSeconds = 90000;
  assert.throws(() => signOfflineLease(bad, privatePem), /protocol constraints/);
  const rsa = generateKeyPairSync('rsa', { modulusLength: 2048 });
  assert.throws(() => signOfflineLease(payload(), rsa.privateKey.export({ type: 'pkcs8', format: 'pem' })),
    (error) => error.code === 'INVALID_SIGNING_KEY');
});
