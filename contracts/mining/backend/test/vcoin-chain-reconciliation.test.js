'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  createVcoinChainReconciliation,
  FOUNDER_MAINNET_WALLET,
  ALLOCATION_ROLES
} = require('../src/services/vcoin-chain-reconciliation');

const MASTER = 'EQ' + 'a'.repeat(46);
const HASH = 'ab'.repeat(32);

function createHarness() {
  const calls = [];
  const pool = {
    async query(sql, params) {
      calls.push({ sql, params });
      return { rows: [{ status: 'confirmed' }] };
    }
  };
  return {
    calls,
    service: createVcoinChainReconciliation({ pool, expectedMasterAddress: MASTER })
  };
}

function receiptEvent(overrides = {}) {
  return {
    network: 'mainnet',
    finality: 'finalized',
    jettonMasterAddress: MASTER,
    transactionHash: HASH,
    stage: 1,
    amountBaseUnits: '1000000000000000',
    recipientOwnerAddress: FOUNDER_MAINNET_WALLET,
    ...overrides
  };
}

test('receipt ingestion requires finalized Mainnet event and exact Master/Founder', async () => {
  const { service, calls } = createHarness();
  assert.equal(await service.recordReceiptStage(receiptEvent()), 'confirmed');
  assert.equal(calls.length, 1);
  assert.equal(calls[0].params[0], 1);
  assert.equal(calls[0].params[1], '1000000000000000');
  assert.equal(calls[0].params[4], FOUNDER_MAINNET_WALLET);

  await assert.rejects(service.recordReceiptStage(receiptEvent({ network: 'testnet' })), /MAINNET_EVENTS_ONLY/);
  await assert.rejects(service.recordReceiptStage(receiptEvent({ finality: 'pending' })), /NOT_FINALIZED/);
  await assert.rejects(service.recordReceiptStage(receiptEvent({ jettonMasterAddress: 'EQ' + 'b'.repeat(46) })), /MASTER_MISMATCH/);
  await assert.rejects(service.recordReceiptStage(receiptEvent({ recipientOwnerAddress: 'UQwrong' })), /RECIPIENT_MISMATCH/);
  await assert.rejects(service.recordReceiptStage(receiptEvent({ transactionHash: 'not-a-hash' })), /INVALID_TRANSACTION_HASH/);
  assert.equal(calls.length, 1);
});

test('receipt ingestion validates stage and integer base-unit amount', async () => {
  const { service, calls } = createHarness();
  await assert.rejects(service.recordReceiptStage(receiptEvent({ stage: 3 })), /INVALID_RECEIPT_STAGE/);
  await assert.rejects(service.recordReceiptStage(receiptEvent({ amountBaseUnits: '1.25' })), /INVALID_BASE_UNIT_AMOUNT/);
  assert.equal(calls.length, 0);
});

test('allocation ingestion accepts exact Founder-signed role transfers only', async () => {
  const { service, calls } = createHarness();
  for (const [allocationRole, allocation] of Object.entries(ALLOCATION_ROLES)) {
    const result = await service.recordAllocationTransfer({
      network: 'mainnet',
      finality: 'finalized',
      jettonMasterAddress: MASTER,
      transactionHash: HASH,
      sourceOwnerAddress: FOUNDER_MAINNET_WALLET,
      allocationRole,
      amountBaseUnits: allocation.amount,
      destinationOwnerAddress: allocation.destination
    });
    assert.equal(result, 'confirmed');
  }
  assert.equal(calls.length, 4);
  await assert.rejects(service.recordAllocationTransfer({
    network: 'mainnet', finality: 'finalized', jettonMasterAddress: MASTER,
    transactionHash: HASH, sourceOwnerAddress: 'UQwrong', allocationRole: 'treasury',
    amountBaseUnits: ALLOCATION_ROLES.treasury.amount,
    destinationOwnerAddress: ALLOCATION_ROLES.treasury.destination
  }), /SOURCE_MISMATCH/);
  await assert.rejects(service.recordAllocationTransfer({
    network: 'mainnet', finality: 'finalized', jettonMasterAddress: MASTER,
    transactionHash: HASH, sourceOwnerAddress: FOUNDER_MAINNET_WALLET, allocationRole: 'treasury',
    amountBaseUnits: '1', destinationOwnerAddress: ALLOCATION_ROLES.treasury.destination
  }), /AMOUNT_MISMATCH/);
  await assert.rejects(service.recordAllocationTransfer({
    network: 'mainnet', finality: 'finalized', jettonMasterAddress: MASTER,
    transactionHash: HASH, sourceOwnerAddress: FOUNDER_MAINNET_WALLET, allocationRole: 'treasury',
    amountBaseUnits: ALLOCATION_ROLES.treasury.amount, destinationOwnerAddress: ALLOCATION_ROLES.mining_reserve.destination
  }), /DESTINATION_MISMATCH/);
  assert.equal(calls.length, 4);
});

test('service refuses to run before the Master address is configured', async () => {
  const pool = { query: async () => ({ rows: [{ status: 'confirmed' }] }) };
  const service = createVcoinChainReconciliation({ pool });
  await assert.rejects(service.recordReceiptStage(receiptEvent()), /MASTER_ADDRESS_NOT_CONFIGURED/);
});
