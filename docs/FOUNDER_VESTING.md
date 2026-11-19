# V COIN — Founder Vesting Schedule

**Document ID:** VCT-VEST-001  
**Version:** 1.1.0  
**Status:** Implemented and emulator-tested; independent audit and deployment pending  
**Scope:** V-Coin-TON only

## 1. Approved parameters

| Parameter | Value |
|---|---:|
| Allocation | 2,000,000,000 VCOIN |
| Base units | 2,000,000,000,000,000 |
| Decimals | 6 |
| Vesting duration | 48 months |
| Release frequency | Monthly |
| Start event | Explicit on-chain activation at official mining launch |
| Cliff | None; first tranche is due after the first completed monthly interval |
| Beneficiary | Founder TON wallet, supplied privately at deployment |
| Revocation | No unilateral revocation or beneficiary-change method |

## 2. Implemented on-chain flow

The implementation is `contracts/jetton/acton/contracts/VcoinFounderVesting.tolk`.

1. Deploy the vesting contract with a fixed beneficiary and activation-controller address. The Master address and Jetton wallet addresses are initially unset, so the vesting contract address can be fixed before the Master deployment without a circular address dependency.
2. After the Master is deployed, the activation controller sets the Master exactly once.
3. The vesting contract requests its own Jetton Wallet address and the beneficiary's Jetton Wallet address from the authenticated Master. The contract accepts only responses from that Master and stores the two derived addresses. The controller can retry wallet-address discovery if a request bounces.
4. The founder allocation's genesis slot must target the vesting contract address, not the beneficiary's direct wallet.
5. Only the activation controller can activate the vesting clock. The contract records the current on-chain Unix timestamp at the activation message; deployment and genesis issuance do not start the clock.
6. Any caller may trigger a release after a monthly due date. The destination is fixed to the beneficiary. The contract sends a Jetton transfer from its own wallet and waits for a receipt from the beneficiary wallet before advancing the released-tranche counter.
7. A bounced request or a VCOIN wallet transfer-failure notification clears the pending release without increasing the released counter. The same due tranche can then be retried.

The vesting contract has no method to change the beneficiary, activation controller, start timestamp, allocation, or schedule after initialization. There is no admin withdrawal of unvested VCOIN.

## 3. Exact tranche arithmetic

All calculations use integer base units only.

- `base_tranche = 2,000,000,000,000,000 / 48 = 41,666,666,666,666`
- `remainder = 32` base units.
- Tranches 1–47 release exactly 41,666,666,666,666 base units each.
- Tranche 48 releases 41,666,666,666,698 base units.

The sum of all 48 tranches is exactly 2,000,000,000,000,000 base units. No floating-point arithmetic is used.

## 4. Calendar semantics

Monthly due dates use UTC calendar arithmetic, not 30-day approximations. The corresponding day/time is preserved where possible; when a target month is shorter, the date is clamped to that month's final valid day. The original day is restored in later months where valid. Leap years and month-end boundaries are covered by unit tests.

## 5. TON transaction requirements

- Setting the Master requires at least 0.3 TON for the two wallet-address discovery requests.
- Each release request requires at least 1.2 TON; the vesting contract forwards 1 TON to its Jetton Wallet for transfer execution.
- The VCOIN wallet retains a bounded 0.1 TON native reserve when processing genesis acknowledgements and transfer receipts. Wallet balances and reserve levels must be monitored and topped up as needed; this is not a guarantee of five-year storage funding.
- All TON amounts are network execution costs, not VCOIN rewards or founder allocation amounts.

## 6. Test evidence

The Acton emulator suite currently verifies:
1. A release request before the founder Jetton Wallet exists bounces and clears the pending state.
2. The exact five-slot genesis process funds the vesting contract wallet with the approved 2B allocation.
3. The first monthly tranche is transferred to the fixed beneficiary and acknowledged by the beneficiary wallet.
4. The remaining 47 tranches can be released at the 48th monthly due date.
5. The final tranche absorbs the 32-base-unit remainder, leaving the vesting wallet at zero and the beneficiary wallet at exactly 2B VCOIN.
6. January 31, February, leap-year, 30-day month-end and UTC time-of-day calendar cases pass.

The overall TON Acton CI suite reports 19 passing tests, with build, static checks and formatting passing. This is emulator evidence only; it is not an independent security audit or a Mainnet deployment.

## 7. Security and release gate

A backend timer, PostgreSQL row, or UI display is not a token lock. Founder tokens must remain in the on-chain vesting wallet until the contract releases them.

**No Testnet or Mainnet deployment, founder allocation transfer, or activation transaction is authorized by this implementation work.** Deployment requires a reviewed manifest, exact state-init/address verification, independent security review, and separate explicit approval of the exact transaction.
