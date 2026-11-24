# V COIN – TON Smart Contracts

## Purpose
Independent V COIN Jetton implementation for TON (TEP-74 / TEP-64), separate from the legacy BNB Smart Chain project.

## Approved economic baseline
- Fixed supply: **2,100,000,000 VCOIN**, six decimals.
- Founder: 420,000,000 (20%).
- Mining reserve: 1,050,000,000 (50%).
- Treasury: 210,000,000 (10%).
- Liquidity/Market: 210,000,000 (10%).
- Ecosystem/Marketing: 210,000,000 (10%).
- Hard cap: 2,100,000,000,000,000 base units. No additional minting.

## Controlling initial receipt flow — five exact Founder stages
The VCoinMaster owner is the registered Founder Mainnet wallet. Initial issuance credits only the deterministic Founder Jetton wallet, in this exact order:

1. **420,000,000 VCOIN** — 420,000,000,000,000 base units.
2. **1,050,000,000 VCOIN** — 1,050,000,000,000,000 base units.
3. **210,000,000 VCOIN** — 210,000,000,000,000 base units.
4. **210,000,000 VCOIN** — 210,000,000,000,000 base units.
5. **210,000,000 VCOIN** — 210,000,000,000,000 base units.

Every stage requires a separate Founder signature and the preceding stage's wallet-credit acknowledgement. Only after Stage 5 is acknowledged does the Master permanently set `mintable=false`. A natural bounce rolls back only the pending stage; the same stage can be retried. A lost acknowledgement can be resent by the Founder wallet owner without double issuance.

After all five receipts, the Founder retains 420,000,000 VCOIN and personally signs four ordinary TEP-74 transfers: Mining 1,050,000,000; Treasury 210,000,000; Liquidity/Market 210,000,000; Ecosystem/Marketing 210,000,000. These transfers do not mint new supply.

## Security and release rules
- Enforce Founder-only authority, exact stage sequence and amounts, a hard 2.1B cap, idempotent acknowledgement, bounce rollback, and permanent mint disablement after Stage 5.
- Test transfer, burn, acknowledgement retry, bounce, replay, database reconciliation, and TON reserve behavior in local Sandbox/isolated PostgreSQL tests.
- Never request, store, or expose a seed phrase, private key, PIN, or recovery code.
- Never deploy, sign, or broadcast without separate explicit Founder approval of the exact operation. CI must never send Mainnet transactions.

## Current status
- Five-stage implementation is under exact-head build and automated verification on `feat/five-stage-founder-receipt`.
- Mainnet deployment, minting, and transfers remain **HOLD / NO-GO** until all release gates and documented internal security review pass.
- No on-chain deployment or token receipt is claimed.

See `contracts/jetton/DEPLOYMENT_RUNBOOK.md`, `contracts/jetton/VERIFICATION_STATUS.md`, and `docs/WALLET_ALLOCATION_REGISTER.md`.
