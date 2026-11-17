# V COIN – TON | Engineering Checkpoint
Date: 2026-11-17
Repository: vahidnemati3544-opsking/v-coin-TON
Branch: repair/backend-foundation-2026-11-17

## Scope and safety
- This checkpoint applies only to the independent TON project.
- The older BNB Smart Chain project is out of scope and must not be changed.
- This branch is isolated from main; do not merge or deploy without explicit approval.
- Real token minting, on-chain transfers, withdrawals, and production mining remain disabled.

## Implemented and saved
1. Backend Express core with security middleware, health endpoints, PostgreSQL connection before listen, and graceful shutdown.
2. PostgreSQL configuration supporting DATABASE_URL or PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD, PGSSL, and PGPOOL_MAX.
3. Local-only backend .env.example; real credentials must never be committed.
4. Core PostgreSQL schema for users, sessions, wallets, levels, mining sessions/rewards, referrals, ledger, balances, blockchain records, and audit logs.
5. Migration 001 for the 5,000,000,000 VCOIN mining reserve, reward reservations, reserve operations, and reserve functions.
6. Migration 002 for atomic internal reward posting, double-entry ledger entries, internal balance snapshots, and retry-key validation.
7. Mining engine with database transactions, server-clock elapsed time, integer base-unit arithmetic, idempotency checks, reserve reservation, and explicit internal-ledger confirmation.
8. Unit tests and PostgreSQL integration tests.
9. GitHub Actions workflow using Node.js 22 and PostgreSQL 16 to run syntax checks, unit tests, and integration tests.

## Verification evidence
- Latest recorded workflow run: 44074418811.
- Job conclusion: success.
- Completed steps include JavaScript syntax check, unit tests, and PostgreSQL integration tests.
- These tests ran in GitHub Actions against an ephemeral PostgreSQL 16 service.
- The user's local PostgreSQL database has NOT yet been migrated or verified.
- A successful CI run does NOT mean the public application is deployed or ready for real users.

## Remaining before a controlled test launch
1. Apply schema.sql and migrations 001 and 002 to the user's local PostgreSQL database, then verify connection and health endpoints.
2. Implement and test API routes for mining sessions, reward claims, internal balances, and administrative approval/reversal.
3. Implement secure Telegram Mini App/init-data authentication and session controls.
4. Connect Telegram bot to the backend and test the complete user flow.
5. Implement TON wallet connection and transaction verification; never request seed phrases or private keys.
6. Add level progression, purchase-balance accounting, referral rewards (100 VCOIN invite reward and 2% qualifying activity reward), and anti-fraud controls.
7. Add reconciliation, rollback, concurrency, authorization, and security tests.
8. Configure staging deployment, HTTPS, monitoring, backups, and operational controls.
9. Complete TON testnet validation and obtain explicit approval before any production or mainnet action.

## Important accounting distinction
The mining engine's confirmation function credits an internal VCOIN ledger balance. It does not mint Jettons and does not transfer tokens to a user's TON wallet. Internal accounting and on-chain distribution must remain separate.

## Current status
Backend foundation and CI verification: completed.
Local PostgreSQL setup/migrations: pending.
User-facing API/auth/Telegram/wallet integration: pending.
Staging deployment and end-to-end test: pending.
Production mining, withdrawals, and mainnet: disabled.
