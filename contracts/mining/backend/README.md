# V COIN – TON Backend

This directory contains the Node.js backend core for the independent V COIN project on TON. It is separate from the legacy BNB Smart Chain project.

## Requirements

- Node.js 22 or newer
- PostgreSQL 18 (or a compatible supported PostgreSQL release)
- npm

## Local configuration

1. Copy `.env.example` to `.env` in this directory.
2. Set `DATABASE_URL` to the dedicated V COIN–TON development/test database.
3. Keep `.env` private. The backend `.gitignore` excludes local environment files while allowing the placeholder `.env.example`.
4. Set `CORS_ORIGIN` to the exact client origin when one is configured.
5. Never commit database passwords, bot tokens, wallet secrets, or recovery phrases.

Example URL format:

```text
postgresql://DATABASE_USER:DATABASE_PASSWORD@localhost:5432/VCOIN_TON
```

Use the actual database name, role and password configured on the local PostgreSQL server. If a password contains URL-reserved characters, percent-encode it in the connection URL.

## Install and verify

Run from this directory:

```bash
npm install
npm run check
npm test
```

The PostgreSQL integration tests are skipped unless `TEST_DATABASE_URL` points to an isolated test database. A successful run with skipped database tests is not evidence that migrations, ledger settlement or mining lifecycle work on PostgreSQL.

## Database setup — local development only

After creating and verifying a dedicated development database and configuring `.env`:

- The setup script accepts only local PostgreSQL hosts: `localhost`, `127.0.0.1`, or `::1`.
- It refuses `NODE_ENV=production`.
- It records migration versions and SHA-256 checksums and refuses to silently change an already-applied migration.
- Back up the target database and verify the database name and role before setup.

Run:

```bash
npm run db:setup
```

This is a development setup command, not a production migration procedure. Do not point it at a hosted or production database.

## API and authentication

- `GET /health/live` reports process liveness.
- `GET /health/ready` checks PostgreSQL connectivity.
- Telegram Mini App authentication is implemented in `src/auth/telegram.js`; configure `TELEGRAM_BOT_TOKEN` privately.
- Telegram init data is HMAC-validated; a username or client-supplied Telegram ID alone is not authentication.

## Mining status — intentionally disabled

The legacy internal-balance mining engine in `../engine.js` reads PostgreSQL `balances.available_base_units` and posts rewards to an internal ledger. It does **not** use a verified TON Jetton wallet balance, prove wallet ownership, send VCOIN Jettons, or reconcile on-chain payouts.

Migration `003-balance-based-mining.sql` supports this legacy internal-balance engine and is not proof of wallet-balance mining. It must not be presented as compliant with the approved wallet-balance rule.

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


## Modelled 72-hour VCOIN reference price

Migration `004-price-reference-candles.sql` initializes a **modelled reference price** at USD 0.004000000000. The backend advances it by 0.2041% every 72 hours using fixed-point integer arithmetic and stores OHLC candles. A scheduler checks for due periods every minute and catches up missed periods after a restart. PostgreSQL advisory locking and a transaction protect against duplicate concurrent updates.

The series is explicitly **not a market quote, exchange price, guaranteed value, or promise of returns**. Since this calculation has no live trades, each candle is a deterministic modelled step (open/low at the prior reference price; close/high at the increased reference price), not observed market volatility.

The schedule marks itself completed only when the `USER_MINING` reserve's confirmed `distributed_base_units` reaches its full allocation. The dashboard can read:
- `GET /api/v1/price-reference/current`
- `GET /api/v1/price-reference/candles?limit=100`

The migration is included in the local `npm run db:setup` sequence; apply and verify the database setup before starting the backend. No front-end dashboard was present in the inspected repository, so rendering these API candles on the public home page remains a separate client-side task.
