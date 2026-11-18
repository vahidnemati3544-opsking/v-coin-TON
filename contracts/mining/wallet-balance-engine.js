'use strict';

const DAY_MS = 86400000n;
const DAILY_RATE_DENOMINATOR = 100n;
const TOKEN_DECIMALS = 6;

class WalletMiningError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'WalletMiningError';
    this.code = code;
  }
}

function asPositiveInteger(value, code, label) {
  if (typeof value !== 'string' || !/^(0|[1-9][0-9]*)$/.test(value)) {
    throw new WalletMiningError(code, label + ' must be a non-negative integer string.');
  }
  return BigInt(value);
}

function validateSnapshot(snapshot, expected) {
  if (!snapshot || typeof snapshot !== 'object') {
    throw new WalletMiningError('WALLET_SNAPSHOT_MISSING', 'A verified wallet snapshot is required.');
  }
  if (snapshot.verified !== true || snapshot.finalized !== true) {
    throw new WalletMiningError('WALLET_SNAPSHOT_UNVERIFIED', 'Wallet ownership and finalized chain data must be verified.');
  }
  if (snapshot.network !== expected.network) {
    throw new WalletMiningError('WALLET_NETWORK_MISMATCH', 'Wallet snapshot is from an unexpected TON network.');
  }
  if (snapshot.jettonMasterAddress !== expected.jettonMasterAddress) {
    throw new WalletMiningError('JETTON_MASTER_MISMATCH', 'Wallet snapshot does not belong to the approved VCOIN Jetton master.');
  }
  if (typeof snapshot.ownerAddress !== 'string' || snapshot.ownerAddress.length < 10) {
    throw new WalletMiningError('INVALID_WALLET_OWNER', 'A verified TON wallet owner address is required.');
  }
  if (snapshot.decimals !== TOKEN_DECIMALS) {
    throw new WalletMiningError('JETTON_DECIMALS_MISMATCH', 'VCOIN must use exactly six decimals.');
  }
  if (typeof snapshot.sourceProvider !== 'string' || snapshot.sourceProvider.trim() === '') {
    throw new WalletMiningError('SNAPSHOT_SOURCE_MISSING', 'A trusted chain data source must be recorded.');
  }
  if (!Number.isSafeInteger(snapshot.sourceBlockSeqno) || snapshot.sourceBlockSeqno < 1) {
    throw new WalletMiningError('SNAPSHOT_BLOCK_MISSING', 'A valid finalized source block sequence is required.');
  }
  if (typeof snapshot.snapshotId !== 'string' || snapshot.snapshotId.length < 8) {
    throw new WalletMiningError('SNAPSHOT_ID_MISSING', 'A unique wallet snapshot identifier is required.');
  }
  const balance = asPositiveInteger(snapshot.balanceBaseUnits, 'INVALID_WALLET_BALANCE', 'Wallet balance');
  const fetchedAtMs = Date.parse(snapshot.fetchedAt);
  if (!Number.isFinite(fetchedAtMs)) {
    throw new WalletMiningError('INVALID_SNAPSHOT_TIME', 'Wallet snapshot timestamp is invalid.');
  }
  return { balance, fetchedAtMs };
}

function calculateWalletReward(balanceBaseUnits, elapsedMilliseconds) {
  let balance;
  let elapsed;
  try {
    balance = BigInt(balanceBaseUnits);
    elapsed = BigInt(elapsedMilliseconds);
  } catch {
    throw new WalletMiningError('INVALID_REWARD_INPUT', 'Balance and elapsed time must be integers.');
  }
  if (balance < 0n || elapsed < 0n) {
    throw new WalletMiningError('INVALID_REWARD_INPUT', 'Balance and elapsed time cannot be negative.');
  }
  // 1% of the USD value per 24h. With the same VCOIN/USD valuation
  // snapshot on both sides, price cancels: reward = 1% of VCOIN balance.
  return (balance * elapsed) / (DAILY_RATE_DENOMINATOR * DAY_MS);
}

function createWalletBalanceMiningEngine({
  readVerifiedWalletSnapshot,
  network,
  jettonMasterAddress,
  maxSnapshotAgeMs = 60000,
  now = () => Date.now()
}) {
  if (typeof readVerifiedWalletSnapshot !== 'function') {
    throw new WalletMiningError('WALLET_READER_NOT_CONFIGURED', 'A trusted verified-wallet snapshot reader is required.');
  }
  if (!['testnet', 'mainnet'].includes(network)) {
    throw new WalletMiningError('TON_NETWORK_NOT_CONFIGURED', 'TON network must be explicitly set to testnet or mainnet.');
  }
  if (typeof jettonMasterAddress !== 'string' || jettonMasterAddress.trim().length < 10) {
    throw new WalletMiningError('JETTON_MASTER_NOT_CONFIGURED', 'The approved VCOIN Jetton master address must be configured.');
  }
  if (!Number.isSafeInteger(maxSnapshotAgeMs) || maxSnapshotAgeMs <= 0) {
    throw new WalletMiningError('INVALID_SNAPSHOT_AGE', 'Maximum snapshot age must be a positive integer.');
  }

  async function quoteDailyReward({ userId }) {
    if (typeof userId !== 'string' || userId.length < 1) {
      throw new WalletMiningError('INVALID_USER_ID', 'An authenticated user ID is required.');
    }
    const snapshot = await readVerifiedWalletSnapshot({ userId });
    const validated = validateSnapshot(snapshot, { network, jettonMasterAddress });
    const ageMs = now() - validated.fetchedAtMs;
    if (!Number.isFinite(ageMs) || ageMs < 0 || ageMs > maxSnapshotAgeMs) {
      throw new WalletMiningError('WALLET_SNAPSHOT_STALE', 'Wallet snapshot is stale or from the future; mining must fail closed.');
    }
    const dailyRewardBaseUnits = calculateWalletReward(validated.balance, DAY_MS);
    return Object.freeze({
      userId,
      snapshotId: snapshot.snapshotId,
      network: snapshot.network,
      jettonMasterAddress: snapshot.jettonMasterAddress,
      ownerAddress: snapshot.ownerAddress,
      sourceBlockSeqno: snapshot.sourceBlockSeqno,
      balanceBaseUnits: validated.balance.toString(),
      dailyRewardBaseUnits: dailyRewardBaseUnits.toString(),
      rewardRate: '0.01',
      rewardPeriodMs: DAY_MS.toString(),
      decimals: TOKEN_DECIMALS
    });
  }

  return Object.freeze({ quoteDailyReward });
}

module.exports = {
  WalletMiningError,
  calculateWalletReward,
  validateSnapshot,
  createWalletBalanceMiningEngine,
  TOKEN_DECIMALS,
  DAY_MS
};
