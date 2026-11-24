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

if (config.network !== 'testnet' || config.testOnly !== true) throw new Error('Explicit Testnet/testOnly configuration is required');
if (config.founderTestnetWallet !== EXPECTED_TESTNET_FOUNDER) throw new Error('Founder Testnet wallet mismatch');
if (config.mainnetWalletsIncluded !== false || config.mainnetPayloadsAllowed !== false ||
    config.broadcastEnabled !== false || config.signingEnabled !== false) {
  throw new Error('Unsafe Testnet rehearsal capability flag detected');
}
if (!Array.isArray(config.stages) || config.stages.length !== 5) throw new Error('Exactly five receipt stages are required');

const founder = Address.parse(config.founderTestnetWallet);
const scale = 10n ** BigInt(config.decimals);
const fixedSupply = BigInt(config.fixedSupplyTokens) * scale;
const stages = config.stages.map((stage: {stage:number;amountTokens:string;amountBaseUnits:string}, index:number) => {
  if (stage.stage !== index + 1) throw new Error('Receipt stages must be sequentially numbered 1 through 5');
  const amount = BigInt(stage.amountTokens) * scale;
  if (amount !== BigInt(stage.amountBaseUnits) || amount <= 0n) throw new Error('Invalid receipt stage amount');
  return { stage: stage.stage, token_amount: stage.amountTokens, base_units: amount.toString(), amount };
});
if (stages.reduce((sum: bigint, stage: {amount:bigint}) => sum + stage.amount, 0n) !== fixedSupply) {
  throw new Error('Five receipt stages do not reconcile to the fixed supply');
}

async function main() {
  const master = await VCoinMaster.fromInit(founder, contentCell);
  if (!master.init) throw new Error('Tact compiler did not produce VCoinMaster StateInit');
  const founderJettonWallet = await VCoinJettonWallet.fromInit(founder, master.address);
  if (!founderJettonWallet.init) throw new Error('Founder Testnet Jetton Wallet StateInit is missing');

  const masterStateInit = beginCell().store(storeStateInit(master.init)).endCell();
  const walletStateInit = beginCell().store(storeStateInit(founderJettonWallet.init)).endCell();
  const fundBody = beginCell().store(storeVCoinFund({ $type: 'VCoinFund' })).endCell();
  const friendly = (address: Address) => address.toString({ bounceable: true, urlSafe: true, testOnly: true });
  const validUntil = Math.floor(Date.now() / 1000) + REQUEST_TTL_SECONDS;
  const senderRaw = founder.toRawString();
  const tonConnectRequest = (message: {address:string;amount:string;stateInit?:string;payload?:string}) => ({
    validUntil, network: TESTNET_GLOBAL_ID, from: senderRaw, messages: [message],
  });
  const stateInitBoc = masterStateInit.toBoc().toString('base64');
  const fundBodyBoc = fundBody.toBoc().toString('base64');

  const stagePreviews = stages.map((stage: {stage:number;token_amount:string;base_units:string;amount:bigint}) => {
    const body = beginCell().store(storeVCoinMint({
      $type: 'VCoinMint', receiver: founder, amount: stage.amount,
    })).endCell();
    const bodyBoc = body.toBoc().toString('base64');
    return {
      stage: stage.stage,
      destination_master: friendly(master.address),
      recipient_owner: friendly(founder),
      token_amount: stage.token_amount,
      base_units: stage.base_units,
      attached_ton_nano: MINT_ATTACHED_NANO,
      body_boc_base64: bodyBoc,
      contract_minimum_attached_ton: '0.01',
      prerequisite: stage.stage === 1
        ? 'Master deployment and funded reserve must be confirmed on Testnet'
        : 'Every preceding stage must be confirmed on-chain and get_receipt_status must report this as the next stage',
      requires_fresh_founder_signature: true,
      ton_connect_request: tonConnectRequest({
        address: friendly(master.address), amount: MINT_ATTACHED_NANO, payload: bodyBoc,
      }),
    };
  });

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
      note: 'Unsigned wallet request previews only. The wallet constructs and signs its external message only after a separate explicit user approval.',
    },
    unsigned_messages: {
      deploy: {
        destination: friendly(master.address),
        attached_ton_nano: DEPLOY_ATTACHED_NANO,
        state_init_boc_base64: stateInitBoc,
        body_boc_base64: fundBodyBoc,
        body_type: 'VCoinFund',
        contract_minimum_attached_ton: '0.75',
        live_network_fee_quote: 'required_before_wallet_review',
        ton_connect_request: tonConnectRequest({
          address: friendly(master.address), amount: DEPLOY_ATTACHED_NANO,
          stateInit: stateInitBoc, payload: fundBodyBoc,
        }),
      },
      stages: stagePreviews,
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
      'Run exact-branch build and Sandbox tests.',
      'Review unsigned Testnet wallet request previews; do not submit until the emulator trace and fee breakdown are approved.',
      'Obtain a valid Testnet emulator trace and fee breakdown for all five sequential receipt stages.',
      'Reconcile required attached TON and reserve against the live Testnet balance.',
      'Any Testnet signing requires a separate explicit Founder approval; no Mainnet authority is implied.',
    ],
  };
  fs.writeFileSync(path.join(root, 'build/testnet-rehearsal-preview.json'), JSON.stringify(preview, null, 2) + '\n');
  fs.writeFileSync(path.join(root, 'build/VCoinMaster.testnet.state-init.boc'), masterStateInit.toBoc());
  fs.writeFileSync(path.join(root, 'build/VCoinFounderJettonWallet.testnet.state-init.boc'), walletStateInit.toBoc());
  console.log(JSON.stringify({
    status: preview.status, network: preview.network, test_only: preview.test_only,
    founder_testnet_wallet: preview.founder_testnet_wallet, master_address: preview.master_address,
    stage_amounts: stages.map((s: {stage:number;token_amount:string}) => ({stage:s.stage,token_amount:s.token_amount})),
    total_tokens: config.fixedSupplyTokens, wallet_request_previews_generated: true,
    signing_performed: false, broadcast_performed: false,
  }, null, 2));
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
