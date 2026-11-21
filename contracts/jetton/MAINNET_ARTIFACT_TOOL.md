# Offline Mainnet StateInit preparation

**Status:** implemented as a non-broadcasting preparation utility; not deployment approval.

## Purpose and safety boundary

`deploy/prepare-mainnet.ts` builds the reviewed `VCoinMaster` StateInit using the generated Tact wrapper and pinned `@ton/core` version. It writes:
- `state-init.boc`: serialized StateInit only;
- `manifest.json`: derived master address, source commit, compiler/dependency versions, and SHA-256/cell hashes.

The tool verifies that the supplied 40-character source commit equals the checked-out Git `HEAD`, and hashes the three Tact sources, package manifest, lockfile, Tact config, compiled code/data cells, StateInit cell and BOC. It has no wallet, mnemonic, private-key, signing, RPC, TonConnect, or broadcast dependency. It does not create or submit a TON transaction. The `mainnet` argument is a declared target label only; the tool makes no network connection and cannot independently attest a live network identity.

## Build and run

From `contracts/jetton` on the exact reviewed commit:

```bash
npm ci
npm run build
npm run prepare:mainnet -- --network mainnet --owner <FOUNDER_MAINNET_ADDRESS> --metadata-uri <APPROVED_IMMUTABLE_HTTPS_TEP64_URI> --source-commit <FULL_40_CHARACTER_COMMIT_SHA>
```

Optional output directory: `--out <directory>`. Default: `artifacts/mainnet-predeploy`.

The metadata cell uses TEP-64 off-chain content encoding: byte prefix `0x01`, followed by the HTTPS URI. The URI must be approved, immutable/pinned, publicly retrievable, and point to the final metadata including the approved logo. No default URI is silently assumed.

## Determinism and independent checks

Run the command twice from clean builds of the same source commit and compare both files byte-for-byte and all manifest hashes. Verify the master address and StateInit independently with a second implementation/reviewer. Confirm the exact source commit and compiler version before relying on any output.

The output is not a signed external message and is not itself a wallet-ready transaction. A separate, independently reviewed wallet transaction must be assembled and shown to the Founder for local review/signature only after every Mainnet gate is closed. Never add private keys or automatic broadcasting to this tool.

## Current limitations / no-go gates

- GitHub Actions #273 executed the generator twice using a deliberately non-production `example.invalid` metadata URI and compared both StateInit BOCs and manifests byte-for-byte; the smoke test passed on exact head `219abc794b337bc1f719a143d46ea3589cac0cc1`. This proves repeatability in CI for the test inputs, not the final production metadata or an independent clean-room reproduction.
- The Founder-selected master logo is preserved in the project Library as a 1254×1254 PNG (SHA-256 `08d71b17fecb86ae6006ba0fc498675dc4024b13d3f40459dcd578dfc09719d1`). The repository's former `contracts/jetton/assets/vcoin-canonical-logo.png` was a 194,115-byte JPEG (`FF D8 FF`) with a misleading `.png` suffix. Commit `1dac91b520de6b9d3dbf7d615128ff2ec3e95f5e` corrected the path to `contracts/jetton/assets/vcoin-canonical-logo.jpg`; the Git blob is `87a3e78313d26e36e500802e158827486bbc34c6`. This is a JPEG display rendition of the approved artwork, not a byte-identical copy of the Library PNG.
- TEP-64 metadata is now available at the immutable commit-pinned URL `https://raw.githubusercontent.com/vahidnemati3544-opsking/v-coin-TON/9fd9f2b119a0f6b3d343a7a0670ba430c3864aa3/contracts/jetton/metadata.json`; its image field points to the commit-pinned JPEG rendition above. The deployment template references this JSON URL and marks the URI as version-pinned. Founder approval, independent public retrieval/content verification, and replacement with the exact master PNG binary remain open before production.
- The script's target label is not a network identity guard; any future RPC-based verifier must check the actual TON Mainnet global network identifier and fail closed.
- Five-category natural downstream-bounce Sandbox integration proof passed on PR head `cf362ef04990aebf928e17ebd380e0aef8b6f96f` (CI #302): each failed destination-wallet delivery bounced to Master, restored supply, and succeeded on exact-cap retry. Independent reproduction, external contract audit, full TEP-74/TEP-64 review, and wallet-control proofs remain mandatory.
- PR #6 remains Draft and unmerged. No deployment, mint, transfer, signing, or broadcast is authorized by this utility.
