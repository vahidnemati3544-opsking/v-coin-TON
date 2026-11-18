# V COIN–TON — Mining Readiness Plan
**Document ID:** VCT-MINING-READY-001  
**Revision:** 1.0.0  
**Updated:** 2026-11-18  
**Scope:** Existing V COIN–TON repository only. The legacy BNB Smart Chain project is explicitly out of scope.

## Release boundary
The target is a controlled local/test mining run using the owner's own Telegram account. This is not authorization for public launch, TON Mainnet deployment, token issuance, wallet transfers, or claims of market value. Internal database credits are not on-chain Jettons.

## Approved reward rule
- Levels are numbered 1–400.
- Every level uses the same reward rule: 1% of eligible available internal VCOIN balance per 24 hours.
- With six decimals, calculations use integer base units: reward = floor(snapshot_balance_base_units × elapsed_ms / 8,640,000,000).
- Reserved balances are excluded. Eligible balance is snapshotted at session start and reset after a successful claim.
- Level is a progression attribute only; it must not multiply or reduce this reward formula.
- Mining reserve is capped at 5,000,000,000 VCOIN.
- Reward posting is an internal ledger credit, not a TON wallet transfer.

## Numbered execution register
Status values: **DONE** = implemented in repository; **PENDING** = not yet verified or completed; **BLOCKED** = depends on a prerequisite or owner decision. A code commit is not the same as a passing test.

| No. | File / area | Required action and acceptance evidence | Status | Next action |
|---:|---|---|---|---|
| 1 | Repository boundary | Work only in this TON repository; do not touch BNB | DONE | Maintain boundary |
| 2 | contracts/mining/engine.js | Integer-only balance accrual, session snapshot, reserve and ledger settlement | DONE — code present | Run unit + PostgreSQL tests |
| 3 | contracts/mining/backend/src/routes/mining.js | Authenticated status/start/claim/end endpoints; level validation 1–400 | DONE — code present | Exercise HTTP flows end-to-end |
| 4 | contracts/mining/backend/database/schema.sql | Users, levels, sessions, rewards, balances, ledger and wallet records | DONE — base schema present | Verify fresh database migration |
| 5 | Migration 001 | Enforce 5B VCOIN reserve ceiling | DONE — migration present | Test exhaustion and rollback |
| 6 | Migration 002 | Atomically post balanced internal ledger credits | DONE — migration present | Reconcile ledger and balance |
| 7 | Migration 003 | Add eligible-balance session snapshot | DONE — migration present | Apply locally; verify active-session backfill |
| 8 | contracts/mining/backend/scripts/setup-database.js | Ordered schema/migrations with checksum tracking | DONE — code present | Run against intended local DB after backup/confirmation |
| 9 | contracts/mining/backend/test/mining-engine.test.js | Cover integer arithmetic, boundaries and identical rule at all 400 levels | PENDING | Expand unit coverage and run |
| 10 | contracts/mining/backend/test/mining-ledger.integration.test.js | Test start, claim, end, idempotency, concurrency, reserve exhaustion, rollback and ledger balance on PostgreSQL 18 | BLOCKED | Apply migration 003 in fixtures; seed eligible balance; run isolated test DB |
| 11 | .github/workflows/ton-mining-ci.yml | Run syntax checks, unit tests and PostgreSQL 18 integration tests | PENDING | Add after fixtures are reliable |
| 12 | Telegram authentication | Verify Mini App HMAC, expiry, session creation/revocation and auth-required mining routes | DONE — core code present | Run auth-to-mining HTTP integration test |
| 13 | Telegram bot / Mini App | Configure webhook or Mini App entry, private bot token and user start flow | BLOCKED | Configure secret privately and test with owner's account |
| 14 | User/account initialization | Create owner test account, level, balance row and audit trail through safe onboarding | PENDING | Implement/test without granting unbacked tokens |
| 15 | 400-level schedule | Seed exactly 400 levels; keep mining formula invariant; define upgrade costs/perks separately | BLOCKED | Owner approval of costs/benefits; do not invent economics |
| 16 | Balance eligibility | Define purchased/earned/locked balance eligibility; prevent double counting and unintended compounding | BLOCKED | Confirm accounting policy, then encode/test |
| 17 | Anti-fraud | Test replay, multiple sessions, concurrency, rate limits, suspended accounts and reserve cap | PENDING | Add abuse and concurrency tests |
| 18 | Observability / recovery | Audit events, health checks, backup/restore rehearsal and reconciliation report | PENDING | Verify restore and ledger-to-balance reconciliation |
| 19 | Wallet boundary | Keep Tonkeeper/Gram Wallet keys outside backend; verify address/network only when linking is implemented | PENDING | Wallet ownership proof and TON Testnet verification |
| 20 | Controlled extraction rehearsal | Use isolated local/test DB and owner's Telegram account; compare reward, ledger and API status | BLOCKED | All prior technical gates must pass |
| 21 | Go/no-go | Review tests, security findings, reserve, backup and owner approval | BLOCKED | Explicit owner approval; no automatic production activation |

