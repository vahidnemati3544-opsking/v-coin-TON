# V COIN–TON On-chain Issuance Policy Specification

**Document ID:** VCT-POL-001  
**Version:** 1.0.0  
**Status:** Design baseline — implementation and tests pending  
**Network:** TON, Jetton (TEP-74)  
**Scope:** Independent V COIN–TON project only. The legacy BNB project is out of scope.

## 1. Fixed token parameters

| Parameter | Required value |
|---|---:|
| Token | VCOIN |
| Maximum lifetime issuance | 10,000,000,000 VCOIN |
| Decimals | 6 |
| Maximum base units | 10,000,000,000,000,000 |
| Additional minting after finalization | Permanently disabled |

The policy must distinguish:
- `total_supply`: outstanding Jettons; decreases on valid burns.
- `lifetime_issued`: cumulative base units ever minted; never decreases, including after burns.
- Allocation counters: cumulative issuance charged to each allocation; never decrease after burns or transfers.

A burn must never restore minting capacity.

## 2. Five fixed allocation owners and lifetime ceilings

The following owner addresses are the five destination addresses previously assigned for V COIN. The deployed Jetton wallet addresses will be derived from the final master address and these owner addresses; they are not the same as these owner addresses.

| Allocation | Share | Ceiling (VCOIN) | Ceiling (base units) | Fixed owner address |
|---|---:|---:|---:|---|
| Founder | 20% | 2,000,000,000 | 2,000,000,000,000,000 | `UQAdW09EvIesUXt9jzLq1T32O0351TaczwWJQLGGmw4aWrzy` |
| Mining reserve | 50% | 5,000,000,000 | 5,000,000,000,000,000 | `UQDMEIvklqeBW0Pn74sBHzOpoFGsSWDHE5NxZwfN-1KVsBD0` |
| Treasury | 10% | 1,000,000,000 | 1,000,000,000,000,000 | `UQBEW5bLGbq0yVDOimgl6fpZbQkdla9Wk5b0tXyx69bmBktQ` |
| Liquidity / market | 10% | 1,000,000,000 | 1,000,000,000,000,000 | `UQA0_thi3mXZ6jFlHHBfnyjVmXayR3hsGx5PC43_fBOTzXWn` |
| Ecosystem / marketing | 10% | 1,000,000,000 | 1,000,000,000,000,000 | `UQBQDb73DWWMGnxEr37TsqZSKNvVOC9MMwkvRmNY91LJqLsE` |
| **Total** | **100%** | **10,000,000,000** | **10,000,000,000,000,000** | |

No other destination may receive issuance. Allocation owner changes are forbidden after configuration finalization.

## 3. Required contract invariants

1. Each mint must be authenticated and charged to exactly one of the five allocation counters.
2. Recipient owner must exactly match the configured owner for that allocation. A caller cannot select a different recipient.
3. Per-allocation lifetime ceiling must never be exceeded.
4. Sum of allocation counters must never exceed the global lifetime issuance ceiling.
5. Integer arithmetic uses base units only; no floating-point token amounts.
6. Allocation counters and lifetime issuance are incremented atomically with the mint request.
7. If a mint's internal transfer bounces, the reference Jetton minter's supply rollback must be retained and the corresponding lifetime/allocation counters must also be safely reconciled. The implementation must prove this with a bounced-message test; replayed or forged bounce messages must not decrement counters.
8. Finalization is one-way. After it, mint, owner reconfiguration, metadata replacement, administrator handoff, and code upgrade must be impossible.
9. Burns reduce outstanding supply only. They do not reduce lifetime issuance or allocation counters.
10. All five allocations together must equal exactly 10,000,000,000 VCOIN before finalization.

## 4. Vesting and reserve policies

### Founder
Founder allocation is 2,000,000,000 VCOIN with a four-year vesting duration. The vesting contract must prevent transfers of unvested tokens and be tested at start, intermediate release boundaries, exact maturity, and after maturity.

The following terms remain deliberately unspecified and must be approved before implementation: vesting start timestamp, cliff (if any), linear vs periodic release, and beneficiary recovery/administrative controls. Do not invent these terms.

### Mining reserve
Mining allocation is 5,000,000,000 VCOIN. The planned distribution target has a minimum two-year window. The on-chain reserve must prevent unauthorized withdrawals and provide an auditable distribution path. Exact cadence and whether distribution is directly from a reserve wallet or a dedicated escrow contract require implementation design and tests.

### Treasury, liquidity, ecosystem
Each has a one-billion VCOIN lifetime ceiling and a fixed owner address. Operational movement after issuance is governed by the respective wallet owner and any separately approved multisig/escrow policy; no allocation may be minted again after its ceiling is reached.

## 5. Required VCOIN-specific tests

- Exact base-unit and decimals checks.
- Mint to each of the five allowed owners.
- Reject any sixth or substituted recipient.
- Reject each allocation at ceiling + 1 base unit.
- Reject global cap at ceiling + 1 base unit.
- Reject mint after one-way finalization.
- Verify lifetime counters do not decrease after burn.
- Verify allocation counters do not decrease after burn or transfer.
- Verify mint-bounce rollback and replay/forgery resistance for both outstanding supply and lifetime counters.
- Verify metadata, admin, and code-upgrade mutation are rejected after finalization.
- Founder vesting boundary and unauthorized-withdrawal tests.
- Mining escrow unauthorized-withdrawal and distribution-window tests.

## 6. Deployment gates

No Testnet or Mainnet deployment package is approved until:
- Acton/Tolk core compiles and its imported integration tests pass in CI.
- VCOIN-specific policy and tests compile and pass.
- Independent contract security review is completed.
- Metadata, vesting terms, reserve mechanism, and finalization behavior are reviewed.
- Testnet deployment and end-to-end wallet tests are verified.

Mainnet issuance requires separate explicit owner approval and TON Connect wallet signatures. Never request or store seed phrases or private keys.

## 7. Reference core

The isolated implementation baseline is pinned in `contracts/acton/` to `ton-blockchain/acton-contracts` commit `d721c3179696b453a9490fcfd2f30770f8c234b4`, Jetton v2.1. This reference is not itself a VCOIN security certification.
