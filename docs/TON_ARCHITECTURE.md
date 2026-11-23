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

The approved design in `docs/TOKENOMICS.md` specifies an initial supply of 2,100,000,000 VCOIN, six decimals, no additional minting, and a 1,050,000,000 VCOIN mining allocation. These are design decisions, not evidence of an issued token or deployed contract.

## 4. Balance authority and mining

The next mining interval is calculated from the user's verified on-chain VCOIN Jetton balance in the linked TON wallet. Internal pending rewards, unconfirmed payouts and PostgreSQL internal balances are not wallet holdings.

The rate is exactly 1% per 24 hours at every level 1–400. Use integer base units and an immutable wallet snapshot. After a payout is confirmed on-chain, obtain a fresh snapshot for the next interval. The 1.05B mining allocation is a hard reserve, not minting authority.

## 5. Security and payout

- Verify wallet ownership with a supported TON Connect proof/signature; a pasted address is insufficient.
- Validate the exact approved Jetton master, owner address, network and wallet relationship. Token name, ticker and image are not identity proof.
- Use a trusted chain/indexer provider and fail closed on stale, inconsistent or unavailable data.
- Keep pending internal rewards separate from confirmed on-chain transfers.
- Reconcile payout transaction identity, amount, recipient, bounce state and finality before marking paid.
- Never request, store, log or transmit private keys or recovery phrases.

## 6. Network and release gates

The current execution policy is Mainnet-only. Local development, deterministic builds, offline inspection and TON Sandbox tests are permitted. No TON Testnet deployment or Testnet transaction is authorized. Never mix Testnet and Mainnet addresses, balances, payloads or wallet sessions.

Mainnet deployment, initial issuance and real-value transfers remain NO-GO until the exact source and artifacts pass the project's defined engineering review, local Sandbox tests pass, the clean-room rebuild and live fee/reserve checks pass, and the Founder explicitly approves and signs each transaction. Independent external auditing is not part of the V COIN–TON project scope or release checklist.

## 7. Founder / GAS & OPERATIONS wallet

The Founder allocation wallet is also the sole GAS & OPERATIONS wallet and the only authorized deployment and issuance signer. This is the same address recorded for the Founder in `docs/WALLET_ALLOCATION_REGISTER.md`; there is no separate operational-fee address and no sixth wallet.

TON needed for deployment, Master reserve funding and authorized operational fees must be handled through this Founder wallet. Verify the address and TON Mainnet network in Tonkeeper before any funding or signature. Never request or store recovery phrases or private keys.

## 8. Current evidence-based status

- The repository contains the VCoinMaster and Jetton Wallet source, allocation guards, deployment preview generator, Sandbox tests, and TonConnect issuer assets.
- GitHub Actions run #252 on source commit `22534f7d03d896ea45fbe330a7a5a9940d44d419` passed the build-and-test job, including Tact compilation, metadata-cell generation, unsigned Mainnet preview generation, Jest tests, issuer syntax/sequence guards, dependency audit and artifact upload.
- The exact run #252 contract artifact SHA-256 is `800946828268df7e1b522c9da5d162f878814711c02a7525dff1eafbc99fa853`. Independent BOC/hash/address checks were recorded in Action #51. This is not a clean-room source rebuild or external certification.
- The GitHub Pages issuer deployment job remains blocked: the Pages site lookup returned 404 and the GitHub Actions integration was denied permission to create the Pages site. The hosted issuer URL is not confirmed deployed.
- The public mining API remains intentionally blocked with HTTP 503 until wallet-based mining, verified chain balance reads, reconciliation and payout controls are complete.
- No Mainnet Jetton master deployment, initial issuance, allocation transfer, deployed-Master getter check or on-chain payout has been demonstrated.
- Clean-room rebuild, live fee/reserve review and Founder transaction approval remain outstanding. Independent external auditing is not a V COIN–TON project task or release condition.

The project must not be described as deployed, issued, extraction-ready or performing real on-chain mining until the relevant release gates and on-chain evidence exist.

## 9. Founder authority and allocation controls

Founder authority over distribution approvals, custody operations and transaction signing is specified in `docs/FOUNDER_CONTROL_AND_ALLOCATION.md`. The Founder allocation destination is also the sole GAS & OPERATIONS wallet; no separate operational-fee address or sixth wallet exists. Founder authority does not override TON consensus or reverse confirmed transfers from independently controlled recipient wallets. Initial supply remains fixed and additional minting is prohibited.