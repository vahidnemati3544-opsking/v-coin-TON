# V COIN–TON Founder Authority Charter

**Document ID:** VCT-GOV-FOUNDER-001  
**Version:** 1.1.0  
**Adopted:** 2026-11-21  
**Scope:** V COIN–TON only; the separate BNB project is unaffected.  
**Authority:** Founder's explicit, non-amendable project instruction.

## 1. Foundational rule

The Founder has **absolute, exclusive, and unrestricted operational authority** over deposits, withdrawals, transfers, and every other movement of VCOIN from all five official allocation wallets:

1. Founder — 2,000,000,000 VCOIN
2. Mining reserve — 5,000,000,000 VCOIN
3. Treasury — 1,000,000,000 VCOIN
4. Liquidity / market — 1,000,000,000 VCOIN
5. Ecosystem / marketing — 1,000,000,000 VCOIN

The Founder is the sole authorized human decision-maker and signer. No employee, administrator, backend role, Telegram bot, smart-contract operator, committee, third-party service, automated process, escrow, vesting contract, time lock, withdrawal ceiling, or release schedule may independently authorize, initiate, veto, delay, redirect, or prevent a Founder-authorized movement.

## 2. No lock or vesting on the Founder allocation

The Founder's full **2,000,000,000 VCOIN** allocation is immediately and fully transferable under the Founder's sole wallet authority. **There is no four-year vesting, no cliff, no daily release, no escrow, no time lock, and no withdrawal restriction** on any part of the Founder's 2B allocation.

The previously drafted four-year Founder vesting requirement is expressly revoked and superseded by this version. It must not appear as an active tokenomics, contract, deployment, operational, or security requirement.

## 3. The other four allocations

The Mining 5B, Treasury 1B, Liquidity/Market 1B, and Ecosystem/Marketing 1B allocations are also ordinary, fully transferable Jetton balances under the Founder's sole authority. No Mining escrow, 730-day lock, or any other restriction is permitted.

The five-wallet separation exists solely for accounting, reporting, and operational clarity. It does not create independent custodians, co-signers, spending committees, automatic release rules, or restrictions on Founder-authorized transfers.

## 4. Technical implementation requirements

1. Configure the five recorded Mainnet allocation owner addresses once, before issuance, and preserve their distinct accounting roles.
2. Mint the Founder 2B category directly to the Founder's ordinary Jetton wallet. Do not route it through a vesting or escrow contract.
3. Keep all five allocation wallets ordinary transferable Jetton wallets. The Founder signs wallet movements locally.
4. Keep fixed category caps and one-time issuance controls; these limit initial supply issuance, not the Founder's subsequent withdrawals or transfers.
5. Backend and Telegram services may prepare, display, reconcile, and queue proposed operations only. They must never hold keys, sign, or independently execute transfers.
6. Never request, store, or commit seed phrases or private keys.

## 5. Supersession and conflict resolution

This Charter v1.1.0 supersedes every earlier draft, architecture note, checklist, PR description, vesting specification, or assistant-generated recommendation that imposed a four-year restriction on the Founder 2B allocation. Any such vesting code or build target must be removed from the active contract and test configuration, not merely described as optional.

This rule also supersedes any proposal for Mining escrow/730-day lock, restrictions on the other three operational wallets, third-party approval, or separate custodianship.

## 6. Safety and release status

This Charter defines the approved governance model. It does not authorize deployment, minting, transfers, or signing. PR #6 remains Draft/unmerged until code, tests, reproducible build, and independent security review are complete and the Founder approves the exact transaction payloads.

**Foundational invariant: Five allocation wallets, one operational authority — the Founder; all 10,000,000,000 VCOIN are freely transferable by the Founder without vesting or escrow restrictions.**
