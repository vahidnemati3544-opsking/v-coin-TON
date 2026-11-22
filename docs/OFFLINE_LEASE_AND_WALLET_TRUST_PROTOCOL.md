# V COIN–TON — Offline Lease, Wallet Trust and Client Protocol

**Action:** #50  
**Status:** Protocol and additive persistence foundation; production issuance and reward reconciliation remain disabled.

## 1. Non-negotiable trust boundaries

1. The TON Jetton wallet balance is the eligibility source for mining. PostgreSQL balances are an internal accounting projection, not proof of tokens held in a user's wallet.
2. A balance observation is eligible only when a trusted chain adapter verifies the configured VCOIN Jetton master, wallet owner, derived Jetton wallet address, network, finality and freshness.
3. A lease authorizes only a bounded provisional offline interval. It does not transfer tokens, mint tokens, confirm a reward or guarantee that all locally recorded time will be accepted.
4. Client clocks, client reward amounts, local hashes, browser identifiers and Telegram identity alone are not trusted evidence of elapsed mining.
5. Only server reconciliation may convert provisional activity into a confirmed internal reward. A later on-chain payout is a separate Founder-approved transaction flow.
6. No seed phrase, private key, wallet PIN or signing secret is collected by V COIN.

## 2. Signed lease contract

The server issues a lease only while online after all checks pass: active authenticated account; wallet ownership proof through a reviewed TON Connect/wallet-signature flow; verified wallet linked to the account; fresh finalized VCOIN Jetton snapshot matching approved network, master, owner and derived Jetton wallet; registered non-revoked device Ed25519 public key; no overlapping active lease or unresolved risk; and available mining reserve.

The canonical signed payload contains lease ID, user ID, wallet ID, device-key fingerprint, network, Jetton master, balance snapshot ID, eligible balance, policy version, key ID, issue/expiry times, maximum duration, maximum provisional reward and a cryptographically random nonce.

The payload is deterministic UTF-8 JSON signed with Ed25519. The private signing key stays in a managed server secret store or HSM. The client receives only payload, signature and public key/key ID. Rotation retains old public keys until all leases they signed have expired plus the audit-retention period. Missing key, unknown key ID, invalid signature or expired lease fails closed.

## 3. Offline events and reconciliation

Each event contains a random UUID, lease ID, strictly increasing sequence number, event type, app/rules version, payload hash and previous-event hash. The client hash chain is tamper-evident, not proof against a hostile device.

On reconnect, the client submits a batch with an idempotency key. The server authenticates the account and verifies lease signature, account/device binding, policy, expiry and revocation; validates event UUID uniqueness, lease/sequence uniqueness, hash chain, order, event types and bounded duration; ignores client-provided reward amounts and client wall-clock duration as authoritative inputs; calculates accepted duration/reward under server policy and lease caps; enforces user/device/global reserve and no-overlap rules; and records the decision with ledger posting in the same transaction as reserve consumption.

Retries after a timeout return the original batch result. Duplicate events, conflicting payloads, missing sequence, clock anomaly, changed device key, expired/revoked lease, stale snapshot or policy mismatch are rejected or quarantined; they never cause a second credit.

## 4. Balance and accounting model

Keep these concepts separate:
- **On-chain wallet balance:** verified Jetton amount observed at a finalized chain position.
- **Eligible balance snapshot:** immutable observation with chain seqno, source, master, owner and freshness.
- **Provisional offline reward:** local-only state; not spendable, transferable or counted toward level upgrades.
- **Accepted internal reward:** server-reconciled ledger credit against the 1,050,000,000 VCOIN mining allocation. It is not an on-chain transfer.
- **On-chain paid reward:** confirmed only after a Founder-approved payout transaction is observed and finalized on TON.

Purchased tokens count for mining eligibility only after a fresh verified wallet snapshot. Internal provisional or accepted rewards do not count as wallet-held tokens until a real Jetton transfer is confirmed and included in a later finalized snapshot. Never accrue mining recursively on an untransferred internal reward.

## 5. Installable client and offline storage

The installable PWA is a delivery shell, not an authority. It uses HTTPS, a versioned service worker, a static asset cache, IndexedDB for append-only event records, and explicit states: READY, LEASE_REQUIRED, MINING_PROVISIONAL, QUEUED_FOR_SYNC, SYNCING, ACCEPTED, REJECTED and REVIEW_REQUIRED. It must show provisional and confirmed amounts separately and sync on app resume, reconnect or explicit user action with bounded retry.

Storage quota errors must preserve acknowledged records and show a recoverable error. Diagnostics are user-consented and redact bearer tokens, wallet secrets, private data and authorization headers.

Do not promise continuous mining while a PWA is force-closed. Browser service workers may be stopped and background scheduling is not universally available. Telegram is not an offline transport. The user must have installed/opened the app and obtained a valid lease while online before going offline.

## 6. Diagnostics

A consent-based report may include app build, ruleset, browser/OS family, service-worker state, IndexedDB availability and queue count, last sync category, retry count, lease status and correlation ID. It must not contain seed phrases, private keys, wallet PINs, bearer tokens, bot tokens, signing keys or full sensitive Telegram payloads. Show the redacted report to the user before export or upload.

## 7. Additive database foundation

Migration 008 adds finalized Jetton balance observations, device public-key registrations and revocation, signed lease payloads and lifecycle, idempotent sync batches, unique event IDs and lease sequence numbers, and reconciliation audit records.

The migration stores records only. It does not create a trusted chain reader, verify wallet ownership, issue leases, calculate rewards or enable any API. Those require separate reviewed code and tests.

## 8. Release gates

Do not mount or enable offline mining routes until a reviewed TON wallet ownership proof flow exists; the trusted chain adapter verifies the official Jetton master and finalized balances; lease issuance enforces wallet/device/risk/reserve checks; signature verification, key rotation, revocation and replay tests pass; reconciliation posts atomically to the capped double-entry ledger; PWA install/offline/restart/storage/retry tests pass on supported Android browsers; and independent security review plus explicit production approval are recorded.

Mainnet deployment and payout signing remain separate Founder-controlled actions. This document does not authorize either.
