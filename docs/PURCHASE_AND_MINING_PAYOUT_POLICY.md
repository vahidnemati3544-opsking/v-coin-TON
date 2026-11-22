# V COIN – TON Purchase, Level Balance, and Mining Payout Policy

**Document ID:** VCT-FIN-001  
**Status:** Owner-approved business rules; implementation and end-to-end verification pending  
**Network:** TON Blockchain  
**Asset:** VCOIN Jetton (TEP-74)  
**Fixed total supply:** 2,100,000,000 VCOIN  
**Mining allocation cap:** 1,050,000,000 VCOIN  
**Decimals:** 6

## 1. Purpose and authority

This document records the project owner's required financial flow for TON purchases, level calculation, and the final distribution of mining rewards. It applies only to V COIN–TON. It does not authorize a Mainnet transaction, deployment, token issuance, or transfer.

## 2. Fixed supply and mining cap

The total initial supply is exactly 2,100,000,000 VCOIN (2,100,000,000,000,000 base units). The mining allocation is exactly 1,050,000,000 VCOIN (1,050,000,000,000,000 base units), representing 50% of total supply. No additional minting is permitted. The old 5,000,000,000 VCOIN value in migration 001 is historical; migration 005-vcoin-supply-and-price-reset.sql corrects the development database reserve to 1,050,000,000 VCOIN and refuses to proceed if existing pending/distributed rewards exceed the cap.

## 3. TON-to-VCOIN purchase

1. The user initiates a purchase through the Telegram Mini App / wallet flow and selects the amount.
2. The system creates a unique order containing the TON amount, VCOIN amount, quote expiry, intended network, and the user's verified TON wallet destination.
3. The TON payment is directed to the Founder allocation wallet:
   `UQAdW09EvIesUXt9jzLq1T32O0351TaczwWJQLGGmw4aWrzy`
4. After the exact payment is verified as successful and final on the intended TON network, the corresponding already-issued VCOIN is transferred from the Founder Jetton wallet to the user's verified Jetton wallet.
5. The purchase is a transfer of existing VCOIN, never a mint. The amount deliverable through this route is limited by the available, unencumbered VCOIN balance in the Founder wallet's approved 420,000,000 VCOIN allocation. It cannot consume the mining reserve or another allocation without a separately approved policy change.
6. The backend reconciles the TON payment and VCOIN delivery using transaction hashes, exact amounts, sender/recipient, approved Jetton master, unique order ID, and idempotency key.
7. The order is not marked complete until both payment receipt and VCOIN delivery are verified. If delivery fails or bounces after payment, it remains an exception (unpaid delivery) for a controlled retry or refund process; never silently mark it complete.

The exact swap quote, price source, spread/fees, expiry, refund rules, and transaction sponsorship mechanism must be disclosed and implemented before purchases are enabled. No guaranteed market value or investment return is implied.

## 4. Level-qualifying balance

For the user's level calculation:

**Level-qualifying VCOIN = eligible purchased VCOIN + eligible mining rewards**

The two sources are combined for determining the user's level and level progression. They must remain separately classified in the immutable financial ledger and account history. Pending, rejected, reversed, ineligible, or already-paid rewards must not be double-counted. A level upgrade must atomically verify the next level and approved cost, debit the appropriate eligible balance, post balanced ledger entries, and update the level.

The exact rules for whether purchased VCOIN is spendable for upgrades, whether mining rewards are spendable before final payout, and how level-upgrade debits affect eventual payout must be implemented consistently and shown to the user. No balance may be spent twice.

## 5. Mining accrual and final payout

1. During the mining period, mining rewards accrue as internal eligible claims in the user's account. They are not yet VCOIN in the user's external TON wallet.
2. The backend reserves every reward against the fixed 1,050,000,000 VCOIN mining allocation. Pending plus distributed rewards must never exceed this cap.
3. Only after the Founder formally announces that mining has ended may the close process begin.
4. The close process freezes further accrual, validates account eligibility, reconciles all mining claims and ledger entries against the reserve, resolves disputes/anti-fraud flags, and validates each user's verified TON wallet destination.
5. A final payout manifest is generated and independently reconciled. Approved rewards are transferred from the designated mining-reserve Jetton wallet to each user's verified Jetton wallet.
6. A payout is marked paid only after the transaction is verified successful and final on TON. Bounced, failed, pending, or ambiguous transfers remain unpaid and must be handled with idempotent retry controls.
7. Total payouts may not exceed 1,050,000,000 VCOIN. No additional minting or replacement minting is allowed.

## 6. Accounting, security, and founder authority

- Use integer base units only; one VCOIN equals 1,000,000 base units.
- Maintain append-only double-entry accounting for TON receipts, VCOIN deliveries, mining accruals, level-upgrade debits, reserve movements, and final payouts.
- Keep purchase balances, mining claims, on-chain wallet balances, and already-paid rewards distinguishable.
- Verify wallet ownership through a supported wallet proof; a pasted address alone is insufficient.
- Use unique idempotency keys, replay protection, rate limits, fraud controls, and immutable audit events.
- The Founder retains the project's authorized custody and transaction-signing authority. Automated processing must not bypass Founder-controlled approvals or TON wallet signatures.
- Never request, store, or transmit seed phrases, private keys, PINs, or recovery codes.

## 7. Implementation status and release gates

These rules are approved business requirements, not proof that the features are live. The repository must still implement and test the purchase order lifecycle, TON payment verification, VCOIN delivery from the Founder Jetton wallet, combined level-qualifying balance, upgrade debits, mining close/freeze, payout manifest, reserve settlement, and confirmed on-chain payout. Complete local tests, integration tests, TON Sandbox coverage, qualified independent security review, independent clean-room rebuild, live fee/reserve review, and explicit Founder approvals before Mainnet use. No Testnet deployment or transaction is authorized under the current execution policy.

**No Mainnet transaction or payout is authorized by this document.**
