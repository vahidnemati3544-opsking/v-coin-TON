# V COIN–TON Jetton Deployment Inventory

**Document ID:** VCT-JETTON-INV-001  
**Reviewed:** 2026-11-20  
**Scope:** `vahidnemati3544-opsking/v-coin-TON` only  
**Result:** **LEGACY TACT BUILD PASSED; LIMITED ARITHMETIC TESTS PASSED; NOT DEPLOYABLE.**

## Verified CI result

- Commit `ad54496b45cac115285a21ce0ef9be4147da6f02` — [GitHub Actions run 44716041416](https://github.com/vahidnemati3544-opsking/v-coin-TON/actions/runs/44716041416) completed successfully.
- `npm run build`: passed; both `VCoinJettonWallet` and `VCoinMaster` compiled and packaged.
- `npm test`: passed; 1 suite, 4 tests. These validate arithmetic supply policy only; they do not execute contracts in TON Sandbox.
- Dependency installation reported **5 high-severity vulnerabilities** and deprecated packages, including `@tact-lang/compiler@1.6.13`. Audit remediation and a committed lockfile remain outstanding.

## Current repository state

1. First-pass Tact source exists under `contracts/jetton/src/`: `messages.tact`, `jetton.tact`, and `vcoin.tact`.
2. The master source encodes a global cap of 10,000,000,000 VCOIN at six decimals (10^16 base units), owner-authorized minting, and mint disablement when the cap is reached.
3. Build configuration, npm manifest, Jest configuration, TypeScript configuration, arithmetic tests, and GitHub Actions workflow are present.
4. No VCOIN master address, deployment transaction, Testnet issuance, or Mainnet issuance exists in the evidence reviewed here.

## Blocking security and implementation findings

- **Mint bounce accounting:** `mintTo` increments master `total_supply` before recipient Jetton-wallet credit is confirmed. The master has no corresponding bounced-mint recovery/acknowledgement flow. A bounced mint can leave master supply inconsistent with holder balances.
- **No allocation-specific on-chain controls:** only the global cap is enforced. The five approved destination addresses and individual allocation ceilings are not enforced by the contract.
- **No founder vesting enforcement:** the four-year founder vesting arrangement is not implemented in an audited vesting/escrow contract.
- **No TON Sandbox integration suite:** tests do not exercise deployment, minting, wallet derivation, transfers, burns, invalid senders, gas/fees, bounce recovery, or post-cap mint rejection against contract instances.
- **TEP compatibility and wallet behavior:** source compilation is not proof of TEP-74/TEP-64 conformance or safe contract behavior.
- **Dependency risk:** CI reported five high-severity dependency findings; dependency pinning/lockfile and audit remediation are incomplete.
- **Toolchain lifecycle:** the previously referenced `tact-lang/jetton` repository now identifies itself as deprecated and directs users to the Jetton implementation in Tolk. The old Tact implementation must not be treated as the current reference baseline.

## Required gates before any Testnet or Mainnet issuance

1. Migrate the Jetton core to the maintained TON Acton/Tolk Jetton v2.1 reference baseline, preserving TEP-74/TEP-64 message and getter compatibility. Review and remove/disable unsafe upgrade and mutable-metadata capabilities for the fixed-supply VCOIN deployment.
2. Add a VCOIN policy layer that enforces the five allocation ceilings and approved owner destinations on-chain. A global cap alone is insufficient.
3. Implement founder vesting with an explicit, tested escrow/vesting contract and define custody for the mining, treasury, liquidity, and ecosystem reserves.
4. Verify mint bounce accounting: the reference Tolk minter includes bounced mint supply rollback; test this behavior against real contract traces in Acton/Tolk tests.
5. Run contract-level tests for deployment, minting, wallet derivation, transfers, burns, invalid senders, gas/fees, bounce recovery, replay/duplicate messages, per-allocation caps, vesting cliffs/releases, and post-cap mint rejection.
6. Pin the Acton toolchain and all dependencies; commit reproducible dependency state and resolve or explicitly disposition all high-severity advisories.
7. Obtain independent smart-contract security review and verify metadata, decimals, total supply, destination addresses, and code hashes.
8. Deploy to Testnet using an owner-controlled wallet signature; verify master state, holder Jetton wallet addresses and transaction finality.
9. Mainnet deployment and issuance require separate explicit final approval after Testnet verification and review of the exact transaction.

## Custody and execution boundaries

- The five recorded allocation addresses are candidate TON owner-wallet addresses; recording them does not prove control. Their Jetton wallet addresses are separate contracts derived from the deployed master.
- The GAS & OPERATIONS Tonkeeper address is for TON fees only. It does not automatically pay fees for transactions signed by other wallets.
- Wallet signatures and irreversible on-chain approvals must occur in the owner's Tonkeeper/TON Connect interface. Never request or store a seed phrase/private key.
- Do not issue, transfer real-value assets, or activate mining until the gates above are complete.

## Current technical references

- [TON TEP-74 Jetton standard](https://github.com/ton-blockchain/TEPs/blob/master/text/0074-jettons-standard.md)
- [TON reference contracts in Tolk/Acton, including Jetton v2.1](https://github.com/ton-blockchain/acton-contracts)
- [Acton Jetton creation and Testnet-first deployment guide](https://docs.ton.org/contracts/standard/tokens/jettons/create)
- [Acton toolchain](https://github.com/ton-blockchain/acton)

This inventory records verified evidence and blockers; it is not a deployment authorization or evidence that VCOIN has been issued.
