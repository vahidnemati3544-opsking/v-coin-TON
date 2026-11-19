# V COIN–TON — Mining Readiness Plan

**Document ID:** VCT-MINING-READY-001  
**Revision:** 1.3.0  
**Updated:** 2026-11-20  
**Scope:** This repository only. The legacy BNB Smart Chain project is out of scope.

## Release decision

<badge color="warning">NO-GO — mining and payouts remain OFF</badge>

The VCOIN-specific Jetton Master, Wallet, genesis coordinator and founder vesting contract have now been implemented and emulator-tested. This is meaningful progress, but it does not establish a deployed Jetton Master, wallet ownership proof, a trusted live balance reader, or a real payout path.

The public mining API remains intentionally fail-closed with HTTP 503 until the wallet-balance implementation is complete and tested. This is a safety control, not a completed extraction feature.

**The user's instruction is binding:** complete all preparation, implementation, documentation and testing that can be done remotely. Do not activate mining, reward claims, purchase settlement, token issuance, or payouts. Any laptop-only configuration and live Testnet actions are deferred to the final stage. No Mainnet deployment or real-value transfer is authorized.

## Binding reward policy

- The source of truth for each mining interval is the user's verified on-chain VCOIN Jetton balance in the linked TON wallet.
- Internal PostgreSQL balances, displayed bot balances, and pending/unconfirmed rewards are never eligible wallet holdings.
- Rate: exactly 1% per 24 hours at every level 1–400; level does not change the rate.
- Precision: 6 decimals. All calculations use integer Jetton base units.
- For one immutable, verified wallet snapshot: `reward_base_units = floor(wallet_snapshot_base_units * elapsed_ms / 8,640,000,000)`.
- After a payout is confirmed on-chain, obtain a fresh wallet snapshot for the next interval. Never count a reward both as pending internal credit and as wallet holdings.
- The 5,000,000,000 VCOIN mining allocation is a hard maximum reserve, not permission to mint.
- The existing 24-hour maximum claim interval remains unchanged until its missed-claim policy is explicitly decided and tested.

## Implemented contract checkpoint

The following source files now exist on branch `feature/vcoin-ton-launch-rules`:

- `contracts/jetton/acton/contracts/VcoinJettonMinter.tolk` — fixed 10^16 base-unit cap, five immutable allocation slots, authenticated coordinator, acknowledgement-gated supply accounting, separate cumulative genesis-issued counter, no admin mint/metadata mutation/code-upgrade path.
- `contracts/jetton/acton/contracts/VcoinJettonWallet.tolk` — TEP-74 transfer/burn behavior, one-time genesis credit marker, replay-safe genesis acknowledgement, transfer-failure notification and bounded native TON reserve.
- `contracts/jetton/acton/contracts/VcoinGenesisCoordinator.tolk` — narrowly scoped five-slot dispatcher; no arbitrary recipient or amount input.
- `contracts/jetton/acton/contracts/VcoinFounderVesting.tolk` — fixed beneficiary, authenticated Master wallet discovery, activation-controller-only start, 48 UTC calendar-month tranches, receipt-confirmed releases and bounce recovery.
- `contracts/jetton/acton/tests/` — genesis arithmetic, Master/coordinator, wallet replay, burn and founder vesting emulator tests.

**Latest verified CI checkpoint:** commit `72400c0963147df1db8ab3c00a42940976520beb`.

- TON Acton CI: build passed; typed wrappers generated; 19 tests passed across 5 test files; static checks passed; formatting passed.
- Backend CI: passed, including PostgreSQL 18 migration setup and integration checks.
- Mining CI: passed, including unit/integration checks.

These are source/build/emulator/CI results only. The contracts are not deployed, have not undergone independent security audit, and have not moved real tokens. Additional adversarial tests remain before Testnet.

## Numbered execution register

Status is based on repository evidence, not on the existence of documentation or a commit alone.

