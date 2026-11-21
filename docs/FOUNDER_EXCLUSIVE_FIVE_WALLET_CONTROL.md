# V COIN–TON — Founder Exclusive Control of All Five Allocation Wallets

**Document ID:** VCT-GOV-5W-001  
**Version:** 1.0.0  
**Adopted:** 2026-11-21  
**Scope:** Independent V COIN–TON project only. The legacy BNB project is excluded and must not be modified.  
**Authority:** Explicit Founder instruction; non-negotiable project invariant.

## 1. Binding rule

The Founder has absolute, exclusive, and unrestricted operational authority over all five official allocation wallets. This covers every deposit, withdrawal, Jetton transfer, TON movement, and other disposition of assets held by those wallets. This is a foundational governance rule, not a preference or an optional design choice.

The five accounting roles are:

| Role | Allocation | Recorded Mainnet owner address |
|---|---:|---|
| Founder | 2,000,000,000 VCOIN (20%) | `UQAdW09EvIesUXt9jzLq1T32O0351TaczwWJQLGGmw4aWrzy` |
| Mining reserve | 5,000,000,000 VCOIN (50%) | `UQDMEIvklqeBW0Pn74sBHzOpoFGsSWDHE5NxZwfN-1KVsBD0` |
| Treasury | 1,000,000,000 VCOIN (10%) | `UQBEW5bLGbq0yVDOimgl6fpZbQkdla9Wk5b0tXyx69bmBktQ` |
| Liquidity / market | 1,000,000,000 VCOIN (10%) | `UQA0_thi3mXZ6jFlHHBfnyjVmXayR3hsGx5PC43_fBOTzXWn` |
| Ecosystem / marketing | 1,000,000,000 VCOIN (10%) | `UQBQDb73DWWMGnxEr37TsqZSKNvVOC9MMwkvRmNY91LJqLsE` |

These are the recorded owner-wallet addresses, not the derived Jetton-wallet contract addresses. Derive and verify each Jetton wallet from the final deployed Master using the standard getter; do not substitute one address type for the other.

## 2. Custody and signing model

1. Sole operational control of the private signing authority for all five recorded owner-wallet addresses belongs to the Founder. The Founder alone decides whether to sign and authorize any movement.
2. The five wallets are separate accounting buckets, not five independent custodians. Their separation must never be interpreted as authority delegated to a department, employee, bot, backend, committee, third party, or other wallet holder.
3. The Founder may use the appropriate locally controlled wallet/key for each address. The project does not require all five addresses to share one mnemonic or one private key; it requires that no other person or service has independent signing authority.
4. Recovery phrases, private keys, PINs, and signing credentials must never be requested in chat, placed in GitHub, stored in backend/database/Telegram, or exposed to CI.
5. A wallet-control check may use a wallet-supported signed challenge or another non-spending proof that reveals no secret. It must not require transferring funds merely to prove control.

## 3. TON Jetton technical boundary

Under TEP-74, each owner's Jetton Wallet authorizes an outgoing transfer by checking the sender against that Jetton Wallet's `owner` address. Therefore, the VCOIN Master contract's owner status does not by itself grant a power to withdraw tokens from the other four owner wallets.

The approved design implements the Founder-only rule through exclusive Founder control of the signing authority for each of the five owner-wallet addresses. Every ordinary Jetton transfer is signed locally by the Founder through the wallet controlling the relevant owner address.

The Master contract must not add a hidden clawback, seizure, arbitrary balance-editing, or forced-withdrawal path to imitate custody. The contract continues to enforce fixed initial issuance caps, one-time allocation configuration, and mint disablement; ordinary token transfers remain governed by the relevant Jetton Wallet owner signature.

## 4. Prohibited authority paths

The following are prohibited:

- Independent signing or withdrawal authority for any employee, administrator, service provider, backend, Telegram bot, CI job, or third party.
- Backend-held, bot-held, server-held, or CI-held private keys.
- Multisig/co-signer approval, administrator veto, escrow, vesting, time lock, withdrawal ceiling, spending policy, or automated release condition that can block a Founder-authorized movement.
- Treating the mining reserve, treasury, liquidity/market, or ecosystem/marketing wallet as independently controlled by its business function.
- Any change to the five wallet roles or addresses without explicit Founder authorization and a reviewed change record.

Backend and Telegram components may read balances, calculate accounting, reconcile events, display information, and prepare unsigned transaction proposals. They may not sign, broadcast, or autonomously move assets.

## 5. Required implementation and verification

Before any Mainnet deployment or allocation transaction:

1. Confirm that the five owner addresses in the deployment configuration exactly match this register.
2. Confirm the Founder can independently access and locally sign for each of the five addresses in the intended Mainnet wallet interface, without disclosing any secret.
3. Where supported, collect a signed non-spending challenge for each address and record only the public proof, wallet address, network, timestamp, and verification result.
4. Derive the five Jetton Wallet addresses from the candidate/deployed Master and verify each owner and Master getter.
5. Confirm every allocation is credited to the corresponding ordinary Jetton Wallet and that no vesting/escrow contract or third-party custodian is involved.
6. Review every exact deployment, configuration, issuance, and transfer payload. Founder approval and local Founder signature are required separately for each irreversible Mainnet operation.
7. Ensure backend, Telegram, database, deployment scripts, and CI contain no wallet signing capability.

A missing proof artifact is an evidence gap, not permission to alter the governance rule or delegate control. Do not claim that a wallet proof was completed until the corresponding signed challenge or equivalent evidence is actually checked.

## 6. Change control and status

This document is the canonical five-wallet authority policy and must be referenced by the Founder Authority Charter, tokenomics, Jetton specification, allocation register, deployment runbook, backend/API/database/security architecture, mining/Telegram specifications, and Mainnet readiness dossier.

No document, code comment, test, deployment template, or PR text may contradict this policy. If a historical document contains conflicting language, this policy and the latest Founder-approved Charter supersede it; preserve historical records but mark superseded statements clearly.

This policy does not itself authorize a deployment, mint, transfer, signing, or broadcast. Mainnet remains subject to the existing separate Founder approval gates.

**Invariant: five allocation wallets; one exclusive operational authority — the Founder; no independent custodian or delegated signer.**
