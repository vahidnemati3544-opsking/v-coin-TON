# V COIN–TON Allocation Enforcement and Founder-Control Policy

**Document ID:** VCT-ALLOC-ENF-001  
**Checkpoint:** 2026-11-21  
**Scope:** Tact Jetton candidate in Draft PR #6; V COIN–TON only.  
**Governing policy:** `docs/FOUNDER_AUTHORITY_AND_VESTING_CHARTER.md`  
**Status:** Five issuance caps implemented and CI-tested. Founder 2B direct-to-vesting issuance integration and complete custody review remain open. Not deployed; no transaction authorized.

## 1. Binding governance rule

The Founder has absolute and exclusive operational authority over deposits, withdrawals, and transfers from all five official allocation wallets. The Founder is the sole human decision-maker and signer. No backend role, Telegram bot, administrator, employee, third-party service, or automated contract operator may independently authorize or perform wallet movements.

The only time-based restriction is the Founder's own 2,000,000,000 VCOIN allocation, which follows the approved four-year, zero-cliff, daily-linear vesting schedule. The other four allocations are not escrow-locked and have no mandatory release schedule or third-party approval gate.

The complete binding charter is `docs/FOUNDER_AUTHORITY_AND_VESTING_CHARTER.md`. It supersedes any conflicting prior draft or assistant-generated design recommendation.

## 2. Fixed supply and five allocations

All amounts are whole VCOIN; the contract uses six decimals.

| Category | Cap | Base units | Share | Custody rule |
|---|---:|---:|---:|---|
| Founder | 2,000,000,000 | 2,000,000,000,000,000 | 20% | Four-year vesting only |
| Mining reserve | 5,000,000,000 | 5,000,000,000,000,000 | 50% | Founder absolute wallet control; no lock |
| Treasury | 1,000,000,000 | 1,000,000,000,000,000 | 10% | Founder absolute wallet control; no lock |
| Liquidity / market | 1,000,000,000 | 1,000,000,000,000,000 | 10% | Founder absolute wallet control; no lock |
| Ecosystem / marketing | 1,000,000,000 | 1,000,000,000,000,000 | 10% | Founder absolute wallet control; no lock |
| **Total** | **10,000,000,000** | **10,000,000,000,000,000** | **100%** | No additional minting |

## 3. Actual issuance implementation in Draft PR #6

The Tact master now has five distinct owner-authorized category issuance messages, hard-coded caps, one-time destination configuration, per-category issuance flags, category-tagged outbound messages, and bounce rollback. A failed category can be retried without reopening already successful categories. The master disables minting after all five category amounts have been issued and the exact fixed supply is reached.

This implements the five category issuance caps. It does not by itself implement the full founder vesting custody flow.

## 4. Correct destination and custody architecture

1. Founder allocation: destination must be the dedicated Founder vesting contract's Jetton-wallet owner address, so the 2B allocation is subject to the approved four-year schedule before it becomes freely transferable to the Founder's beneficiary wallet.
2. Mining reserve: destination is the recorded Mining reserve owner wallet, under the Founder's exclusive control. Do not create a Mining escrow or 730-day vesting/lock.
3. Treasury: destination is the recorded Treasury owner wallet, under the Founder's exclusive control.
4. Liquidity / market: destination is the recorded Liquidity/Market owner wallet, under the Founder's exclusive control.
5. Ecosystem / marketing: destination is the recorded Ecosystem/Marketing owner wallet, under the Founder's exclusive control.

The four non-Founder wallets remain ordinary transferable Jetton wallets. Their separation is accounting and reporting separation, not independent custody or restrictions on the Founder's ability to move funds.

The Founder vesting contract must receive the Founder allocation directly, or through a demonstrably safe atomic issuance/funding sequence that never exposes the unvested 2B in an unrestricted wallet. Its beneficiary is immutable and is the Founder's recorded wallet. Its only release schedule is 1,460 daily accrual steps over four years, without a cliff.

## 5. Founder-only authority requirements

- The Founder alone configures the five allocation destinations and authorizes issuance.
- The Founder alone controls deposits, withdrawals, and transfers from each of the five operational wallets.
- No co-signer, committee, third-party administrator, backend account, Telegram bot, or service may obtain independent wallet authority.
- Mining/Treasury/Liquidity/Ecosystem allocations must not be subjected to escrow locks or release schedules.
- The Founder 2B vesting contract enforces only the approved time-based release of that specific allocation; it does not create another person with custody or approval authority.
- Backend and Telegram services may calculate, display, reconcile, and queue proposals only. They must never store keys, sign, or autonomously transfer tokens.

## 6. Remaining implementation and verification gates

1. Integrate the 2B Founder category with the dedicated vesting contract at initial issuance. Verify the authentic Jetton notification and exact 2B amount, and ensure the vesting clock begins only on successful funding.
2. Update and test the Sandbox integration so the Founder allocation is credited directly to vesting, while the other four allocations are credited to the recorded ordinary owner wallets.
3. Verify the Founder can transfer freely from the four non-Founder wallets using the sole authorized wallet signer; no hidden lock or contract release controller may interfere.
4. Test exact four-year daily-linear vesting, no cliff, no early release, full release on day 1,460, duplicate claim rejection, and bounce-safe accounting.
5. Run complete allocation/balance invariants, bounce tests, clean reproducible build, dependency audit, and independent smart-contract audit.
6. Verify control of all five recorded Mainnet wallets and prepare exact deterministic deployment payloads and fee budget for Founder review.
7. Obtain explicit Founder approval for exact build hashes and each irreversible Mainnet transaction.

## 7. Explicitly rejected architecture

The following are not requirements and must not be implemented:

- Mining reserve escrow with 730-day vesting or any other mandatory lock.
- Escrow restrictions on Treasury, Liquidity/Market, or Ecosystem/Marketing.
- Third-party approval, multi-signature, or administrator veto over the Founder's wallet movements.
- Backend or Telegram authority to sign or execute wallet transfers.
- Treating five separate accounting wallets as five independent custodians.

## 8. Release decision

**HOLD** until the Founder 2B direct-to-vesting integration, test suite, reproducible build, independent audit, wallet-control checks, and exact transaction approvals are complete.

No merge, deployment, mint, transfer, or wallet-signing action is authorized by this document. Testnet deployment remains omitted by the Founder's direction.

**Foundational invariant:** Five operational wallets, one exclusive operational authority (the Founder); only the Founder's 2B allocation follows a four-year daily-linear release schedule.
