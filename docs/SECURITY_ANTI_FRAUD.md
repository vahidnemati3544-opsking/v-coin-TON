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

## 9. Founder-only financial authority and explicit re-authorization gate

**Policy status:** Owner-approved governance requirement. Technical enforcement, deployment, and independent verification remain pending.

### 9.1 Exclusive financial authority

- The project founder is the sole authority for treasury custody, financial approvals, token allocation, reserve release, payment destinations, and any transfer or withdrawal of TON or VCOIN.
- Technical, advisory, marketing, maintenance, and operations personnel must not receive financial signing authority or independent permission to move, allocate, release, or withdraw project funds or tokens.
- Team access must be limited to the minimum non-financial permissions required for their assigned duties. Backend, database, deployment, and administrative access must not by itself provide a path to sign or execute a treasury transfer.
- Treasury signing keys must remain under the founder's exclusive control. If a 2-of-3 multisignature arrangement is selected, all three signing keys must be controlled by the founder and stored separately with strong device and backup security. No team member or external adviser may be a signer.
- No seed phrase or private key may be requested, transmitted to the project team, stored in application servers, or committed to source control.

### 9.2 Assistant access and consent boundary

- Before the mining/extraction launch begins, the founder's current authorization permits the assistant to inspect and prepare changes to the project's financial-governance and treasury-related documentation and code, within the approved V COIN–TON repository and scope.
- From the moment mining/extraction begins, the assistant must obtain fresh, explicit approval from the founder before each new access session or action that enters, inspects, changes, configures, or operates the protected financial domain.
- The protected financial domain includes treasury and reserve configuration, signing and authorization policies, token allocations, payout and withdrawal flows, sale settlement destinations, financial ledgers, and code or settings that can initiate or authorize movement of TON or VCOIN.
- A previous approval, standing project access, or general permission to continue development does not count as fresh approval after mining/extraction has begun.
- Ordinary non-financial engineering work may continue without this additional financial-domain approval, provided it does not inspect, change, or affect protected financial controls, balances, destinations, or transfer capabilities.
- If it is unclear whether a task enters or affects the protected financial domain, stop before accessing or changing that area and ask the founder for explicit approval.


- The approval request must be made before opening or reviewing the protected financial material, not after access has occurred. The request must identify the specific file, subsystem, or operation and the intended scope. Approval applies only to the scope and session expressly authorized; it does not create blanket or continuing permission.
- Read-only inspection is also considered access and requires fresh approval after mining/extraction has begun. If no clear approval is received, do not access the protected area.

### 9.3 Transaction and deployment safeguards

- Documentation approval is not authorization to sign or broadcast a blockchain transaction.
- Every real-value transfer, token allocation, reserve release, treasury destination change, or production financial activation requires a separate explicit founder approval at the point of execution.
- Smart contracts and backend services must enforce least privilege and fail closed: missing authorization, invalid configuration, or failed verification must prevent financial execution.
- All privileged financial actions must be attributable to the founder's authorization and recorded in tamper-evident audit logs.
- These requirements do not authorize mining activation, token issuance, Testnet/Mainnet deployment, or any real-value transfer. Those remain subject to separate readiness checks and explicit approval.

