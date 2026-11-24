# ACTION #91 — Read legacy Master allocation configuration and issuance flags (2026-11-24)

**Status:** Mainnet read-only getters succeeded. The active Master exposes the old five-allocation design, not the new five-stage Founder receipt.

- `get_allocation_config` returned five address cells; the first (Founder/owner) decodes to the legacy admin `EQAdW09EvIesUXt9jzLq1T32O0351TaczwWJQLGGmw4aWuE3`.
- `get_allocation_status` returned five TVM boolean values, all `-1` (true): `founder_issued`, `mining_reserve_issued`, `treasury_issued`, `liquidity_issued`, and `ecosystem_issued`.
- This getter evidence independently confirms that all five old allocation issuance flags are complete. Together with Action #90 wallet balances, the active Master is fully allocated in the older five-wallet pattern.
- The active Master does not expose `get_receipt_status` and its old source has no `change_admin` message/receiver. Its owner is immutable; there is no supported way to switch the Master admin to the current Founder wallet.
- Action #92 extends the report to decode every address returned by `get_allocation_config` and explicitly decode the five boolean flags, so the exact constructor destinations can be compared against the current register.

**Decision:** Do not attempt new issuance, deploy a second Master, or transfer existing allocations until the Founder decides whether to retain the current old Master/distribution or approve a formal migration. Any migration requires control proof for all source wallets and separate Founder signatures.

---

# ACTION #90 — Reconcile all five registered Mainnet Jetton Wallet balances (2026-11-24)

**Status:** Read-only Mainnet wallet derivation and balance queries succeeded; exact-head build-and-test and fresh-runner hash reproduction both passed. No transaction was created, signed, or broadcast.

## Active Master distribution observed

Master: `EQBn4hW8bKhFTSz9riY5q3Pr3SfJmv2VYKZQl_NWMbK--5fP`  
Supply: **2,100,000,000 VCOIN**; `mintable=false`.

| Registered owner role | Master-derived Jetton Wallet | Account state | Observed VCOIN |
|---|---|---|---:|
| Founder (current registered address UQBh…) | `EQAuxau8FXYX_lCIBvxzFg6c8jVjqfqvaRszrcrofh5BVMFv` | uninitialized | 0 |
| Treasury | `EQCXegSjHrFZxC_H2TVVaastC8CxBScqjAbdDZWEEm1GBZ2U` | active | 210,000,000 |
| Liquidity / Market | `EQD5mlEiKvw0KYN8MKLUUfIsjRs1xS_NAb3YEhC_KyigrA59` | active | 210,000,000 |
| Ecosystem / Marketing | `EQA2hJ0zEZilgcBGw_ycCT8_bzgUtoS6sxqohbXDCx2PEM6t` | active | 210,000,000 |
| Mining Reserve | `EQAeVMNyrzMYA5dbHtGmTf37e7ikIbzUGSEoeqY5oIKA3kMa` | active | 1,050,000,000 |

The five currently registered owner addresses therefore account for **1,680,000,000 VCOIN**; the current Founder wallet has zero. Separately, the active Master admin/legacy Founder wallet `EQCOzLnnSrR-mbM_AeiKU2wpMJ28cPoRncBuQHJ-6_q-Mn0T` holds **420,000,000 VCOIN**. Combined, the legacy Founder balance plus the four non-Founder registered allocation balances equal exactly **2,100,000,000 VCOIN**, matching Master total supply.

- Exact-head CI run #45436098986 on commit `2369d75aba103c1efcdbf5ca9cf6e9f76b5d12f0`: `build-and-test` **SUCCESS** and fresh-runner `hash-reproduction` **SUCCESS**; `deploy-issuer` skipped as expected on the review branch. Release artifact ID `14941791938`, SHA-256 `7d63097ac3559906d727d0a5c16d0b22bdfe17c43f4d5e44ebed6a3e6310f588`; full-source artifact ID `14942240545`, SHA-256 `ef17a041e9433e5524ffb07a2ba10b364e67d95e0f3f462d77ee4b83a00917c1`; clean-room report artifact ID `14942086172`, SHA-256 `a8b765c79c67f672d4e48ab3bc2163d0ad42e4b5cb0505852820227f06c245d3`.

## Interpretation and decision

- The active Master already has the old five-wallet allocation pattern: 420M at the legacy admin/Founder address, 1.05B Mining, and 210M each in Treasury, Liquidity/Market and Ecosystem/Marketing.
- This is **not** the requested current Founder-first five-stage receipt. The current Founder Jetton Wallet is uninitialized, has zero balance, and has no transaction history.
- The active Master does not implement `get_receipt_status`; the read-only call returns exit code 11 / method ID 85110. The old contract therefore cannot attest to the new five-stage acknowledgement state.
- Historical source at the matching Action #54 release commit stores `owner` as a constructor-set field and has no `change_admin` message/receiver. The active Master therefore has no supported owner/admin transfer path to the current Founder wallet.
- Do not deploy a second Master and do not move the 1.68B already sitting in the four allocation wallets merely to simulate the newer receipt flow. That would create unnecessary risk and fees.
- Any migration of the 420M legacy Founder balance to the current Founder address, or any broader consolidation/re-distribution, requires a separate explicit Founder-approved migration plan, proof of control of every source wallet, exact fee/payload review, and a fresh signature for each transfer.
- Before deciding whether to keep the current old Master as canonical, the Founder must confirm control of the legacy admin address. The old `UQ...` address is Mainnet non-bounceable, not Testnet; its `EQ...` representation is the same raw account.
- Current Founder GAS wallet remains active with 5.487534819 TON at the observed block. This is an observed balance, not a fixed fee quote.

**Mainnet decision: HOLD / NO-GO for new deployment, issuance or transfers.** The active Master and full supply are confirmed, but current Founder wallet, admin control, code compatibility and receipt sequence do not match the latest approved design. Public mining remains disabled.

---

# ACTION #89 — Live Mainnet Master and Founder wallet reconciliation (2026-11-24)

**Status:** Read-only TON Center Mainnet queries succeeded. Current Founder receipt balance is not present in the active Master-derived Founder Jetton Wallet. Mainnet remains HOLD / NO-GO.

## Confirmed chain observations

- Founder GAS wallet `UQBh9jVKAypc4TrbFx2jsVB2EI1ONChg22zDputisQjENQOT`: active; **5.487534819 TON** at the observed block.
- Previously Tonkeeper-reported Master `EQBn4hW8bKhFTSz9riY5q3Pr3SfJmv2VYKZQl_NWMbK--5fP`: active; 0.540643302 TON; indexed as `jetton_master`; supply **2,100,000,000 VCOIN**; `mintable=false`; metadata URI matches the pinned project metadata.
- Active Master code hash: `5087c882019324e9d8e309c78f42e3bcee9433a54d7d0367d49320a7bbabcc36`. It differs from the current Founder-first exact-build code hash `e08c11238070eeaffbbe783077eb49f61ad770a71f2e3096f83956776ed28ed8`.
- `get_gas_operator_wallet` returns admin `EQAdW09EvIesUXt9jzLq1T32O0351TaczwWJQLGGmw4aWuE3`, not the current Founder wallet.
- `get_receipt_status` is not implemented by the active Master (TON Center exit code 11 / method ID 85110). This old Master cannot prove the current five-stage acknowledgement state through that getter.
- The admin's Master-derived Jetton Wallet is `EQCOzLnnSrR-mbM_AeiKU2wpMJ28cPoRncBuQHJ-6_q-Mn0T`, active, and `get_wallet_data` reports **420,000,000 VCOIN** (`420000000000000` base units).
- The current Founder address's Master-derived Jetton Wallet is `EQAuxau8FXYX_lCIBvxzFg6c8jVjqfqvaRszrcrofh5BVMFv`; account state is `uninitialized`, balance 0, and it has no transaction history. The active Master has not credited the current Founder wallet with the requested five receipts.
- The formerly labeled `UQAdW09EvIesUXt9jzLq1T32O0351TaczwWJQLGGmw4aWrzy` is a non-bounceable Mainnet address, not Testnet. Its corresponding `EQ...` encoding is the active Master admin. Testnet-only prefixes are `kQ...` and `0Q...`; previous Testnet classification was incorrect.
- Current exact-build candidate `EQC_gSnjZTc2Kufgl5ltFF-b2zr5_j4diozxC-IvEp9zzVaL` is `uninitialized` with zero TON. It must not be deployed as a second Master while the active Master exists.

## Actions #89–90 and release decision

