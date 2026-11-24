> **Controlling update — 2026-11-24 / Owner Action #82:** The current approved initial receipt is five sequential, separately Founder-authorized transfers to Mainnet Founder wallet UQBh9jVKAypc4TrbFx2jsVB2EI1ONChg22zDputisQjENQOT: 420,000,000; 1,050,000,000; 210,000,000; 210,000,000; 210,000,000 VCOIN. Each stage requires a fresh Founder announcement/signature and confirmation of the prior credit. After all five receipts, the Founder personally signs four allocation transfers and retains 420,000,000 VCOIN. Any older one-step, two-step, or direct-five-wallet issuance description below is historical only and is not an executable instruction. No Testnet deployment/transaction, Mainnet deployment, mint, or transfer is authorized by this documentation update.

Current policy correction (2026-11-23): This historical Action #52 review is superseded wherever it lists an independent qualified smart-contract/TEP audit as an active task or release condition. That workstream is excluded from the current project owner-approved scope. Current baseline: 2.1B VCOIN, six decimals; Founder 420M immediate/no vesting; five allocation wallets with Founder also sole GAS & OPERATIONS; Mainnet-only execution and no Testnet deployment/transactions. This record does not authorize any on-chain operation.

# V COIN–TON Repository and ZIP Review — Action #52

**Review date:** 2026-11-22  
**Repository:** `vahidnemati3544-opsking/v-coin-TON`  
**Branch:** `main`  
**Repository HEAD at report creation:** `011fb85c5c7302ecf2e267e01873c41aea23a5b1`  
**Review scope:** current GitHub source and documentation, latest unsigned Mainnet contract artifact ZIP, prior ZIP comparison, GitHub Actions build and Pages deployment logs.  
**Disposition:** **DOCUMENTATION/CUSTODY CONFLICTS CORRECTED; CONTRACT ARTIFACT BUILD PASSED; MAINNET REMAINS NO-GO.**

## 1. ZIP verification

The latest local artifact reviewed was:

- File: `VCOIN-TON-MAINNET-UNSIGNED-22534f7d.zip`
- SHA-256: `800946828268df7e1b522c9da5d162f878814711c02a7525dff1eafbc99fa853`
- Source commit: `22534f7d03d896ea45fbe330a7a5a9940d44d419`
- GitHub Actions run: #252 / ID `45060524086`
- Artifact ID: `14768219639`

The local ZIP digest exactly matches the digest recorded by the repository's Action #51 release report. The archive contains 32 contract-build files: compiled Master and Jetton Wallet outputs, StateInit BOCs, unsigned Mainnet preview, metadata content, package lockfile and npm audit report. It is a contract release artifact, **not** a complete project ZIP and does not contain the backend, mining application or full repository source.

The older `VCOIN-TON-MAIN-1f10257-release.zip` has SHA-256 `225b76dc64c6fb616b1c8575ca68a95d5435b0a5ec952836050f5163ba9cb0c4`; it is stale and must not be used as the latest candidate.

## 2. Contract preview checks

The reviewed preview reports:

- Fixed supply: **2,100,000,000 VCOIN**.
- Decimals: **6**; base units: **2,100,000,000,000,000**.
- Allocations: Founder 420M; Mining Reserve 1,050M; Treasury 210M; Liquidity/Market 210M; Ecosystem/Marketing 210M.
- All five allocations sum exactly to 2.1B VCOIN.
- Five owner addresses match the current official wallet allocation register.
- Founder is the single deployment/issuance signer and shared GAS & OPERATIONS wallet.
- Initial Master reserve funding in the unsigned preview: **1.00 TON**.
- Each allocation is a separate unsigned Founder-signed request; no transaction has been broadcast.

The metadata URI is pinned to commit `9d3364b767aecdf0df038b9bf600435f6662c225`. The metadata file at that commit and on current main has identical content. The content-cell hash in the preview is `6dc0e0c3a9ec89e72fc8402a13915bb425032a0e57dfa955ba5579eab28c940c`.

The ZIP's npm audit report records zero vulnerabilities. Run #252's build-and-test job passed Tact compilation, metadata generation, unsigned preview generation, Jest tests, issuer syntax/sequence guards and artifact upload.

## 3. Documentation conflicts corrected

The following stale or contradictory instructions were found and corrected in separate GitHub commits:

