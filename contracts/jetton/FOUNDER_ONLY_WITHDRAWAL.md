# Founder-only TON reserve withdrawal

**Status:** Implemented in `contracts/jetton/src/vcoin.tact` as `VCoinWithdraw`; Sandbox tests cover successful Founder withdrawal, non-Owner rejection, zero-amount rejection, reserve-floor enforcement and underfunded request rejection. The project's defined engineering checks and exact-build fee/reserve simulation remain required. This does not authorize Mainnet deployment or any transaction. This document does not authorize Mainnet deployment or any transaction.

## Scope separation

This feature applies only to TON already held as the VCoinMaster operational reserve. It does not implement or route VCOIN purchase/swap proceeds. Any TON paid for a VCOIN exchange must use a separate payment/market flow that directs proceeds to the Founder wallet from the outset.

## Enforced behavior

- Only `owner` (the Founder wallet) may request a withdrawal.
- The destination is fixed by contract state: `self.owner`; no recipient field is accepted.
- Amount must be positive.
- The contract protects a provisional minimum balance of 0.25 TON and an additional 0.10 TON fee buffer.
- The request carries at least 0.01 TON to cover request processing.
- The outgoing message uses pay-gas-separately and bounce enabled.
- The reserve floor and fee buffer are provisional parameters, not a live fee quote. They must be validated against exact-build transaction simulation and the project's documented engineering checks before any Mainnet deployment.

## Required verification

The current Sandbox suite in `contracts/jetton/tests/jetton-sandbox.spec.ts` verifies successful Founder-only withdrawal to the fixed Founder address, protected reserve floor, zero-amount rejection and the minimum 0.01 TON request value. CI must compile the generated message ABI and run the complete suite on the exact source commit. The project's engineering verification must assess send-fee accounting, bounce behavior, storage reserve and whether a bounced outbound payment restores the intended accounting.

## Explicit non-goal

No DEX/router/swap or VCOIN purchase/sale payment path is introduced here. The Founder proceeds requirement remains a separate architecture item.