- Action #89 adds read-only calls to `get_gas_operator_wallet`, `get_receipt_status`, `get_wallet_address`, and `get_wallet_data`, plus the Founder Jetton Wallet transaction-history check.
- The current Founder wallet transaction history contains zero transactions because its Master-derived Jetton Wallet is uninitialized.
- Action #90 extends the read-only report to all five registered allocation owners (Founder, Treasury, Liquidity/Market, Ecosystem/Marketing, Mining Reserve), deriving each Jetton Wallet from the active Master and comparing balances with the 2.1B Master supply. That reconciliation is required before deciding whether tokens are already held by the four other allocation wallets.
- No new Master deployment, mint, transfer, signing, or broadcast is authorized or advisable until the five registered wallet balances, the legacy admin's wallet control, and the existing supply distribution are reconciled.
- Founder reports that five-stage receipt operations were performed; chain evidence currently shows **no credit to the current Founder Jetton Wallet**. Do not record the five stages as complete.

## Safety

Mainnet network access and the Founder TON fee balance are confirmed. An active VCOIN Master exists, but it is an older contract with a different admin and code, and the current Founder Jetton Wallet is empty/uninitialized. Mainnet remains **HOLD / NO-GO** for new deployment, issuance, and allocation transfers. Public mining remains disabled.

# ACTION #86 — Mainnet release-gate reconciliation (2026-11-24)

**Status:** Documentation reconciled on the PR review branch only. PR #24 remains open/Draft and is not merged to `main`. Mainnet remains HOLD / NO-GO.

- PR #24 exact-head CI #535 and updated PR CI #539 passed `build-and-test` and fresh-runner `hash-reproduction`; the review branch has 20 Sandbox tests across 3 suites and reproducible Master/Wallet/metadata BOCs across two isolated CI runners.
- The review branch adds burn rejection/success and ordinary transfer bounce/refund regression coverage. This is not Mainnet deployment evidence.
- Current project policy follows the already-merged decisions in PRs #18 and #20: a third-party audit is not a current project release condition. Internal source/security review, exact-head CI, dependency audit, Sandbox edge-case coverage, clean-room reproduction, fee/reserve analysis, wallet-control proof, and Founder approval remain required. Historical documents that still list a third-party audit as a mandatory gate are superseded.
- The Founder Jetton Wallet ordinary `TokenTransfer` method is owner-authorized and checks balance/fees, but is not contract-locked until Stage 5. The five-stage receipt followed by four allocations is a mandatory Founder operating procedure for this release. Before each allocation transfer, independently verify on the deployed Master: Stage 5 confirmed, next stage 6, no receipt pending, `mintable=false`, and total supply exactly `2100000000000000`; verify the Founder Jetton Wallet balance and recipient owner address as well. If any condition fails, do not transfer.
- Critical address reconciliation: a prior Tonkeeper report on 2026-11-22 named `EQBn4hW8bKhFTSz9riY5q3Pr3SfJmv2VYKZQl_NWMbK--5fP` as a Jetton Master and showed Active / 2.1B V COIN, but no transaction hash or independent on-chain confirmation was preserved. The exact-build offline derivation on this branch instead produced `EQC_gSnjZTc2Kufgl5ltFF-b2zr5_j4diozxC-IvEp9zzVaL`, while the Mainnet template still records `master_address=null`. Resolve this discrepancy by inspecting both addresses on TON Mainnet (account status, code/data hashes, Jetton getters, owner, metadata, supply and history). Do not deploy another Master or issue/transfer tokens until this is reconciled.
- Action #87 adds a read-only TON Center Mainnet reconciliation step: current Founder account state/balance plus reported and derived Master account states, code/data hashes, and Jetton master supply/mintability/admin/metadata. It emits `build/mainnet-state-reconciliation.json`; it does not read Founder transaction history or submit any message. API failures are recorded as unavailable, never treated as success.
- Mainnet fee estimate and exact-message emulation, Founder wallet-control proof, destination confirmation, and reviewed unsigned deployment payload remain pending.
- Founder reports operational TON funding; deposit and balance are not independently verified on-chain.
- No deployment, issuance, transfer, signing, or broadcast is performed or authorized. Authorization flags remain false.

---

# ACTION #85 — Fresh-runner clean-room build and deterministic hash reproduction (2026-11-24)

**Status:** Passed on the exact PR head in two separate GitHub-hosted runners. This is internal CI reproducibility evidence, not an independent third-party audit. Mainnet remains HOLD / NO-GO.

- Exact PR head: `0b1d4438d63ebb629799a2a2bd05ee388842847a`; PR #24 remains open as a draft and is not merged to `main`.
- Workflow run #535: [GitHub Actions](https://github.com/vahidnemati3544-opsking/v-coin-TON/actions/runs/45415086294) — SUCCESS.
- `build-and-test`: dependency lockfile check, clean `npm ci`, zero moderate/high/critical npm audit gate, Tact compile, metadata content-cell generation, deterministic Master/five-wallet derivation, release guards, and all 3 Jest suites / 20 tests passed.
- `hash-reproduction`: a second fresh runner installed the exact lockfile, rebuilt Tact contracts and metadata, independently re-derived the Master and five Jetton Wallet candidates, and compared the JSON derivation plus Master code BOC, Wallet code BOC, and metadata content BOC byte-for-byte against the first runner. All comparisons passed.
- Clean-room artifact ID `14931822214`, SHA-256 `01780f39a9c510458afccd689e05daa5854fe514e18469ac0b1b3bbc6489108d`. Release artifact ID `14932386211`, SHA-256 `60fdea5668ba8b4f79a46027beff6deacf3bf44b98212e2f991c50fc45b6a113`.
- This establishes reproducible builds and deterministic derivation across two isolated CI runners under the same GitHub Actions workflow. It does **not** establish independent ownership, independent third-party review, live Mainnet fee sufficiency, or on-chain deployment.
- Source-policy finding: the ordinary Founder Jetton-wallet `TokenTransfer` path checks owner, balance and fee sufficiency, but does not check that all five receipt stages are complete. Therefore Founder can technically transfer already credited tokens before Stage 5. This is not an unauthorized-user bypass; it is a mismatch if the documented “no allocation before all five receipts” rule is intended to be enforced on-chain. Either add a Stage-5 transfer lock plus a regression test, or explicitly classify the sequence as a Founder operating procedure rather than a contract invariant.
- No source contract logic, supply, allocations, owner addresses, authorization flags, or on-chain state changed. No transaction was created, signed, or broadcast.

**Remaining Mainnet gates:** (1) safe Founder wallet-control proof and explicit confirmation of the four recipient owner addresses; (2) current Mainnet config/fee and exact deployment-message emulation; (3) reviewed unsigned deployment payload; (4) separate Founder review/signature and subsequent on-chain verification. Internal source/security review and engineering controls remain required. A third-party audit is not a current project release condition under the already-merged project decision; do not describe internal review as an external audit. Public mining remains disabled pending its own wallet-proof, balance-snapshot, payout and reconciliation gates.

---

# ACTION #84 — Deterministic Mainnet Master and five Jetton Wallet derivation (2026-11-24)

**Status:** CI derivation passed on a fresh GitHub Actions runner; candidate addresses are computed and recorded. Independent third-party reproduction and security review remain pending. Mainnet remains HOLD / NO-GO.

- Branch: `audit/action-83-burn-transfer-bounce-tests`; not merged to `main`. Exact source head: `97fb9cf88914f3433d38502e357a84b1c4327cdd`.
- Added `contracts/jetton/scripts/derive-mainnet-addresses.ts` and `npm run derive:addresses`.
- Updated `.github/workflows/vcoin-jetton-verify.yml` to derive the Master StateInit and five deterministic Jetton Wallet addresses from the exact freshly compiled Tact wrappers, Founder owner address, and immutable metadata content cell.
- Jetton workflow #522: [GitHub Actions](https://github.com/vahidnemati3544-opsking/v-coin-TON/actions/runs/45414164006) — SUCCESS. Tact compilation, metadata cell generation, deterministic address derivation, all release policy guards, and 3 Jest suites / 20 tests passed.
- Release artifact ID `14931690742`, GitHub SHA-256 `aafaeaa9f48fc68b509102942b5fd0612a7ea14e166e3aa42ea3da690171c201`; the downloaded ZIP was locally hashed and matched exactly.
- Full-source artifact ID `14931390678`, GitHub SHA-256 `d013f337452d542e316512b8d486e183fcf1f53133e2516107a487894fe8c43e`.
- Derived Master candidate (bounceable Mainnet form): `EQC_gSnjZTc2Kufgl5ltFF-b2zr5_j4diozxC-IvEp9zzVaL`.
- Master StateInit hash: `bf8129e36537362ae7e097996d145f9bdb3af9fe3e1d8a8cf10be22f129f73cd`; code hash: `e08c11238070eeaffbbe783077eb49f61ad770a71f2e3096f83956776ed28ed8`; data hash: `5c8dfa26503e30f1af0c5be2ccbdcf719e3c9670b69220fa9cd8bde85018868b`.
- Derived Jetton Wallet candidates (bounceable Mainnet form):
  - Founder: `EQDUY4YWgv2OHA9sbDch0Es1-Uq9dRDDzhMVV6Y4ODiJuLUU`
  - Treasury: `EQBDU5EsmXzEqCLCvsLzDnuC6kwe9DVFTPUteUh8ydFeDCpf`
  - Liquidity / Market: `EQAaRu9jWJxacm53NiNdw8z0vRWYNDvqubTWB38Io5lE15ni`
  - Ecosystem / Marketing: `EQAkVrbn7SJp414LV_CvpmUsEYpxAVzk-rbOESC7C3aaRuuL`
  - Mining Reserve: `EQCqKJ91CwwTe93W9mN71855otBgcsj10UPf47xF4hGm2lKH`
