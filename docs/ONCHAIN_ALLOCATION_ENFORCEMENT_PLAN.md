# V COIN–TON Allocation Enforcement and Founder-Control Policy

**Document ID:** VCT-ALLOC-ENF-001  
**Checkpoint:** 2026-11-21  
**Scope:** Tact Jetton candidate in Draft PR #6; V COIN–TON only.  
**Governing policy:** `docs/FOUNDER_AUTHORITY_CHARTER.md` v1.1.0  
**Status:** Five category issuance caps implemented; Founder 2B is an ordinary directly credited wallet balance. Vesting contract removed from active build/test configuration. Not deployed; no transaction authorized.

## 1. Binding governance rule

The Founder has absolute, exclusive, and unrestricted authority over deposits, withdrawals, and transfers from all five allocation wallets. The Founder is the sole human decision-maker and signer. No backend role, Telegram bot, administrator, employee, third-party service, escrow, vesting contract, time lock, withdrawal ceiling, or automated process may independently authorize or restrict a Founder-authorized wallet movement.

The Founder 2,000,000,000 VCOIN allocation is fully transferable immediately upon issuance. The previous four-year zero-cliff daily-linear vesting requirement is revoked and must not be implemented or retained in the active deployment build.

## 2. Fixed supply and five allocations

All amounts are whole VCOIN; the contract uses six decimals.

| Category | Cap | Base units | Share | Custody rule |
|---|---:|---:|---:|---|
| Founder | 2,000,000,000 | 2,000,000,000,000,000 | 20% | Ordinary transferable wallet; no lock |
| Mining reserve | 5,000,000,000 | 5,000,000,000,000,000 | 50% | Founder absolute control; no lock |
| Treasury | 1,000,000,000 | 1,000,000,000,000,000 | 10% | Founder absolute control; no lock |
| Liquidity / market | 1,000,000,000 | 1,000,000,000,000,000 | 10% | Founder absolute control; no lock |
| Ecosystem / marketing | 1,000,000,000 | 1,000,000,000,000,000 | 10% | Founder absolute control; no lock |
| **Total** | **10,000,000,000** | **10,000,000,000,000,000** | **100%** | No additional minting |

## 3. Issuance implementation

The Tact master uses five distinct owner-authorized category issuance messages, hard-coded caps, one-time destination configuration, per-category issuance flags, category-tagged outbound messages, and bounce rollback. A failed category can be retried without reopening successful categories. Minting is permanently disabled after all five category amounts are issued and exact fixed supply is reached.

The Founder category destination is the Founder's ordinary owner wallet, just like the other four allocation destinations. There is no vesting or escrow intermediary.

## 4. Founder-only authority

- The Founder alone configures the five allocation destinations and authorizes initial issuance.
- The Founder alone controls every deposit, withdrawal, and transfer from all five wallets.
- The five wallets are separate for accounting only; they are not independent custodians.
- Backend and Telegram services may calculate, display, reconcile, and queue proposals only. They must never store keys, sign, or autonomously transfer tokens.
- Fixed issuance caps constrain initial minting only; they do not restrict subsequent transfers by the Founder.

## 5. Explicitly prohibited

- Four-year vesting, cliff, daily release, or any other lock on the Founder 2B allocation.
- Founder allocation routed to a vesting or escrow contract.
- Mining escrow with 730-day vesting or any other mandatory lock.
- Escrow restrictions on Treasury, Liquidity/Market, or Ecosystem/Marketing.
- Third-party approval, multi-signature, administrator veto, withdrawal ceiling, or automated transfer authority.
- Treating the five accounting wallets as five independent custodians.

## 6. Verification gates

1. Confirm the Founder category destination equals the recorded Founder Mainnet owner address and is not a vesting-contract address.
2. Add/retain Sandbox tests proving the Founder 2B is credited directly to the Founder Jetton wallet and can be transferred without a time-based restriction.
3. Confirm all other four categories are credited to their recorded ordinary owner wallets.
4. Run exact allocation/balance invariants, natural bounce and retry tests, clean reproducible build, dependency audit, and independent smart-contract audit.
5. Verify Founder control of all five recorded Mainnet wallets and prepare deterministic deployment payloads and fee budget for review.
6. Obtain explicit Founder approval for exact build hashes and each irreversible Mainnet transaction.

## 7. Release decision

**HOLD** until code/tests, reproducible build, independent audit, wallet-control checks, and exact transaction approvals are complete. No merge, deployment, mint, transfer, or wallet-signing action is authorized here. Testnet deployment remains omitted by the Founder's direction.

**Invariant: Five allocation wallets; one exclusive operational authority; no vesting or escrow restriction on any allocation.**
