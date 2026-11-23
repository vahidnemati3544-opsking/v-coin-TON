# V COIN – TON Official Wallet Allocation Register

**Document ID:** VCT-WALLET-ALLOC-001  
**Version:** 1.1  
**Status:** Owner-designated allocation destinations; fixed-role enforcement implemented in VCoinMaster source; deployed-address verification pending  
**Network:** TON Blockchain  
**Token:** VCOIN Jetton (TEP-74)  
**Total initial supply:** 2,100,000,000 VCOIN  
**USD reference price:** 0.004 per VCOIN (modelled reference; not a market quote)  
**Decimals:** 6

## 1. Authority and scope

This is the canonical register of the five wallet addresses designated by the project owner for the five approved VCOIN allocation categories. These five addresses are the only approved allocation destinations in the current design. Do not substitute, add, or silently reassign any wallet.

This register records owner-provided addresses and intended allocations. The project owner has explicitly confirmed that the entire 2,100,000,000 VCOIN supply is to be issued and allocated across these five wallets; the Founder wallet is one of the five, not an additional sixth destination. This confirmation does not prove address ownership or control, establish a deployed Jetton balance, or evidence that any transfer has occurred.

## 2. Approved five-wallet allocation

| No. | Allocation category | TON address supplied by project owner | Share | Allocation |
|---:|---|---|---:|---:|
| 1 | Founder | `UQAdW09EvIesUXt9jzLq1T32O0351TaczwWJQLGGmw4aWrzy` | 20% | 420,000,000 VCOIN |
| 2 | Treasury | `UQBEW5bLGbq0yVDOimgl6fpZbQkdla9Wk5b0tXyx69bmBktQ` | 10% | 210,000,000 VCOIN |
| 3 | Liquidity and market | `UQA0_thi3mXZ6jFlHHBfnyjVmXayR3hsGx5PC43_fBOTzXWn` | 10% | 210,000,000 VCOIN |
| 4 | Ecosystem and marketing | `UQBQDb73DWWMGnxEr37TsqZSKNvVOC9MMwkvRmNY91LJqLsE` | 10% | 210,000,000 VCOIN |
| 5 | Mining reserve and extraction | `UQDMEIvklqeBW0Pn74sBHzOpoFGsSWDHE5NxZwfN-1KVsBD0` | 50% | 1,050,000,000 VCOIN |
| | **Total** | **Five designated addresses** | **100%** | **2,100,000,000 VCOIN** |

## 3. Founder wallet — GAS & OPERATIONS

The Founder allocation wallet is also the only GAS & OPERATIONS wallet:

`UQAdW09EvIesUXt9jzLq1T32O0351TaczwWJQLGGmw4aWrzy`

There is no separate operational-fee address and no sixth wallet. The Founder wallet is one of the five allocation destinations, receives 420,000,000 VCOIN, funds the Master TON reserve, and is the sole deployment and issuance signer. Do not configure or use another address for GAS & OPERATIONS.

The Founder must verify this same address in Tonkeeper on the intended TON network before any funding or signature. Never request or store seed phrases, private keys, PINs, or recovery codes. The Founder wallet's TON balance is used for deployment and network fees; the VCOIN allocation remains the Founder’s 420,000,000 VCOIN share.

## 4. Allocation wallet rules

- Each allocation category must remain associated with its designated address.
- The mining reserve address is the destination designated for the 1,050,000,000 VCOIN mining allocation.
- The five allocations must not be consolidated into a single wallet by default.
- The Founder allocation address is also the sole GAS & OPERATIONS address; it is not a separate or sixth wallet.
- Any Gram Wallet address is likewise outside this five-address allocation map unless the project owner explicitly approves a change.
- Do not infer wallet ownership from a pasted address. Before signing or sending, verify each address on the intended TON network and complete an appropriate wallet-control/signature check where required.

## 5. Contract initialization mapping

The VCoinMaster constructor reads the five allocation addresses in this role order: founder as owner; mining reserve; treasury; liquidity and market; ecosystem and marketing. The final `gasOperatorWallet` constructor argument must repeat the exact Founder address (same as `owner`). Do not pass the register's table order directly as positional constructor arguments. The exact constructor argument order and pre-deployment checks are documented in contracts/jetton/allocation/INIT_PARAMETERS.md. There is no separate GAS wallet.

## 6. Required pre-transfer verification

Before any real VCOIN issuance or transfer:

1. Confirm TON Mainnet in Tonkeeper and in every transaction preview. Testnet deployment and Testnet transactions are not authorized; never mix network addresses or balances.
2. Validate each address format and network representation.
3. Founder reviews the five owner-provided TON addresses in the final constructor preview; the deterministic Jetton wallet addresses are derived from the Master and checked against the manifest. Never request seed phrases or private keys.
4. Confirm the deployed VCOIN Jetton master address and derive the correct Jetton wallet for each owner address using the master contract.
5. Verify the total supply, six decimals, allocation caps and one-time Founder allocation.
6. Perform the full five-allocation rehearsal in local TON Sandbox and reconcile all simulated balances. Do not deploy or send transactions on TON Testnet.
7. Obtain the project owner's explicit approval before any Mainnet issuance or transfer.
8. Before depositing TON for deployment or fees, verify the Founder allocation address in Tonkeeper and confirm the intended network.

## 7. Accounting controls

All amounts must be stored and calculated as integer base units. With six decimals:

- 420,000,000 VCOIN = 420,000,000,000,000 base units.
- 210,000,000 VCOIN = 210,000,000,000,000 base units.
- 1,050,000,000 VCOIN = 1,050,000,000,000,000 base units.
- Total 2,100,000,000 VCOIN = 2,100,000,000,000,000 base units.

Allocation accounting must be capped at the approved amount for each category. A database record or backend balance is not proof of an on-chain transfer.

## 8. Change control

Any replacement, addition, removal or reassignment of an allocation address requires explicit project-owner approval and a new version of this register. Update all dependent deployment templates and allocation documentation in the same controlled change.

**Current status:** Exactly five VCOIN allocation addresses are recorded; the Founder address also serves GAS & OPERATIONS. Ownership verification, Jetton wallet derivation, contract deployment, initial issuance and transfers are not confirmed by this document.