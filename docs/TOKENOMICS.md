## Controlling owner instruction — 2026-11-24 (supersedes conflicting legacy wording)

- Fixed total supply: **2,100,000,000 VCOIN**, six decimals; no additional minting.
- Sole initial receiving wallet: Founder-designated **TON Mainnet** address `UQBh9jVKAypc4TrbFx2jsVB2EI1ONChg22zDputisQjENQOT`.
- The entire fixed supply is received by the Founder Mainnet wallet through five separate, sequential, Founder-authorized stages: 420,000,000; 1,050,000,000; 210,000,000; 210,000,000; and 210,000,000 VCOIN. Each stage requires a fresh Founder announcement and signature, and the next stage is blocked until the preceding Founder Jetton-wallet credit is independently confirmed. This does not assert that any receipt has occurred.
- After receipt, the Founder personally controls and signs distributions to the four registered allocation wallets: Mining Reserve 1,050,000,000; Treasury 210,000,000; Liquidity/Market 210,000,000; Ecosystem/Marketing 210,000,000 VCOIN. The Founder retains 420,000,000 VCOIN (20%).
- Former Founder address `UQAdW09EvIesUXt9jzLq1T32O0351TaczwWJQLGGmw4aWrzy` was **Testnet-only**. It is historical/test-only and must never be used as the Mainnet receiving address.
- This instruction supersedes direct five-wallet initial issuance, any one-operation five-wallet issuance description, and any designation of the former Founder address as Mainnet.
- Documentation changes do not authorize a Mainnet transaction. The exact deployed Jetton Master, Mainnet status, contract compatibility with the Founder-first five-stage flow, wallet-control proof, exact five-stage amounts, fees, and local Sandbox evidence must be verified before signing. The five-stage contract implementation must pass exact-head CI, local Sandbox, deployed-Master compatibility, source-wallet, and address/hash checks before any signing.

V COIN – TON Tokenomics

Document version: 1.5
Status: Owner-approved economic design
Network: TON Blockchain
Token standard: Jetton (TEP-74)
Token symbol: VCOIN
Initial USD reference price: 0.004 per VCOIN (modelled reference only; not a market quote or guarantee)

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

The Founder retains 420,000,000 VCOIN (20%) as the Founder allocation, without vesting or lock. Separately, the entire fixed initial supply of 2,100,000,000 VCOIN is first received by the designated Founder TON Mainnet wallet through five separate, sequential Founder-authorized receipt stages. The installment amounts and timing must be entered in a transaction plan; installment 2 requires a fresh explicit Founder announcement/authorization. After receipt, the Founder personally signs distributions of the four other allocations to their registered destination wallets: Mining 1,050,000,000; Treasury 210,000,000; Liquidity/Market 210,000,000; Ecosystem/Marketing 210,000,000 VCOIN. These transfers do not create additional tokens.

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
Founder-first receipt of the full fixed supply through five separate, sequential Founder-authorized receipt stages, followed by Founder-signed distribution of the four other allocations; Founder retains 420,000,000 VCOIN.
Secure accounting and transaction verification.
Contract implementation must be reviewed against the applicable TON standards and security requirements.

11. Testing and deployment restrictions

The implementation must undergo reproducible local builds, comprehensive TON Sandbox testing, functional verification, and the project's defined engineering verification, local TON Sandbox testing, clean-room rebuild, live fee/reserve checks, and explicit Founder authorization before any Mainnet deployment.
Local TON Sandbox tests and full five-wallet issuance simulation are required. Under the current owner execution instruction, no TON Testnet deployment or Testnet transaction is authorized. Do not use Testnet addresses, balances, or payloads.
Mainnet deployment requires a separate, explicit approval after the exact source commit, compiled artifacts, code-cell and StateInit hashes, metadata, wallet-control proofs, and transaction details have been reviewed.
No Mainnet deployment, initial issuance, liquidity commitment, or irreversible administrative action is authorized by this document.

12. Change control

Any change to the total supply, allocation percentages, founder's immediate full-withdrawal right, or prohibition on additional minting requires explicit approval from the project owner and an updated version of this document.

Document status: Owner-approved tokenomics design — implementation pending.

13. Smart contract specification

The technical specification for the VCOIN TON Jetton Master and Wallet contracts is maintained in docs/JETTON_CONTRACT_SPEC.md. This is a design specification, not compiled contract source code or deployment evidence. Implementation, compilation, local Sandbox tests, the project's engineering verification and Mainnet release gates remain mandatory. Testnet deployment and transactions are not authorized. The deployment parameter template is contracts/jetton/deployment.config.template.json.

14. Official wallet allocation register

The canonical five-wallet allocation map is maintained in docs/WALLET_ALLOCATION_REGISTER.md. The register is part of the approved design baseline. Address ownership, wallet control, Jetton wallet derivation, on-chain balances and transfers must still be independently verified before any issuance or payout. The register does not authorize deployment or transfer by itself.

15. Modelled USD reference-price policy

- Initial modelled USD reference baseline: 0.004 per VCOIN.
- Approved target: 50% compound growth per 365-day year, applied gradually.
- Backend cadence: one modelled update every 72 hours, using a fixed-point multiplier of 1.003338149181 (approximately 0.3338149181% per 72-hour period).
- The annualized multiplier is approximately 1.5 over 365 days.
- This is an internal modelled reference schedule only. It is not a market quote, exchange price, guaranteed value, or promise of returns.
- This price model does not change the fixed on-chain supply, allocation percentages, or holder control of the Jetton balances.


16. TON purchase, level calculation, and final mining payout policy

- A user purchase exchanges TON for already-issued VCOIN. The TON consideration is directed to the Founder allocation wallet; the corresponding VCOIN is transferred from the Founder Jetton wallet to the user's verified Jetton wallet. Purchases never invoke minting.
- The user's level-qualifying amount is the sum of eligible purchased VCOIN and eligible mining rewards. Ledger history must continue to distinguish purchased and mining-origin balances.
- Mining rewards remain internal eligible claims during the mining period. They must not be represented as VCOIN already held in the user's TON wallet.
- Following the Founder's formal announcement that mining has ended, the project reconciles all claims against the fixed 1,050,000,000 VCOIN mining allocation and transfers each user's approved reward from the mining-reserve Jetton wallet to the user's verified Jetton wallet.
- A payout is complete only after successful on-chain confirmation. Unique idempotency keys, anti-replay controls, bounce/failure handling, and immutable accounting are mandatory.
- This policy does not increase the 2,100,000,000 VCOIN total supply and does not permit additional minting.
