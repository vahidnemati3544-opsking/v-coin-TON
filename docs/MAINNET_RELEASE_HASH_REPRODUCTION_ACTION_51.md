# V COIN–TON Mainnet Artifact Hash Reproduction — Action #51

> **Scope clarification (2026-11-23):** This is a historical technical artifact/hash verification record. Earlier references below to an independent specialist security audit as a pending task or release condition are superseded. Independent external auditing is not a V COIN–TON workstream, pending task, or release condition. The hash-reproduction statements remain technical checks only.

**Review date:** 2026-11-22  
**Repository:** `vahidnemati3544-opsking/v-coin-TON`  
**Branch HEAD at review:** `f8d2e15b3e7f4df4709f56b51a8f5a4094b96636`  
**Release artifact source commit:** `834dc7bc8364110d7003106968d367b5c4755d84`  
**Artifact:** GitHub Actions run #249 / ID `45056163758`, artifact ID `14767013070`  
**Artifact SHA-256:** `ecfc8cb99b0d2ad57dcfed3f146018c1a16a2270e93ea30827543481e54758c3`  
**Disposition:** **HASH REPRODUCTION PASSED FOR THE DOWNLOADED BOC ARTIFACT; MAINNET RELEASE REMAINS NO-GO.**

## 1. Exact-head relationship

GitHub compare from artifact source commit `834dc7bc8364110d7003106968d367b5c4755d84` to branch HEAD `f8d2e15b3e7f4df4709f56b51a8f5a4094b96636` reports 17 later commits. The changed files are release/mining documentation and Action #50 mining backend/client additions. The Jetton contract sources, Jetton tests, deployment script, deployment config, metadata, package manifest and lockfile are unchanged across this range. The only file under `contracts/jetton/` changed after the artifact commit is this verification-status document.

Accordingly, the run #249 artifact remains tied to the same Jetton source/configuration inputs currently on main. This is not a claim that every current repository file is included in that artifact.

## 2. Independent BOC and address verification

The downloaded artifact was inspected independently using a separate Python BOC parser and recursive TON ordinary-cell representation hash calculation. It did not rely on the repository's TypeScript preview generator for the calculated hashes.

| Object | Independently calculated SHA-256 cell hash | Result |
|---|---|---|
| Master StateInit | `28d53006a92c3aa1468c9a906d810c91b421846d224d8861b2d94b1ed3895109` | Match |
| Master code cell | `5087c882019324e9d8e309c78f42e3bcee9433a54d7d0367d49320a7bbabcc36` | Match |
| Master data cell | `785448095c11b5a8d2ed8ac7a2dfb4abb5e8d22050e28b7f749f7e5ecb18a600` | Match |
| TEP-64 metadata content cell | `6dc0e0c3a9ec89e72fc8402a13915bb425032a0e57dfa955ba5579eab28c940c` | Match |

The Master StateInit BOC embedded in the preview is byte-for-byte identical to `build/VCoinMaster.state-init.boc` in the artifact.

All five recipient Jetton Wallet StateInit hashes independently match the values in the preview:

| Role | Jetton Wallet StateInit hash |
|---|---|
| Founder | `ae494e2572942f67830534bbd52095b4010e3864a271034afd7507d71829f1e6` |
| Mining reserve | `bb35ab0a89ac7f6455d442955ef5f2f1a8c0c99e9aed27f9a20eae9c2f6345ce` |
| Treasury | `44da0702d90762506c64d02a4efbf7bc5d08c6cacd1a64cae58232637ada11d7` |
| Liquidity / market | `40c12aa320df29b1822e6c25dcbb8c7d4708d1a22dc5398681a4ae9680c253b4` |
| Ecosystem / marketing | `d4cb3b04c18133fdeafa5cbc5b2aefa7dbebc65e28ee9ed9679eadbb097ba738` |

For the predicted Master address and each of the five predicted Jetton Wallet addresses, the decoded friendly-address account ID equals the independently calculated StateInit hash, workchain is 0, and CRC16-XMODEM checksum passes. These are deterministic predictions only; no address is asserted to be deployed.

## 3. Supply and allocation arithmetic

