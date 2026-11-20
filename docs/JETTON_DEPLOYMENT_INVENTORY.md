# V COIN–TON Jetton Deployment Inventory

**Document ID:** VCT-JETTON-INV-001  
**Reviewed:** 2026-11-20  
**Scope:** `vahidnemati3544-opsking/v-coin-TON` only  
**Result:** **ACTON/TOLK REFERENCE CORE MIGRATED; AUTOMATED TEST RUN PENDING; NOT YET VCOIN-PRODUCTION-DEPLOYABLE.**

## Migration completed in repository

- Isolated Acton project: `contracts/acton/`.
- Upstream baseline: `ton-blockchain/acton-contracts`, pinned to commit `d721c3179696b453a9490fcfd2f30770f8c234b4`, Jetton v2.1.
- Toolchain pinned in `contracts/acton/Acton.toml` to Acton `1.2.0`.
- Migrated reference minter and wallet contracts to `contracts/acton/jetton-v2.1/contracts/`.
- Vendored upstream Tolk integration/regression test sources and wrappers: end-to-end flow, bounce handling, admin/governance, protocol validation, mutation regressions, gas tests.
- Added GitHub Actions workflow `.github/workflows/acton-jetton.yml` to run Acton build, Jetton integration tests, static checks, and formatting on PR/push.
- The legacy Tact project under `contracts/jetton/` remains untouched and is not the new reference core.

## What the imported upstream suite covers

The upstream Jetton v2.1 test sources include:
- Minter deployment and initial state.
- Minting and total-supply accounting.
- Jetton wallet deployment and address derivation.
- Transfers, recipient notifications, burns and supply decrement.
- TEP-89 wallet discovery.
- Admin handoff and authorization.
- Mint bounce: total supply is restored after the internal-transfer message bounces.
- Wallet transfer/burn bounce recovery.
- Malformed protocol payload rejection and gas checks.

**Important:** These are vendored test sources. The newly added GitHub Actions run must complete successfully before tests can be called passing in this repository.

## Remaining VCOIN-specific production blockers

The upstream Jetton reference is not a finished VCOIN contract. In particular, the reference minter has an administrator capable of minting, changing metadata, handing off administration, and upgrading code. Do not deploy it unchanged.

1. Implement VCOIN-specific fixed global cap of 10,000,000,000 VCOIN (6 decimals; 10^16 base units).
2. Enforce exactly five immutable allocation destinations and ceilings:
   - Founder: 2,000,000,000,000,000 base units.
   - Mining: 5,000,000,000,000,000 base units.
   - Treasury: 1,000,000,000,000,000 base units.
   - Liquidity/market: 1,000,000,000,000,000 base units.
   - Ecosystem/marketing: 1,000,000,000,000,000 base units.
3. Implement and test the founder's four-year vesting escrow. The exact cliff/start/release policy must be specified before implementation; duration alone does not determine those terms.
4. Remove or irreversibly disable code upgrade, mutable metadata and unrestricted mint/admin controls at finalization. Confirm metadata strategy before lock.
5. Add VCOIN-specific Acton tests for all allocation caps/destinations, aggregate cap, duplicate/replayed issuance, one-time finalization, vesting boundaries, and permanent mint disablement.
6. Pin reproducible dependencies/toolchain, review advisories, and obtain an independent smart-contract security audit.
7. Deploy and verify on Testnet before any Mainnet transaction.

## Prior Tact build (legacy only)

- Commit `ad54496b45cac115285a21ce0ef9be4147da6f02` — [GitHub Actions run 44716041416](https://github.com/vahidnemati3544-opsking/v-coin-TON/actions/runs/44716041416) passed.
- `npm run build`: passed; legacy `VCoinJettonWallet` and `VCoinMaster` compiled.
- `npm test`: passed; 1 suite, 4 arithmetic-only tests. These are not contract integration tests.
- Dependency installation reported five high-severity vulnerabilities and deprecated packages, including `@tact-lang/compiler@1.6.13`.

## Custody and execution boundaries

- The five recorded allocation addresses are candidate TON owner-wallet addresses; recording them does not prove control. Their Jetton wallet addresses are separate contracts derived from the deployed master.
- The GAS & OPERATIONS Tonkeeper address is for TON fees only. It does not automatically pay fees for transactions signed by other wallets.
- Wallet signatures and irreversible on-chain approvals must occur in the owner's Tonkeeper/TON Connect interface. Never request or store a seed phrase/private key.
- Do not issue, transfer real-value assets, or activate mining until all VCOIN-specific controls, tests, audit and Testnet gates are complete.

## References

- [TON TEP-74 Jetton standard](https://github.com/ton-blockchain/TEPs/blob/master/text/0074-jettons-standard.md)
- [Pinned TON Acton/Tolk Jetton v2.1 upstream](https://github.com/ton-blockchain/acton-contracts/tree/d721c3179696b453a9490fcfd2f30770f8c234b4/jetton-v2.1)
- [TON smart-contract toolchain guidance](https://docs.ton.org/contracts/overview)
- [Acton toolchain](https://github.com/ton-blockchain/acton)

This inventory records repository evidence. It is not a deployment authorization and does not claim VCOIN has been issued.
