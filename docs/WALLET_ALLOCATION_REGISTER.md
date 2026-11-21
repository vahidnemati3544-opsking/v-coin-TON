# V COIN – TON Official Wallet Allocation Register

**Document ID:** VCT-WALLET-ALLOC-001  
**Version:** 1.1  
**Status:** Owner-designated allocation destinations; fixed-role enforcement implemented in VCoinMaster source; deployed-address verification pending  
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

The separate fee wallet address is owner-provided; control and network format must be verified before funding. Never request or store its seed phrase or private key. In the current VCoinMaster design, this address is the immutable gasOperatorWallet and may fund the Master reserve only through VCoinFund (minimum 0.75 TON). It is not authorized to issue VCOIN and is not a token-allocation destination. The founder wallet remains the sole VCoinMint authority; each owner-signed issuance request carries at least 0.01 TON while the Master pays 0.1 TON per destination-wallet credit from the reserve.

## 4. Wallet separation rules

- Each allocation category must remain associated with its designated address.
- The mining reserve address is the destination designated for the 5,000,000,000 VCOIN mining allocation.
- The five allocations must not be consolidated into a single wallet by default.
- The Tonkeeper GAS & OPERATIONS address above is a separate fee-funding wallet, not an allocation destination.
- Any Gram Wallet address is likewise outside this five-address allocation map unless the project owner explicitly approves a change.
- Do not infer wallet ownership from a pasted address. Before signing or sending, verify each address on the intended TON network and complete an appropriate wallet-control/signature check where required.

## 5. Contract initialization mapping

The VCoinMaster constructor reads these addresses in the following role order: founder as owner; mining reserve; treasury; liquidity and market; ecosystem and marketing. Do not pass the register's table order directly as positional constructor arguments. The exact constructor argument order and pre-deployment checks are documented in contracts/jetton/allocation/INIT_PARAMETERS.md. The separate GAS & OPERATIONS wallet is excluded.

## 6. Required pre-transfer verification

Before any real VCOIN issuance or transfer:

1. Confirm the intended network (Testnet or Mainnet) and never mix their addresses or balances.
2. Validate each address format and network representation.
3. Independently verify control/authorization for each destination using a safe wallet-signature or confirmation procedure; never request seed phrases or private keys.
4. Confirm the deployed VCOIN Jetton master address and derive the correct Jetton wallet for each owner address using the master contract.
5. Verify the total supply, six decimals, allocation caps and founder vesting design.
6. Perform a Testnet rehearsal and reconcile each transaction on-chain.
7. Obtain the project owner's explicit approval before any Mainnet issuance or transfer.
8. Before depositing TON into the fee wallet, verify its address in Tonkeeper and confirm the intended network.

## 7. Accounting controls

All amounts must be stored and calculated as integer base units. With six decimals:

- 2,000,000,000 VCOIN = 2,000,000,000,000,000 base units.
- 1,000,000,000 VCOIN = 1,000,000,000,000,000 base units.
- 5,000,000,000 VCOIN = 5,000,000,000,000,000 base units.
- Total 10,000,000,000 VCOIN = 10,000,000,000,000,000 base units.

Allocation accounting must be capped at the approved amount for each category. A database record or backend balance is not proof of an on-chain transfer.

## 8. Change control

Any replacement, addition, removal or reassignment of an allocation address requires explicit project-owner approval and a new version of this register. Update all dependent deployment templates and allocation documentation in the same controlled change.

**Current status:** Five VCOIN allocation addresses and one separate TON operational-fee address are recorded. Ownership verification, Jetton wallet derivation, contract deployment, initial issuance and transfers are not confirmed by this document.