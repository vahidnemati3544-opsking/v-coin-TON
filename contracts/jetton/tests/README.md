# V COIN Jetton Sandbox verification

**Scope:** Tact compilation, fixed five-wallet allocation enforcement, initial issuance, and authenticated Natural Bounce rollback.

**Current release gate:** The suite is implemented and must pass in CI. This file describes executable tests; the latest CI run is the source of truth for pass/fail evidence.

## Automated coverage

1. **Owner-only issuance:** reject any issuance request not signed by the configured founder/owner.
2. **Fixed destination set:** accept only the five addresses stored immutably in Master StateInit; reject any unregistered receiver.
3. **Exact per-wallet allocations:** founder 2B, mining reserve 5B, treasury 1B, liquidity/market 1B, ecosystem/marketing 1B VCOIN (six decimals).
4. **No partial or over-allocation:** reject wrong amounts for each destination and prevent aggregate supply from exceeding 10B VCOIN.
5. **One-time role issuance:** each destination allocation can be issued only once.
6. **Separate gas funding:** accept at least 0.75 TON only from the registered GAS & OPERATIONS wallet; reject funding from any other sender.
7. **Owner request fee:** accept a 0.01 TON owner-signed issuance request when the Master gas reserve is funded; reject issuance when that reserve is empty.
8. **Natural Bounce rollback:** a real bounce from each of the five deterministic destination Jetton wallets rolls back only that role's allocation.
9. **Authenticated bounce source:** only the deterministic wallet for the corresponding approved role can roll back that allocation.
10. **Retry after valid bounce:** after a role's wallet-credit message naturally bounces, allow that exact role's allocation to be retried.
11. **Final issuance lock:** once all five allocations have been credited, set mintable=false and reject all further issuance.

## CI acceptance

- npm run build compiles VCoinMaster, VCoinJettonWallet, and the test-only BounceRejector fixture.
- npm test runs the allocation policy, manifest, and TON Sandbox suites.
- The Sandbox suite verifies the five deterministic wallet balances and the Master supply.
- The Founder allocation wallet is also the sole GAS & OPERATIONS wallet; it is one of the five VCOIN allocation destinations, not a sixth wallet.
- No Testnet or Mainnet transaction is sent during CI.

## Deployment restrictions

- The five destination addresses must be checked against the approved operational register before Master deployment.
- The deployed Master allocation config must be read back and compared with the approved register before any issuance.
- No Mainnet deployment or issuance is authorized until the project's documented engineering release checks pass and the Founder separately approves the exact operation.
