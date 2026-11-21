# V COIN–TON — Independent Audit and Mainnet Predeployment Dossier

**Document ID:** VCT-AUDIT-PREDEPLOY-001  
**Revision:** 1.0.0  
**Checkpoint:** 2026-11-21  
**Repository:** `vahidnemati3544-opsking/v-coin-TON`  
**Review branch:** `audit/pr5-bounce-guard-and-network-clarity-2026-11-21`  
**Pull request:** [#6 — Draft, open, unmerged](https://github.com/vahidnemati3544-opsking/v-coin-TON/pull/6)  
**Scope:** Independent V COIN–TON TEP-74 Jetton only. The legacy BNB project is out of scope.

## 1. Purpose and assurance boundary

This dossier consolidates the source-review findings, corrective changes, CI evidence, deterministic artifact-generation procedure, and materials to be handed to a qualified independent TON smart-contract auditor.

**Important:** This is an internal engineering dossier. It is not an independent third-party audit, certification, legal opinion, or deployment authorization. No external auditor has signed off on the code in this dossier.

## 2. Seven findings and remediation record

| # | Finding | Remediation / evidence | State |
|---:|---|---|---|
| 1 | A burn could reduce net `total_supply` before the fifth allocation and make the final-allocation completion check fail; bounce recovery also had to remain valid after a burn. | Completion is based on all five immutable category-issued flags, not net supply. A regression test burns after an earlier allocation, forces the final destination wallet to bounce, checks supply rollback, restores wallet state and retries the final category. | Implemented; CI evidence must be checked on the exact dossier artifact commit. |
| 2 | Jetton PR workflow had excessive write capability and automated lockfile mutation/push behavior. | Workflow permission is `contents: read`; third-party actions are pinned to full commit SHAs; automatic lockfile commits/pushes removed. | Implemented; verify exact workflow head in CI. |
| 3 | Allocation manifest and older policy text described Founder vesting despite the approved unrestricted Founder authority charter. | Vesting configuration removed from the active allocation manifest and deployment model; Founder allocation is an ordinary transferable Jetton balance. | Corrected in current review branch; historical documents may retain superseded text and must not be treated as current policy. |
| 4 | Tokenomics/specification text conflicted with the Founder instruction excluding Testnet deployment. | Mainnet-only deployment policy made explicit; local TON Sandbox testing is permitted and is not a Testnet deployment. | Corrected in the reviewed tokenomics/specification/runbook; no Testnet deployment is authorized. |
| 5 | Offline builder's `--network mainnet` label did not establish actual network identity. | Separate read-only verifier checks TON ConfigParam 19 and requires global ID `-239`; offline artifact manifest continues to state `network_identity_verified: false`. | Implemented; point-in-time check must be repeated immediately before any future transaction and independently confirmed in the signing wallet. |
| 6 | Repository had a JPEG rendition and an unverified canonical PNG path. | TEP-64 metadata now points to the exact Founder-selected PNG. Canonical source SHA-256: `08d71b17fecb86ae6006ba0fc498675dc4024b13d3f40459dcd578dfc09719d1`; Git blob SHA: `278e852eb43f4dea8057331749db018395e96358`. | Public URL, MIME, PNG signature, dimensions, byte length and SHA-256 passed CI run #365; Founder approval of exact metadata/artwork pair remains pending. |
| 7 | Metadata validation only checked URI shape and did not prove public content matched the repository's reviewed metadata and logo. | `npm run verify:metadata` fetches the immutable public JSON and PNG, compares JSON with local metadata, and verifies image MIME, PNG signature, dimensions, bytes and SHA-256. | Implemented; rerun on the exact candidate commit. |

## 3. Candidate build and reproducibility

The Jetton package provides:

- `npm run build` — compile the Tact Master/Wallet implementation.
- `npm test` — TON Sandbox integration and policy tests.
- `npm run verify:metadata` — public TEP-64 JSON and canonical PNG verification.
- `npm run verify:mainnet-network` — read-only Mainnet ConfigParam 19 identity check.
- `npm run prepare:mainnet` — offline StateInit candidate generator; no RPC, signing, or broadcast.
- `npm run audit:manifest` — SHA-256 inventory of reviewed sources, dependencies, configuration, canonical image, generated compiler outputs, StateInit BOC and offline builder manifest.

The Jetton workflow now generates the candidate using the pinned production metadata URI and Founder owner address, runs the generator twice, compares StateInit BOC and builder manifest byte-for-byte, creates the audit hash inventory, and uploads the resulting unsigned package as a GitHub Actions artifact. The workflow is read-only and does not hold deployment secrets.

The generated `audit-manifest.json` records the exact checked-out commit, SHA-256 and byte count for every included file, Git blob IDs for tracked files, compiler/toolchain versions, metadata/image URIs, and explicit false values for transaction creation, signing, broadcast, and private-key handling.

**Artifact integrity rule:** use only the artifact uploaded by the successful workflow run whose `source_commit` exactly matches the commit being independently reviewed. Do not use a package from an earlier run or branch head.

## 4. CI evidence already recorded

- Workflow run #365 passed the metadata/image public retrieval and SHA-256 gate, Mainnet ConfigParam 19 check, Tact build, TypeScript generator check, deterministic double-generation smoke test, 26/26 Sandbox tests, and `npm audit --audit-level=high` with zero reported vulnerabilities.
- Workflow run #367 passed on commit `37dfb0b443a0248e9f13c964e1bb103eb1b90e1d`, before the production-metadata candidate artifact packaging and audit-manifest workflow additions in this revision. Its result is historical evidence only for that exact commit.
- The CI run triggered by the candidate-package workflow changes must pass before the new artifact is accepted as the current review candidate.

## 5. Independent auditor's required review scope

The external auditor should review the exact source commit and generated artifact, not just this narrative:

1. TEP-74 Master and Wallet message layouts, getters, address derivation and interoperability.
2. TEP-64 metadata cell serialization, immutable metadata URI, image retrieval and display behavior.
3. Fixed supply and all five category caps; one-time destination configuration; replay/idempotency behavior; category state transitions.
4. Burn accounting and supply invariants, including burn-before-final-allocation.
5. Every bounce path: transfer, burn notification, failed mint delivery, category rollback and retry, including gas/value edge cases.
6. Authorization boundaries, sender validation, owner changes if any, and absence of hidden freeze/clawback/unauthorized mint paths.
7. Jetton transfer, notification, excess and response-destination semantics; TEP-89 wallet-address provision behavior.
8. TVM execution limits, gas/forward-fee calculations, storage reserve and failure handling.
9. Compiler/build reproducibility, StateInit serialization, master address derivation, code/data hashes and artifact manifest.
10. CI supply-chain security, action pinning, token permissions, dependency audit and untrusted pull-request execution boundaries.

The auditor's report must identify auditor/entity, date, exact source commit, compiler version, reviewed code hashes, findings with severity, remediation references, retest evidence and residual risks.

## 6. Founder-controlled wallet and metadata gates

The five recorded Mainnet allocation owner-wallet candidates are in `contracts/jetton/deployment.config.template.json` and `allocation-manifest.template.json`. They are not proofs of control and are not derived Jetton-wallet contract addresses.

Before deployment, the Founder must independently verify control of each address in their own wallet interface. Never provide or upload recovery phrases, private keys, PINs, or signing credentials.

The Founder must also approve the exact metadata JSON and canonical logo pair. CI's byte-level verification proves identity of the published file; it does not constitute Founder approval.

## 7. Remaining release blockers

- [ ] Qualified independent smart-contract audit of the exact candidate commit and generated code.
- [ ] Independent full TEP-74 / TEP-64 conformance review.
- [ ] Independent clean-room rebuild and StateInit/master-address reproduction.
- [ ] Successful CI for the production-metadata artifact-package workflow on the exact current candidate commit.
- [ ] Founder approval of exact metadata JSON and canonical PNG.
- [ ] Founder verification of control over all five Mainnet allocation wallets.
- [ ] Human-readable deployment payload preview with exact master address, owner, metadata cell, StateInit hash, fee budget and destination review.
- [ ] Separate explicit Founder approval of the exact irreversible Mainnet deployment transaction.

## 8. Prohibited actions / current decision

- No Testnet deployment.
- No Mainnet deployment, mint, allocation transfer, wallet signing or broadcast.
- No private keys or recovery phrases in repository, CI, or assistant context.
- No PR merge or release while independent audit and Founder gates remain open.

**Current decision: HOLD / NO-GO.** This dossier prepares the candidate for external review; it does not authorize deployment.
