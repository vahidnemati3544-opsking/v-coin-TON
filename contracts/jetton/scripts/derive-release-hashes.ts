import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { Address, Cell } from '@ton/core';
import { VCoinMaster } from '../build/VCoinMaster_VCoinMaster';
import { VCoinJettonWallet } from '../build/VCoinMaster_VCoinJettonWallet';

async function main() {
  const config = JSON.parse(readFileSync('deployment.config.template.json', 'utf8'));
  const metadataUri = config.metadata.uri;
  const metadataBoc = readFileSync('build/VCoinMaster.content.boc');
  const metadataCell = Cell.fromBoc(metadataBoc)[0];
  if (!metadataCell) throw new Error('Metadata content BOC has no root cell');

  const founder = Address.parse(config.allocation_wallets.founder);
  const master = await VCoinMaster.fromInit(founder, metadataCell);
  if (!master.init) throw new Error('Master StateInit was not generated');

  const roles = ['founder', 'treasury', 'liquidity_market', 'ecosystem_marketing', 'mining_reserve'];
  const wallets: Record<string, unknown> = {};
  const walletAddresses = new Set<string>();

  for (const role of roles) {
    const owner = Address.parse(config.allocation_wallets[role]);
    const wallet = await VCoinJettonWallet.fromInit(owner, master.address);
    if (!wallet.init) throw new Error(`Jetton Wallet StateInit missing for ${role}`);
    const rawAddress = wallet.address.toRawString();
    if (walletAddresses.has(rawAddress)) throw new Error('Duplicate derived Jetton Wallet address');
    walletAddresses.add(rawAddress);
    wallets[role] = {
      owner_address: owner.toRawString(),
      state_init_hash: wallet.address.hash.toString('hex'),
      wallet_address_raw: rawAddress,
      wallet_address_friendly: wallet.address.toString({ urlSafe: true, bounceable: false, testOnly: false }),
      wallet_code_hash: wallet.init.code.hash().toString('hex'),
      wallet_data_hash: wallet.init.data.hash().toString('hex')
    };
  }

  const result = {
    schema: 'vcoin-ton-release-hashes-v1',
    source_commit: process.env.GITHUB_SHA ?? 'local',
    toolchain: {
      tact_compiler: '1.6.13',
      ton_core: '0.61.0',
      node_major: 22
    },
    network: 'mainnet-address-derivation-only-no-transaction',
    token: {
      name: config.token_name,
      symbol: config.token_symbol,
      decimals: config.decimals,
      fixed_supply_base_units: config.initial_supply_base_units
    },
    metadata: {
      uri: metadataUri,
      metadata_json_sha256: createHash('sha256').update(readFileSync('metadata.json')).digest('hex'),
      content_boc_sha256: createHash('sha256').update(metadataBoc).digest('hex'),
      content_cell_hash: metadataCell.hash().toString('hex')
    },
    master: {
      owner_address: founder.toRawString(),
      state_init_hash: master.address.hash.toString('hex'),
      address_raw: master.address.toRawString(),
      address_friendly: master.address.toString({ urlSafe: true, bounceable: false, testOnly: false }),
      code_hash: master.init.code.hash().toString('hex'),
      data_hash: master.init.data.hash().toString('hex')
    },
    jetton_wallets: wallets
  };

  writeFileSync('build/release-hashes.json', JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
