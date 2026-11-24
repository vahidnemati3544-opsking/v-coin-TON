## Controlling owner instruction — 2026-11-24 (supersedes conflicting legacy wording)

- Fixed total supply: **2,100,000,000 VCOIN**, six decimals; no additional minting.
- Sole initial receiving wallet: Founder-designated **TON Mainnet** address `UQBh9jVKAypc4TrbFx2jsVB2EI1ONChg22zDputisQjENQOT`.
- The full supply is received by this wallet through **five separate, sequential Founder-signed receipt stages**: 420,000,000; 1,050,000,000; 210,000,000; 210,000,000; and 210,000,000 VCOIN. Each stage requires a fresh Founder signature after the prior Founder Jetton-wallet credit is acknowledged. This records the approved contract flow; it does not assert that any receipt has occurred.
- After all five receipts, the Founder personally signs distributions to the four registered allocation wallets: Mining Reserve 1,050,000,000; Treasury 210,000,000; Liquidity/Market 210,000,000; Ecosystem/Marketing 210,000,000 VCOIN. The Founder retains 420,000,000 VCOIN (20%).
- Former Founder address `UQAdW09EvIesUXt9jzLq1T32O0351TaczwWJQLGGmw4aWrzy` was **Testnet-only**. It is historical/test-only and must never be used as the Mainnet receiving address.
- This instruction supersedes direct five-wallet initial issuance, the earlier two-stage draft, and any designation of the former Founder address as Mainnet.
- Documentation changes do not authorize a Mainnet transaction. The exact deployed Jetton Master, Mainnet status, contract compatibility with the five-stage Founder-first flow, wallet-control proof, installment amounts, fees, and local Sandbox evidence must be verified before signing. The merged five-stage Founder-first contract implementation and its exact-head CI evidence are recorded in Action #70; no deployment or token receipt is implied.

[Owner Action #83 — Repository-wide five-stage Founder-first alignment](docs/OWNER_ACTION_83_REPOSITORY_FIVE_STAGE_ALIGNMENT.md)

V COIN – TON

Independent TON Blockchain Ecosystem

V COIN is an independent blockchain ecosystem project designed to build a secure, scalable and transparent digital economy on The Open Network (TON).

Project Vision

Our vision is to develop a sustainable digital ecosystem combining blockchain technology, digital payments, token economics and Telegram-based user experiences.

Core Components

- TON Native Token: Independent token architecture built for the TON ecosystem.
- Mining & Rewards: A structured user reward and extraction system.
- Level System: User progression and upgrade mechanisms.
- Digital Wallet: Secure wallet connectivity and asset management.
- Internal Accounting: Transparent balance tracking and transaction records.
- Digital Payments: A foundation for future global digital payment services.
- Telegram Integration: User access and ecosystem interaction through Telegram.

Architecture Principles

- TON-native development.
- Security-first engineering.
- Transparent token economics.
- Modular and scalable architecture.
- Independent implementation.
- Auditable financial records.
- User-focused wallet security.

Approved Project Baseline

- Fixed initial supply: **2,100,000,000 VCOIN**, with 6 decimals and no additional minting.
- Allocation: Founder retains 420,000,000 (20%); Mining 1,050,000,000 (50%); Treasury, Liquidity/Market, and Ecosystem/Marketing 210,000,000 each (10%). The full supply is first received by the Founder Mainnet wallet in five sequential, separately signed stages, then the Founder signs distributions to the four other wallets.
- The Founder Mainnet wallet is the initial receiving wallet and sole GAS & OPERATIONS signer; four other wallets receive their allocations only through Founder-signed distributions.
- Execution policy: local engineering verification and TON Sandbox first, then Mainnet only after explicit Founder authorization. Testnet deployment, transactions, and rehearsal are not authorized.
- Independent external auditing is not a project workstream, pending task, or release condition.

Security Status

Security is a development priority. The project records its actual engineering checks and implementation status without claiming external certification or approval. As of 2026-11-23, no external security-audit company has been contracted or engaged for V COIN–TON. Independent auditing is not a defined project workstream, pending task, or release condition. Internal source reviews, CI workflows, automated tests, dependency scans, Sandbox tests, and hash checks are engineering verification activities only; they do not constitute external certification.

Mainnet deployment and issuance remain subject to the project's technical release checks and explicit Founder authorization. No security certification or external approval is claimed.

Documentation

Detailed architecture, API, database, security and tokenomics documents are maintained in the docs/ directory. Start with docs/README.md.

Development Status

V COIN – TON is under development.

The components described in this document represent the project's architecture and development objectives. They should not be interpreted as confirmation that all features are currently operational.

Important Notice

V COIN does not promise investment returns or guaranteed token value. All token distribution, reward mechanisms and financial features are subject to technical validation and applicable legal requirements.

---

Project: V COIN – TON
Network: The Open Network (TON)
Repository: V-Coin-TON
Status: In Development
