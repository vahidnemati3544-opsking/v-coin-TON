# SUPERSEDED HISTORICAL PARAMETERS — DO NOT USE FOR CURRENT MAINNET

**Current design correction (2026-11-24):** The old direct five-wallet minting model and the older two-transfer Founder receipt wording below are both superseded. The current contract is the Founder-first five-stage design implemented in `src/vcoin.tact` and `src/jetton.tact`.

## Current exact initialization parameters

- Constructor: `VCoinMaster(owner: Address, content: Cell)`.
- `owner`: Founder Mainnet wallet `UQBh9jVKAypc4TrbFx2jsVB2EI1ONChg22zDputisQjENQOT`; this is also the sole GAS & OPERATIONS wallet.
- `content`: immutable TEP-64 metadata content cell whose cell hash and BOC SHA-256 must match the approved deployment template.
- Fixed supply: 2,100,000,000 VCOIN; 6 decimals; maximum base units `2100000000000000`; no additional minting after Stage 5 acknowledgement.
- No additional constructor allocation addresses exist. All five allocation owner addresses are stored in the approved off-chain manifest and receive Jetton Wallets deterministically through the deployed Master `get_wallet_address(owner)` getter.

## Current Founder receipt sequence

| Stage | Exact VCOIN | Exact base units | Recipient |
|---:|---:|---:|---|
| 1 | 420,000,000 | 420000000000000 | Founder |
| 2 | 1,050,000,000 | 1050000000000000 | Founder |
| 3 | 210,000,000 | 210000000000000 | Founder |
| 4 | 210,000,000 | 210000000000000 | Founder |
| 5 | 210,000,000 | 210000000000000 | Founder |

Every stage is a separate Founder-authorized request. The next stage is blocked until the deterministic Founder Jetton Wallet acknowledges the previous stage. A natural bounce rolls back only the pending stage. Stage 5 acknowledgement permanently disables minting.

## Post-receipt allocation sequence

Only after all five receipt stages are independently confirmed on Mainnet does the Founder sign four separate TEP-74 transfers from the Founder Jetton Wallet:
- Mining Reserve: 1,050,000,000 VCOIN.
- Treasury: 210,000,000 VCOIN.
- Liquidity / Market: 210,000,000 VCOIN.
- Ecosystem / Marketing: 210,000,000 VCOIN.

The Founder retains 420,000,000 VCOIN. No allocation transfer is authorized by this document.

## Release safety

This file is historical reference only beyond this current-design correction. The contract source, current deployment template, allocation manifest and current deployment runbook are authoritative. Never use any legacy direct-mint preview, seven-argument constructor, old two-stage receipt, or historical Testnet instruction for Mainnet. Current Mainnet status remains HOLD / NO-GO until the exact-build release gates and separate Founder approval pass. Never request or store a seed phrase, private key, PIN, or recovery phrase.

---
---

Current policy correction (2026-11-23): Any older requirement below for an independent qualified review/audit is superseded and is not an active project task or release gate. The approved execution policy is Mainnet-only, with local Sandbox tests permitted and no Testnet deployment/transactions authorized. Founder is also the sole GAS & OPERATIONS wallet; no separate fee wallet exists. This parameter document is not authorization to deploy or issue.

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
