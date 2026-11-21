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
  ecosystemWallet,
  gasOperatorWallet
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
| gasOperatorWallet | GAS & OPERATIONS — TON fee funding only; not a VCOIN allocation | docs/WALLET_ALLOCATION_REGISTER.md, Separate operational network-fee wallet section |

## Mandatory pre-deployment checks

1. Read all five addresses from the canonical wallet register; do not reorder them by table row number.
2. Exclude the separate GAS & OPERATIONS wallet. It is not a VCOIN allocation destination.
3. Verify the intended network and address control without requesting or storing seed phrases.
4. Confirm the five addresses are pairwise distinct. The constructor also rejects duplicates.
5. Confirm gasOperatorWallet is the separate GAS & OPERATIONS address and is distinct from all five allocation addresses.
6. After deployment, call get_allocation_config and get_gas_operator_wallet; compare all returned addresses against the register.
7. Do not issue any VCOIN until the independent review and explicit Mainnet approval are complete.

## Issuance procedure

First, the separate GAS & OPERATIONS wallet sends a VCoinFund message with at least 0.75 TON to seed the Master contract's gas reserve. This wallet is not authorized to issue VCOIN. The founder/owner then sends five separate VCoinMint messages, one per allocation, using the exact amount for the corresponding configured destination and attaching at least 0.01 TON per request. The Master pays 0.1 TON from its reserved balance for each deterministic Jetton wallet credit. A role becomes complete only after its Jetton wallet successfully receives the credit. A natural bounce rolls back only that role and permits that exact allocation to be retried. Once all five roles are credited, mintable becomes false.

## Release caveat

The founder allocation is directed to the founder's Jetton wallet as one exact 2,000,000,000 VCOIN issuance. The project owner has explicitly approved the founder's right to withdraw or transfer the full amount at once. No founder vesting contract, time lock, or installment schedule is required. This does not waive independent contract review, Testnet rehearsal, or explicit Mainnet authorization.
