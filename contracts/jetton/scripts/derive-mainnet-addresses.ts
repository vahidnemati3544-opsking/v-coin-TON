import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Address, Cell } from '@ton/core';
import { VCoinMaster } from '../build/VCoinMaster_VCoinMaster';
import { VCoinJettonWallet } from '../build/VCoinMaster_VCoinJettonWallet';

type DeploymentConfig = {
  project: string;
  target_network: string;
  initial_supply_tokens: string;
  initial_supply_base_units: string;
  decimals: number;
  allocation_wallets: Record<string, string>;
  metadata: { content_cell_hash: string; content_boc_file_sha256: string };
  deployment_authorized: boolean;
  mainnet_authorized: boolean;
};

async function main() {
  const configPath = resolve(__dirname, '../deployment.config.template.json');
  const config = JSON.parse(readFileSync(configPath, 'utf8')) as DeploymentConfig;
  if (config.target_network !== 'mainnet') throw new Error('Expected Mainnet target configuration.');
  if (config.deployment_authorized !== false || config.mainnet_authorized !== false) {
    throw new Error('Derivation tool must never enable deployment or transaction authorization.');
  }

  const founder = config.allocation_wallets.founder;
  if (!founder) throw new Error('Founder owner address is missing.');
  const contentPath = resolve(__dirname, '../build/VCoinMaster.content.boc');
  const contentBoc = readFileSync(contentPath);
  const contentCell = Cell.fromBoc(contentBoc)[0];
  if (!contentCell) throw new Error('Metadata content BOC did not contain a root cell.');

  const contentCellHash = contentCell.hash().toString('hex');
  if (contentCellHash !== config.metadata.content_cell_hash) {
    throw new Error('Metadata content-cell hash does not match the approved deployment template.');
  }
  const contentBocSha256 = createHash('sha256').update(contentBoc).digest('hex');
  if (contentBocSha256 !== config.metadata.content_boc_file_sha256) {
    throw new Error('Metadata content BOC SHA-256 does not match the approved deployment template.');
  }

  const master = await VCoinMaster.fromInit(Address.parse(founder), contentCell);
  if (!master.init) throw new Error('Generated Master StateInit is missing.');
  const masterAddress = master.address.toString({ urlSafe: true, bounceable: true, testOnly: false });
  const masterStateInitHash = master.address.hash.toString('hex');
  const masterCodeHash = master.init.code.hash().toString('hex');
  const masterDataHash = master.init.data.hash().toString('hex');

  const recipients = Object.entries(config.allocation_wallets).map(([role, value]) => ({
    role,
    owner_address: Address.parse(value),
  }));
  const uniqueOwners = new Set(recipients.map(({ owner_address }) => owner_address.toRawString()));
  if (recipients.length !== 5 || uniqueOwners.size !== 5) {
    throw new Error('Exactly five distinct owner allocation addresses are required.');
  }

  const wallets = [];
  for (const { role, owner_address } of recipients) {
    const wallet = await VCoinJettonWallet.fromInit(owner_address, master.address);
    if (!wallet.init) throw new Error(`Generated Jetton Wallet StateInit is missing for ${role}.`);
    wallets.push({
      role,
      owner_address: owner_address.toString({ urlSafe: true, bounceable: true, testOnly: false }),
      jetton_wallet_address: wallet.address.toString({ urlSafe: true, bounceable: true, testOnly: false }),
      state_init_hash: wallet.address.hash.toString('hex'),
      code_hash: wallet.init.code.hash().toString('hex'),
      data_hash: wallet.init.data.hash().toString('hex'),
    });
  }

  const output = {
    project: config.project,
    purpose: 'Deterministic local address derivation only; NOT a deployment payload or proof of deployment.',
    source_commit: process.env.GITHUB_SHA ?? 'local-uncommitted-build',
    compiler_and_dependencies: 'Pinned by contracts/jetton/package-lock.json; generated wrappers rebuilt by npm run build.',
    network_context: 'TON Mainnet address format; all computation is offline and creates no network transaction.',
    fixed_supply_tokens: config.initial_supply_tokens,
    fixed_supply_base_units: config.initial_supply_base_units,
    decimals: config.decimals,
    metadata_content_cell_hash: contentCellHash,
    metadata_content_boc_sha256: contentBocSha256,
    master: {
      address: masterAddress,
      workchain: master.address.workChain,
      state_init_hash: masterStateInitHash,
      code_hash: masterCodeHash,
      data_hash: masterDataHash,
      owner_address: founder,
    },
    jetton_wallets: wallets,
    deployment_authorized: false,
    mainnet_authorized: false,
    transaction_created: false,
    transaction_signed: false,
    transaction_broadcast: false,
  };

  const outputPath = resolve(__dirname, '../build/mainnet-address-derivation.json');
  writeFileSync(outputPath, JSON.stringify(output, null, 2) + '\n');
  console.log(JSON.stringify({
    output: 'build/mainnet-address-derivation.json',
    master_address: masterAddress,
    master_state_init_hash: masterStateInitHash,
    jetton_wallet_count: wallets.length,
    distinct_jetton_wallet_addresses: new Set(wallets.map((item) => item.jetton_wallet_address)).size,
    deployment_authorized: false,
    transaction_created: false,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
