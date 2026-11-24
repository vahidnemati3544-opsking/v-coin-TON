# V COIN — TON Testnet rehearsal controls

**Status: unsigned preview only; public Testnet signing/broadcast has not been performed.** The Founder authorized a Testnet-only rehearsal on 2026-11-24. This authorization is not Mainnet authorization.

## Network isolation
- Only the historical Founder Testnet wallet may be used: UQAdW09EvIesUXt9jzLq1T32O0351TaczwWJQLGGmw4aWrzy.
- The Founder Mainnet wallet and all four Mainnet allocation wallets must not be loaded into the Testnet rehearsal.
- TON Connect network global ID is -3. All generated friendly addresses must carry the Testnet-only flag.
- The script creates unsigned wallet request previews only. It does not sign, submit, or broadcast.

## Exact five-stage rehearsal
1. 420,000,000 VCOIN — 420000000000000 base units.
2. 1,050,000,000 VCOIN — 1050000000000000 base units.
3. 210,000,000 VCOIN — 210000000000000 base units.
4. 210,000,000 VCOIN — 210000000000000 base units.
5. 210,000,000 VCOIN — 210000000000000 base units.

Total: 2,100,000,000 VCOIN / 2100000000000000 base units.

Each stage is a separate Founder-authorized request. The next stage may be considered only after the prior stage's deterministic Founder Jetton-wallet credit and Master receipt status are confirmed. A failed or bounced stage must be retried at the same stage; never skip ahead.

## Preview generator
Run from contracts/jetton:
- npm ci
- npm run build
- node scripts/build-metadata-cell.cjs with the pinned metadata URI
- npx tsx scripts/prepare-testnet-rehearsal.ts

The script reads only testnet.rehearsal.config.json, verifies the five fixed stage amounts sum to the fixed supply, and emits:
- build/testnet-rehearsal-preview.json
- build/VCoinMaster.testnet.state-init.boc
- build/VCoinFounderJettonWallet.testnet.state-init.boc

The preview contains five unsigned TON Connect request payloads. These are not signed external messages, proof of fee sufficiency, or evidence of on-chain execution.

## Mandatory gates before any Testnet wallet request
- Exact-head Tact compilation and all Sandbox tests pass.
- Inspect Master and Founder Jetton-wallet StateInit hashes and Testnet-only address flags.
- Obtain a valid emulator trace and transaction fee breakdown for deployment, funding, all five receipt stages, and acknowledgement retry.
- Reconcile attached TON and reserve against the actual Testnet balance.
- Confirm that no Mainnet address, payload, or signer appears in the Testnet preview.
- Obtain separate explicit Founder approval before any wallet signing. Do not ask for or share seed phrases, private keys, PINs, or recovery codes.

## Stop conditions
Stop on any network mismatch, unexpected signer, wrong stage amount, wrong stage order, missing acknowledgement, bounce, insufficient reserve, or fee discrepancy. Never proceed to the next stage after an unconfirmed prior stage.

A successful Sandbox run or unsigned preview is not public Testnet proof. No public Testnet deployment, receipt, or distribution is claimed complete here.
