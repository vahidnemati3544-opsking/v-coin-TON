# V COIN – TON Jetton Mainnet Deployment Runbook

**Status:** preparation only — NOT deployed; Mainnet release decision: **HOLD / NO-GO**  
**Standard:** TEP-74 Jetton; TEP-64 metadata  
**Supply:** 10,000,000,000 VCOIN; 6 decimals; 10,000,000,000,000,000 base units  
**Network:** TON Mainnet only. Testnet deployment is excluded by Founder direction.

## 1. Binding governance and token rules

This runbook follows `docs/FOUNDER_AUTHORITY_CHARTER.md` v1.1.0 and supersedes older deployment notes that mention vesting or escrow.

- Founder has sole, exclusive, unrestricted authority over deposits, withdrawals, transfers and movements across all five allocation wallets.
- All five allocations are ordinary, immediately transferable Jetton balances.
- No Founder vesting, cliff, escrow, time lock, withdrawal ceiling, vesting contract, co-signer, backend signer, Telegram signer, or third-party authorization process is permitted.
- Backend and Telegram may display information or prepare unsigned proposals only. They must never hold keys, sign, broadcast, or autonomously execute wallet movements.
- Fixed supply is 10B VCOIN with six decimals. Additional minting is disabled after the five exact category allocations are issued.
- Wallet separation is for accounting and reporting; it must not restrict Founder-authorized transfers.

## 2. Allocation schedule

| Category | Tokens | Base units |
|---|---:|---:|
| Founder | 2,000,000,000 | 2000000000000000 |
| Mining reserve | 5,000,000,000 | 5000000000000000 |
| Treasury | 1,000,000,000 | 1000000000000000 |
| Liquidity / market | 1,000,000,000 | 1000000000000000 |
| Ecosystem / marketing | 1,000,000,000 | 1000000000000000 |
| **Total** | **10,000,000,000** | **10000000000000000** |

## 3. Recorded allocation wallet candidates

These are recorded candidate owner-wallet addresses, not proof of control or authorization to issue tokens. Founder must verify each address on Mainnet using their own wallet interface before any issuance.

| Category | Candidate address |
|---|---|
| Founder | `UQAdW09EvIesUXt9jzLq1T32O0351TaczwWJQLGGmw4aWrzy` |
| Mining reserve | `UQDMEIvklqeBW0Pn74sBHzOpoFGsSWDHE5NxZwfN-1KVsBD0` |
| Treasury | `UQBEW5bLGbq0yVDOimgl6fpZbQkdla9Wk5b0tXyx69bmBktQ` |
| Liquidity / market | `UQA0_thi3mXZ6jFlHHBfnyjVmXayR3hsGx5PC43_fBOTzXWn` |
| Ecosystem / marketing | `UQBQDb73DWWMGnxEr37TsqZSKNvVOC9MMwkvRmNY91LJqLsE` |

The separate TON fee wallet is not a VCOIN allocation wallet. Do not confuse owner wallets with the derived Jetton-wallet contract addresses returned by the deployed master getter.

## 4. Offline deployment artifact preparation

The non-broadcasting generator is `deploy/prepare-mainnet.ts`. From `contracts/jetton`, on the exact reviewed source commit:

```bash
npm ci
npm run prepare:mainnet -- --network mainnet --owner <FOUNDER_MAINNET_ADDRESS> --metadata-uri <APPROVED_IMMUTABLE_HTTPS_TEP64_URI> --source-commit <FULL_40_CHARACTER_COMMIT_SHA>
```

It creates `artifacts/mainnet-predeploy/state-init.boc` and `manifest.json` with the expected master address and source, toolchain, code, data and StateInit hashes. It verifies the supplied source commit matches local Git HEAD.

**Safety boundary:** this is an offline StateInit builder only. It does not connect to TON, prove Mainnet identity, assemble or sign a wallet transaction, hold a private key, or broadcast. The CI smoke test uses a dummy URI and is not a production artifact. See `MAINNET_ARTIFACT_TOOL.md`.

## 5. Required gates before deployment

