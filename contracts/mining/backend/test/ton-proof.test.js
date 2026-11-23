'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { mapNetwork, buildTonProofDigest, verifyTonProof, TonProofError } = require('../src/services/ton-proof');
const { Address } = require('@ton/ton');

test('TON Connect network IDs map only to mainnet and testnet', () => {
  assert.equal(mapNetwork('-239'), 'mainnet');
  assert.equal(mapNetwork('-3'), 'testnet');
  assert.throws(() => mapNetwork('0'), (error) =>
    error instanceof TonProofError && error.code === 'UNSUPPORTED_TON_NETWORK');
});

test('TON proof digest uses a 32-byte SHA-256 digest and rejects malformed domains before signature checks', () => {
  const address = Address.parse('0:' + '0'.repeat(64));
  const proof = {
    timestamp: 1795420800,
    domain: { lengthBytes: 15, value: 'vcoin.example' },
    payload: 'a'.repeat(64)
  };
  assert.equal(buildTonProofDigest(address, proof).length, 32);
  assert.throws(() => verifyTonProof({
    address: address.toString(),
    network: '-239',
    walletStateInit: 'not-base64-state-init',
    proof
  }, { expectedDomain: 'wrong.example', nowSeconds: 1795420800 }), (error) =>
    error instanceof TonProofError && error.code === 'INVALID_WALLET_STATE_INIT');
});

test('TON proof verifier fails closed without an application domain', () => {
  assert.throws(() => verifyTonProof({}), (error) =>
    error instanceof TonProofError && error.code === 'TON_PROOF_NOT_CONFIGURED');
});
