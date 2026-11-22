'use strict';

const { createHash, randomBytes, createPrivateKey, createPublicKey, sign, verify } = require('node:crypto');

class OfflineLeaseError extends Error {
  constructor(code, message) { super(message); this.name = 'OfflineLeaseError'; this.code = code; }
}

function canonicalize(value) {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return JSON.stringify(value);
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new OfflineLeaseError('INVALID_PAYLOAD', 'Lease payload contains a non-finite number.');
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return '[' + value.map(canonicalize).join(',') + ']';
  if (value && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype) {
    const keys = Object.keys(value).sort();
    return '{' + keys.map((key) => JSON.stringify(key) + ':' + canonicalize(value[key])).join(',') + '}';
  }
  throw new OfflineLeaseError('INVALID_PAYLOAD', 'Lease payload must contain only plain JSON values.');
}

function validateLeasePayload(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new OfflineLeaseError('INVALID_PAYLOAD', 'Lease payload must be an object.');
  }
  const required = ['leaseId','userId','walletId','deviceKeyFingerprint','network','jettonMasterAddress',
    'balanceSnapshotId','eligibleBalanceBaseUnits','policyVersion','keyId','issuedAt','expiresAt',
    'maxDurationSeconds','maxRewardBaseUnits','nonce'];
  for (const key of required) {
    if (payload[key] === undefined || payload[key] === null || payload[key] === '') {
      throw new OfflineLeaseError('INVALID_PAYLOAD', 'Lease payload is missing ' + key + '.');
    }
  }
  if (!['mainnet','testnet'].includes(payload.network) ||
      !Number.isSafeInteger(payload.issuedAt) || !Number.isSafeInteger(payload.expiresAt) ||
      payload.expiresAt <= payload.issuedAt ||
      !Number.isSafeInteger(payload.maxDurationSeconds) ||
      payload.maxDurationSeconds < 60 || payload.maxDurationSeconds > 86400 ||
      !/^[a-f0-9]{64}$/.test(payload.deviceKeyFingerprint) ||
      !/^[a-f0-9]{64}$/.test(payload.nonce) ||
      !/^\d+$/.test(String(payload.eligibleBalanceBaseUnits)) ||
      !/^\d+$/.test(String(payload.maxRewardBaseUnits))) {
    throw new OfflineLeaseError('INVALID_PAYLOAD', 'Lease payload violates protocol constraints.');
  }
}

function signOfflineLease(payload, privateKeyPem) {
  validateLeasePayload(payload);
  if (typeof privateKeyPem !== 'string' || !privateKeyPem.includes('PRIVATE KEY')) {
    throw new OfflineLeaseError('SIGNING_KEY_NOT_CONFIGURED', 'An Ed25519 private key is required in the server secret store.');
  }
  let key;
  try { key = createPrivateKey(privateKeyPem); } catch {
    throw new OfflineLeaseError('INVALID_SIGNING_KEY', 'The configured signing key is invalid.');
  }
  if (key.asymmetricKeyType !== 'ed25519') {
    throw new OfflineLeaseError('INVALID_SIGNING_KEY', 'Only Ed25519 signing keys are supported.');
  }
  const canonicalPayload = canonicalize(payload);
  const signature = sign(null, Buffer.from(canonicalPayload, 'utf8'), key).toString('base64');
  return Object.freeze({
    payload: JSON.parse(canonicalPayload),
    signature,
    payloadSha256: createHash('sha256').update(canonicalPayload).digest('hex')
  });
}

function verifyOfflineLease(envelope, publicKeyPem, nowSeconds = Math.floor(Date.now() / 1000)) {
  if (!envelope || typeof envelope !== 'object' || typeof envelope.signature !== 'string' ||
      typeof publicKeyPem !== 'string' || !Number.isSafeInteger(nowSeconds)) {
    throw new OfflineLeaseError('INVALID_ENVELOPE', 'Lease envelope, public key and verification time are required.');
  }
  validateLeasePayload(envelope.payload);
  if (envelope.payload.expiresAt <= nowSeconds || envelope.payload.issuedAt > nowSeconds + 30) {
    throw new OfflineLeaseError('LEASE_EXPIRED_OR_NOT_YET_VALID', 'Offline lease is outside its validity window.');
  }
  let key;
  try { key = createPublicKey(publicKeyPem); } catch {
    throw new OfflineLeaseError('INVALID_PUBLIC_KEY', 'The configured public key is invalid.');
  }
  if (key.asymmetricKeyType !== 'ed25519') {
    throw new OfflineLeaseError('INVALID_PUBLIC_KEY', 'Only Ed25519 public keys are supported.');
  }
  const canonicalPayload = canonicalize(envelope.payload);
  const valid = verify(null, Buffer.from(canonicalPayload, 'utf8'), key, Buffer.from(envelope.signature, 'base64'));
  if (!valid) throw new OfflineLeaseError('INVALID_LEASE_SIGNATURE', 'Offline lease signature verification failed.');
  return Object.freeze({ valid: true, leaseId: envelope.payload.leaseId, payloadSha256: createHash('sha256').update(canonicalPayload).digest('hex') });
}

function createLeaseNonce() { return randomBytes(32).toString('hex'); }

module.exports = { OfflineLeaseError, canonicalize, validateLeasePayload, signOfflineLease, verifyOfflineLease, createLeaseNonce };
