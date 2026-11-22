const fs = require('node:fs');
const path = require('node:path');
const { beginCell } = require('@ton/core');

const metadataUri = process.argv[2];
if (!metadataUri || !/^https:\/\//.test(metadataUri)) {
  throw new Error('Pass the immutable HTTPS TEP-64 metadata URI as the first argument.');
}

const contentCell = beginCell()
  .storeUint(0x01, 8)
  .storeStringTail(metadataUri)
  .endCell();

const buildDir = path.resolve(__dirname, '..', 'build');
fs.mkdirSync(buildDir, { recursive: true });
fs.writeFileSync(path.join(buildDir, 'VCoinMaster.content.boc'), contentCell.toBoc());
fs.writeFileSync(
  path.join(buildDir, 'metadata-content.json'),
  JSON.stringify({
    standard: 'TEP-64 off-chain content',
    metadata_uri: metadataUri,
    content_cell_hash: contentCell.hash().toString('hex'),
    content_boc_base64: contentCell.toBoc().toString('base64')
  }, null, 2) + '\n'
);
console.log('TEP-64 metadata content cell generated.');
console.log('URI:', metadataUri);
console.log('Cell hash:', contentCell.hash().toString('hex'));
