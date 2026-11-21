# V COIN – TON Documentation

This directory contains the authoritative design and security documents for the independent TON project.

- [TON Architecture](TON_ARCHITECTURE.md) — system layers, Jetton model, wallet separation, and release gates.
- [API Architecture](API_ARCHITECTURE.md) — implemented health endpoints and planned authenticated APIs.
- [Database Architecture](DATABASE_ARCHITECTURE.md) — PostgreSQL tables, mining reserve, ledger, and outstanding database work.
- [Security and Anti-Fraud](SECURITY_ANTI_FRAUD.md) — current controls, required safeguards, and release restrictions.
- [Tokenomics](TOKENOMICS.md) — approved-for-design token supply and allocation.

Architecture documents describe intended behavior unless a section explicitly identifies functionality as implemented. They do not certify production readiness or authorize TON Mainnet deployment.


## Binding governance addendum — 2026-11-21

This project document is governed by [Founder Exclusive Five-Wallet Control](FOUNDER_EXCLUSIVE_FIVE_WALLET_CONTROL.md). The Founder alone has absolute, exclusive operational control and signing authority over all five V COIN–TON allocation wallets; wallet separation is for accounting only. No employee, administrator, backend, Telegram bot, CI process, third party, multisig co-signer, escrow, vesting, time lock, withdrawal ceiling, or automated process may authorize, veto, delay, redirect, sign, or execute a Founder-authorized movement.

Each TEP-74 Jetton Wallet validates transfers against its own `owner` address. Master ownership alone does not grant withdrawal/clawback rights over other wallets. The approved design requires Founder-exclusive signing control of all five recorded owner addresses and local Founder signing; no hidden seizure path is permitted. Backend/Telegram may read, account, reconcile and prepare unsigned proposals only. Wallet-control evidence is tracked separately; never expose secrets. This addendum does not authorize deployment, minting, transfer, signing, or broadcast.
