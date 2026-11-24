# Action #66 — Founder-First Two-Stage Mainnet Receipt Policy

**Date:** 2026-11-24  
**Status:** Documentation and deployment-template policy updated; contract implementation and end-to-end verification pending  
**Scope:** V COIN–TON only; no changes to the legacy BNB project

## Owner instruction

The full fixed supply of 2,100,000,000 VCOIN is to be received by Founder Mainnet wallet `UQBh9jVKAypc4TrbFx2jsVB2EI1ONChg22zDputisQjENQOT` in two separate incoming transfers. The second transfer requires a fresh explicit Founder announcement/authorization. Installment amounts are not yet specified. After receipt, the Founder personally signs the four other allocation distributions: Mining 1,050,000,000; Treasury 210,000,000; Liquidity/Market 210,000,000; Ecosystem/Marketing 210,000,000 VCOIN. The Founder retains 420,000,000 VCOIN.

The former Founder address `UQAdW09EvIesUXt9jzLq1T32O0351TaczwWJQLGGmw4aWrzy` is Testnet-only historical data and must not be used on Mainnet.

## Completed repository updates

- Root `README.md`.
- `docs/README.md` and the controlling owner-instruction document.
- `docs/TON_ARCHITECTURE.md`.
- `docs/TOKENOMICS.md`.
- `docs/WALLET_ALLOCATION_REGISTER.md`.
- `docs/FOUNDER_CONTROL_AND_ALLOCATION.md`.
- `docs/SECURITY_ANTI_FRAUD.md`.
- `docs/API_ARCHITECTURE.md`.
- `docs/PURCHASE_AND_MINING_PAYOUT_POLICY.md`.
- `DEPLOYMENT_ARCHITECTURE.md`.
- `contracts/jetton/allocation/INIT_PARAMETERS.md` now explicitly marks the former five-wallet direct-issuance sequence as superseded.
- `contracts/jetton/allocation/allocation-plan.json` and `contracts/jetton/deployment.config.template.json` now record the Founder-first staged-receipt policy, new Mainnet address, and pending installment amounts.

## Pending engineering work — do not mark complete

1. Inspect and revise VCoinMaster/Jetton issuance logic so it supports the two Founder-first receipts and then four Founder-signed capped distributions.
2. Ensure the 2.1B supply is minted/issued only once and no additional minting is possible.
3. Update constructor/StateInit parameters and any generated deployment previews from the exact revised source.
4. Update backend accounting and reconciliation so receipt stages and four subsequent allocation transfers cannot be double-counted.
5. Add local TON Sandbox tests for stage 1, stage 2 authorization, the four distributions, exact caps, bounce/retry, and total-supply reconciliation.
6. Validate JSON schemas, CI/build workflows, exact source/artifact hashes, and all transaction payloads.
7. Verify Mainnet Jetton Master, wallet control, recipient Jetton wallets, live fees/reserves, and Founder authorization before any signature.

## Safety status

**Mainnet transfer readiness: HOLD / NO-GO.** The repository documentation and templates are not proof of deployed Mainnet state or completed token transfers. Do not send either installment or any allocation transfer until the contract and all release checks above are complete. Never request or share recovery phrases or private keys.