- The derivation output is in `build/mainnet-address-derivation.json` within the release artifact. It explicitly sets `deployment_authorized=false`, `mainnet_authorized=false`, and all transaction-created/signed/broadcast flags to false.
- These are **computed candidate addresses only**. They do not prove that a Master contract is deployed at the candidate address, do not verify any Jetton Wallet on-chain, and must not be used for transfers until independently reproduced and compared with the deployed Master getter.
- The local offline `npm ci` attempt could not install missing cached dependency `zod@4.6.7`; the exact source did successfully compile and derive in the clean GitHub Actions runner. A separate independent reviewer/environment is still required to reproduce the results.
- No contract source logic, supply, allocation, wallet owner address, authorization flag, or on-chain state was changed. No TON was spent; no transaction was created, signed, or broadcast.

**Remaining gates:** independent reproduction of all hashes and addresses by a separate reviewer/environment; independent security review; live Mainnet fee and exact-message emulation; Founder wallet-control proof and destination confirmation; exact reviewed unsigned deployment payload. Only after those gates may a separate Founder signature authorize the exact deployment.

---

# ACTION #84 — Deterministic Mainnet address derivation tooling and clean-room attempt (2026-11-24)

**Status:** Derivation tooling added to the isolated review branch; exact deterministic output awaits CI execution. Independent clean-room rebuild remains blocked locally by unavailable dependency cache. Mainnet remains HOLD / NO-GO.

- Branch: `audit/action-83-burn-transfer-bounce-tests`; this continues the Action #83 review branch and is not merged to `main`.
- Added `contracts/jetton/scripts/derive-mainnet-addresses.ts` and `npm run derive:addresses`.
- Updated `.github/workflows/vcoin-jetton-verify.yml` to rebuild generated wrappers, derive the Master from the actual current constructor arguments (Founder owner + immutable metadata content cell), derive all five Jetton Wallet addresses from the generated wallet code and Master address, validate pairwise uniqueness, and export `build/mainnet-address-derivation.json` in the release artifact.
- The derivation output explicitly records that it is offline-only, is not a deployment payload, and does not authorize, create, sign, or broadcast a transaction. CI continues to require both Mainnet authorization flags to remain false.
- Source inspection confirms the current Tact constructor is `VCoinMaster(owner: Address, content: Cell)`. The older seven-argument constructor description in `allocation/INIT_PARAMETERS.md` is superseded historical material and must not be used to form a StateInit.
- Retrieved exact Action #83 release artifact ID `14931325038`; GitHub digest `f35c548dbf3535eb7d264f81430fccd2d1889a5fd21cf0fa3cf98840868d17fd` matched local SHA-256 of the downloaded ZIP.
- Retrieved exact Action #83 full-source artifact ID `14931430007`; GitHub digest `a21f286a362f67de2298e6aed2e694969dd8fe86b7103124715ee351be3fa564` matched local SHA-256 of the downloaded ZIP.
- The release artifact contains Master code BOC SHA-256 `719ef61c0a2fe472e8ecea442abc3938783112d2d0c34b8e83f2661b734ce8e3` and metadata content BOC SHA-256 `005aeddd589838a3b603ccbe58a6e893015e7f5dbaf4c5f43edb3fb2a82ee287`. These are file digests, not TON cell hashes or proof of deployment.
- A local independent `npm ci --offline` was attempted against the downloaded exact source and lockfile, but could not proceed because `zod@4.6.7` was not present in the local npm cache (`ENOTCACHED`). No local compiler rebuild or independent StateInit calculation is claimed.
- No Mainnet address or five Jetton Wallet address is declared verified in this action until the new derivation step completes in CI and an independent reviewer reproduces the result.
- No contract logic, supply, allocations, wallet owner addresses, authorization flags, or on-chain state changed. No TON was spent and no transaction was created, signed, or broadcast.

**Remaining gates:** complete the new CI derivation; independent reviewer independently rebuilds and reproduces Master StateInit and all five Jetton Wallet addresses; third-party security review; live Mainnet fee / exact-message emulation; Founder wallet-control proof and recipient confirmation; reviewed unsigned deployment payload.

---

# ACTION #83 — Add Sandbox coverage for burn and ordinary transfer bounce (2026-11-24)

**Status:** Implemented on an isolated review branch; exact-commit GitHub Actions build-and-test passed. Not merged to main. Mainnet remains HOLD / NO-GO.

- Branch: `audit/action-83-burn-transfer-bounce-tests`.
- Test commit: `040edf8aac520d677c2bd40a2fb2c7de92b330a8`.
- Jetton workflow run #512: [GitHub Actions](https://github.com/vahidnemati3544-opsking/v-coin-TON/actions/runs/45413055194) — `build-and-test` SUCCESS; Pages deploy skipped as expected for this review branch.
- Added three Sandbox cases in `contracts/jetton/tests/jetton-sandbox.spec.ts`:
  1. Burn before Stage 5 is rejected by Master and the bounced burn notification restores the Founder Jetton Wallet balance.
  2. Burn after Stage 5 succeeds, reduces the Founder Jetton Wallet balance and Master total supply equally, and leaves minting disabled.
  3. A normal TEP-74 transfer to a deliberately rejecting recipient wallet bounces and restores the sender wallet balance.
- Exact-head CI passed: 3 Jest suites / 20 tests; Tact compilation, lockfile verification, dependency audit gate, metadata-cell generation, release-policy guards, and read-only issuer page validation all passed.
- Release artifact: ID `14929451710`, SHA-256 `136208023c675569875c6331bb9f79d455da5c5485dd865fa0486e89df15a539`.
- Full-source artifact: ID `14928133959`, SHA-256 `296576f17ac67b3c005f9f5992663f89ad9f13819778964022ed1a938bdb2899`.
- Downloaded release artifact SHA-256 was locally recomputed and matched GitHub's recorded digest exactly.
- No contract source, supply, allocation, wallet address, deployment authorization flag, or Mainnet transaction behavior was changed. No wallet was connected; no TON was spent; no deployment, mint, or transfer occurred.

**Still blocking Mainnet:** independent clean-room rebuild and StateInit / five wallet-address reproduction; independent third-party security review; live Mainnet config/fee and exact-message emulation; Founder wallet-control proof and recipient confirmation; exact reviewed unsigned deployment payload. The Mainnet planner remains disabled and public mining remains disabled.

---

# ACTION #82 — CI #511 exact-head verification and expanded Mainnet gate review (2026-11-24)

## Verified evidence
- Exact current main commit: `9ed1cb439dc2e4c5b0c8c7cdfec04270dad70e53`.
- Jetton workflow #511: SUCCESS — [GitHub Actions run](https://github.com/vahidnemati3544-opsking/v-coin-TON/actions/runs/45403615960).
- Both `build-and-test` and `deploy-issuer` jobs completed successfully. The build job verified the committed lockfile, clean dependency installation, zero moderate/high/critical npm audit advisories, Tact compilation, metadata-cell generation, release-policy guards, and 3 Jest suites / 17 tests. The read-only Pages/TonConnect issuer endpoints were published and checked.
- The Pages deployment is only a read-only issuer/status site; it is not a TON contract deployment.
- `contracts/jetton/scripts/prepare-mainnet-deployment.ts` intentionally throws and remains disabled. No unsigned Mainnet deployment payload is available for review.
- The run logs include Node.js 20 action deprecation warnings and dependency deprecation warnings. These are maintenance warnings, not evidence of an npm security advisory; update the workflow/runtime compatibility before a production release.

