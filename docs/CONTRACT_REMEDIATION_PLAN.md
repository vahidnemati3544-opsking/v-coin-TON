# V COIN–TON Contract Remediation Plan

**Document ID:** VCT-SEC-REMED-001  
**Branch:** `security/acton-tolk-jetton-remediation`  
**Scope:** TON repository only. The legacy BNB project is out of scope.  
**Status:** Engineering migration plan recorded; no production contract changes are represented as complete.

## Non-negotiable token parameters

- Total supply: 10,000,000,000 VCOIN.
- Decimals: 6.
- Base-unit cap: 10,000,000,000,000,000.
- No further minting after the complete initial allocation has been issued.
- Founder: 2,000,000,000 VCOIN, subject to four-year vesting.
- Mining: 5,000,000,000 VCOIN.
- Treasury: 1,000,000,000 VCOIN.
- Liquidity/market: 1,000,000,000 VCOIN.
- Ecosystem/marketing: 1,000,000,000 VCOIN.

## Why the current Tact source is not patched in place

The current custom Tact code has a supply-accounting flaw on bounced mint messages and does not enforce the approved allocation destinations or vesting. A superficial bounce handler is not a safe patch: the message layout, sender authentication, asynchronous message flow, state rollback, and replay behavior must be tested together. The current test suite does not instantiate the contracts in a TON emulator.

The old `tact-lang/jetton` repository is marked deprecated. The maintained direction is the TON Acton/Tolk Jetton v2.1 reference implementation in `ton-blockchain/acton-contracts`. Its minter explicitly handles bounced mint messages by rolling back the corresponding total-supply increment, and its wallet/minter code is accompanied by Acton test suites. This is a baseline, not an automatic security certification.

## Implementation sequence

### 1. Replace the legacy Jetton core

- Create an Acton project using the maintained Tolk Jetton v2.1 baseline.
- Pin the exact upstream commit and Acton toolchain version.
- Preserve standard Jetton message layouts and getters.
- Review the reference minter's upgrade/admin/metadata controls. For VCOIN, disable code upgrades and mutable metadata after finalization, or prove an explicitly governed safe alternative.
- Keep the existing Tact source archived as legacy/reference; do not deploy it.

### 2. Add VCOIN issuance policy

- Enforce a global cap of 10^16 base units.
- Define five allocation records, each with a fixed owner address and immutable maximum:
  - Founder: 2,000,000,000,000,000 base units.
  - Mining: 5,000,000,000,000,000 base units.
  - Treasury: 1,000,000,000,000,000 base units.
  - Liquidity/market: 1,000,000,000,000,000 base units.
  - Ecosystem/marketing: 1,000,000,000,000,000 base units.
- Track minted/credited amounts per allocation and reject any destination or amount exceeding its allocation.
- Ensure the sum of all allocation ceilings equals the global cap.
- Make issuance one-time and permissioned. After all allocations have been successfully credited, irreversibly disable minting.

### 3. Founder vesting and reserve custody

- Implement a separate Jetton vesting escrow using standard Jetton transfers.
- Specify cliff, linear release schedule, start timestamp, beneficiary, and revocation policy before coding.
- The four-year duration alone is not enough to define a safe vesting contract; do not invent a cliff or release cadence.
- Define whether the mining reserve is held by a dedicated contract or controlled multisig before issuance. Do not place mining tokens into an ordinary hot wallet without an approved custody policy.

### 4. Required Acton/Tolk tests

- Deploy minter and wallet in local emulator.
- Mint to each of the five authorized destinations.
- Reject unauthorized admin and unapproved destination.
- Reject allocation overrun and global cap overrun.
- Force recipient-wallet deployment/credit bounce and verify master total supply rollback.
- Verify that a bounced message cannot be replayed to roll back supply twice.
- Verify transfers, notifications, excesses, burns, wallet address derivation, and invalid sender rejection.
- Verify vesting cliff and release boundaries, beneficiary-only claims, and no early withdrawal.
- Verify mint is permanently disabled after all five allocations are fully issued.
- Snapshot gas/fees and test minimum TON funding.

### 5. Release gates

- Acton build, tests, lint and formatting all pass in CI.
- Reproducible lockfile/toolchain state committed.
- High-severity dependency advisories resolved or documented with explicit risk acceptance.
- Independent smart-contract audit completed.
- Testnet deployment and full five-allocation flow verified.
- Exact metadata, supply, owner addresses, code hashes and fees reviewed before Mainnet.

## Current status

The migration is intentionally isolated from the legacy Tact folder. The imported upstream minter still has admin mint, metadata-change, admin-handoff and code-upgrade capabilities; therefore it is a reference core for the next VCOIN policy layer, not safe to deploy unchanged.

- [x] Existing CI build and four arithmetic tests recorded as passing.
- [x] Existing code's mint-bounce flaw and missing allocation/vesting controls recorded.
- [x] Deprecated Tact reference identified; maintained Tolk/Acton baseline identified.
- [x] Pinned TON Acton/Tolk Jetton v2.1 core, wrappers, and upstream integration-test sources vendored under `contracts/acton/`.
- [ ] Acton build and full vendored integration suite pass in the new GitHub Actions run (workflow added; result pending).
- [ ] VCOIN allocation enforcement implemented and tested.
- [ ] Founder vesting escrow implemented and tested.
- [x] Acton 1.2.0 CI: build, Jetton + VCOIN policy test suites, static checks, and formatting all pass — 75 tests across 7 files. [Run #45](https://github.com/vahidnemati3544-opsking/v-coin-TON/actions/runs/44718483274).
- [ ] Dependency audit and reproducible lockfile complete.
- [ ] Independent security review complete.
- [ ] Testnet deployment and verification complete.
- [ ] Mainnet issuance separately approved and signed by owner.

## Operational rule

Do not ask the owner to send a seed phrase or private key. All public-network transactions must be displayed through TON Connect and signed by the owner in Tonkeeper. Do not report a deployment, token issuance, or transaction success without explorer-verifiable evidence.