| No. | File / area | Required action and acceptance evidence | Status | Next action |
|---:|---|---|---|---|
| 1 | Repository boundary | Work only in V-Coin-TON; never alter legacy BNB project | DONE | Maintain boundary |
| 2 | VCOIN Master | Fixed supply, five immutable slots, no privileged mint or upgrade path | IMPLEMENTED; 19 CI tests pass | Adversarial review and independent audit |
| 3 | VCOIN Jetton Wallet | TEP-74 transfer/burn, genesis acknowledgement and replay protection | IMPLEMENTED; emulator tests pass | Add conflicting replay and bounced-credit cases |
| 4 | Genesis coordinator | Only dispatch the five fixed allocation slots | IMPLEMENTED; end-to-end test passes | Independent review |
| 5 | Founder vesting | 2B VCOIN, 48 monthly UTC calendar tranches, activation-controlled start | IMPLEMENTED; end-to-end emulator test passes | Independent review and Testnet rehearsal |
| 6 | Contract tests | Supply/allocation invariants, genesis, wallet replay, burn, vesting and calendar tests | DONE: 19 passed | Add remaining adversarial cases |
| 7 | TON toolchain | Pinned Acton 1.2.1 build, wrapper generation, static checks and format | DONE: latest CI green | Keep pinned |
| 8 | Contract security review | Independent review of Master, Wallet, coordinator, vesting and bounce/retry flows | PENDING | Obtain independent audit before Testnet |
| 9 | Deployment tooling | Reproducible state-init builders, dry-run preview, artifact hashes and verification | PENDING | Implement scripts without secrets or live deployment |
| 10 | Private deployment manifest | Use owner-provided destinations privately; verify control and network | PENDING | Generate locally only at final stage |
| 11 | Testnet deployment | Deploy reviewed contracts and verify getters/Jetton wallets on TON Testnet | PENDING | Only after audit and explicit exact-transaction approval |
| 12 | Mainnet identity | Verify canonical VCOIN Master address and network from deployment evidence | BLOCKED | No Master address exists until deployment |
| 13 | Wallet ownership proof | TON Connect proof/signature, expiry, replay protection and revocation | BLOCKED | Implement and test wallet-link lifecycle |
| 14 | Trusted balance reader | Read Jetton wallet data and validate Master, owner, network, freshness and decimals | BLOCKED | Implement a fail-closed on-chain getter provider |
| 15 | Wallet snapshot schema | Persist immutable verified snapshots and chain/source context | PENDING | Add reviewed PostgreSQL migration |
| 16 | Mining engine | Replace internal PostgreSQL balance eligibility with verified wallet snapshots | BLOCKED | Refactor only after provider and schema exist |
| 17 | Public mining routes | Status/start/claim/end must use wallet proof and confirmed chain state | BLOCKED | Keep public API HTTP 503 |
| 18 | Reserve accounting | Atomic 5B hard cap, reserve/release/rollback and exhaustion stop | CODE PRESENT; chain funding unverified | Integrate with on-chain reserve wallet/distributor |
| 19 | Payout signing | Secure reserve signer architecture; no seed phrases in chat or repo | BLOCKED | Design hardware/secure signer or wallet-mediated approval |
| 20 | Payout reconciliation | Send Jettons, track transaction finality, bounce/replay and idempotency | BLOCKED | Implement after signer architecture |
| 21 | Double-entry ledger | Distinguish pending rewards, submitted payouts and confirmed on-chain transfers | PARTIAL | Extend current internal ledger to chain settlement |
| 22 | PostgreSQL integration | Ordered migrations, concurrency, idempotency and ledger reconciliation | CI PASS on PostgreSQL 18 | Verify user's local DB only in final laptop stage |
| 23 | Telegram authentication | Mini App HMAC validation and revocable sessions | CODE PRESENT; CI PASS | Verify real bot login flow on laptop later |
| 24 | Telegram bot / Mini App | Configured bot, account linking and user onboarding | PENDING | Keep credentials private; do in final laptop stage |
| 25 | 400-level schedule | Seed/verify levels 1–400; same 1%/24h formula | FORMULA TESTED; level data/UI pending | Implement configuration without inventing upgrade prices |
| 26 | TON purchase settlement | Verify TON payment and pay VCOIN from funded reserve idempotently | PENDING | Implement only after chain identity and signer |
| 27 | Controlled Testnet rehearsal | Owner Telegram account, TON Testnet wallet, snapshot/reward/payout comparison | PENDING | Final laptop stage after all remote gates |
| 28 | Go / No-Go | Review audit, reserve, backups, evidence and exact transactions | PENDING | Separate explicit owner approval |
| 29 | Mining activation | Turn on public mining and extraction | **OFF — explicit owner command required** | Never activate automatically |
| 30 | Mainnet / real-value transfers | Deploy, issue or move real assets | **NOT AUTHORIZED** | Require independent review and separate exact approval |

