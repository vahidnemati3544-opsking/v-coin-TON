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
3. **Natural downstream-bounce proof — Sandbox evidence completed on reviewed PR head `cf362ef04990aebf928e17ebd380e0aef8b6f96f` (CI #302):** the parameterized integration test exercises all five allocation categories. For each category, the derived destination Jetton wallet is made to fail TVM execution; the Master-to-wallet message is observed as bounceable and aborted; the bounced message returns to the Master successfully; total supply is verified restored to zero; the deterministic wallet StateInit is restored; and retry credits exactly that category cap with matching total supply. CI #302 passed the full contract test suite. This closes the project Sandbox bounce-test gate only; it is not a Mainnet transaction, external audit, or independent protocol-conformance review.
4. **Deployment builder (partially complete):** the offline StateInit generator is implemented in `contracts/jetton/deploy/prepare-mainnet.ts`. It emits `state-init.boc` and a manifest with source/toolchain/input/code/data/StateInit hashes and derived Master address. CI #273 passed the Tact build, TypeScript compilation, two-run byte-for-byte determinism smoke test, Jest/Sandbox tests, and high-severity dependency audit. The smoke test used a dummy `example.invalid` metadata URI; no production artifact or wallet-signable transaction preview has been prepared. Remaining: independently reproduce production inputs, verify generated master address/StateInit, and design/review any transaction-preview format without adding signing or broadcast.
5. **Mainnet identity guard:** fail closed unless the network is positively identified as TON Mainnet. A text field saying "mainnet" is not proof. No Testnet fallback and no ambiguous network selection.
6. **Metadata finalization (partially implemented):** TEP-64 JSON is committed at `9fd9f2b119a0f6b3d343a7a0670ba430c3864aa3` with a commit-pinned image URL to the correctly suffixed JPEG rendition at `1dac91b520de6b9d3dbf7d615128ff2ec3e95f5e`. Deployment template references the pinned JSON URL. Founder approval, independent public retrieval/content verification, and exact master-PNG binary replacement remain open.
7. **Wallet-control proof:** Founder must verify control of each of the five owner wallets on Mainnet in their own wallet interfaces. Never submit seed phrases or private keys.
8. **Deployment and issuance sequence:** independently verify exact initialization parameters, owner/admin address, all five distinct recipient addresses, category order, TON fee reserve, expected resulting wallet addresses, supply getters and post-deployment verification procedure.
9. **Transaction review and approval:** present exact source/build hashes, network, master address derivation, StateInit hash, deployment BOC, fees and every later category issuance payload to the Founder. Each irreversible transaction requires explicit Founder approval and local signing.

### Natural downstream-bounce evidence — 2026-11-21

- [x] Five-category parameterized TON Sandbox test observes a real protocol bounce from a failing derived Jetton wallet back to the Master.
- [x] Verifies supply rollback, restores the deterministic wallet StateInit, and retries only the affected category for the exact allocation cap.
- [x] GitHub Actions workflow #302 passed on exact PR head `cf362ef04990aebf928e17ebd380e0aef8b6f96f`: `npm ci`, Tact build, deployment-generator type-check, deterministic offline StateInit smoke test, Jest/Sandbox suite, and high-severity dependency audit.
- [ ] Independent reviewer must reproduce/review the test and contract behavior; external audit and complete TEP-74/TEP-64 conformance review remain open.

## 5. Safe next work package

**Action 25 — Prepare deterministic Mainnet deployment package (no broadcast): PARTIALLY IMPLEMENTED — asset path and TEP-64 metadata URI corrected; exact master PNG replacement and approvals remain pending**

- [x] Pinned Tact compiler/dependencies and committed lockfile.
- [x] Added offline StateInit builder, source-commit guard, source/toolchain hashes, and manifest.
- [x] CI #275 passed the build, generator type-check, two-run deterministic StateInit/manifest comparison, 20/20 contract tests and dependency audit on exact head `d8dc4046ed2f8bc8db7e1f4abd900b148889a730`.
- [x] Corrected the repository display asset's MIME/extension mismatch: the 194,115-byte JPEG is now stored as `contracts/jetton/assets/vcoin-canonical-logo.jpg` (commit `1dac91b520de6b9d3dbf7d615128ff2ec3e95f5e`). It visually represents the approved V COIN artwork but is not byte-identical to the 1254×1254 Library PNG (SHA-256 `08d71b17fecb86ae6006ba0fc498675dc4024b13d3f40459dcd578dfc09719d1`).
- [x] Published TEP-64 metadata JSON at the commit-pinned URL in commit `9fd9f2b119a0f6b3d343a7a0670ba430c3864aa3`; updated deployment template to reference the pinned metadata and image URLs.
- [ ] Replace the JPEG rendition with the exact Founder-selected PNG binary in the public repository; confirm the image rendered from the pinned URL matches the master file byte-for-byte.
- [ ] Founder approval and independent public retrieval/content verification of the final metadata/logo URI.
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


## 7. Corrective audit actions — 2026-11-21

The following code and documentation corrections were committed to the review branch after the earlier evidence recorded above. Older commit references in Sections 1–6 are historical checkpoints and do not describe the latest branch head.

1. **Burn-before-final-allocation invariant:** the Master now locks minting when all five immutable category-issued flags are true; it no longer requires net total_supply to equal the original maximum, because valid burns reduce net supply. A regression test burns tokens after the first category and before the fifth, verifies the remaining allocations complete, checks net supply, and confirms further issuance is rejected. Exact-head CI is still required.
2. **GitHub Actions permissions:** Jetton PR workflow now has contents: read, uses pinned action commit SHAs, removes automatic lockfile mutation/branch push, and no longer checks out an untrusted PR branch with write permissions.
3. **Allocation-manifest governance:** obsolete founder_vesting and four-year vesting language were removed; the Founder allocation is recorded as an ordinary immediately transferable allocation under the approved Founder authority policy.
4. **Testnet policy:** Jetton contract specification now states Mainnet-only deployment review and explicitly excludes Testnet deployment. Sandbox tests remain allowed and are not a Testnet deployment.
5. **Network identity:** offline builder manifest now explicitly records network_identity_verified: false. It cannot prove the active TON network. A separately reviewed Mainnet identity verifier remains a hard NO-GO blocker; no transaction assembly, signing or broadcast is permitted on the basis of the --network mainnet label.
6. **Canonical logo:** the exact PNG is already committed at contracts/jetton/assets/VCOIN-canonical-logo.png; Git blob SHA 278e852eb43f4dea8057331749db018395e96358, source SHA-256 08d71b17fecb86ae6006ba0fc498675dc4024b13d3f40459dcd578dfc09719d1. Metadata now points to that case-sensitive path, not the JPEG rendition. CI validator fetches pinned metadata and PNG and checks MIME, dimensions, byte count and SHA-256. Public verification must pass on the exact head.
7. **Metadata validation:** added scripts/verify-metadata.cjs and npm run verify:metadata, wired into the Jetton workflow against immutable commit-pinned metadata and image URLs. The validator compares public JSON with the checked-in metadata and validates the canonical image bytes.

**Remaining release blockers:** exact-head CI must pass; the Mainnet network-identity verifier is not yet implemented; Founder approval of the exact metadata/artwork pair remains pending; independent smart-contract audit and independent TEP-74/TEP-64 review remain outstanding; all five wallet-control proofs, independent artifact reproduction, fee/payload review, and explicit approval of any exact Mainnet transaction remain outstanding. The Draft PR must not be merged or deployed until these are closed. No transaction has been signed or broadcast.
