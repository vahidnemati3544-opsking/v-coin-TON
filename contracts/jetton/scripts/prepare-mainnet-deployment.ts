/**
 * DISABLED — superseded by docs/OWNER_INSTRUCTION_2026-11-24.md.
 *
 * This legacy generator constructs direct five-wallet VCoinMint payloads.
 * The current approved custody flow requires two separately authorized
 * Founder-first receipts, followed by four Founder-signed Jetton transfers.
 * The current VCoinMaster contract has not yet been adapted to that flow.
 *
 * Do not restore or run this generator. A replacement transaction planner
 * must be written only after the contract, allocation accounting, and local
 * TON Sandbox tests implement the current owner instruction.
 *
 * No Mainnet or Testnet transaction is created or sent by this file.
 */
throw new Error(
  'DISABLED: legacy direct-mint Mainnet preview is incompatible with the 2026-11-24 Founder-first receipt instruction.',
);
