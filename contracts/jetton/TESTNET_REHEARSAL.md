# V COIN — Isolated TON Testnet rehearsal

**Status:** exact-head GitHub CI build and unsigned Testnet preview validation passed at commit `4643d6c9b27ae24aca69abbb13ba88a9bea69fce`; wallet-compatible fee/emulation and public Testnet execution remain pending.  
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

## Exact-head CI verification — 2026-11-24

At branch head `4643d6c9b27ae24aca69abbb13ba88a9bea69fce`, GitHub Actions completed successfully:

- Jetton verification run `45333518846`: Tact compilation, metadata build, unsigned Testnet rehearsal preview generation, Testnet-only artifact validation, Jest tests, and read-only release-page validation all passed.
- Backend CI run `45333518874`: syntax checks, PostgreSQL schema/migrations, migration idempotency, and backend unit/integration tests passed.
- Mining CI run `45333518857`: syntax/static checks and unit/PostgreSQL integration tests passed.

These CI results verify the exact branch head in GitHub's runner. They do **not** establish a live fee quote, a wallet-generated signed message, public Testnet deployment, on-chain receipt, or Mainnet readiness. Those remain separate gates.

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

**Current gate:** BLOCKED — unsigned TON Connect request previews are now generated, but the wallet-generated signed external message has not been produced, and successful Testnet emulation/fee quote is not yet available.



## TON Connect request preview extension — 2026-11-24

The existing rehearsal script now writes a `ton_connect_request` object for each of the three ordered operations:

1. Deploy Master with `VCoinFund`, StateInit, and 0.75 TON attached (750,000,000 nanoton).
2. Stage 1 mint with 0.01 TON attached (10,000,000 nanoton).
3. Stage 2 mint with 0.01 TON attached (10,000,000 nanoton), marked as requiring a fresh Founder approval and a confirmed Stage 1 receipt.

Each request pins the Testnet global ID `-3`, the registered Testnet Founder sender, and a 10-minute expiry. The request payloads are generated for inspection only. The script contains no wallet connector, signing call, send call, or broadcast call.

**Important:** the attached values above are the configured contract-call values/minima, not measured network fees. A TON Connect request preview is not the wallet-generated signed external message and does not establish a fee quote. The fee/emulation gate remains BLOCKED until a valid trace and fee breakdown are obtained for the actual execution path.

The generated preview file is local build output:
`build/testnet-rehearsal-preview.json`. Do not commit generated BOCs or preview JSON without a separate review.


## Source-level contract review — 2026-11-24

The current Founder-first source was reviewed against the rehearsal configuration and Sandbox tests:

- `VCoinMaster` is initialized with the Founder owner and metadata content; the active implementation is not the legacy five-destination constructor described in older sections of `docs/JETTON_CONTRACT_SPEC.md`.
- The rehearsal configuration fixes Stage 1 at 1,000,000,000 VCOIN and Stage 2 at the exact remaining 1,100,000,000 VCOIN. The Master enforces a positive Stage 1 below the cap and an exact-remainder Stage 2; the rehearsal script pins the owner-approved exact amounts.
- The Master accepts receipt acknowledgements only from the deterministic Founder Jetton Wallet and checks the stage query ID and exact amount. Stage 2 remains blocked until Stage 1 acknowledgement is confirmed.
- Natural bounce handling authenticates the deterministic Founder Jetton Wallet and rolls back only the matching stage. The Sandbox suite includes Stage 1 and Stage 2 bounce scenarios.
- The Master hard cap is 2,100,000,000,000,000 base units (six decimals); the Testnet config and two stage values reconcile exactly.

**Open engineering review items — not cleared by CI:**

1. Review real-network TON value/fee accounting for the Jetton Wallet's acknowledgement and excess-return messages. The current mint path attaches 0.1 TON to the Founder Jetton Wallet; the wallet sends a 0.01 TON acknowledgement and may also return excess to the response destination. The exact combined outbound fee/value trace must be simulated before public deployment.
2. Independently verify TEP-74 transfer/burn interoperability and TEP-64 metadata with a standards-aware external parser or wallet/indexer. Current CI compiles the project and passes its own Sandbox suite; it is not an independent standards certification.
3. Rewrite the legacy `docs/JETTON_CONTRACT_SPEC.md` sections before any release so constructor, allocation, and network instructions match the active branch. A prominent supersession notice has been added, but the full rewrite remains pending.

No code change is made from this source review because fee behavior and the complete external interoperability trace cannot be established from source inspection alone. Keep public Testnet deployment blocked until these items are resolved.
