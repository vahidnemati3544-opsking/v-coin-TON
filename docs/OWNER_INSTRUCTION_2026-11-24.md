# V COIN–TON — Controlling Owner Instruction: Founder-First Mainnet Receipt and Distribution

**Document ID:** VCT-OWNER-CHANGE-2026-11-24  
**Effective date:** 2026-11-24  
**Status:** Controlling five-stage instruction; implementation and Mainnet verification gates remain pending  
**Network:** TON Mainnet only

## 1. Controlling instruction

The earlier two-installment draft in this file is superseded. The controlling receipt sequence is five separate Founder-authorized stages totaling exactly **2,100,000,000 VCOIN** (six decimals; **2,100,000,000,000,000 base units**) to the Founder Mainnet wallet:

`UQBh9jVKAypc4TrbFx2jsVB2EI1ONChg22zDputisQjENQOT`

| Stage | VCOIN | Base units |
|---:|---:|---:|
| 1 | 420,000,000 | 420000000000000 |
| 2 | 1,050,000,000 | 1050000000000000 |
| 3 | 210,000,000 | 210000000000000 |
| 4 | 210,000,000 | 210000000000000 |
| 5 | 210,000,000 | 210000000000000 |
| **Total** | **2,100,000,000** | **2100000000000000** |

Each stage is a distinct operation requiring a separate explicit Founder approval and signature. Stage N+1 must not be initiated until the previous stage's exact Founder Jetton-wallet credit and Master acknowledgement are independently confirmed. A bounce permits retry of that same stage only; confirmed earlier stages must remain unchanged.

## 2. Allocation after all five receipts

After all five stages are confirmed and reconciled, the Founder personally signs four ordinary TEP-74 transfers:

| Allocation | Share | Amount |
|---|---:|---:|
| Founder retained allocation | 20% | 420,000,000 VCOIN |
| Mining reserve | 50% | 1,050,000,000 VCOIN |
| Treasury | 10% | 210,000,000 VCOIN |
| Liquidity and market | 10% | 210,000,000 VCOIN |
| Ecosystem and marketing | 10% | 210,000,000 VCOIN |
| **Total** | **100%** | **2,100,000,000 VCOIN** |

These are transfers of the already-issued fixed supply, not additional minting. Backend services must never sign or move tokens.

## 3. Former Testnet address

**Action #89 address correction (2026-11-24):** The former address `UQAdW09EvIesUXt9jzLq1T32O0351TaczwWJQLGGmw4aWrzy` is not Testnet-only: `UQ...` is the non-bounceable Mainnet representation; Testnet-only prefixes are `kQ...` and `0Q...`. TON Center reports the corresponding `EQ...` representation of this same raw account as the admin of the older active VCOIN Master. This address is distinct from the current Founder receiving wallet. Its control is not yet proven; do not use it for current operations until the Founder confirms control and role. No public Testnet deployment or transaction is authorized.

**Action #90 live-balance correction (2026-11-24):** The active Master-derived wallet for the current Founder address is uninitialized and holds zero VCOIN. The four other registered allocation wallets already hold their target balances: Mining 1.05B, Treasury 210M, Liquidity/Market 210M, Ecosystem/Marketing 210M. The legacy Master-admin wallet holds 420M. These balances sum to the full 2.1B supply, but they are the old direct five-wallet allocation—not the current five-stage Founder-first receipt. No receipt stage should be marked complete for the current Founder wallet. See `contracts/jetton/VERIFICATION_STATUS.md` Action #90.

## 4. Contract and configuration requirements

The controlling contract flow is the five-stage Founder-first sequence above, followed by four Founder-signed allocation transfers. Any two-stage draft, direct five-destination issuance plan, or planner inconsistent with this sequence is superseded and must remain disabled.

Required engineering and verification:
1. Preserve the hard cap of 2,100,000,000 VCOIN and permanently disable minting after the fifth acknowledged receipt.
2. Enforce the exact five amounts, strict sequence, one pending stage at a time, Founder-only caller, and Founder-only initial recipient.
3. Enforce bounce recovery and idempotent acknowledgement without double issuance or stage advancement.
4. Permit the four exact allocation transfers only after all five receipts are confirmed.
5. Verify all amounts in base units, the Master, Founder owner, deterministic Jetton wallets, and finality.
6. Pass exact-head build, dependency audit, local TON Sandbox tests, and backend/PostgreSQL integration tests.
7. Reproduce metadata, code and StateInit hashes from a clean build; independently verify destination addresses and actual TON fee/reserve requirements.
8. Keep mining disabled until verified Mainnet wallet ownership, Jetton balance snapshots, payout, finality, and reconciliation are implemented.

## 5. Authorization boundary

This document records the controlling policy; it is not proof of wallet ownership, a deployed Mainnet Master, available VCOIN balance, or a completed transfer. The deployment template must keep `deployment_authorized=false` and `mainnet_authorized=false` until all release gates pass. Deployment, reserve funding, each receipt stage, and each allocation transfer require separate explicit Founder approval of the exact operation. Never request or store seed phrases, private keys, PINs, or recovery phrases.

**Current status:** Mainnet HOLD / NO-GO. No deployment, issuance, receipt, allocation transfer, or live mining is claimed complete.
