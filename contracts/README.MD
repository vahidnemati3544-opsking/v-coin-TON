# V COIN – TON Smart Contracts

## Purpose
This directory contains the independent V COIN Jetton implementation for The Open Network (TON), including the Master and Wallet contracts, fixed-allocation controls, deployment tooling, and local verification tests. It does not modify or reuse the legacy BNB Smart Chain project.

## Approved execution baseline
- Jetton standard: TEP-74; metadata: TEP-64.
- Fixed total supply: **2,100,000,000 VCOIN**, six decimals; no additional minting.
- Allocation: Founder 420,000,000 (20%), Mining Reserve 1,050,000,000 (50%), Treasury 210,000,000 (10%), Liquidity/Market 210,000,000 (10%), Ecosystem/Marketing 210,000,000 (10%).
- Exactly five allocation destinations. The Founder allocation wallet is also the sole GAS & OPERATIONS wallet and deployment/issuance signer; there is no separate fee wallet or sixth allocation destination.
- Founder allocation is credited in one operation; no vesting, time lock, monthly installments, or staged release.
- Execution is Mainnet-only after all project engineering gates and explicit Founder authorization. Local TON Sandbox and isolated tests are permitted. Testnet deployment, transactions, and rehearsal are not authorized.
- Independent external security auditing is not a V COIN–TON task, pending work item, or release condition.

## Security and development rules
- Enforce the fixed supply, exact per-role allocations, one-time issuance, owner-only mint authority, and post-allocation mint disablement in contract code.
- Protect transfer, burn, bounce/retry, authorization, and reserve behavior with automated local TON Sandbox tests.
- Never request, store, or expose a seed phrase, private key, PIN, or recovery code.
- Never deploy or broadcast without the Founder’s explicit approval of the exact Mainnet transaction payload.

## Current status
- Master/Wallet source, allocation controls, deployment preview tooling, and Sandbox tests are present in the repository.
- The existence of source files or a successful CI run is not proof of Mainnet deployment, issuance, or production readiness.
- No verified Mainnet deployment, initial issuance, or allocation transfer is claimed here.
- The deployment runbook and verification status document remain the controlling evidence for current technical release status.

See `contracts/jetton/DEPLOYMENT_RUNBOOK.md`, `contracts/jetton/VERIFICATION_STATUS.md`, and `docs/WALLET_ALLOCATION_REGISTER.md` for current release and wallet records.
