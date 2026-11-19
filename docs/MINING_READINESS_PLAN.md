# V COIN–TON — Mining Readiness Plan

**Document ID:** VCT-MINING-READY-001  
**Revision:** 1.2.0  
**Updated:** 2026-11-20  
**Scope:** This repository only. The legacy BNB Smart Chain project is out of scope.

## Release decision

**NO-GO — extraction must remain disabled.** The public mining API is intentionally fail-closed with HTTP 503 until the wallet-balance implementation is complete and tested. This is a safety control, not a completed extraction feature.

The first rehearsal target remains the owner's own Telegram account on TON Testnet. This does not authorize Mainnet deployment, public launch, token issuance, or real-value transfers.

## Binding reward policy

- The source of truth for the next mining interval is the user's verified on-chain VCOIN Jetton balance in the linked TON wallet.
- Internal PostgreSQL balances, displayed bot balances, and pending/unconfirmed rewards are never eligible wallet holdings.
- Rate: exactly 1% per 24 hours at every level 1–400; level does not change the rate.
- Precision: 6 decimals. All calculations use integer Jetton base units.
- For one immutable, verified wallet snapshot: `reward_base_units = floor(wallet_snapshot_base_units * elapsed_ms / 8,640,000,000)`.
- After a payout is confirmed on-chain, obtain a fresh wallet snapshot for the next interval. Never count a reward both as pending internal credit and as wallet holdings.
- The 5,000,000,000 VCOIN mining allocation is a hard maximum reserve, not permission to mint.
- The existing 24-hour maximum claim interval remains unchanged until its missed-claim policy is explicitly decided and tested.

## Numbered execution register

Status is based on repository evidence, not on the existence of documentation or a commit alone.

| No. | File / area | Required action and acceptance evidence | Status | Next action |
|---:|---|---|---|---|
| 1 | Repository boundary | Work only in V-Coin-TON | DONE | Maintain boundary |
| 2 | `contracts/mining/engine.js` | Replace internal-balance eligibility with immutable verified wallet snapshots | BLOCKED | Implement after master/network/provider are approved |
| 3 | `contracts/mining/backend/src/routes/mining.js` | Expose only wallet-policy-compliant status/start/claim/end routes | BLOCKED | Keep public API disabled; add wallet routes after implementation |
| 4 | PostgreSQL schema | Store wallet links, proof status, network/master, snapshots and payout lifecycle | PENDING | Design migrations without treating internal balance as wallet balance |
| 5 | Mining reserve migration | Preserve 5B cap with atomic reservation/release | CODE PRESENT; TEST PENDING | Verify rollback and exhaustion on PostgreSQL 18 |
| 6 | Ledger settlement | Separate pending reward from on-chain confirmed payout | BLOCKED | Implement payout-aware double-entry lifecycle |
| 7 | Migration 003 | Existing migration snapshots internal balances, not wallet balances | NOT COMPLIANT | Replace/retire only through a reviewed migration |
| 8 | Database setup | Verify ordered migrations and checksums on isolated PostgreSQL 18 | PENDING | Run against dedicated test DB after backup |
| 9 | Reward arithmetic | Test exact integer formula and levels 1, 2, 100, 200, 399, 400 | PARTIAL | Add wallet-snapshot unit tests and execute suite |
| 10 | PostgreSQL integration | Prove concurrency, idempotency, reserve rollback and ledger reconciliation | PENDING | Run against isolated PostgreSQL 18; do not count skipped tests |
| 11 | GitHub Actions | Verify a successful PostgreSQL 18 CI run | NOT VERIFIED | Inspect actual workflow run and logs |
| 12 | Telegram authentication | Verify Mini App HMAC and revocable sessions | CODE PRESENT; TEST PENDING | Run integration suite |
| 13 | Telegram bot / Mini App | Verify configured bot and owner's real login flow | PENDING | Configure secrets privately and test |
| 14 | User account setup | Create owner test account with auditable onboarding | PENDING | Implement after wallet-link flow |
| 15 | 400-level schedule | Seed and verify all 400 levels; keep rate invariant | PENDING | Define upgrade economics separately; do not invent costs |
| 16 | Wallet ownership | Prove wallet control using TON Connect proof/signature | BLOCKED | Implement and test proof, expiry and revocation |
| 17 | TON Jetton identity | Confirm VCOIN master address and network from owner-controlled deployment evidence | BLOCKED | Do not guess or use another token's address |
| 18 | Chain data | Read fresh verified balance and validate owner/master/network/source context | BLOCKED | Select trusted provider and implement fail-closed reader |
| 19 | Payout | Send Jettons and reconcile transaction, finality, bounce and retries | BLOCKED | Approve sender/signing custody architecture; never collect seed phrases |
| 20 | Controlled rehearsal | Use owner's Telegram account and TON Testnet; compare chain snapshot, reward and ledger | BLOCKED | All preceding technical gates must pass |
| 21 | Go / No-Go | Review evidence, security, reserve, backup and owner approval | BLOCKED | Explicit owner approval after evidence review |

## Mandatory gates before first controlled claim