## Expanded source and test coverage review
- Reviewed the exact current `jetton.tact`, `vcoin.tact`, `messages.tact`, Sandbox suite, deployment template, allocation manifest, runbook, and disabled Mainnet planner.
- The current 17-test suite verifies Founder-only five-stage receipt, exact 2.1B cap, sequential acknowledgements and retry, Stage 1/2 natural bounce rollback, normal allocation transfers, and Founder-only reserve funding/withdrawal.
- **Additional test gap identified:** the current automated suite contains no dedicated burn-flow test and no dedicated ordinary Jetton transfer-bounce/refund test. These must be added and pass in Sandbox before Mainnet approval. This does not assert that the source paths are broken; it means those failure/edge paths are not currently evidenced by tests.
- A clean-room rebuild and independent reproduction of Master StateInit / deterministic Jetton Wallet addresses remain uncompleted.
- No independent third-party security audit is evidenced. The current review is an internal source-level review only.

## Live-network and authorization gates still open
1. Independent clean-room build from the exact commit and pinned compiler/dependency toolchain; independently reproduce the Master StateInit and all five wallet derivations.
2. Independent third-party review of the exact source and release artifacts; remediate and retest every finding.
3. Add Sandbox tests for burn success/rejection and ordinary transfer bounce/refund, then rerun exact-head CI.
4. Prove Founder wallet control using a safe wallet signature/proof challenge, and have the Founder confirm all four destination owner addresses. Never request or disclose seed phrases, private keys, PINs, or recovery codes.
5. Read current Mainnet configuration parameters for storage, gas and forwarding fees; emulate the exact deployment and subsequent messages using the current network configuration. Review attached TON values, Master reserve, bounce/recovery behavior, and possible stuck funds. Static reserve constants alone are not a live fee analysis.
6. Re-enable no planner automatically: first produce a reviewed, unsigned deployment payload containing exact owner, metadata content, code/data hashes, StateInit hash, and expected Master address; independently inspect it.
7. Only after all prior gates pass, the Founder may separately approve and sign deployment in Tonkeeper. Verify deployed Master code, owner, metadata, supply, mintability and getters on Mainnet.
8. Execute the five exact Founder receipts one at a time, each with a fresh Founder signature and independent finalized on-chain confirmation. After full 2.1B receipt, execute four separate Founder-signed allocations and verify final balances.
9. Keep public mining disabled until wallet ownership proof, trusted finalized Mainnet balance snapshots, payout sender and finalized payout reconciliation are implemented and tested.

## Controlling decision
- Mainnet disposition remains **HOLD / NO-GO**.
- `deployment_authorized=false`; `mainnet_authorized=false`.
- No Master deployment, issuance, transfer, or Mainnet transaction has been verified or authorized by this review.
- CI success, a published status page, or this internal review does not replace independent audit, clean-room derivation, live fee analysis, or Founder signature.

---

> **LATEST CONTROLLING UPDATE — Action #81 (2026-11-24):** Exact-current-main Jetton CI #510 passed on commit `1775483bf84d7ed918c30476e186f64c9ed29fe8`: clean lockfile install, `npm audit` reported zero vulnerabilities, Tact compilation succeeded, and all 17 Sandbox/policy tests passed (3 suites). The read-only TonConnect issuer Pages deployment and endpoint checks also passed. Source-level review reconfirmed the Founder-only five-stage issuance, exact 2.1B cap, acknowledgement retry path, bounce rollback, and Founder-signed allocation transfers. This is not an independent third-party audit or an independently reproduced clean-room build. Mainnet remains HOLD / NO-GO: no deployed Master, no signed/broadcast transaction, no mint, and no transfer. Remaining release gates are listed below. See [CI #510](https://github.com/vahidnemati3544-opsking/v-coin-TON/actions/runs/45402776908).

# CURRENT CONTROLLING RELEASE STATUS — 2026-11-24 (Action #81)

## Exact-head evidence
- Repository: `vahidnemati3544-opsking/v-coin-TON`, branch `main`; exact head reviewed: `1775483bf84d7ed918c30476e186f64c9ed29fe8`.
- Jetton CI #510: SUCCESS. `npm ci` from committed lockfile succeeded; `npm audit --audit-level=moderate` found 0 vulnerabilities; Tact Master/Wallet compilation succeeded; all 3 Jest suites and 17 tests passed; Founder-first release guards passed; read-only Pages artifact and endpoint verification passed.
- Workflow artifact digests: release ZIP `81764fc2a80bf46dc1300aee6e59a27081a9785cda08379a539810bd3fe77bc5`; full-source ZIP `0fdd1be222d669fd0619c4e3d5072dc82e330d961e818dea8182c5bdba0e90f4`. These identify CI artifacts, not deployed contract code.
- This workflow build is a reproducible CI build from the committed source and lockfile. It does not replace an independent clean-room rebuild/hash reproduction by a separate environment or reviewer.
- Pages deployment publishes a read-only release-status / TonConnect issuer site. It does not deploy the Jetton Master to TON Mainnet.

## Source-level review — scope and limitations
- Reviewed current `src/vcoin.tact`, `src/jetton.tact`, and Sandbox tests. Contract logic enforces Founder-only issuance, the five exact receipt amounts, 2.1B hard cap, sequential receipt acknowledgements, bounce rollback of the pending stage, and mint disablement after Stage 5.
- The Founder Jetton Wallet retains a retryable acknowledgement marker; a Founder-authorized retry can resend a lost/non-processed acknowledgement. The current Sandbox suite covers the retry path and natural Stage 1/Stage 2 bounce behavior.
- Four later allocation transfers are ordinary Founder-signed TEP-74 transfers; destination roles/amounts are recorded in the release manifest but are not hard-coded as four separate on-chain destination caps.
- The source review is not a formal independent security audit. It cannot certify absence of vulnerabilities, fee sufficiency, Mainnet behavior, or wallet ownership.

## Hard blockers before Mainnet deployment
1. Independent clean-room rebuild from the exact commit and pinned toolchain, with independent reproduction of Master StateInit and all five deterministic Jetton Wallet addresses.
2. Independent third-party contract/security review of the exact release source and compiled artifacts; resolve and retest all findings.
3. Founder wallet-control proof and explicit confirmation of all four destination owner addresses. Never share seed phrases, private keys, PINs, or recovery codes.
4. Current TON Mainnet fee, attached-value, storage reserve, deployability and bounce/recovery analysis using the exact deployment message.
5. Produce and independently inspect the exact unsigned deployment payload, including owner, immutable metadata content, code/data hashes and expected Master address.
6. Only after gates 1–5: Founder reviews and signs the deployment in Tonkeeper. Then independently verify the deployed Master address, code, owner, metadata, total supply, mintability and getters on Mainnet.
7. Derive each recipient Jetton Wallet using the deployed Master `get_wallet_address`, independently reconcile the addresses, then execute each of the five Founder receipt stages separately with a fresh Founder signature and finalized on-chain confirmation.
8. After the full 2.1B is confirmed in Founder wallet, execute the four separate Founder-signed allocation transfers and verify each final balance.
9. Keep public mining disabled until TON Connect ownership proof, trusted finalized Mainnet balance snapshots, payout sender, and finalized payout reconciliation are implemented and tested.

## Authorization boundary
- `deployment_authorized=false`, `mainnet_authorized=false`; issuance and payout authorization remain false.
- No Mainnet Master address or deployment transaction is verified. No transaction payload is approved for signature.
- Deployment, reserve funding, each of five receipts, and each allocation transfer require separate Founder review and explicit authorization.
- No public Testnet deployment or transaction is authorized; local TON Sandbox remains simulation-only.
- Do not infer authorization from green CI, website publication, source review, or the user's general request to complete preparation.

---

> **LATEST CONTROLLING UPDATE — Action #80 (2026-11-24):** Current-main Jetton CI #507 passed on documentation commit `656f76b2d02e0bfeb0a420e74abe91ec3d08e125`; source build and read-only Pages publication also passed on source-identical contract head #506. Downloaded release and full-source ZIPs matched GitHub artifact SHA-256 digests exactly. A separate local clean-room `npm ci` attempt timed out before installing the Tact compiler, so independent rebuild remains pending. Mainnet remains HOLD / NO-GO; no deployment, mint, or transfer. See Action #80.

# CURRENT CONTROLLING RELEASE STATUS — 2026-11-24 (Action #78)

## Verified repository and CI state
- Repository: `vahidnemati3544-opsking/v-coin-TON`, branch `main`; latest reviewed code commit: `f12ea01f916a8c169600f9a119c705dfca5cc83f`.
- Mining CI #481: SUCCESS; Backend CI #390: SUCCESS, both on exact HEAD `f12ea01`.
- Exact-current-main Jetton workflow #506: SUCCESS on `fb37ab2fd166a1c52616f1c66abc9af75b238923`, including lockfile verification, clean install, zero moderate/high/critical dependency advisories, Tact compilation, TEP-64 content-cell generation, Founder-first manifest and authorization checks, Jest Sandbox tests, source snapshot, read-only status page validation, Pages publication, and published endpoint verification. Mining #481 and Backend #390 passed on the immediately preceding code head; the later #78 change was documentation-only.
- Five-stage Founder-first contract is present on current main. Sandbox tests cover stage ordering, exact amounts, acknowledgement retry, natural bounce/retry, and Founder-signed allocation transfers.
- Public mining API remains hard-disabled with HTTP 503; legacy internal-PostgreSQL-balance engine is not mounted on public routes.

