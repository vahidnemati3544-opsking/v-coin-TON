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

## Laptop execution sequence (follow in this order)
1. Check the laptop environment: confirm Node.js 22 or newer, PostgreSQL, and pgAdmin access. PostgreSQL/pgAdmin were previously installed by the user's specialist; do not reinstall unless a concrete fault is found.
2. Open only repository vahidnemati3544-opsking/v-coin-TON and branch repair/backend-foundation-2026-11-17. Do not open or change the older BNB project.
3. Prepare the backend's local environment file from contracts/mining/backend/.env.example. Enter database credentials locally only; never commit .env or expose passwords in chat/GitHub.
4. Start the backend database connection check and verify PostgreSQL connectivity before running migrations.
5. Select/create a dedicated V COIN–TON database and apply contracts/mining/backend/database/schema.sql once, after confirming the target database.
6. Inspect migration history and existing objects first. If not already applied, run migration 001 (the existing filename is 001-miming-reserve.sql; do not rename it casually), then migration 002 (002-mining-ledger-posting.sql). Do not blindly rerun either migration.
7. Run the backend PostgreSQL integration tests against the laptop database and verify reserve, reward posting, double-entry ledger, balance snapshot, and idempotent retry behavior.
8. Implement and test the missing Express API routes for mining session start/claim/end, internal balance reads, and controlled reward confirmation. The current server foundation does not yet expose these mining routes.
9. Implement secure Telegram Mini App/init-data authentication and session controls; no government identity/KYC flow is required by the user's product direction, but Telegram request authenticity must be verified.
10. Connect the Telegram bot to the backend and test the complete account/session flow.
11. Complete level progression, purchased-token balance accounting, and referral rules: 100 VCOIN for a valid invitation and 2% of qualifying referred-user activity while active. Add anti-fraud controls.
12. Implement TON wallet connection and transaction verification. Never request or store seed phrases/private keys; do not enable real transfers at this stage.
13. Add reconciliation, rollback, concurrency, authorization, and security tests; configure staging, HTTPS, monitoring, backups, and operational controls.
14. After all gates pass, run a controlled end-to-end test using the user's own account. This is a test milestone, not permission for production mining, withdrawals, minting, or mainnet.
15. Keep production/mainnet actions disabled until separate review and the user's explicit approval.

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
