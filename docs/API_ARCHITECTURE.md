## Controlling owner instruction — 2026-11-24 (supersedes conflicting legacy wording)

- Fixed total supply: **2,100,000,000 VCOIN**, six decimals; no additional minting.
- Sole initial receiving wallet: Founder-designated **TON Mainnet** address `UQBh9jVKAypc4TrbFx2jsVB2EI1ONChg22zDputisQjENQOT`.
- **Controlling V COIN–TON receipt rule (2026-11-24):** The full fixed 2,100,000,000 VCOIN supply is first credited only to Founder Mainnet wallet `UQBh9jVKAypc4TrbFx2jsVB2EI1ONChg22zDputisQjENQOT` in five sequential, separately Founder-announced and Founder-signed stages: 420,000,000; 1,050,000,000; 210,000,000; 210,000,000; 210,000,000 VCOIN. Confirm each credit before authorizing the next. After all five receipts, the Founder signs four separate allocations: Mining 1.05B, Treasury 210M, Liquidity 210M, Ecosystem 210M; Founder retains 420M. This is an accounting/architecture rule, not evidence of receipt or permission to transact. Mainnet remains HOLD; public Testnet operations are not authorized.
- After receipt, the Founder personally controls and signs distributions to the four registered allocation wallets: Mining Reserve 1,050,000,000; Treasury 210,000,000; Liquidity/Market 210,000,000; Ecosystem/Marketing 210,000,000 VCOIN. The Founder retains 420,000,000 VCOIN (20%).
- Former Founder address `UQAdW09EvIesUXt9jzLq1T32O0351TaczwWJQLGGmw4aWrzy` was **Testnet-only**. It is historical/test-only and must never be used as the Mainnet receiving address.
- This instruction supersedes direct five-wallet initial issuance, any one-operation five-wallet issuance description, and any designation of the former Founder address as Mainnet.
- Documentation changes do not authorize a Mainnet transaction. The exact deployed Jetton Master, Mainnet status, contract compatibility with the Founder-first five-stage flow, wallet-control proof, exact five-stage amounts, fees, and local Sandbox evidence must be verified before signing. The five-stage contract implementation must pass exact-head CI, local Sandbox, deployed-Master compatibility, source-wallet, and address/hash checks before any signing.

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


## 7. Owner-approved purchase and payout business flow (design; implementation pending)

The fixed total VCOIN supply is 2,100,000,000 VCOIN; the mining payout ceiling is 1,050,000,000 VCOIN. No purchase or reward endpoint may mint additional tokens.

### TON purchase

- The buyer initiates a purchase from the Telegram Mini App/wallet flow and supplies a verified TON wallet destination.
- The backend creates a unique pending order with the quoted VCOIN amount, TON amount, expiry, network, and recipient. The quote and any fees must be shown before wallet approval.
- Only after the exact TON payment is confirmed final on the intended network is the order eligible for settlement.
- The TON consideration is received at the Founder allocation wallet. The corresponding already-issued VCOIN is transferred from the Founder Jetton wallet to the buyer's verified Jetton wallet. No minting is allowed for purchases.
- Both legs are reconciled by transaction hash, amount, sender/recipient, Jetton master, and idempotency key. Partial completion is not reported as a completed purchase; failed/bounced delivery enters a controlled retry/refund exception workflow.

### Level balance

The level engine calculates eligible level balance as purchased VCOIN plus eligible mining rewards. It must retain separate purchased/mining ledger categories, exclude rejected/reversed/pending-ineligible entries, prevent double counting after payout, and atomically charge the approved next-level cost and update the user's level.

### Mining close and payout

The mining allocation is 1,050,000,000 VCOIN maximum (six-decimal base units: 1,050,000,000,000,000). During the mining period, rewards are internal eligible claims, not on-chain wallet balances. After the Founder formally announces completion, a close process freezes reward accrual, reconciles the reserve and all user claims, validates verified wallet destinations, and produces a payout manifest. Payouts are sent from the designated mining-reserve Jetton wallet. Each is marked paid only after verified successful TON finality; bounced/failed transfers remain unpaid and retryable under idempotent controls. The 1,050,000,000 cap cannot be exceeded and no replacement minting is allowed.

These are approved business rules, not claims that purchase settlement, level aggregation, or on-chain mining payouts are already implemented. They remain release blockers until code, integration tests, and local TON Sandbox evidence exist. TON Testnet deployment or rehearsal is not authorized.
