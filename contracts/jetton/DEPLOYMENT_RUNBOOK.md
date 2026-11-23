# CURRENT CONTROLLING RELEASE ADDENDUM — 2026-11-23

> This addendum governs this runbook. Older historical statements below that conflict with it are superseded and must not be used for signing or funding decisions.

## Current verified repository state

- The controlling economic baseline is now 2,100,000,000 VCOIN with six decimals, allocated 20% Founder / 50% Mining Reserve / 10% Treasury / 10% Liquidity-Market / 10% Ecosystem-Marketing. The exact-head release commit and artifacts must be taken from the latest successful CI run after the 2.1B revision.
- GitHub Actions run #295 (`45117468256`) on commit `b3b707113e0115d5523e0195390248ce142c756c`: `build-and-test` and `deploy-issuer` both succeeded, including Tact compilation, generated unsigned Mainnet preview, Jest Sandbox tests, issuer syntax/sequence guards, artifact upload, and GitHub Pages endpoint verification. Run #296 (`45117536965`) also passed both jobs on commit `1bb1c5de5a6c025a2f8272f6912b0d63ef2de2b1` after stale address predictions were invalidated. Subsequent commits update the migration runner and documentation; use the latest completed exact-head CI run before release.
- The TonConnect issuer Pages deployment is now successful. Do not rely on older run #214 failure notes; they are historical.
- The single approved signer, deployment sender, and TON reserve funder is the Founder wallet. `gasOperatorWallet` must equal `owner`. There is no separate GAS wallet and no sixth VCOIN allocation destination.
- Fixed supply remains exactly 2,100,000,000 VCOIN, six decimals, allocated 20% Founder / 50% Mining Reserve / 10% Treasury / 10% Liquidity-Market / 10% Ecosystem-Marketing. No additional minting is permitted.
- The deployment preview is unsigned and is not evidence of deployment. No Mainnet deployment, issuance, or transfer has been broadcast or confirmed. All earlier predicted Master/Jetton Wallet addresses were invalidated by the 2.1B supply revision and must be regenerated from the latest exact-head build.

## Material reserve limitation

The current Master includes an owner-only `VCoinWithdraw` message. It can return TON only to the Founder/owner address, only for a positive amount, and only when the Master retains the protected 0.25 TON minimum reserve plus the 0.10 TON fee buffer. The current TonConnect issuer does not expose a withdrawal control; any withdrawal must be separately encoded, reviewed and signed by the Founder. Sandbox withdrawal tests are not a live fee quote. Never assume all attached TON is freely withdrawable.

## Release gates remain mandatory

Mainnet remains **NO-GO** until all of the following are evidenced:
1. Pages issuer site is enabled and its published build is checked (or an explicitly approved alternative signing workflow is reviewed).
2. **No Testnet deployment or Testnet rehearsal is part of the approved plan.** Use local compilation, automated tests, Sandbox simulations, and independent review instead; these do not send transactions to Testnet.
3. An independent qualified smart-contract audit covers the Master, Jetton Wallet implementation, bounce/retry logic, TEP-74 behavior, and TEP-64 metadata; all critical/high findings are resolved.
4. The exact reviewed source commit is rebuilt independently and all BOC, StateInit, cell, metadata, and address hashes are reproduced.
5. The five destination addresses and Founder signer/network are checked in the exact deployment preview; post-deployment getters and deterministic Jetton Wallet addresses are independently checked before issuance.
6. Current network fees and reserve requirements are simulated against the exact payloads. The contract's minimum accepted `VCoinFund` message is 0.75 TON, while the current generated unsigned preview requests 1.00 TON to retain an additional reserve margin. The issuer must read this amount from the generated preview rather than hard-code it. Neither figure is a live fee quote; current network fees and reserve sufficiency must be checked against the exact payload.
7. The Founder receives and approves the complete transaction review for each irreversible Mainnet operation.

