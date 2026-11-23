# V COIN – TON Documentation

This directory contains the authoritative design, implementation-status, and security documents for the independent TON project.

## Controlling approved baseline (2026-11-23)

The current approved baseline is 2,100,000,000 VCOIN at 6 decimals, with no additional minting; allocations are 420M Founder (immediate, no vesting), 1.05B Mining Reserve, and 210M each Treasury, Liquidity/Market, and Ecosystem/Marketing. The Founder wallet is also the sole GAS & OPERATIONS wallet; the project has five allocation wallets, not six. Execution is Mainnet-only after local engineering verification and explicit Founder authorization; Testnet deployment, transactions, and rehearsal are not authorized. Independent external auditing is not a project workstream, pending task, or release condition. Historical records are subordinate to these current decisions where they conflict.

- [TON Architecture](TON_ARCHITECTURE.md) — system layers, Jetton model, wallet separation, and release gates.
- [API Architecture](API_ARCHITECTURE.md) — implemented health endpoints and planned authenticated APIs.
- [Database Architecture](DATABASE_ARCHITECTURE.md) — PostgreSQL tables, mining reserve, ledger, and outstanding database work.
- [Security and Anti-Fraud](SECURITY_ANTI_FRAUD.md) — current controls, required safeguards, and release restrictions.
- [Tokenomics](TOKENOMICS.md) — approved-for-design token supply and allocation.
- [Purchase and Mining Payout Policy](PURCHASE_AND_MINING_PAYOUT_POLICY.md) — TON purchase settlement, combined level balance, and final mining payout rules.

Architecture documents describe intended behavior unless a section explicitly identifies functionality as implemented. Internal reviews, CI, automated tests, dependency scans, Sandbox tests, and hash checks are engineering verification activities. No document certifies production readiness or authorizes TON Mainnet deployment.

## Latest repository consistency record

- [Action #65 — Repository Policy Consistency Sweep](REPOSITORY_POLICY_SWEEP_ACTION_65.md): documents the 2026-11-23 correction of superseded historical policy statements and the post-sweep CI status.
