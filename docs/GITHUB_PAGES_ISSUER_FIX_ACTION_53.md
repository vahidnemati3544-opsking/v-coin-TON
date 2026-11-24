> **Historical record notice — superseded by Owner Action #69 and the controlling 2026-11-24 instruction:** This file preserves earlier engineering history only. Its prior direct-five-wallet issuance, one-step/two-step receipt, or Testnet rehearsal wording is not current policy and must not be used as an executable instruction. The controlling receipt is five sequential Founder-authorized stages to the Founder Mainnet wallet (420M, 1.05B, 210M, 210M, 210M VCOIN), followed by four Founder-signed allocation transfers after all five credits are confirmed. Public Testnet deployment and transactions are not authorized; local TON Sandbox is the permitted simulation path. Mainnet remains HOLD / NO-GO pending all release gates.

Current policy correction (2026-11-23): This historical issuer-page report is superseded wherever it lists an independent security audit as a mandatory V COIN–TON task or release gate. That activity is excluded from the current project workstream. Mainnet-only execution applies; no Testnet deployment or transaction is authorized. Page/issuer functionality does not itself prove contract deployment, token issuance, or live mining.

# V COIN–TON GitHub Pages and Issuer Repair — Action #53

**Date:** 2026-11-22  
**Repository:** `vahidnemati3544-opsking/v-coin-TON`  
**Branch:** `main`  
**Final reviewed HEAD:** `b8debec4526913926a81d85e10a570e8288a19a6`  
**Pages URL:** https://vahidnemati3544-opsking.github.io/v-coin-TON/  
**Disposition:** **GITHUB PAGES ISSUER DEPLOYMENT SUCCEEDED; MAINNET CONTRACT RELEASE REMAINS NO-GO.**

## 1. Root cause and workflow correction

The previous `deploy-issuer` job used `actions/configure-pages@v5` with `enablement: true`. That option attempts to create a Pages site when the GET lookup returns 404. The action documentation states that site creation requires a token other than the Actions-generated `GITHUB_TOKEN`; for a GitHub App it requires both `administration:write` and `pages:write`.

The repository workflow only had the job-scoped `pages: write` and `id-token: write` permissions. Retrying the old job could not grant the missing token capability.

Correction committed in `.github/workflows/vcoin-jetton-verify.yml`:
- Removed the unsupported `enablement: true` creation attempt.
- Kept `actions/configure-pages@v5` to configure/read the already-enabled site.
- Kept `pages: write` and `id-token: write` for deployment.
- Documented that the owner/admin must enable Pages once in Settings → Pages and choose GitHub Actions.

The owner confirmed that **Source = GitHub Actions** was selected. With the site available, the corrected workflow configured and deployed it successfully. No personal access token or repository-administration secret was added.

## 2. Verified successful workflow runs

### Run #256
- Run ID: `45062658300`
- Source commit: `ba20f22eb561bb41e9ecf7b5933a34fb289ddbcd`
- `build-and-test`: success — dependency audit, Tact compile, metadata build, unsigned Mainnet preview, Jest, issuer syntax/safety checks, and Pages artifact upload.
- `deploy-issuer`: success — Pages deployment reported success.
- Published URL: https://vahidnemati3544-opsking.github.io/v-coin-TON/

### Final source run #264
- Run ID: `45062830037`
- Exact source commit: `b8debec4526913926a81d85e10a570e8288a19a6`
- `build-and-test`: success.
- `deploy-issuer`: success.
- Deployment log reported: `Reported success!`
- Pages environment URL: https://vahidnemati3544-opsking.github.io/v-coin-TON/

## 3. Issuer preview custody and documentation correction

- Updated `issuer/README.md`: current Master reserve funding is **1.00 TON**, not the stale 0.75 TON amount; each of the five allocation requests carries 0.01 TON plus live network fees. The README now explains the Pages prerequisite and the unsigned-only status.
- Deleted the stale checked-in `issuer/deployment-preview.json`. It had an older source commit, an obsolete 0.75 TON value, and outdated predicted Master/Jetton Wallet addresses.
- The workflow generates the exact-head preview from `contracts/jetton/build/mainnet-deployment-preview.json`, copies it into the Pages artifact, and deploys that generated artifact. The preview is therefore not maintained as a stale source-controlled release file.
- The current issuer interface derives the deployment TON amount from the generated preview and requires a live fee quote; the validation workflow guards against hard-coded deployment values.

## 4. Release and safety status

- The TonConnect issuer web interface is published. This does **not** mean the Jetton Master is deployed or VCOIN has been issued.
- The preview remains unsigned. No Mainnet deployment, mint/allocation, or token transfer was sent by this action.
- Founder must personally inspect and sign the exact Mainnet deployment request and each of the five separate allocation requests.
- Independent qualified smart-contract/TEP-74/TEP-64 audit, independent clean-room source rebuild, live fee/reserve review, and Founder payload review remain mandatory.
- Mainnet contract release disposition remains **NO-GO** until all release gates are satisfied.

## 5. ZIP custody note

The verified file `VCOIN-TON-MAINNET-UNSIGNED-22534f7d.zip` is a 32-file contract build artifact, not a full-project source archive. It must not be presented as the complete backend/mining/PWA project ZIP. The full source of truth remains the GitHub repository at the exact reviewed HEAD above.
