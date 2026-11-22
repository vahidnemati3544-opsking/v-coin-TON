V COIN – TON Tokenomics

Document version: 1.3
Status: Owner-approved economic design
Network: TON Blockchain
Token standard: Jetton (TEP-74)
Token symbol: VCOIN
Initial USD reference price: 0.008 per VCOIN (modelled reference only; not a market quote or guarantee)

1. Purpose

This document defines the approved token supply, allocation model, distribution principles, and confidentiality requirements for V COIN on TON.

This document records the approved economic design. It does not represent a deployed token or authorize deployment to TON Mainnet.

2. Token specifications

Parameter| Approved specification
Total initial supply| 2,100,000,000 VCOIN
Decimal precision| 6
Token standard| TON Jetton
Additional minting| Not permitted
Network| TON Blockchain

The initial supply is equivalent to 2,100,000,000,000,000 indivisible base units.

The implementation must ensure that the approved initial supply is issued only once and that further minting is permanently disabled through a verified contract mechanism.

Token burning, if supported, must not create any mechanism for issuing replacement tokens.

3. Supply allocation

Allocation| Percentage| Amount
Founder allocation| 20%| 420,000,000 VCOIN
User mining rewards reserve| 50%| 1,050,000,000 VCOIN
Project treasury| 10%| 210,000,000 VCOIN
Liquidity and market| 10%| 210,000,000 VCOIN
Ecosystem development and marketing| 10%| 210,000,000 VCOIN
Total| 100%| 2,100,000,000 VCOIN

The five official allocation destination addresses are recorded in `docs/WALLET_ALLOCATION_REGISTER.md`. Those five addresses are the sole approved allocation destinations unless the project owner explicitly approves a documented change. Tonkeeper and Gram Wallet addresses mentioned for general wallet use are not additional allocation destinations.

4. Founder allocation — immediate full withdrawal right

The founder allocation is fixed at 420,000,000 VCOIN, representing 20% of the total initial supply.

The founder has the explicit right to receive and withdraw the entire 420,000,000 VCOIN allocation at once. No vesting period, monthly installments, time lock, or staged release applies to this allocation.

The founder's full allocation is credited to the founder's designated wallet as one exact allocation. After receipt, the founder controls and may transfer or withdraw the full amount, subject to ordinary TON network rules and applicable law.

No additional founder allocation is authorized by this document.

5. User mining rewards

A total of 1,050,000,000 VCOIN is reserved for user mining rewards.

The distribution model has a minimum target period of two years.

The two-year period is a minimum planning target, not an automatic expiration date for the rewards reserve. Distribution may continue until the approved reserve has been fully distributed, subject to the final reward rules.

Mining rates, level requirements, anti-fraud controls, and distribution schedules must be defined in the mining specification.

The rewards system must distribute only from the pre-existing reserve and must not mint additional tokens.

6. Project treasury

A 210,000,000 VCOIN allocation is reserved for project treasury purposes.

Public project documentation must not disclose the founder's identity, the treasury controller's identity, or confidential treasury addresses and operational details.

Any treasury operations must follow applicable legal requirements and the project's internal security and accounting controls.

7. Liquidity and market allocation

A total of 210,000,000 VCOIN is allocated to liquidity and market-related purposes.

The exact deployment strategy, liquidity venues, lock arrangements, and release controls remain subject to a separate approved implementation plan.

8. Ecosystem development and marketing

A total of 210,000,000 VCOIN is allocated to ecosystem development and marketing.

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
Immediate, unrestricted founder access to the full 420,000,000 VCOIN founder allocation.
Secure accounting and transaction verification.
Contract implementation must be reviewed against the applicable TON standards and security requirements.

11. Testing and deployment restrictions

The implementation must undergo reproducible local builds, comprehensive TON Sandbox testing, functional verification, and independent smart-contract security review before any Mainnet deployment.
Local TON Sandbox tests are required but are not a substitute for Testnet. Complete a real TON Testnet deployment and full five-wallet issuance rehearsal before Mainnet.
Mainnet deployment requires a separate, explicit approval after the exact source commit, compiled artifacts, code-cell and StateInit hashes, metadata, wallet-control proofs, independent audit, and transaction details have been reviewed.
No Mainnet deployment, initial issuance, liquidity commitment, or irreversible administrative action is authorized by this document.

12. Change control

Any change to the total supply, allocation percentages, founder's immediate full-withdrawal right, or prohibition on additional minting requires explicit approval from the project owner and an updated version of this document.

Document status: Owner-approved tokenomics design — implementation pending.

13. Smart contract specification

The technical specification for the VCOIN TON Jetton Master and Wallet contracts is maintained in docs/JETTON_CONTRACT_SPEC.md. This is a design specification, not compiled contract source code or deployment evidence. Implementation, compilation, tests, independent security review and Testnet deployment remain subject to the release gates. The deployment parameter template is contracts/jetton/deployment.config.template.json.

14. Official wallet allocation register

The canonical five-wallet allocation map is maintained in docs/WALLET_ALLOCATION_REGISTER.md. The register is part of the approved design baseline. Address ownership, wallet control, Jetton wallet derivation, on-chain balances and transfers must still be independently verified before any issuance or payout. The register does not authorize deployment or transfer by itself.

15. Modelled USD reference-price policy

- Initial modelled USD reference baseline: 0.008 per VCOIN.
- Approved target: 50% compound growth per 365-day year, applied gradually.
- Backend cadence: one modelled update every 72 hours, using a fixed-point multiplier of 1.003338149181 (approximately 0.3338149181% per 72-hour period).
- The annualized multiplier is approximately 1.5 over 365 days.
- This is an internal modelled reference schedule only. It is not a market quote, exchange price, guaranteed value, or promise of returns.
- This price model does not change the fixed on-chain supply, allocation percentages, or holder control of the Jetton balances.