1. Independent smart-contract security audit of the exact source and generated code; close all critical/high findings.
2. Full TEP-74 / TEP-64 conformance review, including message layouts, getters, wallet derivation, metadata cell, gas/excess, bounce and replay behavior.
3. **Sandbox proof completed on PR head `cf362ef04990aebf928e17ebd380e0aef8b6f96f` (CI #302):** the parameterized integration test forces the derived destination Jetton wallet to fail, observes the bounce return to Master, verifies supply rollback, restores the deterministic wallet StateInit, and retries the exact category cap for all five categories. Independent reproduction/audit and full TEP-74/TEP-64 conformance review remain open.
4. TEP-64 JSON and exact canonical PNG are recorded at immutable commit-pinned URLs in `metadata.json` and the deployment template. CI #365 independently fetched the public metadata and image and verified MIME, PNG signature, dimensions, byte count and SHA-256. Founder approval of the exact metadata/artwork pair remains required before production.
5. Founder verifies control of all five Mainnet allocation wallets and the owner wallet in their own wallet interfaces. Never share seed phrases or private keys.
6. Independently reproduce the production StateInit and all hashes from the exact reviewed commit; verify expected Master address with an independent implementation.
7. Run `npm run verify:mainnet-network` immediately before any separately approved wallet transaction; it reads TON Center ConfigParam 19 and requires global ID `-239`. Independently confirm the active network in the signing wallet. The offline builder's `--network mainnet` flag remains only a label.
8. Prepare a human-readable deployment transaction preview and exact fee estimate. Founder reviews the source/build hashes, owner, metadata, master address, StateInit, network and payload.
9. After deployment, verify the on-chain code/data hashes, owner, metadata, supply getters and derived Jetton wallet addresses.
10. Founder locally reviews and signs every deployment/configuration/issuance transaction. No automated broadcast or delegated signer.

## 6. Issuance sequence after deployment approval

- Founder verifies the deployed master and all five recipient addresses.
- Founder signs the one-time allocation-destination configuration message.
- Founder signs each of the five category issuance messages for the exact fixed amounts.
- After each transaction, independently verify the relevant Jetton-wallet balance, total supply and category state.
- After all five categories, verify exact total supply of 10B and irreversible mint disablement.
- No transaction is authorized by this runbook; each exact transaction requires separate Founder approval.

## 7. Current evidence and decision

- Offline StateInit generator and deterministic CI smoke test: implemented; CI #273 passed on PR head `219abc794b337bc1f719a143d46ea3589cac0cc1`.
- CI smoke test uses `https://example.invalid` solely to test deterministic serialization; no production metadata or StateInit artifact has been approved.
- Five-category natural downstream-bounce Sandbox proof: passed on exact PR head `cf362ef04990aebf928e17ebd380e0aef8b6f96f` in CI #302. This closes the in-repository integration-test gate only; independent reproduction/audit remains pending.
- Production metadata/logo approval, independent clean-room artifact reproduction, independent contract audit, full conformance review, wallet-control proofs, transaction preview and actual Mainnet identity verification remain pending.
- PR #6 remains Draft and unmerged.
- Master address: not deployed. Deployment transaction: none. Initial mint: none. Allocation transfers: none.

**Release decision: NO-GO.** No merge, deployment, mint, transfer, signing, or broadcast is authorized by this document.


## Binding governance addendum — 2026-11-21

This document is governed by [Founder Exclusive Five-Wallet Control](../../docs/FOUNDER_EXCLUSIVE_FIVE_WALLET_CONTROL.md). The Founder alone has absolute, exclusive operational control and signing authority over all five allocation wallets; separation is accounting-only. No third party, employee, backend, Telegram bot, CI process, multisig co-signer, escrow, vesting, time lock, withdrawal ceiling, or automated process may authorize, veto, delay, redirect, sign, or execute movements.

Each TEP-74 Jetton Wallet authorizes transfers through its own `owner` address. Master ownership alone does not grant withdrawal or clawback rights over other wallets. The implementation therefore relies on Founder-exclusive signing control of all five recorded owner addresses, with transactions signed locally by the Founder. No hidden seizure path is permitted. Backend/Telegram may prepare unsigned proposals only. Never expose wallet secrets. Wallet-control evidence is recorded separately and must not be falsely marked complete. This addendum does not authorize any Mainnet transaction.
