# V COIN–TON Jetton Deployment Inventory

**Document ID:** VCT-JETTON-INV-001  
**Reviewed:** 2026-11-21  
**Scope:** `vahidnemati3544-opsking/v-coin-TON` only  
**Current result:** **BUILD + 25 SANDBOX TESTS + NPM CI INSTALL + ZERO-VULNERABILITY AUDIT PASSED; NOT READY FOR TESTNET OR MAINNET DEPLOYMENT.**

## Verified repository state

## Latest verified CI checkpoint — 2026-11-21 03:26 UTC

- Current review-branch head: `7f9382e24f676138792397980917630bb15737fc`.
- Jetton workflow #201 passed on this exact commit: https://github.com/vahidnemati3544-opsking/v-coin-TON/actions/runs/44861135006
- Mining workflow #215 (push) and #216 (pull request) both passed on this exact commit: https://github.com/vahidnemati3544-opsking/v-coin-TON/actions/runs/44861128901 and https://github.com/vahidnemati3544-opsking/v-coin-TON/actions/runs/44861135054
- The mining workflow initially failed because the new API safety test imported the server without a `DATABASE_URL`. The test now supplies a syntactically valid test-only PostgreSQL URL when CI has not configured one; no database connection is opened by this route-only test.
- These CI passes verify build/test workflows only. They do not mean the mining API is enabled, the Jetton is deployed, or any VCOIN has been minted or transferred.
- PR #5 remains Draft and unmerged. PR #4 remains a separate Draft Acton/Tolk implementation branch; its deployment and bounce-path blockers remain open.


- Active review branch: `audit/issuance-readiness-2026-11-21`.
- Draft PR #5 remains open and unmerged: https://github.com/vahidnemati3544-opsking/v-coin-TON/pull/5
- GitHub Actions run #177 completed successfully on the current reviewed branch state: https://github.com/vahidnemati3544-opsking/v-coin-TON/actions/runs/44836195642
- Run #177 compiled both `VCoinMaster` and `VCoinJettonWallet`, passed 18 Jest/Sandbox tests, passed `npm ci`, and passed `npm audit --audit-level=high` with zero known vulnerabilities.
- The committed `contracts/jetton/package-lock.json` was used successfully by `npm ci` in runs #175, #176 and #177; the lockfile path is verified.
- The TEP-74 response destination fields were corrected from optional to required addresses in transfer, internal-transfer, burn and burn-notification message layouts. The master and wallet now route excesses to those required destinations.
- TEP-89 `take_wallet_address.owner_address` uses the optional referenced-cell representation; tests cover `include_address=false` and `true`.
- Four additional adversarial tests cover insufficient Jetton balance, insufficient TON, forged internal transfer sender and forged burn notification sender.
- The wallet bounce handlers exist, but explicit bounce/recovery tests are still outstanding.
- TEP-74 source-level review notes are recorded in `docs/TEP74_CONFORMANCE_REVIEW.md`. This is not an independent audit or full certification.
- `@tact-lang/compiler@1.6.13` still emits a deprecation warning. The current compiler builds; a Tolk migration must not be attempted without equivalent tests and code-hash review.

## Fixed supply and allocation policy

- Maximum supply: 10,000,000,000 VCOIN.
- Decimals: 6.
- Maximum base units: 10000000000000000.
- Additional minting: disabled after one exact initial issuance.
- Founder: 2,000,000,000 VCOIN (20%; four-year vesting intended but not implemented).
- Mining reserve: 5,000,000,000 VCOIN (50%; mining remains disabled until Telegram bot integration).
- Treasury: 1,000,000,000 VCOIN (10%).
- Liquidity / market: 1,000,000,000 VCOIN (10%).
- Ecosystem / marketing: 1,000,000,000 VCOIN (10%).
- Allocation totals equal the fixed cap. The contract mints the full amount once to the founder wallet; four subsequent founder-signed transfers distribute the other allocations. Separate on-chain per-category caps are not implemented.

## Latest founder-vesting CI evidence

- GitHub Actions run #191 passed the build, all 25 Sandbox/policy tests, `npm ci` and the npm audit gate with zero known vulnerabilities: https://github.com/vahidnemati3544-opsking/v-coin-TON/actions/runs/44837612965
- Founder vesting tests cover exact funding, start-clock behavior, forged notification rejection, one-time wallet configuration, daily linear accrual, no release before day one, full release at day 1,460 and prevention of duplicate claims.
- Run #191 passed on the vesting implementation/test commit. Later documentation-only commits have their own CI runs; check the current PR head before any release decision.
- The vesting contract remains undeployed and unfunded. The escrow wallet address must be configured after deployment using the master getter. The independent audit and Testnet verification remain mandatory.

## TEP-64 metadata

- Draft metadata file: `contracts/jetton/metadata.json`.
- Metadata URI pinned to immutable commit: `https://raw.githubusercontent.com/vahidnemati3544-opsking/v-coin-TON/49c462124a082ef6c850079b35c6f77c5bda6ea2/contracts/jetton/metadata.json`.
- Includes name, symbol, description and decimals `"6"`.
- No image is included because the approved canonical logo asset is not currently stored in this repository. Owner approval of final public metadata and logo remains required.
- The master contract content is supplied at initialization; the deployment process must encode the URI using the TEP-64 off-chain content prefix `0x01`.

## Recorded Mainnet owner-wallet allocation map

