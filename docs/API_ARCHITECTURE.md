# V COIN – TON API Architecture

**Status:** API foundation implemented; user-facing business APIs are not yet implemented.

## 1. Current backend endpoints

The current Express server exposes only:

| Method | Path | Current purpose |
|---|---|---|
| GET | / | Service identity and version |
| GET | /health/live | Process liveness |
| GET | /health/ready | PostgreSQL connectivity readiness |
| GET | /health | Compatibility redirect to /health/live |

The current server does not yet expose authenticated mining, wallet, balance, referral, or level endpoints. Architecture plans below are not claims of implemented routes.

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

The planned Telegram authentication flow must:

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

Before exposing mining routes: complete Telegram authentication, session revocation, approved level configuration, reward ledger posting, reserve reconciliation, and PostgreSQL integration tests. Routes must not be exposed without these controls.
