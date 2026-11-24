/**
 * DISABLED — superseded by docs/OWNER_INSTRUCTION_2026-11-24.md.
 *
 * This legacy generator constructs direct five-wallet VCoinMint payloads.
 * The active VCoinMaster contract implements five exact, sequentially acknowledged
 * Founder-first receipt stages, followed by four Founder-signed Jetton transfers.
 * This planner remains disabled pending allocation enforcement/accounting review,
 * exact transaction-plan validation, and complete local Sandbox evidence.
 *
 * Do not restore or run this generator. A replacement transaction planner
 * must be written only after the contract, allocation accounting, and local
 * TON Sandbox tests implement the current owner instruction.
 *
 * No Mainnet or Testnet transaction is created or sent by this file.
 */
throw new Error(
  'DISABLED: legacy direct-mint Mainnet preview is not approved: allocation enforcement/accounting and release verification remain incomplete.',
);
