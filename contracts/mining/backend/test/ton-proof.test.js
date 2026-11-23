'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { mapNetwork, buildTonProofDigest, verifyTonProof, TonProofError } = require('../src/services/ton-proof');
const { Address, WalletContractV4 } = require('@ton/ton');
const { beginCell, storeStateInit } = require('@ton/core');
const { generateKeyPairSync, sign } = require('node:crypto');

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


test('TON proof accepts a valid Ed25519 signature bound to a real V4R2 StateInit and exact challenge', () => {
  const keyPair = generateKeyPairSync('ed25519');
  const spki = keyPair.publicKey.export({ format: 'der', type: 'spki' });
  const publicKey = spki.subarray(spki.length - 32);
  const wallet = WalletContractV4.create({ workchain: 0, publicKey });
  const stateInit = beginCell().store(storeStateInit(wallet.init)).endCell().toBoc().toString('base64');
  const nowSeconds = 1795420800;
  const proof = {
    timestamp: nowSeconds,
    domain: { lengthBytes: Buffer.byteLength('app.example.com', 'utf8'), value: 'app.example.com' },
    payload: 'a'.repeat(64)
  };
  const address = wallet.address.toString({ bounceable: true, urlSafe: true });
  const digest = buildTonProofDigest(wallet.address, proof);
  proof.signature = sign(null, digest, keyPair.privateKey).toString('base64');

  const verified = verifyTonProof({
    address,
    network: '-239',
    walletStateInit: stateInit,
    publicKey: publicKey.toString('hex'),
    proof
  }, { expectedDomain: 'app.example.com', nowSeconds });

  assert.equal(verified.address, wallet.address.toRawString());
  assert.equal(verified.network, 'mainnet');
  assert.equal(verified.publicKey, publicKey.toString('hex'));
  assert.equal(verified.payload, proof.payload);
});

test('TON proof rejects a modified Ed25519 signature', () => {
  const keyPair = generateKeyPairSync('ed25519');
  const spki = keyPair.publicKey.export({ format: 'der', type: 'spki' });
  const publicKey = spki.subarray(spki.length - 32);
  const wallet = WalletContractV4.create({ workchain: 0, publicKey });
  const stateInit = beginCell().store(storeStateInit(wallet.init)).endCell().toBoc().toString('base64');
  const nowSeconds = 1795420800;
  const proof = {
    timestamp: nowSeconds,
    domain: { lengthBytes: Buffer.byteLength('app.example.com', 'utf8'), value: 'app.example.com' },
    payload: 'b'.repeat(64)
  };
  const digest = buildTonProofDigest(wallet.address, proof);
  const signature = sign(null, digest, keyPair.privateKey);
  signature[0] ^= 0x01;
  proof.signature = signature.toString('base64');

  assert.throws(() => verifyTonProof({
    address: wallet.address.toString(),
    network: '-239',
    walletStateInit: stateInit,
    proof
  }, { expectedDomain: 'app.example.com', nowSeconds }), (error) =>
    error instanceof TonProofError && error.code === 'TON_PROOF_SIGNATURE_INVALID');
});
