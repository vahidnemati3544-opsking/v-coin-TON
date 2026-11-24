import fs from 'node:fs';
import path from 'node:path';
import { Address, beginCell, Cell, storeStateInit } from '@ton/core';
import { VCoinMaster, storeVCoinFund, storeVCoinMint } from '../build/VCoinMaster_VCoinMaster';
import { VCoinJettonWallet } from '../build/VCoinMaster_VCoinJettonWallet';

const root = path.resolve(__dirname, '..');
const readJson = (file: string) => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const config = readJson('deployment.config.template.json');
const metadata = readJson('build/metadata-content.json');
const contentBoc = fs.readFileSync(path.join(root, 'build/VCoinMaster.content.boc'));
const contentCell = Cell.fromBoc(contentBoc)[0];

const wallets = config.allocation_wallets;
const founder = Address.parse(wallets.founder);
const gasWallet = Address.parse(config.operational_fee_wallet.owner_provided_address);
if (!gasWallet.equals(founder)) throw new Error('GAS & OPERATIONS signer must be the Founder wallet');

const MAX_SUPPLY = BigInt(config.initial_supply_base_units);
const stageOneTokens = process.env.VCOIN_STAGE1_TOKENS;
let receiptTransactions: Record<string, unknown> | null = null;
if (stageOneTokens !== undefined && stageOneTokens.trim() !== '') {
  const scale = 10n ** BigInt(config.decimals);
  const stageOne = BigInt(stageOneTokens) * scale;
  if (stageOne <= 0n || stageOne >= MAX_SUPPLY) {
    throw new Error('VCOIN_STAGE1_TOKENS must be a positive whole-token amount below the fixed supply');
  }
  const stageTwo = MAX_SUPPLY - stageOne;
  const firstBody = beginCell().store(storeVCoinMint({
    $type: 'VCoinMint', receiver: founder, amount: stageOne,
  })).endCell();
  const secondBody = beginCell().store(storeVCoinMint({
    $type: 'VCoinMint', receiver: founder, amount: stageTwo,
  })).endCell();
  receiptTransactions = {
    stage_1: {
      network: 'mainnet', signer: wallets.founder, recipient_owner_address: wallets.founder,
      token_amount: stageOneTokens, base_units: stageOne.toString(),
      payload_boc_base64: firstBody.toBoc().toString('base64'),
      requires_fresh_founder_signature: true,
    },
    stage_2: {
      network: 'mainnet', signer: wallets.founder, recipient_owner_address: wallets.founder,
      token_amount: (stageTwo / scale).toString(), base_units: stageTwo.toString(),
      payload_boc_base64: secondBody.toBoc().toString('base64'),
      prerequisite: 'Stage 1 must be confirmed on-chain and get_receipt_status checked before signing Stage 2',
      requires_fresh_founder_signature: true,
    },
  };
}

