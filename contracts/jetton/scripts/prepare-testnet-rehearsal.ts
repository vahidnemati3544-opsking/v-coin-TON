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

  const preview = {
    project: 'V COIN – TON',
    status: 'unsigned_testnet_rehearsal_preview_only',
    network: 'testnet',
    test_only: true,
    founder_testnet_wallet: friendly(founder),
    master_address: friendly(master.address),
    founder_jetton_wallet_address: friendly(founderJettonWallet.address),
    fixed_supply_tokens: config.fixedSupplyTokens,
    decimals: config.decimals,
    metadata_uri: metadata.metadata_uri,
    metadata_content_cell_hash: metadata.content_cell_hash,
    master_state_init_hash: masterStateInit.hash().toString('hex'),
    founder_jetton_wallet_state_init_hash: walletStateInit.hash().toString('hex'),
    unsigned_messages: {
      deploy: {
        destination: friendly(master.address),
        state_init_boc_base64: masterStateInit.toBoc().toString('base64'),
        body_boc_base64: fundBody.toBoc().toString('base64'),
        body_type: 'VCoinFund',
        contract_minimum_attached_ton: '0.75',
        live_network_fee_quote: 'required_before_wallet_review',
      },
      stage_1: {
        destination_master: friendly(master.address),
        recipient_owner: friendly(founder),
        token_amount: config.stage1Tokens,
        base_units: stage1.toString(),
        body_boc_base64: stage1Body.toBoc().toString('base64'),
        contract_minimum_attached_ton: '0.01',
        prerequisite: 'Master deployment and funded reserve must be confirmed on Testnet',
      },
      stage_2: {
        destination_master: friendly(master.address),
        recipient_owner: friendly(founder),
        token_amount: config.stage2Tokens,
        base_units: stage2.toString(),
        body_boc_base64: stage2Body.toBoc().toString('base64'),
        contract_minimum_attached_ton: '0.01',
        prerequisite: 'Stage 1 must be finalized and get_receipt_status must confirm Stage 1 wallet credit',
        requires_fresh_founder_signature: true,
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
  };

  const outputPath = path.join(root, 'build/testnet-rehearsal-preview.json');
  fs.writeFileSync(outputPath, JSON.stringify(preview, null, 2) + '\\n');
  fs.writeFileSync(path.join(root, 'build/VCoinMaster.testnet.state-init.boc'), masterStateInit.toBoc());
  fs.writeFileSync(path.join(root, 'build/VCoinFounderJettonWallet.testnet.state-init.boc'), walletStateInit.toBoc());
  console.log(JSON.stringify({
    status: preview.status,
    network: preview.network,
    test_only: preview.test_only,
    master_address: preview.master_address,
    founder_jetton_wallet_address: preview.founder_jetton_wallet_address,
    stage_1_tokens: config.stage1Tokens,
    stage_2_tokens: config.stage2Tokens,
    total_tokens: config.fixedSupplyTokens,
    signing_performed: false,
    broadcast_performed: false,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
