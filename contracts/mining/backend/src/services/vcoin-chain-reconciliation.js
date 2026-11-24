'use strict';

const FOUNDER_MAINNET_WALLET = 'UQBh9jVKAypc4TrbFx2jsVB2EI1ONChg22zDputisQjENQOT';
const ALLOCATION_ROLES = Object.freeze({
  mining_reserve: {
    amount: '1050000000000000',
    destination: 'UQDMEIvklqeBW0Pn74sBHzOpoFGsSWDHE5NxZwfN-1KVsBD0'
  },
  treasury: {
    amount: '210000000000000',
    destination: 'UQBEW5bLGbq0yVDOimgl6fpZbQkdla9Wk5b0tXyx69bmBktQ'
  },
  liquidity_market: {
    amount: '210000000000000',
    destination: 'UQA0_thi3mXZ6jFlHHBfnyjVmXayR3hsGx5PC43_fBOTzXWn'
  },
  ecosystem_marketing: {
    amount: '210000000000000',
    destination: 'UQBQDb73DWWMGnxEr37TsqZSKNvVOC9MMwkvRmNY91LJqLsE'
  }
});

function requirePool(pool) {
  if (!pool || typeof pool.query !== 'function') {
    throw new TypeError('A PostgreSQL pool is required');
  }
}

function requireFinalizedMainnetEvent(event, expectedMasterAddress) {
  if (!event || typeof event !== 'object') throw new TypeError('A verified chain event is required');
  if (event.network !== 'mainnet') throw new Error('VCOIN_MAINNET_EVENTS_ONLY');
  if (event.finality !== 'finalized') throw new Error('VCOIN_TRANSACTION_NOT_FINALIZED');
  if (typeof expectedMasterAddress !== 'string' || !expectedMasterAddress.trim()) {
    throw new Error('VCOIN_JETTON_MASTER_ADDRESS_NOT_CONFIGURED');
  }
  if (event.jettonMasterAddress !== expectedMasterAddress) {
    throw new Error('VCOIN_JETTON_MASTER_MISMATCH');
  }
  if (typeof event.transactionHash !== 'string' || !/^[0-9a-fA-F]{64}$/.test(event.transactionHash)) {
    throw new Error('VCOIN_INVALID_TRANSACTION_HASH');
  }
}

function requireBaseUnits(value) {
  if (typeof value !== 'string' || !/^[1-9][0-9]*$/.test(value)) {
    throw new Error('VCOIN_INVALID_BASE_UNIT_AMOUNT');
  }
  return value;
}

function createVcoinChainReconciliation({ pool, expectedMasterAddress, expectedJettonWallets, founderWallet = FOUNDER_MAINNET_WALLET }) {
  requirePool(pool);
  if (typeof founderWallet !== 'string' || !founderWallet.trim()) {
    throw new TypeError('A Founder Mainnet wallet is required');
  }

  async function recordReceiptStage(event) {
    requireFinalizedMainnetEvent(event, expectedMasterAddress);
    if (![1, 2].includes(event.stage)) throw new Error('VCOIN_INVALID_RECEIPT_STAGE');
    if (event.recipientOwnerAddress !== founderWallet) throw new Error('VCOIN_RECEIPT_RECIPIENT_MISMATCH');
    if (!expectedJettonWallets?.founder) throw new Error('VCOIN_JETTON_WALLETS_NOT_CONFIGURED');
    if (event.recipientJettonWalletAddress !== expectedJettonWallets.founder) throw new Error('VCOIN_RECEIPT_JETTON_WALLET_MISMATCH');
    const amount = requireBaseUnits(event.amountBaseUnits);
    const result = await pool.query(
      'SELECT record_vcoin_receipt_stage($1::smallint, $2::numeric, $3, $4, $5) AS status',
      [event.stage, amount, event.transactionHash.toLowerCase(), event.jettonMasterAddress, event.recipientOwnerAddress]
    );
    return result.rows[0]?.status;
  }

  async function recordAllocationTransfer(event) {
    requireFinalizedMainnetEvent(event, expectedMasterAddress);
    if (event.sourceOwnerAddress !== founderWallet) throw new Error('VCOIN_ALLOCATION_SOURCE_MISMATCH');
    if (!expectedJettonWallets?.founder || !expectedJettonWallets?.[event.allocationRole]) {
      throw new Error('VCOIN_JETTON_WALLETS_NOT_CONFIGURED');
    }
    if (event.sourceJettonWalletAddress !== expectedJettonWallets.founder) {
      throw new Error('VCOIN_ALLOCATION_SOURCE_JETTON_WALLET_MISMATCH');
    }
    const allocation = ALLOCATION_ROLES[event.allocationRole];
    if (!allocation) throw new Error('VCOIN_INVALID_ALLOCATION_ROLE');
    const amount = requireBaseUnits(event.amountBaseUnits);
    if (amount !== allocation.amount) throw new Error('VCOIN_ALLOCATION_AMOUNT_MISMATCH');
    if (event.destinationJettonWalletAddress !== expectedJettonWallets[event.allocationRole]) {
      throw new Error('VCOIN_ALLOCATION_DESTINATION_JETTON_WALLET_MISMATCH');
    }
    if (event.destinationOwnerAddress !== allocation.destination) {
      throw new Error('VCOIN_ALLOCATION_DESTINATION_MISMATCH');
    }
    const result = await pool.query(
      'SELECT record_vcoin_allocation_transfer($1, $2::numeric, $3, $4, $5) AS status',
      [event.allocationRole, amount, event.transactionHash.toLowerCase(), event.sourceOwnerAddress, event.destinationOwnerAddress]
    );
    return result.rows[0]?.status;
  }

  return Object.freeze({ recordReceiptStage, recordAllocationTransfer });
}

module.exports = {
  FOUNDER_MAINNET_WALLET,
  ALLOCATION_ROLES,
  createVcoinChainReconciliation
};
