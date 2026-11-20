# V COIN–TON Jetton Deployment Inventory

**Document ID:** VCT-JETTON-INV-001  
**Reviewed:** 2026-11-21  
**Scope:** `vahidnemati3544-opsking/v-coin-TON` only  
**Current result:** **BUILD + 13 SANDBOX/POLICY TESTS + NPM AUDIT PASSED; NOT READY FOR TESTNET OR MAINNET DEPLOYMENT.**

## Verified repository state

- Active review branch: `audit/issuance-readiness-2026-11-21`.
- Draft PR #5 remains open and unmerged: https://github.com/vahidnemati3544-opsking/v-coin-TON/pull/5
- Latest verified CI run #157 completed successfully: https://github.com/vahidnemati3544-opsking/v-coin-TON/actions/runs/44827055497
- CI #157 compiled both `VCoinMaster` and `VCoinJettonWallet`, passed 13 Jest/Sandbox/policy tests, and reported zero npm audit vulnerabilities.
- The suite includes exact one-time issuance, owner/receiver/amount rejection, second-mint rejection, founder wallet credit, transfer, unauthorized transfer rejection, burn accounting, five-wallet allocation transfers, and TEP-89 optional owner-address response behavior.
- TEP-89 `take_wallet_address.owner_address` was corrected to the standard optional referenced-cell representation (`Maybe ^Cell`); tests cover both `include_address=false` and `true`.
- The wallet bounce handlers exist in source, but explicit bounce/replay/recovery tests remain outstanding.
- `package.json` now overrides vulnerable transitive `protobufjs` and `zod` versions; CI reports zero known vulnerabilities. A committed `package-lock.json` is still missing, so fully reproducible dependency installation is not yet established.
- npm still emits a deprecation warning for `@tact-lang/compiler@1.6.13`; the current compiler builds successfully, but the longer-term Tolk migration question has not been resolved.

## Fixed supply and allocation policy

- Maximum supply: 10,000,000,000 VCOIN.
- Decimals: 6.
- Maximum base units: 10000000000000000.
- Founder: 2,000,000,000 VCOIN (20%; four-year vesting intended).
- Mining reserve: 5,000,000,000 VCOIN (50%; mining remains disabled until Telegram bot integration).
- Treasury: 1,000,000,000 VCOIN (10%).
- Liquidity / market: 1,000,000,000 VCOIN (10%).
- Ecosystem / marketing: 1,000,000,000 VCOIN (10%).
- Allocation totals equal the fixed cap. The contract mints the full amount once to the founder wallet; four subsequent founder-signed transfers distribute the other allocations. Separate on-chain per-category caps are not implemented.

## Recorded Mainnet owner-wallet allocation map

These are owner-wallet addresses, not Jetton-wallet contract addresses. The latter must be derived from the deployed master and verified on the intended network.

| Allocation | Share | VCOIN | Owner-wallet address |
|---|---:|---:|---|
| Founder | 20% | 2,000,000,000 | `UQAdW09EvIesUXt9jzLq1T32O0351TaczwWJQLGGmw4aWrzy` |
| Mining reserve | 50% | 5,000,000,000 | `UQDMEIvklqeBW0Pn74sBHzOpoFGsSWDHE5NxZwfN-1KVsBD0` |
| Treasury | 10% | 1,000,000,000 | `UQBEW5bLGbq0yVDOimgl6fpZbQkdla9Wk5b0tXyx69bmBktQ` |
| Liquidity / market | 10% | 1,000,000,000 | `UQA0_thi3mXZ6jFlHHBfnyjVmXayR3hsGx5PC43_fBOTzXWn` |
| Ecosystem / marketing | 10% | 1,000,000,000 | `UQBQDb73DWWMGnxEr37TsqZSKNvVOC9MMwkvRmNY91LJqLsE` |

Separate GAS & OPERATIONS wallet (TON fees only, not a VCOIN allocation): `UQCOZYJNI3HC6PN1YCy1cP-ikKPygoVUQlX2SIcJ_zEWJeGB`.

The intended distribution sequence is: mint 10,000,000,000 VCOIN to the founder owner wallet; then have the founder sign four separate transfers of 5,000,000,000 to mining reserve and 1,000,000,000 each to treasury, liquidity/market, and ecosystem/marketing. The founder retains 2,000,000,000 VCOIN. Each transaction is independently reviewed and irreversible after confirmation.

## Remaining release blockers

1. **Bounce and adversarial tests:** test failed wallet deployment/credit, bounce recovery, replay/duplicate messages, insufficient TON, invalid wallet senders, and supply/balance invariants.
2. **Dependency reproducibility:** generate and commit `package-lock.json`; change CI to `npm ci` once committed. Keep the zero-vulnerability audit gate.
3. **Compiler lifecycle:** assess migration from deprecated Tact compiler tooling to maintained Tolk tooling; do not perform a blind language migration without equivalent tests and code-hash review.
4. **TEP-74 / TEP-64 conformance:** independently compare all message layouts, getters, wallet behavior, and metadata serialization against the active standards/reference implementation.
5. **Metadata:** final TEP-64 content/URI is not selected; deployment template still has `metadata.uri=null`. Do not deploy empty or placeholder metadata.
6. **Founder vesting:** the four-year founder vesting arrangement is not enforced by the current contract. Implement and review a disclosed vesting/escrow contract or revise the custody arrangement before issuance.
7. **Wallet ownership:** prove control of all five destination wallets on the intended network; recorded addresses alone are not proof.
8. **Independent security review:** obtain a separate smart-contract audit and record the exact reviewed source/compiler/build hashes.
9. **Testnet:** deploy only after code gates pass; verify master state, wallet derivation, metadata, one-time issuance, transfers, fees, and finality on-chain.
10. **Mainnet:** only after Testnet evidence and independent review, prepare exact reviewed build hashes, network, master deployment payload, recipient addresses, amounts, fees, and transfer payloads for founder inspection and signature.

## Evidence status

| Evidence | Status |
|---|---|
| Fixed supply and allocation arithmetic | Passed in CI |
| Contract build | Passed in CI #157 |
| 13 Sandbox/policy tests | Passed in CI #157 |
| npm audit | 0 vulnerabilities in CI #157 |
| TEP-89 optional owner-address behavior | Implemented and tested |
| Bounce/replay recovery tests | Pending |
| Committed dependency lockfile | Pending |
| Full TEP-74 / TEP-64 conformance review | Pending |
| Metadata URI/content | Not finalized |
| Four-year founder vesting enforcement | Not implemented |
| Recipient wallet-control proofs | Pending |
| Independent smart-contract audit | Pending |
| Testnet master / deployment transaction | None |
| Mainnet master / deployment transaction | None |
| Initial mint transaction | None |
| Mainnet allocation transfers | None |

## Custody and safety

The founder remains the signer for operational distributions. The five recorded addresses are candidate owner-wallet destinations; recording them does not prove control. Their Jetton wallet contract addresses are derived from the deployed master. The separate GAS & OPERATIONS wallet is for TON fees only. Never request or store a recovery phrase or private key.

This inventory records source, test and release evidence. It is not a deployment authorization and does not claim VCOIN has been deployed, minted or transferred.
