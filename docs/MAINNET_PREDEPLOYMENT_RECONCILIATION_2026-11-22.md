> **Controlling update — 2026-11-24 / Owner Action #82:** The current approved initial receipt is five sequential, separately Founder-authorized transfers to Mainnet Founder wallet UQBh9jVKAypc4TrbFx2jsVB2EI1ONChg22zDputisQjENQOT: 420,000,000; 1,050,000,000; 210,000,000; 210,000,000; 210,000,000 VCOIN. Each stage requires a fresh Founder announcement/signature and confirmation of the prior credit. After all five receipts, the Founder personally signs four allocation transfers and retains 420,000,000 VCOIN. Any older one-step, two-step, or direct-five-wallet issuance description below is historical only and is not an executable instruction. No Testnet deployment/transaction, Mainnet deployment, mint, or transfer is authorized by this documentation update.

Current policy correction (2026-11-23): This historical predeployment reconciliation is superseded wherever it lists an independent third-party smart-contract/TEP audit as outstanding or release-blocking. Such an audit is not an active V COIN–TON task or release condition. Mainnet-only execution applies; no Testnet deployment or transaction is authorized. Other engineering and Founder-approval gates remain subject to current evidence and are not automatically complete.

# V COIN–TON Mainnet Pre-deployment Reconciliation

> **Current correction (2026-11-22; supersedes stale gate statements below):** The approved policy is Mainnet-only; no Testnet deployment or transaction is authorized. Founder is also the sole GAS & OPERATIONS wallet (not a sixth address). The Master source contains the Founder-only `VCoinWithdraw` message, protected by a 0.25 TON reserve and 0.10 TON fee buffer. GitHub Pages deployment later succeeded in Actions run `45062813801`; the hosted issuer URL is `https://vahidnemati3544-opsking.github.io/v-coin-TON/`. This historical Action #45 reconciliation remains evidence for its stated older artifact only; use the current Action #52/#53 records for present release status.

**Action:** 45  
**Date:** 2026-11-22  
**Scope:** Reconciliation of source/build provenance, TON hashes and deterministic addresses, and the five allocation destinations for the selected 2.1B VCOIN Mainnet release candidate.  
**Disposition:** Technical reconciliation passed for the three requested checks. Mainnet release remains **NO-GO** pending the separate release gates below. No transaction was signed or broadcast.

## 1. Source-to-build reconciliation — PASS

- Selected local package: `vcoin-mainnet-build.zip`.
- Canonical exact-head CI artifact: workflow run #179, run ID `44999283338`, artifact ID `14745610338`.
- CI head: `d542c7281e317aca040a3b83bb8f249af6cb0e26`.
- The `build-and-test` job completed successfully. It performed clean dependency installation, strict dependency audit, Tact compilation, TEP-64 content-cell generation, unsigned Mainnet preview generation, Jest tests, issuer syntax/sequence checks, and artifact upload. The separate `deploy-issuer` job failed only because GitHub Pages administration permission was unavailable; this did not fail contract compilation or tests.
- The selected ZIP and run #179 artifact contain the same file paths and byte-identical contents for every file except `build/mainnet-deployment-preview.json`. That JSON differs only in `source_commit`: selected ZIP says `43c3cd8a249bddd5978d119c3ff86ed9d4d4cf94`; exact-head CI artifact says `d542c7281e317aca040a3b83bb8f249af6cb0e26`. All other preview fields are identical.
- Commit comparison from `43c3cd8a249bddd5978d119c3ff86ed9d4d4cf94` to current repository HEAD `d64b46baae04a0e0f15dca6da07cad54e3576151` shows subsequent changes are in backend/database and documentation files; no Jetton contract source, compiler configuration, or Jetton deployment configuration file changed. The selected BOCs are therefore byte-identical to the successful exact-head CI BOCs.
- For strict provenance, use the exact run #179 artifact as the canonical release archive, not a manually re-labelled ZIP.

## 2. BOC/hash and address reconciliation — PASS

The exact Master and five allocation-wallet BOC files in CI run #179 were compared byte-for-byte with the exact-head artifact from run #173 (artifact ID `14744952085`). All are identical. The run #173 clean-room hash record independently reproduced the TON cell hashes, StateInit hashes, friendly-address account hashes, and CRC16-XMODEM checksums. Because the BOC bytes are identical, those independently reproduced results apply to the run #179 artifacts.

- Master address (predicted, not deployed): `EQBmjwr-Bc2_wNKcZHjTr8KtPGQgN-ltRhTIXqK0zM89O0Xt`
- Master StateInit hash: `668f0afe05cdbfc0d29c6478d3afc2ad3c642037e96d4614c85ea2b4cccf3d3b`
- Master code cell hash: `383823efc716ed7aab1efe58536aca94f476d6a42d0e6a3041ef56c1f598f846`
- Jetton Wallet code cell hash: `786a569e6ba80af26a148a1634a18b1f1959a590682aba5f0ca855b7a38332ea`
- Metadata content cell hash: `6dc0e0c3a9ec89e72fc8402a13915bb425032a0e57dfa955ba5579eab28c940c`

