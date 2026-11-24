# Action #66 — Founder-First Two-Stage Mainnet Receipt Policy

**Date:** 2026-11-24  
**Status:** Contract redesign and automated verification passed on isolated feature branch; backend ingestion and Mainnet release gates remain pending  
**Branch:** `feat/founder-first-two-stage`  
**Latest feature-branch head at this checkpoint:** `b9c41653898d3ad395b0060025e67cd7d26c13a7`  
**Scope:** V COIN–TON only; no changes to the legacy BNB project

## Owner instruction

The full fixed supply of 2,100,000,000 VCOIN is to be received by Founder Mainnet wallet `UQBh9jVKAypc4TrbFx2jsVB2EI1ONChg22zDputisQjENQOT` in two separate, Founder-authorized stages. Stage 2 requires a fresh Founder-signed transaction and must equal the exact remaining supply. Stage 1 amount remains unspecified until explicitly approved by the Founder. After full receipt, the Founder personally signs four Jetton transfers: Mining 1,050,000,000; Treasury 210,000,000; Liquidity/Market 210,000,000; Ecosystem/Marketing 210,000,000 VCOIN. The Founder retains 420,000,000 VCOIN.

The former Founder address `UQAdW09EvIesUXt9jzLq1T32O0351TaczwWJQLGGmw4aWrzy` is Testnet-only historical data and must not be used on Mainnet.

## Completed engineering changes on feature branch

1. `contracts/jetton/src/vcoin.tact`: replaced legacy five-recipient direct minting with Founder-only two-stage receipt. Stage 1 must be positive and below cap; Stage 2 must equal the exact remaining supply.
2. `contracts/jetton/src/jetton.tact`: the Founder Jetton wallet sends a receipt acknowledgement after its balance is actually credited. Stage 2 is rejected until Stage 1 acknowledgement is confirmed. Burns are blocked until both initial receipt stages are complete. Stage-specific natural bounces roll back only the failed stage.
3. `contracts/jetton/src/messages.tact`: added the receipt acknowledgement message and receipt status fields.
4. `contracts/jetton/tests/jetton-sandbox.spec.ts`: covers Founder-only receipt, exact cap, Stage 2 fresh request, four Founder-signed transfers, Stage 1/Stage 2 bounce rollback, and post-issuance mint lock.
5. `contracts/jetton/scripts/prepare-mainnet-deployment.ts`: derives revised StateInit and Jetton wallets; receipt payloads are generated only when an explicit Stage 1 amount is supplied. Stage 2 is calculated as the exact remainder and requires a separate signature.
6. `issuer/index.html`: legacy transaction console retired and replaced with a read-only HOLD / NO-GO status page.
7. `contracts/mining/backend/database/migrations/010-founder-first-two-stage-reconciliation.sql`: adds idempotent chain-receipt and four-role allocation reconciliation functions, exact amount and destination checks, and a reconciliation view.
8. `contracts/mining/backend/src/services/vcoin-chain-reconciliation.js`: strict Mainnet-only adapter requires finalized event status, exact Master address, Founder owner addresses, and all derived Jetton wallet addresses before recording events.
9. `contracts/mining/backend/test/vcoin-chain-reconciliation.test.js`: verifies the event adapter rejects Testnet, unfinalized events, wrong Master/Founder, wrong Jetton wallets, invalid hashes, and wrong allocation amounts/destinations.
10. `contracts/mining/backend/test/mining-ledger.integration.test.js`: applies migration 010 and verifies both receipt stages, idempotency, exact four destination transfers, and mismatch rejection.
11. Deployment template, allocation manifest, runbook, verification status, and contract README updated to the Founder-first architecture.

## Automated verification evidence

- **Jetton CI:** [Run #45326855010](https://github.com/vahidnemati3544-opsking/v-coin-TON/actions/runs/45326855010) — **success** on latest branch head `15af89846c454b6390f0a3cdc9760bd2dfc905ed`. Tact compilation, metadata cell generation, unsigned deployment preview, Jest Sandbox tests, read-only issuer checks, and artifact preservation passed.
- **Backend CI:** [Run #45326854872](https://github.com/vahidnemati3544-opsking/v-coin-TON/actions/runs/45326854872) — **success** on the same head; backend syntax, PostgreSQL schema/migrations, migration-runner idempotency, and integration tests passed.
- **Mining/PostgreSQL CI:** [Run #45326854945](https://github.com/vahidnemati3544-opsking/v-coin-TON/actions/runs/45326854945) — **success** on the same head; migration 010, both receipt stages, idempotency, all four allocation roles, and mismatch rejection passed.
- **Latest backend reconciliation adapter test:** [Run #45327118111](https://github.com/vahidnemati3544-opsking/v-coin-TON/actions/runs/45327118111) — **success** on commit `b9c41653898d3ad395b0060025e67cd7d26c13a7`; strict Mainnet finality/Master/Jetton-wallet checks and PostgreSQL integration tests passed.
- **Latest exact-head Jetton CI:** [Run #45327687083](https://github.com/vahidnemati3544-opsking/v-coin-TON/actions/runs/45327687083) — **success** on commit `2d448d2f9304b2eb6910ce2ba8ae4f2876f67e06`; Tact compilation, zero-moderate-or-higher dependency audit, Sandbox tests, and sanitized read-only public preview validation passed.
- **Latest exact-head Backend CI:** [Run #45327687002](https://github.com/vahidnemati3544-opsking/v-coin-TON/actions/runs/45327687002) — **success**.
- **Latest exact-head Mining/PostgreSQL CI:** [Run #45327686925](https://github.com/vahidnemati3544-opsking/v-coin-TON/actions/runs/45327686925) — **success**.
- Exact-head verification for contract code and the sanitized Pages workflow completed successfully on source commit `2d448d2f9304b2eb6910ce2ba8ae4f2876f67e06`; the current head `4898a631b27cba68578d55d290c1c5626fd2a5c7` adds only this checkpoint documentation.
- The Stage 1 amount is still unset. CI generated no Mainnet receipt payloads.
- The new predicted Master address and Jetton wallet addresses are build-derived preview values only; none is evidence of Mainnet deployment.
- The feature branch is not merged into `main`.

## Remaining work — do not mark complete

1. Connect the production backend/indexer to validate actual TON transaction finality, expected Jetton Master and wallet relationships, and then call the tested reconciliation functions. Migration and database functions alone do not prove on-chain events.
2. Review the exact latest feature-branch head and regenerate/reconcile final artifacts and hashes.
3. Verify Founder wallet control, all four registered destination addresses, deterministic Jetton Wallet addresses, Mainnet network, and current fees/reserves.
4. Implement/review a new Founder-first signing interface; the issuer page is currently read-only and must remain so until that flow is approved.
5. Record the Stage 1 amount only after the Founder explicitly chooses it. Stage 2 must be separately authorized after Stage 1 is confirmed.
6. Prepare unsigned payloads for personal Founder review only after all release gates pass.

## Safety status

**Mainnet transfer readiness: HOLD / NO-GO.** No Mainnet deployment, receipt, or allocation transfer is authorized. The source branch is not merged. No token receipt is claimed. Never request or share recovery phrases, private keys, or PINs.
