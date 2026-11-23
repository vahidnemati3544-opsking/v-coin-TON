'use strict';

const {
  createHash,
  createPublicKey,
  randomBytes,
  verify: verifyEd25519
} = require('node:crypto');
const {
  Address,
  Cell,
  WalletContractV1R1,
  WalletContractV1R2,
  WalletContractV1R3,
  WalletContractV2R1,
  WalletContractV2R2,
  WalletContractV3R1,
  WalletContractV3R2,
  WalletContractV4,
  WalletContractV5R1,
  contractAddress,
  loadStateInit
} = require('@ton/ton');

const TON_MAINNET_GLOBAL_ID = '-239';
const TON_TESTNET_GLOBAL_ID = '-3';
const TON_PROOF_PREFIX = Buffer.from('ton-proof-item-v2/', 'utf8');
const TON_CONNECT_PREFIX = Buffer.from('ton-connect', 'utf8');
const ED25519_SPKI_PREFIX = Buffer.from('302a300506032b6570032100', 'hex');
const PROOF_MAX_AGE_SECONDS = 10 * 60;
const CHALLENGE_TTL_SECONDS = 10 * 60;

class TonProofError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'TonProofError';
    this.code = code;
  }
}

function sha256(value) {
  return createHash('sha256').update(value).digest();
}

function mapNetwork(globalId) {
  if (globalId === TON_MAINNET_GLOBAL_ID) return 'mainnet';
  if (globalId === TON_TESTNET_GLOBAL_ID) return 'testnet';
  throw new TonProofError('UNSUPPORTED_TON_NETWORK', 'Only TON Mainnet and Testnet are accepted.');
}

function extractSupportedWalletPublicKey(stateInit, workchain) {
  if (!stateInit.code || !stateInit.data) {
    throw new TonProofError('UNSUPPORTED_WALLET_STATE_INIT', 'Wallet state init must contain code and data.');
  }
  const loadV1 = (slice) => { slice.loadUint(32); return slice.loadBuffer(32); };
  const loadV2 = (slice) => { slice.loadUint(32); return slice.loadBuffer(32); };
  const loadV3 = (slice) => { slice.loadUint(32); slice.loadUint(32); return slice.loadBuffer(32); };
  const loadV4 = (slice) => { slice.loadUint(32); slice.loadUint(32); return slice.loadBuffer(32); };
  const loadV5 = (slice) => {
    slice.loadBoolean();
    slice.loadUint(32);
    slice.loadUint(32);
    return slice.loadBuffer(32);
  };
  const candidates = [
    { name: 'v1r1', contract: WalletContractV1R1, load: loadV1 },
    { name: 'v1r2', contract: WalletContractV1R2, load: loadV1 },
    { name: 'v1r3', contract: WalletContractV1R3, load: loadV1 },
    { name: 'v2r1', contract: WalletContractV2R1, load: loadV2 },
    { name: 'v2r2', contract: WalletContractV2R2, load: loadV2 },
    { name: 'v3r1', contract: WalletContractV3R1, load: loadV3 },
    { name: 'v3r2', contract: WalletContractV3R2, load: loadV3 },
    { name: 'v4r2', contract: WalletContractV4, load: loadV4 },
    { name: 'v5r1', contract: WalletContractV5R1, load: loadV5, walletId: { networkGlobalId: -239 } }
  ].map((item) => ({
    name: item.name,
    load: item.load,
    code: item.contract.create({
      workchain,
      publicKey: Buffer.alloc(32),
      ...(item.walletId ? { walletId: item.walletId } : {})
    }).init.code
  }));
  const candidate = candidates.find((item) => item.code.equals(stateInit.code));
  if (!candidate) {
    throw new TonProofError('UNSUPPORTED_WALLET_VERSION', 'This wallet contract version is not in the reviewed TON proof allowlist.');
  }
  try {
    const publicKey = candidate.load(stateInit.data.beginParse());
    if (!Buffer.isBuffer(publicKey) || publicKey.length !== 32) throw new Error('invalid key length');
    return publicKey;
  } catch (_) {
    throw new TonProofError('INVALID_WALLET_STATE_INIT', 'Wallet public key could not be extracted from the supported state init.');
  }
}

function buildTonProofDigest(address, proof) {
  const workchain = Buffer.alloc(4);
  workchain.writeInt32BE(address.workChain, 0);

  const domainBytes = Buffer.from(proof.domain.value, 'utf8');
  const domainLength = Buffer.alloc(4);
  domainLength.writeUInt32LE(domainBytes.length, 0);

  const timestamp = Buffer.alloc(8);
  timestamp.writeBigUInt64LE(BigInt(proof.timestamp), 0);

  const message = Buffer.concat([
    TON_PROOF_PREFIX,
    workchain,
    address.hash,
    domainLength,
    domainBytes,
    timestamp,
    Buffer.from(proof.payload, 'utf8')
  ]);

  return sha256(Buffer.concat([
    Buffer.from([0xff, 0xff]),
    TON_CONNECT_PREFIX,
    sha256(message)
  ]));
}

