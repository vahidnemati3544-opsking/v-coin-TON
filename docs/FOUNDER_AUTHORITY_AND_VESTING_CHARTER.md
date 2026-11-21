# V COIN–TON Founder Authority and Founder Allocation Vesting Charter

**Document ID:** VCT-GOV-FOUNDER-001  
**Version:** 1.0.0  
**Adopted in project records:** 2026-11-21  
**Applies to:** V COIN–TON only. The separate BNB project is unaffected.  
**Authority:** Founder's explicit, non-amendable project instruction.

## 1. Foundational and non-amendable rule

The Founder has **absolute and exclusive operational authority** over deposits, withdrawals, transfers, and other wallet movements for all five official V COIN–TON operational allocation wallets:

1. Founder allocation wallet
2. Mining reserve wallet
3. Treasury wallet
4. Liquidity and market wallet
5. Ecosystem and marketing wallet

The Founder is the sole authorized human decision-maker and signer for movements from these five wallets. No employee, administrator, backend role, Telegram bot, smart-contract operator, committee, third-party service, or automated process may independently authorize, initiate, veto, redirect, or execute a wallet movement. Software may prepare, validate, or record an operation, but it must not acquire independent custody or signing authority.

This rule is a foundational governance invariant. It must be reflected consistently in smart-contract design, wallet operations, backend permissions, Telegram integration, security policy, deployment documents, and future project changes. It must not be weakened by introducing Mining, Treasury, Liquidity, Ecosystem, or other operational escrow locks that prevent the Founder from exercising the authority described here.

## 2. The only allocation-specific restriction: Founder 2B vesting

The only time-based restriction in the approved token allocation is the Founder's own **2,000,000,000 VCOIN** allocation (20% of total supply).

That allocation is subject to the approved four-year, zero-cliff, daily-linear release schedule documented in the project tokenomics and vesting specification:

- Total: 2,000,000,000 VCOIN (2,000,000,000,000,000 base units at six decimals).
- Duration: 1,460 daily accrual steps over four years (4 × 365 days).
- No cliff; release accrues daily from the authenticated vesting start event.
- The vested amount is claimable by and delivered only to the Founder's immutable beneficiary wallet.
- The vesting mechanism applies only to this 2B Founder allocation. It does not impose a vesting schedule, withdrawal lock, or discretionary release approval on the other four allocation wallets.

The Founder retains sole authority over the vesting configuration operation and over the beneficiary wallet. The schedule is a restriction on when the unvested portion of the Founder's 2B allocation becomes transferable from the vesting contract; it is not a transfer of governance or signing authority to another person or service.

## 3. The other four allocations are not escrow-locked

The remaining allocations are:

| Allocation | Amount | Operational authority |
|---|---:|---|
| Mining reserve | 5,000,000,000 VCOIN | Founder has absolute and exclusive wallet-movement authority |
| Treasury | 1,000,000,000 VCOIN | Founder has absolute and exclusive wallet-movement authority |
| Liquidity / market | 1,000,000,000 VCOIN | Founder has absolute and exclusive wallet-movement authority |
| Ecosystem / marketing | 1,000,000,000 VCOIN | Founder has absolute and exclusive wallet-movement authority |

These allocations remain separately accounted for and separately addressed. Separation is for transparent accounting, reporting, and operational organization; it does **not** create independent custodians, co-signers, spending committees, automatic release schedules, or restrictions on the Founder's transfers.

In particular, a Mining escrow with a 730-day lock, a mandatory release schedule, or a third-party approval gate is not part of the approved governance model and must not be introduced.

## 4. Technical implementation requirements

1. The five recorded Mainnet owner-wallet addresses and their allocation amounts remain the official destination map; do not ask the Founder to repeat addresses already recorded in the project records.
2. Prove that the Founder controls each wallet on the intended network before preparing irreversible transactions. This is verification of the Founder's control, not a transfer of control to another party.
3. The four non-Founder allocation wallets must remain ordinary transferable Jetton wallets controlled exclusively by the Founder. No Mining/Treasury/Liquidity/Ecosystem escrow or release controller may block the Founder's transfers.
4. The 2B Founder allocation must be placed under the dedicated four-year vesting mechanism before it becomes freely transferable. The vesting contract's immutable beneficiary is the Founder's recorded wallet.
5. The issuance design must route the Founder 2B directly into the vesting mechanism (or prove an equally safe atomic funding sequence) so that an unrestricted intermediate balance cannot bypass the schedule.
6. The Founder alone authorizes configuration and any operation requiring the Founder's signature. The contract may enforce the 2B vesting arithmetic, fixed total supply, and one-time allocation caps, but must not introduce another human or service as a signer.
7. Backend and Telegram services may calculate, display, reconcile, and queue proposed operations. They must never hold wallet keys, sign transactions, or autonomously withdraw or transfer from the five wallets.
8. Never request, store, or commit seed phrases or private keys. The Founder signs locally through the approved wallet.

## 5. Conflict resolution and precedence

This Charter supersedes any earlier draft, architecture note, checklist, PR description, or assistant-generated recommendation that:

- requires a Mining reserve escrow or 730-day vesting/lock;
- subjects the four non-Founder wallets to a release schedule or third-party approval;
- describes escrow withdrawals from all five allocations as the required custody model;
- suggests that wallet separation means separate operators or independent spending authority; or
- implies that the Founder lacks absolute operational authority over any of the five wallets.

The four-year daily-linear vesting restriction on the Founder's 2B allocation remains in force and is not waived by the Founder's control of the other wallets.

## 6. Release and safety

This Charter defines governance; it does not authorize deployment, minting, transfers, or signing. The PR remains Draft/unmerged until the implementation, tests, reproducible build, and independent security review are complete and the Founder approves the exact transaction payloads.

**Invariant:** Five wallets, one operational authority — the Founder. One and only one time-locked allocation — the Founder's 2B VCOIN over four years.
