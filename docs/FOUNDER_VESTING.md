# V COIN — Founder Vesting Schedule

**Document ID:** VCT-VEST-001  
**Version:** 1.0.0  
**Status:** Approved economic rules; on-chain implementation and tests pending  
**Scope:** V-Coin-TON only

## 1. Approved parameters

| Parameter | Value |
|---|---:|
| Allocation | 2,000,000,000 VCOIN |
| Base units | 2,000,000,000,000,000 |
| Decimals | 6 |
| Vesting duration | 48 months |
| Release frequency | Monthly |
| Start event | Official mining activation |
| Cliff | None; first tranche is due after the first completed monthly interval |
| Beneficiary | Founder TON wallet, supplied privately at deployment |
| Revocation | Not permitted unless separately approved |

## 2. Start-time rule

The vesting clock MUST NOT start at repository creation, contract compilation, contract deployment, token issuance, or the first test transaction. It starts only when the owner formally activates mining on the intended production network and the activation timestamp is recorded in the reviewed activation transaction/state.

The activation timestamp is immutable once recorded. Testnet rehearsals must use a separate test configuration and must not establish the production vesting start.

## 3. Exact tranche arithmetic

All calculations use integer base units only. The implementation must compute:

- base_tranche = total_base_units / 48
- remainder = total_base_units % 48
- Tranches 1–47 release base_tranche each.
- Tranche 48 releases base_tranche + remainder.

The sum of all 48 tranches must equal exactly 2,000,000,000,000,000 base units. No floating-point arithmetic is permitted.

## 4. Release conditions

A release is permitted only when its monthly due time has passed and the requested tranche has not already been released. The contract must calculate due tranches from the immutable mining activation timestamp; prevent early release; prevent duplicate release and replay; release only to the fixed beneficiary; maintain a monotonically increasing released-tranche counter; reject attempts to change the beneficiary, start timestamp, total allocation, or schedule after activation; and expose getters sufficient to verify total allocation, start timestamp, released amount, next due tranche and beneficiary.

The implementation must define calendar-month semantics precisely. Recommended rule: due date is the corresponding UTC calendar date/time in each subsequent month, clamping to the last valid day of shorter months. This must be implemented and tested consistently; do not approximate a month as 30 days.

## 5. Security boundary

A backend timer, PostgreSQL row, or UI display is NOT a token lock. Founder tokens must be held by an on-chain vesting contract or another independently reviewed and demonstrably enforceable lock mechanism. The founder's TON purchase proceeds are a separate asset and are sent directly to the founder's TON wallet; they are not part of this VCOIN vesting allocation.

## 6. Required tests

1. No release before the first monthly due date.
2. One tranche becomes releasable at each monthly due date.
3. Multiple elapsed months can be released without skipping or duplication.
4. Duplicate release requests do not release twice.
5. February, leap years, 30/31-day month boundaries and UTC boundaries.
6. Tranche arithmetic sums exactly to the approved base-unit allocation.
7. Final tranche absorbs the integer remainder.
8. Beneficiary and activation timestamp cannot be changed after initialization.
9. Testnet start timestamp is isolated from production configuration.

**Release gate:** No founder allocation transfer or vesting deployment until source code is compiled, tests pass, the contract is independently reviewed, and the exact deployment transaction is separately approved.