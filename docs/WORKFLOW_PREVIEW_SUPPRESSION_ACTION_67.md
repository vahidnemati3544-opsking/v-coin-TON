# Action #67 — Disable Superseded Direct-Mint Mainnet Preview

**Date:** 2026-11-24  
**Status:** Safety change committed; current Founder-first contract adaptation remains pending  
**Scope:** V COIN–TON only. No blockchain transaction, deployment, mint, or wallet transfer.

## Changes committed

- Workflow no longer runs `prepare-mainnet-deployment.ts` or generates the former five-wallet direct-`VCoinMint` transaction preview.
- CI now fails if obsolete Mainnet preview/StateInit payload artifacts appear in the build output.
- CI checks that the legacy transaction planner remains explicitly disabled and is not invoked by the workflow.
- The old planner file was replaced with a fail-closed stub explaining why it must not be run.
- The public Pages page remains read-only and explicitly displays HOLD / NO-GO.

Code commits:
- [Disable legacy preview generation](https://github.com/vahidnemati3544-opsking/v-coin-TON/commit/cc8722ab0ab64709f4f8b4fba05b7fa342188eea)
- [Make the artifact guard portable](https://github.com/vahidnemati3544-opsking/v-coin-TON/commit/6e0629291942e0ec9a7185fc0229f0aa124582c4)
- [Disable the old transaction planner](https://github.com/vahidnemati3544-opsking/v-coin-TON/commit/22e8f7698e4a068b73b7a7380d4adaa129c23f83)
- [Add workflow enforcement for the disabled planner](https://github.com/vahidnemati3544-opsking/v-coin-TON/commit/5525a85f00b2b9b33c86e91192ad3403d09467e0)
- [Align the allocation manifest with the new Founder Mainnet address and staged custody policy](https://github.com/vahidnemati3544-opsking/v-coin-TON/commit/f3745c07e3474416c043ffe4ab7ff0f3060d2473)
- [Add CI checks for lockfile drift and Founder-first manifest consistency](https://github.com/vahidnemati3544-opsking/v-coin-TON/commit/f3674758602bc86e65961f7297fe33f5f5e10c65)

## Allocation-manifest correction

The previous `allocation-manifest.template.json` still contained the former Testnet-only Founder address in its active Founder/GAS fields and stale direct-mint preview language. It has now been corrected to the current Founder Mainnet address, the shared Founder/GAS role, the five registered owner destinations, the final economic allocations, unset two-stage receipt amounts, and explicit HOLD / NO-GO flags. All predicted Master/StateInit/preview references remain cleared. A repository-side JSON consistency check confirmed the five destinations and amounts match the deployment template; this is not a wallet-control proof or a CI result.

The workflow now also checks that the committed package lock does not drift after lockfile generation and validates the allocation manifest's supply, five unique destinations, shared Founder/GAS role, staged-receipt fields, and false authorization flags.

## Current evidence and limits

- Latest code-bearing commit: `5525a85f00b2b9b33c86e91192ad3403d09467e0`; latest reviewed workflow/configuration commit: `f3674758602bc86e65961f7297fe33f5f5e10c65`.
- GitHub combined-status lookup returned no check statuses for that head, and the available workflow-run lookup did not return a push-triggered run. Therefore exact-head CI is **not verified**; no success is claimed for the new guard.
- The last fully evidenced passing run remains [run #320](https://github.com/vahidnemati3544-opsking/v-coin-TON/actions/runs/45127119730) on older commit `53039de8263b6e5b76ff2c0f3afb636e96c215d3`. Both build-and-test and Pages deployment/endpoint verification succeeded there. It predates the 2026-11-24 Founder-first owner instruction and does not verify the current contract flow or these new CI changes.
- `contracts/jetton/package-lock.json` exists and uses lockfileVersion 3. The latest recorded clean `npm ci`, Tact build, Sandbox, and npm audit results belong to the older run #320, not the current head.
- The last recorded Sandbox result is 3 suites / 21 tests passed. Those tests cover the former direct-five-wallet mint behavior and TON withdrawal guard; they do **not** cover the new two-stage Founder-first receipt and four capped transfers.
- The last recorded npm audit in run #320 reported zero advisories. No current-head audit result is available.
- TEP-64 `metadata.json` exists, is pinned to commit `e17bcb9d82ea182bff3358b9fac6b5fa25c166ee`, and the previous content-cell hash was `abadcbc42c4e6309bea1d595dbfd1b834a07bfb171b2b1e2cb6d4b7e244330ca`. Current-head regeneration is not verified.
- Previous BOC/TON cell-hash reproduction was from the pre-Founder-first release artifact. It is not a clean-room source rebuild and is not a valid deployment package for the new Founder address/receipt policy.
- The current contract still contains the old five-recipient fixed direct-mint logic. It has not yet implemented two separately authorized Founder receipts and subsequent capped Founder-signed transfers. The old deployment preview generator is now disabled to prevent stale payload use.
- The canonical five owner addresses remain in `docs/WALLET_ALLOCATION_REGISTER.md`. Founder Mainnet address `UQBh9jVKAypc4TrbFx2jsVB2EI1ONChg22zDputisQjENQOT` is also the sole GAS & OPERATIONS wallet. There is no separate GAS wallet. Former address `UQAdW09EvIesUXt9jzLq1T32O0351TaczwWJQLGGmw4aWrzy` is Testnet-only and prohibited for Mainnet.
- The current project policy excludes an external security-audit engagement as a project workstream. The earlier internal review does not review the new Founder-first design; a fresh internal engineering review remains necessary after contract adaptation. This is not an assertion that the contract is vulnerability-free.
- `deployment_authorized=false` and `mainnet_authorized=false` remain in the deployment template. The Pages source contains a read-only HOLD page; publication of the latest page changes has not been verified by an exact-head run.

## Remaining engineering work

1. Redesign the contract for two separate Founder-authorized receipts, with Stage 2 requiring a new transaction and minting exactly the remaining supply.
2. Implement and test the four Founder-signed capped distributions to the registered destination wallets, including bounce/retry and accounting reconciliation.
3. Update the deployment configuration and transaction planner only after the contract behavior is implemented.
4. Run clean `npm ci`, strict dependency audit, Tact compile, and complete local TON Sandbox tests against the revised flow.
5. Rebuild the exact source with the pinned toolchain and independently reproduce all TON code-cell, metadata, StateInit, Master, and Jetton Wallet addresses/hashes.
6. Verify wallet control, exact Mainnet payloads, live fee/reserve requirements, Pages release status, and obtain explicit Founder approval before any Mainnet transaction.

**Safety boundary:** No Mainnet or Testnet transaction was sent. No contract was deployed and no VCOIN was minted. Never request or store seed phrases, private keys, PINs, or recovery codes.
