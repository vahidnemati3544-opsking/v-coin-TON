# V COIN – Wallet-Backed Mining Engine

**Action:** 54  
**Status:** Isolated wallet-backed engine and PostgreSQL integration tests added.  
**Public API:** Still disabled (HTTP 503).

## Reward basis

The wallet-backed engine does not read `balances.available_base_units` as its mining eligibility source. It requires a finalized Jetton balance snapshot linked to the user's verified wallet and selected TON chain.

The approved accrual formula is integer-only:

`reward_base_units = floor(eligible_balance_base_units × elapsed_ms / 8,640,000,000)`

This is 1% per 24 hours, using six-decimal VCOIN base units.

## Interval safety

- A session begins only with a fresh, finalized snapshot from the selected network.
- At claim time, a second fresh, finalized snapshot is required.
- Both snapshots must belong to the same verified wallet and the same Jetton master.
- The interval's eligible balance is the lower of its start and end snapshots. This prevents a deposit near claim time from being rewarded retroactively and conservatively accounts for withdrawals.
- The selected start/end snapshot IDs and eligible balance are written to `mining_rewards` for auditability.
- The session's next interval begins from the latest end snapshot.
- The claim is reserved against the current 1.05 billion VCOIN mining allocation and posted through the existing balanced internal ledger.
- The reward remains an internal account balance; this engine does not submit a Jetton transfer or mark a wallet payout as complete.

## Required database changes

`012-wallet-backed-mining-basis.sql` adds snapshot references to mining sessions and reward records. It preserves legacy rows with null wallet snapshot fields; the new engine refuses to claim against a legacy session.

## Release gates

- The engine is not mounted on the public `/api/v1/mining` routes.
- The existing public mining API remains fail-closed with HTTP 503.
- Live RPC verification against the deployed Mainnet master and comparison with Tonviewer are still required.
- A separate review is required before enabling public mining or creating payout transactions.

## Network separation

Mainnet (`-239`) and Testnet (`-3`) use independent wallet bindings and Jetton master configuration. The deployed Mainnet master is never reused as the Testnet master.