## Fixed supply and Founder-first sequence
- Fixed supply: **2,100,000,000 VCOIN**, six decimals, hard cap `2100000000000000` base units; no additional minting.
- Founder Mainnet receiving wallet: `UQBh9jVKAypc4TrbFx2jsVB2EI1ONChg22zDputisQjENQOT`.
- Five separately signed receipt stages: 420M, 1.05B, 210M, 210M, 210M VCOIN.
- After all five stages are independently confirmed, Founder signs four separate TEP-74 transfers: Mining Reserve 1.05B; Treasury 210M; Liquidity/Market 210M; Ecosystem/Marketing 210M. Founder retains 420M.

## Hard blockers before any Mainnet transaction
1. Clean-room rebuild from exact source and pinned toolchain; independently reproduce Master StateInit and five deterministic Jetton Wallet addresses.
2. Independent security review of the exact current contract/artifacts and resolution of findings. No independent audit/certification is evidenced.
3. Founder wallet-control proof and explicit confirmation of all four destination addresses. Never collect seed phrases, private keys, PINs, or recovery codes.
4. Live TON fee, attached-value, Master reserve and bounce/recovery review.
5. Only after the above: Founder-reviewed deployment payload, separate Founder signature, and independent on-chain verification of Master address, code, owner, metadata, total supply, mintability and getters.
6. Derive each recipient Jetton Wallet from deployed Master `get_wallet_address` and reconcile independent derivations.
7. Execute the five exact Founder receipts one at a time. Wait for finalized Jetton Wallet credit and Master acknowledgement before the next stage.
8. Verify Founder holds the full 2.1B, then prepare four separate Founder-signed TEP-74 allocation transfers and independently confirm each final balance.
9. Keep real mining disabled until TON Connect ownership proof, trusted finalized Mainnet balance snapshots, payout sender, and finalized payout reconciliation are implemented and tested.

## Authorization and transaction boundary
- `deployment_authorized=false`, `mainnet_authorized=false`, and Mainnet issuance/payout authorization remain false in the deployment template.
- Mainnet planner is deliberately disabled. No deployed Master or Mainnet token issuance/transfer is independently verified.
- Deployment, reserve funding, each receipt, and each allocation transfer are separate irreversible operations requiring a separate explicit Founder approval.
- Public Testnet operations are not authorized; local TON Sandbox is the only permitted simulation environment.
- No transaction may be signed or broadcast based on CI success, documentation, predicted addresses, or Sandbox results alone.

---

# HISTORICAL RELEASE STATUS SNAPSHOT — Action #68 (superseded by Action #78)



> This section supersedes older Mainnet readiness claims below. It distinguishes the current `main` branch from the unmerged Founder-first candidate branch.

## Current `main` branch — exact-head evidence

