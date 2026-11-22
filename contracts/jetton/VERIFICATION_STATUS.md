# V COIN TON Jetton verification status

**Reviewed branch:** `main`  
**Scope:** Source and committed-test inspection; no deployment or transaction activity.  
**Release disposition:** **NO-GO for Mainnet** until exact-head CI, independent review, wallet-control proofs, and reproducible artifact/hash gates are complete.

## Implementation present on main

- Tact VCoinMaster fixes the five allocation destinations in StateInit and rejects duplicate allocation addresses and any overlap with the separate GAS & OPERATIONS wallet.
- The Founder wallet is the sole VCoinMint authority.
- The contract accepts only the exact amount assigned to the matching configured destination: Founder 2B, Mining Reserve 5B, Treasury 1B, Liquidity/Market 1B, Ecosystem/Marketing 1B VCOIN.
- Each allocation has a one-time issued flag. The Master disables further issuance only after all five allocation roles have completed.
- A bounced wallet-credit message is checked against the deterministic Jetton wallet for that role and its exact allocation amount; only that role is reset for retry.
- GAS & OPERATIONS can fund the Master reserve through VCoinFund but cannot issue VCOIN.
- The founder allocation is one immediate 2,000,000,000 VCOIN allocation; no vesting or time lock applies.

## Committed Sandbox coverage

The current `contracts/jetton/tests/jetton-sandbox.spec.ts` includes tests for:
- Unauthorized issuance, repeat issuance, wrong amounts, unregistered destinations, and underfunded requests.
- Exact five-wallet allocation amounts, configured addresses, final total supply, and permanent mintable=false state.
- Separate GAS & OPERATIONS funding authority.
- Natural wallet-credit bounce rollback for each of the five allocation roles.
- Retry of the exact role after its failed wallet credit is corrected.

These are committed test cases, not by themselves proof that CI passed on the latest main commit. Exact-head GitHub Actions results must be checked and recorded before this status can be upgraded to tested.

## Release gates

- Exact current-main Tact build and full Sandbox/Jest suite: pending fresh CI evidence.
- Dependency lockfile and reproducible clean install: pending; no `contracts/jetton/package-lock.json` is currently present on main.
- Independent smart-contract and TEP-74/TEP-64 review: pending.
- Independent clean-room build and Master/Wallet code-cell plus StateInit hash reproduction: pending.
- Five destination wallet-control proofs on the intended Mainnet network: pending.
- Final metadata/content approval and signed release manifest: pending.
- Mainnet deployment, issuance, and transfers: not performed and not authorized.

## Safety boundary

No Testnet deployment is included in the current execution path; local TON Sandbox testing is permitted and required. No Mainnet transaction may be signed or broadcast until the exact build, destinations, amounts, fees, network, simulation, and independent review have been presented for explicit Founder approval.

Never request or store seed phrases, private keys, wallet PINs, or recovery codes.