## Mandatory acceptance gates before first test claim
1. npm run check passes.
2. npm test passes with PostgreSQL integration tests not skipped against an isolated PostgreSQL 18 test database.
3. Migration runner reports versions 000–003 applied and checksums unchanged.
4. Deterministic tests cover levels 1, 2, 100, 200, 399 and 400, plus all 400 levels proving formula invariance.
5. Integration tests prove one active session, idempotent claims, no duplicate credits, safe concurrency, reserve-exhaustion rollback and exact debit/credit equality.
6. Eligible balance source and treatment of purchased, mined and reserved balances are approved and tested.
7. Telegram authentication is tested end-to-end; username-only or client-supplied user IDs are never trusted.
8. Local DB is backed up before migration; target database and role are verified.
9. No wallet seed phrase or private key is requested, stored or sent to the backend.
10. Owner reviews evidence and explicitly authorizes the controlled test claim.

## Known implementation risks to resolve
- Current PostgreSQL engine integration fixture does not apply migration 003 and does not seed a positive eligible VCOIN balance before starting a session; it cannot yet prove the new snapshot flow.
- Each claim is credited to available balance and that post-claim balance becomes the next interval snapshot. This compounds daily. Owner must explicitly approve whether mined rewards qualify for the next interval.
- Maximum claim interval is currently 24 hours. A longer gap is rejected; choose a safe claim/scheduler policy before unattended operation.
- Schema creates levels but does not seed all 400 rows or approved upgrade economics.
- Backend README says routes remain disabled, while current server mounts authenticated mining routes. Documentation/runtime must be aligned.
- JavaScript-only tests are insufficient; PostgreSQL integration tests must run, not skip.

## Local operator actions (only when requested and ready)
- Confirm local database name and role.
- Keep credentials in ignored local .env; never paste passwords or bot tokens into chat or GitHub.
- Back up local DB before migrations.
- Run documented checks from contracts/mining/backend.
- Text output is sufficient; screenshots are not required.

## Release decision
Until every mandatory gate is evidenced as passed, status remains **NOT READY FOR EXTRACTION TEST**. Passing this plan does not imply Mainnet readiness.
## Change log
- 2026-11-18: Created the numbered readiness register and explicit go/no-go gates.
- 2026-11-18: Added a unit-test case iterating through levels 1–400 to prove the daily reward formula is level-invariant, plus elapsed-time/input boundary tests. Commit: 32c6c9edc39e21354c1fe0832e35e9af39f8694e. Tests have **not yet been executed**.
- 2026-11-18: Corrected the backend README so it accurately states that authenticated mining routes are mounted, while readiness remains blocked. Commit: 183afc3bc5ac03e78c625518db64d932d8842535.
- 2026-11-18: Readiness plan committed. Commit: 8b6c5e552534583dac80e5ea2d1349168acefc94.
## Follow-up implementation checkpoint — 2026-11-18
- Updated `contracts/mining/backend/test/mining-ledger.integration.test.js` so all three PostgreSQL integration fixtures apply migration 003. The engine lifecycle fixture now seeds 10,000 VCOIN as eligible balance and expects the resulting balance to include the original balance plus the mined reward. Commit: `2d7e1950a224cf42f8205f57b2b218154c6f36a9`.
- Added `.github/workflows/ton-mining-ci.yml` to run Node.js 22 syntax checks, unit tests, and PostgreSQL 18 integration tests on relevant pushes, pull requests, and manual dispatch. Commit: `831eb26a7785cbbc3895a26c7a7090e9a4ed2556`.
- Fixed duplicate start-session responses to include the stored eligible-balance snapshot. Commit: `a746ebc7eb305c120b37a24c79138b3579e683ab`.
- These changes are committed but have **not yet been executed** in GitHub Actions or against the owner's local PostgreSQL database. Do not mark test gates complete until CI reports success and local migration status is verified.
- Remaining owner policy decision: should mined rewards be included in the eligible balance for the next interval (daily compounding), or should only purchased/referral/other qualifying credits count? Current engine snapshot includes post-claim available balance, so it compounds.


