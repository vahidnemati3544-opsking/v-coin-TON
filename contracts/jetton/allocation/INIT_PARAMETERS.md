# VCOIN Jetton Master initialization parameters

This document defines the exact argument order for the VCoinMaster StateInit. It prevents the approved five wallet destinations from being assigned to the wrong allocation roles during deployment.

## Constructor signature

The current contract constructor is:

```text
VCoinMaster(
  owner,
  content,
  miningReserveWallet,
  treasuryWallet,
  liquidityWallet,
  ecosystemWallet
)
```

## Canonical source mapping

| Constructor argument | Allocation role | Canonical source |
|---|---|---|
| owner | Founder — 20% / 2,000,000,000 VCOIN | docs/WALLET_ALLOCATION_REGISTER.md, Founder row |
| content | Jetton metadata cell | Approved token metadata package; not a wallet address |
| miningReserveWallet | Mining reserve — 50% / 5,000,000,000 VCOIN | docs/WALLET_ALLOCATION_REGISTER.md, Mining reserve and extraction row |
| treasuryWallet | Treasury — 10% / 1,000,000,000 VCOIN | docs/WALLET_ALLOCATION_REGISTER.md, Treasury row |
| liquidityWallet | Liquidity and market — 10% / 1,000,000,000 VCOIN | docs/WALLET_ALLOCATION_REGISTER.md, Liquidity and market row |
| ecosystemWallet | Ecosystem and marketing — 10% / 1,000,000,000 VCOIN | docs/WALLET_ALLOCATION_REGISTER.md, Ecosystem and marketing row |

## Mandatory pre-deployment checks

1. Read all five addresses from the canonical wallet register; do not reorder them by table row number.
2. Exclude the separate GAS & OPERATIONS wallet. It is not a VCOIN allocation destination.
3. Verify the intended network and address control without requesting or storing seed phrases.
4. Confirm the five addresses are pairwise distinct. The constructor also rejects duplicates.
5. After deployment, call get_allocation_config and compare all five returned addresses against the register.
6. Do not issue any VCOIN until the independent review and explicit Mainnet approval are complete.

## Issuance procedure

The founder/owner sends five separate VCoinMint messages, one per allocation, using the exact amount for the corresponding configured destination. Each request must attach at least 0.1 TON. A role becomes complete only after its deterministic Jetton wallet successfully receives the credit. A natural bounce rolls back only that role and permits that exact allocation to be retried. Once all five roles are credited, mintable becomes false.

## Release caveat

The founder allocation is currently directed to the founder wallet by the Master. The approved tokenomics also specifies a four-year founder vesting period; the vesting mechanism and schedule must be approved and implemented before Mainnet issuance. This document does not authorize bypassing that requirement.
