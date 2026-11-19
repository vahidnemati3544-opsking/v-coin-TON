'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  TonBalanceProviderError,
  crc16Xmodem,
  normalizeTonAddress,
  createToncenterV3JettonBalanceProvider
} = require('../src/services/toncenter-balance-provider');

function rawAddress(fill) {
  return '0:' + fill.repeat(64);
}

function friendlyAddress(fillByte) {
  const bytes = Buffer.alloc(36);
  bytes[0] = 0x11;
  bytes[1] = 0;
  bytes.fill(fillByte, 2, 34);
  const checksum = crc16Xmodem(bytes.subarray(0, 34));
  bytes[34] = (checksum >> 8) & 0xff;
  bytes[35] = checksum & 0xff;
  return bytes.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function mockFetch({ wallets, genUtime = '1999999995', seqno = '12345' }) {
  return async (url, options) => {
    const parsed = new URL(url);
    assert.equal(options.method, 'GET');
    if (parsed.pathname.endsWith('/jetton/wallets')) {
      assert.equal(parsed.searchParams.get('limit'), '2');
      assert.equal(parsed.searchParams.get('offset'), '0');
      return { ok: true, json: async () => ({ jetton_wallets: wallets }) };
    }
    if (parsed.pathname.endsWith('/masterchainInfo')) {
      return {
        ok: true,
        json: async () => ({ last: { gen_utime: genUtime, seqno } })
      };
    }
    throw new Error('Unexpected TON Center endpoint');
  };
}

test('friendly TON addresses are checksum-validated and normalized to raw workchain form', () => {
  const friendly = friendlyAddress(0x12);
  assert.equal(normalizeTonAddress(friendly), rawAddress('12'));
  assert.throws(
    () => normalizeTonAddress(friendly.slice(0, -1) + (friendly.endsWith('A') ? 'B' : 'A')),
    (error) => error instanceof TonBalanceProviderError &&
      error.code === 'INVALID_TON_ADDRESS_CHECKSUM'
  );
});

test('provider returns an immutable, identity-checked Jetton balance snapshot', async () => {
  const owner = rawAddress('11');
  const master = rawAddress('22');
  const wallet = rawAddress('33');
  const provider = createToncenterV3JettonBalanceProvider({
    network: 'testnet',
    masterAddress: master,
    apiKey: 'test-api-key',
    fetchImpl: mockFetch({
      wallets: [{
        address: wallet,
        owner,
        jetton: master,
        balance: '123456789',
        last_transaction_lt: '987654321'
      }]
    }),
    now: () => 2000000000000,
    maxIndexerLagSeconds: 90
  });

  const snapshot = await provider.getVerifiedBalance({ ownerAddress: owner });
  assert.equal(snapshot.network, 'testnet');
  assert.equal(snapshot.ownerAddress, owner);
  assert.equal(snapshot.masterAddress, master);
  assert.equal(snapshot.jettonWalletAddress, wallet);
  assert.equal(snapshot.balanceBaseUnits, '123456789');
  assert.equal(snapshot.lastTransactionLt, '987654321');
  assert.equal(snapshot.indexerMasterchainSeqno, '12345');
  assert.equal(snapshot.indexerLagSeconds, 5);
  assert.equal(snapshot.source, 'toncenter-v3-indexer');
  assert.equal(Object.isFrozen(snapshot), true);
});

test('provider rejects wallet identity mismatch', async () => {
  const owner = rawAddress('11');
  const master = rawAddress('22');
  const provider = createToncenterV3JettonBalanceProvider({
    network: 'mainnet',
    masterAddress: master,
    fetchImpl: mockFetch({
      wallets: [{
        address: rawAddress('33'),
        owner: rawAddress('44'),
        jetton: master,
        balance: '100',
        last_transaction_lt: '1'
      }]
    }),
    now: () => 2000000000000
  });

  await assert.rejects(
    provider.getVerifiedBalance({ ownerAddress: owner }),
    (error) => error.code === 'JETTON_WALLET_IDENTITY_MISMATCH'
  );
});

test('provider rejects missing or ambiguous wallet records', async () => {
  const owner = rawAddress('11');
  const master = rawAddress('22');
  const empty = createToncenterV3JettonBalanceProvider({
    network: 'mainnet',
    masterAddress: master,
    fetchImpl: mockFetch({ wallets: [] }),
    now: () => 2000000000000
  });
  await assert.rejects(
    empty.getVerifiedBalance({ ownerAddress: owner }),
    (error) => error.code === 'JETTON_WALLET_NOT_FOUND'
  );

  const duplicate = createToncenterV3JettonBalanceProvider({
    network: 'mainnet',
    masterAddress: master,
    fetchImpl: mockFetch({
      wallets: [
        { address: rawAddress('33'), owner, jetton: master, balance: '1', last_transaction_lt: '1' },
        { address: rawAddress('55'), owner, jetton: master, balance: '1', last_transaction_lt: '2' }
      ]
    }),
    now: () => 2000000000000
  });
  await assert.rejects(
    duplicate.getVerifiedBalance({ ownerAddress: owner }),
    (error) => error.code === 'JETTON_WALLET_AMBIGUOUS'
  );
});

test('provider fails closed on stale indexer data and malformed balances', async () => {
  const owner = rawAddress('11');
  const master = rawAddress('22');
  const stale = createToncenterV3JettonBalanceProvider({
    network: 'mainnet',
    masterAddress: master,
    fetchImpl: mockFetch({
      wallets: [{
        address: rawAddress('33'),
        owner,
        jetton: master,
        balance: '100',
        last_transaction_lt: '1'
      }],
      genUtime: '1999999800'
    }),
    now: () => 2000000000000,
    maxIndexerLagSeconds: 90
  });
  await assert.rejects(
    stale.getVerifiedBalance({ ownerAddress: owner }),
    (error) => error.code === 'STALE_CHAIN_DATA'
  );

  const malformed = createToncenterV3JettonBalanceProvider({
    network: 'mainnet',
    masterAddress: master,
    fetchImpl: mockFetch({
      wallets: [{
        address: rawAddress('33'),
        owner,
        jetton: master,
        balance: '-1',
        last_transaction_lt: '1'
      }]
    }),
    now: () => 2000000000000
  });
  await assert.rejects(
    malformed.getVerifiedBalance({ ownerAddress: owner }),
    (error) => error.code === 'INVALID_JETTON_BALANCE'
  );
});

test('provider validates network and workchain before making requests', () => {
  assert.throws(
    () => createToncenterV3JettonBalanceProvider({
      network: 'invalid',
      masterAddress: rawAddress('22')
    }),
    (error) => error.code === 'INVALID_TON_NETWORK'
  );
  assert.throws(
    () => createToncenterV3JettonBalanceProvider({
      network: 'mainnet',
      masterAddress: '-1:' + '22'.repeat(32)
    }),
    (error) => error.code === 'UNSUPPORTED_TON_WORKCHAIN'
  );
});
