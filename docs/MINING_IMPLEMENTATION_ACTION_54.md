# V COIN–TON — Wallet-Backed Mining Implementation

**Action:** #54  
**Status:** IN PROGRESS — implementation branch created; public extraction remains fail-closed  
**Repository:** `vahidnemati3544-opsking/v-coin-TON`  
**Base commit:** `53039de8263b6e5b76ff2c0f3afb636e96c215d3`  
**Branch:** `feature/wallet-backed-mining-action-54`

## 1. Owner-provided deployment evidence

The owner supplied a Tonviewer transaction record with:
- Transaction: `d2ca5bf44e7786d085c684ecb6deba9e38bdcdee589dc91214861d44ec9e2d1d`
- Reported status: `Confirmed transaction`
- Reported action: `Contract deploy`
- Reported interface: `jetton_master`
- Master address: `EQBn4hW8bKhFTSz9riY5q3Pr3SfJmv2VYKZQl_NWMbK--5fP`
- Sender: Founder wallet `UQAdW09EvIesUXt9jzLq1T32O0351TaczwWJQLGGmw4aWrzy`
- Attached value: `1 GRAM`

This is recorded as owner-provided explorer evidence. It does not, by itself, prove current master getter values, decimals, actual supply, or the state of the mint authority. Those values must be read from the exact deployed master before any live mining configuration is enabled.

## 2. Binding mining policy

- Network: TON Mainnet only, unless the owner separately changes this decision.
- VCOIN master: the exact address above; never substitute a predicted or prior preview address.
- Precision: 6 decimals.
- Reward: exactly 1% per 24 hours, same rate for levels 1–400.
- Formula: `floor(verified_wallet_snapshot_base_units * elapsed_ms / 8640000000)`.
- Mining allocation cap: 1,050,000,000 VCOIN (1,050,000,000,000,000 base units).
- The source of eligibility is a fresh, verified, finalized VCOIN Jetton balance in the linked user wallet.
- PostgreSQL balances and pending rewards are accounting projections only; they are not wallet holdings.
- Do not count pending or unconfirmed internal rewards as wallet balance.
- No seed phrase, private key, wallet PIN, or signing secret may be requested or stored.

## 3. Repository findings at the base commit

1. `contracts/mining/engine.js` still reads `balances.available_base_units` and settles rewards into an internal PostgreSQL balance.
2. `contracts/mining/backend/src/server.js` deliberately returns HTTP 503 with `WALLET_BALANCE_MINING_NOT_IMPLEMENTED` for public mining routes.
3. `contracts/mining/backend/src/routes/mining.js` is an internal-balance router and must not be mounted publicly.
4. Migration 008 provides wallet snapshot and offline lease persistence structures, but does not implement a trusted chain reader, TON wallet proof verification, lease issuance, or reconciliation.
5. The client shell is not yet a complete wallet-linked mining application.
6. No production TON provider credential, verified TON Connect proof flow, or Founder-controlled payout signer is configured in the repository.

## 4. Implementation sequence

| No. | Component | Required outcome | Status |
|---:|---|---|---|
| 1 | TON Connect proof | Single-use server challenge; verify wallet signature, domain, address derivation, timestamp and network; bind wallet to Telegram user | PENDING |
| 2 | Master configuration | Explicit allowlist for the deployed VCOIN master and Mainnet; reject any other master/network | PENDING |
| 3 | Chain reader | Derive Jetton wallet using master `get_wallet_address`; call Jetton wallet `get_wallet_data`; validate owner, master, active state, finality and freshness | PENDING |
| 4 | Immutable snapshots | Persist balance, owner, master, network, block context, provider and payload hash | SCHEMA PRESENT; SERVICE PENDING |
| 5 | Wallet-backed mining engine | Accrue only from immutable verified wallet snapshots; no internal-balance fallback | PENDING |
| 6 | Pending reward ledger | Keep internal pending rewards distinct from on-chain wallet holdings | PENDING |
| 7 | Payout state machine | Founder-controlled Jetton payout, idempotency, transaction tracking, bounce/finality reconciliation | PENDING |
| 8 | Public API gate | Keep HTTP 503 until components 1–7 and required tests pass | ACTIVE SAFETY GATE |
| 9 | Verification | Unit, PostgreSQL integration, replay, concurrency, wrong-master, stale-provider, bounce and reconciliation tests | PENDING |
| 10 | Release package | Build from exact reviewed Git commit; include checksums, CI evidence and source manifest | PENDING |

## 5. Technical requirements

### Wallet proof
Use TON Connect `ton_proof` with a random, single-use, expiring server payload. Verify the signed message according to TON Connect rules, including domain byte length, timestamp, connected address derived from wallet state init, public key selection and network. A Telegram identity or pasted wallet address is not proof of wallet control.

### Jetton balance
The reader must:
1. Call the configured Master’s `get_wallet_address(owner)`.
2. Query `get_wallet_data()` on the derived Jetton wallet.
3. Require the returned owner to equal the linked user wallet.
4. Require the returned Jetton master to equal the configured deployed VCOIN master.
5. Validate Mainnet, six decimals, active account state, provider response and freshness/finality.
6. Fail closed on timeout, stale data, provider disagreement or any mismatch.

### Reward and payout
A reward is calculated from one immutable wallet snapshot. It is not considered wallet-held VCOIN until a payout transaction is confirmed and a later verified snapshot reflects the received tokens. Reserve consumption, ledger posting, payout state and chain reconciliation must be idempotent and auditable.

## 6. Safety and release gates

- Do not remove the current HTTP 503 gate merely to make the UI appear active.
- Do not use the legacy internal-balance engine for public extraction.
- Do not issue tokens or send a Mainnet transaction during implementation or automated tests.
- Do not deploy a new Master contract; the supplied deployed address is the target to inspect.
- Any payout signing must remain in a Founder-controlled wallet flow; backend must not receive the Founder’s seed phrase or private key.
- Public mining can be enabled only after the wallet proof, chain reader, snapshot engine, ledger/payout lifecycle and tests are complete and the owner explicitly approves the release.

## 7. Reference protocol

TON Connect proof: https://docs.ton.org/applications/ton-connect/how-to/ton-proof  
Jetton wallet data: https://docs.ton.org/contracts/standard/tokens/jettons/wallet-data  
Jetton payment validation: https://docs.ton.org/applications/payments/jettons