These are owner-wallet addresses, not Jetton-wallet contract addresses. The latter must be derived from the deployed master.

| Allocation | Share | VCOIN | Owner-wallet address |
|---|---:|---:|---|
| Founder | 20% | 2,000,000,000 | `UQAdW09EvIesUXt9jzLq1T32O0351TaczwWJQLGGmw4aWrzy` |
| Mining reserve | 50% | 5,000,000,000 | `UQDMEIvklqeBW0Pn74sBHzOpoFGsSWDHE5NxZwfN-1KVsBD0` |
| Treasury | 10% | 1,000,000,000 | `UQBEW5bLGbq0yVDOimgl6fpZbQkdla9Wk5b0tXyx69bmBktQ` |
| Liquidity / market | 10% | 1,000,000,000 | `UQA0_thi3mXZ6jFlHHBfnyjVmXayR3hsGx5PC43_fBOTzXWn` |
| Ecosystem / marketing | 10% | 1,000,000,000 | `UQBQDb73DWWMGnxEr37TsqZSKNvVOC9MMwkvRmNY91LJqLsE` |

Separate GAS & OPERATIONS wallet (TON fees only, not a VCOIN allocation): `UQCOZYJNI3HC6PN1YCy1cP-ikKPygoVUQlX2SIcJ_zEWJeGB`.

These recorded addresses are candidates only. Recording an address does not prove control or authorize a transfer. Each destination requires proof of wallet control on the intended network. The separate fee wallet is not a VCOIN allocation recipient.

## Founder vesting implementation — approved design

- Founder allocation: 2,000,000,000 VCOIN (2,000,000,000,000,000 base units).
- Approved schedule: 1,460 daily accrual steps over 1,261,440,000 seconds (4 × 365 days), no cliff.
- The vesting clock begins only when the vesting contract receives the exact 2B allocation through an authentic Jetton notification from the founder.
- The beneficiary is fixed at vesting-contract deployment to the registered founder owner wallet.
- Anyone may trigger a claim, but the contract can send tokens only to that fixed beneficiary.
- The vesting contract source is `contracts/jetton/src/founder-vesting.tact`; dedicated integration tests are in `contracts/jetton/tests/founder-vesting.integration.spec.ts`.
- The escrow Jetton wallet address is configured once after deployment, using the deployed master’s `get_wallet_address` getter and a founder-signed configuration message. It cannot be changed after configuration.
- The vesting contract has not been deployed or funded. The approved schedule is implemented in source but remains subject to passing CI, code review, independent audit and Testnet verification.

## Remaining release blockers

1. **Bounce and recovery tests:** explicitly test failed destination-wallet delivery, bounce recovery, failed burn notification recovery and supply/balance invariants.
2. **Replay/idempotency:** complete adversarial review and tests; distinguish TON message replay protection from application-level duplicate transaction handling.
3. **Full TEP-74 / TEP-64 review:** complete comparison of every message bit layout, getter stack order, wallet behavior, gas assumptions, metadata serialization and wallet derivation against the active standards and official reference implementation.
4. **Founder vesting:** four-year vesting/escrow is not implemented. Finalize start time, cliff and release schedule, then implement and test a disclosed vesting contract before transferring the founder allocation.
5. **Wallet ownership:** prove control of all five destination wallets on the intended network.
6. **Independent security review:** obtain a third-party smart-contract audit and record the exact reviewed source/compiler/build hashes.
7. **Deployment workflow:** add a deterministic deploy/transaction builder that encodes the TEP-64 URI, records StateInit/code hashes and prepares exact wallet-signable transactions without custody of private keys.
8. **Testnet:** deploy only after code gates pass; verify master state, wallet derivation, metadata, one-time issuance, transfers, fees, bounce behavior and finality on-chain.
9. **Mainnet:** only after Testnet evidence and independent review, prepare exact reviewed build hashes, network, master deployment payload, recipient addresses, amounts, fees and transfer payloads for founder inspection and signature.

## Evidence status

| Evidence | Status |
|---|---|
| Fixed supply and allocation arithmetic | Passed |
| Contract build | Passed in CI #177 |
| 18 Sandbox/policy tests | Passed in CI #177 |
| `npm ci` | Passed in CI #173 |
| npm audit | 0 vulnerabilities in CI #177 |
| TEP-74 required response-destination correction | Implemented; build and tests passed |
| TEP-89 optional owner-address behavior | Implemented and tested |
| Committed package lockfile | Committed and verified by subsequent `npm ci` runs #175–#177 |
| Bounce/replay recovery tests | Pending |
| Full TEP-74 / TEP-64 conformance audit | Pending |
| Metadata URI/content draft | Committed; logo approval pending |
| Four-year founder vesting enforcement | Not implemented |
| Recipient wallet-control proofs | Pending |
| Independent smart-contract audit | Pending |
| Deployment transaction builder | Pending |
| Testnet master / deployment transaction | None |
| Mainnet master / deployment transaction | None |
| Initial mint transaction | None |
| Mainnet allocation transfers | None |

## Custody and safety

The founder remains the sole operational signer for distributions from the five founder-controlled wallets. No backend role or database flag can authorize token movement. Never request or store a recovery phrase or private key. A confirmed TON transfer to an independently controlled address cannot be reversed.

This inventory records source, test and release evidence. It does not claim VCOIN has been deployed, minted or transferred.
