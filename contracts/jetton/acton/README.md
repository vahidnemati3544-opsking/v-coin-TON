# V COIN TON — Jetton implementation workspace

## Current status

This directory contains a pinned copy of the TON reference Jetton v2.1 implementation and a separate VCOIN-specific fixed-supply implementation.

**Do not deploy the upstream reference Master for VCOIN.** It retains administrator mint, metadata-change and code-upgrade operations. The VCOIN-specific contracts are separate files and have passed emulator tests, but still require adversarial testing, independent security review, a deployment manifest and explicit deployment approval.

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

The upstream end-to-end suite remains a protocol baseline. The VCOIN suite additionally tests the exact fixed supply and allocation sum, five-slot Master/coordinator genesis, one-time wallet credit and replay acknowledgement, burn accounting, founder vesting bounce recovery, 48-month tranche arithmetic, and UTC calendar boundaries. The latest pinned Acton CI run passed 19 tests, static checks and formatting.

## VCOIN fixed-supply implementation

- `contracts/VcoinJettonMinter.tolk`: fixed-supply Master, five immutable genesis slots, acknowledgement-gated supply accounting, no admin mint/metadata mutation/code upgrade.
- `contracts/VcoinJettonWallet.tolk`: TEP-74 transfer/burn, one-time genesis credit and replay-safe acknowledgement, bounded failure notification.
- `contracts/VcoinGenesisCoordinator.tolk`: five-slot dispatcher with no arbitrary recipient/amount input.
- `contracts/VcoinFounderVesting.tolk`: 48 UTC calendar-month founder vesting, authenticated wallet discovery through the Master, receipt-confirmed releases and bounce recovery.

See [`docs/GENESIS_ISSUANCE_DESIGN.md`](../../../docs/GENESIS_ISSUANCE_DESIGN.md) and [`docs/FOUNDER_VESTING.md`](../../../docs/FOUNDER_VESTING.md) for implementation details and remaining security gates. These contracts are emulator-tested, not deployed or independently audited.

## Required VCOIN hardening before any deployment

1. Replace the reference minter with a fixed-supply genesis design: exactly 10,000,000,000 VCOIN / 10^16 base units at six decimals, and no post-genesis mint path.
2. Remove administrator metadata mutation and code-upgrade entry points; freeze metadata and contract code.
3. Implement the five approved allocation destinations and prove their exact sum.
4. Complete adversarial tests for bounced Master-to-wallet credit, acknowledgement loss/bounce, conflicting replay, wrong sender/amount and failed wallet deployment.
5. Inspect and independently review Master, Wallet, coordinator and founder vesting code, including transfer-failure and retry paths.
6. Prepare reproducible deployment scripts and a private deployment manifest; verify every derived address before any Testnet rehearsal.
7. Keep purchase settlement and mining activation disabled until their own end-to-end tests and explicit owner approvals.

No private wallet addresses, mnemonics, seed phrases, or private keys belong in this workspace.
