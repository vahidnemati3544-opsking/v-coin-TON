# V COIN TON — Jetton implementation workspace

## Current status

This directory contains a pinned copy of the TON reference Jetton v2.1 implementation to establish a reproducible Tolk/Acton build and protocol baseline.

**It is not the final VCOIN contract and MUST NOT be deployed.** The upstream reference Master has administrator mint, metadata-change, and code-upgrade operations. Those capabilities conflict with VCOIN's approved fixed-supply and immutable-contract requirements until removed or replaced by a separately reviewed one-time genesis issuance design.

## Upstream provenance

- Repository: https://github.com/ton-blockchain/acton-contracts
- Source directory: `jetton-v2.1`
- Pinned upstream commit: `d721c3179696b453a9490fcfd2f30770f8c234b4`
- Toolchain: Acton `1.2.1`
- Language: Tolk
- Standard target: TEP-74 Jetton; reference implementation also supports TEP-89 discovery.

The upstream project is dual-licensed under Apache-2.0 and MIT. Preserve the upstream attribution and license notices when modifying or redistributing its source.

## Build and test

From this directory:

```sh
acton build
acton wrapper JettonMinter -o wrappers/JettonMinter.gen.tolk
acton wrapper JettonWallet -o wrappers/JettonWallet.gen.tolk
acton test tests
acton check
acton fmt --check
```

The upstream end-to-end suite remains a protocol baseline. Additional VCOIN tests now verify the approved allocation arithmetic and UTC calendar-month vesting date calculations; these tests do not yet prove a deployable VCOIN Master, genesis issuance, wallet acknowledgement, or on-chain vesting lock.

## VCOIN fixed-supply genesis decision

See [`docs/GENESIS_ISSUANCE_DESIGN.md`](../../../docs/GENESIS_ISSUANCE_DESIGN.md) for the one-time five-slot genesis issuance design. This is a design decision only; no VCOIN-specific Master, genesis coordinator, or founder vesting contract has been implemented or validated yet. The reference contracts below remain non-deployable for VCOIN.

## Required VCOIN hardening before any deployment

1. Replace the reference minter with a fixed-supply genesis design: exactly 10,000,000,000 VCOIN / 10^16 base units at six decimals, and no post-genesis mint path.
2. Remove administrator metadata mutation and code-upgrade entry points; freeze metadata and contract code.
3. Implement the five approved allocation destinations and prove their exact sum.
4. Implement founder vesting in an enforceable on-chain lock, with activation time set only at the official mining launch; release 48 monthly tranches with exact integer arithmetic.
5. Add VCOIN-specific adversarial tests for supply cap, one-time genesis, allocation sum, admin privilege removal, transfers, bounce handling, and vesting calendar boundaries.
6. Compile, run all tests, inspect transaction traces, and obtain independent security review.
7. Keep purchase settlement and mining activation disabled until their own end-to-end tests and explicit owner approvals.

No private wallet addresses, mnemonics, seed phrases, or private keys belong in this workspace.
