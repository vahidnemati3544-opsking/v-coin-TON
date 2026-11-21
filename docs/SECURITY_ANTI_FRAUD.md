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
- IP-based rate limiting on Telegram login and authenticated mining API routes.
- x-powered-by header disabled.
- Generic error responses for server failures.
- PostgreSQL parameterized queries in the mining engine.
- Transactional session/reward operations with row locks.
- UUID and idempotency-key validation in the mining engine.
- Unique database constraints for sessions, operations, and idempotency keys.
- Fixed mining reserve checks and atomic reservation of each newly accrued reward.
- Atomic confirmation of the reserve, double-entry ledger posting, and internal balance credit in one transaction.
- Idempotent mining start and claim handling, covered by PostgreSQL integration tests.
- Production PostgreSQL TLS configuration with certificate verification enabled.

These controls do not constitute a complete security audit.

## 3. Authentication and authorization

Implemented:
- Telegram Mini App init-data HMAC signature verification using the bot token.
- Rejection of expired data, duplicate parameters, malformed user IDs, and invalid signatures.
- Cryptographically random bearer sessions with SHA-256-only token storage, expiry, and revocation.
- Database-backed authentication on private mining endpoints.

Still required:
- Role-based authorization for administrative actions.
- Separate authorization for treasury and reserve operations.
- Secure Telegram webhook verification and end-to-end bot deployment testing.
- Monitoring and alerting for rate-limit events and suspicious account patterns.

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
- Expanded abuse detection, rate limiting, and continuous reserve/ledger reconciliation.
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

## 9. Jetton fixed-allocation issuance and Bounce protection

- The Master StateInit permanently fixes the founder, mining-reserve, treasury, liquidity/market, and ecosystem/marketing destination addresses.
- The owner can request only the exact preassigned allocation for one of those five addresses; arbitrary destinations, partial amounts, and excess amounts are rejected.
- Each role allocation can be issued once. After all five wallet credits succeed, the Master permanently disables further issuance.
- The Master requires a minimum TON funding amount before starting a wallet-credit operation, preventing an underfunded request from recording supply without enough value to create the destination wallet.
- A natural bounced TokenTransferInternal message is accepted only from the deterministic Jetton wallet for the corresponding role and only for that role's exact allocation.
- A valid bounce rolls back only the failed role's amount and reopens only that role for retry; successful allocations remain recorded.
- The five-wallet allocation manifest is in contracts/jetton/allocation/allocation-plan.json.
- Executable Sandbox tests cover fixed destinations, exact amounts, owner authorization, underfunding, natural bounce rollback, retry, and final issuance lock.
- CI success is necessary but does not replace independent review, dependency audit, or Testnet verification.

## 10. Compiler and dependency maintenance

- The CI dependency audit is captured as an artifact and the verification workflow fails when high or critical npm advisories are present.
- Zod and protobufjs are pinned to patched versions through npm overrides; CI has verified that the Tact build and Sandbox suite still pass with these overrides.
- The current Tact compiler package is upstream-deprecated in favor of Tolk. This is a toolchain-maintenance risk, not a demonstrated flaw in the compiled contract bytecode.
- Before Mainnet release, an independent reviewer must assess the Tact toolchain and either approve its continued use for this fixed contract or require a Tolk migration. No Mainnet deployment is authorized by the CI result alone.
