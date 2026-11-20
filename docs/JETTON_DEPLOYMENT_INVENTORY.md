# V COIN–TON Jetton Deployment Inventory

**Document ID:** VCT-JETTON-INV-001  
**Reviewed:** 2026-11-21  
**Scope:** `vahidnemati3544-opsking/v-coin-TON` only  
**Result:** **SOURCE PRESENT; PRIOR BUILD EVIDENCE EXISTS; CURRENT SOURCE NOT VERIFIED; NOT DEPLOYABLE.**

## Verified repository state

- Main branch head reviewed: `5cc9e6d4955cf19b73be6c8484dcd736bcbdaefa`.
- The prior CI record for commit `ad54496b45cac115285a21ce0ef9be4147da6f02` reports a successful Tact build and four arithmetic-only Jest tests. That result does not establish that the latest source builds or that contracts behave correctly in TON Sandbox.
- Current master source: `contracts/jetton/src/vcoin.tact`; it includes a bounced `TokenTransferInternal` handler. The handler is present in source but has not been proven by a fresh build and TON Sandbox test.
- Current Jetton implementation: `contracts/jetton/src/jetton.tact`; it contains master and wallet logic, but TEP-74/TEP-64 conformance and secure behavior remain unverified.
- `contracts/jetton/package.json` pins `@tact-lang/compiler@1.6.13` and related dependencies. No `package-lock.json` was found at the reviewed path.
- The workflow `.github/workflows/vcoin-jetton.yml` runs install, build and Jest tests; the existing Jest suite is arithmetic policy testing, not contract execution in Sandbox.

## Fixed supply and allocation policy

- Maximum supply: 10,000,000,000 VCOIN.
- Decimals: 6.
- Maximum base units: 10000000000000000.
- Founder: 2,000,000,000 VCOIN (20%; four-year vesting intended).
- Mining reserve: 5,000,000,000 VCOIN (50%; user mining is deferred until Telegram bot integration).
- Treasury: 1,000,000,000 VCOIN (10%).
- Liquidity / market: 1,000,000,000 VCOIN (10%).
- Ecosystem / marketing: 1,000,000,000 VCOIN (10%).
- The five allocations sum to the fixed cap. Arithmetic agreement is not proof of on-chain enforcement.

## Current master issuance behavior

The current `VCoinMaster` accepts one exact initial mint of the full 10-billion supply and requires the receiver to equal the master owner wallet. It then disables minting. This means the current code does **not** mint directly to the five destination wallets and does **not** enforce their separate allocation caps. Distribution from the founder wallet would require separate owner-signed Jetton transfers after a successful mint.

The source-level bounce handler attempts to roll back provisional supply if the wallet-credit message bounces. This is an important recovery path, but it remains unverified. It must be exercised in Sandbox, including duplicate/bounce/replay scenarios, before any deployment.

## Blocking gates

1. **Fresh build:** run the current source with the pinned compiler and retain the exact build output and code hashes.
2. **TON Sandbox contract tests:** deploy master and wallet instances in Sandbox; test exact one-time mint, wrong owner, wrong receiver, wrong amount, second mint, successful wallet initialization, bounced wallet-credit recovery, transfers, burns, invalid senders, duplicate/replay messages, and balances/supply consistency.
3. **Allocation execution design:** decide and test whether the full supply is first minted to the founder wallet and then split by five explicit signed transfers. Confirm the five exact owner-wallet addresses and derive each Jetton wallet address from the deployed master. Do not mistake owner-wallet addresses for Jetton-wallet addresses.
4. **Founder vesting:** the current source does not enforce four-year vesting. Either implement and independently review a disclosed vesting/escrow contract or explicitly revise the custody design before issuance. Do not describe an ordinary founder wallet as time-locked.
5. **TEP compatibility:** validate the master/wallet interfaces, message opcodes, getters and metadata against TEP-74/TEP-64 and a maintained reference implementation.
6. **Dependencies:** create and commit a reproducible lockfile; investigate and remediate or explicitly disposition all dependency advisories. The previous installation reported five high-severity findings.
7. **Independent review:** obtain smart-contract security review and record reviewed source/build hashes.
8. **Testnet:** only after the above code gates, deploy using the founder's own wallet signature; verify master state, wallet derivation, mint, transfers, metadata and finality.
9. **Mainnet:** only after Testnet evidence and independent review, show the founder the exact final build hashes, network, master deployment details, recipients, amounts, fees and transaction payloads for explicit approval and signature.

## Evidence status

| Evidence | Status |
|---|---|
| Fixed supply arithmetic | Present in source and prior arithmetic tests |
| Current-source fresh build | Pending |
| TON Sandbox integration / bounce tests | Pending |
| Five allocation-specific on-chain caps | Not implemented |
| Four-year founder vesting enforcement | Not implemented |
| Dependency lockfile / advisory disposition | Pending |
| TEP-74 / TEP-64 conformance review | Pending |
| Independent security review | Pending |
| Testnet master address / deployment tx | None recorded |
| Mainnet master address / deployment tx | None recorded |
| Initial issuance transaction | None recorded |
| Mainnet allocation transfers | None recorded |

## Custody and safety

The five recorded TON owner-wallet addresses are candidate destinations; recording them does not prove control. Their Jetton wallet addresses are separate contracts derived from the deployed master. The separate GAS & OPERATIONS wallet is for TON fees and is not a VCOIN allocation recipient. Each transaction must be reviewed and signed by the founder in their own wallet. Never request or store a recovery phrase or private key.

This inventory is an evidence and release-control record. It is not a deployment authorization and does not claim that VCOIN has been deployed, minted or transferred.