## Mandatory gates before first controlled claim

1. The official VCOIN Jetton Master address and target network are independently verified.
2. TON wallet ownership proof is verified; a pasted address or Telegram username is insufficient.
3. The balance reader validates expected Master, owner, network, decimals, freshness and chain context.
4. The mining engine uses only immutable verified wallet snapshots; there is no fallback to PostgreSQL internal balances.
5. Pending rewards and confirmed on-chain holdings are distinct; payout is idempotent and reconciled after finality.
6. Bounced, stale, ambiguous, replayed, mismatched or unavailable chain data fails closed.
7. `npm run check` passes and `npm test` passes, including PostgreSQL integration tests against an isolated PostgreSQL 18 database (not skipped).
8. All 400 levels are proven to use the same 1%/24h formula.
9. Reserve exhaustion, rollback, concurrency, double-counting and payout replay tests pass.
10. The owner's local database and Telegram/Testnet flow are verified in the final laptop stage; no seed phrase or private key is collected.
11. Independent contract security review is complete.
12. The owner reviews evidence and explicitly authorizes the controlled Testnet rehearsal.

## Known discrepancies and restrictions

- The current backend mining engine still reads PostgreSQL `balances.available_base_units` and credits internal balances. It is not compliant with the binding wallet-balance policy.
- The public mining API in `contracts/mining/backend/src/server.js` is intentionally blocked with `WALLET_BALANCE_MINING_NOT_IMPLEMENTED` (HTTP 503).
- Existing internal-balance tests do not prove TON wallet ownership, Jetton balance reading, or real payouts.
- No VCOIN Jetton Master has been deployed; there is no canonical live Master address or live Jetton reserve wallet.
- The 24-hour hard claim limit is not changed by this plan.
- Mainnet, real-value payouts and public extraction remain disabled pending separate approval and independent security review.

## 2026-11-20 implementation checkpoint

- Implemented the VCOIN-specific fixed-supply Master, five-slot genesis coordinator, acknowledgement-enabled Jetton Wallet and founder vesting contract.
- The founder allocation is directed to the vesting contract address; the beneficiary wallet is stored privately in the vesting contract's initial state and resolved through the authenticated Master.
- The vesting clock remains unset until the activation controller sends the on-chain activation message. No activation message has been sent on a live network.
- Latest TON Acton CI commit `72400c0963147df1db8ab3c00a42940976520beb`: 19 tests passed, static checks passed, formatting passed.
- Backend CI and Mining CI passed on the same commit.
- The weekly reference-price model remains a modelled planning series, not a market price, guarantee or mining reward rate.
- The user's local PostgreSQL 18 instance, Telegram bot, TON Connect proof, Testnet wallet, live Master address, trusted Jetton balance provider, on-chain payout path and purchase settlement have not been verified or activated.
- Laptop-only actions are deliberately reserved for the final stage: local database verification, private environment configuration, Telegram login, TON Connect proof, and controlled Testnet transactions after remote code and security gates are complete.

**Final operating rule:** Continue all remote implementation and tests. Keep public mining HTTP 503, keep purchase settlement disabled, and do not deploy or transfer real assets without a separate explicit approval of the exact transaction. Mining/extraction starts only after the owner's explicit command.
