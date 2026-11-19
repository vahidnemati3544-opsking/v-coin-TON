'use strict';

const TONCENTER_V3_BASE_URLS = Object.freeze({
  mainnet: 'https://toncenter.com/api/v3',
  testnet: 'https://testnet.toncenter.com/api/v3'
});

class TonBalanceProviderError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'TonBalanceProviderError';
    this.code = code;
  }
}

function crc16Xmodem(bytes) {
  let crc = 0;
  for (const byte of bytes) {
    crc ^= byte << 8;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc & 0x8000) !== 0
        ? ((crc << 1) ^ 0x1021)
        : (crc << 1);
      crc &= 0xffff;
    }
  }
  return crc;
}

function normalizeTonAddress(value) {
  if (typeof value !== 'string') {
    throw new TonBalanceProviderError('INVALID_TON_ADDRESS', 'TON address must be a string.');
  }

  const address = value.trim();
  const raw = /^(0|-1):([0-9a-f]{64})$/i.exec(address);
  if (raw) {
    const workchain = Number(raw[1]);
    if (workchain !== 0) {
      throw new TonBalanceProviderError('UNSUPPORTED_TON_WORKCHAIN', 'VCOIN wallet addresses must use workchain 0.');
    }
    return '0:' + raw[2].toLowerCase();
  }

  if (!/^[A-Za-z0-9_-]{48}$/.test(address)) {
    throw new TonBalanceProviderError('INVALID_TON_ADDRESS', 'TON friendly address has an invalid format.');
  }

  const base64 = address.replace(/-/g, '+').replace(/_/g, '/');
  const decoded = Buffer.from(base64, 'base64');
  if (decoded.length !== 36) {
    throw new TonBalanceProviderError('INVALID_TON_ADDRESS', 'TON friendly address has an invalid byte length.');
  }

  const tag = decoded[0] & 0x3f;
  if (tag !== 0x11) {
    throw new TonBalanceProviderError('INVALID_TON_ADDRESS', 'TON friendly address has an unsupported tag.');
  }

  const workchain = decoded[1] > 127 ? decoded[1] - 256 : decoded[1];
  if (workchain !== 0) {
    throw new TonBalanceProviderError('UNSUPPORTED_TON_WORKCHAIN', 'VCOIN wallet addresses must use workchain 0.');
  }

  const expectedCrc = crc16Xmodem(decoded.subarray(0, 34));
  const suppliedCrc = (decoded[34] << 8) | decoded[35];
  if (expectedCrc !== suppliedCrc) {
    throw new TonBalanceProviderError('INVALID_TON_ADDRESS_CHECKSUM', 'TON friendly address checksum is invalid.');
  }

  return '0:' + decoded.subarray(2, 34).toString('hex');
}

function parseUnsignedInteger(value, code, label) {
  if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'bigint') {
    throw new TonBalanceProviderError(code, label + ' must be an integer string.');
  }
  const text = String(value);
  if (!/^(0|[1-9][0-9]*)$/.test(text)) {
    throw new TonBalanceProviderError(code, label + ' must be a non-negative integer.');
  }
  try {
    return BigInt(text);
  } catch {
    throw new TonBalanceProviderError(code, label + ' is outside the supported integer range.');
  }
}

