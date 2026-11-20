# V COIN–TON Jetton Deployment Inventory

**Document ID:** VCT-JETTON-INV-001  
**Reviewed:** 2026-11-21  
**Scope:** `vahidnemati3544-opsking/v-coin-TON` only  
**Result:** **CURRENT PR MERGE BUILDS; FOUR ARITHMETIC TESTS PASS; SANDBOX / SECURITY GATES OPEN; NOT DEPLOYABLE.**

## Verified repository state

- Main branch head reviewed: `5cc9e6d4955cf19b73be6c8484dcd736bcbdaefa`.
- Fresh GitHub Actions run [#44823097949](https://github.com/vahidnemati3544-opsking/v-coin-TON/actions/runs/44823097949), workflow run number 139, completed successfully for PR #5 merge commit `adbcdcbbc53f2ed08a4a9e8a159e50b33a6eb560` (including head commit `a7d919702a108706859395f3166f2a3d5e378c24`). `npm run build` compiled and packaged both `VCoinJettonWallet` and `VCoinMaster`; `npm test` passed one suite with four arithmetic-only tests. This confirms compilation of the PR merge source, not runtime correctness or TON Sandbox behavior.
- Current master source: `contracts/jetton/src/vcoin.tact`; it includes a bounced `TokenTransferInternal` handler. The handler is present in source but has not been proven by a fresh build and TON Sandbox test.
- Current Jetton implementation: `contracts/jetton/src/jetton.tact`; it contains master and wallet logic, but TEP-74/TEP-64 conformance and secure behavior remain unverified.
- `contracts/jetton/package.json` pins `@tact-lang/compiler@1.6.13` and related dependencies. No `package-lock.json` was found at the reviewed path.
- The workflow `.github/workflows/vcoin-jetton.yml` runs install, build and Jest tests. The fresh run emitted five high-severity npm audit findings and deprecation warnings for `@tact-lang/compiler@1.6.13` and transitive packages. The existing Jest suite is arithmetic policy testing, not contract execution in Sandbox.

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

## Recorded Mainnet owner-wallet allocation map

The following is the approved destination map for the initial fixed supply. These are owner-wallet addresses, not Jetton-wallet addresses; the latter must be derived from the deployed master after Testnet verification.

| Allocation | Share | VCOIN | Owner-wallet address |
|---|---:|---:|---|
| Founder | 20% | 2,000,000,000 | `UQAdW09EvIesUXt9jzLq1T32O0351TaczwWJQLGGmw4aWrzy` |
| Mining reserve | 50% | 5,000,000,000 | `UQDMEIvklqeBW0Pn74sBHzOpoFGsSWDHE5NxZwfN-1KVsBD0` |
| Treasury | 10% | 1,000,000,000 | `UQBEW5bLGbq0yVDOimgl6fpZbQkdla9Wk5b0tXyx69bmBktQ` |
| Liquidity / market | 10% | 1,000,000,000 | `UQA0_thi3mXZ6jFlHHBfnyjVmXayR3hsGx5PC43_fBOTzXWn` |
| Ecosystem / marketing | 10% | 1,000,000,000 | `UQBQDb73DWWMGnxEr37TsqZSKNvVOC9MMwkvRmNY91LJqLsE` |

Under the current one-time mint design, the exact sequence is: mint 10,000,000,000 VCOIN to the founder owner wallet; then, only after confirming the deployed master and the five derived Jetton-wallet addresses, have the founder sign four separate transfers: 5,000,000,000 to mining reserve, 1,000,000,000 to treasury, 1,000,000,000 to liquidity / market, and 1,000,000,000 to ecosystem / marketing. The founder retains 2,000,000,000 VCOIN. Each transfer is a separate irreversible on-chain transaction and must show its destination, amount, network, fee and payload for the founder's review before signing. This is an execution plan only; no master deployment, mint or transfer has occurred.

## Blocking gates

1. **Fresh build — passed for PR merge commit `adbcdcbbc53f2ed08a4a9e8a159e50b33a6eb560`:** GitHub Actions run #44823097949 successfully compiled and packaged both contracts. Retain and independently verify the generated code hashes before deployment; a successful build is not a security approval.
2. **TON Sandbox contract tests:** deploy master and wallet instances in Sandbox; test exact one-time mint, wrong owner, wrong receiver, wrong amount, second mint, successful wallet initialization, bounced wallet-credit recovery, transfers, burns, invalid senders, duplicate/replay messages, and balances/supply consistency.
3. **Allocation execution design:** decide and test whether the full supply is first minted to the founder wallet and then split by five explicit signed transfers. Confirm the five exact owner-wallet addresses and derive each Jetton wallet address from the deployed master. Do not mistake owner-wallet addresses for Jetton-wallet addresses.
4. **Founder vesting:** the current source does not enforce four-year vesting. Either implement and independently review a disclosed vesting/escrow contract or explicitly revise the custody design before issuance. Do not describe an ordinary founder wallet as time-locked.
5. **TEP compatibility:** validate the master/wallet interfaces, message opcodes, getters and metadata against TEP-74/TEP-64 and a maintained reference implementation.
6. **Dependencies:** create and commit a reproducible lockfile; investigate and remediate or explicitly disposition the five high-severity npm audit findings and compiler/transitive-package deprecation warnings reported by run #44823097949.
7. **Independent review:** obtain smart-contract security review and record reviewed source/build hashes.
8. **Testnet:** only after the above code gates, deploy using the founder's own wallet signature; verify master state, wallet derivation, mint, transfers, metadata and finality.
9. **Mainnet:** only after Testnet evidence and independent review, show the founder the exact final build hashes, network, master deployment details, recipients, amounts, fees and transaction payloads for explicit approval and signature.

## Evidence status

| Evidence | Status |
|---|---|
| Fixed supply arithmetic | Present in source and prior arithmetic tests |
| Fresh build of PR merge commit `adbcdcbbc53f2ed08a4a9e8a159e50b33a6eb560` | Passed in Actions run #44823097949 |
| TON Sandbox integration / bounce tests | Pending |
| Five allocation-specific on-chain caps | Not implemented |
| Four-year founder vesting enforcement | Not implemented |
| Dependency lockfile / advisory disposition | Pending; 5 high-severity findings reported |
| TEP-74 / TEP-64 conformance review | Pending |
| Independent security review | Pending |
| Testnet master address / deployment tx | None recorded |
| Mainnet master address / deployment tx | None recorded |
| Initial issuance transaction | None recorded |
| Mainnet allocation transfers | None recorded |

## Custody and safety

The five recorded TON owner-wallet addresses are candidate destinations; recording them does not prove control. Their Jetton wallet addresses are separate contracts derived from the deployed master. The separate GAS & OPERATIONS wallet is for TON fees and is not a VCOIN allocation recipient. Each transaction must be reviewed and signed by the founder in their own wallet. Never request or store a recovery phrase or private key.

This inventory is an evidence and release-control record. It is not a deployment authorization and does not claim that VCOIN has been deployed, minted or transferred.
