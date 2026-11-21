# V COIN–TON Jetton Deployment Inventory

**Document ID:** VCT-JETTON-INV-001  
**Reviewed:** 2026-11-21  
**Scope:** `vahidnemati3544-opsking/v-coin-TON` only  
**Current result:** PR #5 Tact candidate compiles and passes 27 Sandbox/Jest tests plus `npm ci` and the high-severity npm audit gate on current head `1ff1dbaddc5c6cc365a14ea1a7d4ed738a7ba9ca`; no Mainnet deployment, mint, or transfer has occurred.

## Verified repository state

## Latest verified CI checkpoint — 2026-11-21 06:47 UTC

- Current PR #5 head: `1ff1dbaddc5c6cc365a14ea1a7d4ed738a7ba9ca`.
- Jetton workflow #214 passed on this exact head: https://github.com/vahidnemati3544-opsking/v-coin-TON/actions/runs/44877153157
- Result: build passed; all 27 Jest/Sandbox tests passed; `npm ci` passed; `npm audit --audit-level=high` passed with zero known vulnerabilities.
- Backend workflow #227 passed on the same head: https://github.com/vahidnemati3544-opsking/v-coin-TON/actions/runs/44877153108
- Mining workflow #229 was still running at the time of this checkpoint; do not record it as passed until completed.

## Previous verified CI checkpoint — 2026-11-21 03:26 UTC

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
- The Jetton wallet restores its balance on a bounced `TokenTransferInternal` and now emits a VCOIN-specific `JettonTransferBounce` callback to that wallet's owner. The founder vesting contract authenticates the configured vesting wallet and rolls back `released`. Sandbox tests now simulate bounced `TokenTransferInternal` and `TokenBurnNotification` envelopes, execute the real wallet bounce handlers, verify escrow/wallet balance restoration and vesting-counter rollback, and separately reject a forged callback sender. The custom callback uses a pinned explicit opcode. These are Sandbox-simulated bounce envelopes, not proof of naturally induced downstream TVM failures; natural end-to-end failure injection remains a separate release gate.
- TEP-74 source-level review notes are recorded in `docs/TEP74_CONFORMANCE_REVIEW.md`. This is not an independent audit or full certification.
- `@tact-lang/compiler@1.6.13` still emits a deprecation warning. The current compiler builds; a Tolk migration must not be attempted without equivalent tests and code-hash review.

## Fixed supply and allocation policy

- Maximum supply: 10,000,000,000 VCOIN.
- Decimals: 6.
- Maximum base units: 10000000000000000.
- Additional minting: disabled after one exact initial issuance.
- Founder: 2,000,000,000 VCOIN (20%; four-year daily-linear vesting source and dedicated Sandbox tests are present; downstream bounce recovery remains a hard blocker).
- Mining reserve: 5,000,000,000 VCOIN (50%; mining remains disabled until Telegram bot integration).
- Treasury: 1,000,000,000 VCOIN (10%).
- Liquidity / market: 1,000,000,000 VCOIN (10%).
- Ecosystem / marketing: 1,000,000,000 VCOIN (10%).
- Allocation totals equal the fixed cap. The contract mints the full amount once to the founder wallet; four subsequent founder-signed transfers distribute the other allocations. Separate on-chain per-category caps are not implemented.

## Latest founder-vesting CI evidence

- GitHub Actions run #191 passed the build, all 25 Sandbox/policy tests, `npm ci` and the npm audit gate with zero known vulnerabilities: https://github.com/vahidnemati3544-opsking/v-coin-TON/actions/runs/44837612965
- Founder vesting tests cover exact funding, start-clock behavior, forged notification rejection, one-time wallet configuration, daily linear accrual, no release before day one, full release at day 1,460, prevention of duplicate claims, authenticated downstream-bounce callback rollback, and forged-callback rejection.
- Run #191 passed on the vesting implementation/test commit. Later documentation-only commits have their own CI runs; check the current PR head before any release decision.
- The vesting contract remains undeployed and unfunded. The escrow wallet address must be configured after deployment using the master getter. Independent audit and complete reproducible Sandbox verification remain mandatory; Testnet deployment is intentionally omitted by owner direction.

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
- The vesting contract has not been deployed or funded. The approved schedule is implemented in source; downstream bounce accounting now has an authenticated owner callback and dedicated callback tests. The natural downstream-bounce end-to-end test, CI on the final head, code review and independent audit remain mandatory.

