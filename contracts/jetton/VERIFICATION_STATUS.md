# V COIN TON Jetton verification status

**Reviewed branch:** `main`  
**Scope:** Source and committed-test inspection; no deployment or transaction activity.  
**Release disposition:** **NO-GO for Mainnet** until exact-head CI, independent review, wallet-control proofs, and reproducible artifact/hash gates are complete.

## Implementation present on main

- Tact VCoinMaster fixes the five allocation destinations in StateInit and rejects duplicate allocation addresses and any overlap with the separate GAS & OPERATIONS wallet.
- The Founder wallet is the sole VCoinMint authority.
- The contract accepts only the exact amount assigned to the matching configured destination: Founder 2B, Mining Reserve 5B, Treasury 1B, Liquidity/Market 1B, Ecosystem/Marketing 1B VCOIN.
- Each allocation has a one-time issued flag. The Master disables further issuance only after all five allocation roles have completed.
- A bounced wallet-credit message is checked against the deterministic Jetton wallet for that role and its exact allocation amount; only that role is reset for retry.
- GAS & OPERATIONS can fund the Master reserve through VCoinFund but cannot issue VCOIN.
- The founder allocation is one immediate 420,000,000 VCOIN allocation; no vesting or time lock applies.

## Committed Sandbox coverage

The current `contracts/jetton/tests/jetton-sandbox.spec.ts` includes tests for:
- Unauthorized issuance, repeat issuance, wrong amounts, unregistered destinations, and underfunded requests.
- Exact five-wallet allocation amounts, configured addresses, final total supply, and permanent mintable=false state.
- Separate GAS & OPERATIONS funding authority.
- Natural wallet-credit bounce rollback for each of the five allocation roles.
- Retry of the exact role after its failed wallet credit is corrected.

These are committed test cases, not by themselves proof that CI passed on the latest main commit. Exact-head GitHub Actions results must be checked and recorded before this status can be upgraded to tested.

## Latest exact-head CI evidence — 2026-11-22

