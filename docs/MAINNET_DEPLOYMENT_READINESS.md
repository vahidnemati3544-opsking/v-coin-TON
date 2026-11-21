> **SUPERSEDED POLICY NOTICE — 2026-11-21:** The Founder has cancelled the paid independent audit requirement and elected to proceed under their own responsibility using internal engineering verification. The older independent-audit gate and checklist below are retained as historical context only and are not a current requirement. The current governing decision is `docs/FOUNDER_RISK_ACCEPTANCE.md` and internal verification tracker Issue #10. This waiver is not independent certification or a security guarantee. Exact transaction review and explicit Founder approval remain mandatory before any irreversible Mainnet action.

---

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
5. **Mainnet identity guard (implemented):** `scripts/verify-mainnet-network.cjs` reads TON Center ConfigParam 19 and fails closed unless global ID is -239. CI #365 executed it successfully. Run again immediately before any future transaction and independently confirm the active network in the signing wallet.
6. **Metadata finalization (technical verification implemented):** TEP-64 JSON is pinned in the deployment template and references the exact canonical PNG at `contracts/jetton/assets/VCOIN-canonical-logo.png`. CI #365 fetched the pinned JSON/image and verified the image MIME, PNG signature, 1254×1254 dimensions, 2,728,338-byte length and canonical SHA-256. Founder approval of the exact metadata/artwork pair remains pending.
7. **Wallet-control proof:** Founder must verify control of each of the five owner wallets on Mainnet in their own wallet interfaces. Never submit seed phrases or private keys.
8. **Deployment and issuance sequence:** independently verify exact initialization parameters, owner/admin address, all five distinct recipient addresses, category order, TON fee reserve, expected resulting wallet addresses, supply getters and post-deployment verification procedure.
9. **Transaction review and approval:** present exact source/build hashes, network, master address derivation, StateInit hash, deployment BOC, fees and every later category issuance payload to the Founder. Each irreversible transaction requires explicit Founder approval and local signing.

### Natural downstream-bounce evidence — 2026-11-21

- [x] Five-category parameterized TON Sandbox test observes a real protocol bounce from a failing derived Jetton wallet back to the Master.
- [x] Verifies supply rollback, restores the deterministic wallet StateInit, and retries only the affected category for the exact allocation cap.
- [x] GitHub Actions workflow #302 passed on exact PR head `cf362ef04990aebf928e17ebd380e0aef8b6f96f`: `npm ci`, Tact build, deployment-generator type-check, deterministic offline StateInit smoke test, Jest/Sandbox suite, and high-severity dependency audit.
- [ ] Independent reviewer must reproduce/review the test and contract behavior; external audit and complete TEP-74/TEP-64 conformance review remain open.

## 5. Safe next work package

**Action 25 — Prepare deterministic Mainnet deployment package (no broadcast): IMPLEMENTED FOR REVIEW — canonical asset and metadata verified; independent approvals/release gates remain pending**

- [x] Pinned Tact compiler/dependencies and committed lockfile.
- [x] Added offline StateInit builder, source-commit guard, source/toolchain hashes, and manifest.
- [x] CI #275 passed the build, generator type-check, two-run deterministic StateInit/manifest comparison, 20/20 contract tests and dependency audit on exact head `d8dc4046ed2f8bc8db7e1f4abd900b148889a730`.
- [x] Corrected the repository display asset's MIME/extension mismatch: the 194,115-byte JPEG is now stored as `contracts/jetton/assets/vcoin-canonical-logo.jpg` (commit `1dac91b520de6b9d3dbf7d615128ff2ec3e95f5e`). It visually represents the approved V COIN artwork but is not byte-identical to the 1254×1254 Library PNG (SHA-256 `08d71b17fecb86ae6006ba0fc498675dc4024b13d3f40459dcd578dfc09719d1`).
- [x] Published TEP-64 metadata JSON at the commit-pinned URL in commit `9fd9f2b119a0f6b3d343a7a0670ba430c3864aa3`; updated deployment template to reference the pinned metadata and image URLs.
- [x] Confirm exact Founder-selected PNG is committed in the public repository and the pinned public image matches the canonical source SHA-256; CI #365 passed the metadata/image retrieval and hash validator.
- [x] Automated public retrieval/content verification of the pinned metadata/logo URI passed in CI #365.
- [ ] Founder approval of the exact metadata/logo pair.
- [ ] Independently reproduce and verify production artifacts using Founder-approved immutable metadata/logo URI.
- [ ] Independently verify master address and StateInit serialization.
- [ ] Design and review a human-readable deployment transaction preview; do not sign or broadcast.
- [x] Added read-only Mainnet network identity verifier; CI #365 confirmed ConfigParam 19 global ID -239. Re-run immediately before any future transaction and confirm the wallet network independently.
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
5. **Network identity:** offline builder manifest now explicitly records network_identity_verified: false. It cannot prove the active TON network. A read-only verifier has now been added at scripts/verify-mainnet-network.cjs. It queries TON Center getConfigParam(19), parses the signed int32, and exits nonzero unless the network global ID is -239. It must be run immediately before any separately approved transaction, with independent confirmation in the signing wallet. The offline builder continues to record network_identity_verified: false.
6. **Canonical logo:** the exact PNG is already committed at contracts/jetton/assets/VCOIN-canonical-logo.png; Git blob SHA 278e852eb43f4dea8057331749db018395e96358, source SHA-256 08d71b17fecb86ae6006ba0fc498675dc4024b13d3f40459dcd578dfc09719d1. Metadata now points to that case-sensitive path, not the JPEG rendition. CI validator fetches pinned metadata and PNG and checks MIME, dimensions, byte count and SHA-256. Public verification must pass on the exact head.
7. **Metadata validation:** added scripts/verify-metadata.cjs and npm run verify:metadata, wired into the Jetton workflow against immutable commit-pinned metadata and image URLs. The validator compares public JSON with the checked-in metadata and validates the canonical image bytes.

