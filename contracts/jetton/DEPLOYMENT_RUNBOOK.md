# V COIN — TON Deployment and release runbook

**Current disposition: HOLD / NO-GO.** This runbook records the five-stage design and required checks; it is not deployment authorization.

## 1. Fixed economic and technical parameters
- Network: TON Mainnet (TEP-74 Jetton; TEP-64 metadata).
- Fixed supply: 2,100,000,000 VCOIN.
- Decimals: 6.
- Hard cap: 2,100,000,000,000,000 base units.
- Founder Mainnet wallet: UQBh9jVKAypc4TrbFx2jsVB2EI1ONChg22zDputisQjENQOT.
- Founder is the only initial receipt recipient, sole signer, and shared GAS & OPERATIONS wallet.

## 2. Five exact Founder-first receipt stages
| Stage | VCOIN | Base units |
|---:|---:|---:|
| 1 | 420,000,000 | 420000000000000 |
| 2 | 1,050,000,000 | 1050000000000000 |
| 3 | 210,000,000 | 210000000000000 |
| 4 | 210,000,000 | 210000000000000 |
| 5 | 210,000,000 | 210000000000000 |
| **Total** | **2,100,000,000** | **2100000000000000** |

Every stage:
- Is a separate Founder-signed VCoinMint request to the same Founder Jetton wallet.
- Must match the exact amount and the exact next sequence number.
- Is blocked while another stage is pending.
- Advances only after the deterministic Founder Jetton wallet acknowledges its credited balance.
- May be retried at the same stage after a natural bounce; confirmed prior stages remain unchanged.
- Has an idempotent acknowledgement retry path controlled by the Founder wallet owner.

After Stage 5 acknowledgement, the Master permanently sets mintable=false. No additional VCOIN can be minted.

## 3. Final allocation after full receipt
The Founder retains 420,000,000 VCOIN and personally signs four ordinary TEP-74 transfers:
- Mining Reserve: 1,050,000,000 VCOIN.
- Treasury: 210,000,000 VCOIN.
- Liquidity / Market: 210,000,000 VCOIN.
- Ecosystem / Marketing: 210,000,000 VCOIN.

These four operations transfer already-issued tokens; they do not mint additional supply.

## 4. Required verification before any Mainnet operation
1. Confirm the exact source commit, dependency lockfile, Tact compiler version, and clean-room build.
2. Pass strict dependency audit, all Sandbox tests, acknowledgement retry, natural bounce/retry, transfer, burn, and reserve tests.
3. Independently reproduce metadata content-cell hash, code-cell hashes, Master StateInit hash, and all five deterministic Jetton-wallet StateInit hashes.
4. Verify Founder wallet control and all four destination owner addresses; after deployment, compare each derived Jetton wallet against the deployed Master getter.
5. Review actual TON fees, attached values, reserve sufficiency, bounce behavior, and any nonrecoverable TON remaining in the Master.
6. Review trusted finalized-event indexing and PostgreSQL reconciliation; never infer finality from a wallet UI alone.
7. Obtain independent qualified security review and resolve all findings.
8. Present each exact transaction payload and expected state changes to the Founder for separate explicit approval.

## 5. Signing and deployment boundary
- deployment_authorized=false and mainnet_authorized=false remain in the deployment template.
- Mainnet transaction planner is deliberately disabled; CI must never generate Mainnet transaction payloads, sign, or broadcast.
- Deployment, reserve funding, each of the five receipt stages, and each of the four later allocation transfers are separate on-chain operations.
- Do not deploy or sign until all preceding gates pass and the Founder approves the exact operation.
- Never request or store a seed phrase, private key, PIN, or recovery phrase.

## 6. Testnet rehearsal
A Testnet-only rehearsal was separately authorized on 2026-11-24. It uses only the historical Founder Testnet wallet and unsigned request previews. Public Testnet signing/broadcast still requires emulator trace, fee review, and separate explicit Founder approval. Testnet approval never authorizes Mainnet.

## 7. Current release status
- Five-stage contract and backend implementation: on feat/five-stage-founder-receipt; exact-head CI pending.
- Mainnet deployment and token issuance: not performed.
- Mainnet allocation transfers: not performed.
- Testnet public execution: not performed.
- Mainnet readiness: **HOLD / NO-GO**.
