# V COIN (VCOIN) — TON Jetton Contract Specification

**Document ID:** VCT-JETTON-SPEC-002  
**Version:** 2.0.0  
**Status:** Current implementation candidate; exact-head CI passed; independent audit and Mainnet release gates remain pending  
**Network direction:** TON Mainnet only for first live issuance; no Testnet deployment is in the current execution path  
**Token standard target:** TEP-74 Jetton with TEP-64 metadata  
**Repository:** `vahidnemati3544-opsking/v-coin-TON`

> This specification supersedes the earlier draft and its conflicting Testnet / founder-vesting assumptions. It describes the current implementation and approved economic rules. It is not proof of TEP compliance, independent audit, deployment, issuance, or authorization to broadcast a transaction.

## 1. Approved token parameters

| Parameter | Approved value |
|---|---|
| Name | V COIN |
| Symbol | VCOIN |
| Decimals | 6 |
| Total initial supply | 10,000,000,000 VCOIN |
| Total supply in base units | 10,000,000,000,000,000 |
| Standard | TON Jetton, TEP-74 |
| Metadata | TEP-64 |
| Additional minting | Disabled after all five allocations complete |
| Live network direction | TON Mainnet, subject to all release gates and explicit Founder approval |

All token arithmetic must use integer base units. Floating-point token arithmetic is prohibited.

## 2. Fixed allocation policy

| Role | Share | VCOIN | Base units |
|---|---:|---:|---:|
| Founder | 20% | 2,000,000,000 | 2,000,000,000,000,000 |
| Mining reserve | 50% | 5,000,000,000 | 5,000,000,000,000,000 |
| Treasury | 10% | 1,000,000,000 | 1,000,000,000,000,000 |
| Liquidity / market | 10% | 1,000,000,000 | 1,000,000,000,000,000 |
| Ecosystem / marketing | 10% | 1,000,000,000 | 1,000,000,000,000,000 |
| **Total** | **100%** | **10,000,000,000** | **10,000,000,000,000,000** |

The Founder receives the full 2,000,000,000 VCOIN allocation in one operation. No vesting, time lock, or installment schedule applies to the Founder allocation. The five owner-designated allocation addresses are recorded in `docs/WALLET_ALLOCATION_REGISTER.md`. The separate GAS & OPERATIONS wallet is for TON fees only and is not a VCOIN allocation recipient.

## 3. Current Master contract behavior

The current implementation is in `contracts/jetton/src/vcoin.tact` and `contracts/jetton/src/jetton.tact`.

- The Master constructor fixes the five allocation destinations in StateInit.
- The Founder wallet is the sole `VCoinMint` authority.
- Each configured destination can receive only its exact fixed allocation, once.
- The Master rejects unknown destinations, wrong amounts, duplicate issuance, unauthorized senders, and issuance above the fixed supply.
- A separate GAS & OPERATIONS wallet may fund the Master reserve through `VCoinFund`; it cannot issue VCOIN.
- The Master sets `mintable=false` after all five allocation credits complete.
- A natural bounce from a deterministic destination Jetton Wallet is authenticated by sender address and exact amount; only the affected role is rolled back and eligible for retry.
- The Jetton Wallet implementation contains owner-authorized transfer and burn paths, validates internal wallet relationships, and restores balances after applicable bounced operations.

These are source-level implementation statements. Independent TEP-74 interoperability and security review remains required before Mainnet.

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

Use `contracts/jetton/allocation/INIT_PARAMETERS.md` and `docs/WALLET_ALLOCATION_REGISTER.md` as the canonical mapping. The five owner addresses and the separate fee wallet must be pairwise distinct, correctly represented for TON Mainnet, and verified before any transaction. The owner addresses are not the derived Jetton Wallet contract addresses. Derive each holder Jetton Wallet from the deployed Master and verify it before issuance.

Recording an address does not prove wallet control. Use a safe signed wallet-control proof or equivalent verification; never request or store a seed phrase, private key, PIN, or recovery code.

## 5. Metadata

The Master stores a TEP-64 content cell. The approved name, symbol, six decimals, canonical icon, and metadata URI/content must be assembled into a reviewed metadata package before deployment. Current deployment template metadata URI is intentionally null; metadata packaging, content-cell construction, and immutable URI verification are release blockers. The canonical logo is documented under `contracts/jetton/assets/`.

Do not deploy with empty or placeholder metadata. Verify the resulting metadata through the deployed Master getter and an independent TEP-64 parser.

## 6. Supply and allocation invariants

1. The five allocations sum exactly to 10^16 base units.
2. Only the Founder wallet can request allocation issuance.
3. Each configured role can be credited only its exact allocation.
4. No arbitrary receiver or amount is accepted.
5. A bounced allocation must roll back only the affected role and must not leave total supply inconsistent with credited balances.
6. Once all five roles complete, `mintable=false` and every later mint request must fail.
7. Burning may reduce supply; burned VCOIN is not replenished or reissued.
8. Backend/database balances are not proof of on-chain ownership or issuance.

## 7. Required verification evidence

The latest exact-head CI run on commit `a53ba80f5655b44acdf51420a683f9c3a4a2334e` passed lockfile generation, clean `npm ci`, dependency audit, Tact compilation, and Jest Sandbox tests. The audit report recorded zero vulnerabilities. The workflow artifact and file checksums are recorded in `contracts/jetton/VERIFICATION_STATUS.md`.

This CI pass is not an independent security audit and does not establish Mainnet readiness. Remaining evidence includes:
- Commit the generated lockfile to `main` and rerun CI on the resulting exact head.
- Independently review TEP-74 / TEP-64 behavior, wallet transfers, burns, bounce handling, and message validation.
- Rebuild independently and reproduce TON code-cell hashes, StateInit hashes, and deterministic addresses. A SHA-256 checksum of a BOC file is not a TON cell hash.
- Complete metadata package/content-cell review.
- Verify control of all five allocation destinations and the separate fee wallet on TON Mainnet.
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
- Source commit, toolchain, lockfile, BOC checksums, TON cell / StateInit hashes, and independent audit status.
- Clear explanation of irreversibility and residual risks.

Deployment, gas-reserve funding, and each of the five allocation issuance messages are separate on-chain operations. Do not sign or broadcast any of them until the corresponding complete transaction review has been presented and the Founder has explicitly approved it. Never send Mainnet transactions from CI.

## 9. Current disposition

**Mainnet release status: NO-GO / NOT DEPLOYED.**

- Contract source and Sandbox tests: present.
- Exact-head CI: passed on the recorded commit.
- Generated lockfile: in CI artifact; not yet committed to `main`.
- Metadata package and content cell: pending.
- Independent security / standards review: pending.
- Independent TON cell and StateInit hash reproduction: pending.
- Mainnet wallet-control proofs: pending.
- Mainnet Master address and deployment transaction: none.
- VCOIN issuance or transfers: none.
- Mainnet authorization: false.

No Testnet deployment is included in the current execution path. This specification does not authorize deployment, issuance, or transfer.
