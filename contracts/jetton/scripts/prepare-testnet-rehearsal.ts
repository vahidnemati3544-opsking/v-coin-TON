import fs from 'node:fs';
import path from 'node:path';
import { Address, beginCell, Cell, storeStateInit } from '@ton/core';
import { VCoinMaster, storeVCoinFund, storeVCoinMint } from '../build/VCoinMaster_VCoinMaster';
import { VCoinJettonWallet } from '../build/VCoinMaster_VCoinJettonWallet';

const root = path.resolve(__dirname, '..');
const config = JSON.parse(fs.readFileSync(path.join(root, 'testnet.rehearsal.config.json'), 'utf8'));
const metadata = JSON.parse(fs.readFileSync(path.join(root, 'build/metadata-content.json'), 'utf8'));
const contentBoc = fs.readFileSync(path.join(root, 'build/VCoinMaster.content.boc'));
const contentCell = Cell.fromBoc(contentBoc)[0];

const EXPECTED_TESTNET_FOUNDER = 'UQAdW09EvIesUXt9jzLq1T32O0351TaczwWJQLGGmw4aWrzy';
const TESTNET_GLOBAL_ID = '-3';
const REQUEST_TTL_SECONDS = 10 * 60;
const DEPLOY_ATTACHED_NANO = '750000000';
const MINT_ATTACHED_NANO = '10000000';

if (config.network !== 'testnet' || config.testOnly !== true) {
  throw new Error('Refusing to prepare rehearsal: explicit Testnet/testOnly configuration is required');
}
if (config.founderTestnetWallet !== EXPECTED_TESTNET_FOUNDER) {
  throw new Error('Refusing to prepare rehearsal: Founder Testnet wallet does not match the registered Testnet-only address');
}
if (config.mainnetWalletsIncluded !== false || config.mainnetPayloadsAllowed !== false ||
    config.broadcastEnabled !== false || config.signingEnabled !== false) {
  throw new Error('Refusing to prepare rehearsal: unsafe capability flag detected');
}

const founder = Address.parse(config.founderTestnetWallet);
const decimals = BigInt(config.decimals);
const scale = 10n ** decimals;
const stage1 = BigInt(config.stage1Tokens) * scale;
const stage2 = BigInt(config.stage2Tokens) * scale;
const fixedSupply = BigInt(config.fixedSupplyTokens) * scale;
if (stage1 !== BigInt(config.stage1BaseUnits) ||
    stage2 !== BigInt(config.stage2BaseUnits) ||
    fixedSupply !== BigInt(config.fixedSupplyBaseUnits) ||
    stage1 + stage2 !== fixedSupply) {
  throw new Error('Refusing to prepare rehearsal: staged amounts do not reconcile to the fixed supply');
}
if (stage1 <= 0n || stage2 <= 0n || stage1 >= fixedSupply) {
  throw new Error('Refusing to prepare rehearsal: invalid two-stage amounts');
}

