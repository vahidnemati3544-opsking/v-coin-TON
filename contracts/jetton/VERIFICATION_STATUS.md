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

## Latest exact-head CI evidence — 2026-11-22

- Commit: `a53ba80f5655b44acdf51420a683f9c3a4a2334e`.
- GitHub Actions run: [run #74](https://github.com/vahidnemati3544-opsking/v-coin-TON/actions/runs/44988760989), event `push`, conclusion `success`.
- All verification steps completed successfully: lockfile generation, clean `npm ci`, dependency audit gate, Tact compilation, and Jest Sandbox suite.
- The audit report in the uploaded CI artifact reports 0 vulnerabilities (0 info, 0 low, 0 moderate, 0 high, 0 critical).
- The CI artifact contains Master and Jetton Wallet code BOCs. SHA-256 of the serialized artifact files (not TON cell hashes): Master `149044c6850f4a8116c0673a02a72247660831ad4fbf87fd486958a3eddfcaf1`; Jetton Wallet `8373d9e5318314563ea6d140e1bbb3aa18240cf8f261bdeb5b94d73c903778a0`.
- Generated `package-lock.json` SHA-256: `e386d60a3a83b1d3fc033264cc422c7bc3f5d1f4507ee373d1d939c82953d4ba`. It is preserved in the CI artifact; it is not yet committed to `main`.

## Remaining Mainnet release gates

- Commit the generated lockfile to `main` and confirm a fresh exact-head CI run: pending.
- Independent smart-contract and TEP-74/TEP-64 review: pending.
- Independent clean-room build and TON cell-hash / StateInit hash reproduction: pending. The SHA-256 values above are file checksums only and must not be represented as TON cell hashes.
- Confirm all five allocation destination addresses and separate gas wallet against the final deployment constructor inputs; verify wallet control for the intended Mainnet network: pending.
- Final metadata/content approval and signed release manifest: pending.
- Mainnet deployment, issuance, and transfers: not performed; explicit per-transaction Founder approval remains required.

## Safety boundary

No Testnet deployment is included in the current execution path; local TON Sandbox testing is permitted and required. No Mainnet transaction may be signed or broadcast until the exact build, destinations, amounts, fees, network, simulation, and independent review have been presented for explicit Founder approval.

Never request or store seed phrases, private keys, wallet PINs, or recovery codes.
