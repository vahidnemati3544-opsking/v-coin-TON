# CURRENT CONTROLLING RELEASE STATUS — 2026-11-24 (Action #67)

> This section supersedes conflicting older policy/status summaries below. Historical run records remain historical and must not be treated as verification of the current Founder-first design.

## Approved custody and allocation policy

- Fixed supply: **2,100,000,000 VCOIN**, six decimals, no additional minting.
- The full supply is to reach Founder Mainnet wallet `UQBh9jVKAypc4TrbFx2jsVB2EI1ONChg22zDputisQjENQOT` in two separate incoming transfers. Stage amounts are intentionally unspecified until the Founder approves the transaction plan; Stage 2 requires a fresh explicit Founder authorization.
- After receipt, the Founder retains 420,000,000 VCOIN and signs four capped distributions: Mining 1,050,000,000; Treasury 210,000,000; Liquidity/Market 210,000,000; Ecosystem/Marketing 210,000,000 VCOIN.
- The Founder Mainnet wallet is also the sole GAS & OPERATIONS wallet. **There is no separate GAS wallet and no sixth allocation wallet.**
- Former address `UQAdW09EvIesUXt9jzLq1T32O0351TaczwWJQLGGmw4aWrzy` is Testnet-only historical data and must never be used on Mainnet.
- No Testnet deployment or transaction is authorized. Local TON Sandbox is permitted. No Mainnet transaction is authorized by this status document.

## Current implementation and CI evidence