async function main() {
  const master = await VCoinMaster.fromInit(founder, contentCell);
  if (!master.init) throw new Error('Tact compiler did not produce VCoinMaster StateInit');

  const roles: Record<string, string> = {
    founder: wallets.founder,
    mining_reserve: wallets.mining_reserve,
    treasury: wallets.treasury,
    liquidity_market: wallets.liquidity_market,
    ecosystem_marketing: wallets.ecosystem_marketing,
  };
  const jettonWallets: Record<string, string> = {};
  const jettonWalletStateInitHashes: Record<string, string> = {};
  for (const [role, ownerAddress] of Object.entries(roles)) {
    const jettonWallet = await VCoinJettonWallet.fromInit(Address.parse(ownerAddress), master.address);
    if (!jettonWallet.init) throw new Error('Missing Jetton wallet StateInit for ' + role);
    const walletStateInitCell = beginCell().store(storeStateInit(jettonWallet.init)).endCell();
    jettonWallets[role] = jettonWallet.address.toString({ bounceable: true, urlSafe: true, testOnly: false });
    jettonWalletStateInitHashes[role] = walletStateInitCell.hash().toString('hex');
    fs.writeFileSync(path.join(root, 'build', 'jetton-wallet-' + role + '.state-init.boc'), walletStateInitCell.toBoc());
  }

  const stateInitCell = beginCell().store(storeStateInit(master.init)).endCell();
  const deployFundingBody = beginCell().store(storeVCoinFund({ $type: 'VCoinFund' })).endCell();
  const stateInitBoc = stateInitCell.toBoc();
  const stateInitHash = stateInitCell.hash().toString('hex');
  const derivedAddress = new Address(0, stateInitCell.hash());
  if (!derivedAddress.equals(master.address)) throw new Error('Derived StateInit address does not match Tact-generated Master address');

  const preview = {
    project: 'V COIN – TON',
    status: 'unsigned_mainnet_deployment_preview_only',
    network: 'mainnet',
    source_commit: process.env.GITHUB_SHA ?? 'local',
    master_address: master.address.toString({ bounceable: true, urlSafe: true, testOnly: false }),
    workchain: 0,
    state_init_hash: stateInitHash,
    master_code_cell_hash: master.init.code.hash().toString('hex'),
    master_data_cell_hash: master.init.data.hash().toString('hex'),
    state_init_boc_base64: stateInitBoc.toString('base64'),
    metadata_uri: metadata.metadata_uri,
    metadata_content_cell_hash: metadata.content_cell_hash,
    derived_jetton_wallet_addresses: jettonWallets,
    derived_jetton_wallet_state_init_hashes: jettonWalletStateInitHashes,
    constructor_arguments: { owner_founder: wallets.founder, content_cell: 'pinned metadata content cell' },
    initial_receipt: {
      founder_wallet: wallets.founder,
      total_supply_tokens: config.initial_supply_tokens,
      stage_1_amount_tokens: stageOneTokens ?? null,
      stage_2_amount_tokens: stageOneTokens === undefined ? null :
        (BigInt(config.initial_supply_tokens) - BigInt(stageOneTokens)).toString(),
      transactions: receiptTransactions,
      status: receiptTransactions ? 'unsigned_payloads_require_separate_founder_signatures' : 'stage_1_amount_not_set_no_receipt_payloads_generated',
    },
    subsequent_founder_signed_distributions: {
      mining_reserve: { recipient: wallets.mining_reserve, tokens: '1050000000' },
      treasury: { recipient: wallets.treasury, tokens: '210000000' },
      liquidity_market: { recipient: wallets.liquidity_market, tokens: '210000000' },
      ecosystem_marketing: { recipient: wallets.ecosystem_marketing, tokens: '210000000' },
      founder_retained_tokens: '420000000',
      method: 'ordinary Founder-signed TEP-74 Jetton wallet transfers after full receipt',
      broadcasted: false,
    },
    unsigned_deploy_message: {
      destination: master.address.toString({ bounceable: true, urlSafe: true, testOnly: false }),
      state_init_boc_base64: stateInitBoc.toString('base64'),
      body_boc_base64: deployFundingBody.toBoc().toString('base64'),
      body_type: 'VCoinFund',
      attached_ton: '1.00',
      network_fee_quote_required: true,
    },
    signing: {
      signer: wallets.founder,
      private_key_or_seed_phrase_required_by_assistant: false,
      broadcasted: false,
    },
    authorization: { deployment_authorized: false, mainnet_authorized: false, broadcasted: false },
  };
  fs.writeFileSync(path.join(root, 'build/mainnet-deployment-preview.json'), JSON.stringify(preview, null, 2) + '\n');
  fs.writeFileSync(path.join(root, 'build/VCoinMaster.state-init.boc'), stateInitBoc);
  console.log(JSON.stringify({
    master_address: preview.master_address,
    state_init_hash: preview.state_init_hash,
    master_code_cell_hash: preview.master_code_cell_hash,
    master_data_cell_hash: preview.master_data_cell_hash,
    metadata_content_cell_hash: preview.metadata_content_cell_hash,
    receipt_payloads_generated: receiptTransactions !== null,
  }, null, 2));
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