Never request or store a seed phrase, private key, PIN, or recovery code. The Founder signs in their own wallet. This addendum does not authorize any transaction.

---

# V COIN – TON Jetton Deployment Runbook

**Status:** Implementation candidate; NOT deployed  
**Standard:** TEP-74 Jetton; metadata TEP-64  
**Initial supply:** 2,100,000,000 VCOIN  
**Decimals:** 6  
**Modelled USD reference price:** 0.004 per VCOIN (not a market quote or guarantee)  
**Modelled reference schedule:** 50% annual compound target; 72-hour steps at approximately 0.3338149181% (off-chain model only)  
**Initial supply in base units:** 2100000000000000  
**Release disposition:** **NO-GO for Mainnet** until all gates below are evidenced and separately approved.

## 1. Approved fixed design

- Founder: 420,000,000 VCOIN (20%), credited in one operation; no vesting, time lock, or staged release.
- Mining reserve: 1,050,000,000 VCOIN (50%).
- Treasury: 210,000,000 VCOIN (10%).
- Liquidity / market: 210,000,000 VCOIN (10%).
- Ecosystem / marketing: 210,000,000 VCOIN (10%).
- Six decimals; total supply is 1.0 × 10^16 base units.
- No additional minting after the five exact allocations have completed.
- The five approved allocation destinations are recorded in `docs/WALLET_ALLOCATION_REGISTER.md`; the Founder wallet is one of those five.
- The project owner explicitly confirmed the complete 2,100,000,000 VCOIN supply is to be issued and allocated across all five destinations (Founder 2B, Mining Reserve 5B, Treasury 1B, Liquidity/Market 1B, Ecosystem/Marketing 1B). Do not ask the owner to choose this allocation path again.
- The Founder wallet also serves as GAS & OPERATIONS, a TON-fee funding role only; it is not a sixth VCOIN allocation destination. The previously configured inaccessible GAS address is retired and must never be funded.

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
- Set `gasOperatorWallet` to the Founder address (same address as `owner`). The constructor must permit this shared role while continuing to reject overlap with the other four allocation destinations.
- Confirm the five allocation addresses are distinct and use the intended network representation. The gasOperatorWallet must equal the Founder/owner address exactly.
- Do not infer ownership from an address label. Founder must review and confirm the exact five destination addresses in the deployment preview before signing. No seed phrase, private key, PIN, or recovery code is needed. Each destination Jetton Wallet address must be derived from the deployed Master and compared against the final allocation manifest before issuance.
- After deployment, compare `get_allocation_config` and `get_gas_operator_wallet` against the approved register.

No seed phrase, private key, PIN, or recovery code may be requested or stored.

## 4. Gas reserve and allocation issuance

The Founder wallet, acting in its GAS & OPERATIONS role, deploys the Master and seeds its reserve in the same first internal message: attach the StateInit, send the VCoinFund body, and deliver the exact `unsigned_deploy_message.attached_ton` amount from the freshly generated release preview (currently 1.00 TON). The contract's minimum is 0.75 TON; neither value includes a live fee quote. The Founder wallet retains the separately guarded authority to issue VCOIN through VCoinMint.

After deployment, the Founder wallet is the only VCoinMint authority. Each of the five issuance requests must:
- Target one of the five fixed destinations.
- Carry the exact role amount in base units.
- Include at least 0.01 TON as the request value.
- Be reviewed as a separate transaction before the Founder signs it.

The Master reserve is intended to fund 0.1 TON for each deterministic destination Jetton-wallet credit. Confirm the actual required reserve and fee behavior in the exact-build simulation and transaction preview; do not rely on these documented nominal values as a substitute for a live fee estimate.

After each confirmed credit, reconcile the corresponding Jetton wallet balance and role status. After all five credits succeed, verify total supply equals exactly 1.0 × 10^16 base units and mintable=false. If a natural bounce occurs, verify only the affected role rolled back before retrying it.

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

