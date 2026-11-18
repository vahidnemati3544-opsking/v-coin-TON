# V COIN – TON Backend

This directory contains the Node.js backend core for the independent V COIN project on TON. It is separate from the legacy BNB Smart Chain project.

## Requirements

- Node.js 22 or newer
- PostgreSQL 18 (or a compatible supported PostgreSQL release)
- npm

## Local configuration

1. Copy `.env.example` to `.env` in this directory.
2. Set `DATABASE_URL` to the PostgreSQL database created for V COIN – TON.
3. Keep `.env` private. Never commit database passwords, bot tokens, wallet secrets, or recovery phrases.
4. Set `CORS_ORIGIN` to the exact origin of the client application when one is configured.

Example connection URL format:

```text
postgresql://DATABASE_USER:DATABASE_PASSWORD@localhost:5432/VCOIN_TON
```

Use the actual database name, role, and password configured on the local PostgreSQL server.

## Install and verify

Run these commands from this directory:

```bash
npm install
npm run check
npm test
```

- `npm run check` checks JavaScript syntax, including the mining engine and database setup script.
- `npm test` runs Node.js unit tests and, when `TEST_DATABASE_URL` is set, a PostgreSQL integration test for reserve reservation, ledger settlement, balance posting, and idempotent confirmation. GitHub Actions runs this integration test against PostgreSQL 18.

## Initialize the local database

After creating the target database and configuring `.env`, run:

```bash
npm run db:setup
```

This explicit development-only command applies, in order:

1. `database/schema.sql` — core users, levels, mining, referral, ledger, balance, and audit tables.
2. `database/migrations/001-mining-reserve.sql` — the fixed 5,000,000,000 VCOIN mining reserve and its reservation, confirmation, reversal, and integrity functions.
3. `database/migrations/002-mining-ledger-settlement.sql` — atomic confirmation of a pending mining reward into a balanced double-entry ledger transaction and the user's internal VCOIN balance. This does not transfer tokens on-chain.

The setup script refuses to run when `NODE_ENV=production`. Review the target database name and role shown in its output before proceeding. Do not run it against a production database.

## Start the API process

```bash
npm start
```

Health endpoints:

- `GET /health/live` — process liveness.
- `GET /health/ready` — checks PostgreSQL connectivity.

## Telegram authentication

Set `TELEGRAM_BOT_TOKEN` in the private `.env` file. The API provides:

- `POST /api/v1/auth/telegram` — validates Telegram Mini App init data using the bot-token HMAC scheme and issues a random bearer session token.
- `GET /api/v1/auth/me` — returns the current authenticated account.
- `POST /api/v1/auth/logout` — revokes the current session.

Only a SHA-256 hash of each session token is stored in PostgreSQL. Telegram init data is checked for signature, timestamp age, duplicate fields, and a valid Telegram user ID. A Telegram username or raw user ID alone is never accepted as authentication. The bot token must never be committed to Git.

The current automated tests cover HMAC validation, tampering, expiry, duplicate parameters, missing configuration, and session-token hashing. The PostgreSQL integration tests exercise reserve/ledger settlement, mining session and claim lifecycle, and Telegram login/session revocation. GitHub Actions runs these tests against a fresh PostgreSQL 18 service.

## Mining engine status

The mining engine is in `../engine.js`. It supports session start, reward claim, and session end operations. Each newly accrued reward is written and reserved against the approved mining allocation in the same PostgreSQL transaction. If the reserve migration is missing or the reserve is exhausted, the claim must roll back.

The current API server does not yet expose user-facing mining routes. Mining session API routes remain disabled until Telegram authentication is connected to the mining engine, the approved 400-level schedule is supplied, and full session/claim/end integration tests pass.

## Deployment restrictions

- Development and test databases must remain separate from production.
- No TON Mainnet deployment, token issuance, private-key handling, or real-value transfer is performed by this backend setup.
- Production use requires authentication, authorization, rate limiting, database migration controls, security review, backups, and end-to-end tests.
