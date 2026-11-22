# V COIN – TON Jetton Deployment Runbook

**Status:** Implementation candidate; NOT deployed  
**Standard:** TEP-74 Jetton; metadata TEP-64  
**Initial supply:** 10,000,000,000 VCOIN  
**Decimals:** 6  
**Initial supply in base units:** 10000000000000000  
**Release disposition:** **NO-GO for Mainnet** until all gates below are evidenced and separately approved.

## 1. Approved fixed design

- Founder: 2,000,000,000 VCOIN (20%), credited in one operation; no vesting, time lock, or staged release.
- Mining reserve: 5,000,000,000 VCOIN (50%).
- Treasury: 1,000,000,000 VCOIN (10%).
- Liquidity / market: 1,000,000,000 VCOIN (10%).
- Ecosystem / marketing: 1,000,000,000 VCOIN (10%).
- Six decimals; total supply is 10^16 base units.
- No additional minting after the five exact allocations have completed.
- The five approved allocation destinations are recorded only in `docs/WALLET_ALLOCATION_REGISTER.md`.
- The separate GAS & OPERATIONS wallet is a TON-fee funding source only; it is not a sixth VCOIN allocation destination.

The implementation must enforce the cap and per-role amounts in contract code, not merely in deployment scripts. No hidden freeze, confiscation, arbitrary clawback, or post-transfer seizure functionality is permitted.

## 2. Current source behavior

The current Tact source is `contracts/jetton/src/vcoin.tact`. Its constructor order is documented in `contracts/jetton/allocation/INIT_PARAMETERS.md`:

```text
VCoinMaster(
  owner,
  content,
  miningReserveWallet,
  treasuryWallet,
  liquidityWallet,
  ecosystemWallet,
  gasOperatorWallet
)
```

The contract fixes the five allocation destinations in StateInit, rejects duplicate allocation addresses and overlap with the gas operator, accepts VCoinMint only from the Founder/owner, and accepts only the exact amount for the matching role. Each role can be issued once. The Master sets mintable=false after all five role flags are complete.

A failed wallet credit is expected to return as a natural bounce from the deterministic Jetton wallet. The contract validates the sender and amount, rolls back only the matching role, and permits that exact role to be retried. The current Sandbox test file contains cases for each role's natural bounce and retry. These tests must still pass in CI on the exact reviewed commit; source presence alone is not a CI result.

## 3. Wallet and constructor controls

- Read the five allocation destinations from `docs/WALLET_ALLOCATION_REGISTER.md`; do not reorder them by table row number.
- Set `owner` to the Founder allocation address.
- Set `miningReserveWallet`, `treasuryWallet`, `liquidityWallet`, and `ecosystemWallet` to their corresponding registered addresses.
- Set `gasOperatorWallet` to the separately registered GAS & OPERATIONS address.
- Confirm all six addresses are distinct and use the intended network representation.
- Do not infer ownership from an address label. Complete a safe wallet-control proof for every allocation destination before issuance.
- After deployment, compare `get_allocation_config` and `get_gas_operator_wallet` against the approved register.

No seed phrase, private key, PIN, or recovery code may be requested or stored.

## 4. Gas reserve and allocation issuance

The separate GAS & OPERATIONS wallet may send VCoinFund with at least 0.75 TON to seed the Master reserve. It cannot issue VCOIN.

The Founder wallet is the only VCoinMint authority. Each issuance request must:
- Target one of the five fixed destinations.
- Carry the exact role amount in base units.
- Include at least 0.01 TON as the request value.
- Be reviewed as a separate transaction before the Founder signs it.

The Master reserve is intended to fund 0.1 TON for each deterministic destination Jetton-wallet credit. Confirm the actual required reserve and fee behavior in the exact-build simulation and transaction preview; do not rely on these documented nominal values as a substitute for a live fee estimate.

After each confirmed credit, reconcile the corresponding Jetton wallet balance and role status. After all five credits succeed, verify total supply equals exactly 10^16 base units and mintable=false. If a natural bounce occurs, verify only the affected role rolled back before retrying it.

## 5. Build and verification gates

Before any deployment:
1. Freeze the exact source commit and record the commit SHA.
2. Pin the compiler and dependencies; create and commit a lockfile, then use a clean reproducible install.
3. Run the Tact build and all TON Sandbox tests on that exact commit.
4. Verify negative, authorization, duplicate, amount-cap, allocation, retry, and natural-bounce cases.
5. Independently review TEP-74 Jetton Wallet behavior and TEP-64 metadata.
6. Produce Master and Wallet BOCs, compiler/toolchain provenance, code-cell hashes, StateInit hashes, deterministic addresses, metadata hash, and a signed release manifest.
7. Rebuild independently and compare all hashes.
8. Obtain a qualified independent smart-contract security audit and resolve every critical/high finding.
9. Verify control of all five destination wallets on the intended Mainnet network.

Local TON Sandbox tests are part of the required verification. No Testnet deployment is included in the current execution path.

## 6. Mainnet approval and transaction signing

Mainnet deployment and initial issuance are separate, irreversible on-chain operations and are not authorized by this runbook.

Before requesting any Founder signature, present one complete transaction review containing:
- Exact network and wallet to be used.
- Exact contract address or StateInit deployment details.
- Recipient and amount in human-readable VCOIN and base units.
- Attached TON value, estimated fees, and required reserve.
- Expected state change and post-transaction checks.
- Exact reviewed source commit, artifact hashes, and independent audit status.
- Clear explanation of irreversibility and any residual risk.

The Founder personally reviews and signs in the wallet only after explicit readiness is announced and the complete transaction details are confirmed. Never ask for a seed phrase or private key. A confirmed transfer to an independently controlled address cannot be reversed.

## 7. Current evidence record

- Five allocation destinations and separate fee wallet: recorded in `docs/WALLET_ALLOCATION_REGISTER.md`.
- Five-role allocation logic and natural-bounce/retry test cases: present in current main source and Sandbox test file.
- Exact-head CI: passed on commit `4458760becbd9f7a37b1ffa85695999bdf73cfe4` in [GitHub Actions run #78](https://github.com/vahidnemati3544-opsking/v-coin-TON/actions/runs/44988982989); audit report recorded zero vulnerabilities.
- Generated `package-lock.json`: preserved in the CI artifact but not yet committed to `main`; committing it and rerunning CI remains a release gate.
- Master and Jetton Wallet BOCs: retained in the CI artifact; BOC file checksums are recorded in `VERIFICATION_STATUS.md`. TON cell hashes, StateInit hashes, and independent reproduction remain pending.
- TEP-64 metadata package/content cell and immutable URI: pending; do not deploy with placeholder or empty metadata.
- Independent security audit: pending.
- Wallet-control proofs: pending.
- Jetton Master address and deployment transaction: none recorded.
- Initial mint and allocation transactions: none recorded.
- Mainnet deployment or issuance: not performed; not authorized.

This runbook records implementation and release controls. It is not evidence of deployment, wallet ownership, token issuance, or transaction approval.
