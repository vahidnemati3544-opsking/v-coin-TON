# V COIN–TON — Founder Risk Acceptance and Internal Verification Decision

**Document ID:** VCT-FOUNDER-RISK-001  
**Version:** 1.0.0  
**Decision date:** 2026-11-21  
**Project:** V COIN–TON (independent TON Jetton; legacy BNB project excluded)

## 1. Founder decision

The Founder has cancelled the paid independent smart-contract audit initiative in full. No auditor is to be contacted or engaged, no quotation is to be requested or accepted, and no audit fee or third-party engagement cost is authorized.

The Founder elects to continue V COIN–TON development under the Founder's own responsibility and accepts the additional risk of proceeding without paid independent security certification.

This decision supersedes earlier project documents that made a paid external audit a mandatory condition. Issue #9 is closed as cancelled; internal verification is tracked in GitHub Issue #10.

## 2. Internal engineering verification

The project will continue with internal review and evidence gathering, including:

1. Exact-head Tact compilation and TON Sandbox regression tests.
2. Manual review of TEP-74 Jetton Master/Wallet message handling, getters, address derivation, transfer, burn, notification, excess and bounce behavior.
3. Review of allocation caps, one-time category issuance, supply accounting, burn behavior, rollback and retry invariants.
4. Review of sender authentication, owner-only configuration/issuance, and five destination wallet roles.
5. Review of metadata JSON, canonical PNG, immutable URLs, StateInit generation, reproducibility and SHA-256 manifests.
6. Review of dependency and GitHub Actions permissions, pinned actions, and build-chain behavior.
7. Re-run CI on the exact current candidate commit after each source or deployment-relevant change.
8. Prepare a human-readable deployment payload and fee/network review for the Founder.

Internal review and CI are engineering evidence only. They must not be described as an independent audit, external certification, or guarantee that no vulnerability exists.

## 3. Mainnet operational controls that remain

- Mainnet only; no Testnet deployment.
- The five Founder-recorded Mainnet allocation wallet addresses and their roles remain unchanged.
- Never request, store, or handle private keys, seed phrases, recovery phrases, or wallet PINs.
- Founder remains the sole human authority over all five allocation wallets.
- No source change may reuse a candidate artifact or CI evidence generated for a different commit.
- Before deployment, verify the exact source commit, compiler/toolchain, metadata JSON and image hashes, StateInit BOC/hash, derived Master address, Mainnet network identity, destination owner address, and estimated TON fees.
- The Founder must review and explicitly approve the exact irreversible deployment transaction payload before local wallet signing.
- No assistant, backend, bot, CI workflow, or third party may sign or broadcast on the Founder's behalf.

## 4. Current candidate checkpoint at decision time

- Repository: `vahidnemati3544-opsking/v-coin-TON`
- PR #6: Draft, open, unmerged.
- PR head at checkpoint: `a3e56c5983634f76e485e40357f09b851e288b43`
- CI run #377: https://github.com/vahidnemati3544-opsking/v-coin-TON/actions/runs/44930794019
- CI result: build, metadata/network checks, deterministic offline StateInit generation, 26/26 TON Sandbox tests, and high-severity dependency audit passed on that exact candidate.
- Candidate Master address: `UQD2yDIaHQ_uO2MxJBrQ2s_dMJrXA7OKRjb0J8IEUuPMGU38`
- StateInit BOC SHA-256: `b5318a2cef495a8e9421093a570aaeb604786147413d3d59967d5580901e8374`
- Candidate ZIP SHA-256: `05775eb530a502ffe03ca657f8f796a347c41284131924c911cdc26519f295df`

These hashes are historical checkpoint evidence. Any subsequent change requires a new exact-head CI run and new artifact hashes.

## 5. Explicit limits

This risk acceptance is not a deployment instruction. It does not authorize PR merge, token minting, transfers, wallet signing, or blockchain broadcast. Those actions remain separate and require the Founder's explicit approval of the exact operation and payload.

**Status:** Paid external audit cancelled by Founder. Internal verification continues. Mainnet deployment not yet authorized.
