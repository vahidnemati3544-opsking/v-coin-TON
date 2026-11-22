# VCOIN Jetton Master initialization parameters

This document defines the exact argument order for the VCoinMaster StateInit and the five approved VCOIN allocation destinations.

## Constructor signature

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

| Constructor argument | Role | Canonical source |
|---|---|---|
| owner | Founder — 20% / 420,000,000 VCOIN; also the sole GAS & OPERATIONS wallet | docs/WALLET_ALLOCATION_REGISTER.md, Founder row |
| content | Jetton metadata cell | Approved token metadata package |
| miningReserveWallet | Mining reserve — 50% / 1,050,000,000 VCOIN | Wallet register, Mining reserve row |
| treasuryWallet | Treasury — 10% / 210,000,000 VCOIN | Wallet register, Treasury row |
| liquidityWallet | Liquidity and market — 10% / 210,000,000 VCOIN | Wallet register, Liquidity row |
| ecosystemWallet | Ecosystem and marketing — 10% / 210,000,000 VCOIN | Wallet register, Ecosystem row |
| gasOperatorWallet | Must be exactly the same address as owner; no separate GAS address exists | Same Founder address as owner |

## Mandatory pre-deployment checks

1. Read the five allocation addresses from the canonical wallet register.
2. Set owner and gasOperatorWallet to the exact same Founder address.
3. Do not configure, derive, fund, or use a sixth operational wallet.
4. Confirm the five allocation addresses are pairwise distinct.
5. Confirm the intended TON network and address control without requesting or storing seed phrases.
6. Confirm get_allocation_config and get_gas_operator_wallet both report the Founder address in their respective roles.
7. Do not issue VCOIN until independent qualified review, clean-room rebuild, live fee/reserve review, local Sandbox tests, and explicit Founder approval are complete. No Testnet deployment or transaction is authorized.

## Issuance procedure

The Founder wallet, serving as both owner and GAS & OPERATIONS, funds the Master reserve with a VCoinFund message carrying at least 0.75 TON. The same Founder wallet signs the five separate VCoinMint requests, one per allocation, with the exact configured amount and at least 0.01 TON attached per request. The Master pays the destination-wallet credit costs from its reserve. A natural bounce rolls back only the affected role and permits that exact allocation to be retried. Once all five roles are credited, mintable becomes false.

## Founder allocation

The Founder receives exactly 420,000,000 VCOIN as one allocation. This release design has no vesting contract or time lock. This does not waive independent contract review, clean-room rebuild, local Sandbox tests, live fee/reserve review, or explicit Mainnet authorization. Testnet deployment and transactions are not authorized.
