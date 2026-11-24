# V COIN Jetton Sandbox verification

**Scope:** Founder-first two-stage initial receipt, fixed 2.1 billion supply, Founder-controlled distribution, and natural bounce recovery.

## Automated coverage

1. Only the Founder may initiate either receipt stage.
2. Stage 1 credits only the Founder Jetton wallet and must be positive but below the full supply.
3. Stage 2 must equal the exact remaining supply; the second call is a separate Founder-signed transaction.
4. The contract rejects non-Founder recipients, duplicate Stage 1, zero values, over-cap values, incorrect Stage 2 remainder, and any issuance after completion.
5. After Stage 2, total supply is exactly 2,100,000,000 VCOIN at six decimals and mintable is false.
6. The Founder can distribute four shares from the Founder Jetton wallet: 1,050,000,000 mining; 210,000,000 treasury; 210,000,000 liquidity/market; 210,000,000 ecosystem/marketing. Founder retains 420,000,000.
7. A natural bounce from the deterministic Founder Jetton wallet rolls back only the matching receipt stage and permits a safe retry.
8. Founder-only TON reserve funding and protected withdrawals are tested.

## CI acceptance

- `npm run build` compiles VCoinMaster, VCoinJettonWallet, and the test-only BounceRejector fixture.
- `npm test` runs the fixed-supply, allocation manifest, and Sandbox suites.
- No Testnet or Mainnet transaction is sent during CI.

## Mainnet restrictions

- The first and second receipt amounts are not predetermined in source; Stage 1 amount must be explicitly entered into the approved deployment plan. Stage 2 is mathematically the exact remainder.
- Stage 2 requires a fresh Founder-signed transaction after Stage 1 is confirmed.
- The four subsequent allocations are ordinary Founder-signed Jetton wallet transfers, not additional mint operations.
- The former Founder Testnet address must never be used on Mainnet.
- No Mainnet deployment or transfer is authorized until exact-head build, Sandbox tests, StateInit hashes, wallet derivations, network fees/reserves, and address-control checks pass.