1. The official VCOIN Jetton master address and target network are independently verified.
2. TON wallet ownership proof is verified; a pasted address or Telegram username is insufficient.
3. Balance reader validates the expected master, owner, network, decimals, freshness and chain context.
4. The mining engine uses only immutable verified wallet snapshots; there is no fallback to PostgreSQL internal balances.
5. Pending rewards and confirmed on-chain holdings are distinct; payout is idempotent and reconciled after finality.
6. Bounced, stale, ambiguous, replayed, mismatched or unavailable chain data fails closed.
7. `npm run check` passes and `npm test` passes, including PostgreSQL integration tests against an isolated PostgreSQL 18 database (not skipped).
8. All 400 levels are proven to use the same 1%/24h formula.
9. Reserve exhaustion, rollback, concurrency, double-counting and payout replay tests pass.
10. The owner's local database and Telegram/Testnet flow are verified; no seed phrase or private key is collected.
11. Owner reviews evidence and explicitly authorizes the controlled Testnet rehearsal.

## Known discrepancies and restrictions

- The current engine still reads `balances.available_base_units` and credits internal balances. It is not compliant with the binding wallet-balance policy.
- The public mining API in `contracts/mining/backend/src/server.js` is intentionally blocked with `WALLET_BALANCE_MINING_NOT_IMPLEMENTED` (HTTP 503).
- Existing internal-balance tests do not prove TON wallet ownership, Jetton balance reading, or real payouts.
- The repository evidence reviewed so far does not establish a deployed VCOIN Jetton master address or a completed Jetton deployment. See `docs/JETTON_DEPLOYMENT_INVENTORY.md`.
- The 24-hour hard claim limit is not changed by this plan.
- Mainnet, real-value payouts and public extraction remain disabled pending separate approval and independent security review.

## 2026-11-20 repository execution update

- The public mining API remains fail-closed (HTTP 503); no mining or payout route was enabled.
- `docs/GENESIS_ISSUANCE_DESIGN.md` now specifies the one-time, five-slot fixed-supply genesis pattern. This is a design only; the VCOIN-specific Master, genesis coordinator, and founder vesting contracts are not yet implemented.
- `docs/API_ARCHITECTURE.md` now accurately distinguishes implemented Telegram authentication from the disabled public mining API and unimplemented wallet/payout routes.
- The local PostgreSQL setup runner now includes migrations 004 and 005 in order; the PostgreSQL integration setup also applies both migrations.
- Migration 005 changes the modelled reference-price series to 52 weekly compounding periods using a fixed-point weekly multiplier of 1.007827884862, approximately 50% annual compounded growth. Existing historical candles are preserved. This remains a modelled reference series, not a market price or return promise.
- GitHub Actions on commit `06f97ab71d239c9234523d8ee953f7d8329d9fed`: Backend CI passed (PostgreSQL 18 migration setup, idempotent setup replay, integration tests); Mining CI passed (unit/integration tests); TON Acton CI passed (pinned upstream reference build, protocol baseline tests, static checks and formatting). These checks validate the backend and upstream reference baseline only—not a final VCOIN contract or live mining.
- The owner’s local PostgreSQL 18 instance, Telegram bot, TON Connect wallet proof, trusted Jetton balance provider, deployed VCOIN Master, and on-chain payout path have not been verified by this repository audit.

## 2026-11-20 implementation checkpoint — fixed-supply preparation

- Added `contracts/jetton/acton/contracts/vcoin-genesis-config.tolk` with the approved six-decimal supply cap and five exact base-unit allocation constants. This is a shared compile-time specification/test module only; it does not issue tokens and is not a deployed Master.
- Added `contracts/jetton/acton/tests/vcoin-genesis-invariants.test.tolk` covering the exact 10^16 base-unit allocation sum, all five allocation buckets, six decimals, and 48-tranche integer arithmetic.
- Added `contracts/jetton/acton/contracts/vcoin-vesting-calendar.tolk` with UTC calendar-month due-date calculations. Emulator tests cover Jan 31 to leap-day February, restoration to March 31, non-leap February clamping, March 31 to April 30, and preservation of UTC time of day.
- Acton CI on commit `ae766fd47ace6d09985013eebc85a79ec21718bb` passed: reproducible build, wrapper generation, static checks, formatting, five upstream protocol tests and nine VCOIN arithmetic/calendar tests (14 total).
- Backend CI and Mining CI on commit `a84e728921e4c85edac5168fd3c31fc6c8243355` both passed. Those workflows were not changed by the calendar-only source additions.
- The VCOIN-specific fixed-supply Master, genesis coordinator, acknowledgement-enabled Jetton Wallet, and on-chain founder vesting contract are still not implemented. The vendored reference Master still contains privileged mint/admin/metadata/upgrade functions and remains non-deployable for VCOIN.
- The public mining API remains fail-closed (HTTP 503); no extraction, reward payout, purchase settlement, Testnet deployment, Mainnet deployment, or real token transfer was activated.
- The founder allocation recipient must be the separately deployed vesting contract address, not the founder beneficiary wallet. The vesting contract address must be derived only after its reviewed code and initial state are finalized.
- Laptop-only work remains for the final stage: verify the owner's local PostgreSQL, configure the private environment, complete Telegram/TON Connect wallet proof and perform the controlled Testnet rehearsal after all contract gates pass.
