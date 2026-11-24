# V COIN–TON — Owner Instruction: Founder-First Mainnet Receipt and Distribution

**Document ID:** VCT-OWNER-CHANGE-2026-11-24  
**Effective date:** 2026-11-24  
**Status:** Owner instruction recorded; contract/configuration adaptation and transaction verification pending  
**Network:** TON Mainnet only

## 1. Binding instruction

The project owner has instructed that the full fixed initial supply of **2,100,000,000 VCOIN** (six decimals; **2,100,000,000,000,000 base units**) be received by the Founder Mainnet wallet below in **five separate, sequentially authorized receipt stages**:

`UQBh9jVKAypc4TrbFx2jsVB2EI1ONChg22zDputisQjENQOT`

| Stage | VCOIN | Base units |
|---:|---:|---:|
| 1 | 420,000,000 | 420,000,000,000,000 |
| 2 | 1,050,000,000 | 1,050,000,000,000,000 |
| 3 | 210,000,000 | 210,000,000,000,000 |
| 4 | 210,000,000 | 210,000,000,000,000 |
| 5 | 210,000,000 | 210,000,000,000,000 |
| **Total** | **2,100,000,000** | **2,100,000,000,000,000** |

Each stage is a separate Founder-authorized request to the same Founder Jetton wallet. A stage may proceed only after the preceding stage's Jetton-wallet credit has been acknowledged and reconciled. The next stage requires a fresh Founder signature. A bounced stage may be retried only at the same sequence and amount after its rollback is confirmed. This is an initial custody/receipt sequence, not a change to the fixed supply and not an increase in the Founder's personal allocation.

## 2. Allocation after receipt

After the full supply has been received and reconciled, the Founder personally controls and signs the allocation transfers to the four other registered destination wallets:

| Allocation | Share | Amount |
|---|---:|---:|
| Founder retained allocation | 20% | 420,000,000 VCOIN |
| Mining reserve | 50% | 1,050,000,000 VCOIN |
| Treasury | 10% | 210,000,000 VCOIN |
| Liquidity and market | 10% | 210,000,000 VCOIN |
| Ecosystem and marketing | 10% | 210,000,000 VCOIN |
| **Total** | **100%** | **2,100,000,000 VCOIN** |

The four recipient addresses remain the owner-designated addresses in `docs/WALLET_ALLOCATION_REGISTER.md`. The Founder retains the 420,000,000 VCOIN allocation. The Founder personally approves and signs each transfer; backend services must not sign or move tokens.

## 3. Former Founder address

The former address `UQAdW09EvIesUXt9jzLq1T32O0351TaczwWJQLGGmw4aWrzy` was used for Testnet work only. It is historical/test-only and is not the Founder Mainnet receiving wallet. Do not use it in Mainnet transaction payloads, deployment configuration, balance reconciliation, or wallet-connect sessions.

## 4. Contract and configuration impact

The active implementation uses the five exact receipt stages above. The contract, allocation manifest, initialization parameters, deployment template, backend accounting, and Sandbox tests must remain consistent with this instruction. Do not deploy or use stale two-stage receipt or direct-five-wallet issuance artifacts.

Required engineering checks include:

1. Preserve a hard cap of 2,100,000,000 VCOIN and permanently prohibit additional minting.
2. Support the five separately authorized Founder-first receipt stages, with each stage gated by acknowledgement of the preceding Founder Jetton-wallet credit.
3. Confirm the four subsequent distribution amounts and destination addresses against the owner-approved allocation register. Founder signs each ordinary TEP-74 transfer.
4. Prevent duplicate issuance, over-allocation, wrong-network payloads, and double accounting.
5. Record each transfer's transaction hash, exact base-unit amount, sender, recipient, Jetton Master, status, and finality.
6. Pass local TON Sandbox tests for all five receipt stages, acknowledgement retry, natural bounce/retry, all four distributions, and total-supply reconciliation.
7. Verify whether the contract itself enforces destination/allocation restrictions or whether these are enforced by a separately reviewed Founder-controlled transaction planner. Do not describe planner-side checks as on-chain enforcement.

## 5. Safety and authorization status

This document records the owner's desired policy; it is not proof of wallet ownership, a deployed Mainnet Jetton Master, available VCOIN balance, or a completed transfer. No transaction is sent or authorized merely by this documentation update. Before the Founder signs, independently verify the Mainnet Jetton Master, actual supply and balances, Founder wallet control, four recipient addresses, exact transaction previews, fee/reserve requirements, and local Sandbox evidence. Never request or share recovery phrases or private keys.

**Current status:** Five-stage policy documented. Mainnet transfer readiness remains **HOLD / NO-GO** until contract/configuration compatibility, allocation enforcement/accounting, and all verification gates are complete.
