# V COIN–TON Jetton Deployment Inventory

**Document ID:** VCT-JETTON-INV-001  
**Reviewed:** 2026-11-20  
**Scope:** `vahidnemati3544-opsking/v-coin-TON` only  
**Result:** **TACT BUILD PASSED; LIMITED ARITHMETIC TESTS PASSED; NOT DEPLOYABLE.**

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

## Latest remediation activity — 2026-11-20

- Commit `d050aa042c5b34411ecbea31acc3882bd1d00496` adds a master-contract bounced-message handler for mint-originated `TokenTransferInternal` messages. It reverses the provisional supply increment when the Jetton wallet deployment/credit message bounces and re-enables owner minting if the failed operation had reached the global cap.
- **Verification status:** this is a source-level remediation only. A fresh Tact build and TON Sandbox bounce test have not yet been run against this commit. Do not treat the issue as closed until both pass.
- The handler does not replace the required broader integration suite, five-allocation enforcement, vesting implementation, dependency remediation, or independent audit.

## Blocking security and implementation findings

- **Mint bounce accounting:** `mintTo` increments master `total_supply` before recipient Jetton-wallet credit is confirmed. The master has no corresponding bounced-mint recovery/acknowledgement flow. A bounced mint can leave master supply inconsistent with holder balances.
- **No allocation-specific on-chain controls:** only the global cap is enforced. The five approved destination addresses and individual allocation ceilings are not enforced by the contract.
- **No founder vesting enforcement:** the four-year founder vesting arrangement is not implemented in an audited vesting/escrow contract.
- **No TON Sandbox integration suite:** tests do not exercise deployment, minting, wallet derivation, transfers, burns, invalid senders, gas/fees, bounce recovery, or post-cap mint rejection against contract instances.
- **TEP compatibility and wallet behavior:** source compilation is not proof of TEP-74/TEP-64 conformance or safe contract behavior.
- **Dependency risk:** CI reported five high-severity dependency findings; dependency pinning/lockfile and audit remediation are incomplete.

## Required gates before any Testnet or Mainnet issuance

1. Correct mint accounting so failed/bounced wallet credit cannot leave total supply inflated; verify the fix in Sandbox.
2. Implement and test the five allocation ceilings/destinations and founder vesting/custody design.
3. Run TON Sandbox integration and negative tests for master and wallet flows, including transfers, burns, invalid senders, wallet derivation, bounce recovery, replay/duplicate messages, gas and fees.
4. Pin dependencies, commit a reproducible lockfile, and resolve or explicitly disposition all high-severity advisories.
5. Verify TEP-74/TEP-64 behavior and obtain independent smart-contract security review.
6. Deploy to Testnet using an owner-controlled wallet signature; verify master state, metadata, holder Jetton wallet addresses and transaction finality.
7. Mainnet deployment and issuance require separate explicit final approval after review of exact code hashes, metadata, supply and recipient destinations.

## Custody and execution boundaries

- The five recorded allocation addresses are candidate TON owner-wallet addresses; recording them does not prove control. Their Jetton wallet addresses are separate contracts derived from the deployed master.
- The GAS & OPERATIONS Tonkeeper address is for TON fees only. It does not automatically pay fees for transactions signed by other wallets.
- Wallet signatures and irreversible on-chain approvals must occur in the owner's Tonkeeper/TON Connect interface. Never request or store a seed phrase/private key.
- Do not issue, transfer real-value assets, or activate mining until the gates above are complete.

## Official technical references

- [TON TEP-74 Jetton standard](https://github.com/ton-blockchain/TEPs/blob/master/text/0074-jettons-standard.md)
- [TON Jetton implementation and test suite in Tact](https://github.com/tact-lang/jetton)
- [TON guidance on minting Jettons](https://docs.ton.org/develop/dapps/tutorials/jetton-minter)

This inventory records verified evidence and blockers; it is not a deployment authorization or evidence that VCOIN has been issued.
