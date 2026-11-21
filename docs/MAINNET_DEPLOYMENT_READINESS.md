# V COIN–TON Mainnet Deployment Readiness

**Document ID:** VCT-MAINNET-READY-001  
**Version:** 1.0.0  
**Checkpoint:** 2026-11-21  
**Candidate:** Draft PR #6  
**Branch:** `audit/pr5-bounce-guard-and-network-clarity-2026-11-21`  
**Latest PR #6 head at this checkpoint:** `d7daa5bb3c316123962d63bddc80c6a9c00abedd` (Draft; no merge)
**Exact head covered by CI #281:** `d7daa5bb3c316123962d63bddc80c6a9c00abedd`  
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

Latest exact-head verification: GitHub Actions #281 passed on exact head `d7daa5bb3c316123962d63bddc80c6a9c00abedd`:
- Tact build and deployment-generator TypeScript compilation: passed.
- Offline StateInit generator smoke test executed twice; BOC and manifest compared byte-for-byte: passed (dummy `example.invalid` metadata URI only).
- Jest / TON Sandbox: 20/20 tests passed.
- `npm audit --audit-level=high`: passed; zero reported vulnerabilities.

Run: https://github.com/vahidnemati3544-opsking/v-coin-TON/actions/runs/44891891263

The smoke test verifies deterministic serialization for test inputs only. It does not verify or approve the final production metadata URI, logo, Mainnet network identity, or a signed deployment transaction.

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
4. **Deployment builder (partially complete):** the offline StateInit generator is implemented in `contracts/jetton/deploy/prepare-mainnet.ts`. It emits `state-init.boc` and a manifest with source/toolchain/input/code/data/StateInit hashes and derived Master address. CI #273 passed the Tact build, TypeScript compilation, two-run byte-for-byte determinism smoke test, Jest/Sandbox tests, and high-severity dependency audit. The smoke test used a dummy `example.invalid` metadata URI; no production artifact or wallet-signable transaction preview has been prepared. Remaining: independently reproduce production inputs, verify generated master address/StateInit, and design/review any transaction-preview format without adding signing or broadcast.
5. **Mainnet identity guard:** fail closed unless the network is positively identified as TON Mainnet. A text field saying "mainnet" is not proof. No Testnet fallback and no ambiguous network selection.
6. **Metadata finalization:** review the exact TEP-64 metadata cell/URI, content availability, immutable hosting/pinning and canonical logo. The current public logo/metadata approval is not yet closed.
7. **Wallet-control proof:** Founder must verify control of each of the five owner wallets on Mainnet in their own wallet interfaces. Never submit seed phrases or private keys.
8. **Deployment and issuance sequence:** independently verify exact initialization parameters, owner/admin address, all five distinct recipient addresses, category order, TON fee reserve, expected resulting wallet addresses, supply getters and post-deployment verification procedure.
9. **Transaction review and approval:** present exact source/build hashes, network, master address derivation, StateInit hash, deployment BOC, fees and every later category issuance payload to the Founder. Each irreversible transaction requires explicit Founder approval and local signing.

## 5. Safe next work package

**Action 25 — Prepare deterministic Mainnet deployment package (no broadcast): PARTIALLY IMPLEMENTED**

- [x] Pinned Tact compiler/dependencies and committed lockfile.
- [x] Added offline StateInit builder, source-commit guard, source/toolchain hashes, and manifest.
- [x] CI #275 passed the build, generator type-check, two-run deterministic StateInit/manifest comparison, 20/20 contract tests and dependency audit on exact head `d8dc4046ed2f8bc8db7e1f4abd900b148889a730`.
- [ ] Independently reproduce and verify production artifacts using Founder-approved immutable metadata/logo URI.
- [ ] Independently verify master address and StateInit serialization.
- [ ] Design and review a human-readable deployment transaction preview; do not sign or broadcast.
- [ ] Add actual Mainnet network identity verification only to a separately reviewed verifier; the current builder is offline and its `mainnet` label is not proof of network identity.
- [ ] Complete the post-deployment getter/balance verification checklist.
- Keep signing local in the Founder's wallet. Do not include keys, seed phrases or automatic broadcast.

**Status:** builder implementation and CI smoke verification complete; production artifact generation and independent review pending. No transaction has been prepared for signing or broadcast.

## 6. Release gate

Only after every blocker in Section 4 is evidenced as closed may a separate Mainnet deployment proposal be presented. The Founder must inspect and approve the exact final source hash, compiler/build hash, network, StateInit, destination and fee payload before signing.

**Current state: NOT DEPLOYED. NO MINT. NO TRANSFER. NO MAINNET BROADCAST.**
