# VCOIN Mainnet Metadata Release Gate

**Status: PARTIALLY PREPARED — exact master PNG binary is not yet present in the repository; production approval remains pending.**

## Canonical source asset

The Founder-selected logo is preserved unchanged in the project Library:

- File: `سکه لوکس طلایی V کوین.png`
- Format/dimensions: PNG, 1254 × 1254, RGB
- Size: 2,728,338 bytes
- SHA-256: `08d71b17fecb86ae6006ba0fc498675dc4024b13d3f40459dcd578dfc09719d1`
- Git blob SHA computed from the exact source bytes: `278e852eb43f4dea8057331749db018395e96358`

This is the canonical master asset and must be committed byte-for-byte before production metadata is approved.

## Repository assets — verified distinction

- `contracts/jetton/assets/vcoin-canonical-logo.jpg` is a 194,115-byte JPEG. Its file signature is `FF D8 FF`, and its Git blob SHA is `87a3e78313d26e36e500802e158827486bbc34c6`. Commit `1dac91b520de6b9d3dbf7d615128ff2ec3e95f5e` corrected the former misleading `.png` extension. This is a JPEG rendition, **not** the canonical master PNG.
- `contracts/jetton/assets/Crowned V Coin Blockchain Emblem.png` is another repository asset. It has not been proven byte-identical to the canonical source and must not be substituted for the master PNG without a pixel/content verification.
- Do not use the JPEG rendition or the unverified additional PNG as the canonical production logo.

## Current TEP-64 review candidate

The review metadata JSON is pinned to commit `9fd9f2b119a0f6b3d343a7a0670ba430c3864aa3`:

`https://raw.githubusercontent.com/vahidnemati3544-opsking/v-coin-TON/9fd9f2b119a0f6b3d343a7a0670ba430c3864aa3/contracts/jetton/metadata.json`

Its current image field points to the JPEG rendition pinned to commit `1dac91b520de6b9d3dbf7d615128ff2ec3e95f5e`:

`https://raw.githubusercontent.com/vahidnemati3544-opsking/v-coin-TON/1dac91b520de6b9d3dbf7d615128ff2ec3e95f5e/contracts/jetton/assets/vcoin-canonical-logo.jpg`

The deployment template references these version-pinned review URLs. The metadata and image approval fields remain `pending_founder_approval`. These URLs are review candidates only; they are not approved as the production logo/metadata pair.

## Exact remaining steps

1. Add the exact 2,728,338-byte canonical PNG above to `contracts/jetton/assets/vcoin-canonical-logo.png` in this review branch. Preserve bytes; do not convert, resize, recompress, or redraw it.
2. Verify the committed file signature, dimensions, byte count, SHA-256 and Git blob SHA against the canonical source values above.
3. Update `metadata.json` to reference the commit-pinned canonical PNG URL, then pin the resulting metadata JSON to its own commit.
4. Update `deployment.config.template.json` with those final pinned URLs. Keep approval status pending until the Founder approves the exact artwork and the public URL retrieval/MIME/content checks pass.
5. Re-run CI and independently verify the exact public metadata JSON and image bytes.

## Release boundary

Do not generate production StateInit or approve Mainnet deployment while the exact master PNG is absent or the metadata/image approval fields remain pending. The offline builder does not sign or broadcast; this document authorizes no deployment, mint, transfer, or wallet signature.