Local TON Sandbox tests are required but are not sufficient for Mainnet. Under the current Founder instruction, no TON Testnet deployment or Testnet transaction is authorized. The remaining release gates are qualified independent audit, independent clean-room rebuild, live fee/reserve review, exact transaction review, and explicit Founder signatures.

## 6. Mainnet approval and transaction signing

Mainnet deployment and initial issuance are separate, irreversible on-chain operations. The owner has specified the intended amounts and destinations, but Mainnet release remains NO-GO until local Sandbox tests, independent security review, clean-room rebuild/hash reproduction, live fee simulation, and explicit Founder approval are complete. Testnet deployment and transactions are not authorized.

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

- Five allocation destinations: recorded in `docs/WALLET_ALLOCATION_REGISTER.md`; Founder is also the sole GAS & OPERATIONS wallet.
- Five-role allocation logic and natural-bounce/retry test cases: present in current main source and Sandbox test file.
- Exact-head CI: passed on commit `618e397a8a6f97ce76a45043af78acbedbd5ea72` in [GitHub Actions run #111](https://github.com/vahidnemati3544-opsking/v-coin-TON/actions/runs/44990981787); clean `npm ci`, strict dependency audit (zero advisories at all severities), Tact build, TEP-64 content-cell generation, unsigned Mainnet StateInit preview, and all Sandbox tests completed successfully.
- `package-lock.json`: committed to `main`; authoritative CI uses `npm ci` and fails on moderate, high, or critical dependency advisories.
- Master and Jetton Wallet BOCs, five deterministic Jetton Wallet StateInit BOCs, and the metadata content-cell BOC are retained in the exact-head CI artifact. Their file checksums and independently reproduced cell hashes are recorded in `VERIFICATION_STATUS.md`.
- TEP-64 metadata JSON now includes the Founder-approved canonical logo at the public GitHub Pages JPEG URL. The original image bytes are preserved; the repository extension is corrected to `.jpg`, and CI verifies the published image endpoint.
- Predicted Master address and five recipient Jetton Wallet addresses are generated in the unsigned deployment preview; the Master StateInit hash and all five Jetton Wallet StateInit hashes were independently recomputed from their BOCs and matched the address hash bytes.
- Deployment transaction is prepared to be signed by GAS & OPERATIONS wallet with StateInit + VCoinFund body and 0.75 TON minimum attached value. Founder signs five separate VCoinMint allocations after on-chain getter verification. Neither deployment nor issuance has been broadcast.
- Independent security audit: pending.
- Founder review of the exact five owner-provided TON addresses and post-deployment deterministic Jetton Wallet address derivation: pending.
- Historical superseded 10B Master address `EQCvOZBRDK51sk2k1qSWksk6jnhXT11MHquhD06FFLOKrh77` is superseded. The previous 2.1B predicted Master address is invalidated; a new superseded 10B Master address must be generated from the latest exact-head CI preview and is not deployed yet.
- The allocation manifest intentionally contains no predicted recipient Jetton Wallet addresses after the 2.1B revision. Regenerate them from the latest exact-head build and confirm each with the deployed Master's `get_wallet_address` getter before issuance.
- Unsigned deployment preview is generated by `scripts/prepare-mainnet-deployment.ts`; deployment sender is the Founder wallet (also GAS & OPERATIONS), deployment body is VCoinFund, and attached value is taken from the exact generated preview (currently 1.00 TON), plus live wallet/network fees.
- Initial mint and allocation transactions: none recorded.
- Mainnet deployment or issuance: not performed; the owner has confirmed the five-wallet full-supply allocation intent, but no Mainnet transaction is authorized until all release gates pass and the exact transaction is separately approved.

This runbook records implementation and release controls. It is not evidence of deployment, wallet ownership, token issuance, or transaction approval.

## TonConnect signing console

- The signing console source is in `issuer/index.html`; it uses TonConnect UI and pins the required network to Mainnet.
- The deployment action is restricted to the exact registered GAS & OPERATIONS wallet and submits StateInit + VCoinFund with 0.75 TON minimum attached value.
- The five issuance actions are restricted to the exact Founder wallet and each submits one VCoinMint payload separately with 0.01 TON attached. Only one allocation button is enabled at a time; the next is unlocked only after the Founder manually confirms the prior transaction and recipient Jetton Wallet balance on Mainnet.
- Before mint actions are enabled, the Founder must manually confirm that the Master is active on Mainnet and its getters match the approved allocation register.
- The site build artifact is generated by CI. The connected GitHub App cannot create/enable the Pages site because it lacks repository administration permission. The repository owner must set Settings → Pages → Build and deployment → Source = GitHub Actions once. Expected site URL: https://vahidnemati3544-opsking.github.io/v-coin-TON/.
- Do not sign until the wallet screen shows the exact expected signer, Mainnet, Master address, attached TON, and intended message. The UI does not claim transaction finality.


## Action #40 — Founder / GAS & OPERATIONS wallet unification

**Status:** Implementation committed in source/configuration; full exact-head verification and refreshed address artifacts pending. No deployment or transaction has been broadcast.

- Founder wallet is the single approved signer and fee payer for deployment funding (`VCoinFund`) and allocation issuance (`VCoinMint`).
- `gasOperatorWallet` equals `owner`; it remains disallowed from overlapping the other four allocation wallets.
- The old inaccessible GAS wallet is retired and must never be funded or used.
- Five VCOIN allocation wallets and 20/50/10/10/10 allocations remain unchanged; no sixth recipient is introduced.
- The TonConnect issuer must recognize the shared Founder signer for deployment and issuance while retaining the Master-confirmation gate for issuance.
- Regenerated Master StateInit/address and all five Jetton Wallet addresses are recorded in `allocation-manifest.template.json` and were independently hash-reproduced. They remain predictions until Mainnet deployment and getter verification.

## Action #41 — New unsigned Mainnet preview and independent hash reproduction

**Status:** Passed for deterministic build/hash checks; not deployed.

- Latest exact-head CI run #161 on `5e27d36d6a92f0140d249baab7b08ae275539fbe`: Tact compile, dependency audit (zero vulnerabilities), metadata build, unsigned preview generation, and all 16 Jest tests passed.
- Master predicted address: `EQBDbY_0r9XTVCQjH3aw8bfQtF4eoOV6QdFJEJTBMtw6_pIJ`; StateInit hash `436d8ff4afd5d35424231f76b0f1b7d0b45e1ea0e57a41d1491094c132dc3afe`.
- All five predicted Jetton Wallet addresses and StateInit hashes are recorded in `contracts/jetton/allocation-manifest.template.json`.
- Independent BOC parser reproduced the Master and five wallet hashes, checked the Master and wallet code hashes, and verified the hash bytes plus CRC16 checksums of all six friendly addresses.
- Third-party audit, independent clean-room rebuild, live fee simulation, on-chain deployment, and allocation remain outstanding. Testnet deployment/transactions are not authorized.

## Action #42 — Founder-only GAS enforcement and sequential issuance controls

- The Master constructor now enforces `gasOperatorWallet == owner`; the Founder address is the only permitted GAS & OPERATIONS signer.
- The old inaccessible GAS address is retired and must never be funded or used.
- Sandbox coverage rejects a constructor configuration with a separate GAS wallet.
- The TonConnect console locks a submitted deployment request for the page session and serializes the five mint requests. The Founder must manually confirm each on-chain balance and role status before the next mint is enabled.
- Exact-head run #173 build-and-test and issuer syntax/safety checks passed. New Master and Jetton Wallet previews, with independently reproduced hashes and address checksums, are in `contracts/jetton/allocation-manifest.template.json`.
- No Mainnet deployment, mint, or token credit has occurred. External audit, clean-room rebuild and live fee simulation remain required; Testnet deployment/transactions are not authorized.
