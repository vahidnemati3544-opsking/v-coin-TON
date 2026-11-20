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
```

Latest workflow history includes successful Acton builds, the 85-test emulator suite, and static checks on the draft escrow implementation. Final formatting CI is still being reconciled; do not treat an earlier passing test run as final branch verification. Check the current Actions runs before merging:
https://github.com/vahidnemati3544-opsking/v-coin-TON/actions

The suite includes the pinned Jetton protocol tests, VCOIN issuance policy tests, exact one-time allocation tests, deterministic deployment/readiness tests for both escrow instances, founder and mining reserve deposit acknowledgements, unauthorized/premature release rejection, monotonic release query replay rejection, and linear vesting/rounding boundary tests.

## VCOIN-specific contract design in the draft security branch

- Separate `VcoinMinter`, `VcoinJettonWallet`, and `VcoinVestingEscrow`; standard upstream `JettonMinter` and `JettonWallet` are preserved unchanged.
- Fixed supply ceiling: 10,000,000,000 VCOIN, six decimals, 10^16 base units.
- Five allocation ceilings: Founder 2B; Mining 5B; Treasury 1B; Liquidity 1B; Ecosystem/Marketing 1B.
- Two deterministic instances of `VcoinVestingEscrow` are derived and deployed by the minter after one-time start-time configuration: Founder 2B over 1,461 days and Mining Reserve 5B over 730 days.
- The minter requires both escrow deployment acknowledgements before any allocation mint. Founder and Mining mints are routed only to their escrow addresses, and their issuance status is finalized only after the escrow confirms the exact Jetton deposit.
- The immutable original minter administrator is the escrow release controller. The deployment template requires this administrator to be the Founder wallet.
- Escrows enforce fixed beneficiary, allocation amount, and duration by vesting kind; linear integer accrual; monotonic release query IDs; transfer-success confirmation from the beneficiary Jetton wallet; and bounce/failure recovery. No admin bypass, arbitrary unlock, beneficiary substitution, or emergency withdrawal exists.
- Each non-vesting allocation remains exact and one-time. Lifetime issuance is independent of circulating supply; burns do not reopen allocation capacity.
- Admin can change metadata before finalization. Admin is irreversibly dropped only after all five exact allocation credits are confirmed.

## Deployment blockers — do not deploy yet

1. PR #4 remains Draft and is not merged. The current implementation must complete final CI, including formatting, before it is considered build-verified.
2. The deployment configuration must set the minter's original administrator to the Founder wallet, and the one-time escrow start timestamp must be explicitly approved.
3. Final metadata URI/content, treasury owner, wallet-control proof, derived escrow addresses, and TON gas budget must be reviewed and pinned.
4. Additional adversarial tests for release bounce/retry, authorization, replay, and message authentication plus an independent security audit remain mandatory.
5. Testnet deployment, explorer verification, and end-to-end Tonkeeper wallet tests have not yet been performed.

**No Testnet or Mainnet deployment has been performed.** Mainnet issuance remains prohibited until final CI, independent audit, legal review, Testnet verification, and the owner's explicit final approval are complete.
