# V COIN – TON Founder Authority and Allocation Control

**Document ID:** VCT-GOV-001  
**Status:** Approved design direction; implementation and legal review pending  
**Network:** TON  
**Token:** VCOIN, Jetton (TEP-74)  
**Founder allocation destination:** `UQAdW09EvIesUXt9jzLq1T32O0351TaczwWJQLGGmw4aWrzy`  
**GAS & OPERATIONS wallet:** Same as Founder allocation destination (shared role; not a sixth wallet)

## 1. Purpose and scope

This document defines the founder's operational authority over VCOIN issuance, custody, allocation and treasury distributions. It applies only to the independent TON project and does not modify or reuse the legacy BNB project.

The Founder allocation destination is also the sole GAS & OPERATIONS wallet. It is one of the five VCOIN allocation destinations; the GAS & OPERATIONS designation is a shared operational role, not a sixth wallet.

## 2. Fixed supply

- USD reference price: 0.008 per VCOIN (modelled reference only; not a market quote or guarantee).

- Initial supply: 2,100,000,000 VCOIN.
- Decimals: 6.
- Base units: 2,100,000,000,000,000.
- Additional minting: permanently disabled after the single initial issuance.
- No replacement minting after burns.
- The Jetton master and wallet implementation must conform to TEP-74 and pass local tests and independent review before deployment.

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

If stronger custody controls are required for a particular allocation, use a disclosed vesting/escrow contract with documented release, cancellation and beneficiary rights. Do not add hidden freeze, confiscation or arbitrary clawback functions.

## 5. Approved allocation register

| Allocation | Share | Amount |
|---|---:|---:|
| Founder | 20% | 420,000,000 VCOIN |
| User mining reserve | 50% | 1,050,000,000 VCOIN |
| Project treasury | 10% | 210,000,000 VCOIN |
| Liquidity and market | 10% | 210,000,000 VCOIN |
| Ecosystem and marketing | 10% | 210,000,000 VCOIN |
| **Total** | **100%** | **2,100,000,000 VCOIN** |

The exact five allocation owner addresses are maintained in `docs/WALLET_ALLOCATION_REGISTER.md`. The Founder allocation is immediate and has no vesting, time lock, monthly installments or staged release. No Founder vesting contract or schedule is required or authorized. The mining reserve is a pre-existing allocation; mining rewards must be paid from this reserve and must never mint new tokens.

## 6. Operational TON network-fee funding

The Founder allocation wallet is also the sole GAS & OPERATIONS wallet, deployment signer and Master reserve funder. Its address is recorded in the Founder row of `docs/WALLET_ALLOCATION_REGISTER.md`. No separate operational-fee address or sixth wallet exists.

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
- Perform independent smart-contract review and deployment verification before Mainnet use.

## 9. Release gates

The following are not yet established by this document:
- a completed Jetton master and wallet contract implementation;
- passing local contract tests and reproducible build artifacts;
- completed local TON Sandbox deployment/allocation/transfer tests;
- verified founder wallet proof;
- verified Mainnet deployment address and transaction;
- independent security review;
- legal and compliance review for the intended jurisdictions.

No token should be represented as issued, transferable or available for extraction until the relevant on-chain evidence exists.

## 10. Operational record

The Founder allocation address is also the sole GAS & OPERATIONS address. Before deployment or funding, verify this single address and TON Mainnet network in Tonkeeper. The Jetton master address, deployment transaction, code hash, metadata and allocation transfers must be added here only after independently verified.