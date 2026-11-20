# V COIN–TON Acton/Tolk Jetton Core Migration

This isolated Acton project vendors the TON reference Jetton v2.1 implementation and its contract-level test suite.

## Upstream provenance

- Repository: https://github.com/ton-blockchain/acton-contracts
- Pinned upstream commit: `d721c3179696b453a9490fcfd2f30770f8c234b4`
- Upstream package: `jetton-v2.1`
- Acton toolchain: `1.2.0`
- License: MIT (upstream repository)

The source is kept under `contracts/acton/` so it does not overwrite or silently mix with the legacy Tact project under `contracts/jetton/`.

## Commands

Run from this directory with Acton 1.2.0:

```bash
acton build
acton test jetton-v2.1/tests
acton check
acton fmt --check
```

The tests include end-to-end minter/wallet deployment, mint, transfer, notification, burn, wallet discovery, admin handoff, bounce handling, protocol validation, regression and gas checks.

## Important security boundary

This is the maintained reference Jetton core, not yet the finished VCOIN production contract. The upstream minter has an administrator with mint, metadata, admin-handoff and code-upgrade powers. Do not deploy it for VCOIN until a VCOIN policy implementation has been added and tested to enforce:
- fixed 10,000,000,000 VCOIN supply (6 decimals; 10^16 base units);
- exactly five immutable allocation destinations and ceilings;
- founder vesting escrow for the four-year founder allocation;
- one-time issuance and irreversible mint/admin/upgrade finalization;
- safe mint-bounce accounting and replay resistance.

The upstream suite tests Jetton protocol behavior; it does not by itself prove these VCOIN-specific rules. Testnet and independent security review are mandatory before Mainnet.
