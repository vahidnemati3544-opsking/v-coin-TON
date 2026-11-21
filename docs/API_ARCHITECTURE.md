# V COIN – TON API Architecture

**Status:** Health endpoints, Telegram account authentication, and authenticated mining status/session endpoints are implemented. Wallet, balance history, referral, and level-upgrade APIs remain pending.

## 1. Current backend endpoints

The current Express server exposes only:

| Method | Path | Current purpose |
|---|---|---|
| GET | / | Service identity and version |
| GET | /health/live | Process liveness |
| GET | /health/ready | PostgreSQL connectivity readiness |
| GET | /health | Compatibility redirect to /health/live |

The server also exposes the Telegram authentication endpoints and the mining routes listed below. Wallet, balance history, referral, and level-upgrade routes are not yet implemented. Architecture plans below are not claims of implemented routes.

## 2. Planned API groups

All future business routes should use the /api/v1 prefix.

### Authentication
- POST /api/v1/auth/telegram — validate Telegram Mini App init data, find or create the account, and issue a revocable application session.
- POST /api/v1/auth/logout — revoke the current session.
- GET /api/v1/auth/me — return the authenticated account summary.

Telegram init data must be validated server-side with the bot token and an age limit. A Telegram username or user ID supplied without a valid signature is not authentication. This is Telegram account authentication, not identity/KYC verification.

### Mining
- GET /api/v1/mining/status
- POST /api/v1/mining/start
- POST /api/v1/mining/claim
- POST /api/v1/mining/end
- GET /api/v1/mining/rewards

Every write operation must require authentication, validate the user's account status, and use an idempotency key. The server clock is authoritative; clients must not submit elapsed time or reward amounts.

### Levels
- GET /api/v1/levels
- GET /api/v1/levels/status
- POST /api/v1/levels/upgrade

Level upgrades must lock the user balance and level row, verify the next level and exact approved cost, write a ledger transaction, and update the level atomically.

### Balances and ledger
- GET /api/v1/balance
- GET /api/v1/balance/history

Purchased, pending mining, confirmed internal, reserved, and on-chain wallet balances must not be conflated. Financial entries must be immutable and reconciled.

### Wallets
- GET /api/v1/wallets
- POST /api/v1/wallets/connect
- POST /api/v1/wallets/verify

Only public addresses and verification records may be stored. Private keys and recovery phrases must never be requested.

### Referrals
- GET /api/v1/referrals
- POST /api/v1/referrals/attach

Referral rules must be enforced by the backend, not by the Telegram client. The approved business rules are 100 VCOIN for a qualifying invite and 2% of the referred user's eligible activity while that user remains active; detailed eligibility, anti-abuse, and ledger rules still require implementation.

## 3. Authentication and sessions

The Telegram authentication flow is implemented in `contracts/mining/backend/src/auth/telegram.js`. It verifies the HMAC signature, rejects duplicate fields and expired timestamps, creates the user/profile, issues a random bearer token, and stores only its SHA-256 hash in `user_sessions`. Session expiry and revocation are checked against PostgreSQL for authenticated requests.

The implementation must continue to be integration-tested against the local PostgreSQL database. The flow must:

1. Receive the original Telegram init data.
2. Verify its HMAC signature using the configured bot token.
3. Reject expired or malformed authentication data.
4. Find or create the user using the verified Telegram user ID.
5. Generate a cryptographically random session token.
6. Store only a SHA-256 hash of that token in user_sessions.
7. Enforce expiry and revocation on every authenticated request.

Never trust a client-supplied user UUID as proof of account ownership.

## 4. API security requirements

- HTTPS in deployed environments.
- Helmet security headers.
- Explicit CORS origin allowlist.
- Request body size limits.
- Schema validation for all inputs.
- Per-account and per-IP rate limits.
- Authentication and authorization on every private route.
- Idempotency keys for financial writes.
- Generic public error messages; no stack traces or secrets in responses.
- Structured audit records for sensitive operations.

## 5. Error contract

Use stable machine-readable error codes. Do not return SQL messages, credentials, internal paths, or stack traces to clients. Health readiness must return a non-success status when PostgreSQL is unavailable.

## 6. Implementation gates

The authenticated mining routes are present, but they cannot start sessions until the user's level and positive mining rate are configured. Before real-user operation, complete the approved 400-level schedule, PostgreSQL session/claim/end integration tests, rate limiting, monitoring, and full reserve/ledger reconciliation. A successful claim credits an internal application balance only; it does not transfer Jettons to a TON wallet.


## Binding governance addendum — 2026-11-21

This document is governed by [FOUNDER_EXCLUSIVE_FIVE_WALLET_CONTROL.md](FOUNDER_EXCLUSIVE_FIVE_WALLET_CONTROL.md): **the Founder alone has absolute, exclusive operational control and signing authority over all five V COIN–TON allocation wallets** (Founder, Mining Reserve, Treasury, Liquidity/Market, and Ecosystem/Marketing). Their separation is for accounting only; none is an independent custodian. No employee, administrator, backend, Telegram bot, CI process, third party, multisig co-signer, escrow, vesting, time lock, withdrawal ceiling, or automated process may authorize, veto, delay, redirect, sign, or execute a Founder-authorized movement.

**TON implementation boundary:** each TEP-74 Jetton Wallet authorizes transfers through its own `owner` address. Master ownership alone does not confer a clawback or withdrawal right over other Jetton Wallets. The approved implementation therefore depends on the Founder being the sole holder of signing authority for each of the five recorded owner-wallet addresses; transfers are signed locally by the Founder. The Master must not add hidden seizure or forced-transfer functionality. Backend/Telegram systems may read, account, reconcile, and prepare unsigned proposals only. Never request or store wallet secrets. Evidence of address control is tracked separately and must not be described as completed until checked. This addendum does not authorize deployment, minting, transfer, signing, or broadcast.
