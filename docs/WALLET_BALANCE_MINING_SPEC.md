# V COIN–TON Wallet-Balance Mining Specification

**Document ID:** VCT-WALLET-MINING-001  
**Revision:** 1.0.0  
**Status:** Owner-approved business rule; implementation and verification pending  
**Scope:** V COIN–TON only. The legacy BNB Smart Chain project is out of scope.

## 1. Binding owner decision

The balance used to calculate the next mining reward is the user's **verified, on-chain VCOIN Jetton balance in the user's linked TON wallet used through Telegram**.

The internal mining-bot balance is not the source of truth for the next mining interval. A displayed internal reward, pending reward, or unconfirmed withdrawal must never be counted as wallet balance.

## 2. Reward formula

- Reward rate: 1% per 24 hours.
- Same formula at every level from 1 through 400; level does not multiply or reduce the reward.
- VCOIN precision: 6 decimals; all calculations use integer Jetton base units.
- For a fixed verified wallet-balance snapshot:

  `reward_base_units = floor(wallet_snapshot_base_units * elapsed_ms / 8,640,000,000)`

- The maximum accrual interval and missed-claim policy must be explicitly configured and tested before unattended operation. The existing 24-hour hard rejection is not silently changed by this document.

## 3. Source of truth and wallet verification

A wallet balance is eligible only when all of the following are true:

1. The user has authenticated through valid Telegram Mini App init data.
2. The TON wallet address has been linked using a supported wallet-ownership proof (for example, a verified TON Connect proof/signature flow); a pasted address or Telegram username alone is not proof.
3. The address is a valid TON address on the configured network.
4. The VCOIN Jetton wallet is resolved against the single approved VCOIN Jetton master contract address. A native TON balance, another Jetton, or a look-alike token is never eligible.
5. The balance is fetched from a trusted TON blockchain/indexer provider and the response is validated for network, master address, owner address, decimals, and confirmation/finality status.
6. The balance snapshot is timestamped and tied to the verified owner wallet, Jetton master, network, and source block/transaction context.
7. If the provider is unavailable, stale, inconsistent, or cannot prove the correct Jetton, mining start/claim fails closed. The backend must not fall back to an internal database balance.

The Jetton master address, network (Testnet or Mainnet), and approved data-provider configuration are required deployment inputs. They must not be guessed or copied from an unrelated token.

## 4. Mining and payout lifecycle

1. Link and verify the user's TON wallet.
2. Read and validate its VCOIN Jetton balance.
3. At the beginning of an accrual interval, persist an immutable wallet-balance snapshot and source metadata.
4. Calculate the interval reward from that snapshot only. Deposits arriving during the interval apply to the next interval, not retroactively.
5. Record the earned reward in the internal double-entry ledger as **pending/withdrawable internal reward**, backed by the 5,000,000,000 VCOIN mining allocation. It is not yet an on-chain token in the user's wallet.
6. Transfer the approved reward amount to the user's verified Jetton wallet through a controlled payout operation. Use a unique operation/idempotency key and reconcile the outgoing TON transaction.
7. Mark the payout complete only after the correct Jetton transfer is verified on-chain and reaches the required finality/confirmation state. Failed, bounced, pending, or ambiguous transfers must not be marked paid.
8. Only after successful on-chain payout, take a fresh verified wallet-balance snapshot for the next mining interval. The next reward is based on that wallet balance, including the VCOIN actually received.
9. Never add the same reward both to the wallet snapshot and to an internal balance snapshot. Never treat an internal pending reward as an on-chain holding.

## 5. Double-counting and replay protection

- Each mining interval has one immutable source snapshot and one unique reward operation.
- Each payout has one unique operation key and one verified on-chain transaction identity.
- Retries return the original result; they must not create a second reward or second transfer.
- The internal ledger, mining reserve, payout records, and on-chain transaction must reconcile by exact integer base units.
- A reward cannot be counted as wallet balance before its transfer is confirmed.
- A withdrawal must not create eligibility until the on-chain Jetton balance actually reflects the transfer.
- Wallet changes, ownership-proof expiry/revocation, or a mismatched Jetton master invalidate the eligibility snapshot.

## 6. Failure and safety policy

Fail closed for stale or unavailable blockchain data, invalid wallet proof, wrong network, wrong Jetton master, bounced transfer, inconsistent transaction, reserve exhaustion, duplicate/replayed operation, or ledger imbalance. No fallback to a user-supplied balance or internal available balance is allowed.

Private keys and seed phrases must never be requested, stored, logged, or sent to the backend. Signing must remain in the user's wallet.

## 7. Required implementation components

- TON wallet-linking and ownership-proof verification.
- Configured VCOIN Jetton master and network validation.
- Trusted on-chain Jetton balance reader with freshness/finality checks.
- Immutable wallet-balance snapshots and source metadata.
- Mining engine refactored to consume only verified wallet snapshots.
- Separate internal pending-reward ledger and withdrawal/payout state machine.
- TON Jetton transfer adapter and on-chain transaction reconciliation.
- Idempotency, concurrency, reserve, replay, bounced-transfer, and rollback tests.
- Telegram Mini App end-to-end test with the owner's wallet on TON Testnet.

## 8. Current incompatibility / release gate

The current code in `contracts/mining/engine.js` and `contracts/mining/backend/src/routes/mining.js` calculates rewards from the internal PostgreSQL `balances.available_base_units` field and credits mining rewards back into that internal balance. It does **not** yet read a verified TON Jetton wallet balance, prove wallet ownership, send Jettons, or reconcile on-chain payouts.

Therefore the current internal-balance mining implementation is not compliant with this approved wallet-balance rule and must not be activated as the user's extraction flow. A code commit or green unit test alone cannot remove this gate.

## 9. Inputs required before Testnet implementation

- Approved VCOIN Jetton master contract address for the target network.
- TON network selection (Testnet for rehearsal; Mainnet requires separate approval).
- Trusted TON data-provider/API configuration and credentials stored privately.
- Wallet-connect/ownership-proof method and Telegram Mini App origin.
- Payout sender architecture and signing custody policy; backend must not hold a user's recovery phrase.
- Explicit operational claim cadence and missed-claim policy.

No token address, provider, or signing custody model may be invented. Mainnet transfer and public mining remain disabled until independent review and explicit owner approval.
