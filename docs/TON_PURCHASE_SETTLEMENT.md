# V COIN — TON Purchase and Reserve Settlement

**Document ID:** VCT-PAY-001  
**Version:** 1.0.0  
**Status:** Architecture and security requirements; implementation and tests pending  
**Scope:** V-Coin-TON only

## 1. Approved payment destination

A buyer pays TON directly to the founder's designated TON wallet. TON is not routed through the VCOIN Jetton Master, a vesting contract, or a project-controlled escrow contract. Once the TON transfer is received, the founder retains immediate control and may withdraw or use it at any time.

The founder's 2 billion VCOIN allocation is a separate asset and remains locked under the 48-month vesting schedule beginning at official mining activation.

## 2. Required purchase lifecycle

1. Backend creates a unique order and short-lived quote.
2. Quote records the network, exact TON nanotons amount, VCOIN base-unit amount, exchange-rate snapshot, expiry, and unique order ID.
3. User sends TON to the exact founder recipient address with the order reference in a supported payload/comment where wallet compatibility allows. If a memo cannot be reliably attached, payment matching must use an explicit unique and verified sender/order association; ambiguous transfers must be held for manual reconciliation, never guessed.
4. Blockchain watcher independently reads the transaction from a trusted TON data source.
5. Verifier checks network, exact recipient, successful transaction, amount, confirmation/finality policy, order reference, quote expiry, and transaction uniqueness.
6. Database transaction atomically marks the payment accepted and reserves the corresponding VCOIN amount from the funded reserve distribution balance.
7. A separately authorized reserve Jetton wallet/distributor sends VCOIN to the buyer's verified TON owner wallet.
8. Backend verifies the outgoing Jetton transaction and recipient Jetton wallet.
9. Order becomes completed only after confirmed VCOIN delivery. All intermediate states are auditable and recoverable.

## 3. Mandatory security controls

- Unique database constraints on network + payment transaction hash and on order settlement.
- Idempotency key for every payment verification and payout request.
- Replay protection: one inbound TON transaction can settle at most one order.
- No payout from client callbacks, screenshots, frontend assertions or unverified transaction hashes.
- Exact integer nanotons and Jetton base units; no floating-point monetary arithmetic.
- Reject wrong-network, failed, wrong-recipient, underpaid, expired, duplicate and already-consumed transactions.
- Define deterministic handling for overpayments, underpayments, refunds and ambiguous payments before enabling purchases.
- Reserve balance must be checked and reserved atomically; no minting is allowed to satisfy a purchase.
- Payout worker must reconcile the actual on-chain Jetton transfer before marking the order complete.
- Failed or bounced payouts must remain recoverable without charging the buyer twice.
- Log order IDs, transaction hashes, state transitions and failure reasons; never log private keys or seed phrases.

## 4. Custody separation

The founder TON receiving address and the reserve Jetton signing authority are different controls. Receipt of TON by the founder does not grant backend authority to move reserve VCOIN. Reserve transfers require an explicitly approved signer/wallet process. Signing must happen in a secure wallet or isolated signer; private keys and recovery phrases must never be committed to GitHub, stored in PostgreSQL, placed in environment examples, or pasted into chat.

## 5. Configuration gates

Purchases remain disabled until all of the following are configured and tested: network-specific founder receiving address supplied through private deployment configuration; exact exchange-rate source and quote policy; quote lifetime and payment confirmation/finality policy; robust transaction parser and order matching; reserve Jetton wallet address and authorized signing method; atomic reserve reservation and payout reconciliation; duplicate, replay, wrong-network, underpayment, overpayment, expiry and bounced-transfer tests.

No exchange rate is assumed by this document. A displayed reference price is not automatically a binding sale price.

## 6. Operational states

created -> awaiting_payment -> payment_confirmed -> reserve_reserved -> payout_submitted -> completed

Exceptional states include expired, underpaid, overpaid_review, payment_rejected, payout_failed, and manual_reconciliation. State transitions must be monotonic and auditable. Retrying a worker must not create a second VCOIN transfer.

## 7. Release gate

This document is not a payment processor implementation. Purchases must remain disabled until the watcher, verifier, database constraints, reserve signer integration, payout reconciliation and adversarial tests are implemented and independently reviewed.