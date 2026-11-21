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
- The Founder-selected canonical logo was located in the private project Library (1254×1254 PNG; local SHA-256 `08d71b17fecb86ae6006ba0fc498675dc4024b13d3f40459dcd578dfc09719d1`). It is not yet hosted at a public immutable URL or committed to the repository.
- Metadata URI/logo publication and immutability verification remain outstanding. The historical GitHub metadata URI points to JSON without an image and is explicitly not approved for production.
- The script's target label is not a network identity guard; any future RPC-based verifier must check the actual TON Mainnet global network identifier and fail closed.
- Independent contract audit, full TEP-74/TEP-64 review, natural downstream bounce proof, and wallet-control proofs remain mandatory.
- PR #6 remains Draft and unmerged. No deployment, mint, transfer, signing, or broadcast is authorized by this utility.