- Latest reviewed code-bearing commit: `5525a85f00b2b9b33c86e91192ad3403d09467e0` — [commit](https://github.com/vahidnemati3544-opsking/v-coin-TON/commit/5525a85f00b2b9b33c86e91192ad3403d09467e0).
- Action #67 disabled the obsolete direct-five-wallet mint preview generator, removed its invocation from CI, and added a fail-closed artifact/planner guard. The public Pages page is read-only HOLD / NO-GO.
- GitHub combined-status lookup for the reviewed code commit returned no check statuses, and the available workflow-run lookup did not expose a push-triggered run. **Exact-head CI for Action #67 is not verified.**
- The last fully evidenced successful workflow is [run #320](https://github.com/vahidnemati3544-opsking/v-coin-TON/actions/runs/45127119730) on older commit `53039de8263b6e5b76ff2c0f3afb636e96c215d3`. Both build-and-test and Pages deployment/endpoint verification succeeded there. It predates the 2026-11-24 owner instruction and does not verify the current contract behavior or Action #67 guards.
- `contracts/jetton/package-lock.json` exists, uses lockfileVersion 3, and is committed. The last recorded clean `npm ci`, Tact build, Sandbox and npm audit results belong to run #320, not the current code head.
- Last recorded Sandbox result: 3 suites / 21 tests passed. Those tests cover the superseded direct-five-wallet mint design and the Founder-only TON withdrawal guard; they do **not** test the current two-stage Founder-first receipt and four capped distributions.
- Last recorded npm audit in run #320: zero advisories. Current-head audit result is unavailable.
- TEP-64 `metadata.json` exists and is pinned to commit `e17bcb9d82ea182bff3358b9fac6b5fa25c166ee`. Previously generated metadata content-cell hash: `abadcbc42c4e6309bea1d595dbfd1b834a07bfb171b2b1e2cb6d4b7e244330ca`. Current-head regeneration is not verified.
- Earlier independent BOC parsing reproduced TON code-cell/StateInit and five Jetton Wallet hashes from a previous CI artifact. That was not a clean-room source rebuild and is not a current deployment package: the Founder address and custody policy have since changed. Rebuild and reproduce all hashes only after the contract redesign is complete.
- The current `VCoinMaster` source still contains the old five-recipient fixed direct-mint logic. It does not implement two separately authorized Founder receipts followed by four capped Founder-signed distributions. The legacy preview generator is disabled so it cannot produce misleading payloads.
- The current project policy does not define an external security-audit engagement as a project workstream or release condition. The earlier internal source review applies to the former contract design; a fresh internal engineering review of the redesigned contract remains necessary. No vulnerability-free or external-certification claim is made.
- The five owner addresses are recorded in `docs/WALLET_ALLOCATION_REGISTER.md`; address presence is not proof of wallet control. Deployment template flags remain `deployment_authorized=false` and `mainnet_authorized=false`.
- The read-only Pages source contains HOLD / NO-GO. Publication of the latest read-only page and workflow guard changes is not verified by an exact-head Actions run.

## Remaining release gates

1. Implement two separately authorized Founder receipts, with Stage 2 minting exactly the remaining supply after a fresh Founder transaction.
2. Implement and test the four capped distributions to the registered destinations, including replay protection, bounce/retry, and full accounting reconciliation.
3. Update the deployment/transaction planner only from the revised exact source; do not restore the legacy preview generator.
4. Run exact-head clean `npm ci`, strict dependency audit, Tact compilation, and complete local TON Sandbox tests for the new flow.
5. Perform a clean-room rebuild with the pinned toolchain and independently reproduce TON code-cell, metadata, Master StateInit, and all five Jetton Wallet StateInit hashes/addresses.
6. Verify Founder wallet control, exact Mainnet destinations, live fees/reserve, and the published read-only status page.
7. Present exact transaction details to the Founder and wait for explicit approval and wallet signatures. Never infer approval.

**Safety boundary:** No Mainnet or Testnet transaction was sent by Action #67. No contract was deployed and no VCOIN was minted. Never request or store seed phrases, private keys, PINs, or recovery codes.

---

Current controlling status correction (2026-11-23): This file preserves historical verification snapshots. Any older checklist entry below that lists an independent external security audit, specialist audit, or independent TEP audit as a pending task or release gate is superseded and is not an active V COIN–TON work item. Current policy: 2,100,000,000 VCOIN (6 decimals); Founder 420,000,000 immediate/no vesting; exactly five allocation wallets, Founder also sole GAS & OPERATIONS wallet; Mainnet-only execution, local Sandbox permitted, no Testnet deployment or transaction authorized. Remaining engineering/owner gates must be judged only from current evidence, not historical checklists.

> **Controlling baseline correction (2026-11-23):** This file contains historical verification snapshots. Current policy: 2,100,000,000 VCOIN total supply, six decimals, 420M Founder allocation credited immediately with no vesting/time lock/installments, 1.05B Mining reserve, 210M each Treasury/Liquidity/Ecosystem; Founder wallet is also the sole GAS & OPERATIONS wallet; Mainnet-only execution after local engineering verification; no Testnet deployment, transaction, or rehearsal; no independent external audit workstream, pending task, or release condition. Any older checklist entry below requiring external audit, Testnet rehearsal, Founder vesting, a separate fee wallet, or conflicting supply/price assumptions is historical and superseded. The current modelled USD reference baseline is 0.004, not a market quote or guarantee. Current technical release gates remain clean-room rebuild, engineering tests, wallet-control verification, live fee/reserve and exact-payload checks, and explicit Founder authorization. No Mainnet transaction is authorized by this document.

# PROJECT SCOPE CORRECTION — 2026-11-23 (Action #64)

This controlling note supersedes earlier historical checklist entries that listed an independent external security audit or specialist audit as pending, required, or release-blocking. V COIN–TON has no external certification engagement, and independent external auditing is not a defined project workstream, pending task, or Mainnet release condition. Do not carry those historical checklist entries forward as current work. Continue the project's actual engineering checks: source review, deterministic builds, automated tests, Sandbox simulations, dependency scanning, exact payload/fee checks, wallet-control verification, and Founder authorization. This correction does not certify the contracts as vulnerability-free and does not waive any technical release gate.

---

# STATUS LABEL CORRECTION — 2026-11-23 (Action #63)

This note clarifies the commit references in Action #62 and supersedes the ambiguous “Latest main commit” label in that section:

- **Latest implementation/configuration baseline used for the reproduced preview:** `6e3ad85e99b454c1f38a7fea74a982fd89ee3ede`; exact-head run #318 passed.
- **Action #62 verification-report commit:** `27696f8a407d1ae5dd8cbc8bf4a96cc3439153ac`; exact-head run #319 passed both `build-and-test` and `deploy-issuer`, including all published Pages endpoint checks.
- Run #319 artifact ID `14796122451`; ZIP SHA-256 `8c39f933f7a1730748ab1d4f6597fb3fa413853c64b0b723dc9886c48b042750`. The downloaded exact-head artifact was independently rechecked; its Master code/data/StateInit, metadata, five Jetton Wallet StateInit hashes, and friendly-address checksums match the Action #62 values.
- Run #319 exact-head evidence: lockfile install, Tact compile, TEP-64 content generation, unsigned preview generation, issuer guards, Pages deployment and endpoint verification all passed; npm audit reported zero vulnerabilities; Jest passed 3 suites / 21 tests.
- This status-label correction changes documentation only; it does not change the contract, configuration, metadata, issuer, allocation addresses or transaction payloads.
- Mainnet remains NO-GO until the clean-room source rebuild, Founder wallet-control verification and live exact-payload fee/reserve simulation are complete. No Mainnet or Testnet transaction was sent.

## Action #63 — Correct source-baseline labeling and record Action #62 exact-head CI

**Status:** Documentation correction committed; no contract or transaction changes.

---

# CURRENT MAINNET RELEASE STATUS — 2026-11-23 (Action #62; supersedes earlier pending-CI and preview records)

**Latest main commit:** `6e3ad85e99b454c1f38a7fea74a982fd89ee3ede` — [commit](https://github.com/vahidnemati3544-opsking/v-coin-TON/commit/6e3ad85e99b454c1f38a7fea74a982fd89ee3ede).  
**Exact-head CI:** run #318 / ID `45120195381` — [GitHub Actions](https://github.com/vahidnemati3544-opsking/v-coin-TON/actions/runs/45120195381) — **success**; both `build-and-test` and `deploy-issuer` succeeded.  
**Exact-head release artifact:** ID `14793237989`; ZIP SHA-256 `a2ac3c1d0af79e7231b84b8baa00108de2bdfef0ae867a343d70c105e4112313`.  
**Release disposition: NO-GO for Mainnet signing, deployment, or issuance.** The CI success resolves the exact-head build/Pages gate, not the clean-room rebuild, wallet-control, or live fee gates.

## Exact-head build and security evidence

- Committed `contracts/jetton/package-lock.json` exists (lockfileVersion 3); the exact-head CI ran `npm ci` successfully. Artifact lockfile SHA-256: `b778e6db4730225c9104b3cd5140418e06de8edbe50d573efc8be0e3035da653`.
- Exact-head CI passed Tact compilation, immutable TEP-64 content-cell generation, unsigned Mainnet preview generation, issuer syntax/signer/sequence guards, and all artifact uploads.
- Jest TON Sandbox: **3 suites passed, 21 tests passed**.
- `npm audit --audit-level=moderate`: **0 vulnerabilities** (0 info, 0 low, 0 moderate, 0 high, 0 critical).
- TEP-64 metadata JSON is pinned to commit `e17bcb9d82ea182bff3358b9fac6b5fa25c166ee`; the exact-head metadata content cell was generated. Its cell hash is `abadcbc42c4e6309bea1d595dbfd1b834a07bfb171b2b1e2cb6d4b7e244330ca`. The canonical JPEG logo is included through the verified Pages asset path.

## Independent TON BOC/hash reproduction — Action #62

The exact-head run #318 release ZIP was downloaded and independently parsed with a separate Python BOC/cell-hash implementation. The downloaded ZIP SHA-256 matches the GitHub artifact digest. The following hashes were independently recalculated from the artifact BOCs and match the preview:

- Master code cell: `5087c882019324e9d8e309c78f42e3bcee9433a54d7d0367d49320a7bbabcc36`.
- Master data cell: `241c4f33ce0b692788ea1e397953f923447ec3dc40bce20ad402a68de7b9fb37`.
- Master StateInit: `67e215bc6ca8454d2cfdae2639ab73ebdd27c99afd9560a65097f35631b2befb`.
- Jetton Wallet code cell: `9c9aa697222ccb0ba637dd92cde6613e2ff2c66f576fb877e552fdde32c142aa`.
- TEP-64 metadata content cell: `abadcbc42c4e6309bea1d595dbfd1b834a07bfb171b2b1e2cb6d4b7e244330ca`.
- All five deterministic Jetton Wallet StateInit hashes independently match the preview; all six friendly addresses have workchain 0, matching embedded account hashes, and valid CRC16-XMODEM checksums.

This is independent hash reproduction from the exact CI artifact. It is **not** an independent clean-room compilation from source and does not establish that any predicted address is deployed.

## Current unsigned Mainnet preview (predictions only)

- Predicted Master: `EQBn4hW8bKhFTSz9riY5q3Pr3SfJmv2VYKZQl_NWMbK--5fP`.
- Founder Jetton Wallet: `EQCOzLnnSrR-mbM_AeiKU2wpMJ28cPoRncBuQHJ-6_q-Mn0T` — StateInit `8eccb9e74ab47e99b33f01e88a536c29309dbc70fa119dc06e40727eebfabe32`.
- Mining Reserve Jetton Wallet: `EQAeVMNyrzMYA5dbHtGmTf37e7ikIbzUGSEoeqY5oIKA3kMa` — StateInit `1e54c372af331803975b1ed1a64dfdfb7bb8a421bcd41921287aa639a08280de`.
- Treasury Jetton Wallet: `EQCXegSjHrFZxC_H2TVVaastC8CxBScqjAbdDZWEEm1GBZ2U` — StateInit `977a04a31eb159c42fc7d9355569ab2d0bc0b105272a8c06dd0d9584126d4605`.
- Liquidity/Market Jetton Wallet: `EQD5mlEiKvw0KYN8MKLUUfIsjRs1xS_NAb3YEhC_KyigrA59` — StateInit `f99a51222afc3429837c30a2d451f22c8d1b35c52fcd01bdd81210bf2b28a0ac`.
- Ecosystem/Marketing Jetton Wallet: `EQA2hJ0zEZilgcBGw_ycCT8_bzgUtoS6sxqohbXDCx2PEM6t` — StateInit `36849d331198a581c046c3fc9c093f3f6f3814b684bab31aa885b5c30b1d8f10`.

The preview constructor arguments match the five canonical owner addresses in `docs/WALLET_ALLOCATION_REGISTER.md`. Founder is the sole owner, deployment/issuance signer, and GAS & OPERATIONS funder; the GAS argument equals the Founder address. There is no separate GAS wallet or sixth allocation destination. Allocation totals remain 420M / 1,050M / 210M / 210M / 210M = **2.1B VCOIN**, six decimals. The preview requests **1.00 TON** initial Master reserve funding plus network fees; this is not a live fee quote. Jetton Wallet addresses above are deterministic predictions and must be checked against the deployed Master's `get_wallet_address` getter before any issuance.

## Release gates still open

2. Independent clean-room rebuild from the exact source and pinned toolchain: **pending**. Action #62 reproduced hashes from the exact CI BOCs but did not independently compile the source.
3. Founder wallet-control and intended TON Mainnet network verification for the five owner destinations: **pending**; an address register is not proof of control.
4. Live fee and Master-reserve simulation against the exact deployment and five issuance payloads: **pending**. 1.00 TON is the preview attachment, not a guaranteed total debit.
5. Founder review of the final transaction package and explicit signature for deployment and each separate allocation: **pending**.

## Pages and transaction boundary

- GitHub Pages deployment in run #318 succeeded; the issuer deployment job and its endpoint verification step both passed. The repository integration currently reports admin permission.
- No Mainnet or Testnet transaction was sent. No contract was deployed, no token was minted, and no wallet was funded by this action.
- The current project execution policy remains Mainnet-only after all release gates; local Sandbox testing is permitted. No Testnet transaction is authorized.
- Never request or store seed phrases, private keys, PINs, or recovery codes.

## Action #62 — Exact-head CI, artifact, and independent hash verification

**Status:** CI and artifact hash reproduction completed; Mainnet remains NO-GO.

- Verified exact `main` commit and run #318, including both successful CI jobs and Pages endpoint checks.
- Downloaded the exact-head release artifact; ZIP SHA-256 matched the artifact digest.
- Reproduced Master code/data/StateInit, Jetton Wallet code, TEP-64 content, and all five Jetton Wallet StateInit hashes independently; checked all six friendly address account hashes and CRC16 checksums.
- Verified committed lockfile, clean `npm ci`, zero npm audit vulnerabilities, and 3/3 Sandbox suites with 21/21 tests.
- Reconciled the unsigned preview's five owner addresses and allocations against the canonical wallet register.
- No transaction, deployment, mint, or transfer was performed.

---

# CURRENT MAINNET ADDRESS RECONCILIATION — 2026-11-23 (Action #61; supersedes all earlier preview records)

**Current approved allocation baseline:** 2,100,000,000 VCOIN total; 6 decimals; 2,100,000,000,000,000 base units. Founder 420,000,000 (20%); mining rewards 1,050,000,000 (50%); Treasury, Liquidity/Market, and Ecosystem/Marketing 210,000,000 each (10% each).  
**Last implementation/documentation baseline commit before this status note:** `a6fec0da4b42af0dc6d8d9f7137ac56550ab8543`  
**Exact-head CI for this corrected allocation revision:** pending verification; earlier CI runs do not verify the current source head.  
**Current preview Master address / StateInit hash:** not generated for the corrected source head.  
**Recipient Jetton Wallet predictions and artifact hashes:** cleared and invalidated; regenerate from the exact reviewed build and independently reproduce before any signature.  
**Release disposition: NO-GO for Mainnet deployment and issuance until exact-head CI, clean-room hash reproduction, wallet-control verification, and live fee/reserve checks pass.**

The previous incorrect economic revision has been removed from the active source, configuration, allocation plan, issuer, and current migration runner. The current allocation is the 2.1B model above. Historical deployment previews and derived addresses from earlier source revisions must not be reused, even where a previous preview also displayed a 2.1B supply, because the current source and allocation revision require fresh exact-head build and hash verification.

No Mainnet deployment, token issuance, or wallet transfer has been confirmed by this document. A predicted address, workflow artifact, or wallet submission is not on-chain evidence.

# CURRENT MAINNET RELEASE PREFLIGHT — 2026-11-22 (Action #53; supersedes prior status entries below)

**Last full exact-head release verification:** run `45064239418` — build-and-test and deploy-issuer both succeeded  
**Exact source commit:** `bc642545d3566684db203d241e08ab4e5510edf3`  
**Contract build artifact ID:** `14770513541`  
**Contract build ZIP SHA-256:** `8cb2f5dd163af28dcf67f0de4856880745d2a579610e244da4eaceab73b9e41f`  
**Full source artifact ID:** `14770538586`  
**Full source ZIP SHA-256:** `4768032f92bf4c545d0acc74fc7aaee1d7a89dd9a7eaf6b0ea19f5ba89c72d80`  
**Complete source-and-release bundle SHA-256:** `28e0311328d0dde485f382471695602a065bfba6e221a53ab754386614ea4c58`  
**Predicted Master address (not deployed):** `EQAo1TAGqSw6oUaMmpBtgQyRtCGEbSJNiGGy2Use04lRCQlU`  
**Master StateInit hash:** `28d53006a92c3aa1468c9a906d810c91b421846d224d8861b2d94b1ed3895109`  
**Release disposition: NO-GO for Mainnet deployment and issuance.**

- Run `45064239418` passed dependency installation/audit enforcement, Tact compilation, TEP-64 metadata-cell generation, unsigned Mainnet preview generation, Jest Sandbox tests, issuer safety/sequence guards, full source snapshot upload and Pages deployment.
- The generated preview confirms fixed supply **2,100,000,000 VCOIN**, six decimals, five allocations **420M / 1,050M / 210M / 210M / 210M**, and five registered owner addresses.
- The preview's Master reserve attachment is **1.00 TON**. The contract's minimum `VCoinFund` request is 0.75 TON; the issuer now reads the amount from the exact preview rather than hard-coding it. A live network fee quote is still required.
- The full source artifact includes all source/documentation files, the safe `.env.example`, and `.gitignore`; no `.git`, `node_modules` or secrets are included.
- GitHub Pages deployment succeeded and the environment URL is `https://vahidnemati3544-opsking.github.io/v-coin-TON/`.
- Founder is the sole deployment/issuance signer and the shared GAS & OPERATIONS wallet. No separate fee wallet or sixth allocation destination exists.
- The Master source includes the Founder-only `VCoinWithdraw` path, protected by a 0.25 TON minimum reserve plus a 0.10 TON fee buffer. The issuer does not expose a withdrawal control; a withdrawal requires a separate reviewed payload.
- Public mining remains HTTP 503 until verified Mainnet Jetton wallet ownership, balance snapshots, payout and reconciliation are implemented.
- No Mainnet deployment, issuance, transfer or payout has been sent. The predicted Master/Jetton Wallet addresses are not on-chain evidence.
- Remaining gates: independent clean-room rebuild; live fee/reserve review; Founder review of network, signer, metadata, addresses and exact payloads; explicit Founder signature for deployment and each separate allocation.
- Current execution policy is Mainnet-only. No Testnet deployment or Testnet transaction is authorized.

See [Action #53 repository and ZIP review](../../docs/PROJECT_REVIEW_ACTION_53.md).

---

# CURRENT MAINNET RELEASE PREFLIGHT — 2026-11-22 (Action #51; supersedes prior status entries below)

**Artifact:** run #249 / artifact `14767013070`  
**Artifact source commit:** `834dc7bc8364110d7003106968d367b5c4755d84`  
**Current repository HEAD before this status update:** `f8d2e15b3e7f4df4709f56b51a8f5a4094b96636`  
**Release disposition: NO-GO for Mainnet deployment and issuance.**

- Downloaded and independently inspected the exact run #249 ZIP. Artifact SHA-256: `ecfc8cb99b0d2ad57dcfed3f146018c1a16a2270e93ea30827543481e54758c3`.
- Independently recalculated and matched Master StateInit, Master code-cell, Master data-cell, metadata content-cell, and all five Jetton Wallet StateInit hashes.
- Decoded the predicted Master and five recipient friendly addresses; all six account IDs match their StateInit hashes and all CRC16-XMODEM checksums pass.
- Verified the five allocation amounts sum exactly to 2,100,000,000 VCOIN at six decimals and the five owner addresses match `docs/WALLET_ALLOCATION_REGISTER.md`.
- GitHub compare confirms the 17 commits after artifact source commit changed mining/offline-client and documentation files only; Jetton source, tests, deployment script, deployment config, metadata, package manifest and lockfile were unchanged.
- The locally mounted `VCOIN-TON-MAIN-1f10257-release.zip` is older (SHA-256 `225b76dc64c6fb616b1c8575ca68a95d5435b0a5ec952836050f5163ba9cb0c4`). Do not use it as the current contract artifact.
- This is BOC/hash/address-integrity reproduction from the downloaded artifact, **not** an independent clean-room compilation or external security audit.
- Remaining blockers: qualified independent smart-contract/TEP-74/TEP-64 audit; independent clean-room rebuild; final live fee and reserve review; Founder review of exact Mainnet signer, network, metadata, addresses and payloads.
- No Mainnet deployment, issuance, or transfer has been sent. The artifact is unsigned. Mainnet remains NO-GO until every release gate is resolved and the Founder personally approves and signs each transaction.

See [Action #51 hash reproduction report](../../docs/MAINNET_RELEASE_HASH_REPRODUCTION_ACTION_51.md).

---

# CURRENT MAINNET PREFLIGHT — 2026-11-22 (Action #47; supersedes prior preflight entries below)

**Exact source commit tested:** `834dc7bc8364110d7003106968d367b5c4755d84`  
**Release disposition: NO-GO for Mainnet signature/deployment/issuance.** This is a tested unsigned release candidate, not authorization to broadcast.

## Reserve simulation and exact-head CI

- Added a Sandbox assertion that checks the actual Master account balance after all five real Jetton wallet-credit cascades and Sandbox fees; it requires at least 0.35 TON to remain.
- The prior 0.75 TON initial funding was experimentally insufficient: after all five allocations, Sandbox measured **0.2447036 TON**, below the protected 0.35 TON threshold.
- Raised the initial Master funding in `contracts/jetton/scripts/prepare-mainnet-deployment.ts` and the Sandbox deployment helper to **1.00 TON**. The five-allocation reserve assertion passed with this funding. The withdrawal-drain rejection test was also adjusted to remain meaningful under the 1.00 TON starting balance.
- GitHub Actions run #249 (run ID `45056163758`) on this exact source commit: Tact compilation, metadata generation, unsigned Mainnet preview generation, Jest tests, issuer syntax/sequence checks, and artifact upload all passed. Jest: **3 suites passed; 20 tests passed**. Dependency audit: 0 vulnerabilities.
- Exact-head release artifact: `vcoin-jetton-release-834dc7bc8364110d7003106968d367b5c4755d84`; artifact ID `14767013070`; size 173,064 bytes; SHA-256 `ecfc8cb99b0d2ad57dcfed3f146018c1a16a2270e93ea30827543481e54758c3`.
- The GitHub Pages deployment job still fails at `actions/configure-pages@v5`: `Resource not accessible by integration` when trying to create the Pages site. The owner must enable GitHub Pages through repository Settings > Pages or grant the required repository administration capability. The issuer site artifact was built and uploaded, but the hosted Pages issuer is not confirmed deployed.
- The deployment preview remains unsigned and uses **1.00 TON** for initial Master reserve funding. Predicted Master address and StateInit/code/data hashes remain the same as the preceding exact build because only deployment funding parameters and Sandbox tests changed; these remain build predictions, not on-chain evidence.

## Remaining Mainnet gates

1. Resolve GitHub Pages administration permission or approve and independently validate an alternative Founder signing workflow.
2. Complete an independent qualified smart-contract and TEP-74/TEP-64 audit; resolve critical/high findings.
3. Independently reproduce current Master code, wallet code, metadata cell, StateInit and derived address hashes from a clean environment.
4. Complete exact payload, signer, five destination addresses, and Mainnet fee review; account for real network fee variance beyond Sandbox.
5. Obtain the Founder's explicit approval and personal wallet signature for deployment and each irreversible allocation transaction.
6. After deployment, verify Master activation, the on-chain `get_wallet_address` result for each recipient, total supply, each Jetton Wallet balance, and allocation flags before proceeding to the next transfer.

**Owner execution policy:** Mainnet only; no Testnet deployment or Testnet transaction is authorized. Local compilation, Sandbox simulation, offline payload inspection, and independent review remain permitted. No Mainnet deployment, issuance, or transfer is claimed by this action.

---

# CURRENT MAINNET ISSUANCE PREFLIGHT — 2026-11-22 (Action #45; supersedes older conflicting status notes below)

**Reviewed exact source commit:** `1f10257faedf8e4cc454955621c10e9f3afccc83`  
**Release disposition: NO-GO for Mainnet signature/deployment/issuance.** This is a preflight record, not authorization to broadcast.

## Exact-head build and release package

- GitHub Actions run #243 (run ID `45054362871`): `build-and-test` completed successfully. Tact compilation, metadata cell generation, unsigned Mainnet preview generation, Jest tests, issuer syntax/sequence checks, and Pages artifact upload all passed.
- The `deploy-issuer` job failed at `actions/configure-pages@v5`: GitHub returned `Resource not accessible by integration` while attempting to create the Pages site. The deploy-pages step was skipped. Owner must enable Pages in repository Settings > Pages and select GitHub Actions, or grant the required Pages administration capability through GitHub's supported owner settings.
- Exact-head release artifact: `vcoin-jetton-release-1f10257faedf8e4cc454955621c10e9f3afccc83`; artifact ID `14765749850`; size 172,970 bytes; SHA-256 `225b76dc64c6fb616b1c8575ca68a95d5435b0a5ec952836050f5163ba9cb0c4`.
- Dependency audit report in that artifact: 0 moderate, 0 high, 0 critical advisories (0 total).
- Deployment preview remains explicitly `unsigned_mainnet_deployment_preview_only`. Predicted Master address: `EQAo1TAGqSw6oUaMmpBtgQyRtCGEbSJNiGGy2Use04lRCQlU`; StateInit hash: `28d53006a92c3aa1468c9a906d810c91b421846d224d8861b2d94b1ed3895109`; metadata content cell hash: `6dc0e0c3a9ec89e72fc8402a13915bb425032a0e57dfa955ba5579eab28c940c`. These are build predictions, not on-chain deployment evidence.

## Fixed issuance configuration verified against source and exact-head preview

- Initial supply: **2,100,000,000 VCOIN**, 6 decimals, represented by **2,100,000,000,000,000 base units**.
- Founder: 420,000,000 VCOIN; Mining Reserve: 1,050,000,000; Treasury: 210,000,000; Liquidity/Market: 210,000,000; Ecosystem/Marketing: 210,000,000.
- The five constructor owner addresses in the preview match the approved five-wallet register. Founder is also the single GAS & OPERATIONS signer. Each allocation requires a separate Founder signature.
- The generated Jetton wallet addresses are deterministic predictions only and must be checked with the deployed Master's `get_wallet_address` getter before credit verification.
- No Mainnet deployment, issuance, or transfer is evidenced by this build artifact or workflow run.

## Important source/documentation reconciliation

- At this exact source commit, `contracts/jetton/src/vcoin.tact` **does include** a Founder-only `VCoinWithdraw` method. It sends only to the fixed `owner`, and enforces a 0.25 TON minimum reserve plus a 0.10 TON fee buffer.
- `contracts/jetton/tests/jetton-sandbox.spec.ts` includes tests for Founder-only withdrawal, unauthorized withdrawal rejection, reserve-protection rejection, and insufficient request value. Therefore, older statements below saying the current Master has no withdrawal method are stale and must not be treated as current source facts.
- **Remaining reserve proof:** the deployment preview currently attaches 0.75 TON. Each of the five allocation calls causes the Master to send 0.10 TON to create/credit the corresponding Jetton wallet, in addition to execution fees. The committed tests cover each allocation and separately cover withdrawals against a freshly funded Master, but do not establish that at least 0.35 TON remains after all five real allocation credits and fees. A fee/reserve simulation and an explicit post-five-allocation reserve assertion are required before Mainnet.
- The Issuer's allocation sequence checkboxes are manual operator acknowledgements, not automatic blockchain verification. The operator must inspect each confirmed Mainnet transaction, Jetton Wallet balance, Master allocation status, and total supply before unlocking the next allocation.

## Remaining Mainnet gates

1. Enable and successfully publish the GitHub Pages Issuer, or approve and independently validate an alternative signing workflow.
2. Add and pass a Sandbox test proving the Master retains the required 0.35 TON protected reserve after all five allocations, using realistic fees; adjust the initial reserve funding/payload if required and regenerate the exact-head release package.
3. Complete an independent qualified smart-contract and TEP-74/TEP-64 audit; resolve all critical/high findings.
4. Independently reproduce current Master code, wallet code, metadata cell, StateInit and derived address hashes from a clean environment.
5. Complete exact payload, signer, address, and network-fee review.
6. Obtain the Founder's explicit approval and personal wallet signature for deployment and for each irreversible allocation transaction.

**Owner execution policy:** Mainnet only; no Testnet deployment or Testnet transaction is authorized. Local compilation, Sandbox simulation, offline payload inspection, and independent review remain permitted. Never treat a predicted address, uploaded artifact, wallet request, or issuer checkbox as proof of an on-chain transaction.

---

# CURRENT OWNER EXECUTION DECISION — 2026-11-22 (supersedes conflicting historical gates below)

- The owner requires **real TON Mainnet execution only**. No Testnet deployment, Testnet transaction, or Testnet allocation rehearsal is authorized or required.
- Permitted pre-deployment validation: local compilation, automated tests, local Sandbox simulation, offline payload inspection, independent third-party audit, and clean-room reproducible build/hash verification. These activities must not broadcast network transactions.
- **Mainnet release remains NO-GO.** This decision does not waive security or release controls. Before any Mainnet signature: resolve and document the Master TON reserve withdrawal limitation; complete an independent qualified audit and resolve critical/high findings; reproduce the exact current BOC/StateInit/metadata/address hashes independently; validate all five allocation addresses and Founder signer; complete fee/payload simulation; confirm the issuer/signing workflow or an approved alternative; and obtain the Founder's explicit approval for each irreversible transaction.
- The current Master has no TON withdrawal method. Do not fund it or deploy on the assumption that unused TON can later be recovered. Any redesign requires explicit architecture approval followed by complete rebuild, tests, and audit.
- No Mainnet deployment, issuance, or transfer is claimed by this status update.

---

# CURRENT AUTHORITATIVE RELEASE STATUS — 2026-11-22 (Action #44)

> This section supersedes any older conflicting deployment, signer, wallet-role, CI, or preview statements later in this historical log. Read this section first.

- Current main HEAD reviewed: `d542c7281e317aca040a3b83bb8f249af6cb0e26`.
- Founder and GAS & OPERATIONS are the **same single wallet**. The Founder address is the sole contract owner, sole VCOIN issuance signer, and GAS reserve funder. There is no separate GAS signer and no sixth VCOIN recipient. The constructor and deployment generator enforce `gasOperatorWallet == owner`; the TonConnect issuer requires the Founder wallet for deployment and all five allocations.
- The five and only five VCOIN allocation destinations remain Founder 420M, Mining Reserve 1.05B, Treasury 210M, Liquidity/Market 210M, and Ecosystem/Marketing 210M; total 2.1B VCOIN, six decimals. Do not use any historical six-wallet or superseded allocation statements below.
- Exact-head GitHub Actions run #179 (run ID `44999283338`) on this HEAD: `build-and-test` succeeded, including clean lockfile install, strict npm audit, Tact compile, immutable TEP-64 cell generation, unsigned Mainnet preview generation, Jest tests, issuer syntax/sequence guard checks, and artifact uploads. The `deploy-issuer` job failed only at `Configure GitHub Pages` because the connected GitHub App lacks repository administration permission; site deployment was skipped. This does not mean the contract build/test job failed.
- The previous successful exact-head run #173 also validated the constructor hardening and sequential issuer controls. No Mainnet transaction has been signed, broadcast, or confirmed.
- **Release disposition remains NO-GO for Mainnet.** Still required: owner enables GitHub Pages Source = GitHub Actions; real TON Testnet deployment and complete five-allocation rehearsal; independent third-party smart-contract/TEP-74/TEP-64 audit; final fee and reserve simulation; and review of the exact current unsigned deployment package and constructor addresses before any signature.
- The Master has no TON withdrawal method. Any unused TON reserve sent to the Master is not recoverable through the current contract. This is a material, irreversible design limitation; do not add a withdrawal function without the owner's explicit architecture approval.
- The issuer page is a transaction-request interface, not a blockchain verifier. Its checkboxes are manual operator acknowledgements; each transaction and recipient balance must be independently verified using TON Mainnet explorers/getters before the next allocation.
- Historical predicted addresses and hashes in older action entries are not authoritative for the current source unless regenerated from the current exact-head artifact and independently reproduced. Treat every predicted address as unconfirmed until the deployed Master getters agree.

## Action #44 — Reconcile release status with Founder/GAS unified signer and latest exact-head CI

**Status:** Documentation correction committed; Mainnet remains NO-GO.

- Corrected the top-level release status to make the current Founder = GAS & OPERATIONS rule authoritative and to supersede stale historical references to a separate GAS signer.
- Recorded exact-head run #179 and separated the successful build/test job from the GitHub Pages permission failure.
- Reaffirmed the five allocation wallets and current 2.1B fixed supply; explicitly prohibited treating historical six-wallet or superseded allocation plans as current.
- Reaffirmed the unrecoverable Master TON reserve limitation, the need for independent third-party audit, Testnet rehearsal, fee simulation, and independent on-chain verification.
- No contract code, deployment payload, wallet address, allocation, or transaction was changed by this documentation-only action.

---

# V COIN TON Jetton verification status

**Reviewed branch:** `main`  
**Scope:** Source and committed-test inspection; no deployment or transaction activity.  
**Release disposition:** **NO-GO for Mainnet** until exact-head CI, independent review, wallet-control proofs, and reproducible artifact/hash gates are complete.

## Implementation present on main

- Tact VCoinMaster fixes the five allocation destinations in StateInit and rejects duplicate allocation addresses and any overlap with the separate GAS & OPERATIONS wallet.
- The Founder wallet is the sole VCoinMint authority.
- Current 2.1B contract cap accepts only the exact amount assigned to each configured destination: Founder 420M, Mining Reserve 1.05B, Treasury 210M, Liquidity/Market 210M, Ecosystem/Marketing 210M VCOIN.
- Each allocation has a one-time issued flag. The Master disables further issuance only after all five allocation roles have completed.
- A bounced wallet-credit message is checked against the deterministic Jetton wallet for that role and its exact allocation amount; only that role is reset for retry.
- GAS & OPERATIONS can fund the Master reserve through VCoinFund but cannot issue VCOIN.
- The founder allocation is one immediate 420,000,000 VCOIN allocation; no vesting or time lock applies.

## Committed Sandbox coverage

The current `contracts/jetton/tests/jetton-sandbox.spec.ts` includes tests for:
- Unauthorized issuance, repeat issuance, wrong amounts, unregistered destinations, and underfunded requests.
- Exact five-wallet allocation amounts, configured addresses, final total supply, and permanent mintable=false state.
- Separate GAS & OPERATIONS funding authority.
- Natural wallet-credit bounce rollback for each of the five allocation roles.
- Retry of the exact role after its failed wallet credit is corrected.

These are committed test cases, not by themselves proof that CI passed on the latest main commit. Exact-head GitHub Actions results must be checked and recorded before this status can be upgraded to tested.

## Latest exact-head CI evidence — 2026-11-22

- Exact CI commit: 618e397a8a6f97ce76a45043af78acbedbd5ea72; [GitHub Actions run #111](https://github.com/vahidnemati3544-opsking/v-coin-TON/actions/runs/44990981787) completed successfully.
- Successful steps: generated lockfile, clean npm ci, dependency audit with moderate-or-higher enforcement, Tact compilation, immutable TEP-64 content-cell generation, unsigned Mainnet deployment preview generation, Jest Sandbox tests, lockfile persistence, and artifact upload.
- Audit report: zero vulnerabilities at every level (0 info, 0 low, 0 moderate, 0 high, 0 critical).
- The earlier tsx 4.19.2 dependency introduced two moderate esbuild advisories. It was upgraded to tsx 4.23.15; the regenerated package-lock was committed to main in commit 647256b8ce9504fbda6e5d34a0b014a57c17c391. The authoritative workflow now fails on moderate, high, or critical advisories.
- Exact-head artifact ID 14741572462; name vcoin-jetton-release-618e397a8a6f97ce76a45043af78acbedbd5ea72; archive SHA-256 b8471e11036f15bbef081c166fe0eabc91eeaf96890fd97fc5800f5f03fbc723.
- Master code BOC SHA-256: 149044c6850f4a8116c0673a02a72247660831ad4fbf87fd486958a3eddfcaf1.
- Jetton Wallet code BOC SHA-256: 8373d9e5318314563ea6d140e1bbb3aa18240cf8f261bdeb5b94d73c903778a0.
- Master StateInit BOC SHA-256: 99b7c3fabe239aa7ba9eed123e97d133ec63058469a9a6a819e79b7c27634da1.
- TEP-64 content BOC SHA-256: 459b380b7ef4215f4bfcf100a5b132703eba535012f0690b12a365fe72e9d438.
- Updated package-lock SHA-256: b778e6db4730225c9104b3cd5140418e06de8edbe50d573efc8be0e3035da653.
- Mainnet deployment preview JSON SHA-256: 19586eff2a1594fa0ed8532405015abf00feba58e46bc5c6c4381a964149fd1e.
- Predicted Master address: EQCvOZBRDK51sk2k1qSWksk6jnhXT11MHquhD06FFLOKrh77; StateInit hash af3990510cae75b24da4d6a49692c93a8e78574f5d4c1eaba10f4e8514b38aae.
- Deployment request uses the separate GAS & OPERATIONS wallet as signer, VCoinFund as the first message body, and 0.75 TON minimum attached value; the live network/wallet fee estimate remains additional.
- Founder wallet remains the signer for the five subsequent exact VCoinMint allocations after deployment and on-chain getter checks.
- Mainnet deployment, minting, and wallet credits have not been broadcast. The above are unsigned deterministic previews only.
## Remaining Mainnet release gates

- Lockfile-backed clean install, dependency audit, Tact build, metadata-cell generation, Sandbox tests, and artifact retention: passed on commit 9d3364b767aecdf0df038b9bf600435f6662c225; lockfile committed.
- Independent smart-contract and TEP-74/TEP-64 review: pending.
- Independent clean-room build and TON cell-hash / StateInit hash reproduction: pending. The SHA-256 values above are file checksums only and must not be represented as TON cell hashes.
- Confirm all five allocation destination addresses and separate gas wallet against the final deployment constructor inputs; verify wallet control for the intended Mainnet network: pending.
- TEP-64 metadata JSON, immutable commit-pinned URI, and generated content cell: completed without embedding the unverified logo. Canonical logo format verification and any separately approved conversion remain pending.
- Mainnet deployment, issuance, and transfers: not performed; explicit per-transaction Founder approval remains required.

## Additional concrete blockers confirmed on current main

- TEP-64 metadata JSON and the metadata content-cell generator are now present; the CI artifact contains the generated BOC. The canonical logo remains excluded pending format verification.
- The canonical logo is stored as `vcoin-canonical-logo.png`, but its recorded Base64 signature begins with JPEG bytes (`FF D8 FF`). Its actual format and full integrity have not been independently verified. Do not publish it as PNG or build metadata around an unverified asset.
- The authoritative workflow now uses `npm ci`, runs the audit and tests, and retains the BOC and metadata-cell artifacts.
- No deployed Master address, deterministic Jetton wallet addresses, TON cell hashes, StateInit hashes, or on-chain balances exist in the repository evidence.

## Safety boundary

Local TON Sandbox testing is required, followed by a real TON Testnet deployment and full issuance rehearsal before Mainnet. No Mainnet transaction may be signed or broadcast until the exact build, destinations, amounts, fees, network, successful Testnet rehearsal, and independent review have been presented for explicit Founder approval.

Never request or store seed phrases, private keys, wallet PINs, or recovery codes.

## Founder-confirmed issuance scope — 2026-11-22

The project owner explicitly confirmed that the full fixed supply of 2,100,000,000 VCOIN is to be issued and allocated directly across all five registered Mainnet allocation wallets: Founder 420,000,000; Mining Reserve 1,050,000,000; Treasury 210,000,000; Liquidity/Market 210,000,000; Ecosystem/Marketing 210,000,000. The Founder wallet is one of these five allocation wallets, not an additional destination. The separate GAS & OPERATIONS wallet is not an allocation wallet. Do not ask the owner to choose between partial Founder-only issuance and five-wallet allocation again.

This is confirmation of the intended allocation plan, not a signature authorization. Deployment, issuance, and each Mainnet transaction remain blocked until technical release gates pass and exact transaction details are presented for the Founder's informed approval and wallet signature.

## Action #31 — CI reproducibility, artifact retention, and recipient-control clarification

**Status:** Workflow changes committed; verification evidence available; lockfile persistence is configured for the next successful run.

- Authoritative verification workflow now generates a dependency lockfile, performs a clean `npm ci`, records the audit JSON, enforces no high/critical advisories, builds the Tact contracts, runs the Sandbox Jest suite, and retains exact-head artifacts for 30 days.
- The duplicate push-triggered workflow was changed to manual-only verification to avoid running two competing pipelines for every commit.
- The authoritative workflow now has a final successful-run step to commit `contracts/jetton/package-lock.json` to `main` if it is missing or changes. This requires the GitHub Actions token to have contents write permission.
- Exact-head evidence from run #86 on commit `4a76473a662bec7efe583511917090cb2ea68eee`: clean lockfile install, audit, build, and tests all succeeded; audit reported 0 info, 0 low, 0 moderate, 0 high, and 0 critical vulnerabilities. Artifact: `vcoin-jetton-release-4a76473a.zip`.
- Artifact SHA-256: `2bba0c8371b62c510cbd1933aa38a95161d86fb82cf3e22bebac51fd8ea88823`.
- Master code BOC file SHA-256: `149044c6850f4a8116c0673a02a72247660831ad4fbf87fd486958a3eddfcaf1`.
- Jetton Wallet code BOC file SHA-256: `8373d9e5318314563ea6d140e1bbb3aa18240cf8f261bdeb5b94d73c903778a0`.
- Lockfile SHA-256: `e386d60a3a83b1d3fc033264cc422c7bc3f5d1f4507ee373d1d939c82953d4ba`.
- These are file SHA-256 checksums, not TON cell hashes. The BOCs were generated by CI; clean-room cell-hash and StateInit hash reproduction remains pending.
- The deployment runbook now states explicitly that the Master has no recipient clawback, freeze, confiscation, or post-transfer seizure method. Standard holder-controlled Jetton transfers remain available; no Founder or project-admin method can retrieve a completed recipient balance.
- Mainnet deployment and issuance remain not performed. Metadata/content cell, independent review, reproducible TON cell hashes, deployment constructor review, and wallet-address derivation remain release blockers.

## Action #32 — TEP-64 metadata package and content cell

**Status:** Metadata JSON committed; content-cell generator committed; exact-head CI passed.

- Added contracts/jetton/metadata.json with name V COIN, symbol VCOIN, description, and six decimals.
- Added contracts/jetton/scripts/build-metadata-cell.cjs; it creates the TEP-64 off-chain content cell with prefix 0x01, immutable metadata URI, BOC, and cell hash.
- CI generated the content cell from the commit-pinned URI and retained it in artifact 14741308282.
- Generated metadata content-cell hash: 6dc0e0c3a9ec89e72fc8402a13915bb425032a0e57dfa955ba5579eab28c940c.
- Canonical logo intentionally omitted until the locked source asset's actual JPEG format is verified and any new converted asset is separately approved.
- Next action: derive the complete VCoinMaster StateInit from the exact constructor values and metadata content cell, independently reproduce its hash/address, then prepare a Tonkeeper-compatible deploy transaction for Founder review and signature.
## Action #33 — Mainnet deployment StateInit and five Jetton wallet derivation

**Status:** Unsigned Mainnet deployment package generated; StateInit and all five deterministic wallet addresses independently hash-checked; no transaction broadcast.

- Exact preview build commit: 9d198dc169d53f6307f042db395cf5dfdbb6c1b6; [CI run #105](https://github.com/vahidnemati3544-opsking/v-coin-TON/actions/runs/44990829838) passed.
- Artifact ID: 14741568516; artifact SHA-256: b464d40dc1cf0b29b95011c0f1409c8083cf22aa7aab994377475f3e11457fdb.
- Predicted Mainnet VCoinMaster address: EQCvOZBRDK51sk2k1qSWksk6jnhXT11MHquhD06FFLOKrh77.
- Master StateInit hash: af3990510cae75b24da4d6a49692c93a8e78574f5d4c1eaba10f4e8514b38aae. It was independently reproduced from the serialized StateInit BOC using a separate cell-hash parser; the hash embedded in the friendly Master address matches exactly.
- Master code cell hash: 0e1a3581d5ee1a37f8ac12f39e8d6be1a8277ad2d612ad3f35bce78da474f03a.
- Metadata content cell hash: 6dc0e0c3a9ec89e72fc8402a13915bb425032a0e57dfa955ba5579eab28c940c.
- Founder Jetton Wallet: EQBElyTbIfy5Z0Aur87D_UVl4F4Qg1_ZUr5D0AGbf2osCZvo; StateInit hash 449724db21fcb967402eafcec3fd4565e05e10835fd952be43d0019b7f6a2c09.
- Mining Reserve Jetton Wallet: EQANO_4VthNKI4WjeXbxV4ZvGZyBGrMURY0zVnfQknXhzbIM; StateInit hash 0d3bfe15b6134a2385a37976f157866f199c811ab314458d335677d09275e1cd.
- Treasury Jetton Wallet: EQCuFM3AkJGmeNUy2rllpNum4ojmGzNuT6PVhtJ_c4SicJIY; StateInit hash ae14cdc09091a678d532dab965a4dba6e288e61b336e4fa3d586d27f7384a270.
- Liquidity / Market Jetton Wallet: EQBQgo1HRRnKFZEhLvSW12nt3omq8H6icxtGhn30tOlENX6Z; StateInit hash 50828d474519ca1591212ef496d769edde89aaf07ea2731b46867df4b4e94435.
- Ecosystem / Marketing Jetton Wallet: EQCRa4bOU5yZaYaEqFhb5qa-pcbIyegjg6AEwGTVQVOECMQ4; StateInit hash 916b86ce539c99698684a8585be6a6bea5c6c8c9e82383a004c064d541538408.
- A separate parser independently recomputed all five Jetton Wallet StateInit hashes from their BOCs; each matched both the generated hash and the address hash bytes.
- Deployment transaction design: GAS & OPERATIONS wallet sends the first message to the predicted Master with StateInit, VCoinFund body, and 0.75 TON minimum attached value. This deploys the contract and funds its reserve in one transaction. Network/wallet fee quote is additional and still required.
- Historical superseded allocation plan (superseded by Action #36): do not use those old amounts. The current 2.1B requests are 420M, 1.05B, 210M, 210M, 210M VCOIN.
- No Mainnet transaction has been signed or broadcast. The Master address and Jetton Wallet addresses remain predicted until on-chain deployment and getter checks.
- Independent third-party smart-contract security audit and live Mainnet fee simulation remain outstanding; do not describe this as an audited or deployed token.
## Action #34 — Dependency advisory remediation and strict audit gate

**Status:** Completed and verified by exact-head CI.

- The first deployment-preview CI identified two moderate advisories through tsx 4.19.2 -> esbuild.
- Upgraded tsx to 4.23.15 and regenerated/committed package-lock.json.
- Changed the authoritative npm audit gate to fail at moderate severity, not only high severity.
- Exact-head run #111 passed; the audit report contains zero advisories at every severity.
- The release package remains unsigned; no Mainnet transaction was broadcast.
## Action #35 — TonConnect signing console and Pages publication

**Status:** TonConnect console, manifest, signer guards, and generated Mainnet preview are committed; site artifact builds; GitHub Pages publication awaits one repository-owner setting.

- Added issuer/index.html using pinned @tonconnect/ui 5.0.3, Mainnet-only network selection, and exact raw-address guards for the GAS & OPERATIONS signer and Founder issuance signer.
- The deployment button sends one StateInit + VCoinFund message to the predicted Master with 0.75 TON attached. Five separate mint buttons submit the exact VCoinMint payloads from the deployment preview, each with 0.01 TON attached.
- The console never stores keys or requests recovery material. It requires the Founder to manually confirm that the Master is active and its getters match before enabling issuance buttons. It does not claim finality; each transaction must be checked on-chain before proceeding.
- The CI run #118 build-and-test job passed and produced the GitHub Pages site artifact ID 14741409791 (artifact digest df0d5e43a1c84e143213d75ce2ff2ee2dd8612239d634ee6ac023ae915ad5625). The release build/audit artifact ID is 14742370638.
- GitHub Pages publication was blocked because the connected GitHub App lacks repository administration permission to create the Pages site; configure-pages returned 'Resource not accessible by integration' even with enablement=true.
- One-time Founder action required: open https://github.com/vahidnemati3544-opsking/v-coin-TON/settings/pages and set Build and deployment -> Source to GitHub Actions. The next push to issuer/** or the verification workflow will publish the site at https://vahidnemati3544-opsking.github.io/v-coin-TON/.
- No Mainnet deployment, mint, or token transfer has been broadcast. The predicted Master address and five Jetton Wallet addresses remain unsigned previews until Mainnet confirmation.


## Action #36 — Owner-approved supply and reference-price revision

**Correction to earlier historical entries:** Older allocation, address, and hash records above are superseded. Current source and a fresh exact-head CI artifact are the sole 2.1B candidate release.

**Status:** Source, allocation templates, economic documents, mining reserve migration and new unsigned Mainnet preview updated; build and Jest tests passed in exact-head CI. Independent review/hash reproduction and Mainnet authorization remain pending.

- Owner-approved fixed supply: 2,100,000,000 VCOIN, six decimals, 2,100,000,000,000,000 base units.
- Shares remain 20/50/10/10/10: Founder 420,000,000; Mining Reserve 1,050,000,000; Treasury 210,000,000; Liquidity/Market 210,000,000; Ecosystem/Marketing 210,000,000 VCOIN.
- Modelled USD reference price reset to 0.008 per VCOIN. It is not a market quote, guarantee, or promise of appreciation.
- Previous Master and Jetton Wallet predictions are invalidated and must be regenerated from the revised contract StateInit.
- A forward-only PostgreSQL migration lowers the mining reserve cap only if pending plus distributed rewards fit the new 1.05B reserve; otherwise it aborts for reconciliation.
- The same migration resets the active modelled reference price to 0.008 while retaining historical candles.
- The tracked old issuer preview is marked superseded and cannot be used for signing. CI must pass before a fresh preview replaces it.
- No Mainnet deployment, minting, or transfer is authorized or broadcast by this revision.


### Regenerated unsigned preview evidence

- CI run #137 on source commit c45b3ed7ea3f73993d3ab31e8dbedf850cb89278 completed the npm audit gate, Tact compilation, TEP-64 cell generation, Mainnet preview generation, Jest tests, and artifact upload successfully. The GitHub Pages deploy job remains blocked by missing repository administration permission.
- Predicted Master: EQAriHkG8kqO0GQwwX6ODgqpJCV-oUDKwalDK8lAzYGBWHvV (unsigned; derived by current CI).
- Master StateInit hash: 2b887906f24a8ed06430c17e8e0e0aa924257ea140cac1a9432bc940cd818158.
- Master code cell hash: 3f90f875f2f62e8c80414b34b87bfbe421754bc622f72d8cddebb6537d2232ea.
- Predicted Jetton Wallets: Founder EQB8AerdUs4kIiwgXYNXn97vInNGz1i6mM82aRz6Qk-yLXT8; Mining EQDSRCdDD6aozmwM7RIHyt9D-RyayizOMu5xENy0SPXwnWqd; Treasury EQDVyMsB_lGSxbI9-GSfr_Np3NohePKdYpaBEUitvAYFGsy-; Liquidity EQAnRjBQl3D9c0s5GV0t8RlTMReOFQRNNXoc3oyVVgjzl5MH; Ecosystem EQCtNm8cneWOwU_JFfK_rf9Os7_Y8yItALCtI0ZYvoHQX8xs.
- Preview amounts are confirmed as 420,000,000 / 1,050,000,000 / 210,000,000 / 210,000,000 / 210,000,000 VCOIN, totaling exactly 2,100,000,000. The corresponding base-unit values are generated from the canonical deployment config and validated against its total supply.
- These are predicted addresses and unsigned payloads only. Independent clean-room hash reproduction of this revised build, live fee simulation, successful Testnet rehearsal, deployed-Master getter checks, and owner signatures remain outstanding.


## Action #37 — 2.1B release reconciliation and database migration repair

**Status:** Source/document corrections committed; exact 2.1B Jetton build remains passing; PostgreSQL migration and integration tests passed on commit `691399c11d8a12734869b31c917bc07fa208a280`. A docs-only clarification commit followed.

- Corrected the 210,000,000 VCOIN base-unit typo in the official wallet register to 210,000,000,000,000.
- Corrected current allocation summaries that still listed the old 1B Treasury/Liquidity/Ecosystem amounts.
- Corrected the deployment runbook base-unit total to 2,100,000,000,000,000 and removed the old 2B/5B/1B/1B/1B issuance instructions from current release guidance.
- Added migration 004 and 005 to the local database setup runner. Migration 005 lowers the mining reserve to 1,050,000,000 VCOIN only if existing pending plus distributed rewards fit the new cap, and resets the modelled USD reference baseline to 0.008.
- Updated PostgreSQL integration setup to apply migrations 001–005 in order, serialize migration execution, and assert the 1.05B reserve and 0.008 price baseline.
- Backend CI run #260 and Mining CI run #262 passed on commit `691399c11d8a12734869b31c917bc07fa208a280`; PostgreSQL tests report 24 passed and 0 failed.
- Jetton CI run #141 passed Tact compilation, npm audit (0 advisories), Mainnet preview generation, and Jest Sandbox tests on the 2.1B source. Its only failed job was GitHub Pages creation because the GitHub App lacks repository administration permission.
- The latest 2.1B Master preview remains `EQAriHkG8kqO0GQwwX6ODgqpJCV-oUDKwalDK8lAzYGBWHvV`, StateInit hash `2b887906f24a8ed06430c17e8e0e0aa924257ea140cac1a9432bc940cd818158`. This is unsigned and not deployed.
- No Mainnet deployment, mint, or wallet credit has occurred. Testnet rehearsal, independent third-party security audit, and clean-room hash reproduction for the revised build remain outstanding.


## Action #38 — Restore the approved 50% annual compound reference policy

**Status:** Backend and PostgreSQL mining CI passed; policy recorded in tokenomics, backend documentation, and deployment runbook.

- Retrieved the latest owner-approved price policy: 0.008 USD starting reference with a 50% annual compound target, gradually applied. The earlier 0.2041% per 72-hour implementation did not match that approved target and has been corrected.
- The 72-hour cadence now uses fixed-point multiplier `1.003338149181`, equivalent to approximately 0.3338149181% per 72-hour period and approximately 1.5x over 365 days.
- Added forward-only migration `006-annual-compound-price-policy.sql`; setup runner and PostgreSQL integration tests apply it after migrations 004 and 005.
- Unit tests verify the first 72-hour step from USD 0.008 is USD 0.008026705193. PostgreSQL integration tests verify the active database rate is 0.33381492 percent.
- Backend CI run #267 and Mining CI run #269 passed on commit `1ec62162246080a6357c5cda8a637a05349a8f40`; the preceding exact-policy test runs #266 and #268 also passed.
- This price schedule is an off-chain modelled reference only; it does not set an exchange price, guarantee value, or change the fixed 2.1B on-chain supply or five-wallet allocations.
- No Mainnet transaction has been signed or broadcast.


### Latest release pipeline note — 2026-11-22

- Exact-head build-and-test job in Jetton CI run #146 passed, including npm audit (zero advisories), Tact compile, TEP-64 content generation, Mainnet preview generation, and Jest Sandbox tests. The separate Pages job failed only at Configure GitHub Pages due repository administration permission.
- A concurrent run #147 reached the generated-lockfile commit step while run #146 was committing the same lockfile and failed that commit step. The authoritative lockfile is now committed on main at commit `1795fb4ccdba6cbbffa09ec032af15ba7e7103f6`; this was a workflow race, not a contract compile or test failure. A fresh exact-head CI run is required to re-confirm the now-committed main head.

## Action #40 — Founder / GAS & OPERATIONS role unification (2026-11-22)

**Status:** Implemented and committed. The shared-signer logic passed the exact-head build and Sandbox suite; the later constructor-hardening and issuer sequencing refinements are recorded in Action #42. This is not a deployment or Mainnet authorization.

- Founder and GAS & OPERATIONS use the same owner-approved Mainnet address: `UQAdW09EvIesUXt9jzLq1T32O0351TaczwWJQLGGmw4aWrzy`.
- Old inaccessible GAS address is retired; never fund or use it.
- Five allocation recipients and amounts are unchanged. GAS & OPERATIONS is a role, not a sixth VCOIN recipient.
- Exact-head run #161 build-and-test passed on commit `5e27d36d6a92f0140d249baab7b08ae275539fbe`; all 16 Jest tests passed, Tact compile passed, npm audit reported zero vulnerabilities, and Mainnet preview was generated.
- The generated Mainnet preview is artifact `14744513956` (SHA-256 `35a2331b99a73ddb40b511b26b4a436ff6566181d63194c0c8e825df7c31da53`).
- Mainnet deployment, minting, and token credits remain unperformed.

## Action #41 — First regeneration and independent hash reproduction (superseded by Action #42)

**Status:** CI generation and independent local hash reproduction passed; addresses remain unsigned predictions until deployed-Master getters confirm them.

- Exact-head source commit: `5e27d36d6a92f0140d249baab7b08ae275539fbe`; GitHub Actions run #161 build-and-test succeeded.
- Master address: `EQBDbY_0r9XTVCQjH3aw8bfQtF4eoOV6QdFJEJTBMtw6_pIJ`.
- Master StateInit hash: `436d8ff4afd5d35424231f76b0f1b7d0b45e1ea0e57a41d1491094c132dc3afe`; Master code cell hash: `e14ced14f81b69dae82e893c5ec1874b77b870d2ebfce31d5c5b8320566ecbf5`.
- Jetton Wallet code cell hash: `94121c0e077e93e7405c7f3cfe0567cb094e1c42bb4d87d0a6cdb3860ea750f1`.
- Founder Jetton Wallet: `EQBPEJoPfi8Fo6qGxLreAJ33Wp35q7QhMytb0ddZ2T9INTaa`; hash `4f109a0f7e2f05a3aa86c4bade009df75a9df9abb421332b5bd1d759d93f4835`.
- Mining Reserve Jetton Wallet: `EQAueLQWL3It9CUgzjqJcbkqqGUW6_ci72uSpdm5Fd_wJhc8`; hash `2e78b4162f722df42520ce3a8971b92aa86516ebf722ef6b92a5d9b915dff026`.
- Treasury Jetton Wallet: `EQCHEiMqe6U_SbiIsK-QURoNAIlyPNkDGTdV69QiyG3MsD6X`; hash `8712232a7ba53f49b888b0af90511a0d0089723cd903193755ebd422c86dccb0`.
- Liquidity / Market Jetton Wallet: `EQCD8fnJoad9jE543l5o9KH71TGkinQEk4MgmrECavxRu_6N`; hash `83f1f9c9a1a77d8c4e78de5e68f4a1fbd531a48a74049383209ab1026afc51bb`.
- Ecosystem / Marketing Jetton Wallet: `EQCDG9Bz_yAP0qZ34lH_vHhj_2eLbCVHPu-dHnG5BtBC7nPR`; hash `831bd073ff200fd2a677e251ffbc7863ff678b6c25473eef9d1e71b906d042ee`.
- An independent Python BOC parser recalculated the Master StateInit hash, Master code cell hash, Jetton Wallet code cell hash, and all five Jetton Wallet StateInit hashes; all matched the CI artifact. The hash bytes embedded in all six friendly addresses and all six CRC16-XMODEM checksums also verified.
- This is deterministic build/hash verification, not a security certification or on-chain verification. Testnet rehearsal, live fee simulation, Mainnet deployment, and five allocation mints remain pending.

## Action #42 — Enforce Founder-only GAS role, sequential issuance, and regenerate addresses

**Status:** Contract, tests, issuer console, and CI controls committed. Exact-head run #173 build-and-test succeeded; independent BOC/address reproduction passed. No deployment or token issuance occurred.

- Contract constructor now requires `gasOperatorWallet == owner`; a deployment that assigns a separate GAS wallet is rejected.
- Added a Sandbox test that attempts the deployment path with a separate GAS wallet and expects constructor rejection. Existing tests cover Founder-only minting, exact allocations, cap, duplicate issuance, five-wallet distribution, and bounce/retry behavior.
- TonConnect issuer recognizes the shared Founder signer for both deployment and minting, locks the deploy button after a wallet request, and exposes only one allocation request at a time. The next allocation unlocks only after the user manually confirms the previous on-chain balance and allocation status.
- CI run #173 on commit `08fe61fd46fcf83b730512be80e2276acad3e139`: Tact compile, strict npm audit, Mainnet preview generation, Jest tests, and issuer syntax/safety guard validation succeeded. GitHub Pages deployment remains blocked by repository administration permission.
- New unsigned Master preview: `EQBmjwr-Bc2_wNKcZHjTr8KtPGQgN-ltRhTIXqK0zM89O0Xt`; StateInit hash `668f0afe05cdbfc0d29c6478d3afc2ad3c642037e96d4614c85ea2b4cccf3d3b`; Master code hash `383823efc716ed7aab1efe58536aca94f476d6a42d0e6a3041ef56c1f598f846`.
- New predicted Jetton Wallets: Founder `EQAR0RVzOcPf8ILtICUucwNplBPsgq2VrQkpqe418leHvyaI`; Mining `EQARsFwLXMkI6xPnA6KDF38svc8u_TIDJ8t4fcR7HpLwvhE4`; Treasury `EQBVb4YTI5tkWR-AArcz2M7ik6I45tRgjQs8XribDJxQD-7H`; Liquidity `EQAUXhlV8gxHRhHPKksK7bjkhTnb0d_e5JUL1jzE7Na9L8ol`; Ecosystem `EQDZL9l3y0BlXRretbbFSpBMj-GdNQzvg0PKcRwlr6m6JFO1`.
- Independent Python BOC parser reproduced the Master StateInit hash, Master code hash, Jetton Wallet code hash, and all five Jetton Wallet StateInit hashes. The six friendly addresses' embedded hashes and CRC16-XMODEM checksums also passed.
- These remain unsigned predictions. Third-party security audit, Testnet deployment/issuance rehearsal, fee simulation, Mainnet deployment, and the five allocations remain pending.

## Action #43 — Internal static security review

**Status:** Scoped manual review completed; no substitute for independent third-party audit. Mainnet remains NO-GO.

- Reviewed `contracts/jetton/src/vcoin.tact`, `contracts/jetton/src/jetton.tact`, `contracts/jetton/src/messages.tact`, Sandbox release tests, deployment generator, and TonConnect issuer controls.
- Authorization: constructor requires `gasOperatorWallet == owner`; only Founder/owner can issue VCOIN or fund the Master; a different GAS wallet is rejected.
- Allocation: five distinct fixed destinations; exact role amounts; total cap 2,100,000,000 VCOIN at six decimals; one-time role flags; minting is disabled after all five credits succeed.
- Bounce handling: Master accepts allocation rollback only from the deterministic Jetton Wallet for that role and checks the exact amount before restoring the role's retry state.
- Holder controls: Jetton transfers and burns require the holder's owner address; inbound wallet transfers validate the deterministic source wallet; bounced transfer/burn messages restore the prior balance.
- Administrative surface: no Master method to freeze, claw back, confiscate, or seize holder Jetton balances; metadata is fixed in StateInit with an immutable commit-pinned URI.
- Issuer: Mainnet-only network guard, exact Founder raw-address signer guard, one-at-a-time allocation sequencing, manual on-chain confirmation gate, deploy-request lock, and no private-key/seed collection. CI syntax and guard checks passed in run #173.
- Verification evidence: run #173 passed 17/17 Jest tests, Tact compilation, strict npm audit (zero vulnerabilities), unsigned Mainnet preview generation, and issuer syntax/safety checks.
- Residual blockers: independent qualified security audit; live TON Testnet deployment and five-wallet issuance rehearsal; live fee/reserve simulation; deployed-Master getter verification; GitHub Pages owner setting. No Mainnet transaction has been signed or broadcast.
- Design note: the Master has no TON withdrawal method. Any unused TON reserve remaining in the Master after deployment/issuance is not recoverable through the current contract. This is a deliberate absence of admin withdrawal authority in the current implementation and must be understood before signing.


## Current status update — Action #54 (2026-11-22)

The earlier logo-pending statements in this historical verification log are superseded by Action #54. The Founder-approved canonical image was already present in the repository; inspection confirmed JPEG bytes under a misleading `.png` suffix. The exact original bytes were preserved, the asset was renamed to `contracts/jetton/assets/vcoin-canonical-logo.jpg`, and TEP-64 metadata now includes its stable GitHub Pages URL. The old misleading `.png` path was removed. CI copies the same canonical JPEG into the Pages root and checks its HTTP availability.

- Final source commit: `c30b3f6386ce8fd9da603d2fecc745d4f5b992ed`.
- Exact-head CI: successful; Tact build, strict dependency audit, 3 Jest suites / 21 tests, issuer checks, and Pages deployment passed.
- Metadata URI: `https://raw.githubusercontent.com/vahidnemati3544-opsking/v-coin-TON/e17bcb9d82ea182bff3358b9fac6b5fa25c166ee/contracts/jetton/metadata.json`.
- Metadata image: `https://vahidnemati3544-opsking.github.io/v-coin-TON/vcoin-canonical-logo.jpg`.
- TEP-64 content-cell hash: `abadcbc42c4e6309bea1d595dbfd1b834a07bfb171b2b1e2cb6d4b7e244330ca`.
- Metadata BOC SHA-256: `005aeddd589838a3b603ccbe58a6e893015e7f5dbaf4c5f43edb3fb2a82ee287`.
- Predicted Master address for this metadata/build: `EQBn4hW8bKhFTSz9riY5q3Pr3SfJmv2VYKZQl_NWMbK--5fP` (prediction only; not deployed).
- Mainnet deployment and allocation transactions remain unsigned and unbroadcast. Independent security audit, clean-room rebuild, final live fee review, and Founder payload approval remain outstanding.
