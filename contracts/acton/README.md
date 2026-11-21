# V COIN–TON Acton/Tolk Jetton Core

This isolated Acton project vendors the pinned TON reference Jetton v2.1 implementation and adds a separate VCOIN-specific minter and wallet. The upstream reference contracts remain unchanged.

## Upstream provenance

- Repository: https://github.com/ton-blockchain/acton-contracts
- Pinned upstream commit: `d721c3179696b453a9490fcfd2f30770f8c234b4`
- Upstream package: `jetton-v2.1`
- Acton toolchain: `1.2.0`
- License: MIT (upstream repository)

The source is kept under `contracts/acton/` and does not overwrite or merge with the legacy Tact project under `contracts/jetton/`.

## Build and verification

Run from this directory with Acton 1.2.0:

```bash
acton build
acton test jetton-v2.1/tests vcoin-policy/tests
acton check
acton fmt --check
acton script scripts/deploy-vcoin-minter.tolk
```

The latest verified contract-test revision is `c72c0984399934611c2ff585a35124b60a2243c8`; it passes the Acton build, **90 emulator tests across 9 files**, static checks, formatting, and local deployment-script emulation. GitHub Actions run [44864348884](https://github.com/vahidnemati3544-opsking/v-coin-TON/actions/runs/44864348884). Local emulation does not broadcast a real transaction and does not prove Mainnet readiness. The owner has directed that the project proceed toward Mainnet without a Testnet deployment; that preference does not waive the remaining adversarial tests, independent security audit, verification that the selected broadcast network is Mainnet, wallet-control proofs, or final transaction review:
https://github.com/vahidnemati3544-opsking/v-coin-TON/actions

The suite includes the pinned Jetton protocol tests, VCOIN issuance policy tests, exact one-time allocation tests, deterministic deployment/readiness tests for both escrow instances, founder and mining reserve deposit acknowledgements, unauthorized release rejection, and linear vesting/rounding boundary tests. The contract enforces monotonically increasing release query IDs and bounce/failure rollback paths. The suite now includes a successful release trace and a VCOIN-specific failure/retry test using a protocol-valid RichBounceBody. A naturally generated downstream TVM bounce is still not exercised end-to-end; a forged success acknowledgement from an unrelated sender is rejected; a failure acknowledgement with an amount mismatch cannot clear a pending release; and replaying a confirmed escrow-deposit acknowledgement cannot credit issuance twice. Broader pending-state cleanup and balance/query-ID invariant tests remain required before deployment.

## VCOIN-specific contract design in the draft security branch

- Separate `VcoinMinter`, `VcoinJettonWallet`, and `VcoinVestingEscrow`; standard upstream `JettonMinter` and `JettonWallet` are preserved unchanged.
- Fixed supply ceiling: 10,000,000,000 VCOIN, six decimals, 10^16 base units.
- Five allocation ceilings: Founder 2B; Mining 5B; Treasury 1B; Liquidity 1B; Ecosystem/Marketing 1B.
- Two deterministic instances of `VcoinVestingEscrow` are derived and deployed by the minter after one-time start-time configuration: Founder 2B over 1,461 days and Mining Reserve 5B over 730 days.
- The minter requires both escrow deployment acknowledgements before any allocation mint. Founder and Mining mints are routed only to their escrow addresses, and their issuance status is finalized only after the escrow confirms the exact Jetton deposit.
- The escrow release controller is fixed in code to the Founder wallet with no admin override. The deployment template requires the minter administrator to be the Founder wallet because it authorizes the one-time start-time configuration.
- Escrows enforce fixed beneficiary, allocation amount, and duration by vesting kind; linear integer accrual; monotonic release query IDs; transfer-success confirmation from the beneficiary Jetton wallet; and bounce/failure recovery. No admin bypass, arbitrary unlock, beneficiary substitution, or emergency withdrawal exists.
- Each non-vesting allocation remains exact and one-time. Lifetime issuance is independent of circulating supply; burns do not reopen allocation capacity.
- Admin can change metadata before finalization. Admin is irreversibly dropped only after all five exact allocation credits are confirmed.

## Deployment blockers — do not deploy yet

1. PR #4 remains Draft and is not merged. The current implementation must complete final CI, including formatting, before it is considered build-verified.
2. The deployment configuration must set the minter's original administrator to the Founder wallet, and the one-time escrow start timestamp must be explicitly approved.
3. Final metadata URI/content, treasury owner, wallet-control proof, derived escrow addresses, and TON gas budget must be reviewed and pinned.
4. Additional adversarial tests for release bounce/retry, authorization, replay, and message authentication plus an independent security audit remain mandatory.
5. The deployment entrypoints in `Acton.toml` specify the built-in Mainnet selector: `acton run deploy-mainnet` or `acton run deploy-mainnet-tonconnect`. This is a command-level pin, not an independent runtime proof of network identity: `net.isBroadcasting()` only reports whether broadcasting is enabled. Do not invoke the raw script with an arbitrary `--net` value. Before any broadcast, verify the exact command and Mainnet network shown by the connected wallet in TON Connect, then review the full transaction. A stronger fail-closed network identity check remains a release gate. Final metadata, escrow start timestamp, derived escrow addresses, wallet-control proofs, and TON fee budget also remain unverified.

**No Testnet or Mainnet deployment has been performed.** The owner has chosen to omit Testnet. Mainnet deployment remains on hold until the Mainnet network guard, outstanding adversarial tests, independent audit, legal review, final deployment package, wallet-control proofs, and the owner's explicit approval are complete.

## Mainnet network-selection evidence and operator guard

The Acton 1.2 deployment documentation defines `--net <network>` as the selector for the real network and documents `net.isBroadcasting()` only as a check for local-emulation versus broadcast mode. It does not document a Tolk runtime getter that independently returns the selected network identity. Therefore, the contract script must not claim that `net.isBroadcasting()` proves Mainnet. The named `deploy-mainnet` and `deploy-mainnet-tonconnect` entries in `Acton.toml` remain the command-level network pin.

Before any Mainnet signature, the operator must independently verify all of the following in the same execution session:

1. The exact command is one of the named Mainnet entries; do not run the raw deployment script with a manually supplied network value.
2. Acton reports the Mainnet target for that run, and the connected TON Connect wallet itself displays Mainnet (not Testnet or a custom network).
3. The wallet address is the approved Founder deployer address and is independently checked against the intended address; never infer wallet identity from a display name.
4. The complete outgoing transaction, destination, attached TON value, initialization data, and derived escrow addresses are reviewed before the wallet signature.
5. Abort if the CLI target, wallet network, wallet address, or transaction preview disagree or are ambiguous.

Official Acton references: [Interacting with the real blockchain](https://ton-blockchain.github.io/acton/docs/scripting/blockchain-interaction), [Deployment](https://ton-blockchain.github.io/acton/docs/deploy), and [Acton.toml network configuration](https://ton-blockchain.github.io/acton/docs/acton-toml). These references establish the CLI network-selection behavior; they do not establish a contract-level Mainnet identity API. This is an operator verification gate, not an on-chain network guard.
