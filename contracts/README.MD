# V COIN – TON Smart Contracts

## Purpose
This directory contains the independent V COIN Jetton implementation for TON (TEP-74), its Master and Jetton Wallet contracts, deployment tooling, and local verification tests. It is separate from the legacy BNB Smart Chain project.

## Approved economic baseline
- Fixed supply: **2,100,000,000 VCOIN**, six decimals.
- Founder: 420,000,000 (20%).
- Mining reserve: 1,050,000,000 (50%).
- Treasury: 210,000,000 (10%).
- Liquidity/Market: 210,000,000 (10%).
- Ecosystem/Marketing: 210,000,000 (10%).
- No additional minting beyond the fixed cap.

## Current issuance architecture — Founder-first
1. The VCoinMaster owner is the approved Founder Mainnet wallet.
2. Stage 1 mints a positive amount below the hard cap only to the Founder Jetton wallet.
3. Stage 2 is a separate Founder-signed request for exactly the remaining supply. The contract then disables minting.
4. Following full receipt, the Founder personally signs four ordinary TEP-74 transfers from the Founder Jetton wallet to the four registered destination wallets.
5. The Founder retains the 420,000,000 VCOIN allocation.

The Stage 1 amount is intentionally unset until the Founder approves it. Stage 2 must be freshly signed after Stage 1 is confirmed. The previous direct five-wallet mint implementation is superseded and must not be used.

## Security and release rules
- Enforce Founder-only staged issuance, exact remaining-supply calculation, a hard 2.1B cap, and permanent mint disablement after Stage 2.
- Verify the Jetton Master and all deterministic Jetton Wallet addresses against the exact reviewed StateInit.
- Test stage-specific natural bounce and retry behavior, transfers, accounting reconciliation, and TON reserve limits in local TON Sandbox.
- Never request, store, or expose a seed phrase, private key, PIN, or recovery code.
- Never deploy or broadcast without the Founder’s explicit approval of each exact Mainnet payload.

## Current status
- Founder-first source and tests are being revised on the isolated branch `feat/founder-first-two-stage`.
- Build and Sandbox verification are pending; do not treat source changes as production-ready until CI passes.
- No verified Mainnet deployment, initial receipt, or allocation transfer is claimed.
- Mainnet readiness remains **HOLD / NO-GO**.

See `contracts/jetton/DEPLOYMENT_RUNBOOK.md`, `contracts/jetton/VERIFICATION_STATUS.md`, and `docs/WALLET_ALLOCATION_REGISTER.md` for release evidence and wallet records.
