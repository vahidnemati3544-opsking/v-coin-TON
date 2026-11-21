# V COIN Jetton sandbox verification plan

**Scope:** Initial fixed-supply issuance and the Natural Bounce rollback guard.

**Current state:** The source-level sender-authentication and exact-rollback guards are committed. This document is a test specification, not evidence that tests have passed. Mainnet release remains blocked until these cases are implemented in the TON Sandbox harness and the full verification command passes.

## Required automated cases

1. **Initial state:** a newly deployed Master reports zero total supply, minting enabled, and the configured owner.
2. **Unauthorized issuance:** a message from any non-owner is rejected and leaves total supply and mintability unchanged.
3. **Exact issuance constraints:** reject a non-owner receiver, a partial amount, and an amount above the fixed 10,000,000,000 VCOIN supply (10^16 base units).
4. **One-time issuance:** accept exactly one owner-authorized issuance to the owner's deterministic Jetton wallet; verify the wallet balance and Master total supply equal 10^16 base units and minting is disabled.
5. **Repeat issuance:** reject a second issuance after successful initial issuance without changing supply or balances.
6. **Natural Bounce rollback:** cause the initial wallet-credit message to bounce naturally in Sandbox; verify the Master supply is rolled back from exactly 10^16 to zero and the issuance gate reopens.
7. **Forged/untrusted bounce:** send a bounced-message-shaped payload from an address other than the owner's deterministic Jetton wallet; verify the Master rejects it and does not alter supply or mintability.
8. **Invalid rollback amount:** verify zero, partial, or greater-than-fixed-supply bounced amounts are rejected.
9. **Stale or duplicate bounce:** verify a bounce received while minting is already enabled is rejected.
10. **Retry after valid rollback:** after a valid full rollback, allow one retry of the exact fixed issuance; verify that the successful retry closes the issuance gate permanently.

## Acceptance criteria

- `npm run build` completes without compiler errors.
- `npm test -- --runInBand` executes the sandbox suite with all cases passing (not merely an empty test run).
- `npm run verify` exits successfully.
- The test report and commit SHA are retained as release evidence.
- No Testnet or Mainnet transaction is sent as part of this verification.

## Release gate

Until all acceptance criteria are met, the Natural Bounce test is **pending**, the contract is **not release-verified**, and no Mainnet deployment or token issuance is authorized.