function verifyTonProof(input, options = {}) {
  const nowSeconds = options.nowSeconds ?? Math.floor(Date.now() / 1000);
  const expectedDomain = options.expectedDomain;
  if (typeof expectedDomain !== 'string' || !expectedDomain.includes('.')) {
    throw new TonProofError('TON_PROOF_NOT_CONFIGURED', 'A valid dApp domain is required before TON wallet authentication can be enabled.');
  }
  if (!input || typeof input !== 'object') {
    throw new TonProofError('INVALID_PROOF_REQUEST', 'TON proof request is invalid.');
  }

  let address;
  let stateInit;
  try {
    address = Address.parse(input.address);
    const walletStateInit = input.walletStateInit || input.proof?.state_init;
    if (typeof walletStateInit !== 'string' || walletStateInit.length > 20000) {
      throw new Error('walletStateInit missing');
    }
    stateInit = loadStateInit(Cell.fromBase64(walletStateInit).beginParse());
  } catch (_) {
    throw new TonProofError('INVALID_WALLET_STATE_INIT', 'Wallet address or state init is invalid.');
  }

  const derivedAddress = contractAddress(address.workChain, stateInit);
  if (!derivedAddress.equals(address)) {
    throw new TonProofError('WALLET_STATE_INIT_ADDRESS_MISMATCH', 'Wallet state init does not derive the connected wallet address.');
  }

  const network = mapNetwork(input.network);
  const proof = input.proof;
  if (!proof || typeof proof !== 'object') {
    throw new TonProofError('INVALID_TON_PROOF', 'Wallet did not provide a TON proof.');
  }
  const timestamp = typeof proof.timestamp === 'string' && /^\d+$/.test(proof.timestamp)
    ? Number(proof.timestamp)
    : proof.timestamp;
  if (!Number.isSafeInteger(timestamp) || timestamp < 0 ||
      timestamp > nowSeconds + 30 || nowSeconds - timestamp > PROOF_MAX_AGE_SECONDS) {
    throw new TonProofError('TON_PROOF_EXPIRED', 'TON proof timestamp is outside the accepted time window.');
  }
  if (!proof.domain || typeof proof.domain.value !== 'string' ||
      proof.domain.value !== expectedDomain) {
    throw new TonProofError('TON_PROOF_DOMAIN_MISMATCH', 'TON proof domain does not match the configured application domain.');
  }
  const domainBytes = Buffer.from(proof.domain.value, 'utf8');
  if (!Number.isSafeInteger(proof.domain.lengthBytes) ||
      proof.domain.lengthBytes !== domainBytes.length ||
      domainBytes.length > 128 || !proof.domain.value.includes('.')) {
    throw new TonProofError('TON_PROOF_DOMAIN_LENGTH_INVALID', 'TON proof domain byte length is invalid.');
  }
  if (typeof proof.payload !== 'string' || proof.payload.length < 32 || proof.payload.length > 128 || domainBytes.length + Buffer.byteLength(proof.payload, 'utf8') > 222) {
    throw new TonProofError('TON_PROOF_PAYLOAD_INVALID', 'TON proof challenge is missing or invalid.');
  }
  if (typeof proof.signature !== 'string' || proof.signature.length > 256 ||
      !/^[A-Za-z0-9+/]+={0,2}$/.test(proof.signature)) {
    throw new TonProofError('TON_PROOF_SIGNATURE_INVALID', 'TON proof signature encoding is invalid.');
  }

  const publicKey = extractSupportedWalletPublicKey(stateInit, address.workChain);
  if (input.publicKey !== undefined &&
      (typeof input.publicKey !== 'string' ||
       !/^[a-f0-9]{64}$/i.test(input.publicKey) ||
       !Buffer.from(input.publicKey, 'hex').equals(publicKey))) {
    throw new TonProofError('WALLET_PUBLIC_KEY_MISMATCH', 'Wallet-reported public key does not match the address-bound state init.');
  }

  const signature = Buffer.from(proof.signature, 'base64');
  if (signature.length !== 64) {
    throw new TonProofError('TON_PROOF_SIGNATURE_INVALID', 'TON proof signature must contain 64 bytes.');
  }
  const digest = buildTonProofDigest(address, { ...proof, timestamp });
  const keyObject = createPublicKey({
    key: Buffer.concat([ED25519_SPKI_PREFIX, publicKey]),
    format: 'der',
    type: 'spki'
  });
  if (!verifyEd25519(null, digest, keyObject, signature)) {
    throw new TonProofError('TON_PROOF_SIGNATURE_INVALID', 'TON proof signature verification failed.');
  }

  return Object.freeze({
    address: address.toRawString(),
    friendlyAddress: address.toString({ bounceable: true, urlSafe: true }),
    network,
    publicKey: publicKey.toString('hex'),
    payload: proof.payload,
    timestamp
  });
}

