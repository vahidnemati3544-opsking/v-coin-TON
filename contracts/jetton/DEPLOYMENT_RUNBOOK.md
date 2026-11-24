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
- The Founder reports that operational TON has been funded; the deposit amount and resulting balance have not been independently verified on-chain in this review.
- Public mining and real-value payouts remain disabled pending production TON Connect proof, trusted finalized Mainnet balance snapshots, payout sender, and finalized reconciliation.
- Mainnet readiness: **HOLD / NO-GO**. No deployment, reserve funding, receipt, allocation transfer, signing, or broadcast is authorized by this document.

