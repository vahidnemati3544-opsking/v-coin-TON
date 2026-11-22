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
- The five approved allocation destinations are recorded in `docs/WALLET_ALLOCATION_REGISTER.md`; the Founder wallet is one of those five.
- The project owner explicitly confirmed the complete 10,000,000,000 VCOIN supply is to be issued and allocated across all five destinations (Founder 2B, Mining Reserve 5B, Treasury 1B, Liquidity/Market 1B, Ecosystem/Marketing 1B). Do not ask the owner to choose this allocation path again.
- The separate GAS & OPERATIONS wallet is a TON-fee funding source only; it is not a sixth VCOIN allocation destination.

The implementation must enforce the cap and per-role amounts in contract code, not merely in deployment scripts. No hidden freeze, confiscation, arbitrary clawback, or post-transfer seizure functionality is permitted. After a successful credit, the Master contract has no method to pull tokens back from a recipient Jetton Wallet. Normal TEP-74 transfers remain under the holder's wallet authority; the Founder cannot reverse a completed transfer or confiscate a holder's balance.

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
- Do not infer ownership from an address label. Founder must review and confirm the exact five destination addresses in the deployment preview before signing. No seed phrase, private key, PIN, or recovery code is needed. Each destination Jetton Wallet address must be derived from the deployed Master and compared against the final allocation manifest before issuance.
- After deployment, compare `get_allocation_config` and `get_gas_operator_wallet` against the approved register.

No seed phrase, private key, PIN, or recovery code may be requested or stored.

## 4. Gas reserve and allocation issuance

The separate GAS & OPERATIONS wallet may deploy the Master and seed its reserve in the same first internal message: attach the StateInit, send the VCoinFund body, and deliver at least 0.75 TON to the predicted Master address. This makes the deployment transaction both activate the contract and fund its initial reserve. The GAS & OPERATIONS wallet cannot issue VCOIN.

After deployment, the Founder wallet is the only VCoinMint authority. Each of the five issuance requests must:
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
5. Independently review TEP-74 Jetton Wallet behavior and TEP-64 metadata. The committed `contracts/jetton/metadata.json` currently provides name, symbol, description, and six decimals; its immutable commit-pinned URI and off-chain content cell are generated by `scripts/build-metadata-cell.cjs`.
6. Produce Master and Wallet BOCs, compiler/toolchain provenance, code-cell hashes, StateInit hashes, deterministic addresses, metadata hash, and a signed release manifest.
7. Rebuild independently and compare all hashes.
8. Obtain a qualified independent smart-contract security audit and resolve every critical/high finding.
9. Founder verifies all five owner-provided destination addresses in the signed deployment preview; derive each deterministic Jetton Wallet address from the deployed Master and compare it to the allocation manifest.

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
- Exact-head CI: passed on commit `618e397a8a6f97ce76a45043af78acbedbd5ea72` in [GitHub Actions run #111](https://github.com/vahidnemati3544-opsking/v-coin-TON/actions/runs/44990981787); clean `npm ci`, strict dependency audit (zero advisories at all severities), Tact build, TEP-64 content-cell generation, unsigned Mainnet StateInit preview, and all Sandbox tests completed successfully.
- `package-lock.json`: committed to `main`; authoritative CI uses `npm ci` and fails on moderate, high, or critical dependency advisories.
- Master and Jetton Wallet BOCs, five deterministic Jetton Wallet StateInit BOCs, and the metadata content-cell BOC are retained in the exact-head CI artifact. Their file checksums and independently reproduced cell hashes are recorded in `VERIFICATION_STATUS.md`.
- TEP-64 metadata JSON and immutable commit-pinned URI are present. The canonical logo is not embedded because its stored `.png` file has JPEG signature bytes and the locked original must not be altered.
- Predicted Master address and five recipient Jetton Wallet addresses are generated in the unsigned deployment preview; the Master StateInit hash and all five Jetton Wallet StateInit hashes were independently recomputed from their BOCs and matched the address hash bytes.
- Deployment transaction is prepared to be signed by GAS & OPERATIONS wallet with StateInit + VCoinFund body and 0.75 TON minimum attached value. Founder signs five separate VCoinMint allocations after on-chain getter verification. Neither deployment nor issuance has been broadcast.
- Independent security audit: pending.
- Founder review of the exact five owner-provided TON addresses and post-deployment deterministic Jetton Wallet address derivation: pending.
- Predicted Mainnet Master address from the verified StateInit: `EQCvOZBRDK51sk2k1qSWksk6jnhXT11MHquhD06FFLOKrh77`; it is not deployed yet.
- Predicted deterministic recipient Jetton Wallet addresses are recorded in `contracts/jetton/allocation-manifest.template.json`; they were derived from the same Master address and independently hash-checked. Confirm each with the deployed Master's `get_wallet_address` getter before issuance.
- Unsigned deployment preview is generated by `scripts/prepare-mainnet-deployment.ts`; deployment sender is the separate GAS & OPERATIONS wallet, deployment body is VCoinFund, attached value is 0.75 TON minimum, plus wallet/network fees.
- Initial mint and allocation transactions: none recorded.
- Mainnet deployment or issuance: not performed; the owner has confirmed the five-wallet full-supply allocation intent, but no Mainnet transaction is authorized until all release gates pass and the exact transaction is separately approved.

This runbook records implementation and release controls. It is not evidence of deployment, wallet ownership, token issuance, or transaction approval.

## TonConnect signing console

- The signing console source is in `issuer/index.html`; it uses TonConnect UI and pins the required network to Mainnet.
- The deployment action is restricted to the exact registered GAS & OPERATIONS wallet and submits StateInit + VCoinFund with 0.75 TON minimum attached value.
- The five issuance actions are restricted to the exact Founder wallet and each submits one VCoinMint payload separately with 0.01 TON attached.
- Before mint actions are enabled, the Founder must manually confirm that the Master is active on Mainnet and its getters match the approved allocation register.
- The site build artifact is generated by CI. The connected GitHub App cannot create/enable the Pages site because it lacks repository administration permission. The repository owner must set Settings → Pages → Build and deployment → Source = GitHub Actions once. Expected site URL: https://vahidnemati3544-opsking.github.io/v-coin-TON/.
- Do not sign until the wallet screen shows the exact expected signer, Mainnet, Master address, attached TON, and intended message. The UI does not claim transaction finality.

