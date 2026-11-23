# Repository Policy Consistency Sweep — Action #65

**Date:** 2026-11-23  
**Original sweep branch:** `main`  
**Continuation branch:** `docs/action-65-complete-policy-sweep`  
**Baseline before continuation:** `c9d5df5a57be414417726ee6e3729d4e2a966083`  
**Continuation branch head before this report update:** `83c1bb408c38de159aa6f61f69861a57550e75eb`  
**Merge commit:** recorded in the linked pull request after merge.

## Purpose

Review repository documentation for historical statements that conflict with the currently approved V COIN–TON policy. Historical conversation records and technical snapshots were retained; current-policy correction notices were added so superseded statements cannot be mistaken for active instructions.

## Controlling policy restated

- Fixed total supply: **2,100,000,000 VCOIN**, 6 decimals.
- Founder: **420,000,000 VCOIN**, credited in one operation; no vesting, time lock, monthly installments, or staged release.
- Exactly five allocation wallets. Founder wallet is also the sole **GAS & OPERATIONS** wallet; no separate fee wallet and no sixth allocation destination.
- Mainnet-only execution policy. Local TON Sandbox and isolated tests are permitted. No Testnet deployment, transaction, or rehearsal is authorized.
- Independent external security auditing is not a V COIN–TON project task, pending work item, or release condition.
- These documentation changes do not authorize Mainnet deployment, issuance, wallet funding, or any transaction.

## Files updated

1. `docs/GLOBAL_DUE_DILIGENCE_READINESS.md`
2. `docs/GLOBAL_MARKET_REGULATORY_GATE_REGISTER.md`
3. `contracts/mining/backend/wallet/README.md`
4. `docs/WALLET_BALANCE_MINING_SPEC.md`
5. `docs/CHAT_RECORD_2026-11-20_WALLET_FEES.md`
6. `docs/MAINNET_INTERNAL_SECURITY_AND_FEE_REVIEW_2026-11-22.md`
7. `contracts/jetton/VERIFICATION_STATUS.md`
8. `docs/MAINNET_RELEASE_HASH_AUDIT.md`
9. `docs/MAINNET_ADDRESS_RECONCILIATION_ACTION_54.md`
10. `docs/GITHUB_PAGES_ISSUER_FIX_ACTION_53.md`
11. `docs/PROJECT_REVIEW_ACTION_52.md`
12. `docs/PROJECT_REVIEW_ACTION_53.md`
13. `docs/SECURITY_ANTI_FRAUD.md`
14. `contracts/jetton/allocation/INIT_PARAMETERS.md`
15. `docs/GLOBAL_PUBLIC_INTRODUCTION_PACK.md`
16. `docs/MAINNET_PREDEPLOYMENT_RECONCILIATION_2026-11-22.md`
17. `docs/JETTON_DEPLOYMENT_INVENTORY.md`
18. `docs/MAINNET_RELEASE_HASH_REPRODUCTION_ACTION_51.md`

## Verification and limitations

- Each listed file was fetched from the repository default branch and updated using its current blob SHA.
- GitHub reports the latest `main` commit as `b81db888fd7225b25e2600aa878ca4542563375d`.
- Exact-head combined status returned no status checks; the workflow-runs endpoint returned zero runs for this commit. Therefore **CI is not verified for the post-sweep head**. Do not claim that tests passed.
- This action was a documentation consistency sweep. It did not change contract source, deployment payloads, wallet addresses, token balances, or blockchain state.
- Remaining technical work (clean-room source rebuild, local Sandbox/test verification, live fee/reserve simulation, and explicit Founder review/authorization of any exact Mainnet payload) remains separate and incomplete unless independently evidenced.

## Status

**Action #65 — documentation corrections committed; post-sweep CI and full technical release verification remain pending.**


## Continuation — remaining active-document corrections

A second pass found active instructions that were not fully aligned by the first 18-file correction set. The following additional files were corrected on the continuation branch:

19. `contracts/README.MD` — replaced obsolete test-network and independent-review instructions with the approved Mainnet-only/Sandbox policy and current 2.1B/five-wallet baseline.
20. `contracts/jetton/FOUNDER_ONLY_WITHDRAWAL.md` — removed external-review requirements; retained exact-build fee/reserve and engineering verification requirements.
21. `contracts/mining/README.md` — clarified that the legacy internal-balance engine is not the public extraction flow and removed the external-audit release condition.
22. `contracts/mining/backend/README.md` — aligned wallet-based mining release wording with documented engineering checks.
23. `contracts/mining/backend/wallet/README.md` — replaced external-audit and independent-review tasks with internal engineering verification.
24. `contracts/jetton/tests/README.md` — corrected allocation amounts to 420M / 1.05B / 210M / 210M / 210M, aligned Founder/GAS shared-wallet policy, and removed the obsolete 0.75 TON funding instruction.
25. `contracts/jetton/allocation-manifest.template.json` — removed the stale 0.75 TON deployment-funding statement; current exact-build runbook baseline is 1.00 TON, subject to fee/reserve simulation.

Existing correction-notice files were also tightened where their active copy still described external security audits as a current workstream: `docs/GLOBAL_DUE_DILIGENCE_READINESS.md`, `docs/GLOBAL_MARKET_REGULATORY_GATE_REGISTER.md`, `docs/GLOBAL_PUBLIC_INTRODUCTION_PACK.md`, and `docs/WALLET_BALANCE_MINING_SPEC.md`.

## Scope boundary

Historical conversation records, old CI snapshots, and dated technical reviews were not silently rewritten as if their original statements had never existed. They retain their historical content only where a dated controlling correction clearly supersedes it. Current operational instructions must follow the approved 2.1B supply, immediate Founder allocation, five-wallet/shared-GAS structure, Mainnet-only execution, and no-external-security-audit-workstream policy.

The continuation changes are documentation/configuration-template corrections only. No contract source, wallet address, token amount, signing key, deployment authorization, transaction payload, or blockchain state was changed. The 1.00 TON figure is a current runbook baseline, not a live fee quote or guarantee.

**Continuation status before merge:** corrections committed to the continuation branch; pull-request review/merge and exact-head CI status remain pending.
