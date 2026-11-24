# V COIN (VCOIN) — TON Jetton Contract Specification

**Document ID:** VCT-JETTON-SPEC-002  
**Version:** 2.0.0  
**Status:** Current implementation candidate for the 2.1B allocation; exact-head CI for this corrected revision is pending; engineering verification and Mainnet release gates remain pending  
**Network direction:** TON Mainnet only for first live issuance; no Testnet deployment is in the current execution path  
**Token standard target:** TEP-74 Jetton with TEP-64 metadata  
**Repository:** `vahidnemati3544-opsking/v-coin-TON`

> This specification supersedes the earlier draft and its conflicting Testnet / founder-vesting assumptions. It describes the current implementation and approved economic rules. It is not proof of TEP compliance, independent audit, deployment, issuance, or authorization to broadcast a transaction.

> **Branch correction / supersession notice — 2026-11-24:** Sections 2–9 below contain legacy five-destination issuance and constructor assumptions that do **not** match the current `feat/founder-first-two-stage` implementation. For the current Founder-first two-stage design, use `docs/OWNER_ACTION_66_FOUNDER_FIRST_RECEIPT.md`, `contracts/jetton/src/vcoin.tact`, `contracts/jetton/src/jetton.tact`, and `contracts/jetton/testnet.rehearsal.config.json`. The active Testnet rehearsal is separately authorized and documented in `contracts/jetton/TESTNET_REHEARSAL.md`; this file's older statement that no Testnet deployment is in the execution path is superseded for that rehearsal only. Do not use this legacy specification as a deployment or signing instruction. A full specification rewrite remains required before release.

## 1. Approved token parameters

| Parameter | Approved value |
|---|---|
| Name | V COIN |
| Symbol | VCOIN |
| Decimals | 6 |
| Total initial supply | 2,100,000,000 VCOIN |
| Total supply in base units | 2,100,000,000,000,000 |
| Standard | TON Jetton, TEP-74 |
| Metadata | TEP-64 |
| Additional minting | Disabled after all five allocations complete |
| Live network direction | TON Mainnet, subject to all release gates and explicit Founder approval |

All token arithmetic must use integer base units. Floating-point token arithmetic is prohibited.

## 2. Fixed allocation policy

| Role | Share | VCOIN | Base units |
|---|---:|---:|---:|
| Founder | 20% | 420,000,000 | 420,000,000,000,000 |
| Mining reserve | 50% | 1,050,000,000 | 1,050,000,000,000,000 |
| Treasury | 10% | 210,000,000 | 210,000,000,000,000 |
| Liquidity / market | 10% | 210,000,000 | 210,000,000,000,000 |
| Ecosystem / marketing | 10% | 210,000,000 | 210,000,000,000,000 |
| **Total** | **100%** | **2,100,000,000** | **2,100,000,000,000,000** |

The Founder receives the full 420,000,000 VCOIN allocation in one operation. No vesting, time lock, or installment schedule applies to the Founder allocation. The five owner-designated allocation addresses are recorded in `docs/WALLET_ALLOCATION_REGISTER.md`. The Founder wallet is one of the five allocation recipients and also serves as the sole GAS & OPERATIONS wallet; there is no separate fee wallet or sixth address.

## 3. Current Master contract behavior

The current implementation is in `contracts/jetton/src/vcoin.tact` and `contracts/jetton/src/jetton.tact`.

- The Master constructor fixes the five allocation destinations in StateInit.
- The Founder wallet is the sole `VCoinMint` authority.
- Each configured destination can receive only its exact fixed allocation, once.
- The Master rejects unknown destinations, wrong amounts, duplicate issuance, unauthorized senders, and issuance above the fixed supply.
- The Founder wallet, also serving as GAS & OPERATIONS, may fund the Master reserve through `VCoinFund`; it is the sole `VCoinMint` authority.
- The Master sets `mintable=false` after all five allocation credits complete.
- A natural bounce from a deterministic destination Jetton Wallet is authenticated by sender address and exact amount; only the affected role is rolled back and eligible for retry.
- The Jetton Wallet implementation contains owner-authorized transfer and burn paths, validates internal wallet relationships, and restores balances after applicable bounced operations.

These are source-level implementation statements. TEP-74 interoperability and security behavior must be covered by the project's engineering tests before Mainnet. Independent external auditing is not a project release condition.

## 4. Constructor and address controls

The constructor argument order is:

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

Use `contracts/jetton/allocation/INIT_PARAMETERS.md` and `docs/WALLET_ALLOCATION_REGISTER.md` as the canonical mapping. The five allocation owner addresses must be pairwise distinct, correctly represented for TON Mainnet, and verified before any transaction. `gasOperatorWallet` must equal the Founder/owner address exactly; it is not a sixth wallet. The owner addresses are not the derived Jetton Wallet contract addresses. Derive each holder Jetton Wallet from the deployed Master and verify it before issuance.

Recording an address does not prove wallet control. Use a safe signed wallet-control proof or equivalent verification; never request or store a seed phrase, private key, PIN, or recovery code.

## 5. Metadata

The Master stores a TEP-64 content cell. The current build generates the metadata content cell from `contracts/jetton/metadata.json` and the immutable commit-pinned raw GitHub URI recorded in `deployment.config.template.json`. Metadata includes the canonical Founder-approved V COIN logo through the public GitHub Pages JPEG URL. The original image bytes are preserved, and the repository asset uses the correct `.jpg` extension. The exact-head CI preview records the metadata URI and content-cell hash; verify both before signing.