1. `docs/TOKENOMICS.md` — removed the requirement for Testnet deployment and replaced it with local Sandbox verification and the current Mainnet-only execution rule.
2. `docs/WALLET_ALLOCATION_REGISTER.md` — made Mainnet the only authorized execution network and removed the Testnet rehearsal requirement.
3. `docs/TON_ARCHITECTURE.md` — removed the obsolete separate operational-fee wallet address; aligned custody with the Founder/GAS shared wallet; updated evidence-based release status and Pages/mining blockers.
4. `docs/SECURITY_ANTI_FRAUD.md` — aligned security release gates with Mainnet-only execution and local Sandbox validation.
5. `DEPLOYMENT_ARCHITECTURE.md` — replaced Testnet deployment/integration language with local Sandbox and gated Mainnet readiness.
6. `docs/FOUNDER_CONTROL_AND_ALLOCATION.md` — removed the obsolete separate GAS wallet, aligned it with the Founder allocation address, and removed an obsolete Founder vesting requirement. The Founder allocation is immediate and has no vesting or time lock.
7. `docs/JETTON_DEPLOYMENT_INVENTORY.md` — added a current Action #52 notice explicitly superseding historical Testnet and separate-GAS-wallet passages.
8. `contracts/jetton/VERIFICATION_STATUS.md` — refreshed the current preflight to run #252 and the latest artifact digest; historical entries below the current heading remain archival records and are superseded by the Action #52 status.

The owner-approved price baseline in current project documents is **$0.008 per VCOIN**, explicitly modelled only and not a market quote or guarantee. Older price records are historical and superseded by the Action #36 revision.

## 4. GitHub Pages issuer failure

Run #252 build-and-test succeeded, but job `deploy-issuer` (job ID `137327106113`) failed at `actions/configure-pages@v5`.

The job log shows:

- GITHUB_TOKEN permissions included `Pages: write`.
- `Get Pages site failed: Not Found`.
- `Create Pages site failed: Resource not accessible by integration`.

This is a repository Pages-site creation/administration permission problem, not a Tact compilation, contract test, metadata or ZIP-integrity failure. The issuer artifact was built and uploaded, but the hosted Pages issuer is **not confirmed published**. Changing source to GitHub Actions alone did not resolve the integration's inability to create the Pages site. A repository owner/admin must ensure the Pages site is initialized/authorized in repository settings or grant the integration the required supported permission. The current connector does not expose a Pages administration action.

## 5. Remaining Mainnet release gates

Mainnet remains **NO-GO**. Still required:

1. Qualified independent smart-contract and TEP-74/TEP-64 security audit, with critical/high findings resolved.
2. Independent clean-room rebuild from source and pinned toolchain, with matching artifacts and hashes.
3. Final live TON fee and Master reserve review.
4. Founder review of exact Mainnet network, signer, metadata, five owner addresses, Master address prediction and every transaction payload.
5. Founder personally signs the deployment transaction and then each of the five separate allocation transactions, verifying on-chain state after each one.
6. After deployment, confirm the Master getters, each `get_wallet_address`, total supply, allocation flags and recipient Jetton Wallet balances on-chain.

No Mainnet deployment, issuance, transfer, Testnet deployment or Testnet transaction is claimed or authorized by this review. The artifact's predicted addresses are not deployed addresses.

## 6. Action #52 commit record

- Tokenomics policy: `713db062ea8f29c1fa66792772e77feb11a0a77c`
- Wallet allocation register: `c4f3178fa5e7c2144f0a66afa507417f84570c11`
- TON architecture: `7125cfa64c78fa13e10c463b70ef496aec91af48`
- Security requirements: `19ef8bf308ade50d83eb5aa3bbeb4f63ab91e4b1`
- Deployment architecture: `b4acdc4a37d0c752e8ede40bb815fe9e0478fa35`
- Founder custody: `542721ccfc7f59dfd8f8fa6d2beea1284cad264a` and `65796535dd588f1a4a65f99853dc30cb8beca71a`
- Deployment inventory: `51cd55f525786782e5140614de20f8a1d3ce8473`
- Verification status: `58238c516a6816bdca3a0bd3b4dce774d48551f0` and `011fb85c5c7302ecf2e267e01873c41aea23a5b1`

These changes are documentation/policy corrections only. They do not alter Jetton contract source, contract bytecode, deployment payloads, allocation amounts or wallet addresses.
