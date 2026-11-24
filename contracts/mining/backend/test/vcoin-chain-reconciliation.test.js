'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { createVcoinChainReconciliation, FOUNDER_MAINNET_WALLET, RECEIPT_STAGES, ALLOCATION_ROLES } = require('../src/services/vcoin-chain-reconciliation');
const MASTER = 'EQ' + 'a'.repeat(46);
const HASH = 'ab'.repeat(32);
const JETTON_WALLETS = Object.freeze({
  founder: 'EQfounderJettonWallet', mining_reserve: 'EQminingJettonWallet',
  treasury: 'EQtreasuryJettonWallet', liquidity_market: 'EQliquidityJettonWallet',
  ecosystem_marketing: 'EQecosystemJettonWallet'
});
function createHarness() {
  const calls = [];
  const pool = { async query(sql, params) { calls.push({ sql, params }); return { rows: [{ status: 'confirmed' }] }; } };
  return { calls, service: createVcoinChainReconciliation({ pool, expectedMasterAddress: MASTER, expectedJettonWallets: JETTON_WALLETS }) };
}
function receiptEvent(stage, overrides = {}) {
  return {
    network: 'mainnet', finality: 'finalized', jettonMasterAddress: MASTER, transactionHash: HASH,
    stage, amountBaseUnits: RECEIPT_STAGES[stage], recipientOwnerAddress: FOUNDER_MAINNET_WALLET,
    recipientJettonWalletAddress: JETTON_WALLETS.founder, ...overrides
  };
}
test('all five receipt events require exact stage amount, finality, Mainnet, Master and Founder', async () => {
  const { service, calls } = createHarness();
  for (let stage = 1; stage <= 5; stage++) {
    const result = await service.recordReceiptStage(receiptEvent(stage, { transactionHash: String(stage).padStart(64, '0') }));
    assert.equal(result, 'confirmed');
    assert.equal(calls[stage - 1].params[0], stage);
    assert.equal(calls[stage - 1].params[1], RECEIPT_STAGES[stage]);
    assert.equal(calls[stage - 1].params[4], FOUNDER_MAINNET_WALLET);
  }
  await assert.rejects(service.recordReceiptStage(receiptEvent(1, { network: 'testnet' })), /MAINNET_EVENTS_ONLY/);
  await assert.rejects(service.recordReceiptStage(receiptEvent(1, { finality: 'pending' })), /NOT_FINALIZED/);
  await assert.rejects(service.recordReceiptStage(receiptEvent(1, { jettonMasterAddress: 'EQ' + 'b'.repeat(46) })), /MASTER_MISMATCH/);
  await assert.rejects(service.recordReceiptStage(receiptEvent(1, { recipientOwnerAddress: 'UQwrong' })), /RECIPIENT_MISMATCH/);
  await assert.rejects(service.recordReceiptStage(receiptEvent(1, { recipientJettonWalletAddress: 'EQwrong' })), /JETTON_WALLET_MISMATCH/);
  await assert.rejects(service.recordReceiptStage(receiptEvent(1, { transactionHash: 'not-a-hash' })), /INVALID_TRANSACTION_HASH/);
  assert.equal(calls.length, 5);
});
test('receipt ingestion rejects unknown stages, fractional amounts and wrong fixed stage amounts', async () => {
  const { service, calls } = createHarness();
  await assert.rejects(service.recordReceiptStage(receiptEvent(6)), /INVALID_RECEIPT_STAGE/);
  await assert.rejects(service.recordReceiptStage(receiptEvent(1, { amountBaseUnits: '1.25' })), /INVALID_BASE_UNIT_AMOUNT/);
  await assert.rejects(service.recordReceiptStage(receiptEvent(1, { amountBaseUnits: '1000000000000000' })), /STAGE_AMOUNT_MISMATCH/);
  assert.equal(calls.length, 0);
});
test('allocation ingestion accepts exact Founder-signed role transfers only', async () => {
  const { service, calls } = createHarness();
  for (const [allocationRole, allocation] of Object.entries(ALLOCATION_ROLES)) {
    const result = await service.recordAllocationTransfer({
      network: 'mainnet', finality: 'finalized', jettonMasterAddress: MASTER,
      transactionHash: HASH, sourceOwnerAddress: FOUNDER_MAINNET_WALLET,
      sourceJettonWalletAddress: JETTON_WALLETS.founder, allocationRole,
      amountBaseUnits: allocation.amount, destinationOwnerAddress: allocation.destination,
      destinationJettonWalletAddress: JETTON_WALLETS[allocationRole]
    });
    assert.equal(result, 'confirmed');
  }
  assert.equal(calls.length, 4);
  await assert.rejects(service.recordAllocationTransfer({
    network: 'mainnet', finality: 'finalized', jettonMasterAddress: MASTER, transactionHash: HASH,
    sourceOwnerAddress: 'UQwrong', allocationRole: 'treasury', amountBaseUnits: ALLOCATION_ROLES.treasury.amount,
    sourceJettonWalletAddress: JETTON_WALLETS.founder, destinationJettonWalletAddress: JETTON_WALLETS.treasury,
    destinationOwnerAddress: ALLOCATION_ROLES.treasury.destination
  }), /SOURCE_MISMATCH/);
  await assert.rejects(service.recordAllocationTransfer({
    network: 'mainnet', finality: 'finalized', jettonMasterAddress: MASTER, transactionHash: HASH,
    sourceOwnerAddress: FOUNDER_MAINNET_WALLET, allocationRole: 'treasury', amountBaseUnits: '1',
    sourceJettonWalletAddress: JETTON_WALLETS.founder, destinationJettonWalletAddress: JETTON_WALLETS.treasury,
    destinationOwnerAddress: ALLOCATION_ROLES.treasury.destination
  }), /AMOUNT_MISMATCH/);
});
test('service refuses to run before the Master address is configured', async () => {
  const pool = { query: async () => ({ rows: [{ status: 'confirmed' }] }) };
  const service = createVcoinChainReconciliation({ pool });
  await assert.rejects(service.recordReceiptStage(receiptEvent(1)), /MASTER_ADDRESS_NOT_CONFIGURED/);
});
