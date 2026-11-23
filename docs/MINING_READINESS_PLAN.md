# V COIN–TON — Mining Readiness Plan

**Document ID:** VCT-MINING-READY-001  
**Revision:** 1.2.0  
**Updated:** 2026-11-23  
**Scope:** This repository only. The legacy BNB Smart Chain project is out of scope.

## Release decision

**NO-GO — public extraction must remain disabled.** The public mining API is intentionally fail-closed with HTTP 503 until the wallet-balance implementation is complete and tested. This is a safety control, not a completed extraction feature.

The approved execution policy is Mainnet-only. No TON Testnet deployment or Testnet transaction is authorized. Local TON Sandbox simulations and isolated integration tests are the permitted rehearsal environment. Mainnet mining remains disabled until the release gates pass.

## Binding reward policy

- The source of truth for the next mining interval is the user's verified on-chain VCOIN Jetton balance in the linked TON wallet.
- Internal PostgreSQL balances, displayed bot balances, and pending/unconfirmed rewards are never eligible wallet holdings.
- Rate: exactly 1% per 24 hours at every level 1–400; level does not change the rate.
- Precision: 6 decimals. All calculations use integer Jetton base units.
- For one immutable, verified wallet snapshot: `reward_base_units = floor(wallet_snapshot_base_units * elapsed_ms / 8,640,000,000)`.
- After a payout is confirmed on-chain, obtain a fresh wallet snapshot for the next interval. Never count a reward both as pending internal credit and as wallet holdings.
- The 1,050,000,000 VCOIN mining allocation is a hard maximum reserve, not permission to mint.
- The existing 24-hour maximum claim interval remains unchanged until its missed-claim policy is explicitly decided and tested.

## Numbered execution register

Status is based on repository evidence, not on the existence of documentation or a commit alone.

| No. | File / area | Required action and acceptance evidence | Status | Next action |
|---:|---|---|---|---|
| 1 | Repository boundary | Work only in V-Coin-TON | DONE | Maintain boundary |
| 2 | `contracts/mining/engine.js` | Replace internal-balance eligibility with immutable verified wallet snapshots | BLOCKED | Implement after master/network/provider are approved |
| 3 | `contracts/mining/backend/src/routes/mining.js` | Expose only wallet-policy-compliant status/start/claim/end routes | BLOCKED | Keep public API disabled; add wallet routes after implementation |
| 4 | PostgreSQL schema | Store wallet links, proof status, network/master, snapshots and payout lifecycle | PARTIAL | Migration 008 has snapshot/lease storage; add wallet-proof and payout lifecycle only after schema review |
| 5 | Mining reserve migration | Preserve 1.05B VCOIN cap with atomic reservation/release | CODE PRESENT; TEST PENDING | Verify rollback and exhaustion on PostgreSQL 18 |
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
| 17 | TON Jetton identity | Record the owner-supplied deployed master and independently verify its live getters/network | OWNER-PROVIDED DEPLOY TX; LIVE GETTERS PENDING | Verify exact deployed master; do not use prior predicted address |
| 18 | Chain data | Read fresh verified balance and validate owner/master/network/source context | BLOCKED | Select trusted provider and implement fail-closed reader |
| 19 | Payout | Send Jettons and reconcile transaction, finality, bounce and retries | BLOCKED | Approve sender/signing custody architecture; never collect seed phrases |
| 20 | Controlled rehearsal | Use local TON Sandbox and isolated PostgreSQL; compare simulated wallet snapshot, reward and ledger | BLOCKED | All preceding technical gates must pass; no Testnet deployment/transaction |
| 21 | Go / No-Go | Review evidence, security, reserve, backup and owner approval | BLOCKED | Explicit owner approval after evidence review |

## Owner-provided deployment evidence

The owner supplied a Tonviewer transaction record:
- Transaction: `d2ca5bf44e7786d085c684ecb6deba9e38bdcdee589dc91214861d44ec9e2d1d`
- Reported status/action: `Confirmed transaction` / `Contract deploy`
- Reported interface: `jetton_master`
- Master address: `EQBn4hW8bKhFTSz9riY5q3Pr3SfJmv2VYKZQl_NWMbK--5fP`
- Sender: Founder wallet `UQAdW09EvIesUXt9jzLq1T32O0351TaczwWJQLGGmw4aWrzy`
- Attached value: `1 GRAM`

This is owner-provided explorer evidence. It is recorded as the target master for Action 54, but does not by itself prove current getter values, total supply, decimals, mint authority, wallet ownership, or finalized user Jetton balances.

## Mandatory gates before first controlled claim

1. The exact deployed VCOIN Jetton master address and Mainnet identity are verified from live chain state.
2. TON wallet ownership proof is verified; a pasted address or Telegram username is insufficient.
3. Balance reader validates the expected master, owner, network, decimals, freshness and chain context.
4. The mining engine uses only immutable verified wallet snapshots; there is no fallback to PostgreSQL internal balances.
5. Pending rewards and confirmed on-chain holdings are distinct; payout is idempotent and reconciled after finality.
6. Bounced, stale, ambiguous, replayed, mismatched or unavailable chain data fails closed.
7. `npm run check` passes and `npm test` passes, including PostgreSQL integration tests against an isolated PostgreSQL 18 database (not skipped).
8. All 400 levels are proven to use the same 1%/24h formula.
9. Reserve exhaustion, rollback, concurrency, double-counting and payout replay tests pass.
10. The owner's local database, Telegram authentication and local Sandbox wallet-flow simulations are verified; no seed phrase or private key is collected.
11. Owner reviews evidence and explicitly authorizes any later Mainnet operation; no Testnet rehearsal is authorized.

## Known discrepancies and restrictions

- The current engine still reads `balances.available_base_units` and credits internal balances. It is not compliant with the binding wallet-balance policy.
- The public mining API in `contracts/mining/backend/src/server.js` is intentionally blocked with `WALLET_BALANCE_MINING_NOT_IMPLEMENTED` (HTTP 503).
- Existing internal-balance tests do not prove TON wallet ownership, Jetton balance reading, or real payouts.
- The owner has supplied a confirmed deployment transaction and exact Master address; independent live getter, network, supply and mint-authority verification remain pending.
- The 24-hour hard claim limit is not changed by this plan.
- Mainnet, real-value payouts and public extraction remain disabled pending the release gates and separate owner approval.
