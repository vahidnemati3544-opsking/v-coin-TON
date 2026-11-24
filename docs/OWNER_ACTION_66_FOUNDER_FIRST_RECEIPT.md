# Action #66 — Founder-First Two-Stage Mainnet Receipt Policy

**Date:** 2026-11-24  
**Status:** Core contract redesign committed to isolated feature branch; CI/Sandbox verification pending  
**Branch:** `feat/founder-first-two-stage`  
**Scope:** V COIN–TON only; no changes to the legacy BNB project

## Owner instruction

The full fixed supply of 2,100,000,000 VCOIN is to be received by Founder Mainnet wallet `UQBh9jVKAypc4TrbFx2jsVB2EI1ONChg22zDputisQjENQOT` in two separate, Founder-authorized stages. The second stage requires a fresh Founder-signed transaction and must equal the exact remaining supply. Stage 1 amount remains unspecified until the Founder approves it. After full receipt, the Founder personally signs four Jetton-wallet transfers: Mining 1,050,000,000; Treasury 210,000,000; Liquidity/Market 210,000,000; Ecosystem/Marketing 210,000,000 VCOIN. The Founder retains 420,000,000 VCOIN.

The former Founder address `UQAdW09EvIesUXt9jzLq1T32O0351TaczwWJQLGGmw4aWrzy` is Testnet-only historical data and must not be used on Mainnet.

## Completed engineering changes on feature branch

1. `contracts/jetton/src/vcoin.tact`: replaced the legacy five-recipient direct-mint logic with Founder-only two-stage receipt. Stage 1 must be positive and below cap; Stage 2 must equal the exact remaining supply. Stage 2 disables further minting.
2. `contracts/jetton/src/jetton.tact`: receipt-stage query IDs are carried through the internal Jetton credit message to authenticate the corresponding bounce rollback.
3. `contracts/jetton/src/messages.tact`: replaced old allocation status/config structs with staged receipt status.
4. `contracts/jetton/tests/jetton-sandbox.spec.ts`: replaced legacy five-wallet mint tests with Founder-only staged receipt, fixed cap, four Founder-signed transfer, and bounce coverage.
5. `contracts/jetton/scripts/prepare-mainnet-deployment.ts`: derives the revised StateInit and Jetton wallets; it generates stage payloads only when `VCOIN_STAGE1_TOKENS` is explicitly supplied. Stage 2 is calculated as the exact remainder and requires a separate signature.
6. `contracts/jetton/tests/README.md`: updated test and release-gate documentation.

## Verification state

- GitHub Actions verification was triggered on the feature branch; final result is pending.
- No successful Tact compilation or Sandbox pass is claimed until the workflow reports success.
- Backend reconciliation, issuer UI, deployment runbook, and exact-head release artifacts still require alignment with the new flow.
- The feature branch has not been merged into `main`.

## Remaining work — do not mark complete

1. Obtain passing Tact build and Sandbox tests; repair any compiler/test failures.
2. Add and verify Stage 2 natural-bounce rollback/retry coverage.
3. Update backend accounting/reconciliation so the two receipt stages and four subsequent transfers cannot be double-counted.
4. Update TonConnect issuer UI and release workflow to remove the old direct-five-mint sequence.
5. Update deployment runbook and verification status from exact revised source.
6. Validate JSON schema, StateInit/code/data hashes, Jetton wallet derivations, address control, and live fees/reserves.
7. Only then prepare unsigned Mainnet payloads for the Founder’s personal review and signatures.

## Safety status

**Mainnet transfer readiness: HOLD / NO-GO.** No Mainnet deployment, receipt, or allocation transfer is authorized by this engineering work. Do not send either installment or any allocation transfer until all release checks pass and the Founder approves each exact transaction. Never request or share recovery phrases or private keys.
