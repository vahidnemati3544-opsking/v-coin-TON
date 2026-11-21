V COIN – TON Tokenomics

Document version: 1.2
Status: Approved for design
Network: TON Blockchain
Token standard: Jetton (TEP-74)
Token symbol: VCOIN

1. Purpose

This document defines the approved token supply, allocation model, distribution principles, and confidentiality requirements for V COIN on TON.

This document records the approved economic design. It does not represent a deployed token or authorize deployment to TON Mainnet.

2. Token specifications

Parameter| Approved specification
Total initial supply| 10,000,000,000 VCOIN
Decimal precision| 6
Token standard| TON Jetton
Additional minting| Not permitted
Network| TON Blockchain

The initial supply is equivalent to 10,000,000,000,000,000 indivisible base units.

The implementation must ensure that the approved initial supply is issued only once and that further minting is permanently disabled through a verified contract mechanism.

Token burning, if supported, must not create any mechanism for issuing replacement tokens.

3. Supply allocation

Allocation| Percentage| Amount
Founder allocation| 20%| 2,000,000,000 VCOIN
User mining rewards reserve| 50%| 5,000,000,000 VCOIN
Project treasury| 10%| 1,000,000,000 VCOIN
Liquidity and market| 10%| 1,000,000,000 VCOIN
Ecosystem development and marketing| 10%| 1,000,000,000 VCOIN
Total| 100%| 10,000,000,000 VCOIN

The five official allocation destination addresses are recorded in `docs/WALLET_ALLOCATION_REGISTER.md`. Those five addresses are the sole approved allocation destinations unless the project owner explicitly approves a documented change. Tonkeeper and Gram Wallet addresses mentioned for general wallet use are not additional allocation destinations.

4. Founder allocation

The founder allocation is fixed at 2,000,000,000 VCOIN, representing 20% of the total initial supply.

The full 2,000,000,000 VCOIN allocation is immediately and fully transferable under the Founder's sole authority. No vesting, cliff, time lock, escrow, daily release schedule, withdrawal ceiling, or other restriction applies.

No additional founder allocation is authorized by this document.

5. User mining rewards

A total of 5,000,000,000 VCOIN is reserved for user mining rewards.

The distribution model has a minimum target period of two years.

The two-year period is a minimum planning target, not an automatic expiration date for the rewards reserve. Distribution may continue until the approved reserve has been fully distributed, subject to the final reward rules.

Mining rates, level requirements, anti-fraud controls, and distribution schedules must be defined in the mining specification.

The rewards system must distribute only from the pre-existing reserve and must not mint additional tokens.

6. Project treasury

A 1,000,000,000 VCOIN allocation is reserved for project treasury purposes.

Public project documentation must not disclose the founder's identity, the treasury controller's identity, or confidential treasury addresses and operational details.

Any treasury operations must follow applicable legal requirements and the project's internal security and accounting controls.

7. Liquidity and market allocation

A total of 1,000,000,000 VCOIN is allocated to liquidity and market-related purposes.

The exact deployment strategy, liquidity venues, lock arrangements, and release controls remain subject to a separate approved implementation plan.

8. Ecosystem development and marketing

A total of 1,000,000,000 VCOIN is allocated to ecosystem development and marketing.

Permitted uses and distribution procedures must be documented before funds are committed.

9. Confidentiality policy

Public-facing materials must not identify:

- The founder.
- The country of origin or development.
- The identity of the treasury controller.
- Confidential treasury addresses or internal treasury operations.

The project must not claim absolute on-chain anonymity. TON is a public blockchain, and transactions and balances may be observable or linked through blockchain analysis.

Confidentiality in public communications does not remove applicable legal, regulatory, KYC, AML, or reporting obligations.

10. Technical implementation principles

The token must be implemented using TON's Jetton architecture, including:
Standard-compatible Jetton Wallet contracts.
Fixed initial supply.
Verified disabling of additional minting.
Controlled allocation and distribution of the approved reserves.
Founder allocation directly credited to the ordinary Founder Jetton wallet; no vesting or escrow.
Secure accounting and transaction verification.
Contract implementation must be reviewed against the applicable TON standards and security requirements.

11. Testing and deployment restrictions

The implementation must undergo local testing, TON Testnet deployment, functional verification, and independent security review before any Mainnet deployment.
Mainnet deployment requires a separate, explicit approval.
No Mainnet deployment, initial issuance, liquidity commitment, or irreversible administrative action is authorized by this document.

12. Change control

Any change to the total supply, allocation percentages, unrestricted Founder authority, or prohibition on additional minting requires explicit approval from the project owner and an updated version of this document.

Document status: Approved tokenomics design — implementation pending.

13. Smart contract specification

The technical specification for the VCOIN TON Jetton Master and Wallet contracts is maintained in docs/JETTON_CONTRACT_SPEC.md. This is a design specification, not compiled contract source code or deployment evidence. Implementation, compilation, tests, independent security review and Testnet deployment remain pending. The deployment parameter template is contracts/jetton/deployment.config.template.json. Null allocation addresses must be explicitly approved before deployment; no Founder vesting parameters exist.

14. Official wallet allocation register

The canonical five-wallet allocation map is maintained in docs/WALLET_ALLOCATION_REGISTER.md. The register is part of the approved design baseline. Address ownership, wallet control, Jetton wallet derivation, on-chain balances and transfers must still be independently verified before any issuance or payout. The register does not authorize deployment or transfer by itself.
