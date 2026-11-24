# ACTION #89 — First confirmed TON Mainnet state findings (2026-11-24)

**Status:** Read-only Mainnet RPC returned valid account and Jetton data. Exact-head CI is running against this change set. No transaction was created, signed, or broadcast.

- Founder GAS wallet `UQBh9jVKAypc4TrbFx2jsVB2EI1ONChg22zDputisQjENQOT` is active and had **5.487534819 TON** at the observed block (masterchain seqno 107530882).
- The Founder GAS wallet is active with 5.487534819 TON at the observed block; this is the verified live balance, not an exact transaction fee quote.
- Previously Tonkeeper-reported Master `EQBn4hW8bKhFTSz9riY5q3Pr3SfJmv2VYKZQl_NWMbK--5fP` is **active** with **0.540643302 TON**, indexed as `jetton_master`, total supply `2100000000000000` base units (**2,100,000,000 VCOIN**), and `mintable=false`.
- The same Mainnet query reports its admin as `EQAdW09EvIesUXt9jzLq1T32O0351TaczwWJQLGGmw4aWuE3`, not the current Founder wallet. This has the same raw workchain/account ID as the previously labeled `UQAdW09EvIesUXt9jzLq1T32O0351TaczwWJQLGGmw4aWrzy`. **Correction:** `UQ...` is the non-bounceable Mainnet representation, not a Testnet-only prefix; Testnet-only user-friendly prefixes are `kQ...` and `0Q...`. The historical record that classified this address as Testnet must be treated as incorrect. This does not prove who controls the wallet; Founder must verify control through Tonkeeper / a safe wallet challenge.
- The observed Master code hash is `5087c882019324e9d8e309c78f42e3bcee9433a54d7d0367d49320a7bbabcc36`, which does **not** match the current exact-build code hash `e08c11238070eeaffbbe783077eb49f61ad770a71f2e3096f83956776ed28ed8`.
- The exact-build candidate `EQC_gSnjZTc2Kufgl5ltFF-b2zr5_j4diozxC-IvEp9zzVaL` is `uninitialized` with zero TON. It is not the active Master reported by Tonkeeper.
- The active Master metadata URI matches the project's pinned metadata URL, but metadata/name/logo and a full supply alone do not prove that its code, admin, staged receipt history, or Founder wallet balance meet the current approved release design.
- Action #89 read-only getter report: `get_gas_operator_wallet` returns the legacy admin `EQAdW09EvIesUXt9jzLq1T32O0351TaczwWJQLGGmw4aWuE3`; the active Master does not implement `get_receipt_status` (exit code 11 / method ID 85110). Its `get_wallet_address(current Founder)` returns `EQAuxau8FXYX_lCIBvxzFg6c8jVjqfqvaRszrcrofh5BVMFv`, which is uninitialized, has zero TON, and has no transaction history. The legacy admin's Master-derived Jetton Wallet `EQCOzLnnSrR-mbM_AeiKU2wpMJ28cPoRncBuQHJ-6_q-Mn0T` is active and its `get_wallet_data` reports **420,000,000 VCOIN** (`420000000000000` base units). This confirms the current Founder wallet has not received the five requested receipt credits under the active Master. Action #90 extends the same read-only check across all five registered allocation wallets to reconcile where the full 2.1B supply currently sits.

- Action #90 all-five-wallet reconciliation (TON Center Mainnet, read-only): the active Master-derived Jetton Wallet balances are Founder (current registered UQBh…): **0 / uninitialized**; Treasury: **210,000,000**; Liquidity/Market: **210,000,000**; Ecosystem/Marketing: **210,000,000**; Mining Reserve: **1,050,000,000**. The five registered-wallet sum is **1,680,000,000 VCOIN** because the current Founder wallet is empty. Separately, the legacy Master-admin wallet holds **420,000,000 VCOIN**. Combined, the five allocation balances plus legacy admin balance equal exactly **2,100,000,000 VCOIN**, matching Master total supply.
- Exact-head workflow #45436098986 on commit `2369d75aba103c1efcdbf5ca9cf6e9f76b5d12f0` passed `build-and-test` and fresh-runner `hash-reproduction`; Pages issuer deployment was skipped on the review branch. Release artifact SHA-256 `7d63097ac3559906d727d0a5c16d0b22bdfe17c43f4d5e44ebed6a3e6310f588`; full-source artifact SHA-256 `ef17a041e9433e5524ffb07a2ba10b364e67d95e0f3f462d77ee4b83a00917c1`; clean-room report SHA-256 `a8b765c79c67f672d4e48ab3bc2163d0ad42e4b5cb0505852820227f06c245d3`.
- This proves the active Master is already distributed in the old five-wallet allocation pattern: 420M remains at the legacy admin/Founder address and the other four allocation wallets hold their exact target amounts. It does **not** prove the requested five-stage receipt into the current Founder wallet; that wallet has no VCOIN transactions or initialized Jetton wallet.
- Historical source review at the matching Action #54 release commit shows the old Master stores `owner` as an immutable constructor field and has no `change_admin` message/receiver. Its `get_gas_operator_wallet` getter returns that same owner. The existing Master therefore has no supported on-chain admin-transfer path to the current Founder wallet. Its `VCoinFund` receiver is also restricted to that same legacy owner/admin. The current Founder GAS wallet's 5.487 TON is in a separate account and cannot fund or operate the old Master unless the legacy admin address is controlled and signs the operation.
- Action #91 queried the legacy Master `get_allocation_status` getter: all five returned flags are true (`founder_issued`, `mining_reserve_issued`, `treasury_issued`, `liquidity_issued`, `ecosystem_issued`). This confirms the old five-allocation issuance is complete. `get_allocation_config` returns five address cells; Action #92 decodes them for exact register comparison.
- Exact-head workflow #45436702230 on commit `b9928b0e9a40400ebf01d587569152484ae67df2` passed `build-and-test` and fresh-runner `hash-reproduction`; Pages issuer job skipped on the review branch. Release artifact SHA-256 `a9063799ea71b03682e40e54f5eeee201bb5b866f629c1ce98a710636994396d`; full-source SHA-256 `628c6607ac72089cfbeadfa83ebe18ae56f0bc1ee4163efdd9d7bbcef650730c`; clean-room report SHA-256 `4d8d6c5ae87ef422bb990455980c1ff3820c2f6bd76385cedf2884d34e7533ab`.
- Do not consolidate or redistribute these balances merely to imitate the new five-stage receipt process. Any migration to the current Founder wallet would require a separate approved migration plan, proof of control of every source wallet, exact transaction-by-transaction fee/payload review, and a fresh Founder signature for each transfer.
- **No new Master deployment is authorized or advisable** until the active Master identity, admin control, Founder Jetton balance and receipt-stage state are reconciled. The current exact-build candidate must not be deployed merely because the template has `master_address=null`.

