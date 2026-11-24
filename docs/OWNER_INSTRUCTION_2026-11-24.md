# V COIN–TON — Owner Instruction: Founder-First Mainnet Receipt and Distribution

**Document ID:** VCT-OWNER-CHANGE-2026-11-24  
**Effective date:** 2026-11-24  
**Status:** Owner instruction recorded; contract/configuration adaptation and transaction verification pending  
**Network:** TON Mainnet only

## 1. Binding instruction

The project owner has instructed that the full fixed initial supply of **2,100,000,000 VCOIN** (six decimals; **2,100,000,000,000,000 base units**) be received by the Founder Mainnet wallet below in two separate incoming transfers:

`UQBh9jVKAypc4TrbFx2jsVB2EI1ONChg22zDputisQjENQOT`

The two installment amounts and exact timing have not yet been specified. They must be recorded in a transaction plan before the first transfer. The second transfer must not be prepared or sent until the Founder explicitly announces and authorizes that second installment.

This is an initial custody/receipt sequence, not a change to the token's fixed supply and not an increase in the Founder's personal allocation.

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

The repository's previous design used fixed, direct, one-time issuance to five separate Jetton wallets. That design is not automatically compatible with the new Founder-first two-stage receipt and later Founder-signed distributions. The contract, allocation manifest, initialization parameters, deployment template, backend accounting, and Sandbox tests must be reviewed and revised together. Do not deploy or use stale five-destination direct-issuance artifacts under this new instruction.

Required engineering changes include:

1. Preserve a hard cap of 2,100,000,000 VCOIN and permanently prohibit additional minting.
2. Support the two separately authorized incoming supply receipts to the Founder wallet, with the second stage gated by a new explicit Founder authorization.
3. Enforce the exact four subsequent distribution caps and destination addresses.
4. Prevent duplicate transfers, over-allocation, wrong-network payloads, and double accounting.
5. Record each transfer's transaction hash, exact base-unit amount, sender, recipient, Jetton Master, status, and finality.
6. Pass local TON Sandbox tests for stage 1, stage 2, second-stage authorization, all four distributions, bounce/retry behavior, and total-supply reconciliation.

## 5. Safety and authorization status

This document records the owner's desired policy; it is not proof of wallet ownership, a deployed Mainnet Jetton Master, available VCOIN balance, or a completed transfer. No transaction is sent or authorized merely by this documentation update. Before the Founder signs, independently verify the Mainnet Jetton Master, actual supply and balances, Founder wallet control, four recipient addresses, installment amounts, fee/reserve requirements, and exact transaction previews. Never request or share recovery phrases or private keys.

**Current status:** Policy documented. Mainnet transfer readiness remains blocked until contract/configuration compatibility and all verification gates are complete.
