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

## Offline mining foundation — Action #50

Migration 008 adds storage for finalized Jetton balance observations, registered device public keys, signed offline leases, idempotent sync batches, ordered offline events, and reconciliation audit records. The Ed25519 canonical-payload signing utility is in src/services/offline-lease-crypto.js; it is a tested building block, not a lease-issuance endpoint. Its private key must be supplied only from a managed secret store and must never be committed.

The initial PWA shell is in ../../client. It currently provides static shell caching and local diagnostics export only. It does not yet mine, verify a lease in the browser, queue mining events, or synchronize rewards. Migration 008 has been registered but not applied to any database. Public mining remains disabled.

See [the offline lease and wallet trust protocol](../../../docs/OFFLINE_LEASE_AND_WALLET_TRUST_PROTOCOL.md) and [the implementation checkpoints](../../../docs/OFFLINE_MINING_AND_DIAGNOSTICS_PLAN.md).

## What remains before wallet-balance mining can be enabled

The approved execution policy is Mainnet-only. Do not deploy or transact on TON Testnet. Local TON Sandbox tests and offline integration tests are permitted.

- Confirm the official VCOIN Jetton Master address only after a Founder-approved Mainnet deployment and on-chain evidence.
- Implement TON wallet ownership proof and wallet-link lifecycle without collecting seed phrases or private keys.
- Implement a trusted Mainnet Jetton balance reader with freshness, finality, Master-address, owner-address and network validation.
- Persist immutable wallet snapshots and source context; reject stale, unfinalized, mismatched-network or mismatched-Master observations.
- Refactor reward accrual to use only verified on-chain wallet snapshots, with explicit interval snapshots and anti-replay controls.
- Separate pending reward accounting from on-chain payout and finality reconciliation.
- Implement idempotent payout requests, exact reserve controls, natural-bounce recovery, replay protection, concurrency tests and post-payout reconciliation.
- Implement and test offline lease issuance, browser-side signature verification, IndexedDB event queue, ordered sync, replay rejection and reconciliation before claiming offline mining is supported.
- Run syntax/unit tests and non-skipped PostgreSQL 18 integration tests against an isolated local database.
- Verify Telegram Mini App authentication and wallet-link UX without asking for identity documents or wallet recovery secrets.

Public mining must remain HTTP 503 until every wallet-balance and payout gate above is implemented, tested and validated through the project's documented engineering checks. Enabling internal-balance mining as a shortcut is prohibited. Mainnet mining and real-value payouts require the documented engineering release checks and separate Founder authorization.

## Modelled 72-hour VCOIN reference price

Migration `004-price-reference-candles.sql` creates the **modelled reference-price** state and retains its original 0.004 baseline for migration history. Migration `005-vcoin-supply-and-price-reset.sql` is retained unchanged as historical migration history. Forward-only migration `009-21b-vcoin-allocation-baseline.sql` applies the current owner-approved 2,100,000,000 VCOIN allocation model, including a 1,050,000,000 VCOIN mining rewards reserve. The modelled reference baseline remains USD 0.004. Migration `006-annual-compound-price-policy.sql` applies the owner-approved 50% annual compound target. The model advances in 72-hour periods by approximately 0.3338149181% per period (12-decimal fixed-point multiplier `1.003338149181`) and stores OHLC candles; this is not an exchange price or a guarantee. A scheduler checks for due periods every minute and catches up missed periods after a restart. PostgreSQL advisory locking and a transaction protect against duplicate concurrent updates.

The series is explicitly **not a market quote, exchange price, guaranteed value, or promise of returns**. Since this calculation has no live trades, each candle is a deterministic modelled step (open/low at the prior reference price; close/high at the increased reference price), not observed market volatility.

The schedule marks itself completed only when the `USER_MINING` reserve's confirmed `distributed_base_units` reaches its full allocation. The dashboard can read:
- `GET /api/v1/price-reference/current`
- `GET /api/v1/price-reference/candles?limit=100`

The database migration must be applied before starting the backend. No front-end dashboard was present in the inspected repository, so rendering these API candles on the public home page remains a separate client-side task.


## Founder-first five-stage Mainnet receipt reconciliation (supersedes Action #66 five-stage draft)

Migration `database/migrations/010-founder-first-five-stage-reconciliation.sql` adds a chain-confirmed reconciliation ledger for the five exact initial receipt stages and the four subsequent Founder-signed allocation transfers.

- Record each of the five stages only after its exact Mainnet transaction is independently confirmed and its Master, Founder recipient, deterministic Jetton wallet, and stage amount are validated.
- Stages must be recorded in strict order with exact amounts: 420M, 1,050M, 210M, 210M, 210M VCOIN.
- Repeated ingestion of the same transaction hash and identical event is idempotent; conflicting hashes, amounts, stages, or allocation roles are rejected.
- The four distribution roles are recorded only after all five receipt stages are confirmed, only from the registered Founder wallet, and only at their exact approved amounts.
- The reconciliation view reports receipt base units and confirmed Founder distributions separately. Distribution transfers do not create new supply.
- This migration creates accounting controls; it does not itself connect an indexer, verify chain finality, sign a transaction, or broadcast to TON. The backend ingestion service must validate the actual Mainnet transaction and call the database functions only after finality checks.

Do not run the migration against production until the latest backend integration checks and schema review pass. Mainnet remains HOLD / NO-GO.


### Verified-event adapter

`src/services/vcoin-chain-reconciliation.js` provides a strict backend adapter for finalized Mainnet receipt and allocation events. It rejects Testnet, non-finalized events, an unconfigured or mismatched Jetton Master, missing/mismatched deterministic Jetton wallet addresses, wrong Founder source/recipient, invalid transaction hashes, and any role amount or destination that differs from the approved register.

The adapter requires the caller to inject the exact deployed Master address and all five derived Jetton Wallet addresses. Those values must come from the reviewed exact-head deployment artifact and post-deployment on-chain getters; they are intentionally not guessed or hard-coded before deployment. This adapter is not an indexer or a source of finality by itself. A trusted TON indexer/provider must supply the verified event and proof of finality before the adapter is called.
