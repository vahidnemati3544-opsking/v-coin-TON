> **Controlling baseline correction (2026-11-23):** This inventory contains historical snapshots. For current project decisions, the authoritative baseline is: 2,100,000,000 VCOIN total supply (6 decimals); Founder 420,000,000 VCOIN credited in one operation with no vesting/time lock/installments; Mining 1,050,000,000; Treasury, Liquidity/Market, and Ecosystem/Marketing 210,000,000 each; five official allocation wallets with the Founder wallet also serving as the sole GAS & OPERATIONS wallet; Mainnet-only execution after local engineering verification; no Testnet deployment, transaction, or rehearsal; and no independent external audit workstream, pending task, or release condition. Historical entries below that state 10B supply, 0.008 reference price, founder vesting, a separate fee wallet, Testnet rehearsal, or independent external audit are superseded and must not be used for current execution. The currently approved modelled USD reference baseline is 0.004 per VCOIN; it is not a market quote or guarantee. No Mainnet transaction is authorized without explicit Founder approval.

> **Action #54 — exact-head and Master-address reconciliation (2026-11-23):** Current `main` HEAD is `d6c4f1cdd5618aa0eaa7b7ab31e58a998cb00bbe`; exact-head run #282 (`45066224453`) passed build-and-test, Pages deployment, and published endpoint verification. Latest full-source artifact `14771790593` SHA-256 `482b913daeda2a4c482c08ca47c3748a40befbe32eebb1dd1ec7d256d12beb0d`; latest contract artifact `14771606988` SHA-256 `fbeebdd60c32d4269951c06130882b999c7a501f3b991818f6712b192426a8c8`. Current unsigned preview predicts Master `EQBn4hW8bKhFTSz9riY5q3Pr3SfJmv2VYKZQl_NWMbK--5fP`, StateInit `67e215bc6ca8454d2cfdae2639ab73ebdd27c99afd9560a65097f35631b2befb`. The Founder-supplied `UQAo1TAGqSw6oUaMmpBtgQyRtCGEbSJNiGGy2Use04lRCVSR` matches the earlier preview StateInit `28d53006a92c3aa1468c9a906d810c91b421846d224d8861b2d94b1ed3895109`, not the current preview. Neither address is confirmed deployed until live Mainnet account/getter checks succeed. Do not deploy the newer preview if the historical address is active; first determine whether it already holds the VCOIN Master state. The supplied 32-byte hash remains unresolved as transaction-vs-message hash. Mainnet remains NO-GO. See [Action #54](MAINNET_ADDRESS_RECONCILIATION_ACTION_54.md) and [current verification status](../contracts/jetton/VERIFICATION_STATUS.md).

# V COIN–TON Jetton Deployment Inventory

**Document ID:** VCT-JETTON-INV-001  
**Reviewed:** 2026-11-20  
**Scope:** `vahidnemati3544-opsking/v-coin-TON` only  
**Result:** **TACT BUILD PASSED; LIMITED ARITHMETIC TESTS PASSED; NOT DEPLOYABLE.**

> **Current-state addendum — 2026-11-22:** This inventory's original 2026-11-20 findings are a historical snapshot and are superseded where they conflict with the addendum below. The current `main` source now includes fixed five-role allocation enforcement and natural-bounce/retry Sandbox coverage. Exact-head GitHub Actions run #78 on commit `4458760becbd9f7a37b1ffa85695999bdf73cfe4` passed lockfile generation, clean `npm ci`, dependency audit (0 vulnerabilities), Tact build, and the full Jest Sandbox suite. The generated lockfile is preserved as a CI artifact but is not yet committed to `main`. The Founder allocation is now 420M VCOIN in one immediate operation with no vesting or time lock. The current execution path is local Sandbox only, then Mainnet after independent review; no Testnet deployment is planned. Mainnet remains NO-GO: metadata/content cell, committed lockfile and exact-head rerun, independent TEP-74/TEP-64/security review, independent TON cell/StateInit hash reproduction, wallet-control proofs, and explicit transaction approvals remain outstanding. No deployment or issuance has occurred.


