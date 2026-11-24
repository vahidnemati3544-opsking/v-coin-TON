/**
 * DISABLED — historical Testnet rehearsal generator.
 *
 * V COIN–TON currently permits local TON Sandbox simulation only.
 * Public Testnet deployment, wallet requests, signing, and broadcast are not
 * authorized. This guard intentionally runs before any imports, file reads,
 * wallet parsing, or build artifact generation.
 *
 * Do not restore this generator. Keep the historical Testnet address and
 * configuration quarantined; never reuse them for Mainnet.
 */
throw new Error(
  'DISABLED: V COIN–TON public Testnet rehearsal is not authorized; use local TON Sandbox only.',
);
