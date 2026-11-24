# V COIN — TON Deployment and release runbook

**Current disposition: HOLD / NO-GO.** This runbook records the five-stage design and required checks; it is not deployment authorization.

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

## 4. Required verification before any Mainnet operation
1. Confirm exact source commit, dependency lockfile, Tact compiler version, and clean-room build.
2. Pass strict dependency audit and all local TON Sandbox tests, including acknowledgement retry, natural bounce/retry, transfer, burn, and reserve controls.
3. Independently reproduce metadata content-cell hash, code-cell hashes, Master StateInit hash, and all five deterministic Jetton-wallet derivations.
4. Verify Founder wallet control and all four destination owner addresses; after deployment, compare each derived Jetton wallet against the deployed Master getter.
5. Review actual TON fees, attached values, reserve sufficiency, bounce behavior, and nonrecoverable TON in the Master.
6. Review trusted finalized-event indexing and PostgreSQL reconciliation; never infer finality from a wallet UI alone.
7. Complete the documented internal security review and resolve all findings.
8. Present each exact transaction payload and expected state changes to the Founder for separate explicit approval.

## 5. Signing and deployment boundary
- `deployment_authorized=false` and `mainnet_authorized=false` remain in the deployment template.
- The Mainnet transaction planner is deliberately disabled; CI must never sign or broadcast.
- Deployment, reserve funding, each of the five receipt stages, and each of the four later allocation transfers are separate operations.
- Do not deploy or sign until all release gates pass and the Founder approves the exact operation.
- Never request or store a seed phrase, private key, PIN, or recovery phrase.

## 6. Testnet policy
TON Testnet is not an authorized deployment, rehearsal, receipt, or transaction environment for the current project direction. Historical Testnet files and addresses are retained only as quarantined reference material and must not be used for current operations. Local TON Sandbox is the permitted simulation environment. No Testnet wallet signing or broadcast is authorized.

## 7. Current release status
- Five-stage contract and backend source: merged to main; exact-head CI run #491 completed successfully.
- Mainnet deployment and token issuance: not performed.
- Mainnet allocation transfers: not performed.
- Testnet public execution: not authorized and not performed.
- Public mining and real-value payouts: disabled pending wallet-proof, verified Mainnet balance, payout, finality, and reconciliation implementation.
- Mainnet readiness: **HOLD / NO-GO**.
