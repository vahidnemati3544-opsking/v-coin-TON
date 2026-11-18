# V COIN – TON Architecture

**Project:** V COIN – TON  
**Network:** The Open Network (TON)  
**Token standard:** Jetton (TEP-74)  
**Status:** Architecture specification; implementation and deployment remain in progress.

## 1. Scope and separation

V COIN – TON is an independent TON implementation. It must not import, reuse, or modify contracts, addresses, deployment settings, or operational state from the older BNB Smart Chain project.

## 2. System layers

1. TON Jetton contracts: fixed initial supply, Jetton master, standard-compatible Jetton wallets, and controlled allocation.
2. Backend API: user authentication, mining sessions, reward processing, levels, referrals, internal balances, and audit records.
3. PostgreSQL: authoritative application records, transaction-safe operations, reserve accounting, and audit history.
4. Telegram interface: user onboarding, account presentation, mining actions, referrals, and notifications. Telegram is a client, not the authority for balances.
5. Wallet connectivity: Tonkeeper and other TON-compatible wallets through approved connection/signature flows. Private keys and recovery phrases remain with the user.
6. Operations and monitoring: deployment, backups, security logs, reconciliation, and alerting.

## 3. Token design

The approved design in docs/TOKENOMICS.md specifies:

- Initial supply: 10,000,000,000 VCOIN.
- Decimal precision: 6.
- Additional minting: prohibited.
- Founder allocation: 20% (2,000,000,000 VCOIN), subject to a four-year vesting design.
- Mining reserve: 50% (5,000,000,000 VCOIN).
- Treasury: 10%.
- Liquidity and market: 10%.
- Ecosystem and marketing: 10%.

The database reserve migration records the mining allocation in base units. Database records do not create Jettons or prove on-chain ownership.

## 4. Internal balances versus on-chain assets

The backend must distinguish purchased VCOIN records, newly accrued mining rewards, pending and confirmed internal rewards, available and restricted internal balances, tokens transferred to a user's TON wallet, and confirmed on-chain Jetton transfers.

A mining reward shown in the application is not an on-chain token transfer. Transfers must remain disabled until the owner-approved release policy, wallet verification, ledger reconciliation, and contract controls are implemented.

## 5. Mining and reserve

Mining calculations are performed server-side using integer/base-unit arithmetic. Each claim must be idempotent and run in a PostgreSQL transaction. Every newly accrued reward must reserve against the fixed mining allocation; a missing reserve migration or exhausted reserve must cause the claim to roll back.

The approved reserve amount is a hard cap, not a minting permission. The mining engine must never create additional token supply.

## 6. Wallet security

- Private keys and seed phrases must never reach the backend.
- Wallet ownership checks must use a verifiable wallet signature or supported TON connection proof.
- The backend stores public wallet addresses and verification metadata only.
- Transaction details must be presented for explicit user approval.
- Tonkeeper/Gram Wallet connection is not equivalent to custody or permission to spend.

## 7. Network and release gates

Development, TON Testnet, and TON Mainnet must use separate configuration and credentials. Testnet deployment follows local tests and review. Mainnet deployment, initial issuance, liquidity commitment, and irreversible administrative actions require a separate explicit approval.

## 8. Current implementation status

Implemented in the repository:
- PostgreSQL core schema, fixed mining reserve, and atomic reserve controls.
- Node.js health endpoints and database connectivity checks.
- Telegram Mini App HMAC verification, hashed/revocable application sessions, and authenticated account endpoints.
- Authenticated mining status, start, claim, and end API routes.
- Atomic mining reward reservation, confirmation, balanced double-entry ledger posting, and internal balance updates.
- PostgreSQL 18 CI integration tests for reserve settlement and mining session/claim lifecycle.
- Local database setup command applying the schema and both migrations.

Still pending or not yet demonstrated:
- Approved rates and upgrade costs for all 400 levels.
- Telegram bot token configuration and end-to-end Mini App login against the user's bot.
- Local PostgreSQL setup and verification on the user's Windows laptop.
- Tonkeeper/Gram Wallet signature verification.
- TON Jetton contract implementation and Testnet deployment.
- Independent security review, operational monitoring, and Mainnet readiness.

The project must not be described as production-ready or as performing real on-chain mining until these gates pass.
