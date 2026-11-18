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

## 7. Current evidence-based status

- PostgreSQL schema, internal reserve/ledger code and Telegram HMAC authentication code exist in the repository.
- The current mining engine still uses internal PostgreSQL balances; it is not compliant with the approved wallet-balance policy.
- The public mining API is intentionally blocked with HTTP 503 until wallet-based mining is implemented.
- The repository review has not established a deployed VCOIN Jetton master address or a complete deployable Jetton contract package. See `docs/JETTON_DEPLOYMENT_INVENTORY.md`.
- PostgreSQL execution, non-skipped integration tests, CI success, Telegram end-to-end login, TON wallet proof, Testnet deployment and on-chain payout have not been demonstrated by the evidence currently available.

The project must not be described as performing real on-chain mining or as extraction-ready until all release gates pass.
