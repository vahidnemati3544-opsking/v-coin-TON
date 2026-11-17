# V COIN – TON API Architecture

**Status:** Planned API contract; endpoints are not all implemented.

## 1. Rules

- Base path: `/api/v1`.
- Backend is authoritative for identity, balances, rewards and levels.
- All protected routes require verified authentication and authorization.
- Validate request bodies and query parameters.
- Financial mutations require idempotency keys and database transactions.
- Use integer token base units (6 decimals); do not accept floating-point amounts.
- Never expose secrets, private keys, seed phrases or internal error details.
- Apply rate limits and audit sensitive operations.

## 2. Planned endpoint groups

| Group | Method and route | Purpose |
|---|---|---|
| Health | GET /health/live | Process liveness |
| Health | GET /health/ready | Database readiness |
| Account | POST /api/v1/auth/telegram | Validate Telegram init data and establish session |
| Account | GET /api/v1/users/me | Current user profile |
| Wallet | POST /api/v1/wallets/challenge | Create one-time wallet proof challenge |
| Wallet | POST /api/v1/wallets/verify | Verify signed proof and bind address |
| Wallet | GET /api/v1/wallets | List connected addresses |
| Balance | GET /api/v1/balances | Read categorized internal balances |
| Ledger | GET /api/v1/ledger | Read authorized ledger history |
| Referrals | GET /api/v1/referrals/me | Referral code and direct referral summary |
| Levels | GET /api/v1/levels | Level definitions |
| Levels | POST /api/v1/levels/upgrade | Execute validated upgrade |
| Mining | GET /api/v1/mining/status | Read mining status (disabled until gates pass) |
| Mining | POST /api/v1/mining/start | Start session only after activation |
| Mining | POST /api/v1/mining/claim | Claim eligible reward only after activation |

## 3. Authentication

Telegram Mini App initialization data must be verified server-side using the bot token. Client-supplied Telegram IDs are untrusted until verified. Session tokens must be high entropy, stored hashed, expire, and support revocation.

## 4. Wallet verification

Use a one-time challenge and TON Connect-compatible proof verification. A connected wallet address alone is not proof of ownership. Never request private keys or recovery phrases.

## 5. Financial mutation contract

Financial requests require an idempotency key. The backend must lock affected records, validate available funds and reserve limits, write balanced ledger entries and update snapshots atomically. Repeated requests with the same key and same payload return the original result; conflicting reuse is rejected.

## 6. Error contract

Return stable machine-readable codes. Do not return SQL, stack traces, secrets or raw provider errors. Use 400 for invalid input, 401 for unauthenticated, 403 for forbidden, 404 for missing resources, 409 for state/idempotency conflicts, 429 for rate limits, and 500/503 for server/dependency failures.

## 7. Implementation status

This document is a target contract. Route handlers, authentication, rate limiting, wallet proof verification, ledger operations and mining endpoints require implementation and automated tests. No endpoint should be considered operational merely because it is listed here.
