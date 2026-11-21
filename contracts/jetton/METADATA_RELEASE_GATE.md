# VCOIN Mainnet Metadata Release Gate

**Status: canonical master PNG is committed and hash-matched; public retrieval verification and Founder production approval remain pending.**

## Canonical source asset

The Founder-selected logo is preserved unchanged in the project Library:

- File: `سکه لوکس طلایی V کوین.png`
- Format/dimensions: PNG, 1254 × 1254, RGB
- Size: 2,728,338 bytes
- SHA-256: `08d71b17fecb86ae6006ba0fc498675dc4024b13d3f40459dcd578dfc09719d1`
- Git blob SHA computed from the exact source bytes: `278e852eb43f4dea8057331749db018395e96358`

The exact canonical master asset is present in the review branch at `contracts/jetton/assets/VCOIN-canonical-logo.png`. Its repository Git blob SHA is `278e852eb43f4dea8057331749db018395e96358`, matching the expected source blob. Keep the file bytes unchanged.

## Repository assets — verified distinction

- `contracts/jetton/assets/vcoin-canonical-logo.jpg` is a 194,115-byte JPEG rendition with Git blob SHA `87a3e78313d26e36e500802e158827486bbc34c6`. It is not the canonical master and is no longer referenced by the metadata candidate.
- `contracts/jetton/assets/Crowned V Coin Blockchain Emblem.png` is another repository asset. It has not been proven byte-identical to the canonical source and must not be substituted for the master PNG without a pixel/content verification.
- Do not use the JPEG rendition or the unverified additional PNG as the canonical production logo.

## Current TEP-64 review candidate

The review metadata JSON is pinned to commit `9fd9f2b119a0f6b3d343a7a0670ba430c3864aa3`:

`https://raw.githubusercontent.com/vahidnemati3544-opsking/v-coin-TON/9fd9f2b119a0f6b3d343a7a0670ba430c3864aa3/contracts/jetton/metadata.json`

Its image field has been updated to the exact canonical PNG, pinned to commit `daed9f669acb2bf28449d6b02443e44aaf6f4969`:

`https://raw.githubusercontent.com/vahidnemati3544-opsking/v-coin-TON/daed9f669acb2bf28449d6b02443e44aaf6f4969/contracts/jetton/assets/VCOIN-canonical-logo.png`

The deployment template references these version-pinned review URLs. The metadata and image approval fields remain `pending_founder_approval`. These URLs are review candidates only; they are not approved as the production logo/metadata pair.

## Exact remaining steps

1. The exact canonical PNG is committed under the case-sensitive path shown above; preserve its bytes and do not convert, resize, recompress, or redraw it.
2. The repository blob SHA and recorded source SHA-256 are documented above. The CI metadata verifier must independently fetch the pinned public URL and confirm PNG signature, MIME type, dimensions, byte count and SHA-256.
3. The TEP-64 metadata JSON now points to the commit-pinned canonical PNG. Pin the metadata JSON itself in the deployment template after its commit is created.
4. Keep approval status pending until the Founder approves the exact artwork and public retrieval/content checks pass.
5. Re-run CI and independently verify the exact public metadata JSON and image bytes.

## Release boundary

Do not generate production StateInit or approve Mainnet deployment while the exact master PNG is absent or the metadata/image approval fields remain pending. The offline builder does not sign or broadcast; this document authorizes no deployment, mint, transfer, or wallet signature.


## Binding governance addendum — 2026-11-21

This document is governed by [Founder Exclusive Five-Wallet Control](../../docs/FOUNDER_EXCLUSIVE_FIVE_WALLET_CONTROL.md). The Founder alone has absolute, exclusive operational control and signing authority over all five allocation wallets; separation is accounting-only. No third party, employee, backend, Telegram bot, CI process, multisig co-signer, escrow, vesting, time lock, withdrawal ceiling, or automated process may authorize, veto, delay, redirect, sign, or execute movements.

Each TEP-74 Jetton Wallet authorizes transfers through its own `owner` address. Master ownership alone does not grant withdrawal or clawback rights over other wallets. The implementation therefore relies on Founder-exclusive signing control of all five recorded owner addresses, with transactions signed locally by the Founder. No hidden seizure path is permitted. Backend/Telegram may prepare unsigned proposals only. Never expose wallet secrets. Wallet-control evidence is recorded separately and must not be falsely marked complete. This addendum does not authorize any Mainnet transaction.