## Owner-approved wallet-balance rule — supersedes earlier internal-balance policy (2026-11-18)

The owner has explicitly confirmed that the **verified on-chain VCOIN Jetton balance in the user's linked Telegram TON wallet** is the source of truth for the next mining reward. The internal bot/database mining balance is not the next-period reward basis. The 1% per 24-hour rule remains identical across levels 1–400.

The authoritative lifecycle and security requirements are specified in `docs/WALLET_BALANCE_MINING_SPEC.md`. This decision supersedes earlier statements in this plan and prior mining documentation that described the internal available balance as the eligible balance or allowed daily compounding of internal rewards.

### Mandatory implementation correction

The current engine and API still read `balances.available_base_units`, post each reward back into that internal balance, and reset the next session snapshot from the post-settlement internal balance. They do not verify wallet ownership, read a VCOIN Jetton balance on TON, transfer Jettons, or confirm payouts on-chain. This is a material business-rule mismatch, not a documentation-only issue.

Accordingly:
- Existing internal-balance mining must remain disabled for owner extraction.
- Replace the internal balance source with a fresh, verified wallet Jetton-balance snapshot.
- Keep earned rewards in a separate pending/withdrawable internal ledger until a controlled Jetton payout is confirmed.
- Only after on-chain payout confirmation may a new wallet-balance snapshot become the next mining basis.
- Never count a pending internal reward and the same on-chain reward simultaneously.
- Fail closed on stale provider data, invalid ownership proof, wrong Jetton master/network, bounced or unconfirmed payout, reserve exhaustion, or ledger mismatch.
- Do not guess the VCOIN Jetton master address, TON data provider, or payout signing architecture.

### Revised readiness status

**NOT READY FOR EXTRACTION TEST.** Wallet ownership proof, Jetton master/network configuration, on-chain balance reader, wallet-snapshot persistence, payout state machine, transaction reconciliation, and their PostgreSQL/TON Testnet tests are all pending. CI execution has not yet been evidenced. The owner’s local PostgreSQL migration status is also unverified.

The earlier checklist item 16 (balance eligibility) is now defined by the wallet-balance specification, but implementation and tests remain pending. Checklist items 19–20 remain blocked until the wallet and payout gates pass.

### Audit findings from 2026-11-18

1. `contracts/mining/engine.js`: reward accrual reads internal `balances.available_base_units`; after settlement it stores the post-settlement internal balance as the next snapshot. This violates the newly approved wallet-balance source.
2. `contracts/mining/backend/src/routes/mining.js`: `GET /status` estimates daily/hourly reward from internal available balance and does not expose verified wallet-balance provenance.
3. `contracts/mining/backend/database/schema.sql`: wallet tables exist, but schema alone does not prove wallet ownership or a verified Jetton balance; blockchain transaction tables are not a payout state machine.
4. `contracts/mining/backend/test/mining-engine.test.js`: current tests exercise arithmetic only; the 1–400 loop calls a level-agnostic function without actually passing or validating a level input.
5. `contracts/mining/backend/test/mining-ledger.integration.test.js`: fixtures cover reserve/ledger and a local internal-balance mining lifecycle, not TON wallet balance, ownership proof, Jetton payout, bounced transfers, or on-chain reconciliation.
6. `.github/workflows/ton-mining-ci.yml`: workflow exists, but no successful run evidence was returned for the latest recorded commit at audit time.
7. Local PostgreSQL 18 migration execution and migration checksum status have not been verified in the owner's environment.

No item is marked tested or production-ready based only on source presence or commit history.