## Remaining release blockers

1. **Bounce and recovery tests:** the source Jetton wallet now notifies its owner after restoring tokens on a bounced internal transfer; founder vesting authenticates this callback and rolls back `released`. Sandbox tests exercise simulated bounced internal-transfer and burn-notification envelopes. Still required: naturally induced end-to-end downstream/burn bounce tests and complete supply/balance invariants.
2. **Replay/idempotency:** complete adversarial review and tests; distinguish TON message replay protection from application-level duplicate transaction handling.
3. **Full TEP-74 / TEP-64 review:** complete comparison of every message bit layout, getter stack order, wallet behavior, gas assumptions, metadata serialization and wallet derivation against the active standards and official reference implementation.
4. **Founder vesting recovery:** the four-year daily-linear vesting source, authenticated Jetton-wallet owner callback, and callback Sandbox tests exist. Do not deploy or fund it until the natural downstream bounce path and balance/counter invariants pass end-to-end tests and the exact code is independently reviewed; preserve the approved zero-cliff schedule and founder beneficiary.
5. **Wallet ownership:** prove control of all five destination wallets on the intended network.
6. **Independent security review:** obtain a third-party smart-contract audit and record the exact reviewed source/compiler/build hashes.
7. **Deployment workflow:** add a deterministic deploy/transaction builder that encodes the TEP-64 URI, records StateInit/code hashes and prepares exact wallet-signable transactions without custody of private keys.
8. **Testnet:** intentionally omitted by owner direction. Do not deploy to Testnet; replace this gate with reproducible build evidence, adversarial Sandbox tests, independent audit and explicit founder approval. If a critical property cannot be verified without live Testnet, stop for owner decision.
9. **Mainnet:** only after all non-Testnet gates and independent review, prepare exact reviewed build hashes, network, master deployment payload, recipient addresses, amounts, fees and transfer payloads for founder inspection and signature.

## Evidence status

| Evidence | Status |
|---|---|
| Fixed supply and allocation arithmetic | Passed |
| Contract build | Passed in current-head CI #214 |
| 27 Sandbox/policy/vesting tests | Passed in current-head CI #214 |
| `npm ci` | Passed in current-head CI #214 |
| npm audit | 0 vulnerabilities in current-head CI #214 |
| TEP-74 required response-destination correction | Implemented; build and tests passed |
| TEP-89 optional owner-address behavior | Implemented and tested |
| Committed package lockfile | Committed and verified by subsequent `npm ci` runs #175–#177 |
| Simulated transfer/burn bounce recovery and forged-callback Sandbox tests | Added; latest-head CI pending |
| Natural downstream TVM bounce and balance invariants | Pending |
| Full TEP-74 / TEP-64 conformance audit | Pending |
| Metadata URI/content draft | Committed; logo approval pending |
| Four-year founder vesting source and schedule | Implemented; downstream bounce recovery blocks release |
| Recipient wallet-control proofs | Pending |
| Independent smart-contract audit | Pending |
| Deployment transaction builder | Pending |
| Testnet deployment | Intentionally omitted by owner direction |
| Mainnet master / deployment transaction | None |
| Initial mint transaction | None |
| Mainnet allocation transfers | None |

## Custody and safety

The founder remains the sole operational signer for distributions from the five founder-controlled wallets. No backend role or database flag can authorize token movement. Never request or store a recovery phrase or private key. A confirmed TON transfer to an independently controlled address cannot be reversed.

This inventory records source, test and release evidence. It does not claim VCOIN has been deployed, minted or transferred.


## Current decision and Acton/Tolk Mainnet readiness review — 2026-11-21

This section supersedes earlier readiness statements where they conflict with the newer Acton/Tolk implementation review.

### Owner's deployment direction

