## Controlling owner instruction — 2026-11-24 (supersedes conflicting legacy wording)

- Fixed total supply: **2,100,000,000 VCOIN**, six decimals; no additional minting.
- Sole initial receiving wallet: Founder-designated **TON Mainnet** address `UQBh9jVKAypc4TrbFx2jsVB2EI1ONChg22zDputisQjENQOT`.
- The entire fixed supply is received by the Founder Mainnet wallet through five separate, sequential, Founder-authorized stages: 420,000,000; 1,050,000,000; 210,000,000; 210,000,000; and 210,000,000 VCOIN. Each stage requires a fresh Founder announcement and signature, and the next stage is blocked until the preceding Founder Jetton-wallet credit is independently confirmed. This does not assert that any receipt has occurred.
- After receipt, the Founder personally controls and signs distributions to the four registered allocation wallets: Mining Reserve 1,050,000,000; Treasury 210,000,000; Liquidity/Market 210,000,000; Ecosystem/Marketing 210,000,000 VCOIN. The Founder retains 420,000,000 VCOIN (20%).
- Former Founder address `UQAdW09EvIesUXt9jzLq1T32O0351TaczwWJQLGGmw4aWrzy` was **Testnet-only**. It is historical/test-only and must never be used as the Mainnet receiving address.
- This instruction supersedes direct five-wallet initial issuance, any one-operation five-wallet issuance description, and any designation of the former Founder address as Mainnet.
- Documentation changes do not authorize a Mainnet transaction. The exact deployed Jetton Master, Mainnet status, contract compatibility with the Founder-first five-stage flow, wallet-control proof, exact five-stage amounts, fees, and local Sandbox evidence must be verified before signing. The five-stage contract implementation must pass exact-head CI, local Sandbox, deployed-Master compatibility, source-wallet, and address/hash checks before any signing.

# V COIN – TON Founder Authority and Allocation Control

**Document ID:** VCT-GOV-001  
**Status:** Approved design direction; implementation and legal review pending  
**Network:** TON  
**Token:** VCOIN, Jetton (TEP-74)  
**Founder Mainnet receiving wallet:** `UQBh9jVKAypc4TrbFx2jsVB2EI1ONChg22zDputisQjENQOT`  
**GAS & OPERATIONS wallet:** Same as Founder allocation destination (shared role; not a sixth wallet)

## 1. Purpose and scope

This document defines the founder's operational authority over VCOIN issuance, custody, allocation and treasury distributions. It applies only to the independent TON project and does not modify or reuse the legacy BNB project.

The Founder Mainnet receiving wallet is also the sole GAS & OPERATIONS wallet. It first receives the entire fixed supply through five separate, sequential Founder-authorized receipt stages; the Founder then signs the four other allocation distributions.

## 2. Fixed supply

- USD reference price: 0.004 per VCOIN (modelled reference only; not a market quote or guarantee).

- Initial supply: 2,100,000,000 VCOIN.
- Decimals: 6.
- Base units: 2,100,000,000,000,000.
- Additional minting: permanently disabled after the single initial issuance.
- No replacement minting after burns.
- The Jetton master and wallet implementation must be checked against TEP-74 through engineering verification and local tests before deployment. Independent external auditing is not a project workstream or release condition.

The no-additional-minting rule is an immutable supply constraint. Founder authority does not include creating tokens beyond the approved initial supply.

## 3. Founder authority model

The founder is the sole operational authority for the project's unallocated treasury and distribution process, subject to the deployed contract's immutable rules, TON network consensus, wallet security, and applicable law.

Founder-controlled operations include:
- approving each allocation and recipient;
- deciding the timing and amount of each transfer from founder-controlled custody;
- approving, signing, submitting, or declining each transaction;
- pausing project-side distribution workflows before a transaction is signed;
- managing authorized backend operators and project services;
- maintaining the allocation register and reconciliation records.

All on-chain transfers require a signature from the controlling wallet (or a separately approved multisig, if the founder later chooses one). Backend administrators cannot forge wallet signatures or move on-chain assets without the required wallet authorization.

## 4. Important limits of authority

A founder cannot unilaterally reverse a confirmed TON transaction or seize tokens after they have been transferred to an independently controlled recipient wallet, unless a separately disclosed and audited token design explicitly provides such a capability and users have accepted it.

Accordingly, this project will not describe founder authority as the ability to reverse all transfers or control users' private wallets. The default design is founder approval before release, not undisclosed post-transfer confiscation.

