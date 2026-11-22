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

- Latest reviewed main commit: `fa795093af7a0e2816a9aad66208fc68626c533b`.
- The Jetton workflow completed successfully on this exact commit in run #397: [GitHub Actions run #397](https://github.com/vahidnemati3544-opsking/v-coin-TON/actions/runs/44989365249).
- The observed steps were checkout, Node 22 setup, `npm install`, Tact build, and Jest tests; all completed successfully.
- Important limitation: this workflow does **not** run `npm ci`, does not run an audit step, and did not publish a build artifact in run #397. Therefore this success confirms build and tests on the exact head, but does not establish a reproducible locked dependency install, a fresh vulnerability audit, or retained BOC outputs.
- The repository's `contracts/jetton/` directory currently has no committed `package-lock.json`.
- Earlier run #79 on commit `eedb618add19a7305ef7b3f3caeccfbd6a8b97bd` reported a zero-vulnerability audit and generated BOCs, but those are earlier-commit evidence only and must not be treated as exact-head audit or artifact evidence for the current main commit.
- The five-wallet full-supply allocation intent is confirmed by the project owner and recorded in the deployment config, allocation manifest, runbook, wallet register, and this status document. This confirmation is not transaction authorization.

## Remaining Mainnet release gates

- Generate and commit a reviewed `package-lock.json`; change the Jetton workflow to use `npm ci`; rerun exact-head CI and retain build artifacts: pending.
- Independent smart-contract and TEP-74/TEP-64 review: pending.
- Independent clean-room build and TON cell-hash / StateInit hash reproduction: pending. The SHA-256 values above are file checksums only and must not be represented as TON cell hashes.
- Confirm all five allocation destination addresses and separate gas wallet against the final deployment constructor inputs; verify wallet control for the intended Mainnet network: pending.
- Create and approve a valid TEP-64 metadata package/content cell using the canonical logo only after verifying its actual file format and integrity; generate metadata hash and signed release manifest: pending.
- Mainnet deployment, issuance, and transfers: not performed; explicit per-transaction Founder approval remains required.

## Additional concrete blockers confirmed on current main

- The only logo asset directory entries are the canonical logo lock, the logo file, and the lock document. No approved `metadata.json`, metadata URI, or assembled TEP-64 content cell is present in the Jetton package.
- The canonical logo is stored as `vcoin-canonical-logo.png`, but its recorded Base64 signature begins with JPEG bytes (`FF D8 FF`). Its actual format and full integrity have not been independently verified. Do not publish it as PNG or build metadata around an unverified asset.
- The current workflow uses `npm install` rather than a lockfile-backed clean install and does not retain BOC artifacts on the latest run.
- No deployed Master address, deterministic Jetton wallet addresses, TON cell hashes, StateInit hashes, or on-chain balances exist in the repository evidence.

## Safety boundary

No Testnet deployment is included in the current execution path; local TON Sandbox testing is permitted and required. No Mainnet transaction may be signed or broadcast until the exact build, destinations, amounts, fees, network, simulation, and independent review have been presented for explicit Founder approval.

Never request or store seed phrases, private keys, wallet PINs, or recovery codes.

## Founder-confirmed issuance scope — 2026-11-22

The project owner explicitly confirmed that the full fixed supply of 10,000,000,000 VCOIN is to be issued and allocated directly across all five registered Mainnet allocation wallets: Founder 2,000,000,000; Mining Reserve 5,000,000,000; Treasury 1,000,000,000; Liquidity/Market 1,000,000,000; Ecosystem/Marketing 1,000,000,000. The Founder wallet is one of these five allocation wallets, not an additional destination. The separate GAS & OPERATIONS wallet is not an allocation wallet. Do not ask the owner to choose between partial Founder-only issuance and five-wallet allocation again.

This is confirmation of the intended allocation plan, not a signature authorization. Deployment, issuance, and each Mainnet transaction remain blocked until technical release gates pass and exact transaction details are presented for the Founder's informed approval and wallet signature.
