# V COIN–TON Comprehensive Correction and Release Bundle — Action #53

**Date:** 2026-11-22  
**Repository:** `vahidnemati3544-opsking/v-coin-TON`  
**Branch:** `main`  
**Exact source snapshot / CI commit:** `90c0d71adbfb3dbe8b645958eda0e4deb598bd86`  
**CI run:** [45063673730](https://github.com/vahidnemati3544-opsking/v-coin-TON/actions/runs/45063673730)  
**Disposition:** Corrections committed; full source + build bundle assembled and integrity-tested; Pages deployment succeeded; Mainnet remains NO-GO.

## 1. Critical implementation corrections

### 1.1 TonConnect deployment value now comes from the exact preview

The issuer previously hard-coded `750000000` nanotons (0.75 TON) even though the current generated unsigned Mainnet preview requests 1.00 TON. This mismatch has been corrected:

- The issuer parses `unsigned_deploy_message.attached_ton` from the exact CI-generated preview.
- It converts the decimal TON value to nanotons using integer `BigInt` arithmetic.
- It rejects malformed amounts and values below the Master contract's 0.75 TON minimum.
- The interface displays the exact preview amount and separately states that live wallet/network fees still require review.
- The CI issuer guard requires the preview-derived conversion and rejects hard-coded 0.75 or 1.00 TON deployment amounts.

Current preview: **1.00 TON attached to the Master funding/deployment message**, plus any live wallet/network fees. The contract's minimum accepted `VCoinFund` value remains 0.75 TON; the 1.00 TON preview includes an additional reserve margin. Neither number is a live fee quote.

### 1.2 Founder-only TON reserve withdrawal documentation corrected

The contract already implements `VCoinWithdraw`. It was incorrectly described in older documents as having no withdrawal path.

Current source behavior and Sandbox tests establish:
- Only the Founder/owner can request withdrawal.
- The destination is fixed to `self.owner`; there is no arbitrary recipient.
- Amount must be positive.
- The Master protects a 0.25 TON minimum reserve plus a 0.10 TON fee buffer.
- The inbound request must carry at least 0.01 TON.
- Sandbox coverage includes successful Founder withdrawal, reserve-floor rejection, zero-amount rejection and underfunded request rejection.

The issuer page does not expose a withdrawal button. A withdrawal still requires a separately reviewed payload and Founder signature. These protections do not replace live fee simulation or independent audit.

### 1.3 Custody and allocation rules reconciled

The Founder allocation wallet is also the sole GAS & OPERATIONS wallet. The five allocation destinations remain exactly five; there is no separate fee wallet or sixth destination. Constructor argument `gasOperatorWallet` must equal `owner` (Founder). The allocation plan and tests now enforce this invariant.

### 1.4 Supply and execution policy reconciled

- Fixed supply: **2,100,000,000 VCOIN**, six decimals.
- Allocation: Founder 420M; Mining Reserve 1,050M; Treasury 210M; Liquidity/Market 210M; Ecosystem/Marketing 210M.
- Corrected a stale 10-billion supply figure in the global regulatory register and a 10-billion total in the Jetton specification.
- Mainnet-only execution policy is now consistent across current runbooks and mining readiness documents. No Testnet deployment or Testnet transaction is authorized. Local TON Sandbox and isolated test databases remain permitted.

### 1.5 Mining readiness language corrected

The legacy internal-balance engine is explicitly marked as test-only and not compliant with the approved wallet-balance source-of-truth rule. Public `/api/v1/mining` remains fail-closed with HTTP 503 until verified TON Jetton wallet ownership, fresh Mainnet balance reads, snapshot controls, payout finality and reconciliation are implemented.

## 2. GitHub Pages and CI verification

The exact-head run `45063673730` completed successfully:

- `build-and-test`: success.
- Dependency lockfile install and audit enforcement: success.
- Tact compilation: success.
- TEP-64 metadata content-cell build: success.
- Unsigned Mainnet preview generation: success.
- Jest Sandbox suite: success.
- TonConnect issuer syntax, signer and sequential-issuance guards: success.
- Complete source snapshot artifact upload: success.
- GitHub Pages issuer deployment: success.

The deployment log reports **Reported success** and confirms:

`https://vahidnemati3544-opsking.github.io/v-coin-TON/`

The earlier Pages failure is resolved by using the already-enabled Pages site rather than asking the Actions integration to create a missing site.

Backend and mining CI also passed after the mining-readiness documentation update:
- Backend CI run `45063189689`: PostgreSQL 18 service, schema/migration setup, migration idempotency and backend tests all passed.
- Mining CI run `45063189592`: syntax/static checks and unit/PostgreSQL integration tests passed.

These are isolated CI test environments; they do not mean a production database has been migrated or that mining is live.

## 3. Verified artifacts

### Full source snapshot

- Artifact ID: `14770701121`
- Source commit: `90c0d71adbfb3dbe8b645958eda0e4deb598bd86`
- Source ZIP SHA-256: `ead200093f24898084cd6535b9500024d845510c3eca60c97c9f5160fd13a2f1`
- 100 source/configuration entries, including the safe `.env.example` and `.gitignore`; no `.git`, `node_modules` or secrets.

### Exact-head contract build artifact

- Artifact ID: `14769907918`
- ZIP SHA-256: `349ab278406927a12e6ea7ded99e2ed85649c8133d13cd6bbd1124dad0e0d4f2`
- 32 build outputs including Master and Jetton Wallet BOCs, five predicted Jetton Wallet StateInit BOCs, Sandbox test build outputs, metadata cell, unsigned preview, dependency lockfile and npm audit report.

### Combined complete project ZIP

The combined archive merges the full 94-file source snapshot with the exact-head contract build outputs, generated deployment preview and a release manifest:

- File: `VCOIN-TON-COMPLETE-SOURCE-AND-RELEASE-90c0d71a.zip`
- SHA-256: `fc2dcb9d9e80657a505e2e1b21be2fbc473e7b43595eba8ecfce7d685a8bfc40`
- 133 entries.
- ZIP integrity test: PASS.
- Required source, backend, mining, issuer, compiled contract and preview files: present.

The combined archive is a source snapshot at the exact Git commit plus CI build outputs. It does not include Git history or a `.git` directory.

## 4. Current unsigned Mainnet preview

- Predicted Master address: `EQAo1TAGqSw6oUaMmpBtgQyRtCGEbSJNiGGy2Use04lRCQlU`
- Master StateInit hash: `28d53006a92c3aa1468c9a906d810c91b421846d224d8861b2d94b1ed3895109`
- Master code-cell hash: `5087c882019324e9d8e309c78f42e3bcee9433a54d7d0367d49320a7bbabcc36`
- Master data-cell hash: `785448095c11b5a8d2ed8ac7a2dfb4abb5e8d22050e28b7f749f7e5ecb18a600`
- Metadata content-cell hash: `6dc0e0c3a9ec89e72fc8402a13915bb425032a0e57dfa955ba5579eab28c940c`
- Fixed supply: 2,100,000,000 VCOIN / 2,100,000,000,000,000 base units.
- Preview reserve attachment: 1.00 TON; live network fee quote required.

All addresses above are predictions from the unsigned artifact. They are not deployed Master or on-chain Jetton Wallet addresses.

## 5. Remaining blockers — no transaction authorized

Mainnet remains **NO-GO** until:
1. A qualified independent smart-contract and TEP-74/TEP-64 audit covers Master, Wallet, transfer/burn, bounce/retry and metadata behavior, with critical/high findings resolved.
2. An independent clean-room source rebuild reproduces compiler outputs, BOCs, cell hashes, StateInit hashes and addresses.
3. The Founder reviews live TON Mainnet fee simulation and the required wallet/Master reserve for the exact payloads.
4. The Founder verifies the five destination addresses, network, metadata, signer, Master preview and each separate issuance payload.
5. The Founder explicitly signs deployment and then each of the five separate allocation transactions, verifying on-chain getters and recipient balances after each.

The canonical logo is not embedded in current TEP-64 metadata because the locked asset named `vcoin-canonical-logo.png` has JPEG signature bytes. Its correct format/URI must be resolved before final metadata approval; changing metadata changes the content cell and predicted Master address and therefore requires a new build and hash review.

No Mainnet deployment, mint, transfer or payout has been sent. No Testnet deployment or transaction has been sent or authorized. The public mining API remains disabled.

## 6. Action #53 change summary

Documentation corrections and source/CI changes were committed individually to `main`, including:
- `issuer/index.html` and `.github/workflows/vcoin-jetton-verify.yml`
- `contracts/jetton/allocation/allocation-plan.json`
- `contracts/jetton/tests/allocation-plan.spec.ts`
- `contracts/jetton/DEPLOYMENT_RUNBOOK.md`
- `contracts/jetton/allocation/INIT_PARAMETERS.md`
- `contracts/jetton/FOUNDER_ONLY_WITHDRAWAL.md`
- `contracts/mining/backend/README.md` and `contracts/mining/README.md`
- `docs/JETTON_CONTRACT_SPEC.md`
- `docs/MAINNET_INTERNAL_SECURITY_AND_FEE_REVIEW_2026-11-22.md`
- `docs/MAINNET_PREDEPLOYMENT_RECONCILIATION_2026-11-22.md`
- `docs/GLOBAL_MARKET_REGULATORY_GATE_REGISTER.md`
- `docs/GLOBAL_DUE_DILIGENCE_READINESS.md`
- `docs/MINING_READINESS_PLAN.md`
- `docs/PURCHASE_AND_MINING_PAYOUT_POLICY.md`
- `docs/WALLET_ALLOCATION_REGISTER.md`

This action corrects repository consistency and packaging. It does not certify independent audit, legal clearance, Mainnet deployment, token issuance, or production mining.
