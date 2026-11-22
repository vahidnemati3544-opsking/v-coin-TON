# V COIN – TON Database Architecture

**Database:** PostgreSQL  
**Schema file:** contracts/mining/backend/database/schema.sql  
**Migrations:** contracts/mining/backend/database/migrations/  
**Status:** Core schema, reserve controls, and atomic internal-ledger settlement are implemented in code. Local PostgreSQL verification remains pending. These components do not establish wallet-based mining or on-chain payouts. The authoritative purchase, level-balance, and final mining-payout policy is documented in `docs/PURCHASE_AND_MINING_PAYOUT_POLICY.md`.

## 1. Core tables

The current core schema defines:

| Area | Tables |
|---|---|
| Accounts | users, user_profiles, user_sessions |
| Wallets | wallets, wallet_verifications |
| Levels | levels, user_levels, level_upgrades |
| Mining | mining_sessions, mining_rewards |
| Referrals | referral_codes, referral_relationships, referral_rewards |
| Double-entry ledger | ledger_accounts, ledger_transactions, ledger_entries |
| Internal balances | balances |
| Blockchain records | blockchain_transactions, blockchain_events |
| Operations and audit | system_events, audit_logs |

The schema uses UUID identifiers, foreign keys, uniqueness constraints, status checks, numeric base-unit amounts, and indexes for common account/history lookups.

## 2. Monetary representation

VCOIN has six decimal places. Financial amounts are stored as integer base units in NUMERIC(38,0) columns; application code must avoid floating-point arithmetic for balances and rewards.

One VCOIN equals 1,000,000 base units.

## 3. Mining sessions and rewards

mining_sessions records server-timed sessions and permits only one active session per user through a partial unique index.

mining_rewards records each reward with user and session references, a positive integer base-unit amount, a unique operation ID, a unique idempotency key, and pending/confirmed/rejected/reversed status.

The legacy internal-balance mining engine locks the user and active session in a transaction. It inserts rewards and reserves them against the mining reserve in the same transaction. A reserve failure must roll back the reward and session timestamp update.

**Important:** this describes the legacy internal-balance engine only. It is not the approved TON wallet-balance extraction flow and must remain unavailable through the public API.

## 4. Mining reserve

Migration `001-mining-reserve.sql` creates:
- mining_reserve
- mining_reward_reservations
- mining_reserve_operations
- mining_reserve_status
- reserve_mining_reward(...)
- confirm_mining_reward(...)
- reverse_mining_reward(...)

The approved mining allocation is 1,050,000,000 VCOIN = 1,050,000,000,000,000 base units (50% of the fixed 2,100,000,000 VCOIN total supply). Migration 001 originally seeded a legacy 5,000,000,000 VCOIN value; migration 005-vcoin-supply-and-price-reset.sql corrects the live development reserve to the approved 1,050,000,000 VCOIN cap before issuance. Migration 005 refuses to apply if pending plus distributed rewards already exceed the corrected cap. The migration runner includes migration 005; do not edit historical migration 001.

Migration `002-mining-ledger-settlement.sql` adds `confirm_mining_reward_to_internal_balance(...)`, which confirms the reserve, posts equal debit/credit ledger entries, updates the user's internal available balance, and marks the reward confirmed in one transaction. Repeated confirmation is idempotent and does not increment the balance twice. This is an internal accounting entry, not an on-chain transfer.

## 5. Legacy balance snapshot migration

Migration `003-balance-based-mining.sql` adds `rate_balance_base_units` and backfills active sessions from PostgreSQL internal balances. It exists for the legacy internal-balance engine and is **not compliant with the approved wallet-balance mining specification**.

Do not interpret this column or migration as proof of a verified Jetton wallet snapshot. Do not activate the public mining routes. The public API must remain fail-closed until the separate wallet-proof, Jetton-balance-reader, immutable wallet-snapshot and payout lifecycle implementation is complete.

The PostgreSQL integration tests replay this legacy migration against an isolated test database. They drop only its named CHECK constraint before replaying it; the checksum-based development setup runner does not rewrite or replay already-applied migrations.

## 6. Important configuration gap: levels

The levels table is created but the current schema does not seed the 400 level rows or define approved upgrade costs. user_levels.current_level references levels(level), and the legacy mining engine requires a configured level and rate.

Therefore, a new account cannot be fully initialized for mining until the owner-approved level schedule is supplied and inserted. Do not invent upgrade prices. The approved wallet-balance policy specifies the same 1% per 24 hours at all levels; this must be enforced by the future wallet-based engine, not inferred from legacy level-rate fields.

## 7. Ledger and balances

The schema defines double-entry ledger tables and an internal balance snapshot table. Migration 002 posts a debit to the mining reward expense account and a matching credit to the user's VCOIN liability account. It updates the user's internal available balance in the same transaction and verifies the balanced entries on retry.

Every posted transaction must balance by asset and operation, and financial history must be append-only. Balance snapshots must be reconcilable to ledger entries. Internal balances are not eligible wallet holdings.

## 8. Safe local database setup

From `contracts/mining/backend`:

1. Copy `.env.example` to `.env`.
2. Set a local `DATABASE_URL` for the dedicated V COIN–TON development database.
3. Confirm the target database name and role in pgAdmin.
4. Back up the target database before schema setup.
5. Run `npm install`, then `npm run check` and `npm test`.
6. Run `npm run db:setup` only after confirming the target.

The setup script applies the core schema and migrations 001–003 in order, records versions and SHA-256 checksums in `schema_migrations`, uses a PostgreSQL advisory lock to prevent concurrent setup, skips unchanged migrations, and refuses checksum drift. It refuses `NODE_ENV=production` and rejects non-local database hosts. It is a local development setup command, not a production migration system.

The integration suite uses `TEST_DATABASE_URL` and must point to a separate, disposable test database — never the development database and never production.

## 9. Outstanding database work

- Verify migration history and checksums on the user's local PostgreSQL 18 installation.
- Seed approved levels and costs only after the owner approves the schedule.
- Run full PostgreSQL integration tests without skips, against an isolated test database.
- Verify rollback, reserve exhaustion, concurrency, idempotency and ledger reconciliation.
- Implement the separate wallet snapshot, TON-to-VCOIN purchase settlement, combined level-qualifying balance, and end-of-mining on-chain payout lifecycle after the TON wallet and provider architecture is approved.
- Verify backup/restore and least-privilege database roles.

A successful JavaScript CI run does not prove that SQL has been applied to the user's local PostgreSQL instance. A successful database connection does not prove that mining is live.


## 10. Approved purchase and mining payout flow

- A completed TON-to-VCOIN purchase sends the TON consideration to the Founder allocation wallet and transfers already-issued VCOIN from the Founder Jetton wallet to the buyer's verified Jetton wallet. Purchases must not mint new VCOIN.
- Purchased VCOIN and eligible accumulated mining rewards are combined for level calculation, while their origins remain separately identifiable in the immutable ledger.
- Mining rewards are credited to the user's internal pending/eligible account during the mining period. They are not represented as an on-chain wallet balance until an on-chain payout is confirmed.
- After the Founder formally declares the mining period complete, the system reconciles the 1,050,000,000 VCOIN mining allocation, validates each user's eligible rewards and payout destination, and transfers each payable amount from the designated mining reserve Jetton wallet to the user's verified Jetton wallet.
- Payouts require idempotency, reserve-cap enforcement, transaction finality/bounce verification, and an immutable audit trail. Never mark a payout paid before chain confirmation.
- The 5,000,000,000 VCOIN value in migration 001 is historical and is superseded by migration 005. The effective cap is 1,050,000,000 VCOIN.
