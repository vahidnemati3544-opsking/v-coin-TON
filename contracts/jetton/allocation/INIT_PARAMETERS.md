# VCOIN Jetton initialization and release parameters

**Status:** Five-stage Founder-first policy. Mainnet deployment and transfers remain HOLD / NO-GO until the release checklist passes.

## Canonical contract constructor

The active `VCoinMaster` constructor is defined by `contracts/jetton/src/vcoin.tact` and currently accepts:

```text
VCoinMaster(owner, content)
```

Do not use the superseded seven-argument constructor described in earlier revisions. The Founder Mainnet address is the owner and sole GAS & OPERATIONS wallet:

`UQBh9jVKAypc4TrbFx2jsVB2EI1ONChg22zDputisQjENQOT`

The former address `UQAdW09EvIesUXt9jzLq1T32O0351TaczwWJQLGGmw4aWrzy` is Testnet-only historical data and must never be used on Mainnet.

## Fixed supply and five receipt stages

- Token: VCOIN Jetton (TEP-74)
- Network: TON Mainnet for eventual release; local TON Sandbox for tests
- Decimals: 6
- Maximum supply: 2,100,000,000 VCOIN = 2,100,000,000,000,000 base units
- No additional minting after Stage 5 acknowledgement

| Stage | VCOIN | Base units |
|---:|---:|---:|
| 1 | 420,000,000 | 420,000,000,000,000 |
| 2 | 1,050,000,000 | 1,050,000,000,000,000 |
| 3 | 210,000,000 | 210,000,000,000,000 |
| 4 | 210,000,000 | 210,000,000,000,000 |
| 5 | 210,000,000 | 210,000,000,000,000 |

Each stage requires a fresh Founder signature. A subsequent stage may be requested only after the previous Founder Jetton-wallet credit has been acknowledged and reconciled. A bounced stage may be retried only after its rollback is confirmed, at the same sequence and amount.

## Four Founder-signed allocation transfers after receipt

After all five receipts are finalized and reconciled, the Founder retains 420,000,000 VCOIN and personally signs four standard TEP-74 transfers:

| Role | Destination address | VCOIN |
|---|---|---:|
| Mining reserve | `UQDMEIvklqeBW0Pn74sBHzOpoFGsSWDHE5NxZwfN-1KVsBD0` | 1,050,000,000 |
| Treasury | `UQBEW5bLGbq0yVDOimgl6fpZbQkdla9Wk5b0tXyx69bmBktQ` | 210,000,000 |
| Liquidity and market | `UQA0_thi3mXZ6jFlHHBfnyjVmXayR3hsGx5PC43_fBOTzXWn` | 210,000,000 |
| Ecosystem and marketing | `UQBQDb73DWWMGnxEr37TsqZSKNvVOC9MMwkvRmNY91LJqLsE` | 210,000,000 |

The generic TEP-74 wallet implementation does not hard-code these four recipient restrictions. The allocation transfer planner must therefore enforce exact destination allowlisting, exact amounts, uniqueness, and total-balance sufficiency before producing a human-reviewable unsigned plan. This is planner-side validation, not an on-chain restriction. The Founder must independently inspect and sign each transaction in Tonkeeper. No backend or CI process may sign or broadcast.

## Mandatory release gates

1. Build the exact contract source and preserve build artifacts/hashes.
2. Pass all local TON Sandbox tests, including five-stage issuance, acknowledgement retry, natural bounce/retry, and all four allocations.
3. Pass allocation-planner tests for correct destinations and amounts, and rejection of unknown, duplicate, missing, or altered transfers.
4. Independently verify the Mainnet Jetton Master, Founder Jetton wallet, all four recipient Jetton wallets, network, token balance, and transaction previews.
5. Check live Gram fee requirements and retain an adequate operational reserve; 2 Gram is not assumed sufficient.
6. Reconcile on-chain transaction hashes and finality before recording any transfer as complete.
7. Obtain the Founder's explicit approval for each real transaction.

No document, test, PR, or generated unsigned plan is itself authorization to deploy, issue, or transfer. Never request or share recovery phrases, private keys, PINs, or wallet backup codes.