**Remaining release blockers:** exact-head CI must pass; the Mainnet network-identity verifier is implemented but must be executed at the point of any future transaction and independently confirmed in the wallet; Founder approval of the exact metadata/artwork pair remains pending; independent smart-contract audit and independent TEP-74/TEP-64 review remain outstanding; all five wallet-control proofs, independent artifact reproduction, fee/payload review, and explicit approval of any exact Mainnet transaction remain outstanding. The Draft PR must not be merged or deployed until these are closed. No transaction has been signed or broadcast.


## 8. Latest exact-head verification — 2026-11-21

GitHub Actions run #365 passed on exact PR head e75560a1e8c18f06027e1787badfe4ea50263afd (run: https://github.com/vahidnemati3544-opsking/v-coin-TON/actions/runs/44929249279):

- npm ci: passed.
- Public pinned TEP-64 metadata and canonical PNG verification: passed; 2,728,338 bytes, 1254×1254, SHA-256 08d71b17fecb86ae6006ba0fc498675dc4024b13d3f40459dcd578dfc09719d1.
- Live read-only TON Mainnet identity check: passed; ConfigParam 19 global ID -239.
- Tact build and offline artifact-generator TypeScript check: passed.
- Two-run deterministic offline StateInit/manifest comparison: passed.
- Jest / TON Sandbox: 26/26 tests passed, including burn-before-final-allocation and final-category bounce recovery after a prior burn.
- npm audit --audit-level=high: passed; zero reported vulnerabilities.

This is project CI/emulator and read-only endpoint evidence, not an independent external smart-contract audit, wallet-control proof, signed transaction, or authorization to deploy. The PR remains Draft and unmerged; Mainnet release remains NO-GO pending independent audit/conformance review, Founder approval, wallet-control verification, independent artifact reproduction and exact transaction review.


## 9. Unsigned Mainnet candidate package — CI run #375

The production-metadata offline candidate workflow completed successfully on PR head `51421af667b47f7eb64e75a4dec792399aa11187` and generated merge commit `8b66e9bef50918e18c4995ef9b4032989babeea6`.

- Run: https://github.com/vahidnemati3544-opsking/v-coin-TON/actions/runs/44930581309
- Uploaded artifact: `vcoin-mainnet-predeploy-candidate-8b66e9bef50918e18c4995ef9b4032989babeea6` (ZIP SHA-256 `2106fff283e21144e6e42192ca8b77a7742a729c4f82fe75fd53f857b9675e30`).
- Contents: `state-init.boc`, offline builder `manifest.json`, and `audit-manifest.json` inventorying 36 source/config/build/artifact files.
- Candidate Master address (derived offline from the reviewed owner and pinned metadata URI): `UQD2yDIaHQ_uO2MxJBrQ2s_dMJrXA7OKRjb0J8IEUuPMGU38`.
- StateInit BOC SHA-256: `b5318a2cef495a8e9421093a570aaeb604786147413d3d59967d5580901e8374`.
- Audit inventory SHA-256: `6d43610da217104e07468636115ae61f449554199ad9b9962f6574c38fc660ed`.
- Canonical PNG SHA-256 reverified in the inventory: `08d71b17fecb86ae6006ba0fc498675dc4024b13d3f40459dcd578dfc09719d1`.
- Exact run result: metadata retrieval/hash PASS; Mainnet ConfigParam 19 global ID -239 PASS; production-metadata StateInit built twice and BOC/manifest matched byte-for-byte; 26/26 Sandbox tests passed; dependency audit reported zero vulnerabilities.

The artifact is an **unsigned StateInit candidate**, not a signed deployment transaction. Its manifest explicitly says no network connection, no network identity verification by the offline builder, no transaction created, no signing, no broadcast, and no private key handling. Independent auditor reproduction and Founder approval remain mandatory. Any newer PR head requires its own fresh candidate artifact; do not reuse this package for a different source commit.