function createTonProofService({ pool, expectedDomain, nowSeconds = () => Math.floor(Date.now() / 1000) }) {
  if (!pool || typeof pool.connect !== 'function') {
    throw new TypeError('A PostgreSQL pool is required.');
  }

  return Object.freeze({
    async createChallenge({ userId, sessionId, network }) {
      if (!['mainnet', 'testnet'].includes(network)) {
        throw new TonProofError('UNSUPPORTED_TON_NETWORK', 'Network must be mainnet or testnet.');
      }
      const payload = randomBytes(32).toString('hex');
      const payloadHash = sha256(Buffer.from(payload, 'utf8')).toString('hex');
      const client = await pool.connect();
      try {
        await client.query(
          'INSERT INTO ton_proof_challenges (user_id, session_id, payload_sha256, network, expires_at) ' +
          "VALUES ($1, $2, $3, $4, clock_timestamp() + ($5 * INTERVAL '1 second'))",
          [userId, sessionId, payloadHash, network, CHALLENGE_TTL_SECONDS]
        );
      } finally {
        client.release();
      }
      return Object.freeze({ payload, expiresIn: CHALLENGE_TTL_SECONDS });
    },

    async verifyAndBind({ userId, sessionId, input }) {
      const identity = verifyTonProof(input, {
        expectedDomain,
        nowSeconds: nowSeconds()
      });
      const payloadHash = sha256(Buffer.from(identity.payload, 'utf8')).toString('hex');
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const challenge = await client.query(
          'UPDATE ton_proof_challenges SET consumed_at = clock_timestamp() ' +
          'WHERE payload_sha256 = $1 AND user_id = $2 AND session_id = $3 ' +
          "AND network = $4 AND consumed_at IS NULL AND expires_at > clock_timestamp() " +
          'RETURNING id',
          [payloadHash, userId, sessionId, identity.network]
        );
        if (challenge.rowCount !== 1) {
          throw new TonProofError('TON_PROOF_CHALLENGE_INVALID', 'TON proof challenge expired, was already used, or belongs to another login session.');
        }

        const chainGlobalId = identity.network === 'mainnet'
          ? TON_MAINNET_GLOBAL_ID
          : TON_TESTNET_GLOBAL_ID;
        const existing = await client.query(
          'SELECT id, wallet_address, is_verified FROM wallets ' +
          "WHERE user_id = $1 AND network = 'TON' AND chain_global_id = $2 FOR UPDATE",
          [userId, chainGlobalId]
        );
        if (existing.rowCount === 1 && existing.rows[0].is_verified &&
            existing.rows[0].wallet_address !== identity.address) {
          throw new TonProofError('WALLET_ALREADY_BOUND', 'A different verified wallet is already bound for this TON network.');
        }

        const wallet = await client.query(
          "INSERT INTO wallets (user_id, network, chain_global_id, wallet_address, is_verified) " +
          "VALUES ($1, 'TON', $2, $3, TRUE) " +
          "ON CONFLICT (user_id, network, chain_global_id) WHERE chain_global_id IS NOT NULL " +
          "DO UPDATE SET wallet_address = EXCLUDED.wallet_address, is_verified = TRUE, " +
          'updated_at = clock_timestamp() ' +
          'WHERE wallets.is_verified = FALSE OR wallets.wallet_address = EXCLUDED.wallet_address ' +
          'RETURNING id, wallet_address, is_verified',
          [userId, chainGlobalId, identity.address]
        );
        if (wallet.rowCount !== 1) {
          throw new TonProofError('WALLET_ALREADY_BOUND', 'This TON wallet could not be bound to the account.');
        }

        await client.query(
          "INSERT INTO wallet_verifications (wallet_id, verification_method, verification_reference, status, verified_at) " +
          "VALUES ($1, 'ton_proof', $2, 'verified', clock_timestamp())",
          [wallet.rows[0].id, identity.network + ':' + identity.publicKey]
        );
        await client.query('COMMIT');
        return Object.freeze({
          walletAddress: identity.address,
          network: identity.network,
          walletVerified: true
        });
      } catch (error) {
        try { await client.query('ROLLBACK'); } catch (_) { /* keep original error */ }
        throw error;
      } finally {
        client.release();
      }
    }
  });
}

module.exports = {
  TonProofError,
  verifyTonProof,
  createTonProofService,
  buildTonProofDigest,
  mapNetwork
};