The Founder retains 420,000,000 VCOIN as the 20% Founder allocation, without vesting or lock. The full 2,100,000,000 supply is initially received by the Founder wallet through five separate, sequential Founder-authorized receipt stages; these are custody/receipt stages, not vesting. After receipt, the Founder signs distributions to the four other allocation wallets. Do not add hidden freeze, confiscation or arbitrary clawback functions.

## 5. Approved allocation register

| Allocation | Share | Amount |
|---|---:|---:|
| Founder | 20% | 420,000,000 VCOIN |
| User mining reserve | 50% | 1,050,000,000 VCOIN |
| Project treasury | 10% | 210,000,000 VCOIN |
| Liquidity and market | 10% | 210,000,000 VCOIN |
| Ecosystem and marketing | 10% | 210,000,000 VCOIN |
| **Total** | **100%** | **2,100,000,000 VCOIN** |

The Founder Mainnet receiving address and four allocation destination addresses are maintained in `docs/WALLET_ALLOCATION_REGISTER.md`. The Founder receives the full fixed supply through five separate, sequential Founder-authorized receipt stages and then signs distribution of 1.05B Mining, 210M Treasury, 210M Liquidity/Market, and 210M Ecosystem/Marketing. The Founder retains 420M VCOIN (20%). The mining reserve is funded by the Founder-signed distribution and must never mint new tokens.

## 6. Operational TON network-fee funding

The Founder Mainnet receiving wallet is the sole GAS & OPERATIONS wallet, deployment signer and initial supply receiving wallet. Its address is recorded in `docs/WALLET_ALLOCATION_REGISTER.md`. It is distinct from the four other allocation destinations.

TON deposits intended for deployment, Master reserve funding and authorized network fees must use this same Founder wallet. Verify the exact address in Tonkeeper and confirm TON Mainnet before funding or signing. Transaction-specific fee requirements must be checked against the exact payload and live network estimate; never assume that one attached amount covers every operation.

Never request, store, log or transmit seed phrases, private keys, PINs or recovery codes.

## 7. Transaction lifecycle

Every allocation transfer must follow this sequence:

1. Create a distribution proposal with a unique ID.
2. Record allocation category, recipient address, network, Jetton master, amount in integer base units, and purpose.
3. Validate recipient address and network; reject malformed or mismatched addresses.
4. Verify sufficient available allocation and prevent duplicate proposal IDs.
5. Present the exact transaction details to the founder in the wallet interface.
6. Founder independently reviews and signs or rejects the transaction.
7. Submit the signed transaction; do not mark it complete based on a client callback alone.
8. Verify the transaction and Jetton transfer against a trusted TON data source and confirm finality.
9. Reconcile the reserve, allocation register and transaction record.
10. Preserve an append-only audit record with transaction hash, timestamps, status and operator identity.

A transaction must remain pending or failed until independently verified on-chain. Retries must be idempotent and must not duplicate a transfer.

## 8. Required security controls

- Verify founder wallet ownership with a TON Connect proof/signature challenge; a pasted address is not proof of control.
- Bind every transaction to the approved network and exact VCOIN Jetton master address.
- Never ask for, store, log or transmit a seed phrase or private key.
- Use integer base units only; never use floating-point arithmetic for token amounts.
- Enforce allocation caps in transactional database operations.
- Require unique idempotency keys and append-only audit history.
- Separate local-development and Mainnet credentials, endpoints and databases. Testnet deployment and transactions are not authorized.
- Keep distribution disabled when chain data is stale, inconsistent or unavailable.
- Perform the project's defined engineering verification and deployment checks before Mainnet use.

## 9. Release gates

The following are not yet established by this document:
- a completed Jetton master and wallet contract implementation;
- passing local contract tests and reproducible build artifacts;
- completed local TON Sandbox deployment/allocation/transfer tests;
- verified founder wallet proof;
- verified Mainnet deployment address and transaction;
- internal source review, automated tests, TON Sandbox verification, and reproducible build/hash checks;
- legal and compliance review for the intended jurisdictions.

No token should be represented as issued, transferable or available for extraction until the relevant on-chain evidence exists.

## 10. Operational record

The Founder allocation address is also the sole GAS & OPERATIONS address. Before deployment or funding, verify this single address and TON Mainnet network in Tonkeeper. The Jetton master address, deployment transaction, code hash, metadata and allocation transfers must be added here only after independently verified.