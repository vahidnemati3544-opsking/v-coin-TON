# V COIN – TON Mainnet Release Package & Hash Audit

**Document ID:** VCT-MAINNET-AUDIT-021  
**Action:** 21  
**Review date:** 2026-11-21  
**Repository:** `vahidnemati3544-opsking/v-coin-TON`  
**Branch reviewed:** `main`  
**Scope:** Source and deployment-readiness review only  
**Disposition:** **NO-GO — package documented; Mainnet hashes not yet attestable; no transaction sent**

> This document is a source-control and release-gate record. Git blob IDs below are Git object identifiers, not TON contract code hashes, StateInit hashes, deployed addresses, or proof of a reproducible compiled artifact.

## 1. Non-execution boundary

During Action 21:
- No TON transaction was constructed, signed, broadcast, or submitted.
- No contract was deployed and no token was minted, transferred, burned, or allocated.
- No wallet was funded or modified.
- No Mainnet or Testnet address was substituted or treated as a deployed VCOIN master.
- No secret, private key, or recovery phrase was requested or stored.

## 2. Source snapshot and Git blob identifiers

The following files were fetched from the repository's `main` branch during this review. The values are the GitHub-reported Git blob SHA-1 identifiers for the exact fetched file contents.

| File | Git blob SHA-1 |
|---|---|
| `contracts/jetton/src/vcoin.tact` | `d76b40ea8f79b399ed319547f8c9aaadda9e491b` |
| `contracts/jetton/src/jetton.tact` | `90b6ab2c04270f942dc1c35b2f0c1f9ecf67e37e` |
| `contracts/jetton/src/messages.tact` | `28a484997898b9251b058f602911d1260b1b40af` |
| `contracts/jetton/package.json` | `69121d0cdca48394ea171c632c0e1a3543875b0f` |
| `contracts/jetton/deployment.config.template.json` | `73836b9189cfef90f45173e2651a4eac77a59d45` |
| `docs/JETTON_CONTRACT_SPEC.md` | `b31349bbfb94781f2e580f1c81be0b1a8b255baa` |
| `docs/JETTON_DEPLOYMENT_INVENTORY.md` | `5d182f8357a6e36e3ba4f2e133d4c7a6446ef1ed` |
| `docs/WALLET_ALLOCATION_REGISTER.md` | `c99f6f46caf46f8d003b0ecf44747d8df52073f2` |
| `docs/TON_ARCHITECTURE.md` | `83a4b7cc2813a2caab0449261ebd8e27529fd5f4` |
| `docs/TOKENOMICS.md` | `b1f105b33b9e3dcb2fcbec9a4f897abe386c8308` |

These identifiers pin the reviewed Git objects. They do **not** replace compiler-produced BOC hashes. A release candidate must additionally record the exact compiler/toolchain, lockfile, build inputs, generated Master and Wallet BOCs, code-cell hashes, StateInit hashes and resulting addresses for the intended network.

## 3. Fixed design parameters cross-check

The current approved design records:
- Jetton standard: TEP-74; metadata: TEP-64.
- Decimals: 6.
- Initial supply: 10,000,000,000 VCOIN = 10^16 base units.
- Allocation: Founder 2B; Mining 5B; Treasury 1B; Liquidity/Market 1B; Ecosystem/Marketing 1B.
- Additional minting: prohibited after the one-time initial issuance.
- Five allocation owner-wallet candidates are recorded in `docs/WALLET_ALLOCATION_REGISTER.md`.
- The operational TON fee wallet is separate and is not a sixth VCOIN allocation destination.

The deployment template correctly targets Testnet and keeps the Master address, deployment transaction and derived allocation Jetton-wallet destinations null. It sets both `deployment_authorized` and `mainnet_authorized` to false. These are appropriate fail-closed defaults and must not be changed as part of this audit.

## 4. Hash and artifact verification result

**Not completed — release-blocking.**

The repository evidence reviewed does not provide a currently attested, reproducible release bundle containing:
1. A clean build from the exact reviewed commit with pinned dependencies and committed lockfile.
2. Generated Master and Wallet BOC artifacts.
3. Compiler version and build provenance.
4. TON cell/code hashes for Master and Wallet.
5. StateInit hashes and deterministic address derivation for the selected network.
6. An independently reproduced hash comparison by a second build/reviewer.
7. A signed release manifest tying source commit, build artifacts, hashes, configuration and review approvals together.

Git blob IDs above are source provenance only. They must never be copied into a field labelled contract code hash or used to identify a deployed contract.

## 5. Confirmed blockers carried forward from deployment inventory

The repository's deployment inventory records a previous successful Tact build and four arithmetic tests, but explicitly states that those tests do not execute contracts in TON Sandbox. It also records five high-severity dependency findings and no committed lockfile at the time of that inventory.

The inventory further identifies the following open gates:
- The latest bounced-mint recovery handler requires a fresh build and a TON Sandbox bounce test against the exact current source.
- Full Sandbox integration and adversarial tests are not evidenced for deployment, minting, wallet derivation, transfers, burns, invalid senders, fees/gas, bounce recovery, replay and post-cap mint rejection.
- Five allocation destination ceilings/controls are not enforced by the current Master source.
- Founder four-year vesting is not implemented as a reviewed on-chain vesting/escrow mechanism.
- TEP-74 / TEP-64 interoperability and wallet behavior have not been independently verified.
- Dependency vulnerabilities, compiler pinning and reproducible lockfile remain unresolved in the inventory.
- Independent smart-contract security review is outstanding.
- No deployed VCOIN Jetton Master address or verified Testnet issuance is evidenced.

The current Master source also routes the one-time full supply to the owner's wallet for subsequent distribution. That flow must not be treated as satisfying the approved five-destination allocation controls or founder vesting requirements without a reviewed, tested implementation and explicit owner approval.

## 6. Required completion sequence

1. Freeze the release candidate at an identified commit; do not modify source during hash attestation.
2. Resolve dependency advisories, pin the supported compiler and dependencies, and commit the lockfile.
3. Rebuild from a clean environment and retain build logs and generated BOCs.
4. Run full TON Sandbox integration, bounce, negative, replay, fee and allocation tests against that exact build.
5. Implement and test allocation-specific limits and the approved founder vesting controls.
6. Verify TEP-74 / TEP-64 compatibility and obtain an independent contract security review.
7. Produce a signed release manifest containing commit SHA, toolchain, lockfile hash, artifact hashes, Master/Wallet code-cell hashes, StateInit hashes, network, metadata hash and reviewer approvals.
8. Reproduce the build and compare all hashes independently.
9. Only after these gates, prepare a separate Testnet rehearsal package. Mainnet requires a further explicit owner approval; this action grants no such authorization.

## 7. Action 21 outcome

- Source snapshot and Git blob identifiers: **recorded**.
- Design supply and allocation cross-check: **recorded**.
- Actual compiled TON contract code hashes: **not verified / unavailable in the reviewed evidence**.
- Reproducible release bundle: **not complete**.
- Independent hash reproduction: **not performed**.
- Mainnet readiness: **NO-GO**.
- Transaction activity: **none**.

**Final disposition:** Action 21 is partially completed as a documented source/hash audit and release-gate assessment. It remains **pending** until the compiled artifacts, reproducible hashes, full contract tests, allocation/vesting controls and independent security review are completed. No transaction is authorized or sent.
