# Founder-only TON reserve withdrawal

**Status:** Proposed implementation; CI, independent review, and exact-build fee simulation are required. This document does not authorize Mainnet deployment or any transaction.

## Scope separation

This feature applies only to TON already held as the VCoinMaster operational reserve. It does not implement or route VCOIN purchase/swap proceeds. Any TON paid for a VCOIN exchange must use a separate payment/market flow that directs proceeds to the Founder wallet from the outset.

## Enforced behavior

- Only `owner` (the Founder wallet) may request a withdrawal.
- The destination is fixed by contract state: `self.owner`; no recipient field is accepted.
- Amount must be positive.
- The contract protects a provisional minimum balance of 0.25 TON and an additional 0.10 TON fee buffer.
- The request carries at least 0.01 TON to cover request processing.
- The outgoing message uses pay-gas-separately and bounce enabled.
- The reserve floor and fee buffer are provisional parameters, not a live fee quote. They must be validated against exact-build transaction simulation and independent review before any Mainnet deployment.

## Required verification

Sandbox tests must prove Founder authorization, rejection of non-Founder callers, fixed destination, zero-amount rejection, reserve-floor enforcement, and successful balance movement. CI must compile the generated message ABI and run the complete pre-existing suite. Review must also assess send-fee accounting, bounce behavior, storage reserve, and whether a bounced outbound payment restores the intended accounting.

## Explicit non-goal

No DEX/router/swap or VCOIN purchase/sale payment path is introduced here. The Founder proceeds requirement remains a separate architecture item.