## Action #89 release decision

Mainnet network access and a funded Founder GAS wallet are confirmed by read-only chain data. The active VCOIN Jetton Master is also confirmed, but it is not the exact current contract build and its admin differs from the current Founder wallet. Mainnet therefore remains **HOLD / NO-GO for any new deployment, minting or transfers** pending Founder wallet control proof and verification of the active Master / Founder Jetton Wallet state. The reported 2.1B supply and `mintable=false` are observed facts, not proof of the requested five-stage receipt sequence.

---

# V COIN — TON Deployment and release runbook

**Current disposition: HOLD / NO-GO.** This runbook records the approved five-stage design and release checks; it is not deployment authorization.

## 1. Fixed economic and technical parameters
- Network: TON Mainnet only (TEP-74 Jetton; TEP-64 metadata).
- Fixed supply: 2,100,000,000 VCOIN.
- Decimals: 6.
- Hard cap: 2,100,000,000,000,000 base units.
- Founder Mainnet wallet: UQBh9jVKAypc4TrbFx2jsVB2EI1ONChg22zDputisQjENQOT.
- Founder is the only initial receipt recipient and sole signer for the five receipts and four later allocation transfers.

## 2. Five exact Founder-first receipt stages
| Stage | VCOIN | Base units |
|---:|---:|---:|
| 1 | 420,000,000 | 420000000000000 |
| 2 | 1,050,000,000 | 1050000000000000 |
| 3 | 210,000,000 | 210000000000000 |
| 4 | 210,000,000 | 210000000000000 |
| 5 | 210,000,000 | 210000000000000 |
| **Total** | **2,100,000,000** | **2100000000000000** |

Every stage is a separate Founder-signed request to the same Founder Jetton wallet. It must match the exact next sequence number and amount, and must wait for independent confirmation of the preceding wallet credit and Master acknowledgement. A natural bounce permits retry of that same stage only. After Stage 5 acknowledgement, the Master permanently sets `mintable=false`.

## 3. Final allocation after full receipt
The Founder retains 420,000,000 VCOIN and personally signs four ordinary TEP-74 transfers:
- Mining Reserve: 1,050,000,000 VCOIN.
- Treasury: 210,000,000 VCOIN.
- Liquidity / Market: 210,000,000 VCOIN.
- Ecosystem / Marketing: 210,000,000 VCOIN.

These transfers move already-issued tokens and do not create additional supply.

**Important enforcement boundary:** the current Founder Jetton Wallet contract authorizes ordinary `TokenTransfer` messages from the wallet owner and checks balance and TON fee sufficiency; it does **not** enforce an on-chain Stage-5 transfer lock. Therefore, “no allocation before all five receipts” is a mandatory Founder operating procedure, not a contract-level invariant in this release. Before each allocation transfer, independently read the deployed Master and confirm `stage_5_confirmed=true`, `next_receipt_stage=6`, `receipt_pending=false`, `mintable=false`, and `total_supply=2100000000000000`; also confirm the Founder Jetton Wallet balance and destination owner address. If any check differs, do not transfer. Any future on-chain transfer-lock change would be a new contract release requiring a new build, tests, address derivation and review.

