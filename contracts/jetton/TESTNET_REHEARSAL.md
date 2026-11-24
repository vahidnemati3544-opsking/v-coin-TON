# V COIN — Isolated TON Testnet rehearsal

**Status:** preparation tooling added; build/runtime verification and public Testnet execution remain pending.  
**Scope:** Testnet only. Mainnet remains HOLD / NO-GO.

## Files

- `testnet.rehearsal.config.json` — isolated Testnet configuration.
- `scripts/prepare-testnet-rehearsal.ts` — generates unsigned deployment and two-stage receipt previews.
- `scripts/prepare-mainnet-deployment.ts` — Mainnet-only; never use it for Testnet.

## Safety boundary

- The only permitted owner/signer address in this rehearsal is the historical Founder Testnet wallet:
  `UQAdW09EvIesUXt9jzLq1T32O0351TaczwWJQLGGmw4aWrzy`.
- The rehearsal script hard-checks the Testnet network, `testOnly: true`, the exact registered Testnet wallet, fixed-supply arithmetic, and disabled signing/broadcast flags.
- No Mainnet allocation wallet is loaded. No Mainnet address or payload is generated.
- The script does not connect to a wallet, sign, send, or broadcast any transaction.
- The script generates BOC previews only. The wallet's network indicator, destination, amount, attached TON and live fee must be checked before any separate Founder-approved signature.
- No seed phrase, private key, or PIN is needed by the project tooling.

## Laptop — preparation commands

From the repository root:

```powershell
cd contracts/jetton
npm ci
npm run build
npx tsx scripts/prepare-testnet-rehearsal.ts
```

Expected generated artifacts (local build output; do not commit them unless explicitly reviewed):

- `build/testnet-rehearsal-preview.json`
- `build/VCoinMaster.testnet.state-init.boc`
- `build/VCoinFounderJettonWallet.testnet.state-init.boc`

The preview must identify `network: testnet`, `test_only: true`, the registered Founder Testnet wallet, and both issuance stages:
- Stage 1: 1,000,000,000 VCOIN.
- Stage 2: 1,100,000,000 VCOIN, exact remaining supply.

## Public Testnet sequence — not yet executed

1. Review the generated Master address and StateInit hash. Confirm the Tonkeeper wallet is explicitly on Testnet and matches the registered Testnet Founder address.
2. Check the current network fee and reserve against the exact deploy BOC. The contract requires at least 0.75 TON attached to `VCoinFund`; this is a contract minimum, not a live fee quote.
3. Only after review, Founder may separately sign the Testnet deployment in Tonkeeper. Verify the resulting transaction and active Master on a Testnet explorer.
4. Send Stage 1 only after deployment and reserve checks. Verify finalized Master state and Founder Jetton wallet credit using `get_receipt_status` and wallet balance.
5. Stage 2 is a separate fresh Founder signature, and only after Stage 1 credit is confirmed on-chain. Verify the exact remaining amount and final fixed supply.
6. Record transaction hashes, Master address, Jetton wallet address, getter results, and final balances. Do not send distribution transfers to the Mainnet allocation addresses as part of this rehearsal.

**Stop conditions:** any Mainnet address/network indicator, unexpected signer, amount mismatch, missing Stage 1 acknowledgement, unverified fee/reserve, or unexpected bounce. Do not proceed to Stage 2 after a failed or unconfirmed Stage 1.

## Completion criteria

This action is not complete until the exact branch head builds, the preview script runs successfully, all generated addresses carry Testnet-only formatting, and the public Testnet deployment plus Stage 1/Stage 2 receipts are verified on-chain. Sandbox CI alone does not satisfy public Testnet execution.

## Fee-estimation audit gate — 2026-11-24

A source review of `scripts/prepare-testnet-rehearsal.ts` found that the original preview contained separate StateInit BOCs and contract-body BOCs only. The script has now been extended to emit explicit unsigned TON Connect `sendTransaction` request payload previews for deployment, Stage 1 and Stage 2. These are request payloads for wallet review, **not** signed wallet external messages or proof of an end-to-end emulator trace.

Consequently:

- Do not treat the preview BOCs alone as a live fee-estimation input for the complete Tonkeeper operation.
- Do not treat the contract's `0.75 TON` `VCoinFund` minimum as a network fee quote. It is the contract's required attached value/reserve funding.
- The script now constructs TON Connect request payload previews with explicit `network: -3`, the registered Founder Testnet sender in raw format, a 10-minute `validUntil`, destination, attached nanoton value, StateInit (deployment only), and body payload.
- TON Connect request preview is not the wallet-signed external message. Do not call it a complete signed wallet transaction and do not submit it automatically.
- Run a valid Testnet emulation/fee-estimation path for the actual wallet/contract execution path, inspect the complete trace and all outbound messages, and record the returned fee breakdown and required attached value. If the emulator requires a signed external wallet message, do not bypass that requirement or create a signature for this preparation step; use a documented wallet-compatible simulation method or stop and escalate.
- Reconcile the estimated total against the live Testnet wallet balance and preserve a safety margin. If emulation is unavailable or returns incomplete data, stop.
- No signing, broadcasting, or Mainnet operation is authorized by this audit note.

**Current gate:** BLOCKED — complete wallet transaction payload and successful Testnet emulation/fee quote are not yet available.



## TON Connect request preview extension — 2026-11-24

The existing rehearsal script now writes a `ton_connect_request` object for each of the three ordered operations:

1. Deploy Master with `VCoinFund`, StateInit, and 0.75 TON attached (750,000,000 nanoton).
2. Stage 1 mint with 0.01 TON attached (10,000,000 nanoton).
3. Stage 2 mint with 0.01 TON attached (10,000,000 nanoton), marked as requiring a fresh Founder approval and a confirmed Stage 1 receipt.

Each request pins the Testnet global ID `-3`, the registered Testnet Founder sender, and a 10-minute expiry. The request payloads are generated for inspection only. The script contains no wallet connector, signing call, send call, or broadcast call.

**Important:** the attached values above are the configured contract-call values/minima, not measured network fees. A TON Connect request preview is not the wallet-generated signed external message and does not establish a fee quote. The fee/emulation gate remains BLOCKED until a valid trace and fee breakdown are obtained for the actual execution path.

The generated preview file is local build output:
`build/testnet-rehearsal-preview.json`. Do not commit generated BOCs or preview JSON without a separate review.
