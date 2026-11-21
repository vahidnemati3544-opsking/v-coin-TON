# V COIN–TON On-chain Issuance Policy Specification

**Document ID:** VCT-POL-001  
**Version:** 1.1.0  
**Status:** Implemented in the unmerged security branch; independent audit and Testnet verification pending  
**Network:** TON, Jetton (TEP-74); metadata TEP-64  
**Scope:** Independent V COIN–TON project only. The legacy BNB project is out of scope.

## 1. Fixed token parameters

| Parameter | Required value |
|---|---:|
| Token | V COIN (VCOIN) |
| Maximum lifetime issuance | 10,000,000,000 VCOIN |
| Decimals | 6 |
| Maximum base units | 10,000,000,000,000,000 |
| Additional minting after finalization | Permanently disabled |

The minter distinguishes outstanding `totalSupply` from cumulative `lifetimeIssued`. A valid burn decreases outstanding supply only; it does not restore lifetime issuance capacity. All token arithmetic uses integer base units.

## 2. Five fixed allocation owners and lifetime ceilings

The deployed Jetton wallet addresses are derived from the final master address and these owner addresses; they are not the same as the owner addresses listed below.

| Allocation | Share | Ceiling (VCOIN) | Ceiling (base units) | Fixed owner address |
|---|---:|---:|---:|---|
| Founder | 20% | 2,000,000,000 | 2000000000000000 | `UQAdW09EvIesUXt9jzLq1T32O0351TaczwWJQLGGmw4aWrzy` |
| Mining reserve | 50% | 5,000,000,000 | 5000000000000000 | `UQDMEIvklqeBW0Pn74sBHzOpoFGsSWDHE5NxZwfN-1KVsBD0` |
| Treasury | 10% | 1,000,000,000 | 1000000000000000 | `UQBEW5bLGbq0yVDOimgl6fpZbQkdla9Wk5b0tXyx69bmBktQ` |
| Liquidity / market | 10% | 1,000,000,000 | 1000000000000000 | `UQA0_thi3mXZ6jFlHHBfnyjVmXayR3hsGx5PC43_fBOTzXWn` |
| Ecosystem / marketing | 10% | 1,000,000,000 | 1000000000000000 | `UQBQDb73DWWMGnxEr37TsqZSKNvVOC9MMwkvRmNY91LJqLsE` |
| **Total** | **100%** | **10,000,000,000** | **10000000000000000** | |

No sixth destination may receive issuance. The five destination addresses are compiled into or initialized in the VCOIN minter; the Founder is the initial minter administrator.

## 3. Implemented issuance invariants

The enforcement logic is in `contracts/acton/jetton-v2.1/contracts/VcoinMinter.tolk`. The standalone pure policy module is a specification/test aid and is not the authoritative on-chain enforcement path.

1. Only the configured Founder administrator may request minting.
2. Each allocation can be issued once, for its exact fixed amount, to its exact approved owner. Partial, over-cap, duplicate, and sixth-destination mint requests are rejected.
3. Founder and Mining mint requests are blocked until both deterministic vesting escrows have reported readiness.
4. Founder and Mining amounts are minted to their respective escrow owners, never directly to beneficiary wallets. The minter records issuance as confirmed only after the exact escrow deposit acknowledgement.
5. Treasury, Liquidity, and Ecosystem issuance is confirmed only after the corresponding derived Jetton wallet acknowledgement.
6. `lifetimeIssued` cannot exceed 10,000,000,000 VCOIN. Each allocation status is one-way from not-issued to pending to confirmed; a matching authenticated bounce can roll a pending mint back for retry.
7. Bounce rollback requires the expected derived Jetton wallet, pending allocation, query ID, and exact amount. An unrelated or mismatched bounce does not decrement supply.
8. Burns decrease outstanding supply only. They do not reopen an allocation or reduce lifetime issuance.
9. Finalization is permitted only after all five exact allocations are confirmed and lifetime issuance equals the global cap. Finalization removes the administrator and blocks further minting or metadata changes.
10. All five allocations together must equal exactly 10,000,000,000 VCOIN before finalization.

The implementation uses one-shot allocation status flags and exact fixed mint amounts rather than five separate cumulative allocation counters. This is the chosen enforcement model for the current contract.

## 4. Vesting and reserve policies

### Founder
- Allocation: 2,000,000,000 VCOIN.
- Duration: 1,461 days / 126,230,400 seconds.
- Schedule: continuous linear vesting, no cliff.
- Beneficiary and release controller: the recorded Founder wallet.
- Release: on-demand claim of accrued vested tokens; the controller cannot bypass the time-based ceiling.

### Mining reserve
- Allocation: 5,000,000,000 VCOIN.
- Duration: 730 days / 63,072,000 seconds.
- Schedule: continuous linear vesting, no cliff.
- Beneficiary: the recorded Mining reserve wallet.
- Release: on-demand claim of accrued vested tokens, under the Founder-controlled release mechanism.

The minter creates two separate deterministic escrow instances after a one-time start-time configuration. Both escrows must acknowledge readiness before any allocation mint. The start timestamp and escrow addresses remain unset until the Testnet deployment configuration is explicitly approved and verified.

### Treasury, liquidity, ecosystem
Each receives its exact one-billion VCOIN allocation at its recorded owner address. Any later operational movement is controlled by that wallet's owner and separately approved custody arrangements.

## 5. Verification evidence and remaining tests

The latest verified Acton CI run for the current branch completed:
- contract build and wrapper generation;
- local-emulated guarded minter deployment script;
- 91 emulator tests across 9 files;
- static checks and formatting.

VCOIN-specific passing tests include:
- rejection of unauthorized minter and sixth destination;
- blocking Founder/Mining mint before escrow readiness;
- rejection of partial and over-allocation mint requests;
- successful Founder escrow deposit acknowledgement;
- successful release through the actual VCOIN escrow and beneficiary Jetton wallets;
- VCOIN wallet balance restoration and failure acknowledgement using a protocol-valid RichBounce envelope;
- a naturally generated downstream TVM bounce across the actual escrow-wallet-to-beneficiary-wallet route, produced by freezing the derived beneficiary Jetton-wallet account in emulator state; the test verifies escrow balance restoration, pending-release cleanup through a fresh-query retry, and unchanged minter total supply;
- rejection of forged success acknowledgements, mismatched failure amounts, and replayed escrow-deposit acknowledgements;
- linear Founder and Mining vesting boundary/rounding tests.

The natural-bounce regression is now covered by the current CI run. Broader cross-allocation invariant coverage and any findings from the independent security audit remain outstanding.

## 6. Deployment gates

No Testnet deployment or mint is authorized by this document. Before Testnet:
- complete any additional cross-allocation invariant tests identified during review;
- pin and verify the exact source/compiler/code hashes;
- complete an independent smart-contract security review;
- review the exact deployment and vesting start-time configuration;
- prove control of the selected payer and allocation wallets on the intended network;
- deploy to Testnet only after explicit approval, then verify master/escrow/wallet addresses and end-to-end transfers in a TON explorer and Tonkeeper.

Mainnet issuance requires a separate explicit approval and wallet signatures. Never request or store seed phrases or private keys.

## 7. Reference core

The isolated implementation baseline is pinned in `contracts/acton/` to `ton-blockchain/acton-contracts` commit `d721c3179696b453a9490fcfd2f30770f8c234b4`, Jetton v2.1. This reference is not itself a VCOIN security certification.
