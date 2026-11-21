# V COIN – TON Official Wallet Allocation Register

**Document ID:** VCT-WALLET-ALLOC-001  
**Version:** 1.1  
**Status:** Owner-designated allocation destinations; on-chain verification pending  
**Network:** TON Blockchain  
**Token:** VCOIN Jetton (TEP-74)  
**Total initial supply:** 10,000,000,000 VCOIN  
**Decimals:** 6

## 1. Authority and scope

This is the canonical register of the five wallet addresses designated by the project owner for the five approved VCOIN allocation categories. These five addresses are the only approved allocation destinations in the current design. Do not substitute, add, or silently reassign any wallet.

This register records owner-provided addresses and intended allocations. It does not prove address ownership or control, establish a deployed Jetton balance, or evidence that any transfer has occurred.

## 2. Approved five-wallet allocation

| No. | Allocation category | TON address supplied by project owner | Share | Allocation |
|---:|---|---|---:|---:|
| 1 | Founder | `UQAdW09EvIesUXt9jzLq1T32O0351TaczwWJQLGGmw4aWrzy` | 20% | 2,000,000,000 VCOIN |
| 2 | Treasury | `UQBEW5bLGbq0yVDOimgl6fpZbQkdla9Wk5b0tXyx69bmBktQ` | 10% | 1,000,000,000 VCOIN |
| 3 | Liquidity and market | `UQA0_thi3mXZ6jFlHHBfnyjVmXayR3hsGx5PC43_fBOTzXWn` | 10% | 1,000,000,000 VCOIN |
| 4 | Ecosystem and marketing | `UQBQDb73DWWMGnxEr37TsqZSKNvVOC9MMwkvRmNY91LJqLsE` | 10% | 1,000,000,000 VCOIN |
| 5 | Mining reserve and extraction | `UQDMEIvklqeBW0Pn74sBHzOpoFGsSWDHE5NxZwfN-1KVsBD0` | 50% | 5,000,000,000 VCOIN |
| | **Total** | **Five designated addresses** | **100%** | **10,000,000,000 VCOIN** |

## 3. Separate operational network-fee wallet

The project owner explicitly designated the following separate Tonkeeper address as the **V COIN – TON GAS & OPERATIONS wallet**:

`UQCOZYJNI3HC6PN1YCy1cP-ikKPygoVUQlX2SIcJ_zEWJeGB`

**Owner instruction:** The owner will deposit TON into this Tonkeeper wallet only for TON network fees and related authorized operational transaction costs. This wallet is not a VCOIN allocation wallet and is not a sixth allocation destination. It must not receive or hold any portion of the 10,000,000,000 VCOIN allocation by virtue of this designation.

The five allocation addresses remain unchanged. Do not ask the owner to fund all five allocation wallets with TON merely because they are VCOIN recipients. The operational fee wallet is the designated TON funding source. If a specific Jetton transfer or contract operation technically requires TON in another signing wallet, document the exact requirement and obtain the owner's approval before any top-up. Do not assume that a separate fee wallet can sponsor every transaction type without a supported transaction flow.

The separate fee wallet address is owner-provided; control and network format must be verified before funding. Never request or store its seed phrase or private key.

## 4. Wallet separation rules

- Each allocation category must remain associated with its designated address.
- The mining reserve address is the destination designated for the 5,000,000,000 VCOIN mining allocation.
- The five allocations must not be consolidated into a single wallet by default.
- The Tonkeeper GAS & OPERATIONS address above is a separate fee-funding wallet, not an allocation destination.
- Any Gram Wallet address is likewise outside this five-address allocation map unless the project owner explicitly approves a change.
- Do not infer wallet ownership from a pasted address. Before signing or sending, verify each address on the intended TON network and complete an appropriate wallet-control/signature check where required.

## 5. Required pre-transfer verification

Before any real VCOIN issuance or transfer:

1. Confirm the intended network (Testnet or Mainnet) and never mix their addresses or balances.
2. Validate each address format and network representation.
3. Independently verify control/authorization for each destination using a safe wallet-signature or confirmation procedure; never request seed phrases or private keys.
4. Confirm the deployed VCOIN Jetton master address and derive the correct Jetton wallet for each owner address using the master contract.
5. Verify the total supply, six decimals, allocation caps and founder vesting design.
6. Perform a Testnet rehearsal and reconcile each transaction on-chain.
7. Obtain the project owner's explicit approval before any Mainnet issuance or transfer.
8. Before depositing TON into the fee wallet, verify its address in Tonkeeper and confirm the intended network.

## 6. Accounting controls

All amounts must be stored and calculated as integer base units. With six decimals:

- 2,000,000,000 VCOIN = 2,000,000,000,000,000 base units.
- 1,000,000,000 VCOIN = 1,000,000,000,000,000 base units.
- 5,000,000,000 VCOIN = 5,000,000,000,000,000 base units.
- Total 10,000,000,000 VCOIN = 10,000,000,000,000,000 base units.

Allocation accounting must be capped at the approved amount for each category. A database record or backend balance is not proof of an on-chain transfer.

## 7. Change control

Any replacement, addition, removal or reassignment of an allocation address requires explicit project-owner approval and a new version of this register. Update all dependent deployment templates and allocation documentation in the same controlled change.

**Current status:** Five VCOIN allocation addresses and one separate TON operational-fee address are recorded. Ownership verification, Jetton wallet derivation, contract deployment, initial issuance and transfers are not confirmed by this document.

## Binding governance addendum — 2026-11-21

This document is governed by [FOUNDER_EXCLUSIVE_FIVE_WALLET_CONTROL.md](FOUNDER_EXCLUSIVE_FIVE_WALLET_CONTROL.md): **the Founder alone has absolute, exclusive operational control and signing authority over all five V COIN–TON allocation wallets** (Founder, Mining Reserve, Treasury, Liquidity/Market, and Ecosystem/Marketing). Their separation is for accounting only; none is an independent custodian. No employee, administrator, backend, Telegram bot, CI process, third party, multisig co-signer, escrow, vesting, time lock, withdrawal ceiling, or automated process may authorize, veto, delay, redirect, sign, or execute a Founder-authorized movement.

**TON implementation boundary:** each TEP-74 Jetton Wallet authorizes transfers through its own `owner` address. Master ownership alone does not confer a clawback or withdrawal right over other Jetton Wallets. The approved implementation therefore depends on the Founder being the sole holder of signing authority for each of the five recorded owner-wallet addresses; transfers are signed locally by the Founder. The Master must not add hidden seizure or forced-transfer functionality. Backend/Telegram systems may read, account, reconcile, and prepare unsigned proposals only. Never request or store wallet secrets. Evidence of address control is tracked separately and must not be described as completed until checked. This addendum does not authorize deployment, minting, transfer, signing, or broadcast.
