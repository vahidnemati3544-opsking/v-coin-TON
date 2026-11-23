# V COIN – TON Security and Anti-Fraud Requirements

**Status:** Security requirements and selected backend controls are documented; implementation and operational checks are tracked as engineering work. No external security-audit company has been contracted or engaged. Independent auditing is not a defined project workstream, pending task, or release condition.

## 1. Security principles

- Treat the backend and PostgreSQL as authoritative for user activity and internal accounting.
- Never trust client-provided reward amounts, elapsed time, user IDs, level costs, or wallet ownership.
- Keep TON private keys and recovery phrases outside V COIN servers.
- Separate local-development and Mainnet credentials, endpoints and databases; do not configure or use Testnet execution credentials.
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

These controls are documented engineering safeguards; they do not imply external certification or a guarantee that no vulnerabilities exist.

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
- CI success alone is not sufficient. The project must complete its defined local TON Sandbox verification and engineering release checks. Testnet deployment and transactions are not authorized.

## 10. Compiler and dependency maintenance

- The CI dependency audit is captured as an artifact and the verification workflow fails when high or critical npm advisories are present.
- Zod and protobufjs are pinned to patched versions through npm overrides; CI has verified that the Tact build and Sandbox suite still pass with these overrides.
- The current Tact compiler package is upstream-deprecated in favor of Tolk. This is a toolchain-maintenance risk, not a demonstrated flaw in the compiled contract bytecode.
- Before Mainnet release, the project must assess the Tact toolchain maintenance risk and decide whether to retain it for this fixed contract or migrate to Tolk. No Mainnet deployment is authorized by the CI result alone.

## 11. Founder immediate full-withdrawal authority

- The project owner explicitly approved the founder's right to receive and withdraw the entire 420,000,000 VCOIN allocation at once.
- No vesting, time lock, monthly installments, or staged release applies to the founder allocation.
- The current VCoinMaster credits the exact founder allocation to the founder's configured Jetton wallet as one issuance operation.
- Once the Jetton wallet credit is confirmed, the founder may transfer or withdraw the full amount using the standard Jetton wallet owner authorization.
- This is the founder's fixed 20% allocation, not permission to mint beyond the approved total supply.

## 12. Separate operational gas reserve

- The separately registered GAS & OPERATIONS wallet is stored as an immutable gas-operator address in VCoinMaster StateInit.
- It may send VCoinFund messages to seed the Master contract with at least 0.75 TON for the five Jetton wallet-credit operations.
- This address is not a VCOIN allocation destination and is not authorized to issue VCOIN; only the founder/owner can submit VCoinMint messages.
- VCoinMaster sends 0.1 TON from its own reserve for each allocation wallet credit. The owner-signed VCoinMint request needs at least 0.01 TON for its own processing.
- CI tests reject gas funding from any other sender and verify that the separate fee wallet can fund the Master without receiving VCOIN.
- No operational-fee top-up or blockchain transaction has been made by this code change.