Do not deploy with empty or placeholder metadata. Verify the resulting metadata through the deployed Master getter and an independent TEP-64 parser.

## 6. Supply and allocation invariants

1. The five allocations sum exactly to 2,100,000,000,000,000 base units.
2. Only the Founder wallet can request allocation issuance.
3. Each configured role can be credited only its exact allocation.
4. No arbitrary receiver or amount is accepted.
5. A bounced allocation must roll back only the affected role and must not leave total supply inconsistent with credited balances.
6. Once all five roles complete, `mintable=false` and every later mint request must fail.
7. Burning may reduce supply; burned VCOIN is not replenished or reissued.
8. Backend/database balances are not proof of on-chain ownership or issuance.

## 7. Required verification evidence

A previously recorded CI run passed lockfile generation, dependency audit, Tact compilation, and Jest Sandbox tests, but it predates the current 2.1B allocation correction and is historical evidence only. A new exact-head CI run must verify the current source, allocation plan, deployment preview, and Sandbox tests. The current verification status is tracked in `contracts/jetton/VERIFICATION_STATUS.md`.

This CI pass does not establish Mainnet readiness. Remaining engineering evidence includes:
- Commit the generated lockfile to `main` and rerun CI on the resulting exact head.
- Complete engineering tests for TEP-74 / TEP-64 behavior, wallet transfers, burns, bounce handling, and message validation.
- Rebuild independently and reproduce TON code-cell hashes, StateInit hashes, and deterministic addresses. A SHA-256 checksum of a BOC file is not a TON cell hash.
- Complete metadata package/content-cell review.
- Verify control of the five allocation destinations on TON Mainnet. The Founder allocation wallet is also the sole GAS & OPERATIONS wallet.
- Produce a signed release manifest tying source commit, toolchain, lockfile, BOCs, cell hashes, StateInit hashes, metadata, network, and review approvals together.

## 8. Mainnet release and signing boundary

The deployment template must remain fail-closed: `deployment_authorized=false` and `mainnet_authorized=false` until all release gates pass and the Founder explicitly approves the exact transaction.

Before any Founder signature, present:
- TON Mainnet and the exact signing wallet.
- Exact Master StateInit / deployment details and resulting address derivation.
- All constructor arguments and the five destination roles.
- Metadata URI/content hash.
- Exact attached TON values, fee estimate, reserve funding, and simulation results.
- Exact VCOIN amount and base units for each issuance request.
- Expected state changes and post-transaction balance/getter checks.
- Source commit, toolchain, lockfile, BOC checksums, TON cell / StateInit hashes, and engineering verification status.
- Clear explanation of irreversibility and residual risks.

Deployment, gas-reserve funding, and each of the five initial Founder receipt stages followed by four Founder-signed allocation transfers are separate on-chain operations. Do not sign or broadcast any of them until the corresponding complete transaction review has been presented and the Founder has explicitly approved it. Never send Mainnet transactions from CI.

## 9. Current disposition

**Mainnet release status: NO-GO / NOT DEPLOYED.**

- Contract source and Sandbox tests: present.
- Exact-head CI for the current five-stage 2.1B allocation revision: pending.
- `package-lock.json`: committed to `main`; clean `npm ci` must be verified again on the current exact head.
- Metadata JSON, immutable commit-pinned URI, content cell, and canonical logo URL: generated and verified in exact-head CI; external TEP-64 parser review remains a release gate.
- Engineering verification against TON standards: pending where not yet evidenced.
- Independent TON cell and StateInit hash reproduction: pending.
- Mainnet wallet-control proofs: pending.
- Mainnet Master address and deployment transaction: none.
- VCOIN issuance or transfers: none.
- Mainnet authorization: false.

Unsigned Testnet-only rehearsal previews may be generated for inspection; no Testnet signing or broadcast is implied. This specification does not authorize Mainnet deployment, issuance, or transfer.


## 10. Purchase and mining distribution policy (owner-approved)

### TON-to-VCOIN purchase

A purchase is a transfer of existing VCOIN, not a mint operation. After the TON payment is verified as final and attributable to the purchase, the corresponding VCOIN amount is transferred from the Founder allocation Jetton wallet to the buyer's verified TON Jetton wallet. The TON consideration is directed to the Founder allocation wallet. The backend must bind payment and delivery using a unique order/idempotency key, verify exact amounts and recipient addresses, and reconcile both legs. A failed or bounced VCOIN delivery must remain unresolved/refundable or retryable under an explicit reviewed policy; it must never be recorded as completed delivery.

### Level-qualifying balance

For level calculation, the user's eligible purchased VCOIN and eligible mining rewards are added together. Their source classifications remain separate in the ledger and user balance history. The backend must prevent pending, reversed, rejected, or already-paid mining rewards from being counted twice. Level upgrade costs and the resulting level update must be atomic.

### Final mining payout

The mining allocation is capped at 1,050,000,000 VCOIN (1,050,000,000,000,000 base units). During mining, eligible rewards remain internal accounting claims and are not described as on-chain holdings. Only after the Founder formally declares mining complete and a full reserve/user reconciliation passes may the backend prepare on-chain payouts from the designated mining-reserve Jetton wallet to each user's verified Jetton wallet. A payout becomes paid only after the TON transaction is verified final and successful. Idempotency, replay protection, bounce handling, reserve exhaustion controls, and audit logs are mandatory. No additional minting is permitted.
