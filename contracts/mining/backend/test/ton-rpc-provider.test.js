'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { Address, beginCell } = require('@ton/ton');
const { createTonRpcProvider, TonRpcError } = require('../src/services/ton-rpc-provider');

const owner = '0:' + '1'.repeat(64);
const master = '0:' + '2'.repeat(64);
const jettonWallet = '0:' + '3'.repeat(64);

function createFakeClient(overrides = {}) {
  return {
    async getContractState() {
      return { state: overrides.contractState || 'active' };
    },
    async callGetMethod(address, method, stack) {
      if (method === 'get_wallet_address') {
        assert.equal(Address.parse(address.toRawString()).toRawString(), master);
        assert.equal(stack.length, 1);
        return { stack: { readAddress: () => Address.parse(jettonWallet) } };
      }
      assert.equal(method, 'get_wallet_data');
      let addressIndex = 0;
      const addresses = [Address.parse(owner), Address.parse(master)];
      return {
        stack: {
          readBigNumber: () => 2100000000000000n,
          readAddress: () => addresses[addressIndex++],
          readCell: () => beginCell().endCell()
        }
      };
    },
    async getMasterchainInfo() {
      return { latestSeqno: 123456 };
    }
  };
}

test('TON RPC provider derives the Jetton wallet from the configured master and reads TEP-74 data', async () => {
  const provider = createTonRpcProvider({
    network: 'mainnet',
    jettonMasterAddress: master,
    endpoint: 'https://rpc.example/jsonRPC',
    clientFactory: () => createFakeClient()
  });
  const context = { network: 'mainnet', jettonMasterAddress: master };
  const derived = await provider.getJettonWalletAddress(owner, context);
  assert.equal(derived, jettonWallet);

  const data = await provider.getJettonWalletData(derived, context);
  assert.equal(data.ownerAddress, owner);
  assert.equal(data.jettonMasterAddress, master);
  assert.equal(data.balanceBaseUnits, '2100000000000000');
  assert.equal(data.blockSeqno, 123456);
  assert.equal(data.isFinal, true);
});

test('TON RPC provider rejects wrong context and inactive contracts', async () => {
  const provider = createTonRpcProvider({
    network: 'mainnet',
    jettonMasterAddress: master,
    endpoint: 'https://rpc.example/jsonRPC',
    clientFactory: () => createFakeClient({ contractState: 'uninitialized' })
  });
  await assert.rejects(
    provider.getJettonWalletAddress(owner, { network: 'testnet', jettonMasterAddress: master }),
    (error) => error.code === 'TON_RPC_CONTEXT_MISMATCH'
  );
  await assert.rejects(
    provider.getJettonWalletAddress(owner, { network: 'mainnet', jettonMasterAddress: master }),
    (error) => error.code === 'JETTON_MASTER_NOT_ACTIVE'
  );
});

test('TON RPC provider refuses a client without read-only RPC methods', () => {
  assert.throws(() => createTonRpcProvider({
    network: 'mainnet',
    jettonMasterAddress: master,
    endpoint: 'https://rpc.example/jsonRPC',
    clientFactory: () => ({})
  }), (error) => error instanceof TonRpcError && error.code === 'INVALID_TON_RPC_CLIENT');
});