The artifact preview confirms:
- Supply: **2,100,000,000 VCOIN**.
- Decimals: **6**.
- Base units: **2,100,000,000,000,000**.
- Founder: 420,000,000 (20%).
- Mining reserve: 1,050,000,000 (50%).
- Treasury: 210,000,000 (10%).
- Liquidity / market: 210,000,000 (10%).
- Ecosystem / marketing: 210,000,000 (10%).

The five allocations sum exactly to 2,100,000,000 VCOIN. All five owner addresses in the preview match the approved wallet register. Founder is the sole signer and shared GAS & OPERATIONS wallet. The deployment preview attaches 1.00 TON to the Master funding message; each allocation remains a separate 0.01 TON Founder-signed request.

## 4. ZIP comparison

The previously mounted local file `VCOIN-TON-MAIN-1f10257-release.zip` has SHA-256:

`225b76dc64c6fb616b1c8575ca68a95d5435b0a5ec952836050f5163ba9cb0c4`

It is older than the downloaded run #249 artifact and must not be treated as the latest release candidate.

The run #249 artifact downloaded for this review has SHA-256:

`ecfc8cb99b0d2ad57dcfed3f146018c1a16a2270e93ea30827543481e54758c3`

It contains the compiled Master/Wallet artifacts, StateInit BOCs, metadata content, preview, lockfile and npm audit report. It does not contain the complete backend, mining client or full source repository; it is a contract build artifact, not a full-project ZIP.

## 5. What this verification does not prove

This is an independent BOC/hash/address-integrity reproduction from the downloaded artifact. It is **not** a second independent clean-room compilation from source, not a qualified smart-contract security audit, not wallet-control proof, not a live Mainnet fee quote, and not an on-chain getter/balance check.

Remaining release blockers:
1. Qualified independent smart-contract and TEP-74/TEP-64 security review, with critical/high findings resolved.
2. Independent clean-room rebuild from the exact source and pinned toolchain, with matching BOCs and hashes.
3. Founder verification of the exact signer, Mainnet network, five destination owner addresses, metadata and transaction payloads.
4. Live fee review and final Master reserve assessment.
5. Founder personally signs the deployment and then each of the five separate allocation transactions, checking on-chain total supply, allocation flags and Jetton Wallet balances after every step.

TON's Jetton deployment guide explicitly warns that Mainnet deployment and minting spend real funds and successful transactions cannot be rolled back; the official flow calls for local/test validation and checking network, admin and metadata before approving Mainnet transactions.

## 6. Execution result

- Master deployment: **not sent**.
- Initial issuance: **not sent**.
- Token transfers: **none**.
- Mainnet activation: **not established**.
- Testnet transactions: **none**, in accordance with the project's Mainnet-only execution instruction.
- Mainnet release disposition: **NO-GO pending the remaining independent review and Founder-signed release gates**.


## 7. Follow-up exact-head build after manifest refresh

After the initial reproduction report, the allocation manifest was refreshed from the regenerated preview and committed at `22534f7d03d896ea45fbe330a7a5a9940d44d419`.

GitHub Actions run #252 (ID `45060524086`) on that exact commit completed:
- `build-and-test`: **success** — dependency audit, Tact compile, metadata content build, unsigned Mainnet preview, Jest, issuer syntax/sequence guards, and artifact upload all passed.
- Release artifact ID: `14768219639`.
- Artifact SHA-256: `800946828268df7e1b522c9da5d162f878814711c02a7525dff1eafbc99fa853`.
- The downloaded run #252 artifact was independently rechecked: Master StateInit, Master code, metadata content cell, all five Jetton Wallet StateInit hashes, friendly-address embedded account IDs and CRC16 checksums all matched.
- npm audit report: **0 vulnerabilities** (0 info, 0 low, 0 moderate, 0 high, 0 critical).
- `deploy-issuer`: **failure** at `actions/configure-pages@v5`; GitHub returned `Resource not accessible by integration` while creating the Pages site. The Pages deploy step was skipped. The contract build/test job succeeded independently of this Pages administration failure.

The latest downloadable contract artifact is the run #252 ZIP. It remains an unsigned Mainnet preview and does not authorize or perform deployment or issuance.
