# V COIN–TON Founder Authority Charter

**Document ID:** VCT-GOV-FOUNDER-001  
**Version:** 1.2.0  
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


## Binding governance addendum — 2026-11-21

This document is governed by [FOUNDER_EXCLUSIVE_FIVE_WALLET_CONTROL.md](FOUNDER_EXCLUSIVE_FIVE_WALLET_CONTROL.md): **the Founder alone has absolute, exclusive operational control and signing authority over all five V COIN–TON allocation wallets** (Founder, Mining Reserve, Treasury, Liquidity/Market, and Ecosystem/Marketing). Their separation is for accounting only; none is an independent custodian. No employee, administrator, backend, Telegram bot, CI process, third party, multisig co-signer, escrow, vesting, time lock, withdrawal ceiling, or automated process may authorize, veto, delay, redirect, sign, or execute a Founder-authorized movement.

**TON implementation boundary:** each TEP-74 Jetton Wallet authorizes transfers through its own `owner` address. Master ownership alone does not confer a clawback or withdrawal right over other Jetton Wallets. The approved implementation therefore depends on the Founder being the sole holder of signing authority for each of the five recorded owner-wallet addresses; transfers are signed locally by the Founder. The Master must not add hidden seizure or forced-transfer functionality. Backend/Telegram systems may read, account, reconcile, and prepare unsigned proposals only. Never request or store wallet secrets. Evidence of address control is tracked separately and must not be described as completed until checked. This addendum does not authorize deployment, minting, transfer, signing, or broadcast.
