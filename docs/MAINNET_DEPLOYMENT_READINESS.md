# V COIN–TON Mainnet Deployment Readiness

**Document ID:** VCT-MAINNET-READY-001  
**Version:** 1.0.0  
**Checkpoint:** 2026-11-21  
**Candidate:** Draft PR #6  
**Branch:** `audit/pr5-bounce-guard-and-network-clarity-2026-11-21`  
**Exact reviewed source head:** `b11346c18f2ad6a6339d98fb59affa64ef9c6707`  
**Network target:** TON Mainnet only; Testnet deployment is excluded by Founder direction.

## 1. Current decision

**NO-GO for Mainnet broadcast at this checkpoint.** The contract candidate compiles and its current CI passes, but production deployment prerequisites are not yet complete. This document authorizes preparation and verification only. It does not authorize merge, deployment, minting, transfers, or signing.

## 2. Confirmed evidence on the exact source head

GitHub Actions workflow #263 passed on exact head `b11346c18f2ad6a6339d98fb59affa64ef9c6707`:

- Tact build: passed.
- Jest / TON Sandbox: 20 tests passed across 2 suites.
- `npm ci`: passed.
- `npm audit --audit-level=high`: passed; zero reported vulnerabilities.
- PR #6 remains Draft and unmerged.

Run: https://github.com/vahidnemati3544-opsking/v-coin-TON/actions/runs/44890261282

This is CI evidence, not a third-party security audit or proof of Mainnet readiness.

## 3. Binding project rules

- Fixed total supply: 10,000,000,000 VCOIN; six decimals; no additional minting after the five category allocations complete.
- Allocation caps: Founder 2B; Mining 5B; Treasury 1B; Liquidity/Market 1B; Ecosystem/Marketing 1B.
- Founder has sole, absolute operational authority over all five ordinary allocation wallets.
- No allocation is subject to vesting, escrow, time lock, withdrawal ceiling, or third-party approval.
- Backend and Telegram services must never hold keys, sign, or autonomously execute wallet transfers.
- Never request or store private keys or recovery phrases.
- Wallet addresses and the local deployment manifest must be verified by the Founder on Mainnet. Do not copy secret or operational address data into public deployment artifacts unnecessarily.

## 4. Mandatory blockers before any Mainnet deployment

1. **Independent smart-contract audit:** obtain a qualified external review of the exact Tact source, compiler version, generated code, Jetton Master/Wallet behavior, bounce handling, issuance and supply invariants. Record auditor, report, source hash and findings.
2. **Full TEP-74 / TEP-64 conformance:** close the outstanding source review against the current standards and official reference implementation, including message layouts, getters, wallet derivation, metadata serialization, gas/excess and bounce/replay behavior.
3. **Natural downstream-bounce proof:** finish end-to-end Sandbox tests for a real downstream Jetton-wallet delivery failure and prove exact balance/supply restoration and safe retry across all five categories.
4. **Deployment builder:** create a deterministic, offline-capable builder that compiles the reviewed source, emits StateInit/deployment BOC, records code/data/StateInit hashes, derives the expected Master address and prepares a wallet-signable transaction preview. It must not hold keys or broadcast.
5. **Mainnet identity guard:** fail closed unless the network is positively identified as TON Mainnet. A text field saying "mainnet" is not proof. No Testnet fallback and no ambiguous network selection.
6. **Metadata finalization:** review the exact TEP-64 metadata cell/URI, content availability, immutable hosting/pinning and canonical logo. The current public logo/metadata approval is not yet closed.
7. **Wallet-control proof:** Founder must verify control of each of the five owner wallets on Mainnet in their own wallet interfaces. Never submit seed phrases or private keys.
8. **Deployment and issuance sequence:** independently verify exact initialization parameters, owner/admin address, all five distinct recipient addresses, category order, TON fee reserve, expected resulting wallet addresses, supply getters and post-deployment verification procedure.
9. **Transaction review and approval:** present exact source/build hashes, network, master address derivation, StateInit hash, deployment BOC, fees and every later category issuance payload to the Founder. Each irreversible transaction requires explicit Founder approval and local signing.

## 5. Safe next work package

**Action 25 — Prepare deterministic Mainnet deployment package (no broadcast):**

- Pin the exact Tact compiler and dependency lockfile.
- Add a reproducible build command and artifact manifest.
- Generate and record Master code hash, data/StateInit hash, expected address and deployment BOC from explicit, reviewed initialization parameters.
- Add a fail-closed Mainnet network identity check to any signing/broadcast wrapper.
- Produce a human-readable transaction preview and post-deployment getter/balance verification checklist.
- Keep all signing local in the Founder's wallet. Do not include keys, seed phrases or an automatic broadcast path.
- Run CI and verify the artifacts are reproducible from the exact commit.

**Status:** pending implementation and review. No transaction has been prepared for signing or broadcast at this checkpoint.

## 6. Release gate

Only after every blocker in Section 4 is evidenced as closed may a separate Mainnet deployment proposal be presented. The Founder must inspect and approve the exact final source hash, compiler/build hash, network, StateInit, destination and fee payload before signing.

**Current state: NOT DEPLOYED. NO MINT. NO TRANSFER. NO MAINNET BROADCAST.**
