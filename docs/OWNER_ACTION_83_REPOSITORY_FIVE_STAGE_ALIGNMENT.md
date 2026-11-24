# Owner Action #83 — Repository-wide five-stage Founder-first alignment

**Date:** 2026-11-24  
**Branch:** `fix/five-stage-founder-receipt-docs`  
**Scope:** Repository documentation, allocation manifest, deployment/runbook references, contract and tooling consistency.  
**Disposition:** Documentation alignment in progress; Mainnet remains **HOLD / NO-GO**.

## 1. Controlling receipt instruction

The complete fixed supply is **2,100,000,000 VCOIN** (6 decimals; **2,100,000,000,000,000 base units**). All five initial receipts go to the single Founder Mainnet receiving wallet:

`UQBh9jVKAypc4TrbFx2jsVB2EI1ONChg22zDputisQjENQOT`

| Stage | VCOIN | Base units |
|---:|---:|---:|
| 1 | 420,000,000 | 420,000,000,000,000 |
| 2 | 1,050,000,000 | 1,050,000,000,000,000 |
| 3 | 210,000,000 | 210,000,000,000,000 |
| 4 | 210,000,000 | 210,000,000,000,000 |
| 5 | 210,000,000 | 210,000,000,000,000 |
| **Total** | **2,100,000,000** | **2,100,000,000,000,000** |

Every stage is a separate operation. The Founder must freshly announce and personally sign each stage. A subsequent stage is not eligible until the preceding Founder Jetton-wallet credit and Master acknowledgement are independently confirmed. No stage may be skipped, combined, duplicated, or changed.

## 2. After all five receipts

Only after the complete 2.1B supply has been credited and reconciled does the Founder personally sign four ordinary TEP-74 transfers:

- Mining reserve: 1,050,000,000 VCOIN.
- Treasury: 210,000,000 VCOIN.
- Liquidity / market: 210,000,000 VCOIN.
- Ecosystem / marketing: 210,000,000 VCOIN.

The Founder retains 420,000,000 VCOIN (20%). No additional minting is permitted.

## 3. Repository alignment performed on this branch

The following active documents and machine-readable allocation records were aligned with the five-stage instruction:

- `DEPLOYMENT_ARCHITECTURE.md`
- `docs/WALLET_ALLOCATION_REGISTER.md`
- `docs/FOUNDER_CONTROL_AND_ALLOCATION.md`
- `docs/SECURITY_ANTI_FRAUD.md`
- `docs/TOKENOMICS.md`
- `docs/PURCHASE_AND_MINING_PAYOUT_POLICY.md`
- `docs/README.md`
- `contracts/jetton/allocation/allocation-plan.json` (removed the stale Testnet authorization object; local Sandbox only)
- `contracts/jetton/allocation-manifest.template.json` and `contracts/jetton/tests/allocation-plan.spec.ts` (enforced exact stage schedule and no-public-Testnet policy)
- `.github/workflows/vcoin-jetton-verify.yml` (CI now checks the canonical five-stage plan and rejects stale Testnet authorization)
- `contracts/mining/backend/scripts/setup-database.js` (registered migration 010 in the local-only migration runner)
- `docs/JETTON_CONTRACT_SPEC.md`
- `docs/GLOBAL_DUE_DILIGENCE_READINESS.md`
- `docs/PROJECT_REVIEW_ACTION_52.md`
- `docs/PROJECT_REVIEW_ACTION_53.md`
- `docs/REPOSITORY_POLICY_SWEEP_ACTION_65.md`
- `docs/MAINNET_PREDEPLOYMENT_RECONCILIATION_2026-11-22.md`
- `contracts/jetton/allocation/INIT_PARAMETERS.md`
- `issuer/README.md`
- `contracts/jetton/VERIFICATION_STATUS.md`

Historical actions and pre-deployment snapshots remain historical records. Their earlier one-step, two-step, and direct-five-wallet instructions are not current executable instructions.

## 4. Contract and tooling review

The current repository source already defines the five exact base-unit constants, Founder-only receipt requests, one pending stage at a time, deterministic Founder-wallet acknowledgement, acknowledgement retry, stage-specific bounce rollback, and permanent mint disablement after Stage 5. The Sandbox suite contains a five-stage sequential-receipt test and tests for Stage 1/2 natural bounce rollback. The allocation manifest and deployment template also describe the five stages. The canonical allocation plan no longer contains an authorized Testnet rehearsal; public Testnet execution is explicitly false and local TON Sandbox is the only permitted simulation environment. Jest and CI now validate the exact five-stage amounts and reject stale Testnet authorization. The local-only PostgreSQL setup runner now registers migration 010, so the five-stage reconciliation schema is included in the ordered local setup path; the runner still refuses production and non-local database hosts.

The Mainnet preparation script intentionally remains disabled. The public Testnet rehearsal generator is disabled/archived. CI and local TON Sandbox are the permitted engineering verification paths; this action does not authorize public Testnet transactions.

## 5. Outstanding release gates

- Re-run exact-head CI after all branch edits; prior CI results predate this alignment branch.
- Review every active document, configuration, manifest, workflow, test, and script for stale conflicting instructions.
- Verify the live Mainnet Master address, code hash, owner, getters, mintability, and compatibility with the five-stage source.
- Independently derive and reconcile the Founder Jetton-wallet address and all destination Jetton wallets.
- Verify source wallet ownership/control and actual balances before any receipt operation.
- Complete fee/reserve and bounce/recovery review for the exact live deployment configuration.

**Mainnet remains HOLD / NO-GO.** `deployment_authorized=false`, `mainnet_authorized=false`. No deployment, mint, transfer, signing payload, or transaction was created or broadcast by this action. Each of the five Mainnet receipt stages still requires a separate explicit Founder announcement and wallet signature after all applicable release gates pass.
