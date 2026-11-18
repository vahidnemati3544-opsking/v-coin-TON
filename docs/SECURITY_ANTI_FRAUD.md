# V COIN – TON Security and Anti-Fraud Requirements

**Status:** Security requirements and selected backend controls are documented; full implementation and independent review are pending.

## 1. Security principles

- Treat the backend and PostgreSQL as authoritative for user activity and internal accounting.
- Never trust client-provided reward amounts, elapsed time, user IDs, level costs, or wallet ownership.
- Keep TON private keys and recovery phrases outside V COIN servers.
- Separate development, testnet, and production credentials and databases.
- Require explicit approval for irreversible or financial administrative actions.

## 2. Controls currently present in code

- Helmet security headers in the Express server.
- Explicit CORS origin allowlist.
- JSON request body size limit.
- x-powered-by header disabled.
- Generic error responses for server failures.
- PostgreSQL parameterized queries in the mining engine.
- Transactional session/reward operations with row locks.
- UUID and idempotency-key validation in the mining engine.
- Unique database constraints for sessions, operations, and idempotency keys.
- Fixed mining reserve checks and atomic reservation of each newly accrued reward.
- Production PostgreSQL TLS configuration with certificate verification enabled.

These controls do not constitute a complete security audit.

## 3. Authentication and authorization still required

- Server-side Telegram Mini App init-data signature validation.
- Session token generation, hashed storage, expiry, and revocation.
- Per-route authentication and account ownership checks.
- Role-based authorization for administrative actions.
- Separate authorization for treasury and reserve operations.
- Secure Telegram webhook verification.

A Telegram username or user ID alone must never authenticate a request.

## 4. Mining abuse protections

Required before real users are enabled:

- Server-authoritative timestamps and reward calculations.
- One active mining session per account.
- Idempotent claims and replay protection.
- Maximum claim interval and invalid timestamp handling.
- Reserve cap enforced inside the same transaction as reward creation.
- Detection and review of abnormal account patterns.
- Rate limits and abuse controls on authentication and mining routes.
- Atomic ledger posting and reconciliation.
- Safe handling of retries, duplicate requests, and concurrent claims.

Device/IP signals may support risk review but must not be treated as conclusive identity proof.

## 5. Wallet and blockchain protections

- Never collect seed phrases or private keys.
- Verify wallet ownership with supported cryptographic proofs.
- Validate TON addresses and network context.
- Verify transaction status from a trusted TON data source.
- Do not treat a client callback as proof of an on-chain transfer.
- Separate internal reward records from confirmed Jetton transfers.
- Require explicit user approval for wallet transactions.

## 6. Database and secrets

- Use a least-privilege application database role.
- Keep .env and production secrets out of Git.
- Use encrypted backups and test restoration.
- Restrict access to audit and financial tables.
- Use version-controlled schema migrations.
- Do not log passwords, tokens, private keys, recovery phrases, or full authentication payloads.

## 7. Operational controls

Before staging or production:
- Dependency and vulnerability scanning.
- Static analysis and automated tests.
- PostgreSQL integration and concurrency tests.
- Penetration testing of authentication and business APIs.
- Monitoring and alerting for failures and suspicious activity.
- Incident response and credential rotation procedures.
- Independent smart-contract review before any TON Testnet/Mainnet release.

## 8. Release restrictions

No real-value transfer, token issuance, Mainnet deployment, or public mining launch is authorized by this document. Each requires a separate readiness review and explicit approval.
