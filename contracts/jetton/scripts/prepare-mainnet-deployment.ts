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
const gasWallet = config.operational_fee_wallet.owner_provided_address;

async function main() {
  const master = await VCoinMaster.fromInit(
    Address.parse(wallets.founder),
    contentCell,
    Address.parse(wallets.mining_reserve),
    Address.parse(wallets.treasury),
    Address.parse(wallets.liquidity_market),
    Address.parse(wallets.ecosystem_marketing),
    Address.parse(gasWallet),
  );

  if (!master.init) {
    throw new Error('Tact compiler did not produce VCoinMaster StateInit');
  }

  const allocationOwners = {
    founder: wallets.founder,
    mining_reserve: wallets.mining_reserve,
    treasury: wallets.treasury,
    liquidity_market: wallets.liquidity_market,
    ecosystem_marketing: wallets.ecosystem_marketing,
  };
  const jettonWallets: Record<string, string> = {};
  const jettonWalletStateInitHashes: Record<string, string> = {};
  for (const [role, ownerAddress] of Object.entries(allocationOwners)) {
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
  if (!derivedAddress.equals(master.address)) {
    throw new Error('Derived StateInit address does not match Tact-generated Master address');
  }

  const allocationAmounts: Record<string, { tokens: string; baseUnits: string }> = {
    founder: { tokens: '2000000000', baseUnits: '2000000000000000' },
    mining_reserve: { tokens: '5000000000', baseUnits: '5000000000000000' },
    treasury: { tokens: '1000000000', baseUnits: '1000000000000000' },
    liquidity_market: { tokens: '1000000000', baseUnits: '1000000000000000' },
    ecosystem_marketing: { tokens: '1000000000', baseUnits: '1000000000000000' },
  };
  const issuanceTransactions: Record<string, unknown> = {};
  for (const [role, ownerAddress] of Object.entries(allocationOwners)) {
    const allocation = allocationAmounts[role];
    const mintBody = beginCell().store(storeVCoinMint({
      $type: 'VCoinMint',
      receiver: Address.parse(ownerAddress),
      amount: BigInt(allocation.baseUnits),
    })).endCell();
    issuanceTransactions[role] = {
      network: 'mainnet',
      signer: wallets.founder,
      master_address: master.address.toString({ bounceable: true, urlSafe: true, testOnly: false }),
      recipient_owner_address: ownerAddress,
      recipient_jetton_wallet_address: jettonWallets[role],
      token_amount: allocation.tokens,
      base_units: allocation.baseUnits,
      attached_ton: '0.01',
      payload_boc_base64: mintBody.toBoc().toString('base64'),
      requires_separate_founder_signature: true,
    };
  }

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
    constructor_arguments: {
      owner_founder: wallets.founder,
      mining_reserve: wallets.mining_reserve,
      treasury: wallets.treasury,
      liquidity_market: wallets.liquidity_market,
      ecosystem_marketing: wallets.ecosystem_marketing,
      gas_operations_only: gasWallet,
    },
    issuance_transactions: issuanceTransactions,
    allocations: {
      founder: '2000000000',
      mining_reserve: '5000000000',
      treasury: '1000000000',
      liquidity_market: '1000000000',
      ecosystem_marketing: '1000000000',
      total_supply: '10000000000',
      decimals: 6,
    },
    unsigned_deploy_message: {
      destination: master.address.toString({ bounceable: true, urlSafe: true, testOnly: false }),
      state_init_boc_base64: stateInitBoc.toString('base64'),
      body_boc_base64: deployFundingBody.toBoc().toString('base64'),
      body_type: 'VCoinFund',
      attached_ton: '0.75',
      attached_ton_purpose: 'minimum Master gas reserve funding required by VCoinFund',
      network_fee_quote_required: true,
    },
    signing: {
      signer: gasWallet,
      method: 'GAS & OPERATIONS wallet deploys Master and funds its reserve in one Tonkeeper-signed transaction',
      allocation_issuance_signer: wallets.founder,
      private_key_or_seed_phrase_required_by_assistant: false,
      broadcasted: false,
    },
  };

  fs.writeFileSync(
    path.join(root, 'build/mainnet-deployment-preview.json'),
    JSON.stringify(preview, null, 2) + '\n',
  );
  fs.writeFileSync(path.join(root, 'build/VCoinMaster.state-init.boc'), stateInitBoc);
  console.log(JSON.stringify({
    master_address: preview.master_address,
    state_init_hash: preview.state_init_hash,
    master_code_cell_hash: preview.master_code_cell_hash,
    master_data_cell_hash: preview.master_data_cell_hash,
    metadata_content_cell_hash: preview.metadata_content_cell_hash,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
