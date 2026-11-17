# V COIN – TON Architecture

**Status:** Architecture baseline — implementation and validation pending  
**Network:** TON  
**Token standard:** Jetton (TEP-74)  
**Scope:** This repository only. The legacy BNB Smart Chain project is out of scope.

## 1. System boundary

V COIN is a Telegram-accessible application backed by a server-authoritative API and PostgreSQL. TON is used for wallet connectivity and verified on-chain Jetton operations. Telegram clients must never calculate or write balances.

## 2. Components and trust boundaries

1. Telegram Bot and Mini App: presentation, Telegram identity hand-off, user actions.
2. Backend API: authentication, authorization, validation, business rules and orchestration.
3. PostgreSQL: users, referrals, levels, ledger, mining sessions, reward reservations and audit trail.
4. Background workers: idempotent jobs for notifications, reconciliation and (only after approval) reward processing.
5. TON adapter: wallet proof verification, Jetton metadata and transaction/event verification.
6. Jetton contracts: on-chain supply and token balances. The contract is authoritative for on-chain ownership.

Private keys and seed phrases must never be collected or stored by V COIN.

## 3. Required dependency order

Infrastructure and secrets → database and migrations → API/authentication → ledger and balance reconciliation → Telegram identity → referral and level services → TON wallet adapter and Jetton contracts → integration tests → controlled mining activation.

Mining is the final operational module. It remains disabled until every prerequisite has passed its acceptance tests and an authorized operator explicitly enables it.

## 4. Financial invariants

- Use integer base units; never use floating-point arithmetic for token amounts.
- Total planned supply: 10,000,000,000 VCOIN; decimals: 6.
- Additional minting is prohibited by the approved design.
- Mining rewards must be reserved from the 5,000,000,000 VCOIN allocation; no reward path may mint tokens.
- Every financial operation has a unique idempotency key and immutable ledger entries.
- Pending internal rewards are not represented as on-chain ownership.
- Purchased, mined, pending, available and on-chain balances remain distinct.
- A database balance is not proof of blockchain ownership.

## 5. Mining activation gates

Mining stays disabled until database migration tests; ledger balancing and reconciliation; authentication and Telegram validation; referral and level tests; TON wallet proof and transaction verification; reserve cap and duplicate-operation tests; security review; backup/restore test; and explicit operator approval have passed.

Before activation, only non-financial simulation is allowed. No real token issuance or transfer is authorized by this architecture.

## 6. Environments

Development, automated test, staging/testnet and production/mainnet configurations must be isolated. Secrets are supplied through environment variables or a secrets manager and are never committed. Mainnet deployment and irreversible contract actions require separate explicit approval.

## 7. Implementation status

This file is an architecture baseline, not evidence of a running or audited system. Each component must be implemented, tested and recorded separately before production claims are made.
