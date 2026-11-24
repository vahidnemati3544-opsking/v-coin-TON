# V COIN Jetton Sandbox verification

**Scope:** Five exact Founder-first receipt stages, fixed 2.1 billion supply, retryable wallet acknowledgement, stage-specific bounce recovery, Founder-controlled distribution, and reserve controls.

## Approved stages
| Stage | VCOIN | Base units |
|---:|---:|---:|
| 1 | 420,000,000 | 420000000000000 |
| 2 | 1,050,000,000 | 1050000000000000 |
| 3 | 210,000,000 | 210000000000000 |
| 4 | 210,000,000 | 210000000000000 |
| 5 | 210,000,000 | 210000000000000 |
| **Total** | **2,100,000,000** | **2100000000000000** |

## Automated coverage
1. Only the Founder can request a receipt and the only permitted recipient is the Founder Jetton wallet.
2. Each of the five exact amounts is accepted only in its matching sequence position.
3. Out-of-order, wrong-amount, zero, wrong-recipient, repeated, and over-cap requests are rejected.
4. Each wallet-credit acknowledgement advances exactly one stage; repeated acknowledgements are idempotent.
5. The Founder can retry a stored wallet acknowledgement without double issuance.
6. A natural bounce rolls back only the pending stage and preserves all earlier confirmed receipts.
7. After Stage 5 acknowledgement, total supply is exactly 2,100,000,000 VCOIN and `mintable=false`.
8. The Founder can distribute the four registered shares using ordinary TEP-74 transfers and retains 420,000,000 VCOIN.
9. Founder-only TON reserve funding and protected withdrawals are tested.

## CI acceptance
- `npm run build` compiles VCoinMaster, VCoinJettonWallet, and the test-only BounceRejector fixture.
- `npm test` runs the fixed-supply, allocation, receipt, bounce, retry, and Sandbox suites.
- CI may generate unsigned Testnet inspection artifacts only; it must never sign or broadcast a transaction.

## Release restrictions
- Testnet and Mainnet are isolated. Testnet wallet requests are unsigned previews only until separately approved after emulator and fee review.
- Mainnet deployment, receipt stages, and subsequent distributions each require separate Founder approval of exact payloads.
- The former Founder Testnet address must never be used on Mainnet.
- No Mainnet deployment or transfer is authorized until exact-head CI, independent review, StateInit/hash reproduction, wallet derivation, address control, and fee/reserve checks pass.