- Main implementation/workflow commit reviewed: `31cb6fd6b7bbb4f1ede1b66661969ba3be4acb80` — [commit](https://github.com/vahidnemati3544-opsking/v-coin-TON/commit/31cb6fd6b7bbb4f1ede1b66661969ba3be4acb80).
- Exact-head GitHub Actions [run #423](https://github.com/vahidnemati3544-opsking/v-coin-TON/actions/runs/45343133295) completed with **failure**. This is not a green release CI.
- Passed before the release gate: committed lockfile drift check; clean `npm ci`; strict `npm audit --audit-level=moderate` with zero vulnerabilities; Tact compilation; TEP-64 content-cell generation; Founder-first manifest/authorization consistency check; Jest Sandbox **3 suites / 21 tests passed**.
- Run #423 then failed deliberately at the Founder-first implementation gate. The current `main` contract still lacks the Stage 1/Stage 2 issued/acknowledged state and corresponding Sandbox coverage. The existing 21 passing tests are for the legacy direct-five-wallet mint implementation; they do not verify the approved Founder-first two-stage behavior.
- `contracts/jetton/package-lock.json` exists on `main`, lockfileVersion 3, is committed, and was verified current before `npm ci`.
- TEP-64 metadata JSON remains pinned to commit `e17bcb9d82ea182bff3358b9fac6b5fa25c166ee`. Run #423 regenerated its content cell successfully: `abadcbc42c4e6309bea1d595dbfd1b834a07bfb171b2b1e2cb6d4b7e244330ca`.
- The main manifest keeps Stage 1 and Stage 2 amounts null, suppresses all obsolete direct-mint transaction previews, and keeps `deployment_authorized=false`, `mainnet_authorized=false`, and `mainnet_transaction_authorized=false`.
- The five unique owner-designated Mainnet addresses in the deployment config match the five allocation rows in the manifest; the configured base-unit allocations sum to exactly `2100000000000000`. The Founder address is also the sole GAS & OPERATIONS address. There is **no separate GAS wallet** and no sixth allocation destination. Wallet control remains unverified.
- The old Founder address `UQAdW09EvIesUXt9jzLq1T32O0351TaczwWJQLGGmw4aWrzy` remains Testnet-only historical data; it is not the current Founder Mainnet address.
- The `deploy-issuer` job was skipped because the build job stopped at the explicit release gate. The latest read-only Pages publication is therefore not verified by run #423. Earlier Pages success on run #320 belongs to an older source revision.

## Unmerged Founder-first candidate branch

- Candidate branch: `feat/founder-first-two-stage`, head `43b949901cb5d02830f5332c0d5b08b0a31060e0` — [commit](https://github.com/vahidnemati3544-opsking/v-coin-TON/commit/43b949901cb5d02830f5332c0d5b08b0a31060e0). It is **not merged to main**.
- Exact-head [run #421](https://github.com/vahidnemati3544-opsking/v-coin-TON/actions/runs/45341503815) succeeded: Tact build, clean lockfile install, zero npm audit advisories, TEP-64 generation, unsigned previews, read-only status checks, and Jest **3 suites / 16 tests passed**. The Pages deploy job was skipped; this does not establish publication of the candidate page.
- Candidate artifact ID `14896650621`, ZIP SHA-256 `10a640eda84501abf992cb120de4f6ca645c5cbdabf3553758733652bd5e81fd`. The downloaded archive's SHA-256 was independently matched to GitHub's artifact digest.
- A separate BOC parser independently reproduced the candidate artifact's Master code-cell hash, Master data-cell hash, Master StateInit hash, TEP-64 content-cell hash, all five Jetton Wallet StateInit hashes, and the account-hash/CRC checks in the six friendly addresses. This is independent hash reproduction **from the CI BOCs**, not a clean-room rebuild/compilation from source, and these remain predictions rather than deployed addresses.
- The candidate's Mainnet preview has no receipt payloads because its Mainnet Stage 1 amount is null. Do not use the candidate artifact as a Mainnet transaction package until it is merged, reverified on exact `main`, and all release gates pass.
- Candidate-only Testnet configuration currently records Stage 1 = 1,000,000,000 and Stage 2 = 1,100,000,000 VCOIN and marks a Testnet rehearsal as Founder-authorized. The controlling `main` manifest does not approve those values or any Testnet transaction. Treat that candidate-only split/authorization claim as **unreconciled and not approved for execution**; no Testnet transaction was sent in this review.

## Engineering/security review observations on the candidate

- The candidate's two-stage Master credits only the Founder Jetton Wallet, waits for wallet acknowledgements, requires Stage 2 to equal the exact remaining supply, and rolls back the corresponding stage on a natural bounce. Its Sandbox suite covers Stage 1/Stage 2, exact remainder, and natural bounce cases.
- **Open reliability issue:** the candidate Jetton Wallet sends `VCoinReceiptAcknowledgement` with bounce disabled, and the reviewed source has no acknowledgement retry/recovery path. If the acknowledgement is not processed, the credited stage can remain unconfirmed and Stage 2 can remain blocked. Add a tested recovery/acknowledgement retry design before integration.
- **Allocation-control limitation:** the four later distributions are ordinary Founder-signed TEP-74 Jetton transfers. The candidate Master does not enforce the four destination addresses or per-destination caps on-chain; those amounts are represented in the off-chain plan/backend. Do not describe the four caps as on-chain enforced. Decide and document whether Founder-reviewed ordinary transfers are sufficient or whether an enforceable distribution control is required.
- No independent third-party TEP-74/security audit is evidenced. The prior internal review applied to the superseded direct-mint design; the candidate has source-level review notes, not independent certification. No vulnerability-free or audited claim is made.
- Production indexer/backend integration that verifies finalized on-chain receipts/transfers and reconciles the accounting database remains pending.
- No clean-room rebuild from the exact source and pinned toolchain has been completed. The BOC hash reproduction above does not replace it.

## Transaction and deployment boundary

- No Mainnet or Testnet transaction was signed or broadcast by this review. No contract was deployed and no VCOIN was minted or transferred.
- No exact transaction package is approved for signature: the main contract has not been updated to the candidate; the candidate stage split is unreconciled; the acknowledgement recovery and distribution-control questions remain open; wallet control and live fee/reserve simulation remain pending.
- Mainnet authorization flags remain false. Never request or store seed phrases, private keys, PINs, or recovery codes.

## Action #68 — Correct CI self-match and enforce Founder-first release gating

**Status:** Workflow guard correction committed; exact-head CI correctly remains NO-GO.

- Fixed a self-matching string check that caused run #419 to fail before Sandbox tests.
- Added a static Founder-first implementation gate after Sandbox tests. The gate is aligned with the candidate's actual state/acknowledgement model and prevents the legacy direct-mint contract from appearing release-ready merely because its old tests pass.
- Run #423 confirms the intended behavior: compilation, lockfile, audit, metadata, manifest checks and all 21 legacy tests passed; the explicit Founder-first gate failed because the current `main` source does not yet implement the new flow.
- No contract code, allocation address, supply, stage amount, or transaction payload was changed by this action.

---

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

- Latest contract-source commit: `5525a85f00b2b9b33c86e91192ad3403d09467e0` — [commit](https://github.com/vahidnemati3544-opsking/v-coin-TON/commit/5525a85f00b2b9b33c86e91192ad3403d09467e0).
- Latest allocation-manifest correction: `f3745c07e3474416c043ffe4ab7ff0f3060d2473` — [commit](https://github.com/vahidnemati3544-opsking/v-coin-TON/commit/f3745c07e3474416c043ffe4ab7ff0f3060d2473). The stale former Founder/Testnet address was removed from active Founder/GAS fields; the manifest now matches the current Founder Mainnet address and five owner-designated destinations, with all preview predictions cleared.
- Latest workflow guard: `f3674758602bc86e65961f7297fe33f5f5e10c65` — [commit](https://github.com/vahidnemati3544-opsking/v-coin-TON/commit/f3674758602bc86e65961f7297fe33f5f5e10c65). Action #67 disables the obsolete direct-five-wallet mint preview generator, blocks stale payload artifacts, checks the disabled planner, checks lockfile drift, and validates the Founder-first manifest and false authorization flags. The public Pages source is read-only HOLD / NO-GO.
- A repository-side JSON consistency check passed for the five unique destinations, exact 2.1B allocation sum, shared Founder/GAS address, staged receipt fields, and false authorization flags. This is not a CI run or proof of wallet control.
- GitHub combined-status lookups for the reviewed workflow commit returned no check statuses, and the available workflow-run lookup did not expose a push-triggered run. **Exact-head CI for the new workflow/configuration guards is not verified.**
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


## Action #69 — Restore the Founder-approved five-stage receipt flow (2026-11-24)

**Status:** Five-stage source, accounting, testnet preview, CI guards, and documentation have been implemented on feat/five-stage-founder-receipt. Exact-head CI and independent review are pending. No Testnet or Mainnet transaction has been signed or broadcast. Mainnet remains HOLD / NO-GO.

The controlling initial receipt amounts are the Founder’s five-stage instruction, superseding the two-stage draft recorded in Action #66 and PR #21:

| Stage | VCOIN | Base units (6 decimals) |
|---:|---:|---:|
| 1 | 420,000,000 | 420000000000000 |
| 2 | 1,050,000,000 | 1050000000000000 |
| 3 | 210,000,000 | 210000000000000 |
| 4 | 210,000,000 | 210000000000000 |
| 5 | 210,000,000 | 210000000000000 |
| **Total** | **2,100,000,000** | **2100000000000000** |

- All five receipts go only to the Founder Mainnet wallet UQBh9jVKAypc4TrbFx2jsVB2EI1ONChg22zDputisQjENQOT.
- The Master enforces the exact next-stage amount and sequence, one pending stage at a time, and a hard 2.1B cap. The fifth acknowledged receipt disables minting permanently.
- The deterministic Founder Jetton wallet records acknowledgement state and allows the Founder to resend the same acknowledgement. The Master treats a duplicate acknowledged stage idempotently; a natural bounce rolls back only the pending stage and leaves earlier confirmed stages intact.
- Backend reconciliation accepts only the five exact stage amounts in order, after finalized Mainnet event verification against the expected Master, Founder owner, and deterministic Jetton wallet. Four subsequent allocations are blocked until all five receipt stages are recorded.
- Mainnet transaction planner remains deliberately disabled; CI generates no Mainnet payloads and never signs/broadcasts. Testnet generator emits five unsigned inspection previews only, isolated from Mainnet addresses and signing.
- PR #21's two-stage amounts (1B + 1.1B) are superseded and must not be used. The legacy Action #66 record is historical only.
- Required exact-head CI: Tact compilation, strict npm audit, all Sandbox tests, five-stage Testnet preview validation, backend syntax/unit tests, and PostgreSQL integration/migration tests.
- Required release gates after CI: review generated BOC/cell/StateInit hashes, verify all five Jetton wallet derivations, test real Testnet execution only after fee/emulator review and separate Founder approval, complete documented internal security review; external auditing is not a project release gate, verify wallet control and current fees. None of these is represented as completed by this source change.

**Mainnet authorization flags remain false.** No deployment, mint, receipt, or allocation transfer is authorized by this implementation task.



## Action #70 — Five-stage integration merged and exact-head CI passed (2026-11-24)

**Status:** Merged to main. Exact pre-merge source head passed all three required CI workflows. Mainnet remains HOLD / NO-GO; no deployment, mint, receipt, or allocation transfer was signed or broadcast.

- PR #22: https://github.com/vahidnemati3544-opsking/v-coin-TON/pull/22 — merged by squash.
- Merge commit on main: 41c34aa78bd9dde4b6b5ef94c7de2f50b0397872.
- Exact verified source head: 7154bba34f0dce7030b271234a7d4700133c4e5e.
- Jetton verification run #45391538194: SUCCESS. Tact compilation, strict dependency audit (zero moderate/high/critical advisories), metadata cell generation, five-stage unsigned Testnet preview generation and isolation validation, Mainnet planner suppression, five-stage allocation manifest validation, Jest Sandbox tests, five-stage contract guards, and read-only Founder status page validation all passed. The deploy-issuer job was skipped on the PR branch, as intended.
- Backend CI run #45391538237: SUCCESS. JavaScript syntax, PostgreSQL schema/migrations, migration-runner idempotency, backend unit tests, and integration tests passed.
- Mining CI run #45391538229: SUCCESS. Static checks, unit tests, and PostgreSQL integration tests passed.
- Jetton release artifact: vcoin-jetton-release-b732c7f63fc38e65c3de27df059269dba4fcad52; SHA-256 08371f72775ca45fda01ae618ea12ee3595104ce2c07336f6d508c518b8a439b.
- Full source snapshot artifact: vcoin-ton-full-source-b732c7f63fc38e65c3de27df059269dba4fcad52; SHA-256 009fcf895d736594bedc0316c4d81e2b191458992a34dbb38713e66210ccdd8f.
- Superseded PR #21 (two-stage 1B + 1.1B) was closed unmerged. PR #22 is the controlling five-stage implementation.
- The current five exact receipt stages remain 420M, 1,050M, 210M, 210M, 210M VCOIN. The Mainnet transaction planner remains disabled; deployment_authorized=false and mainnet_authorized=false. Unsigned Testnet preview generation is not Testnet execution.

**Next release boundary:** verify the post-merge main workflow and public read-only Pages deployment. Do not sign or broadcast any Testnet or Mainnet request without separate approval for that exact operation. Mainnet remains NO-GO.


## Action #71 — Mainnet-only deployment configuration correction (2026-11-24)

**Status:** Configuration corrected and committed; Mainnet remains HOLD / NO-GO. No blockchain transaction was created, signed, or broadcast.

- Removed the obsolete `testnet_rehearsal` block from `contracts/jetton/deployment.config.template.json`; it incorrectly described a Testnet rehearsal as authorized and pending.
- Added explicit network policy: Mainnet is the sole intended production network; local TON Sandbox is the only simulation environment; Testnet deployment and transactions are unauthorized.
- Explicitly set Mainnet deployment, issuance, and payout authorization to false. The Master address and deployment transaction remain unset because no deployed Master has been independently verified.
- Updated the initial receipt status to `mainnet_master_not_deployed_or_verified`. The five approved receipt amounts and the 2.1B fixed supply are unchanged.
- This correction does not create a Master address, deploy a contract, issue tokens, or activate mining.
- Current mining implementation remains blocked: the public mining API returns HTTP 503 until wallet ownership proof, verified Mainnet Jetton balance snapshots, payout sending, finality checks, and reconciliation are implemented. Do not expose the internal-PostgreSQL-balance engine as real extraction.
- Mainnet release gates still required: exact-current-main source build and Sandbox tests; independent reproduction of the exact Master StateInit and all five Jetton wallet derivations; verified Founder wallet control; deployed Master account/code/getter verification; trusted Mainnet provider configuration; fee/reserve review; and separate explicit Founder approval for each irreversible deployment or issuance operation.
- Official TON guidance requires verifying the Jetton master and deriving each holder's Jetton wallet with the Master's `get_wallet_address`; token name, symbol, and image are not proof of identity. Mainnet deployment spends real TON and must be confirmed by the Founder in the wallet.

**No authorization is implied by this documentation or commit.**


## Action #72 — Resolve stale two-stage and Testnet documentation (2026-11-24)

**Status:** Documentation and disabled-planner guard corrected on main. The latest Jetton workflow run #495 is pending; this action is not marked CI-tested until that exact head completes. Mainnet remains HOLD / NO-GO.

- Rewrote `docs/OWNER_INSTRUCTION_2026-11-24.md` to make the five-stage Founder-first sequence the controlling instruction and explicitly supersede the earlier two-installment draft: 420M, 1.05B, 210M, 210M, 210M VCOIN.
- Corrected `contracts/jetton/DEPLOYMENT_RUNBOOK.md` to state Mainnet-only operations, local TON Sandbox-only simulation, and no Testnet deployment, wallet request, signing, broadcast, receipt, or distribution authorization.
- Quarantined `contracts/jetton/TESTNET_REHEARSAL.md` as archived/do-not-run historical material; its old authorization language is no longer valid.
- Corrected `contracts/jetton/tests/README.md` to describe local Sandbox as the only permitted simulation environment.
- Corrected the disabled Mainnet planner's stale two-stage explanation. The planner remains intentionally disabled pending exact-head release gates and separate explicit Founder approval.
- No contract bytecode, supply, allocation, wallet address, deployment flag, or on-chain state was changed. No transaction was created, signed, or broadcast.
- Latest exact-head Jetton workflow: run #495, commit `4b9e1a907de40963094ee360de109a71701eb775`, pending at the time this entry was written: https://github.com/vahidnemati3544-opsking/v-coin-TON/actions/runs/45398811466

**Remaining blockers:** independent clean-room build and security review; exact Master StateInit and five Jetton-wallet derivation reproduction; Founder wallet-control verification; Mainnet Master deployment and on-chain getter verification; trusted finalized Mainnet balance provider; wallet ownership proof; payout adapter and finality reconciliation; non-skipped PostgreSQL integration verification for the production configuration. Public mining remains HTTP 503. No Mainnet deployment, token issuance, transfer, or real extraction is claimed complete.

**No authorization is implied by this documentation or commit.**


## Action #73 — CI failure diagnosis and workflow policy correction (2026-11-24)

**Status:** Root cause identified and CI workflow corrected on main. New exact-head run #497 is queued; this action remains awaiting CI verification. Mainnet remains HOLD / NO-GO.

- Diagnosed run #496 failure from the GitHub Actions job/step report. The failing step was **“Block obsolete direct-mint Mainnet transaction preview”**; its guard still searched for the former literal error string `DISABLED: legacy direct-mint Mainnet preview`, while the disabled planner had been updated to the new Mainnet-blocked message. This was a stale CI assertion, not a contract compilation failure.
- Corrected `.github/workflows/vcoin-jetton-verify.yml` to assert the current disabled-planner message.
- Found a second policy mismatch in the same workflow: CI was still generating and validating an unsigned public Testnet rehearsal preview, although the controlling Mainnet-only policy permits local TON Sandbox simulation only. Removed those Testnet preview-generation and validation steps and replaced them with a guard that rejects Testnet rehearsal script/preview references in the workflow.
- No contract source, token supply, allocation, wallet address, or on-chain state was changed. No wallet request, signature, deployment, mint, transfer, or broadcast was performed.
- New workflow run #497: https://github.com/vahidnemati3544-opsking/v-coin-TON/actions/runs/45399549724 — queued at the time of this entry.

**Next verification:** Wait for run #497 to finish. If it fails, inspect the exact failing job and step, fix only the demonstrated issue, and rerun. If it succeeds, inspect the remaining release blockers: independent clean-room build and security review, exact Master StateInit and five Jetton-wallet derivation reproduction, Founder wallet-control verification, Mainnet Master deployment/getter verification, trusted finalized Mainnet balance provider, TON Connect ownership proof, payout adapter, and finality/reconciliation. Public mining remains disabled (HTTP 503). Mainnet deployment, issuance, transfers, and real extraction remain unperformed and unauthorized.

**No authorization is implied by this correction or commit.**


## Action #74 — Correct Sandbox policy guard after run #497 (2026-11-24)

**Status:** Workflow guard corrected and committed. New exact-head CI run is required; Mainnet remains HOLD / NO-GO.

- Run #497 failed at **“Enforce local Sandbox-only simulation policy”** because the guard read the workflow file and searched for forbidden Testnet strings that the guard itself necessarily contained. This was a self-referential CI assertion, not a contract compile or Sandbox test failure.
- Replaced that assertion with checks against the authoritative deployment configuration: Mainnet target, local Sandbox-only simulation, Testnet deployment/transaction authorization false, Mainnet authorization false, and no Testnet rehearsal artifacts in the build output.
- No contract source, token economics, addresses, or on-chain state changed. No signing, deployment, mint, transfer, or broadcast occurred.
- Corrective workflow commit: `ff2547131288bdd7c710a172ff218e2957f8bc2d`.

**Next:** Verify the new exact-head CI run. If it passes, review all remaining release blockers independently; CI success alone does not establish Mainnet readiness or live mining.


## Action #75 — Hard-disable archived public Testnet rehearsal tooling (2026-11-24)

**Status:** Testnet rehearsal generator and configuration quarantined on main. Exact-head CI verification is pending. Mainnet remains HOLD / NO-GO.

- Replaced `contracts/jetton/scripts/prepare-testnet-rehearsal.ts` with an immediate fail-closed guard. It throws before imports, wallet parsing, file reads, or artifact generation.
- Replaced `contracts/jetton/testnet.rehearsal.config.json` with an archived, non-operational record: `network=disabled`, explicit public Testnet deployment/transaction authorization false, and the historical Testnet wallet labeled reference-only.
- This closes a residual operational hazard: earlier documentation prohibited Testnet execution, but the old generator and active-looking configuration were still executable and could produce TON Connect request payloads.
- The Mainnet deployment template, five-stage supply plan, contract source, wallet allocations, and Mainnet authorization flags were not changed.
- No wallet was connected, no payload was created, and no transaction was signed or broadcast.
- Exact-head Jetton CI run #500 passed both build-and-test and Pages deployment before this correction: https://github.com/vahidnemati3544-opsking/v-coin-TON/actions/runs/45399776945
- A new CI run is required for this action's commit.

**Remaining blockers:** Mainnet Master deployment and independent on-chain verification; Founder wallet-control proof; independent clean-room StateInit and Jetton-wallet derivation; production TON Connect wallet ownership proof; trusted finalized Mainnet balance snapshots; payout adapter and reconciliation. Public mining remains HTTP 503.

**No authorization is implied by this correction or commit.**


## Action #76 — Add HTTP-level regression coverage for the public mining fail-closed gate

**Status:** Committed and exact-head CI-tested successfully (Mining workflow #481 and Backend workflow #390, commit `f12ea01f916a8c169600f9a119c705dfca5cc83f`).

- Added `contracts/mining/backend/test/mining-public-api-guard.test.js`.
- The test starts the actual Express application on an ephemeral loopback port and checks all four public extraction routes: status, start, claim, and end.
- Each route must return HTTP 503 with the exact `WALLET_BALANCE_MINING_NOT_IMPLEMENTED` response. This proves the public API does not accidentally expose the legacy internal-balance mining router.
- The test performs no database connection, wallet connection, TON RPC call, signing, broadcast, token issuance, or payout.
- This is regression coverage for the existing safety gate; it does not implement Mainnet mining or change any economic rule.
- Exact-head verification passed: [Mining CI #481](https://github.com/vahidnemati3544-opsking/v-coin-TON/actions/runs/45401349184) and [Backend CI #390](https://github.com/vahidnemati3544-opsking/v-coin-TON/actions/runs/45401348953). The preceding failure was solely the test process importing the server without `DATABASE_URL`; the test now supplies an inert local URL and does not open a database connection.


## Action #77 — Post-fix security and release-boundary review (2026-11-24)

**Status:** Review recorded; no additional production-code change was justified by the reviewed evidence. Exact-head Actions #481 and #390 passed for commit `f12ea01f916a8c169600f9a119c705dfca5cc83f`.

- Confirmed the public Express application mounts a hard HTTP 503 gate for every `/api/v1/mining` route. The legacy internal-balance mining router is not mounted in the public server.
- Confirmed the HTTP regression test covers GET status and POST start, claim, and end. It runs on an ephemeral loopback port and does not connect to PostgreSQL, TON, or a wallet.
- Confirmed the legacy engine and internal ledger still calculate/settle against PostgreSQL balances. This is not compliant with the approved Mainnet wallet-balance source-of-truth rule and must remain isolated; it must not be enabled as real extraction.
- Confirmed Telegram HMAC validation uses the documented WebAppData derivation, rejects duplicate parameters, checks auth-date age, and issues hashed opaque session tokens. This authenticates Telegram WebApp data only; it does not prove TON wallet ownership.
- Confirmed the chain-reconciliation module validates caller-supplied event fields against expected Master, finalized Mainnet label, stage amount, owner and Jetton-wallet addresses before invoking database procedures. This module is not itself a trusted chain indexer/provider and does not independently prove event finality. Production must only call it with independently verified provider data.
- Confirmed price-reference endpoints explicitly label their output as a modelled reference, not a market price. No external market-price or guaranteed-value claim is established.
- No new on-chain action, Mainnet Master address, wallet ownership proof, live provider, TON Connect proof, payout sender, or finalized payout reconciliation was discovered.
- The separate Jetton workflow [#504](https://github.com/vahidnemati3544-opsking/v-coin-TON/actions/runs/45401010408) passed build-and-test and the read-only issuer deployment job on its then-current commit; it is not a substitute for the exact-head backend/mining runs #481 and #390.
- No tokenomics, supply, allocation, wallet address, contract source, or transaction authorization was changed in this review.

**Remaining hard blockers before real extraction:** verified/deployed Mainnet Jetton Master; TON Connect wallet-ownership proof; trusted Mainnet provider and immutable finalized balance snapshots; secure payout sender; finalized on-chain payout reconciliation; replay/idempotency/concurrency/bounce recovery tests; independent contract security review and clean-room build. Public mining remains HTTP 503 and Mainnet remains HOLD / NO-GO.

**No authorization is implied by this review or commit.**


## Action #78 — Correct stale top-level release status and consolidate transfer gates (2026-11-24)

**Status:** Current status reconciled in documentation. No production contract or transaction behavior changed.

- Replaced the stale Action #68 top-level status, which incorrectly described the five-stage contract as unmerged, with the verified current-main state.
- Recorded exact-head Mining CI #481 and Backend CI #390 success, and distinguished the preceding Jetton Build/Pages CI #504 from exact-head checks.
- Consolidated the remaining deployment, wallet-control, security, fee/reserve, five-stage receipt, and four allocation-transfer gates in one controlling section.
- Confirmed deployment and Mainnet authorization flags remain false, Mainnet planner remains disabled, public mining remains HTTP 503, and no Master deployment or VCOIN issuance/transfer is verified.
- No wallet connection, signing, broadcast, deployment, mint, or transfer occurred.

**Next:** Complete clean-room artifact reproduction and independent security review, verify Founder wallet control and recipient addresses, then prepare a reviewed unsigned deployment package. Each later on-chain action still requires separate Founder approval.

**No authorization is implied by this documentation update.**


## Action #79 — Exact-current-main Jetton build and read-only issuer publication verified (2026-11-24)

**Status:** Exact-head build-and-test and read-only Pages publication passed. Mainnet remains HOLD / NO-GO.

- Exact current-main commit: `fb37ab2fd166a1c52616f1c66abc9af75b238923`.
- Jetton workflow #506: SUCCESS — [GitHub Actions](https://github.com/vahidnemati3544-opsking/v-coin-TON/actions/runs/45402023739).
- Build job passed deterministic lockfile generation and verification, clean install, strict dependency audit with zero moderate/high/critical advisories, Tact compilation, TEP-64 content-cell generation, Sandbox tests, Founder-first manifest/authorization guards, read-only status page validation, and exact-head release artifact preservation.
- Read-only issuer Pages deployment job passed configuration, publication, and published endpoint verification. This publishes the status/issuer web assets only; it does not deploy the Jetton Master or issue tokens.
- Exact-head release artifacts:
  - Jetton release ZIP artifact ID `14924301153`, SHA-256 `9c9af07019f14280757c4e452ef985cc00e4722e0b5e68e777196c119f255c42`.
  - Full source snapshot artifact ID `14923132529`, SHA-256 `50ab0a5ffdab23a01c692180d04cb6d0ac3203f39479063cb3e2b5877928a7c3`.
- Mining CI #481 and Backend CI #390 previously passed on `f12ea01`; the changes through #79 after that code head are documentation-only, while #506 verifies the current Jetton source and build.
- No Mainnet wallet was connected; no deployment payload was signed; no TON was spent; no Master was deployed; no VCOIN was minted or transferred.

**Next release gates:** independent clean-room rebuild and security review; Founder wallet-control proof and destination confirmation; live fee/reserve review; only then a reviewed unsigned Mainnet deployment package. The five receipt stages and four allocations remain separate Founder-approved operations.

**No authorization is implied by CI success or Pages publication.**


## Action #80 — Verify exact-head artifact integrity and attempt clean-room rebuild (2026-11-24)

**Status:** Artifact integrity verified; independent clean-room rebuild not completed. Mainnet remains HOLD / NO-GO.

- Downloaded the exact-head Jetton release artifact from workflow #506 (artifact ID `14924301153`). Local SHA-256: `9c9af07019f14280757c4e452ef985cc00e4722e0b5e68e777196c119f255c42`, exactly matching GitHub's published artifact digest.
- Downloaded the exact-head full-source snapshot (artifact ID `14923132529`). Local SHA-256: `50ab0a5ffdab23a01c692180d04cb6d0ac3203f39479063cb3e2b5877928a7c3`, exactly matching GitHub's published artifact digest.
- Inspected the release archive contents and confirmed it contains the generated Master and Jetton Wallet BOCs, generated metadata cell, compiler outputs, lockfile, and dependency audit report.
- Extracted the full-source snapshot to an isolated local directory and attempted a fresh `npm ci` using the committed lockfile. The install exceeded the available execution window before the Tact compiler was installed; no independent local compilation or BOC comparison is claimed.
- Exact-current-main Jetton workflow #507 passed on documentation commit `656f76b2d02e0bfeb0a420e74abe91ec3d08e125`: [GitHub Actions](https://github.com/vahidnemati3544-opsking/v-coin-TON/actions/runs/45402270604). Exact-head source build and Pages publication were separately confirmed by #506.
- Artifact digest matching proves the downloaded files match GitHub's recorded artifacts; it does **not** establish a clean-room build, security audit, deployed contract, or wallet ownership.

**Next:** Complete a reproducible independent build and compare Master/Wallet code and StateInit hashes; obtain independent security review; verify Founder and destination wallet control; complete live fee/reserve review. Only then prepare the unsigned Mainnet deployment package for Founder review.

**No wallet was connected, no TON was spent, and no deployment, mint, or transfer was performed.**


## Action #81 — Refresh the deployment runbook with current evidence (2026-11-24)

**Status:** Documentation updated; Mainnet remains HOLD / NO-GO.

- Updated `contracts/jetton/DEPLOYMENT_RUNBOOK.md` to replace stale CI run #491 as the current status with exact-current-main Jetton workflow #506, exact-head Mining #481, and Backend #390 evidence.
- Recorded the successful Tact build, dependency audit, Sandbox tests, metadata generation, read-only Pages endpoint verification, and matching GitHub artifact SHA-256 digests.
- Explicitly recorded that the independent local clean-room dependency install timed out before compilation, so independent rebuild/hash reproduction remains pending.
- Reaffirmed that no Master deployment, Founder receipt, or allocation transfer has been performed or independently verified; Mainnet authorization remains false.
- No contract, supply, allocation, wallet address, or on-chain state changed.

**Next:** Independent clean-room build and security review, wallet-control confirmation, and live fee/reserve review before any deployment payload is presented for Founder approval.

**No authorization is implied by this documentation update.**
