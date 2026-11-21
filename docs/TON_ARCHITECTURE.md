# V COIN – TON Architecture

**Project:** V COIN – TON  
**Network:** The Open Network (TON)  
**Token standard:** Jetton (TEP-74)  
**Status:** Architecture specification; Jetton implementation, deployment and wallet-based mining remain unverified/in progress.

## 1. Scope and separation

V COIN – TON is an independent TON implementation. It must not import, reuse, or modify contracts, addresses, deployment settings, or operational state from the older BNB Smart Chain project.

## 2. System layers

1. TON Jetton master and per-owner Jetton wallet contracts.
2. Backend API for authentication, wallet linking, mining, levels, referrals and audit records.
3. PostgreSQL for application records, immutable wallet snapshots, pending rewards, payout lifecycle and reconciliation.
4. Telegram Mini App as the user interface; Telegram is not the authority for token balances.
5. TON Connect-compatible wallet proof and transaction approval; private keys and recovery phrases remain with the user.
6. Monitoring, backups, security logs and reconciliation.

## 3. Approved token design

The approved design in `docs/TOKENOMICS.md` specifies an initial supply of 10,000,000,000 VCOIN, six decimals, no additional minting, and a 5,000,000,000 VCOIN mining allocation. These are design decisions, not evidence of an issued token or deployed contract.

## 4. Balance authority and mining

The next mining interval is calculated from the user's verified on-chain VCOIN Jetton balance in the linked TON wallet. Internal pending rewards, unconfirmed payouts and PostgreSQL internal balances are not wallet holdings.

The rate is exactly 1% per 24 hours at every level 1–400. Use integer base units and an immutable wallet snapshot. After a payout is confirmed on-chain, obtain a fresh snapshot for the next interval. The 5B mining allocation is a hard reserve, not minting authority.

## 5. Security and payout

- Verify wallet ownership with a supported TON Connect proof/signature; a pasted address is insufficient.
- Validate the exact approved Jetton master, owner address, network and wallet relationship. Token name, ticker and image are not identity proof.
- Use a trusted chain/indexer provider and fail closed on stale, inconsistent or unavailable data.
- Keep pending internal rewards separate from confirmed on-chain transfers.
- Reconcile payout transaction identity, amount, recipient, bounce state and finality before marking paid.
- Never request, store, log or transmit private keys or recovery phrases.

## 6. Network and release gates

Development, Testnet and Mainnet configurations must be separate. Testnet deployment and wallet-based extraction require completed local tests, verified contract identity, wallet proof, chain reader, payout reconciliation and owner approval. Mainnet deployment, initial issuance and real-value transfers require separate explicit approval and independent security review.

## 7. Operational TON network-fee wallet

The project owner has approved the separate Tonkeeper address below as the sole designated wallet for depositing TON intended for network fees and authorized operational transaction costs:

`UQCOZYJNI3HC6PN1YCy1cP-ikKPygoVUQlX2SIcJ_zEWJeGB`

The owner has explicitly instructed that TON deposits for network fees be made to this wallet. It is separate from the five VCOIN allocation wallets and is not a VCOIN allocation destination. Do not instruct the owner to distribute routine fee deposits across the five allocation wallets.

Technical limitation: Jetton transfers and contract calls have transaction-specific TON requirements. Depending on the transaction flow, the signing/initiating wallet may itself need TON. The architecture must establish and test a supported fee-funding or transaction-sponsorship flow. If a specific signing wallet requires a TON top-up, record the exact need and obtain owner approval before any transfer from the designated fee wallet. Never assume the separate wallet can sponsor every transaction type.

Before the owner deposits TON, verify the address in Tonkeeper and confirm the intended network. Never request or store recovery phrases or private keys.

## 8. Current evidence-based status

- PostgreSQL schema, internal reserve/ledger code and Telegram HMAC authentication code exist in the repository.
- The current mining engine still uses internal PostgreSQL balances; it is not compliant with the approved wallet-balance policy.
- The public mining API is intentionally blocked with HTTP 503 until wallet-based mining is implemented.
- The repository review has not established a deployed VCOIN Jetton master address or a complete deployable Jetton contract package. See `docs/JETTON_DEPLOYMENT_INVENTORY.md`.
- PostgreSQL execution, non-skipped integration tests, CI success, Telegram end-to-end login, TON wallet proof, Testnet deployment and on-chain payout have not been demonstrated by the evidence currently available.

The project must not be described as performing real on-chain mining or as extraction-ready until all release gates pass.

## 9. Founder authority and allocation controls

Founder authority over distribution approvals, custody operations and transaction signing is specified in `docs/FOUNDER_CONTROL_AND_ALLOCATION.md`. The founder allocation destination and operational fee wallet are distinct addresses. Founder authority does not override TON consensus or reverse confirmed transfers from independently controlled recipient wallets. Initial supply remains fixed and additional minting is prohibited.

## Binding governance addendum — 2026-11-21

This document is governed by [FOUNDER_EXCLUSIVE_FIVE_WALLET_CONTROL.md](FOUNDER_EXCLUSIVE_FIVE_WALLET_CONTROL.md): **the Founder alone has absolute, exclusive operational control and signing authority over all five V COIN–TON allocation wallets** (Founder, Mining Reserve, Treasury, Liquidity/Market, and Ecosystem/Marketing). Their separation is for accounting only; none is an independent custodian. No employee, administrator, backend, Telegram bot, CI process, third party, multisig co-signer, escrow, vesting, time lock, withdrawal ceiling, or automated process may authorize, veto, delay, redirect, sign, or execute a Founder-authorized movement.

**TON implementation boundary:** each TEP-74 Jetton Wallet authorizes transfers through its own `owner` address. Master ownership alone does not confer a clawback or withdrawal right over other Jetton Wallets. The approved implementation therefore depends on the Founder being the sole holder of signing authority for each of the five recorded owner-wallet addresses; transfers are signed locally by the Founder. The Master must not add hidden seizure or forced-transfer functionality. Backend/Telegram systems may read, account, reconcile, and prepare unsigned proposals only. Never request or store wallet secrets. Evidence of address control is tracked separately and must not be described as completed until checked. This addendum does not authorize deployment, minting, transfer, signing, or broadcast.