Five predicted Jetton Wallet addresses and StateInit hashes:

| Allocation | Predicted Jetton Wallet | StateInit hash |
|---|---|---|
| Founder | `EQAR0RVzOcPf8ILtICUucwNplBPsgq2VrQkpqe418leHvyaI` | `11d1157339c3dff082ed20252e7303699413ec82ad95ad0929a9ee35f25787bf` |
| Mining reserve | `EQARsFwLXMkI6xPnA6KDF38svc8u_TIDJ8t4fcR7HpLwvhE4` | `11b05c0b5cc908eb13e703a283177f2cbdcf2efd320327cb787dc47b1e92f0be` |
| Treasury | `EQBVb4YTI5tkWR-AArcz2M7ik6I45tRgjQs8XribDJxQD-7H` | `556f8613239b64591f8002b733d8cee293a238e6d4608d0b3c5eb89b0c9c500f` |
| Liquidity / market | `EQAUXhlV8gxHRhHPKksK7bjkhTnb0d_e5JUL1jzE7Na9L8ol` | `145e1955f20c474611cf2a4b0aedb8e48539dbd1dfdee4950bd63cc4ecd6bd2f` |
| Ecosystem / marketing | `EQDZL9l3y0BlXRretbbFSpBMj-GdNQzvg0PKcRwlr6m6JFO1` | `d92fd977cb40655d1adeb5b6c54a904c8fe19d350cef8343ca711c25afa9ba24` |

These are deterministic predictions only. After deployment, each address must still be confirmed using the active Master `get_wallet_address` getter.

## 3. Five allocation wallets and amounts — PASS

The exact constructor/preview destinations match the owner-designated five-wallet register:

| Allocation | Owner wallet | Amount |
|---|---|---:|
| Founder | `UQAdW09EvIesUXt9jzLq1T32O0351TaczwWJQLGGmw4aWrzy` | 420,000,000 VCOIN |
| Mining reserve | `UQDMEIvklqeBW0Pn74sBHzOpoFGsSWDHE5NxZwfN-1KVsBD0` | 1,050,000,000 VCOIN |
| Treasury | `UQBEW5bLGbq0yVDOimgl6fpZbQkdla9Wk5b0tXyx69bmBktQ` | 210,000,000 VCOIN |
| Liquidity / market | `UQA0_thi3mXZ6jFlHHBfnyjVmXayR3hsGx5PC43_fBOTzXWn` | 210,000,000 VCOIN |
| Ecosystem / marketing | `UQBQDb73DWWMGnxEr37TsqZSKNvVOC9MMwkvRmNY91LJqLsE` | 210,000,000 VCOIN |

Total: 2,100,000,000 VCOIN; decimals: 6; base-unit cap: 2,100,000,000,000,000.

The Founder address is also the sole GAS & OPERATIONS address, as confirmed by the project owner. The selected constructor requires `gasOperatorWallet == owner`; no separate GAS signer or sixth allocation destination is used. The five allocation recipients are distinct.

## 4. Remaining release gates — NOT PASSED

1. TON Testnet deployment and transactions are not authorized under the current Mainnet-only execution policy. Local Sandbox tests are the permitted simulation path; the historical Testnet rehearsal requirement is superseded.
2. Independent third-party smart-contract, TEP-74 and TEP-64 security audit remains outstanding.
3. Live fee simulation and final Master reserve funding review remain outstanding. The Master includes an owner-only `VCoinWithdraw` path to the Founder address, protected by a 0.25 TON minimum reserve and 0.10 TON fee buffer; this is not a live fee quote and the issuer does not expose a withdrawal control.
4. GitHub Pages issuer deployment subsequently succeeded in Actions run `45062813801` on commit `e3f1ed4f0150dc21bb901862b78d4d0fe5473971`; the deployment log confirms the published URL `https://vahidnemati3544-opsking.github.io/v-coin-TON/`. The latest issuer reserve-amount correction is being validated by the newer Actions run.
5. After any deployment, verify Master getters, all five `get_wallet_address` results, total supply and allocation status before any issuance signature.

## 5. Final disposition

Actions 23–25 (source/build reconciliation, BOC/hash/address reconciliation, and five-wallet allocation verification) are **technically completed** against the exact run #179 CI artifacts. The selected ZIP's preview provenance label is the only content difference from the canonical run #179 archive; use the run #179 archive as the canonical artifact.

This reconciliation is not a deployment authorization. Master is not deployed, no VCOIN has been minted or transferred, and no wallet transaction has been signed or broadcast. Mainnet remains **NO-GO** until the remaining release gates are resolved and the Founder separately reviews and signs the exact deployment transaction.
