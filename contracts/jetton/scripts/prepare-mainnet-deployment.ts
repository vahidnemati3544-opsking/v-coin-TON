/**
 * DISABLED — Mainnet transaction planning is intentionally blocked.
 *
 * The controlling custody sequence is the five-stage Founder-first receipt
 * flow documented in docs/OWNER_INSTRUCTION_2026-11-24.md:
 * 420M, 1.05B, 210M, 210M, 210M VCOIN to the Founder wallet, followed only
 * after reconciliation by four Founder-signed TEP-74 allocation transfers.
 *
 * The contract implements the five-stage flow, but this file is not a
 * reviewed release planner. Do not restore or run it until exact-head
 * independent verification, StateInit/wallet derivation, fee/reserve review,
 * and a separate explicit Founder approval of the exact operation are complete.
 *
 * No Mainnet or Testnet transaction is created, signed, or broadcast here.
 */
throw new Error(
  'DISABLED: Mainnet planner remains blocked pending release gates and exact Founder approval.',
);