> **Superseding economic and build addendum — 2026-11-22:** The owner approved 2,100,000,000 VCOIN total supply, six decimals, with unchanged allocation percentages: Founder 420,000,000; Mining Reserve 1,050,000,000; Treasury 210,000,000; Liquidity/Market 210,000,000; Ecosystem/Marketing 210,000,000. The modelled USD reference baseline is 0.008 per VCOIN (not a market quote or guarantee). Exact-head CI build and Jest tests passed on source commit 6455cc0c7bf41b8e2fe0cb6552817129ce078aa8 (run #135); the fresh unsigned preview derives Master EQAriHkG8kqO0GQwwX6ODgqpJCV-oUDKwalDK8lAzYGBWHvV with StateInit hash 2b887906f24a8ed06430c17e8e0e0aa924257ea140cac1a9432bc940cd818158. The five predicted Jetton Wallet addresses are recorded in the current allocation manifest and remain subject to independent hash reproduction and deployed-Master getter checks. Mainnet is still NOT DEPLOYED; the Pages deploy job still requires repository Pages administration. Older 10B previews and addresses are superseded and must not be signed.

> **Action #52 — current policy and evidence correction (2026-11-22):** The historical sections below contain superseded descriptions of a separate GAS wallet and Testnet rehearsal. Current authority is Mainnet-only: no Testnet deployment or transaction is authorized. The Founder allocation address is also the sole GAS & OPERATIONS address; there is no separate fee address or sixth wallet. Current supply remains 2,100,000,000 VCOIN at six decimals, with allocations 420M / 1,050M / 210M / 210M / 210M. The latest exact-head unsigned contract artifact is run #252, source commit `22534f7d03d896ea45fbe330a7a5a9940d44d419`, artifact ID `14768219639`, SHA-256 `800946828268df7e1b522c9da5d162f878814711c02a7525dff1eafbc99fa853`. Build-and-test passed; Pages issuer deployment failed because the Actions integration cannot create the Pages site. The artifact is a contract build package, not the full source project. Mainnet remains NO-GO pending independent qualified audit, clean-room rebuild, live fee/reserve review and Founder signatures. No deployment or issuance has occurred.

> **Action #53 — latest verified build, source bundle and Pages status (2026-11-22):** Exact-head run `45064455569` on commit `219d3e7e5a817615aeaf13c696f338b0149abf35` passed build-and-test and deploy-issuer. Contract artifact `14770292970` SHA-256 `05822a13a50db8c2fe76dc5a7670b18632d36f938e50ec2163cc6296cfbe85fd`; full source artifact `14770472604` SHA-256 `3ef2188eb39464fd8c9789a82de31d869ddf3de0976bf2b88220056bc59d6de1`. Pages deployment succeeded at `https://vahidnemati3544-opsking.github.io/v-coin-TON/`. The current issuer reads the deployment TON attachment from the generated preview (currently 1.00 TON) and CI guards against hard-coded reserve values. The five-wallet allocation and 2.1B supply remain unchanged. Mainnet is still NO-GO pending qualified independent audit, clean-room rebuild, live fee/reserve review and Founder signatures. No Mainnet transaction has been sent. See [Action #53 report](PROJECT_REVIEW_ACTION_53.md).

## Verified CI result

- Commit `ad54496b45cac115285a21ce0ef9be4147da6f02` — [GitHub Actions run 44716041416](https://github.com/vahidnemati3544-opsking/v-coin-TON/actions/runs/44716041416) completed successfully.
- `npm run build`: passed; both `VCoinJettonWallet` and `VCoinMaster` compiled and packaged.
- `npm test`: passed; 1 suite, 4 tests. These validate arithmetic supply policy only; they do not execute contracts in TON Sandbox.
- Dependency installation reported **5 high-severity vulnerabilities** and deprecated packages, including `@tact-lang/compiler@1.6.13`. Audit remediation and a committed lockfile remain outstanding.

## Current repository state

1. First-pass Tact source exists under `contracts/jetton/src/`: `messages.tact`, `jetton.tact`, and `vcoin.tact`.
2. The master source encodes a global cap of 2,100,000,000 VCOIN at six decimals (2.1 × 10^15 base units), owner-authorized minting, and mint disablement when the cap is reached.
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