- The owner has directed the project to proceed toward **TON Mainnet** without a Testnet deployment stage. This preference does not waive build reproducibility, adversarial Sandbox testing, independent audit, wallet-control proofs, or explicit transaction approval.
- This is a deployment preference, not evidence of production safety and not a waiver of code correctness, adversarial testing, independent review, or explicit transaction approval.
- No Testnet or Mainnet transaction has been broadcast. No VCOIN Jetton Master is deployed; no VCOIN has been minted or transferred.

### Current candidate implementation

- Candidate: Draft PR #4, branch `security/acton-tolk-jetton-remediation-v2`.
- Reviewed head: `9ee140fe7ea2894e48d63f9b790701e1d1d3e6bf`.
- PR: https://github.com/vahidnemati3544-opsking/v-coin-TON/pull/4
- PR description reports Acton build, wrapper generation, static checks, formatting, local emulated deployment, and 89 emulator tests passing; CI runs: https://github.com/vahidnemati3544-opsking/v-coin-TON/actions/runs/44736561687 and https://github.com/vahidnemati3544-opsking/v-coin-TON/actions/runs/44736561797.
- **Evidence discrepancy to resolve:** `contracts/acton/README.md` at the reviewed branch still says 87 tests, while the PR description says 89. The exact current test inventory and count must be reconciled before release.
- PR #4 is Draft, open, unmerged, and must not be treated as approved production code.

### Allocation behavior that must be understood before signing

The Acton/Tolk candidate does **not** credit all five ordinary owner wallets directly:

| Allocation | Amount | Candidate destination |
|---|---:|---|
| Founder | 2,000,000,000 VCOIN | Deterministic Founder vesting escrow; beneficiary remains the Founder wallet |
| Mining reserve | 5,000,000,000 VCOIN | Deterministic Mining vesting escrow; beneficiary remains the Mining Reserve wallet |
| Treasury | 1,000,000,000 VCOIN | Treasury Jetton wallet |
| Liquidity / market | 1,000,000,000 VCOIN | Liquidity owner Jetton wallet |
| Ecosystem / marketing | 1,000,000,000 VCOIN | Ecosystem owner Jetton wallet |

The Founder schedule is four-year linear vesting; the Mining reserve schedule is 730-day linear vesting. The escrow addresses are deterministic but are not yet deployed or independently verified. This preserves the approved vesting intent; it means the Founder and Mining amounts are escrow-held rather than immediately spendable in their ordinary owner wallets.

### Mandatory blockers before any Mainnet broadcast

1. Add and verify a reliable **Mainnet network identity guard** in the deployment workflow. The current script checks the payer allowlist in broadcast mode but does not prove that the selected network is Mainnet.
2. Complete the outstanding natural downstream TVM bounce test and adversarial tests for replayed/forged acknowledgements, amount mismatch, pending-state cleanup, and balance/query-ID invariants.
3. Reconcile the 87-versus-89 test evidence and rerun CI on the exact final source commit.
4. Obtain an independent smart-contract security audit against pinned source, compiler/toolchain, generated code, and code hashes.
5. Confirm final metadata (including canonical logo decision), exact escrow start timestamp, derived escrow addresses, TON fee budget, and wallet-control proof for all five owner wallets on Mainnet.
6. Produce a deterministic, reviewable deployment and issuance transaction package. Verify every recipient, allocation amount, destination (including both escrows), network, and code hash before the Founder signs.
7. Obtain the Founder's explicit approval and signature for each irreversible Mainnet transaction. No private key or recovery phrase is to be shared.

### Current release status

| Gate | Status |
|---|---|
| Candidate Acton/Tolk implementation | Draft PR #4; not merged |
| CI build and emulator suite | Reported passed; test-count documentation mismatch remains |
| Mainnet network guard | Missing |
| Natural downstream bounce test and remaining adversarial cases | Pending |
| Independent smart-contract audit | Pending |
| Mainnet wallet-control proofs | Pending |
| Final metadata, escrow start time, gas budget | Pending |
| Mainnet deployment | Not performed |
| Initial 10B issuance | Not performed |
| Five-allocation distribution | Not performed |

**Release decision: HOLD — do not merge or broadcast yet.** The owner-directed Testnet omission is recorded, but it does not remove the other mandatory safety gates. The first irreversible on-chain action remains deployment of the reviewed VCOIN Master; allocation minting and transfers can only follow after its address and state are verified.
