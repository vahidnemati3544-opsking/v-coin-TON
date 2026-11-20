# V COIN–TON Jetton Deployment Inventory

**Document ID:** VCT-JETTON-INV-001  
**Reviewed:** 2026-11-20  
**Scope:** `vahidnemati3544-opsking/v-coin-TON` only  
**Result:** **SOURCE ADDED — BUILD/TEST VERIFICATION PENDING — NOT DEPLOYABLE.**

## Current repository state

1. A first-pass Tact source package has now been added under `contracts/jetton/src/`:
   - `messages.tact`
   - `jetton.tact`
   - `vcoin.tact`
2. The master source encodes a 10,000,000,000 VCOIN hard cap at six decimals (10^16 base units), owner-authorized minting, and disables minting when the cap is reached.
3. A Tact build configuration, npm package manifest, Jest configuration, arithmetic supply-policy tests, and GitHub Actions workflow have been added.
4. The GitHub Actions run for commit `354360922de196754237b11380243e522f51c5e6` was observed in progress at the last check: dependency installation had not yet completed. Therefore compilation and test success are **not confirmed**.
5. The current tests are supply-policy arithmetic tests only. They are not a full TON Sandbox integration suite and do not prove Jetton message flows, wallet derivation, bounce handling, gas sufficiency, or adversarial behavior.
6. No verified VCOIN master address, deployment transaction, Testnet issuance, or Mainnet issuance exists in the evidence reviewed here.

## Important implementation limitations

- The current source is a first-pass implementation, not an audited production contract.
- The master enforces the global supply cap, but it does not yet enforce each of the five allocation-specific ceilings/destinations on-chain.
- Founder four-year vesting is not enforced by a vesting contract in this source package.
- Metadata content immutability, owner handover/renunciation policy, and the final admin custody model require explicit review.
- The Jetton wallet transfer/burn message flows require full compiler, emulator and independent security testing before any deployment.
- The current source must not be used to issue or transfer real-value tokens.

## Required verification gates

1. GitHub Actions build must complete successfully; fix every compiler/test failure.
2. Add TON Sandbox integration tests for mint authorization, supply cap, permanent mint disable, transfers, burns, bounce recovery, wallet derivation, and invalid message senders.
3. Add and verify allocation-specific mint controls and the founder vesting mechanism, or explicitly approve a separately audited custody/vesting design.
4. Pin compiler/dependency versions with a lockfile and produce reproducible build artifacts.
5. Conduct independent smart-contract security review and resolve findings.
6. Deploy to TON Testnet only after the above gates and with owner-controlled wallet signing; verify master and five holder Jetton wallets on the matching network.
7. Mainnet remains disabled until separate legal/security review and explicit final owner authorization.

## Safety rules

- Never substitute a generic Jetton, USDT master, example token or per-user Jetton wallet address for the VCOIN master.
- Token name, ticker, logo and metadata alone do not authenticate a Jetton.
- Do not deploy to Mainnet, mint, transfer real-value assets or activate mining as part of this inventory task.
- Never ask for or store wallet seed phrases/private keys. Wallet signing stays in the wallet interface.
- Until the master and network are verified, wallet-balance mining and payouts remain blocked.

## Official technical reference

TON Jettons use one master contract and a separate Jetton wallet contract per owner. Verification must bind each owner's Jetton wallet to the approved master address; metadata is not identity proof.