## 4. Required verification before any Mainnet operation
1. Confirm the exact source commit, dependency lockfile, pinned Tact compiler version, and clean-room rebuild.
2. Pass the strict dependency audit and all local TON Sandbox tests, including acknowledgement retry, natural bounce/retry, transfer bounce, burn success/rejection, and reserve controls.
3. Reproduce the metadata content-cell hash, code-cell hashes, Master StateInit hash, and all five deterministic Jetton Wallet derivations from the exact release source.
4. Prove Founder wallet control through a safe wallet challenge/signature and have the Founder explicitly confirm all four destination owner addresses. Never request or store a seed phrase, private key, PIN, or recovery phrase.
5. Review current Mainnet configuration, exact deployment-message fees, attached values, Master reserve sufficiency, bounce/recovery behavior, and nonrecoverable TON. A rough TON budget is not an exact fee estimate.
6. Review trusted finalized-event indexing and PostgreSQL reconciliation; never infer finality from a wallet UI alone.
7. Complete the documented internal source/security review and resolve all findings. A separate third-party audit is not a current project release condition; internal review and engineering controls must not be described as an external audit.
8. Produce and independently inspect the exact unsigned deployment payload, including network, owner, immutable metadata, code/data hashes, StateInit hash, destination, attached TON and expected Master address.
9. Present each exact transaction payload and expected state changes to the Founder for separate explicit approval.

## 5. Signing and deployment boundary
- `deployment_authorized=false` and `mainnet_authorized=false` remain in the deployment template until the exact operation is approved.
- The Mainnet transaction planner is deliberately disabled; CI must never sign or broadcast.
- Deployment, Master reserve funding, each of the five receipt stages, and each of the four later allocation transfers are separate operations.
- Do not deploy or sign until all release gates pass and the Founder approves the exact operation in the wallet.
- Never request or store a seed phrase, private key, PIN, or recovery phrase.

## 6. Testnet policy
TON Testnet is not an authorized deployment, rehearsal, receipt, or transaction environment for the current project direction. Historical Testnet files and addresses are retained only as quarantined reference material and must not be used for current operations. Local TON Sandbox is the permitted simulation environment. No Testnet wallet signing or broadcast is authorized.

## 7. Current release status — Action #86 (2026-11-24)
- The exact-current-main baseline is commit `4a981a9625f7dc59b53ba52502c20f4219e92b4b`; it does not yet include PR #24.
- PR #24 remains open and Draft on branch `audit/action-83-burn-transfer-bounce-tests`; it is not merged to `main`.
- PR #24 adds the three missing Sandbox edge-case tests (burn rejection before Stage 5, burn after Stage 5 with supply reconciliation, and ordinary transfer bounce/refund), bringing the suite to 20 tests.
- Workflow #535 passed both `build-and-test` and fresh-runner `hash-reproduction`; PR workflow #539 also passed both jobs on the updated PR head. The Pages issuer deployment job was skipped on the review branch as expected. These are CI and deterministic-build results, not Mainnet deployment.
- The clean-room workflow independently rebuilt the pinned Tact toolchain and metadata, re-derived the Master StateInit and five Jetton Wallet candidates, and matched the release BOCs/JSON byte-for-byte across two isolated CI runners.
- Derived Master and Jetton Wallet addresses remain offline candidates only. They are not evidence of a deployed or verified Mainnet Master or wallet.
- Mainnet Master deployment: **not performed or independently verified**.
- Mainnet token issuance / five Founder receipts: **not performed**.
- Four Mainnet allocation transfers: **not performed**.
- Founder wallet-control proof and explicit confirmation of four destination owner addresses: **pending**.
- Exact current Mainnet fee/message emulation and reviewed unsigned deployment payload: **pending**.
- A prior Tonkeeper report (2026-11-22) identified `EQBn4hW8bKhFTSz9riY5q3Pr3SfJmv2VYKZQl_NWMbK--5fP` as a Jetton Master and showed an Active / 2.1B V COIN display; no transaction hash or independent on-chain confirmation was preserved. The current offline derivation produced a different candidate, `EQC_gSnjZTc2Kufgl5ltFF-b2zr5_j4diozxC-IvEp9zzVaL`. The template still has `master_address=null`. These facts conflict and must be reconciled against Mainnet code, storage, getters, metadata and transaction history before any deployment or issuance. Do not deploy a second Master or use either address for token transfers until verified.
- Action #87 adds a read-only Mainnet reconciliation script and CI step. It queries TON Center for the Founder wallet's current account state/balance and for both the previously reported Master and exact-build derived Master: account status, code/data hashes, and Jetton master data (supply, mintability, admin and metadata). The JSON report is saved as `build/mainnet-state-reconciliation.json`. It does not request transaction history, sign, create, or broadcast any transaction. If TON Center is unavailable or rate-limited, the report records the failure rather than claiming verification.
- The Founder reports that operational TON has been funded; the deposit amount and resulting balance have not been independently verified on-chain in this review.
- Public mining and real-value payouts remain disabled pending production TON Connect proof, trusted finalized Mainnet balance snapshots, payout sender, and finalized reconciliation.
- Mainnet readiness: **HOLD / NO-GO**. No deployment, reserve funding, receipt, allocation transfer, signing, or broadcast is authorized by this document.

