# V COIN – TON Backend

This directory contains the Node.js backend core for the independent V COIN project on TON. It is separate from the legacy BNB Smart Chain project.

## Requirements

- Node.js 22 or newer
- PostgreSQL 18 (or a compatible supported PostgreSQL release)
- npm

## Local configuration

1. Copy `.env.example` to `.env` in this directory.
2. Set `DATABASE_URL` to the dedicated V COIN–TON development/test database.
3. Keep `.env` private. Never commit database passwords, bot tokens, wallet secrets, or recovery phrases.
4. Set `CORS_ORIGIN` to the exact client origin when one is configured.

Example URL format:

```text
postgresql://DATABASE_USER:DATABASE_PASSWORD@localhost:5432/VCOIN_TON
```

Use the actual database name, role and password configured on the local PostgreSQL server.

## Install and verify

Run from this directory:

```bash
npm install
npm run check
npm test
```

The PostgreSQL integration tests are skipped unless `TEST_DATABASE_URL` points to an isolated test database. A successful run with skipped database tests is not evidence that migrations, ledger settlement or mining lifecycle work on PostgreSQL.

## Database setup

After creating and verifying a dedicated development database and configuring `.env`, the explicit development-only command is:

```bash
npm run db:setup
```

The setup runner applies the schema and migrations in order, tracks versions/checksums, and refuses to run with `NODE_ENV=production`. Do not run it against a production database. Back up the target database and verify its name and role before setup.

## API and authentication

- `GET /health/live` reports process liveness.
- `GET /health/ready` checks PostgreSQL connectivity.
- Telegram Mini App authentication is implemented in `src/auth/telegram.js`; configure `TELEGRAM_BOT_TOKEN` privately.
- Telegram init data is HMAC-validated; a username or client-supplied Telegram ID alone is not authentication.

## Mining status — intentionally disabled

The legacy internal-balance mining engine in `../engine.js` reads PostgreSQL `balances.available_base_units` and posts rewards to an internal ledger. It does **not** use a verified TON Jetton wallet balance, prove wallet ownership, send VCOIN Jettons, or reconcile on-chain payouts.

Accordingly, `src/server.js` deliberately returns HTTP 503 with `WALLET_BALANCE_MINING_NOT_IMPLEMENTED` for every public `/api/v1/mining` request. The internal-balance router is not mounted. Do not remove this block or enable the legacy routes as a workaround.

The approved policy is documented in `../../../docs/WALLET_BALANCE_MINING_SPEC.md` and `../../../docs/MINING_READINESS_PLAN.md`: the next mining interval must be based only on a verified on-chain VCOIN Jetton balance in the user's linked TON wallet. Pending internal rewards do not count as wallet holdings.

## What remains before Testnet extraction rehearsal

- Confirm the official VCOIN Jetton master address and Testnet/Mainnet identity from deployment evidence.
- Implement TON wallet ownership proof and wallet-link lifecycle.
- Implement a trusted Jetton balance reader with freshness and master/owner/network validation.
- Persist immutable wallet snapshots and source context.
- Refactor reward accrual to use only verified wallet snapshots.
- Separate pending reward accounting from on-chain payout and finality reconciliation.
- Add idempotent payout, bounce, replay, concurrency and reserve tests.
- Run syntax/unit tests and non-skipped PostgreSQL 18 integration tests.
- Verify the owner's Telegram Mini App and TON Testnet wallet flow.

Never request or store a user's seed phrase or private key. Wallet signing must remain in the wallet interface. Mainnet and real-value payouts require separate explicit approval and security review.
