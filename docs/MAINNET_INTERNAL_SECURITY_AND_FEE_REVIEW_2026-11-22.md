# V COIN–TON Internal Security and Mainnet Fee Review

Date: 2026-11-22
Release candidate: CI run #179, head `d542c7281e317aca040a3b83bb8f249af6cb0e26`
Master predicted address: `EQBmjwr-Bc2_wNKcZHjTr8KtPGQgN-ltRhTIXqK0zM89O0Xt`
Scope: internal source-level review of the compiled FunC output, CI evidence, and fixed TON amounts in the unsigned deployment preview.

## Verification completed

- CI run #179 build-and-test job: success. Recorded steps include clean lockfile install, dependency audit enforcement, Tact compilation, immutable TEP-64 metadata cell, unsigned Mainnet preview generation, Jest tests, and TonConnect issuer syntax/sequence checks.
- npm audit report in the release artifact: 0 info, 0 low, 0 moderate, 0 high, 0 critical advisories; 400 dependencies in report metadata.
- Constructor checks five distinct allocation wallets; requires gas operator to equal founder/owner; confirms the four non-founder allocation wallets are distinct from owner and each other.
- Mint authorization is owner-only; amounts are fixed per approved allocation; each allocation has a one-time flag; total supply is capped at 2,100,000,000,000,000 base units; minting is disabled after all five allocation flags are set.
- Jetton wallet transfer path checks sender ownership and verifies the sender wallet against the deterministic wallet address derived from its code/data. Burn path checks wallet owner and sufficient balance.
- Bounced mint transfer handler restores the relevant allocation flag and subtracts the failed amount from total supply, allowing a failed allocation to be retried.
- VCoinFund checks sender equals gas operator and attached value is at least 0.75 TON.
- VCoinMint checks sender equals owner, attached value is at least 0.01 TON, and master balance is at least 0.15 TON. The mint helper deploys the recipient Jetton Wallet with 0.1 TON.

## Internal review observations / operational risks

1. The Master implements an owner-only `VCoinWithdraw` message. It can send TON only to `self.owner`, requires a positive amount and a request carrying at least 0.01 TON, and protects a 0.25 TON minimum Master reserve plus a 0.10 TON fee buffer. Sandbox tests cover successful Founder withdrawal, non-Founder rejection, zero amount, reserve-floor enforcement and underfunded requests. This is not a live fee quote; the current TonConnect issuer does not expose a withdrawal control.
2. Five issuance messages each attach 0.01 TON (0.05 TON total in attached issuance values), while the Master also sends 0.1 TON to each newly initialized Jetton Wallet (0.5 TON total sourced from Master reserve). These are distinct flows and must not be added together as if all came from the founder wallet. The Master reserve must remain above the 0.15 TON issuance guard and cover execution/forwarding fees.
3. The exact network fee cannot be fixed from the artifact. TON fees depend on live network config, message size, compute, storage, and forwarding. The preview correctly leaves `network_fee_quote_required=true`. The contract accepts a VCoinFund message with at least 0.75 TON, but the current generated unsigned preview requests 1.00 TON to add a reserve margin. The issuer now reads the amount from that exact preview rather than hard-coding 0.75 TON. Each issuance request attaches 0.01 TON; actual wallet debit also includes live network fees. Do not promise an exact final TON debit without simulating the exact BOCs against current Mainnet config.
4. Contract has no emergency pause or owner-transfer path. It does have the guarded Founder-only reserve withdrawal described above. Mistakes in constructor parameters and completed Jetton transfers are not administratively reversible.
5. The metadata URI is pinned to a separate immutable commit hash. Confirm that the raw GitHub URL is publicly retrievable and its content matches the metadata cell before deployment.

## What this review does NOT certify

- This is an internal code review, not an independent third-party security audit or formal verification.
- CI Sandbox/Jest success is not evidence of a live Mainnet deployment or real wallet issuance. Testnet deployment and transactions are not authorized under the current Mainnet-only execution policy.
- No live Mainnet fee simulation has been run against the exact deployment and issuance BOCs at the current block/config.
- No Mainnet transaction has been signed or broadcast. Master remains undeployed; no VCOIN has been minted.

## Mainnet decision

Internal review and CI checks are complete. The release remains **NOT CLEARED FOR MAINNET SIGNING** until:
- no Testnet rehearsal is required or authorized; complete local Sandbox testing and the independent audit instead;
- an independent qualified auditor reviews the exact source and compiled artifact (or the owner explicitly accepts deployment without that assurance);
- exact-B0C Mainnet fee simulation is completed against live configuration and the final wallet balance is confirmed.

Never present internal review as a third-party audit or CI Sandbox as a live Mainnet deployment.