function createToncenterV3JettonBalanceProvider({
  network,
  masterAddress,
  apiKey,
  fetchImpl = globalThis.fetch,
  now = () => Date.now(),
  maxIndexerLagSeconds = 90,
  timeoutMs = 8000
}) {
  if (!Object.hasOwn(TONCENTER_V3_BASE_URLS, network)) {
    throw new TonBalanceProviderError('INVALID_TON_NETWORK', 'Network must be mainnet or testnet.');
  }
  if (typeof fetchImpl !== 'function') {
    throw new TonBalanceProviderError('FETCH_UNAVAILABLE', 'A fetch implementation is required.');
  }
  const normalizedMasterAddress = normalizeTonAddress(masterAddress);
  if (!Number.isSafeInteger(maxIndexerLagSeconds) || maxIndexerLagSeconds < 1) {
    throw new TonBalanceProviderError('INVALID_INDEXER_LAG', 'Indexer lag limit must be a positive integer.');
  }

  const baseUrl = TONCENTER_V3_BASE_URLS[network];

  async function requestJson(path, query) {
    const url = new URL(baseUrl + path);
    for (const [key, value] of Object.entries(query || {})) {
      url.searchParams.set(key, String(value));
    }

    let response;
    try {
      const headers = { accept: 'application/json' };
      if (apiKey) headers['X-API-Key'] = apiKey;
      response = await fetchImpl(url, {
        method: 'GET',
        headers,
        signal: AbortSignal.timeout(timeoutMs)
      });
    } catch {
      throw new TonBalanceProviderError('TONCENTER_UNAVAILABLE', 'TON Center API request failed.');
    }

    if (!response || !response.ok) {
      throw new TonBalanceProviderError('TONCENTER_UNAVAILABLE', 'TON Center API returned an unsuccessful response.');
    }

    try {
      return await response.json();
    } catch {
      throw new TonBalanceProviderError('TONCENTER_INVALID_RESPONSE', 'TON Center API returned invalid JSON.');
    }
  }

  async function getVerifiedBalance({ ownerAddress }) {
    const normalizedOwnerAddress = normalizeTonAddress(ownerAddress);
    const [walletResponse, masterchainResponse] = await Promise.all([
      requestJson('/jetton/wallets', {
        owner_address: ownerAddress,
        jetton_address: masterAddress,
        limit: 2,
        offset: 0
      }),
      requestJson('/masterchainInfo')
    ]);

    const wallets = walletResponse?.jetton_wallets;
    if (!Array.isArray(wallets) || wallets.length !== 1) {
      throw new TonBalanceProviderError(
        wallets?.length === 0 ? 'JETTON_WALLET_NOT_FOUND' : 'JETTON_WALLET_AMBIGUOUS',
        'TON Center did not return exactly one Jetton Wallet for the configured owner and Master.'
      );
    }

    const wallet = wallets[0];
    const actualOwner = normalizeTonAddress(wallet.owner);
    const actualMaster = normalizeTonAddress(wallet.jetton);
    const walletAddress = normalizeTonAddress(wallet.address);
    if (actualOwner !== normalizedOwnerAddress || actualMaster !== normalizedMasterAddress) {
      throw new TonBalanceProviderError('JETTON_WALLET_IDENTITY_MISMATCH', 'Jetton Wallet owner or Master does not match the requested identity.');
    }

    const balance = parseUnsignedInteger(wallet.balance, 'INVALID_JETTON_BALANCE', 'Jetton balance');
    const lastTransactionLt = parseUnsignedInteger(
      wallet.last_transaction_lt,
      'INVALID_JETTON_WALLET_LT',
      'Jetton Wallet last transaction logical time'
    );

    const lastBlock = masterchainResponse?.last;
    const indexerBlockTime = Number(lastBlock?.gen_utime);
    const indexerBlockSeqno = parseUnsignedInteger(
      lastBlock?.seqno,
      'INVALID_INDEXER_BLOCK',
      'Indexer masterchain sequence number'
    );
    if (!Number.isSafeInteger(indexerBlockTime) || indexerBlockTime <= 0) {
      throw new TonBalanceProviderError('INVALID_INDEXER_BLOCK', 'TON Center did not return a valid indexed masterchain timestamp.');
    }

    const observedAtMs = now();
    if (!Number.isSafeInteger(observedAtMs) || observedAtMs <= 0) {
      throw new TonBalanceProviderError('INVALID_CLOCK', 'Provider clock returned an invalid timestamp.');
    }
    const indexerLagSeconds = Math.floor(observedAtMs / 1000) - indexerBlockTime;
    if (indexerLagSeconds < -5 || indexerLagSeconds > maxIndexerLagSeconds) {
      throw new TonBalanceProviderError('STALE_CHAIN_DATA', 'TON Center indexed masterchain data is outside the allowed freshness window.');
    }

    return Object.freeze({
      network,
      ownerAddress: normalizedOwnerAddress,
      masterAddress: normalizedMasterAddress,
      jettonWalletAddress: walletAddress,
      balanceBaseUnits: balance.toString(),
      lastTransactionLt: lastTransactionLt.toString(),
      indexerMasterchainSeqno: indexerBlockSeqno.toString(),
      indexerBlockUtime: indexerBlockTime,
      indexerLagSeconds: Math.max(0, indexerLagSeconds),
      observedAt: new Date(observedAtMs).toISOString(),
      source: 'toncenter-v3-indexer'
    });
  }

  return Object.freeze({ getVerifiedBalance });
}

module.exports = {
  TONCENTER_V3_BASE_URLS,
  TonBalanceProviderError,
  crc16Xmodem,
  normalizeTonAddress,
  createToncenterV3JettonBalanceProvider
};
