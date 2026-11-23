'use strict';

class JettonBalanceError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'JettonBalanceError';
    this.code = code;
  }
}

function requiredAddress(value, label) {
  if (typeof value !== 'string' || value.trim().length === 0 || value.length > 150) {
    throw new JettonBalanceError('INVALID_ADDRESS', label + ' is missing or invalid.');
  }
  return value.trim();
}

function createJettonBalanceReader({
  network,
  jettonMasterAddress,
  provider,
  addressEquals = (left, right) => left === right,
  now = () => Date.now(),
  maxSnapshotAgeMs = 120000
}) {
  if (!['mainnet', 'testnet'].includes(network)) {
    throw new JettonBalanceError('INVALID_NETWORK', 'Network must be mainnet or testnet.');
  }
  const master = requiredAddress(jettonMasterAddress, 'Jetton master address');
  if (!provider ||
      typeof provider.getJettonWalletAddress !== 'function' ||
      typeof provider.getJettonWalletData !== 'function') {
    throw new JettonBalanceError('INVALID_PROVIDER', 'A TON provider with Jetton wallet read methods is required.');
  }
  if (typeof addressEquals !== 'function' || typeof now !== 'function' ||
      !Number.isSafeInteger(maxSnapshotAgeMs) || maxSnapshotAgeMs < 1000) {
    throw new JettonBalanceError('INVALID_READER_CONFIG', 'Snapshot verification configuration is invalid.');
  }

  return Object.freeze({
    async read(ownerWalletAddress) {
      const owner = requiredAddress(ownerWalletAddress, 'Owner wallet address');
      let derivedWallet;
      try {
        derivedWallet = requiredAddress(
          await provider.getJettonWalletAddress(owner, {
            network,
            jettonMasterAddress: master
          }),
          'Derived Jetton wallet address'
        );
      } catch (error) {
        if (error instanceof JettonBalanceError) throw error;
        throw new JettonBalanceError('JETTON_WALLET_DERIVATION_FAILED', 'Could not derive the owner Jetton wallet from the configured master.');
      }

      let data;
      try {
        data = await provider.getJettonWalletData(derivedWallet, { network });
      } catch (_) {
        throw new JettonBalanceError('JETTON_WALLET_READ_FAILED', 'Could not read Jetton wallet data from TON.');
      }
      if (!data || typeof data !== 'object') {
        throw new JettonBalanceError('INVALID_CHAIN_RESPONSE', 'TON provider returned no Jetton wallet data.');
      }

      const reportedOwner = requiredAddress(data.ownerAddress, 'On-chain Jetton wallet owner');
      const reportedMaster = requiredAddress(data.jettonMasterAddress, 'On-chain Jetton master');
      if (!addressEquals(reportedOwner, owner)) {
        throw new JettonBalanceError('JETTON_OWNER_MISMATCH', 'Jetton wallet owner does not match the authenticated owner wallet.');
      }
      if (!addressEquals(reportedMaster, master)) {
        throw new JettonBalanceError('JETTON_MASTER_MISMATCH', 'Jetton wallet belongs to a different Jetton master.');
      }

      let balance;
      try {
        if (typeof data.balanceBaseUnits !== 'string' && typeof data.balanceBaseUnits !== 'bigint') {
          throw new Error('balance must be an integer string');
        }
        balance = BigInt(data.balanceBaseUnits);
      } catch (_) {
        throw new JettonBalanceError('INVALID_CHAIN_BALANCE', 'Jetton balance must be an integer base-unit value.');
      }
      if (balance < 0n) {
        throw new JettonBalanceError('INVALID_CHAIN_BALANCE', 'Jetton balance cannot be negative.');
      }

      if (!Number.isSafeInteger(data.blockSeqno) || data.blockSeqno < 0) {
        throw new JettonBalanceError('INVALID_CHAIN_BLOCK', 'TON block sequence number is missing or invalid.');
      }
      if (data.isFinal !== true) {
        throw new JettonBalanceError('CHAIN_SNAPSHOT_NOT_FINAL', 'Mining requires a finalized TON balance snapshot.');
      }
      const observedAtMs = typeof data.observedAt === 'string' || data.observedAt instanceof Date
        ? new Date(data.observedAt).getTime()
        : NaN;
      const currentTime = now();
      if (!Number.isFinite(observedAtMs) || !Number.isSafeInteger(currentTime) ||
          observedAtMs > currentTime + 30000 || currentTime - observedAtMs > maxSnapshotAgeMs) {
        throw new JettonBalanceError('CHAIN_SNAPSHOT_STALE', 'TON balance snapshot is stale or has an invalid timestamp.');
      }

      return Object.freeze({
        network,
        ownerWalletAddress: owner,
        jettonMasterAddress: master,
        jettonWalletAddress: derivedWallet,
        balanceBaseUnits: balance.toString(),
        blockSeqno: data.blockSeqno,
        observedAt: new Date(observedAtMs).toISOString(),
        isFinal: true
      });
    }
  });
}

module.exports = { JettonBalanceError, createJettonBalanceReader };
