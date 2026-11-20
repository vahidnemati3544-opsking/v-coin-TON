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

Latest GitHub Actions run: **80 tests passed in 8 files**, build passed, static checks passed, and formatting passed:
https://github.com/vahidnemati3544-opsking/v-coin-TON/actions/runs/44722388462

The suite includes the pinned Jetton protocol tests, eight pure VCOIN policy tests, and five VCOIN minter emulator integration tests covering non-admin rejection, rejection of a sixth destination, exact one-time allocation, rejection of partial/over-allocation, and finalization only after all five wallet credits are acknowledged.

## VCOIN-specific contract design currently implemented

- Separate `VcoinMinter` and `VcoinJettonWallet`; standard upstream `JettonMinter` and `JettonWallet` are preserved unchanged.
- Fixed supply ceiling: 10,000,000,000 VCOIN, six decimals, 10^16 base units.
- Five allocation ceilings: Founder 2B; Mining 5B; Treasury 1B; Liquidity 1B; Ecosystem/Marketing 1B.
- Four destination owner addresses are compiled into the minter. Treasury owner is supplied in the initial minter storage and has no public update operation.
- Each allocation can be minted once, for its exact full amount. Only one allocation mint may be pending at a time.
- The VCOIN wallet sends an authenticated credit acknowledgement. The minter binds the acknowledgement and bounce handling to the pending allocation and query ID; bounce rollback also checks the derived destination wallet.
- Lifetime issuance increases only after wallet credit acknowledgement. Burns reduce circulating total supply but do not reopen allocation capacity.
- Admin can change metadata before finalization. Admin is irreversibly dropped only after all five exact allocation credits are confirmed.

## Deployment blockers — do not deploy yet

1. **Founder vesting is not implemented.** The current founder allocation would be credited directly to the founder owner address. Four-year vesting must be implemented as a separate escrow/vesting mechanism after the start date, cliff, and release cadence are confirmed.
2. Mining reserve distribution/escrow and its minimum two-year schedule are not implemented.
3. The deployment storage initializer, verified treasury owner address, final metadata URI/content, admin address, and TON gas budget must be reviewed and pinned.
4. VCOIN-specific bounce/replay edge cases need additional adversarial tests, including acknowledgement failure and retries; emulator success is not a substitute for an independent security audit.
5. Testnet deployment, explorer verification, and end-to-end wallet tests have not yet been performed.

**No Testnet or Mainnet deployment has been performed.** Mainnet issuance remains prohibited until the remaining contract work, independent audit, legal review, Testnet verification, and the owner's explicit final approval are complete.