- Exact CI commit: 618e397a8a6f97ce76a45043af78acbedbd5ea72; [GitHub Actions run #111](https://github.com/vahidnemati3544-opsking/v-coin-TON/actions/runs/44990981787) completed successfully.
- Successful steps: generated lockfile, clean npm ci, dependency audit with moderate-or-higher enforcement, Tact compilation, immutable TEP-64 content-cell generation, unsigned Mainnet deployment preview generation, Jest Sandbox tests, lockfile persistence, and artifact upload.
- Audit report: zero vulnerabilities at every level (0 info, 0 low, 0 moderate, 0 high, 0 critical).
- The earlier tsx 4.19.2 dependency introduced two moderate esbuild advisories. It was upgraded to tsx 4.23.15; the regenerated package-lock was committed to main in commit 647256b8ce9504fbda6e5d34a0b014a57c17c391. The authoritative workflow now fails on moderate, high, or critical advisories.
- Exact-head artifact ID 14741572462; name vcoin-jetton-release-618e397a8a6f97ce76a45043af78acbedbd5ea72; archive SHA-256 b8471e11036f15bbef081c166fe0eabc91eeaf96890fd97fc5800f5f03fbc723.
- Master code BOC SHA-256: 149044c6850f4a8116c0673a02a72247660831ad4fbf87fd486958a3eddfcaf1.
- Jetton Wallet code BOC SHA-256: 8373d9e5318314563ea6d140e1bbb3aa18240cf8f261bdeb5b94d73c903778a0.
- Master StateInit BOC SHA-256: 99b7c3fabe239aa7ba9eed123e97d133ec63058469a9a6a819e79b7c27634da1.
- TEP-64 content BOC SHA-256: 459b380b7ef4215f4bfcf100a5b132703eba535012f0690b12a365fe72e9d438.
- Updated package-lock SHA-256: b778e6db4730225c9104b3cd5140418e06de8edbe50d573efc8be0e3035da653.
- Mainnet deployment preview JSON SHA-256: 19586eff2a1594fa0ed8532405015abf00feba58e46bc5c6c4381a964149fd1e.
- Predicted Master address: EQCvOZBRDK51sk2k1qSWksk6jnhXT11MHquhD06FFLOKrh77; StateInit hash af3990510cae75b24da4d6a49692c93a8e78574f5d4c1eaba10f4e8514b38aae.
- Deployment request uses the separate GAS & OPERATIONS wallet as signer, VCoinFund as the first message body, and 0.75 TON minimum attached value; the live network/wallet fee estimate remains additional.
- Founder wallet remains the signer for the five subsequent exact VCoinMint allocations after deployment and on-chain getter checks.
- Mainnet deployment, minting, and wallet credits have not been broadcast. The above are unsigned deterministic previews only.
## Remaining Mainnet release gates

- Lockfile-backed clean install, dependency audit, Tact build, metadata-cell generation, Sandbox tests, and artifact retention: passed on commit 9d3364b767aecdf0df038b9bf600435f6662c225; lockfile committed.
- Independent smart-contract and TEP-74/TEP-64 review: pending.
- Independent clean-room build and TON cell-hash / StateInit hash reproduction: pending. The SHA-256 values above are file checksums only and must not be represented as TON cell hashes.
- Confirm all five allocation destination addresses and separate gas wallet against the final deployment constructor inputs; verify wallet control for the intended Mainnet network: pending.
- TEP-64 metadata JSON, immutable commit-pinned URI, and generated content cell: completed without embedding the unverified logo. Canonical logo format verification and any separately approved conversion remain pending.
- Mainnet deployment, issuance, and transfers: not performed; explicit per-transaction Founder approval remains required.

## Additional concrete blockers confirmed on current main

- TEP-64 metadata JSON and the metadata content-cell generator are now present; the CI artifact contains the generated BOC. The canonical logo remains excluded pending format verification.
- The canonical logo is stored as `vcoin-canonical-logo.png`, but its recorded Base64 signature begins with JPEG bytes (`FF D8 FF`). Its actual format and full integrity have not been independently verified. Do not publish it as PNG or build metadata around an unverified asset.
- The authoritative workflow now uses `npm ci`, runs the audit and tests, and retains the BOC and metadata-cell artifacts.
- No deployed Master address, deterministic Jetton wallet addresses, TON cell hashes, StateInit hashes, or on-chain balances exist in the repository evidence.

## Safety boundary

No Testnet deployment is included in the current execution path; local TON Sandbox testing is permitted and required. No Mainnet transaction may be signed or broadcast until the exact build, destinations, amounts, fees, network, simulation, and independent review have been presented for explicit Founder approval.

Never request or store seed phrases, private keys, wallet PINs, or recovery codes.

## Founder-confirmed issuance scope — 2026-11-22

The project owner explicitly confirmed that the full fixed supply of 2,100,000,000 VCOIN is to be issued and allocated directly across all five registered Mainnet allocation wallets: Founder 420,000,000; Mining Reserve 1,050,000,000; Treasury 210,000,000; Liquidity/Market 1,000,000,000; Ecosystem/Marketing 1,000,000,000. The Founder wallet is one of these five allocation wallets, not an additional destination. The separate GAS & OPERATIONS wallet is not an allocation wallet. Do not ask the owner to choose between partial Founder-only issuance and five-wallet allocation again.

This is confirmation of the intended allocation plan, not a signature authorization. Deployment, issuance, and each Mainnet transaction remain blocked until technical release gates pass and exact transaction details are presented for the Founder's informed approval and wallet signature.

## Action #31 — CI reproducibility, artifact retention, and recipient-control clarification

**Status:** Workflow changes committed; verification evidence available; lockfile persistence is configured for the next successful run.

- Authoritative verification workflow now generates a dependency lockfile, performs a clean `npm ci`, records the audit JSON, enforces no high/critical advisories, builds the Tact contracts, runs the Sandbox Jest suite, and retains exact-head artifacts for 30 days.
- The duplicate push-triggered workflow was changed to manual-only verification to avoid running two competing pipelines for every commit.
- The authoritative workflow now has a final successful-run step to commit `contracts/jetton/package-lock.json` to `main` if it is missing or changes. This requires the GitHub Actions token to have contents write permission.
- Exact-head evidence from run #86 on commit `4a76473a662bec7efe583511917090cb2ea68eee`: clean lockfile install, audit, build, and tests all succeeded; audit reported 0 info, 0 low, 0 moderate, 0 high, and 0 critical vulnerabilities. Artifact: `vcoin-jetton-release-4a76473a.zip`.
- Artifact SHA-256: `2bba0c8371b62c510cbd1933aa38a95161d86fb82cf3e22bebac51fd8ea88823`.
- Master code BOC file SHA-256: `149044c6850f4a8116c0673a02a72247660831ad4fbf87fd486958a3eddfcaf1`.
- Jetton Wallet code BOC file SHA-256: `8373d9e5318314563ea6d140e1bbb3aa18240cf8f261bdeb5b94d73c903778a0`.
- Lockfile SHA-256: `e386d60a3a83b1d3fc033264cc422c7bc3f5d1f4507ee373d1d939c82953d4ba`.
- These are file SHA-256 checksums, not TON cell hashes. The BOCs were generated by CI; clean-room cell-hash and StateInit hash reproduction remains pending.
- The deployment runbook now states explicitly that the Master has no recipient clawback, freeze, confiscation, or post-transfer seizure method. Standard holder-controlled Jetton transfers remain available; no Founder or project-admin method can retrieve a completed recipient balance.
- Mainnet deployment and issuance remain not performed. Metadata/content cell, independent review, reproducible TON cell hashes, deployment constructor review, and wallet-address derivation remain release blockers.

## Action #32 — TEP-64 metadata package and content cell

**Status:** Metadata JSON committed; content-cell generator committed; exact-head CI passed.

- Added contracts/jetton/metadata.json with name V COIN, symbol VCOIN, description, and six decimals.
- Added contracts/jetton/scripts/build-metadata-cell.cjs; it creates the TEP-64 off-chain content cell with prefix 0x01, immutable metadata URI, BOC, and cell hash.
- CI generated the content cell from the commit-pinned URI and retained it in artifact 14741308282.
- Generated metadata content-cell hash: 6dc0e0c3a9ec89e72fc8402a13915bb425032a0e57dfa955ba5579eab28c940c.
- Canonical logo intentionally omitted until the locked source asset's actual JPEG format is verified and any new converted asset is separately approved.
- Next action: derive the complete VCoinMaster StateInit from the exact constructor values and metadata content cell, independently reproduce its hash/address, then prepare a Tonkeeper-compatible deploy transaction for Founder review and signature.
## Action #33 — Mainnet deployment StateInit and five Jetton wallet derivation

**Status:** Unsigned Mainnet deployment package generated; StateInit and all five deterministic wallet addresses independently hash-checked; no transaction broadcast.

- Exact preview build commit: 9d198dc169d53f6307f042db395cf5dfdbb6c1b6; [CI run #105](https://github.com/vahidnemati3544-opsking/v-coin-TON/actions/runs/44990829838) passed.
- Artifact ID: 14741568516; artifact SHA-256: b464d40dc1cf0b29b95011c0f1409c8083cf22aa7aab994377475f3e11457fdb.
- Predicted Mainnet VCoinMaster address: EQCvOZBRDK51sk2k1qSWksk6jnhXT11MHquhD06FFLOKrh77.
- Master StateInit hash: af3990510cae75b24da4d6a49692c93a8e78574f5d4c1eaba10f4e8514b38aae. It was independently reproduced from the serialized StateInit BOC using a separate cell-hash parser; the hash embedded in the friendly Master address matches exactly.
- Master code cell hash: 0e1a3581d5ee1a37f8ac12f39e8d6be1a8277ad2d612ad3f35bce78da474f03a.
- Metadata content cell hash: 6dc0e0c3a9ec89e72fc8402a13915bb425032a0e57dfa955ba5579eab28c940c.
- Founder Jetton Wallet: EQBElyTbIfy5Z0Aur87D_UVl4F4Qg1_ZUr5D0AGbf2osCZvo; StateInit hash 449724db21fcb967402eafcec3fd4565e05e10835fd952be43d0019b7f6a2c09.
- Mining Reserve Jetton Wallet: EQANO_4VthNKI4WjeXbxV4ZvGZyBGrMURY0zVnfQknXhzbIM; StateInit hash 0d3bfe15b6134a2385a37976f157866f199c811ab314458d335677d09275e1cd.
- Treasury Jetton Wallet: EQCuFM3AkJGmeNUy2rllpNum4ojmGzNuT6PVhtJ_c4SicJIY; StateInit hash ae14cdc09091a678d532dab965a4dba6e288e61b336e4fa3d586d27f7384a270.
- Liquidity / Market Jetton Wallet: EQBQgo1HRRnKFZEhLvSW12nt3omq8H6icxtGhn30tOlENX6Z; StateInit hash 50828d474519ca1591212ef496d769edde89aaf07ea2731b46867df4b4e94435.
- Ecosystem / Marketing Jetton Wallet: EQCRa4bOU5yZaYaEqFhb5qa-pcbIyegjg6AEwGTVQVOECMQ4; StateInit hash 916b86ce539c99698684a8585be6a6bea5c6c8c9e82383a004c064d541538408.
- A separate parser independently recomputed all five Jetton Wallet StateInit hashes from their BOCs; each matched both the generated hash and the address hash bytes.
- Deployment transaction design: GAS & OPERATIONS wallet sends the first message to the predicted Master with StateInit, VCoinFund body, and 0.75 TON minimum attached value. This deploys the contract and funds its reserve in one transaction. Network/wallet fee quote is additional and still required.
- After the Master is active and getters confirm the five destinations, the Founder wallet signs five separate VCoinMint requests: 2B, 5B, 1B, 1B, 1B VCOIN. Each transaction is separately reviewed; mintable becomes false after all five successful credits.
- No Mainnet transaction has been signed or broadcast. The Master address and Jetton Wallet addresses remain predicted until on-chain deployment and getter checks.
- Independent third-party smart-contract security audit and live Mainnet fee simulation remain outstanding; do not describe this as an audited or deployed token.
## Action #34 — Dependency advisory remediation and strict audit gate

**Status:** Completed and verified by exact-head CI.

- The first deployment-preview CI identified two moderate advisories through tsx 4.19.2 -> esbuild.
- Upgraded tsx to 4.23.15 and regenerated/committed package-lock.json.
- Changed the authoritative npm audit gate to fail at moderate severity, not only high severity.
- Exact-head run #111 passed; the audit report contains zero advisories at every severity.
- The release package remains unsigned; no Mainnet transaction was broadcast.
## Action #35 — TonConnect signing console and Pages publication

**Status:** TonConnect console, manifest, signer guards, and generated Mainnet preview are committed; site artifact builds; GitHub Pages publication awaits one repository-owner setting.

- Added issuer/index.html using pinned @tonconnect/ui 5.0.3, Mainnet-only network selection, and exact raw-address guards for the GAS & OPERATIONS signer and Founder issuance signer.
- The deployment button sends one StateInit + VCoinFund message to the predicted Master with 0.75 TON attached. Five separate mint buttons submit the exact VCoinMint payloads from the deployment preview, each with 0.01 TON attached.
- The console never stores keys or requests recovery material. It requires the Founder to manually confirm that the Master is active and its getters match before enabling issuance buttons. It does not claim finality; each transaction must be checked on-chain before proceeding.
- The CI run #118 build-and-test job passed and produced the GitHub Pages site artifact ID 14741409791 (artifact digest df0d5e43a1c84e143213d75ce2ff2ee2dd8612239d634ee6ac023ae915ad5625). The release build/audit artifact ID is 14742370638.
- GitHub Pages publication was blocked because the connected GitHub App lacks repository administration permission to create the Pages site; configure-pages returned 'Resource not accessible by integration' even with enablement=true.
- One-time Founder action required: open https://github.com/vahidnemati3544-opsking/v-coin-TON/settings/pages and set Build and deployment -> Source to GitHub Actions. The next push to issuer/** or the verification workflow will publish the site at https://vahidnemati3544-opsking.github.io/v-coin-TON/.
- No Mainnet deployment, mint, or token transfer has been broadcast. The predicted Master address and five Jetton Wallet addresses remain unsigned previews until Mainnet confirmation.


## Action #36 — Owner-approved supply and reference-price revision

**Status:** Source, tests, templates and economic documentation updated; exact-head CI and regenerated Mainnet artifacts pending.

- Owner-approved fixed supply: 2,100,000,000 VCOIN, six decimals, 2,100,000,000,000,000 base units.
- Shares remain 20/50/10/10/10: Founder 420,000,000; Mining Reserve 1,050,000,000; Treasury 210,000,000; Liquidity/Market 210,000,000; Ecosystem/Marketing 210,000,000 VCOIN.
- Modelled USD reference price reset to 0.008 per VCOIN. It is not a market quote, guarantee, or promise of appreciation.
- Previous Master and Jetton Wallet predictions are invalidated and must be regenerated from the revised contract StateInit.
- A forward-only PostgreSQL migration lowers the mining reserve cap only if pending plus distributed rewards fit the new 1.05B reserve; otherwise it aborts for reconciliation.
- The same migration resets the active modelled reference price to 0.008 while retaining historical candles.
- The tracked old issuer preview is marked superseded and cannot be used for signing. CI must pass before a fresh preview replaces it.
- No Mainnet deployment, minting, or transfer is authorized or broadcast by this revision.
