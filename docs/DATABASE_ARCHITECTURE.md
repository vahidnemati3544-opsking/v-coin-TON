# V COIN – TON Database Architecture

**Database:** PostgreSQL  
**Schema file:** contracts/mining/backend/database/schema.sql  
**Mining reserve migration:** contracts/mining/backend/database/migrations/001-mining-reserve.sql  
**Ledger settlement migration:** contracts/mining/backend/database/migrations/002-mining-ledger-settlement.sql  
**Status:** Core schema, reserve controls, and atomic internal ledger settlement are implemented; CI PostgreSQL integration is configured. Local database verification remains pending.

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

The mining engine locks the user and active session in a transaction. Newly accrued rewards are inserted and reserved against the mining reserve in the same transaction. A reserve failure must roll back the reward and session timestamp update.

## 4. Mining reserve

Migration 001-mining-reserve.sql creates:
- mining_reserve
- mining_reward_reservations
- mining_reserve_operations
- mining_reserve_status
- reserve_mining_reward(...)
- confirm_mining_reward(...)
- reverse_mining_reward(...)

The fixed allocation is 5,000,000,000 VCOIN = 5,000,000,000,000,000 base units. The migration checks this exact amount and prevents pending plus distributed amounts from exceeding the allocation.

The mining engine calls the reservation function when it creates a reward. Migration 002 adds `confirm_mining_reward_to_internal_balance(...)`, which confirms the reserve, posts equal debit/credit ledger entries, updates the user's internal available balance, and marks the reward confirmed in one transaction. Repeated confirmation is idempotent and does not increment the balance twice. This is an internal accounting entry, not an on-chain transfer.

## 5. Important configuration gap: levels

The levels table is created but the current schema does not seed the 400 level rows or define approved mining rates and upgrade costs. user_levels.current_level references levels(level), and the mining engine requires a configured level and rate.

Therefore, a new account cannot be fully initialized for mining until the owner-approved level schedule is supplied and inserted. Do not invent mining rates or upgrade prices.

## 6. Ledger and balances

The schema defines double-entry ledger tables and a balance snapshot table. Migration 002 posts a debit to the mining reward expense account and a matching credit to the user's VCOIN liability account. It updates the user's internal available balance in the same transaction and verifies the balanced entries on retry.

Every posted transaction must balance by asset and operation, and financial history must be append-only. Balance snapshots must be reconcilable to ledger entries.

## 7. Database setup

From contracts/mining/backend:

1. Copy .env.example to .env.
2. Set a valid local DATABASE_URL.
3. Create the intended local database and role in PostgreSQL.
4. Run npm install.
5. Run npm run db:setup.

The setup script applies the core schema and mining reserve migration in order and refuses to run with NODE_ENV=production. It is an explicit development setup command, not an automatic production migration system.

## 8. Outstanding database work

- Add a formal migration history/version mechanism.
- Seed approved levels and costs after economic approval.
- Add formal migration history/version tracking.
- Add full PostgreSQL integration tests for Telegram session lifecycle, mining session lifecycle, rollback, reserve exhaustion, and concurrent claims.
- Implement balance reconciliation queries and tests.
- Verify backup/restore and least-privilege database roles.

A successful JavaScript CI run does not prove that the SQL has been applied to the user's local PostgreSQL instance.
