'use strict';

const { Address, TonClient, beginCell } = require('@ton/ton');

class TonRpcError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'TonRpcError';
    this.code = code;
  }
}

const NETWORKS = Object.freeze({
  mainnet: {
    globalId: '-239',
    defaultEndpoint: 'https://toncenter.com/api/v2/jsonRPC'
  },
  testnet: {
    globalId: '-3',
    defaultEndpoint: 'https://testnet.toncenter.com/api/v2/jsonRPC'
  }
});

function createTonRpcProvider({
  network,
  jettonMasterAddress,
  endpoint,
  apiKey,
  clientFactory = (parameters) => new TonClient(parameters)
}) {
  const networkConfig = NETWORKS[network];
  if (!networkConfig) {
    throw new TonRpcError('INVALID_NETWORK', 'TON RPC network must be mainnet or testnet.');
  }
  if (typeof endpoint !== 'string' || !/^https:\/\//i.test(endpoint)) {
    throw new TonRpcError('TON_RPC_NOT_CONFIGURED', 'A secure HTTPS TON RPC endpoint is required.');
  }
  let master;
  try {
    master = Address.parse(jettonMasterAddress);
  } catch (_) {
    throw new TonRpcError('INVALID_JETTON_MASTER', 'Configured VCOIN Jetton master address is invalid.');
  }

  if (typeof clientFactory !== 'function') {
    throw new TonRpcError('INVALID_TON_RPC_CLIENT_FACTORY', 'TON RPC client factory must be a function.');
  }
  const client = clientFactory({
    endpoint,
    ...(typeof apiKey === 'string' && apiKey.length > 0 ? { apiKey } : {})
  });
  if (!client || typeof client.getContractState !== 'function' ||
      typeof client.callGetMethod !== 'function' ||
      typeof client.getMasterchainInfo !== 'function') {
    throw new TonRpcError('INVALID_TON_RPC_CLIENT', 'TON RPC client does not implement the required read methods.');
  }

  function assertContext(context) {
    if (!context || context.network !== network ||
        !Address.parse(context.jettonMasterAddress).equals(master)) {
      throw new TonRpcError('TON_RPC_CONTEXT_MISMATCH', 'TON RPC request does not match the configured network and Jetton master.');
    }
  }

  return Object.freeze({
    async getJettonWalletAddress(ownerWalletAddress, context) {
      assertContext(context);
      let owner;
      try {
        owner = Address.parse(ownerWalletAddress);
      } catch (_) {
        throw new TonRpcError('INVALID_OWNER_ADDRESS', 'Owner TON wallet address is invalid.');
      }
      const masterState = await client.getContractState(master);
      if (masterState.state !== 'active') {
        throw new TonRpcError('JETTON_MASTER_NOT_ACTIVE', 'Configured VCOIN Jetton master is not active on the selected network.');
      }
      const result = await client.callGetMethod(master, 'get_wallet_address', [
        { type: 'slice', cell: beginCell().storeAddress(owner).endCell() }
      ]);
      return result.stack.readAddress().toRawString();
    },

    async getJettonWalletData(jettonWalletAddress, context) {
      assertContext(context);
      let walletAddress;
      try {
        walletAddress = Address.parse(jettonWalletAddress);
      } catch (_) {
        throw new TonRpcError('INVALID_JETTON_WALLET_ADDRESS', 'Derived Jetton wallet address is invalid.');
      }
      const state = await client.getContractState(walletAddress);
      if (state.state !== 'active') {
        throw new TonRpcError('JETTON_WALLET_NOT_ACTIVE', 'The owner Jetton wallet is not active on the selected network.');
      }

      const result = await client.callGetMethod(walletAddress, 'get_wallet_data', []);
      const balanceBaseUnits = result.stack.readBigNumber().toString();
      const ownerAddress = result.stack.readAddress().toRawString();
      const reportedMaster = result.stack.readAddress().toRawString();
      result.stack.readCell(); // Validate the fourth TEP-74 return item is present.

      const masterchain = await client.getMasterchainInfo();
      if (!Number.isSafeInteger(masterchain.latestSeqno) || masterchain.latestSeqno <= 0) {
        throw new TonRpcError('TON_MASTERCHAIN_UNAVAILABLE', 'TON RPC did not return a valid latest masterchain sequence.');
      }

      return Object.freeze({
        ownerAddress,
        jettonMasterAddress: reportedMaster,
        balanceBaseUnits,
        blockSeqno: masterchain.latestSeqno,
        observedAt: new Date().toISOString(),
        isFinal: true
      });
    }
  });
}

module.exports = { TonRpcError, createTonRpcProvider, NETWORKS };
