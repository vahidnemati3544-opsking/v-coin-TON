# V COIN – TON Founder Authority and Allocation Control

**Document ID:** VCT-GOV-001  
**Status:** Approved design direction; implementation and legal review pending  
**Network:** TON  
**Token:** VCOIN, Jetton (TEP-74)  
**Owner wallet proposed by founder:** `UQCOZYJNI3HC6PN1YCy1cP-ikKPygoVUQlX2SIcJ_zEWJeGB`

## 1. Purpose and scope

This document defines the founder's operational authority over VCOIN issuance, custody, allocation and treasury distributions. It applies only to the independent TON project and does not modify or reuse the legacy BNB project.

The address above is a user-provided public address. It is not yet cryptographically verified as controlled by the founder and must not be hard-coded as an authenticated administrator until a wallet-signature challenge has been completed on the selected network.

## 2. Fixed supply

- Initial supply: 10,000,000,000 VCOIN.
- Decimals: 6.
- Base units: 10,000,000,000,000,000.
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
| Founder | 20% | 2,000,000,000 VCOIN |
| User mining reserve | 50% | 5,000,000,000 VCOIN |
| Project treasury | 10% | 1,000,000,000 VCOIN |
| Liquidity and market | 10% | 1,000,000,000 VCOIN |
| Ecosystem and marketing | 10% | 1,000,000,000 VCOIN |
| **Total** | **100%** | **10,000,000,000 VCOIN** |

Founder allocation remains subject to the approved four-year vesting design. The exact vesting contract and schedule must be specified before implementation. The mining reserve is a pre-existing allocation; mining rewards must be paid from this reserve and must never mint new tokens.

## 6. Transaction lifecycle

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

## 7. Required security controls

- Verify founder wallet ownership with a TON Connect proof/signature challenge; a pasted address is not proof of control.
- Bind every transaction to the approved network and exact VCOIN Jetton master address.
- Never ask for, store, log or transmit a seed phrase or private key.
- Use integer base units only; never use floating-point arithmetic for token amounts.
- Enforce allocation caps in transactional database operations.
- Require unique idempotency keys and append-only audit history.
- Separate Testnet and Mainnet credentials, endpoints and databases.
- Keep distribution disabled when chain data is stale, inconsistent or unavailable.
- Perform independent smart-contract review and deployment verification before Mainnet use.

## 8. Release gates

The following are not yet established by this document:
- a completed Jetton master and wallet contract implementation;
- passing local contract tests and reproducible build artifacts;
- successful Testnet deployment and end-to-end Jetton transfers;
- verified founder wallet proof;
- verified Mainnet deployment address and transaction;
- independent security review;
- legal and compliance review for the intended jurisdictions.

No token should be represented as issued, transferable or available for extraction until the relevant on-chain evidence exists.

## 9. Operational record

The proposed founder wallet address is recorded above only as a candidate. Before deployment it must be verified by a fresh wallet challenge on the chosen network. The Jetton master address, deployment transaction, code hash, metadata and allocation transfers must be added here only after independently verified.
