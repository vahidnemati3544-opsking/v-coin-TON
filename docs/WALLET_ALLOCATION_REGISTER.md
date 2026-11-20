# V COIN – TON Official Wallet Allocation Register

**Document ID:** VCT-WALLET-ALLOC-001  
**Version:** 1.0  
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

## 3. Wallet separation rules

- Each allocation category must remain associated with its designated address.
- The mining reserve address is the destination designated for the 5,000,000,000 VCOIN mining allocation.
- The five allocations must not be consolidated into a single wallet by default.
- Tonkeeper address `UQCOZYJNI3HC6PN1YCy1cP-ikKPygoVUQlX2SIcJ_zEWJeGB` is a separate wallet and is not a sixth allocation destination.
- Any Gram Wallet address is likewise outside this five-address allocation map unless the project owner explicitly approves a change.
- Do not infer wallet ownership from a pasted address. Before signing or sending, verify each address on the intended TON network and complete an appropriate wallet-control/signature check where required.

## 4. Required pre-transfer verification

Before any real VCOIN issuance or transfer:

1. Confirm the intended network (Testnet or Mainnet) and never mix their addresses or balances.
2. Validate each address format and network representation.
3. Independently verify control/authorization for each destination using a safe wallet-signature or confirmation procedure; never request seed phrases or private keys.
4. Confirm the deployed VCOIN Jetton master address and derive the correct Jetton wallet for each owner address using the master contract.
5. Verify the total supply, six decimals, allocation caps and founder vesting design.
6. Perform a Testnet rehearsal and reconcile each transaction on-chain.
7. Obtain the project owner's explicit approval before any Mainnet issuance or transfer.

## 5. Accounting controls

All amounts must be stored and calculated as integer base units. With six decimals:

- 2,000,000,000 VCOIN = 2,000,000,000,000,000 base units.
- 1,000,000,000 VCOIN = 1,000,000,000,000,000 base units.
- 5,000,000,000 VCOIN = 5,000,000,000,000,000 base units.
- Total 10,000,000,000 VCOIN = 10,000,000,000,000,000 base units.

Allocation accounting must be capped at the approved amount for each category. A database record or backend balance is not proof of an on-chain transfer.

## 6. Change control

Any replacement, addition, removal or reassignment of an allocation address requires explicit project-owner approval and a new version of this register. Update all dependent deployment templates and allocation documentation in the same controlled change.

**Current status:** Five destination addresses recorded. Ownership verification, Jetton wallet derivation, contract deployment, initial issuance and transfers are not confirmed by this document.