async function main() {
  const master = await VCoinMaster.fromInit(founder, contentCell);
  if (!master.init) throw new Error('Tact compiler did not produce VCoinMaster StateInit');

  const founderJettonWallet = await VCoinJettonWallet.fromInit(founder, master.address);
  if (!founderJettonWallet.init) throw new Error('Founder Testnet Jetton Wallet StateInit is missing');

  const masterStateInit = beginCell().store(storeStateInit(master.init)).endCell();
  const walletStateInit = beginCell().store(storeStateInit(founderJettonWallet.init)).endCell();
  const fundBody = beginCell().store(storeVCoinFund({ $type: 'VCoinFund' })).endCell();
  const stage1Body = beginCell().store(storeVCoinMint({
    $type: 'VCoinMint', receiver: founder, amount: stage1,
  })).endCell();
  const stage2Body = beginCell().store(storeVCoinMint({
    $type: 'VCoinMint', receiver: founder, amount: stage2,
  })).endCell();

  const friendly = (address: Address) => address.toString({
    bounceable: true, urlSafe: true, testOnly: true,
  });
  const validUntil = Math.floor(Date.now() / 1000) + REQUEST_TTL_SECONDS;
  const senderRaw = founder.toRawString();

  // These are unsigned TON Connect request payloads for inspection only.
  // They are NOT signed wallet external messages and are never submitted here.
  const tonConnectRequest = (message: {
    address: string;
    amount: string;
    stateInit?: string;
    payload?: string;
  }) => ({
    validUntil,
    network: TESTNET_GLOBAL_ID,
    from: senderRaw,
    messages: [message],
  });

  const deployStateInitBoc = masterStateInit.toBoc().toString('base64');
  const fundBodyBoc = fundBody.toBoc().toString('base64');
  const stage1BodyBoc = stage1Body.toBoc().toString('base64');
  const stage2BodyBoc = stage2Body.toBoc().toString('base64');

  const preview = {
    project: 'V COIN – TON',
    status: 'unsigned_testnet_rehearsal_preview_only',
    network: 'testnet',
    ton_connect_network_global_id: TESTNET_GLOBAL_ID,
    test_only: true,
    founder_testnet_wallet: friendly(founder),
    founder_testnet_wallet_raw: senderRaw,
    master_address: friendly(master.address),
    founder_jetton_wallet_address: friendly(founderJettonWallet.address),
    fixed_supply_tokens: config.fixedSupplyTokens,
    decimals: config.decimals,
    metadata_uri: metadata.metadata_uri,
    metadata_content_cell_hash: metadata.content_cell_hash,
    master_state_init_hash: masterStateInit.hash().toString('hex'),
    founder_jetton_wallet_state_init_hash: walletStateInit.hash().toString('hex'),
    wallet_request_preview: {
      format: 'TON Connect sendTransaction request payload',
      valid_until_unix_seconds: validUntil,
      expires_in_seconds: REQUEST_TTL_SECONDS,
      signing_or_broadcasting_performed: false,
      note: 'A wallet request preview only; the wallet constructs and signs its external message after a separate user approval.',
    },
    unsigned_messages: {
      deploy: {
        destination: friendly(master.address),
        attached_ton_nano: DEPLOY_ATTACHED_NANO,
        state_init_boc_base64: deployStateInitBoc,
        body_boc_base64: fundBodyBoc,
        body_type: 'VCoinFund',
        contract_minimum_attached_ton: '0.75',
        live_network_fee_quote: 'required_before_wallet_review',
        ton_connect_request: tonConnectRequest({
          address: friendly(master.address),
          amount: DEPLOY_ATTACHED_NANO,
          stateInit: deployStateInitBoc,
          payload: fundBodyBoc,
        }),
      },
      stage_1: {
        destination_master: friendly(master.address),
        recipient_owner: friendly(founder),
        token_amount: config.stage1Tokens,
        base_units: stage1.toString(),
        attached_ton_nano: MINT_ATTACHED_NANO,
        body_boc_base64: stage1BodyBoc,
        contract_minimum_attached_ton: '0.01',
        prerequisite: 'Master deployment and funded reserve must be confirmed on Testnet',
        ton_connect_request: tonConnectRequest({
          address: friendly(master.address),
          amount: MINT_ATTACHED_NANO,
          payload: stage1BodyBoc,
        }),
      },
      stage_2: {
        destination_master: friendly(master.address),
        recipient_owner: friendly(founder),
        token_amount: config.stage2Tokens,
        base_units: stage2.toString(),
        attached_ton_nano: MINT_ATTACHED_NANO,
        body_boc_base64: stage2BodyBoc,
        contract_minimum_attached_ton: '0.01',
        prerequisite: 'Stage 1 must be finalized and get_receipt_status must confirm Stage 1 wallet credit',
        requires_fresh_founder_signature: true,
        ton_connect_request: tonConnectRequest({
          address: friendly(master.address),
          amount: MINT_ATTACHED_NANO,
          payload: stage2BodyBoc,
        }),
      },
    },
    distribution: {
      status: 'excluded_from_testnet_rehearsal',
      reason: 'No Mainnet allocation destinations are imported into this Testnet-only rehearsal',
    },
    safety: {
      mainnet_wallets_loaded: false,
      mainnet_addresses_emitted: false,
      mainnet_payloads_generated: false,
      signing_performed: false,
      broadcast_performed: false,
      seed_phrase_or_private_key_requested: false,
    },
    remaining_gates: [
      'Run exact-branch build and rehearsal preview.',
      'Review TON Connect request payloads; do not submit them.',
      'Obtain a valid Testnet emulator trace and fee breakdown for the actual wallet/contract execution path.',
      'Reconcile required attached TON and fee reserve against the live Testnet balance.',
      'Only then request separate Founder authorization for a Testnet wallet review/signature.',
    ],
  };

  const outputPath = path.join(root, 'build/testnet-rehearsal-preview.json');
  fs.writeFileSync(outputPath, JSON.stringify(preview, null, 2) + '\\n');
  fs.writeFileSync(path.join(root, 'build/VCoinMaster.testnet.state-init.boc'), masterStateInit.toBoc());
  fs.writeFileSync(path.join(root, 'build/VCoinFounderJettonWallet.testnet.state-init.boc'), walletStateInit.toBoc());
  console.log(JSON.stringify({
    status: preview.status,
    network: preview.network,
    ton_connect_network_global_id: TESTNET_GLOBAL_ID,
    test_only: preview.test_only,
    founder_testnet_wallet: preview.founder_testnet_wallet,
    master_address: preview.master_address,
    founder_jetton_wallet_address: preview.founder_jetton_wallet_address,
    stage_1_tokens: config.stage1Tokens,
    stage_2_tokens: config.stage2Tokens,
    total_tokens: config.fixedSupplyTokens,
    wallet_request_previews_generated: true,
    signing_performed: false,
    broadcast_performed: false,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
