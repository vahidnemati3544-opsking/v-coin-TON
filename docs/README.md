## Controlling owner instruction — 2026-11-24 (supersedes conflicting legacy wording)

- Fixed total supply: **2,100,000,000 VCOIN**, six decimals; no additional minting.
- Sole initial receiving wallet: Founder-designated **TON Mainnet** address `UQBh9jVKAypc4TrbFx2jsVB2EI1ONChg22zDputisQjENQOT`.
- The entire supply is to reach this wallet in **two separate incoming transfers**. Installment amounts and timing remain to be entered in the transaction plan. Installment 2 occurs only after the Founder explicitly announces and authorizes it. This instruction does not assert that either transfer has occurred.
- After receipt, the Founder personally controls and signs distributions to the four registered allocation wallets: Mining Reserve 1,050,000,000; Treasury 210,000,000; Liquidity/Market 210,000,000; Ecosystem/Marketing 210,000,000 VCOIN. The Founder retains 420,000,000 VCOIN (20%).
- Former Founder address `UQAdW09EvIesUXt9jzLq1T32O0351TaczwWJQLGGmw4aWrzy` was **Testnet-only**. It is historical/test-only and must never be used as the Mainnet receiving address.
- This instruction supersedes direct five-wallet initial issuance, any one-operation five-wallet issuance description, and any designation of the former Founder address as Mainnet.
- Documentation changes do not authorize a Mainnet transaction. The exact deployed Jetton Master, Mainnet status, contract compatibility with the Founder-first two-stage flow, wallet-control proof, installment amounts, fees, and local Sandbox evidence must be verified before signing. Existing fixed-five-destination contract logic must be revised and tested if incompatible.

# V COIN – TON Documentation

This directory contains the authoritative design, implementation-status, and security documents for the independent TON project.

## Controlling approved baseline (2026-11-24)

The current approved baseline is 2,100,000,000 VCOIN at 6 decimals, with no additional minting; allocations are 420M Founder retained, 1.05B Mining Reserve, and 210M each Treasury, Liquidity/Market, and Ecosystem/Marketing. The entire supply is first received by the Founder Mainnet wallet in two transfers; the Founder then signs distributions to the four other registered wallets. The former Founder address was Testnet-only. Execution is Mainnet-only after local engineering verification and explicit Founder authorization; Testnet deployment, transactions, and rehearsal are not authorized. Independent external auditing is not a project workstream, pending task, or release condition. Historical records are subordinate to these current decisions where they conflict.

- [TON Architecture](TON_ARCHITECTURE.md) — system layers, Jetton model, wallet separation, and release gates.
- [API Architecture](API_ARCHITECTURE.md) — implemented health endpoints and planned authenticated APIs.
- [Database Architecture](DATABASE_ARCHITECTURE.md) — PostgreSQL tables, mining reserve, ledger, and outstanding database work.
- [Security and Anti-Fraud](SECURITY_ANTI_FRAUD.md) — current controls, required safeguards, and release restrictions.
- [Tokenomics](TOKENOMICS.md) — approved-for-design token supply and allocation.
- [Purchase and Mining Payout Policy](PURCHASE_AND_MINING_PAYOUT_POLICY.md) — TON purchase settlement, combined level balance, and final mining payout rules.

Architecture documents describe intended behavior unless a section explicitly identifies functionality as implemented. Internal reviews, CI, automated tests, dependency scans, Sandbox tests, and hash checks are engineering verification activities. No document certifies production readiness or authorizes TON Mainnet deployment.

- [Owner Instruction — Founder-first two-stage Mainnet receipt (2026-11-24)](OWNER_INSTRUCTION_2026-11-24.md) — controlling change to initial custody and Founder-signed distribution.

- [Action #66 — Founder-First Two-Stage Mainnet Receipt](OWNER_ACTION_66_FOUNDER_FIRST_RECEIPT.md): records the new owner instruction, completed documentation/template updates, and pending contract/test work.

## Latest repository consistency record

- [Action #65 — Repository Policy Consistency Sweep](REPOSITORY_POLICY_SWEEP_ACTION_65.md): documents the 2026-11-23 correction of superseded historical policy statements and the post-sweep CI status.
